import {
  imagePartageDeLaFiche,
  type TagsPartage,
} from "@/lib/image-partage-fiche";
import { natureCherchee, styleConnu } from "@/lib/tatoueurs";
import { SLUGS_RENDUS } from "@/lib/photos-tatoueur";

/**
 * ██ L'IMAGE D'APERÇU D'UN CARROUSEL PARTAGÉ (nº 281-§2) ██
 * ==================================================================
 * ADRESSE : /tatoueur/<slug>/partage?style=…&nature=…&rendu=…
 *
 * POURQUOI ELLE EXISTE. Depuis la nº 280-§3, le lien qu'on partage
 * porte le carrousel qu'on regardait. L'aperçu que fabriquent WhatsApp
 * ou Facebook, lui, venait de `opengraph-image.tsx` — un fichier que
 * Next appelle avec LE SLUG SEUL, sans les paramètres de l'adresse.
 * Le lien menait donc à des flashs en réalisme pendant que l'image
 * montrait la vitrine de la fiche.
 * CETTE ROUTE EST UNE ROUTE ORDINAIRE : elle reçoit les paramètres, et
 * rend LA MÊME composition (lib/image-partage-fiche) avec la première
 * photo du carrousel demandé. Les métadonnées de la page l'annoncent
 * dès que l'adresse porte des tags (voir `generateMetadata`).
 *
 * ⚠️ LES TAGS SONT NETTOYÉS avec les MÊMES fonctions que le reste du
 * site (`styleConnu`, `natureCherchee`, `renduCherche`) : une adresse
 * bricolée à la main ne peut donc pas faire dire n'importe quoi à
 * l'image — au pire elle ne désigne aucun carrousel, et l'on retombe
 * sur la photo de la fiche. Jamais d'image vide, jamais d'erreur.
 *
 * ⚠️ À LA DEMANDE, comme l'autre : lire la fiche passe par un client
 * Supabase qui consulte les cookies, ce qu'une préfabrication n'a pas.
 */
export const dynamic = "force-dynamic";

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const adresse = new URL(requete.url);
  const rendu = adresse.searchParams.get("rendu") ?? "";
  const tags: TagsPartage = {
    style: styleConnu(adresse.searchParams.get("style") ?? undefined),
    nature: natureCherchee(adresse.searchParams.get("nature") ?? undefined),
    //  Le rendu est validé contre LA liste du site (`SLUGS_RENDUS`) —
    //  la même que lisent les photos. Un mot inconnu est ignoré, il ne
    //  vide jamais l'image.
    rendu: SLUGS_RENDUS.has(rendu) ? rendu : "",
  };
  return imagePartageDeLaFiche(slug, tags);
}
