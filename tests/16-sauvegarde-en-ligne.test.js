/* v3.0 : Sauvegarde en ligne (facultative). Testée avec un faux serveur qui imite Firebase (tests/nuage-faux.js). */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, seance, VIDE, lire } = require('./outils');
const { installer, serveur } = require('./nuage-faux');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });
const st = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });

/* un « appareil » : une page avec le faux serveur, éventuellement rempli avec celui d'un autre appareil */
async function appareil(d, srv) {
  const p = await A.page();
  await p.context().addInitScript(installer);
  if (srv) await serveur(p, srv);
  await donner(p, d || VIDE);
  return p;
}
const ouvrir = async p => { await p.click('nav [data-tab=histo]'); await p.click('[data-act=data]'); await p.waitForSelector('#nuage'); };
const attendre = (p, f) => p.waitForFunction(f, null, { timeout: 5000 });
const aJour = p => attendre(p, () => /À jour/.test(document.querySelector('#nuage .st') ? document.querySelector('#nuage .st').textContent : ''));

test('sans configuration Firebase, la carte n’apparaît pas et Firebase n’est jamais téléchargé', async () => {
  assert.match(lire('js/nuage-config.js'), /export const FIREBASE=null;|export const FIREBASE=\{/);
  const p = await A.page();
  const fb = []; p.on('request', r => { if (/firebase/.test(r.url())) fb.push(r.url()); });
  await p.click('nav [data-tab=histo]'); await p.click('[data-act=data]');
  if (/FIREBASE=null/.test(lire('js/nuage-config.js'))) assert.equal(await p.$('#nuage'), null);
  assert.deepEqual(fb, [], 'aucun fichier Firebase chargé sans compte');
  assert.deepEqual(p.erreurs, []);
});

test('créer un compte : mot de passe trop court refusé, puis séances, routines et salles envoyées en ligne', async () => {
  const p = await appareil({ ...VIDE, sessions: [seance('a', 3), seance('b', 1)], routines: [{ id: 'r1', name: 'Jambes', exercises: ['Squat'] }] });
  await ouvrir(p);
  await p.fill('#nm', 'yo@test.fr'); await p.fill('#np', '123');
  await p.click('[data-act=nok]');
  await attendre(p, () => /8 caractères/.test(document.querySelector('#nuage').textContent));
  await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]');
  await aJour(p);
  const srv = await serveur(p), d = srv.data[srv.user.uid];
  assert.deepEqual(Object.keys(d.s).sort(), ['a', 'b']);
  assert.equal(JSON.parse(d.s.a.j).exercises[0].name, 'Squat');
  assert.equal(JSON.parse(d.m.j).routines[0].name, 'Jambes');
  assert.match(await p.textContent('#nuage'), /yo@test\.fr/);
  assert.match(await p.textContent('#nuage'), /2 séances/);
  assert.equal(await p.evaluate(() => localStorage.getItem('muscu-v1').includes('motdepasse')), false, 'le mot de passe n’est jamais gardé');
  assert.deepEqual(p.erreurs, []);
});

test('une séance terminée part toute seule ; la séance en cours n’est jamais envoyée', async () => {
  const p = await appareil(VIDE);
  await ouvrir(p);
  await p.fill('#nm', 'a@test.fr'); await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]'); await aJour(p);
  await p.click('[data-act=closepk]');
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '8');
  await p.click('[data-act=chk]');
  await p.waitForTimeout(3200);
  let srv = await serveur(p);
  assert.equal(Object.keys(srv.data[srv.user.uid].s).length, 0, 'séance en cours : rien envoyé');
  await p.click('[data-act=finish]');
  await attendre(p, () => { const s = JSON.parse(localStorage.getItem('__serveur')); return Object.keys(s.data[s.user.uid].s).length === 1; });
  srv = await serveur(p);
  const id = (await donnees(p)).sessions[0].id;
  assert.ok(srv.data[srv.user.uid].s[id]);
  assert.deepEqual(p.erreurs, []);
});

test('deuxième appareil : « J’ai déjà un compte » récupère tout ; « Tout réunir » garde aussi les séances du téléphone', async () => {
  const p1 = await appareil({ ...VIDE, sessions: [seance('a', 5), seance('b', 4)], routines: [{ id: 'r1', name: 'Jambes', exercises: ['Squat'] }] });
  await ouvrir(p1);
  await p1.fill('#nm', 'yo@test.fr'); await p1.fill('#np', 'motdepasse1');
  await p1.click('[data-act=nok]'); await aJour(p1);
  // nouveau téléphone, vide
  const p2 = await appareil(VIDE, await serveur(p1));
  await p2.evaluate(() => { const s = JSON.parse(localStorage.getItem('__serveur')); s.user = null; localStorage.setItem('__serveur', JSON.stringify(s)); });
  await ouvrir(p2);
  await p2.click('[data-act=nmode][data-v=connexion]');
  await p2.fill('#nm', 'yo@test.fr'); await p2.fill('#np', 'mauvais-mdp');
  await p2.click('[data-act=nok]');
  await attendre(p2, () => /incorrect/.test(document.querySelector('#nuage').textContent));
  await p2.fill('#np', 'motdepasse1');
  await p2.click('[data-act=nok]'); await aJour(p2);
  let d = await donnees(p2);
  assert.deepEqual(d.sessions.map(s => s.id).sort(), ['a', 'b']);
  assert.equal(d.routines[0].name, 'Jambes');
  // troisième téléphone avec ses propres séances : « Tout réunir »
  const p3 = await appareil({ ...VIDE, sessions: [seance('c', 2)] }, await serveur(p1));
  await p3.evaluate(() => { const s = JSON.parse(localStorage.getItem('__serveur')); s.user = null; localStorage.setItem('__serveur', JSON.stringify(s)); });
  await ouvrir(p3);
  await p3.click('[data-act=nmode][data-v=connexion]');
  await p3.fill('#nm', 'yo@test.fr'); await p3.fill('#np', 'motdepasse1');
  await p3.click('[data-act=nok]'); await aJour(p3);
  assert.ok((await p3.vus()).some(v => /Séances ici et en ligne/.test(v)));
  d = await donnees(p3);
  assert.deepEqual(d.sessions.map(s => s.id).sort(), ['a', 'b', 'c']);
  const srv = await serveur(p3);
  assert.deepEqual(Object.keys(srv.data[srv.user.uid].s).sort(), ['a', 'b', 'c']);
  assert.deepEqual([p1.erreurs, p2.erreurs, p3.erreurs], [[], [], []]);
});

test('« Garder seulement celles en ligne » : une version de secours d’abord, puis le téléphone prend le contenu en ligne', async () => {
  const p1 = await appareil({ ...VIDE, sessions: [seance('a', 5)] });
  await ouvrir(p1); await p1.fill('#nm', 'yo@test.fr'); await p1.fill('#np', 'motdepasse1');
  await p1.click('[data-act=nok]'); await aJour(p1);
  const srv = await serveur(p1); srv.user = null;
  const p2 = await appareil({ ...VIDE, sessions: [seance('z', 1)] }, srv);
  await ouvrir(p2); await p2.click('[data-act=nmode][data-v=connexion]');
  await p2.fill('#nm', 'yo@test.fr'); await p2.fill('#np', 'motdepasse1');
  p2.reponses.push(false); // « Garder seulement celles en ligne »
  await p2.click('[data-act=nok]'); await aJour(p2);
  assert.deepEqual((await donnees(p2)).sessions.map(s => s.id), ['a']);
  await p2.click('[data-act=closepk]'); await ouvrir(p2);
  await p2.waitForSelector('#vl .vr');
  assert.match(await p2.textContent('#vl'), /Avant la 1re connexion en ligne/);
});

test('modification et suppression voyagent d’un appareil à l’autre (la séance supprimée va dans la corbeille)', async () => {
  const p1 = await appareil({ ...VIDE, sessions: [seance('a', 5, { mod: 1 }), seance('b', 4, { mod: 1 })] });
  await ouvrir(p1); await p1.fill('#nm', 'yo@test.fr'); await p1.fill('#np', 'motdepasse1');
  await p1.click('[data-act=nok]'); await aJour(p1);
  const p2 = await appareil(VIDE, await serveur(p1));
  await p2.evaluate(() => localStorage.setItem('fluxe-suivi-nuage-v1', JSON.stringify({ uid: JSON.parse(localStorage.getItem('__serveur')).user.uid, email: 'yo@test.fr', envoye: {}, metaMod: 0, metaEnvoye: 0, metaHash: '', dernier: 0, dernierT: 0 })));
  await p2.reload(); await p2.waitForSelector('nav');
  await attendre(p2, () => JSON.parse(localStorage.getItem('muscu-v1')).sessions.length === 2);
  // sur p1 : on supprime b et on modifie a
  await p1.click('[data-act=closepk]');
  p1.reponses.push(true);
  await p1.click('[data-act=hmenu][data-id=b]'); // v3.17 : actions dans le menu « ··· »
  await p1.click('[data-act=delsess][data-id=b]');
  await p1.click('[data-act=hmenu][data-id=a]'); // v3.17 : actions dans le menu « ··· »
  await p1.click('[data-act=editsess][data-id=a]');
  await p1.fill('[data-f=kg][data-i="0"][data-j="0"]', '120');
  await p1.click('[data-act=finish]');
  await attendre(p1, () => { const s = JSON.parse(localStorage.getItem('__serveur')), d = s.data[s.user.uid].s; return d.b.del === true && /"120"/.test(d.a.j); });
  // p2 reçoit au retour sur l'app
  await serveur(p2, await serveur(p1));
  await p2.evaluate(() => window.dispatchEvent(new Event('online')));
  await attendre(p2, () => JSON.parse(localStorage.getItem('muscu-v1')).sessions.length === 1);
  const d2 = await donnees(p2);
  assert.deepEqual(d2.sessions.map(s => s.id), ['a']);
  assert.equal(d2.sessions[0].exercises[0].sets[0].kg, '120', 'modification reçue');
  assert.equal(d2.trash[0].s.id, 'b', 'récupérable dans la corbeille');
  assert.deepEqual([p1.erreurs, p2.erreurs], [[], []]);
});

test('sans réseau : rien n’est perdu, « en attente », puis envoi automatique au retour du réseau', async () => {
  const p = await appareil({ ...VIDE, sessions: [seance('a', 3), seance('b', 2)] });
  await ouvrir(p); await p.fill('#nm', 'yo@test.fr'); await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]'); await aJour(p);
  await p.click('[data-act=closepk]');
  // coupure du réseau (le téléphone le signale à l'app)
  await p.evaluate(() => { window.__horsLigne = true; Object.defineProperty(navigator, 'onLine', { get: () => !window.__horsLigne, configurable: true }); window.dispatchEvent(new Event('offline')); });
  p.reponses.push(true);
  await p.click('[data-act=hmenu][data-id=a]'); // v3.17 : actions dans le menu « ··· »
  await p.click('[data-act=delsess][data-id=a]');
  await p.waitForTimeout(3000);
  await ouvrir(p);
  await attendre(p, () => /Pas de réseau/.test(document.querySelector('#nuage').textContent));
  assert.match(await p.textContent('#nuage'), /1 changement en attente/);
  let srv = await serveur(p);
  assert.ok(!srv.data[srv.user.uid].s.a.del, 'rien envoyé hors ligne');
  // retour du réseau
  await p.evaluate(() => { window.__horsLigne = false; window.dispatchEvent(new Event('online')); });
  await aJour(p);
  srv = await serveur(p);
  assert.equal(srv.data[srv.user.uid].s.a.del, true);
  assert.deepEqual(p.erreurs, []);
});

test('déconnexion puis suppression du compte (mot de passe redemandé) : les séances du téléphone restent', async () => {
  const p = await appareil({ ...VIDE, sessions: [seance('a', 2)] });
  await ouvrir(p); await p.fill('#nm', 'yo@test.fr'); await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]'); await aJour(p);
  p.reponses.push(true, 'motdepasse1');
  await p.click('[data-act=nsuppr]');
  await attendre(p, () => !!document.querySelector('#nuage #nm'));
  const srv = await serveur(p);
  assert.deepEqual(srv.comptes, {}); assert.deepEqual(srv.data, {});
  assert.equal((await donnees(p)).sessions.length, 1);
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('fluxe-suivi-nuage-v1')).uid), null);
  assert.deepEqual(p.erreurs, []);
});

test('données en ligne abîmées : ignorées sans casser l’app', async () => {
  const p = await appareil(VIDE, { comptes: { 'yo@test.fr': { m: 'motdepasse1', uid: 'u0x' } }, user: null, t: 10,
    data: { u0x: { s: { bad: { j: '{pas du json', mod: 1, t: 1 }, x1: { j: JSON.stringify({ id: 'autre-id', date: 1, exercises: [] }), mod: 1, t: 2 }, ok: { j: JSON.stringify({ id: 'ok', date: 5, exercises: [{ name: '<b>Squat</b>', sets: [{ kg: 'abc', reps: '5', done: true }] }] }), mod: 5, t: 3 } }, m: { j: '[1,2]', mod: 9 } } } });
  await ouvrir(p); await p.click('[data-act=nmode][data-v=connexion]');
  await p.fill('#nm', 'yo@test.fr'); await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]'); await aJour(p);
  const d = await donnees(p);
  assert.deepEqual(d.sessions.map(s => s.id), ['ok']);
  assert.equal(d.sessions[0].exercises[0].sets[0].kg, '', 'valeur invalide vidée');
  assert.deepEqual(p.erreurs, []);
});

test('règles de sécurité : chacun ne lit et n’écrit que ses propres données', () => {
  const r = lire('firestore.rules');
  assert.match(r, /match \/users\/\{uid\}\/\{col\}\/\{id\}/);
  assert.match(r, /allow read, delete: if request\.auth != null && request\.auth\.uid == uid;/);
  assert.match(r, /allow read, write: if false;/);
});

test('Firebase est une copie locale (aucun site extérieur pour le code), chargée seulement par le pont lib/nuage-firebase.js', () => {
  const fs = require('node:fs'), path = require('node:path'), { RACINE } = require('./outils');
  const dossier = fs.readdirSync(path.join(RACINE, 'lib')).filter(f => /^firebase-[\d.]+$/.test(f));
  assert.equal(dossier.length, 1);
  for (const f of ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore-lite.js']) {
    const c = lire(`lib/${dossier[0]}/${f}`);
    assert.ok(!/from"https?:/.test(c), `${f} importe un fichier depuis Internet`);
  }
  assert.match(lire('js/nuage.js'), /import\('\.\.\/lib\/nuage-firebase\.js'\)/, 'chargement à la demande');
  assert.ok(!/firebase/.test(lire('index.html')), 'jamais chargé par la page au démarrage');
});

test('sécurité de la page : seules les adresses de Firebase sont ajoutées, et aucun code « en ligne » dans la page', () => {
  const csp = (lire('index.html').match(/Content-Security-Policy" content="([^"]+)"/) || [])[1];
  assert.match(csp, /connect-src 'self' https:\/\/identitytoolkit\.googleapis\.com https:\/\/securetoken\.googleapis\.com https:\/\/firestore\.googleapis\.com;/);
  assert.match(csp, /script-src 'self';/);
  assert.ok(!/on(submit|click)=/.test(lire('js/vues/nuage.js')));
});

test('e-mail de vérification : envoyé à la création, « Renvoyer », puis « C’est fait » quand le lien a été touché', async () => {
  const p = await appareil(VIDE);
  await ouvrir(p); await p.fill('#nm', 'yo@test.fr'); await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]'); await aJour(p);
  assert.equal((await serveur(p)).mails, 1, 'e-mail envoyé à la création');
  assert.match(await p.textContent('#nuage'), /Adresse pas encore vérifiée/);
  await p.click('[data-act=nrenv]');
  await attendre(p, () => JSON.parse(localStorage.getItem('__serveur')).mails === 2);
  await p.click('[data-act=nverif]');
  await attendre(p, () => /Pas encore vérifiée/.test(document.querySelector('#toast').textContent));
  // la personne touche le lien dans l'e-mail
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('__serveur')); s.comptes['yo@test.fr'].ok = true; localStorage.setItem('__serveur', JSON.stringify(s)); });
  await p.click('[data-act=nverif]');
  await attendre(p, () => !/pas encore vérifiée/i.test(document.querySelector('#nuage').textContent));
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('fluxe-suivi-nuage-v1')).verifie), true);
  assert.deepEqual(p.erreurs, []);
});

test('Confidentialité : adresse de contact pour supprimer son compte par e-mail', () => {
  const c = lire('confidentialite.html');
  assert.match(c, /mailto:fluxe\.suivi@outlook\.fr\?subject=Suppression/);
  assert.match(c, /depuis l’adresse de ton compte/);
  assert.match(lire('sw.js'), /'confidentialite\.html'/);
});

test('rappel « Pense à sauvegarder » : affiché sans compte, caché quand tout est envoyé en ligne', async () => {
  const p = await appareil({ ...VIDE, sessions: [1, 2, 3, 4, 5, 6].map(n => seance('s' + n, n)), lastBackup: 1 });
  assert.ok(await p.$('.card.bkc'), 'rappel visible sans compte');
  await ouvrir(p);
  assert.match(await p.textContent('#sheet'), /6 séances pas encore dans un fichier/);
  await p.fill('#nm', 'yo@test.fr'); await p.fill('#np', 'motdepasse1');
  await p.click('[data-act=nok]'); await aJour(p);
  assert.match(await p.textContent('#sheet'), /Tout est sauvegardé en ligne/);
  await p.click('[data-act=closepk]');
  await p.click('nav [data-tab=seance]');
  assert.equal(await p.$('.card.bkc'), null, 'plus de rappel une fois tout en ligne');
  assert.ok(await p.$('[data-act=start]'));
  assert.deepEqual(p.erreurs, []);
});

test('v3.3 : les choix de muscles des exercices perso voyagent, et une version en ligne sans eux ne les efface pas', async () => {
  const p1 = await appareil({ ...VIDE, sessions: [seance('a', 2)], mu: { 'Presse maison': 'Jambes' } });
  await ouvrir(p1);
  await p1.fill('#nm', 'mu@test.fr'); await p1.fill('#np', 'motdepasse1');
  await p1.click('[data-act=nok]'); await aJour(p1);
  let srv = await serveur(p1);
  assert.deepEqual(JSON.parse(srv.data[srv.user.uid].m.j).mu, { 'Presse maison': 'Jambes' });
  // un deuxième téléphone les récupère
  const p2 = await appareil(VIDE, srv);
  await p2.evaluate(() => { const s = JSON.parse(localStorage.getItem('__serveur')); s.user = null; localStorage.setItem('__serveur', JSON.stringify(s)); });
  await ouvrir(p2);
  await p2.click('[data-act=nmode][data-v=connexion]');
  await p2.fill('#nm', 'mu@test.fr'); await p2.fill('#np', 'motdepasse1');
  await p2.click('[data-act=nok]'); await aJour(p2);
  assert.deepEqual((await donnees(p2)).mu, { 'Presse maison': 'Jambes' });
  // un appareil resté sur une ancienne version envoie des réglages plus récents… sans « mu »
  srv = await serveur(p1);
  const m = JSON.parse(srv.data[srv.user.uid].m.j); delete m.mu; m.rests = { 'k:squat': 120 };
  srv.data[srv.user.uid].m = { j: JSON.stringify(m), mod: Date.now() + 60000, t: ++srv.t };
  await serveur(p1, srv);
  await p1.reload(); await p1.waitForSelector('nav');
  await ouvrir(p1); await aJour(p1);
  await p1.waitForFunction(() => (JSON.parse(localStorage.getItem('muscu-v1')).rests || {})['k:squat'] === 120, null, { timeout: 5000 });
  assert.deepEqual((await donnees(p1)).mu, { 'Presse maison': 'Jambes' }, 'les choix de muscles sont gardés');
  assert.deepEqual([p1.erreurs, p2.erreurs], [[], []]);
});

test('v3.6 : pesées, mensurations et récompenses voyagent, et une version en ligne sans elles ne les efface pas', async () => {
  const p1 = await appareil({ ...VIDE, sessions: [seance('a', 2)], corps: [{ t: 1763600000000, kg: 80 }], rv: ['seance1'], rvInit: true }); // appli déjà ouverte une fois
  await ouvrir(p1);
  await p1.fill('#nm', 'corps@test.fr'); await p1.fill('#np', 'motdepasse1');
  await p1.click('[data-act=nok]'); await aJour(p1);
  let srv = await serveur(p1);
  const m0 = JSON.parse(srv.data[srv.user.uid].m.j);
  assert.deepEqual(m0.corps, [{ t: 1763600000000, kg: 80 }]);
  assert.deepEqual(m0.rv, ['seance1']);
  const m = JSON.parse(srv.data[srv.user.uid].m.j); delete m.corps; delete m.rv; m.rests = { 'k:squat': 120 };
  srv.data[srv.user.uid].m = { j: JSON.stringify(m), mod: Date.now() + 60000, t: ++srv.t };
  await serveur(p1, srv);
  await p1.reload(); await p1.waitForSelector('nav');
  await ouvrir(p1); await aJour(p1);
  await p1.waitForFunction(() => (JSON.parse(localStorage.getItem('muscu-v1')).rests || {})['k:squat'] === 120, null, { timeout: 5000 });
  const d = await donnees(p1);
  assert.deepEqual(d.corps, [{ t: 1763600000000, kg: 80 }]);
  assert.deepEqual(d.rv, ['seance1']);
  assert.deepEqual(p1.erreurs, []);
});
