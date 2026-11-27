/* Fluxe Suivi — Partager une séance en image (v3.17).
   L'image est dessinée sur le téléphone (canvas) : rien n'est envoyé par Fluxe sur internet.
   Avec un menu de partage (iPhone, Android) : WhatsApp, Instagram, Messages… Sinon, l'image est enregistrée. */
import {toast} from './etat.js';

const L = 1080,
  C = {
    fond: '#f3f5fb',
    carte: '#ffffff',
    encre: '#0b1022',
    gris: '#5b6482',
    trait: '#dfe4f1',
    bleu: '#4f46e5',
    teinte: '#eceafd',
    or: '#b45309',
    orFond: '#fff3c4',
    vert: '#0f766e',
    vertFond: '#e6fbf6',
  };
const TITRE = '"Barlow Condensed", "Arial Narrow", sans-serif',
  TEXTE = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function arrondi(x, c, y, l, h, r, couleur) {
  x.beginPath();
  x.roundRect(c, y, l, h, r);
  x.fillStyle = couleur;
  x.fill();
}
/* coupe le texte avec « … » s'il dépasse la largeur */
function couper(x, t, max) {
  if (x.measureText(t).width <= max) return t;
  while (t.length > 1 && x.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
}

/** Dessine l'image d'une séance (résumé de resume-seance.js) et renvoie le canvas. */
export function dessiner(r) {
  const max = 6,
    liste = r.exercices.slice(0, max),
    plus = r.exercices.length > max ? 60 : 0,
    hc = Math.max(1, liste.length) * 100 + 70 + plus /* hauteur de la carte des exercices */,
    H = 540 + hc + 170;
  const cv = document.createElement('canvas');
  cv.width = L;
  cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = C.fond;
  x.fillRect(0, 0, L, H);
  /* bandeau dégradé aux couleurs de Fluxe */
  const g = x.createLinearGradient(0, 0, L, 420);
  g.addColorStop(0, '#5eead4');
  g.addColorStop(0.55, '#818cf8');
  g.addColorStop(1, '#c084fc');
  x.fillStyle = g;
  x.fillRect(0, 0, L, 430);
  x.fillStyle = 'rgba(255,255,255,.92)';
  x.font = '600 36px ' + TEXTE;
  x.fillText(couper(x, r.date, L - 160), 80, 120);
  x.fillStyle = '#ffffff';
  x.font = '800 104px ' + TITRE;
  x.fillText(couper(x, r.titre, L - 160), 80, 230);
  /* 3 chiffres */
  const cases = [
    [r.duree, 'durée'],
    [r.volume, 'volume'],
    [String(r.records), r.records > 1 ? 'records' : 'record'],
  ];
  const lc = (L - 160 - 2 * 28) / 3;
  cases.forEach(([v, t], i) => {
    const cx = 80 + i * (lc + 28),
      pr = i === 2 && r.records > 0;
    arrondi(x, cx, 300, lc, 190, 32, pr ? C.orFond : C.carte);
    x.fillStyle = pr ? C.or : C.encre;
    x.font = '700 76px ' + TITRE;
    x.fillText(couper(x, v, lc - 56), cx + 32, 400);
    x.fillStyle = C.gris;
    x.font = '600 30px ' + TEXTE;
    x.fillText(t, cx + 32, 455);
  });
  /* exercices */
  arrondi(x, 60, 540, L - 120, hc, 40, C.carte);
  liste.forEach((e, i) => {
    const y = 600 + i * 100;
    if (i) {
      x.fillStyle = C.trait;
      x.fillRect(100, y - 18, L - 200, 2);
    }
    arrondi(x, 100, y, 76, 64, 18, e.cardio ? C.vertFond : C.teinte);
    x.fillStyle = e.cardio ? C.vert : C.bleu;
    x.font = '800 24px ' + TEXTE;
    x.textAlign = 'center';
    x.fillText(e.code, 138, y + 41);
    x.textAlign = 'left';
    const lt = e.record ? L - 200 - 120 - 190 : L - 200 - 120;
    x.fillStyle = C.encre;
    x.font = '650 36px ' + TEXTE;
    x.fillText(couper(x, e.nom, lt), 200, y + 26);
    x.fillStyle = C.gris;
    x.font = '500 29px ' + TEXTE;
    x.fillText(couper(x, e.ligne, lt), 200, y + 66);
    if (e.record) {
      arrondi(x, L - 100 - 170, y + 10, 170, 50, 25, C.orFond);
      x.fillStyle = C.or;
      x.font = '800 26px ' + TEXTE;
      x.textAlign = 'center';
      x.fillText('Record', L - 100 - 85, y + 44);
      x.textAlign = 'left';
    }
  });
  if (r.exercices.length > max) {
    x.fillStyle = C.bleu;
    x.font = '700 30px ' + TEXTE;
    const n = r.exercices.length - max;
    x.fillText('+ ' + n + ' autre' + (n > 1 ? 's' : '') + ' exercice' + (n > 1 ? 's' : ''), 100, 540 + hc - 50);
  }
  /* signature */
  x.fillStyle = C.encre;
  x.font = '800 52px ' + TITRE;
  x.fillText('Fluxe Suivi', 80, H - 65);
  x.fillStyle = C.gris;
  x.font = '500 28px ' + TEXTE;
  x.textAlign = 'right';
  x.fillText('Mon suivi de musculation', L - 80, H - 70);
  x.textAlign = 'left';
  return cv;
}

const nomFichier = t => {
  const d = new Date(t),
    z = n => String(n).padStart(2, '0');
  return 'fluxe-seance-' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '.png';
};

/** Fabrique l'image puis l'envoie au menu de partage du téléphone (ou l'enregistre). */
export async function partagerSeance(r, date) {
  try {
    if (document.fonts && document.fonts.load) await document.fonts.load('800 40px "Barlow Condensed"').catch(() => {});
    const cv = dessiner(r);
    const blob = await new Promise((ok, ko) => cv.toBlob(b => (b ? ok(b) : ko(new Error('image vide'))), 'image/png'));
    const nom = nomFichier(date),
      f = new File([blob], nom, {type: 'image/png'});
    if (navigator.canShare && navigator.share && navigator.canShare({files: [f]})) {
      try {
        await navigator.share({files: [f], title: r.titre + ' · Fluxe Suivi'});
      } catch (e) {
        if (e && e.name === 'AbortError') return; /* l'utilisateur a fermé le menu : rien à dire */
        throw e;
      }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Image enregistrée : ' + nom);
  } catch (e) {
    toast('Partage impossible : réessaie dans un instant');
    throw e; /* noté dans le rapport d'erreurs */
  }
}
