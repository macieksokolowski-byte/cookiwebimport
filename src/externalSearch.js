import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scrapeRecipeFromUrl } from "./scraper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DATA_DIR =
  process.env.DATA_DIR ||
  (fs.existsSync("/data") ? "/data" : path.join(__dirname, "../data"));
export const CUSTOM_RECIPES_FILE = path.join(DATA_DIR, "custom_recipes.json");

// Upewnij się, że katalog data istnieje
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 1. PRZEPISOWNIA.PL (Oficjalna społeczność Vorwerk Thermomix)
 */
export async function searchPrzepisownia(query, page = 1) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const url = `https://www.przepisownia.pl/wyszukaj?search=${encodeURIComponent(cleanQuery)}&page=${page}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (!res.ok) {
      throw new Error(`Serwer Przepisownia.pl zwrócił kod błędu HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    let recipesDict = {};
    $("script").each((_, el) => {
      const text = $(el).html() || "";
      if (text.includes("recipe_name") && text.includes("preparation_time_min")) {
        try {
          recipesDict = JSON.parse(text);
        } catch {}
      }
    });

    const items = [];
    const seenIds = new Set();

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || !href.includes("-przepisy/")) return;

      const parts = href.split("/");
      const idKey = parts[parts.length - 1];
      if (!idKey || seenIds.has(idKey)) return;

      const info = recipesDict[idKey] || {};
      const img =
        $(el).find("img").attr("src") ||
        $(el).find("img").attr("data-src") ||
        $(el).find("img").attr("data-original");

      const rawTitle =
        $(el).find(".core-tile__title, h3, h4, .title").text().trim() ||
        info.recipe_name ||
        $(el).attr("title");

      if (!rawTitle) return;

      const title = rawTitle.replace(/\s+/g, " ").trim();
      seenIds.add(idKey);

      const catText = `${title} ${info.categories || ""} ${info.additional_categories || ""}`.toLowerCase();
      const mealType = detectMealType(catText);
      const isGlutenFree = detectGlutenFree(catText);
      const isVegetarian = detectVegetarian(catText);

      items.push({
        id: `przepisownia-${idKey}`,
        idKey,
        title,
        url: href.startsWith("http") ? href : `https://www.przepisownia.pl${href}`,
        image: img || null,
        prepTime: info.preparation_time_min || 15,
        totalTime: info.total_time_min || 30,
        yield: { value: info.portions || 4, unitText: "portion" },
        difficulty: info.difficulty || "łatwy",
        rating: info.avg_rating || null,
        likesCount: info.total_likes || 0,
        mealType,
        isGlutenFree,
        isVegetarian,
        categoryName: info.categories || "Przepisownia TM",
        tmVersion: info.tm_version || "TM6 / TM5",
        author: info.member || "Społeczność TM",
        source: "przepisownia.pl",
        sourceName: "Przepisownia TM",
        sourceIcon: "🍲",
      });
    });

    return items;
  } catch (err) {
    console.error("[searchPrzepisownia error]:", err.message);
    return [];
  }
}

/**
 * 2. KWESTIA SMAKU (kwestiasmaku.com)
 */
export async function searchKwestiaSmaku(query, page = 1) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const pageParam = page > 1 ? `&page=${page - 1}` : "";
  const url = `https://www.kwestiasmaku.com/szukaj?search_api_views_fulltext=${encodeURIComponent(cleanQuery)}${pageParam}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const items = [];
    const seenUrls = new Set();

    $(".node-przepis").each((_, el) => {
      const titleLink = $(el).find(".field-name-title a");
      let title = titleLink.text().replace(/\s+/g, " ").trim();
      const href = titleLink.attr("href");
      if (!title || !href || seenUrls.has(href)) return;

      const subtitle = $(el).find(".field-name-field-podtytul").text().replace(/\s+/g, " ").trim();
      if (subtitle) {
        title = `${title} (${subtitle})`;
      }

      seenUrls.add(href);

      let img = $(el).find(".field-name-field-zdjecie1 img, .field-name-field-zdjecie img").attr("src");
      if (img && img.startsWith("/")) {
        img = `https://www.kwestiasmaku.com${img}`;
      }

      // Ocena fivestar jeśli dostępna
      let rating = null;
      const ratingSelected = $(el).find("select[name='vote'] option[selected]").attr("value");
      if (ratingSelected && !isNaN(parseInt(ratingSelected, 10))) {
        rating = (parseInt(ratingSelected, 10) / 20).toFixed(1);
      }

      const votesCount = parseInt($(el).find(".fivestar_votes_count").text().trim(), 10) || 0;

      const catText = `${title} ${subtitle}`.toLowerCase();
      const mealType = detectMealType(catText);
      const isGlutenFree = detectGlutenFree(catText);
      const isVegetarian = detectVegetarian(catText);

      const fullUrl = href.startsWith("http") ? href : `https://www.kwestiasmaku.com${href}`;
      const slug = href.replace(/[^a-zA-Z0-9]/g, "-").slice(-25);

      items.push({
        id: `ks-${slug}`,
        title,
        url: fullUrl,
        image: img || null,
        prepTime: 20,
        totalTime: 45,
        yield: { value: 4, unitText: "portion" },
        difficulty: "średni",
        rating: rating || "4.8",
        likesCount: votesCount,
        mealType,
        isGlutenFree,
        isVegetarian,
        categoryName: "Kwestia Smaku",
        tmVersion: "Uniwersalny / TM",
        author: "Kwestia Smaku",
        source: "kwestiasmaku.com",
        sourceName: "Kwestia Smaku",
        sourceIcon: "🍕",
      });
    });

    return items;
  } catch (err) {
    console.error("[searchKwestiaSmaku error]:", err.message);
    return [];
  }
}

/**
 * 3. ANIA GOTUJE (aniagotuje.pl)
 */
export async function searchAniaGotuje(query) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();
  const url = `https://aniagotuje.pl/szukaj?s=${encodeURIComponent(cleanQuery)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const items = [];
    const seenUrls = new Set();

    $("article").each((_, el) => {
      const a = $(el).find("h2 a, .article-title a, a").first();
      const rawTitle = $(el).find("h2, h1, .title").text().trim() || a.text().trim();
      const href = a.attr("href");

      if (!rawTitle || !href || !href.includes("/przepis/") || seenUrls.has(href)) return;

      const title = rawTitle.replace(/\s+/g, " ").trim();
      seenUrls.add(href);

      let img = $(el).find("img").attr("src") || $(el).find("img").attr("data-src");
      if (img && img.startsWith("/")) {
        img = `https://aniagotuje.pl${img}`;
      }

      const catText = `${title}`.toLowerCase();
      const mealType = detectMealType(catText);
      const isGlutenFree = detectGlutenFree(catText);
      const isVegetarian = detectVegetarian(catText);

      const fullUrl = href.startsWith("http") ? href : `https://aniagotuje.pl${href}`;
      const slug = href.replace(/[^a-zA-Z0-9]/g, "-").slice(-25);

      items.push({
        id: `ania-${slug}`,
        title,
        url: fullUrl,
        image: img || null,
        prepTime: 20,
        totalTime: 40,
        yield: { value: 4, unitText: "portion" },
        difficulty: "łatwy",
        rating: "4.9",
        likesCount: 15,
        mealType,
        isGlutenFree,
        isVegetarian,
        categoryName: "Ania Gotuje",
        tmVersion: "Sprawdzony / TM",
        author: "Ania Gotuje",
        source: "aniagotuje.pl",
        sourceName: "Ania Gotuje",
        sourceIcon: "👩‍🍳",
      });
    });

    return items;
  } catch (err) {
    console.error("[searchAniaGotuje error]:", err.message);
    return [];
  }
}

/**
 * Wyszukiwanie równoległe na zaznaczonych portalach
 * @param {string} query
 * @param {string[]} sources - np. ['przepisownia', 'kwestiasmaku', 'aniagotuje']
 * @param {number} page
 */
export async function searchMultiSource(query, sources = ["przepisownia", "kwestiasmaku", "aniagotuje"], page = 1) {
  if (!query || !query.trim()) return [];

  const promises = [];
  const selectedSources = Array.isArray(sources) && sources.length > 0 ? sources : ["przepisownia"];

  if (selectedSources.includes("przepisownia")) {
    promises.push(searchPrzepisownia(query, page));
  }
  if (selectedSources.includes("kwestiasmaku")) {
    promises.push(searchKwestiaSmaku(query, page));
  }
  if (selectedSources.includes("aniagotuje")) {
    promises.push(searchAniaGotuje(query));
  }

  const resultsArrays = await Promise.allSettled(promises);
  const combined = [];

  for (const res of resultsArrays) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      combined.push(...res.value);
    }
  }

  // Deduplikacja po zbliżonym tytule / url
  const finalResults = [];
  const seenTitles = new Set();

  for (const item of combined) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      finalResults.push(item);
    }
  }

  return finalResults;
}

/**
 * Pobiera pełną treść przepisu z dowolnego z obsługiwanych portali
 */
export async function scrapeExternalRecipe(url) {
  if (url.includes("przepisownia.pl")) {
    return await scrapePrzepisowniaRecipe(url);
  }
  return await scrapeRecipeFromUrl(url);
}

/**
 * Pobiera pełną treść przepisu z Przepisownia.pl
 */
export async function scrapePrzepisowniaRecipe(url) {
  if (!url || !url.startsWith("http")) {
    throw new Error("Wymagany poprawny adres URL do przepisu.");
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Nie udało się otworzyć przepisu (HTTP ${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  let title = $("h1.recipe-title, h1").first().text().replace(/\s+/g, " ").trim();
  title = title.replace(/\s*Edytuj\s*$/i, "").trim();

  let image =
    $("meta[property='og:image']").attr("content") ||
    $(".recipe-image img, #recipe-image img, .core-media-viewer img").attr("src");

  if (!image) {
    const mainImg = $("img[src*='recipeimage']").first().attr("src");
    if (mainImg) image = mainImg;
  }

  if (image && image.includes("/main/")) {
    image = image.replace("/main/", "/large/");
  }

  let prepTime = 15;
  let totalTime = 30;
  let portions = 4;

  $(".recipe-details__time, .core-feature, .recipe-info-item, .icon-text, .c-recipe-details__item").each((_, el) => {
    const text = $(el).text().toLowerCase();
    if (text.includes("przygotowani")) {
      const m = text.match(/(\d+)\s*(?:min|h|godz)/);
      if (m) prepTime = parseInt(m[1], 10);
    }
    if (text.includes("całkowity")) {
      const m = text.match(/(\d+)\s*(?:min|h|godz)/);
      if (m) totalTime = parseInt(m[1], 10);
    }
    if (text.includes("porcj")) {
      const m = text.match(/(\d+)/);
      if (m) portions = parseInt(m[1], 10);
    }
  });

  const ingredients = [];
  $("#ingredients li, [itemprop='recipeIngredient'], .recipe-details__ingredients li, .core-feature--ingredients li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text && text.length > 1 && !text.toLowerCase().includes("składniki")) {
      ingredients.push(text);
    }
  });

  const instructions = [];
  const stepLis = $("#preparation-steps li, [itemprop='recipeInstructions'] li, .preparation-steps li, .recipe-details__steps li");
  if (stepLis.length > 0) {
    stepLis.each((_, el) => {
      let step = $(el).text().replace(/\s+/g, " ").trim();
      step = step.replace(/^(?:krok\s*)?\d+[.:]\s*/i, "").trim();
      if (step && step.length > 3) {
        instructions.push(step);
      }
    });
  }

  if (instructions.length === 0) {
    const container = $("#preparation-steps, [itemprop='recipeInstructions'], .preparation-steps");
    const containerHtml = container.html() || "";

    const cleanLines = containerHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, " ");

    const rawSteps = cleanLines
      .split(/\n+/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length > 5 && !s.toLowerCase().includes("przygotowanie"));

    for (let i = 0; i < rawSteps.length; i++) {
      let cur = rawSteps[i];
      if (/^[A-ZĄĆĘŁŃÓŚŹŻ\s]{3,20}:$/i.test(cur) && i + 1 < rawSteps.length) {
        instructions.push(`${cur} ${rawSteps[i + 1]}`);
        i++;
      } else {
        instructions.push(cur);
      }
    }
  }

  const hints =
    $(".recipe-details__hints, #tips, .tips, .recipe-tips").text().replace(/\s+/g, " ").trim() ||
    null;

  const fullText = `${title} ${ingredients.join(" ")}`.toLowerCase();
  const mealType = detectMealType(fullText);
  const isGlutenFree = detectGlutenFree(fullText);
  const isVegetarian = detectVegetarian(fullText);

  return {
    id: `ext-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    image,
    prepTime,
    totalTime,
    yield: { value: portions || 4, unitText: "portion" },
    ingredients,
    instructions,
    hints,
    mealType,
    isGlutenFree,
    isVegetarian,
    sourceUrl: url,
    source: "przepisownia.pl",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Pomocnicze funkcje klasyfikacji
 */
function detectMealType(text) {
  if (text.includes("pizza") || text.includes("chleb") || text.includes("bułk") || text.includes("focaccia")) {
    return "pizza-bread";
  } else if (text.includes("śniadan") || text.includes("owsiank") || text.includes("jaglank") || text.includes("jaj")) {
    return "breakfast";
  } else if (text.includes("zup") || text.includes("krem")) {
    return "soup";
  } else if (text.includes("deser") || text.includes("ciast") || text.includes("tort") || text.includes("babeczk") || text.includes("słodk")) {
    return "dessert";
  } else if (text.includes("kolacj") || text.includes("sałatk") || text.includes("tarta") || text.includes("placusz")) {
    return "supper";
  } else if (text.includes("przekąsk") || text.includes("dip") || text.includes("pasta") || text.includes("hummus")) {
    return "snack";
  }
  return "lunch";
}

function detectGlutenFree(text) {
  return (
    text.includes("bezgluten") ||
    text.includes("bez glutenu") ||
    text.includes("gluten free") ||
    text.includes("mąka kukurydziana") ||
    text.includes("mąka ryżowa")
  );
}

function detectVegetarian(text) {
  return (
    text.includes("wegetarian") ||
    text.includes("wege") ||
    text.includes("bez mięsa") ||
    text.includes("tofu")
  );
}

/**
 * Zapisuje pobrany przepis w lokalnym pliku custom_recipes.json
 */
export function saveCustomRecipe(recipe) {
  try {
    let list = [];
    if (fs.existsSync(CUSTOM_RECIPES_FILE)) {
      const content = fs.readFileSync(CUSTOM_RECIPES_FILE, "utf-8");
      list = JSON.parse(content);
    }

    const existingIndex = list.findIndex(
      (r) => (r.sourceUrl && r.sourceUrl === recipe.sourceUrl) || r.title === recipe.title
    );

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...recipe };
    } else {
      list.push(recipe);
    }

    fs.writeFileSync(CUSTOM_RECIPES_FILE, JSON.stringify(list, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[saveCustomRecipe error]:", err.message);
    return false;
  }
}

export function getSavedCustomRecipes() {
  try {
    if (fs.existsSync(CUSTOM_RECIPES_FILE)) {
      const content = fs.readFileSync(CUSTOM_RECIPES_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[getSavedCustomRecipes error]:", err.message);
  }
  return [];
}

/**
 * Usuwa przepis z lokalnego pliku custom_recipes.json
 */
export function deleteCustomRecipe(idOrUrlOrTitle) {
  try {
    if (!fs.existsSync(CUSTOM_RECIPES_FILE)) return false;
    const content = fs.readFileSync(CUSTOM_RECIPES_FILE, "utf-8");
    let list = JSON.parse(content);
    const initialLen = list.length;
    const target = String(idOrUrlOrTitle).toLowerCase().trim();

    list = list.filter((r) => {
      if (r.id && (r.id === idOrUrlOrTitle || r.id.toLowerCase() === target)) return false;
      if (r.sourceUrl && (r.sourceUrl === idOrUrlOrTitle || r.sourceUrl.toLowerCase() === target)) return false;
      if (r.url && (r.url === idOrUrlOrTitle || r.url.toLowerCase() === target)) return false;
      if (r.title && r.title.toLowerCase().trim() === target) return false;
      return true;
    });

    if (list.length !== initialLen) {
      fs.writeFileSync(CUSTOM_RECIPES_FILE, JSON.stringify(list, null, 2), "utf-8");
      return true;
    }
    return false;
  } catch (err) {
    console.error("[deleteCustomRecipe error]:", err.message);
    return false;
  }
}
