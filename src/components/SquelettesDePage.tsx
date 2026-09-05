"use client";

import { useEffect, useLayoutEffect } from "react";
import { LogoYokofolio } from "@/components/LogoYokofolio";
import {
  CADRE_PHOTO_PORTFOLIO,
  HAUTEUR_BADGE_GRIS,
  HAUTEUR_BADGE_RECHERCHE_GRIS,
  LARGEUR_SITE,
} from "@/config/tatouage";
import {
  CLASSES_GRILLE_CARTES,
  COLONNE_UNIQUE_DU_FIL,
  GOUTTIERE_DU_FIL,
} from "@/components/GrilleTatoueurs";
//  §2 (nº 845) — les deux boîtes de la carte du fil, lues chez elle :
//  le squelette les épouse au pixel (voir CarteGriseDuFil).
import {
  RANGEE_EN_TETE_DE_FIL,
  RANGEE_PIED_DE_FIL,
} from "@/components/CarteFil";
import { RYTHME_TITRE_BADGES } from "@/components/LigneResultats";
import {
  CIBLE_GESTE_BARRE,
  RESERVE_LOGO,
  RESERVE_RANGEE,
} from "@/lib/reserve-barre";
//  §2 (nº 722) — la remontée armée par le geste se joue dès le montage
//  du squelette de segment : voir le grand bloc de lib/liste-neuve.
import { leSqueletteDeLaListeEstLa } from "@/lib/liste-neuve";
//  nº 819 — le squelette-mémoire de « Ma sélection » : cartes grises
//  seulement si ce compte en avait (lib/memoire-selection), posé avant
//  la peinture du squelette quand la navigation est douce.
import { poserMemoireSelection } from "@/lib/memoire-selection";
import { utilisateurConnu } from "@/lib/use-utilisateur";

/**
 * ██ §2 (nº 706, REFAIT nº 707) — LE SQUELETTE COLLE À LA VRAIE PAGE ██
 * ==================================================================
 * LE DÉFAUT DE LA nº 706, constaté par le propriétaire et MESURÉ à la
 * nº 707 (banc de silhouette : mêmes rectangles relevés pendant le
 * squelette et après l'arrivée) : le squelette ne correspondait pas à
 * la disposition réelle, et « ça sautait ». Les écarts, chiffrés :
 *
 *  · AU DOIGT, TOUT ÉTAIT 122 px TROP HAUT : la vraie barre est FIXE
 *    et la vraie page pose une RÉSERVE de sa hauteur juste derrière
 *    (`data-reserve-barre`, lib/reserve-barre). Le squelette ne la
 *    posait pas — son contenu commençait CACHÉ SOUS LA BARRE, et tout
 *    descendait d'un coup à l'arrivée ;
 *  · « MA SÉLECTION » : ses deux menus vivent DANS la rangée de la
 *    barre (nº 245), pas dessous — le squelette dessinait un encadré
 *    de moteur au centre ET deux pilules en dessous : deux fantômes ;
 *  · AU WEB, l'encadré central faisait 397 × 48 à gauche au lieu de
 *    680 × 52 au centre (ma structure de barre était approximative) ;
 *  · DEUX ronds d'action au lieu de TROIS ; photo de carte arrondie
 *    (`rounded-xl`) là où la vraie est `rounded-none`.
 *
 * LE REMÈDE N'EST PAS DE L'À-PEU-PRÈS EN MIEUX : la structure de la
 * barre squelette est désormais CELLE de la vraie barre, classe pour
 * classe — mêmes conteneurs (`order-*`, `basis-*`), même réserve
 * (importée de `lib/reserve-barre`), même rythme de titre (importé de
 * `LigneResultats`), même grille (importée de `GrilleTatoueurs`),
 * même cadre de photo (config). Si la vraie barre bouge, le squelette
 * suit — c'est la règle des écritures uniques (piège nº 378).
 *
 * ██ §1 (nº 708) — LA BARRE, ÉTAT PAR ÉTAT, MESURÉE ██
 * ------------------------------------------------------------------
 * Le propriétaire a relevé les écarts restants ; tout a été RE-MESURÉ
 * sur la vraie barre (banc nº 708, rectangles et rayons calculés),
 * et le squelette suit désormais CHAQUE état :
 *
 *  · LE BLOC CENTRAL DE LA RECHERCHE n'est pas une pilule : au web,
 *    c'est un CHAMP À ANGLES ARRONDIS (624 × 46, rayon 12) suivi du
 *    ROND DU FILTRE (46 × 46) — 680 en tout ; au doigt, la pilule
 *    pleine largeur (358 × 46, bords ronds), SANS rond de filtre
 *    (les filtres vivent dans la page plein écran) ;
 *  · CELUI DE « MA SÉLECTION » n'est PAS le moteur : c'est le
 *    va-et-vient Favoris | Portfolios — une plaque à ANGLES ARRONDIS
 *    (rayon 12, la robe `rounded-xl` d'EncadreDeuxChamps), sans rond
 *    de filtre, aux DEUX appareils ;
 *  · LA ZONE DROITE SUIT L'ÉTAT DU COMPTE, par le mécanisme que le
 *    site possède depuis la nº 357 : `data-compte`, posé sur <html>
 *    par le script AVANT la première peinture. CONNECTÉ — recherche
 *    (et accueil, même barre) : fanion + avatar (2 ronds) aux DEUX
 *    appareils — CONSIGNE du propriétaire (nº 710), qui PRIME sur le
 *    relevé d'atelier de la nº 708 (la session forgée du banc montrait
 *    3 ronds au doigt) ; « Ma sélection » : loupe + fanion + avatar
 *    (3 ronds). DÉCONNECTÉ — au web : le globe + le bloc large
 *    « Rejoindre » (133 × 40, rayon 12) ; au doigt : loupe + globe +
 *    le rond « Rejoindre » (3 ronds). Les deux variantes sont dans le
 *    HTML, et deux règles de `globals.css` (nº 708) montrent la
 *    bonne — aucune lecture, aucun effet : du CSS, comme l'amorti du
 *    compte de la vraie barre ;
 *  · « MA SÉLECTION » N'A NI TITRE NI SOUS-TITRE : sa grille commence
 *    directement — les barres grises du titre étaient des fantômes.
 * La fiche et l'éditeur n'ont pas de squelette (nº 706 : ils arrivent
 * tout de suite), rien n'y change.
 * ⚠️ AUCUN ÉTAT, AUCUNE LECTURE — des `<div>` et des classes, et UN
 * SEUL effet depuis la nº 722 : au montage d'un squelette de segment,
 * la remontée armée par le geste se joue (`leSqueletteDeLaListeEstLa`,
 * lib/liste-neuve — le squelette démarre en haut, §2 nº 722). Un
 * retour DOUX ne passe pas par ici (réserve du routeur, bancs
 * nº 706/707) ; une navigation AVANT arrive en haut.
 *
 * ⚠️ LE DÉFAUT DU RETOUR PAR CHARGEMENT COMPLET (« témoin B », ouvert
 * de la nº 706 à la nº 710) EST FERMÉ À LA nº 711, là où la nº 707
 * l'avait situé : dans la LIBÉRATION de la réserve
 * (`restitution-position` — zone alors interdite, ouverte par le
 * propriétaire à la nº 711). La mesure de libération se regardait
 * elle-même : le corps porte `min-h-full`, il SUIT la réserve posée
 * sur <html> — le test « corps ≥ réserve » se satisfaisait à la
 * première image, la réserve partait, le document retombait à la
 * hauteur du squelette seul et le navigateur clampait le défilement
 * (804 = squelette − écran). L'instruction complète, image par
 * image, et le test corrigé (« le document DÉPASSE la réserve »,
 * strictement) sont dans `restitution-position` (§1 nº 711). Les
 * trois gardes locales essayées et retirées à la nº 707 restent
 * retirées : c'était bien la source qu'il fallait corriger, pas des
 * rustines ici.
 */

/** Le rond d'action de la barre : même gabarit que les icônes (40). */
function RondGris({ classe = "", geste = false }: { classe?: string; geste?: boolean }) {
  return (
    <span
      aria-hidden="true"
      /*  ██ §3 (nº 852) — TOUS LES RONDS À LA TAILLE DE L'AVATAR ██
          CE QUI SE VOYAIT : les ronds du fanion, de la loupe et du
          compte faisaient 46 px au doigt (la CIBLE du geste,
          `CIBLE_GESTE_BARRE`) quand celui de l'avatar en fait 40 — trois
          disques gris manifestement plus gros qu'un quatrième, à côté.
          LE PROPRIÉTAIRE TRANCHE : tous à la taille du cercle de
          l'avatar.
          POURQUOI CE N'ÉTAIT PAS FAUX, ET POURQUOI C'EST MIEUX AINSI :
          la nº 821 avait donné à ces ronds la CIBLE TACTILE des gestes,
          pour que le squelette promette la largeur que la barre allait
          tenir. Mais un squelette ne promet pas une cible — il promet ce
          qu'on VERRA : une icône de 26 px dans un rond de 40, comme
          l'avatar. La largeur de la barre, elle, ne dépend pas de ces
          ronds : elle est tenue par la réserve et par le logo, et le
          banc le mesure (nº 852, aucun saut).
          ⚠️ MAIS LA BARRE, ELLE, NE DOIT PAS RÉTRÉCIR — et elle l'a
          fait dès le premier essai : au doigt, sa hauteur EST celle de
          ses cibles (46 + 24 d'air = 70), et des ronds de 40 la
          ramenaient à 64. Six pixels de saut à l'arrivée, mesurés.
          D'OÙ DEUX BOÎTES, ET C'EST LA JUSTE LECTURE : la CIBLE tient la
          place (46 au doigt, 40 au web — `CIBLE_GESTE_BARRE`, l'écriture
          unique), le DISQUE se voit à la taille de l'avatar, centré
          dedans. Un squelette promet ce qu'on VERRA, pas ce qu'on
          touchera ; il doit tout de même réserver ce que la barre
          occupera. Les deux tiennent maintenant ensemble.
          ⚠️ LE RÉGLAGE `geste` RESTE, mais il ne dit plus la taille du
          disque : il dit si ce rond annonce un GESTE de la barre, donc
          s'il en réserve la cible. L'avatar, lui, n'en a pas. */
      className={`${geste ? CIBLE_GESTE_BARRE : "h-10 w-10"} shrink-0
                  flex items-center justify-center ${classe}`}
    >
      <span className="h-10 w-10 rounded-full bg-sombre-eleve" />
    </span>
  );
}

/**
 * LA ZONE DROITE, DANS LES DEUX ÉTATS — les deux variantes sont
 * rendues, et `globals.css` (nº 708) n'affiche que celle de l'état
 * que le script a écrit dans `html[data-compte]` (nº 357).
 * CONNECTÉ (consigne nº 710) : la recherche montre fanion + avatar —
 * DEUX ronds, aux deux appareils ; seule « Ma sélection » garde sa
 * loupe devant (trois ronds). C'est la parole du propriétaire qui
 * fait foi ici, PAS le relevé nº 708 (pris sur la session forgée du
 * banc, qui voyait 3 ronds au doigt de la recherche) — s'ils ne
 * disent pas la même chose, c'est la consigne qu'on dessine.
 * DÉCONNECTÉ, inchangé (mesuré nº 708) : loupe (doigt), globe, puis
 * « Rejoindre » — un rond au doigt, un bloc large 133 × 40 à angles
 * arrondis au web.
 */
function ZoneDroite({
  avecLoupe,
  loupeAuDoigtSeulement = false,
}: {
  avecLoupe: boolean;
  /** §2 (nº 846) — sur les RÉSULTATS, la loupe de la vraie barre est
      `lg:hidden` (elle ne remplace la rangée que dans le monde étroit) ;
      sur « Ma sélection », elle vit aux deux largeurs (rangée libre,
      nº 245-§4). Le squelette suit, sans quoi la zone droite du web
      promettrait un rond de trop et la barre sauterait à l'arrivée. */
  loupeAuDoigtSeulement?: boolean;
}) {
  return (
    <div
      className="order-2 lg:order-3 ml-auto lg:ml-0 lg:flex-none shrink-0
                 flex items-center justify-end gap-3"
    >
      <span data-squelette-connecte="" className="contents">
        {avecLoupe && (
          <RondGris geste classe={loupeAuDoigtSeulement ? "lg:hidden" : ""} />
        )}
        <RondGris geste />
        {/*  Le dernier est l'AVATAR — et depuis la nº 852 les trois
             DISQUES ont sa taille ; seule leur cible diffère. */}
        <RondGris />
      </span>
      <span data-squelette-deconnecte="" className="contents">
        {/*  ██ §2 (nº 853) — LA ZONE DÉCONNECTÉE PROMET LA VRAIE, AU
             PIXEL ██
             -------------------------------------------------------
             DEUX DÉFAUTS DITS PAR LE PROPRIÉTAIRE, et ils n'en font
             qu'un : les trois ronds COMPRIMAIENT le logo, et ils
             étaient DÉCALÉS par rapport aux icônes qui les remplacent.
             LA CAUSE, MESURÉE AU DOIGT : la vraie zone fait 148 px —
             la loupe (46) + douze + le globe (46) + douze + « Join »,
             qui est un rond de QUARANTE ramené de huit sur la marge
             (46 + 12 + 46 + 12 + 40 − 8 = 148). Le squelette en
             promettait 162 : trois cibles de 46, sans le retrait. Ces
             quatorze pixels de trop rognaient le logo (176 au lieu de
             185) et poussaient les trois centres de quatorze pixels
             (235-293-351 au lieu de 249-307-362).
             LE TROISIÈME ROND PREND DONC LA BOÎTE DE « JOIN » : quarante
             pixels, et le même retrait. Les deux zones font alors la
             même largeur, les trois centres tombent ensemble, et le
             logo ne bouge plus d'un pixel entre le squelette et la
             page — c'est le banc qui le dit.
             ⚠️ LE WEB N'EST PAS CONCERNÉ : ce rond y est retiré de
             l'affichage (`lg:hidden`), et c'est la plaque de 133 px
             qui promet le bouton. */}
        <RondGris geste classe="lg:hidden" />
        <RondGris geste />
        <RondGris classe="lg:hidden -mr-2" />
        <span
          aria-hidden="true"
          className="hidden lg:block h-10 w-[133px] shrink-0 rounded-[12px] bg-sombre-eleve"
        />
      </span>
    </div>
  );
}

/**
 * LA BARRE, EN SQUELETTE — la structure de la VRAIE barre
 * (EnTeteTatouage), classe pour classe : le logo (réel — il n'attend
 * rien), la zone d'actions (trois ronds), et le bloc central — le
 * moteur ou les deux menus de « Ma sélection », même géométrie — qui
 * passe SOUS le logo aux largeurs étroites (`order-3 basis-full`),
 * exactement comme la vraie rangée. Puis LA RÉSERVE : au doigt la
 * barre est fixe, et c'est cet espaceur (la hauteur de
 * `lib/reserve-barre`, écriture unique) qui tient la place du
 * document — sans lui, tout le squelette vivait caché sous la barre.
 */
function BarreSquelette({ centre }: { centre: "recherche" | "selection" }) {
  return (
    <>
      <header className="sticky top-0 z-50 mobile:fixed mobile:inset-x-0 bg-sombre-fond">
        <div
          /*  §2 (nº 858) — LA MÊME BARRE QUE LA VRAIE : plus de
              rembourrage sous la ligne du va-et-vient au doigt, là où la
              rangée existe (« Ma sélection »). Sur une page de résultats,
              la rangée n'est pas là et le rembourrage reste. */
          className={`mx-auto w-full max-w-[1760px] px-4 sm:px-6
                     flex flex-wrap lg:flex-nowrap items-center gap-x-5 pt-3 ${
                       centre === "recherche" ? "pb-3" : "mobile:pb-0 not-mobile:pb-3"
                     }`}
        >
          <div className="min-w-0 basis-0 grow shrink order-1 lg:flex-none lg:basis-auto">
            <div className="block w-fit">
              <LogoYokofolio
                hauteur={48}
                classe="h-9 sm:h-11 lg:h-12 w-auto max-w-full object-contain object-left"
              />
            </div>
          </div>
          {/*  ██ §2 (nº 846) — LES RÉSULTATS ONT LEUR LOUPE, EUX AUSSI ██
               Depuis la nº 846, une page de RÉSULTATS n'a plus de champ
               de recherche dans le monde étroit : la loupe de la barre le
               remplace (comme sur « Ma sélection »). Le squelette de
               cette page — et il ne sert QU'À ELLE, l'accueil n'a pas de
               `loading.tsx` — doit donc la promettre, sans quoi la zone
               droite sauterait d'un rond à l'arrivée.
               ⚠️ MAIS AU DOIGT SEULEMENT : au web, la vraie loupe reste
               masquée (`lg:hidden`) et le moteur occupe le centre. */}
          <ZoneDroite avecLoupe loupeAuDoigtSeulement={centre === "recherche"} />
          {/*  ██ §2 (nº 846) — LE CENTRE DES RÉSULTATS N'EXISTE PLUS AU
               DOIGT ██
               La vraie rangée y est `hidden lg:flex` sur une page de
               résultats (EnTeteTatouage) : le squelette prend la même
               écriture, exactement, et son `max-lg:pt-3` part avec elle
               — c'était l'air AU-DESSUS de la rangée, il n'a plus rien à
               espacer. « Ma sélection » garde tout : sa rangée libre vit
               aux deux largeurs. */}
          <div
            className={`order-3 lg:order-2 basis-full lg:basis-[680px] lg:shrink
                       lg:grow-0 lg:mx-auto min-w-0
                       items-center lg:min-h-[52px] ${
                         centre === "recherche"
                           ? "hidden lg:flex"
                           : "flex max-lg:pt-3"
                       }`}
          >
            {/*  `lg:min-h-[52px]` : la vraie enveloppe du moteur fait
                 52 de haut au web (champ de 46 + son air) — c'est elle
                 qui donne à la barre ses 76 px ; sans cette hauteur,
                 le squelette faisait une barre de 72 et tout le corps
                 remontait de 4 px (mesuré, banc nº 708). */}
            {centre === "recherche" ? (
              /*  Le moteur : champ à angles arrondis + rond du filtre
                  au web ; pilule pleine largeur, sans filtre, au
                  doigt. Cotes mesurées (624 + 10 + 46 = 680 · 46 de
                  haut partout). */
              <div className="flex items-center gap-[10px] w-full max-w-[680px] mx-auto">
                <div className="h-[46px] flex-1 rounded-full lg:rounded-[12px] bg-sombre-eleve" />
                <span
                  aria-hidden="true"
                  className="hidden lg:block h-[46px] w-[46px] shrink-0 rounded-full bg-sombre-eleve"
                />
              </div>
            ) : (
              /*  Le va-et-vient Favoris | Portfolios : UNE plaque à
                  angles arrondis (la robe rounded-xl de son encadré),
                  sans rond de filtre, aux deux appareils. */
              <div className="h-[46px] w-full max-w-[680px] mx-auto rounded-[12px] bg-sombre-eleve" />
            )}
          </div>
        </div>
      </header>
      {/*  LA RÉSERVE DE LA BARRE FIXE (au doigt) : la hauteur vient de
           l'écriture unique, comme dans la vraie barre (nº 258/335).
           ██ §2 (nº 846) — ET ELLE SUIT LA RANGÉE ██
           Une page de RÉSULTATS n'a plus de rangée au doigt : sa barre
           ne fait plus que le logo, et sa réserve tombe à `RESERVE_LOGO`.
           La promettre à 122 aurait posé tout le corps 58 px trop bas,
           puis l'aurait fait remonter d'un coup à l'arrivée — très
           exactement le saut que les nº 707/708 ont supprimé. */}
      <div
        aria-hidden="true"
        /*  §2 (nº 858) — UNE PRISE POUR LA MESURE, ET RIEN D'AUTRE.
            Cette réserve promet la hauteur de la barre qui vient ; sans
            repère, aucun banc ne pouvait la lire pendant le squelette —
            celui de la nº 857 mesurait en réalité la page ARRIVÉE, et
            ne disait donc rien. Le repère est DISTINCT de celui de la
            vraie réserve (`data-reserve-barre`) exprès : ce dernier est
            visé par des règles de globals.css, et un squelette n'a pas
            à en hériter. Aucune classe, aucun pixel : un nom. */
        data-reserve-squelette=""
        data-reserve-posee={centre === "recherche" ? RESERVE_LOGO : RESERVE_RANGEE}
        style={{
          height: centre === "recherche" ? RESERVE_LOGO : RESERVE_RANGEE,
        }}
        className="hidden mobile:block shrink-0"
      />
    </>
  );
}

/**
 * ██ §2 (nº 845) — LA CARTE GRISE DU FIL (DOIGT) ██
 * ==================================================================
 * LE DÉFAUT, ET IL DATE DE LA nº 841 : depuis que les résultats du
 * doigt sont un FIL pleine largeur (une carte par rangée, en-tête,
 * image, pied), le squelette leur promettait encore la MOSAÏQUE À DEUX
 * COLONNES — deux petites cases par rangée, sans en-tête ni pied. Tout
 * sautait à l'arrivée : le nombre de colonnes, la largeur des photos,
 * la hauteur de chaque rangée.
 * CE BLOC EST DONC LA SILHOUETTE DE `CarteFil`, à la lettre :
 *  · L'EN-TÊTE — le rond de 40, deux traits de texte, le rectangle du
 *    badge du type. Sa BOÎTE vient de la carte elle-même
 *    (`RANGEE_EN_TETE_DE_FIL`, components/CarteFil) : ni les écarts ni
 *    les marges ne sont recopiés ;
 *  · L'IMAGE — le format 4/5 du site, pleine largeur ;
 *  · LE PIED — sa boîte vient aussi de la carte
 *    (`RANGEE_PIED_DE_FIL`) : une cible ronde à gauche (signaler), les
 *    points au centre, deux cibles rondes à droite (partage, fanion).
 *    ⚠️ TROIS ICÔNES, ET NON DEUX : la consigne de la nº 845 dit
 *    « points et deux icônes » ; la carte réelle en porte TROIS depuis
 *    la nº 842 (signaler à gauche, partage et fanion à droite). C'est
 *    la carte réelle qui fait foi — un squelette qui promet moins que
 *    ce qui arrive fait sauter la rangée qu'il annonce.
 *
 * ██ LES HAUTEURS DE TEXTE SONT CALCULÉES, PAS DEVINÉES ██
 * Les deux traits de l'en-tête valent EXACTEMENT les boîtes de ligne
 * qu'ils remplacent, `leading-tight` étant 1,25 :
 *   · le nom  : 16 px × 1,25 = 20 px ;
 *   · la ville : 14,5 px × 1,25 = 18,125 px,
 * séparés des mêmes 4 px (`mt-1`). La colonne fait donc 42,125 px, et
 * c'est elle qui décide de la hauteur de l'en-tête (le rond n'en fait
 * que 40). Le banc nº 845 mesure les deux côte à côte.
 */
function CarteGriseDuFil() {
  return (
    <>
      <div className={RANGEE_EN_TETE_DE_FIL}>
        <span className="h-10 w-10 shrink-0 rounded-full bg-sombre-eleve" />
        <div className="min-w-0 flex-1">
          {/*  20 px — le nom (16 × 1,25). */}
          <div className="h-5 w-1/2 bg-sombre-eleve" />
          {/*  18,125 px — la ville (14,5 × 1,25), 4 px plus bas. */}
          <div className="mt-1 h-[18.125px] w-1/3 bg-sombre-eleve" />
        </div>
        {/*  LE BADGE DU TYPE : la hauteur de la charte, LUE et non
             recopiée (`HAUTEUR_BADGE_GRIS`, config/tatouage). La nº 855
             l'avait portée à quarante, la nº 856 la remet à trente —
             ce gris a suivi les deux fois sans qu'on y touche.
             SA LARGEUR NE PEUT PAS ÊTRE SUE : elle dépend du libellé, et
             il y en a trois. MESURÉS à l'atelier : « Artist » 69 px,
             « Tattoo Shop » 115, « Private Studio » 128. On pose donc le
             MILIEU DE LA FOURCHETTE, 98 px : c'est la valeur qui borne
             l'écart au plus petit — jamais plus de 30 px de trop ni de
             trop peu, quel que soit le portfolio qui arrive.
             ⚠️ ELLE NE DÉCIDE DE RIEN : l'en-tête est une rangée de
             flexion dont la colonne de texte cède la première (`min-w-0
             flex-1`) — la hauteur de la rangée, donc celle de la carte,
             ne dépend pas de cette largeur. C'est mesuré au banc nº 845,
             où le squelette et la vraie carte tombent au millième. */}
        <span className={`${HAUTEUR_BADGE_GRIS} w-[98px] shrink-0 rounded-lg bg-sombre-eleve`} />
      </div>
      <div className={`hidden mobile:block w-full ${CADRE_PHOTO_PORTFOLIO} bg-sombre-eleve`} />
      <div className={RANGEE_PIED_DE_FIL}>
        <span className="h-10 w-10 shrink-0 rounded-full bg-sombre-eleve -ml-2" />
        {/*  LES POINTS, centrés sur la carte entière comme les vrais
             (nº 842) : sept crans de 6 px, écartés de 4 — la frise que
             `PointsDuCarrousel` dessine au repos. */}
        <span className="pointer-events-none absolute inset-x-0 flex justify-center gap-1">
          {Array.from({ length: 5 }, (_, rang) => (
            <span key={rang} className="h-1.5 w-1.5 rounded-full bg-sombre-eleve" />
          ))}
        </span>
        <span className="flex shrink-0 items-center -mr-2">
          <span className="h-10 w-10 rounded-full bg-sombre-eleve" />
          <span className="h-10 w-10 rounded-full bg-sombre-eleve" />
        </span>
      </div>
    </>
  );
}

/** Une carte de mosaïque, grise — LA silhouette de la vraie
    (CarteTatoueur, mesurée au banc nº 707) : le cadre 4/5 de la photo
    SANS arrondi (`rounded-none`), puis le pied aux hauteurs exactes —
    44 px au doigt (nom 16 + ville 16), 82 px au web (nom 18 + rangée
    du rond de profil 40). Les enveloppes du pied reprennent les
    classes de la vraie carte (`pt-2 px-0.5 mobile:px-2`, rangée
    `gap-2.5`, rond caché au doigt par `mobile:` — le critère
    d'appareil de la vraie, jamais une largeur, piège nº 60).
    ⚠️ §2 (nº 845) — SUR LA LISTE DES RÉSULTATS (`fil`), CE BLOC-CI EST
    CELUI DU WEB SEUL : au doigt il s'efface (`mobile:hidden`) et
    `CarteGriseDuFil` prend sa place. C'est le partage EXACT de la vraie
    carte, qui rend les deux structures et laisse la feuille de style
    choisir selon l'appareil (CarteTatoueur, règle nº 60). « Ma
    sélection » n'est pas un fil : elle garde ses deux colonnes, et ce
    bloc, aux deux appareils. */
function CarteGrise({ classe = "", fil = false }: { classe?: string; fil?: boolean }) {
  return (
    <li className={`min-w-0 list-none${classe ? ` ${classe}` : ""}`}>
      <div className={fil ? "mobile:hidden" : ""}>
        <div className={`${CADRE_PHOTO_PORTFOLIO} w-full bg-sombre-eleve`} />
        <div className="pt-2 px-0.5 mobile:px-2">
          <div className="h-4 sm:h-[18px] w-2/3 bg-sombre-eleve" />
          {/*  §3 (nº 709) — DEUX LIGNES à droite du rond, comme la
               vraie carte (nom + sous-ligne empilés) ; au doigt la
               vraie n'a qu'une ligne et pas de rond — la seconde barre
               suit le rond (`mobile:hidden`). La rangée garde ses
               40 px au web (`sm:h-10`) : le pied ne bouge pas. */}
          <div className="mt-4 mobile:mt-1 flex items-center gap-2.5 sm:h-10">
            <span className="mobile:hidden h-10 w-10 shrink-0 rounded-full bg-sombre-eleve" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-4 w-1/2 bg-sombre-eleve" />
              <div className="mobile:hidden h-3 w-1/3 bg-sombre-eleve" />
            </div>
          </div>
        </div>
      </div>
      {fil && <CarteGriseDuFil />}
    </li>
  );
}

/**
 * LE CORPS SEUL — le bloc de titre au rythme EXACT de `LigneResultats`
 * (constante partagée, nº 707), la barre grise à la hauteur du vrai
 * titre (21 px au doigt, 33 au web — mesuré), puis la grille des
 * cartes, la vraie écriture de grille.
 * ⚠️ EXPORTÉ SANS SON `<main>` (nº 710), ET C'EST LE POINT : la page
 * de recherche le SUPERPOSE à sa propre mosaïque pendant une
 * navigation douce de même segment (voir IndexTatoueurs, §1 nº 710) —
 * le cadre de page, elle l'a déjà ; `classe` reçoit alors le
 * positionnement de la superposition. Au montage d'un segment, c'est
 * `MosaiqueGrise`, juste dessous, qui lui pose le cadre.
 */
export function CorpsSquelette({
  avecTitre,
  classe = "",
  selection = false,
  fil = false,
}: {
  avecTitre: boolean;
  classe?: string;
  /** §2 (nº 845) — LA LISTE DES RÉSULTATS : au doigt, ses cartes sont
      celles du FIL (une par rangée, pleine largeur — nº 841), et le
      squelette doit les annoncer telles quelles. Le web ne change pas
      d'un pixel, ni « Ma sélection », qui n'est pas un fil. */
  fil?: boolean;
  /** nº 819 — « Ma sélection » : la grille grise porte alors le repère
      `data-squelette-cartes`, que la garde CSS n'affiche que si ce
      compte avait des cartes (lib/memoire-selection). Les autres
      squelettes (recherche, index) promettent toujours des cartes :
      une liste publique n'est jamais vide. */
  selection?: boolean;
}) {
  return (
    <div className={`animate-pulse${classe ? ` ${classe}` : ""}`}>
      {avecTitre ? (
        //  §3a (nº 848) — LE RYTHME DE LA RANGÉE, ET PLUS CELUI DU
        //  TITRE : ce bloc ne sert que les pages de résultats, qui
        //  rendent des badges. Il lit donc la constante que le vrai
        //  bloc lit dans ce cas-là (LigneResultats) — 24 px au-dessus
        //  au web, au lieu de 32, sans quoi la page descendrait de huit
        //  pixels à l'arrivée.
        <div className={RYTHME_TITRE_BADGES}>
          {/*  ██ §2 (nº 847) — LA BARRE DU TITRE S'EN VA AVEC LE TITRE ██
               CE BLOC NE SERT QU'AUX PAGES DE RÉSULTATS (la recherche et
               sa superposition ; « Ma sélection » n'a pas de titre du
               tout). Or, depuis la nº 847, elles n'ont plus de titre : le
               compte est devenu LE PREMIER BADGE de la rangée
               (`FiltresActifs`). Le squelette promettait encore une barre
               de titre — 21 px au doigt, 33 au web, plus son écart : tout
               le corps serait arrivé 25 à 39 px trop haut.
               IL NE RESTE DONC QUE LA RANGÉE DES BADGES, et depuis la
               nº 848 elle n'a plus de marge du tout : tout l'air
               au-dessus est au bloc (§3a, LigneResultats).
               ██ §3 (nº 850) — LA HAUTEUR SUIT CELLE DES VRAIS BADGES ██
               Elle a suivi trois fois : 30 px (nº 847), 44/46 (nº 848),
               et 26 au doigt / 28 au web depuis que l'air se mesure sur
               les LETTRES et non sur la boîte de ligne (`FiltresActifs`,
               nº 850). Un squelette qui promettrait l'ancienne hauteur
               ferait sauter toute la page à l'arrivée des cartes. Ces
               deux nombres-là sont mesurés au banc, jamais déduits.
               ██ nº 851, PUIS nº 853-§4 — TRENTE PARTOUT ██ : les badges
               prennent les mesures exactes du badge du TYPE des cartes
               (décision du propriétaire), dont la hauteur minimale vaut
               trente pixels — au doigt depuis la nº 851, AU WEB AUSSI
               depuis la nº 853. Il n'y a donc plus qu'un nombre, et plus
               aucune variante d'appareil ici.
               ⚠️ ET LA MARGE COPIÉE S'EN VA AVEC ELLE : elle était posée
               ici par largeur de fenêtre (640 px) là où la rangée la
               posait par APPAREIL (règle nº 60) — deux pixels de saut sur
               une fenêtre d'ordinateur étroite. Plus de marge des deux
               côtés, donc plus rien à faire concorder.
               ⚠️ DEUX RECTANGLES, ET NON UN : la rangée en porte au moins
               deux dès qu'un filtre est posé — le compte, puis le style.
               Leurs largeurs ne décident de rien (la rangée est une ligne
               de flexion, sa hauteur ne dépend pas d'elles) ; elles sont
               prises sur les libellés les plus courants et MESURÉES à
               l'écran : « 27 portfolios » fait 118 px aux deux appareils
               depuis que leur écriture est la même (nº 853-§4), et
               « Blackwork » 127 au doigt pour 129 au web — d'où 118 et
               128. */}
          {/*  §3 (nº 856) — AU WEB, LES DEUX GRIS GRANDISSENT AVEC LES
               VRAIS : le corps monte d'un cran, la boîte suit en
               proportion (32 de haut), et la largeur avec elle — 129 et
               134 px MESURÉS à l'atelier sur « 14 portfolios » et
               « Blackwork ✕ », comme les 118 et 128 du doigt l'avaient
               été. La hauteur est celle de la charte, lue
               (`HAUTEUR_BADGE_RECHERCHE_GRIS`). */}
          <div data-squelette-badges="" className="flex items-center gap-2">
            <div className={`${HAUTEUR_BADGE_RECHERCHE_GRIS} w-[118px] not-mobile:w-[129px] rounded-lg bg-sombre-eleve`} />
            <div className={`${HAUTEUR_BADGE_RECHERCHE_GRIS} w-[128px] not-mobile:w-[134px] rounded-lg bg-sombre-eleve`} />
          </div>
        </div>
      ) : (
        /*  « Ma sélection » n'a ni titre ni sous-titre (nº 708) : la
            grille commence après le seul espacement du rythme. */
        /*  §5 (nº 857) — AU DOIGT, PLUS AUCUN AIR : la vraie page n'en a
            plus sous la ligne du va-et-vient (`data-air-sous-barre`,
            PageFavoris). Le squelette promet la même chose — zéro. */
        <div className="pt-6 sm:pt-8 mobile:pt-0" />
      )}
      {/*  §1 (nº 722) — DES RANGÉES ENTIÈRES, À CHAQUE LARGEUR. La
           nº 710 avait tranché HUIT cases ; le propriétaire RE-TRANCHE :
           le squelette suit la règle de colonnes de la vraie grille et
           REMPLIT l'écran — huit cases sur cinq colonnes, c'était une
           rangée et demie, et du vide dessous.
           LE COMPTE : DOUZE cases partout (6 rangées à 2 colonnes, 4 à
           3, 3 à 4), QUINZE à cinq colonnes (3 rangées) — jamais de
           rangée incomplète, et jamais six colonnes (plafond nº 473).
           ⚠️ LA RÈGLE DE COLONNES N'EST PAS RECOPIÉE : la grille
           ci-dessous EST `CLASSES_GRILLE_CARTES` (l'écriture unique),
           et les trois cases de complément s'allument par LE MÊME
           palier nommé qu'elle (`grille5:`, 1600 px — globals.css).
           Les paliers 768/1280/1600 sont des largeurs À L'INTÉRIEUR du
           monde web ; l'appareil, lui, reste dit par `data-appareil`
           (piège nº 60) — les deux mécanismes ne se mélangent pas.
           (Les cases ne SURVIVENT jamais à l'arrivée : le film du banc
           nº 709 le prouve, image par image — le remplacement démonte
           le squelette entier.) */}
      {/*  §2 (nº 845) — LA RÈGLE DE COLONNES DU FIL, LUE CHEZ LA VRAIE
           GRILLE (`COLONNE_UNIQUE_DU_FIL`, `GOUTTIERE_DU_FIL` —
           GrilleTatoueurs) : une colonne au doigt, 24 px entre les
           rangées. Rien n'est recopié, et le web garde exactement
           `CLASSES_GRILLE_CARTES`. */}
      <ul
        {...(selection ? { "data-squelette-cartes": "" } : {})}
        className={`${CLASSES_GRILLE_CARTES}${
          fil ? ` ${COLONNE_UNIQUE_DU_FIL} ${GOUTTIERE_DU_FIL}` : ""
        }`}
      >
        {Array.from({ length: 15 }, (_, rang) => (
          <CarteGrise
            key={rang}
            fil={fil}
            /*  §2 (nº 845) — AU DOIGT, LE FIL N'EN MONTRE QUE TROIS, et
                ce n'est pas une économie de traits : une carte de fil
                fait ~586 px de haut sur un écran de 390 — quinze en
                feraient 8 800, quatre fois la hauteur que le squelette
                à deux colonnes posait hier. Or la libération de la
                réserve compare la hauteur du document à celle du
                squelette (lib/restitution-position, nº 711) : lui
                donner une taille sans rapport avec la vraie liste
                rouvrirait précisément le défaut que la nº 711 a fermé.
                TROIS cartes (~1 758 px) dépassent l'écran le plus haut
                et restent dans l'ordre de grandeur d'hier.
                ⚠️ C'EST L'APPAREIL QUI TRANCHE (`mobile:hidden`, règle
                nº 60), jamais une largeur — et seulement sur un fil.
                ⚠️ LES TROIS DERNIÈRES gardent leur `hidden` de base :
                `grille5:` est un palier de 1 600 px, qu'aucun téléphone
                n'atteint — elles sont déjà masquées au doigt, il n'y a
                pas deux règles d'affichage à départager (piège 389). */
            classe={
              rang >= 12
                ? "hidden grille5:block"
                : fil && rang >= 3
                  ? "mobile:hidden"
                  : ""
            }
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * LA MOSAÏQUE DU SEGMENT : le cadre de page de la vraie mosaïque
 * (largeur, marges, `pb-16`) autour du corps. C'est elle que les
 * `loading.tsx` montrent au montage d'un segment.
 */
/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) —
    le motif de DefilementEnHaut, pour la même raison : jouer ENTRE la
    pose du DOM et la peinture. */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function MosaiqueGrise({
  avecTitre,
  selection = false,
  fil = false,
}: {
  avecTitre: boolean;
  selection?: boolean;
  fil?: boolean;
}) {
  /*  §2 (nº 722) — AVANT LA PEINTURE du squelette, la remontée armée
      par le geste (carte de style, recherche) se joue : le squelette
      démarre en haut, comme la page qu'il annonce. Un RETOUR n'arme
      rien et ne passe pas par ici (réserve du routeur) : il ne peut
      rien consommer. C'est le SEUL effet de ce fichier — l'en-tête de
      la barre squelette reste, lui, sans état ni lecture. */
  useEffetAvantPeinture(() => {
    leSqueletteDeLaListeEstLa();
    /*  nº 819 — LA MÉMOIRE DE « MA SÉLECTION », AVANT LA PEINTURE DU
        SQUELETTE. Au chargement complet, le script d'avant peinture a
        déjà posé `html[data-selection-memoire]` ; à une navigation
        DOUCE, ce script ne rejoue pas — c'est ici, dans le même
        instant d'avant peinture, que l'attribut est posé pour l'adresse
        qu'on vient d'ouvrir (onglet compris). Le compte vient du
        magasin de session, sans abonnement (`utilisateurConnu`). */
    if (selection) poserMemoireSelection(utilisateurConnu()?.id ?? null);
  }, [selection]);
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16`}
    >
      <CorpsSquelette avecTitre={avecTitre} selection={selection} fil={fil} />
    </main>
  );
}

/** LA RECHERCHE (et la page style + ville, même famille) : moteur au
    centre, titre et sous-titre, mosaïque. */
export function SqueletteRecherche() {
  return (
    <>
      <BarreSquelette centre="recherche" />
      {/*  §2 (nº 845) — LA RECHERCHE EST UN FIL AU DOIGT (nº 841). */}
      <MosaiqueGrise avecTitre fil />
    </>
  );
}

/** « MA SÉLECTION » : le va-et-vient au centre, PAS de titre, la même
    mosaïque. */
export function SqueletteSelection() {
  return (
    <>
      <BarreSquelette centre="selection" />
      <MosaiqueGrise avecTitre={false} selection />
    </>
  );
}
