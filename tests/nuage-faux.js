/* Faux serveur « Sauvegarde en ligne » pour les tests : il imite le pont Firebase (lib/nuage-firebase.js),
   sans réseau. Ses données sont gardées dans le localStorage de la page (clé __serveur),
   et un test peut les copier d'un « appareil » à l'autre avec serveur(p) / serveur(p, valeur). */
function installer() {
  const lire = () => { try { return JSON.parse(localStorage.getItem('__serveur')) || null; } catch (e) { return null; } };
  const S0 = () => lire() || { comptes: {}, data: {}, t: 1000, user: null };
  const ecr = s => localStorage.setItem('__serveur', JSON.stringify(s));
  const err = code => { const e = new Error(code); e.code = code; return e; };
  const pause = () => new Promise(r => setTimeout(r, 30));
  const hors = () => { if (window.__horsLigne) throw err('unavailable'); };
  window.__appels = [];
  window.__fxNuageFaux = {
    async pret() { const s = S0(); return s.user; },
    async inscrire(e, m) { await pause(); hors(); const s = S0(); if (s.comptes[e]) throw err('auth/email-already-in-use'); const uid = 'u' + Object.keys(s.comptes).length + 'x'; s.comptes[e] = { m, uid, ok: false }; s.mails = (s.mails || 0) + 1; s.user = { uid, email: e, verifie: false }; ecr(s); return s.user; },
    async renvoyer() { const s = S0(); s.mails = (s.mails || 0) + 1; ecr(s); },
    async recharger() { const s = S0(); if (!s.user) return null; const c = s.comptes[s.user.email]; s.user.verifie = !!(c && c.ok); ecr(s); return s.user; },
    async connecter(e, m) { await pause(); hors(); const s = S0(); const c = s.comptes[e]; if (!c || c.m !== m) throw err('auth/invalid-credential'); s.user = { uid: c.uid, email: e, verifie: !!c.ok }; ecr(s); return s.user; },
    async deconnecter() { const s = S0(); s.user = null; ecr(s); },
    async oublie(e) { window.__appels.push('oublie:' + e); },
    async lire(uid, depuis) {
      await pause(); hors(); window.__appels.push('lire:' + depuis);
      const s = S0(), d = s.data[uid] || { s: {}, m: null };
      return { sessions: Object.entries(d.s).filter(([, x]) => x.t > (depuis || 0)).map(([id, x]) => ({ id, mod: x.mod, del: !!x.del, j: x.j || '', t: x.t })), meta: d.m ? { mod: d.m.mod, j: d.m.j } : null };
    },
    async ecrire(uid, { sessions, suppr, meta }) {
      await pause(); hors(); window.__appels.push('ecrire:' + sessions.length + '/' + suppr.length + '/' + (meta ? 1 : 0));
      const s = S0(), d = s.data[uid] = s.data[uid] || { s: {}, m: null };
      sessions.forEach(x => { d.s[x.id] = { j: x.j, mod: x.mod, t: ++s.t }; });
      suppr.forEach(x => { d.s[x.id] = { del: true, mod: x.mod, t: ++s.t }; });
      if (meta) d.m = { j: meta.j, mod: meta.mod, t: ++s.t };
      ecr(s);
    },
    async supprimerCompte(m) { await pause(); const s = S0(); const u = s.user; const c = u && s.comptes[u.email]; if (!c || c.m !== m) throw err('auth/invalid-credential'); delete s.comptes[u.email]; delete s.data[u.uid]; s.user = null; ecr(s); },
  };
}
/* lire ou remplacer le contenu du faux serveur d'une page */
async function serveur(p, v) {
  if (v === undefined) return p.evaluate(() => JSON.parse(localStorage.getItem('__serveur')));
  await p.evaluate(x => localStorage.setItem('__serveur', JSON.stringify(x)), v);
}
module.exports = { installer, serveur };
