/* Fluxe Suivi — Compteur anonyme (v3.15.0) : calculs seulement (aucun accès au réseau ni à l'écran).
   À la 1re séance terminée de la semaine, l'app ajoute « +1 » au total de la semaine (voir compteur-envoi.js).
   Rien ne permet de reconnaître quelqu'un : ni numéro, ni compte, ni séance ; seulement ios / android / autre. */

const deux = n => String(n).padStart(2, '0');

/** Semaine (du lundi au dimanche) d'un moment, écrite par la date de son lundi : « AAAA-MM-JJ ». */
export function semaineDe(t) {
  const d = new Date(t);
  d.setHours(12, 0, 0, 0); /* midi : pas de surprise au changement d'heure */
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

/** Type de téléphone : 'ios', 'android' ou 'autre' (l'iPad se présente comme un Mac, mais tactile). */
export function plateforme(ua = '', toucher = 0) {
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && toucher > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'autre';
}

/**
 * Semaine à compter, ou null.
 * @param {{id: string, date: number}[]} sessions
 * @param {string|null} deja semaine déjà comptée sur ce téléphone
 * @param {string|null} enCours id de la séance pas encore terminée
 * @param {number} [now]
 */
export function aCompter(sessions, deja, enCours, now = Date.now()) {
  const sem = semaineDe(now);
  if (deja === sem) return null;
  return sessions.some(s => s.id !== enCours && semaineDe(s.date) === sem) ? sem : null;
}

/** Les n dernières semaines (lundis « AAAA-MM-JJ »), de la plus ancienne à celle-ci. */
export function dernieresSemaines(n, now = Date.now()) {
  return Array.from({length: n}, (_, i) => semaineDe(now - (n - 1 - i) * 7 * 864e5));
}

/** Total d'une semaine venu du serveur, nettoyé : seulement ios / android / autre, entiers positifs (sinon 0). */
export function nettoyerTotal(w) {
  const o = w && typeof w === 'object' ? w : {};
  const n = v => (Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : 0);
  return {
    semaine: typeof o.semaine === 'string' ? o.semaine : '',
    ios: n(o.ios),
    android: n(o.android),
    autre: n(o.autre),
  };
}
