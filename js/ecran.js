/* Fluxe Suivi — Écran fixe : pas de zoom, téléphone tenu en hauteur.
   - Zoom : bloqué par la balise viewport, par « touch-action » (double tape) et ici (pincement à deux doigts sur iPhone).
   - Rotation : Android (app installée) se verrouille en portrait ; l'iPhone ne le permet pas aux apps web,
     donc un message « Tourne ton téléphone » couvre l'écran à l'horizontale (voir #rot dans app.css). */
const stop=e=>{e.preventDefault()};
/* iPhone/iPad : gestes de pincement propres à Safari */
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,stop,{passive:false}));
/* pincement à deux doigts (autres navigateurs) ; le défilement à un doigt reste normal */
document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1)e.preventDefault()},{passive:false});
/* Android, app installée : verrouillage en portrait (ignoré ailleurs, sans erreur) */
try{const o=window.screen.orientation;if(o&&o.lock)o.lock('portrait').catch(()=>{})}catch(e){}
