/* Fluxe Suivi — Gestes : catalogue partagé par club (v3.8.0).
   Une correction s'applique TOUJOURS d'abord à ma propre liste (même sans compte, même hors ligne),
   puis, si la salle est reliée à un club et que j'ai un compte vérifié, elle est partagée avec les membres.
   Chaque geste renvoie true quand l'app doit enregistrer puis redessiner l'écran. */
import {M, MU} from '../catalogue.js';
import {S, pk, save, toast} from '../etat.js';
import {cname, norm} from '../outils.js';
import {avertir} from '../dialogue.js';
import {chainOf, gymCur} from '../salle.js';
import {render} from '../rendu.js';
import {closePk, openSheet, sheet} from '../vues/panneaux.js';
import {listeClubs, zoneCreer} from '../vues/club.js';
import {creerClub, donnerAvis, listerClubs, lireAvis, oublier} from '../club-reseau.js';
import {texteErreur} from '../nuage.js';

const GENRES = ['absent', 'present', 'marque', 'nom'];
/* pourquoi un partage n'a pas pu partir (la correction reste dans ma liste) */
function pourquoi(e) {
  const c = e && e.code;
  if (c === 'fx/sans-compte')
    return 'Corrigé dans ta liste. Pour partager avec ton club, crée un compte dans Sauvegarde en ligne.';
  if (c === 'fx/non-verifie') return 'Corrigé dans ta liste. Vérifie ton adresse e-mail pour partager avec ton club.';
  if (!navigator.onLine) return 'Corrigé dans ta liste. Pas de réseau : réessaie plus tard pour partager.';
  return 'Corrigé dans ta liste, mais le partage a échoué : ' + texteErreur(e);
}
/* envoie un avis au club de la salle, puis relit les avis et redessine */
function partager(g, a, merci) {
  if (!g.club) {
    toast('Corrigé dans ta liste. Relie ta salle à ton club pour partager.');
    return;
  }
  const club = g.club;
  donnerAvis(club, a).then(
    () => {
      toast(merci);
      oublier(club);
      lireAvis(club).then(render, () => {});
    },
    e => toast(pourquoi(e))
  );
}

export const gestes = {
  /* ouvrir « Mon club » : la liste arrive du réseau (ou des derniers clubs connus) */
  clien: () => {
    const g = gymCur();
    if (!g) return;
    openSheet({club: {liste: null, q: '', creer: false}});
    const ch = chainOf(g);
    listerClubs(ch ? ch.id : 'autre').then(
      l => {
        const el = document.querySelector('#clist'),
          z = document.querySelector('#ccre');
        if (pk && pk.club && el && z) {
          pk.club.liste = l;
          el.innerHTML = listeClubs();
          z.innerHTML = zoneCreer();
        }
      },
      () => {}
    );
  },
  /* « Créer le mien » : ouvre le formulaire, prérempli avec ce qui a été cherché */
  ccreer: () => {
    const g = gymCur(),
      z = document.querySelector('#ccre');
    if (!g || !pk || !pk.club || !z) return;
    const ch = chainOf(g),
      q = cname(pk.club.q || '').slice(0, 60),
      marque = ch && ch.id !== 'autre' ? ch.name : '';
    pk.club.nom = !q ? g.name : marque && !norm(q).includes(norm(marque)) ? (marque + ' ' + q).slice(0, 60) : q;
    pk.club.creer = true;
    z.innerHTML = zoneCreer();
    const f = z.querySelector('#cl-n');
    if (f) f.focus();
  },
  cchoix: ({b}) => {
    const g = gymCur(),
      id = b.dataset.id;
    if (!g || !/^[A-Za-z0-9_-]{1,40}$/.test(id || '')) return;
    g.club = id;
    g.clubNom = String(b.dataset.n || g.name).slice(0, 60);
    closePk();
    toast('Salle reliée à « ' + g.clubNom + ' »');
    lireAvis(id).then(render, () => {});
    return true;
  },
  ccree: () => {
    const g = gymCur();
    if (!g) return;
    const n = cname(document.querySelector('#cl-n').value || '').slice(0, 60),
      v = cname(document.querySelector('#cl-v').value || '').slice(0, 40);
    if (!n) {
      toast('Donne un nom à ton club.');
      return;
    }
    const ch = chainOf(g);
    creerClub({n, e: ch ? ch.id : 'autre', v}).then(
      id => {
        g.club = id;
        g.clubNom = n;
        save();
        closePk();
        render();
        toast('Club « ' + n + ' » créé : les autres membres peuvent le choisir.');
      },
      e => {
        const c = e && e.code;
        avertir({
          icone: c === 'fx/sans-compte' || c === 'fx/non-verifie' ? 'nuage' : 'alerte',
          ton: 'bleu',
          titre:
            c === 'fx/sans-compte'
              ? 'Compte nécessaire'
              : c === 'fx/non-verifie'
                ? 'Adresse à vérifier'
                : 'Club non créé',
          texte:
            c === 'fx/sans-compte'
              ? 'Pour créer ton club, crée un compte dans Historique › Sauvegarde › Sauvegarde en ligne. C’est gratuit.'
              : c === 'fx/non-verifie'
                ? 'Ouvre le lien reçu par e-mail pour vérifier ton adresse, puis réessaie.'
                : texteErreur(e),
        });
      }
    );
  },
  /* « Comment ? » de la salle communautaire (v3.20) */
  ccomment: () => {
    openSheet({comment: 1});
  },
  csig: ({b}) => {
    if (!gymCur()) return;
    openSheet({sig: {n: String(b.dataset.n || '').slice(0, 60), k: 'absent'}});
  },
  csel: ({b}) => {
    if (!pk || !pk.sig || !GENRES.includes(b.dataset.k)) return;
    pk.sig.k = b.dataset.k;
    sheet();
  },
  cenv: () => {
    const g = gymCur();
    if (!g || !pk || !pk.sig) return;
    const {n, k} = pk.sig;
    if (k === 'absent') g.eq = g.eq.filter(x => norm(x) !== norm(n));
    if (k === 'present' && !g.eq.some(x => norm(x) === norm(n))) g.eq.push(n);
    closePk();
    partager(g, {m: n, k}, 'Merci ! Ton avis est partagé avec ton club.');
    return true;
  },
  cajout: () => {
    if (gymCur()) openSheet({ajm: {}});
  },
  cajm: () => {
    const g = gymCur();
    if (!g || !pk || !pk.ajm) return;
    const n = cname(document.querySelector('#am-n').value || '').slice(0, 60),
      marque = cname(document.querySelector('#am-b').value || '').slice(0, 30),
      m = document.querySelector('#am-g').value;
    if (!n) {
      toast('Écris le nom de la machine.');
      return;
    }
    if (!M.includes(m)) return;
    if (!g.eq.some(x => norm(x) === norm(n))) g.eq.push(n);
    if (!MU[n]) S.mu = {...(S.mu || {}), [n]: m};
    closePk();
    partager(
      g,
      marque ? {m: n, k: 'ajout', g: m, b: marque} : {m: n, k: 'ajout', g: m},
      'Machine ajoutée et partagée avec ton club ✓'
    );
    return true;
  },
};
