import { RECIPES } from "./recipesData.js";

/**
 * Generuje w pełni samodzielną, interaktywną stronę HTML (Offline Recipe Book)
 * z wyróżnionymi parametrami Thermomixa (czas, temperatura, obroty, tryb ciasto).
 * Pozwala na gotowanie na Thermomixie w trybie manualnym nawet gdy darmowe konto Cookidoo wygaśnie.
 */
export function generateOfflineCookbookHtml(recipes = RECIPES) {
  const pizzaRecipes = recipes.filter((r) => r.category === "pizza");
  const glutenFreeRecipes = recipes.filter((r) => r.category === "gluten-free");

  const renderRecipeCard = (recipe) => {
    const ingredientsHtml = (recipe.ingredients || [])
      .map(
        (ing) => `
        <li class="flex items-center gap-2 py-1 text-slate-700">
          <input type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
          <span>${typeof ing === "string" ? ing : ing.text}</span>
        </li>
      `
      )
      .join("");

    const instructionsHtml = (recipe.instructions || [])
      .map((inst, idx) => {
        // Podświetl parametry TM: np. 2 min/37°C/obr. 2
        const highlighted = inst.replace(
          /(\d+(?:[-–]\d+)?\s*(?:min|s|sek|godz|h)\s*\/\s*(?:\d+\s*°\s*C|Varoma)\s*\/\s*obr\.?\s*(?:wsteczne\s*)?\d+(?:[,.]\d+)?)|(\d+(?:[-–]\d+)?\s*(?:min|s|sek)\s*\/\s*obr\.?\s*(?:wsteczne\s*)?\d+(?:[,.]\d+)?)|(tryb\s*(?:ciasto|kłos|interwał))/gi,
          (match) => `<span class="tm-badge inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono shadow-sm">⚙️ ${match}</span>`
        );

        return `
        <div class="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">${idx + 1}</span>
          <p class="text-slate-800 text-sm leading-relaxed">${highlighted}</p>
        </div>
      `;
      })
      .join("");

    const hintsHtml = recipe.hints
      ? `
      <div class="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r text-xs text-amber-900">
        <strong class="font-bold">Wskazówka:</strong> ${recipe.hints}
      </div>
    `
      : "";

    return `
      <div class="recipe-card bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition mb-8 break-inside-avoid">
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5">
          <div class="flex justify-between items-start">
            <div>
              <span class="inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold ${
                recipe.category === "pizza"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              } mb-2">
                ${recipe.category === "pizza" ? "🍕 Pizza" : "🌾 Bezglutenowe"}
              </span>
              <h3 class="text-xl font-bold">${recipe.title}</h3>
              <p class="text-xs text-slate-300 mt-1">${recipe.description || ""}</p>
            </div>
            <div class="text-right text-xs text-slate-300 flex flex-col gap-1">
              <span>⏱️ Przyg: <strong>${recipe.prepTime} min</strong></span>
              <span>⌛ Całość: <strong>${recipe.totalTime} min</strong></span>
              <span>🍽️ Porcje: <strong>${recipe.yield?.value || 4}</strong></span>
            </div>
          </div>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-1 border-r border-slate-100 pr-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span>🛒 Składniki</span>
            </h4>
            <ul class="text-xs space-y-1">
              ${ingredientsHtml}
            </ul>
          </div>
          <div class="md:col-span-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span>🥣 Kroki Thermomix (Ustawienia TM)</span>
            </h4>
            <div class="space-y-1">
              ${instructionsHtml}
            </div>
            ${hintsHtml}
          </div>
        </div>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Książka Przepisów Thermomix – Pizza & Bezglutenowe (Tryb Offline)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background: white !important; }
      .no-print { display: none !important; }
      .recipe-card { box-shadow: none !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 font-sans min-h-screen">
  <header class="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm no-print">
    <div class="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
      <div>
        <h1 class="text-2xl font-black text-slate-800 flex items-center gap-2">
          <span>🍕 CookiWebImport</span>
          <span class="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">Baza Przepisów Offline</span>
        </h1>
        <p class="text-xs text-slate-500">Thermomix TM6 / TM5 / TM7 • Pizza & Jedzenie Bezglutenowe</p>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="window.print()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
          🖨️ Drukuj / Zapisz jako PDF
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-8">
    <div class="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 no-print">
      <span class="text-2xl">💡</span>
      <div class="text-xs text-emerald-900">
        <strong class="font-bold">Gotowanie bez abonamentu Cookidoo:</strong> Wszystkie poniższe przepisy zawierają dokładne nastawy na ekran Thermomixa: czas, temperaturę, obroty i kierunek. Możesz z nich korzystać w trybie manualnym urządzenia, odhaczać składniki na ekranie lub wydrukować do kuchni!
      </div>
    </div>

    <!-- Sekcja: Pizza -->
    <section class="mb-12">
      <div class="flex items-center gap-3 mb-6 pb-2 border-b-2 border-rose-500">
        <span class="text-2xl">🍕</span>
        <h2 class="text-2xl font-extrabold text-slate-800">Przepisy na Pizzę i Focaccię</h2>
      </div>
      <div>
        ${pizzaRecipes.map(renderRecipeCard).join("")}
      </div>
    </section>

    <!-- Sekcja: Bezglutenowe -->
    <section class="mb-12">
      <div class="flex items-center gap-3 mb-6 pb-2 border-b-2 border-emerald-600">
        <span class="text-2xl">🌾</span>
        <h2 class="text-2xl font-extrabold text-slate-800">Przepisy Bezglutenowe</h2>
      </div>
      <div>
        ${glutenFreeRecipes.map(renderRecipeCard).join("")}
      </div>
    </section>
  </main>

  <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 no-print">
    CookiWebImport • System importu i zarządzania przepisami Thermomix Cookidoo
  </footer>
</body>
</html>`;
}
