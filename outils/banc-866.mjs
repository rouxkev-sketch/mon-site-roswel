//  ██ BANC 866 — LE FIL DE GALERIES DEPUIS L'ONGLET PORTFOLIO, L'HISTO-
//  GRAMME DES VUES, LES AIRS DU PIED ██
//  ==================================================================
//   1. LE FIL DE GALERIES (doigt) : six galeries sur le profil → six
//      cartes, une par galerie, dans le même ordre et sous les mêmes
//      titres ; toucher la photo 4 de la galerie 3 → la page s'ouvre
//      SUR la carte 3, la carte sur la photo 4 (« 4/6ʼ») ; glisser dans
//      une carte ne fait défiler QUE ses photos ; le retour rend la
//      galerie du profil sur la bonne photo — celle qu'on a touchée
//      sans glissement, la dernière regardée après un glissement.
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
const SERIES = ["tatouage·blackwork·black", "tatouage·realisme·black", "tatouage·trash-polka·black",
  "flash·blackwork·black", "flash·realisme·black", "flash·trash-polka·black"];
const BANDE = '[data-galeries="doigt"] [data-galerie-serie]';

//  LA BANDE N° k DU PROFIL : compteur, position, et la case posée au bord
//  utile (l'accrochage `snap-start`, rembourrage de défilement compris).
const lireBande = (page, k) => page.evaluate(([SEL, k]) => {
  const g = document.querySelectorAll(SEL)[k];
  if (!g) return null;
  const cases = [...g.querySelectorAll("[data-case-galerie]")];
  let el = cases[0]?.parentElement, cadre = null;
  while (el && el !== g) { const o = getComputedStyle(el).overflowX; if (o === "auto" || o === "scroll") { cadre = el; break; } el = el.parentElement; }
  if (!cadre) return null;
  const R = cadre.getBoundingClientRect();
  const rembourrage = parseFloat(getComputedStyle(cadre).paddingLeft) || 0;
  const bord = R.left + rembourrage, fin = R.right - rembourrage;
  const auBord = cases.findIndex((c) => Math.abs(c.getBoundingClientRect().left - bord) < 2);
  //  Les cases ENTIÈREMENT visibles dans le cadre utile, et le bout de
  //  course : une photo parmi les dernières ne peut pas venir au bord,
  //  la bande s'arrête à sa fin (le banc le sait, la pose aussi).
  const visibles = cases.map((c, i) => ({ i, r: c.getBoundingClientRect() })).filter(({ r }) => r.left >= bord - 1 && r.right <= fin + 1).map(({ i }) => i);
  return { compteur: g.querySelector("[data-compteur-galerie]")?.textContent, scrollLeft: Math.round(cadre.scrollLeft),
    max: Math.round(cadre.scrollWidth - cadre.clientWidth), auBord, visibles };
}, [BANDE, k]);
//  « POSÉE SUR LA CASE k » : la case est au bord — ou, si la bande ne peut
//  pas aller plus loin, elle est entièrement visible et la bande en bout
//  de course.
const poseeSur = (bande, k) => Boolean(bande) && (bande.auBord === k || (bande.visibles.includes(k) && bande.scrollLeft === bande.max));

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
    enTeteFil: Boolean(document.querySelector("[data-habillage-photo]")), ligneSousLePied: Boolean(document.querySelector("[data-titre-carrousel]")),
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

//  ══ 1 · LE FIL DE GALERIES ═══════════════════════════════════════════
{
  const { nav, page } = await ouvrir("doigt");
  try {
    titre("866 · §1 — le profil : six galeries, trois de tattoos puis trois de flashs");
    await page.goto(`${BASE}/artist/${SLUG}?entree=lien`, { waitUntil: "networkidle" });
    await page.locator("[role=radio]").filter({ hasText: /portfolio/i }).first().tap();
    await page.waitForFunction((S) => document.querySelectorAll(S).length >= 6, BANDE, { timeout: 15000 });
    await page.waitForTimeout(800);
    const bandes = await page.evaluate((S) => [...document.querySelectorAll(S)].map((g) => ({
      serie: g.dataset.galerieSerie, surtitre: g.querySelector("[data-surtitre-galerie]")?.textContent.trim(),
      titre: g.querySelector("[data-titre-galerie]")?.textContent.trim(), n: g.querySelectorAll("[data-case-galerie]").length })), BANDE);
    verif("six bandes, dans l'ordre du profil", bandes.map((b) => b.serie).join(" ") === SERIES.join(" "), bandes.map((b) => b.serie).join(" "));
    verif("… de 11, 5, 6, 3, 3 et 3 photos", bandes.map((b) => b.n).join(",") === "11,5,6,3,3,3", bandes.map((b) => b.n).join(","));

    titre("866 · §1 — toucher la photo 4 de la galerie 3 : la page s'ouvre sur la carte 3, la carte sur la photo 4");
    //  On amène la case 3 au bord de la bande : les cases 3 et 4 sont
    //  visibles, et c'est la 4 (indice 3) qu'on touche.
    await page.evaluate((S) => document.querySelectorAll(S)[2].querySelectorAll("[data-case-galerie]")[2].scrollIntoView({ inline: "start", block: "nearest" }), BANDE);
    await page.waitForTimeout(900);
    const bandeAvant = await lireBande(page, 2);
    verif("la bande 3 est posée sur sa case 3 (« 4/6 » au compteur)", bandeAvant?.auBord === 2 && bandeAvant.compteur === "4/6", JSON.stringify(bandeAvant));
    await page.locator(BANDE).nth(2).locator('[data-case-galerie="3"] button').tap();
    await page.waitForFunction(() => /entree=portfolio/.test(location.search) && document.querySelector("[data-carte-ouverte]"), null, { timeout: 15000 });
    await page.waitForTimeout(1500);
    const fil = await sonderFil(page);
    verif("l'adresse porte la consigne « entree=portfolio », la série et la photo touchée",
      /entree=portfolio/.test(fil.url) && /style=trash-polka/.test(fil.url) && fil.url.includes(`photo=${PHOTO("tatouage", "trash-polka", 4)}`), fil.url);
    verif("c'est la vue photo : colonne de lecture retirée, ni en-tête avatar, ni ligne sous le pied",
      fil.vuePhoto && fil.lecture === "none" && !fil.enTeteFil && !fil.ligneSousLePied, `vue ${fil.vuePhoto} · lecture ${fil.lecture} · en-tête ${fil.enTeteFil} · ligne ${fil.ligneSousLePied}`);
    verif("SIX CARTES — une par galerie, dans l'ordre du profil", fil.fil !== "none" && fil.cartes.length === 6 && fil.cartes.map((c) => c.serie).join(" ") === SERIES.join(" "),
      `${fil.fil} · ${fil.cartes.length} carte(s) : ${fil.cartes.map((c) => c.serie).join(" ")}`);
    verif("chaque carte porte le TITRE de sa galerie — les mots mêmes des bandes du profil",
      fil.cartes.every((c, k) => c.surtitre === bandes[k].surtitre && c.titre === bandes[k].titre), fil.cartes.map((c) => `${c.surtitre} / ${c.titre}`).join(" · "));
    verif("… son pied, ses points de position, et ses photos qui glissent (pastille « 1/N » au repos)",
      fil.cartes.every((c, k) => c.pied && c.points > 0 && (k === 2 || c.pastille === `1/${bandes[k].n}`)), fil.cartes.map((c) => `${c.pastille} · ${c.points} points`).join(" · "));
    verif("la carte OUVERTE est la troisième, sur la photo 4 (« 4/6 »)", fil.cartes[2].ouverte && fil.cartes[2].pastille === "4/6" && fil.cartes.filter((c) => c.ouverte).length === 1,
      `ouverte ${fil.cartes.findIndex((c) => c.ouverte)} · ${fil.cartes[2].pastille}`);
    verif("LA PAGE S'OUVRE POSITIONNÉE SUR ELLE : défilée de la distance exacte qui la sépare de la première", fil.y > 0 && fil.y === fil.distance, `page à ${fil.y} · distance ${fil.distance}`);
    verif("le titre dans la boîte de l'en-tête du fil (seize du bord, douze au-dessus de l'image), le pied soudé à l'image",
      fil.cartes.every((c) => Math.round(c.titreBoite.g) === 16 && Math.round(c.cadre.y - c.titreBoite.bas) === 12 && c.cadreAPied === 0 && c.cadre.g === 0 && c.cadre.d === 390),
      fil.cartes.map((c) => `${c.titreBoite.g}/${Math.round(c.cadre.y - c.titreBoite.bas)}/${c.cadreAPied}`).join(" "));
    verif("les images restent différées : aucune carte ne monte toute sa galerie", fil.cartes.every((c) => c.photosMontees <= 3), fil.cartes.map((c) => c.photosMontees).join(","));

    titre("866 · §1 — glisser dans une carte ne fait défiler QUE ses photos");
    verif("le carrousel de la carte 3 répond au glissement", await glisser(page, 2, 1));
    await page.waitForTimeout(900);
    const apres = await sonderFil(page);
    verif("la carte 3 est passée à « 5/6 »", apres.cartes[2].pastille === "5/6", apres.cartes[2].pastille);
    verif("… et les cinq autres n'ont pas bougé", apres.cartes.every((c, k) => k === 2 || c.pastille === fil.cartes[k].pastille), apres.cartes.map((c) => c.pastille).join(" "));
    verif("… la page non plus", apres.y === fil.y, `${apres.y} / ${fil.y}`);

    titre("866 · §1 — retour : la galerie du profil sur la bonne photo (la dernière regardée, la 5)");
    await page.goBack();
    await page.waitForFunction((S) => document.querySelectorAll(S).length >= 6, BANDE, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const retour1 = await lireBande(page, 2);
    verif("la bande 3 est posée sur sa case 5 — celle qu'on regardait (en bout de course : la 5 et la 6 visibles)", poseeSur(retour1, 4), JSON.stringify(retour1));
    const autres = await Promise.all([0, 1, 3].map((k) => lireBande(page, k)));
    verif("les autres bandes n'ont pas bougé (au début)", autres.every((b) => b?.scrollLeft === 0), JSON.stringify(autres));

    titre("866 · §1 — sans glissement, le retour rend la bande là où elle était (nº 863-§5)");
    await page.locator(BANDE).nth(2).locator('[data-case-galerie="4"] button').tap();
    await page.waitForFunction(() => /entree=portfolio/.test(location.search) && document.querySelector("[data-carte-ouverte]"), null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const fil2 = await sonderFil(page);
    verif("la carte 3 s'ouvre sur la photo 5 (« 5/6 »), la page sur elle", fil2.cartes[2]?.ouverte && fil2.cartes[2].pastille === "5/6" && fil2.y === fil2.distance, `${fil2.cartes[2]?.pastille} · ${fil2.y}/${fil2.distance}`);
    await page.goBack();
    await page.waitForFunction((S) => document.querySelectorAll(S).length >= 6, BANDE, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const retour2 = await lireBande(page, 2);
    verif("la bande 3 est toujours sur sa case 5, à la même position", poseeSur(retour2, 4) && retour2.scrollLeft === retour1.scrollLeft, `${JSON.stringify(retour2)} (avant ${JSON.stringify(retour1)})`);
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
      ["une carte du fil de galeries", `/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO("tatouage", "blackwork", 2)}&entree=portfolio`, "[data-carte-ouverte]", "[data-carte-ouverte] [data-pied-de-fil]"],
      ["la vue photo d'un lien partagé", `/artist/${SLUG}?style=blackwork&rendu=black&nature=tatouage&photo=${PHOTO("tatouage", "blackwork", 2)}`, "[data-vue-photo]", "[data-pied-de-fil]"],
    ]) {
      titre(`866 · §2/§3 — ${nom} : l'histogramme, et les deux airs du pied`);
      await page.goto(`${BASE}${adresse}`, { waitUntil: "networkidle" });
      await page.waitForSelector(attente, { timeout: 20000 });
      await page.waitForTimeout(1200);
      const p = await sonderPied(page, racine);
      verif("les vues portent l'HISTOGRAMME : trois barres, trait 1,8, 20 px, sans cercle d'œil",
        p?.par.vues && p.par.vues.chemins.length === 1 && p.par.vues.chemins[0] === HISTOGRAMME && p.par.vues.cercles === 0 && p.par.vues.trait === 1.8 && p.par.vues.l === 20 && p.par.vues.h === 20 && p.par.vues.remplissage === "none",
        JSON.stringify(p?.par.vues && { chemins: p.par.vues.chemins, cercles: p.par.vues.cercles, trait: p.par.vues.trait, l: p.par.vues.l }));
      verif("… blanc comme le nombre", p?.par.vues?.couleur === BLANC && p.couleurDuNombre === BLANC && /^\d+$/.test(p.nombre ?? ""), `${p?.par.vues?.couleur} · ${p?.couleurDuNombre} · « ${p?.nombre} »`);
      verif("signaler → vues = fanion → partage = SEIZE pixels, de boîte à boîte", p?.boiteGauche === 16 && p.boiteDroite === 16, `${p?.boiteGauche} · ${p?.boiteDroite}`);
      verif("… et l'encre à égalité (au demi-pixel)", p && Math.abs(p.encreGauche - p.encreDroite) <= 0.5, `${p?.encreGauche} · ${p?.encreDroite}`);
    }
  } catch (e) {
    verif("déroulement du banc 866 (§2/§3)", false, String(e).slice(0, 500));
  } finally { await nav.close(); }
}

process.exit(bilan());
