/* Fluxe Suivi — Catalogue partagé par club (v3.8.0) : encart, ligne de machine et panneaux.
   - Encart « Ta salle est-elle juste ? » (salle reliée) ou « Relie ta salle à ton club » (pas encore reliée).
   - Panneaux : chercher / choisir / créer son club (v3.8.1 : la recherche d'abord, « Créer le mien » en petit), signaler une machine, ajouter une machine vue dans sa salle.
   Tout texte venant du serveur ou de l'utilisateur passe par esc(). */
import {M} from '../catalogue.js';
import {pk} from '../etat.js';
import {esc, norm} from '../outils.js';
import {chainOf, gymCur} from '../salle.js';
import {bilanClub, chercherClubs, surligner} from '../club.js';
import {avisConnus} from '../club-reseau.js';
import {pic} from '../pictos.js';

const PTS =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
const GROUPE =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5 5.5"/></svg>';

/* bilan du club de la salle active (avis déjà connus), ou null */
export function bilanSalle() {
  const g = gymCur();
  return g && g.club ? bilanClub(avisConnus(g.club)) : null;
}

/* Encadré « Salle communautaire » (v3.20), dans la carte de la salle : court, clair, l'axe fort de l'app.
   Pas encore rejointe : une phrase + « Rejoindre la salle de mon club » + « Comment ? ».
   Rejointe : le nom du club, 3 chiffres (membres, vérifiées, ajoutées / retirées) et quoi faire. */
const pluriel0 = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
export function encadreCommunautaire() {
  const g = gymCur();
  if (!g) return '';
  const tete = etat => `<div class="co-k"><span class="co-ic">${GROUPE}</span>Salle communautaire${etat}</div>`;
  if (!g.club)
    return `<div class="co">${tete('')}<p>Ce sont <b>les membres de ton club</b> qui cochent les machines qu’ils voient vraiment. La liste se met <b>à jour toute seule</b>.</p><div class="co-b"><button class="co-go" data-act="clien">Rejoindre mon club</button><button class="co-lk" data-act="ccomment">Comment ?</button></div></div>`;
  const b = bilanSalle() || {membres: 0, verifiees: new Set(), ajoutees: [], retirees: new Set()},
    etat = navigator.onLine
      ? `<span class="co-ok">${pic('coche', 12)}Club partagé</span>`
      : '<span class="co-off">hors ligne · dernière liste connue</span>';
  return `<div class="co">${tete('')}<div class="co-nom">${etat}<span>${esc(g.clubNom || g.name)}</span></div><div class="co-st"><div><b>${b.membres}</b><span>${b.membres > 1 ? 'membres' : 'membre'}</span></div><div><b>${b.verifiees.size}</b><span>${b.verifiees.size > 1 ? 'vérifiées' : 'vérifiée'}</span></div><div><b>+${b.ajoutees.length} / −${b.retirees.size}</b><span>ajouts / retraits</span></div></div><p>Ta salle est-elle juste ? Touche « ··· » sur une machine pour la confirmer ou la signaler.</p><div class="co-b"><button class="co-lk" data-act="cajout">+ Ajouter une machine vue</button><button class="co-lk" data-act="clien">Changer de club</button><button class="co-lk" data-act="ccomment">Comment ?</button></div></div>`;
}
/* Fenêtre « Comment ça marche ? » : 3 étapes */
export function panneauComment() {
  return `<div class="cpan"><div class="steps"><div><em>1</em><span>Tu rejoins la salle de ton club (par exemple Basic-Fit Lyon Part-Dieu).</span></div><div><em>2</em><span>À la salle, tu touches « ··· » sur une machine : elle est là, elle est absente, ou c’est une autre marque. Tu peux aussi ajouter une machine vue.</span></div><div><em>3</em><span>Quand plusieurs membres disent la même chose, la liste du club se met à jour pour tout le monde : machine retirée, ajoutée ou « vérifiée ».</span></div></div>
<p class="cnote">${pic('info', 16)}<span>Gratuit. Il faut un compte (Sauvegarde en ligne) pour partager tes avis ; ta liste à toi marche sans compte.</span></p></div>`;
}
/* confiance d'une machine : « Confirmée par 3 membres · dernière fois le 12 nov. » */
export function confiance(n) {
  const b = bilanSalle(),
    c = b && b.confirmations && b.confirmations.get(norm(n));
  if (!c) return '';
  const d =
    c.t > 0 ? ' · dernière fois le ' + new Date(c.t).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) : '';
  return `<p class="co-conf">${pic('valide', 16)}Confirmée par ${pluriel0(c.n, 'membre')}${d}</p>`;
}

/* ce qu'une ligne de machine ajoute : badge « vérifiée » et bouton « … » */
export const badgeVerifiee = () => `<span class="verif">${pic('coche', 11)}vérifiée</span>`;
export const boutonSignaler = n =>
  `<button class="csig" data-act="csig" data-n="${esc(n)}" aria-label="Signaler ou confirmer : ${esc(n)}">${PTS}</button>`;

const LOUPE =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const PLUS =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

/* Liste des clubs de l'enseigne, filtrée par la recherche (redessinée seule : les champs tapés restent) */
export function listeClubs() {
  const g = gymCur(),
    ch = chainOf(g),
    c = pk && pk.club ? pk.club : {},
    l = c.liste === undefined ? null : c.liste,
    q = c.q || '';
  if (l === null) return '<p class="empty">Chargement des clubs…</p>';
  if (!l.length) {
    const reseau = navigator.onLine ? '' : ' (pas de réseau : la liste n’a pas pu être mise à jour)';
    return `<p class="cvide">Aucun club ${ch ? esc(ch.name) + ' ' : ''}pour l’instant${reseau} : crée le tien ci-dessous.</p>`;
  }
  const r = chercherClubs(l, q);
  if (!r.length)
    return `<p class="cvide">Aucun club ne correspond à « ${esc(q.trim())} ».<br>Vérifie l’orthographe ou cherche par ville.</p>`;
  const titre = q.trim()
    ? pluriel(r.length, 'club') + ' trouvé' + (r.length > 1 ? 's' : '')
    : `Clubs ${ch ? esc(ch.name) + ' ' : ''}· ${l.length}`;
  return (
    `<div class="ctit">${titre}</div>` +
    r
      .map(
        x =>
          `<button class="copt${g && g.club === x.id ? ' on' : ''}" data-act="cchoix" data-id="${esc(x.id)}" data-n="${esc(x.n)}"><b>${surligner(x.n, q)}${x.b ? '<em class="cbient">bientôt</em>' : ''}</b>${x.v ? `<span>${surligner(x.v, q)}</span>` : ''}</button>`
      )
      .join('')
  );
}
/* Zone « créer » : formulaire si l'enseigne n'a aucun club ou si on a touché « Créer le mien », sinon un petit lien */
export function zoneCreer() {
  const g = gymCur(),
    c = pk && pk.club ? pk.club : {};
  if (!Array.isArray(c.liste)) return '';
  if (c.liste.length && !c.creer)
    return `<button class="clienc" data-act="ccreer"><span>Tu ne trouves pas ton club ?</span> ${PLUS}Créer le mien</button>`;
  return `<div class="cform"><h2>Créer mon club</h2>
<label class="cf" for="cl-n">Nom du club</label><input class="note" id="cl-n" maxlength="60" value="${esc(c.nom || (g ? g.name : ''))}">
<label class="cf" for="cl-v">Ville</label><input class="note" id="cl-v" maxlength="40" placeholder="ex. Lyon">
<p class="cnote">${pic('info', 16)}<span>Il faut un compte vérifié (Sauvegarde en ligne) pour créer un club. Les autres membres pourront ensuite le choisir.</span></p>
<button class="btn" data-act="ccree">Créer et relier ma salle</button></div>`;
}
/* Panneau « Mon club » : recherche, liste des clubs de l'enseigne, puis création en petit */
export function panneauClub() {
  const q = pk && pk.club ? pk.club.q || '' : '';
  return `<div class="cpan"><p class="sb">Choisis ton club : tu profites des corrections des autres membres.</p>
<div class="crech">${LOUPE}<input id="cq" placeholder="Ville, nom ou code postal" value="${esc(q)}" maxlength="60" autocomplete="off" aria-label="Chercher un club"></div>
<div id="clist">${listeClubs()}</div><div id="ccre">${zoneCreer()}</div></div>`;
}

/* Panneau « Signaler » d'une machine */
const CHOIX = [
  ['absent', 'Cette machine n’est pas dans ma salle'],
  ['present', 'Elle est bien là (je confirme)'],
  ['marque', 'Elle existe, mais d’une autre marque'],
  ['nom', 'Le nom ou le muscle est faux'],
];
export function panneauSignaler() {
  const g = gymCur(),
    s = pk.sig;
  const info =
    s.k === 'absent'
      ? 'Elle disparaît de <b>ta</b> liste tout de suite. Pour les autres membres, elle sera retirée quand <b>3 personnes</b> l’auront signalée.'
      : s.k === 'present'
        ? 'Elle est cochée dans <b>ta</b> salle. Avec <b>2 confirmations</b>, elle reçoit le badge « vérifiée ».'
        : 'Ton signalement aide à corriger le catalogue.';
  return `<div class="cpan"><h3>${esc(s.n)}</h3>${confiance(s.n)}<p class="sb">${esc(g ? g.clubNom || g.name : '')} · qu’est-ce qui ne va pas ?</p>
${CHOIX.map(([k, t]) => `<button class="copt radio${s.k === k ? ' on' : ''}" data-act="csel" data-k="${k}" aria-pressed="${s.k === k}"><i></i>${t}</button>`).join('')}
<p class="cnote">${pic('info', 16)}<span>${info}</span></p>
<button class="btn" data-act="cenv">Envoyer</button></div>`;
}

/* Panneau « Ajouter une machine » */
export function panneauAjout() {
  const g = gymCur();
  return `<div class="cpan"><p class="sb">Vue à ${esc(g ? g.clubNom || g.name : 'ma salle')}</p>
<label class="cf" for="am-n">Nom de la machine</label><input class="note" id="am-n" maxlength="60" placeholder="ex. Presse à cuisses inclinée">
<div class="crow"><div><label class="cf" for="am-b">Marque (si tu la vois)</label><input class="note" id="am-b" maxlength="30" placeholder="ex. Matrix"></div>
<div><label class="cf" for="am-g">Muscle</label><select class="note" id="am-g">${M.filter(m => m !== 'Cardio')
    .map(m => `<option>${esc(m)}</option>`)
    .join('')}</select></div></div>
<p class="cnote">${pic('info', 16)}<span>Elle apparaît tout de suite dans <b>ta</b> salle. Les autres membres la verront quand <b>2 autres personnes</b> l’auront confirmée.</span></p>
<button class="btn" data-act="cajm">Ajouter à ma salle</button></div>`;
}

/* une machine ajoutée (par moi ou par le club) a-t-elle déjà ce nom ? */
export const memeNom = (a, b) => norm(a) === norm(b);
