/* Catalogue de machines PAR ENSEIGNE (v2.5) :
   on choisit son enseigne → toutes ses machines sont cochées → on décoche ce que son club n'a pas. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE } = require('./outils');

let A, CAT;
test.before(async () => {
  A = await demarrer();
  CAT = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'catalogue.js')).href);
});
test.after(async () => { await A.fermer(); });
const nb = (p, sel) => p.locator(sel).count();

/* Sans salle : on touche la carte de l'enseigne dans le Guide */
async function choisir(p, id) {
  await p.click('nav [data-tab=aide]');
  await p.click(`[data-act=gens][data-t=${id}]`);
}

test('sans salle : le Guide propose les 6 enseignes + « Autre salle », et montre toutes les machines', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=aide]');
  const cartes = await p.$$eval('[data-act=gens]', l => l.map(b => b.dataset.t));
  assert.deepEqual(cartes, ['on-air', 'basic-fit', 'fitness-park', 'neoness', 'orange-bleue', 'keepcool', 'autre']);
  assert.equal(await nb(p, '[data-act=gv]'), 0);
  assert.equal(await nb(p, '[data-act=gtog]'), 0, 'pas de coches sans salle');
  assert.ok(await nb(p, '#gl .gi') > 100);
  assert.deepEqual(p.erreurs, []);
});

for (const id of ['on-air', 'basic-fit', 'fitness-park', 'keepcool']) {
  test(`choisir ${id} : toutes les machines de l’enseigne sont cochées d’office`, async () => {
    const p = await A.page();
    await choisir(p, id);
    const ch = CAT.CHAINS.find(c => c.id === id);
    const g = (await donnees(p)).gyms[0];
    assert.equal(g.chain, id);
    assert.equal(g.name, ch.name);
    assert.deepEqual([...g.eq].sort(), [...CAT.catOf(ch)].sort());
    assert.equal(await p.$eval('[data-act=gv].on', e => e.dataset.v), 'cat');
    assert.equal(await nb(p, '#gl [data-act=gtog]:not(.on)'), 0, 'tout est coché (✓)');
    assert.deepEqual(p.erreurs, []);
  });
}

test('le catalogue ne montre que les machines de son enseigne (pas d’exclusivités On Air ailleurs)', async () => {
  const p = await A.page();
  await choisir(p, 'basic-fit');
  const noms = await p.$$eval('#gl .gi b', l => l.map(x => x.textContent));
  assert.equal(noms.length, CAT.catOf(CAT.CHAINS.find(c => c.id === 'basic-fit')).length);
  assert.ok(!noms.some(n => /Iso-Lateral|Select|Super /.test(n)));
  assert.match(await p.$eval('[data-act=gv][data-v=cat]', e => e.textContent), /^Catalogue Basic-Fit · \d+$/);
});

test('décocher une machine : elle sort de Ma salle, le compteur baisse ; on peut la recocher', async () => {
  const p = await A.page();
  await choisir(p, 'basic-fit');
  const avant = (await donnees(p)).gyms[0].eq.length;
  await p.click('#gl [data-act=gtog][data-n="Squat"]');
  let g = (await donnees(p)).gyms[0];
  assert.equal(g.eq.length, avant - 1);
  assert.ok(!g.eq.includes('Squat'));
  assert.equal(await p.$eval('[data-act=gv][data-v=salle]', e => e.textContent), `Ma salle · ${avant - 1}`);
  await p.click('[data-act=gv][data-v=salle]');
  assert.ok(!(await p.$$eval('#gl .gi b', l => l.map(x => x.textContent))).includes('Squat'));
  await p.click('[data-act=gv][data-v=cat]');
  await p.click('#gl [data-act=gtog][data-n="Squat"]');
  g = (await donnees(p)).gyms[0];
  assert.equal(g.eq.length, avant);
});

test('liste rangée par muscle ; un muscle choisi filtre la liste', async () => {
  const p = await A.page();
  await choisir(p, 'on-air');
  const titres = await p.$$eval('#gl h2.cg', l => l.map(h => h.firstChild.textContent));
  assert.deepEqual(titres, CAT.M.filter(m => titres.includes(m)), 'dans l’ordre des muscles');
  assert.ok(titres.length >= 8);
  await p.click('[data-act=gm][data-m=Dos]');
  assert.equal(await nb(p, '#gl h2.cg'), 0);
  const muscles = await p.$$eval('#gl .gi .pt span', l => [...new Set(l.map(s => s.firstChild.textContent.trim()))]);
  assert.deepEqual(muscles, ['Dos']);
});

test('changer d’enseigne : confirmation, puis toutes les machines de la nouvelle enseigne cochées, réglages gardés', async () => {
  const p = await A.page();
  await choisir(p, 'basic-fit');
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('muscu-v1')); s.gyms[0].notes['k:squat'] = 'Cran 4'; localStorage.setItem('muscu-v1', JSON.stringify(s)); });
  await p.reload(); await p.click('nav [data-tab=aide]');
  await p.click('[data-act=gchg]');
  p.reponses.push(true);
  await p.click('#sheet [data-act=gens][data-t=fitness-park]');
  const g = (await donnees(p)).gyms[0];
  assert.equal(g.chain, 'fitness-park');
  assert.equal(g.name, 'Fitness Park');
  assert.equal(g.eq.length, CAT.catOf(CAT.CHAINS.find(c => c.id === 'fitness-park')).length);
  assert.equal(g.notes['k:squat'], 'Cran 4');
  assert.equal((await donnees(p)).gyms.length, 1);
});

test('refuser le changement d’enseigne ne touche à rien', async () => {
  const p = await A.page();
  await choisir(p, 'basic-fit');
  await p.click('#gl [data-act=gtog][data-n="Squat"]');
  const avant = (await donnees(p)).gyms[0];
  await p.click('[data-act=gchg]');
  p.reponses.push(false);
  await p.click('#sheet [data-act=gens][data-t=on-air]');
  assert.deepEqual((await donnees(p)).gyms[0], avant);
});

test('+ Salle : une deuxième salle, puis on passe de l’une à l’autre', async () => {
  const p = await A.page();
  await choisir(p, 'on-air');
  await p.click('[data-act=gnew]');
  await p.click('#sheet [data-act=gens][data-t=on-air]');
  const d = await donnees(p);
  assert.deepEqual(d.gyms.map(g => g.name), ['On Air', 'On Air 2']);
  assert.equal(d.gym, d.gyms[1].id);
  await p.click(`[data-act=gsel][data-id="${d.gyms[0].id}"]`);
  assert.equal((await donnees(p)).gym, d.gyms[0].id);
});

test('ancienne salle sans enseigne (créée avant la v2.5) : gardée telle quelle, catalogue = toutes les machines', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, gyms: [{ id: 'g1', name: 'Ma vieille salle', eq: ['Squat', 'Tractions'], notes: {} }], gym: 'g1' });
  await p.click('nav [data-tab=aide]');
  assert.match(await p.$eval('[data-act=gv][data-v=cat]', e => e.textContent), /^Toutes les machines · \d+/);
  assert.equal(await p.$eval('[data-act=gv][data-v=salle]', e => e.textContent), 'Ma salle · 2');
  assert.deepEqual((await donnees(p)).gyms[0].eq, ['Squat', 'Tractions'], 'coches non modifiées');
  assert.deepEqual(p.erreurs, []);
});

test('choix d’exercice en séance : Ma salle / Catalogue de l’enseigne, la recherche trouve tout', async () => {
  const p = await A.page();
  await choisir(p, 'basic-fit');
  await p.click('#gl [data-act=gtog][data-n="Squat"]'); // décoché : plus dans Ma salle
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  assert.equal(await p.$eval('[data-act=pv].on', e => e.dataset.v), 'salle');
  const salle = await p.$$eval('#pl .pi b', l => l.map(x => x.textContent));
  assert.ok(!salle.includes('Squat'));
  await p.click('[data-act=pv][data-v=cat]');
  assert.match(await p.$eval('[data-act=pv].on', e => e.textContent), /Catalogue Basic-Fit/);
  assert.ok((await p.$$eval('#pl .pi b', l => l.map(x => x.textContent))).includes('Squat'));
  await p.click('[data-act=pv][data-v=salle]');
  await p.fill('#pq', 'iso-lateral');
  assert.ok(await nb(p, '#pl [data-act=padd]') > 3, 'la recherche cherche dans toute la bibliothèque');
  await p.fill('#pq', '');
  await p.click('[data-act=pm][data-m=Dos]');
  await p.click('#pl [data-act=padd]');
  assert.equal((await donnees(p)).sessions[0].exercises.length, 1);
  assert.deepEqual(p.erreurs, []);
});
