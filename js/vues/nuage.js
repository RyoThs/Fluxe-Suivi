/* Fluxe Suivi — Carte « Sauvegarde en ligne » (en haut de Historique > Mes données).
   4 situations : pas de compte (formulaire), connecté et à jour, envoi en cours / pas de réseau, erreur. */
import {S} from '../etat.js';
import {esc} from '../outils.js';
import {pic} from '../pictos.js';
import {compte,connecte,dernierEnvoi,disponible,etat} from '../nuage.js';

/* formulaire : « Créer un compte » ou « J'ai déjà un compte » (le mot de passe n'est jamais gardé ici) */
let mode='creer',email='';
export function setMode(v){mode=v==='connexion'?'connexion':'creer'}
export function setEmail(v){email=String(v||'').slice(0,120)} /* garde l'e-mail tapé quand la carte est redessinée */
const ilYa=t=>{const m=Math.round((Date.now()-t)/60000);return m<1?'à l’instant':m<60?'il y a '+m+' min':m<1440?'il y a '+Math.round(m/60)+' h':'il y a '+Math.round(m/1440)+' j'};
const lien='<a href="confidentialite.html" target="_blank" rel="noopener">Confidentialité</a>';

export function carteNuage(){
  if(!disponible())return '';
  if(!connecte())return formulaire();
  const n=S.sessions.filter(s=>s.id!==S.current).length;
  const st=etat.statut==='horsligne'?['attente','wait','Pas de réseau',etat.attente?etat.attente+' changement'+(etat.attente>1?'s':'')+' en attente : envoi automatique dès que la connexion revient':'Tout est déjà envoyé']
    :etat.statut==='envoi'?['attente','wait','Envoi en cours…','Ne ferme pas l’app tout de suite']
    :etat.statut==='erreur'?['alerte','err','Envoi impossible',etat.msg]
    :['nuage','',dernierEnvoi()?'À jour':'Connecté',(dernierEnvoi()?'Dernier envoi '+ilYa(dernierEnvoi())+' · ':'')+n+' séance'+(n>1?'s':'')];
  return `<div class="card cl" id="nuage"><div class="hist-date">Sauvegarde en ligne</div>
<div class="st ${st[1]}">${pic(st[0],26)}<div><b>${esc(st[2])}</b><span>${esc(st[3])}</span></div></div>
${etat.statut==='erreur'||etat.statut==='horsligne'?'<button class="ghost" data-act="nsync">Réessayer maintenant</button>':''}
<div class="vr"><div><b>${esc(compte())}</b><span>Connecté sur cet appareil</span></div></div>
<button class="ghost" data-act="nsortir">Se déconnecter de cet appareil</button>
<button class="dg" data-act="nsuppr">Supprimer mon compte et mes données en ligne</button>
<p class="pv">Tes séances restent aussi sur ce téléphone. ${lien}</p></div>`;
}

function formulaire(){
  const c=mode==='creer',occ=etat.occupe;
  const ok=occ?(c?'Création du compte…':'Connexion…'):(c?'Créer mon compte':'Me connecter');
  return `<div class="card cl" id="nuage"><div class="hist-date">Sauvegarde en ligne</div><div class="mu">Facultatif et gratuit. Sans compte, l’app marche comme avant.</div>
<ul class="ben"><li>${pic('coche',18)}<span>Tes séances se sauvegardent toutes seules, même si tu perds ton téléphone</span></li><li>${pic('coche',18)}<span>Retrouve-les sur iPhone, Android et ordinateur</span></li><li>${pic('coche',18)}<span>Marche sans réseau : envoi dès que la connexion revient</span></li></ul>
<div class="seg" role="group" aria-label="Compte"><button class="${c?'on':''}" data-act="nmode" data-v="creer" aria-pressed="${c}">Créer un compte</button><button class="${c?'':'on'}" data-act="nmode" data-v="connexion" aria-pressed="${!c}">J’ai déjà un compte</button></div>
<form id="nf"><label for="nm">E-mail</label><input class="in" id="nm" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" maxlength="120" value="${esc(email||compte())}" placeholder="ton@email.fr">
<label for="np">Mot de passe${c?' (8 caractères minimum)':''}</label><input class="in" id="np" type="password" autocomplete="${c?'new-password':'current-password'}" maxlength="100" placeholder="••••••••">
${etat.msg?`<p class="nerr" role="alert">${esc(etat.msg)}</p>`:''}
<button class="btn" type="submit" data-act="nok"${occ?' disabled':''}>${ok}</button></form>
${c?'':'<button class="lnk" data-act="noubli">Mot de passe oublié ?</button>'}
<p class="pv">Seuls ton e-mail et tes séances sont gardés, sur des serveurs en Europe. Personne d’autre ne peut les voir. ${lien}</p></div>`;
}
