/* v2.8 : routines détaillées (séries, poids, reps, blocs cardio), création depuis l'Historique,
   temps de repos (choix rapides + 15 s en 15 s), chrono réglable pendant le repos, vibration sans son, 3 records. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, seance, VIDE } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const st = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });
const SEANCE = seance('h1', 2, { exercises: [
  { name: 'Squat', sets: [st(100, 8), st(100, 8), st(105, 5)] },
  { name: 'Tapis de course', cardio: true, sets: [{ min: '20', km: '3', kcal: '200', done: true }] },
] });

test('Historique : « Créer une routine » reprend les exercices, séries et blocs cardio ; elle apparaît sur l’accueil', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [SEANCE] });
  await p.click('nav [data-tab=histo]');
  p.reponses.push('Jambes');
  await p.click('[data-act=mkr][data-id=h1]');
  const d = await donnees(p);
  assert.equal(d.routines.length, 1);
  const r = d.routines[0];
  assert.equal(r.name, 'Jambes');
  assert.deepEqual(r.exercises, ['Squat', 'Tapis de course']);
  assert.deepEqual(r.sets[0], [{ kg: '100', reps: '8' }, { kg: '100', reps: '8' }, { kg: '105', reps: '5' }]);
  assert.deepEqual(r.sets[1], [{ min: '20', km: '3', kcal: '200' }]);
  assert.ok(r.id);
  await p.click('nav [data-tab=seance]');
  const carte = await p.textContent('.rlist');
  assert.match(carte, /Squat · 3 séries/);
  assert.match(carte, /Tapis de course · 1 bloc/);
  assert.deepEqual(p.erreurs, []);
});

test('fin de séance : plus aucune question « routine »', async () => {
  const p = await A.page();
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '8');
  await p.click('[data-act=chk]');
  await p.click('[data-act=finish]');
  await p.waitForTimeout(100);
  const vus = await p.vus();
  assert.equal(vus.length, 1, vus.join(' | '));
  assert.match(vus[0], /Terminer la séance/);
  assert.equal((await donnees(p)).routines.length, 0);
});

test('modifier une routine : poids, reps, + série, × série, bloc cardio, + exercice ; puis la séance démarre préremplie', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [SEANCE], routines: [{ id: 'r1', name: 'Jambes', exercises: ['Squat', 'Tapis de course'], sets: [[{ kg: '100', reps: '8' }, { kg: '100', reps: '8' }], [{ min: '20', km: '3', kcal: '200' }]] }] });
  await p.click('[data-act=redit][data-k="0"]');
  await p.fill('#rn', 'Jambes lourdes');
  await p.fill('[data-rf=kg][data-ri="0"][data-rj="1"]', '110');
  await p.fill('[data-rf=reps][data-ri="0"][data-rj="1"]', '6');
  await p.click('[data-act=rsadd][data-ri="0"]'); // 3e série = copie de la 2e
  await p.click('[data-act=rsdel][data-ri="0"][data-rj="0"]'); // retire la 1re
  await p.fill('[data-rf=min][data-ri="1"][data-rj="0"]', '25');
  await p.click('[data-act=rsadd][data-ri="1"]'); // 2e bloc cardio
  await p.click('[data-act=rxadd]');
  await p.click('#pl [data-act=padd][data-n="Fentes"]');
  assert.ok(await p.$('#rn'), 'retour à l’éditeur après le choix');
  await p.click('[data-act=rsave]');
  let d = await donnees(p);
  assert.deepEqual(d.routines[0], { id: 'r1', name: 'Jambes lourdes', exercises: ['Squat', 'Tapis de course', 'Fentes'],
    sets: [[{ kg: '110', reps: '6' }, { kg: '110', reps: '6' }], [{ min: '25', km: '3', kcal: '200' }, { min: '25', km: '3', kcal: '200' }], [{ kg: '', reps: '' }]] });
  await p.click('[data-act=startr][data-k="0"]');
  d = await donnees(p);
  const s = d.sessions.find(x => x.id === d.current);
  assert.equal(s.rt, 'r1');
  assert.deepEqual(s.exercises[0].sets.map(x => [x.kg, x.reps, x.done]), [['110', '6', false], ['110', '6', false]]);
  assert.equal(s.exercises[1].cardio, true);
  assert.deepEqual(s.exercises[1].sets.map(x => x.min), ['25', '25']);
  assert.deepEqual(p.erreurs, []);
});

test('Fermer l’éditeur sans enregistrer ne change rien ; une ancienne routine (sans séries) reste utilisable', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [SEANCE], routines: [{ name: 'Vieille', exercises: ['Squat'] }] });
  await p.click('[data-act=redit][data-k="0"]');
  assert.equal(await p.inputValue('[data-rf=kg][data-ri="0"][data-rj="2"]'), '105', 'séries de la dernière fois proposées');
  await p.fill('[data-rf=kg][data-ri="0"][data-rj="0"]', '999');
  await p.click('[data-act=closepk]');
  assert.deepEqual((await donnees(p)).routines, [{ name: 'Vieille', exercises: ['Squat'] }]);
  await p.click('[data-act=startr][data-k="0"]');
  const d = await donnees(p);
  assert.equal(d.sessions.find(x => x.id === d.current).exercises[0].sets.length, 3);
});

test('données abîmées dans une routine : les valeurs invalides sont vidées, le reste est gardé', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, routines: [{ id: 'ok', name: 'X', exercises: ['Squat'], sets: [[{ kg: 'abc', reps: '8' }, null, { kg: '50', reps: '5', w: true }]] }] });
  const d = await donnees(p);
  await p.click('[data-act=redit][data-k="0"]'); await p.click('[data-act=rsave]');
  assert.deepEqual((await donnees(p)).routines[0].sets, [[{ kg: '', reps: '8' }, { kg: '50', reps: '5', w: true }]]);
  assert.ok(d);
});

test('temps de repos : choix rapides, puis 15 s en 15 s au-delà de 2 min', async () => {
  const p = await A.page();
  await p.click('[data-act=start]');
  await p.click('[data-act=rest]');
  const chips = await p.$$eval('#sheet [data-act=rsv]', l => l.map(b => b.textContent));
  assert.deepEqual(chips, ['30 s', '45 s', '1 min', '1 min 30', '2 min']);
  await p.click('[data-act=rsv][data-s="120"]');
  await p.click('[data-act=rsp]'); await p.click('[data-act=rsp]'); await p.click('[data-act=rsp]');
  assert.equal(await p.textContent('.stp b'), '2:45');
  await p.click('[data-act=rsok]');
  assert.equal((await donnees(p)).rest, 165);
  // repos d'un exercice
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.click('[data-act=rex][data-i="0"]');
  await p.click('[data-act=rsv][data-s="45"]');
  await p.click('[data-act=rsok]');
  assert.equal((await donnees(p)).rests['k:squat'], 45);
});

test('chrono pendant le repos : −15 s, temps direct, « Garder pour l’exercice »', async () => {
  const p = await A.page();
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '8');
  await p.click('[data-act=chk]');
  assert.ok(await p.isVisible('#timer'));
  assert.equal(await p.isVisible('#tc'), false, 'réglages repliés au départ');
  await p.click('[data-act=tcfg]');
  await p.click('#tc [data-act=tset][data-s="60"]');
  assert.match(await p.textContent('#tt'), /^(1:00|0:59)$/);
  await p.click('#tc [data-act=t-]');
  assert.match(await p.textContent('#tt'), /^0:4[45]$/);
  assert.match(await p.textContent('#tc .keep'), /Garder 45 s pour Squat/);
  await p.click('#tc [data-act=tkeep]');
  assert.equal((await donnees(p)).rests['k:squat'], 45);
  assert.deepEqual(p.erreurs, []);
});

test('fin du repos : vibration courte, aucun son ; case pour couper la vibration', async () => {
  const p = await A.page();
  await p.context().addInitScript(() => {
    window.__vib = [];
    Object.defineProperty(navigator, 'vibrate', { value: (x) => { window.__vib.push(x); return true; }, configurable: true });
    window.__son = 0;
    window.AudioContext = window.webkitAudioContext = function () { window.__son++; };
  });
  await donner(p, { ...VIDE, rest: 15 });
  const repos = async () => {
    await p.click('[data-act=start]');
    await p.click('[data-act=pick]');
    await p.click('#pl [data-act=padd][data-n="Squat"]');
    await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '8');
    await p.click('[data-act=chk]');
    await p.click('[data-act=tcfg]');
    await p.click('#tc [data-act=t-]'); // il reste 5 s
    await p.waitForFunction(() => document.querySelector('#tt').textContent === '0:00', null, { timeout: 9000 });
    await p.waitForTimeout(100);
  };
  await repos();
  assert.deepEqual(await p.evaluate(() => window.__vib), [90]);
  assert.equal(await p.evaluate(() => window.__son), 0, 'aucun son');
  // couper la vibration
  await p.evaluate(() => { window.__fxAuto.push(true); });
  await p.click('[data-act=cancel]');
  await p.click('[data-act=start]');
  await p.click('[data-act=rest]');
  await p.uncheck('#vib');
  await p.click('[data-act=closepk]');
  await p.evaluate(() => { window.__fxAuto.push(true); });
  await p.click('[data-act=cancel]');
  assert.equal((await donnees(p)).nv, true);
  await repos();
  assert.deepEqual(await p.evaluate(() => window.__vib), [90], 'pas de nouvelle vibration');
});

test('Stats > Records : Poids max, Meilleure série (poids × reps), Volume (poids × reps × séries)', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [
    seance('a', 3, { exercises: [{ name: 'Squat', sets: [st(100, 8), st(100, 8), st(105, 5), { ...st(60, 10), w: true }] }] }),
    seance('b', 1, { exercises: [{ name: 'Squat', sets: [st(80, 12)] }] }),
  ] });
  await p.click('nav [data-tab=stats]');
  const lire = () => p.$$eval('.rec', l => l.map(r => [r.querySelector('div').firstChild.textContent, r.querySelector('span').textContent.split(' · ')[0], r.querySelector('b').textContent.replace(/\s/g, ' ')]));
  assert.deepEqual(await lire(), [['Squat', '5 répétitions', '105 kg']]);
  await p.click('[data-act=rx][data-v=serie]');
  assert.deepEqual(await lire(), [['Squat', '80 kg × 12', '960 kg']]);
  await p.click('[data-act=rx][data-v=vol]');
  assert.deepEqual(await lire(), [['Squat', '3 séries', '2 125 kg']]); // 800 + 800 + 525, échauffement exclu
  assert.deepEqual(p.erreurs, []);
});
