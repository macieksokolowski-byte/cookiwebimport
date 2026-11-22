import { findTtsAnnotations, grammarPl, step } from "@recode-software/cookidoo-api";

/**
 * Przetwarza ciąg tekstowy instrukcji na strukturę kroku Cookidoo (Step)
 * z prawidłowymi, natywnymi adnotacjami dotykowymi TTS (czas / temperatura / obroty / kierunek).
 * 
 * Unikamy generowania adnotacji VOLUME ze sztucznymi wartościami undefined/null,
 * które powodowały błąd 400 Bad Request w API Cookidoo.
 */
export function buildStep(instructionText) {
  if (!instructionText || typeof instructionText !== "string") {
    return step("", []);
  }

  const cleanText = instructionText.trim();

  try {
    // Generujemy natywne przyciski TTS (czas, temp, obr., kierunek)
    const ttsAnnotations = findTtsAnnotations(cleanText, grammarPl);
    return step(cleanText, ttsAnnotations);
  } catch (err) {
    console.warn(`[recipeParser] Nie udało się sparsować adnotacji dla: "${cleanText}". Używam tekstu:`, err.message);
    return step(cleanText, []);
  }
}

/**
 * Parsuje surowy tekst przepisu wklejony przez użytkownika (np. z bloga lub notatek)
 * i rozdziela go na tytuł, składniki oraz kroki przygotowania.
 */
export function parseRawRecipeText(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error("Pusty tekst przepisu.");
  }

  let title = lines[0].replace(/^[#\s*]+/, "").trim();
  const ingredients = [];
  const instructions = [];

  let currentSection = "meta"; // 'meta', 'ingredients', 'instructions'

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    if (
      lower.includes("składnik") ||
      lower.includes("skladnik") ||
      lower.includes("ingredients") ||
      lower === "co potrzeba:"
    ) {
      currentSection = "ingredients";
      continue;
    }

    if (
      lower.includes("przygotowanie") ||
      lower.includes("instrukcj") ||
      lower.includes("sposób wykonania") ||
      lower.includes("kroki") ||
      lower.includes("wykonanie")
    ) {
      currentSection = "instructions";
      continue;
    }

    if (currentSection === "ingredients") {
      const cleanLine = line.replace(/^[-*•\d.)\s]+/, "").trim();
      if (cleanLine) {
        ingredients.push(cleanLine);
      }
    } else if (currentSection === "instructions") {
      const cleanLine = line.replace(/^[\d.)\s]+/, "").trim();
      if (cleanLine) {
        instructions.push(cleanLine);
      }
    } else {
      if (/^\d+\s*(g|kg|ml|l|łyżk|łyżecz|szklan|ząb|szt)/i.test(line) || /^[-*•]/.test(line)) {
        currentSection = "ingredients";
        ingredients.push(line.replace(/^[-*•\s]+/, "").trim());
      } else if (instructions.length > 0 || /^\d+\./.test(line)) {
        currentSection = "instructions";
        instructions.push(line.replace(/^[\d.)\s]+/, "").trim());
      }
    }
  }

  // Fallback jeśli nie wykryto sekcji
  if (ingredients.length === 0 && instructions.length === 0) {
    instructions.push(...lines.slice(1));
  }

  return {
    title,
    ingredients,
    instructions,
  };
}
