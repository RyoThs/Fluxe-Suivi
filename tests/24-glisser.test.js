/* v3.7.0 : glisser vers la gauche pour supprimer ou remplacer un exercice, modifier ou supprimer une mesure,
   avec un message « Annuler » au lieu d'une question ; transitions fluides entre les pages. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, VIDE, JOUR, lire } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

const st = (kg, reps, done = false) => ({ kg: String(kg), reps: String(reps), done });
function enCours() {
  return { ...VIDE, sessions: [{ id: 'cur', date: Date.now() - 10 * 60000, exercises: [
    { name: 'Squat', sets: [st(100, 8)] },
    { name: 'Presse à cuisses', sets: [st(150, 10), st(150, 10)] },
    { name: 'Mollets debout', sets: [st(60, 12)] },
  ] }], current: 'cur' };
}
/* glisser un élément vers la gauche, comme un doigt */
async function glisser(p, sel, dx = -160) {
  await p.locator(sel).first().scrollIntoViewIfNeeded(); /* comme un doigt : on fait d'abord défiler jusqu'à l'élément */
  const b = await p.locator(sel).first().boundingBox();
  const y = b.y + Math.min(40, b.height / 2), x = b.x + b.width - 30;
  await p.mouse.move(x, y);
  await p.mouse.down();
  await p.mouse.move(x + dx / 2, y + 2, { steps: 4 });
  await p.mouse.move(x + dx, y + 3, { steps: 4 });
  await p.mouse.up();
  await p.waitForTimeout(150);
}
const noms = p => p.$$eval('#app section .ex-name', l => l.map(e => e.textContent.trim()));

test('caractérisation : le bouton « Retirer » de chaque exercice est toujours là', async () => {
  const p = await A.page();
  await donner(p, enCours());
  await p.click('nav [data-tab=seance]');
  assert.equal(await p.locator('#app [data-act=delex]').count(), 3);
});

test('glisser un exercice vers la gauche montre « Remplacer » et « Supprimer » ; glisser vers la droite referme', async () => {
  const p = await A.page();
  await donner(p, enCours());
  await p.click('nav [data-tab=seance]');
  await glisser(p, '#app .gl[data-i="1"] .gl-c');
  assert.equal(await p.locator('#app .gl.ouvert').count(), 1);
  assert.ok(await p.locator('#app .gl.ouvert [data-act=exsup]').isVisible());
  assert.ok(await p.locator('#app .gl.ouvert [data-act=exrem]').isVisible());
  await glisser(p, '#app .gl[data-i="1"] .gl-c', 160);
  assert.equal(await p.locator('#app .gl.ouvert').count(), 0);
  assert.deepEqual(p.erreurs, []);
});

test('« Supprimer » retire l’exercice sans question ; « Annuler » le remet à sa place avec ses séries', async () => {
  const p = await A.page();
  await donner(p, enCours());
  await p.click('nav [data-tab=seance]');
  await glisser(p, '#app .gl[data-i="1"] .gl-c');
  await p.click('#app .gl.ouvert [data-act=exsup]');
  assert.deepEqual(await noms(p), ['Squat', 'Mollets debout']);
  assert.equal((await p.vus()).length, 0, 'aucune fenêtre');
  assert.match(await p.textContent('#annuler'), /Presse à cuisses supprimé/);
  await p.click('#annuler [data-act=undo]');
  assert.deepEqual(await noms(p), ['Squat', 'Presse à cuisses', 'Mollets debout']);
  assert.equal((await donnees(p)).sessions[0].exercises[1].sets.length, 2);
});

test('« Remplacer » ouvre la liste : le nouvel exercice prend la place et garde les séries', async () => {
  const p = await A.page();
  await donner(p, enCours());
  await p.click('nav [data-tab=seance]');
  await glisser(p, '#app .gl[data-i="1"] .gl-c');
  await p.click('#app .gl.ouvert [data-act=exrem]');
  await p.click('#pl [data-act=padd][data-n="Hack squat"]');
  assert.deepEqual(await noms(p), ['Squat', 'Hack squat', 'Mollets debout']);
  const e = (await donnees(p)).sessions[0].exercises[1];
  assert.equal(e.name, 'Hack squat');
  assert.deepEqual(e.sets.map(x => x.kg + '×' + x.reps), ['150×10', '150×10']);
});

/* ===== Mon corps : dernières mesures, modifier, supprimer ===== */
const CORPS = { ...VIDE, sessions: [{ id: 's', date: Date.now() - 2 * JOUR, dur: 40, exercises: [{ name: 'Squat', sets: [st(100, 8, true)] }] }],
  corps: [{ t: Date.now() - 21 * JOUR, kg: 80.1 }, { t: Date.now() - 14 * JOUR, kg: 79.6 }, { t: Date.now() - 7 * JOUR, kg: 79.1 }, { t: Date.now() - 3 * JOUR, taille: 82 }, { t: Date.now() - JOUR, kg: 78.6 }], rvInit: true };

test('Mon corps : les 3 dernières mesures sont listées (la plus récente en haut), « Tout voir » montre toutes', async () => {
  const p = await A.page();
  await donner(p, CORPS);
  await p.click('nav [data-tab=stats]');
  const l = await p.$$eval('#corps .gl', e => e.map(x => x.textContent));
  assert.equal(l.length, 3);
  assert.match(l[0], /78,6 kg/);
  assert.match(l[1], /Taille 82 cm/);
  await p.click('#corps [data-act=ctout]');
  assert.equal(await p.locator('#sheet .gl').count(), 5);
});

test('Mon corps : glisser une pesée → « Supprimer » (avec Annuler) ou « Modifier » (saisie préremplie)', async () => {
  const p = await A.page();
  await donner(p, CORPS);
  await p.click('nav [data-tab=stats]');
  await glisser(p, '#corps .gl:first-of-type .gl-c');
  await p.click('#corps .gl.ouvert [data-act=csup]');
  let d = await donnees(p);
  assert.equal(d.corps.length, 4);
  assert.ok(!d.corps.some(x => x.kg === 78.6));
  await p.click('#annuler [data-act=undo]');
  d = await donnees(p);
  assert.equal(d.corps.length, 5);
  await glisser(p, '#corps .gl:first-of-type .gl-c');
  await p.click('#corps .gl.ouvert [data-act=cmod]');
  assert.equal(await p.inputValue('#cf-kg'), '78,6');
  await p.fill('#cf-kg', '78,2');
  await p.click('#sheet [data-act=csave]');
  d = await donnees(p);
  assert.equal(d.corps.length, 5, 'modifiée, pas ajoutée');
  assert.equal(d.corps.at(-1).kg, 78.2);
  assert.deepEqual(p.erreurs, []);
});

/* ===== Transitions ===== */
test('changer de page : l’écran arrive en douceur (animation), et rien ne bouge si le téléphone demande moins d’animations', async () => {
  const p = await A.page();
  await p.click('nav [data-tab=stats]');
  assert.ok(await p.$('#app.entree'), 'animation d’entrée');
  const css = lire('css/app.css');
  assert.match(css, /#app\.entree\{[^}]*animation/);
  assert.match(css, /#sheet\.on\{[^}]*animation/);
  assert.match(css, /@media \(prefers-reduced-motion: ?reduce\)/);
});
