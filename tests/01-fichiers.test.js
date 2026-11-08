/* Vérifications sans navigateur : les fichiers sont cohérents entre eux.
   C'est ce qui évite le problème de la v2.1.1 (iPhone bloqué sur une ancienne version). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { lire, RACINE } = require('./outils');

const app = lire('app.js'), html = lire('index.html'), sw = lire('sw.js');
const VER = (app.match(/VER='([\d.]+)'/) || [])[1];

test('app.js se lit sans erreur de syntaxe', () => {
  assert.doesNotThrow(() => new Function(app));
});

test('la clé de stockage est toujours « muscu-v1 » (sinon toutes les séances disparaissent)', () => {
  assert.match(app, /const KEY='muscu-v1'/);
});

test('le même numéro de version partout (app.js, index.html, sw.js)', () => {
  assert.ok(VER, 'numéro de version introuvable dans app.js');
  assert.equal((html.match(/name="app-version" content="([^"]+)"/) || [])[1], VER, 'balise app-version de index.html');
  assert.equal((html.match(/src="app\.js\?v=([^"]+)"/) || [])[1], VER, 'lien vers app.js dans index.html');
  assert.equal((sw.match(/'app\.js\?v=([^']+)'/) || [])[1], VER, 'app.js dans la liste du service worker');
});

test('le cache du service worker garde son préfixe « fluxe-suivi- »', () => {
  assert.match(sw, /const PREFIXE = 'fluxe-suivi-'/);
  assert.match(sw, /const VERSION = PREFIXE \+ 'v\d+'/);
});

test('tous les fichiers mis en cache hors ligne existent', () => {
  const liste = sw.match(/const FICHIERS = \[([\s\S]*?)\]/)[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));
  for (const f of liste) {
    const p = f === './' ? 'index.html' : f.split('?')[0];
    assert.ok(fs.existsSync(path.join(RACINE, p)), `fichier manquant : ${f}`);
  }
});

test('index.html ne contient aucun script intégré (bloqué par la sécurité de la page)', () => {
  const scripts = html.match(/<script\b[^>]*>/g) || [];
  for (const s of scripts) assert.match(s, /\bsrc=/, `script sans src : ${s}`);
});

test('manifest.json est un JSON valide avec ses icônes', () => {
  const m = JSON.parse(lire('manifest.json'));
  assert.ok(m.name && Array.isArray(m.icons) && m.icons.length);
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(RACINE, i.src)), `icône manquante : ${i.src}`);
});
