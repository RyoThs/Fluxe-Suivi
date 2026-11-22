/* Catalogue partagé par club (v3.8.0) : les membres d'un même club corrigent ensemble la liste des machines.
   - « Pas dans ma salle » : la machine disparaît de MA liste tout de suite ; pour le club, après 3 signalements
     (et plus de signalements que de confirmations).
   - « Ajouter une machine » : elle apparaît dans MA salle tout de suite ; pour le club, quand 3 membres l'ont vue.
   - Badge « vérifiée » : 2 membres ont confirmé que la machine est là.
   Il faut un compte vérifié pour partager ; sans compte, l'app marche comme avant. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let C;
test.before(async () => { C = await import(url('club.js')); });

const av = (m, k, u, extra = {}) => ({ m, k, u, t: 1, ...extra });

test('bilan : une machine est retirée pour le club après 3 signalements « pas dans ma salle »', () => {
  const deux = C.bilanClub([av('Pec deck', 'absent', 'a'), av('Pec deck', 'absent', 'b')]);
  assert.equal(deux.retirees.has('pec deck'), false, '2 signalements ne suffisent pas');
  const trois = C.bilanClub([av('Pec deck', 'absent', 'a'), av('Pec deck', 'absent', 'b'), av('Pec deck', 'absent', 'c')]);
  assert.equal(trois.retirees.has('pec deck'), true);
});

test('bilan : si autant de membres confirment qu’elle est là, la machine n’est pas retirée', () => {
  const b = C.bilanClub([av('Pec deck', 'absent', 'a'), av('Pec deck', 'absent', 'b'), av('Pec deck', 'absent', 'c'),
    av('Pec deck', 'present', 'd'), av('Pec deck', 'present', 'e'), av('Pec deck', 'present', 'f')]);
  assert.equal(b.retirees.has('pec deck'), false);
});

test('bilan : un même membre ne compte qu’une fois (son dernier avis compte)', () => {
  const b = C.bilanClub([av('Pec deck', 'absent', 'a'), av('Pec deck', 'absent', 'a'), av('Pec deck', 'absent', 'a')]);
  assert.equal(b.retirees.has('pec deck'), false);
  const change = C.bilanClub([{ ...av('Rameur', 'absent', 'a'), t: 1 }, { ...av('Rameur', 'present', 'a'), t: 2 },
    av('Rameur', 'absent', 'b'), av('Rameur', 'absent', 'c')]);
  assert.equal(change.retirees.has('rameur'), false, 'a a changé d’avis : 2 signalements seulement');
});

test('bilan : une machine ajoutée apparaît pour le club quand 3 membres l’ont vue (ajout ou confirmation)', () => {
  const deux = C.bilanClub([av('Presse inclinée', 'ajout', 'a', { g: 'Jambes', b: 'Matrix' }), av('Presse inclinée', 'present', 'b')]);
  assert.deepEqual(deux.ajoutees, []);
  const trois = C.bilanClub([av('Presse inclinée', 'ajout', 'a', { g: 'Jambes', b: 'Matrix' }), av('presse inclinée ', 'present', 'b'), av('Presse inclinée', 'ajout', 'c', { g: 'Jambes' })]);
  assert.deepEqual(trois.ajoutees, [{ nom: 'Presse inclinée', muscle: 'Jambes', marque: 'Matrix', n: 3 }]);
});

test('bilan : badge « vérifiée » quand 2 membres confirment qu’une machine est là', () => {
  assert.equal(C.bilanClub([av('Rameur', 'present', 'a')]).verifiees.has('rameur'), false);
  assert.equal(C.bilanClub([av('Rameur', 'present', 'a'), av('Rameur', 'present', 'b')]).verifiees.has('rameur'), true);
});

test('bilan : avis invalides ignorés (genre inconnu, sans compte, sans nom)', () => {
  const b = C.bilanClub([null, 'x', { m: '', k: 'absent', u: 'a' }, { m: 'Rameur', k: 'pirate', u: 'a' }, { m: 'Rameur', k: 'present' },
    av('Rameur', 'present', 'a'), av('Rameur', 'present', 'b')]);
  assert.equal(b.verifiees.has('rameur'), true);
  assert.equal(b.membres, 2);
});

test('documents lus sur le serveur : seuls les champs texte et nombre attendus sont gardés, coupés à leur taille', () => {
  const docs = [
    { id: 'abc', data: { n: 'Basic-Fit Lyon Part-Dieu', e: 'basic-fit', v: 'Lyon', u: 'x'.repeat(200), t: 123, pirate: '<script>', k: { objet: 1 } } },
    { id: 'mauvais', data: 'rien' },
    null,
  ];
  assert.deepEqual(C.depuisServeur(docs), [{ id: 'abc', n: 'Basic-Fit Lyon Part-Dieu', e: 'basic-fit', v: 'Lyon', u: 'x'.repeat(128), t: 123 }]);
  assert.deepEqual(C.depuisServeur(null), []);
  assert.deepEqual(C.depuisServeur('x'), []);
});

test('club et avis venant du serveur sont nettoyés (enseigne connue, muscle connu, tailles limitées)', () => {
  assert.deepEqual(C.nettoyerClub({ id: 'abc', n: ' Basic-Fit  Lyon ', e: 'basic-fit', v: 'Lyon', u: 'a', t: 5 }), { id: 'abc', n: 'Basic-Fit Lyon', e: 'basic-fit', v: 'Lyon' });
  assert.equal(C.nettoyerClub({ id: 'a/b', n: 'X', e: 'basic-fit' }), null, 'identifiant invalide');
  assert.equal(C.nettoyerClub({ id: 'abc', n: '', e: 'basic-fit' }), null, 'sans nom');
  assert.equal(C.nettoyerClub({ id: 'abc', n: 'X', e: 'inconnue' }).e, 'autre');
  assert.deepEqual(C.nettoyerAvis({ m: 'Presse', k: 'ajout', u: 'a', t: 3, g: 'Volant', b: 'M'.repeat(50) }), { m: 'Presse', k: 'ajout', u: 'a', t: 3, b: 'M'.repeat(30) });
  assert.deepEqual(C.nettoyerAvis({ m: 'Presse', k: 'ajout', u: 'a', t: 3, g: 'Jambes' }), { m: 'Presse', k: 'ajout', u: 'a', t: 3, g: 'Jambes' });
  assert.equal(C.nettoyerAvis({ m: 'Presse', k: 'pirate', u: 'a' }), null);
});

test('un avis a un identifiant fixe par machine et par compte (redonner son avis remplace l’ancien)', () => {
  const a = C.idAvis('Pec deck', 'uid123'), b = C.idAvis(' PEC DECK ', 'uid123');
  assert.equal(a, b);
  assert.match(a, /^[a-z0-9]{1,12}_uid123$/);
  assert.notEqual(C.idAvis('Rameur', 'uid123'), a);
});

/* ===== Dans l'app ===== */
const fs = require('node:fs');
const { demarrer, donner, donnees, VIDE } = require('./outils');
const { installer, serveur } = require('./nuage-faux');
let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

test('données : le lien vers le club est gardé ; un lien abîmé est ignoré sans rien casser', async () => {
  const p = await A.page();
  const f = JSON.parse(fs.readFileSync(path.join(__dirname, 'anciennes-sauvegardes', 'v3.8-club.json'), 'utf8')).data;
  f.gyms.push({ id: 'g2', name: 'Autre', eq: [], notes: {}, club: '../pirate', clubNom: 'x'.repeat(200) });
  await donner(p, f);
  const d = await donnees(p);
  assert.equal(d.gyms[0].club, 'AbC123');
  assert.equal(d.gyms[0].clubNom, 'Basic-Fit Lyon Part-Dieu');
  assert.equal(d.gyms[1].club, undefined, 'identifiant de club invalide');
  assert.equal(d.gyms[1].clubNom, undefined);
  assert.deepEqual(p.erreurs, []);
});

test('fichier v3.8 « Fusionner » : une salle sans club reprend le club du fichier', async () => {
  const p = await A.page();
  await donner(p, { ...VIDE, gyms: [{ id: 'g1', name: 'Ma salle', chain: 'basic-fit', eq: ['Développé couché'], notes: {} }], gym: 'g1' });
  await p.click('nav [data-tab=histo]'); await p.click('[data-act=data]'); await p.waitForSelector('#sheet [data-act=file]');
  await p.setInputFiles('#fi', path.join(__dirname, 'anciennes-sauvegardes', 'v3.8-club.json'));
  await p.waitForSelector('[data-act=imerge]'); await p.click('[data-act=imerge]'); await p.waitForTimeout(300);
  const d = await donnees(p);
  assert.equal(d.gyms[0].club, 'AbC123');
  assert.ok(d.gyms[0].eq.includes('Presse à cuisses inclinée'));
});

/* ----- outils de ces tests ----- */
let CAT;
test.before(async () => { CAT = await import(url('catalogue.js')); });
const BF = () => CAT.catOf(CAT.CHAINS.find(c => c.id === 'basic-fit'));
const SALLE = (extra = {}) => ({ ...VIDE, gyms: [{ id: 'g1', name: 'Basic-Fit Lyon Part-Dieu', chain: 'basic-fit', eq: BF(), notes: {}, ...extra }], gym: 'g1' });
const COMPTE = { uid: 'u1', email: 'yo@test.fr', verifie: true, envoye: {}, metaMod: 0, metaEnvoye: 0, metaHash: '', dernier: 0, dernierT: 0 };
/* ouvre l'app avec le faux serveur ; compte = 'verifie' | 'non-verifie' | null */
async function ouvrir(donneesApp, srv = {}, compte = null) {
  const p = await A.page();
  await p.context().addInitScript(installer);
  await p.evaluate(([srv, compte, C]) => {
    const s = { comptes: {}, data: {}, t: 1000, user: null, clubs: {}, avis: {}, ...srv };
    if (compte) { s.comptes['yo@test.fr'] = { m: 'motdepasse', uid: 'u1', ok: compte === 'verifie' }; s.user = { uid: 'u1', email: 'yo@test.fr', verifie: compte === 'verifie' }; }
    localStorage.setItem('__serveur', JSON.stringify(s));
    if (compte) localStorage.setItem('fluxe-suivi-nuage-v1', JSON.stringify({ ...C, verifie: compte === 'verifie' }));
  }, [srv, compte, COMPTE]);
  await donner(p, donneesApp);
  await p.click('nav [data-tab=aide]');
  await p.waitForTimeout(250);
  return p;
}
const avisDe = (m, k, u, extra = {}) => ({ m, k, u, t: 5, ...extra });

test('salle pas encore reliée : bouton « Relier à mon club », liste des clubs de son enseigne, choix enregistré', async () => {
  const p = await ouvrir(SALLE(), { clubs: { c1: { n: 'Basic-Fit Lyon Part-Dieu', e: 'basic-fit', v: 'Lyon' }, c2: { n: 'Basic-Fit Paris Bastille', e: 'basic-fit', v: 'Paris' }, c3: { n: 'Fitness Park Lyon', e: 'fitness-park', v: 'Lyon' } } });
  await p.click('[data-act=clien]');
  await p.waitForSelector('#sheet [data-act=cchoix]');
  const noms = await p.$$eval('#sheet [data-act=cchoix]', l => l.map(b => b.textContent));
  assert.equal(noms.length, 2, 'seulement les clubs Basic-Fit');
  assert.match(noms[0], /Lyon Part-Dieu/);
  await p.click('#sheet [data-act=cchoix][data-id=c1]');
  await p.waitForTimeout(200);
  const d = await donnees(p);
  assert.equal(d.gyms[0].club, 'c1');
  assert.equal(d.gyms[0].clubNom, 'Basic-Fit Lyon Part-Dieu');
  assert.match(await p.textContent('.card.gym'), /Club partagé/);
  assert.deepEqual(p.erreurs, []);
});

test('créer son club : demande un compte vérifié ; avec compte, le club est créé et relié', async () => {
  let p = await ouvrir(SALLE());
  await p.click('[data-act=clien]');
  await p.waitForSelector('#sheet [data-act=ccree]');
  await p.click('#sheet [data-act=ccree]');
  await p.waitForTimeout(200);
  assert.match((await p.vus()).join(' '), /compte/i);
  assert.equal((await donnees(p)).gyms[0].club, undefined);

  p = await ouvrir(SALLE(), {}, 'verifie');
  await p.click('[data-act=clien]');
  await p.waitForSelector('#cl-n');
  await p.fill('#cl-n', 'Basic-Fit Lyon Part-Dieu');
  await p.fill('#cl-v', 'Lyon');
  await p.click('#sheet [data-act=ccree]');
  await p.waitForTimeout(400);
  const s = await serveur(p);
  assert.deepEqual(Object.values(s.clubs), [{ n: 'Basic-Fit Lyon Part-Dieu', e: 'basic-fit', v: 'Lyon', u: 'u1' }]);
  assert.equal((await donnees(p)).gyms[0].club, Object.keys(s.clubs)[0]);
});

test('salle reliée : encart « Ta salle est-elle juste ? », bouton « … » sur chaque machine, badge « vérifiée »', async () => {
  const [m0] = BF();
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Basic-Fit Lyon Part-Dieu' }), { clubs: { c1: { n: 'Basic-Fit Lyon Part-Dieu', e: 'basic-fit', v: 'Lyon' } }, avis: { c1: { a: avisDe(m0, 'present', 'x'), b: avisDe(m0, 'present', 'y') } } });
  await p.waitForSelector('.verif');
  assert.match(await p.textContent('#app'), /Ta salle est-elle juste/);
  assert.equal(await p.locator('#gl [data-act=csig]').count(), await p.locator('#gl .gi').count());
  const ligne = p.locator('#gl .gi', { hasText: m0 }).first();
  assert.equal(await ligne.locator('.verif').count(), 1);
  assert.deepEqual(p.erreurs, []);
});

test('le club décide : machine signalée par 3 membres retirée du catalogue, machine vue par 3 membres ajoutée', async () => {
  const [m0, m1] = BF();
  const avis = { a: avisDe(m1, 'absent', 'x'), b: avisDe(m1, 'absent', 'y'), c: avisDe(m1, 'absent', 'z'),
    d: avisDe('Presse à cuisses inclinée', 'ajout', 'x', { g: 'Jambes', b: 'Matrix' }), e: avisDe('Presse à cuisses inclinée', 'present', 'y'), f: avisDe('Presse à cuisses inclinée', 'present', 'z') };
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Club' }), { avis: { c1: avis } });
  await p.click('[data-act=gv][data-v=cat]');
  await p.waitForTimeout(300);
  const noms = await p.$$eval('#gl .gi .pt b', l => l.map(b => b.childNodes[0].textContent.trim()));
  assert.ok(noms.includes(m0));
  assert.ok(!noms.includes(m1), 'retirée par le club');
  assert.ok(noms.includes('Presse à cuisses inclinée'), 'ajoutée par le club');
  assert.match(await p.locator('#gl .gi', { hasText: 'Presse à cuisses inclinée' }).textContent(), /Matrix/);
});

test('signaler « pas dans ma salle » : retirée de MA salle tout de suite ; avec compte, l’avis part au club', async () => {
  const [m0] = BF();
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Club' }), {}, 'verifie');
  await p.locator('#gl .gi', { hasText: m0 }).first().locator('[data-act=csig]').click();
  await p.waitForSelector('#sheet [data-act=csel][data-k=absent]');
  await p.click('#sheet [data-act=csel][data-k=absent]');
  await p.click('#sheet [data-act=cenv]');
  await p.waitForTimeout(400);
  assert.ok(!(await donnees(p)).gyms[0].eq.includes(m0));
  const s = await serveur(p);
  assert.deepEqual(Object.values(s.avis.c1).map(a => [a.m, a.k, a.u]), [[m0, 'absent', 'u1']]);
});

test('sans compte : la correction reste dans MA liste et l’app explique comment partager', async () => {
  const [m0] = BF();
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Club' }));
  await p.locator('#gl .gi', { hasText: m0 }).first().locator('[data-act=csig]').click();
  await p.click('#sheet [data-act=csel][data-k=absent]');
  await p.click('#sheet [data-act=cenv]');
  await p.waitForTimeout(300);
  assert.ok(!(await donnees(p)).gyms[0].eq.includes(m0));
  assert.equal(JSON.stringify((await serveur(p)).avis), '{}');
  assert.match(await p.textContent('#toast'), /compte|Sauvegarde en ligne/i);
});

test('« Je confirme » envoie une confirmation et remet la machine dans MA salle', async () => {
  const [m0] = BF();
  const eq = BF().filter(n => n !== m0);
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Club', eq }), {}, 'verifie');
  await p.click('[data-act=gv][data-v=cat]');
  await p.locator('#gl .gi', { hasText: m0 }).first().locator('[data-act=csig]').click();
  await p.click('#sheet [data-act=csel][data-k=present]');
  await p.click('#sheet [data-act=cenv]');
  await p.waitForTimeout(400);
  assert.ok((await donnees(p)).gyms[0].eq.includes(m0));
  assert.equal(Object.values((await serveur(p)).avis.c1)[0].k, 'present');
});

test('ajouter une machine vue : dans MA salle tout de suite (avec son muscle), et partagée avec le club', async () => {
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Club' }), {}, 'verifie');
  await p.click('[data-act=cajout]');
  await p.waitForSelector('#am-n');
  await p.fill('#am-n', 'Presse à cuisses inclinée');
  await p.fill('#am-b', 'Matrix');
  await p.selectOption('#am-g', 'Jambes');
  await p.click('#sheet [data-act=cajm]');
  await p.waitForTimeout(400);
  const d = await donnees(p);
  assert.ok(d.gyms[0].eq.includes('Presse à cuisses inclinée'));
  assert.equal(d.mu['Presse à cuisses inclinée'], 'Jambes');
  const a = Object.values((await serveur(p)).avis.c1)[0];
  assert.deepEqual([a.m, a.k, a.g, a.b], ['Presse à cuisses inclinée', 'ajout', 'Jambes', 'Matrix']);
  await p.click('[data-act=gv][data-v=salle]');
  assert.ok((await p.textContent('#gl')).includes('Presse à cuisses inclinée'), 'visible dans Ma salle');
});

test('panne volontaire : serveur hors ligne ou réponse abîmée → le Guide s’affiche quand même, sans erreur', async () => {
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Club' }), { avis: { c1: { a: { m: 42, k: '<b>', u: null }, b: 'n’importe quoi' } } });
  assert.ok(await p.locator('#gl .gi').count() > 10);
  await p.evaluate(() => { window.__horsLigne = true; });
  await p.click('[data-act=clien]');
  await p.waitForTimeout(300);
  assert.ok(await p.locator('#sheet.on').count());
  assert.deepEqual(p.erreurs, []);
});

test('sécurité : un nom de club ou de machine piégé venant du serveur reste du texte', async () => {
  const P = '<img src=x onerror="window.__piege=1">';
  const p = await ouvrir(SALLE({ club: 'c1', clubNom: 'Club' }), { clubs: { c9: { n: 'Club ' + P, e: 'basic-fit', v: P } },
    avis: { c1: { a: avisDe('Machine ' + P, 'ajout', 'x', { g: 'Dos', b: P }), b: avisDe('Machine ' + P, 'present', 'y'), c: avisDe('Machine ' + P, 'present', 'z') } } });
  await p.click('[data-act=gv][data-v=cat]');
  await p.waitForTimeout(300);
  await p.click('[data-act=clien]');
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => window.__piege || 0), 0);
  assert.match(await p.textContent('#sheet'), /<img src=x/);
});

test('règles de la base : clubs et avis lisibles par tous ; écriture seulement par un compte vérifié, et seulement ses propres avis', () => {
  const r = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const clubs = (r.match(/match \/clubs\/\{club\} \{([\s\S]*?)match \/avis/) || [])[1] || '';
  const avis = (r.match(/match \/avis\/\{id\} \{([\s\S]*?)\n\s{6}\}/) || [])[1] || '';
  assert.match(clubs, /allow read: if true;/);
  assert.match(clubs, /email_verified == true/);
  assert.match(clubs, /request\.resource\.data\.u == request\.auth\.uid/);
  assert.match(clubs, /allow update, delete: if false;/, 'un club ne se modifie pas depuis l’app');
  assert.match(avis, /allow read: if true;/);
  assert.match(avis, /email_verified == true/);
  assert.match(avis, /id\.matches\('\^\[a-z0-9\]\{1,12\}_' \+ request\.auth\.uid \+ '\$'\)/, 'l’identifiant de l’avis contient le compte de son auteur');
  assert.match(avis, /hasOnly\(\['m', 'k', 'u', 't', 'g', 'b'\]\)/);
  assert.match(avis, /\['absent', 'present', 'marque', 'nom', 'ajout'\]/);
});
