/* Fluxe Suivi — Minuteur de repos et durée de la séance. */
import {S,cur} from './etat.js';
import {$,fmtT,mins} from './outils.js';
/* Minuteur de repos */
let tEnd=0,tInt=null,tTot=90000;
export function tStart(sec){tTot=(sec||S.rest||90)*1000;tEnd=Date.now()+tTot;$('#timer').classList.add('on');tick();clearInterval(tInt);tInt=setInterval(tick,250)}
function tick(){
const r=Math.max(0,Math.ceil((tEnd-Date.now())/1000));
$('#tt').textContent=fmtT(r);
$('#tb').style.width=(Math.max(0,tEnd-Date.now())/tTot*100)+'%';
if(r<=0){clearInterval(tInt);beep();setTimeout(()=>$('#timer').classList.remove('on'),2500)}
}
export function tAdd(ms){tEnd+=ms;tTot+=ms;tick()} /* bouton +15 s */
export function tStop(){clearInterval(tInt);$('#timer').classList.remove('on')}
let ac=null;
function beep(){try{const c=ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(c.resume)c.resume();const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.2;o.start();o.stop(c.currentTime+.35);if(navigator.vibrate)navigator.vibrate(300)}catch(e){}}
setInterval(()=>{const e=$('#el'),s=cur();if(e&&s&&!s.edit)e.textContent=mins(s.date)},20000);
