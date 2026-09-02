"use client";

import { LienAccueil } from "@/components/LienAccueil";

/**
 * ██ §1 (nº 643) — L'ÉCRAN VIDE DE « MA SÉLECTION », ÉCRIT UNE FOIS ██
 * ==================================================================
 * CE QUI EXISTAIT, ET POURQUOI ÇA NE POUVAIT PAS TENIR : les deux
 * onglets avaient CHACUN son rectangle vide, dans deux fichiers
 * différents — les favoris dans `PageFavoris`, les portfolios dans
 * `BlocSuivis`. Les boîtes étaient identiques au caractère (`mt-8
 * rounded-2xl bg-sombre-carte px-5 py-8 text-center`, le texte gris à
 * 14,5 px), mais SEUL le premier portait un bouton. Le propriétaire en
 * veut un des deux côtés : plutôt que d'en recopier un second, les deux
 * écrans montent désormais CETTE écriture-ci, et il n'y a plus qu'un
 * seul endroit où le bouton est décrit.
 *
 * (À la nº 643, rien n'était redessiné : la boîte, ses airs, son fond
 * et le bouton étaient repris au caractère de l'écran des favoris.
 * Seuls les MOTS changent, et ils viennent de l'appelant — cela reste.)
 *
 * ██ nº 818 — PLUS DE BOÎTE : LE TEXTE NU, CENTRÉ, LE BOUTON DESSOUS ██
 * ------------------------------------------------------------------
 * Le grand encadré clair (`rounded-2xl bg-sombre-carte px-5 py-8`) est
 * parti, décision du propriétaire : une phrase centrée sur le fond de
 * la page, et la capsule grise en dessous. LA TYPO EST REVUE À LA
 * CHARTE : la phrase est le seul contenu de la page, elle passe donc
 * dans la couleur du TEXTE (`sombre-texte`, plus le gris doux des
 * mentions secondaires) et à 16 px — la taille de base des paragraphes
 * du site (l'écran de succès de Contact), et plus 14,5 px, une mesure
 * qui n'existait nulle part ailleurs. L'air au-dessus est celui de la
 * bienvenue qu'elle remplace (32 px au doigt, `mobile:mt-8` ; 56 px au
 * web, `not-mobile:` quatorze unités — deux variantes qui s'excluent,
 * pièges nº 389 et nº 60), pour que l'un tombe où l'autre tombait.
 * (Les classes ne sont pas citées nues : le moteur CSS lit aussi les
 * notes, nº 818.)
 * ⚠️ QUI DÉCIDE ENTRE LES DEUX : « Ma sélection » (PageFavoris), qui
 * monte la bienvenue OU cet écran, jamais les deux (nº 818,
 * `useBienvenue`).
 *
 * ⚠️ OÙ MÈNE LE BOUTON : à l'ACCUEIL, et par `LienAccueil` — le lien
 * qui déclare une navigation EN AVANT (nº 429 + nº 446), pour arriver
 * en HAUT du catalogue au lieu de retomber sur la place mémorisée. Ce
 * n'est pas un `<Link href="/">` de plus : c'est celui que la page des
 * favoris employait déjà.
 */
export function EcranVideSelection({
  message,
  marque,
}: {
  /** La phrase grise, sans gras — les mots du propriétaire. */
  message: string;
  /** Un attribut de repère posé sur la boîte (`data-suivis-vide` pour
      l'onglet Portfolios, depuis la nº 412). Aucun code ne le lit
      aujourd'hui : c'est un point d'accroche pour les relevés, et il
      est conservé tel quel plutôt que perdu au passage. */
  marque?: string;
}) {
  return (
    <div
      {...(marque ? { [marque]: "" } : {})}
      className="mobile:mt-8 not-mobile:mt-14 text-center"
    >
      <p className="text-[16px] leading-relaxed text-sombre-texte">
        {message}
      </p>
      {/*  §4 (nº 475) — IL VA EN AVANT, ET IL LE DÉCLARE : partir
           explorer depuis « Ma sélection » vide n'est pas un retour ;
           sans les deux déclarations (nº 429 et nº 446), la chaîne de
           restitution pouvait rendre la place mémorisée de l'accueil —
           le bas de la mosaïque. */}
      {/*  §1 (nº 643) — LE MOT DU BOUTON : « Explorer les portfolios »
           était devenu faux. L'accueil montre un CATALOGUE DE STYLES
           depuis les nº 620-624 ; le bouton dit donc ce qu'on y
           trouve. L'adresse, elle, ne change pas. */}
      {/*  nº 818 — LA CAPSULE GRISE D'ABOUT, aux mesures de la nº 788
           (40 px, 14 px, texte blanc, `sombre-haut` au survol) : le
           bouton qui suit un texte nu est celui qui suit le texte
           d'About et celui de la bienvenue. Plus de 44 / 14,5 à part. */}
      <LienAccueil
        className="mt-5 inline-flex items-center justify-center rounded-full
                   px-7 min-h-[40px] text-[14px] bg-sombre-eleve
                   hover:bg-sombre-haut text-white font-semibold
                   transition-colors focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-primaire"
      >
        Explore styles
      </LienAccueil>
    </div>
  );
}
