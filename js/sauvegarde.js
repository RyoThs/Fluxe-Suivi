/* Fluxe Suivi — Fichier de sauvegarde, import, fusion et corbeille. */
import {FORMAT,VER} from './config.js';
import {clean,unwrap} from './donnees.js';
import {S,pk,save,toast} from './etat.js';
import {norm} from './outils.js';
import {render} from './rendu.js';
import {openSheet,sheet} from './vues/panneaux.js';
import {avertir} from './dialogue.js';
/* ===== Sauvegarde vers un fichier (format versionné) et partage ===== */
export const pack=()=>JSON.stringify({app:'fluxe-suivi',format:FORMAT,version:VER,exportedAt:new Date().toISOString(),data:S},null,1);
export function saveFile(){
const name='fluxe-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json',txt=pack();
const okd=()=>{S.lastBackup=Date.now();save();render();if(pk&&pk.data)sheet()};
let f=null;try{f=new File([txt],name,{type:'application/json'})}catch(e){}
/* iPhone / Android : feuille de partage (Enregistrer dans Fichiers, iCloud Drive, mail…) */
if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Sauvegarde Fluxe'}).then(()=>{okd();toast('Sauvegarde envoyée ✓')}).catch(e=>{if(e&&e.name!=='AbortError')download(txt,name,okd)});return}
download(txt,name,okd);
}
function download(txt,name,okd){const u=URL.createObjectURL(new Blob([txt],{type:'application/json'}));const l=document.createElement('a');l.href=u;l.download=name;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);okd();toast('Fichier de sauvegarde téléchargé ✓')}
/* ===== Import : on vérifie le fichier, puis on propose Fusionner ou Remplacer ===== */
export function imp(t){
if(typeof t!=='string'||t.length>5e6){avertir({icone:'alerte',ton:'ambre',titre:'Données trop volumineuses',texte:'Ce n’est pas une sauvegarde Fluxe. Rien n’a été modifié.'});return}
let d=null;try{d=clean(unwrap(JSON.parse(t)))}catch(e){}
if(!d){avertir({icone:'alerte',ton:'ambre',titre:'Fichier non reconnu',texte:'Ce fichier n’est pas une sauvegarde Fluxe valide. Rien n’a été modifié.'});return}
openSheet({imp:d});
}
/* Fusion : rien n'est effacé. Pour une même séance (même id), la version modifiée le plus récemment gagne.
   Une séance mise à la corbeille sur ce téléphone n'est pas ressuscitée. */
export function merge(d){
const r={add:0,upd:0,skip:0},pos=new Map(S.sessions.map((s,i)=>[s.id,i])),tr=new Set(S.trash.filter(t=>t.s).map(t=>t.s.id));
for(const s of d.sessions){
if(s.id===d.current)continue; /* séance encore en cours dans le fichier : ignorée */
delete s.edit;
if(!pos.has(s.id)){if(tr.has(s.id)){r.skip++;continue}pos.set(s.id,S.sessions.length);S.sessions.push(s);r.add++}
else{const i=pos.get(s.id),l=S.sessions[i];if(l.id!==S.current&&(s.mod||s.date)>(l.mod||l.date)){S.sessions[i]=s;r.upd++}}
}
for(const x of d.routines)if(!S.routines.some(y=>norm(y.name)===norm(x.name)))S.routines.push(x);
for(const [k,v] of Object.entries(d.notes))if(!S.notes[k])S.notes[k]=v;
for(const [k,v] of Object.entries(d.rests))if(!S.rests[k])S.rests[k]=v;
if(!S.rest&&d.rest)S.rest=d.rest;
for(const g of d.gyms){const l=S.gyms.find(x=>x.id===g.id);if(!l){if(S.gyms.length<20)S.gyms.push(g);continue}g.eq.forEach(n=>{if(!l.eq.some(x=>norm(x)===norm(n)))l.eq.push(n)});for(const [k,v] of Object.entries(g.notes))if(!l.notes[k])l.notes[k]=v}
if(!S.gym&&d.gym&&S.gyms.some(g=>g.id===d.gym))S.gym=d.gym;
return r;
}
/* ===== Corbeille ===== */
export function toTrash(o){S.trash.unshift(Object.assign({at:Date.now()},o));if(S.trash.length>500)S.trash.length=500}
