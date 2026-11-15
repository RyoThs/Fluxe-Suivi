/* Fluxe Suivi — Gestes : Sauvegarde en ligne (créer un compte, se connecter, mot de passe oublié, déconnexion, suppression).
   Chaque geste reçoit le bouton touché (b). Il s'occupe lui-même de redessiner l'écran. */
import {$} from '../outils.js';
import {toast} from '../etat.js';
import {avertir,confirmer,saisir} from '../dialogue.js';
import {sheet} from '../vues/panneaux.js';
import {setEmail,setMode} from '../vues/nuage.js';
import {compte,connecter,deconnecter,etat,inscrire,oublie,supprimerCompte,synchro} from '../nuage.js';
const valeur=id=>{const e=$(id);return e?e.value.trim():''};
export const gestes={
nmode:({b})=>{setEmail(valeur('#nm'));setMode(b.dataset.v);etat.msg='';sheet()},
nok:({b})=>{const em=valeur('#nm'),mdp=$('#np')?$('#np').value:'',creer=!!document.querySelector('[data-act=nmode][data-v=creer].on');setEmail(em);
 (creer?inscrire(em,mdp):connecter(em,mdp)).then(ok=>{if(ok)toast(creer?'Compte créé : tes séances partent en ligne ✓':'Connecté ✓')})},
noubli:()=>{const em=valeur('#nm');setEmail(em);oublie(em).then(ok=>{if(ok)avertir({icone:'fichier',ton:'bleu',titre:'E-mail envoyé',texte:'Ouvre l’e-mail reçu à '+em+' pour choisir un nouveau mot de passe, puis reviens ici te connecter.'})})},
nsync:()=>{synchro()},
nsortir:()=>{confirmer({icone:'retour',ton:'bleu',titre:'Se déconnecter ?',texte:'Tes séances restent sur ce téléphone et en ligne. Les prochaines ne seront plus envoyées tant que tu ne te reconnectes pas.',ok:'Me déconnecter',non:'Rester connecté'}).then(ok=>{if(!ok)return;deconnecter().then(()=>toast('Déconnecté'))})},
nsuppr:()=>{const em=compte();
 confirmer({icone:'corbeille',ton:'rouge',danger:1,titre:'Supprimer ton compte ?',texte:'Ton compte '+em+' et toutes tes séances en ligne seront effacés définitivement. Celles de ce téléphone sont gardées.',ok:'Continuer',non:'Garder mon compte'})
 .then(ok=>ok&&saisir({icone:'corbeille',ton:'rouge',titre:'Confirme avec ton mot de passe',texte:'C’est une sécurité demandée pour toute suppression de compte.',label:'Mot de passe',mdp:true,ok:'Supprimer définitivement',non:'Annuler',max:100}))
 .then(mdp=>{if(!mdp)return;return supprimerCompte(mdp).then(ok=>{if(ok)toast('Compte et données en ligne supprimés');else if(etat.msg)avertir({icone:'alerte',ton:'ambre',titre:'Suppression impossible',texte:etat.msg})})})},
};
