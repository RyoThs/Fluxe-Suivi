/* Fluxe Suivi — Minuteur de repos et durée de la séance.
   - Réglable pendant le repos : −15 s / +15 s, ou un temps direct (30 s, 45 s, 1 min, 1:30, 2 min).
   - « Garder pour <exercice> » enregistre le temps choisi pour les prochaines fois.
   - Fin du repos : une vibration courte (si le téléphone l'autorise) et un léger clignotement. Aucun son. */
import {S,cur,save,toast} from './etat.js';
import {$,K,esc,fmtT,mins} from './outils.js';
export const RAPIDES=[30,45,60,90,120];
export const dureeTxt=n=>n<60?n+' s':n%60?Math.floor(n/60)+' min '+String(n%60).padStart(2,'0'):n/60+' min';
let tEnd=0,tDeb=0,tInt=null,tTot=90000,tNom='',ouvert=false;
export function tStart(sec,nom){tTot=(sec||S.rest||90)*1000;tDeb=Date.now();tEnd=tDeb+tTot;tNom=nom||'';ouvert=false;$('#timer').classList.remove('fin');$('#timer').classList.add('on');reglages();tick();clearInterval(tInt);tInt=setInterval(tick,250)}
function tick(){
const r=Math.max(0,Math.ceil((tEnd-Date.now())/1000));
$('#tt').textContent=fmtT(r);
$('#tb').style.width=(Math.max(0,tEnd-Date.now())/tTot*100)+'%';
if(r<=0){clearInterval(tInt);tInt=null;signal();setTimeout(()=>{if(!tInt)$('#timer').classList.remove('on','fin')},2500)}
}
/* −15 s / +15 s pendant le repos (jamais moins de 5 s restantes) */
export function tAdd(ms){if(!tInt)return;tEnd=Math.max(Date.now()+5000,tEnd+ms);tTot=Math.max(15000,tEnd-tDeb);tick();reglages()}
/* temps direct : le repos dure « sec » secondes depuis son début */
export function tSet(sec){if(!tInt)return;tTot=sec*1000;tEnd=tDeb+tTot;tick();reglages()}
export function tStop(){clearInterval(tInt);tInt=null;$('#timer').classList.remove('on','fin')}
export function tToggle(){ouvert=!ouvert;reglages()}
/* garde le temps actuel pour cet exercice (arrondi à 15 s) */
export function tKeep(){
const sec=Math.min(600,Math.max(15,Math.round(tTot/15000)*15));
if(!tNom){S.rest=sec}else{S.rests=S.rests||{};S.rests[K(tNom)]=sec}
save();toast('Repos de '+dureeTxt(sec)+(tNom?' gardé pour '+tNom:' par défaut')+' ✓');reglages();
}
/* rangée de réglages sous le chrono */
function reglages(){
const z=$('#tc'),bt=$('#timer [data-act=tcfg]');if(!z)return;
if(bt)bt.setAttribute('aria-expanded',String(ouvert));
z.hidden=!ouvert;if(!ouvert){z.innerHTML='';return}
const sec=Math.round(tTot/1000);
z.innerHTML=`<div class="tcb"><button data-act="t-">−15 s</button>${RAPIDES.map(v=>`<button data-act="tset" data-s="${v}" class="${v===sec?'on':''}">${v<60?v+' s':fmtT(v).replace(':00',' min')}</button>`).join('')}<button data-act="t+">+15 s</button></div><button class="keep" data-act="tkeep">Garder ${dureeTxt(sec)}${tNom?' pour '+esc(tNom):' par défaut'}</button>`;
}
/* Vibration courte. Android : navigator.vibrate. iPhone (iOS 17.5+) : un interrupteur caché, dont le basculement fait vibrer le téléphone. */
let iosSwitch=null;
function vibrer(){
try{if(navigator.vibrate&&navigator.vibrate(90))return}catch(e){}
try{
 if(!iosSwitch){const l=document.createElement('label');l.setAttribute('aria-hidden','true');l.style.cssText='position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';l.innerHTML='<input type="checkbox" switch tabindex="-1">';document.body.appendChild(l);iosSwitch=l}
 iosSwitch.click();
}catch(e){}
}
function signal(){$('#timer').classList.add('fin');if(!S.nv)vibrer()}
setInterval(()=>{const e=$('#el'),s=cur();if(e&&s&&!s.edit)e.textContent=mins(s.date)},20000);
