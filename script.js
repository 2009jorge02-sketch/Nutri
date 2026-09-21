document.addEventListener("DOMContentLoaded", () => {

/* =====================================================
BASE DE DATOS
===================================================== */

if (typeof foods === "undefined" || !Array.isArray(foods)) {

console.error("foods.js no está cargado.");

alert(
"No se ha podido cargar la base de datos de alimentos."
);

return;
}

console.log(
"Nutri cargado correctamente:",
foods.length,
"alimentos"
);


/* =====================================================
NAVEGACIÓN
===================================================== */

const navButtons = document.querySelectorAll(".nav-button");
const sections = document.querySelectorAll(".section");

navButtons.forEach(button => {

button.addEventListener("click", () => {

const sectionId = button.dataset.section;

navButtons.forEach(b => {
b.classList.remove("active");
});

sections.forEach(section => {
section.classList.remove("active");
});

button.classList.add("active");

const section = document.getElementById(sectionId);

if (section) {
section.classList.add("active");
}

});

});


/* =====================================================
NUTRICIÓN
===================================================== */

let selectedFood = null;

let dailyFoods =
JSON.parse(localStorage.getItem("nutriDailyFoods")) || [];

let goals =
JSON.parse(localStorage.getItem("nutriGoals")) || {

calories: 2300,
protein: 130,
carbs: 250,
fat: 70

};


const searchInput =
document.getElementById("foodSearch");

const searchResults =
document.getElementById("searchResults");

const selectedFoodBox =
document.getElementById("selectedFoodBox");

const selectedFoodName =
document.getElementById("selectedFoodName");

const gramsInput =
document.getElementById("grams");

const addFoodButton =
document.getElementById("addFood");

const clearSelection =
document.getElementById("clearSelection");

const dailyFoodsContainer =
document.getElementById("dailyFoods");


const goalCalories =
document.getElementById("goalCalories");

const goalProtein =
document.getElementById("goalProtein");

const goalCarbs =
document.getElementById("goalCarbs");

const goalFat =
document.getElementById("goalFat");


goalCalories.value = goals.calories;
goalProtein.value = goals.protein;
goalCarbs.value = goals.carbs;
goalFat.value = goals.fat;


function normalize(text) {

return String(text)
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "");

}


function number(value) {

return Number(
Number(value).toFixed(1)
);

}


function calculateFood(food, grams) {

const multiplier = grams / 100;

return {

calories: food.calories * multiplier,

protein: food.protein * multiplier,

carbs: food.carbs * multiplier,

fat: food.fat * multiplier

};

}


function renderSearchResults(results) {

searchResults.innerHTML = "";

if (!results.length) {

searchResults.innerHTML =
`<div class="empty-state">
No se han encontrado alimentos.
</div>`;

return;
}


results.forEach(food => {

const item =
document.createElement("div");

item.className = "search-result";

item.innerHTML = `

<strong>${escapeHTML(food.name)}</strong>

${food.brand
? `<span>${escapeHTML(food.brand)}</span>`
: ""
}

<small>
${number(food.calories)} kcal /
100 g ·
${number(food.protein)} g proteína
</small>

`;


item.addEventListener("click", () => {

selectFood(food);

});


searchResults.appendChild(item);

});

}


searchInput.addEventListener("input", () => {

const query =
normalize(searchInput.value.trim());


if (!query) {

searchResults.innerHTML = "";

return;
}


const results =
foods
.filter(food => {

return (

normalize(food.name || "")
.includes(query)

||

normalize(food.brand || "")
.includes(query)

||

normalize(food.category || "")
.includes(query)

);

})
.slice(0, 30);


renderSearchResults(results);

});


function selectFood(food) {

selectedFood = food;

selectedFoodBox.classList.remove("hidden");

selectedFoodName.textContent =
food.name;

gramsInput.value = 100;

searchInput.value = food.name;

searchResults.innerHTML = "";

updateFoodPreview();

}


function updateFoodPreview() {

if (!selectedFood) return;

const grams =
Number(gramsInput.value) || 0;

const result =
calculateFood(selectedFood, grams);


document.getElementById("foodCalories")
.textContent =
`${number(result.calories)} kcal`;

document.getElementById("foodProtein")
.textContent =
`${number(result.protein)} g`;

document.getElementById("foodCarbs")
.textContent =
`${number(result.carbs)} g`;

document.getElementById("foodFat")
.textContent =
`${number(result.fat)} g`;

}


gramsInput.addEventListener(
"input",
updateFoodPreview
);


clearSelection.addEventListener("click", () => {

selectedFood = null;

selectedFoodBox.classList.add("hidden");

searchInput.value = "";

searchResults.innerHTML = "";

});


addFoodButton.addEventListener("click", () => {

if (!selectedFood) {

alert("Selecciona primero un alimento.");

return;
}


const grams =
Number(gramsInput.value);


if (!grams || grams <= 0) {

alert("Introduce una cantidad válida.");

return;
}


dailyFoods.push({

id: generateId(),

foodId: selectedFood.id,

name: selectedFood.name,

brand: selectedFood.brand,

grams: grams

});


saveDailyFoods();

renderDailyFoods();

updateDailyTotals();

});


function renderDailyFoods() {

dailyFoodsContainer.innerHTML = "";


if (!dailyFoods.length) {

dailyFoodsContainer.innerHTML = `

<div class="empty-state">

<h3>Aún no has añadido alimentos</h3>

<p>
Busca un alimento para comenzar.
</p>

</div>

`;

return;
}


dailyFoods.forEach(item => {

const food =
foods.find(
f => String(f.id) === String(item.foodId)
);


if (!food) return;


const result =
calculateFood(food, item.grams);


const element =
document.createElement("div");

element.className = "daily-food";


element.innerHTML = `

<div class="daily-food-info">

<strong>
${escapeHTML(food.name)}
</strong>

<span>
${number(item.grams)} g
</span>

<small>
${number(result.calories)} kcal ·
${number(result.protein)} P ·
${number(result.carbs)} C ·
${number(result.fat)} G
</small>

</div>

<button
class="remove-food"
data-id="${item.id}"
>
Eliminar
</button>

`;


element
.querySelector(".remove-food")
.addEventListener("click", () => {

dailyFoods =
dailyFoods.filter(
x => x.id !== item.id
);

saveDailyFoods();

renderDailyFoods();

updateDailyTotals();

});


dailyFoodsContainer.appendChild(element);

});

}


function updateDailyTotals() {

let calories = 0;
let protein = 0;
let carbs = 0;
let fat = 0;


dailyFoods.forEach(item => {

const food =
foods.find(
f => String(f.id) === String(item.foodId)
);


if (!food) return;


const result =
calculateFood(food, item.grams);


calories += result.calories;
protein += result.protein;
carbs += result.carbs;
fat += result.fat;

});


document.getElementById("totalCalories")
.textContent =
`${number(calories)} kcal`;

document.getElementById("totalProtein")
.textContent =
`${number(protein)} g`;

document.getElementById("totalCarbs")
.textContent =
`${number(carbs)} g`;

document.getElementById("totalFat")
.textContent =
`${number(fat)} g`;


updateProgress(
"calorieProgress",
calories,
goals.calories
);

updateProgress(
"proteinProgress",
protein,
goals.protein
);

updateProgress(
"carbsProgress",
carbs,
goals.carbs
);

updateProgress(
"fatProgress",
fat,
goals.fat
);


document.getElementById("calorieGoalText")
.textContent =
`${number(calories)} / ${goals.calories} kcal`;

document.getElementById("proteinGoalText")
.textContent =
`${number(protein)} / ${goals.protein} g`;

document.getElementById("carbsGoalText")
.textContent =
`${number(carbs)} / ${goals.carbs} g`;

document.getElementById("fatGoalText")
.textContent =
`${number(fat)} / ${goals.fat} g`;

}


function updateProgress(id, value, goal) {

const element =
document.getElementById(id);


if (!goal || goal <= 0) {

element.style.width = "0%";

return;
}


const percentage =
Math.min(
(value / goal) * 100,
100
);


element.style.width =
`${percentage}%`;

}


document
.getElementById("saveGoals")
.addEventListener("click", () => {

goals = {

calories:
Number(goalCalories.value) || 0,

protein:
Number(goalProtein.value) || 0,

carbs:
Number(goalCarbs.value) || 0,

fat:
Number(goalFat.value) || 0

};


localStorage.setItem(
"nutriGoals",
JSON.stringify(goals)
);


updateDailyTotals();

alert("Objetivos guardados.");

});


document
.getElementById("clearDay")
.addEventListener("click", () => {

if (!dailyFoods.length) return;


if (
confirm(
"¿Quieres borrar todos los alimentos de hoy?"
)
) {

dailyFoods = [];

saveDailyFoods();

renderDailyFoods();

updateDailyTotals();

}

});


function saveDailyFoods() {

localStorage.setItem(
"nutriDailyFoods",
JSON.stringify(dailyFoods)
);

}


/* =====================================================
BASE DE DATOS
===================================================== */

const foodCount =
document.getElementById("foodCount");

const databaseSearch =
document.getElementById("databaseSearch");

const foodDatabaseList =
document.getElementById("foodDatabaseList");


foodCount.textContent = foods.length;


function renderDatabase(query = "") {

const normalizedQuery =
normalize(query);


const results =
foods
.filter(food => {

return (

!normalizedQuery

||

normalize(food.name)
.includes(normalizedQuery)

||

normalize(food.brand || "")
.includes(normalizedQuery)

||

normalize(food.category || "")
.includes(normalizedQuery)

);

})
.slice(0, 100);


foodDatabaseList.innerHTML = "";


results.forEach(food => {

const element =
document.createElement("div");

element.className =
"database-food";


element.innerHTML = `

<strong>
${escapeHTML(food.name)}
</strong>

<span>
${escapeHTML(food.category || "")}
</span>

<small>
${number(food.calories)} kcal ·
${number(food.protein)} g P ·
${number(food.carbs)} g C ·
${number(food.fat)} g G
por 100 g
</small>

`;


foodDatabaseList.appendChild(element);

});

}


databaseSearch.addEventListener(
"input",
() => {

renderDatabase(
databaseSearch.value
);

}
);


/* =====================================================
ENTRENAMIENTO
===================================================== */

const exercises = [

{
id: 1,
name: "Press de pecho en máquina",
muscle: "Pecho",
type: "Bilateral",
description: "Press guiado para trabajar principalmente el pectoral."
},

{
id: 2,
name: "Press inclinado con mancuernas",
muscle: "Pecho",
type: "Bilateral",
description: "Press inclinado con mancuernas para enfatizar la zona superior del pecho."
},

{
id: 3,
name: "Apertura unilateral en polea",
muscle: "Pecho",
type: "Unilateral",
description: "Apertura en polea realizada con un brazo cada vez."
},

{
id: 4,
name: "Jalón al pecho",
muscle: "Espalda",
type: "Bilateral",
description: "Jalón vertical para dorsales."
},

{
id: 5,
name: "Remo T-bar",
muscle: "Espalda",
type: "Bilateral",
description: "Remo pesado para espalda media, romboides y dorsales."
},

{
id: 6,
name: "Remo unilateral en polea",
muscle: "Espalda",
type: "Unilateral",
description: "Remo con un brazo para trabajar cada lado independientemente."
},

{
id: 7,
name: "Jalón unilateral en polea alta",
muscle: "Espalda",
type: "Unilateral",
description: "Jalón con un brazo, permitiendo controlar individualmente cada dorsal."
},

{
id: 8,
name: "Elevación lateral",
muscle: "Hombros",
type: "Bilateral",
description: "Movimiento para el deltoides lateral."
},

{
id: 9,
name: "Elevación lateral unilateral en polea",
muscle: "Hombros",
type: "Unilateral",
description: "Elevación lateral con un brazo y tensión constante de la polea."
},

{
id: 10,
name: "Press de hombros",
muscle: "Hombros",
type: "Bilateral",
description: "Press vertical para deltoides."
},

{
id: 11,
name: "Curl de bíceps en polea",
muscle: "Bíceps",
type: "Bilateral",
description: "Curl controlado con tensión constante."
},

{
id: 12,
name: "Curl unilateral detrás del torso",
muscle: "Bíceps",
type: "Unilateral",
description: "Curl unilateral con el brazo situado detrás del torso."
},

{
id: 13,
name: "Curl Scott en polea",
muscle: "Bíceps",
type: "Bilateral",
description: "Curl con apoyo tipo predicador."
},

{
id: 14,
name: "Curl martillo unilateral",
muscle: "Bíceps",
type: "Unilateral",
description: "Curl martillo realizado brazo por brazo."
},

{
id: 15,
name: "Extensión de tríceps en polea",
muscle: "Tríceps",
type: "Bilateral",
description: "Extensión de codo con polea."
},

{
id: 16,
name: "Extensión unilateral de tríceps",
muscle: "Tríceps",
type: "Unilateral",
description: "Extensión de tríceps trabajando un brazo cada vez."
},

{
id: 17,
name: "Extensión de tríceps por encima de la cabeza",
muscle: "Tríceps",
type: "Bilateral",
description: "Movimiento con el brazo por encima de la cabeza."
},

{
id: 18,
name: "Extensión de cuádriceps",
muscle: "Cuádriceps",
type: "Bilateral",
description: "Extensión de rodilla en máquina."
},

{
id: 19,
name: "Extensión unilateral de cuádriceps",
muscle: "Cuádriceps",
type: "Unilateral",
description: "Extensión de rodilla trabajando una pierna cada vez."
},

{
id: 20,
name: "Curl femoral",
muscle: "Femoral",
type: "Bilateral",
description: "Flexión de rodilla para isquiosurales."
},

{
id: 21,
name: "Curl femoral unilateral",
muscle: "Femoral",
type: "Unilateral",
description: "Curl femoral realizado con una pierna cada vez."
},

{
id: 22,
name: "Elevación de gemelos de pie",
muscle: "Gemelos",
type: "Bilateral",
description: "Trabajo de gemelos con rodilla extendida."
},

{
id: 23,
name: "Elevación unilateral de gemelos",
muscle: "Gemelos",
type: "Unilateral",
description: "Elevación de gemelo con una sola pierna."
},

{
id: 24,
name: "Crunch en polea",
muscle: "Abdomen",
type: "Bilateral",
description: "Flexión de tronco con resistencia."
},

{
id: 25,
name: "Crunch unilateral en polea",
muscle: "Abdomen",
type: "Unilateral",
description: "Variación realizada hacia un lado para trabajar de forma individual."
}

];


let currentSets = [];

let currentWorkout = [];

let trainingHistory =
JSON.parse(
localStorage.getItem(
"nutriTrainingHistory"
)
) || [];


const muscleFilter =
document.getElementById("muscleFilter");

const exerciseSelect =
document.getElementById("exerciseSelect");

const exerciseInfo =
document.getElementById("exerciseInfo");


function renderExerciseSelect() {

const muscle =
muscleFilter.value;


const filtered =
muscle === "Todos"
? exercises
: exercises.filter(
exercise =>
exercise.muscle === muscle
);


exerciseSelect.innerHTML = "";


filtered.forEach(exercise => {

const option =
document.createElement("option");

option.value = exercise.id;

option.textContent =
`${exercise.name} · ${exercise.type}`;

exerciseSelect.appendChild(option);

});


updateExerciseInfo();

}


function getSelectedExercise() {

return exercises.find(
exercise =>
String(exercise.id) ===
String(exerciseSelect.value)
);

}


function updateExerciseInfo() {

const exercise =
getSelectedExercise();


if (!exercise) {

exerciseInfo.innerHTML = "";

return;
}


exerciseInfo.innerHTML = `

<strong>
${escapeHTML(exercise.name)}
</strong>

<div>
${escapeHTML(exercise.description)}
</div>

<span class="unilateral-badge">
${exercise.type}
</span>

`;

}


muscleFilter.addEventListener(
"change",
renderExerciseSelect
);


exerciseSelect.addEventListener(
"change",
updateExerciseInfo
);


document
.getElementById("addSet")
.addEventListener("click", () => {

const exercise =
getSelectedExercise();


const weight =
Number(
document.getElementById("setWeight").value
);


const reps =
Number(
document.getElementById("setReps").value
);


const rir =
Number(
document.getElementById("setRir").value
);


if (!exercise) {

alert("Selecciona un ejercicio.");

return;
}


if (reps <= 0) {

alert("Introduce las repeticiones.");

return;
}


currentSets.push({

id: generateId(),

weight: weight || 0,

reps: reps,

rir: Math.max(
0,
Math.min(5, rir)
)

});


renderCurrentSets();

});


function renderCurrentSets() {

const container =
document.getElementById("currentSets");


container.innerHTML = "";


if (!currentSets.length) {

container.innerHTML =
`<div class="empty-state">
Todavía no hay series.
</div>`;

return;
}


currentSets.forEach((set, index) => {

const row =
document.createElement("div");

row.className = "set-row";


row.innerHTML = `

<strong>
Serie ${index + 1}
</strong>

<span>
${number(set.weight)} kg
</span>

<span>
${set.reps} reps · RIR ${set.rir}
</span>

<button
class="danger-button"
>
Eliminar
</button>

`;


row
.querySelector("button")
.addEventListener("click", () => {

currentSets =
currentSets.filter(
x => x.id !== set.id
);

renderCurrentSets();

});


container.appendChild(row);

});

}


document
.getElementById("finishExercise")
.addEventListener("click", () => {

const exercise =
getSelectedExercise();


if (!exercise) {

alert("Selecciona un ejercicio.");

return;
}


if (!currentSets.length) {

alert("Añade al menos una serie.");

return;
}


currentWorkout.push({

id: generateId(),

exerciseId: exercise.id,

name: exercise.name,

muscle: exercise.muscle,

type: exercise.type,

sets: [...currentSets]

});


currentSets = [];

renderCurrentSets();

renderCurrentWorkout();

});


function renderCurrentWorkout() {

const container =
document.getElementById("currentWorkout");


container.innerHTML = "";


if (!currentWorkout.length) {

container.innerHTML =
`<div class="empty-state">
Todavía no has añadido ejercicios a esta sesión.
</div>`;

return;
}


currentWorkout.forEach(exercise => {

const element =
document.createElement("div");

element.className =
"workout-exercise";


const totalVolume =
exercise.sets.reduce(
(total, set) =>
total +
(set.weight * set.reps),
0
);


element.innerHTML = `

<div class="workout-exercise-header">

<strong>
${escapeHTML(exercise.name)}
</strong>

<small>
${escapeHTML(exercise.type)}
</small>

</div>

<div>
${exercise.sets.length}
series ·
${number(totalVolume)} kg de volumen
</div>

`;


container.appendChild(element);

});

}


document
.getElementById("finishWorkout")
.addEventListener("click", () => {

if (!currentWorkout.length) {

alert(
"Añade al menos un ejercicio al entrenamiento."
);

return;
}


const workout = {

id: generateId(),

date:
new Date().toISOString(),

exercises:
[...currentWorkout]

};


trainingHistory.unshift(workout);


localStorage.setItem(
"nutriTrainingHistory",
JSON.stringify(trainingHistory)
);


currentWorkout = [];

renderCurrentWorkout();

renderTrainingHistory();

updateTrainingStats();

alert("Entrenamiento guardado.");

});


function renderTrainingHistory() {

const container =
document.getElementById("trainingHistory");


container.innerHTML = "";


if (!trainingHistory.length) {

container.innerHTML =
`<div class="empty-state">
Todavía no tienes entrenamientos guardados.
</div>`;

return;
}


trainingHistory.forEach(workout => {

const element =
document.createElement("div");

element.className =
"history-workout";


const date =
new Date(workout.date);


const totalSets =
workout.exercises.reduce(
(total, exercise) =>
total +
exercise.sets.length,
0
);


const volume =
workout.exercises.reduce(
(total, exercise) =>
total +
exercise.sets.reduce(
(sum, set) =>
sum +
(set.weight * set.reps),
0
),
0
);


element.innerHTML = `

<h4>
${date.toLocaleDateString("es-ES")}
</h4>

<p>
${workout.exercises.length}
ejercicios ·
${totalSets}
series ·
${number(volume)} kg
de volumen
</p>

<p>
${workout.exercises
.map(
exercise =>
escapeHTML(exercise.name)
)
.join(" · ")
}
</p>

`;


container.appendChild(element);

});

}


function updateTrainingStats() {

let totalSets = 0;

let totalVolume = 0;


trainingHistory.forEach(workout => {

workout.exercises.forEach(exercise => {

totalSets +=
exercise.sets.length;


exercise.sets.forEach(set => {

totalVolume +=
set.weight * set.reps;

});

});

});


document.getElementById("trainingSessions")
.textContent =
trainingHistory.length;


document.getElementById("trainingSets")
.textContent =
totalSets;


document.getElementById("trainingVolume")
.textContent =
`${number(totalVolume)} kg`;

}


document
.getElementById("clearTrainingHistory")
.addEventListener("click", () => {

if (!trainingHistory.length) return;


if (
confirm(
"¿Quieres borrar todo el historial?"
)
) {

trainingHistory = [];

localStorage.removeItem(
"nutriTrainingHistory"
);

renderTrainingHistory();

updateTrainingStats();

}

});


/* =====================================================
ASISTENTE LOCAL
===================================================== */

const assistantInput =
document.getElementById("assistantInput");

const assistantSend =
document.getElementById("assistantSend");

const assistantMessages =
document.getElementById("assistantMessages");


function addAssistantMessage(
message,
type
) {

const element =
document.createElement("div");

element.className =
`assistant-message ${type}`;


element.innerHTML =
`<p>${escapeHTML(message)}</p>`;


assistantMessages.appendChild(element);

assistantMessages.scrollTop =
assistantMessages.scrollHeight;

}


function assistantAnswer(question) {

const q =
normalize(question);


if (
q.includes("proteina") ||
q.includes("proteína")
) {

const total =
calculateDailyTotals();


return `
Hoy llevas ${number(total.protein)} g
de proteína, frente a tu objetivo de
${goals.protein} g.
`;

}


if (
q.includes("caloria") ||
q.includes("calorias") ||
q.includes("caloría")
) {

const total =
calculateDailyTotals();


return `
Hoy llevas ${number(total.calories)} kcal
de un objetivo de ${goals.calories} kcal.
`;

}


if (
q.includes("carbo") ||
q.includes("hidrato")
) {

const total =
calculateDailyTotals();


return `
Hoy llevas ${number(total.carbs)} g
de carbohidratos, frente a un objetivo de
${goals.carbs} g.
`;

}


if (
q.includes("grasa") ||
q.includes("grasas")
) {

const total =
calculateDailyTotals();


return `
Hoy llevas ${number(total.fat)} g
de grasa, frente a un objetivo de
${goals.fat} g.
`;

}


if (
q.includes("entrenamiento") ||
q.includes("entreno")
) {

return `
Tienes ${trainingHistory.length}
entrenamientos guardados en tu historial.
`;

}


if (
q.includes("unilateral")
) {

const unilateral =
exercises.filter(
exercise =>
exercise.type === "Unilateral"
);


return `
Nutri tiene ${unilateral.length}
ejercicios unilaterales registrados,
incluyendo espalda, hombros, bíceps,
tríceps, piernas, gemelos y abdomen.
`;

}


return `
Puedo consultar tus calorías, proteína,
carbohidratos, grasas y datos básicos
de entrenamiento.
`;

}


function calculateDailyTotals() {

let calories = 0;
let protein = 0;
let carbs = 0;
let fat = 0;


dailyFoods.forEach(item => {

const food =
foods.find(
f =>
String(f.id) ===
String(item.foodId)
);


if (!food) return;


const result =
calculateFood(
food,
item.grams
);


calories += result.calories;
protein += result.protein;
carbs += result.carbs;
fat += result.fat;

});


return {
calories,
protein,
carbs,
fat
};

}


function sendAssistant() {

const question =
assistantInput.value.trim();


if (!question) return;


addAssistantMessage(
question,
"user"
);


assistantInput.value = "";


setTimeout(() => {

addAssistantMessage(
assistantAnswer(question),
"bot"
);

}, 150);

}


assistantSend.addEventListener(
"click",
sendAssistant
);


assistantInput.addEventListener(
"keydown",
event => {

if (event.key === "Enter") {

sendAssistant();

}

}
);


/* =====================================================
UTILIDADES
===================================================== */

function generateId() {

return (
Date.now().toString(36) +
Math.random()
.toString(36)
.substring(2)
);

}


function escapeHTML(text) {

return String(text)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#039;");

}


/* =====================================================
INICIALIZAR TODO
===================================================== */

renderDailyFoods();

updateDailyTotals();

renderDatabase();

renderExerciseSelect();

renderCurrentSets();

renderCurrentWorkout();

renderTrainingHistory();

updateTrainingStats();

});
