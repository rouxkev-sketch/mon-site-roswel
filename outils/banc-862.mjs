//  ██ BANC 862 — FAVORIS, SUIVIS, VUE PHOTO MOBILE ██
//  ==================================================================
//  Les trois points de la passe :
//   1. WEB — LES CARTES DE « MA SÉLECTION » : le fanion sort de
//      l'image et prend la place qu'il a sur les cartes de recherche
//      (856/859) — sur la ligne des styles, aligné à droite. Au DOIGT
//      il ne bouge pas : il flotte toujours dans l'angle de la photo.
//   2. WEB ET DOIGT — LES PORTFOLIOS SUIVIS : le badge « Following »
//      est remplacé par le BADGE DU TYPE, qui mène au profil ; le type
//      disparaît de la ligne de la localité.
//   3. DOIGT — LA VUE PHOTO prend EXACTEMENT la présentation des
//      cartes du fil : l'en-tête au-dessus de l'image, le pied
//      dessous. Mesurés IDENTIQUES à une carte du fil, par les DEUX
//      entrées (un lien partagé, une carte de « Ma sélection »).
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const U = { id: "30000000-0000-4000-8000-000000000862", email: "banc-862@yokofolio.test" };
const STYLE = "trash-polka";

/*  LE COMPTE DU BANC : des photos en favori (les cartes de « Ma
    sélection ») et des portfolios suivis (la liste des suivis). Les
    fiches sont celles de la doublure — on n'en forge aucune, la
    géométrie ne dépend pas du contenu. */
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
const FICHES = (await lire("tatoueurs", "select=id,slug,nom,type_fiche,etablissement,styles"))
  .filter((f) => (f.styles ?? []).includes(STYLE))
  .slice(0, 3);
{
  const photos = (await lire("photos_tatoueur", "select=id,nature,tatoueur_id"))
    .filter((p) => p.nature === "tatouage" && FICHES.some((f) => f.id === p.tatoueur_id))
    .slice(0, 8);
  await ranger("favoris_photos", photos.map((p, i) => ({
    utilisateur_id: U.id, photo_id: p.id, cree_le: `2026-01-01T00:00:0${i}Z`,
  })));
  await ranger("tatoueurs_suivis", FICHES.map((f) => ({
    utilisateur_id: U.id, tatoueur_id: f.id, cree_le: "2026-01-01T00:00:00Z",
  })));
}

/*  LA SONDE DE CARTE (§1) — la photo, la ligne des styles, le fanion
    RENDU (celui dont la boîte a une hauteur), et lequel des deux blocs
    s'affiche. */
const SONDE_CARTE = `() => {
  const B = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: Math.round(x.top), bas: Math.round(x.bottom), g: Math.round(x.left), d: Math.round(x.right), h: Math.round(x.height) }; };
  const c = document.querySelector("[data-carte]");
  if (!c) return { aucune: true };
  const vu = (n) => n && getComputedStyle(n).display !== "none";
  const ligne = c.querySelector("[data-fanion-de-ligne]");
  const flottant = c.querySelector("[data-fanion-flottant]");
  const coeur = [ligne, flottant].map((b) => b?.querySelector("button"))
    .find((n) => n && n.getBoundingClientRect().height > 0);
  return {
    photo: B(c.querySelector("img")?.closest("div")), styles: B(c.querySelector("p")),
    coeur: B(coeur), ligne: vu(ligne), flottant: vu(flottant),
    ligneExiste: Boolean(ligne), flottantExiste: Boolean(flottant),
  };
}`;

/*  LA SONDE DU FIL (§3) — l'en-tête, l'image et le pied, où qu'ils
    vivent : sur une carte de la liste comme dans la vue photo. Tout ce
    qu'elle rend est MESURÉ, jamais recopié d'un fichier. */
const SONDE_FIL = `(racine) => {
  const B = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), g: +x.left.toFixed(1), d: +x.right.toFixed(1), h: +x.height.toFixed(1), l: +x.width.toFixed(1) }; };
  const r = racine ? document.querySelector(racine) : document;
  if (!r) return { absent: true };
  const tete = r.querySelector("[data-en-tete-de-fil]");
  const pied = r.querySelector("[data-pied-de-fil]");
  const photo = r.querySelector("[data-photo-fiche]") || r.querySelector("[data-cadre-de-fil]");
  if (!tete || !pied || !photo) return { absent: true, tete: Boolean(tete), pied: Boolean(pied), photo: Boolean(photo) };
  const badge = tete.querySelector("[data-badge-type]");
  /*  LE NOM ET LA VILLE — pris dans LA COLONNE DE TEXTE du lien, la
      seconde et dernière boîte après le rond de profil. (Un sélecteur
      « span span span » ne rendait rien : le rond en est un aussi, et
      la profondeur n'est pas la même des deux côtés — une sonde qui ne
      voit pas ce qu'elle prétend lire vaut moins que pas de sonde.) */
  const colonne = tete.querySelector("a > span:last-child");
  const textes = colonne ? [...colonne.children].map((n) => n.textContent.trim()) : [];
  return {
    teteH: B(tete).h, piedH: B(pied).h,
    teteG: B(tete).g, teteD: B(tete).d, piedG: B(pied).g, piedD: B(pied).d,
    //  LES DEUX SOUDURES : l'en-tête touche l'image, l'image touche le
    //  pied — c'est ce qui fait une carte du fil, et rien d'autre.
    teteAPhoto: +(B(photo).y - B(tete).bas).toFixed(1),
    photoAPied: +(B(pied).y - B(photo).bas).toFixed(1),
    avatar: B(tete.querySelector("span")), badge: B(badge), badgeTexte: badge?.textContent.trim(),
    nom: textes[0], ville: textes[1],
    vues: B(pied.querySelector("[data-vues-de-fil]")),
    icones: [...pied.querySelectorAll("button")].map((n) => ({
      role: /Report/i.test(n.getAttribute("aria-label") ?? "") ? "signaler"
        : /Save this photo|Remove this photo/i.test(n.getAttribute("aria-label") ?? "") ? "fanion"
        : /Share/i.test(n.getAttribute("aria-label") ?? "") ? "partage" : "point",
      g: Math.round(n.getBoundingClientRect().left), h: Math.round(n.getBoundingClientRect().height),
    })),
    lienProfil: tete.querySelector("a")?.getAttribute("href"),
    plaque: Boolean(r.querySelector("[data-habillage-photo] [class*='rounded-xl']")),
  };
}`;
const sonder = (page, sonde, arg = null) =>
  page.evaluate(([s, a]) => new Function("return " + s)()(a), [sonde, arg]);

//  ══ 1 · WEB — LE FANION DE « MA SÉLECTION » PASSE SUR LA LIGNE ══════
{
  const { nav, page } = await ouvrir("web", { session: U });
  try {
    titre("862 · §1 — web : le fanion de « Ma sélection » sur la ligne des styles");
    await page.goto(`${BASE}/my-favorites`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    const s = await sonder(page, SONDE_CARTE);
    verif("le fanion est rendu, à sa cible de quarante pixels",
      s.coeur !== null && s.coeur.h === 40, s.coeur ? `${s.coeur.h} px` : "absent");
    verif("il est SUR LA LIGNE, plus sur l'image (le bloc flottant est éteint)",
      s.ligne === true && s.flottant === false, `ligne ${s.ligne} · flottant ${s.flottant}`);
    verif("il ne touche pas la photo : quatre pixels l'en séparent (nº 859)",
      s.coeur.y - s.photo.bas === 4, `${s.coeur.y - s.photo.bas} px`);
    verif("l'air au-dessus de la ligne des styles vaut quinze pixels (nº 859)",
      s.styles.y - s.photo.bas === 15, `${s.styles.y - s.photo.bas} px`);
    verif("il est centré sur la ligne des styles",
      Math.abs((s.coeur.y + s.coeur.bas) / 2 - (s.styles.y + s.styles.bas) / 2) <= 1,
      `fanion ${(s.coeur.y + s.coeur.bas) / 2} · texte ${(s.styles.y + s.styles.bas) / 2}`);
    verif("il est aligné à droite, dans la carte",
      s.coeur.d <= s.photo.d && s.photo.d - s.coeur.d <= 4, `${s.photo.d - s.coeur.d} px du bord`);

    /*  ██ LA MÊME ÉCRITURE, ET ON LE MESURE ██ La consigne dit « la
        place qu'il a sur les cartes de recherche » : on va donc lire
        une carte de recherche et comparer les trois écarts. */
    titre("862 · §1 — et ce sont EXACTEMENT les nombres d'une carte de recherche");
    await page.goto(`${BASE}/search?style=${STYLE}&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    const r = await sonder(page, SONDE_CARTE);
    const ecarts = (v) => ({
      photoAuFanion: v.coeur.y - v.photo.bas,
      photoAuTexte: v.styles.y - v.photo.bas,
      hauteurFanion: v.coeur.h,
      bordDroit: v.photo.d - v.coeur.d,
    });
    const a = ecarts(s), b = ecarts(r);
    verif("les quatre mesures sont identiques des deux côtés",
      JSON.stringify(a) === JSON.stringify(b), `sélection ${JSON.stringify(a)} · recherche ${JSON.stringify(b)}`);
  } catch (e) {
    verif("déroulement du banc 862 (§1 web)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 1b · DOIGT — LE FANION DE « MA SÉLECTION » NE BOUGE PAS ═════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("862 · §1 — doigt : le fanion reste dans l'angle de l'image");
    await page.goto(`${BASE}/my-favorites`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    const s = await sonder(page, SONDE_CARTE);
    verif("le bloc flottant est allumé, celui de la ligne est éteint",
      s.flottant === true && s.ligne === false, `flottant ${s.flottant} · ligne ${s.ligne}`);
    verif("le fanion est SUR l'image (son bas est au-dessus du bas de la photo)",
      s.coeur !== null && s.coeur.bas <= s.photo.bas, s.coeur ? `fanion ${s.coeur.bas} · photo ${s.photo.bas}` : "absent");
  } catch (e) {
    verif("déroulement du banc 862 (§1 doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LES PORTFOLIOS SUIVIS — LE BADGE DU TYPE ════════════════════
for (const [appareil, hauteurAttendue] of [["web", 40], ["doigt", 30]]) {
  const { nav, page } = await ouvrir(appareil, { session: U });
  try {
    titre(`862 · §2 — ${appareil} : le badge du type remplace « Following »`);
    await page.goto(`${BASE}/my-favorites?selection=suivis`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.waitForSelector("[data-suivi]", { timeout: 20000 });
    const s = await page.evaluate(() => {
      const l = document.querySelector("[data-suivi]");
      const badge = l.querySelector("[data-badge-type]");
      const x = badge?.getBoundingClientRect();
      return {
        badge: Boolean(badge), texte: badge?.textContent.trim(),
        lien: badge?.getAttribute("href"), hauteur: x ? Math.round(x.height) : null,
        droite: x ? Math.round(x.right) : null, ligneDroite: Math.round(l.getBoundingClientRect().right),
        suivre: [...l.querySelectorAll("button")].filter((n) =>
          /follow/i.test(n.getAttribute("aria-label") ?? "") || /follow/i.test(n.textContent)).length,
        info: l.querySelector("[data-info-suivi]")?.textContent.trim(),
        slug: l.getAttribute("data-suivi"),
      };
    });
    verif("le badge du type est là, et il porte le mot du site",
      s.badge && s.texte === "Tattoo Artist", `« ${s.texte} »`);
    verif("il mène au profil", s.lien === `/artist/${s.slug}?entree=lien`, String(s.lien));
    verif("plus aucun bouton « Follow » / « Following » sur la rangée", s.suivre === 0, `${s.suivre} bouton(s)`);
    verif("il est poussé au bord de la rangée", s.ligneDroite - s.droite <= 1, `${s.ligneDroite - s.droite} px`);
    verif(`sa boîte est à l'échelle de la rangée (${hauteurAttendue} px)`,
      s.hauteur === hauteurAttendue, `${s.hauteur} px`);
    verif("la ligne de la localité ne dit plus le type",
      Boolean(s.info) && !/Tattoo Artist|Private Studio|Tattoo Shop/.test(s.info) && !s.info.includes(":"),
      `« ${s.info} »`);
  } catch (e) {
    verif(`déroulement du banc 862 (§2 ${appareil})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · DOIGT — LA VUE PHOTO EST UNE CARTE DU FIL ═══════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("862 · §3 — la carte du fil, prise comme étalon");
    await page.goto(`${BASE}/search?style=${STYLE}&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    const carte = await sonder(page, SONDE_FIL, "[data-carte]");
    const slug = await page.evaluate(() =>
      document.querySelector("[data-carte] [data-lien-profil-de-fil]")?.getAttribute("href"));
    const adresse = slug.replace("?entree=lien", "");
    verif("l'étalon est lisible (en-tête, image, pied)", !carte.absent, JSON.stringify(carte.absent ?? "ok"));

    /*  CE QU'ON COMPARE : la géométrie des deux blocs et LEURS DEUX
        SOUDURES à l'image. Pas les positions absolues — la vue photo
        commence sous la barre fixe, la carte au milieu d'une liste. */
    const compare = (v) => ({
      teteH: v.teteH, piedH: v.piedH, teteG: v.teteG, teteD: v.teteD, piedG: v.piedG, piedD: v.piedD,
      teteAPhoto: v.teteAPhoto, photoAPied: v.photoAPied,
      avatar: v.avatar && { g: v.avatar.g, h: v.avatar.h },
      badge: v.badge && { g: v.badge.g, d: v.badge.d, h: v.badge.h },
      vues: v.vues && { g: v.vues.g, h: v.vues.h },
      icones: v.icones,
    });

    for (const [entree, aller] of [
      ["un lien partagé", async () => {
        await page.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
      }],
      ["une carte de « Ma sélection »", async () => {
        await page.goto(`${BASE}/my-favorites`, { waitUntil: "networkidle" });
        await page.waitForTimeout(1500);
        await page.waitForSelector("[data-carte]", { timeout: 20000 });
        await page.locator(`[data-carte] a[href*="/artist/"]`).first().tap();
        await page.waitForTimeout(2500);
      }],
    ]) {
      titre(`862 · §3 — la vue photo, entrée par ${entree}`);
      await aller();
      await page.waitForSelector("[data-en-tete-de-fil]", { timeout: 20000 });
      await page.waitForTimeout(1500);
      const vue = await sonder(page, SONDE_FIL, null);
      verif("on est bien en VUE PHOTO", await page.evaluate(() => Boolean(document.querySelector("[data-vue-photo]"))));
      verif("l'en-tête du fil est AU-DESSUS de l'image, sans un pixel entre eux",
        vue.teteAPhoto === 0, `${vue.teteAPhoto} px`);
      verif("le pied du fil est SOUS l'image, sans un pixel entre eux",
        vue.photoAPied === 0, `${vue.photoAPied} px`);
      verif("l'en-tête mène au profil", vue.lienProfil === `/artist/${vue.lienProfil?.split("/")[2]?.split("?")[0]}?entree=lien`
        && vue.lienProfil.endsWith("?entree=lien"), String(vue.lienProfil));
      verif("la plaque du profil (nº 845) n'est plus là", vue.plaque === false);
      verif("le pied porte les cinq gestes du fil (signaler, points, fanion, partage)",
        ["signaler", "fanion", "partage"].every((r) => vue.icones.some((i) => i.role === r))
        && vue.icones.filter((i) => i.role === "point").length >= 1,
        vue.icones.map((i) => i.role).join(" · "));
      verif("les vues sont là, à gauche, avec leur nombre",
        vue.vues !== null && vue.vues.h === 20, JSON.stringify(vue.vues));
      if (entree === "un lien partagé") {
        //  L'ÉGALITÉ AU MILLIÈME n'a de sens que sur LE MÊME portfolio :
        //  c'est l'entrée dont on choisit l'adresse.
        verif("EN-TÊTE ET PIED MESURÉS IDENTIQUES à ceux d'une carte du fil",
          JSON.stringify(compare(vue)) === JSON.stringify(compare(carte)),
          `vue ${JSON.stringify(compare(vue))} — carte ${JSON.stringify(compare(carte))}`);
        verif("… et ils disent la même chose (nom, ville, badge)",
          vue.nom === carte.nom && vue.ville === carte.ville && vue.badgeTexte === carte.badgeTexte,
          `${vue.nom} · ${vue.ville} · ${vue.badgeTexte}`);
      } else {
        //  Par « Ma sélection », le portfolio n'est pas choisi : on
        //  mesure les invariants de forme, pas l'égalité au portfolio.
        verif("l'en-tête a la hauteur de celui du fil",
          vue.teteH === carte.teteH, `${vue.teteH} · étalon ${carte.teteH}`);
        verif("le pied a la hauteur de celui du fil",
          vue.piedH === carte.piedH, `${vue.piedH} · étalon ${carte.piedH}`);
        verif("les deux blocs vont d'un bord à l'autre, comme sur une carte",
          vue.teteG === carte.teteG && vue.teteD === carte.teteD
          && vue.piedG === carte.piedG && vue.piedD === carte.piedD,
          `${vue.teteG}→${vue.teteD} · ${vue.piedG}→${vue.piedD}`);
      }
    }
  } catch (e) {
    verif("déroulement du banc 862 (§3)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
