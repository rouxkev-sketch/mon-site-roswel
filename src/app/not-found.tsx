import type { Metadata } from "next";
import { PageMessageSombre } from "@/components/PageMessageSombre";

/**
 * LA PAGE INTROUVABLE — en français, à la charte (passe nº 176-§2)
 * ================================================================
 * Jusqu'ici, une adresse qui n'existe pas affichait la page BRUTE de
 * Next.js : « 404 — This page could not be found », en anglais, sur
 * fond blanc, sans rien du site. C'était la première chose qu'un
 * visiteur voyait quand un lien avait vieilli.
 *
 * ⚠️ ELLE EST À LA RACINE, ET C'EST VOULU : posée ici, elle répond
 * pour TOUTES les adresses inconnues du site, y compris celles qui
 * n'appartiennent à aucun groupe. Elle n'emprunte donc aucun habillage
 * de produit — elle porte le sien, celui de yokofolio.
 *
 * ⚠️ LE 404 RESTE RÉSERVÉ AUX ADRESSES QUI N'EXISTENT PAS. Une fiche
 * qui existe mais n'est pas encore publiée a sa propre page (voir
 * src/app/(tatouage)/tatoueur/[slug]/page.tsx) : ce n'est pas une
 * erreur d'adresse.
 */
export const metadata: Metadata = {
  title: "Page introuvable",
  //  Une page d'erreur n'a rien à faire dans un moteur de recherche.
  robots: { index: false, follow: false },
};

export default function PageIntrouvable() {
  return <PageMessageSombre titre="Cette page n'existe pas." />;
}
