/* /script.js */
const KEY='nutri_v1';
const today=()=>new Date().toISOString().slice(0,10);
const uid=p=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=0)=>n(v).toLocaleString('es-ES',{maximumFractionDigits:d});
const sum=(a,k)=>a.reduce((x,y)=>x+n(y[k]),0);

const defaultExercises=[
['Press banca','Pecho','Barra'],['Press inclinado con mancuernas','Pecho','Mancuernas'],['Aperturas en polea','Pecho','Polea'],
['Dominadas','Espalda','Peso corporal'],['Jalón al pecho','Espalda','Polea'],['Remo con barra','Espalda','Barra'],['Remo en máquina','Espalda','Máquina'],
['Curl bíceps','Bíceps','Mancuernas'],['Curl martillo','Bíceps','Mancuernas'],['Extensión de tríceps en polea','Tríceps','Polea'],
['Press militar','Hombros','Barra'],['Elevaciones laterales','Hombros','Mancuernas'],['Sentadilla','Piernas','Barra'],
['Extensión de cuádriceps','Cuádriceps','Máquina'],['Curl femoral','Isquios','Máquina'],['Prensa','Piernas','Máquina'],
['Elevación de gemelos','Gemelos','Máquina'],['Plancha','Abdomen','Peso corporal'],['Crunch en polea','Abdomen','Polea']
].map((x,i)=>({
id:'ex_'+i,
name:x[0],
group:x[1],
equipment:x[2],
type:'bilateral',
notes:'',
custom:false
}));

const defaults={
goals:{calories:2300,protein:130,carbs:260,fat:70},
profile:{name:''},
maintenance:{sex:'male',age:18,weight:70,height:176,activity:1.55},
nutrition:{},customFoods:[],recipes:[],routines:[],customExercises:[],workouts:[],weights:[],theme:'light'
};

let state=load();
let selectedFood=null;
let recipeIngredients=[];
let routineExercises=[];
let activeWorkout=null;
let timerStart=0;
let timerInt=null;

function load(){
try{return deepMerge(structuredClone(defaults),JSON.parse(localStorage.getItem(KEY)||'{}'))}
catch{return structuredClone(defaults)}
}
function deepMerge(base,src){
if(!src||typeof src!=='object')return base;
for(const k of Object.keys(src)){
if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&base[k])base[k]=deepMerge(base[k],src[k]);
else base[k]=src[k]
}
return base
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function allFoods(){return [...foods,...state.customFoods]}
function allExercises(){return [...defaultExercises,...state.customExercises]}
function foodById(id){return allFoods().find(f=>String(f.id)===String(id))}
function exerciseById(id){return allExercises().find(e=>String(e.id)===String(id))}
function mealsFor(date){
if(!state.nutrition[date])state.nutrition[date]={breakfast:[],lunch:[],snack:[],dinner:[]};
return state.nutrition[date]
}
function page(name){
document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+name));
const titles={home:['NUTRI','Tu día'],nutrition:['NUTRICIÓN','Tu alimentación'],training:['ENTRENAMIENTO','Tu entrenamiento'],progress:['PROGRESO','Tu evolución'],settings:['AJUSTES','Configuración']};
document.getElementById('pageKicker').textContent=titles[name][0];
document.getElementById('pageTitle').textContent=titles[name][1]
}
function go(name){
page(name);
if(name==='home')renderHome();
if(name==='nutrition')renderNutrition();
if(name==='training')renderTraining();
if(name==='progress')renderProgress();
if(name==='settings')renderSettings()
}
function pct(v,target){return target>0?Math.min(100,(v/target)*100):0}
function totals(date){
const m=mealsFor(date),a=Object.values(m).flat();
return{calories:sum(a,'calories'),protein:sum(a,'protein'),carbs:sum(a,'carbs'),fat:sum(a,'fat')}
}

function renderHome(){
const t=totals(today()),g=state.goals;
document.getElementById('homeGreeting').textContent=state.profile.name?`Hola, ${state.profile.name}`:'Tu resumen diario';
document.getElementById('homeCalories').textContent=fmt(t.calories);
document.getElementById('homeCaloriesTarget').textContent=`/ ${fmt(g.calories)} kcal`;
document.getElementById('homeCaloriesBar').style.width=pct(t.calories,g.calories)+'%';
document.getElementById('homeProtein').textContent=fmt(t.protein,1)+' g';
document.getElementById('homeProteinTarget').textContent=`/ ${fmt(g.protein,1)} g`;
document.getElementById('homeProteinBar').style.width=pct(t.protein,g.protein)+'%';
[['Protein','protein'],['Carbs','carbs'],['Fat','fat']].forEach(([a,k])=>{
const label=k==='protein'?'Protein':k==='carbs'?'Carbohidratos':'Grasas';
document.getElementById('homeMacro'+a).textContent=fmt(t[k],1)+' g';
document.getElementById('homeMacro'+a+'Bar').style.width=pct(t[k],g[k])+'%'
});
const workouts=state.workouts.slice(-3).reverse();
document.getElementById('homeWorkout').innerHTML=state.routines.length
? `<div class="list-row"><div><strong>${esc(state.routines[0].name)}</strong><small>${state.routines[0].exercises.length} ejercicios</small></div><button class="secondary-btn" data-start-routine="${state.routines[0].id}">Entrenar</button></div>`
: `<div class="empty">Crea tu primera rutina para empezar.</div>`;
document.getElementById('homeRecent').innerHTML=workouts.length?workouts.map(w=>`<div class="history-row"><div><strong>${esc(w.name)}</strong><small>${w.date}</small></div><span>${w.exercises.length} ejercicios</span></div>`).join(''):`<div class="empty">Todavía no hay entrenamientos.</div>`
}

function renderNutrition(){
const date=document.getElementById('nutritionDate').value||today();
const t=totals(date),g=state.goals;
document.getElementById('nutritionCalories').textContent=fmt(t.calories);
document.getElementById('nutritionTarget').textContent=fmt(g.calories)+' kcal';
document.getElementById('nutritionRemaining').textContent=fmt(Math.max(0,g.calories-t.calories))+' kcal';
document.getElementById('nutritionProtein').textContent=`${fmt(t.protein,1)} / ${fmt(g.protein,1)} g`;
document.getElementById('nutritionCarbs').textContent=`${fmt(t.carbs,1)} / ${fmt(g.carbs,1)} g`;
document.getElementById('nutritionFat').textContent=`${fmt(t.fat,1)} / ${fmt(g.fat,1)} g`;
const meals=[['breakfast','Desayuno'],['lunch','Comida'],['snack','Merienda'],['dinner','Cena']];
meals.forEach(([key,label])=>{
const arr=mealsFor(date)[key];
document.getElementById('meal-'+key).innerHTML=arr.length?arr.map(item=>`
<div class="food-log-row">
<div><strong>${esc(item.name)}</strong><small>${fmt(item.grams,0)} g · ${fmt(item.protein,1)}P · ${fmt(item.carbs,1)}C · ${fmt(item.fat,1)}G</small></div>
<strong>${fmt(item.calories)} kcal</strong>
<button class="remove" data-remove-food="${item.id}" data-meal="${key}">×</button>
</div>`).join(''):`<div class="empty">Añade alimentos a ${label.toLowerCase()}.</div>`;
const kcal=sum(arr,'calories');
const id='meal'+key.charAt(0).toUpperCase()+key.slice(1)+'Total';
document.getElementById(id).textContent=fmt(kcal)+' kcal'
});
document.getElementById('nutritionMacroPanel').innerHTML=macroLine('Proteína',t.protein,g.protein)+macroLine('Carbohidratos',t.carbs,g.carbs)+macroLine('Grasas',t.fat,g.fat);
document.getElementById('recipeMiniList').innerHTML=state.recipes.length?state.recipes.slice(-5).reverse().map(r=>`<div class="list-row"><div><strong>${esc(r.name)}</strong><small>${fmt(r.calories,0)} kcal · ${fmt(r.protein,1)} g proteína</small></div><button class="secondary-btn" data-add-recipe="${r.id}">Añadir</button></div>`).join(''):`<div class="empty">No tienes recetas todavía.</div>`
}
function macroLine(name,val,target){return `<div class="macro-line"><div class="macro-line-head"><span>${name}</span><strong>${fmt(val,1)} / ${fmt(target,1)} g</strong></div><div class="macro-line-bar"><i style="width:${pct(val,target)}%"></i></div></div>`}

function renderFoodResults(q=''){
const term=q.trim().toLowerCase();
const results=allFoods().filter(f=>`${f.name} ${f.category||''}`.toLowerCase().includes(term)).slice(0,100);
document.getElementById('foodResults').innerHTML=results.length?results.map(f=>`
<button type="button" class="food-result" data-food-id="${esc(f.id)}">
<strong>${esc(f.name)}</strong>
<small>${esc(f.category||'')} · ${fmt(f.calories)} kcal · ${fmt(f.protein,1)}P · ${fmt(f.carbs,1)}C · ${fmt(f.fat,1)}G / 100 g</small>
</button>`).join(''):`<div class="empty">No se ha encontrado ningún alimento.</div>`
}
function openFood(meal){
document.getElementById('foodModal').showModal();
document.getElementById('foodSearch').value='';
document.getElementById('foodGrams').value=100;
document.getElementById('foodModal').dataset.meal=meal;
selectedFood=null;
document.getElementById('selectedFoodBox').classList.add('hidden');
renderFoodResults('')
}
function addFood(){
if(!selectedFood)return alert('Selecciona un alimento.');
const grams=n(document.getElementById('foodGrams').value);
if(grams<=0)return alert('Introduce una cantidad válida.');
const m=document.getElementById('foodModal').dataset.meal,date=document.getElementById('nutritionDate').value||today();
const x=grams/100;
mealsFor(date)[m].push({id:uid('foodlog'),foodId:selectedFood.id,name:selectedFood.name,grams,calories:selectedFood.calories*x,protein:selectedFood.protein*x,carbs:selectedFood.carbs*x,fat:selectedFood.fat*x});
save();document.getElementById('foodModal').close();renderNutrition();renderHome()
}

function openGoals(){
['Calories','Protein','Carbs','Fat'].forEach(k=>document.getElementById('goal'+k).value=state.goals[k.toLowerCase()]);
document.getElementById('goalsModal').showModal()
}
function saveGoals(){
state.goals={calories:n(document.getElementById('goalCalories').value),protein:n(document.getElementById('goalProtein').value),carbs:n(document.getElementById('goalCarbs').value),fat:n(document.getElementById('goalFat').value)};
save();document.getElementById('goalsModal').close();renderHome();renderNutrition()
}

function openMaintenance(){
const m=state.maintenance;
document.getElementById('mSex').value=m.sex;document.getElementById('mAge').value=m.age;document.getElementById('mWeight').value=m.weight;document.getElementById('mHeight').value=m.height;document.getElementById('mActivity').value=m.activity;
document.getElementById('maintenanceResult').innerHTML='';
document.getElementById('maintenanceModal').showModal()
}
function calculateMaintenance(){
const sex=document.getElementById('mSex').value,age=n(document.getElementById('mAge').value),weight=n(document.getElementById('mWeight').value),height=n(document.getElementById('mHeight').value),activity=n(document.getElementById('mActivity').value);
if(age<=0||weight<=0||height<=0)return;
const bmr=10*weight+6.25*height-5*age+(sex==='male'?5:-161),tdee=bmr*activity;
state.maintenance={sex,age,weight,height,activity};
document.getElementById('maintenanceResult').innerHTML=`<span>Estimación Mifflin-St Jeor</span><strong>${fmt(tdee)} kcal/día</strong><small>BMR: ${fmt(bmr)} kcal · Actividad ×${activity}</small>`;
save()
}

function openRecipe(){
recipeIngredients=[];
document.getElementById('recipeName').value='';
document.getElementById('recipeFoodSearch').value='';
renderRecipeIngredients();
document.getElementById('recipeModal').showModal()
}
function renderRecipeIngredients(){
document.getElementById('recipeIngredients').innerHTML=recipeIngredients.length?recipeIngredients.map((x,i)=>`<div class="recipe-ingredient"><span>${esc(x.name)} · ${fmt(x.grams)} g</span><button type="button" class="remove" data-recipe-index="${i}">×</button></div>`).join(''):`<div class="empty">Añade ingredientes.</div>`
}
function addRecipeIngredient(){
const q=document.getElementById('recipeFoodSearch').value.trim().toLowerCase(),grams=n(document.getElementById('recipeFoodGrams').value);
const f=allFoods().find(x=>x.name.toLowerCase().includes(q));
if(!f||grams<=0)return alert('Introduce un alimento válido.');
const m=grams/100;
recipeIngredients.push({foodId:f.id,name:f.name,grams,calories:f.calories*m,protein:f.protein*m,carbs:f.carbs*m,fat:f.fat*m});
renderRecipeIngredients()
}
function saveRecipe(){
const name=document.getElementById('recipeName').value.trim();
if(!name||!recipeIngredients.length)return alert('Completa el nombre y añade ingredientes.');
state.recipes.push({id:uid('recipe'),name,ingredients:structuredClone(recipeIngredients),calories:sum(recipeIngredients,'calories'),protein:sum(recipeIngredients,'protein'),carbs:sum(recipeIngredients,'carbs'),fat:sum(recipeIngredients,'fat')});
save();document.getElementById('recipeModal').close();renderNutrition()
}

function renderTraining(){
const rs=document.getElementById('routineList');
rs.innerHTML=state.routines.length?state.routines.map(r=>`<div class="routine-card"><div class="routine-card-head"><strong>${esc(r.name)}</strong><div class="exercise-actions"><button class="secondary-btn" data-start-routine="${r.id}">Entrenar</button><button class="danger-btn" data-delete-routine="${r.id}">×</button></div></div><div class="routine-exercises">${r.exercises.map(e=>esc(exerciseById(e.exerciseId)?.name||'Ejercicio')).join(' · ')}</div></div>`).join(''):`<div class="empty">No tienes rutinas. Crea una para empezar.</div>`;
const q=(document.getElementById('exerciseSearch').value||'').toLowerCase();
const es=allExercises().filter(e=>`${e.name} ${e.group} ${e.equipment}`.toLowerCase().includes(q));
document.getElementById('exerciseList').innerHTML=es.map(e=>`<div class="exercise-row"><div class="exercise-info"><strong>${esc(e.name)}</strong><small>${esc(e.group)} · ${esc(e.equipment)}</small></div>${e.custom?`<button class="danger-btn" data-delete-exercise="${e.id}">×</button>`:''}</div>`).join('');
document.getElementById('workoutHistory').innerHTML=state.workouts.length?state.workouts.slice().reverse().map(w=>`<div class="history-row"><div><strong>${esc(w.name)}</strong><small>${w.date}</small></div><span>${w.exercises.length} ejercicios</span></div>`).join(''):`<div class="empty">Todavía no hay entrenamientos.</div>`
}
function openExercise(){
['exerciseName','exerciseEquipment','exerciseNotes'].forEach(id=>document.getElementById(id).value='');
document.getElementById('exerciseModal').showModal()
}
function saveExercise(){
const name=document.getElementById('exerciseName').value.trim();
if(!name)return alert('Introduce un nombre.');
state.customExercises.push({id:uid('ex'),name,group:document.getElementById('exerciseGroup').value,equipment:document.getElementById('exerciseEquipment').value.trim()||'Otro',type:document.getElementById('exerciseType').value,notes:document.getElementById('exerciseNotes').value.trim(),custom:true});
save();document.getElementById('exerciseModal').close();renderTraining()
}
function openRoutine(){
routineExercises=[];
document.getElementById('routineName').value='';
renderRoutinePicker();
document.getElementById('routineModal').showModal()
}
function renderRoutinePicker(){
document.getElementById('routineExercisePicker').innerHTML=allExercises().map(e=>`<label class="check-row"><input type="checkbox" value="${e.id}" ${routineExercises.includes(e.id)?'checked':''}> ${esc(e.name)} <small>${esc(e.group)}</small></label>`).join('')
}
function saveRoutine(){
const name=document.getElementById('routineName').value.trim();
routineExercises=[...document.querySelectorAll('#routineExercisePicker input:checked')].map(x=>x.value);
if(!name||!routineExercises.length)return alert('Pon un nombre y selecciona al menos un ejercicio.');
state.routines.push({id:uid('routine'),name,exercises:routineExercises.map(exerciseId=>({exerciseId,sets:3,reps:8,rir:2,rest:120}))});
save();document.getElementById('routineModal').close();renderTraining()
}
function startRoutine(id){
const r=state.routines.find(x=>String(x.id)===String(id));
if(!r)return;

activeWorkout={
routineId:r.id,
name:r.name,
date:today(),
exercises:r.exercises.map(e=>({
exerciseId:e.exerciseId,
sets:Array.from({length:e.sets},()=>({
weight:0,
reps:e.reps,
rir:e.rir,
done:false,
left:{weight:0,reps:e.reps,rir:e.rir},
right:{weight:0,reps:e.reps,rir:e.rir}
}))
}))
};

renderWorkout();
document.getElementById('workoutModal').showModal();
}
function renderWorkout(){
document.getElementById('workoutTitle').textContent=activeWorkout.name;

document.getElementById('workoutContent').innerHTML=activeWorkout.exercises.map((e,ei)=>{
const ex=exerciseById(e.exerciseId);
const type=ex?.type||'bilateral';

let setsHtml='';

e.sets.forEach((s,si)=>{
if(type==='bilateral'){
setsHtml+=`
<div class="set-row">
<span>${si+1}</span>
<input type="number" min="0" step=".5" data-w-e="${ei}" data-w-s="${si}" data-w-k="weight" value="${s.weight}">
<input type="number" min="0" data-w-e="${ei}" data-w-s="${si}" data-w-k="reps" value="${s.reps}">
<input type="number" min="0" max="10" data-w-e="${ei}" data-w-s="${si}" data-w-k="rir" value="${s.rir}">
<button type="button" class="set-done" data-set-done="${ei}-${si}">${s.done?'✓':'○'}</button>
</div>`;
}else{
setsHtml+=`
<div class="unilateral-set">
<div class="set-label">Serie ${si+1}</div>

<div class="side-row">
<strong>Izquierda</strong>
<input type="number" min="0" step=".5" data-w-e="${ei}" data-w-s="${si}" data-w-side="left" data-w-k="weight" value="${s.left?.weight??0}">
<input type="number" min="0" data-w-e="${ei}" data-w-s="${si}" data-w-side="left" data-w-k="reps" value="${s.left?.reps??s.reps}">
<input type="number" min="0" max="10" data-w-e="${ei}" data-w-s="${si}" data-w-side="left" data-w-k="rir" value="${s.left?.rir??s.rir}">
</div>

<div class="side-row">
<strong>Derecha</strong>
<input type="number" min="0" step=".5" data-w-e="${ei}" data-w-s="${si}" data-w-side="right" data-w-k="weight" value="${s.right?.weight??0}">
<input type="number" min="0" data-w-e="${ei}" data-w-s="${si}" data-w-side="right" data-w-k="reps" value="${s.right?.reps??s.reps}">
<input type="number" min="0" max="10" data-w-e="${ei}" data-w-s="${si}" data-w-side="right" data-w-k="rir" value="${s.right?.rir??s.rir}">
</div>

<button type="button" class="set-done" data-set-done="${ei}-${si}">${s.done?'✓':'○'}</button>
</div>`;
}
});

return `
<div class="workout-exercise">
<strong>${esc(ex?.name||'Ejercicio')}</strong>
${setsHtml}
</div>`;
}).join('');
}
function finishWorkout(){
if(!activeWorkout)return;
state.workouts.push(structuredClone(activeWorkout));save();activeWorkout=null;document.getElementById('workoutModal').close();renderTraining();renderHome()
}
function startTimer(){
if(timerInt)clearInterval(timerInt);
timerStart=Date.now();
timerInt=setInterval(()=>{const sec=Math.floor((Date.now()-timerStart)/1000);document.getElementById('timer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')},250)
}

function renderProgress(){
const ws=state.weights.slice().sort((a,b)=>a.date.localeCompare(b.date));
document.getElementById('currentWeight').textContent=ws.length?fmt(ws[ws.length-1].weight,1)+' kg':'—';
const chart=document.getElementById('weightChart');
if(ws.length){
const vals=ws.map(x=>x.weight),min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
chart.innerHTML=ws.slice(-30).map(x=>`<div class="chart-bar" title="${x.date}: ${x.weight} kg" style="height:${30+((x.weight-min)/range)*150}px"></div>`).join('')
}else chart.innerHTML='<div class="empty" style="width:100%">Registra tu peso para ver la evolución.</div>';
document.getElementById('weightHistory').innerHTML=ws.slice().reverse().map(x=>`<div class="history-row"><strong>${x.date}</strong><span>${fmt(x.weight,1)} kg</span></div>`).join('')||'<div class="empty">No hay registros.</div>';
const sets=state.workouts.reduce((a,w)=>a+w.exercises.reduce((b,e)=>b+e.sets.length,0),0);
document.getElementById('progressTrainingStats').innerHTML=`<div class="macro-grid"><div><span>Entrenamientos</span><strong>${state.workouts.length}</strong></div><div><span>Series</span><strong>${sets}</strong></div><div><span>Rutinas</span><strong>${state.routines.length}</strong></div></div>`
}
function renderSettings(){document.getElementById('profileName').value=state.profile.name||''}

document.querySelectorAll('.nav-item').forEach(b=>{
b.onclick=()=>{
go(b.dataset.page);
document.querySelector('.sidebar')?.classList.remove('open');
};
});
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
document.getElementById('mobileMenu').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');

document.getElementById('nutritionDate').value=today();
document.getElementById('prevDay').onclick=()=>changeDay(-1);
document.getElementById('nextDay').onclick=()=>changeDay(1);
document.getElementById('todayBtn').onclick=()=>{document.getElementById('nutritionDate').value=today();renderNutrition()};
function changeDay(delta){const d=new Date(document.getElementById('nutritionDate').value+'T12:00:00');d.setDate(d.getDate()+delta);document.getElementById('nutritionDate').value=d.toISOString().slice(0,10);renderNutrition()}

document.querySelectorAll('.add-btn').forEach(b=>b.onclick=()=>openFood(b.dataset.meal));
document.getElementById('foodSearch').oninput=e=>renderFoodResults(e.target.value);
document.getElementById('confirmFood').onclick=addFood;
document.getElementById('cancelFood').onclick=()=>document.getElementById('foodModal').close();
document.getElementById('openGoals').onclick=openGoals;
document.getElementById('saveGoals').onclick=saveGoals;
document.getElementById('openMaintenance').onclick=openMaintenance;
document.getElementById('calculateMaintenance').onclick=calculateMaintenance;
document.getElementById('openRecipe').onclick=openRecipe;
document.getElementById('addRecipeIngredient').onclick=addRecipeIngredient;
document.getElementById('saveRecipe').onclick=saveRecipe;

document.getElementById('openExercise').onclick=openExercise;
document.getElementById('saveExercise').onclick=saveExercise;
document.getElementById('openRoutine').onclick=openRoutine;
document.getElementById('saveRoutine').onclick=saveRoutine;
document.getElementById('exerciseSearch').oninput=renderTraining;
document.getElementById('startTimer').onclick=startTimer;
document.getElementById('finishWorkout').onclick=finishWorkout;
document.getElementById('addWeight').onclick=()=>{
const w=prompt('Peso actual en kg:');if(w===null)return;
const value=n(w);if(value<=0)return;
state.weights.push({date:today(),weight:value});save();renderProgress()
};
document.getElementById('saveProfile').onclick=()=>{state.profile.name=document.getElementById('profileName').value.trim();save();renderSettings();renderHome()};
document.getElementById('exportData').onclick=()=>{
const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');
a.href=URL.createObjectURL(blob);a.download='nutri-backup.json';a.click();URL.revokeObjectURL(a.href)
};
document.getElementById('importData').onchange=e=>{
const file=e.target.files[0];if(!file)return;
const reader=new FileReader();
reader.onload=()=>{try{state=deepMerge(structuredClone(defaults),JSON.parse(reader.result));save();location.reload()}catch{alert('Archivo no válido.')}}
reader.readAsText(file)
};
document.getElementById('resetData').onclick=()=>{
if(confirm('¿Restablecer todos los datos locales?')){localStorage.removeItem(KEY);location.reload()}
};

document.addEventListener('click',e=>{
const food=e.target.closest('[data-food-id]');
if(food){
selectedFood=foodById(food.dataset.foodId);
if(selectedFood){
const box=document.getElementById('selectedFoodBox');
box.classList.remove('hidden');
box.innerHTML=`<strong>${esc(selectedFood.name)}</strong><small>${fmt(selectedFood.calories)} kcal · ${fmt(selectedFood.protein,1)}P · ${fmt(selectedFood.carbs,1)}C · ${fmt(selectedFood.fat,1)}G / 100 g</small>`
}
}
const remove=e.target.closest('[data-remove-food]');
if(remove){
const date=document.getElementById('nutritionDate').value||today();
mealsFor(date)[remove.dataset.meal]=mealsFor(date)[remove.dataset.meal].filter(x=>String(x.id)!==String(remove.dataset.removeFood));
save();renderNutrition();renderHome()
}
const ri=e.target.closest('[data-recipe-index]');
if(ri){recipeIngredients.splice(Number(ri.dataset.recipeIndex),1);renderRecipeIngredients()}
const addR=e.target.closest('[data-add-recipe]');
if(addR){
const r=state.recipes.find(x=>String(x.id)===String(addR.dataset.addRecipe));if(!r)return;
const meal=prompt('¿A qué comida añadirla? Escribe: desayuno, comida, merienda o cena','comida');
const map={desayuno:'breakfast',comida:'lunch',merienda:'snack',cena:'dinner'};
if(!map[meal])return;
mealsFor(document.getElementById('nutritionDate').value||today())[map[meal]].push({id:uid('recipe-log'),foodId:r.id,name:r.name,grams:100,calories:r.calories,protein:r.protein,carbs:r.carbs,fat:r.fat});
save();renderNutrition();renderHome()
}
const sr=e.target.closest('[data-start-routine]');if(sr)startRoutine(sr.dataset.startRoutine);
const dr=e.target.closest('[data-delete-routine]');if(dr&&confirm('¿Eliminar esta rutina?')){state.routines=state.routines.filter(x=>String(x.id)!==String(dr.dataset.deleteRoutine));save();renderTraining()}
const de=e.target.closest('[data-delete-exercise]');if(de&&confirm('¿Eliminar este ejercicio?')){state.customExercises=state.customExercises.filter(x=>String(x.id)!==String(de.dataset.deleteExercise));save();renderTraining()}
const done=e.target.closest('[data-set-done]');
if(done){
const [ei,si]=done.dataset.setDone.split('-').map(Number);
activeWorkout.exercises[ei].sets[si].done=!activeWorkout.exercises[ei].sets[si].done;
renderWorkout()
}
});

document.addEventListener('input',e=>{
const x=e.target.closest('[data-w-e]');

if(x&&activeWorkout){
const ei=Number(x.dataset.wE);
const si=Number(x.dataset.wS);
const k=x.dataset.wK;
const side=x.dataset.wSide;

if(side){
activeWorkout.exercises[ei].sets[si][side][k]=n(x.value);
}else{
activeWorkout.exercises[ei].sets[si][k]=n(x.value);
}
}
});

function renderAll(){renderHome();renderNutrition();renderTraining();renderProgress();renderSettings()}
renderAll();
