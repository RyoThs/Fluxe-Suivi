/* Fluxe Suivi — Outil (pas chargé par l'app) : relit les listes officielles des clubs et les compare à celles de l'app.
   Utilisation (depuis le dossier du dépôt) :
     node outils/clubs/verifier.mjs                      → les 6 enseignes, rapport affiché
     node outils/clubs/verifier.mjs neoness keepcool     → seulement ces enseignes
     node outils/clubs/verifier.mjs --rapport chemin.md  → rapport écrit dans un fichier
   Lecture polie : une page à la fois, une pause entre chaque (comme une personne qui navigue).
   Ne modifie JAMAIS les listes de l'app : il dit seulement ce qui a changé. */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {comparer, construire, lireGym, lireOnAir} from './extraire.mjs';
import {SOURCES, corriger} from './sources.mjs';

const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAUSE_MS = 800;
const dormir = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/* curl suit le proxy de l'environnement cloud ; une page qui ne répond pas donne un texte vide */
function lirePage(url) {
  try {
    return execFileSync('curl', ['-sL', '-A', 'Mozilla/5.0', '--max-time', '30', url], {
      maxBuffer: 64 << 20,
      encoding: 'utf8',
    });
  } catch {
    return '';
  }
}

/* adresses des pages club d'une source (plans du site + pages de liens), sans doublon */
function adresses(s) {
  const u = new Set();
  for (const sm of s.sitemaps || [])
    for (const m of lirePage(sm.url).matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const a = m[1].trim().replace(/^https:\/\/(?!www\.)([a-z-]+\.fr)\//, 'https://www.$1/');
      if (a.includes(sm.filtre)) u.add(a);
    }
  for (const p of s.pages || []) for (const m of lirePage(p.url).matchAll(p.liens)) u.add(p.base + m[0]);
  return [...u].sort();
}

function relire(e, s) {
  if (s.onair) return {lignes: corriger(lireOnAir(lirePage(s.onair)), s), ecartes: [], pages: 1};
  const urls = adresses(s);
  const ajouts = new Map((s.ajouts || []).map(a => [a.url, a]));
  const lus = [];
  urls.forEach((u, i) => {
    lus.push(ajouts.get(u) || lireGym(lirePage(u), u));
    if ((i + 1) % 50 === 0) process.stderr.write(`  ${e} : ${i + 1}/${urls.length} pages\n`);
    dormir(PAUSE_MS);
  });
  for (const [u, a] of ajouts) if (!urls.includes(u)) lus.push(a);
  const r = construire(lus, s);
  return {lignes: corriger(r.lignes, s), ecartes: r.ecartes, pages: urls.length};
}

const ligne = (s, l) => `| ${s.marque} ${l[1]} | ${l[2]} | ${l[3]} |`;
async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--rapport');
  const sortie = i >= 0 ? args.splice(i, 2)[1] : null;
  const choisies = args.length ? args : Object.keys(SOURCES);
  const md = [
    `# Vérification des listes de clubs (${new Date().toISOString().slice(0, 10)})`,
    '',
    'Listes officielles relues sur les sites des enseignes et comparées à celles de l’app (`js/clubs/`).',
    '',
  ];
  let rien = true;
  for (const e of choisies) {
    const s = SOURCES[e];
    if (!s) throw new Error('enseigne inconnue : ' + e);
    process.stderr.write(`${s.marque}…\n`);
    const app = (await import(pathToFileURL(path.join(RACINE, s.fichier)).href)).default;
    const {lignes, ecartes, pages} = relire(e, s);
    md.push(`## ${s.marque}`, '');
    /* site illisible (changement de site, panne) : on ne conclut rien plutôt que d'annoncer tous les clubs disparus */
    if (lignes.length < app.length * 0.5) {
      md.push(
        `⚠️ Seulement ${lignes.length} clubs relus (${pages} pages) contre ${app.length} dans l’app : le site a sans doute changé. À vérifier à la main, rien n’est conclu.`,
        ''
      );
      rien = false;
      continue;
    }
    const r = comparer(app, lignes);
    md.push(
      `${app.length} clubs dans l’app, ${lignes.length} sur le site (${pages} pages lues, ${ecartes.length} écartées).`,
      ''
    );
    if (!r.nouveaux.length && !r.disparus.length && !r.changes.length) md.push('✅ Aucun changement.', '');
    else rien = false;
    if (r.nouveaux.length)
      md.push(
        `### ${r.nouveaux.length} nouveau(x)`,
        '',
        '| Club | Ville | Code postal |',
        '|---|---|---|',
        ...r.nouveaux.map(l => ligne(s, l)),
        ''
      );
    if (r.disparus.length)
      md.push(
        `### ${r.disparus.length} disparu(s) du site`,
        '',
        '| Club | Ville | Code postal |',
        '|---|---|---|',
        ...r.disparus.map(l => ligne(s, l)),
        ''
      );
    if (r.changes.length)
      md.push(
        `### ${r.changes.length} code(s) postal(aux) changé(s)`,
        '',
        ...r.changes.map(c => `- ${s.marque} ${c.avant[1]} : ${c.avant[3]} → ${c.apres[3]}`),
        ''
      );
  }
  md.push(
    '---',
    rien
      ? 'Rien à mettre à jour.'
      : 'Mise à jour possible : à proposer à Yoann (une version de l’app, avec son accord).'
  );
  const texte = md.join('\n') + '\n';
  if (sortie) fs.writeFileSync(sortie, texte);
  else process.stdout.write(texte);
}
main().catch(e => {
  process.stderr.write('Erreur : ' + e.message + '\n');
  process.exit(1);
});
