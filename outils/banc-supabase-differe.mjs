//  ██ nº 703 — L3 : SUPABASE-JS DIFFÉRÉ ██
//  CE QUI SE MESURE, sur DEUX APPAREILS :
//   1. le morceau de la base part-il ? (page qui ne lit rien vs page
//      qui lit) ;
//   2. l'état connecté : nom, avatar, bouton du compte, point rose ;
//   3. le menu s'ouvre, et la fenêtre « Modifier » — désormais chargée
//      à la demande — arrive quand on la demande ;
//   4. la résilience : base muette → dégradé, PAS de figement
//      (`MUET=1` en tête de commande, la doublure étant relancée
//      elle-même avec `MUETTE=1`).
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
const MUET = process.env.MUET === "1";
const COMPTE = "eeee0000-0000-4000-8000-0000000ent03";

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/*  La session forgée porte L'IDENTITÉ AFFICHÉE (nº 675) : le nom et
    la photo voyagent dans le cookie, et c'est précisément ce que L3
    ne doit pas casser — ils se lisent SANS la bibliothèque. */
function cookieSession() {
  const expire = Math.floor(Date.now() / 1000) + 24 * 3600;
  const identite = {
    nom: "Kevin",
    nom_affiche: "Kevin",
    photo_compte: "https://exemple.test/avatar-703.jpg",
  };
  const u = {
    id: COMPTE, aud: "authenticated", role: "authenticated",
    email: "kevin@yokofolio.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: identite, created_at: "2026-01-01T00:00:00.000Z",
  };
  const jeton = [
    b64u({ alg: "HS256", typ: "JWT" }),
    b64u({ sub: COMPTE, aud: "authenticated", role: "authenticated",
      email: u.email, exp: expire, iat: Math.floor(Date.now() / 1000),
      app_metadata: u.app_metadata, user_metadata: identite }),
    "sig",
  ].join(".");
  return {
    name: "sb-127-auth-token",
    value: "base64-" + Buffer.from(JSON.stringify({
      access_token: jeton, refresh_token: "r", token_type: "bearer",
      expires_in: 86400, expires_at: expire, user: u,
    })).toString("base64").replace(/\+/g, "-").replace(/\//g, "_"),
    domain: "127.0.0.1", path: "/",
  };
}

/*  LE MORCEAU DE LA BASE SE RECONNAÎT À SON CONTENU, pas à son nom :
    le nom change à chaque compilation. On relève les morceaux
    demandés, puis on regarde lequel porte la bibliothèque. */
import { readdirSync, readFileSync } from "node:fs";
const CHUNKS = new URL("../.next/static/chunks/", import.meta.url).pathname;
const MORCEAU_BASE = readdirSync(CHUNKS)
  .filter((f) => f.endsWith(".js"))
  .find((f) => readFileSync(CHUNKS + f, "utf8").includes("createBrowserClient"));

const APPAREILS = [
  { nom: "DOIGT", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
  { nom: "WEB", viewport: { width: 1280, height: 900 } },
];

const PAGES = [
  //  `litLaBase` : la page a besoin de la bibliothèque pour elle-même
  //  (les cœurs de la mosaïque écrivent en base). Les deux autres ne
  //  lisent RIEN : elles ne doivent la charger que si un compte est
  //  ouvert — et, à terme, plus du tout.
  { nom: "legal", chemin: "/legal", litLaBase: false },
  { nom: "terms", chemin: "/terms", litLaBase: false },
  { nom: "contact", chemin: "/contact", litLaBase: false },
  { nom: "recherche", chemin: "/search?style=realisme&nature=tatouage", litLaBase: true },
];

/*  DEUX VISITEURS, et c'est le cœur de la mesure : celui qui n'a pas
    de compte ne doit RIEN télécharger de la base, jamais ; celui qui
    en a un la reçoit APRÈS l'affichage, sans la bloquer. */
const VISITEURS = [
  { nom: "déconnecté", session: false },
  { nom: "connecté", session: true },
];

/*  `SANS_RECHERCHE=1` : base muette, la mosaïque est rendue par le
    SERVEUR, qui attend son plafond de 10 s (garde nº 686) avant de
    rendre en dégradé. Ce plafond n'a rien à voir avec L3 — on le
    mesure à part, et on garde ici les deux pages du sujet. */
const CHOISIES = process.env.SANS_RECHERCHE === "1"
  ? PAGES.filter((p) => !p.litLaBase)
  : PAGES;

const nav = await chromium.launch({ executablePath: NAVIGATEUR });
const releve = [];

for (const { nom: appareil, ...options } of APPAREILS) {
  for (const v of VISITEURS) for (const p of CHOISIES) {
    const ctx = await nav.newContext(options);
    if (v.session) await ctx.addCookies([cookieSession()]);
    const page = await ctx.newPage();
    const demandes = new Set();
    page.on("request", (r) => {
      const u = r.url();
      if (u.includes("/_next/static/chunks/")) demandes.add(u.split("/").pop());
    });

    const debut = Date.now();
    let statut = 0;
    try {
      const r = await page.goto(BASE + p.chemin, { waitUntil: "load", timeout: 30000 });
      statut = r?.status() ?? 0;
    } catch { statut = -1; }
    //  On laisse le tronc finir : un morceau différé partirait ici.
    await page.waitForTimeout(2500);
    const millis = Date.now() - debut;

    const baseChargee = demandes.has(MORCEAU_BASE);

    /*  L'ÉTAT CONNECTÉ. Le bouton du compte porte le nom du compte
        dans son `aria-label` ; l'avatar est l'image qu'il contient ;
        le point rose est la pastille de la cloche. */
    const bouton = page.locator('header button[aria-label^="Mon espace"]:visible').first();
    const boutonVu = await bouton.count().then((n) => n > 0).catch(() => false);
    const etiquette = boutonVu ? await bouton.getAttribute("aria-label").catch(() => null) : null;
    const avatarVu = boutonVu
      ? await bouton.locator("img").count().then((n) => n > 0).catch(() => false)
      : false;

    /*  LE MENU S'OUVRE-T-IL, ET EN COMBIEN DE TEMPS ? Un menu qui ne
        s'ouvre pas, ou qui met des secondes, serait le figement que
        cette passe ne doit surtout pas introduire. */
    let menuOuvert = false, millisMenu = -1, identiteVue = false,
      baseApresGeste = baseChargee, pointRose = false, libelle = "";
    if (v.session && boutonVu && statut === 200) {
      const t = Date.now();
      try {
        await bouton.click({ timeout: 5000 });
        await page.locator('[role="dialog"][aria-label="Mon espace"]:visible, ' +
          '[role="dialog"][aria-label="Mon compte"]:visible')
          .first().waitFor({ state: "visible", timeout: 8000 });
        menuOuvert = true;
        millisMenu = Date.now() - t;
      } catch { millisMenu = Date.now() - t; }

      /*  LE COMPTEUR DE LA CLOCHE, RELEVÉ AVANT LE GESTE : au web,
          ouvrir « Éditer » FERME « Mon compte » (nº 465) — le relever
          après aurait cherché la cloche dans une fenêtre disparue. */
      if (menuOuvert) {
        pointRose = await page
          .locator('[role="dialog"]:visible :text("Notifications")')
          .first().isVisible().catch(() => false);
      }

      /*  LA FENÊTRE « ÉDITER », désormais chargée à la demande :
          c'est LE geste qui doit faire venir son morceau. */
      if (menuOuvert) {
        try {
          await page.locator('[role="dialog"]:visible button:has-text("Éditer")')
            .first().click({ timeout: 4000 });
          await page.waitForTimeout(3000);
          const fenetres = await page.locator('[role="dialog"]:visible').all();
          for (const f of fenetres) {
            const t = (await f.innerText().catch(() => "")).replace(/\s+/g, " ");
            if (/Nom|Photo|Enregistrer/.test(t)) { identiteVue = true; libelle = t.slice(0, 70); }
          }
        } catch (e) { libelle = "clic KO: " + String(e).slice(0, 60); }
        baseApresGeste = demandes.has(MORCEAU_BASE);
      }
    }

    releve.push({
      appareil, page: p.nom, statut, millis, pointRose,
      visiteur: v.nom, base: baseChargee, attenduBase: p.litLaBase || v.session,
      baseApresGeste, boutonVu, etiquette, avatarVu, menuOuvert, millisMenu,
      identiteVue, libelle,
    });
    await ctx.close();
  }
}

await nav.close();

const OK = (b) => (b ? "✅" : "❌");
console.log(`\n══ nº 703 · L3 — base ${MUET ? "MUETTE" : "vivante"} ══`);
console.log(`   morceau de la base : ${MORCEAU_BASE}\n`);
for (const r of releve) {
  const conforme = r.base === r.attenduBase;
  console.log(`  ${r.appareil.padEnd(6)} ${r.visiteur.padEnd(11)} ${r.page}`);
  console.log(`     HTTP ${r.statut} · chargée en ${(r.millis / 1000).toFixed(1)} s`);
  console.log(`     morceau base : ${r.base ? "OUI" : "non"}` +
    ` (attendu ${r.attenduBase ? "OUI" : "non"}) ${OK(conforme)}`);
  console.log(`     après le geste « Modifier » : ${r.baseApresGeste ? "OUI" : "non"}`);
  console.log(`     bouton du compte ${OK(r.boutonVu)} « ${r.etiquette ?? "—"} »` +
    ` · avatar ${OK(r.avatarVu)}`);
  console.log(`     menu ${OK(r.menuOuvert)} en ${r.millisMenu} ms` +
    ` · cloche ${OK(r.pointRose)} · fenêtre Éditer ${OK(r.identiteVue)}` +
    (r.libelle ? ` « ${r.libelle} »` : ""));
}
console.log("");
