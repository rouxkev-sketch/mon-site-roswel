"use client";

import { useEffect, useLayoutEffect } from "react";
import { LogoYokofolio } from "@/components/LogoYokofolio";
import { CADRE_PHOTO_PORTFOLIO, LARGEUR_SITE } from "@/config/tatouage";
import { CLASSES_GRILLE_CARTES } from "@/components/GrilleTatoueurs";
import { RYTHME_TITRE_RESULTATS } from "@/components/LigneResultats";
import { RESERVE_RANGEE } from "@/lib/reserve-barre";
//  §2 (nº 722) — la remontée armée par le geste se joue dès le montage
//  du squelette de segment : voir le grand bloc de lib/liste-neuve.
import { leSqueletteDeLaListeEstLa } from "@/lib/liste-neuve";

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
function RondGris({ classe = "" }: { classe?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-10 w-10 shrink-0 rounded-full bg-sombre-eleve ${classe}`}
    />
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
function ZoneDroite({ avecLoupe }: { avecLoupe: boolean }) {
  return (
    <div
      className="order-2 lg:order-3 ml-auto lg:ml-0 lg:flex-none shrink-0
                 flex items-center justify-end gap-3"
    >
      <span data-squelette-connecte="" className="contents">
        {avecLoupe && <RondGris />}
        <RondGris />
        <RondGris />
      </span>
      <span data-squelette-deconnecte="" className="contents">
        <RondGris classe="lg:hidden" />
        <RondGris />
        <RondGris classe="lg:hidden" />
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
          className="mx-auto w-full max-w-[1760px] px-4 sm:px-6
                     flex flex-wrap lg:flex-nowrap items-center gap-x-5 py-3"
        >
          <div className="min-w-0 basis-0 grow shrink order-1 lg:flex-none lg:basis-auto">
            <div className="block w-fit">
              <LogoYokofolio
                hauteur={48}
                classe="h-9 sm:h-11 lg:h-12 w-auto max-w-full object-contain object-left"
              />
            </div>
          </div>
          <ZoneDroite avecLoupe={centre === "selection"} />
          <div
            className="order-3 lg:order-2 basis-full lg:basis-[680px] lg:shrink
                       lg:grow-0 lg:mx-auto min-w-0 max-lg:pt-3
                       flex items-center lg:min-h-[52px]"
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
           l'écriture unique, comme dans la vraie barre (nº 258/335). */}
      <div
        aria-hidden="true"
        style={{ height: RESERVE_RANGEE }}
        className="hidden mobile:block shrink-0"
      />
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
    d'appareil de la vraie, jamais une largeur, piège nº 60). */
function CarteGrise({ classe = "" }: { classe?: string }) {
  return (
    <li className={`min-w-0 list-none${classe ? ` ${classe}` : ""}`}>
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
}: {
  avecTitre: boolean;
  classe?: string;
}) {
  return (
    <div className={`animate-pulse${classe ? ` ${classe}` : ""}`}>
      {avecTitre ? (
        <div className={RYTHME_TITRE_RESULTATS}>
          <div className="h-[21px] sm:h-[33px] w-44 bg-sombre-eleve" />
          {/*  Le SOUS-TITRE (« N portfolios ») : la vraie ligne fait
               23 px au doigt, 30 au web, 4-6 px sous le titre — sans
               elle, la grille grise montait de 28-36 px et sautait à
               l'arrivée (mesuré, nº 707). */}
          <div className="mt-[4px] h-[23px] sm:mt-[6px] sm:h-[30px] w-28 bg-sombre-eleve" />
        </div>
      ) : (
        /*  « Ma sélection » n'a ni titre ni sous-titre (nº 708) : la
            grille commence après le seul espacement du rythme. */
        <div className="pt-6 sm:pt-8 mobile:pt-3" />
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
      <ul className={CLASSES_GRILLE_CARTES}>
        {Array.from({ length: 15 }, (_, rang) => (
          <CarteGrise key={rang} classe={rang >= 12 ? "hidden grille5:block" : ""} />
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

function MosaiqueGrise({ avecTitre }: { avecTitre: boolean }) {
  /*  §2 (nº 722) — AVANT LA PEINTURE du squelette, la remontée armée
      par le geste (carte de style, recherche) se joue : le squelette
      démarre en haut, comme la page qu'il annonce. Un RETOUR n'arme
      rien et ne passe pas par ici (réserve du routeur) : il ne peut
      rien consommer. C'est le SEUL effet de ce fichier — l'en-tête de
      la barre squelette reste, lui, sans état ni lecture. */
  useEffetAvantPeinture(() => {
    leSqueletteDeLaListeEstLa();
  }, []);
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16`}
    >
      <CorpsSquelette avecTitre={avecTitre} />
    </main>
  );
}

/** LA RECHERCHE (et la page style + ville, même famille) : moteur au
    centre, titre et sous-titre, mosaïque. */
export function SqueletteRecherche() {
  return (
    <>
      <BarreSquelette centre="recherche" />
      <MosaiqueGrise avecTitre />
    </>
  );
}

/** « MA SÉLECTION » : le va-et-vient au centre, PAS de titre, la même
    mosaïque. */
export function SqueletteSelection() {
  return (
    <>
      <BarreSquelette centre="selection" />
      <MosaiqueGrise avecTitre={false} />
    </>
  );
}
