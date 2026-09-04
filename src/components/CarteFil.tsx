"use client";

import Link from "next/link";
import { AvatarRond } from "@/components/AvatarRond";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonSuivre } from "@/components/BoutonSuivre";
import { PointsDuCarrousel } from "@/components/CarrouselPortfolio";
import { FenetreSignalement } from "@/components/FenetreSignalement";
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { villeAffichee, type LieuAffichable } from "@/lib/adresse";
import { adresseDeLienInterne } from "@/lib/lien-interne";
import { sousTitreDeCarte } from "@/lib/photo-tatoueur";
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
 *     le TITRE (le nom, gras, blanc) et le SOUS-TITRE (« Artist · Lyon,
 *     FR », gris — `sousTitreDeCarte`, l'écriture partagée avec la carte
 *     du web) ; à droite, face à l'avatar, le badge « Follow »
 *     (`BoutonSuivre`, le badge existant, mêmes états). Avatar, titre et
 *     sous-titre sont UN SEUL lien, vers LE PROFIL (`adresseDeLienInterne`
 *     — l'adresse que la plaque du profil et les liens internes écrivent
 *     déjà) ;
 *  b. L'IMAGE (chez la carte, CarteTatoueur) : pleine largeur, encadré
 *     fixe ; les photos de l'ensemble GLISSENT au doigt — défilement
 *     natif avec accrochage par photo, `CarrouselPortfolio` en variante
 *     « carte », le même carrousel que la fiche ; la pastille « 7/20 »
 *     en haut à droite (le patron partagé de la nº 839). Un toucher sur
 *     l'image NE FAIT RIEN : aucune photo n'est un lien ;
 *  c. LE PIED (ici, `PiedDeFil`) : les POINTS de position (la frise des
 *     fiches, `PointsDuCarrousel` — une seule écriture), et à droite deux
 *     icônes nues : le fanion (signaler) et le partage, celles des fiches
 *     au doigt, à l'échelle (cibles de 40 px).
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

/** L'EN-TÊTE DU FIL — avatar · nom · sous-titre, puis « Follow ». */
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
      className="hidden mobile:flex items-center gap-3 px-4 pb-3"
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
               14,5) — le même texte, lu au même endroit du parcours. */}
          <span className="block truncate text-[16px] font-semibold leading-tight text-sombre-texte">
            {tatoueur.nom}
          </span>
          <span className="block truncate text-[14.5px] leading-tight text-sombre-texte-doux mt-1">
            {sousTitreDeCarte(tatoueur, lieu)}
          </span>
        </span>
      </Link>
      {/*  LE BADGE « FOLLOW » — le composant des fiches, tel quel : ses
           états (attente muette, Follow, Following), son invitation à
           créer un compte, son écriture de favori. Il est HORS du lien
           (un bouton dans un lien est interdit, nº 517) et ne rend rien
           pour une fiche de démonstration (`estIdentifiantDeBase`). */}
      <BoutonSuivre tatoueurId={tatoueur.id} nomTatoueur={tatoueur.nom} />
    </div>
  );
}

/** LE PIED DU FIL — les points au centre, le fanion et le partage à
    droite. */
export function PiedDeFil({
  tatoueur,
  photos,
  indice,
  surRang,
  cheminAPartager,
  metier,
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
}) {
  return (
    <div
      data-pied-de-fil=""
      className="relative hidden mobile:flex min-h-10 items-center justify-end px-4 pt-1"
    >
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
      {/*  LES DEUX GESTES, GROUPÉS À DROITE, cibles de 40 px qui se
           touchent — l'écriture de la rangée sous la photo d'une fiche
           au doigt (nº 487). Le retrait négatif ramène le BORD du glyphe
           de droite sur la marge, pas sa cible. */}
      <div className="relative flex shrink-0 items-center -mr-2">
        <FenetreSignalement slug={tatoueur.slug} nom={tatoueur.nom} variante="icone" />
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
