import { PASTILLES } from "@/config/roswel";
import { anneesExistence } from "@/lib/villes";

// Le gris des contours (badge SIREN et cercles des boutons de carte)
export const COULEUR_CONTOUR_BADGE = "#9AA1AC";

/** Les infos du badge de niveau, ou null si score < 40 (jamais de badge dévalorisant) */
export function infosNiveau(code: string | null) {
  if (code === "top") return PASTILLES.top;
  if (code === "recommande") return PASTILLES.recommande;
  return null;
}

/**
 * BADGE DE NIVEAU — coloré, coche blanche :
 * « Très recommandé » (rose, ≥ 75) ou « Recommandé » (bleu, 40-74).
 * Utilisé sur la fiche artisan ; sur les cartes de résultats, le
 * niveau s'affiche en ONGLET sous la carte (voir CarteArtisan).
 */
export function BadgeNiveau({ code }: { code: string | null }) {
  const infos = infosNiveau(code);
  if (!infos) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
      style={{ backgroundColor: infos.couleur }}
    >
      <span aria-hidden>✓</span>
      <span className="truncate">{infos.label}</span>
    </span>
  );
}

/**
 * BADGE « SIREN VÉRIFIÉ · X ANS D'ANCIENNETÉ » — texte simple, SANS
 * encadré. L'ancienneté vient de la date de création de l'entreprise
 * renvoyée par l'annuaire officiel (API Sirene) à la vérification du
 * SIREN : recalculée à chaque affichage, jamais saisie à la main.
 * Entreprise de moins d'un an : « SIREN vérifié · Créée en [année] ».
 * SIREN non vérifié : aucun badge.
 */
export function BadgeSiren({
  verifie,
  dateCreation,
}: {
  verifie: boolean;
  dateCreation: string | null;
}) {
  if (!verifie) return null;
  const annees = dateCreation ? anneesExistence(dateCreation) : 0;
  let texte: string;
  if (annees >= 1) {
    texte = `SIREN vérifié · ${annees === 1 ? "1 an" : `${annees} ans`} d'ancienneté`;
  } else if (dateCreation) {
    texte = `SIREN vérifié · Créée en ${new Date(dateCreation).getFullYear()}`;
  } else {
    texte = "SIREN vérifié";
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-1 text-[10.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-[#3F4756]">
      <span aria-hidden className="font-bold">✓</span>
      <span className="truncate">{texte}</span>
    </span>
  );
}
