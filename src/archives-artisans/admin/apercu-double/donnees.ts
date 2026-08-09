import type { ArtisanComplet } from "@/lib/fiche-artisan";
import type { ArtisanResultat } from "@/lib/recherche-artisans";

/**
 * DONNÉES FICTIVES DU MODE DOUBLE (outils d'aperçu)
 * -------------------------------------------------
 * Partagées par les deux pages outil :
 *  - /admin/apercu-double        (la liste, comme /[metier]/[ville])
 *  - /admin/apercu-double-fiche  (la fiche, comme /artisan/[slug])
 * La MÊME recherche (électricien à Lyon) des deux côtés : les deux
 * pages partagent la même mémoire de position de liste, exactement
 * comme les vraies pages — indispensable au test automatique du
 * retour (position + pagination retrouvées).
 */

const base = {
  photo_url: null,
  type_compte: "independant" as "independant" | "societe",
  nom_societe: null as string | null,
  nom_responsable: null as string | null,
  whatsapp: null as string | null,
  cree_le: "2026-09-05T00:00:00Z",
  horaires: null,
  dispo_urgence: false,
  dispo_nuit: false,
  dispo_weekend: false,
  dispo_feries: false,
  absence_debut: null,
  absence_fin: null,
  distance_km: 3.2,
};

/** Neuf artisans supplémentaires : la liste dépasse la page de 10
    (test du « Voir plus » et de la liste jamais tronquée au clic) */
function complementsListe(): ArtisanResultat[] {
  const noms = [
    "Marc Dubois", "Chloé Martin", "Hugo Blanc", "Sarah Petit",
    "Nicolas Garnier", "Emma Roche", "Paul Lemaire", "Julie Morel",
    "Thomas Girard",
  ];
  return noms.map((nom, indice) => ({
    ...base,
    id: `apercu-${4 + indice}`,
    slug: `apercu-${4 + indice}`,
    nom_affiche: nom,
    ville_nom: "Écully",
    ville_code_postal: "69130",
    telephone: indice % 2 === 0 ? "06 39 98 44 55" : null,
    telephone_visible: true,
    whatsapp: "06 39 98 22 33",
    siren_verifie: true,
    date_creation_entreprise: "2015-06-01",
    horaires: {
      lundi: ["08:00-18:00"], mardi: ["08:00-18:00"], mercredi: ["08:00-18:00"],
      jeudi: ["08:00-18:00"], vendredi: ["08:00-18:00"], samedi: null, dimanche: null,
    },
    pastille: indice % 3 === 0 ? "recommande" : null,
    score_total: 60 - indice * 3,
    note_google: 4.4,
    nombre_avis_google: 20 + indice,
    abonnes_instagram: 900 - indice * 40,
    publications_instagram: 60 + indice,
    metiers: ["electricien"],
  }));
}

export const ARTISANS: ArtisanResultat[] = [
  {
    ...base,
    id: "apercu-1",
    slug: "apercu-1",
    nom_affiche: "Sophie Bertrand",
    ville_nom: "Lyon 3e Arrondissement",
    ville_code_postal: "69003",
    telephone: "06 39 98 02 03",
    telephone_visible: true,
    whatsapp: "06 39 98 02 03",
    siren_verifie: true,
    date_creation_entreprise: "2016-03-01",
    horaires: {
      lundi: "24h24", mardi: "24h24", mercredi: "24h24", jeudi: "24h24",
      vendredi: "24h24", samedi: "24h24", dimanche: "24h24",
    },
    pastille: "top",
    score_total: 85,
    note_google: 4.9,
    nombre_avis_google: 88,
    abonnes_instagram: 12400,
    publications_instagram: 320,
    metiers: ["electricien"],
  },
  {
    ...base,
    id: "apercu-2",
    slug: "apercu-2",
    // SOCIÉTÉ : logo carré arrondi et raison sociale sur la carte —
    // de quoi vérifier le filtre « Entreprise » sans base de données.
    type_compte: "societe" as const,
    nom_affiche: "Moreau & Fils Plomberie",
    ville_nom: "Villeurbanne",
    ville_code_postal: "69100",
    telephone: "06 39 98 01 02",
    telephone_visible: true,
    whatsapp: "06 39 98 01 02",
    siren_verifie: true,
    date_creation_entreprise: "2019-09-01",
    horaires: {
      lundi: ["08:00-12:00", "14:00-19:00"],
      mardi: ["08:00-12:00", "14:00-19:00"],
      mercredi: ["08:00-12:00", "14:00-19:00"],
      jeudi: ["08:00-12:00", "14:00-19:00"],
      vendredi: ["08:00-12:00", "14:00-19:00"],
      samedi: ["09:00-13:00"],
      dimanche: null,
    },
    pastille: "recommande",
    score_total: 69,
    note_google: 4.8,
    nombre_avis_google: 127,
    abonnes_instagram: 1850,
    publications_instagram: 210,
    // DOUBLE COMPÉTENCE : la carte et la fiche affichent
    // « Plombier & Chauffagiste » (entrée réelle)
    metiers: ["plombier", "chauffagiste"],
  },
  {
    ...base,
    id: "apercu-3",
    slug: "apercu-3",
    type_compte: "societe" as const,
    nom_affiche: "Benali Énergies",
    ville_nom: "Lyon 7e Arrondissement",
    ville_code_postal: "69007",
    telephone: null,
    telephone_visible: true,
    whatsapp: "06 39 98 06 07",
    siren_verifie: true,
    date_creation_entreprise: "2026-03-01",
    horaires: {
      lundi: ["08:00-12:00"], mardi: null, mercredi: null, jeudi: null,
      vendredi: null, samedi: null, dimanche: null,
    },
    pastille: "recommande",
    score_total: 40,
    note_google: 5.0,
    nombre_avis_google: 23,
    abonnes_instagram: 430,
    publications_instagram: 34,
    metiers: ["plombier"],
  },
  ...complementsListe(),
];

/** La fiche complète du PREMIER artisan (colonne de droite) */
export const FICHE_SOPHIE: ArtisanComplet = {
  id: "apercu-1",
  slug: "apercu-1",
  nom_affiche: "Sophie Bertrand",
  type_compte: "independant",
  nom_societe: "SB Élec Lyon",
  nom_responsable: null,
  siren: "798452136",
  publications_instagram: 320,
  adresse: "24 rue Paul Bert",
  ville_nom: "Lyon 3e Arrondissement",
  ville_code_postal: "69003",
  ville_code_insee: "69383",
  latitude: 45.7578,
  longitude: 4.832,
  rayon_intervention_km: 25,
  communes_exclues: [],
  photo_url: null,
  bio: `Électricienne à Lyon depuis 10 ans, installée dans le 3e arrondissement. Je travaille surtout en rénovation d'appartements anciens, où les installations ne sont plus aux normes. Intervention 7 j/7, jours fériés compris.

- Mise aux normes de tableau électrique
- Recherche de panne et remise en service
- Création de points lumineux et de prises
- Installation de borne de recharge

(Profil de démonstration.)`,
  horaires: {
    lundi: "24h24", mardi: "24h24", mercredi: "24h24", jeudi: "24h24",
    vendredi: "24h24", samedi: "24h24", dimanche: "24h24",
  },
  absence_debut: null,
  absence_fin: null,
  telephone: "06 39 98 02 03",
  telephone_visible: true,
  whatsapp: "06 39 98 02 03",
  siren_verifie: true,
  date_creation_entreprise: "2016-03-01",
  lien_instagram: "https://www.instagram.com/sophie.elec.demo",
  // Aperçu SANS site internet : la colonne « Internet » de la fiche
  // doit y afficher un simple tiret (l'aperçu fiche, lui, a un site).
  site_internet: null,
  abonnes_instagram: 12400,
  note_google: 4.9,
  nombre_avis_google: 88,
  place_id_google: null,
  dispo_urgence: true,
  dispo_nuit: true,
  dispo_weekend: true,
  dispo_feries: true,
  pastille: "top",
  cree_le: "2026-03-10T00:00:00Z",
  metiers: ["electricien"],
};

/** Les communes couvertes affichées dans l'accordéon « Zone » */
export const COMMUNES_APERCU = {
  noms: [
    "Lyon", "Villeurbanne", "Vaulx-en-Velin", "Bron",
    "Caluire-et-Cuire", "Vénissieux", "Écully", "Oullins",
  ],
  autres: 12,
};

/**
 * Fiche complète fictive pour N'IMPORTE QUEL artisan de la liste
 * (promotion d'un ArtisanResultat en ArtisanComplet). Sert au test
 * automatique du RETOUR : la vraie route /artisan/[slug] rend cette
 * fiche pour les slugs « apercu-… » en développement (sans base),
 * afin de reproduire EXACTEMENT le vrai routage (clic de carte →
 * navigation SPA → retour navigateur). Renvoie null hors démo.
 */
export function ficheDemoDepuisSlug(slug: string): ArtisanComplet | null {
  if (slug === "apercu-1") return FICHE_SOPHIE;
  // Fiche de contrôle des NOMS LONGS (hors liste, adresse directe
  // /artisan/apercu-nom-long) : sert à vérifier que le nom passe bien sur
  // deux lignes en taille réduite au lieu d'être tronqué.
  if (slug === "apercu-nom-long")
    return {
      ...FICHE_SOPHIE,
      id: "apercu-nom-long",
      slug: "apercu-nom-long",
      nom_affiche: "Rhône Sud Plomberie & Chauffage",
      metiers: ["plombier", "chauffagiste"],
    };
  // Le PIRE CAS du fil d'Ariane : nom très long, métier long
  // (« Plombier & Chauffagiste ») ET ville longue. Sert à vérifier que
  // les liens restent entiers et que seul le nom de la page est tronqué.
  if (slug === "apercu-fil-long")
    return {
      ...FICHE_SOPHIE,
      id: "apercu-fil-long",
      slug: "apercu-fil-long",
      nom_affiche:
        "Établissements Dupont-Lefèvre Plomberie Chauffage Électricité du Grand Lyon",
      metiers: ["plombier", "chauffagiste"],
      ville_nom: "Saint-Étienne-du-Rouvray",
    };
  if (slug === "apercu-nom-tres-long")
    return {
      ...FICHE_SOPHIE,
      id: "apercu-nom-tres-long",
      slug: "apercu-nom-tres-long",
      nom_affiche:
        "Établissements Dupont-Lefèvre Plomberie Chauffage Électricité du Grand Lyon",
      metiers: ["plombier"],
    };
  const artisan = ARTISANS.find((a) => (a.slug ?? a.id) === slug);
  if (!artisan) return null;
  return {
    id: artisan.id,
    slug: artisan.slug,
    nom_affiche: artisan.nom_affiche,
    type_compte: artisan.type_compte,
    nom_societe: artisan.nom_societe,
    nom_responsable: artisan.nom_responsable,
    photo_url: artisan.photo_url,
    bio: "Profil fictif d'aperçu (test du retour).",
    siren: "123456789",
    publications_instagram: artisan.publications_instagram,
    adresse: null,
    ville_nom: artisan.ville_nom,
    ville_code_postal: artisan.ville_code_postal,
    ville_code_insee: "69123",
    latitude: 45.75,
    longitude: 4.85,
    rayon_intervention_km: 20,
    communes_exclues: [],
    horaires: artisan.horaires,
    telephone: artisan.telephone,
    telephone_visible: artisan.telephone_visible,
    whatsapp: artisan.whatsapp,
    siren_verifie: artisan.siren_verifie,
    date_creation_entreprise: artisan.date_creation_entreprise,
    lien_instagram: "https://www.instagram.com/demo",
    site_internet: null, // aperçu : colonne « Internet » avec un tiret
    abonnes_instagram: artisan.abonnes_instagram,
    note_google: artisan.note_google,
    nombre_avis_google: artisan.nombre_avis_google,
    place_id_google: null,
    dispo_urgence: artisan.dispo_urgence,
    dispo_nuit: artisan.dispo_nuit,
    dispo_weekend: artisan.dispo_weekend,
    dispo_feries: artisan.dispo_feries,
    absence_debut: artisan.absence_debut,
    absence_fin: artisan.absence_fin,
    pastille: artisan.pastille,
    cree_le: artisan.cree_le,
    metiers: artisan.metiers,
  };
}
