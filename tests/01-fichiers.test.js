/* Vérifications sans navigateur : les fichiers sont cohérents entre eux.
   - mêmes numéros de version partout (évite le problème de la v2.1.1 sur iPhone),
   - chaque morceau du code (dossier js/) existe, est utilisé, et est disponible hors ligne,
   - le vérificateur eslint ne trouve aucune erreur. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { lire, RACINE } = require('./outils');

const html = lire('index.html'), sw = lire('sw.js'), config = lire('js/config.js');
const VER = (config.match(/VER='([\d.]+)'/) || [])[1];
const FICHIERS = sw.match(/const FICHIERS = \[([\s\S]*?)\];/)[1].match(/'([^']+)'/g).map(s => s.slice(1, -1));

/* Tous les fichiers .js du dossier js/ */
const tousLesModules = (dir = 'js') => fs.readdirSync(path.join(RACINE, dir), { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? tousLesModules(dir + '/' + e.name) : e.name.endsWith('.js') ? [dir + '/' + e.name] : []);
/* Liens « import … from './x.js' » d'un fichier, transformés en chemins depuis la racine */
const importsDe = f => [...lire(f).matchAll(/^import\s+(?:[^'"]*?from\s+)?'([^']+)'/gm)].map(m => path.posix.join(path.posix.dirname(f), m[1]));

test('la clé de stockage est toujours « muscu-v1 » (sinon toutes les séances disparaissent)', () => {
  assert.match(config, /const KEY='muscu-v1'/);
});

test('le même numéro de version partout (config.js, index.html, sw.js)', () => {
  assert.ok(VER, 'numéro de version introuvable dans js/config.js');
  assert.equal((html.match(/name="app-version" content="([^"]+)"/) || [])[1], VER, 'balise app-version de index.html');
  assert.equal((html.match(/src="js\/main\.js\?v=([^"]+)"/) || [])[1], VER, 'lien vers js/main.js dans index.html');
  assert.equal((html.match(/href="css\/app\.css\?v=([^"]+)"/) || [])[1], VER, 'lien vers css/app.css dans index.html');
  assert.ok(FICHIERS.includes('js/main.js?v=' + VER), 'js/main.js dans la liste du service worker');
  assert.ok(FICHIERS.includes('css/app.css?v=' + VER), 'css/app.css dans la liste du service worker');
});

test('index.html charge le code comme module, et aucun script intégré (bloqué par la sécurité de la page)', () => {
  const scripts = html.match(/<script\b[^>]*>/g) || [];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0], /type="module" src="js\/main\.js/);
  assert.doesNotMatch(html, /<style>/, 'les styles sont dans css/app.css');
});

test('chaque lien entre fichiers du code mène à un fichier qui existe', () => {
  for (const f of tousLesModules()) for (const cible of importsDe(f))
    assert.ok(fs.existsSync(path.join(RACINE, cible)), `${f} importe ${cible}, introuvable`);
});

test('chaque fichier du code est utilisé (rien d’oublié), et personne n’importe main.js', () => {
  const vus = new Set(), aVoir = ['js/main.js'];
  while (aVoir.length) { const f = aVoir.pop(); if (vus.has(f)) continue; vus.add(f); aVoir.push(...importsDe(f)); }
  assert.deepEqual([...vus].sort(), tousLesModules().sort());
  for (const f of tousLesModules()) assert.ok(!importsDe(f).includes('js/main.js'), `${f} importe main.js`);
});

test('chaque fichier du code est disponible hors ligne (liste du service worker)', () => {
  for (const f of tousLesModules()) if (f !== 'js/main.js') assert.ok(FICHIERS.includes(f), `${f} manque dans FICHIERS de sw.js`);
  for (const f of FICHIERS) {
    const p = f === './' ? 'index.html' : f.split('?')[0];
    assert.ok(fs.existsSync(path.join(RACINE, p)), `fichier manquant : ${f}`);
  }
});

test('le cache du service worker garde son préfixe « fluxe-suivi- »', () => {
  assert.match(sw, /const PREFIXE = 'fluxe-suivi-'/);
  assert.match(sw, /const VERSION = PREFIXE \+ 'v\d+'/);
});

test('le vérificateur eslint ne trouve aucune erreur dans js/', async () => {
  const { ESLint } = require('eslint');
  const res = await new ESLint({ cwd: RACINE }).lintFiles(['js/**/*.js']);
  const erreurs = res.flatMap(r => r.messages.map(m => `${path.relative(RACINE, r.filePath)}:${m.line} ${m.message}`));
  assert.deepEqual(erreurs, []);
});

test('l’ancien app.js reste présent pour réparer les vieilles pages', () => {
  assert.match(lire('app.js'), /fx-heal/);
});

test('manifest.json est un JSON valide avec ses icônes', () => {
  const m = JSON.parse(lire('manifest.json'));
  assert.ok(m.name && Array.isArray(m.icons) && m.icons.length);
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(RACINE, i.src)), `icône manquante : ${i.src}`);
});
