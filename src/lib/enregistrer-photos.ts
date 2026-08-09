import type { SupabaseClient } from "@supabase/supabase-js";
import { CONNEXIONS_SIMULTANEES, enPool } from "@/lib/televerser-photos";

/**
 * ÉCRIRE LE PORTFOLIO
 * ====================
 * Appelé par le formulaire, APRÈS l'enregistrement de la fiche — ces
 * lignes ont besoin de son identifiant.
 *
 * ⚠️ ON NE VIDE PAS POUR REMPLIR, exactement comme pour les modes
 * d'exercice : on travaille PAR IDENTITÉ. Les lignes de l'écran qui
 * ont un `id` sont mises à jour, celles qui n'en ont pas sont
 * insérées, et celles de la base qui ne sont plus à l'écran sont
 * supprimées. Effacer tout pour tout réécrire ferait perdre les
 * identifiants à chaque enregistrement — donc l'ordre, et l'historique.
 *
 * ⚠️ LES PHOTOS PARTENT AVANT, dans le stockage, et par PAIRES :
 * la pleine résolution ET sa miniature. C'est le formulaire qui les
 * téléverse (il a les fichiers) ; ici, on n'écrit que des adresses.
 *
 * PLUS DE FILE INDIENNE (passe nº 118) : trente photos neuves
 * faisaient trente insertions l'une après l'autre. Les insertions
 * partent désormais EN UNE SEULE REQUÊTE (un tableau de lignes), et
 * les mises à jour — qui visent chacune une ligne par son `id` — en
 * parallèle, quatre à la fois.
 *
 * ÉCRIT AVEC LA SESSION DE LA PERSONNE, jamais la clé de service : la
 * politique de la migration nº 31 vérifie, ligne par ligne, que la
 * fiche visée lui appartient.
 *
 * JAMAIS BLOQUANT : si la table n'existe pas encore (migration nº 31
 * non passée), on n'interrompt RIEN — la fiche est enregistrée, et le
 * portfolio suivra au prochain envoi. Le message part dans le journal.
 */

export type PhotoAEcrire = {
  id?: string | null;
  style: string;
  rendu: string | null;
  /** `tatouage` ou `flash` — migration nº 49. */
  nature: string;
  url: string;
  miniature: string | null;
  ordre: number;
};

export async function enregistrerPhotos(
  supabase: SupabaseClient,
  ficheId: string,
  photos: PhotoAEcrire[]
): Promise<void> {
  try {
    // 1) CE QUI DISPARAÎT — les lignes de la base absentes de l'écran.
    const gardes = photos.map((photo) => photo.id).filter(Boolean) as string[];
    const suppression = supabase
      .from("photos_tatoueur")
      .delete()
      .eq("tatoueur_id", ficheId);
    await (gardes.length > 0
      ? suppression.not("id", "in", `(${gardes.join(",")})`)
      : suppression);

    // 2) CE QUI RESTE ET CE QUI ARRIVE — dans l'ordre de la galerie.
    const lignes = photos.map((photo, rang) => ({
      id: photo.id,
      ligne: {
        tatoueur_id: ficheId,
        style: photo.style,
        rendu: photo.rendu,
        nature: photo.nature,
        url: photo.url,
        miniature: photo.miniature,
        ordre: rang,
      },
    }));

    //  LES ARRIVÉES, D'UN SEUL COUP : une requête pour tout le lot.
    const neuves = lignes.filter((l) => !l.id).map((l) => l.ligne);
    if (neuves.length > 0) {
      const insertion = await supabase.from("photos_tatoueur").insert(neuves);
      if (insertion.error) throw new Error(insertion.error.message);
    }

    //  LES MISES À JOUR, quatre en vol : chacune vise SA ligne.
    await enPool(
      lignes
        .filter((l) => l.id)
        .map((l) => async () => {
          const reponse = await supabase
            .from("photos_tatoueur")
            .update(l.ligne)
            .eq("id", l.id as string);
          if (reponse.error) throw new Error(reponse.error.message);
        }),
      CONNEXIONS_SIMULTANEES
    );
  } catch (erreur) {
    console.warn(
      "[portfolio] non écrit :",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
  }
}
