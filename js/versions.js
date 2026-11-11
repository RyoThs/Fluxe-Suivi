/* Fluxe Suivi — Versions de secours gardées dans IndexedDB (copie automatique, avant import…). */
import {KEY} from './config.js';
import {clean,load,unwrap} from './donnees.js';
import {S,done,warn} from './etat.js';
/* ===== Versions de secours (niveau 3) =====
   Copies complètes des données gardées dans IndexedDB (un autre coffre que le localStorage, avec plus de place).
   - auto : 1 par jour maximum, on garde les 5 dernières
   - avant un import, une restauration ou à la demande : on garde les 4 dernières */
export const VB={db:null,
open(){return this.db||(this.db=new Promise((ok,ko)=>{try{const r=indexedDB.open('fluxe-suivi-secours',1);r.onupgradeneeded=()=>r.result.createObjectStore('v',{keyPath:'at'});r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}catch(e){ko(e)}}))},
async run(mode,f){const db=await this.open();return new Promise((ok,ko)=>{const tx=db.transaction('v',mode),q=f(tx.objectStore('v'));tx.oncomplete=()=>ok(q&&q.result);tx.onerror=()=>ko(tx.error)})},
all(){return this.run('readonly',st=>st.getAll()).then(l=>(l||[]).sort((a,b)=>b.at-a.at))},
put(v){return this.run('readwrite',st=>st.put(v))},
del(at){return this.run('readwrite',st=>st.delete(at))}};
export const WHY={auto:'Copie automatique',imp:'Avant un import',rest:'Avant une restauration',man:'Créée à la main',old:'Ancienne copie (avant v2.1)',bad:'Données illisibles (copie gardée)'};
let lastAt=0;
export async function snap(why,raw){
try{
raw=raw||JSON.stringify(S);
const l=await VB.all();
if(why==='auto'){const a=l.find(v=>v.why==='auto');if(a&&(Date.now()-a.at<20*36e5||a.raw===raw))return false}
let at=Date.now();if(at<=lastAt)at=lastAt+1;lastAt=at;
let n=0;try{const p=clean(unwrap(JSON.parse(raw)));n=p?p.sessions.filter(x=>x.id!==p.current).length:0}catch(e){}
await VB.put({at,why,n,raw});
const same=l.filter(v=>(v.why==='auto')===(why==='auto')); /* l est trié du plus récent au plus ancien */
await Promise.all(same.slice((why==='auto'?5:4)-1).map(v=>VB.del(v.at)));
return true;
}catch(e){return false}
}
/* Au démarrage : copie du jour + récupération unique des anciennes copies gardées dans le localStorage */
export async function snapStart(){
try{if(!localStorage.getItem('fx-old-done')){for(const k of [KEY+'-sauvegarde',KEY+'-brut']){const o=localStorage.getItem(k);if(o)await snap('old',o)}localStorage.setItem('fx-old-done','1')}}catch(e){}
if(load.bad){await snap('bad',load.bad);warn('bad','⚠ Les données enregistrées sur ce téléphone étaient illisibles. Une copie a été gardée à part. Si tu as un fichier de sauvegarde, importe-le : Historique → Sauvegarde et récupération → Importer un fichier.')}
if(done().length)snap('auto');
}
