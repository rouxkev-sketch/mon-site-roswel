"use client";

import { IconeCroix } from "@/components/Icones";
import {
  AIR_BADGE_RECHERCHE,
  COULEURS_SOMBRE,
  ECRITURE_BADGE_RECHERCHE,
  ROBE_BADGE_CONTOUR,
} from "@/config/tatouage";

/**
 * ██ LA RANGÉE DES BADGES — SOUS LE COMPTE, PUIS À SA PLACE (nº 846,
 * REFAITE nº 847, RÉGLÉE nº 848) ██
 * ==================================================================
 * CE QUE LA nº 846 A POSÉ : sur une page de résultats, le titre devenait
 * LE COMPTE (« 15 portfolios ») et, sous lui, des badges disaient ce qui
 * est filtré — le style choisi, la localité — avec une croix pour le
 * retirer.
 * CE QUE LA nº 847 CHANGE, APRÈS QUE LE PROPRIÉTAIRE A VU :
 *  · §2 — LE COMPTE N'EST PLUS UN TITRE, C'EST LE PREMIER BADGE. Il
 *    ouvre la rangée, à gauche des autres, et il n'a PAS DE CROIX : « ce
 *    n'est pas une action ». Sa robe est celle du badge du type
 *    (`ROBE_BADGE_CONTOUR`) — un contour fin, rien dedans ;
 *  · §3 — TOUTE LA RANGÉE MONTE D'UN CRAN : le corps passe de 14 à
 *    15 px, la croix de 14 à 16, sa boîte de 24 à 26. Le demi-gras était
 *    déjà là (nº 846) et ne bouge pas ;
 *  · §4 — AU DOIGT, LA RANGÉE GLISSE au lieu de se replier ;
 *  · §5 — LES BADGES À CROIX PRENNENT UN FOND PLUS SOMBRE.
 * CE QUE LA nº 848 CHANGE, APRÈS QU'IL A REVU CETTE RANGÉE-LÀ :
 *  · §1 — LE FOND DES BADGES À CROIX PREND LE BARREAU DU MILIEU, celui
 *    qui manquait à la charte et qu'elle déclare désormais ;
 *  · §2 / §3b — L'AIR INTÉRIEUR EST ÉGAL SUR LES QUATRE CÔTÉS, aux deux
 *    appareils, et la hauteur des badges grandit avec lui ;
 *  · §3c — AU WEB, LE TEXTE ET LA CROIX MONTENT ENCORE D'UN CRAN ;
 *  · §5 — LA GRAISSE DU TEXTE DESCEND, de demi-gras à moyenne.
 * (L'air AU-DESSUS de la rangée, §3a, ne vit pas ici mais dans le bloc
 * de tête qui la porte — `LigneResultats`.)
 *
 * ██ LES DEUX ROBES, ET CE QU'ELLES DISENT ██
 * ------------------------------------------------------------------
 * LE COMPTE : un contour, rien dedans — il RENSEIGNE. Le fond de la page
 * transparaît, c'est le badge le plus discret de la rangée, et c'est
 * juste : personne ne peut agir sur lui.
 * LES FILTRES : un aplat PLEIN. La nº 846 le posait sur le cran de
 * l'interface (#262C34), la nº 847 sur celui des cartes (#1A1F26) ; le
 * propriétaire a vu les deux et tranche à la nº 848 : le premier est trop
 * clair, le second trop sombre. C'est donc LE BARREAU DU MILIEU, déclaré
 * dans la charte pour ce besoin (`carteClair`, #20262D — config/tatouage,
 * `COULEURS_SOMBRE`, où le calcul est écrit). Aucune valeur n'est
 * fabriquée au point d'usage : l'échelle en compte un de plus, et tout le
 * site peut s'en servir.
 * ⚠️ ET DEPUIS LA nº 849, CETTE COULEUR EST POSÉE DANS LE MARQUAGE, pas
 * par une classe utilitaire : une classe neuve n'existe que dans une
 * feuille neuve, et le propriétaire a vu ces badges SANS AUCUN FOND en
 * ligne, peints par une feuille plus ancienne. Le pourquoi complet, la
 * reproduction et la mesure sont écrits au point d'usage, plus bas.
 * ⚠️ POURQUOI LE PLEIN EST AUX ACTIONS ET LE CONTOUR À L'INFORMATION :
 * c'est la règle que le site s'est donnée à la nº 844 en vidant le badge
 * du type (« le contour seul sert à RENSEIGNER, pas à signaler un
 * état »). La rangée la suit à la lettre.
 *
 * ██ LA FORME, ET POURQUOI CE N'EST PAS UNE CAPSULE ██
 * La consigne de la nº 846 était explicite : « rectangle, coins
 * légèrement arrondis — PAS la capsule pleine ». Le site a cette forme
 * et un seul rayon pour elle : celui des badges (`rounded-lg`, la charte
 * nº 449) — le même que le badge du type. Les capsules à bords ronds
 * restent aux ISSUES d'une recherche vide (AucunResultat) : deux objets
 * différents, deux formes différentes, et l'œil les distingue sans lire.
 *
 * ██ DEUX ÉLÉMENTS, PAS UN ██
 * Sur un badge de filtre, le libellé n'est pas cliquable, la CROIX
 * l'est — et elle seule. Un badge entièrement cliquable serait un bouton
 * dont le sens dépend de l'endroit touché ; ici, ce qu'on touche est ce
 * qui agit. La croix porte son nom accessible en toutes lettres
 * (« Remove … »), parce qu'un lecteur d'écran ne voit pas le texte à sa
 * gauche comme une étiquette.
 */

/**
 * ██ §3c-§5 (nº 848) — LA TYPOGRAPHIE DE LA RANGÉE ██
 * ------------------------------------------------------------------
 * Écrite une fois, lue par le compte comme par les filtres. Ce qui
 * change à la nº 848 :
 *  · LE CORPS MONTE ENCORE, AU WEB SEULEMENT (§3c) : 15 → 16 px — « ils
 *    sont trop petits à l'échelle du web ». Le doigt garde ses 15,
 *    posés à la nº 847 ; sa rangée n'a pas la même largeur d'écran ;
 *  · LA GRAISSE DESCEND (§5) : 600 → 500 — « le demi-gras paraît trop
 *    lourd ». `font-medium`, sur les deux appareils.
 *
 * ██ ET L'INTERLIGNE EST POSÉ, CE QUI N'ÉTAIT PAS LE CAS ██
 * C'est la pièce qui rend l'air ÉGAL mesurable (§2) : sans elle, la
 * boîte de ligne vaut « normal » — 1,5 fois le corps, soit 22,5 px au
 * doigt : un demi-pixel que rien ne rattrape, et une hauteur de badge
 * qui ne tombe jamais juste. Avec 22 (doigt) et 24 (web), la boîte du
 * texte est un NOMBRE ENTIER, la croix prend exactement la même, et les
 * quatre airs du badge valent le même nombre.
 * ⚠️ DEUX VARIANTES QUI S'EXCLUENT, AUCUNE CLASSE DE BASE (piège
 * nº 389) : `mobile:` est le vrai appareil (règle nº 60), `not-mobile:`
 * son exact complément — rien à départager par l'ordre de la feuille.
 */
/**
 * ██ §1 (nº 850) — LA BOÎTE DE LIGNE DEVIENT LA BOÎTE DES CAPITALES ██
 * ------------------------------------------------------------------
 * LE PROPRIÉTAIRE, sur l'air de la nº 848 : « il a été mesuré jusqu'à la
 * BOÎTE DE LIGNE et non jusqu'aux LETTRES ». C'est exact, et c'est toute
 * l'erreur : une boîte de ligne de 22 px autour d'un texte de 15 px
 * contient déjà six pixels de vide en haut et six en bas — l'air de dix
 * pixels que la nº 848 ajoutait par-dessus faisait DIX-SEPT pixels à
 * l'œil, pour douze à gauche. D'où un badge très haut et l'air « beaucoup
 * trop grand en haut et en bas ».
 * LE REMÈDE : la boîte de ligne est ramenée à LA HAUTEUR DES CAPITALES,
 * mesurée à l'écran sur l'encre peinte (dix pixels au doigt pour un corps
 * de 15, douze au web pour un corps de 16). Le rembourrage EST alors
 * l'air visuel, à un pixel de contour près — on peut le lire dans le code
 * et le retrouver à l'écran, ce qui était impossible avant.
 * ⚠️ CE N'EST PAS UN RÉGLAGE APPROXIMATIF : les deux valeurs sortent
 * d'une mesure de l'encre (banc 850), pas d'un rapport supposé entre le
 * corps et la capitale — chaque fonte a le sien.
 * ⚠️ LE DÉBORD DES JAMBAGES EST VOULU : « g », « y » et « p » descendent
 * sous la ligne de base, donc sous cette boîte, et vivent dans le
 * rembourrage du bas. C'est la règle donnée — l'air se mesure « du haut
 * de capitale à la ligne de base » —, et c'est ce que fait tout badge
 * bien composé : sinon un mot avec jambage serait plus haut qu'un autre.
 */
/**
 * ██ nº 851 — AU DOIGT, LA RANGÉE PREND L'ÉCRITURE DU BADGE DU TYPE ██
 * ------------------------------------------------------------------
 * DÉCISION DU PROPRIÉTAIRE : sur smartphone, ces badges prennent
 * EXACTEMENT les mesures du badge TYPE des cartes du fil (celui qui est
 * à droite de l'avatar, `BadgeTypeDeFiche`) — même hauteur, même air
 * intérieur, même typographie, même corps. Le web ne bouge pas.
 * CE QUE CELA CHANGE ICI, ET RIEN D'AUTRE : le corps passe de 15 à 14,
 * la graisse de moyenne à demi-grasse, et LA BOÎTE DE LIGNE N'EST PLUS
 * FORCÉE — le badge du type n'en impose aucune, sa ligne vaut donc la
 * hauteur naturelle de la fonte (21 px pour un corps de 14, mesuré).
 * ⚠️ LA GRAISSE REVIENT DONC EN ARRIÈRE AU DOIGT SEULEMENT : la nº 848
 * l'avait descendue à 500 sur les deux appareils (« le demi-gras paraît
 * trop lourd »). Le propriétaire demande aujourd'hui la typographie du
 * badge du type, qui est demi-grasse — c'est écrit, et c'est appliqué à
 * la lettre. LE WEB GARDE SES 500 : il n'est pas concerné.
 * ⚠️ DEUX VARIANTES QUI S'EXCLUENT, jamais deux classes en concurrence
 * (piège nº 389) : `mobile:` est l'APPAREIL (règle nº 60), `not-mobile:`
 * son exact complément.
 */
/**
 * ██ §2-§3 (nº 856) — CES BADGES ONT LEUR PROPRE ÉCRITURE, DANS LA
 * CHARTE ██
 * ------------------------------------------------------------------
 * OÙ ELLE VIT : `AIR_BADGE_RECHERCHE` et `ECRITURE_BADGE_RECHERCHE`,
 * dans config/tatouage, où le calcul des proportions est écrit en
 * entier. Ce fichier ne recopie plus aucune mesure (piège nº 378).
 * CE QU'ELLE DIT, EN DEUX MOTS :
 *  · AU DOIGT — exactement le badge du type, comme au bâti nº 854 :
 *    trente de haut, quatorze d'air, corps quatorze. La nº 855 les
 *    avait portés à quarante ; le propriétaire les remet (§2) ;
 *  · AU WEB — le corps monte d'un cran (14 → 15) et la boîte grandit
 *    EN PROPORTION, au rapport de l'état nº 853 : 32 de haut, 15
 *    d'air. Ce n'est pas de l'air ajouté, c'est la même proportion à
 *    un corps plus grand (§3).
 * ⚠️ ET ELLE NE SUIT PLUS CELLE DU BADGE DU TYPE : les deux familles
 * se séparent à cette passe, et le badge du type ne bouge pas — ni au
 * doigt ni au web. Le banc 851, qui les comparait mesure contre
 * mesure, ne compare donc plus que ce qui doit encore l'être.
 */

/**
 * ██ §3 (nº 850) — LA CROIX : SA CIBLE RESTE GRANDE, SON AIR EST CELUI
 * DU TEXTE ██
 * ------------------------------------------------------------------
 * DEUX CHOSES SE DISPUTAIENT CETTE BOÎTE, et la nº 848 en avait sacrifié
 * une :
 *  · C'EST UNE CIBLE À TOUCHER. Vingt-deux pixels au doigt, vingt-quatre
 *    au web : on ne descend pas en dessous, sous peine de rendre le
 *    retrait d'un filtre pénible à viser ;
 *  · C'EST AUSSI CE QUI FIXE LA HAUTEUR DE LA RANGÉE, si on la laisse
 *    faire — et 22 px de croix dans un badge dont le texte n'en mesure
 *    que 10 rouvrirait exactement le défaut qu'on corrige.
 * LES DEUX TIENNENT PAR UNE MARGE NÉGATIVE : la croix garde sa boîte
 * pleine, mais n'en présente que la hauteur du texte à la mise en page
 * (`-my-[6px]` — six pixels rendus en haut et six en bas, soit 22 − 12 au
 * doigt et 24 − 12 au web ; le même nombre des deux côtés du site, et
 * c'est une coïncidence heureuse, pas un calcul commun). Elle déborde
 * alors dans le rembourrage du badge, qui l'accueille sans grandir.
 *
 * ██ ET SON AIR À DROITE EST CELUI DU TEXTE À GAUCHE ██
 * LA CONSIGNE : « la croix garde le même air à sa droite que le texte à
 * sa gauche ». Or ce qu'on VOIT d'une croix n'est pas sa boîte : le
 * dessin laisse du vide autour de lui, MESURÉ à sept pixels entre le
 * bord droit de la boîte et la dernière encre du trait (trois de boîte
 * autour du dessin, quatre dans le dessin lui-même). Sans rien faire,
 * l'air à droite valait donc 18 quand celui de gauche valait 12.
 * `-mr-[6px]` rend ces six pixels-là : la boîte avance de six vers le
 * bord, l'encre de la croix se retrouve à la même distance que la
 * première lettre, et la CIBLE, elle, n'a pas rétréci d'un pixel.
 * ⚠️ C'EST UNE CORRECTION OPTIQUE, et elle se règle ICI plutôt que sur
 * le rembourrage du badge : le badge du COMPTE n'a pas de croix, et son
 * air à droite doit rester celui de sa dernière lettre.
 * ⚠️ LE DESSIN NE CHANGE PAS (nº 848-§3c) : 16 px au doigt, 18 au web.
 * ⚠️ LA TAILLE DU GLYPHE EST UNE CLASSE, PAS UN ATTRIBUT, pour le web :
 * `taille` est un nombre, il ne connaît pas l'appareil. C'est l'écriture
 * du site pour ce cas précis (`DESSIN_GESTE_BARRE`, lib/reserve-barre).
 */
const CROIX_BADGE =
  "mobile:h-[22px] mobile:w-[22px] not-mobile:h-[24px] not-mobile:w-[24px] " +
  "-my-[6px] -mr-[6px]";

/** UN FILTRE AFFICHÉ : ce qu'il dit, et ce que sa croix retire. */
export type FiltreAffiche = {
  /** La clé sert au banc et à React — jamais au libellé. */
  cle: string;
  libelle: string;
  /** Le nom accessible de la croix : « Remove the style filter ». */
  etiquetteRetrait: string;
  surRetrait: () => void;
};

export function FiltresActifs({
  compte,
  filtres,
}: {
  /** §2 (nº 847) — « 15 portfolios ». C'est le TITRE DE LA PAGE, rendu
      en badge : il garde donc sa balise `h1` (voir plus bas). */
  compte: string;
  filtres: FiltreAffiche[];
}) {
  return (
    <div
      data-filtres-actifs=""
      /*  §3a (nº 848) — L'AIR AU-DESSUS N'EST PLUS ÉCRIT ICI ██
          La nº 846 lui donnait la marge du SOUS-TITRE qu'elle remplaçait
          (4 px au doigt, 6 au web — LigneResultats, nº 628) : l'écart
          qui séparait ce sous-titre du TITRE au-dessus de lui. Depuis la
          nº 847, il n'y a plus de titre — cette rangée est seule dans le
          bloc, et sa marge ne faisait plus qu'ALLONGER le rembourrage du
          bloc, à l'insu de qui lisait le rythme. C'est ce que le
          propriétaire voit au web (« trop grand, déséquilibré »).
          TOUT L'AIR AU-DESSUS EST DONC AU BLOC, en une seule
          déclaration : `RYTHME_TITRE_BADGES` (LigneResultats), qui pose
          24 px au web et 16 au doigt — le doigt ne bouge pas d'un pixel.

          ██ §4 (nº 847) — AU DOIGT, ELLE GLISSE ; AU WEB, ELLE SE REPLIE ██
          LE PROPRIÉTAIRE : « si la rangée dépasse la largeur, elle GLISSE
          horizontalement au doigt (défilement natif, sans barre visible),
          sans retour à la ligne ».
           · `mobile:flex-nowrap` + `mobile:overflow-x-auto` : le
             navigateur fait tout — l'inertie du doigt, les butées. La
             barre est masquée par l'écriture que le site emploie déjà
             pour ses pistes de photos (CarrouselPortfolio) ;
           · LE DÉBORD COMPENSÉ (le motif de la nº 381/462) : la rangée
             sort jusqu'aux bords de l'écran (`-mx-4`) et rend l'air par
             son rembourrage (`px-4`). Sans lui, le premier badge serait
             coupé PILE sur la marge dès qu'on glisse, et le dernier ne
             pourrait jamais atteindre le bord. Cette boîte n'a AUCUNE
             largeur explicite : la marge négative l'ÉLARGIT donc bien
             (la leçon de la nº 463, où un `w-full` l'en empêchait) ;
           · AU WEB, RIEN NE CHANGE : `not-mobile:flex-wrap`, la rangée
             passe à la ligne comme depuis la nº 846.
          ⚠️ DEUX VARIANTES QUI S'EXCLUENT, AUCUNE CLASSE DE BASE (piège
          nº 389) : `mobile:` est le VRAI appareil (règle nº 60),
          `not-mobile:` son exact complément — il n'y a aucun conflit à
          départager par l'ordre de la feuille.
          ⚠️ ET LE GLISSEMENT NE PEUT PAS DÉBORDER LA PAGE : le rognage
          s'arrête au bord de l'écran, jamais au-delà — aucun défilement
          horizontal du document. */
      className="flex items-center gap-2
                 mobile:flex-nowrap mobile:overflow-x-auto mobile:-mx-4
                 mobile:px-4 mobile:[scrollbar-width:none]
                 mobile:[&::-webkit-scrollbar]:hidden
                 not-mobile:flex-wrap"
    >
      {/*  ██ §2 (nº 847) — LE COMPTE, PREMIER BADGE ET TITRE DE LA PAGE ██
           IL RESTE UN `h1`, ET C'EST NÉCESSAIRE : c'est le titre de cette
           page — une page en a un, et un seul. Le propriétaire en change
           l'HABIT, pas la nature ; le rendre en `span` retirerait son
           titre à la page (lecteurs d'écran, plan du document, moteurs).
           ⚠️ IL N'A PAS DE CROIX, et c'est la consigne : « ce n'est pas
           une action ». Il ne porte donc ni bouton, ni état de survol —
           rien qui laisse croire qu'on peut le toucher. */}
      <h1
        data-badge-compte=""
        className={`${ROBE_BADGE_CONTOUR} ${AIR_BADGE_RECHERCHE} ${ECRITURE_BADGE_RECHERCHE}`}
      >
        {compte}
      </h1>
      {filtres.map((filtre) => (
        <span
          key={filtre.cle}
          data-filtre-actif={filtre.cle}
          /*  ██ §1 (nº 848) — LE FOND PREND LE BARREAU DU MILIEU ██
              La nº 846 les posait sur `bg-sombre-eleve` (#262C34,
              luminosité 43,3), la nº 847 sur `bg-sombre-carte` (#1A1F26,
              30,4) ; le propriétaire trouve l'un trop clair et l'autre
              trop sombre. Le barreau intermédiaire est DÉCLARÉ dans la
              palette (`carteClair`, #20262D, luminosité 37,23 — le milieu
              exact des deux, canal par canal) : le calcul et le pourquoi
              vivent avec la valeur, dans config/tatouage.
              §2 (nº 848) — L'AIR EST ÉGAL SUR LES QUATRE CÔTÉS
              (`AIR_BADGE_RECHERCHE`), et l'écart entre le texte et la croix est le
              cran d'en dessous (6 px) : c'est un écart INTÉRIEUR, il n'a
              pas à valoir l'air du contour.
              ⚠️ LE CONTOUR TRANSPARENT N'EST PAS UN ORNEMENT : le badge
              du compte porte un trait d'un pixel (sa robe partagée), qui
              entre dans sa hauteur. Sans le même anneau ici, ces
              badges-ci seraient de deux pixels plus courts que lui et la
              rangée serait bancale. Il ne se voit pas — l'aplat est peint
              sous lui (le rognage de fond va jusqu'au bord du contour) —
              et il ne change pas l'air intérieur, qui reste le
              rembourrage, égal sur les quatre côtés. */
          /*  ██ nº 849 — LE FOND EST ÉCRIT DANS LE MARQUAGE, ET C'EST LA
              CORRECTION DU BOGUE DE LA nº 848 ██
              --------------------------------------------------------
              CE QUE LE PROPRIÉTAIRE A VU EN LIGNE : ces badges SANS
              fond ni contour, le texte flottant sur la page. Le bâti
              livré, lui, était juste — la classe était bien produite et
              le pont bien écrit dans le HTML (les deux mesurés, banc
              849). CE QUI MANQUAIT ÉTAIT AILLEURS : une classe NEUVE
              n'existe que dans la feuille NEUVE. Quand la page a été
              peinte avec une feuille plus ancienne — un onglet ouvert
              avant la mise en ligne, un cache d'étape, une navigation
              douce dans un document déjà chargé — la classe du barreau
              n'y figurait pas, et un fond que la feuille ignore ne se
              peint pas du tout. Le contour, lui, est transparent par
              construction : d'où « ni fond ni contour ».
              REPRODUIT AU BANC, PUIS CORRIGÉ : le banc 849 sert le
              marquage de la nº 848 avec la feuille de la nº 847 et
              mesure le pixel réellement peint — transparent avant,
              #20262D après.
              LE REMÈDE : la couleur VOYAGE AVEC LE MARQUAGE. Un style en
              ligne ne dépend d'aucune feuille et d'aucune variable posée
              dans l'en-tête du document : il arrive avec le badge, ou il
              n'arrive pas du tout — et alors le badge non plus.
              ⚠️ CE N'EST PAS UNE SECONDE ÉCRITURE DE LA COULEUR : la
              valeur reste celle de la charte, lue au même endroit que
              tout le reste (`COULEURS_SOMBRE.carteClair`). Ce qui change
              est le CHEMIN qu'elle prend pour atteindre l'écran, pas sa
              source.
              ⚠️ ET CE N'EST PAS UN PROCÉDÉ INVENTÉ ICI : le site pose
              déjà ses fonds de cette façon là où une classe ne suffit
              pas à garantir le résultat (PageMessageSombre, MenuDeroulant
              — mêmes réglages, même écriture).
              ⚠️ UNE SEULE DÉCLARATION DE FOND SUR CET ÉLÉMENT (piège
              nº 389) : la classe utilitaire du barreau est PARTIE, elle
              n'est pas doublée. Le jeton reste dans la charte et son pont
              CSS reste posé — un autre porteur pourra s'en servir — mais
              ce badge-ci ne passe plus par eux.
              ⚠️ ET SON NOM NE S'ÉCRIT PLUS DANS AUCUNE NOTE (piège
              nº 472) : Tailwind lit les commentaires, et le nommer
              suffirait à faire produire une règle que plus personne
              n'emploie. Mesuré dans la feuille : la règle est bien
              partie. */
          style={{ backgroundColor: COULEURS_SOMBRE.carteClair }}
          className={`inline-flex shrink-0 items-center gap-1.5
                     whitespace-nowrap rounded-lg border border-transparent
                     ${AIR_BADGE_RECHERCHE} ${ECRITURE_BADGE_RECHERCHE}`}
        >
          {filtre.libelle}
          {/*  §2-§3c (nº 848) — LA CROIX : sa boîte vaut celle de la
               ligne de texte, son dessin monte d'un cran au web. Le
               pourquoi complet est écrit avec `CROIX_BADGE`, plus haut. */}
          <button
            type="button"
            data-retrait-filtre={filtre.cle}
            aria-label={filtre.etiquetteRetrait}
            onClick={filtre.surRetrait}
            className={`flex ${CROIX_BADGE} shrink-0 items-center
                       justify-center rounded-md text-sombre-texte-doux
                       transition-colors hover:text-sombre-texte
                       hover:bg-sombre-eleve active:bg-sombre-eleve
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire`}
          >
            <IconeCroix
              taille={16}
              classe="not-mobile:h-[18px] not-mobile:w-[18px]"
            />
          </button>
        </span>
      ))}
    </div>
  );
}
