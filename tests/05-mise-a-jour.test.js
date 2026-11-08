/* Mise à jour sur iPhone : si une vieille page est encore en mémoire, l'app se répare seule, sans boucle infinie. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, seance, VIDE } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

const vieillePage = async (r, n) => {
  const res = await r.fetch();
  let t = await res.text();
  if (n) t = t.replace(/name="app-version" content="[^"]+"/, 'name="app-version" content="1.0"');
  return r.fulfill({ response: res, body: t });
};

test('vieille page en mémoire une fois → l’app se recharge seule en bonne version, les séances sont intactes', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 1)] });
  let n = 0;
  await p.route(A.url, r => vieillePage(r, n++ === 0));
  await p.reload();
  await p.waitForTimeout(2500);
  assert.ok(n >= 2, 'la page a été redemandée');
  assert.equal(await p.$eval('#warn', e => e.hidden), true);
  assert.equal((await donnees(p)).sessions.length, 1);
});

test('vieille page qui revient toujours → pas de boucle infinie, un message s’affiche', async () => {
  const p = await A.page();
  let n = 0;
  await p.route(A.url, r => { n++; return vieillePage(r, true); });
  await p.reload();
  await p.waitForTimeout(3000);
  assert.ok(n <= 3, `page demandée ${n} fois`);
  assert.equal(await p.$eval('#warn', e => e.hidden), false);
});

test('vieille page de la v2.2.1 (qui demande app.js) → réparation, puis la nouvelle version s’affiche', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 1)] });
  await p.evaluate(() => sessionStorage.clear());
  let n = 0;
  await p.route(A.url, async r => {
    const res = await r.fetch();
    let t = await res.text();
    if (n++ === 0) t = t.replace(/<script type="module"[^>]*><\/script>/, '<script src="app.js?v=2.2.1" defer></script>').replace(/name="app-version" content="[^"]+"/, 'name="app-version" content="2.2.1"');
    return r.fulfill({ response: res, body: t });
  });
  await p.reload();
  await p.waitForTimeout(2500);
  assert.ok(n >= 2, 'la page a été redemandée');
  assert.ok(await p.$('script[type=module]'), 'nouvelle page chargée');
  assert.equal(await p.$eval('#warn', e => e.hidden), true);
  assert.equal((await donnees(p)).sessions.length, 1);
  assert.deepEqual(p.erreurs, []);
});
