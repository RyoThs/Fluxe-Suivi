/* Fenêtres de l'app (v2.6) : elles s'affichent vraiment et le test clique dedans, comme sur le téléphone. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { demarrer, donner, donnees, seance, VIDE, RACINE } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const fenetre = p => p.$eval('.dlg', d => ({
  titre: d.querySelector('h3').textContent,
  texte: d.innerText,
  boutons: [...d.querySelectorAll('.dlg-bt button')].map(b => b.textContent),
}));

test('plus aucune fenêtre grise du téléphone dans le code (confirm / prompt / alert)', () => {
  const fichiers = (dir) => fs.readdirSync(path.join(RACINE, dir), { withFileTypes: true }).flatMap(e => e.isDirectory() ? fichiers(dir + '/' + e.name) : [dir + '/' + e.name]);
  for (const f of fichiers('js').filter(f => f.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(RACINE, f), 'utf8');
    assert.doesNotMatch(code, /(^|[^.\w])(confirm|prompt|alert)\(/m, f);
  }
});

test('plus d’émojis dans l’interface : icônes au trait', () => {
  for (const f of ['js/rappel.js', 'js/vues/historique.js', 'js/vues/seance.js', 'js/vues/guide.js']) {
    const code = fs.readFileSync(path.join(RACINE, f), 'utf8');
    assert.doesNotMatch(code, /[\u{1F300}-\u{1FAFF}\u{2B50}\u{23F1}]/u, f);
  }
});

test('supprimer une séance : fenêtre claire ; « Garder » ne fait rien, « Mettre à la corbeille » supprime', async () => {
  const p = await A.page({ auto: false });
  await donner(p, { ...VIDE, sessions: [seance('a', 2)] });
  await p.click('nav [data-tab=histo]');
  await p.click('[data-act=delsess][data-id=a]');
  const f = await fenetre(p);
  assert.equal(f.titre, 'Mettre à la corbeille ?');
  assert.match(f.texte, /Séance du .*1 exercice.*1 série.*800 kg.*30 jours/s);
  assert.deepEqual(f.boutons, ['Mettre à la corbeille', 'Garder la séance']);
  assert.ok(await p.$('.dlg-ic.rouge svg'), 'icône au trait, rouge');
  await p.click('.dlg [data-r=non]');
  assert.equal(await p.$('.dlg'), null, 'fenêtre fermée');
  assert.equal((await donnees(p)).sessions.length, 1);
  await p.click('[data-act=delsess][data-id=a]');
  await p.click('.dlg [data-r=ok]');
  await p.waitForTimeout(100);
  const d = await donnees(p);
  assert.equal(d.sessions.length, 0);
  assert.equal(d.trash[0].s.id, 'a');
  assert.deepEqual(p.erreurs, []);
});

test('toucher à côté ou appuyer sur Échap = annuler (sans risque)', async () => {
  const p = await A.page({ auto: false });
  await donner(p, { ...VIDE, sessions: [seance('a', 2)] });
  await p.click('nav [data-tab=histo]');
  await p.click('[data-act=delsess][data-id=a]');
  await p.mouse.click(195, 60); // sur le fond flouté
  await p.waitForTimeout(100);
  assert.equal(await p.$('.dlg'), null);
  await p.click('[data-act=delsess][data-id=a]');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(100);
  assert.equal(await p.$('.dlg'), null);
  assert.equal((await donnees(p)).sessions.length, 1);
});

test('terminer la séance : récapitulatif, puis « Créer une routine ? » avec le nom à taper', async () => {
  const p = await A.page({ auto: false });
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=kg][data-i="0"][data-j="0"]', '100');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '8');
  await p.click('[data-act=chk]');
  await p.click('[data-act=finish]');
  let f = await fenetre(p);
  assert.equal(f.titre, 'Terminer la séance ?');
  assert.match(f.texte, /1 exercice.*1 série.*800 kg/s);
  assert.deepEqual(f.boutons, ['Terminer et enregistrer', 'Continuer la séance']);
  await p.click('.dlg [data-r=ok]');
  await p.waitForSelector('.dlg .dlg-in');
  f = await fenetre(p);
  assert.equal(f.titre, 'Créer une routine ?');
  await p.fill('.dlg .dlg-in', 'Jambes du lundi');
  await p.click('.dlg [data-r=ok]');
  await p.waitForTimeout(100);
  const d = await donnees(p);
  assert.equal(d.current, null);
  assert.equal(d.sessions.length, 1);
  assert.deepEqual(d.routines, [{ name: 'Jambes du lundi', exercises: ['Squat'] }]);
  assert.deepEqual(p.erreurs, []);
});

test('séries remplies mais non validées : liste, puis « Les garder comme faites »', async () => {
  const p = await A.page({ auto: false });
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=kg][data-i="0"][data-j="0"]', '90');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '10');
  await p.click('[data-act=finish]');
  const f = await fenetre(p);
  assert.equal(f.titre, '1 série non validée');
  assert.match(f.texte, /Squat\s*90 kg × 10/);
  assert.deepEqual(f.boutons, ['La garder comme faite', 'Revenir à la séance']);
  await p.click('.dlg [data-r=ok]');
  await p.waitForSelector('.dlg .dlg-in'); // routine ?
  await p.click('.dlg [data-r=non]');
  await p.waitForTimeout(100);
  const d = await donnees(p);
  assert.equal(d.sessions[0].exercises[0].sets[0].reps, '10');
  assert.equal(d.routines.length, 0);
});

test('renommer la salle : le nom actuel est prérempli, Entrée enregistre', async () => {
  const p = await A.page({ auto: false });
  await p.click('nav [data-tab=aide]');
  await p.click('[data-act=gens][data-t=on-air]');
  await p.click('[data-act=gren]');
  assert.equal(await p.$eval('.dlg .dlg-in', i => i.value), 'On Air');
  await p.fill('.dlg .dlg-in', 'On Air Lyon');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(100);
  assert.equal((await donnees(p)).gyms[0].name, 'On Air Lyon');
});

test('un message d’erreur s’affiche dans l’app avec un bouton « Compris »', async () => {
  const p = await A.page({ auto: false });
  await p.click('nav [data-tab=histo]');
  await p.click('[data-act=data]');
  await p.setInputFiles('#fi', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"rien":1}') });
  await p.waitForSelector('.dlg');
  const f = await fenetre(p);
  assert.equal(f.titre, 'Fichier non reconnu');
  assert.deepEqual(f.boutons, ['Compris']);
  await p.click('.dlg [data-r=ok]');
  assert.equal(await p.$('.dlg'), null);
});
