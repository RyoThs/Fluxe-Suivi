/* Fluxe Suivi — Point de départ : vérifie la version, lance les copies de secours, affiche l'app. */
import {VER} from './config.js';
import {warn} from './etat.js';
import {render} from './rendu.js';
import {snapStart} from './versions.js';
import './actions.js'; /* boutons et saisie */
import './installation.js'; /* bouton Installer */
import './ecran.js'; /* pas de zoom, portrait */
/* Mise à jour bloquée (ancienne copie gardée par le téléphone) : l'app se répare toute seule.
   Elle force la mise à jour du service worker, vide SES caches (jamais tes données : elles sont ailleurs) et recharge.
   Une seule tentative par minute, pour ne jamais tourner en boucle. */
async function heal(){
try{const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(r)await r.update()}catch(e){}
try{for(const k of await caches.keys())if(k.startsWith('fluxe-suivi-'))await caches.delete(k)}catch(e){}
location.reload();
}
{const mv=document.querySelector('meta[name="app-version"]');if(!mv||mv.content!==VER){
let t=0;try{t=+sessionStorage.getItem('fx-heal')||0}catch(e){}
if(Date.now()-t>60000){try{sessionStorage.setItem('fx-heal',String(Date.now()))}catch(e){}warn('ver','Mise à jour de Fluxe en cours…');heal()}
else warn('ver','La mise à jour n’est pas encore arrivée. Ferme complètement Fluxe, attends quelques minutes puis rouvre-la. Tes séances ne sont pas touchées.')}}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
snapStart();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
render();
