/* Fluxe Suivi — Configuration du projet Firebase (Sauvegarde en ligne).
   Ces valeurs viennent de la console Firebase (Paramètres du projet > Vos applications > Application Web).
   Ce ne sont PAS des secrets : elles disent seulement à quel projet parler, et sont visibles par tous les utilisateurs
   de l'app, comme sur tous les sites qui utilisent Firebase. La sécurité vient des règles (firestore.rules).
   Tant que FIREBASE vaut null, la carte « Sauvegarde en ligne » n'apparaît pas et l'app marche comme avant. */
export const FIREBASE={
  apiKey:'AIzaSyDh1HUkEFdIUb7iXzP0kUjFWgUJH5SRNJE',
  authDomain:'fluxe-suivi.firebaseapp.com',
  projectId:'fluxe-suivi',
  storageBucket:'fluxe-suivi.firebasestorage.app',
  messagingSenderId:'9442906749',
  appId:'1:9442906749:web:4bfc27c89045e48a949714',
};
