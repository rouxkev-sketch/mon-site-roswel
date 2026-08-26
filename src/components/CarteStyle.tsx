"use client";

import Link from "next/link";
import { CADRE_PHOTO_PORTFOLIO } from "@/config/tatouage";
import { NATURE_PAR_DEFAUT, SEPARATEUR_GALERIE } from "@/lib/photos-tatoueur";
import { souscrireAdresse } from "@/lib/adresse-courante";
import { defilerSansGeste } from "@/lib/defilement-programme";
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
 * ██ §2 (nº 623) — LA RECHERCHE S'OUVRE EN HAUT ██
 * ==================================================================
 * LE DÉFAUT, ET SA CAUSE — NOMMÉE AVANT TOUTE CORRECTION. On défile
 * l'accueil, on touche une carte de style : la page de résultats
 * s'ouvrait DÉJÀ DESCENDUE, à la position où l'accueil se trouvait.
 * `DefilementEnHaut` — le composant qui ouvre chaque page en haut —
 * n'a qu'une dépendance : LE CHEMIN (`usePathname`). Or un lien de
 * carte de style va de « / » à « /?style=… » : le chemin ne change
 * pas, l'effet ne se rejoue pas, et PERSONNE ne pose la remontée.
 * La remontée automatique du routeur, elle, ne suffit pas : le site
 * déclare un défilement DOUX global (`scroll-behavior: smooth`,
 * globals.css) — elle devient une animation, que le premier rendu de
 * la nouvelle page interrompt. C'est écrit mot pour mot dans l'en-tête
 * de `DefilementEnHaut` (« sans ce composant, les pages s'ouvraient
 * légèrement descendues ») ; depuis un accueil très défilé,
 * « légèrement » devient « pas du tout ».
 *
 * POURQUOI LA CORRECTION EST ICI, ET PAS DANS `DefilementEnHaut` :
 * lui faire suivre la REQUÊTE le ferait remonter à CHAQUE changement
 * de requête — donc au « Voir plus », qui porte justement
 * `scroll={false}` et ne doit surtout pas remonter (nº 592), et à
 * chaque changement de filtre. Le cœur de la navigation n'a pas à
 * bouger pour un lien : c'est le lien qui pose sa remontée (piège
 * 378/379).
 *
 * QUAND ON REMONTE, ET C'EST TOUT LE SOIN : PAS AU CLIC, MAIS À
 * L'INSTANT OÙ L'ADRESSE EST COMMISE. C'est la leçon de la nº 361 :
 * le navigateur prend sa PHOTO D'ADIEU au changement d'entrée
 * d'historique ; remonter avant elle la ferait porter sur un accueil
 * déjà sauté en haut — et le glissement de retour montrerait cette
 * photo-là. On s'abonne donc à l'écriture d'adresse (l'écriture
 * commune, lib/adresse-courante — l'événement part DANS le
 * `pushState`, donc avant toute peinture), et l'on ne pose la
 * remontée que si l'adresse arrivée est bien la nôtre.
 * ⚠️ LE FILET EST UN DÉLAI, PAS DEUX IMAGES : le routeur peut mettre
 * du temps à commettre une adresse qu'il doit d'abord rendre. Passé ce
 * délai, l'écoute se retire — aucune ne survit à son geste.
 * ⚠️ ET C'EST `defilerSansGeste` QUI POSE, jamais un `scrollTo` nu :
 * l'écriture unique des poses du site (elle annonce le mouvement aux
 * observateurs de geste et l'écrit au journal, nº 426).
 * ⚠️ LE RETOUR N'EST PAS TOUCHÉ : rien n'est écrit dans la mémoire de
 * position ni dans l'historique. Revenir sur l'accueil rend la place
 * quittée, exactement comme avant (acquis nº 329).
 */
const ATTENTE_ADRESSE_MS = 2000;

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

function remonterQuandLAdresseArrive(cible: string): void {
  if (typeof window === "undefined") return;
  const ici = () => window.location.pathname + window.location.search;
  const remonter = () => defilerSansGeste({ top: 0 }, "carte de style (nº 623)");
  //  DÉJÀ SUR CETTE ADRESSE (on retouche la même carte) : rien à
  //  attendre, et aucune photo d'adieu n'est en jeu.
  if (ici() === cible) {
    remonter();
    return;
  }
  let fait = false;
  let minuteur = 0;
  let desabonner: () => void = () => {};
  const retirer = () => {
    desabonner();
    window.clearTimeout(minuteur);
  };
  desabonner = souscrireAdresse(() => {
    if (fait || ici() !== cible) return;
    fait = true;
    retirer();
    remonter();
  });
  minuteur = window.setTimeout(retirer, ATTENTE_ADRESSE_MS);
}

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
  const adresse = `/?style=${style.slug}&nature=${NATURE_PAR_DEFAUT}`;
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
        href={adresse}
        //  §2 (nº 623) — LA REMONTÉE, ARMÉE AU CLIC ET POSÉE À LA
        //  COMMISSION DE L'ADRESSE. Voir la note longue au-dessus du
        //  composant : ni le chemin ni le routeur ne s'en chargent ici.
        onClick={() => remonterQuandLAdresseArrive(adresse)}
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
            classe="w-full h-full object-cover"
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
