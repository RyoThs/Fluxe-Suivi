/* v3.17 : Historique « pro ».
   - séances rangées par semaine (« Cette semaine », « Semaine du 16 nov. ») avec nombre et volume ;
   - chaque carte : titre selon les muscles, date courte, durée / volume / records, liste compacte (repère du muscle, 🏆) ;
   - actions dans un menu « ··· » ; bouton « Sauvegarde » en haut (point orange s'il reste des séances à sauvegarder) ;
   - « Partager » fabrique une image de la séance sur le téléphone. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE, JOUR } = require('./outils');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let R, A;
test.before(async () => {
  R = await import(url('resume-seance.js'));
  A = await demarrer();
});
test.after(async () => { await A.fermer(); });
const st = (kg, reps, w) => ({ kg: String(kg), reps: String(reps), done: true, ...(w ? { w: true } : {}) });
const JEUDI = new Date(2026, 10, 26, 18, 0).getTime(); // jeudi 26 novembre 2026

test('resume : titre selon les muscles, date courte, durée, volume en tonnes, liste compacte', () => {
  const s = { id: 'a', date: JEUDI, dur: 58, gn: 'Basic-Fit Lyon', exercises: [
    { name: 'Développé couché', sets: [st(40, 10, true), st(70, 8), st(72.5, 6), st(72.5, 6)] },
    { name: 'Écarté poulie', sets: [st(15, 12), st(15, 12)] },
    { name: 'Squat', sets: [st(100, 5)] },
    { name: 'Vélo', cardio: true, sets: [{ min: '15', km: '5', kcal: '120', done: true }] },
    { name: 'Tractions', sets: [{ kg: '', reps: '', done: false }] }, // rien de fait : pas affiché
  ] };
  const r = R.resume(s, [s]);
  assert.equal(r.titre, 'Pectoraux · Jambes · Cardio', 'groupes les plus travaillés (2 max) puis Cardio');
  assert.equal(r.date, 'Jeudi 26 nov. · Basic-Fit Lyon');
  assert.equal(r.duree, '58 min');
  assert.equal(r.volume, '2,3 t', '70×8 + 72,5×6×2 + 15×12×2 + 100×5 = 2 290 kg, échauffement exclu');
  assert.deepEqual(r.exercices.map(e => [e.code, e.nom, e.ligne]), [
    ['PEC', 'Développé couché', '3 séries · 72,5 kg × 6'],
    ['PEC', 'Écarté poulie', '2 séries · 15 kg × 12'],
    ['JAM', 'Squat', '1 série · 100 kg × 5'],
    ['CAR', 'Vélo', '15 min · 5 km · 120 kcal'],
  ]);
});

test('resume : petit volume en kg, pas de durée, séance sans muscu', () => {
  const s = { id: 'b', date: JEUDI, exercises: [{ name: 'Curl haltères', sets: [st(12, 10)] }] };
  const r = R.resume(s, [s]);
  assert.equal(r.volume, '120 kg');
  assert.equal(r.duree, '—');
  assert.equal(r.date, 'Jeudi 26 nov.');
  const c = { id: 'c', date: JEUDI, exercises: [{ name: 'Tapis de course', cardio: true, sets: [{ min: '30', km: '', kcal: '', done: true }] }] };
  assert.equal(R.resume(c, [c]).titre, 'Cardio');
  assert.equal(R.resume(c, [c]).volume, '0 kg');
});

test('records : une série plus lourde que toutes les séances d’AVANT ; la 1re fois ne compte pas', () => {
  const av1 = { id: 'v1', date: JEUDI - 7 * JOUR, exercises: [{ name: 'Squat', sets: [st(95, 5)] }, { name: 'Leg curl', sets: [st(40, 12)] }] };
  const s = { id: 's', date: JEUDI, exercises: [
    { name: 'Squat', sets: [st(100, 3)] },        // record (plus lourd)
    { name: 'Leg curl', sets: [st(40, 12)] },     // égalité : pas record
    { name: 'Presse à cuisses', sets: [st(180, 10)] }, // 1re fois : pas record
  ] };
  const apres = { id: 'ap', date: JEUDI + 2 * JOUR, exercises: [{ name: 'Squat', sets: [st(110, 1)] }] }; // plus tard : ne change pas le passé
  const r = R.resume(s, [apres, s, av1]);
  assert.equal(r.records, 1);
  assert.deepEqual(r.exercices.map(e => e.record), [true, false, false]);
});

test('semaines : « Cette semaine », puis « Semaine du … », avec nombre de séances et volume', () => {
  const lundi = new Date(2026, 10, 23).getTime();
  const l = [
    { id: '1', date: lundi + 3 * JOUR, exercises: [{ name: 'Squat', sets: [st(100, 10)] }] },
    { id: '2', date: lundi + 1 * JOUR, exercises: [{ name: 'Squat', sets: [st(100, 10)] }] },
    { id: '3', date: lundi - 2 * JOUR, exercises: [{ name: 'Squat', sets: [st(50, 10)] }] },
  ];
  const sem = R.semaines(l, lundi + 4 * JOUR);
  assert.deepEqual(sem.map(w => [w.titre, w.info, w.seances.map(x => x.id)]), [
    ['Cette semaine', '2 séances · 2 t', ['1', '2']],
    ['Semaine du 16 nov.', '1 séance · 500 kg', ['3']],
  ]);
});

/* ===== L'écran ===== */
const il = (id, jours, exercises, plus = {}) => ({ id, date: Date.now() - jours * JOUR, dur: 50, exercises, ...plus });
const QUATRE = [
  { name: 'Développé couché', sets: [st(70, 8)] }, { name: 'Écarté poulie', sets: [st(15, 12)] },
  { name: 'Pec deck (papillon)', sets: [st(40, 12)] }, { name: 'Pompes', sets: [st(0, 20)] },
];
const ouvrirHisto = async (p, d) => { await donner(p, d); await p.click('nav [data-tab=histo]'); };

test('écran : semaines, cartes avec titre, 3 chiffres et liste compacte ; actions cachées dans « ··· »', async () => {
  const p = await A.page();
  await ouvrirHisto(p, { ...VIDE, sessions: [il('a', 0, QUATRE), il('b', 8, [{ name: 'Squat', sets: [st(100, 5)] }])] });
  assert.ok(await p.locator('.hx-sem').count() >= 1, 'en-têtes de semaine');
  assert.match(await p.textContent('.hx-sem'), /Cette semaine/);
  assert.equal(await p.locator('.hx-c').count(), 2, 'une carte par séance');
  assert.equal(await p.textContent('.hx-c[data-id=a] .hx-t'), 'Pectoraux');
  assert.deepEqual(await p.$$eval('.hx-c[data-id=a] .hx-k span', l => l.map(e => e.textContent)), ['durée', 'volume', 'record']);
  assert.equal(await p.locator('.hx-c[data-id=a] .hx-e').count(), 3, '3 exercices montrés');
  assert.match(await p.textContent('.hx-c[data-id=a] [data-act=hplus]'), /\+ 1 autre exercice/);
  for (const act of ['editsess', 'delsess', 'mkr', 'hpart'])
    assert.equal(await p.locator(`[data-act=${act}]`).count(), 0, act + ' caché tant que le menu est fermé');
  await p.click('[data-act=hmenu][data-id=a]');
  assert.deepEqual(await p.$$eval('.hx-menu button', l => l.map(b => b.dataset.act)), ['editsess', 'mkr', 'hpart', 'delsess']);
  assert.equal(await p.getAttribute('[data-act=hmenu][data-id=a]', 'aria-expanded'), 'true');
  await p.click('h1'); // toucher ailleurs ferme le menu
  assert.equal(await p.locator('.hx-menu').count(), 0);
  await p.click('.hx-c[data-id=a] [data-act=hplus]');
  assert.equal(await p.locator('.hx-c[data-id=a] .hx-e').count(), 4, '« + 1 autre exercice » déplie la liste');
  assert.deepEqual(p.erreurs, []);
});

test('menu « ··· » : Modifier, Créer une routine et Supprimer marchent comme avant', async () => {
  const p = await A.page();
  await ouvrirHisto(p, { ...VIDE, sessions: [il('a', 1, QUATRE), il('b', 2, [{ name: 'Squat', sets: [st(100, 5)] }])] });
  await p.click('[data-act=hmenu][data-id=b]');
  await p.click('.hx-menu [data-act=delsess]');
  await p.waitForTimeout(150);
  assert.deepEqual((await donnees(p)).sessions.map(s => s.id), ['a'], 'b à la corbeille');
  p.reponses.push('Poitrine');
  await p.click('[data-act=hmenu][data-id=a]');
  await p.click('.hx-menu [data-act=mkr]');
  await p.waitForTimeout(150);
  assert.deepEqual((await donnees(p)).routines.map(r => r.name), ['Poitrine']);
  await p.click('[data-act=hmenu][data-id=a]');
  await p.click('.hx-menu [data-act=editsess]');
  assert.equal(await p.getAttribute('nav [data-tab=seance]', 'aria-current'), 'true', 'la séance s’ouvre pour être modifiée');
  assert.deepEqual(p.erreurs, []);
});

test('bouton « Sauvegarde » en haut : point orange s’il reste des séances à sauvegarder, ouvre Mes données', async () => {
  const p = await A.page();
  await ouvrirHisto(p, { ...VIDE, sessions: [il('a', 1, QUATRE)] });
  assert.equal(await p.locator('.hx-h [data-act=data]').count(), 1, 'à côté du titre');
  assert.equal(await p.locator('.hx-h [data-act=data] .pt').count(), 1, 'point orange : pas encore de fichier');
  assert.equal(await p.locator('#app h2', { hasText: 'Mes données' }).count(), 0, 'plus de rubrique en bas de page');
  await donner(p, { ...VIDE, sessions: [il('a', 1, QUATRE)], lastBackup: Date.now() });
  await p.click('nav [data-tab=histo]');
  assert.equal(await p.locator('.hx-h [data-act=data] .pt').count(), 0, 'tout est sauvegardé : pas de point');
  await p.click('[data-act=data]');
  await p.waitForSelector('#sheet [data-act=file]');
  assert.deepEqual(p.erreurs, []);
});

test('sans séance : message, et le bouton « Sauvegarde » reste là (pour importer un fichier)', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=histo]');
  assert.match(await p.textContent('#app'), /Tes séances terminées apparaîtront ici/);
  assert.equal(await p.locator('.hx-h [data-act=data]').count(), 1);
  assert.deepEqual(p.erreurs, []);
});

/* ===== Partager (image fabriquée sur le téléphone) ===== */
test('Partager : une image PNG de la séance part dans le menu de partage du téléphone', async () => {
  const p = await A.page();
  await p.addInitScript(() => {
    window.__partage = null;
    navigator.canShare = d => !!(d && d.files && d.files.length);
    navigator.share = async d => { const f = d.files[0]; window.__partage = { nom: f.name, type: f.type, taille: f.size, titre: d.title }; };
  });
  await ouvrirHisto(p, { ...VIDE, sessions: [il('a', 0, QUATRE)] });
  await p.click('[data-act=hmenu][data-id=a]');
  await p.click('.hx-menu [data-act=hpart]');
  await p.waitForFunction(() => window.__partage);
  const r = await p.evaluate(() => window.__partage);
  assert.match(r.nom, /^fluxe-seance-\d{4}-\d{2}-\d{2}\.png$/);
  assert.equal(r.type, 'image/png');
  assert.ok(r.taille > 10000, 'une vraie image (' + r.taille + ' octets)');
  assert.match(r.titre, /Pectoraux/);
  assert.deepEqual(p.erreurs, []);
});

test('Partager sans menu de partage (ordinateur) : l’image est enregistrée', async () => {
  const p = await A.page();
  await p.addInitScript(() => { delete Navigator.prototype.share; delete Navigator.prototype.canShare; });
  await ouvrirHisto(p, { ...VIDE, sessions: [il('a', 0, QUATRE)] });
  await p.click('[data-act=hmenu][data-id=a]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.hx-menu [data-act=hpart]')]);
  assert.match(dl.suggestedFilename(), /^fluxe-seance-.*\.png$/);
  assert.deepEqual(p.erreurs, []);
});

test('Partager annulé par l’utilisateur : aucun message d’erreur', async () => {
  const p = await A.page();
  await p.addInitScript(() => {
    navigator.canShare = () => true;
    navigator.share = async () => { throw new DOMException('annulé', 'AbortError'); };
  });
  await ouvrirHisto(p, { ...VIDE, sessions: [il('a', 0, QUATRE)] });
  await p.click('[data-act=hmenu][data-id=a]');
  await p.click('.hx-menu [data-act=hpart]');
  await p.waitForTimeout(800);
  assert.equal(await p.locator('#toast.on').count(), 0, 'pas de message');
  assert.deepEqual(p.erreurs, []);
});
