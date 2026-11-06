(function(){
const KEY='muscu-v1',VER='2.1'; /* ne pas changer KEY : c'est la clé où sont tes données */
const FORMAT=3,J30=30*864e5; /* FORMAT : version du fichier de sauvegarde · J30 : durée de la corbeille */
const M=['Pectoraux','Dos','Épaules','Bras','Jambes','Fessiers','Abdos','Corps entier','Cardio'];
const T={h:'Hammer Strength',s:'Machine guidée',p:'Poulie',e:'Eleiko',l:'Life Fitness'};
const LIB=[].concat(...Object.entries({
Pectoraux:['Développé couché','Développé incliné haltères','Écarté poulie','Pompes','Développé couché haltères','Développé incliné barre','Développé décliné','Pec deck (papillon)|s','Presse pectorale assise|s','Développé couché Iso-Lateral|h','Développé incliné Iso-Lateral|h','Développé super incliné Iso-Lateral|h','Développé décliné Iso-Lateral|h','Pectoraux écartés Iso-Lateral (Wide Chest)|h','Pullover machine|h','Écarté poulie vis-à-vis|p'],
Dos:['Tractions','Rowing barre','Tirage vertical','Tirage horizontal','Soulevé de terre','Tractions assistées|s','Tirage vertical machine (Lat Pulldown)|s','Rowing assis machine|s','Tirage vertical Iso-Lateral|h','Tirage large Iso-Lateral (Wide Pulldown)|h','Rowing haut Iso-Lateral (High Row)|h','Rowing Iso-Lateral|h','Rowing bas Iso-Lateral (Low Row)|h','Rowing D.Y. Iso-Lateral|h','Rowing T-Bar|h','Shrug assis/debout machine|h','Pull-over poulie|p','Rowing haltère unilatéral','Shrugs haltères','Hyperextension (banc lombaires)','Extension lombaires machine|s'],
Épaules:['Développé militaire','Élévations latérales','Oiseau','Développé épaules haltères','Développé épaules machine|s','Oiseau machine (reverse pec deck)|s','Développé épaules Iso-Lateral|h','Élévations latérales machine|h','Face pull|p','Élévations frontales','Push press|e'],
Bras:['Curl barre','Curl marteau','Triceps poulie','Dips','Barre au front','Curl haltères','Curl pupitre (Larry Scott)','Curl concentré','Curl machine|s','Extension triceps machine|s','Curl biceps assis|h','Dips assis machine|h','Curl poulie basse|p','Kickback triceps poulie|p','Extension triceps nuque haltère','Curl poignets'],
Jambes:['Squat','Presse à cuisses','Fentes','Leg curl','Leg extension','Mollets debout','Front squat|e','Soulevé de terre roumain','Good morning','Fentes bulgares','Step-up','Leg curl allongé|s','Leg curl assis|s','Adducteurs machine|s','Squat Smith machine|h','Presse à cuisses linéaire|h','Presse à cuisses Iso-Lateral|h','V-Squat|h','Hack squat|h','Belt squat|h','Pendulum squat|h','Leg extension machine|h','Leg curl à genoux Iso-Lateral|h','Mollets assis|h','Mollets presse|h','Tibial machine|h','Nordic assisté|h'],
Fessiers:['Hip thrust','Glute drive|h','Abducteurs machine|s','Reverse hyper|h','Kickback fessier poulie|p'],
Abdos:['Crunch','Gainage','Relevé de jambes','Crunch machine|s','Crunch obliques|h','Crunch poulie|p','Roue abdominale','Russian twist','Relevé de genoux chaise romaine','Rotation du buste machine|s'],
'Corps entier':['Arraché (snatch)|e','Épaulé (power clean)|e','Épaulé-jeté|e','Thruster','Kettlebell swing','Farmer walk'],
Cardio:['Tapis de course','Marche inclinée','Vélo droit','Vélo semi-allongé','Elliptique','Rameur','Escalier (stepper)','PowerMill Climber|l','Assault bike','SkiErg']
}).map(([g,l])=>l.map(n=>{const[a,t]=n.split('|');return[a,g,T[t]||'']})));
/* Machines exclusives au catalogue On Air (modèles cités par Life Fitness et Panatta) : jamais mélangées aux autres salles */
const XO=[['Tirage vertical Select','Dos','Hammer Strength Select'],['Leg extension Select','Jambes','Hammer Strength Select'],['Abducteurs Select','Fessiers','Hammer Strength Select'],
['Tirage vertical convergent (Super Lat Machine)','Dos','Panatta'],['Rowing bas (Super Low Row)','Dos','Panatta'],['Développé vertical (Super Vertical Chest Press)','Pectoraux','Panatta'],['Développé incliné (Super Inclined Chest Press)','Pectoraux','Panatta'],['Développé décliné (Super Declined Chest Press)','Pectoraux','Panatta']];
const XS=new Set(XO.map(x=>x[0]));LIB.push(...XO);
const MU=Object.assign(Object.create(null),Object.fromEntries(LIB.map(x=>[x[0],x[1]])));
const TG=Object.assign(Object.create(null),Object.fromEntries(LIB.map(x=>[x[0],x[2]])));
const DB=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>`;
let S=load(),tab='seance',pk=null;
/* Nettoyage et vérification des données (stockage local ET import) : seul ce qui est valide est gardé */
function cleanSession(s){
const str=(v,n)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n):'';
const num=v=>typeof v==='number'&&isFinite(v)?v:null;
const val=v=>{if(typeof v==='number')v=String(v);return typeof v==='string'&&/^\d{0,5}(\.\d{0,3})?$/.test(v)?v:''};
if(!s||typeof s!=='object'||!Array.isArray(s.exercises))return null;
const id=str(s.id,40),date=num(s.date);
if(!/^[A-Za-z0-9_-]{1,40}$/.test(id)||date===null)return null;
const n={id,date,exercises:[]},dur=num(s.dur),mod=num(s.mod);
if(dur!==null&&dur>=0&&dur<=1440)n.dur=Math.round(dur);
if(mod!==null&&mod>0)n.mod=mod; /* date de dernière modification : sert à la fusion */
if(typeof s.g==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(s.g)){n.g=s.g;const gn=str(s.gn,40);if(gn)n.gn=gn} /* salle de la séance */
for(const e of s.exercises.slice(0,60)){
if(!e||typeof e!=='object'||!Array.isArray(e.sets))continue;
const name=str(e.name,60);if(!name)continue;
const cd=e.cardio===true,sets=[];
for(const x of e.sets.slice(0,60)){if(!x||typeof x!=='object')continue;const t=cd?{min:val(x.min),km:val(x.km),kcal:val(x.kcal),done:x.done!==false}:{kg:val(x.kg),reps:val(x.reps),done:x.done!==false};if(!cd&&x.w===true)t.w=true;if(x.t===true)t.t=true;sets.push(t)}
n.exercises.push(cd?{name,cardio:true,sets}:{name,sets});
}
return n;
}
function clean(d){
if(!d||typeof d!=='object'||!Array.isArray(d.sessions))return null;
const str=(v,n)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n):'';
const num=v=>typeof v==='number'&&isFinite(v)?v:null;
const o={sessions:[],routines:[],current:null,notes:{},rests:{}},ids=new Set(),eb=cleanSession(d.editBak);
for(const s of d.sessions.slice(0,5000)){const c=cleanSession(s);if(!c||ids.has(c.id))continue;ids.add(c.id);if(s.edit===true&&eb&&eb.id===c.id&&d.current===c.id){c.edit=true;o.editBak=eb}o.sessions.push(c)}
if(Array.isArray(d.routines))for(const r of d.routines.slice(0,200)){if(!r||typeof r!=='object'||!Array.isArray(r.exercises))continue;const name=str(r.name,60),ex=r.exercises.slice(0,60).map(x=>str(x,60)).filter(Boolean);if(name&&ex.length)o.routines.push({name,exercises:ex})}
if(typeof d.current==='string'&&ids.has(d.current))o.current=d.current;
if(d.notes&&typeof d.notes==='object')for(const [k,v] of Object.entries(d.notes).slice(0,1000)){const t=str(v,200);if(/^k:.{1,60}$/.test(k)&&t)o.notes[k]=t}
if(d.rests&&typeof d.rests==='object')for(const [k,v] of Object.entries(d.rests).slice(0,1000)){if(/^k:.{1,60}$/.test(k)&&num(v)!==null&&v>=15&&v<=600)o.rests[k]=Math.round(v)}
const r=num(d.rest);if(r!==null&&r>=15&&r<=600)o.rest=Math.round(r);
for(const k of ['lastBackup','snooze']){const v=num(d[k]);if(v!==null&&v>0)o[k]=v}
/* Corbeille : séances (s) et routines (r) supprimées, gardées 30 jours */
o.trash=[];
if(Array.isArray(d.trash))for(const t of d.trash.slice(0,500)){if(!t||typeof t!=='object')continue;const at=num(t.at);if(at===null||at<=0)continue;
if(t.s){const c=cleanSession(t.s);if(c)o.trash.push({at,s:c})}
else if(t.r&&typeof t.r==='object'&&Array.isArray(t.r.exercises)){const name=str(t.r.name,60),ex=t.r.exercises.slice(0,60).map(x=>str(x,60)).filter(Boolean);if(name&&ex.length)o.trash.push({at,r:{name,exercises:ex}})}}
/* Ma salle : salles de l'utilisateur, machines présentes, notes de réglage propres à chaque salle */
o.gyms=[];
if(Array.isArray(d.gyms))for(const g of d.gyms.slice(0,20)){if(!g||typeof g!=='object')continue;const id=str(g.id,40),name=str(g.name,40);if(!/^[A-Za-z0-9_-]{1,40}$/.test(id)||!name||o.gyms.some(x=>x.id===id))continue;
const eq=Array.isArray(g.eq)?[...new Set(g.eq.slice(0,600).map(x=>str(x,60)).filter(Boolean))]:[],notes={};
if(g.notes&&typeof g.notes==='object')for(const [k,v] of Object.entries(g.notes).slice(0,1000)){const t=str(v,200);if(/^k:.{1,60}$/.test(k)&&t)notes[k]=t}
const ch=typeof g.chain==='string'&&/^[a-z-]{1,20}$/.test(g.chain)?g.chain:'';o.gyms.push(ch?{id,name,eq,notes,chain:ch}:{id,name,eq,notes})}
if(typeof d.gym==='string'&&o.gyms.some(g=>g.id===d.gym))o.gym=d.gym;
return o;
}
/* Un fichier de sauvegarde v2.1+ est « emballé » : {app, format, exportedAt, data}. Les anciens fichiers contiennent directement les données. */
/* (déclarées avec « function » pour être utilisables dès le chargement des données, tout en haut du fichier) */
function unwrap(p){return p&&typeof p==='object'&&p.app==='fluxe-suivi'&&p.data&&typeof p.data==='object'?p.data:p}
function purge(d){const n=Date.now();d.trash=d.trash.filter(t=>n-t.at<J30);return d}
function load(){
try{const raw=localStorage.getItem(KEY),p=JSON.parse(raw),d=clean(p);if(d){if(p.sessions.length!==d.sessions.length)try{localStorage.setItem(KEY+'-brut',raw)}catch(e){}return purge(d)}}catch(e){}
return{sessions:[],routines:[],current:null,notes:{},rests:{},trash:[],gyms:[]};
}
const MSG_SAVE='⚠ Impossible d’enregistrer sur ce navigateur : tes séances seront perdues à la fermeture. Ouvre Fluxe depuis l’icône de l’écran d’accueil (pas en navigation privée) et fais une sauvegarde.';
let saveFail=false;const wm={};
function warn(k,m){wm[k]=m;const t=Object.values(wm).filter(Boolean).join(' '),w=document.querySelector('#warn');w.textContent=t;w.hidden=!t}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));if(saveFail){saveFail=false;warn('save','')}}catch(e){if(!saveFail){saveFail=true;warn('save',MSG_SAVE)}}}
let tt2=0;
function toast(m){const e=document.querySelector('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tt2);tt2=setTimeout(()=>e.classList.remove('on'),3200)}
const $=q=>document.querySelector(q);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtDate=t=>new Date(t).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const cur=()=>S.sessions.find(x=>x.id===S.current);
const norm=n=>n.trim().toLowerCase();
const dn=x=>x.done!==false;
const ok=x=>dn(x)&&!x.w; /* série de travail validée (hors échauffement) */
const vol=s=>s.exercises.reduce((a,e)=>e.cardio?a:a+e.sets.reduce((b,x)=>b+(ok(x)?(+x.kg)*(+x.reps):0),0),0);
const nset=s=>s.exercises.reduce((a,e)=>e.cardio?a:a+e.sets.filter(ok).length,0);
const e1=x=>(+x.kg)*(1+(+x.reps)/30);
const fmt=n=>Math.round(n).toLocaleString('fr-FR');
const fmtT=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
const mins=t=>Math.max(0,Math.floor((Date.now()-t)/60000));
const done=()=>S.sessions.filter(x=>x.id!==S.current);
function prevSets(name){
for(const s of done().sort((a,b)=>b.date-a.date)){const e=s.exercises.find(e=>norm(e.name)===norm(name));if(e){const l=e.sets.filter(ok);if(l.length)return l}}
return null;
}
/* meilleur 1RM estimé déjà réalisé sur un exercice (sert au badge PR) */
function best(name){return done().reduce((m,s)=>{const e=s.exercises.find(e=>norm(e.name)===norm(name));return e?e.sets.filter(ok).reduce((a,x)=>Math.max(a,e1(x)||0),m):m},0)}
function newEx(name){if(MU[name]==='Cardio')return{name,cardio:true,sets:[{min:'',km:'',kcal:'',done:false}]};const p=prevSets(name);return{name,sets:(p||[{kg:'',reps:''}]).map(x=>({kg:x.kg,reps:x.reps,done:false}))}}
function names(){const st=new Set();S.sessions.forEach(s=>s.exercises.forEach(e=>st.add(e.name)));return [...st]}
const cname=v=>String(v).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,60); /* même règle que le nettoyage des données */
const K=n=>'k:'+norm(n).slice(0,60);
const RS=[60,90,120,180,240];
/* Ma salle : salle active, machines présentes, notes de réglage (celle de la salle d'abord, sinon la note générale) */
const gymCur=()=>S.gyms.find(g=>g.id===S.gym)||null;
const inGym=n=>{const g=gymCur();return !!g&&g.eq.some(x=>norm(x)===norm(n))};
const noteOf=n=>{const g=gymCur(),k=K(n);return (g&&g.notes[k])||(S.notes&&S.notes[k])||''};
const MG='Ma salle';
/* Modèles par enseigne (recherche web, novembre 2026).
   Les enseignes ne publient PAS la liste complète de leurs machines : seulement leurs marques et leurs zones,
   et chaque club est différent. Ces modèles sont donc un point de départ « probable » à vérifier sur place. */
const CARDIO=['Tapis de course','Marche inclinée','Vélo droit','Vélo semi-allongé','Elliptique','Rameur','Escalier (stepper)'];
const CROSS=['Rameur','Assault bike','SkiErg','Kettlebell swing','Farmer walk','Thruster'];
const pickLib=tags=>LIB.filter(([n,m,t])=>m!=='Cardio'&&!XS.has(n)&&tags.includes(t)).map(x=>x[0]);
const BASE=()=>[...pickLib(['','Machine guidée','Poulie']),...CARDIO];
/* ⭐ Catalogue On Air : enseigne prioritaire, catalogue à part, rangé par familles de machines */
const ONAIR={id:'on-air',name:'On Air',brands:'Hammer Strength, Life Fitness, Panatta (grands clubs)',info:'Catalogue dédié : Hammer Strength à disques et Select, cardio Life Fitness, espace Panatta dans les grands clubs.',
groups:[
{t:'Hammer Strength à disques',on:1,eq:()=>pickLib(['Hammer Strength'])},
{t:'Hammer Strength Select (guidées)',on:1,eq:()=>XO.filter(x=>x[2]==='Hammer Strength Select').map(x=>x[0])},
{t:'Panatta Freeweight Special (grands clubs)',on:0,eq:()=>XO.filter(x=>x[2]==='Panatta').map(x=>x[0])},
{t:'Poids libres, poulies et machines guidées',on:1,eq:()=>pickLib(['','Machine guidée','Poulie'])},
{t:'Cardio Life Fitness',on:1,eq:()=>[...CARDIO,'PowerMill Climber']}]};
/* Catalogue séparé : les autres enseignes (jamais les machines exclusives On Air) */
const OTHERS=[
{id:'basic-fit',name:'Basic-Fit',brands:'Matrix, Technogym dans certains clubs',info:'Poids libres, machines guidées, multi-stations et cardio.',eq:BASE},
{id:'fitness-park',name:'Fitness Park',brands:'Hammer Strength, Technogym',info:'Machines Hammer Strength, zone cross-training (rameur, airbike, SkiErg, kettlebells).',eq:()=>[...BASE(),...pickLib(['Hammer Strength']),...CROSS]},
{id:'neoness',name:'Neoness',brands:'Matrix',info:'Machines guidées, poids libres et cardio Matrix.',eq:BASE},
{id:'orange-bleue',name:'L’Orange Bleue',brands:'BH, Bodytone',info:'Machines guidées, poids libres et cardio (tapis, vélos, elliptiques, rameurs).',eq:BASE},
{id:'keepcool',name:'Keepcool',brands:'machines à air comprimé, Technogym dans certains clubs',info:'Machines guidées, poids libres, cardio ; espace « Lady Corner » dans plusieurs clubs.',eq:BASE}];
const CHAINS=[ONAIR,...OTHERS];
/* catalogue complet d'une enseigne, et machines cochées par défaut à la création */
const catOf=c=>[...new Set(c.groups?c.groups.flatMap(g=>g.eq()):c.eq())];
const defOf=c=>[...new Set(c.groups?c.groups.filter(g=>g.on).flatMap(g=>g.eq()):c.eq())];
/* Deux catalogues distincts dans « Ma salle » :
   ⭐ Catalogue On Air (prioritaire) et Catalogue autres enseignes (toutes les autres réunies en un seul catalogue) */
const C1='⭐ Catalogue On Air',C2='Catalogue autres enseignes';
const OTHERCAT={groups:[
{t:'Poids libres, poulies et machines guidées',eq:()=>pickLib(['','Machine guidée','Poulie'])},
{t:'Cardio',eq:()=>CARDIO},
{t:'Cross-training',eq:()=>CROSS},
{t:'Hammer Strength à disques',eq:()=>pickLib(['Hammer Strength'])}]};
/* pour chaque machine du catalogue « autres enseignes » : quelles enseignes l'annoncent */
let WHO=null;const whoHas=n=>{if(!WHO){WHO=Object.create(null);OTHERS.forEach(c=>c.eq().forEach(x=>{(WHO[x]=WHO[x]||[]).includes(c.name)||WHO[x].push(c.name)}))}return WHO[n]||[]};
/* une machine exclusive On Air n'est visible que si la salle active est une salle On Air */
const vis=n=>!XS.has(n)||(gymCur()&&gymCur().chain==='on-air');
const chainOf=g=>g&&CHAINS.find(c=>c.id===g.chain)||null;
const restFor=n=>(S.rests&&S.rests[K(n)])||S.rest||90;
const fmtN=n=>String(Math.round(n*100)/100).replace('.',',');
/* Suggestion de charge (double progression) d'après la meilleure série de la dernière séance */
function suggest(name){
const p=prevSets(name);if(!p)return null;
const b=p.reduce((a,x)=>e1(x)>e1(a)?x:a),kg=+b.kg,r=+b.reps;
if(!(kg>=0)||!(r>0))return null;
const g=MU[name]==='Jambes'||MU[name]==='Fessiers'?5:2.5;
if(r>=12)return{kg:kg+g,txt:fmtN(kg+g)+' kg × 8',why:'12 reps ou plus la dernière fois : on monte la charge'};
if(r>=8)return{kg,txt:fmtN(kg)+' kg × '+(r+1),why:'même charge, une répétition de plus'};
return{kg,txt:fmtN(kg)+' kg × 8',why:'même charge, vise 8 répétitions'};
}
function backupCard(){
const n=Date.now();
if(!done().length||n-(S.lastBackup||0)<6048e5||n-(S.snooze||0)<1728e5)return '';
return `<div class="card"><div class="hist-date">Pense à sauvegarder</div><div class="mu">${S.lastBackup?'Dernière sauvegarde : '+esc(fmtDate(S.lastBackup)):'Aucune sauvegarde pour l’instant'}. Tes données ne sont que sur ce téléphone : envoie le fichier dans Fichiers, iCloud Drive ou par mail.</div><div class="dat"><button class="btn" data-act="file">Sauvegarder</button><button class="sec" data-act="snz">Plus tard</button></div></div>`;
}
function render(){
if(S.current&&!cur())S.current=null;
if(!S.current)S.editBak=null;
S.sessions.forEach(x=>{if(x.edit&&x.id!==S.current)delete x.edit});
document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===tab));
$('#app').innerHTML=tab==='seance'?viewSeance():tab==='histo'?viewHisto():tab==='stats'?viewStats():viewGuide();
veille();
}
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
function thumb(n,sz){
return `<span class="mi${sz?' '+sz:''}">${svg(iconOf(n))}</span>`;
}
const csum=(e,k)=>e.sets.filter(dn).reduce((a,x)=>a+(+x[k]||0),0);
const cline=e=>{const p=[fmtN(csum(e,'min'))+' min'];if(csum(e,'km'))p.push(fmtN(csum(e,'km'))+' km');if(csum(e,'kcal'))p.push(Math.round(csum(e,'kcal'))+' kcal');return p.join(' · ')};
function prevCardio(name){for(const s of done().sort((a,b)=>b.date-a.date)){const e=s.exercises.find(e=>e.cardio&&norm(e.name)===norm(name));if(e&&e.sets.some(dn))return e}return null}
function cardioCard(e,i){
const pc=prevCardio(e.name),nt=noteOf(e.name);
return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name,'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">Cardio${TG[e.name]?' · '+esc(TG[e.name]):''}</div></div></div><button class="del" data-act="delex" data-i="${i}">Retirer</button></div>
${pc?`<div class="prev">Dernière fois : ${esc(cline(pc))}</div>`:''}
<input class="note" data-note="${i}" maxlength="200" placeholder="Note (niveau, inclinaison, vitesse…)" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Bloc</span><span>Durée (min)</span><span>Distance (km)</span><span>Calories</span><span></span></div>
${e.sets.map((x,j)=>`<div class="gr${x.done?' ok':''}"><span class="plate">${j+1}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="min" value="${esc(x.min)}" aria-label="Durée en minutes, bloc ${j+1}"><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="km" value="${esc(x.km)}" aria-label="Distance en km, bloc ${j+1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="kcal" value="${esc(x.kcal)}" aria-label="Calories, bloc ${j+1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider le bloc ${j+1}">✓</button></div>`).join('')}
<button class="ghost" data-act="addset" data-i="${i}">+ Ajouter un bloc</button></section>`;
}
function viewSeance(){
const s=cur();
if(!s)return `<h1>Entraînement</h1><p class="sub">Lance une séance ou pars d’une routine.</p>${backupCard()}
<div class="card"><button class="btn big" data-act="start">${DB} Séance vide</button></div>
<h2>Routines</h2>
${S.routines.map((r,k)=>`<div class="card"><div class="ex-head"><div class="ex-name">${esc(r.name)}</div><button class="del" data-act="delr" data-k="${k}">Supprimer</button></div><div class="prev">${r.exercises.map(esc).join(', ')}</div><button class="btn" data-act="startr" data-k="${k}">Démarrer</button></div>`).join('')||'<p class="empty">Termine une séance pour l’enregistrer comme routine.</p>'}`;
const ed=!!s.edit;
return `<h1>${esc(fmtDate(s.date))}</h1><p class="sub">${ed?'Modification d’une séance passée':'Séance en cours'}</p>
<div class="stats"><div><b id="el">${ed?(s.dur||0):mins(s.date)}</b><span>minutes</span></div><div><b>${nset(s)}</b><span>séries</span></div><div><b>${fmt(vol(s))}</b><span>kg soulevés</span></div></div>
<div class="row"><button class="sec" data-act="rest">⏱ Repos par défaut : ${fmtT(S.rest||90)} (changer)</button></div>
<p class="mu" style="margin-left:4px">Astuce : touche le numéro d’une série pour la marquer comme échauffement (É).</p>
${s.exercises.map((e,i)=>exCard(s,e,i)).join('')}
<div class="row"><button class="btn" data-act="pick">+ Ajouter un exercice</button><button class="sec" data-act="tool">Calculateur de disques</button><button class="sec" data-act="finish">${ed?'Enregistrer les modifications':'Terminer la séance'}</button><button class="del" data-act="cancel">${ed?'Annuler les modifications':'Annuler la séance'}</button></div>`;
}
function exCard(s,e,i){
if(e.cardio)return cardioCard(e,i);
const pv=prevSets(e.name)||[],b=best(e.name),sg=s.edit?null:suggest(e.name),nt=noteOf(e.name);
let wi=-1;
return `<section class="card"><div class="ex-head"><div class="eh">${thumb(e.name,'sm')}<div><div class="ex-name">${esc(e.name)}</div><div class="mu">${esc(MU[e.name]||'Perso')}${TG[e.name]?' · '+esc(TG[e.name]):''}</div></div></div><button class="del" data-act="delex" data-i="${i}">Retirer</button></div>
${sg?`<button class="sg" data-act="sug" data-i="${i}">💡 ${esc(sg.txt)}<small>${esc(sg.why)}</small></button>`:''}
<input class="note" data-note="${i}" maxlength="200" placeholder="${gymCur()?'Réglage dans '+esc(gymCur().name)+' (siège, hauteur…)':'Note (réglage du siège, hauteur…)'}" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Série</span><span>Précédent</span><span>kg</span><span>Réps</span><span></span></div>
${e.sets.map((x,j)=>{if(!x.w)wi++;const p=x.w?null:pv[wi],pr=x.done&&!x.w&&b>0&&e1(x)>b+.001;return `<div class="gr${x.done?' ok':''}"><button class="plate${x.w?' wu':''}" data-act="wu" data-i="${i}" data-j="${j}" aria-label="Série ${j+1} : ${x.w?'échauffement':'travail'}, toucher pour changer">${x.w?'É':wi+1}</button><span class="pv">${p?esc(p.kg)+'×'+esc(p.reps):'–'}${pr?'<span class="pr">PR</span>':''}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="kg" value="${esc(x.kg)}" aria-label="kg, série ${j+1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="reps" value="${esc(x.reps)}" aria-label="Répétitions, série ${j+1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider la série ${j+1}">✓</button></div>`}).join('')}
<button class="ghost" data-act="addset" data-i="${i}">+ Ajouter une série</button><button class="ghost" data-act="rex" data-i="${i}">⏱ Repos pour cet exercice : ${fmtT(restFor(e.name))}</button></section>`;
}
function viewHisto(){
const l=done().sort((a,b)=>b.date-a.date);
const nt=S.trash.length,tools=`<h2>Mes données</h2><p class="mu" style="margin-left:4px">Sauvegarde, versions de secours et corbeille : tout est au même endroit.</p><button class="sec" data-act="data" style="margin-bottom:14px">🛟 Sauvegarde et récupération${nt?' · '+nt+' dans la corbeille':''}</button>`;
if(!l.length)return `<h1>Historique</h1><p class="empty">Tes séances terminées apparaîtront ici.</p>${tools}`;
return `<h1>Historique</h1><p class="sub">${l.length} séance${l.length>1?'s':''}</p>
${l.map(s=>`<div class="card"><div class="ex-head"><div><div class="hist-date">${esc(fmtDate(s.date))}</div><div class="mu">${nset(s)} séries · ${fmt(vol(s))} kg${s.dur?' · '+s.dur+' min':''}${s.gn?' · '+esc(s.gn):''}</div></div><div><button class="del" style="color:var(--accent)" data-act="editsess" data-id="${esc(s.id)}">Modifier</button><button class="del" data-act="delsess" data-id="${esc(s.id)}">Supprimer</button></div></div>
${s.exercises.map(e=>{if(e.cardio)return e.sets.some(dn)?`<div class="hist-ex"><b>${esc(e.name)}</b><div>${esc(cline(e))}</div></div>`:'';const d=e.sets.filter(ok);if(!d.length)return '';const b=d.reduce((a,x)=>e1(x)>e1(a)?x:a);return `<div class="hist-ex"><b>${esc(e.name)}</b><div>${d.length} série${d.length>1?'s':''} · meilleure ${esc(b.kg)} kg × ${esc(b.reps)}</div></div>`}).join('')}</div>`).join('')}${tools}`;
}
function wk(t){const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()}
let sx=null;
function viewStats(){
const l=done(),now=Date.now(),w0=wk(now),W=7*864e5;
/* Total du jour : repart à zéro chaque nuit, séance en cours comprise */
const d0=new Date().setHours(0,0,0,0),today=S.sessions.filter(x=>x.date>=d0).reduce((a,x)=>a+vol(x),0);
const weeks=[...Array(8)].map((_,k)=>{const t=w0-(7-k)*W;const v=l.filter(s=>wk(s.date)===t).reduce((a,s)=>a+vol(s),0);return{t,v}});
const mx=Math.max(1,...weeks.map(x=>x.v));
const bs=Object.create(null);l.forEach(s=>s.exercises.filter(e=>!e.cardio).forEach(e=>e.sets.filter(ok).forEach(x=>{const k=e.name;if(!bs[k]||e1(x)>e1(bs[k]))bs[k]=x})));
const rec=Object.entries(bs).sort((a,b)=>e1(b[1])-e1(a[1])).slice(0,8);
const nm=[...new Set(l.flatMap(s=>s.exercises.filter(e=>!e.cardio&&e.sets.some(ok)).map(e=>e.name)))];
if(!sx||!nm.includes(sx))sx=nm[0]||null;
const pts=sx?l.slice().sort((a,b)=>a.date-b.date).map(s=>{const e=s.exercises.find(e=>e.name===sx);return{t:s.date,v:e?e.sets.filter(ok).reduce((a,x)=>Math.max(a,e1(x)||0),0):0}}).filter(p=>p.v>0).slice(-12):[];
const pm=Math.max(1,...pts.map(p=>p.v));
const gv={};l.filter(s=>now-s.date<30*864e5).forEach(s=>s.exercises.forEach(e=>{if(e.cardio)return;const g=MU[e.name]||'Perso';gv[g]=(gv[g]||0)+e.sets.filter(ok).reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0)}));
const cs=l.filter(x=>now-x.date<W).flatMap(x=>x.exercises.filter(e=>e.cardio));
const cardio7=cs.length?`<div class="card"><div class="hist-date">Cardio</div><div class="mu">7 derniers jours</div><div class="stats" style="box-shadow:none;margin:10px 0 0"><div><b>${fmtN(cs.reduce((a,e)=>a+csum(e,'min'),0))}</b><span>minutes</span></div><div><b>${fmtN(cs.reduce((a,e)=>a+csum(e,'km'),0))}</b><span>km</span></div><div><b>${Math.round(cs.reduce((a,e)=>a+csum(e,'kcal'),0))}</b><span>kcal</span></div></div></div>`:'';
const gt=Object.values(gv).reduce((a,b)=>a+b,0)||1;
return `<h1>Stats</h1><p class="sub">Ta progression</p>
<div class="stats"><div><b>${l.length}</b><span>séances</span></div><div><b>${l.filter(s=>now-s.date<W).length}</b><span>7 derniers jours</span></div><div><b>${fmt(today)}</b><span>kg aujourd’hui</span></div></div>
<div class="card"><div class="hist-date">Volume par semaine</div><div class="mu">en kg, 8 dernières semaines</div><div class="chart" role="img" aria-label="Volume hebdomadaire">${weeks.map(x=>`<div><i style="height:${Math.round(x.v/mx*100)}px"></i>${new Date(x.t).getDate()}/${new Date(x.t).getMonth()+1}</div>`).join('')}</div></div>
<div class="card"><div class="hist-date">Progression par exercice</div><div class="mu">1RM estimé, 12 dernières séances</div>${nm.length?`<div class="chips">${nm.map(n=>`<button class="chip${n===sx?' on':''}" data-act="sx" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div><div class="chart" role="img" aria-label="Progression de ${esc(sx)}">${pts.map(p=>`<div><small>${fmt(p.v)}</small><i style="height:${Math.round(p.v/pm*100)}px"></i>${new Date(p.t).getDate()}/${new Date(p.t).getMonth()+1}</div>`).join('')}</div>`:'<p class="empty" style="margin:12px">Termine une séance pour voir ta progression.</p>'}</div>
<div class="card"><div class="hist-date">Répartition par groupe</div><div class="mu">volume des 30 derniers jours</div>${Object.entries(gv).sort((a,b)=>b[1]-a[1]).map(([g,v])=>`<div class="mg"><span>${esc(g)}</span><div><i style="width:${Math.round(v/gt*100)}%"></i></div><b>${Math.round(v/gt*100)}%</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de données.</p>'}</div>
${cardio7}<div class="card"><div class="hist-date">Records</div><div class="mu">1RM estimé (formule d’Epley)</div>${rec.map(([n,x])=>`<div class="rec"><div>${esc(n)}<br><span>${esc(x.kg)} kg × ${esc(x.reps)}</span></div><b>${fmt(e1(x))} kg</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de records.</p>'}</div>`;
}
/* Sélecteur d’exercices (le bouton Retour d’Android le ferme) */
let gq='',gm='Tous';
function glist(){
const g=gymCur();if(!g&&(gm===MG||gm===C1||gm===C2))gm='Tous';
const q=norm(gq),row=([n,m,tg])=>{const on=g&&inGym(n);return `<div class="gi${on?' in':''}">${thumb(n,'lg')}<div class="pt"><b>${esc(n)}</b><span>${esc(m)}${tg?' · '+esc(tg):''}</span>${gm===C2&&whoHas(n).length?'<small class="who">'+esc(whoHas(n).join(' · '))+'</small>':''}</div>${g?`<button class="tg${on?' on':''}" data-act="gtog" data-n="${esc(n)}" aria-pressed="${!!on}" aria-label="${on?'Retirer de':'Ajouter à'} ${esc(g.name)} : ${esc(n)}">${on?'✓':'+'}</button>`:''}</div>`},match=([n])=>norm(n).includes(q);
/* Catalogue de l'enseigne : rangé par familles (On Air) ou en une liste (autres enseignes) */
if(gm===C1||gm===C2){const L=n=>LIB.find(x=>x[0]===n),seen=new Set();
return (gm===C1?ONAIR:OTHERCAT).groups.map(gr=>{const l=gr.eq().filter(n=>!seen.has(n)&&seen.add(n)).map(L).filter(Boolean).filter(match);return l.length?`<h2 class="cg">${esc(gr.t)}<small>${l.length}</small></h2>${l.map(row).join('')}`:''}).join('')||'<p class="empty">Aucun résultat.</p>'}
const l=LIB.filter(([n,m])=>vis(n)&&(gm==='Tous'||(gm===MG?inGym(n):m===gm))&&match([n]));
return l.map(row).join('')||`<p class="empty">${gm===MG?'Aucune machine cochée pour l’instant. Choisis « Tous » et touche + sur les machines de ta salle.':'Aucun résultat.'}</p>`;
}
/* Carte « Ma salle » en haut du Guide */
function gymCard(){
const g=gymCur();
if(!S.gyms.length)return `<div class="card gym"><div class="hist-date">🏋️ Ma salle</div><div class="mu">Crée ta salle : tu cocheras les machines qu’elle possède, tu ne verras qu’elles en choisissant un exercice, et tes réglages (siège, hauteur…) seront propres à cette salle.</div><button class="btn" data-act="gnew">Créer ma salle</button></div>`;
return `<div class="card gym"><div class="ex-head"><div><div class="hist-date">🏋️ ${g?esc(g.name):'Aucune salle choisie'}</div><div class="mu">${g?g.eq.length+' machine'+(g.eq.length>1?'s':'')+' cochée'+(g.eq.length>1?'s':'')+' · touche + pour en ajouter':'Choisis la salle où tu t’entraînes.'}</div></div>${g?`<button class="del" style="color:var(--accent)" data-act="gren">Renommer</button>`:''}</div>
<div class="chips">${S.gyms.map(x=>`<button class="chip${x.id===S.gym?' on':''}" data-act="gsel" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}<button class="chip" data-act="gsel" data-id="">Aucune</button><button class="chip" data-act="gnew">+ Nouvelle</button></div>
${chainOf(g)?`<p class="mu">Modèle ${esc(chainOf(g).name)} (marques annoncées : ${esc(chainOf(g).brands)}). Liste probable : vérifie sur place et décoche ce qui manque.</p>`:''}
${g?`<button class="del" data-act="gdel">Supprimer cette salle</button>`:''}</div>`;
}
function viewGuide(){
const ch=['Tous',...(gymCur()?[MG,C1,C2]:[]),...M];
return `<h1>Guide</h1><p class="sub">Repère les machines avant de créer ta routine. Chaque dessin montre le type de machine à repérer dans la salle.</p>${gymCard()}
<input id="gq" placeholder="Rechercher une machine" value="${esc(gq)}" autocomplete="off" aria-label="Rechercher une machine"><div class="chips">${ch.map(m=>`<button class="chip${gm===m?' on':''}${m===C1?' star':''}" data-act="gm" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div><div id="gl">${glist()}</div><p class="mu" style="text-align:center;margin-top:18px">Fluxe v${VER}</p>`;
}
/* Ouvre un panneau plein écran (ou remplace celui déjà ouvert sans ajouter d'étape au bouton Retour) */
function openSheet(o){if(!pk)history.pushState({fx:1},'');pk=o;sheet()}
function openPk(){const g=gymCur();openSheet({q:'',m:g&&g.eq.length?MG:'Tous'})}
function openTool(){openSheet({tool:1,kg:'',bar:20})}
function closePk(){pk=null;sheet();if(history.state&&history.state.fx)history.back()}
window.addEventListener('popstate',()=>{if(pk){pk=null;sheet()}});
function sheet(){
const el=$('#sheet');
if(!pk){el.className='';el.innerHTML='';return}
el.className='on';
const top=t=>`<div class="sh-top"><span>${t}</span><button class="del" data-act="closepk" style="color:var(--accent);font-family:var(--body);font-size:16px">Fermer</button></div>`;
if(pk.data){el.innerHTML=top('Sauvegarde')+viewData();fillData();return}
if(pk.imp){const d=pk.imp,n=d.sessions.filter(x=>x.id!==d.current).length;el.innerHTML=top('Importer')+`<div class="card"><div class="hist-date">Fichier valide ✓</div><div class="mu">${n} séance${n>1?'s':''}, ${d.routines.length} routine${d.routines.length>1?'s':''}${d.gyms.length?', '+d.gyms.length+' salle'+(d.gyms.length>1?'s':''):''}.</div></div>
<div class="card"><button class="btn" data-act="imerge">Fusionner (conseillé)</button><p class="mu">Ajoute les séances qui manquent sur ce téléphone et garde la version la plus récente de chaque séance. Rien n’est effacé.</p></div>
<div class="card"><button class="sec" data-act="irepl">Tout remplacer</button><p class="mu">Les données de ce téléphone sont remplacées par celles du fichier. Une version de secours est créée juste avant.</p></div>`;return}
if(pk.gtpl){if(!pk.others)el.innerHTML=top('Nouvelle salle')+`<p class="mu" style="margin-left:4px">« ${esc(pk.gtpl)} » : par quoi veux-tu commencer ? Tu pourras cocher ou décocher chaque machine ensuite dans le Guide.</p>
<h2>⭐ Mon enseigne prioritaire</h2>
<button class="pi prio" data-act="gtpl" data-t="on-air"><div class="pt"><b>On Air</b><span>${esc(ONAIR.info)}</span><small>${ONAIR.groups.map(g=>esc(g.t)+' ('+g.eq().length+')'+(g.on?'':' : à cocher toi-même')).join(' · ')}</small></div></button>
<h2>Ou partir de zéro</h2>
<button class="pi" data-act="gtpl" data-t="vide"><div class="pt"><b>Je coche moi-même</b><span>Liste vide, idéal pour faire le tour de la salle</span></div></button>
<button class="pi" data-act="gtpl" data-t="base"><div class="pt"><b>Salle essentielle</b><span>Barres, haltères, poulies et machines guidées, sans les marques spécialisées</span></div></button>
<button class="pi" data-act="gtpl" data-t="tout"><div class="pt"><b>Salle très équipée</b><span>Toutes les machines du Guide (Hammer Strength, Eleiko…), tu décocheras celles qui manquent</span></div></button>
<button class="sec" data-act="gothers" style="margin-top:8px">Autres enseignes (Basic-Fit, Fitness Park…)</button>`;
if(pk.others)el.innerHTML=top('Autres enseignes')+`<p class="mu" style="margin-left:4px">« ${esc(pk.gtpl)} » · Choisis ton enseigne : ses machines probables seront cochées, et tu retrouveras toutes les machines des autres enseignes dans le « Catalogue autres enseignes » du Guide. Catalogue séparé d’On Air : ces modèles ne contiennent jamais les machines exclusives On Air. Machines probables d’après ce que chaque enseigne annonce publiquement : vérifie sur place et décoche ce qui manque.</p>
${OTHERS.map(c=>`<button class="pi" data-act="gtpl" data-t="${c.id}"><div class="pt"><b>${esc(c.name)}</b><span>${esc(c.info)}</span><small>Marques annoncées : ${esc(c.brands)}</small></div></button>`).join('')}`;return}
if(pk.tool){el.innerHTML=top('Disques')+`<p class="mu" style="margin-left:4px">Charge totale (barre comprise)</p><input id="dq" inputmode="decimal" maxlength="6" placeholder="Ex. 82,5" value="${esc(pk.kg)}" autocomplete="off" aria-label="Charge totale en kg"><div class="chips">${[20,15,10].map(b=>`<button class="chip${pk.bar===b?' on':''}" data-act="bar" data-b="${b}">Barre ${b} kg</button>`).join('')}</div><div id="dr">${discs()}</div>`;return}
el.innerHTML=top('Exercices')+`<input id="pq" placeholder="Rechercher ou créer" value="${esc(pk.q)}" autocomplete="off" aria-label="Rechercher"><div class="chips">${['Tous',...(gymCur()?[MG]:[]),...M].map(m=>`<button class="chip${pk.m===m?' on':''}" data-act="pm" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div><div id="pl">${plist()}</div>`;
}
/* Calculateur de disques : disques à mettre de chaque côté de la barre */
function discs(){
const t=parseFloat(String(pk.kg).replace(',','.'));
if(!(t>0))return '<p class="empty">Entre une charge pour voir les disques de chaque côté.</p>';
if(t<pk.bar)return `<p class="empty">La barre seule pèse déjà ${pk.bar} kg.</p>`;
let r=(t-pk.bar)/2;const out=[];
for(const d of [25,20,15,10,5,2.5,1.25]){const n=Math.floor(r/d+1e-9);if(n){out.push(`<span class="chip on">${n} × ${fmtN(d)}</span>`);r-=n*d}}
return `<div class="card"><div class="mu">Pour chaque côté de la barre :</div><div class="chips" style="flex-wrap:wrap">${out.join('')||'<span class="mu">Aucun disque</span>'}</div>${r>.01?`<p class="mu">Il reste ${fmtN(r*2)} kg impossibles à charger avec ces disques.</p>`:''}</div>`;
}
function plist(){
const q=norm(pk.q),own=names().filter(n=>!MU[n]).map(n=>[n,'Perso']);
const l=[...LIB,...own].filter(([n,m])=>vis(n)&&(pk.m==='Tous'||(pk.m===MG?inGym(n):m===pk.m))&&norm(n).includes(q));
const mk=(n,m,t)=>`<button class="pi" data-act="padd" data-n="${esc(n)}">${thumb(n)}<div class="pt"><b>${t}</b><span>${esc(m)}</span></div></button>`;
const nv=cname(pk.q);
const h=l.map(([n,m])=>mk(n,m+(TG[n]?' · '+TG[n]:''),esc(n))).join('')+(nv&&q&&![...LIB,...own].some(([n])=>norm(n)===q)?mk(nv,'Exercice perso','Créer « '+esc(nv)+' »'):'');
return h||(pk.m===MG?'<p class="empty">Aucune machine de ta salle ne correspond. Choisis « Tous » pour tout voir.</p>':'<p class="empty">Aucun résultat.</p>');
}
/* Minuteur de repos */
let tEnd=0,tInt=null,tTot=90000;
function tStart(sec){tTot=(sec||S.rest||90)*1000;tEnd=Date.now()+tTot;$('#timer').classList.add('on');tick();clearInterval(tInt);tInt=setInterval(tick,250)}
function tick(){
const r=Math.max(0,Math.ceil((tEnd-Date.now())/1000));
$('#tt').textContent=fmtT(r);
$('#tb').style.width=(Math.max(0,tEnd-Date.now())/tTot*100)+'%';
if(r<=0){clearInterval(tInt);beep();setTimeout(()=>$('#timer').classList.remove('on'),2500)}
}
function tStop(){clearInterval(tInt);$('#timer').classList.remove('on')}
let ac=null;
function beep(){try{const c=ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(c.resume)c.resume();const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.2;o.start();o.stop(c.currentTime+.35);if(navigator.vibrate)navigator.vibrate(300)}catch(e){}}
setInterval(()=>{const e=$('#el'),s=cur();if(e&&s&&!s.edit)e.textContent=mins(s.date)},20000);
/* Écran allumé pendant une séance (sinon il s'éteint entre deux séries) */
let wl=null,wb=false;
async function veille(){
if(!('wakeLock' in navigator)||wb)return;wb=true;
try{if(cur()&&!cur().edit&&!wl&&document.visibilityState==='visible'){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null})}else if((!cur()||cur().edit)&&wl){await wl.release();wl=null}}catch(e){}
wb=false;
}
document.addEventListener('visibilitychange',veille);
/* Bouton « Installer » (Android / Chrome) */
let ip=null;const ib=$('#inst');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();try{if(localStorage.getItem('fx-no'))return}catch(x){}ip=e;ib.hidden=false});
window.addEventListener('appinstalled',()=>{ib.hidden=true});
$('#ib').onclick=async()=>{if(!ip)return;ip.prompt();try{await ip.userChoice}catch(e){}ip=null;ib.hidden=true};
$('#ix').onclick=()=>{try{localStorage.setItem('fx-no','1')}catch(e){}ib.hidden=true};
/* ===== Versions de secours (niveau 3) =====
   Copies complètes des données gardées dans IndexedDB (un autre coffre que le localStorage, avec plus de place).
   - auto : 1 par jour maximum, on garde les 5 dernières
   - avant un import, une restauration ou à la demande : on garde les 4 dernières */
const VB={db:null,
open(){return this.db||(this.db=new Promise((ok,ko)=>{try{const r=indexedDB.open('fluxe-suivi-secours',1);r.onupgradeneeded=()=>r.result.createObjectStore('v',{keyPath:'at'});r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}catch(e){ko(e)}}))},
async run(mode,f){const db=await this.open();return new Promise((ok,ko)=>{const tx=db.transaction('v',mode),q=f(tx.objectStore('v'));tx.oncomplete=()=>ok(q&&q.result);tx.onerror=()=>ko(tx.error)})},
all(){return this.run('readonly',st=>st.getAll()).then(l=>(l||[]).sort((a,b)=>b.at-a.at))},
put(v){return this.run('readwrite',st=>st.put(v))},
del(at){return this.run('readwrite',st=>st.delete(at))}};
const WHY={auto:'Copie automatique',imp:'Avant un import',rest:'Avant une restauration',man:'Créée à la main',old:'Ancienne copie (avant v2.1)'};
let lastAt=0;
async function snap(why,raw){
try{
raw=raw||JSON.stringify(S);
const l=await VB.all();
if(why==='auto'){const a=l.find(v=>v.why==='auto');if(a&&(Date.now()-a.at<20*36e5||a.raw===raw))return false}
let at=Date.now();if(at<=lastAt)at=lastAt+1;lastAt=at;
let n=0;try{const p=clean(unwrap(JSON.parse(raw)));n=p?p.sessions.filter(x=>x.id!==p.current).length:0}catch(e){}
await VB.put({at,why,n,raw});
const same=l.filter(v=>(v.why==='auto')===(why==='auto')); /* l est trié du plus récent au plus ancien */
await Promise.all(same.slice((why==='auto'?5:4)-1).map(v=>VB.del(v.at)));
return true;
}catch(e){return false}
}
/* Au démarrage : copie du jour + récupération unique des anciennes copies gardées dans le localStorage */
async function snapStart(){
try{if(!localStorage.getItem('fx-old-done')){for(const k of [KEY+'-sauvegarde',KEY+'-brut']){const o=localStorage.getItem(k);if(o)await snap('old',o)}localStorage.setItem('fx-old-done','1')}}catch(e){}
if(done().length)snap('auto');
}
/* ===== Sauvegarde vers un fichier (format versionné) et partage ===== */
const pack=()=>JSON.stringify({app:'fluxe-suivi',format:FORMAT,version:VER,exportedAt:new Date().toISOString(),data:S},null,1);
function saveFile(){
const name='fluxe-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json',txt=pack();
const okd=()=>{S.lastBackup=Date.now();save();render();if(pk&&pk.data)sheet()};
let f=null;try{f=new File([txt],name,{type:'application/json'})}catch(e){}
/* iPhone / Android : feuille de partage (Enregistrer dans Fichiers, iCloud Drive, mail…) */
if(f&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Sauvegarde Fluxe'}).then(()=>{okd();toast('Sauvegarde envoyée ✓')}).catch(e=>{if(e&&e.name!=='AbortError')download(txt,name,okd)});return}
download(txt,name,okd);
}
function download(txt,name,okd){const u=URL.createObjectURL(new Blob([txt],{type:'application/json'}));const l=document.createElement('a');l.href=u;l.download=name;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);okd();toast('Fichier de sauvegarde téléchargé ✓')}
/* ===== Import : on vérifie le fichier, puis on propose Fusionner ou Remplacer ===== */
function imp(t){
if(typeof t!=='string'||t.length>5e6){alert('Données trop volumineuses.');return}
let d=null;try{d=clean(unwrap(JSON.parse(t)))}catch(e){}
if(!d){alert('Ce fichier n’est pas une sauvegarde Fluxe valide. Rien n’a été modifié.');return}
openSheet({imp:d});
}
/* Fusion : rien n'est effacé. Pour une même séance (même id), la version modifiée le plus récemment gagne.
   Une séance mise à la corbeille sur ce téléphone n'est pas ressuscitée. */
function merge(d){
const r={add:0,upd:0,skip:0},pos=new Map(S.sessions.map((s,i)=>[s.id,i])),tr=new Set(S.trash.filter(t=>t.s).map(t=>t.s.id));
for(const s of d.sessions){
if(s.id===d.current)continue; /* séance encore en cours dans le fichier : ignorée */
delete s.edit;
if(!pos.has(s.id)){if(tr.has(s.id)){r.skip++;continue}pos.set(s.id,S.sessions.length);S.sessions.push(s);r.add++}
else{const i=pos.get(s.id),l=S.sessions[i];if(l.id!==S.current&&(s.mod||s.date)>(l.mod||l.date)){S.sessions[i]=s;r.upd++}}
}
for(const x of d.routines)if(!S.routines.some(y=>norm(y.name)===norm(x.name)))S.routines.push(x);
for(const [k,v] of Object.entries(d.notes))if(!S.notes[k])S.notes[k]=v;
for(const [k,v] of Object.entries(d.rests))if(!S.rests[k])S.rests[k]=v;
if(!S.rest&&d.rest)S.rest=d.rest;
for(const g of d.gyms){const l=S.gyms.find(x=>x.id===g.id);if(!l){if(S.gyms.length<20)S.gyms.push(g);continue}g.eq.forEach(n=>{if(!l.eq.some(x=>norm(x)===norm(n)))l.eq.push(n)});for(const [k,v] of Object.entries(g.notes))if(!l.notes[k])l.notes[k]=v}
if(!S.gym&&d.gym&&S.gyms.some(g=>g.id===d.gym))S.gym=d.gym;
return r;
}
/* ===== Corbeille ===== */
function toTrash(o){S.trash.unshift(Object.assign({at:Date.now()},o));if(S.trash.length>500)S.trash.length=500}
/* ===== Écran « Sauvegarde » ===== */
function viewData(){
const tr=S.trash.map((t,x)=>{const left=Math.max(1,Math.ceil((t.at+J30-Date.now())/864e5));return `<div class="vr"><div><b>${t.s?esc(fmtDate(t.s.date)):'Routine « '+esc(t.r.name)+' »'}</b><span>${t.s?nset(t.s)+' séries · '+fmt(vol(t.s))+' kg · ':''}effacée définitivement dans ${left} j</span></div><button class="del" style="color:var(--accent)" data-act="trest" data-x="${x}">Restaurer</button></div>`}).join('');
return `<p class="mu" style="margin-left:4px">Tes séances sont enregistrées uniquement sur ce téléphone. Trois protections les gardent à l’abri.</p>
<div class="card"><div class="hist-date">1. Fichier de sauvegarde</div><div class="mu">${S.lastBackup?'Dernière sauvegarde : '+esc(fmtDate(S.lastBackup)):'Aucune sauvegarde pour l’instant'}. Le fichier te permet aussi de changer de téléphone (iPhone ↔ Android).</div>
<button class="btn" data-act="file">Sauvegarder (Fichiers, iCloud, mail…)</button>
<div class="dat" style="margin:10px 0 0"><button class="sec" data-act="imp">Importer un fichier</button><button class="sec" data-act="paste">Coller du texte</button></div><button class="ghost" data-act="export">Copier les données en texte</button></div>
<div class="card"><div class="hist-date">2. Versions de secours</div><div class="mu">Copies automatiques sur ce téléphone : une par jour (les 5 dernières), plus une avant chaque import ou restauration.</div><div id="vl"><p class="mu">Chargement…</p></div><button class="ghost" data-act="snapnow">Créer une version maintenant</button></div>
<div class="card"><div class="ex-head"><div class="hist-date">3. Corbeille</div>${S.trash.length?'<button class="del" data-act="tempty">Vider</button>':''}</div><div class="mu">Les séances et routines supprimées restent ici 30 jours.</div>${tr||'<p class="mu">La corbeille est vide.</p>'}</div>
<div class="card"><div class="hist-date">État du stockage</div><div class="mu" id="st">Vérification…</div></div>`;
}
async function fillData(){
const vl=$('#vl'),st=$('#st');
try{const l=await VB.all();if(!pk||!pk.data)return;
vl.innerHTML=l.map(v=>`<div class="vr"><div><b>${esc(new Date(v.at).toLocaleString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</b><span>${esc(WHY[v.why]||'Copie')} · ${v.n} séance${v.n>1?'s':''}</span></div><button class="del" style="color:var(--accent)" data-act="vrest" data-at="${v.at}">Restaurer</button></div>`).join('')||'<p class="mu">Pas encore de version : la première sera créée automatiquement après ta première séance.</p>'}
catch(e){if(vl)vl.innerHTML='<p class="mu">Versions de secours indisponibles sur ce navigateur (navigation privée ?). Utilise le fichier de sauvegarde.</p>'}
let t='';
try{const p=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null;t=p===true?'✓ Stockage protégé : le téléphone ne doit pas l’effacer pour faire de la place.':p===false?'Stockage non garanti : ajoute Fluxe à l’écran d’accueil et sauvegarde régulièrement.':'';
if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();if(e&&e.usage!=null)t+=(t?' ':'')+'Espace utilisé : '+(e.usage/1048576).toFixed(1).replace('.',',')+' Mo.'}}catch(e){}
if(st&&pk&&pk.data)st.textContent=t||'Informations indisponibles sur ce navigateur.';
}
$('#fi').addEventListener('change',ev=>{const f=ev.target.files[0];if(!f)return;if(f.size>5e6){alert('Fichier trop volumineux.');ev.target.value='';return}const r=new FileReader();r.onload=()=>imp(String(r.result));r.readAsText(f);ev.target.value=''});
document.addEventListener('input',ev=>{
const t=ev.target;
if(t.id==='pq'&&pk&&!pk.tool){pk.q=t.value.slice(0,60);$('#pl').innerHTML=plist();return}
if(t.id==='dq'&&pk&&pk.tool){pk.kg=t.value.replace(/[^\d.,]/g,'').slice(0,6);$('#dr').innerHTML=discs();return}
if(t.id==='gq'){gq=t.value.slice(0,60);$('#gl').innerHTML=glist();return}
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
const tb=ev.target.closest('[data-tab]');if(tb){tab=tb.dataset.tab;render();window.scrollTo(0,0);return}
const b=ev.target.closest('[data-act]');if(!b)return;
const a=b.dataset.act,s=cur(),i=+b.dataset.i,j=+b.dataset.j,k=+b.dataset.k;
if(!s&&['padd','addset','delex','finish','cancel','chk','rex','wu','sug'].includes(a))return;
if(['addset','delex','rex','sug','chk','wu'].includes(a)&&!s.exercises[i])return;
if((a==='chk'||a==='wu')&&!s.exercises[i].sets[j])return;
if(['wu','rex','sug'].includes(a)&&s.exercises[i].cardio)return;
if(['pm','bar','imerge','irepl','gtpl','trest','vrest','tempty'].includes(a)&&!pk)return;
if((a==='start'||a==='startr')&&S.current)return;
if(a==='t+'){tEnd+=15000;tTot+=15000;tick();return}
if(a==='t0'){tStop();return}
if(a==='pm'){pk.m=b.dataset.m;sheet();return}
if(a==='data'){openSheet({data:1});return}
if(a==='file'){saveFile();return}
if(a==='imerge'||a==='irepl'){const d=pk.imp;if(!d)return;
if(a==='irepl'&&!confirm('Remplacer toutes les données de ce téléphone par celles du fichier ?'))return;
snap('imp').then(()=>{
if(a==='irepl'){d.current=null;d.editBak=null;d.sessions.forEach(x=>delete x.edit);S=purge(d);tStop();save();closePk();render();toast('Données remplacées ✓ (version de secours créée)')}
else{const r=merge(d);save();closePk();render();alert('Fusion terminée ✓\n'+r.add+' séance(s) ajoutée(s), '+r.upd+' mise(s) à jour.'+(r.skip?'\n'+r.skip+' ignorée(s) car dans ta corbeille.':''))}});return}
if(a==='snapnow'){snap('man').then(ok=>{toast(ok?'Version de secours créée ✓':'Impossible de créer une version sur ce navigateur');if(pk&&pk.data)fillData()});return}
if(a==='vrest'){const at=+b.dataset.at;
if(S.current){alert('Termine ou annule d’abord la séance en cours.');return}
if(!confirm('Revenir à cette version ? Tes données actuelles seront gardées dans une nouvelle version de secours.'))return;
VB.all().then(l=>{const v=l.find(x=>x.at===at);let d=null;try{d=v&&clean(unwrap(JSON.parse(v.raw)))}catch(e){}
if(!d){alert('Cette version est illisible. Rien n’a été modifié.');return}
return snap('rest').then(()=>{d.current=null;d.editBak=null;d.sessions.forEach(x=>delete x.edit);S=purge(d);save();tStop();render();sheet();toast('Version restaurée ✓')})}).catch(()=>alert('Versions de secours indisponibles.'));return}
if(a==='trest'){const x=+b.dataset.x,t=S.trash[x];if(!t)return;
if(t.s){if(S.sessions.some(y=>y.id===t.s.id))alert('Cette séance est déjà dans ton historique.');else S.sessions.push(t.s)}
else S.routines.push(t.r);
S.trash.splice(x,1);save();render();sheet();toast('Restauré ✓');return}
if(a==='tempty'){if(!confirm('Vider la corbeille ? Ces éléments seront effacés définitivement.'))return;S.trash=[];save();render();sheet();return}
if(a==='gtpl'){const name=pk.gtpl,t=b.dataset.t,id=uid();
const ch=CHAINS.find(c=>c.id===t);
const eq=ch?defOf(ch):t==='tout'?LIB.filter(x=>!XS.has(x[0])).map(x=>x[0]):t==='base'?LIB.filter(x=>!['Hammer Strength','Eleiko','Life Fitness'].includes(x[2])).map(x=>x[0]):[];
S.gyms.push(ch?{id,name,eq,notes:{},chain:ch.id}:{id,name,eq,notes:{}});S.gym=id;tab='aide';gm=ch?(ch.id==='on-air'?C1:C2):eq.length?MG:'Tous';save();closePk();render();toast('Salle « '+name+' » créée ✓');return}
if(a==='closepk'){closePk();return}
if(a==='gothers'){if(!pk||!pk.gtpl)return;pk.others=1;sheet();return}
if(a==='pick'){openPk();return}
if(a==='tool'){openTool();return}
if(a==='bar'){pk.bar=[20,15,10].includes(+b.dataset.b)?+b.dataset.b:20;sheet();return}
if(a==='padd'){const nm=cname(b.dataset.n);if(!nm)return;s.exercises.push(newEx(nm));const g=gymCur();if(g&&!MU[nm]&&!inGym(nm)&&g.eq.length<600)g.eq.push(nm);closePk()}
else if(a==='rest'){const o=[60,90,120,180,240];S.rest=o[(o.indexOf(S.rest||90)+1)%o.length]}
else if(a==='rex'){S.rests=S.rests||{};const n=s.exercises[i].name,c=restFor(n);S.rests[K(n)]=RS[(RS.indexOf(c)+1)%RS.length]}
else if(a==='wu'){const x=s.exercises[i].sets[j];if(x){if(x.w)delete x.w;else x.w=true}}
else if(a==='sug'){const sg=suggest(s.exercises[i].name);if(sg)s.exercises[i].sets.forEach(x=>{if(!x.done&&!x.w)x.kg=String(Math.round(sg.kg*100)/100)})}
else if(a==='snz'){S.snooze=Date.now()}
else if(a==='sx'){sx=b.dataset.n}
else if(a==='gm'){gm=M.includes(b.dataset.m)||[MG,C1,C2].includes(b.dataset.m)?b.dataset.m:'Tous'}
else if(a==='gnew'){if(S.gyms.length>=20){alert('20 salles maximum.');return}const n=prompt('Nom de ta salle (ex. : la ville ou le quartier)','Ma salle');if(!n||!cname(n))return;openSheet({gtpl:cname(n).slice(0,40)});return}
else if(a==='gsel'){S.gym=S.gyms.some(g=>g.id===b.dataset.id)?b.dataset.id:null;if(!S.gym&&gm===MG)gm='Tous'}
else if(a==='gren'){const g=gymCur();if(!g)return;const n=prompt('Nouveau nom de la salle',g.name);if(!n||!cname(n))return;g.name=cname(n).slice(0,40)}
else if(a==='gdel'){const g=gymCur();if(!g||!confirm('Supprimer la salle « '+g.name+' » ? Ses machines cochées et ses réglages seront perdus. Tes séances restent dans l’historique.'))return;S.gyms=S.gyms.filter(x=>x.id!==g.id);S.gym=S.gyms[0]?S.gyms[0].id:null;gm='Tous'}
else if(a==='gtog'){const g=gymCur(),n=cname(b.dataset.n);if(!g||!n)return;const i=g.eq.findIndex(x=>norm(x)===norm(n));if(i>=0)g.eq.splice(i,1);else if(g.eq.length<600)g.eq.push(n);save();$('#gl').innerHTML=glist();const c=document.querySelector('.card.gym');if(c)c.outerHTML=gymCard();return}
else if(a==='editsess'){if(S.current){alert('Termine ou annule d’abord la séance en cours.');return}const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x)return;S.editBak=JSON.parse(JSON.stringify(x));x.edit=true;S.current=x.id;tab='seance';window.scrollTo(0,0)}
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
if(saved){tab='histo';window.scrollTo(0,0);toast(saved==='edit'?'Modifications enregistrées ✓':'Séance enregistrée ✓');save();snap('auto')}
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
/* contrôles au démarrage : stockage disponible, fichiers de la même version, stockage durable */
try{localStorage.setItem('fx-test','1');localStorage.removeItem('fx-test')}catch(e){saveFail=true;warn('save',MSG_SAVE)}
{const mv=document.querySelector('meta[name="app-version"]');if(!mv||mv.content!==VER)warn('ver','Les fichiers de l’application ne sont pas tous à la même version : remplace index.html, app.js, manifest.json et sw.js ensemble, puis rouvre l’app.')}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
snapStart();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
render();
})();
