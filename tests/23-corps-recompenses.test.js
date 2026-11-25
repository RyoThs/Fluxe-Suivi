/* v3.6.0 : semaines d'affilée, récompenses, Mon corps (poids et mensurations).
   - Une semaine va du lundi au dimanche ; elle compte dès qu'il y a au moins 1 séance.
     La semaine en cours ne casse pas la série tant qu'elle n'est pas finie.
   - 24 récompenses réalistes ; l'historique compte dès le départ ; une fenêtre annonce chaque nouvelle récompense
     (à la mise à jour, celles déjà gagnées sont notées sans fenêtre, pour ne pas en afficher dix d'un coup). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE, JOUR } = require('./outils');

let A, R;
test.before(async () => {
  A = await demarrer();
  R = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'recompenses.js')).href);
});
test.after(async () => { await A.fermer(); });

/* « maintenant » fixe : mercredi 18 novembre 2026, 12 h */
const NOW = new Date(2026, 10, 18, 12).getTime();
const fait = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });
const sea = (id, t, exos = [['Squat', [fait(100, 8)]]]) => ({ id, date: t, dur: 50, exercises: exos.map(([name, sets]) => ({ name, sets })) });
/* une séance le lundi de chaque semaine, de « debut » semaines avant jusqu'à « fin » (0 = cette semaine) */
const lundi = k => new Date(2026, 10, 16 - 7 * k, 10).getTime();
const hebdo = (debut, fin = 0) => [...Array(debut - fin + 1)].map((_, i) => sea('h' + i, lundi(debut - i)));

/* ===== Cycle 1 : le calcul ===== */
test('semaines d’affilée : 0 sans séance ; 10 avec une séance chaque semaine depuis 10 semaines (celle-ci comprise)', () => {
  assert.equal(R.semaines([], NOW).n, 0);
  assert.equal(R.semaines(hebdo(9, 0), NOW).n, 10);
});

test('la semaine en cours ne casse pas la série tant qu’elle n’est pas finie ; un trou la remet à zéro', () => {
  assert.equal(R.semaines(hebdo(10, 1), NOW).n, 10, 'pas encore de séance cette semaine : la série tient');
  const trou = [...hebdo(12, 5), ...hebdo(3, 0)]; /* rien il y a 4 semaines */
  const s = R.semaines(trou, NOW);
  assert.equal(s.n, 4);
  assert.equal(s.record, 8, 'meilleure série : 8 semaines');
});

test('chiffre affiché (demande de Yoann, v3.14.1) : 0 tant qu’il n’y a pas de séance cette semaine ; la vraie série reste pour les récompenses', () => {
  const sans = R.semaines(hebdo(10, 1), NOW);
  assert.equal(sans.affiche, 0, 'pas encore de séance cette semaine : 0 sur le bouton');
  assert.equal(sans.n, 10, 'la série continue quand même (récompenses, panneau)');
  assert.equal(R.semaines(hebdo(9, 0), NOW).affiche, 10, 'avec une séance cette semaine : la série');
  assert.equal(R.semaines([], NOW).affiche, 0);
});

test('le petit graphe : séances des 5 dernières semaines, de la plus ancienne à celle-ci', () => {
  const l = [...hebdo(6, 0), sea('x', lundi(0) + JOUR)]; /* 2 séances cette semaine */
  assert.deepEqual(R.semaines(l, NOW).barres, [1, 1, 1, 1, 2]);
});

test('24 récompenses, chacune avec un nom, une famille et une cible', () => {
  assert.equal(R.RECOMPENSES.length, 24);
  assert.equal(new Set(R.RECOMPENSES.map(r => r.id)).size, 24);
  for (const r of R.RECOMPENSES) assert.ok(r.titre && r.famille && r.cible > 0, r.id);
});

test('réaliste : 22 séances sur 11 semaines → 1re séance, 10 séances, 4 et 8 semaines ; pas 50 séances (22/50)', () => {
  const l = [];
  for (let k = 10; k >= 0; k--) l.push(sea('a' + k, lundi(k)), sea('b' + k, lundi(k) + 2 * JOUR));
  const t = R.tableau({ sessions: l, corps: [], mu: {} }, NOW);
  const v = id => t.find(x => x.id === id);
  for (const id of ['seance1', 'seance10', 'serie4', 'serie8']) assert.equal(v(id).ok, true, id);
  assert.equal(v('seance50').ok, false);
  assert.equal(v('seance50').valeur, 22);
  assert.equal(v('serie12').ok, false);
});

test('records : chaque série qui bat le meilleur poids précédent de l’exercice compte ; volume total en tonnes', () => {
  const l = [sea('r1', lundi(3), [['Squat', [fait(100, 8)]]]), sea('r2', lundi(2), [['Squat', [fait(105, 8)]]]), sea('r3', lundi(1), [['Squat', [fait(105, 6)]]]), sea('r4', lundi(0), [['Squat', [fait(110, 5)]]])];
  const t = R.tableau({ sessions: l, corps: [], mu: {} }, NOW);
  assert.equal(t.find(x => x.id === 'record1').valeur, 2, '105 puis 110 (la 1re séance sert de départ)');
  assert.equal(Math.round(t.find(x => x.id === 'tonnes10').valeur * 1000), Math.round((800 + 840 + 630 + 550)));
});

test('Mon corps : 1re pesée, 1res mensurations, 10 pesées', () => {
  const corps = [...Array(10)].map((_, i) => ({ t: NOW - i * 7 * JOUR, kg: 80 - i * 0.2 })).concat([{ t: NOW, taille: 82 }]);
  const t = R.tableau({ sessions: [], corps, mu: {} }, NOW);
  for (const id of ['pesee1', 'mesures1', 'pesee10']) assert.equal(t.find(x => x.id === id).ok, true, id);
});

test('nouvelles récompenses : celles obtenues qui n’ont pas encore été annoncées', () => {
  const t = R.tableau({ sessions: [sea('n', lundi(0))], corps: [], mu: {} }, NOW);
  assert.deepEqual(R.nouvelles(t, []).map(x => x.id), ['seance1']);
  assert.deepEqual(R.nouvelles(t, ['seance1']), []);
});

/* ===== Cycle 2 : les données (corps = pesées et mensurations, rv = récompenses déjà annoncées) ===== */
const fs = require('node:fs');
const ANCIENS = path.join(__dirname, 'anciennes-sauvegardes');
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
const forcer = async p => { await p.click('nav [data-tab=seance]'); await p.click('[data-act=start]'); };

test('données : pesées et mensurations valides gardées, valeurs absurdes écartées ; récompenses inconnues écartées', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [sea('d1', Date.now() - JOUR)], corps: [
    { t: 1763600000000, kg: 80.2, mg: 17 }, { t: 1763700000000, taille: 83, bras: 36.5 },
    { t: 'hier', kg: 80 }, { t: 1763800000000, kg: 4000 }, { t: 1763900000000, mg: 95 }, { t: 1764000000000 },
  ], rv: ['seance1', 'pirate', 42], rvInit: true }); /* appli déjà ouverte une fois : on ne teste ici que le nettoyage */
  await forcer(p);
  const d = await donnees(p);
  assert.deepEqual(d.corps, [{ t: 1763600000000, kg: 80.2, mg: 17 }, { t: 1763700000000, taille: 83, bras: 36.5 }]);
  assert.deepEqual(d.rv, ['seance1']);
  assert.deepEqual(p.erreurs, []);
});

test('fichier v3.6 : « Remplacer » reprend tout ; « Fusionner » ajoute les mesures manquantes sans doublon', async () => {
  let p = await A.page();
  await importer(p, path.join(ANCIENS, 'v3.6-corps.json'), 'irepl');
  let d = await donnees(p);
  assert.equal(d.corps.length, 3);
  assert.deepEqual(d.rv, ['seance1', 'pesee1']);
  p = await A.page();
  await donner(p, { ...VIDE, sessions: [sea('d2', Date.now() - JOUR)], corps: [{ t: 1763600000000, kg: 80.2, mg: 17 }, { t: 1764100000000, kg: 79 }], rv: ['seance1'] });
  await importer(p, path.join(ANCIENS, 'v3.6-corps.json'), 'imerge');
  d = await donnees(p);
  assert.equal(d.corps.length, 4, '2 à moi + 2 nouvelles du fichier (la pesée commune n’est pas doublée)');
  assert.deepEqual([...d.rv].sort(), ['pesee1', 'seance1']);
});

test('le fichier de sauvegarde créé par l’app contient les pesées, mensurations et récompenses', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [sea('d3', Date.now() - JOUR)], corps: [{ t: 1763600000000, kg: 80 }], rv: ['seance1'], rvInit: true });
  await p.click('nav [data-tab=histo]'); await p.click('[data-act=data]'); await p.waitForSelector('#sheet [data-act=file]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#sheet [data-act=file]')]);
  const f = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  assert.deepEqual(f.data.corps, [{ t: 1763600000000, kg: 80 }]);
  assert.deepEqual(f.data.rv, ['seance1']);
});

/* ===== Cycle 3 : les écrans ===== */
const trois = () => [0, 1, 2].map(k => sea('u' + k, Date.now() - k * 7 * JOUR - 3600000));

test('les semaines d’affilée : juste le chiffre et le mini-graphe, à droite du titre (accueil et Stats)', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: trois() });
  await p.click('nav [data-tab=seance]');
  assert.ok(await p.$('#app .titre-l h1 + #serie'), 'à droite du titre « Entraînement »');
  assert.equal((await p.textContent('#app #serie .big')).trim(), '3');
  assert.equal(await p.locator('#app #serie .sem i').count(), 5);
  assert.doesNotMatch(await p.textContent('#app #serie'), /semaine/i, 'aucun texte sur la carte');
  await p.click('nav [data-tab=stats]');
  assert.ok(await p.$('#app .titre-l h1 + #serie'), 'à droite du titre « Stats »');
  assert.equal(await p.$eval('#app .card', e => e.id), 'mp', 'le mannequin reste la 1re carte');
  assert.deepEqual(p.erreurs, []);
});

test('toucher la carte : tout est expliqué, et les 24 récompenses sont là (obtenues en couleur, les autres avec leur progression)', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: trois() });
  await p.click('nav [data-tab=stats]');
  await p.click('#serie');
  const txt = await p.textContent('#sheet');
  assert.match(txt, /3 semaines d’affilée/);
  assert.match(txt, /lundi au dimanche/);
  assert.match(txt, /5 dernières semaines/);
  assert.match(txt, /Record/);
  assert.equal(await p.locator('#sheet .med').count(), 24);
  assert.ok(await p.locator('#sheet .med.on, #sheet .med.or').count() >= 1, '1re séance obtenue');
  assert.match(txt, /3\/10/, 'progression vers 10 séances');
  assert.deepEqual(p.erreurs, []);
});

test('Mon corps : « + Pesée » enregistre le poids, la carte l’affiche avec l’évolution', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: trois(), corps: [{ t: Date.now() - 30 * JOUR, kg: 78.8 }] });
  await p.click('nav [data-tab=stats]');
  const ids = await p.$$eval('#app .card', l => l.map(e => e.id).filter(Boolean));
  assert.equal(ids[ids.indexOf('mp') + 1], 'corps', 'juste sous le mannequin');
  await p.click('#corps [data-act=cpes]');
  await p.fill('#cf-kg', '78,4');
  await p.click('#sheet [data-act=csave]');
  await p.waitForTimeout(200);
  const d = await donnees(p);
  assert.equal(d.corps.at(-1).kg, 78.4);
  const c = await p.textContent('#corps');
  assert.match(c, /78,4\s*kg/);
  assert.match(c, /−0,4 kg/);
  assert.deepEqual(p.erreurs, []);
});

test('Mon corps : « + Mensurations » enregistre les tours, une valeur absurde est refusée', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: trois() });
  await p.click('nav [data-tab=stats]');
  await p.click('#corps [data-act=cmes]');
  await p.fill('#cf-taille', '82');
  await p.fill('#cf-bras', '900');
  await p.click('#sheet [data-act=csave]');
  await p.waitForTimeout(200);
  const d = await donnees(p);
  assert.deepEqual(Object.keys(d.corps.at(-1)).sort(), ['t', 'taille']);
  assert.match(await p.textContent('#corps'), /Tour de taille[\s\S]*82 cm/);
});

test('pas de fenêtre automatique : à la fin de la 1re séance, la récompense est notée et brille en or dans le panneau', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=kg][data-i="0"][data-j="0"]', '60');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '10');
  await p.click('[data-act=chk][data-i="0"][data-j="0"]');
  p.reponses.push(true, true);
  await p.click('[data-act=finish]');
  await p.waitForTimeout(400);
  assert.ok(!(await p.vus()).some(v => /récompense/i.test(v)), 'aucune fenêtre de récompense');
  assert.ok((await donnees(p)).rv.includes('seance1'));
  await p.click('nav [data-tab=stats]');
  await p.click('#serie');
  assert.match(await p.textContent('#sheet .med.or + *, #sheet .rgrid div:has(.med.or)'), /1re séance/);
});

test('mise à jour avec un historique : les récompenses déjà gagnées sont notées sans fenêtre (pas dix d’un coup)', async () => {
  const p = await A.page();
  const l = [...Array(12)].map((_, k) => sea('m' + k, Date.now() - (k + 1) * 3 * JOUR));
  await donner(p, { ...VIDE, sessions: l });
  await p.click('nav [data-tab=stats]');
  await p.waitForTimeout(200);
  assert.ok(!(await p.vus()).some(v => /Nouvelle récompense/.test(v)));
  const d = await donnees(p);
  assert.ok(d.rv.includes('seance1') && d.rv.includes('seance10'), JSON.stringify(d.rv));
});

/* ===== Bug v3.14.1 : l'iPhone réveille l'app sans la recharger → l'indicateur restait sur l'ancienne semaine ===== */
test('l’app revient au premier plan une nouvelle semaine : la barre « cette semaine » repart à zéro, la série est recalculée', async () => {
  const p = await A.page();
  /* dimanche 22 novembre 2026 au soir : une séance lundi 16 et une semaine plus tôt */
  await p.clock.install({ time: new Date(2026, 10, 22, 20).getTime() });
  await donner(p, { ...VIDE, sessions: [sea('a', lundi(0)), sea('b', lundi(1))] });
  await p.click('nav [data-tab=seance]');
  const barres = () => p.$$eval('#app #serie .sem i', l => l.map(i => i.className === 'v' ? 0 : 1));
  assert.deepEqual(await barres(), [0, 0, 0, 1, 1], 'dimanche : la semaine en cours a sa séance');
  assert.equal((await p.textContent('#app #serie .big')).trim(), '2');
  /* l'app passe en arrière-plan… et revient le mardi suivant (nouvelle semaine) */
  await p.clock.setSystemTime(new Date(2026, 10, 24, 9).getTime());
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await p.waitForTimeout(100);
  assert.deepEqual(await barres(), [0, 0, 1, 1, 0], 'mardi : la barre de la nouvelle semaine est vide');
  assert.equal((await p.textContent('#app #serie .big')).trim(), '0', 'pas encore de séance cette semaine : 0 sur le bouton (demande de Yoann)');
  /* le panneau dit pareil, et rappelle la série qui attend une séance */
  await p.click('#app #serie');
  await p.waitForSelector('#sheet.on');
  assert.equal((await p.textContent('#sheet .ser2 .big')).trim(), '0');
  assert.match(await p.textContent('#sheet'), /Ta série de 2 semaines t’attend : fais une séance avant dimanche soir pour la continuer/);
  await p.click('#sheet [data-act=closepk]');
  /* et encore une semaine plus tard, sans séance : la série est cassée → 0 */
  await p.clock.setSystemTime(new Date(2026, 11, 1, 9).getTime());
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await p.waitForTimeout(100);
  assert.equal((await p.textContent('#app #serie .big')).trim(), '0', 'une semaine entière sans séance remet à zéro');
  assert.deepEqual(p.erreurs, []);
});
