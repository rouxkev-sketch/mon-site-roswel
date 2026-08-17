"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CATEGORIES_EXPLORER,
  entreesExplorer,
  GROUPES_FILTRES,
  lireValeurExplorer,
  RAYONS_TATOUAGE,
  RAYON_TATOUAGE_DEFAUT,
  libelleStyle,
  TEXTES_TATOUAGE,
  valeurExplorer,
} from "@/config/tatouage";
import { ligneMoteur } from "@/lib/adresse";
import {
  compteDeLaCategorie,
  compteDuStyle,
  comptesConnus,
  useComptesCreations,
} from "@/lib/creations-par-style";
import { ChampLocalisation } from "@/components/ChampLocalisation";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
import { PageRechercheMobile } from "@/components/PageRechercheMobile";
//  §1 (nº 331) — « la navigation gagne » : l'écriture commune, celle
//  que les liens arment tout seuls (lib/etape-refermable).
import { laSurfaceVaNaviguer } from "@/lib/etape-refermable";
import {
  IconeDeuxColonnes,
  IconeLoupe,
  IconeReglages,
  IconeUneColonne,
} from "@/components/Icones";
import { BadgeCharte, GroupeBadges } from "@/components/BadgesCharte";
import { BoutonPhototheque } from "@/components/BoutonPhototheque";
import { MenuDeVerre } from "@/components/SurfaceDeVerre";
import { EncadreDeuxChamps } from "@/components/EncadreBarre";
import { GLISSADE_MS, remonterSansClavier } from "@/lib/remontee-champ";
import { basculerSansSaut } from "@/lib/bascule-verrouillee";
//  ⚠️ TEMPORAIRE (nº 173) — la sonde-journal enregistre les clics sur
//  les deux boutons de bascule. Elle n'écrit RIEN sans `?sonde-bascule=1`.
import { noter } from "@/lib/journal-bascule";
import { poserDisposition } from "@/lib/disposition-grille";
import { useDispositionGrille } from "@/components/AffichageMosaique";
import {
  fermerRecherche,
  lireRecherche,
  lireRechercheServeur,
  ouvrirRecherche,
  poserBrouillon,
  poserVueRecherche,
  souscrireRecherche,
} from "@/lib/recherche-mobile";
import type { LieuTrouve } from "@/lib/geocodage";

/**
 * LE MOTEUR DE RECHERCHE DE YOKOFOLIO
 * ====================================
 * IL VIT DANS LA BARRE FIXE, sur web comme sur smartphone. Il y reste
 * sous la main pendant qu'on parcourt les cartes — c'est sa place, et
 * il n'en bouge pas.
 *
 * AUCUN BOUTON « Rechercher » : chaque changement lance la recherche.
 * Un bouton n'ajouterait qu'un clic entre la personne et les images.
 *
 * COMPOSANT PILOTÉ : il ne garde AUCUN critère. Ils viennent d'en haut,
 * et chaque changement remonte — la grille et la ligne de résultats
 * suivent donc toujours ce que montre le moteur.
 *
 * LE RAYON VIT AVEC LA LOCALITÉ — un rayon autour de rien n'a pas de
 * sens : sur le web il s'affiche DANS le panneau du champ ville, dans
 * la fenêtre mobile il est posé SOUS la localité. Il n'a d'objet
 * qu'autour d'un POINT (une ville, une adresse) : sans lieu, ou sur
 * une RÉGION ou un PAYS, il RESTE À SA PLACE mais devient INACTIF —
 * grisé, hors d'usage, comme n'importe quel champ désactivé du site.
 * Aucune phrase ne vient le remplacer : un réglage éteint se voit,
 * il n'a pas besoin qu'on l'explique, et la fenêtre ne saute plus
 * d'une hauteur à l'autre selon le lieu choisi.
 * SON PREMIER PALIER EST DIX KILOMÈTRES, sur web comme sur
 * smartphone. Le palier « 0 km » (la ville seule) a existé un temps :
 * il est retiré — une recherche de tatoueur ne s'arrête pas au
 * panneau d'entrée d'une commune.
 *
 * LES FILTRES SONT DES INTERRUPTEURS TOUS ALLUMÉS : on ÉTEINT ce
 * qu'on ne veut pas voir, on ne coche pas ce qu'on veut. Tout allumé
 * = aucun filtrage. Les critères ne portent donc que les slugs
 * ÉTEINTS (`exclure`) — la règle exacte vit dans src/lib/tatoueurs.ts
 * (passeLesFiltres). TROIS groupes désormais : Technique, Composition
 * et ARTISTE / SALON (voir GROUPES_FILTRES) — le type de fiche est un
 * critère de recherche comme un autre, pas un cas particulier.
 *
 * DEUX FORMATS — PAR APPAREIL, PLUS JAMAIS PAR LARGEUR
 * -----------------------------------------------------
 * APPAREILS À SOURIS (`mobile:hidden`, quelle que soit la largeur de
 * la fenêtre) : l'encadré style + ville, ÉPURÉ, et à sa DROITE un
 * BOUTON ROND à l'icône de réglages qui déplie les trois groupes
 * d'interrupteurs dans un panneau.
 *
 * VRAIS MOBILES (tactile, attribut data-appareil="mobile") :
 * l'encadré replié des grands sites — UNE SEULE ligne pleine largeur,
 * la LOUPE à gauche, puis le RÉSUMÉ DE LA RECHERCHE dans la
 * typographie exacte de la ligne de résultats : le style en blanc et
 * en gras, la localité en gris derrière lui. Rien cherché encore ? La
 * pilule invite, simplement : « Rechercher ».
 * Au toucher, une PAGE DE RECHERCHE PLEIN ÉCRAN (voir
 * PageRechercheMobile) coupée en DEUX VUES par une bascule en haut :
 * « Recherche » (style, localité, rayon) et « Filtres » (Technique,
 * Composition, Artiste / Salon).
 *
 * ⚠️ CE FUT UNE FENÊTRE SUPERPOSÉE, ET C'EST FINI. Dix passes ont
 * essayé de la faire tenir pendant que le clavier d'iOS arrive :
 * glissement de l'arrière-plan, saccades, bande blanche, menu mal
 * placé. La cause était structurelle — un élément flottant qu'il faut
 * repositionner à la main quand le navigateur déplace le viewport. Une
 * PAGE n'a rien à repositionner : le navigateur fait défiler le
 * document lui-même, sur iOS comme sur Android. Tout le code de
 * placement (paliers, recollage, suivi du viewport visuel,
 * compensation du corps) a été SUPPRIMÉ avec elle.
 */

export type CritèresTatouage = {
  style: string;
  /** LA NATURE CHERCHÉE — « tatouage », « flash », ou vide (passe
      nº 110). Elle voyage TOUJOURS avec le style : le menu
      « Explorer » ne propose pas l'un sans l'autre. Vide = rien n'a
      été cherché, la mosaïque montre tout. */
  nature: string;
  /** LE LIEU CHOISI dans la liste mondiale (lib/geocodage) — il porte
      les coordonnées ET le niveau (adresse, ville, région, pays) qui
      décide du mode de recherche. Null = aucun lieu = PARTOUT, le
      monde entier. */
  lieu: LieuTrouve | null;
  /** Le rayon autour d'une ville ou d'une adresse. ZÉRO est une vraie
      valeur : la ville seule. Sans objet pour une région, un pays. */
  rayonKm: number;
  /** Les INTERRUPTEURS ÉTEINTS (« ce que je ne veux pas voir ») —
      slugs de FILTRES_TATOUAGE, tous groupes confondus. Vide = tout
      allumé = aucun filtrage. */
  exclure: string[];
};

/** Complète des critères partiels : un seul endroit décide des défauts. */
export function criteresComplets(
  partiels?: Partial<CritèresTatouage>
): CritèresTatouage {
  return {
    style: partiels?.style ?? "",
    nature: partiels?.nature ?? "",
    lieu: partiels?.lieu ?? null,
    rayonKm: partiels?.rayonKm ?? RAYON_TATOUAGE_DEFAUT,
    exclure: partiels?.exclure ?? [],
  };
}

/**
 * CE QUE LE MENU « EXPLORER » AFFICHE UNE FOIS REFERMÉ.
 * « Tous les flashs », « Flashs · Réalisme », « Tatouages · Blackwork ».
 * ⚠️ LA NATURE VIENT EN PREMIER, parce que c'est la question à
 * laquelle on a répondu en premier — la ligne se lit dans l'ordre où
 * elle a été construite.
 */
export function libelleExplorer(nature: string, style: string): string {
  const categorie = CATEGORIES_EXPLORER.find((c) => c.nature === nature);
  if (!categorie) return "";
  if (!style) return categorie.tous;
  const label = libelleStyle(style);
  return `${categorie.titre} · ${label}`;
}

/*  « TOUS LES STYLES » N'EXISTE PLUS NULLE PART (nº 321-§3)
    ------------------------------------------------------------------
    Il y avait ici un `libelleStyleChoisi(style)` qui rendait le mot du
    catalogue quand un style était choisi, et « Tous les styles » quand
    il ne l'était pas. Ce second cas est mort : le menu des favoris dit
    désormais « Tous les favoris », celui des portfolios suivis « Tous
    les portfolios », et chacun de ces deux mots vit dans
    `lib/filtres-selection` avec l'entrée qu'il nomme. Le seul appelant
    qui restait (IndexTatoueurs) ne l'atteignait jamais que STYLE NON
    VIDE — il lit donc `libelleStyle` en direct, et la fonction est
    partie plutôt que de garder une branche morte qui réintroduirait le
    mot au premier réemploi distrait. */

/**
 * LE RAYON S'APPLIQUE-T-IL À CE LIEU ?
 * Seulement autour d'un POINT : une ville, une adresse. Une région ou
 * un pays se cherchent en entier — un cercle autour de leur centre
 * n'a aucun sens (25 km autour du centre de la France ne couvrent
 * presque rien : c'était le bug).
 */
export function rayonApplicable(lieu: LieuTrouve | null): boolean {
  return (
    lieu !== null && (lieu.precision === "ville" || lieu.precision === "adresse")
  );
}

/** Le rayon écrit à la suite du lieu — rien quand il ne s'applique
    pas (une région, un pays se cherchent en entier). */
export function suffixeRayon(criteres: CritèresTatouage): string {
  return rayonApplicable(criteres.lieu) ? ` · ${criteres.rayonKm} km` : "";
}

/**
 * LE LIBELLÉ DU LIEU une fois validé : « Partout », « Lyon, France »,
 * « Miami, FL, États-Unis · 25 km ».
 * ⚠️ PLUS L'INTITULÉ BRUT DU GÉOCODEUR (passe nº 114) : c'est le
 * MÊME format que sur les cartes — ville, code de l'État si le pays
 * l'écrit, pays. Ni code postal, ni région ailleurs. Le code postal ne
 * sert qu'à CHOISIR, dans les suggestions ; une fois le lieu retenu,
 * il n'apprend plus rien.
 */
export function libelleLieu(criteres: CritèresTatouage): string {
  if (!criteres.lieu) return TEXTES_TATOUAGE.partoutLabel;
  return `${ligneMoteur(criteres.lieu)}${suffixeRayon(criteres)}`;
}

export function MoteurTatouage({
  criteres,
  surChangement,
  id = "moteur-tatouage",
  rangeeMobile = true,
}: {
  criteres: CritèresTatouage;
  /** Appelé à CHAQUE changement : c'est ça, la recherche. */
  surChangement: (criteres: CritèresTatouage) => void;
  id?: string;
  /** FAUX HORS ACCUEIL (nº 150-§3) : la rangée du smartphone — la
      pilule et ses deux boutons — n'est pas rendue du tout ; seule la
      LOUPE de la barre ouvre alors la recherche (le magasin
      `recherche-mobile` est partagé, la page plein écran est un
      portail : elle s'affiche d'où qu'on l'appelle). */
  rangeeMobile?: boolean;
}) {
  /**
   * L'ÉTAT DE LA PAGE DE RECHERCHE — LU HORS DE REACT, ET C'EST UNE
   * CORRECTION DE FOND.
   * ------------------------------------------------------------------
   * Il vivait dans trois `useState` d'ici même. Ce composant est monté
   * dans la barre du site, donc DANS l'arbre du routeur de Next : dès
   * que cet arbre est reconstruit, il remonte, ses états repartent à
   * zéro — et la page de recherche disparaît de l'écran sans que
   * personne ne l'ait fermée. C'est très exactement ce que voyait le
   * propriétaire sur son iPhone.
   * La cause première (une adresse passée à `pushState`, qui faisait
   * refaire la page à Next) est corrigée dans PageRechercheMobile.
   * Mais un état d'écran ne doit pas dépendre de la survie d'un
   * composant : il vit désormais dans un module
   * (src/lib/recherche-mobile.ts), que rien ne remet à zéro sinon un
   * vrai rechargement de page.
   *
   * · `ouverte`   — la page est-elle à l'écran ;
   * · `vue`       — « recherche » ou « filtres » ;
   * · `brouillon` — LES CHOIX EN COURS, ET RIEN DE PLUS. Chaque geste
   *   relançait la recherche derrière ; désormais ils s'accumulent
   *   sans toucher aux résultats, et « Valider » les remonte d'un
   *   coup. La croix, le retour arrière et Échap les ABANDONNENT.
   *   `null` = page fermée, le moteur lit les vrais critères.
   */
  //  LA « VUE » EST DE RETOUR AVEC LA BASCULE (nº 141) — le module
  //  recherche-mobile ne l'avait jamais perdue.
  const {
    ouverte: pageOuverte,
    vue: vuePage,
    brouillon,
  } = useSyncExternalStore(
    souscrireRecherche,
    lireRecherche,
    lireRechercheServeur
  );
  /** Le panneau des interrupteurs (web, sous le bouton rond). */
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  /** Combien de fois « Effacer » a été pressé — sert de clé au champ
      de localité pour le reconstruire à neuf (voir plus bas). */
  const [effacements, setEffacements] = useState(0);
  const zoneFiltres = useRef<HTMLDivElement>(null);
  //  §2 (nº 293), §3 (nº 294) — LA FENÊTRE DES FILTRES assombrit tout
  //  l'écran, et le bloc qui la porte reste clair. Web uniquement (le
  //  crochet s'en assure).
  useVoileDeLaPage(filtresOuverts, zoneFiltres);
  /** Le bouton rond — le menu de verre se pose sous LUI (nº 238-§3). */
  const boutonFiltres = useRef<HTMLButtonElement>(null);
  /** La plaque du panneau : montée dans le corps du document, elle
      n'est plus « dans » la zone — la fermeture au clic dehors doit la
      connaître, sans quoi toucher un badge referme le panneau. */
  const plaqueFiltres = useRef<HTMLDivElement>(null);
  /** La disposition de la mosaïque (mobile) — celle de L'ADRESSE
      (nº 203-§1b), servie par le serveur. */
  const disposition = useDispositionGrille();
  /*  ⚠️ LA VUE PHOTOTHÈQUE N'EST PLUS LUE ICI (nº 255-§4) : elle vit
      dans `BoutonPhototheque`, l'écriture extraite que les deux barres
      consomment — c'est lui qui s'abonne au magasin. */

  // Le panneau des filtres du web : Échap et clic ailleurs referment.
  useEffect(() => {
    if (!filtresOuverts) return;
    function auClic(evenement: MouseEvent) {
      const cible = evenement.target as Node;
      //  ⚠️ LA PLAQUE EST DANS LE CORPS DU DOCUMENT (nº 238-§3) : sans
      //  ce second test, chaque badge coché refermait le panneau.
      if (plaqueFiltres.current?.contains(cible)) return;
      if (!zoneFiltres.current?.contains(cible)) {
        setFiltresOuverts(false);
      }
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setFiltresOuverts(false);
    }
    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", auClavier);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", auClavier);
    };
  }, [filtresOuverts]);

  /** Un seul chemin de sortie : impossible d'oublier de prévenir.
      C'est LA recherche — réservé au moteur du web, qui n'a pas de
      bouton et cherche à chaque geste. */
  function annoncer(suivant: Partial<CritèresTatouage>) {
    surChangement({ ...criteres, ...suivant });
  }

  /** CE QUE LA PAGE AFFICHE : son brouillon si elle est ouverte, les
      vrais critères sinon. */
  const enFenetre = brouillon ?? criteres;

  /** POSER UN CHOIX DANS LE BROUILLON — aucune recherche déclenchée. */
  function poserDansLeBrouillon(suivant: Partial<CritèresTatouage>) {
    poserBrouillon({ ...(brouillon ?? criteres), ...suivant });
  }

  /** OUVRIR LA PAGE, toujours sur la vue « Recherche », et sur un
      brouillon qui part de la recherche en cours. */
  function ouvrirLaPage() {
    ouvrirRecherche(criteres);
  }

  /** FERMER SANS RIEN APPLIQUER — la croix, le retour arrière, Échap.
      Appelée par la page UNE FOIS SA GLISSADE DE SORTIE TERMINÉE :
      démonter plus tôt ferait disparaître la page d'un coup. */
  function abandonnerLaPage() {
    fermerRecherche();
  }

  /** « VALIDER » — LE SEUL GESTE QUI LANCE LA RECHERCHE sur mobile. */
  function validerLaPage() {
    const retenus = brouillon;
    //  §1 (nº 331) — LA NAVIGATION GAGNE. « Valider » referme la page
    //  ET change d'adresse : on le dit AVANT de refermer, pour que
    //  l'étape de la page ne recule pas au moment où le routeur
    //  avance. C'est l'écriture commune (lib/etape-refermable), la
    //  même que les liens arment tout seuls.
    laSurfaceVaNaviguer();
    fermerRecherche();
    //  ⚠️ VALIDER, C'EST CHANGER D'ADRESSE (refonte nº 191) : le
    //  routeur pose alors SON étape d'historique, une seule, et le
    //  retour ramène à l'étape d'avant. Plus aucun drapeau, plus aucune
    //  étape posée à la main — c'est ce qui faisait grandir l'historique
    //  à chaque retour.
    if (retenus) surChangement(retenus);
    /*  §1 (nº 334) — LE `window.scrollTo({ top: 0 })` QUI VIVAIT ICI EST
        PARTI, ET C'ÉTAIT LE TROISIÈME REMONTAGE DE LA PAGE QU'ON QUITTE.
        ------------------------------------------------------------------
        Il datait de la refonte nº 191, quand rien d'autre ne remontait
        la liste. Depuis, DEUX autres mécanismes s'en chargent, et
        celui-ci arrivait en premier — sur l'ANCIENNE liste, encore
        affichée. Mesuré image par image : 131 images sur 150 montraient
        l'ancienne liste posée en haut, exactement ce que le
        propriétaire décrit. Pire, il écrivait 0 dans la position
        mémorisée de la page qu'on quitte (un `scrollTo` NU n'est même
        pas annoncé : la barre y lit un geste, et la mémoire l'entend) —
        et le retour rendait 0 au lieu de 900.
        CE QUI REMONTE LA LISTE MAINTENANT, et une seule fois :
        `laListeServieEstArrivee` (lib/liste-neuve), joué par la liste
        NEUVE à son arrivée, avant sa peinture. `surChangement` l'a armé
        juste au-dessus, par le geste. */
  }

  /** « EFFACER » N'EFFACE QUE CE QUI EST SOUS LES YEUX (règle
      historique, de retour avec la bascule — nº 141) : sur
      « Recherche », le style, le lieu et le rayon ; sur « Filtres »,
      les badges. Il ne CHERCHE toujours pas : rien ne bouge tant que
      « Valider » n'a pas été pressé. */
  function effacerLaVue() {
    if (vuePage === "filtres") {
      poserDansLeBrouillon({ exclure: [] });
      return;
    }
    setEffacements((n) => n + 1);
    poserBrouillon({ ...criteresComplets(), exclure: enFenetre.exclure });
  }

  /*  ⚠️ PLUS D'INTERRUPTEURS DANS LE MOTEUR (nº 139) : les filtres
      sont des BADGES — voir `basculerBadge` plus bas, qui parle
      toujours le même `exclure` à la base. */

  /**
   * LES FILTRES EN BADGES (refonte nº 139) — et la règle qui les fait
   * parler le langage de la base SANS Y CHANGER UN MOT.
   * ==================================================================
   * ⚠️ LA BASE NE CONNAÎT QUE `exclure` (les slugs écartés), et cette
   * passe N'Y TOUCHE PAS. Ce qui change est la LECTURE :
   *  · un interrupteur disait « j'écarte ce que je ne veux pas » ;
   *  · un badge dit « je sélectionne ce que je cherche ».
   * Les deux sont la même chose, lue dans l'autre sens :
   *  · TOUS les badges sélectionnés = rien d'écarté = pas de filtrage ;
   *  · des badges sélectionnés = tous les AUTRES slugs du groupe sont
   *    écartés — c'est exactement l'`exclure` d'hier.
   * Une adresse partagée d'avant la passe (`exclure=…`) se lit donc
   * telle quelle : les slugs restants s'affichent sélectionnés.
   *
   * ⚠️ AU DÉPART, TOUT EST SÉLECTIONNÉ (nº 143-2B). C'est le sens de
   * la recherche : sans filtre, on cherche PARTOUT. On retire ce qu'on
   * ne veut pas, on n'ajoute pas ce qu'on veut.
   *
   * ⚠️ ET C'EST CE QUI RÉPARE LE BADGE QUI « REFUSAIT DE S'ACTIVER »
   * (nº 143-2A). `exclure = []` dit UNE chose — « rien n'est écarté » —
   * et l'ancien code la lisait « AUCUN badge allumé ». Sur un groupe de
   * trois, cocher le troisième ramenait donc `exclure` à vide… et
   * éteignait les trois d'un coup. Vu de l'écran : « le troisième ne
   * s'active pas ». La même valeur se lit désormais « TOUS allumés »,
   * et la boucle se referme correctement.
   */
  function slugsDuGroupe(groupe: (typeof GROUPES_FILTRES)[number]): string[] {
    return groupe.options.map((option) => option.slug);
  }

  /**
   * LES SLUGS QUI ONT UN BADGE (passe nº 149-§6). L'option « Artistes »
   * du groupe Lieu n'est plus affichée — le groupe « Artiste » (les
   * modes) parle pour elle. Son slug reste dans le groupe (il
   * appartient au langage `exclure=`) mais l'écran raisonne sur les
   * badges VISIBLES : un slug caché reste sélectionné en permanence et
   * ne part jamais dans `exclure`.
   */
  function slugsVisibles(groupe: (typeof GROUPES_FILTRES)[number]): string[] {
    return groupe.options
      .filter((option) => !("cachee" in option && option.cachee))
      .map((option) => option.slug);
  }

  /**
   * LES DEUX GROUPES QU'ON NE PEUT PAS VIDER ENSEMBLE (nº 148-§2,
   * re-titrés à la nº 149) : « Artiste » (les modes, groupe `mode`) et
   * « Lieu » (les établissements, groupe `type`) sont les deux moitiés
   * d'une même question. On peut abandonner l'une, jamais les deux :
   * le dernier badge allumé des deux réunis ne se retire pas.
   */
  const GROUPES_INSEPARABLES: string[] = ["type", "mode"];

  /**
   * LES DEUX GROUPES QUI GARDENT TOUJOURS UN BADGE (passe nº 151-§3).
   * « Technique » (Handpoke · Tebori · Machine) et « Rendu » (Noir et
   * gris · Couleur) décrivent DES IMAGES, pas des personnes : chaque
   * photo du site a forcément une technique et un rendu. Vider l'un de
   * ces deux groupes reviendrait donc à demander une photo qui n'est ni
   * en noir et gris ni en couleur — une question sans réponse possible.
   *
   * LA RÈGLE : retirer le DERNIER badge allumé d'un de ces groupes est
   * refusé, et LE GROUPE ENTIER SE RÉACTIVE. Chacun des deux est jugé
   * pour lui-même — c'est là toute la différence avec « Artiste + Lieu »
   * ci-dessus, où les deux groupes forment un seul ensemble et où l'un
   * peut se vider tant que l'autre garde un badge.
   */
  const GROUPES_INDIVISIBLES: string[] = ["technique", "rendu"];

  function selectionDuGroupe(
    groupe: (typeof GROUPES_FILTRES)[number],
    exclure: string[]
  ): string[] {
    //  UNE SEULE LECTURE, sans cas particulier : est sélectionné tout
    //  badge qui n'est pas écarté. `exclure` vide ⇒ tout est
    //  sélectionné. (Sur les VISIBLES : un slug caché n'a pas de badge
    //  et ne compte ni pour l'écran ni pour la règle d'ensemble.)
    return slugsVisibles(groupe).filter((slug) => !exclure.includes(slug));
  }

  function basculerBadge(
    groupe: (typeof GROUPES_FILTRES)[number],
    slug: string,
    valeurs: CritèresTatouage,
    poser: (suivant: Partial<CritèresTatouage>) => void
  ) {
    const tous = slugsDuGroupe(groupe);
    const visibles = slugsVisibles(groupe);
    const selection = selectionDuGroupe(groupe, valeurs.exclure);
    const suivante = selection.includes(slug)
      ? selection.filter((s) => s !== slug)
      : [...selection, slug];

    //  ============================================================
    //  VIDER UN GROUPE, ET LA SEULE LIMITE (passe nº 148-§2)
    //  ------------------------------------------------------------
    //  Un groupe VIDE ne veut pas dire « ne me montre rien » : il veut
    //  dire QU'ON ABANDONNE CE CRITÈRE — la base ne reçoit alors aucun
    //  filtre pour lui (voir `allumesDuGroupe`, src/lib/tatoueurs.ts).
    //
    //  ⚠️ DEUX GROUPES NE SE VIDENT PLUS DU TOUT (passe nº 151-§3) :
    //  TECHNIQUE et RENDU gardent chacun au moins un badge allumé —
    //  retirer le dernier RÉACTIVE LE GROUPE ENTIER. Ils décrivent des
    //  images, et toute image a une technique et un rendu.
    //
    //  SAUF POUR L'ENSEMBLE « ARTISTE + LIEU » (GROUPES_INSEPARABLES),
    //  qui dit QUI l'on cherche et OÙ. Les deux forment un tout : on
    //  peut vider l'un OU l'autre, jamais LES DEUX — sans eux, la
    //  question posée au moteur n'a plus de sujet.
    //  Retirer le dernier badge allumé des deux groupes réunis est
    //  donc refusé, et c'est LE GROUPE OÙ SE TROUVAIT CE BADGE qui se
    //  rallume en entier — jamais l'autre, qui n'a rien demandé.
    //  ============================================================
    let selectionFinale = suivante;
    //  TECHNIQUE ET RENDU : chacun pour soi, et jamais vide.
    if (suivante.length === 0 && GROUPES_INDIVISIBLES.includes(groupe.groupe)) {
      selectionFinale = visibles;
    }
    if (suivante.length === 0 && GROUPES_INSEPARABLES.includes(groupe.groupe)) {
      const restantAilleurs = GROUPES_FILTRES.filter(
        (autre) =>
          autre.groupe !== groupe.groupe &&
          GROUPES_INSEPARABLES.includes(autre.groupe)
      ).some(
        (autre) => selectionDuGroupe(autre, valeurs.exclure).length > 0
      );
      if (!restantAilleurs) selectionFinale = visibles;
    }

    //  TOUT SÉLECTIONNÉ : le groupe n'écarte rien — `exclure` vide.
    //  GROUPE VIDÉ : ses slugs VISIBLES partent dans `exclure` (un
    //  slug caché n'y va jamais), et `allumesDuGroupe` lira « critère
    //  abandonné » quand tout le groupe y est.
    const exclusDuGroupe =
      selectionFinale.length === visibles.length
        ? []
        : visibles.filter((s) => !selectionFinale.includes(s));
    poser({
      exclure: [
        ...valeurs.exclure.filter((s) => !tous.includes(s)),
        ...exclusDuGroupe,
      ],
    });
  }

  /** UN GROUPE DE BADGES — le titre, puis les capsules en drapeau.
      ⚠️ FINI LE ROSE PLEIN (nº 144-§7). Depuis que tout est
      sélectionné au départ (nº 143-2B), une rangée de badges roses
      faisait un MUR rose. Le sélectionné se dit désormais par TROIS
      signes discrets : un fond UN CRAN PLUS CLAIR, une petite COCHE
      rose — le seul rose qui reste, à sa juste place —, et le texte
      en BLANC. Le retiré s'assombrit et grise : c'est LUI qui
      s'écarte du lot, comme dans la donnée (`exclure`).
      AUCUNE ligne de séparation entre les groupes — l'espacement et
      la typographie suffisent (charte).
      `surPanneau` : posés sur le panneau web éclairci (nº 144-§3),
      les badges grimpent d'un cran pour garder le même contraste. */
  const groupeDeBadges = (
    groupe: (typeof GROUPES_FILTRES)[number],
    titre: string,
    valeurs: CritèresTatouage,
    poser: (suivant: Partial<CritèresTatouage>) => void,
    surPanneau = false
  ) => {
    const selection = selectionDuGroupe(groupe, valeurs.exclure);
    //  ⚠️ LE DESSIN DU BADGE A DÉMÉNAGÉ (nº 174-§2) : il vit dans
    //  components/BadgesCharte.tsx, et les pilules de RAYON appellent le
    //  MÊME composant. C'est la seule façon que les deux ne divergent
    //  plus jamais — elles avaient divergé pendant sept passes.
    //  ⚠️ PLUS DE `<fieldset>` NI DE `<legend>` (nº 169-§1, huitième
    //  signalement). Le relevé de la sonde, chez le propriétaire :
    //  dernier groupe HAUT DE 84 px pour un contenu de 66 — titre 18,
    //  écart 10, rangée 38 — soit 18 px de vide en fin de groupe, ni
    //  marge ni rembourrage (mb 0, pb 0). Ces 18 px sont EXACTEMENT la
    //  hauteur de la légende : c'est le rendu NATIF du couple
    //  fieldset/legend qui les fabrique — la légende est extraite du
    //  flux et posée sur la bordure, et le fieldset lui réserve EN PLUS
    //  une boîte de sa hauteur. Le comportement diffère d'un moteur à
    //  l'autre (invisible ici, bien présent chez lui) : aucune marge
    //  rognée n'aurait pu le corriger partout.
    //  UN GROUPE EST DONC UNE BOÎTE ORDINAIRE, dont la hauteur vaut
    //  exactement celle de son contenu. L'accessibilité est conservée
    //  à l'identique : `role="group"` et un titre qui NOMME le groupe
    //  (`aria-labelledby`) disent au lecteur d'écran ce que disaient
    //  fieldset et legend.
    const idTitre = `${groupe.groupe}-titre`;
    return (
      <GroupeBadges key={groupe.groupe} titre={titre} idTitre={idTitre}>
        {/*  Seules les options VISIBLES ont un badge (nº 149-§6) :
             « Artistes » du groupe Lieu n'en a plus. */}
        {groupe.options
          .filter((option) => !("cachee" in option && option.cachee))
          .map((option) => (
            <BadgeCharte
              key={option.slug}
              actif={selection.includes(option.slug)}
              surPanneau={surPanneau}
              onClick={() => basculerBadge(groupe, option.slug, valeurs, poser)}
            >
              {option.label}
            </BadgeCharte>
          ))}
      </GroupeBadges>
    );
  };

  /**
   * LE BLOC DES FILTRES — LE MÊME sur web et sur mobile.
   * ⚠️ PLUS DE VOLETS (nº 149-§6) : le sélecteur « Type de profil /
   * Où tatoue-t-il ? » a disparu. À la place, UNE LISTE UNIQUE de
   * quatre groupes, dans cet ordre, chacun sous son titre :
   *   · ARTISTE   — comment il travaille (le groupe `mode`) ;
   *   · LIEU      — studio ou salon (le groupe `type`, sans le badge
   *                 « Artistes » : le groupe du dessus parle pour eux) ;
   *   · TECHNIQUE — handpoke, tebori, machine ;
   *   · RENDU     — noir et gris, couleur.
   * AUCUNE ligne de séparation : l'espacement et la typographie
   * suffisent (charte).
   * ⚠️ COMPOSITION ET BESOINS NE S'AFFICHENT TOUJOURS PAS — ils ne
   * sont PAS supprimés : leurs groupes vivent dans GROUPES_FILTRES,
   * la base et les adresses `exclure=` les comprennent comme avant,
   * et une passe ultérieure les réintégrera.
   */
  const parGroupe = new Map(GROUPES_FILTRES.map((g) => [g.groupe, g]));

  const blocFiltres = (
    valeurs: CritèresTatouage,
    poser: (suivant: Partial<CritèresTatouage>) => void,
    /** VRAI dans le panneau web (nº 144-§3) : le panneau ayant grimpé
        à `eleve`, tout ce qui est posé dessus grimpe d'un cran, et
        les groupes respirent un peu plus. */
    surPanneau = false
  ) => (
    //  ⚠️ 16 px ENTRE LES GROUPES, PARTOUT (nº 163-§3B, quatrième
    //  demande) : la nº 155 avait posé 20 sur le panneau web — encore
    //  trop. Le web s'aligne sur la valeur mobile de la nº 157 : 16 px
    //  au-dessus des titres LIEU, TECHNIQUE et RENDU, des deux côtés.
    //
    //  ⚠️ ET CET ESPACEMENT NE VIT PLUS APRÈS LE DERNIER BLOC
    //  (nº 166-§3, septième signalement). Relevé du propriétaire, au
    //  pixel : marge gauche 20, marge haute 20, MARGE BASSE 38 —
    //  l'espacement de fin de section du dernier groupe (RENDU) reste
    //  appliqué, et sa boîte est plus haute que son contenu.
    //  LA CORRECTION EST STRUCTURELLE, pas un réglage : l'espacement
    //  ne se déclare plus sur le CONTENEUR (`gap`, qui sépare mais
    //  qu'un enfant supplémentaire ou une boîte trop haute peut faire
    //  déborder), il est porté PAR CHAQUE GROUPE SAUF LE PREMIER
    //  (`fieldset + fieldset`). Rien ne peut donc plus s'ajouter après
    //  le dernier : il n'y a aucune règle qui le suive. Le dernier
    //  groupe voit en outre toute marge et tout rembourrage de fin
    //  remis à zéro — du bas de son dernier badge au bord du panneau,
    //  il ne reste que le rembourrage du panneau : 20 px, comme à
    //  gauche et en haut. */
    <div
      //  ⚠️ D'OÙ VIENT CE BLOC (nº 167-§2) : la sonde des filtres lit ces
      //  deux attributs DANS LE DOM et les affiche. C'est la seule
      //  façon de savoir si le composant corrigé ici est bien celui que
      //  le navigateur du propriétaire rend.
      data-source-fichier="src/components/MoteurTatouage.tsx"
      data-source-composant={
        surPanneau ? "MoteurTatouage · blocFiltres (panneau web)" : "MoteurTatouage · blocFiltres (page mobile)"
      }
      className="flex flex-col
                 [&>[data-groupe-filtres]+[data-groupe-filtres]]:mt-4
                 [&>[data-groupe-filtres]:last-child]:mb-0
                 [&>[data-groupe-filtres]:last-child]:pb-0"
    >
      {groupeDeBadges(parGroupe.get("mode")!, "Artiste", valeurs, poser, surPanneau)}
      {groupeDeBadges(parGroupe.get("type")!, "Lieu", valeurs, poser, surPanneau)}
      {groupeDeBadges(
        parGroupe.get("technique")!,
        "Technique",
        valeurs,
        poser,
        surPanneau
      )}
      {groupeDeBadges(parGroupe.get("rendu")!, "Rendu", valeurs, poser, surPanneau)}
    </div>
  );

  /**
   * LES ENTRÉES DU MENU « EXPLORER » (passe nº 110)
   * ================================================
   * Deux catégories, chacune avec sa porte (voir MenuDeroulant
   * `repliable`) : TATOUAGES et FLASHS. Sous chaque porte, « Tous
   * les … » puis les entrées de styles.
   *
   * ⚠️ « Tous les styles » A DISPARU DE LA LISTE : le champ vide dit
   * déjà « rien de cherché » (l'indication « Explorer » se lit en
   * gris, comme le fantôme d'un champ). Ce qui le remplace, ce sont
   * les deux « Tous les … », qui ne veulent PAS dire la même chose —
   * ils cherchent une nature, pas l'absence de critère.
   *
   * TRENTE ET UNE ENTRÉES DE A À Z (nº 113, recomptées nº 291), dont une FAMILLE
   * dépliante : « Cultures du monde » n'est pas un style — c'est
   * une porte, posée à sa lettre, qui révèle les onze styles qu’elle
   * range. Elle ne porte aucune valeur cherchable ; seuls ses neuf
   * enfants en ont une (voir `entreesExplorer`).
   *
   * LE NOMBRE DE PORTFOLIOS EN FACE DE CHAQUE ENTRÉE (nº 216-§2,
   * corrigé par la nº 217-§1)
   * -----------------------------------------------------------------
   * Chaque style annonce combien de PORTFOLIOS l'attendent — pas
   * combien de photos existent : personne n'ouvre ce menu pour savoir
   * combien d'aquarelles ont été déposées. Les deux « Tous les … »
   * annoncent le total de leur catégorie, compté à part (le même
   * artiste peut tenir plusieurs styles : l'addition le compterait
   * deux fois).
   *
   * ⚠️ TROIS ENDROITS N'EN PORTENT PAS, et c'est voulu :
   *  · les DEUX PORTES « Réalisations » et « Flashs » — ce sont des
   *    titres de section, pas des choix (demande explicite : « il ne
   *    s'affiche PAS sur la ligne du sélecteur Réalisation / Flash ») ;
   *  · la porte de la famille « Cultures du monde », même raison —
   *    elle ne porte aucune valeur cherchable ;
   *  · TOUTES LES ENTRÉES tant que la réponse n'est pas arrivée —
   *    `compte: undefined` s'affiche exactement comme avant, sans
   *    nombre (voir `comptesConnus`).
   */
  const comptes = useComptesCreations();
  const nombresSus = comptesConnus(comptes);
  /** Le nombre d'une entrée, ou rien tant qu'on ne sait pas. */
  const compteStyle = (nature: string, style: string) =>
    nombresSus ? compteDuStyle(comptes, nature, style) : undefined;

  const options = CATEGORIES_EXPLORER.flatMap((categorie) => [
    {
      value: valeurExplorer(categorie.nature, ""),
      label: categorie.tous,
      groupe: categorie.titre,
      compte: nombresSus
        ? compteDeLaCategorie(comptes, categorie.nature)
        : undefined,
    },
    ...entreesExplorer().flatMap((entree) =>
      entree.genre === "style"
        ? [
            {
              value: valeurExplorer(categorie.nature, entree.slug),
              label: entree.label,
              groupe: categorie.titre,
              compte: compteStyle(categorie.nature, entree.slug),
            },
          ]
        : entree.styles.map((style) => ({
            value: valeurExplorer(categorie.nature, style.slug),
            label: style.label,
            groupe: categorie.titre,
            sousGroupe: entree.label,
            compte: compteStyle(categorie.nature, style.slug),
          }))
    ),
  ]);

  /** Ce que le menu porte aujourd'hui — le couple nature + style,
      encodé. Vide quand rien n'a été cherché. */
  const valeurDuMenu = valeurExplorer(criteres.nature, criteres.style);

  /** Un choix dans le menu pose les DEUX critères d'un coup : ils ne
      se séparent jamais. */
  const choisirDansExplorer = (
    valeur: string,
    poser: (suivant: Partial<CritèresTatouage>) => void
  ) => {
    const { nature, style } = lireValeurExplorer(valeur);
    poser({ nature, style });
  };

  /** CE QUE LA RECHERCHE DEMANDE, EN UNE LIGNE — « Flashs · Réalisme »
      depuis la passe nº 110.
      ⚠️ VIDE QUAND RIEN N'EST CHERCHÉ, et c'est ce qui compte : c'est
      lui qui remplit le champ refermé du menu, et un champ qui
      afficherait « Tous les styles » d'entrée ne serait plus une
      invitation — il annoncerait un choix que personne n'a fait.
      Vide, l'indication « Explorer » reprend sa place. */
  const libelleQuoi = libelleExplorer(criteres.nature, criteres.style);
  const libelleOu = libelleLieu(criteres);

  /**
   * §3 (nº 309) — LE CHAMP « Style » DU WEB NE GARDE QUE LE STYLE.
   * ------------------------------------------------------------------
   * CE QU'IL AFFICHAIT JUSQU'ICI : le COUPLE catégorie + style, écrit
   * par `libelleExplorer` — « Réalisations · Acid-trad », « Flashs ·
   * Réalisme ». C'était une décision de la nº 110, et elle avait sa
   * raison, notée juste sous ce champ : « Réalisme tout seul ne dirait
   * plus si l'on cherche des tatouages ou des flashs ». Le propriétaire
   * tranche autrement : le champ s'appelle « Style » depuis la nº 303,
   * il doit donc dire un style, et rien d'autre.
   * ⚠️ LE CAS SANS STYLE GARDE SES MOTS. Quand une catégorie seule est
   * cherchée (« Toutes les réalisations »), il n'y a AUCUN style à
   * écrire : n'afficher que le style viderait le champ alors qu'une
   * recherche est bel et bien en cours, et l'invitation « Style »
   * reprendrait la place d'un choix qui a été fait. On garde donc la
   * phrase de la catégorie dans ce seul cas.
   * ⚠️ WEB SEULEMENT : `libelleQuoi` continue de servir tel quel à
   * l'aria-label de la pilule du smartphone et à la page de recherche
   * — rien n'y change.
   */
  const libelleChampStyleWeb = criteres.style
    ? libelleStyle(criteres.style)
    : libelleQuoi;

  /** RIEN N'A ENCORE ÉTÉ CHERCHÉ : la barre fixe n'a alors aucun
      résultat à résumer — elle INVITE, elle ne rend pas compte. */
  const rechercheVierge =
    !criteres.style && !criteres.nature && !criteres.lieu;
  /*  ⚠️ LE RÉSUMÉ DE LA PILULE A DISPARU (nº 140) : la barre dit
      toujours « Recherche », et les critères en cours se lisent dans
      le TITRE au-dessus de la mosaïque. Seul l'aria-label garde le
      détail (`libelleQuoi`, `libelleOu`) — un lecteur d'écran ne voit
      pas ce titre à côté de la pilule. */

  /* ---- LA REMONTÉE DU MENU « EXPLORER » (nº 175-§4, mobile) ----
     Le bloc à remonter, et la fonction qui range la remontée quand le
     menu se referme. Le ranger vit dans une référence : il n'appartient
     pas au rendu, et deux ouvertures ne peuvent pas en laisser un
     derrière elles. */
  const blocExplorer = useRef<HTMLDivElement>(null);
  const rangerExplorer = useRef<(() => void) | null>(null);
  //  Le démontage de la page de recherche ne doit rien laisser traîner.
  useEffect(
    () => () => {
      rangerExplorer.current?.();
      rangerExplorer.current = null;
    },
    []
  );
  /**
   * ⚠️ IL REND UNE PROMESSE À L'OUVERTURE (nº 195-§2) : le menu ne
   * s'affiche qu'une fois la remontée TERMINÉE. C'est un enchaînement
   * strict — la durée est celle de la glissade elle-même, celle que
   * pose `remonterSansClavier`.
   */
  function surOuvertureExplorer(ouvert: boolean): void | Promise<void> {
    if (ouvert) {
      const cible = blocExplorer.current;
      if (!cible) return;
      rangerExplorer.current?.();
      rangerExplorer.current = remonterSansClavier(cible);
      return new Promise<void>((finie) => {
        window.setTimeout(finie, GLISSADE_MS);
      });
    }
    //  Fermé — sélection faite ou abandon : la page reprend sa place.
    rangerExplorer.current?.();
    rangerExplorer.current = null;
  }

  // LE RAYON N'EST UTILISABLE QU'AUTOUR D'UN POINT (ville, adresse).
  // Sans lieu, ou sur une RÉGION / un PAYS, il reste EXACTEMENT à sa
  // place mais devient inactif : grisé, non manipulable. Aucune phrase
  // ne le remplace — la fenêtre garde ainsi la même hauteur quel que
  // soit le lieu choisi, et un réglage éteint se lit tout seul.
  const rayonActif = rayonApplicable(criteres.lieu);

  /** LES PILULES DE RAYON — posées dans le PANNEAU du champ de
      localisation (web), sous les suggestions, dès qu'une ville ou une
      adresse est choisie. Un palier par pilule, l'actif en rose, à
      partir de DIX kilomètres. `onPointerDown` + `preventDefault` : le
      champ garde le focus, le panneau reste ouvert — on peut ajuster
      plusieurs fois. */
  const piedRayon = rayonActif ? (
    //  ⚠️ LA CHARTE DES FILTRES, À L'IDENTIQUE (nº 174-§2). Ces badges
    //  ne l'avaient jamais reçue : fond ROSE PLEIN pour l'actif, aucun
    //  point, titre collé à la rangée, marges au petit bonheur.
    //  Ils appellent désormais LE MÊME COMPOSANT que le panneau des
    //  filtres — `GroupeBadges` et `BadgeCharte` — donc, sans qu'on ait
    //  rien à recopier : point rose actif / gris inactif, aucun fond
    //  rose, aucun contour, un repos qui se voit, et l'écart
    //  titre → première rangée de 10 px, celui d'ARTISTE.
    //  LES MARGES DU BLOC SONT CELLES DU PANNEAU DES FILTRES, aux mêmes
    //  valeurs : 20 px à gauche, à droite et en bas ; en haut 15 px,
    //  parce que la boîte de ligne d'un titre en capitales pose ~5 px
    //  d'air invisible au-dessus de l'encre (nº 163-§3A) — 20 px à
    //  l'œil, comme les trois autres côtés.
    <div className="px-5 pb-5 pt-[15px]">
      {/*  ⚠️ « RAYON » TOUT COURT (nº 175-§2) : le titre nommait la
           ville — « RAYON AUTOUR DE LYON ». Il dit maintenant le
           critère, comme ARTISTE, LIEU, TECHNIQUE et RENDU, dans la
           même casse et le même style (le composant s'en charge). La
           ville, elle, est déjà écrite juste au-dessus, dans le champ. */}
      <GroupeBadges titre="Rayon" idTitre={`${id}-rayon-titre`}>
        {RAYONS_TATOUAGE.map((palier) => (
          <BadgeCharte
            key={palier}
            actif={palier === criteres.rayonKm}
            //  ⚠️ SUR PANNEAU (nº 179-§1) : la fenêtre du rayon a pris
            //  le fond du panneau des filtres (`eleve`). Ce qui est
            //  POSÉ dessus grimpe d'autant — exactement la règle de la
            //  nº 144-§3, et la même robe que les badges des filtres.
            surPanneau
            //  `preventDefault` : le champ garde le focus, le panneau
            //  reste ouvert — on peut ajuster plusieurs fois.
            onPointerDown={(evenement) => {
              evenement.preventDefault();
              annoncer({ rayonKm: palier });
            }}
          >
            {palier} km
          </BadgeCharte>
        ))}
      </GroupeBadges>
    </div>
  ) : undefined;

  /** Le curseur de rayon de la FENÊTRE mobile — sous la localité,
      TOUJOURS présent, grisé et hors d'usage tant que le lieu choisi
      n'est pas un point (aucun lieu, une région, un pays). La piste
      prend la largeur restante : aucun écran n'est trop étroit.
      SON MINIMUM EST DIX KILOMÈTRES : le curseur démarre au premier
      palier, exactement comme la première pilule du web.
      Il travaille sur le BROUILLON de la fenêtre : bouger le curseur
      ne relance rien tant que « Valider » n'a pas été pressé. */
  const curseurRayon = (
    valeurs: CritèresTatouage,
    poser: (suivant: Partial<CritèresTatouage>) => void
  ) => {
    const actif = rayonApplicable(valeurs.lieu);
    const index = Math.max(0, RAYONS_TATOUAGE.indexOf(valeurs.rayonKm));
    return (
    <div
      className={`flex items-center gap-3 text-[13px] transition-opacity ${
        actif ? "opacity-100" : "opacity-40"
      }`}
    >
        <label
          htmlFor={`${id}-rayon`}
          className="w-[46px] shrink-0 text-sombre-texte-doux"
        >
          Rayon
        </label>
        <input
          id={`${id}-rayon`}
          type="range"
          min={0}
          max={RAYONS_TATOUAGE.length - 1}
          step={1}
          value={index}
          disabled={!actif}
          aria-valuetext={`${valeurs.rayonKm} kilomètres`}
          title={actif ? undefined : "Choisir une ville pour régler le rayon"}
          onChange={(evenement) => {
            poser({
              rayonKm: RAYONS_TATOUAGE[Number(evenement.target.value)],
            });
          }}
          className={`curseur-sombre flex-1 min-w-0 ${
            actif ? "" : "cursor-not-allowed"
          }`}
        />
        <output
          htmlFor={`${id}-rayon`}
          className={`w-[52px] shrink-0 text-right font-semibold tabular-nums ${
            actif ? "text-primaire" : "text-sombre-texte-doux"
          }`}
        >
          {valeurs.rayonKm} km
        </output>
    </div>
    );
  };

  /** L'encadré style + ville du WEB — à la charte (nº 139) : AUCUN
      contour, AUCUN halo. Le champ se dit par son fond, et le focus
      l'éclaircit d'un cran — la grammaire de tous les champs du site.
      Le fin trait vertical ENTRE les deux champs reste : ce n'est pas
      un contour, c'est la ligne qui sépare deux champs d'un même
      encadré — la parente de celle des sélecteurs. */
  function encadreChamps(identifiant: string) {
    return (
      /*  ⚠️ L'ENCADRÉ EST EXTRAIT DEPUIS LA nº 245-§1 : il vit dans
          `EncadreDeuxChamps` (EncadreBarre.tsx) et la page « Ma
          sélection » consomme LA MÊME écriture pour ses deux menus.
          Rien n'a changé de ce qu'il dessine — fond `data-clair-barre`,
          aucun contour, le fin trait entre les deux moitiés. */
      <EncadreDeuxChamps
        gauche={
          <MenuDeroulant
            valeur={valeurDuMenu}
            surChangement={(valeur) => choisirDansExplorer(valeur, annoncer)}
            options={options}
            //  §3 (nº 309) — LE CHAMP REFERMÉ NE DIT PLUS QUE LE STYLE.
            //  Il disait le COUPLE depuis la nº 110 (« Réalisations ·
            //  Acid-trad ») pour qu'on sache si l'on cherche des
            //  tatouages ou des flashs ; le propriétaire a tranché —
            //  un champ qui s'appelle « Style » dit un style. Le
            //  couple reste dans le TITRE au-dessus de la mosaïque,
            //  qui l'écrit déjà en toutes lettres.
            libelleValeur={libelleChampStyleWeb}
            //  §3 (nº 303) — LE CHAMP S'INTITULE « Style ». « Explorer »
            //  était le nom du MENU, pas de ce qu'on y cherche : on y
            //  choisit un style, le champ le dit. Web et smartphone
            //  portent le même mot — c'est le même champ.
            ariaLabel="Style"
            placeholder="Style"
            //  §2 (nº 258) — LA HAUTEUR DES CERCLES (46 px, relevée
            //  sur les deux ronds voisins — jamais choisie) : le bloc
            //  était plus haut que tout ce qui l'entoure.
            hauteur="min-h-[46px]"
            taillePolice="text-base"
            sansBordure
            sombre
            repliable
            //  §2 (nº 290) — le trait rose sous « Cultures du monde » :
            //  le menu des styles du MOTEUR PRINCIPAL, côté web.
            familleSoulignee
            //  §2 (nº 293) — la page s'assombrit derrière ce menu (web).
            avecVoile
          />
        }
        droite={
          <ChampLocalisation
            pourLeMoteur
            id={`${identifiant}-lieu`}
            etiquette={null}
            texteIndicatif={TEXTES_TATOUAGE.ouLabel}
            lieuInitial={criteres.lieu}
            croixEffacement
            viderSiAbandon
            suffixeLieu={suffixeRayon(criteres)}
            surChoix={(choisi) => annoncer({ lieu: choisi })}
            sansBordure
            compact
            piedPanneau={piedRayon}
            garderOuvertApresChoix
          />
        }
      />
    );
  }

  return (
    <div className="w-full">
      {/* ---------- APPAREILS À SOURIS (toute largeur) ----------
          L'encadré épuré, et à sa droite le BOUTON ROND des filtres
          (diamètre 46 px — un peu moins que les 52 px de l'encadré).
          `mobile:hidden` : la bascule se fait PAR APPAREIL, plus
          jamais par largeur de fenêtre. Retiré tant que la page de
          recherche est ouverte : un seul moteur vivant à la fois. */}
      {!pageOuverte && (
        <div
          ref={zoneFiltres}
          //  §2 (nº 258) — LA BARRE NE CHANGE PAS SUR LE WEB : la
          //  rangée garde sa zone de 52 px et y CENTRE l'encadré
          //  descendu à 46 (items-center, déjà là).
          className="relative flex mobile:hidden items-center gap-2.5 min-h-[52px]"
        >
          {/* OUVRIR LE STYLE OU LA LOCALITÉ FERME LE PANNEAU DES
              FILTRES : un seul volet vivant à la fois. En capture,
              pour agir avant même que le menu ne s'ouvre — et
              `onFocusCapture` couvre l'arrivée au clavier. */}
          <div
            className="flex-1 min-w-0"
            onPointerDownCapture={() => setFiltresOuverts(false)}
            onFocusCapture={() => setFiltresOuverts(false)}
          >
            {encadreChamps(id)}
          </div>
          <button
            ref={boutonFiltres}
            type="button"
            onClick={() => setFiltresOuverts((etat) => !etat)}
            aria-expanded={filtresOuverts}
            aria-label="Filtres"
            title="Filtres"
            //  ⚠️ PLUS DE ROSE OUVERT (nº 144-§2) : le rose est réservé
            //  aux accents forts, et une fenêtre ouverte n'en est pas
            //  un. Ouvert, le FOND S'ÉCLAIRCIT d'un cran — la même
            //  langue que le focus d'un champ — et l'icône reste
            //  blanche. Fermé, la robe par défaut, même avec des
            //  filtres actifs.
            //  ⚠️ UN CRAN PLUS CLAIR (nº 150-§2), comme l'encadré :
            //  `eleve-clair` au repos, `haut` ouvert.
            //  ⚠️ SON FOND VIENT DE `[data-clair-barre]` (nº 174-§1),
            //  comme l'encadré et l'autre icône. Ouvert, il porte en
            //  plus `data-clair-vif` : le barreau du dessus — la règle
            //  qui servait déjà au survol et au focus. Rien d'autre ne
            //  change : ni contour, ni rose.
            data-clair-barre=""
            data-clair-vif={filtresOuverts ? "" : undefined}
            className="relative shrink-0 w-[46px] h-[46px] rounded-full
                       text-sombre-texte
                       flex items-center justify-center transition-colors"
          >
            <IconeReglages taille={20} />
          </button>

          {/* LA VUE PHOTOTHÈQUE — à côté du bouton de filtres, même
              taille (46 px), ronde. ⚠️ AUCUNE COULEUR D'ÉTAT (nº 141-
              4C) : robe constante, le DESSIN dit l'état — comme le
              bouton de disposition.
              ⚠️ SON ÉCRITURE EST EXTRAITE (nº 255-§4) : elle vit dans
              `BoutonPhototheque`, et la barre de « Ma sélection »
              consomme LA MÊME. Rien n'a changé de ce qu'elle dessine —
              46 px, `data-clair-barre`, le dessin qui dit l'état. */}
          <BoutonPhototheque contexte="barre web" />

          {filtresOuverts && (
            //  LE PANNEAU — la robe des fenêtres du web depuis la
            //  nº 144-§3 : fond ÉCLAIRCI D'UN CRAN (`eleve`), ni
            //  contour ni ombre — c'est la clarté qui le détache de la
            //  page. Dedans, LE MÊME bloc que la page mobile, recalé
            //  d'un niveau (`surPanneau`).
            //  ⚠️ IL NE VIT PLUS DANS LA RANGÉE (nº 238-§3), ET C'EST
            //  LA CORRECTION DE LA RÉGRESSION : sous 1024 px, la rangée
            //  du moteur porte `max-lg:overflow-hidden` (nº 147, le
            //  repli au défilement) — le panneau était rendu, à sa
            //  place, et rogné À CENT POUR CENT. Mesuré au banc :
            //  420 × 393 px, `display: block`, `visibility: visible`,
            //  aucune exception en console, un ancêtre coupeur. Monté
            //  dans le corps du document par `MenuDeVerre`, plus rien
            //  ne peut le couper — ni lui voler sa racine
            //  d'arrière-plan (le flou de la barre fixe).
            //  ⚠️ LES DEUX MARGES SONT ÉGALES À L'ŒIL, PAS EN VALEURS
            //  DÉCLARÉES (nº 163-§3A, quatrième demande). En bas, le
            //  bord d'une capsule COLORÉE touche le rembourrage : la
            //  distance réelle est le rembourrage, tout rond. En haut,
            //  le titre « ARTISTE » est du TEXTE NU : sa boîte de ligne
            //  (18 px pour des capitales de ~9) pose ~5 px d'air
            //  invisible AU-DESSUS de l'encre — mesuré au DOM : 25 px
            //  réels en haut pour 20 en bas, avec `p-5` partout. Le
            //  rembourrage haut descend donc à 15 px : l'encre du titre
            //  est à 20 px du bord, comme la capsule du bas.
            <MenuDeVerre
              ouvert={filtresOuverts}
              ancre={boutonFiltres}
              refPanneau={plaqueFiltres}
              largeur={420}
              alignement="droite"
              data-panneau-filtres=""
              data-source-fichier="src/components/MoteurTatouage.tsx"
              data-source-composant="MoteurTatouage · panneau web des filtres"
              className="px-5 pb-5 pt-[15px]"
            >
              {blocFiltres(criteres, annoncer, true)}
            </MenuDeVerre>
          )}
        </div>
      )}

      {/* ---------- VRAIS MOBILES (tactile) ----------
          UNE SEULE LIGNE, pleine largeur : la loupe à gauche, puis
          « style · localité » — tronqué d'un seul tenant s'il déborde. */}
      {/* LA RANGÉE DE LA BARRE (vrais mobiles) : la pilule de
          recherche, et à sa DROITE le bouton rond de DISPOSITION.
          ⚠️ SUR L'ACCUEIL SEULEMENT (nº 150-§3, `rangeeMobile`). */}
      {rangeeMobile && (
      <div className="hidden mobile:flex w-full items-center gap-2.5">
        {/* LA PILULE : la loupe, puis LE RÉSUMÉ DE LA RECHERCHE.
            TANT QUE RIEN N'EST CHERCHÉ, elle n'annonce pas « Partout »
            — un lieu que personne n'a demandé : elle INVITE, d'un mot,
            « Rechercher ».
            UNE FOIS LA RECHERCHE FAITE, elle reprend EXACTEMENT la
            typographie de la ligne de résultats posée au-dessus des
            cartes : le STYLE en blanc et en gras (c'est lui qu'on est
            venu voir), la LOCALITÉ en gris et sans gras derrière lui.
            Les deux se répondent d'un coup d'œil — la barre fixe dit
            la même chose que le titre, en une ligne. */}
        <button
          type="button"
          onClick={ouvrirLaPage}
          aria-haspopup="dialog"
          aria-expanded={pageOuverte}
          aria-label={
            rechercheVierge
              ? "Rechercher un tatoueur"
              : `Rechercher — ${libelleQuoi || "tout"}, ${libelleOu}`
          }
          //  ⚠️ FOND GOUVERNÉ PAR `[data-clair-barre]` (nº 174-§1) : sur
          //  des photos qui défilent, `eleve` se noyait. Le même cran
          //  que l'encadré du web et que les deux boutons voisins,
          //  réglable par `?clair=1|2|3`. La pression garde son
          //  comportement (`:active` monte d'un barreau).
          data-clair-barre=""
          //  §1 (nº 258) — MOINS 11 % : 52 × 0,89 = 46,28 → 46 au
          //  pixel entier — la hauteur même des cercles du web. La
          //  barre rend l'espace (réserve 122, voir EnTeteTatouage).
          className="flex flex-1 min-w-0 items-center gap-3 text-left
                     rounded-full
                     px-5 min-h-[46px] transition-colors"
        >
          {/*  ⚠️ TOUJOURS LE MÊME MOT (passe nº 140) : la loupe et
               « Recherche », qu'une recherche soit active ou non. Les
               critères en cours se lisent désormais dans le TITRE de
               la page, au-dessus de la mosaïque — la pilule est une
               PORTE, plus un résumé. L'aria-label, lui, garde le
               détail : un lecteur d'écran ne voit pas le titre à côté. */}
          <IconeLoupe taille={18} classe="shrink-0 text-sombre-texte-doux" />
          <span
            aria-hidden="true"
            className="min-w-0 flex-1 truncate text-[15px] leading-tight
                       font-semibold text-sombre-texte"
          >
            Recherche
          </span>
        </button>

        {/* LE BOUTON DE DISPOSITION — un cercle à la hauteur de
            l'encadré, JAMAIS rose : son apparence ne bouge pas, seule
            l'ICÔNE change et montre la disposition VERS LAQUELLE on
            bascule (en deux colonnes, elle propose la grande image ;
            en une colonne, la mosaïque). Le choix est mémorisé d'une
            visite à l'autre (voir src/lib/disposition-grille.ts). */}
        <button
          type="button"
          onClick={() => {
            // ⚠️ NOTER AVANT DE BASCULER. En une colonne, une carte
            // occupe presque tout l'écran : la même position de
            // défilement ne montre plus du tout le même tatoueur. On
            // retient donc la carte qu'on regarde, et la grille la
            // remet sous les yeux (voir src/lib/carte-du-haut.ts).
            // ⚠️ ET LE TOUT SOUS VERROU (nº 162-§2) : note, changement
            // et remise en place dans UNE SEULE tâche — aucune image
            // intermédiaire ne peut être peinte, quelle que soit la
            // charge du téléphone (voir lib/bascule-verrouillee).
            // ⚠️ UNE VALEUR EXPLICITE (nº 164) : le bouton demande la
            // disposition qu'il ANNONCE, il n'inverse pas l'état — deux
            // déclenchements ne peuvent plus se défaire l'un l'autre.
            noter(
              `CLIC bouton DISPOSITION (barre mobile) · ${disposition} → ${
                disposition === "deux" ? "une" : "deux"
              }`
            );
            basculerSansSaut(() =>
              poserDisposition(disposition === "deux" ? "une" : "deux")
            );
          }}
          aria-label={
            disposition === "deux"
              ? "Afficher une image par ligne"
              : "Afficher deux colonnes"
          }
          //  ⚠️ FOND GOUVERNÉ PAR `[data-clair-barre]` (nº 174-§1).
          data-clair-barre=""
          //  §1 (nº 258) — 46, comme le champ et l'autre rond : les
          //  trois blocs de la rangée restent alignés au pixel.
          className="shrink-0 w-[46px] h-[46px] rounded-full
                     text-sombre-texte
                     flex items-center justify-center active:opacity-80
                     transition-opacity"
        >
          {disposition === "deux" ? (
            <IconeUneColonne taille={20} />
          ) : (
            <IconeDeuxColonnes taille={20} />
          )}
        </button>

        {/* LA VUE PHOTOTHÈQUE — à DROITE du bouton de disposition.
            ⚠️ AUCUNE COULEUR D'ÉTAT (nº 141-4C) : exactement le
            traitement du bouton de disposition — la robe ne bouge
            pas, c'est le DESSIN qui change et montre la vue VERS
            LAQUELLE on bascule (la photo → images seules ; la carte →
            retour aux cartes).
            ⚠️ LA MÊME ÉCRITURE QUE LA BARRE WEB (extraite nº 255-§4,
            `BoutonPhototheque`) : ici en 52 px, avec le retour à
            l'appui de la rangée du doigt — les deux seules valeurs qui
            distinguaient les deux barres, et elles ne bougent pas. */}
        <BoutonPhototheque contexte="barre mobile" diametre={46} retourAuDoigt />
      </div>
      )}

      {pageOuverte && (
        /*  LA BASCULE EST DE RETOUR (nº 141) : « Recherche » (style,
            localité, rayon) et « Filtres » (les deux rectangles et
            leurs badges) — la page unique de la nº 139 était trop
            chargée. */
        <PageRechercheMobile
          vue={vuePage}
          surVue={poserVueRecherche}
          onValider={validerLaPage}
          onAbandonner={abandonnerLaPage}
          onEffacer={effacerLaVue}
        >
          {vuePage === "filtres" ? (
            blocFiltres(enFenetre, poserDansLeBrouillon)
          ) : (
            <>
          {/* 1. LE STYLE — le menu déroulant seul : son fantôme
              (« Explorer ») dit déjà tout, aucun titre.
              IL NE DIT PLUS RIEN À PERSONNE en s'ouvrant : il n'y a
              plus de fenêtre à lever. Son panneau s'ouvre en
              coordonnées d'écran, comme sur le web, et la page ne
              bouge pas dessous. */}
          {/*  ⚠️ ET IL REMONTE, LUI AUSSI (nº 175-§4). Toucher la
               LOCALITÉ amenait son bloc juste sous le haut de l'écran ;
               toucher EXPLORER ne faisait rien. Le geste est le même —
               espace de fin de document, `scrollIntoView` natif, marge
               d'air en CSS — mais il se déclenche à L'OUVERTURE DU
               MENU : un menu déroulant n'ouvre aucun clavier, il n'y a
               donc pas de `focus` à écouter. À la fermeture (une fois
               le style choisi), la page reprend sa position d'origine.
               `data-remonte-au-menu` porte la marge, recopiée de celle
               de la localité (globals.css). */}
          <div ref={blocExplorer} data-remonte-au-menu="">
            <MenuDeroulant
              valeur={valeurExplorer(enFenetre.nature, enFenetre.style)}
              surChangement={(valeur) =>
                choisirDansExplorer(valeur, poserDansLeBrouillon)
              }
              onOuvertureChange={surOuvertureExplorer}
              options={options}
              //  §3 (nº 303) — le même mot qu'en web : « Style ».
              ariaLabel="Style"
              placeholder="Style"
              hauteur="min-h-[54px]"
              taillePolice="text-[16px]"
              sombre
              repliable
              //  §2 (nº 290) — le même trait rose, côté SMARTPHONE :
              //  c'est le même menu des styles du moteur principal, et
              //  il s'ouvre dans le même panneau classique.
              familleSoulignee
              //  §2 (nº 293) — le même voile, côté smartphone : le crochet
              //  s'écarte de lui-même au doigt.
              avecVoile
            />
          </div>

          {/* 2. LA LOCALITÉ — dessous, sans titre non plus : son
              fantôme (« Où ? ») parle pour elle. */}
          <div>
            <ChampLocalisation
              pourLeMoteur
              //  §4 (nº 303) — AU DOIGT, LA MÊME ROBE QUE LE CHAMP DE
              //  STYLE juste au-dessus : même arrondi, même fond. Le
              //  web n'est pas concerné (là-bas, les deux champs
              //  passent `sansBordure` dans un encadré commun).
              robeDeMenu
              // « EFFACER » REMONTE LE CHAMP À ZÉRO : sa clé change,
              // le champ est reconstruit sur « aucun lieu ». Sans
              // ça, il continuerait d'afficher « Lyon » alors que la
              // recherche est redevenue mondiale.
              key={`${id}-fenetre-lieu-${effacements}`}
              id={`${id}-fenetre-lieu`}
              etiquette={null}
              texteIndicatif={TEXTES_TATOUAGE.ouLabel}
              lieuInitial={enFenetre.lieu}
              croixEffacement
              viderSiAbandon
              suffixeLieu={suffixeRayon(enFenetre)}
              surChoix={(choisi) => poserDansLeBrouillon({ lieu: choisi })}
              // ⚠️ LA LISTE EST DANS LE FLUX, ET C'EST TOUT L'INTÉRÊT
              // DE LA REFONTE (nº 121). Dans une PAGE, elle est
              // simplement le frère suivant du champ : le navigateur
              // la place, l'allonge, et fait défiler le document pour
              // la montrer. Même mécanique que le formulaire.
              panneauDansLeFlux
              // ET LE CHAMP MONTE EN HAUT DE LA PAGE au premier
              // toucher — par un défilement de DOCUMENT (scrollBy).
              remonterAuToucher
            />
          </div>

          {/* 3. LE RAYON — dessous, inactif sans point de départ. */}
          {curseurRayon(enFenetre, poserDansLeBrouillon)}
            </>
          )}
        </PageRechercheMobile>
      )}
    </div>
  );
}
