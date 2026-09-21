* Nutri — aplicación local.
foods.js se mantiene separado e intacto.
*/

const FOOD_DATABASE =
typeof foods !== 'undefined'
? foods
: (window.foods || []);

const STORAGE_KEY = 'nutri_app_v4';


/* =========================================================
EJERCICIOS PREDETERMINADOS
========================================================= */

const defaultExercises = [
['Press banca máquina', 'Pecho', 'Máquina', 'bilateral', 'same'],
['Press inclinado con mancuernas', 'Pecho', 'Mancuernas', 'bilateral', 'same'],
['Aperturas en polea', 'Pecho', 'Polea', 'bilateral', 'same'],
['Pec deck', 'Pecho', 'Máquina', 'bilateral', 'same'],

['Jalón al pecho agarre ancho', 'Espalda', 'Polea', 'bilateral', 'same'],
['Remo T-bar', 'Espalda', 'Máquina', 'bilateral', 'same'],
['Remo unilateral en polea', 'Espalda', 'Polea', 'unilateral', 'same'],
['Pullover en polea', 'Espalda', 'Polea', 'bilateral', 'same'],

['Press hombros máquina', 'Hombros', 'Máquina', 'bilateral', 'same'],
['Elevación lateral', 'Hombros', 'Mancuernas', 'bilateral', 'same'],
['Elevación lateral unilateral en polea', 'Hombros', 'Polea', 'unilateral', 'same'],
['Pájaros en máquina', 'Hombros', 'Máquina', 'bilateral', 'same'],

['Curl bíceps detrás del torso', 'Bíceps', 'Polea', 'unilateral', 'same'],
['Curl predicador', 'Bíceps', 'Máquina', 'bilateral', 'same'],
['Curl martillo', 'Bíceps', 'Mancuernas', 'unilateral', 'same'],

['Extensión de tríceps en polea', 'Tríceps', 'Polea', 'bilateral', 'same'],
['Extensión de tríceps unilateral', 'Tríceps', 'Polea', 'unilateral', 'same'],
['Press cerrado', 'Tríceps', 'Máquina', 'bilateral', 'same'],

['Extensión de cuádriceps', 'Pierna', 'Máquina', 'bilateral', 'same'],
['Curl femoral', 'Pierna', 'Máquina', 'bilateral', 'same'],
['Prensa', 'Pierna', 'Máquina', 'bilateral', 'same'],
['Elevación de gemelo de pie', 'Pierna', 'Máquina', 'bilateral', 'same'],

['Hip thrust', 'Glúteos', 'Máquina', 'bilateral', 'same'],
['Abducción de cadera', 'Glúteos', 'Máquina', 'bilateral', 'same'],

['Crunch en polea', 'Abdomen', 'Polea', 'bilateral', 'same'],
['Elevación de piernas', 'Abdomen', 'Peso corporal', 'bilateral', 'same'],

['Curl de muñeca', 'Antebrazo', 'Mancuernas', 'bilateral', 'same']
].map((x, i) => ({
id: 'def-' + (i + 1),
name: x[0],
muscle: x[1],
equipment: x[2],
type: x[3],
unilateralMode: x[4],
custom: false
}));


/* =========================================================
ESTADO INICIAL
========================================================= */

const initialState = {

goals: {
calories: 2300,
protein: 130,
carbs: 260,
fat: 70
},

maintenance: {
sex: 'male',
age: 18,
weight: 71,
height: 176,
activity: 1.55,
goal: 'cut',
adjustment: -400
},

nutrition: {},

/* NUEVO:
aquí se guardan los alimentos creados por ti */
customFoods: [],

progress: [],

targetWeight: null,

customExercises: [],

routines: [],

workouts: [],

activeWorkout: null,

settings: {}
};


let state = loadState();

let selectedFood = null;
let selectedRoutineId = null;
let editingRoutineId = null;

let currentNutritionDate =
dateKey(new Date());

let workoutTimer = null;


/* =========================================================
UTILIDADES
========================================================= */

function clone(value) {

return JSON.parse(
JSON.stringify(value)
);

}


function loadState() {

try {

const raw =
localStorage.getItem(
STORAGE_KEY
);

if (!raw) {

return clone(
initialState
);

}

return merge(
initialState,
JSON.parse(raw)
);

} catch (error) {

console.error(
'Error cargando datos:',
error
);

return clone(
initialState
);

}

}


function merge(a, b) {

const out =
clone(a);

for (const key in b) {

if (
b[key] &&
typeof b[key] === 'object' &&
!Array.isArray(b[key]) &&
typeof out[key] === 'object'
) {

out[key] =
merge(
out[key],
b[key]
);

} else {

out[key] =
b[key];

}

}

return out;

}


function save() {

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(state)
);

renderAll();

}


function uid(prefix = 'id') {

return (
prefix +
'_' +
Math.random()
.toString(36)
.slice(2, 9) +
'_' +
Date.now()
.toString(36)
);

}


function dateKey(date) {

return new Date(
date.getTime() -
date.getTimezoneOffset() *
60000
)
.toISOString()
.slice(0, 10);

}


function fmtDate(
key,
opts = {
day: 'numeric',
month: 'short',
year: 'numeric'
}
) {

return new Date(
key + 'T12:00:00'
).toLocaleDateString(
'es-ES',
opts
);

}


function esc(value) {

return String(
value ?? ''
).replace(
/[&<>'"]/g,
char => ({
'&': '&amp;',
'<': '&lt;',
'>': '&gt;',
"'": '&#39;',
'"': '&quot;'
}[char])
);

}


function fmt(
number,
decimals = 0
) {

return Number(
number || 0
).toLocaleString(
'es-ES',
{
maximumFractionDigits:
decimals
}
);

}


function setText(
id,
value
) {

const element =
document.getElementById(id);

if (element) {

element.textContent =
value;

}

}


function setBar(
id,
value,
goal
) {

const element =
document.getElementById(id);

if (element) {

element.style.width =
pct(
value,
goal
) + '%';

}

}


function pct(
value,
goal
) {

return goal
? Math.min(
100,
Math.max(
0,
value / goal * 100
)
)
: 0;

}


function withinDays(
date,
days
) {

return (
Date.now() -
new Date(
date + 'T23:59:59'
).getTime()
) <=
days * 86400000;

}


function emptyList(text) {

return `
<div class="list-row">
<span>${esc(text)}</span>
</div>
`;

}


/* =========================================================
EJERCICIOS
========================================================= */

function allExercises() {

return [
...defaultExercises,
...state.customExercises
];

}


function getExercise(id) {

return allExercises().find(
exercise =>
exercise.id === id
);

}


/* =========================================================
ALIMENTOS
========================================================= */

/*
NUEVO:

Junta los 358 alimentos de foods.js
con los alimentos que tú hayas creado.
*/

function allFoods() {

return [
...FOOD_DATABASE,
...(state.customFoods || [])
];

}


function getFood(id) {

return allFoods().find(
food =>
String(food.id) ===
String(id)
);

}


function todayLog() {

return (
state.nutrition[
currentNutritionDate
] || []
);

}


function totalsForDate(key) {

return (
state.nutrition[key] || []
).reduce(
(total, food) => {

total.calories +=
Number(food.calories) || 0;

total.protein +=
Number(food.protein) || 0;

total.carbs +=
Number(food.carbs) || 0;

total.fat +=
Number(food.fat) || 0;

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


/* =========================================================
NAVEGACIÓN
========================================================= */

function navigate(view) {

document
.querySelectorAll('.view')
.forEach(section => {

section.classList.toggle(
'active',
section.id ===
'view-' + view
);

});


document
.querySelectorAll('.nav-link')
.forEach(button => {

button.classList.toggle(
'active',
button.dataset.view ===
view
);

});


window.scrollTo({
top: 0,
behavior: 'smooth'
});


if (view === 'nutrition') {

renderNutrition();

}

if (view === 'training') {

renderTraining();

}

if (view === 'progress') {

renderProgress();

}

if (view === 'maintenance') {

renderMaintenance();

}

}


document.addEventListener(
'click',
event => {

const navigation =
event.target.closest(
'[data-view]'
);

if (navigation) {

navigate(
navigation.dataset.view
);

return;

}


if (
event.target.id ===
'settingsBtn'
) {

navigate('settings');

}

}
);


/* =========================================================
DASHBOARD
========================================================= */

function renderDashboard() {

const today =
dateKey(new Date());

const totals =
totalsForDate(today);

const goals =
state.goals;


setText(
'todayLabel',
fmtDate(
today,
{
weekday: 'long',
day: 'numeric',
month: 'long'
}
)
);


setText(
'dashCalories',
fmt(totals.calories)
);

setText(
'dashCalGoal',
fmt(goals.calories)
);

setText(
'dashProtein',
fmt(totals.protein)
);

setText(
'dashCarbs',
fmt(totals.carbs)
);

setText(
'dashFat',
fmt(totals.fat)
);


setBar(
'dashProteinBar',
totals.protein,
goals.protein
);

setBar(
'dashCarbsBar',
totals.carbs,
goals.carbs
);

setBar(
'dashFatBar',
totals.fat,
goals.fat
);


const donut =
document.getElementById(
'calorieDonut'
);

if (donut) {

const degrees =
Math.min(
360,
totals.calories /
Math.max(
1,
goals.calories
) *
360
);

donut.style.background =
`conic-gradient(
var(--accent)
${degrees}deg,
#2b323d 0deg
)`;

}


const sessions =
state.workouts.filter(
workout =>
withinDays(
workout.date,
7
)
);


const sets =
sessions.reduce(
(total, workout) =>
total +
workout.exercises.reduce(
(subTotal, exercise) =>
subTotal +
exercise.sets.filter(
set => set.done
).length,
0
),
0
);


const volume =
sessions.reduce(
(total, workout) =>
total +
workoutVolume(workout),
0
);


setText(
'dashSessions',
sessions.length
);

setText(
'dashSets',
sets
);

setText(
'dashVolume',
fmt(volume)
);


const last =
state.workouts[0];


setText(
'dashWorkoutTitle',
last
? last.name
: 'Ningún entrenamiento hoy'
);


setText(
'dashWorkoutText',
last
? `${fmtDate(last.date)} · ${last.exercises.length} ejercicios`
: 'Crea una rutina o empieza un entrenamiento libre.'
);


const recentWorkouts =
document.getElementById(
'dashRecentWorkouts'
);


if (recentWorkouts) {

recentWorkouts.innerHTML =
sessions
.slice(0, 4)
.map(workout => `
<div class="list-row">

<div>

<b>
${esc(workout.name)}
</b>

<small>
${fmtDate(workout.date)}
·
${workout.exercises.length}
ejercicios
</small>

</div>

<b>
${fmt(workoutVolume(workout))} kg
</b>

</div>
`)
.join('')
||
emptyList(
'Todavía no hay sesiones.'
);

}


const meals =
document.getElementById(
'dashMeals'
);


if (meals) {

meals.innerHTML =
todayLog()
.slice(-4)
.reverse()
.map(food => `
<div class="list-row">

<div>

<b>
${esc(food.name)}
</b>

<small>
${fmt(food.grams, 1)} g
</small>

</div>

<b>
${fmt(food.calories)} kcal
</b>

</div>
`)
.join('')
||
emptyList(
'No hay alimentos registrados hoy.'
);

}

}


/* =========================================================
NUTRICIÓN
========================================================= */

function renderNutrition() {

const totals =
totalsForDate(
currentNutritionDate
);

const goals =
state.goals;


setText(
'nutritionDate',
fmtDate(
currentNutritionDate,
{
weekday: 'long',
day: 'numeric',
month: 'long',
year: 'numeric'
}
)
);


setText(
'nutCalories',
fmt(totals.calories)
);

setText(
'nutCalGoal',
fmt(goals.calories) +
' kcal'
);

setText(
'nutCalRemaining',
`${fmt(
Math.max(
0,
goals.calories -
totals.calories
)
)} kcal restantes`
);


setBar(
'nutCalBar',
totals.calories,
goals.calories
);


setText(
'nutProtein',
fmt(totals.protein) +
' g'
);

setText(
'nutCarbs',
fmt(totals.carbs) +
' g'
);

setText(
'nutFat',
fmt(totals.fat) +
' g'
);


setText(
'foodCount',
todayLog().length
);


setText(
'sideProtein',
`${fmt(totals.protein)} / ${fmt(goals.protein)} g`
);

setText(
'sideCarbs',
`${fmt(totals.carbs)} / ${fmt(goals.carbs)} g`
);

setText(
'sideFat',
`${fmt(totals.fat)} / ${fmt(goals.fat)} g`
);


setBar(
'sideProteinBar',
totals.protein,
goals.protein
);

setBar(
'sideCarbsBar',
totals.carbs,
goals.carbs
);

setBar(
'sideFatBar',
totals.fat,
goals.fat
);


renderCustomFoods();


const foodLog =
document.getElementById(
'foodLog'
);


if (!foodLog) {
return;
}


foodLog.innerHTML =
todayLog()
.map(
(food, index) => `
<div class="food-row">

<div>

<strong>
${esc(food.name)}
</strong>

<small>
${
food.brand
? esc(food.brand) + ' · '
: ''
}

${fmt(food.grams, 1)} g
</small>

</div>


<div class="food-kcal">

<b>
${fmt(food.calories)}
</b>

<small>
kcal
</small>

</div>


<div class="food-macros">

<small>
${fmt(food.protein, 1)}P
·
${fmt(food.carbs, 1)}C
·
${fmt(food.fat, 1)}G
</small>

</div>


<button
class="remove-btn"
data-remove-food="${index}"
>
×
</button>

</div>
`
)
.join('')
||
`
<div class="empty-state">

<span>⌁</span>

<h3>
Diario vacío
</h3>

<p>
Añade un alimento para empezar.
</p>

</div>
`;

}


document.addEventListener(
'click',
event => {

const button =
event.target.closest(
'[data-remove-food]'
);

if (!button) {
return;
}


if (
!state.nutrition[
currentNutritionDate
]
) {
return;
}


state.nutrition[
currentNutritionDate
].splice(
Number(
button.dataset.removeFood
),
1
);


save();

renderNutrition();

}
);


/* =========================================================
MIS ALIMENTOS
========================================================= */

function renderCustomFoods() {

const container =
document.getElementById(
'customFoodList'
);


if (!container) {
return;
}


const customFoods =
state.customFoods || [];


if (!customFoods.length) {

container.innerHTML = `
<div class="empty-state">

<h3>
Aún no tienes alimentos propios
</h3>

<p>
Guarda un alimento de tu casa
y aparecerá siempre en el buscador.
</p>

</div>
`;

return;
}


container.innerHTML =
customFoods
.map(
food => `
<div class="food-row">

<div>

<strong>
${esc(food.name)}
</strong>

<small>

${
food.brand
? esc(food.brand) +
' · '
: ''
}

${fmt(food.calories)}
kcal ·

${fmt(food.protein, 1)}P ·

${fmt(food.carbs, 1)}C ·

${fmt(food.fat, 1)}G

/ 100 g

</small>

</div>


<div class="food-actions">

<button
type="button"
class="secondary-btn"
data-edit-custom-food="${esc(food.id)}"
>
Editar
</button>


<button
type="button"
class="remove-btn"
data-delete-custom-food="${esc(food.id)}"
>
×
</button>

</div>

</div>
`
)
.join('');

}


function openCustomFoodModal(
id = null
) {

const modal =
document.getElementById(
'customFoodModal'
);


if (!modal) {
return;
}


const food =
id
? state.customFoods.find(
item =>
String(item.id) ===
String(id)
)
: null;


document.getElementById(
'customFoodModalTitle'
).textContent =
food
? 'Editar alimento'
: 'Añadir alimento propio';


document.getElementById(
'customFoodId'
).value =
food?.id || '';


document.getElementById(
'customFoodName'
).value =
food?.name || '';


document.getElementById(
'customFoodBrand'
).value =
food?.brand || '';


document.getElementById(
'customFoodCalories'
).value =
food?.calories ?? '';


document.getElementById(
'customFoodProtein'
).value =
food?.protein ?? '';


document.getElementById(
'customFoodCarbs'
).value =
food?.carbs ?? '';


document.getElementById(
'customFoodFat'
).value =
food?.fat ?? '';


modal.showModal();

}


document
.getElementById(
'openCustomFoodModal'
)
?.addEventListener(
'click',
() =>
openCustomFoodModal()
);


document
.getElementById(
'closeCustomFoodModal'
)
?.addEventListener(
'click',
() =>
document
.getElementById(
'customFoodModal'
)
?.close()
);


document
.getElementById(
'customFoodForm'
)
?.addEventListener(
'submit',
event => {

event.preventDefault();


const name =
document
.getElementById(
'customFoodName'
)
.value
.trim();


const brand =
document
.getElementById(
'customFoodBrand'
)
.value
.trim();


const calories =
Number(
document
.getElementById(
'customFoodCalories'
)
.value
);


const protein =
Number(
document
.getElementById(
'customFoodProtein'
)
.value
);


const carbs =
Number(
document
.getElementById(
'customFoodCarbs'
)
.value
);


const fat =
Number(
document
.getElementById(
'customFoodFat'
)
.value
);


if (
!name ||
!Number.isFinite(calories) ||
!Number.isFinite(protein) ||
!Number.isFinite(carbs) ||
!Number.isFinite(fat) ||
calories < 0 ||
protein < 0 ||
carbs < 0 ||
fat < 0
) {

alert(
'Completa todos los datos correctamente.'
);

return;

}


const id =
document.getElementById(
'customFoodId'
).value;


const existing =
id
? state.customFoods.find(
item =>
String(item.id) ===
String(id)
)
: null;


const food = {

id:
id ||
uid('custom-food'),

name,

brand,

category:
'Mis alimentos',

calories,

protein,

carbs,

fat,

custom:
true,

createdAt:
existing?.createdAt ||
new Date().toISOString()

};


if (id) {

const index =
state.customFoods.findIndex(
item =>
String(item.id) ===
String(id)
);


if (index !== -1) {

state.customFoods[index] =
food;

}

} else {

state.customFoods.push(
food
);

}


save();


document
.getElementById(
'customFoodModal'
)
?.close();


renderCustomFoods();

}
);


document.addEventListener(
'click',
event => {

const edit =
event.target.closest(
'[data-edit-custom-food]'
);


if (edit) {

openCustomFoodModal(
edit.dataset
.editCustomFood
);

return;

}


const remove =
event.target.closest(
'[data-delete-custom-food]'
);


if (!remove) {
return;
}


if (
!confirm(
'¿Eliminar este alimento personalizado?'
)
) {
return;
}


const id =
remove.dataset
.deleteCustomFood;


state.customFoods =
state.customFoods.filter(
food =>
String(food.id) !==
String(id)
);


save();

renderCustomFoods();

}
);


/* =========================================================
BUSCADOR DE ALIMENTOS
========================================================= */

function openFoodModal() {

const modal =
document.getElementById(
'foodModal'
);


selectedFood = null;


document
.getElementById(
'foodAmount'
)
.classList.add(
'hidden'
);


document
.getElementById(
'foodSearch'
)
.value = '';


renderFoodResults('');


modal.showModal();


setTimeout(
() =>
document
.getElementById(
'foodSearch'
)
.focus(),
50
);

}


document.getElementById(
'openFoodModal'
).onclick =
openFoodModal;


document.getElementById(
'foodSearch'
).addEventListener(
'input',
event =>
renderFoodResults(
event.target.value
)
);


function renderFoodResults(
query
) {

const term =
query
.trim()
.toLowerCase();


/*
IMPORTANTE:
usamos allFoods(), no FOOD_DATABASE,
para que también aparezcan tus alimentos.
*/

const results =
allFoods()
.filter(food => {

if (!term) {
return true;
}


return `${food.name} ${
food.brand || ''
} ${
food.category || ''
}`
.toLowerCase()
.includes(term);

})
.slice(0, 80);


document.getElementById(
'foodResults'
).innerHTML =

results
.map(
food => `
<button
type="button"
class="food-result"
data-food-id="${esc(food.id)}"
>

<span>

<b>
${esc(food.name)}
</b>

<small>

${esc(
food.category || ''
)}

${
food.brand
? ' · ' +
esc(food.brand)
: ''
}

</small>

</span>

<strong>

${fmt(food.calories)}
kcal

</strong>

</button>
`
)
.join('')

||

`
<div class="empty-state">

<p>
No se encontraron alimentos.
</p>

</div>
`;

}


document.addEventListener(
'click',
event => {

const button =
event.target.closest(
'[data-food-id]'
);


if (!button) {
return;
}


/*
También usamos allFoods() aquí.
Así funciona tanto para los 358 originales
como para los creados por ti.
*/

selectedFood =
allFoods().find(
food =>
String(food.id) ===
String(
button.dataset.foodId
)
);


if (!selectedFood) {
return;
}


document.getElementById(
'selectedFoodName'
).textContent =
selectedFood.name;


document.getElementById(
'selectedFoodMacros'
).textContent =
`${fmt(selectedFood.calories)} kcal · ` +
`${fmt(selectedFood.protein, 1)}P · ` +
`${fmt(selectedFood.carbs, 1)}C · ` +
`${fmt(selectedFood.fat, 1)}G / 100 g`;


document
.getElementById(
'foodAmount'
)
.classList.remove(
'hidden'
);


document
.getElementById(
'foodGrams'
)
.focus();

}
);


document.getElementById(
'confirmFood'
).onclick = () => {

if (!selectedFood) {
return;
}


const grams =
Number(
document.getElementById(
'foodGrams'
).value
) || 0;


if (grams <= 0) {
return;
}


const multiplier =
grams / 100;


const item = {

id:
uid('food'),

foodId:
selectedFood.id,

name:
selectedFood.name,

brand:
selectedFood.brand || '',

grams,

calories:
selectedFood.calories *
multiplier,

protein:
selectedFood.protein *
multiplier,

carbs:
selectedFood.carbs *
multiplier,

fat:
selectedFood.fat *
multiplier

};


state.nutrition[
currentNutritionDate
] ??= [];


state.nutrition[
currentNutritionDate
].push(item);


save();

renderNutrition();


document
.getElementById(
'foodModal'
)
.close();


selectedFood = null;

};


document.getElementById(
'prevDay'
).onclick = () => {

const date =
new Date(
currentNutritionDate +
'T12:00:00'
);


date.setDate(
date.getDate() - 1
);


currentNutritionDate =
dateKey(date);


renderNutrition();

};


document.getElementById(
'nextDay'
).onclick = () => {

const date =
new Date(
currentNutritionDate +
'T12:00:00'
);


date.setDate(
date.getDate() + 1
);


currentNutritionDate =
dateKey(date);


renderNutrition();

};


document.getElementById(
'todayDay'
).onclick = () => {

currentNutritionDate =
dateKey(new Date());

renderNutrition();

};


/* =========================================================
ENTRENAMIENTO
========================================================= */

function blankSet() {

return {

id:
uid('set'),

weight: '',
reps: '',
rir: '',

done: false,

leftWeight: '',
leftReps: '',

rightWeight: '',
rightReps: ''

};

}


function exerciseForSession(
exercise
) {

return {

exerciseId:
exercise.id,

name:
exercise.name,

muscle:
exercise.muscle,

type:
exercise.type,

unilateralMode:
exercise.unilateralMode ||
'same',

sets: [
blankSet()
]

};

}


function startWorkout(
name = 'Entrenamiento libre',
routine = null
) {

if (state.activeWorkout) {

if (
!confirm(
'Ya tienes una sesión en curso. ¿Reemplazarla?'
)
) {
return;
}

}


const exercises =
(routine?.exercises || [])
.map(id => {

const exercise =
getExercise(id);

return exercise
? exerciseForSession(
exercise
)
: null;

})
.filter(Boolean);


state.activeWorkout = {

id:
uid('session'),

name,

routineId:
routine?.id || null,

startedAt:
new Date().toISOString(),

notes: '',

exercises

};


save();

renderTraining();

}


function workoutVolume(
workout
) {

return (
workout.exercises || []
).reduce(
(total, exercise) => {

return (
total +
(
exercise.sets || []
).reduce(
(
subtotal,
set
) => {

if (!set.done) {
return subtotal;
}


if (
exercise.type ===
'unilateral' &&
exercise.unilateralMode ===
'separate'
) {

return (
subtotal +

(
(Number(
set.leftWeight
) || 0) *
(Number(
set.leftReps
) || 0)
) +

(
(Number(
set.rightWeight
) || 0) *
(Number(
set.rightReps
) || 0)
)
);

}


const multiplier =
exercise.type ===
'unilateral'
? 2
: 1;


return (
subtotal +
(
(Number(
set.weight
) || 0) *
(Number(
set.reps
) || 0) *
multiplier
)
);

},
0
)
);

},
0
);

}


function sessionVolume() {

return state.activeWorkout
? workoutVolume(
state.activeWorkout
)
: 0;

}


function formatDuration(
seconds
) {

return (

String(
Math.floor(
seconds / 3600
)
).padStart(2, '0')

+

':'

+

String(
Math.floor(
seconds % 3600 / 60
)
).padStart(2, '0')

+

':'

+

String(
seconds % 60
).padStart(2, '0')

);

}


function renderTraining() {

renderSession();

renderRoutines();

renderExercises();

renderHistory();

renderProgression();

}


function renderSession() {

const session =
state.activeWorkout;


const noSession =
document.getElementById(
'noSession'
);

const activeSession =
document.getElementById(
'activeSession'
);


if (
!noSession ||
!activeSession
) {
return;
}


noSession.classList.toggle(
'hidden',
Boolean(session)
);


activeSession.classList.toggle(
'hidden',
!session
);


if (!session) {
return;
}


setText(
'sessionName',
session.name
);


const completedSets =
session.exercises.reduce(
(total, exercise) =>
total +
exercise.sets.filter(
set => set.done
).length,
0
);


setText(
'sessionSets',
completedSets
);


setText(
'sessionVolume',
fmt(sessionVolume()) +
' kg'
);


setText(
'sessionExercises',
session.exercises.length
);


const rirs =
session.exercises
.flatMap(
exercise =>
exercise.sets
.map(set =>
Number(set.rir)
)
.filter(
value =>
Number.isFinite(
value
)
)
);


setText(
'sessionRir',
rirs.length
? fmt(
rirs.reduce(
(a, b) =>
a + b,
0
) /
rirs.length,
1
)
: '—'
);


document.getElementById(
'sessionExercisesList'
).innerHTML =
session.exercises
.map(
(
exercise,
exerciseIndex
) =>
renderSessionExercise(
exercise,
exerciseIndex
)
)
.join('');


clearInterval(
workoutTimer
);


workoutTimer =
setInterval(
() => {

const seconds =
Math.max(
0,
Math.floor(
(
Date.now() -
new Date(
session.startedAt
).getTime()
) / 1000
)
);


setText(
'sessionTimer',
formatDuration(
seconds
)
);

},
1000
);

}


function renderSessionExercise(
exercise,
exerciseIndex
) {

const separateSides =
exercise.type ===
'unilateral' &&
exercise.unilateralMode ===
'separate';


const rows =
exercise.sets
.map(
(
set,
setIndex
) => {

if (separateSides) {

return `
<tr>

<td class="set-number">
${setIndex + 1}
</td>

<td>
<input
class="set-input"
data-set-field="leftWeight"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.leftWeight)}"
placeholder="kg L"
>
</td>

<td>
<input
class="set-input"
data-set-field="leftReps"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.leftReps)}"
placeholder="reps L"
>
</td>

<td>
<input
class="set-input"
data-set-field="rightWeight"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.rightWeight)}"
placeholder="kg R"
>
</td>

<td>
<input
class="set-input"
data-set-field="rightReps"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.rightReps)}"
placeholder="reps R"
>
</td>

<td>
<input
class="set-input"
data-set-field="rir"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.rir)}"
placeholder="RIR"
>
</td>

<td>
<input
type="checkbox"
class="set-check"
data-done
data-ei="${exerciseIndex}"
data-si="${setIndex}"
${set.done ? 'checked' : ''}
>
</td>

</tr>
`;

}


return `
<tr>

<td class="set-number">
${setIndex + 1}
</td>

<td colspan="2">

<input
class="set-input"
data-set-field="weight"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.weight)}"
placeholder="kg"
>

</td>

<td>

<input
class="set-input"
data-set-field="reps"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.reps)}"
placeholder="reps"
>

</td>

<td>

<input
class="set-input"
data-set-field="rir"
data-ei="${exerciseIndex}"
data-si="${setIndex}"
value="${esc(set.rir)}"
placeholder="RIR"
>

</td>

<td></td>

<td>

<input
type="checkbox"
class="set-check"
data-done
data-ei="${exerciseIndex}"
data-si="${setIndex}"
${set.done ? 'checked' : ''}
>

</td>

</tr>
`;

}
)
.join('');


const header =
separateSides

? `
<th>L kg</th>
<th>L reps</th>
<th>R kg</th>
<th>R reps</th>
<th>RIR</th>
`

: `
<th colspan="2">
Carga
</th>

<th>
Reps
</th>

<th>
RIR
</th>

<th></th>
`;


return `
<article class="session-exercise">

<div class="session-exercise-head">

<div>

<h3>
${esc(exercise.name)}
</h3>

<small>

${esc(exercise.muscle)}

·

${
exercise.type ===
'unilateral'
? 'Unilateral'
: 'Bilateral'
}

${
separateSides
? ' · lados separados'
: ''
}

</small>

</div>


<button
class="remove-btn"
data-remove-session-exercise="${exerciseIndex}"
>
×
</button>

</div>


<table class="set-table">

<thead>

<tr>

<th>#</th>

${header}

<th>
Hecha
</th>

</tr>

</thead>


<tbody>

${rows}

</tbody>

</table>


<button
class="add-set"
data-add-set="${exerciseIndex}"
>
+ Añadir serie
</button>

</article>
`;

}


/* =========================================================
ACTUALIZACIÓN DE SERIES
========================================================= */

document.addEventListener(
'input',
event => {

const field =
event.target.closest(
'[data-set-field]'
);


if (
!field ||
!state.activeWorkout
) {
return;
}


const exercise =
state.activeWorkout
.exercises[
Number(
field.dataset.ei
)
];


const set =
exercise.sets[
Number(
field.dataset.si
)
];


set[
field.dataset.setField
] =
field.value;


localStorage.setItem(
STORAGE_KEY,
JSON.stringify(state)
);


updateSessionStatsOnly();

}
);


document.addEventListener(
'change',
event => {

const checkbox =
event.target.closest(
'[data-done]'
);


if (
!checkbox ||
!state.activeWorkout
) {
return;
}


state.activeWorkout
.exercises[
Number(
checkbox.dataset.ei
)
]
.sets[
Number(
checkbox.dataset.si
)
]
.done =
checkbox.checked;


save();

renderSession();

}
);


document.addEventListener(
'click',
event => {

const addSet =
event.target.closest(
'[data-add-set]'
);


if (addSet) {

const exercise =
state.activeWorkout
.exercises[
Number(
addSet.dataset.addSet
)
];


exercise.sets.push(
blankSet()
);


save();

renderSession();

return;

}


const removeExercise =
event.target.closest(
'[data-remove-session-exercise]'
);


if (removeExercise) {

state.activeWorkout
.exercises
.splice(
Number(
removeExercise.dataset
.removeSessionExercise
),
1
);


save();

renderSession();

}

}
);


function updateSessionStatsOnly() {

if (!state.activeWorkout) {
return;
}


setText(
'sessionSets',
state.activeWorkout
.exercises
.reduce(
(total, exercise) =>
total +
exercise.sets.filter(
set => set.done
).length,
0
)
);


setText(
'sessionVolume',
fmt(
sessionVolume()
) +
' kg'
);

}


/* =========================================================
TERMINAR ENTRENAMIENTO
========================================================= */

function finishWorkout() {

if (!state.activeWorkout) {
return;
}


if (
!confirm(
'¿Terminar y guardar esta sesión?'
)
) {
return;
}


const session =
clone(
state.activeWorkout
);


session.date =
dateKey(new Date());


session.finishedAt =
new Date().toISOString();


state.workouts.unshift(
session
);


state.activeWorkout =
null;


clearInterval(
workoutTimer
);


save();

renderTraining();

navigate('training');

}


document.getElementById(
'quickWorkout'
).onclick =
() =>
startWorkout();


document.getElementById(
'startFreeBtn'
).onclick =
() =>
startWorkout();


document.getElementById(
'emptyStartBtn'
).onclick =
() =>
startWorkout();


document.getElementById(
'finishWorkoutBtn'
).onclick =
finishWorkout;


document.getElementById(
'addExerciseToSession'
).onclick =
openExerciseChooserForSession;


document.getElementById(
'sessionNoteBtn'
).onclick =
() =>
document
.getElementById(
'noteModal'
)
.showModal();


document.getElementById(
'saveSessionNote'
).onclick =
() => {

if (!state.activeWorkout) {
return;
}


state.activeWorkout.notes =
document.getElementById(
'sessionNote'
).value;


save();


document
.getElementById(
'noteModal'
)
.close();

};


/* =========================================================
AÑADIR EJERCICIO A SESIÓN
========================================================= */

function openExerciseChooserForSession() {

const exercises =
allExercises();


const modal =
document.createElement(
'dialog'
);


modal.className =
'modal';


modal.innerHTML = `
<form
method="dialog"
class="modal-box"
>

<div class="modal-head">

<h2>
Añadir ejercicio
</h2>

<button class="close-btn">
×
</button>

</div>


<input
class="search-input big"
id="tempExSearch"
placeholder="Buscar ejercicio..."
>


<div
class="routine-picker"
id="tempExList"
>

${exercises.map(
exercise => `
<label
class="routine-pick"
>

<input
type="checkbox"
value="${exercise.id}"
>

<span>

<b>
${esc(exercise.name)}
</b>

<br>

<small>

${esc(exercise.muscle)}

·

${
exercise.type ===
'unilateral'
? 'Unilateral'
: 'Bilateral'
}

</small>

</span>

</label>
`
).join('')}

</div>


<button
type="button"
class="primary-btn wide"
id="tempExAdd"
>
Añadir seleccionados
</button>

</form>
`;


document.body.appendChild(
modal
);


modal.showModal();


const search =
modal.querySelector(
'#tempExSearch'
);


search.oninput = () => {

const query =
search.value.toLowerCase();


modal
.querySelectorAll(
'.routine-pick'
)
.forEach(item => {

item.style.display =
item.textContent
.toLowerCase()
.includes(query)
? 'flex'
: 'none';

});

};


modal
.querySelector(
'#tempExAdd'
)
.onclick = () => {

modal
.querySelectorAll(
'input:checked'
)
.forEach(input => {

const exercise =
getExercise(
input.value
);


if (exercise) {

state.activeWorkout
.exercises
.push(
exerciseForSession(
exercise
)
);

}

});


save();

modal.close();

modal.remove();

renderSession();

};


modal.addEventListener(
'close',
() =>
modal.remove()
);

}


/* =========================================================
RUTINAS
========================================================= */

function renderRoutines() {

const query =
(
document.getElementById(
'routineSearch'
)?.value || ''
).toLowerCase();


const routines =
state.routines.filter(
routine =>
routine.name
.toLowerCase()
.includes(query)
);


const grid =
document.getElementById(
'routineGrid'
);


if (!grid) {
return;
}


grid.innerHTML =
routines
.map(
routine => `
<article
class="routine-card"
>

<span class="tag">
${routine.exercises.length}
ejercicios
</span>


<h3>
${esc(routine.name)}
</h3>


<p>
${esc(
routine.description ||
'Sin descripción'
)}
</p>


<div>

${routine.exercises
.slice(0, 5)
.map(id => {

const exercise =
getExercise(id);

return exercise
? `
<span class="tag">
${esc(
exercise.name
)}
</span>
`
: '';

})
.join('')}


${
routine.exercises.length > 5
? `
<span class="tag">
+
${
routine.exercises.length -
5
}
</span>
`
: ''
}

</div>


<div class="card-actions">

<button
class="primary-btn"
data-start-routine="${routine.id}"
>
Entrenar
</button>


<button
class="secondary-btn"
data-edit-routine="${routine.id}"
>
Editar
</button>


<button
class="danger-btn"
data-delete-routine="${routine.id}"
>
×
</button>

</div>

</article>
`
)
.join('')

||

`
<div class="empty-state">

<h3>
No hay rutinas
</h3>

<p>
Crea tu primera rutina y añade
los ejercicios que quieras.
</p>

</div>
`;

}


function openRoutineModal(
id = null
) {

editingRoutineId =
id;


const routine =
id
? state.routines.find(
item =>
item.id === id
)
: null;


document.getElementById(
'routineModalTitle'
).textContent =
routine
? 'Editar rutina'
: 'Crear rutina';


document.getElementById(
'rName'
).value =
routine?.name || '';


document.getElementById(
'rDescription'
).value =
routine?.description || '';


renderRoutinePicker(
routine?.exercises || []
);


document
.getElementById(
'routineModal'
)
.showModal();

}


function renderRoutinePicker(
selected = []
) {

document.getElementById(
'routineExercisePicker'
).innerHTML =

allExercises()
.map(
exercise => `
<label
class="routine-pick"
>

<input
type="checkbox"
value="${exercise.id}"
${
selected.includes(
exercise.id
)
? 'checked'
: ''
}
>


<span>

<b>
${esc(exercise.name)}
</b>

<br>

<small>

${esc(
exercise.muscle
)}

·

${
exercise.type ===
'unilateral'
? 'Unilateral'
: 'Bilateral'
}

</small>

</span>

</label>
`
)
.join('');

}


document.getElementById(
'newRoutineBtn'
).onclick =
() =>
openRoutineModal();


document.getElementById(
'newRoutineBtn2'
).onclick =
() =>
openRoutineModal();


document.getElementById(
'emptyRoutineBtn'
).onclick =
() => {

document
.querySelector(
'[data-training-tab="routines"]'
)
.click();

};


document.getElementById(
'routineSearch'
).oninput =
renderRoutines;


document.getElementById(
'saveRoutineBtn'
).onclick =
() => {

const name =
document.getElementById(
'rName'
).value.trim();


if (!name) {
return;
}


const exercises =
[
...document.querySelectorAll(
'#routineExercisePicker input:checked'
)
]
.map(
input =>
input.value
);


const description =
document.getElementById(
'rDescription'
).value.trim();


if (editingRoutineId) {

const routine =
state.routines.find(
item =>
item.id ===
editingRoutineId
);


if (routine) {

routine.name =
name;

routine.description =
description;

routine.exercises =
exercises;

}

} else {

state.routines.push({

id:
uid('routine'),

name,

description,

exercises

});

}


save();


document
.getElementById(
'routineModal'
)
.close();


renderRoutines();

};


document.addEventListener(
'click',
event => {

const start =
event.target.closest(
'[data-start-routine]'
);


if (start) {

const routine =
state.routines.find(
item =>
item.id ===
start.dataset
.startRoutine
);


if (routine) {

startWorkout(
routine.name,
routine
);

}

return;

}


const edit =
event.target.closest(
'[data-edit-routine]'
);


if (edit) {

openRoutineModal(
edit.dataset
.editRoutine
);

return;

}


const remove =
event.target.closest(
'[data-delete-routine]'
);


if (
remove &&
confirm(
'¿Borrar esta rutina?'
)
) {

state.routines =
state.routines.filter(
routine =>
routine.id !==
remove.dataset
.deleteRoutine
);


save();

renderRoutines();

}

}
);


/* =========================================================
EJERCICIOS
========================================================= */

function renderExercises() {

const query =
(
document.getElementById(
'exerciseSearch'
)?.value || ''
).toLowerCase();


const muscle =
document.getElementById(
'exerciseMuscle'
)?.value || '';


const exercises =
allExercises().filter(
exercise => {

const matchesSearch =
!query ||
exercise.name
.toLowerCase()
.includes(query);


const matchesMuscle =
!muscle ||
exercise.muscle ===
muscle;


return (
matchesSearch &&
matchesMuscle
);

}
);


const grid =
document.getElementById(
'exerciseGrid'
);


if (!grid) {
return;
}


grid.innerHTML =
exercises
.map(
exercise => `
<article
class="exercise-card"
>

<span class="tag">
${esc(
exercise.muscle
)}
</span>


<span class="tag">

${
exercise.type ===
'unilateral'
? 'Unilateral'
: 'Bilateral'
}

</span>


<h3>
${esc(
exercise.name
)}
</h3>


<p>
${esc(
exercise.equipment ||
''
)}

${
exercise.custom
? ' · Creado por ti'
: ''
}
</p>


${
exercise.type ===
'unilateral'
? `
<small class="muted">

${
exercise.unilateralMode ===
'separate'

? 'Registro de lados separado'

: 'Mismo peso/reps en ambos lados'

}

</small>
`
: ''
}

</article>
`
)
.join('')

||

`
<div class="empty-state">

<p>
No se encontraron ejercicios.
</p>

</div>
`;


const select =
document.getElementById(
'progressExerciseSelect'
);


if (select) {

const previous =
select.value;


select.innerHTML =
allExercises()
.map(
exercise => `
<option
value="${exercise.id}"
>
${esc(
exercise.name
)}
</option>
`
)
.join('');


if (previous) {

select.value =
previous;

}

}

}


document.getElementById(
'exerciseSearch'
).oninput =
renderExercises;


document.getElementById(
'exerciseMuscle'
).onchange =
renderExercises;


document.getElementById(
'newExerciseBtn'
).onclick =
() => {

document.getElementById(
'exerciseModalTitle'
).textContent =
'Crear ejercicio';


document
.getElementById(
'exerciseForm'
)
.reset();


toggleUnilateral();


document
.getElementById(
'exerciseModal'
)
.showModal();

};


document.getElementById(
'eType'
).onchange =
toggleUnilateral;


function toggleUnilateral() {

const label =
document.getElementById(
'unilateralModeLabel'
);


label.style.display =
document.getElementById(
'eType'
).value ===
'unilateral'
? 'grid'
: 'none';

}


document.getElementById(
'exerciseForm'
).onsubmit =
event => {

event.preventDefault();


const exercise = {

id:
uid('custom'),

name:
document.getElementById(
'eName'
).value.trim(),

muscle:
document.getElementById(
'eMuscle'
).value,

equipment:
document.getElementById(
'eEquipment'
).value.trim(),

type:
document.getElementById(
'eType'
).value,

unilateralMode:
document.getElementById(
'eUnilateralMode'
).value,

custom:
true

};


if (!exercise.name) {
return;
}


state.customExercises.push(
exercise
);


save();


document
.getElementById(
'exerciseModal'
)
.close();


renderExercises();

};


/* =========================================================
HISTORIAL
========================================================= */

function renderHistory() {

const history =
document.getElementById(
'workoutHistory'
);


if (!history) {
return;
}


const workouts =
state.workouts;


history.innerHTML =
workouts
.map(
workout => `
<article
class="history-item"
data-history-item
>

<div class="history-main">

<div>

<h3>
${esc(
workout.name
)}
</h3>

<p>

${fmtDate(
workout.date,
{
weekday: 'long',
day: 'numeric',
month: 'long',
year: 'numeric'
}
)}

·

${workout.exercises.length}
ejercicios

</p>

</div>


<div>

<b>
${fmt(
workoutVolume(
workout
)
)}
kg
</b>

<p>

${
workout.exercises
.reduce(
(
total,
exercise
) =>
total +
exercise.sets.filter(
set => set.done
).length,
0
)
}

series

</p>

</div>

</div>


<div class="history-details">

${
workout.exercises
.map(
exercise => `
<div class="list-row">

<div>

<b>
${esc(
exercise.name
)}
</b>

<small>

${
exercise.type ===
'unilateral'
? 'Unilateral'
: 'Bilateral'
}

</small>

</div>


<span>

${
exercise.sets
.filter(
set =>
set.done
)
.map(
set => {

if (
exercise.type ===
'unilateral' &&
exercise.unilateralMode ===
'separate'
) {

return `
${
set.leftWeight ||
0
}
×
${
set.leftReps ||
0
}

/

${
set.rightWeight ||
0
}
×
${
set.rightReps ||
0
}
`;

}


return `
${
set.weight ||
0
}

×

${
set.reps ||
0
}

· RIR

${
set.rir ||
'—'
}
`;

}
)
.join(' · ')

||

'Sin series completadas'

}

</span>

</div>
`
)
.join('')
}


${
workout.notes
? `
<p class="muted">
Nota:
${esc(
workout.notes
)}
</p>
`
: ''
}

</div>

</article>
`
)
.join('')

||

`
<div class="empty-state">

<h3>
Sin historial
</h3>

<p>
Cuando termines una sesión
aparecerá aquí.
</p>

</div>
`;

}


document.addEventListener(
'click',
event => {

const item =
event.target.closest(
'[data-history-item]'
);


if (
item &&
!event.target.closest(
'button'
)
) {

item.classList.toggle(
'open'
);

}

}
);


/* =========================================================
PROGRESIÓN
========================================================= */

function renderProgression() {

const select =
document.getElementById(
'progressExerciseSelect'
);


const content =
document.getElementById(
'progressionContent'
);


if (!select || !content) {
return;
}


const id =
select.value ||
allExercises()[0]?.id;


const exercise =
getExercise(id);


if (!exercise) {

content.innerHTML =
'';

return;

}


const rows = [];


state.workouts.forEach(
workout => {

const exerciseData =
workout.exercises.find(
item =>
item.exerciseId ===
id
);


if (!exerciseData) {
return;
}


const completed =
exerciseData.sets.filter(
set => set.done
);


if (!completed.length) {
return;
}


let volume = 0;


completed.forEach(
set => {

if (
exerciseData.type ===
'unilateral' &&
exerciseData.unilateralMode ===
'separate'
) {

volume +=
(
Number(
set.leftWeight
) || 0
) *
(
Number(
set.leftReps
) || 0
);


volume +=
(
Number(
set.rightWeight
) || 0
) *
(
Number(
set.rightReps
) || 0
);

} else {

const multiplier =
exerciseData.type ===
'unilateral'
? 2
: 1;


volume +=
(
Number(
set.weight
) || 0
) *
(
Number(
set.reps
) || 0
) *
multiplier;

}

}
);


const weights =
completed
.map(
set =>
Number(
set.weight
) || 0
)
.filter(
weight =>
weight > 0
);


rows.push({

date:
workout.date,

volume,

top:
weights.length
? Math.max(
...weights
)
: 0,

reps:
completed.reduce(
(max, set) =>
Math.max(
max,
Number(
set.reps
) || 0
),
0
)

});

}
);


const best =
rows.length
? Math.max(
...rows.map(
row => row.top
)
)
: 0;


const maxVolume =
rows.length
? Math.max(
...rows.map(
row => row.volume
)
)
: 0;


content.innerHTML = `

<div class="progression-summary">

<div class="prog-stat">

<span>
Mejor carga registrada
</span>

<b>
${fmt(best)} kg
</b>

</div>


<div class="prog-stat">

<span>
Mayor volumen
</span>

<b>
${fmt(maxVolume)} kg
</b>

</div>


<div class="prog-stat">

<span>
Sesiones
</span>

<b>
${rows.length}
</b>

</div>


<div class="prog-stat">

<span>
Última carga
</span>

<b>
${
rows.length
? fmt(
rows[
rows.length - 1
].top
)
: '—'
}
kg
</b>

</div>

</div>


<div class="panel">

<div class="panel-head">

<div>

<p class="eyebrow">
${esc(
exercise.muscle
)}
</p>

<h3>
${esc(
exercise.name
)}
</h3>

</div>

</div>


<div class="mini-chart">

${progressSvg(rows)}

</div>

</div>


<div class="list">

${
rows
.slice()
.reverse()
.slice(0, 10)
.map(
row => `
<div class="list-row">

<span>
${fmtDate(
row.date
)}
</span>

<b>

${fmt(
row.top
)}
kg

·

${fmt(
row.reps
)}
reps

·

${fmt(
row.volume
)}
kg vol.

</b>

</div>
`
)
.join('')

||

emptyList(
'Todavía no hay datos de este ejercicio.'
)
}

</div>
`;

}


function progressSvg(rows) {

if (!rows.length) {

return `
<div class="empty-state">

<p>
Completa algunas sesiones
para ver la progresión.
</p>

</div>
`;

}


const values =
rows.map(
row => row.top
);


const max =
Math.max(
...values
);


const min =
Math.min(
...values
);


const range =
max - min || 1;


const points =
values
.map(
(value, index) => {

const x =
(
index /
(
values.length - 1 ||
1
)
) *
100;


const y =
90 -
(
(
value - min
) /
range
) *
70;


return `${x},${y}`;

}
)
.join(' ');


return `
<svg
viewBox="0 0 100 100"
preserveAspectRatio="none"
style="
width:100%;
height:100%;
"
>

<line
x1="0"
y1="90"
x2="100"
y2="90"
stroke="#2a323d"
/>


<polyline
points="${points}"
fill="none"
stroke="var(--accent)"
stroke-width="2"
vector-effect="non-scaling-stroke"
/>


${
values
.map(
(value, index) => {

const x =
(
index /
(
values.length -
1 ||
1
)
) *
100;


const y =
90 -
(
(
value -
min
) /
range
) *
70;


return `
<circle
cx="${x}"
cy="${y}"
r="2"
fill="var(--accent)"
/>
`;

}
)
.join('')
}

</svg>
`;

}


document.getElementById(
'progressExerciseSelect'
).onchange =
renderProgression;


/* =========================================================
PROGRESO DE PESO
========================================================= */

function renderProgress() {

const progress =
state.progress
.slice()
.sort(
(a, b) =>
a.date.localeCompare(
b.date
)
);


const current =
progress[
progress.length - 1
]?.weight;


setText(
'currentWeight',
current != null
? fmt(
current,
1
)
: '—'
);


setText(
'startWeight',
progress[0]?.weight != null
? fmt(
progress[0].weight,
1
)
: '—'
);


setText(
'targetWeightDisplay',
state.targetWeight != null
? fmt(
state.targetWeight,
1
)
: '—'
);


setText(
'weightEntries',
progress.length
);


const range =
Number(
document.getElementById(
'progressRange'
)?.value || 30
);


const filtered =
progress.filter(
entry =>
(
Date.now() -
new Date(
entry.date +
'T12:00:00'
).getTime()
) <=
range *
86400000
);


drawWeightChart(
filtered
);


const history =
document.getElementById(
'weightHistory'
);


if (!history) {
return;
}


history.innerHTML =
progress
.slice()
.reverse()
.slice(0, 10)
.map(
(entry, index) => `
<div class="list-row">

<div>

<b>
${fmt(
entry.weight,
1
)}
kg
</b>

<small>
${fmtDate(
entry.date
)}
</small>

</div>


<button
class="remove-btn"
data-remove-progress="${index}"
>
×
</button>

</div>
`
)
.join('')

||

emptyList(
'No hay registros todavía.'
);

}


function drawWeightChart(
entries
) {

const svg =
document.getElementById(
'weightChart'
);


if (!svg) {
return;
}


if (!entries.length) {

svg.innerHTML = `
<text
x="50%"
y="50%"
text-anchor="middle"
fill="#8e99a8"
>
Registra tu primer peso
para ver la gráfica
</text>
`;

return;

}


const values =
entries.map(
entry => entry.weight
);


const min =
Math.min(
...values
) - 1;


const max =
Math.max(
...values
) + 1;


let path = '';


values.forEach(
(value, index) => {

const x =
30 +
index *
(
740 /
Math.max(
1,
values.length - 1
)
);


const y =
270 -
(
(
value - min
) /
(
max - min
)
) *
230;


path +=
(
index
? 'L'
: 'M'
) +
x +
' ' +
y +
' ';

}
);


svg.innerHTML = `

<line
class="chart-grid"
x1="30"
y1="270"
x2="770"
y2="270"
/>


<line
class="chart-grid"
x1="30"
y1="40"
x2="30"
y2="270"
/>


<path
class="chart-line"
d="${path}"
/>


${
values
.map(
(value, index) => {

const x =
30 +
index *
(
740 /
Math.max(
1,
values.length - 1
)
);


const y =
270 -
(
(
value - min
) /
(
max - min
)
) *
230;


return `
<circle
class="chart-dot"
cx="${x}"
cy="${y}"
r="5"
/>
`;

}
)
.join('')
}

`;

}


document.getElementById(
'progressRange'
).onchange =
renderProgress;


document.getElementById(
'addProgressBtn'
).onclick =
() => {

const weight =
prompt(
'Peso actual (kg):'
);


if (weight === null) {
return;
}


const number =
Number(weight);


if (
!Number.isFinite(number) ||
number <= 0
) {

alert(
'Introduce un peso válido.'
);

return;

}


const note =
prompt(
'Nota opcional:'
) || '';


state.progress.push({

id:
uid('weight'),

date:
dateKey(new Date()),

weight:
number,

note

});


save();

renderProgress();

};


document.addEventListener(
'click',
event => {

const button =
event.target.closest(
'[data-remove-progress]'
);


if (
!button ||
!confirm(
'¿Eliminar este registro?'
)
) {
return;
}


const sorted =
state.progress
.slice()
.sort(
(a, b) =>
a.date.localeCompare(
b.date
)
);


const entry =
sorted[
Number(
button.dataset
.removeProgress
)
];


if (!entry) {
return;
}


state.progress =
state.progress.filter(
item =>
item.id !==
entry.id
);


save();

renderProgress();

}
);


/* =========================================================
MANTENIMIENTO Y OBJETIVOS
========================================================= */

function calculateMaintenance() {

const sex =
document.getElementById(
'mSex'
).value;


const age =
Number(
document.getElementById(
'mAge'
).value
);


const weight =
Number(
document.getElementById(
'mWeight'
).value
);


const height =
Number(
document.getElementById(
'mHeight'
).value
);


const activity =
Number(
document.getElementById(
'mActivity'
).value
);


const adjustment =
Number(
document.getElementById(
'mAdjustment'
).value
) || 0;


let bmr =
10 * weight +
6.25 * height -
5 * age +
(
sex === 'male'
? 5
: -161
);


let maintenance =
Math.round(
bmr * activity
);


const goal =
document.getElementById(
'mGoal'
).value;


if (
goal === 'cut' &&
adjustment === 0
) {

maintenance -= 300;

}


if (
goal === 'gain' &&
adjustment === 0
) {

maintenance += 200;

}


maintenance +=
adjustment;


const protein =
Math.round(
weight * 1.8
);


const fat =
Math.round(
weight * 0.8
);


const carbs =
Math.max(
0,
Math.round(
(
maintenance -
protein * 4 -
fat * 9
) / 4
)
);


state.maintenance = {

sex,

age,

weight,

height,

activity,

goal,

adjustment,

bmr,

maintenance

};


state.goals = {

calories:
maintenance,

protein,

carbs,

fat

};


save();

renderMaintenance();

}


function renderMaintenance() {

const maintenance =
state.maintenance;


const goals =
state.goals;


document.getElementById(
'mSex'
).value =
maintenance.sex ||
'male';


document.getElementById(
'mAge'
).value =
maintenance.age ||
18;


document.getElementById(
'mWeight'
).value =
maintenance.weight ||
71;


document.getElementById(
'mHeight'
).value =
maintenance.height ||
176;


document.getElementById(
'mActivity'
).value =
maintenance.activity ||
1.55;


document.getElementById(
'mGoal'
).value =
maintenance.goal ||
'cut';


document.getElementById(
'mAdjustment'
).value =
maintenance.adjustment ??
0;


setText(
'maintenanceResult',
fmt(
maintenance.maintenance ||
goals.calories
)
);


setText(
'goalProteinResult',
fmt(
goals.protein
) +
' g'
);


setText(
'goalCarbsResult',
fmt(
goals.carbs
) +
' g'
);


setText(
'goalFatResult',
fmt(
goals.fat
) +
' g'
);


document.getElementById(
'goalCalInput'
).value =
goals.calories;


document.getElementById(
'goalProteinInput'
).value =
goals.protein;


document.getElementById(
'goalCarbsInput'
).value =
goals.carbs;


document.getElementById(
'goalFatInput'
).value =
goals.fat;

}


document.getElementById(
'maintenanceForm'
).onsubmit =
event => {

event.preventDefault();

calculateMaintenance();

};


document.getElementById(
'saveManualGoals'
).onclick =
() => {

state.goals = {

calories:
Number(
document.getElementById(
'goalCalInput'
).value
) || 2300,

protein:
Number(
document.getElementById(
'goalProteinInput'
).value
) || 130,

carbs:
Number(
document.getElementById(
'goalCarbsInput'
).value
) || 260,

fat:
Number(
document.getElementById(
'goalFatInput'
).value
) || 70

};


save();

renderMaintenance();

};


/* =========================================================
ASISTENTE LOCAL
========================================================= */

function assistantAnswer(
question
) {

const query =
question.toLowerCase();


const totals =
totalsForDate(
dateKey(new Date())
);


if (
query.includes('calor') ||
query.includes('kcal')
) {

return `
Hoy llevas
${fmt(totals.calories)}
kcal de un objetivo de
${fmt(state.goals.calories)}
kcal.
`;

}


if (
query.includes('prote')
) {

return `
Hoy llevas
${fmt(totals.protein, 1)}
g de proteína.
Tu objetivo guardado es
${fmt(state.goals.protein)}
g.
`;

}


if (
query.includes('sesion') ||
query.includes('sesión') ||
query.includes('entren')
) {

return `
Has registrado
${
state.workouts.filter(
workout =>
withinDays(
workout.date,
7
)
).length
}
sesiones en los últimos
7 días.
`;

}


if (
query.includes('volumen')
) {

const volumes =
state.workouts
.flatMap(
workout =>
workout.exercises.map(
exercise => ({

name:
exercise.name,

volume:
(
exercise.sets ||
[]
).reduce(
(
total,
set
) =>
total +
(
Number(
set.weight
) || 0
) *
(
Number(
set.reps
) || 0
),
0
)

})
)
)
.sort(
(a, b) =>
b.volume -
a.volume
);


if (!volumes.length) {

return `
Todavía no hay suficiente
historial.
`;

}


return `
El mayor volumen registrado
recientemente es de
${fmt(volumes[0].volume)}
kg en
${volumes[0].name}.
`;

}


return `
Puedo consultar tus calorías,
macros de hoy, sesiones recientes
y progresión guardada.

Prueba con:
“¿cuánta proteína llevo hoy?”
`;

}


function sendAssistant(
question
) {

if (!question.trim()) {
return;
}


const messages =
document.getElementById(
'assistantMessages'
);


messages.insertAdjacentHTML(
'beforeend',
`
<div class="msg user">

<small>
Tú
</small>

${esc(question)}

</div>
`
);


messages.insertAdjacentHTML(
'beforeend',
`
<div class="msg">

<small>
Nutri
</small>

${esc(
assistantAnswer(
question
)
)}

</div>
`
);


messages.scrollTop =
messages.scrollHeight;

}


document.getElementById(
'assistantSend'
).onclick =
() => {

const input =
document.getElementById(
'assistantInput'
);


sendAssistant(
input.value
);


input.value = '';

};


document.getElementById(
'assistantInput'
).onkeydown =
event => {

if (
event.key ===
'Enter'
) {

document
.getElementById(
'assistantSend'
)
.click();

}

};


document
.querySelectorAll(
'.suggestions button'
)
.forEach(
button => {

button.onclick =
() =>
sendAssistant(
button.dataset
.question
);

}
);


/* =========================================================
PESTAÑAS DE ENTRENAMIENTO
========================================================= */

function switchTrainingTab(
tab
) {

document
.querySelectorAll(
'.training-tab'
)
.forEach(
button => {

button.classList.toggle(
'active',
button.dataset
.trainingTab ===
tab
);

}
);


document
.querySelectorAll(
'.training-pane'
)
.forEach(
pane => {

pane.classList.toggle(
'active',
pane.id ===
'training-' +
tab
);

}
);


if (
tab ===
'progression'
) {

renderProgression();

}

}


document
.querySelectorAll(
'.training-tab'
)
.forEach(
button => {

button.onclick =
() =>
switchTrainingTab(
button.dataset
.trainingTab
);

}
);


/* =========================================================
EXPORTAR DATOS
========================================================= */

document.getElementById(
'exportData'
).onclick = () => {

const blob =
new Blob(
[
JSON.stringify(
state,
null,
2
)
],
{
type:
'application/json'
}
);


const url =
URL.createObjectURL(
blob
);


const link =
document.createElement(
'a'
);


link.href =
url;


link.download =
`nutri-backup-${
dateKey(new Date())
}.json`;


link.click();


URL.revokeObjectURL(
url
);

};


/* =========================================================
IMPORTAR DATOS
========================================================= */

document.getElementById(
'importData'
).onchange =
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

state =
merge(
initialState,
JSON.parse(
reader.result
)
);


save();


alert(
'Datos importados correctamente.'
);


} catch (error) {

console.error(
error
);


alert(
'El archivo no es un backup válido de Nutri.'
);

}

};


reader.readAsText(
file
);

};


/* =========================================================
RESTABLECER DATOS
========================================================= */

document.getElementById(
'resetData'
).onclick =
() => {

if (
!confirm(
'Esto borrará todos los datos guardados en este dispositivo. ¿Continuar?'
)
) {

return;

}


state =
clone(
initialState
);


localStorage.removeItem(
STORAGE_KEY
);


renderAll();

navigate(
'dashboard'
);

};


/* =========================================================
RENDER GENERAL
========================================================= */

function renderAll() {

renderDashboard();

renderNutrition();

renderTraining();

renderProgress();

renderMaintenance();

renderRoutines();

renderExercises();

renderHistory();

renderProgression();

}


/* =========================================================
INICIAR APP
========================================================= */

renderAll();
