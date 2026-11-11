/* Fluxe Suivi — Routines : création depuis une séance de l'historique, brouillon pour la modification, démarrage.
   Une routine : {id, name, exercises:[noms], sets:[[{kg,reps,w?}…] pour chaque exercice]} */
import {MU} from './catalogue.js';
import {done} from './etat.js';
import {ok,uid} from './outils.js';
import {newEx,prevCardio,prevSets} from './calculs.js';
export const estCardio=n=>MU[n]==='Cardio';
/* séries de travail d'un exercice de séance → séries prévues (poids, répétitions, échauffement) */
const copie=x=>{if('min' in x||'km' in x||'kcal' in x)return{min:x.min||'',km:x.km||'',kcal:x.kcal||''};const t={kg:x.kg,reps:x.reps};if(x.w)t.w=true;return t};
const plan=e=>e.sets.filter(x=>x.done!==false).map(copie);
export function depuisSeance(s,name){
const l=s.exercises.filter(e=>e.cardio||e.sets.some(ok));
return{id:uid(),name,exercises:l.map(e=>e.name),sets:l.map(plan)};
}
/* copie modifiable : chaque exercice reçoit ses séries (celles de la routine, sinon celles de la dernière fois) */
export function brouillon(r){
return{id:r.id,name:r.name,exercises:[...r.exercises],sets:r.exercises.map((n,i)=>{
 if(r.sets&&r.sets[i]&&r.sets[i].length)return r.sets[i].map(copie);
 if(estCardio(n)){const p=prevCardio(n);return p?p.sets.map(copie):[{min:'',km:'',kcal:''}]}
 return (prevSets(n)||[{kg:'',reps:''}]).map(copie)})};
}
/* bloc ou série vide à ajouter */
export const vide=n=>estCardio(n)?{min:'',km:'',kcal:''}:{kg:'',reps:''};
export const exercicesDe=r=>r.exercises.map((n,i)=>newEx(n,r.sets&&r.sets[i]));
/* nombre de séries prévues pour un exercice (null si non défini) */
export function nbSeries(r,i){const n=r.exercises[i],l=r.sets&&r.sets[i]&&r.sets[i].length?r.sets[i]:estCardio(n)?(prevCardio(n)||{}).sets:prevSets(n);return l?l.length:null}
/* date de la dernière séance lancée depuis cette routine */
export function derniere(r){if(!r.id)return null;return done().filter(s=>s.rt===r.id).reduce((m,s)=>Math.max(m,s.date),0)||null}
export function ilYa(t){const j=Math.floor((new Date().setHours(0,0,0,0)-new Date(t).setHours(0,0,0,0))/864e5);return j<=0?'aujourd’hui':j===1?'hier':'il y a '+j+' jours'}
