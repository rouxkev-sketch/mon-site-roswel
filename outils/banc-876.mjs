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
/*  ⛔ nº 877 — LE RELEVÉ DE CARTE (`RELEVE_CARTE`, `releverCarte`) ET LA
    COMPARAISON DOIGT/WEB (`memesRangees`) SONT RETIRÉS avec les §4, §5
    et §6 qu'ils servaient : les cartes du web ne prennent plus la
    structure du fil (voir la note en bas de fichier). Pas de code mort
    dans un banc non plus. */

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
    /*  nº 877-§5 — LES SEIZE PIXELS DE CÔTÉ SONT PARTIS : le titre
        s'aligne sur le BORD GAUCHE de la carte et le compteur sur le
        BORD DROIT de l'image. Le banc 877 mesure la règle ; ici on
        vérifie seulement que les deux se suivent sur la ligne du titre. */
    verif("le titre en haut à gauche, le compteur « 1/6 » en haut à droite, sur la même ligne",
      v.cartes[0].compteur === "1/6" && v.cartes[0].titreBoite.g < v.cartes[0].compteurBoite.g && v.cartes[0].compteurBoite.y < v.cartes[0].cadre.y,
      `${v.cartes[0].compteur} · titre g ${v.cartes[0].titreBoite.g} · compteur d ${v.cartes[0].compteurBoite.d} · carte ${v.cartes[0].boite.g}→${v.cartes[0].boite.d}`);
    /*  nº 877-§2 — LE PIED A QUITTÉ LES CARTES DU WEB : ses commandes
        (fanion, signaler, vues, partage, points) vivent sur la GRANDE
        PHOTO (banc 877-§4). Le doigt garde le sien. */
    verif("aucun pied sous une carte de galerie, au web (nº 877-§2)", v.cartes.every((c) => c.pied === null), JSON.stringify(v.cartes.map((c) => c.pied)));
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
    /*  nº 877-§2 — PLUS DE POINTS À POSER : le pied a quitté les cartes
        du web. Ce qui fait glisser une carte y est le CHEVRON (mesuré
        juste au-dessus) ou LES FLÈCHES DU CLAVIER (nº 877-§6, banc
        877). */
    //  LA PAGE FLASH suit la même écriture : sans flash, l'écran vide.
    await page.goto(`${BASE}/artist/${SLUG}/flash`, { waitUntil: "domcontentloaded" });
    await attendre(page, 1500);
    verif("la page Flash sans flash montre l'écran vide, et aucune bande", await page.evaluate(() => Boolean(document.querySelector("[data-page-vide]")) && document.querySelectorAll("[data-galeries]").length === 0));
  } catch (e) {
    verif("déroulement du banc 876 (§3)", false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

/*  ⛔ §4, §5 ET §6 SONT ANNULÉS PAR LA nº 877, SUR DÉCISION DU
    PROPRIÉTAIRE
    ==================================================================
    CE QUE CES TROIS SECTIONS MESURAIENT : les cartes de RECHERCHE et de
    « MA SÉLECTION » prenant, au web, la structure du fil (en-tête
    au-dessus de la photo, pied en dessous, plus de ligne de styles), et
    les squelettes du web épousant cette carte-là.
    CE QUE LE PROPRIÉTAIRE A TRANCHÉ À L'ÉCRAN, LA PASSE SUIVANTE :
    « retour à l'état d'AVANT la 876 » pour ces cartes. Les mesures
    correspondantes ne décrivent donc plus le site : elles sont retirées
    plutôt que retournées, et c'est LE BANC 877 qui garde le nouvel état
    (§1 : les cartes du web, mesurées à l'écriture du bâti 875), avec
    les bancs 841, 842, 843, 845, 856, 862 et 865 — rendus eux aussi à
    leur écriture d'avant la nº 876.
    CE QUI RESTE ICI EST CE QUI TIENT : l'ordre des portfolios suivis
    (§1), « Independent » en premier (§2) et le fil de galeries au web
    (§3) — les trois décisions de la nº 876 que la nº 877 ne touche
    pas. */

bilan();
