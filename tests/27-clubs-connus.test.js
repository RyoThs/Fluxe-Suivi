/* Clubs connus d'avance (v3.9.0) : les salles d'une enseigne sont déjà dans l'app.
   On cherche sa salle (nom, ville ou code postal) au lieu de la créer : pas de doublons, même hors ligne,
   et rien n'est écrit sur le serveur pour ces clubs (seuls les avis des membres le sont).
   Première enseigne : On Air, 137 clubs en France (DOM-TOM compris), liste lue sur le site officiel le 2026-11-23. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE } = require('./outils');
const { installer } = require('./nuage-faux');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let K, C, CAT, A;
test.before(async () => {
  K = await import(url('clubs-connus.js'));
  C = await import(url('club.js'));
  CAT = await import(url('catalogue.js'));
  A = await demarrer();
});
test.after(async () => { await A.fermer(); });

test('On Air : les 137 clubs de France sont connus, chacun avec un identifiant fixe et valide', () => {
  const l = K.clubsConnus('on-air');
  assert.equal(l.length, 137);
  assert.equal(new Set(l.map(c => c.id)).size, 137, 'aucun identifiant en double');
  for (const c of l) {
    assert.match(c.id, /^onair-[a-z0-9-]+$/);
    assert.ok(c.id.length <= 40, c.id + ' trop long');
    assert.equal(c.e, 'on-air');
    assert.match(c.n, /^On Air /);
    assert.match(c.cp, /^\d{5}$/, c.n + ' : code postal');
    assert.ok(c.v, c.n + ' : ville');
    assert.ok(C.nettoyerClub(c), c.n + ' : passe le contrôle des clubs');
  }
  assert.deepEqual(K.clubsConnus('basic-fit'), [], 'les autres enseignes viendront ensuite');
  assert.deepEqual(K.clubsConnus('inconnue'), []);
});

test('On Air : les DOM-TOM sont là, avec le nom du territoire dans la ville', () => {
  const l = K.clubsConnus('on-air');
  const v = n => (l.find(c => c.n === n) || {}).v;
  assert.equal(v('On Air Martinique Le Lamentin'), 'Le Lamentin (Martinique)');
  assert.equal(v('On Air Ducos'), 'Ducos (Martinique)');
  assert.equal(v('On Air Guadeloupe La Jaille'), 'Baie-Mahault (Guadeloupe)');
  assert.equal(v('On Air La Réunion Saint-Denis'), 'Saint-Denis (La Réunion)');
  assert.equal(v('On Air La Réunion Saint-Pierre'), 'Saint-Pierre (La Réunion)');
  assert.equal(l.filter(c => c.b).length, 16, '16 clubs en pré-ouverture');
  assert.ok(l.find(c => c.n === 'On Air Ducos').b);
  assert.ok(!l.find(c => c.n === 'On Air Martinique Le Lamentin').b);
});

test('chercher : par code postal ou par territoire', () => {
  const l = K.clubsConnus('on-air');
  const noms = q => C.chercherClubs(l, q).map(c => c.n);
  assert.deepEqual(noms('80480'), ['On Air Amiens'], 'le club « Amiens » est à Dury');
  assert.deepEqual(noms('dury'), ['On Air Amiens']);
  assert.deepEqual(noms('martinique').sort(), ['On Air Ducos', 'On Air Martinique Le Lamentin']);
  assert.deepEqual(noms('lamentin'), ['On Air Martinique Le Lamentin']);
  assert.equal(noms('lyon').length, 5);
});

/* ----- dans l'app ----- */
const SALLE_ONAIR = () => ({ ...VIDE, gyms: [{ id: 'g1', name: 'On Air', chain: 'on-air', eq: CAT.catOf(CAT.ONAIR), notes: {} }], gym: 'g1' });
async function ouvrir(srv = {}) {
  const p = await A.page();
  await p.context().addInitScript(installer);
  await p.evaluate(srv => localStorage.setItem('__serveur', JSON.stringify({ comptes: {}, data: {}, t: 1000, user: null, clubs: {}, avis: {}, ...srv })), srv);
  await donner(p, SALLE_ONAIR());
  await p.click('nav [data-tab=aide]');
  await p.waitForTimeout(250);
  await p.click('[data-act=clien]');
  await p.waitForSelector('#sheet [data-act=cchoix]');
  return p;
}

test('« Mon club » On Air : les 137 clubs sont proposés, on cherche sa salle et on la relie sans rien créer', async () => {
  const p = await ouvrir();
  assert.match(await p.textContent('#clist'), /Clubs On Air · 137/);
  assert.equal(await p.locator('#cl-n').count(), 0, 'pas de formulaire de création : le petit lien suffit');
  await p.fill('#cq', 'lamentin');
  assert.equal(await p.locator('#sheet [data-act=cchoix]').count(), 1);
  await p.click('#sheet [data-act=cchoix]');
  await p.waitForTimeout(200);
  const g = (await donnees(p)).gyms[0];
  assert.equal(g.club, 'onair-martinique-le-lamentin');
  assert.equal(g.clubNom, 'On Air Martinique Le Lamentin');
  assert.deepEqual(p.erreurs, []);
});

test('« Mon club » On Air : étiquette « bientôt » sur un club en pré-ouverture', async () => {
  const p = await ouvrir();
  await p.fill('#cq', 'ducos');
  assert.match(await p.textContent('#clist .copt'), /bientôt/);
  await p.fill('#cq', 'lamentin');
  assert.doesNotMatch(await p.textContent('#clist .copt'), /bientôt/);
});

test('« Mon club » On Air : un club créé par un membre s’ajoute à la liste, sans doublon ; hors ligne la liste reste là', async () => {
  let p = await ouvrir({ clubs: { x1: { n: 'On Air Nouveau Club', e: 'on-air', v: 'Toulouse' } } });
  assert.match(await p.textContent('#clist'), /Clubs On Air · 138/);
  p = await A.page();
  await p.context().addInitScript(installer);
  await p.evaluate(() => { window.__horsLigne = true; });
  await donner(p, SALLE_ONAIR());
  await p.evaluate(() => { window.__horsLigne = true; });
  await p.click('nav [data-tab=aide]');
  await p.waitForTimeout(250);
  await p.click('[data-act=clien]');
  await p.waitForSelector('#sheet [data-act=cchoix]');
  assert.match(await p.textContent('#clist'), /Clubs On Air · 137/);
  assert.deepEqual(p.erreurs, []);
});

/* ----- v3.10.0 : Basic-Fit (903 clubs, liste lue sur le site officiel le 2026-11-23) ----- */
test('Basic-Fit : les 903 clubs de France sont connus, identifiants fixes et valides, sans doublon avec On Air', () => {
  const l = K.clubsConnus('basic-fit');
  assert.equal(l.length, 903);
  assert.equal(new Set(l.map(c => c.id)).size, 903);
  for (const c of l) {
    assert.match(c.id, /^bf-[a-z0-9-]+$/);
    assert.ok(c.id.length <= 40, c.id);
    assert.equal(c.e, 'basic-fit');
    assert.match(c.n, /^Basic-Fit /);
    assert.match(c.cp, /^\d{5}$/, c.n);
    assert.ok(C.nettoyerClub(c), c.n);
  }
  const tous = [...l, ...K.clubsConnus('on-air')].map(c => c.id);
  assert.equal(new Set(tous).size, tous.length, 'aucun identifiant partagé entre enseignes');
});
test('Basic-Fit : on trouve un club par ville, par rue ou par code postal', () => {
  const l = K.clubsConnus('basic-fit');
  const noms = q => C.chercherClubs(l, q).map(c => c.n);
  assert.deepEqual(noms('albi 81'), ['Basic-Fit Albi Francisco Goya', 'Basic-Fit Albi Les Portes d\'Albi', 'Basic-Fit Albi Route de la Drèche']);
  assert.deepEqual(noms('dreche'), ['Basic-Fit Albi Route de la Drèche'], 'par la rue, sans accent');
  assert.ok(noms('80200').some(n => /Péronne/.test(n)), 'Péronne (rue de Lisbonne) est bien là');
});
test('« Mon club » Basic-Fit : les clubs sont proposés et on relie sa salle sans rien créer', async () => {
  const p = await A.page();
  await p.context().addInitScript(installer);
  await p.evaluate(() => localStorage.setItem('__serveur', JSON.stringify({ comptes: {}, data: {}, t: 1000, user: null, clubs: {}, avis: {} })));
  await donner(p, { ...VIDE, gyms: [{ id: 'g1', name: 'Basic-Fit', chain: 'basic-fit', eq: CAT.catOf(CAT.CHAINS.find(c => c.id === 'basic-fit')), notes: {} }], gym: 'g1' });
  await p.click('nav [data-tab=aide]');
  await p.waitForTimeout(250);
  await p.click('[data-act=clien]');
  await p.waitForSelector('#sheet [data-act=cchoix]');
  assert.match(await p.textContent('#clist'), /Clubs Basic-Fit · 903/);
  await p.fill('#cq', 'dreche');
  await p.click('#sheet [data-act=cchoix]');
  await p.waitForTimeout(200);
  assert.equal((await donnees(p)).gyms[0].clubNom, 'Basic-Fit Albi Route de la Drèche');
  assert.deepEqual(p.erreurs, []);
});
