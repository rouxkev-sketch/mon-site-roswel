/**
 * ██ nº 704 — L4 CRAN 1 : LA PAGE DE RECHERCHE DU DOIGT, À LA DEMANDE ██
 * ==================================================================
 * CE QU'IL ÉPROUVE, et ce sont les trois choses que le cran pouvait
 * casser :
 *
 *  A · LE DÉCLENCHEUR RESTE INSTANTANÉ, et la page arrive. Au doigt,
 *      la pilule « Find your tattoo style… » et la loupe ouvrent une
 *      page plein écran dont le programme n'est plus dans le tronc :
 *      on mesure le temps entre le geste et la page à l'écran.
 *  B · « EXPLORER LES STYLES » RAMÈNE EN HAUT DE L'ACCUEIL (nº 661).
 *      C'est la garde de position, la plus fragile du site : le lien
 *      part de « Ma sélection » vide et doit poser la page à 0.
 *  C · LE BUG DES STYLES (nº 673) N'EST PAS REVENU : chaque carte de
 *      style mène À SON style — y compris « néo-japonais », qui n'est
 *      PAS dans le code (il naît d'une suggestion en base, et c'est
 *      précisément celui qui se trompait de page).
 *
 * ────────────────────────────────────────────────────────────────────
 * COMMENT S'EN SERVIR (mêmes préparatifs que `banc-vitesse.mjs`)
 *
 *   TRI=1 SLUGS_UNIQUES=1 node outils/doublure-supabase.mjs
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run build
 *   SUPABASE_SECRET_KEY=peu-importe \
 *     NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run start
 *   node outils/banc-moteur-704.mjs
 *
 * ⚠️ CHROMIUM SEUL DANS CET ATELIER : il n'y a pas de WebKit installé
 * (`/opt/pw-browsers` ne contient que Chromium). Le « DOIGT » est donc
 * un Chromium en gabarit d'iPhone, tactile, avec l'agent de Safari —
 * pas un vrai Safari. C'est dit plutôt que sous-entendu.
 */
let chromium;
try {
  const paquet = await import(process.env.BANC_PLAYWRIGHT ?? "playwright-core");
  chromium = paquet.chromium ?? paquet.default?.chromium;
  if (!chromium) throw new Error("chromium introuvable dans le paquet");
} catch {
  console.error(
    "\n✖  Ce banc a besoin de « playwright-core ».\n" +
    "   npm i --no-save playwright-core\n" +
    "   ou BANC_PLAYWRIGHT=/chemin/vers/playwright-core node outils/banc-moteur-704.mjs\n"
  );
  process.exit(1);
}
const NAVIGATEUR = process.env.BANC_NAVIGATEUR ?? "/opt/pw-browsers/chromium";
const BASE = process.env.BANC_BASE ?? "http://127.0.0.1:3000";

const APPAREILS = [
  { nom: "DOIGT", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { nom: "WEB", viewport: { width: 1280, height: 900 } },
];

/*  UNE SESSION FORGÉE : « Ma sélection » ne montre son écran vide —
    et donc « Explorer les styles » — qu'à quelqu'un de connecté. */
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function cookieSession() {
  const id = "eeee0000-0000-4000-8000-0000000ent04";
  const mail = "kevin@yokofolio.test";
  const exp = Math.floor(Date.now() / 1000) + 86400;
  const ident = { nom: "Kevin", nom_affiche: "Kevin" };
  const u = { id, aud: "authenticated", role: "authenticated", email: mail,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: ident, created_at: "2026-01-01T00:00:00.000Z" };
  const j = [b64u({ alg: "HS256", typ: "JWT" }),
    b64u({ sub: id, aud: "authenticated", role: "authenticated", email: mail,
      exp, iat: Math.floor(Date.now() / 1000),
      app_metadata: u.app_metadata, user_metadata: ident }), "sig"].join(".");
  return { name: "sb-127-auth-token",
    value: "base64-" + Buffer.from(JSON.stringify({ access_token: j,
      refresh_token: "r", token_type: "bearer", expires_in: 86400,
      expires_at: exp, user: u })).toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_"),
    domain: "127.0.0.1", path: "/" };
}

const OK = (b) => (b ? "✅" : "❌");
const nav = await chromium.launch({ executablePath: NAVIGATEUR });
const releve = { a: [], b: [], c: [] };

for (const { nom: appareil, ...options } of APPAREILS) {
  /* ══ A · LE DÉCLENCHEUR ET LA PAGE PLEIN ÉCRAN ══════════════════ */
  {
    const ctx = await nav.newContext(options);
    const page = await ctx.newPage();
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(String(e).slice(0, 140)));
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1500);

    /*  LE DÉCLENCHEUR : la pilule au doigt, l'encadré au web. On
        prend ce qui est VISIBLE — les deux habillages sont montés en
        même temps dans le document (leçon nº 681). */
    /*  ⚠️ LA PAGE PLEIN ÉCRAN EST UNE AFFAIRE DE DOIGT, et rien
        d'autre : au WEB le moteur est un ENCADRÉ à deux champs, sans
        page superposée. Ce cas n'existe donc que sur l'appareil
        tactile — on ne le compte pas en échec au web (piège nº 60 :
        on distingue les appareils par ce qu'ils MONTENT, pas par une
        largeur). */
    const pilule = page.locator(
      'button:has-text("Find your tattoo style"):visible, ' +
      'button:has-text("Rechercher un tatoueur"):visible'
    ).first();
    const declencheur = (await pilule.count()) > 0;
    const concerne = appareil === "DOIGT";

    let ouverte = false, millis = -1;
    if (declencheur) {
      const t = Date.now();
      await pilule.click({ timeout: 5000 }).catch(() => {});
      try {
        await page.locator('[role="dialog"]:visible:has-text("Réalisation"), ' +
          '[role="dialog"]:visible:has-text("Valider")')
          .first().waitFor({ state: "visible", timeout: 8000 });
        ouverte = true;
      } catch { /* pas ouverte */ }
      millis = Date.now() - t;
    }
    releve.a.push({ appareil, concerne, declencheur, ouverte, millis, erreurs: erreurs.length });
    await ctx.close();
  }

  /* ══ B · « EXPLORER LES STYLES » → LE HAUT DE L'ACCUEIL (nº 661) ══ */
  {
    const ctx = await nav.newContext(options);
    await ctx.addCookies([cookieSession()]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/mes-favoris`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1500);
    /*  On descend d'abord : sans cela la page est déjà en haut et le
        témoin ne prouverait rien. */
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    const lien = page.locator('a:has-text("Explorer les styles"):visible').first();
    const present = (await lien.count()) > 0;
    let arrivee = "", position = -1;
    if (present) {
      await lien.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2500);
      arrivee = new URL(page.url()).pathname;
      position = await page.evaluate(() => Math.round(window.scrollY));
    }
    releve.b.push({ appareil, present, arrivee, position });
    await ctx.close();
  }

  /* ══ C · LE BUG DES STYLES (nº 673) ═══════════════════════════════ */
  {
    const ctx = await nav.newContext(options);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2000);
    /*  Chaque carte porte le style dans SON adresse : on compare ce
        que la carte PROMET à ce que la page RÉPOND. */
    const cartes = await page.locator('a[href^="/recherche?style="]:visible').all();
    const cas = [];
    for (const carte of cartes.slice(0, 6)) {
      const href = await carte.getAttribute("href");
      const promis = new URL(href, BASE).searchParams.get("style");
      cas.push({ promis, href });
    }
    for (const c of cas) {
      await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(1200);
      const carte = page.locator(`a[href="${c.href}"]:visible`).first();
      if (!(await carte.count())) { c.rendu = "(carte introuvable)"; continue; }
      await carte.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2500);
      c.rendu = new URL(page.url()).searchParams.get("style") ?? "(aucun)";
      c.juste = c.rendu === c.promis;
    }
    releve.c.push({ appareil, cas });
    await ctx.close();
  }
}
await nav.close();

console.log("\n══ A · LE DÉCLENCHEUR, ET LA PAGE QUI ARRIVE AU GESTE ══");
for (const r of releve.a) {
  if (!r.concerne) {
    console.log(`  ${r.appareil.padEnd(6)} — sans objet : au web le moteur est un encadré,` +
      " il n'a pas de page plein écran");
    continue;
  }
  console.log(`  ${r.appareil.padEnd(6)} déclencheur ${OK(r.declencheur)}` +
    ` · page ouverte ${OK(r.ouverte)} en ${r.millis} ms` +
    ` · erreurs ${r.erreurs || "aucune"}`);
}
console.log("\n══ B · « EXPLORER LES STYLES » → HAUT DE L'ACCUEIL (nº 661) ══");
for (const r of releve.b) {
  console.log(`  ${r.appareil.padEnd(6)} lien ${OK(r.present)}` +
    ` · arrivée « ${r.arrivee} » ${OK(r.arrivee === "/")}` +
    ` · position ${r.position} px ${OK(r.position === 0)}`);
}
console.log("\n══ C · LE BUG DES STYLES (nº 673) — carte → sa page ══");
for (const r of releve.c) {
  const faux = r.cas.filter((c) => !c.juste);
  console.log(`  ${r.appareil.padEnd(6)} ${r.cas.length} cartes · ` +
    `${r.cas.length - faux.length} justes ${OK(faux.length === 0)}`);
  for (const c of r.cas) {
    console.log(`     ${OK(c.juste)} promis « ${c.promis} » → rendu « ${c.rendu} »`);
  }
}
console.log("");
