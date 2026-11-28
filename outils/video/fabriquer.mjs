/* Fabrique la vidéo de présentation (32 s, 1080 × 1920, 30 images/s) à partir de la VRAIE appli.
   Lancer depuis le dossier du projet : node outils/video/fabriquer.mjs
   Il faut ffmpeg et python3 (avec numpy). Résultat : docs/PUBLICATION/04-VIDEO/fluxe-suivi-presentation.mp4
   Étapes : 1. filmer l'appli (données de démo)  2. dessiner les 960 images  3. musique  4. assemblage. */
/* global document, scrollTo, localStorage, window -- utilisés seulement dans les pages (p.evaluate) */
import {createRequire} from 'node:module';
import {mkdirSync, rmSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {demo} from '../boutique/demo.mjs';

const ICI = dirname(fileURLToPath(import.meta.url)),
  RACINE = join(ICI, '..', '..'),
  CAP = join(ICI, 'cap'),
  IMAGES = join(ICI, 'images'),
  SORTIE = join(RACINE, 'docs', 'PUBLICATION', '04-VIDEO');
const require = createRequire(import.meta.url);
const {demarrer, donner} = require(join(RACINE, 'tests', 'outils.js'));
const {chromium} = require('playwright');
const FPS = 30,
  DUREE = 32;

/* 1. Filmer l'appli : écrans, pages entières (pour défiler) et la séance qu'on coche */
async function filmer() {
  mkdirSync(CAP, {recursive: true});
  const CAT = await import(pathToFileURL(join(RACINE, 'js', 'catalogue.js')).href);
  const eq = CAT.catOf(CAT.CHAINS.find(c => c.id === 'fitness-park'));
  const A = await demarrer();
  const p = await A.page({viewport: {width: 390, height: 844}, deviceScaleFactor: 2.77});
  await donner(p, {
    ...demo(Date.now()),
    gyms: [{id: 'g1', name: 'Ma salle', chain: 'fitness-park', eq, notes: {}}],
    gym: 'g1',
  });
  const photo = async (n, full = false) => {
    await p.waitForTimeout(500);
    await p.screenshot({path: join(CAP, n + '.png'), fullPage: full});
  };
  const sansBarre = await p.addStyleTag({content: 'nav{display:none!important}'});
  for (const [onglet, n] of [
    ['stats', 'stats-full'],
    ['histo', 'histo-full'],
    ['aide', 'salle-full'],
  ]) {
    await p.evaluate(o => document.querySelector('nav [data-tab=' + o + ']').click(), onglet);
    await p.evaluate(() => scrollTo(0, 0));
    await photo(n, true);
  }
  await sansBarre.evaluate(e => e.remove());
  await p.click('nav [data-tab=seance]');
  await p.click('text=Démarrer Haut du corps');
  await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('muscu-v1'));
    d.sessions.find(s => s.id === d.current).date = Date.now() - 37 * 60000;
    localStorage.setItem('muscu-v1', JSON.stringify(d));
  });
  await p.reload();
  await p.waitForTimeout(800);
  await photo('s0');
  const cases = p.locator('#app [data-act=chk]');
  await cases.nth(0).click();
  await photo('s1');
  await cases.nth(1).click();
  await p.waitForTimeout(200);
  for (let i = 0; i < 4; i++) {
    await p.screenshot({path: join(CAP, `s2-${i}.png`)}); /* le chrono de repos qui défile */
    await p.waitForTimeout(1000);
  }
  if (p.erreurs.length) throw new Error('erreurs dans l’appli : ' + p.erreurs.join(' | '));
  await A.fermer();
}

/* 2. Dessiner les images : 4 navigateurs en parallèle, chacun un quart de la vidéo */
async function dessiner() {
  rmSync(IMAGES, {recursive: true, force: true});
  mkdirSync(IMAGES, {recursive: true});
  const nav = await chromium.launch(process.env.PW_CHROMIUM ? {executablePath: process.env.PW_CHROMIUM} : {});
  const total = FPS * DUREE,
    part = Math.ceil(total / 4);
  await Promise.all(
    [0, 1, 2, 3].map(async k => {
      const p = await nav.newPage({viewport: {width: 1080, height: 1920}});
      await p.goto(pathToFileURL(join(ICI, 'montage.html')).href);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(800);
      for (let f = k * part; f < Math.min(total, (k + 1) * part); f++) {
        await p.evaluate(t => window.render(t), f / FPS);
        await p.screenshot({path: join(IMAGES, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92});
      }
    })
  );
  await nav.close();
}

/* 3 et 4. Musique originale, puis assemblage (son réglé à -14 LUFS, le niveau des réseaux sociaux) */
function assembler() {
  mkdirSync(SORTIE, {recursive: true});
  const wav = join(ICI, 'images', 'musique.wav');
  execFileSync('python3', [join(ICI, 'musique.py'), wav], {stdio: 'inherit'});
  execFileSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-framerate',
      String(FPS),
      '-i',
      join(IMAGES, '%04d.jpg'),
      '-i',
      wav,
      '-af',
      'loudnorm=I=-14:TP=-1.5:LRA=11',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-profile:v',
      'high',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-shortest',
      join(SORTIE, 'fluxe-suivi-presentation.mp4'),
    ],
    {stdio: 'inherit'}
  );
  rmSync(IMAGES, {recursive: true, force: true});
}

await filmer();
await dessiner();
assembler();
console.log('Vidéo prête : docs/PUBLICATION/04-VIDEO/fluxe-suivi-presentation.mp4');
