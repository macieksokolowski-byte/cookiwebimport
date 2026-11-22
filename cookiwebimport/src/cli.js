#!/usr/bin/env node
import { Command } from "commander";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { CookiWebImportClient } from "./cookidooClient.js";
import { RECIPES } from "./recipesData.js";
import { scrapeRecipeFromUrl } from "./scraper.js";
import { generateOfflineCookbookHtml } from "./exportOffline.js";

dotenv.config();

const program = new Command();

program
  .name("cookiwebimport")
  .description("Narzędzie CLI do importu przepisów na pizzę i jedzenie bezglutenowe do Cookidoo")
  .version("1.0.0");

function getClient(options = {}) {
  return new CookiWebImportClient({
    email: options.email || process.env.COOKIDOO_EMAIL,
    password: options.password || process.env.COOKIDOO_PASSWORD,
    token: options.token || process.env.COOKIDOO_JWT,
    country: options.country || process.env.COOKIDOO_COUNTRY || "pl",
  });
}

// Komenda: test połączenia
program
  .command("test")
  .description("Sprawdza połączenie i uprawnienia konta Cookidoo")
  .option("-t, --token <token>", "Ciasteczko _oauth2_proxy")
  .option("-e, --email <email>", "E-mail konta Cookidoo")
  .option("-p, --password <password>", "Hasło konta Cookidoo")
  .action(async (opts) => {
    console.log("🔍 Sprawdzanie połączenia z Cookidoo...");
    const client = getClient(opts);
    const status = await client.checkConnection();
    console.log(JSON.stringify(status, null, 2));
  });

// Komenda: lista lokalnych przepisów
program
  .command("list")
  .description("Wyświetla listę wbudowanych przepisów (Pizza, Bezglutenowe)")
  .option("-c, --category <category>", "Filtruj kategorię: 'pizza' lub 'gluten-free'")
  .action((opts) => {
    let list = RECIPES;
    if (opts.category) {
      list = list.filter((r) => r.category === opts.category);
    }
    console.log(`\n📋 Dostępne przepisy (${list.length}):\n`);
    list.forEach((r, idx) => {
      const icon = r.category === "pizza" ? "🍕" : "🌾";
      console.log(`${idx + 1}. [${r.id}] ${icon} ${r.title} (${r.prepTime}/${r.totalTime} min)`);
    });
    console.log("\nAby zaimportować przepis, wpisz: node src/cli.js import --id <ID_PRZEPISU>\n");
  });

// Komenda: import pojedynczego przepisu
program
  .command("import")
  .description("Importuje wybrany przepis do Twojego konta Cookidoo")
  .requiredOption("--id <recipeId>", "ID przepisu (np. pizza-neapolitanska, pizza-bezglutenowa)")
  .action(async (opts) => {
    const recipe = RECIPES.find((r) => r.id === opts.id);
    if (!recipe) {
      console.error(`❌ Nie znaleziono przepisu o ID: ${opts.id}`);
      process.exit(1);
    }

    console.log(`🚀 Importowanie przepisu: "${recipe.title}"...`);
    const client = getClient();
    try {
      const result = await client.importRecipe(recipe);
      console.log(`✅ Sukces! Przepis został dodany do 'Utworzone przepisy':`);
      console.log(`🔗 Link w Cookidoo: ${result.url}`);
    } catch (err) {
      console.error(`❌ Błąd importu:`, err.message);
      process.exit(1);
    }
  });

// Komenda: masowy import
program
  .command("import-all")
  .description("Importuje masowo wszystkie przepisy lub wybraną kategorię")
  .option("-c, --category <category>", "Kategoria do zaimportowania: 'pizza' lub 'gluten-free' (domyślnie wszystkie)")
  .action(async (opts) => {
    let list = RECIPES;
    if (opts.category) {
      list = list.filter((r) => r.category === opts.category);
    }

    console.log(`🚀 Rozpoczynam masowy import ${list.length} przepisów...`);
    const client = getClient();
    const results = await client.importBatch(list, (p) => {
      console.log(`[${p.current}/${p.total}] Importuję: ${p.recipeTitle}...`);
    });

    const successCount = results.filter((r) => r.success).length;
    console.log(`\n🎉 Zakończono! Zaimportowano pomyślnie: ${successCount}/${list.length}`);
  });

// Komenda: scraper z URL
program
  .command("scrape")
  .description("Pobiera przepis ze strony WWW i opcjonalnie importuje go do Cookidoo")
  .requiredOption("--url <url>", "Adres URL przepisu (np. z Chefkoch, Kwestia Smaku, itp.)")
  .option("--upload", "Czy od razu zaimportować do Cookidoo")
  .action(async (opts) => {
    try {
      console.log(`🌐 Pobieranie przepisu z: ${opts.url}...`);
      const scraped = await scrapeRecipeFromUrl(opts.url);
      console.log(`\n📌 Tytuł: ${scraped.title}`);
      console.log(`🛒 Składniki (${scraped.ingredients.length}):`);
      scraped.ingredients.forEach((i) => console.log(`   - ${typeof i === "string" ? i : i.text}`));
      console.log(`🥣 Kroki (${scraped.instructions.length}):`);
      scraped.instructions.forEach((inst, idx) => console.log(`   ${idx + 1}. ${inst}`));

      if (opts.upload) {
        console.log(`\n🚀 Wysyłanie do Cookidoo...`);
        const client = getClient();
        const res = await client.importRecipe(scraped);
        console.log(`✅ Zaimportowano! ${res.url}`);
      }
    } catch (err) {
      console.error("❌ Błąd:", err.message);
    }
  });

// Komenda: eksport książki kucharskiej offline
program
  .command("export-offline")
  .description("Generuje plik HTML z książką kucharską (Thermomix Offline)")
  .option("-o, --output <path>", "Ścieżka do pliku wyjściowego", "przepisy-thermomix-offline.html")
  .action((opts) => {
    const html = generateOfflineCookbookHtml(RECIPES);
    const outputPath = path.resolve(opts.output);
    fs.writeFileSync(outputPath, html, "utf-8");
    console.log(`✅ Wygenerowano książkę offline: ${outputPath}`);
    console.log(`Możesz otworzyć ten plik w przeglądarce i wydrukować do PDF.`);
  });

program.parse(process.argv);
