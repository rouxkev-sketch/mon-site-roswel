"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * ██ §1 (nº 441) — LE SIGNE DE CHARGEMENT, UN SEUL, POUR TOUT LE SITE ██
 * ==================================================================
 * LE DÉFAUT (relevé du propriétaire, ordinateur ET mobile) : clic sur
 * « Ma sélection », « Mon compte »… — ces destinations sont des pages
 * DYNAMIQUES (fabriquées à la demande, les ƒ du tableau de
 * compilation) : pendant un long moment, RIEN ne bouge à l'écran. On
 * croit que le clic n'a pas pris, on reclique.
 *
 * CE QUE CE COMPOSANT FAIT — et c'est le mécanisme CENTRAL, pas un
 * pansement par lien :
 *
 *  1. DÉPART — il écoute les clics en CAPTURE sur tout `a[href]`
 *     INTERNE (même origine, pas de target, pas de download, pas de
 *     touche modificatrice, bouton principal) et les traversées
 *     d'historique (`popstate`, en passif). Un clic vers l'adresse où
 *     l'on est déjà n'est PAS un départ (c'est le rafraîchissement
 *     sur place — rafraichirSiDejaLa — il garde son chemin) ; une
 *     traversée qui atterrit à l'adresse déjà commise non plus (le
 *     cran du filet, les étapes des surfaces : rien à charger).
 *
 *  2. LE SEUIL ANTI-CLIGNOTEMENT — le trait n'apparaît qu'après
 *     200 ms d'attente. Les pages prérendues, l'ouverture des
 *     fenêtres superposées (pushState immédiat) et les retours
 *     instantanés aboutissent avant : ils ne montrent RIEN.
 *
 *  3. ARRIVÉE — la page commise se lit dans `usePathname` et
 *     `useSearchParams` (sous <Suspense> : la lecture des paramètres
 *     par un composant client exige cette frontière pour ne pas
 *     priver « / » de son prérendu — le tableau de compilation en
 *     reste la preuve). Le trait disparaît, l'attente s'efface. Si
 *     une AUTRE destination a été cliquée entre-temps, l'arrivée de
 *     la première ne coupe pas le trait de la seconde (comparaison
 *     d'adresses). Garde-fou : 12 s, puis tout s'éteint — jamais un
 *     trait menteur.
 *
 *  4. §4 DE LA PASSE — LE RE-CLIC PENDANT L'ATTENTE EST AVALÉ : un
 *     second clic vers la MÊME destination pendant que la première
 *     navigation est en route est neutralisé ICI (preventDefault +
 *     stopPropagation, en capture — avant le Link de Next et avant
 *     tout gestionnaire du site) : une seule navigation, une seule
 *     entrée d'historique (règle 332-§1). Un clic vers une AUTRE
 *     destination passe, lui, normalement (changer d'avis est un
 *     droit — c'est le routeur qui arbitre, comme aujourd'hui).
 *
 *  5. ██ §1 (nº 442) — JAMAIS DEUX INDICATEURS EN MÊME TEMPS ██
 *     Certains liens sont NATIFS — le logo en tête (règle 247 :
 *     chaque clic y est une navigation de document VOULUE) — et le
 *     navigateur affiche alors SON propre indicateur de chargement.
 *     Le trait rose ne vit que là où le navigateur est muet : les
 *     navigations douces du routeur. Deux ceintures :
 *      · LE NON-ARMEMENT DES LIENS NATIFS — à la fin du clic
 *        (setTimeout 0 : après TOUS les gestionnaires, capture et
 *        bouillonnement — une microtâche s'exécuterait entre deux
 *        écouteurs, AVANT le gestionnaire du lien, trop tôt), on lit
 *        qui a pris la navigation. Le Link de Next et les cartes
 *        PRÉVIENNENT le geste par défaut : navigation douce, le
 *        trait est à nous. Personne ne l'a prévenu : c'est le
 *        navigateur qui navigue — l'armement est éteint dans
 *        l'instant, bien avant le seuil des 200 ms, le trait
 *        n'apparaît jamais. (L'armement, lui, reste posé en
 *        SYNCHRONE au clic : l'avalement du re-clic de la 441 ne
 *        perd pas une milliseconde.)
 *      · L'EXTINCTION AU DÉCHARGEMENT (`pagehide`) — une navigation
 *        douce peut DÉGÉNÉRER en chargement de document (le repli
 *        nº 428, une fiche injoignable passée à location.assign) :
 *        au déchargement, tout s'éteint — attente comprise, pour
 *        qu'un retour depuis le cache du navigateur reparte propre.
 *
 * ⚠️ CE QU'IL NE FAIT JAMAIS : il n'écrit RIEN dans l'historique
 * (aucun pushState, replaceState, back), ne mémorise rien (règles
 * 328/329 : le signe est purement visuel), ne peint aucun état de
 * compte (règle 203), et ne touche à aucune mécanique existante —
 * filet 423, réparation 428/429, fermeture 438 : il écoute, c'est
 * tout. Les navigations PROGRAMMÉES du moteur de recherche
 * (router.replace depuis des boutons) ne passent pas par lui : les
 * résultats ont déjà leur propre signal (l'estompage aria-busy).
 *
 * L'APPARENCE : un trait de 2 px, en haut, dans le ROSE du site
 * (`bg-primaire` — aucune couleur inventée), au-dessus de tout
 * (z-[96], un cran au-dessus de la fenêtre d'envoi qui plafonnait
 * l'échelle à 95). Son avancée est asymptotique (voir le
 * @keyframes nº 441 de globals.css) : elle ne prétend jamais finir —
 * c'est l'arrivée réelle qui l'éteint. Même signe web et mobile.
 */

/** Le délai avant d'afficher : une navigation qui aboutit avant ne
    montre rien — c'est la règle anti-clignotement de la passe. */
const DELAI_AVANT_SIGNE_MS = 200;
/** Le garde-fou : une attente qui n'aboutit jamais (repli en
    navigation de document, réponse perdue) ne laisse ni un trait
    menteur à l'écran, ni une attente fantôme qui avalerait un clic
    légitime bien plus tard. */
const ATTENTE_MAXIMALE_MS = 12000;

/**
 * ██ §4 (nº 469) — LE TRAIT NE VIT PLUS QU'À DEUX ENDROITS ██
 * ==================================================================
 * Sur consigne du propriétaire : le trait rose n'apparaît QUE pour
 *  · l'ouverture de « Ma sélection » (`/mes-favoris`) — par un lien
 *    ou par une traversée d'historique qui doit la recharger ;
 *  · l'ouverture de « Mon compte » au doigt (le signe COMMANDÉ,
 *    §3 ci-dessous).
 * PARTOUT AILLEURS il est supprimé — la page de recherche du doigt en
 * tête (le tap de loupe armait une attente vers « / » qu'aucune
 * navigation ne venait clore : un trait pour rien).
 * ⚠️ LE MÉCANISME, LUI, NE CHANGE PAS : chaque départ ARME toujours
 * son attente — l'avalement du re-clic (§4 nº 441, règle 332-§1), le
 * nettoyage à l'arrivée, le non-armement des liens natifs (nº 442) et
 * le garde-fou restent entiers pour TOUTES les navigations. C'est la
 * LISTE DE CE QUI SE MONTRE qui se réduit : toute destination hors
 * liste est une attente MUETTE (le canal de la nº 452). L'exemption
 * `data-signe-muet` reste lue là où elle est posée.
 */
const DESTINATIONS_A_TRAIT = new Set(["/mes-favoris"]);
function destinationMontreLeTrait(adresse: string): boolean {
  return DESTINATIONS_A_TRAIT.has(adresse.split("?")[0]);
}

/**
 * ██ §3 (nº 469) — LE SIGNE COMMANDÉ À LA MAIN ██
 * ==================================================================
 * L'ouverture de « Mon compte » au doigt n'est PAS une navigation :
 * c'est une surface, et sa PREMIÈRE ouverture attend une lecture
 * (nº 142) — le même « rien ne bouge » que le signe ferme pour les
 * pages. Ces deux portes le commandent : MÊME composant, MÊME seuil
 * de 200 ms, même garde-fou — aucun second mécanisme. La clé fait le
 * lien entre le départ et la fin ; une « adresse » préfixée
 * (`manuel:`) qu'aucune navigation ne peut commettre porte l'attente.
 */
const EVENEMENT_SIGNE_MANUEL = "roswel:signe-manuel";

export function demarrerLeSigneManuel(cle: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENEMENT_SIGNE_MANUEL, {
      detail: { cle, action: "demarrer" },
    })
  );
}

export function finirLeSigneManuel(cle: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENEMENT_SIGNE_MANUEL, {
      detail: { cle, action: "finir" },
    })
  );
}

export function SigneDeChargement() {
  /*  La frontière <Suspense> est ICI, dans le composant : la mise en
      page racine n'a qu'à le poser. Sans elle, useSearchParams dans
      un composant client ferait basculer les pages prérendues en
      rendu client — la borne « ○ / » tomberait. */
  return (
    <Suspense fallback={null}>
      <Signe />
    </Suspense>
  );
}

function Signe() {
  const pathname = usePathname();
  const parametres = useSearchParams();
  const [visible, setVisible] = useState(false);

  /** La navigation en route : sa destination, son départ — et depuis
      la nº 452, si elle est MUETTE (voir la marque d'exemption). */
  const attente = useRef<{
    adresse: string;
    depuis: number;
    muette: boolean;
  } | null>(null);
  /** La dernière adresse que React a COMMISE — c'est elle qui permet
      de reconnaître une traversée qui n'a rien à charger (le cran du
      filet : même adresse avant et après). */
  const adresseCommise = useRef("");
  const minuteurSigne = useRef(0);
  const minuteurLimite = useRef(0);

  /*  L'ARRIVÉE — chaque page ou recherche commise passe par ici. */
  useEffect(() => {
    const ici = window.location.pathname + window.location.search;
    adresseCommise.current = ici;
    /*  Une autre destination a été cliquée pendant l'attente : la
        première arrive, la seconde est encore en route — le trait
        reste pour elle. */
    if (attente.current && attente.current.adresse !== ici) return;
    attente.current = null;
    window.clearTimeout(minuteurSigne.current);
    window.clearTimeout(minuteurLimite.current);
    setVisible(false);
  }, [pathname, parametres]);

  useEffect(() => {
    /*  ██ §3 (nº 452) — L'ATTENTE PEUT ÊTRE MUETTE ██
        --------------------------------------------------------------
        Une navigation marquée `data-signe-muet` (le lien lui-même ou
        n'importe quel ancêtre — « Ma sélection » marque le conteneur
        de ses cartes et son bloc de suivis) garde TOUTE la mécanique
        de l'attente — l'avalement du re-clic (§4 nº 441, règle
        332-§1), le nettoyage à l'arrivée, le garde-fou — mais ne
        montre JAMAIS le trait : le minuteur d'affichage n'est pas
        posé. Ce n'est pas un pansement par lien : une marque, lue au
        même endroit pour tout le site. */
    const demarrer = (adresse: string, muette = false) => {
      attente.current = { adresse, depuis: Date.now(), muette };
      window.clearTimeout(minuteurSigne.current);
      window.clearTimeout(minuteurLimite.current);
      if (muette) {
        //  Jamais de trait pour elle — et jamais un trait ORPHELIN
        //  d'une attente précédente qu'elle vient de remplacer.
        setVisible(false);
      } else {
        minuteurSigne.current = window.setTimeout(() => {
          if (attente.current) setVisible(true);
        }, DELAI_AVANT_SIGNE_MS);
      }
      minuteurLimite.current = window.setTimeout(() => {
        attente.current = null;
        setVisible(false);
      }, ATTENTE_MAXIMALE_MS);
    };

    /*  §1 (nº 442) — tout s'éteint d'un coup : l'attente, les deux
        minuteurs, le trait. Appelée quand le navigateur prend la
        navigation à son compte (lien natif, déchargement) : son
        indicateur remplace le nôtre. */
    const eteindre = () => {
      attente.current = null;
      window.clearTimeout(minuteurSigne.current);
      window.clearTimeout(minuteurLimite.current);
      setVisible(false);
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
      //  §3 (nº 452) — LA MARQUE D'EXEMPTION, lue sur le lien et ses
      //  ancêtres : l'attente s'arme (avalement compris) mais reste
      //  muette — aucun trait pour ce départ.
      //  §4 (nº 469) — ET LA LISTE BLANCHE : toute destination hors
      //  liste est muette aussi — même attente, même avalement, aucun
      //  trait.
      const muette =
        lien.closest("[data-signe-muet]") !== null ||
        !destinationMontreLeTrait(adresse);
      //  L'armement reste SYNCHRONE (l'avalement du re-clic de la 441
      //  ne perd pas une milliseconde)…
      demarrer(adresse, muette);
      //  §1 (nº 442) — …mais à la FIN du clic, on lit qui a pris la
      //  navigation. Le Link de Next et les cartes préviennent le
      //  geste par défaut : navigation douce, le trait est à nous.
      //  Personne ne l'a prévenu : c'est le NAVIGATEUR qui navigue
      //  (le logo, règle 247 — un lien natif), il montre son propre
      //  indicateur — le nôtre s'éteint dans l'instant, bien avant le
      //  seuil des 200 ms : jamais deux traits. setTimeout(0) et non
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
      //  surface — même adresse), il n'y a rien à charger : pas de
      //  signe. Sinon, le routeur va réconcilier — même attente,
      //  même seuil que les clics.
      const ici = window.location.pathname + window.location.search;
      if (ici === adresseCommise.current) return;
      //  §4 (nº 469) — la liste blanche vaut aussi pour les
      //  traversées : seule « Ma sélection » montre le trait, le
      //  reste garde une attente muette.
      demarrer(ici, !destinationMontreLeTrait(ici));
    };

    /*  §3 (nº 469) — LE SIGNE COMMANDÉ (« Mon compte » au doigt) :
        `demarrer` porte l'attente sous une adresse `manuel:` qu'aucune
        navigation ne peut commettre ; la fin l'éteint si c'est bien
        ELLE qui est en route (une navigation partie entre-temps garde
        son attente à elle). Seuil des 200 ms et garde-fou : les mêmes. */
    const surSigneManuel = (evenement: Event) => {
      const detail = (evenement as CustomEvent).detail as
        | { cle?: string; action?: string }
        | undefined;
      if (!detail?.cle) return;
      const adresse = `manuel:${detail.cle}`;
      if (detail.action === "demarrer") {
        demarrer(adresse);
        return;
      }
      if (attente.current?.adresse === adresse) eteindre();
    };

    //  §1 (nº 442) — LE DÉCHARGEMENT ÉTEINT TOUT : une navigation
    //  douce qui dégénère en chargement de document (repli nº 428,
    //  fiche injoignable) passe le relais à l'indicateur du
    //  navigateur — et l'attente s'efface, pour qu'un retour depuis
    //  le cache du navigateur reparte propre.
    const surDechargement = () => {
      eteindre();
    };

    //  CAPTURE, et sans « passif » : l'avalement du re-clic (§4) doit
    //  pouvoir prévenir le geste. Les clics ordinaires, eux, ne sont
    //  ni retardés ni modifiés — une lecture, rien de plus.
    document.addEventListener("click", surClic, true);
    window.addEventListener("popstate", surTraversee, { passive: true });
    window.addEventListener("pagehide", surDechargement, { passive: true });
    //  §3 (nº 469) — la porte du signe commandé (« Mon compte »).
    window.addEventListener(EVENEMENT_SIGNE_MANUEL, surSigneManuel);
    return () => {
      document.removeEventListener("click", surClic, true);
      window.removeEventListener("popstate", surTraversee);
      window.removeEventListener("pagehide", surDechargement);
      window.removeEventListener(EVENEMENT_SIGNE_MANUEL, surSigneManuel);
      window.clearTimeout(minuteurSigne.current);
      window.clearTimeout(minuteurLimite.current);
    };
  }, []);

  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      data-signe-chargement=""
      className="fixed h-0.5 inset-x-0 pointer-events-none top-0 z-[96]"
    >
      <div className="animate-[signe-chargement_10s_cubic-bezier(0.12,0.65,0.22,1)_forwards] bg-primaire h-full origin-left w-full" />
    </div>
  );
}
