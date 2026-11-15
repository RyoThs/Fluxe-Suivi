/* Fluxe Suivi — Gestes : Ma salle : création, enseigne, renommage, suppression, machines cochées.
   Chaque geste reçoit le bouton touché (b), la séance en cours (s) et les numéros i, j, k du bouton.
   Il renvoie true quand l'app doit enregistrer puis redessiner l'écran ; sinon il s'en occupe lui-même. */
import {CHAINS, catOf} from '../catalogue.js';
import {S, pk, save, setTab, toast} from '../etat.js';
import {$, cname, norm, uid} from '../outils.js';
import {avertir, confirmer, saisir} from '../dialogue.js';
import {chainOf, gymCur} from '../salle.js';
import {render} from '../rendu.js';
import {glist, gymCard, segGuide, setGm, setGv} from '../vues/guide.js';
import {closePk, openSheet} from '../vues/panneaux.js';
export const gestes = {
  gens: ({b}) => {
    const ch = CHAINS.find(c => c.id === b.dataset.t) || null;
    if (!ch && b.dataset.t !== 'autre') return;
    const eq = catOf(ch),
      nom = ch ? ch.name : 'Ma salle',
      g = gymCur();
    if (pk && pk.ens && pk.ens.chg && g) {
      confirmer({
        icone: 'salle',
        ton: 'bleu',
        titre: 'Passer sur ' + nom + ' ?',
        texte:
          'Ses ' +
          eq.length +
          ' machines seront cochées et remplaceront les coches de « ' +
          g.name +
          ' ». Tes réglages sont gardés.',
        ok: 'Changer d’enseigne',
        non: 'Annuler',
      }).then(ok => {
        if (!ok) return;
        const old = chainOf(g);
        if (!old || g.name === old.name) g.name = nom;
        g.eq = eq;
        if (ch) g.chain = ch.id;
        else delete g.chain;
        setGv('cat');
        save();
        closePk();
        render();
        toast('Enseigne changée : ' + eq.length + ' machines cochées');
      });
      return;
    }
    if (S.gyms.length >= 20) {
      avertir({
        icone: 'info',
        ton: 'bleu',
        titre: '20 salles maximum',
        texte: 'Supprime une salle pour en créer une nouvelle.',
      });
      return;
    }
    let n = nom,
      k = 2;
    while (S.gyms.some(x => x.name === n)) n = nom + ' ' + k++;
    const id = uid();
    S.gyms.push(ch ? {id, name: n, eq, notes: {}, chain: ch.id} : {id, name: n, eq, notes: {}});
    S.gym = id;
    setTab('aide');
    setGm('Tous');
    setGv('cat');
    save();
    if (pk) closePk();
    render();
    toast('Salle « ' + n + ' » créée : ' + eq.length + ' machines cochées. Décoche celles qui manquent.');
    return;
  },
  gm: ({a, b, s, i, j, k}) => {
    setGm(b.dataset.m);
    return true;
  },
  gv: ({a, b, s, i, j, k}) => {
    setGv(b.dataset.v);
    return true;
  },
  gsel: ({a, b, s, i, j, k}) => {
    S.gym = S.gyms.some(g => g.id === b.dataset.id) ? b.dataset.id : null;
    return true;
  },
  gnew: ({a, b, s, i, j, k}) => {
    if (S.gyms.length >= 20) {
      avertir({
        icone: 'info',
        ton: 'bleu',
        titre: '20 salles maximum',
        texte: 'Supprime une salle pour en créer une nouvelle.',
      });
      return;
    }
    openSheet({ens: {}});
    return;
  },
  gchg: ({a, b, s, i, j, k}) => {
    if (!gymCur()) return;
    openSheet({ens: {chg: 1}});
    return;
  },
  gren: ({a, b, s, i, j, k}) => {
    const g = gymCur();
    if (!g) return;
    saisir({
      icone: 'crayon',
      ton: 'bleu',
      titre: 'Renommer la salle',
      valeur: g.name,
      max: 40,
      label: 'Nom de la salle',
    }).then(n => {
      if (!n || !cname(n)) return;
      g.name = cname(n).slice(0, 40);
      save();
      render();
    });
    return;
  },
  gdel: ({a, b, s, i, j, k}) => {
    const g = gymCur();
    if (!g) return;
    confirmer({
      icone: 'corbeille',
      ton: 'rouge',
      danger: 1,
      titre: 'Supprimer « ' + g.name + ' » ?',
      texte: 'Ses machines cochées et ses réglages seront perdus. Tes séances restent dans l’historique.',
      ok: 'Supprimer la salle',
      non: 'Garder la salle',
    }).then(ok => {
      if (!ok) return;
      S.gyms = S.gyms.filter(x => x.id !== g.id);
      S.gym = S.gyms[0] ? S.gyms[0].id : null;
      save();
      render();
    });
    return;
  },
  gtog: ({b}) => {
    const g = gymCur(),
      n = cname(b.dataset.n);
    if (!g || !n) return;
    const i = g.eq.findIndex(x => norm(x) === norm(n));
    if (i >= 0) g.eq.splice(i, 1);
    else if (g.eq.length < 600) g.eq.push(n);
    save();
    $('#gl').innerHTML = glist();
    const c = document.querySelector('.card.gym');
    if (c) c.outerHTML = gymCard();
    const sg = $('#gvseg');
    if (sg) sg.outerHTML = segGuide();
    return;
  },
};
