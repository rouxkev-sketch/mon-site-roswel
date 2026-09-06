//  ██ BANC 865 — QUATRE RETOUCHES MOBILE ██
//  ==================================================================
//   1. LE VA-ET-VIENT DE L'ACCUEIL dit « Tattoo styles » (goutte) et
//      « Flash styles » (éclair) — entiers aux deux positions, sur UNE
//      ligne, colonnes égales, onglet de 43 px.
//   2. « MA SÉLECTION » > Portfolios : douze pixels entre la rangée
//      d'un suivi (avatar, nom, ville) et sa bande d'images.
//   3. LA FEUILLE DES MENUS de « Ma sélection » : de l'air sous le
//      dernier titre, cohérent avec l'air au-dessus du premier.
//   4. « MA SÉLECTION » > Favoris, cartes du doigt : LE NOM en titre,
//      LA VILLE seule en sous-titre — plus de style ni de type ; le web
//      ne change pas.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const TATTOO = "Tattoo styles", FLASH = "Flash styles";
const U = { id: "30000000-0000-4000-8000-000000000865", email: "banc-865@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});
await effacer("favoris_photos", `utilisateur_id=eq.${U.id}`);
await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
const FICHES = (await lire("tatoueurs", "select=id,slug,nom,ville_nom,type_fiche,etablissement,styles")).slice(0, 3);
{
  const photos = (await lire("photos_tatoueur", "select=id,nature,tatoueur_id"))
    .filter((p) => p.nature === "tatouage" && FICHES.some((f) => f.id === p.tatoueur_id)).slice(0, 6);
  await ranger("favoris_photos", photos.map((p, i) => ({ utilisateur_id: U.id, photo_id: p.id, cree_le: `2026-01-01T00:00:0${i}Z` })));
  await ranger("tatoueurs_suivis", FICHES.map((f) => ({ utilisateur_id: U.id, tatoueur_id: f.id, cree_le: "2026-01-01T00:00:00Z" })));
}

//  ══ 1 · LES DEUX TITRES, SUR UNE LIGNE ══════════════════════════════
for (const largeur of [390, 360]) {
  const { nav, page } = await ouvrir("doigt");
  try {
    await page.setViewportSize({ width: largeur, height: 844 });
    titre(`865 · §1 — l'accueil à ${largeur} px : « Tattoo styles » / « Flash styles », une ligne`);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const v = await page.evaluate(() => {
      const nav = document.querySelector("[data-rangee-moteur] nav");
      const B = (n) => { const x = n.getBoundingClientRect(); return { h: Math.round(x.height), l: Math.round(x.width) }; };
      return { groupe: B(nav), liens: [...nav.querySelectorAll("a[href]")].map((a) => {
        const t = a.querySelector("span span"); const r = document.createRange(); r.selectNodeContents(t);
        return { texte: t.textContent.trim(), nom: a.getAttribute("aria-label"), dessin: Boolean(a.querySelector("svg")),
          lignes: new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size, ...B(a) };
      }) };
    });
    const [tattoo, flash] = v.liens;
    verif("les deux positions disent leur titre entier", tattoo?.texte === TATTOO && flash?.texte === FLASH, `« ${tattoo?.texte} » · « ${flash?.texte} »`);
    verif("… sur UNE ligne chacune", tattoo?.lignes === 1 && flash?.lignes === 1, `${tattoo?.lignes} · ${flash?.lignes}`);
    verif("… icône devant, colonnes égales, onglet de 43 et va-et-vient de 46",
      tattoo?.dessin && flash?.dessin && tattoo.l === flash.l && tattoo.h === 43 && v.groupe.h === 46,
      `colonnes ${tattoo?.l}/${flash?.l} · onglet ${tattoo?.h} · va-et-vient ${v.groupe?.h}`);
    verif("le nom accessible est le titre", tattoo?.nom === TATTOO && flash?.nom === FLASH);
  } catch (e) {
    verif(`déroulement du banc 865 (§1, ${largeur})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · DOUZE PIXELS SOUS LA RANGÉE D'UN SUIVI ══════════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("865 · §2 — « Ma sélection » > Portfolios : la bande à douze pixels de la rangée");
    await page.goto(`${BASE}/my-favorites?selection=suivis`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.waitForSelector("[data-suivi]", { timeout: 20000 });
    const v = await page.evaluate(() => {
      const s = document.querySelector("[data-suivi]");
      const B = (n) => { const x = n.getBoundingClientRect(); return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), h: +x.height.toFixed(1) }; };
      const rangee = s.querySelector("[data-ligne-suivi]").parentElement;
      const bande = s.querySelector("ul");
      return { rangee: B(rangee), bande: bande ? B(bande) : null, air: bande ? +(B(bande).y - B(rangee).bas).toFixed(1) : null };
    });
    verif("la bande commence douze pixels sous la rangée (vingt avant la nº 865)", v.air === 12, `${v.air} px`);
    verif("la rangée garde ses 52 px (le rond du doigt)", v.rangee.h === 52, `${v.rangee.h} px`);
  } catch (e) {
    verif("déroulement du banc 865 (§2)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · LA FEUILLE DES MENUS : DE L'AIR SOUS LE DERNIER TITRE ═══════
//  La feuille n'existe que si les suivis se DISTINGUENT (des styles ou
//  des profils différents, voir `sansGroupeSansPrise`) : on ajoute au
//  compte un SALON d'un autre style, forgé pour le banc. Puis un second
//  appui sur « Portfolios » ouvre la feuille (nº 460), et l'on mesure :
//  la classe du rembourrage bas était collée au dollar d'une
//  interpolation depuis la nº 583 — Tailwind ne l'extrayait pas, le
//  rembourrage calculé valait ZÉRO et le dernier titre touchait le bord.
{
  const gabarit = (await lire("tatoueurs", `slug=eq.${FICHES[0].slug}`))[0];
  const ID = `20000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
  const SLUG = `banc865-salon-${Date.now()}`;
  await ranger("tatoueurs", { ...gabarit, id: ID, slug: SLUG, nom: "Salon 865", type_fiche: "salon", etablissement: "Salon 865",
    styles: ["blackwork"], ville_slug: `lyon-${SLUG}` });
  await ranger("photos_tatoueur", [1, 2, 3].map((i) => ({ id: `49000865-0000-4000-8000-${Date.now().toString(16).slice(-8).padStart(8, "0")}${String(i).padStart(4, "0")}`,
    tatoueur_id: ID, style: "blackwork", rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/blackwork-${i}.svg`,
    miniature: `/images-demo/tatouage/blackwork-${i}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" })));
  await ranger("tatoueurs_suivis", [{ utilisateur_id: U.id, tatoueur_id: ID, cree_le: "2026-01-02T00:00:00Z" }]);

  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("865 · §3 — la feuille des menus de « Ma sélection » : de l'air sous le dernier titre");
    await page.goto(`${BASE}/my-favorites?selection=suivis`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.waitForSelector("[data-suivi]", { timeout: 20000 });
    await page.locator("[role=radio]").filter({ hasText: /portfolio/i }).first().tap();
    await page.waitForTimeout(1200);
    const mesurer = () => page.evaluate(() => {
      const B = (n) => { const x = n.getBoundingClientRect(); return { y: +x.top.toFixed(2), bas: +x.bottom.toFixed(2), h: +x.height.toFixed(2) }; };
      const encre = (el) => { const r = document.createRange(); r.selectNodeContents(el); const rs = [...r.getClientRects()];
        return rs.length ? { y: +Math.min(...rs.map((k) => k.top)).toFixed(2), bas: +Math.max(...rs.map((k) => k.bottom)).toFixed(2) } : null; };
      const racine = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).position === "fixed" && /z-\[70\]/.test(d.className));
      if (!racine) return { absente: true };
      const bande = racine.querySelector("[data-bande-feuille]");
      const plaque = bande.parentElement;
      const trait = bande.querySelector("span");
      const bloc = [...racine.querySelectorAll("div")].find((d) => /border-t/.test(d.className) && /safe-area/.test(d.className));
      const titres = [...bloc.querySelectorAll("button")].map((b) => ({ texte: b.textContent.trim(), ...B(b), encre: encre(b.querySelector("span") ?? b) }));
      const premier = titres[0], dernier = titres[titres.length - 1];
      return { ecran: innerHeight, plaque: B(plaque), trait: B(trait), bloc: { ...B(bloc), padBas: getComputedStyle(bloc).paddingBottom }, titres,
        dessus: +(premier.encre.y - B(trait).bas).toFixed(2), dessous: +(B(plaque).bas - dernier.encre.bas).toFixed(2),
        boiteDessous: +(B(plaque).bas - dernier.bas).toFixed(2) };
    });
    const v = await mesurer();
    verif("la feuille est montée, avec ses deux titres (Styles, Profile)", !v.absente && v.titres.length === 2, JSON.stringify(v.titres?.map((t) => t.texte)));
    //  nº 867-§4 — le propriétaire a trouvé les 32 px trop grands : 28.
    //  Ce que ce banc défend reste le même — la règle est PEINTE, elle
    //  ne vaut plus zéro comme avant la nº 865.
    //  nº 868-§2 — vingt : l'air de la feuille sans titres, repris par
    //  composition. Ce que ce banc défend reste que la règle est PEINTE.
    verif("le rembourrage bas du bloc est PEINT : 20 px calculés depuis la nº 868 (zéro avant la nº 865)", v.bloc?.padBas === "20px", v.bloc?.padBas);
    verif("vingt pixels entre la boîte du dernier titre et le bord (vingt-huit à la nº 867)", v.boiteDessous === 20, `${v.boiteDessous} px`);
    /*  nº 867-§4 — L'ÉGALITÉ DE LA nº 865 EST LEVÉE, SUR CONSIGNE : le
        propriétaire veut MOINS d'air sous le dernier titre qu'au-dessus
        du premier. On mesure donc l'écart voulu (quatre pixels), pas
        l'égalité. */
    /*  nº 868-§2 — l'air du bas est celui de la feuille SANS titres ; il
        est donc plus court que celui du haut, et l'écart n'est plus une
        promesse de cette passe-là. On mesure qu'il reste franc. */
    verif("en encre, l'air sous le dernier titre reste franc (plus court que celui du haut depuis la nº 868)",
      v.dessous >= 28 && v.dessous < v.dessus, `dessus ${v.dessus} px, dessous ${v.dessous} px`);
    verif("la plaque touche le bas de l'écran", v.plaque.bas === v.ecran, `${v.plaque.bas} / ${v.ecran}`);
    //  UNE SECTION OUVERTE : le bas ne bouge pas, seul le haut du bloc gagne son air (nº 584).
    await page.locator("button", { hasText: /^Styles$/ }).first().evaluate((b) => b.click());
    await page.waitForTimeout(600);
    const o = await mesurer();
    verif("section ouverte : le rembourrage bas reste à 20 px et la plaque au bas de l'écran",
      o.bloc?.padBas === "20px" && o.plaque.bas === o.ecran && o.boiteDessous === 20, JSON.stringify({ padBas: o.bloc?.padBas, boiteDessous: o.boiteDessous }));
  } catch (e) {
    verif("déroulement du banc 865 (§3)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LES CARTES DE FAVORIS AU DOIGT : LE NOM, PUIS LA VILLE ═══════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("865 · §4 — « Ma sélection » > Favoris, au doigt : le nom en titre, la ville seule en sous-titre");
    await page.goto(`${BASE}/my-favorites`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    const v = await page.evaluate(() => {
      const c = document.querySelector("[data-carte]");
      const vu = (n) => n && getComputedStyle(n).display !== "none" && n.getBoundingClientRect().height > 0;
      const ecriture = (n) => { const s = getComputedStyle(n); return { texte: n.innerText.trim(), corps: s.fontSize, graisse: s.fontWeight, couleur: s.color, clamp: s.webkitLineClamp }; };
      const style = c.querySelector("p");
      const nom = c.querySelector("h3");
      const lieu = [...c.querySelectorAll("p")].find((p) => p !== style && vu(p));
      return { styleVisible: vu(style), nom: vu(nom) ? ecriture(nom) : null, lieu: lieu ? ecriture(lieu) : null,
        badge: [...c.querySelectorAll("[data-badge-type]")].some(vu) };
    });
    verif("la ligne du style ne s'écrit plus", v.styleVisible === false);
    verif("le TITRE est le nom, blanc, demi-gras, une ligne coupée par « … »",
      v.nom && v.nom.texte.length > 0 && v.nom.graisse === "600" && v.nom.couleur === "rgb(242, 242, 244)" && v.nom.clamp === "1",
      JSON.stringify(v.nom));
    verif("le SOUS-TITRE est la ville seule, gris, fin, une ligne",
      v.lieu && !/Tattoo Artist|Private Studio|Tattoo Shop|·/.test(v.lieu.texte) && v.lieu.graisse === "400" && v.lieu.couleur === "rgb(168, 168, 176)" && v.lieu.clamp === "1",
      JSON.stringify(v.lieu));
    verif("aucun badge de type sur la vignette", v.badge === false);
  } catch (e) {
    verif("déroulement du banc 865 (§4 doigt)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }

  const { nav: navWeb, page: pageWeb } = await ouvrir("web", { session: U });
  try {
    titre("865 · §4 — et le web garde sa ligne du style, son nom et son badge (nº 876 : le nom dans l'en-tête du fil, au-dessus de la photo)");
    await pageWeb.goto(`${BASE}/my-favorites`, { waitUntil: "networkidle" });
    await pageWeb.waitForTimeout(1500);
    await pageWeb.waitForSelector("[data-carte]", { timeout: 20000 });
    const w = await pageWeb.evaluate(() => {
      const c = document.querySelector("[data-carte]");
      const vu = (n) => n && getComputedStyle(n).display !== "none" && n.getBoundingClientRect().height > 0;
      //  nº 876 — au web, le nom vit dans l'en-tête du fil (au-dessus de
      //  la photo), plus dans un h3 sous elle.
      return { style: vu(c.querySelector("p")) ? c.querySelector("p").textContent.trim() : null,
        nom: vu(c.querySelector("[data-en-tete-de-fil] [data-lien-profil-de-fil] span > span:first-child")), badge: [...c.querySelectorAll("[data-badge-type]")].some(vu) };
    });
    verif("au web, la ligne du style, le nom et le badge du type sont là", Boolean(w.style) && w.nom && w.badge, JSON.stringify(w));
  } catch (e) {
    verif("déroulement du banc 865 (§4 web)", false, String(e).slice(0, 400));
  } finally { await navWeb.close(); }
}

process.exit(bilan());
