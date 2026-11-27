/* v3.20 : écran « Ma salle » (ancien Guide « ? ») : pro, épuré, et la salle communautaire au cœur.
   - onglet du bas « Ma salle » (icône + mot), étroit mais clair ;
   - sans salle : « Ta salle », enseignes sur une ligne ;
   - avec salle : carte compacte, menu « ··· » (Changer d'enseigne, Renommer, + Nouvelle salle, Supprimer), choix court « Catalogue · n | Ma salle · n »,
     loupe dans la recherche, machines compactes, titre du muscle collé en haut ;
   - encadré « Salle communautaire » court : rejoindre / « Comment ? » (3 étapes) ; une fois reliée : membres, vérifiées, ajoutées / retirées ;
   - confiance par machine : « Confirmée par n membres · dernière fois le … » dans le panneau de la machine. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE } = require('./outils');
const { installer } = require('./nuage-faux');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let C, CAT, A;
test.before(async () => {
  C = await import(url('club.js'));
  CAT = await import(url('catalogue.js'));
  A = await demarrer();
});
test.after(async () => { await A.fermer(); });
const BF = () => CAT.catOf(CAT.CHAINS.find(c => c.id === 'basic-fit'));
const SALLE = (extra = {}) => ({ ...VIDE, gyms: [{ id: 'g1', name: 'Basic-Fit Lyon Part-Dieu', chain: 'basic-fit', eq: BF(), notes: {}, ...extra }], gym: 'g1' });
async function ouvrir(d, srv = {}) {
  const p = await A.page();
  await p.context().addInitScript(installer);
  await p.evaluate(srv => localStorage.setItem('__serveur', JSON.stringify({ comptes: {}, data: {}, t: 1000, user: null, clubs: {}, avis: {}, ...srv })), srv);
  await donner(p, d);
  await p.click('nav [data-tab=aide]');
  await p.waitForTimeout(250);
  return p;
}
const JOUR = 864e5;
const avisDe = (m, k, u, t) => ({ m, k, u, t });

test('bilanClub : nombre de confirmations et date de la dernière, par machine', () => {
  const b = C.bilanClub([avisDe('Rameur', 'present', 'a', 1000), avisDe('Rameur', 'present', 'b', 5000), avisDe('Squat', 'absent', 'a', 10)]);
  assert.deepEqual(b.confirmations.get('rameur'), { n: 2, t: 5000 });
  assert.equal(b.confirmations.has('squat'), false);
});

test('onglet du bas « Ma salle » : icône + mot, plus étroit que les autres, nom lu par les lecteurs d’écran', async () => {
  const p = await A.page();
  const t = p.locator('nav [data-tab=aide]');
  assert.equal((await t.innerText()).trim(), 'Ma salle');
  assert.equal(await t.locator('svg').count(), 1);
  assert.equal(await t.getAttribute('aria-label'), 'Ma salle');
  const l = await p.$$eval('nav button', b => b.map(x => x.getBoundingClientRect().width));
  assert.ok(l[3] < l[0], 'plus étroit que « Séance »');
  assert.deepEqual(p.erreurs, []);
});

test('sans salle : « Ta salle », chaque enseigne tient sur une ligne propre', async () => {
  const p = await ouvrir({ ...VIDE });
  assert.equal(await p.textContent('#app h1'), 'Ta salle');
  const h = await p.$$eval('.ens button', l => l.map(b => b.getBoundingClientRect().height));
  assert.equal(h.length, 7);
  assert.ok(h.every(x => x < 80), 'hauteurs : ' + h.join(', '));
  assert.ok(await p.$$eval('.ens button', l => l.every(b => b.querySelector('.ini'))), 'initiales de l’enseigne');
  assert.deepEqual(p.erreurs, []);
});

test('avec salle : carte compacte, menu « ··· », choix court, loupe, machines compactes, muscle collé en haut', async () => {
  const p = await ouvrir(SALLE());
  assert.equal(await p.textContent('#app h1'), 'Ma salle');
  const carte = p.locator('.card.gym');
  assert.match(await carte.textContent(), /Basic-Fit Lyon Part-Dieu/);
  assert.match(await carte.textContent(), /\d+ machines dans ta salle/);
  for (const a of ['gchg', 'gren', 'gnew', 'gdel']) assert.equal(await p.locator(`[data-act=${a}]`).count(), 0, a + ' caché dans « ··· »');
  await p.click('[data-act=gmenu]');
  assert.deepEqual(await p.$$eval('.hx-menu button', l => l.map(b => b.dataset.act)), ['gchg', 'gren', 'gnew', 'gdel']);
  await p.click('#app h1');
  assert.equal(await p.locator('.hx-menu').count(), 0);
  assert.match(await p.textContent('[data-act=gv][data-v=cat]'), /^Catalogue · \d+$/);
  assert.match(await p.textContent('[data-act=gv][data-v=salle]'), /^Ma salle · \d+$/);
  assert.equal(await p.locator('.gz-srch svg').count(), 1, 'loupe');
  const h = await p.$$eval('#gl .gi', l => l.slice(0, 5).map(x => x.getBoundingClientRect().height));
  assert.ok(h.every(x => x < 80), 'machines compactes : ' + h.join(', '));
  assert.equal(await p.$eval('#gl h2.cg', e => getComputedStyle(e).position), 'sticky');
  assert.deepEqual(p.erreurs, []);
});

test('salle communautaire pas encore rejointe : encadré court, « Rejoindre », « Comment ? » en 3 étapes', async () => {
  const p = await ouvrir(SALLE());
  const co = p.locator('.co');
  assert.equal(await co.count(), 1);
  assert.match(await co.textContent(), /Salle communautaire/);
  assert.match(await co.textContent(), /membres de ton club/);
  assert.ok((await co.boundingBox()).height < 190, 'ne prend pas trop de place');
  assert.match(await co.locator('[data-act=clien]').textContent(), /Rejoindre mon club/);
  await co.locator('[data-act=ccomment]').click();
  await p.waitForSelector('#sheet .steps');
  assert.equal(await p.locator('#sheet .steps > div').count(), 3);
  assert.deepEqual(p.erreurs, []);
});

test('salle communautaire rejointe : membres, vérifiées, ajoutées / retirées ; confiance d’une machine avec la date', async () => {
  const [m0] = BF();
  const t = new Date(2026, 10, 12).getTime();
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Basic-Fit Lyon Part-Dieu' }), { clubs: { c1: { n: 'Basic-Fit Lyon Part-Dieu', e: 'basic-fit', v: 'Lyon' } }, avis: { c1: { a: avisDe(m0, 'present', 'x', t - JOUR), b: avisDe(m0, 'present', 'y', t) } } });
  await p.waitForSelector('.verif');
  const co = p.locator('.co');
  assert.match(await co.innerText(), /2\s+membres/);
  assert.match(await co.innerText(), /1\s+vérifiée/);
  assert.match(await co.textContent(), /Ta salle est-elle juste/);
  assert.equal(await co.locator('[data-act=cajout]').count(), 1);
  await p.locator('#gl .gi', { hasText: m0 }).first().locator('[data-act=csig]').click();
  await p.waitForSelector('#sheet');
  assert.match(await p.textContent('#sheet'), /Confirmée par 2 membres · dernière fois le 12 nov/);
  assert.deepEqual(p.erreurs, []);
});

test('petit écran (320 px) : rien ne dépasse, avec ou sans salle', async () => {
  for (const d of [{ ...VIDE }, SALLE()]) {
    const p = await A.page({ viewport: { width: 320, height: 568 } });
    await p.context().addInitScript(installer);
    await donner(p, d);
    await p.click('nav [data-tab=aide]');
    await p.waitForTimeout(200);
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'aucun défilement sur le côté');
    assert.deepEqual(p.erreurs, []);
  }
});
