"use client";

import { useState } from "react";
import {
  CHEVRON_GALERIE,
  CHEVRON_GALERIE_PETIT,
  ChevronDeGalerie,
  type TailleChevron,
} from "@/components/GalerieQuiDefile";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import { ECRITURE_COMPTEUR, PASTILLE_COMPTEUR } from "@/config/tatouage";

/**
 * ██ LA CARTE-GALERIE DU WEB — nº 839 ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE DEMANDE : les cartes de la mosaïque
 * deviennent des galeries. Au repos, rien ne change — la première
 * photo, nue. Au survol, deux chevrons et une pastille « 7/20 » ; les
 * chevrons font glisser les photos DANS l'encadré de la carte (la
 * grille ne bouge pas d'un pixel) ; un clic sur la photo montrée ouvre
 * la fiche SUR CETTE photo.
 *
 * ██ POURQUOI C'EST UN COMPOSANT NEUF, ET NON L'ANCIEN RÉACTIVÉ ██
 * ------------------------------------------------------------------
 * Ce comportement A EXISTÉ : `CarrouselPortfolio` en variante
 * « carte », de la nº 367 à la nº 445, qui l'a retiré sur ordre du
 * propriétaire. Sa variante « carte » dort encore dans ce dépôt, et
 * elle NE TIENT PLUS — pour une raison de structure, pas de goût :
 *  · depuis la nº 517, LA CARTE ENTIÈRE EST UN SEUL LIEN qui contient
 *    la photo et le texte. Le carrousel, lui, fait de CHAQUE PHOTO un
 *    lien et pose ses flèches en boutons AU MILIEU de la piste — des
 *    liens dans un lien, des boutons dans un lien : du contenu
 *    interactif imbriqué, que le langage interdit et que le navigateur
 *    « répare » à sa façon. C'est exactement ce qui avait forcé le
 *    fanion à sortir du lien à la nº 517 ;
 *  · ses flèches sont des DISQUES de verre (nº 368) ; la consigne de
 *    la nº 839 dit « EXACTEMENT celles des galeries de profil » —
 *    le chevron NU de la nº 264, que le site s'est donné depuis ;
 *  · il monte TOUTE la piste des photos d'un coup. Sur une mosaïque de
 *    vingt cartes, c'est le poids que la nº 445 voulait précisément
 *    retirer.
 * CE QU'ON LUI REPREND, EN REVANCHE, ET QUI NE CHANGE PAS : la photo
 * regardée part avec le lien (`?photo=`, nº 302 et 371) ; l'ensemble
 * qui défile est celui de la photo montrée — même style, même rendu,
 * même catégorie — donc exactement ce que le cœur enregistre ; et la
 * pastille garde le patron des fiches (`PASTILLE_COMPTEUR`).
 *
 * ██ LE WEB SEUL ██
 * Les commandes portent les états des galeries de profil, à la
 * lettre : `hidden`, puis présentes sur un pointeur fin, puis visibles
 * au survol de la carte. Sur un vrai mobile — pointeur grossier,
 * `data-appareil="mobile"` (règle nº 60 : l'appareil, jamais la
 * largeur) — rien n'apparaît, rien ne se charge, et la piste montre sa
 * seule première photo : le fil pleine largeur du doigt est inchangé,
 * c'est la passe suivante qui s'en occupe.
 */

/** Une photo de la piste — le sous-ensemble que la carte en connaît. */
export type PhotoDeLaPiste = {
  cle: string;
  /** L'original (1080 × 1350) quand la photo est cataloguée. */
  url: string;
  /** La miniature — le repli, et l'image des fiches de démonstration. */
  miniature: string;
};

/**
 * ██ L'ÉTAT DE LA GALERIE D'UNE CARTE ██
 * ------------------------------------------------------------------
 * Il vit chez la CARTE et non ici, et c'est la règle 328/329 en
 * petit : la photo regardée n'a qu'une seule vérité, et la carte en a
 * besoin pour bâtir l'adresse de la fiche (`?photo=`), pour le fanion,
 * et pour l'ouverture en fenêtre. Ce crochet ne fait que la tenir.
 *
 * ⚠️ `chargees` EST UNE LONGUEUR, PAS UNE LISTE, et c'est ce qui rend
 * la mesure du banc vraie : les photos demandées au réseau sont
 * TOUJOURS un préfixe — au repos la première et elle seule ; le survol
 * en ajoute une (celle d'après) ; chaque pas en ajoute une. On ne peut
 * pas sauter, donc on ne peut pas trouer. La piste ne monte que ce
 * préfixe : une carte au repos n'a QU'UNE image dans le document, et
 * la mosaïque entière ne charge jamais les portfolios entiers.
 */
export function useGalerieDeCarte(nombre: number) {
  const [indiceBrut, setIndice] = useState(0);
  const [chargees, setChargees] = useState(1);
  /*  LE RANG EST BORNÉ À CHAQUE RENDU, jamais rattrapé par un effet :
      changer de style ou de rendu recompose l'ensemble de la carte
      SANS la remonter (même fiche, mêmes clés) — une carte arrêtée sur
      la sixième photo d'une série de huit se retrouverait à viser un
      rang qui n'existe plus. Le borner ici ne coûte aucun rendu de
      plus et ne peut pas se désynchroniser. */
  const indice = Math.min(indiceBrut, Math.max(0, nombre - 1));

  return {
    indice,
    chargees: Math.min(chargees, nombre),
    /** Y a-t-il une photo avant / après celle qu'on regarde ? Ce sont
        les deux gardes des galeries de profil, qui ne montrent leur
        chevron que du côté où il reste du chemin. */
    peutReculer: indice > 0,
    peutAvancer: indice < nombre - 1,
    /** LE SURVOL PRÉPARE LA SUIVANTE, et rien de plus : au premier
        chevron, l'image est déjà là — le glissement ne montre jamais
        un cadre vide. */
    precharger: () => setChargees((eues) => Math.max(eues, 2)),
    /** UN PAS, DANS UN SENS OU DANS L'AUTRE. Il ne boucle pas : les
        galeries de profil ne bouclent pas non plus. */
    aller: (sens: 1 | -1) => {
      const cible = indice + sens;
      if (cible < 0 || cible > nombre - 1) return;
      setIndice(cible);
      //  La cible, et celle d'après : le pas suivant sera prêt.
      setChargees((eues) => Math.max(eues, Math.min(nombre, cible + 2)));
    },
  };
}

/**
 * ██ LA PISTE — DANS LE LIEN DE LA CARTE ██
 * ------------------------------------------------------------------
 * Elle ne reçoit aucun clic à elle : c'est le lien de la carte qui
 * l'entoure, et c'est lui qui ouvre la fiche — sur la photo montrée,
 * puisque l'adresse la porte. Rien d'interactif ici, donc rien
 * d'imbriqué.
 *
 * ⚠️ LE GLISSEMENT EST UNE TRANSFORMATION, PAS UN DÉFILEMENT.
 * Une piste à défilement natif (celle des galeries de profil) capterait
 * la molette horizontale et le pavé tactile au passage de la souris,
 * sur vingt cartes à la fois ; elle demanderait aussi une barre à
 * masquer et une position à mesurer. Une transformation ne prend aucun
 * geste, ne se laisse pas bousculer, et l'encadré ne bouge pas : la
 * mosaïque est immobile par construction.
 * ⚠️ AUCUNE PROMOTION DE COUCHE PERMANENTE : pas de `will-change` sur
 * vingt cartes — le navigateur promeut le temps de la transition, et
 * rend la mémoire ensuite.
 * ⚠️ LA PREMIÈRE PHOTO NE CHANGE PAS D'UNE ADRESSE (règle nº 175-§5) :
 * le rang 0 de l'ensemble EST la photo que la carte affichait déjà
 * (`photoPourStyle`, même source, même taille demandée). Rien à
 * retélécharger, rien à voir passer.
 */
export function PisteDeCarte({
  photos,
  indice,
  chargees,
  alt,
  prioritaire,
}: {
  photos: PhotoDeLaPiste[];
  indice: number;
  chargees: number;
  /** Le texte de remplacement de la carte — celui de la photo montrée
      au repos. Voir la note du rang, plus bas. */
  alt: string;
  prioritaire: boolean;
}) {
  return (
    <div
      data-piste-de-carte=""
      className="absolute inset-0 flex transition-transform duration-300
                 ease-out motion-reduce:transition-none"
      /*  LA POSITION EST UNE VALEUR, PAS UNE CLASSE : vingt photos
          feraient vingt classes de translation dans la feuille, pour
          une valeur qui se calcule. */
      style={{ transform: `translate3d(-${indice * 100}%, 0, 0)` }}
    >
      {photos.slice(0, chargees).map((photo, rang) => (
        <div key={photo.cle} className="relative w-full h-full shrink-0">
          <PhotoDeCarte
            url={photo.miniature}
            urlPleine={photo.url}
            tailles={TAILLES_CARTE}
            /*  ⚠️ LE TEXTE DE REMPLACEMENT NE SE RÉPÈTE PAS : la carte
                dit déjà ce qu'elle montre — le nom, la ville, le style
                et le rendu — et les photos suivantes disent la MÊME
                chose (c'est l'ensemble d'une seule série). Le répéter
                vingt fois n'apprendrait rien et encombrerait la lecture
                d'écran ; le lien de la carte, lui, porte son étiquette
                explicite et ne dépend pas de ces images. L'arbre
                d'accessibilité de la carte reste donc CELUI D'AVANT :
                une image décrite, et une seule. */
            alt={rang === 0 ? alt : ""}
            //  LES PREMIÈRES CARTES DE LA MOSAÏQUE NE SONT PAS
            //  DIFFÉRÉES ; les photos suivantes de la MÊME carte, si —
            //  elles n'arrivent qu'au survol, jamais à l'affichage.
            chargement={rang === 0 && prioritaire ? "eager" : "lazy"}
            priorite={rang === 0 && prioritaire ? "high" : undefined}
            //  §2 (nº 648) — `relative`, l'écriture exacte de la carte :
            //  l'image passe AU-DESSUS de la plaque d'attente. Sa
            //  géométrie ne change pas d'un pixel.
            classe="relative w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * ██ LES COMMANDES — VOISINES DU LIEN, JAMAIS DEDANS ██
 * ------------------------------------------------------------------
 * Un bouton DANS un lien est du contenu interactif imbriqué (nº 517) :
 * les deux chevrons et la pastille sont donc posés à côté du lien, sur
 * une enveloppe qui porte le format de la photo et ne prend aucun
 * clic. Seuls les trois éléments en reçoivent.
 * ⚠️ LA PASTILLE NON PLUS NE LAISSE PAS PASSER LE CLIC, et c'est la
 * décision de la nº 367 : elle est posée au-dessus du lien et ne doit
 * pas ouvrir la fiche.
 * ⚠️ LES ÉTATS SONT CEUX DES GALERIES DE PROFIL, à la lettre
 * (`GalerieQuiDefile`) : absent, puis présent sur un pointeur fin,
 * puis visible au survol de la carte — et le chevron n'existe que du
 * côté où il reste du chemin. `invisible` et non une transparence : un
 * élément seulement transparent continue de recevoir les clics.
 */
export function CommandesDeCarte({
  indice,
  nombre,
  peutReculer,
  peutAvancer,
  aller,
  pleineLargeur,
}: {
  indice: number;
  nombre: number;
  peutReculer: boolean;
  peutAvancer: boolean;
  aller: (sens: 1 | -1) => void;
  /** Une carte pleine largeur porte le grand chevron des galeries et
      la pastille des fiches ; une carte côte à côte, les réduits — le
      dessin est le même, c'est le gabarit qui suit la carte. */
  pleineLargeur: boolean;
}) {
  const chevron: TailleChevron = pleineLargeur
    ? CHEVRON_GALERIE
    : CHEVRON_GALERIE_PETIT;

  const fleche = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Next photo" : "Previous photo"}
      data-fleche-de-carte={sens === 1 ? "droite" : "gauche"}
      onClick={() => aller(sens)}
      className={`pointer-events-auto hidden pointer-fine:flex invisible
        group-hover:visible absolute inset-y-0 z-[2] ${
          sens === 1 ? "right-0" : "left-0"
        } ${chevron.zone} items-center justify-center text-white`}
    >
      <ChevronDeGalerie sens={sens} taille={chevron} />
    </button>
  );

  return (
    <>
      <span
        data-compteur-de-carte=""
        /*  ⚠️ LES MÊMES ÉTATS QUE LES CHEVRONS, ET NON CEUX DE LA
            nº 367 : celle-là laissait la pastille PERMANENTE au doigt.
            La nº 839 est une passe du WEB — au doigt, rien ne doit
            apparaître. `hidden` d'abord : sur un pointeur grossier,
            aucune des deux règles suivantes ne s'applique. */
        className={`pointer-events-auto ${PASTILLE_COMPTEUR} hidden
          pointer-fine:inline-flex invisible group-hover:visible top-2
          right-2 ${pleineLargeur ? "px-2.5 py-1.5" : "px-2 py-1"}`}
      >
        <span
          className={`${ECRITURE_COMPTEUR} ${
            pleineLargeur ? "text-[12px]" : "text-[10px]"
          }`}
        >
          {indice + 1}/{nombre}
        </span>
      </span>
      {peutReculer && fleche(-1)}
      {peutAvancer && fleche(1)}
    </>
  );
}
