"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CATEGORIES_EXPLORER,
  entreesExplorer,
  GROUPES_FILTRES,
  filtresVivants,
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
import type { CommandesChampLocalisation } from "@/components/ChampLocalisation";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { useVoileDeLaPage } from "@/components/VoileDeLaPage";
import { PageRechercheMobile } from "@/components/PageRechercheMobile";
//  §1 (nº 331) — « la navigation gagne » : l'écriture commune, celle
//  que les liens arment tout seuls (lib/etape-refermable).
import { laSurfaceVaNaviguer } from "@/lib/etape-refermable";
import {
  ETATS_ROND_BARRE,
  IconeLoupe,
  IconeReglages,
} from "@/components/Icones";
import { BadgeCharte, GroupeBadges } from "@/components/BadgesCharte";
//  TEMPORAIRE (nº 610) — le journal de la sonde bascule, où la mesure
//  des airs du panneau écrit ses lignes. `noter` ne fait STRICTEMENT
//  rien sans `?sonde-bascule=1`.
import { noter, sondeBasculeArmee } from "@/lib/journal-bascule";
import { MenuDeVerre } from "@/components/SurfaceDeVerre";
import { EncadreDeuxChamps } from "@/components/EncadreBarre";
import { GLISSADE_MS, remonterSansClavier } from "@/lib/remontee-champ";
import {
  fermerRecherche,
  lireRecherche,
  lireRechercheServeur,
  ouvrirRecherche,
  poserBrouillon,
  poserVueRecherche,
  souscrireRecherche,
  type VueRecherche,
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
    //  nº 444 — LA GARDE DES VIEUX LIENS, côté navigateur : les slugs
    //  des deux groupes retirés de l'écran (ARTISTE, LIEU) sont
    //  écartés ici, à la porte unique des critères. Un lien
    //  « ?exclure=studio-prive%2Csalon » s'ouvre donc normalement, et
    //  aucun badge invisible ne peut plus filtrer la mosaïque.
    exclure: filtresVivants(partiels?.exclure),
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

/**
 * ██ §2 (nº 569) — LE PANNEAU DES FILTRES SE ROUVRE APRÈS UN REMONTAGE ██
 * ====================================================================
 * LE DÉFAUT : une ville est choisie, le panneau du rayon est ouvert. On
 * clique sur le rond des filtres. Trois choses partent dans le même
 * geste — le panneau du rayon se referme (donc la recherche de Lyon
 * part), le panneau des filtres s'ouvre, et la navigation commence. Le
 * temps qu'elle arrive, LE PANNEAU DES FILTRES A ÉTÉ DÉMONTÉ AVEC LE
 * RESTE, et il ne revient pas.
 *
 * LA CAUSE EST CONNUE ET DÉJÀ ÉCRITE (nº 508, et le §nº 364 juste sous
 * `filtresOuverts`) : « / » et « /accueil-recherche » sont DEUX
 * SEGMENTS DE ROUTE, et la barre est montée PAR LA PAGE. Au premier
 * passage de l'un à l'autre, tout l'arbre est démonté puis remonté ;
 * `filtresOuverts` repart de `false`. Le brouillon de la nº 364 avait
 * réglé le cas où c'étaient LES BADGES qui naviguaient ; ici la
 * navigation vient d'ailleurs — du panneau voisin — et le panneau des
 * filtres n'y peut rien.
 * ⚠️ LE VRAI REMÈDE SERAIT QUE LA BARRE NE SOIT PLUS DÉTRUITE (une mise
 * en page partagée aux deux segments). C'est un chantier à part, et il
 * n'est PAS commencé ici.
 *
 * ██ LE MOYEN EMPLOYÉ, ET POURQUOI IL EST SANS DANGER ██
 * UNE VARIABLE DE MODULE, DATÉE, CLÉE PAR MOTEUR. C'est exactement la
 * note de reprise de la nº 508 (`ChampLocalisation`), reprise ici pour
 * le panneau voisin — pas un mécanisme neuf.
 *  · ELLE NE SURVIT PAS À UN RECHARGEMENT ni à une nouvelle session :
 *    c'est de la mémoire vive du module, effacée avec lui. Ce n'est ni
 *    `localStorage`, ni `sessionStorage`, ni un cookie, ni l'adresse.
 *  · ELLE S'EFFACE DÈS QU'ELLE A SERVI (la lecture ne la consomme pas,
 *    pour survivre au double rendu du mode strict ; c'est l'effet de
 *    montage qui l'efface, juste avant d'en tenir compte).
 *  · ELLE EXPIRE SEULE si le remontage n'a pas lieu — quatre secondes,
 *    le même délai que la nº 508.
 *  · ⚠️ ELLE NE NOMME NI FICHIER NI VERSION, et c'est ce qui la sépare
 *    du mécanisme qui avait cassé le site aux nº 479 et nº 546 : là-bas
 *    un millésime mal lu entrait dans L'ADRESSE DU SERVICE WORKER, le
 *    navigateur croyait à un programme neuf, purgeait ses caches,
 *    prenait la main et rechargeait — en boucle. Ici, rien n'est mis en
 *    cache, rien n'est rechargé, aucune adresse n'est fabriquée : au
 *    pire un panneau s'ouvre une fois de trop, et se referme d'un clic.
 */
const REOUVERTURE_FILTRES_MS = 4000;
let reouvertureFiltresAttendue: { cle: string; pose: number } | null = null;

function noterLaReouvertureDesFiltres(cle: string) {
  reouvertureFiltresAttendue = { cle, pose: Date.now() };
}

function oublierLaReouvertureDesFiltres() {
  reouvertureFiltresAttendue = null;
}

/** La note est-elle pour ce moteur, et encore fraîche ? Elle n'est PAS
    consommée à la lecture : deux lectures rendent la même réponse. */
function reouvertureDesFiltresDue(cle: string): boolean {
  if (!reouvertureFiltresAttendue) return false;
  if (Date.now() - reouvertureFiltresAttendue.pose > REOUVERTURE_FILTRES_MS) {
    reouvertureFiltresAttendue = null;
    return false;
  }
  return reouvertureFiltresAttendue.cle === cle;
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
  //  §1 (nº 447) — LA « VUE » EST DEVENUE L'ONGLET DE NATURE
  //  (« tatouage » | « flash »), et chaque onglet a SON brouillon.
  const {
    ouverte: pageOuverte,
    vue: vuePage,
    brouillons,
  } = useSyncExternalStore(
    souscrireRecherche,
    lireRecherche,
    lireRechercheServeur
  );
  /** Le brouillon de l'onglet affiché — `null` tant qu'on n'y a rien
      posé (l'onglet part alors d'une page vierge, §1 nº 447). */
  const brouillon = brouillons[vuePage];
  /** Le panneau des interrupteurs (web, sous le bouton rond). */
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  /**
   * §2 (nº 569) — AU MONTAGE, ON REPREND CE QUI ÉTAIT OUVERT.
   * ------------------------------------------------------------------
   * La note est POSÉE PAR LE GESTE D'OUVERTURE (le rond des filtres,
   * plus bas) et EFFACÉE PAR TOUTE FERMETURE VOULUE — c'est le modèle
   * exact de la nº 508, et c'est ce qui évite le piège du démontage :
   * une note posée au démontage arriverait après coup, et une note liée
   * à l'état rouvrirait le panneau qu'on vient de refermer à la main.
   * Ici, seul un panneau ENCORE OUVERT quand l'arbre s'en va peut avoir
   * une note vivante.
   * ⚠️ ELLE EST EFFACÉE AVANT D'ÊTRE SUIVIE : elle ne vaut que pour ce
   * remontage-ci, et rien ne reste armé si la réouverture échoue.
   * ⚠️ LE VOILE SUIT TOUT SEUL — il est accroché à `filtresOuverts`
   * (`useVoileDeLaPage`, plus bas), donc il se repose avec le panneau.
   * ⚠️ RIEN N'EST ANNONCÉ : rouvrir un panneau ne change aucun critère,
   * donc aucune entrée d'historique ne s'ajoute à celle de la recherche
   * qui vient de partir.
   */
  useEffect(() => {
    if (!reouvertureDesFiltresDue(id)) return;
    oublierLaReouvertureDesFiltres();
    setFiltresOuverts(true);
  }, [id]);
  /**
   * ██ nº 364 — LE PANNEAU WEB TRAVAILLE SUR UN BROUILLON ██
   * ==================================================================
   * LA CAUSE, ET CE N'EST NI UN FOCUS PERDU NI UNE FERMETURE EXPLICITE.
   * Chaque badge appelait `annoncer` → `surChangement` → `chercher`
   * (EnTeteTatouage), c'est-à-dire `router.push("/?exclure=…")`. Or
   * DEPUIS LA nº 357, l'accueil nu est PRÉRENDU et l'accueil À REQUÊTE
   * est servi par le jumeau `/accueil-recherche` (réécriture du proxy) :
   * ce sont DEUX ROUTES. Le premier badge quitte donc « / » pour le
   * jumeau — et comme la barre est rendue PAR LA PAGE (page → Rendu
   * Accueil → IndexTatoueurs → EnTeteTatouage → ce moteur), tout ce
   * sous-arbre est DÉMONTÉ puis REMONTÉ : `filtresOuverts` repart de
   * `false`, et la fenêtre se referme. Un REMONTAGE, donc, provoqué par
   * une navigation — pas une perte de focus.
   *
   * LA CORRECTION, ET C'EST LE MOTIF QUI EXISTE DÉJÀ SUR MOBILE : tant
   * que la fenêtre est ouverte, les badges écrivent dans un BROUILLON
   * local ; à la fermeture, UNE seule annonce part avec l'état final.
   * Aucune navigation pendant que la fenêtre vit — donc aucun
   * remontage, donc elle reste ouverte.
   *
   * ⚠️ RÈGLE 332-§1, ET ELLE Y GAGNE : c'était UNE ENTRÉE D'HISTORIQUE
   * PAR BADGE (quatre badges = quatre appuis sur « précédent » pour
   * sortir). C'est désormais UNE SEULE entrée par ouverture de fenêtre.
   * ⚠️ RÈGLES 328/329 : l'état continue de vivre dans l'adresse — il y
   * arrive simplement à la fermeture, exactement comme le brouillon de
   * la page mobile attend « Valider ».
   * ⚠️ MOBILE INCHANGÉ : la page plein écran garde son propre brouillon
   * (`poserDansLeBrouillon`) et son bouton « Valider ».
   */
  const [filtresEnAttente, setFiltresEnAttente] = useState<string[] | null>(
    null
  );
  /** Combien de fois « Effacer » a été pressé — sert de clé au champ
      de localité pour le reconstruire à neuf (voir plus bas). */
  const [effacements, setEffacements] = useState(0);

  /**
   * ██ §3 (nº 564, ÉTENDU À LA VILLE nº 565) — LE PANNEAU DE LOCALITÉ
   * NE CHERCHE QU'EN SE REFERMANT ██
   * ==================================================================
   * LE DÉFAUT DE DÉPART (nº 564) : chaque pilule de rayon (10, 25, 50,
   * 100, 200 km) appelait `annoncer` sur-le-champ. Un clic = une
   * recherche = une mosaïque repeinte ; essayer trois paliers avant de
   * se décider en coûtait trois, et la page clignotait tant qu'on
   * n'avait pas refermé.
   * CE QUI RESTAIT (nº 565) : la nº 564 avait laissé LA VILLE partir
   * tout de suite. On choisissait Lyon, la mosaïque se refaisait
   * aussitôt — avant même d'avoir vu les pilules de rayon qui
   * s'ouvraient dessous. LE PROPRIÉTAIRE N'EN VEUT PLUS : la ville
   * attend la fermeture, exactement comme le rayon.
   *
   * LE REMÈDE, ET C'EST EXACTEMENT CELUI DE LA nº 364 pour le panneau
   * des filtres — pas un second mécanisme, le même, étendu au voisin
   * puis à son compagnon :
   *  · le clic écrit dans un BROUILLON (`lieuEnAttente`, `rayonEnAttente`) ;
   *  · l'affichage lit le brouillon, donc la ville et le palier choisis
   *    se voient tout de suite (c'est l'AFFICHAGE qui suit le clic) ;
   *  · LA FERMETURE ANNONCE, une seule fois, avec l'état final — d'où
   *    UNE SEULE entrée d'historique par recherche, jamais une par clic.
   *
   * ⚠️ POURQUOI UNE ENVELOPPE POUR LA VILLE (`{ valeur }`) et un simple
   * nombre pour le rayon : `null` est une VILLE VALABLE (« Partout »,
   * ce que rend la croix). Sans enveloppe, « pas de brouillon » et
   * « brouillon qui efface la ville » s'écriraient pareil, et la croix
   * ne serait jamais annoncée.
   *
   * QUAND LIT-ON LE BROUILLON ? Le panneau appartient au champ de
   * localité : c'est lui qui sait quand sa réponse est arrêtée, et il
   * le dit par `surFermeturePanneau` (§2 nº 564). Tous ses chemins de
   * fermeture y passent — clic dehors, Échap, croix, départ du champ,
   * démontage. On n'a donc aucune liste de gestes à tenir à jour ici,
   * et la ville hérite sans un mot de plus des cinq chemins déjà
   * éprouvés.
   * ⚠️ Y COMPRIS SANS FERMETURE (§1 nº 566) : la croix vit dans le
   * champ, pas dans le panneau ; cliquée alors que rien n'est ouvert,
   * elle appelle ce signal elle-même. Sans quoi le brouillon
   * « plus aucune ville » restait déposé sans jamais être lu, et la
   * mosaïque gardait sa ville effacée.
   *
   * ⚠️ POURQUOI UN COMPTEUR ET NON UN APPEL DIRECT. La fermeture est
   * annoncée pendant le nettoyage d'un effet DU CHAMP — donc avant que
   * le moteur ait fini le sien. Une fonction appelée là verrait les
   * critères d'un rendu en retard. Le compteur, lui, ne transporte
   * rien : il réveille un effet DU MOTEUR, qui lit les critères de SON
   * rendu — les plus frais qui soient.
   * ⚠️ ET LA CROIX NE PEUT PLUS RESSUSCITER LA VILLE (le risque nommé à
   * la nº 564) : depuis cette passe, le champ n'annonce plus RIEN de
   * lui-même — il ne fait que déposer un brouillon. Il n'y a donc plus
   * qu'un seul écrivain, cet effet-ci, et plus deux qui se croisent.
   *
   * ⚠️ TROIS SILENCES, ET AUCUN N'EST UN OUBLI :
   *  · aucun brouillon → ouvrir puis refermer ne relance rien ;
   *  · la même ville ET le même palier qu'avant → rien à dire, donc
   *    rien n'est dit (ni recherche, ni entrée d'historique) ;
   *  · plus de point de départ (ville effacée, région, pays) → un rayon
   *    autour de rien ne veut rien dire : ce brouillon-là est jeté, et
   *    la ville, elle, part quand même.
   */
  const [lieuEnAttente, setLieuEnAttente] = useState<{
    valeur: LieuTrouve | null;
  } | null>(null);
  const [rayonEnAttente, setRayonEnAttente] = useState<number | null>(null);
  /** Combien de fois le panneau de localité s'est refermé. Sa seule
      raison d'être : réveiller l'effet ci-dessous. */
  const [fermeturesDuLieu, setFermeturesDuLieu] = useState(0);
  /** §3 (nº 568, réduit nº 572) — LA PRISE SUR LE CHAMP : il y dépose
      « refermer » à chaque rendu, et `choisirUnLieu` la tire quand le
      lieu choisi n'ouvre aucun rayon. Voir `CommandesChampLocalisation`. */
  const commandesDuLieu = useRef<CommandesChampLocalisation | null>(null);
  useEffect(() => {
    if (fermeturesDuLieu === 0) return; // rien ne s'est encore refermé
    if (!lieuEnAttente && rayonEnAttente === null) return; // rien en attente
    const lieu = lieuEnAttente ? lieuEnAttente.valeur : criteres.lieu;
    //  Un rayon ne compte que s'il tourne autour d'un point : sinon on
    //  garde celui d'avant, qui redeviendra utile à la prochaine ville.
    const rayonKm = rayonApplicable(lieu)
      ? (rayonEnAttente ?? criteres.rayonKm)
      : criteres.rayonKm;
    setLieuEnAttente(null);
    setRayonEnAttente(null);
    const memeVille =
      (lieu?.identifiant ?? null) === (criteres.lieu?.identifiant ?? null);
    if (memeVille && rayonKm === criteres.rayonKm) return; // rien n'a changé
    surChangement({ ...criteres, lieu, rayonKm });
    //  LA FERMETURE SEULE DÉCLENCHE : `criteres` et les deux brouillons
    //  sont lus au moment où l'effet part, et ils sont frais par
    //  construction (voir « pourquoi un compteur » ci-dessus). Les
    //  mettre en dépendance ferait annoncer à chaque changement de
    //  critères — c'est-à-dire le défaut qu'on répare.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fermeturesDuLieu]);
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

  /**
   * ██ TEMPORAIRE (nº 610) — LA MESURE DES AIRS DU PANNEAU ██
   * ==================================================================
   * ELLE NE CORRIGE RIEN, ELLE RELÈVE. À la nº 609 j'ai mesuré 24,00 px
   * à gauche et 24,23 px à droite sur un BANC, et conclu que la rangée
   * TECHNIQUE était calée. La capture du propriétaire dit le contraire.
   * Le banc ne reproduit donc pas le panneau réel, et il n'y a qu'une
   * façon de savoir en quoi : mesurer LE VRAI PANNEAU, sur son écran.
   *
   * CE QU'ELLE RELÈVE, une ligne par valeur : la largeur du panneau,
   * son rembourrage intérieur des deux côtés, puis pour chaque rangée
   * l'air à gauche du premier badge, l'air à droite du dernier et la
   * largeur totale de la rangée — et enfin chaque badge, son libellé,
   * son état et sa largeur.
   *
   * ⚠️ AUCUN ÉTAT REACT (la méthode de la nº 562) : le relevé écrit
   * dans le journal de module de la sonde bascule, jamais dans un état.
   * Il ne provoque donc aucun rendu et ne peut pas déranger ce qu'il
   * observe.
   * ⚠️ RIEN SANS `?sonde-bascule=1` : `noter` sort immédiatement quand
   * la sonde n'est pas armée, et l'on ne mesure même pas avant de
   * l'avoir demandé.
   * ⚠️ DEUX RELEVÉS, PAS UNE BOUCLE : un à l'ouverture, un par
   * changement de badge — et rien entre les deux.
   * ⚠️ 260 ms D'ATTENTE, ET C'EST DÉLIBÉRÉ : la coche de la nº 606
   * s'ouvre en 200 ms. Mesurer plus tôt relèverait une largeur de
   * badge INTERMÉDIAIRE, c'est-à-dire un chiffre faux.
   *
   * POUR LA RETIRER : supprimer ce bloc, l'effet qui l'appelle juste
   * dessous, et l'attribut `data-rangee-badges` de BadgesCharte.
   */
  function releverLesAirsDuPanneau(quand: string): void {
    if (!sondeBasculeArmee()) return;
    const plaque = plaqueFiltres.current;
    if (!plaque) return;
    const px = (valeur: number) => `${valeur.toFixed(1)} px`;
    const boite = plaque.getBoundingClientRect();
    const robe = getComputedStyle(plaque);
    noter(`▓ PANNEAU DES FILTRES — ${quand}`);
    noter(`   largeur du panneau : ${px(boite.width)}`);
    noter(
      `   rembourrage intérieur : ${robe.paddingLeft} à gauche, ` +
        `${robe.paddingRight} à droite`
    );
    const rangees = plaque.querySelectorAll<HTMLElement>(
      "[data-rangee-badges]"
    );
    for (const rangee of rangees) {
      const titre = (
        rangee.previousElementSibling?.textContent ?? "(sans titre)"
      ).trim();
      const badges = Array.from(rangee.querySelectorAll("button"));
      if (badges.length === 0) continue;
      const premier = badges[0].getBoundingClientRect();
      const dernier = badges[badges.length - 1].getBoundingClientRect();
      noter(`   ── rangée « ${titre} », ${badges.length} badges`);
      noter(`      air à gauche du premier badge : ${px(premier.left - boite.left)}`);
      noter(`      air à droite du dernier badge : ${px(boite.right - dernier.right)}`);
      noter(`      largeur totale de la rangée : ${px(dernier.right - premier.left)}`);
      noter(`      hauteur de la rangée : ${px(rangee.getBoundingClientRect().height)}`);
      for (const badge of badges) {
        const allume = badge.getAttribute("aria-pressed") === "true";
        noter(
          `      badge « ${(badge.textContent ?? "").trim()} » ` +
            `${allume ? "allumé" : "éteint"} — ${px(badge.getBoundingClientRect().width)}`
        );
      }
    }
  }

  /*  TEMPORAIRE (nº 610) — QUAND LE RELEVÉ SE DÉCLENCHE : une fois à
      l'ouverture du panneau, une fois après chaque changement de
      badge. La fermeture remet le compteur à zéro pour que la
      prochaine ouverture soit bien annoncée comme telle. */
  const releveDejaFait = useRef(false);
  useEffect(() => {
    if (!filtresOuverts) {
      releveDejaFait.current = false;
      return;
    }
    const premier = !releveDejaFait.current;
    releveDejaFait.current = true;
    const minuteur = window.setTimeout(
      () =>
        releverLesAirsDuPanneau(
          premier ? "à l'ouverture" : "après un changement de badge"
        ),
      260
    );
    return () => window.clearTimeout(minuteur);
    //  `releverLesAirsDuPanneau` est recréée à chaque rendu et ne lit
    //  que des références : la mettre en dépendance relancerait le
    //  minuteur pour rien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtresOuverts, filtresEnAttente]);

  /*  nº 443 — LES DEUX RÉGLAGES DE MISE EN PAGE SONT SUPPRIMÉS : plus
      de disposition (une/deux colonnes) ni de vue photothèque (« sans
      texte ») — donc plus rien à lire ici. Les ronds de bascule des
      deux barres sont partis avec (voir les rangées plus bas). */

  /**
   * nº 364 — POSER UN BADGE DANS LE BROUILLON DU PANNEAU WEB.
   * Les badges ne changent QUE `exclure` (voir `basculerBadge`) : c'est
   * donc la seule chose que le brouillon retient.
   */
  function poserDansLePanneau(suivant: Partial<CritèresTatouage>) {
    setFiltresEnAttente(suivant.exclure ?? criteres.exclure);
  }

  /**
   * nº 364 — FERMER LE PANNEAU WEB, ET N'ANNONCER QU'ICI.
   * Tous les chemins de fermeture passent par cette fonction — la
   * croix n'existe pas sur ce panneau, il se ferme par le bouton rond,
   * par un clic ailleurs, par Échap, ou en touchant les champs de
   * recherche. TOUS APPLIQUENT : ce panneau n'a jamais eu de geste
   * d'abandon, et en inventer un silencieux ferait perdre des choix
   * sans le dire.
   * ⚠️ RIEN N'EST ANNONCÉ SI RIEN N'A CHANGÉ : ouvrir puis refermer la
   * fenêtre ne pousse aucune entrée d'historique et ne rejoue aucune
   * recherche.
   */
  function fermerLesFiltres() {
    //  §2 (nº 569) — une fermeture VOULUE annule la note de réouverture.
    oublierLaReouvertureDesFiltres();
    setFiltresOuverts(false);
    setFiltresEnAttente(null);
    if (!filtresEnAttente) return;
    const avant = [...criteres.exclure].sort().join(",");
    const apres = [...filtresEnAttente].sort().join(",");
    if (avant === apres) return;
    surChangement({ ...criteres, exclure: filtresEnAttente });
  }

  /*  LA VERSION FRAÎCHE DE LA FERMETURE, pour les écouteurs de
      document : ils sont posés une seule fois par ouverture, et
      appelleraient sinon la fermeture du rendu où ils ont été posés —
      celle d'un brouillon vide, qui n'annoncerait jamais rien. La
      référence est réécrite APRÈS chaque rendu (jamais pendant). */
  const fermerVive = useRef(fermerLesFiltres);
  useEffect(() => {
    fermerVive.current = fermerLesFiltres;
  });

  // Le panneau des filtres du web : Échap et clic ailleurs referment.
  useEffect(() => {
    if (!filtresOuverts) return;
    function auClic(evenement: MouseEvent) {
      const cible = evenement.target as Node;
      //  ⚠️ LA PLAQUE EST DANS LE CORPS DU DOCUMENT (nº 238-§3) : sans
      //  ce second test, chaque badge coché refermait le panneau.
      if (plaqueFiltres.current?.contains(cible)) return;
      if (!zoneFiltres.current?.contains(cible)) {
        //  nº 364 — LA FERMETURE ANNONCE : c'est ici que la recherche
        //  part, une seule fois, avec l'état final des badges.
        fermerVive.current();
      }
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermerVive.current();
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

  /** CE QUE L'ONGLET AFFICHE : son brouillon s'il en a un, une page
      VIERGE sinon (§1, nº 447 — l'onglet ensemencé à l'ouverture est
      celui de la nature en cours ; l'autre part de rien, jamais des
      critères du voisin). */
  const enFenetre = brouillon ?? criteresComplets();

  /** POSER UN CHOIX DANS LE BROUILLON DE L'ONGLET AFFICHÉ — aucune
      recherche déclenchée, rien d'écrit chez le voisin. */
  function poserDansLeBrouillon(suivant: Partial<CritèresTatouage>) {
    poserBrouillon({ ...(brouillon ?? criteresComplets()), ...suivant });
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

  /** « VALIDER » — LE SEUL GESTE QUI LANCE LA RECHERCHE sur mobile.
      §1 (nº 447) — IL NE VALIDE QUE L'ONGLET AFFICHÉ, ET LA RECHERCHE
      PORTE SA NATURE : valider depuis Réalisation cherche des
      réalisations, depuis Flash des flashs — même sans style choisi
      (la nature seule, « Toutes les réalisations » / « Tous les
      flashs »). Les critères du voisin ne partent jamais. */
  function validerLaPage() {
    const retenus = {
      ...(brouillon ?? criteresComplets()),
      nature: vuePage,
    };
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
    surChangement(retenus);
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

  /** « EFFACER » N'EFFACE QUE L'ONGLET AFFICHÉ (§1, nº 447) : son
      style, son lieu, son rayon ET ses filtres — l'onglet redevient
      une page vierge. Le voisin garde tous ses choix. Il ne CHERCHE
      toujours pas : rien ne bouge tant que « Valider » n'a pas été
      pressé. */
  function effacerLaVue() {
    setEffacements((n) => n + 1);
    poserBrouillon(criteresComplets());
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
   * « Technique » (Tebori · Handpoke · Machine, l'ordre nº 465) et « Rendu » (Noir et
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
    surPanneau = false,
    /** §1 (nº 448) — l'habillage ponctuel du groupe (voir GroupeBadges). */
    classeDeGroupe = ""
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
      <GroupeBadges
        key={groupe.groupe}
        titre={titre}
        idTitre={idTitre}
        classe={classeDeGroupe}
      >
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
      {/*  nº 444 — LES BLOCS « ARTISTE » (groupe `mode`) ET « LIEU »
           (groupe `type`) SONT SUPPRIMÉS, titres et choix, dans les
           DEUX volets (le panneau web et la page mobile lisent ce même
           bloc). Il reste TECHNIQUE puis RENDU, au caractère près —
           l'espacement se recompose tout seul : il est porté par
           chaque groupe SAUF LE PREMIER (`fieldset + fieldset`,
           nº 166-§3), donc TECHNIQUE devient le premier sans marge
           haute et RENDU garde la sienne, exactement comme LIEU et
           RENDU se comportaient hier.
           Leurs slugs restent connus de la base et des adresses : la
           garde des vieux liens vit dans `filtresVivants`
           (config/tatouage), appelée par `criteresComplets` ici même
           et par `filtresConnus` au serveur. */}
      {groupeDeBadges(
        parGroupe.get("technique")!,
        "Technique",
        valeurs,
        poser,
        surPanneau
      )}
      {/*  §1 (nº 448) — L'AIR AU-DESSUS DE « RENDU », AU DOIGT : 8 px
           de rembourrage haut qui S'AJOUTENT aux 16 px d'espacement
           entre groupes portés par le conteneur — un padding et non
           une marge, précisément pour ne jamais entrer en conflit de
           cascade avec le `mt-4` du sélecteur d'enfants.
           §4-c (nº 473) — ET LE WEB L'A AUSSI : la variante `mobile:`
           tombe, la classe vaut désormais partout. Le DOIGT NE CHANGE
           PAS D'UN PIXEL (c'étaient déjà ses 8 px, et un padding ne se
           cumule pas avec lui-même) ; le panneau de l'ordinateur passe
           de 16 à 24 px au-dessus de « RENDU ». */}
      {groupeDeBadges(
        parGroupe.get("rendu")!,
        "Rendu",
        valeurs,
        poser,
        surPanneau,
        "pt-2"
      )}
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

  /**
   * §1 (nº 447) — LES OPTIONS D'UN SEUL ONGLET (page mobile).
   * ------------------------------------------------------------------
   * Même matière que `options` ci-dessus — les catégories du
   * catalogue, les mêmes comptes — mais SANS les portes
   * Réalisations/Flashs : l'onglet a déjà choisi la nature, le menu
   * liste donc DIRECTEMENT « Tous les … » puis les styles (aucun
   * `groupe` → aucune porte, voir lib/repli-menu §2 nº 304), et la
   * famille « Cultures du monde » garde sa porte telle quelle
   * (`sousGroupe`, une vraie porte). Aucune option ajoutée ni
   * retirée : ce sont celles de la catégorie, à l'identique — seules
   * les portes de section ont disparu, avec le besoin de choisir la
   * nature dans le menu.
   */
  const optionsDeLOnglet = (nature: VueRecherche) => {
    const categorie = CATEGORIES_EXPLORER.find((c) => c.nature === nature)!;
    return [
      {
        value: valeurExplorer(categorie.nature, ""),
        label: categorie.tous,
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
                compte: compteStyle(categorie.nature, entree.slug),
              },
            ]
          : entree.styles.map((style) => ({
              value: valeurExplorer(categorie.nature, style.slug),
              label: style.label,
              sousGroupe: entree.label,
              compte: compteStyle(categorie.nature, style.slug),
            }))
      ),
    ];
  };

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
  /** §3 (nº 565) — LA VILLE ET LE PALIER QUE L'ON MONTRE : le brouillon
      s'il y en a un, la recherche en cours sinon. C'est la seule chose
      qui suit le clic ; la recherche, elle, attend la fermeture.
      ⚠️ C'EST `lieuAffiche` QUI COMMANDE LES PILULES, et c'est ce qui
      garde l'acquis nº 508 : choisir une ville fait apparaître ses
      rayons SUR-LE-CHAMP, alors même que la recherche, elle, attend. */
  const lieuAffiche = lieuEnAttente ? lieuEnAttente.valeur : criteres.lieu;
  const rayonActif = rayonApplicable(lieuAffiche);
  const rayonAffiche = rayonEnAttente ?? criteres.rayonKm;

  /**
   * ██ §3 (nº 568) — UN LIEU SANS RAYON N'A RIEN À FAIRE ATTENDRE ██
   * ==================================================================
   * LE DÉFAUT : choisir « France » n'ouvrait aucun pied — un pays n'a
   * pas de rayon (`rayonApplicable`). Le panneau restait donc ouvert et
   * VIDE, avec son voile, et il n'y avait RIEN À VALIDER : il fallait
   * cliquer à côté pour que la recherche parte.
   *
   * LES NIVEAUX, ET CELUI QUE JE RETIENS. Un lieu en a quatre :
   * `adresse`, `ville`, `region`, `pays`. Les deux premiers portent un
   * rayon, les deux derniers non — une région ou un pays se cherchent
   * EN ENTIER (25 km autour du centre de la France ne couvrent presque
   * rien, c'était le bug de la nº 118). LA RÈGLE RETENUE N'EST DONC PAS
   * « un pays » MAIS « pas de rayon » : elle s'écrit avec le prédicat
   * qui existe déjà, `rayonApplicable`, et région comme pays en
   * bénéficient. Si un jour un niveau change de camp, les deux suivent
   * ensemble — il n'y a pas deux listes à tenir d'accord.
   *
   * CE QUE FAIT LA BRANCHE : elle jette les brouillons, referme, et
   * annonce sur-le-champ. UNE recherche, UNE entrée d'historique — la
   * fermeture qui suit réveille l'effet du §3, qui trouve les brouillons
   * vides et se tait (c'est le même verrou que « Valider », nº 567).
   * ⚠️ JETER LES BROUILLONS EST OBLIGATOIRE, pas une politesse : la
   * frappe qui a précédé a déposé « plus aucune ville » (nº 563-565).
   * Sans ce nettoyage, l'effet de fermeture annoncerait ce `null`
   * APRÈS notre annonce, et effacerait le pays qu'on vient de choisir.
   * ⚠️ ON N'ANNONCE PAS SI LE LIEU N'A PAS CHANGÉ : le retour d'une
   * saisie abandonnée (`restaurerSiAbandon`) repasse par cette même
   * porte avec le lieu d'avant. Sans cette garde, quitter le champ
   * pousserait une entrée d'historique pour rien.
   * ⚠️ UNE VILLE NE CHANGE EN RIEN : elle passe par le brouillon, ses
   * pilules s'ouvrent, et la recherche attend « Valider » ou la
   * fermeture (acquis nº 564-567).
   */
  function choisirUnLieu(choisi: LieuTrouve | null) {
    if (choisi && !rayonApplicable(choisi)) {
      setLieuEnAttente(null);
      setRayonEnAttente(null);
      commandesDuLieu.current?.fermerLePanneau();
      if (choisi.identifiant !== criteres.lieu?.identifiant) {
        surChangement({ ...criteres, lieu: choisi });
      }
      return;
    }
    setLieuEnAttente({ valeur: choisi });
  }

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
    //  rien à recopier : aucun fond rose, aucun contour, un repos qui
    //  se voit, et l'écart titre → première rangée de 10 px, celui
    //  d'ARTISTE. (Le point qui disait l'état à gauche du mot a été
    //  supprimé À LA SOURCE par la nº 605 : ces badges-ci l'ont perdu
    //  du même geste, sans qu'une ligne bouge ici.)
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
            actif={palier === rayonAffiche}
            //  ⚠️ SUR PANNEAU (nº 179-§1) : la fenêtre du rayon a pris
            //  le fond du panneau des filtres (`eleve`). Ce qui est
            //  POSÉ dessus grimpe d'autant — exactement la règle de la
            //  nº 144-§3, et la même robe que les badges des filtres.
            surPanneau
            //  `preventDefault` : le champ garde le focus, le panneau
            //  reste ouvert — on peut ajuster plusieurs fois.
            //  §3 (nº 564) — ET AJUSTER NE CHERCHE PLUS : le clic pose
            //  le palier dans le brouillon, la fermeture l'annonce.
            onPointerDown={(evenement) => {
              evenement.preventDefault();
              setRayonEnAttente(palier);
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
            placeholder="Choose a style"
            //  §2 (nº 258) — LA HAUTEUR DES CERCLES (46 px, relevée
            //  sur les deux ronds voisins — jamais choisie) : le bloc
            //  était plus haut que tout ce qui l'entoure.
            hauteur="min-h-[46px]"
            taillePolice="text-base"
            sansBordure
            sombre
            repliable
            //  §1 (nº 648) — LA FLÈCHE DE CE CHAMP-CI NE VIRE PLUS AU
            //  ROSE À L'OUVERTURE. C'est le champ « Style » du moteur
            //  principal, CÔTÉ WEB : le champ du doigt est un autre
            //  appel, plus bas dans ce fichier, et il ne porte pas ce
            //  drapeau — sa flèche reste rose, comme avant.
            flecheFigee
            //  §2 (nº 290) — le trait rose sous « Cultures du monde » :
            //  le menu des styles du MOTEUR PRINCIPAL, côté web.
            familleSoulignee
            //  §2 (nº 293) — la page s'assombrit derrière ce menu (web).
            avecVoile
            //  §1 (nº 571) — « Réalisations » et « Flash » restent en
            //  haut du panneau pendant que leurs styles défilent. ICI
            //  SEULEMENT : ni le menu jumeau du doigt (qui sépare les
            //  deux en va-et-vient), ni aucun autre menu du site.
            entetesCollants
            //  §3 (nº 573) — la page ne défile plus derrière ce menu.
            //  ICI SEULEMENT : au doigt, la page de recherche a besoin
            //  que le document défile (la remontée du champ).
            verrouilleLaPage
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
            //  §3 (nº 564, étendu nº 565) — LE SUFFIXE SUIT LE
            //  BROUILLON, LUI AUSSI : le champ écrit « Lyon · 50 km »
            //  dès le clic sur la pilule, et il l'écrit MÊME SI LA
            //  RECHERCHE N'A PAS ENCORE VU LYON. Le laisser sur les
            //  critères aurait été le même défaut en miniature — le
            //  panneau à jour, le champ en retard, juste au-dessus.
            suffixeLieu={suffixeRayon({
              ...criteres,
              lieu: lieuAffiche,
              rayonKm: rayonAffiche,
            })}
            //  §3 (nº 565) — LA VILLE VA AU BROUILLON, ELLE AUSSI. Le
            //  champ continue d'afficher ce qu'on a choisi (il tient son
            //  propre texte) ; c'est la RECHERCHE qui attend la
            //  fermeture, comme le rayon depuis la nº 564.
            //  §3 (nº 568) — SAUF QUAND IL N'Y A RIEN À RÉGLER : voir
            //  `choisirUnLieu`, plus haut.
            surChoix={choisirUnLieu}
            sansBordure
            compact
            piedPanneau={piedRayon}
            garderOuvertApresChoix
            //  §3 (nº 568) — LA PRISE DONT `choisirUnLieu` A BESOIN :
            //  un pays ou une région n'ouvre aucun rayon, il n'y a donc
            //  rien à régler et le panneau doit se refermer seul.
            commandesDuChamp={commandesDuLieu}
            //  §3 (nº 564) — LA FERMETURE ANNONCE LE RAYON. Le champ
            //  sait quand son panneau se referme ; le moteur, non.
            surFermeturePanneau={() => setFermeturesDuLieu((n) => n + 1)}
          />
        }
      />
    );
  }

  return (
    <div className="w-full">
      {/* ---------- APPAREILS À SOURIS (toute largeur) ----------
          L'encadré épuré, et à sa droite le BOUTON DES FILTRES : sa
          boîte fait toujours 46 px (un peu moins que les 52 px de
          l'encadré), mais son cercle gris est parti à la nº 470 —
          l'icône y est NUE, au rang 28 de la barre.
          `mobile:hidden` : la bascule se fait PAR APPAREIL, plus
          jamais par largeur de fenêtre. Retiré tant que la page de
          recherche est ouverte : un seul moteur vivant à la fois. */}
      {!pageOuverte && (
        <div
          ref={zoneFiltres}
          //  §2 (nº 258) — LA BARRE NE CHANGE PAS SUR LE WEB : la
          //  rangée garde sa zone de 52 px et y CENTRE l'encadré
          //  descendu à 46 (items-center, déjà là).
          //  ██ §4 (nº 449, resserré §1 nº 450) — LE PÉRIMÈTRE QUE LE
          //  VOILE ÉPARGNE, LES TROIS SENS CONFONDUS (menu des styles,
          //  panneau de filtres, liste de localité) : cette rangée.
          //  §1 (nº 450) — MAIS PLUS EN UN SEUL RECTANGLE : le voile
          //  épargne désormais CHAQUE ÉLÉMENT marqué dedans, avec ses
          //  propres arrondis lus au style calculé — l'encadré
          //  (data-encadre-barre, 12 px) et le bouton rond
          //  (data-voile-element, un cercle) — et l'air entre les deux
          //  est assombri comme le reste de la page. L'attribut
          //  data-voile-rayons de la nº 449 est parti avec le trou
          //  unique : plus rien à déclarer à la main.
          data-voile-epargne=""
          className="relative flex mobile:hidden items-center gap-2.5 min-h-[52px]"
        >
          {/* OUVRIR LE STYLE OU LA LOCALITÉ FERME LE PANNEAU DES
              FILTRES : un seul volet vivant à la fois. En capture,
              pour agir avant même que le menu ne s'ouvre — et
              `onFocusCapture` couvre l'arrivée au clavier. */}
          <div
            className="flex-1 min-w-0"
            //  nº 364 — toucher les champs referme LE PANNEAU, et la
            //  fermeture annonce (rien si aucun badge n'a bougé).
            onPointerDownCapture={() => fermerLesFiltres()}
            onFocusCapture={() => fermerLesFiltres()}
          >
            {encadreChamps(id)}
          </div>
          <button
            ref={boutonFiltres}
            type="button"
            //  §1 (nº 450) — un ÉLÉMENT ÉPARGNÉ PAR LE VOILE, à part
            //  entière : la découpe épouse son cercle (le rayon est lu
            //  au style calculé, borné à la demi-hauteur).
            data-voile-element=""
            //  nº 364 — le même bouton ouvre et ferme ; la FERMETURE
            //  est celle qui annonce (voir `fermerLesFiltres`).
            //  §2 (nº 569) — ET L'OUVERTURE POSE LA NOTE : si l'arbre
            //  est démonté dans les quatre secondes (le passage de « / »
            //  au jumeau, déclenché ici même par la fermeture du panneau
            //  voisin), le moteur neuf rouvrira ce panneau. Toute
            //  fermeture voulue l'annule — donc un panneau refermé à la
            //  main ne peut pas revenir.
            onClick={() => {
              if (filtresOuverts) {
                fermerLesFiltres();
                return;
              }
              noterLaReouvertureDesFiltres(id);
              setFiltresOuverts(true);
            }}
            aria-expanded={filtresOuverts}
            aria-label="Filtres"
            title="Filtres"
            /*  ██ §2 (nº 470) — LE CERCLE GRIS EST SUPPRIMÉ, L'ICÔNE
                PREND L'ÉCHELLE DE LA BARRE ██
                CE QU'IL PORTAIT, ET QUI PART : le fond de
                `[data-clair-barre]` (nº 174-§1) — le disque gris au
                repos — et son cran d'éclaircissement `data-clair-vif`
                quand le panneau était ouvert (nº 144-§2/150-§2). Le
                propriétaire n'en veut plus : L'ICÔNE EST NUE, comme le
                fanion, le globe et la silhouette de la barre fixe.
                ELLE EN PREND DONC L'ÉCRITURE EXACTE — `ETATS_ROND_BARRE`
                (components/Icones) : rien au repos, le rond gris et le
                rose SEULEMENT au survol et à l'appui. Aucun contour,
                aucune bordure ne remplace le cercle : la charte
                l'interdit, et il n'y a rien à remplacer.
                LE GLYPHE : 20 → 28 px, le rang des trois icônes de la
                barre depuis la nº 461 — l'équilibre demandé.
                LA CIBLE NE RÉTRÉCIT PAS : la boîte reste 46 × 46
                (`w-[46px] h-[46px]`, la valeur de la nº 258-§2), le
                `rounded-full` reste — il dessine le rond du survol et
                la découpe du voile. Position, hauteur du moteur et
                voisinage : pas un pixel.
                CE QUI DIT « OUVERT » MAINTENANT : le panneau lui-même,
                et le voile de la nº 450 qui assombrit tout SAUF ce
                bouton (`data-voile-element`, conservé). `aria-expanded`
                le dit aux lecteurs d'écran — la règle nº 155-§5A, déjà
                appliquée au menu du compte : l'œil voit la fenêtre,
                l'indicateur ne disait rien de plus.
                ⚠️ LE DOIGT NE CHANGE PAS : cette rangée est
                `mobile:hidden` (voir son conteneur).

                ██ §3 (nº 507) — LE CERCLE RESTE TANT QUE LE PANNEAU
                EST OUVERT ██
                LE DÉFAUT, tel que le propriétaire le voit : on survole
                le bouton, le cercle gris paraît ; on clique, le panneau
                s'ouvre — ET LE CERCLE DISPARAÎT SOUS LE POINTEUR QUI
                N'A PAS BOUGÉ. La cause : ce cercle n'était QU'UN
                SURVOL, et le voile de la nº 450 est une surface posée
                par-dessus la page — le pointeur survole LE VOILE, plus
                le bouton, et `:hover` s'éteint. Le paragraphe ci-dessus
                disait « le panneau lui-même » : ça ne suffit pas, le
                bouton perdait toute marque au moment précis où il en
                fallait une.
                LE REMÈDE : un fond POSÉ, pas un survol, tant que
                `filtresOuverts`. La valeur est CELLE DU SURVOL —
                `bg-sombre-eleve`, le jeton de `ETATS_ROND_BARRE` : le
                cercle ne change pas de couleur en s'ouvrant, il RESTE.
                ⚠️ LES DEUX ÉTATS SONT EXCLUSIFS (règle nº 389) : ouvert,
                le fond posé ; fermé, les états de survol et d'appui.
                Jamais les deux.
                ⚠️ ET LE GLYPHE NE CHANGE PAS DE COULEUR : `text-sombre-texte`
                au repos comme ouvert — le rose du survol a quitté la
                barre entière à la nº 507-§2. */
            className={`relative shrink-0 w-[46px] h-[46px] rounded-full
                       ${filtresOuverts ? "bg-sombre-eleve" : ETATS_ROND_BARRE}
                       text-sombre-texte
                       flex items-center justify-center transition-colors`}
          >
            <IconeReglages taille={28} />
          </button>

          {/*  nº 443 — LE ROND « SANS TEXTE » (BoutonPhototheque) EST
               SUPPRIMÉ de la barre web : toutes les mises en page de
               l'ordinateur affichent le texte des cartes. Le champ et
               le bouton de filtres ne bougent pas d'un pixel. */}

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
            /*  ██ §4 (nº 473) — LES TROIS RÉGLAGES DU PANNEAU WEB ██
                 (a) LA MARGE DROITE ÉNORME, cause nommée : `largeur`
                 était une CONSIGNE — 420 px posés en dur sur le
                 panneau (`width`, MenuDeVerre) — alors que les badges
                 (« Tebori », « Machine », « Couleur »…) en occupent
                 bien moins. Le panneau étant aligné à DROITE, tout le
                 vide se retrouvait entre le dernier badge et le bord
                 droit, contre un `px-5` régulier à gauche. Avec
                 `largeurAuContenu`, les 420 devenaient un PLAFOND : la
                 boîte épousait les badges, et les deux marges valaient
                 exactement le rembourrage — le même à gauche et à
                 droite, par construction.
                 ██ §2 (nº 607) — CE DRAPEAU EST RETIRÉ, ET VOICI
                 POURQUOI. Il supposait des badges de largeur FIXE :
                 c'était vrai tant que leur point réservait sa place
                 dans les deux états. La nº 606 y a posé une coche qui
                 n'existe qu'à l'état allumé — chaque badge allumé
                 gagne dix-sept pixels —, si bien qu'une boîte réglée
                 sur son contenu CHANGEAIT DE LARGEUR à chaque clic.
                 LA LARGEUR REDEVIENT DONC FIXE, ET ELLE EST MESURÉE.
                 ██ §1 (nº 608) — LA VALEUR EST CORRIGÉE : 398, ET NON
                 372. Le premier chiffre venait d'une mesure FAUSSE, et
                 il vaut mieux dire laquelle : j'avais relevé la
                 largeur du panneau tout allumé alors qu'il vivait
                 encore en `max-content` SOUS UN PLAFOND DE 420 — donc
                 déjà replié. J'ai pris pour la largeur naturelle du
                 contenu ce qui était la largeur d'un contenu contraint.
                 CE QUE 372 PRODUISAIT, mesuré sur les soixante-quatre
                 combinaisons de badges : le panneau prenait TROIS
                 hauteurs — 175 px sans repli, 221 px avec une rangée
                 repliée, 267 px avec deux. Chaque clic pouvait donc
                 faire sauter la plaque de quarante-six pixels, et
                 pendant les 200 ms où la coche s'ouvre, le repli
                 basculait parfois en cours de route : c'est le
                 clignotement que le propriétaire a vu.
                 398 était alors la plus petite largeur qui ne repliât
                 jamais aucune rangée — sur un BANC.
                 ██ §1 (nº 611) — 372, ET CETTE FOIS SUR L'ÉCRAN DU
                 PROPRIÉTAIRE ██
                 -----------------------------------------------------
                 MES DEUX BANCS ONT MENTI, dans les deux sens : celui
                 de la nº 607 rendait la rangée trop étroite, celui de
                 la nº 608 trop large — de vingt-six pixels. La mesure
                 posée à la nº 610 (`releverLesAirsDuPanneau`, plus
                 haut dans ce fichier) a tranché sur le VRAI panneau,
                 tous badges allumés :
                   · rangée TECHNIQUE — 323,5 px, air 24,0 à gauche et
                     50,5 à droite ; Tebori 88,7 · Handpoke 114,6 ·
                     Machine 104,1, plus deux écarts de 8 ;
                   · rangée RENDU — 312,7 px, air 24,0 et 61,3 ;
                   · les deux rangées à 38 px de haut : à 398, rien ne
                     se repliait — le vide était bien du vide.
                 D'OÙ LA VALEUR : 24 + 323,5 + 24 = 371,5, arrondi au
                 pixel supérieur. L'air à droite de « Machine » rejoint
                 celui de gauche de « Tebori ».
                 ⚠️ ET AUCUNE RANGÉE NE PEUT SE REPLIER, ce qui se
                 démontre sans banc : TECHNIQUE tous badges allumés est
                 le contenu le plus large possible (éteindre un badge
                 le rétrécit de dix-sept pixels, et RENDU est plus
                 courte de onze). 323,5 tient dans les 324 px utiles
                 que laissent 372 moins les deux rembourrages.
                 ⚠️ IL RESTE UN DEMI-PIXEL DE MARGE, ET IL FAUT LE
                 SAVOIR : c'est le prix d'un air exactement égal des
                 deux côtés. Un zoom de navigateur, une police de repli
                 qui s'installerait à la place de Geist, ou un libellé
                 rallongé d'un caractère, et la rangée se replierait —
                 le clignotement de la nº 607 reviendrait. La mesure de
                 la nº 610 reste en place précisément pour qu'on puisse
                 le constater plutôt que le supposer.
                 ⚠️ AUCUN DÉBORDEMENT POSSIBLE : ce panneau n'existe
                 qu'au-dessus du cran web, donc sur 1024 px de fenêtre
                 au moins — 372 plus ses marges en occupent le tiers.
                 (b) L'AIR INTÉRIEUR MONTE D'UN CRAN : 20 px → 24 px
                 (`p-5` → `p-6`, le cran des fenêtres de la charte —
                 en-têtes de Notifications et des langues). Le haut
                 garde sa compensation de la nº 163-§3A : le titre
                 « TECHNIQUE » est du texte nu dont la boîte de ligne
                 pose ~5 px d'air invisible au-dessus de l'encre —
                 24 − 5 = 19 px déclarés pour 24 px vus, comme les
                 trois autres côtés.
                 ⚠️ LE DOIGT NE CHANGE PAS : sa feuille est montée
                 ailleurs (la page mobile), avec ses propres marges et
                 son décollement des bords (nº 460).
                 ⚠️ LE CALAGE SUR L'ANCRE TIENT (nº 462) : le bord
                 d'alignement reste le bord DROIT du bouton — c'est lui
                 qui est ancré, la largeur se déduit ensuite. */
            <MenuDeVerre
              ouvert={filtresOuverts}
              ancre={boutonFiltres}
              refPanneau={plaqueFiltres}
              largeur={372}
              //  §1 (nº 543) — FOND OPAQUE au jeton `carte` : le drapeau
              //  de la nº 537, la teinte de la nº 542. Des quatre
              //  fenêtres de cette passe, celle-ci est la SEULE qui
              //  passait déjà par `MenuDeVerre` — un mot suffit.
              //  Ni sa place, ni sa largeur, ni son alignement ne
              //  changent. Ses badges n'ont AUCUN fond (la robe
              //  « sur panneau », BadgesCharte) : ils ne perdent donc
              //  pas un cran d'écart, seuls leurs textes suivent.
              opaque
              alignement="droite"
              data-panneau-filtres=""
              data-source-fichier="src/components/MoteurTatouage.tsx"
              data-source-composant="MoteurTatouage · panneau web des filtres"
              className="px-6 pb-6 pt-[19px]"
            >
              {/*  nº 364 — LE PANNEAU LIT SON BROUILLON, et n'annonce
                   rien : `poserDansLePanneau` retient, `fermerLesFiltres`
                   annonce. Sans brouillon en cours, il montre les vrais
                   critères — l'ouverture est donc toujours juste. */}
              {blocFiltres(
                filtresEnAttente
                  ? { ...criteres, exclure: filtresEnAttente }
                  : criteres,
                poserDansLePanneau,
                true
              )}
            </MenuDeVerre>
          )}
        </div>
      )}

      {/* ---------- VRAIS MOBILES (tactile) ----------
          UNE SEULE LIGNE, pleine largeur : la loupe à gauche, puis
          « style · localité » — tronqué d'un seul tenant s'il déborde. */}
      {/* LA RANGÉE DE LA BARRE (vrais mobiles) : la pilule de
          recherche, SEULE depuis la nº 443 — les deux ronds de mise en
          page (disposition une/deux, vue « sans texte ») sont
          supprimés, et la pilule (`flex-1`) se prolonge d'elle-même
          dans tout l'espace libéré.
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
          {/*  nº 443 — LE TITRE VISIBLE CHANGE : « Find your tattoo
               style… » (l'anglais est un choix du propriétaire, mobile
               uniquement — cette pilule ne vit que dans la rangée du
               doigt). La pilule reste une PORTE (nº 140), pas un
               résumé ; l'aria-label garde le détail en français : un
               lecteur d'écran ne voit pas le titre de la mosaïque à
               côté. */}
          <IconeLoupe taille={18} classe="shrink-0 text-sombre-texte-doux" />
          <span
            aria-hidden="true"
            className="min-w-0 flex-1 truncate text-[15px] leading-tight
                       font-semibold text-sombre-texte"
          >
            Find your tattoo style…
          </span>
        </button>

        {/*  nº 443 — LES DEUX RONDS DE MISE EN PAGE SONT SUPPRIMÉS :
             le bouton de DISPOSITION (une image par ligne ↔ deux
             colonnes) et le rond de la VUE PHOTOTHÈQUE (« sans
             texte »). Une seule mise en page subsiste — les cartes
             côte à côte avec leur texte — et la pilule ci-dessus
             (`flex-1`) occupe désormais toute la largeur de la rangée.
             Leur mécanique est neutralisée à la source
             (lib/disposition-grille, lib/vue-phototheque) : un vieux
             lien ou une vieille mémoire retombe sur la mise en page
             standard, sans casse. */}
      </div>
      )}

      {pageOuverte && (
        /*  §1 (nº 447) — LES DEUX ONGLETS « Réalisation | Flash » : la
            MÊME présentation dans chacun (style, localité, rayon, puis
            les blocs Technique et Rendu), chacun ses critères. L'ancien
            panneau « Filtres » séparé a disparu — ses blocs vivent
            dans chaque onglet, en dessous du rayon. */
        <PageRechercheMobile
          vue={vuePage}
          surVue={poserVueRecherche}
          onValider={validerLaPage}
          onAbandonner={abandonnerLaPage}
          onEffacer={effacerLaVue}
        >
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
              //  §1 (nº 447) — UN MENU PAR ONGLET : changer d'onglet
              //  reconstruit le menu à neuf (état d'ouverture et replis
              //  compris) sur LES OPTIONS DE SA NATURE.
              key={`${id}-style-${vuePage}`}
              valeur={valeurExplorer(enFenetre.nature, enFenetre.style)}
              surChangement={(valeur) =>
                choisirDansExplorer(valeur, poserDansLeBrouillon)
              }
              onOuvertureChange={surOuvertureExplorer}
              options={optionsDeLOnglet(vuePage)}
              //  §3 (nº 303) — le même mot qu'en web : « Style ».
              ariaLabel="Style"
              placeholder="Choose a style"
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
              //  §1 (nº 447) — ET L'ONGLET AUSSI : chaque onglet a SON
              //  lieu — changer d'onglet reconstruit le champ sur le
              //  lieu du brouillon affiché.
              key={`${id}-fenetre-lieu-${vuePage}-${effacements}`}
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

          {/* 4. LES FILTRES — §1 (nº 447) : Technique puis Rendu, EN
              DESSOUS du rayon, DANS CHAQUE ONGLET. C'est le même
              `blocFiltres` que le panneau du web (une seule écriture,
              nº 149-§6) ; il écrit dans le brouillon de l'onglet
              affiché, et « Valider » emporte le tout d'un coup.
              L'ancien panneau « Filtres » séparé n'existe plus. */}
          {blocFiltres(enFenetre, poserDansLeBrouillon)}
          </>
        </PageRechercheMobile>
      )}
    </div>
  );
}
