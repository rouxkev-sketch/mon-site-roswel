import { cache } from "react";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import type { HorairesSemaine } from "@/lib/horaires";
import { distanceKm } from "@/lib/geo";
import { nomVilleCourt } from "@/lib/villes";

/** L'accordéon « Zone » montre au plus ce nombre de communes proches */
const COMMUNES_AFFICHEES = 20;

/** Les communes couvertes, préparées côté serveur (accordéon « Zone ») */
export type CommunesCouvertesCalculees = { noms: string[]; autres: number };

/** Toutes les informations affichées sur la fiche d'un artisan */
export type ArtisanComplet = {
  id: string;
  slug: string | null;
  nom_affiche: string;
  type_compte: "independant" | "societe";
  nom_societe: string | null;
  nom_responsable: string | null;
  photo_url: string | null;
  bio: string | null;
  siren: string | null;
  publications_instagram: number | null;
  adresse: string | null;
  ville_nom: string | null;
  ville_code_postal: string | null;
  ville_code_insee: string | null;
  latitude: number | null;
  longitude: number | null;
  rayon_intervention_km: number;
  communes_exclues: string[] | null;
  horaires: HorairesSemaine | null;
  telephone: string | null;
  telephone_visible: boolean;
  whatsapp: string | null;
  siren_verifie: boolean;
  date_creation_entreprise: string | null;
  lien_instagram: string | null;
  /** Site internet personnel, FACULTATIF (colonne « Internet » de la
      ligne d'infos : « Voir le site », ou un tiret s'il n'y en a pas) */
  site_internet: string | null;
  abonnes_instagram: number | null;
  note_google: number | null;
  nombre_avis_google: number | null;
  place_id_google: string | null;
  dispo_urgence: boolean;
  dispo_nuit: boolean;
  dispo_weekend: boolean;
  dispo_feries: boolean;
  absence_debut: string | null;
  absence_fin: string | null;
  pastille: string | null;
  cree_le: string | null; // date d'inscription sur Roswel
  metiers: string[];
};

/**
 * Charge la fiche complète d'un artisan par son adresse web (slug).
 * - Une seule requête par affichage (cache React) : la page et son
 *   titre d'onglet partagent le résultat.
 * - Seules les fiches VALIDÉES sont renvoyées aux visiteurs (règle
 *   de sécurité posée en base à l'étape 2).
 */
export const chargerArtisanComplet = cache(
  async (slug: string): Promise<ArtisanComplet | null> => {
    const supabase = await creerClientSupabaseServeur();
    const { data, error } = await supabase
      .from("artisans")
      .select(
        "id, slug, nom_affiche, type_compte, nom_societe, nom_responsable, photo_url, bio, siren, publications_instagram, adresse, ville_nom, ville_code_postal, ville_code_insee, latitude, longitude, rayon_intervention_km, communes_exclues, horaires, telephone, telephone_visible, whatsapp, siren_verifie, date_creation_entreprise, lien_instagram, site_internet, abonnes_instagram, note_google, nombre_avis_google, place_id_google, dispo_urgence, dispo_nuit, dispo_weekend, dispo_feries, absence_debut, absence_fin, pastille, cree_le, artisan_metiers ( metier )"
      )
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const { artisan_metiers, ...infos } = data;
    return {
      ...infos,
      metiers: (artisan_metiers ?? []).map((m: { metier: string }) => m.metier),
    } as ArtisanComplet;
  }
);

/**
 * Les communes réellement couvertes par le rayon de l'artisan :
 * boîte englobante autour de son point, puis distance exacte — des
 * plus proches aux plus lointaines (arrondissements regroupés sous
 * leur ville). Renvoie null si l'artisan n'a pas de coordonnées ou
 * si la base est injoignable (l'accordéon Zone affichera le rayon).
 */
export async function communesCouvertesPour(artisan: {
  latitude: number | null;
  longitude: number | null;
  rayon_intervention_km: number;
  communes_exclues: string[] | null;
}): Promise<CommunesCouvertesCalculees | null> {
  if (artisan.latitude == null || artisan.longitude == null) return null;
  try {
    const supabase = await creerClientSupabaseServeur();
    const rayon = artisan.rayon_intervention_km;
    const dLat = rayon / 111;
    const dLon = rayon / (111 * Math.cos((artisan.latitude * Math.PI) / 180));
    const { data: communes } = await supabase
      .from("communes")
      .select("code_insee, nom, latitude, longitude")
      .gte("latitude", artisan.latitude - dLat)
      .lte("latitude", artisan.latitude + dLat)
      .gte("longitude", artisan.longitude - dLon)
      .lte("longitude", artisan.longitude + dLon)
      .limit(3000);

    const exclues = new Set(artisan.communes_exclues ?? []);
    const noms: string[] = [];
    const vus = new Set<string>();
    for (const commune of (communes ?? [])
      .filter(
        (c) =>
          !exclues.has(c.code_insee) &&
          distanceKm(
            artisan.latitude!,
            artisan.longitude!,
            c.latitude,
            c.longitude
          ) <= rayon
      )
      .map((c) => ({
        nom: nomVilleCourt(c.nom),
        distance: distanceKm(
          artisan.latitude!,
          artisan.longitude!,
          c.latitude,
          c.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance)) {
      if (!vus.has(commune.nom)) {
        vus.add(commune.nom);
        noms.push(commune.nom);
      }
    }
    return {
      noms: noms.slice(0, COMMUNES_AFFICHEES),
      autres: Math.max(0, noms.length - COMMUNES_AFFICHEES),
    };
  } catch {
    return null; // hors ligne : repli sur le rayon en texte
  }
}

/** Une fiche prête à afficher : l'artisan + ses communes couvertes */
export type FicheChargee = {
  artisan: ArtisanComplet;
  communesCouvertes: CommunesCouvertesCalculees | null;
  /** Nombre de particuliers ayant mis cet artisan en favori (compteur
      du cœur, bandeau de la fiche ≥ 1024 px). null = inconnu (hors
      ligne) → le compteur n'est simplement pas affiché. */
  nombreFavoris?: number | null;
};

/**
 * Le nombre de favoris d'un artisan (compteur du cœur). Silencieux
 * hors ligne : renvoie null, le bandeau n'affiche alors aucun compte.
 */
export async function compterFavoris(artisanId: string): Promise<number | null> {
  try {
    const supabase = await creerClientSupabaseServeur();
    const { count } = await supabase
      .from("favoris")
      .select("*", { count: "exact", head: true })
      .eq("artisan_id", artisanId);
    return count ?? 0;
  } catch {
    return null;
  }
}

/**
 * Charge tout ce qu'il faut pour afficher une fiche (page fiche,
 * colonne de droite du mode double, et route /api/artisan/fiche-complete).
 */
export async function chargerFicheComplete(
  slug: string
): Promise<FicheChargee | null> {
  const artisan = await chargerArtisanComplet(slug);
  if (!artisan) return null;
  const communesCouvertes = await communesCouvertesPour(artisan);
  const nombreFavoris = await compterFavoris(artisan.id);
  return { artisan, communesCouvertes, nombreFavoris };
}

/**
 * Le lien vers les avis Google de l'artisan.
 * Avec un identifiant de fiche Google (place_id) : ouverture directe
 * de ses avis. Sans (fiches de démonstration) : recherche Google de
 * son nom — le lien reste toujours cliquable, jamais grisé.
 */
export function lienAvisGoogle(artisan: {
  place_id_google: string | null;
  nom_affiche: string;
}): string {
  if (artisan.place_id_google) {
    return `https://search.google.com/local/reviews?placeid=${encodeURIComponent(
      artisan.place_id_google
    )}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${artisan.nom_affiche} avis`
  )}`;
}

