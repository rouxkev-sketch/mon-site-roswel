"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
//  §2 (nº 460) — le chevron du côté choisi du va-et-vient mobile : le
//  dessin des accordéons, jamais un second.
import { IconeChevronBas, IconeReglages } from "@/components/Icones";
import { MenuDeroulant } from "@/components/MenuDeroulant";
//  §1 (nº 460) — le va-et-vient du doigt : les onglets soulignés de la
//  page de recherche mobile (nº 447), le même composant.
import { OngletsLigne } from "@/components/OngletsLigne";
//  §3 (nº 460) — les comptes filtrés, posés par la page (PageFavoris)
//  et lus ici : le côté choisi affiche ce qui est réellement montré.
import {
  lireComptesSelection,
  souscrireComptesSelection,
} from "@/lib/compte-selection";
import { CATEGORIES_EXPLORER, libelleStyle } from "@/config/tatouage";
import { libelleExplorer } from "@/components/MoteurTatouage";
import {
  LIBELLE_TOUS_LES_FAVORIS,
  LIBELLE_TOUS_LES_PORTFOLIOS,
  libelleDuProfil,
  lireSelection,
  MENU_FAVORIS,
  MENU_SUIVIS,
  poserSelection,
  valeurDuMenu,
  type ChoixSelection,
  type EntreeFiltre,
  type MenuSelection,
} from "@/lib/filtres-selection";
import { lireRequeteCourante, souscrireAdresse } from "@/lib/adresse-courante";

/**
 * LE BLOC DE « MA SÉLECTION » — UN BADGE, UN MENU (refonte nº 255,
 * l'encadré retiré nº 256)
 * ==================================================================
 * `(Favoris) Suivis   Toutes les réalisations ▾`
 *
 * §1 — POURQUOI LES DEUX MENUS SONT PARTIS (nº 255). Le bloc en
 * portait deux, « Mes favoris » et « Mes suivis », dans l'encadré à
 * deux champs du moteur. C'était une erreur de FORME : dans le moteur,
 * les deux champs se COMBINENT (un style ET une ville) ; ici les deux
 * menus s'EXCLUENT — choisir dans l'un éteignait l'autre. La forme
 * mentait sur le fonctionnement. Sa moitié gauche est devenue un
 * BADGE, sa moitié droite UN SEUL MENU. Une seule ligne, sur web comme
 * au doigt : les deux titres cliquables de la nº 253 sont partis avec
 * les menus (§5), le badge les remplace.
 *
 * §1 (nº 256) — L'ENCADRÉ RESTE, ET C'EST LUI QUI CHANGE DE ROBE. Le
 * défaut de la nº 255 : la pilule (`sombre-haut`, #414149) était
 * EXACTEMENT le gris du fond de l'encadré (`data-clair-barre`, la
 * valeur gravée nº 175) — le badge, plus sombre que ce qui l'entoure,
 * inversait la hiérarchie de la charte (page → bloc → badge, chaque
 * niveau S'ÉCLAIRCIT) et le sélecteur ne se lisait pas. Trois
 * corrections, aucun contour nulle part :
 *  · l'encadré devient une CAPSULE (`porteBadge` — rayon à la moitié
 *    de sa hauteur, sur web comme au doigt) pour épouser la forme du
 *    badge qu'il contient ; le champ n'a plus de forme propre ;
 *  · la pilule monte D'UN CRAN FRANC au-dessus du fond :
 *    `haut-clair`, le barreau au-dessus de `haut` (`robeCapsule`, le
 *    paramètre de l'écriture unique — la fiche garde le sien) ;
 *  · le badge ne touche plus rien : ses 4 px d'air en haut et en bas
 *    (44 dans 52), le même air à gauche, et 12 px à sa droite avant
 *    le fin trait — l'air est CÉDÉ PAR LE CHAMP, le badge garde ses
 *    mots et sa glissade de la nº 255 au pixel (le `box-content` de
 *    l'encadré, voir EncadreBarre).
 * §6 — AU DOIGT, LE CHAMP NE DIT QUE LA CATÉGORIE (« Réalisations »,
 * « Flashs »), chevron gardé : le style complet vit dans le titre de
 * la page, juste dessous.
 *
 * ⚠️ RIEN N'EST DESSINÉ ICI, TOUT EST CONSOMMÉ (la règle de la passe) :
 *  · le badge qui glisse est `SelecteurCapsule` — le sélecteur
 *    « Profil / Portfolio » des fiches, extrait à cette passe ;
 *  · le champ du filtre est `MenuDeroulant` avec les drapeaux du champ
 *    « Explorer » du moteur (`sansBordure`, `sombre`, `repliable`,
 *    hauteur 52) — son chevron, son panneau web et sa feuille du bas ;
 *  · l'icône de mise en page est `BoutonPhototheque`, celle de la
 *    barre de recherche, extraite à cette passe ;
 *  · la rétractation reste CELLE DE LA BARRE (EnTeteTatouage) : ni
 *    hauteur, ni seuil, ni durée n'est écrit ici.
 *
 * §2 — LE BADGE BASCULE LE CONTENU, IL N'OUVRE RIEN. Un appui sur
 * « Suivis » montre les suivis, un appui sur « Favoris » les favoris :
 * aucune fenêtre, aucune feuille — c'est le menu de droite, et lui
 * seul, qui ouvre quelque chose. IL N'Y A JAMAIS D'ÉTAT NEUTRE :
 * « Favoris » est actif à l'arrivée, puisque c'est ce que la page
 * montre depuis la nº 247 (`CHOIX_PAR_DEFAUT`).
 * Le paramètre d'adresse unique de la nº 247 ne change pas — c'est
 * déjà lui qui rend les deux exclusifs, et lui qui rend le même écran
 * au retour d'une fiche.
 */

/*  §2 (nº 461) — `MOTS_DU_BADGE` est parti avec le badge : les
    deux mots vivent dans les options du va-et-vient, plus bas. */

export function MenusSelection({
  entreesFavoris,
  entreesSuivis,
}: {
  entreesFavoris: EntreeFiltre[];
  entreesSuivis: EntreeFiltre[];
}) {
  //  L'ADRESSE, LUE COMME UN MAGASIN : le même que celui de la
  //  mémoire de navigation — il surveille `pushState`, `replaceState`
  //  et `popstate`, donc un retour arrière rejoue le bon filtre.
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    () => ""
  );
  const choix = lireSelection(requete);
  const surLesFavoris = choix.menu === MENU_FAVORIS;
  const entrees = surLesFavoris ? entreesFavoris : entreesSuivis;

  /**
   * §3 — L'ÉCRAN EST-IL ÉTROIT ? Le libellé du champ s'y RACCOURCIT
   * (« Toutes les réalisations » devient « Réalisations ») plutôt que
   * de rétrécir le badge. La borne est CELLE DE LA BARRE (nº 154-§5,
   * EnTeteTatouage) — la même chaîne, au centième près : on ne pose
   * pas un second point de rupture.
   * Le premier rendu prend le libellé long (celui du serveur), et
   * l'effet le raccourcit après l'hydratation : aucune discordance.
   */
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const borne = window.matchMedia("(max-width: 1023.98px)");
    const lire = () => setEtroit(borne.matches);
    lire();
    borne.addEventListener("change", lire);
    return () => borne.removeEventListener("change", lire);
  }, []);

  /**
   * ██ §1-3 (nº 460, porté au web nº 461) — LE VA-ET-VIENT
   * « Favoris | Portfolios », AUX DEUX APPAREILS ██
   * ==================================================================
   * L'encadré-capsule (badge + champ « Filtrer ») est REMPLACÉ par les
   * onglets soulignés de la page de recherche mobile (nº 447 — le même
   * composant, `OngletsLigne`) : au doigt depuis la nº 460, au web
   * depuis la nº 461.
   * ⚠️ §6 (nº 525) — LE SECOND MOT EST « PORTFOLIOS », AUX DEUX
   * APPAREILS. La nº 460 l'avait rebaptisé « Suivis » ; le propriétaire
   * revient dessus, en connaissance de cause. Seul LE MOT change : le
   * contenu, le nombre, le chevron et la mécanique des deux appuis
   * restent ceux de la nº 460-462. La clé de menu, elle, ne bouge pas
   * — c'est `MENU_SUIVIS` (`?selection=suivis:…`) : ce nom-là vit dans
   * l'adresse et dans la base, il n'est pas un libellé.
   *  · CÔTÉ CHOISI : mot + NOMBRE + chevron. Le nombre est ce qui est
   *    RÉELLEMENT AFFICHÉ après filtrage — posé par la page à chaque
   *    rendu (lib/compte-selection) ; tant qu'il n'est pas connu
   *    (premier rendu), rien n'est écrit — jamais un « 0 » menteur
   *    (règles 137/203).
   *  · CÔTÉ NON CHOISI : le mot seul.
   *  · PREMIER APPUI sur l'autre côté : la bascule (`poserSelection`,
   *    l'écriture de toujours). SECOND APPUI sur le côté déjà choisi :
   *    la FEUILLE DE FILTRES — la commande incrémente un compteur que
   *    le MenuDeroulant (rendu ci-dessous, déclencheur caché) lit
   *    (`commandeOuverture`). La feuille est CELLE d'aujourd'hui, avec
   *    ses marges (`feuilleDecollee`).
   */
  const comptes = useSyncExternalStore(
    souscrireComptesSelection,
    lireComptesSelection,
    lireComptesSelection
  );
  const [commandeFiltres, setCommandeFiltres] = useState(0);
  /*  ⚠️ §2 (nº 582) — LE CHEVRON NE PIVOTE PLUS, ET SON ÉTAT EST
      PARTI AVEC LUI. La nº 529 le retournait quand le menu s'ouvrait,
      en lisant l'ouverture au menu lui-même (`onOuvertureChange`). Le
      propriétaire n'en veut plus : le chevron dit « ceci ouvre » en
      toute circonstance, et rien d'autre. L'état `filtresOuverts` et
      l'abonnement qui le nourrissait sont retirés — il ne restait
      qu'eux pour s'en servir.
      ⚠️ LES CHEVRONS DES EN-TÊTES DE SECTION, EUX, PIVOTENT TOUJOURS
      (nº 572-574) : c'est un autre mécanisme, dans un autre fichier
      (`MenuDeroulant`, `enTeteSection`), et il n'est pas touché. */
  const motDuVaEtVient = (label: string, cle: MenuSelection) => {
    if (choix.menu !== cle) return label;
    const compte = cle === MENU_FAVORIS ? comptes.favoris : comptes.suivis;
    return (
      <span className="flex items-center gap-1.5">
        {label}
        {/*  §3 (nº 462) — LE NOMBRE : graisse normale et GRIS des
             textes secondaires (`text-sombre-texte-doux`, le jeton de
             toujours) — son propre élément, une seule classe de
             couleur, le mot et le chevron ne changent pas. */}
        {compte !== null && (
          <span className="font-normal text-sombre-texte-doux">{compte}</span>
        )}
        {/*  §2 (nº 582) — LE CHEVRON, IMMOBILE. L'enveloppe reste :
             c'est elle qui porte la couleur, donc une seule classe de
             couleur sur la ligne — mais elle ne tourne plus, et la
             transition qui l'accompagnait est partie avec la rotation
             (une transition sans rien à animer ne dit rien). */}
        <span aria-hidden="true" className="shrink-0 text-sombre-texte-doux">
          <IconeChevronBas taille={16} />
        </span>
      </span>
    );
  };

  /*  §2 (nº 461) — LE BADGE (SelecteurCapsule) EST PARTI, code
      compris : le va-et-vient souligné le remplace aux deux
      appareils — et l'encadré-capsule (EncadreDeuxChamps) avec lui.
      « Ma sélection » ne consomme plus ni l'un ni l'autre ; les deux
      écritures restent vivantes ailleurs (la fiche, le moteur). */

  /**
   * §3 — LE CHAMP DU FILTRE. Il porte le filtre DE CE QUE LE BADGE A
   * CHOISI : sur « Favoris » il filtre les favoris, sur « Portfolios »
   * les suivis — les deux listes d'entrées sont calculées depuis les
   * données (nº 247-§3), avec les deux portes du menu « Explorer » et
   * les familles en sous-porte (le drapeau `repliable`, sans lequel
   * aucune porte n'existe).
   *
   * IL N'EST JAMAIS VIDE : à l'ouverture il dit l'état en cours par le
   * mot de la porte (« Toutes les réalisations ») ; filtré, il dit le
   * couple (« Réalisations · Abstrait »). Les deux libellés viennent
   * des entrées elles-mêmes et de `libelleStyle` — aucun mot n'est
   * écrit ici.
   *
   * PAS DE LOUPE DEDANS : sur ce site la loupe veut dire
   * « rechercher », et c'est elle qui ouvre la page de recherche. Ici
   * c'est un filtre — il porte le chevron, comme le champ de localité.
   *
   * OÙ IL S'OUVRE : en PANNEAU sous le champ sur le web, en FEUILLE
   * par le bas au doigt (`feuilleMobile` — le portail, la sœur du
   * voile, le verre des menus et la fermeture au clic dehors qui
   * connaît la feuille, nº 251 et nº 253).
   *
   * ⚠️ SANS AUCUNE ENTRÉE, PAS DE CHAMP : un menu vide ne se déplie
   * pas, et un champ qui n'ouvre rien ment. La moitié reste nue — le
   * badge, lui, reste la commande.
   */
  /*  §2 (nº 460, unifié nº 461) — L'UNIQUE INSTANCE DU MENU DES
      FILTRES : déclencheur fantôme (voir le rendu), ouverte par la
      COMMANDE du second appui. Au web elle rend le PANNEAU classique,
      au doigt la FEUILLE décollée — c'est le MenuDeroulant qui
      tranche, comme toujours. */
  const filtre = () => {
    if (entrees.length === 0) return <span />;
    const valeur = valeurDuMenu(choix, choix.menu);
    return (
      /*  §1 (nº 256) — LE CHAMP N'A PLUS DE FORME PROPRE : c'est
          l'encadré-capsule qui donne la boîte, le fond et le focus
          (`data-clair-barre` sur lui, la règle de globals.css). */
      <MenuDeroulant
        valeur={valeur}
        /*  ██ §1-§2 (nº 525) — RE-CHOISIR L'ENTRÉE ACTIVE L'ANNULE ██
             C'EST LE CHEMIN DE RETOUR VERS « TOUT », et il remplace
             l'entrée neutre que les deux menus viennent de perdre
             (« Tous les favoris », « Tous les portfolios »). Sans lui,
             un filtre posé n'aurait plus eu de sortie : rien d'autre
             dans ces menus n'écrit la valeur vide.
             LE GESTE EST CELUI DU SITE, pas un neuf : c'est la règle de
             désélection du moteur (nº 148) — on rappuie sur ce qu'on a
             choisi, et le choix se défait.
             ⚠️ LA VALEUR VIDE EST DÉJÀ CE QUI ANNULE : `poserSelection`
             efface le paramètre d'adresse quand on la lui donne. On ne
             lui apprend rien, on l'appelle. */
        surChangement={(suivante) =>
          poserSelection(choix.menu, suivante === valeur ? "" : suivante)
        }
        options={entrees}
        ariaLabel="Filtrer"
        placeholder={libelleDuFiltre(entrees, choix, etroit)}
        libelleValeur={libelleDuFiltre(entrees, choix, etroit)}
        /*  ██ §3 (nº 578) — PLUS DE GRAND TITRE SUR CES FEUILLES ██
             Elles portaient « Filtre de photos » / « Filtre de
             portfolios » (nº 301) et l'icône de réglages (nº 262) : le
             propriétaire les a fait retirer. On ne passe donc plus ni
             `titreFeuille` ni `iconeTitreFeuille`, et la feuille
             n'écrit rien — c'est sa règle depuis cette passe, pas un
             repli caché.
             ⚠️ LE TRAIT DE PRÉHENSION RESTE, avec son air : la bande
             que le pouce attrape garde ses 44 px, et les 24 px qui
             séparaient le trait du titre deviennent l'air au-dessus de
             la première entrée.
             ⚠️ LA FEUILLE DE `ChampMetier` (le produit artisans) GARDE
             LE SIEN : elle passe toujours « Quel artisan ? ». */
        /*  §3 (nº 262) — SUR SMARTPHONE, LE CHAMP NE DIT PLUS LE
            STYLE : le mot « Filtrer », en blanc et en gras — la graisse
            et la taille du titre « Recherche » de la page du moteur
            (PageRechercheMobile, text-[20px] font-bold text-white) —,
            et à sa gauche L'ICÔNE DE FILTRE DU MOTEUR (IconeReglages,
            la même écriture que son bouton rond du web — jamais un
            second dessin), en gris. La flèche part avec le libellé
            (MenuDeroulant). L'état n'est pas perdu : le titre de la
            page, juste dessous, dit déjà « Mes suivis · Anime &
            Manga ». Sur web et iPad, rien ne change : libellé et
            chevron. */
        champMobile={
          <>
            <IconeReglages taille={20} classe="shrink-0 text-sombre-texte-doux" />
            {/*  §1 (nº 264) — LA TAILLE DU MOT DU CHAMP, PAS D'UN
                 TITRE : les 20 px de la nº 262 (empruntés au titre de
                 la page du moteur) étaient disproportionnés dans un
                 champ. RELEVÉ sur le champ de recherche de l'accueil,
                 vivant : 16 px — c'est `text-base`, le jeton même que
                 ce champ passe en `taillePolice` : ils ne peuvent pas
                 diverger. Blanc et gras, inchangés. */}
            <span className="text-base font-bold text-white">Filtrer</span>
          </>
        }
        //  §5 (nº 258) — LA FLÈCHE PREND L'AIR DES MOTS DU BADGE
        //  (20 px, le `px-5` de l'écriture des fiches — aucune valeur
        //  neuve) : à 14 px du bord elle touchait presque la courbe de
        //  la capsule. Le plancher demandé est 12 px.
        positionFleche="right 1.25rem center"
        /*  §2 (nº 461) — LE BOUTON DÉCLENCHEUR N'EST PLUS QU'UNE
            ANCRE : haut de zéro, dans une boîte invisible — le
            va-et-vient est le vrai déclencheur (la commande). */
        hauteur="h-0 min-h-0"
        taillePolice="text-base"
        sansBordure
        sombre
        repliable
        feuilleMobile
        //  §2 (nº 290) — le trait rose sous « Cultures du monde », sur
        //  les DEUX menus de cette page (les suivis et les favoris :
        //  ils passent tous deux par ici).
        //  §4 (nº 525) — ET SUR LES DEUX APPAREILS : la feuille du
        //  doigt pose le même trait que le panneau du web depuis
        //  cette passe. Rien à passer de plus — c'est ce drapeau-ci
        //  qui commande les deux, à l'identique.
        familleSoulignee
        //  §2 (nº 293) — la page s'assombrit derrière ce menu, en WEB :
        //  au doigt cette page ouvre sa feuille, et le crochet s'écarte.
        avecVoile
        //  §2 (nº 460/461) — le second appui du va-et-vient commande
        //  l'ouverture ; la feuille du doigt reste décollée des bords.
        commandeOuverture={commandeFiltres}
        feuilleDecollee
        //  §2 (nº 462) — le panneau du web prend LA LARGEUR DE
        //  L'ANCRE (l'onglet actif), jamais plus.
        panneauCaleSurAncre
        /*  §1 (nº 575) — LES EN-TÊTES SORTENT DE LA LISTE ET RESTENT EN
             HAUT, comme au menu des styles du moteur depuis la nº 572 :
             « Réalisations » / « Flash » sur les favoris, « Style » /
             « Profil » sur les portfolios. Le bloc emporte avec lui tout
             ce qui a été réglé aux nº 572-574 — son fond `carte`, ses
             chevrons qui pivotent, son air égal en haut et en bas, et le
             trait qui ne paraît qu'une section ouverte.
             ⚠️ UN SEUL DRAPEAU, AUCUNE MÉCANIQUE NEUVE : celui de la
             nº 571. Il ne fallait que le passer.
             ⚠️ ET IL NE FAIT RIEN QUAND LE VISITEUR N'A QU'UNE SECTION :
             le menu vérifie lui-même qu'il a de vraies portes (voir
             `blocEntetes`). Qui n'a que des réalisations en favori garde
             donc son menu d'aujourd'hui, entrées en clair et sans bloc.
             ⚠️ LE DOIGT N'EST PAS CONCERNÉ : là-bas ces menus sont des
             feuilles qui montent du bas (`feuilleMobile`), et le bloc
             n'existe que dans le panneau classique. */
        entetesCollants
        /*  §1 (nº 576) — LA PAGE NE DÉFILE PLUS DERRIÈRE CE MENU. Ces
             deux menus posent un voile (`avecVoile`, juste au-dessus) :
             la page s'assombrit et continuait pourtant de défiler
             dessous. C'est le réglage de la nº 573, celui du menu des
             styles du moteur, qu'il suffisait de passer ici.
             ⚠️ LE DOIGT N'EST PAS ATTEINT : le menu ne pose ce verrou
             que lorsque c'est le PANNEAU CLASSIQUE qu'on voit ; sous
             768 px c'est la feuille qui monte du bas, et elle a son
             propre gel depuis la nº 259-§3. */
        verrouilleLaPage
      />
    );
  };

  return (
    /*  §1 — UNE SEULE LIGNE, AUX DEUX LARGEURS : l'encadré prend toute
        la place disponible, et l'icône de mise en page se pose à sa
        droite (§4). Le centrage, la largeur et le repli restent ceux
        de la barre (EnTeteTatouage), avec ses réglages de juillet. */
    /*  §2 (nº 259) — LE RABATTEMENT N'EST PLUS ÉCRIT ICI. Ce bloc
        portait son propre pliage (les jetons de la rangée du moteur,
        branchés sur `replie`) tandis que l'enveloppe de la barre, elle,
        restait dépliée : il restait donc les 12 px de son air
        (`max-lg:pt-3`), et la barre de « Ma sélection » descendait
        d'autant plus bas que celle du moteur. C'est désormais
        L'ENVELOPPE DE LA BARRE qui se replie, pour les deux rangées —
        une seule mécanique, une seule réserve, et rien à tenir
        d'accord. */
    <div className="w-full">
          {/*  §1 (nº 256) — L'ENCADRÉ UNIQUE, devenu capsule : le badge
               puis le champ, dans LE MÊME `EncadreDeuxChamps` que le
               moteur, avec son drapeau `porteBadge` (la capsule, l'air
               du badge — voir EncadreBarre). L'écart avec l'icône
               (`gap-2.5`) est celui de la rangée du moteur. */}
          {/*  §1/§2 (nº 258) — L'ENCADRÉ PASSE À LA HAUTEUR DES CERCLES
               (46 px, relevée sur les ronds du moteur — jamais choisie).
               Sur le web, LA BARRE NE CHANGE PAS : la rangée garde la
               zone de 52 px d'hier (`min-h-[52px]`) et y centre
               l'encadré. Au doigt, l'espace libéré est RETIRÉ de la
               barre (`mobile:min-h-0`) : la réserve suit
               (64 + 12 + 46 = 122, voir EnTeteTatouage). */}
          {/*  ██ §2 (nº 461) — LE VA-ET-VIENT, AUX DEUX APPAREILS ██
               « Favoris | Portfolios », les onglets soulignés de la
               nº 447 — posés au doigt à la nº 460, portés AU WEB à
               celle-ci : l'encadré-capsule (badge « Favoris /
               Portfolios » + champ « Filtrer ») est REMPLACÉ.
               §6 (nº 525) — le second mot est « Portfolios » aux deux
               appareils : le « Suivis » de la nº 460 est annulé, le
               reste du va-et-vient est intact. Même objet partout :
               côté choisi = mot + nombre filtré + chevron ; l'autre =
               le mot seul ; premier clic = bascule, second clic sur le
               côté choisi = LES FILTRES (la commande) — au web le
               PANNEAU CLASSIQUE ancré sous la rangée, au doigt la
               feuille du bas décollée (nº 460, intacte).
               `min-h-[43px]` + la ligne de 3 px = 46 : la hauteur de
               l'encadré remplacé — la rangée web garde ses 52
               (centrage), la réserve du doigt (122) ne bouge pas.
               §1 (nº 461) — AU DOIGT SEULEMENT, la ligne grise va
               BORD À BORD : le débord négatif (`classeLigne`) rend
               les 16 px (24 dès 640) de marge de la barre — posé sur
               la ligne, jamais sur un conteneur ; les mots et le
               trait rose ne bougent pas, et le débord meurt PILE au
               bord de l'écran : aucun défilement horizontal. */}
          <div className="flex min-h-[52px] flex-col justify-center mobile:block mobile:min-h-0">
            <OngletsLigne
              options={[
                {
                  cle: MENU_FAVORIS,
                  label: motDuVaEtVient("Favoris", MENU_FAVORIS),
                },
                {
                  cle: MENU_SUIVIS,
                  label: motDuVaEtVient("Portfolios", MENU_SUIVIS),
                },
              ]}
              cleActive={choix.menu}
              surChoix={(cle) => {
                if (cle === choix.menu) {
                  setCommandeFiltres((tour) => tour + 1);
                  return;
                }
                poserSelection(cle as MenuSelection, "");
              }}
              ariaLabel="Favoris ou suivis"
              classeOnglet="px-1 min-h-[43px]"
              /*  ██ §2 (nº 515) — LE MOT MONTE D'UN CRAN, AU WEB SEUL ██
                   Le propriétaire trouvait le va-et-vient trop
                   petit sur l'ordinateur : 15 px, la valeur que les
                   huit appelants de ce composant partageaient en dur.
                   Elle passe à 17 ICI ET NULLE PART AILLEURS — le
                   composant a désormais un réglage (`taillePolice`,
                   voir sa note), et les sept autres n'en passent
                   aucun : « Réalisation | Flash » du moteur (nº 447),
                   le va-et-vient d'une fiche, le formulaire,
                   l'authentification et le démarchage gardent leurs
                   15 px, par construction.
                   ⚠️ LE DOIGT NE BOUGE PAS, et c'est le sens de la
                   variante : la valeur de base reste 15, le cran de
                   plus ne s'ouvre qu'à partir de 1024 px. Le mobile
                   était bien réglé, il le reste.
                   ⚠️ CE QUI SUIT LE MOT : le NOMBRE (« Favoris 10 »)
                   n'a pas de taille propre — il hérite de celle-ci et
                   monte donc du même cran, en gardant sa graisse
                   normale et son gris (nº 462). Le CHEVRON est une
                   icône de 16 px : il ne change pas.
                   ⚠️ LA HAUTEUR DE LA RANGÉE NE BOUGE PAS : ce sont
                   `min-h-[43px]` (l'onglet) et `min-h-[52px]` (la
                   zone, nº 258) qui commandent, et la hauteur de ligne
                   de 17 px leur reste très inférieure. */
              taillePolice="text-[15px] lg:text-[17px]"
              classeLigne="mobile:-inset-x-4 sm:mobile:-inset-x-6"
            />
          </div>
          {/*  §2 (nº 461, resserré nº 462) — LE MENU COMMANDÉ,
               DÉCLENCHEUR FANTÔME CALÉ SUR L'ONGLET ACTIF.
               La boîte est `invisible` et haute de zéro — RIEN à
               l'écran — mais elle SE MESURE : le panneau du web (un
               portail ancré par `usePlacementMenu` sur le bouton)
               s'ouvre à sa position. §2 (nº 462) : elle ne fait plus
               la rangée entière mais LA MOITIÉ (`w-1/2` — la largeur
               exacte du soulignement rose d'un onglet), poussée sous
               l'onglet CHOISI (`ml-[50%]` sur « Suivis ») : le
               déroulant s'aligne à gauche de l'onglet actif et n'en
               dépasse pas la largeur (`panneauCaleSurAncre` — la
               branche `width` de stylePanneau, plus de max-content).
               Changer d'onglet déplace la boîte : le panneau se
               recale (le placement suit l'ancre en continu). Au
               doigt, la feuille vit dans son portail : la boîte n'y
               joue aucun rôle. */}
          <div
            aria-hidden
            className={`invisible h-0 w-1/2${surLesFavoris ? "" : " ml-[50%]"}`}
          >
            {filtre()}
          </div>
      {/*  §3 (nº 258) — LA LIGNE ÉTROITE A DISPARU, entièrement. Une
           barre qui se replie ne laisse rien derrière elle : il ne
           reste que le logo et les trois icônes — le titre juste en
           dessous dit déjà où l'on est, et la loupe reste ce qu'elle
           est (elle ouvre la recherche, elle ne redéploie rien). Le
           retour se fait en remontant la page, ce que la mécanique de
           la barre fait déjà (les seuils de juillet). La rangée se
           rabat par L'ENVELOPPE DE LA BARRE (nº 259-§2) — les jetons
           mêmes de la rangée du moteur (300 ms, ease-out), aucune
           seconde écriture. La réserve repasse de trois hauteurs à deux
           (122 / 64, comme le moteur — voir EnTeteTatouage). */}
    </div>
  );
}

/**
 * CE QUE LE CHOIX COURANT S'APPELLE — L'ÉCRITURE UNIQUE (nº 257-§1)
 * ------------------------------------------------------------------
 * Lue ICI par le champ de la barre, et par le SOUS-TITRE de la page
 * (PageFavoris) : les deux disaient la même chose, il ne fallait pas
 * qu'ils le disent deux fois — le menu des suivis ne connaît plus de
 * catégorie, et `libelleExplorer(nature, style)` y rendait « » pour
 * un style pourtant choisi.
 *  · MES FAVORIS → l'écriture du moteur refermé : « Réalisations ·
 *    Abstrait », « Toutes les réalisations » (`libelleExplorer`) ;
 *  · MES SUIVIS  → le style seul (`libelleStyle`, le mot du catalogue).
 * Vide quand rien n'est choisi : c'est à l'appelant de dire s'il veut
 * un état d'ouverture (le champ, §3) ou rien du tout (le sous-titre).
 */
export function libelleDuChoix(choix: ChoixSelection): string {
  if (choix.menu === MENU_SUIVIS) {
    //  §2 (nº 316) — LE PROFIL PARLE À LA PLACE DU STYLE quand c'est
    //  lui qui est choisi : les deux occupent la même valeur d'adresse,
    //  ils occupent donc la même ligne de titre. Le mot vient de
    //  `libelleDuProfil` — celui du menu, jamais un second.
    if (choix.profil) return libelleDuProfil(choix.profil);
    return choix.style ? libelleStyle(choix.style) : "";
  }
  return libelleExplorer(choix.nature, choix.style);
}

/**
 * CE QUE LE CHAMP AFFICHE — L'ÉTAT EN COURS, JAMAIS RIEN (§3)
 * ------------------------------------------------------------------
 * SUR « MES FAVORIS », SUR LE WEB :
 *  · un style choisi   → « Réalisations · Abstrait » ;
 *  · une porte choisie → « Toutes les réalisations » ;
 *  · rien de choisi    → le mot de la PREMIÈRE PORTE présente — c'est
 *    l'état d'ouverture, et il se lit.
 * AU DOIGT (§6, nº 256) : LA CATÉGORIE SEULE — « Réalisations » ou
 * « Flashs », avec le chevron qui dit que le champ s'ouvre. Le style
 * complet vit dans le TITRE de la page, juste dessous : le répéter
 * dans un champ étroit le tronquait.
 * SUR « MES SUIVIS » (nº 257-§1) : le style, ou « Tous les portfolios »
 * à l'ouverture (nº 318) — il n'y a plus de catégorie à dire.
 * §3 (nº 321) — ET SUR « MES FAVORIS », L'ÉTAT D'OUVERTURE DIT « Tous
 * les favoris », aux DEUX largeurs : le mot de l'entrée neutre que ce
 * menu vient de recevoir, celui qu'elle porte dans la liste. Les deux
 * onglets se répondent enfin — chacun nomme ce qu'il contient.
 * ⚠️ AUCUN MOT N'EST ÉCRIT ICI : `CATEGORIES_EXPLORER` porte les
 * titres et les « Tous les… », `LIBELLE_TOUS_LES_FAVORIS` et
 * `LIBELLE_TOUS_LES_PORTFOLIOS` les deux entrées neutres,
 * `libelleExplorer` l'écriture refermée.
 */
function libelleDuFiltre(
  entrees: EntreeFiltre[],
  choix: ChoixSelection,
  etroit: boolean
): string {
  //  §1 (nº 257) — LES SUIVIS N'ONT PLUS DE PORTE : le style, ou
  //  l'état d'ouverture.
  //  §1 (nº 260) — … ET AU DOIGT, L'ÉTAT D'OUVERTURE SE DIT « Style » :
  //  « Tous les styles » ne tenait pas dans la largeur du champ. Un
  //  style choisi, lui, s'écrit en entier — c'est SEULEMENT l'état
  //  d'ouverture qui se raccourcit. Sur le web, la place y est : le
  //  mot ne change pas.
  if (choix.menu === MENU_SUIVIS) {
    //  §2 (nº 316) — UN PROFIL CHOISI S'ÉCRIT EN ENTIER, aux deux
    //  largeurs : « Artiste », « Studio », « Salon », « Tous les
    //  profils ». C'est un choix, et un choix se lit.
    //  §2 (nº 321) — LES EXEMPLES D'AVANT (« À domicile ») ÉTAIENT DES
    //  MODES D'EXERCICE : ils ont quitté ce menu avec les sous-titres.
    if (choix.profil) return libelleDuProfil(choix.profil);
    /*  §2-c (nº 318) — RIEN DE CHOISI : « Tous les portfolios », AUX
        DEUX LARGEURS — le mot de l'entrée neutre, celui qu'elle porte
        dans le menu. Il remplace « Tous les styles » (faux depuis le
        filtre par profil) ET le raccourci « Style » de la nº 260-§1,
        qui est ANNULÉ pour ce menu : il abrégeait un mot devenu faux.
        (Au vrai doigt, le champ dit « Filtrer » — nº 262 — : cette
        écriture ne sert qu'aux largeurs intermédiaires.) */
    if (!choix.style) return LIBELLE_TOUS_LES_PORTFOLIOS;
    return libelleStyle(choix.style);
  }
  /*  §3 (nº 321) — RIEN DE CHOISI : « Tous les favoris », AUX DEUX
      LARGEURS. C'est le mot de l'entrée neutre que ce menu vient de
      recevoir — la symétrie exacte de « Tous les portfolios » sur
      l'autre onglet (nº 318). Il remplace « Tous les styles », qui
      était l'écriture d'un objet aujourd'hui disparu du site, ET le
      raccourci au doigt qui affichait la seule catégorie : le champ
      annonce désormais l'ABSENCE de filtre, pas une porte qu'on n'a
      pas choisie. Le menu, lui, garde ses deux portes. */
  if (!choix.nature && !choix.style) return LIBELLE_TOUS_LES_FAVORIS;
  //  LA PORTE EN COURS : celle du choix, ou la PREMIÈRE PRÉSENTE quand
  //  rien n'est filtré — c'est ce que dit l'état d'ouverture.
  const nature = choix.nature || (entrees[0]?.value.split(":")[0] ?? "");
  if (!nature) return "";
  const titre = CATEGORIES_EXPLORER.find((c) => c.nature === nature)?.titre;
  //  §6 (nº 256) — au doigt, la catégorie et rien d'autre.
  if (etroit) return titre ?? "";
  return libelleDuChoix({ ...choix, nature });
}
