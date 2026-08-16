/**
 * BANC DE LA PASSE Nº 298 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 la colonne de lecture prend la largeur de la fenêtre superposée
 *    (380 px) et l'ensemble se recentre — marges extérieures égales ;
 * §2 la colonne ne coupe plus les encadrés de survol : ils débordent
 *    toujours dans les marges, et leurs QUATRE arrondis sont entiers.
 * ⚠️ UNE SEULE FENÊTRE : 1440 × 823, densité 2.
 * ⚠️ ET LE BANC PORTE SON TÉMOIN : en remettant le rognage d'avant, la
 * preuve du §2 doit ÉCHOUER — sans quoi elle ne prouverait rien.
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

const fiche = sansNotes(lire("src/components/FicheTatoueur.tsx"));
const fenetreF = sansNotes(lire("src/components/FenetreFiche.tsx"));
const blocLieux = sansNotes(lire("src/components/BlocLieux.tsx"));
const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));

const FICHE = "atelier-corvus-lyon-1er";
/** Le fond de la page (`#1A1A1D`) — ce qu'on voit là où rien n'est peint. */
const PAGE = "26,26,29";

titre("à la source — la largeur vient de la fenêtre, le rognage s'écarte");
{
  const largeurFenetre = /lg:w-\[(\d+)px\] shrink-0 lg:h-full lg:overflow-y-auto/.exec(
    fenetreF
  );
  //  ⚠️ LA PAGE A CESSÉ D'ÊTRE UN `minmax` À LA nº 300 : la plage
  //  340–350 s'est refermée sur un nombre. Les deux écritures sont
  //  reconnues ici, pour que ce banc reste lisible d'où qu'on vienne.
  const largeurPage = (
    /lg:grid-cols-\[auto_(?:minmax\(340px,)?(\d+)px\)?\]/.exec(fiche) ?? []
  )[1];
  //  ⚠️ AMENDÉ LE 15/08/2026 (passe nº 299) — CETTE VÉRIFICATION EST
  //  CADUQUE TELLE QU'ELLE ÉTAIT ÉCRITE. Elle exigeait que la colonne
  //  de la page et celle de la fenêtre superposée soient LE MÊME
  //  NOMBRE (380). Le propriétaire a mesuré le résultat et tranché :
  //  380 reste juste pour la fenêtre, mais c'est encore trop long en
  //  pleine page — il a choisi 350, puis 340 (nº 300 : 350 était une
  //  erreur de saisie). Les deux vues n'ont donc plus la
  //  même laisse, EN CONNAISSANCE DE CAUSE. Ce qui reste vérifiable, et
  //  qui compte, c'est que la fenêtre superposée n'a PAS bougé.
  verif(
    "LA FENÊTRE SUPERPOSÉE EST TOUJOURS À 380 px — la nº 299 n'a changé " +
      "que la page pleine, qui vaut désormais 340 px",
    largeurFenetre?.[1] === "380" && largeurPage === "340",
    `fenêtre ${largeurFenetre?.[1]} px · page ${largeurPage} px`
  );
  verif(
    "LE RECENTRAGE N'EST PAS ÉCRIT : c'est `justify-center` qui centre " +
      "l'ensemble, aucune marge n'est posée à la main",
    /lg:justify-center/.test(fiche) &&
      !/lg:ml-\[\d+px\]|lg:pl-\[\d+px\]/.test(fiche)
  );
  //  ⚠️ AMENDÉ LE 16/08/2026 (passe nº 306) — le rembourrage de la
  //  colonne devient ASYMÉTRIQUE : 40 px à gauche (les galeries du
  //  Portfolio y débordent jusqu'au contact de la photo et s'y
  //  effacent), 12 px à droite (40 px y sortiraient de la fenêtre sur
  //  un écran étroit). La boîte de contenu, elle, ne bouge pas — c'est
  //  ce que la vérification garantit toujours.
  verif(
    "LA COLONNE S'ÉCARTE DE 12 px POUR NE PLUS ROGNER, ET SA BOÎTE DE " +
      "CONTENU NE BOUGE PAS (`lg:pl-10` annulé par `lg:-ml-10`, `lg:pr-3` par `lg:-mr-3`)",
    /lg:overflow-y-auto lg:pl-10 lg:-ml-10 lg:pr-3 lg:-mr-3/.test(fiche)
  );
  verif(
    "L'ENCADRÉ GARDE SON DÉBORD DE 8 px — il n'est PAS rentré dans sa " +
      "colonne (ce serait désaligner son texte du reste)",
    /rounded-xl -m-2 p-2/.test(blocLieux)
  );
  verif(
    "LE ROGNAGE DES PHOTOS (nº 295) N'EST PAS TOUCHÉ : la colonne du " +
      "carrousel rogne toujours",
    /min-h-0 overflow-hidden/.test(carrousel)
  );
  verif(
    "LA PHOTO N'EST PAS TOUCHÉE : sa largeur découle toujours de la " +
      "hauteur mesurée, en multiple de 4 (nº 290, nº 293)",
    /Math\.floor\(\(libre \* 0\.8\) \/ 4\) \* 4/.test(fiche) &&
      /lg:w-\[var\(--photo-largeur/.test(fiche)
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
    await page.waitForTimeout(3000);

    /* ---- §1 — LES QUATRE MESURES -------------------------------- */
    /*  ⚠️ ON MESURE LA BOÎTE DE CONTENU DE LA COLONNE, pas sa boîte de
        bordure : c'est elle qui porte les lignes de séparation, et
        c'est d'elle que parle le relevé du propriétaire. Les 12 px
        ajoutés au §2 sont un débord de rognage, pas de la largeur. */
    const m = await page.evaluate(() => {
      const photo = document.querySelector("[data-photo-fiche]");
      const grille = photo.parentElement.parentElement;
      const colonne = grille.querySelector(":scope > div:last-child");
      const r = (n) => n.getBoundingClientRect();
      const cs = getComputedStyle(colonne);
      const gauchePad = parseFloat(cs.paddingLeft);
      const droitePad = parseFloat(cs.paddingRight);
      const contenuGauche = r(colonne).left + gauchePad;
      const contenuDroite = r(colonne).right - droitePad;
      return {
        fenetre: innerWidth,
        margeGauche: r(photo).left,
        margeDroite: innerWidth - contenuDroite,
        largeurPhoto: r(photo).width,
        hauteurPhoto: r(photo).height,
        largeurColonne: contenuDroite - contenuGauche,
        gouttiere: contenuGauche - r(photo).right,
      };
    });
    //  ⚠️ AMENDÉ LE 15/08/2026 (passe nº 299) : 380 était la valeur de
    //  la nº 298 ; le propriétaire l'a mesurée puis ramenée à 340 pour
    //  la seule page pleine. La vérification garde son sens — la
    //  colonne vaut la largeur DÉCIDÉE —, seul le nombre change.
    verif(
      "LA COLONNE DE LECTURE FAIT 340 px (nº 300 — c'était 380 à la nº 298)",
      Math.abs(m.largeurColonne - 340) < 0.001,
      `${m.largeurColonne.toFixed(3)} px`
    );
    verif(
      "LES DEUX MARGES EXTÉRIEURES SONT ÉGALES : l'ensemble est recentré",
      Math.abs(m.margeGauche - m.margeDroite) < 0.001,
      `gauche ${m.margeGauche.toFixed(3)} · droite ${m.margeDroite.toFixed(3)}`
    );
    verif(
      "LA GOUTTIÈRE ENTRE LA PHOTO ET LA COLONNE N'A PAS BOUGÉ (40 px)",
      Math.abs(m.gouttiere - 40) < 0.001,
      `${m.gouttiere.toFixed(3)} px`
    );
    verif(
      "TOUT S'ADDITIONNE À LA LARGEUR DE LA FENÊTRE — aucune place " +
        "perdue nulle part",
      Math.abs(
        m.margeGauche +
          m.largeurPhoto +
          m.gouttiere +
          m.largeurColonne +
          m.margeDroite -
          m.fenetre
      ) < 0.001,
      `${m.margeGauche} + ${m.largeurPhoto} + ${m.gouttiere} + ` +
        `${m.largeurColonne} + ${m.margeDroite} = ${m.fenetre}`
    );

    /* ---- §2 — LES QUATRE ARRONDIS, AU PIXEL --------------------- */
    /*  On survole une ligne cliquable, puis on décode :
         · le fond au MILIEU des deux bords extrêmes de l'encadré — il
           doit être PEINT, donc l'encadré n'est pas rogné ;
         · les quatre COINS extrêmes — ils doivent être le fond de la
           page, et le fond peint doit revenir en diagonale : c'est la
           signature d'un arrondi entier. */
    //  ⚠️ LE DÉFILEMENT D'ABORD, LA MESURE ENSUITE, ET DANS DEUX
    //  APPELS SÉPARÉS : `scrollIntoView` peut être adouci par la page,
    //  et lire le rectangle dans la foulée donnait une position que la
    //  souris n'atteignait plus — le survol ne se déclenchait pas et
    //  tout le §2 se mesurait sur un encadré éteint.
    await page.evaluate(() => {
      const photo = document.querySelector("[data-photo-fiche]");
      const grille = photo.parentElement.parentElement;
      const colonne = grille.querySelector(":scope > div:last-child");
      colonne
        .querySelector(".rounded-xl.-m-2")
        ?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    await page.waitForTimeout(800);
    const survol = await page.evaluate(() => {
      const photo = document.querySelector("[data-photo-fiche]");
      const grille = photo.parentElement.parentElement;
      const colonne = grille.querySelector(":scope > div:last-child");
      const ligne = colonne.querySelector(".rounded-xl.-m-2");
      if (!ligne) return null;
      const r = ligne.getBoundingClientRect();
      const c = colonne.getBoundingClientRect();
      const cs = getComputedStyle(colonne);
      return {
        x: r.left,
        y: r.top,
        largeur: r.width,
        hauteur: r.height,
        rayon: parseFloat(getComputedStyle(ligne).borderRadius),
        debordGauche:
          c.left + parseFloat(cs.paddingLeft) - r.left,
        debordDroite:
          r.right - (c.right - parseFloat(cs.paddingRight)),
        resteGauche: r.left - c.left,
        resteDroite: c.right - r.right,
        texte: (ligne.textContent || "").slice(0, 40),
      };
    });
    if (!survol) {
      nonJoue(
        "§2 en vivant",
        "cette fiche de démonstration ne porte aucune ligne cliquable à " +
          "encadré (équipe, guest, studio) ; le fait est vérifié à la source"
      );
    } else {
      await page.mouse.move(0, 0);
      await page.mouse.move(
        survol.x + survol.largeur / 2,
        survol.y + survol.hauteur / 2,
        { steps: 8 }
      );
      await page.waitForTimeout(800);

      /** Décode un carré de `n` px CSS à partir d'un coin de l'encadré. */
      const carre = async (x, y, n) => {
        const png = lirePixels(
          await page.screenshot({ clip: { x, y, width: n, height: n } })
        );
        const lignes = [];
        for (let j = 0; j < png.hauteur; j += 1) {
          const l = [];
          for (let i = 0; i < png.largeur; i += 1) l.push(png.pixel(i, j).join(","));
          lignes.push(l);
        }
        return lignes;
      };
      /** Un pixel unique, au centre d'un carré d'un pixel CSS. */
      const pixel = async (x, y) => (await carre(x, y, 1))[0][0];

      verif(
        "L'ENCADRÉ DÉBORDE TOUJOURS DE 8 px DANS LES MARGES, des deux " +
          "côtés — il n'a pas été rentré dans sa colonne",
        Math.abs(survol.debordGauche - 8) < 0.001 &&
          Math.abs(survol.debordDroite - 8) < 0.001,
        `gauche ${survol.debordGauche} · droite ${survol.debordDroite}`
      );
      verif(
        "…ET IL RESTE 4 px ENTRE SON BORD ET CELUI QUI ROGNE : plus rien " +
          "ne peut être coupé",
        survol.resteGauche >= 3.999 && survol.resteDroite >= 3.999,
        `gauche ${survol.resteGauche} · droite ${survol.resteDroite}`
      );

      //  LE FOND DU SURVOL, LU LÀ OÙ IL EST À COUP SÛR (au centre).
      const fond = await pixel(
        survol.x + survol.largeur / 2,
        survol.y + survol.hauteur / 2
      );
      verif(
        "LE SURVOL PEINT BIEN UN FOND (sans quoi il n'y aurait rien à " +
          "mesurer) — et ce n'est pas le fond de la page",
        fond !== PAGE,
        `fond du survol ${fond} · page ${PAGE}`
      );

      //  LES DEUX BORDS EXTRÊMES, À MI-HAUTEUR : peints = non rognés.
      const bordGauche = await pixel(survol.x, survol.y + survol.hauteur / 2);
      const bordDroite = await pixel(
        survol.x + survol.largeur - 1,
        survol.y + survol.hauteur / 2
      );
      verif(
        "LES DEUX BORDS EXTRÊMES DE L'ENCADRÉ SONT PEINTS : la colonne " +
          "ne le coupe plus — ce qu'on voit dans les marges est bien lui",
        bordGauche === fond && bordDroite === fond,
        `gauche ${bordGauche} · droite ${bordDroite}`
      );

      //  LES QUATRE COINS : le pixel extrême est HORS de l'arrondi (donc
      //  le fond de la page), et le fond revient en diagonale.
      const R = survol.rayon;
      const coins = {
        "haut gauche": [survol.x, survol.y, 1, 1],
        "haut droit": [survol.x + survol.largeur - 1, survol.y, -1, 1],
        "bas gauche": [survol.x, survol.y + survol.hauteur - 1, 1, -1],
        "bas droit": [
          survol.x + survol.largeur - 1,
          survol.y + survol.hauteur - 1,
          -1,
          -1,
        ],
      };
      const releve = {};
      for (const [nom, [x, y, sx, sy]] of Object.entries(coins)) {
        releve[nom] = {
          extreme: await pixel(x, y),
          dedans: await pixel(x + sx * (R / 2), y + sy * (R / 2)),
        };
      }
      verif(
        `LES QUATRE ARRONDIS SONT DESSINÉS EN ENTIER (rayon ${R} px) : au ` +
          "pixel extrême de chaque coin on lit le FOND DE LA PAGE, et à " +
          "mi-rayon en diagonale le fond du survol revient",
        Object.values(releve).every(
          (c) => c.extreme === PAGE && c.dedans === fond
        ),
        Object.entries(releve)
          .map(([n, c]) => `${n} ${c.extreme}→${c.dedans}`)
          .join(" · ")
      );

      /* ---- LE TÉMOIN : on remet le rognage d'avant --------------- */
      /*  Sans lui, un banc vert ne dirait pas s'il mesure la correction
          ou s'il est simplement aveugle. On annule les 12 px : le bord
          de l'encadré doit alors CESSER d'être peint. */
      await page.evaluate(() => {
        const photo = document.querySelector("[data-photo-fiche]");
        const grille = photo.parentElement.parentElement;
        const colonne = grille.querySelector(":scope > div:last-child");
        colonne.style.padding = "0";
        colonne.style.margin = "0";
      });
      await page.waitForTimeout(500);
      const temoinGauche = await pixel(survol.x, survol.y + survol.hauteur / 2);
      const temoinDroite = await pixel(
        survol.x + survol.largeur - 1,
        survol.y + survol.hauteur / 2
      );
      verif(
        "TÉMOIN — EN REMETTANT LE ROGNAGE D'AVANT (rembourrage et marge " +
          "annulés), les deux bords de l'encadré DISPARAISSENT : le banc " +
          "voit donc bien ce qu'il prétend avoir corrigé",
        temoinGauche !== fond && temoinDroite !== fond,
        `gauche ${temoinGauche} · droite ${temoinDroite} (fond ${fond})`
      );
    }

    /* ---- §4 — LA PHOTO ET LA FENÊTRE SUPERPOSÉE ----------------- */
    verif(
      "LA PHOTO N'A PAS CHANGÉ DE TAILLE : 564 × 705, exactement ce que " +
        "mesurait la nº 297",
      Math.abs(m.largeurPhoto - 564) < 0.001 &&
        Math.abs(m.hauteurPhoto - 705) < 0.001,
      `${m.largeurPhoto.toFixed(3)} × ${m.hauteurPhoto.toFixed(3)}`
    );

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
        const r = (n) => n.getBoundingClientRect();
        return {
          largeurDroite: r(droite).width,
          //  ⚠️ LA MÊME BOÎTE QUE LA nº 297 : la colonne du carrousel,
          //  relevée à 579,000 — pas l'enveloppe de la photo, qui est
          //  une autre boîte (579,375) et brouillerait la comparaison.
          largeurColonnePhoto: r(colonne).width,
          hauteurPhoto: r(boitePhoto).height,
          hauteurDroite: r(droite).height,
          videEntre: r(droite).left - r(boitePhoto).right,
        };
      });
      verif(
        "LA FENÊTRE SUPERPOSÉE N'A PAS BOUGÉ D'UN PIXEL : sa colonne de " +
          "lecture fait toujours 380 px, sa colonne de photo 579,000, sa " +
          "hauteur 724,234, et il n'y a aucun vide entre les deux",
        Math.abs(f.largeurDroite - 380) < 0.001 &&
          Math.abs(f.largeurColonnePhoto - 579) < 0.001 &&
          Math.abs(f.hauteurPhoto - 724.234) < 0.01 &&
          Math.abs(f.hauteurPhoto - f.hauteurDroite) < 0.001 &&
          Math.abs(f.videEntre) < 0.001,
        `lecture ${f.largeurDroite} · photo ${f.largeurColonnePhoto} × ` +
          `${f.hauteurPhoto.toFixed(3)} · vide ${f.videEntre}`
      );
    } else {
      nonJoue(
        "la fenêtre superposée en vivant",
        "aucun lien interne n'a ouvert de fenêtre sur cette fiche de " +
          "démonstration ; elle n'est de toute façon pas touchée par cette " +
          "passe — aucun de ses fichiers n'est modifié"
      );
    }
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
