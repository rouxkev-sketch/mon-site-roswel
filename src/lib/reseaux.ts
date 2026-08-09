/**
 * LE PSEUDO, EXTRAIT DE L'ADRESSE DU RÉSEAU
 * ==========================================
 * Les fiches affichent « @tattooLyon » à côté de l'icône Instagram ou
 * TikTok — le pseudo est déduit de l'adresse enregistrée, personne ne
 * le saisit. Repli PROPRE : si l'adresse ne permet pas d'en extraire
 * un (page de partage, chemin exotique…), on renvoie null et la fiche
 * affiche le nom du réseau tout court.
 */

/** Les premiers segments qui ne sont JAMAIS des pseudos. */
const SEGMENTS_GENERIQUES = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "share",
  "tag",
  "video",
  "music",
  "discover",
  "hashtag",
]);

export function pseudoDepuisLien(
  lien: string,
  reseau: "instagram" | "tiktok"
): string | null {
  try {
    const url = new URL(lien);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    // TikTok écrit le pseudo avec son arobase (« /@studio.enc ») —
    // on le cherche en priorité ; Instagram le met en tête de chemin.
    const brut = (
      (reseau === "tiktok" && segments.find((s) => s.startsWith("@"))) ||
      segments[0]
    ).replace(/^@/, "");

    if (!brut || SEGMENTS_GENERIQUES.has(brut.toLowerCase())) return null;
    // Un pseudo : lettres, chiffres, points, tirets bas — rien d'autre.
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(brut)) return null;
    return `@${brut}`;
  } catch {
    return null; // adresse illisible : pas de pseudo, pas d'erreur
  }
}
