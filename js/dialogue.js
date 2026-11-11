/* Fluxe Suivi — Fenêtres de l'app (remplacent les fenêtres grises du téléphone : confirm, prompt, alert).
   La fenêtre monte du bas de l'écran, avec une icône, un titre court, le détail utile et des boutons qui disent ce qu'ils font.
   Toucher à côté ou appuyer sur Échap = « Annuler » (toujours sans risque).

   demander(o) → promesse : 'ok' | 'non' | 'lien' | null (fermée sans choisir)
     o.icone  : nom d'icône (voir pictos.js)      o.ton : 'rouge' | 'vert' | 'ambre' | 'bleu'
     o.titre  : titre court                        o.texte : phrase d'explication (texte simple)
     o.corps  : HTML déjà sécurisé (récap, liste)  o.ok / o.non / o.lien : textes des boutons
     o.danger : bouton principal rouge             o.champ : {valeur, max, label} pour une saisie
   confirmer(o) → true seulement si l'utilisateur touche le bouton principal
   saisir(o)    → le texte saisi, ou null
   avertir(o)   → un message avec un seul bouton « Compris »

   Tests automatiques : si window.__fxAuto existe (tableau), aucune fenêtre ne s'affiche ; la réponse est prise
   dans ce tableau (true/rien = bouton principal, false = « non », texte = saisie) et le message est noté dans window.__fxVus. */
import {esc} from './outils.js';
import {pic} from './pictos.js';

let fileAttente=Promise.resolve();

export function demander(o){
  const suite=fileAttente.then(()=>afficher(o));
  fileAttente=suite.catch(()=>{});
  return suite;
}

function auto(o){
  window.__fxVus=window.__fxVus||[];window.__fxVus.push((o.titre||'')+(o.texte?' — '+o.texte:''));
  const r=window.__fxAuto.shift();
  if(r===false)return 'non';
  if(o.champ)return {r:'ok',valeur:typeof r==='string'?r:String(o.champ.valeur||'')};
  return 'ok';
}

function afficher(o){
  if(Array.isArray(window.__fxAuto))return Promise.resolve(auto(o));
  return new Promise(fin=>{
    const avant=document.activeElement;
    const bt=(r,txt,cl)=>txt?`<button type="button" class="${cl}" data-r="${r}">${esc(txt)}</button>`:'';
    const champ=o.champ?`<input class="dlg-in" value="${esc(o.champ.valeur||'')}" ${o.champ.max?`maxlength="${o.champ.max}"`:''} aria-label="${esc(o.champ.label||o.titre)}" autocomplete="off">`:'';
    const fond=document.createElement('div');
    fond.className='dlg-fond';
    fond.innerHTML=`<div class="dlg" role="${o.danger?'alertdialog':'dialog'}" aria-modal="true" aria-labelledby="dlg-t">
<div class="dlg-ic ${o.ton||'bleu'}">${pic(o.icone||'info',28)}</div><h3 id="dlg-t">${esc(o.titre)}</h3>
${o.texte?`<p>${esc(o.texte)}</p>`:''}${o.corps||''}${champ}
<div class="dlg-bt">${bt('ok',o.ok||'Compris','ok'+(o.danger?' danger':''))}${bt('non',o.non,'non')}${bt('lien',o.lien,'lien')}</div></div>`;
    document.body.appendChild(fond);
    const inp=fond.querySelector('.dlg-in');
    const fermer=r=>{document.removeEventListener('keydown',clavier,true);fond.remove();try{avant&&avant.focus&&avant.focus()}catch(e){}
      fin(o.champ?(r==='ok'?{r,valeur:inp.value}:{r,valeur:null}):r)};
    const clavier=e=>{if(e.key==='Escape'){e.preventDefault();fermer(null)}else if(e.key==='Enter'&&inp&&document.activeElement===inp){e.preventDefault();fermer('ok')}};
    document.addEventListener('keydown',clavier,true);
    fond.addEventListener('click',e=>{if(e.target===fond){fermer(null);return}const b=e.target.closest('[data-r]');if(b)fermer(b.dataset.r)});
    requestAnimationFrame(()=>{fond.classList.add('on');(inp||fond.querySelector('[data-r=ok]')).focus();if(inp)inp.select()});
  });
}

export const confirmer=o=>demander(o).then(r=>r==='ok');
export const saisir=o=>demander({ok:'Enregistrer',non:'Annuler',...o,champ:{valeur:o.valeur||'',max:o.max,label:o.label}}).then(r=>r&&r.r==='ok'?r.valeur:null);
export const avertir=o=>demander({icone:'info',ton:'bleu',...o,ok:o.ok||'Compris'}).then(()=>{});
/* petit récapitulatif en pastilles : ['52 min', '3 exercices'] */
export const pastilles=l=>`<div class="recap">${l.filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`;
