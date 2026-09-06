//  ██ BANC 874 — LE PROFIL : SEPT RETOUCHES ██
//  ==================================================================
//   1. L'AIR ENTRE LE BOOKING ET LES BADGES = l'air entre le bas de
//      l'avatar et le booking (à l'œil, c'est-à-dire d'encre à encre).
//   2. LE SITE PASSE SOUS LA BIO, avec l'air standard de la liste
//      au-dessus comme en dessous — vingt-huit, partout.
//   3. MOINS DE TROIS STYLES : les styles et les compétences ne font
//      plus qu'un bloc ; à partir de trois, deux blocs ; au-delà de
//      deux lignes, « +N ⌄ ».
//   4. LE SURTITRE (« TATTOOS ») disparaît ; au doigt, le compteur
//      quitte la photo pour la ligne du titre, à son opposé.
//   5. WEB : une image pleine et 60 % de la suivante dans les galeries.
//   6. DOIGT : loupe → fanion = fanion → avatar dans la barre fixe.
//   7. WEB : le titre hors cadre de la fenêtre n'est plus blanc pur.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest } from "./banc-socle.mjs";

const T = Date.now();
//  QUATRE FICHES : la complète (2 styles → fusion), celle à cinq styles
//  (deux blocs), celle qui déborde (« +N »), et une sans compétence.
const SLUG = `banc874-${T}`, CINQ = `banc874c-${T}`, DEBORD = `banc874d-${T}`;
const CINQ_STYLES = ["blackwork", "realisme", "trash-polka", "japonais", "minimaliste"];
const PHOTO = (k, i) => `4874${k}00${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  const commun = { booking: "ouvert", booking_mois: 5, site_web: "https://exemple.test",
    titre_site_web: "Mon site", bio: "Une bio de banc pour mesurer les airs du profil." };
  await ranger("tatoueurs", [
    { ...gabarit, ...commun, id: SLUG, slug: SLUG, nom: "Banc 874", styles: ["blackwork", "realisme"], ville_slug: `lyon-${SLUG}` },
    { ...gabarit, ...commun, id: CINQ, slug: CINQ, nom: "Banc 874 cinq", styles: CINQ_STYLES, ville_slug: `lyon-${CINQ}` },
    { ...gabarit, ...commun, id: DEBORD, slug: DEBORD, nom: "Banc 874 débord", styles: CINQ_STYLES, ville_slug: `lyon-${DEBORD}` },
  ]);
  const photos = [];
  //  Vingt photos de tattoos (le compteur « 1/20 » de la consigne) et
  //  une galerie d'une seule photo, pour le cas sans compteur.
  for (let i = 1; i <= 20; i += 1) photos.push({ id: PHOTO(0, i), tatoueur_id: SLUG, style: "blackwork", rendu: "black",
    nature: "tatouage", url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
    miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" });
  photos.push({ id: PHOTO(1, 1), tatoueur_id: SLUG, style: "realisme", rendu: "black", nature: "tatouage",
    url: "/images-demo/tatouage/blackwork-1.svg", miniature: "/images-demo/tatouage/blackwork-1.svg", ordre: 1, cree_le: "2026-01-01T00:00:00Z" });
  for (const [k, slug] of [[2, CINQ], [3, DEBORD]]) {
    for (let i = 1; i <= 3; i += 1) photos.push({ id: PHOTO(k, i), tatoueur_id: slug, style: "blackwork", rendu: "black",
      nature: "tatouage", url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
      miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, ordre: i, cree_le: "2026-01-01T00:00:00Z" });
  }
  await ranger("photos_tatoueur", photos);
}
const U = { id: "30000000-0000-4000-8000-000000000874", email: "banc-874@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});

const proche = (a, b, marge = 1) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;

//  ██ LES AIRS DU PROFIL — d'ENCRE à ENCRE, ce que l'œil mesure ██
//  L'encre d'une ligne : le tracé de son icône (bbox du svg, trait
//  compris) et la boîte de son texte, réunis.
const SONDE_PROFIL = `() => {
  const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1), g: +r.left.toFixed(1), d: +r.right.toFixed(1), h: +r.height.toFixed(1) }; };
  const encreSvg = (svg) => { if (!svg) return null; const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal; const e = r.width / (vb.width || 24); const b = svg.getBBox();
    const traits = [...svg.querySelectorAll("[stroke-width]")].map((p) => parseFloat(p.getAttribute("stroke-width")));
    const demi = (traits.length ? Math.max(...traits) : 0) / 2;
    return { y: +(r.top + (b.y - demi) * e).toFixed(1), bas: +(r.top + (b.y + b.height + demi) * e).toFixed(1) }; };
  //  L'ENCRE D'UN TEXTE : la boîte de POLICE du nœud de texte (une
  //  sélection posée sur le <p> rendrait la boîte de la rangée entière —
  //  interligne compris —, c'est-à-dire tout ce qu'on cherche à éviter).
  const encreTexte = (n) => { if (!n) return null;
    const texte = [...n.querySelectorAll("span")].find((e) => e.children.length === 0 && e.textContent.trim());
    if (!texte) return null;
    const r = document.createRange(); r.selectNodeContents(texte);
    const x = r.getBoundingClientRect(); return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1) }; };
  //  L'ENCRE D'UNE LIGNE : le plus haut et le plus bas de ce qui se voit
  //  — son glyphe et son texte.
  const encreLigne = (n) => { if (!n) return null;
    const parts = [encreSvg(n.querySelector("svg")), encreTexte(n)].filter(Boolean);
    if (!parts.length) return null;
    return { y: Math.min(...parts.map((p) => p.y)), bas: Math.max(...parts.map((p) => p.bas)) }; };
  const h1 = document.querySelector("h1");
  const avatar = h1?.parentElement?.parentElement?.firstElementChild;
  const booking = document.querySelector("[data-booking-fiche]");
  const rangee = document.querySelector("[data-rangee-actions]");
  const site = [...document.querySelectorAll("a")].find((a) => /exemple\\.test/.test(a.href));
  const bio = [...document.querySelectorAll("p")].find((p) => /bio de banc/.test(p.textContent));
  const styles = document.querySelector("[data-styles-fiche]");
  const prat = document.querySelector("[data-pratique-fiche]");
  const fusion = document.querySelector("[data-capsules-fusionnees]");
  const capsulesDe = (n) => n ? [...n.querySelectorAll("span > span")].map((c) => c.textContent.trim()).filter(Boolean) : null;
  const compteurCapsules = styles ? styles.querySelector("button[aria-expanded]") : null;
  return {
    avatar: B(avatar), booking: B(booking), bookingEncre: encreLigne(booking), rangee: B(rangee),
    site: B(site), bio: B(bio), styles: B(styles), pratiques: B(prat),
    fusionnee: Boolean(fusion), memeLigne: Boolean(styles) && styles === prat,
    capsules: capsulesDe(styles), capsulesPratiques: capsulesDe(prat),
    compteurCapsules: compteurCapsules ? compteurCapsules.textContent.trim() : null,
    lignesDeCapsules: document.querySelectorAll("[data-styles-fiche], [data-pratique-fiche]").length,
    //  §1 — les deux airs, d'encre à encre.
    airAvatarBooking: booking && avatar ? +(encreLigne(booking).y - B(avatar).bas).toFixed(1) : null,
    airBookingRangee: booking && rangee ? +(B(rangee).y - encreLigne(booking).bas).toFixed(1) : null,
    //  §2 — les airs autour du site, de boîte à boîte (les blocs de la liste).
    airBioSite: bio && site ? +(B(site).y - B(bio).bas).toFixed(1) : null,
    airSiteStyles: site && styles ? +(B(styles).y - B(site).bas).toFixed(1) : null,
    airRangeeBio: rangee && bio ? +(B(bio).y - B(rangee).bas).toFixed(1) : null,
  };
}`;
const sonderProfil = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE_PROFIL);

//  ══ 1, 2 ET 3 · LES AIRS, L'ORDRE, LA FUSION ════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`874 · §1/§2 — ${mode} : les airs de l'en-tête et de la liste`);
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const v = await sonderProfil(page);
    verif("§1 — l'air sous le booking ÉGALE l'air sous l'avatar, à l'œil (encre à encre)",
      proche(v.airAvatarBooking, v.airBookingRangee, 1),
      `avatar→booking ${v.airAvatarBooking} · booking→badges ${v.airBookingRangee}`);
    verif("§1 — et cet air vaut les quarante pixels de l'en-tête, à un pixel et demi près (l'encre de la ligne)",
      proche(v.airAvatarBooking, 40, 2) && proche(v.airBookingRangee, 40, 2),
      `${v.airAvatarBooking} · ${v.airBookingRangee}`);
    verif("§2 — L'ORDRE : bio, puis site, puis les badges",
      v.bio && v.site && v.styles && v.bio.bas <= v.site.y && v.site.bas <= v.styles.y,
      JSON.stringify({ bio: v.bio?.bas, site: v.site?.y, styles: v.styles?.y }));
    verif("§2 — vingt-huit pixels au-dessus du site comme en dessous",
      v.airBioSite === 28 && v.airSiteStyles === 28, `${v.airBioSite} · ${v.airSiteStyles}`);
    verif("§2 — et c'est l'air standard de la liste : la bio le porte aussi, sous la rangée",
      v.airRangeeBio === 28, String(v.airRangeeBio));
    //  §3 — DEUX styles : un seul bloc, styles puis compétences.
    titre(`874 · §3 — ${mode} : deux styles, un seul bloc de badges`);
    verif("un seul bloc : la ligne des styles porte aussi les compétences",
      v.fusionnee && v.memeLigne && v.lignesDeCapsules === 1, `fusionnée ${v.fusionnee} · même ligne ${v.memeLigne} · ${v.lignesDeCapsules} bloc(s)`);
    verif("… les styles d'abord, les compétences à la suite",
      v.capsules && v.capsules.slice(0, 2).join(" ") === "Blackwork Realism" && v.capsules.length > 2,
      JSON.stringify(v.capsules));
  } catch (e) {
    verif(`déroulement du banc 874 (§1/§2/§3 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 3 · CINQ STYLES : DEUX BLOCS — ET LE DÉBORD ═════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`874 · §3 — ${mode} : cinq styles, deux blocs séparés`);
    await page.goto(`${BASE}/artist/${CINQ}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-styles-fiche]", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const v = await sonderProfil(page);
    verif("deux blocs : les styles, puis les compétences",
      !v.fusionnee && !v.memeLigne && v.lignesDeCapsules === 2 && v.styles && v.pratiques && v.styles.bas <= v.pratiques.y,
      `fusionnée ${v.fusionnee} · ${v.lignesDeCapsules} bloc(s) · styles ${v.styles?.y} < pratiques ${v.pratiques?.y}`);
    verif("… séparés par l'air standard de la liste (vingt-huit)",
      v.styles && v.pratiques && Math.round(v.pratiques.y - v.styles.bas) === 28,
      String(v.styles && v.pratiques && Math.round(v.pratiques.y - v.styles.bas)));

    titre(`874 · §3 — ${mode} : au-delà de deux lignes, « +N ⌄ »`);
    //  On rétrécit la colonne jusqu'à ce que les capsules débordent : le
    //  compteur existant doit apparaître, et la ligne rester à deux.
    await page.setViewportSize(mode === "doigt" ? { width: 320, height: 844 } : { width: 1024, height: 900 });
    await page.goto(`${BASE}/artist/${DEBORD}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-styles-fiche]", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const d = await page.evaluate(() => {
      const ligne = document.querySelector("[data-styles-fiche]");
      const zone = ligne?.firstElementChild;
      const bouton = ligne?.querySelector("button[aria-expanded]");
      return { compteur: bouton?.textContent.trim() ?? null, deplie: bouton?.getAttribute("aria-expanded"),
        hauteur: zone ? Math.round(zone.getBoundingClientRect().height) : null,
        rogne: zone ? zone.scrollHeight > zone.clientHeight + 1 : null,
        lignes: zone ? new Set([...zone.children].map((c) => Math.round(c.getBoundingClientRect().top))).size : null };
    });
    verif("la ligne tient en DEUX lignes au plus, sans rien rogner",
      d.lignes !== null && d.lignes <= 2 && d.rogne === false, `${d.lignes} ligne(s) · rogné ${d.rogne}`);
    if (d.compteur) verif(`… et la seconde finit par « ${d.compteur} » (le mécanisme de la nº 491)`, /^\+\d+$/.test(d.compteur), d.compteur);
    else verif("… (tout tient : aucun compteur attendu à cette largeur)", d.lignes <= 2, `${d.lignes} ligne(s)`);
  } catch (e) {
    verif(`déroulement du banc 874 (§3 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 4 · LE SURTITRE, LE COMPTEUR ════════════════════════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`874 · §4 — ${mode} : plus de surtitre, le compteur sur la ligne du titre`);
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const g = await page.evaluate(() => {
      const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
        return { y: +r.top.toFixed(1), bas: +r.bottom.toFixed(1), g: +r.left.toFixed(1), d: +r.right.toFixed(1) }; };
      const visible = (n) => Boolean(n) && n.getClientRects().length > 0;
      //  Le fil est RENDU aux deux appareils et masqué au web (règle
      //  nº 60) : on ne mesure que le bloc qui se voit.
      const doigt = [...document.querySelectorAll("[data-carte-de-galerie]")].find(visible) ?? null;
      //  nº 876 — au web aussi, c'est la carte du fil (plus de bandes).
      const bloc = doigt;
      const compteur = bloc?.querySelector("[data-compteur-galerie]");
      const titreG = bloc?.querySelector("[data-titre-galerie]");
      const cadre = bloc?.querySelector("[data-cadre-de-galerie]");
      const s = compteur ? getComputedStyle(compteur) : null;
      return { surtitres: document.querySelectorAll("[data-surtitre-galerie]").length,
        compteur: compteur?.textContent.trim() ?? null, corps: s?.fontSize, graisse: s?.fontWeight, couleur: s?.color,
        boiteCompteur: B(compteur), boiteTitre: B(titreG),
        pastilleDansLaPhoto: cadre ? [...cadre.querySelectorAll("*")].map((e) => e.textContent.trim()).some((t) => /^\d+\/\d+$/.test(t)) : null,
        cartes: [...document.querySelectorAll("[data-carte-de-galerie]")].filter(visible).length };
    });
    verif("plus AUCUN surtitre de galerie sur la page", g.surtitres === 0, String(g.surtitres));
    /*  ⚠️ LE NOMBRE DE GAUCHE N'EST PAS LE MÊME AUX DEUX APPAREILS, et
        c'est la règle de la nº 522, pas une nouveauté : le compteur du
        WEB compte la DERNIÈRE vignette VUE (deux cases se voient dans la
        rangée, d'où « 2/20 »), celui du DOIGT la photo REGARDÉE dans la
        carte (« 1/20 » au repos). Le banc éprouve donc le total, la
        place et l'écriture — pas un rang qui appartient à chaque
        surface. */
    //  nº 876 — au web aussi, le compteur est celui de la carte : « 1/20 »
    //  au repos (la photo regardée), plus « 2/20 » de la dernière vignette vue.
    verif("le compteur « 1/20 » est sur la ligne du titre, à son opposé",
      g.compteur === "1/20" &&
      g.boiteCompteur && g.boiteTitre && Math.abs(g.boiteCompteur.y - g.boiteTitre.y) <= 3 && g.boiteCompteur.g > g.boiteTitre.d,
      `${g.compteur} · titre→${g.boiteTitre?.d} compteur ${g.boiteCompteur?.g}`);
    verif("… gris, quatorze pixels, graisse normale — l'écriture du web, à l'identique",
      g.corps === "14px" && g.graisse === "400" && g.couleur === "rgb(168, 168, 176)",
      `${g.corps} · ${g.graisse} · ${g.couleur}`);
    verif(`§4 — ${mode === "doigt" ? "au doigt" : "au web (nº 876)"}, la carte du fil est là et la pastille a quitté la photo`,
      g.pastilleDansLaPhoto === false && g.cartes > 0, `pastille ${g.pastilleDansLaPhoto} · ${g.cartes} carte(s)`);
  } catch (e) {
    verif(`déroulement du banc 874 (§4 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 5 · LA CARTE DU WEB : PLEINE LARGEUR, UNE IMAGE ENTIÈRE ═══════
/*  ⛔ nº 876 — LES CASES À 60 % N'EXISTENT PLUS : les bandes du web sont
    parties, remplacées par les cartes de galerie du fil, une par rangée,
    à la largeur du CONTENU de la colonne de lecture (celle-ci porte
    `lg:px-3 lg:-mx-3`, douze pixels d'air de chaque côté pour que sa
    coupe horizontale n'emporte pas les liserés). La photo y est la
    galerie de carte de la nº 839 : UNE image entière dans l'encadré, la
    suivante hors champ — pas de seconde à 60 %. */
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("874 · §5 — web : la carte de galerie, pleine largeur, une image entière (nº 876)");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte-de-galerie] [data-case-de-carte]", { timeout: 20000 });
    await page.waitForTimeout(1200);
    const c = await page.evaluate(() => {
      const B = (n) => { const r = n.getBoundingClientRect(); return { g: +r.left.toFixed(1), d: +r.right.toFixed(1), l: +r.width.toFixed(1) }; };
      const colonne = document.querySelector("[data-colonne-lecture]");
      const st = getComputedStyle(colonne);
      const bc = B(colonne); const pg = parseFloat(st.paddingLeft), pd = parseFloat(st.paddingRight);
      const carte = document.querySelector("[data-carte-de-galerie]");
      const cadre = carte.querySelector("[data-cadre-de-galerie]");
      const cases = [...carte.querySelectorAll("[data-case-de-carte]")].map(B);
      return { colonne: { g: bc.g + pg, d: bc.d - pd, l: bc.l - pg - pd }, carte: B(carte), cadre: B(cadre), cases: cases.slice(0, 2), nCases: cases.length };
    });
    verif("la carte prend la largeur du contenu de la colonne de lecture", proche(c.carte.l, c.colonne.l, 1) && proche(c.carte.g, c.colonne.g, 1),
      `carte ${c.carte.g}→${c.carte.d} (${c.carte.l}) · colonne ${c.colonne.g}→${c.colonne.d} (${c.colonne.l})`);
    verif("la PREMIÈRE image est entière : une case = l'encadré", proche(c.cases[0].l, c.cadre.l, 1) && proche(c.cases[0].g, c.cadre.g, 1), `${c.cases[0].l} / ${c.cadre.l}`);
    //  Au repos, la piste de la nº 839 n'a qu'UNE case dans le document
    //  (la suivante n'arrive qu'au survol) : il n'y a plus de seconde
    //  image à montrer à 60 %.
    verif("… et aucune seconde image à 60 % : au repos, la piste n'a qu'une case (règle nº 839)", c.nCases === 1, `${c.nCases} case(s)`);
  } catch (e) {
    verif("déroulement du banc 874 (§5)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 6 · LA BARRE FIXE DU DOIGT ══════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt", { session: U });
  try {
    titre("874 · §6 — doigt : loupe → fanion = fanion → avatar");
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-zone-compte]", { timeout: 20000 });
    await page.waitForTimeout(2000);
    const b = await page.evaluate(() => {
      const zone = document.querySelector("[data-zone-compte]");
      //  L'ENCRE DE CHAQUE ACCÈS : le tracé du glyphe pour la loupe et le
      //  fanion, LE ROND pour l'avatar du compte (c'est lui qu'on voit).
      const encre = (n) => {
        const rond = n.querySelector("img, [class*='rounded-full'][class*='h-7']");
        if (rond) { const r = rond.getBoundingClientRect(); return { g: +r.left.toFixed(2), d: +r.right.toFixed(2), quoi: "rond" }; }
        const svg = n.querySelector("svg");
        if (!svg) { const r = n.getBoundingClientRect(); return { g: +r.left.toFixed(2), d: +r.right.toFixed(2), quoi: "boîte" }; }
        const r = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal; const e = r.width / (vb.width || 24);
        const x = svg.getBBox();
        const traits = [...svg.querySelectorAll("[stroke-width]")].map((p) => parseFloat(p.getAttribute("stroke-width")));
        const demi = (traits.length ? Math.max(...traits) : 0) / 2;
        return { g: +(r.left + (x.x - demi) * e).toFixed(2), d: +(r.left + (x.x + x.width + demi) * e).toFixed(2), quoi: "glyphe" };
      };
      const enfants = [...zone.children].map((n) => ({ boite: n.getBoundingClientRect(), encre: encre(n),
        cible: Math.round(n.getBoundingClientRect().height) }));
      return { airs: enfants.slice(1).map((e, i) => +(e.encre.g - enfants[i].encre.d).toFixed(2)),
        cibles: enfants.map((e) => e.cible), quoi: enfants.map((e) => e.encre.quoi),
        boites: enfants.slice(1).map((e, i) => +(e.boite.left - enfants[i].boite.right).toFixed(2)) };
    });
    verif("la barre montre bien la loupe, le fanion et le rond du compte", b.quoi.length === 3 && b.quoi[2] === "rond", JSON.stringify(b.quoi));
    verif("§6 — LES DEUX AIRS SONT ÉGAUX, à l'œil (encre à encre)", proche(b.airs[0], b.airs[1], 1),
      `loupe→fanion ${b.airs[0]} · fanion→avatar ${b.airs[1]}`);
    verif("la cible tactile ne rétrécit pas (46 px pour la loupe et le fanion)",
      b.cibles[0] === 46 && b.cibles[1] === 46, JSON.stringify(b.cibles));

    titre("874 · §6 — le squelette de la barre suit au pixel");
    const s = await page.evaluate(() => {
      const zone = document.querySelector("[data-zone-compte]");
      const avant = [...zone.children].map((n) => { const r = n.getBoundingClientRect(); return [+r.left.toFixed(1), +r.right.toFixed(1)]; });
      //  On rejoue la phase muette d'un connecté : les mêmes boîtes,
      //  peintes en ronds gris (globals.css, nº 815).
      const etat = zone.getAttribute("data-session");
      zone.setAttribute("data-session", "muette");
      const apres = [...zone.children].map((n) => { const r = n.getBoundingClientRect(); return [+r.left.toFixed(1), +r.right.toFixed(1)]; });
      const loupe = document.querySelector("[data-loupe-barre]");
      const peint = loupe ? getComputedStyle(loupe).backgroundColor : null;
      zone.setAttribute("data-session", etat ?? "prete");
      return { avant, apres, peint };
    });
    verif("les boîtes du squelette sont au pixel celles de la barre",
      JSON.stringify(s.avant) === JSON.stringify(s.apres), `${JSON.stringify(s.avant)} → ${JSON.stringify(s.apres)}`);
    verif("… et la loupe s'y peint en rond gris", s.peint !== null && s.peint !== "rgba(0, 0, 0, 0)", String(s.peint));
  } catch (e) {
    verif("déroulement du banc 874 (§6)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 7 · LE TITRE DE LA FENÊTRE SUPERPOSÉE (web) ═════════════════════
{
  const { nav, page } = await ouvrir("web");
  try {
    titre("874 · §7 — web : le titre hors cadre s'atténue");
    await page.goto(`${BASE}/search?style=blackwork&nature=tatouage`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-lien-carte][href^="/artist/"]', { timeout: 20000 });
    await page.waitForTimeout(1200);
    await page.locator('[data-lien-carte][href^="/artist/"]').first().click();
    await page.waitForFunction(() => document.querySelector("[data-titre-fenetre]"), null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    const t = await page.evaluate(() => {
      const n = document.querySelector("[data-titre-fenetre]");
      const s = getComputedStyle(n);
      const voile = document.querySelector("[data-voile-fiche]");
      const lum = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      //  Le fond RÉEL sous le titre : le voile (noir à 80 %) au-dessus du
      //  fond du site — on le recompose comme le navigateur le peint.
      const fondPage = getComputedStyle(document.body).backgroundColor;
      const [fr, fg, fb] = fondPage.match(/\d+(\.\d+)?/g).map(Number);
      const sousLeVoile = `rgb(${(fr * 0.2).toFixed(1)}, ${(fg * 0.2).toFixed(1)}, ${(fb * 0.2).toFixed(1)})`;
      const L1 = lum(s.color), L2 = lum(sousLeVoile);
      return { texte: n.textContent.trim(), couleur: s.color, corps: s.fontSize, graisse: s.fontWeight,
        voile: voile ? getComputedStyle(voile).backgroundColor : null, sousLeVoile,
        contraste: +((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2) };
    });
    verif("le titre n'est plus blanc pur : il prend le gris clair des sous-titres",
      t.couleur === "rgb(168, 168, 176)", `${t.couleur} — « ${t.texte} »`);
    verif("… il garde son corps et son gras (16 px, 700)", t.corps === "16px" && t.graisse === "700", `${t.corps} · ${t.graisse}`);
    verif("… et le contraste sur le voile reste au-dessus du seuil AAA (7:1)", t.contraste >= 7,
      `${t.contraste}:1 sur ${t.sousLeVoile} (voile ${t.voile})`);
  } catch (e) {
    verif("déroulement du banc 874 (§7)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

process.exit(bilan());
