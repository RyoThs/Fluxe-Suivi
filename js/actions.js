/* Fluxe Suivi — Réactions aux gestes : saisie et boutons (data-act). */
import {BKD} from './config.js';
import {CHAINS,M,MU,catOf} from './catalogue.js';
import {clean,purge,unwrap} from './donnees.js';
import {S,cur,pk,save,setS,setTab,toast} from './etat.js';
import {$,K,cname,dn,esc,fmt,fmtDate,mins,norm,nset,uid,vol} from './outils.js';
import {avertir,confirmer,demander,pastilles,saisir} from './dialogue.js';
import {newEx,restFor,suggest} from './calculs.js';
import {chainOf,gymCur,inGym} from './salle.js';
import {render} from './rendu.js';
import {setRx,setSx} from './vues/stats.js';
import {glist,gymCard,segGuide,setGm,setGq,setGv} from './vues/guide.js';
import {closePk,discs,openPk,openSheet,openTool,plist,sheet} from './vues/panneaux.js';
import {fillData} from './vues/ecran-sauvegarde.js';
import {tAdd,tKeep,tSet,tStart,tStop,tToggle,dureeTxt} from './minuteur.js';
import {brouillon,depuisSeance,exercicesDe,vide} from './routines.js';
import {VB,snap} from './versions.js';
import {imp,merge,pack,saveFile,toTrash} from './sauvegarde.js';
$('#fi').addEventListener('change',ev=>{const f=ev.target.files[0];if(!f)return;if(f.size>5e6){avertir({icone:'alerte',ton:'ambre',titre:'Fichier trop lourd',texte:'Ce fichier dépasse 5 Mo : ce n’est pas une sauvegarde Fluxe.'});ev.target.value='';return}const r=new FileReader();r.onload=()=>imp(String(r.result));r.readAsText(f);ev.target.value=''});
document.addEventListener('input',ev=>{
const t=ev.target;
if(t.id==='pq'&&pk&&!pk.tool){pk.q=t.value.slice(0,60);$('#pl').innerHTML=plist();return}
if(t.id==='dq'&&pk&&pk.tool){pk.kg=t.value.replace(/[^\d.,]/g,'').slice(0,6);$('#dr').innerHTML=discs();return}
if(t.id==='gq'){setGq(t.value.slice(0,60));$('#gl').innerHTML=glist();return}
/* éditeur de routine (brouillon : rien n'est enregistré avant « Enregistrer ») */
if(t.id==='rn'&&pk&&pk.rt){pk.rt.d.name=t.value.slice(0,60);return}
if(t.dataset.rf&&pk&&pk.rt){const f=t.dataset.rf,x=(pk.rt.d.sets[+t.dataset.ri]||[])[+t.dataset.rj];if(!x||!['kg','reps','min','km','kcal'].includes(f))return;
 let v=t.value.replace(',','.').replace(/[^\d.]/g,'');v=['reps','kcal'].includes(f)?v.replace(/\./g,'').slice(0,4):(v.match(/^\d{0,5}\.?\d{0,3}/)||[''])[0];
 if(v!==t.value.replace(',','.'))t.value=v;x[f]=v;return}
const s=cur();if(!s)return;
if(t.dataset.note!==undefined){const e=s.exercises[+t.dataset.note];if(!e)return;const k=K(e.name),v=t.value.slice(0,200),g=gymCur(),o=g?g.notes:(S.notes=S.notes||{});if(v.trim())o[k]=v;else delete o[k];save();return}
if(!['kg','reps','min','km','kcal'].includes(t.dataset.f))return;
const x=s.exercises[+t.dataset.i]&&s.exercises[+t.dataset.i].sets[+t.dataset.j];if(!x)return;
let v=t.value.replace(',','.').replace(/[^\d.]/g,'');
v=['reps','kcal'].includes(t.dataset.f)?v.replace(/\./g,'').slice(0,4):(v.match(/^\d{0,5}\.?\d{0,3}/)||[''])[0];
if(v!==t.value.replace(',','.'))t.value=v;
x[t.dataset.f]=v;x.t=true;save();
});
/* case « Vibration courte à la fin du repos » */
document.addEventListener('change',ev=>{if(ev.target.id==='vib'){if(ev.target.checked)delete S.nv;else S.nv=true;save()}});
document.addEventListener('click',ev=>{
const tb=ev.target.closest('[data-tab]');if(tb){setTab(tb.dataset.tab);render();window.scrollTo(0,0);return}
const b=ev.target.closest('[data-act]');if(!b)return;
const a=b.dataset.act,s=cur(),i=+b.dataset.i,j=+b.dataset.j,k=+b.dataset.k;
const choixRoutine=pk&&pk.rt&&pk.pick; /* choix d'exercice pour une routine : pas besoin de séance en cours */
if(!s&&!(choixRoutine&&a==='padd')&&['padd','addset','delex','finish','cancel','chk','rex','wu','sug'].includes(a))return;
if(['addset','delex','rex','sug','chk','wu'].includes(a)&&!s.exercises[i])return;
if((a==='chk'||a==='wu')&&!s.exercises[i].sets[j])return;
if(['wu','rex','sug'].includes(a)&&s.exercises[i].cardio)return;
if(['pm','bar','imerge','irepl','trest','vrest','tempty'].includes(a)&&!pk)return;
if((a==='start'||a==='startr')&&S.current)return;
if(a==='t+'){tAdd(15000);return}
if(a==='t-'){tAdd(-15000);return}
if(a==='tset'){const v=+b.dataset.s;if(v>=15&&v<=600)tSet(v);return}
if(a==='tcfg'){tToggle();return}
if(a==='tkeep'){tKeep();render();return}
if(a==='rx'){setRx(b.dataset.v);render();return}
/* Temps de repos (par défaut ou pour un exercice) : choix rapides, puis 15 s en 15 s */
if(['rsv','rsm','rsp','rsok'].includes(a)){if(!pk||!pk.rs)return;const r=pk.rs;
 if(a==='rsv'){const v=+b.dataset.s;if(v>=15&&v<=600)r.v=v}
 else if(a==='rsm')r.v=Math.max(15,r.v-15);
 else if(a==='rsp')r.v=Math.min(600,r.v+15);
 else{if(r.n){S.rests=S.rests||{};S.rests[K(r.n)]=r.v}else S.rest=r.v;save();closePk();render();toast('Repos'+(r.n?' pour '+r.n:' par défaut')+' : '+dureeTxt(r.v));return}
 sheet();return}
/* Éditeur de routine */
if(a==='redit'){const r=S.routines[k];if(!r)return;openSheet({rt:{k,d:brouillon(r)}});return}
if(['rsadd','rsdel','rxdel','rxadd','rsave'].includes(a)){if(!pk||!pk.rt)return;const d=pk.rt.d,ri=+b.dataset.ri,rj=+b.dataset.rj;
 if(a==='rsadd'){const l=d.sets[ri];if(!l||l.length>=30)return;const c=l.length?{...l[l.length-1]}:vide(d.exercises[ri]);delete c.w;l.push(c)}
 else if(a==='rsdel'){const l=d.sets[ri];if(!l||l.length<2)return;l.splice(rj,1)}
 else if(a==='rxdel'){if(!d.exercises[ri])return;d.exercises.splice(ri,1);d.sets.splice(ri,1)}
 else if(a==='rxadd'){if(d.exercises.length>=60)return;const g=gymCur();pk.pick=1;pk.q='';pk.v=g&&g.eq.length?'salle':'cat';pk.m='Tous';sheet();$('#sheet').scrollTop=0;return}
 else{const name=cname(d.name);if(!name){avertir({icone:'crayon',ton:'ambre',titre:'Nom manquant',texte:'Donne un nom à ta routine.'});return}
  if(!d.exercises.length){avertir({icone:'alerte',ton:'ambre',titre:'Routine vide',texte:'Ajoute au moins un exercice, ou supprime la routine.'});return}
  const r=S.routines[pk.rt.k];if(!r)return;
  S.routines[pk.rt.k]={id:r.id||uid(),name,exercises:d.exercises.slice(),sets:d.sets.map(l=>l.map(x=>({...x})))};
  save();closePk();render();toast('Routine enregistrée ✓');return}
 sheet();return}
/* choix d'exercice ouvert depuis l'éditeur de routine : l'exercice va dans la routine, puis retour à l'éditeur */
if(pk&&pk.rt&&pk.pick&&(a==='padd'||a==='closepk')){
 if(a==='padd'){const nm=cname(b.dataset.n);if(!nm)return;pk.rt.d.exercises.push(nm);pk.rt.d.sets.push(brouillon({exercises:[nm]}).sets[0])}
 pk.pick=0;sheet();return}
/* créer une routine à partir d'une séance de l'historique */
if(a==='mkr'){const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x)return;
 if(S.routines.length>=200){avertir({icone:'info',ton:'bleu',titre:'200 routines maximum',texte:'Supprime une routine pour en créer une nouvelle.'});return}
 saisir({icone:'signet',ton:'bleu',titre:'Créer une routine',texte:'Elle reprend les exercices et les séries de cette séance. Tu la retrouveras sur l’accueil.',valeur:'Séance du '+new Date(x.date).toLocaleDateString('fr-FR'),max:60,label:'Nom de la routine',ok:'Créer la routine',non:'Annuler'}).then(n=>{
 const nm=n&&cname(n);if(!nm)return;const r=depuisSeance(x,nm);if(!r.exercises.length)return;S.routines.push(r);save();render();toast('Routine « '+nm+' » créée : retrouve-la sur l’accueil')});return}
if(a==='t0'){tStop();return}
if(a==='pm'){pk.m=M.includes(b.dataset.m)?b.dataset.m:'Tous';sheet();return}
if(a==='pv'){pk.v=b.dataset.v==='salle'?'salle':'cat';sheet();return}
if(a==='data'){openSheet({data:1});return}
if(a==='file'){saveFile();return}
if(a==='imerge'||a==='irepl'){const d=pk.imp;if(!d)return;
const go=()=>snap('imp').then(()=>{
if(a==='irepl'){d.current=null;d.editBak=null;d.sessions.forEach(x=>delete x.edit);setS(purge(d));tStop();save();closePk();render();toast('Données remplacées ✓ (version de secours créée)')}
else{const r=merge(d);save();closePk();render();avertir({icone:'valide',ton:'vert',titre:'Fusion terminée',texte:'Rien n’a été effacé.',corps:pastilles([r.add+' ajoutée'+(r.add>1?'s':''),r.upd+' mise'+(r.upd>1?'s':'')+' à jour',r.skip?r.skip+' ignorée'+(r.skip>1?'s':'')+' (corbeille)':''])})}});
if(a==='irepl')confirmer({icone:'alerte',ton:'rouge',danger:1,titre:'Remplacer toutes les données ?',texte:'Les séances de ce téléphone seront remplacées par celles du fichier. Une version de secours est créée juste avant.',ok:'Remplacer les données',non:'Annuler'}).then(ok=>{if(ok)go()});else go();return}
if(a==='snapnow'){snap('man').then(ok=>{toast(ok?'Version de secours créée ✓':'Impossible de créer une version sur ce navigateur');if(pk&&pk.data)fillData()});return}
if(a==='vrest'){const at=+b.dataset.at;
if(S.current){avertir({icone:'alerte',ton:'ambre',titre:'Séance en cours',texte:'Termine ou annule d’abord la séance en cours.'});return}
confirmer({icone:'retour',ton:'bleu',titre:'Revenir à cette version ?',texte:'Tes données actuelles seront gardées dans une nouvelle version de secours.',ok:'Revenir à cette version',non:'Annuler'}).then(ok=>{if(!ok)return;
VB.all().then(l=>{const v=l.find(x=>x.at===at);let d=null;try{d=v&&clean(unwrap(JSON.parse(v.raw)))}catch(e){}
if(!d){avertir({icone:'alerte',ton:'ambre',titre:'Version illisible',texte:'Cette version ne peut pas être lue. Rien n’a été modifié.'});return}
return snap('rest').then(()=>{d.current=null;d.editBak=null;d.sessions.forEach(x=>delete x.edit);setS(purge(d));save();tStop();render();sheet();toast('Version restaurée ✓')})}).catch(()=>avertir({icone:'alerte',ton:'ambre',titre:'Indisponible',texte:'Les versions de secours ne sont pas disponibles sur ce navigateur.'}))});return}
if(a==='trest'){const x=+b.dataset.x,t=S.trash[x];if(!t)return;
if(t.s){if(S.sessions.some(y=>y.id===t.s.id))toast('Cette séance est déjà dans ton historique');else S.sessions.push(t.s)}
else S.routines.push(t.r);
S.trash.splice(x,1);save();render();sheet();toast('Restauré ✓');return}
if(a==='tempty'){const n=S.trash.length;confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Vider la corbeille ?',texte:(n>1?n+' éléments seront effacés':'1 élément sera effacé')+' définitivement.',ok:'Vider la corbeille',non:'Annuler'}).then(ok=>{if(!ok)return;S.trash=[];save();render();sheet()});return}
/* Choix d'une enseigne : nouvelle salle, ou changement d'enseigne de la salle active. Toutes les machines sont cochées d'office. */
if(a==='gens'){const ch=CHAINS.find(c=>c.id===b.dataset.t)||null;if(!ch&&b.dataset.t!=='autre')return;
const eq=catOf(ch),nom=ch?ch.name:'Ma salle',g=gymCur();
if(pk&&pk.ens&&pk.ens.chg&&g){confirmer({icone:'salle',ton:'bleu',titre:'Passer sur '+nom+' ?',texte:'Ses '+eq.length+' machines seront cochées et remplaceront les coches de « '+g.name+' ». Tes réglages sont gardés.',ok:'Changer d’enseigne',non:'Annuler'}).then(ok=>{if(!ok)return;
const old=chainOf(g);if(!old||g.name===old.name)g.name=nom;g.eq=eq;if(ch)g.chain=ch.id;else delete g.chain;
setGv('cat');save();closePk();render();toast('Enseigne changée : '+eq.length+' machines cochées')});return}
if(S.gyms.length>=20){avertir({icone:'info',ton:'bleu',titre:'20 salles maximum',texte:'Supprime une salle pour en créer une nouvelle.'});return}
let n=nom,k=2;while(S.gyms.some(x=>x.name===n))n=nom+' '+k++;
const id=uid();S.gyms.push(ch?{id,name:n,eq,notes:{},chain:ch.id}:{id,name:n,eq,notes:{}});S.gym=id;
setTab('aide');setGm('Tous');setGv('cat');save();if(pk)closePk();render();toast('Salle « '+n+' » créée : '+eq.length+' machines cochées. Décoche celles qui manquent.');return}
if(a==='closepk'){closePk();return}
if(a==='pick'){openPk();return}
if(a==='tool'){openTool();return}
if(a==='bar'){pk.bar=[20,15,10].includes(+b.dataset.b)?+b.dataset.b:20;sheet();return}
if(a==='padd'){const nm=cname(b.dataset.n);if(!nm)return;s.exercises.push(newEx(nm));const g=gymCur();if(g&&!MU[nm]&&!inGym(nm)&&g.eq.length<600)g.eq.push(nm);closePk()}
else if(a==='rest'){openSheet({rs:{n:null,v:S.rest||90}});return}
else if(a==='rex'){const n=s.exercises[i].name;openSheet({rs:{n,v:restFor(n)}});return}
else if(a==='wu'){const x=s.exercises[i].sets[j];if(x){if(x.w)delete x.w;else x.w=true}}
else if(a==='sug'){const sg=suggest(s.exercises[i].name);if(sg)s.exercises[i].sets.forEach(x=>{if(!x.done&&!x.w)x.kg=String(Math.round(sg.kg*100)/100)})}
else if(a==='snz'){S.snooze=Date.now();toast('D’accord, je te le rappelle dans 2 jours')}
else if(a==='bke'){const d=+b.dataset.d;if(BKD.includes(d)){S.bkEvery=d;S.snooze=0;save();render();sheet();toast('Rappel : tous les '+d+' jours');return}}
else if(a==='sx'){setSx(b.dataset.n)}
else if(a==='gm'){setGm(b.dataset.m)}
else if(a==='gv'){setGv(b.dataset.v)}
else if(a==='gnew'){if(S.gyms.length>=20){avertir({icone:'info',ton:'bleu',titre:'20 salles maximum',texte:'Supprime une salle pour en créer une nouvelle.'});return}openSheet({ens:{}});return}
else if(a==='gchg'){if(!gymCur())return;openSheet({ens:{chg:1}});return}
else if(a==='gsel'){S.gym=S.gyms.some(g=>g.id===b.dataset.id)?b.dataset.id:null;}
else if(a==='gren'){const g=gymCur();if(!g)return;saisir({icone:'crayon',ton:'bleu',titre:'Renommer la salle',valeur:g.name,max:40,label:'Nom de la salle'}).then(n=>{if(!n||!cname(n))return;g.name=cname(n).slice(0,40);save();render()});return}
else if(a==='gdel'){const g=gymCur();if(!g)return;confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Supprimer « '+g.name+' » ?',texte:'Ses machines cochées et ses réglages seront perdus. Tes séances restent dans l’historique.',ok:'Supprimer la salle',non:'Garder la salle'}).then(ok=>{if(!ok)return;S.gyms=S.gyms.filter(x=>x.id!==g.id);S.gym=S.gyms[0]?S.gyms[0].id:null;save();render()});return}
else if(a==='gtog'){const g=gymCur(),n=cname(b.dataset.n);if(!g||!n)return;const i=g.eq.findIndex(x=>norm(x)===norm(n));if(i>=0)g.eq.splice(i,1);else if(g.eq.length<600)g.eq.push(n);save();$('#gl').innerHTML=glist();const c=document.querySelector('.card.gym');if(c)c.outerHTML=gymCard();const sg=$('#gvseg');if(sg)sg.outerHTML=segGuide();return}
else if(a==='editsess'){if(S.current){avertir({icone:'alerte',ton:'ambre',titre:'Séance en cours',texte:'Termine ou annule d’abord la séance en cours.'});return}const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x)return;S.editBak=JSON.parse(JSON.stringify(x));x.edit=true;S.current=x.id;setTab('seance');window.scrollTo(0,0)}
else if(a==='start'||a==='startr'){const r=a==='startr'?S.routines[k]:null;if(a==='startr'&&!r)return;const n={id:uid(),date:Date.now(),exercises:r?exercicesDe(r):[]},g=gymCur();if(r){if(!r.id)r.id=uid();n.rt=r.id}if(g){n.g=g.id;n.gn=g.name}S.sessions.push(n);S.current=n.id}
else if(a==='delr'){const r=S.routines[k];if(!r)return;confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Mettre la routine à la corbeille ?',texte:'« '+r.name+' » · récupérable pendant 30 jours.',ok:'Mettre à la corbeille',non:'Garder la routine'}).then(ok=>{if(!ok)return;const x=S.routines.indexOf(r);if(x<0)return;toTrash({r});S.routines.splice(x,1);if(pk&&pk.rt)closePk();save();render();toast('Routine mise à la corbeille')});return}
else if(a==='delex'){const e=s.exercises[i],n=e.sets.filter(x=>x.done).length;confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Retirer cet exercice ?',texte:e.name+(n?' · '+n+' série'+(n>1?'s':'')+' validée'+(n>1?'s':'')+' seront perdue'+(n>1?'s':''):''),ok:'Retirer l’exercice',non:'Garder'}).then(ok=>{if(!ok)return;const x=s.exercises.indexOf(e);if(x<0)return;s.exercises.splice(x,1);save();render()});return}
else if(a==='addset'){const ex=s.exercises[i],l=ex.sets;if(ex.cardio)l.push({min:'',km:'',kcal:'',done:false});else{const p=l[l.length-1]||{kg:'',reps:''};l.push({kg:p.kg,reps:p.reps,done:false})}}
else if(a==='chk'){
const ex=s.exercises[i],x=ex.sets[j];
if(x.done)x.done=false;
else if(ex.cardio){if(String(x.min).trim()===''||!(+x.min>0)){toast('Renseigne au moins la durée en minutes');return}x.done=true}
else{if(String(x.reps).trim()===''||isNaN(+x.reps)||isNaN(+x.kg)){toast('Renseigne les répétitions (et la charge)');return}if(String(x.kg).trim()==='')x.kg='0';x.done=true;if(!s.edit&&!x.w)tStart(restFor(ex.name),ex.name)}
}
else if(a==='finish'){finir(s);return}
else if(a==='cancel'){
if(s.edit){confirmer({icone:'retour',ton:'ambre',danger:1,titre:'Annuler les modifications ?',texte:'La séance redeviendra comme avant.',ok:'Annuler les modifications',non:'Continuer'}).then(ok=>{if(!ok||S.current!==s.id)return;const bk=S.editBak;if(bk)S.sessions=S.sessions.map(x=>x.id===s.id?bk:x);S.current=null;S.editBak=null;tStop();save();render()});return}
const fait=s.exercises.some(e=>e.sets.some(x=>x.done));
confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Annuler la séance ?',texte:fait?'Les séries validées iront dans la corbeille (récupérables 30 jours).':'Aucune série validée : la séance sera supprimée.',ok:'Annuler la séance',non:'Continuer la séance'}).then(ok=>{if(!ok||S.current!==s.id)return;
/* si des séries avaient été validées, la séance part à la corbeille au lieu d'être perdue */
if(fait){const c=JSON.parse(JSON.stringify(s));c.exercises.forEach(e=>e.sets=e.sets.filter(dn).map(x=>{delete x.t;return x}));c.exercises=c.exercises.filter(e=>e.sets.length);c.dur=mins(s.date);toTrash({s:c});toast('Séance annulée (récupérable 30 jours dans la corbeille)')}
S.sessions=S.sessions.filter(x=>x.id!==s.id);S.current=null;tStop();save();render()});return}
else if(a==='delsess'){const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x)return;const ne=x.exercises.length;
confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Mettre à la corbeille ?',texte:'Séance du '+fmtDate(x.date),corps:pastilles([ne+' exercice'+(ne>1?'s':''),nset(x)+' série'+(nset(x)>1?'s':''),fmt(vol(x))+' kg'])+'<p style="margin-top:10px">Tu pourras la récupérer pendant 30 jours.</p>',ok:'Mettre à la corbeille',non:'Garder la séance'}).then(ok=>{if(!ok||!S.sessions.includes(x))return;toTrash({s:x});S.sessions=S.sessions.filter(y=>y!==x);toast('Séance mise à la corbeille');save();render()});return}
else if(a==='export'){(navigator.clipboard?navigator.clipboard.writeText(pack()):Promise.reject()).then(()=>{S.lastBackup=Date.now();save();render();sheet();toast('Données copiées ✓')}).catch(()=>toast('Copie impossible sur ce navigateur'));return}
else if(a==='imp'){$('#fi').click();return}
else if(a==='paste'){saisir({icone:'fichier',ton:'bleu',titre:'Coller des données',texte:'Colle ici le texte copié avec « Copier les données en texte ».',ok:'Importer',label:'Données à importer'}).then(t=>{if(t)imp(t)});return}
save();render();
});
/* ===== Terminer la séance =====
   Séries saisies à la main mais pas validées avec ✓ : on les montre et on propose de les garder, au lieu de les perdre en silence.
   Les séries seulement préremplies (valeurs de la dernière fois, jamais touchées) ne sont jamais enregistrées comme faites. */
function finir(s){
const pend=[];let skip=0;
s.exercises.forEach(e=>e.sets.forEach(x=>{if(x.done)return;if(!s.edit&&x.t&&(e.cardio?+x.min>0:(String(x.reps).trim()!==''&&!isNaN(+x.reps)&&!isNaN(+x.kg))))pend.push([e,x]);else skip++}));
const fait=s.exercises.some(e=>e.sets.some(x=>x.done));
const encore=()=>S.current===s.id; /* la séance n'a pas été fermée entre-temps */
if(!pend.length&&!fait){confirmer({icone:'alerte',ton:'ambre',danger:1,titre:'Aucune série validée',texte:'Touche ✓ sur chaque série faite. Si tu quittes maintenant, la séance ne sera pas conservée.',ok:'Quitter sans enregistrer',non:'Revenir à la séance'}).then(ok=>{if(ok&&encore())clore(s)});return}
if(pend.length){
const li=pend.slice(0,5).map(([e,x])=>`<li>${esc(e.name)} <small>${esc(e.cardio?x.min+' min':(x.kg||0)+' kg × '+x.reps)}</small></li>`).join('')+(pend.length>5?`<li>… et ${pend.length-5} autre${pend.length-5>1?'s':''}</li>`:'');
demander({icone:'alerte',ton:'ambre',titre:pend.length>1?pend.length+' séries non validées':'1 série non validée',texte:'Elles sont remplies, mais tu n’as pas touché ✓.',corps:'<ul>'+li+'</ul>',ok:pend.length>1?'Les garder comme faites':'La garder comme faite',non:fait?(pend.length>1?'Les ignorer':'L’ignorer'):'',lien:'Revenir à la séance'}).then(r=>{
if(!encore()||(r!=='ok'&&r!=='non'))return;
if(r==='ok')pend.forEach(([e,x])=>{if(!e.cardio&&String(x.kg).trim()==='')x.kg='0';x.done=true});
clore(s)});return}
const ne=s.exercises.filter(e=>e.sets.some(x=>x.done)).length,ns=s.exercises.reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0);
confirmer({icone:'valide',ton:'vert',titre:s.edit?'Enregistrer les modifications ?':'Terminer la séance ?',texte:s.edit?'':'Bravo, belle séance !'+(skip?' '+skip+(skip>1?' séries non validées seront ignorées.':' série non validée sera ignorée.'):''),
 corps:pastilles([s.edit?'':(mins(s.date)?mins(s.date)+' min':'moins d’1 min'),ne+' exercice'+(ne>1?'s':''),ns+' série'+(ns>1?'s':''),fmt(vol(s))+' kg']),ok:s.edit?'Enregistrer':'Terminer et enregistrer',non:s.edit?'Continuer les modifications':'Continuer la séance'}).then(ok=>{if(ok&&encore())clore(s)});
}
/* Enregistre (ou supprime si vide) la séance, puis ferme la séance (la routine se crée ensuite depuis l'Historique) */
function clore(s){
s.exercises.forEach(e=>e.sets=e.sets.filter(dn));s.exercises=s.exercises.filter(e=>e.sets.length);
s.exercises.forEach(e=>e.sets.forEach(x=>{delete x.t}));
let saved=false;
if(!s.exercises.length)S.sessions=S.sessions.filter(x=>x.id!==s.id);
else if(s.edit){delete s.edit;s.mod=Date.now();saved='edit'}
else{s.dur=mins(s.date);s.mod=Date.now();saved=true}
const fin=()=>{S.current=null;S.editBak=null;tStop();
 if(saved){setTab('histo');window.scrollTo(0,0);toast(saved==='edit'?'Modifications enregistrées ✓':'Séance enregistrée ✓');save();snap('auto')}
 save();render()};
fin();
}
