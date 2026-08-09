import {
  modeExpire,
  type MembreEquipe,
  type ModeExerciceFiche,
  type StudioFiche,
} from "@/lib/modes-exercice";
import { fuseauDuLieu, type Plage } from "@/lib/horaires-studio";
import type { PhotoTatoueur } from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * DIX-HUIT TATOUEURS DE DÉMONSTRATION — dont CINQ hors de France
 * ==============================================================
 * ⚠️ AUCUN DE CES TATOUEURS N'EXISTE, et aucune de ces images n'est
 * une vraie photo de tatouage : ce sont des rectangles de couleur
 * portant le nom du style, dessinés par /images-demo/tatouage/….
 * Publier le travail d'un tatoueur sans son accord serait une
 * contrefaçon — la démonstration ne franchit jamais cette ligne.
 *
 * Ces fiches servent à trois choses :
 *  1. voir le produit tourner AVANT d'avoir passé la migration ;
 *  2. vérifier la mise en page (grille, fiche, pages style + ville)
 *     sans dépendre de la base ;
 *  3. vérifier la RECHERCHE MONDIALE — d'où les cinq dernières,
 *     hors de France : chercher « Allemagne », « Bavière »,
 *     « Espagne », « Texas » ou « Canada » doit rendre des cartes,
 *     et pas une page vide.
 *
 * Elles sont les MÊMES que celles insérées par
 * supabase/tatoueurs.sql (et, pour les cinq internationales, par
 * supabase/yokofolio-fiches-internationales.sql) : ce qui s'affiche
 * aujourd'hui sans base s'affichera à l'identique une fois les
 * migrations passées.
 *
 * Les coordonnées GPS sont celles des mairies, arrondies : elles
 * suffisent à une recherche par rayon.
 *
 * UNE PHOTO PAR STYLE (`photos_styles`) : chaque tatoueur a une image
 * pour CHACUN de ses styles. C'est ce qui permet de vérifier tout de
 * suite la règle de yokofolio — cherchez « illustratif », la carte de
 * Camille Fauve montre son illustratif, pas son fine line.
 *
 * TIKTOK : toutes n'en ont pas. C'est volontaire — le bouton TikTok
 * ne doit apparaître QUE lorsque le lien existe, et il faut donc des
 * fiches sans, pour le vérifier.
 *
 * LA BIO : chaque démo en a une, entre 80 et 150 caractères (les
 * bornes de la vraie saisie) — elle se lit désormais JUSTE SOUS le
 * nom de la fiche.
 */
/**
 * LE COMPTE ADMINISTRATEUR DE LA DÉMONSTRATION
 * =============================================
 * La démonstration reproduit la base, règles comprises : elle a donc
 * aussi SON compte d'administrateur, et une fiche qui lui appartient
 * (« Atelier Contrôle », plus bas). Cette fiche est INVISIBLE du
 * public — absente de la mosaïque, de la recherche, du plan du site,
 * et introuvable à son adresse pour un visiteur — exactement comme le
 * seront les fiches d'essai du vrai administrateur.
 * C'est ce qui permet de VOIR la règle à l'œuvre sans base.
 */
export const COMPTE_ADMIN_DEMO = "demo-compte-administrateur";

export const TATOUEURS_DEMO: Tatoueur[] = [
  {
    id: "demo-01",
    nom: "Atelier Corvus",
    slug: "atelier-corvus-lyon-1er",
    ancien_slug: "atelier-corvus",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/blackwork-9.svg",
    adresse: "4 rue des Capucins",
    code_postal: "69001",
    bio: "Atelier de la Croix-Rousse : blackwork dense, géométrie et grands aplats noirs. Dessin sur mesure, encres véganes, devis clair avant la séance.",
    site_web: "https://ateliercorvus.fr",
    // LES DEUX À LA FOIS — le cas que l'ancien champ unique rendait
    // impossible : un vrai site ET une page de liens (migration nº 46).
    // La fiche publique affiche deux lignes : « ateliercorvus.fr »
    // puis « Linktree ».
    page_de_liens: "https://linktr.ee/ateliercorvus",
    region: "Auvergne-Rhône-Alpes",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:69381",
    ville_nom: "Lyon 1er",
    ville_slug: "lyon-1er",
    latitude: 45.7679,
    longitude: 4.8343,
    styles: ["blackwork", "geometrique", "dotwork", "gravure"],
    filtres_technique: ["machine", "handpoke"],
    filtres_composition: ["sleeve"],
    filtres_besoins: ["cover"],
    lien_instagram: "https://www.instagram.com/atelier.corvus.demo/",
    photos_styles: {
      blackwork: "/images-demo/tatouage/blackwork-1.svg",
      geometrique: "/images-demo/tatouage/geometrique-2.svg",
      dotwork: "/images-demo/tatouage/dotwork-3.svg",
      gravure: "/images-demo/tatouage/gravure-4.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@atelier.corvus.demo",
    lien_youtube: "https://www.youtube.com/@atelier.corvus.demo",
    photo_principale: "/images-demo/tatouage/blackwork-1.svg",
    photos: [
      "/images-demo/tatouage/blackwork-2.svg",
      "/images-demo/tatouage/geometrique-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-02",
    nom: "Studio Mille Traits",
    slug: "studio-mille-traits-lyon-6e",
    ancien_slug: "studio-mille-traits",
    type_fiche: "salon",
    etablissement: "prive",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/fine-line-9.svg",
    adresse: "18 cours Franklin-Roosevelt",
    code_postal: "69006",
    bio: "Le trait fin comme signature : pièces délicates, fleurs et minimalisme qui vieillissent bien. On dessine ensemble avant de piquer, sur rendez-vous.",
    site_web: "https://studiomilletraits.fr",
    region: "Auvergne-Rhône-Alpes",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:69386",
    ville_nom: "Lyon 6e",
    ville_slug: "lyon-6e",
    latitude: 45.7714,
    longitude: 4.8497,
    styles: ["fine-line", "minimaliste", "ornemental", "one-line"],
    filtres_technique: ["machine"],
    filtres_composition: ["petit-tatouage", "patchwork"],
    filtres_besoins: ["scar"],
    lien_instagram: "https://www.instagram.com/mille.traits.demo/",
    photos_styles: {
      "fine-line": "/images-demo/tatouage/fine-line-1.svg",
      minimaliste: "/images-demo/tatouage/minimaliste-2.svg",
      ornemental: "/images-demo/tatouage/ornemental-3.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@studio.mille.traits.demo",
    photo_principale: "/images-demo/tatouage/fine-line-1.svg",
    photos: [
      "/images-demo/tatouage/fine-line-2.svg",
      "/images-demo/tatouage/minimaliste-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-03",
    nom: "Nadège Roux",
    slug: "nadege-roux-villeurbanne",
    ancien_slug: "nadege-roux",
    type_fiche: "artiste",
    mode_exercice: "en-salon",
    photo_profil: "/images-demo/tatouage/realisme-9.svg",
    adresse: "27 rue Anatole-France",
    code_postal: "69100",
    bio: "Dix ans de réalisme noir et gris : portraits, animaux, matières. Dessin validé avant la séance, une seule pièce par jour.",
    region: "Auvergne-Rhône-Alpes",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:69266",
    ville_nom: "Villeurbanne",
    ville_slug: "villeurbanne",
    latitude: 45.7719,
    longitude: 4.8902,
    styles: ["realisme", "chicano"],
    filtres_technique: ["machine"],
    filtres_composition: ["sleeve"],
    lien_instagram: "https://www.instagram.com/nadege.roux.demo/",
    photos_styles: {
      realisme: "/images-demo/tatouage/realisme-1.svg",
      chicano: "/images-demo/tatouage/chicano-2.svg",
    },
    lien_tiktok: null,
    photo_principale: "/images-demo/tatouage/realisme-1.svg",
    photos: [
      "/images-demo/tatouage/realisme-2.svg",
      "/images-demo/tatouage/chicano-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-04",
    nom: "Encre & Sel",
    slug: "encre-sel-marseille-1er",
    ancien_slug: "encre-et-sel",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/old-school-9.svg",
    adresse: "9 rue Sainte",
    code_postal: "13001",
    bio: "Tatouage traditionnel à Marseille : lignes franches, couleurs pleines, motifs marins. Flashs au comptoir, projets sur rendez-vous.",
    // PAS DE SITE, UNE PAGE DE LIENS SEULE — le cas de beaucoup de
    // tatoueurs. La fiche doit l'écrire « Beacons », pas
    // « beacons.ai » (voir lib/liens-fiche).
    site_web: null,
    page_de_liens: "https://beacons.ai/encre.et.sel.demo",
    region: "Provence-Alpes-Côte d'Azur",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:13201",
    ville_nom: "Marseille 1er",
    ville_slug: "marseille-1er",
    latitude: 43.2988,
    longitude: 5.3796,
    styles: ["old-school", "neo-traditionnel", "new-school", "acid-trad"],
    filtres_technique: ["machine"],
    filtres_composition: ["patchwork", "petit-tatouage"],
    filtres_besoins: ["cover", "scar"],
    lien_instagram: "https://www.instagram.com/encre.et.sel.demo/",
    photos_styles: {
      "old-school": "/images-demo/tatouage/old-school-1.svg",
      "neo-traditionnel": "/images-demo/tatouage/neo-traditionnel-2.svg",
      "new-school": "/images-demo/tatouage/new-school-3.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@encre.et.sel.demo",
    photo_principale: "/images-demo/tatouage/old-school-1.svg",
    photos: [
      "/images-demo/tatouage/old-school-2.svg",
      "/images-demo/tatouage/neo-traditionnel-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-05",
    nom: "Hokusai Mécanique",
    slug: "hokusai-mecanique-paris-11e",
    ancien_slug: "hokusai-mecanique",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/japonais-9.svg",
    adresse: "31 rue de la Roquette",
    code_postal: "75011",
    bio: "Pièces japonaises amples — dragons, carpes, pivoines — et blackwork architectural. Les grands formats se construisent séance après séance.",
    region: "Île-de-France",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:75111",
    ville_nom: "Paris 11e",
    ville_slug: "paris-11e",
    latitude: 48.8594,
    longitude: 2.3765,
    styles: [
      "japonais",
      "blackwork",
      "tribal",
      "biomecanique",
      "suminagashi",
      "maori",
      "polynesien",
    ],
    filtres_technique: ["machine", "tebori"],
    filtres_composition: ["sleeve", "bodysuit"],
    lien_instagram: "https://www.instagram.com/hokusai.mecanique.demo/",
    photos_styles: {
      japonais: "/images-demo/tatouage/japonais-1.svg",
      blackwork: "/images-demo/tatouage/blackwork-2.svg",
      tribal: "/images-demo/tatouage/tribal-3.svg",
      biomecanique: "/images-demo/tatouage/biomecanique-4.svg",
    },
    lien_tiktok: null,
    photo_principale: "/images-demo/tatouage/japonais-1.svg",
    photos: [
      "/images-demo/tatouage/japonais-2.svg",
      "/images-demo/tatouage/blackwork-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-06",
    nom: "Camille Fauve",
    slug: "camille-fauve-paris-18e",
    ancien_slug: "camille-fauve",
    type_fiche: "artiste",
    mode_exercice: "sur-zone",
    rayon_zone_km: 25,
    photo_profil: "/images-demo/tatouage/illustratif-9.svg",
    adresse: null,
    code_postal: null,
    bio: "Des fleurs, presque uniquement : bouquets et herbiers au trait fin, ombrages doux. Réponse en quelques jours, croquis à l'appui.",
    region: "Île-de-France",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:75118",
    ville_nom: "Paris 18e",
    ville_slug: "paris-18e",
    latitude: 48.8925,
    longitude: 2.3444,
    styles: ["illustratif", "fine-line", "aquarelle"],
    filtres_technique: ["handpoke", "machine"],
    filtres_composition: ["petit-tatouage"],
    filtres_besoins: ["cover"],
    lien_instagram: "https://www.instagram.com/camille.fauve.demo/",
    photos_styles: {
      illustratif: "/images-demo/tatouage/illustratif-1.svg",
      "fine-line": "/images-demo/tatouage/fine-line-2.svg",
      aquarelle: "/images-demo/tatouage/aquarelle-3.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@camille.fauve.demo",
    lien_youtube: "https://www.youtube.com/@camille.fauve.demo",
    photo_principale: "/images-demo/tatouage/illustratif-1.svg",
    photos: [
      "/images-demo/tatouage/illustratif-2.svg",
      "/images-demo/tatouage/fine-line-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-07",
    nom: "Typo Sauvage",
    slug: "typo-sauvage-bordeaux",
    ancien_slug: "typo-sauvage",
    type_fiche: "artiste",
    mode_exercice: "itinerant",
    villes: [
      {
        intitule: "Bordeaux",
        ville: "Bordeaux",
        region: "Nouvelle-Aquitaine",
        pays: "France",
        code_pays: "FR",
        latitude: 44.8378,
        longitude: -0.5792,
        lieu_id: "demo:33063",
      },
      {
        intitule: "Toulouse",
        ville: "Toulouse",
        region: "Occitanie",
        pays: "France",
        code_pays: "FR",
        latitude: 43.6045,
        longitude: 1.4442,
        lieu_id: "demo:31555",
      },
      {
        intitule: "Nantes",
        ville: "Nantes",
        region: "Pays de la Loire",
        pays: "France",
        code_pays: "FR",
        latitude: 47.2184,
        longitude: -1.5536,
        lieu_id: "demo:44109",
      },
    ],
    photo_profil: "/images-demo/tatouage/lettering-9.svg",
    adresse: null,
    code_postal: null,
    bio: "Le lettrage comme un métier : calligraphie, gothiques et scripts posés après une vraie étude typographique. On choisit ensemble, lettre par lettre.",
    region: "Nouvelle-Aquitaine",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:33063",
    ville_nom: "Bordeaux",
    ville_slug: "bordeaux",
    latitude: 44.8378,
    longitude: -0.5792,
    styles: ["lettering", "chicano"],
    filtres_technique: ["machine"],
    filtres_composition: ["petit-tatouage", "patchwork"],
    filtres_besoins: ["scar"],
    lien_instagram: "https://www.instagram.com/typo.sauvage.demo/",
    photos_styles: {
      lettering: "/images-demo/tatouage/lettering-1.svg",
      chicano: "/images-demo/tatouage/chicano-2.svg",
    },
    lien_tiktok: null,
    photo_principale: "/images-demo/tatouage/lettering-1.svg",
    photos: [
      "/images-demo/tatouage/lettering-2.svg",
      "/images-demo/tatouage/chicano-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-08",
    nom: "Ligne Claire Studio",
    slug: "ligne-claire-studio-nantes",
    ancien_slug: "ligne-claire-studio",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/geometrique-9.svg",
    adresse: "22 rue Crébillon",
    code_postal: "44000",
    bio: "Géométrie, symétries et minimalisme tirés au cordeau, ajustés au millimètre sur ta morphologie. Studio calme en plein centre de Nantes.",
    region: "Pays de la Loire",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:44109",
    ville_nom: "Nantes",
    ville_slug: "nantes",
    latitude: 47.2184,
    longitude: -1.5536,
    styles: [
      "geometrique",
      "minimaliste",
      "abstrait",
      "cyber-tribal",
      "chrome",
      "cyber-sigilism",
    ],
    filtres_technique: ["machine", "handpoke"],
    filtres_composition: ["petit-tatouage"],
    lien_instagram: "https://www.instagram.com/ligne.claire.demo/",
    photos_styles: {
      geometrique: "/images-demo/tatouage/geometrique-1.svg",
      minimaliste: "/images-demo/tatouage/minimaliste-2.svg",
      abstrait: "/images-demo/tatouage/abstrait-3.svg",
      "cyber-tribal": "/images-demo/tatouage/cyber-tribal-4.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@ligne.claire.studio.demo",
    photo_principale: "/images-demo/tatouage/geometrique-1.svg",
    photos: [
      "/images-demo/tatouage/geometrique-2.svg",
      "/images-demo/tatouage/minimaliste-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-09",
    nom: "Ombre Portée",
    slug: "ombre-portee-toulouse",
    ancien_slug: "ombre-portee",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/realisme-9.svg",
    adresse: "11 rue des Filatiers",
    code_postal: "31000",
    bio: "Réalisme noir et gris, contrastes marqués, blackwork massif. Apporte ton idée, je m'occupe de la lumière. Réponse rapide par Instagram.",
    region: "Occitanie",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:31555",
    ville_nom: "Toulouse",
    ville_slug: "toulouse",
    latitude: 43.6045,
    longitude: 1.4442,
    styles: ["realisme", "blackwork", "dotwork", "trash-polka", "bio-mecha"],
    filtres_technique: ["machine"],
    filtres_composition: ["sleeve"],
    filtres_besoins: ["cover"],
    lien_instagram: "https://www.instagram.com/ombre.portee.demo/",
    photos_styles: {
      realisme: "/images-demo/tatouage/realisme-1.svg",
      blackwork: "/images-demo/tatouage/blackwork-2.svg",
      dotwork: "/images-demo/tatouage/dotwork-3.svg",
      "trash-polka": "/images-demo/tatouage/trash-polka-4.svg",
    },
    lien_tiktok: null,
    photo_principale: "/images-demo/tatouage/realisme-1.svg",
    photos: [
      "/images-demo/tatouage/realisme-2.svg",
      "/images-demo/tatouage/blackwork-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-10",
    nom: "Maison Vermillon",
    slug: "maison-vermillon-lille",
    ancien_slug: "maison-vermillon",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/neo-traditionnel-9.svg",
    adresse: "35 rue de Béthune",
    code_postal: "59000",
    bio: "Couleurs riches et contours francs : le néo-traditionnel est notre langue maternelle. Dessin validé ensemble, retouche offerte.",
    site_web: "https://maisonvermillon.fr",
    region: "Hauts-de-France",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:59350",
    ville_nom: "Lille",
    ville_slug: "lille",
    latitude: 50.6292,
    longitude: 3.0573,
    styles: ["neo-traditionnel", "new-school", "aquarelle"],
    filtres_technique: ["machine"],
    filtres_composition: ["patchwork", "sleeve"],
    filtres_besoins: ["cover", "scar"],
    lien_instagram: "https://www.instagram.com/maison.vermillon.demo/",
    photos_styles: {
      "neo-traditionnel": "/images-demo/tatouage/neo-traditionnel-1.svg",
      "new-school": "/images-demo/tatouage/new-school-2.svg",
      aquarelle: "/images-demo/tatouage/aquarelle-3.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@maison.vermillon.demo",
    photo_principale: "/images-demo/tatouage/neo-traditionnel-1.svg",
    photos: [
      "/images-demo/tatouage/neo-traditionnel-2.svg",
      "/images-demo/tatouage/new-school-2.svg",
    ],
    publie: true,
  },
  {
    id: "demo-11",
    nom: "Kōsei Tattoo",
    slug: "kosei-tattoo-lyon-2e",
    ancien_slug: "kosei-tattoo",
    type_fiche: "artiste",
    mode_exercice: "en-salon",
    photo_profil: "/images-demo/tatouage/japonais-9.svg",
    adresse: "2 rue Mercière",
    code_postal: "69002",
    bio: "L'irezumi, patiemment : manches, dos complets et motifs traditionnels étudiés à la source. Les grandes pièces se réservent des mois à l'avance.",
    region: "Auvergne-Rhône-Alpes",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:69382",
    ville_nom: "Lyon 2e",
    ville_slug: "lyon-2e",
    latitude: 45.7485,
    longitude: 4.8272,
    styles: ["japonais"],
    filtres_technique: ["tebori"],
    filtres_composition: ["sleeve", "bodysuit"],
    lien_instagram: "https://www.instagram.com/kosei.tattoo.demo/",
    photos_styles: {
      japonais: "/images-demo/tatouage/japonais-1.svg",
    },
    lien_tiktok: null,
    photo_principale: "/images-demo/tatouage/japonais-1.svg",
    photos: ["/images-demo/tatouage/japonais-2.svg"],
    publie: true,
  },
  {
    id: "demo-12",
    nom: "Trait Nord",
    slug: "trait-nord-strasbourg",
    ancien_slug: "trait-nord",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/minimaliste-9.svg",
    adresse: "17 rue des Frères",
    code_postal: "67000",
    bio: "Des formes simples qui tiennent leurs promesses : géométrie, points et lignes fines. Un studio pensé pour les premiers tatouages, à Strasbourg.",
    region: "Grand Est",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:67482",
    ville_nom: "Strasbourg",
    ville_slug: "strasbourg",
    latitude: 48.5734,
    longitude: 7.7521,
    styles: [
      "minimaliste",
      "geometrique",
      "dotwork",
      "ignorant-style",
      "nordique",
    ],
    filtres_technique: ["handpoke", "machine"],
    filtres_composition: ["petit-tatouage"],
    filtres_besoins: ["scar"],
    lien_instagram: "https://www.instagram.com/trait.nord.demo/",
    photos_styles: {
      minimaliste: "/images-demo/tatouage/minimaliste-1.svg",
      geometrique: "/images-demo/tatouage/geometrique-2.svg",
      dotwork: "/images-demo/tatouage/dotwork-3.svg",
      "ignorant-style": "/images-demo/tatouage/ignorant-style-4.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@trait.nord.demo",
    photo_principale: "/images-demo/tatouage/minimaliste-1.svg",
    photos: [
      "/images-demo/tatouage/geometrique-2.svg",
      "/images-demo/tatouage/minimaliste-2.svg",
    ],
    publie: true,
  },
  {
    // LE TATOUEUR « TOUS STYLES » : il vérifie qu'aucune limite ne
    // subsiste — dix-huit styles, et une photo pour CHACUN.
    id: "demo-13",
    nom: "Studio Caméléon",
    slug: "studio-cameleon-bordeaux",
    ancien_slug: "studio-cameleon",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/realisme-9.svg",
    adresse: "40 quai des Chartrons",
    code_postal: "33000",
    bio: "Un studio qui change de peau : dix-huit styles pratiqués sérieusement, une photo à l'appui pour chacun. Dis-nous ton univers, on te guide.",
    site_web: "https://studiocameleon.fr",
    region: "Nouvelle-Aquitaine",
    pays: "France",
    code_pays: "FR",
    lieu_id: "demo:33063",
    ville_nom: "Bordeaux",
    ville_slug: "bordeaux",
    latitude: 44.8496,
    longitude: -0.5722,
    styles: [
      "realisme",
      "japonais",
      "old-school",
      "blackwork",
      "illustratif",
      "fine-line",
      "geometrique",
      "anime-manga",
      "trash-polka",
      "biomecanique",
      "ignorant-style",
      "cyber-tribal",
      "acid-trad",
      "chrome",
      "one-line",
      "pa-tutiki",
      "sicanje",
      "yoruba",
    ],
    filtres_technique: ["machine"],
    filtres_composition: ["sleeve", "patchwork"],
    filtres_besoins: ["cover"],
    lien_instagram: "https://www.instagram.com/studio.cameleon.demo/",
    photos_styles: {
      realisme: "/images-demo/tatouage/realisme-1.svg",
      japonais: "/images-demo/tatouage/japonais-2.svg",
      "old-school": "/images-demo/tatouage/old-school-3.svg",
      blackwork: "/images-demo/tatouage/blackwork-4.svg",
      illustratif: "/images-demo/tatouage/illustratif-5.svg",
      "fine-line": "/images-demo/tatouage/fine-line-6.svg",
      geometrique: "/images-demo/tatouage/geometrique-7.svg",
      "anime-manga": "/images-demo/tatouage/anime-manga-8.svg",
      "trash-polka": "/images-demo/tatouage/trash-polka-9.svg",
      biomecanique: "/images-demo/tatouage/biomecanique-10.svg",
      "ignorant-style": "/images-demo/tatouage/ignorant-style-11.svg",
      "cyber-tribal": "/images-demo/tatouage/cyber-tribal-12.svg",
      "acid-trad": "/images-demo/tatouage/acid-trad-13.svg",
      chrome: "/images-demo/tatouage/chrome-14.svg",
      "one-line": "/images-demo/tatouage/one-line-15.svg",
      "pa-tutiki": "/images-demo/tatouage/pa-tutiki-16.svg",
      sicanje: "/images-demo/tatouage/sicanje-17.svg",
      yoruba: "/images-demo/tatouage/yoruba-18.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@studio.cameleon.demo",
    photo_principale: "/images-demo/tatouage/realisme-1.svg",
    photos: [
      "/images-demo/tatouage/realisme-2.svg",
      "/images-demo/tatouage/japonais-2.svg",
    ],
    publie: true,
  },

  /* ================================================================
   * CINQ FICHES HORS DE FRANCE — la démonstration de la recherche
   * MONDIALE. Sans elles, chercher « Allemagne » ou « Texas » ne
   * renvoie rien, non par bug mais faute de fiche : impossible de
   * vérifier que le mode « pays » et le mode « région » marchent.
   * Elles couvrent exactement les exemples attendus :
   *   Allemagne (Berlin + Bavière), Espagne, Texas, Canada.
   * Leur région et leur pays sont écrits comme le géocodeur les rend
   * en français — c'est ce qui est comparé lors d'une recherche.
   * ================================================================ */
  {
    id: "demo-14",
    nom: "Kreuzberg Nadel",
    slug: "kreuzberg-nadel-berlin",
    ancien_slug: "kreuzberg-nadel",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/blackwork-9.svg",
    adresse: "12 Oranienstraße",
    code_postal: "10999",
    bio: "Studio de Kreuzberg : blackwork épais, trames et lettrages. On dessine avec toi, on pique proprement, on t'explique tout avant.",
    site_web: "https://kreuzberg-nadel.de",
    region: "Berlin",
    pays: "Allemagne",
    code_pays: "DE",
    lieu_id: "demo:berlin",
    ville_nom: "Berlin",
    ville_slug: "berlin",
    latitude: 52.5163,
    longitude: 13.4225,
    styles: ["blackwork", "lettering", "ignorant-style", "copte"],
    filtres_technique: ["machine", "handpoke"],
    filtres_composition: ["petit-tatouage"],
    lien_instagram: "https://www.instagram.com/kreuzberg.nadel.demo/",
    photos_styles: {
      blackwork: "/images-demo/tatouage/blackwork-1.svg",
      lettering: "/images-demo/tatouage/lettering-2.svg",
      "ignorant-style": "/images-demo/tatouage/ignorant-style-3.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@kreuzberg.nadel.demo",
    photo_principale: "/images-demo/tatouage/blackwork-1.svg",
    photos: ["/images-demo/tatouage/lettering-2.svg"],
    publie: true,
  },
  {
    id: "demo-15",
    nom: "Isar Studio",
    slug: "isar-studio-munich",
    ancien_slug: "isar-studio",
    type_fiche: "artiste",
    mode_exercice: "sur-zone",
    rayon_zone_km: 50,
    photo_profil: "/images-demo/tatouage/fine-line-9.svg",
    adresse: null,
    code_postal: null,
    bio: "Trait fin et motifs ornementaux en plein cœur de Munich. Rendez-vous calmes, projets sur mesure, et un dessin validé ensemble avant la séance.",
    region: "Bavière",
    pays: "Allemagne",
    code_pays: "DE",
    lieu_id: "demo:munich",
    ville_nom: "Munich",
    ville_slug: "munich",
    latitude: 48.1351,
    longitude: 11.582,
    styles: ["fine-line", "ornemental", "minimaliste"],
    filtres_technique: ["machine"],
    filtres_composition: ["petit-tatouage"],
    filtres_besoins: ["cover"],
    lien_instagram: "https://www.instagram.com/isar.studio.demo/",
    photos_styles: {
      "fine-line": "/images-demo/tatouage/fine-line-1.svg",
      ornemental: "/images-demo/tatouage/ornemental-2.svg",
      minimaliste: "/images-demo/tatouage/minimaliste-3.svg",
    },
    lien_tiktok: null,
    photo_principale: "/images-demo/tatouage/fine-line-1.svg",
    photos: ["/images-demo/tatouage/ornemental-2.svg"],
    publie: true,
  },
  {
    id: "demo-16",
    nom: "Tinta Gòtica",
    slug: "tinta-gotica-barcelone",
    ancien_slug: "tinta-gotica",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/neo-traditionnel-9.svg",
    adresse: "24 Carrer de Verdi",
    code_postal: "08012",
    bio: "Atelier de Gràcia : néo-traditionnel coloré et vieille école. On parle français, catalan et espagnol — viens avec ton idée, on la dessine.",
    site_web: "https://tintagotica.es",
    region: "Catalogne",
    pays: "Espagne",
    code_pays: "ES",
    lieu_id: "demo:barcelone",
    ville_nom: "Barcelone",
    ville_slug: "barcelone",
    latitude: 41.4036,
    longitude: 2.1568,
    styles: ["neo-traditionnel", "old-school", "illustratif", "berbere"],
    filtres_technique: ["machine"],
    filtres_composition: ["sleeve", "patchwork"],
    filtres_besoins: ["scar"],
    lien_instagram: "https://www.instagram.com/tinta.gotica.demo/",
    photos_styles: {
      "neo-traditionnel": "/images-demo/tatouage/neo-traditionnel-1.svg",
      "old-school": "/images-demo/tatouage/old-school-2.svg",
      illustratif: "/images-demo/tatouage/illustratif-3.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@tinta.gotica.demo",
    photo_principale: "/images-demo/tatouage/neo-traditionnel-1.svg",
    photos: ["/images-demo/tatouage/old-school-2.svg"],
    publie: true,
  },
  {
    id: "demo-17",
    nom: "Lone Star Ink",
    slug: "lone-star-ink-austin",
    ancien_slug: "lone-star-ink",
    type_fiche: "salon",
    etablissement: "salon",
    mode_exercice: "adresse",
    photo_profil: "/images-demo/tatouage/realisme-9.svg",
    adresse: "1104 South Congress Avenue",
    code_postal: "78704",
    bio: "Réalisme noir et gris et grandes pièces, sur South Congress. Séances longues, devis clair, et un dessin retravaillé jusqu'à ce qu'il te plaise.",
    region: "Texas",
    pays: "États-Unis",
    code_pays: "US",
    lieu_id: "demo:austin",
    ville_nom: "Austin",
    ville_slug: "austin",
    latitude: 30.2504,
    longitude: -97.7492,
    styles: ["realisme", "blackwork", "trash-polka"],
    filtres_technique: ["machine"],
    filtres_composition: ["sleeve"],
    lien_instagram: "https://www.instagram.com/lone.star.ink.demo/",
    photos_styles: {
      realisme: "/images-demo/tatouage/realisme-1.svg",
      blackwork: "/images-demo/tatouage/blackwork-2.svg",
      "trash-polka": "/images-demo/tatouage/trash-polka-3.svg",
    },
    lien_tiktok: "https://www.tiktok.com/@lone.star.ink.demo",
    photo_principale: "/images-demo/tatouage/realisme-1.svg",
    photos: ["/images-demo/tatouage/trash-polka-3.svg"],
    publie: true,
  },
  {
    id: "demo-18",
    nom: "Atelier Boréal",
    slug: "atelier-boreal-montreal",
    ancien_slug: "atelier-boreal",
    type_fiche: "artiste",
    mode_exercice: "itinerant",
    villes: [
      {
        intitule: "Montréal",
        ville: "Montréal",
        region: "Québec",
        pays: "Canada",
        code_pays: "CA",
        latitude: 45.5254,
        longitude: -73.5955,
        lieu_id: "demo:montreal",
      },
      {
        intitule: "Québec",
        ville: "Québec",
        region: "Québec",
        pays: "Canada",
        code_pays: "CA",
        latitude: 46.8139,
        longitude: -71.208,
        lieu_id: "demo:quebec",
      },
    ],
    photo_profil: "/images-demo/tatouage/geometrique-9.svg",
    adresse: null,
    code_postal: null,
    bio: "Sur le Plateau, entre géométrie et dotwork. On travaille au rendez-vous, on prend le temps du dessin, et on répond en français.",
    site_web: "https://atelierboreal.ca",
    region: "Québec",
    pays: "Canada",
    code_pays: "CA",
    lieu_id: "demo:montreal",
    ville_nom: "Montréal",
    ville_slug: "montreal",
    latitude: 45.5254,
    longitude: -73.5955,
    styles: ["geometrique", "dotwork", "fine-line", "celtique"],
    filtres_technique: ["handpoke", "machine"],
    filtres_composition: ["petit-tatouage", "sleeve"],
    filtres_besoins: ["cover"],
    lien_instagram: "https://www.instagram.com/atelier.boreal.demo/",
    photos_styles: {
      geometrique: "/images-demo/tatouage/geometrique-1.svg",
      dotwork: "/images-demo/tatouage/dotwork-2.svg",
      "fine-line": "/images-demo/tatouage/fine-line-3.svg",
    },
    lien_tiktok: null,
    photo_principale: "/images-demo/tatouage/geometrique-1.svg",
    photos: ["/images-demo/tatouage/dotwork-2.svg"],
    publie: true,
  },
];

/* ================================================================
 * LE NOUVEAU MODÈLE APPLIQUÉ AUX DÉMONSTRATIONS
 * ================================================================
 * ⚠️ ELLES N'AVAIENT JAMAIS ÉTÉ CONVERTIES. La migration nº 21 avait
 * basculé TOUTES les fiches en « salon » à une adresse — c'était le
 * choix le plus prudent à l'époque, mais il a laissé la démonstration
 * sans un seul artiste, sans une seule équipe, sans une seule session
 * guest. On ne pouvait donc RIEN vérifier de ce qui a été construit
 * depuis : ni les modes d'exercice, ni les rattachements, ni
 * l'expiration automatique.
 *
 * CE QUI SUIT LES REBÂTIT, cas par cas, et de façon DÉDUITE plutôt
 * que recopiée :
 *  · le STUDIO PRINCIPAL d'un salon vient de la fiche elle-même — son
 *    adresse EST celle du studio, il n'y a rien à ressaisir ;
 *  · un mode « lié » va CHERCHER le salon dans cette même liste : son
 *    nom, son logo et son adresse ne peuvent pas diverger ;
 *  · L'ÉQUIPE D'UN SALON N'EST PAS ÉCRITE À LA MAIN. Elle se déduit
 *    des modes des artistes, exactement comme la vue `equipe_salon`
 *    la déduit des liaisons validées — expiration comprise. Une
 *    équipe recopiée aurait fini par mentir.
 *
 * LE SENS DE LA DEMANDE (artiste → salon, ou salon → artiste) ne se
 * voit pas ici : la vue publique ne le porte pas, et c'est normal —
 * un rattachement validé est un rattachement, d'où qu'il vienne. Il
 * est en revanche bien posé dans la migration nº 30, où Camille Fauve
 * est rattachée à Hokusai Mécanique par une liaison d'origine
 * « salon ».
 * ================================================================ */

type LieuDemo = {
  intitule: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string;
  latitude: number;
  longitude: number;
};

type ModeDemo = {
  genre: "salon" | "guest" | "domicile" | "prive";
  /** EN STUDIO : fondateur ou résident (migration nº 33). */
  role?: "fondateur" | "resident";
  /** Le slug du studio inscrit auquel ce mode est rattaché. */
  salon?: string;
  /** Sinon, l'adresse saisie à la main. */
  lieu?: LieuDemo;
  debut_le?: string;
  fin_le?: string;
};

type ExerciceDemo = {
  type: "artiste" | "salon";
  /** Les studios EN PLUS du principal (qui vient de la fiche). */
  studiosEnPlus?: LieuDemo[];
  modes?: ModeDemo[];
};

/** AUJOURD'HUI dans les démonstrations : les dates ci-dessous sont
    posées en dur, donc lisibles — « en cours » et « terminée » se
    voient d'un coup d'œil dans ce tableau. */
const EXERCICE_DEMO: Record<string, ExerciceDemo> = {
  /* ---------- LES SALONS ---------- */
  // MULTI-ADRESSES + ÉQUIPE (résidents ET guest) : le cas le plus
  // complet, celui qu'on veut pouvoir montrer.
  "atelier-corvus-lyon-1er": {
    type: "salon",
    studiosEnPlus: [
      {
        intitule: "18 cours Gambetta, 69007 Lyon",
        adresse: "18 cours Gambetta",
        code_postal: "69007",
        ville: "Lyon 7e",
        latitude: 45.7508,
        longitude: 4.8442,
      },
    ],
  },
  // ÉQUIPE VENUE DU SENS SALON → ARTISTE (voir migration nº 30).
  "hokusai-mecanique-paris-11e": { type: "salon" },
  // LES SALONS À UNE SEULE ADRESSE, sans équipe.
  "studio-mille-traits-lyon-6e": { type: "salon" },
  "encre-sel-marseille-1er": { type: "salon" },
  "ligne-claire-studio-nantes": { type: "salon" },
  "ombre-portee-toulouse": { type: "salon" },
  "maison-vermillon-lille": { type: "salon" },
  "kreuzberg-nadel-berlin": { type: "salon" },
  "isar-studio-munich": { type: "salon" },
  "tinta-gotica-barcelone": { type: "salon" },
  "lone-star-ink-austin": { type: "salon" },
  "atelier-boreal-montreal": { type: "salon" },

  /* ---------- LES ARTISTES ---------- */
  // EN SALON, LIÉ à un salon inscrit → résidente de son équipe.
  "nadege-roux-villeurbanne": {
    type: "artiste",
    modes: [{ genre: "salon", salon: "atelier-corvus-lyon-1er" }],
  },
  // EN SALON, LIÉ — et c'est LE SALON qui l'a invitée (nº 30).
  "camille-fauve-paris-18e": {
    type: "artiste",
    modes: [{ genre: "salon", salon: "hokusai-mecanique-paris-11e" }],
  },
  // EN SALON, ADRESSE MANUELLE : aucune fiche liée, et c'est un cas
  // parfaitement normal — tous les studios ne sont pas inscrits.
  "typo-sauvage-bordeaux": {
    type: "artiste",
    modes: [
      {
        genre: "salon",
        lieu: {
          intitule: "31 rue Sainte-Catherine, 33000 Bordeaux",
          adresse: "31 rue Sainte-Catherine",
          code_postal: "33000",
          ville: "Bordeaux",
          latitude: 44.8378,
          longitude: -0.5792,
        },
      },
    ],
  },
  // DEUX SESSIONS GUEST : une EN COURS chez un salon inscrit (elle
  // le fait apparaître dans l'équipe de Corvus, au rang « Guest »),
  // une À VENIR à une adresse saisie.
  "kosei-tattoo-lyon-2e": {
    type: "artiste",
    modes: [
      {
        genre: "guest",
        salon: "atelier-corvus-lyon-1er",
        debut_le: "2026-07-20",
        fin_le: "2026-08-31",
      },
      {
        genre: "guest",
        lieu: {
          intitule: "9 rue Notre-Dame, 33000 Bordeaux",
          adresse: "9 rue Notre-Dame",
          code_postal: "33000",
          ville: "Bordeaux",
          latitude: 44.8506,
          longitude: -0.5714,
        },
        debut_le: "2026-09-10",
        fin_le: "2026-09-20",
      },
    ],
  },
  // CUMUL : une session guest TERMINÉE (elle ne s'affiche plus, et
  // c'est la preuve de l'expiration automatique) + un secteur à
  // domicile, qui, lui, ne périme jamais.
  "trait-nord-strasbourg": {
    type: "artiste",
    modes: [
      {
        genre: "guest",
        lieu: {
          intitule: "12 quai des Bateliers, 67000 Strasbourg",
          adresse: "12 quai des Bateliers",
          code_postal: "67000",
          ville: "Strasbourg",
          latitude: 48.5806,
          longitude: 7.7529,
        },
        debut_le: "2026-05-01",
        fin_le: "2026-05-15",
      },
      {
        genre: "domicile",
        lieu: {
          intitule: "Strasbourg",
          adresse: null,
          code_postal: "67000",
          ville: "Strasbourg",
          latitude: 48.5734,
          longitude: 7.7521,
        },
      },
      {
        // LE QUATRIÈME MODE, pour que « En studio privé » ait de quoi
        // répondre hors ligne comme en base (migration nº 38).
        genre: "prive",
        lieu: {
          intitule: "Strasbourg",
          adresse: null,
          code_postal: "67000",
          ville: "Strasbourg",
          latitude: 48.5734,
          longitude: 7.7521,
        },
      },
    ],
  },
  // TROIS MODES D'UN COUP : studio fixe à la main, guest LIÉ mais
  // TERMINÉ, et secteur à domicile.
  "studio-cameleon-bordeaux": {
    type: "artiste",
    modes: [
      {
        genre: "salon",
        lieu: {
          intitule: "5 place Fernand-Lafargue, 33000 Bordeaux",
          adresse: "5 place Fernand-Lafargue",
          code_postal: "33000",
          ville: "Bordeaux",
          latitude: 44.8383,
          longitude: -0.5707,
        },
      },
      {
        genre: "guest",
        salon: "ligne-claire-studio-nantes",
        debut_le: "2026-03-02",
        fin_le: "2026-03-12",
      },
      {
        genre: "domicile",
        lieu: {
          intitule: "Bordeaux",
          adresse: null,
          code_postal: "33000",
          ville: "Bordeaux",
          latitude: 44.8496,
          longitude: -0.5722,
        },
      },
    ],
  },
};

/**
 * LES HORAIRES DE DÉMONSTRATION — une semaine plausible de studio :
 * fermé dimanche et lundi, 11 h – 19 h du mardi au vendredi, et la
 * coupure du midi le samedi. De quoi voir les quatre états de
 * l'accordéon (« Ouvert », « Ouvre à », « Ouvre demain », « Ouvre
 * mardi ») sans toucher à la base.
 */
/** LES STUDIOS DE DÉMONSTRATION QUI N'ONT RIEN RENSEIGNÉ — il en faut
    au moins un : c'est le seul moyen de voir qu'une fiche sans
    horaires n'affiche NI accordéon, NI trait de séparation orphelin. */
const SANS_HORAIRES = new Set(["ligne-claire-studio-nantes"]);

const HORAIRES_DEMO: Plage[][] = [
  [],                                                        // lundi
  [{ debut: "11:00", fin: "19:00" }],                        // mardi
  [{ debut: "11:00", fin: "19:00" }],                        // mercredi
  [{ debut: "11:00", fin: "19:00" }],                        // jeudi
  [{ debut: "11:00", fin: "19:00" }],                        // vendredi
  [{ debut: "10:00", fin: "13:00" }, { debut: "14:00", fin: "18:00" }],
  [],                                                        // dimanche
];

/** La fiche de démonstration portant ce slug. */
function ficheDemo(slug: string): Tatoueur | undefined {
  return TATOUEURS_DEMO.find((fiche) => fiche.slug === slug);
}

/** Le studio principal d'un salon : SON adresse, telle quelle. */
function studioPrincipal(fiche: Tatoueur): StudioFiche {
  return {
    id: `${fiche.id}-studio-0`,
    nom: null,
    intitule: fiche.adresse ?? fiche.ville_nom,
    adresse: fiche.adresse ?? null,
    code_postal: fiche.code_postal ?? null,
    ville: fiche.ville_nom,
    region: fiche.region ?? null,
    pays: fiche.pays ?? null,
    code_pays: fiche.code_pays ?? null,
    latitude: fiche.latitude,
    longitude: fiche.longitude,
    lieu_id: fiche.lieu_id ?? null,
    principal: true,
    ordre: 0,
    // DES HORAIRES DE DÉMONSTRATION, pour que l'accordéon se voie et
    // se vérifie sans base : mardi-samedi 11 h – 19 h, avec la coupure
    // du midi le samedi. Dimanche et lundi fermés — le rythme d'un
    // studio de tatouage.
    horaires: SANS_HORAIRES.has(fiche.slug) ? null : HORAIRES_DEMO,
    // ⚠️ LE FUSEAU VIENT DE L'ADRESSE, jamais du visiteur : une fiche
    // de démonstration à l'étranger doit annoncer SON heure.
    fuseau: fuseauDuLieu(fiche.code_pays, fiche.longitude),
  };
}

/** Un mode, traduit dans la forme que lit toute l'application. */
function modeDemo(
  fiche: Tatoueur,
  mode: ModeDemo,
  rang: number
): ModeExerciceFiche {
  const salon = mode.salon ? ficheDemo(mode.salon) : undefined;
  const lieu = mode.lieu;
  return {
    id: `${fiche.id}-mode-${rang}`,
    genre: mode.genre,
    // EN STUDIO SANS PRÉCISION : « résident », le sens qu'avait le
    // mode avant que le sous-choix n'existe.
    role:
      mode.genre === "salon" ? (mode.role ?? "resident") : null,
    salon_id: salon?.id ?? null,
    salon_nom: salon?.nom ?? null,
    salon_slug: salon?.slug ?? null,
    salon_photo: salon?.photo_profil ?? null,
    intitule: salon ? (salon.adresse ?? salon.ville_nom) : (lieu?.intitule ?? null),
    adresse: salon ? (salon.adresse ?? null) : (lieu?.adresse ?? null),
    code_postal: salon ? (salon.code_postal ?? null) : (lieu?.code_postal ?? null),
    ville: salon ? salon.ville_nom : (lieu?.ville ?? null),
    region: salon ? (salon.region ?? null) : (fiche.region ?? null),
    pays: salon ? (salon.pays ?? null) : (fiche.pays ?? null),
    code_pays: salon ? (salon.code_pays ?? null) : (fiche.code_pays ?? null),
    latitude: salon ? salon.latitude : (lieu?.latitude ?? null),
    longitude: salon ? salon.longitude : (lieu?.longitude ?? null),
    lieu_id: salon ? (salon.lieu_id ?? null) : null,
    debut_le: mode.genre === "guest" ? (mode.debut_le ?? null) : null,
    fin_le: mode.genre === "guest" ? (mode.fin_le ?? null) : null,
    ordre: rang,
  };
}

/* ---------- 1) LE TYPE, LES STUDIOS, LES MODES ---------- */
for (const fiche of TATOUEURS_DEMO) {
  const exercice = EXERCICE_DEMO[fiche.slug];
  if (!exercice) continue;
  fiche.type_fiche = exercice.type;
  if (exercice.type === "salon") {
    fiche.studios = [
      studioPrincipal(fiche),
      ...(exercice.studiosEnPlus ?? []).map((lieu, rang) => ({
        id: `${fiche.id}-studio-${rang + 1}`,
        nom: null,
        intitule: lieu.intitule,
        adresse: lieu.adresse,
        code_postal: lieu.code_postal,
        ville: lieu.ville,
        region: fiche.region ?? null,
        pays: fiche.pays ?? null,
        code_pays: fiche.code_pays ?? null,
        latitude: lieu.latitude,
        longitude: lieu.longitude,
        horaires: SANS_HORAIRES.has(fiche.slug) ? null : HORAIRES_DEMO,
        fuseau: fuseauDuLieu(fiche.code_pays, lieu.longitude),
        lieu_id: null,
        principal: false,
        ordre: rang + 1,
      })),
    ];
    fiche.modes = [];
  } else {
    fiche.modes = (exercice.modes ?? []).map((mode, rang) =>
      modeDemo(fiche, mode, rang)
    );
    fiche.studios = [];
  }
}

/* ---------- 2) LES ÉQUIPES, DÉDUITES ---------- */
/* La MÊME règle que la vue `equipe_salon` : un artiste figure dans
   l'équipe d'un salon s'il a un mode rattaché à ce salon, et si ce
   mode n'est pas une session terminée. Rien n'est recopié — donc
   rien ne peut diverger. */
for (const salon of TATOUEURS_DEMO) {
  if (salon.type_fiche !== "salon") continue;
  const membres: MembreEquipe[] = [];
  for (const artiste of TATOUEURS_DEMO) {
    if (artiste.type_fiche !== "artiste") continue;
    for (const mode of artiste.modes ?? []) {
      if (mode.salon_id !== salon.id) continue;
      if (modeExpire(mode)) continue;
      membres.push({
        artiste_id: artiste.id,
        nom: artiste.nom,
        slug: artiste.slug,
        photo: artiste.photo_profil ?? null,
        genre: mode.genre === "guest" ? "guest" : "salon",
        debut_le: mode.debut_le,
        fin_le: mode.fin_le,
      });
    }
  }
  salon.equipe = membres;
}

/* ---------- 3) LE PORTFOLIO CATALOGUÉ, DÉDUIT ---------- */
/**
 * PLUSIEURS PHOTOS PAR STYLE, chacune taguée — exactement ce que la
 * table `photos_tatoueur` contient depuis la migration nº 31, et ce
 * que la fiche publique montre désormais : le sélecteur de style, le
 * carrousel qui change de contenu, le compteur.
 *
 * LA GALERIE EST CONSTRUITE, PAS RECOPIÉE : chaque style reçoit trois
 * à cinq photos — et le NOIR ET GRIS PRÉCÈDE LA COULEUR. Le nombre
 * varie d'un style à l'autre (le rang du style entre dans le calcul) :
 * c'est ce qui permet de voir, en démonstration, une galerie courte à
 * côté d'une longue.
 *
 * (⚠️ Les ZONES DU CORPS ont quitté ces galeries avec l'abandon des
 * tags de zone — passe nº 109, migration nº 48.)
 *
 * Les images restent des rectangles de couleur dessinés à la volée
 * (/images-demo/tatouage/<style>-<n>.svg) : aucune photo de tatouage
 * n'est publiée sans l'accord de son auteur. La « miniature » est la
 * même adresse — un SVG n'a pas deux résolutions.
 */
TATOUEURS_DEMO.forEach((fiche, rangDeLaFiche) => {
  const galerie: PhotoTatoueur[] = [];
  fiche.styles.forEach((style, rangStyle) => {
    // Trois à cinq photos selon le style : des galeries de tailles
    // différentes, comme dans la vraie vie.
    const combien = 3 + ((rangStyle + fiche.styles.length) % 3);
    for (let i = 0; i < combien; i++) {
      // ⚠️ TOUTES LES FICHES N'ONT PAS LES DEUX RENDUS. Elles les
      // avaient toutes avant cette passe : le filtre « Rendu » ne
      // pouvait donc RIEN distinguer en démonstration, et paraissait
      // cassé alors qu'il ne l'était pas encore. Une fiche sur trois
      // est désormais entièrement en NOIR ET GRIS — de quoi voir
      // « Couleur » retirer quelqu'un.
      const toutEnNoirEtGris = rangDeLaFiche % 3 === 0;
      const toutEnCouleur = rangDeLaFiche % 3 === 1;
      const rendu = toutEnNoirEtGris
        ? "black_and_grey"
        : toutEnCouleur
          ? "color"
          : i === 1 || i % 3 === 2
            ? "color"
            : "black_and_grey";
      //  ⚠️ DES FLASHS, MAIS PAS PARTOUT (passe nº 110). Le menu
      //  « Explorer » sépare les tatouages des flashs : il faut donc
      //  que la démonstration contienne les DEUX, et surtout que
      //  chercher « Tous les flashs » RETIRE du monde — un filtre qui
      //  garde tout le monde ne se vérifie pas. Une fiche sur deux
      //  propose des flashs, et seulement une photo sur trois chez
      //  elle en est un.
      const proposeDesFlashs = rangDeLaFiche % 2 === 0;
      const nature = proposeDesFlashs && i % 3 === 2 ? "flash" : "tatouage";
      const image = `/images-demo/tatouage/${style}-${(i % 9) + 1}.svg`;
      galerie.push({
        id: `${fiche.id}-photo-${rangStyle}-${i}`,
        style,
        rendu,
        nature,
        url: image,
        miniature: image,
        ordre: galerie.length,
      });
    }
  });
  fiche.galerie = galerie;
});

/* ---------- 4) LA FICHE D'ESSAI DE L'ADMINISTRATEUR ---------- */
/**
 * ELLE APPARTIENT AU COMPTE ADMINISTRATEUR, donc elle est INVISIBLE
 * du public : ni dans la mosaïque, ni dans la recherche, ni dans le
 * plan du site, et son adresse répond « page introuvable » à un
 * visiteur. Son propriétaire, lui, la voit et la modifie normalement.
 *
 * Elle est ajoutée APRÈS la construction des galeries pour recevoir
 * la sienne comme les autres : une fiche d'essai doit ressembler à
 * une vraie fiche, sinon elle ne teste rien.
 */
const FICHE_ADMIN_DEMO: Tatoueur = {
  id: "demo-admin-01",
  user_id: COMPTE_ADMIN_DEMO,
  nom: "Atelier Contrôle",
  slug: "atelier-controle-essai",
  ancien_slug: null,
  type_fiche: "salon",
    etablissement: "salon",
  mode_exercice: "adresse",
  photo_profil: "/images-demo/tatouage/blackwork-5.svg",
  adresse: "1 rue de l'Essai",
  code_postal: "69002",
  bio: "Fiche d'essai de l'administrateur : elle sert à vérifier le site, et n'apparaît jamais publiquement.",
  site_web: null,
  region: "Auvergne-Rhône-Alpes",
  pays: "France",
  code_pays: "FR",
  lieu_id: "demo:69382",
  ville_nom: "Lyon 2e",
  ville_slug: "lyon-2e",
  latitude: 45.7537,
  longitude: 4.8272,
  styles: ["blackwork", "dotwork"],
  filtres_technique: ["machine"],
  filtres_composition: ["petit-tatouage"],
  lien_instagram: "https://www.instagram.com/atelier.controle.demo/",
  photos_styles: {
    blackwork: "/images-demo/tatouage/blackwork-6.svg",
    dotwork: "/images-demo/tatouage/dotwork-6.svg",
  },
  lien_tiktok: null,
  photo_principale: "/images-demo/tatouage/blackwork-6.svg",
  photos: [],
  publie: true,
};
FICHE_ADMIN_DEMO.galerie = FICHE_ADMIN_DEMO.styles.flatMap((style, rang) =>
  [0, 1, 2].map((i) => ({
    id: `${FICHE_ADMIN_DEMO.id}-photo-${rang}-${i}`,
    style,
    rendu: i === 1 ? "color" : "black_and_grey",
    //  La fiche d'essai a les deux natures : elle doit ressembler à
    //  une vraie fiche, sinon elle ne teste rien.
    nature: i === 2 ? "flash" : "tatouage",
    url: `/images-demo/tatouage/${style}-${i + 1}.svg`,
    miniature: `/images-demo/tatouage/${style}-${i + 1}.svg`,
    ordre: rang * 3 + i,
  }))
);
TATOUEURS_DEMO.push(FICHE_ADMIN_DEMO);
