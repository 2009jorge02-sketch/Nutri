document.addEventListener("DOMContentLoaded", () => {

// =========================
// ELEMENTOS DE LA PÁGINA
// =========================

const searchInput = document.getElementById("foodSearch");
const searchResults = document.getElementById("searchResults");

const selectedFoodName = document.getElementById("selectedFoodName");
const gramsInput = document.getElementById("grams");
const foodCalories = document.getElementById("foodCalories");
const foodProtein = document.getElementById("foodProtein");
const foodCarbs = document.getElementById("foodCarbs");
const foodFat = document.getElementById("foodFat");

const addFoodButton = document.getElementById("addFood");

const dailyFoodsContainer = document.getElementById("dailyFoods");

const totalCalories = document.getElementById("totalCalories");
const totalProtein = document.getElementById("totalProtein");
const totalCarbs = document.getElementById("totalCarbs");
const totalFat = document.getElementById("totalFat");


// =========================
// COMPROBAR BASE DE DATOS
// =========================

if (typeof foods === "undefined" || !Array.isArray(foods)) {
console.error("No se ha podido cargar foods.js");
return;
}

console.log("Base de datos cargada:", foods.length, "alimentos");


// =========================
// VARIABLES
// =========================

let selectedFood = null;
let dailyFoods = [];


// =========================
// BUSCADOR
// =========================

if (searchInput) {

searchInput.addEventListener("input", () => {

const search = normalizeText(searchInput.value.trim());

if (!search) {
if (searchResults) {
searchResults.innerHTML = "";
}
return;
}

const results = foods
.filter(food => {

const name = normalizeText(food.name || "");
const brand = normalizeText(food.brand || "");
const category = normalizeText(food.category || "");

return (
name.includes(search) ||
brand.includes(search) ||
category.includes(search)
);

})
.slice(0, 30);

renderSearchResults(results);
});
}


// =========================
// MOSTRAR RESULTADOS
// =========================

function renderSearchResults(results) {

if (!searchResults) return;

searchResults.innerHTML = "";

if (results.length === 0) {

searchResults.innerHTML = `
<div class="no-results">
No se han encontrado alimentos
</div>
`;

return;
}

results.forEach(food => {

const result = document.createElement("div");

result.className = "food-result";

result.innerHTML = `
<strong>${escapeHTML(food.name)}</strong>
${food.brand ? `<span>${escapeHTML(food.brand)}</span>` : ""}
<small>
${formatNumber(food.calories)} kcal ·
${formatNumber(food.protein)} g proteína
</small>
`;

result.addEventListener("click", () => {
selectFood(food);
});

searchResults.appendChild(result);
});
}


// =========================
// SELECCIONAR ALIMENTO
// =========================

function selectFood(food) {

selectedFood = food;

if (selectedFoodName) {
selectedFoodName.textContent = food.name;
}

if (gramsInput) {
gramsInput.value = 100;
}

if (searchResults) {
searchResults.innerHTML = "";
}

if (searchInput) {
searchInput.value = food.name;
}

updateFoodCalculation();
}


// =========================
// CALCULAR MACROS
// =========================

function updateFoodCalculation() {

if (!selectedFood) return;

const grams = Number(gramsInput?.value) || 0;

const multiplier = grams / 100;

const calories = selectedFood.calories * multiplier;
const protein = selectedFood.protein * multiplier;
const carbs = selectedFood.carbs * multiplier;
const fat = selectedFood.fat * multiplier;


if (foodCalories) {
foodCalories.textContent = `${formatNumber(calories)} kcal`;
}

if (foodProtein) {
foodProtein.textContent = `${formatNumber(protein)} g`;
}

if (foodCarbs) {
foodCarbs.textContent = `${formatNumber(carbs)} g`;
}

if (foodFat) {
foodFat.textContent = `${formatNumber(fat)} g`;
}
}


// =========================
// CAMBIAR GRAMOS
// =========================

if (gramsInput) {
gramsInput.addEventListener("input", updateFoodCalculation);
}


// =========================
// AÑADIR AL DÍA
// =========================

if (addFoodButton) {

addFoodButton.addEventListener("click", () => {

if (!selectedFood) {
alert("Primero selecciona un alimento.");
return;
}

const grams = Number(gramsInput?.value) || 0;

if (grams <= 0) {
alert("Introduce una cantidad válida.");
return;
}

dailyFoods.push({
id: generateId(),
food: selectedFood,
grams: grams
});

renderDailyFoods();
updateDailyTotals();

});
}


// =========================
// MOSTRAR ALIMENTOS DEL DÍA
// =========================

function renderDailyFoods() {

if (!dailyFoodsContainer) return;

dailyFoodsContainer.innerHTML = "";

if (dailyFoods.length === 0) {

dailyFoodsContainer.innerHTML = `
<div class="empty-day">
Todavía no has añadido alimentos.
</div>
`;

return;
}

dailyFoods.forEach(item => {

const food = item.food;
const grams = item.grams;

const multiplier = grams / 100;

const calories = food.calories * multiplier;
const protein = food.protein * multiplier;
const carbs = food.carbs * multiplier;
const fat = food.fat * multiplier;


const element = document.createElement("div");

element.className = "daily-food";

element.innerHTML = `
<div class="daily-food-info">

<strong>${escapeHTML(food.name)}</strong>

<span>${formatNumber(grams)} g</span>

<small>
${formatNumber(calories)} kcal ·
${formatNumber(protein)} P ·
${formatNumber(carbs)} C ·
${formatNumber(fat)} G
</small>

</div>

<button
class="remove-food"
data-id="${item.id}"
type="button"
>
Eliminar
</button>
`;


const removeButton = element.querySelector(".remove-food");

removeButton.addEventListener("click", () => {
removeFoodFromDay(item.id);
});


dailyFoodsContainer.appendChild(element);

});
}


// =========================
// ELIMINAR ALIMENTO
// =========================

function removeFoodFromDay(id) {

dailyFoods = dailyFoods.filter(item => item.id !== id);

renderDailyFoods();
updateDailyTotals();
}


// =========================
// TOTALES DEL DÍA
// =========================

function updateDailyTotals() {

let calories = 0;
let protein = 0;
let carbs = 0;
let fat = 0;


dailyFoods.forEach(item => {

const multiplier = item.grams / 100;

calories += item.food.calories * multiplier;
protein += item.food.protein * multiplier;
carbs += item.food.carbs * multiplier;
fat += item.food.fat * multiplier;

});


if (totalCalories) {
totalCalories.textContent = `${formatNumber(calories)} kcal`;
}

if (totalProtein) {
totalProtein.textContent = `${formatNumber(protein)} g`;
}

if (totalCarbs) {
totalCarbs.textContent = `${formatNumber(carbs)} g`;
}

if (totalFat) {
totalFat.textContent = `${formatNumber(fat)} g`;
}
}


// =========================
// UTILIDADES
// =========================

function normalizeText(text) {

return text
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");

}


function formatNumber(number) {

if (!Number.isFinite(number)) {
return "0";
}

return Number(number.toFixed(1)).toString();

}


function escapeHTML(text) {

return String(text)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");

}


function generateId() {

if (
typeof crypto !== "undefined" &&
typeof crypto.randomUUID === "function"
) {
return crypto.randomUUID();
}

return Date.now().toString() + Math.random().toString(16).slice(2);

}


// =========================
// INICIALIZAR
// =========================

renderDailyFoods();
updateDailyTotals();

});

