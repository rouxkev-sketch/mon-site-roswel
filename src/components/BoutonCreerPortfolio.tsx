"use client";

import Link from "next/link";
import { ARRIVEE_SANS_PORTFOLIO } from "@/config/tatouage";
import { useUtilisateur } from "@/lib/use-utilisateur";

/**
 * LE BOUTON « CRÉE TON PORTFOLIO » — SA DESTINATION SUIT LE VISITEUR
 * ==================================================================
 * (§3, passe nº 324)
 *
 * Il menait toujours au même endroit, `/devenir-tatoueur`. Pour
 * quelqu'un de DÉJÀ CONNECTÉ, c'était lui proposer de créer le compte
 * qu'il a — un cul-de-sac poli. Désormais :
 *
 *  · PAS DE COMPTE → `/devenir-tatoueur`, la page de compte. Elle
 *    s'ouvre d'elle-même sur « Créer mon compte » : son onglet par
 *    défaut DÉRIVE du drapeau « déjà venu », qui n'est pas posé chez
 *    un nouveau venu (voir EcranAuthentification). On ne force donc
 *    rien par l'adresse — c'est le comportement du site, pas un
 *    réglage de plus.
 *  · CONNECTÉ → `ARRIVEE_SANS_PORTFOLIO`, c'est-à-dire « Ma
 *    sélection ». ⚠️ LA CONSTANTE, PAS LE CHEMIN ÉCRIT À LA MAIN :
 *    c'est déjà elle qui décide où l'on retombe après une connexion
 *    (voir config/tatouage). Deuxième écriture = deux endroits à
 *    corriger le jour où « Ma sélection » déménage.
 *
 * ⚠️ LE TROISIÈME CAS, celui que la consigne ne nomme pas : un compte
 * qui EXISTE mais dont la session est fermée. Il tombe avec les
 * déconnectés sur `/devenir-tatoueur` — et là, le drapeau « déjà
 * venu » ÉTANT posé, la page s'ouvre sur « Me connecter ». C'est ce
 * qu'il faut : on ne propose pas de créer un compte à qui en a un.
 *
 * ⚠️ POURQUOI UN COMPOSANT CLIENT, ET POURQUOI ÇA NE CLIGNOTE PAS.
 * L'état de connexion ne peut se lire qu'à l'exécution. `useUtilisateur`
 * est fait pour ça SANS bascule visible : le serveur lit le cookie de
 * session et le passe par contexte, donc le HTML envoyé porte DÉJÀ la
 * bonne destination — rien à corriger à l'hydratation (voir la note
 * de lib/use-utilisateur). Le lien reste un vrai `<Link>` : un clic du
 * milieu ouvre un onglet, comme partout ailleurs.
 *
 * ⚠️ SON APPARENCE NE VIENT PAS D'ICI. Les classes sont passées par la
 * page — le §3 de la nº 324 ne touche QUE la destination, et le bouton
 * gris posé au §5 de la nº 321 garde son habit au pixel.
 */
export function BoutonCreerPortfolio({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { utilisateur } = useUtilisateur();
  const destination = utilisateur
    ? ARRIVEE_SANS_PORTFOLIO
    : "/devenir-tatoueur";

  return (
    <Link
      href={destination}
      //  Le banc lit ces deux marqueurs : ils disent CE QUE LE BOUTON A
      //  DÉCIDÉ, sans qu'on ait à ouvrir une session pour le voir.
      data-bouton-creer-portfolio=""
      data-connecte={utilisateur ? "" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
