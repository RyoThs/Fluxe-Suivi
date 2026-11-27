/* Muscles précis (v3.3.0) : chaque exercice du catalogue sait quels muscles il travaille.
   Muscle principal = 1 série comptée, muscle secondaire = ½ série. C'est la base du mannequin « Ma progression ».
   Les exercices perso reçoivent le groupe choisi par l'utilisateur. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let CAT, MUS;
test.before(async () => {
  CAT = await import(url('catalogue.js'));
  MUS = await import(url('muscles.js'));
});

test('les 21 muscles du mannequin ont un nom en français et un groupe connu', () => {
  const ids = Object.keys(MUS.MUSCLES);
  assert.equal(ids.length, 21);
  for (const id of ids) {
    const m = MUS.MUSCLES[id];
    assert.ok(m.nom && typeof m.nom === 'string', id + ' : nom');
    assert.ok(CAT.M.includes(m.groupe), id + ' : groupe « ' + m.groupe + ' » inconnu');
  }
});

test('chaque exercice du catalogue (hors cardio) a au moins un muscle principal, et seulement des muscles connus', () => {
  const oublis = [];
  for (const [nom, groupe] of CAT.LIB) {
    if (groupe === 'Cardio') continue;
    const m = MUS.musclesDe(nom);
    if (!Object.values(m).includes(1)) oublis.push(nom);
    for (const [id, poids] of Object.entries(m)) {
      assert.ok(MUS.MUSCLES[id], nom + ' : muscle « ' + id + ' » inconnu');
      assert.ok(poids === 1 || poids === 0.5, nom + ' : poids ' + poids);
    }
  }
  assert.deepEqual(oublis, [], 'exercices sans muscle principal');
});

test('le muscle principal appartient bien au groupe de l’exercice dans le catalogue (garde-fou contre les erreurs de la table)', () => {
  const faux = [];
  for (const [nom, groupe] of CAT.LIB) {
    if (groupe === 'Cardio' || groupe === 'Corps entier') continue;
    const principaux = Object.entries(MUS.musclesDe(nom)).filter(([, p]) => p === 1).map(([id]) => MUS.MUSCLES[id].groupe);
    if (!principaux.includes(groupe)) faux.push(nom + ' (' + groupe + ')');
  }
  assert.deepEqual(faux, []);
});

test('la table ne contient aucun exercice qui n’existe pas dans le catalogue (pas de faute de frappe)', () => {
  const noms = new Set(CAT.LIB.map(x => x[0]));
  assert.deepEqual(MUS.nomsTable().filter(n => !noms.has(n)), []);
});

test('précision : leg curl = ischios seulement, leg extension = quadriceps seulement', () => {
  assert.deepEqual(MUS.musclesDe('Leg curl'), { isch: 1, mol: 0.5 });
  assert.deepEqual(MUS.musclesDe('Leg extension'), { quad: 1 });
});

test('précision : développé couché = pectoraux + ½ triceps et ½ épaules avant ; squat = quadriceps et fessiers + ½ ischios et lombaires', () => {
  assert.deepEqual(MUS.musclesDe('Développé couché'), { pec: 1, tri: 0.5, dela: 0.5 });
  const sq = MUS.musclesDe('Squat');
  assert.equal(sq.quad, 1);
  assert.equal(sq.fess, 1);
  assert.equal(sq.isch, 0.5);
  assert.equal(sq.lomb, 0.5);
});

test('les exercices « Corps entier » sont répartis sur au moins 3 groupes de muscles', () => {
  for (const [nom, groupe] of CAT.LIB) {
    if (groupe !== 'Corps entier') continue;
    const groupes = new Set(Object.keys(MUS.musclesDe(nom)).map(id => MUS.MUSCLES[id].groupe));
    assert.ok(groupes.size >= 3, nom + ' : ' + [...groupes].join(', '));
  }
});

test('le cardio et un exercice inconnu ne colorent aucun muscle', () => {
  assert.deepEqual(MUS.musclesDe('Tapis de course'), {});
  assert.deepEqual(MUS.musclesDe('Machine bizarre de ma salle'), {});
});

test('un exercice perso prend les muscles du groupe choisi par l’utilisateur', () => {
  const mu = { 'Presse maison': 'Jambes', 'Rien du tout': 'Pas un groupe' };
  assert.deepEqual(MUS.musclesDe('Presse maison', mu), { quad: 1, isch: 1, mol: 0.5 });
  assert.deepEqual(MUS.musclesDe('Rien du tout', mu), {});
  /* le catalogue reste prioritaire sur un choix perso du même nom */
  assert.deepEqual(MUS.musclesDe('Leg extension', { 'Leg extension': 'Bras' }), { quad: 1 });
});

test('groupeDe : catalogue, sinon choix perso, sinon « Perso »', () => {
  assert.equal(MUS.groupeDe('Squat', {}), 'Jambes');
  assert.equal(MUS.groupeDe('Presse maison', { 'Presse maison': 'Jambes' }), 'Jambes');
  assert.equal(MUS.groupeDe('Inconnu', {}), 'Perso');
  assert.equal(MUS.groupeDe('Inconnu'), 'Perso');
  assert.deepEqual(MUS.GROUPES_PERSO, ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Fessiers', 'Abdos', 'Corps entier']);
});

/* ===== Le choix de muscle des exercices perso est gardé (données S.mu) ===== */
const fs = require('node:fs');
const { demarrer, donner, donnees, seance, VIDE } = require('./outils');
const ANCIENS = path.join(__dirname, 'anciennes-sauvegardes');
let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

async function importer(p, fichier, choix) {
  await p.click('nav [data-tab=histo]');
  await p.click('[data-act=data]');
  await p.waitForSelector('#sheet [data-act=file]');
  await p.setInputFiles('#fi', fichier);
  await p.waitForSelector(`[data-act=${choix}]`);
  if (choix === 'irepl') p.reponses.push(true);
  await p.click(`[data-act=${choix}]`);
  await p.waitForTimeout(300);
}

test('données : les choix valides sont gardés, les mauvais écartés, et une ancienne sauvegarde sans « mu » marche', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('m1', 1)], mu: { 'Presse maison': 'Jambes', 'Truc': 'Cardio', 'Machin': 42, '': 'Dos', ['x'.repeat(80)]: 'Dos' } });
  await p.click('nav [data-tab=seance]'); await p.click('[data-act=start]'); // force un enregistrement
  assert.deepEqual((await donnees(p)).mu, { 'Presse maison': 'Jambes', 'Truc': 'Cardio' }, 'v3.16 : « Cardio » est un choix valide');
  await donner(p, { ...VIDE, sessions: [seance('m2', 1)] });
  await p.click('nav [data-tab=seance]'); await p.click('[data-act=start]');
  assert.deepEqual((await donnees(p)).mu, {});
  assert.deepEqual(p.erreurs, []);
});

test('fichier de sauvegarde v3.3 : « Remplacer » reprend les choix de muscles', async () => {
  const p = await A.page();
  await importer(p, path.join(ANCIENS, 'v3.3-muscles-perso.json'), 'irepl');
  assert.deepEqual((await donnees(p)).mu, { 'Presse maison': 'Jambes', 'Tirage du garage': 'Dos' });
  assert.deepEqual(p.erreurs, []);
});

test('fichier de sauvegarde v3.3 : « Fusionner » ajoute les choix manquants sans écraser les miens', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('m3', 1)], mu: { 'Presse maison': 'Fessiers' } });
  await importer(p, path.join(ANCIENS, 'v3.3-muscles-perso.json'), 'imerge');
  assert.deepEqual((await donnees(p)).mu, { 'Presse maison': 'Fessiers', 'Tirage du garage': 'Dos' });
});

test('le fichier de sauvegarde créé par l’app contient les choix de muscles', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('m4', 1)], mu: { 'Presse maison': 'Jambes' } });
  await p.click('nav [data-tab=histo]');
  await p.click('[data-act=data]');
  await p.waitForSelector('#sheet [data-act=file]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#sheet [data-act=file]')]);
  const f = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  assert.deepEqual(f.data.mu, { 'Presse maison': 'Jambes' });
});

/* ===== Interface : choisir le muscle d'un exercice perso ===== */
async function creerPerso(p, nom) {
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.fill('#pq', nom);
  await p.click(`#pl [data-act=padd][data-n="${nom}"]`);
  await p.waitForTimeout(200);
}

test('créer un exercice perso : l’app demande son muscle, et la séance l’affiche', async () => {
  const p = await A.page();
  p.reponses.push('Jambes');
  await creerPerso(p, 'Presse maison');
  assert.ok((await p.vus()).some(v => /Quel muscle/.test(v)), 'la question est posée');
  assert.deepEqual((await donnees(p)).mu, { 'Presse maison': 'Jambes' });
  assert.match(await p.textContent('[data-act=pmu][data-i="0"]'), /Jambes/);
  assert.deepEqual(p.erreurs, []);
});

test('« Plus tard » : l’exercice reste « Perso », et on peut choisir son muscle ensuite depuis la séance', async () => {
  const p = await A.page();
  p.reponses.push(false);
  await creerPerso(p, 'Tirage du garage');
  assert.deepEqual((await donnees(p)).mu, {});
  assert.match(await p.textContent('[data-act=pmu][data-i="0"]'), /Perso/);
  p.reponses.push('Dos');
  await p.click('[data-act=pmu][data-i="0"]');
  await p.waitForTimeout(200);
  assert.deepEqual((await donnees(p)).mu, { 'Tirage du garage': 'Dos' });
  assert.match(await p.textContent('[data-act=pmu][data-i="0"]'), /Dos/);
  assert.deepEqual(p.erreurs, []);
});

test('un exercice du catalogue ne pose aucune question et son groupe ne se modifie pas', async () => {
  const p = await A.page();
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.waitForTimeout(200);
  assert.ok(!(await p.vus()).some(v => /Quel muscle/.test(v)));
  assert.equal(await p.locator('[data-act=pmu]').count(), 0);
  assert.match(await p.textContent('.ex-head .mu'), /Jambes/);
});

test('un exercice perso déjà rangé apparaît dans son groupe dans la liste, et ne redemande rien', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('m5', 2, { exercises: [{ name: 'Presse maison', sets: [{ kg: '100', reps: '10', done: true }] }] })], mu: { 'Presse maison': 'Jambes' } });
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('[data-act=pm][data-m="Jambes"]');
  assert.equal(await p.locator('#pl [data-act=padd][data-n="Presse maison"]').count(), 1, 'visible dans Jambes');
  await p.click('#pl [data-act=padd][data-n="Presse maison"]');
  await p.waitForTimeout(200);
  assert.ok(!(await p.vus()).some(v => /Quel muscle/.test(v)));
});

test('Stats : la répartition par groupe range l’exercice perso dans le groupe choisi', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('m6', 2, { exercises: [{ name: 'Presse maison', sets: [{ kg: '100', reps: '10', done: true }] }] })], mu: { 'Presse maison': 'Jambes' } });
  await p.click('nav [data-tab=stats]');
  const txt = await p.textContent('#app');
  assert.match(txt, /Répartition par groupe[\s\S]*Jambes/);
  assert.doesNotMatch(txt, /Répartition par groupe[\s\S]*Perso/);
});
