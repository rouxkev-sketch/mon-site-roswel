"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  defilerEnDouceur,
  defilerSansGeste,
} from "@/lib/defilement-programme";
//  ⚠️ TEMPORAIRE (nº 218-§1) — la sonde du carrousel : elle veut
//  savoir CE QUI A ÉTÉ DEMANDÉ (style, catégorie, rendu) juste avant
//  ce que le carrousel reçoit. Sans `?sonde-carrousel=1`, ne coûte rien.
import { noter as noterSonde } from "@/lib/journal-carrousel";
import {
  //  §1 (nº 386) — `ARRONDI_ETIQUETTE` et `ECRITURE_TITRE_SECTION`
  //  sont partis avec la section « Pratique » : plus une seule
  //  capsule ni un seul titre de section dans ce fichier.
  libelleFiltre,
  libelleStyle,
  PORTRAIT_ROND,
  TRAIT_SEPARATION,
} from "@/config/tatouage";
import { BoutonHorsLigne } from "@/components/BoutonHorsLigne";
import {
  IconeCalendrier,
  IconeDiamant,
  IconeDuLien,
  IconeEtoile,
  //  §6 (nº 415) — la ligne du freelance porte L'ICÔNE DE LOCALISATION,
  //  la même que l'adresse d'un salon (voir `LigneAdresseDuLieu`,
  //  BlocLieux) : c'est un lieu qu'elle annonce, le glyphe le dit.
  IconeLocalisation,
} from "@/components/IconeReseau";
import { BoutonSuivre } from "@/components/BoutonSuivre";
import {
  PanneauPortfolio,
  SelecteurOngletAffiche,
  type OngletAffiche,
  type SerieChoisie,
} from "@/components/PortfolioDeLAffiche";
import { capsulesPratiques } from "@/lib/pratique-fiche";
//  §3 (nº 388) — l'écriture d'une ligne de profil a déménagé dans un
//  module sans dépendance : l'adresse se dessine dans BlocLieux, et un
//  cercle d'imports se paie cher (voir lignes-profil).
import {
  BOITE_ICONE_LIGNE,
  ECRITURE_LIGNE_FICHE,
  //  §3 (nº 416) — le bleu de ce qui sort du site : la localité d'un
  //  Independent mène à Google Maps, comme l'adresse d'un salon.
  LIEN_QUI_SORT,
  LIGNE_GRISE,
} from "@/components/lignes-profil";
import type { StyleGalerie } from "@/lib/photo-tatoueur";
import { FenetreSignalement } from "@/components/FenetreSignalement";
import { libelleDuLien } from "@/lib/liens-fiche";
import { sousLeNom } from "@/components/BlocsFiche";
import {
  LigneAdresseDuLieu,
  BlocAdressesFiche,
  BlocProfilsArtiste,
  //  §3 (nº 416) — LE MÊME LIEN D'ADRESSE QUE LES SALONS : la localité
  //  d'un Independent se clique « exactement comme l'adresse d'un
  //  salon », donc par le composant qui la porte déjà — jamais par une
  //  seconde écriture.
  LienAdresse,
} from "@/components/BlocLieux";
//  §6 (nº 415) — les deux familles de modes (ceux qui ont un lieu,
//  ceux qui n'en ont pas) et les morceaux de la ligne du profil :
//  une seule règle, lue ici comme dans BlocLieux.
import {
  lieuCherchableDuFreelance,
  lignesDuFreelance,
  modesDeLieu,
  modesFreelance,
} from "@/lib/modes-exercice";
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
   * ██ §2 (nº 383) — CHAQUE ONGLET S'OUVRE À SON DÉBUT ██
   * ==================================================================
   * LE DÉFAUT : on descend dans « Profil », on touche « Portfolio », et
   * l'on arrive au milieu — le navigateur garde la position de
   * défilement, alors que le contenu, lui, a entièrement changé.
   *
   * CE QUE JE NE REFAIS PAS, ET LA Nº 377 L'AVAIT SUPPRIMÉ SUR
   * CONSIGNE : le mouvement ANIMÉ de `remonterSousLaBarre`
   * (`defilerEnDouceur`, ~300 ms) suivi d'une garantie qui REMESURAIT
   * à l'arrivée. Ses deux défauts tenaient à l'animation :
   *  · on VOYAIT la page glisser — le « saut désagréable » ;
   *  · pendant ces 300 ms, la barre lisait un GESTE vers le bas et
   *    pouvait se replier (le piège nommé à la nº 335-§1), et la
   *    mesure prise AVANT le mouvement vieillissait pendant.
   * Rien de tout cela n'existe ici : le mouvement est INSTANTANÉ.
   *
   * DEUX CHEMINS, PARCE QU'IL Y A DEUX DÉFILEMENTS :
   *  1. LÀ OÙ LE CONTENU A SON PROPRE DÉFILEMENT — la colonne de
   *     lecture du web, et la fenêtre superposée — on remet SA position
   *     à zéro. LA PAGE NE BOUGE PAS DU TOUT : rien ne glisse, rien ne
   *     saute, la photo de gauche ne bronche pas. C'est exactement « le
   *     contenu repart de son début » ;
   *  2. AU DOIGT, le contenu EST la page : il n'y a pas d'autre
   *     défilement à remettre à zéro. On ramène donc la page à la
   *     position où la rangée touche sa butée — et comme la rangée y
   *     est DÉJÀ collée quand on est plus bas, RIEN NE BOUGE À L'ŒIL
   *     sauf le contenu qui reprend à son début.
   *     ⚠️ ET SEULEMENT VERS LE HAUT (`scrollY > cible`) : ce mouvement
   *     ne peut jamais pousser la page vers le bas ni masquer la photo
   *     quand on est déjà en haut.
   *
   * ⚠️ LE REPÈRE NE VIEILLIT PAS : c'est le PARENT de la rangée qui est
   * mesuré, pas la rangée — un élément collant ment sur sa position dès
   * qu'il est collé. Et la lecture est suivie du mouvement dans la même
   * tâche, sans animation entre les deux.
   * ⚠️ `defilerSansGeste` : la barre ne doit pas lire une intention là
   * où il n'y a que du code (nº 154-§6A). Il est « instantané » par
   * défaut.
   * ⚠️ AUCUNE ÉCRITURE D'ADRESSE, AUCUNE ENTRÉE D'HISTORIQUE
   * (règle 332-§1) : ce bloc ne touche qu'à une position de défilement.
   */
  /** §2 (nº 383) — LA RANGÉE DU HAUT, pour retrouver le défilement du
      contenu sans que les enveloppes aient à se nommer. */
  const rangeeDuHaut = useRef<HTMLDivElement | null>(null);

  function ouvrirLOngletAuDebut() {
    if (typeof window === "undefined") return;
    const rangee = rangeeDuHaut.current;
    if (!rangee) return;
    //  1 · LE DÉFILEMENT PROPRE AU CONTENU, s'il existe. On le cherche
    //  en remontant : ni la page ni la fenêtre n'ont à se nommer, et
    //  les deux enveloppes marchent sans rien changer chez elles.
    let noeud: HTMLElement | null = rangee.parentElement;
    while (noeud && noeud !== document.body) {
      const vertical = getComputedStyle(noeud).overflowY;
      if (
        (vertical === "auto" || vertical === "scroll") &&
        noeud.scrollHeight > noeud.clientHeight
      ) {
        noeud.scrollTop = 0;
        return;
      }
      noeud = noeud.parentElement;
    }
    //  2 · SINON, LA PAGE — vers le haut seulement, et d'un seul coup.
    const parent = rangee.parentElement;
    if (!parent) return;
    const cible = Math.max(
      0,
      Math.round(
        parent.getBoundingClientRect().top + window.scrollY - RESERVE_LOGO
      )
    );
    if (window.scrollY <= cible) return;
    defilerSansGeste({ top: cible });
  }

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
    ouvrirLOngletAuDebut();
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
  /**
   * ██ §4 et §5 (nº 388) — PLUS DE PILULE, ET UN BLEU POUR CE QUI SORT
   * DU SITE ██
   * ==================================================================
   * §4 — L'ENCADRÉ DE SURVOL EST SUPPRIMÉ. Il était fait de cinq
   * classes qui allaient ensemble : `rounded-lg` (l'arrondi),
   * `hover:bg-white/5` et `active:bg-white/10` (le fond), et
   * `-mx-1.5 -my-1 px-1.5 py-1` (le débord compensé qui donnait à la
   * pilule sa chair sans déplacer le texte). Les cinq partent : il ne
   * reste QUE le texte qui s'éclaircit.
   * ⚠️ LA ZONE CLIQUABLE NE RÉTRÉCIT PAS. Ce débord compensé était
   * NUL par construction — six pixels de marge négative rendus en six
   * pixels de rembourrage : la boîte cliquable avait donc exactement
   * la taille qu'elle a aujourd'hui. Ce qui disparaît est la
   * PEINTURE, pas la surface. Le lien reste une ligne entière
   * (`flex`), icône comprise.
   *
   * §5 — LE BLEU EST UN RÉGLAGE, PAS UNE FATALITÉ. Avant la nº 388,
   * le booking, le site, Instagram et l'adresse partageaient une seule
   * et même écriture : rendre Instagram bleu les aurait TOUS emportés.
   * `sortDuSite` tranche donc appelant par appelant — et c'est ce qui
   * permet à la nº 405 d'y ajouter LES DEUX LIENS DE SITE sans toucher
   * à une ligne de couleur. Le passent aujourd'hui : Instagram,
   * l'adresse, le site et la page de liens. Ne le passent pas : le
   * booking (gris doux) ; les styles n'utilisent même pas cette
   * fonction.
   * ⚠️ L'ICÔNE RESTE GRISE : elle est peinte en `currentColor`, donc
   * elle suivrait le bleu du texte. On lui rend donc explicitement le
   * gris de la colonne (`text-sombre-texte-doux` sur sa boîte), ce qui
   * la détache du libellé sans rien changer à son tracé.
   */
  const lienEnLigne = (
    cle: string,
    href: string,
    libelle: string,
    icone: React.ReactNode,
    sortDuSite = false
  ) => (
    <a
      key={cle}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      /*  §1 (nº 389) — UNE SEULE CLASSE DE COULEUR, ET C'EST LA
           CORRECTION : `ECRITURE_LIGNE_FICHE` n'en porte plus aucune
           (voir lignes-profil), le bleu et le gris ne se disputent
           donc plus l'ordre de la feuille. */
      /*  §3 (nº 391) — `max-w-full` BORNE LA CASE À SA PISTE. Sans lui,
           `justify-items-start` taille la case sur SON CONTENU, et le
           `white-space: nowrap` du `truncate` rend ce contenu
           INCOMPRESSIBLE : la case ignorait sa moitié de colonne et
           partait à droite. Mesuré : deux domaines longs donnaient une
           case de 354,9 px dans une piste de 152, et la seconde case
           finissait à 534,9 px dans une colonne de 332 — donc 203 px
           HORS de la colonne, tranchés net par son `overflow-x: clip`,
           sans points de suspension. `max-width: 100%` d'un enfant de
           grille se mesure sur SA PISTE : la case s'y arrête, le
           libellé peut enfin rétrécir, et le `truncate` fait ce pour
           quoi il est là — une ellipse, à l'intérieur. */
      className={`group flex max-w-full items-center gap-2.5 ${ECRITURE_LIGNE_FICHE} ${
        sortDuSite
          ? "text-sombre-lien hover:text-sombre-lien-clair"
          : `${LIGNE_GRISE} hover:text-sombre-texte`
      } transition-colors`}
    >
      {/*  ██ §1 (nº 392) — L'ICÔNE REVIENT AU GRIS, SANS CONDITION ██
           La nº 391 laissait la boîte sans couleur quand la ligne sortait
           du site : le tracé étant en `currentColor`, l'icône prenait le
           bleu du lien. Le propriétaire est revenu dessus — TOUTES les
           icônes de la colonne sont grises, comme à la nº 389. Le
           ternaire disparaît, il n'y a plus qu'une écriture.
           ⚠️ SEULE L'ICÔNE REVIENT : le MOT garde son bleu et son
           éclaircissement au survol — ils sont posés sur le `<a>`, pas
           ici.
           ⚠️ UNE SEULE CLASSE DE COULEUR SUR CETTE BOÎTE, JAMAIS DEUX :
           c'est tout le piège de la nº 389 (Tailwind range ses
           utilitaires par ordre alphabétique, `sombre-lien` tombe AVANT
           `sombre-texte-doux`, le gris gagnait donc toujours, quel que
           soit l'ordre d'écriture). Le bleu du lien vit sur un AUTRE
           élément — le `<a>` parent — donc il n'y a pas de dispute :
           c'est un héritage, que ce gris-ci recouvre proprement. */}
      <span className={`${BOITE_ICONE_LIGNE} text-sombre-texte-doux`}>
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
  const iconeDeLien = (reseau: "instagram" | "site") => (
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
  /*  ██ §3 (nº 408) — LE DÉLAI PASSE SUR DEUX LIGNES ██
       CE QU'IL Y AVAIT : « Booking · 12 mois », tout sur une ligne —
       et l'état du carnet n'y était jamais dit en toutes lettres.
       CE QUE C'EST DEVENU, sur deux lignes alignées l'une sous
       l'autre :
             Booking ouvert
             Attente : 12 mois
       Un délai, c'est un booking OUVERT avec une attente : la
       première ligne le dit, la seconde chiffre. « Attente » remplace
       « Délai d'attente », plus court comme demandé.
       ⚠️ LES DEUX AUTRES ÉTATS NE BOUGENT PAS : une seule ligne,
       « Booking ouvert » ou « Booking fermé », au mot près.
       ⚠️ ET LE SILENCE NON PLUS : un « delai » sans mois (donnée
       d'avant les garde-fous) reste muet — on n'écrit pas
       « Attente : ? mois ». */
  const libelleBooking =
    tatoueur.booking === "ouvert" || tatoueur.booking === "delai"
      ? "Booking ouvert"
      : tatoueur.booking === "ferme"
        ? "Booking fermé"
        : null;
  const attenteBooking =
    tatoueur.booking === "delai" && tatoueur.booking_mois
      ? `Attente : ${tatoueur.booking_mois} mois`
      : null;
  //  ⚠️ UN « delai » SANS MOIS SE TAIT, comme avant la nº 408 : sans
  //  chiffre, la première ligne dirait « Booking ouvert » là où
  //  l'artiste a déclaré une attente — ce serait lui faire dire autre
  //  chose que ce qu'il a coché.
  const bookingLisible =
    tatoueur.booking === "delai" ? Boolean(attenteBooking) : true;
  const entreeBooking = tatoueur.booking && libelleBooking && bookingLisible && (
    <span
      key="booking"
      data-booking-fiche={tatoueur.booking}
      /*  §3 (nº 391) — MÊME BORNE QUE LES LIENS, ET POUR LA MÊME
           RAISON : mesuré dans la fenêtre superposée, « Booking ouvert »
           fait une case de 146,1 px dans une piste de 152 — il reste
           5,9 px, moins d'un caractère. Tout ce qui entoure ce texte est
           en `rem` (`gap-x-7` = 1,75 rem, `gap-2.5` = 0,625 rem, le
           `p-6` de la fenêtre = 1,5 rem) alors que le texte, lui, est
           figé à 15 px : au moindre écart de rendu, la case passe en
           débordement. Et « Booking · 12 mois » y est DÉJÀ : 166,5 px
           dans 152, soit 14,5 px qui partent sur la case voisine.
           `max-w-full` referme la case sur sa piste. */
      /*  §3 (nº 408) — `items-start` REMPLACE `items-center` : avec
           deux lignes, centrer l'icône la ferait flotter entre elles.
           `BOITE_ICONE_LIGNE` fait exactement UNE hauteur de ligne
           (`h-[1.375em]`, le `leading-snug` de 15 px) : posée en haut,
           elle se centre donc sur la PREMIÈRE ligne, au pixel — et
           rien ne bouge sur les fiches à une seule ligne, où les deux
           alignements donnent le même résultat. */
      className={`flex max-w-full items-start gap-2.5 ${ECRITURE_LIGNE_FICHE} ${LIGNE_GRISE}`}
    >
      {/*  §1 (nº 273) — LE CALENDRIER, hors de tout ternaire d'état :
           une seule écriture couvre les trois états PAR CONSTRUCTION —
           aucune variante n'est seulement possible. */}
      <span className={BOITE_ICONE_LIGNE}>
        <IconeCalendrier taille={20} />
      </span>
      {/*  §3 (nº 391) — PLUS DE `truncate` ICI, ET C'EST LE CŒUR DE LA
           CORRECTION. Il ne servait à rien : son `white-space: nowrap`
           empêchait le libellé de se plier, la case se taillait donc sur
           le texte entier et l'ellipse ne se déclenchait JAMAIS
           (mesuré : `ellipse=false` dans les trois formulations). Il ne
           faisait qu'une chose — interdire le repli — et c'est
           exactement ce qui envoyait le texte hors de sa case, là où un
           `overflow` de conteneur le tranche au milieu d'une lettre,
           sans points de suspension.
           SANS LUI : le libellé peut se plier. Le plus court mot
           (« Booking ») devient sa largeur minimale, la case tient donc
           dans n'importe quelle piste, et le texte est TOUJOURS lisible
           en entier — sur une ligne quand il y a la place (mesuré :
           146,1 px, rigoureusement identique à aujourd'hui pour
           « Booking ouvert » et « Booking fermé », page et fenêtre), sur
           deux quand il n'y en a pas. Rien n'est plus jamais caché.
           ⚠️ LE `truncate` DES LIENS RESTE : un nom de domaine long doit
           bien s'arrêter quelque part, et l'ellipse est la bonne réponse
           pour lui — elle fonctionne enfin, grâce au `max-w-full`
           ci-dessus. Les trois formulations du booking, elles, forment
           un vocabulaire fermé : il n'y a rien à abréger. */}
      {/*  §3 (nº 408) — LES DEUX LIGNES DANS UNE COLONNE, derrière
           l'icône : la seconde commence donc EXACTEMENT sous la
           première, aucune des deux ne se décale. La colonne est le
           seul enfant souple de la rangée, elle garde le `min-w-0` qui
           autorise le repli du texte (leçon de la nº 391). */}
      <span className="flex min-w-0 flex-col">
        <span>{libelleBooking}</span>
        {/*  ██ §1 (nº 409) — POURQUOI « Attente » DÉBORDAIT À GAUCHE ██
             CE N'EST NI UNE MARGE NI UN ESPACE : les deux lignes sont
             deux enfants d'une même colonne flex, de même corps et de
             même graisse — leurs ORIGINES sont au même pixel. C'est
             l'APPROCHE GAUCHE des glyphes qui diffère, une donnée de
             la police elle-même. Relevé dans la table `hmtx` de Geist
             (1000 unités par cadratin) : le « B » de « Booking » a une
             approche de 92 unités, le « A » d'« Attente » de 20. À
             15 px, l'encre du A commence donc 1,08 px PLUS À GAUCHE
             que celle du B — exactement ce qui se voit.
             LA COMPENSATION : (92 − 20) / 1000 = 0,072 em, posé en
             rembourrage gauche sur la seconde ligne SEULE. En `em`,
             elle suit le corps du texte si celui-ci change.
             ⚠️ ELLE EST LIÉE À CES DEUX MOTS-LÀ. Changer « Attente »
             ou « Booking » — ou changer de police — change l'écart et
             oblige à recalculer cette valeur. C'est le prix d'un
             alignement optique : le navigateur aligne des origines,
             pas de l'encre, et aucune propriété CSS ne fait ce travail
             à notre place. */}
        {attenteBooking && (
          <span className="pl-[0.072em]">{attenteBooking}</span>
        )}
      </span>
    </span>
  );

  /*  ██ §2 (nº 408) — « Instagram • DM » QUAND LA CASE EST COCHÉE ██
       LE TOUT EN BLEU — le mot, la puce et « DM » —, et c'est GRATUIT :
       le bleu est posé sur le `<a>` entier par `sortDuSite` (cinquième
       argument, déjà `true` pour Instagram depuis la nº 388), donc
       tout ce que le libellé contient l'hérite. L'ICÔNE RESTE GRISE
       par le même mécanisme qu'ailleurs : son gris vit sur SA boîte,
       un autre élément (nº 392). Aucune classe de couleur n'est
       ajoutée ici — donc aucun risque de rejouer la nº 389.
       ⚠️ LA PUCE EST CELLE DU SITE (U+2022, nº 393) : la même que les
       pratiques, les styles et les titres de galerie.
       ⚠️ NON COCHÉE, LA LIGNE NE BOUGE PAS D'UN CARACTÈRE : « Instagram »,
       comme avant. Et sans la migration, `dm_instagram` est absent,
       donc faux : la mention ne peut pas apparaître par accident. */
  const lienInstagram =
    tatoueur.lien_instagram &&
    lienEnLigne(
      "instagram",
      tatoueur.lien_instagram,
      //  §3 (nº 409) — DM PASSE DEVANT : « DM • Instagram ». La
      //  destination du lien ne change pas d'un caractère, et le bleu
      //  comme le gris de l'icône continuent de venir d'ailleurs.
      tatoueur.dm_instagram ? "DM • Instagram" : "Instagram",
      iconeDeLien("instagram"),
      //  §5 (nº 388) — Instagram SORT DU SITE : bleu, et lui seul avec
      //  l'adresse. Le booking et le site gardent le gris doux.
      true
    );
  /**
   * ██ §2 (nº 387) — TIKTOK NE S'AFFICHE PLUS NULLE PART ██
   * ==================================================================
   * Le champ a quitté le formulaire (FormulaireFiche) ; sa LECTURE
   * quitte les fiches ici. Les valeurs déjà écrites en base restent
   * dans leur colonne — on ne les efface pas, on ne les lit plus.
   * C'est exactement le traitement réservé à YouTube à la nº 101, et
   * pour la même raison : ne rien effacer qu'on n'a pas demandé à
   * effacer.
   *
   * ⚠️ CE QUE DEVIENT LA RÈGLE nº 227-§4 : elle avait DEUX branches —
   * « avec TikTok, les deux réseaux prennent leur propre rangée ;
   * sans TikTok, Instagram remonte auprès du booking ». La première
   * branche n'a plus de condition capable de se vérifier : TikTok
   * n'existe plus à l'affichage. La règle se réduit donc à son
   * exception, qui devient le cas UNIQUE — Instagram est toujours sur
   * la première rangée, à côté du booking. La seconde rangée n'est pas
   * laissée inerte, elle est SUPPRIMÉE : une rangée qui ne peut plus
   * jamais avoir de contenu est du code mort, pas une réserve.
   * Aucune ligne vide, aucune icône orpheline ne peut donc subsister.
   */
  const lienInstagramEnPremiereLigne = lienInstagram;
  /**
   * §2 (nº 384) — LE SITE DESCEND D'UNE LIGNE.
   * ------------------------------------------------------------------
   * L'ORDRE DEMANDÉ : Booking et Instagram d'abord, LE SITE EN
   * DESSOUS, les styles en dernier. Les liens de site quittent donc la
   * première rangée pour la leur — un seul tableau déplacé, aucune
   * autre règle touchée.
   * ⚠️ LA RÈGLE DE LA Nº 227-§4 SUR TIKTOK NE BOUGE PAS : sans TikTok,
   * Instagram remonte auprès du booking (c'est ce qui donne « Booking
   * et Instagram » sur une même ligne) ; avec TikTok, les deux réseaux
   * restent ensemble sur leur propre rangée. Je n'ai pas touché à
   * cela : le propriétaire ne l'a pas demandé.
   */
  const premiereLigne = [
    //  §3 (nº 270) — LE BOOKING OUVRE LA LISTE, devant tout le reste :
    //  la PREMIÈRE position des liens, comme dans le formulaire.
    entreeBooking,
  ].filter(Boolean);
  /**
   * ██ §7 (nº 405) — LES LIENS DE SITE PASSENT AU BLEU ██
   * ==================================================================
   * Ils sortent du site, exactement comme Instagram et l'adresse : ils
   * prennent donc le MÊME bleu, le même éclaircissement au survol, et
   * toujours aucun soulignement — c'est le cinquième argument de
   * `lienEnLigne` (`sortDuSite`) qui le dit, et rien d'autre. Aucune
   * couleur n'est écrite ici.
   * ⚠️ AUCUN PIÈGE DE LA nº 389 : le bleu ne vient pas d'une seconde
   * classe posée à côté d'un gris — c'est un TERNAIRE, une classe OU
   * l'autre, jamais les deux (voir `lienEnLigne`). Et l'ICÔNE RESTE
   * GRISE sans condition depuis la nº 392 : son gris vit sur la boîte
   * de l'icône, un AUTRE élément que le `<a>` qui porte le bleu — un
   * héritage recouvert, pas une dispute d'ordre alphabétique.
   * ⚠️ LES DEUX EMPLACEMENTS PASSENT ENSEMBLE. Ce sont deux exemplaires
   * du même objet (`LienLibre` : une URL, un titre) ; en laisser un
   * gris et l'autre bleu ferait croire à deux natures de lien.
   * ⚠️ CE QUI NE BOUGE PAS, comme demandé : le booking, les pratiques
   * et les styles restent dans le gris doux commun.
   */
  const ligneDuSite = [
    tatoueur.site_web &&
      lienEnLigne(
        "site",
        tatoueur.site_web,
        tatoueur.titre_site_web || libelleDuLien(tatoueur.site_web),
        iconeDeLien("site"),
        true
      ),
    tatoueur.page_de_liens &&
      lienEnLigne(
        "liens",
        tatoueur.page_de_liens,
        tatoueur.titre_page_de_liens || libelleDuLien(tatoueur.page_de_liens),
        iconeDeLien("site"),
        true
      ),
  ].filter(Boolean);
  //  §2 (nº 387) — INSTAGRAM EST TOUJOURS SUR LA PREMIÈRE RANGÉE,
  //  auprès du booking : voir la note de la règle nº 227-§4 plus haut.
  //  La seconde rangée est supprimée avec TikTok.
  if (lienInstagramEnPremiereLigne) {
    premiereLigne.push(lienInstagramEnPremiereLigne);
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
  /**
   * ██ §2 (nº 384) — LES STYLES QUITTENT LES CAPSULES POUR UNE LIGNE ██
   * ==================================================================
   * CE QUI DISPARAÎT : les capsules (`ARRONDI_ETIQUETTE`, fond
   * `sombre-eleve`, 13 px, 32 px de haut) de la nº 315.
   * CE QUI PREND LEUR PLACE : L'ÉCRITURE DE « BOOKING OUVERT », et pas
   * une imitation — `ECRITURE_LIGNE_FICHE` et `BOITE_ICONE_LIGNE` sont
   * les constantes que cette ligne-là consomme désormais elle aussi
   * (voir en tête de fichier). Même gris doux, mêmes 15 px, même
   * interligne, même boîte d'icône de 22 px, même écart de 10 px.
   *
   * LES STYLES RESTENT DES LIENS : `/tatouage/<style>/<ville>`,
   * inchangé — c'est la valeur de référencement du site, et la
   * consigne a toujours insisté dessus. Seule leur PEAU change ; le
   * survol reprend celui des lignes cliquables (le fond monte d'un
   * cran, nº 227-§5), à la taille d'un mot.
   * ⚠️ LES SÉPARATEURS NE SE CLIQUENT PAS : ils vivent HORS des liens,
   * dans le texte, et sont `aria-hidden` — une liste lue à voix haute
   * ne doit pas égrener des puces.
   * ⚠️ UN SEUL STYLE : aucun séparateur, par construction (`rang > 0`).
   * ⚠️ AUCUN STYLE : rien du tout, pas même l'icône — la ligne entière
   * est conditionnée par `tatoueur.styles.length`.
   *
   * §2 (nº 385) — L'ICÔNE EST UNE ÉTOILE À CINQ BRANCHES, au
   * traitement d'Instagram (contour, trait 1,8, `currentColor`, 20 px).
   * La machine à tatouer de la nº 384 est supprimée, code compris.
   *
   * L'ALIGNEMENT DU RETOUR À LA LIGNE, ET C'EST LE POINT PRÉCIS :
   * `items-start` (et non `items-center` comme les lignes d'un seul
   * mot) pose l'icône au niveau de la PREMIÈRE ligne ; et comme le
   * texte est un élément SOUPLE À PART, ses lignes suivantes se
   * replient sur SON bord gauche — jamais sous l'icône. Le texte forme
   * un bloc, l'icône reste seule dans sa colonne.
   */
  /**
   * ██ §1 (nº 386) — LES PRATIQUES DEVIENNENT UNE LIGNE, SOUS LES
   * STYLES ██
   * ==================================================================
   * CE QUI DISPARAÎT : la section « Pratique » de la nº 315-§2 — son
   * titre en capitales, son trait de séparation, ses capsules à fond
   * `sombre-eleve`. La section ENTIÈRE part, donc son trait avec elle :
   * il n'y a pas de séparateur orphelin à ramasser, et pas de vide non
   * plus — le bloc était déjà conditionné par la longueur de la liste,
   * et ce qui le suit (le signalement) porte son propre `mt-10 pt-10`.
   *
   * CE QUI PREND SA PLACE : LA LIGNE DES STYLES, à la lettre — mêmes
   * constantes partagées (`ECRITURE_LIGNE_FICHE`, `BOITE_ICONE_LIGNE`),
   * mêmes puces, même `items-start` qui replie le texte sur le début
   * de la première valeur et jamais sous l'icône. Les deux lignes ne
   * peuvent pas diverger : elles lisent les mêmes classes.
   *
   * ⚠️ AUCUN LIEN N'EST CRÉÉ, ET C'EST VÉRIFIÉ : les capsules de
   * pratique étaient des `<li>` de TEXTE NU — jamais un `<a>`, jamais
   * un `<Link>`, aucune destination nulle part. Elles restent donc du
   * texte. (Les styles, eux, étaient et demeurent des liens vers
   * `/tatouage/<style>/<ville>`.) La différence est voulue et tient à
   * ce qui existait, pas à une décision prise ici.
   * ⚠️ RIEN DE DÉCLARÉ, PAS D'ICÔNE ORPHELINE : toute la ligne est
   * conditionnée par `capsulesPratique.length`.
   * ⚠️ UNE SEULE VALEUR : aucune puce, par construction (`rang > 0`).
   */
  const ligneDesPratiques = capsulesPratique.length > 0 && (
    <p
      key="pratique"
      data-pratique-fiche=""
      className={`flex items-start gap-2.5 ${ECRITURE_LIGNE_FICHE} ${LIGNE_GRISE}`}
    >
      <span className={BOITE_ICONE_LIGNE}>
        <IconeDiamant taille={20} />
      </span>
      <span className="min-w-0">
        {capsulesPratique.map((slug, rang) => (
          <Fragment key={slug}>
            {rang > 0 && (
              <>
                <span aria-hidden="true" className="px-1.5">
                  •
                </span>
                {/*  ██ §2 (nº 391) — LA PUCE N'OFFRAIT AUCUNE COUPURE ██
                     LE DÉFAUT : la ligne revenait à la ligne alors qu'il
                     restait de la place à droite, et pas sur les mêmes
                     fiches. LA CAUSE : entre deux valeurs il n'y a AUCUN
                     caractère d'espace — l'écart est le `px-1.5` de la
                     puce, du rembourrage, pas du texte — et le point
                     « • » (U+2022) appartient à la classe de coupure
                     ALPHABÉTIQUE : le navigateur n'a donc le droit de
                     couper NI avant NI après. « Machine•Petit » est un
                     seul mot à ses yeux. Les seules coupures possibles
                     sont les espaces INTERNES aux libellés — c'est ce
                     qui rend le défaut ALÉATOIRE D'UNE FICHE À L'AUTRE :
                     il dépend entièrement des libellés de la fiche et de
                     l'endroit où tombent leurs espaces. Une fiche dont
                     les pratiques sont des mots simples ne montre rien ;
                     une fiche à libellés composés perd une demi-largeur.
                     MESURÉ sur l'exemple exact du propriétaire
                     (« Couleur • Machine • Petit tatouage • Grandes
                     pièces »), colonne de la page : la première ligne
                     n'utilisait que 196,4 px des 308 disponibles —
                     111,6 px PERDUS à droite.
                     LE REMÈDE : `<wbr />`, une occasion de coupure de
                     LARGEUR NULLE, posée après la puce. Elle ne dessine
                     rien, ne décale rien, n'ajoute pas un pixel : elle
                     dit seulement au navigateur qu'il a le droit de
                     couper ici. La même ligne monte alors à 289,6 px sur
                     308 — 18,4 px de reste, la marge normale d'un mot
                     qui ne tient plus. Et la coupure tombe APRÈS la
                     puce : la ligne suivante commence sur la valeur, à
                     l'aplomb exact de la première (l'alignement du
                     retour à la ligne de la nº 384 ne bouge pas). */}
                <wbr />
              </>
            )}
            {libelleFiltre(slug)}
          </Fragment>
        ))}
      </span>
    </p>
  );

  const ligneDesStyles = tatoueur.styles.length > 0 && (
    <p
      key="styles"
      data-styles-fiche=""
      className={`flex items-start gap-2.5 ${ECRITURE_LIGNE_FICHE} ${LIGNE_GRISE}`}
    >
      <span className={BOITE_ICONE_LIGNE}>
        <IconeEtoile taille={20} />
      </span>
      <span className="min-w-0">
        {tatoueur.styles.map((slug, rang) => (
          <Fragment key={slug}>
            {rang > 0 && (
              <>
                <span aria-hidden="true" className="px-1.5">
                  •
                </span>
                {/*  §2 (nº 391) — LA MÊME OCCASION DE COUPURE QUE LES
                     PRATIQUES (voir la note complète juste au-dessus) :
                     cette ligne est écrite à l'identique, puce comprise,
                     donc elle porte exactement le même défaut. La
                     corriger d'un côté seulement l'aurait laissé
                     visible une ligne plus bas. */}
                <wbr />
              </>
            )}
            <Link
              href={`/tatouage/${slug}/${tatoueur.ville_slug}`}
              //  §4 et §5 (nº 388) — plus de pilule ici non plus, et LES
              //  STYLES RESTENT GRIS : ils mènent à une page DU site,
              //  la convention du bleu ne les concerne pas. Ils
              //  s'éclaircissent au survol, comme les autres lignes.
              className="transition-colors hover:text-sombre-texte"
            >
              {libelleStyle(slug)}
            </Link>
          </Fragment>
        ))}
      </span>
    </p>
  );

  /**
   * ██ §6 (nº 415) — LA LIGNE DU FREELANCE, SOUS LES STYLES ██
   * ==================================================================
   * CE QU'ELLE REMPLACE : le freelance s'affichait dans la LISTE DES
   * LIEUX de la fiche — deux traits de séparation, la photo de profil
   * de l'artiste, et sa ville à droite. C'était la place d'un ENDROIT
   * où l'on travaille ; un freelance n'en a pas, c'est tout son sens.
   * CE QU'ELLE DEVIENT : la dernière ligne de la série du profil,
   * derrière Booking, Instagram, le site, les pratiques et les styles.
   *
   * ██ §3 (nº 416) — ET ELLE PASSE SUR DEUX LIGNES ██
   *      Independent • Actuellement basé à :
   *      Lyon, France • 200 km
   * C'est le dessin du BOOKING ET DE SON DÉLAI (nº 408-§3), repris au
   * jeton près : une colonne flex (`flex min-w-0 flex-col`) derrière
   * l'icône. Les deux lignes commencent donc EXACTEMENT au même x — le
   * navigateur ne décale rien —, et une localité trop longue se replie
   * sur le DÉBUT DE SA PROPRE LIGNE, jamais sous l'icône : c'est le
   * `min-w-0` de la colonne qui l'autorise (leçon de la nº 391) et sa
   * position derrière l'icône qui borne le repli (règle de la nº 384).
   *
   * ⚠️ L'ALIGNEMENT OPTIQUE A ÉTÉ MESURÉ, PAS SUPPOSÉ (nº 416).
   * La nº 409 avait dû compenser 0,072 em entre « Booking » et
   * « Attente » : le navigateur aligne des ORIGINES, pas de l'encre, et
   * les approches gauches de la police diffèrent d'une lettre à
   * l'autre. Relevé dans la table `hmtx` de Geist (1000 unités par
   * cadratin), après avoir revérifié que la méthode reproduit bien les
   * chiffres de la nº 409 (B = 92, A = 20) :
   *      « I » d'Independent = 92     « L » de Lyon = 92
   * ÉCART NUL — le L tombe déjà au pixel sous le I. AUCUNE COMPENSATION
   * N'EST POSÉE, et surtout PAS un `pl-[0.072em]` recopié de la nº 409 :
   * il déplacerait la seconde ligne de 1,08 px vers la droite pour
   * réparer un défaut qui n'existe pas.
   * ⚠️ ET ELLE NE DOIT PAS ÊTRE POSÉE PLUS TARD « PAR SYMÉTRIE » : la
   * seconde ligne commence par une DONNÉE (un nom de ville), pas par un
   * mot d'un vocabulaire fermé comme « Attente ». Dans Geist, quatorze
   * capitales partagent l'approche 92 (B D E F H I K L M N P R É È) —
   * la grande majorité des initiales de villes tombe donc pile ; les
   * rondes (C G O Q = 45) et les diagonales (A V = 20, T = 12, Y = −6)
   * commencent de 0,55 à 1,47 px plus à gauche. Une compensation FIXE
   * casserait le cas exact pour rattraper le cas rare : on ne compense
   * pas ce qui dépend de la donnée.
   *
   * ⚠️ LA LOCALITÉ EST UN LIEN, LE RESTE NON. « Lyon, France » est le
   * SEUL morceau bleu et cliquable — même composant que l'adresse d'un
   * salon (`LienAdresse`, BlocLieux), même bleu (`LIEN_QUI_SORT`), même
   * éclaircissement au survol, pas de soulignement (`soulignement=""`,
   * la règle de la nº 389-§2). Le mot, la phrase et le rayon restent
   * gris et morts.
   * ⚠️ PIÈGE DE LA nº 389 — UNE SEULE CLASSE DE COULEUR PAR ÉLÉMENT :
   * le gris vit sur le `<p>` (LIGNE_GRISE), le bleu sur le `<span>`
   * INTÉRIEUR au lien (`classeTexte`), l'icône a le sien sur sa boîte.
   * Aucun élément n'en porte deux : rien ne peut être départagé par
   * l'ordre alphabétique de Tailwind.
   * ⚠️ LE LIEN NE MÈNE JAMAIS NULLE PART : `lieuCherchableDuFreelance`
   * (lib/modes-exercice) rend `null` quand il n'y a rien à chercher —
   * `LienAdresse` rend alors le texte NU, en gris. Et il ne porte PAS
   * la rue : un Independent ne publie jamais son adresse précise, la
   * requête Google se limite donc aux colonnes que la ligne affiche.
   *
   * ⚠️ AUCUNE VALEUR GRAPHIQUE N'EST ÉCRITE ICI, et c'est la demande :
   * `ECRITURE_LIGNE_FICHE` (15 px, `leading-snug`), `LIGNE_GRISE` (le
   * gris doux commun), `BOITE_ICONE_LIGNE` (la boîte de 22 px, haute
   * d'une ligne exactement — nº 389-§6), `items-start` pour que l'icône
   * se cale sur la PREMIÈRE ligne. Ce sont les classes des lignes
   * voisines, au caractère près : elles ne peuvent pas diverger.
   * ⚠️ L'ICÔNE EST CELLE DE L'ADRESSE D'UN SALON (`IconeLocalisation`,
   * 20 px dans la boîte de 22), grise comme toutes les autres de la
   * colonne (nº 392-§1).
   * ⚠️ NI LIGNE VIDE NI PUCE ORPHELINE : `lignesDuFreelance` rend des
   * morceaux DÉJÀ purgés — un État ou un pays n'a pas de rayon donc pas
   * de dernière puce ; une ville sans pays écrit ce qu'elle a ; sans
   * localité du tout, la seconde ligne n'existe pas ET l'en-tête perd
   * sa phrase (un deux-points qui promet un lieu ne peut pas coiffer le
   * vide). Le `<wbr />` donne à chaque puce son occasion de coupure
   * (nº 391-§2) : la ligne se replie sur le mot suivant, jamais au
   * milieu.
   * ⚠️ UNE LIGNE PAR MODE : le formulaire permet d'en déclarer
   * plusieurs (« + Ajouter une ville »). Une seule dans le cas courant.
   * ⚠️ SUR UNE FICHE D'ARTISTE SEULEMENT : `modesFreelance` part de
   * `modesOrdonnes`, et un salon n'a pas de mode d'exercice — la liste
   * est vide, rien ne se rend.
   */
  const lignesFreelance = modesFreelance(tatoueur.modes).map((mode) => {
    const { entete, localite, rayon } = lignesDuFreelance(mode);
    if (entete.length === 0) return null;
    const lieuCherchable = lieuCherchableDuFreelance(mode);
    return (
      <p
        key={`freelance-${mode.id}`}
        data-freelance-fiche=""
        className={`flex items-start gap-2.5 ${ECRITURE_LIGNE_FICHE} ${LIGNE_GRISE}`}
      >
        <span className={`${BOITE_ICONE_LIGNE} text-sombre-texte-doux`}>
          <IconeLocalisation taille={20} />
        </span>
        {/*  LA COLONNE DES DEUX LIGNES — le dessin exact du booking
             (nº 408-§3). Elle est le seul enfant souple de la rangée et
             garde le `min-w-0` qui autorise le repli du texte. */}
        <span className="flex min-w-0 flex-col">
          <span>
            {entete.map((morceau, rang) => (
              <Fragment key={morceau}>
                {rang > 0 && (
                  <>
                    <span aria-hidden="true" className="px-1.5">
                      •
                    </span>
                    <wbr />
                  </>
                )}
                {morceau}
              </Fragment>
            ))}
          </span>
          {/*  LA SECONDE LIGNE — la localité (bleue, cliquable) puis le
               rayon (gris). Elle ne s'écrit que si l'un des deux
               existe ; la puce, qu'entre les deux. */}
          {(localite || rayon) && (
            <span>
              {localite && (
                <LienAdresse
                  texte={localite}
                  lieu={lieuCherchable}
                  classeTexte={LIEN_QUI_SORT}
                  //  §2 (nº 389) — aucun trait : le bleu dit déjà que la
                  //  destination sort du site, et il s'éclaircit au
                  //  survol. C'est le réglage de la ligne d'adresse.
                  soulignement=""
                />
              )}
              {rayon && (
                <>
                  {localite && (
                    <>
                      <span aria-hidden="true" className="px-1.5">
                        •
                      </span>
                      <wbr />
                    </>
                  )}
                  {rayon}
                </>
              )}
            </span>
          )}
        </span>
      </p>
    );
  });

  /*  §6 (nº 415) — LA LISTE DES LIEUX A-T-ELLE QUELQUE CHOSE À DIRE ?
      C'est `modesDeLieu` qui répond, la MÊME fonction que celle dont
      `BlocProfilsArtiste` construit sa liste (lib/modes-exercice). Sans
      cette question, un artiste qui n'a QUE des modes freelance
      afficherait le trait de séparation et ses 80 px de dégagement
      au-dessus d'un bloc qui ne rend rien — le piège de la nº 386. */
  const aDesLieuxAMontrer = modesDeLieu(tatoueur.modes).length > 0;

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
        ref={rangeeDuHaut}
        style={
          collantSousLaBarre
            ? ({
                [VARIABLE_RANGEE_COLLANTE]: `${RESERVE_LOGO}px`,
              } as CSSProperties)
            : undefined
        }
        /**
         * ██ §1 et §2 (nº 381) — LA BARRE VA D'UN BORD À L'AUTRE, ET
         * ELLE PORTE SON TRAIT ██
         * ==================================================================
         * PAR QUOI LA RANGÉE ÉTAIT BORNÉE, ET CE N'EST JAMAIS ELLE :
         *  · PAGE AU DOIGT — le `px-4 sm:px-6` de la racine `<main>`
         *    (16 px, 24 au-delà de 640) ;
         *  · PAGE DU WEB — le `lg:px-3` de la colonne de lecture
         *    (12 px), posé à la nº 298 pour que le bord qui rogne
         *    s'écarte des encadrés de survol ;
         *  · FENÊTRE SUPERPOSÉE — le `p-5 sm:p-6` de SA colonne
         *    (20 px, 24 au-delà de 640).
         * Trois rembourrages, trois PARENTS. Les toucher, c'est la
         * faute qui a tué les nº 378 et 379.
         *
         * CE QU'ON FAIT À LA PLACE, ET TOUT SE PASSE SUR LA RANGÉE :
         * LE DÉBORD COMPENSÉ — `-mx-N px-N`. La marge négative pousse
         * la boîte de N pixels au-delà de son parent, de chaque côté ;
         * le rembourrage de MÊME valeur remet le contenu là où il
         * était. La BOÎTE grandit, la BOÎTE DE CONTENU ne bouge pas :
         * le fond et le trait s'étendent, le badge et « Suivre » ne
         * partent nulle part.
         * ⚠️ CE N'EST PAS UNE INVENTION DE CETTE PASSE : c'est
         * l'écriture des galeries du portfolio au doigt
         * (`-mx-4 px-4 sm:-mx-6 sm:px-6`, PortfolioDeLAffiche) et celle
         * de la colonne de lecture elle-même (`lg:px-3 lg:-mx-3`).
         *
         * CHAQUE VALEUR RÉPOND EXACTEMENT AU REMBOURRAGE QU'ELLE
         * ANNULE — c'est ce qui fait que le débord s'arrête AU bord et
         * jamais au-delà :
         *  · page : `-mx-4 px-4` puis `sm:-mx-6 sm:px-6` (la racine),
         *    puis `lg:-mx-3 lg:px-3` (la colonne, dès 1024) ;
         *  · fenêtre : `-mx-5 px-5` puis `sm:-mx-6 sm:px-6` (sa
         *    colonne).
         * ⚠️ ET C'EST POURQUOI RIEN NE DÉBORDE NULLE PART : les deux
         * colonnes rognent (`lg:overflow-y-auto`), et le débord vient
         * mourir PILE sur leur boîte de rembourrage — le bord qui
         * rogne. Aucune barre de défilement horizontale ne peut naître.
         * Au doigt, la rangée s'arrête sur la boîte de bordure de
         * `<main>`, c'est-à-dire le bord de l'écran : pas un pixel plus
         * loin, donc aucun débordement du document (la règle nº 228-§3
         * interdit de le masquer, et il n'y en a pas à masquer).
         *
         * « DE BORD À BORD » DANS LA FENÊTRE, C'EST LES BORDS DE LA
         * FENÊTRE — confirmé, et c'est mécanique : le débord est
         * calculé sur le rembourrage de SA colonne, laquelle est
         * `w-full` dans la fenêtre. La rangée atteint donc le bord
         * intérieur de la fenêtre, que ses angles arrondis et son
         * `overflow-hidden` referment. L'écran n'entre jamais dans ce
         * calcul.
         *
         * LE TRAIT (§2) : `border-b` + `TRAIT_SEPARATION` — UN pixel,
         * `#3B3B42`, le jeton unique des séparations du site (nº 315,
         * config/tatouage). Aucune couleur ni épaisseur inventée, et
         * comme il est porté par la rangée débordée, il court d'un bord
         * à l'autre, marges comprises. Partout : page et fenêtre.
         *
         * ⚠️ LE CAPOT SUIT SANS RIEN FAIRE : il est `absolute
         * inset-x-0` DANS cette boîte — il s'élargit avec elle, et
         * couvre donc enfin toute la largeur au-dessus de la rangée.
         */
        className={`relative flex items-center justify-between gap-3
                   border-b ${TRAIT_SEPARATION}
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
                     /**
                      * §3 (nº 381) — L'AIR RESTE EN HAUT, IL PART EN
                      * BAS : `mobile:py-3` devient `mobile:pt-3`. Le
                      * badge vient toucher le bas de la rangée, et le
                      * trait passe donc juste sous lui. Sur le web,
                      * c'était déjà le cas — aucune classe n'y est
                      * ajoutée.
                      */
                     collantSousLaBarre
                       ? "mobile:sticky mobile:top-[var(--rw-rangee-collante)] mobile:z-[3] mobile:pt-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-3 lg:px-3"
                       : "-mx-5 px-5 sm:-mx-6 sm:px-6"
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
          {/*  §2 (nº 384) — TROIS RANGÉES, ET L'ESPACE ENTRE ELLES NE
               CHANGE PAS : c'est le `gap-y-4` (16 px) de ce conteneur,
               celui-là même qui sépare aujourd'hui Booking d'Instagram
               (nº 229-§3). La ligne du site et celle des styles s'y
               rangent sans qu'aucune marge soit écrite : une rangée
               absente ne rend rien, donc ne laisse aucun vide — un
               tatoueur sans site n'a pas de trou entre Booking et ses
               styles, et un tatoueur sans style n'a pas d'icône
               orpheline. */}
          {(premiereLigne.length > 0 ||
            ligneDuSite.length > 0 ||
            ligneDesStyles ||
            ligneDesPratiques ||
            //  §6 (nº 415) — une fiche qui n'aurait QUE sa ligne de
            //  freelance ouvre quand même la série : sans cette
            //  condition, la ligne existerait sans son conteneur.
            lignesFreelance.length > 0) && (
            <div
              /*  §5 (nº 389) — L'ÉCART PARTAGÉ MONTE D'UN CRAN :
                   `gap-y-4` (16 px) devient `gap-y-5` (20 px). C'est le
                   SEUL endroit touché — aucune marge n'est posée sur les
                   lignes elles-mêmes, elles n'en ont toujours aucune. Les
                   deux rangées en grille gardent leur `gap-y-4` interne :
                   il sépare deux liens d'une MÊME rangée, pas deux
                   lignes. */
              className="mt-10 flex w-full flex-col items-start gap-y-5"
            >
              {/*  §3 (nº 408) — `items-start` SUR CETTE RANGÉE, et sur elle
                   seule. Le booking peut désormais faire DEUX lignes ;
                   `items-center` aurait alors centré Instagram sur la
                   hauteur totale, c'est-à-dire l'aurait fait descendre
                   entre les deux. Aligné en haut, il reste en face de
                   « Booking ouvert », comme demandé.
                   ⚠️ LA LARGEUR ET LE PARTAGE EN DEUX COLONNES NE
                   CHANGENT PAS : `grid-cols-2`, `gap-x-7` et
                   `justify-items-start` sont intouchés. Seule la
                   hauteur de la rangée suit son plus grand contenu. */}
              {premiereLigne.length > 0 && (
                <div className="grid w-full grid-cols-2 items-start justify-items-start gap-x-7 gap-y-4">
                  {premiereLigne}
                </div>
              )}
              {/*  ██ §2d (nº 407) — UN LIEN SEUL PREND TOUTE LA LARGEUR ██
                   LE RELEVÉ : sur la fiche, le titre d'un lien s'abrégeait
                   par une ellipse « alors que la place ne manque pas ».
                   LA CAUSE, ET ELLE EST STRUCTURELLE : cette rangée était
                   en `grid-cols-2` FIXE. Deux pistes existent toujours,
                   même quand il n'y a QU'UN lien — celui-ci occupe alors
                   la première et se voit borné à la MOITIÉ de la rangée
                   par le `max-w-full` de la nº 391. La seconde piste
                   reste vide à côté. Le `truncate` faisait donc
                   exactement son travail, sur une piste deux fois trop
                   étroite.
                   LE REMÈDE : le nombre de colonnes suit le nombre de
                   liens. Un lien → UNE piste, pleine largeur, et les
                   trente caractères tiennent. Deux liens → les deux
                   pistes d'avant, au pixel près.
                   ⚠️ LA nº 391 N'EST PAS DÉFAITE, et c'est le point
                   délicat : `max-w-full` et `truncate` RESTENT sur le
                   lien (voir `lienEnLigne`). C'est eux qui empêchent une
                   case de déborder de sa piste — le défaut que la nº 391
                   réparait. On ne retire pas la borne, on donne à la
                   piste la largeur qu'elle aurait dû avoir.
                   ⚠️ LA PREMIÈRE RANGÉE (booking, Instagram) GARDE SES
                   DEUX COLONNES : ses libellés sont un vocabulaire fermé
                   et court, il n'y a rien à y abréger (note de la
                   nº 391) — et le propriétaire n'a signalé que celle-ci. */}
              {ligneDuSite.length > 0 && (
                <div
                  className={`grid w-full items-center justify-items-start gap-x-7 gap-y-4 ${
                    ligneDuSite.length > 1 ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {ligneDuSite}
                </div>
              )}
              {ligneDesPratiques}
              {ligneDesStyles}
              {/*  §6 (nº 415) — LA LIGNE DU FREELANCE, SOUS LES STYLES :
                   c'est la place que le propriétaire lui donne, et elle
                   est la sienne — sur une fiche d'artiste, l'adresse
                   ci-dessous ne se rend jamais. */}
              {lignesFreelance}
              {/*  §3 (nº 388) — L'ADRESSE FERME LA SÉRIE, et seulement
                   sur un salon ou un studio : une fiche d'artiste
                   montre ses PROFILS (à domicile, en salon, guest),
                   pas une adresse unique — elle ne change pas. Sans
                   adresse lisible, la ligne ne rend rien (voir
                   `LigneAdresseDuLieu`). */}
              {tatoueur.type_fiche !== "artiste" && (
                <LigneAdresseDuLieu tatoueur={tatoueur} />
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

          {/*  §1 (nº 315) — LES BADGES DE STYLE VIVAIENT ICI, sous la
               bio. §2 (nº 384) : ils ne sont plus des badges et ils
               ont REJOINT LE BLOC DES LIGNES, en troisième rangée —
               c'est le placement demandé par le propriétaire. Rien ne
               reste à rendre à cet endroit ; la bio est donc suivie
               directement des sections. */}

          {/* ==========================================================
              §4 et §5 — OÙ TRAVAILLE CETTE FICHE
              ==========================================================
              UN LIEU montre ses ADRESSES, empilées (nº 226-§3) : celle
              de l'affiche (photo, adresse, horaires), puis chaque
              autre adresse sur sa ligne, puis l'équipe — toujours
              après toutes les adresses.
              UN ARTISTE montre ses PROFILS, dans l'ordre imposé
              (nº 222-§1g) : studio, salon, guest.
              ⚠️ LA LIGNE DE SÉPARATION EST POSÉE ICI, jamais dans le
              bloc : c'est l'enveloppe qui sépare ses sections.
              ██ §6 (nº 415) — ET C'EST POUR ÇA QU'ELLE SE CONDITIONNE ██
              Le freelance a quitté cette liste (voir `modesDeLieu`) :
              un artiste peut donc n'avoir AUCUN lieu à montrer, et
              `BlocProfilsArtiste` ne rend alors rien. Le trait, lui,
              vit ICI — il se serait affiché seul, avec ses 40 px de
              marge et ses 40 px de dégagement, au-dessus du vide.
              C'est exactement le piège de la nº 386, et la parade est
              la même : le conteneur ne se rend que s'il a un contenu,
              et la question est posée par la MÊME fonction que celle
              qui construit la liste. */}
          {tatoueur.type_fiche === "artiste" ? (
            aDesLieuxAMontrer && (
              <div className={`mt-10 pt-10 ${separation}`}>
                <BlocProfilsArtiste tatoueur={tatoueur} />
              </div>
            )
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
          {/*  §1 (nº 386) — LA SECTION « PRATIQUE » VIVAIT ICI : titre
               en capitales, trait de séparation, capsules à fond. Elle
               est SUPPRIMÉE EN ENTIER — son contenu est devenu la
               quatrième ligne du profil, sous les styles.
               ⚠️ RIEN NE RESTE DERRIÈRE, et c'est structurel : le
               trait qu'on voyait ici n'était pas posé entre deux
               sections, il appartenait à CE bloc (`mt-10 pt-10
               border-t` sur son propre `<div>`, la règle « c'est
               l'enveloppe qui sépare ses sections »). Le bloc parti,
               son trait part avec lui — aucun séparateur orphelin,
               aucun espace vide. Le signalement, qui suivait, porte
               son propre dégagement et remonte simplement d'un cran. */}

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
