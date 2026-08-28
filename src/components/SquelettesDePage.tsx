"use client";

import { LogoYokofolio } from "@/components/LogoYokofolio";
import { CADRE_PHOTO_PORTFOLIO, LARGEUR_SITE } from "@/config/tatouage";
import { CLASSES_GRILLE_CARTES } from "@/components/GrilleTatoueurs";
import { RYTHME_TITRE_RESULTATS } from "@/components/LigneResultats";
import { RESERVE_RANGEE } from "@/lib/reserve-barre";

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
 *    par le script AVANT la première peinture. CONNECTÉ — au web de
 *    la recherche : fanion + avatar (2 ronds) ; partout ailleurs
 *    (doigt, et « Ma sélection » au web) : loupe + fanion + avatar
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
 * ⚠️ AUCUN ÉTAT, AUCUNE LECTURE, AUCUN EFFET : des `<div>` et des
 * classes. Un retour DOUX ne passe pas par ici (réserve du routeur,
 * bancs nº 706/707) ; une navigation AVANT arrive en haut.
 *
 * ⚠️ UN DÉFAUT CONNU RESTE OUVERT, ET IL EST DIT PLUTÔT QUE TU — LE
 * RETOUR PAR CHARGEMENT COMPLET (cache de va-et-vient manqué) vers
 * une mosaïque défilée : le script d'avant-peinture pose la place
 * (mesuré : 1145) ; pendant l'hydratation, le document passe par la
 * hauteur du squelette seul, plus courte que la place — le
 * navigateur CLAMPE le défilement (788 = squelette − écran) et ne
 * recorrige pas. Ce cas naît avec les squelettes (nº 706) ; les
 * retours DOUX — le chemin ordinaire — et le rechargement (témoin A)
 * sont INTACTS, au pixel. TROIS gardes locales ont été écrites,
 * MESURÉES au banc nº 707, et retirées : lire `scrollY` au montage
 * (la lecture force le recalcul qui clampe — 1 réussite sur 3), lire
 * la place mémorisée du site (vide sur ce chemin — 0 sur 5), retenir
 * la hauteur d'avant les mutations (`useInsertionEffect` — 2 sur 5).
 * Aucune ne FERME la fenêtre : la course se joue dans la libération
 * de la réserve (`restitution-position`, nº 653) — zone que cette
 * passe a interdiction de toucher. Le correctif est décrit dans le
 * compte rendu de la nº 707, pour une passe dédiée.
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
 * que le script a écrit dans `html[data-compte]` (nº 357). Mesures :
 * connecté = ronds de 40 (loupe absente au web de la recherche —
 * `lg:hidden`, la même règle que la vraie loupe, nº 150-§3) ;
 * déconnecté = loupe (doigt), globe, puis « Rejoindre » : un rond au
 * doigt, un bloc large 133 × 40 à angles arrondis au web.
 */
function ZoneDroite({ loupeAuWeb }: { loupeAuWeb: boolean }) {
  return (
    <div
      className="order-2 lg:order-3 ml-auto lg:ml-0 lg:flex-none shrink-0
                 flex items-center justify-end gap-3"
    >
      <span data-squelette-connecte="" className="contents">
        <RondGris classe={loupeAuWeb ? "" : "lg:hidden"} />
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
          <ZoneDroite loupeAuWeb={centre === "selection"} />
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
function CarteGrise() {
  return (
    <li className="min-w-0 list-none">
      <div className={`${CADRE_PHOTO_PORTFOLIO} w-full bg-sombre-eleve`} />
      <div className="pt-2 px-0.5 mobile:px-2">
        <div className="h-4 sm:h-[18px] w-2/3 bg-sombre-eleve" />
        <div className="mt-4 mobile:mt-1 flex items-center gap-2.5">
          <span className="mobile:hidden h-10 w-10 shrink-0 rounded-full bg-sombre-eleve" />
          <div className="h-4 w-1/2 sm:w-1/3 bg-sombre-eleve" />
        </div>
      </div>
    </li>
  );
}

/**
 * LE CORPS : le bloc de titre au rythme EXACT de `LigneResultats`
 * (constante partagée, nº 707), la barre grise à la hauteur du vrai
 * titre (21 px au doigt, 33 au web — mesuré), puis la grille des
 * cartes — la vraie écriture de grille, huit emplacements : l'écran
 * est couvert aux deux appareils sans fabriquer une page
 * artificiellement longue.
 */
function MosaiqueGrise({ avecTitre }: { avecTitre: boolean }) {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la page"
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16 animate-pulse`}
    >
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
      <ul className={CLASSES_GRILLE_CARTES}>
        {Array.from({ length: 8 }, (_, rang) => (
          <CarteGrise key={rang} />
        ))}
      </ul>
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
