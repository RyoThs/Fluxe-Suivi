/* v2.9 : Stats > Progression par exercice : vraie courbe, 3 mesures (charge max, 1RM estimé, volume), 3 périodes. */
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
const txt = (p, q) => p.$eval(q, e => e.textContent.replace(/\s/g, ' '));

test('Charge max sur 3 mois : un point par séance, dernière valeur et évolution', async () => {
  const p = await A.page();
  await donner(p, DATA);
  await p.click('nav [data-tab=stats]');
  assert.equal(await p.$$eval('.courbe .pt', l => l.length), 3, 'la séance d’il y a 200 jours est hors période');
  assert.equal(await txt(p, '.cres b'), '100 kg');
  assert.match(await txt(p, '.cev'), /▲ \+20 kg \(\+25 %\)/);
  assert.match(await txt(p, '.cdet'), /100 kg × 1.*100 kg/);
  assert.match(await txt(p, '.cdet'), /Record/);
  assert.deepEqual(p.erreurs, []);
});

test('1RM estimé (Epley, séries de 1 à 12 reps) et Volume (échauffement exclu)', async () => {
  const p = await A.page();
  await donner(p, DATA);
  await p.click('nav [data-tab=stats]');
  await p.click('[data-act=cm][data-v=rm]');
  // a : 80 × (1 + 8/30) = 101,3 ; b : 85 × 1,2 = 102 ; c : 100 (1 rep) — la série de 15 reps est ignorée
  await p.click('[data-act=cpt][data-x="0"]');
  assert.match(await txt(p, '.cdet'), /80 kg × 8.*101,3 kg/);
  await p.click('[data-act=cpt][data-x="1"]');
  assert.match(await txt(p, '.cdet'), /85 kg × 6.*102 kg/);
  assert.match(await txt(p, '.cdet'), /Record/);
  assert.match(await txt(p, '.cnote'), /Epley/);
  await p.click('[data-act=cm][data-v=vol]');
  assert.equal(await txt(p, '.cdet > b'), '1 000 kg', '100×1 + 60×15');
  await p.click('[data-act=cpt][data-x="0"]');
  assert.equal(await txt(p, '.cdet > b'), '1 280 kg', '80×8×2, échauffement exclu');
  assert.deepEqual(p.erreurs, []);
});

test('Périodes : « Tout » montre aussi les vieilles séances ; changer d’exercice remet le dernier point', async () => {
  const p = await A.page();
  await donner(p, { ...DATA, sessions: [...DATA.sessions, { id: 'd', date: Date.now() - 2 * JOUR, exercises: [{ name: 'Fentes', sets: [st(20, 10)] }] }] });
  await p.click('nav [data-tab=stats]');
  await p.click('[data-act=cp][data-v=tout]');
  assert.equal(await p.$$eval('.courbe .pt', l => l.length), 4);
  await p.click('[data-act=cpt][data-x="0"]');
  await p.click('[data-act=sx][data-n="Fentes"]');
  assert.equal(await p.$$eval('.courbe .pt', l => l.length), 1);
  assert.match(await txt(p, '.cev'), /1re séance/);
  assert.match(await txt(p, '.cdet'), /20 kg × 10/);
  assert.deepEqual(p.erreurs, []);
});

test('aucune séance sur la période : message clair, pas d’erreur', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [S('vieux', 200, [st(70, 5)])] });
  await p.click('nav [data-tab=stats]');
  assert.match(await txt(p, '.card.prog'), /Pas de séance sur cette période/);
  await p.click('[data-act=cp][data-v=a1]');
  assert.equal(await p.$$eval('.courbe .pt', l => l.length), 1);
  assert.deepEqual(p.erreurs, []);
});

test('« Toutes » : volume total, séries et durée de chaque séance ; Charge max et 1RM disparaissent', async () => {
  const p = await A.page();
  await donner(p, { ...DATA, sessions: [...DATA.sessions, { id: 'd', date: Date.now() - 2 * JOUR, dur: 55, exercises: [
    { name: 'Squat', sets: [st(100, 5)] }, { name: 'Fentes', sets: [st(20, 10), st(20, 10, true)] }] }] });
  await p.click('nav [data-tab=stats]');
  await p.click('[data-act=cm][data-v=rm]');
  await p.click('[data-act=sx][data-n="*"]');
  assert.match(await txt(p, '.card.prog .hist-date'), /Progression globale/);
  assert.deepEqual(await p.$$eval('[data-act=cm]', l => l.map(b => b.dataset.v)), ['vol', 'ser', 'dur']);
  assert.equal(await p.$eval('[data-act=cm].on', b => b.dataset.v), 'vol', '1RM n’existe pas en global : retour au volume');
  assert.equal(await txt(p, '.cdet > b'), '700 kg', '100×5 + 20×10, échauffement exclu');
  assert.match(await txt(p, '.cdet'), /2 exercices · 2 séries/);
  await p.click('[data-act=cm][data-v=ser]');
  assert.equal(await txt(p, '.cdet > b'), '2 séries');
  await p.click('[data-act=cm][data-v=dur]');
  assert.equal(await txt(p, '.cdet > b'), '55 min');
  assert.equal(await p.$$eval('.courbe .pt.record', l => l.length), 0, 'pas de « record » de durée');
  await p.click('[data-act=sx][data-n="Squat"]');
  assert.equal(await p.$eval('[data-act=cm].on', b => b.dataset.v), 'max');
  assert.deepEqual(p.erreurs, []);
});
