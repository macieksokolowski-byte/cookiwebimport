import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { CookiWebImportClient, CookiputClient } from "./cookidooClient.js";
import { RECIPES as BASE_RECIPES, MEAL_TYPES } from "./recipesData.js";
import { scrapeRecipeFromUrl } from "./scraper.js";
import { parseRawRecipeText } from "./recipeParser.js";
import { generateOfflineCookbookHtml } from "./exportOffline.js";
import {
  searchPrzepisownia,
  searchKwestiaSmaku,
  searchAniaGotuje,
  searchMultiSource,
  scrapeExternalRecipe,
  scrapePrzepisowniaRecipe,
  saveCustomRecipe,
  getSavedCustomRecipes,
  deleteCustomRecipe,
  DATA_DIR,
} from "./externalSearch.js";

dotenv.config();

// Jeśli uruchomione w środowisku Home Assistant, załaduj opcje z /data/options.json lub /data/.env
if (fs.existsSync("/data/options.json")) {
  try {
    const haOptions = JSON.parse(fs.readFileSync("/data/options.json", "utf-8"));
    if (haOptions.email && !process.env.COOKIDOO_EMAIL) process.env.COOKIDOO_EMAIL = haOptions.email;
    if (haOptions.password && !process.env.COOKIDOO_PASSWORD) process.env.COOKIDOO_PASSWORD = haOptions.password;
    if (haOptions.token && !process.env.COOKIDOO_JWT) process.env.COOKIDOO_JWT = haOptions.token;
    if (haOptions.country && !process.env.COOKIDOO_COUNTRY) process.env.COOKIDOO_COUNTRY = haOptions.country;
  } catch (e) {
    console.warn("Nie udało się odczytać /data/options.json:", e.message);
  }
}
if (fs.existsSync(path.join(DATA_DIR, ".env"))) {
  dotenv.config({ path: path.join(DATA_DIR, ".env") });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

let cookidooClient = new CookiWebImportClient({
  email: process.env.COOKIDOO_EMAIL,
  password: process.env.COOKIDOO_PASSWORD,
  token: process.env.COOKIDOO_JWT,
  country: process.env.COOKIDOO_COUNTRY || "pl",
});

/**
 * Zwraca połączoną listę wbudowanych przepisów + przepisów pobranych z sieci i zapisanych w cache
 */
function getAllActiveRecipes() {
  const custom = getSavedCustomRecipes();
  const seenUrls = new Set(BASE_RECIPES.map((r) => r.sourceUrl || r.id));
  const uniqueCustom = custom.filter((r) => !seenUrls.has(r.sourceUrl || r.id));
  return [...BASE_RECIPES, ...uniqueCustom];
}

// ==========================================
// ENDPOINTY API
// ==========================================

app.get("/api/status", async (req, res) => {
  try {
    const conn = await cookidooClient.checkConnection();
    res.json({
      configured: Boolean(cookidooClient.token || (cookidooClient.email && cookidooClient.password)),
      authMethod: cookidooClient.token ? "cookie" : cookidooClient.email ? "credentials" : "none",
      email: cookidooClient.email ? cookidooClient.email.replace(/(.{3}).*@/, "$1***@") : null,
      country: cookidooClient.country,
      ...conn,
    });
  } catch (err) {
    res.json({
      configured: false,
      connected: false,
      error: err.message,
    });
  }
});

app.post("/api/auth/save", async (req, res) => {
  try {
    const { email, password, token, country } = req.body;

    cookidooClient = new CookiWebImportClient({
      email: email || "",
      password: password || "",
      token: token || "",
      country: country || "pl",
    });

    const status = await cookidooClient.checkConnection();

    if (status.connected) {
      let envContent = "";
      if (token) envContent += `COOKIDOO_JWT=${token}\n`;
      if (email) envContent += `COOKIDOO_EMAIL=${email}\n`;
      if (password) envContent += `COOKIDOO_PASSWORD=${password}\n`;
      envContent += `COOKIDOO_COUNTRY=${country || "pl"}\n`;
      envContent += `COOKIDOO_LANGUAGE=${country || "pl"}\n`;
      envContent += `PORT=${PORT}\n`;
      try {
        fs.writeFileSync(path.join(__dirname, "../.env"), envContent, "utf-8");
      } catch (e) {
        console.warn("Nie udało się zapisać .env:", e.message);
      }
      try {
        if (DATA_DIR && DATA_DIR !== path.join(__dirname, "../data")) {
          fs.writeFileSync(path.join(DATA_DIR, ".env"), envContent, "utf-8");
        }
      } catch {}
    }

    res.json({
      success: status.connected,
      ...status,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Zwraca lokalny katalog przepisów (wbudowane + zaimportowane z sieci)
 */
app.get("/api/recipes", (req, res) => {
  const { mealType, category, glutenFree, vegetarian, maxTime, q } = req.query;
  let list = getAllActiveRecipes();

  if (mealType && mealType !== "all") {
    list = list.filter((r) => r.mealType === mealType);
  } else if (category && category !== "all") {
    list = list.filter((r) => r.category === category || r.mealType === category);
  }

  if (glutenFree === "true") {
    list = list.filter((r) => r.isGlutenFree);
  }

  if (vegetarian === "true") {
    list = list.filter((r) => r.isVegetarian);
  }

  if (maxTime) {
    const max = parseInt(maxTime, 10);
    if (!isNaN(max)) {
      list = list.filter((r) => r.totalTime <= max);
    }
  }

  if (q) {
    const query = q.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query)) ||
        (r.ingredients &&
          r.ingredients.some((i) =>
            (typeof i === "string" ? i : i.text).toLowerCase().includes(query)
          ))
    );
  }

  res.json({
    total: list.length,
    recipes: list,
    mealTypes: MEAL_TYPES,
  });
});

app.get("/api/recipes/:id", (req, res) => {
  const list = getAllActiveRecipes();
  const recipe = list.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: "Nie znaleziono przepisu." });
  }
  res.json(recipe);
});

/**
 * DYNAMICZNE WYSZUKIWANIE W SIECI (Multi-Source: Przepisownia.pl, Kwestia Smaku, Ania Gotuje)
 */
app.get("/api/external/search", async (req, res) => {
  try {
    const { q, sources, page } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: "Wpisz frazę wyszukiwania." });
    }

    let sourcesList = ["przepisownia", "kwestiasmaku", "aniagotuje"];
    if (sources) {
      sourcesList = sources
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    const pageNum = parseInt(page, 10) || 1;
    const items = await searchMultiSource(q, sourcesList, pageNum);

    res.json({
      success: true,
      query: q,
      sources: sourcesList,
      page: pageNum,
      total: items.length,
      recipes: items,
    });
  } catch (err) {
    console.error("[/api/external/search error]:", err);
    res.status(500).json({
      success: false,
      error: `Błąd wyszukiwania na serwerach zewnętrznych: ${err.message}`,
    });
  }
});

/**
 * DYNAMICZNY IMPORT Z PRZEPISOWNI, KWESTII SMAKU, ANI GOTUJE LUB INNYCH URL
 * 1. Pobiera pełną treść przepisu (składniki, czasy, kroki TM, zdjęcie)
 * 2. Tworzy przepis w Cookidoo i wysyła zdjęcie do Cloudinary Vorwerk
 * 3. Zapisuje przepis do lokalnej biblioteki (custom_recipes.json)
 */
app.post("/api/external/import", async (req, res) => {
  try {
    const { url, title, recipeData, id } = req.body;
    let fullRecipe = recipeData;
    const targetUrl = url || (recipeData && recipeData.url);

    if ((!fullRecipe || !fullRecipe.instructions || fullRecipe.instructions.length === 0) && targetUrl) {
      fullRecipe = await scrapeExternalRecipe(targetUrl);
    }

    if (!fullRecipe || !fullRecipe.title) {
      return res.status(400).json({ error: "Nie udało się pobrać danych przepisu z podanego źródła." });
    }

    if (!fullRecipe.yield || !fullRecipe.yield.unitText) {
      fullRecipe.yield = { value: Number(fullRecipe.yield?.value) || 4, unitText: "portion" };
    }

    // Wyślij do Cookidoo
    console.log(`[External Import] Rozpoczynam wysyłanie do Cookidoo: "${fullRecipe.title}" (${targetUrl || "custom"})...`);
    const result = await cookidooClient.importRecipe(fullRecipe);

    // Zapisz lokalnie w bazie użytkownika (aby zawsze był dostępny offline i w katalogu)
    saveCustomRecipe(fullRecipe);

    res.json({
      success: true,
      message: `Przepis "${fullRecipe.title}" został pomyślnie zaimportowany do Cookidoo i zapisany w Twojej bibliotece!`,
      result,
      recipe: fullRecipe,
    });
  } catch (err) {
    console.error("[/api/external/import error]:", err);
    res.status(500).json({
      success: false,
      error: err.message || String(err),
    });
  }
});

/**
 * Import pojedynczego przepisu (obsługuje zarówno ID lokalne, jak i obiekty zewnętrzne)
 */
app.post("/api/import/single", async (req, res) => {
  try {
    const { id, customRecipe, url, recipeData } = req.body;
    let targetRecipe = null;

    if (id) {
      const allActive = getAllActiveRecipes();
      targetRecipe = allActive.find((r) => r.id === id);
    } else if (customRecipe) {
      targetRecipe = customRecipe;
    } else if (recipeData) {
      targetRecipe = recipeData;
    }

    // Jeśli to przepis z zewnętrznego serwisu (Kwestia Smaku, Ania Gotuje, Przepisownia):
    const targetUrl = url || (targetRecipe && targetRecipe.url);
    const isExternalId = id && (id.startsWith("ks-") || id.startsWith("ania-") || id.startsWith("przepisownia-") || id.startsWith("ext-"));

    if ((!targetRecipe || !targetRecipe.instructions || targetRecipe.instructions.length === 0) && (targetUrl || isExternalId)) {
      if (targetUrl) {
        targetRecipe = await scrapeExternalRecipe(targetUrl);
        saveCustomRecipe(targetRecipe);
      }
    }

    if (!targetRecipe) {
      return res.status(400).json({ error: "Nie wybrano przepisu do importu." });
    }

    const result = await cookidooClient.importRecipe(targetRecipe);
    saveCustomRecipe(targetRecipe);

    res.json({
      success: true,
      message: `Przepis "${targetRecipe.title}" został pomyślnie zaimportowany do Cookidoo!`,
      result,
    });
  } catch (err) {
    console.error("[/api/import/single error]:", err);
    res.status(500).json({
      success: false,
      error: err.message || String(err),
    });
  }
});

/**
 * Masowy import przepisów zaznaczonych checkboxami
 */
app.post("/api/import/batch", async (req, res) => {
  try {
    const { recipeIds, externalRecipes, category, mealType } = req.body;
    let recipesToImport = [];

    // Jeśli przekazano pełne obiekty zewnętrzne zaznaczone w UI
    if (Array.isArray(externalRecipes) && externalRecipes.length > 0) {
      for (const item of externalRecipes) {
        if (item.instructions && item.instructions.length > 0) {
          recipesToImport.push(item);
        } else if (item.url) {
          try {
            const scraped = await scrapeExternalRecipe(item.url);
            saveCustomRecipe(scraped);
            recipesToImport.push(scraped);
          } catch (e) {
            console.warn(`Pominięto błąd scrapingu: ${item.title}:`, e.message);
          }
        }
      }
    } else if (Array.isArray(recipeIds) && recipeIds.length > 0) {
      const allActive = getAllActiveRecipes();
      recipesToImport = allActive.filter((r) => recipeIds.includes(r.id));
    } else if (mealType && mealType !== "all") {
      recipesToImport = getAllActiveRecipes().filter((r) => r.mealType === mealType);
    } else if (category && category !== "all") {
      recipesToImport = getAllActiveRecipes().filter((r) => r.category === category || r.mealType === category);
    } else {
      recipesToImport = getAllActiveRecipes();
    }

    if (recipesToImport.length === 0) {
      return res.status(400).json({ error: "Brak przepisów do zaimportowania." });
    }

    const results = await cookidooClient.importBatch(recipesToImport);
    const successful = results.filter((r) => r.success).length;

    res.json({
      success: successful > 0,
      total: recipesToImport.length,
      successful,
      failed: recipesToImport.length - successful,
      results,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

function parseIsoDuration(str) {
  if (!str) return 0;
  let minutes = 0;
  const hMatch = str.match(/(\d+)H/);
  const mMatch = str.match(/(\d+)M/);
  if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
  if (mMatch) minutes += parseInt(mMatch[1], 10);
  return minutes;
}

/**
 * Zwraca przepisy utworzone przez użytkownika na koncie Cookidoo
 */
app.get("/api/cookidoo/recipes", async (req, res) => {
  try {
    const rawList = await cookidooClient.listCustomRecipes();
    const recipes = (rawList || []).map((r) => {
      const content = r.recipeContent || {};
      const img = content.image ? content.image.replace("/{transformation}/", "/") : null;
      const title = content.name || r.name || "Bez tytułu";
      const pTime = parseIsoDuration(content.prepTime) || 15;
      const tTime = parseIsoDuration(content.totalTime) || 30;
      const catText = title.toLowerCase();

      return {
        id: r.recipeId,
        recipeId: r.recipeId,
        title,
        description: content.description || "Przepis utworzony na Twoim koncie Cookidoo",
        image: img,
        prepTime: pTime,
        totalTime: tTime,
        yield: content.recipeYield || { value: 4, unitText: "portion" },
        ingredients: (content.recipeIngredient || []).map((i) => (typeof i === "string" ? { text: i } : i)),
        instructions: content.recipeInstructions || [],
        source: "cookidoo",
        sourceName: "Twoje Cookidoo",
        cookidooUrl: `https://cookidoo.pl/created-recipes/pl/${r.recipeId}`,
        tmVersion: (content.tool && content.tool[0]) || "TM6",
        isGlutenFree: catText.includes("bezgluten") || catText.includes("gluten free"),
        isVegetarian: catText.includes("wege") || catText.includes("wegetarian"),
        createdAt: r.createdAt,
        modifiedAt: r.modifiedAt,
      };
    });

    res.json({
      success: true,
      total: recipes.length,
      recipes,
    });
  } catch (err) {
    console.error("[/api/cookidoo/recipes error]:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Usuwa pojedynczy przepis z Cookidoo
 */
app.delete("/api/cookidoo/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Brak ID przepisu do usunięcia." });
    }

    console.log(`[Cookidoo Delete] Usuwanie przepisu: ${id}...`);
    await cookidooClient.deleteRecipe(id);

    // Opcjonalnie usuń też z pliku custom_recipes.json jeśli tam był
    deleteCustomRecipe(id);

    res.json({
      success: true,
      message: `Przepis został trwale usunięty z Cookidoo.`,
      id,
    });
  } catch (err) {
    console.error(`[/api/cookidoo/recipes/${req.params.id} delete error]:`, err);
    res.status(500).json({
      success: false,
      error: err.message || "Błąd usuwania przepisu z Cookidoo.",
    });
  }
});

/**
 * Masowe usuwanie przepisów zaznaczonych checkboxami z Cookidoo
 */
app.post("/api/cookidoo/recipes/delete-batch", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Brak ID przepisów do usunięcia." });
    }

    console.log(`[Cookidoo Batch Delete] Rozpoczynam usuwanie ${ids.length} przepisów...`);
    const results = await cookidooClient.deleteBatch(ids);
    const successful = results.filter((r) => r.success).length;

    // Usuń usunięte z lokalnego pliku jeśli istniały
    results.filter((r) => r.success).forEach((r) => deleteCustomRecipe(r.id));

    res.json({
      success: successful > 0,
      total: ids.length,
      successful,
      failed: ids.length - successful,
      results,
    });
  } catch (err) {
    console.error("[/api/cookidoo/recipes/delete-batch error]:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Błąd masowego usuwania z Cookidoo.",
    });
  }
});

/**
 * Usuwa przepis z lokalnej biblioteki (data/custom_recipes.json)
 */
app.delete("/api/recipes/custom/:id", (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteCustomRecipe(id);
    res.json({
      success: deleted,
      message: deleted ? "Przepis usunięty z biblioteki." : "Nie znaleziono przepisu w bibliotece.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Podaj adres URL przepisu." });
    }
    const recipe = await scrapeRecipeFromUrl(url);
    res.json({
      success: true,
      recipe,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

app.post("/api/parse", (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Wklej tekst przepisu." });
    }
    const parsed = parseRawRecipeText(text);
    res.json({
      success: true,
      recipe: {
        id: `custom-${Date.now()}`,
        ...parsed,
        prepTime: 15,
        totalTime: 30,
        yield: { value: 4, unitText: "portion" },
        tags: ["własny"],
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/api/export/offline", (req, res) => {
  const html = generateOfflineCookbookHtml(getAllActiveRecipes());
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", "inline; filename=\"przepisy-thermomix-offline.html\"");
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🍕 CookiWebImport Server uruchomiony na: http://localhost:${PORT}`);
  console.log(`Gotowy do importu przepisów pizzy i bezglutenowych!`);
  console.log(`Wyszukiwarka zewnętrzna online (Przepisownia.pl 50k+ TM) aktywna`);
  console.log(`=======================================================`);
});
