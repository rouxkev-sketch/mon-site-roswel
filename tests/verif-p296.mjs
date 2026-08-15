/**
 * BANC DE LA PASSE Nº 296 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 la fenêtre centrée superposée est REMISE dans son état d'avant
 *    les nº 292-295 — et la page, elle, garde toutes ses corrections ;
 * §2 la position du défilement s'arrête sur un multiple ENTIER de la
 *    largeur d'une colonne, par tous les chemins.
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
const sonde = sansNotes(lire("src/components/SondePhoto.tsx"));

const FICHE = "atelier-corvus-lyon-1er";
const CADRE = '[data-photo-fiche] [data-role="cadre"]';

titre("§1 — la fenêtre retrouve son état d'avant, à la lettre");
{
  verif(
    "LA FENÊTRE PASSE SON DRAPEAU, et elle seule : la page ne le passe " +
      "nulle part",
    /dansLaFenetre\n\s*photos=\{photosDuStyleAffiche\}/.test(fenetreF) ||
      /dansLaFenetre/.test(fenetreF)
  );
  verif(
    "…et la PAGE ne le passe pas — elle garde toutes ses corrections",
    !/dansLaFenetre/.test(fiche)
  );
  verif(
    "DANS LA FENÊTRE : la racine retrouve son fond (`bg-sombre-carte`), " +
      "que la nº 294 lui avait retiré",
    /className=\{`relative select-none\$\{dansLaFenetre \? " bg-sombre-carte" : ""\}`\}/.test(
      carrousel
    )
  );
  verif(
    "DANS LA FENÊTRE : le cadre n'a NI format 4/5 NI `min-h-0` — les " +
      "deux venaient de la nº 292",
    /dansLaFenetre \? "" : `\$\{n > 0 \? CADRE_PHOTO_PORTFOLIO : ""\} min-h-0`/.test(
      carrousel
    )
  );
  verif(
    "DANS LA FENÊTRE : la colonne n'a NI `min-h-0` NI rognage — ils " +
      "venaient des nº 292 et 294",
    /dansLaFenetre \? "" : "min-h-0 overflow-hidden"/.test(carrousel)
  );
  verif(
    "LA FENÊTRE RETROUVE SES DEUX FONDS : le noir derrière la photo " +
      "(nº 294) et le gris de la fenêtre (nº 295)",
    /aspect-\[4\/5\] min-w-0 shrink-0 lg:shrink bg-black select-none/.test(
      fenetreF
    ) && /lg:rounded-r-lg bg-sombre-carte/.test(fenetreF)
  );
  verif(
    "LA PAGE GARDE TOUT : la largeur mesurée en multiple de 4 (nº 293), " +
      "le format 4/5 et `min-h-0` du cadre (nº 292), le rognage de la " +
      "colonne (nº 294), la chaîne sans fond (nº 295)",
    /Math\.floor\(\(libre \* 0\.8\) \/ 4\) \* 4/.test(fiche) &&
      /lg:w-\[var\(--photo-largeur/.test(fiche) &&
      /CADRE_PHOTO_PORTFOLIO : ""\} min-h-0/.test(carrousel) &&
      /min-h-0 overflow-hidden/.test(carrousel)
  );
}

titre("§2 — la position du défilement, à la source");
{
  verif(
    "LE RECALAGE EXISTE, et il ne s'applique QU'APRÈS L'ARRÊT : " +
      "`scrollend` quand le navigateur le sert, un repos de 140 ms sinon",
    /addEventListener\("scrollend", recaler\)/.test(carrousel) &&
      /setTimeout\(recaler, 140\)/.test(carrousel)
  );
  verif(
    "IL NE CALCULE AUCUN PAS (la règle de la nº 209-§7) : il LIT la " +
      "largeur que le navigateur a donnée à une colonne, et ne corrige " +
      "que le RESTE",
    /const pas = premiere\?\.getBoundingClientRect\(\)\.width \?\? 0;/.test(
      carrousel
    ) &&
      /const reste = zone\.scrollLeft % pas;/.test(carrousel) &&
      /Math\.round\(zone\.scrollLeft \/ pas\) \* pas/.test(carrousel)
  );
  verif(
    "IL NE FAIT RIEN QUAND LE RESTE EST DÉJÀ NUL — donc rien du tout " +
      "dans Chromium, où l'accrochage tombe juste",
    /if \(reste < 0\.001 \|\| pas - reste < 0\.001\) return;/.test(carrousel)
  );
  verif(
    "CE QUI NE BOUGE PAS : le défilement natif avec accrochage, les " +
      "flèches et les points qui visent `offsetLeft`, le calage de la " +
      "nº 282, la restauration de position",
    /overflow-x-auto snap-x snap-mandatory/.test(carrousel) &&
      /left: colonne\.offsetLeft/.test(carrousel) &&
      /marginLeft: calage \|\| undefined/.test(carrousel)
  );
  verif(
    "LA SONDE PORTE LES DEUX LIGNES DEMANDÉES — la position au " +
      "millième, et son reste, vert à zéro",
    /cle: "position du défilement"/.test(sonde) &&
      /reste modulo la largeur d'une colonne/.test(sonde)
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

    /* ---- §2 — VINGT DÉFILEMENTS, PAR CINQ CHEMINS ---------------- */
    const boite = await page.locator(CADRE).boundingBox();
    await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
    const lirePosition = () =>
      page.evaluate((sel) => {
        const zone = document.querySelector(sel);
        const pas = zone.firstElementChild.getBoundingClientRect().width;
        return { pos: zone.scrollLeft, pas, reste: zone.scrollLeft % pas };
      }, CADRE);
    const releves = [];
    for (let tour = 0; tour < 20; tour += 1) {
      const chemin = tour % 5;
      if (chemin === 0) await page.mouse.wheel(400, 0);
      else if (chemin === 1) await page.mouse.wheel(-400, 0);
      else if (chemin === 2)
        await page.evaluate((sel) => {
          const zone = document.querySelector(sel);
          const cible = zone.children[Math.min(2, zone.children.length - 1)];
          zone.scrollTo({ left: cible.offsetLeft });
        }, CADRE);
      else if (chemin === 3)
        await page.evaluate((sel) => {
          const zone = document.querySelector(sel);
          zone.scrollTo({ left: zone.children[0].offsetLeft });
        }, CADRE);
      //  LE CINQUIÈME CHEMIN POSE UNE FRACTION EXPRÈS : c'est celui qui
      //  éprouve le recalage, les quatre autres tombant déjà juste.
      else
        await page.evaluate((sel) => {
          const zone = document.querySelector(sel);
          zone.scrollLeft = zone.scrollLeft + 240.37;
        }, CADRE);
      await page.waitForTimeout(900);
      releves.push(await lirePosition());
    }
    verif(
      "VINGT DÉFILEMENTS, CINQ CHEMINS (molette avant, molette arrière, " +
        "point, flèche, saut fractionnaire) : LES VINGT RESTES VALENT ZÉRO",
      releves.every((m) => Math.abs(m.reste) < 0.001),
      releves
        .map((m, i) => `${i + 1}:${m.pos.toFixed(0)}/${m.reste.toFixed(3)}`)
        .join(" ")
    );

    /* ---- §2 — LE DÉCODAGE DES PIXELS DU BORD GAUCHE -------------- */
    /*  Chaque colonne reçoit une couleur unique : si un pixel de la
        voisine restait au bord gauche, il serait d'une autre couleur —
        il n'y a pas d'interprétation possible. */
    await page.evaluate(() => {
      const couleurs = ["%23FF0000", "%2300FF00", "%230000FF"];
      document
        .querySelectorAll('[data-photo-fiche] [data-role^="colonne"]')
        .forEach((colonne, rang) => {
          const image = colonne.querySelector("img");
          if (image)
            image.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1350'%3E%3Crect width='1080' height='1350' fill='${
              couleurs[rang % 3]
            }'/%3E%3C/svg%3E`;
        });
    });
    await page.evaluate((sel) => {
      const zone = document.querySelector(sel);
      zone.scrollTo({ left: zone.children[2].offsetLeft });
    }, CADRE);
    await page.waitForTimeout(1200);
    const image = lirePixels(
      await page.screenshot({
        clip: { x: boite.x, y: boite.y + 200, width: 3, height: 4 },
      })
    );
    const pixels = [];
    for (let x = 0; x < image.largeur; x += 1)
      pixels.push(image.pixel(x, 2).join(","));
    verif(
      "AU BORD GAUCHE DE LA TROISIÈME PHOTO : que du BLEU. Aucun pixel " +
        "de la voisine (verte) — la dernière colonne de pixels de la " +
        "photo précédente n'est pas là",
      pixels.every((p) => p === "0,0,255"),
      pixels.join(" | ")
    );

    /* ---- §1 — LA FENÊTRE SUPERPOSÉE ------------------------------ */
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
        const cadre = racine.querySelector('[data-role="cadre"]');
        const r = (n) => n.getBoundingClientRect();
        const cs = (n) => getComputedStyle(n);
        return {
          hauteurPhoto: r(boitePhoto).height,
          hauteurDroite: r(droite).height,
          videEntre: r(droite).left - r(boitePhoto).right,
          basPhoto: r(boitePhoto).bottom,
          basDroite: r(droite).bottom,
          fondRacine: cs(racine).backgroundColor,
          fondBoite: cs(boitePhoto).backgroundColor,
          aspectCadre: cs(cadre).aspectRatio,
          rognageColonne: cs(colonne).overflow,
        };
      });
      verif(
        "§1 — AUCUN VIDE entre la photo et la colonne de droite",
        Math.abs(f.videEntre) < 0.001,
        `${f.videEntre}`
      );
      verif(
        "§1 — LA COLONNE DE DROITE FAIT EXACTEMENT LA HAUTEUR DE LA " +
          "PHOTO, et elle ne descend pas plus bas",
        Math.abs(f.hauteurPhoto - f.hauteurDroite) < 0.001 &&
          Math.abs(f.basPhoto - f.basDroite) < 0.001,
        `photo ${f.hauteurPhoto.toFixed(3)} · droite ${f.hauteurDroite.toFixed(3)}`
      );
      verif(
        "§1 — AUCUN TRAIT GRIS AUTOUR DE LA PHOTO : la racine porte de " +
          "nouveau son fond, et le cadre la remplit exactement",
        f.fondRacine === "rgb(40, 40, 45)" && f.fondBoite === "rgb(0, 0, 0)",
        `racine ${f.fondRacine} · boîte ${f.fondBoite}`
      );
      verif(
        "§1 — ET LES DEUX MARQUEURS DES nº 292/294 ONT DISPARU DE LA " +
          "FENÊTRE : aucun format sur le cadre, aucun rognage de colonne",
        f.aspectCadre === "auto" && f.rognageColonne === "visible",
        `aspect ${f.aspectCadre} · rognage ${f.rognageColonne}`
      );
    } else {
      nonJoue(
        "§1 en vivant",
        "aucun lien interne n'a ouvert de fenêtre sur cette fiche de " +
          "démonstration ; le fait est vérifié à la source"
      );
    }
  } finally {
    await nav.close();
  }
}

nonJoue(
  "§2 — LE TRAIT LUI-MÊME, REPRODUIT",
  "je n'y suis pas parvenu, et je l'ai cherché : colonnes peintes de " +
    "trois couleurs distinctes, position forcée à une fraction " +
    "(`scrollLeft = 2×largeur − 0,5`). Chromium REFUSE la fraction — " +
    "l'accrochage obligatoire le ramène à l'entier dans la même trame, " +
    "et `scrollLeft` relit 1128 exactement. La position n'y est donc " +
    "jamais fractionnaire, et le trait ne peut pas s'y produire. La " +
    "correction est écrite pour les moteurs qui s'arrêtent entre deux " +
    "pixels ; la sonde en donnera le verdict chez le propriétaire"
);

process.exit(bilan());
