/**
 * BANC DE LA PASSE Nº 292 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 le cadre est au format 4/5, TOUJOURS : sa hauteur découle de sa
 *    largeur, jamais de son contenu. Le banc reproduit la mécanique
 *    qui la faisait grandir (un contenu en flux plus haut que le
 *    rapport) et montre qu'elle ne mord plus ;
 * §2 « Irezumi » seul dans la famille, « Japonais · Irezumi » au
 *    premier niveau — un seul style, deux libellés ;
 * §3 le titre du nom, plus petit sur le web, inchangé au doigt.
 * ⚠️ UNE SEULE FENÊTRE, ET C'EST LA SIENNE : 1440 × 823, densité 2 —
 * celle du relevé du propriétaire. Aucun banc de régression rejoué
 * ici : c'est la consigne de livraison rapide.
 */
import { rmSync, writeFileSync } from "node:fs";
import {
  BASE,
  RACINE,
  bilan,
  chromium,
  lire,
  nonJoue,
  titre,
  verif,
} from "./commun-verif.mjs";

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const carrousel = sansNotes(lire("src/components/CarrouselPortfolio.tsx"));
const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const config = sansNotes(lire("src/config/tatouage.ts"));

/** La fiche de démonstration qui a PLUSIEURS photos : c'est elle qui
    peut prouver le défilement et l'accrochage. */
const FICHE = "atelier-corvus-lyon-1er";

titre("§1 — à la source : la hauteur ne vient plus du contenu");
{
  const cadre = carrousel.slice(
    carrousel.indexOf("data-role=\"cadre\""),
    carrousel.indexOf("{photos.map(")
  );
  verif(
    //  ⚠️ AMENDÉE À LA nº 293-§3, SUR CONSIGNE : le format n'est plus
    //  posé quand le carrousel est VIDE — il ferait un grand rectangle
    //  noir là où il n'y avait rien. Le fait vérifié ne change pas :
    //  dès qu'il y a une photo, le cadre porte son 4/5 et son `min-h-0`.
    "LE CADRE PORTE LUI-MÊME LE FORMAT 4/5, et `min-h-0` lui retire le " +
      "minimum-contenu : c'est sa largeur qui décide de sa hauteur",
    /n > 0 \? CADRE_PHOTO_PORTFOLIO : ""\s*\} min-h-0/.test(
      cadre.replace(/\s+/g, " ").replace(/" \} min-h-0/, '" } min-h-0')
    )
  );
  verif(
    //  ⚠️ AMENDÉE À LA nº 294 PUIS À LA nº 295-§1, SUR CONSIGNE : la
    //  colonne ROGNE, et elle ne peint plus RIEN (le fond que la nº 294
    //  y avait descendu était encore une couleur à découvrir). Le fait
    //  vérifié ne change pas : `min-h-0` et le format 4/5 y sont.
    "LA COLONNE AUSSI : `min-h-0`, format 4/5 conservé — les deux " +
      "disent la même chose et ne peuvent pas diverger",
    /shrink-0 snap-start snap-always min-h-0 overflow-hidden \$\{CADRE_PHOTO_PORTFOLIO\}/.test(
      carrousel
    )
  );
  verif(
    "CE QUI A ÉTÉ PAYÉ CHER EST INTACT : la largeur entière de la " +
      "nº 280, le défilement natif avec accrochage, le calage au pixel " +
      "de la nº 282, et la restauration de position",
    /w-\[round\(down,100%,1px\)\]/.test(carrousel) &&
      /overflow-x-auto snap-x snap-mandatory/.test(carrousel) &&
      /marginLeft: calage \|\| undefined/.test(carrousel) &&
      /left: colonne\.offsetLeft/.test(carrousel)
  );
  verif(
    "AUCUN APERÇU N'EST REVENU : la photo reste posée en une fois, " +
      "sans `srcset`, sans `sizes`, sans fondu d'opacité",
    (() => {
      const photo = sansNotes(lire("src/components/PhotoProgressive.tsx"));
      return (
        !/srcset|sizes=|transition-opacity|animate-/.test(photo) &&
        /width=\{PHOTO_PORTFOLIO\.largeur\}/.test(photo) &&
        /height=\{PHOTO_PORTFOLIO\.hauteur\}/.test(photo)
      );
    })()
  );
  verif(
    "LES DIMENSIONS DÉCLARÉES SONT EXACTEMENT AU FORMAT 4/5 — ce " +
      "n'est donc PAS la déclaration qui étirait le cadre",
    /PHOTO_PORTFOLIO = \{ largeur: 1080, hauteur: 1350 \}/.test(config) &&
      1350 / 1080 === 1.25
  );
}

titre("§2 et §3 — à la source");
{
  verif(
    "« Irezumi » est un libellé DE FAMILLE : le catalogue, lui, ne " +
      "connaît que « Japonais · Irezumi » — sinon le nom changerait " +
      "aussi sur les fiches, les badges et les pages style + ville",
    /intitules: \{ japonais: "Irezumi" \}/.test(config) &&
      /\{ slug: "japonais", label: "Japonais · Irezumi", couleur: "#1F4E5F" \}/.test(
        config
      ) &&
      /label: propres\[slug\] \?\? libelleStyle\(slug\)/.test(config)
  );
  verif(
    "§3 — LE TITRE DU NOM : 22 px → 19 px sur le web, 20 px au doigt " +
      "inchangés",
    /text-\[20px\] lg:text-\[19px\] font-bold/.test(contenu) &&
      !/lg:text-\[22px\]/.test(contenu)
  );
}

titre("§2 — le catalogue, rejoué sur le vrai code");
{
  const copie = `${RACINE}/tests/_catalogue-p292.mts`;
  writeFileSync(copie, lire("src/config/tatouage.ts"));
  const { entreesExplorer, libelleStyle } = await import(
    `file://${copie}?${Date.now()}`
  );
  rmSync(copie, { force: true });
  const entrees = entreesExplorer();
  const famille = entrees.find((e) => e.genre === "famille");
  const dedans = famille.styles.map((s) => s.label);
  const premier = entrees.filter((e) => e.genre === "style").map((e) => e.label);

  verif(
    "DANS LA FAMILLE : « Irezumi », et pas « Japonais · Irezumi »",
    dedans.includes("Irezumi") && !dedans.includes("Japonais · Irezumi"),
    dedans.join(" · ")
  );
  verif(
    "AU PREMIER NIVEAU : « Japonais · Irezumi », entier",
    premier.includes("Japonais · Irezumi") && !premier.includes("Irezumi")
  );
  verif(
    "UN SEUL STYLE, UN SEUL SLUG : les deux entrées désignent " +
      "`japonais`, et le catalogue n'a pas bougé",
    famille.styles.find((s) => s.label === "Irezumi").slug === "japonais" &&
      libelleStyle("japonais") === "Japonais · Irezumi"
  );
  verif(
    "ET RIEN D'AUTRE NE CHANGE : onze dans la famille, trente au " +
      "premier niveau, trente et une entrées",
    dedans.length === 11 && premier.length === 30 && entrees.length === 31,
    `${dedans.length} · ${premier.length} · ${entrees.length}`
  );
}

titre("vivant — 1440 × 823, densité 2 : LA FENÊTRE DU PROPRIÉTAIRE");
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

    const lire5 = () =>
      page.evaluate(() => {
        const enveloppe = document
          .querySelector("[data-photo-fiche]")
          .getBoundingClientRect();
        const barre = document.querySelector("header").getBoundingClientRect();
        const cadre = document.querySelector(
          '[data-photo-fiche] [data-role="cadre"]'
        );
        const boite = cadre.getBoundingClientRect();
        return {
          ecran: window.innerHeight,
          hauteur: boite.height,
          largeur: boite.width,
          bas: enveloppe.bottom,
          dessus: enveloppe.top - barre.bottom,
          dessous: window.innerHeight - enveloppe.bottom,
          colonnes: cadre.children.length,
          debordeDedans: cadre.scrollHeight - cadre.clientHeight,
        };
      });
    const m = await lire5();

    verif(
      "LE CADRE EST AU FORMAT 4/5 — sa hauteur EST sa largeur × 1,25",
      Math.abs(m.hauteur - m.largeur * 1.25) < 0.01,
      `${m.largeur.toFixed(3)} × 1,25 = ${(m.largeur * 1.25).toFixed(3)} · ` +
        `mesuré ${m.hauteur.toFixed(3)}`
    );
    verif(
      "IL NE DÉBORDE PLUS SOUS L'ÉCRAN : zéro",
      m.bas <= m.ecran,
      `bas ${m.bas.toFixed(3)} pour un écran de ${m.ecran} — ` +
        `débordement ${Math.max(0, m.bas - m.ecran).toFixed(3)}`
    );
    //  ⚠️ AMENDÉE À LA nº 293-§1, SUR CONSIGNE : l'écart passe de
    //  moins d'un pixel à moins de cinq — c'est le reste du calage de
    //  la largeur sur un multiple de 4, qui supprime tout bord
    //  fractionnaire. Il va TOUJOURS du bon côté.
    verif(
      "LES DEUX MARGES SONT JUMELLES — l'écart résiduel est le calage " +
        "sur 4 px de la nº 293, et il joue toujours DU BON CÔTÉ",
      m.dessous - m.dessus <= 5 && m.dessous >= m.dessus,
      `dessus ${m.dessus.toFixed(3)} · dessous ${m.dessous.toFixed(3)}`
    );
    verif(
      "RIEN NE DÉBORDE À L'INTÉRIEUR NON PLUS : le contenu du cadre " +
        "tient dans sa hauteur, il n'a rien à faire défiler vers le bas",
      m.debordeDedans === 0,
      `${m.debordeDedans} px`
    );

    /*  LA MÉCANIQUE, REPRODUITE : un enfant EN FLUX plus haut que le
        rapport 4/5. C'est lui qui faisait passer le cadre de 706 à
        1618 px avant cette passe — mesuré. */
    await page.evaluate(() => {
      const colonne = document.querySelector(
        '[data-photo-fiche] [data-role="colonne 0"]'
      );
      const cale = document.createElement("div");
      cale.id = "cale-du-banc";
      cale.style.cssText = "height:912px;width:10px";
      colonne.appendChild(cale);
    });
    await page.waitForTimeout(500);
    const apres = await lire5();
    verif(
      "912 px DE CONTENU EN FLUX dans une colonne : le cadre ne bouge " +
        "PAS D'UN PIXEL — la photo se recadre, elle n'étire plus rien",
      apres.hauteur === m.hauteur && apres.largeur === m.largeur,
      `${m.hauteur.toFixed(3)} → ${apres.hauteur.toFixed(3)}`
    );
    await page.evaluate(() =>
      document.getElementById("cale-du-banc")?.remove()
    );
    await page.waitForTimeout(300);

    /*  ET CE QUI A ÉTÉ PAYÉ CHER MARCHE ENCORE, EN VIVANT. */
    const defilement = await page.evaluate(async () => {
      const cadre = document.querySelector(
        '[data-photo-fiche] [data-role="cadre"]'
      );
      const colonne = cadre.querySelector('[data-role="colonne 2"]');
      if (!colonne) return null;
      cadre.scrollTo({ left: colonne.offsetLeft });
      await new Promise((suite) => setTimeout(suite, 900));
      return {
        ecart: cadre.scrollLeft - colonne.offsetLeft,
        piste: cadre.scrollWidth,
        colonneLargeur: colonne.getBoundingClientRect().width,
        combien: cadre.children.length,
      };
    });
    verif(
      "LE DÉFILEMENT NATIF ET L'ACCROCHAGE TIENNENT : on se pose sur la " +
        "colonne au pixel, et la piste vaut exactement N colonnes",
      defilement !== null &&
        Math.abs(defilement.ecart) < 0.5 &&
        Math.abs(
          defilement.piste - defilement.combien * Math.round(m.largeur)
        ) < 2,
      defilement
        ? `écart ${defilement.ecart} · piste ${defilement.piste} pour ` +
          `${defilement.combien} colonnes`
        : "moins de trois photos"
    );

    /* ---------- §3 — le titre, mesuré ------------------------------ */
    const titreNom = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return {
        taille: getComputedStyle(h1).fontSize,
        graisse: getComputedStyle(h1).fontWeight,
        sousTitre: getComputedStyle(h1.nextElementSibling).fontSize,
      };
    });
    verif(
      "§3 — LE TITRE FAIT 19 px SUR LE WEB, et il reste de loin le plus " +
        "important : le sous-titre juste dessous en fait 12",
      titreNom.taille === "19px" &&
        Number(titreNom.graisse) >= 700 &&
        parseFloat(titreNom.sousTitre) < 19,
      `titre ${titreNom.taille} · sous-titre ${titreNom.sousTitre}`
    );

    /* ---------- §2 — le menu, en vivant ---------------------------- */
    await page.goto(`${BASE}/`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    await page.locator('button[aria-label="Explorer"]').first().click();
    await page.waitForTimeout(800);
    await page.locator('[role="listbox"] button').first().click();
    await page.waitForTimeout(700);
    await page.locator('[data-sous-porte="Cultures du monde"]').click();
    await page.waitForTimeout(600);
    const mots = await page.evaluate(() =>
      [...document.querySelectorAll('[role="listbox"] button')]
        .map((b) => (b.textContent ?? "").replace(/\d+$/, "").trim())
        .filter(Boolean)
    );
    verif(
      "§2 EN VIVANT : « Irezumi » sous la porte, « Japonais · Irezumi » " +
        "à sa lettre — les deux dans la même liste, chacun à sa place",
      mots.includes("Irezumi") &&
        mots.includes("Japonais · Irezumi") &&
        mots.filter((mot) => mot === "Irezumi").length === 1,
      mots.filter((mot) => /Irezumi/.test(mot)).join(" | ")
    );
  } finally {
    await nav.close();
  }
}

nonJoue(
  "§1 dans Safari, et sur la vraie page « Mon portfolio »",
  "ni WebKit ni session ici. Mais la mécanique fautive N'EST PAS " +
    "propre à Safari : elle est reproduite au banc dans Chromium " +
    "(un contenu en flux de 912 px faisait passer le cadre de 706 à " +
    "1618 px), et le remède est vérifié sur la même reproduction. " +
    "La sonde `?sonde-photo=1` reste en place : c'est sa ligne " +
    "« déborde sous l'écran » qui prononcera le verdict"
);
nonJoue(
  "le carrousel DANS UNE CARTE de la mosaïque",
  "il n'existe qu'au doigt et sur une carte à plusieurs photos — les " +
    "cartes de démonstration de ce conteneur n'en ont qu'une, aucun " +
    "n'est monté. Il est posé dans une boîte `absolute inset-0` d'un " +
    "parent déjà en 4/5 et `overflow-hidden` : le format que le cadre " +
    "porte désormais y calcule la MÊME hauteur, et ce parent la " +
    "borne de toute façon"
);

process.exit(bilan());
