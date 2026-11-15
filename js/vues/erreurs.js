/* Fluxe Suivi — Carte « Rapport d'erreurs » (en bas de Historique > Mes données). */
import {esc} from '../outils.js';
import {pic} from '../pictos.js';
import {connecte} from '../nuage.js';
import {envoiAuto, erreurs, lienMail, recentes} from '../erreurs.js';

const quand = t => {
  const d = new Date(t),
    auj = new Date().toDateString(),
    hier = new Date(Date.now() - 864e5).toDateString();
  const h = d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
  return d.toDateString() === auj
    ? 'Aujourd’hui ' + h
    : d.toDateString() === hier
      ? 'Hier ' + h
      : d.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) + ' ' + h;
};

export function carteErreurs() {
  const l = erreurs(),
    r = recentes(),
    c = connecte();
  const etat = l.length
    ? `<div class="st wait">${pic('alerte', 26)}<div><b>${r.length ? r.length + ' erreur' + (r.length > 1 ? 's' : '') + ' ces 7 derniers jours' : l.length + ' erreur' + (l.length > 1 ? 's' : '') + ' ce mois-ci'}</b><span>L’app a continué de marcher ; tes séances ne sont pas touchées</span></div></div>`
    : `<div class="st">${pic('bouclier', 26)}<div><b>Aucune erreur</b><span>L’app n’a rien signalé depuis 30 jours</span></div></div>`;
  const liste = l
    .slice(0, 5)
    .map(
      x =>
        `<div class="li"><b>${esc(x.titre)}${x.n > 1 ? ' <small>×' + x.n + '</small>' : ''}</b><span>${esc(quand(x.t))} · v${esc(x.ver)} · ${esc(x.app)}${c && envoiAuto() ? (x.envoye === x.n ? ' · envoyée ✓' : ' · en attente d’envoi') : ''}</span><span class="msg">${esc(x.msg)}</span></div>`
    )
    .join('');
  const caseAuto = c
    ? `<label class="sw"><input type="checkbox" id="erenv"${envoiAuto() ? ' checked' : ''}><span>Prévenir automatiquement le créateur de l’app en cas d’erreur<small>Avec ton compte Sauvegarde en ligne. Rien n’est envoyé quand tout va bien.</small></span></label>`
    : '';
  const boutons = l.length
    ? `<div class="dat" style="margin:12px 0 0"><a class="sec" href="${esc(lienMail())}">Envoyer par mail</a><button class="sec" data-act="erclr">Effacer le journal</button></div>`
    : '';
  const note = c
    ? 'Seuls le message d’erreur, la version de l’app et le type de téléphone sont envoyés. Jamais tes séances ni ton mot de passe.'
    : '« Envoyer par mail » prépare un message à fluxe.suivi@outlook.fr que tu peux relire avant l’envoi. Sans compte, rien ne part tout seul.';
  return `<div class="card er" id="erreurs"><div class="hist-date">Rapport d’erreurs</div>${etat}${liste}${caseAuto}${boutons}<p class="pv">${note} <a href="confidentialite.html" target="_blank" rel="noopener">Confidentialité</a></p></div>`;
}
