import { SqueletteRecherche } from "@/components/SquelettesDePage";

/**
 * ██ §2 (nº 706) — LA RECHERCHE RÉPOND AU CLIC ██
 * ------------------------------------------------------------------
 * Cette page est DYNAMIQUE (`force-dynamic`) : chaque navigation vers
 * elle attend le serveur (~1 s en production, audit nº 705) — et
 * pendant ce temps, RIEN ne bougeait à l'écran. Ce fichier est peint
 * par le routeur DÈS LE CLIC : le cadre de la page, ses zones grises,
 * puis les vraies cartes le remplacent.
 * ⚠️ LE RETOUR NE PASSE PAS PAR ICI : une navigation arrière est
 * servie par la réserve du routeur, page complète d'un coup — la
 * restitution de position (nº 653/661) garde sa hauteur définitive
 * dès la première peinture (nº 191). Éprouvé au banc de la passe.
 */
export default function ChargementRecherche() {
  return <SqueletteRecherche />;
}
