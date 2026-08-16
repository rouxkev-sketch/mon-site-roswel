/**
 * BANC DE LA PASSE Nº 323 — LIVRAISON RAPIDE
 * ==================================================================
 * TOUTE LA PASSE PORTE SUR « MA SÉLECTION », ONGLET DES PORTFOLIOS.
 *
 * §1 — LE NOM ET LE SOUS-TITRE MONTENT D'UN CRAN, EN WEB SEULEMENT.
 * §2 — DE LA MARGE ENTRE L'IDENTITÉ ET LA GALERIE, EN WEB SEULEMENT.
 * §3 — UNE SEULE GRAMMAIRE SOUS LE NOM : « LE TYPE · OÙ », pour un
 *      artiste comme pour un lieu, web et smartphone.
 *
 * ⚠️ COMMENT LES §1 ET §2 SONT MESURÉS, ET POURQUOI AINSI.
 * ------------------------------------------------------------------
 * La page /mes-favoris répond 307 sans une session Supabase SIGNÉE PAR
 * LE SERVEUR : le cookie fabriqué du socle ne franchit pas
 * `auth.getUser()`, et ce conteneur n'a pas de quoi en signer un. On ne
 * peut donc pas l'ouvrir. Ce banc ne CONTOURNE pas ce mur, il fait
 * autre chose : il LIT LES CLASSES DANS LE FICHIER SOURCE, puis les
 * pose sur un élément dans une VRAIE page du site — donc avec la vraie
 * feuille Tailwind compilée — et mesure ce que le navigateur en peint.
 * Ce qui est prouvé est donc : « ces classes-là, dans ce site-là, font
 * ces pixels-là ». Ce qui ne l'est pas : que la page assemble bien ces
 * éléments — c'est dit en NON JOUÉE, et ce n'est pas déguisé.
 * ⚠️ LES CLASSES NE SONT PAS RECOPIÉES À LA MAIN : elles sont
 * EXTRAITES du composant. Si quelqu'un les change, la mesure change.
 *
 * ⚠️ UNE SEULE LARGEUR : 1440 × 823, celle du propriétaire — plus une
 * mesure au doigt POUR PROUVER QU'IL NE BOUGE PAS (§1 et §2 sont web
 * seulement : le dire sans le mesurer ne vaudrait rien).
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

const { ligneDIdentite, villesDuSuivi } = await import(
  "@/lib/selection-suivis"
);
const { ligneCarte } = await import("@/lib/adresse");
const { libelleTypeFiche } = await import("@/config/tatouage");

const sansNotes = (t) =>
  t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const SOURCE = lire("src/components/BlocSuivis.tsx");
const SOURCE_NUE = sansNotes(SOURCE);

/* ==================================================================
 * §3 — LA LIGNE SOUS LE NOM, EXÉCUTÉE SUR LES CINQ CAS
 * ================================================================== */
titre("§3 — « LE TYPE · OÙ » : les cinq cas du propriétaire, exécutés");

/** Un mode d'exercice, réduit à ce que la ligne d'identité en lit. */
const mode = (genre, ville, region, pays, codePays, extra = {}) => ({
  id: `${genre}-${ville}`,
  genre,
  role: null,
  salon_id: null,
  ville,
  region,
  pays,
  code_pays: codePays,
  intitule: null,
  debut_le: null,
  fin_le: null,
  ...extra,
});

/** Un portfolio suivi, réduit de même. */
const suivi = (nom, typeFiche, etablissement, modes, lieu = {}) => ({
  id: nom,
  nom,
  slug: nom,
  ville: lieu.ville ?? "Lyon",
  region: lieu.region ?? null,
  pays: lieu.pays ?? "France",
  codePays: lieu.codePays ?? "FR",
  photoProfil: null,
  typeFiche,
  etablissement,
  modes,
  recentes: [],
  nouveautes: 0,
});

{
  const CAS = [
    [
      "un ARTISTE dans UNE ville",
      suivi("a1", "artiste", "", [
        mode("salon", "Paris", null, "France", "FR"),
      ]),
      "Artiste · Paris, France",
    ],
    [
      "…LE MÊME, avec DEUX MODES DANS LA MÊME VILLE — aucun « +1 » (§3-d)",
      suivi("a2", "artiste", "", [
        mode("domicile", "Paris", null, "France", "FR"),
        mode("salon", "Paris", null, "France", "FR"),
      ]),
      "Artiste · Paris, France",
    ],
    [
      "un ARTISTE dans TROIS villes — « +2 » (§3-c)",
      suivi("a3", "artiste", "", [
        mode("domicile", "Paris", null, "France", "FR"),
        mode("salon", "Lyon", null, "France", "FR"),
        mode("guest", "Marseille", null, "France", "FR"),
      ]),
      "Artiste · Paris, France +2",
    ],
    [
      "un ARTISTE avec un ÉTAT — l'écriture internationale (§3-b)",
      suivi("a4", "artiste", "", [
        mode("salon", "Austin", "Texas", "États-Unis", "US"),
      ]),
      "Artiste · Austin, TX, États-Unis",
    ],
    [
      "un SALON — inchangé",
      suivi("s1", "salon", "salon", [], {
        ville: "Austin",
        region: "Texas",
        pays: "États-Unis",
        codePays: "US",
      }),
      "Salon · Austin, TX, États-Unis",
    ],
  ];
  for (const [nom, cas, attendu] of CAS) {
    const obtenu = ligneDIdentite(cas);
    verif(`${nom} → « ${attendu} »`, obtenu === attendu, `« ${obtenu} »`);
  }

  //  LE STUDIO PRIVÉ, la troisième nature — pour que les trois mots du
  //  site soient tous éprouvés.
  verif(
    "…et un STUDIO PRIVÉ dit « Studio », le mot des cartes",
    ligneDIdentite(
      suivi("p1", "salon", "prive", [], { ville: "Félines", pays: "France" })
    ) === "Studio · Félines, France",
    ligneDIdentite(
      suivi("p1", "salon", "prive", [], { ville: "Félines", pays: "France" })
    )
  );
}

titre("§3 — les détails qui comptent : a, b, c, d, e, f");
{
  //  §3-a — PLUS AUCUN MODE D'EXERCICE SUR CETTE LIGNE.
  const tousLesModes = suivi("m", "artiste", "", [
    mode("domicile", "Paris", null, "France", "FR"),
    mode("studio", "Lyon", null, "France", "FR"),
    mode("salon", "Nantes", null, "France", "FR"),
    mode("guest", "Marseille", null, "France", "FR", {
      debut_le: "2026-12-01",
      fin_le: "2026-12-10",
    }),
  ]);
  const ligne = ligneDIdentite(tousLesModes, "2026-08-16");
  verif(
    "§3-a — AUCUN MOT DE MODE : ni « En salon », ni « En studio », ni « À domicile », ni « Guest »",
    !/salon|studio|domicile|guest/i.test(ligne),
    `« ${ligne} »`
  );
  verif(
    "…et le composant n'appelle plus `genreMode` — l'import est parti aussi",
    !/genreMode/.test(sansNotes(lire("src/lib/selection-suivis.ts"))),
    "plus aucune trace de `genreMode` dans selection-suivis"
  );

  //  §3-b — LA PREMIÈRE VILLE EN ENTIER, PAR L'ÉCRITURE QUI EXISTE.
  verif(
    "§3-b — LE LIEU EST ÉCRIT PAR `ligneCarte`, l'écriture des cartes (nº 301)",
    ligneDIdentite(
      suivi("b", "artiste", "", [
        mode("salon", "Austin", "Texas", "États-Unis", "US"),
      ])
    ) ===
      `${libelleTypeFiche("artiste", "")} · ${ligneCarte({
        ville: "Austin",
        region: "Texas",
        pays: "États-Unis",
        code_pays: "US",
      })}`,
    "la ligne est composée des DEUX fonctions du site, pas d'une copie"
  );
  verif(
    "…et le fichier n'écrit AUCUNE seconde grammaire de lieu : il appelle `ligneCarte`",
    (sansNotes(lire("src/lib/selection-suivis.ts")).match(/ligneCarte\(/g) ?? [])
      .length >= 2 &&
      /import \{ ligneCarte \} from "@\/lib\/adresse"/.test(
        lire("src/lib/selection-suivis.ts")
      ),
    "`ligneCarte` importée et seule employée"
  );

  //  §3-c — « +N » ET RIEN D'AUTRE.
  const trois = ligneDIdentite(
    suivi("c", "artiste", "", [
      mode("salon", "Paris", null, "France", "FR"),
      mode("salon", "Lyon", null, "France", "FR"),
      mode("salon", "Nantes", null, "France", "FR"),
    ])
  );
  verif(
    "§3-c — LE COMPTE EST « +2 », après le pays, et rien d'autre",
    trois.endsWith("France +2") && !/autres|villes|et /i.test(trois),
    `« ${trois} »`
  );
  verif(
    "…et DEUX villes donnent « +1 »",
    ligneDIdentite(
      suivi("c2", "artiste", "", [
        mode("salon", "Paris", null, "France", "FR"),
        mode("salon", "Lyon", null, "France", "FR"),
      ])
    ) === "Artiste · Paris, France +1",
    "« +1 »"
  );

  //  §3-d — LE DÉDOUBLONNAGE, éprouvé sur la LISTE DES VILLES.
  verif(
    "§3-d — deux modes dans la même ville ne font QU'UNE entrée",
    villesDuSuivi(
      suivi("d", "artiste", "", [
        mode("domicile", "Paris", null, "France", "FR"),
        mode("salon", "Paris", null, "France", "FR"),
        mode("studio", "Paris", null, "France", "FR"),
      ])
    ).length === 1,
    "3 modes → 1 ville"
  );

  //  §3-e — L'ORDRE DÉCLARÉ, ET PAS UN CLASSEMENT.
  /*  LA PREUVE TIENT À CECI : `modesOrdonnes` range par genre — à
      domicile AVANT en salon. On déclare donc le salon EN PREMIER et le
      domicile ensuite ; si un classement s'appliquait, « Lyon »
      passerait devant. C'est « Nantes » qui doit s'écrire. */
  const declare = suivi("e", "artiste", "", [
    mode("salon", "Nantes", null, "France", "FR"),
    mode("domicile", "Lyon", null, "France", "FR"),
  ]);
  verif(
    "§3-e — L'ORDRE EST CELUI DE L'ARTISTE : la ville écrite est la PREMIÈRE DÉCLARÉE",
    ligneDIdentite(declare) === "Artiste · Nantes, France +1",
    `« ${ligneDIdentite(declare)} » (un classement par genre aurait dit « Lyon »)`
  );
  verif(
    "…et `modesOrdonnes` n'est PAS appelé pour construire cette ligne",
    /for \(const mode of suivi\.modes\)/.test(
      sansNotes(lire("src/lib/selection-suivis.ts"))
    ),
    "`suivi.modes` parcouru tel quel"
  );

  //  §3-f — JAMAIS UNE ADRESSE.
  const avecAdresse = suivi("f", "artiste", "", [
    mode("domicile", "Paris", null, "France", "FR", {
      adresse: "12 Rue de la République",
      intitule: "18 Chemin du Bois",
    }),
  ]);
  const rendu = ligneDIdentite(avecAdresse);
  verif(
    "§3-f — NI RUE NI NUMÉRO : une adresse posée sur le mode n'entre pas dans la ligne",
    rendu === "Artiste · Paris, France" && !/\d|Rue|Chemin/.test(rendu),
    `« ${rendu} »`
  );
  verif(
    "…et le repli sur l'INTITULÉ du mode a été retiré : un intitulé n'est pas une ville",
    !/mode\.intitule/.test(sansNotes(lire("src/lib/selection-suivis.ts"))),
    "plus aucun repli sur `intitule`"
  );

  //  UNE SESSION GUEST TERMINÉE NE GONFLE PAS LE COMPTE.
  const guestFini = suivi("g", "artiste", "", [
    mode("salon", "Paris", null, "France", "FR"),
    mode("guest", "Berlin", null, "Allemagne", "DE", {
      debut_le: "2026-01-01",
      fin_le: "2026-01-10",
    }),
  ]);
  verif(
    "UNE SESSION GUEST TERMINÉE NE COMPTE PAS — la règle du §2 de la nº 243 tient",
    ligneDIdentite(guestFini, "2026-08-16") === "Artiste · Paris, France",
    `« ${ligneDIdentite(guestFini, "2026-08-16")} » (sans le « +1 » de Berlin)`
  );
  verif(
    "…mais une session À VENIR compte : c'est un endroit où il travaillera",
    ligneDIdentite(
      suivi("g2", "artiste", "", [
        mode("salon", "Paris", null, "France", "FR"),
        mode("guest", "Berlin", null, "Allemagne", "DE", {
          debut_le: "2026-12-01",
          fin_le: "2026-12-10",
        }),
      ]),
      "2026-08-16"
    ) === "Artiste · Paris, France +1",
    "« +1 »"
  );
}

titre("§3 — le composant ne décide plus un seul mot");
{
  verif(
    "LE COMPOSANT APPELLE `ligneDIdentite` — la boucle sur les modes est partie",
    /const identite = ligneDIdentite\(suivi\);/.test(SOURCE_NUE) &&
      !/lignesDInformation/.test(SOURCE_NUE),
    "un appel, une chaîne"
  );
  verif(
    "…et la date de guest ne se rend plus sous le nom (plus de `data-date-guest`)",
    !/data-date-guest/.test(SOURCE_NUE) &&
      !/data-guest-proche/.test(SOURCE_NUE),
    "les deux marqueurs de la nº 244-§3 sont partis avec les modes"
  );
  verif(
    "LA BOÎTE DE TEXTE EST DE NOUVEAU TOUJOURS CENTRÉE — le cas à deux branches n'existe plus",
    /flex-col justify-center/.test(SOURCE_NUE) &&
      !/justify-start" : "justify-center/.test(SOURCE_NUE),
    "`justify-center`, sans condition"
  );
}

/* ==================================================================
 * §1 ET §2 — LES PIXELS
 * ================================================================== */
titre("§1 et §2 — ce que les classes du composant peignent vraiment");

/*  LES TROIS CHAÎNES DE CLASSES, LUES DANS LE COMPOSANT.
    ------------------------------------------------------------------
    On part du contenu (`{suivi.nom}`, `{identite}`) et on REMONTE au
    `className` qui le précède immédiatement : c'est le seul repère qui
    ne dépende ni de l'ordre des attributs ni de la mise en forme du
    fichier. Rien n'est recopié ici — si quelqu'un change une classe
    dans le composant, la mesure qui suit change avec elle. */
const classesAvant = (marqueur) => {
  const fin = SOURCE.indexOf(marqueur);
  const debut = SOURCE.lastIndexOf('className="', fin);
  const ouvre = debut + 'className="'.length;
  return SOURCE.slice(ouvre, SOURCE.indexOf('"', ouvre))
    .replace(/\s+/g, " ")
    .trim();
};

const NOM = classesAvant("{suivi.nom}");
const INFO = classesAvant("{identite}");
const ENVELOPPE = (SOURCE.match(/classeEnveloppe="([^"]+)"/) ?? [])[1] ?? "";

{
  verif(
    "les trois chaînes de classes ont bien été extraites du composant",
    NOM.includes("text-[15px]") &&
      INFO.includes("text-[14px]") &&
      ENVELOPPE.includes("mt-"),
    `nom « ${NOM.slice(0, 40)}… » · info « ${INFO.slice(0, 30)}… » · marge « ${ENVELOPPE} »`
  );

  /** Pose les classes lues dans une VRAIE page du site, et mesure. */
  async function peindre(page, classes) {
    return page.evaluate((c) => {
      const n = document.createElement("span");
      n.className = c;
      n.textContent = "Mesure";
      document.body.appendChild(n);
      const s = getComputedStyle(n);
      const resultat = {
        taille: s.fontSize,
        graisse: s.fontWeight,
        couleur: s.color,
        margeHaut: s.marginTop,
      };
      n.remove();
      return resultat;
    }, classes);
  }

  /* ---------- LE WEB, 1440 × 823 ---------- */
  const web = await ouvrirLeNavigateur("p323", { width: 1440, height: 823 });
  await web.page.goto(BASE, { waitUntil: "networkidle" });
  const nomWeb = await peindre(web.page, NOM);
  const infoWeb = await peindre(web.page, INFO);
  const margeWeb = await peindre(web.page, ENVELOPPE);

  verif(
    "§1 WEB — LE NOM : 18 px AVANT, 20 px APRÈS",
    nomWeb.taille === "20px",
    `${nomWeb.taille} (graisse ${nomWeb.graisse})`
  );
  verif(
    "§1 WEB — LE SOUS-TITRE : 15 px AVANT, 16 px APRÈS",
    infoWeb.taille === "16px",
    infoWeb.taille
  );
  verif(
    "§1 — LA HIÉRARCHIE TIENT : le nom reste PLUS GRAND que le sous-titre",
    parseFloat(nomWeb.taille) > parseFloat(infoWeb.taille),
    `${nomWeb.taille} contre ${infoWeb.taille} — l'écart passe de 3 à 4 px`
  );
  verif(
    "§1 — …et le sous-titre reste GRIS (#A8A8B0), le nom clair (#F2F2F4)",
    infoWeb.couleur === "rgb(168, 168, 176)" &&
      nomWeb.couleur === "rgb(242, 242, 244)",
    `${infoWeb.couleur} sous ${nomWeb.couleur}`
  );
  verif(
    "§1 — la graisse du nom N'A PAS BOUGÉ : semi-gras, comme avant",
    nomWeb.graisse === "600",
    `graisse ${nomWeb.graisse}`
  );
  verif(
    "§2 WEB — LA MARGE SOUS LE SOUS-TITRE : 20 px AVANT, 36 px APRÈS",
    margeWeb.margeHaut === "36px",
    margeWeb.margeHaut
  );
  await web.nav.close();

  /* ---------- LE DOIGT, 390 × 844 — IL NE DOIT PAS BOUGER ---------- */
  const doigt = await ouvrirLeNavigateur(
    "p323d",
    { width: 390, height: 844 },
    { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }
  );
  await doigt.page.goto(BASE, { waitUntil: "networkidle" });
  const nomDoigt = await peindre(doigt.page, NOM);
  const infoDoigt = await peindre(doigt.page, INFO);
  const margeDoigt = await peindre(doigt.page, ENVELOPPE);

  verif(
    "§1 AU DOIGT — RIEN NE CHANGE : le nom garde ses 15 px",
    nomDoigt.taille === "15px",
    nomDoigt.taille
  );
  verif(
    "§1 AU DOIGT — le sous-titre garde ses 14 px",
    infoDoigt.taille === "14px",
    infoDoigt.taille
  );
  verif(
    "§2 AU DOIGT — la marge garde ses 20 px",
    margeDoigt.margeHaut === "20px",
    margeDoigt.margeHaut
  );
  await doigt.ctx.close();
  await doigt.nav.close();
}

nonJoue(
  "LA PAGE « MA SÉLECTION » OUVERTE EN VIVANT",
  "/mes-favoris répond 307 sans une session Supabase signée par le " +
    "serveur, et ce conteneur n'a pas de quoi en signer une. Ce qui est " +
    "prouvé ci-dessus : la RÈGLE du §3 est exécutée pour de vrai (les " +
    "cinq cas et les six détails passent par la fonction que la page " +
    "appelle), et les classes du §1 et du §2 sont LUES DANS LE " +
    "COMPOSANT puis peintes par la vraie feuille du site. Ce qui ne " +
    "l'est pas : l'assemblage de ces éléments dans la page — l'ordre " +
    "des blocs, la place du rond, le fait que la galerie suive bien le " +
    "sous-titre. Cela reste à l'œil du propriétaire."
);

nonJoue(
  "WEBKIT",
  "ce conteneur n'a que Chromium. Les mesures ci-dessus valent pour " +
    "Chromium et pour lui seul — ce n'est une preuve ni pour Safari, ni " +
    "pour l'iPhone du propriétaire."
);

process.exit(bilan());
