/**
 * BANC DE LA PASSE Nº 323 — LIVRAISON RAPIDE
 * ==================================================================
 * TOUTE LA PASSE PORTE SUR « MA SÉLECTION », ONGLET DES PORTFOLIOS.
 *
 * §1 — LE NOM ET LE SOUS-TITRE MONTENT D'UN CRAN, EN WEB SEULEMENT.
 * §2 — DE LA MARGE ENTRE L'IDENTITÉ ET LA GALERIE, EN WEB SEULEMENT.
 *      ⚠️ ANNULÉ PAR LA nº 325-§1, sur demande du propriétaire : la
 *      valeur est revenue à 20 px. Le contrôle correspondant a été
 *      refait à l'envers plus bas, et la mesure complète vit dans
 *      `verif-p325.mjs`.
 * §3 — UNE SEULE GRAMMAIRE SOUS LE NOM : « LE TYPE : OÙ », pour un
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
titre("§3 — « LE TYPE : OÙ » : les cinq cas du propriétaire, exécutés");

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
      "Artiste : Paris, France",
    ],
    [
      "…LE MÊME, avec DEUX MODES DANS LA MÊME VILLE — une seule ville (§3-d)",
      suivi("a2", "artiste", "", [
        mode("domicile", "Paris", null, "France", "FR"),
        mode("salon", "Paris", null, "France", "FR"),
      ]),
      "Artiste : Paris, France",
    ],
    [
      "un ARTISTE dans TROIS villes — les trois s'écrivent (§3-c)",
      suivi("a3", "artiste", "", [
        mode("domicile", "Paris", null, "France", "FR"),
        mode("salon", "Lyon", null, "France", "FR"),
        mode("guest", "Marseille", null, "France", "FR"),
      ]),
      "Artiste : Lyon · Marseille · Paris, France",
    ],
    [
      "un ARTISTE avec un ÉTAT — l'écriture internationale (§3-b)",
      suivi("a4", "artiste", "", [
        mode("salon", "Austin", "Texas", "États-Unis", "US"),
      ]),
      "Artiste : Austin, TX, USA",
    ],
    [
      "un SALON — inchangé",
      suivi("s1", "salon", "salon", [], {
        ville: "Austin",
        region: "Texas",
        pays: "États-Unis",
        codePays: "US",
      }),
      "Salon : Austin, TX, USA",
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
    ) === "Studio : Félines, France",
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

  /*  §3-b — LE LIEU VIENT DE `ligneCarte`, MOT POUR MOT.
      ⚠️ CE TEST A ÉTÉ REPRIS DEUX FOIS (nº 587, puis nº 589), et pour
      la même raison : il comparait la ligne à `ligneCarte` PONCTUATION
      COMPRISE, alors que c'est précisément la ponctuation que ces
      passes ont changée — le pays derrière un point médian, l'État
      entre parenthèses, le métier derrière une puce. Il éprouve
      désormais CE QU'IL VOULAIT DIRE : que chaque MOT du lieu vient du
      site et d'aucune copie, et que le métier vient de
      `libelleTypeFiche`. La FORME, elle, est éprouvée par les cinq cas
      du propriétaire, plus haut — c'est là qu'elle doit vivre. */
  const lieuDuSite = ligneCarte({
    ville: "Austin",
    region: "Texas",
    pays: "États-Unis",
    code_pays: "US",
  });
  const ligneAustin = ligneDIdentite(
    suivi("b", "artiste", "", [
      mode("salon", "Austin", "Texas", "États-Unis", "US"),
    ])
  );
  verif(
    "§3-b — TOUS LES MOTS DU LIEU VIENNENT DE `ligneCarte`, et le métier de `libelleTypeFiche`",
    lieuDuSite.split(", ").every((mot) => ligneAustin.includes(mot)) &&
      ligneAustin.startsWith(`${libelleTypeFiche("artiste", "")} `),
    `« ${ligneAustin} » contre « ${lieuDuSite} »`
  );
  verif(
    "…et le fichier n'écrit AUCUNE seconde grammaire de lieu : tout vient de lib/adresse",
    (sansNotes(lire("src/lib/selection-suivis.ts")).match(/ligneCarte\(/g) ?? [])
      .length >= 1 &&
      /import \{[^}]*\bligneCarte\b[^}]*\} from "@\/lib\/adresse"/.test(
        lire("src/lib/selection-suivis.ts")
      ),
    "`ligneCarte` importée de lib/adresse et employée"
  );

  /*  §3-c — LES VILLES S'ÉCRIVENT, ON N'EN COMPTE PLUS AUCUNE.
      ⚠️ CE TEST A ÉTÉ REPRIS (nº 586). Il exigeait « +2 » puis « +1 » —
      la règle des nº 585 et 586 les a supprimés : on lit des villes, pas
      un nombre. Les villes d'un même pays s'énumèrent par virgules, le
      pays vient à la fin, et rien ne se compte. */
  const trois = ligneDIdentite(
    suivi("c", "artiste", "", [
      mode("salon", "Paris", null, "France", "FR"),
      mode("salon", "Lyon", null, "France", "FR"),
      mode("salon", "Nantes", null, "France", "FR"),
    ])
  );
  verif(
    "§3-c — LES TROIS VILLES S'ÉCRIVENT, le pays une seule fois à la fin",
    trois === "Artiste : Lyon · Nantes · Paris, France" && !/\+\d/.test(trois),
    `« ${trois} »`
  );
  verif(
    "…et DEUX villes s'écrivent toutes les deux, sans aucun nombre",
    ligneDIdentite(
      suivi("c2", "artiste", "", [
        mode("salon", "Paris", null, "France", "FR"),
        mode("salon", "Lyon", null, "France", "FR"),
      ])
    ) === "Artiste : Lyon · Paris, France",
    "« Lyon · Paris, France », rangé, derrière les deux points"
  );
  /*  §1 (nº 586) — ET DEUX PAYS SE SÉPARENT PAR UNE BARRE VERTICALE,
      jamais par le point médian : celui-ci ne sépare plus que le métier
      de la localisation. */
  verif(
    "§1 (nº 586) — DEUX PAYS : une BARRE VERTICALE entre les groupes",
    ligneDIdentite(
      suivi("c3", "artiste", "", [
        mode("salon", "Paris", null, "France", "FR"),
        mode("salon", "Berlin", null, "Allemagne", "DE"),
      ])
    ) === "Artiste : Berlin, Allemagne | Paris, France",
    "« Berlin, Allemagne | Paris, France » — l'Allemagne se range avant"
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
  /*  ⚠️ CE TEST A CHANGÉ DE SENS À LA nº 591, et c'est le propriétaire
      qui l'a renversé : la ligne était rangée dans l'ordre DÉCLARÉ par
      l'artiste, elle l'est désormais par ORDRE ALPHABÉTIQUE. Ce qu'il
      faut éprouver n'est donc plus « la première déclarée se lit en
      tête » mais l'inverse : QUE LA DÉCLARATION N'Y FAIT PLUS RIEN.
      LA PREUVE TIENT À DEUX CHOSES À LA FOIS. On déclare « Nantes »
      en premier et sous un genre (salon) que `modesOrdonnes` classerait
      APRÈS le domicile de « Lyon » : ni l'ordre de déclaration ni le
      genre ne peuvent donc expliquer le résultat. Seul l'alphabet
      met « Lyon » devant. */
  const declare = suivi("e", "artiste", "", [
    mode("salon", "Nantes", null, "France", "FR"),
    mode("domicile", "Lyon", null, "France", "FR"),
  ]);
  verif(
    "§3-e (nº 591) — L'ORDRE EST ALPHABÉTIQUE : ni la déclaration ni le genre ne le décident",
    ligneDIdentite(declare) === "Artiste : Lyon · Nantes, France",
    `« ${ligneDIdentite(declare)} » (la déclaration disait « Nantes » en premier)`
  );
  /*  §1 (nº 591) — ET L'ALPHABET EST CELUI DU FRANÇAIS : un accent ne
      renvoie pas une ville en fin de liste, une minuscule non plus.
      Comparées par leurs numéros de caractères, « Évry » tomberait
      après « Zurich » et « avignon » après les deux. */
  verif(
    "…et il range comme un dictionnaire français : accents et casse à leur place",
    ligneDIdentite(
      suivi("e2", "artiste", "", [
        mode("salon", "Zurich", null, "France", "FR"),
        mode("salon", "Évry", null, "France", "FR"),
        mode("salon", "avignon", null, "France", "FR"),
      ])
    ) === "Artiste : avignon · Évry · Zurich, France",
    "« avignon · Évry · Zurich »"
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
    rendu === "Artiste : Paris, France" && !/\d|Rue|Chemin/.test(rendu),
    `« ${rendu} »`
  );
  verif(
    "…et le repli sur l'INTITULÉ du mode a été retiré : un intitulé n'est pas une ville",
    !/mode\.intitule/.test(sansNotes(lire("src/lib/selection-suivis.ts"))),
    "plus aucun repli sur `intitule`"
  );

  //  UNE SESSION GUEST TERMINÉE N'AJOUTE AUCUN LIEU.
  const guestFini = suivi("g", "artiste", "", [
    mode("salon", "Paris", null, "France", "FR"),
    mode("guest", "Berlin", null, "Allemagne", "DE", {
      debut_le: "2026-01-01",
      fin_le: "2026-01-10",
    }),
  ]);
  verif(
    "UNE SESSION GUEST TERMINÉE NE COMPTE PAS — la règle du §2 de la nº 243 tient",
    ligneDIdentite(guestFini, "2026-08-16") === "Artiste : Paris, France",
    `« ${ligneDIdentite(guestFini, "2026-08-16")} » (Berlin n'y est pas)`
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
    ) === "Artiste : Berlin, Allemagne | Paris, France",
    "Berlin s'écrit, derrière la barre verticale"
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
  /*  ⚠️ AMENDÉ PAR LA nº 325-§1 — CE §2 A ÉTÉ ANNULÉ.
      ------------------------------------------------------------------
      CE BANC EXIGEAIT ICI 36 px entre le bloc d'identité d'un artiste
      et sa galerie : c'est ce que le §2 de la nº 323 avait posé. LE
      PROPRIÉTAIRE A FAIT ANNULER CE CHANGEMENT à la nº 325 — la
      consigne de la nº 323 avait été mal comprise, l'air manquait
      SOUS LE BLOC DE TÊTE de la page, pas là. La valeur est donc
      revenue à 20 px, sa valeur de toujours (nº 254 pour le web,
      nº 264-§4 pour le doigt).
      LE SUJET A ÉTÉ RETIRÉ PAR DÉCISION : la mesure n'est ni ratée ni
      supprimée, elle est REFAITE À L'ENVERS ci-dessous, et reprise en
      entier dans `verif-p325.mjs` §1 — qui mesure les 20 px aux deux
      largeurs et vérifie que `lg:mt-9` a quitté le code.
      ⚠️ CE QUE LA nº 323 GARDE, et qui n'est pas en cause : son §1
      (le nom à 20 px, le sous-titre à 16) et son §3 (la grammaire du
      sous-titre). Seul cet écart-ci est revenu en arrière. */
  verif(
    "§2 WEB — LA MARGE EST REVENUE À 20 px (nº 325-§1 : le §2 de cette " +
      "passe est annulé par le propriétaire, mesuré en entier dans p325)",
    margeWeb.margeHaut === "20px",
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
