"use client";

import {
  GROUPES_FILTRES,
  rayonRetenu,
  styleDuCatalogue,
} from "@/config/tatouage";
import { lieuDepuisParametres } from "@/lib/geocodage";
import { SLUGS_NATURES } from "@/lib/photos-tatoueur";
import type { CritèresTatouage } from "@/components/MoteurTatouage";

/**
 * LIRE LES CRITÈRES DANS L'ADRESSE — CÔTÉ NAVIGATEUR
 * ===================================================
 * (passe nº 159-§1 — pour que le RETOUR ARRIÈRE puisse relancer la
 * recherche de l'étape restaurée.)
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE. La même lecture se fait déjà côté
 * SERVEUR, dans src/app/(tatouage)/page.tsx — mais elle s'appuie sur
 * `src/lib/tatoueurs.ts`, qui importe le client Supabase de serveur :
 * impossible à charger dans le navigateur. On refait donc ici la
 * lecture, à l'identique, à partir des seules sources partagées (le
 * catalogue des styles, les filtres, les paliers de rayon, le
 * décodage de lieu).
 *
 * LA RÈGLE EST LA MÊME QU'AU SERVEUR : un paramètre inconnu est
 * IGNORÉ, jamais transformé en filtre. Une adresse bricolée à la main
 * ne doit pas vider la page — elle cherche simplement tout.
 */

/** Les slugs de filtre valides, tous groupes confondus. */
const SLUGS_FILTRES = new Set<string>(
  GROUPES_FILTRES.flatMap((groupe) =>
    groupe.options.map((option) => option.slug as string)
  )
);

export function criteresDepuisAdresse(requete: string): CritèresTatouage {
  const params = Object.fromEntries(new URLSearchParams(requete)) as Record<
    string,
    string
  >;
  const style = params.style && styleDuCatalogue(params.style) ? params.style : "";
  //  La NATURE n'est gardée que si elle est connue — comme le style.
  const nature =
    params.nature && SLUGS_NATURES.has(params.nature) ? params.nature : "";
  const lieu = lieuDepuisParametres(params);
  return {
    style,
    nature,
    lieu,
    rayonKm: rayonRetenu(Number(params.rayon)),
    exclure: (params.exclure ?? "")
      .split(",")
      .filter((slug) => slug && SLUGS_FILTRES.has(slug)),
  };
}

/** Deux jeux de critères décrivent-ils la même recherche ? On compare
    ce qui part vers la base, pas les objets : le lieu est une
    structure, et deux lectures d'une même adresse en font deux. */
export function memeRecherche(
  a: CritèresTatouage,
  b: CritèresTatouage
): boolean {
  return (
    a.style === b.style &&
    a.nature === b.nature &&
    a.rayonKm === b.rayonKm &&
    a.exclure.slice().sort().join(",") === b.exclure.slice().sort().join(",") &&
    (a.lieu?.intitule ?? "") === (b.lieu?.intitule ?? "") &&
    (a.lieu?.latitude ?? 0) === (b.lieu?.latitude ?? 0) &&
    (a.lieu?.longitude ?? 0) === (b.lieu?.longitude ?? 0)
  );
}
