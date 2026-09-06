//  ██ BANC 877 — LE WEB APRÈS LES RETOURS DE LA nº 877 ██
//  Six sujets, tous au WEB (le doigt ne change pas, et le banc le
//  vérifie là où c'est utile) :
//   §1 — LES CARTES DE RECHERCHE ET DE « MA SÉLECTION » sont rendues à
//        leur état d'AVANT la nº 876 : aucun en-tête ni pied de fil ne
//        s'y montre, le nom et la ville vivent SOUS la photo, et « Ma
//        sélection » garde sa ligne de styles et son fanion. (Les
//        pixels, eux, sont gardés par les bancs 841, 842, 843, 845,
//        856, 862 et 865, rendus à leur écriture d'avant la nº 876 :
//        ici on éprouve la STRUCTURE, là-bas les nombres.)
//   §2 — LES CARTES DE GALERIE (Portfolio, Flash) n'ont plus de pied au
//        web ; au doigt, il est intact.
//   §3 — CLIQUER LA PHOTO D'UNE CARTE la met dans l'affiche (colonne de
//        gauche), AU RANG REGARDÉ.
//   §4 — LES COMMANDES DE LA GRANDE PHOTO : signaler et les vues à
//        gauche (au survol seulement), les points au centre, le fanion
//        puis le partage à droite ; les points centrés sur la ligne des
//        icônes ; hors survol, il ne reste que les trois permanents.
//   §5 — LE TITRE d'une carte de galerie s'aligne sur le bord GAUCHE de
//        la carte, le COMPTEUR sur le bord DROIT de l'image.
//   §6 — LES FLÈCHES DU CLAVIER font défiler la carte survolée.
//  L'ATELIER attendu est celui de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc877-${T}`;
const PHOTO = (k, i) => `4977${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [
    { ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 877", styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` },
  ]);
  //  DEUX GALERIES DE LONGUEURS DIFFÉRENTES : le compteur de l'affiche
  //  dit alors laquelle est montée (« N/6 » ou « N/4 »).
  const photos = [];
  for (const [k, style, n] of [[0, "blackwork", 6], [1, "realisme", 4]]) {
    for (let i = 1; i <= n; i += 1) {
      photos.push({ id: PHOTO(k, i), tatoueur_id: SLUG, style, rendu: "black", nature: "tatouage",
        url: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/${style}-${(i % 3) + 1}.svg`,
        ordre: i, cree_le: "2026-01-01T00:00:00Z" });
    }
  }
  await ranger("photos_tatoueur", photos);
}
const U = { id: "30000000-0000-4000-8000-000000000877", email: "banc-877@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
await ranger("favoris_photos", [{ utilisateur_id: U.id, photo_id: PHOTO(0, 1), cree_le: "2026-02-01T00:00:00Z" }]);

const LISTE = "/search?style=blackwork&nature=tatouage";
const PORTFOLIO = `/artist/${SLUG}/portfolio`;
const attendre = (page, ms) => page.waitForTimeout(ms);
const proche = (a, b, marge = 0.5) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;
/** La boîte d'un nœud, ou null s'il ne se voit pas. */
const BOITE = `(n) => { if (!n || n.getClientRects().length === 0) return null; const r = n.getBoundingClientRect();
  return { y: +r.top.toFixed(2), bas: +r.bottom.toFixed(2), g: +r.left.toFixed(2), d: +r.right.toFixed(2), h: +r.height.toFixed(2), l: +r.width.toFixed(2) }; }`;

//  ══ 1 · LES CARTES DU WEB, RENDUES À L'ÉTAT D'AVANT LA nº 876 ═══════
{
  const { nav, page } = await ouvrir("web", { session: U });
  try {
    titre("877 · §1 — web : la carte de recherche est celle du bâti 875");
    await page.goto(`${BASE}${LISTE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 2000);
    const v = await page.evaluate((Bs) => {
      const B = new Function("return " + Bs)();
      const c = document.querySelector("[data-carte]");
      const vu = (n) => Boolean(n) && n.getClientRects().length > 0;
      const lien = c.querySelector("[data-lien-carte]");
      return {
        tete: vu(c.querySelector("[data-en-tete-de-fil]")),
        pied: vu(c.querySelector("[data-pied-de-fil]")),
        cadreDuFil: vu(c.querySelector("[data-cadre-de-fil]")),
        photo: B(lien?.querySelector("img")?.closest("div")),
        nom: (() => { const h = c.querySelector("h3"); return vu(h) ? { texte: h.textContent.trim(), boite: B(h) } : null; })(),
        sousTitre: (() => { const p = [...c.querySelectorAll("[data-lien-carte] p")].filter(vu).pop(); return p ? { texte: p.textContent.trim(), boite: B(p) } : null; })(),
        badge: vu([...c.querySelectorAll("[data-badge-type]")].find(vu)),
        piste: c.querySelectorAll("[data-piste-de-carte]").length,
        colonnes: getComputedStyle(document.querySelector("[data-grille-tatoueurs]")).gridTemplateColumns.split(" ").length,
      };
    }, BOITE);
    verif("aucun en-tête ni pied de fil ne se montre sur la carte du web",
      v.tete === false && v.pied === false && v.cadreDuFil === false,
      `en-tête ${v.tete} · pied ${v.pied} · cadre du fil ${v.cadreDuFil}`);
    verif("le NOM et la VILLE sont SOUS la photo (le bloc de la nº 852-§8)",
      v.nom && v.sousTitre && v.photo && v.nom.boite.y >= v.photo.bas - 0.5 && v.sousTitre.boite.y >= v.nom.boite.y,
      `photo →${v.photo?.bas} · nom ${v.nom?.boite.y} « ${v.nom?.texte} » · sous-titre ${v.sousTitre?.boite.y} « ${v.sousTitre?.texte} »`);
    verif("le badge du type est là, et la piste de la nº 839 aussi", v.badge === true && v.piste === 1,
      `badge ${v.badge} · ${v.piste} piste(s)`);
    verif("la grille garde ses colonnes (quatre à 1440 px)", v.colonnes === 4, `${v.colonnes} colonne(s)`);

    titre("877 · §1 — web : la carte de « Ma sélection » est celle du bâti 875");
    await page.goto(`${BASE}/my-favorites`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 2000);
    const f = await page.evaluate((Bs) => {
      const B = new Function("return " + Bs)();
      const c = document.querySelector("[data-carte]");
      const vu = (n) => Boolean(n) && n.getClientRects().length > 0;
      const ligne = [...c.querySelectorAll("p")].find((p) => vu(p) && p.textContent.includes("•"));
      const enveloppe = c.querySelector("[data-fanion-de-ligne]");
      return {
        tete: vu(c.querySelector("[data-en-tete-de-fil]")),
        pied: vu(c.querySelector("[data-pied-de-fil]")),
        ligne: ligne ? { texte: ligne.textContent.trim(), boite: B(ligne) } : null,
        fanionSurLaLigne: vu(enveloppe?.querySelector("button[aria-pressed]")),
        fanionFlottant: vu(c.querySelector("[data-fanion-flottant] button[aria-pressed]")),
        nom: vu(c.querySelector("h3")),
      };
    }, BOITE);
    verif("aucun en-tête ni pied de fil sur la carte des favoris",
      f.tete === false && f.pied === false, `en-tête ${f.tete} · pied ${f.pied}`);
    verif("la ligne « Blackwork • … » est gardée, avec SON fanion sur la ligne (nº 862-§1)",
      f.ligne !== null && /•/.test(f.ligne.texte) && f.fanionSurLaLigne === true && f.fanionFlottant === false,
      `« ${f.ligne?.texte} » · fanion de ligne ${f.fanionSurLaLigne} · flottant ${f.fanionFlottant}`);
    verif("… et le nom vit sous la photo, comme au bâti 875", f.nom === true, String(f.nom));
  } catch (e) {
    verif("déroulement du banc 877 (§1)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LES CARTES DE GALERIE : LE PIED, AU DOIGT SEULEMENT ════════
for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`877 · §2 — ${mode} : le pied d'une carte de galerie`);
    await page.goto(`${BASE}${PORTFOLIO}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 2000);
    const v = await page.evaluate(() => {
      const vu = (n) => Boolean(n) && n.getClientRects().length > 0;
      const cartes = [...document.querySelectorAll("[data-carte-de-galerie]")];
      return {
        cartes: cartes.length,
        pieds: cartes.filter((c) => vu(c.querySelector("[data-pied-de-fil]"))).length,
        fanions: cartes.filter((c) => vu(c.querySelector("button[aria-pressed]"))).length,
        points: cartes.filter((c) => vu(c.querySelector("button[aria-label^='View photo ']"))).length,
      };
    });
    if (mode === "web") {
      verif("au web, AUCUNE carte n'a de pied — ni fanion, ni points, ni partage",
        v.cartes === 2 && v.pieds === 0 && v.fanions === 0 && v.points === 0,
        `${v.cartes} carte(s) · ${v.pieds} pied(s) · ${v.fanions} fanion(s) · ${v.points} point(s)`);
    } else {
      verif("au doigt, CHAQUE carte garde son pied, son fanion et ses points",
        v.cartes === 2 && v.pieds === 2 && v.fanions === 2 && v.points === 2,
        `${v.cartes} carte(s) · ${v.pieds} pied(s) · ${v.fanions} fanion(s) · ${v.points} point(s)`);
    }
  } catch (e) {
    verif(`déroulement du banc 877 (§2 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · CLIQUER LA PHOTO D'UNE CARTE LA MET DANS L'AFFICHE ═════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("877 · §3 — web : un clic sur la photo d'une carte la montre en grand");
    await page.goto(`${BASE}${PORTFOLIO}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 2000);
    /*  L'AFFICHE DIT CE QU'ELLE MONTRE PAR SON COMPTEUR (« N/6 » sur la
        galerie de six, « N/4 » sur celle de quatre) : le nombre de
        droite nomme la série, celui de gauche le rang. */
    const affiche = () => page.evaluate(() =>
      document.querySelector('[data-carrousel] [data-role="compteur"]')?.textContent.trim() ?? null);
    const auDepart = await affiche();
    verif("au départ, l'affiche montre la première galerie (« 1/6 »)", auDepart === "1/6", String(auDepart));
    //  LA SECONDE CARTE (realisme, quatre photos) : sa première photo.
    await page.locator("[data-carte-de-galerie='1'] [data-photo-vers-affiche]").click();
    await attendre(page, 1200);
    const apresClic = await affiche();
    verif("un clic sur la seconde carte : l'affiche passe à sa galerie (« 1/4 »)",
      apresClic === "1/4", String(apresClic));
    //  ET LE RANG SUIT LA PHOTO REGARDÉE : un chevron, puis un clic.
    const carte = page.locator("[data-carte-de-galerie='1']");
    await carte.hover({ position: { x: 200, y: 200 } });
    await attendre(page, 400);
    await carte.locator("[data-fleche-de-carte='droite']").click();
    await attendre(page, 700);
    verif("le chevron a fait glisser la carte (« 2/4 » sur sa ligne de titre)",
      (await carte.locator("[data-compteur-galerie]").textContent()).trim() === "2/4",
      (await carte.locator("[data-compteur-galerie]").textContent()).trim());
    await carte.locator("[data-photo-vers-affiche]").click();
    await attendre(page, 1200);
    const apresRang = await affiche();
    verif("le clic emporte LE RANG REGARDÉ : l'affiche s'ouvre sur « 2/4 »",
      apresRang === "2/4", String(apresRang));
    //  LE CHEVRON, LUI, N'OUVRE RIEN : il est au-dessus du bouton.
    await carte.locator("[data-fleche-de-carte='gauche']").click();
    await attendre(page, 900);
    verif("un chevron ne change PAS l'affiche (il est au-dessus du bouton)",
      (await affiche()) === "2/4" && (await carte.locator("[data-compteur-galerie]").textContent()).trim() === "1/4",
      `affiche ${await affiche()} · carte ${(await carte.locator("[data-compteur-galerie]").textContent()).trim()}`);
  } catch (e) {
    verif("déroulement du banc 877 (§3)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 bis · AU DOIGT, RIEN NE SE PASSE (nº 873-§3) ═════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("877 · §3 — doigt : toucher une photo ne fait toujours rien");
    await page.goto(`${BASE}${PORTFOLIO}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 2000);
    const avant = await page.evaluate(() => location.pathname + location.search + " " + Math.round(scrollY));
    const boutons = await page.locator("[data-photo-vers-affiche]:visible").count();
    await page.locator("[data-carte-de-galerie='0'] [data-cadre-de-galerie]").tap();
    await attendre(page, 1200);
    const apres = await page.evaluate(() => location.pathname + location.search + " " + Math.round(scrollY));
    verif("aucun bouton de photo au doigt, et le toucher ne déplace rien",
      boutons === 0 && avant === apres, `${boutons} bouton(s) · ${avant} → ${apres}`);
  } catch (e) {
    verif("déroulement du banc 877 (§3 doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LES COMMANDES DE LA GRANDE PHOTO ═══════════════════════════
{
  const { nav, page } = await ouvrir("web", { session: U });
  try {
    titre("877 · §4 — web : la rangée de commandes de l'affiche");
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-commandes-affiche]", { timeout: 20000 });
    await attendre(page, 2000);
    const RELEVE = `(Bs) => {
      const B = new Function("return " + Bs)();
      const rangee = document.querySelector("[data-commandes-affiche]");
      const photo = document.querySelector("[data-carrousel]");
      const vu = (n) => Boolean(n) && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== "hidden";
      const gauche = rangee.querySelector("[data-commandes-au-survol]");
      const signaler = gauche?.querySelector("button");
      const vues = rangee.querySelector("[data-vues-de-fil]");
      const points = [...rangee.querySelectorAll("button[aria-label^='View photo ']")];
      const fanion = rangee.querySelector("button[aria-pressed]");
      const partage = [...rangee.querySelectorAll("button")].find((b) => /^Share /.test(b.getAttribute("aria-label") ?? ""));
      const milieu = (b) => b ? (b.g + b.d) / 2 : null;
      const centreY = (b) => b ? (b.y + b.bas) / 2 : null;
      return {
        rangee: B(rangee), photo: B(photo),
        signalerVu: vu(signaler), vuesVu: vu(vues), pointsVus: points.filter(vu).length,
        fanionVu: vu(fanion), partageVu: vu(partage),
        signaler: B(signaler), vues: B(vues), fanion: B(fanion), partage: B(partage),
        pointsBoite: (() => { const bs = points.map(B).filter(Boolean); if (!bs.length) return null;
          return { g: Math.min(...bs.map((b) => b.g)), d: Math.max(...bs.map((b) => b.d)), y: Math.min(...bs.map((b) => b.y)), bas: Math.max(...bs.map((b) => b.bas)) }; })(),
        /*  LA FRISE SE MESURE SUR SA BOÎTE, pas sur ses ronds : le cadre
            à coupe (PointsDuCarrousel) fait N crans de large, chaque
            cran portant SON écart à droite — la suite des ronds est donc
            un peu plus courte que la boîte, et décalée à gauche d'un
            demi-écart. C'est la boîte qui est centrée, et c'est elle
            qu'on compare. (Pas d'accent grave dans cette chaîne : elle
            EST un gabarit de chaîne.) */
        milieuPoints: (() => { const cadre = points[0]?.parentElement?.parentElement; const b = B(cadre);
          return b ? (b.g + b.d) / 2 : null; })(),
        centrePoints: (() => { const bs = points.map(B).filter(Boolean); if (!bs.length) return null;
          return (Math.min(...bs.map((b) => b.y)) + Math.max(...bs.map((b) => b.bas))) / 2; })(),
        milieuPhoto: milieu(B(photo)), centreFanion: centreY(B(fanion)),
      };
    }`;
    const lireRangee = () => page.evaluate(([R, Bs]) => new Function("return " + R)()(Bs), [RELEVE, BOITE]);
    //  ── AU REPOS : le curseur est ailleurs sur la page.
    await page.mouse.move(1300, 60);
    await attendre(page, 500);
    const repos = await lireRangee();
    verif("hors survol : les POINTS, le FANION et le PARTAGE se voient",
      repos.pointsVus > 0 && repos.fanionVu && repos.partageVu,
      `points ${repos.pointsVus} · fanion ${repos.fanionVu} · partage ${repos.partageVu}`);
    verif("… et SIGNALER comme les VUES sont éteints",
      repos.signalerVu === false && repos.vuesVu === false,
      `signaler ${repos.signalerVu} · vues ${repos.vuesVu}`);
    //  ── AU SURVOL DE LA PHOTO.
    await page.locator("[data-carrousel]").first().hover({ position: { x: 300, y: 300 } });
    await attendre(page, 500);
    const survol = await lireRangee();
    verif("au survol de la photo : SIGNALER et les VUES apparaissent",
      survol.signalerVu === true && survol.vuesVu === true,
      `signaler ${survol.signalerVu} · vues ${survol.vuesVu}`);
    verif("L'ORDRE DEMANDÉ : signaler, les vues, les points, le fanion, le partage",
      survol.signaler.d <= survol.vues.g + 0.5 && survol.vues.d < survol.pointsBoite.g &&
      survol.pointsBoite.d < survol.fanion.g && survol.fanion.d <= survol.partage.g + 0.5,
      `signaler ${survol.signaler.g}→${survol.signaler.d} · vues ${survol.vues.g}→${survol.vues.d} · points ${survol.pointsBoite.g}→${survol.pointsBoite.d} · fanion ${survol.fanion.g}→${survol.fanion.d} · partage ${survol.partage.g}→${survol.partage.d}`);
    verif("le PARTAGE est bien À DROITE du fanion", survol.partage.g >= survol.fanion.d - 0.5,
      `fanion →${survol.fanion.d} · partage ${survol.partage.g}→`);
    verif("les POINTS sont centrés sur la largeur de la photo",
      proche(survol.milieuPoints, survol.milieuPhoto, 1),
      `points ${survol.milieuPoints} · photo ${survol.milieuPhoto}`);
    verif("… ET SUR LA LIGNE DES ICÔNES : même centre vertical que le fanion (le « trop bas » corrigé)",
      proche(survol.centrePoints, survol.centreFanion, 1),
      `points ${survol.centrePoints} · fanion ${survol.centreFanion}`);
    verif("la rangée est posée à douze pixels du bas de la photo",
      proche(survol.photo.bas - survol.rangee.bas, 12, 0.5),
      String(survol.photo.bas - survol.rangee.bas));
  } catch (e) {
    verif("déroulement du banc 877 (§4)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 bis · AU DOIGT, LA PHOTO DE LA PAGE N'A RIEN SUR ELLE ════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("877 · §4 — doigt : rien n'est posé sur la photo, le pied reste sous elle");
    /*  ⚠️ LA VUE PHOTO, ET NON LE PROFIL : au doigt, une arrivée par lien
        CACHE la photo de tête (`photoCacheeAuDoigt`, FicheTatoueur) — la
        photo en grand et son pied ne vivent que dans la vue photo d'un
        lien partagé (nº 862-§3), et c'est là qu'il faut aller voir. */
    await page.goto(`${BASE}/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO(0, 2)}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-pied-de-fil]", { timeout: 20000 });
    await attendre(page, 2000);
    const v = await page.evaluate(() => {
      const vu = (n) => Boolean(n) && n.getClientRects().length > 0;
      return {
        rangeeSurLaPhoto: vu(document.querySelector("[data-commandes-affiche]")),
        pied: vu(document.querySelector("[data-pied-de-fil]")),
        points: document.querySelectorAll("[data-pied-de-fil] button[aria-label^='View photo ']").length,
      };
    });
    verif("la rangée de commandes ne se montre pas au doigt, et le pied du fil est là",
      v.rangeeSurLaPhoto === false && v.pied === true && v.points > 0,
      `rangée ${v.rangeeSurLaPhoto} · pied ${v.pied} · ${v.points} point(s)`);
  } catch (e) {
    verif("déroulement du banc 877 (§4 doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · LE TITRE ET LE COMPTEUR D'UNE CARTE DE GALERIE ═════════════
for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`877 · §5 — ${mode} : le titre au bord gauche, le compteur au bord droit de l'image`);
    await page.goto(`${BASE}${PORTFOLIO}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 2000);
    const v = await page.evaluate((Bs) => {
      const B = new Function("return " + Bs)();
      const c = document.querySelector("[data-carte-de-galerie]");
      return {
        carte: B(c), cadre: B(c.querySelector("[data-cadre-de-galerie]")),
        titre: B(c.querySelector("[data-titre-galerie]")),
        compteur: B(c.querySelector("[data-compteur-galerie]")),
        texte: c.querySelector("[data-compteur-galerie]")?.textContent.trim(),
      };
    }, BOITE);
    if (mode === "web") {
      verif("le titre commence au BORD GAUCHE de la carte (plus de seize pixels)",
        proche(v.titre.g, v.carte.g, 0.5), `titre ${v.titre.g} · carte ${v.carte.g}`);
      verif("le compteur finit au BORD DROIT de l'image",
        proche(v.compteur.d, v.cadre.d, 0.5), `compteur ${v.compteur.d} · image ${v.cadre.d}`);
    } else {
      //  AU DOIGT, RIEN NE BOUGE : l'image saigne jusqu'aux bords de
      //  l'écran, le titre garde les seize pixels des marges de page.
      verif("au doigt, le titre garde ses seize pixels de marge",
        proche(v.titre.g, v.cadre.g + 16, 0.5), `titre ${v.titre.g} · image ${v.cadre.g}`);
      verif("… et le compteur les siens, à droite",
        proche(v.compteur.d, v.cadre.d - 16, 0.5), `compteur ${v.compteur.d} · image ${v.cadre.d}`);
    }
    verif(`le compteur dit « 1/6 » (${mode})`, v.texte === "1/6", String(v.texte));
  } catch (e) {
    verif(`déroulement du banc 877 (§5 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 6 · LES FLÈCHES DU CLAVIER SUR LA CARTE SURVOLÉE ═══════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("877 · §6 — web : ← → font défiler la carte de galerie survolée");
    await page.goto(`${BASE}${PORTFOLIO}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await attendre(page, 2000);
    const compteur = () => page.locator("[data-carte-de-galerie='0'] [data-compteur-galerie]").textContent();
    //  ── SANS SURVOL : la page garde son comportement.
    await page.mouse.move(1300, 60);
    await attendre(page, 300);
    await page.keyboard.press("ArrowRight");
    await attendre(page, 600);
    verif("sans survol, rien ne bouge", (await compteur()).trim() === "1/6", (await compteur()).trim());
    //  ── SURVOLÉE : un pas, puis un pas en arrière.
    await page.locator("[data-carte-de-galerie='0']").hover({ position: { x: 200, y: 200 } });
    await attendre(page, 400);
    await page.keyboard.press("ArrowRight");
    await attendre(page, 700);
    verif("→ fait glisser la carte survolée (« 2/6 »)", (await compteur()).trim() === "2/6", (await compteur()).trim());
    await page.keyboard.press("ArrowRight");
    await attendre(page, 700);
    verif("… et encore (« 3/6 »)", (await compteur()).trim() === "3/6", (await compteur()).trim());
    await page.keyboard.press("ArrowLeft");
    await attendre(page, 700);
    verif("← revient d'un pas (« 2/6 »)", (await compteur()).trim() === "2/6", (await compteur()).trim());
    //  ── ET L'AUTRE CARTE N'A PAS BOUGÉ.
    verif("la carte NON survolée n'a pas bougé",
      (await page.locator("[data-carte-de-galerie='1'] [data-compteur-galerie]").textContent()).trim() === "1/4",
      (await page.locator("[data-carte-de-galerie='1'] [data-compteur-galerie]").textContent()).trim());
  } catch (e) {
    verif("déroulement du banc 877 (§6)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
