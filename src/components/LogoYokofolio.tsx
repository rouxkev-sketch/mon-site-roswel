/* eslint-disable @next/next/no-img-element */
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";

/**
 * LE LOGO DE YOKOFOLIO
 * ===================
 * DEUX FICHIERS, DÉPOSÉS À LA MAIN par le propriétaire, affichés tels
 * quels : le code ne les fabrique pas, ne les retouche pas, ne les
 * recadre pas — exactement la règle des logos de Roswel (AGENTS.md).
 *  - public/yokofolio-logo.png  : le logo complet (cœur + nom) ;
 *  - public/yokofolio-icone.png : le cœur seul, carré.
 *
 * Composant à part, et non une variante de Logo.tsx : celui-ci sert
 * les autres produits, il ne doit pas changer.
 *
 * `hauteur` est la hauteur d'affichage en pixels ; la largeur suit
 * (`w-auto`). Les attributs width/height réservent la place dès le
 * premier rendu, pour que la barre ne saute pas quand l'image arrive.
 * Si le logo complet est nettement plus large ou plus étroit que 4
 * pour 1, ajuster RATIO_LOGO — ce seul nombre.
 */
const RATIO_LOGO = 4;

export function LogoYokofolio({
  hauteur = 32,
  classe,
  variante = "complet",
}: {
  hauteur?: number;
  classe?: string;
  /** « icone » = le cœur seul (carré), pour les petits écrans. */
  variante?: "complet" | "icone";
}) {
  const icone = variante === "icone";
  const largeur = icone ? hauteur : Math.round(hauteur * RATIO_LOGO);

  return (
    <img
      src={icone ? MARQUE_YOKOFOLIO.icone : MARQUE_YOKOFOLIO.logo}
      alt={MARQUE_YOKOFOLIO.nom}
      width={largeur}
      height={hauteur}
      // Non déplaçable : une image qui se laisse « traîner » avale les
      // clics légèrement glissés quand elle sert de lien (le logo).
      draggable={false}
      className={classe ?? "w-auto"}
      style={{
        height: classe ? undefined : hauteur,
        objectFit: "contain",
        objectPosition: "left center",
      }}
    />
  );
}
