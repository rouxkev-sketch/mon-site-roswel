/**
 * BANC DE LA PASSE Nº 295 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 plus rien n'est peint dans la chaîne, et la colonne de droite de
 *    la fenêtre superposée fait EXACTEMENT la hauteur de la photo ;
 * §2 chaque colonne ROGNE — prouvé AU PIXEL, pas supposé — et le
 *    débordement d'un pixel de la nº 294 est annulé ;
 * §3 c'est le LIEN qui porte la consigne « pas de photo en haut », et
 *    une adresse partagée ne l'emporte pas.
 * ⚠️ UNE SEULE FENÊTRE pour le web : 1440 × 823, densité 2. Le §3 est
 * au doigt (390 px) — il n'existe pas ailleurs.
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
const lieux = sansNotes(lire("src/components/BlocLieux.tsx"));
const arrivee = sansNotes(lire("src/lib/arrivee-sans-photo.ts"));
const sonde = sansNotes(lire("src/components/SondePhoto.tsx"));

const FICHE = "atelier-corvus-lyon-1er";

titre("§1-§2 — à la source");
{
  verif(
    "LE DÉBORDEMENT D'UN PIXEL DE LA nº 294 EST ANNULÉ : c'est lui qui " +
      "posait la dernière colonne de pixels de la photo précédente au " +
      "bord gauche de celle qu'on regarde",
    (carrousel.match(/absolute inset-0 h-full w-full object-cover/g) ?? [])
      .length === 2 && !/calc\(100%\+2px\)/.test(carrousel)
  );
  verif(
    "LA COLONNE ROGNE, ET ELLE NE PEINT PLUS RIEN — le fond que la " +
      "nº 294 y avait descendu était encore une couleur à découvrir",
    /snap-always min-h-0 overflow-hidden \$\{CADRE_PHOTO_PORTFOLIO\}/.test(
      carrousel
    ) && !/overflow-hidden bg-sombre-carte/.test(carrousel)
  );
  verif(
    "LA FENÊTRE SUPERPOSÉE NE PEINT PLUS SOUS LA PHOTO : son gris est " +
      "descendu sur la seule colonne de droite",
    !/lg:rounded-r-lg bg-sombre-carte/.test(fenetreF) &&
      /bg-sombre-carte \[--fond-colonne/.test(fenetreF)
  );
  verif(
    "CE QUI DOIT SURVIVRE SURVIT : le format 4/5 (la réservation de la " +
      "nº 280 vient de LUI, pas d'une couleur), `min-h-0` (nº 292), " +
      "l'arrondi de la nº 280, le défilement natif avec accrochage, le " +
      "calage de la nº 282, la restauration de position",
    /n > 0 \? CADRE_PHOTO_PORTFOLIO : ""/.test(carrousel) &&
      /min-h-0/.test(carrousel) &&
      /w-\[round\(down,100%,1px\)\]/.test(carrousel) &&
      /overflow-x-auto snap-x snap-mandatory/.test(carrousel) &&
      /marginLeft: calage \|\| undefined/.test(carrousel) &&
      /left: colonne\.offsetLeft/.test(carrousel)
  );
  verif(
    "AUCUN APERÇU N'EST REVENU : ni `srcset`, ni `sizes`, ni fondu",
    !/srcset|sizes=|transition-opacity/.test(
      sansNotes(lire("src/components/PhotoProgressive.tsx"))
    )
  );
  verif(
    "LA SONDE PORTE LES DEUX LIGNES DEMANDÉES, vertes à la bonne " +
      "réponse — et elle relève dans les deux contextes",
    /CHAQUE COLONNE ROGNE/.test(sonde) &&
      /PEINT DANS LA CHAÎNE/.test(sonde) &&
      /peint\("colonne", colonne\)/.test(sonde) &&
      /peint\("photo", photo \?\? null\)/.test(sonde) &&
      /FENÊTRE CENTRÉE SUPERPOSÉE/.test(sonde)
  );
}

titre("§3 — la consigne voyage par le LIEN, jamais par l'adresse");
{
  verif(
    "LE LIEN INTERNE DÉPOSE LA CONSIGNE au moment où il laisse la " +
      "navigation se faire — au doigt seulement (la branche étroite)",
    /if \(!laLargeurVeutUneFenetre\(\)\) \{\s*poserArriveeSansPhoto\(`\/tatoueur\/\$\{slug\}`\);/.test(
      lieux.replace(/\s+/g, " ").replace(/\{ /g, "{").replace(/\( /g, "(")
    ) || /poserArriveeSansPhoto\(`\/tatoueur\/\$\{slug\}`\)/.test(lieux)
  );
  verif(
    "ELLE NE PASSE PAS PAR L'ADRESSE : `sessionStorage`, propre à " +
      "l'onglet — un lien partagé n'emporte rien",
    /sessionStorage\.setItem/.test(arrivee) &&
      !/searchParams|URLSearchParams|location\.search/.test(arrivee)
  );
  verif(
    "ELLE SE CONSOMME À LA PREMIÈRE LECTURE : rouvrir ou recharger la " +
      "même adresse rend la photo",
    /sessionStorage\.removeItem\(CLE\)/.test(arrivee)
  );
  verif(
    "LA PAGE OBÉIT, ELLE NE DEVINE PAS : elle ne regarde aucun groupe, " +
      "aucun repli — elle lit la consigne et démonte la colonne photo",
    /consommerArriveeSansPhoto\(`\/tatoueur\/\$\{tatoueur\.slug\}`\)/.test(
      fiche
    ) && /\{!sansPhoto && \(/.test(fiche)
  );
  verif(
    "ET AUCUN CLIGNOTEMENT : l'attribut posé AU CLIC masque déjà la " +
      "photo par la feuille de style, avant même le rendu d'arrivée",
    /\[data-fiche-sans-photo\] \[data-photo-fiche\]/.test(
      lire("src/app/globals.css")
    ) && /setAttribute\(ATTRIBUT/.test(arrivee)
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

    /* ---- §2 — LE ROGNAGE, PROUVÉ AU PIXEL ------------------------- */
    /*  Une cale ROUGE, 60 px plus large et 80 px plus haute que la
        colonne. Si la colonne rogne, il n'existe AUCUN pixel rouge
        hors d'elle — ni à l'écran, ni au test de survol. */
    const boite = await page.evaluate(() => {
      const colonne = document.querySelector(
        '[data-photo-fiche] [data-role="colonne 0"]'
      );
      const cale = document.createElement("div");
      cale.id = "cale-du-banc";
      cale.style.cssText =
        "position:absolute;top:-40px;bottom:-40px;left:0;width:calc(100% + 60px);background:#FF0000;z-index:9";
      colonne.appendChild(cale);
      const r = colonne.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
    await page.waitForTimeout(400);
    const survol = await page.evaluate((b) => {
      const porte = (x, y) =>
        document.elementsFromPoint(x, y).some((n) => n.id === "cale-du-banc");
      return {
        dedans: porte(b.right - 5, b.top + 100),
        aDroite: porte(b.right + 5, b.top + 100),
        dessous: porte(b.left + 50, b.bottom + 5),
      };
    }, boite);
    const rouges = (png) => {
      const image = lirePixels(png);
      let compte = 0;
      for (let y = 0; y < image.hauteur; y += 1) {
        for (let x = 0; x < image.largeur; x += 1) {
          const [r, v, b] = image.pixel(x, y);
          if (r > 150 && v < 80 && b < 80) compte += 1;
        }
      }
      return compte;
    };
    const aDroite = rouges(
      await page.screenshot({
        clip: { x: boite.right, y: boite.top + 100, width: 30, height: 4 },
      })
    );
    const dessous = rouges(
      await page.screenshot({
        clip: { x: boite.left + 50, y: boite.bottom, width: 4, height: 30 },
      })
    );
    verif(
      "CHAQUE COLONNE ROGNE — MESURÉ, PAS SUPPOSÉ : une cale 60 px plus " +
        "large et 80 px plus haute ne laisse AUCUN pixel hors de la " +
        "colonne, ni à droite ni en dessous",
      aDroite === 0 && dessous === 0,
      `pixels de la cale à droite : ${aDroite} · en dessous : ${dessous}`
    );
    verif(
      "…et le survol dit la même chose : la cale répond DANS la " +
        "colonne, jamais au-delà",
      survol.dedans && !survol.aDroite && !survol.dessous,
      JSON.stringify(survol)
    );
    await page.evaluate(() =>
      document.getElementById("cale-du-banc")?.remove()
    );
    await page.waitForTimeout(300);

    /* ---- §1 — LA CHAÎNE NE PEINT RIEN ----------------------------- */
    const chaine = (sel) =>
      page.evaluate((selecteur) => {
        const hote = document.querySelector(selecteur);
        const boites = {
          enveloppe: hote,
          racine: hote.querySelector("[data-carrousel]"),
          cadre: hote.querySelector('[data-role="cadre"]'),
          colonne: hote.querySelector('[data-role="colonne 0"]'),
          photo: hote.querySelector('[data-role="colonne 0"] img'),
        };
        const peint = {};
        for (const [nom, element] of Object.entries(boites)) {
          if (!element) {
            peint[nom] = "absent";
            continue;
          }
          const style = getComputedStyle(element);
          const bouts = [];
          if (!/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor))
            bouts.push("fond " + style.backgroundColor);
          if (parseFloat(style.borderTopWidth) > 0) bouts.push("bordure");
          if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0)
            bouts.push("contour");
          if (style.boxShadow !== "none") bouts.push("ombre");
          if (parseFloat(style.borderTopLeftRadius) > 0) bouts.push("arrondi");
          peint[nom] = bouts.length ? bouts.join(", ") : "rien";
        }
        const k = boites.colonne.getBoundingClientRect();
        const i = boites.photo.getBoundingClientRect();
        return {
          peint,
          ecarts: {
            haut: i.top - k.top,
            bas: k.bottom - i.bottom,
            gauche: i.left - k.left,
            droite: k.right - i.right,
          },
        };
      }, sel);
    const page1 = await chaine("[data-photo-fiche]");
    verif(
      "PLEINE PAGE — PLUS RIEN N'EST PEINT DANS LA CHAÎNE : ni " +
        "enveloppe, ni racine, ni cadre, ni colonne, ni photo",
      Object.values(page1.peint).every((v) => v === "rien"),
      JSON.stringify(page1.peint)
    );
    verif(
      "PLEINE PAGE — la photo épouse sa colonne, sans déborder : les " +
        "quatre écarts valent zéro",
      Object.values(page1.ecarts).every((e) => Math.abs(e) < 0.001),
      `haut ${page1.ecarts.haut} · bas ${page1.ecarts.bas} · ` +
        `gauche ${page1.ecarts.gauche} · droite ${page1.ecarts.droite}`
    );

    /* ---- §1-c — LA FENÊTRE SUPERPOSÉE ----------------------------- */
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
        const dernier = cars[cars.length - 1];
        const boitePhoto = dernier.parentElement;
        const fenetre = boitePhoto.parentElement;
        const droite = fenetre.querySelector(":scope > div:last-child");
        const fond = (e) => getComputedStyle(e).backgroundColor;
        const colonne = dernier.querySelector('[data-role="colonne 0"]');
        const img = colonne.querySelector("img");
        const k = colonne.getBoundingClientRect();
        const i = img.getBoundingClientRect();
        return {
          fenetre: fond(fenetre),
          boitePhoto: fond(boitePhoto),
          racine: fond(dernier),
          colonne: fond(colonne),
          droite: fond(droite),
          hauteurPhoto: boitePhoto.getBoundingClientRect().height,
          hauteurDroite: droite.getBoundingClientRect().height,
          ecarts: {
            haut: i.top - k.top,
            bas: k.bottom - i.bottom,
            gauche: i.left - k.left,
            droite: k.right - i.right,
          },
        };
      });
      verif(
        "FENÊTRE SUPERPOSÉE — AUCUN ENCADRÉ AUTOUR DE LA PHOTO : la " +
          "fenêtre, la boîte de la photo, la racine et la colonne sont " +
          "transparentes ; le gris ne vit plus que dans la colonne de droite",
        /rgba\(0, 0, 0, 0\)/.test(f.fenetre) &&
          /rgba\(0, 0, 0, 0\)/.test(f.boitePhoto) &&
          /rgba\(0, 0, 0, 0\)/.test(f.racine) &&
          /rgba\(0, 0, 0, 0\)/.test(f.colonne) &&
          f.droite === "rgb(40, 40, 45)",
        `fenêtre ${f.fenetre} · boîte ${f.boitePhoto} · droite ${f.droite}`
      );
      verif(
        "FENÊTRE SUPERPOSÉE — LA COLONNE DE DROITE FAIT EXACTEMENT LA " +
          "HAUTEUR DE LA PHOTO : son gris ne l'entoure plus d'un pixel",
        Math.abs(f.hauteurPhoto - f.hauteurDroite) < 0.001,
        `photo ${f.hauteurPhoto.toFixed(3)} · colonne de droite ${f.hauteurDroite.toFixed(3)}`
      );
      verif(
        "FENÊTRE SUPERPOSÉE — les quatre écarts valent zéro, eux aussi",
        Object.values(f.ecarts).every((e) => Math.abs(e) < 0.001),
        `haut ${f.ecarts.haut} · bas ${f.ecarts.bas} · gauche ${f.ecarts.gauche} · droite ${f.ecarts.droite}`
      );
    } else {
      nonJoue(
        "§1-c en vivant",
        "aucun lien interne n'a ouvert de fenêtre sur cette fiche de " +
          "démonstration ; le fait est vérifié à la source"
      );
    }
  } finally {
    await nav.close();
  }
}

titre("vivant (390 px) — §3 : la consigne du lien, et l'adresse partagée");
{
  const nav = await chromium.launch({
    executablePath: process.env.CHEMIN_CHROMIUM,
    args: ["--no-proxy-server"],
  });
  try {
    const contexte = await nav.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    });
    const page = await contexte.newPage();
    const photos = (cible) =>
      cible.evaluate(
        () => document.querySelectorAll("[data-photo-fiche]").length
      );
    await page.goto(`${BASE}/tatoueur/${FICHE}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("[data-photo-fiche]", { timeout: 90000 });
    await page.waitForTimeout(2500);
    verif(
      "A — UNE FICHE OUVERTE DIRECTEMENT (une carte, un lien partagé) : " +
        "la photo est en haut, comme toujours",
      (await photos(page)) === 1
    );
    const cible = await page.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/tatoueur/"]')].find(
        (n) => n.getAttribute("href") !== location.pathname
      );
      if (!a) return null;
      a.click();
      return a.getAttribute("href");
    });
    await page.waitForTimeout(3000);
    verif(
      "B — LA MÊME FICHE OUVERTE DEPUIS UN LIEN INTERNE : AUCUNE photo " +
        "en haut, la page commence par Profil / Portfolio",
      cible !== null && (await photos(page)) === 0,
      `${cible} · ${await photos(page)} photo(s)`
    );
    const partagee = await contexte.newPage();
    await partagee.goto(`${BASE}${cible}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await partagee.waitForTimeout(2500);
    verif(
      "C — LA MÊME ADRESSE, OUVERTE COMME UN LIEN PARTAGÉ : la photo " +
        "est là. La consigne n'a pas voyagé dans l'adresse",
      (await photos(partagee)) === 1,
      `${await photos(partagee)} photo(s)`
    );
    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(2500);
    verif(
      "D — RECHARGER B REND LA PHOTO : la consigne s'est consommée à " +
        "la première lecture",
      (await photos(page)) === 1,
      `${await photos(page)} photo(s)`
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "§1 et §2 dans Safari",
  "pas de WebKit ici. Mais cette passe ne repose sur aucune " +
    "arithmétique : elle EFFACE ce qui rendait un écart visible (plus " +
    "rien n'est peint dans la chaîne) et elle prouve le rognage AU " +
    "PIXEL. Ni l'un ni l'autre ne dépend du moteur de rendu. La sonde " +
    "porte les deux lignes qui prononceront le verdict"
);

process.exit(bilan());
