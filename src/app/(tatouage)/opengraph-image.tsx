import { ImageResponse } from "next/og";
import {
  CACHE_PARTAGE,
  CompositionMarque,
  logoDeMarque,
  TAILLE_PARTAGE,
  TYPE_PARTAGE,
} from "@/lib/image-partage";

/**
 * L'IMAGE DE PARTAGE DE MARQUE — l'accueil, et le filet de sécurité
 * ==================================================================
 * Ce fichier est posé À LA RACINE du groupe « (tatouage) ». Or les
 * images de partage S'HÉRITENT : toute page de yokofolio qui ne
 * fabrique pas la sienne prend celle-ci. Elle couvre donc, sans une
 * ligne de plus :
 *  · l'ACCUEIL (/) ;
 *  · les PAGES FIXES — about, contact, legal (nº 811) :
 *    la marque suffit, elles n'ont rien de particulier à montrer ;
 *  · et TOUT LE RESTE (devenir tatoueur, espace, admin…), qui n'a
 *    aucune raison de se retrouver dans une conversation, mais qui ne
 *    doit jamais afficher un rectangle vide s'il y atterrit.
 *
 * ELLE NE COÛTE RIEN. Aucune lecture de base, aucune photo à
 * rapatrier : Next la fabrique UNE FOIS, à la construction du site, et
 * la sert ensuite comme un fichier. Le nombre de partages n'y change
 * strictement rien.
 */

export const alt =
  "YokoFolio — Your next tattoo starts with a style";
export const size = TAILLE_PARTAGE;
export const contentType = TYPE_PARTAGE;

export default async function ImagePartageMarque() {
  const logo = await logoDeMarque();

  return new ImageResponse(
    (
      <CompositionMarque
        logo={logo}
        titre="Your next tattoo starts with a style"
        sousTitre="Compare tattoo artists' portfolios, by style and city."
      />
    ),
    { ...size, headers: { "cache-control": CACHE_PARTAGE } }
  );
}
