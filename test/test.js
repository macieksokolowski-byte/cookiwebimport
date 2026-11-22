import test from "node:test";
import assert from "node:assert/strict";
import { RECIPES } from "../src/recipesData.js";
import { buildStep, parseRawRecipeText } from "../src/recipeParser.js";
import { generateOfflineCookbookHtml } from "../src/exportOffline.js";

test("Baza przepisów powinna zawierać poprawne rekordy dla Pizzy i Bezglutenowych", () => {
  assert.ok(RECIPES.length >= 10, "Powinno być co najmniej 10 przepisów");

  const pizza = RECIPES.filter((r) => r.category === "pizza");
  const glutenFree = RECIPES.filter((r) => r.category === "gluten-free");

  assert.ok(pizza.length >= 4, "Powinno być co najmniej 4 przepisy na pizzę");
  assert.ok(glutenFree.length >= 6, "Powinno być co najmniej 6 przepisów bezglutenowych");

  RECIPES.forEach((recipe) => {
    assert.ok(recipe.id, `Przepis bez ID: ${JSON.stringify(recipe)}`);
    assert.ok(recipe.title, `Przepis bez tytułu: ${recipe.id}`);
    assert.ok(Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0, `Brak składników w: ${recipe.id}`);
    assert.ok(Array.isArray(recipe.instructions) && recipe.instructions.length > 0, `Brak kroków w: ${recipe.id}`);
    assert.ok(typeof recipe.prepTime === "number", `prepTime nie jest liczbą w: ${recipe.id}`);
    assert.ok(typeof recipe.totalTime === "number", `totalTime nie jest liczbą w: ${recipe.id}`);
  });
});

test("Parser kroków (buildStep) powinien poprawnie generować adnotacje TTS", () => {
  const stepText = "Do naczynia wlej 300 g wody, podgrzej 2 min/37°C/obr. 2.";
  const step = buildStep(stepText);

  assert.equal(step.text, stepText);
  assert.ok(Array.isArray(step.annotations));
  assert.ok(step.annotations.length > 0, "Powinno wykryć nastawę TM");

  const ttsAnn = step.annotations.find((a) => a.type === "TTS");
  assert.ok(ttsAnn, "Powinno zawierać typ TTS");
  assert.equal(ttsAnn.data.time, 120, "2 minuty = 120 sekund");
  assert.equal(ttsAnn.data.temperature.value, "37");
  assert.equal(ttsAnn.data.speed, "2");
});

test("Generator HTML offline powinien stworzyć pełny dokument z przepisami", () => {
  const html = generateOfflineCookbookHtml(RECIPES);
  assert.ok(html.includes("<!DOCTYPE html>"));
  assert.ok(html.includes("Włoskie ciasto na pizzę neapolitańską"));
  assert.ok(html.includes("Chrupiąca pizza bezglutenowa"));
  assert.ok(html.includes("Puszysty chleb bezglutenowy z ziarnami"));
});

test("Parser surowego tekstu powinien wyodrębnić tytuł, składniki i kroki", () => {
  const rawText = `
    Moja Domowa Pizza
    Składniki:
    - 500 g mąki
    - 300 g wody
    - 1 łyżeczka soli
    Przygotowanie:
    1. Wlej wodę i dodaj drożdże 2 min/37°C/obr. 2.
    2. Wyrabiaj ciasto 3 min/obr. 4.
  `;

  const parsed = parseRawRecipeText(rawText);
  assert.equal(parsed.title, "Moja Domowa Pizza");
  assert.equal(parsed.ingredients.length, 3);
  assert.equal(parsed.instructions.length, 2);
});
