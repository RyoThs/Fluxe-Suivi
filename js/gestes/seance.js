/* Fluxe Suivi — Gestes : Séance en cours : démarrer, ajouter, remplacer ou supprimer un exercice, ajouter une série, valider.
   (Terminer, annuler, modifier ou supprimer une séance passée : voir fin-seance.js.)
   Chaque geste reçoit le bouton touché (b), la séance en cours (s) et les numéros i, j, k du bouton.
   Il renvoie true quand l'app doit enregistrer puis redessiner l'écran ; sinon il s'en occupe lui-même. */
import {MU} from '../catalogue.js';
import {S, cur, pk, save, toast} from '../etat.js';
import {cname, uid} from '../outils.js';
import {choisir, confirmer} from '../dialogue.js';
import {CHOIX_PERSO, groupeDe} from '../muscles.js';
import {newEx, restFor, suggest} from '../calculs.js';
import {gymCur, inGym} from '../salle.js';
import {render} from '../rendu.js';
import {closePk, openRemplacer} from '../vues/panneaux.js';
import {tStart} from '../minuteur.js';
import {estCardio, exercicesDe} from '../routines.js';
import {proposerAnnuler} from '../annuler.js';
const demarrer = ({a, b, s, i, j, k}) => {
  const r = a === 'startr' ? S.routines[k] : null;
  if (a === 'startr' && !r) return;
  const n = {id: uid(), date: Date.now(), exercises: r ? exercicesDe(r) : []},
    g = gymCur();
  if (r) {
    if (!r.id) r.id = uid();
    n.rt = r.id;
  }
  if (g) {
    n.g = g.id;
    n.gn = g.name;
  }
  S.sessions.push(n);
  S.current = n.id;
  return true;
};
/* Exercice perso : quel groupe de muscles ? (sert au mannequin « Ma progression » et aux Stats) */
function demanderMuscle(nm) {
  choisir({
    icone: 'salle',
    titre: 'Quel muscle travaille « ' + nm + ' » ?',
    texte: 'Pour le compter dans ta progression. Tu pourras le changer plus tard dans la séance.',
    choix: CHOIX_PERSO,
  }).then(g => {
    if (!g) return;
    S.mu = S.mu || {};
    S.mu[nm] = g;
    /* devenu cardio (ou l'inverse) : les séries n'ont pas le même format, l'exercice repart vide à la même place */
    const s = cur();
    if (s) s.exercises = s.exercises.map(e => (e.name === nm && !!e.cardio !== estCardio(nm) ? newEx(nm) : e));
    save();
    render();
  });
}
export const gestes = {
  /* glisser → Supprimer : fait tout de suite, « Annuler » le remet à sa place */
  exsup: ({a, b, s, i, j, k}) => {
    const e = s && s.exercises[i];
    if (!e) return;
    s.exercises.splice(i, 1);
    proposerAnnuler(e.name + ' supprimé', () => {
      const c = cur();
      if (c) c.exercises.splice(Math.min(i, c.exercises.length), 0, e);
    });
    return true;
  },
  /* glisser → Remplacer : la liste s'ouvre, le nouvel exercice garde les séries */
  exrem: ({a, b, s, i, j, k}) => {
    if (s && s.exercises[i]) openRemplacer(i);
  },
  padd: ({a, b, s, i, j, k}) => {
    const nm = cname(b.dataset.n);
    if (!nm) return;
    if (pk && pk.rempl >= 0 && s.exercises[pk.rempl]) {
      const e = s.exercises[pk.rempl];
      if (!!e.cardio === estCardio(nm)) e.name = nm;
      else s.exercises[pk.rempl] = newEx(nm); /* muscu ↔ cardio : les séries n'ont pas le même format */
      closePk();
      return true;
    }
    s.exercises.push(newEx(nm));
    const g = gymCur();
    if (g && !MU[nm] && !inGym(nm) && g.eq.length < 600) g.eq.push(nm);
    closePk();
    if (b.dataset.cree && !MU[nm] && groupeDe(nm, S.mu) === 'Perso') setTimeout(() => demanderMuscle(nm));
    return true;
  },
  pmu: ({a, b, s, i, j, k}) => {
    const e = s.exercises[i];
    if (e && !MU[e.name]) demanderMuscle(e.name);
  },
  wu: ({a, b, s, i, j, k}) => {
    const x = s.exercises[i].sets[j];
    if (x) {
      if (x.w) delete x.w;
      else x.w = true;
    }
    return true;
  },
  sug: ({a, b, s, i, j, k}) => {
    const sg = suggest(s.exercises[i].name);
    if (sg)
      s.exercises[i].sets.forEach(x => {
        if (!x.done && !x.w) x.kg = String(Math.round(sg.kg * 100) / 100);
      });
    return true;
  },
  start: demarrer,
  startr: demarrer,
  addset: ({a, b, s, i, j, k}) => {
    const ex = s.exercises[i],
      l = ex.sets;
    if (ex.cardio) l.push({min: '', km: '', kcal: '', done: false});
    else {
      const p = l[l.length - 1] || {kg: '', reps: ''};
      l.push({kg: p.kg, reps: p.reps, done: false});
    }
    return true;
  },
  chk: ({a, b, s, i, j, k}) => {
    const ex = s.exercises[i],
      x = ex.sets[j];
    if (x.done) x.done = false;
    else if (ex.cardio) {
      if (String(x.min).trim() === '' || !(+x.min > 0)) {
        toast('Renseigne au moins la durée en minutes');
        return;
      }
      x.done = true;
    } else {
      if (String(x.reps).trim() === '' || isNaN(+x.reps) || isNaN(+x.kg)) {
        toast('Renseigne les répétitions (et la charge)');
        return;
      }
      if (String(x.kg).trim() === '') x.kg = '0';
      x.done = true;
      if (!s.edit && !x.w) tStart(restFor(ex.name), ex.name);
    }
    return true;
  },
  delex: ({a, b, s, i, j, k}) => {
    const e = s.exercises[i],
      n = e.sets.filter(x => x.done).length;
    confirmer({
      icone: 'corbeille',
      ton: 'rouge',
      danger: 1,
      titre: 'Retirer cet exercice ?',
      texte:
        e.name +
        (n
          ? ' · ' +
            n +
            ' série' +
            (n > 1 ? 's' : '') +
            ' validée' +
            (n > 1 ? 's' : '') +
            ' seront perdue' +
            (n > 1 ? 's' : '')
          : ''),
      ok: 'Retirer l’exercice',
      non: 'Garder',
    }).then(ok => {
      if (!ok) return;
      const x = s.exercises.indexOf(e);
      if (x < 0) return;
      s.exercises.splice(x, 1);
      save();
      render();
    });
    return;
  },
};
