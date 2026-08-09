/**
 * LA CASCADE « MÉTIER · SERVICES » DE LA FICHE SMARTPHONE (< 560 px)
 * ==================================================================
 *
 * La ligne d'intitulé de la première section doit se replier en TROIS
 * temps, dans cet ordre strict :
 *
 *   ÉTAPE 1 — tout sur une seule ligne :
 *             icône + « Métier · Services » + pastilles + chevron ;
 *   ÉTAPE 2 — si la place manque : on RETIRE « · Services », et la
 *             ligne redevient : icône + « Métier » + pastilles +
 *             chevron. Cette étape ne doit JAMAIS être sautée ;
 *   ÉTAPE 3 — seulement si l'étape 2 ne suffit toujours pas : les
 *             pastilles descendent sur une deuxième ligne, et
 *             « · Services » revient sur la première.
 *
 * POURQUOI CE CALCUL PLUTÔT QU'UNE MESURE DANS LE NAVIGATEUR
 * ----------------------------------------------------------
 * Aucune règle CSS ne sait effacer un mot en fonction de la largeur du
 * TEXTE qui l'entoure : `flex-wrap` seul ne peut donc produire que deux
 * états sur trois (l'étape 2 est systématiquement sautée). Et une
 * mesure JavaScript après rendu provoque un saut visuel à l'ouverture
 * de la fiche.
 *
 * La solution : les métiers forment une liste FERMÉE de huit entrées
 * (`METIERS` dans `src/config/roswel.ts`). On peut donc connaître à
 * l'avance, au pixel près, la largeur de chaque pastille, et calculer
 * côté serveur les DEUX largeurs de fenêtre auxquelles la ligne bascule
 * d'une étape à la suivante. Le composant émet alors deux media queries
 * sur mesure : le navigateur choisit la bonne étape dès le premier
 * tracé, sans une ligne de JavaScript et sans le moindre saut.
 *
 * LES LARGEURS SONT MESURÉES, PAS ESTIMÉES : elles ont été relevées
 * dans le navigateur avec la police réellement servie
 * (Geist, « Geist Fallback », system-ui, sans-serif). Si la police ou
 * une taille de texte change, il faut les relever à nouveau.
 */

/** Largeur du TEXTE de chaque pastille, en 13 px graisse 500 (mesurée) */
const LARGEURS_PASTILLE: Record<string, number> = {
  Plombier: 54.52,
  Chauffagiste: 77.75,
  Électricien: 64.58,
  Serrurier: 53.61,
  Vitrier: 37.33,
  Peintre: 43.63,
  Menuisier: 59.48,
  Maçon: 41.08,
};

/**
 * Largeur de repli pour un libellé inconnu (métier ajouté sans que la
 * table ci-dessus soit mise à jour) : 7 px par caractère, soit un peu
 * plus large que le pire cas mesuré (« Chauffagiste » : 6,5 px/car.).
 * Surestimer est le bon côté de l'erreur — on bascule à l'étape
 * suivante un peu trop tôt plutôt que de tronquer une pastille.
 */
const LARGEUR_PAR_CARACTERE = 7;

/** Largeur du texte « Métier » en gras, 15 px (mesurée) */
const LARGEUR_METIER = 48.14;
/** Largeur du texte complet « Métier · Services », 15 px (mesurée) */
const LARGEUR_METIER_SERVICES = 117.56;

/* La géométrie de la ligne, en pixels — elle vient des classes du
   composant, et doit le suivre si elles changent. */
/** `px-5` de chaque côté du corps de la fiche */
const MARGES_CORPS = 40;
/** L'icône clé (20) + son écart avec le texte (10) */
const ICONE = 30;
/** L'écart entre l'intitulé et la première pastille (`gap-x-2.5`) */
const ECART_AVANT_PASTILLES = 10;
/** L'écart entre deux pastilles (`gap-2`) */
const ECART_ENTRE_PASTILLES = 8;
/** Le cadre d'une pastille : `px-2.5` (20) + 1 px de bordure de chaque côté */
const CADRE_PASTILLE = 22;
/** Le chevron (18) et son écart avec l'intitulé (`gap-2`) */
const CHEVRON = 26;

/** La largeur totale occupée par le bloc des pastilles */
function largeurPastilles(pastilles: string[]): number {
  if (pastilles.length === 0) return 0;
  const boites = pastilles.reduce(
    (total, pastille) =>
      total +
      (LARGEURS_PASTILLE[pastille] ?? pastille.length * LARGEUR_PAR_CARACTERE) +
      CADRE_PASTILLE,
    0
  );
  return boites + ECART_ENTRE_PASTILLES * (pastilles.length - 1);
}

export type CascadeMetier = {
  /** La classe unique à poser sur la ligne d'intitulé */
  classe: string;
  /** Le CSS à injecter (deux media queries) */
  css: string;
  /** Largeur de fenêtre à partir de laquelle l'étape 1 s'applique */
  seuilEtape1: number;
  /** Largeur de fenêtre à partir de laquelle l'étape 2 s'applique */
  seuilEtape2: number;
};

/**
 * Calcule les deux seuils de bascule et le CSS correspondant.
 *
 * @param pastilles  les libellés de métier de l'artisan
 * @param avecChevron  vrai si la section est dépliable (l'artisan a une
 *                     présentation) : le chevron occupe alors de la place
 */
export function cascadeMetierServices(
  pastilles: string[],
  avecChevron: boolean
): CascadeMetier {
  const fixe =
    MARGES_CORPS +
    ICONE +
    (pastilles.length > 0 ? ECART_AVANT_PASTILLES + largeurPastilles(pastilles) : 0) +
    (avecChevron ? CHEVRON : 0);

  // `Math.ceil` : à la largeur du seuil, la ligne tient tout juste ;
  // en dessous d'un pixel, elle ne tient plus.
  const seuilEtape1 = Math.ceil(fixe + LARGEUR_METIER_SERVICES);
  const seuilEtape2 = Math.ceil(fixe + LARGEUR_METIER);

  // Un nom de classe DÉTERMINÉ PAR LES SEUILS : deux artisans aux mêmes
  // métiers partagent la même règle, sans doublon ni collision.
  const classe = `metier-cascade-${seuilEtape2}-${seuilEtape1}`;

  /* État de base = ÉTAPE 3 (la plus repliée) : les pastilles peuvent
     passer à la ligne, « · Services » est affiché.
     Puis on REMONTE la cascade avec deux media queries :
       — à partir de `seuilEtape2` : tout sur une ligne, sans
         « · Services » (ÉTAPE 2) ;
       — à partir de `seuilEtape1` : « · Services » revient (ÉTAPE 1).
     `flex-shrink: 0` sur le bloc de pastilles n'est posé QUE dans les
     états sur une ligne : à l'étape 3 le bloc doit au contraire pouvoir
     se rétrécir pour replier ses pastilles entre elles. */
  const css =
    `.${classe}{flex-wrap:wrap}` +
    `@media(min-width:${seuilEtape2}px){` +
    `.${classe}{flex-wrap:nowrap}` +
    `.${classe} .metier-pastilles{flex-shrink:0}` +
    `.${classe} .metier-services{display:none}` +
    `}` +
    `@media(min-width:${seuilEtape1}px){` +
    `.${classe} .metier-services{display:inline}` +
    `}`;

  return { classe, css, seuilEtape1, seuilEtape2 };
}
