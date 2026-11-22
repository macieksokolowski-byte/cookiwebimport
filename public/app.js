// Inteligentna obsługa Home Assistant Ingress oraz standardowego serwera localhost
const BASE_PATH = (() => {
  const p = window.location.pathname;
  if (p.includes("/api/hassio_ingress/")) {
    const match = p.match(/^(\/api\/hassio_ingress\/[^/]+)/);
    return match ? match[1] : "";
  }
  return "";
})();

// Automatyczne dopasowanie zapytań /api dla Home Assistant Ingress
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (typeof url === "string" && url.startsWith("/api") && BASE_PATH) {
    url = BASE_PATH + url;
  }
  return originalFetch.call(this, url, options);
};

// Stan aplikacji CookiWebImport
let allRecipes = [];
let cloudRecipes = [];
let cookidooRecipes = [];
let mealTypes = [];
let currentSource = "local"; // "local" | "cloud" | "cookidoo"
let currentMealType = "all";
let onlyGlutenFree = false;
let onlyVegetarian = false;
let maxTotalTime = 0;
let searchQuery = "";
let selectedRecipeIds = new Set();
let selectedCloudRecipesMap = new Map(); // id -> recipe object
let selectedRecipe = null;
let currentStatus = null;
let isSearchingCloud = false;
let isLoadingCookidoo = false;

// Elementy DOM
const connectionStatusBtn = document.getElementById("connectionStatusBtn");
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const localCountBadge = document.getElementById("localCountBadge");

// Przełącznik źródła
const sourceLocalBtn = document.getElementById("sourceLocalBtn");
const sourceCloudBtn = document.getElementById("sourceCloudBtn");
const sourceCookidooBtn = document.getElementById("sourceCookidooBtn");
const cookidooCountBadge = document.getElementById("cookidooCountBadge");
const cloudInfoBanner = document.getElementById("cloudInfoBanner");
const cookidooInfoBanner = document.getElementById("cookidooInfoBanner");
const cloudQuickTags = document.getElementById("cloudQuickTags");
const searchCloudBtn = document.getElementById("searchCloudBtn");
const cloudSourcesPicker = document.getElementById("cloudSourcesPicker");
const srcPrzepisowniaCb = document.getElementById("srcPrzepisowniaCb");
const srcKwestiaSmakuCb = document.getElementById("srcKwestiaSmakuCb");
const srcAniaGotujeCb = document.getElementById("srcAniaGotujeCb");
const mealTypesContainer = document.getElementById("mealTypesContainer");
const filterPillsContainer = document.getElementById("filterPillsContainer");

const mealTypeTabs = document.getElementById("mealTypeTabs");
const searchInput = document.getElementById("searchInput");
const filterGlutenFreeBtn = document.getElementById("filterGlutenFreeBtn");
const filterVegetarianBtn = document.getElementById("filterVegetarianBtn");
const filterTimeSelect = document.getElementById("filterTimeSelect");
const selectAllVisibleBtn = document.getElementById("selectAllVisibleBtn");
const deselectAllBtn = document.getElementById("deselectAllBtn");
const resultsStats = document.getElementById("resultsStats");
const recipesGrid = document.getElementById("recipesGrid");

// Pływający pasek akcji (Floating Toolbar)
const floatingActionBar = document.getElementById("floatingActionBar");
const selectedIconBox = document.getElementById("selectedIconBox");
const selectedCountText = document.getElementById("selectedCountText");
const selectedSubtext = document.getElementById("selectedSubtext");
const cancelSelectionBtn = document.getElementById("cancelSelectionBtn");
const importSelectedBatchBtn = document.getElementById("importSelectedBatchBtn");
const deleteSelectedBatchBtn = document.getElementById("deleteSelectedBatchBtn");

// Modal masowego importu
const batchProgressModal = document.getElementById("batchProgressModal");
const batchProgressSubtitle = document.getElementById("batchProgressSubtitle");
const batchProgressBar = document.getElementById("batchProgressBar");
const batchProgressList = document.getElementById("batchProgressList");
const closeBatchProgressBtn = document.getElementById("closeBatchProgressBtn");

// Modale autoryzacji, szczegółów i custom
const authModal = document.getElementById("authModal");
const openAuthModalBtn = document.getElementById("openAuthModalBtn");
const closeAuthModal = document.getElementById("closeAuthModal");
const tabMethodCookie = document.getElementById("tabMethodCookie");
const tabMethodPass = document.getElementById("tabMethodPass");
const formCookie = document.getElementById("formCookie");
const formPass = document.getElementById("formPass");

const recipeDetailModal = document.getElementById("recipeDetailModal");
const closeDetailModal = document.getElementById("closeDetailModal");
const detailCloseBtn = document.getElementById("detailCloseBtn");
const detailImportBtn = document.getElementById("detailImportBtn");
const detailDeleteBtn = document.getElementById("detailDeleteBtn");
const detailCookidooLink = document.getElementById("detailCookidooLink");
const detailBadgesContainer = document.getElementById("detailBadgesContainer");
const detailTitle = document.getElementById("detailTitle");
const detailDesc = document.getElementById("detailDesc");
const detailImage = document.getElementById("detailImage");
const detailPrepTime = document.getElementById("detailPrepTime");
const detailTotalTime = document.getElementById("detailTotalTime");
const detailServings = document.getElementById("detailServings");
const detailIngredientsList = document.getElementById("detailIngredientsList");
const detailStepsList = document.getElementById("detailStepsList");
const detailHintsBox = document.getElementById("detailHintsBox");
const detailHintsText = document.getElementById("detailHintsText");

const customRecipeModal = document.getElementById("customRecipeModal");
const openCustomModalBtn = document.getElementById("openCustomModalBtn");
const closeCustomModal = document.getElementById("closeCustomModal");
const scrapeBtn = document.getElementById("scrapeBtn");
const scrapeUrlInput = document.getElementById("scrapeUrlInput");
const rawRecipeTextInput = document.getElementById("rawRecipeTextInput");
const rawRecipeImageUrl = document.getElementById("rawRecipeImageUrl");
const parseAndImportBtn = document.getElementById("parseAndImportBtn");

// Inicjalizacja aplikacji
document.addEventListener("DOMContentLoaded", () => {
  fetchStatus();
  fetchRecipes();
  setupEventListeners();
});

// Konfiguracja nasłuchiwaczy zdarzeń
function setupEventListeners() {
  // Przełącznik: Baza Lokalna
  sourceLocalBtn.addEventListener("click", () => {
    if (currentSource === "local") return;
    currentSource = "local";
    updateSourceTabsUI();
    renderRecipes();
  });

  // Przełącznik: Chmura (Przepisownia.pl, Kwestia Smaku, Ania Gotuje)
  sourceCloudBtn.addEventListener("click", () => {
    if (currentSource === "cloud") return;
    currentSource = "cloud";
    updateSourceTabsUI();
    if (cloudRecipes.length === 0) {
      const initialQuery = searchInput.value.trim() || "pizza bezglutenowa";
      searchInput.value = initialQuery;
      triggerCloudSearch(initialQuery);
    } else {
      renderRecipes();
    }
  });

  // Przełącznik: Moje w Cookidoo (Utworzone przepisy użytkownika)
  sourceCookidooBtn.addEventListener("click", () => {
    if (currentSource === "cookidoo") return;
    currentSource = "cookidoo";
    updateSourceTabsUI();
    fetchCookidooRecipes();
  });

  // Wyszukiwarka tekstowa
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    if (currentSource === "local") {
      renderRecipes();
    }
  });

  // Wciśnięcie Enter w wyszukiwarce
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = searchInput.value.trim();
      if (currentSource === "cloud") {
        triggerCloudSearch(q);
      } else {
        renderRecipes();
      }
    }
  });

  // Przycisk wyszukiwania w chmurze
  if (searchCloudBtn) {
    searchCloudBtn.addEventListener("click", () => {
      const q = searchInput.value.trim();
      triggerCloudSearch(q);
    });
  }

  // Przełączniki serwisów wyszukiwania w chmurze
  [srcPrzepisowniaCb, srcKwestiaSmakuCb, srcAniaGotujeCb].forEach((cb) => {
    if (cb) {
      cb.addEventListener("change", () => {
        if (currentSource === "cloud") {
          const q = searchInput.value.trim();
          if (q) triggerCloudSearch(q);
        }
      });
    }
  });

  // Szybkie tagi wyszukiwania
  document.querySelectorAll(".quick-cloud-tag").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.q;
      searchInput.value = q;
      triggerCloudSearch(q);
    });
  });

  // Filtr Bezglutenowe
  filterGlutenFreeBtn.addEventListener("click", () => {
    onlyGlutenFree = !onlyGlutenFree;
    filterGlutenFreeBtn.classList.toggle("active", onlyGlutenFree);
    renderRecipes();
  });

  // Filtr Wegetariańskie
  filterVegetarianBtn.addEventListener("click", () => {
    onlyVegetarian = !onlyVegetarian;
    filterVegetarianBtn.classList.toggle("active", onlyVegetarian);
    renderRecipes();
  });

  // Filtr czasu
  filterTimeSelect.addEventListener("change", (e) => {
    maxTotalTime = parseInt(e.target.value, 10) || 0;
    renderRecipes();
  });

  // Masowe zaznaczanie / odznaczanie
  selectAllVisibleBtn.addEventListener("click", () => {
    const visible = getActiveFilteredList();
    visible.forEach((r) => {
      selectedRecipeIds.add(r.id);
      if (currentSource === "cloud") {
        selectedCloudRecipesMap.set(r.id, r);
      }
    });
    updateSelectionUI();
    renderRecipes();
    showToast(`Zaznaczono ${visible.length} widocznych przepisów.`, "info");
  });

  deselectAllBtn.addEventListener("click", () => {
    clearSelection();
    renderRecipes();
  });

  cancelSelectionBtn.addEventListener("click", () => {
    clearSelection();
    renderRecipes();
  });

  // Kliknięcie importu / usuwania zaznaczonych z paska pływającego
  importSelectedBatchBtn.addEventListener("click", handleBatchImportSelected);
  deleteSelectedBatchBtn.addEventListener("click", handleBatchDeleteCookidoo);

  // Zamknięcie modalu postępu
  closeBatchProgressBtn.addEventListener("click", () => {
    closeModal(batchProgressModal);
  });

  // Autoryzacja i status
  connectionStatusBtn.addEventListener("click", () => openModal(authModal));
  if (openAuthModalBtn) openAuthModalBtn.addEventListener("click", () => openModal(authModal));
  closeAuthModal.addEventListener("click", () => closeModal(authModal));

  tabMethodCookie.addEventListener("click", () => {
    tabMethodCookie.classList.add("bg-emerald-600", "text-white");
    tabMethodCookie.classList.remove("text-slate-400");
    tabMethodPass.classList.remove("bg-emerald-600", "text-white");
    tabMethodPass.classList.add("text-slate-400");
    formCookie.classList.remove("hidden");
    formPass.classList.add("hidden");
  });

  tabMethodPass.addEventListener("click", () => {
    tabMethodPass.classList.add("bg-emerald-600", "text-white");
    tabMethodPass.classList.remove("text-slate-400");
    tabMethodCookie.classList.remove("bg-emerald-600", "text-white");
    tabMethodCookie.classList.add("text-slate-400");
    formPass.classList.remove("hidden");
    formCookie.classList.add("hidden");
  });

  formCookie.addEventListener("submit", handleCookieSubmit);
  formPass.addEventListener("submit", handlePasswordSubmit);

  // Modal szczegółów
  closeDetailModal.addEventListener("click", () => closeModal(recipeDetailModal));
  detailCloseBtn.addEventListener("click", () => closeModal(recipeDetailModal));
  detailImportBtn.addEventListener("click", () => {
    if (selectedRecipe) importSingleRecipe(selectedRecipe.id, selectedRecipe);
  });

  // Własny przepis / Scrapowanie URL
  openCustomModalBtn.addEventListener("click", () => openModal(customRecipeModal));
  closeCustomModal.addEventListener("click", () => closeModal(customRecipeModal));
  scrapeBtn.addEventListener("click", handleScrapeUrl);
  parseAndImportBtn.addEventListener("click", handleParseAndImport);
}

// Zwraca listę zaznaczonych portali (Przepisownia, Kwestia Smaku, Ania Gotuje)
function getSelectedExternalSources() {
  const sources = [];
  if (srcPrzepisowniaCb && srcPrzepisowniaCb.checked) sources.push("przepisownia");
  if (srcKwestiaSmakuCb && srcKwestiaSmakuCb.checked) sources.push("kwestiasmaku");
  if (srcAniaGotujeCb && srcAniaGotujeCb.checked) sources.push("aniagotuje");
  return sources.length > 0 ? sources : ["przepisownia", "kwestiasmaku", "aniagotuje"];
}

// Przełączanie widoku zakładek źródła (Lokalna baza / Chmura portale / Twoje Cookidoo)
function updateSourceTabsUI() {
  clearSelection();

  if (currentSource === "local") {
    sourceLocalBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 bg-emerald-600 text-white shadow-md shadow-emerald-900/30";
    sourceCloudBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-white transition flex items-center gap-2";
    sourceCookidooBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-white transition flex items-center gap-2";

    cloudInfoBanner.classList.add("hidden");
    cookidooInfoBanner.classList.add("hidden");
    cloudQuickTags.classList.add("hidden");
    cloudSourcesPicker.classList.add("hidden");
    searchCloudBtn.classList.add("hidden");
    mealTypesContainer.classList.remove("hidden");
    filterPillsContainer.classList.remove("hidden");
    searchInput.placeholder = "Szukaj po nazwie potrawy, składnikach (np. pizza, ciecierzyca, szpinak)...";
  } else if (currentSource === "cloud") {
    sourceCloudBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 bg-teal-600 text-white shadow-md shadow-teal-900/30";
    sourceLocalBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-white transition flex items-center gap-2";
    sourceCookidooBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-white transition flex items-center gap-2";

    cloudInfoBanner.classList.remove("hidden");
    cookidooInfoBanner.classList.add("hidden");
    cloudQuickTags.classList.remove("hidden");
    cloudSourcesPicker.classList.remove("hidden");
    searchCloudBtn.classList.remove("hidden");
    mealTypesContainer.classList.add("hidden"); // w chmurze wyniki są z zapytania
    filterPillsContainer.classList.remove("hidden");
    searchInput.placeholder = "Wpisz co chcesz znaleźć (np. pizza neapolitańska, chleb, szakszuka)...";
  } else if (currentSource === "cookidoo") {
    sourceCookidooBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 bg-sky-600 text-white shadow-md shadow-sky-900/30";
    sourceLocalBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-white transition flex items-center gap-2";
    sourceCloudBtn.className =
      "source-tab px-4 py-2 rounded-xl text-xs font-extrabold text-slate-300 hover:text-white transition flex items-center gap-2";

    cookidooInfoBanner.classList.remove("hidden");
    cloudInfoBanner.classList.add("hidden");
    cloudQuickTags.classList.add("hidden");
    cloudSourcesPicker.classList.add("hidden");
    searchCloudBtn.classList.add("hidden");
    mealTypesContainer.classList.add("hidden");
    filterPillsContainer.classList.remove("hidden");
    searchInput.placeholder = "Filtruj przepisy w Twoim koncie Cookidoo...";
  }
}

// Pobieranie statusu Cookidoo
async function fetchStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    currentStatus = data;

    if (data.connected && data.hasSubscriptionOrTrial) {
      statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400";
      statusText.textContent = `Cookidoo Połączone (${data.recipesCount || 0} przepisów)`;
      if (cookidooCountBadge) cookidooCountBadge.textContent = data.recipesCount || 0;
    } else if (data.connected && !data.hasSubscriptionOrTrial) {
      statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse";
      statusText.textContent = `Konto bez okresu próbnego`;
      if (cookidooCountBadge) cookidooCountBadge.textContent = data.recipesCount || 0;
    } else if (data.configured) {
      statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
      statusText.textContent = `Błąd autoryzacji Cookidoo`;
    } else {
      statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-slate-500";
      statusText.textContent = `Połącz z Cookidoo`;
    }
  } catch {
    statusIndicator.className = "w-2.5 h-2.5 rounded-full bg-slate-500";
    statusText.textContent = "Brak serwera CookiWebImport";
  }
}

// Pobieranie przepisów utworzonych w Cookidoo przez użytkownika
async function fetchCookidooRecipes() {
  isLoadingCookidoo = true;
  recipesGrid.innerHTML = `
    <div class="col-span-full py-20 text-center text-sky-400 bg-slate-800/30 border border-sky-500/20 rounded-2xl">
      <div class="inline-block animate-spin text-4xl mb-3">☁️</div>
      <h3 class="text-base font-bold text-white">Ładowanie przepisów z Twojego konta Cookidoo...</h3>
      <p class="text-xs text-slate-400 mt-1">Pobieram listę utworzonych przepisów i zdjęć z serwerów Vorwerk</p>
    </div>
  `;
  resultsStats.textContent = "Ładowanie przepisów z Cookidoo...";

  try {
    const res = await fetch("/api/cookidoo/recipes");
    const data = await res.json();
    cookidooRecipes = data.recipes || [];
    if (cookidooCountBadge) cookidooCountBadge.textContent = cookidooRecipes.length;
    isLoadingCookidoo = false;
    renderRecipes();
  } catch (err) {
    isLoadingCookidoo = false;
    recipesGrid.innerHTML = `
      <div class="col-span-full py-16 text-center text-rose-400 bg-slate-800/30 border border-rose-500/20 rounded-2xl">
        <span class="text-4xl block mb-2">⚠️</span>
        <h3 class="text-base font-bold text-white">Nie udało się pobrać przepisów z Cookidoo</h3>
        <p class="text-xs text-slate-400 mt-1">${err.message}</p>
      </div>
    `;
    showToast(`Błąd Cookidoo: ${err.message}`, "error");
  }
}

// Pobranie listy lokalnych przepisów i typów posiłków
async function fetchRecipes() {
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    allRecipes = data.recipes || [];
    localCountBadge.textContent = allRecipes.length;
    mealTypes = data.mealTypes || [
      { id: "all", name: "Wszystkie", icon: "✨" },
      { id: "pizza-bread", name: "Pizza i Pieczywo", icon: "🍕" },
      { id: "breakfast", name: "Śniadania", icon: "🍳" },
      { id: "lunch", name: "Obiady i Dania główne", icon: "🍲" },
      { id: "soup", name: "Zupy", icon: "🥗" },
      { id: "supper", name: "Kolacje", icon: "🥙" },
      { id: "dessert", name: "Desery i Ciasta", icon: "🍰" },
      { id: "snack", name: "Przekąski", icon: "🥨" },
    ];

    renderMealTypeTabs();
    if (currentSource === "local") {
      renderRecipes();
    }
  } catch (err) {
    showToast("Błąd ładowania bazy przepisów: " + err.message, "error");
  }
}

// Dynamiczne wyszukiwanie w chmurze (Przepisownia.pl, Kwestia Smaku, Ania Gotuje)
async function triggerCloudSearch(query) {
  if (!query || !query.trim()) {
    return showToast("Wpisz frazę wyszukiwania dla chmury.", "info");
  }

  const selectedSources = getSelectedExternalSources();
  const sourceNames = selectedSources
    .map((s) => (s === "przepisownia" ? "Przepisownia TM" : s === "kwestiasmaku" ? "Kwestia Smaku" : "Ania Gotuje"))
    .join(", ");

  isSearchingCloud = true;
  recipesGrid.innerHTML = `
    <div class="col-span-full py-20 text-center text-teal-400 bg-slate-800/30 border border-teal-500/20 rounded-2xl">
      <div class="inline-block animate-spin text-4xl mb-3">🌐</div>
      <h3 class="text-base font-bold text-white">Przeszukiwanie serwisów: <span class="text-teal-300">${sourceNames}</span>...</h3>
      <p class="text-xs text-slate-400 mt-1">Wyszukuję przepisy ze zdjęciami i składnikami dla: <strong class="text-white">"${query}"</strong></p>
    </div>
  `;
  resultsStats.textContent = `Szukanie w: ${sourceNames} dla: "${query}"...`;

  try {
    const res = await fetch(`/api/external/search?q=${encodeURIComponent(query)}&sources=${selectedSources.join(",")}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Błąd wyszukiwania.");

    cloudRecipes = data.recipes || [];
    isSearchingCloud = false;
    renderRecipes();
  } catch (err) {
    isSearchingCloud = false;
    recipesGrid.innerHTML = `
      <div class="col-span-full py-16 text-center text-rose-400 bg-slate-800/30 border border-rose-500/20 rounded-2xl">
        <span class="text-4xl block mb-2">⚠️</span>
        <h3 class="text-base font-bold text-white">Błąd wyszukiwania w serwisach zewnętrznych</h3>
        <p class="text-xs text-slate-400 mt-1">${err.message}</p>
      </div>
    `;
    showToast(`Błąd szukania w chmurze: ${err.message}`, "error");
  }
}

// Generowanie zakładek typów posiłków
function renderMealTypeTabs() {
  mealTypeTabs.innerHTML = "";

  mealTypes.forEach((mt) => {
    const count =
      mt.id === "all"
        ? allRecipes.length
        : allRecipes.filter((r) => r.mealType === mt.id || r.category === mt.id).length;

    const btn = document.createElement("button");
    btn.className = `meal-tab px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
      currentMealType === mt.id
        ? "active"
        : "border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
    }`;
    btn.dataset.type = mt.id;

    btn.innerHTML = `
      <span>${mt.icon || "🍴"}</span>
      <span>${mt.name}</span>
      <span class="count-badge px-1.5 py-0.5 rounded-full text-[10px] ${
        currentMealType === mt.id ? "bg-white/20 text-white" : "bg-slate-700 text-slate-400"
      }">${count}</span>
    `;

    btn.addEventListener("click", () => {
      currentMealType = mt.id;
      renderMealTypeTabs();
      renderRecipes();
    });

    mealTypeTabs.appendChild(btn);
  });
}

// Pobranie aktualnie aktywnej przefiltrowanej listy (lokalnej, z chmury lub z Cookidoo)
function getActiveFilteredList() {
  const baseList =
    currentSource === "local"
      ? allRecipes
      : currentSource === "cookidoo"
      ? cookidooRecipes
      : cloudRecipes;

  return baseList.filter((r) => {
    // Filtr posiłku tylko dla bazy lokalnej (w chmurze i w cookidoo zapytanie definiuje posiłek)
    if (currentSource === "local") {
      const matchMeal =
        currentMealType === "all" ||
        r.mealType === currentMealType ||
        r.category === currentMealType ||
        (currentMealType === "pizza-bread" && (r.category === "pizza" || r.category === "bread"));
      if (!matchMeal) return false;
    }

    // Filtr diety
    if (onlyGlutenFree && !r.isGlutenFree) return false;
    if (onlyVegetarian && !r.isVegetarian) return false;

    // Filtr czasu
    if (maxTotalTime > 0 && r.totalTime > maxTotalTime) return false;

    // Wyszukiwarka tekstowa (dla lokalnej i Cookidoo)
    if (currentSource !== "cloud" && searchQuery) {
      const match =
        (r.title && r.title.toLowerCase().includes(searchQuery)) ||
        (r.description && r.description.toLowerCase().includes(searchQuery)) ||
        (r.ingredients &&
          r.ingredients.some((i) =>
            (typeof i === "string" ? i : i.text).toLowerCase().includes(searchQuery)
          ));
      if (!match) return false;
    }

    return true;
  });
}

// Czyści zaznaczenia
function clearSelection() {
  selectedRecipeIds.clear();
  selectedCloudRecipesMap.clear();
  updateSelectionUI();
}

// Aktualizacja paska pływającego i statystyk zaznaczenia
function updateSelectionUI() {
  const count = selectedRecipeIds.size;
  selectedCountText.textContent = count;

  if (count > 0) {
    floatingActionBar.classList.remove("translate-y-32", "opacity-0", "pointer-events-none");
    floatingActionBar.classList.add("translate-y-0", "opacity-100", "pointer-events-auto");
    deselectAllBtn.classList.remove("hidden");
  } else {
    floatingActionBar.classList.add("translate-y-32", "opacity-0", "pointer-events-none");
    floatingActionBar.classList.remove("translate-y-0", "opacity-100", "pointer-events-auto");
    deselectAllBtn.classList.add("hidden");
  }

  // Dostosowanie wyglądu paska: tryb usuwania z Cookidoo vs tryb importu
  if (currentSource === "cookidoo") {
    if (selectedIconBox) {
      selectedIconBox.className = "w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm";
      selectedIconBox.textContent = "🗑️";
    }
    selectedCountText.className = "text-rose-400 text-sm font-extrabold";
    if (selectedSubtext) selectedSubtext.textContent = "Zaznaczone do usunięcia z Twojego konta Cookidoo";
    importSelectedBatchBtn.classList.add("hidden");
    deleteSelectedBatchBtn.classList.remove("hidden");
  } else {
    if (selectedIconBox) {
      selectedIconBox.className = "w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm";
      selectedIconBox.textContent = "✓";
    }
    selectedCountText.className = "text-emerald-400 text-sm font-extrabold";
    if (selectedSubtext) selectedSubtext.textContent = "Gotowe do przesłania ze zdjęciami do Cookidoo";
    importSelectedBatchBtn.classList.remove("hidden");
    deleteSelectedBatchBtn.classList.add("hidden");
  }

  // Zaktualizuj zaznaczenie na istniejących kartach
  document.querySelectorAll(".recipe-card").forEach((card) => {
    const id = card.dataset.id;
    const isSelected = selectedRecipeIds.has(id);
    card.classList.toggle("selected", isSelected);
    const cb = card.querySelector(".recipe-checkbox");
    if (cb) cb.checked = isSelected;
  });
}

// Renderowanie siatki przepisów
function renderRecipes() {
  if (isSearchingCloud || isLoadingCookidoo) return;

  const filtered = getActiveFilteredList();

  // Aktualizacja statystyk
  const sourceLabel =
    currentSource === "local"
      ? "Twojej bibliotece"
      : currentSource === "cookidoo"
      ? "Twoim koncie Cookidoo"
      : "serwisach zewnętrznych";
  resultsStats.textContent = `Wyświetlono ${filtered.length} przepisów z ${sourceLabel}${
    selectedRecipeIds.size > 0 ? ` (zaznaczono: ${selectedRecipeIds.size})` : ""
  }`;

  recipesGrid.innerHTML = "";

  if (filtered.length === 0) {
    const isCloud = currentSource === "cloud";
    const isCookidoo = currentSource === "cookidoo";
    recipesGrid.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-500 bg-slate-800/20 border border-slate-800 rounded-2xl">
        <span class="text-4xl block mb-2">${isCookidoo ? "☁️" : isCloud ? "🌐" : "🔍"}</span>
        <h3 class="text-base font-bold text-slate-300">
          ${isCookidoo ? "Brak utworzonych przepisów w Cookidoo" : "Brak pasujących przepisów"}
        </h3>
        <p class="text-xs text-slate-500 mt-1">
          ${
            isCookidoo
              ? "Nie masz jeszcze żadnych utworzonych przepisów w Cookidoo lub zostały usunięte. Zaimportuj je z Biblioteki lub Internetu!"
              : isCloud
              ? "Wpisz inne hasło w wyszukiwarce lub kliknij jeden z popularnych tagów powyżej."
              : "Spróbuj zmienić filtry lub przełącz na '🌐 Wyszukaj w Internecie', aby wyszukać w sieci!"
          }
        </p>
      </div>
    `;
    return;
  }

  filtered.forEach((recipe) => {
    const isSelected = selectedRecipeIds.has(recipe.id);
    const isCookidoo = currentSource === "cookidoo" || recipe.source === "cookidoo";
    const isCloud = recipe.source === "przepisownia.pl" || (recipe.id && recipe.id.startsWith("przepisownia-"));
    const isDeletableLocal =
      currentSource === "local" &&
      (recipe.source ||
        (recipe.id &&
          (recipe.id.startsWith("przepisownia-") ||
            recipe.id.startsWith("ks-") ||
            recipe.id.startsWith("ania-") ||
            recipe.id.startsWith("custom-") ||
            recipe.id.startsWith("ext-"))));

    const card = document.createElement("div");
    card.className = `recipe-card bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden hover:border-slate-500 transition flex flex-col justify-between group shadow-sm hover:shadow-xl cursor-pointer ${
      isSelected ? "selected" : ""
    }`;
    card.dataset.id = recipe.id;

    // Wyraziste badges diety
    let dietBadgesHtml = "";
    if (recipe.isGlutenFree) {
      dietBadgesHtml += `<span class="diet-badge gf"><span>🌾</span><span>Bezglutenowe</span></span>`;
    }
    if (recipe.isVegetarian) {
      dietBadgesHtml += `<span class="diet-badge veg"><span>🌱</span><span>Wege</span></span>`;
    }

    // Wyraziste, czytelne etykiety źródła
    let badgeSource = `<span class="source-badge badge-local"><span>📂</span><span>Biblioteka</span></span>`;
    if (isCookidoo) {
      badgeSource = `<span class="source-badge badge-cookidoo"><span>☁️</span><span>Twoje Cookidoo</span></span>`;
    } else if (recipe.source === "kwestiasmaku.com") {
      badgeSource = `<span class="source-badge badge-ks"><span>🍕</span><span>Kwestia Smaku</span></span>`;
    } else if (recipe.source === "aniagotuje.pl") {
      badgeSource = `<span class="source-badge badge-ania"><span>👩‍🍳</span><span>Ania Gotuje</span></span>`;
    } else if (recipe.source === "przepisownia.pl" || (recipe.id && recipe.id.startsWith("przepisownia-"))) {
      badgeSource = `<span class="source-badge badge-tm"><span>🍲</span><span>Przepisownia TM</span></span>`;
    }

    const ratingBadge = recipe.rating
      ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">⭐ ${recipe.rating}</span>`
      : "";

    const tmBadge = `<span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">⚙️ ${recipe.tmVersion || "TM6/TM5"}</span>`;

    const ingredientsPreview = (recipe.ingredients || [])
      .slice(0, 3)
      .map((i) => (typeof i === "string" ? i : i.text))
      .join(", ");

    const checkboxTitle = isCookidoo ? "Zaznacz do usunięcia z Cookidoo" : "Zaznacz do importu";

    const imageHeader = recipe.image
      ? `<div class="h-48 w-full overflow-hidden relative bg-slate-900">
           <img src="${recipe.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="${recipe.title}" loading="lazy">
           <!-- Podwójny gradient w tle: przyciemnienie z góry i z dołu dla maksymalnej czytelności -->
           <div class="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-slate-950/90 pointer-events-none"></div>
           
           <!-- Checkbox w prawym górnym rogu z tłem -->
           <div class="absolute top-3 right-3 z-20 flex items-center justify-center p-1 rounded-lg bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-lg">
             <input type="checkbox" class="recipe-checkbox" ${isSelected ? "checked" : ""} data-id="${recipe.id}" title="${checkboxTitle}">
           </div>

           <!-- Wyraziste pigułki źródła i diety w lewym górnym rogu -->
           <div class="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 max-w-[80%]">
             ${badgeSource}
             ${dietBadgesHtml}
           </div>
         </div>`
      : `<div class="p-4 pb-0 flex items-center justify-between gap-2">
           <div class="flex items-center gap-1.5">
             ${badgeSource}
             ${dietBadgesHtml}
           </div>
           <input type="checkbox" class="recipe-checkbox" ${isSelected ? "checked" : ""} data-id="${recipe.id}" title="${checkboxTitle}">
         </div>`;

    // Pasek akcji na dole karty
    let actionButtonsHtml = "";
    if (isCookidoo) {
      actionButtonsHtml = `
        <button class="view-detail-btn text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition" data-id="${recipe.id}">
          🔍 Szczegóły
        </button>

        <button class="delete-cookidoo-btn px-3.5 py-1.5 rounded-xl bg-rose-700/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-950/30" data-id="${recipe.id}">
          <span>🗑️ Usuń z Cookidoo</span>
        </button>
      `;
    } else if (isDeletableLocal) {
      actionButtonsHtml = `
        <button class="view-detail-btn text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition" data-id="${recipe.id}">
          🔍 Szczegóły
        </button>

        <div class="flex items-center gap-1.5">
          <button class="delete-local-btn p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 text-xs transition" title="Usuń z biblioteki" data-id="${recipe.id}">
            <span>🗑️</span>
          </button>
          <button class="import-single-btn px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20" data-id="${recipe.id}">
            <span>➕ Wyślij</span>
          </button>
        </div>
      `;
    } else {
      actionButtonsHtml = `
        <button class="view-detail-btn text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-700 transition" data-id="${recipe.id}">
          🔍 Szczegóły
        </button>

        <button class="import-single-btn px-3.5 py-1.5 rounded-xl ${
          isCloud ? "bg-teal-600 hover:bg-teal-500" : "bg-emerald-600 hover:bg-emerald-500"
        } text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20" data-id="${recipe.id}">
          <span>➕ Importuj ze zdjęciem</span>
        </button>
      `;
    }

    card.innerHTML = `
      <div>
        ${imageHeader}

        <div class="p-5 pb-2">
          <!-- Parametry czasu i ocena -->
          <div class="flex items-center justify-between gap-2 mb-2 text-[11px] text-slate-400 font-medium">
            <span>⏱️ ${recipe.prepTime} min</span>
            <span>⌛ ${recipe.totalTime} min</span>
            ${ratingBadge}
            ${tmBadge}
          </div>

          <!-- Tytuł potrawy -->
          <h3 class="font-extrabold text-base text-white group-hover:text-emerald-400 transition leading-snug">
            ${recipe.title}
          </h3>

          <!-- Krótki opis lub autor -->
          <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            ${recipe.description || (isCloud ? `Przepis ze społeczności Thermomix • Autor: ${recipe.author || "TM"}` : "")}
          </p>

          ${
            ingredientsPreview
              ? `<div class="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
                   <strong class="text-slate-300">Składniki:</strong> ${ingredientsPreview}...
                 </div>`
              : isCloud
              ? `<div class="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-teal-400 flex items-center gap-1.5">
                   <span>✨ Pełne składniki i dotykowe kroki TM zostaną pobrane przy imporcie</span>
                 </div>`
              : ""
          }
        </div>
      </div>

      <!-- Pasek akcji na dole karty -->
      <div class="p-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2 bg-slate-800/40">
        ${actionButtonsHtml}
      </div>
    `;

    // Obsługa kliknięcia w checkbox
    const cb = card.querySelector(".recipe-checkbox");
    cb.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleRecipeSelection(recipe);
    });

    // Kliknięcie w kartę zaznacza/odznacza przepis
    card.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest(".recipe-checkbox")) return;
      toggleRecipeSelection(recipe);
    });

    // Przyciski akcji
    card.querySelector(".view-detail-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openDetailModal(recipe);
    });

    card.querySelector(".import-single-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      importSingleRecipe(recipe.id, recipe, e.currentTarget);
    });

    card.querySelector(".delete-cookidoo-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSingleCookidooRecipe(recipe.id, recipe.title);
    });

    card.querySelector(".delete-local-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSingleLocalRecipe(recipe.id, recipe.title);
    });

    recipesGrid.appendChild(card);
  });
}

// Przełączanie zaznaczenia przepisu
function toggleRecipeSelection(recipe) {
  const id = recipe.id;
  if (selectedRecipeIds.has(id)) {
    selectedRecipeIds.delete(id);
    selectedCloudRecipesMap.delete(id);
  } else {
    selectedRecipeIds.add(id);
    if (currentSource === "cloud") {
      selectedCloudRecipesMap.set(id, recipe);
    }
  }
  updateSelectionUI();
  const filtered = getActiveFilteredList();
  resultsStats.textContent = `Wyświetlono ${filtered.length} przepisów${
    selectedRecipeIds.size > 0 ? ` (zaznaczono: ${selectedRecipeIds.size})` : ""
  }`;
}

// Funkcja pomocnicza: sprawdza czy przepis pochodzi z serwisu zewnętrznego (chmury)
function isExternalRecipe(recipe, recipeId = null) {
  if (!recipe && !recipeId) return false;
  const src = recipe?.source || "";
  const id = recipe?.id || recipeId || "";
  const url = recipe?.url || recipe?.sourceUrl || "";
  return Boolean(
    url ||
    src === "przepisownia.pl" ||
    src === "kwestiasmaku.com" ||
    src === "aniagotuje.pl" ||
    id.startsWith("przepisownia-") ||
    id.startsWith("ks-") ||
    id.startsWith("ania-") ||
    id.startsWith("ext-")
  );
}

// Otwieranie szczegółów przepisu (jeśli z chmury, pobiera pełne dane w locie)
async function openDetailModal(recipe) {
  selectedRecipe = recipe;

  // Badges w nagłówku
  detailBadgesContainer.innerHTML = "";
  const isCloud = isExternalRecipe(recipe);
  const isCookidoo = currentSource === "cookidoo" || recipe.source === "cookidoo";

  const srcBadge = document.createElement("span");
  if (isCookidoo) {
    srcBadge.className = "source-badge badge-cookidoo text-xs";
    srcBadge.innerHTML = "<span>☁️</span><span>Twoje Cookidoo</span>";
  } else if (recipe.source === "kwestiasmaku.com") {
    srcBadge.className = "source-badge badge-ks text-xs";
    srcBadge.innerHTML = "<span>🍕</span><span>Kwestia Smaku</span>";
  } else if (recipe.source === "aniagotuje.pl") {
    srcBadge.className = "source-badge badge-ania text-xs";
    srcBadge.innerHTML = "<span>👩‍🍳</span><span>Ania Gotuje</span>";
  } else if (isCloud) {
    srcBadge.className = "source-badge badge-tm text-xs";
    srcBadge.innerHTML = "<span>🍲</span><span>Przepisownia TM</span>";
  } else {
    srcBadge.className = "source-badge badge-local text-xs";
    srcBadge.innerHTML = "<span>📂</span><span>Biblioteka CookiWebImport</span>";
  }
  detailBadgesContainer.appendChild(srcBadge);

  if (recipe.isGlutenFree) {
    const gfBadge = document.createElement("span");
    gfBadge.className = "diet-badge gf text-xs";
    gfBadge.innerHTML = "<span>🌾</span><span>Bezglutenowe</span>";
    detailBadgesContainer.appendChild(gfBadge);
  }

  // Przyciski akcji modalu szczegółów: tryb Cookidoo vs Import
  if (isCookidoo) {
    detailImportBtn.classList.add("hidden");
    detailDeleteBtn.classList.remove("hidden");
    detailDeleteBtn.onclick = () => deleteSingleCookidooRecipe(recipe.id, recipe.title, true);
    if (recipe.cookidooUrl) {
      detailCookidooLink.href = recipe.cookidooUrl;
      detailCookidooLink.classList.remove("hidden");
    } else {
      detailCookidooLink.classList.add("hidden");
    }
  } else {
    detailImportBtn.classList.remove("hidden");
    detailDeleteBtn.classList.add("hidden");
    detailCookidooLink.classList.add("hidden");
  }

  detailTitle.textContent = recipe.title;
  detailDesc.textContent = recipe.description || (isCloud ? `Przepis z ${recipe.sourceName || recipe.author || "serwisu zewnętrznego"}` : "");
  detailPrepTime.textContent = `${recipe.prepTime} min`;
  detailTotalTime.textContent = `${recipe.totalTime} min`;
  detailServings.textContent = `${recipe.yield?.value || 4} porcje`;

  if (recipe.image) {
    detailImage.src = recipe.image;
    detailImage.classList.remove("hidden");
  } else {
    detailImage.classList.add("hidden");
  }

  // Funkcja renderująca zawartość składników i kroków
  const renderDetailLists = (rec) => {
    detailIngredientsList.innerHTML = (rec.ingredients || [])
      .map(
        (ing) => `
        <li class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>${typeof ing === "string" ? ing : ing.text}</span>
        </li>
      `
      )
      .join("");

    detailStepsList.innerHTML = (rec.instructions || [])
      .map((inst, idx) => {
        const highlighted = inst.replace(
          /(\d+(?:[-–]\d+)?\s*(?:min|s|sek|godz|h)\s*\/\s*(?:\d+\s*°\s*C|Varoma)\s*\/\s*obr\.?\s*(?:wsteczne\s*)?\d+(?:[,.]\d+)?)|(\d+(?:[-–]\d+)?\s*(?:min|s|sek)\s*\/\s*obr\.?\s*(?:wsteczne\s*)?\d+(?:[,.]\d+)?)|(tryb\s*(?:ciasto|kłos|interwał))/gi,
          (match) => `<span class="tm-param">⚙️ ${match}</span>`
        );

        return `
        <div class="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <span class="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">${idx + 1}</span>
          <p class="text-xs text-slate-200 leading-relaxed">${highlighted}</p>
        </div>
      `;
      })
      .join("");

    if (rec.hints) {
      detailHintsBox.classList.remove("hidden");
      detailHintsText.textContent = rec.hints;
    } else {
      detailHintsBox.classList.add("hidden");
    }
  };

  // Jeśli przepis nie ma jeszcze instrukcji (np. pobrany ze wstępnych wyników wyszukiwania w chmurze), pobierz je
  if (isCloud && (!recipe.instructions || recipe.instructions.length === 0) && recipe.url) {
    const sName = recipe.sourceName || (recipe.source === "kwestiasmaku.com" ? "Kwestia Smaku" : recipe.source === "aniagotuje.pl" ? "Ania Gotuje" : "Przepisownia TM");
    detailIngredientsList.innerHTML = `<li class="text-teal-400 animate-pulse">⏳ Pobieranie składników z serwisu ${sName}...</li>`;
    detailStepsList.innerHTML = `<div class="p-4 rounded-xl bg-slate-800/60 text-teal-400 text-xs animate-pulse">⏳ Pobieranie kroków przygotowania z serwisu ${sName}...</div>`;
    openModal(recipeDetailModal);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipe.url }),
      });
      const data = await res.json();
      if (res.ok && data.recipe) {
        Object.assign(recipe, data.recipe);
        selectedRecipe = recipe;
        renderDetailLists(recipe);
      }
    } catch (e) {
      console.warn("Błąd doładowywania szczegółów:", e);
    }
  } else {
    renderDetailLists(recipe);
    openModal(recipeDetailModal);
  }
}

// Import pojedynczego przepisu (ze zdjęciem) do Cookidoo
async function importSingleRecipe(recipeId, recipeData = null, triggerBtn = null) {
  let originalBtnHtml = "";
  if (triggerBtn) {
    originalBtnHtml = triggerBtn.innerHTML;
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = `<span>⏳ Wysyłanie do Cookidoo...</span>`;
  }

  const isCloud = isExternalRecipe(recipeData, recipeId);
  const targetUrl = recipeData?.url || (recipeData && recipeData.sourceUrl);

  try {
    let res;
    if (isCloud && targetUrl) {
      // Dynamiczny import z serwerów chmurowych (Przepisownia, Kwestia Smaku, Ania Gotuje)
      res = await fetch("/api/external/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, title: recipeData?.title, recipeData, id: recipeId }),
      });
    } else {
      // Import z bazy lokalnej
      res = await fetch("/api/import/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipeId, url: targetUrl, recipeData }),
      });
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Nie udało się zaimportować.");
    }

    showToast(`✅ "${recipeData?.title || 'Przepis'}" został dodany do Cookidoo (wraz ze zdjęciem)!`, "success");
    fetchStatus();
    fetchRecipes(); // odśwież licznik bazy lokalnej (nowo pobrany przepis trafia do biblioteki!)

    if (triggerBtn) {
      triggerBtn.className =
        "px-3.5 py-1.5 rounded-xl bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1.5";
      triggerBtn.innerHTML = `<span>✓ Zaimportowano</span>`;
    }
  } catch (err) {
    showToast(`❌ ${err.message}`, "error");
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = originalBtnHtml;
    }
  }
}

// Masowy import zaznaczonych przepisów (zarówno lokalnych, jak i z chmury)
async function handleBatchImportSelected() {
  const ids = Array.from(selectedRecipeIds);
  if (ids.length === 0) {
    return showToast("Najpierw zaznacz przepisy checkboxami!", "info");
  }

  // Zbierz listę obiektów do przetworzenia
  const recipesToProcess = [];
  ids.forEach((id) => {
    if (selectedCloudRecipesMap.has(id)) {
      recipesToProcess.push(selectedCloudRecipesMap.get(id));
    } else {
      const found = allRecipes.find((r) => r.id === id);
      if (found) recipesToProcess.push(found);
      else recipesToProcess.push({ id });
    }
  });

  const total = recipesToProcess.length;

  batchProgressBar.style.width = "0%";
  batchProgressSubtitle.textContent = `Wysyłanie ${total} zaznaczonych przepisów wraz ze zdjęciami do Twojego Cookidoo...`;
  closeBatchProgressBtn.classList.add("hidden");
  batchProgressList.innerHTML = "";

  // Generuj wiersze postępu
  recipesToProcess.forEach((r, idx) => {
    const row = document.createElement("div");
    row.id = `batchRow-${r.id}`;
    row.className = "flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800";
    row.innerHTML = `
      <div class="flex items-center gap-2.5 overflow-hidden">
        <span class="w-5 h-5 rounded-md bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">${idx + 1}</span>
        <span class="font-semibold text-slate-200 truncate">${r.title || r.id}</span>
      </div>
      <span class="status-badge text-[11px] font-medium text-slate-400 flex items-center gap-1 flex-shrink-0">
        <span>Oczekuje</span>
      </span>
    `;
    batchProgressList.appendChild(row);
  });

  openModal(batchProgressModal);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < recipesToProcess.length; i++) {
    const r = recipesToProcess[i];
    const row = document.getElementById(`batchRow-${r.id}`);
    const badge = row ? row.querySelector(".status-badge") : null;

    if (badge) {
      badge.className = "status-badge text-[11px] font-bold text-amber-400 flex items-center gap-1 flex-shrink-0";
      badge.innerHTML = `<span class="animate-spin inline-block">⏳</span><span>Wysyłanie ze zdjęciem...</span>`;
    }

    try {
      let res;
      const isCloud = isExternalRecipe(r, r.id);
      const targetUrl = r.url || r.sourceUrl;

      if (isCloud && targetUrl) {
        res = await fetch("/api/external/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl, title: r.title, recipeData: r, id: r.id }),
        });
      } else {
        res = await fetch("/api/import/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: r.id, url: targetUrl, recipeData: r }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Błąd Cookidoo");
      }

      successCount++;
      if (badge) {
        badge.className = "status-badge text-[11px] font-bold text-emerald-400 flex items-center gap-1 flex-shrink-0";
        badge.innerHTML = `<span>✓ Zaimportowano</span>`;
      }
    } catch (err) {
      failCount++;
      if (badge) {
        badge.className = "status-badge text-[11px] font-bold text-rose-400 flex items-center gap-1 flex-shrink-0";
        badge.innerHTML = `<span>✕ Błąd: ${err.message.slice(0, 30)}</span>`;
      }
    }

    // Aktualizacja paska postępu
    const percent = Math.round(((i + 1) / total) * 100);
    batchProgressBar.style.width = `${percent}%`;

    // Odczekaj 1s między zapytaniami
    if (i < recipesToProcess.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  batchProgressSubtitle.innerHTML = `🎉 Zakończono! Zaimportowano pomyślnie <strong class="text-emerald-400">${successCount}</strong> z <strong class="text-white">${total}</strong> przepisów.`;
  closeBatchProgressBtn.classList.remove("hidden");
  fetchStatus();
  fetchRecipes(); // zaimportowane przepisy powiększają lokalną bazę!

  clearSelection();
  renderRecipes();

  showToast(`Masowy import zakończony (${successCount}/${total} pomyślnie).`, "success");
}

// Usunięcie pojedynczego przepisu z konta Cookidoo
async function deleteSingleCookidooRecipe(recipeId, recipeTitle, closeDetail = false) {
  const displayTitle = recipeTitle || recipeId;
  if (!confirm(`Czy na pewno chcesz trwale usunąć przepis "${displayTitle}" z Twojego konta Cookidoo?`)) {
    return;
  }

  try {
    showToast(`Usuwanie "${displayTitle}" z Cookidoo...`, "info");
    const res = await fetch(`/api/cookidoo/recipes/${encodeURIComponent(recipeId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Nie udało się usunąć przepisu z Cookidoo.");
    }

    showToast(`🗑️ Przepis "${displayTitle}" został usunięty z Cookidoo!`, "success");
    if (closeDetail) {
      closeModal(recipeDetailModal);
    }

    selectedRecipeIds.delete(recipeId);
    updateSelectionUI();

    await fetchCookidooRecipes();
    fetchStatus();
  } catch (err) {
    showToast(`❌ Błąd usuwania: ${err.message}`, "error");
  }
}

// Usunięcie przepisu z lokalnej biblioteki (custom_recipes.json)
async function deleteSingleLocalRecipe(recipeId, recipeTitle) {
  const displayTitle = recipeTitle || recipeId;
  if (!confirm(`Czy na pewno chcesz usunąć przepis "${displayTitle}" z Twojej biblioteki CookiWebImport?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/recipes/custom/${encodeURIComponent(recipeId)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Nie udało się usunąć przepisu.");
    }

    showToast(`🗑️ Przepis "${displayTitle}" został usunięty z Twojej biblioteki.`, "success");
    selectedRecipeIds.delete(recipeId);
    updateSelectionUI();

    await fetchRecipes();
  } catch (err) {
    showToast(`❌ Błąd: ${err.message}`, "error");
  }
}

// Masowe usuwanie zaznaczonych przepisów z Cookidoo
async function handleBatchDeleteCookidoo() {
  const ids = Array.from(selectedRecipeIds);
  if (ids.length === 0) {
    return showToast("Najpierw zaznacz przepisy checkboxami!", "info");
  }

  if (
    !confirm(
      `⚠️ Czy na pewno chcesz trwale usunąć ${ids.length} zaznaczonych przepisów z Twojego konta Cookidoo? Tej operacji nie można cofnąć.`
    )
  ) {
    return;
  }

  const originalHtml = deleteSelectedBatchBtn.innerHTML;
  deleteSelectedBatchBtn.disabled = true;
  deleteSelectedBatchBtn.innerHTML = `<span>⏳ Usuwanie ${ids.length} przepisów...</span>`;

  try {
    const res = await fetch("/api/cookidoo/recipes/delete-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Błąd podczas usuwania przepisów.");
    }

    showToast(`✅ Usunięto ${data.successful} przepisów z Twojego konta Cookidoo!`, "success");
    clearSelection();

    await fetchCookidooRecipes();
    fetchStatus();
  } catch (err) {
    showToast(`❌ Błąd usuwania z Cookidoo: ${err.message}`, "error");
  } finally {
    deleteSelectedBatchBtn.disabled = false;
    deleteSelectedBatchBtn.innerHTML = originalHtml;
  }
}

// Zapis ciasteczka _oauth2_proxy
async function handleCookieSubmit(e) {
  e.preventDefault();
  const token = document.getElementById("cookieInput").value.trim();
  if (!token) return showToast("Wklej wartość ciasteczka sesji.", "error");

  try {
    const res = await fetch("/api/auth/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Błąd zapisu.");

    showToast("✅ Połączono z Cookidoo przez ciasteczko!", "success");
    closeModal(authModal);
    fetchStatus();
  } catch (err) {
    showToast(`❌ ${err.message}`, "error");
  }
}

// Logowanie e-mail / hasło
async function handlePasswordSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();
  if (!email || !password) return showToast("Wpisz e-mail i hasło.", "error");

  try {
    const res = await fetch("/api/auth/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Błąd logowania.");

    showToast("✅ Pomyślnie zalogowano do Cookidoo!", "success");
    closeModal(authModal);
    fetchStatus();
  } catch (err) {
    showToast(`❌ ${err.message}`, "error");
  }
}

// Pobieranie przepisu z zewnętrznego URL
async function handleScrapeUrl() {
  const url = scrapeUrlInput.value.trim();
  if (!url) return showToast("Wklej adres URL przepisu.", "error");

  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = `<span>Pobieranie ze zdjęciem...</span>`;

  try {
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Błąd pobierania.");

    const recipe = data.recipe;
    closeModal(customRecipeModal);
    openDetailModal(recipe);
    showToast(`Pobrano przepis: "${recipe.title}" ze zdjęciem. Możesz go wysłać do Cookidoo!`, "success");
  } catch (err) {
    showToast(`❌ ${err.message}`, "error");
  } finally {
    scrapeBtn.disabled = false;
    scrapeBtn.innerHTML = `<span>Pobierz ze zdjęciem</span>`;
  }
}

// Przetwarzanie surowego tekstu z nastawami TM
async function handleParseAndImport() {
  const text = rawRecipeTextInput.value.trim();
  const imageUrl = rawRecipeImageUrl?.value.trim() || null;
  if (!text) return showToast("Wklej treść przepisu.", "error");

  parseAndImportBtn.disabled = true;
  parseAndImportBtn.innerHTML = `<span>Przetwarzanie i wysyłanie ze zdjęciem...</span>`;

  try {
    const parseRes = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const parseData = await parseRes.json();
    if (!parseRes.ok) throw new Error(parseData.error);

    const recipeToImport = parseData.recipe;
    if (imageUrl) {
      recipeToImport.image = imageUrl;
    }

    const importRes = await fetch("/api/import/single", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customRecipe: recipeToImport }),
    });
    const importData = await importRes.json();
    if (!importRes.ok || !importData.success) throw new Error(importData.error);

    showToast(`✅ Zaimportowano przepis: "${recipeToImport.title}"!`, "success");
    closeModal(customRecipeModal);
    rawRecipeTextInput.value = "";
    if (rawRecipeImageUrl) rawRecipeImageUrl.value = "";
    fetchStatus();
    fetchRecipes();
  } catch (err) {
    showToast(`❌ ${err.message}`, "error");
  } finally {
    parseAndImportBtn.disabled = false;
    parseAndImportBtn.innerHTML = `<span>⚡ Przetwórz i Wyślij do Cookidoo (ze zdjęciem)</span>`;
  }
}

// Pomocnicze funkcje modali i toastów
function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");

  const colors = {
    success: "bg-emerald-600 text-white border-emerald-500",
    error: "bg-rose-600 text-white border-rose-500",
    info: "bg-slate-800 text-slate-100 border-slate-700",
  };

  toast.className = `p-3.5 rounded-xl border text-xs font-semibold shadow-xl transition-all duration-300 pointer-events-auto flex items-center gap-2 max-w-sm ${
    colors[type] || colors.info
  }`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
