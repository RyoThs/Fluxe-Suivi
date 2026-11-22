/* Écran Séance, nouveau style (v3.5.0) : bandeau Durée / Volume / Séries avec barre de progression,
   série en cours marquée, ligne « Record » sous la série, étiquettes Repos et « Par côté » (disques),
   chrono de repos avec anneau, +30 s et la série suivante. Tous les boutons d'avant restent. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, VIDE, JOUR } = require('./outils');
const attente = { timeout: 3000 };

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

const st = (kg, reps, extra = {}) => ({ kg: String(kg), reps: String(reps), done: false, ...extra });
/* une séance en cours : Squat (1 échauffement + 3 séries), Leg extension (2 séries), Tapis (cardio) */
function enCours(extra = {}) {
  return {
    ...VIDE,
    sessions: [
      { id: 'old', date: Date.now() - 7 * JOUR, dur: 50, exercises: [{ name: 'Squat', sets: [{ kg: '120', reps: '8', done: true }] }] },
      { id: 'cur', date: Date.now() - 12 * 60000, exercises: [
        { name: 'Squat', sets: [st(60, 10, { w: true, done: true }), st(125, 5, { done: true }), st(125, 6), st(125, 6)] },
        { name: 'Leg extension', sets: [st(50, 12), st(50, 12)] },
        { name: 'Tapis de course', cardio: true, sets: [{ min: '10', km: '', kcal: '', done: false }] },
      ] },
    ],
    current: 'cur',
    ...extra,
  };
}
async function ouvrir(d = enCours()) {
  const p = await A.page();
  await donner(p, d);
  await p.click('nav [data-tab=seance]');
  return p;
}

/* Cycle 0 — caractérisation : tous les boutons et champs d'aujourd'hui doivent rester */
test('caractérisation : tous les boutons et champs de l’écran Séance sont toujours là', async () => {
  const p = await ouvrir();
  const acts = new Set(await p.$$eval('#app [data-act]', l => l.map(e => e.dataset.act)));
  for (const a of ['rest', 'pick', 'tool', 'finish', 'cancel', 'delex', 'wu', 'chk', 'addset', 'rex', 'sug'])
    assert.ok(acts.has(a), 'bouton ' + a);
  for (const f of ['kg', 'reps', 'min', 'km', 'kcal']) assert.ok(await p.$(`#app [data-f=${f}]`), 'champ ' + f);
  assert.ok(await p.$('#app [data-note="0"]'), 'note de réglage');
  assert.ok(await p.$('#el'), 'minutes écoulées');
  for (const s of ['#tt', '[data-act=tcfg]', '[data-act=t0]']) assert.ok(await p.$(s), 'chrono ' + s);
  assert.deepEqual(p.erreurs, []);
});

/* ===== Cycle 1 : les nouveautés ===== */
test('bandeau : Durée, Volume, Séries « faites / prévues » (hors échauffement) et barre de progression', async () => {
  const p = await ouvrir();
  const txt = await p.textContent('#app .live');
  assert.match(txt, /Durée[\s\S]*Volume[\s\S]*Séries/);
  assert.match(txt, /1\s*\/\s*5/, '1 série de travail faite sur 5 (le cardio et l’échauffement ne comptent pas)');
  assert.equal(await p.$eval('#app .live .prog i', e => e.style.width), '20%');
});

test('la prochaine série à faire de chaque exercice est marquée (une seule par exercice)', async () => {
  const p = await ouvrir();
  const cur = await p.$$eval('#app .gr.cur [data-act=chk]', l => l.map(e => e.dataset.i + '-' + e.dataset.j));
  assert.deepEqual(cur, ['0-2', '1-0']);
});

test('une série record affiche une ligne « Record » juste en dessous (et le badge PR reste)', async () => {
  const p = await ouvrir();
  await p.click('[data-act=chk][data-i="0"][data-j="2"]'); /* 125 × 6 > record 120 × 8 en charge */
  const rec = await p.$eval('#app [data-act=chk][data-i="0"][data-j="2"]', b => {
    const n = b.closest('.gr').nextElementSibling;
    return n && n.classList.contains('recl') ? n.textContent : '';
  });
  assert.match(rec, /Record/);
  assert.match(rec, /125 kg × 6/);
  assert.ok(await p.$('.pr'), 'le badge PR');
});

test('« Par côté » : les disques de la prochaine série sur une barre de 20 kg (exercices à la barre seulement)', async () => {
  const p = await ouvrir();
  assert.match(await p.textContent('#app section:nth-of-type(1) .meta'), /Par côté\s*25 \+ 25 \+ 2,5/);
  assert.doesNotMatch(await p.textContent('#app section:nth-of-type(2)'), /Par côté/, 'leg extension : machine, pas de barre');
  const C = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'outils.js')).href).catch(() => null);
  assert.ok(C && C.parCote, 'fonction parCote');
  assert.deepEqual(C.parCote(125), [25, 25, 2.5]);
  assert.deepEqual(C.parCote(20), []);
  assert.equal(C.parCote(15), null, 'moins que la barre');
  assert.deepEqual(C.parCote(100), [25, 15], 'même méthode que le calculateur de disques : du plus lourd au plus léger');
});

test('l’étiquette Repos est dans la carte et ouvre toujours le réglage du repos de l’exercice', async () => {
  const p = await ouvrir();
  assert.match(await p.textContent('#app section:nth-of-type(1) .meta [data-act=rex]'), /Repos\s*1 min 30/);
});

test('chrono : anneau, bouton +30 s, et la série suivante annoncée', async () => {
  const p = await ouvrir();
  await p.click('[data-act=chk][data-i="0"][data-j="2"]');
  await p.waitForSelector('#timer.on');
  assert.ok(await p.$('#timer svg circle#tr'), 'anneau');
  assert.match(await p.textContent('#tn'), /Ensuite : Squat · série 3/);
  const avant = await p.textContent('#tt');
  await p.click('[data-act=t30]');
  const s = t => +t.split(':')[0] * 60 + +t.split(':')[1];
  assert.ok(s(await p.textContent('#tt')) - s(avant) >= 29, avant + ' → ' + (await p.textContent('#tt')));
  assert.deepEqual(p.erreurs, []);
});

test('une seule ligne « Record » par exercice, sous la meilleure série (les badges PR restent sur chaque série)', async () => {
  const p = await ouvrir();
  await p.click('[data-act=chk][data-i="0"][data-j="2"]'); /* 125 × 5 et 125 × 6 battent tous les deux 120 × 8 */
  assert.equal(await p.locator('#app section:nth-of-type(1) .recl').count(), 1);
  assert.match(await p.textContent('#app .recl'), /125 kg × 6/);
  assert.equal(await p.locator('#app section:nth-of-type(1) .pr').count(), 2);
});
