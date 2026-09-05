import type { Metadata } from "next";
import {
  metadonneesDeFiche,
  PageDeFiche,
  parametresDesFiches,
} from "./page-de-fiche";

/**
 * LA FICHE D'UN TATOUEUR — LE PROFIL
 * ===================================
 * Adresse : /artist/<slug>  (ex. /artist/atelier-corvus)
 *
 * §1 (nº 873) — C'EST LA PREMIÈRE DES TROIS PAGES D'UN PORTFOLIO : le
 * profil (l'en-tête et les infos). Le portfolio et les flashs ont les
 * leurs, à côté (portfolio/page.tsx, flash/page.tsx). Tout ce que les
 * trois partagent est écrit UNE fois dans `page-de-fiche.tsx` ; ce
 * fichier ne fait que nommer sa vue — et porter ce que Next exige en
 * clair dans une route : la régénération et les paramètres préparés.
 */

/** nº 359 — prérendue et régénérée (5 min, comme l'accueil). */
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
  return metadonneesDeFiche(slug, "profil");
}

export default async function PageFicheTatoueur({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PageDeFiche slug={slug} vue="profil" />;
}
