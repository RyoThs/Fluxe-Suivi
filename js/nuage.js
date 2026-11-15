/* Fluxe Suivi — Sauvegarde en ligne (facultative) : compte, envoi et réception des séances.
   Principe :
   - Le téléphone reste la référence : l'app marche exactement pareil sans compte et sans réseau.
   - Chaque séance TERMINÉE est envoyée en ligne (la séance en cours, jamais). Une séance modifiée est renvoyée
     (sa date de modification « mod » augmente) ; une séance supprimée laisse une marque « supprimée » en ligne,
     pour disparaître aussi des autres appareils (elle va alors dans leur corbeille, récupérable 30 jours).
   - Routines, salles, notes et temps de repos voyagent ensemble (« meta ») : la version la plus récente gagne.
   - Sans réseau, rien n'est perdu : l'envoi part tout seul quand la connexion revient.
   Le pont vers Firebase (../lib/nuage-firebase.js) n'est téléchargé que si un compte est utilisé.
   Ce que l'app retient du compte (identifiant, ce qui a déjà été envoyé) est rangé à part, sous « fluxe-suivi-nuage-v1 » :
   ce n'est jamais dans le fichier de sauvegarde. */
import {FIREBASE} from './nuage-config.js';
import {S,save,surSave} from './etat.js';
import {clean} from './donnees.js';
import {norm} from './outils.js';
import {demander,pastilles} from './dialogue.js';
import {snap} from './versions.js';
import {toTrash} from './sauvegarde.js';

const neuf=(u={})=>({uid:u.uid||null,email:u.email||'',envoye:{},metaMod:0,metaEnvoye:0,metaHash:'',dernier:0,dernierT:0});
function lireEtat(){try{const o=JSON.parse(localStorage.getItem('fluxe-suivi-nuage-v1'));if(o&&typeof o==='object'&&o.envoye&&typeof o.envoye==='object')return Object.assign(neuf(),o)}catch(e){}return neuf()}
function ecrireEtat(){try{localStorage.setItem('fluxe-suivi-nuage-v1',JSON.stringify(E))}catch(e){}}
let E=lireEtat(),api=null;

/* ===== État affiché (carte « Sauvegarde en ligne ») ===== */
export const etat={statut:E.uid?'ok':'off',msg:'',attente:0,occupe:false};
const ecouteurs=[];
export function surNuage(f){ecouteurs.push(f)}
function maj(o){Object.assign(etat,o);ecouteurs.forEach(f=>{try{f(o)}catch(e){}})}
export const disponible=()=>!!(FIREBASE||window.__fxNuageFaux);
export const connecte=()=>!!E.uid;
export const compte=()=>E.email||'';
export const dernierEnvoi=()=>E.dernier||0;

async function charger(){
  if(api)return api;
  if(window.__fxNuageFaux)api=window.__fxNuageFaux; /* tests automatiques : faux serveur */
  else{const m=await import('../lib/nuage-firebase.js');api=await m.creer(FIREBASE)}
  return api;
}

/* ===== Ce qu'il reste à envoyer ===== */
const modDe=s=>s.mod||s.date;
const META=['routines','notes','rests','gyms'],META_OPT=['rest','gym','nv','bkEvery'];
const metaDe=d=>{const o={};META.forEach(k=>o[k]=d[k]);META_OPT.forEach(k=>{if(d[k]!==undefined)o[k]=d[k]});return o};
function aEnvoyer(){
  const out=[],ici=new Set();
  for(const s of S.sessions){ici.add(s.id);if(s.id===S.current||s.edit)continue;if(E.envoye[s.id]!==modDe(s))out.push(s)}
  const suppr=Object.keys(E.envoye).filter(id=>!ici.has(id));
  const mh=JSON.stringify(metaDe(S));
  if(mh!==E.metaHash){E.metaHash=mh;E.metaMod=Date.now();ecrireEtat()}
  return {out,suppr,meta:E.metaMod>E.metaEnvoye};
}
export const enAttente=()=>{if(!E.uid)return 0;const a=aEnvoyer();return a.out.length+a.suppr.length+(a.meta?1:0)};

/* ===== Recevoir : ajoute ou met à jour ce qui vient des autres appareils ===== */
function fusionner(r){
  let chg=false;const sortir=new Set();
  const pos=new Map(S.sessions.map((s,i)=>[s.id,i]));
  for(const d of r.sessions){
    if(d.t>E.dernierT)E.dernierT=d.t;
    const i=pos.get(d.id),l=i===undefined?null:S.sessions[i];
    if(d.del){
      if(l&&l.id!==S.current&&!l.edit&&modDe(l)<=d.mod){toTrash({s:l});sortir.add(l.id);chg=true}
      delete E.envoye[d.id];continue;
    }
    let s=null;try{const c=clean({sessions:[JSON.parse(d.j)]});s=c&&c.sessions[0]}catch(e){}
    if(!s||s.id!==d.id)continue; /* donnée illisible : ignorée, rien n'est cassé ici */
    delete s.edit;
    if(!l){
      if(E.envoye[d.id]===d.mod)continue; /* supprimée sur ce téléphone, suppression pas encore envoyée */
      S.sessions.push(s);pos.set(s.id,S.sessions.length-1);E.envoye[d.id]=d.mod;chg=true;
    }
    else if(l.id===S.current||l.edit)continue; /* jamais toucher à la séance ouverte */
    else if(d.mod>modDe(l)){S.sessions[i]=s;E.envoye[d.id]=d.mod;chg=true}
    else if(d.mod===modDe(l))E.envoye[d.id]=d.mod;
  }
  if(sortir.size)S.sessions=S.sessions.filter(s=>!sortir.has(s.id));
  if(r.meta&&r.meta.mod>E.metaMod){
    let m=null;try{const p=JSON.parse(r.meta.j);m=p&&typeof p==='object'?clean(Object.assign({},p,{sessions:[]})):null}catch(e){}
    if(m){
      META.forEach(k=>{S[k]=m[k]});
      META_OPT.forEach(k=>{if(m[k]!==undefined)S[k]=m[k];else delete S[k]});
      E.metaMod=E.metaEnvoye=r.meta.mod;E.metaHash=JSON.stringify(metaDe(S));chg=true;
    }
  }
  if(chg)S.sessions.sort((a,b)=>a.date-b.date);
  return chg;
}

/* ===== Un tour de synchronisation : recevoir, puis envoyer ===== */
const horsLigne=e=>!navigator.onLine||(e&&(e.code==='unavailable'||e.code==='auth/network-request-failed'||/network|fetch|offline/i.test(String(e.message||''))));
let enCours=null,encore=false;
export function synchro(){
  if(!E.uid)return Promise.resolve();
  if(enCours){encore=true;return enCours}
  enCours=(async()=>{try{do{encore=false;await tour()}while(encore)}finally{enCours=null}})();
  return enCours;
}
async function tour(){
  if(!navigator.onLine){maj({statut:'horsligne',attente:enAttente()});return}
  maj({statut:'envoi'});
  try{
    await charger();
    const uid=E.uid,r=await api.lire(uid,E.dernierT);
    if(E.uid!==uid)return; /* déconnecté pendant l'envoi */
    const chg=fusionner(r);
    const a=aEnvoyer();
    if(a.out.length||a.suppr.length||a.meta){
      const metaMod=E.metaMod,now=Date.now();
      await api.ecrire(uid,{
        sessions:a.out.map(s=>({id:s.id,mod:modDe(s),j:JSON.stringify(s)})),
        suppr:a.suppr.map(id=>({id,mod:now})),
        meta:a.meta?{mod:metaMod,j:JSON.stringify(metaDe(S))}:null});
      if(E.uid!==uid)return;
      a.out.forEach(s=>{E.envoye[s.id]=modDe(s)});a.suppr.forEach(id=>{delete E.envoye[id]});
      if(a.meta)E.metaEnvoye=metaMod;
    }
    E.dernier=Date.now();ecrireEtat();
    if(chg)save();
    maj({statut:'ok',msg:'',attente:enAttente(),recu:chg});
  }catch(e){
    if(horsLigne(e))maj({statut:'horsligne',attente:enAttente()});
    else maj({statut:'erreur',msg:texteErreur(e)});
  }
}

/* ===== Compte ===== */
export function texteErreur(e){
  const c=e&&e.code||'';
  return ({
    'auth/email-already-in-use':'Cet e-mail a déjà un compte : touche « J’ai déjà un compte ».',
    'auth/invalid-credential':'E-mail ou mot de passe incorrect.',
    'auth/wrong-password':'E-mail ou mot de passe incorrect.',
    'auth/user-not-found':'E-mail ou mot de passe incorrect.',
    'auth/invalid-email':'Adresse e-mail invalide.',
    'auth/missing-email':'Écris ton adresse e-mail.',
    'auth/weak-password':'Mot de passe trop court (8 caractères minimum).',
    'auth/too-many-requests':'Trop d’essais : réessaie dans quelques minutes.',
    'auth/network-request-failed':'Pas de réseau : réessaie quand tu es connecté.',
    'auth/requires-recent-login':'Par sécurité, reconnecte-toi puis recommence.',
    'permission-denied':'Le serveur a refusé l’accès. Déconnecte-toi puis reconnecte-toi.',
  })[c]||('Erreur inattendue'+(c?' ('+c+')':'')+'. Réessaie plus tard.');
}
const verifier=(email,mdp)=>{
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw {code:'auth/invalid-email'};
  if(mdp!==undefined&&String(mdp).length<8)throw {code:'auth/weak-password'};
};
async function occupe(f){
  if(etat.occupe)return false;
  maj({occupe:true,msg:''});
  try{return await f()}
  catch(e){maj({msg:texteErreur(e)});return false}
  finally{maj({occupe:false})}
}
export const inscrire=(email,mdp)=>occupe(async()=>{verifier(email,mdp);await charger();return brancher(await api.inscrire(email,mdp))});
export const connecter=(email,mdp)=>occupe(async()=>{verifier(email,mdp);await charger();return brancher(await api.connecter(email,mdp))});
export const oublie=email=>occupe(async()=>{verifier(email);await charger();await api.oublie(email);return true});

/* Première connexion sur ce téléphone : on réunit (ou non) les séances d'ici et celles du compte */
async function brancher(u){
  const r=await api.lire(u.uid,0);
  const enLigne=r.sessions.filter(d=>!d.del).length,ici=S.sessions.filter(s=>s.id!==S.current).length;
  let choix='ok';
  if(enLigne&&ici){
    choix=await demander({icone:'fichier',ton:'bleu',titre:'Séances ici et en ligne',texte:'Tu as déjà des séances sur ce téléphone et dans ton compte.',
      corps:pastilles([ici+' séance'+(ici>1?'s':'')+' ici',enLigne+' en ligne'])+'<p style="margin-top:10px">Une version de secours de ce téléphone est créée juste avant, au cas où.</p>',
      ok:'Tout réunir (rien n’est effacé)',non:'Garder seulement celles en ligne',lien:'Annuler'});
    if(choix!=='ok'&&choix!=='non'){try{await api.deconnecter()}catch(e){}return false}
  }
  if(ici)await snap('nuage');
  const avant={routines:S.routines.slice(),gyms:S.gyms.slice()};
  E=neuf(u);
  if(choix==='non')S.sessions=S.sessions.filter(s=>s.id===S.current);
  fusionner(r);
  if(choix==='ok'){ /* réunir aussi les routines et les salles de ce téléphone */
    for(const x of avant.routines)if(!S.routines.some(y=>norm(y.name)===norm(x.name)))S.routines.push(x);
    for(const g of avant.gyms)if(!S.gyms.some(y=>y.id===g.id)&&S.gyms.length<20)S.gyms.push(g);
  }
  ecrireEtat();save();
  maj({statut:'envoi',msg:'',recu:true});
  await synchro();
  return true;
}
export async function deconnecter(){
  try{await charger();await api.deconnecter()}catch(e){}
  const em=E.email;E=neuf();E.email=em;ecrireEtat();
  maj({statut:'off',msg:'',attente:0});
}
export const supprimerCompte=mdp=>occupe(async()=>{
  await charger();await api.supprimerCompte(mdp);
  E=neuf();ecrireEtat();maj({statut:'off',msg:'',attente:0});return true;
});

/* ===== Quand synchroniser ===== */
let minuteur=0,dernierRegard=0;
surSave(()=>{if(!E.uid)return;clearTimeout(minuteur);minuteur=setTimeout(()=>{if(enAttente())synchro()},2500)});
window.addEventListener('online',()=>{if(E.uid)synchro()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&E.uid&&Date.now()-dernierRegard>30000){dernierRegard=Date.now();synchro()}});
/* au démarrage : vérifier que la connexion tient toujours, puis synchroniser */
export async function demarrerNuage(){
  if(!E.uid||!disponible())return;
  if(!navigator.onLine){maj({statut:'horsligne',attente:enAttente()});return}
  try{
    await charger();const u=await api.pret();
    if(!u||u.uid!==E.uid){const em=E.email;E=neuf();E.email=em;ecrireEtat();maj({statut:'off',msg:'Ta connexion a expiré : reconnecte-toi.'});return}
    dernierRegard=Date.now();await synchro();
  }catch(e){maj(horsLigne(e)?{statut:'horsligne',attente:enAttente()}:{statut:'erreur',msg:texteErreur(e)})}
}
