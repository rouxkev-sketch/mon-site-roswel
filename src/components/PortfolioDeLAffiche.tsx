"use client";

import { OngletsLigne } from "@/components/OngletsLigne";
import { CATEGORIES_EXPLORER } from "@/config/tatouage";
import {
  NATURE_PAR_DEFAUT,
  RENDU_PAR_DEFAUT,
  RENDUS_PHOTO,
  type SlugNature,
} from "@/lib/photos-tatoueur";
import type { PhotoGalerie, StyleGalerie } from "@/lib/photo-tatoueur";
//  §1 (nº 873) — les trois vues d'un portfolio et leurs adresses : une
//  feuille sans dépendance, lue ici comme par les routes et le proxy.
import {
  LIBELLES_DES_VUES,
  VUES_DE_FICHE,
  type VueDeFiche,
} from "@/lib/lien-interne";

/**
 * ██ §3 (nº 876) — LES BANDES PAR STYLE DU WEB SONT SUPPRIMÉES, CODE
 * COMPRIS ██
 * ==================================================================
 * DÉCISION DU PROPRIÉTAIRE : au web, les pages Portfolio et Flash d'un
 * profil montrent LES CARTES DE GALERIE DU MOBILE (FilDeGalerie,
 * nº 873/874) — une par rangée, pleine largeur dans les marges du web :
 * titre en haut à gauche, compteur en haut à droite, la photo avec les
 * chevrons de la nº 839 au survol, le pied en dessous. Le fil est donc
 * la présentation des DEUX appareils, et ce fichier perd tout ce qui ne
 * servait qu'aux bandes : `PanneauPortfolio` (ses deux blocs « doigt »
 * et « web », les cases `casesDe`, la règle « une image pleine et 60 %
 * de la suivante » de la nº 874-§5), `TeteDeGalerie` (nº 521/747, dont
 * le compteur vit déjà ici, `CompteurDeGalerie`), la purge d'arrivée de
 * la mémoire des galeries (nº 459 — elle ne servait que les bandes du
 * doigt, parties à la nº 873).
 * ⚠️ `SerieChoisie` EST PARTI AVEC ELLES, PUIS REVENU À LA nº 877 : le
 * chemin « le geste change la photo du haut » (nº 204/306) a retrouvé
 * un porteur — LA PHOTO D'UNE CARTE DE GALERIE, cliquée au web (§3
 * nº 877, FilDeGalerie). Les poseurs de FicheTatoueur et de
 * FenetreFiche sont revenus avec lui.
 * RESTENT : le va-et-vient (SelecteurOngletAffiche), la
 * liste des galeries d'une page (`galeriesDuPortfolio`), le titre et le
 * compteur d'une galerie — ce que le fil consomme.
 *
 * L'AFFICHE EN TROIS ONGLETS — « Profile », « Portfolio », « Flash »
 * ==================================================================
 * (passe nº 197 ; refondu par la nº 276-§3 ; TROIS PAGES depuis la
 * nº 873-§1 — voir `SelecteurOngletAffiche` plus bas, et
 * lib/lien-interne pour les adresses.)
 *
 *  · « Profil / Portfolio » (nº 205-§1) — DEUX MOTS NUS côte à côte,
 *    l'actif en blanc, l'autre en gris, et sous lui un TRAIT ROSE qui
 *    GLISSE (`OngletsLigne` — la capsule opaque qui tenait ce rôle a
 *    cédé la place à la nº 382-§2 ; voir plus bas).
 *    LA RANGÉE DU HAUT (nº 205-§2) : le sélecteur à gauche, « Suivre »
 *    à droite — c'est ContenuFiche qui compose la rangée.
 *
 * ⚠️ LES DEUX VA-ET-VIENT ONT DISPARU (nº 276-§3, code compris) :
 * « Réalisations / Flashs » (OngletsLigne) et « Noir & gris / Couleur »
 * (les deux rectangles) cachaient chacun la moitié du portfolio
 * derrière un aller-retour. À leur place, DEUX SECTIONS EMPILÉES :
 *
 *  · un titre « RÉALISATIONS », puis « FLASHS » — les libellés de
 *    `CATEGORIES_EXPLORER` (les seuls endroits du site qui les
 *    nomment), rendus par L'ÉCRITURE DES TITRES DE SECTION DU PROFIL
 *    (`ECRITURE_TITRE_SECTION`, les capitales grises espacées de la
 *    nº 223) — aucune valeur choisie ici, on réutilise la leur ;
 *  · sous chaque titre, TOUTES SES SÉRIES en vignettes, tous rendus
 *    MÊLÉS (noir, noir & gris, couleur — nº 404), dans leur ordre
 *    existant — les styles de A à Z (nº 208-§4), et dans un style,
 *    l'ordre de `RENDUS_PHOTO` — SANS aucun titre intermédiaire : les
 *    mots des rendus ne s'écrivent nulle part ;
 *  · une section vide NE REND RIEN — ni titre, ni espace.
 *
 * ██ §2 (nº 375) — LES DEUX TITRES DE SECTION DEVIENNENT UN SURTITRE ██
 * ==================================================================
 * CE QUI CHANGE : « RÉALISATIONS » et « FLASHS » ne coiffent plus une
 * section. Le mot descend AU-DESSUS DU TITRE DE CHAQUE GALERIE et s'y
 * RÉPÈTE — cinq galeries de réalisations, cinq fois « RÉALISATIONS ».
 * Le portfolio n'est donc plus deux blocs, mais UNE SUITE de galeries
 * qui portent chacune sa catégorie ; l'ordre ne bouge pas (toutes les
 * réalisations, puis tous les flashs), et le mot garde son écriture au
 * cheveu près — c'est toujours `ECRITURE_TITRE_SECTION`, on ne
 * redéclare ni sa taille, ni sa graisse, ni son gris, ni son
 * espacement de lettres.
 *
 * UNE SÉRIE = STYLE + CATÉGORIE + RENDU — exactement une galerie de
 * dépôt, donc vingt photos au plus PAR CONSTRUCTION : rien de tronqué.
 * Un toucher de vignette ouvre cette série dans la galerie de
 * l'affiche, comme avant — les vignettes et leur remontée n'ont pas
 * bougé.
 */

/*  §1 (nº 873) — LES ONGLETS SONT LES VUES D'UN PORTFOLIO (`VueDeFiche`,
    lib/lien-interne) : « profil », « portfolio », « flash » — trois
    pages, trois adresses. Le type `OngletAffiche` à deux valeurs de la
    nº 197 est parti avec l'onglet-requête (« ?onglet=portfolio »). */

/**
 * ██ §3 (nº 877) — `SerieChoisie` REVIENT, ET AVEC LUI LE CHEMIN QU'IL
 * PORTAIT ██
 * ==================================================================
 * CE QUE LA nº 876 AVAIT SUPPRIMÉ : « ce qu'un toucher de vignette
 * ouvre » (nº 204-§3), faute de vignette — les bandes par style du web
 * étaient parties.
 * CE QUE LE PROPRIÉTAIRE DEMANDE À LA nº 877 : « clic sur une photo
 * d'une carte de galerie → elle s'affiche EN GRAND dans la colonne de
 * gauche du profil, comme les anciennes vignettes le faisaient ». Le
 * GESTE change de porteur — une carte du fil au lieu d'une vignette de
 * bande —, le CHEMIN est le même, au caractère près : une série et un
 * rang, que la fiche (FicheTatoueur) ou la fenêtre superposée
 * (FenetreFiche) posent dans leur affiche.
 */
export type SerieChoisie = {
  style: string;
  nature: string;
  rendu: string;
  /** §1-6 (nº 306) — LE RANG DE LA PHOTO TOUCHÉE dans sa série. Le
      cadre photo de la fiche s'ouvre SUR ELLE. Absent : la première. */
  indice?: number;
};

//  §2 (nº 873) — LES TROIS ONGLETS, dans l'ordre des vues ; « Flash »
//  est TOUJOURS là, même sans flash : la page existe, et dit alors
//  « No flash yet. » (§4). Les mots vivent avec les adresses.
const ONGLETS: Array<{ cle: VueDeFiche; label: string }> = VUES_DE_FICHE.map(
  (cle) => ({ cle, label: LIBELLES_DES_VUES[cle] })
);

/**
 * §1 (nº 873) — LA CATÉGORIE QU'UNE VUE MONTRE : « Portfolio » montre
 * les tatouages (la nature par défaut du site), « Flash » les flashs.
 * Le profil n'en montre aucune (`null`). C'est l'entrée de
 * `CATEGORIES_EXPLORER` — son titre (« Tattoos », « Flash ») coiffe
 * chaque galerie, sa phrase `vide` remplit une page sans photo.
 */
export function categorieDeLaVue(
  vue: VueDeFiche
): (typeof CATEGORIES_EXPLORER)[number] | null {
  if (vue === "profil") return null;
  const nature: SlugNature = vue === "flash" ? "flash" : NATURE_PAR_DEFAUT;
  return (
    CATEGORIES_EXPLORER.find((categorie) => categorie.nature === nature) ??
    null
  );
}

/** Le rendu d'une photo, jamais vide : les lignes d'avant la migration
    nº 48 n'en portent pas — on lit alors le même défaut que partout. */
function renduDe(photo: PhotoGalerie): string {
  return photo.rendu ?? RENDU_PAR_DEFAUT;
}

/**
 * LE SÉLECTEUR « PROFIL / PORTFOLIO »
 * ==================================================================
 * (nº 205-§1, puis nº 255-§1 — REFAIT PAR LA nº 382-§2.)
 *
 * ██ §2 (nº 382) — LA CAPSULE CÈDE LA PLACE AU SOULIGNEMENT ROSE ██
 * L'onglet actif était encadré par un badge opaque qui glissait — un
 * composant à lui, SUPPRIMÉ du dépôt à la nº 601 une fois son dernier
 * appelant parti. Il porte désormais LE SOULIGNEMENT DE LA
 * CRÉATION DE PORTFOLIO — celui qui choisit entre « Réalisation » et
 * « Flash » dans l'espace tatoueur (BlocPortfolio) : les mots nus,
 * l'actif en blanc, et un trait rose de trois pixels qui GLISSE d'un
 * mot à l'autre.
 *
 * CE QUE JE RÉEMPLOIE, ET C'EST LE COMPOSANT LUI-MÊME :
 * `OngletsLigne`. Aucun second système n'est dessiné — ni la couleur
 * (`bg-primaire`), ni l'épaisseur (3 px), ni la courbe de glissement
 * (300 ms, `cubic-bezier(0.32,0.72,0,1)`), ni l'ARIA (`radiogroup` +
 * `radio`) ne sont réécrits ici. Il a simplement reçu deux RÉGLAGES
 * facultatifs (nº 382, voir OngletsLigne), dont les défauts
 * reproduisent son écriture d'avant au caractère près : ses cinq
 * autres appelants ne bougent pas d'un pixel.
 *
 * LES DEUX RÉGLAGES, ET POURQUOI :
 *  · `classeOnglet="px-5 min-h-[44px]"` — LA CIBLE TACTILE DU BADGE
 *    QU'IL REMPLACE, reprise au pixel : la capsule posait ses mots en
 *    `px-5 min-h-[44px]`. Sans ce réglage, les
 *    onglets tomberaient au `px-1` de la pleine largeur et la cible se
 *    réduirait presque au texte — c'est le piège nommé par le
 *    propriétaire ;
 *  · `avecLigneGrise={false}` — la rangée porte DÉJÀ son trait, sur
 *    toute sa largeur, depuis la nº 381. Deux gris empilés feraient
 *    deux pixels sous les onglets et un seul ailleurs.
 *
 * OÙ TOMBE LE ROSE (§3) : le bloc d'onglets mesure 44 + 3 = 47 px et
 * c'est le SEUL contenu de la rangée depuis la nº 869 (le plus haut
 * avant elle, « Suivre » faisait 30). Il occupe donc
 * toute la boîte de contenu, et son trait rose — posé sur son bord
 * bas — se retrouve COLLÉ au trait fin de la rangée, qui commence
 * exactement là. Aucun calcul, aucune valeur : une identité de boîtes.
 *
 * ⚠️ « SUIVRE » N'EST PAS TOUCHÉ : il n'est pas rendu ici. Il était
 * posé à droite par la rangée de ContenuFiche ; depuis la nº 869-§3 il
 * vit dans la RANGÉE D'ACTIONS du profil, et ce va-et-vient est seul
 * dans la sienne, sur toute la largeur (§4). Rien de ce fichier ne le
 * concerne.
 */
/**
 * ██ §1 ET §2 (nº 873) — TROIS ONGLETS, ET DEUX NATURES ██
 * ------------------------------------------------------------------
 * « Profile · Portfolio · Flash », chaque onglet un tiers, le mot
 * centré, et LE TRAIT ROUGE SUR TOUTE LA LARGEUR DE L'ONGLET
 * (`traitPlein` — la nº 871-§1 est annulée ici, et ici seulement :
 * « Ma sélection » garde son trait court).
 * SUR UNE PAGE PUBLIQUE (`adresses` fournies), les onglets sont des
 * LIENS entre les trois pages d'un portfolio — la navigation douce de
 * l'accueil (nº 860), la même bascule de nature d'`OngletsLigne` ;
 * `surDepart` est ce que ContenuFiche déclare avant de partir (la
 * place de la page visée). SANS ADRESSES — la fenêtre superposée du
 * web, qui n'a pas d'adresse à elle, et l'aperçu « Ma fiche » —, ce
 * sont des boutons, et `surChoix` change le contenu sur place, comme
 * depuis la nº 197.
 */
export function SelecteurOngletAffiche({
  valeur,
  surChoix,
  adresses,
  surDepart,
}: {
  valeur: VueDeFiche;
  /** Le choix, quand les onglets sont des boutons (pas d'adresses). */
  surChoix?: (onglet: VueDeFiche) => void;
  /** Les adresses des trois vues (`adressesDesVues`) : les onglets
      deviennent des liens. */
  adresses?: Record<VueDeFiche, string>;
  /** Ce qu'il faut déclarer avant de suivre un lien d'onglet. */
  surDepart?: (onglet: VueDeFiche) => void;
}) {
  return (
    <OngletsLigne
      options={
        adresses
          ? ONGLETS.map((onglet) => ({
              ...onglet,
              href: adresses[onglet.cle],
              surClic: () => surDepart?.(onglet.cle),
            }))
          : ONGLETS
      }
      cleActive={valeur}
      //  Les clés sont celles de `ONGLETS`, donc des `VueDeFiche` :
      //  le composant partagé, lui, parle en chaînes.
      surChoix={surChoix ? (cle) => surChoix(cle as VueDeFiche) : undefined}
      ariaLabel="Profile, portfolio or flash"
      traitPlein
      /*  ██ §4 (nº 869) — TOUTE LA LARGEUR, CHAQUE ONGLET LA MOITIÉ ██
          « Follow » et « Share » ont quitté la rangée pour la rangée
          d'actions du profil (§3) : le va-et-vient y est seul, et il la
          prend entière — comme celui de « Ma sélection » (MenusSelection),
          le MÊME composant avec la même lecture : les colonnes égales de
          la grille, le mot centré dans la sienne, aucune icône. L'air
          latéral de la nº 382 (20 px, 16 au web depuis la nº 852) n'a
          plus d'objet quand l'onglet fait une demi-largeur : il tombe au
          rembourrage de la pleine largeur, celui de « Ma sélection ».
          ⚠️ LA CIBLE TACTILE NE RÉTRÉCIT PAS, elle grandit : 44 px de
          haut, inchangés, sur la moitié de la colonne au lieu d'un mot
          et ses vingt pixels. */
      classeOnglet="px-1 min-h-[44px]"
      avecLigneGrise={false}
    />
  );
}

/** Une série publiée — sa vignette dans la grille d'une section.
    §1 (nº 866) — EXPORTÉE : le fil de galeries (FilDeGalerie) fait une
    carte de chacune. */
export type SeriePubliee = {
  style: string;
  label: string;
  rendu: string;
  miniature: string;
  /** §1 (nº 306) — TOUTES LES PHOTOS DE CETTE SÉRIE, dans leur ordre.
      La galerie du web les montre TOUTES : pas de plafond ici (celui de
      « Ma sélection » ne vaut que pour elle), et pas de « Voir plus ».
      La grille du doigt, elle, n'en lit que la première (`miniature`) —
      elle ne change pas d'un pixel. */
  photos: PhotoGalerie[];
};

/**
 * TOUTES LES SÉRIES PUBLIÉES D'UNE CATÉGORIE, APLATIES (nº 276-§3).
 * Les styles de A à Z (`localeCompare` en français, nº 208-§4 — les
 * accents se rangent où on les attend) ; DANS un style, les rendus
 * présents dans l'ordre de `RENDUS_PHOTO` (noir, noir & gris, puis
 * couleur — nº 404) — « leur ordre existant », celui que les
 * sélecteurs parcouraient. Les rendus sont MÊLÉS dans la même
 * grille : aucun mot de rendu ne s'écrit, nulle part. Un style sans
 * photo dans cette catégorie n'a pas de vignette.
 */
function seriesDeLaCategorie(
  groupes: StyleGalerie[],
  nature: string
): SeriePubliee[] {
  const series: SeriePubliee[] = [];
  const parLabel = groupes
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
  for (const groupe of parLabel) {
    for (const rendu of RENDUS_PHOTO) {
      const photos = groupe.photos.filter(
        (photo) => photo.nature === nature && renduDe(photo) === rendu.slug
      );
      if (photos.length === 0) continue;
      series.push({
        style: groupe.slug,
        label: groupe.label,
        rendu: rendu.slug,
        miniature: photos[0]?.miniature ?? "",
        photos,
      });
    }
  }
  return series;
}

/** UNE GALERIE DU PORTFOLIO : sa série et sa nature (« tatouage »,
    « flash »).
    ⛔ §4 (nº 874) — LE TITRE DE SA CATÉGORIE (« Tattoos », « Flash »)
    est parti avec le surtitre qui l'affichait : plus personne ne le
    lit (règle nº 386). La nature, elle, sert encore — elle nomme la
    galerie (`data-galerie-serie`) et voyage dans les liens de partage. */
export type GalerieDuPortfolio = {
  serie: SeriePubliee;
  nature: string;
};

/**
 * ██ §1 (nº 866) — LA LISTE DES GALERIES DU PORTFOLIO, ÉCRITE UNE FOIS ██
 * ==================================================================
 * Le panneau Portfolio la rendait pour lui seul ; LE FIL DE GALERIES
 * (FilDeGalerie — une carte par galerie, décision du propriétaire) la
 * lit désormais aussi : même ordre, mêmes séries, même titre de
 * catégorie — six galeries sur le profil, six cartes dans le fil, par
 * construction et non par accord. La règle est celle d'hier, mot pour
 * mot :
 *
 * §2 (nº 375) — UNE SEULE SUITE DE GALERIES, CHACUNE PORTANT SA
 * CATÉGORIE.
 * ------------------------------------------------------------------
 * On aplatit les sections dans l'ordre où elles arrivent : toutes les
 * réalisations, puis tous les flashs — `CATEGORIES_EXPLORER` donne
 * l'ordre, il ne change pas. Chaque galerie emporte le MOT de sa
 * catégorie, qui s'écrira au-dessus de son titre.
 * ⚠️ LE FILTRE FAIT DÉJÀ LE TRAVAIL DES CAS LIMITES : un tatoueur sans
 * flash n'a qu'une section, donc aucune galerie ne porte « Flashs », et
 * l'inverse est vrai aussi. Rien ne peut rester orphelin — il n'y a
 * plus de titre qui existe indépendamment d'une galerie. UNE SECTION
 * VIDE NE REND RIEN : ni titre, ni espace (nº 276-§3) ; une liste vide
 * dit « No posts yet » (le panneau) ou ne dessine aucune carte (le fil).
 */
/**
 * ██ §1 (nº 873) — UNE CATÉGORIE À LA FOIS ██
 * ------------------------------------------------------------------
 * Le portfolio et les flashs sont DEUX PAGES : la liste ne mêle plus
 * les deux catégories, elle rend les galeries de CELLE qu'on lui
 * demande — les tatouages sur `/portfolio`, les flashs sur `/flash`
 * (`categorieDeLaVue`). L'ordre dans une catégorie ne bouge pas. Une
 * nature inconnue ne rend rien.
 */
export function galeriesDuPortfolio(
  groupes: StyleGalerie[],
  nature: string
): GalerieDuPortfolio[] {
  if (!CATEGORIES_EXPLORER.some((candidate) => candidate.nature === nature)) {
    return [];
  }
  return seriesDeLaCategorie(groupes, nature).map((serie) => ({
    serie,
    nature,
  }));
}

/**
 * ██ §1 (nº 747) — CES DEUX-LÀ VIVENT AU MODULE, ET C'EST LE SUJET DE
 * LA PASSE ██
 * ==================================================================
 * `TeteDeGalerie` ÉTAIT DÉFINIE DANS LE CORPS DE `PanneauPortfolio`,
 * et elle y était MONTÉE comme composant (`<TeteDeGalerie …/>`). Une
 * fonction déclarée dans un rendu est une fonction NEUVE à chaque
 * rendu : React y voit un composant d'un AUTRE TYPE, et il ne
 * re-rend pas — il DÉTRUIT tout le sous-arbre et le RECRÉE. Chaque
 * clic de vignette (qui change l'état de la fiche, donc re-rend ce
 * panneau) rebâtissait donc TOUTES les galeries de la page.
 * CE QUE ÇA DONNAIT, MESURÉ AU BANC : sur trois galeries, ZÉRO
 * survivait à un clic — d'où le clignotement de toutes les lignes,
 * les photos redemandées, et le défilement de la galerie touchée
 * remis à zéro (1134 px → 0, compteur « 9/20 » → « 2/20 »).
 * DÉSORMAIS : le composant a une identité stable, React re-rend les
 * galeries sans les démonter — les rangées gardent leur nœud, donc
 * leurs images et leur défilement.
 * ⚠️ RIEN D'AUTRE NE CHANGE : mêmes props, même sortie, même
 * compteur par galerie (son état vit dans CE composant, un par
 * galerie — c'est pourquoi il en faut un, la règle des crochets
 * interdisant un état dans une boucle).
 * ⚠️ LA MÉMOIRE DU DOIGT (nº 459) RESTE : elle sert le VRAI
 * démontage — quitter la fiche pour la vue photo, puis revenir.
 * `casesDe` et `surtitre`, eux, sont APPELÉS (jamais montés) : une
 * fonction appelée rend des éléments, elle ne crée aucun type.
 */
/*  ⛔ §4 (nº 874) — LE SURTITRE D'UNE GALERIE EST SUPPRIMÉ, CODE COMPRIS.
    ------------------------------------------------------------------
    « TATTOOS » / « FLASH » coiffait chaque titre de galerie depuis la
    nº 375 (c'était alors le titre d'une SECTION, et les deux catégories
    se suivaient sur la même page). Le propriétaire le retire : depuis
    la nº 873, le portfolio et les flashs sont DEUX PAGES — la catégorie
    est déjà dite par l'onglet ouvert, et la répéter au-dessus de chaque
    galerie ne disait plus rien. Il ne reste que le titre :
    « Trash Polka • Color ».
    Partent avec lui : la fonction qui l'écrivait, sa marque de relevé
    (`data-surtitre-galerie`) et le titre de catégorie que chaque
    galerie transportait (`GalerieDuPortfolio.titre`) — plus personne ne
    le lit (règle nº 386 : pas de code mort). `ECRITURE_TITRE_SECTION`
    reste, elle, l'écriture des étiquettes de BlocLieux. */

/**
 * ██ §1 (nº 521) — LA TÊTE D'UNE GALERIE, AVEC SON COMPTEUR ██
 * ==================================================================
 * CE QU'ELLE POSE : la nature (« Réalisation »), puis la ligne du
 * style — et, À L'OPPOSÉ de celle-ci, le rang de la photo vue sur le
 * total : « 1/20 ». Enfin la galerie elle-même, que l'appelant
 * fournit : les deux affichages (doigt et web) gardent chacun leurs
 * réglages de débord, d'écart et de chevron, qui ne se ressemblent
 * pas.
 * ⚠️ POURQUOI UN COMPOSANT ET NON TROIS LIGNES DANS LA BOUCLE : le
 * rang est un ÉTAT, et il en faut un PAR galerie. Dans une boucle, un
 * état ne peut pas se déclarer — c'est la règle des crochets. Le
 * composant est donc la forme, pas un choix de style.
 * ⚠️ LE COMPTEUR NE POUSSE JAMAIS LE STYLE : c'est le TITRE qui cède
 * (il prend la place restante et s'abrège), le compteur garde la
 * sienne. Un style long s'écrit donc avec des points de suspension,
 * et le nombre reste lisible et entier.
 * ⚠️ LES CHIFFRES ONT TOUS LA MÊME LARGEUR (`tabular-nums`, le
 * procédé du compteur de carrousel) : passer de « 9/20 » à « 10/20 »
 * ne fait pas frémir la ligne.
 * ⚠️ IL N'EST JAMAIS VIDE : le rang part de zéro, et l'affichage
 * ajoute un.
 * ⚠️ §2 (nº 522) — CE QU'IL COMPTE EST LA DERNIÈRE VIGNETTE VUE, plus
 * la première. Une galerie de 19 photos qui en montre deux ouvre donc
 * sur « 2/19 » — deux photos SONT vues — et finit sur « 19/19 ». Avec
 * la première, elle disait « 1/19 » puis se bloquait à « 18/19 », la
 * dernière photo restant à l'écran sans être comptée : la première
 * visible ne peut pas dépasser l'avant-dernière quand deux tiennent
 * côte à côte. Le pourquoi complet vit dans GalerieQuiDefile.
 * ⚠️ CE N'EST PAS LE COMPTEUR DE LA VUE PHOTO (nº 483/487), et les
 * deux restent séparés à dessein : celui-là est une PASTILLE POSÉE
 * SUR L'IMAGE, avec son fond et son placement dans l'angle ; celui-ci
 * est du TEXTE NU au bout d'une ligne de titre. Ils ne partagent ni
 * habillage ni support — les réunir demanderait de paramétrer les
 * deux, pour ne mettre en commun qu'une barre oblique.
 */
/**
 * ██ §4 (nº 874) — LE COMPTEUR D'UNE GALERIE, ÉCRIT UNE SEULE FOIS ██
 * ------------------------------------------------------------------
 * « 1/20 », au bout de la ligne du titre, à l'opposé de lui. Il vivait
 * dans le seul `TeteDeGalerie` (le profil du web) ; LE FIL DU DOIGT LE
 * PORTE AUSSI depuis cette passe (la pastille dans la photo s'en va,
 * §4) et le propriétaire le veut « même couleur, même corps que sur le
 * web, à l'identique ». Il est donc écrit ICI, une fois, et les deux
 * surfaces le montent — elles ne peuvent plus diverger (piège nº 378).
 * L'écriture est celle de la nº 521/522, au cheveu : 14 px (un cran
 * sous la ligne du titre qu'il accompagne), graisse normale, le gris
 * des textes secondaires, et les chiffres à largeur fixe
 * (`tabular-nums`) pour que passer de « 9/20 » à « 10/20 » ne fasse pas
 * frémir la ligne. Il n'est jamais vide : le rang part de zéro, et
 * l'affichage ajoute un.
 */
export function CompteurDeGalerie({
  rang,
  total,
}: {
  rang: number;
  total: number;
}) {
  return (
    <p
      data-compteur-galerie=""
      className="shrink-0 text-[14px] font-normal tabular-nums text-sombre-texte-doux"
    >
      {rang + 1}/{total}
    </p>
  );
}

/**
 * ██ §3 (nº 863) — LE TITRE D'UNE GALERIE, ÉCRIT UNE FOIS ██
 * ------------------------------------------------------------------
 * La ligne du titre (« Blackwork • Black ») et ce qu'on pose à son
 * bout — le compteur « 1/20 », aux deux appareils depuis la nº 874-§4.
 * Le fil du doigt (FilDeGalerie) porte ce titre « même couleur, même
 * corps, même graisse que sur le profil » (décision du propriétaire) :
 * c'est donc LE MÊME COMPOSANT qui l'écrit aux deux endroits, pas deux
 * classes qu'on tiendrait d'accord.
 * ⛔ LE SURTITRE (« TATTOOS ») EST PARTI À LA nº 874-§4 : voir la note
 * en tête de fichier.
 * ⚠️ AU MODULE, comme `TeteDeGalerie` (nº 747) : un type stable, aucun
 * remontage de la galerie voisine à chaque rendu.
 */
export function TitreDeGalerie({
  titre,
  compteur,
}: {
  titre: string;
  /** Ce qui s'assoit au bout de la ligne du titre — le compteur.
      Absent : la ligne s'arrête au titre. */
  compteur?: React.ReactNode;
}) {
  return (
    <>
      {/*  `items-baseline` : le nombre s'assoit sur la même ligne
           d'écriture que le style, quelle que soit la casse. */}
      <div className="flex items-baseline gap-3">
        {/*  LE TITRE, AU-DESSUS DE SA GALERIE — l'écriture des noms
             de style de la grille (15 px, `medium`, blanche),
             reprise telle quelle. `min-w-0` : sans lui, un titre
             long refuserait de s'abréger et pousserait le compteur
             hors de la colonne. */}
        <p
          data-titre-galerie=""
          className="min-w-0 flex-1 truncate text-[15px] font-medium text-sombre-texte"
        >
          {titre}
        </p>
        {compteur}
      </div>
    </>
  );
}
