/* Fluxe Suivi — Gestes : Routines : éditeur détaillé (séries, poids, reps, blocs cardio), création depuis l'Historique, suppression.
   Chaque geste reçoit le bouton touché (b), la séance en cours (s) et les numéros i, j, k du bouton.
   Il renvoie true quand l'app doit enregistrer puis redessiner l'écran ; sinon il s'en occupe lui-même. */
import {S,pk,save,toast} from '../etat.js';
import {$,cname,uid} from '../outils.js';
import {avertir,confirmer,saisir} from '../dialogue.js';
import {gymCur} from '../salle.js';
import {render} from '../rendu.js';
import {closePk,openSheet,sheet} from '../vues/panneaux.js';
import {brouillon,depuisSeance,vide} from '../routines.js';
import {toTrash} from '../sauvegarde.js';
const editeur=({a,b,s,i,j,k})=>{if(!pk||!pk.rt)return;const d=pk.rt.d,ri=+b.dataset.ri,rj=+b.dataset.rj;
 if(a==='rsadd'){const l=d.sets[ri];if(!l||l.length>=30)return;const c=l.length?{...l[l.length-1]}:vide(d.exercises[ri]);delete c.w;l.push(c)}
 else if(a==='rsdel'){const l=d.sets[ri];if(!l||l.length<2)return;l.splice(rj,1)}
 else if(a==='rxdel'){if(!d.exercises[ri])return;d.exercises.splice(ri,1);d.sets.splice(ri,1)}
 else if(a==='rxadd'){if(d.exercises.length>=60)return;const g=gymCur();pk.pick=1;pk.q='';pk.v=g&&g.eq.length?'salle':'cat';pk.m='Tous';sheet();$('#sheet').scrollTop=0;return}
 else{const name=cname(d.name);if(!name){avertir({icone:'crayon',ton:'ambre',titre:'Nom manquant',texte:'Donne un nom à ta routine.'});return}
  if(!d.exercises.length){avertir({icone:'alerte',ton:'ambre',titre:'Routine vide',texte:'Ajoute au moins un exercice, ou supprime la routine.'});return}
  const r=S.routines[pk.rt.k];if(!r)return;
  S.routines[pk.rt.k]={id:r.id||uid(),name,exercises:d.exercises.slice(),sets:d.sets.map(l=>l.map(x=>({...x})))};
  save();closePk();render();toast('Routine enregistrée ✓');return}
 sheet();return};
export const gestes={
redit:({a,b,s,i,j,k})=>{const r=S.routines[k];if(!r)return;openSheet({rt:{k,d:brouillon(r)}});return},
rsadd:editeur,
rsdel:editeur,
rxdel:editeur,
rxadd:editeur,
rsave:editeur,
mkr:({a,b,s,i,j,k})=>{const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x)return;
 if(S.routines.length>=200){avertir({icone:'info',ton:'bleu',titre:'200 routines maximum',texte:'Supprime une routine pour en créer une nouvelle.'});return}
 saisir({icone:'signet',ton:'bleu',titre:'Créer une routine',texte:'Elle reprend les exercices et les séries de cette séance. Tu la retrouveras sur l’accueil.',valeur:'Séance du '+new Date(x.date).toLocaleDateString('fr-FR'),max:60,label:'Nom de la routine',ok:'Créer la routine',non:'Annuler'}).then(n=>{
 const nm=n&&cname(n);if(!nm)return;const r=depuisSeance(x,nm);if(!r.exercises.length)return;S.routines.push(r);save();render();toast('Routine « '+nm+' » créée : retrouve-la sur l’accueil')});return},
delr:({a,b,s,i,j,k})=>{const r=S.routines[k];if(!r)return;confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Mettre la routine à la corbeille ?',texte:'« '+r.name+' » · récupérable pendant 30 jours.',ok:'Mettre à la corbeille',non:'Garder la routine'}).then(ok=>{if(!ok)return;const x=S.routines.indexOf(r);if(x<0)return;toTrash({r});S.routines.splice(x,1);if(pk&&pk.rt)closePk();save();render();toast('Routine mise à la corbeille')});return}
};
