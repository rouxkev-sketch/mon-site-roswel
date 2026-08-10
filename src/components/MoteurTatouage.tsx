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
import { ChampLocalisation } from "@/components/ChampLocalisation";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { PageRechercheMobile } from "@/components/PageRechercheMobile";
import {
  IconeCartes,
  IconeDeuxColonnes,
  IconeLoupe,
  IconePhoto,
  IconeReglages,
  IconeUneColonne,
} from "@/components/Icones";
import { noterLaCarteDuHaut } from "@/lib/carte-du-haut";
import {
  basculerDisposition,
  lireDisposition,
  lireDispositionServeur,
  souscrireDisposition,
} from "@/lib/disposition-grille";
import {
  basculerPhototheque,
  lirePhototheque,
  lirePhototequeServeur,
  souscrirePhototheque,
} from "@/lib/vue-phototheque";
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

/** Le libellé du style choisi (« Tous les styles » par défaut). */
export function libelleStyleChoisi(style: string): string {
  return style ? libelleStyle(style) : "Tous les styles";
}

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
  /** La disposition de la mosaïque (mobile) — mémorisée localement. */
  const disposition = useSyncExternalStore(
    souscrireDisposition,
    lireDisposition,
    lireDispositionServeur
  );
  /** La vue photothèque (nº 140) — mémorisée de la même façon. */
  const phototheque = useSyncExternalStore(
    souscrirePhototheque,
    lirePhototheque,
    lirePhototequeServeur
  );

  // Le panneau des filtres du web : Échap et clic ailleurs referment.
  useEffect(() => {
    if (!filtresOuverts) return;
    function auClic(evenement: MouseEvent) {
      if (!zoneFiltres.current?.contains(evenement.target as Node)) {
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
    fermerRecherche();
    if (retenus) surChangement(retenus);
    // LA LISTE SE RELIT DEPUIS LE HAUT : valider une recherche ramène
    // tout en haut des résultats — sinon la page reste là où on
    // l'avait laissée et masque les premières cartes. `instant` : le
    // défilement doux global transformerait la remontée en animation
    // interrompue par le rendu. (La page de recherche rend déjà les
    // résultats en haut en sortant sur « Valider » ; ceci garantit le
    // haut même après l'arrivée des nouvelles cartes.)
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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
    const robeChoisie = surPanneau
      ? "bg-sombre-bordure text-sombre-texte"
      : "bg-sombre-eleve-clair text-sombre-texte";
    const robeRetiree = surPanneau
      ? "bg-sombre-eleve-clair/60 text-sombre-texte-doux hover:bg-sombre-eleve-clair"
      : "bg-sombre-eleve/70 text-sombre-texte-doux hover:bg-sombre-eleve";
    return (
      <fieldset key={groupe.groupe}>
        <legend className="text-[12px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
          {titre}
        </legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {/*  Seules les options VISIBLES ont un badge (nº 149-§6) :
               « Artistes » du groupe Lieu n'en a plus. */}
          {groupe.options
            .filter((option) => !("cachee" in option && option.cachee))
            .map((option) => {
            const choisi = selection.includes(option.slug);
            return (
              <button
                key={option.slug}
                type="button"
                aria-pressed={choisi}
                onClick={() => basculerBadge(groupe, option.slug, valeurs, poser)}
                //  ⚠️ LA CAPSULE DESCEND À 38 px (nº 155-§2A) : les
                //  44 px de la nº 149 faisaient des blocs empilés, pas
                //  des capsules. LA ZONE TACTILE, ELLE, RESTE À 44 :
                //  un ourlet invisible de 3 px déborde en haut et en
                //  bas (`before:`) — le doigt a sa place, l'œil a la
                //  sienne.
                //  ⚠️ LA LARGEUR NE BOUGE JAMAIS (nº 153-§1) : l'espace
                //  du POINT est réservé EN PERMANENCE, coché ou non —
                //  la mise en page est juste dès l'ouverture, rien ne
                //  bouge au clic.
                //  ⚠️ LE POINT, ET PLUS LA COCHE (nº 155-§2B) : sortie
                //  du flux, la coche se posait sur le mot. Le point a
                //  SON espace (22 px de rembourrage gauche, il vit à
                //  10 px), le texte le sien — ils ne se touchent pas.
                className={`relative inline-flex items-center justify-center
                           rounded-full pl-[22px] pr-4 min-h-[38px] text-[13.5px]
                           font-semibold transition-colors
                           before:absolute before:-inset-y-[3px] before:inset-x-0
                           before:content-[''] ${
                             choisi ? robeChoisie : robeRetiree
                           }`}
              >
                {/*  ⚠️ LE POINT NE DISPARAÎT JAMAIS (nº 157-§4) : il
                     passe en GRIS quand le badge est retiré — la
                     géométrie ne bouge pas d'un pixel, seule la
                     couleur dit l'état : rose et texte blanc quand
                     actif, gris et texte gris quand retiré. */}
                <span
                  aria-hidden="true"
                  className={`absolute left-[10px] top-1/2 h-1.5 w-1.5
                             -translate-y-1/2 rounded-full ${
                               choisi ? "bg-primaire" : "bg-sombre-texte-doux"
                             }`}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>
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
    //  ⚠️ 20 px ENTRE LES GROUPES, PARTOUT (nº 155-§3 et §4A) : les
    //  24 (mobile) et 28 (panneau web) faisaient des titres qui
    //  flottaient loin de leurs badges, et une liste trop longue pour
    //  le petit viewport d'un iPhone (barre d'outils dépliée).
    <div className={surPanneau ? "flex flex-col gap-5" : "flex flex-col gap-4"}>
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
   * TRENTE ENTRÉES DE A À Z (passe nº 113), dont une FAMILLE
   * dépliante : « Traditionnel ethnique » n'est pas un style — c'est
   * une porte, posée à sa lettre, qui révèle les neuf styles qu'elle
   * range. Elle ne porte aucune valeur cherchable ; seuls ses neuf
   * enfants en ont une (voir `entreesExplorer`).
   */
  const options = CATEGORIES_EXPLORER.flatMap((categorie) => [
    {
      value: valeurExplorer(categorie.nature, ""),
      label: categorie.tous,
      groupe: categorie.titre,
    },
    ...entreesExplorer().flatMap((entree) =>
      entree.genre === "style"
        ? [
            {
              value: valeurExplorer(categorie.nature, entree.slug),
              label: entree.label,
              groupe: categorie.titre,
            },
          ]
        : entree.styles.map((style) => ({
            value: valeurExplorer(categorie.nature, style.slug),
            label: style.label,
            groupe: categorie.titre,
            sousGroupe: entree.label,
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

  /** RIEN N'A ENCORE ÉTÉ CHERCHÉ : la barre fixe n'a alors aucun
      résultat à résumer — elle INVITE, elle ne rend pas compte. */
  const rechercheVierge =
    !criteres.style && !criteres.nature && !criteres.lieu;
  /*  ⚠️ LE RÉSUMÉ DE LA PILULE A DISPARU (nº 140) : la barre dit
      toujours « Recherche », et les critères en cours se lisent dans
      le TITRE au-dessus de la mosaïque. Seul l'aria-label garde le
      détail (`libelleQuoi`, `libelleOu`) — un lecteur d'écran ne voit
      pas ce titre à côté de la pilule. */

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
    //  À LA CHARTE (nº 139) : plus de trait au-dessus — l'espacement
    //  sépare — et les pilules deviennent des BADGES : l'actif en rose
    //  plein, les autres sur le fond un cran plus clair.
    <div className="px-4 pb-3 pt-1">
      <p className="text-[12.5px] font-medium text-sombre-texte-doux">
        Rayon autour de {criteres.lieu?.intitule}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {RAYONS_TATOUAGE.map((palier) => (
          <button
            key={palier}
            type="button"
            aria-pressed={palier === criteres.rayonKm}
            onPointerDown={(evenement) => {
              evenement.preventDefault();
              annoncer({ rayonKm: palier });
            }}
            className={`rounded-full px-3 min-h-[32px] text-[13px] font-semibold
                       transition-colors ${
                         palier === criteres.rayonKm
                           ? "bg-primaire text-white"
                           : "bg-sombre-eleve text-sombre-texte hover:bg-sombre-eleve-clair"
                       }`}
          >
            {palier} km
          </button>
        ))}
      </div>
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
      <div
        //  ⚠️ UN CRAN PLUS CLAIR (nº 150-§2) : à `eleve`, l'encadré se
        //  confondait avec la page quand les cartes défilaient
        //  derrière. `eleve-clair` au repos, et le focus grimpe à
        //  `haut` — l'éclaircissement des niveaux, jamais un contour.
        className="flex items-stretch rounded-2xl
                   bg-sombre-eleve-clair overflow-visible
                   focus-within:bg-sombre-haut
                   transition-colors"
      >
        <div className="flex-1 min-w-0 basis-1/2">
          <MenuDeroulant
            valeur={valeurDuMenu}
            surChangement={(valeur) => choisirDansExplorer(valeur, annoncer)}
            options={options}
            //  LE CHAMP REFERMÉ DIT LE COUPLE, pas seulement le style :
            //  « Réalisme » tout seul ne dirait plus si l'on cherche
            //  des tatouages ou des flashs.
            libelleValeur={libelleQuoi}
            ariaLabel="Explorer"
            placeholder="Explorer"
            hauteur="min-h-[52px]"
            taillePolice="text-base"
            sansBordure
            sombre
            repliable
          />
        </div>

        <div aria-hidden="true" className="w-px my-2.5 bg-sombre-bordure shrink-0" />

        <div className="flex-1 min-w-0 basis-1/2">
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
        </div>
      </div>
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
          className="relative flex mobile:hidden items-center gap-2.5"
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
            className={`relative shrink-0 w-[46px] h-[46px] rounded-full
                       flex items-center justify-center transition-colors ${
                         filtresOuverts
                           ? "bg-sombre-haut text-sombre-texte"
                           : "bg-sombre-eleve-clair text-sombre-texte hover:bg-sombre-haut"
                       }`}
          >
            <IconeReglages taille={20} />
          </button>

          {/* LA VUE PHOTOTHÈQUE — à côté du bouton de filtres, même
              taille (46 px), ronde. ⚠️ AUCUNE COULEUR D'ÉTAT (nº 141-
              4C) : robe constante, le DESSIN dit l'état — comme le
              bouton de disposition. */}
          <button
            type="button"
            onClick={() => {
              noterLaCarteDuHaut();
              basculerPhototheque();
            }}
            aria-pressed={phototheque}
            aria-label={
              phototheque ? "Revenir aux cartes" : "Voir les images seules"
            }
            title={phototheque ? "Revenir aux cartes" : "Images seules"}
            //  ⚠️ UN CRAN PLUS CLAIR (nº 150-§2), comme l'encadré.
            className="relative shrink-0 w-[46px] h-[46px] rounded-full
                       bg-sombre-eleve-clair text-sombre-texte
                       flex items-center justify-center
                       hover:bg-sombre-haut transition-colors"
          >
            {phototheque ? <IconeCartes taille={20} /> : <IconePhoto taille={20} />}
          </button>

          {filtresOuverts && (
            //  LE PANNEAU — la robe des fenêtres du web depuis la
            //  nº 144-§3 : fond ÉCLAIRCI D'UN CRAN (`eleve`), ni
            //  contour ni ombre — c'est la clarté qui le détache de la
            //  page. Dedans, LE MÊME bloc que la page mobile, recalé
            //  d'un niveau (`surPanneau`).
            <div
              className="absolute top-full right-0 z-30 mt-2
                         w-[min(420px,calc(100vw-32px))] rounded-2xl
                         bg-sombre-eleve px-5 pt-5 pb-4"
            >
              {blocFiltres(criteres, annoncer, true)}
            </div>
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
          className="flex flex-1 min-w-0 items-center gap-3 text-left
                     rounded-full bg-sombre-eleve
                     px-5 min-h-[52px] active:bg-sombre-eleve-clair transition-colors"
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
            // remet sous les yeux une fois la nouvelle disposition
            // peinte (voir src/lib/carte-du-haut.ts).
            noterLaCarteDuHaut();
            basculerDisposition();
          }}
          aria-label={
            disposition === "deux"
              ? "Afficher une image par ligne"
              : "Afficher deux colonnes"
          }
          className="shrink-0 w-[52px] h-[52px] rounded-full
                     bg-sombre-eleve text-sombre-texte
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
            retour aux cartes). */}
        <button
          type="button"
          onClick={() => {
            //  Même précaution que la disposition : on retient la
            //  carte du haut — masquer les textes change la hauteur
            //  des rangées, la position seule ne suffirait pas.
            noterLaCarteDuHaut();
            basculerPhototheque();
          }}
          aria-pressed={phototheque}
          aria-label={
            phototheque ? "Revenir aux cartes" : "Voir les images seules"
          }
          className="shrink-0 w-[52px] h-[52px] rounded-full
                     bg-sombre-eleve text-sombre-texte
                     flex items-center justify-center active:opacity-80
                     transition-opacity"
        >
          {phototheque ? <IconeCartes taille={20} /> : <IconePhoto taille={20} />}
        </button>
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
          <div>
            <MenuDeroulant
              valeur={valeurExplorer(enFenetre.nature, enFenetre.style)}
              surChangement={(valeur) =>
                choisirDansExplorer(valeur, poserDansLeBrouillon)
              }
              options={options}
              ariaLabel="Explorer"
              placeholder="Explorer"
              hauteur="min-h-[54px]"
              taillePolice="text-[16px]"
              sombre
              repliable
            />
          </div>

          {/* 2. LA LOCALITÉ — dessous, sans titre non plus : son
              fantôme (« Où ? ») parle pour elle. */}
          <div>
            <ChampLocalisation
              pourLeMoteur
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
