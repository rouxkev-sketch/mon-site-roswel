/**
 * BANC DE LA PASSE Nº 299 — LIVRAISON RAPIDE
 * ==================================================================
 * UN SEUL POINT : la colonne de lecture de la FICHE PLEINE PAGE passe
 * de 380 à 350 px, et l'ensemble photo + gouttière + colonne se
 * recentre — marges extérieures égales.
 * ⚠️ LA FENÊTRE SUPERPOSÉE RESTE À 380 : elle n'est pas concernée.
 * ⚠️ LE GROS DU BANC TIENT À UNE SEULE FENÊTRE : 1440 × 823, densité 2.
 * Les trois autres largeurs ne servent qu'au contrôle de débordement
 * horizontal que le propriétaire demande nommément.
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
/** Le fond de la page (`#1A1A1D`). */
const PAGE = "26,26,29";

titre("à la source — 350 en page pleine, 380 dans la fenêtre");
{
  verif(
    "LA PAGE PLEINE PASSE À 350, LA BORNE BASSE DE 340 RESTE",
    /lg:grid-cols-\[auto_minmax\(340px,350px\)\]/.test(fiche)
  );
  verif(
    "LA FENÊTRE SUPERPOSÉE EST TOUJOURS À 380 — pas un caractère de sa " +
      "colonne n'a changé",
    /lg:w-\[380px\] shrink-0 lg:h-full lg:overflow-y-auto p-5 sm:p-6/.test(
      fenetreF
    )
  );
  verif(
    "LE RECENTRAGE RESTE CELUI DE LA GRILLE : `justify-center`, aucune " +
      "marge écrite à la main",
    /lg:justify-center/.test(fiche) &&
      !/lg:ml-\[\d+px\]|lg:pl-\[\d+px\]/.test(fiche)
  );
  verif(
    "LA GOUTTIÈRE DE 40 px NE CHANGE PAS (`lg:gap-10`)",
    /grid gap-8 lg:gap-10 lg:grid-cols-/.test(fiche)
  );
  verif(
    "LA CORRECTION DES ARRONDIS DE LA nº 298 EST INTACTE : le bord qui " +
      "rogne reste écarté de 12 px, et l'encadré garde son débord de 8",
    /lg:overflow-y-auto lg:px-3 lg:-mx-3/.test(fiche) &&
      /rounded-xl -m-2 p-2/.test(blocLieux)
  );
  verif(
    "LA PHOTO N'EST PAS TOUCHÉE : largeur issue de la hauteur mesurée en " +
      "multiple de 4 (nº 290/293), rognage des colonnes (nº 295), et le " +
      "pixel de page de chaque côté (nº 297)",
    /Math\.floor\(\(libre \* 0\.8\) \/ 4\) \* 4/.test(fiche) &&
      /min-h-0 overflow-hidden/.test(carrousel) &&
      /"absolute inset-y-0 left-px h-full w-\[calc\(100%_-_2px\)\] object-cover"/.test(
        carrousel
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
    await page.waitForTimeout(3000);

    /* ---- 1. LES CINQ MESURES ------------------------------------ */
    /*  ⚠️ ON MESURE LA BOÎTE DE CONTENU DE LA COLONNE : c'est elle qui
        porte les lignes de séparation. Les 12 px de la nº 298 sont un
        débord de rognage, pas de la largeur. */
    const m = await page.evaluate(() => {
      const photo = document.querySelector("[data-photo-fiche]");
      const grille = photo.parentElement.parentElement;
      const colonne = grille.querySelector(":scope > div:last-child");
      const r = (n) => n.getBoundingClientRect();
      const cs = getComputedStyle(colonne);
      const contenuGauche = r(colonne).left + parseFloat(cs.paddingLeft);
      const contenuDroite = r(colonne).right - parseFloat(cs.paddingRight);
      return {
        fenetre: innerWidth,
        margeGauche: r(photo).left,
        largeurPhoto: r(photo).width,
        hauteurPhoto: r(photo).height,
        gouttiere: contenuGauche - r(photo).right,
        largeurColonne: contenuDroite - contenuGauche,
        margeDroite: innerWidth - contenuDroite,
      };
    });
    verif(
      "LA COLONNE DE LECTURE FAIT 350 px",
      Math.abs(m.largeurColonne - 350) < 0.001,
      `${m.largeurColonne.toFixed(3)} px`
    );
    verif(
      "LES DEUX MARGES EXTÉRIEURES SONT ÉGALES : l'ensemble est recentré",
      Math.abs(m.margeGauche - m.margeDroite) < 0.001,
      `gauche ${m.margeGauche.toFixed(3)} · droite ${m.margeDroite.toFixed(3)}`
    );
    verif(
      "LA GOUTTIÈRE VAUT TOUJOURS 40 px",
      Math.abs(m.gouttiere - 40) < 0.001,
      `${m.gouttiere.toFixed(3)} px`
    );
    verif(
      "LES CINQ MESURES S'ADDITIONNENT À LA LARGEUR DE LA FENÊTRE",
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
    verif(
      "LA PHOTO N'A PAS CHANGÉ DE TAILLE : 564 × 705, comme aux nº 297 " +
        "et nº 298",
      Math.abs(m.largeurPhoto - 564) < 0.001 &&
        Math.abs(m.hauteurPhoto - 705) < 0.001,
      `${m.largeurPhoto.toFixed(3)} × ${m.hauteurPhoto.toFixed(3)}`
    );

    /* ---- 2. LES QUATRE ARRONDIS TIENNENT TOUJOURS --------------- */
    await page.evaluate(() => {
      const photo = document.querySelector("[data-photo-fiche]");
      const grille = photo.parentElement.parentElement;
      grille
        .querySelector(":scope > div:last-child")
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
        debordGauche: c.left + parseFloat(cs.paddingLeft) - r.left,
        debordDroite: r.right - (c.right - parseFloat(cs.paddingRight)),
        resteGauche: r.left - c.left,
        resteDroite: c.right - r.right,
      };
    });
    if (!survol) {
      nonJoue(
        "les arrondis de l'encadré de survol",
        "cette fiche de démonstration ne porte aucune ligne cliquable à " +
          "encadré ; la correction de la nº 298 est vérifiée à la source"
      );
    } else {
      await page.mouse.move(0, 0);
      await page.mouse.move(
        survol.x + survol.largeur / 2,
        survol.y + survol.hauteur / 2,
        { steps: 8 }
      );
      await page.waitForTimeout(800);
      const pixel = async (x, y) => {
        const png = lirePixels(
          await page.screenshot({ clip: { x, y, width: 1, height: 1 } })
        );
        return png.pixel(0, 0).join(",");
      };
      const fond = await pixel(
        survol.x + survol.largeur / 2,
        survol.y + survol.hauteur / 2
      );
      verif(
        "L'ENCADRÉ DÉBORDE TOUJOURS DE 8 px DANS LES MARGES, avec 4 px de " +
          "reste avant le bord qui rogne",
        Math.abs(survol.debordGauche - 8) < 0.001 &&
          Math.abs(survol.debordDroite - 8) < 0.001 &&
          survol.resteGauche >= 3.999 &&
          survol.resteDroite >= 3.999,
        `débord ${survol.debordGauche}/${survol.debordDroite} · reste ` +
          `${survol.resteGauche}/${survol.resteDroite}`
      );
      const bordGauche = await pixel(survol.x, survol.y + survol.hauteur / 2);
      const bordDroite = await pixel(
        survol.x + survol.largeur - 1,
        survol.y + survol.hauteur / 2
      );
      verif(
        "SES DEUX BORDS EXTRÊMES SONT PEINTS : la colonne ne le coupe " +
          "toujours pas",
        fond !== PAGE && bordGauche === fond && bordDroite === fond,
        `fond ${fond} · gauche ${bordGauche} · droite ${bordDroite}`
      );
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
        `LES QUATRE ARRONDIS SONT TOUJOURS ENTIERS (rayon ${R} px) : fond ` +
          "de la page au pixel extrême, fond du survol à mi-rayon",
        Object.values(releve).every(
          (c) => c.extreme === PAGE && c.dedans === fond
        ),
        Object.entries(releve)
          .map(([n, c]) => `${n} ${c.extreme}→${c.dedans}`)
          .join(" · ")
      );
    }

    /* ---- 3. LA FENÊTRE SUPERPOSÉE, TOUJOURS À 380 --------------- */
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
          largeurColonnePhoto: r(colonne).width,
          hauteurPhoto: r(boitePhoto).height,
          hauteurDroite: r(droite).height,
          videEntre: r(droite).left - r(boitePhoto).right,
        };
      });
      verif(
        "LA FENÊTRE SUPERPOSÉE EST RESTÉE À 380 px, ET TOUTE SA GÉOMÉTRIE " +
          "AVEC : photo 579,000 × 724,234, aucun vide entre les deux colonnes",
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
          "démonstration ; aucun de ses fichiers n'est modifié par cette passe"
      );
    }
    await contexte.close();

    /* ---- 4. AUCUN DÉBORDEMENT HORIZONTAL, QUATRE LARGEURS ------- */
    /*  Le seul point de ce banc qui sort de la fenêtre unique — le
        propriétaire le demande nommément. Une mesure, rien de plus. */
    const larges = [];
    for (const largeur of [1024, 1280, 1440, 1920]) {
      const c = await nav.newContext({
        viewport: { width: largeur, height: 900 },
        deviceScaleFactor: 1,
      });
      const p = await c.newPage();
      await p.goto(`${BASE}/tatoueur/${FICHE}`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await p.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
      await p.waitForTimeout(1800);
      larges.push(
        await p.evaluate(() => {
          const photo = document.querySelector("[data-photo-fiche]");
          const grille = photo.parentElement.parentElement;
          const colonne = grille.querySelector(":scope > div:last-child");
          const cs = getComputedStyle(colonne);
          const r = (n) => n.getBoundingClientRect();
          const cd = r(colonne).right - parseFloat(cs.paddingRight);
          return {
            largeur: innerWidth,
            debord: document.documentElement.scrollWidth - innerWidth,
            colonne:
              cd - (r(colonne).left + parseFloat(cs.paddingLeft)),
            margeG: r(photo).left,
            margeD: innerWidth - cd,
          };
        })
      );
      await c.close();
    }
    verif(
      "AUCUN DÉBORDEMENT HORIZONTAL DE LA PAGE À 1024, 1280, 1440 ET 1920",
      larges.every((l) => l.debord === 0),
      larges.map((l) => `${l.largeur}:${l.debord}`).join(" · ")
    );
    verif(
      "…ET AUX QUATRE LARGEURS, LA COLONNE VAUT 350 ET LES DEUX MARGES " +
        "RESTENT ÉGALES",
      larges.every(
        (l) =>
          Math.abs(l.colonne - 350) < 0.001 && Math.abs(l.margeG - l.margeD) < 0.001
      ),
      larges
        .map((l) => `${l.largeur}: col ${l.colonne} · ${l.margeG}/${l.margeD}`)
        .join(" · ")
    );
  } finally {
    await nav.close();
  }
}

process.exit(bilan());
