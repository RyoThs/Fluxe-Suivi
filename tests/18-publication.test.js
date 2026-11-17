/* Publication sur GitHub Pages : l'app doit s'ouvrir depuis la page du projet sur GitHub, et marcher
   à son adresse réelle, qui est un SOUS-DOSSIER du site (https://ryoths.github.io/Fluxe-Suivi/).
   Sur la page du projet, cliquer sur index.html montre le CODE, pas l'app : le lien vers l'app doit donc
   se voir tout de suite en haut du README. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { lire, RACINE } = require('./outils');

const ADRESSE = 'https://ryoths.github.io/Fluxe-Suivi/';

test('le README montre en premier un lien cliquable « Ouvrir l’application » vers le site en ligne', () => {
  const debut = lire('README.md').split('\n').slice(0, 8).join('\n');
  assert.match(debut, /\[[^\]]*Ouvrir l[’']application[^\]]*\]\(https:\/\/ryoths\.github\.io\/Fluxe-Suivi\/\)/);
});

test('le README prévient que cliquer sur index.html dans GitHub montre le code, pas l’app', () => {
  assert.match(lire('README.md'), /index\.html[^\n]*code/);
});

test('GitHub publie les fichiers tels quels (fichier .nojekyll : aucun fichier caché ni transformé)', () => {
  assert.ok(fs.existsSync(path.join(RACINE, '.nojekyll')), '.nojekyll manquant à la racine');
});

test('les liens du projet n’utilisent pas le sous-dossier en dur (l’app marche à n’importe quelle adresse)', () => {
  for (const f of ['index.html', 'manifest.json', 'sw.js', 'confidentialite.html']) {
    assert.doesNotMatch(lire(f), /(href|src|start_url|scope)["']?\s*[:=]\s*["']\/(?!\/)/, f + ' : chemin qui commence par « / »');
  }
});

/* Serveur qui imite GitHub Pages : tout est dans /Fluxe-Suivi/, le reste n'existe pas */
function pages() {
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  const introuvables = [];
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/Fluxe-Suivi') { res.writeHead(301, { Location: '/Fluxe-Suivi/' }); return res.end(); }
    if (!p.startsWith('/Fluxe-Suivi/')) { introuvables.push(p); res.writeHead(404); return res.end(); }
    p = p.slice('/Fluxe-Suivi'.length);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(RACINE, path.normalize(p));
    if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { introuvables.push(p); res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => s.listen(0, '127.0.0.1', () => ok({ base: `http://127.0.0.1:${s.address().port}`, introuvables, fermer: () => s.close() })));
}

test('à son adresse réelle (sous-dossier, service worker actif), l’app s’ouvre, se recharge et ne rate aucun fichier', async () => {
  const srv = await pages();
  const nav = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  try {
    const p = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const erreurs = [];
    p.on('pageerror', e => erreurs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
    await p.goto(srv.base + '/Fluxe-Suivi'); /* sans « / » final, comme un lien tapé à la main */
    await p.waitForSelector('nav');
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload();
    await p.waitForSelector('nav');
    assert.equal(await p.evaluate(() => !!navigator.serviceWorker.controller), true, 'le service worker garde l’app');
    assert.deepEqual(srv.introuvables.filter(x => x !== '/favicon.ico'), [], 'fichiers introuvables');
    assert.deepEqual(erreurs, []);
  } finally {
    await nav.close();
    srv.fermer();
  }
});

test('l’adresse du README est bien celle du site publié', () => {
  assert.ok(lire('README.md').includes(ADRESSE));
});
