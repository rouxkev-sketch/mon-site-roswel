/**
 * LA LIGNE DE RÉSULTATS (refonte nº 140)
 * =======================================
 * Sous la barre fixe, au-dessus des cartes. C'est ELLE qui dit la
 * recherche en cours — la pilule de la barre, elle, dit toujours
 * « Recherche » (nº 140-§6).
 *
 * SANS RECHERCHE ACTIVE :
 *
 *    Explorer toutes les créations
 *
 *  — le titre seul, AUCUN sous-titre : la page invite, elle ne rend
 *  pas compte d'une question que personne n'a posée.
 *
 * AVEC UNE RECHERCHE ACTIVE :
 *
 *    Réalisme                        Lyon
 *    20 créations · Lyon 5 km       20 créations
 *
 *  — le titre est CE QUI A ÉTÉ CHERCHÉ, le sous-titre porte le
 *  compte. LA RÈGLE DU TITRE : le QUOI l'emporte — « Flashs ·
 *  Réalisme » (catégorie + style), « Tous les flashs » (catégorie
 *  seule), « Réalisme » (style seul) ; un LIEU SEUL devient lui-même
 *  le titre (« Lyon ») ; quand les deux existent, le quoi est le
 *  titre et le lieu rejoint le sous-titre, derrière le compte. La
 *  règle vit dans IndexTatoueurs (`titreEtSousTitre`).
 */
export function LigneResultats({
  titre,
  sousTitre,
  balise = "h1",
}: {
  /** « Explorer toutes les créations », ou ce qui a été cherché.
      ⚠️ UN NŒUD depuis la nº 249-§3 : sur « Ma sélection », le titre
      est aussi LE CONTRÔLE (il ouvre le menu). L'écriture — les
      classes, la disposition — ne change pas d'un pixel. */
  titre: React.ReactNode;
  /** « 20 créations · Lyon 5 km » — null sans recherche active. */
  sousTitre: string | null;
  /** La balise du titre — `h1` partout, sauf le SECOND titre de « Ma
      sélection » (nº 249-§3) : le titre inactif est un contrôle de
      même écriture, pas le titre de la page — une page n'a qu'un h1.
      Un choix de SÉMANTIQUE, jamais d'apparence : mêmes classes. */
  balise?: "h1" | "h2";
}) {
  const Titre = balise;
  return (
    //  ⚠️ NOMMÉ (nº 171) : la garantie de globals.css vise ce titre
    //  pour qu'aucune bascule ne puisse l'effacer.
    <div data-titre-mosaique="" className="pt-6 pb-5 sm:pt-8 sm:pb-6">
      <Titre className="text-[clamp(1.25rem,2.4vw,1.65rem)] font-bold leading-tight text-sombre-texte">
        {titre}
      </Titre>
      {sousTitre && (
        <p className="mt-1.5 text-[15.5px] sm:text-[16px] text-sombre-texte-doux">
          {sousTitre}
        </p>
      )}
    </div>
  );
}
