/**
 * LE CONTENU DU SITE VITRINE — TOUS LES TEXTES, AU MÊME ENDROIT
 * =============================================================
 * ⚠️ TOUT CE QUI SUIT EST PROVISOIRE, sauf mention contraire.
 * Chaque texte de remplacement est marqué « PROVISOIRE » dans son
 * commentaire : remplacer la chaîne, et c'est fait — aucune autre
 * modification n'est nécessaire ailleurs.
 *
 * AUCUN TEXTE N'EST REPRIS D'UN SITE EXISTANT : tout a été écrit pour
 * ce fichier, et n'a d'autre ambition que de tenir la mise en page en
 * attendant les vrais contenus.
 *
 * Les COULEURS ne sont pas ici : elles restent celles de la charte
 * (src/config/roswel.ts). Le rose du logo, `COULEURS.primaire`
 * (#EE3D6F), est la couleur d'accent de tout le site.
 */

/**
 * Les adresses du site vitrine. L'ACCUEIL EST « / » : le site
 * d'agence est la porte d'entrée du domaine.
 * Les pages juridiques restent sous « /agence/… » : les adresses
 * « /confidentialite », « /mentions-legales » et « /contact » sont
 * déjà prises par le produit artisans, qui n'a pas bougé.
 */
export const CHEMINS_AGENCE = {
  accueil: "/agence",
  rendezVous: "/rendez-vous",
  confidentialite: "/agence/confidentialite",
  mentionsLegales: "/agence/mentions-legales",
  contact: "/agence/contact",
};

/** Les trois ancres du menu, dans l'ordre d'apparition sur la page. */
export const ANCRES_MENU = [
  { id: "services", label: "Services" },
  { id: "equipe", label: "Équipe" },
  { id: "faq", label: "FAQ" },
];

/** Le libellé du bouton d'action, répété partout. */
export const LIBELLE_RENDEZ_VOUS = "Prendre rendez-vous";

/* ------------------------------------------------------------------
 * 1. HÉROS
 * ------------------------------------------------------------------ */

export const HEROS = {
  /** DÉFINITIF (fourni). */
  titre: "Prenez de l'avance avec des solutions IA sur mesure.",
  /** PROVISOIRE — une phrase sur la transformation par l'IA. */
  sousTitre:
    "Nous aidons les entreprises à transformer leurs façons de travailler : " +
    "comprendre où l'intelligence artificielle apporte vraiment quelque chose, " +
    "l'installer là où elle compte, et former les équipes à s'en servir.",
};

/* ------------------------------------------------------------------
 * 2. SERVICES
 * ------------------------------------------------------------------ */

export const SERVICES = {
  /** DÉFINITIF (fourni). */
  titre: "Intelligence artificielle, expertise humaine.",
  /** PROVISOIRE — paragraphe d'introduction. */
  introduction:
    "L'IA n'est pas une fin en soi. Ce qui compte, c'est le temps qu'elle " +
    "rend à vos équipes et les décisions qu'elle rend plus sûres. Nous " +
    "partons donc toujours de votre métier, jamais de l'outil.",

  /**
   * Les trois blocs, dans l'ordre.
   *
   * ⚠️ LES IMAGES À DÉPOSER
   * `image` est le nom du fichier, SANS extension. Le site cherche
   * tout seul, dans cet ordre : .png, .jpg, .jpeg, .webp — déposer
   * l'un ou l'autre suffit, il n'y a rien à changer ici.
   * Le dossier : public/images/agence/
   * Tant que le fichier n'est pas là, le bloc affiche un cadre
   * d'attente qui rappelle le nom exact à déposer.
   */
  blocs: [
    {
      id: "audit",
      etiquette: "Audit IA",
      /** DÉFINITIF (fourni). */
      titre: "Analysez, optimisez, progressez.",
      /** PROVISOIRE. */
      texte:
        "Nous passons vos processus au crible pour repérer ce qui vous coûte " +
        "du temps sans rien vous apporter. Vous repartez avec une carte claire : " +
        "ce qui mérite d'être automatisé, ce qui doit rester humain, et dans " +
        "quel ordre avancer.",
      image: "audit-ia-schema",
      /** Texte de remplacement de l'image (lecteurs d'écran). */
      imageAlt: "Schéma de la démarche d'audit IA",
    },
    {
      id: "solutions",
      etiquette: "Solutions IA",
      /** DÉFINITIF (fourni). */
      titre: "Des solutions conçues pour vous.",
      /** PROVISOIRE. */
      texte:
        "Pas d'outil générique plaqué sur votre organisation : nous construisons " +
        "ce qui manque, en partant de vos données et de vos habitudes de travail. " +
        "Vous restez propriétaire de tout, du premier jour au dernier.",
      image: "solutions-ia",
      imageAlt: "Illustration des solutions IA sur mesure",
    },
    {
      id: "formations",
      etiquette: "Formations",
      /** DÉFINITIF (fourni). */
      titre: "Des formations taillées pour vos équipes.",
      /** PROVISOIRE. */
      texte:
        "Une technologie que personne n'utilise ne sert à rien. Nous formons vos " +
        "équipes sur leurs propres cas, avec leurs propres dossiers, jusqu'à ce " +
        "que l'outil devienne un réflexe plutôt qu'une contrainte.",
      image: "formations-ia",
      imageAlt: "Illustration des formations aux outils IA",
    },
  ],
  /** PROVISOIRE — le bouton discret de chaque bloc. */
  lienBloc: "En savoir plus",
};

/* ------------------------------------------------------------------
 * 3. AVANTAGES
 * ------------------------------------------------------------------ */

export const AVANTAGES = {
  /** DÉFINITIF (fourni). */
  titre: "Pourquoi choisir Roswel ?",
  /** PROVISOIRES, les trois. */
  cartes: [
    {
      id: "expertise",
      titre: "Expertise",
      texte:
        "Des gens qui ont mis les mains dans le cambouis, pas seulement lu la " +
        "documentation. Nous vous disons aussi quand l'IA n'est pas la réponse.",
    },
    {
      id: "simplicite",
      titre: "Simplicité",
      texte:
        "Un interlocuteur, un langage clair, des livrables qui se comprennent " +
        "sans traducteur. Vous savez toujours où en est le projet.",
    },
    {
      id: "flexibilite",
      titre: "Flexibilité",
      texte:
        "On commence petit, on mesure, on élargit. Pas de contrat qui vous " +
        "enferme pour trois ans avant d'avoir vu le premier résultat.",
    },
  ],
};

/* ------------------------------------------------------------------
 * 4. ÉQUIPE
 * ------------------------------------------------------------------ */

export const EQUIPE = {
  /** DÉFINITIF (fourni). */
  titre: "Une équipe d'experts.",
  /** PROVISOIRE. */
  introduction:
    "Une équipe volontairement resserrée : vous parlez à ceux qui font.",
  /**
   * PROVISOIRE. AJOUTER UN MEMBRE = ajouter une entrée ici, rien
   * d'autre : la grille s'adapte toute seule (1, 2, 3 colonnes…).
   * `portrait` : chemin d'une photo, ou null → emplacement réservé
   * avec les initiales, en attendant.
   */
  membres: [
    {
      id: "kevin-roux",
      nom: "Kevin Roux",
      /** DÉFINITIF (fourni). */
      role: "Consultant spécialisé en transition IA.",
      /** PROVISOIRE. */
      bio: "Accompagne les dirigeants de la première question au premier résultat.",
      /**
       * Nom de fichier du portrait, SANS extension, à déposer dans
       * public/images/agence/ — ou null pour garder l'emplacement
       * réservé avec les initiales.
       */
      portrait: null as string | null,
    },
    {
      id: "lea-marchand",
      /** PROVISOIRE — nom inventé, à remplacer. */
      nom: "Léa Marchand",
      /** DÉFINITIF (fourni). */
      role: "Ingénieur en automatisations IA.",
      /** PROVISOIRE. */
      bio: "Construit les automatisations et les branche sur vos outils existants.",
      portrait: null as string | null,
    },
  ],
};

/* ------------------------------------------------------------------
 * 5. APPEL FINAL
 * ------------------------------------------------------------------ */

export const APPEL_FINAL = {
  /** PROVISOIRE — la petite accroche au-dessus du titre. */
  accroche: "Premier échange",
  /** DÉFINITIF (fourni). */
  titre: "Atteignez votre plein potentiel.",
  /** PROVISOIRE. */
  texte:
    "Un échange de trente minutes suffit à savoir si nous pouvons vous être utiles.",
  /** PROVISOIRE — la ligne de réassurance, sous le bouton. */
  reassurance: "Sans engagement · Réponse sous deux jours ouvrés",
};

/* ------------------------------------------------------------------
 * 6. FAQ
 * ------------------------------------------------------------------ */

/** Les huit questions sont DÉFINITIVES ; les réponses, PROVISOIRES. */
export const FAQ = {
  titre: "Questions fréquentes",
  /** PROVISOIRE. */
  introduction: "Ce qu'on nous demande le plus souvent, avant de commencer.",
  questions: [
    {
      id: "quest-ce-que-lia",
      question: "Qu'est-ce que l'IA ?",
      reponse:
        "Un ensemble de techniques qui permettent à un logiciel d'apprendre à " +
        "partir d'exemples plutôt que d'être programmé règle par règle. En " +
        "pratique : lire, écrire, classer, résumer, prédire.",
    },
    {
      id: "comment-fonctionne-un-audit",
      question: "Comment fonctionne un audit ?",
      reponse:
        "Nous observons vos processus tels qu'ils sont vécus, pas tels qu'ils " +
        "sont documentés. Entretiens, mesures, puis un rapport court : ce qui " +
        "peut être automatisé, ce que ça rapporte, et par quoi commencer.",
    },
    {
      id: "benefices-de-lia",
      question: "Quels sont les bénéfices d'intégrer l'IA dans notre entreprise ?",
      reponse:
        "Du temps rendu sur les tâches répétitives, moins d'erreurs de saisie, " +
        "et des décisions appuyées sur des données plutôt que sur des " +
        "impressions. Les gains se chiffrent : nous les mesurons avant et après.",
    },
    {
      id: "formations",
      question: "Offrez-vous des formations ?",
      reponse:
        "Oui, et elles portent sur vos propres dossiers. Une formation qui " +
        "n'utilise que des exemples inventés ne survit pas au retour au bureau.",
    },
    {
      id: "exemples-concrets",
      question: "Avez-vous des exemples concrets d'intégrations IA réussies ?",
      reponse:
        "Oui. Cette section attend les cas clients définitifs : ils seront " +
        "publiés avec l'accord écrit des entreprises concernées, chiffres à " +
        "l'appui.",
    },
    {
      id: "revoir-les-process",
      question: "Faut-il revoir tous les process de l'entreprise pour intégrer l'IA ?",
      reponse:
        "Non. On commence par un processus, un seul, celui qui coûte le plus " +
        "cher. S'il tient ses promesses, on élargit. Sinon, on a perdu quelques " +
        "semaines, pas une année.",
    },
    {
      id: "secteur",
      question: "L'IA générative est-elle adaptée à mon secteur ?",
      reponse:
        "Souvent oui, mais pas partout ni pour tout. C'est précisément ce que " +
        "l'audit tranche — et nous vous le dirons si la réponse est non.",
    },
    {
      id: "donnees",
      question: "Qu'en est-il de mes données ?",
      reponse:
        "Elles restent les vôtres. Nous privilégions les traitements en Europe, " +
        "nous n'entraînons aucun modèle sur vos données sans accord écrit, et " +
        "tout est encadré par le RGPD.",
    },
  ],
};

/* ------------------------------------------------------------------
 * 7. PIED DE PAGE
 * ------------------------------------------------------------------ */

export const PIED_AGENCE = {
  /** PROVISOIRE. */
  accroche: "Agence d'automatisation par l'intelligence artificielle.",
  liens: [
    { href: CHEMINS_AGENCE.confidentialite, label: "Politique de confidentialité" },
    { href: CHEMINS_AGENCE.mentionsLegales, label: "Mentions légales" },
    { href: CHEMINS_AGENCE.contact, label: "Contact" },
  ],
};

/* ------------------------------------------------------------------
 * LA PAGE DE RENDEZ-VOUS
 * ------------------------------------------------------------------ */

export const RENDEZ_VOUS = {
  /** PROVISOIRES, tous. */
  titre: "Parlons de votre projet.",
  accroche:
    "Décrivez-nous votre besoin en quelques lignes. Nous revenons vers vous " +
    "sous deux jours ouvrés, avec une proposition de créneau.",
  confirmationTitre: "Merci, votre demande est bien arrivée.",
  confirmationTexte:
    "Nous vous répondons sous deux jours ouvrés à l'adresse indiquée.",

  /** Les tailles d'entreprise proposées dans le menu. */
  taillesEntreprise: [
    { valeur: "1", label: "Indépendant" },
    { valeur: "2-10", label: "2 à 10 personnes" },
    { valeur: "11-50", label: "11 à 50 personnes" },
    { valeur: "51-200", label: "51 à 200 personnes" },
    { valeur: "200+", label: "Plus de 200 personnes" },
  ],

  /** Longueurs acceptées pour « décrivez votre besoin ». */
  besoinMin: 20,
  besoinMax: 2000,
};
