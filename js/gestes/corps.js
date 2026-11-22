/* Fluxe Suivi — Gestes : semaines d'affilée, récompenses, Mon corps (v3.6.0).
   Chaque geste reçoit le bouton touché (b). Il renvoie true quand l'app doit enregistrer puis redessiner l'écran. */
import {S, pk, toast} from '../etat.js';
import {closePk, openSheet, sheet} from '../vues/panneaux.js';
import {annulerMaintenant, proposerAnnuler} from '../annuler.js';
import {nettoyerCorps} from '../donnees.js';
import {noterRecompenses} from '../vues/serie.js';

export const ouvrirRecompenses = () => openSheet({serie: 1});
export const gestes = {
  serie: () => {
    ouvrirRecompenses();
  },
  cpes: () => {
    openSheet({corps: 'pesee'});
  },
  cmes: () => {
    openSheet({corps: 'mesures'});
  },
  ctout: () => {
    openSheet({corpsTout: 1});
  },
  cmod: ({b}) => {
    const k = +b.dataset.k,
      x = (S.corps || [])[k];
    if (x) openSheet({corps: x.kg ? 'pesee' : 'mesures', k});
  },
  csup: ({b}) => {
    const k = +b.dataset.k,
      x = (S.corps || [])[k];
    if (!x) return;
    S.corps.splice(k, 1);
    proposerAnnuler('Mesure supprimée', () => {
      S.corps.splice(Math.min(k, S.corps.length), 0, x);
      if (pk && pk.corpsTout) sheet();
    });
    if (pk && pk.corpsTout) sheet();
    return true;
  },
  /* message « Annuler » */
  undo: () => annulerMaintenant() || undefined,
  csave: () => {
    if (!pk || !pk.corps) return;
    const type = pk.corps,
      e = {t: Date.now()};
    for (const k of ['kg', 'mg', 'taille', 'poitrine', 'bras', 'cuisse', 'hanches']) {
      const el = document.querySelector('#cf-' + k);
      const v = el ? parseFloat(el.value.replace(',', '.')) : NaN;
      if (v > 0) e[k] = v;
    }
    const ok = nettoyerCorps([e])[0];
    if (!ok || (type === 'pesee' && !ok.kg)) {
      toast(
        type === 'pesee' ? 'Entre un poids entre 20 et 400 kg.' : 'Entre au moins une mesure (entre 10 et 300 cm).'
      );
      return;
    }
    const k = pk.k;
    if (k >= 0 && S.corps[k]) {
      ok.t = S.corps[k].t; /* modifiée : même date */
      S.corps[k] = ok;
    } else S.corps = [...(S.corps || []), ok];
    closePk();
    toast(type === 'pesee' ? 'Pesée enregistrée ✓' : 'Mensurations enregistrées ✓');
    noterRecompenses();
    return true;
  },
};
