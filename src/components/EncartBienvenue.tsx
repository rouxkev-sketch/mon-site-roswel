import Link from "next/link";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
//  §4 (nº 475) — le lien vers l'accueil qui déclare son départ.
import { LienAccueil } from "@/components/LienAccueil";

/**
 * ██ nº 817 — « WELCOME TO YOKOFOLIO », L'ENCART DU PREMIER PASSAGE ██
 * ==================================================================
 * OÙ, ET POURQUOI LÀ. Un compte neuf arrive sur « Ma sélection »
 * (ARRIVEE_SANS_PORTFOLIO — la seule arrivée, nº 313), c'est-à-dire
 * sur ses favoris VIDES : la page ne disait rien. L'encart est posé
 * DANS cette page — pas une page de plus, pas une fenêtre par-dessus :
 *  · une PAGE DÉDIÉE ajouterait une étape entre la validation et le
 *    site (le « tunnel » que le propriétaire refuse), et un retour
 *    arrière y ramènerait ;
 *  · une FENÊTRE interrompt — il faut la fermer avant de voir la page,
 *    et au doigt elle couvre tout ;
 *  · l'ENCART, lui, remplit l'écran vide avec ce qu'il manquait, se lit
 *    sans geste, et la page reste la page.
 *
 * ██ nº 818 — LA GÉOMÉTRIE D'ABOUT, ET PLUS AUCUNE BOÎTE ██
 * ------------------------------------------------------------------
 * LA nº 817 en faisait une BANNIÈRE pleine largeur dans un encadré
 * clair (`rounded-2xl bg-sombre-carte`) — « daté », dit le
 * propriétaire. L'encart reprend désormais la géométrie de la page
 * About (nº 798-804), au chiffre près :
 *  · un BLOC CENTRÉ ÉTROIT — `max-w-[720px]`, la colonne d'About —
 *    posé sur le fond de la page, sans fond ni contour ;
 *  · le TITRE FORT d'About (`clamp(2rem, 5.5vw, 2.9rem)`, gras,
 *    interligne 1.1, équilibré par `text-balance`) ;
 *  · le TEXTE d'About (17 px au doigt, 19 px au web, interligne 1.7,
 *    gris doux), court : trois phrases ;
 *  · les DEUX BOUTONS d'About dessous, aux mesures de la nº 788 (40 px,
 *    14 px) — le rouge pour « Find your style », le gris pour « Create
 *    your portfolio » (le mot vient de la config, `lienCreerPortfolio`,
 *    comme partout). Empilés au doigt, côte à côte au web, et CENTRÉS
 *    comme le bloc qu'ils concluent (About les aligne à gauche sous ses
 *    sections ; ici tout est centré, les boutons suivent).
 * L'AIR : rien au-dessus que celui de la page (`data-air-sous-barre`)
 * plus 32 px au doigt (`mobile:pt-8`) / 56 px au web (`not-mobile:`
 * quatorze unités) — de sorte que le titre tombe à peu près où celui
 * d'About tombe sous sa barre (48 / 64 px). Deux variantes qui
 * s'excluent par appareil (pièges nº 389 et nº 60).
 * ⚠️ LES NOMS DE CLASSES NE S'ÉCRIVENT PAS NUS DANS LES NOTES : le
 * moteur CSS lit aussi les commentaires, et un utilitaire cité sans
 * son préfixe entre dans la feuille pour rien (mesuré à la nº 818).
 *
 * ⚠️ IL NE DÉCIDE PLUS RIEN (nº 818) : c'est « Ma sélection » qui
 * sait s'il doit se montrer (`useBienvenue`, lib/bienvenue) et qui le
 * monte À LA PLACE de l'état vide — jamais les deux (la règle du
 * propriétaire). Ce fichier n'est que le dessin.
 */
export function EncartBienvenue() {
  return (
    <section
      aria-label="Welcome"
      data-bienvenue=""
      className="mx-auto w-full max-w-[720px] text-center mobile:pt-8 not-mobile:pt-14 pb-8"
    >
      <h2 className="text-[clamp(2rem,5.5vw,2.9rem)] font-bold leading-[1.1] text-sombre-texte text-balance">
        Welcome to {MARQUE_YOKOFOLIO.nom}
      </h2>
      <p className="mt-6 mobile:text-[17px] not-mobile:text-[19px] leading-[1.7] text-sombre-texte-doux text-pretty">
        Here, you find tattoo artists by style — not by feed. Pick a style,
        a city and a distance, and explore portfolios that show exactly
        that work.
      </p>
      <p className="mt-3 mobile:text-[17px] not-mobile:text-[19px] leading-[1.7] text-sombre-texte-doux text-pretty">
        A tattoo artist? Build your own portfolio and get discovered.
      </p>
      {/*  Les deux gestes de la page About, dans le même moule : le
           rouge mène au catalogue de styles (EN AVANT, déclaré), le
           gris au formulaire de création. */}
      <div className="mt-10 flex mobile:flex-col not-mobile:flex-row justify-center gap-3">
        <LienAccueil
          className="inline-flex items-center justify-center rounded-full
                     px-7 min-h-[40px] text-[14px] bg-primaire
                     hover:bg-primaire-fonce
                     text-white font-semibold transition-colors
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primaire"
        >
          Find your style
        </LienAccueil>
        <Link
          href="/become-an-artist/portfolio?fiche=nouvelle"
          className="inline-flex items-center justify-center rounded-full
                     px-7 min-h-[40px] text-[14px] bg-sombre-eleve
                     hover:bg-sombre-haut
                     text-white font-semibold transition-colors
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primaire"
        >
          {TEXTES_TATOUAGE.lienCreerPortfolio}
        </Link>
      </div>
    </section>
  );
}
