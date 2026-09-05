import type { Metadata } from "next";
import {
  metadonneesDeFiche,
  PageDeFiche,
  parametresDesFiches,
} from "../page-de-fiche";

/**
 * LES FLASHS D'UN TATOUEUR — LES PLANCHES (nº 873-§1)
 * ====================================================
 * Adresse : /artist/<slug>/flash
 *
 * La troisième des trois pages d'un portfolio : les galeries de FLASHS,
 * par style — au doigt, le fil de galeries (§3) ; au web, les galeries
 * par style du profil. Elle existe TOUJOURS, même sans flash (§2 :
 * l'onglet est toujours là) et dit alors « No flash yet. » (§4). Son
 * titre et sa canonique sont les siens. Tout ce qui est commun aux
 * trois pages vit dans `../page-de-fiche.tsx` ; ce fichier ne fait que
 * nommer sa vue.
 */

/** nº 359 — prérendue et régénérée (5 min, comme le profil). */
export const revalidate = 300;

export async function generateStaticParams() {
  return parametresDesFiches();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return metadonneesDeFiche(slug, "flash");
}

export default async function PageFlashTatoueur({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageDeFiche slug={slug} vue="flash" />;
}
