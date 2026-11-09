/* Hors ligne : la police vient de l'app elle-même (plus de Google Fonts), sans erreur de sécurité. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

test('la police Barlow Condensed se charge depuis fonts/, sans aucun appel à un site extérieur', async () => {
  const p = await A.page();
  const exterieurs = [];
  p.on('request', r => { if (!r.url().startsWith(A.url) && !r.url().startsWith('data:')) exterieurs.push(r.url()); });
  await p.reload();
  await p.waitForSelector('nav');
  const graisses = await p.evaluate(async () => {
    await Promise.all([500, 600, 700, 800].map(w => document.fonts.load(`${w} 20px "Barlow Condensed"`)));
    return [...document.fonts].filter(f => f.family.replace(/"/g, '') === 'Barlow Condensed' && f.status === 'loaded').map(f => f.weight).sort();
  });
  assert.deepEqual(graisses, ['500', '600', '700', '800']);
  assert.deepEqual(exterieurs, []);
  assert.deepEqual(p.erreurs, [], 'aucune erreur (ni blocage par la sécurité de la page)');
});
