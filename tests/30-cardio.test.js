/* v3.16 : le cardio est reconnu aussi pour les exercices perso.
   - choix « Cardio » parmi les muscles d'un exercice perso ;
   - un nom qui parle de cardio (vélo, tapis, course, rameur…) est reconnu tout seul, tant qu'aucun muscle n'a été choisi ;
   - un exercice cardio garde sa place dans la séance (minutes, km, kcal). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE } = require('./outils');
/* la séance en cours = celle dont l'id est « current » */
const enCours = d => d.sessions.find(x => x.id === d.current);

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let MUS, A;
test.before(async () => {
  MUS = await import(url('muscles.js'));
  A = await demarrer();
});
test.after(async () => { await A.fermer(); });

test('estCardio : catalogue, choix perso « Cardio », et noms qui parlent de cardio', () => {
  assert.equal(MUS.estCardio('Tapis de course'), true, 'cardio du catalogue');
  assert.equal(MUS.estCardio('Squat'), false, 'musculation du catalogue');
  assert.equal(MUS.estCardio('Mon truc', { 'Mon truc': 'Cardio' }), true, 'choisi « Cardio »');
  for (const n of ['Vélo', 'velo d’appartement', 'Course à pied', 'Footing', 'Tapis maison', 'Rameur Concept2', 'Elliptique perso', 'Stepper', 'Corde à sauter', 'Natation', 'Spinning', 'Bike'])
    assert.equal(MUS.estCardio(n), true, n);
  for (const n of ['Curl marteau perso', 'Gainage', 'Marche du fermier', 'Rowing haltère perso'])
    assert.equal(MUS.estCardio(n), false, n);
  assert.equal(MUS.estCardio('Vélo', { Vélo: 'Jambes' }), false, 'un muscle choisi par l’utilisateur passe avant le nom');
  assert.equal(MUS.groupeDe('Vélo'), 'Cardio');
  assert.equal(MUS.groupeDe('Mon truc', { 'Mon truc': 'Cardio' }), 'Cardio');
  assert.deepEqual(MUS.musclesDe('Mon truc', { 'Mon truc': 'Cardio' }), {});
  assert.deepEqual(MUS.CHOIX_PERSO, [...MUS.GROUPES_PERSO, 'Cardio']);
});

async function creerPerso(p, nom) {
  await p.click('[data-act=pick]');
  await p.fill('#pq', nom);
  await p.click(`#pl [data-act=padd][data-n="${nom}"]`);
  await p.waitForTimeout(200);
}

test('séance : « Vélo » créé après le Squat devient un bloc cardio, sans question de muscle, et garde sa place', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await creerPerso(p, 'Vélo');
  assert.ok(!(await p.vus()).some(v => /Quel muscle/.test(v)), 'aucune question : c’est du cardio');
  assert.equal(await p.locator('[data-f=min][data-i="1"]').count(), 1, 'Vélo a des cases minutes / km / kcal');
  assert.equal(await p.locator('[data-f=kg][data-i="1"]').count(), 0, 'et pas de kg');
  const cur = enCours(await donnees(p));
  assert.deepEqual(cur.exercises.map(e => [e.name, !!e.cardio]), [['Squat', false], ['Vélo', true]], 'l’ordre est celui de la séance');
  assert.deepEqual(p.erreurs, []);
});

test('exercice perso : choisir « Cardio » le transforme en bloc cardio, et ce choix est gardé', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  p.reponses.push('Cardio');
  await creerPerso(p, 'Mon circuit');
  assert.ok((await p.vus()).some(v => /Quel muscle/.test(v)), 'la question est posée (le nom ne dit rien)');
  assert.deepEqual((await donnees(p)).mu, { 'Mon circuit': 'Cardio' });
  assert.equal(await p.locator('[data-f=min][data-i="0"]').count(), 1, 'devenu un bloc cardio');
  assert.equal(enCours(await donnees(p)).exercises[0].cardio, true);
  await p.reload();
  await p.waitForSelector('nav');
  assert.deepEqual((await donnees(p)).mu, { 'Mon circuit': 'Cardio' }, '« Cardio » est un choix valide au rechargement');
  assert.deepEqual(p.erreurs, []);
});

test('routine : un exercice perso cardio démarre en bloc cardio, à la place prévue', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, routines: [{ id: 'r1', name: 'Jambes', exercises: ['Squat', 'Course à pied', 'Presse à cuisses'] }] });
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=startr][data-k="0"]');
  await p.waitForTimeout(200);
  const cur = enCours(await donnees(p));
  assert.deepEqual(cur.exercises.map(e => [e.name, !!e.cardio]), [['Squat', false], ['Course à pied', true], ['Presse à cuisses', false]]);
  assert.deepEqual(p.erreurs, []);
});
