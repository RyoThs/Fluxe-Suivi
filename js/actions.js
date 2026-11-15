/* Fluxe Suivi — Réactions aux gestes : saisie au clavier et boutons (data-act).
   Ce fichier ne fait que l'aiguillage. Le travail de chaque bouton est rangé par thème dans js/gestes/ :
   seance.js (séance en cours), routines.js, repos.js (chrono), donnees.js (sauvegarde, corbeille),
   salle.js (Ma salle), ecrans.js (filtres et panneaux), nuage.js (Sauvegarde en ligne).
   Un geste qui renvoie true demande à l'app d'enregistrer puis de redessiner l'écran. */
import {S, cur, pk, save, setTab} from './etat.js';
import {$, K, cname} from './outils.js';
import {avertir} from './dialogue.js';
import {gymCur} from './salle.js';
import {render} from './rendu.js';
import {glist, setGq} from './vues/guide.js';
import {discs, plist, sheet} from './vues/panneaux.js';
import {brouillon} from './routines.js';
import {imp} from './sauvegarde.js';
import {gestes as seance} from './gestes/seance.js';
import {gestes as routines} from './gestes/routines.js';
import {gestes as repos} from './gestes/repos.js';
import {gestes as donnees} from './gestes/donnees.js';
import {gestes as salle} from './gestes/salle.js';
import {gestes as ecrans} from './gestes/ecrans.js';
import {gestes as nuage} from './gestes/nuage.js';
/* Tous les boutons de l'app : nom du geste (data-act) → ce qu'il fait */
const GESTES = Object.assign(Object.create(null), seance, routines, repos, donnees, salle, ecrans, nuage);
export const nomsGestes = () => Object.keys(GESTES);
$('#fi').addEventListener('change', ev => {
  const f = ev.target.files[0];
  if (!f) return;
  if (f.size > 5e6) {
    avertir({
      icone: 'alerte',
      ton: 'ambre',
      titre: 'Fichier trop lourd',
      texte: 'Ce fichier dépasse 5 Mo : ce n’est pas une sauvegarde Fluxe.',
    });
    ev.target.value = '';
    return;
  }
  const r = new FileReader();
  r.onload = () => imp(String(r.result));
  r.readAsText(f);
  ev.target.value = '';
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'pq' && pk && !pk.tool) {
    pk.q = t.value.slice(0, 60);
    $('#pl').innerHTML = plist();
    return;
  }
  if (t.id === 'dq' && pk && pk.tool) {
    pk.kg = t.value.replace(/[^\d.,]/g, '').slice(0, 6);
    $('#dr').innerHTML = discs();
    return;
  }
  if (t.id === 'gq') {
    setGq(t.value.slice(0, 60));
    $('#gl').innerHTML = glist();
    return;
  }
  /* éditeur de routine (brouillon : rien n'est enregistré avant « Enregistrer ») */
  if (t.id === 'rn' && pk && pk.rt) {
    pk.rt.d.name = t.value.slice(0, 60);
    return;
  }
  if (t.dataset.rf && pk && pk.rt) {
    const f = t.dataset.rf,
      x = (pk.rt.d.sets[+t.dataset.ri] || [])[+t.dataset.rj];
    if (!x || !['kg', 'reps', 'min', 'km', 'kcal'].includes(f)) return;
    let v = t.value.replace(',', '.').replace(/[^\d.]/g, '');
    v = ['reps', 'kcal'].includes(f) ? v.replace(/\./g, '').slice(0, 4) : (v.match(/^\d{0,5}\.?\d{0,3}/) || [''])[0];
    if (v !== t.value.replace(',', '.')) t.value = v;
    x[f] = v;
    return;
  }
  const s = cur();
  if (!s) return;
  if (t.dataset.note !== undefined) {
    const e = s.exercises[+t.dataset.note];
    if (!e) return;
    const k = K(e.name),
      v = t.value.slice(0, 200),
      g = gymCur(),
      o = g ? g.notes : (S.notes = S.notes || {});
    if (v.trim()) o[k] = v;
    else delete o[k];
    save();
    return;
  }
  if (!['kg', 'reps', 'min', 'km', 'kcal'].includes(t.dataset.f)) return;
  const x = s.exercises[+t.dataset.i] && s.exercises[+t.dataset.i].sets[+t.dataset.j];
  if (!x) return;
  let v = t.value.replace(',', '.').replace(/[^\d.]/g, '');
  v = ['reps', 'kcal'].includes(t.dataset.f)
    ? v.replace(/\./g, '').slice(0, 4)
    : (v.match(/^\d{0,5}\.?\d{0,3}/) || [''])[0];
  if (v !== t.value.replace(',', '.')) t.value = v;
  x[t.dataset.f] = v;
  x.t = true;
  save();
});
/* formulaire « Sauvegarde en ligne » : la touche Entrée ne recharge jamais la page (le bouton fait le travail) */
document.addEventListener('submit', ev => {
  ev.preventDefault();
});
/* case « Vibration courte à la fin du repos » */
document.addEventListener('change', ev => {
  if (ev.target.id === 'vib') {
    if (ev.target.checked) delete S.nv;
    else S.nv = true;
    save();
  }
});
document.addEventListener('click', ev => {
  const tb = ev.target.closest('[data-tab]');
  if (tb) {
    setTab(tb.dataset.tab);
    render();
    window.scrollTo(0, 0);
    return;
  }
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act,
    s = cur(),
    i = +b.dataset.i,
    j = +b.dataset.j,
    k = +b.dataset.k;
  const choixRoutine = pk && pk.rt && pk.pick; /* choix d'exercice pour une routine : pas besoin de séance en cours */
  if (
    !s &&
    !(choixRoutine && a === 'padd') &&
    ['padd', 'addset', 'delex', 'finish', 'cancel', 'chk', 'rex', 'wu', 'sug'].includes(a)
  )
    return;
  if (['addset', 'delex', 'rex', 'sug', 'chk', 'wu'].includes(a) && !s.exercises[i]) return;
  if ((a === 'chk' || a === 'wu') && !s.exercises[i].sets[j]) return;
  if (['wu', 'rex', 'sug'].includes(a) && s.exercises[i].cardio) return;
  if (['pm', 'bar', 'imerge', 'irepl', 'trest', 'vrest', 'tempty'].includes(a) && !pk) return;
  if ((a === 'start' || a === 'startr') && S.current) return;
  /* choix d'exercice ouvert depuis l'éditeur de routine : l'exercice va dans la routine, puis retour à l'éditeur */
  if (pk && pk.rt && pk.pick && (a === 'padd' || a === 'closepk')) {
    if (a === 'padd') {
      const nm = cname(b.dataset.n);
      if (!nm) return;
      pk.rt.d.exercises.push(nm);
      pk.rt.d.sets.push(brouillon({exercises: [nm]}).sets[0]);
    }
    pk.pick = 0;
    sheet();
    return;
  }
  const g = GESTES[a];
  if (g && g({a, b, s, i, j, k}) !== true) return;
  save();
  render();
});
