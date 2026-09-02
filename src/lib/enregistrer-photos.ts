import type { SupabaseClient } from "@supabase/supabase-js";
//  §1 (nº 692) — le ménage du stockage, écrit une seule fois pour les
//  quatre chemins qui en ont besoin (voir lib/photos-stockage).
import {
  cheminsDistincts,
  direLeMenage,
  effacerDesFichiers,
} from "@/lib/photos-stockage";
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
 *
 * ██ LES PHOTOS NEUVES ATTENDENT LEUR VALIDATION (règle 3, nº 285) ██
 * ==================================================================
 * C'est LE SEUL contenu du portfolio qui passe encore par une
 * relecture. Une photo qui ARRIVE (aucun `id` : elle n'a jamais existé
 * en base) est écrite `en_attente = true` ; elle vit donc en base, son
 * auteur la voit dans son formulaire, et LE PUBLIC NE LA VOIT PAS
 * (règle 6) — ni la mosaïque, ni la fiche, ni le partage.
 * ⚠️ CE QUI N'EST PAS UNE ARRIVÉE N'ATTEND RIEN : réordonner (règle 5),
 * retaguer, retirer une photo ne touche jamais `en_attente` — ces
 * lignes ont un `id`, elles sont MISES À JOUR, et la mise à jour ne
 * mentionne pas la colonne. Une photo déjà validée ne peut donc pas
 * retomber en attente parce qu'on l'a déplacée.
 * ⚠️ ET LA COLONNE PEUT MANQUER : sans la migration nº 70, l'insertion
 * est rejouée SANS elle. Le site marche alors exactement comme avant
 * cette passe — les photos neuves sont visibles tout de suite. Aucune
 * version du site n'exige la migration.
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
  retirees: string[] = [],
  /** §1 (nº 285) — LES ARRIVÉES ATTENDENT-ELLES LEUR VALIDATION ?
      Vrai sur une fiche DÉJÀ VALIDÉE : les photos neuves sont écrites
      `en_attente` (règle 3). Faux à la toute première création : la
      fiche entière passe la validation (règle 1), ses photos avec —
      les marquer une seconde fois les laisserait invisibles après la
      mise en ligne. */
  arriveesEnAttente = false
): Promise<void> {
  try {
    // 1) CE QUI DISPARAÎT — ce que la personne a retiré, et rien
    //    d'autre : une ligne que l'écran n'a jamais montrée n'est pas
    //    une ligne qu'on a voulu supprimer.
    const aSupprimer = retirees.filter(
      (id) => !photos.some((photo) => photo.id === id)
    );
    if (aSupprimer.length > 0) {
      /*  ██ §1 (nº 692) — ET LE FICHIER PART AVEC LA LIGNE ██
          ------------------------------------------------------------
          CE QUE L'AUDIT nº 691 A TROUVÉ (R5) : la ligne partait, LE
          FICHIER RESTAIT. Un portfolio remanié dix fois laissait dix
          jeux de photos dans un seau public — des images que leur
          auteur croyait supprimées.
          ⚠️ ON LIT LES ADRESSES AVANT DE SUPPRIMER LES LIGNES, et
          c'est tout le sujet : effacées d'abord, plus rien ne dirait
          quels fichiers étaient à elles.
          ⚠️ LES LIGNES D'ABORD, LES FICHIERS ENSUITE — l'ordre inverse
          de la lecture, et c'est délibéré : si l'effacement échoue, il
          reste un fichier de trop (invisible) ; dans l'autre sens il
          resterait une ligne qui montre une image morte (visible).
          ⚠️ LE MÉNAGE N'EMPÊCHE JAMAIS L'ENREGISTREMENT : il est hors
          du chemin qui compte, et `effacerDesFichiers` ne lève pas.
          La personne a le droit de supprimer une photo même si le
          stockage boude.
          ⚠️ ET C'EST BIEN LE NAVIGATEUR QUI EFFACE : la règle
          « ménage dans son propre dossier » l'y autorise, sur son
          dossier et lui seul (yokofolio-fiches-tatoueurs.sql). */
      let aEffacer: string[] = [];
      try {
        const { data, error } = await supabase
          .from("photos_tatoueur")
          .select("url, miniature")
          .eq("tatoueur_id", ficheId)
          .in("id", aSupprimer);
        if (!error) {
          aEffacer = cheminsDistincts(
            ((data ?? []) as Array<{ url?: string; miniature?: string | null }>)
              .flatMap((photo) => [photo.url, photo.miniature])
          );
        }
      } catch {
        //  Adresses illisibles : on supprime quand même les lignes.
        aEffacer = [];
      }

      await supabase
        .from("photos_tatoueur")
        .delete()
        .eq("tatoueur_id", ficheId)
        .in("id", aSupprimer);

      if (aEffacer.length > 0) {
        const menage = await effacerDesFichiers(supabase, aEffacer);
        if (menage.echecs.length > 0) {
          console.warn(
            `[photos] portfolio ${ficheId} — ${direLeMenage(menage)}`
          );
        }
      }
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
    //  §1 (nº 285) — et elles portent leur attente quand la fiche est
    //  déjà validée (voir la note de tête).
    const neuves = lignes
      .filter((l) => !l.id)
      .map((l) =>
        arriveesEnAttente ? { ...l.ligne, en_attente: true } : l.ligne
      );
    if (neuves.length > 0) {
      let insertion = await supabase.from("photos_tatoueur").insert(neuves);
      //  LA COLONNE PEUT MANQUER (migration nº 70 pas encore passée) :
      //  on rejoue SANS elle plutôt que de perdre les photos.
      if (
        insertion.error &&
        arriveesEnAttente &&
        insertion.error.message.toLowerCase().includes("en_attente")
      ) {
        insertion = await supabase
          .from("photos_tatoueur")
          .insert(lignes.filter((l) => !l.id).map((l) => l.ligne));
      }
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
      "[portfolio] not written:",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
  }
}
