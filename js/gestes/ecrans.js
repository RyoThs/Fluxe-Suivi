/* Fluxe Suivi — Gestes : Affichage : onglets internes, filtres, ouverture et fermeture des panneaux.
   Chaque geste reçoit le bouton touché (b), la séance en cours (s) et les numéros i, j, k du bouton.
   Il renvoie true quand l'app doit enregistrer puis redessiner l'écran ; sinon il s'en occupe lui-même. */
import {M} from '../catalogue.js';
import {pk} from '../etat.js';
import {render} from '../rendu.js';
import {setCm,setCp,setCsel,setRx,setSx} from '../vues/stats.js';
import {closePk,openPk,openTool,sheet} from '../vues/panneaux.js';
export const gestes={
rx:({a,b,s,i,j,k})=>{setRx(b.dataset.v);render();return},
pm:({a,b,s,i,j,k})=>{pk.m=M.includes(b.dataset.m)?b.dataset.m:'Tous';sheet();return},
pv:({a,b,s,i,j,k})=>{pk.v=b.dataset.v==='salle'?'salle':'cat';sheet();return},
closepk:({a,b,s,i,j,k})=>{closePk();return},
pick:({a,b,s,i,j,k})=>{openPk();return},
tool:({a,b,s,i,j,k})=>{openTool();return},
bar:({a,b,s,i,j,k})=>{pk.bar=[20,15,10].includes(+b.dataset.b)?+b.dataset.b:20;sheet();return},
sx:({a,b,s,i,j,k})=>{setSx(b.dataset.n);return true;},
/* courbe de progression (Stats) : mesure, période, point touché */
cm:({b})=>{setCm(b.dataset.v);render()},
cp:({b})=>{setCp(b.dataset.v);render()},
cpt:({b})=>{setCsel(+b.dataset.x);render()}
};
