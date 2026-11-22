/* Fluxe Suivi — Gestes : fin de séance et séances passées : terminer, annuler, modifier ou supprimer une séance.
   Chaque geste reçoit le bouton touché (b), la séance en cours (s) et les numéros i, j, k du bouton.
   Il renvoie true quand l'app doit enregistrer puis redessiner l'écran ; sinon il s'en occupe lui-même. */
import {S, save, setTab, toast} from '../etat.js';
import {dn, esc, fmt, fmtDate, mins, nset, vol} from '../outils.js';
import {avertir, confirmer, demander, pastilles} from '../dialogue.js';
import {render} from '../rendu.js';
import {tStop} from '../minuteur.js';
import {snap} from '../versions.js';
import {toTrash} from '../sauvegarde.js';
import {noterRecompenses} from '../vues/serie.js';
/* ===== Terminer la séance =====
   Séries saisies à la main mais pas validées avec ✓ : on les montre et on propose de les garder, au lieu de les perdre en silence.
   Les séries seulement préremplies (valeurs de la dernière fois, jamais touchées) ne sont jamais enregistrées comme faites. */
function finir(s) {
  const pend = [];
  let skip = 0;
  s.exercises.forEach(e =>
    e.sets.forEach(x => {
      if (x.done) return;
      if (!s.edit && x.t && (e.cardio ? +x.min > 0 : String(x.reps).trim() !== '' && !isNaN(+x.reps) && !isNaN(+x.kg)))
        pend.push([e, x]);
      else skip++;
    })
  );
  const fait = s.exercises.some(e => e.sets.some(x => x.done));
  const encore = () => S.current === s.id; /* la séance n'a pas été fermée entre-temps */
  if (!pend.length && !fait) {
    confirmer({
      icone: 'alerte',
      ton: 'ambre',
      danger: 1,
      titre: 'Aucune série validée',
      texte: 'Touche ✓ sur chaque série faite. Si tu quittes maintenant, la séance ne sera pas conservée.',
      ok: 'Quitter sans enregistrer',
      non: 'Revenir à la séance',
    }).then(ok => {
      if (ok && encore()) clore(s);
    });
    return;
  }
  if (pend.length) {
    const li =
      pend
        .slice(0, 5)
        .map(
          ([e, x]) =>
            `<li>${esc(e.name)} <small>${esc(e.cardio ? x.min + ' min' : (x.kg || 0) + ' kg × ' + x.reps)}</small></li>`
        )
        .join('') + (pend.length > 5 ? `<li>… et ${pend.length - 5} autre${pend.length - 5 > 1 ? 's' : ''}</li>` : '');
    demander({
      icone: 'alerte',
      ton: 'ambre',
      titre: pend.length > 1 ? pend.length + ' séries non validées' : '1 série non validée',
      texte: 'Elles sont remplies, mais tu n’as pas touché ✓.',
      corps: '<ul>' + li + '</ul>',
      ok: pend.length > 1 ? 'Les garder comme faites' : 'La garder comme faite',
      non: fait ? (pend.length > 1 ? 'Les ignorer' : 'L’ignorer') : '',
      lien: 'Revenir à la séance',
    }).then(r => {
      if (!encore() || (r !== 'ok' && r !== 'non')) return;
      if (r === 'ok')
        pend.forEach(([e, x]) => {
          if (!e.cardio && String(x.kg).trim() === '') x.kg = '0';
          x.done = true;
        });
      clore(s);
    });
    return;
  }
  const ne = s.exercises.filter(e => e.sets.some(x => x.done)).length,
    ns = s.exercises.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0);
  confirmer({
    icone: 'valide',
    ton: 'vert',
    titre: s.edit ? 'Enregistrer les modifications ?' : 'Terminer la séance ?',
    texte: s.edit
      ? ''
      : 'Bravo, belle séance !' +
        (skip
          ? ' ' + skip + (skip > 1 ? ' séries non validées seront ignorées.' : ' série non validée sera ignorée.')
          : ''),
    corps: pastilles([
      s.edit ? '' : mins(s.date) ? mins(s.date) + ' min' : 'moins d’1 min',
      ne + ' exercice' + (ne > 1 ? 's' : ''),
      ns + ' série' + (ns > 1 ? 's' : ''),
      fmt(vol(s)) + ' kg',
    ]),
    ok: s.edit ? 'Enregistrer' : 'Terminer et enregistrer',
    non: s.edit ? 'Continuer les modifications' : 'Continuer la séance',
  }).then(ok => {
    if (ok && encore()) clore(s);
  });
}
/* Enregistre (ou supprime si vide) la séance, puis ferme la séance (la routine se crée ensuite depuis l'Historique) */
function clore(s) {
  s.exercises.forEach(e => (e.sets = e.sets.filter(dn)));
  s.exercises = s.exercises.filter(e => e.sets.length);
  s.exercises.forEach(e =>
    e.sets.forEach(x => {
      delete x.t;
    })
  );
  let saved = false;
  if (!s.exercises.length) S.sessions = S.sessions.filter(x => x.id !== s.id);
  else if (s.edit) {
    delete s.edit;
    s.mod = Date.now();
    saved = 'edit';
  } else {
    s.dur = mins(s.date);
    s.mod = Date.now();
    saved = true;
  }
  const fin = () => {
    S.current = null;
    S.editBak = null;
    tStop();
    if (saved) {
      setTab('histo');
      window.scrollTo(0, 0);
      toast(saved === 'edit' ? 'Modifications enregistrées ✓' : 'Séance enregistrée ✓');
      save();
      snap('auto');
    }
    save();
    render();
    if (saved === true) noterRecompenses();
  };
  fin();
}
export const gestes = {
  editsess: ({a, b, s, i, j, k}) => {
    if (S.current) {
      avertir({
        icone: 'alerte',
        ton: 'ambre',
        titre: 'Séance en cours',
        texte: 'Termine ou annule d’abord la séance en cours.',
      });
      return;
    }
    const x = S.sessions.find(y => y.id === b.dataset.id);
    if (!x) return;
    S.editBak = JSON.parse(JSON.stringify(x));
    x.edit = true;
    S.current = x.id;
    setTab('seance');
    window.scrollTo(0, 0);
    return true;
  },
  finish: ({a, b, s, i, j, k}) => {
    finir(s);
    return;
  },
  cancel: ({a, b, s, i, j, k}) => {
    if (s.edit) {
      confirmer({
        icone: 'retour',
        ton: 'ambre',
        danger: 1,
        titre: 'Annuler les modifications ?',
        texte: 'La séance redeviendra comme avant.',
        ok: 'Annuler les modifications',
        non: 'Continuer',
      }).then(ok => {
        if (!ok || S.current !== s.id) return;
        const bk = S.editBak;
        if (bk) S.sessions = S.sessions.map(x => (x.id === s.id ? bk : x));
        S.current = null;
        S.editBak = null;
        tStop();
        save();
        render();
      });
      return;
    }
    const fait = s.exercises.some(e => e.sets.some(x => x.done));
    confirmer({
      icone: 'corbeille',
      ton: 'rouge',
      danger: 1,
      titre: 'Annuler la séance ?',
      texte: fait
        ? 'Les séries validées iront dans la corbeille (récupérables 30 jours).'
        : 'Aucune série validée : la séance sera supprimée.',
      ok: 'Annuler la séance',
      non: 'Continuer la séance',
    }).then(ok => {
      if (!ok || S.current !== s.id) return;
      /* si des séries avaient été validées, la séance part à la corbeille au lieu d'être perdue */
      if (fait) {
        const c = JSON.parse(JSON.stringify(s));
        c.exercises.forEach(
          e =>
            (e.sets = e.sets.filter(dn).map(x => {
              delete x.t;
              return x;
            }))
        );
        c.exercises = c.exercises.filter(e => e.sets.length);
        c.dur = mins(s.date);
        toTrash({s: c});
        toast('Séance annulée (récupérable 30 jours dans la corbeille)');
      }
      S.sessions = S.sessions.filter(x => x.id !== s.id);
      S.current = null;
      tStop();
      save();
      render();
    });
    return;
  },
  delsess: ({a, b, s, i, j, k}) => {
    const x = S.sessions.find(y => y.id === b.dataset.id);
    if (!x) return;
    const ne = x.exercises.length;
    confirmer({
      icone: 'corbeille',
      ton: 'rouge',
      danger: 1,
      titre: 'Mettre à la corbeille ?',
      texte: 'Séance du ' + fmtDate(x.date),
      corps:
        pastilles([
          ne + ' exercice' + (ne > 1 ? 's' : ''),
          nset(x) + ' série' + (nset(x) > 1 ? 's' : ''),
          fmt(vol(x)) + ' kg',
        ]) + '<p style="margin-top:10px">Tu pourras la récupérer pendant 30 jours.</p>',
      ok: 'Mettre à la corbeille',
      non: 'Garder la séance',
    }).then(ok => {
      if (!ok || !S.sessions.includes(x)) return;
      toTrash({s: x});
      S.sessions = S.sessions.filter(y => y !== x);
      toast('Séance mise à la corbeille');
      save();
      render();
    });
    return;
  },
};
