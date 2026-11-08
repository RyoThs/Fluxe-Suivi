/* Fluxe Suivi — Pictogrammes des machines (dessins SVG). */
import {TG} from './catalogue.js';
export const DB=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>`;
/* Pictogrammes des machines */
const IC=Object.assign(Object.create(null),{
dumbbell:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
barbell:'<path d="M2 12h20M5 7v10M8 9v6M19 7v10M16 9v6"/>',
body:'<circle cx="12" cy="5" r="2"/><path d="M12 7v6M7 9l5 2 5-2M9 21l3-8 3 8"/>',
treadmill:'<circle cx="14" cy="4.5" r="1.6"/><path d="M13 7.5l-3 3 3 2-1 4M13 7.5l3 2.5 2.5-1M10 10.5l-3 1M3 19h18M5 19l-1 2M19 19l1 2"/>',
bike:'<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9L8.5 6.5H7M14 6h3"/>',
recumbent:'<circle cx="18" cy="16" r="3"/><path d="M3 18h7M6 18v-8M6 13h6l6 3M6 10H4"/>',
elliptical:'<path d="M4 20h16M8 20l2-9M16 20l-2-9M10 11l2-8M14 11l-2-8"/>',
rower:'<path d="M3 17h18M5 17v-4l6-1M11 12l4-4 3 2M18 10v7M3 20h5"/>',
stairs:'<path d="M3 20h4v-4h4v-4h4V8h4V4"/>',
skierg:'<path d="M12 3v18M7 5h10M8 5l-2 7M16 5l2 7"/>',
cable:'<circle cx="17" cy="5" r="2"/><path d="M5 3v18M5 5h10M17 7v8M15 15h4"/>',
plate:'<circle cx="9" cy="12" r="5"/><circle cx="9" cy="12" r="1.5"/><path d="M14 12h7M19 9v6"/>',
stack:'<rect x="6" y="3" width="8" height="18" rx="1"/><path d="M6 7h8M6 11h8M6 15h8M14 13h5M19 13v5"/>'
});
const svg=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[k]||IC.dumbbell)+'</svg>';
const CI=Object.assign(Object.create(null),{'Tapis de course':'treadmill','Marche inclinée':'treadmill','Vélo droit':'bike','Assault bike':'bike','Vélo semi-allongé':'recumbent','Elliptique':'elliptical','Rameur':'rower','Escalier (stepper)':'stairs','PowerMill Climber':'stairs','SkiErg':'skierg'});
function iconOf(n){
if(CI[n])return CI[n];
const tg=TG[n];
if(tg==='Poulie')return 'cable';
if(tg==='Hammer Strength'||tg==='Panatta')return 'plate';
if(tg==='Machine guidée'||tg==='Hammer Strength Select')return 'stack';
if(/haltère|kettlebell|farmer|thruster/i.test(n))return 'dumbbell';
if(/barre|squat|soulevé|développé|good morning|hip thrust|push press|arraché|épaulé/i.test(n)||tg==='Eleiko')return 'barbell';
if(/pompes|tractions|dips|gainage|crunch|roue|relevé|fentes|step|nordic|russian|reverse|hyperext/i.test(n))return 'body';
return 'dumbbell';
}
export function thumb(n,sz){
return `<span class="mi${sz?' '+sz:''}">${svg(iconOf(n))}</span>`;
}
