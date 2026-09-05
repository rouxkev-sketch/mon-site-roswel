"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
//  en habillage « rangee » — le carré et le mot « Share » dessous.
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
//  §3 (nº 869) — l'icône d'Instagram, celle du pied de page (nº 240) ;
//  la ligne de liens qui la portait a cédé la place à la rangée.
import { IconeInstagram } from "@/components/IconeReseau";
//  §2 (nº 490) — la flèche du compteur « +N ⌄ » : CELLE DES HORAIRES,
//  au même rang 16 et pivotée de la même façon. Aucun dessin nouveau.
//  §3 (nº 869) — et le GLOBE (celui du sélecteur de langue) pour
//  « Website » : le mot dit le site, le globe le montre — c'est le
//  dessin du patron. Le maillon de la nº 240 n'est plus lu ici.
import { IconeChevronBas, IconeMonde } from "@/components/Icones";
//  §3 (nº 869) — la cible carrée et le mot dessous : l'écriture unique
//  des quatre actions de la rangée (Follow et Share la lisent chez eux).
import { ActionDeFiche } from "@/components/ActionDeFiche";
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
//  §1 et §3 (nº 869) — les deux boîtes d'icône (`BOITE_ICONE_LIGNE`,
//  `FORME_BOITE_ICONE`) ne sont plus lues ici : les lignes de badges
//  n'ont plus d'icône en tête, et la liste des liens n'existe plus.
//  L'adresse (BlocLieux) lit toujours la première.
import { ECRITURE_LIGNE_FICHE, LIGNE_GRISE } from "@/components/lignes-profil";
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
 * `PARAM_ONGLET`, `PARAM_ENTREE`, `ENTREE_LIEN`,
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
  PARAM_ONGLET,
  PARAM_ENTREE,
  ENTREE_LIEN,
  avecConsigneDeLienInterne,
  adresseDeLienInterne,
} from "@/lib/lien-interne";

/*  Réexporter ne fait pas entrer le nom dans CE fichier : ce composant
    lit lui-même l'onglet dans l'adresse, il lui faut donc l'import. */
import { PARAM_ONGLET } from "@/lib/lien-interne";
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

function LigneDeCapsules({
  marqueur,
  valeurs,
  libelle,
  fond,
}: {
  marqueur: string;
  valeurs: readonly string[];
  libelle: (slug: string) => string;
  fond: string;
}) {
  const [montrees, setMontrees] = useState(valeurs.length);
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
    if (!boite || valeurs.length === 0 || deplie) return;
    const enfants = Array.from(boite.children) as HTMLElement[];

    //  Une AUTRE fiche est passée sous le composant : on repart de
    //  zéro plutôt que de couper avec les mesures de la précédente.
    if (montrees > valeurs.length) {
      largeurs.current = [];
      largeurMesuree.current = -1;
      setMontrees(valeurs.length);
      return;
    }
    //  LES LARGEURS NE SE RELÈVENT QUE TOUT RENDU, et ne se gardent
    //  que si elles sont plausibles (voir la note, nº 491-§2).
    if (montrees === valeurs.length && enfants.length >= valeurs.length) {
      const relevees = enfants
        .slice(0, valeurs.length)
        .map((enfant) => enfant.offsetWidth);
      if (relevees.every((largeur) => largeur > 0)) largeurs.current = relevees;
    }
    //  Le compteur est le dernier enfant quand il y en a un : sa
    //  largeur réelle remplace la valeur de départ.
    if (montrees < valeurs.length && enfants.length === montrees + 1) {
      const large = enfants[montrees].offsetWidth;
      if (large > 0) largeurCompteur.current = large;
    }

    const dispo = boite.clientWidth;
    if (dispo <= 0) return;
    //  LE CALCUL NE SE REFAIT QU'AU CHANGEMENT DE LARGEUR : sinon il
    //  proposerait de remettre ce que le filet vient de retirer.
    if (dispo !== largeurMesuree.current) {
      largeurMesuree.current = dispo;
      if (largeurs.current.length === valeurs.length) {
        const sansCompteur = capsulesQuiTiennent(largeurs.current, dispo, 0);
        const cible =
          sansCompteur >= valeurs.length
            ? valeurs.length
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
      } else if (montrees !== valeurs.length) {
        //  Rien de fiable en mémoire : on remet tout pour pouvoir
        //  mesurer. Le CSS coupe pendant ce temps, le filet suit.
        setMontrees(valeurs.length);
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

  if (valeurs.length === 0) return null;
  const restant = valeurs.length - montrees;
  const visibles = deplie ? valeurs : valeurs.slice(0, montrees);
  return (
    <p
      {...{ [marqueur]: "" }}
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
        {visibles.map((slug) => (
          <span
            key={slug}
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
            {libelle(slug)}
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
  function choisirOnglet(suivant: OngletAffiche) {
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
   * ⚠️ ET C'EST `choisirOnglet`, PAS UNE SECONDE ÉCRITURE : le geste
   * appelle exactement ce que le toucher d'un onglet appelle. D'où
   * trois acquis qu'on n'a pas à obtenir, on les HÉRITE :
   *  · le va-et-vient suit — trait rose compris : il lit `onglet`, et
   *    c'est `onglet` qu'on change ;
   *  · L'HISTORIQUE NE BOUGE PAS D'UN CRAN — `choisirOnglet` écrit par
   *    `replaceState` (nº 329-§3), jamais `pushState` : le retour
   *    continue de QUITTER la fiche d'un seul appui (règle 332-§1 et
   *    §4). Et dans une fenêtre superposée, qui n'a pas d'adresse à
   *    elle, rien n'est écrit du tout ;
   *  · LA POSITION SUIT LA MÊME RÈGLE QU'AU TOUCHER : `ouvrirLOngletAuDebut`
   *    ne remonte que si l'on est DESCENDU sous le début de la section,
   *    et alors jusqu'à lui — jamais jusqu'en haut de la page (la
   *    nº 377 a retiré ce saut-là). Rester où l'on est quand on est
   *    déjà en haut, revenir au début de la section quand on lisait
   *    plus bas : le contenu change sous les yeux, pas ailleurs.
   *
   * ⚠️ RIEN SI L'ON EST DÉJÀ DU BON CÔTÉ : sans cette garde, un
   * glissement vers la droite en « Profil » rejouerait l'écriture
   * d'adresse et la remontée pour rien.
   * ⚠️ LA MÉMOIRE DES GALERIES (nº 459) N'EST PAS CONCERNÉE : elle
   * s'écrit au défilement d'une galerie et se relit à son montage —
   * ce geste ne fait ni l'un ni l'autre, et il refuse même de partir
   * d'une galerie.
   */
  useGlissementLateralSurLaPage((sens) => {
    const cible: OngletAffiche = sens === 1 ? "portfolio" : "profil";
    if (cible === onglet) return;
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
   * ██ §2 (nº 869) — L'ÉTAT DES CARNETS, DANS LE BLOC DU NOM ██
   * ==================================================================
   * Il quitte la ligne « Books open · Instagram » (nº 270 → nº 868) :
   * il se pose SOUS LE TYPE, à droite de l'avatar — UN POINT ET LE
   * MOT, comme l'« Open » d'une fiche Google Maps :
   *  · booking OUVERT — point VERT (`sombre-succes`, le vert de la
   *    pastille du site), « Books open » ;
   *  · booking à DÉLAI — point GRIS, « Waitlist » ;
   *  · booking FERMÉ — point GRIS, « Books closed ».
   * Le point est le SEUL porteur de couleur : le mot reste dans le
   * gris des sous-titres, sous le type qui l'est aussi — le point se
   * lit de loin, le mot précise.
   * ⚠️ RIEN DÉCLARÉ → RIEN AFFICHÉ (acquis nº 273) : le site ne devine
   * pas l'état des carnets de quelqu'un ; une fiche sans booking n'a
   * pas cette ligne.
   * ⛔ CE QUI PART AVEC LA LIGNE D'AVANT, ET JE LE DIS : le chiffre du
   * délai (« 3-month wait », nº 408) n'est plus écrit — « Waitlist »
   * est LE mot demandé, sans nombre. La donnée reste en base et dans
   * le formulaire ; un « delai » sans mois, muet jusqu'ici, dit donc
   * « Waitlist » comme les autres. Le calendrier (nº 273), les deux
   * lignes du délai (nº 408) et leur compensation optique (nº 409)
   * sont partis avec leur ligne (règle nº 386).
   */
  const etatDesCarnets =
    tatoueur.booking === "ouvert"
      ? { ouvert: true, mot: "Books open" }
      : tatoueur.booking === "delai"
        ? { ouvert: false, mot: "Waitlist" }
        : tatoueur.booking === "ferme"
          ? { ouvert: false, mot: "Books closed" }
          : null;

  /**
   * ██ §3 (nº 869) — LA RANGÉE D'ACTIONS ██
   * ==================================================================
   * Elle REMPLACE la ligne « Books open · Instagram » ET la ligne du
   * site (nº 222-§2 → nº 868) : « Follow » · « Instagram » (si
   * renseigné) · « Website » (si renseigné) · « Share » — dans cet
   * ordre, chacun une grande icône dans une cible carrée à coins
   * arrondis, le mot centré dessous (`ActionDeFiche`, l'écriture
   * unique des quatre ; le patron est la rangée d'une fiche Google
   * Maps).
   * FOLLOW ET SHARE SONT TOUJOURS LÀ : la rangée n'a jamais une icône
   * seule — au minimum ces deux-là. Follow garde exactement son état
   * et son geste (BoutonSuivre : même écriture en base, même retour
   * sur la page d'avant, nº 868) ; Share est le même bouton que
   * partout (BoutonPartageFiche). Ni l'un ni l'autre ne vivent plus
   * dans la rangée du va-et-vient (§4).
   * LES COLONNES SONT ÉGALES : quatre, trois ou deux actions se
   * partagent la largeur de la colonne, chacune centrée dans la
   * sienne — c'est la grille, pas un calcul.
   * ⚠️ INSTAGRAM ET WEBSITE SORTENT DU SITE dans un nouvel onglet,
   * comme les liens qu'ils remplacent. Ils ne sont plus BLEUS
   * (nº 388, 405) : sur le patron, les quatre cibles sont identiques
   * au repos, et c'est le mot qui dit où l'on va. Le bleu de ce qui
   * sort du site reste à l'adresse (BlocLieux).
   * ⛔ CE QUI N'EST PLUS ÉCRIT, ET JE LE DIS : la mention « DM »
   * d'Instagram (nº 408-409), le titre choisi du site
   * (`titre_site_web` — le mot est « Website ») et la PAGE DE LIENS
   * (`page_de_liens`, nº 227 — le formulaire ne l'écrit plus depuis la
   * nº 270, et la rangée demandée n'a pas de cible pour elle). Les
   * données restent en base, on ne les lit plus : le traitement de
   * TikTok (nº 387). `lienEnLigne`, ses icônes de colonne (nº 240) et
   * les deux grilles de liens sont partis avec (règle nº 386).
   * ⚠️ UNE FICHE DE DÉMONSTRATION n'a pas de « Follow » (on ne suit
   * pas ce qui n'existe pas en base, BoutonSuivre) : sa rangée
   * commence à Instagram.
   */
  const rangeeDActions = (
    <div
      data-rangee-actions=""
      /*  Trente-deux pixels sous le bloc du nom (un cran sous les 40 qui
          séparent les sections, nº 241 : la rangée appartient à
          l'en-tête, elle n'est pas une section) ; la liste garde ses
          40 px sous elle. */
      className="mt-8 grid w-full auto-cols-fr grid-flow-col"
    >
      <BoutonSuivre
        tatoueurId={tatoueur.id}
        nomTatoueur={tatoueur.nom}
        suiviAuDepart={suiviAuDepart}
      />
      {tatoueur.lien_instagram && (
        <ActionDeFiche
          cle="instagram"
          href={tatoueur.lien_instagram}
          ariaLabel={`${tatoueur.nom} on Instagram`}
          icone={<IconeInstagram taille={24} />}
          mot="Instagram"
        />
      )}
      {tatoueur.site_web && (
        <ActionDeFiche
          cle="website"
          href={tatoueur.site_web}
          ariaLabel={`${tatoueur.nom}'s website`}
          icone={<IconeMonde taille={24} />}
          mot="Website"
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
  const ligneDesPratiques = (
    <LigneDeCapsules
      marqueur="data-pratique-fiche"
      /*  ██ §1 (nº 869) — PLUS D'ICÔNE EN TÊTE DE LIGNE ██
          Décision du propriétaire : les badges d'un profil s'écrivent
          texte seul, contour, gris. L'étoile (techniques) et la goutte
          (styles) de la nº 868-§6 sont parties : la goutte reste celle
          du va-et-vient de l'accueil ; l'étoile de la liste des liens
          n'avait plus de lecteur et a quitté IconeReseau (règle nº 386).
          Les deux lignes se distinguent par leur ordre (les styles
          d'abord, nº 868-§5) et par leurs mots. */
      valeurs={capsulesPratique}
      libelle={libelleFiltre}
      fond={FOND_CAPSULE}
    />
  );
  const ligneDesStyles = (
    <LigneDeCapsules
      marqueur="data-styles-fiche"
      //  §1 (nº 869) — sans icône, comme la ligne des techniques.
      valeurs={tatoueur.styles}
      libelle={libelleStyle}
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
        <SelecteurOngletAffiche valeur={onglet} surChoix={choisirOnglet} />
        {/*  ██ §4 (nº 869) — PLUS DE PARTAGE NI DE « SUIVRE » ICI ██
             Les deux gestes (nº 458 → nº 868 : le partage en habillage
             « icone », le badge « Suivre », leur alignement sur les
             onglets, nº 852) ont quitté cette rangée pour la rangée
             d'actions du profil (`rangeeDActions`, §3). Le va-et-vient
             occupe toute la largeur, chaque onglet la moitié, le mot
             centré — comme celui de « Ma sélection », le même
             composant (SelecteurOngletAffiche). */}
      </div>

      {onglet === "portfolio" && (
        <PanneauPortfolio
          groupes={groupes}
          nomTatoueur={tatoueur.nom}
          //  §4 (nº 459) — l'identité de la fiche, pour la mémoire de
          //  défilement des galeries du doigt (et sa purge d'arrivée).
          slugTatoueur={tatoueur.slug}
          surSerie={(serie) => {
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
            /*  ██ §1 (nº 742) — AU DOIGT, PLUS DE REMONTÉE : ON NAVIGUE ██
                ----------------------------------------------------------
                LE DÉFAUT DIT PAR LE PROPRIÉTAIRE : toucher une photo au
                fond d'une galerie fait « clignoter et se réinitialiser »
                la page avant que la photo ne s'ouvre.
                LA CAUSE, MESURÉE AU BANC (pile d'appels à l'appui) :
                depuis la nº 455, `surSerieChoisie` NAVIGUE au doigt vers
                la vue photo. Cette remontée-ci, écrite pour le web
                (nº 236/238/239 — la vignette change la photo du haut,
                donc la page se recale dessus), partait quand même : une
                ANIMATION de trois cents millisecondes sur la page qu'on
                est en train de QUITTER. Et pendant qu'elle glissait, la
                vue photo retirait la colonne de lecture — le document
                tombait de 5 579 à 933 px, l'animation était rabotée à
                chaque palier, et l'on voyait la page descendre par
                à-coups. Relevé : 763 → 699 → 89 px en six cents
                millisecondes.
                LE REMÈDE : au doigt, on ne demande plus rien. Il n'y a
                pas de repère à rejoindre sur une page qu'on quitte ; la
                vue photo s'ouvre en haut par la pose de FicheTatoueur
                (§1 nº 742), à l'adresse commise.
                ⚠️ LA CONDITION EST CELLE DE LA NAVIGATION, AU MOT PRÈS
                — `!apercu && mobile`, la jumelle exacte de la branche de
                `surSerieChoisie` (nº 455). Elle ne peut donc pas s'en
                écarter : on ne saute la remontée que là où la vignette
                EST PARTIE. Les deux autres cas la gardent, entière :
                 · le WEB — la vignette n'y navigue pas, elle change la
                   série sous la même adresse et la photo du haut avec :
                   même repère, même durée, pas un pixel de changé ;
                 · l'APERÇU au doigt (« Mon compte → Mon portfolio ») —
                   il ne navigue pas non plus (la nº 455 l'exclut
                   nommément), et la remontée y sert comme avant. Sans
                   cette moitié de condition, je l'aurais tuée là-bas.
                ⚠️ L'APPAREIL SE LIT AU GESTE (`data-appareil`), jamais à
                une largeur — piège nº 60. */
            if (
              !apercu &&
              document.documentElement.dataset.appareil === "mobile"
            ) {
              return;
            }
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
              {/*  §2 (nº 869) — L'ÉTAT DES CARNETS, sous le type : le point
                   et le mot (voir `etatDesCarnets`). Un point de 8 px, le
                   mot au corps du type mais en graisse normale et sans
                   capitales — c'est une mention, pas un titre. Le bloc
                   reste centré sur l'avatar tant qu'il est moins haut que
                   lui (nº 241-§2), et trois lignes le sont encore. */}
              {etatDesCarnets && (
                <p
                  data-booking-fiche={tatoueur.booking}
                  className="mt-2 flex items-center gap-2 text-[14px] leading-[20px] text-sombre-texte-doux"
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      etatDesCarnets.ouvert
                        ? "bg-sombre-succes"
                        : "bg-sombre-texte-doux"
                    }`}
                  />
                  {etatDesCarnets.mot}
                </p>
              )}
            </div>
          </div>

          {/* ==========================================================
              §2 (nº 869) — LA RANGÉE D'ACTIONS, SOUS LE BLOC DU NOM
              ==========================================================
              Follow · Instagram · Website · Share (voir `rangeeDActions`).
              Elle prend la place des deux lignes de liens (nº 222-§2 →
              nº 868). */}
          {rangeeDActions}

          {/* ==========================================================
              LA LISTE — la bio, les styles, les techniques, l'adresse
              ==========================================================
              §5 (nº 869) — L'ORDRE DU PROPRIÉTAIRE, de haut en bas : le
              bloc du nom (avatar, nom, type, état des carnets), la rangée
              d'actions, LA BIO, LES STYLES, LES TECHNIQUES, l'adresse,
              puis les horaires (qui vivent dans les sections du bas et ne
              bougent pas). Les deux grilles de liens qui ouvraient cette
              liste (nº 233-§5, 384, 407, 408) sont parties avec la rangée
              d'actions.
              §2 (nº 490) — LA GARDE INTERROGE LES LISTES, PLUS LES
              ÉLÉMENTS : `LigneDeCapsules` est un composant, son élément
              JSX existe même vide — on teste les longueurs, qui sont la
              vérité (une fiche sans bio, sans technique et sans style
              n'ouvre pas ce conteneur pour rien). */}
          {(Boolean(tatoueur.bio) || aDesPratiques || aDesStyles) && (
            <div
              /*  §5 (nº 389, REPRIS À LA nº 538) — L'ÉCART PARTAGÉ : 16 px
                   à la nº 389, 20 puis VINGT-QUATRE depuis la nº 538. C'est
                   le SEUL endroit qui l'écrit — aucune marge n'est posée
                   sur les lignes elles-mêmes ; c'est la LISTE qui commande,
                   et une ligne absente ne laisse donc aucun vide. Le rythme
                   tient : 24 entre deux lignes, 28 autour de la bio
                   (nº 868), 40 entre deux sections — et 40 entre la rangée
                   d'actions et cette liste, le `mt-10` qui MESURE la marge
                   basse de l'en-tête (nº 241). Les plaques et leurs
                   mentions (nº 496-497) ne sont pas dans cette liste. */
              className="mt-10 flex w-full flex-col items-start gap-y-6"
            >
              {/*  ██ §5 (nº 868) — LA BIOGRAPHIE MONTE DANS LA LISTE ██
                   L'ORDRE DU PROPRIÉTAIRE, de haut en bas : les liens
                   (booking, Instagram), le site, LA BIO, les STYLES, les
                   TECHNIQUES, l'adresse, puis les horaires (qui vivent
                   dans les sections du bas et ne bougent pas). Elle
                   vivait SOUS la liste depuis toujours ; elle en devient
                   une rangée, à sa place.
                   ⚠️ SON AIR NE CHANGE PAS D'UN PIXEL, et c'est le sens
                   du rembourrage vertical d'un cran : la liste écarte
                   ses rangées de 24 px, la bio était séparée de 28
                   (`mt-7`) — quatre de plus en haut comme en bas la lui
                   rendent, sans toucher au reste. Le rythme de la note
                   du dessus tient : 24 entre deux lignes, 28 autour de
                   la bio, 40 entre deux sections.
                   ⚠️ ET SA LARGEUR NON PLUS : cette colonne aligne ses
                   enfants à gauche (`items-start`), une rangée doit donc
                   réclamer la largeur — les deux grilles au-dessus le
                   font déjà. */}
              {tatoueur.bio && (
                <p className="my-1 w-full text-[15px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
                  {tatoueur.bio}
                </p>
              )}
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
