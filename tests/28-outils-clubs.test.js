/* Outils de vérification des listes de clubs (outils/clubs/, pas chargés par l'app).
   Tous les 3 mois, une tâche automatique relit les sites officiels et compare avec js/clubs/*.js :
   ces tests vérifient les calculs (lecture d'une page, nettoyage, comparaison) sans réseau. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let X, S;
test.before(async () => {
  X = await import(pathToFileURL(path.join(__dirname, '..', 'outils', 'clubs', 'extraire.mjs')).href);
  S = await import(pathToFileURL(path.join(__dirname, '..', 'outils', 'clubs', 'sources.mjs')).href);
});

const PAGE = adresse => `<html><head><title>Salle de sport Basic-Fit Albi Route de la Drèche 24/7</title>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"ExerciseGym","name":"Salle de sport Albi","address":${JSON.stringify(adresse)}}]}</script></head></html>`;

test('lire une page club : nom, rue, code postal, ville et pays viennent des données publiques de la page', () => {
  const g = X.lireGym(PAGE({ streetAddress: '12 Route de la Dr&egrave;che', postalCode: '81000', addressLocality: 'Albi', addressCountry: 'FR' }), 'https://x.fr/albi');
  assert.equal(g.url, 'https://x.fr/albi');
  assert.equal(g.titre, 'Salle de sport Basic-Fit Albi Route de la Drèche 24/7');
  assert.equal(g.cp, '81000');
  assert.equal(g.ville, 'Albi');
  assert.equal(g.rue, '12 Route de la Drèche', 'les codes HTML sont décodés');
  assert.deepEqual(X.lireGym('<html>rien</html>', 'u'), { url: 'u' }, 'page sans données : rien d’inventé');
});

test('construire : marque retirée, DOM-TOM nommés, code postal sans son 0 réparé, étranger et doublons écartés', () => {
  const lus = [
    { url: 'a', nom: 'Fitness Park Martinique - Ducos', cp: '97224', ville: 'Ducos', pays: 'MQ', rue: '1 rue A' },
    { url: 'b', nom: 'Fitness Park Briançon', cp: '5100', ville: 'BRIANÇON', pays: 'FR', rue: '2 rue B' },
    { url: 'c', nom: 'Fitness Park Bruxelles', cp: '1060', ville: 'Bruxelles', pays: 'FR', rue: '3 rue C' },
    { url: 'd', nom: 'Fitness Park Aix-En-Provence', cp: '13100', ville: 'aix-en-provence', pays: 'FR', rue: '4 rue D' },
    { url: 'e', nom: 'Fitness Park Aix-En-Provence', cp: '13100', ville: 'Aix-en-Provence', pays: 'FR', rue: '4 rue D' },
    { url: 'f', nom: 'Fitness Park Madrid', cp: '28045', ville: 'Madrid', pays: 'ES', rue: '' },
  ];
  const { lignes, ecartes } = X.construire(lus, { marque: 'Fitness Park', prefixe: 'fp-' });
  assert.deepEqual(lignes, [
    ['aix-en-provence', 'Aix-en-Provence', 'Aix-en-Provence', '13100'],
    ['briancon', 'Briançon', 'Briançon', '05100'],
    ['martinique-ducos', 'Martinique - Ducos', 'Ducos (Martinique)', '97224'],
  ]);
  assert.deepEqual(ecartes.map(e => e.url).sort(), ['c', 'e', 'f']);
});

test('construire : deux clubs du même nom gardent des identifiants différents et la rue les distingue', () => {
  const { lignes } = X.construire([
    { url: 'https://x.fr/1', nom: 'Keepcool Lyon', cp: '69003', ville: 'Lyon', pays: 'FR', rue: '10 rue Garibaldi' },
    { url: 'https://x.fr/2', nom: 'Keepcool Lyon', cp: '69008', ville: 'Lyon', pays: 'FR', rue: '5 avenue Mermoz' },
  ], { marque: 'Keepcool', prefixe: 'kc-' });
  assert.equal(new Set(lignes.map(l => l[0])).size, 2);
  assert.ok(lignes.every(l => /^lyon-[0-9a-f]{4}$/.test(l[0])));
  assert.deepEqual(lignes.map(l => l[1]).sort(), ['Lyon - avenue Mermoz', 'Lyon - rue Garibaldi']);
});

test('comparer : clubs nouveaux, disparus et codes postaux changés, par identifiant', () => {
  const avant = [['a', 'A', 'Ville A', '11111'], ['b', 'B', 'Ville B', '22222'], ['c', 'C', 'Ville C', '33333']];
  const apres = [['a', 'A', 'Ville A', '11111'], ['c', 'C', 'Ville C', '33334'], ['d', 'D', 'Ville D', '44444']];
  const r = X.comparer(avant, apres);
  assert.deepEqual(r.nouveaux.map(l => l[0]), ['d']);
  assert.deepEqual(r.disparus.map(l => l[0]), ['b']);
  assert.deepEqual(r.changes.map(c => [c.avant[0], c.avant[3], c.apres[3]]), [['c', '33333', '33334']]);
  assert.equal(X.comparer(avant, avant).nouveaux.length + X.comparer(avant, avant).disparus.length, 0);
});

test('les 6 enseignes ont une source, avec le bon préfixe et la bonne marque que l’app', async () => {
  const K = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'clubs-connus.js')).href);
  assert.deepEqual(Object.keys(S.SOURCES).sort(), ['basic-fit', 'fitness-park', 'keepcool', 'neoness', 'on-air', 'orange-bleue']);
  for (const [e, s] of Object.entries(S.SOURCES)) {
    const l = K.clubsConnus(e);
    assert.ok(l.length > 0, e);
    assert.ok(l.every(c => c.id.startsWith(s.prefixe)), e + ' : préfixe ' + s.prefixe);
    assert.ok(l.every(c => c.n.startsWith(s.marque + ' ')), e + ' : marque ' + s.marque);
    assert.match(s.fichier, /^js\/clubs\/[a-z-]+\.js$/);
  }
});
