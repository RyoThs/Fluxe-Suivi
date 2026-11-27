/* v3.19 : écran de la séance en cours « pro ».
   - bandeau collé en haut : nom de la routine (ou « Séance libre »), date, bouton « Terminer » (« Enregistrer » en modification), chiffres ;
   - « ··· » sur chaque exercice (Remplacer, Repos, Supprimer) au lieu de « Retirer » ;
   - note en petit bouton « ✎ Ajouter une note » tant qu'elle est vide ;
   - en bas : Ajouter un exercice, Calculateur + Repos par défaut côte à côte, Annuler en petit ;
   - l'astuce « échauffement » passe dans le Guide. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, VIDE, JOUR } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const st = (kg, reps) => ({ kg: String(kg), reps: String(reps) });
const sd = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });
const ROUTINES = [{ id: 'r1', name: 'Pectoraux', exercises: ['Développé couché', 'Écarté poulie', 'Vélo'], sets: [[st(70, 8), st(72.5, 6)], [st(15, 12)], [{ min: '15', km: '', kcal: '' }]] }];
const lancer = async (p, d = { ...VIDE, routines: ROUTINES }) => { await donner(p, d); await p.click('nav [data-tab=seance]'); await p.click('[data-act=startr][data-k="0"]'); await p.waitForTimeout(150); };

test('bandeau en haut : nom de la routine, date, « Terminer » et les chiffres ; il reste visible en faisant défiler', async () => {
  const p = await A.page();
  await lancer(p);
  assert.equal(await p.textContent('.sx-top h1'), 'Pectoraux');
  assert.match(await p.textContent('.sx-top .sx-d'), /^\p{Lu}\p{Ll}+ \d+ \p{Ll}+\.? · en cours$/u);
  assert.equal((await p.textContent('.sx-top [data-act=finish]')).trim(), 'Terminer');
  assert.equal(await p.locator('.sx-top .live').count(), 1, 'durée, volume, séries dans le bandeau');
  assert.equal(await p.$eval('.sx-top', e => getComputedStyle(e).position), 'sticky');
  await p.evaluate(() => window.scrollTo(0, 2000));
  await p.waitForTimeout(100);
  assert.ok(await p.$eval('.sx-top', e => e.getBoundingClientRect().top >= -1 && e.getBoundingClientRect().top < 5), 'collé en haut après défilement');
  assert.equal(await p.locator('[data-act=finish]').count(), 1, 'un seul bouton Terminer (en haut)');
  assert.deepEqual(p.erreurs, []);
});

test('séance libre et modification d’une séance passée : bon titre et bon bouton', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE });
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  assert.equal(await p.textContent('.sx-top h1'), 'Séance libre');
  const q = await A.page();
  await donner(q, { ...VIDE, sessions: [{ id: 'a', date: Date.now() - 2 * JOUR, dur: 40, exercises: [{ name: 'Squat', sets: [sd(100, 5)] }] }] });
  await q.click('nav [data-tab=histo]');
  await q.click('[data-act=hmenu][data-id=a]');
  await q.click('.hx-menu [data-act=editsess]');
  assert.match(await q.textContent('.sx-top .sx-d'), /modification/);
  assert.equal((await q.textContent('.sx-top [data-act=finish]')).trim(), 'Enregistrer');
  assert.deepEqual([p.erreurs, q.erreurs], [[], []]);
});

test('« ··· » d’un exercice : Remplacer, Repos, Supprimer ; plus de « Retirer » visible ; toucher ailleurs ferme', async () => {
  const p = await A.page();
  await lancer(p);
  assert.equal(await p.locator('#app button:visible', { hasText: /^Retirer$/ }).count(), 0);
  assert.equal(await p.locator('.sx-menu:visible').count(), 0, 'menus fermés');
  await p.click('[data-act=emenu][data-i="1"]');
  const menu = p.locator('.sx-menu:visible');
  assert.equal(await menu.count(), 1);
  assert.deepEqual(await menu.locator('button').evaluateAll(l => l.map(b => b.dataset.act)), ['exrem', 'rex', 'delex']);
  await p.click('.sx-top h1');
  assert.equal(await p.locator('.sx-menu:visible').count(), 0, 'fermé en touchant ailleurs');
  p.reponses.push(true);
  await p.click('[data-act=emenu][data-i="1"]');
  await p.click('.sx-menu:visible [data-act=delex]');
  await p.waitForTimeout(150);
  const d = await donnees(p);
  assert.deepEqual(d.sessions.find(x => x.id === d.current).exercises.map(e => e.name), ['Développé couché', 'Vélo']);
  assert.deepEqual(p.erreurs, []);
});

test('note : petit bouton « ✎ Ajouter une note » tant qu’elle est vide, pleine largeur une fois écrite', async () => {
  const p = await A.page();
  await lancer(p);
  const note = p.locator('#app [data-note="0"]');
  assert.equal(await note.getAttribute('placeholder'), '✎ Ajouter une note');
  assert.ok((await note.boundingBox()).width < 220, 'petit tant qu’elle est vide');
  await note.fill('Siège cran 4');
  await note.blur();
  await p.click('[data-act=addset][data-i="0"]'); // redessine l'écran
  assert.ok((await p.locator('#app [data-note="0"]').boundingBox()).width > 250, 'pleine largeur avec du texte');
  assert.equal(await p.inputValue('#app [data-note="0"]'), 'Siège cran 4');
  assert.deepEqual(p.erreurs, []);
});

test('en bas : Ajouter un exercice, Calculateur et Repos par défaut côte à côte, Annuler ; l’astuce est dans le Guide', async () => {
  const p = await A.page();
  await lancer(p);
  assert.deepEqual(await p.$$eval('.sx-bas button', l => l.map(b => b.dataset.act)), ['tool', 'rest']);
  assert.match(await p.innerText('.sx-bas [data-act=rest]'), /Repos par défaut\s+1 min 30/);
  assert.equal(await p.locator('#app [data-act=cancel]').count(), 1);
  assert.doesNotMatch(await p.textContent('#app'), /Astuce/);
  await p.click('nav [data-tab=aide]');
  assert.match(await p.textContent('#app'), /touche le numéro d’une série pour la marquer comme échauffement/i);
  assert.deepEqual(p.erreurs, []);
});

test('petit écran (320 px) : rien ne dépasse', async () => {
  const p = await A.page({ viewport: { width: 320, height: 568 } });
  await lancer(p);
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'aucun défilement sur le côté');
  assert.deepEqual(p.erreurs, []);
});
