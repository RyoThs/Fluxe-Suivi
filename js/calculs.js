/* Fluxe Suivi — Calculs sur l'historique : séries précédentes, records, suggestion de charge, cardio. */
import {MU} from './catalogue.js';
import {S,done} from './etat.js';
import {K,dn,e1,fmtN,norm,ok} from './outils.js';
export function prevSets(name){
for(const s of done().sort((a,b)=>b.date-a.date)){const e=s.exercises.find(e=>norm(e.name)===norm(name));if(e){const l=e.sets.filter(ok);if(l.length)return l}}
return null;
}
/* meilleur 1RM estimé déjà réalisé sur un exercice (sert au badge PR) */
export function best(name){return done().reduce((m,s)=>{const e=s.exercises.find(e=>norm(e.name)===norm(name));return e?e.sets.filter(ok).reduce((a,x)=>Math.max(a,e1(x)||0),m):m},0)}
export function newEx(name){if(MU[name]==='Cardio')return{name,cardio:true,sets:[{min:'',km:'',kcal:'',done:false}]};const p=prevSets(name);return{name,sets:(p||[{kg:'',reps:''}]).map(x=>({kg:x.kg,reps:x.reps,done:false}))}}
export function names(){const st=new Set();S.sessions.forEach(s=>s.exercises.forEach(e=>st.add(e.name)));return [...st]}
export const restFor=n=>(S.rests&&S.rests[K(n)])||S.rest||90;
/* Suggestion de charge (double progression) d'après la meilleure série de la dernière séance */
export function suggest(name){
const p=prevSets(name);if(!p)return null;
const b=p.reduce((a,x)=>e1(x)>e1(a)?x:a),kg=+b.kg,r=+b.reps;
if(!(kg>=0)||!(r>0))return null;
const g=MU[name]==='Jambes'||MU[name]==='Fessiers'?5:2.5;
if(r>=12)return{kg:kg+g,txt:fmtN(kg+g)+' kg × 8',why:'12 reps ou plus la dernière fois : on monte la charge'};
if(r>=8)return{kg,txt:fmtN(kg)+' kg × '+(r+1),why:'même charge, une répétition de plus'};
return{kg,txt:fmtN(kg)+' kg × 8',why:'même charge, vise 8 répétitions'};
}
export const csum=(e,k)=>e.sets.filter(dn).reduce((a,x)=>a+(+x[k]||0),0);
export const cline=e=>{const p=[fmtN(csum(e,'min'))+' min'];if(csum(e,'km'))p.push(fmtN(csum(e,'km'))+' km');if(csum(e,'kcal'))p.push(Math.round(csum(e,'kcal'))+' kcal');return p.join(' · ')};
export function prevCardio(name){for(const s of done().sort((a,b)=>b.date-a.date)){const e=s.exercises.find(e=>e.cardio&&norm(e.name)===norm(name));if(e&&e.sets.some(dn))return e}return null}
