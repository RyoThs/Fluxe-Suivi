/* Fluxe Suivi — Bouton « Installer » (Android / Chrome). */
import {$} from './outils.js';
/* Bouton « Installer » (Android / Chrome) */
let ip=null;const ib=$('#inst');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();try{if(localStorage.getItem('fx-no'))return}catch(x){}ip=e;ib.hidden=false});
window.addEventListener('appinstalled',()=>{ib.hidden=true});
$('#ib').onclick=async()=>{if(!ip)return;ip.prompt();try{await ip.userChoice}catch(e){}ip=null;ib.hidden=true};
$('#ix').onclick=()=>{try{localStorage.setItem('fx-no','1')}catch(e){}ib.hidden=true};
