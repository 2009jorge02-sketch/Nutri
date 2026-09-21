/*
NUTRI — script.js
Funciones:
- Buscador de alimentos
- 358 alimentos desde foods.js
- Cálculo de macros y calorías
- Diario de alimentos
- Calorías de mantenimiento
- Objetivos diarios
- Progreso de peso
- Historial
- Persistencia con localStorage
- Navegación
*/

"use strict";

document.addEventListener("DOMContentLoaded", () => {

/* =========================================================
ESTADO
========================================================= */

let selectedFood = null;

let dailyFoods = JSON.parse(
localStorage.getItem("nutri_daily_foods") || "[]"
);

let progressHistory = JSON.parse(
localStorage.getItem("nutri_progress") || "[]"
);

let settings = JSON.parse(
localStorage.getItem("nutri_settings") || "{}"
);

/* =========================================================
UTILIDADES
========================================================= */

const $ = id => document.getElementById(id);

function save() {
localStorage.setItem(
"nutri_daily_foods",
JSON.stringify(dailyFoods)
);

localStorage.setItem(
"nutri_progress",
JSON.stringify(progressHistory)
);

localStorage.setItem(
"nutri_settings",
JSON.stringify(settings)
);
}

function number(value) {
const n = Number(value);
return Number.isFinite(n) ? n : 0;
}

function round(value, decimals = 1) {
const factor = Math.pow(10, decimals);
return Math.round(value * factor) / factor;
}

function format(value, decimals = 1) {
return round(value, decimals).toLocaleString("es-ES");
}

function today() {
return new Date().toISOString().slice(0, 10);
}

/* =========================================================
NAVEGACIÓN
========================================================= */

const navButtons = document.querySelectorAll("[data-page]");

navButtons.forEach(button => {
button.addEventListener("click", () => {
const pageName = button.dataset.page;

document
.querySelectorAll(".page")
.forEach(page => page.classList.remove("active"));

const page = $(`page-${pageName}`);

if (page) {
page.classList.add("active");
}

navButtons.forEach(btn => {
btn.classList.toggle(
"active",
btn.dataset.page === pageName
);
});

window.scrollTo({
top: 0,
behavior: "smooth"
});
});
});

/* =========================================================
REFERENCIA DE ALIMENTOS
========================================================= */

const foodDatabase =
Array.isArray(window.foods)
? window.foods
: (
typeof foods !== "undefined"
? foods
: []
);

function normalizeText(text) {
return String(text || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
BUSCADOR
========================================================= */

const searchInput = $("foodSearch");
const searchResults = $("searchResults");

if (searchInput && searchResults) {

searchInput.addEventListener("input", () => {

const query =
normalizeText(searchInput.value.trim());

searchResults.innerHTML = "";

if (!query) {
return;
}

const terms = query
.split(/\s+/)
.filter(Boolean);

const results = foodDatabase
.filter(food => {

const searchable =
normalizeText(
`${food.name} ${food.brand || ""} ${food.category || ""}`
);

return terms.every(term =>
searchable.includes(term)
);
})
.slice(0, 50);

if (!results.length) {
searchResults.innerHTML = `
<div class="empty">
No se encontraron alimentos.
</div>
`;
return;
}

results.forEach(food => {

const element =
document.createElement("div");

element.className = "food-result";

element.innerHTML = `
<div>
<div class="food-name">
${escapeHTML(food.name)}
</div>

<div class="food-meta">
${escapeHTML(food.category || "Alimento")}
· ${format(food.protein)} g proteína
· ${format(food.carbs)} g HC
· ${format(food.fat)} g grasa
</div>
</div>

<div class="food-cal">
${format(food.calories, 0)} kcal
</div>
`;

element.addEventListener(
"click",
() => selectFood(food)
);

searchResults.appendChild(element);
});
});
}

function selectFood(food) {

selectedFood = food;

const card = $("selectedFoodCard");

if (!card) {
return;
}

card.classList.remove("hidden");

if ($("selectedFoodName")) {
$("selectedFoodName").textContent =
food.name;
}

if ($("selectedFoodInfo")) {
$("selectedFoodInfo").innerHTML = `
<strong>${format(food.calories, 0)} kcal</strong>
· ${format(food.protein)} g proteína
· ${format(food.carbs)} g carbohidratos
· ${format(food.fat)} g grasa
<br>
<span>
Valores por 100 g/ml
</span>
`;
}

if ($("foodGrams")) {
$("foodGrams").value = 100;
}
}

/* =========================================================
AÑADIR ALIMENTO
========================================================= */

const addFoodButton =
$("addFoodButton");

if (addFoodButton) {

addFoodButton.addEventListener(
"click",
() => {

if (!selectedFood) {
return;
}

const grams =
number(
$("foodGrams")
? $("foodGrams").value
: 100
);

if (grams <= 0) {
alert("Introduce una cantidad válida.");
return;
}

dailyFoods.push({
id: Date.now() + Math.random(),
foodId: selectedFood.id,
name: selectedFood.name,
grams,
calories:
selectedFood.calories * grams / 100,
protein:
selectedFood.protein * grams / 100,
carbs:
selectedFood.carbs * grams / 100,
fat:
selectedFood.fat * grams / 100
});

save();

renderDailyFoods();

if ($("foodSearch")) {
$("foodSearch").value = "";
}

if ($("searchResults")) {
$("searchResults").innerHTML = "";
}

if ($("selectedFoodCard")) {
$("selectedFoodCard")
.classList.add("hidden");
}

selectedFood = null;
}
);
}

/* =========================================================
DIARIO
========================================================= */

function renderDailyFoods() {

const list = $("foodList");

if (!list) {
return;
}

list.innerHTML = "";

if (!dailyFoods.length) {

list.innerHTML = `
<div class="empty">
Todavía no has añadido ningún alimento.
</div>
`;

updateDailyTotals();

return;
}

dailyFoods.forEach(item => {

const row =
document.createElement("div");

row.className = "meal";

row.innerHTML = `
<div>
<div class="meal-title">
${escapeHTML(item.name)}
</div>

<div class="meal-meta">
${format(item.grams)} g
· ${format(item.calories, 0)} kcal
· P ${format(item.protein)} g
· C ${format(item.carbs)} g
· G ${format(item.fat)} g
</div>
</div>

<button
class="meal-delete"
type="button"
data-delete-food="${item.id}"
>
Eliminar
</button>
`;

list.appendChild(row);
});

list
.querySelectorAll("[data-delete-food]")
.forEach(button => {

button.addEventListener(
"click",
() => {

const id =
Number(button.dataset.deleteFood);

dailyFoods =
dailyFoods.filter(
item => item.id !== id
);

save();
renderDailyFoods();
}
);
});

updateDailyTotals();
}

function updateDailyTotals() {

const totals = dailyFoods.reduce(
(sum, item) => ({
calories:
sum.calories + number(item.calories),

protein:
sum.protein + number(item.protein),

carbs:
sum.carbs + number(item.carbs),

fat:
sum.fat + number(item.fat)
}),
{
calories: 0,
protein: 0,
carbs: 0,
fat: 0
}
);

if ($("totalCalories")) {
$("totalCalories").textContent =
`${format(totals.calories, 0)} kcal`;
}

if ($("totalProtein")) {
$("totalProtein").textContent =
`${format(totals.protein)} g`;
}

if ($("totalCarbs")) {
$("totalCarbs").textContent =
`${format(totals.carbs)} g`;
}

if ($("totalFat")) {
$("totalFat").textContent =
`${format(totals.fat)} g`;
}

updateGoalBars(totals);
}

const clearButton =
$("clearButton");

if (clearButton) {

clearButton.addEventListener(
"click",
() => {

if (!dailyFoods.length) {
return;
}

if (
!confirm(
"¿Quieres borrar todos los alimentos del día?"
)
) {
return;
}

dailyFoods = [];

save();
renderDailyFoods();
}
);
}

/* =========================================================
CALORÍAS DE MANTENIMIENTO
========================================================= */

const maintenanceButton =
$("calculateMaintenance");

if (maintenanceButton) {

maintenanceButton.addEventListener(
"click",
calculateMaintenance
);
}

function calculateMaintenance() {

const age =
number(
$("maintenanceAge")
? $("maintenanceAge").value
: 0
);

const weight =
number(
$("maintenanceWeight")
? $("maintenanceWeight").value
: 0
);

const height =
number(
$("maintenanceHeight")
? $("maintenanceHeight").value
: 0
);

const sex =
$("maintenanceSex")
? $("maintenanceSex").value
: "male";

const activity =
number(
$("maintenanceActivity")
? $("maintenanceActivity").value
: 1.2
);

if (
age <= 0 ||
weight <= 0 ||
height <= 0
) {
alert(
"Introduce edad, peso y altura."
);
return;
}

/*
Mifflin-St Jeor.
Se presenta como estimación, no como medición exacta.
*/

let bmr;

if (sex === "female") {

bmr =
10 * weight +
6.25 * height -
5 * age -
161;

} else {

bmr =
10 * weight +
6.25 * height -
5 * age +
5;
}

const maintenance =
Math.round(bmr * activity);

settings.maintenance = {
age,
weight,
height,
sex,
activity,
calories: maintenance
};

save();

showMaintenanceResult(
maintenance
);

updateGoalBars();
}

function showMaintenanceResult(
calories
) {

const result =
$("maintenanceResult");

if (result) {
result.classList.remove("hidden");
}

if ($("maintenanceCalories")) {
$("maintenanceCalories").textContent =
`${calories.toLocaleString("es-ES")} kcal`;
}

if ($("maintenanceValue")) {
$("maintenanceValue").textContent =
`${calories.toLocaleString("es-ES")} kcal`;
}
}

function loadMaintenance() {

const data =
settings.maintenance;

if (!data) {
return;
}

if ($("maintenanceAge"))
$("maintenanceAge").value =
data.age;

if ($("maintenanceWeight"))
$("maintenanceWeight").value =
data.weight;

if ($("maintenanceHeight"))
$("maintenanceHeight").value =
data.height;

if ($("maintenanceSex"))
$("maintenanceSex").value =
data.sex;

if ($("maintenanceActivity"))
$("maintenanceActivity").value =
data.activity;

showMaintenanceResult(
data.calories
);
}

/* =========================================================
OBJETIVOS DIARIOS
========================================================= */

function updateGoalBars(totals) {

totals = totals || {
calories: dailyFoods.reduce(
(s, x) => s + number(x.calories),
0
),
protein: dailyFoods.reduce(
(s, x) => s + number(x.protein),
0
),
carbs: dailyFoods.reduce(
(s, x) => s + number(x.carbs),
0
),
fat: dailyFoods.reduce(
(s, x) => s + number(x.fat),
0
)
};

const goals = settings.goals || {};

const mappings = [
["calories", totals.calories, goals.calories],
["protein", totals.protein, goals.protein],
["carbs", totals.carbs, goals.carbs],
["fat", totals.fat, goals.fat]
];

mappings.forEach(
([name, value, goal]) => {

const bar =
$(`goal-${name}`);

const label =
$(`goal-${name}-value`);

if (!bar || !label || !goal) {
return;
}

const percent =
Math.min(
100,
Math.max(
0,
value / goal * 100
)
);

bar.style.width =
`${percent}%`;

label.textContent =
`${format(value)} / ${format(goal)}`;
}
);
}

const saveGoalsButton =
$("saveGoals");

if (saveGoalsButton) {

saveGoalsButton.addEventListener(
"click",
() => {

settings.goals = {
calories:
number(
$("goalCalories")
? $("goalCalories").value
: 0
),

protein:
number(
$("goalProtein")
? $("goalProtein").value
: 0
),

carbs:
number(
$("goalCarbs")
? $("goalCarbs").value
: 0
),

fat:
number(
$("goalFat")
? $("goalFat").value
: 0
)
};

save();
updateDailyTotals();

alert("Objetivos guardados.");
}
);
}

/* =========================================================
PROGRESO
========================================================= */

const addProgress =
$("addProgress");

if (addProgress) {

addProgress.addEventListener(
"click",
() => {

const date =
$("progressDate")
? $("progressDate").value
: today();

const weight =
number(
$("progressWeight")
? $("progressWeight").value
: 0
);

const note =
$("progressNote")
? $("progressNote").value.trim()
: "";

if (!date || weight <= 0) {
alert(
"Introduce una fecha y un peso válido."
);
return;
}

progressHistory.push({
id: Date.now(),
date,
weight,
note
});

progressHistory.sort(
(a,b) =>
new Date(a.date) -
new Date(b.date)
);

save();

if ($("progressWeight"))
$("progressWeight").value = "";

if ($("progressNote"))
$("progressNote").value = "";

renderProgress();

if ($("progressStatus")) {

$("progressStatus").textContent =
"Registro guardado correctamente.";

$("progressStatus")
.classList.remove("hidden");
}
}
);
}

const saveTarget =
$("saveTarget");

if (saveTarget) {

saveTarget.addEventListener(
"click",
() => {

const target =
number(
$("targetWeight")
? $("targetWeight").value
: 0
);

if (target <= 0) {
alert(
"Introduce un objetivo válido."
);
return;
}

settings.targetWeight =
target;

save();

renderProgress();
}
);
}

function renderProgress() {

const historyContainer =
$("progressHistory");

if (!historyContainer) {
updateProgressStats();
return;
}

if (!progressHistory.length) {

historyContainer.innerHTML = `
<div class="empty">
Todavía no hay registros.
</div>
`;

updateProgressStats();

return;
}

const sorted =
[...progressHistory].sort(
(a,b) =>
new Date(b.date) -
new Date(a.date)
);

historyContainer.innerHTML = "";

sorted.forEach(item => {

const row =
document.createElement("div");

row.className = "history-row";

row.innerHTML = `
<div>
<strong>
${new Date(
item.date + "T12:00:00"
).toLocaleDateString("es-ES")}
</strong>

<div class="muted">
${format(item.weight)} kg
${item.note
? ` · ${escapeHTML(item.note)}`
: ""}
</div>
</div>

<button
class="btn btn-danger"
type="button"
data-progress-delete="${item.id}"
>
Eliminar
</button>
`;

historyContainer.appendChild(row);
});

historyContainer
.querySelectorAll(
"[data-progress-delete]"
)
.forEach(button => {

button.addEventListener(
"click",
() => {

const id =
Number(
button.dataset.progressDelete
);

progressHistory =
progressHistory.filter(
item => item.id !== id
);

save();
renderProgress();
}
);
});

updateProgressStats();
}

function updateProgressStats() {

const sorted =
[...progressHistory].sort(
(a,b) =>
new Date(a.date) -
new Date(b.date)
);

const latest =
sorted.length
? sorted[sorted.length - 1]
: null;

const first =
sorted.length
? sorted[0]
: null;

if ($("currentWeight")) {

$("currentWeight").textContent =
latest
? `${format(latest.weight)} kg`
: "—";
}

if ($("startingWeight")) {

$("startingWeight").textContent =
first
? `${format(first.weight)} kg`
: "—";
}

if ($("weightChange")) {

if (first && latest) {

const difference =
latest.weight -
first.weight;

const prefix =
difference > 0 ? "+" : "";

$("weightChange").textContent =
`${prefix}${format(difference)} kg`;

} else {

$("weightChange").textContent =
"—";
}
}

updateProgressBar(
first,
latest
);
}

function updateProgressBar(
first,
latest
) {

const fill =
$("progressFill");

const percentage =
$("progressPercentage");

const summary =
$("progressSummary");

if (
!fill ||
!percentage ||
!summary
) {
return;
}

const target =
number(settings.targetWeight);

if (
!target ||
!first ||
!latest
) {

fill.style.width = "0%";
percentage.textContent = "0%";

summary.textContent =
"Añade un objetivo y registros de peso.";

return;
}

const initialDistance =
Math.abs(
first.weight - target
);

const currentDistance =
Math.abs(
latest.weight - target
);

let progress = 0;

if (initialDistance === 0) {

progress = 100;

} else {

progress =
(
(initialDistance -
currentDistance) /
initialDistance
) * 100;
}

progress =
Math.max(
0,
Math.min(100, progress)
);

fill.style.width =
`${progress}%`;

percentage.textContent =
`${Math.round(progress)}%`;

summary.textContent =
`Actual: ${format(latest.weight)} kg · ` +
`Objetivo: ${format(target)} kg`;
}

const clearProgress =
$("clearProgress");

if (clearProgress) {

clearProgress.addEventListener(
"click",
() => {

if (!progressHistory.length) {
return;
}

if (
!confirm(
"¿Quieres borrar todo el historial?"
)
) {
return;
}

progressHistory = [];

save();
renderProgress();
}
);
}

/* =========================================================
ASISTENTE NUTRI
========================================================= */

const assistantInput =
$("assistantInput");

const assistantButton =
$("assistantButton");

const assistantMessages =
$("assistantMessages");

function addAssistantMessage(
text,
type = "assistant"
) {

if (!assistantMessages) {
return;
}

const message =
document.createElement("div");

message.className =
`assistant-message ${type}`;

message.textContent = text;

assistantMessages.appendChild(
message
);

assistantMessages.scrollTop =
assistantMessages.scrollHeight;
}

function assistantReply(input) {

const q =
normalizeText(input);

const totals =
dailyFoods.reduce(
(sum,item) => ({
calories:
sum.calories +
number(item.calories),

protein:
sum.protein +
number(item.protein),

carbs:
sum.carbs +
number(item.carbs),

fat:
sum.fat +
number(item.fat)
}),
{
calories: 0,
protein: 0,
carbs: 0,
fat: 0
}
);

if (
q.includes("calorias") &&
(
q.includes("hoy") ||
q.includes("llevo") ||
q.includes("comido")
)
) {

return `
Llevas ${format(totals.calories,0)} kcal hoy,
con ${format(totals.protein)} g de proteína,
${format(totals.carbs)} g de carbohidratos
y ${format(totals.fat)} g de grasa.
`.trim();
}

if (
q.includes("mantenimiento") ||
q.includes("mantener")
) {

if (
settings.maintenance &&
settings.maintenance.calories
) {

return `
Tu última estimación guardada de mantenimiento es de
${format(settings.maintenance.calories,0)} kcal/día.
`.trim();

}

return `
Todavía no tienes calculado el mantenimiento.
Puedes hacerlo desde la sección "Mantenimiento".
`.trim();
}

if (
q.includes("proteina") ||
q.includes("proteína")
) {

return `
Actualmente llevas ${format(totals.protein)} g de proteína hoy.
`.trim();
}

if (
q.includes("carbohidrato") ||
q.includes("carbohidratos")
) {

return `
Actualmente llevas ${format(totals.carbs)} g de carbohidratos hoy.
`.trim();
}

if (
q.includes("grasa") ||
q.includes("grasas")
) {

return `
Actualmente llevas ${format(totals.fat)} g de grasa hoy.
`.trim();
}

if (
q.includes("progreso") ||
q.includes("peso")
) {

if (!progressHistory.length) {

return `
Todavía no tienes registros de peso.
`.trim();
}

const latest =
[...progressHistory].sort(
(a,b) =>
new Date(b.date) -
new Date(a.date)
)[0];

return `
Tu último registro es de ${format(latest.weight)} kg,
del ${new Date(
latest.date + "T12:00:00"
).toLocaleDateString("es-ES")}.
`.trim();
}

if (
q.includes("hola") ||
q.includes("buenas")
) {

return `
¡Hola! Puedo ayudarte a consultar tus calorías,
macros, mantenimiento y progreso dentro de Nutri.
`.trim();
}

return `
Puedo consultar tus alimentos del día,
calorías, proteínas, carbohidratos, grasas,
mantenimiento y progreso.
`.trim();
}

function sendAssistant() {

if (!assistantInput) {
return;
}

const text =
assistantInput.value.trim();

if (!text) {
return;
}

addAssistantMessage(
text,
"user"
);

assistantInput.value = "";

setTimeout(
() => {
addAssistantMessage(
assistantReply(text),
"assistant"
);
},
120
);
}

if (assistantButton) {

assistantButton.addEventListener(
"click",
sendAssistant
);
}

if (assistantInput) {

assistantInput.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {
event.preventDefault();
sendAssistant();
}
}
);
}

/* =========================================================
EXPORTAR DATOS
========================================================= */

const exportButton =
$("exportData");

if (exportButton) {

exportButton.addEventListener(
"click",
() => {

const data = {
foods: dailyFoods,
progress: progressHistory,
settings
};

const blob =
new Blob(
[
JSON.stringify(
data,
null,
2
)
],
{
type:
"application/json"
}
);

const url =
URL.createObjectURL(blob);

const link =
document.createElement("a");

link.href = url;

link.download =
"nutri-datos.json";

link.click();

URL.revokeObjectURL(url);
}
);
}

/* =========================================================
IMPORTAR DATOS
========================================================= */

const importInput =
$("importData");

if (importInput) {

importInput.addEventListener(
"change",
event => {

const file =
event.target.files[0];

if (!file) {
return;
}

const reader =
new FileReader();

reader.onload = () => {

try {

const data =
JSON.parse(
reader.result
);

if (
Array.isArray(
data.foods
)
) {
dailyFoods =
data.foods;
}

if (
Array.isArray(
data.progress
)
) {
progressHistory =
data.progress;
}

if (
data.settings &&
typeof data.settings ===
"object"
) {
settings =
data.settings;
}

save();

renderDailyFoods();
renderProgress();
loadMaintenance();

alert(
"Datos importados correctamente."
);

} catch (error) {

alert(
"El archivo no tiene un formato válido."
);
}
};

reader.readAsText(file);
}
);
}

/* =========================================================
ESCAPE HTML
========================================================= */

function escapeHTML(value) {

return String(value ?? "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");
}

/* =========================================================
INICIALIZACIÓN
========================================================= */

function initializeInputs() {

if ($("progressDate")) {
$("progressDate").value =
today();
}

if (
settings.targetWeight &&
$("targetWeight")
) {

$("targetWeight").value =
settings.targetWeight;
}

if (
settings.goals
) {

if ($("goalCalories"))
$("goalCalories").value =
settings.goals.calories || "";

if ($("goalProtein"))
$("goalProtein").value =
settings.goals.protein || "";

if ($("goalCarbs"))
$("goalCarbs").value =
settings.goals.carbs || "";

if ($("goalFat"))
$("goalFat").value =
settings.goals.fat || "";
}
}

initializeInputs();
loadMaintenance();
renderDailyFoods();
renderProgress();

});
