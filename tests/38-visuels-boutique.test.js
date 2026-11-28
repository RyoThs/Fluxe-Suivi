/* Visuels pour l'App Store et Google Play (outils/boutique/, 2026-11-28).
   - les données de démo sont lues par l'appli sans erreur (24 séances sur 8 semaines, 3 routines) ;
   - 6 visuels, chacun avec un titre, un texte et une capture connue ;
   - aucun nom d'enseigne de salle sur les visuels (règle des boutiques et des marques). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner } = require('./outils');

const url = f => pathToFileURL(path.join(__dirname, '..', 'outils', 'boutique', f)).href;
let A, D, V;
test.before(async () => {
  D = await import(url('demo.mjs'));
  V = await import(url('textes.mjs'));
  A = await demarrer();
});
test.after(async () => { await A.fermer(); });

test('données de démo : 24 séances sur 8 semaines, 3 routines, lues par l’appli sans erreur', async () => {
  const d = D.demo(Date.now());
  assert.equal(d.sessions.length, 24);
  assert.equal(d.routines.length, 3);
  const p = await A.page();
  await donner(p, d);
  await p.click('nav [data-tab=histo]');
  assert.match(await p.textContent('#app'), /24 séances/);
  assert.deepEqual(p.erreurs, []);
});

test('6 visuels : titre, texte et capture connue pour chacun', () => {
  assert.equal(V.VISUELS.length, 6);
  for (const v of V.VISUELS) {
    assert.ok(v.titre && v.texte && v.tag, 'textes remplis');
    assert.ok(V.CAPTURES.includes(v.capture), `capture connue : ${v.capture}`);
  }
});

test('aucun nom d’enseigne de salle sur les visuels', () => {
  const tout = JSON.stringify(V.VISUELS) + V.BANNIERE;
  for (const m of ['Basic', 'Fitness Park', 'On Air', 'Orange Bleue', 'Neoness', 'Keepcool', 'Hevy']) assert.doesNotMatch(tout, new RegExp(m, 'i'), m);
});
