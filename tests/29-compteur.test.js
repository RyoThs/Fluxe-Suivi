/* Compteur anonyme (v3.15.0) : combien de personnes s'entraînent chaque semaine.
   - À la 1re séance de la semaine, l'app ajoute « +1 » au total de la semaine (avec seulement iPhone / Android / autre).
   - Aucun numéro, aucun compte, rien sur la personne ni ses séances. L'utilisateur ne voit rien.
   - Sans réseau : réessayé plus tard (au démarrage, au retour du réseau). Une panne ne gêne jamais l'app.
   - L'écran « Compteur » n'apparaît que pour le compte du créateur (admins/{uid} dans la base). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, seance, VIDE, lire, JOUR } = require('./outils');
const { installer, serveur } = require('./nuage-faux');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let K, A;
test.before(async () => { K = await import(url('compteur.js')); A = await demarrer(); });
test.after(async () => { await A.fermer(); });

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';

test('semaine : le lundi de la semaine (lundi → dimanche), écrit AAAA-MM-JJ', () => {
  assert.equal(K.semaineDe(new Date(2026, 10, 25, 18).getTime()), '2026-11-23', 'mercredi → lundi 23');
  assert.equal(K.semaineDe(new Date(2026, 10, 23, 0, 5).getTime()), '2026-11-23', 'lundi tôt');
  assert.equal(K.semaineDe(new Date(2026, 10, 29, 23, 59).getTime()), '2026-11-23', 'dimanche soir');
  assert.equal(K.semaineDe(new Date(2026, 10, 30, 8).getTime()), '2026-11-30', 'lundi suivant');
  assert.equal(K.semaineDe(new Date(2027, 0, 2).getTime()), '2026-12-28', 'semaine à cheval sur deux années');
});

test('type de téléphone : seulement ios, android ou autre', () => {
  assert.equal(K.plateforme(IPHONE, 5), 'ios');
  assert.equal(K.plateforme('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.1 Safari/605.1.15', 5), 'ios', 'iPad (se présente comme un Mac tactile)');
  assert.equal(K.plateforme(ANDROID, 5), 'android');
  assert.equal(K.plateforme('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 0), 'autre', 'vrai Mac');
  assert.equal(K.plateforme('', 0), 'autre');
});

test('à compter : une séance terminée cette semaine, et pas encore comptée cette semaine', () => {
  const now = new Date(2026, 10, 25, 18).getTime();
  const s = (id, t) => ({ id, date: t, exercises: [] });
  assert.equal(K.aCompter([], null, null, now), null, 'aucune séance');
  assert.equal(K.aCompter([s('a', now - 3 * JOUR)], null, null, now), null, 'séance de la semaine dernière (dimanche 22)');
  assert.equal(K.aCompter([s('a', now - JOUR)], null, null, now), '2026-11-23');
  assert.equal(K.aCompter([s('a', now - JOUR)], '2026-11-23', null, now), null, 'déjà comptée cette semaine');
  assert.equal(K.aCompter([s('a', now - JOUR)], '2026-11-16', null, now), '2026-11-23', 'comptée la semaine dernière seulement');
  assert.equal(K.aCompter([s('a', now - 60000)], null, 'a', now), null, 'la séance en cours ne compte pas encore');
});

/* ouvre l'app sur un téléphone simulé avec le faux serveur ; admin : le compte u1 est celui du créateur */
const COMPTE = { uid: 'u1', email: 'yo@test.fr', verifie: true, envoye: {}, metaMod: 0, metaEnvoye: 0, metaHash: '', dernier: 0, dernierT: 0 };
async function ouvrir({ ua = IPHONE, donnees = VIDE, srv = {}, compte = false } = {}) {
  const p = await A.page({ userAgent: ua });
  await p.context().addInitScript(installer);
  await p.evaluate(([srv, compte, C]) => {
    const s = { comptes: {}, data: {}, t: 1000, user: null, ...srv };
    if (compte) { s.comptes['yo@test.fr'] = { m: 'motdepasse', uid: 'u1', ok: true }; s.user = { uid: 'u1', email: 'yo@test.fr', verifie: true }; localStorage.setItem('fluxe-suivi-nuage-v1', JSON.stringify(C)); }
    localStorage.setItem('__serveur', JSON.stringify(s));
  }, [srv, compte, COMPTE]);
  await donner(p, donnees);
  return p;
}
async function faireSeance(p) {
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=start]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Squat"]');
  await p.fill('[data-f=kg][data-i="0"][data-j="0"]', '60');
  await p.fill('[data-f=reps][data-i="0"][data-j="0"]', '10');
  await p.click('[data-act=chk]');
  await p.click('[data-act=finish]');
  await p.waitForTimeout(300);
}
const totaux = async p => ((await serveur(p)) || {}).compteur || {};
const cetteSemaine = () => K.semaineDe(Date.now());

test('1re séance de la semaine : « +1 » pour iPhone, sans compte ; 2e séance : rien de plus', async () => {
  const p = await ouvrir();
  assert.deepEqual(await totaux(p), {}, 'rien avant la séance');
  await faireSeance(p);
  assert.deepEqual(await totaux(p), { [cetteSemaine()]: { ios: 1 } });
  await faireSeance(p);
  await p.reload(); await p.waitForSelector('nav'); await p.waitForTimeout(300);
  assert.deepEqual(await totaux(p), { [cetteSemaine()]: { ios: 1 } }, 'une seule fois par semaine, même après un redémarrage');
  assert.deepEqual(p.erreurs, []);
});

test('Android est compté à part ; rien d’autre n’est envoyé (pas de numéro, pas de séance)', async () => {
  const p = await ouvrir({ ua: ANDROID });
  await faireSeance(p);
  const c = await totaux(p);
  assert.deepEqual(c, { [cetteSemaine()]: { android: 1 } });
  assert.deepEqual(Object.keys(c[cetteSemaine()]), ['android']);
});

test('l’utilisateur ne voit rien : aucun message, aucun bouton « Compteur » sans le compte du créateur', async () => {
  const p = await ouvrir({ compte: true });
  await faireSeance(p);
  const vus = JSON.stringify(await p.vus());
  assert.doesNotMatch(vus, /compt(eur|é)|anonyme/i);
  for (const t of ['seance', 'histo', 'stats', 'aide']) {
    await p.click(`nav [data-tab=${t}]`);
    await p.waitForTimeout(150);
    assert.doesNotMatch(await p.textContent('#app'), /Compteur/, t);
  }
  assert.equal(await p.$('[data-act=compteur]'), null);
});

test('sans réseau à la salle : rien n’est perdu, le « +1 » part au retour du réseau', async () => {
  const p = await ouvrir();
  await p.context().setOffline(true);
  await faireSeance(p);
  assert.deepEqual(await totaux(p), {}, 'hors ligne : rien envoyé');
  await p.context().setOffline(false);
  await p.waitForTimeout(400);
  assert.deepEqual(await totaux(p), { [cetteSemaine()]: { ios: 1 } });
  /* hors ligne, le navigateur de test (sans copie hors ligne de l'app) note les fichiers qu'il n'a pas pu charger : ce n'est pas une erreur de l'app */
  assert.deepEqual(p.erreurs.filter(e => !/ERR_INTERNET_DISCONNECTED/.test(e)), []);
});

test('panne du serveur : aucune erreur pour l’utilisateur, l’app continue, et on réessaie au démarrage suivant', async () => {
  const p = await ouvrir();
  await p.evaluate(() => { window.__panneCompteur = true; });
  await faireSeance(p);
  assert.deepEqual(await totaux(p), {});
  assert.match(await p.textContent('#toast'), /Séance enregistrée/);
  assert.doesNotMatch(JSON.stringify(await p.vus()), /erreur|problème/i);
  assert.deepEqual(p.erreurs, []);
  await p.reload(); await p.waitForSelector('nav'); await p.waitForTimeout(400);
  assert.deepEqual(await totaux(p), { [cetteSemaine()]: { ios: 1 } }, 'réessayé au redémarrage');
});

test('une séance de la semaine dernière ne compte pas pour cette semaine', async () => {
  const lundi = new Date(); lundi.setHours(0, 0, 0, 0); lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
  const p = await ouvrir({ donnees: { ...VIDE, sessions: [{ ...seance('a'), date: lundi.getTime() - JOUR }] } });
  await p.waitForTimeout(300);
  assert.deepEqual(await totaux(p), {});
});

test('les 8 dernières semaines, de la plus ancienne à celle-ci', () => {
  const l = K.dernieresSemaines(8, new Date(2026, 10, 25, 18).getTime());
  assert.equal(l.length, 8);
  assert.equal(l[7], '2026-11-23');
  assert.equal(l[6], '2026-11-16');
  assert.equal(l[0], '2026-10-05');
});

test('compte du créateur : bouton « Compteur » dans le Guide, avec la semaine, iPhone / Android, 8 semaines et l’objectif 300', async () => {
  const sem = K.dernieresSemaines(8);
  const p = await ouvrir({ compte: true, srv: { admins: { u1: true }, compteur: { [sem[7]]: { ios: 94, android: 34 }, [sem[6]]: { ios: 80, android: 20, autre: 1 } } } });
  await p.click('nav [data-tab=aide]');
  await p.waitForSelector('[data-act=compteur]');
  await p.click('[data-act=compteur]');
  await p.waitForSelector('#cpt .big');
  const t = await p.textContent('#cpt');
  assert.match(t, /Cette semaine/);
  assert.equal((await p.textContent('#cpt .big')).trim(), '128');
  assert.match(t, /iPhone 94/);
  assert.match(t, /Android 34/);
  assert.equal(await p.$$eval('#cpt .bars i', l => l.length), 8);
  assert.match(t, /128 \/ 300/);
  assert.match(t, /43 %/);
  assert.deepEqual(p.erreurs, []);
});

test('compte normal (pas le créateur) : le Guide ne montre rien de plus', async () => {
  const p = await ouvrir({ compte: true, srv: { admins: { autre: true }, compteur: { x: { ios: 3 } } } });
  await p.click('nav [data-tab=aide]');
  await p.waitForTimeout(400);
  assert.equal(await p.$('[data-act=compteur]'), null);
  assert.doesNotMatch(await p.textContent('#app'), /Compteur/);
});

test('compte du créateur sans réseau : message clair dans le panneau, l’app continue', async () => {
  const p = await ouvrir({ compte: true, srv: { admins: { u1: true } } });
  await p.click('nav [data-tab=aide]');
  await p.waitForSelector('[data-act=compteur]');
  await p.evaluate(() => { window.__horsLigne = true; });
  await p.click('[data-act=compteur]');
  await p.waitForTimeout(300);
  assert.match(await p.textContent('#cpt'), /Impossible de lire le compteur/);
  await p.click('[data-act=closepk]');
  await p.click('nav [data-tab=seance]');
  assert.ok(await p.$('[data-act=start]'));
});

test('règles de la base : sans compte, seulement « +1 » à une semaine ; lecture réservée au créateur ; rien d’autre', () => {
  const r = lire('firestore.rules');
  const bloc = (r.match(/match \/compteur\/\{semaine\} \{[\s\S]*?\n {4}\}/) || [''])[0];
  assert.ok(bloc, 'bloc compteur présent');
  assert.match(bloc, /semaine\.matches\('\^20\[0-9\]\{2\}-\[01\]\[0-9\]-\[0-3\]\[0-9\]\$'\)/, 'nom de semaine AAAA-MM-JJ');
  assert.match(bloc, /allow create: if [^;]*plusUn\(request\.resource\.data, \{\}\)/);
  assert.match(bloc, /allow update: if [^;]*plusUn\(request\.resource\.data, resource\.data\)/);
  assert.match(bloc, /allow read: if request\.auth != null && exists\(\/databases\/\$\(database\)\/documents\/admins\/\$\(request\.auth\.uid\)\)/);
  assert.match(bloc, /allow delete: if false;/);
  assert.match(r, /function plusUn\(n, a\)/);
  assert.match(r, /hasOnly\(\['ios', 'android', 'autre'\]\)/);
  const adm = (r.match(/match \/admins\/\{uid\} \{[\s\S]*?\n {4}\}/) || [''])[0];
  assert.match(adm, /allow get: if request\.auth != null && request\.auth\.uid == uid;/);
  assert.match(adm, /allow list, write: if false;/);
});

test('page Confidentialité : le compteur anonyme est expliqué, et elle ne dit plus que « rien n’est envoyé » sans compte', () => {
  const c = lire('confidentialite.html');
  assert.match(c, /Compteur anonyme/);
  assert.match(c, /« \+1 »/);
  assert.doesNotMatch(c, /Rien n’est envoyé sur Internet\./);
});

test('chiffres abîmés dans la base (négatifs, texte, champ inconnu) : comptés comme 0, jamais affichés', () => {
  assert.deepEqual(K.nettoyerTotal({ semaine: '2026-11-23', ios: 'abc', android: -5, autre: 2.7, pirate: 9 }), { semaine: '2026-11-23', ios: 0, android: 0, autre: 2 });
  assert.deepEqual(K.nettoyerTotal(null), { semaine: '', ios: 0, android: 0, autre: 0 });
  assert.deepEqual(K.nettoyerTotal({ semaine: 'x', ios: 94, android: 34 }), { semaine: 'x', ios: 94, android: 34, autre: 0 });
});
