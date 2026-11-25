/* Fluxe Suivi — Nouveau jour : l'iPhone et Android « réveillent » l'app sans la recharger.
   Sans ce fichier, l'écran restait celui du dernier jour d'utilisation (ex. les semaines d'affilée
   restaient sur la semaine d'avant, v3.14.1). Quand l'app revient au premier plan un autre jour, on redessine. */
import {render} from './rendu.js';

const jour = () => new Date().toDateString();
let dernier = jour();
export function verifierJour() {
  if (document.visibilityState === 'hidden') return false;
  const j = jour();
  if (j === dernier) return false;
  dernier = j;
  render();
  return true;
}
document.addEventListener('visibilitychange', verifierJour);
window.addEventListener('pageshow', verifierJour);
