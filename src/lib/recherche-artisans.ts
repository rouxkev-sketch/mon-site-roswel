import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { classerArtisans } from "@/lib/classement";
import { metiersDeLOffre } from "@/lib/metiers";
import {
  estEnAbsence,
  estOuvertMaintenant,
  type HorairesSemaine,
} from "@/lib/horaires";
import { estJourFerie } from "@/lib/feries";

/** Un artisan tel que renvoyé par la recherche (fonction SQL rechercher_artisans) */
export type ArtisanResultat = {
  id: string;
  slug: string | null;
  nom_affiche: string;
  type_compte: "independant" | "societe"; // forme de la photo (cercle / carré arrondi)
  nom_societe: string | null; // indépendant : société facultative (petite ligne)
  nom_responsable: string | null; // société : « Dirigée par … » facultatif
  ville_nom: string | null; // commune de l'artisan (affichée sur la carte)
  ville_code_postal: string | null;
  photo_url: string | null;
  pastille: string | null;
  score_total: number;
  note_google: number | null;
  nombre_avis_google: number | null;
  abonnes_instagram: number | null;
  publications_instagram: number | null;
  telephone: string | null;
  telephone_visible: boolean; // case « afficher mon téléphone » de l'artisan
  whatsapp: string | null; // contact principal (icône WhatsApp de la carte)
  siren_verifie: boolean;
  date_creation_entreprise: string | null; // renvoyée par l'annuaire Sirene
  horaires: HorairesSemaine | null; // sert au filtre Urgence (ouvert maintenant)
  dispo_urgence: boolean; // case « dépannage d'urgence »
  dispo_nuit: boolean; // DÉDUITE des horaires
  dispo_weekend: boolean; // DÉDUITE des horaires
  dispo_feries: boolean; // case « j'interviens les jours fériés »
  absence_debut: string | null; // période de fermeture déclarée
  absence_fin: string | null;
  distance_km: number;
  metiers: string[];
  cree_le: string; // date d'inscription sur Roswel
};

/** Le filtre « type de compte » du moteur : tous, indépendants seuls,
    sociétés seules. */
export type TypeArtisan = "tous" | "independant" | "societe";

export type FiltresRecherche = {
  urgence: boolean;
  nuit: boolean;
  weekend: boolean;
  /** « tous » par défaut — voir la fenêtre « Filtrer les résultats » */
  type: TypeArtisan;
};

/**
 * Lance la recherche « métier + commune » dans la base (calcul de
 * distance inclus) puis applique le classement : 100 % score de
 * confiance.
 *
 * MÉTIER cherché = une ENTRÉE du menu (src/config/roswel.ts) :
 *  - métier simple (« plombier ») : la base renvoie TOUS les artisans
 *    qui ont ce métier — donc AUSSI les « Plombier & Chauffagiste »,
 *    puisqu'une double compétence pose les deux métiers en base ;
 *  - double compétence (« plombier-chauffagiste ») : on interroge la
 *    base sur son PREMIER métier puis on ne garde que les artisans qui
 *    ont bien TOUS les métiers de l'entrée.
 *
 * Le filtre URGENCE ajoute ses conditions « du moment » ici, après
 * la base : dépannage d'urgence accepté ET actuellement ouvert selon
 * les horaires ET pas en période de fermeture ET, un jour férié,
 * uniquement les artisans qui interviennent les fériés.
 */
export async function rechercherArtisans(
  metier: string,
  codeInsee: string,
  filtres: FiltresRecherche
): Promise<ArtisanResultat[]> {
  const supabase = await creerClientSupabaseServeur();

  // Les métiers de l'entrée cherchée (repli : le slug lui-même, pour
  // une adresse ancienne qui ne serait plus au menu)
  const metiersCherches = metiersDeLOffre(metier);
  const metiersRetenus = metiersCherches.length > 0 ? metiersCherches : [metier];

  const { data, error } = await supabase.rpc("rechercher_artisans", {
    p_metier: metiersRetenus[0],
    p_code_insee: codeInsee,
    p_urgence: filtres.urgence,
    p_nuit: filtres.nuit,
    p_weekend: filtres.weekend,
  });

  if (error) {
    throw new Error(
      `Recherche impossible : ${error.message}. ` +
        "Le script supabase/passe-metiers-comptes.sql a-t-il été exécuté ?"
    );
  }

  let artisans = (data ?? []) as ArtisanResultat[];

  // Double compétence : ne garder que ceux qui ont TOUS ses métiers
  if (metiersRetenus.length > 1) {
    artisans = artisans.filter((artisan) =>
      metiersRetenus.every((m) => artisan.metiers.includes(m))
    );
  }

  // TYPE DE COMPTE — le même champ qui décide déjà de la forme de la
  // photo sur les cartes : rond pour un indépendant, carré arrondi pour
  // une société. Le tri se fait ici, après la base, comme pour la
  // double compétence : la colonne est déjà dans le résultat, aucune
  // modification du script SQL n'est nécessaire.
  if (filtres.type !== "tous") {
    artisans = artisans.filter((artisan) => artisan.type_compte === filtres.type);
  }

  if (filtres.urgence) {
    const ferie = estJourFerie();
    artisans = artisans.filter(
      (artisan) =>
        estOuvertMaintenant(artisan.horaires) === true &&
        !estEnAbsence(artisan.absence_debut, artisan.absence_fin) &&
        (!ferie || artisan.dispo_feries)
    );
  }

  return classerArtisans(artisans);
}
