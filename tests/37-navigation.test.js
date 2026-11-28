/* v3.21.1 : barre de navigation harmonieuse (demande de Yoann) :
   les 4 onglets sont construits pareil — logo au-dessus du nom, même largeur, même taille de texte —
   sur tous les téléphones, y compris l'iPhone SE (320 px), et le texte reste lisible (12,5 px minimum). */
const test = require('node:test');
const assert = require('node:assert/strict');
const { demarrer } = require('./outils');

let A;
test.before(async () => { A = await demarrer(); });
test.after(async () => { await A.fermer(); });

async function mesurer(largeur) {
  const p = await A.page({ viewport: { width: largeur, height: 700 } });
  await p.waitForSelector('nav');
  const m = await p.$$eval('nav button', bs => bs.map(b => {
    const r = b.getBoundingClientRect(), s = b.querySelector('svg'), rs = s && s.getBoundingClientRect(), cs = getComputedStyle(b);
    return { l: r.width, nom: b.innerText.trim(), logo: !!s && getComputedStyle(s).display !== 'none' && rs.width > 0,
      logoL: rs ? Math.round(rs.width) : 0, dessus: rs ? (() => { const g = document.createRange(); g.selectNodeContents(b.lastChild); return rs.bottom <= g.getBoundingClientRect().top + 1; })() : false,
      police: parseFloat(cs.fontSize), coupe: b.scrollWidth > b.clientWidth + 1 };
  }));
  return { p, m };
}

for (const largeur of [320, 390, 430]) {
  test(`${largeur} px : 4 onglets pareils, logo au-dessus du nom, texte lisible et entier`, async () => {
    const { p, m } = await mesurer(largeur);
    assert.deepEqual(m.map(x => x.nom), ['Séance', 'Historique', 'Stats', 'Ma salle']);
    for (const x of m) {
      assert.ok(x.logo, `logo visible pour « ${x.nom} »`);
      assert.ok(x.dessus, `logo au-dessus du nom pour « ${x.nom} »`);
      assert.ok(x.police >= 12.5, `texte lisible pour « ${x.nom} » (${x.police} px)`);
      assert.ok(!x.coupe, `« ${x.nom} » n’est pas coupé`);
    }
    assert.equal(new Set(m.map(x => Math.round(x.l))).size, 1, 'même largeur : ' + m.map(x => x.l).join(', '));
    assert.equal(new Set(m.map(x => x.police)).size, 1, 'même taille de texte');
    assert.equal(new Set(m.map(x => x.logoL)).size, 1, 'logos de même taille');
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'pas de débordement');
    assert.deepEqual(p.erreurs, []);
  });
}
