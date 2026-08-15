import {
  imagePartageDeLaFiche,
  texteAlternatifPartage,
} from "@/lib/image-partage-fiche";
import { TAILLE_PARTAGE, TYPE_PARTAGE } from "@/lib/image-partage";

/**
 * L'IMAGE DE PARTAGE PAR DÉFAUT D'UNE FICHE
 * ==========================================
 * ⚠️ LA COMPOSITION A DÉMÉNAGÉ (nº 281-§2) : elle vit dans
 * `lib/image-partage-fiche`, parce qu'un SECOND appelant en a besoin —
 * la route `/tatoueur/<slug>/partage`, qui rend la même image POUR LE
 * CARROUSEL que l'adresse partagée désigne. Next appelle ce
 * fichier-ci avec le SLUG SEUL (jamais les paramètres d'adresse) :
 * c'est précisément pour cela qu'il fallait une seconde porte.
 * Ce fichier reste donc l'aperçu par défaut — celui d'un lien nu — et
 * rien de ce qu'il montrait n'a changé.
 */

export const size = TAILLE_PARTAGE;
export const contentType = TYPE_PARTAGE;

/**
 * ⚠️ CETTE IMAGE SE FABRIQUE À LA DEMANDE, PAS À LA CONSTRUCTION.
 * Sans cette ligne, Next essaie de la préfabriquer comme un fichier
 * statique. Or la lire suppose de lire la fiche en base — et la
 * lecture publique passe par un client Supabase qui consulte les
 * cookies. Pendant une préfabrication, les cookies n'existent pas :
 * la lecture échoue silencieusement, la fiche paraît introuvable, et
 * TOUTES les fiches retombent sur l'image de marque. Le défaut est
 * invisible (aucune erreur, une image correcte s'affiche) et rend la
 * passe entière inutile — d'où ce mot, et ce commentaire.
 */
export const dynamic = "force-dynamic";

/** LE TEXTE ALTERNATIF, ÉCRIT POUR CETTE FICHE-LÀ (voir la note de
    `texteAlternatifPartage` : la lecture est partagée avec la page). */
export async function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  return [
    {
      id: "partage",
      size,
      contentType,
      alt: await texteAlternatifPartage(params.slug),
    },
  ];
}

export default async function ImagePartageFiche({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return imagePartageDeLaFiche(slug);
}
