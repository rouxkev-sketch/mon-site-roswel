/**
 * BANC DE LA PASSE Nº 337 — LIVRAISON RAPIDE
 * ==================================================================
 * ⚠️ CE BANC MESURE DANS LES CONDITIONS DU PROPRIÉTAIRE, ET C'EST LA
 * LEÇON DES DEUX PASSES PRÉCÉDENTES : réseau 4G LENTE (400 kbit/s,
 * 400 ms de latence), processeur BRIDÉ ×6, et DEPUIS UNE POSITION
 * DESCENDUE — jamais depuis le haut. Sans cela, tout arrive
 * instantanément et l'on ne reproduit rien (« tes 0 image vide sur 159
 * ont été mesurés dans des conditions que je n'ai jamais »).
 *
 * §1 — L'ÉCRAN VIDE AU RETOUR. On ne pose plus une position là où il
 *      n'y a rien à peindre. Le chiffre demandé : le nombre d'images
 *      PEINTES et VIDES à la position restituée.
 * §2 — LE ROND DE PROFIL, UN SEUL APPUI, sur la fenêtre SUPERPOSÉE —
 *      le chemin du propriétaire, enfin reproduit.
 *
 * ⚠️ TOUT SE JOUE AU DOIGT, À UNE SEULE LARGEUR : 390 × 844, densité 3,
 * `hasTouch`, identité d'un iPhone (livraison rapide).
 *
 * ⚠️ AUCUN IDENTIFIANT N'EST ÉCRIT ICI, ni ailleurs.
 */
import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

/** 4G lente + processeur ×6 : les conditions imposées par le propriétaire. */
async function brider(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
    connectionType: "cellular3g",
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
}

/** Le relevé image par image. Une image MASQUÉE n'est pas peinte. */
const POSE_RELEVE = () => {
  window.__im = [];
  const b = () => {
    const h = innerHeight;
    let visibles = 0;
    for (const e of document.querySelectorAll("main a, main img, main h1, main p")) {
      const r = e.getBoundingClientRect();
      if (r.bottom > 0 && r.top < h && r.width > 8 && r.height > 8) visibles += 1;
    }
    const masque =
      !document.documentElement ||
      getComputedStyle(document.documentElement).visibility === "hidden";
    window.__im.push([
      Math.round(performance.now()),
      masque ? -1 : visibles,
      Math.round(scrollY),
      Math.round(document.documentElement?.scrollHeight ?? 0),
    ]);
    window.__bb = requestAnimationFrame(b);
  };
  b();
};
const LIRE_RELEVE = () => {
  cancelAnimationFrame(window.__bb);
  return window.__im;
};

const { nav, ctx } = await ouvrirLeNavigateur(
  "p337",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3, userAgent: UA_IPHONE }
);

/* ==================================================================
 * §1-a — LA RÈGLE, DANS LES SOURCES
 * ================================================================== */
titre("§1-a — on ne pose une position que sur du contenu");

const regle = lire("src/lib/pose-sur-contenu.ts");
verif(
  "la règle a UNE écriture, et elle porte sa mesure",
  /export function contenuAtteint/.test(regle) &&
    /document\.body\.getBoundingClientRect\(\)\.height >= position/.test(regle),
  "la hauteur du CORPS, que notre réserve n'atteint pas"
);
verif(
  "le script d'avant peinture ne recopie pas la boucle : elle lui est fabriquée",
  /export function boucleDAttentePourLeScript/.test(regle) &&
    /boucleDAttentePourLeScript\(/.test(
      sansNotes(lire("src/lib/script-avant-peinture.ts"))
    )
);
const script = sansNotes(lire("src/lib/script-avant-peinture.ts"));
verif(
  "…et il ne pose plus la réserve AVANT d'avoir de quoi peindre",
  !/r\.style\.minHeight=\(note\.y\+innerHeight\)\+"px";\s*r\.dataset\.positionPosee/.test(
    script
  ),
  "la réserve et le défilement sont posés ensemble, quand le contenu est là"
);
const restitution = sansNotes(lire("src/lib/restitution-position.ts"));
verif(
  "la restitution de React suit la même règle, par le même module",
  /attendreLeContenu\(position, \(\) => \{/.test(restitution) &&
    /contenuAtteint/.test(restitution)
);
verif(
  "et quand le contenu est déjà là, rien n'est retardé d'une image",
  /if \(contenuAtteint\(position\)\) \{\s*poser\(\);\s*return;/.test(restitution)
);
verif(
  "RIEN N'EST GARDÉ EN MÉMOIRE : zéro page, zéro liste, zéro copie",
  !/(Map|Set|cache|memoire)\s*[=<(]/i.test(regle),
  "ce module regarde une hauteur et rend la main"
);

/* ==================================================================
 * §1-b — LA MESURE, DANS TES CONDITIONS
 * ================================================================== */
titre("§1-b — le retour, réseau lent, processeur ×6, depuis 900 px");

/** Un aller-retour complet, avec bridage AVANT le retour. */
async function retourDescendu(documentNeuf) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.evaluate(() => window.scrollTo({ top: 900, left: 0, behavior: "instant" }));
  await p.waitForTimeout(700);
  const lien = p.locator('main a[href^="/tatoueur/"]').first();
  if ((await lien.count()) === 0) {
    await p.close();
    return null;
  }
  await lien.evaluate((el) => el.click());
  await p.waitForTimeout(1500);
  await brider(p);
  if (documentNeuf) await p.goto(`${BASE}/`, { waitUntil: "commit" });
  else await p.goBack({ waitUntil: "commit" });
  await p.evaluate(POSE_RELEVE);
  await p.waitForTimeout(9000);
  const im = await p.evaluate(LIRE_RELEVE);
  const y = await p.evaluate(() => Math.round(scrollY));
  await p.close();
  //  LE CHIFFRE DU PROPRIÉTAIRE : une image PEINTE, VIDE, alors que la
  //  page est déjà posée à la position restituée. C'est notre réserve
  //  nue, et rien d'autre. (`-1` = image masquée : rien n'y est peint.)
  const nues = im.filter((l) => l[1] === 0 && l[2] > 0);
  return { images: im.length, nues: nues.length, y, trace: nues.slice(0, 2) };
}

for (const [nom, neuf] of [
  ["retour de client", false],
  ["document neuf", true],
]) {
  const r = await retourDescendu(neuf);
  if (!r) {
    nonJoue(`§1-b · ${nom}`, "aucune carte servie sur l'accueil");
    continue;
  }
  verif(
    `${nom} — AUCUNE IMAGE PEINTE NE MONTRE UNE PAGE VIDE À LA POSITION`,
    r.nues === 0,
    `${r.images} images relevées · ${r.nues} nue(s)` +
      (r.nues ? ` · ${JSON.stringify(r.trace)}` : "")
  );
  verif(
    `${nom} — et la place est bien rendue`,
    r.y === 900,
    `rendue à ${r.y}`
  );
}

/* ==================================================================
 * §2 — LE ROND DE PROFIL, UN SEUL APPUI
 * ================================================================== */
titre("§2 — la fenêtre superposée part au premier appui");

const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
verif(
  "la fiche est réveillée par TOUT changement d'adresse",
  /useSyncExternalStore\(\s*souscrireAdresse/.test(fiche),
  "les deux portes : le navigateur ET le code (pushState brut compris)"
);
verif(
  "…par l'écriture commune, sans second dispositif",
  /from "@\/lib\/adresse-courante"/.test(fiche) &&
    !/addEventListener\("popstate"/.test(fiche)
);

const p = await ctx.newPage();
await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
const href = await p.evaluate(
  () =>
    document.querySelector('main a[href^="/tatoueur/"]')?.getAttribute("href") ?? ""
);
const slug = href.split("/")[2]?.split("?")[0] ?? "";

if (!slug) {
  nonJoue("§2 EN VIVANT", "aucune fiche servie par ce conteneur");
} else {
  await p.goto(`${BASE}/tatoueur/${slug}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  await p.evaluate(() => window.scrollTo({ top: 400, left: 0, behavior: "instant" }));
  await p.waitForTimeout(400);
  //  LA FENÊTRE SUPERPOSÉE, ouverte EXACTEMENT comme le doigt l'ouvre :
  //  un `pushState` BRUT, que le routeur de Next ne voit pas.
  //  ⚠️ `photo=1` : le rang que porte l'adresse du propriétaire, et qui
  //  n'existe pas forcément dans la série. C'est volontaire.
  await p.evaluate((s) => {
    document.documentElement.setAttribute("data-fenetre-fiche", "1");
    window.history.pushState(
      { fenetreFiche: true, fenetreCarrousel: true },
      "",
      `/tatoueur/${s}/carrousel?style=blackwork&nature=tatouage&photo=1`
    );
  }, slug);
  await p.waitForTimeout(1500);
  const rond = await p.evaluate(() => {
    const a = document.querySelector('[data-fenetre-carrousel] a[href*="#profil"]');
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return {
      x: Math.round(r.left + r.width / 2),
      y: Math.round(r.top + r.height / 2),
      href: a.getAttribute("href"),
    };
  });
  if (!rond) {
    nonJoue("§2 EN VIVANT", "la fenêtre superposée n'a pas de rond de profil ici");
  } else {
    verif(
      "la fenêtre superposée est bien là, avec son rond",
      rond.href.endsWith("#profil"),
      rond.href
    );
    await brider(p);
    await p.touchscreen.tap(rond.x, rond.y);
    await p.waitForTimeout(6000);
    const apres = await p.evaluate(() => ({
      adresse: location.pathname + location.search + location.hash,
      fenetres: document.querySelectorAll("[data-fenetre-carrousel]").length,
    }));
    verif(
      "AU PREMIER APPUI : PLUS AUCUNE FENÊTRE",
      apres.fenetres === 0,
      `${apres.fenetres} fenêtre(s) — réseau lent, processeur ×6`
    );
    verif(
      "AU PREMIER APPUI : l'adresse porte encore `#profil`",
      apres.adresse.endsWith("#profil"),
      apres.adresse
    );
  }
  await p.close();
}

await nav.close();
process.exit(bilan());
