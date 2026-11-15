/* v2.8.2 : les gestes (boutons) sont rangés par thème dans js/gestes/.
   Ce test vérifie qu'aucun bouton n'a été oublié pendant le rangement, et que les boutons marchent toujours. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { demarrer, donnees, lire, RACINE } = require('./outils');

/* Tous les data-act écrits dans le code (écrans + index.html) */
function boutons() {
  const fichiers = ['index.html'];
  const fouiller = d => fs.readdirSync(path.join(RACINE, d), { withFileTypes: true }).forEach(f => {
    const p = d + '/' + f.name;
    if (f.isDirectory()) fouiller(p); else if (p.endsWith('.js')) fichiers.push(p);
  });
  fouiller('js');
  const noms = new Set();
  fichiers.forEach(f => (lire(f).match(/data-act=\\?"?[a-z0-9+-]+/g) || []).forEach(m => noms.add(m.replace(/data-act=\\?"?/, ''))));
  return [...noms].sort();
}

test('chaque bouton (data-act) a son geste dans js/gestes/', async () => {
  const A = await demarrer();
  try {
    const p = await A.page();
    const connus = await p.evaluate(async () => (await import('./js/actions.js')).nomsGestes());
    const oublies = boutons().filter(n => !connus.includes(n));
    assert.deepEqual(oublies, [], 'boutons sans geste : ' + oublies.join(', '));
    assert.ok(connus.length >= 60, connus.length + ' gestes');
  } finally { await A.fermer(); }
});

test('actions.js reste un simple aiguillage (moins de 200 lignes une fois mis en forme)', () => {
  const n = lire('js/actions.js').split('\n').length;
  assert.ok(n < 200, n + ' lignes');
});

test('parcours complet après le rangement : séance, chrono, fin, historique, routine', async () => {
  const A = await demarrer();
  try {
    const p = await A.page();
    await p.click('[data-act=start]');
    await p.click('[data-act=pick]');
    await p.click('#pl [data-act=padd][data-n="Squat"]');
    await p.fill('[data-f=kg][data-i="0"][data-j="0"]', '60');
    await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '10');
    await p.click('[data-act=chk]');
    assert.ok(await p.isVisible('#timer'), 'chrono lancé');
    await p.click('[data-act=addset][data-i="0"]');
    await p.click('[data-act=t0]');
    await p.click('[data-act=finish]');
    await p.click('[data-act=mkr]');
    const d = await donnees(p);
    assert.equal(d.sessions.length, 1);
    assert.deepEqual(d.sessions[0].exercises[0].sets.map(x => [x.kg, x.reps]), [['60', '10']]);
    assert.equal(d.routines.length, 1);
    assert.deepEqual(p.erreurs, []);
  } finally { await A.fermer(); }
});
