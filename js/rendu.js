/* Fluxe Suivi — Affiche l'onglet actif. */
import {S,cur,tab} from './etat.js';
import {$} from './outils.js';
import {viewSeance} from './vues/seance.js';
import {viewHisto} from './vues/historique.js';
import {viewStats} from './vues/stats.js';
import {viewGuide} from './vues/guide.js';
import {veille} from './veille.js';
export function render(){
if(S.current&&!cur())S.current=null;
if(!S.current)S.editBak=null;
S.sessions.forEach(x=>{if(x.edit&&x.id!==S.current)delete x.edit});
document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===tab));
$('#app').innerHTML=tab==='seance'?viewSeance():tab==='histo'?viewHisto():tab==='stats'?viewStats():viewGuide();
veille();
}
