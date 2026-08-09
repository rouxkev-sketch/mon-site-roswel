import { cache } from "react";
import { CARTES_PAR_PAGE } from "@/config/tatouage";
import { listerTatoueurs, lireVilleParSlug, styleConnu } from "@/lib/tatoueurs";

/**
 * LA LECTURE D'UNE PAGE STYLE + VILLE, FAITE UNE SEULE FOIS
 * ==========================================================
 * « /tatouage/blackwork/lyon » a désormais TROIS lecteurs : les
 * métadonnées, l'image de partage et le corps de la page. Comme pour
 * une fiche (voir lib/fiche-lue), tout le monde appelle LA MÊME
 * instance de `cache` — c'est ce qui ramène trois lectures à une.
 *
 * Style inconnu ou ville absente : on rend un résultat vide plutôt
 * qu'une erreur. C'est l'appelant qui décide quoi en faire (page
 * introuvable pour la page, image de marque pour l'aperçu).
 */
export const chargerStyleVille = cache(
  async (styleSlug: string, villeSlug: string, page: number = 1) => {
    const vide = { style: "", ville: null, tatoueurs: [], demonstration: false, total: 0, page: 1 };
    const style = styleConnu(styleSlug);
    if (!style) return vide;

    const ville = await lireVilleParSlug(villeSlug);
    if (!ville) return { ...vide, style };

    const rang = Math.max(Math.floor(page) || 1, 1);
    // ⚠️ LA VILLE ET LE STYLE SONT FILTRÉS EN BASE (passe
    // « performance ») : cette page ne charge plus le catalogue entier
    // pour en garder une poignée. `prioriserClics` garde le
    // comportement d'origine — une page de référencement montre les
    // tatoueurs LES PLUS CONSULTÉS de la ville, pas un tirage.
    const { tatoueurs, demonstration, total } = await listerTatoueurs({
      style,
      slugVille: villeSlug,
      prioriserClics: true,
      limite: CARTES_PAR_PAGE,
      decalage: (rang - 1) * CARTES_PAR_PAGE,
    });
    return { style, ville, demonstration, tatoueurs, total, page: rang };
  }
);
