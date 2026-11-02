(function(){
const KEY='muscu-v1'; /* ne pas changer : c'est la clé où sont tes données */
const M=['Pectoraux','Dos','Épaules','Bras','Jambes','Fessiers','Abdos','Corps entier'];
const T={h:'Hammer Strength',s:'Machine guidée',p:'Poulie',e:'Eleiko'};
const LIB=[].concat(...Object.entries({
Pectoraux:['Développé couché','Développé incliné haltères','Écarté poulie','Pompes','Développé couché haltères','Développé incliné barre','Développé décliné','Pec deck (papillon)|s','Presse pectorale assise|s','Développé couché Iso-Lateral|h','Développé incliné Iso-Lateral|h','Développé super incliné Iso-Lateral|h','Développé décliné Iso-Lateral|h','Pectoraux écartés Iso-Lateral (Wide Chest)|h','Pullover machine|h','Écarté poulie vis-à-vis|p'],
Dos:['Tractions','Rowing barre','Tirage vertical','Tirage horizontal','Soulevé de terre','Tractions assistées|s','Tirage vertical machine (Lat Pulldown)|s','Rowing assis machine|s','Tirage vertical Iso-Lateral|h','Tirage large Iso-Lateral (Wide Pulldown)|h','Rowing haut Iso-Lateral (High Row)|h','Rowing Iso-Lateral|h','Rowing bas Iso-Lateral (Low Row)|h','Rowing D.Y. Iso-Lateral|h','Rowing T-Bar|h','Shrug assis/debout machine|h','Pull-over poulie|p','Rowing haltère unilatéral','Shrugs haltères','Hyperextension (banc lombaires)'],
Épaules:['Développé militaire','Élévations latérales','Oiseau','Développé épaules haltères','Développé épaules machine|s','Oiseau machine (reverse pec deck)|s','Développé épaules Iso-Lateral|h','Élévations latérales machine|h','Face pull|p','Élévations frontales','Push press|e'],
Bras:['Curl barre','Curl marteau','Triceps poulie','Dips','Barre au front','Curl haltères','Curl pupitre (Larry Scott)','Curl concentré','Curl machine|s','Extension triceps machine|s','Curl biceps assis|h','Dips assis machine|h','Curl poulie basse|p','Kickback triceps poulie|p','Extension triceps nuque haltère','Curl poignets'],
Jambes:['Squat','Presse à cuisses','Fentes','Leg curl','Leg extension','Mollets debout','Front squat|e','Soulevé de terre roumain','Good morning','Fentes bulgares','Step-up','Leg curl allongé|s','Leg curl assis|s','Adducteurs machine|s','Squat Smith machine|h','Presse à cuisses linéaire|h','Presse à cuisses Iso-Lateral|h','V-Squat|h','Hack squat|h','Belt squat|h','Pendulum squat|h','Leg extension machine|h','Leg curl à genoux Iso-Lateral|h','Mollets assis|h','Mollets presse|h','Tibial machine|h','Nordic assisté|h'],
Fessiers:['Hip thrust','Glute drive|h','Abducteurs machine|s','Reverse hyper|h','Kickback fessier poulie|p'],
Abdos:['Crunch','Gainage','Relevé de jambes','Crunch machine|s','Crunch obliques|h','Crunch poulie|p','Roue abdominale','Russian twist','Relevé de genoux chaise romaine'],
'Corps entier':['Arraché (snatch)|e','Épaulé (power clean)|e','Épaulé-jeté|e','Thruster','Kettlebell swing','Farmer walk']
}).map(([g,l])=>l.map(n=>{const[a,t]=n.split('|');return[a,g,T[t]||'']})));
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
const n={id,date,exercises:[]},dur=num(s.dur);
if(dur!==null&&dur>=0&&dur<=1440)n.dur=Math.round(dur);
for(const e of s.exercises.slice(0,60)){
if(!e||typeof e!=='object'||!Array.isArray(e.sets))continue;
const name=str(e.name,60);if(!name)continue;
const sets=[];
for(const x of e.sets.slice(0,60)){if(!x||typeof x!=='object')continue;const t={kg:val(x.kg),reps:val(x.reps),done:x.done!==false};if(x.w===true)t.w=true;sets.push(t)}
n.exercises.push({name,sets});
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
return o;
}
function load(){
try{const raw=localStorage.getItem(KEY),p=JSON.parse(raw),d=clean(p);if(d){if(p.sessions.length!==d.sessions.length)try{localStorage.setItem(KEY+'-brut',raw)}catch(e){}return d}}catch(e){}
return{sessions:[],routines:[],current:null,notes:{},rests:{}};
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const $=q=>document.querySelector(q);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtDate=t=>new Date(t).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const cur=()=>S.sessions.find(x=>x.id===S.current);
const norm=n=>n.trim().toLowerCase();
const dn=x=>x.done!==false;
const ok=x=>dn(x)&&!x.w; /* série de travail validée (hors échauffement) */
const vol=s=>s.exercises.reduce((a,e)=>a+e.sets.reduce((b,x)=>b+(ok(x)?(+x.kg)*(+x.reps):0),0),0);
const nset=s=>s.exercises.reduce((a,e)=>a+e.sets.filter(ok).length,0);
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
function newEx(name){const p=prevSets(name);return{name,sets:(p||[{kg:'',reps:''}]).map(x=>({kg:x.kg,reps:x.reps,done:false}))}}
function names(){const st=new Set();S.sessions.forEach(s=>s.exercises.forEach(e=>st.add(e.name)));return [...st]}
const K=n=>'k:'+norm(n).slice(0,60);
const RS=[60,90,120,180,240];
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
return `<div class="card"><div class="hist-date">Pense à sauvegarder</div><div class="mu">${S.lastBackup?'Dernière sauvegarde : '+esc(fmtDate(S.lastBackup)):'Aucune sauvegarde pour l’instant'}. Tes données ne sont que sur ce téléphone.</div><div class="dat"><button class="btn" data-act="file">Exporter</button><button class="sec" data-act="snz">Plus tard</button></div></div>`;
}
function render(){
document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===tab));
$('#app').innerHTML=tab==='seance'?viewSeance():tab==='histo'?viewHisto():viewStats();
veille();
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
const pv=prevSets(e.name)||[],b=best(e.name),sg=s.edit?null:suggest(e.name),nt=(S.notes&&S.notes[K(e.name)])||'';
let wi=-1;
return `<section class="card"><div class="ex-head"><div><div class="ex-name">${esc(e.name)}</div><div class="mu">${esc(MU[e.name]||'Perso')}${TG[e.name]?' · '+esc(TG[e.name]):''}</div></div><button class="del" data-act="delex" data-i="${i}">Retirer</button></div>
${sg?`<button class="sg" data-act="sug" data-i="${i}">💡 ${esc(sg.txt)}<small>${esc(sg.why)}</small></button>`:''}
<input class="note" data-note="${i}" maxlength="200" placeholder="Note (réglage du siège, hauteur…)" value="${esc(nt)}" autocomplete="off" aria-label="Note pour ${esc(e.name)}">
<div class="gr gh"><span>Série</span><span>Précédent</span><span>kg</span><span>Réps</span><span></span></div>
${e.sets.map((x,j)=>{if(!x.w)wi++;const p=x.w?null:pv[wi],pr=x.done&&!x.w&&b>0&&e1(x)>b+.001;return `<div class="gr${x.done?' ok':''}"><button class="plate${x.w?' wu':''}" data-act="wu" data-i="${i}" data-j="${j}" aria-label="Série ${j+1} : ${x.w?'échauffement':'travail'}, toucher pour changer">${x.w?'É':wi+1}</button><span class="pv">${p?esc(p.kg)+'×'+esc(p.reps):'–'}${pr?'<span class="pr">PR</span>':''}</span><input type="text" inputmode="decimal" data-i="${i}" data-j="${j}" data-f="kg" value="${esc(x.kg)}" aria-label="kg, série ${j+1}"><input type="text" inputmode="numeric" data-i="${i}" data-j="${j}" data-f="reps" value="${esc(x.reps)}" aria-label="Répétitions, série ${j+1}"><button class="ck" data-act="chk" data-i="${i}" data-j="${j}" aria-pressed="${!!x.done}" aria-label="Valider la série ${j+1}">✓</button></div>`}).join('')}
<button class="ghost" data-act="addset" data-i="${i}">+ Ajouter une série</button><button class="ghost" data-act="rex" data-i="${i}">⏱ Repos pour cet exercice : ${fmtT(restFor(e.name))}</button></section>`;
}
function viewHisto(){
const l=done().sort((a,b)=>b.date-a.date);
const tools=`<h2>Mes données</h2><p class="mu" style="margin-left:4px">Fais une sauvegarde de temps en temps, ou utilise-la pour changer de téléphone.</p><div class="dat"><button class="sec" data-act="file">Exporter (fichier)</button><button class="sec" data-act="imp">Importer (fichier)</button><button class="sec" data-act="export">Copier le texte</button><button class="sec" data-act="paste">Coller du texte</button></div>`;
if(!l.length)return `<h1>Historique</h1><p class="empty">Tes séances terminées apparaîtront ici.</p>${tools}`;
return `<h1>Historique</h1><p class="sub">${l.length} séance${l.length>1?'s':''}</p>
${l.map(s=>`<div class="card"><div class="ex-head"><div><div class="hist-date">${esc(fmtDate(s.date))}</div><div class="mu">${nset(s)} séries · ${fmt(vol(s))} kg${s.dur?' · '+s.dur+' min':''}</div></div><div><button class="del" style="color:var(--accent)" data-act="editsess" data-id="${esc(s.id)}">Modifier</button><button class="del" data-act="delsess" data-id="${esc(s.id)}">Supprimer</button></div></div>
${s.exercises.map(e=>{const d=e.sets.filter(ok);if(!d.length)return '';const b=d.reduce((a,x)=>e1(x)>e1(a)?x:a);return `<div class="hist-ex"><b>${esc(e.name)}</b><div>${d.length} série${d.length>1?'s':''} · meilleure ${esc(b.kg)} kg × ${esc(b.reps)}</div></div>`}).join('')}</div>`).join('')}${tools}`;
}
function wk(t){const d=new Date(t);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()}
let sx=null;
function viewStats(){
const l=done(),now=Date.now(),w0=wk(now),W=7*864e5;
/* Total du jour : repart à zéro chaque nuit, séance en cours comprise */
const d0=new Date().setHours(0,0,0,0),today=S.sessions.filter(x=>x.date>=d0).reduce((a,x)=>a+vol(x),0);
const weeks=[...Array(8)].map((_,k)=>{const t=w0-(7-k)*W;const v=l.filter(s=>wk(s.date)===t).reduce((a,s)=>a+vol(s),0);return{t,v}});
const mx=Math.max(1,...weeks.map(x=>x.v));
const bs=Object.create(null);l.forEach(s=>s.exercises.forEach(e=>e.sets.filter(ok).forEach(x=>{const k=e.name;if(!bs[k]||e1(x)>e1(bs[k]))bs[k]=x})));
const rec=Object.entries(bs).sort((a,b)=>e1(b[1])-e1(a[1])).slice(0,8);
const nm=[...new Set(l.flatMap(s=>s.exercises.filter(e=>e.sets.some(ok)).map(e=>e.name)))];
if(!sx||!nm.includes(sx))sx=nm[0]||null;
const pts=sx?l.slice().sort((a,b)=>a.date-b.date).map(s=>{const e=s.exercises.find(e=>e.name===sx);return{t:s.date,v:e?e.sets.filter(ok).reduce((a,x)=>Math.max(a,e1(x)||0),0):0}}).filter(p=>p.v>0).slice(-12):[];
const pm=Math.max(1,...pts.map(p=>p.v));
const gv={};l.filter(s=>now-s.date<30*864e5).forEach(s=>s.exercises.forEach(e=>{const g=MU[e.name]||'Perso';gv[g]=(gv[g]||0)+e.sets.filter(ok).reduce((a,x)=>a+(+x.kg||0)*(+x.reps||0),0)}));
const gt=Object.values(gv).reduce((a,b)=>a+b,0)||1;
return `<h1>Stats</h1><p class="sub">Ta progression</p>
<div class="stats"><div><b>${l.length}</b><span>séances</span></div><div><b>${l.filter(s=>now-s.date<W).length}</b><span>7 derniers jours</span></div><div><b>${fmt(today)}</b><span>kg aujourd’hui</span></div></div>
<div class="card"><div class="hist-date">Volume par semaine</div><div class="mu">en kg, 8 dernières semaines</div><div class="chart" role="img" aria-label="Volume hebdomadaire">${weeks.map(x=>`<div><i style="height:${Math.round(x.v/mx*100)}px"></i>${new Date(x.t).getDate()}/${new Date(x.t).getMonth()+1}</div>`).join('')}</div></div>
<div class="card"><div class="hist-date">Progression par exercice</div><div class="mu">1RM estimé, 12 dernières séances</div>${nm.length?`<div class="chips">${nm.map(n=>`<button class="chip${n===sx?' on':''}" data-act="sx" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div><div class="chart" role="img" aria-label="Progression de ${esc(sx)}">${pts.map(p=>`<div><small>${fmt(p.v)}</small><i style="height:${Math.round(p.v/pm*100)}px"></i>${new Date(p.t).getDate()}/${new Date(p.t).getMonth()+1}</div>`).join('')}</div>`:'<p class="empty" style="margin:12px">Termine une séance pour voir ta progression.</p>'}</div>
<div class="card"><div class="hist-date">Répartition par groupe</div><div class="mu">volume des 30 derniers jours</div>${Object.entries(gv).sort((a,b)=>b[1]-a[1]).map(([g,v])=>`<div class="mg"><span>${esc(g)}</span><div><i style="width:${Math.round(v/gt*100)}%"></i></div><b>${Math.round(v/gt*100)}%</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de données.</p>'}</div>
<div class="card"><div class="hist-date">Records</div><div class="mu">1RM estimé (formule d’Epley)</div>${rec.map(([n,x])=>`<div class="rec"><div>${esc(n)}<br><span>${esc(x.kg)} kg × ${esc(x.reps)}</span></div><b>${fmt(e1(x))} kg</b></div>`).join('')||'<p class="empty" style="margin:12px">Pas encore de records.</p>'}</div>`;
}
/* Sélecteur d’exercices (le bouton Retour d’Android le ferme) */
function openPk(){pk={q:'',m:'Tous'};history.pushState({fx:1},'');sheet()}
function openTool(){pk={tool:1,kg:'',bar:20};history.pushState({fx:1},'');sheet()}
function closePk(){pk=null;sheet();if(history.state&&history.state.fx)history.back()}
window.addEventListener('popstate',()=>{if(pk){pk=null;sheet()}});
function sheet(){
const el=$('#sheet');
if(!pk){el.className='';el.innerHTML='';return}
el.className='on';
const top=t=>`<div class="sh-top"><span>${t}</span><button class="del" data-act="closepk" style="color:var(--accent);font-family:var(--body);font-size:16px">Fermer</button></div>`;
if(pk.tool){el.innerHTML=top('Disques')+`<p class="mu" style="margin-left:4px">Charge totale (barre comprise)</p><input id="dq" inputmode="decimal" maxlength="6" placeholder="Ex. 82,5" value="${esc(pk.kg)}" autocomplete="off" aria-label="Charge totale en kg"><div class="chips">${[20,15,10].map(b=>`<button class="chip${pk.bar===b?' on':''}" data-act="bar" data-b="${b}">Barre ${b} kg</button>`).join('')}</div><div id="dr">${discs()}</div>`;return}
el.innerHTML=top('Exercices')+`<input id="pq" placeholder="Rechercher ou créer" value="${esc(pk.q)}" autocomplete="off" aria-label="Rechercher"><div class="chips">${['Tous',...M].map(m=>`<button class="chip${pk.m===m?' on':''}" data-act="pm" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div><div id="pl">${plist()}</div>`;
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
const l=[...LIB,...own].filter(([n,m])=>(pk.m==='Tous'||m===pk.m)&&norm(n).includes(q));
const mk=(n,m,t)=>`<button class="pi" data-act="padd" data-n="${esc(n)}"><b>${t}</b><span>${esc(m)}</span></button>`;
const nv=pk.q.trim().slice(0,60);
return l.map(([n,m])=>mk(n,m+(TG[n]?' · '+TG[n]:''),esc(n))).join('')+(q&&![...LIB,...own].some(([n])=>norm(n)===q)?mk(nv,'Exercice perso','Créer « '+esc(nv)+' »'):'');
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
/* Import de données */
function imp(t){
if(typeof t!=='string'||t.length>5e6){alert('Données trop volumineuses.');return}
let d=null;try{d=clean(JSON.parse(t))}catch(e){}
if(!d){alert('Données non valides. Rien n’a été modifié.');return}
if(!confirm('Remplacer les données de cet appareil par celles-ci ('+d.sessions.length+' séance'+(d.sessions.length>1?'s':'')+') ?'))return;
try{const o=localStorage.getItem(KEY);if(o)localStorage.setItem(KEY+'-sauvegarde',o)}catch(e){}
S=d;save();tStop();render();alert('Données importées.');
}
$('#fi').addEventListener('change',ev=>{const f=ev.target.files[0];if(!f)return;if(f.size>5e6){alert('Fichier trop volumineux.');ev.target.value='';return}const r=new FileReader();r.onload=()=>imp(String(r.result));r.readAsText(f);ev.target.value=''});
document.addEventListener('input',ev=>{
const t=ev.target;
if(t.id==='pq'&&pk&&!pk.tool){pk.q=t.value.slice(0,60);$('#pl').innerHTML=plist();return}
if(t.id==='dq'&&pk&&pk.tool){pk.kg=t.value.replace(/[^\d.,]/g,'').slice(0,6);$('#dr').innerHTML=discs();return}
const s=cur();if(!s)return;
if(t.dataset.note!==undefined){const e=s.exercises[+t.dataset.note];if(!e)return;const k=K(e.name),v=t.value.slice(0,200);S.notes=S.notes||{};if(v.trim())S.notes[k]=v;else delete S.notes[k];save();return}
if(!t.dataset.f)return;
const x=s.exercises[+t.dataset.i]&&s.exercises[+t.dataset.i].sets[+t.dataset.j];if(!x)return;
let v=t.value.replace(',','.').replace(/[^\d.]/g,'');
v=t.dataset.f==='reps'?v.replace(/\./g,'').slice(0,4):(v.match(/^\d{0,5}\.?\d{0,3}/)||[''])[0];
if(v!==t.value.replace(',','.'))t.value=v;
x[t.dataset.f]=v;save();
});
document.addEventListener('click',ev=>{
const tb=ev.target.closest('[data-tab]');if(tb){tab=tb.dataset.tab;render();window.scrollTo(0,0);return}
const b=ev.target.closest('[data-act]');if(!b)return;
const a=b.dataset.act,s=cur(),i=+b.dataset.i,j=+b.dataset.j,k=+b.dataset.k;
if(!s&&['padd','addset','delex','finish','cancel','chk','rex','wu','sug'].includes(a))return;
if(a==='t+'){tEnd+=15000;tTot+=15000;tick();return}
if(a==='t0'){tStop();return}
if(a==='pm'){pk.m=b.dataset.m;sheet();return}
if(a==='closepk'){closePk();return}
if(a==='pick'){openPk();return}
if(a==='tool'){openTool();return}
if(a==='bar'){pk.bar=[20,15,10].includes(+b.dataset.b)?+b.dataset.b:20;sheet();return}
if(a==='padd'){s.exercises.push(newEx(String(b.dataset.n).slice(0,60)));closePk()}
else if(a==='rest'){const o=[60,90,120,180,240];S.rest=o[(o.indexOf(S.rest||90)+1)%o.length]}
else if(a==='rex'){S.rests=S.rests||{};const n=s.exercises[i].name,c=restFor(n);S.rests[K(n)]=RS[(RS.indexOf(c)+1)%RS.length]}
else if(a==='wu'){const x=s.exercises[i].sets[j];if(x){if(x.w)delete x.w;else x.w=true}}
else if(a==='sug'){const sg=suggest(s.exercises[i].name);if(sg)s.exercises[i].sets.forEach(x=>{if(!x.done&&!x.w)x.kg=String(sg.kg)})}
else if(a==='snz'){S.snooze=Date.now()}
else if(a==='sx'){sx=b.dataset.n}
else if(a==='editsess'){if(S.current){alert('Termine ou annule d’abord la séance en cours.');return}const x=S.sessions.find(y=>y.id===b.dataset.id);if(!x)return;S.editBak=JSON.parse(JSON.stringify(x));x.edit=true;S.current=x.id;tab='seance';window.scrollTo(0,0)}
else if(a==='start'){const n={id:uid(),date:Date.now(),exercises:[]};S.sessions.push(n);S.current=n.id}
else if(a==='startr'){const n={id:uid(),date:Date.now(),exercises:[]};S.current=n.id;n.exercises=S.routines[k].exercises.map(newEx);S.sessions.push(n)}
else if(a==='delr'){if(!confirm('Supprimer cette routine ?'))return;S.routines.splice(k,1)}
else if(a==='delex'){if(!confirm('Retirer cet exercice ?'))return;s.exercises.splice(i,1)}
else if(a==='addset'){const l=s.exercises[i].sets;const p=l[l.length-1]||{kg:'',reps:''};l.push({kg:p.kg,reps:p.reps,done:false})}
else if(a==='chk'){
const x=s.exercises[i].sets[j];
if(!x.done){if(String(x.reps).trim()===''||isNaN(+x.reps)||isNaN(+x.kg)){alert('Renseigne les répétitions (et la charge).');return}if(String(x.kg).trim()==='')x.kg='0';x.done=true;if(!s.edit&&!x.w)tStart(restFor(s.exercises[i].name))}else x.done=false;
}
else if(a==='finish'){
if(!confirm(s.edit?'Enregistrer les modifications ?':'Terminer la séance ?'))return;
s.exercises.forEach(e=>e.sets=e.sets.filter(dn));s.exercises=s.exercises.filter(e=>e.sets.length);
if(!s.exercises.length)S.sessions=S.sessions.filter(x=>x.id!==s.id);
else if(s.edit){delete s.edit}
else{s.dur=mins(s.date);
if(confirm('Enregistrer cette séance comme routine ?')){const n=prompt('Nom de la routine','Séance du '+new Date().toLocaleDateString('fr-FR'));if(n&&n.trim())S.routines.push({name:n.trim().slice(0,60),exercises:s.exercises.map(e=>e.name)})}}
S.current=null;S.editBak=null;tStop();
}
else if(a==='cancel'){
if(s.edit){if(!confirm('Annuler les modifications ?'))return;const bk=S.editBak;if(bk)S.sessions=S.sessions.map(x=>x.id===s.id?bk:x);S.current=null;S.editBak=null;tStop()}
else{if(!confirm('Annuler et supprimer cette séance ?'))return;S.sessions=S.sessions.filter(x=>x.id!==s.id);S.current=null;tStop()}}
else if(a==='delsess'){if(!confirm('Supprimer cette séance ?'))return;S.sessions=S.sessions.filter(x=>x.id!==b.dataset.id)}
else if(a==='export'){(navigator.clipboard?navigator.clipboard.writeText(JSON.stringify(S,null,1)):Promise.reject()).then(()=>{S.lastBackup=Date.now();save();alert('Données copiées.')}).catch(()=>alert('Copie impossible sur ce navigateur.'));return}
else if(a==='file'){const u=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));const l=document.createElement('a');l.href=u;l.download='fluxe-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);S.lastBackup=Date.now();save();render();return}
else if(a==='imp'){$('#fi').click();return}
else if(a==='paste'){const t=prompt('Colle ici les données copiées avec « Copier le texte » :');if(t)imp(t);return}
save();render();
});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
render();
})();
