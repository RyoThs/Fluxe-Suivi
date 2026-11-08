/* Fluxe Suivi — Ma salle : salle active, machines présentes, notes de réglage. */
import {CHAINS,XS} from './catalogue.js';
import {S} from './etat.js';
import {K,norm} from './outils.js';
/* Ma salle : salle active, machines présentes, notes de réglage (celle de la salle d'abord, sinon la note générale) */
export const gymCur=()=>S.gyms.find(g=>g.id===S.gym)||null;
export const inGym=n=>{const g=gymCur();return !!g&&g.eq.some(x=>norm(x)===norm(n))};
export const noteOf=n=>{const g=gymCur(),k=K(n);return (g&&g.notes[k])||(S.notes&&S.notes[k])||''};
/* une machine exclusive On Air n'est visible que si la salle active est une salle On Air */
export const vis=n=>!XS.has(n)||(gymCur()&&gymCur().chain==='on-air');
export const chainOf=g=>g&&CHAINS.find(c=>c.id===g.chain)||null;
