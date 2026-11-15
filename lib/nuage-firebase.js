/* Fluxe Suivi — Pont vers Firebase (chargé seulement quand un compte « Sauvegarde en ligne » est utilisé).
   Rangement en ligne, pour chaque compte :
     users/{uid}/s/{id de séance} = { j: la séance en texte, mod: date de modification, t: heure du serveur }
                                    ou { del: true, mod, t } quand la séance a été supprimée
     users/{uid}/m/etat           = { j: routines, salles, notes, temps de repos… en texte, mod, t }
   Le texte (j) est relu et vérifié par l'app (clean) avant d'être utilisé.
   Les règles de sécurité (firestore.rules) font que chacun ne peut lire et écrire QUE ses propres données. */
import {initializeApp} from './firebase-13.1.0/firebase-app.js';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,onAuthStateChanged,EmailAuthProvider,reauthenticateWithCredential,deleteUser,sendEmailVerification,reload} from './firebase-13.1.0/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocs,query,where,writeBatch,serverTimestamp,Timestamp} from './firebase-13.1.0/firebase-firestore-lite.js';

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
