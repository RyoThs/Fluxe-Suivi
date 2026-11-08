/* Fluxe Suivi — Garde l'écran allumé pendant une séance. */
import {cur} from './etat.js';
/* Écran allumé pendant une séance (sinon il s'éteint entre deux séries) */
let wl=null,wb=false;
export async function veille(){
if(!('wakeLock' in navigator)||wb)return;wb=true;
try{if(cur()&&!cur().edit&&!wl&&document.visibilityState==='visible'){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null})}else if((!cur()||cur().edit)&&wl){await wl.release();wl=null}}catch(e){}
wb=false;
}
document.addEventListener('visibilitychange',veille);
