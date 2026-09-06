//  ██ BANC 876 — WEB : LES CARTES PRENNENT LA STRUCTURE DU MOBILE ██
//  ==================================================================
//   1. MA SÉLECTION > Portfolios : du plus récemment suivi au plus
//      ancien — suivre A puis B, B en tête (web et doigt) ; l'ordre
//      inverse rend A en tête. La publication ne décide plus rien.
//   2. LES PLAQUES D'UN PROFIL : le type « Independent » en premier, le
//      reste de l'ordre inchangé (web et doigt).
//   3. WEB — Portfolio et Flash d'un profil : plus de bandes par style ;
//      les cartes de galerie du mobile, une par rangée, pleine largeur :
//      titre à gauche, compteur à droite, chevrons de la nº 839 au
//      survol, pied dessous ; une galerie à une photo sans compteur ni
//      points ; la gouttière est celle du fil.
//   4. WEB — la grille des résultats : chaque carte porte l'en-tête du
//      fil AU-DESSUS de la photo et son pied EN DESSOUS ; la ligne des
//      styles a disparu ; les colonnes restent ; les chevrons au survol
//      aussi. L'EN-TÊTE ET LE PIED SONT MESURÉS IDENTIQUES AU MOBILE.
//   5. WEB — Ma sélection > Favoris : l'en-tête au-dessus de la photo ;
//      sous la photo, « Old School • Color » et le fanion — gardés ; pas
//      de pied. Au doigt, la vignette ne change pas.
//   6. LES SQUELETTES DU WEB épousent les nouvelles cartes : aucun saut.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const T = Date.now();
const SLUG = `banc876-${T}`, INDEP = `banc876i-${T}`, SALON = `banc876s-${T}`;
const A = `banc876a-${T}`, B = `banc876b-${T}`;
const PHOTO = (k, i) => `4876${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
const photo = (id, slug, style, nature, i, creeLe = "2026-01-01T00:00:00Z") => ({
  id, tatoueur_id: slug, style, rendu: "black", nature,
  url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
  ordre: i, cree_le: creeLe,
});
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", [
    //  LA FICHE DES GALERIES : trois galeries de tattoos (6, 4 et 1 photo).
    { ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 876", styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}` },
    //  L'ARTISTE AUX DEUX PLAQUES (§2) : un salon ET « Independent ».
    { ...gabarit, id: INDEP, slug: INDEP, nom: "Banc 876 indep", type_fiche: "artiste", styles: ["blackwork"], ville_slug: `lyon-${INDEP}` },
    { ...gabarit, id: SALON, slug: SALON, nom: "Salon 876", type_fiche: "salon", etablissement: "Salon 876", mode_exercice: "salon", ville_slug: `lyon-${SALON}` },
    //  LES DEUX SUIVIS (§1) : A publie PLUS RÉCEMMENT que B — l'ancien
    //  ordre l'aurait mis en tête ; le nouvel ordre suit la DATE DU SUIVI.
    { ...gabarit, id: A, slug: A, nom: "Banc 876 A", styles: ["blackwork"], ville_slug: `lyon-${A}` },
    { ...gabarit, id: B, slug: B, nom: "Banc 876 B", styles: ["blackwork"], ville_slug: `lyon-${B}` },
  ]);
  const photos = [];
  for (let i = 1; i <= 6; i += 1) photos.push(photo(PHOTO(0, i), SLUG, "blackwork", "tatouage", i));
  for (let i = 1; i <= 4; i += 1) photos.push(photo(PHOTO(1, i), SLUG, "realisme", "tatouage", i));
  photos.push(photo(PHOTO(2, 1), SLUG, "trash-polka", "tatouage", 1));
  for (let i = 1; i <= 3; i += 1) photos.push(photo(PHOTO(3, i), INDEP, "blackwork", "tatouage", i));
  for (let i = 1; i <= 3; i += 1) photos.push(photo(PHOTO(4, i), A, "blackwork", "tatouage", i, "2026-03-01T00:00:00Z"));
  for (let i = 1; i <= 3; i += 1) photos.push(photo(PHOTO(5, i), B, "blackwork", "tatouage", i, "2026-01-01T00:00:00Z"));
  await ranger("photos_tatoueur", photos);
  //  ⚠️ CE QUE LA BASE EXIGE (contraintes rejouées par la doublure) : un
  //  mode salon porte un RÔLE ; `nature_lieu` vaut salon, prive ou null.
  const mode = (id, genre, salon) => ({ id, tatoueur_id: INDEP, genre, role: genre === "salon" ? "resident" : null, nature_lieu: genre === "salon" ? "salon" : null,
    salon_id: salon, nom_lieu: salon ? "Salon 876" : "Lyon", intitule: salon ? "Salon 876" : "Lyon", adresse: salon ? "12 Rue de la République" : null,
    code_postal: "69002", ville: "Lyon", region: "Auvergne-Rhône-Alpes", pays: "France", code_pays: "FR", latitude: 45.7625, longitude: 4.8352,
    lieu_id: null, debut_le: null, fin_le: null, statut: null, convention_id: null, rayon_km: null });
  await ranger("modes_exercice", [mode(`mode-s-${T}`, "salon", SALON), mode(`mode-i-${T}`, "independent", null)]);
}
const U = { id: "30000000-0000-4000-8000-000000000876", email: "banc-876@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
const suivre = async (ordre) => {
  await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
  await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
  await ranger("tatoueurs_suivis", ordre.map((id, i) => ({ utilisateur_id: U.id, tatoueur_id: id, cree_le: `2026-02-0${i + 1}T00:00:00Z` })));
  //  Un favori par suivi, pour que l'onglet Favoris ait des cartes (§5).
  await ranger("favoris_photos", [{ utilisateur_id: U.id, photo_id: PHOTO(4, 1), cree_le: "2026-02-01T00:00:00Z" },
    { utilisateur_id: U.id, photo_id: PHOTO(5, 1), cree_le: "2026-02-02T00:00:00Z" }]);
};
const attendre = (page, ms) => page.waitForTimeout(ms);
const proche = (a, b, marge = 0.5) => a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;
/** La boîte d'un nœud, ou null s'il n'est pas dans l'affichage. */
const BOITE = `(n) => { if (!n || n.getClientRects().length === 0) return null; const r = n.getBoundingClientRect();
  return { y: +r.top.toFixed(2), bas: +r.bottom.toFixed(2), g: +r.left.toFixed(2), d: +r.right.toFixed(2), h: +r.height.toFixed(2), l: +r.width.toFixed(2) }; }`;
/** L'EN-TÊTE ET LE PIED D'UNE CARTE, MESURÉS — ce que le banc compare
    entre le doigt et le web : les boîtes, le rond, le corps du nom et
    de la ville, le badge, les trois cibles du pied et le dessin des
    vues. Rien de ce qui dépend de la largeur de la colonne (les
    largeurs elles-mêmes) : l'appareil ne décide que des colonnes. */
const RELEVE_CARTE = `(carte, B) => {
  const tete = carte.querySelector("[data-en-tete-de-fil]");
  const pied = carte.querySelector("[data-pied-de-fil]");
  const police = (n) => n ? { corps: getComputedStyle(n).fontSize, graisse: getComputedStyle(n).fontWeight, couleur: getComputedStyle(n).color } : null;
  const avatar = tete?.querySelector("[data-lien-profil-de-fil] > span:first-child");
  const nom = tete?.querySelector("[data-lien-profil-de-fil] span span:first-child");
  const ville = tete?.querySelector("[data-lien-profil-de-fil] span span:last-child");
  const badge = [...(tete?.querySelectorAll("[data-badge-type]") ?? [])].find((n) => n.getClientRects().length > 0);
  const signaler = pied?.querySelector(":scope > div:first-child > *:first-child");
  const vues = pied?.querySelector("[data-vues-de-fil]");
  const droite = pied?.querySelector(":scope > div:last-child");
  const photoWeb = carte.querySelector("[data-lien-carte] > div > div");
  const photoDoigt = carte.querySelector("[data-cadre-de-fil]");
  const photo = [photoWeb, photoDoigt].map(B).find(Boolean) ?? null;
  return {
    tete: { boite: B(tete), h: B(tete)?.h, avatar: B(avatar), nom: police(nom), ville: police(ville), badgeH: B(badge)?.h, pb: tete ? getComputedStyle(tete).paddingBottom : null, gap: tete ? getComputedStyle(tete).columnGap : null },
    pied: { boite: B(pied), h: B(pied)?.h, signaler: B(signaler), vues: B(vues), vuesSvg: B(vues?.querySelector("svg")), droite: B(droite), boutonsDroite: [...(droite?.querySelectorAll("button") ?? [])].map(B), pt: pied ? getComputedStyle(pied).paddingTop : null },
    photo,
    lignesSousLaPhoto: [...carte.querySelectorAll("[data-lien-carte] p, [data-lien-carte] h3")].filter((n) => n.getClientRects().length > 0).map((n) => n.textContent.trim()),
    carte: B(carte),
  };
}`;
const releverCarte = (page, selecteur) => page.evaluate(([sel, R, Bs]) => {
  const carte = document.querySelector(sel);
  if (!carte) return null;
  return new Function("return " + R)()(carte, new Function("return " + Bs)());
}, [selecteur, RELEVE_CARTE, BOITE]);
/** Ce qui doit être IDENTIQUE entre le doigt et le web : tout sauf les
    largeurs (les colonnes), c'est-à-dire les hauteurs, les gabarits et
    les écritures. */
const memesRangees = (a, b) => {
  const ecarts = [];
  const cmp = (nom, x, y) => { if (JSON.stringify(x) !== JSON.stringify(y)) ecarts.push(`${nom}: ${JSON.stringify(x)} ≠ ${JSON.stringify(y)}`); };
  cmp("en-tête h", a.tete.h, b.tete.h); cmp("avatar h", a.tete.avatar?.h, b.tete.avatar?.h); cmp("avatar l", a.tete.avatar?.l, b.tete.avatar?.l);
  cmp("nom", a.tete.nom, b.tete.nom); cmp("ville", a.tete.ville, b.tete.ville); cmp("badge h", a.tete.badgeH, b.tete.badgeH);
  cmp("en-tête pb", a.tete.pb, b.tete.pb); cmp("en-tête gap", a.tete.gap, b.tete.gap);
  cmp("pied h", a.pied.h, b.pied.h); cmp("signaler h", a.pied.signaler?.h, b.pied.signaler?.h); cmp("vues svg h", a.pied.vuesSvg?.h, b.pied.vuesSvg?.h);
  cmp("boutons de droite", a.pied.boutonsDroite.map((x) => [x?.h, x?.l]), b.pied.boutonsDroite.map((x) => [x?.h, x?.l])); cmp("pied pt", a.pied.pt, b.pied.pt);
  return ecarts;
};
const LISTE = "/search?style=blackwork&nature=tatouage";

//  ══ 1 · L'ORDRE DES PORTFOLIOS SUIVIS ═══════════════════════════════
for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode, { session: U });
  try {
    titre(`876 · §1 — ${mode} : suivre A puis B → B en tête ; l'inverse → A en tête`);
    const ordreAffiche = async () => {
      await page.goto(`${BASE}/my-favorites?selection=suivis&_=${Date.now()}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-suivi]", { timeout: 20000 });
      await attendre(page, 800);
      return page.evaluate(() => [...document.querySelectorAll("[data-suivi]")].map((n) => n.dataset.suivi));
    };
    await suivre([A, B]);
    const apresAB = await ordreAffiche();
    verif("A suivi le 1er, B le 2 : B en tête, puis A", apresAB[0] === B && apresAB[1] === A, apresAB.join(" · "));
    await suivre([B, A]);
    const apresBA = await ordreAffiche();
    verif("B suivi le 1er, A le 2 : A en tête — c'est bien la date du suivi qui range (A publie plus récemment dans les deux cas)",
      apresBA[0] === A && apresBA[1] === B, apresBA.join(" · "));
  } catch (e) {
    verif(`déroulement du banc 876 (§1 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LES PLAQUES : « INDEPENDENT » EN PREMIER ═════════════════════
for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`876 · §2 — ${mode} : un artiste avec un salon et « Independent » : Independent en premier`);
    await page.goto(`${BASE}/artist/${INDEP}?entree=lien`, { waitUntil: "domcontentloaded" });
    await attendre(page, 2000);
    const mentions = await page.evaluate(() => [...document.querySelectorAll("li > p:first-child")]
      .filter((p) => p.getClientRects().length > 0)
      .map((p) => p.textContent.trim().toUpperCase())
      .filter((t) => /INDEPENDENT|TATTOO SHOP|SALON|RESIDENT|GUEST|STUDIO|CONVENTION/.test(t)));
    verif("deux plaques, la première « INDEPENDENT », la seconde le salon",
      mentions.length >= 2 && /INDEPENDENT/.test(mentions[0]) && !/INDEPENDENT/.test(mentions[1]), mentions.join(" | "));
  } catch (e) {
    verif(`déroulement du banc 876 (§2 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · WEB : LE PORTFOLIO D'UN PROFIL EST LE FIL DE GALERIES ═══════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("876 · §3 — web : plus de bandes, les cartes de galerie du mobile, une par rangée");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-fil-de-galerie]", { timeout: 20000 });
    await attendre(page, 2000);
    const v = await page.evaluate((Bs) => {
      const B = new Function("return " + Bs)();
      const fil = document.querySelector("[data-fil-de-galerie]");
      const colonne = document.querySelector("[data-colonne-lecture]");
      const cartes = [...fil.querySelectorAll("[data-carte-de-galerie]")];
      return {
        bandes: document.querySelectorAll('[data-galeries="web"], [data-galeries="doigt"]').length,
        filVisible: fil.getClientRects().length > 0,
        gouttiere: getComputedStyle(fil.querySelector("ul")).rowGap,
        //  La colonne de lecture porte `lg:px-3 lg:-mx-3` (FicheTatoueur) :
        //  douze pixels d'air de chaque côté, pour que sa coupe horizontale
        //  n'emporte pas les liserés. La « pleine largeur » est celle de
        //  son CONTENU : la boîte moins cet air.
        colonne: (() => { const b = B(colonne); const st = getComputedStyle(colonne); const pg = parseFloat(st.paddingLeft), pd = parseFloat(st.paddingRight);
          return b && { ...b, g: +(b.g + pg).toFixed(2), d: +(b.d - pd).toFixed(2), l: +(b.l - pg - pd).toFixed(2), air: [pg, pd] }; })(),
        cartes: cartes.map((c) => ({
          boite: B(c), titre: c.querySelector("[data-titre-galerie]")?.textContent.trim(), titreBoite: B(c.querySelector("[data-titre-galerie]")),
          compteur: c.querySelector("[data-compteur-galerie]")?.textContent.trim() ?? null, compteurBoite: B(c.querySelector("[data-compteur-galerie]")),
          cadre: B(c.querySelector("[data-cadre-de-galerie]")), pied: B(c.querySelector("[data-pied-de-fil]")),
          points: c.querySelectorAll("[data-pied-de-fil] button[aria-label*='hoto' i], [data-pied-de-fil] [data-point]").length,
          pistes: c.querySelectorAll("[data-piste-de-carte]").length, pistesVisibles: [...c.querySelectorAll("[data-piste-de-carte]")].filter((n) => n.getClientRects().length > 0).length,
          //  ⚠️ `not-mobile:block` CONTIENT « mobile:block » : on cherche la
          //  classe ENTIÈRE, en début de chaîne ou après un blanc.
          carrouselVisible: [...c.querySelectorAll("[data-cadre-de-galerie] > div")].some((n) => /(^|\s)mobile:block(\s|$)/.test(n.className) && n.getClientRects().length > 0),
        })),
      };
    }, BOITE);
    verif("aucune bande par style dans le document", v.bandes === 0, `${v.bandes} bande(s)`);
    verif("le fil de galeries est affiché au web, trois cartes", v.filVisible && v.cartes.length === 3, `${v.cartes.length} carte(s)`);
    verif("chaque carte est PLEINE LARGEUR dans les marges (la largeur de la colonne de lecture)",
      v.cartes.every((c) => proche(c.boite.l, v.colonne.l, 1) && proche(c.boite.g, v.colonne.g, 1)), JSON.stringify(v.cartes.map((c) => [c.boite.g, c.boite.l])) + ` colonne (contenu) ${v.colonne.g}/${v.colonne.l}, air ${JSON.stringify(v.colonne.air)}`);
    verif("le titre en haut à gauche, le compteur « 1/6 » en haut à droite, sur la même ligne",
      v.cartes[0].compteur === "1/6" && proche(v.cartes[0].titreBoite.g, v.cartes[0].boite.g + 16, 1) && proche(v.cartes[0].compteurBoite.d, v.cartes[0].boite.d - 16, 1) && v.cartes[0].compteurBoite.y < v.cartes[0].cadre.y,
      `${v.cartes[0].compteur} · titre g ${v.cartes[0].titreBoite.g} · compteur d ${v.cartes[0].compteurBoite.d} · carte ${v.cartes[0].boite.g}→${v.cartes[0].boite.d}`);
    verif("le pied est sous la photo, sur chaque carte", v.cartes.every((c) => c.pied && c.pied.y >= c.cadre.bas - 0.5), JSON.stringify(v.cartes.map((c) => [c.cadre?.bas, c.pied?.y])));
    verif("au web, c'est la PISTE de la nº 839 qui se montre, pas le carrousel du doigt",
      v.cartes[0].pistesVisibles === 1 && !v.cartes[0].carrouselVisible, `pistes visibles ${v.cartes[0].pistesVisibles}, carrousel visible ${v.cartes[0].carrouselVisible}`);
    verif("la galerie à UNE photo n'a ni compteur ni piste", v.cartes[2].compteur === null && v.cartes[2].pistes === 0, `${v.cartes[2].compteur} · ${v.cartes[2].pistes} piste(s)`);
    verif("la gouttière entre deux cartes est celle du fil : 24 px", v.gouttiere === "24px", v.gouttiere);
    verif("… et les cartes se suivent de ces 24 px", proche(v.cartes[1].boite.y - v.cartes[0].boite.bas, 24, 0.5), String(v.cartes[1].boite.y - v.cartes[0].boite.bas));

    titre("876 · §3 — web : les chevrons de la nº 839 au survol, et ils font glisser");
    const carte = page.locator("[data-carte-de-galerie='0']");
    await carte.hover({ position: { x: 200, y: 200 } });
    await attendre(page, 500);
    const droite = carte.locator("[data-fleche-de-carte='droite']");
    verif("au survol, le chevron de droite se montre (pas de gauche : on est au début)",
      (await droite.isVisible()) && !(await carte.locator("[data-fleche-de-carte='gauche']").isVisible()));
    verif("aucune pastille dans la photo (le compteur est sur la ligne du titre)", (await carte.locator("[data-compteur-de-carte]").count()) === 0);
    await droite.click();
    await attendre(page, 700);
    const apres = await page.evaluate(() => {
      const c = document.querySelector("[data-carte-de-galerie='0']");
      const cases = [...c.querySelectorAll("[data-case-de-carte]")];
      return { compteur: c.querySelector("[data-compteur-galerie]")?.textContent.trim(), cases: cases.length,
        montree: cases.findIndex((n) => Math.abs(n.getBoundingClientRect().left - c.querySelector("[data-cadre-de-galerie]").getBoundingClientRect().left) < 1),
        gauche: Boolean(c.querySelector("[data-fleche-de-carte='gauche']")) };
    });
    verif("un pas : le compteur dit 2/6, la deuxième photo est dans l'encadré, le chevron de gauche apparaît",
      apres.compteur === "2/6" && apres.montree === 1 && apres.gauche, JSON.stringify(apres));
    //  LES POINTS DU PIED POSENT UN RANG, au web aussi (§4).
    //  ⚠️ LE PIED A D'AUTRES BOUTONS (signaler, partage, fanion) : on vise
    //  LE ROND par son libellé (`View photo N of M`, PointsDuCarrousel).
    const points = carte.locator("[data-pied-de-fil] button[aria-label^='View photo ']");
    const nb = await points.count();
    if (nb >= 4) {
      await carte.locator("[data-pied-de-fil] button[aria-label^='View photo 4 of ']").click();
      await attendre(page, 700);
      const compteur = await carte.locator("[data-compteur-galerie]").textContent();
      verif("un point du pied posé : la galerie y saute (4/6)", compteur.trim() === "4/6", compteur.trim());
    } else {
      verif("les points du pied sont là", false, `${nb} bouton(s) dans le pied`);
    }
    //  LA PAGE FLASH suit la même écriture : sans flash, l'écran vide.
    await page.goto(`${BASE}/artist/${SLUG}/flash`, { waitUntil: "domcontentloaded" });
    await attendre(page, 1500);
    verif("la page Flash sans flash montre l'écran vide, et aucune bande", await page.evaluate(() => Boolean(document.querySelector("[data-page-vide]")) && document.querySelectorAll("[data-galeries]").length === 0));
  } catch (e) {
    verif("déroulement du banc 876 (§3)", false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

//  ══ 4 · WEB : LA GRILLE DES RÉSULTATS ══════════════════════════════
let releveDoigt = null, releveWeb = null;
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("876 · §4 — doigt : la carte du fil ne change pas (en-tête, photo, pied)");
    await page.goto(`${BASE}${LISTE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 2000);
    releveDoigt = await releverCarte(page, "[data-carte]");
    verif("en-tête au-dessus de la photo, pied en dessous", releveDoigt.tete.boite && releveDoigt.pied.boite && releveDoigt.tete.boite.bas <= releveDoigt.photo.y + 0.5 && releveDoigt.pied.boite.y >= releveDoigt.photo.bas - 0.5,
      JSON.stringify([releveDoigt.tete.boite?.bas, releveDoigt.photo?.y, releveDoigt.photo?.bas, releveDoigt.pied.boite?.y]));
    verif("aucune ligne de texte sous la photo", releveDoigt.lignesSousLaPhoto.length === 0, JSON.stringify(releveDoigt.lignesSousLaPhoto));
  } catch (e) {
    verif("déroulement du banc 876 (§4 doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("876 · §4 — web : chaque carte de la grille prend la structure du fil");
    await page.goto(`${BASE}${LISTE}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 2000);
    releveWeb = await releverCarte(page, "[data-carte]");
    const grille = await page.evaluate(() => ({
      colonnes: getComputedStyle(document.querySelector("[data-grille-tatoueurs]")).gridTemplateColumns.split(" ").length,
      cartes: document.querySelectorAll("[data-carte]").length,
      tetes: [...document.querySelectorAll("[data-carte] [data-en-tete-de-fil]")].filter((n) => n.getClientRects().length > 0).length,
      pieds: [...document.querySelectorAll("[data-carte] [data-pied-de-fil]")].filter((n) => n.getClientRects().length > 0).length,
    }));
    verif("la grille garde ses colonnes (quatre à 1440 px)", grille.colonnes === 4, `${grille.colonnes} colonne(s)`);
    verif("chaque carte montre l'en-tête et le pied", grille.tetes === grille.cartes && grille.pieds === grille.cartes, `${grille.tetes} en-têtes, ${grille.pieds} pieds, ${grille.cartes} cartes`);
    verif("l'en-tête est AU-DESSUS de la photo, le pied EN DESSOUS", releveWeb.tete.boite.bas <= releveWeb.photo.y + 0.5 && releveWeb.pied.boite.y >= releveWeb.photo.bas - 0.5,
      JSON.stringify([releveWeb.tete.boite.bas, releveWeb.photo.y, releveWeb.photo.bas, releveWeb.pied.boite.y]));
    verif("la ligne des styles a disparu : aucun texte sous la photo", releveWeb.lignesSousLaPhoto.length === 0, JSON.stringify(releveWeb.lignesSousLaPhoto));
    const ecarts = memesRangees(releveDoigt, releveWeb);
    verif("L'EN-TÊTE ET LE PIED SONT IDENTIQUES À CEUX DU MOBILE (hauteurs, gabarits, écritures)", ecarts.length === 0, ecarts.join(" ; ") || "identiques");
    //  LES CHEVRONS AU SURVOL, CONSERVÉS.
    const carte = page.locator("[data-carte]").first();
    await carte.hover({ position: { x: 150, y: 250 } });
    await attendre(page, 500);
    const droite = carte.locator("[data-fleche-de-carte='droite']");
    verif("les chevrons au survol sont conservés", await droite.isVisible());
    await droite.click();
    await attendre(page, 700);
    verif("… et ils font toujours glisser (pastille 2/N)", /^2\/\d+$/.test((await carte.locator("[data-compteur-de-carte]").textContent()).trim()));
    //  LES POINTS DU PIED, AU WEB : un point posé fait sauter la galerie.
    const points = carte.locator("[data-pied-de-fil] button[aria-label^='View photo ']");
    if ((await points.count()) >= 3) {
      await carte.locator("[data-pied-de-fil] button[aria-label^='View photo 3 of ']").click();
      await attendre(page, 700);
      verif("un point du pied posé au web : la galerie y saute (3/N)", /^3\/\d+$/.test((await carte.locator("[data-compteur-de-carte]").textContent()).trim()));
    }
  } catch (e) {
    verif("déroulement du banc 876 (§4 web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · MA SÉLECTION > FAVORIS ══════════════════════════════════════
await suivre([A, B]);
for (const mode of ["web", "doigt"]) {
  const { nav, page } = await ouvrir(mode, { session: U });
  try {
    titre(`876 · §5 — ${mode} : la carte des favoris`);
    await page.goto(`${BASE}/my-favorites`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await attendre(page, 2000);
    const r = await releverCarte(page, "[data-carte]");
    const fanion = await page.evaluate(() => {
      const c = document.querySelector("[data-carte]");
      const ligne = c.querySelector("[data-fanion-de-ligne]"), flottant = c.querySelector("[data-fanion-flottant]");
      return { ligne: Boolean(ligne && ligne.getClientRects().length > 0), flottant: Boolean(flottant && flottant.getClientRects().length > 0) };
    });
    if (mode === "web") {
      verif("l'en-tête (avatar, nom, ville, badge) est AU-DESSUS de la photo", r.tete.boite && r.tete.boite.bas <= r.photo.y + 0.5, JSON.stringify([r.tete.boite?.bas, r.photo?.y]));
      verif("sous la photo, la ligne « Blackwork • … » est GARDÉE, avec son fanion", r.lignesSousLaPhoto.length === 1 && /Blackwork/.test(r.lignesSousLaPhoto[0]) && fanion.ligne, JSON.stringify([r.lignesSousLaPhoto, fanion]));
      verif("pas de pied sur une carte de « Ma sélection »", r.pied.boite === null);
      const ecarts = memesRangees({ ...releveDoigt, pied: { h: null, signaler: null, vuesSvg: null, boutonsDroite: [], pt: null } }, { ...r, pied: { h: null, signaler: null, vuesSvg: null, boutonsDroite: [], pt: null } });
      verif("… et l'en-tête est celui du fil, à l'identique", ecarts.length === 0, ecarts.join(" ; ") || "identique");
    } else {
      verif("au doigt, la vignette ne change pas : pas d'en-tête, le nom et la ville sous la photo, le fanion dans l'image",
        r.tete.boite === null && r.lignesSousLaPhoto.length === 2 && fanion.flottant && !fanion.ligne, JSON.stringify([r.tete.boite, r.lignesSousLaPhoto, fanion]));
      verif("… et pas de pied", r.pied.boite === null);
    }
  } catch (e) {
    verif(`déroulement du banc 876 (§5 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 6 · LES SQUELETTES DU WEB, SANS SAUT ════════════════════════════
/*  LA MÉTHODE DU BANC 845 : la main rendue dès la navigation COMMISE,
    puis le document interrogé toutes les cinq millisecondes — le repli
    de `loading.tsx` porte `aria-busy`. Trois tentatives : sur une
    doublure qui répond en dix millisecondes, la fenêtre se ferme
    parfois avant la première interrogation. */
const RELEVE_GRIS = `(li, B) => {
  const enfants = [...li.children];
  return { hauteur: B(li)?.h, y: B(li)?.y, enfants: enfants.map((n) => ({ h: B(n)?.h, y: B(n)?.y, affiche: n.getClientRects().length > 0 })) };
}`;
for (const [nom, chemin, session] of [["la recherche", LISTE, null], ["Ma sélection", "/my-favorites", U]]) {
  const { nav, page } = await ouvrir("web", session ? { session } : {});
  try {
    titre(`876 · §6 — web : le squelette de ${nom} épouse la nouvelle carte`);
    let gris = null;
    for (let essai = 0; essai < 3 && !gris; essai += 1) {
      await page.goto(`${BASE}${chemin}`, { waitUntil: "commit" });
      for (let i = 0; i < 400 && !gris; i += 1) {
        gris = await page.evaluate(([R, Bs]) => {
          const b = document.querySelector('[aria-busy="true"]');
          if (!b) return null;
          const li = [...b.querySelectorAll("li")].find((n) => n.getBoundingClientRect().height > 0);
          if (!li) return null;
          return new Function("return " + R)()(li, new Function("return " + Bs)());
        }, [RELEVE_GRIS, BOITE]).catch(() => null);
        if (!gris) await page.waitForTimeout(5);
      }
    }
    verif("le squelette est attrapé", gris !== null);
    await page.waitForLoadState("networkidle");
    await attendre(page, 1800);
    const vraie = await page.evaluate(([Bs]) => {
      const B = new Function("return " + Bs)();
      const c = document.querySelector("[data-carte]");
      const tete = c.querySelector("[data-en-tete-de-fil]");
      const photo = c.querySelector("[data-lien-carte] > div > div");
      const pied = c.querySelector("[data-pied-de-fil]");
      const bloc = c.querySelector("[data-lien-carte] > div + div");
      return { hauteur: B(c)?.h, y: B(c)?.y, tete: B(tete), photo: B(photo), pied: B(pied), bloc: B(bloc) };
    }, [BOITE]);
    const egal = (a, b, tol = 0.5) => a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= tol;
    verif("MÊME HAUTEUR DE CARTE", egal(gris?.hauteur, vraie.hauteur), `${gris?.hauteur} px (gris) vs ${vraie.hauteur} px (vraie)`);
    verif("l'EN-TÊTE : même hauteur, même place", egal(gris?.enfants[0]?.h, vraie.tete?.h) && egal(gris?.enfants[0]?.y, vraie.tete?.y), `h ${gris?.enfants[0]?.h}/${vraie.tete?.h} · y ${gris?.enfants[0]?.y}/${vraie.tete?.y}`);
    verif("la PHOTO : même hauteur, même place", egal(gris?.enfants[1]?.h, vraie.photo?.h) && egal(gris?.enfants[1]?.y, vraie.photo?.y), `h ${gris?.enfants[1]?.h}/${vraie.photo?.h} · y ${gris?.enfants[1]?.y}/${vraie.photo?.y}`);
    const bas = session ? vraie.bloc : vraie.pied;
    verif(session ? "le BLOC SOUS LA PHOTO : même hauteur, même place" : "le PIED : même hauteur, même place",
      egal(gris?.enfants[2]?.h, bas?.h) && egal(gris?.enfants[2]?.y, bas?.y), `h ${gris?.enfants[2]?.h}/${bas?.h} · y ${gris?.enfants[2]?.y}/${bas?.y}`);
    verif("AUCUN SAUT AU REMPLACEMENT : la première carte arrive là où le squelette la promettait", egal(gris?.y, vraie.y, 1), `${gris?.y} promis, ${vraie.y} rendu`);
  } catch (e) {
    verif(`déroulement du banc 876 (§6 ${nom})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

bilan();
