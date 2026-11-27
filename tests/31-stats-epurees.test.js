/* v3.16 : page Stats épurée.
   - Toujours ouvertes : Ma progression, Mon corps, Volume par semaine, Répartition par groupe.
   - Repliées (on touche pour ouvrir / refermer) : Progression globale, Cardio, Records ; le choix est retenu par le téléphone.
   - Progression : plus de boutons d'exercice ni de « Toutes », toujours calculée au global. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, VIDE, JOUR } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const st = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });
const DATA = { ...VIDE, sessions: [
  { id: 'a', date: Date.now() - 10 * JOUR, dur: 40, exercises: [{ name: 'Squat', sets: [st(80, 5)] }, { name: 'Développé couché', sets: [st(60, 8)] }] },
  { id: 'b', date: Date.now() - 2 * JOUR, dur: 45, exercises: [{ name: 'Squat', sets: [st(90, 5)] }, { name: 'Tapis de course', cardio: true, sets: [{ min: '20', km: '3', kcal: '200', done: true }] }] },
] };
const ouvrirStats = async p => { await donner(p, DATA); await p.click('nav [data-tab=stats]'); };
const titres = p => p.$$eval('#app .hist-date', l => l.map(e => e.textContent.trim()));

test('à l’ouverture : 4 rubriques dépliées, 3 repliées avec titre et résumé', async () => {
  const p = await A.page();
  await ouvrirStats(p);
  assert.equal(await p.locator('#app .chart').count(), 1, 'Volume par semaine ouvert');
  assert.ok(await p.locator('#app .mg').count() > 0, 'Répartition par groupe ouverte');
  assert.equal(await p.locator('#app .mann, #app [data-act=mus]').first().count(), 1, 'Ma progression ouverte');
  assert.match(await p.textContent('#app'), /Mon corps/);
  for (const [v, t] of [['prog', 'Progression globale'], ['cardio', 'Cardio'], ['rec', 'Records']]) {
    const b = p.locator(`#app [data-act=pli][data-v=${v}]`);
    assert.equal(await b.count(), 1, t + ' : un bouton pour déplier');
    assert.equal(await b.getAttribute('aria-expanded'), 'false', t + ' : replié');
    assert.match(await b.textContent(), new RegExp(t));
  }
  assert.match(await p.textContent('[data-act=pli][data-v=cardio]'), /20 min/, 'résumé du cardio');
  assert.match(await p.textContent('[data-act=pli][data-v=rec]'), /Squat 90 kg/, 'résumé des records');
  assert.equal(await p.locator('#app .courbe').count(), 0, 'courbe cachée');
  assert.equal(await p.locator('#app [data-act=rx]').count(), 0, 'records cachés');
  assert.deepEqual(p.erreurs, []);
});

test('toucher une rubrique la déplie, retoucher la replie ; le téléphone s’en souvient', async () => {
  const p = await A.page();
  await ouvrirStats(p);
  await p.click('[data-act=pli][data-v=rec]');
  assert.equal(await p.getAttribute('[data-act=pli][data-v=rec]', 'aria-expanded'), 'true');
  assert.equal(await p.locator('#app [data-act=rx]').count(), 3, 'les 3 onglets des records');
  await p.reload();
  await p.waitForSelector('nav');
  await p.click('nav [data-tab=stats]');
  assert.equal(await p.getAttribute('[data-act=pli][data-v=rec]', 'aria-expanded'), 'true', 'toujours ouvert après réouverture');
  await p.click('[data-act=pli][data-v=rec]');
  assert.equal(await p.getAttribute('[data-act=pli][data-v=rec]', 'aria-expanded'), 'false');
  assert.equal(await p.locator('#app [data-act=rx]').count(), 0);
  assert.deepEqual(p.erreurs, []);
});

test('Progression globale : aucun bouton d’exercice ni « Toutes », courbe de toutes les séances', async () => {
  const p = await A.page();
  await ouvrirStats(p);
  await p.click('[data-act=pli][data-v=prog]');
  assert.equal(await p.locator('#app [data-act=sx]').count(), 0, 'plus de boutons d’exercice');
  assert.doesNotMatch(await p.textContent('#app'), /Toutes/);
  assert.deepEqual(await p.$$eval('[data-act=cm]', l => l.map(e => e.textContent)), ['Volume total', 'Séries', 'Durée']);
  assert.equal(await p.locator('#app .courbe .pt').count(), 2, 'un point par séance');
  assert.ok((await titres(p)).includes('Progression globale'));
  assert.deepEqual(p.erreurs, []);
});

test('v3.16.1 : bouton rond en dégradé, flèche blanche bien centrée (ouvert comme replié)', async () => {
  const p = await A.page();
  await ouvrirStats(p);
  await p.click('[data-act=pli][data-v=rec]');
  const mesures = await p.$$eval('.pli-t .fl', l => l.map(f => {
    const a = f.getBoundingClientRect(), b = f.querySelector('svg').getBoundingClientRect(), cs = getComputedStyle(f);
    return { dx: Math.abs(b.left + b.width / 2 - (a.left + a.width / 2)), dy: Math.abs(b.top + b.height / 2 - (a.top + a.height / 2)), couleur: getComputedStyle(f.querySelector('svg')).color, fond: cs.backgroundImage };
  }));
  assert.equal(mesures.length, 3);
  for (const m of mesures) {
    assert.ok(m.dx <= 0.5 && m.dy <= 0.5, 'flèche décalée de ' + m.dx + ' × ' + m.dy + ' px');
    assert.equal(m.couleur, 'rgb(255, 255, 255)', 'flèche blanche');
    assert.match(m.fond, /gradient/, 'rond en dégradé');
  }
  assert.deepEqual(p.erreurs, []);
});
