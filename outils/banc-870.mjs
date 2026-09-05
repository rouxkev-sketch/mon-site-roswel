//  ██ BANC 870 — LES CORRECTIONS DE L'EN-TÊTE DU PROFIL ██
//  ==================================================================
//   1. LE TRAIT DU VA-ET-VIENT : la largeur du MOT plus VINGT-HUIT
//      pixels de chaque côté (nº 871-§1), centré sous lui, plus court
//      que son segment — sur « Ma sélection ». ⛔ SUR LE PROFIL, LA
//      nº 873-§2 L'ANNULE : trois onglets (Profile · Portfolio · Flash,
//      des LIENS), chacun un tiers, et le trait sur TOUTE la largeur de
//      l'onglet — c'est ce que ce banc mesure désormais là.
//   2. LE BOOKING : plus de point, LE CALENDRIER et le texte —
//      « Books open • 5-month wait », « Books open », « Books closed »,
//      et rien du tout quand rien n'est déclaré. Il a quitté le bloc du
//      nom (nº 871-§2) et se pose ENTRE LUI ET LES BADGES (nº 872-§2),
//      à l'air de l'en-tête.
//   3. LE SITE : sa ligne, son icône, son BLEU — sous la bio.
//   4. TROIS BADGES : Follow et Instagram de MÊME LARGEUR, icône à
//      gauche du mot, puis le partage — petit, icône seule ; QUARANTE
//      de haut (nº 871-§4), toute la largeur ensemble.
//   4 bis. LES ROBES (nº 871-§5) : « Follow » en BLANC, « Following » et
//      les deux autres sur l'aplat d'action ; l'icône et le mot CENTRÉS
//      ENSEMBLE dans les deux états. Les dessins sont le PLUS et la
//      COCHE (nº 871-§6), plus aucun personnage — au trait de 2,2, un
//      cran au-dessus de la famille (nº 872-§1).
//   5. LES DEUX AIRS : au-dessus de la rangée, celui qui sépare le
//      va-et-vient du haut de l'avatar ; en dessous, celui qui sépare
//      deux blocs du profil.
//   6. FOLLOW DEPUIS LE BADGE : l'état en base, aucun cran, et le
//      retour rend la page d'avant (l'acquis de la nº 868).
//  Web ET doigt. L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger, rest, effacer } from "./banc-socle.mjs";

const GABARIT = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
//  Les jetons de la charte sombre (config/tatouage, COULEURS_SOMBRE).
const GRIS = "rgb(168, 168, 176)";        // texteDoux   #A8A8B0
const BLANC = "rgb(242, 242, 244)";       // texte       #F2F2F4
const CARTE_CLAIR = "rgb(32, 38, 45)";    // carteClair  #20262D
const BLEU = "rgb(127, 169, 238)";        // lien  #7FA9EE
//  L'air de référence : celui qui sépare le va-et-vient du haut de
//  l'avatar (le `mt-10` du bloc du nom) et celui de la liste (`gap-y-6`).
const AIR_ENTETE = 40, AIR_BLOC = 24, DEBORD_TRAIT = 28, HAUTEUR_BADGE = 40;
//  §5 (nº 871) — la robe blanche de la nº 528 : l'aplat `sombre-texte`
//  et le fond de page en texte.
const BLANC_FOND = "rgb(242, 242, 244)", FOND_PAGE = "rgb(11, 15, 20)";
//  §6 (nº 871) — les deux signes, lus à la source (Icones).
const PLUS = "M12 5v14M5 12h14", COCHE = "M5 12.5 9.5 17 19 7.5";
//  §1 (nº 872) — le cran au-dessus du trait de la famille (1,8).
const TRAIT_SIGNE = "2.2";

const U = { id: "30000000-0000-4000-8000-000000000870", email: "banc-870@yokofolio.test" };
await rest("auth/v1/admin/users", { method: "POST", body: { id: U.id, email: U.email } }).catch(() => {});

const T = Date.now();
const photos = (id, prefixe, n) => ranger("photos_tatoueur", Array.from({ length: n }, (_, k) => k + 1).map((i) => ({
  id: `${prefixe}${i}00-0000-4000-8000-${String(i).padStart(12, "0")}`, tatoueur_id: id, style: "blackwork",
  rendu: ["black", "black_and_grey", "color"][(i - 1) % 3], nature: "tatouage",
  url: `/images-demo/tatouage/blackwork-${((i - 1) % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${((i - 1) % 3) + 1}.svg`,
  ordre: i, cree_le: "2026-01-01T00:00:00Z" })));

//  LA FICHE COMPLÈTE : salon, booking à délai de cinq mois, Instagram,
//  site avec un titre choisi, bio, styles et techniques.
const ID = `31000000-0000-4000-8000-${T.toString(16).padStart(12, "0")}`;
const SLUG = `banc870-${T}`;
await ranger("tatoueurs", { ...GABARIT, id: ID, slug: SLUG, nom: "Banc 870", type_fiche: "salon", etablissement: "Salon 870",
  styles: ["blackwork", "realisme", "trash-polka"], ville_slug: `lyon-${SLUG}`,
  bio: "La fiche complète du banc 870.", site_web: "https://exemple.test/870", titre_site_web: "Mon site à moi",
  lien_instagram: "https://instagram.com/banc870", dm_instagram: true, booking: "delai", booking_mois: 5,
  filtres_technique: ["machine"], filtres_composition: ["small"] });
await photos(ID, "8700", 2);
//  LES TROIS AUTRES ÉTATS DU BOOKING, ET UNE FICHE SANS INSTAGRAM.
const forger = async (suffixe, prefixe, champs) => {
  const id = `3${suffixe}000000-0000-4000-8000-${(T + suffixe).toString(16).padStart(12, "0")}`;
  const slug = `banc870-${suffixe}-${T}`;
  await ranger("tatoueurs", { ...GABARIT, id, slug, nom: `Banc 870 ${suffixe}`, styles: ["blackwork"],
    ville_slug: `lyon-${slug}`, bio: `Fiche ${suffixe} du banc 870.`, ...champs });
  await photos(id, prefixe, 1);
  return { id, slug };
};
const OUVERT = await forger(1, "8701", { booking: "ouvert", booking_mois: null });
const FERME = await forger(2, "8702", { booking: "ferme", booking_mois: null });
const MUET = await forger(3, "8703", { booking: null, booking_mois: null });
const SANS_MOIS = await forger(4, "8704", { booking: "delai", booking_mois: null });
const NU = await forger(5, "8705", { booking: "ouvert", booking_mois: null, lien_instagram: null,
  site_web: null, titre_site_web: null, type_fiche: "artiste", etablissement: null });

//  ══ LA LECTURE D'UN PROFIL ══════════════════════════════════════════
const LIRE = `() => {
  const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { x: +r.left.toFixed(1), y: +r.top.toFixed(1), d: +r.right.toFixed(1), bas: +r.bottom.toFixed(1),
      w: +r.width.toFixed(1), h: +r.height.toFixed(1), centre: +((r.left + r.right) / 2).toFixed(1) }; };
  const encre = (n) => { if (!n) return null; const r = document.createRange(); r.selectNodeContents(n);
    const b = r.getBoundingClientRect(); return { w: +b.width.toFixed(1), centre: +((b.left + b.right) / 2).toFixed(1) }; };
  const h1 = document.querySelector("h1");
  const colonne = h1?.parentElement;
  const avatar = colonne?.previousElementSibling;
  const type = colonne?.querySelector("p");
  const booking = document.querySelector("[data-booking-fiche]");
  const rangee = document.querySelector("[data-rangee-actions]");
  const actions = rangee ? [...rangee.querySelectorAll("[data-action-fiche]")].map((a) => {
    const s = getComputedStyle(a);
    const svg = a.querySelector("svg");
    const mot = [...a.children].find((n) => n.tagName === "SPAN" && !n.querySelector("svg"));
    return { cle: a.dataset.actionFiche, balise: a.tagName, href: a.getAttribute("href"), cible: a.getAttribute("target"),
      aria: a.getAttribute("aria-label"), presse: a.getAttribute("aria-pressed"), sansCran: a.hasAttribute("data-sans-cran"),
      ...B(a), fond: s.backgroundColor, trait: s.borderTopWidth, rayon: s.borderTopLeftRadius, corps: s.fontSize,
      couleur: s.color, icone: svg ? { taille: Math.round(svg.getBoundingClientRect().width),
        x: +svg.getBoundingClientRect().left.toFixed(1),
        chemin: (svg.querySelector("path")?.getAttribute("d") ?? "").replace(/\\s+/g, " ").trim(),
        trait: svg.querySelector("path")?.getAttribute("stroke-width") ?? null } : null,
      mot: mot ? mot.textContent.trim().replace(/^(Following|Follow)(Follow|Following)*$/, "$1") : null,
      motX: mot ? +mot.getBoundingClientRect().left.toFixed(1) : null,
      motD: mot ? +mot.getBoundingClientRect().right.toFixed(1) : null }; }) : null;
  //  nº 873 — le va-et-vient du profil est une NAVIGATION (trois liens).
  const groupe = document.querySelector('nav[aria-label="Profile, portfolio or flash"]');
  const rangeeDuHaut = groupe?.parentElement;
  const boiteLigne = groupe ? [...groupe.children].find((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3) : null;
  const segment = boiteLigne?.lastElementChild;
  //  SUR LE PROFIL IL N'Y A PAS DE LIGNE GRISE (le va-et-vient la refuse,
  //  nº 382-§3 : la rangée porte son propre trait) — la boîte n'a donc
  //  qu'un enfant, le segment. On ne relève une grise que s'il y en a deux.
  const grise = boiteLigne && boiteLigne.children.length > 1 ? boiteLigne.firstElementChild : null;
  const trait = segment?.firstElementChild;
  const onglets = groupe ? [...groupe.querySelectorAll("a")].map((b) => ({
    mot: b.textContent.trim(), actif: b.getAttribute("aria-current") === "page", ...B(b), encre: encre(b) })) : null;
  const ligne = (m) => { const n = document.querySelector("[" + m + "]"); return n ? { ...B(n), svg: n.querySelectorAll("svg").length } : null; };
  const bio = [...document.querySelectorAll("p")].find((p) => /banc 870/i.test(p.textContent) && /fiche/i.test(p.textContent));
  const site = [...document.querySelectorAll("a")].find((a) => /exemple\\.test/.test(a.href));
  const adresse = [...document.querySelectorAll("a, p, span")].reverse().find((n) => /Lyon/.test(n.textContent) && n.children.length === 0);
  return {
    h1: B(h1), avatar: B(avatar), type: type ? { ...B(type), mot: type.textContent.trim() } : null,
    booking: booking ? { ...B(booking), mot: booking.textContent.trim(), valeur: booking.dataset.bookingFiche,
      svg: booking.querySelectorAll("svg").length, points: [...booking.querySelectorAll("span")].filter((n) => Math.round(n.getBoundingClientRect().width) === 8).length,
      couleurIcone: getComputedStyle(booking).color,
      couleurMot: getComputedStyle([...booking.querySelectorAll("span")].find((n) => n.textContent.trim().startsWith("Books"))).color } : null,
    rangee: B(rangee), actions, groupe: B(groupe), onglets,
    grise: grise ? { ...B(grise), h: +grise.getBoundingClientRect().height.toFixed(2) } : null,
    segment: B(segment), trait: trait ? { ...B(trait), fond: getComputedStyle(trait).backgroundColor,
      rayon: getComputedStyle(trait).borderTopLeftRadius } : null,
    largeurColonne: rangeeDuHaut ? +(rangeeDuHaut.clientWidth - parseFloat(getComputedStyle(rangeeDuHaut).paddingLeft) - parseFloat(getComputedStyle(rangeeDuHaut).paddingRight)).toFixed(1) : null,
    bio: B(bio), site: site ? { ...B(site), texte: site.textContent.trim(), couleur: getComputedStyle(site).color,
      svg: site.querySelectorAll("svg").length, cible: site.getAttribute("target") } : null,
    styles: ligne("data-styles-fiche"), pratiques: ligne("data-pratique-fiche"), adresse: B(adresse) }; }`;
const lireProfil = (page) => page.evaluate(new Function("return " + LIRE)());
const proche = (a, b, marge = 1.5) =>
  a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) <= marge;

//  ══ 1 À 5 · LE PROFIL COMPLET, AUX DEUX APPAREILS ═══════════════════
for (const mode of ["doigt", "web"]) {
  const { nav, page } = await ouvrir(mode);
  try {
    titre(`870 · §1-§5 — le profil complet au ${mode}`);
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
    await page.waitForTimeout(1500);
    const v = await lireProfil(page);
    const actif = v.onglets?.find((o) => o.actif);
    //  §1 — LE TRAIT (nº 873-§2 : sur TOUTE la largeur de l'onglet ; la
    //  largeur du mot + 28 de la nº 871 ne vaut plus que pour « Ma
    //  sélection », plus bas)
    verif("§1 (nº 873) — trois onglets, des liens : Profile · Portfolio · Flash",
      v.onglets?.map((o) => o.mot).join(" · ") === "Profile · Portfolio · Flash", v.onglets?.map((o) => o.mot).join(" · "));
    verif("§1 (nº 873) — le trait prend TOUTE la largeur de l'onglet actif",
      v.trait && v.segment && proche(v.trait.w, v.segment.w, 0.6) && proche(v.trait.w, (v.groupe?.w ?? 0) / 3, 1),
      `trait ${v.trait?.w} · segment ${v.segment?.w} · tiers ${((v.groupe?.w ?? 0) / 3).toFixed(1)}`);
    verif("§1 — il est centré sous le mot (le mot est centré dans son onglet)", proche(v.trait?.centre, actif?.encre.centre, 2),
      `${v.trait?.centre} contre ${actif?.encre.centre}`);
    verif("§1 — il garde sa robe : trois pixels, rose, extrémités rondes, au bas de la rangée",
      v.trait?.h === 3 && v.trait?.fond !== "rgba(0, 0, 0, 0)" && parseFloat(v.trait?.rayon) >= 3 &&
      proche(v.trait?.bas, v.segment?.bas, 0.6), JSON.stringify(v.trait));
    verif("§1 — le segment fait un tiers de la rangée (c'est lui qui glisse), sans ligne grise",
      proche(v.segment?.w, (v.groupe?.w ?? 0) / 3, 1) && v.grise === null,
      `segment ${v.segment?.w} · groupe ${v.groupe?.w} · ligne grise ${v.grise === null ? "aucune (voulu)" : "présente"}`);
    //  §2 — LE BOOKING
    verif("§2 — la ligne du booking porte LE CALENDRIER et aucun point de couleur",
      v.booking?.svg === 1 && v.booking?.points === 0, JSON.stringify(v.booking && { svg: v.booking.svg, points: v.booking.points }));
    verif("§2 — elle dit « Books open • 5-month wait »", v.booking?.mot === "Books open • 5-month wait", v.booking?.mot);
    verif("§2 — l'icône est grise, le mot est blanc (l'écriture d'avant la nº 869)",
      v.booking?.couleurIcone === GRIS && v.booking?.couleurMot === BLANC,
      `${v.booking?.couleurIcone} · ${v.booking?.couleurMot}`);
    verif("§2 (nº 872) — la ligne du booking est SOUS LE BLOC DU NOM et AU-DESSUS des badges",
      v.booking && v.type && v.booking.y >= v.avatar.bas && v.booking.bas <= v.rangee.y && v.booking.x < v.avatar.d,
      JSON.stringify({ avatar: v.avatar?.bas, booking: v.booking?.y, rangee: v.rangee?.y }));
    verif("§2 (nº 871) — le bloc du nom n'a plus que le nom et le type",
      v.h1 && v.type && v.booking.y > v.h1.bas + 40, `nom ${v.h1?.bas} · booking ${v.booking?.y}`);
    //  §3 — LE SITE
    verif("§3 — le site a sa ligne, son icône et le titre choisi",
      v.site?.texte === "Mon site à moi" && v.site?.svg === 1 && v.site?.cible === "_blank", JSON.stringify(v.site && { texte: v.site.texte, svg: v.site.svg }));
    verif("§3 — son lien est BLEU (ce qui sort du site)", v.site?.couleur === BLEU, v.site?.couleur);
    verif("§3 (nº 872) — le site ouvre les lignes, sous la rangée et au-dessus de la bio",
      v.bio && v.site && v.rangee && v.rangee.bas <= v.site.y && v.site.bas <= v.bio.y,
      JSON.stringify({ rangee: v.rangee?.bas, site: v.site?.y, bio: v.bio?.y }));
    verif("§3 — et il n'est plus un badge de la rangée",
      (v.actions ?? []).every((a) => a.cle !== "website"), (v.actions ?? []).map((a) => a.cle).join(" · "));
    //  §4 — LES TROIS BADGES
    const cles = v.actions?.map((a) => a.cle) ?? [];
    verif("§4 — trois badges : Follow, Instagram, le partage", JSON.stringify(cles) === JSON.stringify(["follow", "instagram", "share"]), cles.join(" · "));
    const [suivre, insta, partage] = v.actions ?? [];
    verif("§4 — les deux grands ont la MÊME LARGEUR", proche(suivre?.w, insta?.w, 0.6), `${suivre?.w} contre ${insta?.w}`);
    verif("§4 — le partage est petit, carré, sans mot", partage && partage.mot === null && proche(partage.w, partage.h) && partage.w < suivre.w / 2,
      JSON.stringify(partage && { w: partage.w, h: partage.h, mot: partage.mot }));
    verif(`§4 (nº 871) — même hauteur pour les trois : ${HAUTEUR_BADGE} px`,
      v.actions?.every((a) => a.h === HAUTEUR_BADGE), v.actions?.map((a) => a.h).join(" · "));
    verif("§5 (nº 871) — « Follow » porte LE BLANC de la nº 528 (aplat blanc, texte au fond de page)",
      suivre?.fond === BLANC_FOND && suivre?.couleur === FOND_PAGE, `${suivre?.fond} · ${suivre?.couleur}`);
    verif("§5 — les deux autres gardent l'aplat d'action, sans contour, même boîte",
      [insta, partage].every((a) => a?.fond === CARTE_CLAIR && a?.couleur === BLANC && a?.trait === "0px" && a?.rayon === "8px" && a?.corps === "14px"),
      JSON.stringify([insta, partage].map((a) => [a?.fond, a?.couleur, a?.trait, a?.rayon])));
    verif("§5 — l'icône et le mot sont CENTRÉS ENSEMBLE dans le badge (plus de trou à droite)",
      [suivre, insta].every((a) => proche((a.icone.x + a.motD) / 2, (a.x + a.d) / 2, 1)),
      JSON.stringify([suivre, insta].map((a) => [+((a.icone.x + a.motD) / 2).toFixed(1), +((a.x + a.d) / 2).toFixed(1)])));
    verif("§6 (nº 871) — le dessin de « Follow » est LE PLUS, et il fait vingt pixels",
      suivre?.icone?.chemin === PLUS && suivre?.icone?.taille === 20, `${suivre?.icone?.chemin} (${suivre?.icone?.taille})`);
    verif(`§1 (nº 872) — son trait est de ${TRAIT_SIGNE}, un cran au-dessus de la famille`,
      suivre?.icone?.trait === TRAIT_SIGNE, `${suivre?.icone?.trait} (les deux autres badges : ${insta?.icone?.trait} · ${partage?.icone?.trait})`);
    verif("§4 — l'icône est À GAUCHE du mot dans les deux grands",
      suivre?.icone && insta?.icone && suivre.icone.x < suivre.motX && insta.icone.x < insta.motX,
      JSON.stringify([[suivre?.icone?.x, suivre?.motX], [insta?.icone?.x, insta?.motX]]));
    verif("§4 — les trois occupent ENSEMBLE toute la largeur de la colonne",
      proche(v.rangee?.w, v.largeurColonne, 2) && proche(partage.d, v.rangee.d, 1) && proche(suivre.x, v.rangee.x, 1),
      `rangée ${v.rangee?.w} · colonne ${v.largeurColonne}`);
    verif("§4 — Follow porte son nom, son état et le marqueur du filet (nº 868)",
      suivre?.balise === "BUTTON" && suivre?.aria === "Follow Banc 870" && suivre?.presse === "false" && suivre?.sansCran === true &&
      suivre?.mot === "Follow" && insta?.balise === "A" && insta?.mot === "Instagram" && partage?.aria === "Share Banc 870's portfolio",
      JSON.stringify([suivre?.aria, suivre?.mot, insta?.mot, partage?.aria]));
    //  §5 — LES DEUX AIRS
    verif("§2 (nº 872) — l'air entre le bas de l'avatar et LE BOOKING = celui du va-et-vient au haut de l'avatar",
      proche(v.booking?.y - v.avatar?.bas, AIR_ENTETE, 1) && proche(v.avatar?.y - v.groupe?.bas, AIR_ENTETE, 4),
      `sous l'avatar ${(v.booking?.y - v.avatar?.bas)?.toFixed?.(1)} · au-dessus ${(v.avatar?.y - v.groupe?.bas)?.toFixed?.(1)}`);
    verif("§5-a — la rangée garde le même air, mesuré depuis le booking",
      proche(v.rangee?.y - v.booking?.bas, AIR_ENTETE, 1), `${(v.rangee?.y - v.booking?.bas)?.toFixed?.(1)}`);
    verif("§5-b — l'air sous la rangée = l'air standard entre deux blocs (la première ligne est le site)",
      proche(v.site?.y - v.rangee?.bas, AIR_BLOC, 1) && proche(v.pratiques?.y - v.styles?.bas, AIR_BLOC, 1),
      `sous la rangée ${(v.site?.y - v.rangee?.bas)?.toFixed?.(1)} · entre deux lignes ${(v.pratiques?.y - v.styles?.bas)?.toFixed?.(1)}`);
    verif("§2 (nº 872) — l'ordre : nom, booking, rangée, site, bio, styles, techniques, adresse",
      v.h1.y < v.booking.y && v.booking.bas <= v.rangee.y && v.rangee.bas <= v.site.y && v.site.bas <= v.bio.y
      && v.bio.bas <= v.styles.y && v.styles.bas <= v.pratiques.y && v.pratiques.bas <= v.adresse.y,
      JSON.stringify({ nom: v.h1?.y, booking: v.booking?.y, rangee: v.rangee?.y, site: v.site?.y, bio: v.bio?.y, styles: v.styles?.y, techniques: v.pratiques?.y, adresse: v.adresse?.y }));
  } catch (e) {
    verif(`déroulement du banc 870 (§1-§5 ${mode})`, false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 2 · LES QUATRE AUTRES ÉTATS DU BOOKING, ET LA FICHE NUE ═════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("870 · §2 — les autres états du booking, et la rangée à deux badges");
    for (const [fiche, attendu] of [[OUVERT, "Books open"], [FERME, "Books closed"], [MUET, null], [SANS_MOIS, null]]) {
      await page.goto(`${BASE}/artist/${fiche.slug}?entree=lien`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
      await page.waitForTimeout(700);
      const v = await lireProfil(page);
      verif(`§2 — ${attendu ?? "rien de déclaré (ou un délai sans mois) : aucune ligne"}`,
        attendu ? (v.booking?.mot === attendu && v.booking?.svg === 1) : v.booking === null,
        JSON.stringify(v.booking && { mot: v.booking.mot, svg: v.booking.svg }));
    }
    await page.goto(`${BASE}/artist/${NU.slug}?entree=lien`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
    await page.waitForTimeout(700);
    const n = await lireProfil(page);
    verif("§4 — sans Instagram ni site : Follow et le partage, et la rangée fait toujours toute la largeur",
      JSON.stringify(n.actions?.map((a) => a.cle)) === JSON.stringify(["follow", "share"]) &&
      proche(n.rangee?.w, n.largeurColonne, 2) && proche(n.actions[1].d, n.rangee.d, 1),
      `${(n.actions ?? []).map((a) => a.cle).join(" · ")} · rangée ${n.rangee?.w} / colonne ${n.largeurColonne}`);
    verif("§3 — sans site, aucune ligne de site n'apparaît", n.site === null || n.site === undefined, JSON.stringify(n.site));
    verif("§5-b — sans site, c'est la bio qui ouvre la liste (ses quatre pixels en plus, comme partout)",
      proche(n.bio?.y - n.rangee?.bas, AIR_BLOC + 4, 1), `${(n.bio?.y - n.rangee?.bas)?.toFixed?.(1)}`);
    verif("§2 (nº 872) — et le booking y est toujours au-dessus des badges",
      n.booking && n.rangee && n.booking.bas <= n.rangee.y, JSON.stringify({ booking: n.booking?.y, rangee: n.rangee?.y }));
  } catch (e) {
    verif("déroulement du banc 870 (§2 états)", false, String(e).slice(0, 400));
  } finally { await nav.close(); }
}

//  ══ 1 · LE MÊME TRAIT SUR « MA SÉLECTION » (le même composant) ══════
{
  await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
  await ranger("tatoueurs_suivis", [{ utilisateur_id: U.id, tatoueur_id: ID, cree_le: "2026-01-01T00:00:00Z" }]);
  for (const mode of ["doigt", "web"]) {
    const { nav, page } = await ouvrir(mode, { session: U });
    try {
      titre(`870 · §1 — le trait de « Ma sélection » au ${mode}`);
      await page.goto(`${BASE}/my-favorites?selection=suivis`, { waitUntil: "networkidle" });
      await page.waitForSelector("[role=radiogroup][aria-label='Favorites or following']", { timeout: 20000 });
      await page.waitForTimeout(1200);
      const v = await page.evaluate(() => {
        const B = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
          return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), bas: +r.bottom.toFixed(1), centre: +((r.left + r.right) / 2).toFixed(1) }; };
        const groupe = document.querySelector("[role=radiogroup][aria-label='Favorites or following']");
        const boite = [...groupe.children].find((n) => n.tagName === "DIV" && Math.round(n.getBoundingClientRect().height) === 3);
        const segment = boite?.lastElementChild;
        const trait = segment?.firstElementChild;
        const actif = [...groupe.querySelectorAll("[role=radio]")].find((b) => b.getAttribute("aria-checked") === "true");
        const r = document.createRange(); r.selectNodeContents(actif);
        const encre = r.getBoundingClientRect();
        return { trait: B(trait), segment: B(segment), fond: trait ? getComputedStyle(trait).backgroundColor : null,
          mot: actif.textContent.trim(), encre: { w: +encre.width.toFixed(1), centre: +((encre.left + encre.right) / 2).toFixed(1) } };
      });
      verif("§1 — le trait y fait aussi la largeur du libellé plus vingt-huit de chaque côté",
        proche(v.trait?.w, v.encre.w + 2 * DEBORD_TRAIT, 2), `trait ${v.trait?.w} · libellé « ${v.mot} » ${v.encre.w}`);
      verif("§1 — centré sous lui, et plus court que son segment",
        proche(v.trait?.centre, v.encre.centre, 2) && v.trait?.w < v.segment?.w, `${v.trait?.centre} contre ${v.encre.centre} · ${v.trait?.w} < ${v.segment?.w}`);
      verif("§1 — trois pixels, et le rose du site", v.trait?.h === 3 && v.fond !== "rgba(0, 0, 0, 0)", `${v.trait?.h} px ${v.fond}`);
    } catch (e) {
      verif(`déroulement du banc 870 (§1 Ma sélection ${mode})`, false, String(e).slice(0, 400));
    } finally { await nav.close(); }
  }
}

//  ══ 6 · FOLLOW DEPUIS LE BADGE : LA BASE, ET LE RETOUR ══════════════
{
  const etat = (page) => page.evaluate(() => ({ url: location.pathname + location.search, len: history.length, cran: Boolean((history.state ?? {}).retourReconstruit) }));
  const ORIGINE = "/search?style=blackwork&nature=tatouage";
  for (const suiviAuDepart of [false, true]) {
    await effacer("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
    if (suiviAuDepart) await ranger("tatoueurs_suivis", [{ utilisateur_id: U.id, tatoueur_id: ID, cree_le: "2026-01-01T00:00:00Z" }]);
    const { nav, page } = await ouvrir("doigt", { session: U });
    try {
      const geste = suiviAuDepart ? "Unfollow" : "Follow";
      titre(`870 · §6 — ${geste} depuis le badge`);
      await page.goto(`${BASE}${ORIGINE}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-rangee-actions]", { timeout: 20000 });
      await page.waitForTimeout(1500);
      const avant = await lireProfil(page);
      const badge = avant.actions?.find((a) => a.cle === "follow");
      verif(`au départ : « ${suiviAuDepart ? "Following" : "Follow"} », ${suiviAuDepart ? "l'aplat d'action et la coche" : "le blanc et le plus"}`,
        badge?.mot === (suiviAuDepart ? "Following" : "Follow") && badge?.presse === String(suiviAuDepart)
        && badge?.fond === (suiviAuDepart ? CARTE_CLAIR : BLANC_FOND)
        && badge?.icone?.chemin === (suiviAuDepart ? COCHE : PLUS),
        JSON.stringify(badge && { mot: badge.mot, fond: badge.fond, chemin: badge.icone?.chemin }));
      const surLeProfil = await etat(page);
      await page.locator('[data-rangee-actions] [data-action-fiche="follow"]').tap();
      await page.waitForTimeout(1800);
      const apres = await lireProfil(page);
      const bascule = apres.actions?.find((a) => a.cle === "follow");
      verif("l'appui bascule le mot, LE DESSIN et LA ROBE (nº 871)",
        bascule?.mot === (suiviAuDepart ? "Follow" : "Following") && bascule?.presse === String(!suiviAuDepart)
        && bascule?.fond === (suiviAuDepart ? BLANC_FOND : CARTE_CLAIR)
        && bascule?.icone?.chemin === (suiviAuDepart ? PLUS : COCHE),
        JSON.stringify(bascule && { mot: bascule.mot, fond: bascule.fond, chemin: bascule.icone?.chemin }));
      verif(`… et LA COCHE porte le même trait que le plus (${TRAIT_SIGNE})`, bascule?.icone?.trait === TRAIT_SIGNE, String(bascule?.icone?.trait));
      verif("… et l'icône reste collée au mot, le couple centré", proche((bascule.icone.x + bascule.motD) / 2, (bascule.x + bascule.d) / 2, 1),
        `${((bascule.icone.x + bascule.motD) / 2).toFixed(1)} contre ${((bascule.x + bascule.d) / 2).toFixed(1)}`);
      verif("… et la largeur des deux grands badges n'a pas bougé", proche(bascule?.w, apres.actions[1]?.w, 0.6),
        `${bascule?.w} contre ${apres.actions?.[1]?.w}`);
      const enBase = await lire("tatoueurs_suivis", `utilisateur_id=eq.${U.id}`);
      verif("EN BASE : l'état suit le geste", suiviAuDepart ? enBase.length === 0 : (enBase.length === 1 && enBase[0].tatoueur_id === ID), JSON.stringify(enBase));
      const pile = await etat(page);
      verif("aucune entrée d'historique, aucun cran (nº 868)", pile.len === surLeProfil.len && pile.cran === false, `pile ${surLeProfil.len} → ${pile.len} · cran ${pile.cran}`);
      await page.goBack();
      await page.waitForTimeout(2500);
      const retour = await etat(page);
      verif("LE RETOUR REND LA PAGE D'AVANT", retour.url === ORIGINE, `${retour.url} (attendu ${ORIGINE})`);
    } catch (e) {
      verif(`déroulement du banc 870 (§6 ${suiviAuDepart})`, false, String(e).slice(0, 400));
    } finally { await nav.close(); }
  }
}

process.exit(bilan());
