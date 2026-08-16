/**
 * BANC DE LA PASSE Nº 315 — LIVRAISON RAPIDE
 * ==================================================================
 * §1 — LE TITRE « STYLES » DISPARAÎT, LES BADGES REMONTENT SOUS LA
 *      BIO. Éprouvé sur LES SIX COMBINAISONS demandées — artiste,
 *      salon, studio × page pleine, fenêtre superposée — puis sur le
 *      smartphone. Les badges restent des LIENS vers /tatouage/…
 * §2 — QUATRE SECTIONS FUSIONNENT EN « PRATIQUE ». L'ordre est une
 *      RÈGLE : le banc EXÉCUTE `capsulesPratiques` sur les trois cas
 *      demandés — une capsule, six, aucune — puis lit la ligne rendue
 *      en vivant.
 * §3 — LES GÉLULES DEVIENNENT DES ANGLES ARRONDIS. Rayon MESURÉ sur
 *      un badge de style et sur une capsule de PRATIQUE, aux deux
 *      appareils, et la règle de charte relue dans le code.
 * §4 — LES LIGNES DE SÉPARATION S'ÉCLAIRCISSENT. Une seule écriture
 *      là où il y en avait deux, et la peinture DÉCODÉE AU PIXEL —
 *      l'ancienne écriture reconstruite à côté de la nouvelle, sur le
 *      même fond, dans la même capture.
 *
 * ⚠️ UNE SEULE FENÊTRE PAR APPAREIL : 1440 × 823 (celle du
 * propriétaire) et 390 × 844 au doigt. Aucun balayage de largeurs.
 */
//  ⚠️ LE CROCHET D'ALIAS S'ENREGISTRE, IL NE S'IMPORTE PAS (nº 302).
import { register } from "node:module";
register("./_alias-src.mjs", import.meta.url);

import {
  BASE,
  bilan,
  lire,
  nonJoue,
  ouvrirLeNavigateur,
  titre,
  verif,
} from "./commun-verif.mjs";
import { lirePixels } from "./_pixels.mjs";

const { capsulesPratiques } = await import("@/lib/pratique-fiche");
const { COULEURS_SOMBRE, ARRONDI_ETIQUETTE, TRAIT_SEPARATION } = await import(
  "@/config/tatouage"
);

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const contenu = sansNotes(lire("src/components/ContenuFiche.tsx"));
const onglets = sansNotes(lire("src/components/OngletsLigne.tsx"));
//  ⚠️ CELUI-CI SE LIT AVEC SES NOTES : c'est justement la RÈGLE DE
//  CHARTE, écrite en commentaire, qu'on y cherche.
const config = lire("src/config/tatouage.ts");
const pratique = sansNotes(lire("src/lib/pratique-fiche.ts"));

/*  LES TROIS NATURES DE FICHE. « Studio » n'est pas une valeur de
    `type_fiche` : c'est un SALON dont l'établissement est « prive »
    (voir natureDeLaFiche) — d'où le troisième slug. */
const FICHES = [
  ["artiste", "nadege-roux-villeurbanne"],
  ["salon", "ligne-claire-studio-nantes"],
  ["studio", "studio-mille-traits-lyon-6e"],
];
//  La fiche à SIX capsules, l'exemple exact de la consigne.
const FICHE_SIX = "encre-sel-marseille-1er";

const FOND = [26, 26, 29]; //  #1A1A1D

/* ==================================================================
 * §3 · §4 — LA CHARTE, DANS LE CODE
 * ================================================================== */
titre("§3 · §4 à la source — les règles sont écrites, et partagées");
{
  //  §3 — LA RÈGLE, MOT POUR MOT.
  const regle = [
    "La gélule (`rounded-full`) est réservée aux ACTIONS",
    "bouton d'action finale, action intermédiaire, segment de sélecteur",
    "Une ÉTIQUETTE qui ne se clique pas pour agir",
    "badge de style, capsule de PRATIQUE — prend des ANGLES ARRONDIS de 8 px",
    "C'est ce qui distingue un bouton d'une information",
    "Décision du propriétaire, passe nº 315",
    "aucune passe future ne doit remettre de gélule sur une étiquette",
  ];
  /*  ⚠️ ON EFFACE LES ÉTOILES DE COMMENTAIRE AVANT DE COMPARER : la
      règle est écrite dans un bloc `/** … *\/`, où chaque ligne
      commence par « * ». Sans ça, on chercherait une phrase qui
      n'existe nulle part telle quelle — et l'on croirait la charte
      muette alors qu'elle parle. */
  const normalise = (t) =>
    t.replace(/^\s*\*[ \t]?/gm, " ").replace(/\s+/g, " ");
  const charte = normalise(config);
  const manquants = regle
    .map(normalise)
    .filter((morceau) => !charte.includes(morceau));
  verif(
    "§3 — LA RÈGLE DE CHARTE EST ÉCRITE EN COMMENTAIRE, phrase par phrase",
    manquants.length === 0,
    manquants.length ? `manque : ${manquants.join(" / ")}` : "les six phrases"
  );
  verif(
    "§3 — …ET SA LECTURE AUSSI : cliquer pour ALLER n'est pas AGIR",
    normalise(charte).includes(
      normalise("CLIQUER POUR ALLER QUELQUE PART N'EST PAS AGIR")
    ) &&
      normalise(charte).includes(
        normalise("un lien de navigation reste une ÉTIQUETTE")
      ),
    "le badge de style reste un lien, et prend quand même les angles"
  );
  verif(
    "§3 — UNE SEULE VALEUR, écrite une fois : 8 px = `rounded-lg` (nº 287)",
    ARRONDI_ETIQUETTE === "rounded-lg",
    ARRONDI_ETIQUETTE
  );
  verif(
    "§3 — plus AUCUNE gélule sur une étiquette de fiche",
    !/rounded-full[\s\S]{0,80}min-h-\[32px\]/.test(contenu) &&
      (contenu.match(/\$\{ARRONDI_ETIQUETTE\}/g) ?? []).length === 2,
    "les deux étiquettes (badge de style, capsule de PRATIQUE) consomment la constante"
  );

  //  §4 — UNE SEULE ÉCRITURE, ET ELLE EST PARTAGÉE.
  verif(
    "§4 — la séparation du profil ne choisit plus sa couleur",
    /const separation = `border-t \$\{TRAIT_SEPARATION\}`/.test(contenu) &&
      !/border-sombre-bordure/.test(contenu),
    "ContenuFiche consomme TRAIT_SEPARATION"
  );
  verif(
    "§4 — le soulignement du sélecteur à deux choix lit LA MÊME valeur",
    /h-px \$\{TRAIT_SEPARATION_FOND\}/.test(onglets) &&
      !/bg-sombre-bordure/.test(onglets),
    "OngletsLigne consomme TRAIT_SEPARATION_FOND"
  );
  verif(
    "§4 — les deux classes pointent la même variable CSS : il ne peut " +
      "plus y en avoir deux",
    /--color-sombre-trait: var\(--rw-sombre-trait\);/.test(
      lire("src/app/globals.css")
    ) &&
      /"--rw-sombre-trait": COULEURS_SOMBRE\.trait/.test(lire("src/lib/theme.ts")) &&
      TRAIT_SEPARATION === "border-sombre-trait",
    "config → theme → globals : une seule valeur, trois relais"
  );
  verif(
    "§4 — et la valeur retenue est celle de la charte",
    COULEURS_SOMBRE.trait === "#4A4A53",
    COULEURS_SOMBRE.trait
  );

  //  §1 et §2 à la source.
  verif(
    "§1 — le titre « Styles » a disparu, code compris",
    !/"Styles"/.test(contenu) && !/titre: "Styles"/.test(contenu),
    "aucun groupe « Styles » dans ContenuFiche"
  );
  verif(
    "§1 — les badges restent des LIENS vers /tatouage/<style>/<ville>",
    /href=\{`\/tatouage\/\$\{slug\}\/\$\{tatoueur\.ville_slug\}`\}/.test(contenu),
    "la valeur de référencement ne part pas avec le titre"
  );
  verif(
    "§2 — les quatre titres ont disparu, remplacés par « Pratique »",
    !/"Rendu"|"Technique"|"Types de projets"|"Besoins particuliers"/.test(
      contenu
    ) && /<h2 className=\{ECRITURE_TITRE_SECTION\}>Pratique<\/h2>/.test(contenu),
    "un seul titre"
  );
  verif(
    "§2 — pas de titre orphelin : la section est sous condition de contenu",
    /\{capsulesPratique\.length > 0 && \(/.test(contenu),
    "capsulesPratique.length > 0"
  );
  verif(
    "§2 — l'ordre fixe vit dans une fonction, donc il s'exécute",
    /rendusDuPortfolio[\s\S]*filtres_technique[\s\S]*filtres_composition[\s\S]*filtres_besoins/.test(
      pratique
    ),
    "rendu → technique → types de projets → besoins"
  );
}

/* ==================================================================
 * §2 — L'ORDRE ET LES TROIS CAS, EXÉCUTÉS
 * ================================================================== */
titre("§2 — la ligne obtenue sur trois cas : une capsule, six, aucune");
{
  const photo = (rendu) => ({ rendu });

  //  UNE SEULE CAPSULE — un portfolio entièrement en noir et gris, et
  //  rien de coché.
  const une = capsulesPratiques({ galerie: [photo("black_and_grey")] });
  verif(
    "UNE SEULE CAPSULE : la ligne tient en un mot",
    une.length === 1 && une[0] === "black_and_grey",
    `[${une.join(" · ")}]`
  );

  //  SIX CAPSULES — l'exemple de la consigne, dans son ordre.
  const six = capsulesPratiques({
    galerie: [photo("color")],
    filtres_technique: ["machine"],
    filtres_composition: ["grandes-pieces", "bodysuit"],
    filtres_besoins: ["cover", "cicatrice"],
  });
  verif(
    "SIX CAPSULES, DANS L'ORDRE FIXE : rendu, technique, types, besoins",
    six.join(" · ") ===
      "color · machine · grandes-pieces · bodysuit · cover · cicatrice",
    `[${six.join(" · ")}]`
  );

  //  AUCUNE — rien de déclaré, aucune photo taguée.
  const aucune = capsulesPratiques({ galerie: [] });
  verif(
    "AUCUNE CAPSULE : la liste est vide, donc la section ne s'affiche pas",
    Array.isArray(aucune) && aucune.length === 0,
    "[] — et le rendu est sous condition (vérifié à la source)"
  );

  //  ET L'ORDRE NE DÉPEND PAS DE L'ORDRE DES DÉCLARATIONS : la même
  //  fiche, ses quatre catégories renseignées à l'envers, rend la
  //  même ligne.
  const memeLigne = capsulesPratiques({
    filtres_besoins: ["cover"],
    filtres_composition: ["bodysuit"],
    filtres_technique: ["machine"],
    galerie: [photo("color")],
  });
  verif(
    "…et il ne dépend pas de l'ordre dans lequel la fiche est écrite",
    memeLigne.join(" · ") === "color · machine · bodysuit · cover",
    `[${memeLigne.join(" · ")}]`
  );
}

/* ==================================================================
 * §1 · §2 · §3 EN VIVANT — LE WEB (1440 × 823)
 * ================================================================== */
titre("§1 · §2 · §3 en web (1440 × 823) — page pleine ET fenêtre superposée");

/** CE QU'UNE VUE DE FICHE DOIT MONTRER, quelle qu'elle soit. */
const releveDeLaVue = () =>
  ({
    titres: [...document.querySelectorAll("h2")].map((h) => h.textContent.trim()),
    badges: [...document.querySelectorAll("[data-badges-style] a")].map((a) => ({
      texte: a.textContent.trim(),
      href: a.getAttribute("href"),
      rayon: getComputedStyle(a).borderRadius,
    })),
    capsules: [...document.querySelectorAll("[data-capsule-pratique]")].map(
      (n) => ({ texte: n.textContent.trim(), rayon: getComputedStyle(n).borderRadius })
    ),
    //  LA POSITION : les badges suivent-ils la bio, et précèdent-ils
    //  la première section titrée ?
    apresLaBio: (() => {
      const bio = document.querySelector("p.whitespace-pre-line");
      const bloc = document.querySelector("[data-badges-style]");
      if (!bloc) return null;
      if (!bio) return "sans-bio";
      return bloc.compareDocumentPosition(bio) & Node.DOCUMENT_POSITION_PRECEDING
        ? "oui"
        : "non";
    })(),
    avantLesSections: (() => {
      const bloc = document.querySelector("[data-badges-style]");
      const premierTitre = document.querySelector("h2");
      if (!bloc || !premierTitre) return null;
      return bloc.compareDocumentPosition(premierTitre) &
        Node.DOCUMENT_POSITION_FOLLOWING
        ? "oui"
        : "non";
    })(),
    ecartBadges: (() => {
      const bloc = document.querySelector("[data-badges-style]");
      return bloc ? getComputedStyle(bloc).marginTop : null;
    })(),
    dansLaFenetre: Boolean(
      document.querySelector('[role="dialog"][aria-modal="true"]')
    ),
  });

const { nav, ctx, page } = await ouvrirLeNavigateur(
  "p315",
  { width: 1440, height: 823 },
  { deviceScaleFactor: 2 }
);
const vues = [];
{
  //  LES TROIS PAGES PLEINES.
  for (const [genre, slug] of FICHES) {
    await page.goto(`${BASE}/tatoueur/${slug}`, { waitUntil: "networkidle" });
    await page.waitForSelector("h1", { timeout: 20000 });
    vues.push([`${genre} · page pleine`, await page.evaluate(releveDeLaVue)]);
  }

  //  LES TROIS FENÊTRES SUPERPOSÉES — ouvertes comme le visiteur les
  //  ouvre : une carte de la mosaïque, en web.
  for (const [genre, slug] of FICHES) {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForSelector("[data-carte]", { timeout: 20000 });
    await page
      .locator(`[data-carte] a[href^="/tatoueur/${slug}?"]`)
      .first()
      .click();
    await page.waitForSelector('[role="dialog"][aria-modal="true"]', {
      timeout: 20000,
    });
    await page.waitForTimeout(600);
    vues.push([
      `${genre} · fenêtre superposée`,
      await page.evaluate(releveDeLaVue),
    ]);
  }
}
await ctx.close();
await nav.close();

/* ==================================================================
 * §1 · §3 EN VIVANT — LE SMARTPHONE (390 × 844)
 * ================================================================== */
titre("§1 · §3 au doigt (390 × 844) — les mêmes règles, le même appareil");
const doigt = await ouvrirLeNavigateur(
  "p315m",
  { width: 390, height: 844 },
  { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
);
{
  for (const [genre, slug] of FICHES) {
    await doigt.page.goto(`${BASE}/tatoueur/${slug}`, {
      waitUntil: "networkidle",
    });
    await doigt.page.waitForSelector("h1", { timeout: 20000 });
    vues.push([
      `${genre} · smartphone`,
      await doigt.page.evaluate(releveDeLaVue),
    ]);
  }
}

/* ---- LE VERDICT, VUE PAR VUE : les neuf, aux mêmes règles ---- */
for (const [nom, vue] of vues) {
  verif(
    `${nom} — aucun titre « Styles », et UN SEUL titre : « Pratique »`,
    !vue.titres.includes("Styles") &&
      vue.titres.filter((t) => t !== "").join(",") === "Pratique",
    `h2 : ${vue.titres.join(" | ") || "—"}`
  );
  verif(
    `${nom} — les badges sont là, sous la bio, avant la première section`,
    vue.badges.length > 0 &&
      vue.apresLaBio === "oui" &&
      vue.avantLesSections === "oui" &&
      vue.ecartBadges === "28px",
    `${vue.badges.length} badge(s) · sous la bio : ${vue.apresLaBio} · ` +
      `avant les sections : ${vue.avantLesSections} · dégagement ${vue.ecartBadges}`
  );
  verif(
    `${nom} — ils restent des LIENS vers /tatouage/<style>/<ville>`,
    vue.badges.every((b) => /^\/tatouage\/[^/]+\/[^/]+$/.test(b.href)),
    vue.badges[0]?.href ?? "—"
  );
  verif(
    `${nom} — badge et capsule : 8 px d'angle, plus une gélule`,
    vue.badges.every((b) => b.rayon === "8px") &&
      vue.capsules.length > 0 &&
      vue.capsules.every((c) => c.rayon === "8px"),
    `badge ${vue.badges[0]?.rayon} · capsule ${vue.capsules[0]?.rayon}`
  );
}
//  ⚠️ LES TROIS FENÊTRES SUPERPOSÉES SE SONT BIEN OUVERTES : sans ça,
//  les quatre contrôles ci-dessus auraient jugé la page de dessous.
verif(
  "les trois fenêtres superposées étaient bien des fenêtres, pas des pages",
  vues
    .filter(([nom]) => nom.includes("fenêtre"))
    .every(([, vue]) => vue.dansLaFenetre === true),
  "role=dialog aria-modal=true, trois fois"
);

/* ==================================================================
 * §2 EN VIVANT — LA LIGNE DE SIX
 * ================================================================== */
titre("§2 en vivant — la ligne de six capsules, sur une vraie fiche");
{
  await doigt.page.goto(`${BASE}/tatoueur/${FICHE_SIX}`, {
    waitUntil: "networkidle",
  });
  await doigt.page.waitForSelector("[data-capsule-pratique]", {
    timeout: 20000,
  });
  const ligne = await doigt.page.evaluate(() =>
    [...document.querySelectorAll("[data-capsule-pratique]")].map((n) =>
      n.textContent.trim()
    )
  );
  verif(
    "SIX capsules, sous un seul titre, dans l'ordre de la règle",
    ligne.length === 6 &&
      ligne.join(" · ") ===
        "Noir et gris · Machine · Patchwork · Petit tatouage · Cover · Cicatrice",
    ligne.join(" · ")
  );
}

/* ==================================================================
 * §4 AU PIXEL — L'ANCIENNE ÉCRITURE ET LA NOUVELLE, CÔTE À CÔTE
 * ================================================================== */
titre("§4 au pixel — le trait avant et après, sur le même fond");
{
  const page2 = doigt.page;
  await page2.goto(`${BASE}/tatoueur/${FICHES[1][1]}`, {
    waitUntil: "networkidle",
  });
  await page2.waitForSelector("[data-capsule-pratique]", { timeout: 20000 });

  /*  ⚠️ ON RECONSTRUIT L'ANCIENNE ÉCRITURE À CÔTÉ DE LA NOUVELLE, sur
      la même page et dans la même capture. C'est la seule façon de
      donner un AVANT et un APRÈS comparables : le code d'avant
      n'existe plus, mais son écriture est connue au caractère près —
      `border-t border-sombre-bordure/60`, c'est-à-dire #38383F peint à
      60 % sur l'anthracite. On le repose tel quel, on décode les deux,
      et on compare des pixels, pas des souvenirs. */
  const zone = await page2.evaluate(() => {
    const section = document.querySelector("[data-capsule-pratique]").closest("div");
    const temoin = document.createElement("div");
    temoin.setAttribute("data-temoin-ancien", "");
    temoin.style.cssText =
      "height:0;border-top:1px solid rgba(56,56,63,0.6);margin-top:24px";
    section.parentElement.insertBefore(temoin, section);
    section.scrollIntoView({ block: "center" });
    return null;
  });
  void zone;
  await page2.waitForTimeout(400);

  /*  ⚠️ UNE CAPTURE SANS DÉCOUPE — donc LA FENÊTRE. Un `clip` se
      compte dans le DOCUMENT, et cette page est défilée de plus de
      mille pixels : la découpe serait allée chercher le haut du
      document, où il n'y a aucun trait. */
  const png = await page2.screenshot();
  const pix = lirePixels(png);

  /*  ⚠️ ON NE VISE AUCUNE COORDONNÉE : ON BALAIE TOUTE LA COLONNE.
      C'est la leçon de cette section. Viser le rang calculé depuis
      `getBoundingClientRect` a échoué trois fois de suite, et pour une
      raison qui n'a rien à voir avec les couleurs : entre la MESURE et
      la CAPTURE, la page se replace toute seule (la remontée d'arrivée
      d'une fiche). On lisait donc le bon rang d'une page qui n'était
      plus là, c'est-à-dire du fond.
      LE REMÈDE : les deux traits ont chacun une couleur qui n'existe
      nulle part ailleurs sur cette colonne. On balaie, on relève les
      BANDES de rangs identiques, et on les reconnaît à leur teinte —
      aucune coordonnée, donc rien à désynchroniser. */
  const bandes = [];
  let courante = null;
  for (let rang = 0; rang < pix.hauteur; rang += 1) {
    const p = pix.pixel(585, rang);
    const cle = `${p[0]},${p[1]},${p[2]}`;
    if (courante && courante.cle === cle) courante.hauteur += 1;
    else {
      courante = { cle, couleur: [p[0], p[1], p[2]], hauteur: 1 };
      bandes.push(courante);
    }
  }
  /*  UN TRAIT, C'EST TROIS RANGS EXACTEMENT — un pixel CSS à la
      densité 3. On l'exige : sans cette condition, la teinte du trait
      attrape aussi les rangs isolés d'un caractère adouci, qui n'ont
      rien à voir avec lui. */
  const trouver = (r, v, b) =>
    bandes.filter(
      (t) =>
        t.hauteur === 3 &&
        Math.abs(t.couleur[0] - r) <= 2 &&
        Math.abs(t.couleur[1] - v) <= 2 &&
        Math.abs(t.couleur[2] - b) <= 2
    );

  const anciennes = trouver(44, 44, 49);
  const nouvelles = trouver(74, 74, 83);
  const ecart = (c) =>
    Math.round((c[0] - FOND[0] + (c[1] - FOND[1]) + (c[2] - FOND[2])) / 3);
  const avant = anciennes[0]?.couleur ?? FOND;
  const apres = nouvelles[0]?.couleur ?? FOND;

  verif(
    "L'ANCIENNE ÉCRITURE, décodée : un trait à peine détaché du fond",
    anciennes.length === 1,
    `avant ${avant.join(",")} · fond ${FOND.join(",")} · ` +
      `écart ${ecart(avant)}/255`
  );
  verif(
    "LA NOUVELLE, décodée sur le même fond et dans la même capture",
    nouvelles.length >= 1,
    `après ${apres.join(",")} · fond ${FOND.join(",")} · ` +
      `écart ${ecart(apres)}/255 · ${nouvelles.length} trait(s) à l'écran`
  );
  verif(
    "…et l'écart au fond a NETTEMENT grandi",
    ecart(apres) > ecart(avant) * 1.5,
    `${ecart(avant)}/255 → ${ecart(apres)}/255 ` +
      `(× ${(ecart(apres) / ecart(avant)).toFixed(2)})`
  );
  verif(
    "les deux font la MÊME épaisseur : un pixel CSS, trois rangs à la " +
      "densité 3 — c'est la COULEUR qui change, rien d'autre",
    anciennes.length === 1 &&
      nouvelles.length >= 1 &&
      [...anciennes, ...nouvelles].every((t) => t.hauteur === 3),
    `ancien ${anciennes.map((t) => t.hauteur).join("/")} rang(s) · ` +
      `nouveau ${nouvelles.map((t) => t.hauteur).join("/")} rang(s)`
  );
  verif(
    "ELLE RESTE UN TRAIT, PAS UNE BARRE : un pixel CSS, jamais deux",
    await page2.evaluate(() => {
      const n = document.querySelector("[data-capsule-pratique]").closest("div");
      return getComputedStyle(n).borderTopWidth;
    }).then((v) => v === "1px"),
    "1px"
  );
}

await doigt.ctx.close();
await doigt.nav.close();

nonJoue(
  "§2 — LA FICHE SANS AUCUNE CAPSULE, EN VIVANT",
  "aucune fiche de démonstration n'a ses quatre catégories vides : le " +
    "rendu se DÉDUIT des photos, et toutes en ont de taguées. Le cas est " +
    "donc éprouvé en EXÉCUTANT `capsulesPratiques` (elle rend []), et la " +
    "condition de rendu est relue à la source (`capsulesPratique.length > " +
    "0`). Je n'ai pas pu voir de mes yeux une fiche sans section PRATIQUE"
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Tout ce qui précède est mesuré sur " +
    "Chromium et sur lui seul — ce n'est pas une preuve pour Safari, ni " +
    "pour l'iPhone du propriétaire"
);

process.exit(bilan());
