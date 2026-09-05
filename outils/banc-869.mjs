//  ██ BANC 869 — L'EN-TÊTE DU PROFIL : CE QUI TIENT DEPUIS LA nº 869 ██
//  ==================================================================
//   1. LES BADGES SANS ICÔNE : plus aucun dessin en tête des lignes de
//      styles et de techniques ; texte seul, contour, gris — et les
//      capsules commencent au bord de la liste.
//   2. LE VA-ET-VIENT seul sur sa rangée, toute la largeur, le mot
//      centré, sans icône — TROIS LIENS depuis la nº 873 (Profile ·
//      Portfolio · Flash), chacun un tiers.
//   3. L'ORDRE : bloc du nom, rangée d'actions, bio, styles, techniques,
//      adresse.
//   4. FOLLOW ET UNFOLLOW NE TOUCHENT PLUS À L'HISTOIRE (l'acquis de la
//      nº 868, éprouvé ici depuis la rangée) : depuis trois pages
//      d'origine, en navigation douce ET en navigation de document,
//      l'appui ne pose aucun cran et le retour rend LA PAGE D'ORIGINE.
//   5. UNE FICHE DE DÉMONSTRATION n'a pas de « Follow ».
//  ⛔ CE QUI A DÉMÉNAGÉ AU BANC 870, parce que la nº 870 l'a refait :
//  le DESSIN de la rangée (trois badges au lieu de quatre carrés), la
//  ligne du BOOKING (le calendrier et son texte, plus de point), la
//  ligne du SITE (sous la bio) et les DEUX AIRS de la rangée. Ce
//  banc-ci ne mesure plus que ce qui n'a pas bougé.
//  Web ET doigt. L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { readFileSync } from "node:fs";
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const GABARIT = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
//  Les jetons de la charte sombre (config/tatouage, COULEURS_SOMBRE).
const GRIS = "rgb(168, 168, 176)";   // texteDoux  #A8A8B0
const CONTOUR = "rgb(62, 70, 80)";   // haut       #3E4650

const U = { id: "30000000-0000-4000-8000-000000000869", email: "banc-869@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});

const T = Date.now();
const photos = (id, prefixe, n) => ranger("photos_tatoueur", Array.from({ length: n }, (_, k) => k + 1).map((i) => ({
  id: `${prefixe}${i}00-0000-4000-8000-${String(i).padStart(12, "0")}`, tatoueur_id: id, style: "blackwork",
  rendu: ["black", "black_and_grey", "color"][(i - 1) % 3], nature: "tatouage",
  url: `/images-demo/tatouage/blackwork-${((i - 1) % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${((i - 1) % 3) + 1}.svg`,
  ordre: i, cree_le: "2026-01-01T00:00:00Z" })));

//  LE PROFIL PRO COMPLET : salon, booking ouvert, Instagram, site, bio,
//  cinq styles, des techniques — et des photos pour paraître dans les
//  résultats (la navigation douce du §6 part de là).
const ID = `28000000-0000-4000-8000-${T.toString(16).padStart(12, "0")}`;
const SLUG = `banc869-${T}`;
await ranger("tatoueurs", { ...GABARIT, id: ID, slug: SLUG, nom: "Banc 869", type_fiche: "salon", etablissement: "Salon 869",
  styles: ["blackwork", "realisme", "trash-polka", "neo-japonais", "old-school"], ville_slug: `lyon-${SLUG}`,
  bio: "La fiche complète du banc 869.", site_web: "https://exemple.test/869", titre_site_web: "Mon site à moi",
  lien_instagram: "https://instagram.com/banc869", dm_instagram: true, booking: "ouvert", booking_mois: null,
  filtres_technique: ["machine"], filtres_composition: ["small"], filtres_besoins: ["couvrir"] });
await photos(ID, "8690", 2);
//  LE PROFIL NU : artiste, booking à délai, ni Instagram ni site.
const IDN = `28100000-0000-4000-8000-${(T + 1).toString(16).padStart(12, "0")}`;
const SLUGN = `banc869-nu-${T}`;
await ranger("tatoueurs", { ...GABARIT, id: IDN, slug: SLUGN, nom: "Banc 869 nu", type_fiche: "artiste", etablissement: null,
  styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUGN}`, bio: "La fiche nue du banc 869.", site_web: null, titre_site_web: null,
  lien_instagram: null, dm_instagram: false, booking: "delai", booking_mois: 3 });
await photos(IDN, "8691", 1);
//  DEUX FICHES POUR LES DEUX AUTRES ÉTATS : fermé, et rien de déclaré.
const IDF = `28200000-0000-4000-8000-${(T + 2).toString(16).padStart(12, "0")}`;
const SLUGF = `banc869-ferme-${T}`;
await ranger("tatoueurs", { ...GABARIT, id: IDF, slug: SLUGF, nom: "Banc 869 fermé", styles: ["blackwork"], ville_slug: `lyon-${SLUGF}`,
  booking: "ferme", booking_mois: null });
await photos(IDF, "8692", 1);
const IDS = `28300000-0000-4000-8000-${(T + 3).toString(16).padStart(12, "0")}`;
const SLUGS = `banc869-sans-${T}`;
await ranger("tatoueurs", { ...GABARIT, id: IDS, slug: SLUGS, nom: "Banc 869 sans", styles: ["blackwork"], ville_slug: `lyon-${SLUGS}`,
  booking: null, booking_mois: null });
await photos(IDS, "8693", 1);

//  LA LECTURE D'UN PROFIL — tout ce que les six sujets mesurent.
const LIRE = `() => {
  const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { x: +r.left.toFixed(1), y: +r.top.toFixed(1), d: +r.right.toFixed(1), bas: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const centreTexte = (n) => { const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); return +((b.left + b.right) / 2).toFixed(1); };
  const h1 = document.querySelector("h1");
  const colonne = h1?.parentElement;
  const avatar = colonne?.previousElementSibling;
  const type = colonne?.querySelector("p");
  const etat = document.querySelector("[data-booking-fiche]");
  const point = etat?.querySelector("span");
  const rangee = document.querySelector("[data-rangee-actions]");
  const actions = rangee ? [...rangee.querySelectorAll("[data-action-fiche]")].map((a) => {
    const carre = a.firstElementChild; const mot = a.lastElementChild; const s = getComputedStyle(carre);
    return { cle: a.dataset.actionFiche, balise: a.tagName, href: a.getAttribute("href"), cible: a.getAttribute("target"),
      aria: a.getAttribute("aria-label"), presse: a.getAttribute("aria-pressed"), sansCran: a.hasAttribute("data-sans-cran"),
      carre: { ...B(carre), fond: s.backgroundColor, trait: s.borderTopWidth, couleurTrait: s.borderTopColor, rayon: s.borderTopLeftRadius },
      icone: carre.querySelector("svg") ? B(carre.querySelector("svg")).w : null,
      mot: mot.textContent.trim().replace(/Follow(ing)?FollowFollowing$/, (m) => m.startsWith("Following") ? "Following" : "Follow"),
      centreMot: centreTexte(mot), motY: B(mot).y, couleurMot: getComputedStyle(mot).color, largeur: B(a.closest("[data-rangee-actions] > *")).w }; }) : null;
  //  nº 873 — trois liens dans une navigation, plus un groupe de boutons.
  const groupe = document.querySelector('nav[aria-label="Profile, portfolio or flash"]');
  const onglets = groupe ? [...groupe.querySelectorAll("a")].map((b) => ({ mot: b.textContent.trim(), ...B(b), centre: +((B(b).x + B(b).d) / 2).toFixed(1), centreMot: centreTexte(b), svg: b.querySelectorAll("svg").length })) : null;
  const rangeeDuHaut = groupe?.parentElement;
  const ligne = (m) => { const n = document.querySelector("[" + m + "]"); if (!n) return null;
    const capsule = [...n.querySelectorAll("span")].find((e) => e.className.includes("px-2.5")); const s = capsule ? getComputedStyle(capsule) : null;
    return { ...B(n), svg: n.querySelectorAll("svg").length, capsuleX: capsule ? B(capsule).x : null,
      couleur: s?.color ?? null, fond: s?.backgroundColor ?? null, trait: s?.borderTopWidth ?? null, couleurTrait: s?.borderTopColor ?? null }; };
  const bio = [...document.querySelectorAll("p")].find((p) => /banc 869/i.test(p.textContent) && /fiche/.test(p.textContent));
  const adresse = [...document.querySelectorAll("a, p, span")].reverse().find((n) => /Lyon/.test(n.textContent) && n.children.length === 0);
  //  Les liens DE LA FICHE (le pied de page porte l'Instagram du site :
  //  il n'est pas dans le compte).
  const liensHorsRangee = [...document.querySelectorAll("a")].filter((a) => /instagram\\.com\\/banc869|exemple\\.test/.test(a.href) && !a.closest("[data-rangee-actions]")).length;
  return { h1: B(h1), avatar: B(avatar), type: type ? { ...B(type), mot: type.textContent.trim() } : null,
    etat: etat ? { ...B(etat), mot: etat.textContent.trim(), valeur: etat.dataset.bookingFiche, svg: etat.querySelectorAll("svg").length,
      point: point ? { ...B(point), fond: getComputedStyle(point).backgroundColor } : null, couleur: getComputedStyle(etat).color } : null,
    rangee: B(rangee), actions, groupe: B(groupe), onglets,
    rangeeDuHaut: rangeeDuHaut ? { actions: rangeeDuHaut.querySelectorAll("[data-action-fiche]").length,
      boutons: [...rangeeDuHaut.querySelectorAll("button")].filter((b) => /^(Follow|Unfollow|Share)/.test(b.getAttribute("aria-label") ?? "")).length,
      largeurContenu: rangeeDuHaut.clientWidth - parseFloat(getComputedStyle(rangeeDuHaut).paddingLeft) - parseFloat(getComputedStyle(rangeeDuHaut).paddingRight) } : null,
    styles: ligne("data-styles-fiche"), pratiques: ligne("data-pratique-fiche"), bio: B(bio), adresse: B(adresse), liensHorsRangee,
    texteAttente: /month wait|Books open · |DM • Instagram/.test(document.body.innerText) }; }`;
const lireProfil = (page) => page.evaluate(new Function("return " + LIRE)());
const proche = (a, b, marge = 1.5) => a !== null && b !== null && Math.abs(a - b) <= marge;

//  ══ 1 À 5 · LE PROFIL COMPLET, AUX DEUX APPAREILS ═══════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`869 · §1-§5 — le profil pro complet au ${mode}`);
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const v = await lireProfil(page);
    //  §1
    verif("§1 — aucune icône en tête des lignes de styles et de techniques",
      v.styles && v.pratiques && v.styles.svg === 0 && v.pratiques.svg === 0, `${v.styles?.svg} · ${v.pratiques?.svg}`);
    verif("§1 — les capsules commencent au bord gauche de la liste (plus de colonne de 22 px)",
      proche(v.styles?.capsuleX, v.styles?.x, 1) && proche(v.pratiques?.capsuleX, v.pratiques?.x, 1), `${v.styles?.capsuleX} / ${v.styles?.x}`);
    verif("§1 — texte gris, contour fin, aucun fond (les acquis 867/868 tiennent)",
      v.styles?.couleur === GRIS && v.styles?.trait === "1px" && v.styles?.couleurTrait === CONTOUR && v.styles?.fond === "rgba(0, 0, 0, 0)",
      JSON.stringify({ couleur: v.styles?.couleur, trait: v.styles?.trait, couleurTrait: v.styles?.couleurTrait, fond: v.styles?.fond }));
    //  §2 ET §3 — LE BOOKING, LES BADGES ET LE SITE SONT AU BANC 870
    //  (la nº 870 les a refaits ; les mesurer ici ferait deux vérités).
    //  §4
    verif("§4 — le va-et-vient est seul sur sa rangée : ni Follow ni Share à côté",
      v.rangeeDuHaut && v.rangeeDuHaut.actions === 0 && v.rangeeDuHaut.boutons === 0, JSON.stringify(v.rangeeDuHaut));
    verif("§4 — il prend toute la largeur, chaque onglet un tiers (nº 873 : trois liens)",
      v.groupe && v.onglets?.length === 3 && proche(v.groupe.w, v.rangeeDuHaut?.largeurContenu, 2) && v.onglets.every((o) => proche(o.w, v.groupe.w / 3)),
      JSON.stringify({ groupe: v.groupe?.w, onglets: v.onglets?.map((o) => o.w), contenu: v.rangeeDuHaut?.largeurContenu }));
    verif("§4 — le mot centré dans son onglet, sans icône",
      v.onglets?.every((o) => proche(o.centreMot, o.centre) && o.svg === 0) && JSON.stringify(v.onglets?.map((o) => o.mot)) === JSON.stringify(["Profile", "Portfolio", "Flash"]),
      JSON.stringify(v.onglets?.map((o) => [o.mot, o.centreMot, o.centre, o.svg])));
    //  §5
    verif("§5 — l'ordre : bloc du nom, rangée d'actions, bio, styles, techniques, adresse",
      v.h1 && v.rangee && v.bio && v.styles && v.pratiques && v.adresse &&
      v.h1.y < v.rangee.y && v.rangee.bas <= v.bio.y && v.bio.bas <= v.styles.y && v.styles.bas <= v.pratiques.y && v.pratiques.bas <= v.adresse.y,
      JSON.stringify({ nom: v.h1?.y, rangee: v.rangee?.y, bio: v.bio?.y, styles: v.styles?.y, techniques: v.pratiques?.y, adresse: v.adresse?.y }));
    //  ⛔ LES DEUX AIRS DE LA RANGÉE SONT AU BANC 870 (la nº 870-§5 les
    //  a repris : 40 au-dessus, l'air d'un bloc en dessous).
  } catch (e) {
    verif(`déroulement du banc 869 (§1-§5 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ LE PROFIL NU, ET LES DEUX AUTRES ÉTATS ══════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`869 · le profil sans Instagram ni site au ${mode}`);
    await page.goto(`${BASE}/artist/${SLUGN}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const v = await lireProfil(page);
    const cles = v.actions?.map((a) => a.cle) ?? [];
    verif("la rangée n'a jamais une icône seule : Follow · Share",
      JSON.stringify(cles) === JSON.stringify(["follow", "share"]), cles.join(" · "));
    verif("§5 — sans adresse (un artiste) : bloc du nom, rangée, bio, styles",
      v.h1 && v.rangee && v.bio && v.styles && v.h1.y < v.rangee.y && v.rangee.bas <= v.bio.y && v.bio.bas <= v.styles.y,
      JSON.stringify({ nom: v.h1?.y, rangee: v.rangee?.y, bio: v.bio?.y, styles: v.styles?.y }));
  } catch (e) {
    verif(`déroulement du banc 869 (profil nu ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("869 · §5 — la fiche de démonstration (doigt)");
    //  Une fiche de DÉMONSTRATION n'a pas de « Follow » (BoutonSuivre) :
    //  sa rangée n'a que ses liens et Share. La démo de la doublure n'a
    //  ni Instagram ni site — on attend ce que sa ligne en base annonce.
    await page.goto(`${BASE}/artist/demo-blackwork-12?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
    await page.waitForTimeout(800);
    const d = await lireProfil(page);
    const attendues = [GABARIT.lien_instagram && "instagram", GABARIT.site_web && "website", "share"].filter(Boolean);
    verif("une fiche de démonstration : pas de Follow, ses liens puis Share",
      JSON.stringify(d.actions?.map((a) => a.cle)) === JSON.stringify(attendues), `${(d.actions ?? []).map((a) => a.cle).join(" · ")} (attendu ${attendues.join(" · ")})`);
    //  ET LES DÉMOS DU SITE, ELLES, ONT TOUTES INSTAGRAM (lu à la source,
    //  lib/tatoueurs-demo) : aucune rangée de démo n'a Share seul.
    const source = readFileSync(new URL("../src/lib/tatoueurs-demo.ts", import.meta.url), "utf8");
    const demos = (source.match(/^\s*slug: "/gm) ?? []).length;
    const avecInstagram = (source.match(/lien_instagram: "/g) ?? []).length;
    verif("les démos du site ont toutes un Instagram : jamais Share seul dans leur rangée", demos > 0 && avecInstagram === demos, `${avecInstagram} / ${demos}`);
  } catch (e) {
    verif("déroulement du banc 869 (§2 états)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 6 · FOLLOW DEPUIS LA RANGÉE : L'ÉTAT EN BASE, LE RETOUR ═════════
{
  const etat = (page) => page.evaluate(() => ({ url: location.pathname + location.search, len: history.length, cran: Boolean((history.state ?? {}).retourReconstruit) }));
  const ORIGINE = "/search?style=blackwork&nature=tatouage";
  const LIEN = `[data-carte] [data-lien-profil-de-fil][href*="${SLUG}"]`;
  for (const enDocument of [true, false]) {
    for (const suiviAuDepart of [false, true]) {
      await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
      if (suiviAuDepart) await ranger("tatoueurs_suivis", [{ utilisateur_id: U.id, tatoueur_id: ID, cree_le: "2026-01-01T00:00:00Z" }]);
      const { nav, page } = await ouvrir("doigt", { session: U });
      try {
        const geste = suiviAuDepart ? "Unfollow" : "Follow";
        titre(`869 · §6 — ${geste} depuis la rangée, arrivée ${enDocument ? "EN DOCUMENT" : "en navigation douce"}`);
        await page.goto(`${BASE}${ORIGINE}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1500);
        if (enDocument) await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
        else {
          await page.locator(LIEN).first().scrollIntoViewIfNeeded({ timeout: 20000 });
          await page.waitForTimeout(400);
          await page.locator(LIEN).first().tap();
        }
        await page.waitForFunction(() => /\/artist\//.test(location.pathname), null, { timeout: 15000 });
        await page.waitForTimeout(1800);
        const avant = await lireProfil(page);
        const suivre = avant.actions?.find((a) => a.cle === "follow");
        verif(`au départ : « ${suiviAuDepart ? "Following" : "Follow"} »`,
          suivre && suivre.mot === (suiviAuDepart ? "Following" : "Follow") && suivre.presse === String(suiviAuDepart),
          JSON.stringify(suivre && { mot: suivre.mot, presse: suivre.presse }));
        const surLeProfil = await etat(page);
        await page.locator('[data-rangee-actions] [data-action-fiche="follow"]').tap();
        await page.waitForTimeout(1800);
        const apres = await lireProfil(page);
        const bascule = apres.actions?.find((a) => a.cle === "follow");
        verif(`l'appui bascule : « ${suiviAuDepart ? "Follow" : "Following"} »`,
          bascule && bascule.mot === (suiviAuDepart ? "Follow" : "Following") && bascule.presse === String(!suiviAuDepart),
          JSON.stringify(bascule && { mot: bascule.mot, presse: bascule.presse }));
        const enBase = await lire("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
        verif("EN BASE : l'état suit le geste", suiviAuDepart ? enBase.length === 0 : (enBase.length === 1 && enBase[0].tatoueur_id === ID), JSON.stringify(enBase));
        const pile = await etat(page);
        verif("aucune entrée d'historique, aucun cran (nº 868)", pile.len === surLeProfil.len && pile.cran === false && pile.url === surLeProfil.url, `pile ${surLeProfil.len} → ${pile.len} · cran ${pile.cran}`);
        await page.goBack();
        await page.waitForTimeout(2500);
        const retour = await etat(page);
        verif("LE RETOUR REND LA PAGE D'AVANT", retour.url === ORIGINE, `${retour.url} (attendu ${ORIGINE})`);
      } catch (e) {
        verif(`déroulement du banc 869 (§6 ${enDocument ? "document" : "douce"} ${suiviAuDepart})`, false, String(e).slice(0, 400));
      } finally { await nav.close(); }
    }
  }
}

process.exit(bilan());
