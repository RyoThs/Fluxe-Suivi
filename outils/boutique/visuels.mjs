/* Fabrique les visuels des boutiques à partir de la VRAIE appli et de données de démo fictives.
   Lancer depuis le dossier du projet : node outils/boutique/visuels.mjs
   Résultat : docs/PUBLICATION/03-IMAGES/ (App Store 1320 × 2868, Google Play 1080 × 1920, bannière 1024 × 500). */
/* global document, scrollTo, scrollY, localStorage -- utilisés seulement dans la page de l’appli (p.evaluate) */
import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {demo} from './demo.mjs';
import {VISUELS, BANNIERE} from './textes.mjs';

const ICI = dirname(fileURLToPath(import.meta.url)),
  RACINE = join(ICI, '..', '..'),
  SORTIE = join(RACINE, 'docs', 'PUBLICATION', '03-IMAGES'),
  BRUT = join(SORTIE, 'captures');
const require = createRequire(import.meta.url);
const {demarrer, donner} = require(join(RACINE, 'tests', 'outils.js'));
const {chromium} = require('playwright');
const fichier = f => pathToFileURL(join(RACINE, f)).href;

/* 1. Les 6 captures de l'appli (écran d'iPhone 390 × 844, net ×3) */
async function captures() {
  mkdirSync(BRUT, {recursive: true});
  const CAT = await import(fichier('js/catalogue.js'));
  const eq = CAT.catOf(CAT.CHAINS.find(c => c.id === 'fitness-park'));
  const A = await demarrer();
  const p = await A.page({viewport: {width: 390, height: 844}, deviceScaleFactor: 3});
  /* salle renommée « Ma salle » : aucun nom d'enseigne à l'écran */
  await donner(p, {
    ...demo(Date.now()),
    gyms: [{id: 'g1', name: 'Ma salle', chain: 'fitness-park', eq, notes: {}}],
    gym: 'g1',
  });
  const prendre = async n => {
    await p.waitForTimeout(600);
    await p.screenshot({path: join(BRUT, n + '.png')});
  };
  await p.click('nav [data-tab=seance]');
  await prendre('accueil');
  await p.click('nav [data-tab=histo]');
  await prendre('historique');
  await p.click('nav [data-tab=stats]');
  await prendre('stats');
  await p.evaluate(() => {
    const t = [...document.querySelectorAll('#app *')].find(
      e => !e.children.length && e.textContent.trim() === 'Mon corps'
    );
    scrollTo(0, (t.closest('.card') || t).getBoundingClientRect().top + scrollY - 16);
  });
  await prendre('corps');
  await p.click('nav [data-tab=aide]');
  await prendre('salle');
  /* séance en cours depuis 38 min, 2 séries cochées */
  await p.click('nav [data-tab=seance]');
  await p.click('text=Démarrer Haut du corps');
  const cases = p.locator('#app [data-act=chk]');
  await cases.nth(0).click();
  await cases.nth(1).click();
  await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('muscu-v1'));
    d.sessions.find(s => s.id === d.current).date = Date.now() - 38 * 60000;
    localStorage.setItem('muscu-v1', JSON.stringify(d));
  });
  await p.reload();
  await p.waitForTimeout(800);
  await prendre('seance');
  if (p.erreurs.length) throw new Error('erreurs dans l’appli : ' + p.erreurs.join(' | '));
  await A.fermer();
}

/* 2. La mise en page d'un visuel : étiquette, titre, texte, téléphone avec barre d'état */
const POLICE = `@font-face{font-family:B;font-weight:800;src:url(${fichier('fonts/barlow-condensed-800.woff2')})}`;
function visuel(v, W, H) {
  const k = W / 1320;
  return `<html><head><style>${POLICE}
*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;position:relative;background:${v.fond}}
.bulle{position:absolute;border-radius:50%;filter:blur(${60 * k}px);opacity:.55;width:${W * 0.8}px;height:${W * 0.8}px}
.txt{position:absolute;top:${H * 0.055}px;left:0;right:0;text-align:center;padding:0 ${80 * k}px}
.tag{display:inline-block;font-weight:800;letter-spacing:${4 * k}px;font-size:${34 * k}px;color:#4f46e5;background:rgba(79,70,229,.1);padding:${12 * k}px ${30 * k}px;border-radius:999px}
h1{font-family:B;font-weight:800;font-size:${150 * k}px;line-height:.95;margin-top:${36 * k}px;color:#0b1022}
h1 span{background:linear-gradient(135deg,#0d9488,#4f46e5 55%,#9333ea);-webkit-background-clip:text;color:transparent}
p{font-size:${46 * k}px;line-height:1.35;color:#5b6482;margin:${32 * k}px auto 0;max-width:${1060 * k}px}
.tel{position:absolute;left:50%;transform:translateX(-50%);bottom:${-H * 0.06}px;width:${W * 0.74}px;aspect-ratio:390/844;border-radius:${110 * k}px;background:#0b1022;padding:${26 * k}px;box-shadow:0 ${50 * k}px ${120 * k}px rgba(40,30,120,.28)}
.ecran{width:100%;height:100%;border-radius:${86 * k}px;overflow:hidden;background:#f3f5fb;display:flex;flex-direction:column}
.ecran img{width:100%;flex:1;min-height:0;object-fit:cover;object-position:top}
.sb{height:${130 * k}px;flex:none;display:flex;justify-content:space-between;align-items:center;padding:${18 * k}px ${80 * k}px 0;font-weight:700;font-size:${40 * k}px;color:#0b1022}
.sb i{display:flex;gap:${10 * k}px;align-items:center}
.sb b{width:${58 * k}px;height:${28 * k}px;border:${3 * k}px solid #0b1022;border-radius:${8 * k}px;position:relative}
.sb b:after{content:'';position:absolute;inset:${3 * k}px;right:${12 * k}px;background:#0b1022;border-radius:${3 * k}px}
.ile{position:absolute;top:${48 * k}px;left:50%;transform:translateX(-50%);width:${250 * k}px;height:${72 * k}px;background:#0b1022;border-radius:999px}
</style></head><body>
<div class="bulle" style="background:#5eead4;left:${-W * 0.3}px;top:${H * 0.25}px"></div>
<div class="bulle" style="background:#c084fc;right:${-W * 0.35}px;top:${H * 0.5}px"></div>
<div class="txt"><span class="tag">${v.tag}</span><h1>${v.titre[0]}<br><span>${v.titre[1]}</span></h1><p>${v.texte}</p></div>
<div class="tel"><div class="ecran"><div class="sb"><span>9:41</span><i><svg width="${36 * k}" height="${24 * k}" viewBox="0 0 18 12"><rect y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg><b></b></i></div>
<img src="${pathToFileURL(join(BRUT, v.capture + '.png')).href}"></div><div class="ile"></div></div></body></html>`;
}
function banniere() {
  const [phrase, petit] = BANNIERE.split('|');
  return `<html><head><style>${POLICE}
*{margin:0}body{width:1024px;height:500px;overflow:hidden;background:#f3f5fb;font-family:-apple-system,Roboto,sans-serif;position:relative}
.g{position:absolute;inset:0;background:radial-gradient(circle at 15% 30%,#5eead488,transparent 45%),radial-gradient(circle at 90% 90%,#c084fc77,transparent 45%)}
.t{position:absolute;left:64px;top:80px;width:560px}.t img{width:96px;height:96px;border-radius:24px;box-shadow:0 10px 30px rgba(40,30,120,.2)}
h1{font-family:B;font-weight:800;font-size:96px;line-height:.95;margin-top:22px;background:linear-gradient(135deg,#0d9488,#4f46e5 55%,#9333ea);-webkit-background-clip:text;color:transparent}
p{font-size:28px;color:#0b1022;margin-top:14px;font-weight:600}p span{color:#5b6482;font-weight:400;font-size:22px;display:block;margin-top:8px}
.tel{position:absolute;right:70px;top:46px;width:270px;aspect-ratio:390/844;border-radius:40px;background:#0b1022;padding:9px;transform:rotate(6deg);box-shadow:0 30px 60px rgba(40,30,120,.3)}
.tel img{width:100%;height:100%;border-radius:32px;object-fit:cover;object-position:top}</style></head><body><div class="g"></div>
<div class="t"><img src="${fichier('icons/icon-512.png')}"><h1>Fluxe Suivi</h1><p>${phrase}<span>${petit}</span></p></div>
<div class="tel"><img src="${pathToFileURL(join(BRUT, 'seance.png')).href}"></div></body></html>`;
}

/* 3. Rendu de chaque page HTML en image */
async function rendre() {
  const nav = await chromium.launch(process.env.PW_CHROMIUM ? {executablePath: process.env.PW_CHROMIUM} : {});
  const p = await nav.newPage();
  const tmp = join(BRUT, 'page.html');
  const photo = async (html, W, H, nom) => {
    await p.setViewportSize({width: W, height: H});
    writeFileSync(tmp, html);
    await p.goto(pathToFileURL(tmp).href);
    await p.waitForTimeout(300);
    await p.screenshot({path: nom});
  };
  for (const [dossier, W, H] of [
    ['app-store', 1320, 2868],
    ['google-play', 1080, 1920],
  ]) {
    mkdirSync(join(SORTIE, dossier), {recursive: true});
    for (const [i, v] of VISUELS.entries())
      await photo(visuel(v, W, H), W, H, join(SORTIE, dossier, `${i + 1}-${v.capture}.png`));
  }
  await photo(banniere(), 1024, 500, join(SORTIE, 'google-play', 'banniere-1024x500.png'));
  await nav.close();
  (await import('node:fs')).rmSync(tmp);
}

await captures();
await rendre();
console.log('Visuels prêts dans docs/PUBLICATION/03-IMAGES/');
