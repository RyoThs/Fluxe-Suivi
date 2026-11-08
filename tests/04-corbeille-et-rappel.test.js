/* Corbeille (30 jours) et rappel de sauvegarde. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, seance, VIDE, JOUR } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const rappel = p => p.$eval('#app', e => { const c = e.querySelector('.bkc'); return c ? c.innerText : null; });

test('une séance supprimée va dans la corbeille, puis peut être restaurée', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 2), seance('b', 1)] });
  await p.click('nav [data-tab=histo]');
  p.reponses.push(true);
  await p.click('[data-act=delsess][data-id=a]');
  let d = await donnees(p);
  assert.deepEqual(d.sessions.map(s => s.id), ['b']);
  assert.equal(d.trash[0].s.id, 'a');
  await p.click('[data-act=data]');
  await p.click('[data-act=trest]');
  d = await donnees(p);
  assert.deepEqual(d.sessions.map(s => s.id).sort(), ['a', 'b']);
  assert.equal(d.trash.length, 0);
  assert.deepEqual(p.erreurs, []);
});

test('refuser la suppression ne supprime rien', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 1)] });
  await p.click('nav [data-tab=histo]');
  p.reponses.push(false);
  await p.click('[data-act=delsess][data-id=a]');
  assert.equal((await donnees(p)).sessions.length, 1);
});

test('la corbeille se vide seule après 30 jours (et pas avant)', async () => {
  const p = await A.page();
  const t = Date.now();
  await donner(p, { ...VIDE, sessions: [seance('x', 1)], trash: [{ at: t - 31 * JOUR, s: seance('vieille', 40) }, { at: t - 29 * JOUR, s: seance('recente', 35) }] });
  await p.click('[data-act=start]'); // force un enregistrement
  assert.deepEqual((await donnees(p)).trash.map(x => x.s.id), ['recente']);
});

test('rappel : jamais sauvegardé → le rappel s’affiche', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 1)] });
  assert.match(await rappel(p), /Pense à sauvegarder/);
});

test('rappel : sauvegarde récente, 2 séances non sauvegardées → pas encore de rappel', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 5), seance('b', .5), seance('c', .2)], lastBackup: Date.now() - JOUR });
  assert.equal(await rappel(p), null);
});

test('rappel : 5 séances non sauvegardées → rappel même si la sauvegarde est récente', async () => {
  const p = await A.page();
  const s = ['b', 'c', 'd', 'e', 'f'].map((id, i) => seance(id, .9 - i / 10));
  await donner(p, { ...VIDE, sessions: [seance('a', 5), ...s], lastBackup: Date.now() - JOUR });
  assert.match(await rappel(p), /5 séances/);
});

test('rappel : vieux fichier mais tout est sauvegardé → aucun rappel', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 10)], lastBackup: Date.now() - 8 * JOUR });
  assert.equal(await rappel(p), null);
  await p.click('nav [data-tab=histo]');
  assert.equal(await p.$eval('.bk', e => e.textContent), '✓ Tout est sauvegardé');
});

test('rappel : le délai réglé à 14 jours est respecté et gardé', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 10), seance('b', 2)], lastBackup: Date.now() - 8 * JOUR });
  assert.ok(await rappel(p));
  await p.click('nav [data-tab=histo]');
  await p.click('[data-act=data]');
  await p.click('[data-act=bke][data-d="14"]');
  assert.equal((await donnees(p)).bkEvery, 14);
  await p.reload(); await p.waitForSelector('nav');
  assert.equal(await rappel(p), null);
});

test('rappel : « Plus tard » le cache, « Sauvegarder » le fait disparaître', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 1)] });
  await p.click('.bkc [data-act=snz]');
  assert.equal(await rappel(p), null);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('muscu-v1')); delete s.snooze; localStorage.setItem('muscu-v1', JSON.stringify(s)); });
  await p.reload(); await p.waitForSelector('.bkc');
  await Promise.all([p.waitForEvent('download'), p.click('.bkc [data-act=file]')]);
  await p.waitForTimeout(200);
  assert.equal(await rappel(p), null);
  assert.deepEqual(p.erreurs, []);
});
