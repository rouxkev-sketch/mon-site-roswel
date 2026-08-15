/**
 * BANC DE LA PASSE Nº 297 — LIVRAISON RAPIDE
 * ==================================================================
 * UN SEUL POINT : la photo est DEUX PIXELS plus étroite que sa colonne,
 * centrée dedans — il reste un pixel de page de chaque côté, et la
 * photo voisine ne peut PLUS atteindre le bord du cadre.
 *
 * ⚠️ CE BANC NE MESURE PAS LE DÉFAUT, IL FABRIQUE SA CAUSE. La position
 * de défilement rapportée par le moteur ne dit pas la vérité sur ce qui
 * est PEINT (c'est le fait décisif de cette passe) : on n'attend donc
 * pas qu'un décalage fractionnaire arrive, ON LE POSE — une
 * transformation d'un demi-pixel puis de neuf dixièmes, appliquée aux
 * colonnes POUR LE TEST SEULEMENT — et on décode les pixels du bord
 * gauche du cadre.
 * ⚠️ ET IL PORTE SON TÉMOIN : le même décalage, appliqué à une photo
 * REMISE pleine colonne, doit faire APPARAÎTRE la voisine. Sans ce
 * témoin, un banc vert ne prouverait que l'aveuglement du banc.
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, densité 2.
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

const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));
const fenetreF = sansNotes(lire("src/components/FenetreFiche.tsx"));
const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));

const FICHE = "atelier-corvus-lyon-1er";
const CADRE = '[data-photo-fiche] [data-role="cadre"]';
const COLONNE = '[data-photo-fiche] [data-role^="colonne"]';
const PREMIERE = '[data-photo-fiche] [data-role="colonne 0"]';
/** Le fond de la page (`#1A1A1D`) — ce qui doit apparaître, et rien d'autre. */
const PAGE = "26,26,29";

titre("§1 à la source — la photo se rétracte de deux pixels, et RIEN d'autre ne bouge");
{
  verif(
    "LA RÈGLE EST ÉCRITE UNE SEULE FOIS (`PHOTO_DANS_SA_COLONNE`) : un " +
      "pixel libre à gauche (`left-px`), deux pixels de moins en largeur " +
      "(`calc(100% - 2px)`) — donc un pixel libre à droite aussi",
    /const PHOTO_DANS_SA_COLONNE =/.test(carrousel) &&
      /"absolute inset-y-0 left-px h-full w-\[calc\(100%_-_2px\)\] object-cover"/.test(
        carrousel
      )
  );
  verif(
    "ELLE NE S'APPLIQUE QU'À LA PAGE PLEINE : une CARTE de mosaïque et " +
      "la FENÊTRE SUPERPOSÉE gardent la photo pleine colonne",
    /surCarte \|\| dansLaFenetre\s*\?\s*"absolute inset-0 h-full w-full object-cover"/.test(
      carrousel
    )
  );
  verif(
    "LES DEUX CHEMINS D'IMAGE LA REÇOIVENT (la miniature des cartes et " +
      "la pleine résolution des fiches) — aucune classe en dur ne subsiste",
    /className=\{PHOTO_DANS_SA_COLONNE\}/.test(carrousel) &&
      /classe=\{PHOTO_DANS_SA_COLONNE\}/.test(carrousel) &&
      !/"absolute inset-0 h-full w-full object-cover"\n\s*\/>/.test(carrousel)
  );
  verif(
    "LA COLONNE, ELLE, GARDE SA LARGEUR DE 100 % : le pas du " +
      "défilement, l'accrochage et `offsetLeft` ne changent pas d'un " +
      "cheveu (nº 209-§7)",
    /className=\{`relative w-full shrink-0 snap-start snap-always/.test(
      carrousel
    ) && /left: colonne\.offsetLeft/.test(carrousel)
  );
  verif(
    "CE QUI RESTE INTACT : le défilement natif avec accrochage, le " +
      "calage au pixel (nº 282), la largeur entière du cadre (nº 280), " +
      "le format 4/5 et `min-h-0` (nº 292), le rognage de la colonne " +
      "(nº 295)",
    /overflow-x-auto snap-x snap-mandatory/.test(carrousel) &&
      /marginLeft: calage \|\| undefined/.test(carrousel) &&
      /w-\[round\(down,100%,1px\)\]/.test(carrousel) &&
      /CADRE_PHOTO_PORTFOLIO : ""\} min-h-0/.test(carrousel) &&
      /min-h-0 overflow-hidden/.test(carrousel)
  );
  verif(
    "LE RECALAGE DE LA nº 296 EST GARDÉ — mais la correction NE " +
      "DÉPEND PAS DE LUI : elle est géométrique, pas numérique",
    /addEventListener\("scrollend", recaler\)/.test(carrousel) &&
      /setTimeout\(recaler, 140\)/.test(carrousel)
  );
  verif(
    "LA FENÊTRE SUPERPOSÉE N'EST PAS TOUCHÉE : elle garde son drapeau " +
      "et ses deux fonds, et la page ne le passe toujours nulle part",
    /dansLaFenetre/.test(fenetreF) &&
      !/dansLaFenetre/.test(fiche) &&
      /aspect-\[4\/5\] min-w-0 shrink-0 lg:shrink bg-black select-none/.test(
        fenetreF
      )
  );
}

titre("vivant — 1440 × 823, densité 2");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 1440, height: 823 },
      deviceScaleFactor: 2,
    });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/tatoueur/${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2500);

    /* ---- 1. LES DEUX LARGEURS, ET LE CENTRAGE -------------------- */
    const mesures = await page.evaluate((sel) => {
      const colonne = document.querySelector(sel);
      const image = colonne.querySelector("img");
      const c = colonne.getBoundingClientRect();
      const i = image.getBoundingClientRect();
      return {
        colonne: c.width,
        photo: i.width,
        gauche: i.left - c.left,
        droite: c.right - i.right,
      };
    }, PREMIERE);
    verif(
      "LA PHOTO EST EXACTEMENT DEUX PIXELS PLUS ÉTROITE QUE SA COLONNE",
      Math.abs(mesures.colonne - mesures.photo - 2) < 0.001,
      `colonne ${mesures.colonne.toFixed(3)} · photo ${mesures.photo.toFixed(
        3
      )} · écart ${(mesures.colonne - mesures.photo).toFixed(3)}`
    );
    verif(
      "ELLE EST CENTRÉE : un pixel libre à gauche, un pixel libre à droite",
      Math.abs(mesures.gauche - 1) < 0.001 && Math.abs(mesures.droite - 1) < 0.001,
      `gauche ${mesures.gauche.toFixed(3)} · droite ${mesures.droite.toFixed(3)}`
    );

    /* ---- 2. LE DÉCALAGE FABRIQUÉ, ET LES PIXELS DU BORD ---------- */
    /*  Chaque colonne reçoit une couleur unique : rouge, vert, bleu.
        On se place sur la TROISIÈME (bleue) ; sa voisine de gauche est
        donc VERTE. Tout pixel vert au bord gauche du cadre serait le
        défaut, en toutes lettres. */
    await page.evaluate((sel) => {
      const couleurs = ["%23FF0000", "%2300FF00", "%230000FF"];
      document.querySelectorAll(sel).forEach((colonne, rang) => {
        const image = colonne.querySelector("img");
        if (image)
          image.src =
            `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' ` +
            `width='1080' height='1350'%3E%3Crect width='1080' height='1350' ` +
            `fill='${couleurs[rang % 3]}'/%3E%3C/svg%3E`;
      });
    }, COLONNE);
    await page.evaluate((sel) => {
      const zone = document.querySelector(sel);
      zone.scrollTo({ left: zone.children[2].offsetLeft });
    }, CADRE);
    await page.waitForTimeout(1200);

    const boite = await page.locator(CADRE).boundingBox();
    /**
     * POSE UN DÉCALAGE FRACTIONNAIRE SUR LA PISTE — POUR LE TEST SEUL.
     * ⚠️ ET IL FAUT NEUTRALISER L'ACCROCHAGE POUR Y ARRIVER : à la
     * première tentative, la transformation agrandissait le débord de
     * droite, l'accrochage recalait `scrollLeft` de +1 dans la foulée,
     * et la piste partait d'un demi-pixel DANS L'AUTRE SENS — le banc
     * mesurait alors une scène où la voisine était SORTIE du cadre,
     * c'est-à-dire rien du tout. `scroll-snap-type: none` le temps de la
     * mesure, puis `scrollLeft` reposé sur l'entier : la piste glisse
     * bien vers la DROITE, et la voisine entre dans le cadre.
     * Elle retourne le débord réellement obtenu, qu'on vérifie : sans
     * ça, un banc vert pourrait n'être qu'un banc qui ne fabrique rien.
     */
    const decaler = (px) =>
      page.evaluate(
        ({ sel, selCadre, px }) => {
          document.getElementById("banc-297")?.remove();
          const style = document.createElement("style");
          style.id = "banc-297";
          style.textContent =
            `${selCadre}{scroll-snap-type:none !important}` +
            `${sel}{transform:translateX(${px}px)}`;
          document.head.append(style);
          const zone = document.querySelector(selCadre);
          zone.scrollLeft = zone.children[2].offsetLeft;
          const voisine = document.querySelectorAll(sel)[1];
          return (
            voisine.getBoundingClientRect().right -
            zone.getBoundingClientRect().left
          );
        },
        { sel: COLONNE, selCadre: CADRE, px }
      );
    /** Les huit pixels d'appareil du bord gauche du cadre (4 px CSS). */
    const bordGauche = async () => {
      const png = lirePixels(
        await page.screenshot({
          clip: { x: boite.x, y: boite.y + 200, width: 4, height: 2 },
        })
      );
      const ligne = [];
      for (let x = 0; x < png.largeur; x += 1) ligne.push(png.pixel(x, 2).join(","));
      return ligne;
    };
    const vert = (p) => {
      const [r, v, b] = p.split(",").map(Number);
      return v > r + 20 && v > b + 20;
    };

    const releves = {};
    for (const px of [0.5, 0.9]) {
      const debord = await decaler(px);
      await page.waitForTimeout(400);
      releves[px] = await bordGauche();
      verif(
        `LE DÉCALAGE DE ${px} px EST BIEN POSÉ : la COLONNE voisine entre ` +
          `de ${px} px dans le cadre (sans quoi le banc ne prouverait rien)`,
        Math.abs(debord - px) < 0.01,
        `débord ${debord.toFixed(3)} px`
      );
      verif(
        `DÉCALAGE FABRIQUÉ DE ${px} px — au bord gauche du cadre : QUE ` +
          `LE FOND DE LA PAGE (${PAGE}), et AUCUN pixel de la voisine verte`,
        releves[px].slice(0, 3).every((p) => p === PAGE) &&
          !releves[px].some(vert),
        releves[px].join(" | ")
      );
    }

    /* ---- 3. LE TÉMOIN : sans la correction, le vert APPARAÎT ------ */
    /*  On remet la photo pleine colonne (l'état d'avant cette passe) et
        on repose le même demi-pixel. Si le vert ne se montrait pas non
        plus ici, le banc serait simplement aveugle et ses deux verts ne
        vaudraient rien. */
    await page.evaluate((sel) => {
      document.querySelectorAll(`${sel} img`).forEach((image) => {
        image.style.left = "0px";
        image.style.width = "100%";
      });
    }, COLONNE);
    await decaler(0.5);
    await page.waitForTimeout(400);
    const temoin = await bordGauche();
    verif(
      "TÉMOIN — LA MÊME SCÈNE SANS LA CORRECTION (photo pleine colonne, " +
        "même demi-pixel) : la voisine VERTE apparaît bien au bord " +
        "gauche. Le banc voit donc ce qu'il prétend interdire",
      temoin.some(vert),
      temoin.join(" | ")
    );

    /* ---- 4. LA FENÊTRE SUPERPOSÉE N'A PAS BOUGÉ ------------------ */
    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/tatoueur/"]')].find(
        (n) => n.getAttribute("href") !== location.pathname
      );
      a?.click();
    });
    await page.waitForTimeout(3000);
    const ouverte = await page.evaluate(
      () => document.documentElement.getAttribute("data-fenetre-fiche") === "1"
    );
    if (ouverte) {
      const f = await page.evaluate(() => {
        const cars = [...document.querySelectorAll('[data-carrousel="fiche"]')];
        const racine = cars[cars.length - 1];
        const boitePhoto = racine.parentElement;
        const fenetre = boitePhoto.parentElement;
        const droite = fenetre.querySelector(":scope > div:last-child");
        const colonne = racine.querySelector('[data-role="colonne 0"]');
        const image = colonne.querySelector("img");
        const r = (n) => n.getBoundingClientRect();
        return {
          largeurColonne: r(colonne).width,
          largeurPhoto: image ? r(image).width : -1,
          videEntre: r(droite).left - r(boitePhoto).right,
          hauteurPhoto: r(boitePhoto).height,
          hauteurDroite: r(droite).height,
          fondRacine: getComputedStyle(racine).backgroundColor,
          fondBoite: getComputedStyle(boitePhoto).backgroundColor,
        };
      });
      verif(
        "FENÊTRE SUPERPOSÉE — LA PHOTO Y REMPLIT TOUJOURS TOUTE SA " +
          "COLONNE : la rétraction de deux pixels ne l'atteint pas",
        Math.abs(f.largeurColonne - f.largeurPhoto) < 0.001,
        `colonne ${f.largeurColonne.toFixed(3)} · photo ${f.largeurPhoto.toFixed(3)}`
      );
      verif(
        "FENÊTRE SUPERPOSÉE — ET SA GÉOMÉTRIE DE LA nº 296 EST INTACTE : " +
          "aucun vide, les deux colonnes de même hauteur, les deux fonds",
        Math.abs(f.videEntre) < 0.001 &&
          Math.abs(f.hauteurPhoto - f.hauteurDroite) < 0.001 &&
          f.fondRacine === "rgb(40, 40, 45)" &&
          f.fondBoite === "rgb(0, 0, 0)",
        `vide ${f.videEntre} · photo ${f.hauteurPhoto.toFixed(3)} · droite ` +
          `${f.hauteurDroite.toFixed(3)} · ${f.fondRacine} / ${f.fondBoite}`
      );
    } else {
      nonJoue(
        "la fenêtre superposée en vivant",
        "aucun lien interne n'a ouvert de fenêtre sur cette fiche de " +
          "démonstration ; son intégrité est vérifiée à la source"
      );
    }
  } finally {
    await nav.close();
  }
}

nonJoue(
  "LE TRAIT TEL QUE LE PROPRIÉTAIRE LE VOIT",
  "il est INTERMITTENT et il vit dans WebKit, que je ne peux pas " +
    "lancer ici ; et la position de défilement que ce moteur rapporte " +
    "est arrondie, donc inutilisable comme preuve. Ce banc ne prétend " +
    "donc pas reproduire le défaut : il prouve qu'un décalage " +
    "fractionnaire FABRIQUÉ ne peut plus rien révéler d'autre que le " +
    "fond de la page"
);

process.exit(bilan());
