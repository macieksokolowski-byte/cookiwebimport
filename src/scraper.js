import * as cheerio from "cheerio";

/**
 * Uniwersalny scraper przepisów kulinarnych ze wsparciem dla zdjęć.
 * Wyciąga dane ze strukturalnych metadanych Schema.org (JSON-LD)
 * lub za pomocą dedykowanych selektorów HTML dla popularnych stron (Kwestia Smaku, Ani Gotuje, Chefkoch).
 */
export async function scrapeRecipeFromUrl(url) {
  if (!url || !url.startsWith("http")) {
    throw new Error("Podaj prawidłowy adres URL rozpoczynający się od http:// lub https://");
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!res.ok) {
    throw new Error(`Nie udało się pobrać strony (${res.status} ${res.statusText})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Pobierz zdjęcie og:image jako fallback
  const ogImage = $('meta[property="og:image"]').attr("content");

  // 1. Dedykowane reguły dla Ani Gotuje (aniagotuje.pl / anigotuje.pl)
  if (url.includes("aniagotuje.pl") || url.includes("anigotuje.pl")) {
    const scraped = scrapeAniGotuje($, url);
    if (!scraped.image && ogImage) scraped.image = ogImage;
    return scraped;
  }

  // 2. Dedykowane reguły dla Kwestia Smaku
  if (url.includes("kwestiasmaku.com")) {
    const scraped = scrapeKwestiaSmaku($, url);
    if (!scraped.image && ogImage) scraped.image = ogImage;
    return scraped;
  }

  // 3. Sprawdź czy strona posiada Schema.org JSON-LD Recipe
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const content = $(jsonLdScripts[i]).html();
      const parsed = JSON.parse(content);
      const recipeData = findRecipeInJsonLd(parsed);
      if (recipeData) {
        const norm = normalizeSchemaRecipe(recipeData, url);
        if (!norm.image && ogImage) norm.image = ogImage;
        return norm;
      }
    } catch {
      // Ignoruj błędy parsowania
    }
  }

  // 4. Dedykowane reguły dla Chefkoch.de
  if (url.includes("chefkoch.de")) {
    const scraped = scrapeChefkoch($);
    if (!scraped.image && ogImage) scraped.image = ogImage;
    return scraped;
  }

  // 5. Fallback - ogólne parsowanie nagłówków i list
  const fallback = scrapeGenericFallback($, url);
  if (!fallback.image && ogImage) fallback.image = ogImage;
  return fallback;
}

function findRecipeInJsonLd(obj) {
  if (!obj) return null;
  if (obj["@type"] === "Recipe") return obj;
  if (Array.isArray(obj["@graph"])) {
    return obj["@graph"].find((item) => item["@type"] === "Recipe");
  }
  if (Array.isArray(obj)) {
    return obj.find((item) => item["@type"] === "Recipe");
  }
  return null;
}

function normalizeSchemaRecipe(data, sourceUrl) {
  const title = data.name || "Zaimportowany przepis";
  const rawIngredients = Array.isArray(data.recipeIngredient)
    ? data.recipeIngredient
    : [];

  const rawInstructions = [];
  if (Array.isArray(data.recipeInstructions)) {
    data.recipeInstructions.forEach((step) => {
      if (typeof step === "string") {
        rawInstructions.push(step.trim());
      } else if (step.text) {
        rawInstructions.push(step.text.trim());
      } else if (Array.isArray(step.itemListElement)) {
        step.itemListElement.forEach((subStep) => {
          if (subStep.text) rawInstructions.push(subStep.text.trim());
        });
      }
    });
  } else if (typeof data.recipeInstructions === "string") {
    rawInstructions.push(...data.recipeInstructions.split(/\r?\n/).filter(Boolean));
  }

  let image = null;
  if (typeof data.image === "string") {
    image = data.image;
  } else if (Array.isArray(data.image) && data.image.length > 0) {
    image = typeof data.image[0] === "string" ? data.image[0] : data.image[0]?.url;
  } else if (data.image && typeof data.image === "object") {
    image = data.image.url;
  }

  return {
    id: `custom-${Date.now()}`,
    title,
    description: data.description || "Przepis zaimportowany ze strony www",
    prepTime: parseDurationToMinutes(data.prepTime) || 15,
    totalTime: parseDurationToMinutes(data.totalTime) || 30,
    yield: { value: 4, unitText: "portion" },
    image,
    ingredients: rawIngredients.map((i) => ({ text: String(i).trim() })),
    instructions: rawInstructions,
    hints: `Przepis zaimportowany z: ${sourceUrl}`,
    sourceUrl,
    tags: ["import", "www"],
  };
}

function scrapeChefkoch($) {
  const title = $("h1").first().text().trim() || "Przepis z Chefkoch";
  const ingredients = [];
  $("table.ingredients tr").each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length === 2) {
      const qty = $(tds[0]).text().trim().replace(/\s+/g, " ");
      const name = $(tds[1]).text().trim();
      ingredients.push({ text: `${qty} ${name}`.trim() });
    }
  });

  const instructions = [];
  $("div.ds-box").each((_, el) => {
    const text = $(el).text().trim();
    if (text && !text.includes("Zutaten") && text.length > 20) {
      const parts = text.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
      instructions.push(...parts);
    }
  });

  const image = $("img.bi-recipe-image, .recipe-image img").attr("src");

  return {
    id: `chefkoch-${Date.now()}`,
    title,
    prepTime: 20,
    totalTime: 45,
    yield: { value: 4, unitText: "portion" },
    image,
    ingredients,
    instructions: instructions.length > 0 ? instructions : ["Wykonaj kroki według przepisu."],
    tags: ["chefkoch", "import"],
  };
}

function scrapeKwestiaSmaku($) {
  const title = $("h1.przepis-header, h1.title, h1").first().text().trim();
  const ingredients = [];
  $(".field-name-field-skladniki li, .group-skladniki li, .skladniki-lista li").each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push({ text });
  });

  const instructions = [];
  $(".field-name-field-przygotowanie li, .group-przygotowanie p, .field-name-field-przygotowanie p").each((_, el) => {
    const text = $(el).text().trim();
    if (text) instructions.push(text);
  });

  const image = $(".field-name-field-zdjecie img, .field-name-field-przepis-zdjecie img").attr("src");

  return {
    id: `ks-${Date.now()}`,
    title: title || "Przepis z Kwestia Smaku",
    prepTime: 15,
    totalTime: 40,
    yield: { value: 4, unitText: "portion" },
    image,
    ingredients,
    instructions,
    tags: ["kwestiasmaku", "import"],
  };
}

function scrapeAniGotuje($, sourceUrl) {
  const title = $("h1").first().text().replace(/\s+/g, " ").trim();
  const seenIngs = new Set();
  const ingredients = [];

  $("[itemprop='recipeIngredient'], .recipe-ingredients li, ul.ingredients li, .ingredient").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text && text.length > 1 && !seenIngs.has(text.toLowerCase())) {
      seenIngs.add(text.toLowerCase());
      ingredients.push({ text });
    }
  });

  const instructions = [];
  $("[itemprop='recipeInstructions'] p, .recipe-steps p, ol.steps li, .step-text").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text && text.length > 5 && !instructions.includes(text)) {
      instructions.push(text);
    }
  });

  let image =
    $("[itemprop='image']").attr("src") ||
    $('meta[property="og:image"]').attr("content") ||
    $("article img").first().attr("src");

  return {
    id: `anigotuje-${Date.now()}`,
    title: title || "Przepis z Ani Gotuje",
    prepTime: 20,
    totalTime: 45,
    yield: { value: 4, unitText: "portion" },
    image,
    ingredients,
    instructions: instructions.length > 0 ? instructions : ["Przygotuj potrawę według kroków."],
    sourceUrl,
    tags: ["aniagotuje", "import"],
  };
}

function scrapeGenericFallback($, sourceUrl) {
  const title = $("h1").first().text().trim() || "Nowy Przepis";
  const ingredients = [];
  $("ul li, ol li").each((_, el) => {
    const t = $(el).text().trim();
    if (/^\d+\s*(g|kg|ml|l|łyżk|łyżecz|szklan|szt)/i.test(t)) {
      ingredients.push({ text: t });
    }
  });

  const instructions = [];
  $("p").each((_, el) => {
    const t = $(el).text().trim();
    if (/(min|temp|piek|piecz|wymieszaj|naczyni|gotuj|ciasto)/i.test(t) && t.length > 25) {
      instructions.push(t);
    }
  });

  return {
    id: `imported-${Date.now()}`,
    title,
    prepTime: 15,
    totalTime: 30,
    yield: { value: 4, unitText: "portion" },
    ingredients,
    instructions,
    hints: `Zaimportowano z: ${sourceUrl}`,
    tags: ["import"],
  };
}

function parseDurationToMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== "string") return null;
  const matchHours = durationStr.match(/(\d+)H/);
  const matchMinutes = durationStr.match(/(\d+)M/);
  let total = 0;
  if (matchHours) total += parseInt(matchHours[1], 10) * 60;
  if (matchMinutes) total += parseInt(matchMinutes[1], 10);
  return total > 0 ? total : null;
}
