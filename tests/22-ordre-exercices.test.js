/* Ordre des exercices pendant la séance (v3.5.1) : les exercices en cours restent en haut (le nouvel ajout aussi),
   un exercice terminé (toutes ses séries cochées) descend en bas, le dernier fini en premier.
   Les données gardent l'ordre réel : l'Historique montre la séance dans l'ordre où elle a été faite. */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer, donner, donnees, VIDE } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

const fait = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: true });
const afaire = (kg, reps) => ({ kg: String(kg), reps: String(reps), done: false });
function seanceEnCours(exos) {
  return { ...VIDE, sessions: [{ id: 'cur', date: Date.now() - 20 * 60000, exercises: exos }], current: 'cur' };
}
const ordre = p => p.$$eval('#app section .ex-name', l => l.map(e => e.textContent.trim()));

test('les exercices en cours sont en haut, les terminés en bas (le dernier fini en premier), avec un repère « Terminés »', async () => {
  const p = await A.page();
  await donner(p, seanceEnCours([
    { name: 'Fentes', sets: [fait(20, 10)] },
    { name: 'Squat', sets: [fait(100, 8), fait(100, 8)] },
    { name: 'Presse à cuisses', sets: [fait(150, 10), afaire(150, 10)] },
  ]));
  await p.click('nav [data-tab=seance]');
  assert.deepEqual(await ordre(p), ['Presse à cuisses', 'Squat', 'Fentes']);
  assert.equal(await p.locator('#app .sep-fini').count(), 1);
  assert.deepEqual(p.erreurs, []);
});

test('le 1er exercice est fini : « Ajouter un exercice » place le nouveau au-dessus de lui', async () => {
  const p = await A.page();
  await donner(p, seanceEnCours([{ name: 'Squat', sets: [fait(100, 8), fait(100, 8)] }]));
  await p.click('nav [data-tab=seance]');
  await p.click('[data-act=pick]');
  await p.click('#pl [data-act=padd][data-n="Leg extension"]');
  assert.deepEqual(await ordre(p), ['Leg extension', 'Squat']);
});

test('les boutons visent toujours le bon exercice, et un exercice qui se termine descend', async () => {
  const p = await A.page();
  await donner(p, seanceEnCours([
    { name: 'Squat', sets: [fait(100, 8)] },
    { name: 'Leg extension', sets: [afaire(50, 12)] },
  ]));
  await p.click('nav [data-tab=seance]');
  assert.deepEqual(await ordre(p), ['Leg extension', 'Squat']);
  await p.click('#app section:nth-of-type(1) [data-act=chk]'); /* la carte du haut = Leg extension */
  const d = await donnees(p);
  assert.equal(d.sessions[0].exercises[1].sets[0].done, true, 'c’est bien Leg extension qui est cochée');
  assert.equal(d.sessions[0].exercises[0].name, 'Squat', 'les données gardent l’ordre réel');
  assert.deepEqual(await ordre(p), ['Leg extension', 'Squat'], 'les deux sont finis : le dernier fini en premier');
});

test('l’Historique garde l’ordre réel de la séance', async () => {
  const p = await A.page();
  await donner(p, seanceEnCours([
    { name: 'Squat', sets: [fait(100, 8)] },
    { name: 'Leg extension', sets: [fait(50, 12)] },
  ]));
  await p.click('nav [data-tab=seance]');
  p.reponses.push(true);
  await p.click('[data-act=finish]');
  await p.waitForTimeout(300);
  await p.click('nav [data-tab=histo]');
  const txt = await p.textContent('#app');
  assert.ok(txt.indexOf('Squat') < txt.indexOf('Leg extension'), 'Squat puis Leg extension');
});

test('en modifiant une séance passée, l’ordre ne bouge pas', async () => {
  const p = await A.page();
  const d = seanceEnCours([{ name: 'Squat', sets: [fait(100, 8)] }, { name: 'Leg extension', sets: [afaire(50, 12)] }]);
  d.sessions[0].edit = true; d.editBak = JSON.parse(JSON.stringify(d.sessions[0])); delete d.editBak.edit;
  await donner(p, d);
  await p.click('nav [data-tab=seance]');
  assert.deepEqual(await ordre(p), ['Squat', 'Leg extension']);
});
