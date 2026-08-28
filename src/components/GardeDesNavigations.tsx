"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * ██ LA GARDE DES NAVIGATIONS — ce qui reste du signe de chargement ██
 * ==================================================================
 * ██ §1 (nº 706) — LE TRAIT ROSE EST SUPPRIMÉ, LA GARDE RESTE ██
 * ------------------------------------------------------------------
 * CE FICHIER S'APPELAIT `SigneDeChargement` (nº 441/442/452/469). Le
 * propriétaire a retiré TOUS les traits de progression du site à la
 * nº 706 : l'attente d'une page se dit désormais par la page
 * elle-même (les squelettes des `loading.tsx`, posés à la même
 * passe), plus par un trait en haut de l'écran.
 *
 * ⚠️ MAIS CE COMPOSANT NE DESSINAIT PAS QU'UN TRAIT, et c'est la
 * raison d'être de ce qui suit : il porte DEUX GARDES DE NAVIGATION
 * que rien d'autre n'assure, et qui n'ont rien de décoratif —
 *
 *  · L'AVALEMENT DU RE-CLIC (§4 nº 441, règle 332-§1) : un second
 *    clic vers la MÊME destination pendant que la première navigation
 *    est en route est neutralisé ICI, en capture, avant le Link de
 *    Next — une seule navigation, une seule entrée d'historique.
 *    Sans lui, l'impatience fabrique des doublons d'historique, et
 *    c'est le retour qui se casse.
 *  · LE NON-ARMEMENT DES LIENS QUI NE NAVIGUENT PAS (nº 627,
 *    `data-sans-navigation`) : la loupe de la barre est un lien dont
 *    le clic est prévenu au doigt — sans cette marque, son attente
 *    fantôme avalait ensuite les clics légitimes vers l'accueil, et
 *    « la barre paraissait morte » (journal de la nº 626).
 *
 * L'ATTENTE, LE GARDE-FOU DE DOUZE SECONDES, LE NETTOYAGE À L'ARRIVÉE
 * ET AU DÉCHARGEMENT : tout cela reste, À L'IDENTIQUE — c'est le
 * squelette de l'avalement. Ce qui est parti, et rien d'autre :
 *  · le rendu du trait (le `<div>` fixe et son @keyframes, retiré de
 *    globals.css) ;
 *  · le seuil d'affichage des 200 ms (il ne servait qu'au trait) ;
 *  · la liste blanche des destinations (nº 469-§4) et la marque
 *    `data-signe-muet` (nº 452) : elles ne décidaient que de MONTRER
 *    ou non — il n'y a plus rien à montrer ;
 *  · le signe commandé à la main (nº 469-§3, « Mon compte » au doigt
 *    et « page en retard » nº 673) : c'était un trait sur commande,
 *    ses deux appelants sont nettoyés à cette passe.
 *
 * ⚠️ LA SURBRILLANCE AU CLIC DES ENTRÉES DE MENU (nº 677) N'A RIEN À
 * VOIR AVEC CE FICHIER et n'est pas touchée : c'est le retour « ton
 * clic est pris » des surfaces, pas un indicateur de chargement.
 */

/** Le garde-fou : une attente qui n'aboutit jamais (repli en
    navigation de document, réponse perdue) ne doit pas devenir une
    attente fantôme qui avalerait un clic légitime bien plus tard. */
const ATTENTE_MAXIMALE_MS = 12000;

export function GardeDesNavigations() {
  /*  La frontière <Suspense> est ICI, dans le composant : la mise en
      page racine n'a qu'à le poser. Sans elle, useSearchParams dans
      un composant client ferait basculer les pages prérendues en
      rendu client — la borne « ○ / » tomberait. */
  return (
    <Suspense fallback={null}>
      <Garde />
    </Suspense>
  );
}

function Garde() {
  const pathname = usePathname();
  const parametres = useSearchParams();

  /** La navigation en route : sa destination, son départ. */
  const attente = useRef<{ adresse: string; depuis: number } | null>(null);
  /** La dernière adresse que React a COMMISE — c'est elle qui permet
      de reconnaître une traversée qui n'a rien à charger (le cran du
      filet : même adresse avant et après). */
  const adresseCommise = useRef("");
  const minuteurLimite = useRef(0);

  /*  L'ARRIVÉE — chaque page ou recherche commise passe par ici. */
  useEffect(() => {
    const ici = window.location.pathname + window.location.search;
    adresseCommise.current = ici;
    /*  Une autre destination a été cliquée pendant l'attente : la
        première arrive, la seconde est encore en route — l'attente
        reste pour elle. */
    if (attente.current && attente.current.adresse !== ici) return;
    attente.current = null;
    window.clearTimeout(minuteurLimite.current);
  }, [pathname, parametres]);

  useEffect(() => {
    const demarrer = (adresse: string) => {
      attente.current = { adresse, depuis: Date.now() };
      window.clearTimeout(minuteurLimite.current);
      minuteurLimite.current = window.setTimeout(() => {
        attente.current = null;
      }, ATTENTE_MAXIMALE_MS);
    };

    /*  §1 (nº 442) — tout s'éteint d'un coup. Appelée quand le
        navigateur prend la navigation à son compte (lien natif,
        déchargement) : lui seul sait alors où il en est. */
    const eteindre = () => {
      attente.current = null;
      window.clearTimeout(minuteurLimite.current);
    };

    const surClic = (evenement: MouseEvent) => {
      if (evenement.defaultPrevented) return;
      if (evenement.button !== 0) return;
      if (
        evenement.metaKey ||
        evenement.ctrlKey ||
        evenement.shiftKey ||
        evenement.altKey
      ) {
        return;
      }
      const cible = evenement.target;
      if (!(cible instanceof Element)) return;
      const lien = cible.closest("a[href]");
      if (!(lien instanceof HTMLAnchorElement)) return;
      const fenetreCible = lien.getAttribute("target");
      if (fenetreCible && fenetreCible !== "_self") return;
      if (lien.hasAttribute("download")) return;
      /*  ██ §1 (nº 627) — UN LIEN QUI NE NAVIGUE PAS N'ARME RIEN ██
          ------------------------------------------------------------
          LE DÉFAUT QUE CETTE LIGNE FERME, mesuré par le propriétaire
          (journal de la nº 626) : la loupe de la barre est un
          `<a href="/">` dont le clic, AU DOIGT, est prévenu pour ouvrir
          la page de recherche — aucune navigation n'a jamais lieu. On
          armait pourtant une attente vers « / », et le contrôle de fin
          de clic la gardait (il lit `defaultPrevented`, vrai ici, et
          conclut « navigation douce »). L'attente vivait alors ses
          DOUZE SECONDES, et pendant tout ce temps le re-clic du §4
          avalait CHAQUE clic vers « / » — le logo comme la loupe. La
          barre paraissait morte. Preuve dans le journal : un clic entré
          en capture, aucune ligne en bulle — la propagation stoppée.
          ⚠️ LA MARQUE SORT AVANT TOUT : ni attente, ni avalement. Un
          lien marqué est un lien dont on sait qu'il n'ira nulle part ;
          il n'a donc rien à annoncer, et surtout rien à empêcher.
          ⚠️ ET RIEN D'AUTRE NE CHANGE : le garde-fou des douze
          secondes, le nettoyage à l'arrivée, le non-armement des liens
          natifs (nº 442) et l'avalement du re-clic (332-§1) restent
          entiers pour toutes les VRAIES navigations. */
      if (lien.closest("[data-sans-navigation]")) return;
      let adresseVisee: URL;
      try {
        adresseVisee = new URL(lien.href);
      } catch {
        return;
      }
      if (adresseVisee.origin !== window.location.origin) return;
      const adresse = adresseVisee.pathname + adresseVisee.search;
      const ici = window.location.pathname + window.location.search;
      //  Même adresse : une ancre, ou le rafraîchissement sur place —
      //  pas une navigation, et surtout pas un doublon à avaler.
      if (adresse === ici) return;
      //  §4 — LE RE-CLIC PENDANT L'ATTENTE : même destination déjà en
      //  route, on avale le clic tout entier (avant le Link de Next,
      //  avant les gestionnaires du site) — une seule navigation, une
      //  seule entrée (332-§1).
      const enRoute = attente.current;
      if (
        enRoute &&
        enRoute.adresse === adresse &&
        Date.now() - enRoute.depuis < ATTENTE_MAXIMALE_MS
      ) {
        evenement.preventDefault();
        evenement.stopPropagation();
        return;
      }
      //  L'armement reste SYNCHRONE (l'avalement du re-clic de la 441
      //  ne perd pas une milliseconde)…
      demarrer(adresse);
      //  §1 (nº 442) — …mais à la FIN du clic, on lit qui a pris la
      //  navigation. Le Link de Next et les cartes préviennent le
      //  geste par défaut : navigation douce, l'attente est à nous.
      //  Personne ne l'a prévenu : c'est le NAVIGATEUR qui navigue
      //  (le logo, règle 247 — un lien natif) — l'attente s'éteint
      //  dans l'instant, il n'y a rien à garder. setTimeout(0) et non
      //  une microtâche : la microtâche s'exécute entre deux
      //  écouteurs, AVANT le gestionnaire du lien — trop tôt pour
      //  lire defaultPrevented.
      window.setTimeout(() => {
        if (evenement.defaultPrevented) return;
        eteindre();
      }, 0);
    };

    const surTraversee = () => {
      //  `popstate` : l'adresse a DÉJÀ changé. Si elle est celle que
      //  React a commise en dernier (le cran du filet, l'étape d'une
      //  surface — même adresse), il n'y a rien à charger : pas
      //  d'attente. Sinon, le routeur va réconcilier — même attente,
      //  même garde-fou que les clics.
      const ici = window.location.pathname + window.location.search;
      if (ici === adresseCommise.current) return;
      demarrer(ici);
    };

    //  §1 (nº 442) — LE DÉCHARGEMENT ÉTEINT TOUT : une navigation
    //  douce qui dégénère en chargement de document (repli nº 428,
    //  fiche injoignable) passe le relais au navigateur — et
    //  l'attente s'efface, pour qu'un retour depuis le cache du
    //  navigateur reparte propre.
    const surDechargement = () => eteindre();

    //  CAPTURE, et sans « passif » : l'avalement du re-clic (§4) doit
    //  pouvoir prévenir le geste. Les clics ordinaires, eux, ne sont
    //  ni retardés ni modifiés — une lecture, rien de plus.
    document.addEventListener("click", surClic, true);
    window.addEventListener("popstate", surTraversee, { passive: true });
    window.addEventListener("pagehide", surDechargement, { passive: true });
    return () => {
      document.removeEventListener("click", surClic, true);
      window.removeEventListener("popstate", surTraversee);
      window.removeEventListener("pagehide", surDechargement);
      window.clearTimeout(minuteurLimite.current);
    };
  }, []);

  return null;
}
