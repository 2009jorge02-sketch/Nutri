"use strict";

/*
=========================================================
NUTRI — SCRIPT PRINCIPAL
=========================================================

Incluye:

- Alimentación
- Base de alimentos desde foods.js
- Calorías y macros
- Objetivos
- Mantenimiento
- Progreso de peso
- Entrenamientos
- Rutinas
- Ejercicios personalizados
- Unilateral / bilateral
- Series
- Repeticiones
- Peso
- RIR
- Historial
- Progresión por ejercicio
- Asistente local
- Importación / exportación
- LocalStorage
=========================================================
*/

document.addEventListener("DOMContentLoaded", () => {

/* =====================================================
BASE DE ALIMENTOS
===================================================== */

const FOOD_DATABASE =
typeof foods !== "undefined"
? foods
: (window.foods || []);

/* =====================================================
STORAGE
===================================================== */

const STORAGE_KEY = "nutri_complete_app_v1";

const defaultState = {
dailyFoods: [],
goals: {
calories: 2300,
protein: 130,
carbs: 250,
fat: 70
},

maintenance: {
calories: 0,
bmr: 0,
data: {}
},

progress: [],
targetWeight: null,

customExercises: [],

routines: [],

workouts: [],

currentWorkout: [],

settings: {}
};

function loadState() {
try {
const saved = localStorage.getItem(STORAGE_KEY);

if (!saved) {
return structuredClone(defaultState);
}

const parsed = JSON.parse(saved);

return {
...structuredClone(defaultState),
...parsed,
goals: {
...defaultState.goals,
...(parsed.goals || {})
},
maintenance: {
...defaultState.maintenance,
...(parsed.maintenance || {})
}
};

} catch (error) {
console.error("Error cargando datos:", error);
return structuredClone(defaultState);
}
}

let state = loadState();

function saveState() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* =====================================================
HELPERS
===================================================== */

const $ = id => document.getElementById(id);

function number(value) {
const n = Number(value);
return Number.isFinite(n) ? n : 0;
}

function round(value, decimals = 1) {
const multiplier = 10 ** decimals;
return Math.round((number(value) + Number.EPSILON) * multiplier) / multiplier;
}

function today() {
const d = new Date();

const year = d.getFullYear();
const month = String(d.getMonth() + 1).padStart(2, "0");
const day = String(d.getDate()).padStart(2, "0");

return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
if (!dateString) return "—";

const d = new Date(dateString + "T12:00:00");

return d.toLocaleDateString("es-ES", {
day: "2-digit",
month: "2-digit",
year: "numeric"
});
}

function uid(prefix = "id") {
return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHTML(value) {
return String(value ?? "")
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}

function normalize(text) {
return String(text || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");
}

/* =====================================================
NAVEGACIÓN
===================================================== */

document.querySelectorAll("[data-page]").forEach(button => {

button.addEventListener("click", () => {

const page = button.dataset.page;

document.querySelectorAll(".page").forEach(section => {
section.classList.remove("active");
});

const target = $(`page-${page}`);

if (target) {
target.classList.add("active");
}

document.querySelectorAll("[data-page]").forEach(item => {
item.classList.toggle(
"active",
item.dataset.page === page
);
});

window.scrollTo({
top: 0,
behavior: "smooth"
});
});
});

/* =====================================================
ALIMENTACIÓN
===================================================== */

let selectedFood = null;

function renderFoodSearch() {

const input = $("foodSearch");

if (!input) return;

const query = normalize(input.value);

const container = $("searchResults");

if (!query) {
container.innerHTML = "";
return;
}

const results = FOOD_DATABASE
.filter(food => {
return normalize(food.name).includes(query) ||
normalize(food.category).includes(query);
})
.slice(0, 25);

if (!results.length) {
container.innerHTML =
`<div class="empty">No se encontraron alimentos.</div>`;
return;
}

container.innerHTML = results.map(food => `
<div class="food-result">
<div>
<strong>${escapeHTML(food.name)}</strong>
<small>
${food.calories} kcal ·
P ${food.protein} g ·
C ${food.carbs} g ·
G ${food.fat} g
</small>
</div>

<button
class="btn small select-food"
data-id="${food.id}">
Seleccionar
</button>
</div>
`).join("");

container.querySelectorAll(".select-food").forEach(button => {

button.addEventListener("click", () => {

const food = FOOD_DATABASE.find(
item => String(item.id) === String(button.dataset.id)
);

selectedFood = food || null;

renderSelectedFood();
});

});
}

function renderSelectedFood() {

const box = $("selectedFoodBox");

if (!selectedFood) {
box.innerHTML = "";
return;
}

box.innerHTML = `
<div class="selected-food">
<strong>${escapeHTML(selectedFood.name)}</strong>

<div style="color:#8f9ab5;margin-top:5px;font-size:13px">
${selectedFood.calories} kcal /
${selectedFood.protein} g proteína /
${selectedFood.carbs} g carbohidratos /
${selectedFood.fat} g grasa por 100 g
</div>
</div>
`;
}

function addFood() {

if (!selectedFood) {
alert("Selecciona primero un alimento.");
return;
}

const amount = number($("foodAmount").value);

if (amount <= 0) {
alert("Introduce una cantidad válida.");
return;
}

const factor = amount / 100;

state.dailyFoods.push({
id: uid("food"),
date: today(),
foodId: selectedFood.id,
name: selectedFood.name,
amount,

calories: round(selectedFood.calories * factor),
protein: round(selectedFood.protein * factor),
carbs: round(selectedFood.carbs * factor),
fat: round(selectedFood.fat * factor)
});

saveState();

$("foodAmount").value = 100;

renderFoodTable();
updateFoodTotals();
updateDashboard();
}

function renderFoodTable() {

const tbody = $("foodTable");

if (!tbody) return;

if (!state.dailyFoods.length) {

tbody.innerHTML = `
<tr>
<td colspan="7">
<div class="empty">
Todavía no has añadido alimentos.
</div>
</td>
</tr>
`;

return;
}

tbody.innerHTML = state.dailyFoods.map(food => `
<tr>
<td>${escapeHTML(food.name)}</td>
<td>${round(food.amount)} g</td>
<td>${round(food.calories)}</td>
<td>${round(food.protein)} g</td>
<td>${round(food.carbs)} g</td>
<td>${round(food.fat)} g</td>
<td>
<button
class="btn danger small delete-food"
data-id="${food.id}">
×
</button>
</td>
</tr>
`).join("");

tbody.querySelectorAll(".delete-food").forEach(button => {

button.addEventListener("click", () => {

state.dailyFoods = state.dailyFoods.filter(
food => food.id !== button.dataset.id
);

saveState();

renderFoodTable();
updateFoodTotals();
updateDashboard();
});

});
}

function getFoodTotals() {

return state.dailyFoods.reduce(
(total, food) => {

total.calories += number(food.calories);
total.protein += number(food.protein);
total.carbs += number(food.carbs);
total.fat += number(food.fat);

return total;

},
{
calories: 0,
protein: 0,
carbs: 0,
fat: 0
}
);
}

function updateFoodTotals() {

const totals = getFoodTotals();

$("foodCalories").textContent =
round(totals.calories);

$("foodProtein").textContent =
`${round(totals.protein)} g`;

$("foodCarbs").textContent =
`${round(totals.carbs)} g`;

$("foodFat").textContent =
`${round(totals.fat)} g`;
}

$("foodSearch")?.addEventListener(
"input",
renderFoodSearch
);

$("addFoodBtn")?.addEventListener(
"click",
addFood
);

$("clearFoodsBtn")?.addEventListener(
"click",
() => {

if (!confirm("¿Vaciar todos los alimentos del día?")) {
return;
}

state.dailyFoods = [];

saveState();

renderFoodTable();
updateFoodTotals();
updateDashboard();
}
);

/* =====================================================
EJERCICIOS
===================================================== */

const defaultExercises = [

/* PECHO */
{
id: "bench_press",
name: "Press banca",
muscle: "Pecho",
type: "bilateral"
},

{
id: "incline_press",
name: "Press inclinado",
muscle: "Pecho",
type: "bilateral"
},

{
id: "machine_chest_press",
name: "Press de pecho en máquina",
muscle: "Pecho",
type: "bilateral"
},

{
id: "pec_deck",
name: "Pec deck",
muscle: "Pecho",
type: "bilateral"
},

{
id: "cable_fly",
name: "Aperturas en polea",
muscle: "Pecho",
type: "bilateral"
},

/* ESPALDA */
{
id: "pullup",
name: "Dominadas",
muscle: "Espalda",
type: "bilateral"
},

{
id: "lat_pulldown",
name: "Jalón al pecho",
muscle: "Espalda",
type: "bilateral"
},

{
id: "straight_bar_pulldown",
name: "Pulldown con barra recta",
muscle: "Espalda",
type: "bilateral"
},

{
id: "tbar_row",
name: "Remo T-bar",
muscle: "Espalda",
type: "bilateral"
},

{
id: "seated_row",
name: "Remo sentado",
muscle: "Espalda",
type: "bilateral"
},

{
id: "one_arm_row",
name: "Remo unilateral",
muscle: "Espalda",
type: "unilateral"
},

{
id: "one_arm_pulldown",
name: "Jalón unilateral",
muscle: "Espalda",
type: "unilateral"
},

/* BÍCEPS */
{
id: "barbell_curl",
name: "Curl con barra",
muscle: "Bíceps",
type: "bilateral"
},

{
id: "preacher_curl",
name: "Curl predicador",
muscle: "Bíceps",
type: "bilateral"
},

{
id: "cable_curl",
name: "Curl en polea",
muscle: "Bíceps",
type: "bilateral"
},

{
id: "single_cable_curl",
name: "Curl unilateral en polea",
muscle: "Bíceps",
type: "unilateral"
},

{
id: "hammer_curl",
name: "Curl martillo",
muscle: "Bíceps",
type: "bilateral"
},

{
id: "single_hammer_curl",
name: "Curl martillo unilateral",
muscle: "Bíceps",
type: "unilateral"
},

/* TRÍCEPS */
{
id: "triceps_pushdown",
name: "Extensión de tríceps en polea",
muscle: "Tríceps",
type: "bilateral"
},

{
id: "single_triceps_pushdown",
name: "Extensión unilateral de tríceps",
muscle: "Tríceps",
type: "unilateral"
},

{
id: "overhead_extension",
name: "Extensión de tríceps por encima de la cabeza",
muscle: "Tríceps",
type: "bilateral"
},

/* HOMBROS */
{
id: "shoulder_press",
name: "Press militar",
muscle: "Hombros",
type: "bilateral"
},

{
id: "machine_shoulder_press",
name: "Press de hombros en máquina",
muscle: "Hombros",
type: "bilateral"
},

{
id: "lateral_raise",
name: "Elevaciones laterales",
muscle: "Hombros",
type: "bilateral"
},

{
id: "single_lateral_raise",
name: "Elevación lateral unilateral",
muscle: "Hombros",
type: "unilateral"
},

{
id: "rear_delt_fly",
name: "Pájaros",
muscle: "Hombros",
type: "bilateral"
},

/* CUÁDRICEPS */
{
id: "leg_extension",
name: "Extensión de cuádriceps",
muscle: "Cuádriceps",
type: "bilateral"
},

{
id: "single_leg_extension",
name: "Extensión unilateral de cuádriceps",
muscle: "Cuádriceps",
type: "unilateral"
},

{
id: "leg_press",
name: "Prensa",
muscle: "Cuádriceps",
type: "bilateral"
},

/* ISQUIOS */
{
id: "leg_curl",
name: "Curl femoral",
muscle: "Isquiosurales",
type: "bilateral"
},

{
id: "single_leg_curl",
name: "Curl femoral unilateral",
muscle: "Isquiosurales",
type: "unilateral"
},

/* GLÚTEOS */
{
id: "hip_thrust",
name: "Hip thrust",
muscle: "Glúteos",
type: "bilateral"
},

{
id: "cable_kickback",
name: "Patada de glúteo en polea",
muscle: "Glúteos",
type: "unilateral"
},

/* GEMELOS */
{
id: "standing_calf_raise",
name: "Elevación de gemelos de pie",
muscle: "Gemelos",
type: "bilateral"
},

{
id: "single_calf_raise",
name: "Elevación unilateral de gemelo",
muscle: "Gemelos",
type: "unilateral"
},

/* ABDOMINALES */
{
id: "cable_crunch",
name: "Crunch en polea",
muscle: "Abdominales",
type: "bilateral"
},

{
id: "leg_raise",
name: "Elevaciones de piernas",
muscle: "Abdominales",
type: "bilateral"
},

/* ANTEBRAZO */
{
id: "wrist_curl",
name: "Curl de muñeca",
muscle: "Antebrazo",
type: "bilateral"
},

{
id: "reverse_wrist_curl",
name: "Curl inverso de muñeca",
muscle: "Antebrazo",
type: "bilateral"
}
];

function getAllExercises() {

return [
...defaultExercises,
...(state.customExercises || [])
];
}

function renderExerciseSelects() {

const exercises = getAllExercises();

const options = exercises.map(exercise => `
<option value="${exercise.id}">
${escapeHTML(exercise.name)}
— ${escapeHTML(exercise.muscle)}
— ${exercise.type === "unilateral" ? "Unilateral" : "Bilateral"}
</option>
`).join("");

$("exerciseSelect").innerHTML =
`<option value="">Selecciona ejercicio...</option>${options}`;

$("progressExerciseSelect").innerHTML =
`<option value="">Selecciona ejercicio...</option>${options}`;
}

/* =====================================================
CREAR EJERCICIO PERSONALIZADO
===================================================== */

$("createExerciseBtn")?.addEventListener(
"click",
() => {

const name =
$("customExerciseName").value.trim();

const muscle =
$("customExerciseMuscle").value;

const type =
$("customExerciseType").value;

if (!name) {
alert("Escribe el nombre del ejercicio.");
return;
}

const exercise = {
id: uid("exercise"),
name,
muscle,
type,
custom: true
};

state.customExercises.push(exercise);

saveState();

$("customExerciseName").value = "";

renderExerciseSelects();

updateTrainingStats();

alert("Ejercicio creado correctamente.");
}
);

/* =====================================================
ENTRENAMIENTO ACTUAL
===================================================== */

function addExerciseToCurrentWorkout() {

const exerciseId =
$("exerciseSelect").value;

if (!exerciseId) {
alert("Selecciona un ejercicio.");
return;
}

const exercise =
getAllExercises().find(
item => item.id === exerciseId
);

if (!exercise) return;

const workoutExercise = {
id: uid("workout_exercise"),
exerciseId: exercise.id,
name: exercise.name,
muscle: exercise.muscle,
type: exercise.type,

sets: [
{
id: uid("set"),
weight: 0,
reps: 0,
rir: 0
}
]
};

state.currentWorkout.push(workoutExercise);

saveState();

renderCurrentWorkout();
}

function renderCurrentWorkout() {

const container =
$("currentWorkoutExercises");

if (!state.currentWorkout.length) {

container.innerHTML =
`<div class="empty">No has añadido ejercicios todavía.</div>`;

return;
}

container.innerHTML =
state.currentWorkout.map(exercise => {

return `
<div class="exercise-card">

<div class="exercise-title">

<div>
<strong>
${escapeHTML(exercise.name)}
</strong>

<div style="margin-top:6px">
<span class="tag">
${escapeHTML(exercise.muscle)}
</span>

<span class="tag green">
${exercise.type === "unilateral"
? "Unilateral"
: "Bilateral"}
</span>
</div>
</div>

<button
class="btn danger small remove-current-exercise"
data-id="${exercise.id}">
Eliminar
</button>

</div>

<div>
<div class="set-row">
<div>#</div>
<div>Peso</div>
<div>Reps</div>
<div>RIR</div>
<div class="rir-field"></div>
<div></div>
</div>

${exercise.sets.map((set, index) => `

<div class="set-row">

<div class="set-number">
${index + 1}
</div>

<input
type="number"
step="0.1"
class="set-weight"
data-exercise="${exercise.id}"
data-set="${set.id}"
value="${set.weight || ""}"
placeholder="kg">

<input
type="number"
class="set-reps"
data-exercise="${exercise.id}"
data-set="${set.id}"
value="${set.reps || ""}"
placeholder="reps">

<input
type="number"
min="0"
step="1"
class="set-rir"
data-exercise="${exercise.id}"
data-set="${set.id}"
value="${set.rir ?? ""}"
placeholder="RIR">

<div class="rir-field"></div>

<button
class="btn danger small delete-set"
data-exercise="${exercise.id}"
data-set="${set.id}">
×
</button>

</div>

`).join("")}

</div>

<button
class="btn secondary small add-set"
data-id="${exercise.id}"
style="margin-top:10px">
+ Serie
</button>

</div>
`;

}).join("");

/* ELIMINAR EJERCICIO */

container
.querySelectorAll(".remove-current-exercise")
.forEach(button => {

button.addEventListener("click", () => {

state.currentWorkout =
state.currentWorkout.filter(
exercise =>
exercise.id !== button.dataset.id
);

saveState();

renderCurrentWorkout();
});

});

/* AÑADIR SERIE */

container
.querySelectorAll(".add-set")
.forEach(button => {

button.addEventListener("click", () => {

const exercise =
state.currentWorkout.find(
item => item.id === button.dataset.id
);

if (!exercise) return;

exercise.sets.push({
id: uid("set"),
weight: 0,
reps: 0,
rir: 0
});

saveState();

renderCurrentWorkout();
});

});

/* BORRAR SERIE */

container
.querySelectorAll(".delete-set")
.forEach(button => {

button.addEventListener("click", () => {

const exercise =
state.currentWorkout.find(
item => item.id === button.dataset.exercise
);

if (!exercise) return;

exercise.sets =
exercise.sets.filter(
set => set.id !== button.dataset.set
);

if (!exercise.sets.length) {
exercise.sets.push({
id: uid("set"),
weight: 0,
reps: 0,
rir: 0
});
}

saveState();

renderCurrentWorkout();
});

});

/* ACTUALIZAR PESOS */

container
.querySelectorAll(".set-weight")
.forEach(input => {

input.addEventListener("input", () => {

const exercise =
state.currentWorkout.find(
item => item.id === input.dataset.exercise
);

const set =
exercise?.sets.find(
item => item.id === input.dataset.set
);

if (!set) return;

set.weight = number(input.value);

saveState();
});

});

/* ACTUALIZAR REPS */

container
.querySelectorAll(".set-reps")
.forEach(input => {

input.addEventListener("input", () => {

const exercise =
state.currentWorkout.find(
item => item.id === input.dataset.exercise
);

const set =
exercise?.sets.find(
item => item.id === input.dataset.set
);

if (!set) return;

set.reps = number(input.value);

saveState();
});

});

/* ACTUALIZAR RIR */

container
.querySelectorAll(".set-rir")
.forEach(input => {

input.addEventListener("input", () => {

const exercise =
state.currentWorkout.find(
item => item.id === input.dataset.exercise
);

const set =
exercise?.sets.find(
item => item.id === input.dataset.set
);

if (!set) return;

set.rir = number(input.value);

saveState();
});

});
}

$("addExerciseToWorkout")?.addEventListener(
"click",
addExerciseToCurrentWorkout
);

/* =====================================================
GUARDAR ENTRENAMIENTO
===================================================== */

$("saveWorkoutBtn")?.addEventListener(
"click",
() => {

if (!state.currentWorkout.length) {
alert("Añade al menos un ejercicio.");
return;
}

const name =
$("workoutName").value.trim() ||
"Entrenamiento";

const workout = {

id: uid("workout"),

date: today(),

timestamp: Date.now(),

name,

exercises:
structuredClone(state.currentWorkout)
};

state.workouts.unshift(workout);

state.currentWorkout = [];

$("workoutName").value = "";

saveState();

renderCurrentWorkout();
renderWorkoutHistory();
renderExerciseProgress();
updateTrainingStats();
updateDashboard();

alert("Entrenamiento guardado.");
}
);

/* =====================================================
RUTINAS
===================================================== */

function renderRoutineSelect() {

const select =
$("routineSelect");

if (!state.routines.length) {

select.innerHTML =
`<option value="">No hay rutinas creadas</option>`;

return;
}

select.innerHTML =
`<option value="">Selecciona rutina...</option>` +
state.routines.map(routine => `
<option value="${routine.id}">
${escapeHTML(routine.name)}
</option>
`).join("");
}

function renderRoutineList() {

const container =
$("routineList");

if (!state.routines.length) {

container.innerHTML =
`<div class="empty">Todavía no tienes rutinas.</div>`;

return;
}

container.innerHTML =
state.routines.map(routine => `

<div class="routine-item">

<div class="routine-item-header">

<strong>
${escapeHTML(routine.name)}
</strong>

<span class="tag">
${routine.exercises.length} ejercicios
</span>

</div>

<div style="margin-top:9px;color:#8f9ab5;font-size:13px">
${routine.exercises.length
? routine.exercises.map(exercise =>
escapeHTML(exercise.name)
).join(" · ")
: "Sin ejercicios"}
</div>

</div>

`).join("");
}

$("createRoutineBtn")?.addEventListener(
"click",
() => {

const name =
$("routineName").value.trim();

if (!name) {
alert("Pon un nombre a la rutina.");
return;
}

const routine = {
id: uid("routine"),
name,
exercises: []
};

state.routines.push(routine);

$("routineName").value = "";

saveState();

renderRoutineSelect();
renderRoutineList();
}
);

$("loadRoutineBtn")?.addEventListener(
"click",
() => {

const routineId =
$("routineSelect").value;

const routine =
state.routines.find(
item => item.id === routineId
);

if (!routine) {
alert("Selecciona una rutina.");
return;
}

state.currentWorkout =
structuredClone(routine.exercises);

$("workoutName").value =
routine.name;

saveState();

renderCurrentWorkout();
}
);

$("deleteRoutineBtn")?.addEventListener(
"click",
() => {

const routineId =
$("routineSelect").value;

if (!routineId) return;

if (!confirm("¿Eliminar esta rutina?")) {
return;
}

state.routines =
state.routines.filter(
routine => routine.id !== routineId
);

saveState();

renderRoutineSelect();
renderRoutineList();
}
);

/* =====================================================
HISTORIAL DE ENTRENAMIENTO
===================================================== */

function getWeekStart() {

const date = new Date();

const day = date.getDay();

const difference =
day === 0 ? -6 : 1 - day;

date.setDate(
date.getDate() + difference
);

date.setHours(0,0,0,0);

return date;
}

function getWorkoutsThisWeek() {

const start = getWeekStart();

return state.workouts.filter(workout => {

const date =
new Date(workout.date + "T12:00:00");

return date >= start;
});
}

function calculateWorkoutStats(workouts) {

let sets = 0;
let volume = 0;

workouts.forEach(workout => {

workout.exercises.forEach(exercise => {

exercise.sets.forEach(set => {

const weight = number(set.weight);
const reps = number(set.reps);

if (reps > 0) {
sets++;
}

volume += weight * reps;
});

});

});

return {
sets,
volume
};
}

function updateTrainingStats() {

const week =
getWorkoutsThisWeek();

const stats =
calculateWorkoutStats(week);

$("trainingWeekCount").textContent =
week.length;

$("trainingWeekSets").textContent =
stats.sets;

$("trainingWeekVolume").textContent =
`${round(stats.volume)} kg`;

$("exerciseCount").textContent =
getAllExercises().length;
}

function renderWorkoutHistory() {

const container =
$("workoutHistory");

if (!state.workouts.length) {

container.innerHTML =
`<div class="empty">No hay entrenamientos guardados.</div>`;

return;
}

container.innerHTML =
state.workouts.slice(0, 30).map(workout => {

const stats =
calculateWorkoutStats([workout]);

return `
<div class="history-item">

<div class="history-header">

<div>
<strong>
${escapeHTML(workout.name)}
</strong>

<div style="color:#8f9ab5;font-size:12px;margin-top:4px">
${formatDate(workout.date)}
</div>
</div>

<div style="text-align:right">
<strong>${stats.sets}</strong> series
<br>
<span style="color:#8f9ab5;font-size:12px">
${round(stats.volume)} kg
</span>
</div>

</div>

<div style="margin-top:12px">

${workout.exercises.map(exercise => `

<div style="margin-bottom:9px">

<strong style="font-size:13px">
${escapeHTML(exercise.name)}
</strong>

<div style="color:#8f9ab5;font-size:12px">
${exercise.type === "unilateral"
? "Unilateral"
: "Bilateral"}
·
${exercise.sets.length} series
</div>

</div>

`).join("")}

</div>

</div>
`;

}).join("");
}

/* =====================================================
PROGRESIÓN POR EJERCICIO
===================================================== */

function renderExerciseProgress() {

const selected =
$("progressExerciseSelect").value;

const container =
$("exerciseProgress");

if (!selected) {

container.innerHTML =
`<div class="empty">
Selecciona un ejercicio para ver su progresión.
</div>`;

return;
}

const records = [];

state.workouts.forEach(workout => {

workout.exercises.forEach(exercise => {

if (exercise.exerciseId !== selected) {
return;
}

exercise.sets.forEach(set => {

if (number(set.reps) <= 0) return;

records.push({
date: workout.date,
weight: number(set.weight),
reps: number(set.reps),
rir: number(set.rir)
});

});

});

});

if (!records.length) {

container.innerHTML =
`<div class="empty">
Todavía no hay registros para este ejercicio.
</div>`;

return;
}

records.sort(
(a,b) =>
new Date(a.date) - new Date(b.date)
);

const last =
records[records.length - 1];

const heaviest =
Math.max(
...records.map(record => record.weight)
);

const bestReps =
Math.max(
...records.map(record => record.reps)
);

container.innerHTML = `

<div class="grid grid-3">

<div class="stat">
<div class="label">Último peso</div>
<div class="value">
${round(last.weight)} kg
</div>
</div>

<div class="stat">
<div class="label">Mayor peso registrado</div>
<div class="value">
${round(heaviest)} kg
</div>
</div>

<div class="stat">
<div class="label">Máximas reps registradas</div>
<div class="value">
${bestReps}
</div>
</div>

</div>

<div style="margin-top:18px">

${records.slice(-15).reverse().map(record => `

<div style="
display:flex;
justify-content:space-between;
padding:10px 0;
border-bottom:1px solid var(--border);
">

<span>${formatDate(record.date)}</span>

<span>
${record.weight} kg ×
${record.reps} reps
· RIR ${record.rir}
</span>

</div>

`).join("")}

</div>
`;
}

$("progressExerciseSelect")?.addEventListener(
"change",
renderExerciseProgress
);

/* =====================================================
MANTENIMIENTO
===================================================== */

$("calculateMaintenance")?.addEventListener(
"click",
() => {

const sex =
$("sex").value;

const age =
number($("age").value);

const weight =
number($("maintenanceWeight").value);

const height =
number($("height").value);

const activity =
number($("activity").value);

if (
age <= 0 ||
weight <= 0 ||
height <= 0
) {
alert("Completa todos los datos.");
return;
}

let bmr;

if (sex === "male") {

bmr =
10 * weight +
6.25 * height -
5 * age +
5;

} else {

bmr =
10 * weight +
6.25 * height -
5 * age -
161;
}

const maintenance =
bmr * activity;

state.maintenance = {
calories: round(maintenance),
bmr: round(bmr),
data: {
sex,
age,
weight,
height,
activity
}
};

saveState();

renderMaintenance();

updateDashboard();
}
);

function renderMaintenance() {

const data =
state.maintenance;

if (!data.calories) {
$("maintenanceResult").innerHTML =
`<div class="empty">Todavía no hay cálculo.</div>`;
return;
}

$("maintenanceResult").innerHTML = `

<div class="grid grid-3">

<div class="stat">
<div class="label">Metabolismo basal estimado</div>
<div class="value">
${round(data.bmr)}
</div>
<div class="sub">kcal/día</div>
</div>

<div class="stat">
<div class="label">Mantenimiento estimado</div>
<div class="value">
${round(data.calories)}
</div>
<div class="sub">kcal/día</div>
</div>

<div class="stat">
<div class="label">Objetivo actual</div>
<div class="value">
${state.goals.calories}
</div>
<div class="sub">kcal/día</div>
</div>

</div>

`;
}

$("saveGoalsBtn")?.addEventListener(
"click",
() => {

state.goals = {
calories: number($("goalCalories").value),
protein: number($("goalProtein").value),
carbs: number($("goalCarbs").value),
fat: number($("goalFat").value)
};

saveState();

updateDashboard();
updateFoodTotals();
}
);

function renderGoals() {

$("goalCalories").value =
state.goals.calories;

$("goalProtein").value =
state.goals.protein;

$("goalCarbs").value =
state.goals.carbs;

$("goalFat").value =
state.goals.fat;
}

/* =====================================================
PROGRESO
===================================================== */

$("addWeightBtn")?.addEventListener(
"click",
() => {

const weight =
number($("weightInput").value);

if (weight <= 0) {
alert("Introduce un peso válido.");
return;
}

state.progress.push({
id: uid("weight"),
date: today(),
weight,
note:
$("weightNote").value.trim()
});

state.progress.sort(
(a,b) =>
new Date(a.date) -
new Date(b.date)
);

$("weightInput").value = "";
$("weightNote").value = "";

saveState();

renderProgress();
updateDashboard();
}
);

$("saveTargetBtn")?.addEventListener(
"click",
() => {

const target =
number($("targetWeight").value);

if (target <= 0) {
alert("Introduce un objetivo válido.");
return;
}

state.targetWeight = target;

saveState();

renderProgress();
}
);

function renderProgress() {

const history =
$("weightHistory");

if (!state.progress.length) {

history.innerHTML =
`<div class="empty">
Todavía no has registrado ningún peso.
</div>`;

$("progressSummary").innerHTML = "";

return;
}

const first =
state.progress[0];

const latest =
state.progress[state.progress.length - 1];

$("targetWeight").value =
state.targetWeight || "";

let summaryHTML = `
<div>
<strong>Último peso:</strong>
${round(latest.weight)} kg
</div>
`;

if (state.targetWeight) {

const start =
first.weight;

const target =
state.targetWeight;

const totalDistance =
Math.abs(start - target);

const currentDistance =
Math.abs(latest.weight - target);

let percentage = 0;

if (totalDistance > 0) {

percentage =
((totalDistance - currentDistance) /
totalDistance) * 100;
}

percentage =
Math.max(
0,
Math.min(100, percentage)
);

summaryHTML += `

<div style="margin-top:15px">

<div style="
display:flex;
justify-content:space-between;
font-size:13px;
margin-bottom:7px;
">
<span>Progreso</span>
<strong>${round(percentage)}%</strong>
</div>

<div class="progress-track">
<span style="width:${percentage}%"></span>
</div>

<div style="
color:#8f9ab5;
font-size:12px;
margin-top:7px;
">
Objetivo: ${target} kg
</div>

</div>
`;
}

$("progressSummary").innerHTML =
summaryHTML;

history.innerHTML =
[...state.progress]
.reverse()
.map(record => `

<div class="history-item">

<div class="history-header">

<div>
<strong>
${round(record.weight)} kg
</strong>

<div style="
color:#8f9ab5;
font-size:12px;
margin-top:4px;
">
${formatDate(record.date)}
</div>
</div>

<button
class="btn danger small delete-weight"
data-id="${record.id}">
Eliminar
</button>

</div>

${
record.note
? `
<div style="
color:#8f9ab5;
margin-top:8px;
font-size:13px;
">
${escapeHTML(record.note)}
</div>
`
: ""
}

</div>

`)
.join("");

history
.querySelectorAll(".delete-weight")
.forEach(button => {

button.addEventListener(
"click",
() => {

state.progress =
state.progress.filter(
item =>
item.id !== button.dataset.id
);

saveState();

renderProgress();
updateDashboard();
}
);

});
}

/* =====================================================
DASHBOARD
===================================================== */

function updateDashboard() {

const totals =
getFoodTotals();

$("dashCalories").textContent =
round(totals.calories);

$("dashProtein").textContent =
`${round(totals.protein)} g`;

$("dashWeight").textContent =
state.progress.length
? `${round(
state.progress[state.progress.length - 1].weight
)} kg`
: "—";

const workouts =
getWorkoutsThisWeek();

$("dashWorkouts").textContent =
workouts.length;

$("dashboardDate").textContent =
new Date().toLocaleDateString(
"es-ES",
{
weekday: "long",
day: "numeric",
month: "long"
}
);

$("dashProteinMacro").textContent =
`${round(totals.protein)} / ${state.goals.protein} g`;

$("dashCarbsMacro").textContent =
`${round(totals.carbs)} / ${state.goals.carbs} g`;

$("dashFatMacro").textContent =
`${round(totals.fat)} / ${state.goals.fat} g`;

function percentage(current, goal) {

if (!goal || goal <= 0) return 0;

return Math.min(
100,
Math.max(
0,
(current / goal) * 100
)
);
}

$("proteinBar").style.width =
`${percentage(
totals.protein,
state.goals.protein
)}%`;

$("carbsBar").style.width =
`${percentage(
totals.carbs,
state.goals.carbs
)}%`;

$("fatBar").style.width =
`${percentage(
totals.fat,
state.goals.fat
)}%`;

const last =
state.workouts[0];

if (!last) {

$("lastWorkoutDashboard").innerHTML =
`<div class="empty">
Todavía no hay entrenamientos.
</div>`;

return;
}

const stats =
calculateWorkoutStats([last]);

$("lastWorkoutDashboard").innerHTML = `

<strong>
${escapeHTML(last.name)}
</strong>

<div style="
color:#8f9ab5;
margin-top:7px;
font-size:13px;
">
${formatDate(last.date)}
</div>

<div style="
margin-top:15px;
display:flex;
gap:10px;
">

<span class="tag">
${stats.sets} series
</span>

<span class="tag green">
${round(stats.volume)} kg
</span>

</div>
`;
}

/* =====================================================
ASISTENTE
===================================================== */

function assistantAnswer(question) {

const q =
normalize(question);

const totals =
getFoodTotals();

const week =
getWorkoutsThisWeek();

if (
q.includes("caloria") ||
q.includes("kcal")
) {

return `
Hoy llevas
<strong>${round(totals.calories)} kcal</strong>
de un objetivo de
<strong>${state.goals.calories} kcal</strong>.
`;
}

if (
q.includes("proteina")
) {

return `
Hoy llevas
<strong>${round(totals.protein)} g</strong>
de proteína.
Tu objetivo guardado es
<strong>${state.goals.protein} g</strong>.
`;
}

if (
q.includes("entrenamiento") ||
q.includes("entrenamientos")
) {

return `
Esta semana tienes
<strong>${week.length}</strong>
entrenamiento(s) registrado(s).
`;
}

if (
q.includes("ultimo entrenamiento") ||
q.includes("último entrenamiento")
) {

if (!state.workouts.length) {
return "Todavía no tienes entrenamientos guardados.";
}

const workout =
state.workouts[0];

return `
Tu último entrenamiento fue
<strong>${escapeHTML(workout.name)}</strong>
el ${formatDate(workout.date)}.
`;
}

if (
q.includes("peso")
) {

if (!state.progress.length) {
return "Todavía no tienes registros de peso.";
}

const last =
state.progress[state.progress.length - 1];

return `
Tu último registro es de
<strong>${round(last.weight)} kg</strong>
(${formatDate(last.date)}).
`;
}

if (
q.includes("mantenimiento")
) {

if (!state.maintenance.calories) {
return "Todavía no has calculado el mantenimiento.";
}

return `
Tu estimación guardada de mantenimiento es
<strong>${round(state.maintenance.calories)} kcal/día</strong>.
`;
}

return `
Puedo consultar tus calorías, proteína,
peso, mantenimiento y entrenamientos guardados.
`;
}

function sendAssistant(question) {

if (!question.trim()) return;

const messages =
$("assistantMessages");

messages.innerHTML += `

<div style="
margin:12px 0;
text-align:right;
">
<span style="
display:inline-block;
background:#202a44;
padding:10px 13px;
border-radius:13px;
max-width:85%;
">
${escapeHTML(question)}
</span>
</div>

<div style="
margin:12px 0;
">
<span style="
display:inline-block;
background:rgba(124,92,255,.12);
border:1px solid rgba(124,92,255,.25);
padding:10px 13px;
border-radius:13px;
max-width:85%;
">
${assistantAnswer(question)}
</span>
</div>
`;

messages.scrollTop =
messages.scrollHeight;
}

$("assistantSend")?.addEventListener(
"click",
() => {

const input =
$("assistantInput");

sendAssistant(input.value);

input.value = "";
}
);

$("assistantInput")?.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {

$("assistantSend").click();
}
}
);

document
.querySelectorAll(".assistant-question")
.forEach(button => {

button.addEventListener(
"click",
() => {
sendAssistant(
button.dataset.question
);
}
);

});

/* =====================================================
IMPORTAR / EXPORTAR
===================================================== */

$("exportDataBtn")?.addEventListener(
"click",
() => {

const data =
JSON.stringify(
state,
null,
2
);

const blob =
new Blob(
[data],
{
type: "application/json"
}
);

const url =
URL.createObjectURL(blob);

const link =
document.createElement("a");

link.href = url;

link.download =
`nutri-backup-${today()}.json`;

link.click();

URL.revokeObjectURL(url);
}
);

$("importDataInput")?.addEventListener(
"change",
event => {

const file =
event.target.files[0];

if (!file) return;

const reader =
new FileReader();

reader.onload = () => {

try {

const imported =
JSON.parse(reader.result);

state = {
...structuredClone(defaultState),
...imported
};

saveState();

location.reload();

} catch {

alert("El archivo no es válido.");
}
};

reader.readAsText(file);
}
);

$("resetDataBtn")?.addEventListener(
"click",
() => {

if (
!confirm(
"Esto eliminará todos tus datos de Nutri. ¿Continuar?"
)
) {
return;
}

localStorage.removeItem(STORAGE_KEY);

location.reload();
}
);

/* =====================================================
INICIALIZACIÓN
===================================================== */

renderSelectedFood();

renderFoodTable();

updateFoodTotals();

renderExerciseSelects();

renderCurrentWorkout();

renderRoutineSelect();

renderRoutineList();

renderWorkoutHistory();

renderExerciseProgress();

renderProgress();

renderMaintenance();

renderGoals();

updateTrainingStats();

updateDashboard();

});
