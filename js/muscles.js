/* Fluxe Suivi — Muscles travaillés par chaque exercice (v3.3.0).
   21 muscles, les mêmes que sur le mannequin « Ma progression ».
   Pour chaque exercice du catalogue : muscles principaux (comptent pour 1 série) et secondaires (½ série).
   Écriture de la table : 'principaux / secondaires', avec les codes ci-dessous.
   Un exercice perso prend les muscles du groupe choisi par l'utilisateur (S.mu = {nom: groupe}). */
import {MU} from './catalogue.js';

/* code → nom affiché, groupe (les groupes du catalogue), nom du muscle sur le dessin du mannequin */
export const MUSCLES = {
  pec: {nom: 'Pectoraux', groupe: 'Pectoraux', dessin: 'chest'},
  abd: {nom: 'Abdominaux', groupe: 'Abdos', dessin: 'abs'},
  obl: {nom: 'Obliques', groupe: 'Abdos', dessin: 'obliques'},
  dela: {nom: 'Épaules avant', groupe: 'Épaules', dessin: 'frontDelts'},
  dell: {nom: 'Épaules côté', groupe: 'Épaules', dessin: 'sideDelts'},
  delp: {nom: 'Épaules arrière', groupe: 'Épaules', dessin: 'rearDelts'},
  coif: {nom: 'Coiffe des rotateurs', groupe: 'Épaules', dessin: 'rotatorCuffs'},
  trap: {nom: 'Trapèzes', groupe: 'Dos', dessin: 'traps'},
  dors: {nom: 'Grands dorsaux', groupe: 'Dos', dessin: 'lats'},
  lomb: {nom: 'Lombaires', groupe: 'Dos', dessin: 'lowerBack'},
  cou: {nom: 'Cou', groupe: 'Dos', dessin: 'neck'},
  bic: {nom: 'Biceps', groupe: 'Bras', dessin: 'biceps'},
  tri: {nom: 'Triceps', groupe: 'Bras', dessin: 'triceps'},
  avb: {nom: 'Avant-bras', groupe: 'Bras', dessin: 'forearms'},
  fess: {nom: 'Fessiers', groupe: 'Fessiers', dessin: 'glutes'},
  abdu: {nom: 'Abducteurs', groupe: 'Fessiers', dessin: 'abductors'},
  quad: {nom: 'Quadriceps', groupe: 'Jambes', dessin: 'quads'},
  isch: {nom: 'Ischio-jambiers', groupe: 'Jambes', dessin: 'hamstrings'},
  addu: {nom: 'Adducteurs', groupe: 'Jambes', dessin: 'adductors'},
  mol: {nom: 'Mollets', groupe: 'Jambes', dessin: 'calves'},
  tib: {nom: 'Tibias', groupe: 'Jambes', dessin: 'shins'},
};

/* Groupes proposés pour un exercice perso, et les muscles qu'ils colorent */
export const GROUPES_PERSO = ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Fessiers', 'Abdos', 'Corps entier'];
const PAR_GROUPE = {
  Pectoraux: 'pec / dela tri',
  Dos: 'dors / trap lomb bic',
  Épaules: 'dela dell / delp tri',
  Bras: 'bic tri / avb',
  Jambes: 'quad isch / mol',
  Fessiers: 'fess / isch',
  Abdos: 'abd / obl',
  'Corps entier': 'quad fess / dors dela',
};

const TABLE = {
  /* Pectoraux */
  'Développé couché': 'pec / tri dela',
  'Développé incliné haltères': 'pec dela / tri',
  'Écarté poulie': 'pec / dela',
  Pompes: 'pec / tri dela abd',
  'Développé couché haltères': 'pec / tri dela',
  'Développé incliné barre': 'pec dela / tri',
  'Développé décliné': 'pec / tri',
  'Pec deck (papillon)': 'pec / dela',
  'Presse pectorale assise': 'pec / tri dela',
  'Développé couché Iso-Lateral': 'pec / tri dela',
  'Développé incliné Iso-Lateral': 'pec dela / tri',
  'Développé super incliné Iso-Lateral': 'pec dela / tri',
  'Développé décliné Iso-Lateral': 'pec / tri',
  'Pectoraux écartés Iso-Lateral (Wide Chest)': 'pec / dela',
  'Pullover machine': 'pec dors / tri',
  'Écarté poulie vis-à-vis': 'pec / dela',
  'Développé vertical (Super Vertical Chest Press)': 'pec / tri dela',
  'Développé incliné (Super Inclined Chest Press)': 'pec dela / tri',
  'Développé décliné (Super Declined Chest Press)': 'pec / tri',
  'Écarté bas (Super Lower Chest Flight)': 'pec / dela',
  'Développé horizontal multi (Super Horizontal Multi Press)': 'pec / tri dela',
  'Presse pectorale Insignia': 'pec / tri dela',
  'Papillon / oiseau Insignia': 'pec / delp dela',
  /* Dos */
  Tractions: 'dors / bic avb delp',
  'Rowing barre': 'dors trap / bic delp lomb',
  'Tirage vertical': 'dors / bic delp',
  'Tirage horizontal': 'dors trap / bic delp',
  'Soulevé de terre': 'lomb fess isch / dors trap quad avb',
  'Tractions assistées': 'dors / bic',
  'Tirage vertical machine (Lat Pulldown)': 'dors / bic',
  'Rowing assis machine': 'dors trap / bic delp',
  'Tirage vertical Iso-Lateral': 'dors / bic',
  'Tirage large Iso-Lateral (Wide Pulldown)': 'dors / bic delp',
  'Rowing haut Iso-Lateral (High Row)': 'dors trap / bic delp',
  'Rowing Iso-Lateral': 'dors trap / bic delp',
  'Rowing bas Iso-Lateral (Low Row)': 'dors / bic trap',
  'Rowing D.Y. Iso-Lateral': 'dors / bic trap',
  'Rowing T-Bar': 'dors trap / bic lomb',
  'Shrug assis/debout machine': 'trap / avb',
  'Pull-over poulie': 'dors / pec tri',
  'Rowing haltère unilatéral': 'dors / bic delp',
  'Shrugs haltères': 'trap / avb',
  'Hyperextension (banc lombaires)': 'lomb / fess isch',
  'Extension lombaires machine': 'lomb / fess',
  'Tirage vertical Select': 'dors / bic',
  'Tirage vertical convergent (Super Lat Machine)': 'dors / bic',
  'Rowing bas (Super Low Row)': 'dors / bic trap',
  'Rowing haut (Super High Row)': 'dors trap / bic delp',
  'Rowing puissance (Super Power Row)': 'dors trap / bic delp',
  'Rowing (Super Rowing)': 'dors trap / bic delp',
  'Pullover (Super Pullover)': 'dors / pec tri',
  'Tirage vertical Insignia': 'dors / bic',
  'Extension lombaires Insignia': 'lomb / fess',
  /* Épaules */
  'Développé militaire': 'dela dell / tri trap',
  'Élévations latérales': 'dell / trap',
  Oiseau: 'delp / trap coif',
  'Développé épaules haltères': 'dela dell / tri',
  'Développé épaules machine': 'dela dell / tri',
  'Oiseau machine (reverse pec deck)': 'delp / trap coif',
  'Développé épaules Iso-Lateral': 'dela dell / tri',
  'Élévations latérales machine': 'dell / trap',
  'Face pull': 'delp coif / trap',
  'Élévations frontales': 'dela / dell',
  'Push press': 'dela dell / tri quad',
  'Développé vertical multi (Super Vertical Multi Press)': 'dela dell / tri',
  'Élévations latérales Insignia': 'dell / trap',
  /* Bras */
  'Curl barre': 'bic / avb',
  'Curl marteau': 'bic avb',
  'Triceps poulie': 'tri',
  Dips: 'tri pec / dela',
  'Barre au front': 'tri',
  'Curl haltères': 'bic / avb',
  'Curl pupitre (Larry Scott)': 'bic / avb',
  'Curl concentré': 'bic',
  'Curl machine': 'bic',
  'Extension triceps machine': 'tri',
  'Curl biceps assis': 'bic',
  'Dips assis machine': 'tri / pec',
  'Curl poulie basse': 'bic / avb',
  'Kickback triceps poulie': 'tri',
  'Extension triceps nuque haltère': 'tri',
  'Curl poignets': 'avb',
  'Curl biceps Insignia': 'bic',
  'Dips / tractions assistés Insignia': 'tri dors / pec bic',
  /* Jambes */
  Squat: 'quad fess / isch lomb addu',
  'Presse à cuisses': 'quad fess / isch addu',
  Fentes: 'quad fess / isch addu',
  'Leg curl': 'isch / mol',
  'Leg extension': 'quad',
  'Mollets debout': 'mol',
  'Front squat': 'quad / fess abd',
  'Soulevé de terre roumain': 'isch fess / lomb',
  'Good morning': 'isch lomb / fess',
  'Fentes bulgares': 'quad fess / isch addu',
  'Step-up': 'quad fess / isch',
  'Leg curl allongé': 'isch / mol',
  'Leg curl assis': 'isch',
  'Adducteurs machine': 'addu',
  'Squat Smith machine': 'quad fess / isch',
  'Presse à cuisses linéaire': 'quad fess / isch',
  'Presse à cuisses Iso-Lateral': 'quad fess / isch',
  'V-Squat': 'quad fess / isch',
  'Hack squat': 'quad / fess',
  'Belt squat': 'quad fess / addu',
  'Pendulum squat': 'quad / fess',
  'Leg extension machine': 'quad',
  'Leg curl à genoux Iso-Lateral': 'isch',
  'Mollets assis': 'mol',
  'Mollets presse': 'mol',
  'Tibial machine': 'tib',
  'Nordic assisté': 'isch',
  'Leg extension Select': 'quad',
  'Leg extension Insignia': 'quad',
  'Leg curl Insignia': 'isch',
  'Mollets Insignia': 'mol',
  'Adducteurs Insignia': 'addu',
  /* Fessiers */
  'Hip thrust': 'fess / isch',
  'Glute drive': 'fess / isch',
  'Abducteurs machine': 'abdu fess',
  'Reverse hyper': 'fess / isch lomb',
  'Kickback fessier poulie': 'fess / isch',
  'Abducteurs Select': 'abdu fess',
  'Fessiers Insignia': 'fess / isch',
  'Abducteurs Insignia': 'abdu fess',
  /* Abdos */
  Crunch: 'abd',
  Gainage: 'abd / obl lomb',
  'Relevé de jambes': 'abd / obl',
  'Crunch machine': 'abd',
  'Crunch obliques': 'obl / abd',
  'Crunch poulie': 'abd',
  'Roue abdominale': 'abd / obl dors',
  'Russian twist': 'obl / abd',
  'Relevé de genoux chaise romaine': 'abd / obl',
  'Rotation du buste machine': 'obl',
  'Crunch abdominal Select': 'abd',
  'Crunch abdominal Insignia': 'abd',
  /* Corps entier */
  'Arraché (snatch)': 'quad fess trap dell / isch lomb dela tri',
  'Épaulé (power clean)': 'quad fess trap / isch lomb dors avb',
  'Épaulé-jeté': 'quad fess dela trap / tri isch lomb',
  Thruster: 'quad fess dela / tri abd',
  'Kettlebell swing': 'fess isch / lomb dela abd',
  'Farmer walk': 'avb trap / abd obl quad',
};

/* 'pec dela / tri' → {pec: 1, dela: 1, tri: 0.5} */
function lire(t) {
  const [p, s = ''] = t.split('/');
  const o = {};
  s.trim()
    .split(/\s+/)
    .filter(Boolean)
    .forEach(id => (o[id] = 0.5));
  p.trim()
    .split(/\s+/)
    .filter(Boolean)
    .forEach(id => (o[id] = 1));
  return o;
}

export const nomsTable = () => Object.keys(TABLE);

/* Les muscles d'un exercice : {code: 1 ou 0.5}. mu = choix des exercices perso (S.mu). */
export function musclesDe(nom, mu) {
  if (Object.prototype.hasOwnProperty.call(TABLE, nom)) return lire(TABLE[nom]);
  if (MU[nom]) return {}; /* cardio (ou exercice du catalogue sans muscles) */
  const g = mu && Object.prototype.hasOwnProperty.call(mu, nom) ? mu[nom] : '';
  return GROUPES_PERSO.includes(g) ? lire(PAR_GROUPE[g]) : {};
}

/* Le groupe affiché d'un exercice : catalogue, sinon choix perso, sinon « Perso » */
export function groupeDe(nom, mu) {
  if (MU[nom]) return MU[nom];
  const g = mu && Object.prototype.hasOwnProperty.call(mu, nom) ? mu[nom] : '';
  return GROUPES_PERSO.includes(g) ? g : 'Perso';
}
