import { SqueletteSelection } from "@/components/SquelettesDePage";

/**
 * §2 (nº 706) — « MA SÉLECTION » RÉPOND AU CLIC : la page est
 * dynamique (session + favoris lus avant le premier octet, audit
 * nº 705). Le squelette montre sa vraie silhouette — la barre, la
 * rangée des deux menus, la mosaïque — voir `SquelettesDePage`.
 * (Le trait rose qui accompagnait cette attente est supprimé à la
 * même passe : le squelette le remplace.)
 */
export default function ChargementSelection() {
  return <SqueletteSelection />;
}
