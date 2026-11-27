/* v2.9 : Stats > courbe de progression, 3 périodes.
   v3.16 : la courbe est toujours globale (toutes les séances) : Volume total, Séries, Durée. Plus de choix d'exercice. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, VIDE, JOUR } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const st = (kg, reps, w) => ({ kg: String(kg), reps: String(reps), done: true, ...(w ? { w: true } : {}) });
const S = (id, ilYa, sets) => ({ id, date: Date.now() - ilYa * JOUR, dur: 40, exercises: [{ name: 'Squat', sets }] });
const DATA = { ...VIDE, sessions: [
  S('vieux', 200, [st(70, 5)]), // hors des 3 mois
  S('a', 60, [st(40, 10, true), st(80, 8), st(80, 8)]),
  S('b', 30, [st(90, 3), st(85, 6)]),
  S('c', 5, [st(100, 1), st(60, 15)]), // 15 reps : ne compte pas pour le 1RM
] };
/* Stats ouvertes, rubrique « Progression globale » dépliée (repliée au départ depuis la v3.16) */
const ouvrir = async p => { await p.click('nav [data-tab=stats]'); await p.click('[data-act=pli][data-v=prog]'); };
const txt = (p, q) => p.$eval(q, e => e.textContent.replace(/\s/g, ' '));

test('Volume total sur 3 mois : un point par séance, dernière valeur et évolution (échauffement exclu)', async () => {
  const p = await A.page();
  await donner(p, DATA);
  await ouvrir(p);
  assert.equal(await p.$$eval('.courbe .pt', l => l.length), 3, 'la séance d’il y a 200 jours est hors période');
  assert.equal(await txt(p, '.cres b'), '1 000 kg', '100×1 + 60×15');
  assert.match(await txt(p, '.cev'), /▼ −280 kg \(−22 %\)/, 'depuis 1 280 kg');
  await p.click('[data-act=cpt][data-x="0"]');
  assert.equal(await txt(p, '.cdet > b'), '1 280 kg', '80×8×2, échauffement exclu');
  assert.deepEqual(p.erreurs, []);
});

test('Séries et Durée de chaque séance', async () => {
  const p = await A.page();
  await donner(p, DATA);
  await ouvrir(p);
  assert.deepEqual(await p.$$eval('[data-act=cm]', l => l.map(b => b.dataset.v)), ['vol', 'ser', 'dur']);
  await p.click('[data-act=cm][data-v=ser]');
  assert.equal(await txt(p, '.cdet > b'), '2 séries');
  await p.click('[data-act=cm][data-v=dur]');
  assert.equal(await txt(p, '.cdet > b'), '40 min');
  assert.equal(await p.$$eval('.courbe .pt.record', l => l.length), 0, 'pas de « record » de durée');
  assert.deepEqual(p.erreurs, []);
});

test('Périodes : « Tout » montre aussi les vieilles séances', async () => {
  const p = await A.page();
  await donner(p, DATA);
  await ouvrir(p);
  await p.click('[data-act=cp][data-v=tout]');
  assert.equal(await p.$$eval('.courbe .pt', l => l.length), 4);
  await p.click('[data-act=cpt][data-x="0"]');
  assert.equal(await txt(p, '.cdet > b'), '350 kg', '70×5 il y a 200 jours');
  assert.deepEqual(p.erreurs, []);
});

test('aucune séance sur la période : message clair, pas d’erreur', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [S('vieux', 200, [st(70, 5)])] });
  await ouvrir(p);
  assert.match(await txt(p, '.card.prog'), /Pas de séance sur cette période/);
  await p.click('[data-act=cp][data-v=a1]');
  assert.equal(await p.$$eval('.courbe .pt', l => l.length), 1);
  assert.deepEqual(p.erreurs, []);
});

test('plusieurs exercices dans la séance : tout est additionné', async () => {
  const p = await A.page();
  await donner(p, { ...DATA, sessions: [...DATA.sessions, { id: 'd', date: Date.now() - 2 * JOUR, dur: 55, exercises: [
    { name: 'Squat', sets: [st(100, 5)] }, { name: 'Fentes', sets: [st(20, 10), st(20, 10, true)] }] }] });
  await ouvrir(p);
  assert.equal(await txt(p, '.cdet > b'), '700 kg', '100×5 + 20×10, échauffement exclu');
  assert.match(await txt(p, '.cdet'), /2 exercices · 2 séries/);
  await p.click('[data-act=cm][data-v=ser]');
  assert.equal(await txt(p, '.cdet > b'), '2 séries');
  await p.click('[data-act=cm][data-v=dur]');
  assert.equal(await txt(p, '.cdet > b'), '55 min');
  assert.deepEqual(p.erreurs, []);
});
