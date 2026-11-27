/* v3.18 : page Entraînement « pro ».
   - sous le titre : la date et les séances de la semaine ;
   - carte « À faire aujourd'hui » : la routine pas faite depuis le plus longtemps, avec ses exercices et « Démarrer » ;
   - « + Séance libre » discret ; cartes de routines compactes avec TOUS les exercices visibles, ▶ pour démarrer, « ··· » (Modifier, Supprimer) ;
   - rappel de sauvegarde sur une ligne (jamais avec un compte en ligne à jour). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE, JOUR } = require('./outils');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let R, A;
test.before(async () => {
  R = await import(url('resume-routine.js'));
  A = await demarrer();
});
test.after(async () => { await A.fermer(); });
const st = (kg, reps, w) => ({ kg: String(kg), reps: String(reps), ...(w ? { w: true } : {}) });
const MAINTENANT = new Date(2026, 10, 27, 18, 0).getTime();

test('prévu : séries de travail et charge la plus lourde ; cardio en blocs et minutes', () => {
  assert.equal(R.prevu([st(40, 10, true), st(100, 8), st(105, 5)], false), '2 séries · 105 kg');
  assert.equal(R.prevu([st('', ''), st('', '')], false), '2 séries');
  assert.equal(R.prevu([st(72.5, 6)], false), '1 série · 72,5 kg');
  assert.equal(R.prevu([{ min: '20', km: '3', kcal: '' }], true), '1 bloc · 20 min');
  assert.equal(R.prevu([{ min: '', km: '', kcal: '' }, { min: '', km: '', kcal: '' }], true), '2 blocs');
  assert.equal(R.prevu([], false), '');
});

test('quand : faite aujourd’hui, hier, il y a n jours, pas encore faite', () => {
  assert.equal(R.quand(MAINTENANT - 2 * 3600e3, MAINTENANT), 'faite aujourd’hui');
  assert.equal(R.quand(MAINTENANT - JOUR, MAINTENANT), 'faite hier');
  assert.equal(R.quand(MAINTENANT - 3 * JOUR, MAINTENANT), 'il y a 3 jours');
  assert.equal(R.quand(null, MAINTENANT), 'pas encore faite');
});

test('suggestion : la routine faite il y a le plus longtemps (une routine jamais faite passe en premier)', () => {
  assert.equal(R.suggestion([MAINTENANT - JOUR, MAINTENANT - 8 * JOUR, MAINTENANT - 3 * JOUR]), 1);
  assert.equal(R.suggestion([MAINTENANT - JOUR, null, MAINTENANT - 9 * JOUR]), 1);
  assert.equal(R.suggestion([]), -1);
  assert.equal(R.depuis(MAINTENANT - 8 * JOUR, MAINTENANT), 'Pas faite depuis 8 jours');
  assert.equal(R.depuis(MAINTENANT - JOUR, MAINTENANT), 'Faite hier');
  assert.equal(R.depuis(MAINTENANT - 3600e3, MAINTENANT), 'Faite aujourd’hui');
  assert.equal(R.depuis(null, MAINTENANT), 'Jamais faite');
});

/* ===== L'écran ===== */
const sd = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });
const ROUTINES = [
  { id: 'r1', name: 'Pectoraux', exercises: ['Développé couché', 'Écarté poulie', 'Vélo'], sets: [[st(70, 8), st(72.5, 6)], [st(15, 12)], [{ min: '15', km: '5', kcal: '' }]] },
  { id: 'r2', name: 'Dos', exercises: ['Tirage vertical', 'Rowing barre'], sets: [[st(55, 10)], [st(60, 8)]] },
];
const SEANCES = [
  { id: 'a', date: Date.now() - JOUR, dur: 58, rt: 'r1', exercises: [{ name: 'Développé couché', sets: [sd(70, 8)] }] },
  { id: 'b', date: Date.now() - 8 * JOUR, dur: 47, rt: 'r2', exercises: [{ name: 'Tirage vertical', sets: [sd(55, 10)] }] },
];
const accueil = async (p, d) => { await donner(p, d); await p.click('nav [data-tab=seance]'); };

test('accueil : date et semaine, « À faire aujourd’hui » avec ses exercices, Séance libre, routines compactes', async () => {
  const p = await A.page();
  await accueil(p, { ...VIDE, sessions: SEANCES, routines: ROUTINES });
  assert.match(await p.textContent('.sub'), /^\p{Lu}\p{Ll}+ \d+ \p{Ll}+\.? · 1 séance cette semaine$/u);
  const sug = p.locator('.en-sug');
  assert.match(await sug.textContent(), /À faire aujourd’hui/);
  assert.equal(await sug.locator('.en-sug-t').textContent(), 'Dos', 'la routine pas faite depuis le plus longtemps');
  assert.match(await sug.textContent(), /Pas faite depuis 8 jours · dernière fois 47 min/);
  assert.equal(await sug.locator('.en-sx > div').count(), 2, 'ses exercices sont visibles');
  assert.equal(await sug.locator('[data-act=startr]').getAttribute('data-k'), '1');
  assert.match(await sug.locator('[data-act=startr]').textContent(), /Démarrer Dos/);
  assert.equal((await p.textContent('.en-libre')).trim(), '+ Séance libre');
  assert.equal(await p.getAttribute('.en-libre', 'data-act'), 'start');
  assert.equal(await p.locator('.en-r').count(), 2);
  const pecs = p.locator('.en-r').first();
  assert.match(await pecs.locator('.en-rm').textContent(), /3 exercices · 3 séries · faite hier/);
  assert.deepEqual(await pecs.locator('.rlist > div').evaluateAll(l => l.map(d => d.innerText.replace(/\s+/g, ' ').trim())), [
    'PEC Développé couché 2 séries · 72,5 kg', 'PEC Écarté poulie 1 série · 15 kg', 'CAR Vélo 1 bloc · 15 min',
  ], 'TOUS les exercices, avec ce qui est prévu');
  assert.equal(await pecs.locator('[data-act=startr][data-k="0"]').count(), 1, 'rond ▶ pour démarrer');
  assert.equal(await p.locator('[data-act=redit]').count(), 0, 'Modifier caché dans « ··· »');
  assert.deepEqual(p.erreurs, []);
});

test('rond ▶ et « Démarrer » lancent la bonne routine ; « Séance libre » lance une séance vide', async () => {
  const p = await A.page();
  await accueil(p, { ...VIDE, sessions: SEANCES, routines: ROUTINES });
  await p.click('.en-sug [data-act=startr]');
  let d = await donnees(p);
  assert.deepEqual(d.sessions.find(x => x.id === d.current).exercises.map(e => e.name), ['Tirage vertical', 'Rowing barre']);
  const q = await A.page();
  await accueil(q, { ...VIDE, routines: ROUTINES });
  await q.click('.en-libre');
  d = await donnees(q);
  assert.deepEqual(d.sessions.find(x => x.id === d.current).exercises, []);
  assert.deepEqual([p.erreurs, q.erreurs], [[], []]);
});

test('menu « ··· » d’une routine : Modifier ouvre l’éditeur, Supprimer la met à la corbeille', async () => {
  const p = await A.page();
  await accueil(p, { ...VIDE, routines: ROUTINES });
  await p.click('[data-act=rmenu][data-k="1"]');
  assert.deepEqual(await p.$$eval('.hx-menu button', l => l.map(b => b.dataset.act)), ['redit', 'delr']);
  await p.click('.hx-menu [data-act=delr]');
  await p.waitForTimeout(150);
  assert.deepEqual((await donnees(p)).routines.map(r => r.name), ['Pectoraux']);
  await p.click('[data-act=rmenu][data-k="0"]');
  await p.click('.hx-menu [data-act=redit]');
  await p.waitForSelector('[data-act=rsave]');
  await p.click('h1').catch(() => {});
  assert.deepEqual(p.erreurs, []);
});

test('rappel de sauvegarde sur une ligne (sans compte) ; sans routine : pas de suggestion, message clair', async () => {
  const p = await A.page();
  await accueil(p, { ...VIDE, sessions: [SEANCES[0], { ...SEANCES[1], id: 'c' }, { ...SEANCES[1], id: 'e' }, { ...SEANCES[1], id: 'f' }, { ...SEANCES[1], id: 'g' }] });
  const b = p.locator('.bkc');
  assert.equal(await b.count(), 1);
  assert.ok((await b.boundingBox()).height < 80, 'une seule ligne, pas un gros bloc');
  assert.match(await b.innerText(), /Pense à sauvegarder/);
  assert.equal(await b.locator('[data-act=file]').count(), 1);
  assert.equal(await b.locator('[data-act=snz]').count(), 1);
  assert.equal(await p.locator('.en-sug').count(), 0, 'pas de suggestion sans routine');
  assert.match(await p.textContent('#app'), /Aucune routine pour l’instant/);
  assert.deepEqual(p.erreurs, []);
});

test('petit écran (320 px, iPhone SE) : le titre et le bouton des semaines d’affilée tiennent sur la ligne, rien ne dépasse', async () => {
  const p = await A.page({ viewport: { width: 320, height: 568 } });
  await accueil(p, { ...VIDE, sessions: SEANCES, routines: ROUTINES, lastBackup: Date.now() });
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'aucun défilement sur le côté');
  // panne volontaire : un nom de routine de 60 lettres sans espace (proposé dans « À faire aujourd'hui »)
  await accueil(p, { ...VIDE, routines: [{ id: 'r9', name: 'X'.repeat(60), exercises: ['Squat'] }, ...ROUTINES], lastBackup: Date.now() });
  assert.equal(await p.textContent('.en-sug-t'), 'X'.repeat(60));
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'nom très long : aucun défilement sur le côté');
  const trop = await p.evaluate(() => [...document.querySelectorAll('#app *')].filter(e => !e.closest('.sr') && e.getBoundingClientRect().right > innerWidth + 0.5).map(e => e.className || e.tagName));
  assert.deepEqual(trop, [], 'éléments qui dépassent');
  assert.deepEqual(p.erreurs, []);
});
