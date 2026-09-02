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
 * ⚠️ RIEN N'EST REDESSINÉ, et c'est la règle de la passe : la boîte,
 * ses airs, son fond, le gris du texte et l'apparence du bouton sont
 * REPRIS AU CARACTÈRE de l'écran des favoris. Seuls les MOTS changent,
 * et ils viennent de l'appelant.
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
      className="mt-8 rounded-2xl bg-sombre-carte px-5 py-8 text-center"
    >
      <p className="text-[14.5px] leading-relaxed text-sombre-texte-doux">
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
      <LienAccueil
        className="mt-4 inline-flex min-h-[44px] items-center justify-center
                   rounded-full bg-sombre-eleve px-6 text-[14.5px] font-semibold
                   text-sombre-texte transition-colors hover:bg-sombre-eleve-clair"
      >
        Explore styles
      </LienAccueil>
    </div>
  );
}
