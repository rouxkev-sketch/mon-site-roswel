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
/**
 * §1 (nº 707) — LE RYTHME DU BLOC DE TITRE, écrit UNE fois.
 * Le squelette de chargement (`SquelettesDePage`) doit poser sa barre
 * grise EXACTEMENT là où ce bloc pose le titre — sinon la page saute
 * au remplissage. Plutôt que d'y recopier ces classes (et diverger à
 * la première retouche, piège nº 378), elles vivent ici, et les deux
 * écrans les lisent.
 */
export const RYTHME_TITRE_RESULTATS = "pt-6 pb-5 sm:pt-8 sm:pb-6 mobile:pt-3";

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
      className={`${RYTHME_TITRE_RESULTATS} ${
        airEnBas ? "lg:pb-10" : ""
      }${masqueAuDoigt ? " mobile:hidden" : ""}`}
    >
      <Titre className="text-[clamp(1.25rem,2.4vw,1.65rem)] mobile:text-[17px] font-bold leading-tight text-sombre-texte">
        {titre}
      </Titre>
      {/*  ██ §1 (nº 628) — LE SOUS-TITRE : PLUS SERRÉ AU DOIGT, PLUS
           GRAND AU WEB, ET LES DEUX SANS SE MARCHER DESSUS ██
           ------------------------------------------------------------
           CE QUI CHANGE, ET LES DEUX MESURES QUI LE DISENT (prises à
           l'écran, EN ENCRE et non en boîtes — la leçon de la nº 584 :
           haut de l'encre de la seconde ligne moins bas de l'encre de
           la première, jambages compris) :
            · AU DOIGT — l'air entre « Réalisations · Anime & Manga » et
              « 2 portfolios » valait 13,75 px d'encre pour 6 px de
              marge. La marge passe à 4 (`mt-1`), l'air d'encre à
              11,75. Le corps ne bouge pas : 15,5 px, comme depuis la
              nº 539 ;
            · AU WEB — le sous-titre passe de 16 à VINGT px. La nº 628
              l'avait monté à 17, et le propriétaire n'a rien vu : UN
              pixel ne se voit pas, c'est le juste verdict de son œil.
              VINGT, c'est le corps du TITRE au plancher de son `clamp`
              (1,25rem) — la valeur haute de ce bloc, pas un nombre
              choisi au jugé. Le titre, lui, ne bouge pas d'un pixel
              (son `clamp` est intact, 26,4 px sur un écran large) :
              l'écart de hiérarchie tombe de 1,65 à 1,32, et ce sont la
              GRAISSE et la COULEUR qui le tiennent désormais — un gris
              doux en graisse normale sous un blanc gras.
           ⚠️ AUCUNE CLASSE DE BASE, DEUX VARIANTES QUI S'EXCLUENT, et
           c'est tout le procédé (nº 616) : `mobile:` est le VRAI
           appareil (nº 60), `not-mobile:` est son exact complément. Les
           deux ne peuvent pas s'appliquer au même élément — donc AUCUN
           conflit à départager par l'ordre de la feuille (piège 389),
           là où l'échelle « corps de base + palier `sm:` » en laissait
           un. (Et aucune classe n'est écrite en toutes lettres dans
           cette note : Tailwind lit les commentaires — piège nº 472.)
           ⚠️ CE QUE LE DOIGT PERD, ET C'EST DIT : le palier `sm:` qui
           lui donnait 16 px EN PAYSAGE (un téléphone couché dépasse
           640 px) n'existe plus — il garde 15,5 px dans les deux sens,
           soit un demi-pixel de moins couché. Le portrait, lui, ne
           bouge pas.
           ⚠️ ET LA LIGNE RÉSERVÉE JUSTE EN DESSOUS PORTE LES MÊMES
           CLASSES, À LA LETTRE (nº 301) : sans quoi la hauteur du bloc
           changerait selon qu'il y a un sous-titre ou non, et la page
           sauterait — c'est très exactement ce que ce mécanisme
           empêche. */}
      {sousTitre ? (
        <p className="mobile:mt-1 not-mobile:mt-1.5 mobile:text-[15.5px] not-mobile:text-[20px] text-sombre-texte-doux">
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
            //  §1 (nº 628) — LES MÊMES CLASSES QUE LE SOUS-TITRE, mises
            //  à jour avec lui : voir sa note juste au-dessus. Elles se
            //  recopient, et c'est la faiblesse assumée du procédé
            //  depuis la nº 301 — une divergence se verrait aussitôt,
            //  puisque c'est la hauteur du bloc qui sauterait.
            className="mobile:mt-1 not-mobile:mt-1.5 mobile:text-[15.5px] not-mobile:text-[20px] text-sombre-texte-doux"
          >
            &nbsp;
          </p>
        )
      )}
    </div>
  );
}
