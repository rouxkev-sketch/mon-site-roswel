//  ██ BANC 866 — LE FIL DE GALERIES DEPUIS L'ONGLET PORTFOLIO, L'HISTO-
//  GRAMME DES VUES, LES AIRS DU PIED ██
//  ==================================================================
//   1. LE FIL DE GALERIES (doigt) — REPRIS PAR LA nº 873-§3 : la page
//      Portfolio EST le fil (trois cartes, les galeries de tattoos) et la
//      page Flash aussi (trois cartes de flashs), une carte par galerie,
//      dans l'ordre du profil, sous leurs titres ; glisser dans une carte
//      ne fait défiler QUE ses photos. ⛔ Plus de bandes par style au
//      doigt, plus de carte « ouverte » sur une photo touchée, plus de
//      retour « sur la bonne photo » : ces mécanismes sont partis avec
//      la page intermédiaire de la nº 866.
//   2. LES VUES portent un HISTOGRAMME (trois barres, trait fin, 20 px,
//      blanc), plus d'œil.
//   3. LES AIRS DU PIED : signaler → vues = fanion → partage = 16 px
//      (boîte à boîte), et l'encre à égalité aussi.
//  L'ATELIER : voir l'en-tête de `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

const SLUG = `banc866-${Date.now()}`;
//  Labels A → Z : Blackwork, Realism, Trash Polka — l'ordre des bandes.
const STYLES = ["blackwork", "realisme", "trash-polka"];
const TAILLES = {
  tatouage: { blackwork: 11, realisme: 5, "trash-polka": 6 },
  flash: { blackwork: 3, realisme: 3, "trash-polka": 3 },
};
const PHOTO = (nature, style, i) =>
  `4866${nature === "flash" ? "1" : "0"}${STYLES.indexOf(style)}0${i.toString(16)}-0000-4000-8000-${String(i).padStart(12, "0")}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: SLUG, slug: SLUG, nom: "Banc 866", styles: STYLES, ville_slug: `lyon-${SLUG}` });
  const photos = [];
  for (const nature of ["tatouage", "flash"]) for (const style of STYLES) {
    for (let i = 1; i <= TAILLES[nature][style]; i += 1) photos.push({
      id: PHOTO(nature, style, i), tatoueur_id: SLUG, style, rendu: "black", nature,
      url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`,
      ordre: i, cree_le: "2026-01-01T00:00:00Z",
    });
  }
  await ranger("photos_tatoueur", photos);
}
const SERIES_TATTOO = ["tatouage·blackwork·black", "tatouage·realisme·black", "tatouage·trash-polka·black"];
const SERIES_FLASH = ["flash·blackwork·black", "flash·realisme·black", "flash·trash-polka·black"];
const TITRES = { blackwork: "Blackwork • Black", realisme: "Realism • Black", "trash-polka": "Trash Polka • Black" };

//  LES CARTES DU FIL : série, titres, pastille, points, pied, encadré.
const SONDE_FIL = `() => {
  const B = (n) => { if (!n) return null; const x = n.getBoundingClientRect();
    return { y: +x.top.toFixed(1), bas: +x.bottom.toFixed(1), g: +x.left.toFixed(1), d: +x.right.toFixed(1), h: +x.height.toFixed(1) }; };
  const cartes = [...document.querySelectorAll("[data-carte-de-galerie]")].map((li) => {
    const cadre = li.querySelector("[data-cadre-de-galerie]");
    const pastille = [...(cadre?.querySelectorAll("*") ?? [])].map((e) => e.textContent.trim()).find((t) => /^\\d+\\/\\d+$/.test(t)) ?? null;
    const pied = li.querySelector("[data-pied-de-fil]");
    return { serie: li.dataset.galerieSerie, ouverte: li.hasAttribute("data-carte-ouverte"),
      surtitre: li.querySelector("[data-surtitre-galerie]")?.textContent.trim(), titre: li.querySelector("[data-titre-galerie]")?.textContent.trim(),
      pastille, points: pied ? pied.querySelectorAll("button[aria-label^='View photo']").length : 0,
      pied: Boolean(pied), cadre: B(cadre), titreBoite: B(li.querySelector("[data-titre-galerie]")),
      cadreAPied: cadre && pied ? +(B(pied).y - B(cadre).bas).toFixed(1) : null,
      photosMontees: cadre ? cadre.querySelectorAll("img").length : 0 };
  });
  const ouverte = document.querySelector("[data-carte-ouverte]");
  const premiere = document.querySelector("[data-carte-de-galerie]");
  return { url: location.search, fil: getComputedStyle(document.querySelector("[data-fil-de-galerie]") ?? document.body).display,
    cartes, y: Math.round(scrollY),
    distance: ouverte && premiere ? Math.round(ouverte.getBoundingClientRect().top - premiere.getBoundingClientRect().top) : null,
    //  nº 873 — la colonne de la photo est RENDUE et cachée au doigt sur
    //  les pages de galeries (le HTML préparé est le même pour les deux
    //  appareils) : on mesure ce qui se VOIT, pas ce qui existe.
    enTeteFil: (document.querySelector("[data-habillage-photo]")?.getClientRects().length ?? 0) > 0,
    ligneSousLePied: (document.querySelector("[data-titre-carrousel]")?.getClientRects().length ?? 0) > 0,
    lecture: getComputedStyle(document.querySelector("[data-colonne-lecture]")).display, vuePhoto: Boolean(document.querySelector("[data-vue-photo]")) };
}`;
const sonderFil = (page) => page.evaluate((S) => new Function("return " + S)()(), SONDE_FIL);
//  GLISSER DANS UNE CARTE : le carrousel natif avance d'un cadre.
const glisser = (page, k, sens = 1) => page.evaluate(([k, sens]) => {
  const li = document.querySelectorAll("[data-carte-de-galerie]")[k];
  const rangee = [...li.querySelectorAll("[data-cadre-de-galerie] *")].find((e) => { const o = getComputedStyle(e).overflowX; return o === "auto" || o === "scroll"; });
  if (!rangee) return false;
  rangee.scrollBy({ left: sens * rangee.clientWidth, behavior: "instant" });
  return true;
}, [k, sens]);
//  LE PIED : les quatre dessins, leurs boîtes et leur encre.
const SONDE_PIED = `(racine) => {
  const pied = document.querySelector(racine + " [data-pied-de-fil]");
  if (!pied) return null;
  const svgs = [...pied.querySelectorAll("svg")].filter((s) => !s.closest("button[aria-label^='View photo']")).map((s) => {
    const r = s.getBoundingClientRect(); const vb = s.viewBox.baseVal; const echelle = r.width / (vb.width || 24); const b = s.getBBox();
    const traits = [...s.querySelectorAll("[stroke-width]")].map((p) => parseFloat(p.getAttribute("stroke-width"))); const demi = (traits.length ? Math.max(...traits) : 0) / 2;
    const label = s.closest("[aria-label]")?.getAttribute("aria-label") ?? "";
    const role = /Report/.test(label) ? "signaler" : /Save this photo|Remove this photo/.test(label) ? "fanion" : /Share/.test(label) ? "partage" : s.closest("[data-vues-de-fil]") ? "vues" : "?";
    return { role, l: r.width, h: r.height, boite: { g: +r.left.toFixed(2), d: +r.right.toFixed(2) },
      encre: { g: +(r.left + (b.x - demi) * echelle).toFixed(2), d: +(r.left + (b.x + b.width + demi) * echelle).toFixed(2) },
      chemins: [...s.querySelectorAll("path")].map((p) => p.getAttribute("d")), cercles: s.querySelectorAll("circle").length,
      trait: traits[0] ?? null, couleur: getComputedStyle(s).color, remplissage: s.getAttribute("fill") };
  });
  const par = Object.fromEntries(svgs.map((s) => [s.role, s]));
  const vues = pied.querySelector("[data-vues-de-fil]");
  return { par, couleurDuNombre: vues ? getComputedStyle(vues).color : null, nombre: vues?.textContent.trim() ?? null,
    boiteGauche: par.signaler && par.vues ? +(par.vues.boite.g - par.signaler.boite.d).toFixed(2) : null,
    boiteDroite: par.fanion && par.partage ? +(par.partage.boite.g - par.fanion.boite.d).toFixed(2) : null,
    encreGauche: par.signaler && par.vues ? +(par.vues.encre.g - par.signaler.encre.d).toFixed(2) : null,
    encreDroite: par.fanion && par.partage ? +(par.partage.encre.g - par.fanion.encre.d).toFixed(2) : null };
}`;
const sonderPied = (page, racine) => page.evaluate(([S, r]) => new Function("return " + S)()(r), [SONDE_PIED, racine]);
const HISTOGRAMME = "M6.4 19.5v-6M12 19.5V9M17.6 19.5v-15";
const BLANC = "rgb(242, 242, 244)";

//  ══ 1 · LE FIL DE GALERIES — LES PAGES PORTFOLIO ET FLASH (nº 873) ═══
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("866 · §1 (nº 873) — la page Portfolio du doigt EST le fil : trois cartes de tattoos, dans l'ordre du profil");
    await page.goto(`${BASE}/artist/${SLUG}/portfolio`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelectorAll("[data-carte-de-galerie]").length >= 3, null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const fil = await sonderFil(page);
    verif("TROIS CARTES — une par galerie de tattoos, dans l'ordre du profil (les flashs ont leur page)",
      fil.fil !== "none" && fil.cartes.length === 3 && fil.cartes.map((c) => c.serie).join(" ") === SERIES_TATTOO.join(" "),
      `${fil.fil} · ${fil.cartes.length} carte(s) : ${fil.cartes.map((c) => c.serie).join(" ")}`);
    verif("chaque carte porte le TITRE de sa galerie — « Tattoos », puis le style et son rendu",
      fil.cartes.every((c) => c.surtitre === "Tattoos" && c.titre === TITRES[STYLES[fil.cartes.indexOf(c)]]), fil.cartes.map((c) => `${c.surtitre} / ${c.titre}`).join(" · "));
    verif("… son pied, ses points de position, et ses photos qui glissent (pastille « 1/N » au repos)",
      fil.cartes.every((c, k) => c.pied && c.points > 0 && c.pastille === `1/${TAILLES.tatouage[STYLES[k]]}`), fil.cartes.map((c) => `${c.pastille} · ${c.points} points`).join(" · "));
    verif("la page s'ouvre en haut, la colonne de lecture affichée (ce n'est pas une vue photo)",
      fil.y === 0 && !fil.vuePhoto && fil.lecture !== "none" && !fil.enTeteFil && !fil.ligneSousLePied, `page à ${fil.y} · vue photo ${fil.vuePhoto} · lecture ${fil.lecture}`);
    //  nº 873-§3 — plus d'avatar : le titre à seize du bord, douze
    //  au-dessus de l'image ; le pied soudé à l'image, pleine largeur.
    verif("le titre dans la boîte de l'en-tête du fil (à seize, sans rond, douze au-dessus de l'image), le pied soudé à l'image",
      fil.cartes.every((c) => Math.round(c.titreBoite.g) === 16 && Math.round(c.cadre.y - c.titreBoite.bas) === 12 && c.cadreAPied === 0 && c.cadre.g === 0 && c.cadre.d === 390),
      fil.cartes.map((c) => `${c.titreBoite.g}/${Math.round(c.cadre.y - c.titreBoite.bas)}/${c.cadreAPied}`).join(" "));
    verif("les images restent différées : aucune carte ne monte toute sa galerie", fil.cartes.every((c) => c.photosMontees <= 3), fil.cartes.map((c) => c.photosMontees).join(","));

    titre("866 · §1 — glisser dans une carte ne fait défiler QUE ses photos");
    verif("le carrousel de la carte 3 répond au glissement", await glisser(page, 2, 1));
    await page.waitForTimeout(900);
    const apres = await sonderFil(page);
    verif("la carte 3 est passée à « 2/6 »", apres.cartes[2].pastille === "2/6", apres.cartes[2].pastille);
    verif("… et les deux autres n'ont pas bougé", apres.cartes.every((c, k) => k === 2 || c.pastille === fil.cartes[k].pastille), apres.cartes.map((c) => c.pastille).join(" "));
    verif("… la page non plus", apres.y === fil.y, `${apres.y} / ${fil.y}`);

    titre("866 · §1 (nº 873) — la page Flash : trois cartes de flashs");
    await page.goto(`${BASE}/artist/${SLUG}/flash`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelectorAll("[data-carte-de-galerie]").length >= 3, null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const flash = await sonderFil(page);
    verif("TROIS CARTES — une par galerie de flashs, « Flash » en surtitre, « 1/3 » chacune",
      flash.cartes.length === 3 && flash.cartes.map((c) => c.serie).join(" ") === SERIES_FLASH.join(" ") && flash.cartes.every((c) => c.surtitre === "Flash" && c.pastille === "1/3"),
      `${flash.cartes.map((c) => `${c.serie} ${c.surtitre} ${c.pastille}`).join(" · ")}`);
  } catch (e) {
    verif("déroulement du banc 866 (§1)", false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

//  ══ 2 ET 3 · L'HISTOGRAMME DES VUES, LES AIRS DU PIED ═══════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    for (const [nom, adresse, racine, attente] of [
      ["une carte des résultats", `/search?style=blackwork&nature=tatouage`, "[data-carte]", "[data-carte] [data-pied-de-fil]"],
      ["une carte du fil de galeries (la page Portfolio, nº 873)", `/artist/${SLUG}/portfolio`, "[data-carte-de-galerie]", "[data-carte-de-galerie] [data-pied-de-fil]"],
      ["la vue photo d'un lien partagé", `/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO("tatouage", "blackwork", 2)}`, "[data-vue-photo]", "[data-pied-de-fil]"],
    ]) {
      titre(`866 · §2/§3 — ${nom} : l'histogramme, et les deux airs du pied`);
      await page.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
      await page.waitForSelector(attente, { timeout: 20000 });
      await page.waitForTimeout(1200);
      const p = await sonderPied(page, racine);
      //  nº 867-§7 — le dessin est passé de 20 à 24 px (la taille des
      //  deux de droite) ; le tracé, lui, n'a pas bougé d'un point.
      verif("les vues portent l'HISTOGRAMME : trois barres, trait 1,8, 24 px depuis la nº 867, sans cercle d'œil",
        p?.par.vues && p.par.vues.chemins.length === 1 && p.par.vues.chemins[0] === HISTOGRAMME && p.par.vues.cercles === 0 && p.par.vues.trait === 1.8 && p.par.vues.l === 24 && p.par.vues.h === 24 && p.par.vues.remplissage === "none",
        JSON.stringify(p?.par.vues && { chemins: p.par.vues.chemins, cercles: p.par.vues.cercles, trait: p.par.vues.trait, l: p.par.vues.l }));
      verif("… blanc comme le nombre", p?.par.vues?.couleur === BLANC && p.couleurDuNombre === BLANC && /^\d+$/.test(p.nombre ?? ""), `${p?.par.vues?.couleur} · ${p?.couleurDuNombre} · « ${p?.nombre} »`);
      verif("signaler → vues = fanion → partage = SEIZE pixels, de boîte à boîte", p?.boiteGauche === 16 && p.boiteDroite === 16, `${p?.boiteGauche} · ${p?.boiteDroite}`);
      /*  nº 867-§7 — L'ENCRE N'EST PLUS TOUT À FAIT À ÉGALITÉ, et c'est
          la conséquence assumée de la consigne : les quatre dessins ont
          désormais la MÊME taille (24) dans la MÊME cible (40), donc les
          boîtes sont exactement à seize des deux côtés — mais le blanc
          propre à chaque glyphe diffère, et l'encre s'écarte de 1,2 px.
          C'est la boîte qui commande depuis la nº 867. */
      verif("… et l'encre reste à un pixel près", p && Math.abs(p.encreGauche - p.encreDroite) <= 1.5, `${p?.encreGauche} · ${p?.encreDroite}`);
    }
  } catch (e) {
    verif("déroulement du banc 866 (§2/§3)", false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

process.exit(bilan());
