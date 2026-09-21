const STORAGE_KEY = "nutri_app_v3";

const DEFAULT_DATA = {
settings: {
kcal: 2300,
protein: 130,
carbs: 250,
fat: 70,
theme: "light"
},

foods: [
{ id: "rice", name: "Arroz blanco", kcal: 344, protein: 7, carbs: 77, fat: 0.8, unit: "g" },
{ id: "pasta", name: "Pasta seca", kcal: 349, protein: 12, carbs: 70, fat: 1.5, unit: "g" },
{ id: "chicken", name: "Pollo", kcal: 108, protein: 22, carbs: 0.5, fat: 1.8, unit: "g" },
{ id: "cream-rice", name: "Crema de arroz", kcal: 372, protein: 6.4, carbs: 85, fat: 0.6, unit: "g" },
{ id: "milk", name: "Leche desnatada", kcal: 35, protein: 3.2, carbs: 4.8, fat: 0.2, unit: "ml" },
{ id: "potato", name: "Patata cocida", kcal: 80, protein: 2, carbs: 17, fat: 0.1, unit: "g" },
{ id: "broccoli", name: "Brócoli", kcal: 29, protein: 3, carbs: 1.8, fat: 0.4, unit: "g" },
{ id: "bread", name: "Pan", kcal: 249, protein: 9.4, carbs: 48, fat: 1.4, unit: "g" },
{ id: "turkey", name: "Pavo", kcal: 89, protein: 18.1, carbs: 0, fat: 1.7, unit: "g" },
{ id: "maltodextrin", name: "Maltodextrina", kcal: 380, protein: 0, carbs: 95, fat: 0, unit: "g" },
{ id: "protein", name: "Proteína en polvo", kcal: 378, protein: 72.3, carbs: 10.4, fat: 2.9, unit: "g" },
{ id: "broth", name: "Caldo de pollo", kcal: 11.2, protein: 0.4, carbs: 0.52, fat: 0.8, unit: "ml" }
],

days: {},
recipes: [],
weights: [],

training: {
workouts: [],
exerciseLibrary: []
}
};

let data = loadData();
let currentView = "dashboard";
let currentDate = getToday();
let editingWorkoutId = null;

document.addEventListener("DOMContentLoaded", () => {
applyTheme();
bindNavigation();
document.getElementById("quickTrainingBtn").onclick = () => openWorkoutEditor();
render();
});

function loadData() {
try {
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

if (!saved) return structuredClone(DEFAULT_DATA);

const merged = {
...structuredClone(DEFAULT_DATA),
...saved,
settings: {
...DEFAULT_DATA.settings,
...(saved.settings || {})
},
foods: Array.isArray(saved.foods) ? saved.foods : structuredClone(DEFAULT_DATA.foods),
days: saved.days || {},
recipes: Array.isArray(saved.recipes) ? saved.recipes : [],
weights: Array.isArray(saved.weights) ? saved.weights : [],
training: {
...DEFAULT_DATA.training,
...(saved.training || {}),
workouts: saved.training?.workouts || [],
exerciseLibrary: saved.training?.exerciseLibrary || []
}
};

return merged;
} catch {
return structuredClone(DEFAULT_DATA);
}
}

function saveData() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getToday() {
const d = new Date();
return formatDateInput(d);
}

function formatDateInput(date) {
const d = new Date(date);
const offset = d.getTimezoneOffset();
const local = new Date(d.getTime() - offset * 60000);
return local.toISOString().slice(0, 10);
}

function dateObj(date) {
return new Date(`${date}T12:00:00`);
}

function formatDate(date) {
return dateObj(date).toLocaleDateString("es-ES", {
weekday: "long",
day: "numeric",
month: "long",
year: "numeric"
});
}

function shortDate(date) {
return dateObj(date).toLocaleDateString("es-ES", {
day: "2-digit",
month: "2-digit"
});
}

function uid(prefix = "id") {
if (window.crypto?.randomUUID) {
return `${prefix}_${crypto.randomUUID()}`;
}

return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function esc(value) {
return String(value ?? "")
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}

function round(n, decimals = 1) {
const p = 10 ** decimals;
return Math.round((Number(n) + Number.EPSILON) * p) / p;
}

function fmt(n, decimals = 0) {
return Number(n || 0).toLocaleString("es-ES", {
maximumFractionDigits: decimals
});
}

function calcFood(food, amount) {
const factor = Number(amount || 0) / 100;

return {
kcal: food.kcal * factor,
protein: food.protein * factor,
carbs: food.carbs * factor,
fat: food.fat * factor
};
}

function getDay(date = currentDate) {
if (!data.days[date]) {
data.days[date] = {
meals: {
Desayuno: [],
Comida: [],
Merienda: [],
Cena: [],
Otros: []
}
};
saveData();
}

return data.days[date];
}

function dayTotals(date = currentDate) {
const day = getDay(date);

const total = {
kcal: 0,
protein: 0,
carbs: 0,
fat: 0
};

Object.values(day.meals).flat().forEach(item => {
total.kcal += Number(item.kcal || 0);
total.protein += Number(item.protein || 0);
total.carbs += Number(item.carbs || 0);
total.fat += Number(item.fat || 0);
});

return total;
}

function bindNavigation() {
document.querySelectorAll(".nav-item").forEach(button => {
button.addEventListener("click", () => {
currentView = button.dataset.view;
render();
});
});

document.getElementById("themeBtn").onclick = () => {
data.settings.theme = data.settings.theme === "dark" ? "light" : "dark";
saveData();
applyTheme();
};
}

function applyTheme() {
document.body.classList.toggle("dark", data.settings.theme === "dark");
}

function setActiveNav() {
document.querySelectorAll(".nav-item").forEach(btn => {
btn.classList.toggle("active", btn.dataset.view === currentView);
});
}

function render() {
setActiveNav();

const titles = {
dashboard: "Inicio",
day: "Diario",
training: "Entrenamiento",
foods: "Alimentos",
recipes: "Recetas",
history: "Historial",
settings: "Ajustes"
};

document.getElementById("pageTitle").textContent = titles[currentView] || "Nutri";

const content = document.getElementById("content");

if (currentView === "dashboard") content.innerHTML = dashboardHTML();
if (currentView === "day") content.innerHTML = dayHTML();
if (currentView === "training") content.innerHTML = trainingHTML();
if (currentView === "foods") content.innerHTML = foodsHTML();
if (currentView === "recipes") content.innerHTML = recipesHTML();
if (currentView === "history") content.innerHTML = historyHTML();
if (currentView === "settings") content.innerHTML = settingsHTML();

bindViewEvents();
}

/* =========================
DASHBOARD
========================= */

function dashboardHTML() {
const totals = dayTotals();
const target = data.settings;

const kcalPct = Math.min(100, (totals.kcal / target.kcal) * 100);
const pPct = Math.min(100, (totals.protein / target.protein) * 100);
const cPct = Math.min(100, (totals.carbs / target.carbs) * 100);
const fPct = Math.min(100, (totals.fat / target.fat) * 100);

const workouts = data.training.workouts.filter(w => w.date === currentDate);

return `
<div class="date-row" style="margin-bottom:18px;">
<button id="prevDay">‹</button>
<div class="date-display">${esc(formatDate(currentDate))}</div>
<button id="nextDay">›</button>
<button class="secondary-btn" id="todayBtn">Hoy</button>
</div>

<div class="grid grid-4">
<div class="card stat-card">
<div class="stat-label">Calorías</div>
<div class="stat-value">${fmt(totals.kcal)}</div>
<div class="stat-sub">de ${fmt(target.kcal)} kcal</div>
<div class="progress"><div style="width:${kcalPct}%"></div></div>
</div>

<div class="card stat-card">
<div class="stat-label">Proteína</div>
<div class="stat-value">${fmt(totals.protein, 1)} g</div>
<div class="stat-sub">de ${fmt(target.protein, 1)} g</div>
<div class="progress green"><div style="width:${pPct}%"></div></div>
</div>

<div class="card stat-card">
<div class="stat-label">Carbohidratos</div>
<div class="stat-value">${fmt(totals.carbs, 1)} g</div>
<div class="stat-sub">de ${fmt(target.carbs, 1)} g</div>
<div class="progress orange"><div style="width:${cPct}%"></div></div>
</div>

<div class="card stat-card">
<div class="stat-label">Grasas</div>
<div class="stat-value">${fmt(totals.fat, 1)} g</div>
<div class="stat-sub">de ${fmt(target.fat, 1)} g</div>
<div class="progress purple"><div style="width:${fPct}%"></div></div>
</div>
</div>

<div class="grid grid-2" style="margin-top:18px;">
<div class="card">
<div class="section-head">
<h2>Resumen del día</h2>
<button class="secondary-btn" id="openDayBtn">Abrir diario</button>
</div>

<div class="ring-wrap">
<div class="ring" style="background:conic-gradient(var(--primary) ${kcalPct * 3.6}deg, #e9eef5 0deg)">
<div class="ring-content">
<strong>${fmt(totals.kcal)}</strong>
<span>kcal</span>
</div>
</div>

<div style="flex:1;">
<div class="macro-line">
<span>Proteína</span>
<strong>${fmt(totals.protein, 1)} g</strong>
</div>
<div class="progress green"><div style="width:${pPct}%"></div></div>

<div class="macro-line">
<span>Carbohidratos</span>
<strong>${fmt(totals.carbs, 1)} g</strong>
</div>
<div class="progress orange"><div style="width:${cPct}%"></div></div>

<div class="macro-line">
<span>Grasas</span>
<strong>${fmt(totals.fat, 1)} g</strong>
</div>
<div class="progress purple"><div style="width:${fPct}%"></div></div>
</div>
</div>
</div>

<div class="card">
<div class="section-head">
<h2>Entrenamiento de hoy</h2>
<button class="primary-btn" id="newTrainingDashboard">＋ Nueva sesión</button>
</div>

${
workouts.length
? workouts.map(w => `
<div class="workout-row">
<div class="workout-info">
<strong>${esc(w.name || "Entrenamiento")}</strong>
<span>${w.exercises.length} ejercicios · ${workoutStats(w).sets} series · ${fmt(workoutStats(w).volume)} kg</span>
</div>
<button class="small-btn" data-edit-workout="${w.id}">Abrir</button>
</div>
`).join("")
: `<div class="empty">Todavía no has registrado entrenamiento hoy.</div>`
}
</div>
</div>

<div class="card" style="margin-top:18px;">
<div class="section-head">
<h2>Últimos entrenamientos</h2>
<button class="secondary-btn" id="goTraining">Ver todos</button>
</div>

${
data.training.workouts.length
? data.training.workouts
.slice()
.sort((a,b) => b.date.localeCompare(a.date))
.slice(0, 5)
.map(w => `
<div class="workout-row">
<div class="workout-info">
<strong>${esc(w.name || "Entrenamiento")}</strong>
<span>${shortDate(w.date)} · ${w.exercises.length} ejercicios · ${workoutStats(w).sets} series</span>
</div>
<span>${fmt(workoutStats(w).volume)} kg</span>
</div>
`).join("")
: `<div class="empty">No tienes entrenamientos registrados todavía.</div>`
}
</div>
`;
}

/* =========================
DIARIO
========================= */

function dayHTML() {
const day = getDay();
const totals = dayTotals();
const target = data.settings;

return `
<div class="date-row" style="margin-bottom:18px;">
<button id="prevDay">‹</button>
<div class="date-display">${esc(formatDate(currentDate))}</div>
<button id="nextDay">›</button>
<button class="secondary-btn" id="todayBtn">Hoy</button>
<button class="secondary-btn" id="copyDayBtn">Copiar día</button>
</div>

<div class="grid grid-4" style="margin-bottom:18px;">
<div class="card stat-card">
<div class="stat-label">Calorías</div>
<div class="stat-value">${fmt(totals.kcal)}</div>
<div class="stat-sub">/ ${fmt(target.kcal)} kcal</div>
</div>

<div class="card stat-card">
<div class="stat-label">Proteína</div>
<div class="stat-value">${fmt(totals.protein, 1)} g</div>
<div class="stat-sub">/ ${fmt(target.protein, 1)} g</div>
</div>

<div class="card stat-card">
<div class="stat-label">Carbohidratos</div>
<div class="stat-value">${fmt(totals.carbs, 1)} g</div>
<div class="stat-sub">/ ${fmt(target.carbs, 1)} g</div>
</div>

<div class="card stat-card">
<div class="stat-label">Grasas</div>
<div class="stat-value">${fmt(totals.fat, 1)} g</div>
<div class="stat-sub">/ ${fmt(target.fat, 1)} g</div>
</div>
</div>

<div class="tabs">
${Object.keys(day.meals).map((meal, i) => `
<button class="tab ${i === 0 ? "active" : ""}" data-meal-tab="${meal}">
${meal}
</button>
`).join("")}
</div>

<div id="mealContainer"></div>
`;
}

function renderMeal(meal) {
const day = getDay();
const items = day.meals[meal] || [];

return `
<div class="card">
<div class="section-head">
<div>
<h2>${esc(meal)}</h2>
<span style="color:var(--muted);font-size:12px;">${items.length} alimentos</span>
</div>
<button class="primary-btn" id="addMealFood" data-meal="${esc(meal)}">＋ Añadir alimento</button>
</div>

${
items.length
? items.map(item => `
<div class="food-row">
<div class="food-info">
<strong>${esc(item.name)}</strong>
<span>${fmt(item.amount, 1)} ${item.unit || "g"} · ${fmt(item.kcal)} kcal · P ${fmt(item.protein,1)} · C ${fmt(item.carbs,1)} · G ${fmt(item.fat,1)}</span>
</div>
<div class="row-actions">
<button class="small-btn" data-edit-meal-item="${item.id}" data-meal="${esc(meal)}">Editar</button>
<button class="danger-btn small-btn" data-delete-meal-item="${item.id}" data-meal="${esc(meal)}">Eliminar</button>
</div>
</div>
`).join("")
: `<div class="empty">No has añadido alimentos a esta comida.</div>`
}
</div>
`;
}

/* =========================
TRAINING
========================= */

function trainingHTML() {
const stats = trainingOverallStats();
const workouts = data.training.workouts
.slice()
.sort((a,b) => b.date.localeCompare(a.date));

const exercises = getAllTrainingExercises();

return `
<div class="training-hero">
<div>
<div class="eyebrow" style="color:#93c5fd;">LIFTING TRACKER</div>
<h2>Registra cada entrenamiento</h2>
<p>Series, repeticiones, peso, RIR, volumen y progreso de cada ejercicio.</p>
</div>
<button class="primary-btn" id="newWorkoutBtn">＋ Nueva sesión</button>
</div>

<div class="grid grid-4" style="margin-bottom:18px;">
<div class="card training-stat">
<strong>${stats.sessions}</strong>
<span>Sesiones totales</span>
</div>

<div class="card training-stat">
<strong>${stats.weekSessions}</strong>
<span>Esta semana</span>
</div>

<div class="card training-stat">
<strong>${fmt(stats.volume)}</strong>
<span>Volumen total (kg)</span>
</div>

<div class="card training-stat">
<strong>${stats.sets}</strong>
<span>Series totales</span>
</div>
</div>

<div class="grid grid-2">
<div class="card">
<div class="section-head">
<h2>Historial</h2>
<button class="secondary-btn" id="copyLastWorkoutBtn" ${workouts.length ? "" : "disabled"}>Copiar último</button>
</div>

${
workouts.length
? workouts.map(w => {
const s = workoutStats(w);
return `
<div class="workout-row">
<div class="workout-info">
<strong>${esc(w.name || "Entrenamiento")}</strong>
<span>${shortDate(w.date)} · ${w.exercises.length} ejercicios · ${s.sets} series · ${fmt(s.volume)} kg</span>
</div>

<div class="row-actions">
<button class="small-btn" data-edit-workout="${w.id}">Abrir</button>
<button class="small-btn" data-copy-workout="${w.id}">Copiar</button>
<button class="danger-btn small-btn" data-delete-workout="${w.id}">Eliminar</button>
</div>
</div>
`;
}).join("")
: `<div class="empty">Todavía no hay sesiones. Registra tu primer entrenamiento.</div>`
}
</div>

<div class="card">
<div class="section-head">
<h2>Progreso por ejercicio</h2>
<button class="secondary-btn" id="manageExercisesBtn">Gestionar</button>
</div>

${
exercises.length
? `
<select id="progressExerciseSelect">
${exercises.map((ex, i) => `
<option value="${esc(ex)}" ${i === 0 ? "selected" : ""}>${esc(ex)}</option>
`).join("")}
</select>

<div id="exerciseProgressBox"></div>
`
: `<div class="empty">Registra un ejercicio para empezar a ver progreso.</div>`
}
</div>
</div>

<div class="card" style="margin-top:18px;">
<div class="section-head">
<h2>Biblioteca de ejercicios</h2>
<button class="primary-btn" id="newExerciseBtn">＋ Añadir ejercicio</button>
</div>

${
exercises.length
? `
<div class="grid grid-3">
${exercises.map(ex => {
const progress = exerciseProgress(ex);
return `
<div class="exercise-progress">
<div>
<strong>${esc(ex)}</strong>
<div style="color:var(--muted);font-size:12px;margin-top:4px;">
${progress.sessions} sesiones · ${fmt(progress.volume)} kg
</div>
</div>
${
progress.maxWeight > 0
? `<span class="pr-badge">PR ${fmt(progress.maxWeight,1)} kg</span>`
: ""
}
</div>
`;
}).join("")}
</div>
`
: `<div class="empty">Tu biblioteca aparecerá aquí.</div>`
}
</div>
`;
}

function getAllTrainingExercises() {
const names = new Set(data.training.exerciseLibrary || []);

data.training.workouts.forEach(workout => {
workout.exercises.forEach(ex => {
if (ex.name) names.add(ex.name);
});
});

return [...names].sort((a,b) => a.localeCompare(b, "es"));
}

function trainingOverallStats() {
let volume = 0;
let sets = 0;

data.training.workouts.forEach(workout => {
const s = workoutStats(workout);
volume += s.volume;
sets += s.sets;
});

const now = dateObj(getToday());
const weekStart = new Date(now);
const day = weekStart.getDay() || 7;
weekStart.setDate(weekStart.getDate() - day + 1);

const weekSessions = data.training.workouts.filter(w => {
const d = dateObj(w.date);
return d >= weekStart && d <= now;
}).length;

return {
sessions: data.training.workouts.length,
weekSessions,
volume,
sets
};
}

function workoutStats(workout) {
let volume = 0;
let sets = 0;

workout.exercises.forEach(ex => {
ex.sets.forEach(set => {
if (!set.warmup) {
volume += Number(set.weight || 0) * Number(set.reps || 0);
}

if (Number(set.reps || 0) > 0) sets++;
});
});

return {
volume,
sets
};
}

function exerciseProgress(name) {
const records = [];

data.training.workouts.forEach(workout => {
workout.exercises.forEach(ex => {
if (ex.name.toLowerCase() !== name.toLowerCase()) return;

ex.sets.forEach(set => {
const weight = Number(set.weight || 0);
const reps = Number(set.reps || 0);

if (reps > 0) {
records.push({
date: workout.date,
weight,
reps,
volume: weight * reps,
rir: set.rir
});
}
});
});
});

records.sort((a,b) => a.date.localeCompare(b.date));

const maxWeight = records.reduce(
(max, r) => Math.max(max, r.weight),
0
);

const volume = records.reduce(
(sum, r) => sum + r.volume,
0
);

const sessions = new Set(records.map(r => r.date)).size;

return {
records,
maxWeight,
volume,
sessions
};
}

function renderExerciseProgress(name) {
const box = document.getElementById("exerciseProgressBox");
if (!box) return;

const progress = exerciseProgress(name);
const records = progress.records.slice(-10);

if (!records.length) {
box.innerHTML = `<div class="empty">Todavía no hay datos de este ejercicio.</div>`;
return;
}

const max = Math.max(...records.map(r => r.weight), 1);
const width = 100;
const height = 100;

const points = records.map((r, i) => {
const x = records.length === 1
? width / 2
: (i / (records.length - 1)) * width;

const y = height - ((r.weight / max) * 75 + 10);

return `${x},${y}`;
}).join(" ");

box.innerHTML = `
<div class="metric-grid" style="margin-top:15px;">
<div class="metric">
<span>Mayor peso</span>
<strong>${fmt(progress.maxWeight,1)} kg</strong>
</div>
<div class="metric">
<span>Sesiones</span>
<strong>${progress.sessions}</strong>
</div>
<div class="metric">
<span>Volumen</span>
<strong>${fmt(progress.volume)}</strong>
</div>
</div>

<div class="mini-chart">
<svg class="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
<polyline class="chart-line" points="${points}"></polyline>
${records.map((r,i) => {
const x = records.length === 1 ? 50 : (i / (records.length - 1)) * 100;
const y = height - ((r.weight / max) * 75 + 10);
return `<circle class="chart-dot" cx="${x}" cy="${y}" r="2.2"></circle>`;
}).join("")}
</svg>
</div>

<div>
${records.slice().reverse().map(r => `
<div class="history-row">
<div>
<strong>${shortDate(r.date)}</strong>
<div style="color:var(--muted);font-size:12px;">
${r.reps} reps · ${r.rir === "" || r.rir == null ? "RIR —" : `RIR ${r.rir}`}
</div>
</div>
<strong>${fmt(r.weight,1)} kg</strong>
</div>
`).join("")}
</div>
`;
}

function openWorkoutEditor(workoutId = null, duplicateId = null) {
editingWorkoutId = workoutId;

let workout;

if (duplicateId) {
const source = data.training.workouts.find(w => w.id === duplicateId);
if (!source) return;

workout = structuredClone(source);
workout.id = uid("workout");
workout.date = currentDate;
workout.exercises.forEach(ex => {
ex.id = uid("exercise");
ex.sets.forEach(set => set.id = uid("set"));
});
} else if (workoutId) {
workout = structuredClone(
data.training.workouts.find(w => w.id === workoutId)
);

if (!workout) return;
} else {
workout = {
id: uid("workout"),
date: currentDate,
name: "",
duration: "",
notes: "",
exercises: []
};
}

const modal = document.createElement("div");
modal.className = "modal-backdrop";

modal.innerHTML = `
<div class="modal large">
<div class="modal-head">
<h2>${workoutId ? "Editar entrenamiento" : "Nueva sesión"}</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<div class="workout-editor">
<div class="form-grid">
<div class="form-group">
<label>Nombre del entrenamiento</label>
<input id="workoutName" value="${esc(workout.name)}" placeholder="Ej. Push, Pull, Upper...">
</div>

<div class="form-group">
<label>Fecha</label>
<input id="workoutDate" type="date" value="${workout.date}">
</div>

<div class="form-group">
<label>Duración (minutos)</label>
<input id="workoutDuration" type="number" min="0" value="${esc(workout.duration)}" placeholder="75">
</div>

<div class="form-group">
<label>Notas de la sesión</label>
<input id="workoutNotes" value="${esc(workout.notes)}" placeholder="Cómo fue el entrenamiento...">
</div>
</div>

<div class="editor-toolbar">
<h3 style="margin:0;">Ejercicios</h3>
<button class="primary-btn" id="addExerciseToWorkout">＋ Añadir ejercicio</button>
</div>

<div id="workoutExercises"></div>

<div class="modal-actions">
<button class="secondary-btn" id="cancelWorkout">Cancelar</button>
<button class="primary-btn" id="saveWorkout">Guardar entrenamiento</button>
</div>
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

const exerciseContainer = modal.querySelector("#workoutExercises");

function drawExercises() {
if (!workout.exercises.length) {
exerciseContainer.innerHTML = `
<div class="empty" style="border:1px dashed var(--border);border-radius:14px;">
Añade tu primer ejercicio.
</div>
`;
return;
}

exerciseContainer.innerHTML = workout.exercises.map((ex, exIndex) => `
<div class="exercise-card" data-exercise-id="${ex.id}">
<div class="exercise-head">
<div style="flex:1;">
<input
class="exercise-name-input"
data-index="${exIndex}"
value="${esc(ex.name)}"
placeholder="Nombre del ejercicio"
list="exerciseOptions"
>
<span>${ex.sets.length} series registradas</span>
</div>

<button class="danger-btn small-btn" data-remove-exercise="${ex.id}">
Eliminar
</button>
</div>

<div style="margin-bottom:12px;">
<input
class="exercise-notes-input"
data-index="${exIndex}"
value="${esc(ex.notes || "")}"
placeholder="Notas del ejercicio (opcional)"
>
</div>

<div style="overflow-x:auto;">
<table class="set-table">
<thead>
<tr>
<th>#</th>
<th>Kg</th>
<th>Reps</th>
<th>RIR</th>
<th>Calentamiento</th>
<th></th>
</tr>
</thead>

<tbody>
${ex.sets.map((set, setIndex) => `
<tr>
<td class="set-number">${setIndex + 1}</td>
<td>
<input
type="number"
min="0"
step="0.25"
value="${esc(set.weight)}"
data-set-field="weight"
data-ex="${exIndex}"
data-set="${setIndex}"
>
</td>
<td>
<input
type="number"
min="0"
step="1"
value="${esc(set.reps)}"
data-set-field="reps"
data-ex="${exIndex}"
data-set="${setIndex}"
>
</td>
<td>
<input
type="number"
min="0"
max="10"
step="1"
value="${set.rir ?? ""}"
data-set-field="rir"
data-ex="${exIndex}"
data-set="${setIndex}"
>
</td>
<td style="text-align:center;">
<input
type="checkbox"
${set.warmup ? "checked" : ""}
data-set-field="warmup"
data-ex="${exIndex}"
data-set="${setIndex}"
>
</td>
<td>
<button class="danger-btn small-btn" data-remove-set="${exIndex}" data-set-index="${setIndex}">×</button>
</td>
</tr>
`).join("")}
</tbody>
</table>
</div>

<button class="secondary-btn" data-add-set="${exIndex}" style="margin-top:10px;">
＋ Añadir serie
</button>
</div>
`).join("");

const datalist = document.createElement("datalist");
datalist.id = "exerciseOptions";

getAllTrainingExercises().forEach(name => {
const option = document.createElement("option");
option.value = name;
datalist.appendChild(option);
});

modal.appendChild(datalist);

modal.querySelectorAll(".exercise-name-input").forEach(input => {
input.oninput = e => {
workout.exercises[Number(e.target.dataset.index)].name = e.target.value;
};
});

modal.querySelectorAll(".exercise-notes-input").forEach(input => {
input.oninput = e => {
workout.exercises[Number(e.target.dataset.index)].notes = e.target.value;
};
});

modal.querySelectorAll("[data-set-field]").forEach(input => {
input.oninput = e => {
const ex = workout.exercises[Number(e.target.dataset.ex)];
const set = ex.sets[Number(e.target.dataset.set)];
const field = e.target.dataset.setField;

if (field === "warmup") {
set[field] = e.target.checked;
} else if (field === "rir") {
set[field] = e.target.value === "" ? "" : Number(e.target.value);
} else {
set[field] = Number(e.target.value);
}
};
});

modal.querySelectorAll("[data-remove-exercise]").forEach(button => {
button.onclick = () => {
workout.exercises = workout.exercises.filter(
ex => ex.id !== button.dataset.removeExercise
);
drawExercises();
};
});

modal.querySelectorAll("[data-add-set]").forEach(button => {
button.onclick = () => {
const ex = workout.exercises[Number(button.dataset.addSet)];

ex.sets.push({
id: uid("set"),
weight: 0,
reps: 0,
rir: "",
warmup: false
});

drawExercises();
};
});

modal.querySelectorAll("[data-remove-set]").forEach(button => {
button.onclick = () => {
const ex = workout.exercises[Number(button.dataset.removeSet)];
ex.sets.splice(Number(button.dataset.setIndex), 1);
drawExercises();
};
});
}

modal.querySelector("#addExerciseToWorkout").onclick = () => {
workout.exercises.push({
id: uid("exercise"),
name: "",
notes: "",
sets: [
{
id: uid("set"),
weight: 0,
reps: 0,
rir: "",
warmup: false
}
]
});

drawExercises();
};

modal.querySelector("#closeModal").onclick = closeModal;
modal.querySelector("#cancelWorkout").onclick = closeModal;

modal.querySelector("#saveWorkout").onclick = () => {
workout.name = modal.querySelector("#workoutName").value.trim() || "Entrenamiento";
workout.date = modal.querySelector("#workoutDate").value || currentDate;
workout.duration = Number(modal.querySelector("#workoutDuration").value || 0);
workout.notes = modal.querySelector("#workoutNotes").value.trim();

workout.exercises = workout.exercises.filter(ex => ex.name.trim());

workout.exercises.forEach(ex => {
ex.name = ex.name.trim();

if (!data.training.exerciseLibrary.includes(ex.name)) {
data.training.exerciseLibrary.push(ex.name);
}

ex.sets = ex.sets.filter(set => Number(set.reps) > 0);
});

workout.exercises = workout.exercises.filter(ex => ex.sets.length);

const existingIndex = data.training.workouts.findIndex(w => w.id === workout.id);

if (existingIndex >= 0) {
data.training.workouts[existingIndex] = workout;
} else {
data.training.workouts.push(workout);
}

saveData();
closeModal();

currentDate = workout.date;
currentView = "training";
render();

toast("Entrenamiento guardado");
};

drawExercises();
}

function openExerciseManager() {
const modal = document.createElement("div");
modal.className = "modal-backdrop";

const exercises = getAllTrainingExercises();

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>Biblioteca de ejercicios</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<div class="form-group" style="margin-bottom:18px;">
<label>Nuevo ejercicio</label>
<div style="display:flex;gap:8px;">
<input id="newExerciseName" placeholder="Ej. Press banca">
<button class="primary-btn" id="addExercise">Añadir</button>
</div>
</div>

<div id="exerciseManagerList">
${
exercises.length
? exercises.map(name => `
<div class="food-row">
<div class="food-info">
<strong>${esc(name)}</strong>
</div>
<button class="danger-btn small-btn" data-delete-exercise="${esc(name)}">Eliminar</button>
</div>
`).join("")
: `<div class="empty">No tienes ejercicios guardados.</div>`
}
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

modal.querySelector("#closeModal").onclick = closeModal;

modal.querySelector("#addExercise").onclick = () => {
const input = modal.querySelector("#newExerciseName");
const name = input.value.trim();

if (!name) return;

if (!data.training.exerciseLibrary.includes(name)) {
data.training.exerciseLibrary.push(name);
saveData();
toast("Ejercicio añadido");
}

closeModal();
render();
};

modal.querySelectorAll("[data-delete-exercise]").forEach(button => {
button.onclick = () => {
const name = button.dataset.deleteExercise;

data.training.exerciseLibrary =
data.training.exerciseLibrary.filter(x => x !== name);

saveData();
closeModal();
openExerciseManager();
};
});
}

/* =========================
FOODS
========================= */

function foodsHTML() {
return `
<div class="section-head">
<div>
<h2>Mis alimentos</h2>
<span style="color:var(--muted);font-size:12px;">Valores nutricionales por 100 g/ml</span>
</div>
<button class="primary-btn" id="newFoodBtn">＋ Nuevo alimento</button>
</div>

<div class="card">
<input class="search" id="foodSearch" placeholder="Buscar alimento...">

<div id="foodList">
${foodListHTML(data.foods)}
</div>
</div>
`;
}

function foodListHTML(foods) {
if (!foods.length) {
return `<div class="empty">No se encontraron alimentos.</div>`;
}

return foods.map(food => `
<div class="food-row">
<div class="food-info">
<strong>${esc(food.name)}</strong>
<span>
${fmt(food.kcal)} kcal ·
P ${fmt(food.protein,1)} g ·
C ${fmt(food.carbs,1)} g ·
G ${fmt(food.fat,1)} g
· por 100 ${food.unit}
</span>
</div>

<div class="row-actions">
<button class="small-btn" data-edit-food="${food.id}">Editar</button>
<button class="danger-btn small-btn" data-delete-food="${food.id}">Eliminar</button>
</div>
</div>
`).join("");
}

function openFoodEditor(foodId = null) {
const food = foodId
? structuredClone(data.foods.find(f => f.id === foodId))
: {
id: uid("food"),
name: "",
kcal: 0,
protein: 0,
carbs: 0,
fat: 0,
unit: "g"
};

const modal = document.createElement("div");
modal.className = "modal-backdrop";

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>${foodId ? "Editar alimento" : "Nuevo alimento"}</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<div class="form-grid">
<div class="form-group full">
<label>Nombre</label>
<input id="foodName" value="${esc(food.name)}">
</div>

<div class="form-group">
<label>Calorías / 100</label>
<input id="foodKcal" type="number" step="0.1" value="${food.kcal}">
</div>

<div class="form-group">
<label>Proteína / 100 g</label>
<input id="foodProtein" type="number" step="0.1" value="${food.protein}">
</div>

<div class="form-group">
<label>Carbohidratos / 100 g</label>
<input id="foodCarbs" type="number" step="0.1" value="${food.carbs}">
</div>

<div class="form-group">
<label>Grasas / 100 g</label>
<input id="foodFat" type="number" step="0.1" value="${food.fat}">
</div>

<div class="form-group">
<label>Unidad</label>
<select id="foodUnit">
<option value="g" ${food.unit === "g" ? "selected" : ""}>gramos</option>
<option value="ml" ${food.unit === "ml" ? "selected" : ""}>ml</option>
<option value="ud" ${food.unit === "ud" ? "selected" : ""}>unidad</option>
</select>
</div>
</div>

<div class="modal-actions">
<button class="secondary-btn" id="cancelFood">Cancelar</button>
<button class="primary-btn" id="saveFood">Guardar</button>
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

modal.querySelector("#closeModal").onclick = closeModal;
modal.querySelector("#cancelFood").onclick = closeModal;

modal.querySelector("#saveFood").onclick = () => {
const updated = {
id: food.id,
name: modal.querySelector("#foodName").value.trim(),
kcal: Number(modal.querySelector("#foodKcal").value || 0),
protein: Number(modal.querySelector("#foodProtein").value || 0),
carbs: Number(modal.querySelector("#foodCarbs").value || 0),
fat: Number(modal.querySelector("#foodFat").value || 0),
unit: modal.querySelector("#foodUnit").value
};

if (!updated.name) {
toast("Escribe un nombre");
return;
}

const index = data.foods.findIndex(f => f.id === food.id);

if (index >= 0) {
data.foods[index] = updated;
} else {
data.foods.push(updated);
}

saveData();
closeModal();
render();
toast("Alimento guardado");
};
}

/* =========================
RECIPES
========================= */

function recipesHTML() {
return `
<div class="section-head">
<div>
<h2>Recetas</h2>
<span style="color:var(--muted);font-size:12px;">Guarda tus comidas completas y añádelas al diario.</span>
</div>
<button class="primary-btn" id="newRecipeBtn">＋ Nueva receta</button>
</div>

<div class="grid grid-2">
${
data.recipes.length
? data.recipes.map(recipe => {
const totals = recipeTotals(recipe);

return `
<div class="card">
<div class="section-head">
<div>
<h2 style="margin-bottom:4px;">${esc(recipe.name)}</h2>
<span style="color:var(--muted);font-size:12px;">
${recipe.ingredients.length} ingredientes
</span>
</div>

<div class="row-actions">
<button class="small-btn" data-add-recipe="${recipe.id}">Añadir</button>
<button class="small-btn" data-edit-recipe="${recipe.id}">Editar</button>
<button class="danger-btn small-btn" data-delete-recipe="${recipe.id}">×</button>
</div>
</div>

<div class="metric-grid">
<div class="metric">
<span>Calorías</span>
<strong>${fmt(totals.kcal)}</strong>
</div>
<div class="metric">
<span>Proteína</span>
<strong>${fmt(totals.protein,1)} g</strong>
</div>
<div class="metric">
<span>Carbos</span>
<strong>${fmt(totals.carbs,1)} g</strong>
</div>
</div>
</div>
`;
}).join("")
: `<div class="card empty">Todavía no tienes recetas.</div>`
}
</div>
`;
}

function recipeTotals(recipe) {
return recipe.ingredients.reduce((total, item) => {
const food = data.foods.find(f => f.id === item.foodId);
if (!food) return total;

const values = calcFood(food, item.amount);

total.kcal += values.kcal;
total.protein += values.protein;
total.carbs += values.carbs;
total.fat += values.fat;

return total;
}, {
kcal: 0,
protein: 0,
carbs: 0,
fat: 0
});
}

function openRecipeEditor(recipeId = null) {
const recipe = recipeId
? structuredClone(data.recipes.find(r => r.id === recipeId))
: {
id: uid("recipe"),
name: "",
ingredients: []
};

const modal = document.createElement("div");
modal.className = "modal-backdrop";

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>${recipeId ? "Editar receta" : "Nueva receta"}</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<div class="form-group" style="margin-bottom:18px;">
<label>Nombre</label>
<input id="recipeName" value="${esc(recipe.name)}" placeholder="Ej. Arroz con pollo">
</div>

<div class="section-head">
<h3>Ingredientes</h3>
<button class="secondary-btn" id="addIngredient">＋ Añadir</button>
</div>

<div id="recipeIngredients"></div>

<div class="modal-actions">
<button class="secondary-btn" id="cancelRecipe">Cancelar</button>
<button class="primary-btn" id="saveRecipe">Guardar</button>
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

const list = modal.querySelector("#recipeIngredients");

function drawIngredients() {
if (!recipe.ingredients.length) {
list.innerHTML = `<div class="empty">Añade ingredientes a la receta.</div>`;
return;
}

list.innerHTML = recipe.ingredients.map((item, index) => `
<div class="food-row">
<div style="flex:1;">
<select data-recipe-food="${index}">
<option value="">Selecciona alimento</option>
${data.foods.map(food => `
<option value="${food.id}" ${food.id === item.foodId ? "selected" : ""}>
${esc(food.name)}
</option>
`).join("")}
</select>
</div>

<div style="width:120px;">
<input
type="number"
min="0"
step="1"
value="${item.amount}"
data-recipe-amount="${index}"
placeholder="Cantidad"
>
</div>

<button class="danger-btn small-btn" data-remove-ingredient="${index}">×</button>
</div>
`).join("");

list.querySelectorAll("[data-recipe-food]").forEach(select => {
select.onchange = e => {
recipe.ingredients[Number(e.target.dataset.recipeFood)].foodId = e.target.value;
};
});

list.querySelectorAll("[data-recipe-amount]").forEach(input => {
input.oninput = e => {
recipe.ingredients[Number(e.target.dataset.recipeAmount)].amount =
Number(e.target.value || 0);
};
});

list.querySelectorAll("[data-remove-ingredient]").forEach(button => {
button.onclick = () => {
recipe.ingredients.splice(Number(button.dataset.removeIngredient), 1);
drawIngredients();
};
});
}

modal.querySelector("#addIngredient").onclick = () => {
recipe.ingredients.push({
foodId: data.foods[0]?.id || "",
amount: 100
});

drawIngredients();
};

modal.querySelector("#closeModal").onclick = closeModal;
modal.querySelector("#cancelRecipe").onclick = closeModal;

modal.querySelector("#saveRecipe").onclick = () => {
recipe.name = modal.querySelector("#recipeName").value.trim();

if (!recipe.name) {
toast("Escribe un nombre para la receta");
return;
}

recipe.ingredients = recipe.ingredients.filter(i => i.foodId && i.amount > 0);

const index = data.recipes.findIndex(r => r.id === recipe.id);

if (index >= 0) {
data.recipes[index] = recipe;
} else {
data.recipes.push(recipe);
}

saveData();
closeModal();
render();
toast("Receta guardada");
};

drawIngredients();
}

function addRecipeToDay(recipeId) {
const recipe = data.recipes.find(r => r.id === recipeId);
if (!recipe) return;

openMealSelector(recipe);
}

function openMealSelector(recipe) {
const modal = document.createElement("div");
modal.className = "modal-backdrop";

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>Añadir receta</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<p style="color:var(--muted);">
¿En qué comida quieres añadir "${esc(recipe.name)}"?
</p>

<div class="grid grid-2">
${Object.keys(getDay().meals).map(meal => `
<button class="secondary-btn" data-select-meal="${meal}">
${meal}
</button>
`).join("")}
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

modal.querySelector("#closeModal").onclick = closeModal;

modal.querySelectorAll("[data-select-meal]").forEach(button => {
button.onclick = () => {
const meal = button.dataset.selectMeal;
const totals = recipeTotals(recipe);

getDay().meals[meal].push({
id: uid("meal"),
name: recipe.name,
amount: 1,
unit: "ración",
kcal: totals.kcal,
protein: totals.protein,
carbs: totals.carbs,
fat: totals.fat,
recipeId: recipe.id
});

saveData();
closeModal();
toast("Receta añadida al diario");
};
});
}

/* =========================
HISTORY
========================= */

function historyHTML() {
const weights = data.weights
.slice()
.sort((a,b) => a.date.localeCompare(b.date));

const days = Object.keys(data.days).sort((a,b) => b.localeCompare(a));

return `
<div class="grid grid-2">
<div class="card">
<div class="section-head">
<h2>Peso</h2>
<button class="primary-btn" id="addWeightBtn">＋ Registrar</button>
</div>

${
weights.length
? `
<div class="metric-grid">
<div class="metric">
<span>Actual</span>
<strong>${fmt(weights.at(-1).weight,1)} kg</strong>
</div>
<div class="metric">
<span>Inicial</span>
<strong>${fmt(weights[0].weight,1)} kg</strong>
</div>
<div class="metric">
<span>Cambio</span>
<strong>${fmt(weights.at(-1).weight - weights[0].weight,1)} kg</strong>
</div>
</div>

<div class="weight-chart" style="margin-top:20px;">
${weightChart(weights)}
</div>
`
: `<div class="empty">Todavía no has registrado peso.</div>`
}
</div>

<div class="card">
<div class="section-head">
<h2>Días registrados</h2>
</div>

${
days.length
? days.map(date => {
const totals = dayTotals(date);

return `
<div class="history-row">
<div>
<strong>${esc(formatDate(date))}</strong>
<div style="color:var(--muted);font-size:12px;">
${fmt(totals.kcal)} kcal ·
P ${fmt(totals.protein,1)} ·
C ${fmt(totals.carbs,1)} ·
G ${fmt(totals.fat,1)}
</div>
</div>
<button class="small-btn" data-open-date="${date}">Abrir</button>
</div>
`;
}).join("")
: `<div class="empty">No hay días registrados todavía.</div>`
}
</div>
</div>

<div class="card" style="margin-top:18px;">
<div class="section-head">
<h2>Historial de peso</h2>
</div>

${
weights.length
? weights.slice().reverse().map(w => `
<div class="history-row">
<div>
<strong>${shortDate(w.date)}</strong>
</div>
<strong>${fmt(w.weight,1)} kg</strong>
<button class="danger-btn small-btn" data-delete-weight="${w.id}">Eliminar</button>
</div>
`).join("")
: `<div class="empty">Sin registros.</div>`
}
</div>
`;
}

function weightChart(weights) {
const max = Math.max(...weights.map(x => x.weight));
const min = Math.min(...weights.map(x => x.weight));
const range = Math.max(max - min, 1);

return `
<div class="chart-bars">
${weights.slice(-20).map(w => {
const height = 15 + ((w.weight - min) / range) * 85;

return `
<div
class="bar"
style="height:${height}%"
title="${shortDate(w.date)} · ${fmt(w.weight,1)} kg"
></div>
`;
}).join("")}
</div>
`;
}

/* =========================
SETTINGS
========================= */

function settingsHTML() {
return `
<div class="grid grid-2">
<div class="card">
<h2>Objetivos diarios</h2>

<div class="form-grid">
<div class="form-group">
<label>Calorías</label>
<input id="targetKcal" type="number" value="${data.settings.kcal}">
</div>

<div class="form-group">
<label>Proteína (g)</label>
<input id="targetProtein" type="number" step="0.1" value="${data.settings.protein}">
</div>

<div class="form-group">
<label>Carbohidratos (g)</label>
<input id="targetCarbs" type="number" step="0.1" value="${data.settings.carbs}">
</div>

<div class="form-group">
<label>Grasas (g)</label>
<input id="targetFat" type="number" step="0.1" value="${data.settings.fat}">
</div>
</div>

<button class="primary-btn" id="saveTargets" style="margin-top:18px;">
Guardar objetivos
</button>
</div>

<div class="card">
<h2>Datos</h2>

<div class="setting-row">
<div>
<strong>Exportar copia</strong>
<div style="color:var(--muted);font-size:12px;">Guarda todos tus datos en un archivo.</div>
</div>
<button class="secondary-btn" id="exportBtn">Exportar</button>
</div>

<div class="setting-row">
<div>
<strong>Importar copia</strong>
<div style="color:var(--muted);font-size:12px;">Restaura una copia anterior.</div>
</div>
<button class="secondary-btn" id="importBtn">Importar</button>
</div>

<div class="setting-row">
<div>
<strong>Eliminar todos los datos</strong>
<div style="color:var(--muted);font-size:12px;">Borra alimentos, comidas, recetas y entrenamientos.</div>
</div>
<button class="danger-btn" id="resetBtn">Borrar</button>
</div>
</div>
</div>
`;
}

/* =========================
VIEW EVENTS
========================= */

function bindViewEvents() {
document.querySelectorAll("[data-edit-workout]").forEach(button => {
button.onclick = () => openWorkoutEditor(button.dataset.editWorkout);
});

document.querySelectorAll("[data-copy-workout]").forEach(button => {
button.onclick = () => openWorkoutEditor(null, button.dataset.copyWorkout);
});

document.querySelectorAll("[data-delete-workout]").forEach(button => {
button.onclick = () => {
if (!confirm("¿Eliminar este entrenamiento?")) return;

data.training.workouts =
data.training.workouts.filter(w => w.id !== button.dataset.deleteWorkout);

saveData();
render();
toast("Entrenamiento eliminado");
};
});

const prev = document.getElementById("prevDay");
const next = document.getElementById("nextDay");
const today = document.getElementById("todayBtn");

if (prev) {
prev.onclick = () => {
const d = dateObj(currentDate);
d.setDate(d.getDate() - 1);
currentDate = formatDateInput(d);
render();
};
}

if (next) {
next.onclick = () => {
const d = dateObj(currentDate);
d.setDate(d.getDate() + 1);
currentDate = formatDateInput(d);
render();
};
}

if (today) {
today.onclick = () => {
currentDate = getToday();
render();
};
}

document.getElementById("openDayBtn")?.addEventListener("click", () => {
currentView = "day";
render();
});

document.getElementById("goTraining")?.addEventListener("click", () => {
currentView = "training";
render();
});

document.getElementById("newTrainingDashboard")?.addEventListener("click", () => {
openWorkoutEditor();
});

document.querySelectorAll("[data-meal-tab]").forEach((button, index) => {
button.onclick = () => {
document.querySelectorAll("[data-meal-tab]").forEach(b => b.classList.remove("active"));
button.classList.add("active");
document.getElementById("mealContainer").innerHTML =
renderMeal(button.dataset.meal);
bindMealEvents();
};

if (index === 0) {
document.getElementById("mealContainer").innerHTML =
renderMeal(button.dataset.meal);
bindMealEvents();
}
});

document.getElementById("copyDayBtn")?.addEventListener("click", copyDay);

document.getElementById("newTrainingBtn")?.addEventListener("click", () => {
openWorkoutEditor();
});

document.getElementById("copyLastWorkoutBtn")?.addEventListener("click", () => {
const workout = data.training.workouts
.slice()
.sort((a,b) => b.date.localeCompare(a.date))[0];

if (workout) openWorkoutEditor(null, workout.id);
});

document.getElementById("newExerciseBtn")?.addEventListener("click", () => {
openExerciseManager();
});

document.getElementById("manageExercisesBtn")?.addEventListener("click", () => {
openExerciseManager();
});

document.getElementById("progressExerciseSelect")?.addEventListener("change", e => {
renderExerciseProgress(e.target.value);
});

if (document.getElementById("progressExerciseSelect")) {
renderExerciseProgress(document.getElementById("progressExerciseSelect").value);
}

document.getElementById("newFoodBtn")?.addEventListener("click", () => {
openFoodEditor();
});

document.getElementById("foodSearch")?.addEventListener("input", e => {
const q = e.target.value.toLowerCase().trim();

document.getElementById("foodList").innerHTML =
foodListHTML(data.foods.filter(f => f.name.toLowerCase().includes(q)));

bindFoodEvents();
});

bindFoodEvents();

document.getElementById("newRecipeBtn")?.addEventListener("click", () => {
openRecipeEditor();
});

document.querySelectorAll("[data-edit-recipe]").forEach(button => {
button.onclick = () => openRecipeEditor(button.dataset.editRecipe);
});

document.querySelectorAll("[data-delete-recipe]").forEach(button => {
button.onclick = () => {
if (!confirm("¿Eliminar esta receta?")) return;

data.recipes =
data.recipes.filter(r => r.id !== button.dataset.deleteRecipe);

saveData();
render();
toast("Receta eliminada");
};
});

document.querySelectorAll("[data-add-recipe]").forEach(button => {
button.onclick = () => addRecipeToDay(button.dataset.addRecipe);
});

document.getElementById("addWeightBtn")?.addEventListener("click", openWeightModal);

document.querySelectorAll("[data-delete-weight]").forEach(button => {
button.onclick = () => {
data.weights =
data.weights.filter(w => w.id !== button.dataset.deleteWeight);

saveData();
render();
toast("Registro eliminado");
};
});

document.querySelectorAll("[data-open-date]").forEach(button => {
button.onclick = () => {
currentDate = button.dataset.openDate;
currentView = "day";
render();
};
});

document.getElementById("saveTargets")?.addEventListener("click", () => {
data.settings.kcal = Number(document.getElementById("targetKcal").value || 0);
data.settings.protein = Number(document.getElementById("targetProtein").value || 0);
data.settings.carbs = Number(document.getElementById("targetCarbs").value || 0);
data.settings.fat = Number(document.getElementById("targetFat").value || 0);

saveData();
toast("Objetivos guardados");
render();
});

document.getElementById("exportBtn")?.addEventListener("click", exportData);
document.getElementById("importBtn")?.addEventListener("click", importData);

document.getElementById("resetBtn")?.addEventListener("click", () => {
if (!confirm("Esto eliminará TODOS tus datos. ¿Continuar?")) return;

localStorage.removeItem(STORAGE_KEY);
data = structuredClone(DEFAULT_DATA);
currentDate = getToday();
currentView = "dashboard";
applyTheme();
render();
toast("Datos eliminados");
});
}

function bindFoodEvents() {
document.querySelectorAll("[data-edit-food]").forEach(button => {
button.onclick = () => openFoodEditor(button.dataset.editFood);
});

document.querySelectorAll("[data-delete-food]").forEach(button => {
button.onclick = () => {
const food = data.foods.find(f => f.id === button.dataset.deleteFood);

if (!food) return;

if (!confirm(`¿Eliminar "${food.name}"?`)) return;

data.foods = data.foods.filter(f => f.id !== food.id);

saveData();
render();
toast("Alimento eliminado");
};
});
}

function bindMealEvents() {
document.querySelectorAll("[data-delete-meal-item]").forEach(button => {
button.onclick = () => {
const meal = button.dataset.meal;
const id = button.dataset.deleteMealItem;

getDay().meals[meal] =
getDay().meals[meal].filter(item => item.id !== id);

saveData();
render();
toast("Alimento eliminado");
};
});

document.querySelectorAll("[data-edit-meal-item]").forEach(button => {
button.onclick = () => {
const meal = button.dataset.meal;
const id = button.dataset.editMealItem;

const item = getDay().meals[meal].find(x => x.id === id);
if (item) openMealFoodEditor(meal, item);
};
});

document.querySelectorAll("[data-meal-tab]").forEach(button => {
// Eventos ya asignados desde bindViewEvents.
});

document.getElementById("addMealFood")?.addEventListener("click", e => {
openAddFoodModal(e.target.dataset.meal);
});
}

function openAddFoodModal(meal) {
const modal = document.createElement("div");
modal.className = "modal-backdrop";

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>Añadir alimento</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<input id="modalFoodSearch" class="search" placeholder="Buscar alimento...">

<div id="modalFoodList">
${data.foods.map(food => `
<div class="food-row">
<div class="food-info">
<strong>${esc(food.name)}</strong>
<span>${fmt(food.kcal)} kcal / 100 ${food.unit}</span>
</div>
<button class="small-btn" data-choose-food="${food.id}">Elegir</button>
</div>
`).join("")}
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

modal.querySelector("#closeModal").onclick = closeModal;

modal.querySelector("#modalFoodSearch").oninput = e => {
const q = e.target.value.toLowerCase();

modal.querySelector("#modalFoodList").innerHTML =
data.foods
.filter(f => f.name.toLowerCase().includes(q))
.map(food => `
<div class="food-row">
<div class="food-info">
<strong>${esc(food.name)}</strong>
<span>${fmt(food.kcal)} kcal / 100 ${food.unit}</span>
</div>
<button class="small-btn" data-choose-food="${food.id}">Elegir</button>
</div>
`).join("");

bindFoodChoiceButtons(modal, meal);
};

bindFoodChoiceButtons(modal, meal);
}

function bindFoodChoiceButtons(modal, meal) {
modal.querySelectorAll("[data-choose-food]").forEach(button => {
button.onclick = () => {
const food = data.foods.find(f => f.id === button.dataset.chooseFood);
if (food) openMealFoodEditor(meal, null, food);

closeModal();
};
});
}

function openMealFoodEditor(meal, existingItem = null, selectedFood = null) {
const food = selectedFood ||
data.foods.find(f => f.name === existingItem?.name);

if (!food) return;

const modal = document.createElement("div");
modal.className = "modal-backdrop";

const initialAmount = existingItem?.amount || 100;

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>${existingItem ? "Editar alimento" : "Añadir alimento"}</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<div class="card" style="background:var(--card-2);box-shadow:none;margin-bottom:15px;">
<strong>${esc(food.name)}</strong>
<div style="color:var(--muted);font-size:12px;margin-top:5px;">
${fmt(food.kcal)} kcal · P ${fmt(food.protein,1)} · C ${fmt(food.carbs,1)} · G ${fmt(food.fat,1)} por 100 ${food.unit}
</div>
</div>

<div class="form-group">
<label>Cantidad (${food.unit})</label>
<input id="mealAmount" type="number" min="0" step="0.1" value="${initialAmount}">
</div>

<div id="mealPreview" style="margin-top:15px;"></div>

<div class="modal-actions">
<button class="secondary-btn" id="cancelModal">Cancelar</button>
<button class="primary-btn" id="saveMealItem">Guardar</button>
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

function updatePreview() {
const amount = Number(modal.querySelector("#mealAmount").value || 0);
const values = calcFood(food, amount);

modal.querySelector("#mealPreview").innerHTML = `
<div class="metric-grid">
<div class="metric">
<span>Calorías</span>
<strong>${fmt(values.kcal)}</strong>
</div>
<div class="metric">
<span>Proteína</span>
<strong>${fmt(values.protein,1)} g</strong>
</div>
<div class="metric">
<span>Carbos</span>
<strong>${fmt(values.carbs,1)} g</strong>
</div>
</div>
`;
}

modal.querySelector("#mealAmount").oninput = updatePreview;

modal.querySelector("#closeModal").onclick = closeModal;
modal.querySelector("#cancelModal").onclick = closeModal;

modal.querySelector("#saveMealItem").onclick = () => {
const amount = Number(modal.querySelector("#mealAmount").value || 0);

if (amount <= 0) {
toast("Introduce una cantidad válida");
return;
}

const values = calcFood(food, amount);

const item = {
id: existingItem?.id || uid("meal"),
name: food.name,
amount,
unit: food.unit,
kcal: values.kcal,
protein: values.protein,
carbs: values.carbs,
fat: values.fat,
foodId: food.id
};

if (existingItem) {
const index = getDay().meals[meal].findIndex(x => x.id === existingItem.id);
if (index >= 0) getDay().meals[meal][index] = item;
} else {
getDay().meals[meal].push(item);
}

saveData();
closeModal();
render();
toast("Diario actualizado");
};

updatePreview();
}

function copyDay() {
const source = getDay(currentDate);

const modal = document.createElement("div");
modal.className = "modal-backdrop";

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>Copiar día</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<p style="color:var(--muted);">
Copiarás las comidas de ${esc(formatDate(currentDate))}.
</p>

<div class="form-group">
<label>Fecha destino</label>
<input id="copyDate" type="date" value="${getToday()}">
</div>

<div class="modal-actions">
<button class="secondary-btn" id="cancelCopy">Cancelar</button>
<button class="primary-btn" id="confirmCopy">Copiar</button>
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

modal.querySelector("#closeModal").onclick = closeModal;
modal.querySelector("#cancelCopy").onclick = closeModal;

modal.querySelector("#confirmCopy").onclick = () => {
const destination = modal.querySelector("#copyDate").value;

if (!destination) return;

data.days[destination] = structuredClone(source);

data.days[destination].meals = Object.fromEntries(
Object.entries(data.days[destination].meals).map(([meal, items]) => [
meal,
items.map(item => ({
...item,
id: uid("meal")
}))
])
);

saveData();
currentDate = destination;
closeModal();
render();
toast("Día copiado");
};
}

function openWeightModal() {
const modal = document.createElement("div");
modal.className = "modal-backdrop";

modal.innerHTML = `
<div class="modal">
<div class="modal-head">
<h2>Registrar peso</h2>
<button class="close-btn" id="closeModal">×</button>
</div>

<div class="form-grid">
<div class="form-group">
<label>Fecha</label>
<input id="weightDate" type="date" value="${currentDate}">
</div>

<div class="form-group">
<label>Peso (kg)</label>
<input id="weightValue" type="number" step="0.1" min="0" placeholder="71.0">
</div>
</div>

<div class="modal-actions">
<button class="secondary-btn" id="cancelWeight">Cancelar</button>
<button class="primary-btn" id="saveWeight">Guardar</button>
</div>
</div>
`;

document.getElementById("modalRoot").appendChild(modal);

modal.querySelector("#closeModal").onclick = closeModal;
modal.querySelector("#cancelWeight").onclick = closeModal;

modal.querySelector("#saveWeight").onclick = () => {
const date = modal.querySelector("#weightDate").value;
const weight = Number(modal.querySelector("#weightValue").value);

if (!date || !weight) {
toast("Introduce fecha y peso");
return;
}

data.weights = data.weights.filter(w => w.date !== date);

data.weights.push({
id: uid("weight"),
date,
weight
});

data.weights.sort((a,b) => a.date.localeCompare(b.date));

saveData();
closeModal();
render();
toast("Peso registrado");
};
}

/* =========================
BACKUP
========================= */

function exportData() {
const blob = new Blob(
[JSON.stringify(data, null, 2)],
{ type: "application/json" }
);

const url = URL.createObjectURL(blob);
const a = document.createElement("a");

a.href = url;
a.download = `nutri-backup-${getToday()}.json`;
a.click();

URL.revokeObjectURL(url);

toast("Copia exportada");
}

function importData() {
const input = document.createElement("input");
input.type = "file";
input.accept = ".json,application/json";

input.onchange = e => {
const file = e.target.files[0];
if (!file) return;

const reader = new FileReader();

reader.onload = event => {
try {
const imported = JSON.parse(event.target.result);

if (!imported.settings || !imported.foods) {
throw new Error("Archivo no válido");
}

data = {
...structuredClone(DEFAULT_DATA),
...imported,
training: {
...structuredClone(DEFAULT_DATA.training),
...(imported.training || {})
}
};

saveData();
applyTheme();
render();
toast("Copia importada");
} catch {
toast("El archivo no es válido");
}
};

reader.readAsText(file);
};

input.click();
}

/* =========================
UTILITIES
========================= */

function closeModal() {
const root = document.getElementById("modalRoot");
root.innerHTML = "";
}

function toast(message) {
const container = document.getElementById("toastContainer");

const item = document.createElement("div");
item.className = "toast";
item.textContent = message;

container.appendChild(item);

setTimeout(() => {
item.remove();
}, 2500);
}