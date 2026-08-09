/**
 * LA BARRE DE FRANCHISE — un seul endroit pour les couleurs
 * ----------------------------------------------------------
 * Vert tant qu'on est tranquille, orange à 70 %, rouge à 90 %, et
 * rouge plein au-delà de 100 %. Les seuils vivent dans
 * SEUILS_CONSOMMATION_GOOGLE (src/config/roswel.ts) ; ce composant ne
 * fait que traduire un niveau déjà décidé en couleur de la charte.
 *
 * Volontairement sans « use client » : la barre n'a aucun état, elle
 * s'affiche côté serveur avec le reste de la page.
 */

export type NiveauFranchise = "bon" | "attention" | "critique" | "depasse";

const COULEURS: Record<NiveauFranchise, string> = {
  bon: "bg-succes",
  attention: "bg-alerte",
  critique: "bg-erreur",
  depasse: "bg-erreur",
};

/** Un montant en euros, à la façon française : « 1,25 € ». */
export function euros(montant: number): string {
  return `${montant.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function BarreFranchise({
  part,
  niveau,
}: {
  /** Part consommée, entre 0 et 1 — peut dépasser 1. */
  part: number;
  niveau: NiveauFranchise;
}) {
  // La barre se remplit au plus à 100 % : au-delà, c'est le message
  // de dépassement qui parle, pas une barre qui déborderait.
  const largeur = Math.min(100, Math.max(0, part * 100));
  const pourcentage = Math.round(part * 100);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-2.5 rounded-full bg-fond-doux border border-bordure overflow-hidden"
        role="progressbar"
        aria-valuenow={pourcentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pourcentage} % de la franchise mensuelle consommée`}
      >
        <div
          className={`h-full rounded-full ${COULEURS[niveau]}`}
          style={{ width: `${largeur}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold tabular-nums shrink-0 w-12 text-right ${
          niveau === "bon" ? "text-encre-douce" : ""
        } ${niveau === "attention" ? "text-alerte" : ""} ${
          niveau === "critique" || niveau === "depasse" ? "text-erreur" : ""
        }`}
      >
        {pourcentage} %
      </span>
    </div>
  );
}
