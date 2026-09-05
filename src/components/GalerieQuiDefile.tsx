"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
//  §4 (nº 459) — la mémoire de module des positions de défilement :
//  elle survit aux remontages (leçon nº 430), voir lib/memoire-galeries.
import {
  defilementGalerieRetenu,
  photoDeGalerieRetenue,
  retenirDefilementGalerie,
} from "@/lib/memoire-galeries";

/**
 * LA GALERIE QUI DÉFILE — UN SEUL DESSIN, DEUX EMPLOIS (nº 306)
 * ==================================================================
 * ⚠️ POURQUOI CE FICHIER EXISTE. La rangée de vignettes de « Ma
 * sélection » (nº 249-§6, refaite nº 264 et nº 301) est devenue la
 * présentation des galeries de la COLONNE PORTFOLIO d'une fiche, en
 * web. Le propriétaire l'a demandé en toutes lettres : « RÉUTILISE LE
 * COMPOSANT DE MA SÉLECTION, n'en écris pas un second. Si sa règle de
 * composition ne convient pas ici, extrais la présentation et laisse
 * le contenu à chaque appelant — mais il ne doit exister qu'un seul
 * dessin de galerie. »
 * C'EST EXACTEMENT CE QUI EST FAIT : ce composant ne CHOISIT rien —
 * ni les photos, ni leur nombre, ni leur ordre. Il POSE une rangée qui
 * défile, ses deux chevrons et ses deux fondus ; le contenu lui arrive
 * en enfants. « Ma sélection » lui donne ses vingt photos composées
 * (nº 302), la fiche lui donne TOUT un carrousel — deux contenus, un
 * seul dessin.
 *
 * CE QU'IL PORTE, ET QUI NE SE REDISCUTE PAS :
 *  · le DÉFILEMENT NATIF avec accrochage (`scroll-snap`), jamais une
 *    translation calculée — la règle de la nº 209-§7 ;
 *  · LES DEUX CHEVRONS de la nº 301 : zone de 40 px, dessin 20 × 40,
 *    trait 3, ombre douce (`drop-shadow`), au survol seulement, jamais
 *    au doigt (`pointer-fine`) ;
 *  · AUCUN POINT de défilement (supprimés nº 301-§4a) ;
 *  · le pas d'une flèche est UNE PAGE — une largeur de CONTENU —, visé
 *    par `scrollTo` (nº 253-§4).
 */

/** L'écart entre deux cases — 6 px, la valeur de la nº 244. C'est le
    DÉFAUT du dessin : « Ma sélection » le garde tel quel. */
export const ECART_GALERIE = "gap-1.5";

/**
 * ██ §1 (nº 588) — DE COMBIEN ON PREND DE L'AVANCE : UNE LARGEUR ██
 * ==================================================================
 * La marge est donnée EN POURCENTAGE DE LA RANGÉE, pas en pixels, et
 * c'est ce qui la rend juste partout : la rangée du doigt montre trois
 * vignettes, celle du web quatre à six, celles d'une fiche deux — une
 * même valeur en pixels vaudrait une avance de trois cases ici et d'une
 * demi-case là.
 *
 * POURQUOI UNE LARGEUR, ET PAS DEUX :
 *  · MOINS ne changerait rien. Une demi-largeur, c'est une case et
 *    demie d'avance : le temps qu'elle arrive, le geste est déjà passé
 *    devant — c'est exactement ce que le navigateur fait tout seul, et
 *    c'est ce qui laisse voir le fond du cadre ;
 *  · PLUS revient à tout charger. Sur le web, une galerie montre six
 *    vignettes ; deux largeurs d'avance en demandent douze de plus, sur
 *    les vingt d'une galerie de « Ma sélection ». Le chargement à la
 *    demande n'aurait plus d'objet, et l'on paierait des photos que
 *    personne ne regardera — la moitié des galeries ne sont jamais
 *    déroulées.
 *  · UNE largeur, c'est la distance qu'un geste de défilement parcourt
 *    d'un seul coup. On couvre donc le geste EN COURS, et le geste
 *    suivant redemande d'autant — l'avance se déplace avec la main au
 *    lieu d'être payée d'un bloc.
 *
 * ⚠️ ELLE VAUT DES DEUX CÔTÉS (deux valeurs : le vertical, puis
 * l'horizontal) : on revient en arrière dans une galerie aussi souvent
 * qu'on y avance.
 */
const AVANCE_DE_CHARGEMENT = "0px 100%";

/** Ce qui décrit un chevron : la largeur de sa zone sensible, la boîte
    de son dessin, l'épaisseur de son trait. */
export type TailleChevron = {
  /** La classe de largeur de la zone (elle occupe toute la hauteur). */
  zone: string;
  largeur: number;
  hauteur: number;
  trait: string;
};

/** LE CHEVRON DE LA Nº 301 — zone 40 px, dessin 20 × 40, trait 3.
    C'est le DÉFAUT du dessin partagé : « Ma sélection » le garde tel
    quel (nº 310-§4, qui annule la réduction que la nº 308 lui avait
    fait subir par ricochet). */
export const CHEVRON_GALERIE: TailleChevron = {
  zone: "w-10",
  largeur: 20,
  hauteur: 40,
  trait: "3",
};

/** LE CHEVRON RÉDUIT DE LA Nº 308 — zone 28 px, dessin 14 × 28,
    trait 2,5. Réservé à la colonne Portfolio d'une fiche, où les
    galeries sont étroites et où le grand chevron dominait l'image. */
export const CHEVRON_GALERIE_PETIT: TailleChevron = {
  zone: "w-7",
  largeur: 14,
  hauteur: 28,
  trait: "2.5",
};

/**
 * ██ §1 (nº 839) — LE DESSIN DU CHEVRON, SORTI POUR ÊTRE PARTAGÉ ██
 * ------------------------------------------------------------------
 * Il vivait à l'intérieur du bandeau ci-dessous, et il n'avait qu'un
 * porteur. La CARTE-GALERIE de la nº 839 en veut EXACTEMENT le même —
 * consigne du propriétaire : « celles des galeries de profil, même
 * dessin, mêmes états ». Le recopier, c'était le condamner à diverger
 * à la prochaine retouche (piège nº 378) ; il est donc extrait tel
 * quel, sans une valeur changée.
 * ⚠️ L'OMBRE FAIT PARTIE DU DESSIN, et à toutes les tailles : c'est
 * elle, et elle seule, qui rend un chevron blanc lisible sur une photo
 * claire (nº 301, §4-c). Elle ne se règle pas.
 * ⚠️ AUCUN FOND, AUCUN DISQUE, AUCUN CONTOUR (nº 264, §6) : un chevron
 * NU. La couleur vient du porteur (`currentColor`), la taille du
 * gabarit qu'il passe.
 */
export function ChevronDeGalerie({
  sens,
  taille,
}: {
  sens: 1 | -1;
  taille: TailleChevron;
}) {
  return (
    <svg
      width={taille.largeur}
      height={taille.hauteur}
      viewBox="0 0 12 24"
      fill="none"
      aria-hidden="true"
      className="[filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.65))]"
    >
      <path
        d={sens === 1 ? "M3 4l6 8-6 8" : "M9 4l-6 8 6 8"}
        stroke="currentColor"
        strokeWidth={taille.trait}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ██ §2 (nº 844) — LE CHEVRON QUI SE CLIQUE, SORTI À SON TOUR ██
 * ==================================================================
 * LE DESSIN était partagé depuis la nº 839 (`ChevronDeGalerie`) ; SA
 * ZONE CLIQUABLE, non — la carte-galerie l'écrivait à la main
 * (`CommandesDeCarte`, components/GalerieDeCarte) et la nº 844 en veut
 * EXACTEMENT la même sur les fiches (consigne du propriétaire : « les
 * mêmes chevrons que les cartes — même dessin, même comportement au
 * survol »). Troisième porteur, donc extraction (la règle du site,
 * nº 276) : aucune valeur n'est choisie ici qui ne fût déjà celle de la
 * nº 839.
 *
 * CE QUE LA ZONE VAUT, ET POURQUOI : une COLONNE de la hauteur de
 * l'image (`inset-y-0`), collée à son bord, large de ce que dit le
 * gabarit (40 px pour `CHEVRON_GALERIE`, 28 pour le réduit). C'est la
 * cible des galeries de profil depuis la nº 301 : on vise le bord, pas
 * un disque.
 *
 * LES ÉTATS, à la lettre :
 *  · `hidden` — sur un pointeur grossier, RIEN. Le doigt fait glisser,
 *    il n'a pas de chevron à viser (la règle des galeries depuis la
 *    nº 264) ;
 *  · `pointer-fine:flex` — il existe dès qu'une souris existe ;
 *  · `invisible group-hover:visible` — et il ne se montre que lorsque
 *    l'ensemble qui le porte est survolé. `invisible` et non une
 *    transparence : un élément seulement transparent continue de
 *    recevoir les clics.
 * ⚠️ LE `group` EST CELUI DU PORTEUR : l'article de la carte
 * (CarteTatoueur), la racine du carrousel sur une fiche (nº 844). Un
 * seul `group` par chaîne — deux imbriqués détourneraient le survol.
 * ⚠️ LES DEUX GARDES DU CLIC SONT INCONDITIONNELLES (nº 368-§4) : sur
 * une fiche, chaque photo est un lien et le bouton est posé au-dessus ;
 * sans elles, un clic ouvrirait la photo EN PLUS de faire défiler. Sur
 * une carte, le bouton est HORS du lien (nº 517) et rien ne remonte —
 * les garder ne coûte rien et supprime la question.
 */
export function BoutonChevron({
  sens,
  taille,
  surClic,
  attributs,
}: {
  sens: 1 | -1;
  taille: TailleChevron;
  surClic: () => void;
  /** Les repères de banc du porteur (`data-fleche-de-carte`, `data-role`). */
  attributs?: Record<string, string>;
}) {
  return (
    <button
      type="button"
      aria-label={sens === 1 ? "Next photo" : "Previous photo"}
      {...attributs}
      onClick={(evenement) => {
        evenement.preventDefault();
        evenement.stopPropagation();
        surClic();
      }}
      className={`pointer-events-auto hidden pointer-fine:flex invisible
        group-hover:visible absolute inset-y-0 z-[2] ${
          sens === 1 ? "right-0" : "left-0"
        } ${taille.zone} items-center justify-center text-white`}
    >
      <ChevronDeGalerie sens={sens} taille={taille} />
    </button>
  );
}

/*  §3 (nº 264) — LA LARGEUR DE CONTENU, PAS LE `clientWidth` : la
    rangée déborde de son cadre (rembourrage interne), et `clientWidth`
    le compte. Une PAGE reste une largeur de CONTENU.
    ⚠️ §2 (nº 522) — CETTE FONCTION ET LA SUIVANTE VIVENT HORS DU
    COMPOSANT, et c'est délibéré : elles ne lisent RIEN de lui — ni
    état, ni propriété —, elles ne prennent que le cadre qu'on leur
    tend. Déclarées dedans, elles se refabriquaient à chaque rendu et
    l'écouteur de défilement se serait reposé pour rien à chacun. */
function largeurContenu(cadre: HTMLElement) {
  const style = getComputedStyle(cadre);
  return (
    cadre.clientWidth -
    parseFloat(style.paddingLeft) -
    parseFloat(style.paddingRight)
  );
}

/**
 * ██ §2 (nº 522) — LE RANG DE LA DERNIÈRE VIGNETTE VUE ██
 * ------------------------------------------------------------------
 * LA nº 521 ANNONÇAIT LA PREMIÈRE, ET C'ÉTAIT UNE ERREUR DE FOND :
 * sur une galerie de 19 photos qui en montre deux à la fois, la
 * PREMIÈRE vignette visible ne peut jamais dépasser la 18ᵉ — arrivé
 * au bout du défilement, il reste une photo à droite d'elle. Le
 * compteur se bloquait donc à « 18/19 » alors que la 19ᵉ était bien à
 * l'écran, et disait « 1/19 » quand deux photos étaient déjà vues.
 * LA RÈGLE, DÉSORMAIS : on annonce LA DERNIÈRE vignette visible. Elle
 * atteint le total au bout de la course PAR CONSTRUCTION, et elle
 * répond à la question qu'on se pose vraiment — où en suis-je dans
 * cette galerie ?
 * POURQUOI PAS UNE PLAGE (« 1-2/19 » puis « 18-19/19 ») : elle
 * décrirait mieux ce qu'on voit, mais elle CHANGE DE LARGEUR en
 * chemin — deux caractères de plus au bout —, et les chiffres de
 * largeur égale n'y peuvent rien. Elle demanderait en plus un cas à
 * part dès qu'une seule vignette est visible (« 3-3/19 »).
 *
 * COMMENT C'EST MESURÉ, SANS AUCUNE VALEUR ÉCRITE :
 *  · le PAS entre deux vignettes se lit sur les DEUX PREMIÈRES de la
 *    rangée — leur écart de position porte déjà la largeur d'une case
 *    ET l'espace qui les sépare, quels qu'ils soient. Le réglage
 *    d'écart de l'appelant (`ecart`) ne peut donc pas le désaccorder ;
 *  · COMBIEN de vignettes tiennent à l'écran se déduit du même pas et
 *    de la largeur de contenu ;
 *  · la dernière vue est la première PLUS ce compte, bornée au total.
 * ⚠️ C'EST LE BORNAGE QUI GARANTIT LA FIN DE COURSE : quand une
 * vignette n'est visible qu'à moitié, l'arrondi peut viser une case
 * de trop — la borne la ramène sur la dernière qui existe. Le
 * compteur atteint donc le total, et ne le dépasse jamais.
 * ⚠️ L'ARRONDI REND LE CHANGEMENT FRANC : le rang bascule à
 * mi-parcours entre deux vignettes, jamais progressivement. Au doigt
 * comme au web, puisque tout se lit sur le défilement lui-même —
 * l'accrochage (`snap`) fait le reste et pose la rangée pile.
 * ⚠️ UNE GALERIE QUI TIENT ENTIÈREMENT À L'ÉCRAN annonce d'emblée son
 * total (« 19/19 ») : tout est vu, il n'y a rien à parcourir. Une
 * seule photo dit « 1/1 », comme à la nº 521.
 * ⚠️ UNE RANGÉE PAS ENCORE MESURABLE (une seule case, un pas nul)
 * rend zéro — donc « 1 » à l'affichage. Jamais de vide, jamais de
 * division par zéro.
 */
function rangDerniereVue(cadre: HTMLElement) {
  const cases = cadre.children;
  if (cases.length < 2) return 0;
  const pas =
    (cases[1] as HTMLElement).offsetLeft - (cases[0] as HTMLElement).offsetLeft;
  if (pas <= 0) return 0;
  const premiere = Math.max(0, Math.round(cadre.scrollLeft / pas));
  const tiennent = Math.max(1, Math.round(largeurContenu(cadre) / pas));
  return Math.min(cases.length - 1, premiere + tiennent - 1);
}

export function GalerieQuiDefile({
  children,
  /**
   * ██ §1 (nº 521) — LE RANG DE LA PREMIÈRE VIGNETTE VUE, POUR QUI LE
   * DEMANDE ██
   * ------------------------------------------------------------------
   * Le compteur d'une galerie du Portfolio (« 1/20 ») a besoin de
   * savoir où en est le défilement. Ce composant le sait déjà — il
   * écoute la rangée pour ses chevrons —, il le DIT donc, au lieu que
   * l'appelant remesure la même chose une seconde fois.
   * ⚠️ RIEN NE CHANGE POUR QUI NE LE DEMANDE PAS : sans ce rappel, la
   * mesure n'est même pas faite, et les autres appelants (« Ma
   * sélection », les suivis) ne bougent pas d'un pixel — c'est le
   * procédé de `ecart` et de `chevron`, des réglages, jamais un second
   * dessin.
   * ⚠️ LE RANG PART DE ZÉRO : c'est un rang, pas un numéro. Celui qui
   * l'affiche ajoute un.
   * ⚠️ §2 (nº 522) — C'EST LA DERNIÈRE VIGNETTE VUE, plus la première :
   * seule elle atteint le total au bout de la course. Voir la note de
   * `rangDerniereVue`, qui dit pourquoi la première ne le pouvait pas.
   */
  surRang,
  classeEnveloppe = "",
  classeRangee = "",
  styleRangee,
  /**
   * §4-a (nº 308) — L'ÉCART ENTRE DEUX CASES, quand l'appelant en veut
   * un autre. C'est un RÉGLAGE, pas un second dessin : le composant
   * continue de poser la rangée, ses chevrons et ses fondus — comme
   * `classeRangee` ou `decalageGauche` avant lui. La colonne
   * Portfolio d'une fiche demande 3 px (la moitié) ; sans argument, on
   * garde les 6 px de la nº 244, donc « Ma sélection » ne bouge pas
   * d'un pixel.
   */
  ecart = ECART_GALERIE,
  /**
   * §4 (nº 310) — LA TAILLE DES CHEVRONS, QUAND L'APPELANT EN VEUT UNE
   * AUTRE. Même raison que `ecart` : c'est un RÉGLAGE, pas un second
   * dessin. La nº 308 avait réduit les chevrons DANS le dessin partagé
   * pour la colonne Portfolio ; « Ma sélection », qui consomme le même
   * dessin, a rétréci avec — le propriétaire ne l'avait pas demandé.
   * LE DÉFAUT EST DONC CELUI DE LA Nº 301, mot pour mot (zone 40 px,
   * dessin 20 × 40, trait 3) : sans argument, « Ma sélection » retrouve
   * exactement ce qu'elle avait. La fiche, elle, demande le petit.
   * ⚠️ L'OMBRE N'EST PAS RÉGLABLE, et ne doit pas l'être : c'est elle
   * qui rend le chevron lisible sur une photo claire, à toutes les
   * tailles.
   */
  chevron = CHEVRON_GALERIE,
  /** Le décalage des chevrons hors du cadre, par côté. */
  decalageGauche = "-left-4 sm:-left-6",
  decalageDroite = "-right-4 sm:-right-6",
  /**
   * LES DEUX FONDUS ANTHRACITE DES BORDS (nº 264-§3). Faux quand
   * l'appelant efface autrement — la colonne Portfolio d'une fiche
   * masque son bord gauche en dégradé, un aplat par-dessus n'aurait
   * plus rien à faire.
   */
  avecVoiles = true,
  /** Ce qui relance la mesure des deux bouts de course. */
  cleDuContenu,
  /**
   * §4 (nº 459) — LA GALERIE SE SOUVIENT DE SA POSITION, quand
   * l'appelant lui donne une clé (les galeries du doigt d'une fiche :
   * `slug|nature|style|rendu`). Sans clé, RIEN ne change — « Ma
   * sélection » et le web gardent leur comportement au caractère
   * près. Voir lib/memoire-galeries pour la règle complète.
   */
  cleMemoire,
  etiquette,
}: {
  children: React.ReactNode;
  /** §1 (nº 521, revu nº 522) — appelé au défilement avec le rang de
      la DERNIÈRE vignette vue (base zéro). */
  surRang?: (rang: number) => void;
  classeEnveloppe?: string;
  classeRangee?: string;
  styleRangee?: React.CSSProperties;
  ecart?: string;
  chevron?: TailleChevron;
  decalageGauche?: string;
  decalageDroite?: string;
  avecVoiles?: boolean;
  cleDuContenu: string | number;
  cleMemoire?: string;
  etiquette?: string;
}) {
  const zone = useRef<HTMLUListElement>(null);

  /**
   * §4 (nº 459) — LA RESTITUTION, AVANT LA PEINTURE.
   * ------------------------------------------------------------------
   * Au montage, si une position a été retenue pour cette clé, elle est
   * REPOSÉE en `useLayoutEffect` — après la mise en page, AVANT la
   * peinture : l'œil ne voit jamais la première case (aucun éclair),
   * et la pose est INSTANTANÉE (écriture directe de `scrollLeft`,
   * jamais un `scrollTo` animé) — une pose programmée, que rien ne
   * peut lire comme un geste : le seul écouteur de cette rangée est
   * `lire` (l'état des chevrons et des fondus), qui doit justement
   * refléter la position restituée.
   * AU DÉMONTAGE, la position du moment est NOTÉE — le nettoyage
   * d'effet s'exécute pendant que le nœud est encore là. C'est le
   * couple exact de la leçon nº 430 : la mémoire vit dans le module,
   * le composant ne fait que la lire et l'écrire aux deux bouts de sa
   * vie.
   */
  /**
   * ██ §5 (nº 863) — LA POSE SE VÉRIFIE, ET LA MÉMOIRE NE S'ÉCRASE PLUS ██
   * ------------------------------------------------------------------
   * LE DÉFAUT RAPPORTÉ PAR LE PROPRIÉTAIRE : depuis l'onglet Portfolio,
   * ouvrir la photo 8/11 puis revenir → la galerie revient à 1. Elle
   * devait rester sur 8 (la mémoire ci-dessus, nº 459).
   * CE QUI A ÉTÉ MESURÉ À L'ATELIER, SUR LE BÂTI DE PRODUCTION (banc
   * 863) : par le retour du navigateur comme par l'en-tête de la vue
   * photo, un second aller-retour, un passage par l'onglet Profil, la
   * galerie revient à sa place — 9/11, 1194 px. Le défaut n'y est pas
   * reproductible, et aucun des fichiers de cette mémoire n'a bougé
   * depuis la nº 852. Ce qui reste, c'est LA SEULE FAILLE QUE L'ON
   * PUISSE CONSTRUIRE dans l'écriture d'avant, et elle est réelle :
   *  · la pose était UNE écriture, faite une fois, sans regarder si
   *    elle avait pris. Un cadre qui n'a pas encore sa largeur à cet
   *    instant (un ancêtre pas encore affiché, une mise en page qui
   *    arrive un battement plus tard) borne `scrollLeft` à zéro, et
   *    rien ne revenait la poser ; un moteur qui « re-accroche » un
   *    conteneur à accrochage juste après son insertion (le
   *    comportement connu de WebKit sur `scroll-snap`) la défait
   *    pareil ;
   *  · et AU DÉMONTAGE, la position lue sur un cadre sans largeur
   *    valait zéro — écrite par-dessus la vraie. La mémoire ne
   *    contenait alors plus que ce zéro, et le retour suivant montrait
   *    la première photo. C'est exactement le symptôme.
   * CE QUI CHANGE : la pose REGARDE si elle a pris ; sinon elle se
   * repose à l'image suivante, et encore dès que le cadre obtient sa
   * largeur (un observateur de taille, retiré dès que c'est fait). Et
   * le démontage n'écrit que ce qu'un cadre AYANT UNE LARGEUR a
   * mesuré — un zéro voulu (galerie ramenée au début) s'écrit
   * toujours, un zéro d'absence de mise en page jamais.
   * ⚠️ RIEN NE CHANGE POUR QUI N'A PAS DE CLÉ (« Ma sélection », les
   * suivis) : sans `cleMemoire`, cet effet ne fait rien, comme avant.
   */
  useLayoutEffect(() => {
    if (!cleMemoire) return;
    const cadre = zone.current;
    if (!cadre) return;
    const retenue = defilementGalerieRetenu(cleMemoire);
    /*  ██ §1 (nº 866) — LE RANG D'UNE PHOTO PASSE DEVANT LA POSITION ██
        Le fil de galeries (FilDeGalerie) note LA PHOTO REGARDÉE dans la
        carte de cette galerie (lib/memoire-galeries, `retenirPhotoDe
        Galerie`) ; au remontage, la bande se pose SUR CETTE CASE — son
        bord gauche au bord utile du cadre, là où l'accrochage
        (`snap-start`, rembourrage de défilement compris) la poserait
        lui-même. La position en pixels ne sert que s'il n'y a aucun
        rang à honorer ; le rang est consommé à la lecture, et le
        démontage suivant retient à nouveau des pixels, comme avant.
        ⚠️ TRADUIT AU MOMENT DE LA POSE, jamais avant : la case n'a sa
        place que mise en page, et la pose se répète tant que le cadre
        n'a pas de largeur (l'image suivante, puis l'observateur de
        taille, ci-dessous) — le rang se relit donc à chaque essai. */
    const photo = photoDeGalerieRetenue(cleMemoire);
    const cible = (): number | undefined => {
      if (photo === undefined) return retenue;
      const cases = cadre.querySelectorAll<HTMLElement>("[data-case-galerie]");
      const visee = cases[Math.min(photo, cases.length - 1)];
      if (!visee) return retenue;
      const rembourrage = parseFloat(getComputedStyle(cadre).paddingLeft) || 0;
      return Math.max(
        0,
        Math.round(
          cadre.scrollLeft +
            visee.getBoundingClientRect().left -
            cadre.getBoundingClientRect().left -
            rembourrage
        )
      );
    };
    const aUneLargeur = () => cadre.scrollWidth > cadre.clientWidth;
    let posee = photo === undefined && (retenue === undefined || retenue <= 0);
    const poser = () => {
      if (posee || !aUneLargeur()) return;
      const voulue = cible();
      if (voulue === undefined || voulue <= 0) {
        posee = true;
        return;
      }
      /*  BORNÉE AU BOUT DE COURSE : une photo parmi les dernières ne
          peut pas venir au bord (la bande ne défile pas plus loin que
          sa fin) — elle est alors VISIBLE, la bande au plus près, et la
          pose est tenue pour faite. Sans cette borne, la vérification
          ci-dessous ne serait jamais satisfaite et l'observateur de
          taille reposerait la même chose à chaque battement. */
      const bornee = Math.min(voulue, cadre.scrollWidth - cadre.clientWidth);
      cadre.scrollLeft = bornee;
      posee = Math.abs(cadre.scrollLeft - bornee) <= 1;
    };
    poser();
    let image = 0;
    let observateur: ResizeObserver | null = null;
    if (!posee) {
      image = requestAnimationFrame(() => {
        poser();
        if (posee || typeof ResizeObserver === "undefined") return;
        observateur = new ResizeObserver(() => {
          poser();
          if (posee) observateur?.disconnect();
        });
        observateur.observe(cadre);
      });
    }
    return () => {
      cancelAnimationFrame(image);
      observateur?.disconnect();
      if (aUneLargeur()) {
        retenirDefilementGalerie(cleMemoire, cadre.scrollLeft);
      }
    };
  }, [cleMemoire]);

  /**
   * §4 (nº 253) — UNE PAGE ENTIÈRE, ET RIEN D'AUTRE. On VISE une
   * frontière de page (`page × largeur visible`) au lieu d'ajouter une
   * largeur à la position courante : les deux font le même pas, mais
   * viser se corrige tout seul — après un glissement qui s'est arrêté
   * entre deux pages, l'appui suivant retombe sur une frontière.
   */
  const defiler = (sens: 1 | -1) => {
    const cadre = zone.current;
    if (!cadre) return;
    const cible = Math.max(0, etat.page + sens) * largeurContenu(cadre);
    cadre.scrollTo({ left: cible, behavior: "smooth" });
  };

  //  §4-a (nº 301) — les deux bouts de course (qui décident de
  //  l'existence des chevrons et des fondus) et la PAGE COURANTE, qui
  //  est le pas du défilement. Rien d'autre : les points sont partis.
  const [etat, setEtat] = useState({ gauche: false, droite: false, page: 0 });
  useEffect(() => {
    const cadre = zone.current;
    if (!cadre) return;
    const lire = () => {
      const contenu = largeurContenu(cadre);
      setEtat({
        gauche: cadre.scrollLeft > 1,
        droite: cadre.scrollLeft + cadre.clientWidth < cadre.scrollWidth - 1,
        page: contenu ? Math.round(cadre.scrollLeft / contenu) : 0,
      });
      //  §1 (nº 521) — LE RANG DE LA PREMIÈRE VIGNETTE VUE, pour qui
      //  le demande. Voir la note du paramètre.
      if (surRang) surRang(rangDerniereVue(cadre));
    };
    lire();
    cadre.addEventListener("scroll", lire, { passive: true });
    const observateur = new ResizeObserver(lire);
    observateur.observe(cadre);
    return () => {
      cadre.removeEventListener("scroll", lire);
      observateur.disconnect();
    };
    //  §1 (nº 521) — `surRang` entre dans les dépendances plutôt qu'une
    //  exception de règle : l'appelant passe un poseur d'état, que React
    //  garantit stable d'un rendu à l'autre — l'écouteur n'est donc pas
    //  reposé pour rien.
  }, [cleDuContenu, surRang]);

  /**
   * ██ §1 (nº 588) — LES PHOTOS SONT DEMANDÉES AVANT D'ENTRER DANS LE
   * CADRE ██
   * ==================================================================
   * LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE (nº 587-§3) : en faisant
   * défiler une galerie, on voit passer des rectangles à la place des
   * photos. Ce rectangle est le fond du cadre, qui RÉSERVE LA HAUTEUR
   * (règle nº 226) — il ne peut donc pas être retiré, et il n'est pas
   * le problème : le problème est que la photo n'est pas encore là.
   * LA CAUSE, ÉTABLIE À LA nº 587 : les vignettes portent le
   * chargement à la demande et RIEN D'AUTRE. C'est le navigateur qui
   * décide seul du moment, et sa marge d'avance est bien plus étroite
   * de côté que vers le bas — il demande la photo quand elle est
   * presque dans le cadre, ce qui suffit à un défilement de page mais
   * jamais à un geste horizontal.
   *
   * LE MÉCANISME, EN CLAIR. Un GUETTEUR (`IntersectionObserver`)
   * regarde les vignettes, non pas depuis la fenêtre du navigateur,
   * mais DEPUIS LA RANGÉE ELLE-MÊME (`root`) — c'est ce qui change
   * tout : une vignette sortie du cadre est masquée par le débordement
   * de la rangée, et aucune marge prise sur la fenêtre ne peut aller la
   * chercher. Autour de cette rangée, on déclare une marge d'une
   * largeur (`AVANCE_DE_CHARGEMENT`, sa note dit pourquoi). Toute
   * vignette qui entre dans cette zone élargie est ANNONCÉE au guetteur
   * avant d'être vue ; on retire alors son attente à son image, qui
   * part se chercher, et on cesse de la guetter — une photo ne se
   * demande qu'une fois.
   *
   * ⚠️ DEUX CONDITIONS AVANT DE DEMANDER QUOI QUE CE SOIT, et c'est la
   * réponse à « la page ne doit pas ralentir » :
   *  · LA PAGE A FINI D'ARRIVER. Tant qu'elle charge, on ne demande
   *    rien : les photos d'avance ne peuvent pas disputer la ligne à
   *    ce qui est déjà à l'écran, puisqu'elles ne partent qu'après ;
   *  · CETTE RANGÉE-CI EST À L'ÉCRAN. Une VEILLEUSE (un second
   *    guetteur, celui-là depuis la fenêtre) attend que la galerie
   *    entre dans la vue, puis s'efface. Une page de « Ma sélection »
   *    qui liste dix portfolios ne paie donc que pour les galeries
   *    qu'on regarde, jamais pour les huit qui dorment plus bas.
   * ⛔ CE QUI A ÉTÉ ESSAYÉ ET QUI NE TIENT PAS : armer au PREMIER
   * DÉFILEMENT de la rangée. C'était plus simple d'une écriture, et
   * c'est faux — mesuré : l'accrochage (`scroll-snap`) recale la
   * rangée dès qu'elle se pose, ce qui émet un défilement que
   * personne n'a fait. Toutes les galeries de la page s'armaient donc
   * à l'arrivée, y compris celles qu'on ne voyait pas. La veilleuse
   * regarde ce qu'on VOIT, ce qu'aucun événement ne sait dire.
   * ⚠️ ET CE QUI PART S'EST DÉCLARÉ SECONDAIRE (`fetchpriority`) : ces
   * photos-là ne sont pas encore à l'écran, elles passent donc APRÈS
   * celles qui y sont. Elles ne peuvent pas leur disputer la ligne.
   * ⚠️ ON NE TOUCHE NI LA SOURCE NI LA TAILLE DES IMAGES (nº 175-§5) :
   * seule leur ATTENTE est levée. Le fond du cadre, lui, ne bouge pas.
   * ⚠️ LE COMPTEUR (nº 521-522) ET LA MÉMOIRE (nº 459) NE SONT PAS
   * TOUCHÉS : le guetteur ne lit ni ne pose `scrollLeft`, et il ne
   * regarde pas les cases mais les images qu'elles contiennent.
   * ⚠️ ET IL SERT LES DEUX GALERIES DU SITE SANS QU'AUCUNE NE CHANGE
   * D'UNE LIGNE — celles des portfolios suivis (BlocSuivis) comme
   * celles d'une fiche (PortfolioDeLAffiche) : toutes deux passent par
   * ce dessin, et c'est lui qui tient la rangée.
   */
  useEffect(() => {
    const cadre = zone.current;
    if (!cadre || typeof IntersectionObserver === "undefined") return;
    let guetteur: IntersectionObserver | null = null;
    let veilleuse: IntersectionObserver | null = null;
    let renonce = false;

    const armer = () => {
      if (renonce || guetteur) return;
      guetteur = new IntersectionObserver(
        (entrees) => {
          entrees.forEach((entree) => {
            if (!entree.isIntersecting) return;
            const image = entree.target as HTMLImageElement;
            guetteur?.unobserve(image);
            //  L'ordre compte : on se déclare secondaire AVANT de
            //  lever l'attente, sinon la demande partirait au rang
            //  ordinaire et le mot arriverait trop tard.
            image.setAttribute("fetchpriority", "low");
            image.setAttribute("loading", "eager");
          });
        },
        { root: cadre, rootMargin: AVANCE_DE_CHARGEMENT }
      );
      cadre
        .querySelectorAll('img[loading="lazy"]')
        .forEach((image) => guetteur?.observe(image));
    };

    //  LA VEILLEUSE : elle ne sert qu'une fois, et s'efface aussitôt.
    const veiller = () => {
      if (renonce) return;
      veilleuse = new IntersectionObserver((entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        veilleuse?.disconnect();
        veilleuse = null;
        armer();
      });
      veilleuse.observe(cadre);
    };

    if (document.readyState === "complete") veiller();
    else window.addEventListener("load", veiller, { once: true });

    return () => {
      renonce = true;
      window.removeEventListener("load", veiller);
      veilleuse?.disconnect();
      guetteur?.disconnect();
    };
    //  Le contenu change, les images changent : on reguette. C'est la
    //  même clé que l'écouteur des bouts de course, juste au-dessus.
  }, [cleDuContenu]);

  /*  §6 (nº 264) — LE CHEVRON SE DÉSHABILLE : un chevron NU, blanc —
      ni disque, ni verre, ni fond, ni contour, ni halo —, au survol de
      la rangée seulement (`group-hover`, par la VISIBILITÉ : aucun
      fondu d'opacité), et jamais au doigt (`pointer-fine`).
      §4-b (nº 301) — SA ZONE déborde de la bande des marges vers
      l'INTÉRIEUR : le bord extérieur reste celui du cadre, sans quoi
      un élément absolu qui dépasse à droite ÉLARGIRAIT le document
      (le piège de la nº 228).
      §4-c (nº 301) — et il porte une OMBRE DOUCE, jamais un contour :
      c'est le procédé du cœur des vignettes, pas un second.
      §3-a (nº 308), RÉGLÉ PAR L'APPELANT DEPUIS LA Nº 310-§4 : la
      nº 301 l'avait porté à une zone de 40 px et un dessin de 20 × 40
      au trait 3 ; sur les galeries étroites de la colonne Portfolio,
      à cette taille, il DOMINAIT l'image au lieu de l'accompagner.
      Les deux tailles existent donc, et c'est l'appelant qui choisit
      (`CHEVRON_GALERIE` / `CHEVRON_GALERIE_PETIT`) — un seul dessin,
      deux réglages. L'OMBRE NE BOUGE PAS, à aucune taille : c'est elle,
      et elle seule, qui garantit la lisibilité sur une photo claire. */
  const bandeau = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Next thumbnails" : "Previous thumbnails"}
      data-bandeau-defilement={sens === 1 ? "droite" : "gauche"}
      onClick={() => defiler(sens)}
      className={`hidden pointer-fine:flex invisible group-hover:visible
        absolute inset-y-0 z-[2] ${
          sens === 1 ? decalageDroite : decalageGauche
        } ${chevron.zone} items-center justify-center text-white`}
    >
      {/*  §1 (nº 839) — le dessin est monté au-dessus, partagé avec la
           carte-galerie ; le bandeau n'en garde que la ZONE. */}
      <ChevronDeGalerie sens={sens} taille={chevron} />
    </button>
  );

  /*  §3 (nº 264) — LE FONDU ANTHRACITE DES BORDS : chaque marge porte
      un voile vertical de la couleur du fond du site, à 90 % vers rien
      — la vignette S'EFFACE DANS LA PAGE au lieu d'être coupée net.
      Jamais d'interception de clic, et le chevron (z-[2]) se pose
      dessus (z-[1]). */
  const voile = (sens: 1 | -1) => (
    <div
      aria-hidden="true"
      data-voile-rangee={sens === 1 ? "droite" : "gauche"}
      className={`pointer-events-none absolute inset-y-0 z-[1] w-4 sm:w-6 ${
        sens === 1
          ? `${decalageDroite} bg-gradient-to-l`
          : `${decalageGauche} bg-gradient-to-r`
      } from-sombre-fond/90 to-sombre-fond/0`}
    />
  );

  return (
    <div className={`group relative ${classeEnveloppe}`}>
      <ul
        ref={zone}
        data-galerie-defilante=""
        aria-label={etiquette}
        className={`flex ${ecart} ${classeRangee}
                   overflow-x-auto snap-x snap-mandatory
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        style={styleRangee}
      >
        {children}
      </ul>
      {avecVoiles && etat.gauche && voile(-1)}
      {avecVoiles && etat.droite && voile(1)}
      {etat.gauche && bandeau(-1)}
      {etat.droite && bandeau(1)}
    </div>
  );
}
