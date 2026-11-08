/* Fluxe Suivi — Écran Guide « ? » et carte Ma salle. */
import {VER} from '../config.js';
import {C1,C2,LIB,M,ONAIR,OTHERCAT,whoHas} from '../catalogue.js';
import {S} from '../etat.js';
import {esc,norm} from '../outils.js';
import {MG,chainOf,gymCur,inGym,vis} from '../salle.js';
import {thumb} from '../icones.js';
/* Sélecteur d’exercices (le bouton Retour d’Android le ferme) */
export let gq='',gm='Tous'; /* recherche et filtre du Guide */
export function setGq(v){gq=v}
export function setGm(v){gm=v}
export function glist(){
const g=gymCur();if(!g&&(gm===MG||gm===C1||gm===C2))gm='Tous';
const q=norm(gq),row=([n,m,tg])=>{const on=g&&inGym(n);return `<div class="gi${on?' in':''}">${thumb(n,'lg')}<div class="pt"><b>${esc(n)}</b><span>${esc(m)}${tg?' · '+esc(tg):''}</span>${gm===C2&&whoHas(n).length?'<small class="who">'+esc(whoHas(n).join(' · '))+'</small>':''}</div>${g?`<button class="tg${on?' on':''}" data-act="gtog" data-n="${esc(n)}" aria-pressed="${!!on}" aria-label="${on?'Retirer de':'Ajouter à'} ${esc(g.name)} : ${esc(n)}">${on?'✓':'+'}</button>`:''}</div>`},match=([n])=>norm(n).includes(q);
/* Catalogue de l'enseigne : rangé par familles (On Air) ou en une liste (autres enseignes) */
if(gm===C1||gm===C2){const L=n=>LIB.find(x=>x[0]===n),seen=new Set();
return (gm===C1?ONAIR:OTHERCAT).groups.map(gr=>{const l=gr.eq().filter(n=>!seen.has(n)&&seen.add(n)).map(L).filter(Boolean).filter(match);return l.length?`<h2 class="cg">${esc(gr.t)}<small>${l.length}</small></h2>${l.map(row).join('')}`:''}).join('')||'<p class="empty">Aucun résultat.</p>'}
const l=LIB.filter(([n,m])=>vis(n)&&(gm==='Tous'||(gm===MG?inGym(n):m===gm))&&match([n]));
return l.map(row).join('')||`<p class="empty">${gm===MG?'Aucune machine cochée pour l’instant. Choisis « Tous » et touche + sur les machines de ta salle.':'Aucun résultat.'}</p>`;
}
/* Carte « Ma salle » en haut du Guide */
export function gymCard(){
const g=gymCur();
if(!S.gyms.length)return `<div class="card gym"><div class="hist-date">🏋️ Ma salle</div><div class="mu">Crée ta salle : tu cocheras les machines qu’elle possède, tu ne verras qu’elles en choisissant un exercice, et tes réglages (siège, hauteur…) seront propres à cette salle.</div><button class="btn" data-act="gnew">Créer ma salle</button></div>`;
return `<div class="card gym"><div class="ex-head"><div><div class="hist-date">🏋️ ${g?esc(g.name):'Aucune salle choisie'}</div><div class="mu">${g?g.eq.length+' machine'+(g.eq.length>1?'s':'')+' cochée'+(g.eq.length>1?'s':'')+' · touche + pour en ajouter':'Choisis la salle où tu t’entraînes.'}</div></div>${g?`<button class="del" style="color:var(--accent)" data-act="gren">Renommer</button>`:''}</div>
<div class="chips">${S.gyms.map(x=>`<button class="chip${x.id===S.gym?' on':''}" data-act="gsel" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}<button class="chip" data-act="gsel" data-id="">Aucune</button><button class="chip" data-act="gnew">+ Nouvelle</button></div>
${chainOf(g)?`<p class="mu">Modèle ${esc(chainOf(g).name)} (marques annoncées : ${esc(chainOf(g).brands)}). Liste probable : vérifie sur place et décoche ce qui manque.</p>`:''}
${g?`<button class="del" data-act="gdel">Supprimer cette salle</button>`:''}</div>`;
}
export function viewGuide(){
const ch=['Tous',...(gymCur()?[MG,C1,C2]:[]),...M];
return `<h1>Guide</h1><p class="sub">Repère les machines avant de créer ta routine. Chaque dessin montre le type de machine à repérer dans la salle.</p>${gymCard()}
<input id="gq" placeholder="Rechercher une machine" value="${esc(gq)}" autocomplete="off" aria-label="Rechercher une machine"><div class="chips">${ch.map(m=>`<button class="chip${gm===m?' on':''}${m===C1?' star':''}" data-act="gm" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div><div id="gl">${glist()}</div><p class="mu" style="text-align:center;margin-top:18px">Fluxe v${VER}</p>`;
}
