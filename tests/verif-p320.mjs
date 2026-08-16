/**
 * BANC DE LA PASSE Nº 320 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — ANNULATION : les deux pages retrouvent leur mise en page
 *      d'avant la nº 319 — mais le TEXTE de « Qui sommes-nous » et
 *      les DEUX LIBELLÉS de Contact restent ceux de la nº 319.
 * §2 — UN SEUL VOILE : l'opacité mesurée avec une, deux et trois
 *      fenêtres ouvertes doit être IDENTIQUE, et la page du fond doit
 *      encore se voir à trois — décodé au pixel.
 * §3 — LE TRAIT redescend d'un demi-cran : #3B3B42, mesuré peint.
 *
 * ⚠️ UNE SEULE LARGEUR : 1440 × 823, celle du propriétaire. Un seul
 * navigateur, refermé à la fin.
 */
//  ⚠️ LE CROCHET D'ALIAS S'ENREGISTRE, IL NE S'IMPORTE PAS (nº 302).
import { register } from "node:module";
register("./_alias-src.mjs", import.meta.url);

import {
  BASE,
  bilan,
  lire,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";
import { lirePixels } from "./_pixels.mjs";

const { COULEURS_SOMBRE } = await import("@/config/tatouage");

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

//  ⚠️ CES TROIS-LÀ SE LISENT AVEC LEURS NOTES : c'est le COMMENTAIRE
//  D'EXCEPTION qu'on y cherche.
const qsn = lire("src/app/(tatouage)/qui-sommes-nous/page.tsx");
const contact = lire("src/app/(tatouage)/contact/page.tsx");
const formulaire = lire("src/components/FormulaireContactYokofolio.tsx");
const pile = sansNotes(lire("src/components/PileFiches.tsx"));
const fenetre = sansNotes(lire("src/components/FenetreFiche.tsx"));
const grille = sansNotes(lire("src/components/GrilleTatoueurs.tsx"));
const favoris = sansNotes(lire("src/components/PageFavoris.tsx"));

const FOND = [26, 26, 29]; //  #1A1A1D

const { nav, ctx, page } = await ouvrirLeNavigateur("p320", {
  width: 1440,
  height: 823,
});

/* ==================================================================
 * §1 — L'ANNULATION, ET CE QUI EST GARDÉ
 * ================================================================== */
titre("§1 — les deux pages sont revenues, et le commentaire y est");
{
  //  LE COMMENTAIRE D'EXCEPTION, MOT POUR MOT, SUR CHACUNE.
  const normalise = (t) =>
    t.replace(/^\s*\*[ \t]?/gm, " ").replace(/\s+/g, " ").toLowerCase();
  const REGLE = normalise(
    "ces deux pages ont leur propre mise en page, plus libre que la " +
      "charte du reste du site. c'est une exception assumée, décidée par " +
      "le propriétaire à la passe nº 320 après avoir vu le résultat de " +
      "leur passage à la charte. aucune passe future ne doit les y ramener."
  );
  verif(
    "LE COMMENTAIRE D'EXCEPTION est écrit sur « Qui sommes-nous »",
    normalise(qsn).includes(REGLE),
    "phrase entière retrouvée"
  );
  verif(
    "…et sur « Contact »",
    normalise(contact).includes(REGLE),
    "phrase entière retrouvée"
  );
  verif(
    "…et sur son formulaire, où vivent les écarts de charte",
    normalise(formulaire).includes(REGLE),
    "phrase entière retrouvée"
  );

  /* ---------- QUI SOMMES-NOUS : la mise en page d'avant ---------- */
  await page.goto(`${BASE}/qui-sommes-nous`, { waitUntil: "networkidle" });
  const q = await page.evaluate(() => {
    const main = document.querySelector("main");
    const h1 = getComputedStyle(main.querySelector("h1"));
    const chapo = getComputedStyle(main.querySelector("h1 + p"));
    const h2 = getComputedStyle(main.querySelector("h2"));
    return {
      h1: { taille: h1.fontSize, casse: h1.textTransform, align: h1.textAlign },
      chapo: { taille: chapo.fontSize, align: chapo.textAlign },
      h2: { taille: h2.fontSize, casse: h2.textTransform },
      /*  ⚠️ ON NE CHERCHE QUE LE TRAIT DU SITE, par sa couleur. Compter
          tout bord supérieur d'un pixel ramassait la note de
          démonstration (un encadré rose), qui n'a rien à voir avec
          les séparateurs posés par la nº 319. */
      traits: [...main.querySelectorAll("*")].filter(
        (n) => getComputedStyle(n).borderTopColor === "rgb(59, 59, 66)"
      ).length,
      lienSecondaire: (() => {
        const a = [...main.querySelectorAll("a")].pop();
        const s = getComputedStyle(a);
        return { bordure: s.borderTopWidth, fond: s.backgroundColor };
      })(),
      paragraphes: [...main.querySelectorAll("p")].map((p) =>
        p.textContent.replace(/ /g, " ").replace(/\s+/g, " ").trim()
      ),
      gras: [...main.querySelectorAll("strong")].map((n) =>
        n.textContent.trim()
      ),
    };
  });
  verif(
    "LA GRANDE TYPOGRAPHIE EST REVENUE : le titre est grand, en bas de " +
      "casse, centré — plus le titre de section de 13 px de la nº 319",
    Number.parseFloat(q.h1.taille) > 30 &&
      q.h1.casse === "none" &&
      q.h1.align === "center",
    `h1 ${q.h1.taille} · ${q.h1.casse} · ${q.h1.align}`
  );
  verif(
    "…le chapô est grand et centré",
    Number.parseFloat(q.chapo.taille) >= 19 && q.chapo.align === "center",
    `${q.chapo.taille} · ${q.chapo.align}`
  );
  verif(
    "…les titres de section sont grands et en bas de casse",
    Number.parseFloat(q.h2.taille) > 20 && q.h2.casse === "none",
    `h2 ${q.h2.taille} · ${q.h2.casse}`
  );
  verif(
    "…et les traits de séparation de la nº 319 ont disparu de la page",
    q.traits === 0,
    `${q.traits} trait(s)`
  );
  /*  ⚠️ AMENDÉ PAR LA nº 321 — LE CONTOUR DU LIEN SECONDAIRE
      ------------------------------------------------------------------
      CE BANC EXIGEAIT ICI un contour d'1 px et un fond transparent sur
      le second bouton de la page : c'était l'un des « écarts de charte
      assumés » que la nº 320 avait remis en place en annulant la
      nº 319. LE PROPRIÉTAIRE A LEVÉ CET ÉCART-LÀ À LA nº 321-§5 : le
      bouton est devenu « Crée ton portfolio », une capsule PLEINE
      (#33333A, #4A4A53 au survol, texte blanc) SANS AUCUN CONTOUR.
      Son SUJET a donc été retiré par décision — la mesure n'est ni
      ratée ni supprimée : elle est REFAITE À L'ENVERS ci-dessous, et
      mesurée en entier (les deux fonds, le mot, la capsule, le bouton
      rose voisin) dans `verif-p321.mjs`, §5.
      ⚠️ CE QUE LA nº 320 GARDE, ET QUI N'EST PAS EN CAUSE : la mise en
      page LIBRE de la page. C'est toujours l'exception qui décide ici —
      ce bouton n'a pas pris l'habit standard de la charte, il a pris
      celui que le propriétaire a demandé, sur cette page-là. */
  verif(
    "LE LIEN SECONDAIRE N'A PLUS DE CONTOUR — l'écart gardé par la " +
      "nº 320 est levé par le propriétaire à la nº 321-§5",
    q.lienSecondaire.bordure === "0px" &&
      q.lienSecondaire.fond === "rgb(51, 51, 58)",
    `bordure ${q.lienSecondaire.bordure} · fond ${q.lienSecondaire.fond}`
  );

  /*  ⚠️ AMENDÉ PAR LA nº 321 — LE TEXTE DE LA PAGE
      ------------------------------------------------------------------
      CE BANC RECOPIAIT ICI les neuf paragraphes et les quatre gras, au
      mot près. LE PROPRIÉTAIRE A RETOUCHÉ TROIS CHOSES À LA nº 321-§4 :
      un « il » ajouté au premier paragraphe, la consigne « Choisis un
      style, une ville et un rayon : » passée en gras et en blanc, et la
      phrase sur Instagram réécrite ET remise en style normal. Les
      attendus d'ici sont donc périmés — non parce qu'ils étaient faux,
      mais parce que le texte a changé par décision.
      ET ON NE LES RECOPIE PAS UNE TROISIÈME FOIS : le texte au mot près
      vit désormais dans `verif-p321.mjs` §4, ET LÀ SEULEMENT — avec, en
      plus, les trois retouches nommées une à une et les six paragraphes
      restés intacts. Trois copies du même texte, ce sont trois endroits
      à corriger à la retouche suivante, et deux oubliés.
      CE QUI RESTE MESURÉ ICI, parce que c'est le sujet DE LA nº 320 et
      de personne d'autre : que la page porte toujours NEUF paragraphes
      et QUATRE gras — c'est-à-dire que la mise en page revenue n'a ni
      perdu ni ajouté un bloc en chemin. */
  verif(
    "LA PAGE PORTE TOUJOURS SES NEUF PARAGRAPHES ET SES QUATRE GRAS " +
      "(leur texte au mot près se mesure dans p321-§4)",
    q.paragraphes.length === 9 && q.gras.length === 4,
    `${q.paragraphes.length} paragraphes · ${q.gras.length} gras`
  );

  /* ---------- CONTACT : la mise en page d'avant, deux mots gardés --- */
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForSelector("#contact-nom", { timeout: 20000 });
  const c = await page.evaluate(() => {
    const main = document.querySelector("main");
    const champ = main.querySelector("#contact-nom");
    const s = getComputedStyle(champ);
    return {
      nom: champ.getAttribute("placeholder"),
      email: main.querySelector("#contact-email").getAttribute("placeholder"),
      rayon: s.borderRadius,
      bordure: s.borderTopColor,
      etiquettes: [...main.querySelectorAll("label")].map((l) =>
        l.textContent.trim()
      ),
      h1: getComputedStyle(main.querySelector("h1")).fontSize,
    };
  });
  verif(
    "LES ÉCARTS DE CHARTE SONT REVENUS : contour du champ, arrondi 12 px, " +
      "libellés au-dessus",
    c.rayon === "12px" &&
      c.bordure === "rgb(56, 56, 63)" &&
      c.etiquettes.join(" · ") === "Ton nom · Ton adresse e-mail · Ton message",
    `${c.rayon} · ${c.bordure} · ${c.etiquettes.length} étiquette(s)`
  );
  verif(
    "…et le grand titre de la page aussi",
    Number.parseFloat(c.h1) > 20,
    c.h1
  );
  //  LE FOCUS ROSE, revenu lui aussi.
  await page.click("#contact-nom");
  await page.waitForTimeout(350);
  const focus = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector("#contact-nom"));
    return { bordure: s.borderTopColor, ombre: s.boxShadow };
  });
  verif(
    "LE FOCUS ROSE est revenu : bordure rose et halo",
    focus.bordure === "rgb(238, 61, 111)" && focus.ombre !== "none",
    `${focus.bordure} · halo ${focus.ombre !== "none" ? "présent" : "absent"}`
  );
  verif(
    "§1 GARDÉ DE LA nº 319 : les deux libellés vivent DANS leur champ",
    c.nom === "Nom" && c.email === "E-mail",
    `« ${c.nom} » · « ${c.email} »`
  );
}

/* ==================================================================
 * §3 — LE TRAIT, MESURÉ PEINT
 * ================================================================== */
titre("§3 — le trait redescend d'un demi-cran");
{
  verif(
    "le jeton vaut #3B3B42 — le milieu exact entre #2C2C31 et #4A4A53",
    COULEURS_SOMBRE.trait === "#3B3B42" &&
      0x3b === Math.round((0x2c + 0x4a) / 2) &&
      0x42 === Math.round((0x31 + 0x53) / 2),
    `${COULEURS_SOMBRE.trait} — milieu de #2C2C31 et #4A4A53`
  );
  await page.goto(`${BASE}/tatoueur/ligne-claire-studio-nantes`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("h1", { timeout: 20000 });
  const attendu = "rgb(59, 59, 66)";
  /*  ⚠️ ON RECONNAÎT LE TRAIT À SA COULEUR, pas à sa forme. Prendre le
      premier bord d'un pixel attrapait la note de démonstration — un
      encadré ROSE : on mesurait un objet qui n'a rien à voir. */
  const t = await page.evaluate((cible) => {
    const traits = [...document.querySelectorAll("main *")].filter(
      (n) => getComputedStyle(n).borderTopColor === cible
    );
    const s = traits[0] ? getComputedStyle(traits[0]) : null;
    return {
      combien: traits.length,
      couleur: s?.borderTopColor ?? "aucun",
      epaisseur: s?.borderTopWidth ?? "—",
    };
  }, attendu);
  verif(
    "le trait d'une fiche est peint en #3B3B42, et reste d'un pixel",
    t.combien > 0 && t.couleur === attendu && t.epaisseur === "1px",
    `${t.combien} trait(s) · ${t.couleur} · ${t.epaisseur}`
  );
  const ecart = Math.round((59 - FOND[0] + (59 - FOND[1]) + (66 - FOND[2])) / 3);
  verif(
    "…son écart au fond de page tombe entre les deux valeurs d'avant : " +
      "19/255 (avant la nº 315) et 50/255 (la nº 315)",
    ecart > 19 && ecart < 50,
    `écart ${ecart}/255 (fond ${FOND.join(",")})`
  );
}

/* ==================================================================
 * §2 — UN SEUL VOILE
 * ================================================================== */
titre("§2 — un seul voile, une deux trois fenêtres");
{
  //  LA RÈGLE, À LA SOURCE — les trois surfaces qui montrent des fiches.
  verif(
    "la fenêtre ne peint plus son voile d'office : c'est un réglage",
    /avecVoile = true/.test(fenetre) &&
      /\$\{avecVoile \? " bg-black\/80" : ""\}/.test(fenetre),
    "FenetreFiche : avecVoile"
  );
  verif(
    "…et la surface de fermeture reste, même sans peinture : cliquer à " +
      "côté referme toujours",
    /absolute inset-0\$\{avecVoile/.test(fenetre) &&
      /onClick=\{surFermeture\}[\s\S]{0,120}absolute inset-0/.test(fenetre),
    "le voile garde son onClick"
  );
  verif(
    "LA PILE PORTE LA RÈGLE : seul son premier cran peint, et seulement " +
      "si rien ne voile déjà dessous",
    /avecVoile=\{rang === 0 && !voileDejaPose\}/.test(pile),
    "rang === 0 && !voileDejaPose"
  );
  verif(
    "LES TROIS SURFACES sont couvertes : la mosaïque et « Ma sélection » " +
      "posent déjà leur voile, une page de fiche non",
    /<PileFiches surProfondeur=\{setProfondeurPile\} voileDejaPose>/.test(
      grille
    ) &&
      /<PileFiches surProfondeur=\{setProfondeurPile\} voileDejaPose>/.test(
        favoris
      ) &&
      /<PileFiches actif=\{!apercu\}>/.test(
        sansNotes(lire("src/components/FicheTatoueur.tsx"))
      ),
    "mosaïque · Ma sélection · page de fiche"
  );

  /* ---------- EN VIVANT : une, deux, trois fenêtres ---------- */
  /*  ⚠️ ON COMPTE LES VOILES PEINTS, PAS LES BOÎTES ABSOLUES. Une
      première écriture ramassait tout `[aria-hidden]` en position
      absolue d'une fenêtre — la croix, les fondus, la plaque — et
      annonçait trois voiles là où il n'y en a qu'un. `data-voile-fiche`
      n'est posé QUE par le voile RÉELLEMENT peint : c'est le repère,
      et il ne peut pas se tromper. La surface de fermeture, elle, est
      l'ENFANT DIRECT `aria-hidden` de chaque fenêtre — peinte ou non. */
  const opacites = async () =>
    page.evaluate(() => {
      const peints = [...document.querySelectorAll("[data-voile-fiche]")];
      return {
        fenetres: document.querySelectorAll('[role="dialog"][aria-modal="true"]')
          .length,
        voilesPeints: peints.length,
        teinte: peints[0]
          ? getComputedStyle(peints[0]).backgroundColor
          : "aucune",
        fermetures: document.querySelectorAll(
          '[role="dialog"][aria-modal="true"] > [aria-hidden="true"]'
        ).length,
      };
    });

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-carte]", { timeout: 20000 });
  await page
    .locator('[data-carte] a[href^="/tatoueur/atelier-corvus-lyon-1er?"]')
    .first()
    .click();
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
  await page
    .locator('[role="dialog"] [role="radio"]', { hasText: "Profil" })
    .click();
  await page.waitForTimeout(900);
  const un = await opacites();

  await page
    .locator('[role="dialog"] a[href="/tatoueur/nadege-roux-villeurbanne"]')
    .first()
    .click();
  await page.waitForTimeout(1400);
  const deux = await opacites();

  const fenetreDeux = page.locator('[role="dialog"]').last();
  await fenetreDeux.locator('[role="radio"]', { hasText: "Profil" }).click();
  await page.waitForTimeout(700);
  await fenetreDeux.locator('a[href^="/tatoueur/"]').first().click();
  await page.waitForTimeout(1400);
  const trois = await opacites();

  verif(
    "UNE fenêtre : un seul voile peint",
    un.fenetres === 1 && un.voilesPeints === 1,
    `${un.fenetres} fenêtre · ${un.voilesPeints} voile · ${un.teinte}`
  );
  verif(
    "DEUX fenêtres : TOUJOURS un seul voile peint",
    deux.fenetres === 2 && deux.voilesPeints === 1,
    `${deux.fenetres} fenêtres · ${deux.voilesPeints} voile · ${deux.teinte}`
  );
  verif(
    "TROIS fenêtres : toujours UN SEUL",
    trois.fenetres === 3 && trois.voilesPeints === 1,
    `${trois.fenetres} fenêtres · ${trois.voilesPeints} voile · ${trois.teinte}`
  );
  verif(
    "LES TROIS TEINTES SONT IDENTIQUES — l'opacité ne s'accumule plus",
    un.teinte === deux.teinte && deux.teinte === trois.teinte,
    `${un.teinte} = ${deux.teinte} = ${trois.teinte}`
  );
  verif(
    "…et chaque fenêtre garde SA surface de fermeture : cliquer à côté " +
      "referme, à tous les crans",
    trois.fermetures === 3,
    `${trois.fermetures} surfaces pour 3 fenêtres`
  );

  /* ---------- LA PREUVE AU PIXEL : la page du fond se voit ---------- */
  /*  ⚠️ ON POSE UN FOND MAGENTA PLEIN ÉCRAN, DERRIÈRE LES FENÊTRES.
      Une mosaïque de photos n'a pas de couleur : lue à travers le
      voile, on ne saurait pas si ce qu'on voit est la page ou du
      bruit. Et sa POSITION n'est pas fiable ici — le corps est gelé
      (`gelerLeCorps`), donc décalé. On pose donc une plaque `fixed
      inset-0` sous les fenêtres (z-index 0 contre leur z-60) : elle
      couvre tout l'écran, sa couleur est connue, et la lecture devient
      une arithmétique. 0,2 × 255 = 51 à travers UN voile de 80 %,
      contre 10 à deux voiles et 2 à trois. On ne mesure QUE le voile,
      jamais le sujet. */
  await page.evaluate(() => {
    const plaque = document.createElement("div");
    plaque.id = "fond-temoin-p320";
    plaque.style.cssText =
      "position:fixed;inset:0;z-index:0;background:#FF00FF";
    document.body.appendChild(plaque);
  });
  await page.waitForTimeout(300);
  const png = await page.screenshot();
  const pix = lirePixels(png);
  //  Le bord gauche, à mi-hauteur : aucune fenêtre n'y pose sa carte
  //  (elles sont centrées), il n'y a donc que le voile et le témoin.
  const p = pix.pixel(10, Math.round(pix.hauteur / 2));
  verif(
    "AU PIXEL, TROIS FENÊTRES OUVERTES : la page du fond se voit encore — " +
      "un magenta plein rend 20 % de lui-même à travers l'unique voile",
    p[0] > 40 && p[0] < 70 && p[2] > 40 && p[2] < 70,
    `${p[0]},${p[1]},${p[2]} — un seul voile rend ~51, deux ~10, trois ~2`
  );
}

await ctx.close();
await nav.close();
process.exit(bilan());
