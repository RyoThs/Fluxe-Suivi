/* Fluxe Suivi — Écran Séance : séance en cours, exercices, séries, cardio. */
import {MU,TG} from '../catalogue.js';
import {S,cur} from '../etat.js';
import {esc,mieux,fmt,fmtDate,fmtT,mins,nset,vol} from '../outils.js';
import {best,cline,prevCardio,prevSets,restFor,suggest} from '../calculs.js';
import {gymCur,noteOf} from '../salle.js';
import {DB,thumb} from '../icones.js';
import {backupCard} from '../rappel.js';
function cardioCard(e,i){
const pc=prevCardio(e.name),nt=noteOf(e.name);
return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name,'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">Cardio${TG[e.name]?' · '+esc(TG[e.name]):''}</div></div></div><button class="del" data-act="delex" data-i="${i}">Retirer</button></div>
${pc?`<div class="prev">Dernière fois : ${esc(cline(pc))}</div>`:''}
<input class="note" data-note="${i}" maxlength="200" placeholder="Note (niveau, inclinaison, vitesse…)" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Bloc</span><span>Durée (min)</span><span>Distance (km)</span><span>Calories</span><span></span></div>
${e.sets.map((x,j)=>`<div class="gr${x.done?' ok':''}"><span class="plate">${j+1}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="min" value="${esc(x.min)}" aria-label="Durée en minutes, bloc ${j+1}"><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="km" value="${esc(x.km)}" aria-label="Distance en km, bloc ${j+1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="kcal" value="${esc(x.kcal)}" aria-label="Calories, bloc ${j+1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider le bloc ${j+1}">✓</button></div>`).join('')}
<button class="ghost" data-act="addset" data-i="${i}">+ Ajouter un bloc</button></section>`;
}
export function viewSeance(){
const s=cur();
if(!s)return `<h1>Entraînement</h1><p class="sub">Lance une séance ou pars d’une routine.</p>${backupCard()}
<div class="card"><button class="btn big" data-act="start">${DB} Séance vide</button></div>
<h2>Routines</h2>
${S.routines.map((r,k)=>`<div class="card"><div class="ex-head"><div class="ex-name">${esc(r.name)}</div><button class="del" data-act="delr" data-k="${k}">Supprimer</button></div><div class="prev">${r.exercises.map(esc).join(', ')}</div><button class="btn" data-act="startr" data-k="${k}">Démarrer</button></div>`).join('')||'<p class="empty">Termine une séance pour l’enregistrer comme routine.</p>'}`;
const ed=!!s.edit;
return `<h1>${esc(fmtDate(s.date))}</h1><p class="sub">${ed?'Modification d’une séance passée':'Séance en cours'}</p>
<div class="stats"><div><b id="el">${ed?(s.dur||0):mins(s.date)}</b><span>minutes</span></div><div><b>${nset(s)}</b><span>séries</span></div><div><b>${fmt(vol(s))}</b><span>kg soulevés</span></div></div>
<div class="row"><button class="sec" data-act="rest">⏱ Repos par défaut : ${fmtT(S.rest||90)} (changer)</button></div>
<p class="mu" style="margin-left:4px">Astuce : touche le numéro d’une série pour la marquer comme échauffement (É).</p>
${s.exercises.map((e,i)=>exCard(s,e,i)).join('')}
<div class="row"><button class="btn" data-act="pick">+ Ajouter un exercice</button><button class="sec" data-act="tool">Calculateur de disques</button><button class="sec" data-act="finish">${ed?'Enregistrer les modifications':'Terminer la séance'}</button><button class="del" data-act="cancel">${ed?'Annuler les modifications':'Annuler la séance'}</button></div>`;
}
function exCard(s,e,i){
if(e.cardio)return cardioCard(e,i);
const pv=prevSets(e.name)||[],b=best(e.name),sg=s.edit?null:suggest(e.name),nt=noteOf(e.name);
let wi=-1;
return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name,'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">${esc(MU[e.name]||'Perso')}${TG[e.name]?' · '+esc(TG[e.name]):''}</div></div></div><button class="del" data-act="delex" data-i="${i}">Retirer</button></div>
${sg?`<button class="sg" data-act="sug" data-i="${i}">💡 ${esc(sg.txt)}<small>${esc(sg.why)}</small></button>`:''}
<input class="note" data-note="${i}" maxlength="200" placeholder="${gymCur()?'Réglage dans '+esc(gymCur().name)+' (siège, hauteur…)':'Note (réglage du siège, hauteur…)'}" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Série</span><span>Précédent</span><span>kg</span><span>Réps</span><span></span></div>
${e.sets.map((x,j)=>{if(!x.w)wi++;const p=x.w?null:pv[wi],pr=x.done&&!x.w&&b&&mieux(x,b);return `<div class="gr${x.done?' ok':''}"><button class="plate${x.w?' wu':''}" data-act="wu" data-i="${i}" data-j="${j}" aria-label="Série ${j+1} : ${x.w?'échauffement':'travail'}, toucher pour changer">${x.w?'É':wi+1}</button><span class="pv">${p?esc(p.kg)+'×'+esc(p.reps):'–'}${pr?'<span class="pr">PR</span>':''}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="kg" value="${esc(x.kg)}" aria-label="kg, série ${j+1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="reps" value="${esc(x.reps)}" aria-label="Répétitions, série ${j+1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider la série ${j+1}">✓</button></div>`}).join('')}
<button class="ghost" data-act="addset" data-i="${i}">+ Ajouter une série</button><button class="ghost" data-act="rex" data-i="${i}">⏱ Repos pour cet exercice : ${fmtT(restFor(e.name))}</button></section>`;
}
