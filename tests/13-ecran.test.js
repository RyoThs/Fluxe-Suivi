/* v2.8.1 : pas de zoom, et message « Tourne ton téléphone » quand il est à l'horizontale. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

test('zoom bloqué : balise viewport, double tape, pincement iPhone', async () => {
  const p = await A.page();
  const vp = await p.getAttribute('meta[name=viewport]', 'content');
  assert.match(vp, /maximum-scale=1/);
  assert.match(vp, /user-scalable=no/);
  assert.equal(await p.evaluate(() => getComputedStyle(document.documentElement).touchAction), 'manipulation');
  const bloque = await p.evaluate(() => { const e = new Event('gesturestart', { cancelable: true }); document.dispatchEvent(e); return e.defaultPrevented; });
  assert.equal(bloque, true, 'le pincement iPhone est annulé');
  // aucun champ de saisie sous 16 px (sinon l'iPhone zoome tout seul en tapant)
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  const petits = await p.$$eval('input', l => l.filter(i => i.type !== 'checkbox' && i.type !== 'file' && i.offsetParent && parseFloat(getComputedStyle(i).fontSize) < 16).map(i => i.outerHTML.slice(0, 60)));
  assert.deepEqual(petits, []);
  assert.deepEqual(p.erreurs, []);
});

test('téléphone à l’horizontale : message « Tourne ton téléphone » ; en hauteur : rien', async () => {
  const p = await A.page();
  assert.equal(await p.isVisible('#rot'), false);
  await p.setViewportSize({ width: 844, height: 390 });
  assert.equal(await p.isVisible('#rot'), true);
  assert.match(await p.textContent('#rot'), /Tourne ton téléphone/);
  await p.setViewportSize({ width: 390, height: 844 });
  assert.equal(await p.isVisible('#rot'), false);
  // un grand écran (ordinateur) à l'horizontale n'est pas bloqué
  await p.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await p.isVisible('#rot'), false);
});
