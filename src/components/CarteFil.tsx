"use client";

import Link from "next/link";
import { AvatarRond } from "@/components/AvatarRond";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { IconeStatistiques } from "@/components/Icones";
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
export const RANGEE_EN_TETE_DE_FIL =
  "hidden mobile:flex items-center gap-3 px-4 pb-3";
/*  ⚠️ `relative` PORTE LES POINTS EN ABSOLU (voir la note du pied) ;
    `min-h-10` est la hauteur des cibles tactiles, et c'est elle qui
    fixe la hauteur du pied — le squelette la reprend telle quelle. */
export const RANGEE_PIED_DE_FIL =
  "relative hidden mobile:flex min-h-10 items-center justify-between px-4 pt-1";

/** L'EN-TÊTE DU FIL — avatar, nom, ville, puis le badge du type. */
export function EnTeteDeFil({
  tatoueur,
  lieu,
}: {
  tatoueur: Tatoueur;
  lieu: LieuAffichable;
}) {
  return (
    <div
      data-en-tete-de-fil=""
      className={RANGEE_EN_TETE_DE_FIL}
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
}: {

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
   * ⚠️ RIEN N'EST INVENTÉ EN ATTENDANT : sans nombre, le bloc ne se
   * rend pas du tout. Un « 28 » de démonstration serait un chiffre
   * public faux — le pire des deux maux.
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
      className={RANGEE_PIED_DE_FIL}
    >
      {/*  ██ §7 (nº 852) — LES VUES OUVRENT LE PIED, PUIS LE SIGNALEMENT ██
           « À gauche de l'icône signaler, une icône statistiques
           précédée du nombre de vues » : le nombre, puis le dessin,
           puis le signalement — dans cet ordre, à la lettre.
           ⚠️ CE N'EST PAS UN BOUTON : rien à toucher, rien à ouvrir. Un
           nombre et un dessin, en gris doux comme les autres icônes du
           pied, avec l'écart de la rangée entre eux.
           ⚠️ SANS DONNÉE, RIEN : voir la note de `vues`, plus haut — le
           site ne compte pas encore les vues, et un chiffre faux serait
           pire que pas de chiffre.
           SIGNALER garde sa place et son retrait : sa cible de 40 px
           ramenée sur la marge de la page — le retrait vaut le vide
           autour du glyphe, (40 − 22) / 2 = 9, arrondi au cran de
           l'échelle (8 px). */}
      <div className="relative flex shrink-0 items-center -ml-2">
        {typeof vues === "number" && (
          <span
            data-vues-de-fil=""
            className="flex items-center gap-1.5 pl-2 pr-1 text-[13px]
                       font-semibold text-sombre-texte-doux"
          >
            {vues}
            <IconeStatistiques taille={20} />
          </span>
        )}
        <FenetreSignalement
          slug={tatoueur.slug}
          nom={tatoueur.nom}
          variante="icone"
        />
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
