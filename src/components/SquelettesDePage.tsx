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
 * ⚠️ UNE SEULE SILHOUETTE POUR LES TROIS PAGES, et c'est un FAIT
 * mesuré, pas une paresse : la recherche, style + ville et « Ma
 * sélection » ont LA MÊME géométrie — barre (logo · bloc central
 * 680 × 52 · trois ronds), titre, mosaïque. Le bloc central gris
 * couvre aussi bien le moteur (recherche) que l'encadré des deux
 * menus (sélection) : mêmes coordonnées, même taille.
 * ⚠️ CE QUI RESTE APPROXIMATIF, ET C'EST DIT : la zone des trois
 * ronds suppose un visiteur CONNECTÉ (le cas du propriétaire — au
 * doigt c'est trois ronds dans tous les états) ; au web déconnecté,
 * la vraie barre montre « Se connecter » à leur place pendant la
 * demi-seconde du squelette. Un squelette est prérendu : il ne peut
 * pas lire la session.
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
function RondGris() {
  return (
    <span
      aria-hidden="true"
      className="h-10 w-10 shrink-0 rounded-full bg-sombre-eleve"
    />
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
function BarreSquelette() {
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
          <div
            className="order-2 lg:order-3 ml-auto lg:ml-0 lg:flex-none shrink-0
                       flex items-center justify-end gap-3"
          >
            <RondGris />
            <RondGris />
            <RondGris />
          </div>
          <div
            className="order-3 lg:order-2 basis-full lg:basis-[680px] lg:shrink
                       lg:grow-0 lg:mx-auto min-w-0 flex justify-center
                       max-lg:pt-3"
          >
            <div className="h-[46px] lg:h-[52px] w-full max-w-[680px] rounded-full bg-sombre-eleve" />
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
function MosaiqueGrise() {
  return (
    <main
      aria-busy="true"
      aria-label="Chargement de la page"
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16 animate-pulse`}
    >
      <div className={RYTHME_TITRE_RESULTATS}>
        <div className="h-[21px] sm:h-[33px] w-44 bg-sombre-eleve" />
        {/*  Le SOUS-TITRE (« N portfolios ») : la vraie ligne fait
             23 px au doigt, 30 au web, 4-6 px sous le titre — sans
             elle, la grille grise montait de 28-36 px et sautait à
             l'arrivée (mesuré, nº 707). */}
        <div className="mt-[4px] h-[23px] sm:mt-[6px] sm:h-[30px] w-28 bg-sombre-eleve" />
      </div>
      <ul className={CLASSES_GRILLE_CARTES}>
        {Array.from({ length: 8 }, (_, rang) => (
          <CarteGrise key={rang} />
        ))}
      </ul>
    </main>
  );
}

/** LA silhouette des trois pages à squelette (recherche, style +
    ville, « Ma sélection ») — une seule, parce que leur géométrie est
    UNE (voir l'en-tête du fichier). */
export function SqueletteMosaique() {
  return (
    <>
      <BarreSquelette />
      <MosaiqueGrise />
    </>
  );
}
