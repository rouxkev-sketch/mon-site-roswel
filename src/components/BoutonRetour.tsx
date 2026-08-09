"use client";

import { useRouter } from "next/navigation";
import { IconeFlecheRetour } from "@/components/Icones";
import {
  demanderRestaurationPosition,
  lirePagePrecedente,
  ongletADejaNavigue,
} from "@/lib/navigation-session";

/**
 * Flèche de retour (en haut de la fiche artisan).
 * - Fiche ouverte depuis le site (liste de résultats, favoris…) :
 *   vrai retour arrière — la liste de résultats se retrouve avec la
 *   recherche ET la position de défilement conservées.
 * - Historique perdu (application relancée après une longue
 *   inactivité, onglet dupliqué…) : le journal PERSISTANT connaît
 *   encore la liste — on y navigue, position restaurée quand même.
 * - Fiche ouverte directement (lien partagé, adresse tapée…) :
 *   direction l'accueil.
 * window.history.length seul n'est pas fiable pour distinguer ces
 * cas — d'où le journal de navigation (lib/navigation-session).
 */
export function BoutonRetour({
  variante = "flottant",
}: {
  /** « flottant » (défaut) : disque blanc ombré posé sur la photo, en
      haut de la fiche < 640 px.
      « bandeau » : carré aux angles arrondis, SANS contour, posé sur le
      gris du bandeau — exactement le gabarit des boutons favori et
      partage à sa droite (48 px, angles 12 px, icône grise).
      « sombre » : disque yokofolio SANS contour — un fond légèrement
      plus clair que l'interface (blanc translucide) qui met l'icône
      blanche en valeur, sur une photo comme sur le fond de page ;
      survol : légère accentuation.
      « contour » : badge aux angles arrondis, CONTOUR BLANC et flèche
      blanche sur le fond du site — nettement plus visible qu'une
      simple flèche. Au survol, contour et flèche passent en rose.
      C'est le retour de la fiche yokofolio sur le web, posé devant le
      fil d'Ariane. */
  variante?: "flottant" | "bandeau" | "sombre" | "contour";
} = {}) {
  const router = useRouter();

  // Le MÊME comportement de retour pour les deux habillages : seule
  // l'apparence du bouton change d'une largeur d'écran à l'autre.
  function retourner() {
    const precedente = lirePagePrecedente();
    // Vrai retour arrière SEULEMENT si cet onglet a déjà
    // navigué dans le site (sinon l'entrée précédente de
    // l'historique est une page extérieure)
    if (precedente && ongletADejaNavigue() && window.history.length > 1) {
      router.back();
    } else if (precedente) {
      // historique perdu (application relancée, onglet neuf…) :
      // on RECONSTRUIT le retour vers la liste, position comprise
      demanderRestaurationPosition();
      router.push(precedente);
    } else {
      router.push("/");
    }
  }

  if (variante === "contour") {
    return (
      <button
        type="button"
        aria-label="Revenir en arrière"
        onClick={retourner}
        className="w-10 h-10 rounded-xl border border-white bg-sombre-fond
                   flex items-center justify-center text-white
                   hover:border-primaire hover:text-primaire
                   transition-colors shrink-0"
      >
        <IconeFlecheRetour taille={20} />
      </button>
    );
  }

  if (variante === "sombre") {
    return (
      <button
        type="button"
        aria-label="Revenir en arrière"
        onClick={retourner}
        className="w-10 h-10 rounded-full bg-white/15 backdrop-blur
                   flex items-center justify-center text-white
                   hover:bg-white/25 transition-colors shrink-0"
      >
        <IconeFlecheRetour taille={20} />
      </button>
    );
  }

  if (variante === "bandeau") {
    return (
      <button
        type="button"
        aria-label="Revenir en arrière"
        onClick={retourner}
        className="w-12 h-12 rounded-xl bg-fond flex items-center justify-center text-encre-douce hover:bg-fond-doux active:scale-95 transition shrink-0"
      >
        <IconeFlecheRetour taille={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Revenir en arrière"
      onClick={retourner}
      className="w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center text-lg active:scale-95 transition-transform"
    >
      <span aria-hidden>←</span>
    </button>
  );
}
