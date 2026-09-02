//  ██ nº 703 — LA RÉSILIENCE (nº 686/693) N'EST PAS ENTAMÉE ██
//  ⚠️ LA BASE EST RENDUE MUETTE POUR LE NAVIGATEUR SEUL, et il y a une
//  raison mesurée : couper la doublure ENTIÈREMENT (`MUETTE=1`) fige la
//  requête AVANT le navigateur, dans le proxy — il appelle
//  `supabase.auth.getClaims()` à chaque page d'un visiteur connecté et
//  attend sans plafond. C'est un fait ANTÉRIEUR à cette passe (le
//  proxy n'est pas touché ici, et il est hors sujet). Pour éprouver ce
//  que L3 pouvait casser — la lecture CLIENT —, on ne rend muet que ce
//  qui part du navigateur.
//  Un compte est ouvert : la bibliothèque part donc, et sa lecture
//  `getUser()` ne reçoit JAMAIS de réponse. CE QUI DOIT TENIR :
//   · la page s'affiche (elle ne lit rien) ;
//   · l'en-tête porte le compte — il vient du COOKIE, pas de la base ;
//   · le menu s'ouvre, tout de suite ;
//   · rien ne fige : la page répond encore aux gestes après coup.
let chromium;
try {
  /*  ⚠️ DEUX FORMES POSSIBLES, et il faut les deux : importé par son
      NOM, le paquet expose `chromium` directement ; importé par le
      CHEMIN de son fichier, il arrive en module ancien et tout se
      trouve sous `default`. (Même écriture que `banc-vitesse.mjs`.) */
  const paquet = await import(process.env.BANC_PLAYWRIGHT ?? "playwright-core");
  chromium = paquet.chromium ?? paquet.default?.chromium;
  if (!chromium) throw new Error("chromium introuvable dans le paquet");
} catch {
  console.error(
    "\n\u2716  Ce banc a besoin de \u00ab playwright-core \u00bb, que le site n'embarque pas.\n" +
    "\n   npm i --no-save playwright-core\n" +
    "   ou BANC_PLAYWRIGHT=/chemin/vers/playwright-core node outils/<ce-banc>.mjs\n"
  );
  process.exit(1);
}
const NAVIGATEUR = process.env.BANC_NAVIGATEUR ?? "/opt/pw-browsers/chromium";

const BASE = "http://127.0.0.1:3000";
const COMPTE = "eeee0000-0000-4000-8000-0000000ent03";
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function cookieSession() {
  const expire = Math.floor(Date.now() / 1000) + 24 * 3600;
  const identite = { nom: "Kevin", nom_affiche: "Kevin",
    photo_compte: "https://exemple.test/avatar-703.jpg" };
  const u = { id: COMPTE, aud: "authenticated", role: "authenticated",
    email: "kevin@yokofolio.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: identite, created_at: "2026-01-01T00:00:00.000Z" };
  const jeton = [b64u({ alg: "HS256", typ: "JWT" }),
    b64u({ sub: COMPTE, aud: "authenticated", role: "authenticated", email: u.email,
      exp: expire, iat: Math.floor(Date.now() / 1000),
      app_metadata: u.app_metadata, user_metadata: identite }), "sig"].join(".");
  return { name: "sb-127-auth-token",
    value: "base64-" + Buffer.from(JSON.stringify({ access_token: jeton,
      refresh_token: "r", token_type: "bearer", expires_in: 86400,
      expires_at: expire, user: u })).toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_"),
    domain: "127.0.0.1", path: "/" };
}

const APPAREILS = [
  { nom: "DOIGT", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { nom: "WEB", viewport: { width: 1280, height: 900 } },
];

const nav = await chromium.launch({ executablePath: NAVIGATEUR });

for (const { nom: appareil, ...options } of APPAREILS) {
  for (const chemin of ["/legal", "/contact"]) {
    const ctx = await nav.newContext(options);
    await ctx.addCookies([cookieSession()]);
    /*  LA COUPURE : tout ce que LE NAVIGATEUR envoie vers la base
        reste sans réponse. Le serveur, lui, garde la sienne. */
    await ctx.route("**/127.0.0.1:3222/**", () => { /* jamais de réponse */ });
    const page = await ctx.newPage();
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 120)));
    const t = Date.now();
    let statut = 0;
    try {
      const r = await page.goto(BASE + chemin, { waitUntil: "load", timeout: 20000 });
      statut = r?.status() ?? 0;
    } catch { statut = -1; }
    const millisPage = Date.now() - t;
    await page.waitForTimeout(2000);

    const bouton = page.locator('header button[aria-label^="Mon espace"]:visible').first();
    const etiquette = await bouton.getAttribute("aria-label").catch(() => null);

    /*  LE MENU, avec un plafond COURT : s'il ne s'ouvre pas en deux
        secondes alors que la base est muette, c'est le figement. */
    const t2 = Date.now();
    let menu = false;
    try {
      await bouton.click({ timeout: 3000, force: true });
      await page.locator('[role="dialog"][aria-label="Mon espace"]:visible, ' +
        '[role="dialog"][aria-label="Mon compte"]:visible')
        .first().waitFor({ state: "visible", timeout: 4000 });
      menu = true;
    } catch { /* resté fermé */ }
    const millisMenu = Date.now() - t2;

    /*  LA PAGE RÉPOND-ELLE ENCORE ? Un fil principal figé ne rendrait
        pas la main à ce petit calcul. */
    const t3 = Date.now();
    const vivante = await page.evaluate(() => 1 + 1 === 2).catch(() => false);
    const millisVive = Date.now() - t3;

    console.log(`${appareil.padEnd(6)} ${chemin.padEnd(18)} HTTP ${statut}` +
      ` en ${millisPage} ms · compte « ${etiquette ?? "—"} »` +
      ` · menu ${menu ? "✅" : "❌"} en ${millisMenu} ms` +
      ` · page vivante ${vivante ? "✅" : "❌"} (${millisVive} ms)` +
      ` · erreurs ${erreurs.length || "aucune"}`);
    await ctx.close();
  }
}
await nav.close();
