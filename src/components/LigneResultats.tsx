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
  masqueAuDoigt = false,
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
   * SOUS-TITRE.
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
   *
   * ██ §1 (nº 507) — SON APPELANT A CHANGÉ, SA PORTÉE AUSSI ██
   * « Ma sélection » n'a plus de bloc de tête du tout depuis la nº 462
   * (l'air de la nº 445/463 l'a remplacé) : ce drapeau était donc
   * devenu ORPHELIN, plus personne ne le passait. C'est L'ACCUEIL SANS
   * RECHERCHE qui le reprend, parce que son sous-titre est supprimé
   * (nº 507-§1) et que son air, lui, doit rester.
   * ⚠️ ET LA RÉSERVE VAUT DÉSORMAIS À TOUTES LES LARGEURS. Elle était
   * bornée au web parce que « Ma sélection » ne sautait qu'au web ; la
   * garder ainsi rouvrirait le trou de 30 px entre 768 et 1024 px sur
   * un ORDINATEUR — là où le bloc de tête de l'accueil est bien
   * visible, son masquage ne visant que le VRAI appareil tactile
   * (`masqueAuDoigt`, nº 444). La réserve suit donc exactement le bloc
   * qu'elle sert : partout où il se voit, elle tient sa ligne ; là où
   * il n'existe pas, elle n'existe pas non plus.
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
  /**
   * §1 (nº 444) — LA PHRASE D'INTRODUCTION NE VIT PLUS AU DOIGT.
   * ------------------------------------------------------------------
   * DEMANDE DU PROPRIÉTAIRE : sur MOBILE, l'accueil sans recherche
   * n'affiche plus « Découvre ton prochain tatouage » ni son
   * sous-titre — les cartes commencent tout de suite. Sur ORDINATEUR,
   * la phrase reste telle quelle.
   * ⚠️ UN DRAPEAU, ET UN SEUL APPELANT : l'accueil SANS recherche
   * (IndexTatoueurs). Les titres de recherche, ceux de « Ma
   * sélection » et le reste du site ne le passent pas — rien ne bouge
   * chez eux, pas même d'un pixel. C'est le procédé de
   * `degagementConstant` (nº 301) et `airEnBas` (nº 325), et pour la
   * même raison : ce composant sert plusieurs surfaces.
   * ⚠️ `mobile:hidden` — LE VRAI APPAREIL, pas une largeur de fenêtre
   * (la variante de globals.css, `[data-appareil="mobile"]`) : une
   * fenêtre d'ordinateur rétrécie garde donc sa phrase, comme partout
   * ailleurs dans le site.
   * ⚠️ ET C'EST BIEN `display` : la garantie nº 171 (globals.css) force
   * l'opacité et la visibilité de ce bloc pour qu'aucune bascule ne
   * puisse l'effacer — elle ne dit rien de `display`, que cette
   * variante seule gouverne. Le bloc entier part : titre, sous-titre
   * et son rembourrage — aucun blanc résiduel au-dessus des cartes.
   */
  masqueAuDoigt?: boolean;
}) {
  const Titre = balise;
  return (
    //  ⚠️ NOMMÉ (nº 171) : la garantie de globals.css vise ce titre
    //  pour qu'aucune bascule ne puisse l'effacer.
    <div
      data-titre-mosaique=""
      data-air-en-bas={airEnBas ? "" : undefined}
      /*  ██ §2 (nº 539) — AU DOIGT, LE TITRE EST PLUS PETIT ET MOINS BAS ██
           LES DEUX VALEURS D'AVANT, MESURÉES : l'air au-dessus valait
           24 px (le cran de base, `pt-6` — un téléphone en portrait est
           sous 640 px, `sm:pt-8` ne l'atteint donc pas), et le titre
           20 px (le PLANCHER du `clamp` : 2,4 % d'une largeur de
           téléphone fait moins de 10 px, le plancher gagne toujours).
           LES DEUX NOUVELLES : 12 px d'air, 17 px de titre.
           ⚠️ LA SÉPARATION SE FAIT PAR `mobile:`, ET C'EST LE POINT.
           Baisser le plancher du `clamp` ou le cran de base aurait
           emporté le WEB — une fenêtre d'ordinateur étroite retombe
           exactement sur ces deux mêmes valeurs. La variante `mobile:`
           est le VRAI APPAREIL (la règle du site depuis la nº 60),
           jamais une largeur : un ordinateur, si étroit soit-il, garde
           ses 24 px et son `clamp` intacts.
           ⚠️ ET ELLE TIENT EN PAYSAGE, ce qui n'allait pas de soi : un
           téléphone couché dépasse 640 px, donc `sm:pt-8` s'applique
           AUSSI. Les deux règles ont la même force (la variante
           d'appareil s'écrit avec `:where`, qui ne pèse rien) — c'est
           donc l'ORDRE dans la feuille produite qui tranche, et la
           variante d'appareil y est écrite APRÈS. Vérifié dans la
           feuille, pas supposé.
           ⚠️ CE COMPOSANT N'A QUE DEUX APPELANTS, tous deux dans
           IndexTatoueurs : l'accueil SANS recherche — qui ne se rend pas
           du tout au doigt (`masqueAuDoigt`) — et le titre de recherche,
           celui que le propriétaire vise. Au doigt, ces réglages ne
           touchent donc QUE lui.
           ⚠️ LE SOUS-TITRE NE CHANGE PAS, sur consigne : il reste à
           15,5 px. L'écart de corps se resserre, mais la hiérarchie
           tient par la GRAISSE et par la COULEUR. */
      className={`pt-6 pb-5 sm:pt-8 sm:pb-6 mobile:pt-3 ${
        airEnBas ? "lg:pb-10" : ""
      }${masqueAuDoigt ? " mobile:hidden" : ""}`}
    >
      <Titre className="text-[clamp(1.25rem,2.4vw,1.65rem)] mobile:text-[17px] font-bold leading-tight text-sombre-texte">
        {titre}
      </Titre>
      {sousTitre ? (
        <p className="mt-1.5 text-[15.5px] sm:text-[16px] text-sombre-texte-doux">
          {sousTitre}
        </p>
      ) : (
        degagementConstant && (
          //  §1 (nº 301) — LA LIGNE RÉSERVÉE : mêmes classes que le
          //  sous-titre juste au-dessus, donc MÊME hauteur, sans
          //  qu'aucun nombre soit écrit ici. Muette pour les lecteurs
          //  d'écran, et sans le moindre pixel peint.
          //  ⚠️ §1 (nº 507) — LA BORNE DE LARGEUR EST PARTIE : la
          //  réserve suit le bloc qu'elle sert, à toutes les largeurs
          //  (voir la note du drapeau, plus haut).
          <p
            aria-hidden="true"
            data-degagement-reserve=""
            className="mt-1.5 text-[15.5px] sm:text-[16px] text-sombre-texte-doux"
          >
            &nbsp;
          </p>
        )
      )}
    </div>
  );
}
