import Link from "next/link";
import { CADRE_PHOTO_PORTFOLIO } from "@/config/tatouage";
import { NATURE_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import { CLASSES_GRILLE_CARTES } from "@/components/GrilleTatoueurs";
import type { StyleDuCatalogue } from "@/lib/catalogue-styles";

/**
 * ██ LA CARTE D'UN STYLE — LE CATALOGUE D'ACCUEIL (passe nº 621) ██
 * ==================================================================
 * DEUXIÈME DES TROIS PASSES du chantier « accueil = catalogue de
 * styles ». La lecture est écrite (nº 620, lib/catalogue-styles) ;
 * ici, on l'affiche.
 *
 * ██ POURQUOI UN COMPOSANT NEUF, ET NON UNE VARIANTE DE `CarteTatoueur` ██
 * ------------------------------------------------------------------
 * `CarteTatoueur` est l'écriture unique du texte sous une image, et
 * elle sert QUATRE surfaces : la recherche, les pages « style +
 * ville », « Ma sélection » (favoris et suivis), la mosaïque du
 * jumeau. Elle porte un rond de profil, un nom, une localité, un
 * badge de profil, un cœur, un fanion, un pincement, une mémoire de
 * position et TROIS lignes de texte.
 * LA CARTE DE STYLE N'EN VEUT AUCUN : une photo, un nom, un nombre.
 * Une variante n'aurait donc rien ajouté — elle aurait ÉTEINT les
 * neuf dixièmes du composant, avec un drapeau à traverser dans chaque
 * bloc. C'est le contraire d'un ajustement, et surtout : chacun de ces
 * drapeaux serait une occasion de casser les pages de recherche, qui
 * ne doivent pas bouger d'un pixel.
 * CE QU'ON REPREND, EN REVANCHE, ET SANS EN RECOPIER LA VALEUR :
 *  · `CADRE_PHOTO_PORTFOLIO` — le format 4/5, la constante du site ;
 *  · `PhotoDeCarte` + `TAILLES_CARTE` — l'écriture unique de l'image
 *    d'une carte (l'original quand la photo est cataloguée, la
 *    miniature sinon ; la réserve de hauteur, le chargement) ;
 *  · `CLASSES_GRILLE_CARTES` — la grille de la mosaïque, telle quelle :
 *    mêmes colonnes, mêmes gouttières, mêmes marges de bord au doigt.
 * Il n'existe donc AUCUNE seconde écriture : ce qui bougera un jour
 * dans la mosaïque bougera ici sans qu'on y revienne.
 */

/**
 * §1 (nº 621) — LE TEXTE SOUS LA CARTE, EN UNE SEULE LIGNE.
 * ------------------------------------------------------------------
 * Le nom du style à gauche, le nombre d'artistes à droite, en gris.
 * LA TYPOGRAPHIE PART DE LA LIGNE 1 DES CARTES (nº 480/481) :
 * `text-sombre-texte` — le blanc du site — pour le nom, et
 * `text-sombre-texte-doux` — LE gris des textes secondaires (jeton de
 * la nº 466) — pour le nombre. Aucune couleur neuve.
 * ⚠️ LA nº 621 AVAIT POSÉ LA MÊME TAILLE PARTOUT (15 px, graisse
 * normale) : LA nº 622 SÉPARE LES DEUX APPAREILS, sur consigne. Le
 * doigt garde exactement cette valeur ; le web monte à 17 px et met le
 * nom au demi-gras. Les deux jeux de classes sont écrits sur la ligne
 * elle-même — voir la note qui les accompagne, plus bas.
 * ⚠️ L'AIR SOUS LA PHOTO ET LES MARGES LATÉRALES sont ceux de la carte
 * de recherche, repris au pixel : `pt-2 px-0.5 mobile:px-2` — huit
 * pixels sous l'image, deux de retrait au web, huit au doigt (la photo
 * y touche les bords, le texte ne peut pas partir du même endroit).
 * ⚠️ UN NOM LONG NE POUSSE PAS LE NOMBRE : le nom se coupe
 * (`truncate` + `min-w-0`), le nombre ne rétrécit jamais
 * (`shrink-0`). La hauteur de la ligne est donc constante, et les
 * rangées de la grille restent régulières.
 */
export function CarteStyle({
  style,
  prioritaire,
}: {
  style: StyleDuCatalogue;
  /** Les premières cartes ne diffèrent pas leur image — la même règle
      que la mosaïque : ce que Google mesure ne doit pas attendre le
      défilement. */
  prioritaire: boolean;
}) {
  const photo = style.photo;
  if (!photo) return null;
  return (
    <article>
      {/*  §2 (nº 621) — AU CLIC, LA RECHERCHE DE CE STYLE. C'est
           EXACTEMENT l'adresse que le menu « Explorer » produit (le
           couple nature + style, `valeurExplorer`) : la mosaïque
           habituelle s'y affiche, servie par le jumeau, et rien de
           neuf n'est écrit pour ce chemin.
           ⚠️ LA CATÉGORIE VOYAGE AVEC LE STYLE : sans elle, une
           recherche par style seul vaudrait « Réalisations » par
           défaut (nº 272-§4) — le résultat serait le même, mais
           l'adresse ne dirait pas ce qu'elle montre. On l'écrit. */}
      <Link
        href={`/?style=${style.slug}&nature=${NATURE_PAR_DEFAUT}`}
        //  LE FOCUS SE VOIT SUR LA CARTE ENTIÈRE, l'écriture des
        //  cartes de la mosaïque : un contour posé À L'INTÉRIEUR du
        //  bord, donc sans un pixel de débord sur la gouttière.
        className="group flex flex-col outline-none focus-visible:outline-2
                   focus-visible:-outline-offset-2 focus-visible:outline-primaire"
      >
        <div
          className={`relative w-full ${CADRE_PHOTO_PORTFOLIO} overflow-hidden rounded-none
                     bg-sombre-eleve
                     shadow-[0_2px_12px_rgba(0,0,0,0.35)]
                     transition-shadow duration-300
                     group-hover:shadow-[0_12px_34px_rgba(0,0,0,0.55)]`}
        >
          {/*  ██ LE TEXTE DE REMPLACEMENT (lecteurs d'écran) ██
               La carte ne montre PAS un portfolio : elle montre un
               STYLE. Ce que le texte doit dire est donc ce que le lien
               promet — « Réalisme, 12 artistes » — et non le nom d'un
               artiste, qui n'est écrit nulle part ici et que la carte
               ne mène pas voir.
               ⚠️ IL N'EST DONC PAS `legendeDeCarte` : cette écriture-là
               nomme un portfolio (nom, ville, style, rendu), et elle
               reste celle des cartes de recherche. Deux surfaces, deux
               promesses — la même phrase mentirait sur l'une des
               deux. */}
          <PhotoDeCarte
            url={photo.miniature}
            urlPleine={photo.url}
            tailles={TAILLES_CARTE}
            alt={`${style.label}, ${style.artistes} artiste${
              style.artistes > 1 ? "s" : ""
            }`}
            chargement={prioritaire ? "eager" : "lazy"}
            priorite={prioritaire ? "high" : undefined}
            classe="w-full h-full object-cover"
          />
        </div>

        {/*  ██ §1 (nº 622) — AU WEB, LA LIGNE GRANDIT ET LE NOM S'ÉPAISSIT ██
             ------------------------------------------------------
             CE QUE LE PROPRIÉTAIRE A DEMANDÉ : sur le web, la ligne
             était trop petite. Le NOM passe au demi-gras — le gras des
             cartes du site (nº 481 : « le nom prend le demi-gras »), et
             non le `bold` que seul un titre de fiche porte — et LES
             DEUX TEXTES montent de QUINZE à DIX-SEPT PIXELS, avec
             l'interligne qui va avec (18 → 20). Aucune valeur neuve
             dans l'échelle : ce sont exactement le corps et l'interligne
             que la carte de recherche emploie déjà en pleine largeur.
             LE CHIFFRE GARDE SA GRAISSE (normale) et son gris
             (`texteDoux`, jeton nº 466) ; le nom garde sa couleur.
             LE DOIGT NE BOUGE PAS : quinze pixels, interligne dix-huit,
             graisse normale — ce que la nº 621 a posé.

             ██ COMMENT LES DEUX SONT SÉPARÉS, ET POURQUOI PAS AUTREMENT ██
             La règle du site (nº 537, nº 557, nº 589) veut que le DOIGT
             soit le défaut et que le WEB écrive sa variante. Mais poser
             une base et une variante `not-mobile:` mettrait DEUX
             classes sur la même propriété, à spécificité ÉGALE
             (`:where()` et `:not(:where())` valent zéro) : leur ordre
             dans la FEUILLE trancherait, et c'est exactement le piège
             nº 389.
             D'OÙ CE CHOIX : AUCUNE CLASSE DE BASE, et DEUX VARIANTES
             QUI S'EXCLUENT — `mobile:` exige `data-appareil="mobile"`,
             `not-mobile:` l'interdit. Elles ne peuvent pas s'appliquer
             au même élément, il n'y a donc RIEN à départager, quel que
             soit l'ordre de la feuille.
             ⚠️ ET SANS JAVASCRIPT, l'attribut manque : `mobile:` se
             tait, `not-mobile:` s'applique — c'est l'interface WEB qui
             s'affiche, « le meilleur défaut » que globals.css nomme.

             ⚠️ UN NOM LONG NE POUSSE TOUJOURS RIEN : le nom se coupe
             (`min-w-0 flex-1 truncate`), le chiffre ne rétrécit jamais
             (`shrink-0`) et reste collé à droite. Les dix-sept pixels
             ne changent rien à cette mécanique — elle ne dépend
             d'aucune taille. */}
        <div className="pt-2 px-0.5 mobile:px-2 flex items-baseline gap-2">
          <p
            data-nom-du-style=""
            className="min-w-0 flex-1 truncate text-sombre-texte
                       mobile:font-normal mobile:leading-[18px] mobile:text-[15px]
                       not-mobile:font-semibold not-mobile:leading-[20px] not-mobile:text-[17px]"
          >
            {style.label}
          </p>
          <span
            data-compte-du-style=""
            className="shrink-0 font-normal text-sombre-texte-doux
                       mobile:leading-[18px] mobile:text-[15px]
                       not-mobile:leading-[20px] not-mobile:text-[17px]"
          >
            {style.artistes}
          </span>
        </div>
      </Link>
    </article>
  );
}

/**
 * §3 (nº 621) — LA GRILLE DU CATALOGUE.
 * LA MÊME QUE LA MOSAÏQUE, sans une valeur recopiée :
 * `CLASSES_GRILLE_CARTES` porte les colonnes (2 au doigt, 3, 4 à
 * 1440 px, 5 à 1600), les gouttières et les marges de bord. Les
 * rangées restent donc régulières exactement comme ailleurs.
 * ⚠️ AUCUNE PAGINATION ICI : le catalogue tient sur une page (une
 * carte par style, huit aujourd'hui). « Voir plus » et le compteur
 * restent l'affaire de la nº 622.
 */
export function GrilleStyles({ styles }: { styles: StyleDuCatalogue[] }) {
  return (
    <div data-catalogue-styles="" className={CLASSES_GRILLE_CARTES}>
      {styles.map((style, rang) => (
        <CarteStyle key={style.slug} style={style} prioritaire={rang < 4} />
      ))}
    </div>
  );
}
