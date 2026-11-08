/* Bibliothèque des machines (Guide et choix d'exercice) : vue, catalogue et muscle sont des réglages séparés. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donnees } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const nb = (p, sel) => p.locator(sel).count();

/* Crée une salle depuis le Guide, avec le modèle demandé */
async function creerSalle(p, modele) {
  await p.click('nav [data-tab=aide]');
  p.reponses.push('Ma salle test');
  await p.click('[data-act=gnew]');
  await p.click(`[data-act=gtpl][data-t=${modele}]`);
}

test('sans salle : pas d’interrupteur de vue, seulement les muscles', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=aide]');
  assert.equal(await nb(p, '[data-act=gv]'), 0);
  assert.equal(await nb(p, '[data-act=gm]'), 10);
  const tout = await nb(p, '#gl .gi');
  await p.click('[data-act=gm][data-m=Pectoraux]');
  const pecs = await nb(p, '#gl .gi');
  assert.ok(pecs > 0 && pecs < tout);
  assert.deepEqual(p.erreurs, []);
});

test('création de salle : toutes les enseignes sur un seul écran', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=aide]');
  p.reponses.push('Club');
  await p.click('[data-act=gnew]');
  const choix = await p.$$eval('#sheet [data-act=gtpl]', l => l.map(b => b.dataset.t));
  assert.deepEqual(choix, ['on-air', 'basic-fit', 'fitness-park', 'neoness', 'orange-bleue', 'keepcool', 'vide', 'base', 'tout']);
});

test('aucune machine n’est introuvable : chacune est dans au moins un catalogue', async () => {
  const { pathToFileURL } = require('node:url');
  const { LIB, ONAIR, OTHERCAT } = await import(pathToFileURL(require('node:path').join(__dirname, '..', 'js', 'catalogue.js')).href);
  const dedans = new Set([...ONAIR.groups, ...OTHERCAT.groups].flatMap(g => g.eq()));
  assert.deepEqual(LIB.map(x => x[0]).filter(n => !dedans.has(n)), []);
});

test('salle On Air : ouvre le catalogue On Air ; Ma salle / Catalogues se combinent avec le muscle', async () => {
  const p = await A.page();
  await creerSalle(p, 'on-air');
  assert.equal(await p.$eval('[data-act=gv].on', e => e.dataset.v), 'cat');
  assert.equal(await p.$eval('[data-act=gc].on', e => e.textContent), '⭐ On Air');
  assert.ok(await nb(p, '#gl h2.cg') >= 3, 'familles de machines affichées');
  await p.click('[data-act=gm][data-m=Dos]');
  const muscles = await p.$$eval('#gl .gi .pt span', l => [...new Set(l.map(s => s.firstChild.textContent.trim()))]);
  assert.deepEqual(muscles, ['Dos'], 'le filtre muscle marche aussi dans un catalogue');
  assert.deepEqual(await p.$$eval('[data-act=gv]', l => l.map(b => b.textContent)), ['Ma salle', 'Catalogues'], 'plus de « Toutes »');
  await p.click('[data-act=gv][data-v=salle]');
  assert.ok(await nb(p, '#gl .gi') > 0);
  await p.click('[data-act=gv][data-v=cat]');
  await p.click('[data-act=gc][data-v="Catalogue autres enseignes"]');
  assert.ok(await nb(p, '#gl small.who') > 0, 'on voit quelles enseignes ont la machine');
  assert.deepEqual(p.erreurs, []);
});

test('salle vide : le Guide ouvre les catalogues ; cocher / décocher met à jour Ma salle', async () => {
  const p = await A.page();
  await creerSalle(p, 'vide');
  assert.equal(await p.$eval('[data-act=gv].on', e => e.dataset.v), 'cat');
  await p.click('#gl [data-act=gtog][data-n="Squat"]');
  assert.deepEqual((await donnees(p)).gyms[0].eq, ['Squat']);
  await p.click('[data-act=gv][data-v=salle]');
  assert.deepEqual(await p.$$eval('#gl .gi b', l => l.map(x => x.textContent)), ['Squat']);
  await p.click('#gl [data-act=gtog][data-n="Squat"]');
  assert.deepEqual((await donnees(p)).gyms[0].eq, []);
  assert.match(await p.$eval('#gl', e => e.textContent), /Aucune machine cochée/);
});

test('les machines exclusives On Air restent cachées dans une salle d’une autre enseigne', async () => {
  const p = await A.page();
  await creerSalle(p, 'fitness-park');
  const noms = await p.$$eval('#gl .gi b', l => l.map(x => x.textContent));
  assert.ok(!noms.some(n => /Select|Super /.test(n)));
});

test('choix d’exercice en séance : Ma salle / Toutes + muscle, et la marque en étiquette', async () => {
  const p = await A.page();
  await creerSalle(p, 'on-air');
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  assert.equal(await p.$eval('[data-act=pv].on', e => e.dataset.v), 'salle');
  const salle = await nb(p, '#pl .pi');
  await p.click('[data-act=pv][data-v=tout]');
  assert.ok(await nb(p, '#pl .pi') > salle);
  await p.click('[data-act=pm][data-m=Dos]');
  const dos = await nb(p, '#pl .pi');
  assert.ok(dos > 0 && dos < salle);
  assert.ok(await nb(p, '#pl em.mk') > 0, 'étiquettes de marque');
  await p.click('#pl [data-act=padd]');
  assert.equal((await donnees(p)).sessions[0].exercises.length, 1);
  assert.deepEqual(p.erreurs, []);
});
