/* Vidéo de présentation (outils/video/, 2026-11-28).
   - le montage s'anime sans erreur du début à la fin (32 s) ;
   - aucune adresse de site dans la vidéo (Yoann ne veut pas d'adresse sur l'appli) ;
   - aucun nom d'enseigne de salle ni de concurrent. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const MONTAGE = pathToFileURL(path.join(__dirname, '..', 'outils', 'video', 'montage.html')).href;
let nav, p;
test.before(async () => {
  nav = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  p = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
  p.erreurs = [];
  p.on('pageerror', e => p.erreurs.push(e.message));
  await p.goto(MONTAGE);
});
test.after(async () => { await nav.close(); });

test('le montage s’anime sans erreur de 0 à 32 s', async () => {
  for (let t = 0; t <= 32; t += 0.25) await p.evaluate(t => window.render(t), t);
  assert.deepEqual(p.erreurs, []);
});

test('la fin affiche « Gratuit. Sans compte. Même hors ligne. » et le compteur arrive à 2 084', async () => {
  await p.evaluate(() => window.render(26));
  assert.equal((await p.textContent('#nb')).replace(/\s/g, ' '), '2 084');
  await p.evaluate(() => window.render(31));
  assert.match(await p.textContent('#fin'), /Gratuit\.\s*Sans compte\.\s*Même hors ligne\./);
});

test('aucune adresse de site, aucun nom d’enseigne ni de concurrent', async () => {
  const texte = await p.evaluate(() => document.body.innerText);
  assert.doesNotMatch(texte, /https?:|www\.|github\.io|\.fr\b|\.com\b/i);
  for (const m of ['Basic', 'Fitness Park', 'On Air', 'Orange Bleue', 'Neoness', 'Keepcool', 'Hevy']) assert.doesNotMatch(texte, new RegExp(m, 'i'), m);
});
