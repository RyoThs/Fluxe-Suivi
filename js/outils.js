/* Fluxe Suivi — Petites fonctions de calcul et de mise en forme, sans effet de bord. */
export const $=q=>document.querySelector(q);
export const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export const fmtDate=t=>new Date(t).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
export const norm=n=>n.trim().toLowerCase();
export const dn=x=>x.done!==false;
export const ok=x=>dn(x)&&!x.w; /* série de travail validée (hors échauffement) */
export const vol=s=>s.exercises.reduce((a,e)=>e.cardio?a:a+e.sets.reduce((b,x)=>b+(ok(x)?(+x.kg)*(+x.reps):0),0),0);
export const nset=s=>s.exercises.reduce((a,e)=>e.cardio?a:a+e.sets.filter(ok).length,0);
export const e1=x=>(+x.kg)*(1+(+x.reps)/30); /* force estimée : sert seulement à la suggestion de charge */
/* Records : la série la plus LOURDE gagne (poids réellement soulevé) ; à poids égal, celle qui a le plus de répétitions */
export const mieux=(x,y)=>!y||(+x.kg||0)>(+y.kg||0)||((+x.kg||0)===(+y.kg||0)&&(+x.reps||0)>(+y.reps||0));
export const top=l=>l.reduce((a,x)=>mieux(x,a)?x:a,null);
export const fmt=n=>Math.round(n).toLocaleString('fr-FR');
export const fmtT=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
export const mins=t=>Math.max(0,Math.floor((Date.now()-t)/60000));
export const cname=v=>String(v).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,60); /* même règle que le nettoyage des données */
export const K=n=>'k:'+norm(n).slice(0,60);
export const fmtN=n=>String(Math.round(n*100)/100).replace('.',',');
