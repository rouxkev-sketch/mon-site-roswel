/**
 * ============================================================
 *  ROSWEL — FICHIER DE RÉGLAGES CENTRAL
 * ============================================================
 *
 *  C'est LE fichier à modifier pour ajuster le site :
 *   1. Les couleurs
 *   2. La grille de score Instagram (40 points)
 *   3. La grille de score des avis Google (40 points)
 *   4. La grille de score d'ancienneté (20 points, via Sirene)
 *   5. Les seuils des pastilles (Recommandé / Très recommandé)
 *   6. L'alerte de fraîcheur des données Instagram (30 jours)
 *   7. Le classement des résultats (100 % score de confiance)
 *   8. Les métiers proposés au lancement
 *   9. Les rayons d'intervention possibles
 *  10. La zone de lancement (bandeau d'information)
 *  11. Les régions importées dans la base des communes
 *  12. Les limites des formulaires (bio, message, photos)
 *
 *  Aucune de ces valeurs n'est écrite ailleurs dans le code :
 *  tout le site vient lire ses réglages ici.
 * ============================================================
 */

/* ------------------------------------------------------------
 * 1. IDENTITÉ ET MARQUE
 * ------------------------------------------------------------ */
export const MARQUE = {
  nom: "Roswel",
  // Le nom en minuscules, tel qu'il apparaît dans le logo.
  nomLogo: "roswel",
  slogan: "Le moteur de recherche d'artisans de confiance",
  description:
    "Roswel vous aide à trouver un artisan de confiance près de chez vous, " +
    "choisi selon sa réputation réelle : avis Google et influence Instagram.",
  /**
   * L'ADRESSE PUBLIQUE DU SITE EN LIGNE — un seul endroit à modifier.
   *
   * Elle sert de REPLI DE SÉCURITÉ pour le référencement : si la
   * variable d'environnement NEXT_PUBLIC_SITE_URL venait à manquer sur
   * l'hébergement, les adresses du référencement (liens canoniques,
   * plan du site, données structurées, aperçus de partage) utiliseraient
   * cette valeur — JAMAIS « localhost », qui casserait l'indexation en
   * silence. À corriger ici le jour où le domaine change.
   */
  siteEnLigne: "https://roswel.fr",
};

/* ------------------------------------------------------------
 * 2. COULEURS
 * ------------------------------------------------------------
 * Le rose est utilisé UNIQUEMENT en accent (boutons, liens,
 * favori). Le fond du site reste clair / blanc.
 * Changer une valeur ici change la couleur sur tout le site.
 * ------------------------------------------------------------ */
export const COULEURS = {
  // — Couleur principale (rose de la marque) —
  primaire: "#EE3D6F",        // boutons, liens, icône favori
  //  §2 (nº 287) — LE FOND D'UN BADGE SÉLECTIONNÉ : un rose sombre qui
  //  FAIT FOND, pour que le mot rose (#EE3D6F) se détache franchement
  //  dessus. Il remplace les voiles `bg-primaire/15` — quinze pour cent
  //  de rose posés sur des fonds différents donnaient un rose différent
  //  à chaque endroit ; un seul cas d'usage, un seul jeu de valeurs.
  primaireVoile: "#381E29",
  primaireFonce: "#D42A5C",   // survol / appui des boutons roses
  primaireClair: "#FFEBF1",   // fonds très légers teintés de rose

  // — Dégradé du logo (haut → bas) —
  degradeDebut: "#FB7BA2",
  degradeFin: "#EC3A6E",

  // — Fonds et textes —
  fond: "#FFFFFF",            // fond principal du site
  fondDoux: "#F8F7F8",        // fond des zones secondaires (cartes, sections)
  // Fond de page sur TABLETTE et ORDINATEUR (≥ 768 px) : gris très
  // clair façon Notion / Linear / Vercel. Les cartes de résultats et
  // la fiche (blanc pur) « flottent » dessus. Sur smartphone
  // (< 768 px), le fond reste blanc pur (voir globals.css).
  fondPage: "#F6F6F7",
  encre: "#101B33",           // texte principal (bleu nuit du logo)
  // Texte secondaire (labels de filtres, explications, ligne SIREN des
  // cartes, blocs d'infos de la fiche…). Gris de typographie du site,
  // ASSOMBRI (contraste ≈ 9:1 sur fond blanc, conforme WCAG AA) pour une
  // meilleure lisibilité tout en restant nettement plus léger que l'encre.
  encreDouce: "#474747",
  bordure: "#D5D2DA",         // traits et contours discrets (gris légèrement foncé, plus lisible)
  // Contour des CHAMPS de recherche et des pilules de filtres (métier,
  // ville, Urgence/La nuit/Le week-end) : nettement plus foncé et
  // visible que `bordure` — même valeur sur l'accueil et les résultats.
  bordureChamp: "#BEBFC9",
  flecheMenus: "#9AA1AC",     // flèches des menus déroulants du moteur de recherche

  // — Pastilles (badges) —
  pastilleExcellence: "#EE3D6F", // badge « Très recommandé » (rose de la marque)
  pastilleRecommande: "#1D9BF0", // badge « Recommandé » (bleu du sceau vérifié)
  bordureCarte: "#C9CCD4",       // contour des boutons Whatsapp / cœur (gris fin, visible sur blanc)
  // Contour des CARTES, de la FICHE, des modules et de l'encadré de
  // recherche : gris TRÈS clair, À PEINE MARQUÉ (façon Notion / Linear) —
  // volontairement discret pour que ce soit l'ombre douce, et non un trait
  // franc, qui délimite les encadrés. Atténué (surtout visible en haut).
  bordureCarteClaire: "#EDEEF1",
  // (badges de disponibilité : texte vert = succes, orange = alerte,
  //  rouge = erreur — voir « Couleurs d'état » ci-dessous)

  // — Fond de la carte SÉLECTIONNÉE (mode double colonnes) —
  // teinte très claire assortie au badge de niveau de l'artisan
  selectionTresRecommande: "#FFEBF1", // rose clair (Très recommandé)
  selectionRecommande: "#E8F4FD",     // bleu clair (Recommandé)
  selectionSansBadge: "#F1F2F4",      // gris clair (sans badge)

  // — Couleurs d'état —
  succes: "#3F8443",          // confirmations (vert) + badge « Joignable » (texte + puce)
  alerte: "#F59E0B",          // avertissements, ex. données Instagram trop vieilles
  erreur: "#D32E28",          // erreurs (rouge) + badge « Indisponible / De retour le… » (texte + puce)
  reprise: "#E06A00",         // badge « Joignable à… » (orange renforcé, lisible)

  // — Icônes des canaux de contact (boutons de la fiche) —
  // Seules les ICÔNES sont colorées (reconnaissance immédiate) ; le
  // contour et le texte des boutons restent gris.
  contactTelephone: "#007AFF", // bleu iOS (icône « Appeler »)
  contactWhatsApp: "#25D366",  // vert WhatsApp (icône « Whatsapp »)
};

/* ------------------------------------------------------------
 * 3. SCORE INSTAGRAM — sur 25 points
 * ------------------------------------------------------------
 * Le score croise le nombre d'abonnés (lignes) avec le nombre
 * de publications (colonnes). Ce croisement protège contre les
 * abonnés achetés : beaucoup d'abonnés + peu de publications
 * = score bridé.
 *
 * Comment lire la grille :
 *  - "paliersPublications" définit les 3 colonnes :
 *      colonne 0 : moins de 30 publications
 *      colonne 1 : de 30 à 149 publications
 *      colonne 2 : 150 publications et plus
 *  - Chaque ligne donne les points selon le nombre d'abonnés
 *    ("abonnesMin" = à partir de combien d'abonnés la ligne
 *    s'applique).
 * ------------------------------------------------------------ */
export const SCORE_INSTAGRAM = {
  maximum: 25,

  // Seuils des colonnes (nombre de publications minimum)
  paliersPublications: [0, 30, 150],

  // Points : [moins de 30 publis, 30 à 149 publis, 150 publis et +]
  // (grille ×0,625 par rapport à l'ancienne — Instagram passe de 40 à 25)
  grille: [
    { abonnesMin: 10000, points: [11, 19, 25] }, // 10 000 abonnés et plus
    { abonnesMin: 2000,  points: [8, 14, 19] },  // 2 000 à 9 999 abonnés
    { abonnesMin: 500,   points: [5, 9, 12] },   // 500 à 1 999 abonnés
    { abonnesMin: 0,     points: [3, 5, 7] },    // 0 à 499 abonnés
  ],
};

/* ------------------------------------------------------------
 * 4. SCORE AVIS GOOGLE — sur 45 points
 * ------------------------------------------------------------
 * Le score croise la note Google (lignes) avec le nombre
 * d'avis (colonnes). Une excellente note avec très peu d'avis
 * rapporte peu : il faut du volume pour prouver la confiance.
 *
 * Comment lire la grille :
 *  - "paliersNbAvis" définit les 5 colonnes :
 *      colonne 0 : 1 à 4 avis
 *      colonne 1 : 5 à 19 avis
 *      colonne 2 : 20 à 49 avis
 *      colonne 3 : 50 à 99 avis
 *      colonne 4 : 100 avis et plus
 *    (0 avis = 0 point, automatiquement)
 *  - Chaque ligne donne les points selon la note
 *    ("noteMin" = à partir de quelle note la ligne s'applique).
 * ------------------------------------------------------------ */
export const SCORE_GOOGLE = {
  maximum: 45,

  // Seuils des colonnes (nombre d'avis minimum)
  paliersNbAvis: [1, 5, 20, 50, 100],

  // Points : [1-4 avis, 5-19 avis, 20-49 avis, 50-99 avis, 100+ avis]
  // (grille ×1,125 par rapport à l'ancienne — Google passe de 40 à 45)
  grille: [
    { noteMin: 5.0, points: [9, 18, 27, 36, 45] },  // note parfaite 5,0
    { noteMin: 4.7, points: [7, 16, 24, 32, 41] },  // 4,7 à 4,9
    { noteMin: 4.4, points: [6, 11, 18, 25, 33] },  // 4,4 à 4,6
    { noteMin: 4.0, points: [3, 8, 12, 17, 21] },   // 4,0 à 4,3
    { noteMin: 3.0, points: [2, 5, 7, 10, 12] },    // 3,0 à 3,9
    { noteMin: 0,   points: [0, 0, 0, 0, 0] },      // moins de 3,0 : aucun point
  ],
};

/* ------------------------------------------------------------
 * 4 bis. SCORE ANCIENNETÉ — sur 30 points
 * ------------------------------------------------------------
 * Calculé AUTOMATIQUEMENT depuis la date de création de
 * l'entreprise renvoyée par l'annuaire officiel (API Sirene) à la
 * vérification du SIREN — jamais saisi à la main. Sans date
 * vérifiée : 0 point.
 * "ansMin" = à partir de combien d'années d'existence la ligne
 * s'applique (la première ligne atteinte donne les points).
 * ------------------------------------------------------------ */
export const SCORE_ANCIENNETE = {
  maximum: 30,
  // (grille ×1,5 par rapport à l'ancienne — l'ancienneté passe de 20 à 30)
  paliers: [
    { ansMin: 20, points: 30 }, // 20 ans et plus
    { ansMin: 15, points: 27 }, // 15 à 19 ans
    { ansMin: 10, points: 24 }, // 10 à 14 ans
    { ansMin: 6,  points: 20 }, // 6 à 9 ans
    { ansMin: 3,  points: 14 }, // 3 à 5 ans
    { ansMin: 1,  points: 8 },  // 1 à 2 ans
    { ansMin: 0,  points: 3 },  // moins d'un an
  ],
};

/* ------------------------------------------------------------
 * 5. PASTILLES (badges de niveau)
 * ------------------------------------------------------------
 * Le badge de NIVEAU s'affiche en onglet sous la carte (la
 * bordure de la carte prend sa couleur) :
 *  - « Très recommandé » (rose) à partir de 75 points ;
 *  - « Recommandé » (bleu) de 40 à 74 points ;
 *  - en dessous de 40 : aucun badge de niveau (jamais de badge
 *    dévalorisant) — carte à bordure grise, sans onglet.
 * À côté, le badge « SIREN vérifié · X ans d'ancienneté » vient de
 * la date de création renvoyée par l'annuaire officiel (Sirene) à
 * la vérification du SIREN : recalculé automatiquement, jamais
 * saisi à la main.
 * ------------------------------------------------------------ */
export const PASTILLES = {
  top: {
    seuil: 75,                    // score minimum pour « Très recommandé »
    label: "Très recommandé",
    couleur: COULEURS.pastilleExcellence,
  },
  recommande: {
    seuil: 40,                    // score minimum pour « Recommandé »
    label: "Recommandé",
    couleur: COULEURS.pastilleRecommande,
  },
};

/* ------------------------------------------------------------
 * 6. FRAÎCHEUR DES DONNÉES INSTAGRAM
 * ------------------------------------------------------------
 * Les abonnés / publications Instagram sont saisis à la main
 * par l'admin. Au-delà de ce nombre de jours sans mise à jour,
 * une alerte s'affiche dans l'interface admin.
 * ------------------------------------------------------------ */
export const FRAICHEUR_INSTAGRAM_JOURS = 30;

/* ------------------------------------------------------------
 * 7 bis. CLASSEMENT DES RÉSULTATS DE RECHERCHE
 * ------------------------------------------------------------
 * Le classement repose à 100 % sur le SCORE DE CONFIANCE (du
 * plus haut au plus bas) : sans messagerie interne, il n'y a
 * plus de rapidité de réponse à mesurer.
 * ------------------------------------------------------------ */
export const CLASSEMENT = {
  resultatsParPage: 10,    // cartes affichées avant « Afficher plus d'artisans »
};

/* ------------------------------------------------------------
 * 8. MÉTIERS PROPOSÉS AU LANCEMENT
 * ------------------------------------------------------------
 * Un artisan peut cumuler plusieurs métiers (chauffagiste et
 * plombier sont bien deux métiers séparés).
 * "slug" = version du nom utilisée dans les adresses web
 * (ex. /plombier/lyon), sans accents ni majuscules.
 * ------------------------------------------------------------ */
export const METIERS = [
  { slug: "plombier", label: "Plombier", icone: "🔧" },
  { slug: "chauffagiste", label: "Chauffagiste", icone: "🔥" },
  { slug: "electricien", label: "Électricien", icone: "⚡" },
  { slug: "serrurier", label: "Serrurier", icone: "🔑" },
  { slug: "vitrier", label: "Vitrier", icone: "🪟" },
  { slug: "peintre", label: "Peintre", icone: "🎨" },
  { slug: "menuisier", label: "Menuisier", icone: "🪚" },
  { slug: "macon", label: "Maçon", icone: "🧱" },
];

/**
 * LES DOUBLES COMPÉTENCES (liste FERMÉE, définie ici uniquement)
 * --------------------------------------------------------------
 * Une double compétence est une ENTRÉE À PART ENTIÈRE du menu des
 * métiers : l'artisan la choisit à la place d'un métier simple (jamais
 * les deux), et elle s'affiche telle quelle sur sa carte et sa fiche.
 * En base, elle est enregistrée comme les DEUX métiers qui la
 * composent : une recherche « Plombier » trouve donc les
 * « Plombier & Chauffagiste », et une recherche « Chauffagiste »
 * aussi. Pour en ajouter une, il suffit d'ajouter une ligne ici.
 */
export const DOUBLES_COMPETENCES = [
  {
    slug: "plombier-chauffagiste",
    label: "Plombier & Chauffagiste",
    metiers: ["plombier", "chauffagiste"],
    icone: "🔧",
  },
];

/** Les deux sections du menu des métiers (en-têtes non cliquables) */
export const GROUPES_METIER = {
  double: "Double compétence",
  unique: "Métier unique",
} as const;

/**
 * LA LISTE COMPLÈTE DES ENTRÉES PROPOSÉES (menu de recherche ET choix
 * de l'artisan) : les doubles compétences D'ABORD (bien visibles),
 * puis les métiers uniques. UN SEUL endroit à modifier — tous les
 * menus, la recherche et les formulaires lisent cette liste.
 */
export const OFFRES_METIER = [
  ...DOUBLES_COMPETENCES.map(({ slug, label, metiers, icone }) => ({
    slug,
    label,
    metiers,
    icone,
    groupe: GROUPES_METIER.double,
  })),
  ...METIERS.map(({ slug, label, icone }) => ({
    slug,
    label,
    metiers: [slug],
    icone,
    groupe: GROUPES_METIER.unique,
  })),
];

/* ------------------------------------------------------------
 * 9. ZONE GÉOGRAPHIQUE
 * ------------------------------------------------------------ */
export const GEO = {
  // Rayons d'intervention proposés à l'artisan (en kilomètres)
  rayonsInterventionKm: [10, 25, 50, 100],

  // Bandeau informatif affiché aux visiteurs (côté client
  // uniquement : ce n'est PAS une barrière technique, les
  // artisans peuvent s'inscrire partout en France).
  // → Passer à false pour retirer le bandeau de tout le site.
  afficherBandeauZone: true,
  bandeauZoneLancement: "Actuellement disponible sur Lyon et ses alentours",

  // Régions importées dans la base des communes via geo.api.gouv.fr.
  // Liste de codes région INSEE, ex. ["84"] = Auvergne-Rhône-Alpes.
  // Laisser le tableau VIDE [] pour importer TOUTE la France.
  regionsImportCommunes: [] as string[],
};

/* ------------------------------------------------------------
 * 10. LIMITES DES FORMULAIRES
 * ------------------------------------------------------------ */
export const LIMITES = {
  /** Présentation de l'artisan : OBLIGATOIRE, et pas en deux mots — une
      fiche qui ne dit rien ne remonte pas sur Google et ne convainc
      personne. En dessous du minimum, l'enregistrement est refusé. */
  bioMinCaracteres: 200,
  bioMaxCaracteres: 1000,
  /** En dessous de ce seuil, un message d'ENCOURAGEMENT s'affiche — il
      n'empêche jamais d'enregistrer, il explique juste l'intérêt d'en
      dire un peu plus. */
  bioSeuilConseil: 400,
};

/**
 * EXEMPLES DE PRÉSENTATION, PAR MÉTIER
 * ------------------------------------
 * Le texte gris affiché dans le champ vide du formulaire (placeholder).
 * Il change avec le métier choisi : un plombier ne se présente pas
 * comme un peintre. Le but est de MONTRER la forme attendue — un
 * paragraphe, puis une liste à tirets — plutôt que de la décrire.
 * Clé = slug du métier ; `defaut` sert tant qu'aucun métier n'est
 * choisi, ou pour un métier qui n'aurait pas son propre exemple.
 */
export const EXEMPLES_PRESENTATION: Record<string, string> = {
  defaut: `Artisan à [votre ville] depuis [X] ans, j'interviens sur [votre secteur]. Devis gratuit.

- Première prestation
- Deuxième prestation
- Troisième prestation`,
  plombier: `Plombier à Écully depuis 12 ans, j'interviens en dépannage rapide sur tout l'ouest lyonnais. Devis gratuit sous 24 h.

- Recherche et réparation de fuite
- Débouchage de canalisation
- Remplacement de chauffe-eau
- Rénovation complète de salle de bains`,
  chauffagiste: `Chauffagiste à Villeurbanne depuis 15 ans, j'entretiens et remplace tous types de chaudières sur l'agglomération lyonnaise.

- Entretien annuel de chaudière gaz
- Dépannage et remise en service
- Installation de pompe à chaleur
- Pose de radiateurs et plancher chauffant`,
  electricien: `Électricien à Lyon depuis 10 ans, je réalise vos installations et vos mises aux normes, du simple tableau à la rénovation complète.

- Mise aux normes de tableau électrique
- Recherche de panne
- Installation de prises et éclairages
- Borne de recharge pour voiture électrique`,
  serrurier: `Serrurier à Bron depuis 8 ans, j'interviens en urgence 7 j/7 sur l'est lyonnais. Ouverture sans dégât dans la majorité des cas.

- Ouverture de porte claquée ou verrouillée
- Changement de cylindre et de serrure
- Pose de porte blindée
- Sécurisation après effraction`,
  vitrier: `Vitrier à Caluire depuis 9 ans, je remplace vos vitrages cassés et pose du double vitrage sur toute la métropole.

- Remplacement de vitre cassée
- Pose de double vitrage
- Miroirs et crédences sur mesure
- Dépannage d'urgence après bris`,
  peintre: `Peintre en bâtiment à Lyon depuis 14 ans, je réalise vos travaux de finition intérieure et extérieure, chantier propre et délais tenus.

- Peinture intérieure murs et plafonds
- Pose de papier peint et toile de verre
- Enduits et préparation des supports
- Ravalement de façade`,
  menuisier: `Menuisier à Oullins depuis 11 ans, je travaille le bois sur mesure dans mon atelier et pose vos ouvrages chez vous.

- Fabrication de meubles sur mesure
- Pose de parquet et de plinthes
- Portes intérieures et placards
- Fenêtres bois et volets`,
  macon: `Maçon à Vénissieux depuis 18 ans, je réalise vos travaux de gros œuvre et vos aménagements extérieurs, du muret à l'extension.

- Construction de murs et murets
- Dalles béton et terrasses
- Ouverture de mur porteur
- Extension et surélévation`,
};

/* ------------------------------------------------------------
 * 10 bis. SIGNALEMENT D'UNE FICHE
 * ------------------------------------------------------------
 * Le lien « Signaler cette fiche » (bas de la fiche artisan)
 * ouvre une petite fenêtre : un ou plusieurs motifs à cocher, un
 * commentaire obligatoire, puis envoi. Tout se règle ici :
 *  - MOTIFS_SIGNALEMENT : les cases proposées (cle = valeur
 *    enregistrée en base, label = texte affiché) ;
 *  - SIGNALEMENT.commentaireMax : longueur maximum du commentaire,
 *    qui est FACULTATIF (le bouton s'active dès qu'un motif est
 *    coché, sans condition sur le commentaire) ;
 *  - les deux limites anti-spam appliquées CÔTÉ SERVEUR (par
 *    adresse IP). Un envoi refusé (limite atteinte ou vérification
 *    anti-robots échouée) reçoit le même message poli qu'un envoi
 *    réussi : on n'indique jamais la raison exacte.
 * ------------------------------------------------------------ */
export const MOTIFS_SIGNALEMENT = [
  { cle: "coordonnees", label: "Coordonnées erronées (téléphone, zone…)" },
  { cle: "fraude", label: "Fausse entreprise ou usurpation d'identité" },
  { cle: "contenu", label: "Photo ou texte inapproprié" },
  { cle: "inactif", label: "Artisan qui n'exerce plus / entreprise fermée" },
  { cle: "reputation", label: "Avis ou réputation manifestement trafiqués" },
  { cle: "autre", label: "Autre motif (à préciser ci-dessous)" },
];

export const SIGNALEMENT = {
  commentaireMax: 500,  // caractères maximum du commentaire
  // Le commentaire est OBLIGATOIRE : sans un minimum de détail, un
  // signalement n'est pas exploitable par la modération. Le bouton
  // d'envoi reste inactif tant que ce seuil n'est pas atteint, et le
  // serveur le revérifie (on ne se fie jamais au seul navigateur).
  commentaireMin: 30,

  // Garde-fous anti-spam (côté serveur, par adresse IP)
  maxParIpParJour: 3,               // au plus 3 signalements / IP / 24 h
  maxParIpParArtisanParSemaine: 1,  // au plus 1 / IP / artisan / 7 jours

  // Message unique renvoyé à l'utilisateur (succès OU refus silencieux)
  messageConfirmation: "Merci, votre signalement a été transmis.",
};

/* ------------------------------------------------------------
 * 10 ter. PAGE CONTACT (/contact)
 * ------------------------------------------------------------
 * Le formulaire de contact public : un sujet à choisir, un message
 * obligatoire, envoyé par email à l'exploitant (Resend, adresse
 * CONTACT_EMAIL de .env.local). Mêmes garde-fous que le signalement :
 * Turnstile invisible + limite par IP côté serveur. Un envoi refusé
 * (limite atteinte ou Turnstile échoué) reçoit le même message poli
 * qu'un envoi réussi.
 * ------------------------------------------------------------ */
export const SUJETS_CONTACT = [
  { cle: "question", label: "Question générale" },
  { cle: "probleme", label: "Signaler un problème" },
  { cle: "suggestion", label: "Suggestion" },
  { cle: "autre", label: "Autre" },
];

export const CONTACT = {
  messageMin: 20,    // caractères minimum du message (obligatoire)
  messageMax: 1000,  // caractères maximum du message
  maxParIpParJour: 3, // au plus 3 envois / IP / 24 h
  messageConfirmation: "Merci, votre message a bien été envoyé.",
};

/* ------------------------------------------------------------
 * 12. VALIDATION DES FICHES PAR L'ADMIN
 * ------------------------------------------------------------
 * Les trois points contrôlés avant de rendre une fiche visible.
 * Dans l'interface admin, DÉCOCHER une case envoie automatiquement
 * le message type correspondant à l'artisan (aucun texte à rédiger).
 * Les libellés et messages se modifient ici.
 * ------------------------------------------------------------ */
export const VALIDATION_FICHE = [
  {
    cle: "siren",
    label: "SIREN vérifié et cohérent",
    message:
      "Votre numéro SIREN n'a pas pu être validé : vérifiez qu'il est correct, " +
      "que l'établissement est actif, et qu'il correspond bien à votre nom ou à " +
      "celui de votre société. Corrigez puis réenregistrez votre fiche.",
  },
  {
    cle: "liens",
    label: "Liens Instagram / Google cohérents",
    message:
      "Votre lien Instagram (ou votre fiche Google) ne semble pas correspondre " +
      "à votre activité d'artisan. Vérifiez les adresses saisies puis " +
      "réenregistrez votre fiche.",
  },
  {
    cle: "photo",
    label: "Photo de couverture (paysage, artisan au travail)",
    message:
      "Votre photo de couverture doit être une vraie photo horizontale qui " +
      "vous met en valeur (vous devant votre camion, sur un chantier, avec " +
      "votre matériel) — pas un logo. Remplacez-la puis réenregistrez votre fiche.",
  },
];

/* ------------------------------------------------------------
 * 13. EMAILS DE NOTIFICATION
 * ------------------------------------------------------------
 * Règle du cahier des charges (§11) : les emails ne contiennent
 * JAMAIS le contenu du message ni l'email de l'autre partie —
 * ils invitent simplement à se connecter. {lien} est remplacé
 * automatiquement par l'adresse de la bonne page.
 * ------------------------------------------------------------ */
export const EMAILS_NOTIFICATION = {
  demandeRecue: {
    sujet: "Nouvelle demande sur Roswel",
    texte:
      "Bonjour,\n\nUn particulier vous a envoyé une demande sur Roswel.\n" +
      "Connectez-vous à votre espace pour la lire et y répondre :\n{lien}\n\n" +
      "À très vite,\nL'équipe Roswel",
  },
  reponseRecue: {
    sujet: "Un artisan vous a répondu sur Roswel",
    texte:
      "Bonjour,\n\nUn artisan a répondu à votre demande sur Roswel.\n" +
      "Connectez-vous pour lire sa réponse :\n{lien}\n\n" +
      "À très vite,\nL'équipe Roswel",
  },
  modificationsDemandees: {
    sujet: "Votre fiche Roswel nécessite quelques ajustements",
    texte:
      "Bonjour,\n\nNotre équipe a examiné votre fiche : quelques ajustements " +
      "sont nécessaires avant sa mise en ligne.\n" +
      "Connectez-vous à votre espace artisan pour voir le détail :\n{lien}\n\n" +
      "À très vite,\nL'équipe Roswel",
  },
};

/* ------------------------------------------------------------
 * 14. PROSPECTION DES ARTISANS (avant leur inscription)
 * ------------------------------------------------------------
 * On collecte des entreprises du bâtiment (annuaire Sirene de
 * l'INSEE + API Google Places), on leur écrit, et on suit ce qui
 * se passe. Tout se règle ici : la vitesse d'envoi, le rythme des
 * relances, les textes.
 *
 * DEUX PRINCIPES À NE PAS PERDRE DE VUE :
 *  - on monte en charge DOUCEMENT (une adresse d'expéditeur neuve
 *    qui envoie 200 messages le premier jour finit en indésirable) ;
 *  - on s'arrête à la première réponse, et pour toujours à la
 *    première désinscription.
 * ------------------------------------------------------------ */

/**
 * LE PLAFOND QUOTIDIEN — montée en charge sur 6 semaines
 * ------------------------------------------------------
 * Nombre maximum d'e-mails de prospection envoyés sur les
 * DERNIÈRES 24 HEURES (fenêtre glissante — voir
 * FENETRE_QUOTA_HEURES : il n'y a PAS de remise à zéro à minuit).
 *
 * `paliers[0]` = semaine 1, `paliers[1]` = semaine 2, etc.
 * Au-delà de la 6e semaine, c'est `croisiere` qui s'applique.
 *
 * La « semaine » se compte depuis le tout premier envoi de la
 * campagne, jamais depuis la date du jour.
 */
export const PLAFOND_QUOTIDIEN_PAR_SEMAINE = {
  paliers: [5, 10, 20, 35, 55, 80],
  croisiere: 80,
};

/**
 * LA SÉQUENCE DE RELANCES, en jours après le PREMIER contact.
 * J+7, puis J+14, puis J+30. Passé cela, plus rien : le silence
 * est une réponse.
 */
export const DELAIS_RELANCE_JOURS = [7, 14, 30];

/** Premier contact + 3 relances = 4 messages, et on s'arrête. */
export const NOMBRE_ENVOIS_MAXIMUM = 4;

/**
 * LE DÉLAI POUR ANNULER UN « CONTACTÉ PAR FORMULAIRE »
 * -----------------------------------------------------
 * Ce clic-là fait avancer la séquence : le compteur d'envois monte,
 * la relance suivante est calculée. Cliqué par erreur sur la mauvaise
 * ligne, il fausse un compteur qu'on ne peut plus corriger.
 *
 * D'où cette fenêtre COURTE, et volontairement courte : elle rattrape
 * une erreur de clic — celle qu'on voit tout de suite — sans ouvrir la
 * porte à des retouches de compteurs longtemps après coup. Passé ce
 * délai, la ligne n'affiche plus qu'une date, et la correction passe
 * par l'outil discret sous le tableau.
 */
export const DELAI_ANNULATION_FORMULAIRE_MINUTES = 5;

/**
 * La fenêtre de comptage du plafond, en heures. Glissante : on
 * compte les envois des N dernières heures, à la seconde près.
 * Une remise à zéro à minuit produirait une rafale juste après
 * minuit — exactement ce qu'il faut éviter.
 */
export const FENETRE_QUOTA_HEURES = 24;

/**
 * LES HEURES D'ENVOI (heure de Paris, pas UTC)
 * --------------------------------------------
 * On n'écrit à un artisan ni la nuit ni le dimanche matin : un
 * message reçu à 3 h du matin sent le robot. Les envois sont
 * étalés entre ces deux heures.
 * ⚠️ L'hébergeur raisonne en UTC : la conversion vers l'heure de
 * Paris se fait dans le code, pas ici.
 */
export const PLAGE_ENVOI = {
  heureDebut: 8,   // 8 h du matin
  heureFin: 18,    // 18 h (dernier envoi avant cette heure)
};

/** Le fuseau de PLAGE_ENVOI. L'hébergeur, lui, raisonne en UTC. */
export const FUSEAU_ENVOI = "Europe/Paris";

/**
 * LE RYTHME DE LA TÂCHE PLANIFIÉE
 * --------------------------------
 * ⚠️ CONTRAINTE DE L'HÉBERGEUR, PAS UN CHOIX. Le plan Vercel Hobby
 * n'autorise que DEUX tâches planifiées, chacune UNE FOIS PAR JOUR
 * (et déclenchée n'importe quand dans l'heure demandée). Une
 * expression du type « toutes les 15 minutes » fait ÉCHOUER le
 * déploiement, avec le message « Hobby accounts are limited to daily
 * cron jobs ».
 *
 * Conséquence : avec Vercel seul, l'étalement dans la journée est
 * impossible — une seule exécution ne peut pas dormir pendant dix
 * heures. Les envois du jour partent donc en UN SEUL paquet.
 *
 * `executionsParJour` dit à la tâche comment se comporter :
 *  - 1  → chaque exécution VIDE la file du jour (paquet unique) ;
 *  - >1 → chaque exécution n'envoie que ce qui est dû à cette
 *         minute-là : l'étalement calculé à la mise en file est
 *         réellement respecté.
 *
 * Pour passer à un vrai étalement SANS payer : faire appeler
 * /api/cron/prospection toutes les 15 minutes par un planificateur
 * extérieur gratuit (cron-job.org, GitHub Actions…) avec l'en-tête
 * `x-cron-secret`, puis mettre ici le nombre d'exécutions
 * correspondant (10 h de plage ÷ 15 min = 40).
 */
export const PLANIFICATION_ENVOI = {
  executionsParJour: 1,

  /**
   * À moins de N minutes de la fin de la plage, l'exécution envoie
   * TOUT ce qui reste en file pour aujourd'hui : rien ne doit être
   * repoussé au lendemain faute d'une minute d'écart.
   */
  rattrapageAvantFinMinutes: 90,

  /**
   * Plafond d'envois par exécution, en plus du quota quotidien : une
   * fonction serverless ne dispose que de quelques dizaines de
   * secondes. Au-delà, le reste part à l'exécution suivante.
   */
  lotMaximumParExecution: 40,
};

/**
 * LES SEUILS D'ALERTE SUR LES PLAINTES
 * ------------------------------------
 * Proportion de destinataires qui cliquent « courrier indésirable ».
 * Au-delà de l'alerte, on ralentit et on revoit les textes ; au-delà
 * du seuil critique, on ARRÊTE la campagne (au-dessus, les
 * messageries commencent à bloquer le domaine entier).
 *  - 0,001 = 1 plainte pour 1 000 messages
 *  - 0,003 = 3 plaintes pour 1 000 messages
 */
export const SEUIL_PLAINTE_ALERTE = 0.001;
export const SEUIL_PLAINTE_CRITIQUE = 0.003;

/**
 * LE SCORE D'UN PROSPECT SE CALCULE SUR 75, PAS SUR 100
 * -----------------------------------------------------
 * Avant son inscription, un artisan n'a pas relié son compte
 * Instagram, et aucune API ne permet de récupérer ses abonnés
 * automatiquement. Les 25 points Instagram sont donc hors d'atteinte
 * à ce stade.
 *
 * Les annoncer dans un total sur 100 reviendrait à afficher un score
 * artificiellement bas : un artisan qui vaut 90 s'en verrait annoncer
 * 65, et l'argument se retournerait contre nous. On calcule donc sur
 * ce qui est vraiment vérifiable — avis Google (45) + ancienneté au
 * répertoire Sirene (30) — et on présente les 25 points restants
 * comme des points À GAGNER en activant sa fiche.
 *
 * (Calcul de ce score : calculerScoreProspect, src/lib/score.ts.)
 */
export const SCORE_PROSPECT_MAXIMUM =
  SCORE_GOOGLE.maximum + SCORE_ANCIENNETE.maximum;   // = 75
export const POINTS_INSTAGRAM_A_GAGNER = SCORE_INSTAGRAM.maximum; // = 25

/**
 * LA COLLECTE DEPUIS L'ANNUAIRE SIRENE — vitesse et volume
 * ---------------------------------------------------------
 * L'annuaire public des entreprises est gratuit et sans clé, mais il
 * LIMITE LE DÉBIT : trop d'appels d'affilée et il répond « 429 »
 * (trop de requêtes) pendant quelques minutes. On avance donc
 * lentement, et on s'arrête proprement s'il se ferme.
 *
 * Une collecte = UN code NAF × UNE commune. Le plafond d'entreprises
 * garde chaque exécution courte : mieux vaut relancer l'outil deux
 * fois que risquer une exécution coupée au milieu. Relancer est sans
 * danger — une entreprise déjà collectée est simplement mise à jour.
 *
 * Si l'annuaire bloque souvent : augmenter `pauseMs` par paliers de
 * 500 ms, plutôt que de réduire le nombre d'entreprises.
 */
export const COLLECTE_SIRENE = {
  entreprisesMaximum: 100, // plafond d'entreprises traitées par appel
  taillePage: 25,          // entreprises par page (maximum accepté : 25)
  pauseMs: 1200,           // attente entre deux appels à l'annuaire
  // Carte de visite envoyée à chaque appel : la documentation de
  // l'annuaire le recommande, pour que l'État sache qui l'interroge
  // (et puisse nous écrire plutôt que nous bloquer, le cas échéant).
  userAgent: `Roswel (+${MARQUE.siteEnLigne})`,
};

/**
 * LES FORMES JURIDIQUES — pour ne pas prendre une société pour une personne
 * --------------------------------------------------------------------------
 * Liste courte et prudente, utilisée partout où l'on doit distinguer
 * une dénomination d'entreprise d'un nom de personne (colonnes
 * « Artisan » / « Société » du tableau de prospection, comparaison de
 * noms avec Google). En ajouter au besoin.
 */
export const FORMES_JURIDIQUES = [
  "SARL", "SAS", "SASU", "EURL", "SCI", "SNC", "SCOP", "SCM", "SELARL",
  "SA", "EI", "EIRL", "SCIC", "GIE",
];

/**
 * LA RECHERCHE DES FICHES GOOGLE DES PROSPECTS
 * ---------------------------------------------
 * ⚠️ C'EST LE PREMIER OUTIL DU PROJET QUI COÛTE DE L'ARGENT. Chaque
 * appel à Google Places est facturé, et Google ne permet PAS de fixer
 * un plafond de dépenses sur cette API : la protection est donc
 * ENTIÈREMENT dans notre code, ici et dans src/lib/google-prospects.ts.
 *
 * DEUX APPELS AU PLUS par prospect, et le second n'est payé que si le
 * premier a donné une correspondance NETTE :
 *  1. une recherche (nom + adresse) — toujours ;
 *  2. les détails (note, avis, site, téléphone) — seulement si la
 *     confiance est haute. Une correspondance douteuse ne coûte donc
 *     qu'un seul appel, et n'écrit rien.
 */
export const GOOGLE_PROSPECTS = {
  /**
   * LE GARDE-FOU PRINCIPAL : nombre TOTAL d'appels Google autorisés
   * par exécution, recherches et détails confondus. Au-delà, l'outil
   * s'arrête et le dit. Volontairement bas : on relance plutôt deux
   * fois que de découvrir une facture.
   */
  appelsMaximumParExecution: 60,

  /**
   * Nombre d'échecs D'AFFILÉE au bout duquel on arrête tout. Une clé
   * invalide ou un quota dépassé fait échouer TOUS les appels :
   * inutile d'en brûler soixante pour s'en apercevoir.
   */
  echecsConsecutifsMaximum: 3,

  /** Attente entre deux prospects (Google tolère mieux un rythme calme). */
  pauseMs: 300,

  /** Candidats demandés à la recherche : au-delà, on ne saurait trancher. */
  candidatsMaximum: 3,

  // ----- Les seuils de confiance (sur 100) -----
  // 60 points pour la ressemblance du NOM, 40 pour l'ADRESSE.
  // Au-dessus de `haute` on enregistre ; en dessous, on écrit une
  // simple proposition dans les notes, et rien dans les colonnes.
  confianceHaute: 70,
  confianceMoyenne: 40,

  /**
   * COÛT INDICATIF D'UN APPEL, en euros. ⚠️ À VÉRIFIER sur la grille
   * tarifaire de Google (cloud.google.com/maps-platform/pricing) :
   * elle change, et ces valeurs ne servent qu'à afficher un ordre de
   * grandeur dans le compte rendu.
   * La recherche demande des champs « Pro » ; les détails demandent la
   * note et le nombre d'avis, les champs les plus chers de la grille.
   * (Rappel : Google offre un contingent gratuit mensuel par type
   *  d'appel — au lancement, ces montants resteront très
   *  probablement à zéro.)
   */
  coutRechercheEuro: 0.03,
  coutDetailsEuro: 0.024,

  /**
   * LES TYPES GOOGLE QUI DÉSIGNENT UN MÉTIER SANS AMBIGUÏTÉ.
   * Uniquement ceux dont le sens est certain : un « general_contractor »
   * ne dit rien, il n'est pas listé. Sert à confirmer le métier d'un
   * prospect quand la fiche Google est rattachée avec certitude.
   */
  typesGoogleVersMetier: {
    plumber: "plombier",
    electrician: "electricien",
    locksmith: "serrurier",
    painter: "peintre",
  } as Record<string, string>,

  /**
   * LES MOTS DU NOM QUI DÉSIGNENT UN MÉTIER. Si le nom Google en
   * contient DEUX différents (« Plomberie Chauffage Durand »), on ne
   * conclut rien : c'est justement l'ambiguïté qu'on cherche à éviter.
   */
  motsClesMetier: {
    plomberie: "plombier",
    plombier: "plombier",
    sanitaire: "plombier",
    chauffagiste: "chauffagiste",
    chauffage: "chauffagiste",
    electricite: "electricien",
    electricien: "electricien",
    serrurerie: "serrurier",
    serrurier: "serrurier",
    peinture: "peintre",
    peintre: "peintre",
    menuiserie: "menuisier",
    menuisier: "menuisier",
    vitrerie: "vitrier",
    vitrier: "vitrier",
    miroiterie: "vitrier",
    maconnerie: "macon",
    macon: "macon",
  } as Record<string, string>,
};

/**
 * LA RECHERCHE D'ADRESSES E-MAIL — sur le site de l'artisan, et nulle part ailleurs
 * ----------------------------------------------------------------------------------
 * L'annuaire Sirene ne donne JAMAIS d'adresse e-mail. La seule source
 * légitime est le site internet de l'entreprise, quand elle en a un :
 * on lit sa page d'accueil, et au besoin UNE page de contact.
 *
 * CE QU'ON NE FERA JAMAIS, et pourquoi :
 *  - deviner une adresse (contact@domaine, prenom.nom@domaine) : ça
 *    produit des rebonds, et un taux de rebond élevé détruit la
 *    réputation d'expéditeur — donc la délivrabilité de TOUS les
 *    messages, y compris ceux des artisans inscrits ;
 *  - payer un service d'enrichissement ;
 *  - aspirer un annuaire tiers contre ses conditions d'utilisation.
 *
 * Ne rien trouver est un RÉSULTAT ACCEPTABLE : le prospect reste
 * « e-mail à trouver » et sera contacté à la main.
 */
export const RECHERCHE_EMAIL = {
  prospectsParAppel: 10,     // borne le travail d'une exécution
  pauseMs: 1500,             // attente entre deux sites visités
  delaiSiteMs: 8000,         // abandon d'un site trop lent (8 s)
  pagesParSite: 2,           // accueil + UNE page de contact, jamais plus
  tailleMaximumPage: 500_000, // caractères lus par page (garde-fou)

  // Carte de visite envoyée aux sites visités : un site qui veut nous
  // refuser doit pouvoir nous identifier.
  userAgent: `RoswelBot (+${MARQUE.siteEnLigne})`,

  // Les liens du menu qui mènent à une page de contact.
  motsLienContact: ["contact", "nous contacter", "devis", "nous ecrire"],

  // Adresses techniques ou de service : jamais retenues.
  prefixesEcartes: [
    "webmaster", "no-reply", "noreply", "ne-pas-repondre", "postmaster",
    "mailer-daemon", "abuse", "hostmaster", "privacy", "dpo", "rgpd",
  ],

  /**
   * LES MESSAGERIES GRAND PUBLIC — le point délicat.
   * Une adresse dont le domaine diffère du site est souvent celle de
   * l'AGENCE WEB ou de l'hébergeur : à écarter. Mais dans le
   * bâtiment, l'immense majorité des artisans affichent leur adresse
   * Gmail ou Orange sur leur propre site — l'écarter reviendrait à ne
   * presque rien trouver.
   *
   * Avec `accepterMessageriesGrandPublic` à true, ces adresses-là sont
   * retenues (en second choix, après une adresse au domaine du site).
   * À passer à false pour n'accepter QUE le domaine du site.
   */
  accepterMessageriesGrandPublic: true,
  messageriesGrandPublic: [
    "gmail.com", "googlemail.com", "orange.fr", "wanadoo.fr", "free.fr",
    "sfr.fr", "neuf.fr", "bbox.fr", "laposte.net", "hotmail.fr",
    "hotmail.com", "outlook.fr", "outlook.com", "live.fr", "yahoo.fr",
    "yahoo.com", "icloud.com", "me.com", "aliceadsl.fr", "numericable.fr",
  ],
};

/**
 * CODES NAF → MÉTIERS DE ROSWEL
 * -----------------------------
 * L'annuaire Sirene classe les entreprises par code NAF (ou APE).
 * Cette table dit quels codes nous intéressent, et à quel(s)
 * métier(s) de la liste METIERS ils correspondent.
 *
 * ⚠️ DEUX PRÉCAUTIONS D'EMPLOI :
 *  1. Le code NAF s'écrit tantôt « 4322A », tantôt « 43.22A »
 *     selon la source. La comparaison doit ignorer le point.
 *  2. Un code NAF est une DÉCLARATION de l'entreprise, souvent
 *     approximative, et plusieurs métiers partagent le même code.
 *     Les métiers déduits ici sont donc une PROPOSITION à relire
 *     à la main dans la page d'administration — jamais une vérité.
 *
 * `menu` est le SEUL libellé montré à l'écran : il dit en français
 * courant ce que le code recouvre vraiment (« Plombier /
 * Chauffagiste » pour 4322A, qui réunit les deux). `libelle` reste
 * le libellé officiel de l'INSEE — il sert en base et dans les
 * journaux, jamais dans l'interface.
 */
export type CodeNafBatiment = {
  code: string;
  menu: string;
  libelle: string;
  metiers: string[];
  /**
   * Vrai = le code reste connu (il sert encore à lire le métier des
   * prospects DÉJÀ collectés), mais son badge disparaît de la barre de
   * collecte : on ne va plus en chercher de nouveaux.
   */
  collecteSuspendue?: boolean;
};

export const CODES_NAF_BATIMENT: CodeNafBatiment[] = [
  {
    code: "4321A",
    menu: "Électricien",
    libelle: "Travaux d'installation électrique dans tous locaux",
    metiers: ["electricien"],
  },
  {
    code: "4322A",
    menu: "Plombier / Chauffagiste",
    libelle: "Travaux d'installation d'eau et de gaz en tous locaux",
    // Ce code ne sépare pas les deux métiers : à trancher à la main.
    metiers: ["plombier", "chauffagiste"],
  },
  {
    code: "4322B",
    menu: "Chauffagiste (climatisation)",
    libelle: "Travaux d'installation d'équipements thermiques et de climatisation",
    metiers: ["chauffagiste"],
    /**
     * MIS DE CÔTÉ — À RÉACTIVER LE JOUR OÙ LE MÉTIER FRIGORISTE EXISTE
     * ----------------------------------------------------------------
     * Cette case administrative mélange les chauffagistes et les
     * FRIGORISTES. Or Roswel ne propose pas le métier frigoriste
     * aujourd'hui : leur écrire maintenant, ce serait les griller pour
     * rien — et le plafond de 4 messages nous interdirait de les
     * recontacter le jour où le métier sera ajouté.
     *
     * Les chauffagistes continuent d'arriver par le badge
     * « Plombier / Chauffagiste » (43.22A).
     *
     * POUR RÉACTIVER : supprimer la ligne `collecteSuspendue` ci-dessous
     * (et ce commentaire). Rien d'autre.
     */
    collecteSuspendue: true,
  },
  {
    code: "4332A",
    menu: "Menuisier bois",
    libelle: "Travaux de menuiserie bois et PVC",
    metiers: ["menuisier"],
  },
  {
    code: "4332B",
    menu: "Serrurier / Menuisier métallique",
    libelle: "Travaux de menuiserie métallique et serrurerie",
    // Là encore le code mélange deux métiers.
    metiers: ["serrurier", "menuisier"],
  },
  {
    code: "4334Z",
    menu: "Peintre / Vitrier",
    libelle: "Travaux de peinture et vitrerie",
    // Le code officiel réunit peinture ET vitrerie : la très grande
    // majorité de ces entreprises sont des peintres.
    metiers: ["peintre", "vitrier"],
  },
  {
    code: "4399C",
    menu: "Maçon",
    libelle: "Travaux de maçonnerie générale et gros œuvre de bâtiment",
    metiers: ["macon"],
  },
];

/**
 * CODES NAF LAISSÉS DE CÔTÉ, FAUTE DE CERTITUDE
 * ---------------------------------------------
 * Je préfère ne pas deviner : ces codes existent et touchent au
 * bâtiment, mais leur rattachement à l'un de nos 8 métiers est
 * douteux. À valider (nomenclature officielle de l'INSEE) avant
 * de les ajouter à CODES_NAF_BATIMENT ci-dessus.
 *
 *  - 4321B  Travaux d'installation électrique sur la voie publique
 *           → électricien, mais ce sont des chantiers publics :
 *             quasiment jamais des artisans à démarcher.
 *  - 4120A  Construction de maisons individuelles
 *  - 4120B  Construction d'autres bâtiments
 *           → souvent des entreprises générales, pas des maçons
 *             artisans. Volume énorme, pertinence faible.
 *  - 4331Z  Travaux de plâtrerie
 *  - 4333Z  Travaux de revêtement des sols et des murs
 *           → plaquiste et carreleur : deux métiers voisins que
 *             Roswel ne propose PAS aujourd'hui.
 *  - 4391A / 4391B  Charpente et couverture
 *           → couvreur : métier non proposé non plus.
 *  - 4399A / 4399B / 4399D  Étanchéité, structures métalliques,
 *           autres travaux spécialisés → trop flou pour trancher.
 *  - 8020Z  Activités liées aux systèmes de sécurité
 *           → certains serruriers-dépanneurs s'y déclarent, mais
 *             le code couvre surtout la télésurveillance.
 */

/* ==================================================================
 * LA CONSOMMATION GOOGLE PLACES — franchises, paliers, tarifs
 * ==================================================================
 * ⚠️ VALEURS À VÉRIFIER SUR LA CONSOLE GOOGLE CLOUD. Google change sa
 * grille ; ce qui est écrit ici sert à afficher un ordre de grandeur,
 * jamais à remplacer la facture réelle.
 *   → console : https://console.cloud.google.com/google/maps-apis
 *   → grille  : https://developers.google.com/maps/billing-and-pricing
 *
 * CE QU'IL FAUT AVOIR COMPRIS
 * ---------------------------
 * Google range ses appels en TROIS PALIERS, du moins cher au plus
 * cher : Essentials, Pro, Enterprise. Chaque palier a sa propre
 * franchise mensuelle gratuite, et ces franchises ne sont JAMAIS
 * mutualisées : un traitement qui touche trois types d'appel
 * différents consomme trois budgets en parallèle. Épuiser les
 * 1 000 appels « Enterprise » ne libère rien sur les 5 000 « Pro ».
 *
 * Le palier d'un appel est décidé par les CHAMPS DEMANDÉS, pas par
 * l'adresse appelée : demander la note et le nombre d'avis
 * (`rating`, `userRatingCount`) fait basculer n'importe quel appel
 * en Enterprise — le palier le plus cher, et la franchise la plus
 * basse. C'est pourquoi la recherche de fiches ne demande jamais la
 * note : elle attend d'être sûre de la correspondance.
 *
 * La franchise se remet à zéro le 1er de chaque mois.
 * ================================================================== */

export const PALIERS_GOOGLE = {
  essentials: { label: "Essentials", franchiseMensuelle: 10_000 },
  pro: { label: "Pro", franchiseMensuelle: 5_000 },
  enterprise: { label: "Enterprise", franchiseMensuelle: 1_000 },
} as const;

export type PalierGoogle = keyof typeof PALIERS_GOOGLE;

/**
 * LES TYPES D'APPEL QUE ROSWEL PASSE RÉELLEMENT — trois, pas un de
 * plus. Chacun porte SA franchise : elle est écrite en clair (et non
 * déduite du palier) parce que Google la compte par type d'appel.
 * Corriger un chiffre ici corrige partout : journal, page de
 * consommation, fenêtre de confirmation.
 */
export const TYPES_APPEL_GOOGLE = {
  recherche: {
    label: "Recherche de fiche",
    palier: "pro" as PalierGoogle,
    franchiseMensuelle: PALIERS_GOOGLE.pro.franchiseMensuelle,
    coutUnitaireEuro: 0.03,
    /** Ce que Roswel demande : nom, adresse, types — jamais la note. */
    champs: "id, nom, adresse, types",
    aQuoiCaSert:
      "Retrouver la fiche Google d'un prospect à partir de son nom et de son adresse.",
  },
  recherche_avis: {
    label: "Recherche avec la note",
    palier: "enterprise" as PalierGoogle,
    franchiseMensuelle: PALIERS_GOOGLE.enterprise.franchiseMensuelle,
    coutUnitaireEuro: 0.035,
    champs: "id, nom, adresse, note, nombre d'avis",
    aQuoiCaSert:
      "Chercher la fiche d'un artisan déjà inscrit, en affichant sa note pour la reconnaître.",
  },
  details_avis: {
    label: "Lecture des avis",
    palier: "enterprise" as PalierGoogle,
    franchiseMensuelle: PALIERS_GOOGLE.enterprise.franchiseMensuelle,
    coutUnitaireEuro: 0.024,
    champs: "note, nombre d'avis, site, téléphone",
    aQuoiCaSert:
      "Lire la note et le nombre d'avis d'une fiche connue — c'est l'appel le plus cher.",
  },
} as const;

export type TypeAppelGoogle = keyof typeof TYPES_APPEL_GOOGLE;

/**
 * LES OUTILS QUI DÉPENSENT. Trois, et seulement trois : tout appel
 * passé ailleurs serait un appel invisible.
 */
export const OUTILS_GOOGLE = {
  "google-prospects": {
    label: "Recherche de fiches (prospection)",
    ou: "/admin/prospection",
  },
  "avis-google": {
    label: "Rafraîchissement manuel",
    ou: "/admin (fiche d'un artisan)",
  },
  "cron-avis-google": {
    label: "Rafraîchissement automatique",
    ou: "tâche planifiée, une fois par jour",
  },
} as const;

export type OutilGoogle = keyof typeof OUTILS_GOOGLE;

/**
 * QUAND S'INQUIÉTER, en part de la franchise consommée.
 * Orange à 70 % : il reste de la marge, mais il faut la voir venir.
 * Rouge à 90 % : le prochain lot peut faire basculer en payant.
 */
export const SEUILS_CONSOMMATION_GOOGLE = {
  attention: 0.7,
  critique: 0.9,
};

/** Combien de mois d'historique la page de consommation affiche. */
export const MOIS_HISTORIQUE_GOOGLE = 6;

/**
 * FRAÎCHEUR DES DONNÉES GOOGLE — 28 jours, et pas 30
 * ---------------------------------------------------
 * Les conditions d'utilisation de l'API Google Places INTERDISENT
 * de conserver la note et le nombre d'avis au-delà de 30 jours.
 * On rafraîchit donc à 28 : les deux jours de marge évitent de
 * dépasser la limite si une exécution est retardée (panne,
 * déploiement, quota atteint la veille).
 *
 * S'applique aux DEUX tables : `artisans` (les vraies fiches) et
 * `artisans_prospects`. La tâche planifiée
 * (/api/cron/avis-google) tourne tous les jours mais ne reprend
 * que les lignes dépassées : la charge s'étale d'elle-même, au lieu
 * de tout appeler le même jour du mois.
 * (À ne pas confondre avec FRAICHEUR_INSTAGRAM_JOURS, section 6,
 *  qui n'est qu'une alerte d'affichage : Instagram est saisi à la
 *  main et ne coûte rien.)
 */
export const FRAICHEUR_GOOGLE_JOURS = 28;

/**
 * LE PLAFOND D'APPELS PAR EXÉCUTION — le garde-fou de la facture
 * ---------------------------------------------------------------
 * CHAQUE appel à Google Places est facturé sur le compte Google
 * Cloud. Ce plafond borne la dépense possible d'une exécution, quoi
 * qu'il arrive : une erreur de code ou une base pleine de lignes
 * périmées ne peut pas produire des milliers d'appels.
 *
 * Comment le choisir : en régime établi, il faut environ
 * (nombre de fiches ÷ 28) appels par jour. 60 laisse donc de la
 * marge jusqu'à ~1 600 fiches, tout en bornant la dépense à
 * 60 appels/jour maximum. À augmenter le jour où le message de la
 * tâche annonce régulièrement des lignes « restantes ».
 */
export const APPELS_GOOGLE_MAXIMUM_PAR_EXECUTION = 60;

/**
 * Nombre d'échecs D'AFFILÉE au bout duquel on arrête tout.
 * Une clé invalide, un quota dépassé ou une panne Google font
 * échouer TOUS les appels : inutile d'en brûler soixante pour s'en
 * apercevoir. Deux échecs consécutifs suffisent à conclure.
 */
export const ECHECS_GOOGLE_CONSECUTIFS_MAXIMUM = 3;

/**
 * LES 4 MESSAGES DE LA SÉQUENCE
 * -----------------------------
 * Premier contact, puis trois relances qui apportent chacune un
 * angle DIFFÉRENT (personne n'a envie de relire trois fois le même
 * message). Tous font moins de 120 mots, tous citent les chiffres
 * qui justifient qu'on écrive à CETTE entreprise-là, tous se
 * terminent par le lien de désinscription.
 *
 * RÈGLE ABSOLUE SUR LE SCORE ANNONCÉ : jamais « sur 100 ». Le score
 * d'un prospect est PROVISOIRE et se lit sur {maximum} (= 75), parce
 * qu'il ne repose que sur des données publiques VÉRIFIÉES — avis
 * Google et ancienneté au répertoire Sirene. Aucun message ne doit
 * laisser croire qu'Instagram entre déjà dans le calcul : les
 * {aGagner} points (= 25) correspondants sont ce que l'artisan
 * AJOUTE en activant sa fiche, jamais ce qui lui manque.
 *
 * Substitutions automatiques, sur le modèle de EMAILS_NOTIFICATION :
 *   {nom}           nom de l'entreprise ou de l'artisan
 *   {metier}        son métier (ex. « plombier »)
 *   {ville}         sa ville
 *   {note}          sa note Google (ex. « 4,8 »)
 *   {avis}          son nombre d'avis Google
 *   {annees}        ses années d'existence (annuaire Sirene)
 *   {score}         les points obtenus (calculerScoreProspect)
 *   {maximum}       le total possible à ce stade — SCORE_PROSPECT_MAXIMUM
 *   {aGagner}       les points Instagram — POINTS_INSTAGRAM_A_GAGNER
 *   {lien}          l'adresse de sa fiche / de l'inscription
 *   {desinscription} le lien « ne plus recevoir de messages »
 *
 * La clé de chaque gabarit (« premierContact », « relance1 »…) est
 * enregistrée dans le journal des envois (colonne `gabarit`).
 */
export const GABARITS_PROSPECTION = {
  // ----- Envoi initial : « votre fiche existe déjà » -----
  premierContact: {
    sujet: "{nom} — votre score de confiance Roswel : {score} sur {maximum}",
    texte:
      "Bonjour,\n\n" +
      "Roswel est un annuaire d'artisans classés sur des critères " +
      "vérifiables, jamais sur la publicité.\n\n" +
      "À partir de vos seules données publiques, nous avons calculé un " +
      "score provisoire : {score} sur {maximum}. Il repose sur deux " +
      "éléments vérifiés — vos {avis} avis Google (note {note}) et vos " +
      "{annees} ans d'ancienneté au répertoire Sirene.\n\n" +
      "Provisoire, car {aGagner} points supplémentaires s'ajoutent le jour " +
      "où vous activez votre fiche et reliez votre compte Instagram.\n\n" +
      "Votre fiche est prête, mais elle n'est PAS publiée : vous seul " +
      "pouvez l'activer. C'est gratuit.\n\n" +
      "Voir votre fiche :\n{lien}\n\n" +
      "Kévin, Roswel\n\n" +
      "Ne plus recevoir de messages : {desinscription}",
  },

  // ----- J+7 : l'angle « comment on classe » (transparence) -----
  relance1: {
    sujet: "Comment {nom} est classé sur Roswel",
    texte:
      "Bonjour,\n\n" +
      "Une précision, car la question revient souvent : sur Roswel, aucune " +
      "place ne s'achète. Le classement suit uniquement le score de " +
      "confiance.\n\n" +
      "Deux parts sont DÉJÀ calculées, à partir de données publiques : " +
      "45 points pour les avis Google, 30 pour l'ancienneté de " +
      "l'entreprise. Vous en obtenez {score} sur {maximum} ({avis} avis, " +
      "note {note}, {annees} ans vérifiés au répertoire Sirene). La " +
      "troisième part — {aGagner} points pour l'activité Instagram — " +
      "s'ajoute une fois votre fiche activée.\n\n" +
      "D'ici là, elle reste invisible pour ceux qui cherchent un {metier} " +
      "à {ville}.\n\n" +
      "Activer ma fiche :\n{lien}\n\n" +
      "Kévin, Roswel\n\n" +
      "Ne plus recevoir de messages : {desinscription}",
  },

  // ----- J+14 : l'angle « ce que ça change concrètement » -----
  relance2: {
    sujet: "{nom} : ce que voient les particuliers sur votre fiche",
    texte:
      "Bonjour,\n\n" +
      "Concrètement, une fiche Roswel affiche votre photo, vos horaires, " +
      "votre zone d'intervention, et un bouton d'appel ou WhatsApp direct. " +
      "Pas de formulaire, pas d'intermédiaire : les demandes arrivent chez " +
      "vous.\n\n" +
      "Vous gardez la main sur tout. Les seules données que vous ne " +
      "saisissez pas sont celles qui sont vérifiées : vos {avis} avis " +
      "Google (note {note}) et vos {annees} ans d'ancienneté au répertoire " +
      "Sirene. Elles forment votre score provisoire de {score} sur " +
      "{maximum}.\n\n" +
      "En activant votre fiche, vous y ajoutez les {aGagner} points liés à " +
      "votre compte Instagram.\n\n" +
      "Créer mon compte :\n{lien}\n\n" +
      "Kévin, Roswel\n\n" +
      "Ne plus recevoir de messages : {desinscription}",
  },

  // ----- J+30 : le dernier message, et on le dit -----
  relance3: {
    sujet: "Dernier message — {nom}",
    texte:
      "Bonjour,\n\n" +
      "C'est mon dernier message : je ne veux pas encombrer votre boîte.\n\n" +
      "Votre fiche reste enregistrée, avec son score provisoire de {score} " +
      "sur {maximum} — {avis} avis Google (note {note}) et {annees} ans " +
      "d'ancienneté vérifiés au répertoire Sirene. Les {aGagner} points " +
      "Instagram s'ajouteront le jour où vous l'activerez, si ce jour " +
      "vient.\n\n" +
      "Elle ne sera publiée que si vous créez le compte. Sinon, vous n'avez " +
      "rien à faire : je ne vous écrirai plus.\n\n" +
      "Activer ma fiche :\n{lien}\n\n" +
      "Merci du temps que vous m'avez accordé,\n" +
      "Kévin, Roswel\n\n" +
      "Ne plus recevoir de messages : {desinscription}",
  },
};

/**
 * LES STATUTS D'UN PROSPECT
 * -------------------------
 * Mêmes clés que la contrainte de la base (voir
 * supabase/prospection.sql) : les deux listes doivent rester
 * identiques. Les libellés sont ceux affichés dans le tableau de
 * la page d'administration.
 *
 * LA COULEUR se lit d'un coup d'œil, sur une liste longue :
 *   vert          = c'est gagné (compte créé, réponse reçue)
 *   bleu          = en cours (séquence de relances)
 *   orange_sombre = il manque quelque chose de MA part (l'adresse)
 *   rouge         = fin de piste (rebond, ne plus contacter)
 *   gris          = rien ne s'est encore passé (non contacté)
 * La correspondance couleur → classes est faite une seule fois, dans
 * src/components/TableauProspection.tsx.
 */
export const STATUTS_PROSPECTION = [
  { cle: "non_contacte", label: "Non contacté", couleur: "gris" },
  { cle: "email_a_trouver", label: "E-mail à trouver", couleur: "orange_sombre" },
  { cle: "relance_en_cours", label: "Relance en cours", couleur: "bleu" },
  { cle: "reponse_recue", label: "Réponse reçue", couleur: "vert" },
  { cle: "compte_cree", label: "Compte créé", couleur: "vert" },
  { cle: "rebond", label: "Rebond", couleur: "rouge" },
  { cle: "ne_plus_contacter", label: "Ne plus contacter", couleur: "rouge" },
] as const;

/* ------------------------------------------------------------
 * Score total maximum (pour information : 45 Google + 25 Instagram + 30 ancienneté = 100)
 * ------------------------------------------------------------ */
export const SCORE_TOTAL_MAXIMUM =
  SCORE_INSTAGRAM.maximum + SCORE_GOOGLE.maximum + SCORE_ANCIENNETE.maximum;
