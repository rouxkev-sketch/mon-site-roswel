"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { lireDejaConnecte, souscrireStockage } from "@/lib/deja-connecte";
import { useUtilisateur } from "@/lib/use-utilisateur";

/**
 * LE BOUTON « CREATE YOUR PORTFOLIO » — RÉSERVÉ À QUI N'A JAMAIS EU DE COMPTE
 * ==================================================================
 * ██ nº 811 — LA RÈGLE DU PROPRIÉTAIRE ██
 * Au bas de la page About, deux boutons : « Find your style » et
 * celui-ci. Le second ne s'adresse qu'aux visiteurs qui n'ont JAMAIS
 * eu de compte ici — ceux qui lisent « Join » dans la barre. Un
 * REVENANT (compte existant, session fermée, il lit « Log in ») connaît
 * déjà la porte ; un CONNECTÉ l'a franchie. Pour ces deux-là, il ne
 * reste qu'un bouton, « Find your style ».
 *
 * MÊME DÉTECTION QUE JOIN / LOG IN (nº 809), ET SANS CLIGNOTEMENT :
 *  · AVANT L'HYDRATATION, la page est prérendue et ne connaît aucune
 *    session : le bouton est dans le HTML, marqué « muet »
 *    (`data-session="muette"`), et c'est le CSS (globals.css, nº 811)
 *    qui décide d'après `html[data-compte]`, posé par le script
 *    d'avant peinture : « nouveau » → il se montre dès le premier
 *    pixel ; « revenant » ou « connecte » → il n'est jamais peint ;
 *  · APRÈS, ce composant lit les deux mêmes signaux que la barre — la
 *    session (`useUtilisateur`) et le drapeau « déjà connecté ici »
 *    (`lib/deja-connecte`, le cookie que le script lit lui aussi) — et
 *    ne rend RIEN pour un revenant ou un connecté. Les deux moitiés
 *    lisent les mêmes cookies : elles ne peuvent pas se contredire.
 * ⚠️ POURQUOI `pret` COMMANDE : tant que la session n'est pas connue,
 * le bouton reste dans l'arbre, « muet » — c'est le CSS qui parle. Dès
 * qu'elle l'est, c'est le composant. Un revenant ne voit donc jamais
 * le bouton paraître pour disparaître (règle nº 203 : aucun état faux
 * peint).
 *
 * CE QU'IL ÉTAIT AVANT (nº 324) : toujours affiché, sa DESTINATION
 * suivait le visiteur (connecté → « Ma sélection », sinon la page de
 * compte). Le cas connecté n'existe plus : le bouton mène à la page de
 * compte, qui s'ouvre d'elle-même sur « Sign up » pour un nouveau
 * venu (le drapeau « déjà venu » n'étant pas posé — voir
 * EcranAuthentification). Aucun paramètre d'adresse à forcer.
 *
 * ⚠️ SON APPARENCE NE VIENT PAS D'ICI : les classes sont passées par la
 * page, comme depuis la nº 321. Le lien reste un vrai `<Link>` : un clic
 * du milieu ouvre un onglet, comme partout ailleurs.
 */
export function BoutonCreerPortfolio({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { utilisateur, pret } = useUtilisateur();
  //  `false` au serveur et à l'hydratation : le drapeau ne se lit que
  //  dans le navigateur — et pendant ce temps, c'est le CSS qui décide.
  const dejaConnecte = useSyncExternalStore(
    souscrireStockage,
    lireDejaConnecte,
    () => false
  );
  if (pret && (utilisateur || dejaConnecte)) return null;

  return (
    <Link
      href="/devenir-tatoueur"
      //  Le banc lit ces marqueurs : `data-session` dit qui décide
      //  (le CSS tant que « muette », le composant ensuite).
      data-bouton-creer-portfolio=""
      data-session={pret ? "prete" : "muette"}
      className={className}
    >
      {children}
    </Link>
  );
}
