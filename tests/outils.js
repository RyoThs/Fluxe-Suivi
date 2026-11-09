/* Outils partagés par tous les tests.
   - un petit serveur web qui sert l'application (comme GitHub Pages),
   - un navigateur Chromium à la taille d'un iPhone,
   - des raccourcis pour lire/écrire les données de l'app. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const RACINE = path.join(__dirname, '..');
const KEY = 'muscu-v1'; // clé de stockage de l'app : ne doit JAMAIS changer
const JOUR = 864e5;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function lire(f) { return fs.readFileSync(path.join(RACINE, f), 'utf8'); }

/* Serveur web minimal : sert les fichiers du projet sur un port libre */
function serveur() {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(RACINE, path.normalize(p));
      if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('introuvable'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${s.address().port}/`, fermer: () => s.close() }));
  });
}

/* Démarre serveur + navigateur. Renvoie de quoi ouvrir des pages et tout fermer. */
async function demarrer() {
  const srv = await serveur();
  const nav = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  return {
    url: srv.url,
    /* Ouvre une page neuve (stockage vide). Les erreurs JavaScript sont relevées dans p.erreurs. */
    async page(opts = {}) {
      const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, serviceWorkers: 'block', ...opts });
      const p = await ctx.newPage();
      p.erreurs = [];
      p.on('pageerror', e => p.erreurs.push(e.message));
      p.on('console', m => { if (m.type() === 'error') p.erreurs.push(m.text()); });
      /* Réponses aux fenêtres confirm/prompt : p.reponses.push(true | false | 'texte') */
      p.reponses = [];
      p.on('dialog', async d => { const r = p.reponses.shift(); if (r === false) await d.dismiss(); else await d.accept(typeof r === 'string' ? r : undefined); });
      await p.goto(srv.url);
      return p;
    },
    async fermer() { await nav.close(); srv.fermer(); },
  };
}

/* Écrit des données dans le téléphone simulé, puis relance l'app */
async function donner(p, d) {
  await p.evaluate(([k, d]) => localStorage.setItem(k, typeof d === 'string' ? d : JSON.stringify(d)), [KEY, d]);
  await p.reload();
  await p.waitForSelector('nav');
}
/* Lit les données enregistrées par l'app */
const donnees = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);

/* Fabrique une séance d'exemple, « il y a N jours » */
function seance(id, ilYa = 1, extra = {}) {
  return { id, date: Date.now() - ilYa * JOUR, dur: 45, exercises: [{ name: 'Squat', sets: [{ kg: '100', reps: '8', done: true }] }], ...extra };
}
const VIDE = { sessions: [], routines: [], current: null, notes: {}, rests: {} };

module.exports = { demarrer, donner, donnees, seance, lire, VIDE, KEY, JOUR, RACINE };
