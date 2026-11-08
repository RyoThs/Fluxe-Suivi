/* Fluxe Suivi — Panneaux plein écran : choix d'exercice, disques, import, nouvelle salle. */
import {LIB,M,MU,ONAIR,OTHERS,TG} from '../catalogue.js';
import {pk,setPk} from '../etat.js';
import {$,cname,esc,fmtN,norm} from '../outils.js';
import {names} from '../calculs.js';
import {MG,gymCur,inGym,vis} from '../salle.js';
import {thumb} from '../icones.js';
import {fillData,viewData} from './ecran-sauvegarde.js';
/* Ouvre un panneau plein écran (ou remplace celui déjà ouvert sans ajouter d'étape au bouton Retour) */
export function openSheet(o){if(!pk)history.pushState({fx:1},'');setPk(o);sheet()}
export function openPk(){const g=gymCur();openSheet({q:'',m:g&&g.eq.length?MG:'Tous'})}
export function openTool(){openSheet({tool:1,kg:'',bar:20})}
export function closePk(){setPk(null);sheet();if(history.state&&history.state.fx)history.back()}
window.addEventListener('popstate',()=>{if(pk){setPk(null);sheet()}});
export function sheet(){
const el=$('#sheet');
if(!pk){el.className='';el.innerHTML='';return}
el.className='on';
const top=t=>`<div class="sh-top"><span>${t}</span><button class="del" data-act="closepk" style="color:var(--accent);font-family:var(--body);font-size:16px">Fermer</button></div>`;
if(pk.data){el.innerHTML=top('Sauvegarde')+viewData();fillData();return}
if(pk.imp){const d=pk.imp,n=d.sessions.filter(x=>x.id!==d.current).length;el.innerHTML=top('Importer')+`<div class="card"><div class="hist-date">Fichier valide ✓</div><div class="mu">${n} séance${n>1?'s':''}, ${d.routines.length} routine${d.routines.length>1?'s':''}${d.gyms.length?', '+d.gyms.length+' salle'+(d.gyms.length>1?'s':''):''}.</div></div>
<div class="card"><button class="btn" data-act="imerge">Fusionner (conseillé)</button><p class="mu">Ajoute les séances qui manquent sur ce téléphone et garde la version la plus récente de chaque séance. Rien n’est effacé.</p></div>
<div class="card"><button class="sec" data-act="irepl">Tout remplacer</button><p class="mu">Les données de ce téléphone sont remplacées par celles du fichier. Une version de secours est créée juste avant.</p></div>`;return}
if(pk.gtpl){if(!pk.others)el.innerHTML=top('Nouvelle salle')+`<p class="mu" style="margin-left:4px">« ${esc(pk.gtpl)} » : par quoi veux-tu commencer ? Tu pourras cocher ou décocher chaque machine ensuite dans le Guide.</p>
<h2>⭐ Mon enseigne prioritaire</h2>
<button class="pi prio" data-act="gtpl" data-t="on-air"><div class="pt"><b>On Air</b><span>${esc(ONAIR.info)}</span><small>${ONAIR.groups.map(g=>esc(g.t)+' ('+g.eq().length+')'+(g.on?'':' : à cocher toi-même')).join(' · ')}</small></div></button>
<h2>Ou partir de zéro</h2>
<button class="pi" data-act="gtpl" data-t="vide"><div class="pt"><b>Je coche moi-même</b><span>Liste vide, idéal pour faire le tour de la salle</span></div></button>
<button class="pi" data-act="gtpl" data-t="base"><div class="pt"><b>Salle essentielle</b><span>Barres, haltères, poulies et machines guidées, sans les marques spécialisées</span></div></button>
<button class="pi" data-act="gtpl" data-t="tout"><div class="pt"><b>Salle très équipée</b><span>Toutes les machines du Guide (Hammer Strength, Eleiko…), tu décocheras celles qui manquent</span></div></button>
<button class="sec" data-act="gothers" style="margin-top:8px">Autres enseignes (Basic-Fit, Fitness Park…)</button>`;
if(pk.others)el.innerHTML=top('Autres enseignes')+`<p class="mu" style="margin-left:4px">« ${esc(pk.gtpl)} » · Choisis ton enseigne : ses machines probables seront cochées, et tu retrouveras toutes les machines des autres enseignes dans le « Catalogue autres enseignes » du Guide. Catalogue séparé d’On Air : ces modèles ne contiennent jamais les machines exclusives On Air. Machines probables d’après ce que chaque enseigne annonce publiquement : vérifie sur place et décoche ce qui manque.</p>
${OTHERS.map(c=>`<button class="pi" data-act="gtpl" data-t="${c.id}"><div class="pt"><b>${esc(c.name)}</b><span>${esc(c.info)}</span><small>Marques annoncées : ${esc(c.brands)}</small></div></button>`).join('')}`;return}
if(pk.tool){el.innerHTML=top('Disques')+`<p class="mu" style="margin-left:4px">Charge totale (barre comprise)</p><input id="dq" inputmode="decimal" maxlength="6" placeholder="Ex. 82,5" value="${esc(pk.kg)}" autocomplete="off" aria-label="Charge totale en kg"><div class="chips">${[20,15,10].map(b=>`<button class="chip${pk.bar===b?' on':''}" data-act="bar" data-b="${b}">Barre ${b} kg</button>`).join('')}</div><div id="dr">${discs()}</div>`;return}
el.innerHTML=top('Exercices')+`<input id="pq" placeholder="Rechercher ou créer" value="${esc(pk.q)}" autocomplete="off" aria-label="Rechercher"><div class="chips">${['Tous',...(gymCur()?[MG]:[]),...M].map(m=>`<button class="chip${pk.m===m?' on':''}" data-act="pm" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div><div id="pl">${plist()}</div>`;
}
/* Calculateur de disques : disques à mettre de chaque côté de la barre */
export function discs(){
const t=parseFloat(String(pk.kg).replace(',','.'));
if(!(t>0))return '<p class="empty">Entre une charge pour voir les disques de chaque côté.</p>';
if(t<pk.bar)return `<p class="empty">La barre seule pèse déjà ${pk.bar} kg.</p>`;
let r=(t-pk.bar)/2;const out=[];
for(const d of [25,20,15,10,5,2.5,1.25]){const n=Math.floor(r/d+1e-9);if(n){out.push(`<span class="chip on">${n} × ${fmtN(d)}</span>`);r-=n*d}}
return `<div class="card"><div class="mu">Pour chaque côté de la barre :</div><div class="chips" style="flex-wrap:wrap">${out.join('')||'<span class="mu">Aucun disque</span>'}</div>${r>.01?`<p class="mu">Il reste ${fmtN(r*2)} kg impossibles à charger avec ces disques.</p>`:''}</div>`;
}
export function plist(){
const q=norm(pk.q),own=names().filter(n=>!MU[n]).map(n=>[n,'Perso']);
const l=[...LIB,...own].filter(([n,m])=>vis(n)&&(pk.m==='Tous'||(pk.m===MG?inGym(n):m===pk.m))&&norm(n).includes(q));
const mk=(n,m,t)=>`<button class="pi" data-act="padd" data-n="${esc(n)}">${thumb(n)}<div class="pt"><b>${t}</b><span>${esc(m)}</span></div></button>`;
const nv=cname(pk.q);
const h=l.map(([n,m])=>mk(n,m+(TG[n]?' · '+TG[n]:''),esc(n))).join('')+(nv&&q&&![...LIB,...own].some(([n])=>norm(n)===q)?mk(nv,'Exercice perso','Créer « '+esc(nv)+' »'):'');
return h||(pk.m===MG?'<p class="empty">Aucune machine de ta salle ne correspond. Choisis « Tous » pour tout voir.</p>':'<p class="empty">Aucun résultat.</p>');
}
