/* Fichiers de sauvegarde : créer, recharger, fusionner, et relire les anciens formats. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { demarrer, donner, donnees, seance, lire, VIDE } = require('./outils');

const VER = lire('app.js').match(/VER='([\d.]+)'/)[1];
const ANCIENS = path.join(__dirname, 'anciennes-sauvegardes');
let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

/* Ouvre l'écran Sauvegarde (Historique → 🛟) */
async function ecranSauvegarde(p) {
  await p.click('nav [data-tab=histo]');
  await p.click('[data-act=data]');
  await p.waitForSelector('#sheet [data-act=file]');
}
/* Crée le fichier de sauvegarde et renvoie son contenu */
async function sauvegarder(p) {
  await ecranSauvegarde(p);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#sheet [data-act=file]')]);
  return { nom: dl.suggestedFilename(), contenu: JSON.parse(fs.readFileSync(await dl.path(), 'utf8')) };
}
/* Importe un fichier, puis choisit « Fusionner » ou « Remplacer » */
async function importer(p, fichier, choix) {
  await ecranSauvegarde(p);
  await p.setInputFiles('#fi', fichier);
  await p.waitForSelector(`[data-act=${choix}]`);
  if (choix === 'irepl') p.reponses.push(true);
  await p.click(`[data-act=${choix}]`);
  await p.waitForTimeout(300);
}
const fichierTemp = (nom, obj) => ({ name: nom, mimeType: 'application/json', buffer: Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)) });

test('le fichier de sauvegarde contient toutes les séances, au bon format', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('s1', 3), seance('s2', 1)], notes: { 'k:squat': 'Barre haute' } });
  const { nom, contenu } = await sauvegarder(p);
  assert.match(nom, /^fluxe-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
  assert.equal(contenu.app, 'fluxe-suivi');
  assert.equal(contenu.format, 3);
  assert.equal(contenu.version, VER);
  assert.deepEqual(contenu.data.sessions.map(s => s.id), ['s1', 's2']);
  assert.equal(contenu.data.notes['k:squat'], 'Barre haute');
  assert.ok((await donnees(p)).lastBackup > 0, 'la date de sauvegarde est notée');
  assert.deepEqual(p.erreurs, []);
});

test('aller-retour : un fichier rechargé sur un autre téléphone redonne exactement les mêmes séances', async () => {
  const p1 = await A.page();
  const avant = { ...VIDE, sessions: [seance('r1', 5), seance('r2', 2, { mod: Date.now() })], routines: [{ name: 'Push', exercises: ['Développé couché'] }] };
  await donner(p1, avant);
  const { contenu } = await sauvegarder(p1);
  const p2 = await A.page(); // « nouveau téléphone », vide
  await importer(p2, fichierTemp('s.json', contenu), 'irepl');
  const apres = await donnees(p2);
  assert.deepEqual(apres.sessions, (await donnees(p1)).sessions);
  assert.deepEqual(apres.routines, avant.routines);
  assert.deepEqual([...p1.erreurs, ...p2.erreurs], []);
});

test('un fichier de la v2.0 (ancien format) se recharge sans perte', async () => {
  const p = await A.page();
  await importer(p, path.join(ANCIENS, 'v2.0-texte-brut.json'), 'irepl');
  const d = await donnees(p);
  assert.equal(d.sessions.length, 2);
  assert.equal(d.sessions[0].exercises[1].sets[0].kg, '180');
  const cardio = d.sessions[1].exercises[1];
  assert.equal(cardio.cardio, true);
  assert.deepEqual([cardio.sets[0].min, cardio.sets[0].km], ['15', '2.5']);
  assert.equal(d.routines[0].name, 'Jambes');
  assert.equal(d.notes['k:squat'], 'Barre haute');
  assert.equal(d.rest, 90);
  assert.deepEqual(p.erreurs, []);
});

test('un fichier de la v2.1 se fusionne avec les séances du téléphone, sans rien effacer', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('local1', 1)] });
  await importer(p, path.join(ANCIENS, 'v2.1-format3.json'), 'imerge');
  const d = await donnees(p);
  assert.deepEqual(d.sessions.map(s => s.id).sort(), ['local1', 'mx9k1a', 'mx9k1b']);
  assert.equal(d.gyms[0].name, 'On Air Lyon');
  assert.equal(d.gyms[0].notes['k:tractions'], 'Prise large');
  assert.equal(d.sessions.find(s => s.id === 'mx9k1a').exercises[0].sets[1].w, true, 'série d’échauffement gardée');
  assert.deepEqual(p.erreurs, []);
});

test('règles de fusion : la version la plus récente gagne, la corbeille et la séance en cours sont respectées', async () => {
  const p = await A.page();
  const t = Date.now();
  const loc = (id, reps, mod) => seance(id, 3, { mod, exercises: [{ name: 'Squat', sets: [{ kg: '100', reps, done: true }] }] });
  await donner(p, {
    ...VIDE,
    sessions: [loc('recente', '8', t - 5000), loc('ancienne', '8', t - 5000)],
    trash: [{ at: t - 1000, s: seance('jetee', 4) }],
  });
  const fichier = { ...VIDE, current: 'encours', sessions: [
    loc('recente', '12', t),          // plus récente dans le fichier → doit remplacer
    loc('ancienne', '3', t - 99999),  // plus vieille dans le fichier → ne doit PAS remplacer
    seance('jetee', 4),               // jetée sur ce téléphone → ne revient pas
    seance('encours', 0),             // en cours dans le fichier → ignorée
    seance('nouvelle', 2),            // inconnue → ajoutée
  ] };
  await importer(p, fichierTemp('f.json', fichier), 'imerge');
  const d = await donnees(p), reps = id => d.sessions.find(s => s.id === id)?.exercises[0].sets[0].reps;
  assert.equal(reps('recente'), '12');
  assert.equal(reps('ancienne'), '8');
  assert.equal(reps('jetee'), undefined);
  assert.equal(reps('encours'), undefined);
  assert.equal(reps('nouvelle'), '8');
});

test('un fichier qui n’est pas une sauvegarde est refusé et rien ne change', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('garde', 1)] });
  const avant = await donnees(p);
  let alerte = '';
  p.removeAllListeners('dialog');
  p.on('dialog', async d => { alerte = d.message(); await d.accept(); });
  await ecranSauvegarde(p);
  await p.setInputFiles('#fi', fichierTemp('photo.json', '{"bonjour": true}'));
  await p.waitForTimeout(300);
  assert.match(alerte, /pas une sauvegarde Fluxe valide/);
  assert.deepEqual(await donnees(p), avant);
});

test('avant de remplacer, une version de secours est créée', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('avant', 1)] });
  await importer(p, path.join(ANCIENS, 'v2.0-texte-brut.json'), 'irepl');
  await ecranSauvegarde(p);
  await p.waitForTimeout(300);
  const versions = await p.$$eval('#vl .vr span', l => l.map(x => x.textContent));
  assert.ok(versions.some(v => v.startsWith('Avant un import')), 'versions : ' + versions.join(' / '));
});
