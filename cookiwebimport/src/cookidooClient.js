import { CookidooClient, CookidooAuthError, CookidooError, CookidooRateLimitError } from "@recode-software/cookidoo-api";
import { Cookie } from "tough-cookie";
import fs from "fs";
import { buildStep } from "./recipeParser.js";

/**
 * Stałe dla Cloudinary (tenant Vorwerk Cookidoo)
 */
const CLOUDINARY_UPLOAD_URL = "https://api-eu.cloudinary.com/v1_1/vorwerk-users-gc/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "prod-customer-recipe-signed";
const CLOUDINARY_UPLOAD_SOURCE = "uw";
const CLOUDINARY_API_KEY = "993585863591145";

/**
 * Menedżer połączenia z Cookidoo.
 * Obsługuje logowanie hasłem (OAuth2/PKCE) oraz ciasteczkiem sesji (_oauth2_proxy),
 * import przepisów z dotykowymi przyciskami TM6 oraz przesyłanie zdjęć przez autoryzowany Cloudinary flow.
 */
export class CookiWebImportClient {
  constructor(config = {}) {
    this.email = config.email || process.env.COOKIDOO_EMAIL || "";
    this.password = config.password || process.env.COOKIDOO_PASSWORD || "";
    this.token = config.token || process.env.COOKIDOO_JWT || "";
    this.country = config.country || process.env.COOKIDOO_COUNTRY || "pl";
    this.language = config.language || process.env.COOKIDOO_LANGUAGE || "pl";
    this.baseUrl = config.baseUrl || `https://cookidoo.${this.country}`;

    this.client = null;
    this.initClient();
  }

  initClient() {
    this.client = new CookidooClient({
      email: this.email,
      password: this.password,
      country: this.country,
      language: this.language,
      baseUrl: this.baseUrl,
    });

    if (this.token) {
      this.applySessionToken(this.token);
    }
  }

  applySessionToken(token) {
    if (!token) return;
    const cleanToken = token.trim().replace(/^_oauth2_proxy=/, "");
    const domain = `cookidoo.${this.country}`;

    this.client.jar.setCookieSync(
      new Cookie({
        key: "_oauth2_proxy",
        value: cleanToken,
        domain: domain,
        path: "/",
        httpOnly: true,
        secure: true,
      }),
      this.baseUrl
    );

    this.client.jar.setCookieSync(
      new Cookie({
        key: "v-authenticated",
        value: "true",
        domain: domain,
        path: "/",
      }),
      this.baseUrl
    );

    this.client.loggedIn = true;
    this.token = cleanToken;
  }

  async checkConnection() {
    try {
      if (!this.token && (!this.email || !this.password)) {
        return {
          connected: false,
          error: "Brak danych logowania (brak e-maila/hasła lub ciasteczka sesji _oauth2_proxy).",
        };
      }

      const recipes = await this.client.recipes.list();
      return {
        connected: true,
        status: "Aktywne (dostęp do Utworzonych Przepisów)",
        hasSubscriptionOrTrial: true,
        recipesCount: Array.isArray(recipes) ? recipes.length : 0,
        country: this.country,
      };
    } catch (err) {
      if (err instanceof CookidooAuthError || err.status === 401) {
        return {
          connected: false,
          error: "Błąd uwierzytelnienia (401). Sprawdź e-mail i hasło lub odśwież ciasteczko sesji.",
        };
      }

      if (err.status === 403) {
        return {
          connected: true,
          hasSubscriptionOrTrial: false,
          status: "Darmowe konto bez aktywnego okresu próbnego / subskrypcji",
          error:
            "Konto Cookidoo ma wygasłą subskrypcję/okres próbny. Vorwerk blokuje tworzenie własnych przepisów (błąd 403 Forbidden).",
        };
      }

      return {
        connected: false,
        error: `Błąd połączenia z Cookidoo: ${err.message || String(err)}`,
      };
    }
  }

  async listCustomRecipes() {
    return await this.client.recipes.list();
  }

  /**
   * Usuwa przepis z profilu Cookidoo (z chmury Vorwerk)
   * @param {string} recipeId - ID przepisu w Cookidoo (np. 01M81HJ9G2VWKB2283V0GWPCTK)
   */
  async deleteRecipe(recipeId) {
    if (!recipeId) throw new Error("Wymagane ID przepisu do usunięcia.");
    console.log(`[Cookidoo Delete] Usuwanie przepisu z Cookidoo: ID ${recipeId}...`);
    return await this.client.recipes.delete(recipeId);
  }

  /**
   * Masowe usuwanie przepisów z profilu Cookidoo
   * @param {string[]} recipeIds - Lista ID przepisów
   */
  async deleteBatch(recipeIds) {
    if (!Array.isArray(recipeIds) || recipeIds.length === 0) return [];
    const results = [];
    for (const id of recipeIds) {
      try {
        await this.deleteRecipe(id);
        results.push({ id, success: true });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }

  /**
   * Wysyła zdjęcie do dedykowanego kontenera Cloudinary Vorwerk i podpina je pod przepis w Cookidoo
   * @param {string} recipeId - ID przepisu w Cookidoo
   * @param {string} imageSource - URL internetowy lub lokalna ścieżka do pliku JPG/PNG
   */
  async uploadRecipeImage(recipeId, imageSource) {
    if (!imageSource || typeof imageSource !== "string") return null;

    try {
      console.log(`[Cookidoo Image] Przygotowywanie zdjęcia dla ID: ${recipeId}...`);
      let imageBuffer = null;
      let contentType = "image/jpeg";

      if (imageSource.startsWith("http://") || imageSource.startsWith("https://")) {
        const res = await fetch(imageSource, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} przy pobieraniu zdjęcia`);
        const arrayBuf = await res.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
        const headerType = res.headers.get("content-type");
        if (headerType && (headerType.includes("png") || headerType.includes("jpeg") || headerType.includes("jpg"))) {
          contentType = headerType.split(";")[0].trim();
        }
      } else if (fs.existsSync(imageSource)) {
        imageBuffer = fs.readFileSync(imageSource);
        if (imageSource.toLowerCase().endsWith(".png")) {
          contentType = "image/png";
        }
      } else {
        return null;
      }

      // Sniff MIME type z nagłówka bajtów
      if (imageBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        contentType = "image/png";
      } else if (imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8) {
        contentType = "image/jpeg";
      }

      // Krok 1: Pobranie podpisu z Cookidoo
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureRes = await this.client.request({
        method: "POST",
        path: `/created-recipes/${this.language}/image/signature`,
        body: {
          timestamp,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
          source: CLOUDINARY_UPLOAD_SOURCE,
        },
      });

      const signature = signatureRes?.signature;
      if (!signature) {
        throw new Error("Serwer Cookidoo nie zwrócił podpisu autoryzacyjnego Cloudinary.");
      }

      // Krok 2: Bezpośrednie przesłanie do Cloudinary Vorwerk
      const form = new FormData();
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.append("source", CLOUDINARY_UPLOAD_SOURCE);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("api_key", CLOUDINARY_API_KEY);

      const ext = contentType === "image/png" ? "png" : "jpg";
      const blob = new Blob([imageBuffer], { type: contentType });
      form.append("file", blob, `cover.${ext}`);

      const uploadRes = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: form,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Błąd Cloudinary HTTP ${uploadRes.status}: ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const publicId = uploadData.public_id;
      const format = uploadData.format || ext;

      if (!publicId) {
        throw new Error("Cloudinary nie zwróciło public_id");
      }

      // Krok 3: Zapisanie powiązania zdjęcia w przepisie Cookidoo
      const imagePayload = {
        image: `${publicId}.${format}`,
        isImageOwnedByUser: true,
      };

      console.log(`[Cookidoo Image] Zapisywanie zdjęcia "${imagePayload.image}" w przepisie...`);
      await this.client.request({
        method: "PATCH",
        path: `/created-recipes/${this.language}/${encodeURIComponent(recipeId)}`,
        body: imagePayload,
      });

      console.log(`[Cookidoo Image] Sukces! Zdjęcie zostało przypięte do przepisu.`);
      return {
        publicId,
        format,
        url: `https://ugc.assets.tmecosys.com/image/upload/${publicId}.${format}`,
      };
    } catch (err) {
      console.warn(`[Cookidoo Image Warning] Nie udało się dodać zdjęcia:`, err.message);
      return null;
    }
  }

  /**
   * Importuje przepis do 'Utworzonych przepisów' w Cookidoo (wraz ze zdjęciem, jeśli dostępne)
   * @param {Object} recipe - Obiekt przepisu
   */
  async importRecipe(recipe) {
    if (!recipe || !recipe.title) {
      throw new Error("Nieprawidłowy obiekt przepisu – brak tytułu.");
    }

    let recipeId = null;

    try {
      // Krok 1: Utworzenie szablonu przepisu (POST /created-recipes/pl)
      console.log(`[Cookidoo] 1/3: Tworzenie szablonu przepisu: "${recipe.title}"...`);
      const createdRecipe = await this.client.recipes.create(recipe.title.trim());
      recipeId = createdRecipe.recipeId;

      if (!recipeId) {
        throw new Error("Serwer Cookidoo nie zwrócił recipeId.");
      }

      // Krok 2: Przygotowanie i aktualizacja metadanych (składniki, czas, porcje)
      const ingredientsPayload = (recipe.ingredients || []).map((ing) => {
        const text = typeof ing === "string" ? ing : ing.text || ing.display;
        return {
          type: "INGREDIENT",
          text: text.trim(),
        };
      });

      const prepTimeSec = Math.max(60, (Number(recipe.prepTime) || 15) * 60);
      const totalTimeSec = Math.max(prepTimeSec, (Number(recipe.totalTime) || 30) * 60);
      const yieldValue = Number(recipe.yield?.value) || 4;

      const metaPayload = {
        name: recipe.title.trim(),
        ingredients: ingredientsPayload,
        prepTime: prepTimeSec,
        totalTime: totalTimeSec,
        yield: {
          value: yieldValue,
          unitText: "portion",
        },
      };

      console.log(`[Cookidoo] 2/3: Zapisywanie metadanych dla ID: ${recipeId}...`);
      try {
        await this.client.recipes.patchMeta(recipeId, metaPayload);
      } catch (patchMetaErr) {
        const bodyStr = patchMetaErr.body ? JSON.stringify(patchMetaErr.body) : patchMetaErr.message;
        console.error(`[Cookidoo] Błąd w patchMeta dla ID: ${recipeId}:`, bodyStr);
        throw new Error(`Błąd walidacji metadanych Cookidoo (patchMeta): ${bodyStr}`);
      }

      // Krok 3: Przetworzenie i zapisanie instrukcji z adnotacjami TM (TTS: czas, temp, obroty)
      console.log(`[Cookidoo] 3/3: Zapisywanie kroków przygotowania z przyciskami Thermomix...`);
      const instructionsList = [...(recipe.instructions || [])];

      if (recipe.hints && typeof recipe.hints === "string") {
        instructionsList.push(`Wskazówka: ${recipe.hints.trim()}`);
      }

      const steps = instructionsList.map((inst) => buildStep(inst));

      try {
        await this.client.recipes.patchInstructions(recipeId, steps);
      } catch (patchInstErr) {
        const bodyStr = patchInstErr.body ? JSON.stringify(patchInstErr.body) : patchInstErr.message;
        console.error(`[Cookidoo] Błąd w patchInstructions dla ID: ${recipeId}:`, bodyStr);
        throw new Error(`Błąd walidacji instrukcji Cookidoo (patchInstructions): ${bodyStr}`);
      }

      // Krok 4: Wgranie zdjęcia (jeśli przepis posiada zdjęcie)
      const imageSource = recipe.image || recipe.imageUrl;
      let uploadedImageInfo = null;
      if (imageSource) {
        try {
          uploadedImageInfo = await this.uploadRecipeImage(recipeId, imageSource);
        } catch (imgErr) {
          console.warn("[Cookidoo] Pomijanie błędu zdjęcia:", imgErr.message);
        }
      }

      const cookidooUrl = `${this.baseUrl}/created-recipes/${this.language}/${recipeId}`;
      console.log(`[Cookidoo] Sukces! Przepis dodany: ${cookidooUrl}`);

      return {
        success: true,
        recipeId: recipeId,
        title: recipe.title,
        url: cookidooUrl,
        image: uploadedImageInfo?.url || null,
      };
    } catch (err) {
      if (err.status === 403) {
        const msg =
          "Błąd 403: Darmowe konto Cookidoo wymaga aktywnego okresu próbnego (np. 30 dni) lub subskrypcji, aby tworzyć przepisy w chmurze Vorwerk.";
        console.error(msg);
        throw new Error(msg);
      }
      if (err instanceof CookidooRateLimitError) {
        const msg = "Przekroczono limit zapytań do Cookidoo (429 Too Many Requests). Odczekaj chwilę.";
        console.error(msg);
        throw new Error(msg);
      }
      if (err instanceof CookidooError) {
        const bodyStr = err.body ? JSON.stringify(err.body) : err.message;
        console.error(`[Cookidoo Error ${err.status}] Body:`, bodyStr);
        throw new Error(`${err.message} - ${bodyStr}`);
      }
      throw err;
    }
  }

  async importBatch(recipesList, onProgress = null) {
    const results = [];
    for (let i = 0; i < recipesList.length; i++) {
      const recipe = recipesList[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: recipesList.length,
          recipeTitle: recipe.title,
          status: "importing",
        });
      }

      try {
        const res = await this.importRecipe(recipe);
        results.push({ recipe, success: true, result: res });
      } catch (err) {
        results.push({ recipe, success: false, error: err.message });
      }

      if (i < recipesList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    return results;
  }
}

export const CookiputClient = CookiWebImportClient;
