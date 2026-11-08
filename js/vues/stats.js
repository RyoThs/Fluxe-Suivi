/* Fluxe Suivi — Écran Stats. */
import {MU} from '../catalogue.js';
import {S,done} from '../etat.js';
import {e1,esc,fmt,fmtN,ok,vol} from '../outils.js';
import {csum} from '../calculs.js';
function wk(t){const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()}
let sx=null; /* exercice affiché dans la courbe */
export function setSx(v){sx=v}
export function viewStats(){
const l=done(),now=Date.now(),w0=wk(now),W=7*864e5;
/* Total du jour : repart à zéro chaque nuit, séance en cours comprise */
const d0=new Date().setHours(0,0,0,0),today=S.sessions.filter(x=>x.date>=d0).reduce((a,x)=>a+vol(x),0);
const weeks=[...Array(8)].map((_,k)=>{const t=w0-(7-k)*W;const v=l.filter(s=>wk(s.date)===t).reduce((a,s)=>a+vol(s),0);return{t,v}});
const mx=Math.max(1,...weeks.map(x=>x.v));
const bs=Object.create(null);l.forEach(s=>s.exercises.filter(e=>!e.cardio).forEach(e=>e.sets.filter(ok).forEach(x=>{const k=e.name;if(!bs[k]||e1(x)>e1(bs[k]))bs[k]=x})));
const rec=Object.entries(bs).sort((a,b)=>e1(b[1])-e1(a[1])).slice(0,8);
const nm=[...new Set(l.flatMap(s=>s.exercises.filter(e=>!e.cardio&&e.sets.some(ok)).map(e=>e.name)))];
if(!sx||!nm.includes(sx))sx=nm[0]||null;
const pts=sx?l.slice().sort((a,b)=>a.date-b.date).map(s=>{const e=s.exercises.find(e=>e.name===sx);return{t:s.date,v:e?e.sets.filter(ok).reduce((a,x)=>Math.max(a,e1(x)||0),0):0}}).filter(p=>p.v>0).slice(-12):[];
const pm=Math.max(1,...pts.map(p=>p.v));
const gv={};l.filter(s=>now-s.date<30*864e5).forEach(s=>s.exercises.forEach(e=>{if(e.cardio)return;const g=MU[e.name]||'Perso';gv[g]=(gv[g]||0)+e.sets.filter(ok).reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0)}));
const cs=l.filter(x=>now-x.date<W).flatMap(x=>x.exercises.filter(e=>e.cardio));
const cardio7=cs.length?`<div class="card"><div class="hist-date">Cardio</div><div class="mu">7 derniers jours</div><div class="stats" style="box-shadow:none;margin:10px 0 0"><div><b>${fmtN(cs.reduce((a,e)=>a+csum(e,'min'),0))}</b><span>minutes</span></div><div><b>${fmtN(cs.reduce((a,e)=>a+csum(e,'km'),0))}</b><span>km</span></div><div><b>${Math.round(cs.reduce((a,e)=>a+csum(e,'kcal'),0))}</b><span>kcal</span></div></div></div>`:'';
const gt=Object.values(gv).reduce((a,b)=>a+b,0)||1;
return `<h1>Stats</h1><p class="sub">Ta progression</p>
<div class="stats"><div><b>${l.length}</b><span>séances</span></div><div><b>${l.filter(s=>now-s.date<W).length}</b><span>7 derniers jours</span></div><div><b>${fmt(today)}</b><span>kg aujourd’hui</span></div></div>
<div class="card"><div class="hist-date">Volume par semaine</div><div class="mu">en kg, 8 dernières semaines</div><div class="chart" role="img" aria-label="Volume hebdomadaire">${weeks.map(x=>`<div><i style="height:${Math.round(x.v/mx*100)}px"></i>${new Date(x.t).getDate()}/${new Date(x.t).getMonth()+1}</div>`).join('')}</div></div>
<div class="card"><div class="hist-date">Progression par exercice</div><div class="mu">1RM estimé, 12 dernières séances</div>${nm.length?`<div class="chips">${nm.map(n=>`<button class="chip${n===sx?' on':''}" data-act="sx" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div><div class="chart" role="img" aria-label="Progression de ${esc(sx)}">${pts.map(p=>`<div><small>${fmt(p.v)}</small><i style="height:${Math.round(p.v/pm*100)}px"></i>${new Date(p.t).getDate()}/${new Date(p.t).getMonth()+1}</div>`).join('')}</div>`:'<p class="empty" style="margin:12px">Termine une séance pour voir ta progression.</p>'}</div>
<div class="card"><div class="hist-date">Répartition par groupe</div><div class="mu">volume des 30 derniers jours</div>${Object.entries(gv).sort((a,b)=>b[1]-a[1]).map(([g,v])=>`<div class="mg"><span>${esc(g)}</span><div><i style="width:${Math.round(v/gt*100)}%"></i></div><b>${Math.round(v/gt*100)}%</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de données.</p>'}</div>
${cardio7}<div class="card"><div class="hist-date">Records</div><div class="mu">1RM estimé (formule d’Epley)</div>${rec.map(([n,x])=>`<div class="rec"><div>${esc(n)}<br><span>${esc(x.kg)} kg × ${esc(x.reps)}</span></div><b>${fmt(e1(x))} kg</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de records.</p>'}</div>`;
}
