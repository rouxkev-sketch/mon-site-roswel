/**
 * LA LIGNE DE RÉSULTATS
 * =====================
 * Sous la barre fixe, au-dessus des cartes. Elle dit, en deux lignes,
 * ce qu'on est en train de regarder :
 *
 *    Réalisme                       Tous les tatoueurs
 *    Lyon · 14 tatoueurs            Partout · 14 tatoueurs
 *
 * Ligne 1 — GRANDE ET GRASSE, c'est le titre de la page (h1) : LE
 * STYLE choisi, seul (« Réalisme ») — c'est lui qu'on est venu
 * comparer. Sans style choisi : « Tous les tatoueurs ».
 *
 * Ligne 2 — la localité et le compte, réunis d'un point médian :
 * « Lyon · 14 tatoueurs ». Un cran sous le titre (plus petit, gris
 * doux), mais assez grande pour se lire sans effort.
 */
export function LigneResultats({
  lieu,
  titre,
  nombre,
}: {
  /** « Partout » (aucun lieu choisi), « Allemagne » ou « Lyon »
      (SANS le rayon). */
  lieu: string;
  /** « Tous les tatoueurs » ou le style choisi (« Réalisme »). */
  titre: string;
  nombre: number;
}) {
  return (
    <div className="pt-6 pb-5 sm:pt-8 sm:pb-6">
      <h1 className="text-[clamp(1.25rem,2.4vw,1.65rem)] font-bold leading-tight text-sombre-texte">
        {titre}
      </h1>
      <p className="mt-1.5 text-[15.5px] sm:text-[16px] text-sombre-texte-doux">
        {lieu} · {nombre} tatoueur{nombre > 1 ? "s" : ""}
      </p>
    </div>
  );
}
