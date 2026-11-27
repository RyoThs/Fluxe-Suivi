/* v3.21 : question à un toucher après une séance (axe communautaire, sans surcharger).
   - une seule ligne en haut de l'Historique : « Le … est-il bien dans ta salle ? » Oui / Non / ✕ ;
   - seulement si la salle a rejoint son club ET qu'il y a un compte vérifié ; une seule question par séance ;
   - machine utilisée pendant la séance, dans ma salle, pas encore vérifiée par le club, et que je n'ai pas déjà confirmée ;
   - Oui = « elle est là », Non = « absente » (envoyé au club, ma liste corrigée tout de suite) ; « Merci » 2 s puis plus rien ;
   - ✕ 3 fois de suite : plus de question pendant 30 jours. */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { demarrer, donner, donnees, VIDE, JOUR } = require('./outils');
const { installer, serveur } = require('./nuage-faux');

const url = f => pathToFileURL(path.join(__dirname, '..', 'js', f)).href;
let Q, CAT, A;
test.before(async () => {
  Q = await import(url('question.js'));
  CAT = await import(url('catalogue.js'));
  A = await demarrer();
});
test.after(async () => { await A.fermer(); });
const st = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });

test('choisirMachine : utilisée, dans ma salle, pas vérifiée par le club, pas déjà confirmée par moi', () => {
  const s = { exercises: [{ name: 'Squat', sets: [st(100, 5)] }, { name: 'Pec deck (papillon)', sets: [st(40, 12)] }, { name: 'Leg curl', sets: [st(40, 12)] }, { name: 'Rien fait', sets: [{ kg: '', reps: '', done: false }] }] };
  const eq = ['Squat', 'Pec deck (papillon)', 'Leg curl', 'Rien fait'];
  const avis = [
    { m: 'Squat', k: 'present', u: 'a', t: 1 }, { m: 'Squat', k: 'present', u: 'b', t: 2 }, // vérifiée par le club
    { m: 'Pec deck (papillon)', k: 'present', u: 'moi', t: 3 }, // déjà confirmée par moi
  ];
  assert.equal(Q.choisirMachine(s, eq, avis, 'moi'), 'Leg curl');
  assert.equal(Q.choisirMachine(s, ['Squat'], avis, 'moi'), null, 'hors de ma salle : pas de question');
  assert.equal(Q.choisirMachine({ exercises: [] }, eq, [], 'moi'), null);
});

test('✕ trois fois de suite : pause de 30 jours ; répondre remet le compteur à zéro', () => {
  let e = {};
  const t = 1e12;
  e = Q.apresFermeture(e, t); e = Q.apresFermeture(e, t);
  assert.equal(Q.enPause(e, t), false);
  e = Q.apresFermeture(e, t);
  assert.equal(Q.enPause(e, t), true);
  assert.equal(Q.enPause(e, t + 31 * JOUR), false);
  assert.deepEqual(Q.apresReponse({ fermes: 2 }), { fermes: 0 });
});

/* ===== Dans l'appli ===== */
let BF;
const COMPTE = { uid: 'u1', email: 'yo@test.fr', verifie: true, envoye: {}, metaMod: 0, metaEnvoye: 0, metaHash: '', dernier: 0, dernierT: 0 };
async function finirSeance({ club = 'c1', compte = true, avis = {} } = {}) {
  BF = BF || CAT.catOf(CAT.CHAINS.find(c => c.id === 'basic-fit'));
  const m = BF.find(n => /Pec deck/.test(n)) || BF[3];
  const p = await A.page();
  await p.context().addInitScript(installer);
  await p.evaluate(([avis, compte, C]) => {
    const s = { comptes: {}, data: {}, t: 1000, user: null, clubs: { c1: { n: 'Basic-Fit Lyon Part-Dieu', e: 'basic-fit', v: 'Lyon' } }, avis: { c1: avis } };
    if (compte) { s.comptes['yo@test.fr'] = { m: 'motdepasse', uid: 'u1', ok: true }; s.user = { uid: 'u1', email: 'yo@test.fr', verifie: true }; localStorage.setItem('fluxe-suivi-nuage-v1', JSON.stringify(C)); }
    localStorage.setItem('__serveur', JSON.stringify(s));
  }, [avis, compte, COMPTE]);
  const gym = { id: 'g1', name: 'Basic-Fit Lyon Part-Dieu', chain: 'basic-fit', eq: BF, notes: {}, ...(club ? { club, clubNom: 'Basic-Fit Lyon Part-Dieu' } : {}) };
  await donner(p, { ...VIDE, gyms: [gym], gym: 'g1', current: 'x', sessions: [{ id: 'x', date: Date.now() - 3600e3, exercises: [{ name: m, sets: [st(40, 12)] }] }] });
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=finish]');
  await p.waitForTimeout(400);
  return { p, m };
}

test('après la séance : la question apparaît en haut de l’Historique ; « Oui » confirme pour le club, puis « Merci » et plus rien', async () => {
  const { p, m } = await finirSeance();
  const q = p.locator('.qq');
  assert.equal(await q.count(), 1);
  assert.match(await q.textContent(), new RegExp(m.replace(/[()]/g, '.') + '.*est-il bien dans ta salle'));
  assert.ok((await q.boundingBox()).height < 90, 'une seule petite ligne');
  await q.locator('[data-act=qoui]').click();
  assert.match(await p.textContent('.qq'), /Merci/);
  await p.waitForTimeout(600);
  const s = await serveur(p);
  assert.ok(Object.values(s.avis.c1).some(a => a.m === m && a.k === 'present' && a.u === 'u1'), 'avis « elle est là » envoyé');
  await p.waitForTimeout(2200);
  assert.equal(await p.locator('.qq').count(), 0, 'disparaît après 2 secondes');
  assert.deepEqual(p.erreurs, []);
});

test('« Non » : la machine est signalée absente et retirée de ma salle', async () => {
  const { p, m } = await finirSeance();
  await p.click('.qq [data-act=qnon]');
  await p.waitForTimeout(600);
  assert.ok(!(await donnees(p)).gyms[0].eq.includes(m), 'retirée de ma liste');
  assert.ok(Object.values((await serveur(p)).avis.c1).some(a => a.m === m && a.k === 'absent'));
  assert.deepEqual(p.erreurs, []);
});

test('pas de question sans club rejoint, ni sans compte ; ✕ ferme sans rien envoyer', async () => {
  let r = await finirSeance({ club: null });
  assert.equal(await r.p.locator('.qq').count(), 0, 'salle pas reliée à un club');
  r = await finirSeance({ compte: false });
  assert.equal(await r.p.locator('.qq').count(), 0, 'pas de compte');
  r = await finirSeance();
  await r.p.click('.qq [data-act=qx]');
  assert.equal(await r.p.locator('.qq').count(), 0);
  await r.p.waitForTimeout(300);
  assert.equal(JSON.stringify((await serveur(r.p)).avis.c1), '{}', 'rien envoyé');
  assert.deepEqual(r.p.erreurs, []);
});
