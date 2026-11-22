/* Sécurité (v3.7.1) : tout ce que l'utilisateur écrit (ou qui vient d'un fichier importé, de la sauvegarde en ligne,
   d'un message d'erreur) est affiché comme du texte, jamais exécuté comme du code.
   On glisse un piège partout, on ouvre tous les écrans et panneaux : le piège ne doit jamais se déclencher. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, VIDE, JOUR, lire } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

/* le piège : s'il est interprété comme du HTML, il crée une image qui lève un drapeau */
const P = '<img src=x onerror="window.__piege=1">"\'><b id=piege>x</b>';
const piege = s => s + P;
const st = (kg, reps, done = true) => ({ kg: String(kg), reps: String(reps), done });
const DONNEES = {
  ...VIDE,
  sessions: [
    { id: 'a', date: Date.now() - 3 * JOUR, dur: 40, g: 'g1', gn: piege('Salle'), exercises: [{ name: piege('Squat'), sets: [st(100, 8), st(105, 8)] }, { name: piege('Perso'), sets: [st(50, 10)] }] },
    { id: 'b', date: Date.now() - JOUR, dur: 40, exercises: [{ name: piege('Squat'), sets: [st(110, 8)] }] },
    { id: 'c', date: Date.now() - 600000, exercises: [{ name: piege('Squat'), sets: [st(110, 8, false)] }, { name: piege('Perso'), sets: [st(50, 10, false)] }] },
  ],
  current: 'c',
  routines: [{ id: 'r1', name: piege('Routine'), exercises: [piege('Squat'), 'Squat'] }],
  notes: { ['k:' + piege('squat').toLowerCase().slice(0, 50)]: piege('note') },
  gyms: [{ id: 'g1', name: piege('Ma salle'), eq: [piege('Machine')], notes: { 'k:machine': piege('réglage') } }],
  gym: 'g1',
  mu: { [piege('Perso')]: 'Jambes' },
  corps: [{ t: Date.now() - 2 * JOUR, kg: 80 }, { t: Date.now() - JOUR, kg: 79.5, taille: 82 }],
  rvInit: true,
  rv: [],
};

async function toutOuvrir(p) {
  const essayer = async sel => { const e = await p.$(sel); if (e) { await e.click().catch(() => {}); await p.waitForTimeout(80); } };
  for (const t of ['seance', 'histo', 'stats', 'aide']) {
    await p.click(`nav [data-tab=${t}]`);
    await p.waitForTimeout(80);
    if (t === 'seance') { await essayer('[data-act=pick]'); await p.fill('#pq', piege('Nouveau')).catch(() => {}); await essayer('[data-act=closepk]'); await essayer('[data-act=pmu]'); }
    if (t === 'histo') { await essayer('[data-act=data]'); await essayer('[data-act=closepk]'); }
    if (t === 'stats') { await essayer('#mp [data-m="quad"] path.m'); await essayer('#serie'); await essayer('[data-act=closepk]'); await essayer('[data-act=ctout]'); await essayer('[data-act=closepk]'); }
  }
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=cancel]').catch(() => {});
  await p.waitForTimeout(150);
  await essayer('[data-act=redit]');
}

test('aucun texte piégé ne s’exécute, sur aucun écran ni panneau', async () => {
  const p = await A.page();
  await p.evaluate(m => localStorage.setItem('fluxe-suivi-erreurs-v1', JSON.stringify({ liste: [{ t: Date.now(), titre: m, msg: m, ou: m, ver: '1', app: m, n: 1 }], envoi: false, envois: {} })), P);
  await donner(p, DONNEES);
  await toutOuvrir(p);
  assert.equal(await p.evaluate(() => window.__piege || 0), 0, 'le piège s’est déclenché');
  assert.equal(await p.locator('#piege').count(), 0, 'du HTML piégé a été inséré dans la page');
  assert.deepEqual(p.erreurs.filter(e => !/net::ERR|Failed to load resource/.test(e)), []);
});

test('le texte piégé reste visible comme du texte (il n’est pas simplement effacé)', async () => {
  const p = await A.page();
  await donner(p, DONNEES);
  await p.click('nav [data-tab=seance]');
  assert.match(await p.textContent('#app'), /<img src=x onerror/);
});

test('la page ne peut charger du code que depuis l’app elle-même (règle de sécurité CSP)', () => {
  const h = lire('index.html');
  const csp = (h.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1] || '';
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'(;|$)/, 'aucun script extérieur ni intégré');
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /form-action 'none'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test('le code n’utilise aucune fonction dangereuse (eval, new Function, document.write)', () => {
  const fs = require('node:fs'), path = require('node:path');
  const dir = path.join(__dirname, '..', 'js');
  const fichiers = [];
  (function lister(d) { for (const f of fs.readdirSync(d)) { const c = path.join(d, f); if (fs.statSync(c).isDirectory()) lister(c); else if (f.endsWith('.js')) fichiers.push(c); } })(dir);
  for (const f of fichiers) assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /\beval\(|new Function\(|document\.write\(/, f);
});

test('les règles de la base en ligne : chacun seulement ses données, tout le reste refusé', () => {
  const r = lire('firestore.rules');
  assert.match(r, /request\.auth\.uid == uid/);
  assert.match(r, /match \/\{autre=\*\*\} \{\s*allow read, write: if false;/);
  assert.doesNotMatch(r, /allow read, write: if true/);
});
