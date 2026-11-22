/* Fluxe Suivi — Gestes : semaines d'affilée, récompenses, Mon corps (v3.6.0).
   Chaque geste reçoit le bouton touché (b). Il renvoie true quand l'app doit enregistrer puis redessiner l'écran. */
import {S, pk, toast} from '../etat.js';
import {closePk, openSheet} from '../vues/panneaux.js';
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
    S.corps = [...(S.corps || []), ok];
    closePk();
    toast(type === 'pesee' ? 'Pesée enregistrée ✓' : 'Mensurations enregistrées ✓');
    noterRecompenses();
    return true;
  },
};
