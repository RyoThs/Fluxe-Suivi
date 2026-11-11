/* Fluxe Suivi — Panneaux plein écran : choix d'exercice, disques, import, nouvelle salle. */
import {LIB,M,MU,TG} from '../catalogue.js';
import {pk,setPk} from '../etat.js';
import {$,cname,esc,fmtN,norm} from '../outils.js';
import {names} from '../calculs.js';
import {catCur,catName,gymCur,inGym,vis} from '../salle.js';
import {ensCards} from './guide.js';
import {thumb} from '../icones.js';
import {fillData,viewData} from './ecran-sauvegarde.js';
/* Ouvre un panneau plein écran (ou remplace celui déjà ouvert sans ajouter d'étape au bouton Retour) */
export function openSheet(o){if(!pk)history.pushState({fx:1},'');setPk(o);sheet()}
/* Choix d'exercice : v = 'salle' ou 'tout', m = muscle ('Tous' ou Pectoraux…) */
export function openPk(){const g=gymCur();openSheet({q:'',v:g&&g.eq.length?'salle':'cat',m:'Tous'})}
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
if(pk.ens){const g=gymCur();
el.innerHTML=top(pk.ens.chg?'Changer d’enseigne':'Nouvelle salle')+`<p class="mu" style="margin-left:4px">${pk.ens.chg?'Toutes les machines de la nouvelle enseigne seront cochées (tes coches actuelles seront remplacées, tes réglages gardés).':'Choisis l’enseigne de ta salle : toutes ses machines seront cochées.'}</p>${ensCards(pk.ens.chg&&g?(g.chain||'autre'):'')}`;return}
if(pk.tool){el.innerHTML=top('Disques')+`<p class="mu" style="margin-left:4px">Charge totale (barre comprise)</p><input id="dq" inputmode="decimal" maxlength="6" placeholder="Ex. 82,5" value="${esc(pk.kg)}" autocomplete="off" aria-label="Charge totale en kg"><div class="chips">${[20,15,10].map(b=>`<button class="chip${pk.bar===b?' on':''}" data-act="bar" data-b="${b}">Barre ${b} kg</button>`).join('')}</div><div id="dr">${discs()}</div>`;return}
const vues=gymCur()?`<div class="seg" role="group">${[['salle','Ma salle · '+(gymCur()?gymCur().eq.length:0)],['cat',catName()]].map(([v,x])=>`<button class="${pk.v===v?'on':''}" data-act="pv" data-v="${v}" aria-pressed="${pk.v===v}">${x}</button>`).join('')}</div>`:'';
el.innerHTML=top('Exercices')+vues+`<input id="pq" placeholder="Rechercher ou créer" value="${esc(pk.q)}" autocomplete="off" aria-label="Rechercher"><div class="chips">${['Tous',...M].map(m=>`<button class="chip${pk.m===m?' on':''}" data-act="pm" data-m="${esc(m)}">${m==='Tous'?'Tous les muscles':esc(m)}</button>`).join('')}</div><div id="pl">${plist()}</div>`;
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
/* Avec un texte recherché : toute la bibliothèque. Sinon : Ma salle (machines cochées) ou le catalogue de l'enseigne. Tes exercices perso sont toujours là. */
const g=gymCur(),sal=g&&!q&&pk.v==='salle',cat=g&&!q&&pk.v==='cat'?new Set(catCur()):null;
const l=[...LIB,...own].filter(([n,m])=>vis(n)&&(m==='Perso'||(!sal||inGym(n))&&(!cat||cat.has(n)))&&(pk.m==='Tous'||m===pk.m)&&norm(n).includes(q));
const mk=(n,m,t,tg)=>`<button class="pi" data-act="padd" data-n="${esc(n)}">${thumb(n)}<div class="pt"><b>${t}</b><span>${esc(m)}${tg?` <em class="mk">${esc(tg)}</em>`:''}</span></div></button>`;
const nv=cname(pk.q);
const h=l.map(([n,m])=>mk(n,m,esc(n),TG[n])).join('')+(nv&&q&&![...LIB,...own].some(([n])=>norm(n)===q)?mk(nv,'Exercice perso','Créer « '+esc(nv)+' »'):'');
return h||(sal?'<p class="empty">Aucune machine de ta salle ne correspond. Regarde dans le catalogue.</p>':'<p class="empty">Aucun résultat.</p>');
}
