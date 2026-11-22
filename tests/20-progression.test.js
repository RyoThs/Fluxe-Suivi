/* Ma progression (v3.4.0) : le mannequin qui se colore selon ta progression réelle.
   Niveau d'un muscle = moitié Régularité (les séries, sur la durée) + moitié Force (les charges qui montent).
   La carte s'ajoute en haut des Stats : rien n'est retiré. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, VIDE, JOUR } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

const serie = (kg, reps, extra = {}) => ({ kg: String(kg), reps: String(reps), done: true, ...extra });
/* séance « il y a N jours » avec des exercices [nom, [séries]] */
const sea = (id, ilYa, exos) => ({ id, date: Date.now() - ilYa * JOUR, dur: 50, exercises: exos.map(([name, sets]) => ({ name, sets })) });
const AVEC_CARDIO = { ...VIDE, sessions: [
  sea('c1', 3, [['Squat', [serie(100, 8), serie(100, 8)]], ['Développé couché', [serie(70, 8)]]]),
  { id: 'c2', date: Date.now() - 2 * JOUR, dur: 30, exercises: [{ name: 'Tapis de course', cardio: true, sets: [{ min: '20', km: '3', kcal: '200', done: true }] }] },
] };

/* Cycle 0 — caractérisation : les cartes actuelles des Stats, dans l'ordre. Elles doivent rester après la v3.4. */
test('Stats : les cartes existantes sont toutes là, dans le même ordre (chiffres, volume, progression, répartition, cardio, records)', async () => {
  const p = await A.page();
  await donner(p, AVEC_CARDIO);
  await p.click('nav [data-tab=stats]');
  const titres = await p.$$eval('#app .card .hist-date', l => l.map(x => x.textContent.trim()));
  const attendus = ['Volume par semaine', 'Progression par exercice', 'Répartition par groupe', 'Cardio', 'Records'];
  assert.deepEqual(titres.filter(t => attendus.includes(t)), attendus);
  assert.equal(await p.locator('#app .stats').first().isVisible(), true, 'le bandeau de chiffres');
  assert.deepEqual(p.erreurs, []);
});

/* ===== Cycle 1 : le calcul (js/progression.js) ===== */
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let P;
test.before(async () => { P = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'progression.js')).href); });
const S7 = 7 * JOUR;
/* N semaines d'entraînement, une séance par semaine, finies il y a « fin » jours */
function semaines(n, exos, fin = 1) {
  return [...Array(n)].map((_, k) => sea('w' + k, fin + (n - 1 - k) * 7, typeof exos === 'function' ? exos(k) : exos));
}
const pecs12 = [['Développé couché', [...Array(4)].map(() => serie(70, 8))], ['Pec deck (papillon)', [...Array(4)].map(() => serie(40, 12))], ['Écarté poulie', [...Array(4)].map(() => serie(15, 12))]];

test('aucune séance : tout est à 0, palier Débutant', () => {
  const r = P.progression([], {});
  assert.equal(r.global, 0);
  assert.equal(r.palier, 'Débutant');
  assert.equal(r.muscles.pec.niveau, 0);
});

test('réaliste : une séance de 3 exercices (12 séries) ne remplit pas le mannequin (pectoraux sous 5 %)', () => {
  const r = P.progression([sea('a', 1, pecs12)], {});
  assert.ok(r.muscles.pec.niveau > 0 && r.muscles.pec.niveau < 0.05, String(r.muscles.pec.niveau));
  assert.equal(r.muscles.quad.niveau, 0, 'un muscle non travaillé reste à 0');
});

test('régularité : vite au début puis de plus en plus lentement (12 séries par semaine : 1 an ≈ 40 %, 3 ans ≈ 70 %)', () => {
  const an = P.progression(semaines(52, pecs12), {}).muscles.pec.regularite;
  const trois = P.progression(semaines(156, pecs12), {}).muscles.pec.regularite;
  assert.ok(an > 0.33 && an < 0.5, 'un an : ' + an);
  assert.ok(trois > 0.62 && trois < 0.8, 'trois ans : ' + trois);
  assert.ok(trois - an < an, 'les 2 années suivantes rapportent moins que la première');
});

test('régularité : au-delà de 20 séries par semaine, ça ne sert plus à rien (pas de triche)', () => {
  const vingt = [['Développé couché', [...Array(20)].map(() => serie(70, 8))]];
  const cinquante = [['Développé couché', [...Array(50)].map(() => serie(70, 8))]];
  assert.equal(P.progression(semaines(20, vingt), {}).muscles.pec.regularite, P.progression(semaines(20, cinquante), {}).muscles.pec.regularite);
});

test('les muscles secondaires comptent pour moitié ; échauffement, séries non validées et cardio ne comptent pas', () => {
  const r = P.progression(semaines(10, [['Développé couché', [...Array(8)].map(() => serie(70, 8))]]), {}).muscles;
  assert.ok(r.tri.regularite > 0 && r.tri.regularite < r.pec.regularite, 'triceps (secondaire) < pectoraux');
  const rien = P.progression([sea('b', 1, [['Développé couché', [serie(40, 10, { w: true }), { kg: '70', reps: '8', done: false }]], ['Tapis de course', [{ min: '20', done: true }]]])], {});
  assert.equal(rien.muscles.pec.niveau, 0);
  assert.equal(rien.global, 0);
});

test('un muscle laissé de côté se décolore très lentement (mémoire musculaire)', () => {
  const avant = P.progression(semaines(52, pecs12, 1), {}).muscles.pec.regularite;
  const pause = P.progression(semaines(52, pecs12, 1 + 12 * 7), {}).muscles.pec.regularite;
  assert.ok(pause < avant, 'baisse');
  assert.ok(pause > avant * 0.85, 'mais peu : ' + pause + ' / ' + avant);
});

test('force : développé couché 70 → 97,5 kg : la force des pectoraux suit le gain (+39 %), et baisse si les charges baissent', () => {
  const monte = semaines(30, k => [['Développé couché', [serie(70 + (k * 27.5) / 29, 8)]]]);
  const f = P.progression(monte, {}).muscles.pec;
  const gain = (97.5 * (1 + 8 / 30)) / (70 * (1 + 8 / 30)) - 1;
  assert.ok(Math.abs(f.force - gain / (gain + 0.75)) < 0.01, 'force ' + f.force);
  assert.equal(f.exo.nom, 'Développé couché');
  assert.equal(Math.round(f.exo.gain * 100), 39);
  /* les mêmes 30 semaines, puis 10 semaines plus récentes à 80 kg seulement */
  const baisse = [...semaines(30, k => [['Développé couché', [serie(70 + (k * 27.5) / 29, 8)]]], 1 + 10 * 7), ...semaines(10, [['Développé couché', [serie(80, 8)]]], 1)];
  assert.ok(P.progression(baisse, {}).muscles.pec.force < f.force);
});

test('niveau d’un muscle = moitié régularité + moitié force ; un nouveau record fait monter le niveau', () => {
  const m = P.progression(semaines(30, k => [['Développé couché', [serie(70 + k, 8), serie(70, 8), serie(70, 8)]]]), {}).muscles.pec;
  assert.ok(Math.abs(m.niveau - (m.regularite + m.force) / 2) < 1e-9);
  const sansRecord = P.progression(semaines(30, [['Développé couché', [serie(70, 8), serie(70, 8), serie(70, 8)]]]), {}).muscles.pec;
  assert.ok(m.niveau > sansRecord.niveau);
});

test('un exercice perso colore les muscles du groupe choisi', () => {
  const r = P.progression(semaines(8, [['Presse maison', [serie(100, 10), serie(100, 10)]]]), { 'Presse maison': 'Jambes' }).muscles;
  assert.ok(r.quad.niveau > 0 && r.isch.niveau > 0);
  assert.equal(P.progression(semaines(8, [['Presse maison', [serie(100, 10)]]]), {}).muscles.quad.niveau, 0);
});

test('paliers : Débutant < 20 % ≤ Intermédiaire < 50 % ≤ Avancé < 80 % ≤ Élite', () => {
  assert.deepEqual([0, 0.19, 0.2, 0.49, 0.5, 0.79, 0.8, 1].map(P.palier), ['Débutant', 'Débutant', 'Intermédiaire', 'Intermédiaire', 'Avancé', 'Avancé', 'Élite', 'Élite']);
});

test('couleurs (palette B « Fluxe intense ») : gris à 0, turquoise, bleu, indigo, violet, magenta à 100 %', () => {
  assert.equal(P.couleur(0), '#d6dbe7');
  assert.equal(P.couleur(0.12), '#5eead4');
  assert.equal(P.couleur(0.4), '#38bdf8');
  assert.equal(P.couleur(0.65), '#6366f1');
  assert.equal(P.couleur(0.85), '#9333ea');
  assert.equal(P.couleur(1), '#db2777');
});

test('calcul rapide : 5 ans de séances (750 séances) en moins de 300 ms', () => {
  const l = [...Array(750)].map((_, k) => sea('r' + k, 1 + k * 2.4, pecs12));
  const t = Date.now();
  P.progression(l, {});
  assert.ok(Date.now() - t < 300, (Date.now() - t) + ' ms');
});

/* ===== Cycle 2 : la carte « Ma progression » (mannequin) en haut des Stats ===== */
const fs = require('node:fs');
const { lire } = require('./outils');
const legExt = n => semaines(n, [['Leg extension', [serie(50, 10), serie(50, 10), serie(50, 10)]]]);
const GRIS = '#d6dbe7';
const fillDe = (p, code) => p.$eval(`#mp [data-m="${code}"] path`, e => e.getAttribute('fill'));

test('chaque muscle a son dessin sur le mannequin (face ou dos), et le dessin est crédité (licence MIT)', async () => {
  const MUS = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'muscles.js')).href);
  const D = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'mannequin.js')).href);
  for (const [code, m] of Object.entries(MUS.MUSCLES))
    assert.ok((D.TRACES.face[m.dessin] || []).length + (D.TRACES.dos[m.dessin] || []).length > 0, code + ' sans dessin');
  assert.match(lire('js/mannequin.js'), /MIT License[\s\S]*Luca Wahlen/);
  assert.match(lire('confidentialite.html'), /Luca Wahlen[\s\S]*MIT/);
});

test('la carte « Ma progression » arrive en premier dans les Stats, avec le mannequin de face et de dos ; les autres cartes restent', async () => {
  const p = await A.page();
  await donner(p, AVEC_CARDIO);
  await p.click('nav [data-tab=stats]');
  const premiere = await p.$eval('#app .card', e => e.id);
  assert.equal(premiere, 'mp');
  assert.match(await p.textContent('#mp'), /Ma progression/);
  assert.equal(await p.locator('#mp svg.corps').count(), 2);
  const titres = await p.$$eval('#app .card .hist-date', l => l.map(x => x.textContent.trim()));
  for (const t of ['Volume par semaine', 'Progression par exercice', 'Répartition par groupe', 'Cardio', 'Records']) assert.ok(titres.includes(t), t);
  assert.deepEqual(p.erreurs, []);
});

test('le mannequin se colore seulement sur les muscles travaillés (leg extension → quadriceps, pas les pectoraux)', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: legExt(20) });
  await p.click('nav [data-tab=stats]');
  assert.notEqual(await fillDe(p, 'quad'), GRIS);
  assert.equal(await fillDe(p, 'pec'), GRIS);
  assert.match(await p.textContent('#mp'), /\d+ %/);
  assert.match(await p.textContent('#mp'), /Débutant/);
});

test('toucher un muscle montre son niveau, sa régularité (séries) et sa force (exercice, charges)', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: semaines(20, k => [['Leg extension', [serie(50 + k, 10), serie(50, 10)]]]) });
  await p.click('nav [data-tab=stats]');
  await p.click('#mp [data-m="quad"] path.m >> nth=0'); // sur le muscle lui-même (le centre du groupe est l'espace entre les jambes)
  const det = await p.textContent('#mp .mpd');
  assert.match(det, /Quadriceps/);
  assert.match(det, /Régularité[\s\S]*40 séries/);
  assert.match(det, /Force[\s\S]*Leg extension/);
  assert.equal(await p.locator('#mp [data-m="quad"].sel').count(), 1, 'le muscle touché est entouré');
  assert.deepEqual(p.erreurs, []);
});

test('une ancienne sauvegarde (v2.1) s’affiche aussi sur le mannequin, sans erreur', async () => {
  const p = await A.page();
  const f = JSON.parse(fs.readFileSync(path.join(__dirname, 'anciennes-sauvegardes', 'v2.1-format3.json'), 'utf8'));
  await donner(p, f.data);
  await p.click('nav [data-tab=stats]');
  assert.notEqual(await fillDe(p, 'dors'), GRIS, 'tractions et rowing colorent le dos');
  assert.deepEqual(p.erreurs, []);
});
