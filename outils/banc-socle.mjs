//  ██ LE SOCLE DES BANCS DE FICHE — 732 · 746 · 747 · toast 837 ██
//  Il vivait dans l'atelier depuis la nº 837 ; rangé dans le dépôt à la
//  nº 838, avec les quatre bancs qui s'y appuient :
//    outils/banc-fenetre-732.mjs      la lecture gelée hors de la mosaïque (web)
//    outils/banc-preparation-746.mjs  l'ouverture en préparation, PileFiches (web)
//    outils/banc-galeries-747.mjs     les galeries survivent au re-rendu (doigt, puis web)
//    outils/banc-toast-837.mjs        le toast de confirmation des réactivations
//
//  CE QU'IL FAUT AUTOUR (l'atelier des passes 837-838) :
//    1. la doublure Supabase :  SLUGS_UNIQUES=1 node outils/doublure-supabase.mjs   (:3222)
//    2. un `.env.local` qui pointe vers elle (les noms sont dans
//       `.env.local.example`), puis  npm run build && npx next start   (:3000)
//    3. Playwright :  BANC_PLAYWRIGHT=/chemin/vers/playwright  (défaut :
//       « playwright-core », qui exige alors BANC_NAVIGATEUR=/chemin/vers/chromium)
//  Lancement :  node outils/banc-fenetre-732.mjs   — de même pour les trois autres.
//  BASE (le site) et DOUBLURE (la base) se surchargent par l'environnement.
//  Chaque banc termine par TOUT EST VERT (code 0) ou la liste des ratés (code 1).
let chromium;
try {
  const paquet = await import(process.env.BANC_PLAYWRIGHT ?? "playwright-core");
  chromium = paquet.chromium ?? paquet.default?.chromium;
  if (!chromium) throw new Error("chromium introuvable dans le paquet");
} catch {
  console.error(
    "\n\u2716  Ce banc a besoin de Playwright.\n" +
    "   npm i --no-save playwright-core   (puis BANC_NAVIGATEUR=/chemin/vers/chromium)\n" +
    "   ou BANC_PLAYWRIGHT=/chemin/vers/playwright node outils/banc-fenetre-732.mjs\n"
  );
  process.exit(1);
}
const NAVIGATEUR = process.env.BANC_NAVIGATEUR;
export { chromium };
export const BASE = process.env.BASE ?? "http://localhost:3000";
export const DOUBLURE = process.env.DOUBLURE ?? "http://127.0.0.1:3222";

const bilanCourant = { ok: 0, rates: [] };
export function verif(nom, condition, detail = "") {
  if (condition) { bilanCourant.ok += 1; console.log(`  ✓ ${nom}${detail ? ` (${detail})` : ""}`); }
  else { bilanCourant.rates.push({ nom, detail }); console.log(`  ✗ ${nom}${detail ? ` (${detail})` : ""}   ←←← RATÉ`); }
}
export const titre = (t) => console.log(`\n──── ${t} ────`);
export function bilan() {
  const { ok, rates } = bilanCourant;
  console.log(`\n${ok} vérification(s) passée(s), ${rates.length} ratée(s)`);
  if (rates.length) { console.log("\nRATÉES :"); for (const r of rates) console.log(`  · ${r.nom}${r.detail ? ` — ${r.detail}` : ""}`); }
  else console.log("\nTOUT EST VERT");
  return rates.length === 0 ? 0 : 1;
}

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** Un jeton que la doublure sait lire (elle décode la charge, ne vérifie rien). */
export function jetonForge(id, email, extra = {}) {
  const maintenant = Math.floor(Date.now() / 1000);
  const charge = { sub: id, email, aud: "authenticated", role: "authenticated", iat: maintenant, exp: maintenant + 86400, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, session_id: "banc-837", ...extra };
  return `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u(charge)}.banc`;
}
/** Le cookie @supabase/ssr d'une session connectée, pour la doublure (127.0.0.1 → « 127 »). */
export function cookieDeSession(id, email, extra = {}) {
  const projet = new URL(DOUBLURE).hostname.split(".")[0];
  const session = {
    access_token: jetonForge(id, email, extra), token_type: "bearer", expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "r",
    user: { id, aud: "authenticated", role: "authenticated", email, app_metadata: extra.app_metadata ?? { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: extra.created_at ?? "2026-01-01T00:00:00Z" },
  };
  return { name: `sb-${projet}-auth-token`, value: "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_"), domain: "localhost", path: "/" };
}

export async function ouvrir(mode = "web", { session = null } = {}) {
  const nav = await chromium.launch({ ...(NAVIGATEUR ? { executablePath: NAVIGATEUR } : {}), args: ["--no-proxy-server"] });
  const options = mode === "doigt"
    ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1440, height: 950 } };
  const ctx = await nav.newContext(options);
  if (session) await ctx.addCookies([cookieDeSession(session.id, session.email)]);
  const page = await ctx.newPage();
  return { nav, ctx, page };
}

/** Parler à la doublure comme PostgREST. */
export async function rest(table, { method = "GET", query = "", body, prefer } = {}) {
  const reponse = await fetch(`${DOUBLURE}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method,
    headers: { "content-type": "application/json", apikey: "banc", ...(prefer ? { prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texte = await reponse.text();
  try { return { statut: reponse.status, corps: JSON.parse(texte) }; } catch { return { statut: reponse.status, corps: texte }; }
}
export const lire = (table, query) => rest(table, { query }).then((r) => r.corps);
export const ranger = (table, lignes) => rest(table, { method: "POST", body: lignes, prefer: "return=representation" }).then((r) => r.corps);
export const effacer = (table, query) => rest(table, { method: "DELETE", query }).then((r) => r.corps);
export const modifier = (table, query, valeurs) => rest(table, { method: "PATCH", query, body: valeurs }).then((r) => r.corps);
