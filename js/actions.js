/* Fluxe Suivi — Réactions aux gestes : saisie et boutons (data-act). */
import {BKD} from './config.js';
import {CHAINS,M,MU,catOf} from './catalogue.js';
import {clean,purge,unwrap} from './donnees.js';
import {S,cur,pk,save,setS,setTab,toast} from './etat.js';
import {$,K,RS,cname,dn,mins,norm,uid} from './outils.js';
import {newEx,restFor,suggest} from './calculs.js';
import {chainOf,gymCur,inGym} from './salle.js';
import {render} from './rendu.js';
import {setSx} from './vues/stats.js';
import {glist,gymCard,segGuide,setGm,setGq,setGv} from './vues/guide.js';
import {closePk,discs,openPk,openSheet,openTool,plist,sheet} from './vues/panneaux.js';
import {fillData} from './vues/ecran-sauvegarde.js';
import {tAdd,tStart,tStop} from './minuteur.js';
import {VB,snap} from './versions.js';
import {imp,merge,pack,saveFile,toTrash} from './sauvegarde.js';
$('#fi').addEventListener('change',ev=>{const f=ev.target.files[0];if(!f)return;if(f.size>5e6){alert('Fichier trop volumineux.');ev.target.value='';return}const r=new FileReader();r.onload=()=>imp(String(r.result));r.readAsText(f);ev.target.value=''});
document.addEventListener('input',ev=>{
const t=ev.target;
if(t.id==='pq'&&pk&&!pk.tool){pk.q=t.value.slice(0,60);$('#pl').innerHTML=plist();return}
if(t.id==='dq'&&pk&&pk.tool){pk.kg=t.value.replace(/[^\d.,]/g,'').slice(0,6);$('#dr').innerHTML=discs();return}
if(t.id==='gq'){setGq(t.value.slice(0,60));$('#gl').innerHTML=glist();return}
const s=cur();if(!s)return;
if(t.dataset.note!==undefined){const e=s.exercises[+t.dataset.note];if(!e)return;const k=K(e.name),v=t.value.slice(0,200),g=gymCur(),o=g?g.notes:(S.notes=S.notes||{});if(v.trim())o[k]=v;else delete o[k];save();return}
if(!['kg','reps','min','km','kcal'].includes(t.dataset.f))return;
const x=s.exercises[+t.dataset.i]&&s.exercises[+t.dataset.i].sets[+t.dataset.j];if(!x)return;
let v=t.value.replace(',','.').replace(/[^\d.]/g,'');
v=['reps','kcal'].includes(t.dataset.f)?v.replace(/\./g,'').slice(0,4):(v.match(/^\d{0,5}\.?\d{0,3}/)||[''])[0];
if(v!==t.value.replace(',','.'))t.value=v;
x[t.dataset.f]=v;x.t=true;save();
});
document.addEventListener('click',ev=>{
const tb=ev.target.closest('[data-tab]');if(tb){setTab(tb.dataset.tab);render();window.scrollTo(0,0);return}
const b=ev.target.closest('[data-act]');if(!b)return;
const a=b.dataset.act,s=cur(),i=+b.dataset.i,j=+b.dataset.j,k=+b.dataset.k;
if(!s&&['padd','addset','delex','finish','cancel','chk','rex','wu','sug'].includes(a))return;
if(['addset','delex','rex','sug','chk','wu'].includes(a)&&!s.exercises[i])return;
if((a==='chk'||a==='wu')&&!s.exercises[i].sets[j])return;
if(['wu','rex','sug'].includes(a)&&s.exercises[i].cardio)return;
if(['pm','bar','imerge','irepl','trest','vrest','tempty'].includes(a)&&!pk)return;
if((a==='start'||a==='startr')&&S.current)return;
if(a==='t+'){tAdd(15000);return}
if(a==='t0'){tStop();return}
if(a==='pm'){pk.m=M.includes(b.dataset.m)?b.dataset.m:'Tous';sheet();return}
if(a==='pv'){pk.v=b.dataset.v==='salle'?'salle':'cat';sheet();return}
if(a==='data'){openSheet({data:1});return}
if(a==='file'){saveFile();return}
if(a==='imerge'||a==='irepl'){const d=pk.imp;if(!d)return;
if(a==='irepl'&&!confirm('Remplacer toutes les données de ce téléphone par celles du fichier ?'))return;
snap('imp').then(()=>{
if(a==='irepl'){d.current=null;d.editBak=null;d.sessions.forEach(x=>delete x.edit);setS(purge(d));tStop();save();closePk();render();toast('Données remplacées ✓ (version de secours créée)')}
else{const r=merge(d);save();closePk();render();alert('Fusion terminée ✓\n'+r.add+' séance(s) ajoutée(s), '+r.upd+' mise(s) à jour.'+(r.skip?'\n'+r.skip+' ignorée(s) car dans ta corbeille.':''))}});return}
if(a==='snapnow'){snap('man').then(ok=>{toast(ok?'Version de secours créée ✓':'Impossible de créer une version sur ce navigateur');if(pk&&pk.data)fillData()});return}
if(a==='vrest'){const at=+b.dataset.at;
if(S.current){alert('Termine ou annule d’abord la séance en cours.');return}
if(!confirm('Revenir à cette version ? Tes données actuelles seront gardées dans une nouvelle version de secours.'))return;
VB.all().then(l=>{const v=l.find(x=>x.at===at);let d=null;try{d=v&&clean(unwrap(JSON.parse(v.raw)))}catch(e){}
if(!d){alert('Cette version est illisible. Rien n’a été modifié.');return}
return snap('rest').then(()=>{d.current=null;d.editBak=null;d.sessions.forEach(x=>delete x.edit);setS(purge(d));save();tStop();render();sheet();toast('Version restaurée ✓')})}).catch(()=>alert('Versions de secours indisponibles.'));return}
if(a==='trest'){const x=+b.dataset.x,t=S.trash[x];if(!t)return;
if(t.s){if(S.sessions.some(y=>y.id===t.s.id))alert('Cette séance est déjà dans ton historique.');else S.sessions.push(t.s)}
else S.routines.push(t.r);
S.trash.splice(x,1);save();render();sheet();toast('Restauré ✓');return}
if(a==='tempty'){if(!confirm('Vider la corbeille ? Ces éléments seront effacés définitivement.'))return;S.trash=[];save();render();sheet();return}
/* Choix d'une enseigne : nouvelle salle, ou changement d'enseigne de la salle active. Toutes les machines sont cochées d'office. */
if(a==='gens'){const ch=CHAINS.find(c=>c.id===b.dataset.t)||null;if(!ch&&b.dataset.t!=='autre')return;
const eq=catOf(ch),nom=ch?ch.name:'Ma salle',g=gymCur();
if(pk&&pk.ens&&pk.ens.chg&&g){if(!confirm('Passer « '+g.name+' » sur '+nom+' ? Ses '+eq.length+' machines seront cochées et remplaceront tes coches actuelles. Tes réglages sont gardés.'))return;
const old=chainOf(g);if(!old||g.name===old.name)g.name=nom;g.eq=eq;if(ch)g.chain=ch.id;else delete g.chain;
setGv('cat');save();closePk();render();toast('Enseigne changée : '+eq.length+' machines cochées');return}
if(S.gyms.length>=20){alert('20 salles maximum.');return}
let n=nom,k=2;while(S.gyms.some(x=>x.name===n))n=nom+' '+k++;
const id=uid();S.gyms.push(ch?{id,name:n,eq,notes:{},chain:ch.id}:{id,name:n,eq,notes:{}});S.gym=id;
setTab('aide');setGm('Tous');setGv('cat');save();if(pk)closePk();render();toast('Salle « '+n+' » créée : '+eq.length+' machines cochées. Décoche celles qui manquent.');return}
if(a==='closepk'){closePk();return}
if(a==='pick'){openPk();return}
if(a==='tool'){openTool();return}
if(a==='bar'){pk.bar=[20,15,10].includes(+b.dataset.b)?+b.dataset.b:20;sheet();return}
if(a==='padd'){const nm=cname(b.dataset.n);if(!nm)return;s.exercises.push(newEx(nm));const g=gymCur();if(g&&!MU[nm]&&!inGym(nm)&&g.eq.length<600)g.eq.push(nm);closePk()}
else if(a==='rest'){const o=[60,90,120,180,240];S.rest=o[(o.indexOf(S.rest||90)+1)%o.length]}
else if(a==='rex'){S.rests=S.rests||{};const n=s.exercises[i].name,c=restFor(n);S.rests[K(n)]=RS[(RS.indexOf(c)+1)%RS.length]}
else if(a==='wu'){const x=s.exercises[i].sets[j];if(x){if(x.w)delete x.w;else x.w=true}}
else if(a==='sug'){const sg=suggest(s.exercises[i].name);if(sg)s.exercises[i].sets.forEach(x=>{if(!x.done&&!x.w)x.kg=String(Math.round(sg.kg*100)/100)})}
else if(a==='snz'){S.snooze=Date.now();toast('D’accord, je te le rappelle dans 2 jours')}
else if(a==='bke'){const d=+b.dataset.d;if(BKD.includes(d)){S.bkEvery=d;S.snooze=0;save();render();sheet();toast('Rappel : tous les '+d+' jours');return}}
else if(a==='sx'){setSx(b.dataset.n)}
else if(a==='gm'){setGm(b.dataset.m)}
else if(a==='gv'){setGv(b.dataset.v)}
else if(a==='gnew'){if(S.gyms.length>=20){alert('20 salles maximum.');return}openSheet({ens:{}});return}
else if(a==='gchg'){if(!gymCur())return;openSheet({ens:{chg:1}});return}
else if(a==='gsel'){S.gym=S.gyms.some(g=>g.id===b.dataset.id)?b.dataset.id:null;}
else if(a==='gren'){const g=gymCur();if(!g)return;const n=prompt('Nouveau nom de la salle',g.name);if(!n||!cname(n))return;g.name=cname(n).slice(0,40)}
else if(a==='gdel'){const g=gymCur();if(!g||!confirm('Supprimer la salle « '+g.name+' » ? Ses machines cochées et ses réglages seront perdus. Tes séances restent dans l’historique.'))return;S.gyms=S.gyms.filter(x=>x.id!==g.id);S.gym=S.gyms[0]?S.gyms[0].id:null}
else if(a==='gtog'){const g=gymCur(),n=cname(b.dataset.n);if(!g||!n)return;const i=g.eq.findIndex(x=>norm(x)===norm(n));if(i>=0)g.eq.splice(i,1);else if(g.eq.length<600)g.eq.push(n);save();$('#gl').innerHTML=glist();const c=document.querySelector('.card.gym');if(c)c.outerHTML=gymCard();const sg=$('#gvseg');if(sg)sg.outerHTML=segGuide();return}
else if(a==='editsess'){if(S.current){alert('Termine ou annule d’abord la séance en cours.');return}const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x)return;S.editBak=JSON.parse(JSON.stringify(x));x.edit=true;S.current=x.id;setTab('seance');window.scrollTo(0,0)}
else if(a==='start'||a==='startr'){const r=a==='startr'?S.routines[k]:null;if(a==='startr'&&!r)return;const n={id:uid(),date:Date.now(),exercises:r?r.exercises.map(x=>newEx(x)):[]},g=gymCur();if(g){n.g=g.id;n.gn=g.name}S.sessions.push(n);S.current=n.id}
else if(a==='delr'){const r=S.routines[k];if(!r||!confirm('Mettre cette routine à la corbeille ? (récupérable 30 jours)'))return;toTrash({r});S.routines.splice(k,1);save();render();toast('Routine mise à la corbeille');return}
else if(a==='delex'){if(!confirm('Retirer cet exercice ?'))return;s.exercises.splice(i,1)}
else if(a==='addset'){const ex=s.exercises[i],l=ex.sets;if(ex.cardio)l.push({min:'',km:'',kcal:'',done:false});else{const p=l[l.length-1]||{kg:'',reps:''};l.push({kg:p.kg,reps:p.reps,done:false})}}
else if(a==='chk'){
const ex=s.exercises[i],x=ex.sets[j];
if(x.done)x.done=false;
else if(ex.cardio){if(String(x.min).trim()===''||!(+x.min>0)){alert('Renseigne au moins la durée en minutes.');return}x.done=true}
else{if(String(x.reps).trim()===''||isNaN(+x.reps)||isNaN(+x.kg)){alert('Renseigne les répétitions (et la charge).');return}if(String(x.kg).trim()==='')x.kg='0';x.done=true;if(!s.edit&&!x.w)tStart(restFor(ex.name))}
}
else if(a==='finish'){
/* séries saisies à la main mais pas validées avec ✓ : on les montre et on propose de les garder, au lieu de les perdre en silence.
   Les séries seulement préremplies (valeurs de la dernière fois, jamais touchées) ne sont jamais enregistrées comme faites. */
const pend=[];let skip=0;
s.exercises.forEach(e=>e.sets.forEach(x=>{if(x.done)return;if(!s.edit&&x.t&&(e.cardio?+x.min>0:(String(x.reps).trim()!==''&&!isNaN(+x.reps)&&!isNaN(+x.kg))))pend.push([e,x]);else skip++}));
const has=pend.length||s.exercises.some(e=>e.sets.some(x=>x.done));
if(!has){if(!confirm('Aucune série n’est validée (touche ✓ sur chaque série que tu as faite) : la séance ne sera pas conservée. Quitter quand même ?'))return}
else if(pend.length){
const lst=pend.slice(0,5).map(([e,x])=>'• '+e.name+' : '+(e.cardio?x.min+' min':(x.kg||0)+' kg × '+x.reps)).join('\n')+(pend.length>5?'\n… et '+(pend.length-5)+' autre(s)':'');
if(!confirm('Ces séries sont remplies mais pas validées avec ✓ :\n'+lst+'\n\nOK = les enregistrer avec la séance.\nAnnuler = revenir à la séance.'))return;
pend.forEach(([e,x])=>{if(!e.cardio&&String(x.kg).trim()==='')x.kg='0';x.done=true});
}
else if(!confirm((s.edit?'Enregistrer les modifications ?':'Terminer la séance ?')+(skip&&!s.edit?'\n'+skip+(skip>1?' séries non validées seront ignorées.':' série non validée sera ignorée.'):'')))return;
s.exercises.forEach(e=>e.sets=e.sets.filter(dn));s.exercises=s.exercises.filter(e=>e.sets.length);
s.exercises.forEach(e=>e.sets.forEach(x=>{delete x.t}));
let saved=false;
if(!s.exercises.length)S.sessions=S.sessions.filter(x=>x.id!==s.id);
else if(s.edit){delete s.edit;s.mod=Date.now();saved='edit'}
else{s.dur=mins(s.date);s.mod=Date.now();saved=true;
if(confirm('Enregistrer cette séance comme routine ?')){const n=prompt('Nom de la routine','Séance du '+new Date().toLocaleDateString('fr-FR'));if(n&&n.trim())S.routines.push({name:n.trim().slice(0,60),exercises:s.exercises.map(e=>e.name)})}}
S.current=null;S.editBak=null;tStop();
if(saved){setTab('histo');window.scrollTo(0,0);toast(saved==='edit'?'Modifications enregistrées ✓':'Séance enregistrée ✓');save();snap('auto')}
}
else if(a==='cancel'){
if(s.edit){if(!confirm('Annuler les modifications ?'))return;const bk=S.editBak;if(bk)S.sessions=S.sessions.map(x=>x.id===s.id?bk:x);S.current=null;S.editBak=null;tStop()}
else{if(!confirm('Annuler et supprimer cette séance ?'))return;
/* si des séries avaient été validées, la séance part à la corbeille au lieu d'être perdue */
if(s.exercises.some(e=>e.sets.some(x=>x.done))){const c=JSON.parse(JSON.stringify(s));c.exercises.forEach(e=>e.sets=e.sets.filter(dn).map(x=>{delete x.t;return x}));c.exercises=c.exercises.filter(e=>e.sets.length);c.dur=mins(s.date);toTrash({s:c});toast('Séance annulée (récupérable 30 jours dans la corbeille)')}
S.sessions=S.sessions.filter(x=>x.id!==s.id);S.current=null;tStop()}}
else if(a==='delsess'){const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x||!confirm('Mettre cette séance à la corbeille ? (récupérable 30 jours)'))return;toTrash({s:x});S.sessions=S.sessions.filter(y=>y!==x);toast('Séance mise à la corbeille')}
else if(a==='export'){(navigator.clipboard?navigator.clipboard.writeText(pack()):Promise.reject()).then(()=>{S.lastBackup=Date.now();save();alert('Données copiées.')}).catch(()=>alert('Copie impossible sur ce navigateur.'));return}
else if(a==='imp'){$('#fi').click();return}
else if(a==='paste'){const t=prompt('Colle ici les données copiées avec « Copier le texte » :');if(t)imp(t);return}
save();render();
});
