"use client";

import Link from "next/link";
//  §1 (nº 652) — le chemin de la recherche, écrit une seule fois.
import {
  ADRESSE_RECHERCHE,
  PREPARER_LA_RECHERCHE_A_LAVANCE,
} from "@/lib/chemin-recherche";
import { CADRE_PHOTO_PORTFOLIO, FOND_RESERVE_PHOTO } from "@/config/tatouage";
import { NATURE_PAR_DEFAUT, SEPARATEUR_GALERIE } from "@/lib/photos-tatoueur";
//  §2 (nº 635) — l'écriture unique de la copie (nº 514), reprise telle
//  quelle de la carte de la mosaïque : voir la note sur le lien.
import { garderLeTexteALaCopie } from "@/lib/copie-du-texte";
//  §1 (nº 625) — L'ÉCRITURE UNIQUE DE « UNE LISTE NEUVE COMMENCE EN
//  HAUT » (nº 330/334) : elle arme au geste, la liste servie consomme.
//  Voir la note de la remontée, plus bas.
import { ouvrirLaListeEnHaut } from "@/lib/liste-neuve";
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
 * §1 (nº 621, refait nº 622 puis nº 623) — LE TEXTE SOUS LA CARTE.
 * ------------------------------------------------------------------
 * DEUX MISES EN PAGE, UNE PAR APPAREIL, ET LA CONSIGNE DU nº 623 :
 *  · AU WEB, UNE SEULE LIGNE — « Réalisme • 12 portfolios ». Le nom en
 *    demi-gras et blanc, le complément (la puce comprise) en graisse
 *    NORMALE et en gris ;
 *  · AU DOIGT, DEUX LIGNES — le nom en demi-gras au-dessus, le compte
 *    en dessous, plus petit et gris. AUCUNE PUCE : c'est le retour à la
 *    ligne qui sépare.
 * LES TAILLES : web 17 px / interligne 20 pour les deux morceaux (la
 * ligne du nº 622, inchangée) ; doigt 15 px / interligne 18 pour le
 * nom (inchangé), et 13 px / interligne 16 pour le compte — le corps
 * de la ligne de lieu des cartes, rien de neuf dans l'échelle.
 * LES COULEURS viennent de la ligne 1 des cartes (nº 480/481) :
 * `text-sombre-texte` pour le nom, `text-sombre-texte-doux` (le gris
 * des textes secondaires, jeton nº 466) pour le compte. Aucune couleur
 * neuve, et la PUCE est celle du site (`SEPARATEUR_GALERIE`,
 * lib/photos-tatoueur) — aucune ponctuation inventée.
 * ⚠️ LA GRAISSE NE DÉPEND PLUS DE L'APPAREIL : le nom est demi-gras des
 * deux côtés depuis la nº 623 (le doigt l'était en graisse normale
 * jusqu'à la nº 622). Une seule classe, sans variante — il n'y a rien
 * à séparer quand les deux disent la même chose.
 * ⚠️ L'AIR SOUS LA PHOTO ET LES MARGES LATÉRALES sont ceux de la carte
 * de recherche, repris au pixel : `pt-2 px-0.5 mobile:px-2` — huit
 * pixels sous l'image, deux de retrait au web, huit au doigt (la photo
 * y touche les bords, le texte ne peut pas partir du même endroit).
 * ⚠️ UN NOM LONG NE DÉBORDE NI D'UN CÔTÉ NI DE L'AUTRE : chacune des
 * deux lignes est un BLOC tronqué pour son propre compte (`truncate`).
 * Au web, la ligne entière — nom et complément — se coupe d'un seul
 * tenant par des points de suspension ; au doigt, le nom se coupe sans
 * jamais pousser le compte, qui vit sur sa propre ligne.
 * ⚠️ LA HAUTEUR RESTE RÉGULIÈRE : une ligne au web, DEUX au doigt,
 * toujours — le compte existe pour chaque style (le catalogue n'y
 * entre que s'il a une galerie, nº 620). Les rangées de la grille ne
 * peuvent donc pas se décaler d'une carte à l'autre.
 */
/**
 * ██ §2 (nº 623, REFAIT nº 625) — LA RECHERCHE S'OUVRE EN HAUT ██
 * ==================================================================
 * LE DÉFAUT, ET SA CAUSE. On défile l'accueil, on touche une carte de
 * style : la page de résultats s'ouvrait DÉJÀ DESCENDUE.
 * `DefilementEnHaut` n'a qu'une dépendance — LE CHEMIN
 * (`usePathname`) ; un lien de carte va de « / » à « /?style=… », le
 * chemin ne change pas, l'effet ne se rejoue pas. Et la remontée du
 * routeur ne suffit pas : le site déclare un défilement DOUX global,
 * elle devient une animation que le premier rendu interrompt.
 *
 * ██ CE QUE LA nº 625 CORRIGE DANS LA nº 623 ELLE-MÊME ██
 * LA nº 623 A ÉCRIT UN SECOND MÉCANISME SANS LE VOIR. Le site avait
 * DÉJÀ son écriture unique pour cela — `ouvrirLaListeEnHaut` /
 * `laListeServieEstArrivee` (lib/liste-neuve, nº 330 et nº 334) —, et
 * elle est plus juste sur trois points que ce qui avait été écrit ici :
 *  · ELLE N'ARME PAS QUE LA REMONTÉE. Elle oublie la restitution en
 *    attente, la position rangée pour l'adresse visée, la position du
 *    gel, ET tue une restitution DÉJÀ LANCÉE (nº 424) — un retour
 *    récent pouvait reposer sa vieille position par-dessus la liste
 *    neuve, quelques secondes plus tard ;
 *  · ELLE POSE AU BON INSTANT SANS RIEN GUETTER. La nº 623 s'abonnait
 *    à l'écriture d'adresse avec un délai de deux secondes en filet ;
 *    ici, c'est LA LISTE QUI ARRIVE qui consomme, dans un effet d'avant
 *    peinture — aucune attente, aucun délai, et jamais sur la page
 *    qu'on quitte (la leçon de la nº 361 sur la photo d'adieu est donc
 *    tenue, comme avant) ;
 *  · ELLE EST DÉJÀ CELLE DU MOTEUR ET DES FILTRES DE « Ma sélection ».
 *    Trois surfaces, une écriture : elles ne peuvent plus diverger.
 *
 * ⚠️ ON LUI DONNE L'ADRESSE DE LA LISTE QUI ARRIVE, et c'est essentiel
 * (nº 333) : sans elle, elle effacerait la position mémorisée de
 * L'ACCUEIL QU'ON QUITTE — on appelle avant de naviguer. Le retour
 * rendrait alors zéro au lieu de la place quittée (acquis nº 329).
 * ⚠️ CE QUI NE REMONTE PAS N'EST PAS TOUCHÉ : « Voir plus » n'arme
 * rien (il porte `scroll={false}` et allonge la même liste, nº 592), et
 * un RETOUR n'arme rien non plus — `laListeServieEstArrivee` ne
 * consomme QUE ce qu'un geste a armé. La borne est là, et nulle part
 * ailleurs : elle est dans le GESTE, jamais dans l'adresse.
 */

/**
 * §1 (nº 623) — LE MOT QUI QUALIFIE LE CHIFFRE.
 * « Réalisme 12 » ne disait rien. C'est « PORTFOLIOS », et pas
 * « artistes » : le site compte aussi des salons et des studios
 * (`libelleTypeFiche`), et « portfolio » est le terme employé partout
 * ailleurs — jusque dans le menu « Explorer », dont ce chiffre est
 * exactement le même.
 * ⚠️ §1 (nº 624) — ET « LE MÊME » EST DEVENU VRAI AU SENS FORT : les
 * deux comptent désormais DES GALERIES (`cleDuCarrousel`), donc des
 * cartes affichées. La nº 620 comptait ici des fiches distinctes, et
 * la carte annonçait « 1 » là où la recherche en montrait deux.
 * ⚠️ ÉCRIT UNE SEULE FOIS, pour les deux appareils : la ligne du web et
 * celle du doigt ne peuvent pas dire deux mots différents.
 */
const MOT_DU_COMPTE = "portfolios";

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
  //  §1 (nº 652) — une carte de style ouvre LA RECHERCHE de ce style,
  //  à son adresse. Le lien est le même qu'avant, au chemin près.
  const adresse = `${ADRESSE_RECHERCHE}?style=${style.slug}&nature=${NATURE_PAR_DEFAUT}`;
  return (
    /*  §1 (nº 634) — LE TOTAL DES FAVORIS DU STYLE, POSÉ SANS ÊTRE
        MONTRÉ. C'est le second critère de l'ordre des cartes
        (lib/catalogue-styles), et il n'a AUCUN effet visible : aucune
        classe, aucun pixel, rien à l'écran. Il est là pour que le
        propriétaire puisse vérifier l'ordre de ses yeux — sur son
        déploiement, avec l'inspecteur du navigateur, ou par un simple
        « afficher la source ». La base étant injoignable depuis
        l'atelier, c'est le seul moyen honnête de lui rendre la liste
        qu'il demande.
        ⚠️ CE N'EST PAS LE COMPTE DE LA PHOTO (`style.photo.coeurs`),
        qui ne pèse que l'image affichée. Voir le grand bloc « DEUX
        COMPTES » de lib/catalogue-styles. */
    <article data-favoris-du-style={style.coeursDuStyle}>
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
        href={adresse}
        //  ██ §1 (nº 656) — CETTE CARTE NE PRÉPARE PLUS SA PAGE ██
        //  Toutes les cartes de l'accueil mènent au MÊME chemin
        //  (« /recherche ») avec des critères différents, et Next range
        //  la page préparée d'une route dynamique SOUS LE CHEMIN : la
        //  première carte entrée à l'écran remplissait la case pour
        //  toutes les autres. La règle et son relevé sont écrits une
        //  fois, auprès du chemin (lib/chemin-recherche).
        prefetch={PREPARER_LA_RECHERCHE_A_LAVANCE}
        //  ██ §2 (nº 635) — COPIER LE TEXTE, PAS L'ADRESSE ██
        //  LE DÉFAUT : copier « Fine Line • 4 portfolios » posait
        //  « [Fine Line • 4 portfolios](https://…/?style=fine-line…) »
        //  dans le presse-papiers. LA CAUSE est celle de la nº 514 : la
        //  carte entière est un lien, et quand une sélection y tient
        //  tout entière, le navigateur écrit L'ADRESSE à la place du
        //  texte. Il n'y a rien à corriger dans le site — il y a une
        //  question à cesser de lui laisser ouverte.
        //  LE REMÈDE EST CELUI DE LA nº 517, REPRIS SANS UNE LIGNE
        //  NEUVE : les deux mêmes attributs que la carte de la mosaïque
        //  (CarteTatoueur), et l'écriture unique `garderLeTexteALaCopie`
        //  (lib/copie-du-texte). Aucun second mécanisme.
        //  ⚠️ ET LE TROISIÈME MORCEAU, QUI NE SE VOIT PAS ICI : la règle
        //  de glissement de globals.css (nº 516), posée sur l'attribut
        //  qui NOMME ce lien. `data-lien-carte` est repris tel quel —
        //  c'est un marqueur de style pur, que rien d'autre ne lit —
        //  donc la feuille produite ne bouge pas d'un octet. Sans lui,
        //  glisser sur le nom emporterait le lien au lieu de surligner,
        //  et il n'y aurait jamais de sélection à copier.
        data-lien-carte=""
        draggable={false}
        onCopy={garderLeTexteALaCopie}
        //  §1 (nº 625) — LA REMONTÉE, ARMÉE PAR LE GESTE et jouée par
        //  la liste qui arrive. L'adresse de destination lui est
        //  donnée : sans elle, la position de l'accueil qu'on quitte
        //  serait effacée (nº 333). Voir la note longue plus haut.
        onClick={() => ouvrirLaListeEnHaut(adresse)}
        //  LE FOCUS SE VOIT SUR LA CARTE ENTIÈRE, l'écriture des
        //  cartes de la mosaïque : un contour posé À L'INTÉRIEUR du
        //  bord, donc sans un pixel de débord sur la gouttière.
        className="group flex flex-col outline-none focus-visible:outline-2
                   focus-visible:-outline-offset-2 focus-visible:outline-primaire"
      >
        <div
          className={`relative w-full ${CADRE_PHOTO_PORTFOLIO} overflow-hidden rounded-none
                     shadow-[0_2px_12px_rgba(0,0,0,0.35)]
                     transition-shadow duration-300
                     group-hover:shadow-[0_12px_34px_rgba(0,0,0,0.55)]`}
        >
          {/*  §2 (nº 648) — la même plaque d'attente que les cartes de
               portfolio, à la même valeur : une seule écriture pour les
               trois surfaces (config/tatouage). */}
          <span aria-hidden="true" className={FOND_RESERVE_PHOTO} />
          {/*  ██ LE TEXTE DE REMPLACEMENT (lecteurs d'écran) ██
               La carte ne montre PAS un portfolio : elle montre un
               STYLE. Ce que le texte doit dire est donc ce que le lien
               promet — « Réalisme, 12 portfolios » — et non le nom d'un
               artiste, qui n'est écrit nulle part ici et que la carte
               ne mène pas voir.
               §1 (nº 623) — LE MÊME MOT QUE LA LIGNE VISIBLE
               (`MOT_DU_COMPTE`) : ce qu'un lecteur d'écran entend est
               ce que l'œil lit, au mot près.
               ⚠️ IL N'EST DONC PAS `legendeDeCarte` : cette écriture-là
               nomme un portfolio (nom, ville, style, rendu), et elle
               reste celle des cartes de recherche. Deux surfaces, deux
               promesses — la même phrase mentirait sur l'une des
               deux. */}
          <PhotoDeCarte
            url={photo.miniature}
            urlPleine={photo.url}
            tailles={TAILLES_CARTE}
            alt={`${style.label}, ${style.portfolios} ${MOT_DU_COMPTE}`}
            chargement={prioritaire ? "eager" : "lazy"}
            priorite={prioritaire ? "high" : undefined}
            //  §2 (nº 648) — `relative` : au-dessus de la plaque.
            classe="relative w-full h-full object-cover"
          />
        </div>

        {/*  ██ §1 (nº 622, étendu nº 623) — LA LIGNE, APPAREIL PAR APPAREIL ██
             ------------------------------------------------------
             CE QUE LA nº 622 A POSÉ, ET QUI TIENT : au web, le nom en
             demi-gras — le gras des cartes du site (nº 481 : « le nom
             prend le demi-gras »), non le `bold` que seul un titre de
             fiche porte — et les deux textes à DIX-SEPT PIXELS,
             interligne 20. Aucune valeur neuve dans l'échelle : c'est
             le corps que la carte de recherche emploie déjà en pleine
             largeur.
             CE QUE LA nº 623 AJOUTE : le chiffre est QUALIFIÉ
             (`MOT_DU_COMPTE`), la puce du site le sépare du nom AU WEB
             SEULEMENT, et LE DOIGT PASSE À DEUX LIGNES — nom 15 px /
             interligne 18, compte 13 px / interligne 16, sans puce.
             Le nom prend le demi-gras au doigt AUSSI : c'est la seule
             valeur que la nº 623 change de ce côté-là.
             Le compte garde partout sa graisse NORMALE et son gris
             (`texteDoux`, jeton nº 466) ; le nom garde sa couleur.

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

             ⚠️ ET LA GRAISSE DU NOM N'A PLUS RIEN À SÉPARER depuis la
             nº 623 : elle vaut la même chose des deux côtés, donc une
             seule classe, sans variante. Deux variantes qui diraient la
             même valeur ne diraient rien — elles donneraient juste deux
             endroits où se tromper.
             ⚠️ UN NOM LONG NE DÉBORDE PAS : chaque ligne est un BLOC
             tronqué pour son propre compte. Au web, la coupe emporte le
             nom ET son complément d'un seul tenant ; au doigt, le nom
             se coupe seul, le compte vivant sur sa propre ligne. La
             mécanique ne dépend d'aucune taille. */}
        <div className="pt-2 px-0.5 mobile:px-2">
          <p
            data-nom-du-style=""
            className="truncate font-semibold text-sombre-texte
                       mobile:leading-[18px] mobile:text-[15px]
                       not-mobile:leading-[20px] not-mobile:text-[17px]"
          >
            {style.label}
            {/*  LE COMPLÉMENT DU WEB, DANS LA MÊME LIGNE : il hérite du
                 corps et de l'interligne du nom, et n'écrit que ce qui
                 le distingue — graisse normale et gris. */}
            <span
              data-compte-du-style="web"
              className="font-normal text-sombre-texte-doux
                         mobile:hidden not-mobile:inline"
            >
              {`${SEPARATEUR_GALERIE}${style.portfolios} ${MOT_DU_COMPTE}`}
            </span>
          </p>
          {/*  LA SECONDE LIGNE DU DOIGT — un bloc à part, tronqué
               lui aussi : le nom au-dessus garde sa propre coupe, et la
               hauteur de la carte reste la même d'une carte à l'autre
               (deux lignes, toujours). */}
          <p
            data-compte-du-style="doigt"
            className="truncate font-normal text-sombre-texte-doux
                       mobile:block mobile:leading-[16px] mobile:text-[13px]
                       not-mobile:hidden"
          >
            {`${style.portfolios} ${MOT_DU_COMPTE}`}
          </p>
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
