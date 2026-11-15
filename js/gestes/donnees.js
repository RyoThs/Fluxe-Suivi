/* Fluxe Suivi — Gestes : Mes données : fichier de sauvegarde, import, versions de secours, corbeille, rappel de sauvegarde.
   Chaque geste reçoit le bouton touché (b), la séance en cours (s) et les numéros i, j, k du bouton.
   Il renvoie true quand l'app doit enregistrer puis redessiner l'écran ; sinon il s'en occupe lui-même. */
import {BKD} from '../config.js';
import {clean, purge, unwrap} from '../donnees.js';
import {S, pk, save, setS, toast} from '../etat.js';
import {$} from '../outils.js';
import {avertir, confirmer, pastilles, saisir} from '../dialogue.js';
import {render} from '../rendu.js';
import {closePk, openSheet, sheet} from '../vues/panneaux.js';
import {fillData} from '../vues/ecran-sauvegarde.js';
import {tStop} from '../minuteur.js';
import {VB, snap} from '../versions.js';
import {imp, merge, pack, saveFile} from '../sauvegarde.js';
import {effacer} from '../erreurs.js';
const importer = ({a, b, s, i, j, k}) => {
  const d = pk.imp;
  if (!d) return;
  const go = () =>
    snap('imp').then(() => {
      if (a === 'irepl') {
        d.current = null;
        d.editBak = null;
        d.sessions.forEach(x => delete x.edit);
        setS(purge(d));
        tStop();
        save();
        closePk();
        render();
        toast('Données remplacées ✓ (version de secours créée)');
      } else {
        const r = merge(d);
        save();
        closePk();
        render();
        avertir({
          icone: 'valide',
          ton: 'vert',
          titre: 'Fusion terminée',
          texte: 'Rien n’a été effacé.',
          corps: pastilles([
            r.add + ' ajoutée' + (r.add > 1 ? 's' : ''),
            r.upd + ' mise' + (r.upd > 1 ? 's' : '') + ' à jour',
            r.skip ? r.skip + ' ignorée' + (r.skip > 1 ? 's' : '') + ' (corbeille)' : '',
          ]),
        });
      }
    });
  if (a === 'irepl')
    confirmer({
      icone: 'alerte',
      ton: 'rouge',
      danger: 1,
      titre: 'Remplacer toutes les données ?',
      texte:
        'Les séances de ce téléphone seront remplacées par celles du fichier. Une version de secours est créée juste avant.',
      ok: 'Remplacer les données',
      non: 'Annuler',
    }).then(ok => {
      if (ok) go();
    });
  else go();
  return;
};
export const gestes = {
  data: ({a, b, s, i, j, k}) => {
    openSheet({data: 1});
    return;
  },
  file: ({a, b, s, i, j, k}) => {
    saveFile();
    return;
  },
  imerge: importer,
  irepl: importer,
  snapnow: ({a, b, s, i, j, k}) => {
    snap('man').then(ok => {
      toast(ok ? 'Version de secours créée ✓' : 'Impossible de créer une version sur ce navigateur');
      if (pk && pk.data) fillData();
    });
    return;
  },
  vrest: ({a, b, s, i, j, k}) => {
    const at = +b.dataset.at;
    if (S.current) {
      avertir({
        icone: 'alerte',
        ton: 'ambre',
        titre: 'Séance en cours',
        texte: 'Termine ou annule d’abord la séance en cours.',
      });
      return;
    }
    confirmer({
      icone: 'retour',
      ton: 'bleu',
      titre: 'Revenir à cette version ?',
      texte: 'Tes données actuelles seront gardées dans une nouvelle version de secours.',
      ok: 'Revenir à cette version',
      non: 'Annuler',
    }).then(ok => {
      if (!ok) return;
      VB.all()
        .then(l => {
          const v = l.find(x => x.at === at);
          let d = null;
          try {
            d = v && clean(unwrap(JSON.parse(v.raw)));
          } catch (e) {}
          if (!d) {
            avertir({
              icone: 'alerte',
              ton: 'ambre',
              titre: 'Version illisible',
              texte: 'Cette version ne peut pas être lue. Rien n’a été modifié.',
            });
            return;
          }
          return snap('rest').then(() => {
            d.current = null;
            d.editBak = null;
            d.sessions.forEach(x => delete x.edit);
            setS(purge(d));
            save();
            tStop();
            render();
            sheet();
            toast('Version restaurée ✓');
          });
        })
        .catch(() =>
          avertir({
            icone: 'alerte',
            ton: 'ambre',
            titre: 'Indisponible',
            texte: 'Les versions de secours ne sont pas disponibles sur ce navigateur.',
          })
        );
    });
    return;
  },
  trest: ({a, b, s, i, j, k}) => {
    const x = +b.dataset.x,
      t = S.trash[x];
    if (!t) return;
    if (t.s) {
      if (S.sessions.some(y => y.id === t.s.id)) toast('Cette séance est déjà dans ton historique');
      else S.sessions.push(t.s);
    } else S.routines.push(t.r);
    S.trash.splice(x, 1);
    save();
    render();
    sheet();
    toast('Restauré ✓');
    return;
  },
  tempty: ({a, b, s, i, j, k}) => {
    const n = S.trash.length;
    confirmer({
      icone: 'corbeille',
      ton: 'rouge',
      danger: 1,
      titre: 'Vider la corbeille ?',
      texte: (n > 1 ? n + ' éléments seront effacés' : '1 élément sera effacé') + ' définitivement.',
      ok: 'Vider la corbeille',
      non: 'Annuler',
    }).then(ok => {
      if (!ok) return;
      S.trash = [];
      save();
      render();
      sheet();
    });
    return;
  },
  export: ({a, b, s, i, j, k}) => {
    (navigator.clipboard ? navigator.clipboard.writeText(pack()) : Promise.reject())
      .then(() => {
        S.lastBackup = Date.now();
        save();
        render();
        sheet();
        toast('Données copiées ✓');
      })
      .catch(() => toast('Copie impossible sur ce navigateur'));
    return;
  },
  imp: ({a, b, s, i, j, k}) => {
    $('#fi').click();
    return;
  },
  paste: ({a, b, s, i, j, k}) => {
    saisir({
      icone: 'fichier',
      ton: 'bleu',
      titre: 'Coller des données',
      texte: 'Colle ici le texte copié avec « Copier les données en texte ».',
      ok: 'Importer',
      label: 'Données à importer',
    }).then(t => {
      if (t) imp(t);
    });
    return;
  },
  snz: ({a, b, s, i, j, k}) => {
    S.snooze = Date.now();
    toast('D’accord, je te le rappelle dans 2 jours');
    return true;
  },
  bke: ({a, b, s, i, j, k}) => {
    const d = +b.dataset.d;
    if (BKD.includes(d)) {
      S.bkEvery = d;
      S.snooze = 0;
      save();
      render();
      sheet();
      toast('Rappel : tous les ' + d + ' jours');
      return;
    }
    return true;
  },
  /* Rapport d'erreurs : vider le journal du téléphone (ce qui a déjà été envoyé reste chez le créateur de l'app) */
  erclr: () => {
    confirmer({
      icone: 'corbeille',
      ton: 'bleu',
      titre: 'Effacer le journal d’erreurs ?',
      texte: 'Le journal de ce téléphone sera vidé. Tes séances ne sont pas touchées.',
      ok: 'Effacer',
      non: 'Garder',
    }).then(ok => {
      if (!ok) return;
      effacer();
      sheet();
    });
  },
};
