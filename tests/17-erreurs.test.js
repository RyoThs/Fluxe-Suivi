/* v3.2 : Rapport d'erreurs. L'app note ses erreurs, les montre dans Mes données,
   les envoie automatiquement avec un compte (faux serveur) ou prépare un e-mail sans compte. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, seance, VIDE, lire } = require('./outils');
const { installer, serveur } = require('./nuage-faux');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const journal = p => p.evaluate(() => JSON.parse(localStorage.getItem('fluxe-suivi-erreurs-v1') || '{"liste":[]}').liste);
const ouvrir = async p => { await p.click('nav [data-tab=histo]'); await p.click('[data-act=data]'); await p.waitForSelector('#erreurs'); };
const boum = (p, m) => p.evaluate(m => new Promise(r => setTimeout(() => { setTimeout(r, 50); throw new Error(m); })), m);

test('sans erreur : carte « Aucune erreur », pas de case d’envoi sans compte', async () => {
  const p = await A.page();
  await ouvrir(p);
  assert.match(await p.textContent('#erreurs'), /Aucune erreur/);
  assert.equal(await p.$('#erenv'), null);
  assert.deepEqual(p.erreurs, []);
});

test('une erreur imprévue est notée ; la même erreur répétée est comptée (×2), pas recopiée', async () => {
  const p = await A.page();
  await boum(p, 'panne test');
  await boum(p, 'panne test');
  const l = await journal(p);
  assert.equal(l.length, 1);
  assert.equal(l[0].msg, 'panne test');
  assert.equal(l[0].n, 2);
  assert.match(l[0].ver, /^\d+\.\d+\.\d+$/);
  assert.ok(l[0].app);
  await ouvrir(p);
  assert.match(await p.textContent('#erreurs'), /1 erreur ces 7 derniers jours/);
  assert.match(await p.textContent('#erreurs'), /×2/);
});

test('un écran qui plante : message à la place de l’écran, erreur notée avec un titre clair', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 2)] });
  await p.evaluate(() => { window.__vrai = Date.prototype.toLocaleDateString; Date.prototype.toLocaleDateString = () => { throw new Error('date cassée'); }; });
  await p.click('nav [data-tab=stats]');
  assert.match(await p.textContent('#app'), /Cet écran n’a pas pu s’afficher/);
  await p.evaluate(() => { Date.prototype.toLocaleDateString = window.__vrai; });
  const l = await journal(p);
  assert.equal(l[0].titre, 'Impossible d’afficher les Stats');
  assert.equal(l[0].msg, 'date cassée');
  await p.click('nav [data-tab=seance]');
  assert.ok(await p.$('[data-act=start]'), 'les autres onglets marchent');
});

test('un bouton qui plante : message court, erreur notée avec le nom du bouton', async () => {
  const p = await A.page();
  await p.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText() { throw new Error('presse-papiers'); } }, configurable: true }));
  await ouvrir(p);
  await p.click('[data-act=export]');
  assert.match(await p.textContent('#toast'), /Un problème est survenu/);
  const l = await journal(p);
  assert.equal(l[0].titre, 'Le bouton « Copier les données en texte » n’a pas marché');
});

test('sans compte : « Envoyer par mail » prépare un message à fluxe.suivi@outlook.fr, sans séance ; « Effacer » vide le journal', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, sessions: [seance('a', 2, { exercises: [{ name: 'SquatSecret', sets: [{ kg: '100', reps: '5', done: true }] }] })] });
  await boum(p, 'panne mail');
  await ouvrir(p);
  const href = await p.getAttribute('#erreurs a.sec', 'href');
  assert.match(href, /^mailto:fluxe\.suivi@outlook\.fr\?subject=/);
  const corps = decodeURIComponent(href);
  assert.match(corps, /panne mail/);
  assert.doesNotMatch(corps, /SquatSecret/);
  p.reponses.push(true);
  await p.click('[data-act=erclr]');
  assert.deepEqual(await journal(p), []);
  assert.match(await p.textContent('#erreurs'), /Aucune erreur/);
});

test('avec un compte : envoi automatique (identifiant du compte, aucune séance) ; case décochée = plus d’envoi', async () => {
  const p = await A.page();
  await p.context().addInitScript(installer);
  await donner(p, { ...VIDE, sessions: [seance('a', 2)] });
  await p.click('nav [data-tab=histo]'); await p.click('[data-act=data]'); await p.waitForSelector('#nuage');
  await p.fill('#nm', 'yo@test.fr'); await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]');
  await p.waitForFunction(() => /À jour/.test(document.querySelector('#nuage .st')?.textContent || ''));
  await boum(p, 'panne envoyée');
  await p.waitForFunction(() => (JSON.parse(localStorage.getItem('__serveur')).erreurs || []).length === 1);
  const srv = await serveur(p), e = srv.erreurs[0];
  assert.equal(e.uid, srv.user.uid);
  assert.equal(e.msg, 'panne envoyée');
  assert.deepEqual(Object.keys(e).sort(), ['app', 'msg', 'n', 'ou', 'quand', 'titre', 'uid', 'ver']);
  await p.waitForFunction(() => /envoyée ✓/.test(document.querySelector('#erreurs').textContent));
  await p.uncheck('#erenv');
  await boum(p, 'panne gardée');
  await p.waitForTimeout(300);
  assert.equal((await serveur(p)).erreurs.length, 1, 'rien envoyé une fois la case décochée');
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('fluxe-suivi-erreurs-v1')).envoi), false);
});

test('règles : un compte peut seulement ENVOYER une erreur signée de son identifiant ; personne ne peut les relire depuis l’app', () => {
  const r = lire('firestore.rules');
  assert.match(r, /match \/erreurs\/\{id\}/);
  assert.match(r, /request\.resource\.data\.uid == request\.auth\.uid/);
  assert.match(r, /allow read, update, delete: if false;/);
  assert.match(lire('confidentialite.html'), /Rapport d’erreurs/);
});
