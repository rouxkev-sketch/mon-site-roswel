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
  degagementConstant = false,
  airEnBas = false,
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
  /**
   * §1 (nº 301) — LE TITRE GARDE LE MÊME DÉGAGEMENT, AVEC OU SANS
   * SOUS-TITRE. Sur le WEB uniquement, et sur « Ma sélection »
   * uniquement — c'est elle qui demande ce drapeau.
   * ------------------------------------------------------------------
   * LE DÉFAUT : le dégagement sous le titre vaut 54 px quand un
   * sous-titre est écrit (6 px d'écart + 24 px de sous-titre + 24 px
   * de rembourrage) et 24 px quand il n'y en a pas. Sur « Ma
   * sélection », le sous-titre n'existe QUE lorsqu'un filtre est en
   * cours : le titre montait donc de 30 px dès qu'on retirait le
   * filtre, et la page sautait.
   * LE REMÈDE : la ligne du sous-titre est RÉSERVÉE — le même
   * paragraphe, les mêmes classes, une espace insécable, invisible aux
   * lecteurs d'écran (`aria-hidden`). La hauteur est donc identique au
   * pixel près, sans qu'aucune valeur soit recopiée.
   * ⚠️ RIEN N'EST RÉSERVÉ AILLEURS : la page de recherche ne passe pas
   * ce drapeau, son rythme ne change pas d'un pixel.
   */
  degagementConstant?: boolean;
  /**
   * §2 (nº 325) — DE L'AIR SOUS LE BLOC DE TÊTE. Sur le WEB
   * uniquement, et sur « Ma sélection » uniquement — c'est elle qui
   * demande ce drapeau.
   * ------------------------------------------------------------------
   * LE DÉFAUT : sur « Ma sélection », le bloc de tête (le titre et son
   * compte) touchait presque la première photo de profil — 24 px les
   * séparaient, et rien d'autre : le bloc qui suit ne pose aucune
   * marge, ce rembourrage EST tout l'écart. Le titre d'une page et le
   * premier visage de la liste se lisaient comme un seul bloc.
   * LA VALEUR : 40 px sur le web (`lg:pb-10`), contre 24. Le doigt
   * garde ses 20 px — le drapeau n'ouvre qu'un cran `lg:`.
   *
   * ⚠️ POURQUOI UN DRAPEAU ET PAS UNE VALEUR CHANGÉE ICI. Ce composant
   * sert AUSSI la page de recherche (IndexTatoueurs, deux appels) :
   * élargir le rembourrage pour tout le monde déplacerait la mosaïque
   * de l'accueil, que personne n'a demandé de toucher. Même procédé
   * que `degagementConstant` juste au-dessus, et pour la même raison.
   *
   * ⚠️ ET IL VAUT POUR LES DEUX ONGLETS. « Ma sélection » ne monte
   * qu'UN SEUL bloc de tête, dont le titre bascule entre « Ma
   * sélection de portfolios » et « Ma sélection de photos » : l'air
   * posé ici se voit donc sur les favoris comme sur les portfolios.
   * C'est dit au propriétaire, à lui de trancher s'il n'en veut que
   * d'un côté — auquel cas ce drapeau deviendrait conditionnel à
   * l'onglet, ce qui est une ligne de plus, pas une refonte.
   */
  airEnBas?: boolean;
}) {
  const Titre = balise;
  return (
    //  ⚠️ NOMMÉ (nº 171) : la garantie de globals.css vise ce titre
    //  pour qu'aucune bascule ne puisse l'effacer.
    <div
      data-titre-mosaique=""
      data-air-en-bas={airEnBas ? "" : undefined}
      className={`pt-6 pb-5 sm:pt-8 sm:pb-6 ${airEnBas ? "lg:pb-10" : ""}`}
    >
      <Titre className="text-[clamp(1.25rem,2.4vw,1.65rem)] font-bold leading-tight text-sombre-texte">
        {titre}
      </Titre>
      {sousTitre ? (
        <p className="mt-1.5 text-[15.5px] sm:text-[16px] text-sombre-texte-doux">
          {sousTitre}
        </p>
      ) : (
        degagementConstant && (
          //  §1 (nº 301) — LA LIGNE RÉSERVÉE : mêmes classes, donc
          //  MÊME hauteur, sans qu'aucun nombre soit écrit ici. Web
          //  seulement (`hidden lg:block`), muette pour les lecteurs
          //  d'écran, et sans le moindre pixel peint.
          <p
            aria-hidden="true"
            data-degagement-reserve=""
            className="hidden lg:block mt-1.5 text-[15.5px] sm:text-[16px] text-sombre-texte-doux"
          >
            &nbsp;
          </p>
        )
      )}
    </div>
  );
}
