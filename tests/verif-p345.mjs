/**
 * BANC DE LA PASSE Nº 345 — LE FILET S'ARME QUEL QUE SOIT LE NAVIGATEUR
 * ==================================================================
 * LE DÉFAUT, RELEVÉ EN LIGNE PAR LE PROPRIÉTAIRE, SUR SON IPHONE :
 *
 *   SAFARI  — arrivée pile 1 → le filet s'arme → huit allers-retours
 *             sans faute.
 *   CHROME  — arrivée pile 2 → LE FILET NE S'ARME JAMAIS → il sort du
 *             site au premier retour.
 *
 * Chrome sur iPhone ouvre ses onglets avec UNE ENTRÉE DÉJÀ EN PLACE.
 * La condition de la nº 332-§2 — `history.length <= 1` — ne pouvait
 * donc pas être vraie une seule fois sur ce navigateur.
 *
 * ⚠️ CE BANC REPRODUIT D'ABORD, IL VÉRIFIE ENSUITE. Les essais des
 * passes précédentes partaient TOUJOURS d'un onglet dont la pile
 * valait 1 — c'est exactement ce qui a manqué trois fois. Ici, le §1
 * ouvre d'abord une page dans l'onglet.
 *
 * §1 — LA REPRODUCTION, PUIS LA CORRECTION, SUR TROIS ONGLETS.
 * §2 — LE FILET NE S'ARME QU'UNE FOIS, ET IL RATTRAPE LA CHUTE.
 * §3 — CE QUE LE RELEVÉ DE CHROME DIT VRAIMENT (le §2 de la demande) :
 *      « pile bloquée à 3 » et « aucun popstate avant le départ » sont
 *      les DEUX SIGNATURES d'un retour qui change de document.
 * §4 — LA SONDE DIT DÉSORMAIS POURQUOI LE FILET S'EST ARMÉ, OU NON.
 *
 * ⚠️ CHROMIUM, 390 × 844, densité 3, `hasTouch`, identité d'un iPhone.
 * Rien ici ne prouve quoi que ce soit sur Safari ni sur Chrome iOS :
 * la vérification finale est celle du propriétaire, en ligne.
 */
import { createServer } from "node:http";
import {
  BASE,
  bilan,
  lire,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const UA_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

/*  UN FAUX « INSTAGRAM » — une VRAIE page, sur une AUTRE origine, avec
    un vrai lien. C'est le seul moyen d'obtenir un référent étranger,
    et donc de mettre la borne de la nº 332-§2 à l'épreuve. */
const PORT_DEHORS = 3999;
const dehors = createServer((_q, r) => {
  r.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  r.end(
    `<!doctype html><meta charset=utf-8><title>dehors</title>` +
      `<a id=lien href="${BASE}/">vers le site</a>`
  );
});
await new Promise((ok) => dehors.listen(PORT_DEHORS, ok));

const { nav, ctx } = await ouvrirLeNavigateur(
  "p345",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3, userAgent: UA_IPHONE }
);

/** Ce que l'onglet dit de lui-même : la pile, le référent, le relevé
    du bas, et l'étape du filet si elle est là. */
const ETAT = () => ({
  pile: history.length,
  referent: document.referrer,
  bas: JSON.parse(sessionStorage.getItem("roswel:bas-de-la-pile") ?? "null"),
  filet: Boolean(history.state?.retourReconstruit),
  ou: location.pathname,
});

async function ongletOu(preparer) {
  const p = await ctx.newPage();
  await preparer(p);
  await p.waitForTimeout(2500);
  return { p, etat: await p.evaluate(ETAT) };
}

/* ==================================================================
 * §1 — TROIS ONGLETS, TROIS RÉPONSES
 * ================================================================== */
titre("§1 — le filet s'arme-t-il ? trois entrées d'onglet");

//  A — SAFARI : une VRAIE première entrée. `location.replace` et non
//  `goto` : `goto` laisse `about:blank` derrière lui (mesuré nº 336).
{
  const { p, etat } = await ongletOu(async (p) => {
    await p.goto("about:blank");
    await p.evaluate((u) => location.replace(u), `${BASE}/`);
    await p.waitForLoadState("networkidle");
  });
  verif(
    "A · onglet neuf, vraie première entrée — LE FILET S'ARME",
    etat.filet === true && etat.bas?.profondeur === 1,
    `pile ${etat.pile} · profondeur d'arrivée ${etat.bas?.profondeur}`
  );
  verif(
    "A · …et le relevé dit qu'aucune page étrangère n'est derrière",
    etat.bas?.etranger === false,
    `référent « ${etat.referent} »`
  );
  await p.close();
}

//  B — CHROME iOS : LE CAS QUI MANQUAIT. Une entrée est déjà en place
//  quand on arrive ; `goto` après `about:blank` la reproduit à
//  l'identique — pile 2, référent vide.
{
  const { p, etat } = await ongletOu(async (p) => {
    await p.goto("about:blank");
    await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  });
  verif(
    "B · REPRODUCTION — une entrée est déjà en place à l'arrivée",
    etat.bas?.profondeur === 2,
    `profondeur d'arrivée ${etat.bas?.profondeur} · ` +
      "c'est ce chiffre qui rendait `history.length <= 1` impossible"
  );
  verif(
    "B · onglet à entrée fantôme (Chrome iOS) — LE FILET S'ARME MAINTENANT",
    etat.filet === true && etat.pile === 3,
    `pile ${etat.pile} (2 à l'arrivée + l'étape du filet)`
  );
  await p.close();
}

//  C — LA BORNE : une VRAIE page étrangère derrière. Son retour doit
//  l'y ramener, et le filet doit se taire.
{
  const { p, etat } = await ongletOu(async (p) => {
    await p.goto(`http://localhost:${PORT_DEHORS}/`, {
      waitUntil: "domcontentloaded",
    });
    await Promise.all([
      p.waitForURL(`${BASE}/`, { waitUntil: "networkidle" }),
      p.click("#lien"),
    ]);
  });
  verif(
    "C · arrivé depuis une page étrangère — LE FILET SE TAIT (la borne)",
    etat.filet === false && etat.bas?.etranger === true,
    `référent « ${etat.referent} »`
  );
  await p.close();
}

//  LA CONDITION FAUSSE N'EST PLUS DANS LE CODE, et la question a une
//  écriture unique.
const filet = sansNotes(lire("src/components/RetourGaranti.tsx"));
verif(
  "la condition `history.length > 1` a disparu du filet",
  !/history\.length\s*[<>]/.test(filet),
  "elle est remplacée par la question, écrite une seule fois"
);
verif(
  "…et le filet pose les DEUX moitiés de la question",
  /aucunePageDuSiteDerriere\(\)/.test(filet) &&
    /unePageEtrangereEstDerriere\(\)/.test(filet),
  "une page du site derrière ? une page étrangère derrière ?"
);
const script = sansNotes(lire("src/lib/script-avant-peinture.ts"));
verif(
  "le relevé du bas est fait par le script d'avant peinture, et non recopié",
  /releveDuBasPourLeScript\(\)/.test(script) &&
    /export function releveDuBasPourLeScript/.test(lire("src/lib/bas-de-la-pile.ts")),
  "relevé plus tard, il aurait compté nos propres entrées"
);

/* ==================================================================
 * §2 — UNE SEULE FOIS, ET IL RATTRAPE LA CHUTE
 * ================================================================== */
titre("§2 — le filet ne s'arme qu'une fois, et il rattrape la chute");
{
  const p = await ctx.newPage();
  await p.goto("about:blank");
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const arme = await p.evaluate(ETAT);

  /*  ⚠️ ON EMPILE ICI COMME LE ROUTEUR EMPILE : un `pushState` dans le
      MÊME document. Les cartes de la mosaïque rechargent le document
      dans ce conteneur (le catalogue distant est injoignable, la
      requête du routeur échoue et Next retombe sur une navigation de
      document — mesuré). Au niveau de l'HISTORIQUE, qui est tout ce
      que le filet regarde, les deux sont identiques. */
  await p.evaluate(() =>
    history.pushState({}, "", "/tatoueur/atelier-corvus-lyon-1er")
  );
  await p.waitForTimeout(1200);
  const surFiche = await p.evaluate(ETAT);
  verif(
    "une navigation ajoute UNE entrée, pas deux",
    surFiche.pile === arme.pile + 1,
    `${arme.pile} → ${surFiche.pile}`
  );
  verif(
    "…et le filet ne se repose pas par-dessus",
    surFiche.filet === false,
    "son étape reste au bas de la pile, là où elle sert"
  );

  /*  LE GESTE QUI SAUTE DEUX CRANS — celui du relevé de Chrome. Sans
      le filet, la pile étant [fantôme, `/`, fiche], il tombait sur le
      FANTÔME : hors du site. Avec le filet, elle vaut [fantôme, `/`,
      `/`+filet, fiche] : deux crans mènent sur `/`, l'étape NON
      marquée, et le filet joue. */
  await p.evaluate(() => history.go(-2));
  await p.waitForTimeout(3000);
  const rattrape = await p.evaluate(() => ({
    hote: location.host,
    ou: location.pathname,
  }));
  verif(
    "DEUX CRANS D'UN COUP : on reste sur le site, en haut de l'accueil",
    rattrape.hote === new URL(BASE).host && rattrape.ou === "/",
    `${rattrape.hote}${rattrape.ou}`
  );
  await p.close();
}

/* ==================================================================
 * §3 — CE QUE LE RELEVÉ DE CHROME DIT VRAIMENT
 * ==================================================================
 * Le propriétaire demande pourquoi « la pile reste bloquée à 3 » et
 * pourquoi « le départ n'est précédé d'AUCUN retour enregistré ». Les
 * deux se mesurent, et ni l'un ni l'autre n'est une anomalie : ce sont
 * les signatures d'un retour qui CHANGE DE DOCUMENT.
 */
titre("§3 — pile bloquée et popstate absent : les deux se mesurent");
{
  const p = await ctx.newPage();
  await p.goto("about:blank");
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);

  //  a) UN RETOUR NE FAIT JAMAIS RÉTRÉCIR LA PILE.
  await p.evaluate(() => history.pushState({}, "", "/?essai=1"));
  const haut = await p.evaluate(() => history.length);
  await p.evaluate(
    () =>
      new Promise((ok) => {
        addEventListener("popstate", () => ok(), { once: true });
        history.back();
      })
  );
  const bas = await p.evaluate(() => history.length);
  verif(
    "a) un retour NE FAIT PAS rétrécir `history.length`",
    bas === haut,
    `${haut} → ${bas} · « la pile bloquée à 3 » ne dit donc rien du geste`
  );

  //  b) UN RETOUR DANS LE MÊME DOCUMENT : popstate, jamais pagehide.
  const memeDocument = await p.evaluate(
    () =>
      new Promise((ok) => {
        const vus = [];
        const surP = () => vus.push("popstate");
        const surH = () => vus.push("pagehide");
        addEventListener("popstate", surP);
        addEventListener("pagehide", surH);
        history.pushState({}, "", "/?essai=2");
        history.back();
        setTimeout(() => {
          removeEventListener("popstate", surP);
          removeEventListener("pagehide", surH);
          ok(vus);
        }, 800);
      })
  );
  verif(
    "b) retour DANS LE MÊME document : `popstate`, et aucun `pagehide`",
    memeDocument.includes("popstate") && !memeDocument.includes("pagehide"),
    `relevé : [${memeDocument.join(", ")}]`
  );
  await p.close();
}
{
  //  c) UN RETOUR QUI CHANGE DE DOCUMENT : pagehide, jamais popstate.
  const q = await ctx.newPage();
  await q.addInitScript(() => {
    const pousser = (quoi) => {
      const l = JSON.parse(sessionStorage.getItem("__temoins") ?? "[]");
      l.push(quoi);
      sessionStorage.setItem("__temoins", JSON.stringify(l));
    };
    addEventListener("popstate", () => pousser("popstate"));
    addEventListener("pagehide", () => pousser("pagehide"));
  });
  await q.goto("about:blank");
  await q.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await q.waitForTimeout(2000);
  await q.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });
  await q.waitForTimeout(1500);
  await q.evaluate(() => sessionStorage.setItem("__temoins", "[]"));
  await q.goBack({ waitUntil: "networkidle" });
  await q.waitForTimeout(2500);
  const temoins = await q.evaluate(() =>
    JSON.parse(sessionStorage.getItem("__temoins") ?? "[]")
  );
  verif(
    "c) retour QUI CHANGE DE DOCUMENT : `pagehide`, et AUCUN `popstate`",
    temoins.includes("pagehide") && !temoins.includes("popstate"),
    `relevé : [${temoins.join(", ")}] · c'est la signature du relevé de Chrome`
  );
  await q.close();
}

/* ==================================================================
 * §4 — AUCUNE SONDE N'EST TOUCHÉE
 * ==================================================================
 * Consigne du propriétaire : `?sonde-historique=1` et `?sonde-retour=1`
 * doivent fonctionner À L'IDENTIQUE. Aucun de leurs fichiers n'est
 * modifié par cette passe, et le voyant n'en demande aucun : le journal
 * de l'historique NOMME déjà l'auteur de chaque entrée d'après la
 * marque de son état, et l'étape du filet porte `retourReconstruit`.
 * Une ligne « POSÉE · RetourGaranti » y suffit.
 */
titre("§4 — les sondes ne sont pas touchées, et le voyant existe déjà");

verif(
  "le journal nomme `RetourGaranti` d'après la marque de son état",
  /marques\.retourReconstruit\) return "RetourGaranti"/.test(
    lire("src/lib/journal-historique.ts")
  ),
  "aucun ajout n'est nécessaire pour lire le voyant"
);

/*  ⚠️ DÉSARMÉES, LES SONDES NE COÛTENT TOUJOURS RIEN — et le relevé du
    bas, lui, n'est PAS une sonde : c'est une écriture du site, une
    seule par onglet, sans laquelle le filet ne peut pas décider. */
{
  const p = await ctx.newPage();
  //  ⚠️ ON DÉSARME D'ABORD : l'armement de la sonde du §4 est DURABLE
  //  depuis la nº 343 (mémoire locale), il survit à l'onglet.
  await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await p.evaluate(() => localStorage.removeItem("roswel:sondes-armees"));
  await p.goto("about:blank");
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  const propre = await p.evaluate(() => ({
    marque: document.documentElement.dataset.sondes ?? "(aucune)",
    bas: sessionStorage.getItem("roswel:bas-de-la-pile"),
  }));
  verif(
    "sondes désarmées : aucune marque, et le relevé du bas tient en une ligne",
    propre.marque === "(aucune)" &&
      typeof propre.bas === "string" &&
      propre.bas.length < 60,
    `relevé : ${propre.bas}`
  );
  await p.close();
}

await nav.close();
dehors.close();
process.exit(bilan());
