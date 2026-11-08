/* Tes données : elles se chargent, se nettoient et se gardent sans perte. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, seance, VIDE, KEY } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

test('premier lancement : l’app démarre vide, sans erreur', async () => {
  const p = await A.page();
  await p.waitForSelector('nav');
  for (const t of ['seance', 'histo', 'stats', 'aide']) await p.click(`nav [data-tab=${t}]`);
  assert.deepEqual(p.erreurs, []);
});

test('des séances existantes sont chargées et visibles dans l’Historique', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a1', 3), seance('a2', 1)], notes: { 'k:squat': 'Barre haute' } });
  await p.click('nav [data-tab=histo]');
  assert.equal(await p.locator('[data-act=delsess]').count(), 2);
  const d = await donnees(p);
  assert.equal(d.sessions.length, 2);
  assert.equal(d.notes['k:squat'], 'Barre haute');
  assert.deepEqual(p.erreurs, []);
});

test('une séance abîmée est écartée, les bonnes sont gardées, et l’original est mis de côté', async () => {
  const p = await A.page();
  const abimee = { id: 'pas bon !', date: 'hier', exercises: 'rien' };
  await donner(p, { ...VIDE, sessions: [seance('ok1', 2), abimee, seance('ok2', 1)] });
  await p.click('nav [data-tab=histo]');
  assert.equal(await p.locator('[data-act=delsess]').count(), 2);
  /* l'original complet est copié dans « muscu-v1-brut » pour pouvoir le récupérer */
  const brut = await p.evaluate(k => localStorage.getItem(k + '-brut'), KEY);
  assert.ok(brut && JSON.parse(brut).sessions.length === 3);
});

test('les valeurs invalides sont nettoyées (poids, doublons, réglages)', async () => {
  const p = await A.page();
  const s = seance('x1', 1, { exercises: [{ name: 'Squat', sets: [{ kg: 100, reps: '8' }, { kg: '<script>', reps: '5' }] }] });
  await donner(p, { ...VIDE, sessions: [s, seance('x1', 2)], bkEvery: 999, rest: 99999 });
  await p.click('nav [data-tab=seance]'); await p.click('[data-act=start]'); // force un enregistrement
  const d = await donnees(p);
  const x1 = d.sessions.find(z => z.id === 'x1');
  assert.equal(d.sessions.filter(z => z.id === 'x1').length, 1, 'doublon supprimé');
  assert.equal(x1.exercises[0].sets[0].kg, '100', 'nombre converti en texte');
  assert.equal(x1.exercises[0].sets[1].kg, '', 'texte dangereux vidé');
  assert.equal(d.bkEvery, undefined);
  assert.equal(d.rest, undefined);
});

test('une séance faite dans l’app est bien enregistrée et survit au redémarrage', async () => {
  const p = await A.page();
  p.reponses.push(true, false);
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=kg][data-i="0"][data-j="0"]', '100');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '8');
  await p.click('[data-act=chk]');
  await p.click('[data-act=finish]');
  await p.reload(); await p.waitForSelector('nav');
  const d = await donnees(p);
  assert.equal(d.sessions.length, 1);
  assert.equal(d.current, null);
  assert.equal(d.sessions[0].exercises[0].name, 'Squat');
  assert.deepEqual([d.sessions[0].exercises[0].sets[0].kg, d.sessions[0].exercises[0].sets[0].reps], ['100', '8']);
  assert.deepEqual(p.erreurs, []);
});

test('données illisibles : elles doivent être mises de côté avant d’être écrasées', { todo: 'faiblesse trouvée le 2026-11-08, pas encore corrigée' }, async () => {
  const p = await A.page();
  const casse = '{"sessions":[{"id":"a","date":1,"exercises":[]}';
  await donner(p, casse);
  await p.click('[data-act=start]');
  const gardee = await p.evaluate(k => localStorage.getItem(k + '-brut'), KEY);
  assert.equal(gardee, casse);
});
