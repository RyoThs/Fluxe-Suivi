/* Hors ligne : la police vient de l'app elle-même (plus de Google Fonts), sans erreur de sécurité. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, lire, listeFichiersSW } = require('./outils');

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

/* ===== Pré-cache strict (v2.4.2) : l'installation hors ligne est « tout ou rien » ===== */
const vm = require('node:vm');
const FICHIERS = listeFichiersSW();

/* Lance sw.js dans un faux navigateur, puis déclenche son installation.
   « manquant » = un fichier que le serveur ne trouve pas. Renvoie ce qui s'est passé. */
async function installer(manquant) {
  const ecouteurs = {}, gardes = new Set();
  let attendu = null, skip = false;
  const telecharger = async f => { if (f === manquant) throw new TypeError('404 ' + f); gardes.add(f); };
  const cache = {
    add: telecharger,
    addAll: async liste => { for (const f of liste) if (f === manquant) throw new TypeError('404 ' + f); for (const f of liste) gardes.add(f); },
    put: async () => {}, match: async () => undefined,
  };
  const self = { addEventListener: (type, fn) => { ecouteurs[type] = fn; }, skipWaiting: () => { skip = true; }, clients: { claim: async () => {} } };
  const caches = { open: async () => cache, keys: async () => [], delete: async () => true };
  vm.runInNewContext(lire('sw.js'), { self, caches, location: { origin: 'http://127.0.0.1' }, URL, Request, Response, fetch: async () => { throw new Error('hors ligne'); } });
  ecouteurs.install({ waitUntil: p => { attendu = p; } });
  const reussi = await attendu.then(() => true, () => false);
  return { reussi, skip, gardes };
}

test('installation hors ligne : si un fichier manque, elle échoue (aucune erreur avalée)', async () => {
  const r = await installer('fonts/barlow-condensed-800.woff2');
  assert.equal(r.reussi, false, 'l’installation aurait dû échouer : une erreur a été avalée');
  assert.equal(r.skip, false, 'une version incomplète ne doit jamais remplacer l’ancienne');
});

test('installation hors ligne : quand tout est là, chaque fichier de la liste est gardé', async () => {
  const r = await installer(null);
  assert.equal(r.reussi, true);
  assert.equal(r.skip, true);
  assert.deepEqual([...r.gardes].sort(), [...FICHIERS].sort());
});

test('sw.js installe la liste d’un seul bloc (cache.addAll), sans « .catch » qui cache les erreurs', () => {
  const install = lire('sw.js').match(/addEventListener\('install',[\s\S]*?\n\}\);/)[0];
  assert.match(install, /\.addAll\(FICHIERS\)/);
  assert.doesNotMatch(install, /\.catch\(/);
});

test('dans un vrai navigateur, le service worker s’installe et garde tous les fichiers', async () => {
  const p = await A.page({ serviceWorkers: 'allow' });
  const res = await p.evaluate(async () => {
    const reg = await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    const nom = (await caches.keys()).find(n => n.startsWith('fluxe-suivi-'));
    const gardes = (await (await caches.open(nom)).keys()).map(r => r.url);
    await reg.unregister();
    return gardes;
  });
  assert.equal(res.length, FICHIERS.length, 'nombre de fichiers gardés hors ligne');
  for (const f of FICHIERS.filter(f => f.startsWith('fonts/'))) assert.ok(res.some(u => u.endsWith(f)), `${f} absent du cache`);
});

/* ===== Scénario complet (v2.4.2) : 1re visite avec réseau, puis mode avion ===== */
const { donnees, seance, VIDE, KEY } = require('./outils');

test('mode avion : après une 1re visite, l’app s’ouvre sans réseau, avec sa police et les données intactes', async () => {
  const p = await A.page({ serviceWorkers: 'allow' });
  // 1re visite avec réseau : on attend que le service worker soit prêt et pilote la page
  await p.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(ok => navigator.serviceWorker.addEventListener('controllerchange', ok, { once: true }));
  });
  // Une séance enregistrée sur le téléphone (sans recharger : rien ne passe par le réseau ici)
  const donneesAvant = { ...VIDE, sessions: [seance('avion', 1)] };
  await p.evaluate(([k, d]) => localStorage.setItem(k, JSON.stringify(d)), [KEY, donneesAvant]);

  // Mode avion, puis l'app est rouverte
  await p.context().setOffline(true);
  p.erreurs.length = 0;
  await p.reload();
  await p.waitForSelector('nav');

  // L'écran Séance s'affiche
  assert.equal(await p.$eval('nav button[data-tab=seance]', b => b.getAttribute('aria-current')), 'true');
  assert.match(await p.$eval('h1', e => e.textContent), /Entraînement/);
  // La police Barlow Condensed (graisse 800 des titres) vient bien de la copie hors ligne
  const police = await p.evaluate(async () => {
    await document.fonts.ready;
    await document.fonts.load('800 20px "Barlow Condensed"');
    const face = [...document.fonts].find(f => f.family.replace(/"/g, '') === 'Barlow Condensed' && f.weight === '800');
    return { check: document.fonts.check('800 20px "Barlow Condensed"'), statut: face && face.status };
  });
  assert.deepEqual(police, { check: true, statut: 'loaded' });
  // Les données sont intactes, et la séance apparaît dans l'historique
  assert.deepEqual((await donnees(p)).sessions.map(s => s.id), ['avion']);
  await p.click('nav button[data-tab=histo]');
  assert.match(await p.textContent('#app'), /Squat/);
  // Aucune erreur JavaScript, aucun fichier introuvable, aucun blocage de sécurité (CSP)
  assert.deepEqual(p.erreurs, []);
  await p.context().setOffline(false);
});
