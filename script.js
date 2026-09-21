/* Nutri — aplicación local. foods.js se mantiene separado e intacto. */
const FOOD_DATABASE = typeof foods !== 'undefined' ? foods : (window.foods || []);
const STORAGE_KEY = 'nutri_app_v4';

const defaultExercises = [
['Press banca máquina','Pecho','Máquina','bilateral','same'],['Press inclinado con mancuernas','Pecho','Mancuernas','bilateral','same'],['Aperturas en polea','Pecho','Polea','bilateral','same'],['Pec deck','Pecho','Máquina','bilateral','same'],
['Jalón al pecho agarre ancho','Espalda','Polea','bilateral','same'],['Remo T-bar','Espalda','Máquina','bilateral','same'],['Remo unilateral en polea','Espalda','Polea','unilateral','same'],['Pullover en polea','Espalda','Polea','bilateral','same'],
['Press hombros máquina','Hombros','Máquina','bilateral','same'],['Elevación lateral','Hombros','Mancuernas','bilateral','same'],['Elevación lateral unilateral en polea','Hombros','Polea','unilateral','same'],['Pájaros en máquina','Hombros','Máquina','bilateral','same'],
['Curl bíceps detrás del torso','Bíceps','Polea','unilateral','same'],['Curl predicador','Bíceps','Máquina','bilateral','same'],['Curl martillo','Bíceps','Mancuernas','unilateral','same'],
['Extensión de tríceps en polea','Tríceps','Polea','bilateral','same'],['Extensión de tríceps unilateral','Tríceps','Polea','unilateral','same'],['Press cerrado','Tríceps','Máquina','bilateral','same'],
['Extensión de cuádriceps','Pierna','Máquina','bilateral','same'],['Curl femoral','Pierna','Máquina','bilateral','same'],['Prensa','Pierna','Máquina','bilateral','same'],['Elevación de gemelo de pie','Pierna','Máquina','bilateral','same'],
['Hip thrust','Glúteos','Máquina','bilateral','same'],['Abducción de cadera','Glúteos','Máquina','bilateral','same'],['Crunch en polea','Abdomen','Polea','bilateral','same'],['Elevación de piernas','Abdomen','Peso corporal','bilateral','same'],['Curl de muñeca','Antebrazo','Mancuernas','bilateral','same']
].map((x,i)=>({id:'def-'+(i+1),name:x[0],muscle:x[1],equipment:x[2],type:x[3],unilateralMode:x[4],custom:false}));

const initialState = {goals:{calories:2300,protein:130,carbs:260,fat:70},maintenance:{sex:'male',age:18,weight:71,height:176,activity:1.55,goal:'cut',adjustment:-400},nutrition:{},progress:[],targetWeight:null,customFoods:[],customExercises:[],routines:[],workouts:[],activeWorkout:null,settings:{}};

let state = loadState();
let selectedFood = null;
let selectedRoutineId = null;
let editingRoutineId = null;
let currentNutritionDate = dateKey(new Date());
let workoutTimer = null;

function clone(v){return JSON.parse(JSON.stringify(v));}

function loadState(){
try{
const raw=localStorage.getItem(STORAGE_KEY);
return raw?merge(initialState,JSON.parse(raw)):clone(initialState)
}catch(e){
return clone(initialState)
}
}

function merge(a,b){
const out=clone(a);
for(const k in b){
if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&typeof out[k]==='object')
out[k]=merge(out[k],b[k]);
else
out[k]=b[k]
}
return out
}

function save(){
localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
renderAll()
}

function uid(prefix='id'){
return prefix+'_'+Math.random().toString(36).slice(2,9)+'_'+Date.now().toString(36)
}

function dateKey(d){
return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)
}

function fmtDate(key,opts={day:'numeric',month:'short',year:'numeric'}){
return new Date(key+'T12:00:00').toLocaleDateString('es-ES',opts)
}

function esc(s){
return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))
}

function allExercises(){
return [...defaultExercises,...state.customExercises]
}

/* NUEVO: alimentos originales + alimentos creados por el usuario */
function allFoods(){
return [...FOOD_DATABASE,...(state.customFoods||[])]
}

function getFood(id){
return allFoods().find(f=>String(f.id)===String(id))
}

function getExercise(id){
return allExercises().find(e=>e.id===id)
}

function pct(v,g){
return g?Math.min(100,Math.max(0,v/g*100)):0
}

function kcalFromMacros(p,c,f){
return p*4+c*4+f*9
}

function todayLog(){
return state.nutrition[currentNutritionDate]||[]
}

function totalsForDate(key){
return (state.nutrition[key]||[]).reduce((a,x)=>{
a.calories+=x.calories;
a.protein+=x.protein;
a.carbs+=x.carbs;
a.fat+=x.fat;
return a
},{calories:0,protein:0,carbs:0,fat:0})
}

function fmt(n,d=0){
return Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:d})
}

function navigate(view){
document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));
document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
window.scrollTo({top:0,behavior:'smooth'});
if(view==='nutrition')renderNutrition();
if(view==='training')renderTraining();
if(view==='progress')renderProgress();
if(view==='maintenance')renderMaintenance()
}

document.addEventListener('click',e=>{
const v=e.target.closest('[data-view]');
if(v){
navigate(v.dataset.view);
return
}

if(e.target.id==='settingsBtn')
navigate('settings');
});


function renderDashboard(){
const t=totalsForDate(dateKey(new Date())),g=state.goals;

document.getElementById('todayLabel').textContent=
fmtDate(dateKey(new Date()),{weekday:'long',day:'numeric',month:'long'});

setText('dashCalories',fmt(t.calories));
setText('dashCalGoal',fmt(g.calories));
setText('dashProtein',fmt(t.protein));
setText('dashCarbs',fmt(t.carbs));
setText('dashFat',fmt(t.fat));

setBar('dashProteinBar',t.protein,g.protein);
setBar('dashCarbsBar',t.carbs,g.carbs);
setBar('dashFatBar',t.fat,g.fat);

document.getElementById('calorieDonut').style.background=
`conic-gradient(var(--accent) ${Math.min(360,t.calories/Math.max(1,g.calories)*360)}deg,#2b323d 0deg)`;

const sessions=state.workouts.filter(w=>withinDays(w.date,7));
const sets=sessions.reduce((a,w)=>a+w.exercises.reduce((b,x)=>b+x.sets.filter(s=>s.done).length,0),0);
const vol=sessions.reduce((a,w)=>a+workoutVolume(w),0);

setText('dashSessions',sessions.length);
setText('dashSets',sets);
setText('dashVolume',fmt(vol));

const last=state.workouts[0];

setText('dashWorkoutTitle',last?last.name:'Ningún entrenamiento hoy');
setText('dashWorkoutText',last?`${fmtDate(last.date)} · ${last.exercises.length} ejercicios`:'Crea una rutina o empieza un entrenamiento libre.');

const rw=document.getElementById('dashRecentWorkouts');

rw.innerHTML=
sessions.slice(0,4).map(w=>`
<div class="list-row">
<div>
<b>${esc(w.name)}</b>
<small>${fmtDate(w.date)} · ${w.exercises.length} ejercicios</small>
</div>
<b>${fmt(workoutVolume(w))} kg</b>
</div>
`).join('')||
emptyList('Todavía no hay sesiones.');

const ml=document.getElementById('dashMeals');

ml.innerHTML=
todayLog().slice(-4).reverse().map(x=>`
<div class="list-row">
<div>
<b>${esc(x.name)}</b>
<small>${fmt(x.grams,1)} g</small>
</div>
<b>${fmt(x.calories)} kcal</b>
</div>
`).join('')||
emptyList('No hay alimentos registrados hoy.');
}

function emptyList(t){
return `<div class="list-row"><span>${t}</span></div>`
}

function setText(id,v){
const e=document.getElementById(id);
if(e)e.textContent=v
}

function setBar(id,v,g){
const e=document.getElementById(id);
if(e)e.style.width=pct(v,g)+'%'
}

function withinDays(date,n){
return (Date.now()-new Date(date+'T23:59:59').getTime())<=n*86400000
}


/* =========================================================
NUTRICIÓN
========================================================= */

function renderNutrition(){

renderCustomFoods();

const t=totalsForDate(currentNutritionDate),g=state.goals;

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
setText('nutCalRemaining',`${fmt(Math.max(0,g.calories-t.calories))} kcal restantes`);

setBar('nutCalBar',t.calories,g.calories);

setText('nutProtein',fmt(t.protein)+' g');
setText('nutCarbs',fmt(t.carbs)+' g');
setText('nutFat',fmt(t.fat)+' g');

setText('foodCount',todayLog().length);
setText('customFoodCount',(state.customFoods||[]).length);

setText('sideProtein',`${fmt(t.protein)} / ${fmt(g.protein)} g`);
setText('sideCarbs',`${fmt(t.carbs)} / ${fmt(g.carbs)} g`);
setText('sideFat',`${fmt(t.fat)} / ${fmt(g.fat)} g`);

setBar('sideProteinBar',t.protein,g.protein);
setBar('sideCarbsBar',t.carbs,g.carbs);
setBar('sideFatBar',t.fat,g.fat);

document.getElementById('foodLog').innerHTML=
todayLog().map((x,i)=>`
<div class="food-row">

<div>
<strong>${esc(x.name)}</strong>
<small>${x.brand?esc(x.brand)+' · ':''}${fmt(x.grams,1)} g</small>
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
>
×
</button>

</div>
`).join('')||
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
renderNutrition()
}
});


/* =========================================================
MIS ALIMENTOS
========================================================= */

function renderCustomFoods(){

const box=document.getElementById('customFoodList');

if(!box)return;

const foods=state.customFoods||[];

box.innerHTML=
foods.map(f=>`
<div class="food-row custom-food-row">

<div>

<strong>
${esc(f.name)}
</strong>

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
data-edit-custom-food="${esc(f.id)}"
>
Editar
</button>

<button
class="remove-btn"
data-delete-custom-food="${esc(f.id)}"
>
×
</button>

</div>

</div>
`).join('')||
`
<div class="empty-state">
<h3>Aún no tienes alimentos propios</h3>
<p>
Guarda un alimento de tu casa y aparecerá siempre en el buscador.
</p>
</div>
`;
}


function openCustomFoodModal(id=null){

const f=
id
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
f?.id||'';

document.getElementById(
'customFoodName'
).value=
f?.name||'';

document.getElementById(
'customFoodBrand'
).value=
f?.brand||'';

document.getElementById(
'customFoodCalories'
).value=
f?.calories??'';

document.getElementById(
'customFoodProtein'
).value=
f?.protein??'';

document.getElementById(
'customFoodCarbs'
).value=
f?.carbs??'';

document.getElementById(
'customFoodFat'
).value=
f?.fat??'';

document.getElementById(
'customFoodModal'
).showModal();
}


function saveCustomFood(){

const name=
document.getElementById(
'customFoodName'
).value.trim();

const brand=
document.getElementById(
'customFoodBrand'
).value.trim();

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
!name||
![
calories,
protein,
carbs,
fat
].every(Number.isFinite)||
calories<0||
protein<0||
carbs<0||
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

const f=
state.customFoods.find(
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
fat,
custom:true
}
);

}

}else{

state.customFoods.push({

id:
uid('customfood'),

name,

brand,

category:
'Mis alimentos',

calories,

protein,

carbs,

fat,

custom:true,

createdAt:
new Date().toISOString()

});

}

save();

document.getElementById(
'customFoodModal'
).close();

renderCustomFoods();
}


/* IMPORTANTE:
Solo existe openCustomFood en tu HTML.
NO se referencia ningún openCustomFood2.
*/

document.getElementById(
'openCustomFood'
).onclick=
()=>openCustomFoodModal();


document.getElementById(
'saveCustomFood'
).onclick=
saveCustomFood;


document.addEventListener('click',e=>{

const edit=
e.target.closest(
'[data-edit-custom-food]'
);

if(edit){

openCustomFoodModal(
edit.dataset
.editCustomFood
);

return;
}

const del=
e.target.closest(
'[data-delete-custom-food]'
);

if(
del&&
confirm(
'¿Eliminar este alimento de Mis alimentos?'
)
){

state.customFoods=
state.customFoods.filter(
f=>
String(f.id)!==
String(
del.dataset
.deleteCustomFood
)
);

save();

renderCustomFoods();

renderFoodResults(
document.getElementById(
'foodSearch'
)?.value||''
);

}

});


/* =========================================================
BUSCADOR DE ALIMENTOS
========================================================= */

function openFoodModal(){

const m=
document.getElementById(
'foodModal'
);

selectedFood=null;

document.getElementById(
'foodAmount'
).classList.add(
'hidden'
);

document.getElementById(
'foodSearch'
).value='';

renderFoodResults('');

m.showModal();

setTimeout(
()=>
document.getElementById(
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
e=>
renderFoodResults(
e.target.value
)
);


function renderFoodResults(q){

const term=
q.trim().toLowerCase();

const arr=
allFoods()
.filter(
f=>
!term||
`${f.name} ${f.brand||''} ${f.category||''}`
.toLowerCase()
.includes(term)
)
.slice(0,80);

document.getElementById(
'foodResults'
).innerHTML=
arr.map(f=>`
<button
type="button"
class="food-result"
data-food-id="${esc(f.id)}"
>

<span>

<b>
${esc(f.name)}
</b>

<small>
${esc(f.category||'')}
${f.brand?'· '+esc(f.brand):''}
</small>

</span>

<strong>
${fmt(f.calories)} kcal
</strong>

</button>
`).join('')||
`
<div class="empty-state">
<p>No se encontraron alimentos.</p>
</div>
`;
}


document.addEventListener('click',e=>{

const b=
e.target.closest(
'[data-food-id]'
);

if(!b)return;

selectedFood=
getFood(
b.dataset.foodId
);

if(!selectedFood)return;

document.getElementById(
'selectedFoodName'
).textContent=
selectedFood.name;

document.getElementById(
'selectedFoodMacros'
).textContent=
`${fmt(selectedFood.calories)} kcal · ${fmt(selectedFood.protein,1)}P · ${fmt(selectedFood.carbs,1)}C · ${fmt(selectedFood.fat,1)}G / 100 g`;

document.getElementById(
'foodAmount'
).classList.remove(
'hidden'
);

document.getElementById(
'foodGrams'
).focus();

});


document.getElementById(
'confirmFood'
).onclick=()=>{

if(!selectedFood)return;

const grams=
Number(
document.getElementById(
'foodGrams'
).value
)||0;

if(grams<=0)return;

const k=
grams/100;

const item={

id:
uid('food'),

foodId:
selectedFood.id,

name:
selectedFood.name,

brand:
selectedFood.brand||'',

grams,

calories:
selectedFood.calories*k,

protein:
selectedFood.protein*k,

carbs:
selectedFood.carbs*k,

fat:
selectedFood.fat*k

};

state.nutrition[
currentNutritionDate
]??=[];

state.nutrition[
currentNutritionDate
].push(item);

save();

renderNutrition();

document.getElementById(
'foodModal'
).close();

selectedFood=null;
};


document.getElementById(
'prevDay'
).onclick=()=>{

const d=
new Date(
currentNutritionDate+
'T12:00:00'
);

d.setDate(
d.getDate()-1
);

currentNutritionDate=
dateKey(d);

renderNutrition();
};


document.getElementById(
'nextDay'
).onclick=()=>{

const d=
new Date(
currentNutritionDate+
'T12:00:00'
);

d.setDate(
d.getDate()+1
);

currentNutritionDate=
dateKey(d);

renderNutrition();
};


document.getElementById(
'todayDay'
).onclick=()=>{

currentNutritionDate=
dateKey(new Date());

renderNutrition();
};


/* =========================================================
ENTRENAMIENTO
========================================================= */

function startWorkout(
name='Entrenamiento libre',
routine=null
){

if(state.activeWorkout){

if(
!confirm(
'Ya tienes una sesión en curso. ¿Reemplazarla?'
)
)
return;
}

const exercises=
(
routine?.exercises||
[]
)
.map(id=>{

const exercise=
getExercise(id);

return exercise
? exerciseForSession(
exercise
)
: null;

})
.filter(Boolean);

state.activeWorkout={

id:
uid('session'),

name,

routineId:
routine?.id||null,

startedAt:
new Date().toISOString(),

notes:'',

exercises

};

save();

renderTraining();
}


function exerciseForSession(exercise){

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
exercise.unilateralMode||
'same',

sets:[
blankSet(exercise)
]

};

}


function blankSet(){

return {

id:
uid('set'),

weight:'',

reps:'',

rir:'',

done:false,

leftWeight:'',

leftReps:'',

rightWeight:'',

rightReps:''

};

}


function workoutVolume(workout){

return(
workout.exercises||[]
).reduce(
(sum,exercise)=>
sum+
(
exercise.sets||[]
).reduce(
(setsTotal,set)=>{

if(!set.done)
return setsTotal;

if(
exercise.type===
'unilateral'&&
exercise.unilateralMode===
'separate'
){

return(
setsTotal+
(Number(set.leftWeight)||0)*
(Number(set.leftReps)||0)+
(Number(set.rightWeight)||0)*
(Number(set.rightReps)||0)
);

}

return(
setsTotal+
(Number(set.weight)||0)*
(Number(set.reps)||0)*
(
exercise.type===
'unilateral'
?2
:1
)
);

},
0
),
0
);

}


function sessionVolume(){

return state.activeWorkout
? workoutVolume(
state.activeWorkout
)
:0;

}


function renderTraining(){

renderSession();
renderRoutines();
renderExercises();
renderHistory();
renderProgression();

}


function renderSession(){

const s=
state.activeWorkout;

document.getElementById(
'noSession'
).classList.toggle(
'hidden',
!!s
);

document.getElementById(
'activeSession'
).classList.toggle(
'hidden',
!s
);

if(!s)return;

setText(
'sessionName',
s.name
);

setText(
'sessionSets',
s.exercises.reduce(
(a,e)=>
a+
e.sets.filter(
x=>x.done
).length,
0
)
);

setText(
'sessionVolume',
fmt(sessionVolume())+
' kg'
);

setText(
'sessionExercises',
s.exercises.length
);

const rs=
s.exercises.flatMap(
e=>
e.sets
.map(
x=>Number(x.rir)
)
.filter(
x=>Number.isFinite(x)
)
);

setText(
'sessionRir',
rs.length
?fmt(
rs.reduce(
(a,b)=>a+b,
0
)/rs.length,
1
)
:'—'
);

document.getElementById(
'sessionExercisesList'
).innerHTML=
s.exercises
.map(
(e,ei)=>
renderSessionExercise(
e,
ei
)
)
.join('');

clearInterval(
workoutTimer
);

workoutTimer=
setInterval(
()=>{
const sec=
Math.max(
0,
Math.floor(
(
Date.now()-
new Date(
s.startedAt
).getTime()
)/1000
)
);

setText(
'sessionTimer',
formatDuration(sec)
);

},
1000
);
}


function formatDuration(sec){

return(
String(
Math.floor(
sec/3600
)
).padStart(2,'0')+
':'+
String(
Math.floor(
sec%3600/60
)
).padStart(2,'0')+
':'+
String(
sec%60
).padStart(2,'0')
);

}


function renderSessionExercise(e,ei){

const rows=
e.sets.map(
(s,si)=>{

if(
e.type===
'unilateral'&&
e.unilateralMode===
'separate'
){

return `
<tr>
<td class="set-number">
${si+1}
</td>

<td>
<input
class="set-input"
data-set-field="leftWeight"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.leftWeight)}"
placeholder="kg L"
>
</td>

<td>
<input
class="set-input"
data-set-field="leftReps"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.leftReps)}"
placeholder="reps L"
>
</td>

<td>
<input
class="set-input"
data-set-field="rightWeight"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.rightWeight)}"
placeholder="kg R"
>
</td>

<td>
<input
class="set-input"
data-set-field="rightReps"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.rightReps)}"
placeholder="reps R"
>
</td>

<td>
<input
class="set-input"
data-set-field="rir"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.rir)}"
placeholder="RIR"
>
</td>

<td>
<input
type="checkbox"
class="set-check"
data-done
data-ei="${ei}"
data-si="${si}"
${s.done?'checked':''}
>
</td>
</tr>
`;
}

return `
<tr>

<td class="set-number">
${si+1}
</td>

<td colspan="2">
<input
class="set-input"
data-set-field="weight"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.weight)}"
placeholder="kg"
>
</td>

<td>
<input
class="set-input"
data-set-field="reps"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.reps)}"
placeholder="reps"
>
</td>

<td>
<input
class="set-input"
data-set-field="rir"
data-ei="${ei}"
data-si="${si}"
value="${esc(s.rir)}"
placeholder="RIR"
>
</td>

<td></td>

<td>
<input
type="checkbox"
class="set-check"
data-done
data-ei="${ei}"
data-si="${si}"
${s.done?'checked':''}
>
</td>

</tr>
`;
}
)
.join('');

const head=
e.type==='unilateral'&&
e.unilateralMode==='separate'
?'<th>L kg</th><th>L reps</th><th>R kg</th><th>R reps</th><th>RIR</th>'
:'<th colspan="2">Carga</th><th>Reps</th><th>RIR</th><th></th>';

return `
<article class="session-exercise">

<div class="session-exercise-head">

<div>
<h3>
${esc(e.name)}
</h3>

<small>
${esc(e.muscle)}
·
${e.type==='unilateral'?'Unilateral':'Bilateral'}
${
e.type==='unilateral'&&
e.unilateralMode==='separate'
?' · lados separados'
:''
}
</small>
</div>

<button
class="remove-btn"
data-remove-session-exercise="${ei}"
>
×
</button>

</div>

<table class="set-table">

<thead>
<tr>
<th>#</th>
${head}
<th>Hecha</th>
</tr>
</thead>

<tbody>
${rows}
</tbody>

</table>

<button
class="add-set"
data-add-set="${ei}"
>
+ Añadir serie
</button>

</article>
`;
}


document.addEventListener('input',e=>{

const field=
e.target.closest(
'[data-set-field]'
);

if(
field&&
state.activeWorkout
){

const set=
state
.activeWorkout
.exercises[
Number(field.dataset.ei)
]
.sets[
Number(field.dataset.si)
];

set[
field.dataset.setField
]=
field.value;

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(state)
);

updateSessionStatsOnly();
}
});


document.addEventListener('change',e=>{

const done=
e.target.closest(
'[data-done]'
);

if(
done&&
state.activeWorkout
){

state
.activeWorkout
.exercises[
Number(done.dataset.ei)
]
.sets[
Number(done.dataset.si)
]
.done=
done.checked;

save();
renderSession();
}
});


document.addEventListener('click',e=>{

const addSet=
e.target.closest(
'[data-add-set]'
);

if(addSet){

const exercise=
state
.activeWorkout
.exercises[
Number(addSet.dataset.addSet)
];

const definition=
getExercise(
exercise.exerciseId
)||exercise;

exercise.sets.push(
blankSet(definition)
);

save();
renderSession();
}

const removeExercise=
e.target.closest(
'[data-remove-session-exercise]'
);

if(removeExercise){

state
.activeWorkout
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

});


function updateSessionStatsOnly(){

if(!state.activeWorkout)return;

setText(
'sessionSets',
state.activeWorkout.exercises.reduce(
(total,exercise)=>
total+
exercise.sets.filter(
set=>set.done
).length,
0
)
);

setText(
'sessionVolume',
fmt(sessionVolume())+
' kg'
);
}


function finishWorkout(){

if(!state.activeWorkout)return;

if(
!confirm(
'¿Terminar y guardar esta sesión?'
)
)
return;

const s=
clone(
state.activeWorkout
);

s.date=
dateKey(new Date());

s.finishedAt=
new Date().toISOString();

state.workouts.unshift(s);

state.activeWorkout=null;

save();

renderTraining();

navigate('training');
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
'finishWorkoutBtn'
).onclick=
finishWorkout;

document.getElementById(
'addExerciseToSession'
).onclick=
()=>openExerciseChooserForSession();

document.getElementById(
'sessionNoteBtn'
).onclick=
()=>document.getElementById(
'noteModal'
).showModal();

document.getElementById(
'saveSessionNote'
).onclick=
()=>{
state.activeWorkout.notes=
document.getElementById(
'sessionNote'
).value;

save();

document.getElementById(
'noteModal'
).close();
};


function openExerciseChooserForSession(){

const exercises=
allExercises();

const modal=
document.createElement(
'dialog'
);

modal.className='modal';

modal.innerHTML=`
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

${
exercises
.map(
exercise=>`
<label class="routine-pick">

<input
type="checkbox"
value="${esc(
exercise.id
)}"
>

<span>

<b>
${esc(
exercise.name
)}
</b>

<br>

<small>
${esc(
exercise.muscle
)}
·
${
exercise.type===
'unilateral'
?'Unilateral'
:'Bilateral'
}
</small>

</span>

</label>
`
)
.join('')
}

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

const search=
modal.querySelector(
'#tempExSearch'
);

search.oninput=()=>{

const query=
search.value.toLowerCase();

modal
.querySelectorAll(
'.routine-pick'
)
.forEach(item=>{

item.style.display=
item.textContent
.toLowerCase()
.includes(query)
?'flex'
:'none';

});

};

modal
.querySelector(
'#tempExAdd'
)
.onclick=()=>{

modal
.querySelectorAll(
'input:checked'
)
.forEach(input=>{

const exercise=
getExercise(
input.value
);

if(exercise){

state
.activeWorkout
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
()=>modal.remove()
);
}


/* =========================================================
RUTINAS
========================================================= */

function renderRoutines(){

const query=
(
document.getElementById(
'routineSearch'
)?.value||''
).toLowerCase();

const routines=
state.routines.filter(
routine=>
routine.name
.toLowerCase()
.includes(query)
);

document.getElementById(
'routineGrid'
).innerHTML=
routines
.map(
routine=>`
<article class="routine-card">

<span class="tag">
${routine.exercises.length}
ejercicios
</span>

<h3>
${esc(routine.name)}
</h3>

<p>
${esc(
routine.description||
'Sin descripción'
)}
</p>

<div>

${
routine.exercises
.slice(0,5)
.map(id=>{

const exercise=
getExercise(id);

return exercise
?`
<span class="tag">
${esc(
exercise.name
)}
</span>
`
:'';

})
.join('')
}

${
routine.exercises.length>5
?`
<span class="tag">
+${
routine.exercises.length-5
}
</span>
`
:''
}

</div>

<div class="card-actions">

<button
class="primary-btn"
data-start-routine="${esc(
routine.id
)}"
>
Entrenar
</button>

<button
class="secondary-btn"
data-edit-routine="${esc(
routine.id
)}"
>
Editar
</button>

<button
class="danger-btn"
data-delete-routine="${esc(
routine.id
)}"
>
×
</button>

</div>

</article>
`
)
.join('')||
`
<div class="empty-state">

<h3>
No hay rutinas
</h3>

<p>
Crea tu primera rutina y
añade los ejercicios que quieras.
</p>

</div>
`;
}


function openRoutineModal(id=null){

editingRoutineId=id;

const routine=
id
?state.routines.find(
item=>item.id===id
)
:null;

document.getElementById(
'routineModalTitle'
).textContent=
routine
?'Editar rutina'
:'Crear rutina';

document.getElementById(
'rName'
).value=
routine?.name||'';

document.getElementById(
'rDescription'
).value=
routine?.description||'';

renderRoutinePicker(
routine?.exercises||[]
);

document.getElementById(
'routineModal'
).showModal();
}


function renderRoutinePicker(
selected=[]
){

document.getElementById(
'routineExercisePicker'
).innerHTML=
allExercises()
.map(
exercise=>`
<label class="routine-pick">

<input
type="checkbox"
value="${esc(
exercise.id
)}"
${
selected.includes(
exercise.id
)
?'checked'
:''
}
>

<span>

<b>
${esc(
exercise.name
)}
</b>

<br>

<small>
${esc(
exercise.muscle
)}
·
${
exercise.type==='unilateral'
?'Unilateral'
:'Bilateral'
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
).onclick=
()=>openRoutineModal();

document.getElementById(
'newRoutineBtn2'
).onclick=
()=>openRoutineModal();

document.getElementById(
'emptyRoutineBtn'
).onclick=
()=>{
document
.querySelector(
'[data-training-tab="routines"]'
)
.click();
};

document.getElementById(
'routineSearch'
).oninput=
renderRoutines;

document.getElementById(
'saveRoutineBtn'
).onclick=
()=>{

const name=
document.getElementById(
'rName'
).value.trim();

if(!name)return;

const exercises=
[
...document.querySelectorAll(
'#routineExercisePicker input:checked'
)
].map(
input=>input.value
);

if(editingRoutineId){

const routine=
state.routines.find(
item=>
item.id===
editingRoutineId
);

if(routine){

routine.name=name;

routine.description=
document.getElementById(
'rDescription'
).value.trim();

routine.exercises=
exercises;
}

}else{

state.routines.push({

id:
uid('routine'),

name,

description:
document.getElementById(
'rDescription'
).value.trim(),

exercises

});

}

save();

document.getElementById(
'routineModal'
).close();

renderRoutines();

};


document.addEventListener('click',event=>{

const start=
event.target.closest(
'[data-start-routine]'
);

if(start){

const routine=
state.routines.find(
item=>
item.id===
start.dataset.startRoutine
);

if(routine)
startWorkout(
routine.name,
routine
);
}

const edit=
event.target.closest(
'[data-edit-routine]'
);

if(edit)
openRoutineModal(
edit.dataset.editRoutine
);

const remove=
event.target.closest(
'[data-delete-routine]'
);

if(
remove&&
confirm(
'¿Borrar esta rutina?'
)
){

state.routines=
state.routines.filter(
routine=>
routine.id!==
remove.dataset.deleteRoutine
);

save();
renderRoutines();
}

});


/* =========================================================
EJERCICIOS
========================================================= */

function renderExercises(){

const query=
(
document.getElementById(
'exerciseSearch'
)?.value||''
).toLowerCase();

const muscle=
document.getElementById(
'exerciseMuscle'
)?.value||'';

const exercises=
allExercises().filter(
exercise=>
(
!query||
exercise.name
.toLowerCase()
.includes(query)
)&&
(
!muscle||
exercise.muscle===muscle
)
);

document.getElementById(
'exerciseGrid'
).innerHTML=
exercises
.map(
exercise=>`
<article class="exercise-card">

<span class="tag">
${esc(
exercise.muscle
)}
</span>

<span class="tag">
${
exercise.type==='unilateral'
?'Unilateral'
:'Bilateral'
}
</span>

<h3>
${esc(
exercise.name
)}
</h3>

<p>
${esc(
exercise.equipment||''
)}
${
exercise.custom
?' · Creado por ti'
:''
}
</p>

</article>
`
)
.join('')||
`
<div class="empty-state">
<p>No se encontraron ejercicios.</p>
</div>
`;

const select=
document.getElementById(
'progressExerciseSelect'
);

if(select){

const oldValue=
select.value;

select.innerHTML=
allExercises()
.map(
exercise=>`
<option
value="${esc(
exercise.id
)}"
>
${esc(
exercise.name
)}
</option>
`
)
.join('');

if(oldValue)
select.value=oldValue;
}
}


document.getElementById(
'exerciseSearch'
).oninput=
renderExercises;

document.getElementById(
'exerciseMuscle'
).onchange=
renderExercises;

document.getElementById(
'newExerciseBtn'
).onclick=
()=>{

document.getElementById(
'exerciseModalTitle'
).textContent=
'Crear ejercicio';

document.getElementById(
'exerciseForm'
).reset();

toggleUnilateral();

document.getElementById(
'exerciseModal'
).showModal();
};


document.getElementById(
'eType'
).onchange=
toggleUnilateral;


function toggleUnilateral(){

document.getElementById(
'unilateralModeLabel'
).style.display=
document.getElementById(
'eType'
).value===
'unilateral'
?'grid'
:'none';
}


document.getElementById(
'exerciseForm'
).onsubmit=
event=>{

event.preventDefault();

const exercise={

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

custom:true

};

if(!exercise.name)return;

state.customExercises.push(
exercise
);

save();

document.getElementById(
'exerciseModal'
).close();

renderExercises();
};


/* =========================================================
HISTORIAL
========================================================= */

function renderHistory(){

const query=
(
document.getElementById(
'historySearch'
)?.value||''
).toLowerCase();

const workouts=
state.workouts.filter(
workout=>
workout.name
.toLowerCase()
.includes(query)
);

setText(
'historyCount',
`${workouts.length} sesiones`
);

document.getElementById(
'workoutHistory'
).innerHTML=
workouts
.map(
workout=>`
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
weekday:'long',
day:'numeric',
month:'long',
year:'numeric'
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
workout.exercises.reduce(
(total,exercise)=>
total+
exercise.sets.filter(
set=>set.done
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
exercise=>`
<div class="list-row">

<div>

<b>
${esc(
exercise.name
)}
</b>

<small>
${
exercise.type===
'unilateral'
?'Unilateral'
:'Bilateral'
}
</small>

</div>

<span>
${
exercise.sets
.filter(
set=>set.done
)
.map(
set=>
exercise.type===
'unilateral'&&
exercise.unilateralMode===
'separate'
?`
${
set.leftWeight||0
}×${
set.leftReps||0
}
/
${
set.rightWeight||0
}×${
set.rightReps||0
}
`
:`
${
set.weight||0
}×${
set.reps||0
}
· RIR
${
set.rir||'—'
}
`
)
.join(' · ')||
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
?`
<p class="muted">
Nota:
${esc(
workout.notes
)}
</p>
`
:''
}

</div>

</article>
`
)
.join('')||
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


document.getElementById(
'historySearch'
).oninput=
renderHistory;


document.addEventListener('click',event=>{

const item=
event.target.closest(
'[data-history-item]'
);

if(
item&&
!event.target.closest('button')
)
item.classList.toggle(
'open'
);

});


/* =========================================================
PROGRESIÓN
========================================================= */

function renderProgression(){

const id=
document.getElementById(
'progressExerciseSelect'
).value||
allExercises()[0]?.id;

const ex=
getExercise(id);

if(!ex){

document.getElementById(
'progressionContent'
).innerHTML='';

return;
}

const rows=[];

state.workouts.forEach(w=>{

const x=
w.exercises.find(
a=>a.exerciseId===id
);

if(x){

const done=
x.sets.filter(
s=>s.done
);

if(done.length)
rows.push({

date:
w.date,

volume:
done.reduce(
(a,s)=>
a+
(Number(s.weight)||0)*
(Number(s.reps)||0),
0
),

top:
Math.max(
...done.map(
s=>Number(s.weight)||0
)
),

reps:
Math.max(
...done.map(
s=>Number(s.reps)||0
)
)

});
}
});

const best=
rows.length
?Math.max(
...rows.map(
x=>x.top
)
)
:0;

const maxVol=
rows.length
?Math.max(
...rows.map(
x=>x.volume
)
)
:0;

document.getElementById(
'progressionContent'
).innerHTML=`

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
${fmt(maxVol)} kg
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
?fmt(
rows[
rows.length-1
].top
)
:'—'
}
kg
</b>
</div>

</div>

<div class="panel">

<div class="panel-head">

<div>

<p class="eyebrow">
${esc(ex.muscle)}
</p>

<h3>
${esc(ex.name)}
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
.slice(0,10)
.map(
r=>`
<div class="list-row">

<span>
${fmtDate(r.date)}
</span>

<b>
${fmt(r.top)} kg ·
${fmt(r.reps)} reps ·
${fmt(r.volume)} kg vol.
</b>

</div>
`
)
.join('')||
emptyList(
'Todavía no hay datos de este ejercicio.'
)
}

</div>
`;
}


function progressSvg(rows){

if(!rows.length)
return `
<div class="empty-state">
<p>
Completa algunas sesiones
para ver la progresión.
</p>
</div>
`;

const vals=
rows.map(
x=>x.top
);

const max=
Math.max(...vals);

const min=
Math.min(...vals);

const range=
max-min||1;

const pts=
vals.map(
(v,i)=>
`${(i/(vals.length-1||1))*100},${90-((v-min)/range)*70}`
).join(' ');

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


/* =========================================================
PROGRESO
========================================================= */

function renderProgress(){

const p=
state.progress
.slice()
.sort(
(a,b)=>
a.date.localeCompare(
b.date
)
);

const cur=
p[p.length-1]?.weight;

setText(
'currentWeight',
cur!=null
?fmt(cur,1)
:'—'
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

const range=
Number(
document.getElementById(
'progressRange'
).value||30
);

const arr=
p.filter(
x=>
(
Date.now()-
new Date(
x.date+'T12:00:00'
)
)<=
range*86400000
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
<b>
${fmt(x.weight,1)} kg
</b>

<small>
${fmtDate(x.date)}
</small>
</div>

<button
class="remove-btn"
data-remove-progress="${p.length-1-i}"
>
×
</button>

</div>
`
)
.join('')||
emptyList(
'No hay registros todavía.'
);
}


function drawWeightChart(arr){

const svg=
document.getElementById(
'weightChart'
);

if(!arr.length){

svg.innerHTML=
'<text x="50%" y="50%" text-anchor="middle" fill="#8e99a8">Registra tu primer peso para ver la gráfica</text>';

return;
}

const vals=
arr.map(
x=>x.weight
);

const min=
Math.min(...vals)-1;

const max=
Math.max(...vals)+1;

let d='';

vals.forEach(
(v,i)=>{

const x=
30+
i*
(
740/
Math.max(
1,
vals.length-1
)
);

const y=
270-
(
(v-min)/
(max-min)
)*
230;

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
(
740/
Math.max(
1,
vals.length-1
)
);

const y=
270-
(
(v-min)/
(max-min)
)*
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

const weight=
prompt(
'Peso actual (kg):'
);

if(weight===null)return;

const n=
Number(weight);

if(
!Number.isFinite(n)||
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
)||'';

state.progress.push({

id:
uid('weight'),

date:
dateKey(
new Date()
),

weight:n,

note

});

save();
renderProgress();
};


document.addEventListener('click',e=>{

const r=
e.target.closest(
'[data-remove-progress]'
);

if(
r&&
confirm(
'¿Eliminar este registro?'
)
){

const arr=
state.progress
.slice()
.sort(
(a,b)=>
a.date.localeCompare(
b.date
)
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
});


/* =========================================================
MANTENIMIENTO
========================================================= */

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
)||0;

let bmr=
10*weight+
6.25*height-
5*age+
(
sex==='male'
?5
:-161
);

let maint=
Math.round(
bmr*activity
);

const goal=
document.getElementById(
'mGoal'
).value;

if(
goal==='cut'&&
adj===0
)
maint-=300;

if(
goal==='gain'&&
adj===0
)
maint+=200;

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

const m=
state.maintenance;

const g=
state.goals;

document.getElementById(
'mSex'
).value=
m.sex||'male';

document.getElementById(
'mAge'
).value=
m.age||18;

document.getElementById(
'mWeight'
).value=
m.weight||71;

document.getElementById(
'mHeight'
).value=
m.height||176;

document.getElementById(
'mActivity'
).value=
m.activity||1.55;

document.getElementById(
'mGoal'
).value=
m.goal||'cut';

document.getElementById(
'mAdjustment'
).value=
m.adjustment??0;

setText(
'maintenanceResult',
fmt(
m.maintenance||
g.calories
)
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
).value=
g.calories;

document.getElementById(
'goalProteinInput'
).value=
g.protein;

document.getElementById(
'goalCarbsInput'
).value=
g.carbs;

document.getElementById(
'goalFatInput'
).value=
g.fat;
}


document.getElementById(
'maintenanceForm'
).onsubmit=
e=>{
e.preventDefault();
calculateMaintenance()
};


document.getElementById(
'saveManualGoals'
).onclick=
()=>{

state.goals={

calories:
Number(
document.getElementById(
'goalCalInput'
).value
)||2300,

protein:
Number(
document.getElementById(
'goalProteinInput'
).value
)||130,

carbs:
Number(
document.getElementById(
'goalCarbsInput'
).value
)||260,

fat:
Number(
document.getElementById(
'goalFatInput'
).value
)||70

};

save();
renderMaintenance();
};


/* =========================================================
ASISTENTE
========================================================= */

function assistantAnswer(q){

const l=
q.toLowerCase();

const t=
totalsForDate(
dateKey(new Date())
);

if(
l.includes('calor')||
l.includes('kcal')
)
return `Hoy llevas ${fmt(t.calories)} kcal de un objetivo de ${fmt(state.goals.calories)} kcal.`;

if(
l.includes('prote')
)
return `Hoy llevas ${fmt(t.protein,1)} g de proteína. Tu objetivo guardado es ${fmt(state.goals.protein)} g.`;

if(
l.includes('sesion')||
l.includes('entren')
)
return `Has registrado ${state.workouts.filter(w=>withinDays(w.date,7)).length} sesiones en los últimos 7 días.`;

if(
l.includes('volumen')
){

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
?`El mayor volumen registrado recientemente es de ${fmt(arr[0].v)} kg en ${arr[0].name}.`
:'Todavía no hay suficiente historial.'
}

return `Puedo consultar tus calorías, macros de hoy, sesiones recientes y progresión guardada. Prueba con “¿cuánta proteína llevo hoy?”`
}


function sendAssistant(q){

if(!q.trim())return;

const box=
document.getElementById(
'assistantMessages'
);

box.insertAdjacentHTML(
'beforeend',
`<div class="msg user"><small>Tú</small>${esc(q)}</div>`
);

box.insertAdjacentHTML(
'beforeend',
`<div class="msg"><small>Nutri</small>${esc(assistantAnswer(q))}</div>`
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
if(
e.key==='Enter'
)
document.getElementById(
'assistantSend'
).click()
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


/* =========================================================
PESTAÑAS DE ENTRENAMIENTO
========================================================= */

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

if(tab==='progression')
renderProgression();
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


/* =========================================================
EXPORTAR / IMPORTAR
========================================================= */

document.getElementById(
'exportData'
).onclick=
()=>{

const blob=
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

const a=
document.createElement(
'a'
);

a.href=
URL.createObjectURL(
blob
);

a.download=
`nutri-backup-${dateKey(
new Date()
)}.json`;

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

state=
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
}
};


/* =========================================================
RENDER GENERAL
========================================================= */

function renderAll(){

renderDashboard();

renderNutrition();

renderTraining();

renderProgress();

renderMaintenance();

}


renderAll();
