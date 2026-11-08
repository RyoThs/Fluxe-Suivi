/* Fluxe Suivi — État de l'application (tes données S, onglet, panneau ouvert), enregistrement et messages. */
import {KEY} from './config.js';
import {load} from './donnees.js';
export let S=load(),tab='seance',pk=null;
/* Règle des modules : ces trois variables ne se modifient QUE par ces fonctions */
export function setS(d){S=d}
export function setTab(t){tab=t}
export function setPk(o){pk=o}
const MSG_SAVE='⚠ Impossible d’enregistrer sur ce navigateur : tes séances seront perdues à la fermeture. Ouvre Fluxe depuis l’icône de l’écran d’accueil (pas en navigation privée) et fais une sauvegarde.';
let saveFail=false;const wm={};
export function warn(k,m){wm[k]=m;const t=Object.values(wm).filter(Boolean).join(' '),w=document.querySelector('#warn');w.textContent=t;w.hidden=!t}
export function save(){try{localStorage.setItem(KEY,JSON.stringify(S));if(saveFail){saveFail=false;warn('save','')}}catch(e){if(!saveFail){saveFail=true;warn('save',MSG_SAVE)}}}
let tt2=0;
export function toast(m){const e=document.querySelector('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tt2);tt2=setTimeout(()=>e.classList.remove('on'),3200)}
export const cur=()=>S.sessions.find(x=>x.id===S.current);
export const done=()=>S.sessions.filter(x=>x.id!==S.current);
/* contrôles au démarrage : stockage disponible, fichiers de la même version, stockage durable */
try{localStorage.setItem('fx-test','1');localStorage.removeItem('fx-test')}catch(e){saveFail=true;warn('save',MSG_SAVE)}
