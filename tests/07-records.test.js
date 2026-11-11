/* Records : on affiche le poids RÉELLEMENT soulevé (pas une estimation).
   Règle : la série la plus lourde gagne ; à poids égal, celle qui a le plus de répétitions. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, seance, VIDE } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

const s = (id, ilYa, nom, series) => seance(id, ilYa, { exercises: [{ name: nom, sets: series.map(([kg, reps, w]) => ({ kg: String(kg), reps: String(reps), done: true, ...(w ? { w: true } : {}) })) }] });
/* Lit la carte Records : [[nom, poids affiché, détail], …] */
const records = p => p.$$eval('.rec', l => l.map(r => [r.querySelector('div').firstChild.textContent, r.querySelector('b').textContent, r.querySelector('span').textContent]));

test('le record est le poids le plus lourd soulevé, sans poids ajouté', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [
    s('a', 3, 'Triceps machine hammer', [[50, 12]]),
    s('b', 2, 'Tirage vertical', [[35, 10], [30, 12]]),
  ] });
  await p.click('nav [data-tab=stats]');
  const r = await records(p);
  assert.deepEqual(r.map(x => x.slice(0, 2)), [['Triceps machine hammer', '50 kg'], ['Tirage vertical', '35 kg']]);
  assert.match(r[0][2], /^12 répétitions · /);
  assert.doesNotMatch(await p.$eval('#app', e => e.textContent), /Epley|1RM/);
  assert.deepEqual(p.erreurs, []);
});

test('plus lourd mais moins de répétitions = nouveau record ; à poids égal, plus de répétitions gagne', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [
    s('a', 4, 'Squat', [[100, 12]]),
    s('b', 3, 'Squat', [[105, 3]]),   // plus lourd → record
    s('c', 2, 'Squat', [[105, 5]]),   // même poids, plus de reps → record
    s('d', 1, 'Squat', [[90, 20]]),   // plus léger → pas record
  ] });
  await p.click('nav [data-tab=stats]');
  const [[, kg, detail]] = await records(p);
  assert.equal(kg, '105 kg');
  assert.match(detail, /^5 répétitions/);
});

test('les séries d’échauffement ne comptent pas, les demi-kilos sont affichés', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [s('a', 1, 'Développé couché', [[120, 1, true], [82.5, 6]])] });
  await p.click('nav [data-tab=stats]');
  assert.equal((await records(p))[0][1], '82,5 kg');
});

test('badge PR en séance : seulement si la charge dépasse le record (ou même charge, plus de répétitions)', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [s('a', 2, 'Squat', [[100, 8]])] });
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  const essai = async (kg, reps) => {
    await p.fill('[data-f=kg][data-i="0"][data-j="0"]', kg);
    await p.fill('[data-f=reps][data-i="0"][data-j="0"]', reps);
    if (await p.$('.gr.ok [data-act=chk]')) await p.click('[data-act=chk]'); // dévalide
    await p.click('[data-act=chk]');
    return !!(await p.$('.pr'));
  };
  assert.equal(await essai('90', '15'), false, 'plus léger avec plus de reps : pas de record');
  assert.equal(await essai('100', '8'), false, 'égalité : pas de record');
  assert.equal(await essai('100', '9'), true, 'même charge, une rep de plus');
  assert.equal(await essai('102.5', '3'), true, 'plus lourd');
  assert.deepEqual(p.erreurs, []);
});
