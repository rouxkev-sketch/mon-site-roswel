/**
 * ██ LE BANC DE VITESSE — LA RÉFÉRENCE DE L'ALLÈGEMENT (passe nº 702) ██
 * ==================================================================
 * CE QU'IL FAIT, ET POURQUOI IL EXISTE. Le plan nº 701 découpe
 * l'allègement du programme en étapes (L2 à L5). Chacune touche des
 * fichiers montés sur toutes les pages — dont la barre et le moteur,
 * la zone la plus fragile du site (nº 653/661/677). Sans une mesure
 * posée AVANT, on ne saurait dire ni ce qu'une étape a gagné, ni ce
 * qu'elle a cassé. Ce banc est cette mesure.
 *
 * IL RÉPOND À TROIS QUESTIONS, ET RIEN D'AUTRE :
 *   1. LE POIDS — combien de JavaScript le navigateur télécharge
 *      vraiment, page par page ;
 *   2. LE TEMPS — combien de secondes sur une liaison lente et une
 *      liaison rapide, avec un processeur de téléphone ;
 *   3. LE RETOUR ET LA POSITION — après un aller-retour, la liste
 *      est-elle rendue là où on l'avait laissée, et l'historique
 *      n'a-t-il avancé que d'un cran.
 *
 * ⚠️ IL NE MESURE QUE CE QUI PART SUR LE RÉSEAU. Le poids est celui
 * des requêtes RÉELLEMENT faites par le navigateur, pas celui des
 * balises trouvées dans le HTML — la différence n'est pas théorique :
 * le fichier de béquilles anciennes (`noModule`) est dans le HTML et
 * n'est JAMAIS téléchargé. Compter le HTML fait croire à un gain qui
 * n'existe pas (c'est l'erreur que la nº 702 a corrigée dans le plan).
 *
 * ────────────────────────────────────────────────────────────────────
 * COMMENT S'EN SERVIR
 *
 *   1) LA DOUBLURE, PUIS LE SITE COMPILÉ (voir outils/doublure-supabase.mjs)
 *      TRI=1 SLUGS_UNIQUES=1 node outils/doublure-supabase.mjs
 *      NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run build
 *      SUPABASE_SECRET_KEY=peu-importe \
 *        NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:3222 npm run start
 *
 *   2) POSER LA RÉFÉRENCE (une fois, avant de toucher au programme)
 *      node outils/banc-vitesse.mjs --poser
 *
 *   3) APRÈS CHAQUE ÉTAPE D'ALLÈGEMENT
 *      node outils/banc-vitesse.mjs
 *      → le tableau, et l'écart avec la référence, ligne par ligne.
 *
 * ⚠️ LA CLÉ DE SERVICE : depuis la nº 697 elle est vide dans l'atelier.
 * Les pages de compte en ont besoin — n'importe quelle valeur suffit,
 * la doublure ne la vérifie pas.
 * ⚠️ IL N'ÉCRIT RIEN DANS LE SITE : seulement `outils/reference-vitesse.json`.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { gzipSync } from "zlib";

/*  ██ TROUVER PLAYWRIGHT SANS L'IMPOSER AU PROJET ██
    Le site n'en dépend pas, et ne doit pas en dépendre : c'est un
    outil d'atelier, il n'a rien à faire dans ce qui part en
    production. On le cherche donc là où il peut être, et l'on
    explique s'il manque — plutôt que de laisser tomber une pile
    d'appels illisible.
    ⚠️ `BANC_PLAYWRIGHT` PREND LE DESSUS : c'est ainsi qu'on pointe
    une installation posée ailleurs (un scratchpad, un dossier de
    travail) sans rien changer au dépôt. */
let chromium;
try {
  /*  ⚠️ DEUX FORMES POSSIBLES, et il faut les deux : importé par son
      NOM, le paquet expose `chromium` directement ; importé par le
      CHEMIN de son fichier, il arrive en module ancien et tout se
      trouve sous `default`. Ne gérer qu'un cas rend l'autre illisible
      (« Cannot read properties of undefined »). */
  const paquet = await import(process.env.BANC_PLAYWRIGHT ?? "playwright-core");
  chromium = paquet.chromium ?? paquet.default?.chromium;
  if (!chromium) throw new Error("chromium introuvable dans le paquet");
} catch {
  console.error(
    "\n✖  Ce banc a besoin de « playwright-core », que le site n'embarque pas.\n" +
    "\n   Soit tu l'installes à côté :\n" +
    "       npm i --no-save playwright-core\n" +
    "\n   Soit tu pointes une installation existante :\n" +
    "       BANC_PLAYWRIGHT=/chemin/vers/playwright-core node outils/banc-vitesse.mjs\n" +
    "\n   Le navigateur, lui, est déjà là (voir NAVIGATEUR plus bas).\n"
  );
  process.exit(1);
}

/*  Le binaire du navigateur : celui de l'atelier par défaut, un autre
    par `BANC_NAVIGATEUR` (sur un Mac, le Chrome du système fait
    l'affaire). */
const NAVIGATEUR = process.env.BANC_NAVIGATEUR ?? "/opt/pw-browsers/chromium";

const BASE = process.env.BANC_BASE ?? "http://127.0.0.1:3000";
//  Les fichiers compilés, relativement à ce script : le banc suit le
//  dossier où il se trouve, pas un chemin écrit en dur.
const CHUNKS = new URL("../.next/static/chunks/", import.meta.url).pathname;
const REFERENCE = new URL("./reference-vitesse.json", import.meta.url).pathname;
const POSER = process.argv.includes("--poser");

/*  LA SESSION FORGÉE — trois pages de l'échantillon sont derrière un
    compte. Le jeton n'est pas signé : c'est la doublure qui le décode,
    et elle ne vérifie rien. Il ne vaut RIEN ailleurs qu'ici. */
const COMPTE = "eeee0000-0000-4000-8000-0000000vit02";
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function cookieDuCompte() {
  const expire = Math.floor(Date.now() / 1000) + 86400;
  const u = { id: COMPTE, aud: "authenticated", role: "authenticated",
    email: "vitesse@yokofolio.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {}, created_at: "2026-01-01T00:00:00.000Z" };
  const jeton = [b64u({ alg: "HS256", typ: "JWT" }),
    b64u({ sub: COMPTE, aud: "authenticated", role: "authenticated",
      email: u.email, exp: expire, iat: 0,
      app_metadata: u.app_metadata, user_metadata: {} }), "sig"].join(".");
  return { name: "sb-127-auth-token",
    value: "base64-" + Buffer.from(JSON.stringify({ access_token: jeton,
      refresh_token: "r", token_type: "bearer", expires_in: 86400,
      expires_at: expire, user: u })).toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_"),
    domain: "127.0.0.1", path: "/" };
}

/*  L'ÉCHANTILLON — six pages choisies pour ce qu'elles éprouvent :
    l'accueil et la recherche portent le moteur ; la fiche est la page
    la plus visitée ; « Ma sélection » et l'éditeur sont les deux
    écrans de compte les plus lourds ; les mentions légales sont LE
    TÉMOIN — une page qui n'a besoin de rien, et qui montre donc le
    poids du tronc à l'état pur. */
const PAGES = [
  { nom: "accueil", chemin: "/" },
  { nom: "recherche", chemin: "/recherche" },
  { nom: "fiche", chemin: "/tatoueur/demo-trash-polka-0" },
  { nom: "ma-selection", chemin: "/mes-favoris", compte: true },
  { nom: "editeur", chemin: "/devenir-tatoueur/fiche", compte: true },
  { nom: "legal", chemin: "/legal" },
];

/*  LES DEUX LIAISONS DU PLAN nº 701, aux profils de Lighthouse. Le
    processeur est ralenti ×4 dans les deux cas : un téléphone de
    milieu de gamme, pas la machine de l'atelier. */
const LIAISONS = [
  { nom: "4G", latency: 60, download: (9 * 1024 * 1024) / 8, upload: (1.5 * 1024 * 1024) / 8 },
  { nom: "3G rapide", latency: 150, download: (1.6 * 1024 * 1024) / 8, upload: (750 * 1024) / 8 },
];

const TELEPHONE = {
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

const ko = (octets) => Math.round(octets / 1024);

/** Le poids des fichiers demandés, brut et compressé. */
function peser(fichiers) {
  let brut = 0, gz = 0;
  for (const f of fichiers) {
    try {
      const o = readFileSync(`${CHUNKS}${f}`);
      brut += o.length;
      gz += gzipSync(o).length;
    } catch {
      /*  Un fichier absent du disque (servi autrement) ne fausse pas
          la mesure : on ne compte que ce qu'on peut peser, et le
          nombre de fichiers est rendu à côté pour qu'un écart se voie. */
    }
  }
  return { brut: ko(brut), gz: ko(gz) };
}

/* ═══════════ 1 · LE POIDS ═══════════ */
async function mesurerLePoids(nav) {
  const releve = [];
  for (const page of PAGES) {
    const ctx = await nav.newContext(TELEPHONE);
    if (page.compte) await ctx.addCookies([cookieDuCompte()]);
    const onglet = await ctx.newPage();
    const js = new Set();
    onglet.on("request", (r) => {
      const u = r.url();
      if (u.includes("/_next/static/") && u.endsWith(".js")) js.add(u.split("/").pop());
    });
    await onglet.goto(BASE + page.chemin, { waitUntil: "networkidle", timeout: 60000 });
    releve.push({ nom: page.nom, fichiers: js.size, ...peser(js) });
    await ctx.close();
  }
  return releve;
}

/* ═══════════ 2 · LE TEMPS ═══════════ */
async function mesurerLeTemps(nav) {
  const releve = [];
  for (const liaison of LIAISONS) {
    for (const chemin of ["/", "/legal"]) {
      const ctx = await nav.newContext(TELEPHONE);
      const onglet = await ctx.newPage();
      const cdp = await ctx.newCDPSession(onglet);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false, latency: liaison.latency,
        downloadThroughput: liaison.download, uploadThroughput: liaison.upload,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      const depart = Date.now();
      await onglet.goto(BASE + chemin, { waitUntil: "load", timeout: 120000 });
      releve.push({
        nom: `${liaison.nom} · ${chemin}`,
        ms: Date.now() - depart,
      });
      await ctx.close();
    }
  }
  return releve;
}

/* ═══════════ 3 · LE RETOUR ET LA POSITION ═══════════
   C'est le garde-fou des étapes L3/L4 : elles touchent la barre et le
   moteur, et c'est LÀ que le site a historiquement cassé (nº 653/661).
   On ne mesure pas une impression — on mesure trois nombres :
     · la position verticale restaurée (à 40 px près : le navigateur
       n'est pas au pixel, et la charte tolère cette marge) ;
     · la longueur de l'historique (le retour ne doit défaire QU'UN
       cran, règle nº 156/164) ;
     · l'adresse d'arrivée. */
async function mesurerLeRetour(nav) {
  const releve = [];
  /*  LES TROIS SAUTS QUE LE SITE FAIT VRAIMENT. Ils ne sont pas
      choisis pour faire joli : ce sont les enchaînements où la
      position s'est cassée par le passé.
      ⚠️ L'ACCUEIL N'A PAS DE LIEN DE FICHE, et c'est normal : il
      montre des CARTES DE STYLE qui mènent à la recherche. Viser
      `/tatoueur/` dessus ne mesurait rien (la première version de ce
      banc s'y est trompée). C'est la MOSAÏQUE DE RÉSULTATS qui porte
      les fiches — et c'est elle, la vraie épreuve de la position :
      près de trois écrans de haut. */
  const parcours = [
    { nom: "accueil → style → retour", depart: "/",
      lien: 'a[href^="/recherche?style"]' },
    { nom: "mosaïque → fiche → retour",
      depart: "/recherche?style=realisme&nature=tatouage",
      lien: 'a[href^="/tatoueur/"]' },
    { nom: "style+ville → fiche → retour",
      depart: "/tatouage/trash-polka/lyon-0-0",
      lien: 'a[href^="/tatoueur/"]' },
  ];
  for (const p of parcours) {
    const ctx = await nav.newContext(TELEPHONE);
    const onglet = await ctx.newPage();
    const echec = (raison) => releve.push({ nom: p.nom, verdict: raison });
    try {
      await onglet.goto(BASE + p.depart, { waitUntil: "domcontentloaded", timeout: 45000 });
      await onglet.waitForTimeout(1800);
      /*  ON DESCEND — sans défilement, une position restaurée ne prouve
          rien (zéro égale zéro). La distance vient de LA HAUTEUR DE LA
          PAGE, pas d'un nombre écrit en dur : une page courte ne peut
          pas descendre de 900 px, et un `scrollTo` qui ne bouge pas
          fait passer un banc muet pour un banc vert. */
      await onglet.evaluate(
        "window.scrollTo(0, Math.round((document.documentElement.scrollHeight - window.innerHeight) * 0.6))"
      );
      await onglet.waitForTimeout(700);
      const avant = await onglet.evaluate("Math.round(window.scrollY)");
      const hauteurAvant = await onglet.evaluate("document.documentElement.scrollHeight");
      const cible = onglet.locator(p.lien).first();
      if (!(await cible.count())) {
        echec(`aucun lien « ${p.lien} » sur la page`);
        await ctx.close();
        continue;
      }
      const depart = await onglet.evaluate("location.pathname + location.search");
      await cible.click();
      await onglet.waitForTimeout(2400);
      const arrivee = await onglet.evaluate("location.pathname + location.search");
      const aChange = arrivee !== depart;
      await onglet.goBack();
      await onglet.waitForTimeout(2200);
      const apres = await onglet.evaluate("Math.round(window.scrollY)");
      const chemin = await onglet.evaluate("location.pathname + location.search");
      const hauteurApres = await onglet.evaluate("document.documentElement.scrollHeight");
      releve.push({
        nom: p.nom,
        aChange,
        arrivee,
        positionAvant: avant,
        positionApres: apres,
        ecart: Math.abs(avant - apres),
        rendu: Math.abs(avant - apres) <= 40,
        /*  LA HAUTEUR AU RETOUR EXPLIQUE LES RESTAURATIONS PARTIELLES :
            si la page revient plus courte (images pas encore chargées),
            le navigateur RABOTE la position au maximum possible. Sans
            ce nombre, on accuserait le site d'un défaut qui n'est que
            de la mise en page en cours. */
        hauteurAvant,
        hauteurApres,
        //  LE VRAI CRITÈRE DU « UN SEUL CRAN » : un unique retour
        //  ramène à l'adresse de départ. `history.length` ne convient
        //  PAS — il ne décroît jamais après un retour, et faisait
        //  échouer le banc sur un site qui se comporte bien.
        revenu: chemin === depart,
        revenuSur: chemin,
      });
    } catch (erreur) {
      echec(`interrompu : ${String(erreur).slice(0, 60)}`);
    }
    await ctx.close();
  }
  return releve;
}

/*  ═══════════ 3 bis · LES DEUX TÉMOINS DE LA POSITION ═══════════
    ILS RENDENT LE VERDICT DU DESSUS INTERPRÉTABLE, et sans eux on
    accuse le mauvais coupable. Le navigateur restaure-t-il seulement,
    dans cet environnement ?
      · TÉMOIN A — on recharge la page au même endroit ;
      · TÉMOIN B — on part par un CHARGEMENT COMPLET (pas le routeur
        du site) et l'on revient.
    Si ces deux-là restaurent et que le parcours par CLIC ne restaure
    pas, alors la perte est dans LA NAVIGATION CLIENT du site — pas
    dans le navigateur, pas dans le banc, pas dans la doublure. C'est
    exactement ce que la nº 702 a mesuré. */
async function mesurerLesTemoins(nav) {
  const CIBLE = "/recherche?style=realisme&nature=tatouage";
  const releve = [];
  const preparer = async () => {
    const ctx = await nav.newContext(TELEPHONE);
    const onglet = await ctx.newPage();
    await onglet.goto(BASE + CIBLE, { waitUntil: "networkidle", timeout: 60000 });
    await onglet.waitForTimeout(2500);
    await onglet.evaluate(
      "window.scrollTo(0, Math.round((document.documentElement.scrollHeight - window.innerHeight) * 0.6))"
    );
    await onglet.waitForTimeout(1000);
    const y = await onglet.evaluate("Math.round(window.scrollY)");
    return { ctx, onglet, y };
  };
  {
    const { ctx, onglet, y } = await preparer();
    await onglet.reload({ waitUntil: "networkidle" });
    await onglet.waitForTimeout(3000);
    const apres = await onglet.evaluate("Math.round(window.scrollY)");
    releve.push({ nom: "A · rechargement", avant: y, apres, rendu: Math.abs(y - apres) <= 40 });
    await ctx.close();
  }
  {
    const { ctx, onglet, y } = await preparer();
    await onglet.goto(BASE + "/tatoueur/demo-realisme-0", { waitUntil: "networkidle" });
    await onglet.waitForTimeout(1500);
    await onglet.goBack({ waitUntil: "networkidle" });
    await onglet.waitForTimeout(3000);
    const apres = await onglet.evaluate("Math.round(window.scrollY)");
    releve.push({ nom: "B · aller/retour complet", avant: y, apres, rendu: Math.abs(y - apres) <= 40 });
    await ctx.close();
  }
  return releve;
}

/* ═══════════ LA SORTIE ═══════════ */
const nav = await chromium.launch({ executablePath: NAVIGATEUR });
const poids = await mesurerLePoids(nav);
const temps = await mesurerLeTemps(nav);
const retour = await mesurerLeRetour(nav);
const temoins = await mesurerLesTemoins(nav);
await nav.close();

const ancienne = existsSync(REFERENCE)
  ? JSON.parse(readFileSync(REFERENCE, "utf8"))
  : null;
const ecart = (nom, valeur, table) => {
  if (!ancienne?.[table]) return "";
  const vieux = ancienne[table].find((l) => l.nom === nom);
  if (!vieux) return "   (nouveau)";
  const d = valeur - (table === "poids" ? vieux.gz : vieux.ms);
  if (d === 0) return "   =";
  return `   ${d > 0 ? "+" : ""}${d}`;
};

console.log("\n══ 1 · LE POIDS (JavaScript téléchargé, téléphone) ══");
for (const l of poids) {
  console.log(
    `  ${l.nom.padEnd(18)} ${String(l.fichiers).padStart(2)} fichiers · ` +
    `${String(l.brut).padStart(5)} Ko brut · ${String(l.gz).padStart(4)} Ko gz` +
    ecart(l.nom, l.gz, "poids")
  );
}
console.log("\n══ 2 · LE TEMPS (processeur ×4) ══");
for (const l of temps) {
  console.log(
    `  ${l.nom.padEnd(28)} ${(l.ms / 1000).toFixed(1)} s` +
    ecart(l.nom, l.ms, "temps")
  );
}
console.log("\n══ 3 · LE RETOUR ET LA POSITION ══");
for (const l of retour) {
  if (l.verdict) { console.log(`  ❌ ${l.nom.padEnd(28)} ${l.verdict}`); continue; }
  /*  DEUX VERDICTS DISTINCTS, ET C'EST VOULU. « Revenu » dit que la
      navigation est saine (un retour = l'adresse de départ) ; « rendu »
      dit que la POSITION a été restaurée. Les mêler cacherait lequel
      des deux a bougé après une étape d'allègement. */
  const nav = l.aChange && l.revenu;
  console.log(
    `  ${nav ? "✅" : "❌"} navigation · ${l.rendu ? "✅" : "❌"} position   ${l.nom.padEnd(26)}` +
    ` ${l.positionAvant} → ${l.positionApres} (écart ${l.ecart} px)` +
    ` · hauteur ${l.hauteurAvant} → ${l.hauteurApres} · revenu sur ${l.revenuSur}`
  );
}

console.log("\n══ 3 bis · LES TÉMOINS (le navigateur restaure-t-il ?) ══");
for (const l of temoins) {
  console.log(
    `  ${l.rendu ? "✅" : "❌"} ${l.nom.padEnd(26)} ${l.avant} → ${l.apres}`
  );
}
if (temoins.every((t) => t.rendu) && retour.some((r) => r.rendu === false)) {
  console.log(
    "\n  ⚠️  Les témoins restaurent, les parcours par CLIC non :\n" +
    "      la position se perd dans la NAVIGATION CLIENT du site."
  );
}

if (POSER) {
  writeFileSync(REFERENCE, JSON.stringify({
    pose_le: new Date().toISOString(), poids, temps, retour, temoins,
  }, null, 1) + "\n");
  console.log(`\n  → référence écrite dans outils/reference-vitesse.json`);
} else if (ancienne) {
  console.log(`\n  (écarts calculés depuis la référence du ${ancienne.pose_le.slice(0, 10)})`);
} else {
  console.log("\n  (aucune référence : lancer une fois avec --poser)");
}
