/* Fluxe Suivi — Glisser vers la gauche (v3.7.0).
   Un élément .gl contient des boutons .gl-act (cachés derrière) et un contenu .gl-c.
   Glisser le contenu vers la gauche montre les boutons, vers la droite les cache. Un seul ouvert à la fois ;
   toucher ailleurs referme. Le défilement vertical de la page n'est pas gêné. */
let g = null,
  x0 = 0,
  y0 = 0,
  dx = 0,
  suit = false,
  base = 0;
const largeur = e => (e.querySelector('.gl-act') || {offsetWidth: 0}).offsetWidth;
const placer = (e, v) => (e.querySelector('.gl-c').style.transform = v ? `translateX(${v}px)` : '');
export function fermerTout(sauf) {
  document.querySelectorAll('.gl.ouvert').forEach(e => {
    if (e === sauf) return;
    e.classList.remove('ouvert');
    placer(e, 0);
  });
}
document.addEventListener('pointerdown', ev => {
  const c = ev.target.closest('.gl-c');
  if (!c) {
    if (!ev.target.closest('.gl-act')) fermerTout();
    return;
  }
  g = c.parentElement;
  x0 = ev.clientX;
  y0 = ev.clientY;
  dx = 0;
  suit = false;
  base = g.classList.contains('ouvert') ? -largeur(g) : 0;
});
document.addEventListener('pointermove', ev => {
  if (!g) return;
  const mx = ev.clientX - x0,
    my = ev.clientY - y0;
  if (!suit) {
    if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.5) {
      suit = true;
      g.classList.add('glisse');
      fermerTout(g);
    } else if (Math.abs(my) > 10) {
      g = null; /* l'utilisateur fait défiler la page */
      return;
    } else return;
  }
  dx = mx;
  const w = largeur(g);
  placer(g, Math.max(-w - 24, Math.min(0, base + dx)));
});
const fin = () => {
  if (!g) return;
  const e = g;
  g = null;
  e.classList.remove('glisse');
  if (!suit) return;
  const w = largeur(e),
    ouvrir = base + dx < -w / 2;
  e.classList.toggle('ouvert', ouvrir);
  placer(e, ouvrir ? -w : 0);
  e.dataset.glisse = '1'; /* le « clic » qui suit un glissement ne doit rien déclencher */
  setTimeout(() => delete e.dataset.glisse, 60);
};
document.addEventListener('pointerup', fin);
document.addEventListener('pointercancel', fin);
document.addEventListener(
  'click',
  ev => {
    const e = ev.target.closest('.gl');
    if (e && e.dataset.glisse && !ev.target.closest('.gl-act')) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  },
  true
);
