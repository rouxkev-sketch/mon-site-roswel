"use client";

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
//  §1 (nº 873) — le glissement latéral d'une page publique NAVIGUE vers
//  la page voisine (les onglets sont des liens) : il lui faut le routeur.
import { useRouter } from "next/navigation";
import {
  defilerEnDouceur,
  defilerSansGeste,
} from "@/lib/defilement-programme";
//  §2 (nº 527) — le glissement horizontal qui change d'onglet, posé
//  sur Ma sélection à la nº 526 : c'est LE MÊME module, second
//  branchement (une fiche n'a pas de boîte à lui donner).
import { useGlissementLateralSurLaPage } from "@/lib/glissement-lateral";
import {
  //  §1 (nº 386) — `ARRONDI_ETIQUETTE` et `ECRITURE_TITRE_SECTION`
  //  sont partis avec la section « Pratique » : plus une seule
  //  capsule ni un seul titre de section dans ce fichier.
  libelleFiltre,
  libelleStyle,
  //  §2 (nº 458) — la marque, pour la fenêtre de partage du profil.
  MARQUE_YOKOFOLIO,
  PORTRAIT_ROND,
  TRAIT_SEPARATION,
  ROBE_BADGE_CONTOUR,
} from "@/config/tatouage";
//  §2 (nº 458) — la ville lisible partout, pour le partage du profil.
import { villeAffichee } from "@/lib/adresse";
import { BoutonHorsLigne } from "@/components/BoutonHorsLigne";
//  §3 (nº 869) — le partage du PROFIL est UNE DES QUATRE cibles de la
//  rangée d'actions : le MÊME bouton que partout (l'action existante),
//  en habillage « rangee » — le petit badge, icône seule (nº 870-§4).
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
//  §4 (nº 870) — l'icône d'Instagram, celle du pied de page (nº 240),
//  dans le badge de la rangée ; §2 — LE CALENDRIER revient avec la
//  ligne du booking ; §3 — `IconeDuLien` rouvre la ligne du site.
import {
  IconeCalendrier,
  IconeDuLien,
  IconeInstagram,
} from "@/components/IconeReseau";
//  §2 (nº 490) — la flèche du compteur « +N ⌄ » : CELLE DES HORAIRES,
//  au même rang 16 et pivotée de la même façon. Aucun dessin nouveau.
//  §3 (nº 870) — le GLOBE de la nº 869 n'a plus de lecteur : le site
//  retrouve sa ligne et son maillon (`IconeDuLien`, nº 240).
import { IconeChevronBas } from "@/components/Icones";
//  §3 (nº 869) — la cible carrée et le mot dessous : l'écriture unique
//  des quatre actions de la rangée (Follow et Share la lisent chez eux).
import { ActionDeFiche } from "@/components/ActionDeFiche";
import { BoutonSuivre } from "@/components/BoutonSuivre";
import {
  categorieDeLaVue,
  galeriesDuPortfolio,
  SelecteurOngletAffiche,
  type SerieChoisie,
} from "@/components/PortfolioDeLAffiche";
//  §3 (nº 873) — au doigt, les pages Portfolio et Flash SONT le fil de
//  galeries ; §4 — une page sans photo montre l'écran vide du site.
//  §3 (nº 876) — et au web aussi : le fil est la présentation des deux
//  appareils, les bandes par style ont disparu (code compris).
import { FilDeGalerie } from "@/components/FilDeGalerie";
import { EcranVideSelection } from "@/components/EcranVideSelection";
import { capsulesPratiques } from "@/lib/pratique-fiche";
//  §3 (nº 388) — l'écriture d'une ligne de profil a déménagé dans un
//  module sans dépendance : l'adresse se dessine dans BlocLieux, et un
//  cercle d'imports se paie cher (voir lignes-profil).
//  §1 (nº 869) — `FORME_BOITE_ICONE` n'est plus lue ici : les lignes de
//  badges n'ont plus d'icône en tête. `BOITE_ICONE_LIGNE`, elle, revient
//  à la nº 870 — la ligne du booking et celle du site la portent, comme
//  l'adresse (BlocLieux) ne l'a jamais quittée.
import {
  BOITE_ICONE_LIGNE,
  ECRITURE_LIGNE_FICHE,
  LIGNE_GRISE,
} from "@/components/lignes-profil";
//  §3 (nº 870) — le libellé de repli d'un lien de site (son domaine),
//  quand l'artiste n'a pas donné de titre.
import { libelleDuLien } from "@/lib/liens-fiche";
//  §2 (nº 870) — LA PUCE DU SITE, une seule dans tout yokofolio : elle
//  joint « Books open » et le délai comme elle joint un style et son
//  rendu (nº 393).
import { SEPARATEUR_GALERIE } from "@/lib/photos-tatoueur";
import type { StyleGalerie } from "@/lib/photo-tatoueur";
import { FenetreSignalement } from "@/components/FenetreSignalement";
import { sousLeNom } from "@/components/BlocsFiche";
import {
  LigneAdresseDuLieu,
  BlocAdressesFiche,
  BlocProfilsArtiste,
} from "@/components/BlocLieux";
//  §6 (nº 415) — les deux familles de modes (ceux qui ont un lieu,
//  ceux qui n'en ont pas) et les morceaux de la ligne du profil :
//  une seule règle, lue ici comme dans BlocLieux.
//  §6 (nº 415, simplifié nº 418) — la garde du trait de séparation
//  lit l'ordre des modes : voir `aDesLieuxAMontrer`, plus bas.
import { modesOrdonnes } from "@/lib/modes-exercice";
import type { Tatoueur } from "@/lib/tatoueurs";
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

/**
 * §2 (nº 703) — LES QUATRE ÉCRITURES DE LA CONSIGNE ONT DÉMÉNAGÉ.
 * ------------------------------------------------------------------
 * `PARAM_ENTREE`, `ENTREE_LIEN`,
 * `avecConsigneDeLienInterne` et `adresseDeLienInterne` vivent
 * désormais dans `lib/lien-interne` — avec leurs explications, mot
 * pour mot. RIEN DE LA RÈGLE N'A CHANGÉ (nº 329-330) ; seul l'endroit
 * a changé, et la raison est de POIDS, au sens propre : `MenuEspace`
 * ne prenait ici que `avecConsigneDeLienInterne`, mais emportait avec
 * elle CE FICHIER et tout ce qui pend derrière — jusqu'au client de la
 * base, 62 Ko sur chaque page du site. Le détail est écrit là-bas.
 * ⚠️ LA RÉEXPORTATION EST VOULUE, et elle doit rester : les appelants
 * historiques (`FicheTatoueur`, `BlocLieux`, `BlocSuivis`) continuent
 * d'écrire `from "@/components/ContenuFiche"` sans rien savoir du
 * déménagement. Les NOUVEAUX appelants, eux, visent `lib/lien-interne`
 * directement — c'est ce qui allège.
 */
export {
  PARAM_ENTREE,
  ENTREE_LIEN,
  avecConsigneDeLienInterne,
  adresseDeLienInterne,
} from "@/lib/lien-interne";

/*  Réexporter ne fait pas entrer un nom dans CE fichier : ce composant
    importe lui-même ce qu'il emploie. §1 (nº 873) — l'onglet vit dans
    le CHEMIN (trois pages) : les adresses des trois vues, leur ordre et
    leur type viennent de la même feuille (`PARAM_ONGLET` est parti). */
import {
  adressesDesVues,
  VUES_DE_FICHE,
  type VueDeFiche,
} from "@/lib/lien-interne";
//  §1 (nº 873) — la mémoire de position du site : la place de la page
//  visée (au doigt) et celle de la colonne de lecture (au web), rendues
//  quand on revient sur un onglet — voir `avantDePartir`.
import {
  demanderRestaurationPosition,
  lireColonne,
  lireLaPlace,
  memoriserColonne,
  memoriserDefilement,
} from "@/lib/navigation-session";
import { positionSousLeGel } from "@/lib/gel-du-corps";
//  §1 (nº 718) — la variante d'avatar à servir : la règle de
//  nommage et le repli vivent dans lib/avatar-variantes.
import { AVATAR_MOYEN, sourceAvatar } from "@/lib/avatar-variantes";

/**
 * ██ §1 ET §2 (nº 490) — UNE LIGNE DE CAPSULES : ALIGNÉE, ET REPLIÉE
 * AU-DELÀ DE DEUX LIGNES ██
 * ==================================================================
 *
 * §1 — L'ICÔNE ÉTAIT TROP HAUTE, ET VOICI POURQUOI. La boîte des
 * icônes de la liste (`BOITE_ICONE_LIGNE`) mesure `1.375em`, c'est-à-
 * dire EXACTEMENT la hauteur d'une ligne de TEXTE à `leading-snug` —
 * 20,6 px pour les 15 px de la liste (la règle nº 389-§6). Or depuis
 * la nº 488 le contenu de ces deux lignes n'est plus du texte : ce
 * sont des CAPSULES, et une capsule est plus haute que sa ligne de
 * texte — 18 px de hauteur de ligne plus deux fois 4 px de
 * rembourrage, soit VINGT-SIX. L'icône, centrée dans ses 20,6 px,
 * tombait donc environ 2,7 px au-dessus du centre de la première
 * capsule. Le diamant avait exactement le même défaut que l'étoile :
 * les deux lignes partagent cet habillage.
 * LE REMÈDE EST LE PROCÉDÉ DES AUTRES LIGNES, PAS UN DÉCALAGE : la
 * règle est « la boîte de l'icône épouse la PREMIÈRE LIGNE du
 * contenu ». Pour du texte, c'est la hauteur de ligne ; ici, c'est la
 * hauteur d'une capsule. La boîte prend donc cette hauteur-là, et le
 * glyphe s'y centre par construction — volet replié comme déplié,
 * quel que soit le nombre de lignes.
 *
 * §2 — LE PLI AU-DELÀ DE DEUX LIGNES. Une fiche à vingt styles
 * empilait autant de rangées qu'il fallait ; on s'arrête maintenant à
 * DEUX, le reste passant derrière une capsule compteur « +N ⌄ » qui
 * déplie tout. DÉPLIÉE, elle dit « Réduire ⌃ » (nº 491-§3) : le
 * libellé et le sens de la flèche changent, la forme et le fond ne
 * bougent pas. Sa flèche est CELLE DES HORAIRES (`IconeChevronBas` au
 * rang 16, pivotée de 180°) : le même geste porte le même dessin.
 *
 * ██ §1 (nº 491) — POURQUOI LE COMPTEUR N'AVAIT PAS DE FOND AU WEB ██
 * Il en avait un. Il était `bg-sombre-carte` — et la fenêtre de fiche
 * du web était peinte de CE JETON-LÀ (`FenetreFiche`, la fenêtre et sa
 * colonne de droite ; elle porte le fond de la PAGE depuis l'essai de
 * la nº 499, ce qui ne change rien au récit ci-dessous ni au remède). Fond et support avaient donc exactement la même
 * couleur : contraste nul, capsule invisible, texte qui semblait nu.
 * Au doigt la fiche est une PAGE, posée sur le fond du site : le même
 * jeton s'y détachait, d'où la différence.
 * LE REMÈDE D'ALORS : le compteur passait à `bg-sombre-eleve` — UNE
 * seule couleur pour lui, sur les deux lignes, dans les deux
 * enveloppes —, un cran PLUS DISCRET que les capsules de style.
 * ⚠️ CE RAPPORT EST RENVERSÉ DEPUIS LA nº 524, sur décision du
 * propriétaire : les capsules sont descendues au fond des plaques
 * (`eleve`) et le compteur est monté à `eleve-clair`. Il est donc
 * désormais PLUS CLAIR qu'elles, et non plus effacé derrière — c'est
 * lui qu'on cherche pour ouvrir la ligne. Ce qui reste entier de cette
 * note : il n'a toujours qu'UNE couleur, sur les deux lignes et dans
 * les deux enveloppes, et c'est ce qui le fait se détacher du support
 * partout.
 *
 * COMMENT « DEUX LIGNES » EST DÉTERMINÉ — et c'est une MESURE, pas un
 * nombre de capsules : combien en tiennent dépend de la largeur de la
 * colonne et de la longueur des mots, qui changent d'une fiche, d'un
 * écran et d'une langue à l'autre.
 *  1. LA COUPE EST D'ABORD FAITE PAR LE CSS, donc DÈS LE RENDU DU
 *     SERVEUR : le conteneur est borné à la hauteur de deux lignes de
 *     capsules et rogne ce qui dépasse. C'est ce qui garantit qu'AUCUN
 *     état faux n'est peint (règles 137/203) : le premier affichage
 *     montre déjà exactement deux lignes, avant toute mesure et même
 *     si le JavaScript n'arrive jamais.
 *  2. LA MESURE VIENT ENSUITE, avant la peinture (`useLayoutEffect`) :
 *     on relève la largeur de chaque capsule pendant qu'elles sont
 *     TOUTES rendues, puis on garnit les deux lignes par le calcul, en
 *     réservant la place du compteur sur la seconde. La hauteur du
 *     bloc ne change pas — il faisait déjà deux lignes. Rien ne saute.
 *  3. LE FILET, ET C'EST LUI QUI TIENT LA RÈGLE ABSOLUE : après chaque
 *     rendu, on demande au navigateur s'il ROGNE encore quelque chose
 *     (`scrollHeight` contre `clientHeight`). Si oui, on retire une
 *     capsule de plus — donc le compteur apparaît, ou son nombre
 *     monte — et on recommence, avant peinture. Une capsule ne peut
 *     donc PAS être cachée sans compteur pour la rejoindre, quelle que
 *     soit la qualité du calcul du point 2.
 *  4. LE REDIMENSIONNEMENT EST SUIVI par un `ResizeObserver` sur le
 *     conteneur, et le calcul ne se refait QUE si la LARGEUR a changé
 *     — sinon le filet (qui change la hauteur) et le calcul (qui la
 *     regarde) se renverraient la balle sans fin.
 *
 * ██ §2 (nº 491) — POURQUOI LE WEB PERDAIT UNE CAPSULE SANS COMPTEUR ██
 * LE RELEVÉ : six capsules, cinq affichées au web, aucun compteur —
 * de l'information perdue sans moyen de l'atteindre. Le doigt, lui,
 * repliait proprement.
 * LA CAUSE, ET ELLE EST ENTIÈREMENT DANS LA MESURE : la nº 490
 * relevait les largeurs par `getBoundingClientRect()`, qui rend la
 * largeur PEINTE — mise à l'échelle comprise. Or la fenêtre de fiche
 * du web s'ouvre en grandissant (une transition de `transform` de
 * 0,97 à 1). Les capsules étaient donc mesurées jusqu'à 3 % TROP
 * ÉTROITES, tandis que la place disponible, elle, était lue par
 * `clientWidth` — une largeur de MISE EN PAGE, que la mise à l'échelle
 * n'affecte pas. On comparait des largeurs rapetissées à une place à
 * taille réelle : le calcul croyait qu'il rentrait 3 % de plus qu'en
 * vrai. Sur six capsules, ces 3 % suffisaient à conclure « les six
 * tiennent » — donc aucun compteur — pendant que la coupe CSS, elle
 * bien réelle, mangeait la sixième. Et comme les largeurs étaient
 * mémorisées UNE FOIS, l'erreur était figée pour toute la vie de la
 * fiche. La page du doigt n'a aucune mise à l'échelle : elle mesurait
 * juste, d'où l'écart entre les deux affichages.
 * LE REMÈDE EST DOUBLE : les largeurs se relèvent désormais par
 * `offsetWidth`, une grandeur de MISE EN PAGE — la même famille que
 * `clientWidth`, insensible aux `transform`, donc les deux nombres
 * sont enfin comparables ; et le filet du point 3 rattrape tout ce que
 * le calcul pourrait encore rater.
 * ⚠️ ON NE MÉMORISE PLUS UNE MESURE DOUTEUSE : les largeurs ne sont
 * gardées que si elles sont TOUTES non nulles (une fenêtre pas encore
 * mesurable en rendrait zéro). Tant qu'on n'a rien de fiable, on ne
 * coupe pas par le calcul — le filet, lui, travaille quand même.
 * ⚠️ LA LARGEUR DU COMPTEUR n'est plus devinée : `LARGEUR_COMPTEUR`
 * n'est que sa valeur de DÉPART, remplacée par sa largeur réelle dès
 * qu'il a été rendu une fois.
 *
 * ⚠️ CHAQUE LIGNE EST TRAITÉE SÉPARÉMENT : les techniques et les
 * styles ont chacune leur mesure et leur compteur, et n'en ont un que
 * si elles débordent. Sans débordement, aucun compteur n'apparaît.
 * ⚠️ LE COMPTEUR EST LE SEUL ÉLÉMENT CLIQUABLE : les capsules de
 * valeur restent inertes (acquis nº 488).
 */
/** La hauteur d'une capsule : 18 px de ligne + 2 × 4 px de
    rembourrage. C'est elle qui donne la hauteur de la boîte d'icône
    ET la borne des deux lignes. */
/*  §6 (nº 867) — VINGT-HUIT DEPUIS QUE LA CAPSULE A UN CONTOUR : la
    boîte n'a pas grandi d'air (18 de ligne, 4 + 4 de rembourrage), elle
    a gagné LE TRAIT — un pixel en haut, un en bas. Cette hauteur sert à
    deux choses, et les deux doivent la suivre : la boîte de l'icône en
    tête de ligne (qui s'aligne sur la première capsule) et le plafond
    de deux lignes (`maxHeight`), qui déciderait sinon de couper une
    ligne trop tôt.
    §1 (nº 869) — LA BOÎTE DE L'ICÔNE EST PARTIE (plus d'icône en tête
    des lignes de badges) : cette hauteur ne sert plus qu'au plafond des
    deux lignes, et ne bouge pas. */
const HAUTEUR_CAPSULE = 28;
/** L'écart entre deux capsules (`gap-1.5`). */
const ECART_CAPSULES = 6;
/** La place réservée au compteur en fin de deuxième ligne, AVANT
    qu'il ait jamais été rendu : dès son premier rendu, c'est sa
    largeur réelle qui prend le relais (nº 491). Prise large — 72 px
    couvrent « +999 » — pour que le tout premier calcul se trompe du
    bon côté. */
const LARGEUR_COMPTEUR = 72;

/**
 * ██ §1 (nº 505) — LE FOND DES CAPSULES MONTE D'UN CRAN ██
 * ------------------------------------------------------------------
 * Elles portaient celui des PLAQUES depuis la nº 504, et se
 * confondaient donc avec les boutons et le reste de la page. Elles
 * prennent le cran au-dessus : `eleveClair` (#323942).
 * ⚠️ LES DEUX FAMILLES GARDENT LE MÊME FOND ENTRE ELLES (acquis
 * nº 504) — d'où cette constante, écrite une fois et lue par les deux
 * lignes : elles ne peuvent plus diverger. Ce qui les distingue reste
 * l'ICÔNE en tête (diamant / étoile, nº 489).
 * ██ §3 (nº 524) — LES CAPSULES PRENNENT LE FOND DES PLAQUES ██
 * ------------------------------------------------------------------
 * `eleve-clair` → `eleve`, le jeton des plaques (plaque.ts). Les deux
 * familles descendent ensemble : ce qui les distingue reste l'ICÔNE en
 * tête, jamais la couleur.
 * ⚠️ CE QUE ÇA RENVERSE, ET C'EST VOULU (§4) : le compteur était sous
 * elles d'un cran ; il passe AU-DESSUS. Le propriétaire le veut plus
 * clair qu'elles — c'est lui qu'on regarde pour ouvrir la ligne, pas
 * les valeurs qu'il cache. La note de la nº 505, plus haut, décrivait
 * l'ancien rapport : elle est remise d'aplomb là-bas.
 */
/*  ██ §6 (nº 867) — LA ROBE DU BADGE DU COMPTE, POUR LES CAPSULES ██
    ------------------------------------------------------------------
    DÉCISION DU PROPRIÉTAIRE : les capsules d'un profil — les styles,
    les techniques, les couleurs, la taille de pièce — n'ont PLUS DE
    FOND D'ACTION. Elles prennent la robe du BADGE DU COMPTE (le titre
    de la page de résultats, nº 847) : le fond du site, et un contour
    fin. Un aplat plus clair que la page annonce quelque chose à
    toucher ; une valeur ne se touche pas.
    ⚠️ C'EST L'ÉCRITURE DU BADGE, PAS UNE COPIE : `ROBE_BADGE_CONTOUR`
    (config/tatouage) dit déjà « boîte de badge, contour fin, aucun
    remplissage » — les deux robes ne peuvent donc pas diverger. Ce
    qu'elle apporte en plus de la couleur (le refus de rétrécir, le
    refus de couper le mot, le rayon) est ce que la capsule faisait
    DÉJÀ, écrit une fois pour les deux.
    ⚠️ LE COMPTEUR « +2 » N'EN EST PLUS UN (voir plus bas) : il quitte
    la famille des capsules et devient du texte nu.
    ⚠️ WEB ET DOIGT ENSEMBLE : cette ligne est la seule qui les
    habille, elle n'a jamais eu de variante d'appareil. */
const FOND_CAPSULE = ROBE_BADGE_CONTOUR;

/** `useLayoutEffect` mesure AVANT la peinture — c'est ce qui empêche
    de voir les capsules se retirer une à une. Il n'existe pas au
    rendu du serveur : on y retombe sur `useEffect`, qui n'y fait rien
    non plus, plutôt que de laisser React avertir. Constante de
    module : l'ordre des crochets ne change jamais. */
const useEffetDeMiseEnPage =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Combien de capsules tiennent en deux lignes, la place du compteur
    réservée ou non. Un garnissage simple, de gauche à droite. */
function capsulesQuiTiennent(
  largeurs: readonly number[],
  dispo: number,
  reserve: number
): number {
  let ligne = 1;
  let reste = dispo;
  let placees = 0;
  for (const largeur of largeurs) {
    const ecart = reste === dispo ? 0 : ECART_CAPSULES;
    const aGarder = ligne === 2 ? reserve : 0;
    if (largeur + ecart + aGarder <= reste) {
      reste -= largeur + ecart;
      placees += 1;
      continue;
    }
    if (ligne === 2) break;
    ligne = 2;
    reste = dispo;
    if (largeur + reserve > reste) break;
    reste -= largeur;
    placees += 1;
  }
  return placees;
}

/**
 * ██ §3 (nº 874) — UNE LIGNE PEUT PORTER DEUX FAMILLES ██
 * ------------------------------------------------------------------
 * Elle recevait UNE famille (des slugs) et le moyen de la nommer. Elle
 * reçoit désormais DES CAPSULES DÉJÀ NOMMÉES — chacune sa clé et son
 * mot — et LES MARQUEURS de ce qu'elle porte : la fusion des styles et
 * des compétences (moins de trois styles, voir `ligneDesCapsules`)
 * n'est alors qu'une liste mise bout à bout, et rien du dessin, du
 * compteur ou de la coupe à deux lignes n'est réécrit pour elle.
 * ⚠️ LA CLÉ PORTE SA FAMILLE (« style:blackwork ») : un style et une
 * compétence peuvent partager un slug, et deux enfants de même clé se
 * marcheraient dessus au remontage.
 */
function LigneDeCapsules({
  marqueurs,
  capsules,
  fond,
}: {
  /** Les marques de relevé posées sur la ligne — une par famille
      qu'elle porte réellement (`data-styles-fiche`,
      `data-pratique-fiche`), plus celle de la fusion s'il y a lieu. */
  marqueurs: readonly string[];
  capsules: ReadonlyArray<{ cle: string; mot: string }>;
  fond: string;
}) {
  const [montrees, setMontrees] = useState(capsules.length);
  const [deplie, setDeplie] = useState(false);
  //  Le seul rôle de cet état : faire retourner la mesure quand le
  //  conteneur change de taille. Sa valeur ne sert à personne.
  const [, setTic] = useState(0);
  const zone = useRef<HTMLSpanElement>(null);
  const largeurs = useRef<number[]>([]);
  const largeurCompteur = useRef(LARGEUR_COMPTEUR);
  const largeurMesuree = useRef(-1);

  useEffect(() => {
    const boite = zone.current;
    if (!boite) return;
    const observateur = new ResizeObserver(() => setTic((tour) => tour + 1));
    observateur.observe(boite);
    return () => observateur.disconnect();
  }, []);

  //  APRÈS CHAQUE RENDU, AVANT LA PEINTURE — sans tableau de
  //  dépendances, c'est voulu : le filet doit pouvoir se rejouer
  //  jusqu'à ce que plus rien ne soit rogné.
  useEffetDeMiseEnPage(() => {
    const boite = zone.current;
    if (!boite || capsules.length === 0 || deplie) return;
    const enfants = Array.from(boite.children) as HTMLElement[];

    //  Une AUTRE fiche est passée sous le composant : on repart de
    //  zéro plutôt que de couper avec les mesures de la précédente.
    if (montrees > capsules.length) {
      largeurs.current = [];
      largeurMesuree.current = -1;
      setMontrees(capsules.length);
      return;
    }
    //  LES LARGEURS NE SE RELÈVENT QUE TOUT RENDU, et ne se gardent
    //  que si elles sont plausibles (voir la note, nº 491-§2).
    if (montrees === capsules.length && enfants.length >= capsules.length) {
      const relevees = enfants
        .slice(0, capsules.length)
        .map((enfant) => enfant.offsetWidth);
      if (relevees.every((largeur) => largeur > 0)) largeurs.current = relevees;
    }
    //  Le compteur est le dernier enfant quand il y en a un : sa
    //  largeur réelle remplace la valeur de départ.
    if (montrees < capsules.length && enfants.length === montrees + 1) {
      const large = enfants[montrees].offsetWidth;
      if (large > 0) largeurCompteur.current = large;
    }

    const dispo = boite.clientWidth;
    if (dispo <= 0) return;
    //  LE CALCUL NE SE REFAIT QU'AU CHANGEMENT DE LARGEUR : sinon il
    //  proposerait de remettre ce que le filet vient de retirer.
    if (dispo !== largeurMesuree.current) {
      largeurMesuree.current = dispo;
      if (largeurs.current.length === capsules.length) {
        const sansCompteur = capsulesQuiTiennent(largeurs.current, dispo, 0);
        const cible =
          sansCompteur >= capsules.length
            ? capsules.length
            : Math.max(
                1,
                capsulesQuiTiennent(
                  largeurs.current,
                  dispo,
                  largeurCompteur.current + ECART_CAPSULES
                )
              );
        if (cible !== montrees) {
          setMontrees(cible);
          return;
        }
      } else if (montrees !== capsules.length) {
        //  Rien de fiable en mémoire : on remet tout pour pouvoir
        //  mesurer. Le CSS coupe pendant ce temps, le filet suit.
        setMontrees(capsules.length);
        return;
      }
    }

    //  ██ LE FILET (nº 491) ██ — la règle absolue : si le navigateur
    //  rogne encore quelque chose, une capsule est cachée SANS moyen
    //  de l'atteindre. On en retire une de plus, ce qui fait monter le
    //  compteur — et on recommence au rendu suivant.
    if (montrees > 1 && boite.scrollHeight > boite.clientHeight + 1) {
      setMontrees(montrees - 1);
    }
  });

  if (capsules.length === 0) return null;
  const restant = capsules.length - montrees;
  const visibles = deplie ? capsules : capsules.slice(0, montrees);
  return (
    <p
      {...Object.fromEntries(marqueurs.map((marque) => [marque, ""]))}
      /*  ██ §1 (nº 869) — PLUS D'ICÔNE EN TÊTE DE LIGNE ██
           Décision du propriétaire : les badges d'un profil s'écrivent
           TEXTE SEUL, contour, gris. La boîte de 22 px qui ouvrait la
           ligne (nº 489 → nº 868 : diamant, étoile, goutte) est partie
           avec son dessin, et l'écart qui la séparait des capsules avec
           elle : les capsules commencent au bord gauche de la liste,
           comme la bio au-dessus d'elles. La rangée reste une boîte
           souple : c'est elle qui donne à la zone des capsules sa
           largeur (`flex-1`), donc le calcul du compteur (nº 491). */
      className={`flex ${ECRITURE_LIGNE_FICHE} ${LIGNE_GRISE}`}
    >
      <span
        ref={zone}
        className={`min-w-0 flex flex-1 flex-wrap gap-1.5 ${
          deplie ? "" : "overflow-hidden"
        }`}
        style={
          deplie
            ? undefined
            : { maxHeight: HAUTEUR_CAPSULE * 2 + ECART_CAPSULES }
        }
      >
        {visibles.map(({ cle, mot }) => (
          <span
            key={cle}
            /*  §1 (nº 547) — LE TEXTE S'ÉCLAIRCIT. Les capsules ne
                 portaient AUCUNE couleur à elles : elles héritaient du
                 gris doux de la ligne (`LIGNE_GRISE`, posé sur le `p`
                 qui les contient) — 5,96 de contraste sur leur fond,
                 trop sombre pour être lu sans effort. Elles prennent le
                 jeton de texte plein de la nº 466 : 12,59.
                 ⚠️ ON POSE LA COULEUR ICI, PAS SUR LA LIGNE : le `p`
                 porte aussi l'ICÔNE en tête (diamant, étoile), qui doit
                 garder le gris de toutes les icônes de la colonne
                 (nº 392). Éclaircir la ligne l'aurait emportée.
                 ⚠️ UNE CAPSULE EST UNE VALEUR, pas une mention : le
                 site donne déjà le texte plein à ses valeurs. Rien
                 d'autre ne bouge — ni la taille, ni la graisse, ni le
                 fond. */
            /*  §6 (nº 867) — LA BOÎTE VIENT DE LA ROBE (`fond`, qui est
                celle du badge du compte depuis cette passe) : elle
                porte déjà l'alignement, le refus de couper le mot et le
                rayon. Ne restent ici que l'air intérieur, le corps et
                la couleur du texte — inchangés. */
            /*  ██ §3 (nº 868) — LA TYPOGRAPHIE PASSE AU GRIS ██
                Décision du propriétaire, après le retrait du fond
                (nº 867) : les valeurs d'un profil — styles, couleurs,
                machine, taille de pièce — s'écrivent dans LE GRIS DES
                SOUS-TITRES DU SITE (`sombre-texte-doux`, celui de la
                ville sous un nom, de la ligne d'information d'un suivi,
                du sous-titre d'une carte). Le contour dit la capsule,
                le gris dit que c'est une mention et non un titre.
                ⛔ CE QUE CELA DÉFAIT, ET C'EST ASSUMÉ : la nº 547 les
                avait éclaircies (5,96 → 12,59 de contraste) parce
                qu'elles vivaient alors sur un aplat plus clair. Le fond
                parti, elles se lisent sur le fond de la page : 7,4 de
                contraste — au-dessus du seuil AA de 4,5, et le même
                rapport que toutes les mentions grises du site.
                ⚠️ L'ICÔNE EN TÊTE DE LIGNE GARDE SON GRIS À ELLE (la
                note de la nº 547 tient : la couleur se pose ici, pas
                sur la ligne).
                §1 (nº 869) — L'ICÔNE EST PARTIE ; la couleur reste
                posée ici, sur la capsule, et le compteur garde la
                sienne. */
            className={`px-2.5 py-1 text-[13.5px] leading-[18px] text-sombre-texte-doux ${fond}`}
          >
            {mot}
          </span>
        ))}
        {restant > 0 && (
          /*  §1 ET §3 (nº 491) — LA CAPSULE COMPTEUR : même rayon,
              même hauteur, même écriture que les autres. Aucun
              contour, aucun rose.
              ██ §3 (nº 505) — IL PREND LE FOND DES PLAQUES, ET IL
              RECULE PAR CONSTRUCTION ██
              --------------------------------------------------------
              LA nº 504 L'AVAIT DESCENDU À `carte` pour qu'il se
              distingue de capsules devenues identiques à lui. Ce
              détour n'a plus lieu d'être : le §1 de cette passe fait
              MONTER les capsules d'un cran. Le compteur peut donc
              rester au fond des PLAQUES — le niveau du contenu — et se
              retrouve NATURELLEMENT plus sombre qu'elles, sans qu'on
              lui ajoute rien.
              ET C'EST LE BON SENS : sur un fond noir, ce qui est plus
              sombre recule. Un compteur est un bouton, pas une
              information — il ne doit pas peser plus lourd que les
              valeurs qu'il compte.
              ⚠️ CE QUE ÇA VAUT, MESURÉ : contre une capsule voisine,
              1,21 ; contre le fond de la page (et de la fenêtre du web,
              même couleur depuis les nº 499-501), 1,37 — près de trois
              fois le 1,16 que la nº 504 lui laissait. Il se détache
              donc mieux de son support ET reste en retrait de ses
              voisines : les deux à la fois, ce que le détour par
              `carte` ne donnait pas.
              ⚠️ ET IL RÉPOND ENFIN AU SURVOL, dans les DEUX états
              (« +N ⌄ » comme « Réduire ⌃ ») : il monte au fond des
              CAPSULES (1,21 de sa propre couleur), et l'appui le tient
              au doigt, où il n'y a pas de survol. C'est le traitement
              exact des plaques (nº 492), transposé : un cran vers le
              haut, jamais deux, et une seule couleur de fond par état.
              LE LIBELLÉ DIT L'ÉTAT : « +N ⌄ » tant qu'il reste à
              déplier, « Réduire ⌃ » une fois tout montré. La forme et
              le fond ne changent pas d'un état à l'autre ; seuls le
              mot et le sens de la flèche. La largeur, elle, suit le
              texte — sans conséquence : « Réduire » ne s'affiche que
              DÉPLIÉ, état où la coupe à deux lignes n'existe plus. */
          <button
            type="button"
            onClick={() => setDeplie((etait) => !etait)}
            aria-expanded={deplie}
            /*  ██ §4 (nº 524) — LE COMPTEUR PASSE AU-DESSUS DES
                 CAPSULES ██
                 Elles descendent au fond des plaques (§3) ; lui monte
                 d'un cran, à `eleve-clair` — la valeur qu'elles
                 portaient. Le rapport s'inverse, et c'est la demande :
                 c'est le compteur qu'on cherche pour ouvrir la ligne,
                 pas les valeurs qu'il cache.
                 ⚠️ SON SURVOL MONTE AVEC LUI, sans quoi il n'en aurait
                 plus : il vaut `haut`, le cran au-dessus — celui-là
                 même que le rond d'un lieu sans fiche porte sur sa
                 plaque. Aucune couleur neuve.
                 ⚠️ ET IL RÉPOND DANS LES DEUX ÉTATS (acquis nº 505) :
                 cette écriture sert « +2 » comme « Réduire », le
                 bouton étant le même. */
            /*  §1 (nº 547) — IL PARTAGEAIT LE MÊME GRIS, il suit donc.
                 Le compteur n'avait pas plus de couleur à lui que les
                 capsules : il héritait du même `LIGNE_GRISE`. Il prend
                 le même texte plein — 4,94 → 10,44 sur son fond, qui
                 est d'un cran au-dessus du leur. Rien d'autre ne bouge. */
            /*  ██ §6 (nº 867) — LE COMPTEUR N'EST PLUS UN BADGE ██
                Décision du propriétaire : « +2 ⌄ » (et « Less ⌃ ») est
                du TEXTE NU avec sa flèche, posé sur l'écran — plus de
                capsule, plus de fond, plus de contour. Il cesse donc de
                se faire passer pour une valeur de plus : c'est une
                commande, et le seul signe qui reste est sa flèche.
                CE QUI RESTE, ET QU'IL FAUT GARDER : la MÊME HAUTEUR que
                les capsules (le rembourrage vertical et l'interligne ne
                bougent pas, plus un pixel de chaque côté pour remplacer
                le trait qu'il perd) — sans quoi il ne s'alignerait plus
                sur la ligne qu'il termine, et le calcul des deux lignes
                (qui mesure sa boîte) se tromperait. Son écriture, elle,
                est celle des capsules, au cheveu.
                ⚠️ SANS FOND, IL NE PEUT PLUS S'ÉCLAIRCIR AU SURVOL : la
                réponse au doigt et à la souris passe donc au TEXTE, qui
                blanchit — le geste des liens du site (nº 505 lui donnait
                un fond, il n'en a plus). */
            className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap
                       px-0.5 py-[5px] text-[13.5px] leading-[18px]
                       text-sombre-texte-doux transition-colors hover:text-sombre-texte
                       active:text-sombre-texte"
          >
            {deplie ? "Less" : `+${restant}`}
            <span
              aria-hidden="true"
              className={`shrink-0 transition-transform duration-200 ${
                deplie ? "rotate-180" : ""
              }`}
            >
              <IconeChevronBas taille={16} />
            </span>
          </button>
        )}
      </span>
    </p>
  );
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
  vue = "profil",
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
  /**
   * ██ §3 (nº 877) — `surSerieChoisie` REVIENT, PAR LES CARTES ██
   * La nº 876 l'avait retirée avec les bandes par style : plus de
   * vignette, plus de série choisie. Le propriétaire rend le geste aux
   * CARTES DU FIL DE GALERIES, au web : un clic sur la photo d'une
   * carte pose cette photo dans l'affiche (la colonne de gauche). Ce
   * qui remonte est donc ce qui remontait — la série ET le rang
   * (nº 204-§3, nº 306-§1-6) —, et l'enveloppe (FicheTatoueur ou
   * FenetreFiche) en fait ce qu'elle en faisait.
   * ⚠️ RIEN AU DOIGT : la carte n'y porte aucun bouton de photo
   * (« toucher une photo ne fait rien », nº 873-§3) — c'est la carte
   * elle-même qui s'en garde, par l'appareil (FilDeGalerie).
   */
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
  /**
   * ██ §1 (nº 873) — LA PAGE OÙ L'ON EST : profil, portfolio ou flash ██
   * ------------------------------------------------------------------
   * Connue du SERVEUR par la route (page.tsx, portfolio/page.tsx,
   * flash/page.tsx). Sur une page publique (`adresseALui`, hors aperçu),
   * c'est ELLE l'onglet ouvert, et les trois onglets sont des liens
   * entre les trois pages. Ailleurs — la fenêtre superposée du web,
   * l'aperçu « Ma fiche » — elle ne dit rien : l'onglet y vit dans
   * React, comme depuis la nº 197.
   */
  vue?: VueDeFiche;
}) {
  /**
   * ██ LES TROIS ONGLETS DE L'AFFICHE — TROIS PAGES (nº 197-§1, nº 873-§1) ██
   * ==================================================================
   * « Profile » montre le contenu de la fiche ; « Portfolio » ses
   * tatouages, « Flash » ses planches — les galeries d'UNE catégorie
   * (PortfolioDeLAffiche), le fil de galeries au doigt (§3).
   *
   * OÙ VIT L'ONGLET, ET C'EST LE POINT DE LA nº 873 :
   *  · SUR UNE PAGE PUBLIQUE, DANS LE CHEMIN. Les trois vues sont trois
   *    pages (`/artist/<nom>`, `/portfolio`, `/flash`) : l'onglet
   *    ouvert EST la page (`vue`, connue du serveur par la route), et
   *    les trois onglets sont des LIENS — la navigation douce de
   *    l'accueil (nº 860). Un retour rend la page d'avant, à sa place.
   *    ⚠️ CE QUI PART AVEC, code compris : l'onglet-requête de la
   *    nº 329-§3 — « ?onglet=portfolio », le `replaceState` qui
   *    l'écrivait, la relecture pendant le rendu qui le suivait — et sa
   *    règle « changer d'onglet REMPLACE l'entrée » (nº 332-§4) : chaque
   *    onglet suivi pose une entrée, c'est la décision du propriétaire
   *    (« comme l'accueil, nº 860 »). L'adresse de l'étape porte
   *    toujours l'onglet — mieux qu'avant, c'est son chemin.
   *  · DANS LA FENÊTRE SUPERPOSÉE DU WEB ET DANS L'APERÇU, DANS REACT,
   *    comme depuis la nº 197 : ni l'une ni l'autre n'a d'adresse à
   *    elle (la fenêtre est une surface posée sur une autre page,
   *    l'aperçu vit dans l'espace tatoueur — `adresseALui` et `apercu`
   *    tranchent), les onglets y sont des boutons qui changent le
   *    contenu sur place.
   */
  const enPages = adresseALui && !apercu;
  const [ongletChoisi, setOngletChoisi] = useState<VueDeFiche>("profil");
  const onglet: VueDeFiche = enPages ? vue : ongletChoisi;
  /** Les adresses des trois onglets, quand ce sont des liens. */
  const adresses = enPages ? adressesDesVues(tatoueur.slug) : null;
  const router = useRouter();
  /**
   * §1 ET §3 (nº 873) — LES GALERIES DE LA PAGE, CALCULÉES UNE FOIS : la
   * catégorie de l'onglet (« Portfolio » → les tatouages, « Flash » →
   * les flashs ; le profil n'en a pas), et ses galeries dans l'ordre du
   * profil — données telles quelles au panneau du web et au fil du
   * doigt, qui n'ont donc rien à tenir d'accord. Vides : la page le
   * dit (§4), aucun des deux ne se monte.
   */
  const categorie = categorieDeLaVue(onglet);
  const galeries = useMemo(
    () => (categorie ? galeriesDuPortfolio(groupes, categorie.nature) : []),
    [groupes, categorie]
  );
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
      window.scrollTo({ top: cible, left: 0, behavior: "instant" });
      //  ⚠️ 520 ms : la durée du mouvement (400) et une marge. Plus
      //  court, on corrigerait EN COURS de route.
    }, 520);
  }

  /*  ⛔ §3 (nº 876) — `remonterEnHautDeLaPhoto` (nº 239-§1) ET SON
      DÉCLENCHEUR `remonteeDemandee` (nº 238-§1) SONT SUPPRIMÉS, CODE
      COMPRIS : ils ne servaient qu'aux vignettes des bandes par style
      du web, qui changeaient la photo du haut. Plus de vignette, plus
      de remontée à jouer. La remontée SOUS LA BARRE (`remonterSousLaBarre`,
      Profil / Portfolio) n'est pas touchée. */

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
    //  ⚠️ §2 (nº 737) — LE PORT DE DÉFILEMENT SUFFIT, le débordement
    //  n'est plus exigé. Le critère ajoutait `scrollHeight >
    //  clientHeight` : depuis un onglet COURT (rien ne déborde), la
    //  colonne du web n'était pas retenue et l'on tombait au chemin 2
    //  — LA PAGE défilait (mesuré : recalée à 32 px de haut à chaque
    //  bascule dès qu'on avait défilé davantage). Le défaut restait
    //  invisible tant que la colonne COLLAIT (nº 737-§1 : la cible du
    //  chemin 2 tombait toujours plus bas que la position, et il
    //  rendait la main sans bouger) ; la colonne à hauteur constante
    //  l'a découvert. Un élément à `overflow-y: auto` est le
    //  défilement propre du contenu, qu'il déborde ou non : s'il ne
    //  déborde pas, il n'y a RIEN à remettre à zéro — et rien d'autre
    //  à faire. Le doigt ne passe jamais ici (sa colonne n'a pas ce
    //  débordement, la boucle s'arrête avant le corps) : son chemin 2
    //  est intact.
    let noeud: HTMLElement | null = rangee.parentElement;
    while (noeud && noeud !== document.body) {
      const vertical = getComputedStyle(noeud).overflowY;
      if (vertical === "auto" || vertical === "scroll") {
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
    defilerSansGeste({ top: cible }, "ContenuFiche (ancre de section)");
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
  function choisirOnglet(suivant: VueDeFiche) {
    setOngletChoisi(suivant);
    ouvrirLOngletAuDebut();
  }

  /**
   * ██ §1 (nº 873) — « CHAQUE PAGE GARDE SA POSITION DE DÉFILEMENT » ██
   * ==================================================================
   * LA DEMANDE : Portfolio à 600 → Flash → retour → 600. Deux surfaces
   * défilent, selon l'appareil, et chacune a sa mémoire :
   *  · AU DOIGT, LA PAGE. C'est la mémoire de navigation du site, sans
   *    une ligne de plus pour écrire : au clic d'un lien vers une fiche
   *    depuis une fiche, MemoireNavigation note la place de la page
   *    qu'on quitte (nº 230-§3) — un onglet est exactement ce lien. Il
   *    manquait de la RENDRE : une navigation en avant arrive en haut,
   *    c'est la règle ; l'exception a un mot, celui de l'accueil
   *    (nº 860-§2) — `demanderRestaurationPosition(adresse)`, « la
   *    prochaine arrivée à CETTE adresse rend sa place ». On ne la pose
   *    QUE SI UNE PLACE EXISTE pour la page visée : une première visite
   *    arrive en haut, nette et instantanée (DefilementEnHaut), au lieu
   *    de s'en remettre au recalage du routeur. Nominative, la demande
   *    ne peut pas repeindre une autre page ; tout geste l'annule.
   *  · AU WEB, LA COLONNE DE LECTURE (`data-colonne-lecture`, l'enveloppe
   *    de ce contenu — `window.scrollY` y vaut zéro), et la colonne est
   *    REMONTÉE avec chaque page. Sa place se retient donc à part, sous
   *    l'adresse de la page, à mesure qu'elle défile (`memoriserColonne`,
   *    une image par écriture), et se rend au montage de la page
   *    suivante — avant la peinture, pour qu'aucune image ne montre la
   *    colonne en haut. Un retour ou une avance du navigateur passent
   *    par le même montage : ils la rendent aussi.
   * ⚠️ RIEN N'EST FAIT HORS D'UNE PAGE PUBLIQUE : la fenêtre du web et
   * l'aperçu changent d'onglet sur place, et gardent leur remontée
   * (`ouvrirLOngletAuDebut`).
   */
  function avantDePartir(cible: VueDeFiche) {
    if (!adresses) return;
    if (lireLaPlace(adresses[cible])) {
      demanderRestaurationPosition(adresses[cible]);
    }
  }
  useLayoutEffect(() => {
    if (!enPages) return;
    const colonne =
      rangeeDuHaut.current?.closest<HTMLElement>("[data-colonne-lecture]") ??
      null;
    if (!colonne) return;
    //  L'adresse est la nôtre dès ce montage : FicheSelonLAdresse ne
    //  monte la fiche qu'une fois l'arrivée commise (nº 360).
    const ici = window.location.pathname + window.location.search;
    const retenue = lireColonne(ici);
    if (retenue > 0) colonne.scrollTop = retenue;
    let image = 0;
    const retenir = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(() =>
        memoriserColonne(ici, colonne.scrollTop)
      );
    };
    colonne.addEventListener("scroll", retenir, { passive: true });
    return () => {
      cancelAnimationFrame(image);
      colonne.removeEventListener("scroll", retenir);
    };
  }, [enPages]);

  /**
   * ██ §2 (nº 527) — UN GLISSEMENT HORIZONTAL CHANGE D'ONGLET ██
   * ==================================================================
   * Le geste posé sur « Ma sélection » à la nº 526, porté aux fiches.
   * LE MODULE EST LE MÊME (lib/glissement-lateral) : mêmes seuils,
   * même verrou d'axe, mêmes refus — rien n'est réécrit ici.
   *
   * ⚠️ LE SECOND BRANCHEMENT, ET POURQUOI. La nº 526 posait ses
   * écouteurs sur la racine de la page « Ma sélection ». CE CONTENU
   * REND UN FRAGMENT : il n'a aucune boîte à qui les donner, et en
   * fabriquer une reviendrait à glisser un conteneur dans la colonne de
   * lecture (pièges 378/379). Les écouteurs vont donc sur la page, et
   * une ZONE dit d'où le geste doit partir : la COLONNE DE LECTURE
   * (`data-colonne-lecture`, l'enveloppe qui porte les deux onglets et
   * leurs deux panneaux). On la NOMME, on ne la touche pas.
   * Trois conséquences, toutes voulues :
   *  · le geste marche partout où l'on lit une fiche — profil comme
   *    portfolio, page publique comme aperçu (nº 473 : les deux montent
   *    ce contenu dans la même colonne) ;
   *  · il ne marche PAS sur la photo du haut, qui est hors de la
   *    colonne : c'est l'affiche, pas le contenu qu'on feuillette ;
   *  · EN VUE PHOTO (nº 453), la colonne est retirée de l'affichage :
   *    rien dedans ne peut être touché, le geste ne peut donc pas
   *    commencer. On ne bascule pas un va-et-vient invisible, et
   *    aucune garde n'a eu à le dire.
   *
   * ⚠️ ET C'EST LE MÊME CHEMIN QUE LE TOUCHER D'UN ONGLET, jamais une
   * seconde écriture (nº 873-§1) :
   *  · SUR UNE PAGE PUBLIQUE, le geste NAVIGUE vers la page voisine —
   *    l'ordre est celui du va-et-vient (`VUES_DE_FICHE`) : vers la
   *    gauche, l'onglet suivant ; vers la droite, le précédent. Un
   *    glissement n'est pas un clic : la mémoire de navigation n'a pas
   *    vu partir la page, on écrit donc sa place nous-mêmes (ce que
   *    MemoireNavigation fait au clic d'un lien de fiche, nº 230-§3),
   *    puis on déclare et on part comme l'onglet (`avantDePartir`).
   *    §1 (nº 875) — ET IL REMPLACE L'ÉTAPE, comme le toucher d'un
   *    onglet : `router.replace`, jamais `push`. Le geste et le clic
   *    mènent au même endroit, ils doivent coûter le même historique —
   *    la règle et son pourquoi sont écrits chez le lien
   *    (OngletsLigne, §1 nº 875) ;
   *  · DANS LA FENÊTRE DU WEB ET L'APERÇU, `choisirOnglet` — le
   *    va-et-vient suit (trait rouge compris : il lit `onglet`), rien
   *    n'est écrit dans l'adresse, et LA POSITION SUIT LA MÊME RÈGLE
   *    QU'AU TOUCHER : `ouvrirLOngletAuDebut` ne remonte que si l'on est
   *    DESCENDU sous le début de la section, et alors jusqu'à lui —
   *    jamais jusqu'en haut de la page (la nº 377 a retiré ce saut-là).
   *
   * ⚠️ RIEN AU BOUT DE LA RANGÉE : un glissement vers la droite en
   * « Profile », vers la gauche en « Flash », n'a pas de voisin et ne
   * fait rien.
   * ⚠️ LA MÉMOIRE DES GALERIES (nº 459) N'EST PAS CONCERNÉE : elle
   * s'écrit au défilement d'une galerie et se relit à son montage —
   * ce geste ne fait ni l'un ni l'autre, et il refuse même de partir
   * d'une galerie.
   */
  useGlissementLateralSurLaPage((sens) => {
    const cible = VUES_DE_FICHE[VUES_DE_FICHE.indexOf(onglet) + sens];
    if (!cible) return;
    if (adresses) {
      memoriserDefilement(
        window.location.pathname + window.location.search,
        positionSousLeGel()
      );
      avantDePartir(cible);
      //  §1 (nº 875) — REMPLACER, jamais empiler (voir la note).
      router.replace(adresses[cible]);
      return;
    }
    choisirOnglet(cible);
  }, "[data-colonne-lecture]");

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
   * 5 de la règle de navigation) : `/artist/x#profil`, c'est « la
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
      Profil / Portfolio (`choisirOnglet`, sous la barre) ; celle des
      vignettes de style (tout en haut, nº 239) est partie avec elles
      (§3 nº 876). */

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
          //  §1 (nº 718) — la variante MOYENNE, et c'est le seul écran
          //  qui la demande : ce rond monte à 92 px au web (audit
          //  nº 717), là où tous les autres tiennent en 40. 320 le
          //  couvre au double de la densité.
          src={sourceAvatar(tatoueur.photo_profil, AVATAR_MOYEN)}
          alt={`Photo of ${tatoueur.nom}`}
          decoding="async"
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
      DEMO portfolio: this tattoo artist doesn&apos;t exist, and
      the image is a flat color — no tattoo photo
      is published without its author&apos;s consent.
    </p>
  );

  /**
   * ██ §2 (nº 869) — L'ÉTAT DES CARNETS QUITTE LA LIGNE DES LIENS ██
   * ==================================================================
   * Il vivait en tête de la ligne « Books open · Instagram » (nº 270 →
   * nº 868) ; il se pose depuis SOUS LE TYPE, à droite de l'avatar —
   * c'est la seule chose que la nº 869 lui a faite et qui reste.
   * ⛔ CE QU'ELLE AVAIT FAIT D'AUTRE, ET QUE LA nº 870 ANNULE : un
   * POINT de couleur (vert ouvert, gris sinon) à la place du
   * calendrier, et « Waitlist » à la place du délai chiffré. La note
   * de la nº 870, juste en dessous, dit ce qui les remplace et
   * pourquoi.
   */
  /*  ██ §2 (nº 870) — PLUS DE POINT, LE CALENDRIER REVIENT ██
      ==================================================================
      CE QUE LA nº 869 AVAIT FAIT, ET QUE LE PROPRIÉTAIRE ANNULE : un
      point de couleur (vert ouvert, gris sinon) et un mot — « Waitlist »
      pour un délai, sans son chiffre.
      CE QUE C'EST REDEVENU, la ligne d'avant la nº 869 : L'ICÔNE DE
      CALENDRIER (IconeReseau, revenue avec elle) puis LE TEXTE, sur une
      seule ligne :
            Books open • 5-month wait     (un délai, avec ses mois)
            Books open                    (ouvert, sans délai)
            Books closed                  (fermé)
      LE DÉLAI EST UN CARNET OUVERT (acquis nº 408) : le premier mot le
      dit, la seconde moitié le chiffre — la puce du site les joint
      (`SEPARATEUR_GALERIE`, celle des styles et de « DM • Instagram »),
      au lieu des deux lignes empilées de la nº 408 et de leur
      compensation optique (nº 409), qui n'ont plus lieu d'être.
      ⚠️ RIEN DÉCLARÉ → RIEN AFFICHÉ (acquis nº 273) : le site ne devine
      pas l'état des carnets de quelqu'un.
      ⚠️ ET UN « delai » SANS MOIS SE TAIT, comme avant la nº 869 : sans
      chiffre, la ligne dirait « Books open » là où l'artiste a déclaré
      une attente — ce serait lui faire dire autre chose que ce qu'il a
      coché. */
  const libelleBooking =
    tatoueur.booking === "ouvert" || tatoueur.booking === "delai"
      ? "Books open"
      : tatoueur.booking === "ferme"
        ? "Books closed"
        : null;
  const attenteBooking =
    tatoueur.booking === "delai" && tatoueur.booking_mois
      ? `${tatoueur.booking_mois}-month wait`
      : null;
  const bookingLisible =
    tatoueur.booking === "delai" ? Boolean(attenteBooking) : true;
  const etatDesCarnets =
    libelleBooking && bookingLisible
      ? [libelleBooking, attenteBooking].filter(Boolean).join(SEPARATEUR_GALERIE)
      : null;

  /**
   * ██ §3 (nº 870) — LA LIGNE DU SITE REVIENT, SOUS LA BIO ██
   * ==================================================================
   * Elle avait quitté la liste pour la rangée d'actions (nº 869-§3),
   * où elle était une cible parmi quatre, sous le mot « Website ». Le
   * propriétaire la rappelle À SA FORME D'AVANT : sa propre ligne, son
   * MAILLON à gauche (`IconeDuLien`, nº 240), le titre que l'artiste a
   * choisi — ou le domaine, à défaut (`libelleDuLien`) — et LE BLEU de
   * ce qui sort du site (nº 388/405, le cinquième argument de
   * `lienEnLigne`). Seule sa place change : sous la BIO, et non plus
   * au-dessus d'elle.
   * ⚠️ L'ICÔNE RESTE GRISE quand le mot est bleu : son gris vit sur SA
   * boîte, un autre élément (nº 392) — la note entière est chez
   * `lienEnLigne`.
   * ⚠️ LA PAGE DE LIENS NE REVIENT PAS : le formulaire ne l'écrit plus
   * depuis la nº 270, la consigne ne parle que du SITE WEB, et une
   * ligne que rien ne peut plus remplir est du code mort (nº 386).
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
      /*  §1 (nº 389) — UNE SEULE CLASSE DE COULEUR : `ECRITURE_LIGNE_FICHE`
           n'en porte aucune (voir lignes-profil), le bleu et le gris ne se
           disputent donc pas l'ordre de la feuille.
           §3 (nº 391) — `max-w-full` BORNE LA CASE À SA COLONNE : sans lui,
           le `white-space: nowrap` du `truncate` rend le contenu
           incompressible et la case part à droite, hors de la colonne, où
           un `overflow` la tranche au milieu d'une lettre. */
      className={`group flex max-w-full items-center gap-2.5 ${ECRITURE_LIGNE_FICHE} ${
        sortDuSite
          ? "text-sombre-lien hover:text-sombre-lien-clair"
          : `${LIGNE_GRISE} hover:text-sombre-texte`
      } transition-colors`}
    >
      {/*  §1 (nº 392) — L'ICÔNE EST GRISE, SANS CONDITION : son gris vit
           sur SA boîte, un AUTRE élément que le lien qui porte le bleu —
           un héritage recouvert, pas une dispute d'ordre alphabétique
           (piège nº 389). */}
      <span className={`${BOITE_ICONE_LIGNE} text-sombre-texte-doux`}>
        {icone}
      </span>
      <span className="min-w-0 truncate">{libelle}</span>
    </a>
  );
  /**
   * ██ §2 et §3 (nº 871) — LE BOOKING OUVRE LES LIGNES D'INFORMATION ██
   * ==================================================================
   * Il vivait dans le bloc du nom depuis la nº 869 (sous le type) ; le
   * propriétaire l'en sort : LE BLOC DU NOM REVIENT À L'ÉTAT D'AVANT LA
   * nº 869 — avatar, nom, type — et l'état des carnets devient LA
   * PREMIÈRE LIGNE D'INFORMATION du profil, au-dessus du site.
   * SON ÉCRITURE NE CHANGE PAS D'UN PIXEL, et c'est ce qui la rend
   * naturelle à cette place : c'était déjà celle des lignes d'un profil
   * — la colonne de 22 px pour le glyphe, l'icône en GRIS (nº 392) et
   * le texte en BLANC (nº 552-§1). Le gris vit sur la RANGÉE, donc
   * l'icône le prend et le mot le recouvre : une seule classe de
   * couleur par élément (piège nº 389).
   * ██ §2 (nº 872) — ELLE REMONTE AU-DESSUS DES BADGES ██
   * ==================================================================
   * La nº 871 en avait fait la première ligne de la LISTE, sous la
   * rangée d'actions. Le propriétaire la place JUSTE SOUS LE BLOC DU
   * NOM, au-dessus des badges : l'état des carnets se lit avant qu'on
   * décide de suivre — l'ordre devient bloc du nom, booking, badges,
   * puis les lignes (site, bio, styles, techniques, adresse).
   * SON AIR EST CELUI DE L'EN-TÊTE, et il est REPRIS DE LA RANGÉE (§5-a
   * de la nº 870) : QUARANTE PIXELS sous le bas de l'avatar, la valeur
   * exacte qui sépare le va-et-vient du HAUT de l'avatar (le `mt-10`
   * du bloc du nom, nº 241). L'en-tête garde donc ses deux airs égaux
   * au-dessus et au-dessous de la photo — c'est simplement le booking,
   * et non plus la rangée, qui reçoit le second.
   * ⚠️ ELLE PORTE SA MARGE ELLE-MÊME, et c'est possible parce qu'elle
   * n'a QU'UNE SEULE place (piège nº 378/379) : hors de la liste, plus
   * personne ne l'écarte pour elle.
   */
  const ligneDuBooking = etatDesCarnets && (
    <p
      data-booking-fiche={tatoueur.booking}
      /*  ██ §1 (nº 874) — LES DEUX AIRS DE L'EN-TÊTE, ÉGAUX À L'ŒIL ██
          ------------------------------------------------------------------
          LE PROPRIÉTAIRE VOIT LE SECOND PLUS GRAND, et il a raison : les
          deux sont pourtant écrits `mt-10` — quarante pixels de BOÎTE à
          BOÎTE, au-dessus comme au-dessous de cette ligne (le relevé le
          confirme : 40,0 et 40,0). CE QUE L'ŒIL MESURE, LUI, C'EST
          L'ENCRE, et l'encre de cette ligne n'est pas centrée dans sa
          boîte : relevé sur les pixels d'une capture au doigt (DPR 2),
          l'air vaut 41,5 px sous l'avatar et 43,0 px sous le booking.
          LA CAUSE, ET ELLE EST STRUCTURELLE : la boîte de cette ligne
          fait 20,6 px (la boîte d'icône, `1.375em`) pour une encre de
          16 px — le glyphe du calendrier est dessiné en retrait dans sa
          grille de 24, et le texte n'a ici aucun jambage. Il reste donc
          1,5 px de vide au-dessus de l'encre et 3,1 px en dessous : 1,6
          px d'écart, exactement ce que le propriétaire voit.
          LE REMÈDE, ET IL EST POSÉ SUR LA LIGNE QUI PORTE LE DÉFAUT :
          elle rend DEUX PIXELS par le bas (le pixel entier le plus
          proche des 1,6 mesurés — la grille du site, et un demi-pixel
          d'écart résiduel, invisible même à DPR 2). Ce qui la suit —
          la rangée des badges aujourd'hui — remonte d'autant, et les
          deux airs se lisent à 41,5 px l'un comme l'autre.
          ⚠️ POURQUOI PAS SUR LA RANGÉE : elle n'est pas la cause, et
          elle n'est pas seule à suivre cette ligne (une fiche sans
          Instagram, un aperçu, une fenêtre : la rangée change, la ligne
          du booking non). La correction appartient à la boîte qui a le
          vide, pas à sa voisine. */
      className={`mt-10 -mb-[2px] flex ${ECRITURE_LIGNE_FICHE} ${LIGNE_GRISE} items-start gap-2.5`}
    >
      <span className={BOITE_ICONE_LIGNE}>
        <IconeCalendrier taille={20} />
      </span>
      <span className="min-w-0 text-sombre-texte">{etatDesCarnets}</span>
    </p>
  );

  const ligneDuSite = tatoueur.site_web && (
    lienEnLigne(
      "site",
      tatoueur.site_web,
      tatoueur.titre_site_web || libelleDuLien(tatoueur.site_web),
      //  §1 (nº 240) — LE MAILLON EST DESSINÉ DANS LE CODE, comme toutes
      //  les icônes de lien du site (IconeReseau) : monochrome, en
      //  `currentColor`. Un seul appelant depuis la nº 870 — le site —,
      //  donc l'aiguillage à deux branches de la nº 240 n'est plus
      //  écrit ici : on nomme le dessin qu'on veut (règle nº 386).
      <IconeDuLien reseau="site" taille={20} />,
      true
    )
  );

  /**
   * ██ §3 (nº 869), REFAIT PAR LA §4 (nº 870) — LA RANGÉE D'ACTIONS ██
   * ==================================================================
   * TROIS BADGES à angles arrondis qui occupent ENSEMBLE toute la
   * largeur (`ActionDeFiche`, l'écriture unique des trois) :
   *  · « Follow » / « Following » et « Instagram » (si renseigné) —
   *    l'icône à GAUCHE du mot, et LA MÊME LARGEUR pour les deux : ils
   *    se partagent à parts égales ce que le partage laisse (`large`,
   *    une part de rangée, jamais une largeur écrite) ;
   *  · LE PARTAGE — petit badge carré, icône seule, qui complète la
   *    largeur.
   * Même hauteur pour les trois (44 px, la mesure tactile du site), et
   * la robe des badges d'action — la note est chez `ActionDeFiche`.
   * ⛔ LES CARRÉS DE LA nº 869 (48 px, le mot dessous, le patron Google
   * Maps) SONT PARTIS, et « Website » avec eux : il a retrouvé sa ligne
   * sous la bio (§3).
   * FOLLOW ET SHARE SONT TOUJOURS LÀ : la rangée n'a jamais une icône
   * seule — au minimum ces deux-là. Follow garde exactement son état
   * et son geste (BoutonSuivre : même écriture en base, même retour
   * sur la page d'avant, nº 868) ; Share est le même bouton que
   * partout (BoutonPartageFiche). Ni l'un ni l'autre ne vivent plus
   * dans la rangée du va-et-vient (§4).
   * LES COLONNES SONT ÉGALES : quatre, trois ou deux actions se
   * partagent la largeur de la colonne, chacune centrée dans la
   * sienne — c'est la grille, pas un calcul.
   * ⚠️ INSTAGRAM SORT DU SITE dans un nouvel onglet, comme la ligne
   * qu'il remplace. Il n'est plus BLEU (nº 388) : dans un badge, le
   * bleu du lien se battrait avec l'aplat qui le porte — c'est le mot
   * qui dit où l'on va. Le bleu de ce qui sort du site reste aux
   * LIGNES : le site (§3, nº 870) et l'adresse (BlocLieux).
   * ⛔ CE QUI N'EST PLUS ÉCRIT, ET JE LE DIS : la mention « DM »
   * d'Instagram (nº 408-409) — un badge porte un mot, pas une phrase —
   * et la PAGE DE LIENS (`page_de_liens`, nº 227 : le formulaire ne
   * l'écrit plus depuis la nº 270, et la consigne de la nº 870 ne parle
   * que du site web). Les données restent en base, on ne les lit plus :
   * le traitement de TikTok (nº 387).
   * ⚠️ LE TITRE CHOISI DU SITE, LUI, EST REVENU avec sa ligne
   * (`titre_site_web`, §3 nº 870).
   * ⚠️ UNE FICHE DE DÉMONSTRATION n'a pas de « Follow » (on ne suit
   * pas ce qui n'existe pas en base, BoutonSuivre) : sa rangée
   * commence à Instagram.
   */
  const rangeeDActions = (
    <div
      data-rangee-actions=""
      /*  ██ §5 (nº 870, REPRIS PAR LA nº 872) — LES DEUX AIRS ██
          (a) AU-DESSUS — QUARANTE PIXELS, et ce n'est pas une valeur
          choisie : c'est EXACTEMENT l'air qui sépare le va-et-vient du
          haut de l'avatar (le `mt-10` du bloc du nom, nº 241).
          ⚠️ CE QU'IL MESURE A CHANGÉ À LA nº 872, PAS SA VALEUR : la
          ligne du booking s'est glissée entre l'avatar et la rangée, et
          c'est ELLE qui reçoit désormais l'air de l'en-tête sous la
          photo (sa note le dit). Cette marge-ci écarte donc la rangée
          DU BOOKING, à la même valeur : l'en-tête garde son rythme.
          (b) EN DESSOUS — l'air standard entre deux blocs du profil, et
          il est écrit UNE SEULE FOIS, sur la liste qui suit (son `mt-6`,
          la valeur de son propre `gap-y-6`) : rien ici (piège nº 378).
          ⚠️ L'ÉCART ENTRE LES TROIS BADGES (8 px) N'EST PAS UN AIR DE
          BLOC : c'est la couture d'une rangée, elle n'a pas à suivre les
          deux valeurs ci-dessus. */
      className="mt-10 flex w-full items-stretch gap-2"
    >
      <BoutonSuivre
        tatoueurId={tatoueur.id}
        nomTatoueur={tatoueur.nom}
        suiviAuDepart={suiviAuDepart}
      />
      {tatoueur.lien_instagram && (
        <ActionDeFiche
          cle="instagram"
          //  §4 (nº 870) — le second badge à part égale (voir Follow).
          large
          href={tatoueur.lien_instagram}
          ariaLabel={`${tatoueur.nom} on Instagram`}
          icone={<IconeInstagram taille={20} />}
          mot="Instagram"
        />
      )}
      <BoutonPartageFiche
        nomArtisan={tatoueur.nom}
        cheminFiche={`/artist/${tatoueur.slug}`}
        variante="rangee"
        avecFenetre
        sombre
        metier={
          tatoueur.styles?.[0] ? libelleStyle(tatoueur.styles[0]) : undefined
        }
        commune={villeAffichee(tatoueur.ville_nom)}
        marque={MARQUE_YOKOFOLIO.nom}
        //  §5 (nº 667) — chez yokofolio on partage un PORTFOLIO ; le
        //  bouton sert aussi les artisans, qui gardent « fiche ».
        objet="portfolio"
      />
    </div>
  );

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
   * ⚠️ ILS RESTENT DES LIENS vers /tattoo/<style>/<ville> : c'est la
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
  /*  ██ §1 (nº 496) — `separation` EST SUPPRIMÉE ██
      Elle composait le trait horizontal posé au-dessus d'une section
      de bas de fiche. La nº 492 lui a retiré ses deux porteurs sur un
      LIEU, la nº 496 le dernier sur un ARTISTE : plus une seule
      section de cette fiche ne se sépare par un trait. La constante
      n'avait donc plus de lecteur, et une constante sans lecteur est
      une invitation à en refabriquer un.
      ⚠️ `TRAIT_SEPARATION` RESTE, et il sert toujours : le sélecteur
      « Profil / Portfolio » pose son propre soulignement avec, plus
      bas dans ce fichier. C'est la COMPOSITION qui part, pas le
      jeton. */

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
   * /tattoo/<style>/<ville>, la valeur de référencement du site.
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
   * LES STYLES RESTENT DES LIENS : `/tattoo/<style>/<ville>`,
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
   * §1 (nº 386), DÉPASSÉ PAR LA nº 488 — LES PRATIQUES AVAIENT
   * REJOINT LA LISTE D'INFORMATIONS.
   * ==================================================================
   * CE QUE CETTE PASSE AVAIT FAIT, et qui tient toujours : la section
   * « Pratique » de la nº 315-§2 — titre en capitales, trait de
   * séparation, capsules — a disparu, section entière, trait compris.
   * Les pratiques sont devenues une LIGNE de la liste, écrite comme
   * celle des styles.
   * ⚠️ CE QUI N'EST PLUS VRAI DEPUIS LA nº 488 : les deux lignes n'en
   * font plus qu'UNE, leurs valeurs sont redevenues des étiquettes à
   * fond uni, et les styles ne sont plus des liens. La note qui fait
   * foi est celle juste dessous.
   */
  /**
   * ██ §1 (nº 488, REPRIS À LA nº 489) — TECHNIQUES ET STYLES : DEUX
   * LIGNES, DES CAPSULES ██
   * ==================================================================
   * CE QUE LA nº 488 AVAIT FAIT, et que cette passe ANNULE : elle
   * avait fondu les deux familles sur UNE seule ligne, ouverte par la
   * seule étoile, et retiré le diamant. Le propriétaire revient
   * dessus — les DEUX lignes reprennent leur place, chacune avec son
   * icône : le DIAMANT ouvre les techniques, l'ÉTOILE ouvre les
   * styles, l'une et l'autre à la taille, à la couleur et à la place
   * qu'elles avaient (les boîtes partagées de la liste, rien de
   * redessiné).
   * CE QUE LA nº 488 GARDE, ET QUI NE BOUGE PAS : les valeurs restent
   * des ÉTIQUETTES À FOND UNI, sans bordure, non cliquables ; les
   * techniques sur `bg-sombre-eleve`, les styles d'un cran plus clair
   * sur `bg-sombre-eleve-clair` — deux crans voisins de l'échelle
   * (nº 466), distingués par la CLARTÉ et jamais par un trait.
   *
   * L'AIR ENTRE LES DEUX LIGNES EST CELUI DE LA LISTE : elles sont
   * rendues comme SŒURS des autres informations, donc l'écart vertical
   * de leur conteneur les sépare — VINGT-QUATRE pixels depuis la
   * nº 538 (vingt auparavant), exactement l'air qui vaut entre le
   * booking, le site, l'adresse et les horaires. Aucune marge n'est
   * posée sur les lignes elles-mêmes ; la valeur ne s'écrit qu'à un
   * seul endroit, sur la liste (§5).
   * (L'écart de seize pixels que la nº 488 posait ENTRE LES DEUX
   * GROUPES d'une même ligne n'a plus d'objet : il n'y a plus qu'une
   * famille par ligne. Les six pixels entre capsules d'une même
   * famille, eux, restent.)
   *
   * ⚠️ CE QU'ON A PERDU À LA nº 488, ET QUI RESTE PERDU : les styles
   * étaient des LIENS vers la vitrine « ce style, dans cette ville ».
   * Ce sont des étiquettes depuis, sur décision du propriétaire, et
   * cette passe ne les rend pas cliquables.
   * ⚠️ CHAQUE LIGNE SE CONDITIONNE SÉPARÉMENT : une fiche sans
   * technique n'affiche pas de diamant orphelin, une fiche sans style
   * pas d'étoile — le piège de la nº 386.
   * ⚠️ RAYON `rounded-lg` (8 px, nº 449), et retour à la ligne propre
   * par `flex-wrap` : au doigt comme au web, sans variante.
   *
   * ⚠️ DEPUIS LA nº 490, LE DESSIN N'EST PLUS ÉCRIT ICI : il vit dans
   * `LigneDeCapsules`, en tête de ce fichier, parce qu'il lui faut un
   * état (le pli) et une mesure — deux choses qu'une fonction locale
   * appelée au fil du rendu ne peut pas tenir. Ce qui est décrit
   * ci-dessus n'a pas changé pour autant : mêmes fonds, même écriture,
   * même rayon, mêmes deux lignes conditionnées séparément. S'y
   * ajoutent la boîte d'icône à la hauteur d'une capsule (§1) et le
   * pli au-delà de deux lignes (§2).
   */
  const aDesPratiques = capsulesPratique.length > 0;
  const aDesStyles = tatoueur.styles.length > 0;
  /*  ██ §3 (nº 874) — SOUS TROIS STYLES, LES DEUX BLOCS N'EN FONT QU'UN ██
      ==================================================================
      DÉCISION DU PROPRIÉTAIRE : un profil qui déclare MOINS DE TROIS
      styles ne montre plus deux lignes de badges mais UNE SEULE — les
      styles, puis les compétences, à la suite. Au-delà de deux lignes,
      la seconde finit par « +N ⌄ », le mécanisme existant (nº 491), sans
      un mot de plus : c'est la MÊME ligne, avec deux familles au lieu
      d'une (voir `LigneDeCapsules`).
      POURQUOI TROIS, ET POURQUOI CE SENS : un ou deux styles ne
      remplissent pas leur ligne — la seconde ligne, en dessous,
      ressemblait alors à un second bloc pour rien. À partir de trois, la
      ligne des styles se tient toute seule et les deux familles restent
      séparées, comme depuis la nº 868.
      ⚠️ LES MARQUES DE RELEVÉ DISENT LA VÉRITÉ : la ligne fusionnée porte
      `data-styles-fiche` ET `data-pratique-fiche` — elle contient bien
      les deux — plus `data-capsules-fusionnees`, qui dit l'état. Une
      famille absente ne pose pas sa marque : une fiche sans compétence
      n'annonce pas une ligne de compétences.
      ⚠️ LA CLÉ D'UNE CAPSULE PORTE SA FAMILLE : un style et une
      compétence peuvent partager un slug (voir `LigneDeCapsules`). */
  const capsulesDesStyles = tatoueur.styles.map((slug) => ({
    cle: `style:${slug}`,
    mot: libelleStyle(slug),
  }));
  const capsulesDesPratiques = capsulesPratique.map((slug) => ({
    cle: `pratique:${slug}`,
    mot: libelleFiltre(slug),
  }));
  const fusionnees = tatoueur.styles.length < 3;
  const marqueDesStyles = aDesStyles ? ["data-styles-fiche"] : [];
  const marqueDesPratiques = aDesPratiques ? ["data-pratique-fiche"] : [];
  const ligneDesPratiques = fusionnees ? null : (
    <LigneDeCapsules
      marqueurs={marqueDesPratiques}
      /*  ██ §1 (nº 869) — PLUS D'ICÔNE EN TÊTE DE LIGNE ██
          Décision du propriétaire : les badges d'un profil s'écrivent
          texte seul, contour, gris. L'étoile (techniques) et la goutte
          (styles) de la nº 868-§6 sont parties : la goutte reste celle
          du va-et-vient de l'accueil ; l'étoile de la liste des liens
          n'avait plus de lecteur et a quitté IconeReseau (règle nº 386).
          Les deux lignes se distinguent par leur ordre (les styles
          d'abord, nº 868-§5) et par leurs mots. */
      capsules={capsulesDesPratiques}
      fond={FOND_CAPSULE}
    />
  );
  const ligneDesStyles = (
    <LigneDeCapsules
      marqueurs={[
        ...marqueDesStyles,
        //  §3 (nº 874) — fusionnée : elle porte aussi les compétences,
        //  et le dit.
        ...(fusionnees ? [...marqueDesPratiques, "data-capsules-fusionnees"] : []),
      ]}
      //  §1 (nº 869) — sans icône, comme la ligne des techniques.
      capsules={
        fusionnees
          ? [...capsulesDesStyles, ...capsulesDesPratiques]
          : capsulesDesStyles
      }
      /*  ██ §1 (nº 504) — LES DEUX FAMILLES AU MÊME FOND ██
          Les styles étaient un cran plus clair que les techniques
          (`eleve-clair` contre `eleve`) : deux gris séparés par 0,022
          de luminosité, que le propriétaire ne distinguait pas. Ils
          prennent donc le fond des PLAQUES, comme les techniques.
          CE QUI PORTE LA DIFFÉRENCE MAINTENANT : l'ICÔNE en tête de
          ligne — le diamant des techniques, l'étoile des styles
          (acquis nº 489). Une forme se lit ; un demi-cran de gris,
          non. */
      fond={FOND_CAPSULE}
    />
  );

  /*  §6 (nº 415) — LA LISTE DES LIEUX A-T-ELLE QUELQUE CHOSE À DIRE ?
      C'est `modesOrdonnes` qui répond, la MÊME fonction que celle dont
      `BlocProfilsArtiste` construit sa liste (lib/modes-exercice).
      ⚠️ CETTE GARDE RESTE APRÈS LA nº 418, et elle n'a jamais dépendu
      du mode supprimé : un artiste qui n'a déclaré AUCUN mode fait
      rendre `null` au bloc, et le trait de séparation — posé par
      l'enveloppe — s'afficherait seul avec ses 80 px de dégagement
      au-dessus du vide. C'est le piège de la nº 386. */
  const aDesLieuxAMontrer = modesOrdonnes(tatoueur.modes).length > 0;

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
        * LA BUTÉE — LA HAUTEUR DE LA BARRE DU LOGO, ET CE NOMBRE N'EST
        * PAS ÉCRIT ICI (il valait 64 jusqu'à la nº 886, qui l'a rendu à
        * la barre réelle : 70) :
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
         * config/tattoo). Aucune couleur ni épaisseur inventée, et
         * comme il est porté par la rangée débordée, il court d'un bord
         * à l'autre, marges comprises. Partout : page et fenêtre.
         *
         * ⚠️ LE CAPOT SUIT SANS RIEN FAIRE : il est `absolute
         * inset-x-0` DANS cette boîte — il s'élargit avec elle, et
         * couvre donc enfin toute la largeur au-dessus de la rangée.
         */
        /*  ██ §4 (nº 869) — LE VA-ET-VIENT EST SEUL DANS LA RANGÉE ██
             « Follow » et « Share » vivent dans la rangée d'actions du
             profil (§3) ; la rangée n'a plus qu'un enfant, qui la prend
             entière — plus de répartition, plus d'écart. Le collage, le
             trait, le fond et les débords ne bougent pas. */
        className={`relative
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
                      * BAS : le rembourrage des deux bords (12 px en
                      * haut comme en bas) ne garde que son HAUT. Le
                      * badge vient toucher le bas de la rangée, et le
                      * trait passe donc juste sous lui. Sur le web,
                      * c'était déjà le cas — aucune classe n'y est
                      * ajoutée.
                      */
                     /**
                      * ██ §3 (nº 458) — LE COLLAGE SANS SURSAUT ██
                      * ==================================================
                      * LA CAUSE, NOMMÉE : un DÉCALAGE DE 16 px ENTRE LA
                      * POSITION NATURELLE ET LE HAUT DE COLLAGE. La
                      * rangée est le premier élément de la colonne, dont
                      * la racine porte `pt-4` (16 px) : au repos elle vit
                      * à réserve (64) + 16 = 80 px du haut du document,
                      * alors que son collage est écrit à 64
                      * (`--rw-rangee-collante`). Un élément collant
                      * VOYAGE librement entre sa position naturelle et
                      * son haut de collage : la rangée parcourait donc
                      * ces 16 px à l'écran — elle « remontait » — avant
                      * de se bloquer, et les reparcourait en sens
                      * inverse en haut de page.
                      * LE REMÈDE : supprimer le trajet — `mobile:-mt-4`
                      * annule le `pt-4` pour cette rangée : sa position
                      * naturelle DEVIENT le haut de collage (64 = 64),
                      * et elle est parfaitement statique, collée dès le
                      * premier pixel de défilement. C'est aussi la
                      * réduction d'air demandée : l'air entre la barre
                      * et la rangée passe de 16 px à 0 — l'air INTERNE
                      * au-dessus des badges (12 px de rembourrage,
                      * nº 380/381) ne bouge pas : l'œil garde 12 px
                      * entre le verre et le va-et-vient, contre 28
                      * avant.
                      * ⚠️ LE WEB N'A JAMAIS EU CE TRAJET : sa rangée
                      * colle à `lg:top-0` de la colonne dont elle est
                      * le premier élément — position naturelle 0,
                      * collage 0.
                      *
                      * ██ §3 (nº 473) — L'APERÇU L'APPLIQUE AUSSI ██
                      * LA nº 458 EN AVAIT EXCEPTÉ L'APERÇU, sur une
                      * raison qui n'est pas (ou plus) exacte : « la
                      * racine de Ma fiche n'a pas ce `pt-4` ». Elle
                      * l'a — `FormulaireFiche` enveloppe l'aperçu dans
                      * `px-3 sm:px-6 pt-4 lg:pt-5 pb-0` (l. 2701).
                      * CE QUE CELA DONNAIT, mesuré dans le code :
                      *  · fiche publique — 16 (pt-4 de la racine) − 16
                      *    (cette remontée) + 12 (le `pt-3` interne)
                      *    = 12 px entre la barre et les onglets ;
                      *  · aperçu — 16 + 12 = 28 px, SANS la remontée.
                      * Seize pixels de trop : l'espacement que le
                      * propriétaire voit au-dessus du va-et-vient.
                      * La remontée s'applique donc aux DEUX vues, avec
                      * la même valeur — elle annule le `pt-4` qui la
                      * précède, dans un cas comme dans l'autre, et rien
                      * ne peut déborder sur le bandeau. L'aperçu tombe
                      * à 12 px : la fiche publique au pixel, et elle,
                      * ne bouge pas d'un cheveu.
                      */
                     /**
                      * §2 (nº 474) — L'AIR AU-DESSUS DU VA-ET-VIENT SE
                      * RESSERRE : 12 px → 8 px (`mobile:pt-2`). C'est
                      * le rembourrage INTERNE du haut de cette rangée —
                      * la SEULE écriture de cet air (nº 380/381), et
                      * elle est UNIFIÉE depuis la nº 473 : la fiche
                      * publique et l'aperçu suivent ensemble, au pixel.
                      * RIEN NE SE COLLE : le collage de la nº 458 ne
                      * passe pas par ce rembourrage (position naturelle
                      * = haut de collage, avec ou sans lui), le fond
                      * opaque couvre toujours l'air restant, et 8 px
                      * séparent encore le verre du va-et-vient — c'est
                      * un rembourrage nul qui les collerait. Le web
                      * n'est pas concerné (variante du doigt).
                      */
                     collantSousLaBarre
                       ? "mobile:sticky mobile:top-[var(--rw-rangee-collante)] mobile:z-[3] mobile:pt-2 mobile:-mt-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-3 lg:px-3"
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
        {/*  §4 (nº 472) — ANNULÉ PAR LA nº 473 : le `flex-1` qui
             étirait le va-et-vient en aperçu est retiré. Il reprend sa
             largeur naturelle, à gauche — celle de la fiche publique,
             qui est désormais LA référence des deux vues. */}
        <SelecteurOngletAffiche
          valeur={onglet}
          surChoix={adresses ? undefined : choisirOnglet}
          adresses={adresses ?? undefined}
          surDepart={avantDePartir}
        />
        {/*  ██ §4 (nº 869) — PLUS DE PARTAGE NI DE « SUIVRE » ICI ██
             Les deux gestes (nº 458 → nº 868 : le partage en habillage
             « icone », le badge « Suivre », leur alignement sur les
             onglets, nº 852) ont quitté cette rangée pour la rangée
             d'actions du profil (`rangeeDActions`, §3). Le va-et-vient
             occupe toute la largeur, chaque onglet la moitié, le mot
             centré — comme celui de « Ma sélection », le même
             composant (SelecteurOngletAffiche). */}
      </div>

      {/*  ██ §1, §3 ET §4 (nº 873) — LES PAGES PORTFOLIO ET FLASH ██
           ==========================================================
           Une catégorie par page, ses galeries calculées une fois
           (`galeries`, plus haut). SANS PHOTO (§4) : l'écran vide du
           site — la phrase de la catégorie (« No tattoos yet. »,
           « No flash yet. », config/tatouage) et sa capsule, web et
           doigt, le motif de « Ma sélection » (EcranVideSelection).
           AVEC : LE FIL DE GALERIES (FilDeGalerie).
           ██ §3 (nº 876) — AUX DEUX APPAREILS ██ : le panneau de
           galeries par style du web (PanneauPortfolio) est supprimé,
           code compris — au web, les cartes de galerie du mobile, une
           par rangée, pleine largeur dans les marges. Un seul HTML, un
           seul composant ; l'appareil ne décide que de la mécanique de
           la photo, chez lui. */}
      {categorie &&
        (galeries.length === 0 ? (
          <EcranVideSelection message={categorie.vide} marque="data-page-vide" />
        ) : (
            <FilDeGalerie
              tatoueur={tatoueur}
              galeries={galeries}
              //  §3 (nº 877) — le clic d'une photo remonte jusqu'ici,
              //  puis jusqu'à l'affiche (voir la propriété).
              surSerieChoisie={surSerieChoisie}
              //  Le style principal, pour le message de partage — ce que
              //  la vue photo donne à son pied (FicheTatoueur).
              metier={tatoueur.styles[0] ? libelleStyle(tatoueur.styles[0]) : ""}
              //  §6 (nº 853) — les vues arrivent de la base avec la fiche.
              vues={tatoueur.vues}
              apercu={apercu}
            />
        ))}

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
              {/*  ██ §2 (nº 871) — LE BLOC DU NOM SE REFERME ██
                   L'AVATAR, LE NOM, LE TYPE — RIEN D'AUTRE, l'état
                   d'avant la nº 869. L'état des carnets, que la nº 869
                   avait posé ici et que la nº 870 y avait laissé, ouvre
                   désormais LES LIGNES D'INFORMATION, plus bas (§3) : il
                   décrit le portfolio, il ne nomme pas la personne.
                   ⚠️ CE QUE ÇA REND, ET C'EST LE POINT : le bloc
                   redevient DEUX lignes dans les 92 px de l'avatar
                   (nº 241-§2), donc parfaitement centré sur lui — il
                   l'était déjà à trois, mais tout juste. */}
            </div>
          </div>

          {/* ==========================================================
              §2 (nº 872) — L'ÉTAT DES CARNETS, SOUS LE BLOC DU NOM
              ==========================================================
              La ligne du booking (voir `ligneDuBooking`) : elle porte
              son air d'en-tête — quarante pixels sous l'avatar, la
              valeur qui sépare le va-et-vient du haut de la photo. */}
          {ligneDuBooking}

          {/* ==========================================================
              §4 (nº 870) — LA RANGÉE D'ACTIONS
              ==========================================================
              Trois badges : Follow, Instagram (si renseigné) et le
              partage (voir `rangeeDActions`). Ses deux airs sont dits
              chez elle et sur la liste qui suit (§5). */}
          {rangeeDActions}

          {/* ==========================================================
              LA LISTE — la bio, les styles, les techniques, l'adresse
              ==========================================================
              §3 (nº 871) — L'ORDRE DU PROPRIÉTAIRE, de haut en bas : le
              bloc du nom (avatar, nom, type), la rangée d'actions, LE
              BOOKING, LE SITE, LA BIO, LES STYLES, LES TECHNIQUES,
              l'adresse, puis les horaires (qui vivent dans les sections
              du bas et ne bougent pas). Deux choses bougent depuis la
              nº 870 : le booking descend du bloc du nom pour ouvrir
              cette liste, et LA BIO PASSE DERRIÈRE LE SITE — les deux
              lignes courtes d'abord, le paragraphe ensuite.
              Les deux GRILLES de liens qui ouvraient cette liste
              (nº 233-§5, 384, 407, 408) ne sont pas revenues : le site
              est seul de sa ligne, il n'a pas de colonne voisine.
              §2 (nº 490) — LA GARDE INTERROGE LES LISTES, PLUS LES
              ÉLÉMENTS : `LigneDeCapsules` est un composant, son élément
              JSX existe même vide — on teste les longueurs, qui sont la
              vérité (une fiche sans bio, sans technique et sans style
              n'ouvre pas ce conteneur pour rien). */}
          {(Boolean(ligneDuSite) ||
            Boolean(tatoueur.bio) ||
            aDesPratiques ||
            aDesStyles) && (
            <div
              /*  ██ §2 (nº 874) — L'AIR STANDARD DE LA LISTE EST VINGT-HUIT ██
                   ==========================================================
                   LE PROPRIÉTAIRE DÉFINIT L'AIR STANDARD ENTRE BLOCS comme
                   « l'air entre la bio et les badges de styles » — vingt-huit
                   pixels, mesurés. C'était la seule valeur JUSTE de la liste,
                   et c'était une EXCEPTION : l'écart valait vingt-quatre, et
                   la bio ajoutait quatre pixels de rembourrage de part et
                   d'autre (nº 868-§5) pour atteindre ses vingt-huit.
                   DEUX VALEURS POUR UN MÊME AIR, DONC, et un site où l'air
                   « standard » dépendait du voisin : le rembourrage de la bio
                   s'en va, l'écart de la liste PREND la valeur nommée, et il
                   n'y a plus qu'un seul air entre deux blocs — le site, la
                   bio, les styles, les techniques, l'adresse, tous à
                   vingt-huit, présents ou absents.
                   ⚠️ CE QUE CELA DÉPLACE, ET JE LE DIS : l'air entre les
                   styles et les techniques passe de 24 à 28 (quand les deux
                   lignes existent — sous trois styles elles n'en font plus
                   qu'une, §3), et l'air sous la rangée d'actions suit, par la
                   règle de la nº 870-§5b qui le veut ÉGAL à l'air standard :
                   son `mt-7` est la jumelle du `gap-y-7`, écrite à côté de
                   lui pour qu'elles ne puissent pas diverger (piège nº 378).
                   §5 (nº 389, REPRIS À LA nº 538) — L'ÉCART PARTAGÉ : 16 px
                   à la nº 389, 20 puis VINGT-QUATRE depuis la nº 538. C'est
                   le SEUL endroit qui l'écrit — aucune marge n'est posée
                   sur les lignes elles-mêmes ; c'est la LISTE qui commande,
                   et une ligne absente ne laisse donc aucun vide. Le rythme
                   tient : 24 entre deux lignes, 28 autour de la bio
                   (nº 868) — VINGT-HUIT PARTOUT depuis la nº 874 (voir
                   ci-dessus). Les plaques et leurs mentions (nº 496-497) ne
                   sont pas dans cette liste.
                   ██ §5-b (nº 870) — L'AIR SOUS LA RANGÉE D'ACTIONS ██
                   Il valait 40 (la marge basse d'un en-tête, nº 241) ; le
                   propriétaire le veut ÉGAL À L'AIR STANDARD ENTRE LES
                   BLOCS DU PROFIL — celui que cette liste écarte
                   elle-même entre la bio, le site, les styles et
                   l'adresse. C'est donc la MÊME VALEUR QUE SON PROPRE
                   `gap-y-7` depuis la nº 874, VINGT-HUIT, et elle est
                   écrite ici, une fois, à côté de lui : les deux ne
                   peuvent plus diverger (piège nº 378). Mesuré à
                   l'écran, la première ligne de la liste tombe donc à 28
                   de la rangée, quelle qu'elle soit — la bio n'a plus de
                   rembourrage à ajouter. */
              className="mt-7 flex w-full flex-col items-start gap-y-7"
            >
              {/*  ██ §5 (nº 868) — LA BIOGRAPHIE EST UNE RANGÉE DE LA
                   LISTE ██ Elle vivait SOUS la liste depuis toujours ;
                   la nº 868 l'y a fait entrer, la nº 871 la place APRÈS
                   le booking et le site (l'ordre du propriétaire).
                   ⚠️ SON AIR NE CHANGE PAS D'UN PIXEL, et c'est le sens
                   du rembourrage vertical d'un cran : la liste écarte
                   ses rangées de 24 px, la bio était séparée de 28
                   (`mt-7`) — quatre de plus en haut comme en bas la lui
                   rendent, sans toucher au reste. Le rythme tient : 24
                   entre deux lignes, 28 autour de la bio, 40 entre deux
                   sections.
                   ⚠️ ET SA LARGEUR NON PLUS : cette colonne aligne ses
                   enfants à gauche (`items-start`), une rangée doit donc
                   réclamer la largeur.
                   ⚠️ SON REMBOURRAGE DE QUATRE PIXELS EST PARTI À LA
                   nº 874-§2 : il servait à porter SON air à vingt-huit
                   quand la liste en écartait vingt-quatre ; la liste les
                   écarte tous de vingt-huit désormais, il en ferait
                   trente-deux. */}
              {tatoueur.bio && (
                <p className="w-full text-[15px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
                  {tatoueur.bio}
                </p>
              )}
              {/*  ██ §2 (nº 874) — LE SITE PASSE SOUS LA BIO ██
                   Décision du propriétaire : l'ordre devient bio → site →
                   styles. La nº 870 l'avait posé sous la bio, la nº 871
                   au-dessus ; il y retourne, avec l'air standard de la
                   liste au-dessus comme en dessous — c'est ce que le
                   propriétaire demande, et ce que la liste donne
                   désormais à tous ses blocs sans exception (voir la note
                   de l'écart, plus haut). Une rangée de la liste comme
                   les autres, sans grille : un lien seul n'a pas de
                   colonne voisine, et sa case se borne d'elle-même
                   (`max-w-full` + `truncate`, nº 391/407). */}
              {ligneDuSite}
              {/*  §5 (nº 868) — LES STYLES PASSENT DEVANT LES TECHNIQUES
                   (l'ordre du propriétaire) : ce sont eux qu'on cherche
                   d'abord sur un portfolio. Les deux lignes ne changent
                   ni de robe, ni d'écart. */}
              {ligneDesStyles}
              {ligneDesPratiques}
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

          {/*  §3 — LA BIOGRAPHIE (retours à la ligne saisis respectés,
               mots sans espace coupés proprement) A REJOINT LA LISTE
               ci-dessus à la nº 868-§5, entre le site et les styles :
               c'est l'ordre du propriétaire. Elle n'est plus rendue
               ici. */}

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
              Un artiste peut n'avoir déclaré AUCUN mode, et
              `BlocProfilsArtiste` ne rend alors rien. Le trait, lui,
              vit ICI — il s'afficherait seul, avec ses 40 px de
              marge et ses 40 px de dégagement, au-dessus du vide.
              C'est exactement le piège de la nº 386, et la parade est
              la même : le conteneur ne se rend que s'il a un contenu,
              et la question est posée par la MÊME fonction que celle
              qui construit la liste. */}
          {tatoueur.type_fiche === "artiste" ? (
            aDesLieuxAMontrer && (
              /*  ██ §1 (nº 496) — LE DERNIER TRAIT DE LA FICHE D'ARTISTE ██
                   La nº 492 avait retiré les deux traits qui encadraient
                   l'équipe d'un lieu, et LAISSÉ celui-ci : un artiste
                   n'a pas d'équipe, sa section de profils n'était pas
                   visée. Elle l'est maintenant — les lieux d'un artiste
                   prennent la plaque de l'équipe, ils en prennent aussi
                   l'absence de trait.
                   L'AIR SE LIT SEUL, comme à la nº 492 : la séparation
                   valait 40 px au-dessus et 40 en dessous. Sans trait à
                   encadrer, ces deux airs se cumuleraient en 80 px de
                   vide ; il n'en reste QU'UN, les 40 px du `mt-10`. */
              <div className="mt-10">
                <BlocProfilsArtiste tatoueur={tatoueur} />
              </div>
            )
          ) : (
            /*  ██ §1 (nº 492) — LE TRAIT AU-DESSUS DE L'ÉQUIPE S'EN VA ██
                 Sur un lieu, ce bloc ne rend le plus souvent QUE
                 l'équipe (l'adresse principale est descendue dans les
                 lignes de profil à la nº 388, et un salon à une seule
                 adresse n'a pas d'« autre adresse ») : ce trait était
                 donc le trait DU HAUT de l'équipe, celui que le
                 propriétaire fait retirer.
                 L'AIR NE SE PARTAGE PLUS, IL SE LIT SEUL : la
                 séparation valait 40 px au-dessus du trait et 40 en
                 dessous — égaux, comme la charte l'exige. Sans trait,
                 ces deux airs n'ont plus rien à encadrer et se
                 cumuleraient en 80 px de vide. Il n'en reste donc QU'UN,
                 les 40 px du `mt-10`, l'unité d'air majeure de la fiche.
                 ⚠️ LA BRANCHE ARTISTE, JUSTE AU-DESSUS, A PERDU LE
                 SIEN À LA nº 496 : ses lieux ont pris la plaque de
                 l'équipe, donc la même absence de trait. Plus aucune
                 séparation ne coupe le bas d'une fiche, quel qu'en soit
                 le type. */
            <div className="mt-10">
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
            /*  ██ §1 (nº 492) — ET VOICI LE TRAIT DU BAS DE L'ÉQUIPE ██
                 Sur un lieu, ce trait-ci est celui qui FERME le bloc de
                 l'équipe : c'est le second des deux que le propriétaire
                 fait retirer. Il part, et les 80 px qu'il partageait se
                 ramènent aux 40 px du `mt-10`, comme au-dessus.
                 ⚠️ IL PART AUSSI POUR UN ARTISTE, et je le dis : c'est le
                 MÊME trait, posé une seule fois sur le signalement. Une
                 fiche d'artiste garde donc la séparation qui ouvre ses
                 profils, et n'en a plus au-dessus du signalement. Une
                 fiche de lieu n'en a plus du tout. */
            <div className="mt-10 flex flex-col items-start gap-4">
              <FenetreSignalement slug={tatoueur.slug} nom={tatoueur.nom} />
              <BoutonHorsLigne idFiche={tatoueur.id} nom={tatoueur.nom} />
            </div>
          )}
        </>
      )}
    </>
  );
}
