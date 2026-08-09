import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhotoEnSaisie } from "@/components/BlocPortfolio";

/**
 * LE TÉLÉVERSEMENT EN PARALLÈLE (passe nº 118)
 * =============================================
 * Trente photos partaient UNE PAR UNE : soixante téléversements en
 * file indienne (la pleine résolution, puis la miniature), l'écran
 * figé du premier au dernier. Ici :
 *
 *  · QUATRE PHOTOS À LA FOIS (`CONNEXIONS_SIMULTANEES`) — assez pour
 *    remplir la connexion, pas assez pour l'étouffer ni se faire
 *    limiter par le serveur. Chaque photo envoie sa pleine résolution
 *    et sa miniature EN MÊME TEMPS : au plus huit requêtes en vol.
 *  · CHAQUE RÉUSSITE EST ANNONCÉE (`surPhotoEnvoyee`) : le formulaire
 *    avance son décompte ET remplace, dans sa liste, le fichier local
 *    par les adresses distantes. C'est la REPRISE APRÈS ÉCHEC : si la
 *    quinzième photo casse, les quatorze déjà en ligne ne repartent
 *    pas — le prochain « Envoyer » n'envoie que le reste.
 *  · UN ÉCHEC ARRÊTE LES DÉPARTS : les photos en vol se terminent
 *    (leurs réussites comptent), aucune nouvelle ne part, et l'erreur
 *    remonte avec le compte de ce qui est passé.
 *
 * L'ATOMICITÉ, TRANCHÉE AINSI : le STOCKAGE est partiel et reprenable
 * (des fichiers orphelins ne coûtent rien et n'apparaissent nulle
 * part), la BASE est tout-ou-rien (le formulaire n'écrit la fiche
 * qu'une fois TOUS les téléversements réussis — voir `envoyer`).
 */

export const CONNEXIONS_SIMULTANEES = 4;

export type PhotoTeleversee = {
  cle: string;
  url: string;
  miniature: string | null;
};

/**
 * UN LOT DE TÂCHES, LIMITE EN VOL — le petit métier commun : `limite`
 * ouvriers piochent dans la file ; au premier échec, plus personne ne
 * pioche, ceux qui travaillent finissent, et l'erreur remonte.
 */
export async function enPool(
  taches: Array<() => Promise<void>>,
  limite: number
): Promise<void> {
  let suivante = 0;
  let echec: unknown = null;
  async function ouvrier() {
    while (echec === null && suivante < taches.length) {
      const tache = taches[suivante];
      suivante += 1;
      try {
        await tache();
      } catch (erreur) {
        echec = echec ?? erreur;
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limite, taches.length) }, ouvrier)
  );
  if (echec !== null) throw echec;
}

/**
 * ENVOYER LES PHOTOS NEUVES DU PORTFOLIO — celles qui portent encore
 * un fichier local. Rend les adresses distantes par clé de photo ;
 * les photos déjà en ligne ne sont pas touchées.
 */
export async function televerserPhotos({
  supabase,
  bucket,
  dossier,
  photos,
  libelleStyle,
  surPhotoEnvoyee,
}: {
  supabase: SupabaseClient;
  bucket: string;
  /** Le dossier de la personne dans le stockage : son identifiant. */
  dossier: string;
  /** LA GALERIE TRIÉE — toutes les photos ; seules celles qui ont un
      `fichier` partent, mais le RANG dans la liste complète nomme le
      fichier (comme avant : `style-horodatage-rang`). */
  photos: PhotoEnSaisie[];
  libelleStyle: (slug: string) => string;
  surPhotoEnvoyee: (photo: PhotoTeleversee) => void;
}): Promise<Map<string, PhotoTeleversee>> {
  const distantes = new Map<string, PhotoTeleversee>();
  let reussies = 0;

  const taches = photos
    .map((photo, rang) => ({ photo, rang }))
    .filter(({ photo }) => photo.fichier)
    .map(({ photo, rang }) => async () => {
      const base = `${dossier}/${photo.style}-${Date.now()}-${rang}`;
      //  LA PLEINE RÉSOLUTION ET LA MINIATURE PARTENT ENSEMBLE. La
      //  miniature refusée n'est toujours pas une erreur : on garde
      //  la pleine résolution — plus lourd, jamais cassé.
      const [pleine, mini] = await Promise.all([
        supabase.storage
          .from(bucket)
          .upload(`${base}.jpg`, photo.fichier as File, { upsert: true }),
        photo.fichierMiniature
          ? supabase.storage
              .from(bucket)
              .upload(`${base}-mini.jpg`, photo.fichierMiniature, {
                upsert: true,
              })
          : Promise.resolve(null),
      ]);
      if (pleine.error) {
        throw new Error(
          `Une photo « ${libelleStyle(photo.style)} » n'a pas pu être envoyée (${pleine.error.message}).` +
            (reussies > 0
              ? ` Les ${reussies} déjà en ligne sont gardées : le prochain envoi ne reprendra que le reste.`
              : "")
        );
      }
      const url = supabase.storage.from(bucket).getPublicUrl(`${base}.jpg`)
        .data.publicUrl;
      const miniature =
        mini && !mini.error
          ? supabase.storage.from(bucket).getPublicUrl(`${base}-mini.jpg`)
              .data.publicUrl
          : url;
      const envoyee: PhotoTeleversee = { cle: photo.cle, url, miniature };
      distantes.set(photo.cle, envoyee);
      reussies += 1;
      surPhotoEnvoyee(envoyee);
    });

  await enPool(taches, CONNEXIONS_SIMULTANEES);
  return distantes;
}
