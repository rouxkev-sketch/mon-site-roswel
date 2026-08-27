"use client";

import { createPortal } from "react-dom";
import { usePlacementMenu } from "@/components/placement-menu";
import type { RefObject } from "react";

/**
 * LE VERRE DU SITE — L'UNIQUE ÉCRITURE
 * ==================================================================
 * (passe nº 236-§2)
 *
 * POURQUOI CE FICHIER EXISTE. La fenêtre d'adresse de la nº 234 est le
 * seul verre qui marche, et il a coûté TROIS PASSES : les valeurs
 * étaient justes à chaque fois, la cause était structurelle. Si chaque
 * fenêtre garde son propre verre, elles reperdront le même combat une
 * à une. Il n'y a donc qu'une écriture — celle-ci —, sur le modèle de
 * `CLASSES_LIGNE_CLIQUABLE` (nº 232) et `IconeDuLien` (nº 240).
 *
 * CE QU'ELLE GARANTIT, SANS VARIATION POSSIBLE :
 *
 *  1. LA PLAQUE porte `data-verre-fenetre` — anthracite à 22 %,
 *     `blur(40px) saturate(200%)`, liseré divisé (0,10 en haut,
 *     0,035 au tour) : la règle vit dans globals.css, les deux lignes
 *     de filtre écrites littéralement, la préfixée d'abord, jamais
 *     dans un `@supports`, jamais un `var()` dedans.
 *
 *  2. LE PORTAIL. La plaque est montée dans le CORPS du document :
 *     aucun ancêtre applicatif — bloc collant, conteneur animé,
 *     `contain` d'une carte — ne peut créer une racine d'arrière-plan
 *     au-dessus d'elle. Un `backdrop-filter` ne floute que
 *     l'arrière-plan de sa racine la plus proche ; c'est la moitié de
 *     ce qui nous a coûté la nº 234.
 *
 *  3. AUCUN FONDU D'OPACITÉ SUR LA PLAQUE, JAMAIS. Une opacité
 *     inférieure à 1 fait de l'élément sa PROPRE racine : il ne floute
 *     alors plus la page, mais son propre plan. La sonde l'a attrapée
 *     à `opacity 0.0852719` pendant l'ouverture. Le fondu appartient
 *     au VOILE, qui ne floute rien.
 *
 *  4. LE VOILE ET LA PLAQUE SONT FRÈRES, et le voile porte sa couleur
 *     en `rgba`/`oklab` — jamais la propriété `opacity`. Il est ALLÉGÉ
 *     (25 %) : la plaque floute TOUT ce qui est peint derrière elle,
 *     voile compris — flouter un aplat noir donne un aplat noir.
 *
 * ⚠️ AUCUN ANCÊTRE DE LA PLAQUE ne doit porter `opacity` partielle,
 * `filter`, `transform`, `will-change`, `contain` ni `isolation` : le
 * conteneur posé ici est nu (`position: fixed`, qui ne crée aucune
 * racine), et le portail garantit le reste.
 */

/** LA PLAQUE, en classes — pour les surfaces qui gèrent elles-mêmes
    leur position (les menus déroulants, qui n'ont ni voile ni
    portail : ils sont ancrés à leur bouton). Le fond et le filtre
    viennent de l'attribut `data-verre-fenetre`. */
export const CLASSES_PLAQUE_VERRE = "rounded-2xl";

/**
 * ██ §1 (nº 655) — LA LARGEUR DES FENÊTRES DE LA BARRE ██
 * ------------------------------------------------------------------
 * D'OÙ VIENT LE NOMBRE, ET IL N'EST PAS NEUF : c'est celui de « Mon
 * compte » depuis la nº 641 — 290 × 1,15 = 333,5, arrondi à l'entier
 * du dessus. Il était écrit EN DUR chez `MenuEspace` ; « Langue » et
 * « Notifications » le rejoignent à la nº 655, sur consigne (« même
 * largeur que Mon compte »), et trois copies d'un même nombre auraient
 * fini par diverger au premier réglage.
 * ⚠️ IL NE VAUT QUE POUR LES FENÊTRES ANCRÉES À LA BARRE : le menu des
 * styles, le panneau des filtres et le menu du globe ont leurs propres
 * largeurs, réglées pour leur contenu.
 */
export const LARGEUR_FENETRE_BARRE = 334;

/**
 * ██ §1 (nº 655) — L'ENCADRÉ, LA BOÎTE DE BASE DE CES FENÊTRES ██
 * ------------------------------------------------------------------
 * C'est la classe que « Mon compte » emploie depuis la nº 530 pour
 * TOUTES ses boîtes (le portfolio, le compte, les tuiles) — elle vivait
 * dans le corps de `MenuEspace`. « Langue » prend la même à la nº 655
 * (« son contenu sur le modèle des encadrés de Mon compte ») et
 * « Notifications » aussi, pour son encadré du bas.
 * ⚠️ UN SEUL CRAN AU-DESSUS DU FOND DE LA FENÊTRE : `eleve` sur
 * `carte` — voir la note du drapeau `opaque`, plus bas, qui chiffre ce
 * que l'écart vaut.
 */
export const CLASSE_ENCADRE_FENETRE = "rounded-xl bg-sombre-eleve";

/**
 * UNE SURFACE DE VERRE ANCRÉE — un menu déroulant, un panneau de
 * suggestions. Pas de voile (la page reste vivante autour), pas de
 * portail imposé : l'appelant place la surface où il veut.
 * ⚠️ ELLE NE DOIT PORTER AUCUNE TRANSITION D'OPACITÉ : c'est la règle
 * nº 3 ci-dessus, et elle vaut ici aussi.
 */
export function SurfaceDeVerre({
  className = "",
  enfants,
  ...reste
}: {
  className?: string;
  enfants: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-verre-fenetre="" className={className} {...reste}>
      {enfants}
    </div>
  );
}

/**
 * UN MENU ANCRÉ EN VERRE — la plaque posée sous son bouton
 * ==================================================================
 * (passe nº 238-§3 et §4)
 *
 * POURQUOI IL EXISTE, ET CE QU'IL RÉPARE. Trois panneaux du site
 * s'ouvraient « sous leur bouton » en `absolute` : le panneau des
 * filtres, la fenêtre « Mon compte » du web et celle des langues.
 * Deux défauts en découlaient, tous deux relevés par le propriétaire :
 *
 *  · LE PANNEAU DES FILTRES NE S'OUVRAIT PLUS EN FENÊTRE RÉTRÉCIE
 *    (nº 238-§3). Il était rendu, visible, à la bonne place — et
 *    ENTIÈREMENT COUPÉ : sous 1024 px, la rangée du moteur porte
 *    `max-lg:overflow-hidden` (nº 147), qui sert à la replier au
 *    défilement. Tout ce qui déborde de la rangée est rogné, panneau
 *    compris. Aucune exception, aucune erreur en console : un ciseau.
 *
 *  · LE VERRE NE FLOUTAIT RIEN sur ces surfaces (nº 238-§4) : la barre
 *    fixe porte elle-même un `backdrop-filter`, donc une RACINE
 *    D'ARRIÈRE-PLAN — un enfant n'y floute plus que l'intérieur de la
 *    barre. C'est la leçon de la nº 234, appliquée aux menus.
 *
 * LE PORTAIL RÈGLE LES DEUX D'UN COUP : la plaque est montée dans le
 * corps du document, plus aucun ancêtre applicatif ne la coupe ni ne
 * lui vole sa racine, et `usePlacementMenu` la repose sous son bouton
 * à chaque image (défilement, redimensionnement, clavier).
 *
 * ⚠️ LE PANNEAU N'EST PLUS DANS LA ZONE DU BOUTON : les fermetures
 * « au clic dehors » doivent tester la plaque EN PLUS de leur zone —
 * d'où `refPanneau`.
 */
export function MenuDeVerre({
  ouvert,
  ancre,
  refPanneau,
  largeur,
  alignement = "droite",
  decalageHaut = 0,
  largeurAuContenu = false,
  opaque = false,
  className = "",
  children,
  ...reste
}: {
  ouvert: boolean;
  /** Le bouton sous lequel le menu se pose. */
  ancre: RefObject<HTMLElement | null>;
  /** Pour que l'appelant reconnaisse « dedans » malgré le portail. */
  refPanneau?: RefObject<HTMLDivElement | null>;
  /** Largeur voulue, bornée à l'écran (16 px de marge de chaque côté). */
  largeur: number;
  /** Le bord du bouton sur lequel le menu s'aligne. */
  alignement?: "droite" | "gauche";
  /**
   * §1 (nº 650) — DE COMBIEN LE PANNEAU DESCEND SOUS SA PLACE
   * NATURELLE. Le placement (usePlacementMenu) pose le haut du panneau
   * au bas de l'ancre plus quatre pixels ; ce nombre-ci s'y ajoute,
   * pour les seuls menus qui doivent s'aligner sur une AUTRE famille de
   * déclencheurs. Le compte et les langues le demandent — leurs boutons
   * ronds font 40 px quand les champs du moteur en font 46, et leurs
   * panneaux partaient donc 3 px plus haut (voir
   * `ALIGNEMENT_BOUTON_ROND_BARRE`, où la valeur est calculée).
   * ⚠️ IL NE JOUE QUE VERS LE BAS : un menu qui s'ouvre VERS LE HAUT
   * (place manquante dessous) garde son ancrage d'origine — il n'a plus
   * de rangée de moteur à côté de quoi se ranger, et le descendre le
   * ferait mordre son propre déclencheur.
   */
  decalageHaut?: number;
  /**
   * ██ §4-a (nº 473) — LA LARGEUR ÉPOUSE LE CONTENU ██
   * `largeur` devient alors un PLAFOND, plus une consigne : le panneau
   * prend la place que son contenu demande (`max-content`) sans jamais
   * dépasser ni ce plafond ni l'écran. C'est ce qu'il faut au panneau
   * des filtres, dont les badges sont bien plus étroits que les 420 px
   * imposés — le vide tombait tout entier à droite, contre un
   * rembourrage régulier à gauche.
   * ⚠️ SANS CE DRAPEAU, RIEN NE CHANGE : les autres menus de verre
   * (le compte, les langues) gardent leur largeur fixe au pixel.
   */
  largeurAuContenu?: boolean;
  /**
   * ██ §6 (nº 537) — CE MENU-CI N'EST PAS EN VERRE ██
   * ------------------------------------------------------------------
   * « Mon compte » a pris la disposition de la page du doigt (nº 536) :
   * des encadrés posés les uns sous les autres. Un fond translucide
   * sous des encadrés, c'est la page qui remonte à travers eux — le
   * propriétaire le veut OPAQUE.
   * LA COULEUR, À LA nº 537, ÉTAIT DÉDUITE : le verre des menus EST le
   * fond de page à 45 % (globals.css, la teinte de la nº 466), et le
   * rendre opaque revenait au MÊME jeton à 100 % — `sombre-fond`.
   * ██ §1 (nº 542) — ELLE MONTE D'UN CRAN, ET C'EST UN ESSAI ██
   * ------------------------------------------------------------------
   * Le fond de page laissait la fenêtre à 1,00 de contraste avec la
   * page : rigoureusement la même couleur. Elle prend le cran
   * au-dessus de l'échelle de la nº 466 — `carte`, #1A1F26 — sur
   * demande du propriétaire, qui veut JUGER cette teinte avant d'y
   * soumettre les quatre autres fenêtres du web. Toujours aucune
   * couleur nouvelle : c'est le jeton voisin, pas une teinte inventée.
   * ⚠️ CE DRAPEAU N'A QU'UN SEUL PORTEUR, et c'est ce qui rend l'essai
   * sûr : `MenuEspace` est le seul à le passer. Les autres menus de
   * verre (les langues, le panneau des filtres du moteur) ne le
   * passent pas — ils gardent leur plaque au pixel, et rien de ce qui
   * s'écrit ici ne les atteint.
   * ⚠️ CE QUE L'ESSAI COÛTE, ET IL FAUT LE SAVOIR AVANT DE L'ÉTENDRE :
   * les encadrés et les tuiles vivent un cran plus haut (`eleve`) ;
   * leur écart au fond de la fenêtre tombe de 1,37 à 1,18. Ils se
   * détachent encore, mais de peu — l'échelle est serrée (le relevé
   * nº 498). Rien n'est retouché pour compenser : le propriétaire juge
   * sur pièce.
   * ⚠️ ET LA FENÊTRE SE DÉTACHAIT DÉJÀ SANS COULEUR : « Mon compte »
   * pose le voile de la page (nº 293/294), qui assombrit tout SAUF
   * elle. Ce voile ne change pas ; la teinte lui AJOUTE un second
   * moyen, elle ne le remplace pas. Toujours aucune bordure, aucune
   * ombre — la charte est tenue.
   * ⚠️ SUR DEMANDE, ET C'EST TOUT LE POINT : le drapeau est FAUX par
   * défaut. Les deux autres menus de verre du site (les langues, le
   * panneau des filtres du moteur) ne le passent pas et gardent leur
   * plaque au pixel. On ne touche pas non plus à `globals.css`, où les
   * fonds de verre sont écrits en dur (règle nº 172) : c'est
   * l'ATTRIBUT qui n'est plus posé, pas la règle qui change.
   */
  opaque?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { cadre, hauteurMax, ouvreVersLeHaut } = usePlacementMenu(ouvert, ancre);
  if (!ouvert || typeof document === "undefined") return null;

  //  La largeur tient toujours dans l'écran ; l'alignement se calcule
  //  sur le bouton, puis on ramène le panneau dans les bords.
  const marge = 16;
  const large = Math.min(largeur, window.innerWidth - 2 * marge);
  const bordDroit = cadre ? cadre.gauche + cadre.largeur : window.innerWidth;
  const gaucheVoulue =
    alignement === "droite" ? bordDroit - large : (cadre?.gauche ?? marge);
  const gauche = Math.max(
    marge,
    Math.min(gaucheVoulue, window.innerWidth - large - marge)
  );

  return createPortal(
    <div
      {...reste}
      ref={refPanneau}
      {...(opaque ? {} : { "data-verre-menu": "" })}
      className={`z-[75] rounded-2xl overflow-y-auto overscroll-contain ${
        opaque ? "bg-sombre-carte " : ""
      }${className}`}
      style={{
        position: "fixed",
        /*  §4-a (nº 473) — DEUX POSES, UNE SEULE GÉOMÉTRIE. À largeur
            fixe (le cas de toujours) : on calcule `left` et l'on pose
            la largeur. À largeur AU CONTENU : on ancre le BORD qui
            sert d'alignement — le droit du bouton pour un menu aligné
            à droite — et c'est le navigateur qui déduit l'autre, une
            fois le contenu mesuré ; `maxWidth` garde le plafond ET la
            marge d'écran. Le calage vertical, la hauteur maximale et
            la règle du verre ne changent pas. */
        ...(largeurAuContenu
          ? alignement === "droite"
            ? { right: Math.max(marge, window.innerWidth - bordDroit) }
            : { left: Math.max(marge, cadre?.gauche ?? marge) }
          : { left: gauche, width: large }),
        ...(largeurAuContenu
          ? { width: "max-content" as const, maxWidth: large }
          : {}),
        ...(cadre
          ? ouvreVersLeHaut
            ? { bottom: cadre.bas }
            //  §1 (nº 650) — le décalage d'alignement, quand
            //  l'appelant en demande un (voir `decalageHaut`).
            : { top: cadre.haut + decalageHaut }
          : { top: 0 }),
        maxHeight: hauteurMax ? `${hauteurMax}px` : undefined,
        //  ⚠️ AUCUNE TRANSITION D'OPACITÉ, AUCUNE OPACITÉ PARTIELLE :
        //  la plaque deviendrait sa propre racine d'arrière-plan et ne
        //  flouterait plus que son propre plan (règle nº 3).
        visibility: cadre ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

/**
 * UNE FENÊTRE SUPERPOSÉE EN VERRE — voile + plaque, montée dans le
 * corps du document. C'est la forme de la fenêtre d'adresse (nº 234),
 * rendue disponible à toutes les autres.
 */
export function FenetreDeVerre({
  ariaLabel,
  ariaLabelledby,
  surFermeture,
  largeur = "max-w-[440px]",
  classePlaque = "",
  rembourrage = "p-6",
  classeCadre = "p-6 z-[80]",
  dense = false,
  opaque = false,
  children,
}: {
  ariaLabel?: string;
  ariaLabelledby?: string;
  /** L'appui à côté referme. Absent : la fenêtre ne se ferme que par
      ses propres boutons (une confirmation qu'on ne fuit pas). */
  surFermeture?: () => void;
  largeur?: string;
  classePlaque?: string;
  /** L'air INTÉRIEUR de la plaque — `p-0` quand la fenêtre pose
      elle-même ses marges (un en-tête d'un bord à l'autre). */
  rembourrage?: string;
  /** LA TEINTE DENSE (nº 240-§3) : 45 % au lieu de 22 — pour les
      fenêtres qui s'ouvrent au-dessus des cartes de flashs, souvent
      blanches. Voile, flou et liseré inchangés. */
  dense?: boolean;
  /**
   * ██ §1 (nº 543) — CETTE FENÊTRE-CI N'EST PAS EN VERRE ██
   * ------------------------------------------------------------------
   * LE MÊME PROCÉDÉ QUE CELUI DES MENUS (le drapeau `opaque` de
   * `MenuDeVerre`, nº 537), transposé aux fenêtres : l'attribut de
   * verre n'est simplement PAS POSÉ, et la plaque prend le jeton
   * `carte` de la nº 466 — celui que « Mon compte » porte depuis la
   * nº 542, et que le propriétaire étend ici. `globals.css` n'est pas
   * touché (règle nº 172) : c'est l'ATTRIBUT qui disparaît, pas la
   * règle qui change.
   * ⚠️ CE QUI PART AVEC L'ATTRIBUT, ET IL FAUT LE SAVOIR : le LISERÉ.
   * `data-verre-fenetre` porte, en plus du fond et du flou, un fin
   * trait clair en ombres internes — l'épaisseur de la plaque, seule
   * exception écrite à « aucun contour ». Sans verre il n'a plus rien
   * à suggérer, et la charte n'en demande aucun : la fenêtre se dit
   * désormais par son seul fond.
   * ⚠️ LE VOILE NE BOUGE PAS : il vit au-dessus, dans le cadre, et
   * c'est lui qui continue de détacher la fenêtre de la page.
   * ⚠️ `dense` DEVIENT SANS OBJET quand ce drapeau est passé — il ne
   * règle que la teinte du VERRE. Les deux ne se contredisent pas :
   * aucun attribut n'étant posé, aucune des deux règles ne s'applique.
   * ⚠️ FAUX PAR DÉFAUT : les autres fenêtres de verre du site (Partage,
   * invitation de compte, adresse, envoi, signalement…) ne le passent
   * pas et gardent leur plaque au pixel.
   */
  opaque?: boolean;
  /** L'air AUTOUR de la fenêtre, et son étage. Une fenêtre ouverte
      depuis une autre monte au-dessus d'elle. */
  classeCadre?: string;
  children: React.ReactNode;
}) {
  const fenetre = (
    <div
      role="dialog"
      aria-modal="true"
      {...(ariaLabelledby ? { "aria-labelledby": ariaLabelledby } : {})}
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
      className={`fixed inset-0 flex items-center justify-center ${classeCadre}`}
    >
      {/*  LE VOILE — allégé, sa couleur portée par la couleur (jamais
           par `opacity`), et c'est LUI qui porte le fondu. */}
      {surFermeture ? (
        <button
          type="button"
          aria-label="Fermer"
          onClick={surFermeture}
          className="absolute inset-0 bg-black/25
                     opacity-100 transition-opacity duration-200 starting:opacity-0"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/25
                     opacity-100 transition-opacity duration-200 starting:opacity-0"
        />
      )}

      {/*  LA PLAQUE — aucune opacité, aucune transition d'opacité.
           §1 (nº 543) — opaque : aucun attribut de verre, le jeton
           `carte` à la place (voir le drapeau, plus haut). */}
      <div
        {...(opaque
          ? {}
          : {
              "data-verre-fenetre": "",
              ...(dense ? { "data-verre-dense": "" } : {}),
            })}
        className={`relative w-full ${largeur} rounded-3xl ${
          opaque ? "bg-sombre-carte " : ""
        }${rembourrage} ${classePlaque}`}
      >
        {children}
      </div>
    </div>
  );

  //  Jamais pendant le rendu du serveur (`document` n'existe pas) :
  //  une fenêtre ne s'ouvre que sur un geste.
  return typeof document === "undefined"
    ? fenetre
    : createPortal(fenetre, document.body);
}
