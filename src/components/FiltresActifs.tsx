"use client";

import { IconeCroix } from "@/components/Icones";
import { ROBE_BADGE_CONTOUR } from "@/config/tatouage";

/**
 * ██ LA RANGÉE DES BADGES — SOUS LE COMPTE, PUIS À SA PLACE (nº 846,
 * REFAITE nº 847) ██
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
 *
 * ██ LES DEUX ROBES, ET CE QU'ELLES DISENT ██
 * ------------------------------------------------------------------
 * LE COMPTE : un contour, rien dedans — il RENSEIGNE. Le fond de la page
 * transparaît, c'est le badge le plus discret de la rangée, et c'est
 * juste : personne ne peut agir sur lui.
 * LES FILTRES : un aplat PLEIN, et depuis la nº 847 un cran PLUS SOMBRE
 * que le cran de l'interface — `bg-sombre-carte` (#1A1F26) au lieu de
 * `bg-sombre-eleve` (#262C34). C'est LE cran de la charte juste en
 * dessous (config/tatouage, `COULEURS_SOMBRE`), celui des cartes et des
 * blocs : on ne descend pas au fond de page (#0B0F14), où le badge se
 * dissoudrait, et l'on ne fabrique aucune valeur — on prend le barreau
 * suivant de l'échelle, comme la charte le demande.
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

/** §3 (nº 847) — LA TYPOGRAPHIE DE LA RANGÉE, la même pour les deux
    robes : demi-gras (inchangé depuis la nº 846), corps monté d'un cran
    — 14 → 15 px. Écrite une fois, lue par le compte et par les
    filtres. */
const ECRITURE_BADGE = "text-[15px] font-semibold text-sombre-texte";

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
      /*  §4 (nº 846-847) — L'AIR AU-DESSUS EST CELUI DU SOUS-TITRE que
          cette rangée remplace (`mt-1` au doigt, `mt-1.5` au web —
          LigneResultats, nº 628) : elle se pose exactement là où la ligne
          de texte se posait, et le bloc de tête ne change pas de rythme.

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
      className="mobile:mt-1 not-mobile:mt-1.5 flex items-center gap-2
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
        className={`${ROBE_BADGE_CONTOUR} px-3.5 ${ECRITURE_BADGE}`}
      >
        {compte}
      </h1>
      {filtres.map((filtre) => (
        <span
          key={filtre.cle}
          data-filtre-actif={filtre.cle}
          /*  §5 (nº 847) — `bg-sombre-carte` : UN CRAN PLUS SOMBRE que
              l'ancien `bg-sombre-eleve`, et c'est un barreau de l'échelle,
              pas une teinte inventée (voir la note en tête de fichier).
              §3 (nº 847) — le rembourrage de droite suit la croix, qui a
              grandi : (30 − 26) / 2 = 2 px de part et d'autre. */
          className={`inline-flex min-h-[30px] shrink-0 items-center gap-1.5
                     whitespace-nowrap rounded-lg bg-sombre-carte pl-3 pr-0.5
                     ${ECRITURE_BADGE}`}
        >
          {filtre.libelle}
          {/*  §3 (nº 847) — LA CROIX GRANDIT AVEC LE TEXTE : le glyphe
               passe de 14 à 16 px, sa boîte de 24 à 26 — chacun d'un cran
               sur sa propre échelle, comme le corps du texte. La boîte
               reste sous les 30 px du badge : sa hauteur ne bouge pas,
               et le squelette d'attente qui la promet non plus
               (SquelettesDePage, nº 846). */}
          <button
            type="button"
            data-retrait-filtre={filtre.cle}
            aria-label={filtre.etiquetteRetrait}
            onClick={filtre.surRetrait}
            className="flex h-[26px] w-[26px] shrink-0 items-center
                       justify-center rounded-md text-sombre-texte-doux
                       transition-colors hover:text-sombre-texte
                       hover:bg-sombre-eleve active:bg-sombre-eleve
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            <IconeCroix taille={16} />
          </button>
        </span>
      ))}
    </div>
  );
}
