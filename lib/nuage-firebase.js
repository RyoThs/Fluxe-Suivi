/* Fluxe Suivi — Pont vers Firebase (chargé seulement quand un compte « Sauvegarde en ligne » est utilisé).
   Rangement en ligne, pour chaque compte :
     users/{uid}/s/{id de séance} = { j: la séance en texte, mod: date de modification, t: heure du serveur }
                                    ou { del: true, mod, t } quand la séance a été supprimée
     users/{uid}/m/etat           = { j: routines, salles, notes, temps de repos… en texte, mod, t }
   Le texte (j) est relu et vérifié par l'app (clean) avant d'être utilisé.
   Catalogue partagé par club (v3.8) :
     clubs/{id auto}            = { n: nom, e: enseigne, v: ville, u: créateur, t }
     clubs/{club}/avis/{id}     = { m: machine, k: genre, u: compte, t, g?: muscle, b?: marque }  (id = idAvis(machine, uid))
     Lecture : tout le monde (club-reseau.js, sans compte). Écriture : compte vérifié, seulement ses propres avis.
   Les règles de sécurité (firestore.rules) font que chacun ne peut lire et écrire QUE ses propres données. */
import {initializeApp} from './firebase-13.1.0/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,onAuthStateChanged,EmailAuthProvider,reauthenticateWithCredential,deleteUser,sendEmailVerification,reload} from './firebase-13.1.0/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,query,where,writeBatch,serverTimestamp,Timestamp,addDoc,setDoc,limit,increment} from './firebase-13.1.0/firebase-firestore-lite.js';

export async function creer(cfg){
  const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
  auth.languageCode='fr'; /* e-mails (mot de passe oublié) en français */
  const pret=new Promise(ok=>{const stop=onAuthStateChanged(auth,u=>{stop();ok(u)})});
  const U=u=>u?{uid:u.uid,email:u.email,verifie:u.emailVerified===true}:null;
  const seances=uid=>collection(db,'users',uid,'s');
  const etat=uid=>doc(db,'users',uid,'m','etat');
  /* écrit par paquets de 400 (Firestore en accepte 500 par envoi) */
  async function parPaquets(ops){for(let i=0;i<ops.length;i+=400){const b=writeBatch(db);ops.slice(i,i+400).forEach(f=>f(b));await b.commit()}}
  return {
    async pret(){return U(await pret)},
    async inscrire(e,m){const u=(await createUserWithEmailAndPassword(auth,e,m)).user;try{await sendEmailVerification(u)}catch(x){}return U(u)},
    /* e-mail « Vérifie ton adresse » (renvoi à la demande) */
    async renvoyer(){if(auth.currentUser)await sendEmailVerification(auth.currentUser)},
    /* relit le compte auprès de Google (pour savoir si l'adresse a été vérifiée entre-temps) */
    async recharger(){const u=auth.currentUser;if(!u)return null;await reload(u);return U(auth.currentUser)},
    async connecter(e,m){return U((await signInWithEmailAndPassword(auth,e,m)).user)},
    deconnecter:()=>signOut(auth),
    oublie:e=>sendPasswordResetEmail(auth,e),
    /* depuis = heure serveur (ms) de la dernière lecture : on ne relit que ce qui a changé depuis */
    async lire(uid,depuis){
      const q=depuis?query(seances(uid),where('t','>',Timestamp.fromMillis(depuis))):seances(uid);
      const r=await getDocs(q),m=await getDoc(etat(uid));
      const sessions=r.docs.map(d=>{const x=d.data();return{id:d.id,mod:+x.mod||0,del:x.del===true,j:typeof x.j==='string'?x.j:'',t:x.t&&x.t.toMillis?x.t.toMillis():0}});
      const md=m.exists()?m.data():null;
      return {sessions,meta:md&&typeof md.j==='string'?{mod:+md.mod||0,j:md.j}:null};
    },
    async ecrire(uid,{sessions,suppr,meta}){
      const ops=[];
      sessions.forEach(s=>ops.push(b=>b.set(doc(seances(uid),s.id),{j:s.j,mod:s.mod,t:serverTimestamp()})));
      suppr.forEach(s=>ops.push(b=>b.set(doc(seances(uid),s.id),{del:true,mod:s.mod,t:serverTimestamp()})));
      if(meta)ops.push(b=>b.set(etat(uid),{j:meta.j,mod:meta.mod,t:serverTimestamp()}));
      await parPaquets(ops);
    },
    /* rapport d'erreurs : erreurs/{id automatique} = {uid, titre, msg, ou, ver, app, n, quand, t} (lecture : console seulement) */
    async signaler(uid,d){
      const c=(v,n)=>String(v==null?'':v).slice(0,n);
      await addDoc(collection(db,'erreurs'),{uid,titre:c(d.titre,120),msg:c(d.msg,300),ou:c(d.ou,120),ver:c(d.ver,20),app:c(d.app,60),n:Math.min(9999,Math.max(1,Math.round(+d.n||1))),quand:+d.quand||0,t:serverTimestamp()});
    },
    /* catalogue partagé : créer un club, donner son avis (un par machine : le nouveau remplace l'ancien) */
    async creerClub(uid,d){return (await addDoc(collection(db,'clubs'),{n:d.n,e:d.e,v:d.v,u:uid,t:Date.now()})).id},
    async ecrireAvis(uid,club,id,a){const o={m:a.m,k:a.k,u:uid,t:Date.now()};if(a.g)o.g=a.g;if(a.b)o.b=a.b;await setDoc(doc(db,'clubs',club,'avis',id),o)},
    /* compteur anonyme (v3.15) : le compte du créateur a une fiche admins/{uid} (créée à la main dans la console) */
    async estAdmin(uid){return (await getDoc(doc(db,'admins',uid))).exists()},
    async lireCompteur(semaines){return Promise.all(semaines.map(async k=>{const d=await getDoc(doc(db,'compteur',k));return {semaine:k,...(d.exists()?d.data():{})}}))},
    /* supprime toutes les données en ligne puis le compte (le mot de passe est redemandé : sécurité Firebase) */
    async supprimerCompte(mdp){
      const u=auth.currentUser;if(!u)throw {code:'auth/no-current-user'};
      await reauthenticateWithCredential(u,EmailAuthProvider.credential(u.email,mdp));
      const r=await getDocs(seances(u.uid));
      await parPaquets([...r.docs.map(d=>b=>b.delete(d.ref)),b=>b.delete(etat(u.uid))]);
      await deleteUser(u);
    },
  };
}

/* Catalogue partagé (v3.8) : lecture publique (sans compte) d'une collection, ex. 'clubs' ou 'clubs/abc/avis'.
   Une application Firebase à part, sans connexion : elle ne lit que ce que les règles autorisent à tous.
   Pour économiser le quota gratuit (forfait Spark) : filtre facultatif [champ, valeur], ex. ['e', 'basic-fit']. */
let publique=null;
export async function lirePublic(cfg,chemin,filtre){
  if(!publique)publique=getFirestore(initializeApp(cfg,'lecture-publique'));
  const c=collection(publique,...chemin.split('/'));
  const r=await getDocs(filtre?query(c,where(filtre[0],'==',filtre[1]),limit(500)):query(c,limit(3000)));
  return r.docs.map(d=>({id:d.id,data:d.data()}));
}

/* Compteur anonyme (v3.15) : compteur/{lundi de la semaine} = { ios, android, autre }. Sans compte : « +1 » seulement
   (les règles refusent tout le reste). Aucun numéro ni information sur la personne. */
export async function compter(cfg,semaine,plat){
  if(!publique)publique=getFirestore(initializeApp(cfg,'lecture-publique'));
  await setDoc(doc(publique,'compteur',semaine),{[plat]:increment(1)},{merge:true});
}
