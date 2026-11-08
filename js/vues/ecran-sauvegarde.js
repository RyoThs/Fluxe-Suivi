/* Fluxe Suivi — Écran Sauvegarde : fichier, corbeille, versions de secours. */
import {BKD,J30} from '../config.js';
import {S,pk} from '../etat.js';
import {$,esc,fmt,fmtDate,nset,vol} from '../outils.js';
import {bkLine} from '../rappel.js';
import {VB,WHY} from '../versions.js';
/* ===== Écran « Sauvegarde » ===== */
export function viewData(){
const tr=S.trash.map((t,x)=>{const left=Math.max(1,Math.ceil((t.at+J30-Date.now())/864e5));return `<div class="vr"><div><b>${t.s?esc(fmtDate(t.s.date)):'Routine « '+esc(t.r.name)+' »'}</b><span>${t.s?nset(t.s)+' séries · '+fmt(vol(t.s))+' kg · ':''}effacée définitivement dans ${left} j</span></div><button class="del" style="color:var(--accent)" data-act="trest" data-x="${x}">Restaurer</button></div>`}).join('');
return `<p class="mu" style="margin-left:4px">Tes séances sont enregistrées uniquement sur ce téléphone. Trois protections les gardent à l’abri.</p>
<div class="card"><div class="hist-date">1. Fichier de sauvegarde</div><div class="mu">${S.lastBackup?'Dernière sauvegarde : '+esc(fmtDate(S.lastBackup)):'Aucune sauvegarde pour l’instant'}. Le fichier te permet aussi de changer de téléphone (iPhone ↔ Android).</div>${bkLine()?'<p class="mu" style="margin:8px 0 10px">'+bkLine()+'</p>':''}
<button class="btn" data-act="file">Sauvegarder (Fichiers, iCloud, mail…)</button>
<div class="dat" style="margin:10px 0 0"><button class="sec" data-act="imp">Importer un fichier</button><button class="sec" data-act="paste">Coller du texte</button></div><button class="ghost" data-act="export">Copier les données en texte</button><div class="mu" style="margin-top:12px">Me le rappeler si le dernier fichier a plus de :</div><div class="chips" style="margin:8px 0 0;flex-wrap:wrap;overflow:visible">${BKD.map(d=>`<button class="chip${(S.bkEvery||7)===d?' on':''}" data-act="bke" data-d="${d}">${d} jours</button>`).join('')}</div><div class="mu" style="margin-top:6px">…ou dès que 5 séances ne sont pas sauvegardées.</div></div>
<div class="card"><div class="hist-date">2. Versions de secours</div><div class="mu">Copies automatiques sur ce téléphone : une par jour (les 5 dernières), plus une avant chaque import ou restauration.</div><div id="vl"><p class="mu">Chargement…</p></div><button class="ghost" data-act="snapnow">Créer une version maintenant</button></div>
<div class="card"><div class="ex-head"><div class="hist-date">3. Corbeille</div>${S.trash.length?'<button class="del" data-act="tempty">Vider</button>':''}</div><div class="mu">Les séances et routines supprimées restent ici 30 jours.</div>${tr||'<p class="mu">La corbeille est vide.</p>'}</div>
<div class="card"><div class="hist-date">État du stockage</div><div class="mu" id="st">Vérification…</div></div>`;
}
export async function fillData(){
const vl=$('#vl'),st=$('#st');
try{const l=await VB.all();if(!pk||!pk.data)return;
vl.innerHTML=l.map(v=>`<div class="vr"><div><b>${esc(new Date(v.at).toLocaleString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</b><span>${esc(WHY[v.why]||'Copie')} · ${v.n} séance${v.n>1?'s':''}</span></div><button class="del" style="color:var(--accent)" data-act="vrest" data-at="${v.at}">Restaurer</button></div>`).join('')||'<p class="mu">Pas encore de version : la première sera créée automatiquement après ta première séance.</p>'}
catch(e){if(vl)vl.innerHTML='<p class="mu">Versions de secours indisponibles sur ce navigateur (navigation privée ?). Utilise le fichier de sauvegarde.</p>'}
let t='';
try{const p=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null;t=p===true?'✓ Stockage protégé : le téléphone ne doit pas l’effacer pour faire de la place.':p===false?'Stockage non garanti : ajoute Fluxe à l’écran d’accueil et sauvegarde régulièrement.':'';
if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();if(e&&e.usage!=null)t+=(t?' ':'')+'Espace utilisé : '+(e.usage/1048576).toFixed(1).replace('.',',')+' Mo.'}}catch(e){}
if(st&&pk&&pk.data)st.textContent=t||'Informations indisponibles sur ce navigateur.';
}
