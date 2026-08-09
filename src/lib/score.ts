import {
  PASTILLES,
  SCORE_ANCIENNETE,
  SCORE_GOOGLE,
  SCORE_INSTAGRAM,
  SCORE_PROSPECT_MAXIMUM,
} from "@/config/roswel";
import { anneesExistence } from "@/lib/villes";

/**
 * CALCUL DU SCORE DE CONFIANCE (sur 100)
 * --------------------------------------
 * Trois composantes : avis Google (45) + ancienneté de l'entreprise
 * (30, via la date de création renvoyée par l'annuaire Sirene à la
 * vérification du SIREN) + Instagram (25).
 * Toutes les valeurs viennent des grilles du fichier de réglages
 * central (src/config/roswel.ts) : modifier une grille là-bas change
 * automatiquement tous les scores calculés ici.
 */

/** Score Instagram sur 25 : croise abonnés (lignes) × publications (colonnes) */
export function calculerScoreInstagram(
  abonnes: number | null | undefined,
  publications: number | null | undefined
): number {
  if (abonnes == null || publications == null) return 0;

  // Colonne : le dernier palier de publications atteint (0, 30, 150…)
  const paliers = SCORE_INSTAGRAM.paliersPublications;
  let colonne = 0;
  for (let i = 0; i < paliers.length; i += 1) {
    if (publications >= paliers[i]) colonne = i;
  }

  // Ligne : la grille est triée du plus grand nombre d'abonnés au plus
  // petit ; on prend la première ligne dont le seuil est atteint.
  const ligne = SCORE_INSTAGRAM.grille.find((l) => abonnes >= l.abonnesMin);
  return ligne ? ligne.points[colonne] : 0;
}

/** Score avis Google sur 45 : croise note (lignes) × nombre d'avis (colonnes) */
export function calculerScoreGoogle(
  note: number | null | undefined,
  nombreAvis: number | null | undefined
): number {
  // Sans avis (ou sans note), aucun point
  if (note == null || nombreAvis == null || nombreAvis < 1) return 0;

  const paliers = SCORE_GOOGLE.paliersNbAvis;
  let colonne = 0;
  for (let i = 0; i < paliers.length; i += 1) {
    if (nombreAvis >= paliers[i]) colonne = i;
  }

  const ligne = SCORE_GOOGLE.grille.find((l) => note >= l.noteMin);
  return ligne ? ligne.points[colonne] : 0;
}

/** Points d'ancienneté pour un nombre d'années d'existence donné */
export function pointsAnciennete(annees: number): number {
  const palier = SCORE_ANCIENNETE.paliers.find((p) => annees >= p.ansMin);
  return palier ? palier.points : 0;
}

/**
 * Score ancienneté sur 30 : années d'existence de l'entreprise,
 * calculées depuis la date de création renvoyée par l'annuaire
 * Sirene (jamais saisie à la main). Sans date vérifiée : 0 point.
 */
export function calculerScoreAnciennete(
  dateCreation: string | null | undefined
): number {
  if (!dateCreation) return 0;
  return pointsAnciennete(anneesExistence(dateCreation));
}

/** Score total sur 100 = avis Google (45) + ancienneté (30) + Instagram (25) */
export function calculerScoreTotal(
  abonnes: number | null | undefined,
  publications: number | null | undefined,
  note: number | null | undefined,
  nombreAvis: number | null | undefined,
  dateCreationEntreprise: string | null | undefined
): number {
  return (
    calculerScoreInstagram(abonnes, publications) +
    calculerScoreGoogle(note, nombreAvis) +
    calculerScoreAnciennete(dateCreationEntreprise)
  );
}

/**
 * SCORE D'UN PROSPECT — sur 75, jamais sur 100
 * --------------------------------------------
 * Un artisan DÉMARCHÉ (avant toute inscription) n'a pas encore relié
 * son compte Instagram, et aucune API ne permet de récupérer ses
 * abonnés automatiquement. Les 25 points Instagram sont donc
 * INACCESSIBLES à ce stade : les compter dans un total sur 100
 * reviendrait à annoncer un score volontairement rabaissé — un
 * artisan qui vaut 90 s'en verrait annoncer 65.
 *
 * On calcule donc le score des prospects sur ce qui est réellement
 * vérifiable : les avis Google (45) + l'ancienneté de l'entreprise
 * au répertoire Sirene (30) = 75 points. Les 25 points Instagram
 * restants ne sont pas « manquants » : ils sont À GAGNER le jour où
 * l'artisan active sa fiche.
 *
 * `calculerScoreTotal` (sur 100) reste inchangé et continue de servir
 * aux VRAIES fiches, les seules où Instagram est renseigné.
 */
export function calculerScoreProspect(
  note: number | null | undefined,
  nombreAvis: number | null | undefined,
  dateCreationEntreprise: string | null | undefined
): { points: number; maximum: number } {
  return {
    points:
      calculerScoreGoogle(note, nombreAvis) +
      calculerScoreAnciennete(dateCreationEntreprise),
    maximum: SCORE_PROSPECT_MAXIMUM,
  };
}

/**
 * La pastille correspondant à un score : « top » (badge
 * « Excellence »), « recommande » (badge « Recommandé »), ou null —
 * dans ce cas aucun badge de niveau (jamais de badge dévalorisant).
 */
export function determinerPastille(
  scoreTotal: number
): "top" | "recommande" | null {
  if (scoreTotal >= PASTILLES.top.seuil) return "top";
  if (scoreTotal >= PASTILLES.recommande.seuil) return "recommande";
  return null;
}
