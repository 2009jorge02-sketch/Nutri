* script.js */
const FOOD_DATABASE = typeof foods !== 'undefined' ? foods : (window.foods || []);
const STORAGE_KEY = 'nutri_app_v4';

const defaultExercises = [
['Press banca máquina','Pecho','Máquina','bilateral','same'],
['Press inclinado con mancuernas','Pecho','Mancuernas','bilateral','same'],
['Aperturas en polea','Pecho','Polea','bilateral','same'],
['Pec deck','Pecho','Máquina','bilateral','same'],
['Jalón al pecho agarre ancho','Espalda','Polea','bilateral','same'],
['Remo T-bar','Espalda','Máquina','bilateral','same'],
['Remo unilateral en polea','Espalda','Polea','unilateral','same'],
['Pullover en polea','Espalda','Polea','bilateral','same'],
['Press hombros máquina','Hombros','Máquina','bilateral','same'],
['Elevación lateral','Hombros','Mancuernas','bilateral','same'],
['Elevación lateral unilateral en polea','Hombros','Polea','unilateral','same'],
['Pájaros en máquina','Hombros','Máquina','bilateral','same'],
['Curl bíceps detrás del torso','Bíceps','Polea','unilateral','same'],
['Curl predicador','Bíceps','Máquina','bilateral','same'],
['Curl martillo','Bíceps','Mancuernas','unilateral','same'],
['Extensión de tríceps en polea','Tríceps','Polea','bilateral','same'],
['Extensión de tríceps unilateral','Tríceps','Polea','unilateral','same'],
['Press cerrado','Tríceps','Máquina','bilateral','same'],
['Extensión de cuádriceps','Pierna','Máquina','bilateral','same'],
['Curl femoral','Pierna','Máquina','bilateral','same'],
['Prensa','Pierna','Máquina','bilateral','same'],
['Elevación de gemelo de pie','Pierna','Máquina','bilateral','same'],
['Hip thrust','Glúteos','Máquina','bilateral','same'],
['Abducción de cadera','Glúteos','Máquina','bilateral','same'],
['Crunch en polea','Abdomen','Polea','bilateral','same'],
['Elevación de piernas','Abdomen','Peso corporal','bilateral','same'],
['Curl de muñeca','Antebrazo','Mancuernas','bilateral','same']
].map((x,i)=>({
id:'def-'+(i+1),
name:x[0],
muscle:x[1],
equipment:x[2],
type:x[3],
unilateralMode:x[4],
custom:false
}));

const initialState = {
goals:{
calories:2300,
protein:130,
carbs:260,
fat:70
},
maintenance:{
sex:'male',
age:18,
weight:71,
height:176,
activity:1.55,
goal:'cut',
adjustment:-400
},
nutrition:{},
progress:[],
targetWeight:null,
customFoods:[],
customExercises:[],
routines:[],
workouts:[],
activeWorkout:null,
settings:{}
};

let state = loadState();
let selectedFood = null;
let selectedRoutineId = null;
let editingRoutineId = null;
let currentNutritionDate = dateKey(new Date());
let workoutTimer = null;

function clone(v){
return JSON.parse(JSON.stringify(v));
}

function loadState(){
try{
const raw = localStorage.getItem(STORAGE_KEY);
return raw ? merge(initialState,JSON.parse(raw)) : clone(initialState);
}catch(e){
return clone(initialState);
}
}

function merge(a,b){
const out=clone(a);
for(const k in b){
if(
b[k] &&
typeof b[k]==='object' &&
!Array.isArray(b[k]) &&
typeof out[k]==='object'
){
out[k]=merge(out[k],b[k]);
}else{
out[k]=b[k];
}
}
return out;
}

function save(){
localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
renderAll();
}

function uid(prefix='id'){
return prefix+'_'+Math.random().toString(36).slice(2,9)+'_'+Date.now().toString(36);
}

function dateKey(d){
return new Date(
d.getTime()-d.getTimezoneOffset()*60000
).toISOString().slice(0,10);
}

function fmtDate(
key,
opts={day:'numeric',month:'short',year:'numeric'}
){
return new Date(key+'T12:00:00').toLocaleDateString('es-ES',opts);
}

function esc(s){
return String(s??'').replace(
/[&<>'"]/g,
c=>({
'&':'&amp;',
'<':'&lt;',
'>':'&gt;',
"'":'&#39;',
'"':'&quot;'
}[c])
);
}

function allExercises(){
return [
...defaultExercises,
...state.customExercises
];
}

function allFoods(){
return [
...FOOD_DATABASE,
...(state.customFoods || [])
];
}

function getFood(id){
return allFoods().find(
f=>String(f.id)===String(id)
);
}

function getExercise(id){
return allExercises().find(e=>e.id===id);
}

function pct(v,g){
return g
? Math.min(100,Math.max(0,v/g*100))
: 0;
}

function kcalFromMacros(p,c,f){
return p*4+c*4+f*9;
}

function todayLog(){
return state.nutrition[currentNutritionDate] || [];
}

function totalsForDate(key){
return (state.nutrition[key] || []).reduce(
(a,x)=>{
a.calories+=x.calories;
a.protein+=x.protein;
a.carbs+=x.carbs;
a.fat+=x.fat;
return a;
},
{
calories:0,
protein:0,
carbs:0,
fat:0
}
);
}

function fmt(n,d=0){
return Number(n||0).toLocaleString(
'es-ES',
{maximumFractionDigits:d}
);
}

function navigate(view){
document
.querySelectorAll('.view')
.forEach(v=>v.classList.toggle(
'active',
v.id==='view-'+view
));

document
.querySelectorAll('.nav-link')
.forEach(b=>b.classList.toggle(
'active',
b.dataset.view===view
));

window.scrollTo({
top:0,
behavior:'smooth'
});

if(view==='nutrition')renderNutrition();
if(view==='training')renderTraining();
if(view==='progress')renderProgress();
if(view==='maintenance')renderMaintenance();
}

document.addEventListener('click',e=>{
const v=e.target.closest('[data-view]');

if(v){
navigate(v.dataset.view);
return;
}

if(e.target.id==='settingsBtn'){
navigate('settings');
}
});

function renderDashboard(){
const t=totalsForDate(dateKey(new Date()));
const g=state.goals;

document.getElementById('todayLabel').textContent=
fmtDate(
dateKey(new Date()),
{
weekday:'long',
day:'numeric',
month:'long'
}
);

setText('dashCalories',fmt(t.calories));
setText('dashCalGoal',fmt(g.calories));
setText('dashProtein',fmt(t.protein));
setText('dashCarbs',fmt(t.carbs));
setText('dashFat',fmt(t.fat));

setBar('dashProteinBar',t.protein,g.protein);
setBar('dashCarbsBar',t.carbs,g.carbs);
setBar('dashFatBar',t.fat,g.fat);

document.getElementById('calorieDonut').style.background=
`conic-gradient(
var(--accent)
${Math.min(
360,
t.calories/Math.max(1,g.calories)*360
)}deg,
#2b323d 0deg
)`;

const sessions=state.workouts.filter(
w=>withinDays(w.date,7)
);

const sets=sessions.reduce(
(a,w)=>
a+w.exercises.reduce(
(b,x)=>
b+x.sets.filter(s=>s.done).length,
0
),
0
);

const vol=sessions.reduce(
(a,w)=>a+workoutVolume(w),
0
);

setText('dashSessions',sessions.length);
setText('dashSets',sets);
setText('dashVolume',fmt(vol));

const last=state.workouts[0];

setText(
'dashWorkoutTitle',
last ? last.name : 'Ningún entrenamiento hoy'
);

setText(
'dashWorkoutText',
last
? `${fmtDate(last.date)} · ${last.exercises.length} ejercicios`
: 'Crea una rutina o empieza un entrenamiento libre.'
);

const rw=document.getElementById('dashRecentWorkouts');

rw.innerHTML=
sessions.slice(0,4)
.map(
w=>`
<div class="list-row">
<div>
<b>${esc(w.name)}</b>
<small>${fmtDate(w.date)} · ${w.exercises.length} ejercicios</small>
</div>
<b>${fmt(workoutVolume(w))} kg</b>
</div>
`
)
.join('')
||
emptyList('Todavía no hay sesiones.');

const ml=document.getElementById('dashMeals');

ml.innerHTML=
todayLog()
.slice(-4)
.reverse()
.map(
x=>`
<div class="list-row">
<div>
<b>${esc(x.name)}</b>
<small>${fmt(x.grams,1)} g</small>
</div>
<b>${fmt(x.calories)} kcal</b>
</div>
`
)
.join('')
||
emptyList('No hay alimentos registrados hoy.');
}

function emptyList(t){
return `<div class="list-row"><span>${t}</span></div>`;
}

function setText(id,v){
const e=document.getElementById(id);
if(e)e.textContent=v;
}

function setBar(id,v,g){
const e=document.getElementById(id);
if(e)e.style.width=pct(v,g)+'%';
}

function withinDays(date,n){
return (
Date.now()-
new Date(date+'T23:59:59').getTime()
) <= n*86400000;
}

function renderNutrition(){
renderCustomFoods();

const t=totalsForDate(currentNutritionDate);
const g=state.goals;

setText(
'nutritionDate',
fmtDate(
currentNutritionDate,
{
weekday:'long',
day:'numeric',
month:'long',
year:'numeric'
}
)
);

setText('nutCalories',fmt(t.calories));
setText('nutCalGoal',fmt(g.calories)+' kcal');
setText(
'nutCalRemaining',
`${fmt(Math.max(0,g.calories-t.calories))} kcal restantes`
);

setBar('nutCalBar',t.calories,g.calories);
setText('nutProtein',fmt(t.protein)+' g');
setText('nutCarbs',fmt(t.carbs)+' g');
setText('nutFat',fmt(t.fat)+' g');
setText('foodCount',todayLog().length);
setText(
'customFoodCount',
(state.customFoods || []).length
);

setText(
'sideProtein',
`${fmt(t.protein)} / ${fmt(g.protein)} g`
);

setText(
'sideCarbs',
`${fmt(t.carbs)} / ${fmt(g.carbs)} g`
);

setText(
'sideFat',
`${fmt(t.fat)} / ${fmt(g.fat)} g`
);

setBar('sideProteinBar',t.protein,g.protein);
setBar('sideCarbsBar',t.carbs,g.carbs);
setBar('sideFatBar',t.fat,g.fat);

document.getElementById('foodLog').innerHTML=
todayLog()
.map(
(x,i)=>`
<div class="food-row">
<div>
<strong>${esc(x.name)}</strong>
<small>
${x.brand?esc(x.brand)+' · ':''}
${fmt(x.grams,1)} g
</small>
</div>

<div class="food-kcal">
<b>${fmt(x.calories)}</b>
<small>kcal</small>
</div>

<div class="food-macros">
<small>
${fmt(x.protein,1)}P ·
${fmt(x.carbs,1)}C ·
${fmt(x.fat,1)}G
</small>
</div>

<button
class="remove-btn"
data-remove-food="${i}"
>×</button>
</div>
`
)
.join('')
||
`
<div class="empty-state">
<span>⌁</span>
<h3>Diario vacío</h3>
<p>Añade un alimento para empezar.</p>
</div>
`;
}

document.addEventListener('click',e=>{
const r=e.target.closest('[data-remove-food]');

if(r){
state.nutrition[currentNutritionDate].splice(
+r.dataset.removeFood,
1
);

save();
renderNutrition();
}
});

function renderCustomFoods(){
const box=document.getElementById('customFoodList');

if(!box)return;

const foods=state.customFoods || [];

box.innerHTML=
foods.map(
f=>`
<div class="food-row custom-food-row">
<div>
<strong>${esc(f.name)}</strong>
<small>
${f.brand?esc(f.brand)+' · ':''}
${fmt(f.calories)} kcal ·
${fmt(f.protein,1)}P ·
${fmt(f.carbs,1)}C ·
${fmt(f.fat,1)}G / 100 g
</small>
</div>

<div class="food-actions">
<button
class="secondary-btn"
data-edit-custom-food="${f.id}"
>Editar</button>

<button
class="remove-btn"
data-delete-custom-food="${f.id}"
>×</button>
</div>
</div>
`
)
.join('')
||
`
<div class="empty-state">
<h3>Aún no tienes alimentos propios</h3>
<p>Guarda un alimento de tu casa y aparecerá siempre en el buscador.</p>
</div>
`;
}

function openCustomFoodModal(id=null){
const f=id
? state.customFoods.find(
x=>String(x.id)===String(id)
)
: null;

document.getElementById(
'customFoodModalTitle'
).textContent=
f
? 'Editar alimento'
: 'Añadir alimento propio';

document.getElementById(
'customFoodId'
).value=
f?.id || '';

document.getElementById(
'customFoodName'
).value=
f?.name || '';

document.getElementById(
'customFoodBrand'
).value=
f?.brand || '';

document.getElementById(
'customFoodCalories'
).value=
f?.calories ?? '';

document.getElementById(
'customFoodProtein'
).value=
f?.protein ?? '';

document.getElementById(
'customFoodCarbs'
).value=
f?.carbs ?? '';

document.getElementById(
'customFoodFat'
).value=
f?.fat ?? '';

document
.getElementById('customFoodModal')
.showModal();
}

function saveCustomFood(){
const name=
document
.getElementById('customFoodName')
.value
.trim();

const brand=
document
.getElementById('customFoodBrand')
.value
.trim();

const calories=
Number(
document.getElementById(
'customFoodCalories'
).value
);

const protein=
Number(
document.getElementById(
'customFoodProtein'
).value
);

const carbs=
Number(
document.getElementById(
'customFoodCarbs'
).value
);

const fat=
Number(
document.getElementById(
'customFoodFat'
).value
);

if(
!name ||
![
calories,
protein,
carbs,
fat
].every(Number.isFinite) ||
calories<0 ||
protein<0 ||
carbs<0 ||
fat<0
){
alert(
'Completa correctamente los datos del alimento por 100 g.'
);
return;
}

const id=
document.getElementById(
'customFoodId'
).value;

if(id){
const f=state.customFoods.find(
x=>String(x.id)===String(id)
);

if(f){
Object.assign(
f,
{
name,
brand,
category:'Mis alimentos',
calories,
protein,
carbs,
fat
}
);
}
}else{
state.customFoods.push({
id:uid('customfood'),
name,
brand,
category:'Mis alimentos',
calories,
protein,
carbs,
fat,
custom:true,
createdAt:new Date().toISOString()
});
}

save();
renderCustomFoods();
renderFoodResults(
document.getElementById('foodSearch')?.value || ''
);

document
.getElementById('customFoodModal')
.close();
}

document.getElementById(
'openCustomFood'
).onclick=
()=>openCustomFoodModal();

document.getElementById(
'openCustomFood2'
).onclick=
()=>openCustomFoodModal();

document.getElementById(
'saveCustomFood'
).onclick=
saveCustomFood;

document.addEventListener('click',e=>{
const ed=e.target.closest(
'[data-edit-custom-food]'
);

if(ed){
openCustomFoodModal(
ed.dataset.editCustomFood
);
}

const del=e.target.closest(
'[data-delete-custom-food]'
);

if(
del &&
confirm(
'¿Eliminar este alimento de Mis alimentos?'
)
){
state.customFoods=
state.customFoods.filter(
f=>
String(f.id)!==
String(
del.dataset.deleteCustomFood
)
);

save();

renderCustomFoods();

renderFoodResults(
document.getElementById(
'foodSearch'
)?.value || ''
);
}
});

function openFoodModal(){
const m=document.getElementById('foodModal');

selectedFood=null;

document
.getElementById('foodAmount')
.classList
.add('hidden');

document.getElementById(
'foodSearch'
).value='';

renderFoodResults('');

m.showModal();

setTimeout(
()=>document.getElementById(
'foodSearch'
).focus(),
50
);
}

document.getElementById(
'openFoodModal'
).onclick=
openFoodModal;

document.getElementById(
'foodSearch'
).addEventListener(
'input',
e=>renderFoodResults(e.target.value)
);

function renderFoodResults(q){
const term=q.trim().toLowerCase();

const arr=
allFoods()
.filter(
f=>
!term ||
`${f.name} ${f.brand||''} ${f.category||''}`
.toLowerCase()
.includes(term)
)
.slice(0,80);

document.getElementById(
'foodResults'
).innerHTML=
arr.map(
f=>`
<button
type="button"
class="food-result"
data-food-id="${f.id}"
>
<span>
<b>${esc(f.name)}</b>
<small>
${esc(f.category||'')}
${f.brand?'· '+esc(f.brand):''}
</small>
</span>
<strong>${fmt(f.calories)} kcal</strong>
</button>
`
)
.join('')
||
`
<div class="empty-state">
<p>No se encontraron alimentos.</p>
</div>
`;
}

document.addEventListener('click',e=>{
const b=e.target.closest(
'[data-food-id]'
);

if(!b)return;

selectedFood=
getFood(b.dataset.foodId);

if(!selectedFood)return;

document.getElementById(
'selectedFoodName'
).textContent=
selectedFood.name;

document.getElementById(
'selectedFoodMacros'
).textContent=
`${fmt(selectedFood.calories)} kcal · ${fmt(selectedFood.protein,1)}P · ${fmt(selectedFood.carbs,1)}C · ${fmt(selectedFood.fat,1)}G / 100 g`;

document
.getElementById('foodAmount')
.classList
.remove('hidden');

document.getElementById(
'foodGrams'
).focus();
});

document.getElementById(
'confirmFood'
).onclick=
()=>{
if(!selectedFood)return;

const grams=
Number(
document.getElementById(
'foodGrams'
).value
);

if(
!Number.isFinite(grams) ||
grams<=0
){
alert(
'Introduce una cantidad válida.'
);
return;
}

const multiplier=
grams/100;

const item={
id:uid('food'),
foodId:selectedFood.id,
name:selectedFood.name,
brand:selectedFood.brand || '',
grams,
calories:selectedFood.calories*multiplier,
protein:selectedFood.protein*multiplier,
carbs:selectedFood.carbs*multiplier,
fat:selectedFood.fat*multiplier
};

if(!state.nutrition[currentNutritionDate]){
state.nutrition[currentNutritionDate]=[];
}

state.nutrition[currentNutritionDate].push(
item
);

save();

document
.getElementById('foodModal')
.close();

selectedFood=null;
};

document.getElementById(
'prevDay'
).onclick=
()=>{
const d=new Date(
currentNutritionDate+'T12:00:00'
);

d.setDate(d.getDate()-1);
currentNutritionDate=dateKey(d);
renderNutrition();
};

document.getElementById(
'nextDay'
).onclick=
()=>{
const d=new Date(
currentNutritionDate+'T12:00:00'
);

d.setDate(d.getDate()+1);
currentNutritionDate=dateKey(d);
renderNutrition();
};

document.getElementById(
'todayDay'
).onclick=
()=>{
currentNutritionDate=dateKey(
new Date()
);
renderNutrition();
};

function renderTraining(){
renderSession();
renderRoutines();
renderExercises();
renderHistory();
renderProgression();
}

function workoutVolume(w){
return (w.exercises||[]).reduce(
(total,e)=>
total+
(e.sets||[]).reduce(
(sum,s)=>
sum+
(s.done
? (Number(s.weight)||0)*
(Number(s.reps)||0)
: 0),
0
),
0
);
}

function renderSession(){
const active=state.activeWorkout;

document.getElementById(
'noSession'
).classList.toggle(
'hidden',
!!active
);

document.getElementById(
'activeSession'
).classList.toggle(
'hidden',
!active
);

if(!active){
if(workoutTimer){
clearInterval(workoutTimer);
workoutTimer=null;
}
return;
}

setText(
'sessionName',
active.name
);

updateSessionStats();

const list=
document.getElementById(
'sessionExercisesList'
);

list.innerHTML=
active.exercises.map(
(ex,ei)=>`
<div class="session-exercise">
<div class="session-exercise-head">
<div>
<h3>${esc(ex.name)}</h3>
<small>${esc(ex.muscle||'')}</small>
</div>
<button
class="remove-btn"
data-remove-session-exercise="${ei}"
>×</button>
</div>

<table class="set-table">
<thead>
<tr>
<th>#</th>
<th>KG</th>
<th>REPS</th>
<th>RIR</th>
<th>OK</th>
<th></th>
</tr>
</thead>
<tbody>
${ex.sets.map(
(s,si)=>`
<tr>
<td class="set-number">${si+1}</td>
<td><input class="set-input" type="number" step="0.5" data-set-field="weight" data-ei="${ei}" data-si="${si}" value="${s.weight??''}"></td>
<td><input class="set-input" type="number" min="0" step="1" data-set-field="reps" data-ei="${ei}" data-si="${si}" value="${s.reps??''}"></td>
<td><input class="set-input" type="number" min="0" max="5" step="1" data-set-field="rir" data-ei="${ei}" data-si="${si}" value="${s.rir??''}"></td>
<td><input class="set-check" type="checkbox" data-set-field="done" data-ei="${ei}" data-si="${si}" ${s.done?'checked':''}></td>
<td><button class="remove-btn" data-remove-set="${ei}:${si}">×</button></td>
</tr>
`
).join('')}
</tbody>
</table>

<button
class="add-set"
data-add-set="${ei}"
>+ Añadir serie</button>
</div>
`
)
.join('');

if(!workoutTimer){
workoutTimer=setInterval(
updateTimer,
1000
);
}

updateTimer();
}

function updateTimer(){
const active=state.activeWorkout;
if(!active)return;

const seconds=Math.max(
0,
Math.floor(
(Date.now()-active.startedAt)/1000
)
);

const min=String(
Math.floor(seconds/60)
).padStart(2,'0');

const sec=String(
seconds%60
).padStart(2,'0');

setText(
'sessionTimer',
`${min}:${sec}`
);
}

function updateSessionStats(){
const a=state.activeWorkout;

if(!a)return;

const sets=a.exercises.reduce(
(n,e)=>
n+e.sets.filter(
s=>s.done
).length,
0
);

const vol=workoutVolume(a);

const rirValues=
a.exercises.flatMap(
e=>
e.sets
.filter(
s=>
s.done &&
s.rir!=='' &&
s.rir!=null
)
.map(s=>Number(s.rir))
);

const avgRir=
rirValues.length
? rirValues.reduce((a,b)=>a+b,0)/
rirValues.length
: null;

setText(
'sessionSets',
sets
);

setText(
'sessionVolume',
fmt(vol)+' kg'
);

setText(
'sessionExercises',
a.exercises.length
);

setText(
'sessionRir',
avgRir==null
? '—'
: fmt(avgRir,1)
);
}

function startWorkout(name='Entrenamiento libre',routine=null){
state.activeWorkout={
id:uid('workout'),
name,
date:dateKey(new Date()),
startedAt:Date.now(),
note:'',
exercises:
routine
? routine.exercises.map(
id=>{
const e=getExercise(id);
return {
exerciseId:id,
name:e?.name || 'Ejercicio',
muscle:e?.muscle || '',
sets:[
{
weight:'',
reps:'',
rir:'',
done:false
}
]
};
}
)
: []
};

renderAll();

switchTrainingTab('session');
}

document.getElementById(
'quickWorkout'
).onclick=
()=>startWorkout();

document.getElementById(
'startFreeBtn'
).onclick=
()=>startWorkout();

document.getElementById(
'emptyStartBtn'
).onclick=
()=>startWorkout();

document.getElementById(
'emptyRoutineBtn'
).onclick=
()=>openRoutinePicker();

document.getElementById(
'sessionNoteBtn'
).onclick=
()=>{
if(!state.activeWorkout)return;

const note=prompt(
'Nota del entrenamiento:',
state.activeWorkout.note || ''
);

if(note!==null){
state.activeWorkout.note=note;
renderAll();
}
};

document.getElementById(
'finishWorkoutBtn'
).onclick=
()=>{
if(!state.activeWorkout)return;

if(
!confirm(
'¿Terminar y guardar esta sesión?'
)
)return;

state.workouts.unshift(
clone(state.activeWorkout)
);

state.activeWorkout=null;

if(workoutTimer){
clearInterval(workoutTimer);
workoutTimer=null;
}

save();

switchTrainingTab('history');
};

document.getElementById(
'addExerciseToSession'
).onclick=
()=>{
if(!state.activeWorkout)return;

const options=allExercises()
.map(
e=>`${e.id}|${e.name}`
)
.join('\n');

const chosen=prompt(
'Introduce el ID del ejercicio:\n\n'+
options
);

if(!chosen)return;

const e=getExercise(chosen.trim());

if(!e){
alert('No se encontró ese ejercicio.');
return;
}

state.activeWorkout.exercises.push({
exerciseId:e.id,
name:e.name,
muscle:e.muscle,
sets:[
{
weight:'',
reps:'',
rir:'',
done:false
}
]
});

renderAll();
};

document.addEventListener(
'input',
e=>{
const field=e.target.dataset.setField;

if(!field || !state.activeWorkout)return;

const ei=Number(e.target.dataset.ei);
const si=Number(e.target.dataset.si);
const set=
state.activeWorkout.exercises[ei]
?.sets[si];

if(!set)return;

set[field]=
field==='done'
? e.target.checked
: e.target.value;

updateSessionStats();
}
);

document.addEventListener(
'change',
e=>{
const field=e.target.dataset.setField;

if(!field || !state.activeWorkout)return;

const ei=Number(e.target.dataset.ei);
const si=Number(e.target.dataset.si);
const set=
state.activeWorkout.exercises[ei]
?.sets[si];

if(!set)return;

set[field]=
field==='done'
? e.target.checked
: e.target.value;

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(state)
);

updateSessionStats();
}
);

document.addEventListener(
'click',
e=>{
const add=e.target.closest(
'[data-add-set]'
);

if(add && state.activeWorkout){
const ei=Number(
add.dataset.addSet
);

state.activeWorkout.exercises[ei]
.sets.push({
weight:'',
reps:'',
rir:'',
done:false
});

renderSession();
return;
}

const removeSet=e.target.closest(
'[data-remove-set]'
);

if(removeSet && state.activeWorkout){
const [ei,si]=
removeSet.dataset.removeSet
.split(':')
.map(Number);

state.activeWorkout.exercises[ei]
.sets.splice(si,1);

if(
!state.activeWorkout.exercises[ei]
.sets.length
){
state.activeWorkout.exercises[ei]
.sets.push({
weight:'',
reps:'',
rir:'',
done:false
});
}

renderSession();
return;
}

const removeExercise=e.target.closest(
'[data-remove-session-exercise]'
);

if(removeExercise && state.activeWorkout){
state.activeWorkout.exercises.splice(
Number(
removeExercise.dataset
.removeSessionExercise
),
1
);

renderSession();
}
}
);

function renderRoutines(){
const q=
document.getElementById(
'routineSearch'
)?.value
.trim()
.toLowerCase() || '';

const routines=
state.routines.filter(
r=>
!q ||
`${r.name} ${r.description||''}`
.toLowerCase()
.includes(q)
);

document.getElementById(
'routineGrid'
).innerHTML=
routines.map(
r=>`
<article class="routine-card">
<p class="eyebrow">RUTINA</p>
<h3>${esc(r.name)}</h3>
<p>${esc(r.description||'Sin descripción')}</p>
<div>
${r.exercises.map(
id=>{
const e=getExercise(id);
return e
? `<span class="tag">${esc(e.name)}</span>`
: '';
}
).join('')}
</div>

<div class="card-actions">
<button
class="secondary-btn"
data-start-routine="${r.id}"
>Empezar</button>

<button
class="secondary-btn"
data-edit-routine="${r.id}"
>Editar</button>

<button
class="danger-btn"
data-delete-routine="${r.id}"
>Eliminar</button>
</div>
</article>
`
)
.join('')
||
emptyList('Todavía no has creado ninguna rutina.');
}

document.getElementById(
'routineSearch'
).addEventListener(
'input',
renderRoutines
);

function openRoutineModal(id=null){
editingRoutineId=id;

const r=id
? state.routines.find(
x=>x.id===id
)
: null;

document.getElementById(
'routineModalTitle'
).textContent=
r
? 'Editar rutina'
: 'Nueva rutina';

document.getElementById(
'routineId'
).value=
r?.id || '';

document.getElementById(
'routineName'
).value=
r?.name || '';

document.getElementById(
'routineDescription'
).value=
r?.description || '';

renderRoutineExercisePicker(
r?.exercises || []
);

document
.getElementById('routineModal')
.showModal();
}

function renderRoutineExercisePicker(selected=[]){
const box=document.getElementById(
'routineExercisePicker'
);

box.innerHTML=
allExercises().map(
e=>`
<label class="routine-pick">
<input
type="checkbox"
value="${e.id}"
${selected.includes(e.id)?'checked':''}
>
<span>
<b>${esc(e.name)}</b>
<small>${esc(e.muscle)}</small>
</span>
</label>
`
).join('');
}

document.getElementById(
'newRoutineBtn'
).onclick=
()=>openRoutineModal();

document.getElementById(
'newRoutineBtn2'
).onclick=
()=>openRoutineModal();

document.getElementById(
'saveRoutine'
).onclick=
()=>{
const name=
document.getElementById(
'routineName'
).value.trim();

if(!name){
alert('Introduce un nombre.');
return;
}

const description=
document.getElementById(
'routineDescription'
).value.trim();

const exercises=
[...document.querySelectorAll(
'#routineExercisePicker input:checked'
)].map(
x=>x.value
);

if(!exercises.length){
alert(
'Selecciona al menos un ejercicio.'
);
return;
}

if(editingRoutineId){
const r=state.routines.find(
x=>x.id===editingRoutineId
);

if(r){
r.name=name;
r.description=description;
r.exercises=exercises;
}
}else{
state.routines.push({
id:uid('routine'),
name,
description,
exercises
});
}

save();

document
.getElementById('routineModal')
.close();

editingRoutineId=null;
};

function openRoutinePicker(){
const box=document.getElementById(
'routinePickerList'
);

box.innerHTML=
state.routines.map(
r=>`
<label class="routine-pick">
<input
type="radio"
name="routinePick"
value="${r.id}"
>
<span>
<b>${esc(r.name)}</b>
<small>${r.exercises.length} ejercicios</small>
</span>
</label>
`
).join('')
||
emptyList(
'No tienes rutinas guardadas.'
);

document
.getElementById('routinePickerModal')
.showModal();
}

document.addEventListener(
'click',
e=>{
const start=e.target.closest(
'[data-start-routine]'
);

if(start){
const r=state.routines.find(
x=>x.id===start.dataset.startRoutine
);

if(r){
startWorkout(r.name,r);
}
}

const edit=e.target.closest(
'[data-edit-routine]'
);

if(edit){
openRoutineModal(
edit.dataset.editRoutine
);
}

const del=e.target.closest(
'[data-delete-routine]'
);

if(
del &&
confirm('¿Eliminar esta rutina?')
){
state.routines=
state.routines.filter(
r=>r.id!==del.dataset.deleteRoutine
);

save();
}
}
);

document
.getElementById('routinePickerModal')
.addEventListener(
'click',
e=>{
const input=
document.querySelector(
'#routinePickerList input:checked'
);

if(
e.target.closest(
'.routine-pick'
) &&
input
){
const r=state.routines.find(
x=>x.id===input.value
);

if(r){
document
.getElementById(
'routinePickerModal'
)
.close();

startWorkout(r.name,r);
}
}
}
);

function renderExercises(){
const q=
document.getElementById(
'exerciseSearch'
)?.value
.trim()
.toLowerCase() || '';

const arr=
allExercises().filter(
e=>
!q ||
`${e.name} ${e.muscle} ${e.equipment}`
.toLowerCase()
.includes(q)
);

document.getElementById(
'exerciseGrid'
).innerHTML=
arr.map(
e=>`
<article class="exercise-card">
<p class="eyebrow">${esc(e.muscle)}</p>
<h3>${esc(e.name)}</h3>
<p>${esc(e.equipment)} · ${esc(e.type)}</p>
${e.custom?'<span class="tag">Personalizado</span>':''}
</article>
`
).join('')
||
emptyList(
'No se encontraron ejercicios.'
);
}

document.getElementById(
'exerciseSearch'
).addEventListener(
'input',
renderExercises
);

document.getElementById(
'newExerciseBtn'
).onclick=
()=>{
document
.getElementById('exerciseModal')
.showModal();
};

document.getElementById(
'saveExercise'
).onclick=
()=>{
const name=
document.getElementById(
'exerciseName'
).value.trim();

const muscle=
document.getElementById(
'exerciseMuscle'
).value.trim();

const equipment=
document.getElementById(
'exerciseEquipment'
).value.trim();

const type=
document.getElementById(
'exerciseType'
).value;

if(!name||!muscle){
alert(
'Completa el nombre y el músculo.'
);
return;
}

state.customExercises.push({
id:uid('customexercise'),
name,
muscle,
equipment,
type,
unilateralMode:'same',
custom:true
});

save();

document
.getElementById('exerciseModal')
.close();

document.getElementById(
'exerciseName'
).value='';

document.getElementById(
'exerciseMuscle'
).value='';

document.getElementById(
'exerciseEquipment'
).value='';
};

function renderHistory(){
const q=
document.getElementById(
'historySearch'
)?.value
.trim()
.toLowerCase() || '';

const arr=
state.workouts.filter(
w=>
!q ||
`${w.name} ${w.note||''}`
.toLowerCase()
.includes(q)
);

setText(
'historyCount',
`${arr.length} sesiones`
);

document.getElementById(
'workoutHistory'
).innerHTML=
arr.map(
(w,i)=>`
<article
class="history-item"
data-history-index="${i}"
>
<div class="history-main">
<div>
<h3>${esc(w.name)}</h3>
<p>${fmtDate(w.date)} · ${w.exercises.length} ejercicios · ${fmt(workoutVolume(w))} kg</p>
</div>
<button class="secondary-btn" data-toggle-history="${i}">Ver</button>
</div>

<div class="history-details">
${w.exercises.map(
e=>`
<div class="list-row">
<div>
<b>${esc(e.name)}</b>
<small>
${e.sets.filter(s=>s.done).length} series
</small>
</div>
<b>
${fmt(
e.sets.reduce(
(a,s)=>
a+
(s.done
? (Number(s.weight)||0)*
(Number(s.reps)||0)
: 0),
0
)
)} kg
</b>
</div>
`
).join('')}
</div>
</article>
`
)
.join('')
||
emptyList(
'Todavía no hay entrenamientos guardados.'
);
}

document.getElementById(
'historySearch'
).addEventListener(
'input',
renderHistory
);

document.addEventListener(
'click',
e=>{
const h=e.target.closest(
'[data-toggle-history]'
);

if(h){
h.closest(
'.history-item'
).classList.toggle('open');
}
}
);

function renderProgression(){
const select=
document.getElementById(
'progressExerciseSelect'
);

if(!select)return;

const current=select.value;

select.innerHTML=
allExercises()
.map(
e=>
`<option value="${e.id}">${esc(e.name)}</option>`
)
.join('');

if(current){
select.value=current;
}

const id=select.value;
const ex=getExercise(id);

if(!ex){
document.getElementById(
'progressionContent'
).innerHTML='';

return;
}

const rows=[];

state.workouts.forEach(
w=>{
const x=w.exercises.find(
a=>a.exerciseId===id
);

if(x){
const done=x.sets.filter(
s=>s.done
);

if(done.length){
rows.push({
date:w.date,
volume:done.reduce(
(a,s)=>
a+
(Number(s.weight)||0)*
(Number(s.reps)||0),
0
),
top:Math.max(
...done.map(
s=>Number(s.weight)||0
)
),
reps:Math.max(
...done.map(
s=>Number(s.reps)||0
)
)
});
}
}
}
);

const best=rows.length
? Math.max(...rows.map(x=>x.top))
: 0;

const maxVol=rows.length
? Math.max(...rows.map(x=>x.volume))
: 0;

document.getElementById(
'progressionContent'
).innerHTML=`
<div class="progression-summary">
<div class="prog-stat">
<span>Mejor carga registrada</span>
<b>${fmt(best)} kg</b>
</div>

<div class="prog-stat">
<span>Mayor volumen</span>
<b>${fmt(maxVol)} kg</b>
</div>

<div class="prog-stat">
<span>Sesiones</span>
<b>${rows.length}</b>
</div>

<div class="prog-stat">
<span>Última carga</span>
<b>${rows.length?fmt(rows[rows.length-1].top):'—'} kg</b>
</div>
</div>

<div class="panel">
<div class="panel-head">
<div>
<p class="eyebrow">${esc(ex.muscle)}</p>
<h3>${esc(ex.name)}</h3>
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
.slice(0,10)
.map(
r=>`
<div class="list-row">
<span>${fmtDate(r.date)}</span>
<b>${fmt(r.top)} kg · ${fmt(r.reps)} reps · ${fmt(r.volume)} kg vol.</b>
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

function progressSvg(rows){
if(!rows.length){
return `
<div class="empty-state">
<p>Completa algunas sesiones para ver la progresión.</p>
</div>
`;
}

const vals=rows.map(x=>x.top);
const max=Math.max(...vals);
const min=Math.min(...vals);
const range=max-min||1;

const pts=
vals
.map(
(v,i)=>
`${(i/(vals.length-1||1))*100},${90-((v-min)/range)*70}`
)
.join(' ');

return `
<svg
viewBox="0 0 100 100"
preserveAspectRatio="none"
style="width:100%;height:100%"
>
<line
x1="0"
y1="90"
x2="100"
y2="90"
stroke="#2a323d"
/>

<polyline
points="${pts}"
fill="none"
stroke="var(--accent)"
stroke-width="2"
vector-effect="non-scaling-stroke"
/>

${
vals.map(
(v,i)=>`
<circle
cx="${(i/(vals.length-1||1))*100}"
cy="${90-((v-min)/range)*70}"
r="2"
fill="var(--accent)"
/>
`
).join('')
}
</svg>
`;
}

document.getElementById(
'progressExerciseSelect'
).onchange=
renderProgression;

function renderProgress(){
const p=
state.progress
.slice()
.sort(
(a,b)=>a.date.localeCompare(b.date)
);

const cur=
p[p.length-1]?.weight;

setText(
'currentWeight',
cur!=null?fmt(cur,1):'—'
);

setText(
'startWeight',
p[0]?.weight!=null
?fmt(p[0].weight,1)
:'—'
);

setText(
'targetWeightDisplay',
state.targetWeight!=null
?fmt(state.targetWeight,1)
:'—'
);

setText(
'weightEntries',
p.length
);

const range=Number(
document.getElementById(
'progressRange'
).value || 30
);

const arr=
p.filter(
x=>
(
Date.now()-
new Date(
x.date+'T12:00:00'
).getTime()
) <= range*86400000
);

drawWeightChart(arr);

document.getElementById(
'weightHistory'
).innerHTML=
p
.slice()
.reverse()
.slice(0,10)
.map(
(x,i)=>`
<div class="list-row">
<div>
<b>${fmt(x.weight,1)} kg</b>
<small>${fmtDate(x.date)}</small>
</div>
<button
class="remove-btn"
data-remove-progress="${p.length-1-i}"
>×</button>
</div>
`
)
.join('')
||
emptyList(
'No hay registros todavía.'
);
}

function drawWeightChart(arr){
const svg=document.getElementById(
'weightChart'
);

if(!arr.length){
svg.innerHTML=
'<text x="50%" y="50%" text-anchor="middle" fill="#8e99a8">Registra tu primer peso para ver la gráfica</text>';

return;
}

const vals=arr.map(
x=>x.weight
);

const min=Math.min(...vals)-1;
const max=Math.max(...vals)+1;

let d='';

vals.forEach(
(v,i)=>{
const x=
30+
i*
(740/Math.max(
1,
vals.length-1
));

const y=
270-
(v-min)/(max-min)*230;

d+=
(i?'L':'M')+
x+
' '+
y+
' ';
}
);

svg.innerHTML=`
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
d="${d}"
/>

${
vals.map(
(v,i)=>{
const x=
30+
i*
(740/Math.max(
1,
vals.length-1
));

const y=
270-
(v-min)/(max-min)*230;

return `
<circle
class="chart-dot"
cx="${x}"
cy="${y}"
r="5"
/>
`;
}
).join('')
}
`;
}

document.getElementById(
'progressRange'
).onchange=
renderProgress;

document.getElementById(
'addProgressBtn'
).onclick=
()=>{
const weight=prompt(
'Peso actual (kg):'
);

if(weight===null)return;

const n=Number(weight);

if(
!Number.isFinite(n) ||
n<=0
){
alert(
'Introduce un peso válido.'
);
return;
}

const note=
prompt(
'Nota opcional:'
) || '';

state.progress.push({
id:uid('weight'),
date:dateKey(new Date()),
weight:n,
note
});

save();
renderProgress();
};

document.addEventListener(
'click',
e=>{
const r=e.target.closest(
'[data-remove-progress]'
);

if(
r &&
confirm(
'¿Eliminar este registro?'
)
){
const arr=
state.progress
.slice()
.sort(
(a,b)=>
a.date.localeCompare(b.date)
);

const item=
arr[
+r.dataset.removeProgress
];

state.progress=
state.progress.filter(
x=>x.id!==item.id
);

save();
renderProgress();
}
}
);

function calculateMaintenance(){
const sex=
document.getElementById(
'mSex'
).value;

const age=
Number(
document.getElementById(
'mAge'
).value
);

const weight=
Number(
document.getElementById(
'mWeight'
).value
);

const height=
Number(
document.getElementById(
'mHeight'
).value
);

const activity=
Number(
document.getElementById(
'mActivity'
).value
);

const adj=
Number(
document.getElementById(
'mAdjustment'
).value
) || 0;

let bmr=
10*weight+
6.25*height-
5*age+
(sex==='male'?5:-161);

let maint=
Math.round(
bmr*activity
);

const goal=
document.getElementById(
'mGoal'
).value;

if(
goal==='cut' &&
adj===0
){
maint-=300;
}

if(
goal==='gain' &&
adj===0
){
maint+=200;
}

maint+=adj;

const protein=
Math.round(
weight*1.8
);

const fat=
Math.round(
weight*.8
);

const carbs=
Math.max(
0,
Math.round(
(
maint-
protein*4-
fat*9
)/4
)
);

state.maintenance={
sex,
age,
weight,
height,
activity,
goal,
adjustment:adj,
bmr,
maintenance:maint
};

state.goals={
calories:maint,
protein,
carbs,
fat
};

save();
renderMaintenance();
}

function renderMaintenance(){
const m=state.maintenance;
const g=state.goals;

document.getElementById(
'mSex'
).value=
m.sex || 'male';

document.getElementById(
'mAge'
).value=
m.age || 18;

document.getElementById(
'mWeight'
).value=
m.weight || 71;

document.getElementById(
'mHeight'
).value=
m.height || 176;

document.getElementById(
'mActivity'
).value=
m.activity || 1.55;

document.getElementById(
'mGoal'
).value=
m.goal || 'cut';

document.getElementById(
'mAdjustment'
).value=
m.adjustment ?? 0;

setText(
'maintenanceResult',
fmt(m.maintenance || g.calories)
);

setText(
'goalProteinResult',
fmt(g.protein)+' g'
);

setText(
'goalCarbsResult',
fmt(g.carbs)+' g'
);

setText(
'goalFatResult',
fmt(g.fat)+' g'
);

document.getElementById(
'goalCalInput'
).value=g.calories;

document.getElementById(
'goalProteinInput'
).value=g.protein;

document.getElementById(
'goalCarbsInput'
).value=g.carbs;

document.getElementById(
'goalFatInput'
).value=g.fat;
}

document.getElementById(
'maintenanceForm'
).onsubmit=
e=>{
e.preventDefault();
calculateMaintenance();
};

document.getElementById(
'saveManualGoals'
).onclick=
()=>{
state.goals={
calories:Number(
document.getElementById(
'goalCalInput'
).value
) || 2300,

protein:Number(
document.getElementById(
'goalProteinInput'
).value
) || 130,

carbs:Number(
document.getElementById(
'goalCarbsInput'
).value
) || 260,

fat:Number(
document.getElementById(
'goalFatInput'
).value
) || 70
};

save();
renderMaintenance();
};

function assistantAnswer(q){
const l=q.toLowerCase();
const t=
totalsForDate(
dateKey(new Date())
);

if(
l.includes('calor') ||
l.includes('kcal')
){
return `Hoy llevas ${fmt(t.calories)} kcal de un objetivo de ${fmt(state.goals.calories)} kcal.`;
}

if(l.includes('prote')){
return `Hoy llevas ${fmt(t.protein,1)} g de proteína. Tu objetivo guardado es ${fmt(state.goals.protein)} g.`;
}

if(
l.includes('sesion') ||
l.includes('entren')
){
return `Has registrado ${state.workouts.filter(w=>withinDays(w.date,7)).length} sesiones en los últimos 7 días.`;
}

if(l.includes('volumen')){
const arr=
state.workouts.flatMap(
w=>
w.exercises.map(
e=>({
name:e.name,
v:(e.sets||[]).reduce(
(a,s)=>
a+
(Number(s.weight)||0)*
(Number(s.reps)||0),
0
)
})
)
);

arr.sort(
(a,b)=>b.v-a.v
);

return arr[0]
? `El mayor volumen registrado recientemente es de ${fmt(arr[0].v)} kg en ${arr[0].name}.`
: 'Todavía no hay suficiente historial.';
}

return 'Puedo consultar tus calorías, macros de hoy, sesiones recientes y progresión guardada. Prueba con “¿cuánta proteína llevo hoy?”';
}

function sendAssistant(q){
if(!q.trim())return;

const box=
document.getElementById(
'assistantMessages'
);

box.insertAdjacentHTML(
'beforeend',
`
<div class="msg user">
<small>Tú</small>
${esc(q)}
</div>
`
);

box.insertAdjacentHTML(
'beforeend',
`
<div class="msg">
<small>Nutri</small>
${esc(assistantAnswer(q))}
</div>
`
);

box.scrollTop=
box.scrollHeight;
}

document.getElementById(
'assistantSend'
).onclick=
()=>{
const i=
document.getElementById(
'assistantInput'
);

sendAssistant(i.value);
i.value='';
};

document.getElementById(
'assistantInput'
).onkeydown=
e=>{
if(e.key==='Enter'){
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
b=>
b.onclick=
()=>sendAssistant(
b.dataset.question
)
);

function switchTrainingTab(tab){
document
.querySelectorAll(
'.training-tab'
)
.forEach(
b=>
b.classList.toggle(
'active',
b.dataset.trainingTab===tab
)
);

document
.querySelectorAll(
'.training-pane'
)
.forEach(
p=>
p.classList.toggle(
'active',
p.id==='training-'+tab
)
);

if(tab==='progression'){
renderProgression();
}
}

document
.querySelectorAll(
'.training-tab'
)
.forEach(
b=>
b.onclick=
()=>switchTrainingTab(
b.dataset.trainingTab
)
);

document.getElementById(
'exportData'
).onclick=
()=>{
const blob=new Blob(
[
JSON.stringify(
state,
null,
2
)
],
{
type:'application/json'
}
);

const a=
document.createElement('a');

a.href=
URL.createObjectURL(blob);

a.download=
`nutri-backup-${dateKey(new Date())}.json`;

a.click();

URL.revokeObjectURL(
a.href
);
};

document.getElementById(
'importData'
).onchange=
e=>{
const file=
e.target.files[0];

if(!file)return;

const reader=
new FileReader();

reader.onload=
()=>{
try{
state=
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
}catch(err){
alert(
'El archivo no es un backup válido de Nutri.'
);
}
};

reader.readAsText(file);
};

document.getElementById(
'resetData'
).onclick=
()=>{
if(
confirm(
'Esto borrará todos los datos guardados en este dispositivo. ¿Continuar?'
)
){
state=clone(
initialState
);

localStorage.removeItem(
STORAGE_KEY
);

renderAll();
navigate('dashboard');
}
};

function renderAll(){
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

renderAll();
