/* Fluxe Suivi — Sauvegarde en ligne : messages d'erreur du compte, en clair. */

/** Le message à afficher pour une erreur Firebase (code « auth/… ») ou de l'app. */
export function texteErreur(e) {
  const c = (e && e.code) || '';
  return (
    {
      'auth/email-already-in-use': 'Cet e-mail a déjà un compte : touche « J’ai déjà un compte ».',
      'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
      'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
      'auth/user-not-found': 'E-mail ou mot de passe incorrect.',
      'auth/invalid-email': 'Adresse e-mail invalide.',
      'auth/missing-email': 'Écris ton adresse e-mail.',
      'auth/weak-password': 'Mot de passe trop court (8 caractères minimum).',
      'auth/too-many-requests': 'Trop d’essais : réessaie dans quelques minutes.',
      'auth/network-request-failed': 'Pas de réseau : réessaie quand tu es connecté.',
      'auth/requires-recent-login': 'Par sécurité, reconnecte-toi puis recommence.',
      'renvoi-trop-tot':
        'Un e-mail vient déjà de partir : attends une minute avant d’en redemander un (et regarde dans les spams).',
      'permission-denied': 'Le serveur a refusé l’accès. Déconnecte-toi puis reconnecte-toi.',
    }[c] || 'Erreur inattendue' + (c ? ' (' + c + ')' : '') + '. Réessaie plus tard.'
  );
}
