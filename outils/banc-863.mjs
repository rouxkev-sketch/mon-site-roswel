//  ██ BANC 863 — VA-ET-VIENT, AIR, VUE PHOTO DEPUIS LE PORTFOLIO, RÉGRESSION ██
//  ==================================================================
//  Les cinq points de la passe, au doigt :
//   1. LE VA-ET-VIENT DE L'ACCUEIL porte deux TITRES entiers — « Explore
//      tattoo styles » (goutte), « Explore flash styles » (éclair) —,
//      actifs ou non, jamais abrégés ni coupés ; colonnes égales.
//   2. L'AIR SOUS LE VA-ET-VIENT passe à SEIZE pixels (accueil, « Ma
//      sélection »), et le squelette le promet.
//   3. LE FIL DE LA GALERIE — REPRIS PAR LA nº 873-§3 : la page Portfolio
//      du doigt EST le fil ; la carte porte le titre et le sous-titre de
//      la galerie au-dessus de l'image, le pied du fil dessous, pas de
//      ligne sous le pied, la pastille « 1/11 ».
//   4. DEPUIS UN LIEN PARTAGÉ, la vue de la nº 862 ne change pas.
//   5. ⛔ (nº 873) LA MÉMOIRE DE LA BANDE DU PROFIL (8/11 → ouvrir → retour
//      → 8/11) n'a plus d'objet : il n'y a plus de bande au doigt, ni de
//      vue photo à ouvrir depuis elle.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const TATTOO = "Tattoo styles", FLASH = "Flash styles";
const AIR = 16;
const SLUG = `banc863-${Date.now()}`;
const PHOTO = (i) => `4800000${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 863", styles: ["blackwork"], ville_slug: `lyon-${SLUG}` });
  await ranger("photos_tatoueur", Array.from({ length: 11 }, (_, k) => k + 1).map((i) => ({
    id: PHOTO(i), tatoueur_id: SLUG, style: "blackwork", rendu: "black", nature: "tatouage",
    url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
    ordre: i, cree_le: "2026-01-01T00:00:00Z",
  })));
}
const U = { id: "30000000-0000-4000-8000-000000000863", email: "banc-863@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
await ranger("favoris_photos", [1, 2, 3, 4].map((i) => ({ utilisateur_id: U.id, photo_id: PHOTO(i), cree_le: `2026-01-01T00:00:0${i}Z` })));

//  LA SONDE DU VA-ET-VIENT ET DE L'AIR — les deux liens, leurs titres,
//  le nombre de LIGNES du titre (par les rectangles du texte), la ligne
//  grise, l'air, le premier contenu.
const SONDE_VV = `() => {
  const B = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), h: +x.height.toFixed(1), l: Math.round(x.width) }; };
  //  L'accueil porte une balise nav (deux liens, nº 860), « Ma sélection »
  //  un groupe de boutons : le même composant, deux natures (banc 859).
  const nav = document.querySelector("[data-rangee-moteur] nav, [data-rangee-moteur] [role='radiogroup']");
  const barre = document.querySelector("[data-barre-fixe]");
  const reserve = document.querySelector("[data-reserve-barre]");
  const liens = nav ? [...nav.querySelectorAll("a[href]")].map((a) => {
    const t = a.querySelector("span span"); const r = document.createRange(); r.selectNodeContents(t);
    const s = getComputedStyle(t);
    return { href: a.getAttribute("href"), nom: a.getAttribute("aria-label"), texte: t.textContent.trim(),
      courant: a.getAttribute("aria-current"), dessin: Boolean(a.querySelector("svg")),
      lignes: new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size,
      coupe: s.textOverflow === "ellipsis" || s.whiteSpace === "nowrap", ...B(a) };
  }) : [];
  const boite = nav ? [...nav.children].find((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3) : null;
  const air = document.querySelector("[data-air-sous-barre]");
  const main = document.querySelector("main");
  const contenu = main ? [...main.children].find((n) => n.getBoundingClientRect().height > 0 && !n.hasAttribute("data-air-sous-barre")) : null;
  return { grille: B(nav), liens, ligne: B(boite?.querySelector("span:first-child")),
    barre: B(barre), reserve: B(reserve),
    air: air ? +air.getBoundingClientRect().height.toFixed(1) : null, contenu: B(contenu) };
}`;
const sonderVV = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE_VV);

//  ══ 1 · LES DEUX TITRES ENTIERS ═════════════════════════════════════
for (const largeur of [390, 360]) {
  const { nav, page } = await ouvrir("doigt");
  try {
    await page.setViewportSize({ width: largeur, height: 844 });
    titre(`863 · §1 — l'accueil à ${largeur} px : deux titres entiers, icône devant`);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const v = await sonderVV(page);
    const [tattoo, flash] = v.liens;
    verif("les deux positions disent leur titre ENTIER, actives ou non",
      tattoo?.texte === TATTOO && flash?.texte === FLASH, `« ${tattoo?.texte} » · « ${flash?.texte} »`);
    verif("chacune porte son icône devant le titre", tattoo?.dessin && flash?.dessin);
    verif("l'active est Tattoo (page « / »), l'inactive mène à « /flash »",
      tattoo?.courant === "page" && flash?.courant === null && flash?.href === "/flash", `${tattoo?.courant} · ${flash?.href}`);
    verif("aucun titre n'est coupé ni abrégé : ni points de suspension, ni interdiction de retour à la ligne",
      !tattoo?.coupe && !flash?.coupe);
    verif("les colonnes sont ÉGALES (le mot court et ses 88 px sont partis)",
      tattoo?.l === flash?.l && tattoo?.l > 88, `${tattoo?.l} · ${flash?.l}`);
    /*  CE QUE LA MESURE DIT, ET QUE LE COMPTE RENDU DIT AUSSI : au corps
        de la charte, chaque titre demande 195 px avec son icône ; la
        colonne en offre 179 à 390 px, 164 à 360. Les titres passent
        donc SUR DEUX LIGNES — entiers, jamais abrégés (la consigne). Le
        banc note le nombre de lignes et la hauteur de l'onglet, sans
        exiger l'une ou l'autre : c'est l'arbitrage du propriétaire. */
    verif(`relevé : titres sur ${tattoo?.lignes} ligne(s), onglet de ${tattoo?.h} px, colonne de ${tattoo?.l} px`,
      typeof tattoo?.lignes === "number" && tattoo.lignes >= 1, "");
    /*  ET LA BARRE NE GRANDIT PAS : un titre sur deux lignes tient dans
        l'onglet de 43 (interligne de vingt), le va-et-vient garde ses
        46, et la barre s'arrête sur la réserve que la page lui garde
        (116) — sans quoi la ligne descendrait sous la réserve et le
        contenu ne serait plus à seize d'elle. */
    verif("… et l'onglet garde ses 43 px, le va-et-vient ses 46 : la barre s'arrête sur sa réserve",
      tattoo?.h === 43 && v.grille?.h === 46 && v.barre && v.reserve && v.barre.bas === v.reserve.bas,
      `onglet ${tattoo?.h} · va-et-vient ${v.grille?.h} · barre ${v.barre?.bas} · réserve ${v.reserve?.bas}`);
    verif("le nom accessible de chaque position est son titre", tattoo?.nom === TATTOO && flash?.nom === FLASH);
  } catch (e) {
    verif(`déroulement du banc 863 (§1, ${largeur})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · L'AIR DE SEIZE, ET LE SQUELETTE QUI LE PROMET ═══════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    for (const [nom, url] of [["l'accueil", `${BASE}/`], ["« Ma sélection »", `${BASE}/my-favorites`]]) {
      titre(`863 · §2 — ${nom} : seize pixels sous la ligne`);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1400);
      const v = await sonderVV(page);
      verif("le bloc d'air fait seize pixels", v.air === AIR, `${v.air} px`);
      verif("et le premier contenu commence seize pixels sous la ligne",
        v.ligne && v.contenu && Math.round(v.contenu.y - v.ligne.bas) === AIR,
        `${v.ligne && v.contenu ? Math.round(v.contenu.y - v.ligne.bas) : "?"} px`);
    }
    titre("863 · §2 — le squelette de « Ma sélection » promet les mêmes seize pixels");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    let gris = null;
    await page.locator('a[href*="my-favorites"]').first().click({ force: true });
    for (let i = 0; i < 600 && !gris; i += 1) {
      gris = await page.evaluate(() => {
        if (!document.querySelector('[aria-busy="true"]')) return null;
        if (document.querySelector("[data-carte]")) return null;
        const grille = document.querySelector("[data-squelette-cartes]");
        const air = grille?.previousElementSibling;
        if (!air) return null;
        return { air: parseFloat(getComputedStyle(air).paddingTop) };
      }).catch(() => null);
      if (!gris) await page.waitForTimeout(3);
    }
    verif("le squelette a bien été attrapé", gris !== null, gris ? JSON.stringify(gris) : "jamais vu");
    verif("… et son air vaut seize", gris?.air === AIR, `${gris?.air}`);
  } catch (e) {
    verif("déroulement du banc 863 (§2)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  LA SONDE D'UNE CARTE DU FIL (résultats ou fil de galerie) : l'en-tête,
//  l'image, le pied, les icônes — les mêmes lectures que le banc 862.
const SONDE_CARTE = `(racine) => {
  const B = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), g: +x.left.toFixed(1), d: +x.right.toFixed(1), h: +x.height.toFixed(1) }; };
  const r = document.querySelector(racine);
  if (!r) return { absent: true };
  const pied = r.querySelector("[data-pied-de-fil]");
  const cadre = r.querySelector("[data-cadre-de-galerie], [data-cadre-de-fil]");
  const ecriture = (n) => { if (!n) return null; const s = getComputedStyle(n);
    return { texte: n.textContent.trim(), corps: s.fontSize, graisse: s.fontWeight, couleur: s.color, casse: s.textTransform }; };
  return {
    surtitre: ecriture(r.querySelector("[data-surtitre-galerie]")), titre: ecriture(r.querySelector("[data-titre-galerie]")),
    titreBoite: B(r.querySelector("[data-titre-galerie]")),
    cadre: B(cadre), pied: B(pied),
    cadreAPied: cadre && pied ? +(B(pied).y - B(cadre).bas).toFixed(1) : null,
    icones: pied ? [...pied.querySelectorAll("button")].map((b) => ({
      role: /Report/.test(b.getAttribute("aria-label") ?? "") ? "signaler" : /Save this photo|Remove this photo/.test(b.getAttribute("aria-label") ?? "") ? "fanion"
        : /Share/.test(b.getAttribute("aria-label") ?? "") ? "partage" : "point",
      g: Math.round(b.getBoundingClientRect().left), h: Math.round(b.getBoundingClientRect().height) })) : [],
    vues: B(pied?.querySelector("[data-vues-de-fil]")),
  };
}`;
const sonderCarte = (page, racine) => page.evaluate(([S, r]) => new Function("return " + S)()(r), [SONDE_CARTE, racine]);
//  ══ 3 · LA PAGE PORTFOLIO DU DOIGT EST LE FIL DE LA GALERIE (nº 873) ═══
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("863 · §3 — l'étalon : une carte du fil des résultats");
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    const etalon = await sonderCarte(page, "[data-carte]");
    verif("l'étalon est lisible (image, pied)", !etalon.absent && etalon.pied && etalon.cadre);

    titre("863 · §3 (repris par la nº 873) — la page Portfolio : le fil de la galerie, son titre, son pied");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const fil = await page.evaluate(() => {
      const visible = (n) => Boolean(n) && n.getClientRects().length > 0;
      return { url: location.pathname, fil: getComputedStyle(document.querySelector("[data-fil-de-galerie]")).display,
        cartes: document.querySelectorAll("[data-carte-de-galerie]").length, y: Math.round(scrollY),
        enTeteFil: visible(document.querySelector("[data-habillage-photo]")), ligneSousLePied: visible(document.querySelector("[data-titre-carrousel]")),
        photoDeTete: visible(document.querySelector("[data-photo-fiche]")), bandes: [...document.querySelectorAll('[data-galeries="doigt"] [data-galerie-serie]')].filter(visible).length,
        lecture: getComputedStyle(document.querySelector("[data-colonne-lecture]")).display, vuePhoto: Boolean(document.querySelector("[data-vue-photo]")),
        //  nº 873 — le pied de la vue photo est rendu (et caché) dans la
        //  colonne de la photo : on ne compte que les pieds qui se voient.
        piedsDeFil: [...document.querySelectorAll("[data-pied-de-fil]")].filter(visible).length,
        pastille: [...document.querySelectorAll("[data-carte-de-galerie] [data-cadre-de-galerie] *")].map((e) => e.textContent.trim()).find((t) => /^\d+\/\d+$/.test(t)) ?? null };
    });
    verif("la page Portfolio est le fil de galeries, avec UNE carte — une par galerie, et la fiche n'en a qu'une (nº 866/873)",
      fil.url === `/artist/${SLUG}/portfolio` && fil.fil !== "none" && fil.cartes === 1, `${fil.url} · ${fil.fil} · ${fil.cartes} carte(s)`);
    verif("la carte s'ouvre sur sa première photo (« 1/11 »), la page en haut", fil.pastille === "1/11" && fil.y === 0, `${fil.pastille} · page à ${fil.y}`);
    verif("ni en-tête avatar / badge, ni ligne « Blackwork • Black » sous le pied, ni photo de tête, ni bande par style",
      !fil.enTeteFil && !fil.ligneSousLePied && !fil.photoDeTete && fil.bandes === 0, `en-tête ${fil.enTeteFil} · ligne ${fil.ligneSousLePied} · photo ${fil.photoDeTete} · bandes ${fil.bandes}`);
    verif("ce n'est pas une vue photo : la colonne de lecture est affichée", !fil.vuePhoto && fil.lecture !== "none");
    verif("la carte porte son pied (un seul pied)", fil.piedsDeFil === 1, String(fil.piedsDeFil));

    const carte = await sonderCarte(page, "[data-carte-de-galerie]");
    verif("au-dessus de l'image : le TITRE et le SOUS-TITRE de la galerie",
      carte.surtitre?.texte === "Tattoos" && carte.titre?.texte === "Blackwork • Black", `« ${carte.surtitre?.texte} » / « ${carte.titre?.texte} »`);
    //  nº 873-§3 — plus d'avatar : le titre à seize du bord.
    verif("… dans la boîte de l'en-tête du fil : à seize du bord, douze au-dessus de l'image",
      carte.titreBoite && Math.round(carte.titreBoite.g) === 16 && carte.cadre && Math.round(carte.cadre.y - carte.titreBoite.bas) === 12,
      `gauche ${carte.titreBoite?.g} · titre→image ${carte.cadre && carte.titreBoite ? Math.round(carte.cadre.y - carte.titreBoite.bas) : "?"}`);
    verif("l'image : pleine largeur, le format de la carte du fil",
      carte.cadre && carte.cadre.g === 0 && carte.cadre.d === 390 && carte.cadre.h === etalon.cadre.h, `${carte.cadre?.h} · étalon ${etalon.cadre?.h}`);
    verif("sous l'image : le pied du fil, soudé à l'image, MESURÉ IDENTIQUE à celui d'une carte des résultats",
      carte.cadreAPied === 0 && carte.pied?.h === etalon.pied?.h
        && JSON.stringify(carte.icones.filter((i) => i.role !== "point")) === JSON.stringify(etalon.icones.filter((i) => i.role !== "point")),
      `pied ${carte.pied?.h} (${JSON.stringify(carte.icones)}) — étalon ${etalon.pied?.h} (${JSON.stringify(etalon.icones.filter((i) => i.role !== "point"))})`);
    verif("… avec ses points : la carte glisse entre ses onze photos (nº 866)", carte.icones.some((i) => i.role === "point"));
    verif("… et les vues sont là", carte.vues !== null && carte.vues.h === 40, JSON.stringify(carte.vues));
  } catch (e) {
    verif("déroulement du banc 863 (§3)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · DEPUIS UN LIEN PARTAGÉ, LA VUE DE LA nº 862 NE CHANGE PAS ══════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("863 · §4 — un lien partagé ouvre la vue photo de la nº 862, inchangée");
    await page.goto(`${BASE}/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO(8)}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const v = await page.evaluate(() => ({
      enTete: Boolean(document.querySelector("[data-habillage-photo] [data-en-tete-de-fil]")),
      pieds: document.querySelectorAll("[data-pied-de-fil]").length,
      ligne: document.querySelector("[data-titre-carrousel]")?.textContent.trim() ?? null,
      fil: Boolean(document.querySelector("[data-fil-de-galerie]")),
      photo: getComputedStyle(document.querySelector("[data-photo-fiche]")).display,
      compteur: document.querySelector("[data-photo-fiche] [data-role='compteur']")?.textContent ?? null,
    }));
    verif("l'en-tête avatar / nom / badge est là, au-dessus de l'image", v.enTete);
    verif("un seul pied, sous l'image, et la photo de tête montrée", v.pieds === 1 && v.photo !== "none", `${v.pieds} pied(s) · photo ${v.photo}`);
    verif("la ligne « Blackwork • Black » est sous le pied", v.ligne === "Blackwork • Black", String(v.ligne));
    verif("aucun fil de galerie : la consigne n'est pas dans l'adresse", v.fil === false);
    verif("le carrousel s'ouvre sur la photo demandée (8/11)", v.compteur === "8/11", String(v.compteur));
  } catch (e) {
    verif("déroulement du banc 863 (§4)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
