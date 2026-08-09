"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  demanderRestaurationPosition,
  lireDerniereAdresseOnglet,
  lirePagePrecedente,
} from "@/lib/navigation-session";

/**
 * ON NE RESTE JAMAIS PIÉGÉ SUR UNE FICHE
 * =======================================
 * LE DÉFAUT CORRIGÉ : fermer complètement Chrome depuis une fiche, puis
 * le rouvrir. On retombe bien sur la fiche — c'est voulu — mais LE
 * RETOUR ARRIÈRE NE FAIT PLUS RIEN. L'historique du navigateur est mort
 * avec l'application : l'onglet n'a plus qu'une seule étape, et il n'y a
 * donc plus rien derrière. Même chose pour une fiche ouverte depuis un
 * lien partagé dans une application qui n'a pas d'historique à elle.
 *
 * LE CHOIX : ON RECONSTRUIT L'ÉTAPE MANQUANTE, on n'ajoute pas de
 * bouton. Deux raisons.
 *  1. Le geste existe déjà et il est universel : le balayage depuis le
 *     bord de l'écran. C'est celui que l'on fait sans y penser — lui
 *     répondre vaut mieux que d'apprendre un nouveau bouton.
 *  2. La fiche mobile a été DÉBARRASSÉE de sa flèche de retour et de sa
 *     barre fixe (passe 61), volontairement. Les remettre pour ce seul
 *     cas rendrait la page différente selon la façon dont on y est
 *     arrivé — le pire des deux mondes.
 *
 * COMMENT : on empile une étape SANS ADRESSE (`pushState` à deux
 * arguments — jamais trois : passer une adresse fait repartir le
 * routeur de Next, voir PageRechercheMobile). L'onglet a désormais deux
 * étapes ; le retour arrière en dépile une, produit un `popstate`, et
 * c'est nous qui décidons alors où aller : la MOSAÏQUE que le journal
 * persistant a retenue, ou l'accueil à défaut. Jamais nulle part.
 *
 * `replace` et non `push` : l'étape de secours a servi, elle disparaît.
 * L'utilisateur se retrouve sur la mosaïque avec un historique propre —
 * un nouveau retour sort du site, ce qui est le comportement normal
 * quand on est arrivé directement sur une page.
 *
 * QUAND : uniquement sur une FICHE, uniquement sur un vrai mobile, et
 * uniquement si l'onglet n'a VRAIMENT rien derrière lui
 * (`history.length <= 1`). Un parcours normal — mosaïque puis fiche — a
 * son étape précédente : on ne touche à rien.
 */
export function RetourGaranti() {
  const chemin = usePathname();

  useEffect(() => {
    if (document.documentElement.dataset.appareil !== "mobile") return;
    if (!chemin.startsWith("/tatoueur/")) return;
    // Il reste une étape derrière : le navigateur fait son travail.
    if (window.history.length > 1) return;

    const adresse = chemin + window.location.search;
    // La reprise de session est peut-être en train de nous renvoyer
    // ailleurs (RepriseSession, monté juste avant) : on la laisse finir,
    // la page d'arrivée montera ce composant à son tour.
    const derniereOnglet = lireDerniereAdresseOnglet();
    if (derniereOnglet && derniereOnglet !== adresse) return;

    /** Où l'on veut pouvoir revenir. */
    const retour = lirePagePrecedente() ?? "/";
    if (retour === adresse) return;

    let aNous = true;
    window.history.pushState({ retourReconstruit: true }, "");

    function auRetour() {
      if (!aNous) return;
      aNous = false;
      // La mosaïque revient AUSSI à sa position : c'est la règle
      // unique de restitution (voir lib/navigation-session).
      demanderRestaurationPosition(retour);
      // ⚠️ `location.replace` ET NON le routeur de Next. Mesuré : une
      // navigation du routeur lancée DEPUIS un `popstate` ne part pas —
      // le routeur est occupé à traiter la traversée qu'on vient de
      // provoquer. Le remplacement du navigateur, lui, aboutit
      // toujours. C'est déjà ce que fait la reprise de session pour la
      // même raison, et l'étape consommée disparaît proprement.
      window.location.replace(retour);
    }

    window.addEventListener("popstate", auRetour);
    return () => {
      aNous = false;
      window.removeEventListener("popstate", auRetour);
    };
  }, [chemin]);

  return null;
}
