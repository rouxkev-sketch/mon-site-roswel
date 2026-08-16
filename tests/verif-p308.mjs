/**
 * BANC DE LA PASSE Nº 308 — LIVRAISON RAPIDE
 * ==================================================================
 * TOUT PORTE SUR LA GALERIE QUI DÉFILE DE LA COLONNE PORTFOLIO (web).
 *
 * §1 — LE CÔTÉ DROIT TOUCHE LE BORD DU CADRE. Mesuré DEUX FOIS : sur
 *      les boîtes, et SUR CE QUI EST PEINT — on repeint les cases d'une
 *      couleur franche et on décode la colonne de pixels du bord droit,
 *      au repos ET en fin de course (le procédé des nº 295, 297, 306).
 * §2 — CLIQUER UNE PHOTO LA POSE DANS LE GRAND CADRE. En vivant, deux
 *      fois : dans la série déjà ouverte, et sur un CHANGEMENT de série
 *      (c'est là que la course vivait).
 * §3 — LES CHEVRONS RÉTRÉCISSENT, et celui de gauche est ENTIER : son
 *      dessin est à distance du bord de rognage de la colonne, et rien
 *      ne le recouvre (`elementFromPoint` aux trois quarts du dessin).
 * §4 — L'ÉCART DE MOITIÉ, LA GALERIE DÉCALÉE À GAUCHE, LES DEUX
 *      CHEVRONS SYMÉTRIQUES.
 *
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, densité 2 — celle du propriétaire.
 */
import {
  BASE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";
import { lirePixels } from "./_pixels.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const galerie = sansNotes(lire("src/components/GalerieQuiDefile.tsx"));
const affiche = sansNotes(lire("src/components/PortfolioDeLAffiche.tsx"));
const suivis = sansNotes(lire("src/components/BlocSuivis.tsx"));
const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));

const FICHE = "/tatoueur/ligne-claire-studio-nantes";
/** Cinq photos — la plus longue série de la base locale. */
const SERIE = "cyberpunk·color";
const AUTRE = "minimaliste·color";
const sel = `[data-galerie-serie="${SERIE}"]`;

/* ==================================================================
 * À LA SOURCE
 * ================================================================== */
/*  ⚠️ AMENDÉ PAR LA Nº 310-§1 — ANNULATION, SUR CONSIGNE.
    La nº 308 avait déplacé le débord de 40 px de la RANGÉE vers
    l'ENVELOPPE et supprimé le rembourrage qui le compensait : au repos,
    la galerie commençait donc 40 px à gauche des titres. Le propriétaire
    ne voulait pas ce décalage — on revient à l'écriture de la nº 306.
    CE QUI RESTE DE CE CONTRÔLE, et qui est son fond : le débord fait
    bien 40 px, et il est RENDU en rembourrage pour que la première photo
    reparte de l'alignement des titres. La position elle-même est éprouvée
    en vivant, au pixel, par le banc de la nº 310. */
titre("§1 à la source — le débord de 40 px et son rembourrage");
{
  verif(
    "le débord est porté par la rangée, et rendu en rembourrage",
    /classeRangee="-ml-10 pl-10 scroll-pl-10"/.test(affiche)
  );
  verif(
    "l'enveloppe, elle, ne déborde pas (c'est ce qui garde les chevrons dedans)",
    /classeEnveloppe="mt-2\.5"/.test(affiche) &&
      !/classeEnveloppe="mt-2\.5 -ml-10"/.test(affiche)
  );
  verif(
    "la largeur d'une case est recalculée sur le nouvel écart",
    /basis-\[calc\(\(100%_-_6px\)\/2\.1\)\]/.test(affiche)
  );
  verif(
    "LA BANDE D'EFFACEMENT DE 40 px EST GARDÉE, en deux lignes littérales",
    /WebkitMaskImage:\s*\n?\s*"linear-gradient\(to right, rgba\(0,0,0,0\) 0px, rgba\(0,0,0,1\) 40px\)"/.test(
      affiche
    ) &&
      /\bmaskImage:\s*\n?\s*"linear-gradient\(to right, rgba\(0,0,0,0\) 0px, rgba\(0,0,0,1\) 40px\)"/.test(
        affiche
      )
  );
}

titre("§2 à la source — une série ne passe plus par la photo 0");
{
  verif(
    "le `scrollLeft = 0` inconditionnel a disparu",
    !/zone\.scrollLeft = 0;\s*\n\s*dernierPose\.current = 0;/.test(carrousel)
  );
  verif(
    "la série s'ouvre sur la colonne DEMANDÉE",
    /const colonneVoulue = colonnes\.current\[indiceVoulu\.current\];/.test(
      carrousel
    ) &&
      /zone\.scrollLeft = colonneVoulue \? colonneVoulue\.offsetLeft : 0;/.test(
        carrousel
      )
  );
  verif(
    "…et `indice` n'est PAS entré dans les dépendances de l'observateur",
    /\}, \[cleDeLaSerie, n, surChangement, surCarte, styleLabel\]\);/.test(
      carrousel
    )
  );
}

titre("§3-§4 à la source — le dessin partagé, et ce que « Ma sélection » en garde");
{
  /*  ⚠️ AMENDÉ PAR LA Nº 310-§4. Ce contrôle lisait les valeurs ÉCRITES
      EN DUR dans le dessin partagé. Elles n'y sont plus : la réduction
      avait rétréci « Ma sélection » par ricochet, ce que le propriétaire
      n'avait pas demandé, et la taille est devenue un RÉGLAGE. Le petit
      chevron existe toujours, et la fiche le demande — c'est le banc de
      la nº 310 qui le mesure, en vivant. */
  verif(
    "le petit chevron de cette passe existe toujours, et la fiche le demande",
    /zone: "w-7",\s*\n\s*largeur: 14,\s*\n\s*hauteur: 28,\s*\n\s*trait: "2\.5",/.test(
      galerie
    ) && /chevron=\{CHEVRON_GALERIE_PETIT\}/.test(affiche)
  );
  verif(
    "l'ombre douce est conservée telle quelle",
    /drop-shadow\(0_1px_3px_rgba\(0,0,0,0\.65\)\)/.test(galerie)
  );
  verif(
    "l'écart est devenu un RÉGLAGE, pas un second dessin",
    /ecart = ECART_GALERIE/.test(galerie) && /\$\{ecart\}/.test(galerie)
  );
  verif(
    "le défaut du dessin reste 6 px — donc « Ma sélection » ne bouge pas",
    /export const ECART_GALERIE = "gap-1\.5"/.test(galerie) &&
      !/ecart=/.test(suivis)
  );
  verif(
    "la colonne Portfolio demande 3 px, et ses deux chevrons sont symétriques",
    /ecart="gap-\[3px\]"/.test(affiche) &&
      /decalageGauche="left-0"/.test(affiche) &&
      /decalageDroite="right-0"/.test(affiche)
  );
  verif(
    "AUCUN POINT de défilement dans le dessin",
    !/PointsDuCarrousel|data-role="pagination"/.test(galerie)
  );
}

/* ==================================================================
 * EN VIVANT — 1440 × 823, densité 2
 * ================================================================== */
const nav = await chromium.launch({
  executablePath: process.env.CHEMIN_CHROMIUM,
  args: ["--no-proxy-server"],
});
const ctx = await nav.newContext({
  viewport: { width: 1440, height: 823 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

/** Ouvre la fiche sur l'onglet Portfolio, galerie sous les yeux. */
async function ouvrir() {
  await page.goto(BASE + FICHE, { waitUntil: "networkidle" });
  await page.locator('button:text-is("Portfolio")').first().click();
  await page.waitForSelector(sel);
  await page.evaluate((s) => {
    document.querySelector(s).scrollIntoView({ block: "center" });
  }, sel);
  await page.waitForTimeout(600);
}
await ouvrir();

titre("§1 / §4 en vivant — les boîtes, 1440 × 823");
const geo = await page.evaluate((s) => {
  const g = document.querySelector(s);
  const ul = g.querySelector("[data-galerie-defilante]");
  const st = getComputedStyle(ul);
  const r = ul.getBoundingClientRect();
  const cases = [...g.querySelectorAll("[data-case-galerie]")];
  const titre = g.querySelector("[data-titre-galerie]").getBoundingClientRect();
  const troisieme = cases[2].getBoundingClientRect();
  return {
    padding: `${st.paddingLeft}/${st.paddingRight}`,
    scrollPadding: `${st.scrollPaddingLeft}/${st.scrollPaddingRight}`,
    ecart: st.columnGap,
    contenu:
      ul.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight),
    visible: ul.clientWidth,
    largeurCase: +cases[0].getBoundingClientRect().width.toFixed(3),
    partVisible3e: +(((r.right - troisieme.left) / troisieme.width) * 100).toFixed(2),
    bordDroit3e: +(r.right - troisieme.left).toFixed(2),
    decalageGaucheContreTitre: +(titre.left - r.left).toFixed(2),
    cadre: [+r.left.toFixed(2), +r.right.toFixed(2)],
  };
}, sel);
/*  ⚠️ AMENDÉS PAR LA Nº 310-§1. La rangée a de nouveau son rembourrage
    de 40 px — c'est lui qui ramène la première photo sur l'alignement
    des titres — et sa boîte visible fait donc 40 px de plus que sa boîte
    de contenu. Ce n'était pas la cause de la marge de droite : celle-ci
    venait des séries de moins de trois photos, qui ne remplissaient pas
    le cadre (voir le banc nº 310, décodé au pixel sur toutes les
    longueurs). On vérifie donc ce qui compte vraiment ici : que le
    rembourrage vaut bien la gouttière, et que l'accrochage en tient
    compte. */
verif(
  "la rangée a le rembourrage du débord, et l'accrochage le sait",
  geo.padding === "40px/0px" && geo.scrollPadding.startsWith("40px"),
  `${geo.padding} · scroll ${geo.scrollPadding}`
);
verif(
  "sa boîte visible dépasse sa boîte de contenu de la gouttière",
  geo.visible - geo.contenu === 40,
  `${geo.visible} − ${geo.contenu} = ${geo.visible - geo.contenu}`
);
verif(
  "l'écart est de 3 px (la moitié des 6 px de la nº 306)",
  geo.ecart === "3px",
  geo.ecart
);
verif(
  "la largeur d'une case vaut (100 % − 6px) / 2,1",
  Math.abs(geo.largeurCase - (geo.contenu - 6) / 2.1) < 0.02,
  `${geo.largeurCase} px (attendu ${((geo.contenu - 6) / 2.1).toFixed(3)})`
);
verif(
  "la troisième photo est visible sur 10 % de sa largeur",
  Math.abs(geo.partVisible3e - 10) < 0.2,
  `${geo.partVisible3e} %`
);
verif(
  "la galerie est décalée de 40 px À GAUCHE des titres",
  Math.abs(geo.decalageGaucheContreTitre - 40) < 0.5,
  `${geo.decalageGaucheContreTitre} px`
);

/* ---- §1 AU PIXEL ------------------------------------------------- */
titre("§1 au pixel — ce qui est PEINT, au repos et en fin de course");
await page.addStyleTag({
  content: `${sel} [data-case-galerie] span { background: #FF00FF !important; }
            ${sel} [data-case-galerie] img { opacity: 0 !important; }`,
});
await page.waitForTimeout(300);

/** Le dernier pixel MAGENTA, en px CSS, compté depuis le bord droit. */
async function dernierPeint() {
  const z = await page.evaluate((s) => {
    const ul = document.querySelector(s + " [data-galerie-defilante]");
    const r = ul.getBoundingClientRect();
    return { droite: r.right, y: r.top + r.height / 2 };
  }, sel);
  const LARGE = 60;
  const png = await page.screenshot({
    clip: { x: Math.round(z.droite) - LARGE, y: Math.round(z.y) - 1, width: LARGE + 4, height: 3 },
  });
  const px = lirePixels(png);
  for (let x = px.largeur - 1; x >= 0; x -= 1) {
    const [r, g, b] = px.pixel(x, 3);
    if (r > 200 && g < 90 && b > 200) return z.droite - LARGE + (x + 1) / 2;
  }
  return null;
}

const auRepos = await dernierPeint();
verif(
  "AU REPOS : la peinture atteint le bord droit du cadre",
  auRepos !== null && Math.abs(geo.cadre[1] - auRepos) < 1,
  auRepos === null ? "aucun magenta" : `écart ${(geo.cadre[1] - auRepos).toFixed(2)} px`
);

const fin = await page.evaluate((s) => {
  const ul = document.querySelector(s + " [data-galerie-defilante]");
  ul.scrollTo({ left: ul.scrollWidth, behavior: "instant" });
  return { max: ul.scrollWidth - ul.clientWidth };
}, sel);
await page.waitForTimeout(800);
const enFin = await dernierPeint();
verif(
  "EN FIN DE COURSE : la peinture atteint encore le bord droit",
  enFin !== null && Math.abs(geo.cadre[1] - enFin) < 1,
  enFin === null
    ? "aucun magenta"
    : `écart ${(geo.cadre[1] - enFin).toFixed(2)} px (course ${fin.max.toFixed(0)} px)`
);

/* ---- §3 LES CHEVRONS --------------------------------------------- */
titre("§3 en vivant — les deux chevrons");
await ouvrir();
await page.evaluate((s) => {
  const ul = document.querySelector(s + " [data-galerie-defilante]");
  ul.scrollTo({ left: 190, behavior: "instant" });
}, sel);
await page.waitForTimeout(700);
await page.hover(sel);
await page.waitForTimeout(400);

const chev = await page.evaluate((s) => {
  const g = document.querySelector(s);
  const ul = g.querySelector("[data-galerie-defilante]");
  const r = ul.getBoundingClientRect();
  const colonne = ul.closest("[class*='overflow-y-auto']").getBoundingClientRect();
  const photo = document.querySelector("[data-photo-fiche]").getBoundingClientRect();
  const lire = (cote) => {
    const b = g.querySelector(`[data-bandeau-defilement="${cote}"]`);
    if (!b) return null;
    const bb = b.getBoundingClientRect();
    const svg = b.querySelector("svg");
    const sb = svg.getBoundingClientRect();
    //  RIEN NE LE RECOUVRE : aux trois quarts du dessin, c'est le
    //  dessin lui-même qui répond.
    const couvert = [sb.left + 1, sb.left + sb.width / 2, sb.right - 1].map((x) => {
      const el = document.elementFromPoint(x, sb.top + sb.height / 2);
      return el ? el.tagName.toLowerCase() : "rien";
    });
    return {
      zone: +bb.width.toFixed(2),
      dessin: [+sb.width.toFixed(2), +sb.height.toFixed(2)],
      trait: svg.querySelector("path").getAttribute("stroke-width"),
      ombre: getComputedStyle(svg).filter,
      //  distance du DESSIN au bord de la rangée, de son côté
      marge:
        cote === "droite"
          ? +(r.right - sb.right).toFixed(2)
          : +(sb.left - r.left).toFixed(2),
      //  marge au bord de ROGNAGE de la colonne (le vrai couperet)
      margeRognage:
        cote === "droite"
          ? +(colonne.right - sb.right).toFixed(2)
          : +(sb.left - colonne.left).toFixed(2),
      surLaPhoto: cote === "gauche" ? sb.left < photo.right : false,
      couvert,
    };
  };
  return { gauche: lire("gauche"), droite: lire("droite") };
}, sel);

if (!chev.gauche || !chev.droite) {
  nonJoue(
    "§3 les chevrons",
    "un des deux bandeaux n'existe pas à cette position de défilement"
  );
} else {
  verif(
    "la zone est passée de 40 à 28 px",
    chev.gauche.zone === 28 && chev.droite.zone === 28,
    `${chev.gauche.zone} / ${chev.droite.zone}`
  );
  verif(
    "le dessin est passé de 20 × 40 à 14 × 28, trait 3 → 2,5",
    chev.gauche.dessin[0] === 14 &&
      chev.gauche.dessin[1] === 28 &&
      chev.gauche.trait === "2.5",
    `${chev.gauche.dessin.join(" × ")}, trait ${chev.gauche.trait}`
  );
  verif(
    "l'ombre douce est toujours là",
    /drop-shadow/.test(chev.gauche.ombre) && /0\.65/.test(chev.gauche.ombre),
    chev.gauche.ombre
  );
  verif(
    "LE CHEVRON GAUCHE EST ENTIER : rien ne le recouvre, sur toute sa largeur",
    chev.gauche.couvert.every((t) => t === "svg" || t === "path"),
    chev.gauche.couvert.join(" · ")
  );
  verif(
    "…et il est à distance du bord de rognage de la colonne",
    chev.gauche.margeRognage >= 5,
    `${chev.gauche.margeRognage} px du couperet`
  );
  verif(
    "…et il n'empiète plus sur la grande photo",
    !chev.gauche.surLaPhoto
  );
  /*  ⚠️ AMENDÉ PAR LA Nº 310-§1. La symétrie se mesurait par rapport aux
      bords de LA RANGÉE. Depuis que celle-ci a retrouvé son rembourrage
      de 40 px (le débord annulé), son bord gauche est celui de la
      GOUTTIÈRE, pas celui de la galerie : le chevron gauche y est à
      47 px, le droit à 7. Ce n'est pas une asymétrie, c'est la mauvaise
      référence. LA BONNE, celle que l'œil voit, c'est la bande entre les
      deux alignements des titres — et là, les deux sont à 7 px. Le banc
      de la nº 310 la mesure ainsi ; ici on vérifie ce qui reste vrai :
      les deux chevrons sont à la même distance de LEUR bord de galerie. */
  verif(
    "LES DEUX CHEVRONS SONT POSÉS PAREIL : même distance de leur bord de galerie",
    Math.abs(
      chev.gauche.marge - parseFloat(geo.padding) - chev.droite.marge
    ) < 0.5,
    `gauche ${chev.gauche.marge} px (dont ${parseFloat(geo.padding)} de gouttière) · ` +
      `droite ${chev.droite.marge} px`
  );
}

/* ---- §2 LE CLIC --------------------------------------------------- */
titre("§2 en vivant — cliquer une photo la pose dans le grand cadre");

/** Clique la case `rang` de la série `serie` et lit le grand cadre. */
async function cliquer(serie, rang) {
  const attendu = await page.evaluate(
    ([serie, rang]) => {
      const g = document.querySelector(`[data-galerie-serie="${serie}"]`);
      const cases = g.querySelectorAll("[data-case-galerie]");
      const src = cases[rang].querySelector("img").src;
      cases[rang].querySelector("button").click();
      return { src: src.split("/").pop().split("?")[0], total: cases.length };
    },
    [serie, rang]
  );
  await page.waitForTimeout(1800);
  const vu = await page.evaluate(() => {
    const car = document
      .querySelector("[data-photo-fiche]")
      ?.querySelector('[data-carrousel="fiche"]');
    if (!car) return null;
    const cadre = car.querySelector('[data-role="cadre"]');
    const cols = [...car.querySelectorAll("[data-role^='colonne']")];
    const r = cadre.getBoundingClientRect();
    const rang = cols.findIndex((c) => {
      const b = c.getBoundingClientRect();
      return b.left >= r.left - 3 && b.left <= r.left + 3;
    });
    return {
      rang,
      total: cols.length,
      compteur: car.querySelector('[data-role="compteur"]')?.textContent.trim(),
      image: cols[rang < 0 ? 0 : rang]
        ?.querySelector("img")
        ?.src.split("/")
        .pop()
        .split("?")[0],
    };
  });
  return { attendu, vu };
}

await ouvrir();
{
  const { attendu, vu } = await cliquer(SERIE, 3);
  verif(
    "la 4ᵉ photo cliquée est CELLE qui s'affiche (changement de série)",
    vu && vu.rang === 3 && vu.image === attendu.src,
    `attendu ${attendu.src} · vu ${vu?.image} · compteur ${vu?.compteur}`
  );
}
{
  //  Dans la MÊME série, cette fois : la série ne change pas, seul
  //  l'indice bouge — c'est l'autre chemin.
  const { attendu, vu } = await cliquer(SERIE, 1);
  verif(
    "la 2ᵉ photo de la MÊME série s'affiche aussi (l'indice seul change)",
    vu && vu.rang === 1 && vu.image === attendu.src,
    `attendu ${attendu.src} · vu ${vu?.image} · compteur ${vu?.compteur}`
  );
}
{
  //  Et sur une AUTRE série, pour éprouver le passage d'une série à
  //  l'autre avec un indice non nul de part et d'autre.
  await page.evaluate((s) => {
    document.querySelector(s).scrollIntoView({ block: "center" });
  }, `[data-galerie-serie="${AUTRE}"]`);
  await page.waitForTimeout(400);
  const { attendu, vu } = await cliquer(AUTRE, 4);
  verif(
    "la 5ᵉ photo d'une autre série s'affiche (série ET indice changent)",
    vu && vu.rang === 4 && vu.image === attendu.src,
    `attendu ${attendu.src} · vu ${vu?.image} · compteur ${vu?.compteur}`
  );
}

/* ---- CE QU'ON GARDE ---------------------------------------------- */
titre("ce qui ne devait pas bouger");
await ouvrir();
{
  const garde = await page.evaluate((s) => {
    const g = document.querySelector(s);
    const ul = g.querySelector("[data-galerie-defilante]");
    const zone = document.querySelector("[data-photo-fiche]");
    const car = zone.querySelector('[data-carrousel="fiche"]');
    const cadre = car.querySelector('[data-role="cadre"]');
    const cb = cadre.getBoundingClientRect();
    const cs = getComputedStyle(ul.closest("[class*='overflow-y-auto']"));
    return {
      masque: getComputedStyle(ul).maskImage,
      points: Boolean(g.querySelector('[data-role="pagination"]')),
      cadrePhoto: {
        largeur: +cb.width.toFixed(2),
        rapport: +(cb.width / cb.height).toFixed(4),
      },
      //  Le rognage de la colonne : celui de la nº 306, intact.
      colonne: `${cs.paddingLeft}/${cs.paddingRight} · ${cs.marginLeft}/${cs.marginRight}`,
    };
  }, sel);
  verif(
    "la bande d'effacement de 40 px est intacte",
    /0px/.test(garde.masque) && /40px/.test(garde.masque),
    garde.masque.slice(0, 74)
  );
  verif("aucun point de défilement dans la galerie", !garde.points);
  verif(
    "le cadre photo de la fiche garde son format 4/5",
    Math.abs(garde.cadrePhoto.rapport - 0.8) < 0.002,
    `${garde.cadrePhoto.largeur} px · rapport ${garde.cadrePhoto.rapport}`
  );
  verif(
    "le rognage asymétrique de la colonne (nº 306) n'a pas bougé",
    garde.colonne === "40px/12px · -40px/-12px",
    garde.colonne
  );
}

nonJoue(
  "« MA SÉLECTION » EN VIVANT",
  "la page /mes-favoris exige une session Supabase validée par le serveur, " +
    "que ce conteneur ne peut pas signer. Ce qu'elle consomme est donc " +
    "vérifié à la source, au caractère près : elle ne passe aucun `ecart` " +
    "(donc les 6 px de la nº 244) et garde ses deux décalages ; seul le " +
    "DESSIN des chevrons, partagé, rétrécit chez elle aussi"
);

await ctx.close();
await nav.close();
process.exit(bilan());
