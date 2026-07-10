/**
 * ============================================================
 *  ROSWEL — FICHIER DE RÉGLAGES CENTRAL
 * ============================================================
 *
 *  C'est LE fichier à modifier pour ajuster le site :
 *   1. Les couleurs
 *   2. La grille de score Instagram (50 points)
 *   3. La grille de score des avis Google (50 points)
 *   4. Les seuils des pastilles (Recommandé / Top artisan)
 *   5. L'alerte de fraîcheur des données Instagram (30 jours)
 *   6. Les paliers de rapidité de réponse
 *   7. Les métiers proposés au lancement
 *   8. Les rayons d'intervention possibles
 *   9. La zone de lancement (bandeau d'information)
 *  10. Les régions importées dans la base des communes
 *  11. Les limites des formulaires (bio, message, photos)
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
  primaireFonce: "#D42A5C",   // survol / appui des boutons roses
  primaireClair: "#FFEBF1",   // fonds très légers teintés de rose

  // — Dégradé du logo (haut → bas) —
  degradeDebut: "#FB7BA2",
  degradeFin: "#EC3A6E",

  // — Fonds et textes —
  fond: "#FFFFFF",            // fond principal du site
  fondDoux: "#F8F7F8",        // fond des zones secondaires (cartes, sections)
  encre: "#101B33",           // texte principal (bleu nuit du logo)
  encreDouce: "#5B6472",      // texte secondaire (sous-titres, détails)
  bordure: "#E9E7EB",         // traits et contours discrets

  // — Pastilles (badges) —
  pastilleRecommande: "#EE3D6F", // pastille « Recommandé » (rose de la marque)
  pastilleTop: "#F59E0B",        // pastille « Top artisan » (ambre / doré)

  // — Couleurs d'état —
  succes: "#16A34A",          // confirmations (vert)
  alerte: "#F59E0B",          // avertissements, ex. données Instagram trop vieilles
  erreur: "#DC2626",          // erreurs (rouge)
};

/* ------------------------------------------------------------
 * 3. SCORE INSTAGRAM — sur 50 points
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
  maximum: 50,

  // Seuils des colonnes (nombre de publications minimum)
  paliersPublications: [0, 30, 150],

  // Points : [moins de 30 publis, 30 à 149 publis, 150 publis et +]
  grille: [
    { abonnesMin: 10000, points: [22, 38, 50] }, // 10 000 abonnés et plus
    { abonnesMin: 2000,  points: [16, 28, 38] }, // 2 000 à 9 999 abonnés
    { abonnesMin: 500,   points: [10, 18, 24] }, // 500 à 1 999 abonnés
    { abonnesMin: 0,     points: [5, 10, 14] },  // 0 à 499 abonnés
  ],
};

/* ------------------------------------------------------------
 * 4. SCORE AVIS GOOGLE — sur 50 points
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
  maximum: 50,

  // Seuils des colonnes (nombre d'avis minimum)
  paliersNbAvis: [1, 5, 20, 50, 100],

  // Points : [1-4 avis, 5-19 avis, 20-49 avis, 50-99 avis, 100+ avis]
  grille: [
    { noteMin: 5.0, points: [10, 20, 30, 40, 50] }, // note parfaite 5,0
    { noteMin: 4.7, points: [8, 17, 26, 35, 45] },  // 4,7 à 4,9
    { noteMin: 4.4, points: [6, 13, 20, 28, 36] },  // 4,4 à 4,6
    { noteMin: 4.0, points: [4, 9, 14, 19, 24] },   // 4,0 à 4,3
    { noteMin: 3.0, points: [2, 5, 8, 11, 14] },    // 3,0 à 3,9
    { noteMin: 0,   points: [0, 0, 0, 0, 0] },      // moins de 3,0 : aucun point
  ],
};

/* ------------------------------------------------------------
 * 5. PASTILLES (badges de niveau)
 * ------------------------------------------------------------
 * Affichées uniquement au-dessus d'un seuil : en dessous de
 * "Recommandé", on n'affiche RIEN (jamais de badge dévalorisant).
 * Le score total est sur 100 (Instagram 50 + Google 50).
 * ------------------------------------------------------------ */
export const PASTILLES = {
  top: {
    seuil: 75,                    // score minimum pour « Top artisan »
    label: "Top artisan",
    couleur: COULEURS.pastilleTop,
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
 * 7. RAPIDITÉ DE RÉPONSE
 * ------------------------------------------------------------
 * Calculée automatiquement (jamais saisie par l'artisan) :
 * temps moyen entre la réception d'un message et sa réponse.
 * Affichée seulement s'il existe un historique réel.
 * "maxMinutes" = temps moyen maximum pour afficher ce libellé.
 * Au-delà du dernier palier (24 h), rien n'est affiché.
 * ------------------------------------------------------------ */
export const RAPIDITE_REPONSE = {
  paliers: [
    { maxMinutes: 15, label: "Répond en moins de 15 min" },
    { maxMinutes: 60, label: "Répond en moins d'1 h" },
    { maxMinutes: 180, label: "Répond en moins de 3 h" },
    { maxMinutes: 1440, label: "Répond en moins de 24 h" },
  ],
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
  { slug: "plombier", label: "Plombier" },
  { slug: "chauffagiste", label: "Chauffagiste" },
  { slug: "electricien", label: "Électricien" },
  { slug: "peintre", label: "Peintre" },
  { slug: "serrurier", label: "Serrurier" },
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
  bioMaxCaracteres: 300,       // longueur maximum de la bio d'un artisan
  messageMaxCaracteres: 2500,  // longueur maximum d'un message (avec compteur)
  photosMin: 1,                // nombre minimum de photos jointes à un message
  photosMax: 5,                // nombre maximum de photos jointes à un message
};

/* ------------------------------------------------------------
 * Score total maximum (pour information : 50 + 50 = 100)
 * ------------------------------------------------------------ */
export const SCORE_TOTAL_MAXIMUM = SCORE_INSTAGRAM.maximum + SCORE_GOOGLE.maximum;
