/* Dessins des machines (v2.7) : chaque machine du catalogue a son dessin, et aucun dessin n'est cassé. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer } = require('./outils');
const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;

test('chaque machine et chaque exercice du catalogue a un dessin valide', async () => {
  const CAT = await import(url('catalogue.js'));
  const D = await import(url('dessins.js'));
  const sans = CAT.LIB.map(x => x[0]).filter(n => !D.aDessin(n));
  assert.deepEqual(sans, [], 'machines sans dessin');
  for (const [n] of CAT.LIB) {
    const s = D.dessin(n);
    assert.ok(s.startsWith('<svg class="dx"') && s.endsWith('</svg>'), n);
    assert.ok(!/NaN|undefined/.test(s), 'valeur cassée dans le dessin de ' + n);
  }
  assert.deepEqual(D.NOMS_DESSINES().filter(n => !CAT.MU[n]), [], 'dessin sans machine (nom mal écrit ?)');
  assert.equal(D.dessin('Exercice perso inventé'), '');
});

test('le catalogue On Air contient les machines ajoutées en v2.7', async () => {
  const CAT = await import(url('catalogue.js'));
  const on = CAT.catOf(CAT.ONAIR);
  for (const n of ['Crunch abdominal Select', 'Rowing haut (Super High Row)', 'Presse pectorale Insignia', 'Crunch abdominal Insignia'])
    assert.ok(on.includes(n), n);
  assert.equal(CAT.LIB.filter(x => x[2] === 'Panatta').length, 12, 'circuit Panatta de 12 machines');
  for (const c of CAT.OTHERS) assert.ok(!CAT.catOf(c).some(n => /Insignia|Super /.test(n)), c.id + ' sans exclusivités On Air');
});

test('dans l’app : les vignettes du Guide sont des dessins, sans erreur', async () => {
  const A = await demarrer();
  try {
    const p = await A.page();
    await p.click('nav [data-tab=aide]');
    await p.click('[data-act=gens][data-t=on-air]');
    assert.ok(await p.locator('#gl .gi .mi.art svg.dx').count() > 140);
    assert.equal(await p.locator('#fxP').count(), 1, 'dégradés ajoutés une seule fois');
    assert.deepEqual(p.erreurs, []);
  } finally { await A.fermer(); }
});
