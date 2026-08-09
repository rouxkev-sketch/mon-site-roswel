import { NextResponse } from "next/server";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { calculerScoreTotal, determinerPastille } from "@/lib/score";
import { travailleNuit, travailleWeekend } from "@/lib/horaires";
import { metiersDeLOffre } from "@/lib/metiers";

/** Les métiers de la double compétence « Plombier & Chauffagiste »,
    lus dans la liste centralisée (src/config/roswel.ts) */
const DOUBLE_PLOMBIER_CHAUFFAGISTE = metiersDeLOffre("plombier-chauffagiste");

/**
 * ARTISANS DE DÉMONSTRATION (étape 5)
 * -----------------------------------
 * Crée (ou supprime) un jeu d'artisans fictifs autour de Lyon pour
 * voir vivre la recherche avant les vraies inscriptions (étape 8).
 *
 * - Tous reconnaissables : leur adresse web commence par « demo- ».
 * - Leurs scores sont calculés par le vrai calculateur (src/lib/score.ts)
 *   à partir de leurs chiffres Instagram/Google : parfaitement conformes
 *   aux grilles du fichier de réglages central.
 * - Réexécutable sans doublon ; suppression en un clic.
 * - Outil de développement : page http://localhost:3000/admin/artisans-demo
 */

type ArtisanDemo = {
  slug: string;
  nom_affiche: string;
  // Type de compte : indépendant (photo en cercle) ou société (photo
  // en carré arrondi). Par défaut « indépendant ».
  type_compte?: "independant" | "societe";
  nom_societe?: string | null; // indépendant : société facultative
  nom_responsable?: string | null; // société : « Dirigée par … »
  siren?: string; // SIREN FICTIF (l'outil écrit direct en base, sans passer par l'annuaire)
  bio: string;
  // Adresse complète FACULTATIVE (rue). Renseignée → la fiche affiche la
  // section « Adresse » + une carte (avec le code postal et la ville
  // ci-dessous). Absente/undefined → aucune section adresse sur la fiche.
  adresse?: string | null;
  metiers: string[];
  // La ville de l'artisan (comme à l'inscription) : code INSEE, nom
  // officiel et code postal ; latitude/longitude = centre de la commune
  ville_code_insee: string;
  ville_nom: string;
  ville_code_postal: string;
  latitude: number;
  longitude: number;
  rayon_intervention_km: number;
  communes_exclues?: string[];
  lien_instagram: string;
  /** Site internet FACULTATIF : renseigné pour une partie seulement des
      démos — les autres montrent le tiret « — » de la colonne Internet. */
  site_internet?: string;
  abonnes_instagram: number;
  publications_instagram: number;
  note_google: number;
  nombre_avis_google: number;
  dispo_urgence?: boolean; // case « dépannage d'urgence »
  dispo_feries?: boolean; // case « j'interviens les jours fériés »
  // Période de fermeture déclarée (teste l'onglet « Indisponible »)
  absence_debut?: string;
  absence_fin?: string;
  // Horaires par jour : null (fermé), "24h24", ou créneaux "HH:MM-HH:MM"
  // (« la nuit » et « le week-end » sont DÉDUITS de ces horaires)
  horaires?: Record<string, string[] | "24h24" | null>;
  telephone?: string; // numéros fictifs réservés (06 39 98 xx xx)
  telephone_visible?: boolean; // case « afficher mon téléphone » (défaut : oui)
  whatsapp?: string;
  siren_verifie?: boolean;
  date_creation_entreprise?: string; // date renvoyée par l'annuaire Sirene
  statut_validation?: "valide" | "en_attente";
  // Pour forcer une date de mise à jour Instagram ancienne (test de
  // l'alerte de fraîcheur dans l'admin)
  date_maj_instagram_forcee?: string;
};

const MENTION_DEMO = "(Profil de démonstration.)";

/**
 * La présentation d'une fiche de démonstration : le VRAI texte, puis la
 * mention de démo en dernière ligne, détachée. Les fiches restent
 * identifiables comme fictives sans que cela casse la mise en forme
 * qu'on veut justement pouvoir juger — un paragraphe, une ligne vide,
 * puis une liste à tirets. Les retours à la ligne sont conservés
 * jusqu'à l'affichage (voir `whitespace-pre-line` sur la fiche).
 */
const presentation = (texte: string) => `${texte.trim()}\n\n${MENTION_DEMO}`;

/**
 * Le jeu de démonstration. En commentaire : le score attendu
 * (Instagram + Google + ancienneté Sirene), calculé d'après les
 * grilles par le code. L'ancienneté évoluant avec le temps, les
 * scores notés sont ceux de 2026 — l'outil /admin/recalculer-scores
 * les rafraîchit à tout moment.
 */
const ARTISANS_DEMO: ArtisanDemo[] = [
  {
    // Score attendu (2026) : 19 + 36 + 13 = 68 → Recommandé
    slug: "demo-julien-moreau",
    nom_affiche: "Julien Moreau",
    nom_societe: "Moreau Plomberie & Chauffage",
    siren: "831254672", // fictif
    bio: presentation(`Plombier-chauffagiste à Villeurbanne depuis 7 ans, j'interviens en dépannage comme en installation sur Villeurbanne, Lyon et la première couronne est. Devis gratuit, déplacement sous 24 h en semaine.

- Recherche et réparation de fuite
- Remplacement de chauffe-eau et de ballon
- Entretien et dépannage de chaudière gaz
- Rénovation complète de salle de bains`),
    // AVEC adresse complète (indépendant, Recommandé, actuellement en absence)
    adresse: "58 cours Émile Zola",
    // DOUBLE COMPÉTENCE nº 1 — « Plombier & Chauffagiste »
    metiers: DOUBLE_PLOMBIER_CHAUFFAGISTE,
    ville_code_insee: "69266",
    ville_nom: "Villeurbanne",
    ville_code_postal: "69100",
    latitude: 45.7719,
    longitude: 4.8902,
    rayon_intervention_km: 25,
    lien_instagram: "https://www.instagram.com/julien.plomberie.demo",
    site_internet: "https://www.moreau-plomberie-demo.fr",
    abonnes_instagram: 1850,
    publications_instagram: 210,
    note_google: 4.8,
    nombre_avis_google: 127,
    dispo_urgence: true,
    dispo_feries: false,
    // ABSENT tout l'été : teste le DOUBLE onglet (Recommandé + gris)
    absence_debut: "2026-07-10",
    absence_fin: "2026-08-31",
    horaires: {
      // Coupure déjeuner en semaine + samedi travaillé (week-end déduit)
      lundi: ["08:00-12:00", "14:00-18:00"],
      mardi: ["08:00-12:00", "14:00-18:00"],
      mercredi: ["08:00-12:00", "14:00-18:00"],
      jeudi: ["08:00-12:00", "14:00-18:00"],
      vendredi: ["08:00-12:00", "14:00-18:00"],
      samedi: ["09:00-17:00"],
      dimanche: null,
    },
    telephone: "06 39 98 01 02", // Appeler ET WhatsApp
    whatsapp: "06 39 98 01 02",
    siren_verifie: true,
    date_creation_entreprise: "2019-09-01",
  },
  {
    // Score attendu (2026) : 40 + 28 + 16 = 84 → Très recommandé
    slug: "demo-sophie-bertrand",
    nom_affiche: "Sophie Bertrand",
    nom_societe: "SB Élec Lyon",
    siren: "798452136", // fictif
    bio: presentation(`Électricienne à Lyon depuis 10 ans, installée dans le 3e arrondissement. Je travaille surtout en rénovation d'appartements anciens, où les installations ne sont plus aux normes. Intervention 7 j/7, jours fériés compris.

- Mise aux normes de tableau électrique
- Recherche de panne et remise en service
- Création de points lumineux et de prises
- Installation de borne de recharge`),
    // AVEC adresse complète (indépendante, Très recommandé, joignable)
    adresse: "24 rue Paul Bert",
    metiers: ["electricien"],
    ville_code_insee: "69383",
    ville_nom: "Lyon 3e Arrondissement", // affiché « Lyon (69003) »
    ville_code_postal: "69003",
    latitude: 45.7578,
    longitude: 4.832,
    rayon_intervention_km: 25,
    lien_instagram: "https://www.instagram.com/sophie.elec.demo",
    site_internet: "https://www.bertrand-electricite-demo.fr",
    abonnes_instagram: 12400,
    publications_instagram: 320,
    note_google: 4.9,
    nombre_avis_google: 88,
    dispo_urgence: true,
    dispo_feries: true,
    horaires: {
      lundi: ["07:30-20:00"],
      mardi: ["07:30-20:00"],
      mercredi: ["07:30-20:00"],
      jeudi: ["07:30-20:00"],
      vendredi: ["07:30-20:00"],
      samedi: ["07:30-20:00"],
      dimanche: null,
    },
    telephone: "06 39 98 02 03", // Appeler + WhatsApp (même numéro)
    whatsapp: "06 39 98 02 03",
    siren_verifie: true,
    date_creation_entreprise: "2016-03-01",
  },
  {
    // Score attendu (2026) : 8 + 24 + 2 = 34 → aucun badge de niveau
    // (entreprise toute neuve : l'ancienneté ne rapporte que 2 points)
    slug: "demo-karim-benali",
    nom_affiche: "Karim Benali",
    nom_societe: "Benali Plomberie Services",
    siren: "884569721", // fictif
    date_creation_entreprise: "2026-03-01", // < 1 an → « SIREN vérifié » seul
    bio: presentation(`Plombier à Lyon 7e, je viens de m'installer à mon compte après huit années passées en entreprise. Je me déplace dans tout le sud de Lyon pour les petits travaux et les fuites : robinetterie, siphon, chasse d'eau, remplacement de flexible. Le tarif est annoncé avant l'intervention, jamais de mauvaise surprise à la fin.`),
    metiers: ["plombier"],
    ville_code_insee: "69387",
    ville_nom: "Lyon 7e Arrondissement",
    ville_code_postal: "69007",
    latitude: 45.7578,
    longitude: 4.832,
    rayon_intervention_km: 10,
    lien_instagram: "https://www.instagram.com/karim.plomberie.demo",
    abonnes_instagram: 430,
    publications_instagram: 95,
    note_google: 5.0,
    nombre_avis_google: 23,
    dispo_urgence: false,
    dispo_feries: false,
    horaires: {
      lundi: ["09:00-18:00"],
      mardi: ["09:00-18:00"],
      mercredi: ["09:00-18:00"],
      jeudi: ["09:00-18:00"],
      vendredi: ["09:00-18:00"],
      samedi: null,
      dimanche: null,
    },
    whatsapp: "06 39 98 06 07", // WhatsApp seul (pas de téléphone)
  },
  {
    // Score attendu (2026) : 22 + 16 + 20 = 58 → Recommandé
    // Nom de société volontairement long : teste la troncature « … »
    slug: "demo-peinture-deluca",
    nom_affiche: "Peinture Deluca",
    nom_societe: "Deluca & Fils Peinture et Décoration SARL",
    siren: "452178963", // fictif
    date_creation_entreprise: "2001-06-15", // → « 25 ans d'ancienneté »
    bio: presentation(`Entreprise de peinture à Bron, nous intervenons depuis 20 ans chez les particuliers comme dans les locaux professionnels de l'est lyonnais. Chantier protégé, nettoyé chaque soir, délais annoncés tenus.

- Peinture intérieure murs et plafonds
- Pose de papier peint et de toile de verre
- Enduits de lissage et préparation des supports
- Ravalement de façade et peinture de volets`),
    metiers: ["peintre"],
    ville_code_insee: "69029",
    ville_nom: "Bron",
    ville_code_postal: "69500",
    latitude: 45.7394,
    longitude: 4.9128,
    rayon_intervention_km: 25,
    lien_instagram: "https://www.instagram.com/peinture.deluca.demo",
    abonnes_instagram: 3200,
    publications_instagram: 145,
    note_google: 4.5,
    nombre_avis_google: 41,
    dispo_urgence: false,
    dispo_feries: false,
    horaires: {
      lundi: ["08:00-18:00"],
      mardi: ["08:00-18:00"],
      mercredi: ["08:00-18:00"],
      jeudi: ["08:00-18:00"],
      vendredi: ["08:00-18:00"],
      samedi: ["09:00-13:00"],
      dimanche: null,
    },
    whatsapp: "06 39 98 07 08",
  },
  {
    // Score attendu (2026) : 4 + 4 + 9 = 17 → aucun badge de niveau :
    // carte à bordure grise, sans onglet (seul le badge SIREN s'affiche)
    slug: "demo-luc-ferrand",
    nom_affiche: "Luc Ferrand",
    nom_societe: "Ferrand Sécurité Serrurerie",
    siren: "903124785", // fictif
    date_creation_entreprise: "2023-01-10",
    bio: presentation(`Serrurier à Caluire-et-Cuire depuis 13 ans, j'interviens en urgence sur tout le nord de Lyon. Dans neuf cas sur dix la porte s'ouvre sans être abîmée : je ne perce que si la serrure l'impose, et je vous le dis avant.

- Ouverture de porte claquée ou verrouillée
- Changement de cylindre et de serrure
- Pose de porte blindée et de verrous
- Sécurisation après effraction`),
    metiers: ["serrurier"],
    ville_code_insee: "69034",
    ville_nom: "Caluire-et-Cuire",
    ville_code_postal: "69300",
    latitude: 45.7972,
    longitude: 4.847,
    rayon_intervention_km: 50,
    communes_exclues: ["69259"], // exclut Vénissieux (option avancée §4)
    lien_instagram: "https://www.instagram.com/luc.serrurier.demo",
    abonnes_instagram: 90,
    publications_instagram: 12,
    note_google: 3.6,
    nombre_avis_google: 15,
    dispo_urgence: true,
    dispo_feries: true,
    // ABSENT longuement : SANS badge de niveau, l'onglet gris est
    // seul et la bordure de la carte prend le même gris
    absence_debut: "2026-07-01",
    absence_fin: "2026-09-15",
    horaires: {
      // Ouvert 24h/24, 7 j/7 (nuit et week-end déduits)
      lundi: "24h24",
      mardi: "24h24",
      mercredi: "24h24",
      jeudi: "24h24",
      vendredi: "24h24",
      samedi: "24h24",
      dimanche: "24h24",
    },
    whatsapp: "06 39 98 08 09",
  },
  {
    // Score attendu (2026) : 30 + 29 + 18 = 77 → Très recommandé
    // (18 ans d'ancienneté font passer le seuil des 75 points)
    slug: "demo-chauffage-rhone-sud",
    nom_affiche: "Rhône Sud Plomberie & Chauffage",
    type_compte: "societe",
    nom_responsable: "Marc Ferrero",
    siren: "521489637", // fictif
    date_creation_entreprise: "2008-04-01",
    bio: presentation(`Basés à Givors, nous couvrons le sud de la métropole lyonnaise depuis 22 ans, de Vernaison à Givors en passant par Grigny. Une équipe de quatre compagnons, joignable 24 h/24 pour les fuites et les pannes de chauffage.

- Dépannage de chaudière toutes marques
- Contrat d'entretien annuel
- Installation de pompe à chaleur
- Remplacement de canalisations
- Création de salle de bains clé en main`),
    // DOUBLE COMPÉTENCE nº 2 — SOCIÉTÉ, Très recommandé, SANS adresse
    metiers: DOUBLE_PLOMBIER_CHAUFFAGISTE,
    ville_code_insee: "69091",
    ville_nom: "Givors",
    ville_code_postal: "69700",
    latitude: 45.5906,
    longitude: 4.7699,
    rayon_intervention_km: 50,
    lien_instagram: "https://www.instagram.com/chauffage.rhonesud.demo",
    site_internet: "https://www.chauffage-rhone-sud-demo.fr",
    abonnes_instagram: 5600,
    publications_instagram: 510,
    note_google: 4.6,
    nombre_avis_google: 203,
    dispo_urgence: true,
    dispo_feries: false,
    horaires: {
      lundi: ["08:00-18:00"],
      mardi: ["08:00-18:00"],
      mercredi: ["08:00-18:00"],
      jeudi: ["08:00-18:00"],
      vendredi: ["08:00-18:00"],
      samedi: null,
      dimanche: null,
    },
    whatsapp: "06 39 98 03 04", // WhatsApp seulement (pas d'appel)
  },
  {
    // Score attendu (2026) : 22 + 15 + 9 = 46 → Recommandé
    slug: "demo-elec-presquile",
    nom_affiche: "Élec'Presqu'île",
    nom_societe: "EPI Électricité Générale",
    siren: "812365479", // fictif
    date_creation_entreprise: "2020-09-01",
    bio: presentation(`Élec'Presqu'île intervient sur Écully et l'ouest lyonnais depuis 16 ans. Nous travaillons aussi bien sur du logement neuf que sur de la rénovation lourde, avec un interlocuteur unique du devis à la réception du chantier.

- Installation électrique complète
- Mise en conformité et diagnostic
- Éclairage intérieur et extérieur
- Domotique et interphonie`),
    metiers: ["electricien"],
    ville_code_insee: "69081",
    ville_nom: "Écully",
    ville_code_postal: "69130",
    latitude: 45.7744,
    longitude: 4.7772,
    rayon_intervention_km: 10,
    lien_instagram: "https://www.instagram.com/elec.presquile.demo",
    abonnes_instagram: 8900,
    publications_instagram: 88,
    note_google: 4.2,
    nombre_avis_google: 57,
    dispo_urgence: false,
    dispo_feries: false,
    horaires: {
      lundi: ["08:00-12:30", "13:30-19:00"],
      mardi: ["08:00-12:30", "13:30-19:00"],
      mercredi: ["08:00-12:30", "13:30-19:00"],
      jeudi: ["08:00-12:30", "13:30-19:00"],
      vendredi: ["08:00-12:30", "13:30-19:00"],
      samedi: null,
      dimanche: null,
    },
    whatsapp: "06 39 98 09 10",
    // Données Instagram volontairement anciennes (60 jours) pour voir
    // l'alerte de fraîcheur dans l'admin Instagram
    date_maj_instagram_forcee: new Date(
      Date.now() - 60 * 24 * 3600 * 1000
    ).toISOString(),
  },
  {
    // Score attendu (2026) : 30 + 7 + 5 = 42 → Recommandé
    // (beaucoup d'abonnés mais peu de publications : le croisement
    //  de la grille bride le score Instagram — protection anti-achat)
    slug: "demo-nadia-kaci",
    nom_affiche: "Nadia Kaci",
    nom_societe: "Atelier Kaci Décoration",
    siren: "897456312", // fictif
    date_creation_entreprise: "2024-11-01", // → « 1 an d'ancienneté » (singulier)
    bio: presentation(`Peintre en bâtiment à Vénissieux, je travaille seule depuis cinq ans, essentiellement pour des particuliers de l'est lyonnais. J'aime les chantiers soignés et les finitions nettes : murs, plafonds, boiseries, papier peint. Je me déplace gratuitement pour le devis et je donne une date de fin ferme avant de commencer.`),
    metiers: ["peintre"],
    ville_code_insee: "69259",
    ville_nom: "Vénissieux",
    ville_code_postal: "69200",
    latitude: 45.6978,
    longitude: 4.8867,
    rayon_intervention_km: 25,
    lien_instagram: "https://www.instagram.com/nadia.peinture.demo",
    abonnes_instagram: 15800,
    publications_instagram: 95,
    note_google: 4.1,
    nombre_avis_google: 9,
    telephone: "06 39 98 04 05",
    telephone_visible: false, // numéro renseigné mais masqué (teste la case)
    whatsapp: "06 39 98 04 05", // le contact reste garanti par WhatsApp
    dispo_urgence: false,
    dispo_feries: true,
    horaires: {
      lundi: null,
      mardi: ["10:00-19:00"],
      mercredi: ["10:00-19:00"],
      jeudi: ["10:00-19:00"],
      vendredi: ["10:00-19:00", "20:00-02:00"], // créneau de NUIT (déduit)
      samedi: ["10:00-19:00"],
      dimanche: null,
    },
  },
  {
    // Fiche NON validée : ne doit JAMAIS apparaître dans la recherche.
    // Son SIREN fictif ne passera pas la vérification : la page admin
    // montre le bouton « Valider » verrouillé (règle SIREN obligatoire).
    slug: "demo-thomas-weiss",
    nom_affiche: "Thomas Weiss",
    nom_societe: "Weiss Serrurerie",
    siren: "845632178", // fictif
    date_creation_entreprise: "2018-02-01",
    bio: presentation(`Serrurier dans le 1er arrondissement depuis 11 ans, je connais bien les immeubles anciens de la Croix-Rousse et leurs portes d'époque. Intervention rapide en journée, prix annoncé au téléphone.

- Ouverture de porte sans dégât
- Remplacement de serrure et de cylindre
- Blindage de porte palière
- Reproduction de clés et réglage de gâche`),
    metiers: ["serrurier"],
    ville_code_insee: "69381",
    ville_nom: "Lyon 1er Arrondissement",
    ville_code_postal: "69001",
    latitude: 45.7578,
    longitude: 4.832,
    rayon_intervention_km: 25,
    lien_instagram: "https://www.instagram.com/thomas.serrurier.demo",
    abonnes_instagram: 2500,
    publications_instagram: 160,
    note_google: 4.8,
    nombre_avis_google: 31,
    horaires: {
      lundi: ["08:00-18:00"],
      mardi: ["08:00-18:00"],
      mercredi: ["08:00-18:00"],
      jeudi: ["08:00-18:00"],
      vendredi: ["08:00-18:00"],
      samedi: null,
      dimanche: null,
    },
    whatsapp: "06 39 98 05 06",
    statut_validation: "en_attente",
  },
  {
    // NOUVEAU MÉTIER : Vitrier — indépendant, urgence 24/24 (joignable)
    slug: "demo-theo-vidal",
    nom_affiche: "Théo Vidal",
    type_compte: "independant",
    nom_societe: "Vitrerie Vidal",
    siren: "902113447",
    bio: presentation(`Vitrier à Lyon 5e depuis 9 ans, j'interviens sur le Vieux-Lyon et tout l'ouest de la ville. Vitre cassée le soir ou le week-end : je sécurise l'ouverture le jour même et je repose le verre sous 48 h.

- Remplacement de vitre et de double vitrage
- Miroirs et crédences sur mesure
- Vitrines de commerce
- Dépannage d'urgence après bris`),
    // AVEC adresse complète (indépendant, joignable 24/24)
    adresse: "12 montée du Chemin Neuf",
    metiers: ["vitrier"],
    ville_code_insee: "69385",
    ville_nom: "Lyon 5e Arrondissement",
    ville_code_postal: "69005",
    latitude: 45.7578,
    longitude: 4.82,
    rayon_intervention_km: 30,
    lien_instagram: "https://www.instagram.com/vitrerie.vidal.demo",
    abonnes_instagram: 3200,
    publications_instagram: 140,
    note_google: 4.7,
    nombre_avis_google: 54,
    dispo_urgence: true,
    dispo_feries: true,
    horaires: {
      lundi: "24h24", mardi: "24h24", mercredi: "24h24", jeudi: "24h24",
      vendredi: "24h24", samedi: "24h24", dimanche: "24h24",
    },
    telephone: "06 39 98 11 12",
    whatsapp: "06 39 98 11 12",
    siren_verifie: true,
    date_creation_entreprise: "2016-04-01",
  },
  {
    // NOUVEAU MÉTIER : Menuisier — TYPE SOCIÉTÉ (photo carré arrondi,
    // « Dirigée par … »)
    slug: "demo-atelier-bois",
    nom_affiche: "Atelier Bois & Cie",
    type_compte: "societe",
    nom_responsable: "Léa Fabre",
    siren: "884556210",
    bio: presentation(`Atelier de menuiserie à Villeurbanne, nous fabriquons sur mesure depuis 24 ans dans notre atelier de 300 m² et posons nous-mêmes chez nos clients. Bois massif, panneaux plaqués, agencement complet.

- Meubles et bibliothèques sur mesure
- Dressings et placards intégrés
- Pose de parquet massif et contrecollé
- Portes intérieures et escaliers
- Fenêtres et volets bois`),
    // AVEC adresse complète (SOCIÉTÉ, photo carré arrondi)
    adresse: "3 rue Francis de Pressensé",
    metiers: ["menuisier"],
    ville_code_insee: "69266",
    ville_nom: "Villeurbanne",
    ville_code_postal: "69100",
    latitude: 45.7719,
    longitude: 4.8902,
    rayon_intervention_km: 25,
    lien_instagram: "https://www.instagram.com/atelier.bois.demo",
    site_internet: "https://www.atelier-du-bois-demo.fr",
    abonnes_instagram: 6400,
    publications_instagram: 240,
    note_google: 4.9,
    nombre_avis_google: 73,
    horaires: {
      lundi: ["08:00-12:00", "13:30-17:30"],
      mardi: ["08:00-12:00", "13:30-17:30"],
      mercredi: ["08:00-12:00", "13:30-17:30"],
      jeudi: ["08:00-12:00", "13:30-17:30"],
      vendredi: ["08:00-12:00", "13:30-17:30"],
      samedi: null,
      dimanche: null,
    },
    telephone: "06 39 98 13 14",
    whatsapp: "06 39 98 13 14",
    siren_verifie: true,
    date_creation_entreprise: "2012-06-01",
  },
  {
    // NOUVEAU MÉTIER : Maçon — TYPE SOCIÉTÉ (sans responsable renseigné)
    slug: "demo-macon-rhone",
    nom_affiche: "Maçonnerie du Rhône",
    type_compte: "societe",
    siren: "915002784",
    bio: presentation(`Maçonnerie du Rhône intervient sur Lyon et l'ouest lyonnais depuis 28 ans. Gros œuvre, aménagements extérieurs et ouvertures : nous prenons le chantier en charge de l'étude à la finition, plans et déclaration de travaux compris.

- Murs, murets et clôtures
- Dalles béton et terrasses
- Ouverture de mur porteur avec pose d'IPN
- Extension et surélévation
- Reprise de fissures et rejointoiement`),
    // AVEC adresse complète (SOCIÉTÉ sans responsable renseigné)
    adresse: "78 rue Marietton",
    metiers: ["macon"],
    ville_code_insee: "69389",
    ville_nom: "Lyon 9e Arrondissement",
    ville_code_postal: "69009",
    latitude: 45.78,
    longitude: 4.805,
    rayon_intervention_km: 30,
    lien_instagram: "https://www.instagram.com/maconnerie.rhone.demo",
    site_internet: "https://www.maconnerie-rhone-demo.fr",
    abonnes_instagram: 1100,
    publications_instagram: 60,
    note_google: 4.5,
    nombre_avis_google: 38,
    horaires: {
      lundi: ["07:30-17:00"],
      mardi: ["07:30-17:00"],
      mercredi: ["07:30-17:00"],
      jeudi: ["07:30-17:00"],
      vendredi: ["07:30-17:00"],
      samedi: null,
      dimanche: null,
    },
    telephone: "06 39 98 15 16",
    whatsapp: "06 39 98 15 16",
    siren_verifie: true,
    date_creation_entreprise: "2009-03-01",
  },
];

/* ------------------------------------------------------------
 * DOUZE PLOMBIERS À ÉCULLY — test de la PAGINATION
 * ------------------------------------------------------------
 * Avec Julien Moreau (Villeurbanne, rayon 25 km) et Karim Benali
 * (Lyon 7e, rayon 10 km) qui couvrent Écully, la recherche
 * « Plombier à Écully » dépasse les 10 résultats : elle teste la
 * première page, le bouton « Voir plus » et la liste longue.
 * Notes/abonnés variés pour étaler les scores, horaires variés
 * pour varier les badges de disponibilité.
 * ------------------------------------------------------------ */
const SEMAINE_STANDARD: Record<string, string[] | "24h24" | null> = {
  lundi: ["08:00-18:00"],
  mardi: ["08:00-18:00"],
  mercredi: ["08:00-18:00"],
  jeudi: ["08:00-18:00"],
  vendredi: ["08:00-18:00"],
  samedi: null,
  dimanche: null,
};
const COUPURE_DEJEUNER: Record<string, string[] | "24h24" | null> = {
  lundi: ["08:00-12:00", "14:00-18:30"],
  mardi: ["08:00-12:00", "14:00-18:30"],
  mercredi: ["08:00-12:00", "14:00-18:30"],
  jeudi: ["08:00-12:00", "14:00-18:30"],
  vendredi: ["08:00-12:00", "14:00-18:30"],
  samedi: null,
  dimanche: null,
};
const AVEC_SAMEDI: Record<string, string[] | "24h24" | null> = {
  lundi: ["07:30-19:00"],
  mardi: ["07:30-19:00"],
  mercredi: ["07:30-19:00"],
  jeudi: ["07:30-19:00"],
  vendredi: ["07:30-19:00"],
  samedi: ["09:00-16:00"],
  dimanche: null,
};
// Deux jours en 24h/24 (vendredi et samedi) : pendant ces jours le
// badge devient « Joignable 24/24 » (le reste de la semaine, badge
// classique selon l'heure)
const DEUX_JOURS_24: Record<string, string[] | "24h24" | null> = {
  lundi: ["08:00-12:00", "14:00-18:30"],
  mardi: ["08:00-12:00", "14:00-18:30"],
  mercredi: ["08:00-12:00", "14:00-18:30"],
  jeudi: ["08:00-12:00", "14:00-18:30"],
  vendredi: "24h24",
  samedi: "24h24",
  dimanche: null,
};

function plombiersEcully(): ArtisanDemo[] {
  // « contact » : "deux" (téléphone + WhatsApp), "tel" (téléphone
  // seul) ou "wa" (WhatsApp seul) — les trois cas de la règle de
  // contact minimum. Les absences testent l'abréviation des mois :
  // « 16 sept. » (avec badge Très recommandé), « 1er nov. »,
  // « 1er déc. », et « mai » (court, jamais abrégé).
  const profils = [
    { nom: "Antoine Perret", societe: "Perret Plomberie & Chauffage", note: 4.9, avis: 134, abonnes: 11200, publications: 310, creation: "2008-05-01", urgence: true, feries: true, horaires: AVEC_SAMEDI, contact: "deux", absenceDebut: "2026-08-10", absenceFin: "2026-08-31", double: true, adresse: "8 avenue Édouard Aynard", site: "https://www.perret-plomberie-demo.fr", presentation: `Plombier-chauffagiste à Écully depuis 18 ans, j'interviens sur tout l'ouest lyonnais, d'Écully à Tassin en passant par Champagne-au-Mont-d'Or. Urgences prises en charge le jour même, jours fériés compris.

- Recherche et réparation de fuite
- Dépannage et entretien de chaudière
- Remplacement de chauffe-eau
- Rénovation complète de salle de bains` }, // Très recommandé + « De retour le 1er septembre » (→ « 1er sept. » abrégé)
    { nom: "Léa Fontaine", societe: "Fontaine Sanitaire", note: 4.8, avis: 96, abonnes: 8400, publications: 220, creation: "2014-09-01", urgence: true, feries: false, horaires: DEUX_JOURS_24, contact: "wa", adresse: "15 rue de la République", site: "https://www.fontaine-sanitaire-demo.fr", presentation: `Plombière à Écully depuis 12 ans, je suis joignable 24 h/24 le vendredi et le samedi — c'est là que les fuites tombent le plus souvent. Devis annoncé avant l'intervention, déplacement gratuit dans un rayon de 10 km.

- Dépannage de fuite en urgence
- Débouchage de canalisation
- Remplacement de robinetterie et de WC
- Installation de douche à l'italienne` }, // vendredi + samedi 24h/24 → « Joignable 24/24 »
    { nom: "Marc Dubois", societe: "Dubois Dépannage Eau", note: 4.7, avis: 88, abonnes: 5200, publications: 180, creation: "2011-03-15", urgence: false, feries: false, horaires: SEMAINE_STANDARD, contact: "tel", presentation: `Plombier à Écully depuis 15 ans, je travaille seul et je réponds moi-même au téléphone. Fuites, chasses d'eau, chauffe-eau, siphons bouchés : je m'occupe surtout du dépannage courant chez les particuliers de l'ouest lyonnais, du lundi au vendredi. Vous savez combien ça coûtera avant que je commence.` }, // téléphone SEUL
    { nom: "Chloé Martin", societe: "CM Plomberie Chauffage", note: 4.6, avis: 61, abonnes: 3600, publications: 150, creation: "2017-06-01", urgence: true, feries: true, horaires: AVEC_SAMEDI, contact: "wa", absenceDebut: "2026-10-01", absenceFin: "2026-10-31", presentation: `Plombier-chauffagiste à Écully depuis 9 ans, j'interviens du lundi au samedi sur l'ouest de la métropole. Je pose et j'entretiens le chauffage comme la plomberie, ce qui évite d'appeler deux artisans différents.

- Entretien annuel de chaudière gaz
- Remplacement de radiateurs
- Recherche de fuite non destructive
- Création de salle d'eau` }, // « De retour le 1er novembre »
    { nom: "Hugo Blanc", societe: "Blanc & Fils Plomberie Chauffage", note: 4.5, avis: 47, abonnes: 2900, publications: 130, creation: "2019-01-10", urgence: false, feries: false, horaires: COUPURE_DEJEUNER, contact: "deux", absenceDebut: "2026-08-25", absenceFin: "2026-09-15", double: true, site: "https://www.blanc-et-fils-demo.fr", presentation: `Plombier-chauffagiste à Écully depuis 7 ans, installé avec mon père sous le nom Blanc & Fils. Nous travaillons en binôme, ce qui nous permet de tenir les délais même sur les gros chantiers.

- Rénovation de salle de bains clé en main
- Remplacement de chaudière
- Reprise de plomberie ancienne
- Dépannage de fuite et de canalisation` }, // Recommandé + « De retour le 16 septembre »
    { nom: "Sarah Petit", societe: "SP Interventions", note: 4.7, avis: 39, abonnes: 2100, publications: 90, creation: "2015-11-01", urgence: true, feries: false, horaires: SEMAINE_STANDARD, contact: "wa", absenceDebut: "2026-11-15", absenceFin: "2026-11-30", presentation: `Plombière à Écully depuis 11 ans, je réponds surtout aux urgences : fuite qui coule, chauffe-eau en panne, canalisation bouchée. J'annonce un créneau de deux heures et je le tiens, quitte à décaler le rendez-vous plutôt qu'à vous faire attendre. J'interviens du lundi au vendredi sur Écully, Tassin, Dardilly et Champagne-au-Mont-d'Or.` }, // « De retour le 1er décembre »
    { nom: "Nicolas Garnier", societe: "Garnier Plomberie", note: 4.4, avis: 52, abonnes: 1700, publications: 160, creation: "2005-04-01", urgence: false, feries: false, horaires: AVEC_SAMEDI, contact: "deux", absenceDebut: "2027-04-01", absenceFin: "2027-04-30", presentation: `Plombier à Écully depuis 21 ans, j'ai vu passer la plupart des installations du quartier. Je travaille beaucoup en rénovation d'appartements anciens, où il faut souvent tout reprendre.

- Remplacement complet de tuyauterie
- Pose de compteur et de nourrice
- Installation de chauffe-eau thermodynamique
- Rénovation de salle de bains` }, // « De retour le 1er mai 2027 » (mois court)
    { nom: "Emma Roche", societe: "Roche Éco-Plomberie", note: 4.8, avis: 28, abonnes: 1400, publications: 75, creation: "2021-02-01", urgence: true, feries: true, horaires: COUPURE_DEJEUNER, contact: "wa", presentation: `Plombière à Écully depuis 5 ans, spécialisée dans les installations économes en eau et en énergie. J'interviens sur l'ouest lyonnais, en urgence comme sur rendez-vous, jours fériés compris.

- Chauffe-eau thermodynamique et solaire
- Récupérateur d'eau de pluie
- Robinetterie et mitigeurs thermostatiques
- Recherche de fuite` },
    { nom: "Paul Lemaire", societe: "Lemaire Services", note: 4.2, avis: 33, abonnes: 950, publications: 60, creation: "2018-08-01", urgence: false, feries: false, horaires: SEMAINE_STANDARD, contact: "deux", presentation: `Plombier à Écully depuis 8 ans, je fais du dépannage et de la petite installation chez les particuliers : fuite, robinet, chasse d'eau, évacuation, remplacement de chauffe-eau. Je me déplace dans la journée sur Écully et les communes voisines, et je laisse toujours le chantier propre en partant.` },
    { nom: "Julie Morel", societe: "Morel Plomberie Douce", note: 4.5, avis: 19, abonnes: 640, publications: 45, creation: "2022-05-01", urgence: false, feries: false, horaires: AVEC_SAMEDI, contact: "wa", presentation: `Plombière à Écully depuis 4 ans, je travaille sans sous-traitance : c'est moi qui viens, du devis à la fin du chantier. Disponible le samedi, ce qui arrange souvent mes clients.

- Remplacement de sanitaires
- Débouchage et curage
- Pose de lave-linge et de lave-vaisselle
- Petits travaux de plomberie` },
    { nom: "Thomas Girard", societe: "Girard Dépann'Eau", note: 4.0, avis: 12, abonnes: 380, publications: 28, creation: "2023-10-01", urgence: true, feries: false, horaires: SEMAINE_STANDARD, contact: "deux", presentation: `Plombier à Écully depuis 3 ans, j'interviens en urgence 7 j/7 sur l'ouest lyonnais. Jeune entreprise, tarifs annoncés au téléphone, aucune facturation surprise.

- Dépannage de fuite d'eau
- Débouchage de canalisation
- Remplacement de chauffe-eau
- Réparation de chasse d'eau` },
    { nom: "Inès Bouvier", societe: "Bouvier Rénovation Bain", note: 3.9, avis: 8, abonnes: 210, publications: 15, creation: "2025-03-01", urgence: false, feries: false, horaires: COUPURE_DEJEUNER, contact: "wa", presentation: `Plombière à Écully, je me suis installée à mon compte l'an dernier après six ans en entreprise de rénovation. Je me concentre sur la salle de bains : douche, baignoire, meuble vasque, carrelage et raccordements. Devis détaillé gratuit, et je donne une date de fin ferme avant de commencer.` },
  ] as const;

  return profils.map((profil, indice) => ({
    slug: `demo-plombier-ecully-${indice + 1}`,
    nom_affiche: profil.nom,
    nom_societe: profil.societe,
    siren: String(950000001 + indice), // fictif (9 chiffres)
    bio: presentation(profil.presentation),
    // Métier UNIQUE, ou DOUBLE COMPÉTENCE « Plombier & Chauffagiste »
    metiers:
      "double" in profil && profil.double
        ? DOUBLE_PLOMBIER_CHAUFFAGISTE
        : ["plombier"],
    // Adresse complète seulement pour quelques-uns (les autres n'ont
    // aucune section « Adresse » sur leur fiche)
    adresse: "adresse" in profil ? profil.adresse : null,
    ville_code_insee: "69081",
    ville_nom: "Écully",
    ville_code_postal: "69130",
    // Autour du centre d'Écully : distances légèrement différentes
    latitude: 45.7744 + indice * 0.0008,
    longitude: 4.7772 - indice * 0.0006,
    rayon_intervention_km: 10,
    lien_instagram: `https://www.instagram.com/plomberie.ecully.demo${indice + 1}`,
    // Site internet : seulement quelques-uns (les autres affichent « — »)
    site_internet: "site" in profil ? profil.site : undefined,
    abonnes_instagram: profil.abonnes,
    publications_instagram: profil.publications,
    note_google: profil.note,
    nombre_avis_google: profil.avis,
    dispo_urgence: profil.urgence,
    dispo_feries: profil.feries,
    horaires: profil.horaires as ArtisanDemo["horaires"],
    date_creation_entreprise: profil.creation,
    absence_debut: "absenceDebut" in profil ? profil.absenceDebut : undefined,
    absence_fin: "absenceFin" in profil ? profil.absenceFin : undefined,
    telephone:
      profil.contact !== "wa"
        ? `06 39 98 ${String(40 + indice)} ${String(40 + indice)}`
        : undefined,
    whatsapp:
      profil.contact !== "tel"
        ? `06 39 98 ${String(20 + indice)} ${String(20 + indice)}`
        : undefined,
  }));
}

export async function POST(request: Request) {
  // Outil réservé au développement
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, message: "Outil désactivé sur le site en ligne." },
      { status: 403 }
    );
  }

  let action = "creer";
  try {
    const corps = await request.json();
    if (corps?.action === "supprimer") action = "supprimer";
  } catch {
    // pas de corps : création par défaut
  }

  try {
    const supabase = creerClientSupabaseAdmin();

    // ----- SUPPRESSION : tout ce qui commence par « demo- » -----
    if (action === "supprimer") {
      const { data, error } = await supabase
        .from("artisans")
        .delete()
        .like("slug", "demo-%")
        .select("slug");
      if (error) throw new Error(error.message);
      return NextResponse.json({
        ok: true,
        message: `${data?.length ?? 0} artisan(s) de démonstration supprimé(s).`,
      });
    }

    // ----- CRÉATION (ou mise à jour) ----------------------------
    const resume: Array<Record<string, string | number>> = [];

    for (const demo of [...ARTISANS_DEMO, ...plombiersEcully()]) {
      const { metiers, date_maj_instagram_forcee, ...infos } = demo;

      // Le score et la pastille sortent du vrai calculateur
      const score = calculerScoreTotal(
        demo.abonnes_instagram,
        demo.publications_instagram,
        demo.note_google,
        demo.nombre_avis_google,
        demo.date_creation_entreprise ?? null
      );
      const pastille = determinerPastille(score);

      const { data: enregistre, error } = await supabase
        .from("artisans")
        .upsert(
          {
            ...infos,
            type_compte: demo.type_compte ?? "independant",
            nom_societe: demo.nom_societe ?? null,
            nom_responsable: demo.nom_responsable ?? null,
            // Adresse complète FACULTATIVE : explicitement remise à null
            // pour les artisans sans adresse (réexécutable proprement).
            adresse: demo.adresse ?? null,
            // Site internet FACULTATIF : remis explicitement à null pour
            // les démos qui n'en ont pas (script réexécutable proprement).
            site_internet: demo.site_internet ?? null,
            siren: demo.siren ?? null,
            telephone_visible: demo.telephone_visible ?? true,
            // Fiches validées → SIREN « vérifié » (fictif) pour rester
            // cohérent avec la règle : aucune validation sans SIREN vérifié.
            siren_verifie:
              demo.siren_verifie ??
              (demo.statut_validation ?? "valide") === "valide",
            communes_exclues: demo.communes_exclues ?? [],
            dispo_urgence: demo.dispo_urgence ?? false,
            // Déduites des horaires, comme à l'inscription
            dispo_nuit: travailleNuit(demo.horaires ?? null),
            dispo_weekend: travailleWeekend(demo.horaires ?? null),
            dispo_feries: demo.dispo_feries ?? false,
            absence_debut: demo.absence_debut ?? null,
            absence_fin: demo.absence_fin ?? null,
            statut_validation: demo.statut_validation ?? "valide",
            score_total: score,
            pastille,
            date_maj_instagram:
              date_maj_instagram_forcee ?? new Date().toISOString(),
          },
          { onConflict: "slug" }
        )
        .select("id")
        .single();
      if (error || !enregistre) {
        throw new Error(`${demo.nom_affiche} : ${error?.message ?? "échec"}`);
      }

      // Ses métiers (on repart de zéro pour rester réexécutable)
      await supabase.from("artisan_metiers").delete().eq("artisan_id", enregistre.id);
      const { error: erreurMetiers } = await supabase
        .from("artisan_metiers")
        .insert(metiers.map((metier) => ({ artisan_id: enregistre.id, metier })));
      if (erreurMetiers) {
        throw new Error(`${demo.nom_affiche} (métiers) : ${erreurMetiers.message}`);
      }

      resume.push({
        artisan: demo.nom_affiche,
        score,
        pastille: pastille ?? "aucune",
        statut: demo.statut_validation ?? "valide",
      });
    }

    return NextResponse.json({
      ok: true,
      message: `${resume.length} artisans de démonstration créés ou mis à jour.`,
      artisans: resume,
    });
  } catch (erreur) {
    return NextResponse.json(
      {
        ok: false,
        message: erreur instanceof Error ? erreur.message : String(erreur),
      },
      { status: 500 }
    );
  }
}
