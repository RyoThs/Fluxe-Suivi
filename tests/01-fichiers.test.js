/* Vérifications sans navigateur : les fichiers sont cohérents entre eux.
   - mêmes numéros de version partout (évite le problème de la v2.1.1 sur iPhone),
   - chaque morceau du code (dossier js/) existe, est utilisé, et est disponible hors ligne,
   - le vérificateur eslint ne trouve aucune erreur. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { lire, listeFichiersSW, RACINE } = require('./outils');

const html = lire('index.html'), sw = lire('sw.js'), config = lire('js/config.js');
const VER = (config.match(/VER='([\d.]+)'/) || [])[1];
const FICHIERS = listeFichiersSW(sw);

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

/* ===== Police hébergée dans l'app (v2.4.2) : plus aucun appel à Google Fonts ===== */
/* Tous les fichiers du projet, sauf les tests, les outils installés et l'historique Git */
const EXCLUS = new Set(['tests', 'node_modules', '.git', 'test-results']);
const fichiersDuProjet = (dir = '') => fs.readdirSync(path.join(RACINE, dir), { withFileTypes: true })
  .flatMap(e => EXCLUS.has(e.name) && !dir ? [] : e.isDirectory() ? fichiersDuProjet(path.posix.join(dir, e.name)) : [path.posix.join(dir, e.name)]);
const POLICES = fs.readdirSync(path.join(RACINE, 'fonts')).filter(f => f.endsWith('.woff2')).map(f => 'fonts/' + f);

test('aucun fichier du projet ne contacte Google Fonts (« googleapis », « gstatic »)', () => {
  for (const f of fichiersDuProjet()) {
    const contenu = fs.readFileSync(path.join(RACINE, f), 'latin1');
    assert.ok(!contenu.includes('googleapis'), `${f} contient « googleapis »`);
    assert.ok(!contenu.includes('gstatic'), `${f} contient « gstatic »`);
  }
});

test('la police Barlow Condensed est dans fonts/, disponible hors ligne, avec sa licence', () => {
  assert.deepEqual(POLICES.sort(), [500, 600, 700, 800].map(w => `fonts/barlow-condensed-${w}.woff2`));
  for (const f of POLICES) {
    assert.ok(fs.statSync(path.join(RACINE, f)).size > 1000, `${f} est vide`);
    assert.ok(FICHIERS.includes(f), `${f} manque dans FICHIERS de sw.js`);
  }
  assert.ok(fs.existsSync(path.join(RACINE, 'fonts/OFL.txt')), 'fonts/OFL.txt (licence) manquant');
  assert.match(lire('fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
});

test('css/app.css déclare chaque police locale (font-display: swap) et garde une police de repli', () => {
  const css = lire('css/app.css');
  for (const f of POLICES) assert.ok(css.includes(`url(../${f})`), `${f} non déclarée dans css/app.css`);
  const faces = css.match(/@font-face\{[^}]*\}/g) || [];
  assert.equal(faces.length, POLICES.length);
  for (const ff of faces) assert.match(ff, /font-display:swap/);
  assert.match(css, /--num:'Barlow Condensed',[^;]*sans-serif/, 'police de repli système');
});

test('la sécurité de la page n’autorise que les polices de l’app', () => {
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1];
  assert.ok(csp, 'règle de sécurité (CSP) introuvable');
  assert.match(csp, /font-src 'self';/);
  assert.doesNotMatch(csp, /https?:/, 'aucun site extérieur dans la CSP');
});

test('la lecture de la liste FICHIERS ignore les commentaires (une apostrophe droite comme « l\'app » ne casse rien)', () => {
  const exemple = "const FICHIERS = [\n  './', 'index.html', // la page de l'app\n  /* les icônes de l'app */ 'icons/favicon.png',\n  // aujourd'hui : 'pas-un-fichier.js'\n  'js/config.js'\n];";
  assert.deepEqual(listeFichiersSW(exemple), ['./', 'index.html', 'icons/favicon.png', 'js/config.js']);
});

test('la lecture de la liste FICHIERS garde une adresse https:// entière', () => {
  const exemple = "const FICHIERS = [\n  'a.js', 'https://exemple.fr/b.js', // commentaire\n  'c.js'\n];";
  assert.deepEqual(listeFichiersSW(exemple), ['a.js', 'https://exemple.fr/b.js', 'c.js']);
});

test('manifest.json : les captures d’écran existent, à la bonne taille, légères, et hors du pré-cache', () => {
  const m = JSON.parse(lire('manifest.json'));
  assert.ok(Array.isArray(m.screenshots) && m.screenshots.length >= 2, 'au moins 2 captures');
  for (const c of m.screenshots) {
    const f = path.join(RACINE, c.src);
    assert.ok(fs.existsSync(f), `capture manquante : ${c.src}`);
    const png = fs.readFileSync(f);
    assert.equal(png.toString('latin1', 1, 4), 'PNG', `${c.src} n’est pas un PNG`);
    assert.equal(c.sizes, `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, `taille annoncée de ${c.src}`);
    assert.ok(png.length < 250 * 1024, `${c.src} pèse plus de 250 Ko`);
    assert.equal(c.type, 'image/png');
    assert.equal(c.form_factor, 'narrow');
    assert.ok(typeof c.label === 'string' && c.label.length > 5, `légende de ${c.src}`);
    assert.ok(!FICHIERS.includes(c.src), `${c.src} ne doit pas être dans le pré-cache (sw.js)`);
  }
});
