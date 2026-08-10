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
 * insérées. Effacer tout pour tout réécrire ferait perdre les
 * identifiants à chaque enregistrement — donc l'ordre, et l'historique.
 *
 * ⚠️ ON NE SUPPRIME QUE CE QUI A ÉTÉ RETIRÉ À L'ÉCRAN (passe nº 151),
 * et c'est une correction importante. La suppression visait jusqu'ici
 * « tout ce qui n'est plus à l'écran » : une ligne que le formulaire
 * n'avait pas su afficher — une photo sans rendu, par exemple — était
 * donc DÉTRUITE au premier envoi, alors que personne ne l'avait
 * retirée. Et comme les styles de la fiche se déduisent de ses photos,
 * le style partait avec elle : l'image disparaissait de la recherche ET
 * de la fiche, sans laisser de trace.
 * On applique donc la règle du « studio fantôme » (passe nº 104) : la
 * page dit explicitement CE QU'ELLE A CHARGÉ PUIS RETIRÉ, et rien
 * d'autre n'est touché.
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
  photos: PhotoAEcrire[],
  /** LES PHOTOS CHARGÉES PUIS RETIRÉES À L'ÉCRAN — leurs identifiants,
      et EUX SEULS, partent de la base. Vide à la création d'une fiche :
      il n'y avait rien à retirer. */
  retirees: string[] = []
): Promise<void> {
  try {
    // 1) CE QUI DISPARAÎT — ce que la personne a retiré, et rien
    //    d'autre : une ligne que l'écran n'a jamais montrée n'est pas
    //    une ligne qu'on a voulu supprimer.
    const aSupprimer = retirees.filter(
      (id) => !photos.some((photo) => photo.id === id)
    );
    if (aSupprimer.length > 0) {
      await supabase
        .from("photos_tatoueur")
        .delete()
        .eq("tatoueur_id", ficheId)
        .in("id", aSupprimer);
    }

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
