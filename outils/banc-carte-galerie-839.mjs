//  ██ BANC 839 (web) — LA CARTE EST UNE GALERIE ██
//  Au repos la carte est celle d'avant (une photo, aucun contrôle, une
//  seule image dans le document) ; au survol, le chevron des GALERIES
//  DE PROFIL et la pastille des FICHES, mesurés contre leurs patrons ;
//  le glissement est progressif et l'encadré ne bouge pas ; un clic sur
//  la photo N ouvre la fiche sur N. Au doigt, rien de tout cela.
//  L'atelier attendu est décrit dans `banc-socle.mjs`.
import { BASE, ouvrir, verif, titre, bilan, lire, ranger } from "./banc-socle.mjs";

//  UNE FICHE À GALERIE FOURNIE — c'est ELLE qui donne le patron : les
//  chevrons d'une galerie de profil ne se montrent que là où il reste
//  du chemin à faire, donc il faut plus de vignettes que la colonne
//  n'en tient. Les fiches de démonstration n'en ont pas assez.
const RICHE = `riche-839-${Date.now()}`;
{
  const gabarit = (await lire("tatoueurs", "slug=eq.demo-blackwork-12"))[0];
  await ranger("tatoueurs", { ...gabarit, id: RICHE, slug: RICHE, nom: "Banc 839", styles: ["blackwork"], ville_slug: `lyon-${RICHE}` });
  const photos = [];
  for (let i = 0; i < 8; i++) photos.push({ id: `${RICHE}-p${i + 1}`, tatoueur_id: RICHE, style: "blackwork", rendu: "black", nature: "tatouage", url: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, miniature: `/images-demo/tatouage/blackwork-${(i % 3) + 1}.svg`, ordre: i + 1, cree_le: "2026-01-01T00:00:00Z" });
  await ranger("photos_tatoueur", photos);
}

const MOSAIQUE = "/search?style=blackwork&nature=tatouage";

/** Le dessin d'un chevron, tel qu'il est rendu — pour comparer deux porteurs. */
const DESSIN = (n) => n && ({
  viewBox: n.getAttribute("viewBox"), largeur: n.getAttribute("width"), hauteur: n.getAttribute("height"),
  filtre: getComputedStyle(n).filter,
  d: n.querySelector("path")?.getAttribute("d"),
  trait: n.querySelector("path")?.getAttribute("stroke-width"),
  bouts: n.querySelector("path")?.getAttribute("stroke-linecap"),
});

const { nav, page } = await ouvrir("web");
await page.setViewportSize({ width: 1440, height: 950 });
const images = [];
page.on("request", (r) => { if (r.resourceType() === "image") images.push(r.url()); });

try {
  //  ── LE PATRON : le chevron d'une galerie de profil ────────────────
  titre("839 · le patron (une galerie de profil)");
  //  nº 873 — l'onglet Portfolio est une PAGE ; nº 876 — au web, cette
  //  page montre LES CARTES DE GALERIE du fil, dont la photo est la
  //  galerie de carte de la nº 839 : le chevron du profil et celui de la
  //  carte de recherche sont désormais le même dessin par construction
  //  — le banc le mesure quand même, comme il l'a toujours fait.
  await page.goto(`${BASE}/artist/${RICHE}/portfolio`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-carte-de-galerie]", { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator("[data-carte-de-galerie]").first().hover({ position: { x: 150, y: 150 } });
  await page.waitForTimeout(500);
  const patron = await page.evaluate((D) => {
    const f = new Function("n", `return (${D})(n)`);
    //  On ne lit que ce qui est monté à l'écran (`offsetParent` est nul
    //  sous un `display:none` — la pastille de l'affiche, par exemple,
    //  n'existe qu'au web).
    const carte = document.querySelector("[data-carte-de-galerie]");
    const svg = carte?.querySelector("[data-fleche-de-carte] svg");
    const pastille = [...document.querySelectorAll('[data-role="compteur"]')].find((n) => n.offsetParent !== null);
    const s = pastille && getComputedStyle(pastille);
    return {
      chevron: f(svg),
      pastille: pastille && { fond: s.backgroundColor, rayon: s.borderRadius, couleur: s.color, flou: s.backdropFilter, chiffres: getComputedStyle(pastille.firstElementChild).fontVariantNumeric },
    };
  }, DESSIN.toString());
  verif("une galerie de profil montre son chevron (le patron est lisible)", Boolean(patron.chevron), JSON.stringify(patron.chevron));
  verif("une fiche montre sa pastille (le patron est lisible)", Boolean(patron.pastille), JSON.stringify(patron.pastille));

  //  ── 1. AU REPOS ───────────────────────────────────────────────────
  titre("839 · au repos : la carte est telle qu'elle était");
  //  ⚠️ LA SOURIS EST RESTÉE LÀ OÙ LE PATRON L'A LAISSÉE, et Chromium
  //  rejoue un survol sous un pointeur immobile quand la page change :
  //  une carte de la mosaïque se trouverait « survolée » à l'arrivée et
  //  préchargerait sa deuxième photo (`precharger`, nº 876). On la range
  //  dans la barre du haut, entre deux éléments, avant de partir.
  await page.mouse.move(700, 60);
  images.length = 0;
  await page.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const repos = await page.evaluate(() => {
    const carte = document.querySelector("[data-carte]");
    const vis = (n) => n && getComputedStyle(n).visibility === "visible" && getComputedStyle(n).display !== "none";
    return {
      cartes: document.querySelectorAll("[data-carte]").length,
      pistes: document.querySelectorAll("[data-piste-de-carte]").length,
      imagesParCarte: [...document.querySelectorAll("[data-piste-de-carte]")].map((p) => p.querySelectorAll("img").length),
      flecheVisible: vis(carte.querySelector("[data-fleche-de-carte]")),
      /*  §1 (nº 844) — LA PASTILLE NE SE MASQUE PLUS, ELLE S'ÉTEINT :
          au repos elle est transparente (opacité 0) et transparente aux
          pointeurs. « Pas de pastille au repos » se lit donc dans
          l'opacité, plus dans `visibility`. */
      pastilleVisible: (() => {
        const p = carte.querySelector("[data-compteur-de-carte]");
        return Boolean(p) && vis(p) && Number(getComputedStyle(p).opacity) > 0;
      })(),
      compteur: carte.querySelector("[data-compteur-de-carte]")?.textContent,
      gauche: carte.querySelector('[data-fleche-de-carte="gauche"]') !== null,
    };
  });
  verif("la mosaïque a ses cartes, chacune avec sa piste", repos.cartes > 0 && repos.pistes === repos.cartes, `${repos.cartes} cartes`);
  verif("AUCUNE flèche, AUCUNE pastille visible au repos", repos.flecheVisible === false && repos.pastilleVisible === false);
  verif("aucune flèche gauche sur la première photo", repos.gauche === false);
  verif("UNE SEULE IMAGE PAR CARTE dans le document", repos.imagesParCarte.every((n) => n === 1), `[${repos.imagesParCarte.join(",")}]`);
  verif("LE RÉSEAU : au plus une image par carte, jamais un portfolio entier", images.length <= repos.cartes, `${images.length} image(s) demandée(s) pour ${repos.cartes} cartes`);

  //  ── 2. AU SURVOL ──────────────────────────────────────────────────
  titre("839 · au survol : les deux flèches et la pastille");
  const carte = page.locator("[data-carte]").first();
  await carte.scrollIntoViewIfNeeded();
  await carte.hover();
  await page.waitForTimeout(700);
  const survol = await page.evaluate((D) => {
    const f = new Function("n", `return (${D})(n)`);
    const c = document.querySelector("[data-carte]");
    const fl = c.querySelector('[data-fleche-de-carte="droite"]');
    const past = c.querySelector("[data-compteur-de-carte]");
    const sf = getComputedStyle(fl), sp = getComputedStyle(past);
    return {
      flecheVisible: sf.visibility === "visible" && sf.display !== "none",
      pastilleVisible: sp.visibility === "visible" && sp.display !== "none" && Number(sp.opacity) > 0,
      zone: Math.round(fl.getBoundingClientRect().width),
      hauteurFleche: Math.round(fl.getBoundingClientRect().height),
      hauteurCadre: Math.round(c.querySelector("[data-piste-de-carte]").getBoundingClientRect().height),
      largeurCarte: Math.round(c.getBoundingClientRect().width),
      chevron: f(fl.querySelector("svg")),
      etiquette: fl.getAttribute("aria-label"),
      pastille: { fond: sp.backgroundColor, rayon: sp.borderRadius, couleur: sp.color, flou: sp.backdropFilter, chiffres: getComputedStyle(past.firstElementChild).fontVariantNumeric, texte: past.textContent },
      images: c.querySelectorAll("[data-piste-de-carte] img").length,
    };
  }, DESSIN.toString());
  /*  §1 (nº 844) — LE SURVOL NE MONTRE PLUS QUE LA FLÈCHE : la
      pastille, elle, attend un GESTE (un pas de chevron), et s'éteint
      trois secondes après — la même règle que sur les fiches et le fil.
      Le banc 844 mesure ce cycle entier ; ici, on constate seulement
      que le survol ne l'allume pas, et que sa ROBE n'a pas changé (le
      patron des fiches, vérifié juste en dessous). */
  verif("la flèche apparaît au survol — la pastille, non : elle attend le geste (nº 844)", survol.flecheVisible && survol.pastilleVisible === false, `flèche ${survol.flecheVisible} · pastille ${survol.pastilleVisible}`);
  verif("LE DESSIN DU CHEVRON EST CELUI DES GALERIES DE PROFIL", survol.chevron.viewBox === patron.chevron.viewBox && survol.chevron.d === patron.chevron.d && survol.chevron.filtre === patron.chevron.filtre && survol.chevron.bouts === patron.chevron.bouts, `d=${survol.chevron.d} · filtre identique`);
  verif("il est PROPORTIONNÉ à la carte (gabarit réduit, la zone tient la hauteur)", survol.zone === 28 && survol.chevron.largeur === "14" && survol.chevron.hauteur === "28" && survol.chevron.trait === "2.5" && survol.hauteurFleche === survol.hauteurCadre, `zone ${survol.zone} px sur une carte de ${survol.largeurCarte} px, dessin ${survol.chevron.largeur}×${survol.chevron.hauteur}`);
  verif("la pastille porte LE PATRON DES FICHES", survol.pastille.fond === patron.pastille.fond && survol.pastille.rayon === patron.pastille.rayon && survol.pastille.couleur === patron.pastille.couleur && survol.pastille.flou === patron.pastille.flou && survol.pastille.chiffres === patron.pastille.chiffres, `${survol.pastille.fond} · ${survol.pastille.rayon}`);
  verif("l'étiquette de la flèche est celle d'une photo", survol.etiquette === "Next photo", survol.etiquette);
  verif("LE SURVOL A PRÉPARÉ LA SUIVANTE, et elle seule", survol.images === 2, `${survol.images} image(s) montées`);

  //  ── 3. LE GLISSEMENT ──────────────────────────────────────────────
  titre("839 · le glissement : fluide, et l'encadré ne bouge pas");
  /*  ⚠️ LE DÉCALAGE VIT SUR CHAQUE PHOTO DEPUIS LA nº 840, plus sur la
      piste : c'est ce qui rend le bord droit net (la photo montrée n'a
      AUCUNE transformation, donc rien à rééchantillonner). On mesure
      donc le glissement sur LA PHOTO QUI ARRIVE — la case de rang 1. */
  const avant = await page.evaluate(() => {
    const c = document.querySelector("[data-carte]");
    const g = document.querySelector("[data-grille-tatoueurs]");
    const p = c.querySelector("[data-piste-de-carte]");
    const s = getComputedStyle(c.querySelector('[data-case-de-carte="1"]'));
    return { carte: c.getBoundingClientRect().toJSON(), grille: g.getBoundingClientRect().toJSON(), cadre: p.parentElement.getBoundingClientRect().toJSON(), scroll: window.scrollY, transition: s.transitionProperty, duree: s.transitionDuration, transforme: s.transform, compteur: c.querySelector("[data-compteur-de-carte]").textContent };
  });
  verif("la photo qui arrive est en transition de TRANSFORMATION (un glissement, pas un saut)", avant.transition.includes("transform") && avant.duree === "0.3s", `${avant.transition} · ${avant.duree}`);
  await page.locator('[data-carte] [data-fleche-de-carte="droite"]').first().click();
  await page.waitForTimeout(120);
  const milieu = await page.evaluate(() => getComputedStyle(document.querySelector('[data-case-de-carte="1"]')).transform);
  await page.waitForTimeout(600);
  const apres = await page.evaluate(() => {
    const c = document.querySelector("[data-carte]");
    const g = document.querySelector("[data-grille-tatoueurs]");
    const p = c.querySelector("[data-piste-de-carte]");
    const case1 = c.querySelector('[data-case-de-carte="1"]');
    return { carte: c.getBoundingClientRect().toJSON(), grille: g.getBoundingClientRect().toJSON(), cadre: p.parentElement.getBoundingClientRect().toJSON(), scroll: window.scrollY, transforme: getComputedStyle(case1).transform, place: case1.getBoundingClientRect().toJSON(), compteur: c.querySelector("[data-compteur-de-carte]").textContent, gauche: c.querySelector('[data-fleche-de-carte="gauche"]') !== null, images: c.querySelectorAll("[data-piste-de-carte] img").length, href: c.querySelector("[data-lien-carte]").getAttribute("href") };
  });
  const x = (t) => (t === "none" ? 0 : Number((t.match(/matrix\(([^)]*)\)/)?.[1] ?? "").split(",")[4] ?? 0));
  const largeurPiste = apres.cadre.width;
  verif("la photo qui arrive est venue EXACTEMENT à la place de l'encadré", Math.abs(x(apres.transforme)) < 0.01 && Math.abs(apres.place.left - apres.cadre.left) < 0.01 && Math.abs(apres.place.width - apres.cadre.width) < 0.01, `décalage ${apres.transforme} · bord gauche ${apres.place.left} pour un cadre à ${apres.cadre.left}`);
  verif("le glissement est PROGRESSIF (mesuré en cours de route)", x(milieu) > 1 && x(milieu) < x(avant.transforme) - 1, `à mi-chemin : ${Math.round(x(milieu))} px, partie de ${Math.round(x(avant.transforme))} px pour un cadre de ${Math.round(largeurPiste)} px`);
  const total = avant.compteur.split("/")[1];
  verif("le compteur suit", avant.compteur === `1/${total}` && apres.compteur === `2/${total}`, `${avant.compteur} → ${apres.compteur}`);
  verif("la flèche gauche apparaît dès qu'il y a du chemin derrière", apres.gauche === true);
  verif("L'ENCADRÉ NE BOUGE PAS (carte, cadre, grille, position de page)", JSON.stringify(avant.carte) === JSON.stringify(apres.carte) && JSON.stringify(avant.cadre) === JSON.stringify(apres.cadre) && JSON.stringify(avant.grille) === JSON.stringify(apres.grille) && avant.scroll === apres.scroll);
  verif("la photo d'après a été préparée à son tour", apres.images === 3, `${apres.images} image(s) montées`);

  //  ── 4. LE CLIC ────────────────────────────────────────────────────
  titre("839 · le clic ouvre la fiche SUR la photo regardée");
  const photoVisee = new URL(apres.href, BASE).searchParams.get("photo");
  verif("le lien de la carte emporte la photo regardée", Boolean(photoVisee), photoVisee ?? "aucune");
  /*  ON CLIQUE LA PHOTO LÀ OÙ ELLE EST, à la souris et au centre du
      cadre — le geste de l'utilisateur. ⚠️ PAS LA PISTE PAR SON NŒUD :
      translatée d'une largeur, SA BOÎTE est sortie du cadre (c'est
      justement ce que `overflow-hidden` découpe, à l'écran comme au
      pointeur) ; un outil qui vise son centre viserait à côté. */
  const cadre = await page.evaluate(() => {
    const r = document.querySelector("[data-carte] [data-piste-de-carte]").parentElement.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.click(cadre.x, cadre.y);
  await page.waitForSelector("[role=dialog]", { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector("[data-attente-fiche]"), null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const fenetre = await page.evaluate(() => ({
    compteur: document.querySelector('[role=dialog] [data-role="compteur"]')?.textContent,
    url: location.pathname + location.search,
  }));
  verif("LA FICHE S'OUVRE SUR LA PHOTO 2, celle qu'on regardait", fenetre.compteur?.startsWith("2/"), `la fenêtre dit ${fenetre.compteur}`);
} catch (e) {
  verif("déroulement du banc 839", false, String(e).slice(0, 400));
} finally {
  await nav.close();
}

//  ── 5. RIEN AU DOIGT ────────────────────────────────────────────────
const { nav: nav2, page: page2 } = await ouvrir("doigt");
try {
  titre("839 · au doigt : rien n'a changé");
  await page2.goto(`${BASE}${MOSAIQUE}`, { waitUntil: "networkidle" });
  await page2.waitForTimeout(1200);
  await page2.locator("[data-carte]").first().hover().catch(() => {});
  await page2.waitForTimeout(500);
  const doigt = await page2.evaluate(() => {
    const c = document.querySelector("[data-carte]");
    const vis = (n) => { const s = n && getComputedStyle(n); return Boolean(s) && s.visibility === "visible" && s.display !== "none"; };
    return {
      fleche: vis(c.querySelector("[data-fleche-de-carte]")),
      //  §1 (nº 844) — même lecture qu'au repos : l'opacité, pas la
      //  visibilité.
      pastille: (() => {
        const p = c.querySelector("[data-compteur-de-carte]");
        return Boolean(p) && vis(p) && Number(getComputedStyle(p).opacity) > 0;
      })(),
      images: [...document.querySelectorAll("[data-piste-de-carte]")].map((p) => p.querySelectorAll("img").length),
      appareil: document.documentElement.dataset.appareil,
    };
  });
  verif("l'appareil est bien le doigt", doigt.appareil === "mobile", doigt.appareil);
  verif("AUCUNE flèche, AUCUNE pastille au doigt", doigt.fleche === false && doigt.pastille === false);
  verif("une seule image par carte, même après un toucher", doigt.images.every((n) => n === 1), `[${doigt.images.join(",")}]`);
} catch (e) {
  verif("déroulement du banc 839 (doigt)", false, String(e).slice(0, 300));
} finally {
  await nav2.close();
}
process.exit(bilan());
