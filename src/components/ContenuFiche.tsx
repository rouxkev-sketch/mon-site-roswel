"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { defilerEnDouceur } from "@/lib/defilement-programme";
//  ⚠️ TEMPORAIRE (nº 218-§1) — la sonde du carrousel : elle veut
//  savoir CE QUI A ÉTÉ DEMANDÉ (style, catégorie, rendu) juste avant
//  ce que le carrousel reçoit. Sans `?sonde-carrousel=1`, ne coûte rien.
import { noter as noterSonde } from "@/lib/journal-carrousel";
import {
  ARRONDI_ETIQUETTE,
  ECRITURE_TITRE_SECTION,
  libelleFiltre,
  libelleStyle,
  PORTRAIT_ROND,
  TRAIT_SEPARATION,
} from "@/config/tatouage";
import { BoutonHorsLigne } from "@/components/BoutonHorsLigne";
import { IconeCalendrier, IconeDuLien } from "@/components/IconeReseau";
import { BoutonSuivre } from "@/components/BoutonSuivre";
import {
  PanneauPortfolio,
  SelecteurOngletAffiche,
  type OngletAffiche,
  type SerieChoisie,
} from "@/components/PortfolioDeLAffiche";
import { capsulesPratiques } from "@/lib/pratique-fiche";
import type { StyleGalerie } from "@/lib/photo-tatoueur";
import { FenetreSignalement } from "@/components/FenetreSignalement";
import { libelleDuLien } from "@/lib/liens-fiche";
import { sousLeNom } from "@/components/BlocsFiche";
import {
  BlocAdressesFiche,
  BlocProfilsArtiste,
} from "@/components/BlocLieux";
import type { Tatoueur } from "@/lib/tatoueurs";
import { mecanismeCoupe } from "@/lib/variantes-essai";
//  §2 (nº 377) — la hauteur de la barre du logo et le nom de la
//  variable qui la porte jusqu'à la classe : une seule écriture, dans
//  le module qui la détient déjà.
import {
  RESERVE_LOGO,
  VARIABLE_RANGEE_COLLANTE,
} from "@/lib/reserve-barre";

/**
 * LE CONTENU D'UNE FICHE — UN SEUL EXEMPLAIRE, POUR LES DEUX ENVELOPPES
 * ==================================================================
 * (passe nº 199)
 *
 * LE DÉFAUT QU'IL SUPPRIME. Le contenu d'une fiche existait EN DOUBLE :
 * une fois dans la page (FicheTatoueur), une fois dans la fenêtre
 * superposée du web (FenetreFiche). Les deux se sont éloignés à chaque
 * passe — le sélecteur « Profil / Portfolio » de la nº 197 n'était
 * arrivé que dans la page, et le propriétaire l'a vu tout de suite :
 * ouvrir une fiche depuis la mosaïque ne montrait pas la même chose que
 * coller son adresse dans la barre du navigateur.
 *
 * DÉSORMAIS IL N'Y EN A QU'UN. Ce composant porte TOUT ce qui est du
 * CONTENU : les deux onglets, les sections « Réalisations » et
 * « Flashs » du portfolio et leurs vignettes (nº 276-§3), « Aucune
 * publication », et l'intégralité de l'onglet « Profil » — identité,
 * suivre, adresse, site, horaires, bio, réseaux, équipe, les trois
 * sections de badges, le signalement.
 *
 * CE QUI RESTE À CHAQUE ENVELOPPE, et rien d'autre : la façon de
 * s'ouvrir et de se fermer, et les boutons posés SUR la photo, dont la
 * position diffère (la page les place à gauche et à droite depuis la
 * nº 198, la fenêtre les garde groupés en haut à droite).
 */

/** §3 (nº 329) — LE NOM DU PARAMÈTRE D'ONGLET, écrit une seule fois.
    Absent = « Profil », l'onglet d'arrivée : une adresse nue reste
    exactement ce qu'elle était avant cette passe. */
export const PARAM_ONGLET = "onglet";

/**
 * §4 (nº 329) — COMMENT ON EST ARRIVÉ SUR CETTE FICHE.
 * ------------------------------------------------------------------
 * `entree=lien` : par un LIEN INTERNE à un autre portfolio — équipe,
 * guest, salon, studio, adresse, rond de profil de « Ma sélection ».
 * La fiche s'ouvre alors SANS PHOTO EN HAUT : on commence par
 * Profil / Portfolio (point 6 de la règle de navigation).
 * Absent : arrivée par une CARTE ou un LIEN DE PARTAGE — la photo
 * est là, comme toujours.
 *
 * ⚠️ POURQUOI DANS L'ADRESSE, ALORS QUE LA nº 295 L'AVAIT MISE
 * AILLEURS EXPRÈS. Elle vivait dans le `sessionStorage`, pour qu'un
 * lien partagé ne l'emporte pas chez quelqu'un qui arrive de
 * l'extérieur. Mais cette mémoire SE CONSOMMAIT À LA PREMIÈRE
 * LECTURE : un retour la perdait, et la photo revenait. Le
 * propriétaire a tranché à la nº 329 — la consigne vit dans
 * l'adresse, comme l'onglet, pour que le retour ET le pas en avant
 * la retrouvent tout seuls. Le prix est connu et accepté : quelqu'un
 * qui copie une adresse portant `entree=lien` la partagera telle
 * quelle.
 */
export const PARAM_ENTREE = "entree";
export const ENTREE_LIEN = "lien";

/**
 * §4 (nº 330) — LA CONSIGNE, POSÉE SUR N'IMPORTE QUELLE ADRESSE.
 * ------------------------------------------------------------------
 * `adresseDeLienInterne` ne savait écrire que l'adresse PUBLIQUE d'un
 * portfolio (`/tatoueur/<slug>`). Or « Mon portfolio », dans le menu
 * « Mon espace », mène au portfolio par une AUTRE route — celle de
 * l'espace tatoueur, en aperçu (`/devenir-tatoueur/fiche?…&vue=apercu`).
 * C'est le même geste et la même attente : on arrive sur un portfolio
 * par un lien, la photo du haut ne monte pas.
 * L'ÉCRITURE RESTE UNIQUE — c'est celle-ci, et `adresseDeLienInterne`
 * n'est plus que son cas particulier. Aucun appelant n'écrit
 * « entree=lien » à la main.
 */
export function avecConsigneDeLienInterne(adresse: string): string {
  const separateur = adresse.includes("?") ? "&" : "?";
  return `${adresse}${separateur}${PARAM_ENTREE}=${ENTREE_LIEN}`;
}

/** L'adresse d'un portfolio ouvert DEPUIS UN AUTRE PORTFOLIO. Écrite
    une fois, employée par tous les liens internes. */
export function adresseDeLienInterne(slug: string): string {
  return avecConsigneDeLienInterne(`/tatoueur/${slug}`);
}

export function ContenuFiche({
  tatoueur,
  groupes,
  studioCourant,
  demonstration = false,
  apercu = false,
  surSerieChoisie,
  suiviAuDepart = false,
  adresseALui = false,
  collantSousLaBarre = false,
}: {
  tatoueur: Tatoueur;
  /** LE PORTFOLIO GROUPÉ PAR STYLE — l'enveloppe le calcule (elle en a
      besoin pour sa photo), le contenu s'en sert pour ses vignettes. */
  groupes: StyleGalerie[];
  /** LE STUDIO REGARDÉ (« ?studio=<id> »), quand l'enveloppe en connaît
      un — la page le lit dans l'adresse, la fenêtre superposée n'en a
      pas. `null` est donc une valeur ordinaire, pas un oubli. */
  studioCourant?: string | null;
  demonstration?: boolean;
  /** Vrai dans l'espace tatoueur (« Ma fiche ») : ni suivi, ni
      signalement, ni mise hors ligne. */
  apercu?: boolean;
  /** Un toucher sur une vignette : l'enveloppe montre CETTE série —
      style + catégorie + rendu (nº 204-§3) — et remonte en haut
      (nº 197-§4). */
  surSerieChoisie: (serie: SerieChoisie) => void;
  /** SUIT-ON DÉJÀ CE TATOUEUR ? — lu par le SERVEUR (nº 208-§1) : le
      bouton naît dans le bon état, il ne se corrige plus à l'écran. */
  suiviAuDepart?: boolean;
  /** §3 (nº 329) — CE CONTENU A-T-IL UNE ADRESSE À LUI ? VRAI sur la
      PAGE d'une fiche (FicheTatoueur), FAUX dans la fenêtre du web
      (FenetreFiche), dont l'adresse est celle d'une surface posée
      par-dessus une autre page. Seule une page écrit dans l'adresse.
      Faux par défaut : rien ne se met à écrire sans l'avoir demandé. */
  adresseALui?: boolean;
  /**
   * §2 (nº 377) — LA RANGÉE DU HAUT SE COLLE-T-ELLE SOUS LA BARRE
   * FIXE, AU DOIGT ?
   * ------------------------------------------------------------------
   * VRAI SUR LA PAGE D'UNE FICHE, ET NULLE PART AILLEURS. C'est un
   * drapeau, pas une déduction, et il fallait qu'il en soit un : ce
   * contenu est monté à DEUX endroits, et le second n'est PAS réservé
   * au web. Depuis une fiche, un membre d'équipe ou le salon d'un
   * profil s'ouvre en FENÊTRE SUPERPOSÉE — « au doigt comme à la
   * souris » (nº 226-§5, voir l'en-tête de FenetreFiche). Une fenêtre
   * n'a pas de barre fixe au-dessus d'elle : y coller la rangée à
   * 64 px du haut ouvrirait une bande vide sous son bord.
   * Faux par défaut, donc : seule la page demande ce comportement.
   */
  collantSousLaBarre?: boolean;
}) {
  /**
   * LES DEUX ONGLETS DE L'AFFICHE (nº 197-§1)
   * « Profil » montre le contenu de la fiche ; « Portfolio » montre les
   * styles publiés, catégorie par catégorie.
   */
  /**
   * §3 (nº 329) — L'ONGLET VIT DANS L'ADRESSE, PLUS DANS REACT.
   * ==================================================================
   * C'est le POINT 5 de la règle de navigation (lib/navigation-session).
   * LE DÉFAUT : l'onglet vivait dans un `useState`. On quittait la
   * fiche en Portfolio, on revenait à la liste, on RAVANÇAIT — et la
   * fiche rouvrait sur Profil. La position, elle, revenait juste :
   * seul l'onglet se perdait, parce qu'il n'était nulle part.
   *
   * ⚠️ CHANGER D'ONGLET **REMPLACE** L'ENTRÉE, IL N'EN AJOUTE AUCUNE —
   * et c'est une exigence du propriétaire, pas un détail
   * d'implémentation : le retour doit continuer de QUITTER la fiche,
   * exactement comme avant. Un `pushState` par onglet obligerait à
   * appuyer deux ou trois fois sur « précédent » pour sortir d'une
   * fiche qu'on a parcourue. C'est le pas EN AVANT qui retrouve
   * l'onglet, parce que l'adresse de l'étape le porte.
   *
   * ⚠️ ET SEULEMENT QUAND CE CONTENU A UNE ADRESSE À LUI. Dans la
   * FENÊTRE du web (FenetreFiche), l'adresse est celle de la fiche
   * ouverte par-dessus la mosaïque : y écrire un onglet reviendrait à
   * réécrire l'adresse d'une surface qui n'est pas une page. Le
   * drapeau `adresseALui` tranche, et il est faux par défaut — aucune
   * surface ne se met à écrire dans l'adresse sans l'avoir demandé.
   */
  const ongletDeLAdresse = (): OngletAffiche =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get(PARAM_ONGLET) ===
      "portfolio"
      ? "portfolio"
      : "profil";
  const [onglet, setOnglet] = useState<OngletAffiche>(ongletDeLAdresse);
  /*  L'ADRESSE MÈNE, MÊME QUAND ELLE CHANGE SOUS NOS PIEDS : un retour
      ou un pas en avant ne remonte pas ce composant (même route), il
      ne fait que changer la requête. On se réaligne PENDANT LE RENDU,
      le motif de PileFiches. */
  const [requeteLue, setRequeteLue] = useState<string | null>(null);
  if (adresseALui && typeof window !== "undefined") {
    const requete = window.location.search;
    if (requeteLue !== requete) {
      setRequeteLue(requete);
      const voulu = ongletDeLAdresse();
      if (voulu !== onglet) setOnglet(voulu);
    }
  }
  /*  §3 (nº 276) — PLUS AUCUN ÉTAT DE CATÉGORIE NI DE RENDU : les deux
      sélecteurs du portfolio sont SUPPRIMÉS, code compris. Le panneau
      montre les deux sections empilées ; il n'a plus rien à retenir,
      et l'onglet « Portfolio » n'a plus besoin de savoir ce qu'on
      cherchait (les props natureCherchee / renduCherche partent avec —
      la série cherchée continue d'ouvrir le CARROUSEL de l'enveloppe,
      cette logique-là vit chez elle et n'a pas bougé). */

  /**
   * §7 (nº 208) — AU DOIGT, CHANGER D'ONGLET REMONTE LA PAGE
   * ==================================================================
   * La limite entre la photo et le contenu vient se poser PILE SOUS LA
   * BARRE FIXE : ni dessous (le sélecteur qu'on vient de toucher
   * disparaîtrait derrière elle), ni avec un vide au-dessus.
   * On mesure les deux — le repère du contenu, et la hauteur réelle de
   * la barre (`[data-barre-fixe]`, qui vaut 64 px sur une fiche mais
   * n'est pas écrite ici : elle se lit).
   * ⚠️ SEULEMENT SUR LES VRAIS MOBILES : sur le web, la colonne défile
   * toute seule et la rangée y est déjà posée (§4) ; dans la fenêtre
   * superposée, le corps est gelé et un défilement de page ne veut
   * rien dire.
   * ⚠️ `defilerSansGeste` : ce mouvement n'est pas un geste du doigt —
   * sans cela, la barre y lirait une intention et se replierait
   * (nº 154-§6A).
   */
  /**
   * LA REMONTÉE, ÉCRITE UNE FOIS (nº 218-§2)
   * ------------------------------------------------------------------
   * Elle servait au seul sélecteur Profil / Portfolio ; « Réalisation »
   * et « Flash » changent tout autant ce qu'on regarde, et devaient
   * remonter au MÊME endroit, au pixel. Une seule fonction, deux
   * appelants : impossible qu'ils s'arrêtent à deux hauteurs.
   */
  /**
   * §4 (nº 304) — LA POSITION VISÉE, ET LA GARANTIE QUI LA TIENT.
   * ------------------------------------------------------------------
   * ⚠️ LA LIMITE, C'EST LE BAS DE LA PHOTO (nº 209-§5a) — et non le
   * haut du contenu, qui vient plus bas (l'écart entre les deux
   * colonnes) : la page s'arrêtait alors trop haut, au-dessus du bloc
   * Profil / Portfolio. L'enveloppe marque sa photo
   * (`data-photo-fiche`), le contenu partagé la lit — il n'a ainsi
   * aucune géométrie d'enveloppe écrite chez lui.
   *
   * LE DÉFAUT DU PROPRIÉTAIRE : la page se pose LÉGÈREMENT AU-DESSUS,
   * et une bande horizontale de photo reste visible sur toute la
   * largeur. DEUX CAUSES POSSIBLES, et on les traite toutes les deux
   * parce que je n'ai pas pu reproduire la bande ici (Chromium arrive
   * juste, mesuré : le bas de la photo tombe à 0,5 px SOUS la barre) :
   *  1. LE DEMI-PIXEL. La cible est fractionnaire (mesuré : 487,5) ;
   *     un moteur qui tronque au lieu d'arrondir s'arrête au-dessus.
   *     `Math.ceil` : on ne s'arrête JAMAIS trop haut, au pire un
   *     pixel trop bas — invisible, et du bon côté.
   *  2. LA MESURE VIEILLIT. Le repère est lu AVANT le mouvement ; si
   *     quoi que ce soit change de hauteur pendant les ~300 ms de
   *     l'animation (la barre, une image qui arrive), on vise un
   *     endroit qui n'existe plus. On REMESURE donc à l'arrivée, et
   *     on corrige le reste s'il y en a — instantanément, sans
   *     animation, sans entrée d'historique. C'est le raisonnement du
   *     recalage de la nº 296 : une garantie posée APRÈS le mouvement,
   *     qui ne coûte rien quand tout est déjà juste.
   * ⚠️ ET ELLE S'EFFACE DEVANT LE DOIGT : un toucher pendant le
   *     mouvement désarme la garantie — on ne corrige jamais par-dessus
   *     quelqu'un qui a repris la main.
   */
  function positionSousLaPhoto(): number | null {
    const photo = document
      .querySelector("[data-photo-fiche]")
      ?.getBoundingClientRect();
    if (!photo) return null;
    const barre =
      document.querySelector("[data-barre-fixe]")?.getBoundingClientRect()
        .height ?? 0;
    return Math.max(0, Math.ceil(window.scrollY + photo.bottom - barre));
  }

  function remonterSousLaBarre() {
    if (document.documentElement.dataset.appareil !== "mobile") return;
    noterSonde("REMONTÉE demandée (mobile)");
    const cible = positionSousLaPhoto();
    if (cible === null) return;
    //  Départ progressif, arrivée amortie, aucun rebond (§5b).
    defilerEnDouceur(cible);
    garantirLArrivee();
  }

  /** LA GARANTIE — elle remesure à l'arrivée et corrige le reste. */
  const garantie = useRef<{ repos: number; doigt: (() => void) | null }>({
    repos: 0,
    doigt: null,
  });
  function garantirLArrivee() {
    const etat = garantie.current;
    window.clearTimeout(etat.repos);
    if (etat.doigt) etat.doigt();
    let abandonnee = false;
    const auDoigt = () => {
      abandonnee = true;
    };
    window.addEventListener("touchstart", auDoigt, { passive: true });
    window.addEventListener("wheel", auDoigt, { passive: true });
    etat.doigt = () => {
      window.removeEventListener("touchstart", auDoigt);
      window.removeEventListener("wheel", auDoigt);
      etat.doigt = null;
    };
    etat.repos = window.setTimeout(() => {
      etat.doigt?.();
      if (abandonnee) return;
      const cible = positionSousLaPhoto();
      //  `positionSousLaPhoto` rend la position ABSOLUE à viser : si
      //  elle vaut encore la position courante, il n'y a rien à faire.
      if (cible === null || Math.abs(cible - window.scrollY) < 0.5) return;
      noterSonde(`REMONTÉE recalée · ${window.scrollY} → ${cible}`);
      window.scrollTo({ top: cible, left: 0, behavior: "instant" });
      //  ⚠️ 520 ms : la durée du mouvement (400) et une marge. Plus
      //  court, on corrigerait EN COURS de route.
    }, 520);
  }

  /**
   * REMONTER EN HAUT DE LA PHOTO (nº 239-§1) — LE REPÈRE DE LA VIGNETTE
   * ------------------------------------------------------------------
   * DEUX GESTES, DEUX REPÈRES, et c'est voulu :
   *  · PROFIL / PORTFOLIO, RÉALISATION / FLASH, LE RENDU changent ce
   *    qu'on lit SOUS la photo : la page se cale sous la barre, le bas
   *    de la photo affleurant (`remonterSousLaBarre`, inchangée) ;
   *  · UNE VIGNETTE DE STYLE change LA PHOTO ELLE-MÊME : elle ramène
   *    donc TOUT EN HAUT, au sommet de l'affiche — sans quoi on
   *    choisit une série sans jamais voir la photo qu'elle ouvre.
   * MÊME MOUVEMENT, MÊME DURÉE : c'est le même `defilerEnDouceur`,
   * donc la même courbe et le même temps ; seul le point d'arrivée
   * diffère. Aucune entrée d'historique (un simple défilement amorti),
   * et rien n'est écrit : sur une page de détail, la restitution des
   * nº 230 et 232 reste intacte.
   */
  function remonterEnHautDeLaPhoto() {
    if (document.documentElement.dataset.appareil !== "mobile") return;
    noterSonde("REMONTÉE EN HAUT DE LA PHOTO (vignette)");
    //  On vise le HAUT de la photo, lu sur l'enveloppe — jamais un
    //  zéro écrit en dur : si quoi que ce soit vient un jour au-dessus
    //  d'elle, le repère suit sans qu'on ait à y revenir.
    const photo = document
      .querySelector("[data-photo-fiche]")
      ?.getBoundingClientRect();
    if (!photo) return;
    //  ⚠️ MOINS LA HAUTEUR DE LA BARRE, exactement comme la remontée
    //  d'à côté : viser le haut de la photo TOUT COURT l'aurait glissé
    //  SOUS la barre fixe (mesuré : arrivée à 64, les 64 premiers
    //  pixels de la photo cachés). La page arrive donc tout en haut —
    //  scrollY 0 sur une fiche — et la photo commence pile sous la
    //  barre, entière.
    const barre = document
      .querySelector("[data-barre-fixe]")
      ?.getBoundingClientRect().height;
    defilerEnDouceur(Math.max(0, window.scrollY + photo.top - (barre ?? 0)));
  }

  /**
   * REMONTER UNE FOIS LA NOUVELLE LISTE POSÉE (nº 238-§1)
   * ------------------------------------------------------------------
   * Une vignette de style ne change pas que la galerie du dessous :
   * elle change AUSSI LA PHOTO DU HAUT (première photo de la série,
   * dont le cadre prend le format réel — nº 228-§3). Or la remontée se
   * mesure SUR CETTE PHOTO : appelée dans le même souffle que le
   * changement, elle mesure encore l'ANCIENNE, et vise un repère qui
   * n'existera plus une image plus tard.
   * On attend donc que la nouvelle liste soit rendue ET mise en page :
   * un compteur, un effet, et DEUX images (la première rend, la
   * seconde a la mise en page définitive). Les hauteurs de photo étant
   * réservées d'avance, rien n'attend le chargement des images.
   */
  const [remonteeDemandee, setRemonteeDemandee] = useState(0);
  useEffect(() => {
    if (remonteeDemandee === 0) return;
    let seconde = 0;
    const premiere = requestAnimationFrame(() => {
      seconde = requestAnimationFrame(() => remonterEnHautDeLaPhoto());
    });
    return () => {
      cancelAnimationFrame(premiere);
      cancelAnimationFrame(seconde);
    };
    //  `remonterEnHautDeLaPhoto` ne lit que le DOM : le compteur est
    //  le seul déclencheur, et c'est voulu.
  }, [remonteeDemandee]);

  /**
   * Changer d'onglet : le contenu change, et l'adresse suit, EN
   * REMPLAÇANT son entrée (nº 329-§3).
   *
   * ██ §1 (nº 377) — LA PAGE NE REMONTE PLUS ██
   * ==================================================================
   * CE QUI EST RETIRÉ : l'appel à `remonterSousLaBarre()` qui fermait
   * cette fonction. C'était lui, et lui seul, le saut automatique —
   * la page glissait jusqu'à poser le bas de la photo pile sous la
   * barre fixe (règle nº 208-§7, puis nº 304-§4). Toucher Profil ou
   * Portfolio change désormais le contenu affiché, et rien d'autre.
   *
   * CE QUI RESTE, ET POURQUOI : `remonterSousLaBarre` n'est PAS
   * supprimée — elle a un second appelant, l'arrivée par `#profil`
   * depuis le rond de profil de la fenêtre de carrousel (nº 285-§2-6,
   * plus bas). Ce mouvement-là n'est pas un changement d'onglet : le
   * visiteur vient d'ailleurs et doit être déposé au bon endroit. Le
   * propriétaire n'a pas demandé d'y toucher, et je n'y touche pas.
   *
   * ⚠️ CE QUE LE JOURNAL NE DIRA PLUS : la ligne « REMONTÉE demandée
   * (mobile) » n'apparaît plus au toucher d'un onglet. C'est la
   * preuve, à l'écran, que le mécanisme est bien parti.
   */
  function choisirOnglet(suivant: OngletAffiche) {
    noterSonde(`SÉLECTEUR onglet → « ${suivant} »`);
    setOnglet(suivant);
    if (adresseALui && typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (suivant === "portfolio") p.set(PARAM_ONGLET, "portfolio");
      else p.delete(PARAM_ONGLET);
      const requete = p.toString();
      //  ⚠️ `replaceState`, JAMAIS `pushState` : voir la note de
      //  l'état ci-dessus — le retour doit continuer de quitter la
      //  fiche d'un seul appui.
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + (requete ? `?${requete}` : "")
      );
      setRequeteLue(window.location.search);
    }
  }

  /**
   * §2-6 (nº 285) — ARRIVER DIRECTEMENT SUR LE PROFIL, À SA PLACE
   * ==================================================================
   * Le rond de profil de la fenêtre de carrousel (nº 284) déposait le
   * visiteur TOUT EN HAUT de la fiche. Il doit le déposer EXACTEMENT
   * là où la page se pose quand on touche l'onglet « Profil » :
   * `remonterSousLaBarre`, le MÊME mouvement, la MÊME position finale
   * — pas une seconde écriture, celle qui existe.
   * L'adresse le demande (`#profil`, ce que le lien du rond écrit) ;
   * l'onglet « Profil » étant déjà celui d'arrivée, il n'y a que la
   * remontée à jouer.
   * ⚠️ AU DOIGT SEULEMENT, comme la remontée elle-même (elle sort
   * d'elle-même sur le web) ; et UNE SEULE FOIS, à l'arrivée — sans
   * quoi un rechargement ou un retour rejouerait un mouvement que
   * personne n'a demandé.
   * ⚠️ APRÈS DEUX IMAGES : la photo du haut doit avoir sa hauteur
   * définitive, sans quoi on viserait un repère qui n'existe pas
   * encore (la leçon de `remonteeDemandee`, nº 238-§1).
   *
   * §1 (nº 336) — « UNE SEULE FOIS » NE S'ÉCRIT PLUS EN EFFAÇANT
   * L'ANCRE.
   * ------------------------------------------------------------------
   * CE QUI ÉTAIT ÉCRIT : l'ancre était RETIRÉE de l'adresse aussitôt
   * lue. Le propriétaire l'a relevé sur son iPhone — le lien portait
   * `#profil`, l'adresse d'arrivée ne le portait plus : « il disparaît
   * en route ». Et c'est vrai qu'il disparaissait, mais pas d'un défaut
   * : d'une décision, prise ici, et mal placée.
   * POURQUOI ELLE ÉTAIT MAL PLACÉE. Une adresse DÉCRIT un écran (point
   * 5 de la règle de navigation) : `/tatoueur/x#profil`, c'est « la
   * fiche, à sa section profil ». La mutiler pour se souvenir qu'on a
   * déjà joué un mouvement, c'est ranger un souvenir dans la
   * description. Le souvenir a désormais sa place : LA MARQUE DANS
   * L'ÉTAPE D'HISTORIQUE, comme toutes les autres marques du site
   * (`fenetreFiche`, `retourReconstruit`, `etapeRefermable`).
   * L'ADRESSE, ELLE, GARDE SON ANCRE — on peut la relire, la partager,
   * et le propriétaire peut la voir.
   */
  useEffect(() => {
    if (window.location.hash !== "#profil") return;
    //  §2 (nº 332) — L'ÉTAT EST RECOPIÉ, jamais effacé : passer `null`
    //  jetait au passage les marques que le site pose dans l'étape (le
    //  filet `retourReconstruit`, l'étape d'une surface refermable), et
    //  le retour ne savait plus où il en était.
    const etape = (window.history.state ?? {}) as { profilJoue?: boolean };
    //  DÉJÀ JOUÉ SUR CETTE ÉTAPE : un rechargement ou un retour ne
    //  rejoue rien. (L'état d'historique survit aux deux.)
    if (etape.profilJoue) return;
    //  nº 353 — porte du banc : sans la marque, l'ancre peut rejouer
    //  aux retours ; c'est le prix assumé de la variante.
    if (mecanismeCoupe("profil")) return;
    //  ⚠️ DEUX ARGUMENTS, PAS TROIS : sans adresse, `replaceState`
    //  garde celle qui est là — ancre comprise. C'est tout le point.
    window.history.replaceState({ ...etape, profilJoue: true }, "");
    let seconde = 0;
    const premiere = requestAnimationFrame(() => {
      seconde = requestAnimationFrame(() => remonterSousLaBarre());
    });
    return () => {
      cancelAnimationFrame(premiere);
      cancelAnimationFrame(seconde);
    };
    //  `remonterSousLaBarre` ne lit que le DOM : la rejouer à chaque
    //  rendu ne changerait rien, et l'ajouter en dépendance
    //  relancerait l'effet pour rien.
    //  §4 (nº 304) — elle porte désormais la garantie d'arrivée, qui
    //  ne lit elle aussi que le DOM et une référence stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*  §3 (nº 276) — `choisirCategorie` et `surRendu` ont DISPARU avec
      leurs sélecteurs, et leurs remontées de page avec eux (celle du
      rendu datait de la nº 234 ; celle de la catégorie était déjà
      partie à la nº 269). RESTENT, inchangées : la remontée de
      Profil / Portfolio (`choisirOnglet`, sous la barre) et celle des
      vignettes de style (tout en haut, nº 239 — `remonteeDemandee`). */

  const avatarProfil = (
    <span
      /*  ⚠️ AUCUN CONTOUR (nº 222-§1a) : la charte de la fiche ne
           cercle rien. La photo se détache par son fond, pas par un
           liseré. */
      className="flex h-[92px] w-[92px] shrink-0 items-center justify-center
                 overflow-hidden rounded-full bg-sombre-eleve"
    >
      {tatoueur.photo_profil ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par le tatoueur, servie telle quelle. */
        <img
          src={tatoueur.photo_profil}
          alt={`Photo de ${tatoueur.nom}`}
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="text-[32px] font-bold text-sombre-texte-doux">
          {tatoueur.nom.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );

  const noteDemonstration = (classes: string) => (
    <p
      className={`${classes} rounded-xl border border-primaire/40 bg-primaire/10 px-4 py-3 text-sm text-sombre-texte`}
    >
      Fiche de DÉMONSTRATION : ce tatoueur n&apos;existe pas, et
      l&apos;image est un aplat de couleur — aucune photo de tatouage
      n&apos;est publiée sans l&apos;accord de son auteur.
    </p>
  );

  /**
   * §2 (nº 222) — LES LIENS, SOUS LA PHOTO
   * ==================================================================
   * UNE SEULE FAMILLE, UNE SEULE FORME : les liens libres que
   * l'artiste a créés (son site, sa page de liens), puis Instagram et
   * TikTok. Chacun porte SON ICÔNE À GAUCHE, toutes de la même taille,
   * et le bloc commence par une colonne d'icônes — quel que soit le
   * nombre de rangées.
   *
   * ⚠️ LES DEUX BADGES-PHARES ONT DISPARU. Instagram et TikTok
   * vivaient dans deux capsules de 68 px, cerclées de rose, avec un
   * halo : trois choses que la charte de cette passe interdit
   * désormais (aucun contour, le rose réservé au badge sélectionné, au
   * bouton d'action finale et à la ligne du sélecteur actif). Ce sont
   * des liens, ils se lisent comme les autres.
   *
   * ILS SE REGROUPENT : un seul lien libre et Instagram tiennent sur
   * une ligne — `flex-wrap` ne laisse aucune ligne à moitié vide.
   */
  /*  §5 (nº 227) — LE SURVOL SANS ROSE, comme toutes les lignes
      cliquables du site : la couleur ne change jamais, le fond monte
      d'un cran (voile blanc, annulé par des marges négatives — rien
      ne bouge d'un pixel), un fin soulignement décalé sur le libellé.
      Au doigt : un bref état enfoncé, jamais un état qui reste. */
  const lienEnLigne = (
    cle: string,
    href: string,
    libelle: string,
    icone: React.ReactNode
  ) => (
    <a
      key={cle}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 text-[15px] leading-snug
                 text-sombre-texte-doux rounded-lg -mx-1.5 -my-1 px-1.5 py-1
                 transition-colors hover:bg-white/5 active:bg-white/10"
    >
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
        {icone}
      </span>
      {/*  §2 (nº 273) — PLUS DE SOULIGNEMENT ICI : le fond qui monte
           au survol (`hover:bg-white/5`, la ligne cliquable de la
           nº 227) dit déjà que la ligne se clique — le trait faisait
           double emploi. Le soulignement du dépôt est réservé au SEUL
           cas qui sort du site : l'adresse (AdresseCliquable). */}
      <span className="min-w-0 truncate">
        {libelle}
      </span>
    </a>
  );

  /**
   * §1 (nº 240) — LES ICÔNES DES LIENS SONT DESSINÉES DANS LE CODE.
   * ==================================================================
   * FIN DES FICHIERS : `icone-instagram.png`, `icone-tiktok.png` et
   * `site.png` (et les versions rognées de la nº 231) ne sont plus
   * servis ici — et LE DISQUE BLANC est parti avec eux, avec toute la
   * mécanique du liseré des passes 231 à 235 : elle n'existait que
   * parce que ces fichiers étaient dessinés pour un fond noir.
   * Les tracés vivent dans IconeReseau.tsx (`IconeDuLien`, l'écriture
   * PARTAGÉE avec le pied de page) : monochromes en `currentColor`,
   * ils prennent la couleur du texte du lien — gris doux ici, et ses
   * survols — sans un seul réglage. Aucun disque, aucun fond.
   */
  const iconeDeLien = (reseau: "instagram" | "tiktok" | "site") => (
    <IconeDuLien reseau={reseau} taille={20} />
  );

  /**
   * §4 (nº 227) — LES LIENS, SUR DEUX LIGNES, RÈGLE EXACTE :
   *  · ligne 1 : les liens de site (deux au maximum — le site et la
   *    page de liens sont les deux seuls champs) ;
   *  · ligne 2 : Instagram et TikTok, ensemble ;
   *  · EXCEPTION UNIQUE : sans TikTok, Instagram remonte sur la
   *    ligne 1, à côté d'un lien.
   * Aucune autre combinaison ; une ligne vide ne rend rien, donc ne
   * laisse aucun espace.
   */
  /**
   * §3 (nº 270, REFAIT PAR LA Nº 273) — L'ÉTAT DES CARNETS, EN
   * PREMIÈRE POSITION DES LIENS
   * ==================================================================
   * TROIS ÉCRITURES, ET PAS UNE DE PLUS : « Booking ouvert »,
   * « Booking · 3 mois » (le chiffre = le mois déclaré),
   * « Booking fermé ». C'est LE MOT qui dit l'état.
   * ⚠️ LES TROIS RONDS DE LA Nº 270 SONT PARTIS (nº 273-§1) — le vert
   * d'« ouvert », le gris clair du délai, le gris foncé de « fermé » :
   * le booking parle de TEMPS, pas de feu de circulation. À leur
   * place, UNE ICÔNE DE CALENDRIER — la même pour les trois états,
   * sans variante, dans l'écriture unique des icônes de la nº 240
   * (IconeReseau, `currentColor`, trait 1,8) : elle prend le gris
   * doux du libellé à côté duquel elle vit, à la taille des autres
   * icônes de la liste (20, dans la colonne de 22 px). L'icône dit de
   * quoi on parle — la disponibilité — le mot dit l'état.
   * ⚠️ RIEN DÉCLARÉ → RIEN AFFICHÉ : le site ne devine pas l'état
   * des carnets de quelqu'un. Les fiches d'avant la migration
   * (booking NULL) restent muettes jusqu'à leur prochain
   * enregistrement — et un « délai » sans mois (donnée d'avant les
   * garde-fous) se tait aussi : on n'écrit pas « Booking · ? mois ».
   * CE N'EST PAS UN LIEN : une étiquette d'état, qui ne mène nulle
   * part — ni survol, ni soulignement (leçon de la nº 268 : ce qui
   * décrit ne se clique pas). Elle partage la famille des liens :
   * même taille, même gris doux, même colonne de 22 px.
   */
  const libelleBooking =
    tatoueur.booking === "ouvert"
      ? "Booking ouvert"
      : tatoueur.booking === "ferme"
        ? "Booking fermé"
        : tatoueur.booking === "delai" && tatoueur.booking_mois
          ? `Booking · ${tatoueur.booking_mois} mois`
          : null;
  const entreeBooking = tatoueur.booking && libelleBooking && (
    <span
      key="booking"
      data-booking-fiche={tatoueur.booking}
      className="flex items-center gap-2.5 text-[15px] leading-snug
                 text-sombre-texte-doux"
    >
      {/*  §1 (nº 273) — LE CALENDRIER, hors de tout ternaire d'état :
           une seule écriture couvre les trois états PAR CONSTRUCTION —
           aucune variante n'est seulement possible. */}
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center">
        <IconeCalendrier taille={20} />
      </span>
      <span className="min-w-0 truncate">{libelleBooking}</span>
    </span>
  );

  const lienInstagram =
    tatoueur.lien_instagram &&
    lienEnLigne(
      "instagram",
      tatoueur.lien_instagram,
      "Instagram",
      iconeDeLien("instagram")
    );
  const lienTiktok =
    tatoueur.lien_tiktok &&
    lienEnLigne(
      "tiktok",
      tatoueur.lien_tiktok,
      "TikTok",
      iconeDeLien("tiktok")
    );
  const premiereLigne = [
    //  §3 (nº 270) — LE BOOKING OUVRE LA LISTE, devant tout le reste :
    //  la PREMIÈRE position des liens, comme dans le formulaire.
    entreeBooking,
    tatoueur.site_web &&
      lienEnLigne(
        "site",
        tatoueur.site_web,
        tatoueur.titre_site_web || libelleDuLien(tatoueur.site_web),
        iconeDeLien("site")
      ),
    tatoueur.page_de_liens &&
      lienEnLigne(
        "liens",
        tatoueur.page_de_liens,
        tatoueur.titre_page_de_liens || libelleDuLien(tatoueur.page_de_liens),
        iconeDeLien("site")
      ),
  ].filter(Boolean);
  const secondeLigne: React.ReactNode[] = [];
  if (lienTiktok) {
    if (lienInstagram) secondeLigne.push(lienInstagram);
    secondeLigne.push(lienTiktok);
  } else if (lienInstagram) {
    premiereLigne.push(lienInstagram);
  }

  /**
   * §1 et §2 (nº 315) — DE CINQ SECTIONS TITRÉES À UNE SEULE
   * ==================================================================
   * CE QU'IL Y AVAIT (nº 226) : cinq titres en capitales — STYLES,
   * RENDU, TECHNIQUE, TYPES DE PROJETS, BESOINS PARTICULIERS — chacun
   * au-dessus d'une poignée de mots. Le propriétaire l'a tranché :
   * c'était plus de structure que d'information.
   *
   * §1 — LE TITRE « STYLES » DISPARAÎT, ET SES BADGES REMONTENT. Ils
   * ne sont plus une section : ils se posent DIRECTEMENT SOUS LA BIO,
   * sans rien au-dessus d'eux, comme la fin de la présentation. Ils
   * vivent donc à part, plus bas dans ce fichier (`badgesDeStyle`).
   * ⚠️ ILS RESTENT DES LIENS vers /tatouage/<style>/<ville> : c'est la
   * valeur de référencement du site, elle ne part pas avec le titre.
   *
   * §2 — LES QUATRE AUTRES FUSIONNENT SOUS « PRATIQUE ». Toutes leurs
   * capsules se rangent ensemble, sur une ou plusieurs lignes :
   *
   *     PRATIQUE
   *     Couleur · Machine · Grandes pièces · Bodysuit · Cover · Cicatrice
   *
   * ⚠️ UN ORDRE FIXE, TOUJOURS LE MÊME — rendu, puis technique, puis
   * types de projets, puis besoins particuliers. Sans lui, les
   * capsules changeraient de place d'une fiche à l'autre, et l'œil
   * perdrait le repère qu'il vient de prendre sur la précédente.
   * ⚠️ ET CET ORDRE NE VIT PAS ICI : il est la RÈGLE, et une règle
   * qu'aucun banc ne peut exécuter finit par dériver. Il vit donc dans
   * `capsulesPratiques` (lib/pratique-fiche), où il s'éprouve sur
   * trois cas — une capsule, six, aucune — sans navigateur.
   * ⚠️ RIEN DE DÉCLARÉ, RIEN D'AFFICHÉ : la section entière disparaît
   * si les quatre catégories sont vides — pas de titre orphelin (voir
   * `capsulesPratique.length` au rendu).
   */
  const capsulesPratique = capsulesPratiques(tatoueur);

  /** LA LIGNE DE SÉPARATION DES BLOCS — un gris TRÈS sombre, discret
      mais lisible sur l'anthracite (réservée à cette page).
      ELLE VA D'UN BORD À L'AUTRE DU BLOC. Sur smartphone, la page
      porte 16 px de marge latérale : la ligne s'arrêtait donc à 16 px
      des deux bords pendant que la photo, elle, touchait l'écran —
      un trait suspendu au milieu de rien. Elle ressort maintenant de
      ces marges (`-mx-4`) et les rend à son contenu (`px-4`) : le
      trait traverse, le texte ne bouge pas d'un pixel.
      ⚠️ ELLE PRÉCÈDE DÉSORMAIS TOUTES LES FICHES DE LIEU (nº 226-§3) :
      le sélecteur « Adresse / Autre adresse », qui la remplaçait à
      deux adresses ou plus, est supprimé — les adresses s'empilent. */

  /*  §5 (nº 287) — LES SÉPARATEURS RESPECTENT LES MARGES, au doigt
      comme au web : le « bord à bord » du smartphone (l'ancien
      `mobile:-mx-4`) est ANNULÉ par le propriétaire — la ligne
      s'arrête où le contenu s'arrête, mêmes marges des deux côtés.
      §4 (nº 315) — ET SA COULEUR N'EST PLUS ÉCRITE ICI. C'était
      `border-sombre-bordure/60`, le jeton des traits dilué à 60 % :
      (44, 44, 49) sur un fond à (26, 26, 29) — on ne le voyait qu'en
      le cherchant. La valeur vit maintenant dans la charte, une seule
      fois, et le soulignement du sélecteur à deux choix lit la même
      (voir TRAIT_SEPARATION). */
  const separation = `border-t ${TRAIT_SEPARATION}`;

  /**
   * §1 (nº 315) — LES BADGES DE STYLE, SOUS LA BIO ET SANS TITRE.
   * ------------------------------------------------------------------
   * Ils ne sont plus une section : plus de « STYLES » au-dessus d'eux,
   * plus de ligne de séparation. Ils ferment la présentation — le
   * rond, le nom, le sous-titre, les liens, la bio, puis eux.
   * ⚠️ `mt-7`, LE MÊME DÉGAGEMENT QUE LA BIO : la fiche SANS bio les
   * pose donc sous ce qui précède avec exactement l'espace qu'ils
   * auraient eu sous elle. Aucune règle conditionnelle à écrire — la
   * marge ne dépend pas de son voisin.
   * ⚠️ ET CE SONT TOUJOURS DES LIENS (§1, la consigne insiste) : vers
   * /tatouage/<style>/<ville>, la valeur de référencement du site.
   */
  const badgesDeStyle = tatoueur.styles.length > 0 && (
    <ul data-badges-style="" className="mt-7 flex flex-wrap gap-2">
      {tatoueur.styles.map((slug) => (
        <li key={slug}>
          <Link
            href={`/tatouage/${slug}/${tatoueur.ville_slug}`}
            className={`inline-flex items-center ${ARRONDI_ETIQUETTE} px-3.5 min-h-[32px]
                       bg-sombre-eleve text-[13px] font-medium text-sombre-texte
                       transition-colors hover:bg-sombre-haut`}
          >
            {libelleStyle(slug)}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {demonstration && noteDemonstration("mb-6")}

      {/*  LA RANGÉE DU HAUT (nº 205) — les deux onglets à gauche
           (les mots nus et la capsule de verre qui glisse, §1), et
           « SUIVRE » à droite (§2) : même ligne, même hauteur, quel
           que soit l'onglet actif. C'est le SEUL bouton Suivre de la
           fiche. Absent de l'aperçu : on ne se suit pas soi-même.
           À 390 px, tout tient sur une seule ligne : les mots à
           gauche, la capsule naturelle de Suivre à droite. */}
      {/*  ⚠️ ELLE NE DÉFILE PAS (nº 207-§4, web) : la colonne de
           lecture défile sous elle. Le fond vient de l'enveloppe
           (`bg-inherit`) — anthracite sur la page, carte dans la
           fenêtre superposée : le contenu partagé n'écrit aucune
           couleur qui lui serait propre. */}
      {/*  ⚠️ LE FOND VIENT D'UNE VARIABLE (nº 209-§6), pas de
           `bg-inherit` : celui-ci ne prend que le fond du PARENT
           DIRECT, et les blocs collants n'ont pas tous la colonne pour
           parent — on voyait donc le contenu défiler en transparence
           derrière eux. `--fond-colonne` est posée par l'enveloppe
           (anthracite sur la page, carte dans la fenêtre) et traverse
           tout l'arbre : les bandeaux sont opaques, partout. */}
      {/**
        * ██ §2 (nº 377) — AU DOIGT, LA RANGÉE SE COLLE SOUS LA BARRE ██
        * ==================================================================
        * `position: sticky`, ET RIEN D'AUTRE — aucun écouteur de
        * défilement, aucune mesure, aucun état React. Le mouvement est
        * tenu par le moteur, dans le fil de composition : il ne peut
        * donc rien perturber de la restitution de position au retour,
        * qui est le sujet sensible de ce site. Aucune écriture
        * d'adresse, aucune entrée d'historique.
        *
        * ⚠️ `sticky` ET SURTOUT PAS `fixed` : un élément collant RESTE
        * DANS LE FLUX — il garde sa place et sa hauteur tant qu'il ne
        * touche pas sa butée. Rien à réserver, donc rien qui s'effondre
        * au moment où il s'accroche : PAS DE SAUT. (C'est exactement
        * l'inverse du choix fait pour la barre fixe elle-même, qui est
        * en `fixed` au doigt et qui doit, elle, réserver sa place —
        * voir EnTeteTatouage et lib/reserve-barre.)
        *
        * LA BUTÉE — 64 px, ET CE NOMBRE N'EST PAS ÉCRIT ICI :
        * `RESERVE_LOGO` (lib/reserve-barre) est la SEULE écriture de la
        * hauteur de la barre du logo dans tout le site. C'est déjà elle
        * qui dimensionne le bloc invisible tenant la place de la barre
        * au doigt ; la rangée se cale donc sur la même valeur, par
        * construction. Si la charte change cette hauteur, les deux
        * bougent ensemble.
        * ⚠️ ET SUR UNE FICHE, LA BARRE NE CHANGE JAMAIS DE HAUTEUR :
        * elle se replie en escamotant sa RANGÉE DE RECHERCHE, que la
        * fiche ne monte pas (`rangeePresente` y est faux). Il n'y a
        * donc aucun état où la butée serait fausse.
        * ⚠️ UNE CLASSE TAILWIND NE SAIT PAS LIRE UNE CONSTANTE : la
        * valeur passe par une variable de style posée en ligne, que la
        * classe consomme. C'est l'écriture déjà employée pour la
        * réserve repliée (`VARIABLE_RESERVE_REPLIEE`).
        *
        * LE FOND : `bg-[var(--fond-colonne)]`, celui qu'elle porte
        * DÉJÀ — l'anthracite plein de la page (`--rw-sombre-fond`,
        * posé par l'enveloppe dans FicheTatoueur). Opaque, sans
        * transparence ni flou : rien ne transparaît derrière elle. Je
        * n'ajoute aucune couleur.
        *
        * LES RANGS D'EMPILEMENT : `z-[3]` au doigt.
        *  · SOUS LA BARRE FIXE, qui est au rang 50 — et sous la fenêtre
        *    d'adresse, au rang 80 ;
        *  · AU-DESSUS DU CONTENU : ce que la fiche pose de plus haut au
        *    doigt est le voile de bord d'une galerie (`z-[1]`) ; les
        *    chevrons (`z-[2]`) n'existent PAS au doigt
        *    (`hidden pointer-fine:flex`). 3 passe donc au-dessus de
        *    tout, sans égalité possible que l'ordre du flux trancherait.
        *
        * ELLE EST COLLANTE EN BLOC : c'est CE `<div>` qui colle, et il
        * porte les trois — Profil, Portfolio et Suivre. Ils ne peuvent
        * pas se séparer, il n'y a qu'un seul élément.
        *
        * LES PARENTS, VÉRIFIÉS UN PAR UN de la rangée jusqu'à `<body>` :
        * la colonne de lecture (`flex flex-col`, dont le
        * `lg:overflow-y-auto` ne vaut QUE sur le web), la grille des
        * deux colonnes, la racine `<main>`, l'enveloppe de la mise en
        * page, `<body>`. Aucun débordement caché, aucune
        * transformation, aucun filtre, aucun `contain` : rien qui
        * fabrique un bloc conteneur et neutraliserait le collage.
        * (L'`overflow-x: hidden` de `body` a été retiré à la nº 228-§3
        * et ne doit pas revenir ; les deux `overflow: hidden` de
        * globals.css visent `main.recherche-fixe` et `main.mode-double`
        * — le produit artisans, que la fiche tatoueur ne monte pas.)
        */}
      <div
        style={
          collantSousLaBarre
            ? ({
                [VARIABLE_RANGEE_COLLANTE]: `${RESERVE_LOGO}px`,
              } as CSSProperties)
            : undefined
        }
        className={`relative flex items-center justify-between gap-3
                   lg:sticky lg:top-0 lg:z-[2] bg-[var(--fond-colonne)] ${
                     /**
                      * ██ §1 (nº 380) — DE L'AIR AUTOUR DU BADGE ██
                      * ==================================================
                      * `mobile:py-3` — DOUZE PIXELS au-dessus et douze
                      * en dessous, pour qu'une fois collée sous la
                      * barre fixe la rangée ne présente plus le badge
                      * à ras du verre.
                      *
                      * D'OÙ VIENT LE CHIFFRE : de la rangée
                      * ELLE-MÊME. Elle porte `gap-3` depuis toujours —
                      * douze pixels entre le sélecteur et « Suivre ».
                      * On applique donc à l'autre axe l'air qu'elle
                      * s'était déjà choisi : douze horizontalement,
                      * douze verticalement. Rien n'est emprunté à un
                      * parent, et c'est tout le sujet de cette passe.
                      *
                      * ⚠️ CE QUE ÇA NE FAIT PAS, ET LA Nº 378 EST MORTE
                      * DE L'AVOIR FAIT : aucune compensation. On ne
                      * retire pas l'écart de la grille, on ne rogne pas
                      * le rembourrage de la page, on ne reprend rien
                      * nulle part pour « équilibrer ». La rangée
                      * grandit de 24 px et la page s'allonge d'autant —
                      * c'est accepté, et c'est le prix de ne toucher à
                      * AUCUN conteneur parent.
                      *
                      * ⚠️ TROIS VERROUS INDÉPENDANTS TIENNENT LA
                      * FENÊTRE SUPERPOSÉE HORS DE PORTÉE :
                      *  1. LE DRAPEAU — cette chaîne n'est concaténée
                      *     que si `collantSousLaBarre`. `FenetreFiche`
                      *     ne le passe jamais : la rangée de la fenêtre
                      *     ne reçoit même pas la classe dans son
                      *     attribut `class` ;
                      *  2. LA VARIANTE — `mobile:` compile en
                      *     `:where([data-appareil="mobile"], …)`. Sur
                      *     le web, `<html>` porte `data-appareil="web"` :
                      *     la règle ne peut pas s'appliquer, même si la
                      *     classe s'y trouvait ;
                      *  3. LA PROPRIÉTÉ — un rembourrage sur CETTE
                      *     boîte. Ni marge, ni écart, ni largeur, ni
                      *     hauteur : rien dont la taille d'une AUTRE
                      *     boîte serait déduite. La rangée est un
                      *     élément d'une colonne souple dans les deux
                      *     enveloppes ; son rembourrage la fait grandir
                      *     elle, et ne peut pas changer la largeur de
                      *     la colonne, le format de la photo, ni les
                      *     dimensions de la fenêtre.
                      *
                      * ⚠️ LE FOND SUIT SANS RIEN FAIRE :
                      * `bg-[var(--fond-colonne)]` est sur cette boîte,
                      * un fond couvre son rembourrage — la rangée reste
                      * opaque du haut de l'air au bas.
                      * ⚠️ AUCUNE ZONE TACTILE RÉTRÉCIE : un rembourrage
                      * agrandit la boîte AUTOUR de ses enfants ; ni le
                      * sélecteur ni « Suivre » ne changent de gabarit.
                      */
                     collantSousLaBarre
                       ? "mobile:sticky mobile:top-[var(--rw-rangee-collante)] mobile:z-[3] mobile:py-3"
                       : ""
                   }`}
      >
        {/*  LE CAPOT — la colonne de la fenêtre superposée porte un
             rembourrage haut (24 px) : sans lui, le contenu défilerait
             VISIBLEMENT dans cette bande, au-dessus de la rangée. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-full hidden h-8 bg-[var(--fond-colonne)] lg:block"
        />
        <SelecteurOngletAffiche valeur={onglet} surChoix={choisirOnglet} />
        {!apercu && (
          <BoutonSuivre
            tatoueurId={tatoueur.id}
            nomTatoueur={tatoueur.nom}
            suiviAuDepart={suiviAuDepart}
          />
        )}
      </div>

      {onglet === "portfolio" && (
        <PanneauPortfolio
          groupes={groupes}
          nomTatoueur={tatoueur.nom}
          surSerie={(serie) => {
            noterSonde(
              `VIGNETTE demandée · style « ${serie.style} » · catégorie ` +
                `« ${serie.nature} » · rendu « ${serie.rendu} »`
            );
            surSerieChoisie(serie);
            //  §1 (nº 236) — UNE VIGNETTE DE STYLE CHANGE LES PHOTOS
            //  D'EN DESSOUS : la page remonte. Même mouvement, même
            //  durée que les sélecteurs, aucune entrée d'historique.
            //  ⚠️ MAIS PAS AU MÊME REPÈRE (nº 239-§1) : elle ramène TOUT
            //  EN HAUT, au sommet de la photo de l'affiche — elle
            //  change la photo, pas seulement ce qui est dessous.
            //  Profil / Portfolio gardent le leur, sous la barre.
            //  ⚠️ SEULE LA VIGNETTE REMONTE : ouvrir une PHOTO passe
            //  par le carrousel de l'enveloppe, pas par ici — rien n'y
            //  bouge, et c'est voulu.
            //  ⚠️ ET ELLE SE FAIT APRÈS LE RENDU (nº 238-§1) : c'est le
            //  seul sélecteur qui change aussi la photo du haut, donc
            //  le repère lui-même. Voir `remonteeDemandee`.
            setRemonteeDemandee((tour) => tour + 1);
          }}
        />
      )}

      {onglet === "profil" && (
        <>
          {/* ==========================================================
              §1 — L'IDENTITÉ
              ==========================================================
              ⚠️ `items-start`, ET C'EST LA RÈGLE DE MISE EN PAGE
              (nº 222-§1e) : le haut du nom ne dépasse JAMAIS le haut de
              la photo. Le bloc était centré verticalement — un nom sur
              deux lignes remontait donc AU-DESSUS d'elle. Calé en haut,
              il commence à sa hauteur et se prolonge SOUS elle s'il est
              long, en gardant son alignement sur le bord gauche DU
              TEXTE (sa colonne), jamais sur celui de la photo.
              ⚠️ ET UNE MARGE AU-DESSUS (nº 222-§1b) : la photo touchait
              la rangée Profil / Portfolio / Suivre. */}
          {/*  §1 (nº 241) — 40 px AU-DESSUS ET AU-DESSOUS de la
               photo, égaux : EXACTEMENT l'espacement qui entoure les
               lignes de séparation depuis la nº 223 (`mt-10 pt-10`) —
               le rythme de la fiche, pas une valeur inventée. (La
               nº 225 les tenait à 32 ; le bloc des liens porte
               toujours la marge basse : son `mt-10` MESURE cette
               marge, il ne s'y ajoute pas.)
               §2 — LE CENTRAGE CONDITIONNEL, en CSS pur et au pixel :
               la colonne de texte porte `min-height` = hauteur de la
               photo (92 px) et centre son contenu (`justify-center`).
               Un bloc MOINS haut que la photo est donc centré sur
               elle ; un bloc PLUS haut fait grandir sa boîte vers le
               bas (le parent est calé en haut, `items-start`) : son
               sommet reste exactement au haut de la photo, et la
               suite continue dessous, dans la même colonne. Aucun
               JavaScript, aucune mesure — la bascule est celle de la
               boîte elle-même. */}
          <div className="mt-10 flex items-start gap-5">
            {avatarProfil}
            <div className="flex min-h-[92px] min-w-0 flex-1 flex-col justify-center">
              {/*  LE NOM — une taille de titre de profil, DEUX LIGNES
                   AU PLUS, puis des points de suspension (nº 222-§1c
                   et §1d). La passe de finition ajustera la valeur. */}
              {/*  20 px au doigt, 22 px au large — l'échelle d'un
                   titre de profil : nettement au-dessus du sous-titre,
                   sans crier, et deux lignes d'un nom long tiennent à
                   390 px.
                   §3 (nº 292) — LE WEB REDESCEND À 19 px. Le
                   propriétaire le trouvait trop imposant : 22 px dans
                   une colonne de lecture de 340 à 400 px, c'était le
                   poids d'un titre de page, pas d'un titre de profil.
                   LA HIÉRARCHIE TIENT, et c'est ce qui décide : 19 px
                   en gras contre les 12 px en capitales du sous-titre
                   juste dessous, et contre les 15 px des valeurs de la
                   fiche — il reste le plus important de la page, de
                   loin. LE DOIGT NE BOUGE PAS (20 px) : c'est le web
                   seul qui était trop grand. */}
              <h1 className="line-clamp-2 text-[20px] lg:text-[19px] font-bold tracking-tight text-sombre-texte leading-[1.25]">
                {tatoueur.nom}
              </h1>
              {/*  LE SOUS-TITRE — UN SEUL MOT (nº 228-§2) :
                   « ARTISTE », « SALON » ou « STUDIO ». Le lieu et le
                   rôle qui vivaient ici sont descendus dans le bloc
                   des lieux, devant chaque adresse — la règle vit dans
                   `sousLeNom` (BlocsFiche) et `etiquetteDuMode`
                   (BlocLieux). */}
              {/*  §4 (nº 293) — LE SOUS-TITRE PASSE DE 12 À 14 px, aux
                   DEUX largeurs. À 12 px, en capitales et en gris doux,
                   il se lisait comme une mention légale ; c'est
                   pourtant lui qui dit ce QU'EST le portfolio.
                   LA HIÉRARCHIE TIENT, et c'est ce qui décide : les
                   capitales de 14 px ont une hauteur d'œil d'environ
                   10 px, contre 13 à 14 pour le nom (19 px au web,
                   20 au doigt) — il reste nettement dessous, et le gris
                   doux l'y maintient. */}
              <p className="mt-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-sombre-texte-doux">
                {sousLeNom(tatoueur)}
              </p>
            </div>
          </div>

          {/* ==========================================================
              §2 — LES LIENS, SOUS LA PHOTO
              ==========================================================
              DEUX LIGNES, RÈGLE EXACTE (nº 227-§4) : les sites sur la
              première, Instagram et TikTok ensemble sur la seconde —
              sauf sans TikTok, où Instagram remonte. Chacun son icône
              à gauche, la colonne de 18 px pour les trois. Le `mt-8`
              reste la marge basse de la photo (nº 225-§1). */}
          {/*  16 px entre les deux lignes (nº 229-§3), et DEUX
               COLONNES DE LARGEUR ÉGALE (nº 233-§5) : chaque ligne est
               une grille au même gabarit — l'écart entre Instagram et
               TikTok est EXACTEMENT celui des deux liens du dessus, et
               TikTok se range sous le deuxième lien. `justify-items-
               start` : la colonne est large, le lien garde sa taille.
               L'ordre de la nº 227 ne bouge pas. */}
          {(premiereLigne.length > 0 || secondeLigne.length > 0) && (
            <div className="mt-10 flex w-full flex-col items-start gap-y-4">
              {premiereLigne.length > 0 && (
                <div className="grid w-full grid-cols-2 items-center justify-items-start gap-x-7 gap-y-4">
                  {premiereLigne}
                </div>
              )}
              {secondeLigne.length > 0 && (
                <div className="grid w-full grid-cols-2 items-center justify-items-start gap-x-7 gap-y-4">
                  {secondeLigne}
                </div>
              )}
            </div>
          )}

          {/* §3 — LA BIOGRAPHIE, sous les liens. Retours à la ligne
              saisis respectés, mots sans espace coupés proprement. */}
          {tatoueur.bio && (
            <p className="mt-7 text-[15px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
              {tatoueur.bio}
            </p>
          )}

          {/*  §1 (nº 315) — LES BADGES DE STYLE, DIRECTEMENT SOUS LA
               BIO. Sans titre, sans trait : la fin de la présentation,
               pas une section. Les sections titrées ne commencent
               qu'après eux. (Voir `badgesDeStyle` plus haut.) */}
          {badgesDeStyle}

          {/* ==========================================================
              §4 et §5 — OÙ TRAVAILLE CETTE FICHE
              ==========================================================
              UN LIEU montre ses ADRESSES, empilées (nº 226-§3) : celle
              de l'affiche (photo, adresse, horaires), puis chaque
              autre adresse sur sa ligne, puis l'équipe — toujours
              après toutes les adresses.
              UN ARTISTE montre ses PROFILS, dans l'ordre imposé
              (nº 222-§1g) : à domicile, en studio, en salon, guest.
              ⚠️ LA LIGNE DE SÉPARATION EST POSÉE ICI, jamais dans le
              bloc : c'est l'enveloppe qui sépare ses sections. */}
          {tatoueur.type_fiche === "artiste" ? (
            <div className={`mt-10 pt-10 ${separation}`}>
              <BlocProfilsArtiste tatoueur={tatoueur} />
            </div>
          ) : (
            <div className={`mt-10 pt-10 ${separation}`}>
              <BlocAdressesFiche
                tatoueur={tatoueur}
                studioCourantId={studioCourant}
              />
            </div>
          )}

          {/* ==========================================================
              §6 — « PRATIQUE », PUIS LE SIGNALEMENT
              ==========================================================
              §2 (nº 315) — QUATRE SECTIONS EN UNE. RENDU, TECHNIQUE,
              TYPES DE PROJETS et BESOINS PARTICULIERS n'ont plus
              chacun leur titre : leurs capsules se rangent ensemble
              sous « PRATIQUE », dans l'ordre fixe de `capsulesPratique`.
              ⚠️ RIEN DE DÉCLARÉ, PAS DE TITRE ORPHELIN : la section
              entière ne s'affiche pas quand la liste est vide.
              ⚠️ ET LES CAPSULES N'ONT PLUS DE CONTOUR (charte) : chaque
              niveau s'éclaircit — la page, le bloc, la capsule. */}
          {capsulesPratique.length > 0 && (
            <div className={`mt-10 pt-10 ${separation}`}>
              {/*  §3 (nº 276) — l'écriture de la nº 223, désormais en
                   constante partagée (les titres du Portfolio la
                   consomment aussi) : une seule écriture, partout. */}
              <h2 className={ECRITURE_TITRE_SECTION}>Pratique</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {capsulesPratique.map((slug) => (
                  <li
                    key={slug}
                    data-capsule-pratique=""
                    className={`inline-flex items-center ${ARRONDI_ETIQUETTE} px-3.5 min-h-[32px]
                               bg-sombre-eleve text-[13px] font-medium text-sombre-texte`}
                  >
                    {libelleFiltre(slug)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LE SIGNALEMENT — DERRIÈRE L'UNIQUE TRAIT qui suit les
              badges (nº 222-§6). En dessous, la mise hors ligne : un
              lien PUBLIC et un pouvoir d'ADMINISTRATION n'ont rien à
              faire sur la même ligne (le composant ne rend rien tant
              que le SERVEUR n'a pas reconnu l'administrateur). */}
          {!apercu && (
            <div
              className={`mt-10 pt-10 ${separation} flex flex-col items-start gap-4`}
            >
              <FenetreSignalement slug={tatoueur.slug} nom={tatoueur.nom} />
              <BoutonHorsLigne idFiche={tatoueur.id} nom={tatoueur.nom} />
            </div>
          )}
        </>
      )}
    </>
  );
}
