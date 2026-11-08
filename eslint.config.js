/* Vérificateur de code (eslint) : utilisé par les tests automatiques.
   Il attrape surtout deux erreurs typiques d'un code découpé en plusieurs fichiers :
   - une variable utilisée sans être importée (no-undef),
   - une variable d'un autre fichier modifiée directement (no-import-assign). */
const NAVIGATEUR = ['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'history', 'location',
  'alert', 'confirm', 'prompt', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'indexedDB',
  'URL', 'Blob', 'File', 'FileReader', 'caches', 'console', 'requestAnimationFrame'];

module.exports = [
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: Object.fromEntries(NAVIGATEUR.map(g => [g, 'readonly'])) },
    rules: {
      'no-undef': 'error',
      'no-import-assign': 'error',
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
];
