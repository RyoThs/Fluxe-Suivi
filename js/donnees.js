/* Fluxe Suivi — Lecture et nettoyage des données (téléphone ET fichiers importés) : seul ce qui est valide est gardé. */
import {BKD,J30,KEY} from './config.js';
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
export function clean(d){
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
if(BKD.includes(d.bkEvery))o.bkEvery=d.bkEvery;
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
export function unwrap(p){return p&&typeof p==='object'&&p.app==='fluxe-suivi'&&p.data&&typeof p.data==='object'?p.data:p}
export function purge(d){const n=Date.now();d.trash=d.trash.filter(t=>n-t.at<J30);return d}
export function load(){
let raw=null;try{raw=localStorage.getItem(KEY)}catch(e){}
try{const p=JSON.parse(raw),d=clean(p);if(d){if(p.sessions.length!==d.sessions.length)try{localStorage.setItem(KEY+'-brut',raw)}catch(e){}return purge(d)}}catch(e){}
/* Données présentes mais illisibles : on en garde une copie AVANT que le premier enregistrement ne les écrase */
if(raw){load.bad=raw;try{localStorage.setItem(KEY+'-illisible',raw)}catch(e){}}
return{sessions:[],routines:[],current:null,notes:{},rests:{},trash:[],gyms:[]};
}
