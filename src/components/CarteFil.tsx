"use client";

import Link from "next/link";
import { AvatarRond } from "@/components/AvatarRond";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { IconeHistogramme } from "@/components/Icones";
//  §8 (nº 867) — l'écriture unique du nombre de vues (999, 1K, 12.3K, 1M).
import { vuesAffichees } from "@/lib/format-vues";
import { PointsDuCarrousel } from "@/components/CarrouselPortfolio";
import { FenetreSignalement } from "@/components/FenetreSignalement";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { villeAffichee, type LieuAffichable } from "@/lib/adresse";
import { adresseDeLienInterne } from "@/lib/lien-interne";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { BadgeTypeDeFiche } from "@/components/BadgeTypeDeFiche";
import { ligneDeLieuDeCarte } from "@/lib/photo-tatoueur";
import type { PhotoGalerie } from "@/lib/photo-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * ██ LA CARTE DU FIL — LES RÉSULTATS AU DOIGT, FAÇON INSTAGRAM (nº 841) ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE DEMANDE : sur un vrai mobile, les résultats
 * de recherche (par style, par ville…) abandonnent la grille de deux
 * colonnes pour un FIL pleine largeur, une carte par rangée. Et la
 * fiche intermédiaire du doigt — carte → vue photo → plaque du profil
 * — DISPARAÎT : ce qu'elle montrait (la photo en grand, le compteur,
 * les points, le partage, le fanion) est INTÉGRÉ À LA CARTE, et la
 * carte mène AU PROFIL directement.
 *
 * LA CARTE, DE HAUT EN BAS :
 *  a. L'EN-TÊTE (ici, `EnTeteDeFil`) : l'avatar à gauche ; à sa droite
 *     le TITRE — LE NOM SEUL, en gras blanc (nº 843) — et le SOUS-TITRE,
 *     la ville seule (`ligneDeLieuDeCarte`) ; à droite, face à l'avatar,
 *     LE BADGE DU TYPE (nº 843, `BadgeTypeDeFiche` : « Private Studio »,
 *     contour fin, un lien vers le profil). Avatar, titre et sous-titre
 *     sont UN SEUL lien, vers LE PROFIL (`adresseDeLienInterne` —
 *     l'adresse que la plaque du profil et les liens internes écrivent
 *     déjà) ; le badge en est un second, voisin, vers la même
 *     destination.
 *     ⚠️ « FOLLOW » A QUITTÉ LE FIL À LA nº 843 (décision du
 *     propriétaire) : on décide de suivre quelqu'un qu'on est venu voir,
 *     donc sur son profil — où le badge est resté, intact ;
 *  b. L'IMAGE (chez la carte, CarteTatoueur) : pleine largeur, encadré
 *     fixe ; les photos de l'ensemble GLISSENT au doigt — défilement
 *     natif avec accrochage par photo, `CarrouselPortfolio` en variante
 *     « carte », le même carrousel que la fiche ; la pastille « 7/20 »
 *     en haut à droite (le patron partagé de la nº 839 — et, depuis la
 *     nº 844, la RÈGLE partagée : invisible au repos, allumée par le
 *     glissement, éteinte trois secondes après le dernier geste, voir
 *     `PastilleCompteur`). Un toucher sur l'image NE FAIT RIEN : aucune
 *     photo n'est un lien ;
 *  c. LE PIED (ici, `PiedDeFil`), à trois places depuis la nº 842 :
 *     SIGNALER à gauche, les POINTS de position au centre (la frise des
 *     fiches, `PointsDuCarrousel` — une seule écriture), le PARTAGE puis
 *     le FANION à droite. Toutes les icônes sont celles des fiches au
 *     doigt, à l'échelle (cibles de 40 px) ; le fanion enregistre LA
 *     PHOTO AFFICHÉE.
 *
 * ██ POURQUOI CES DEUX BLOCS SONT DES VOISINS DU LIEN DU WEB ██
 * Sur le web, la carte entière est UN lien qui la contient (nº 517) —
 * et sur le fil, l'image ne doit être un lien pour PERSONNE, pendant que
 * l'en-tête en est un et que le pied porte des boutons. Les deux
 * structures ne peuvent pas être la même : le serveur rend les deux, et
 * la feuille de style montre l'une ou l'autre selon l'appareil
 * (`mobile:`, `data-appareil` — règle nº 60, jamais une largeur). C'est
 * le motif des bascules d'appareil du site (la plaque du profil de
 * FicheTatoueur suit exactement ce chemin), et c'est ce qui rend le
 * premier rendu juste sur les deux appareils : rien ne saute à
 * l'hydratation. Ce que cela coûte est dit chez la carte.
 */

/**
 * ██ §2 (nº 845) — LES DEUX RANGÉES SONT DES ÉCRITURES NOMMÉES ██
 * ------------------------------------------------------------------
 * L'en-tête et le pied de la carte du fil ont un SECOND consommateur
 * depuis la nº 845 : le SQUELETTE d'attente (components/
 * SquelettesDePage), qui doit épouser cette carte au pixel — sans quoi
 * la liste saute à l'arrivée. Les deux chaînes sortent donc du JSX pour
 * être lues aux deux endroits (la règle du site, nº 276 : le second
 * porteur extrait, aucune valeur n'est choisie au passage).
 * ⚠️ CE SONT LES BOÎTES, PAS LEUR CONTENU : ce que chaque rangée
 * CONTIENT reste écrit chez elle — le squelette y met des rectangles
 * gris, la carte y met des liens et des boutons. Ce qui doit coïncider,
 * et que ces deux chaînes garantissent, c'est la GÉOMÉTRIE : l'appareil
 * (`mobile:`, règle nº 60), l'alignement, les écarts, les marges et la
 * hauteur minimale.
 */
/*  §3 (nº 863) — LES MARGES DE L'EN-TÊTE, LISIBLES À PART : la carte
    d'un fil de galerie (FilDeGalerie) n'a pas la rangée avatar / nom /
    badge, mais elle pose son titre dans LA MÊME BOÎTE — seize pixels de
    côté, douze au-dessus de l'image. Un troisième porteur, aucune valeur
    recopiée (règle nº 276). */
/**
 * ██ nº 876 — UNE SEULE ÉCRITURE DE L'EN-TÊTE ET DU PIED, POUR TOUT LE
 * SITE (MOBILE ET WEB) ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE : les cartes du WEB prennent LA STRUCTURE des
 * cartes du fil — l'en-tête (avatar, nom, ville, badge du type)
 * au-dessus de la photo, le pied (signaler, vues, points, fanion,
 * partage) en dessous ; la grille reste. « L'appareil ne décide que
 * des colonnes. » Ces deux rangées cessent donc de porter LEUR
 * APPAREIL : les chaînes ci-dessous ne disent plus que la géométrie
 * (alignement, écarts, marges, hauteur), et c'est L'APPELANT qui dit
 * l'affichage — une carte des résultats les montre aux deux appareils
 * (`flex`), une carte de « Ma sélection » au web seul (`hidden
 * not-mobile:flex` — sa vignette côte à côte du doigt n'a pas la place,
 * nº 865), la vue photo d'une fiche au doigt seul (`hidden
 * mobile:flex`, nº 862-§3). UNE seule déclaration d'affichage par
 * rangée et par appareil (piège nº 389), posée en tête de la classe.
 * ⚠️ LE SQUELETTE COMPOSE DE LA MÊME FAÇON (SquelettesDePage) : la
 * boîte vient d'ici, l'affichage de lui.
 */
export const MARGES_EN_TETE_DE_FIL = "px-4 pb-3";
export const RANGEE_EN_TETE_DE_FIL = `items-center gap-3 ${MARGES_EN_TETE_DE_FIL}`;
/*  ⚠️ `relative` PORTE LES POINTS EN ABSOLU (voir la note du pied) ;
    `min-h-10` est la hauteur des cibles tactiles, et c'est elle qui
    fixe la hauteur du pied — le squelette la reprend telle quelle. */
export const RANGEE_PIED_DE_FIL =
  "relative min-h-10 items-center justify-between px-4 pt-1";

/** L'EN-TÊTE DU FIL — avatar, nom, ville, puis le badge du type. */
export function EnTeteDeFil({
  tatoueur,
  lieu,
  affichage = "flex",
}: {
  tatoueur: Tatoueur;
  lieu: LieuAffichable;
  /** nº 876 — CE QUE L'APPELANT DIT DE L'APPAREIL (voir l'en-tête) :
      `flex` aux deux, `hidden not-mobile:flex` au web seul, `hidden
      mobile:flex` au doigt seul. */
  affichage?: string;
}) {
  return (
    <div
      data-en-tete-de-fil=""
      className={`${affichage} ${RANGEE_EN_TETE_DE_FIL}`}
    >
      {/*  UN SEUL LIEN POUR LES TROIS (avatar, titre, sous-titre), vers
           le profil — pas deux liens côte à côte vers la même
           destination (la leçon de la nº 455). Le texte est son nom
           accessible : aucune étiquette à ajouter. */}
      <Link
        href={adresseDeLienInterne(tatoueur.slug)}
        data-lien-profil-de-fil=""
        className="flex min-w-0 flex-1 items-center gap-3 outline-none
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-primaire"
      >
        {/*  L'ÉCRITURE DE LA PLAQUE DU PROFIL (FicheTatoueur, nº 502 et
             nº 524) : le rond sur le cran du dessus, l'initiale de
             16 px — c'est la même rangée, à la même place dans le
             parcours : là où, hier, la plaque menait au profil. */}
        <AvatarRond
          photo={tatoueur.photo_profil}
          nom={tatoueur.nom}
          classeFond="bg-sombre-haut"
          classeInitiale="text-[16px] font-bold text-sombre-texte-doux"
          paresseux
        />
        <span className="min-w-0 flex-1">
          {/*  LE NOM ET SA LIGNE : la typographie de la plaque du profil
               (nº 555 pour le nom à 16 px, nº 455 pour la ligne à
               14,5) — le même texte, lu au même endroit du parcours.
               ██ §2 (nº 843) — CHACUNE TIENT SUR UNE SEULE LIGNE ██
               Décision du propriétaire : le nom et la ville ne passent
               JAMAIS à la ligne. Trop longs, ils sont COUPÉS par des
               points de suspension (`truncate`), et le badge du type
               reste entier à droite — c'est lui qui ne cède pas
               (`shrink-0`, chez lui).
               ⚠️ LES DEUX BOÎTES QUI RENDENT LA COUPE POSSIBLE : le
               `min-w-0` de cette colonne (sans lui, une boîte de
               flexion refuse de descendre sous la largeur de son
               texte, et déborde au lieu de couper) et le `truncate` de
               chaque ligne. Le badge, lui, garde sa largeur : la
               colonne cède la première. */}
          <span className="block truncate text-[16px] font-semibold leading-tight text-sombre-texte">
            {tatoueur.nom}
          </span>
          <span className="block truncate text-[14.5px] leading-tight text-sombre-texte-doux mt-1">
            {ligneDeLieuDeCarte(lieu)}
          </span>
        </span>
      </Link>
      {/*  ██ §1 (nº 843) — LE BADGE DU TYPE, À LA PLACE DE « FOLLOW » ██
           Sa robe, sa boîte et sa destination sont écrites chez lui
           (components/BadgeTypeDeFiche). Il est HORS du lien de
           l'en-tête — deux liens voisins vers le profil, jamais l'un
           dans l'autre (nº 517). */}
      <BadgeTypeDeFiche tatoueur={tatoueur} />
    </div>
  );
}

/** LE PIED DU FIL — les vues et le signalement à gauche, les points au
    centre, le fanion puis le partage à droite (nº 852-§7). */
export function PiedDeFil({
  tatoueur,
  photos,
  indice,
  surRang,
  cheminAPartager,
  metier,
  vues,
  affichage = "flex",
}: {
  /** nº 876 — l'affichage selon l'appareil, dit par l'appelant (voir
      l'en-tête du fichier). */
  affichage?: string;
  tatoueur: Tatoueur;
  photos: PhotoGalerie[];
  indice: number;
  /** Un rond touché : la carte y met le poseur d'indice du carrousel,
      qui glisse alors jusqu'à la photo (nº 217). */
  surRang: (rang: number) => void;
  /** L'adresse que le partage envoie — celle de la photo regardée, la
      même que le lien de la carte du web emporte. */
  cheminAPartager: string;
  /** Le style montré, pour le message pré-rempli du partage. */
  metier: string;
  /**
   * ██ §7 (nº 852) — LE NOMBRE DE VUES ██
   * DEMANDÉ PAR LE PROPRIÉTAIRE : « à gauche de l'icône signaler, une
   * icône STATISTIQUES précédée du nombre de vues (« 28 » puis
   * l'icône) ».
   * ⚠️ ET IL N'A AUCUNE SOURCE AUJOURD'HUI, ce qui doit être dit plutôt
   * que caché : le site ne compte les vues NULLE PART — ni colonne sur
   * `tatoueurs` ou `photos_tatoueur`, ni table de statistiques, ni
   * signal de classement (vérifié, base et code). Le SQL qui crée ce
   * compteur est livré avec la passe (`docs/SQL-852-VUES.md`), à coller
   * à la main comme toujours ; le jour où la colonne existe et voyage
   * jusqu'ici, le bloc s'affiche tout seul.
   * ⚠️ RIEN N'EST INVENTÉ : le bloc ne montre que ce que la base
   * compte — et « 0 » en est le premier état, pas une absence.
   * ██ nº 853 — LE SQL EST PASSÉ, ET LE NOMBRE ARRIVE ██
   * Le propriétaire a exécuté le SQL nº 852 : la colonne `vues` existe,
   * la fonction `compter_vue_portfolio` aussi. Le nombre voyage
   * désormais de la base (colonne `vues`, lue avec la fiche) jusqu'ici,
   * et une vue est comptée à l'ouverture d'un profil (une par
   * portfolio et par session/heure — lib/vue-portfolio).
   * ██ BOGUE Nº 853 — POURQUOI IL N'ARRIVAIT PAS (corrigé nº 854) ██
   * La recherche n'emprunte pas la lecture par colonnes mais la
   * fonction `rechercher_tatoueurs`, qui fabrique une fiche RÉDUITE
   * où `vues` ne figure pas (elle est plus vieille que la colonne).
   * `lib/tatoueurs` recolle désormais le nombre sur les fiches
   * rendues (`avecLesVues`) : voir la note complète là-bas.
   */
  vues?: number | null;
}) {
  return (
    <div
      data-pied-de-fil=""
      /*  ██ §4 (nº 842) — LES TROIS PLACES DU PIED ██
          Décision du propriétaire : SIGNALER à gauche, les POINTS au
          centre, le PARTAGE puis le FANION à droite. La nº 841 avait
          groupé les deux gestes à droite ; ils s'écartent, et le fanion
          les rejoint.
          ⚠️ LES DEUX GROUPES SONT AUX EXTRÉMITÉS (`justify-between`) et
          les points restent CENTRÉS SUR LA CARTE ENTIÈRE, pas sur ce
          qui reste entre eux : ils sont posés en absolu, comme sous la
          photo d'une fiche au doigt (nº 598). Les centrer entre les
          groupes les décalerait dès que l'un des deux change de
          largeur. */
      className={`${affichage} ${RANGEE_PIED_DE_FIL}`}
    >
      {/*  ██ §1 (nº 855) — LE SIGNALEMENT OUVRE LE PIED, PUIS LES VUES ██
           TROIS CHOSES CHANGENT, ET CE SONT LES TROIS DE LA CONSIGNE :
            · LA PLACE — le bloc des vues passe À DROITE du signalement
              (la nº 852 l'avait mis à gauche) ;
            · L'ORDRE À L'INTÉRIEUR — le DESSIN d'abord, le NOMBRE
              ensuite (« icône puis 28 »), l'inverse de la nº 852 ;
            · LE DESSIN ET LA COULEUR — un ŒIL au trait fin à la place
              de l'histogramme, et les deux en BLANC (le blanc de la
              charte, `text-sombre-texte`) là où le gris doux les
              posait en retrait.
           ⚠️ CE N'EST PAS UN BOUTON : rien à toucher, rien à ouvrir. Un
           dessin et un nombre, avec l'écart de la rangée entre eux.
           ⚠️ IL PARAÎT TOUJOURS, ET « 0 » EST UN NOMBRE (nº 854). La
           nº 853 le cachait tant que le compteur n'avait pas dépassé
           un ; le propriétaire tranche : le bloc s'affiche sur chaque
           carte, et un portfolio que personne n'a encore ouvert
           annonce zéro. Une carte sans nombre du tout — base sans le
           SQL nº 852 — dit zéro elle aussi : c'est la vérité de ce que
           le site sait compter.
           SIGNALER GARDE SA PLACE ET SON RETRAIT, et c'est lui qui
           ouvre désormais la rangée : sa cible de 40 px ramenée sur la
           marge de la page — le retrait vaut le vide autour du glyphe,
           (40 − 22) / 2 = 9, arrondi au cran de l'échelle (8 px).
           ⚠️ ET LES VUES N'ONT PLUS DE REMBOURRAGE À GAUCHE : le bloc
           commence là où finit la cible du signalement, ce qui laisse
           entre le glyphe barré et l'œil très exactement les neuf
           pixels de vide que le signalement porte déjà à l'intérieur
           de sa propre cible. L'écart se lit donc régulier, sans
           qu'aucun nombre ait été inventé pour lui.
           ██ §7 (nº 867) — LES QUATRE DESSINS À LA MÊME TAILLE ██
           Décision du propriétaire : le signalement et les vues
           prennent la taille du fanion et du partage — DESSIN de 24 px
           (chez le signalement, FenetreSignalement ; ici pour
           l'histogramme) et CIBLE de 40 px (le bloc des vues reçoit la
           hauteur des trois cibles ; celle du signalement les avait
           déjà). Les glyphes de gauche gagnent donc deux pixels, et
           l'air se recalcule au pixel juste en dessous.
           ██ §3 (nº 866, REPRIS nº 867) — CES NEUF PIXELS ÉTAIENT TROP SERRÉS ██
           Le propriétaire compare les deux bouts de la rangée : entre
           le FANION et le PARTAGE, les cibles de 40 px se touchent et
           leurs glyphes de 24 laissent SEIZE pixels de boîte à boîte
           (8 + 8) ; entre SIGNALER et le bloc des vues, il n'y en
           avait que neuf. Les deux airs doivent être LE MÊME, et c'est
           celui de droite qui fait la valeur : SEIZE. Le bloc des vues
           reçoit donc de la marge à gauche — mesuré sur les boîtes des
           dessins, 16 des deux côtés ; en encre, 23,7 des deux côtés,
           l'histogramme ayant été dessiné pour cela (voir
           IconeHistogramme).
           ⚠️ LA VALEUR SUIT LA TAILLE DES DESSINS (nº 867) : le glyphe
           du signalement passe de 22 à 24 px dans sa cible de 40, le
           vide qu'elle porte à droite tombe donc de neuf à HUIT — et
           la marge du bloc des vues passe de sept à HUIT pour que les
           deux airs vaillent toujours seize. Aucun nombre neuf : c'est
           le même compte, refait sur les nouvelles boîtes. */}
      <div className="relative flex shrink-0 items-center -ml-2">
        <FenetreSignalement
          slug={tatoueur.slug}
          nom={tatoueur.nom}
          variante="icone"
        />
        {/*  ██ BOGUE Nº 853, CORRIGÉ À LA nº 854 ██
             La nº 853 écrivait ici `vues > 0` : « à partir d'une vue,
             pas de zéro ». Le propriétaire le refuse — le bloc doit
             PARAÎTRE, et montrer « 0 » quand le compteur est à zéro.
             Aucune condition ne reste donc : un nombre absent (base
             sans le SQL nº 852, fiche de démonstration) se lit zéro.
             ⚠️ L'ŒIL EST CELUI DU SITE (`IconeOeil`), pas un second
             dessin d'œil : il sert déjà à montrer un mot de passe, et
             les deux ne se croisent nulle part — une carte de recherche
             et un champ de connexion ne vivent pas sur le même écran.
             Un seul œil dans le site, c'est la règle du dessin unique
             (piège nº 378) ; et l'histogramme qu'il remplace est parti
             avec, faute d'emploi (nº 855).
             ██ §2 (nº 866) — L'HISTOGRAMME REVIENT, L'ŒIL S'EN VA ██
             Décision du propriétaire : des barres verticales à la
             manière de X/Twitter, trait fin de la famille, 20 px, BLANC
             comme le nombre (`currentColor` sur le blanc du bloc). Le
             dessin est neuf et unique (`IconeHistogramme`, Icones) ;
             l'œil ne sert plus qu'au mot de passe. Partout où ce pied
             paraît — résultats, vue photo, fil de galeries — c'est lui. */}
        <span
          data-vues-de-fil=""
          /*  §7 (nº 867) — LA CIBLE DES TROIS AUTRES : quarante pixels
              de haut. Ce bloc n'est toujours PAS un bouton (nº 855) —
              rien à toucher — mais il occupe la même hauteur, et son
              dessin s'aligne sur les leurs sans qu'aucun décalage soit
              écrit à la main. */
          className="ml-2 flex min-h-10 items-center gap-1.5 text-[13px]
                     font-semibold text-sombre-texte"
        >
          <IconeHistogramme taille={24} />
          {/*  §8 (nº 867) — LE NOMBRE S'ÉCRIT COURT au-delà de mille
               (« 1K », « 12.3K », « 1M ») : la règle du propriétaire,
               écrite une seule fois dans lib/format-vues. */}
          {vuesAffichees(vues)}
        </span>
      </div>
      {/*  LES POINTS, CENTRÉS SUR TOUTE LA LARGEUR de la carte — comme
           sous la photo d'une fiche au doigt (nº 598) : l'enveloppe ne
           prend aucun toucher, chaque rond reprend le sien
           (`pointer-events-auto`, écrit dans la frise). Sept crans au
           plus (98 px), les deux icônes en occupent 80 à droite : sur
           une carte de 390 px, ils ne se rencontrent pas. */}
      {photos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <PointsDuCarrousel photos={photos} indice={indice} surRang={surRang} />
        </div>
      )}
      {/*  ██ §7 (nº 852) — LE FANION, PUIS LE PARTAGE ██
           Les deux gestes de droite ÉCHANGENT leur place : la nº 842 les
           avait posés « partage puis fanion », le propriétaire les veut
           dans l'autre sens. Rien d'autre ne bouge — ni leurs cibles, ni
           leur écart, ni le retrait.
           LE RETRAIT NÉGATIF ramène le BORD DU GLYPHE de droite sur la
           marge, jamais sa cible ; il vaut toujours autant, et c'est
           maintenant le PARTAGE qui en profite : ses deux dessins font
           24 px dans une cible de 40, soit les mêmes huit pixels de vide
           de chaque côté (l'écriture de la rangée sous la photo d'une
           fiche au doigt, nº 487). */}
      <div className="relative flex shrink-0 items-center -mr-2">
        {/*  ██ §4 (nº 842) — LE FANION ENREGISTRE LA PHOTO AFFICHÉE ██
             Sur « 7/18 », c'est la SEPTIÈME qui part dans « Ma
             sélection » — la consigne du propriétaire, et c'est déjà ce
             que fait le cœur des cartes du web (nº 452) : le même
             composant, la même variante « carte », le même état plein
             ou vide.
             ⚠️ LA CLÉ EST CELLE DE LA PHOTO, et il le faut : elle
             REMONTE le bouton à chaque glissement, ce qui réamorce son
             état sur la nouvelle photo (le motif de la carte du web,
             `key={photoRegardee}`). Sans elle, le cœur garderait l'état
             de la première photo en changeant de sujet.
             ⚠️ RIEN SANS PHOTO : une fiche de démonstration ou d'avant
             le portfolio catalogué n'a pas d'identifiant de photo —
             enregistrer une image qui n'existe pas en base n'aurait
             aucun sens (BoutonCoeurPhoto s'en garde aussi). */}
        {photos[indice]?.cle && (
          <BoutonCoeurPhoto
            key={photos[indice].cle}
            photoId={photos[indice].cle}
            variante="carte"
          />
        )}
        <BoutonPartageFiche
          nomArtisan={tatoueur.nom}
          cheminFiche={cheminAPartager}
          variante="icone"
          tailleIcone={24}
          avecFenetre
          sombre
          metier={metier}
          commune={villeAffichee(tatoueur.ville_nom)}
          marque={MARQUE_YOKOFOLIO.nom}
          objet="portfolio"
        />
      </div>
    </div>
  );
}
