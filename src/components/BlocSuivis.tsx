"use client";

import Link from "next/link";
import { GalerieQuiDefile } from "@/components/GalerieQuiDefile";
//  §1 (nº 643) — l'écran vide partagé avec l'onglet Favoris.
import { EcranVideSelection } from "@/components/EcranVideSelection";
//  §4 (nº 462) — la mémoire de défilement des bandes (leçon nº 430),
//  sous le préfixe réservé que la purge des fiches épargne.
import { cleDeGalerie, PREFIXE_SELECTION } from "@/lib/memoire-galeries";
import { CADRE_PHOTO_PORTFOLIO, FOND_RESERVE_PHOTO } from "@/config/tatouage";
import {
  CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE,
  PhotoRonde,
} from "@/components/BlocLieux";
//  §2 (nº 703) — l'écriture unique, prise à la feuille : même cercle,
//  même raison que dans `BlocLieux`.
import { adresseDeLienInterne } from "@/lib/lien-interne";
//  §2 (nº 586) — LA CAPSULE « SUIVI » DE LA FICHE, telle quelle : le
//  même composant, donc la même apparence et la même bascule.
//  ██ §2 (nº 862) — ELLE CÈDE LA PLACE AU BADGE DU TYPE ██
//  `BoutonSuivre` n'est plus appelé d'ici (voir la rangée d'identité) ;
//  c'est `BadgeTypeDeFiche` — celui du fil — qui prend son coin.
import { BadgeTypeDeFiche } from "@/components/BadgeTypeDeFiche";
//  §1 (nº 515) — « ce qui est surligné est ce qui est copié »
//  (nº 514) : la même écriture que les plaques de la fiche.
import { garderLeTexteALaCopie } from "@/lib/copie-du-texte";
import {
  bandeDeTrois,
  suivisAPlat,
  libelleNouveautes,
  ligneDIdentite,
} from "@/lib/selection-suivis";
import type { TatoueurSuivi } from "@/lib/favoris-serveur";
import { photoDuBord } from "@/lib/photos-du-bord";

/**
 * LES ARTISTES SUIVIS, DANS « MA SÉLECTION » (nº 243, revu nº 245)
 * ==================================================================
 * IL REMPLACE UNE FENÊTRE, et c'est le point de départ : les suivis
 * vivaient dans une fenêtre superposée qui défilait sur elle-même —
 * deux défilements imbriqués et une boîte dans une boîte, que la
 * charte interdit. La fenêtre est SUPPRIMÉE, code compris ; tout vit
 * dans la page, pleine largeur, un seul défilement.
 * ⚠️ ET PLUS DERRIÈRE UN ONGLET NON PLUS (nº 245-§2) : le va-et-vient
 * `Photos · Tatoueurs` est supprimé, code compris. Cette section suit
 * les photos dans la page, et c'est le menu « Mes suivis » de la
 * barre qui décide de ce qu'elle montre.
 *
 * CE QUI SE DÉCIDE N'EST PAS ICI : le tri de la liste (nº 412 — les
 * trois groupes de la nº 243 sont supprimés, voir `suivisAPlat`), le
 * choix des trois photos et les libellés vivent dans
 * `lib/selection-suivis`. Ce fichier POSE, il ne juge pas.
 *
 * ⚠️ AUCUNE VALEUR GRAPHIQUE INVENTÉE : la ligne d'identité reprend
 * `CLASSES_LIGNE_CLIQUABLE` (nº 232) et `PhotoRonde` (nº 224/227) —
 * les mêmes briques que les lignes d'équipe et d'adresse d'une fiche.
 * LA FINITION EST CELLE DE LA nº 244-§2 (moins les titres de groupe
 * et leurs séparations, partis avec le regroupement à la nº 412) :
 * 34 px entre blocs, 12/8 px autour de la
 * ligne de provenance, bande à 6 px d'écart et rayon 10 — le rythme
 * du site, pas des valeurs inventées. L'urgence d'une date proche est
 * TYPOGRAPHIQUE (§3) : blanc semi-gras, jamais une couleur.
 *
 * ⚠️ CE QUI EST CLIQUABLE, ET RIEN D'AUTRE (§3) : la ligne d'identité
 * ouvre la fiche — pastille comprise, elle est DANS le lien —, une
 * vignette ouvre la photo. La petite ligne de provenance et le compte
 * de nouveautés ne sont pas des boutons.
 */

//  §1 (nº 302) — LES FAVORIS DU VISITEUR NE SONT PLUS DEMANDÉS : la
//  galerie ne se compose plus de ses coups de cœur mais des cinq règles
//  de composition (voir `bandeDeTrois`), et la règle 5 lit les j'aime
//  REÇUS par chaque photo, qui voyagent avec elle.
/**
 * §2 (nº 312) — CE QUE « MA SÉLECTION » DEMANDE POUR OUVRIR UNE FICHE.
 * ==================================================================
 * EN WEB, UNE FICHE S'OUVRE EN FENÊTRE CENTRÉE SUPERPOSÉE — partout
 * ailleurs sur le site, et donc ici aussi. C'était le §1 de la passe
 * nº 305, jamais exécutée dans ce dépôt ; la nº 307 n'en avait rattrapé
 * que deux points sur trois, et celui-ci était resté.
 * ⚠️ CE BLOC N'OUVRE RIEN LUI-MÊME, et c'est la règle : `PageFavoris`
 * possède déjà la fenêtre, sa note de retour, sa position de page et sa
 * clé de remontage (elle s'en sert pour les cartes de favoris depuis la
 * nº 213). On lui passe la main — un seul propriétaire de la fenêtre,
 * une seule écriture. Sans ce rappel, les liens restent de VRAIS liens
 * et la page de fiche s'ouvre : c'est ce qui doit arriver au doigt, au
 * clic du milieu, et aux moteurs de recherche.
 */
export type OuvertureDepuisSuivis = (
  slug: string,
  serie: { cle: string; style: string; nature: string; rendu: string; photo: string },
  adresse: string
) => void;

/**
 * LE CLIC QUI OUVRE LA FENÊTRE (§2, nº 312) — l'écriture unique des
 * deux liens de ce bloc, et la MÊME QUE CELLE DES CARTES DE MOSAÏQUE
 * (voir `auClic` dans CarteTatoueur) :
 *  · un clic modifié (nouvel onglet, clic du milieu…) ne touche à rien ;
 *  · sur un VRAI TÉLÉPHONE on ne fait rien non plus — le lien navigue,
 *    et la fenêtre superposée du web n'a rien à y faire ;
 *  · sinon, on empêche la navigation et on ouvre la fenêtre.
 */
function ouvrirEnFenetre(
  evenement: React.MouseEvent,
  surOuverture: OuvertureDepuisSuivis | undefined,
  ...args: Parameters<OuvertureDepuisSuivis>
) {
  if (!surOuverture) return;
  if (
    evenement.metaKey ||
    evenement.ctrlKey ||
    evenement.shiftKey ||
    evenement.altKey
  ) {
    return;
  }
  if (document.documentElement.dataset.appareil === "mobile") return;
  evenement.preventDefault();
  surOuverture(...args);
}

export function BlocSuivis({
  suivis,
  surOuverture,
}: {
  suivis: TatoueurSuivi[];
  /** Fournie par « Ma sélection » sur le web ; absente ailleurs. */
  surOuverture?: OuvertureDepuisSuivis;
}) {
  /*  ██ §2 (nº 412) — LA LISTE SEULE ██
       Les trois groupes de la nº 243 sont supprimés (voir
       `suivisAPlat`, lib/selection-suivis) : plus de titres « Cette
       semaine » / « Tous les portfolios », plus de trait entre les
       groupes. L'ordre est celui que la liste a toujours montré — la
       publication la plus récente d'abord. L'onglet FAVORIS ne passe
       pas par ce composant : il ne change pas. */
  const liste = suivisAPlat(suivis);

  if (suivis.length === 0) {
    /*  ██ §1 (nº 643) — LE MÊME ÉCRAN VIDE QUE LES FAVORIS ██
        DEUX CHOSES CHANGENT, ET RIEN D'AUTRE :
        · LES MOTS. « Suis un artiste » était faux — le site porte des
          portfolios d'artistes, de SALONS et de STUDIOS, et
          « portfolio » est le seul mot qui couvre les trois (c'est
          déjà la règle du propriétaire, écrite à la nº 249 pour le
          titre de cette page).
        · LE BOUTON, QU'IL N'Y AVAIT PAS. Il n'est pas dessiné pour
          l'occasion : c'est CELUI DES FAVORIS, déplacé dans
          `EcranVideSelection` et monté par les deux onglets — même
          boîte, même fond, même forme, même adresse (l'accueil, par
          `LienAccueil`). Aucun second bouton n'existe.
        ⚠️ LE REPÈRE `data-suivis-vide` SUIT (nº 412) : il est passé au
        composant plutôt que perdu en chemin. */
    return (
      <EcranVideSelection
        marque="data-suivis-vide"
        message="Follow a portfolio to find it here."
      />
    );
  }

  return (
    /*  §2 (nº 249) — LES CAPITALES ONT DISPARU : « MES SUIVIS » (le
        titre de section de la nº 245) est parti — c'est le TITRE de la
        page qui dit « Mes suivis » (LigneResultats, comme la page de
        recherche). La nº 249 gardait les titres de groupe pour le jour
        où une session guest classerait les artistes ; ce jour est venu
        à la nº 411, le propriétaire les a vus, et il les a supprimés
        (nº 412) : ils ne reviennent plus jamais. */
    /*  §2 (nº 264) — PLUS AUCUNE MARGE AJOUTÉE SOUS LE BLOC DU TITRE :
        le `pb` de LigneResultats suffit, comme sur la page de
        recherche (relevé vivant : 20 px au doigt, 24 sur le web) — le
        `mt-4` d'ici s'y ajoutait. */
    /*  §3 (nº 452 → nº 706) — la marque `data-signe-muet` taisait le
        trait de chargement sur ce chemin ; le trait n'existe plus
        (nº 706), la marque est partie avec. L'avalement du re-clic et
        le nettoyage à l'arrivée (GardeDesNavigations) restent
        entiers. */
    <div data-section-suivis="">
      {/*  §2 (nº 412) — UNE SEULE LISTE, SANS SECTION : le `<ul>` est
           celui d'avant, au pixel — mêmes écarts de 34 px au doigt et
           62 px au web (nº 254/264), même grille à une colonne
           `minmax(0,1fr)` (le piège de la nº 228). Le `mt-5` qui ne
           vivait QUE sous un titre de groupe part avec les titres : la
           liste repart du `pb` du bloc de titre de la page, comme la
           grille de la recherche — ni espace vide, ni décalage. */}
      {/*  ██ §1 (nº 464) — L'AIR ENTRE DEUX SUIVIS = L'AIR DU HAUT DE
           LISTE ██
           Le propriétaire trouve l'air entre le bas d'une galerie et
           la photo de profil du suivi SUIVANT trop grand : il doit
           reprendre EXACTEMENT celui qui sépare le bas du va-et-vient
           (la ligne grise) de la PREMIÈRE photo de profil. Cette
           référence, MESURÉE dans le code, par affichage :
            · doigt : 12 px (le bas du `py-3` de la barre,
              EnTeteTatouage) + 14 px (le séparateur
              `data-air-sous-barre`, PageFavoris — 16 depuis la
              nº 863, 14 avant) = 28 px ;
            · web : 3 px (les 46 px du va-et-vient centrés dans le
              `min-h-[52px]` de sa rangée, MenusSelection) + 12 px (le
              bas du `py-3` de la barre) + 32 px (`lg:h-8` du même
              séparateur, nº 463) = 47 px.
           Les 34/62 px d'avant (nº 254/264) dataient du temps des
           titres de groupe. L'air se pose ICI, sur le `gap` de la
           liste — L'ÉLÉMENT DE SÉPARATION, jamais un bloc ni un
           conteneur partagé : l'air INTERNE d'un suivi (le `mt-5` de
           sa bande, nº 325 — douze au doigt depuis la nº 865) et l'air
           de bas de page (le `pb-16` du <main> de PageFavoris) ne
           bougent pas d'un pixel. */}
      <ul className="grid gap-[26px] lg:gap-[47px] grid-cols-[minmax(0,1fr)]">
        {liste.map((suivi) => (
          <li key={suivi.id}>
            <BlocDUnSuivi suivi={suivi} surOuverture={surOuverture} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** LE BLOC D'UN ARTISTE — trois étages (§3). */
function BlocDUnSuivi({
  suivi,
  surOuverture,
}: {
  suivi: TatoueurSuivi;
  surOuverture?: OuvertureDepuisSuivis;
}) {
  const identite = ligneDIdentite(suivi);
  const bande = bandeDeTrois(suivi);
  const nouveautes = libelleNouveautes(suivi.nouveautes);

  return (
    <div data-suivi={suivi.slug} className="flex flex-col">
      {/*  ██ 1 · LA RANGÉE D'IDENTITÉ (nº 586) — LE LIEN, ET LA CAPSULE
               À SON OPPOSÉ ██
           ----------------------------------------------------------
           POURQUOI UNE RANGÉE, ET PAS LA CAPSULE DANS LE LIEN : un
           bouton ne peut pas vivre à l'intérieur d'un lien (le HTML
           l'interdit, et le navigateur défait le nid en silence). La
           ligne était UN SEUL lien, avatar et texte compris ; elle
           devient donc une rangée qui porte les deux côte à côte.
           ⚠️ L'ACQUIS nº 519 TIENT, PAR UN AUTRE MOYEN, ET C'EST À
           DIRE : le lien ne court toujours pas jusqu'au bord de la
           page. Là-bas il fallait deux classes pour le retenir, parce
           que son parent était une COLONNE — et une colonne étire ses
           enfants sur toute la largeur. Ici le parent est une RANGÉE :
           un enfant de rangée prend la largeur de son contenu, sans
           qu'on ait rien à écrire. La zone cliquable s'arrête donc au
           dernier mot, exactement comme depuis la nº 519. Ce qui
           s'étire, c'est la RANGÉE — elle n'est cliquable nulle part.
           ⚠️ CE QUI REMPLACE LES DEUX CLASSES : la borne de largeur
           devient une AUTORISATION DE RÉTRÉCIR (`min-w-0`), sans quoi
           un enfant de rangée refuse de descendre sous la taille de
           son contenu et le nom sortirait de l'écran au lieu de
           s'abréger devant la capsule.
           ⚠️ LA SÉLECTION ET LA COPIE DU NOM (nº 515, nº 516) NE SONT
           PAS TOUCHÉES : les deux attributs restent sur le lien, et la
           règle de glissement de globals.css vise l'attribut qui le
           nomme (`data-ligne-suivi`) — ni l'un ni l'autre ne dépend de
           qui est son parent. */}
      <div className="flex items-center gap-3">
      {/* 1 · LA LIGNE D'IDENTITÉ — UN SEUL LIEN, pastille comprise. */}
      <Link
        /*  §4 (nº 329) — UN LIEN INTERNE : la fiche s'ouvre SANS
            photo en haut (point 6 de la règle). La consigne est
            dans l'adresse, elle survit donc au retour. */
        href={adresseDeLienInterne(suivi.slug)}
        data-ligne-suivi=""
        /*  §2 (nº 312) — EN WEB, LA FICHE S'OUVRE PAR-DESSUS. Le lien
            reste un vrai lien : au doigt il navigue, et un clic du
            milieu ouvre toujours la page. */
        onClick={(evenement) =>
          ouvrirEnFenetre(
            evenement,
            surOuverture,
            suivi.slug,
            //  Aucune série demandée : la fiche s'ouvre sur ce qu'elle
            //  montre par défaut, comme le ferait sa page.
            { cle: `suivi-${suivi.slug}`, style: "", nature: "", rendu: "", photo: "" },
            `/artist/${suivi.slug}`
          )
        }
        /*  §3 (nº 254) — L'ÉCART PASTILLE-TEXTE SE REMET À L'ÉCHELLE :
            14 px pour un rond de 52 (gap-3.5, la proportion de
            toujours) → 20 px pour un rond de 72 (14 × 72 ÷ 52 ≈ 19,4,
            le cran de la grille le plus proche). La ligne reste
            l'écriture partagée, l'écart web s'y ajoute.
            §3 (nº 301) — ET PLUS AUCUN ENCADRÉ AU SURVOL, web comme
            doigt : le propriétaire n'en veut plus SUR CETTE PAGE. La
            ligne reste un lien vers la fiche, pastille comprise ; seule
            la plaque grise disparaît. La géométrie ne bouge pas d'un
            pixel — `-m-2 p-2` s'annulaient (voir la note de
            `CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE`). */
        /*  ██ §1 (nº 515) — LE NOM DU PORTFOLIO SE SURLIGNE ET SE COPIE ██
            Les DEUX attributs ensemble, et ils ne font pas la même
            chose — c'est la leçon des nº 513 et 514 :
             · l'attribut de glisser posé à faux rend la SÉLECTION
               possible. Sans lui, glisser sur le nom emporte le lien
               au lieu de surligner (le navigateur croit qu'on veut
               l'emporter ailleurs) ;
             · le gestionnaire de copie rend la COPIE juste. Sans lui,
               une sélection entièrement contenue dans un lien fait
               écrire à WebKit l'ADRESSE du lien à la place du texte.
            L'un sans l'autre laisserait le geste à moitié fait : on
            surlignerait le nom et l'on collerait « /artist/le-slug ».
            La raison complète vit dans lib/copie-du-texte.
            ⚠️ RIEN D'AUTRE NE CHANGE : le clic ouvre toujours le
            portfolio — en fenêtre au web, en navigation au doigt
            (nº 312) —, le clic du milieu ouvre toujours un onglet, le
            survol et le focus au clavier ne bougent pas, et le doigt
            ne voit aucune différence : on ne glisse pas un lien au
            doigt. */
        draggable={false}
        onCopy={garderLeTexteALaCopie}
        /*  ██ §1 (nº 516) — POURQUOI LES DEUX ATTRIBUTS DE LA nº 515 NE
             SUFFISAIENT PAS ICI ██
             ----------------------------------------------------------
             LE SYMPTÔME : poser le curseur sur le nom et glisser ne
             surlignait rien ; la seule zone qui répondait était la
             marge de la page, à gauche du rond — c'est-à-dire le seul
             endroit HORS du lien. Une sélection démarrée là traversait
             ensuite le lien sans peine : le texte n'était donc pas
             protégé, c'est le DÉPART qui était refusé.
             CE QUI A ÉTÉ ÉLIMINÉ PAR LECTURE : aucun `select-none` ni
             `user-select` sur cette ligne ni sur aucun de ses ancêtres ;
             aucune couche posée par-dessus le texte ; et l'attribut de
             glisser est bien transmis au lien (vérifié dans le code de
             Next : il n'intercepte pas cette propriété).
             CE QUI RESTE, ET C'EST LA DIFFÉRENCE AVEC L'ADRESSE D'UNE
             FICHE, QUI ELLE FONCTIONNE (nº 513) : ce lien-ci CONTIENT
             UNE IMAGE, le rond de profil. Deux conséquences, et il faut
             les deux :
              · l'attribut ne descend pas aux enfants — l'image reste
                traînable pour son compte (c'est réglé dans PhotoRonde,
                lib partagée) ;
              · WebKit ne se gouverne pas que par l'attribut HTML : il
                garde une propriété CSS de glissement, qui vaut
                « element » par défaut pour les liens ET les images.
                C'est elle qu'on met à « none » — et elle est posée dans
                globals.css, sur l'attribut qui nomme ce lien
                (`data-ligne-suivi`), PARCE QUE TAILWIND NE SAIT PAS LA
                PRODUIRE : cette propriété n'existe dans aucune
                spécification, et la syntaxe de propriété arbitraire la
                laisse tomber en silence. Vérifié dans la feuille
                produite : la classe n'y écrivait rien.
             ⚠️ RIEN D'AUTRE NE CHANGE : cette propriété ne touche QUE
             le glisser-déposer. Le clic ouvre toujours le portfolio sur
             toute la largeur de la ligne, le clic du milieu ouvre
             toujours un onglet, le survol et le focus au clavier ne
             bougent pas, et le doigt ne voit aucune différence. */
        /*  ██ §1 (nº 519) — LE LIEN ÉPOUSE SON CONTENU, IL NE S'ÉTIRE
             PLUS JUSQU'AU BORD DE LA PAGE ██
             ----------------------------------------------------------
             CE QUI L'ÉTIRAIT, ET C'ÉTAIT DEUX CHOSES QUI SE
             CUMULAIENT :
              · LE PARENT est une colonne flexible (`flex flex-col`,
                juste au-dessus). Sans consigne contraire, une colonne
                ÉTIRE ses enfants sur toute sa largeur — c'est son
                comportement par défaut, pas une valeur écrite quelque
                part qu'on pourrait chercher ;
              · et DANS le lien, le bloc de texte porte `flex-1` : il
                absorbait aussitôt toute la place ainsi obtenue.
             Résultat : une surface cliquable qui courait jusqu'au bord
             droit de la page, très loin du dernier mot.
             LE REMÈDE, EN DEUX CLASSES :
              · `self-start` dit à ce seul enfant de ne PAS s'étirer —
                il prend alors la largeur de son contenu, l'avatar plus
                le texte, et rien de plus. Posé sur le lien, jamais sur
                la colonne : les autres blocs d'un suivi (la bande de
                vignettes) gardent leur pleine largeur ;
              · `max-w-full` le borne quand même à la largeur
                disponible. SANS LUI, UN NOM TRÈS LONG NE SE TRONQUERAIT
                PLUS : le `truncate` du nom a besoin d'une largeur qui
                le contraigne, et un lien libre de s'élargir ne lui en
                donne aucune — le nom sortirait de la page au lieu de
                s'abréger.
             ⚠️ RIEN NE BOUGE À L'ŒIL : l'avatar et les deux lignes
             restent exactement où ils sont — c'est la BOÎTE du lien qui
             se rétrécit à droite, pas son contenu, qui était déjà calé
             à gauche.
             ⛔ CES DEUX CLASSES ONT ÉTÉ REMPLACÉES À LA nº 586, et la
             règle qu'elles servaient, elle, est intacte : le lien vit
             désormais dans une RANGÉE (voir la note en tête du bloc),
             où il prend la largeur de son contenu sans qu'on ait rien
             à écrire. Il ne reste qu'à L'AUTORISER À RÉTRÉCIR pour que
             le nom s'abrège devant la capsule.
             ⚠️ AUCUN FOND NI SURVOL À AJUSTER : cette ligne n'en porte
             plus depuis la nº 301 — c'est même la raison d'être de
             l'écriture qu'elle emploie. Il n'y a donc aucune plaque qui
             rétrécirait avec la zone.
             ⚠️ LA SÉLECTION DU NOM (nº 515-516) N'EST PAS TOUCHÉE : les
             deux attributs et la règle de glissement visent le lien,
             qui reste le même — seule sa largeur change. */
        className={`${CLASSES_LIGNE_CLIQUABLE_SANS_ENCADRE} lg:gap-5 min-w-0`}
      >
        <PhotoRonde
          source={suivi.photoProfil}
          //  Un suivi peut être un artiste comme un salon : le repli
          //  « lieu » porte le glyphe d'adresse, celui que la fiche
          //  emploie déjà pour un lieu sans photo.
          nature={suivi.modes.length > 0 ? "personne" : "lieu"}
          //  §3 (nº 254) — 72 px SUR LE WEB (52 au doigt, inchangé),
          //  par le paramètre de l'écriture unique. Le glyphe du repli
          //  suit l'échelle (28 → 40).
          classeTaille="h-13 w-13 lg:h-18 lg:w-18"
          classeGlyphe="h-7 w-7 lg:h-10 lg:w-10"
        />
        {/*  §3 (nº 323) — LA BOÎTE DE TEXTE EST TOUJOURS CENTRÉE.
             Elle basculait en `justify-start` dès qu'il y avait
             PLUSIEURS lignes (une par mode, nº 247-§4) : le nom serait
             sinon remonté au-dessus du rond quand le texte grandit. Il
             n'y a plus qu'UNE ligne d'information — le cas à deux
             branches n'existe plus, et le centrage redevient ce qu'il
             était avant la nº 247. */}
        <span className="flex min-h-13 lg:min-h-18 min-w-0 flex-1 flex-col justify-center">
          {/*  §3 (nº 254) — le nom 15 → 18 px sur le web, MÊME
               graisse ; l'information 14 → 15, MÊME couleur. Le doigt
               ne change pas.
               §1 (nº 323) — LE WEB MONTE ENCORE D'UN CRAN : le nom
               18 → 20 px, l'information 15 → 16 (juste dessous). Le
               propriétaire les trouvait trop petits à côté d'un rond
               de 72 px. LA HIÉRARCHIE NE BOUGE PAS — le nom reste plus
               grand que l'information (l'écart passe même de 3 à 4 px)
               et l'information reste grise : on ne fait que monter
               l'échelle. ⚠️ LE DOIGT NE CHANGE PAS : les deux valeurs
               nues (15 et 14) sont intactes, seul le cran `lg:` bouge. */}
          <span className="truncate text-[15px] lg:text-[20px] font-semibold text-sombre-texte">
            {suivi.nom}
          </span>
          {/*  §2 (nº 244) — la ligne d'information : 14 px, grise.
               §3 (nº 323) — ET IL N'Y EN A PLUS QU'UNE, POUR TOUT LE
               MONDE : « Artiste · Paris, France », « Studio · Félines,
               France ». La boucle sur les modes est partie avec eux, et
               avec elle la date de guest et son gras d'urgence (la
               règle de la nº 244-§3) : cette ligne n'a plus de date à
               porter. Ce qu'elle dit est calculé par `ligneDIdentite`,
               qui est aussi ce que le banc éprouve — le composant ne
               décide plus d'un seul mot.
               §1 (nº 323) — 16 px sur le web (15 avant), le doigt
               garde ses 14.
               ██ §2 (nº 586) — ELLE A DROIT À DEUX LIGNES ██
               Elle en avait UNE, coupée net par des points de
               suspension. C'était tenable quand elle ne disait qu'une
               ville ; depuis la nº 585 elle peut en dire trois, dans
               deux pays, et la capsule qui vient de s'installer à sa
               droite lui prend encore de la largeur. DEUX LIGNES, ET
               PAS PLUS : au-delà, le bloc dépasserait la bande de
               vignettes qu'il coiffe.
               ⚠️ LE NOM, LUI, GARDE SA LIGNE UNIQUE : il s'abrège
               devant la capsule, il ne se replie pas. Un nom sur deux
               lignes se lirait comme deux noms. */}
          <span
            data-info-suivi=""
            className="line-clamp-2 text-[14px] lg:text-[16px] leading-relaxed text-sombre-texte-doux"
          >
            {identite}
          </span>
          {/*  LE COMPTE DE NOUVEAUTÉS (§5, nº 243) — sur SA ligne : il
               ne parle d'aucun mode en particulier. */}
          {nouveautes && (
            <span
              data-nouveautes=""
              className="truncate text-[14px] lg:text-[15px] leading-relaxed text-sombre-texte-doux"
            >
              {nouveautes}
            </span>
          )}
        </span>
      </Link>
      {/*  ██ §2 (nº 862) — LE BADGE DU TYPE, À LA PLACE DE « FOLLOWING » ██
           ----------------------------------------------------------
           DÉCISION DU PROPRIÉTAIRE : « le badge Following est REMPLACÉ
           par le badge TYPE (« Tattoo Artist », robe de Follow, lien
           vers le profil) ». C'est LE MÊME COMPOSANT QUE LE FIL
           (`BadgeTypeDeFiche`, web et doigt) : sa robe — l'aplat de
           « Suivre », le fond `carteClair` de la nº 853 et l'écriture
           de « Following » —, son mot et sa destination sont écrits chez
           lui, une seule fois. Rien n'est recopié ici.
           ⚠️ CE QUE CETTE PAGE PERD, ET C'EST DIT : on ne se désabonne
           plus depuis la liste. Le geste vit sur le PROFIL, où le badge
           mène — la même règle que le fil depuis la nº 843 (« on décide
           de suivre quelqu'un qu'on est venu voir »). La capsule de la
           nº 586, son état de départ connu du serveur et sa bascule sur
           place partent avec elle.
           ⚠️ ET LA LIGNE DU DESSOUS PERD SON TYPE : deux endroits
           diraient deux fois la même chose. C'est `ligneDIdentite`
           (lib/selection-suivis) qui l'a retiré, à la source.
           ⚠️ SA BOÎTE GARDE L'ÉCHELLE DU WEB DE LA nº 589, aux deux
           classes près : la capsule montait à quarante pixels à côté
           d'un rond de 72, et ce badge-ci prend exactement les siennes
           (`classeBoite`, chez lui). Le doigt n'en voit rien — c'est un
           cran `lg:`, comme le rond et les deux lignes de texte.
           ⚠️ `ml-auto` LE POUSSE AU BORD, `shrink-0` (chez lui)
           l'empêche de se faire écraser par un nom trop long : c'est le
           nom qui s'abrège, jamais le badge. */}
      <div className="ml-auto shrink-0">
        <BadgeTypeDeFiche
          /*  LE BADGE LIT LES NOMS DE CHAMPS D'UNE FICHE
              (`type_fiche`, `etablissement`) ; un portfolio suivi les
              porte dans sa propre grammaire (`typeFiche`,
              `etablissement`, lib/favoris-serveur). On les lui présente,
              on ne les réécrit pas : le MOT reste celui de
              `libelleTypeFiche`, lu chez lui. */
          tatoueur={{
            slug: suivi.slug,
            type_fiche: suivi.typeFiche,
            etablissement: suivi.etablissement,
          }}
          classeBoite="lg:min-h-[40px] lg:px-5"
        />
      </div>
      </div>

      {/* 2 · §3 (nº 251) — PLUS AUCUN TITRE AU-DESSUS DES BANDES.
             « Vos coups de cœur », « Ses dernières réalisations », « Ses
             derniers flashs » : les trois sont supprimés, web et
             smartphone. L'information n'est pas perdue — depuis la
             nº 249 c'est LE CŒUR posé en bas à droite de la vignette
             qui dit qu'une photo a été aimée, et il le dit en moins de
             place. (`bande.cas` reste : c'est lui qui décide de ce
             cœur.) */}

      {/* 3 · LA BANDE DE VIGNETTES — §6 (nº 249) : ELLE DÉFILE.
             Elle ne se tronque plus à ce qui tient dans la largeur :
             c'est une rangée à défilement NATIF avec accrochage
             (`scroll-snap`), à la manière des rangées d'Apple ou de
             Netflix — la refonte du carrousel de portfolio (nº 209-§7),
             appliquée telle quelle : AUCUNE translation calculée.
              · au doigt, TROIS vignettes pleines, et la suivante
                DÉPASSE du bord droit — c'est ce dépassement qui dit
                qu'il y en a d'autres ; le web garde ses nombres
                d'aujourd'hui (4, 5, puis 6), même dépassement ;
              · l'accrochage est au CENTRE (`snap-center`) : dès qu'on
                a fait défiler, la précédente dépasse à GAUCHE — la
                rangée n'est jamais coupée net aux deux bords (les
                extrémités, elles, s'alignent au bord : le navigateur
                borne) ;
              · à la souris, deux flèches (`pointer-fine:` — la
                variante EXISTE, déclarée dans globals.css nº 208-§2 :
                vérifié, pas supposé) font défiler par `scrollBy`, une
                position que le navigateur possède ;
              · le débordement vit DANS la rangée (`overflow-x-auto`),
                jamais dans la page : le piège de la nº 228 ne peut pas
                se réveiller.
             ⚠️ MOINS DE PHOTOS QUE LA LARGEUR : on n'affiche que ce
             qui existe, jamais un doublon, jamais une case comblée. */}
      {bande.photos.length > 0 && (
        <RangeeDeVignettes suivi={suivi} bande={bande} surOuverture={surOuverture} />
      )}
    </div>
  );
}

/**
 * LA RANGÉE QUI DÉFILE (§5 et §6, nº 249)
 * ==================================================================
 * Les largeurs de case disent le NOMBRE VISIBLE, pas un pixel choisi :
 * `(100% − les écarts) / N,4` montre N vignettes pleines et 0,4 de la
 * suivante — le dépassement demandé. Les écarts restent les 6 px de la
 * nº 244 (`gap-1.5`), les angles droits ceux de la nº 247.
 *
 * §4 (nº 264) — AU DOIGT, LE DÉPASSEMENT DÉCIDE DE LA TAILLE, plus
 * l'inverse : la vignette de droite ne montre que 10 % de sa largeur
 * AU BORD DE L'ÉCRAN. La rangée déborde des marges (§3) : la largeur
 * disponible au repos va du bord de contenu gauche au bord d'écran
 * droit — 100 % (le contenu) + 16 px (la marge `px-4` de la page).
 * Trois pleines, trois écarts de 6 px, et 10 % de la quatrième :
 * `3,1 × case + 18 px = 100 % + 16 px`, d'où
 * `case = (100 % + 16 px − 18 px) / 3,1`. AUCUNE LARGEUR EN DUR : la
 * règle tient à toutes les largeurs de téléphone ; les vignettes s'en
 * trouvent agrandies, le format 4/5 suit (CADRE_PHOTO_PORTFOLIO).
 * ⚠️ LE WEB NE CHANGE PAS : ses pourcentages se lisent sur la BOÎTE DE
 * CONTENU de la rangée (le rembourrage du débordement n'y entre pas,
 * c'est la règle des pourcentages en flexbox) — mêmes largeurs, mêmes
 * hauteurs qu'avant le débordement.
 */
const CASE_RANGEE =
  "shrink-0 snap-center basis-[calc((100%+16px-18px)/3.1)] " +
  "sm:basis-[calc((100%-18px)/4.4)] lg:basis-[calc((100%-24px)/5.4)] " +
  "xl:basis-[calc((100%-30px)/6.4)]";

function RangeeDeVignettes({
  suivi,
  bande,
  surOuverture,
}: {
  suivi: TatoueurSuivi;
  bande: ReturnType<typeof bandeDeTrois>;
  surOuverture?: OuvertureDepuisSuivis;
}) {
  return (
    /*  §2 (nº 254) — 20 px entre l'identité et sa bande sur le web ;
        §4 (nº 264) — LE DOIGT REJOINT LES 20 px : ses 8 px collaient la
        photo de profil à la rangée agrandie. Une seule valeur (`mt-5`).
        §3 (nº 264) — LA RANGÉE DÉBORDE DE SON CADRE, à gauche et à
        droite, jusqu'aux bords de l'écran : marges NÉGATIVES de la
        largeur des marges de la page (`-mx-4 sm:-mx-6`), rendues en
        REMBOURRAGE interne (`px-4 sm:px-6`) — au repos la première
        vignette reste alignée sur le contenu, et la partielle se
        prolonge dans la marge, sous le fondu.
        ⚠️ PIÈGE DE LA nº 228 : le débordement vit DANS le défilement de
        la rangée, jamais dans la page.
        §1 (nº 306) — ET LE DESSIN N'EST PLUS ÉCRIT ICI : c'est
        `GalerieQuiDefile`, partagé avec la colonne Portfolio d'une
        fiche. Ce composant ne décide plus que du CONTENU. */
    /*  §1-a (nº 316) — L'ÉCART DES PHOTOS EST DIVISÉ PAR DEUX AU
        DOIGT, ET PAR LÀ SEULEMENT : 6 px (`gap-1.5`, le défaut de
        `GalerieQuiDefile` depuis la nº 244) devient 3 px.
        ⚠️ LA VALEUR ÉTAIT PARTAGÉE AVEC LE WEB — c'était le même
        `gap-1.5` aux deux largeurs, puisque rien n'était passé et que
        le défaut vaut partout. LE WEB NE BOUGE PAS : il reprend ses
        6 px dès `lg`, la borne qui sépare le doigt du web sur ce site.
        ⚠️ ET C'EST UN RÉGLAGE, PAS UNE VALEUR CHANGÉE : `ecart` est un
        paramètre de `GalerieQuiDefile` depuis la nº 308, exactement
        comme la taille des chevrons depuis la nº 310. Le défaut du
        composant n'est pas touché — la colonne Portfolio d'une fiche,
        qui passe le sien (3 px), ne sent rien. */
    /*  §1 (nº 325) — ANNULATION DU §2 DE LA nº 323 : LES 20 px SONT
        REMIS, WEB COMPRIS.
        ------------------------------------------------------------------
        La nº 323 avait porté cet écart à 36 px sur le web
        (`lg:mt-9`), en croyant que c'était là que le propriétaire
        voulait de l'air. CE N'ÉTAIT PAS LÀ — l'air manquait sous le
        BLOC DE TÊTE de la page (le titre et son compte), et c'est ce
        que le §2 de la nº 325 corrige, dans `LigneResultats`.
        LA VALEUR REDEVIENT DONC CELLE DE TOUJOURS : `mt-5` nu, 20 px,
        aux DEUX largeurs — celle posée à la nº 254 pour le web et
        rejointe par le doigt à la nº 264-§4.
        ⚠️ AUCUNE PASSE FUTURE NE DOIT « RÉTABLIR » LES 36 px en
        croyant réparer un oubli : ils ont été retirés sur demande.
        ██ §2 (nº 865) — DOUZE PIXELS AU DOIGT, ET C'EST DIT ██
        Le propriétaire trouve « trop d'air entre le bloc avatar et la
        galerie d'images en dessous » sur le téléphone : les vingt
        pixels tombent à DOUZE (`mobile:mt-3`) — l'air que la carte du
        fil met entre sa rangée d'avatar et son image (`pb-3`,
        RANGEE_EN_TETE_DE_FIL) : la même relation, une rangée d'identité
        au-dessus d'une bande d'images, le même air. Le web garde ses
        vingt (nº 325) : la consigne est mobile, et deux variantes qui
        s'excluent (règle nº 60) font une seule déclaration par écran
        (piège nº 389). */
    <GalerieQuiDefile
      classeEnveloppe="not-mobile:mt-5 mobile:mt-3"
      classeRangee="-mx-4 px-4 sm:-mx-6 sm:px-6"
      ecart="gap-[3px] lg:gap-1.5"
      cleDuContenu={bande.photos.length}
      /*  ██ §4 (nº 462) — LA BANDE SE SOUVIENT DE SA POSITION ██
           LA CAUSE DU DÉFAUT, nommée : cet appel ne passait PAS
           `cleMemoire` — la mémoire de la nº 459 est un réglage
           demandé, et seule la colonne Portfolio des fiches le
           demandait. Au retour d'une photo, la bande remontait donc
           neuve, à sa première vignette. LA CLÉ : le préfixe réservé
           de « Ma sélection » (épargné par la purge des fiches —
           lib/memoire-galeries) + le slug du suivi : une bande par
           artiste, chacune la sienne. Restitution avant peinture,
           écriture au démontage — rien d'autre ne change. */
      cleMemoire={cleDeGalerie(PREFIXE_SELECTION, "suivis", suivi.slug, "bande")}
    >
        {bande.photos.map((photo) => (
        <li key={photo.id} className={CASE_RANGEE}>
          {/*  UNE VIGNETTE OUVRE LA PHOTO, et elle seule : la fiche
               s'ouvre sur cette photo, dans son ensemble (style +
               catégorie + rendu), exactement comme une carte de la
               mosaïque le fait. */}
          <Link
            href={
              `/artist/${suivi.slug}?style=${photo.style}` +
              `&nature=${photo.nature}` +
              (photo.rendu ? `&rendu=${photo.rendu}` : "") +
              `&photo=${photo.id}`
            }
            data-vignette-suivi={photo.id}
            /*  §2 (nº 312) — EN WEB, LA FICHE S'OUVRE PAR-DESSUS, ET
                SUR CETTE PHOTO : les trois tags de la série ET
                l'identifiant de la photo voyagent, exactement comme
                dans l'adresse juste au-dessus. Les deux chemins
                ouvrent donc la même chose — c'est ce qui permet au
                doigt de naviguer sans qu'on écrive rien de plus. */
            onClick={(evenement) =>
              ouvrirEnFenetre(
                evenement,
                surOuverture,
                suivi.slug,
                {
                  cle: `suivi-${photo.id}`,
                  style: photo.style,
                  nature: photo.nature,
                  rendu: photo.rendu ?? "",
                  photo: photo.id,
                },
                `/artist/${suivi.slug}?style=${photo.style}` +
                  `&nature=${photo.nature}` +
                  (photo.rendu ? `&rendu=${photo.rendu}` : "") +
                  `&photo=${photo.id}`
              )
            }
            //  §4 (nº 244) — au doigt, une BRÈVE baisse d'opacité,
            //  rien de plus. §5 (nº 247) — angles droits.
            //  §4 (nº 251) — LE FORMAT PORTFOLIO DU SITE (4:5), lu
            //  là où il vit : `CADRE_PHOTO_PORTFOLIO`. Il réserve
            //  aussi la hauteur AVANT l'image (règle du §3, nº 226).
            className={`relative block ${CADRE_PHOTO_PORTFOLIO} overflow-hidden rounded-none
                       transition-opacity active:opacity-75`}
          >
            {/*  §2 (nº 648) — la plaque d'attente, rentrée de 2 px,
                 comme sur les cartes : le fond clair ne dépasse plus
                 sous la vignette (config/tattoo). */}
            <span aria-hidden="true" className={FOND_RESERVE_PHOTO} />
            {/* eslint-disable-next-line @next/next/no-img-element --
                photo déposée par le tatoueur, servie telle quelle. */}
            <img
              //  §1 (nº 782) — par notre porte : voir lib/photos-du-bord.
              src={photoDuBord(photo.miniature)}
              alt=""
              loading="lazy"
              decoding="async"
              //  §2 (nº 648) — `relative` : au-dessus de la plaque.
              className="relative h-full w-full object-cover"
            />
            {/*  §2 (nº 302) — PLUS AUCUN CŒUR SUR CES VIGNETTES,
                 web comme doigt. Le cœur de la nº 249 disait qu'une
                 photo avait été aimée par le visiteur ; la galerie ne
                 se compose plus de ses coups de cœur (nº 302-§1),
                 ce signe n'a donc plus rien à signaler. Supprimé,
                 code compris — le glyphe n'est plus importé. */}
          </Link>
        </li>
      ))}
      {/*  §1 (nº 302) — LA CASE « VOIR PLUS » EST SUPPRIMÉE, code
           compris. La galerie s'arrête à vingt photos ; s'il y en a
           moins, il y en a moins, et sans message — c'est la
           consigne, au mot près. Le drapeau `voirPlus` a disparu du
           type avec elle : plus rien ne le calcule. */}
    </GalerieQuiDefile>
  );
}
