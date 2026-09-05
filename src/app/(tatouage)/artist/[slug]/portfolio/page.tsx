import type { Metadata } from "next";
import {
  metadonneesDeFiche,
  PageDeFiche,
  parametresDesFiches,
} from "../page-de-fiche";

/**
 * LE PORTFOLIO D'UN TATOUEUR — LES TATOUAGES (nº 873-§1)
 * =======================================================
 * Adresse : /artist/<slug>/portfolio
 *
 * La deuxième des trois pages d'un portfolio : les galeries de
 * TATOUAGES, par style — au doigt, le fil de galeries (§3) ; au web,
 * les galeries par style du profil. Son titre et sa canonique sont les
 * siens. Tout ce qui est commun aux trois pages vit dans
 * `../page-de-fiche.tsx` ; ce fichier ne fait que nommer sa vue.
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
  return metadonneesDeFiche(slug, "portfolio");
}

export default async function PagePortfolioTatoueur({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageDeFiche slug={slug} vue="portfolio" />;
}
