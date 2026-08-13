import { entreesExplorer } from "@/config/tatouage";

/**
 * LES DEUX FILTRES DE « MA SÉLECTION » — L'ADRESSE EST LA VÉRITÉ
 * ==================================================================
 * (passe nº 245-§3)
 *
 * DEUX MENUS, DEUX PARAMÈTRES, UNE SEULE ÉCRITURE. Les menus vivent
 * dans la BARRE (EnTeteTatouage) et le contenu qu'ils filtrent vit
 * dans la PAGE (PageFavoris) : deux composants frères, qui ne peuvent
 * pas se passer un état de la main à la main. La source commune est
 * donc L'ADRESSE — comme tout depuis la nº 191 — lue par les deux et
 * écrite par un seul, via le magasin d'adresse (lib/adresse-courante),
 * qui surveille déjà `pushState`, `replaceState` et `popstate`.
 *
 * ⚠️ CE MODULE N'EST PAS « use client » : `entreesDuFiltre` est PURE
 * et la page serveur l'appelle pour bâtir les deux listes. Les deux
 * autres fonctions touchent `window` — elles ne sont appelées que
 * depuis des composants clients, et se gardent d'elles-mêmes.
 *
 * ⚠️ `replaceState`, PAS `pushState` : changer de filtre ne doit pas
 * empiler des entrées d'historique qu'il faudrait ensuite dépiler une
 * à une pour revenir d'où l'on vient. L'adresse porte le filtre —
 * c'est tout ce dont la restitution a besoin : la mémoire de position
 * est indexée sur `chemin + recherche` (MemoireNavigation), donc
 * revenir d'une fiche rend le même filtre ET la même place, sans une
 * ligne de plus.
 */

/** « Tous les styles » — la première entrée, celle qui remet tout. */
export const TOUS_LES_STYLES = "tous";

/** Les deux paramètres d'adresse, nommés une fois. */
export const PARAM_JAIME = "jaime";
export const PARAM_SUIVIS = "suivis";

export type CleFiltre = typeof PARAM_JAIME | typeof PARAM_SUIVIS;

/** Le style choisi pour un menu, lu dans l'adresse (ou « tous »). */
export function filtreCourant(cle: CleFiltre, recherche?: string): string {
  const params = new URLSearchParams(
    recherche ?? (typeof window === "undefined" ? "" : window.location.search)
  );
  return params.get(cle) || TOUS_LES_STYLES;
}

/** Poser un filtre dans l'adresse — sans entrée d'historique. */
export function poserFiltre(cle: CleFiltre, valeur: string): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!valeur || valeur === TOUS_LES_STYLES) params.delete(cle);
  else params.set(cle, valeur);
  const requete = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + (requete ? `?${requete}` : "")
  );
}

/**
 * LES ENTRÉES D'UN MENU — CALCULÉES, JAMAIS ÉCRITES (§3)
 * ------------------------------------------------------------------
 * On part de `entreesExplorer()` — LA source unique du menu des
 * styles du moteur, familles comprises — et on ne garde que les
 * styles RÉELLEMENT présents dans les données. L'ordre et les
 * libellés sont donc ceux du moteur, au mot près ; aucune seconde
 * liste n'existe.
 *  · un style d'une famille garde sa famille en sous-groupe, comme
 *    dans le menu du moteur ;
 *  · « Tous les styles » ouvre la liste ;
 *  · aucune entrée présente → on rend une liste VIDE, et l'appelant
 *    n'affiche pas le menu du tout.
 */
export type EntreeFiltre = {
  value: string;
  label: string;
  sousGroupe?: string;
  /** Combien d'éléments portent ce style — le menu l'annonce, comme
      celui du moteur annonce ses portfolios. */
  compte?: number;
};

export function entreesDuFiltre(
  comptesParStyle: Map<string, number>
): EntreeFiltre[] {
  if (comptesParStyle.size === 0) return [];
  const presentes: EntreeFiltre[] = [];
  for (const entree of entreesExplorer()) {
    if (entree.genre === "style") {
      const compte = comptesParStyle.get(entree.slug);
      if (compte) presentes.push({ value: entree.slug, label: entree.label, compte });
      continue;
    }
    for (const style of entree.styles) {
      const compte = comptesParStyle.get(style.slug);
      if (compte)
        presentes.push({
          value: style.slug,
          label: style.label,
          sousGroupe: entree.label,
          compte,
        });
    }
  }
  if (presentes.length === 0) return [];
  let total = 0;
  for (const compte of comptesParStyle.values()) total += compte;
  return [
    { value: TOUS_LES_STYLES, label: "Tous les styles", compte: total },
    ...presentes,
  ];
}
