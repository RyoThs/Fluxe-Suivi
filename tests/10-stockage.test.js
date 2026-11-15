/* Inventaire du stockage : chaque clé utilisée par le code est listée dans docs/STOCKAGE.md
   et porte un préfixe de Fluxe Suivi (pour ne jamais écraser les données d'une autre app du même domaine). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { lire, RACINE, KEY } = require('./outils');

const PREFIXES = ['muscu-v1', 'fx-', 'fluxe-suivi-'];
const inventaire = lire('docs/STOCKAGE.md');
const dansInventaire = cle => inventaire.includes('`' + cle + '`');
const bonPrefixe = cle => PREFIXES.some(p => cle.startsWith(p));

/* Tous les fichiers de code à lire : js/ (avec ses sous-dossiers) et app.js */
const codes = (dir = 'js') => fs.readdirSync(path.join(RACINE, dir), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? codes(dir + '/' + e.name) : e.name.endsWith('.js') ? [dir + '/' + e.name] : []);
const FICHIERS_CODE = [...codes(), 'app.js'];

/* Transforme l'argument d'un appel (ex. 'fx-no', KEY, KEY+'-brut', k) en noms de clés.
   Une variable (k) est retrouvée dans la boucle « for (const k of [...]) » du même fichier. */
function resoudre(arg, texte) {
  arg = arg.trim();
  let m;
  if ((m = arg.match(/^'([^']*)'$/) || arg.match(/^"([^"]*)"$/))) return [m[1]];
  if (arg === 'KEY') return [KEY];
  if ((m = arg.match(/^KEY\s*\+\s*'([^']*)'$/))) return [KEY + m[1]];
  if (/^[A-Za-z_$][\w$]*$/.test(arg)) {
    const boucle = texte.match(new RegExp(`for\\s*\\(\\s*(?:const|let|var)\\s+${arg.replace(/\$/g, '\\$')}\\s+of\\s+\\[([^\\]]*)\\]`));
    if (boucle) return boucle[1].split(',').flatMap(a => resoudre(a, texte));
  }
  return [null]; // impossible à lire : le test le signalera
}

/* Toutes les clés utilisées : { type, cle, fichier } */
function clesUtilisees() {
  const res = [];
  for (const f of FICHIERS_CODE) {
    const t = lire(f);
    for (const m of t.matchAll(/\b(localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*([^,)]+)/g))
      for (const cle of resoudre(m[2], t)) res.push({ type: m[1], cle, brut: m[2], fichier: f });
    for (const m of t.matchAll(/\bindexedDB\.open\(\s*([^,)]+)/g))
      for (const cle of resoudre(m[1], t)) res.push({ type: 'IndexedDB', cle, brut: m[1], fichier: f });
  }
  return res;
}

test('le code lit bien les clés connues (le test lui-même fonctionne)', () => {
  const cles = clesUtilisees().map(c => c.cle);
  for (const attendu of [KEY, KEY + '-brut', KEY + '-sauvegarde', 'fx-heal', 'fluxe-suivi-secours']) assert.ok(cles.includes(attendu), attendu);
});

test('chaque clé de stockage du code est dans docs/STOCKAGE.md, avec un préfixe de Fluxe Suivi', () => {
  for (const { type, cle, brut, fichier } of clesUtilisees()) {
    assert.ok(cle !== null, `${fichier} : clé ${type} illisible pour le test (${brut}). Écris-la en clair ou dans une boucle « for (const k of [...]) ».`);
    assert.ok(bonPrefixe(cle), `${fichier} : la clé ${type} « ${cle} » doit commencer par ${PREFIXES.join(', ')}`);
    assert.ok(dansInventaire(cle), `${fichier} : la clé ${type} « ${cle} » manque dans docs/STOCKAGE.md`);
  }
});

test('le stockage est toujours lu par getItem/setItem (jamais localStorage[...] ni localStorage.nom)', () => {
  for (const f of FICHIERS_CODE) {
    const t = lire(f);
    assert.doesNotMatch(t, /\b(localStorage|sessionStorage)\s*\[/, `${f} : accès par crochets`);
    for (const m of t.matchAll(/\b(?:localStorage|sessionStorage)\.(\w+)/g))
      assert.ok(['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length'].includes(m[1]), `${f} : accès direct « ${m[0]} »`);
  }
});

test('la lecture des clés reconnaît une clé écrite dans une boucle, et refuse une clé sans préfixe', () => {
  const t = "for(const k of [KEY+'-a','fx-b']){localStorage.getItem(k)}";
  assert.deepEqual(resoudre('k', t), [KEY + '-a', 'fx-b']);
  assert.deepEqual(resoudre('inconnu', t), [null]);
  assert.equal(bonPrefixe('fluxe_user_v1'), false, 'clé de Fluxe App');
  assert.equal(bonPrefixe('muscu-v1-brut'), true);
});
