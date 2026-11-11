/* Fluxe Suivi — Écran Historique. */
import {S,done} from '../etat.js';
import {dn,esc,top,fmt,fmtDate,nset,ok,vol} from '../outils.js';
import {cline} from '../calculs.js';
import {bkLine} from '../rappel.js';
import {ico} from '../pictos.js';
export function viewHisto(){
const l=done().sort((a,b)=>b.date-a.date);
const nt=S.trash.length,tools=`<h2>Mes données</h2><p class="mu" style="margin-left:4px">Sauvegarde, versions de secours et corbeille : tout est au même endroit.</p><button class="sec" data-act="data" style="margin-bottom:14px">${ico('bouclier')}Sauvegarde et récupération${nt?' · '+nt+' dans la corbeille':''}</button>${done().length?'<p class="mu" style="margin:-6px 0 14px 4px">'+bkLine()+'</p>':''}`;
if(!l.length)return `<h1>Historique</h1><p class="empty">Tes séances terminées apparaîtront ici.</p>${tools}`;
return `<h1>Historique</h1><p class="sub">${l.length} séance${l.length>1?'s':''}</p>
${l.map(s=>`<div class="card"><div class="ex-head"><div><div class="hist-date">${esc(fmtDate(s.date))}</div><div class="mu">${nset(s)} séries · ${fmt(vol(s))} kg${s.dur?' · '+s.dur+' min':''}${s.gn?' · '+esc(s.gn):''}</div></div><div><button class="del" style="color:var(--accent)" data-act="editsess" data-id="${esc(s.id)}">Modifier</button><button class="del" data-act="delsess" data-id="${esc(s.id)}">Supprimer</button></div></div>
${s.exercises.map(e=>{if(e.cardio)return e.sets.some(dn)?`<div class="hist-ex"><b>${esc(e.name)}</b><div>${esc(cline(e))}</div></div>`:'';const d=e.sets.filter(ok);if(!d.length)return '';const b=top(d);return `<div class="hist-ex"><b>${esc(e.name)}</b><div>${d.length} série${d.length>1?'s':''} · meilleure ${esc(b.kg)} kg × ${esc(b.reps)}</div></div>`}).join('')}<button class="sec" style="margin-top:10px" data-act="mkr" data-id="${esc(s.id)}">${ico('signet')}Créer une routine avec cette séance</button></div>`).join('')}${tools}`;
}
