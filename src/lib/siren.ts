/**
 * VÉRIFICATION DU SIREN
 * ---------------------
 * Interroge l'annuaire public des entreprises de l'État
 * (recherche-entreprises.api.gouv.fr, construit sur les données
 * Sirene de l'INSEE — gratuit, sans clé, officiel).
 *
 * On vérifie : l'entreprise existe (SIREN à 9 chiffres), elle est
 * active, et on récupère le nom légal + la date de création (pour
 * le score d'ancienneté). La cohérence du nom est INDICATIVE :
 * c'est l'admin qui tranche avec sa case à cocher.
 */

/**
 * L'adresse de l'annuaire public des entreprises (gratuit, sans clé).
 * UN SEUL endroit pour cette adresse : la vérification d'un SIREN
 * (ici) et la collecte des prospects (src/lib/sirene-collecte.ts)
 * interrogent le même service.
 */
export const URL_ANNUAIRE_ENTREPRISES =
  "https://recherche-entreprises.api.gouv.fr/search";

export type ResultatSiren =
  | {
      etat: "verifie";
      nomLegal: string;
      dateCreation: string | null; // "2016-03-01"
      nomCoherent: boolean;
    }
  | { etat: "introuvable" } // aucune entreprise avec ce SIREN
  | { etat: "inactif"; nomLegal: string } // entreprise cessée
  | { etat: "reseau_indisponible" }; // annuaire injoignable : on réessaiera

/** Ne garde que les chiffres ("552 100 554" → "552100554") */
export function nettoyerSiren(siren: string): string {
  return siren.replace(/\D/g, "");
}

/** Comparaison souple de deux noms (accents/majuscules/ponctuation ignorés) */
function simplifier(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function verifierSiren(
  siren: string,
  nomAffiche: string
): Promise<ResultatSiren> {
  const propre = nettoyerSiren(siren);
  if (propre.length !== 9) return { etat: "introuvable" };

  try {
    const reponse = await fetch(
      `${URL_ANNUAIRE_ENTREPRISES}?q=${propre}&page=1&per_page=1`,
      { headers: { accept: "application/json" } }
    );
    if (!reponse.ok) return { etat: "reseau_indisponible" };

    const donnees = (await reponse.json()) as {
      results?: Array<{
        siren?: string;
        nom_complet?: string;
        nom_raison_sociale?: string;
        date_creation?: string;
        etat_administratif?: string; // "A" = entreprise active
      }>;
    };

    const entreprise = donnees.results?.[0];
    if (!entreprise || entreprise.siren !== propre) {
      return { etat: "introuvable" };
    }

    const nomLegal =
      entreprise.nom_complet ?? entreprise.nom_raison_sociale ?? "";

    if (entreprise.etat_administratif !== "A") {
      return { etat: "inactif", nomLegal };
    }

    // Cohérence indicative : un mot commun entre les deux noms suffit
    const motsAffiche = new Set(simplifier(nomAffiche).split(" "));
    const nomCoherent = simplifier(nomLegal)
      .split(" ")
      .some((mot) => mot.length >= 3 && motsAffiche.has(mot));

    return {
      etat: "verifie",
      nomLegal,
      dateCreation: entreprise.date_creation ?? null,
      nomCoherent,
    };
  } catch {
    return { etat: "reseau_indisponible" };
  }
}
