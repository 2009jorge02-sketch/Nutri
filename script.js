// ======================================================
// NUTRI - SCRIPT PRINCIPAL
// ======================================================

// La base de datos se carga desde foods.js
// y debe existir como variable global: foods

let selectedFood = null;
let dailyFoods = [];


// ======================================================
// ELEMENTOS DE LA WEB
// ======================================================

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const selectedFoodContainer = document.getElementById("selectedFood");

const amountSection = document.getElementById("amountSection");
const amountInput = document.getElementById("amountInput");
const amountUnit = document.getElementById("amountUnit");

const foodCalories = document.getElementById("foodCalories");
const foodProtein = document.getElementById("foodProtein");
const foodCarbs = document.getElementById("foodCarbs");
const foodFat = document.getElementById("foodFat");

const addFoodButton = document.getElementById("addFoodButton");

const totalCalories = document.getElementById("totalCalories");
const totalProtein = document.getElementById("totalProtein");
const totalCarbs = document.getElementById("totalCarbs");
const totalFat = document.getElementById("totalFat");

const dailyFoodsContainer = document.getElementById("dailyFoods");


// ======================================================
// COMPROBAR BASE DE DATOS
// ======================================================

if (!Array.isArray(window.foods)) {

console.error(
"No se ha encontrado la base de datos 'foods'. " +
"Comprueba que foods.js está cargado correctamente."
);

searchResults.innerHTML = `
<p class="empty-message">
No se ha podido cargar la base de datos de alimentos.
</p>
`;

} else {

console.log(
`Nutri: ${foods.length.toLocaleString("es-ES")} alimentos cargados.`
);

}


// ======================================================
// BUSCADOR
// ======================================================

let searchTimeout = null;

searchInput.addEventListener("input", function () {

const query = searchInput.value
.trim()
.toLowerCase();

clearTimeout(searchTimeout);

searchTimeout = setTimeout(() => {

searchFoods(query);

}, 120);

});


// ======================================================
// BUSCAR ALIMENTOS
// ======================================================

function searchFoods(query) {

if (!Array.isArray(window.foods)) {
return;
}

if (query.length === 0) {

searchResults.innerHTML = `
<p class="empty-message">
Escribe para buscar un alimento.
</p>
`;

return;
}


if (query.length < 2) {

searchResults.innerHTML = `
<p class="empty-message">
Escribe al menos 2 caracteres.
</p>
`;

return;
}


const normalizedQuery = normalizeText(query);

const words = normalizedQuery
.split(/\s+/)
.filter(Boolean);


const results = [];


// Primero buscamos coincidencias exactas o muy relevantes
for (const food of foods) {

if (!food || !food.name) {
continue;
}

const name = normalizeText(food.name);
const brand = normalizeText(food.brand || "");
const category = normalizeText(food.category || "");


let score = 0;


// Nombre empieza por la búsqueda
if (name.startsWith(normalizedQuery)) {
score += 100;
}

// El nombre contiene la búsqueda
else if (name.includes(normalizedQuery)) {
score += 70;
}


// Marca
if (brand.includes(normalizedQuery)) {
score += 35;
}


// Categoría
if (category.includes(normalizedQuery)) {
score += 20;
}


// Comprobar cada palabra
let allWordsFound = true;

for (const word of words) {

if (
!name.includes(word) &&
!brand.includes(word) &&
!category.includes(word)
) {
allWordsFound = false;
break;
}

}

if (allWordsFound) {
score += 40;
}


if (score > 0) {

results.push({
food,
score
});

}


// No necesitamos recorrer millones de resultados
// una vez tenemos suficientes candidatos.
}


results.sort((a, b) => {

if (b.score !== a.score) {
return b.score - a.score;
}

return a.food.name.localeCompare(
b.food.name,
"es"
);

});


const limitedResults = results
.slice(0, 50)
.map(result => result.food);


renderSearchResults(
limitedResults,
results.length
);

}


// ======================================================
// NORMALIZAR TEXTO
// ======================================================

function normalizeText(text) {

return String(text)
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();

}


// ======================================================
// MOSTRAR RESULTADOS
// ======================================================

function renderSearchResults(results, totalMatches) {

if (results.length === 0) {

searchResults.innerHTML = `
<p class="empty-message">
No se ha encontrado ningún alimento.
</p>
`;

return;
}


searchResults.innerHTML = "";


results.forEach(food => {

const item = document.createElement("div");

item.className = "food";

item.innerHTML = `

<div class="food-name">
${escapeHTML(food.name)}
</div>

<div class="food-info">

${food.brand
? escapeHTML(food.brand) + " · "
: ""
}

${Number(food.calories || 0).toFixed(0)} kcal

·

${Number(food.protein || 0).toFixed(1)} g proteína

·

${Number(food.carbs || 0).toFixed(1)} g carbohidratos

·

${Number(food.fat || 0).toFixed(1)} g grasa

<span>
/ 100 g
</span>

</div>
`;


item.addEventListener("click", () => {

selectFood(food);

});


searchResults.appendChild(item);

});


if (totalMatches > results.length) {

const info = document.createElement("p");

info.className = "empty-message";

info.textContent =
`Mostrando ${results.length} de ` +
`${totalMatches.toLocaleString("es-ES")} resultados. ` +
`Sigue escribiendo para afinar la búsqueda.`;

searchResults.appendChild(info);

}

}


// ======================================================
// SELECCIONAR ALIMENTO
// ======================================================

function selectFood(food) {

selectedFood = food;


const brandHTML = food.brand
? `
<div class="food-selected-brand">
${escapeHTML(food.brand)}
</div>
`
: "";


const categoryHTML = food.category
? `
<div class="food-selected-category">
${escapeHTML(food.category)}
</div>
`
: "";


selectedFoodContainer.innerHTML = `

<div class="selected-food-card">

<h3>
${escapeHTML(food.name)}
</h3>

${brandHTML}

${categoryHTML}

<div class="selected-food-nutrition">

<div>
<strong>
${formatNumber(food.calories)}
</strong>
<span>kcal / 100 g</span>
</div>

<div>
<strong>
${formatNumber(food.protein)} g
</strong>
<span>proteína</span>
</div>

<div>
<strong>
${formatNumber(food.carbs)} g
</strong>
<span>carbohidratos</span>
</div>

<div>
<strong>
${formatNumber(food.fat)} g
</strong>
<span>grasas</span>
</div>

</div>

</div>
`;


amountSection.style.display = "block";

amountInput.value = 100;

updateFoodCalculation();

}


// ======================================================
// CAMBIAR CANTIDAD
// ======================================================

amountInput.addEventListener(
"input",
updateFoodCalculation
);


function updateFoodCalculation() {

if (!selectedFood) {
return;
}


let amount = Number(
amountInput.value
);


if (!Number.isFinite(amount) || amount < 0) {
amount = 0;
}


const multiplier = amount / 100;


const calories =
Number(selectedFood.calories || 0)
* multiplier;


const protein =
Number(selectedFood.protein || 0)
* multiplier;


const carbs =
Number(selectedFood.carbs || 0)
* multiplier;


const fat =
Number(selectedFood.fat || 0)
* multiplier;


foodCalories.textContent =
formatNumber(calories);


foodProtein.textContent =
formatNumber(protein);


foodCarbs.textContent =
formatNumber(carbs);


foodFat.textContent =
formatNumber(fat);

}


// ======================================================
// AÑADIR ALIMENTACIÓN AL DÍA
// ======================================================

addFoodButton.addEventListener(
"click",
addFoodToDay
);


function addFoodToDay() {

if (!selectedFood) {
return;
}


let amount = Number(
amountInput.value
);


if (!Number.isFinite(amount) || amount <= 0) {

alert(
"Introduce una cantidad válida."
);

return;
}


const multiplier = amount / 100;


const dailyFood = {

id:
selectedFood.id ||
crypto.randomUUID(),

name:
selectedFood.name,

brand:
selectedFood.brand || "",

amount:
amount,

calories:
Number(selectedFood.calories || 0)
* multiplier,

protein:
Number(selectedFood.protein || 0)
* multiplier,

carbs:
Number(selectedFood.carbs || 0)
* multiplier,

fat:
Number(selectedFood.fat || 0)
* multiplier

};


dailyFoods.push(dailyFood);


renderDailyFoods();

updateDailyTotals();

}


// ======================================================
// MOSTRAR ALIMENTOS DEL DÍA
// ======================================================

function renderDailyFoods() {

if (dailyFoods.length === 0) {

dailyFoodsContainer.innerHTML = `
<p class="empty-message">
Todavía no has añadido ningún alimento.
</p>
`;

return;
}


dailyFoodsContainer.innerHTML = "";


dailyFoods.forEach((food, index) => {

const row = document.createElement("div");

row.className = "food-row";


row.innerHTML = `

<div class="food-row-info">

<strong>
${escapeHTML(food.name)}
</strong>

${
food.brand
? `<small>${escapeHTML(food.brand)}</small>`
: ""
}

<span>
${formatNumber(food.amount)} g
</span>

<span>
${formatNumber(food.calories)} kcal
</span>

</div>


<button
type="button"
class="remove"
data-index="${index}"
>
Eliminar
</button>
`;


const removeButton =
row.querySelector(".remove");


removeButton.addEventListener(
"click",
() => {

removeFoodFromDay(index);

}
);


dailyFoodsContainer.appendChild(row);

});

}


// ======================================================
// ELIMINAR ALIMENTO
// ======================================================

function removeFoodFromDay(index) {

dailyFoods.splice(index, 1);

renderDailyFoods();

updateDailyTotals();

}


// ======================================================
// TOTALES DIARIOS
// ======================================================

function updateDailyTotals() {

let calories = 0;
let protein = 0;
let carbs = 0;
let fat = 0;


dailyFoods.forEach(food => {

calories += Number(
food.calories || 0
);

protein += Number(
food.protein || 0
);

carbs += Number(
food.carbs || 0
);

fat += Number(
food.fat || 0
);

});


totalCalories.textContent =
formatNumber(calories);


totalProtein.textContent =
formatNumber(protein);


totalCarbs.textContent =
formatNumber(carbs);


totalFat.textContent =
formatNumber(fat);

}


// ======================================================
// FORMATEAR NÚMEROS
// ======================================================

function formatNumber(number) {

const value = Number(number);


if (!Number.isFinite(value)) {
return "0";
}


return value.toLocaleString(
"es-ES",
{
minimumFractionDigits: 0,
maximumFractionDigits: 1
}
);

}


// ======================================================
// SEGURIDAD HTML
// ======================================================

function escapeHTML(value) {

return String(value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");

}


// ======================================================
// INICIO
// ======================================================

renderDailyFoods();

updateDailyTotals();

console.log("Nutri iniciado correctamente.");
