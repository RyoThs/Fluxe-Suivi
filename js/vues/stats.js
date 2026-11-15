/* Fluxe Suivi — Écran Stats. */
import {MU} from '../catalogue.js';
import {S,done} from '../etat.js';
import {esc,fmt,fmtN,mieux,ok,vol} from '../outils.js';
import {csum} from '../calculs.js';
import {MESURES,PERIODES,dessin,points,resume} from '../courbe.js';
function wk(t){const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()}
/* Courbe de progression : exercice affiché, mesure, période, point touché */
let sx=null,cm='max',cp='m3',csel=-1;
export function setSx(v){sx=v;csel=-1}
export function setCm(v){if(MESURES[v]){cm=v;csel=-1}}
export function setCp(v){if(PERIODES[v]){cp=v;csel=-1}}
export function setCsel(v){csel=Number.isInteger(v)?v:-1}
const SOUS={max:'Charge la plus lourde de chaque séance',rm:'Le poids que tu pourrais soulever 1 seule fois',vol:'Poids × répétitions × séries, à chaque séance'};
function progression(l,nm){
if(!nm.length)return '<p class="empty" style="margin:12px">Termine une séance pour voir ta progression.</p>';
const pts=points(l,sx,cm,cp);
const seg=(liste,cour,act,cls)=>`<div class="seg ${cls}" role="group">${liste.map(([v,t])=>`<button class="${cour===v?'on':''}" data-act="${act}" data-v="${v}" aria-pressed="${cour===v}">${t}</button>`).join('')}</div>`;
return `<div class="chips">${nm.map(n=>`<button class="chip${n===sx?' on':''}" data-act="sx" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div>
${seg(Object.entries(MESURES),cm,'cm','cm-seg')}<div class="mu">${SOUS[cm]}</div>
<div class="chead">${resume(pts,cm)}${seg(Object.entries(PERIODES).map(([v,[t]])=>[v,t]),cp,'cp','cp-seg')}</div>
${dessin(pts,cm,csel)}${cm==='rm'?'<p class="cnote">Calculé avec ta meilleure série de 1 à 12 répétitions (formule d’Epley). C’est une estimation : ne cherche pas à la tester sans partenaire.</p>':''}`;
}
export function viewStats(){
const l=done(),now=Date.now(),w0=wk(now),W=7*864e5;
/* Total du jour : repart à zéro chaque nuit, séance en cours comprise */
const d0=new Date().setHours(0,0,0,0),today=S.sessions.filter(x=>x.date>=d0).reduce((a,x)=>a+vol(x),0);
const weeks=[...Array(8)].map((_,k)=>{const t=w0-(7-k)*W;const v=l.filter(s=>wk(s.date)===t).reduce((a,s)=>a+vol(s),0);return{t,v}});
const mx=Math.max(1,...weeks.map(x=>x.v));
const nm=[...new Set(l.flatMap(s=>s.exercises.filter(e=>!e.cardio&&e.sets.some(ok)).map(e=>e.name)))];
if(!sx||!nm.includes(sx))sx=nm[0]||null;
const gv={};l.filter(s=>now-s.date<30*864e5).forEach(s=>s.exercises.forEach(e=>{if(e.cardio)return;const g=MU[e.name]||'Perso';gv[g]=(gv[g]||0)+e.sets.filter(ok).reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0)}));
const cs=l.filter(x=>now-x.date<W).flatMap(x=>x.exercises.filter(e=>e.cardio));
const cardio7=cs.length?`<div class="card"><div class="hist-date">Cardio</div><div class="mu">7 derniers jours</div><div class="stats" style="box-shadow:none;margin:10px 0 0"><div><b>${fmtN(cs.reduce((a,e)=>a+csum(e,'min'),0))}</b><span>minutes</span></div><div><b>${fmtN(cs.reduce((a,e)=>a+csum(e,'km'),0))}</b><span>km</span></div><div><b>${Math.round(cs.reduce((a,e)=>a+csum(e,'kcal'),0))}</b><span>kcal</span></div></div></div>`:'';
const gt=Object.values(gv).reduce((a,b)=>a+b,0)||1;
return `<h1>Stats</h1><p class="sub">Ta progression</p>
<div class="stats"><div><b>${l.length}</b><span>séances</span></div><div><b>${l.filter(s=>now-s.date<W).length}</b><span>7 derniers jours</span></div><div><b>${fmt(today)}</b><span>kg aujourd’hui</span></div></div>
<div class="card"><div class="hist-date">Volume par semaine</div><div class="mu">en kg, 8 dernières semaines</div><div class="chart" role="img" aria-label="Volume hebdomadaire">${weeks.map(x=>`<div><i style="height:${Math.round(x.v/mx*100)}px"></i>${new Date(x.t).getDate()}/${new Date(x.t).getMonth()+1}</div>`).join('')}</div></div>
<div class="card prog"><div class="hist-date">Progression par exercice</div>${progression(l,nm)}</div>
<div class="card"><div class="hist-date">Répartition par groupe</div><div class="mu">volume des 30 derniers jours</div>${Object.entries(gv).sort((a,b)=>b[1]-a[1]).map(([g,v])=>`<div class="mg"><span>${esc(g)}</span><div><i style="width:${Math.round(v/gt*100)}%"></i></div><b>${Math.round(v/gt*100)}%</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de données.</p>'}</div>
${cardio7}${records(l)}`;
}
/* Records : 3 onglets
   - max   : charge la plus lourde soulevée (hors échauffement)
   - serie : meilleure série = poids × répétitions sur une seule série
   - vol   : volume sur une séance = poids × répétitions, additionné sur toutes les séries de l'exercice */
let rx='max';
export function setRx(v){rx=['max','serie','vol'].includes(v)?v:'max'}
const jour=t=>new Date(t).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
function records(l){
const bs=Object.create(null);
l.forEach(s=>s.exercises.filter(e=>!e.cardio).forEach(e=>{const k=e.name,ss=e.sets.filter(ok);if(!ss.length)return;
 if(rx==='vol'){const v=ss.reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0);if(v>0&&(!bs[k]||v>bs[k].v))bs[k]={v,d:ss.length+' série'+(ss.length>1?'s':''),t:s.date};return}
 ss.forEach(x=>{
  if(rx==='serie'){const v=(+x.kg||0)*(+x.reps||0);if(v>0&&(!bs[k]||v>bs[k].v))bs[k]={v,d:fmtN(+x.kg||0)+' kg × '+x.reps,t:s.date}}
  else if(!bs[k]||mieux(x,bs[k].x))bs[k]={x,v:+x.kg||0,d:x.reps+' répétition'+(+x.reps>1?'s':''),t:s.date}})}));
const rec=Object.entries(bs).sort((a,b)=>rx==='max'?(mieux(b[1].x,a[1].x)?1:-1):b[1].v-a[1].v).slice(0,8);
const sous={max:'Charge la plus lourde soulevée (hors échauffement)',serie:'Poids × répétitions sur une seule série',vol:'Poids × répétitions × séries, sur une séance'}[rx];
const seg=`<div class="seg rec-seg" role="group" aria-label="Type de record">${[['max','Poids max'],['serie','Meilleure série'],['vol','Volume']].map(([v,t])=>`<button class="${rx===v?'on':''}" data-act="rx" data-v="${v}" aria-pressed="${rx===v}">${t}</button>`).join('')}</div>`;
return `<div class="card"><div class="hist-date">Records</div>${seg}<div class="mu">${sous}</div>${rec.map(([n,r])=>`<div class="rec"><div>${esc(n)}<br><span>${esc(r.d)} · ${jour(r.t)}</span></div><b>${rx==='max'?fmtN(r.v):fmt(r.v)} kg</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de records.</p>'}</div>`;
}
