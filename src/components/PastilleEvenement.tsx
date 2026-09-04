import type { ComposantIcone } from "@/components/Icones";

/**
 * ██ LA PASTILLE D'ÉVÉNEMENT — LA FAMILLE, ÉCRITE UNE FOIS (nº 664) ██
 * ==================================================================
 * CE QU'ELLE REMPLACE, ET C'EST TOUT LE POINT DE LA PASSE. L'inventaire
 * de la nº 663 a compté NEUF endroits où le site dessine un rond teinté
 * avec un symbole dedans — la liste des notifications, la fenêtre de
 * validation du portfolio, les trois écrans « hors ligne », la liste
 * vide, le remerciement d'un signalement, la confirmation d'un message.
 * Neuf écritures indépendantes, et le relevé était sans appel :
 *  · QUATRE tailles de cercle (36, 48, 56, 64) ;
 *  · DEUX cercles dessinés avec le CARACTÈRE « ✓ » au lieu d'une icône
 *    — ils ne suivaient donc aucun changement de la famille ;
 *  · une couleur écrite en HEXADÉCIMAL BRUT (#34D399), la seule du
 *    produit à ne pas venir de la charte ;
 *  · et le même symbole disant deux choses opposées (l'horloge pour
 *    « en validation » ET pour « suppression programmée »).
 * Ce fichier est la réponse : LES DEUX TAILLES, LES QUATRE TONS ET
 * L'ÉPAISSEUR DE TRAIT sont ici, et nulle part ailleurs.
 *
 * ⚠️ IL NE CONNAÎT AUCUN ÉVÉNEMENT. Ce module dit COMMENT une pastille
 * se peint ; il ne dit pas quel symbole va avec quelle nouvelle — ce
 * catalogue-là vit dans `FenetreNotifications`, avec les textes. La
 * séparation est délibérée : les écrans qui ne sont pas des
 * notifications (un signalement envoyé, une fiche retirée) montrent une
 * pastille sans qu'aucune notification n'existe.
 *
 * ⚠️ IL N'EST PAS UN COMPOSANT CLIENT, et n'a besoin de l'être : aucun
 * état, aucun effet, aucun écouteur. Il se rend aussi bien depuis le
 * serveur que depuis un écran interactif.
 */

/**
 * LES QUATRE TONS, ET LEUR SENS EST CONSTANT PARTOUT (règle nº 664).
 * C'est la règle que la nº 663 a trouvée violée : la fenêtre de
 * validation peignait EN ROSE le cas « ta fiche est en ligne », qui est
 * un succès ; « Merci pour ton signalement » était rose lui aussi.
 *  · `attente` — ROSE : une décision est attendue, et elle ne dépend
 *    pas de toi (fiche en cours de validation). C'est le rose de la
 *    pastille « En validation » du menu, la même idée.
 *  · `valide`  — VERT : c'est fait, c'est en ligne, c'est parti (fiche
 *    publiée, style accepté, suppression annulée, message envoyé).
 *  · `probleme`— ROUGE : il manque quelque chose, ou quelque chose est
 *    retiré (fiche hors ligne, modifications demandées, suppression
 *    programmée).
 *  · `info`    — GRIS : on t'informe, tu n'as rien à faire (bienvenue,
 *    demande reçue, style refusé, liste vide).
 *
 * ⚠️ POURQUOI ILS SONT PLUS FRANCS QU'AVANT (le point 4 du propriétaire).
 * DEUX CAUSES SE CUMULAIENT, et aucune n'était le « /15 » qu'on
 * accusait :
 * 1) LA PRIMAIRE N'ÉTAIT PAS UN VOILE DE PRIMAIRE. Elle s'écrivait
 *    `bg-primaire-voile` — une couleur OPAQUE plus SOMBRE que le fond
 *    des fenêtres (#262C34). Le cercle ne se voyait donc pas : il
 *    faisait un trou. Il devient un vrai voile de la primaire.
 * 2) LE ROUGE ÉTAIT CELUI DES PAGES BLANCHES (#D32E28) : 2,4:1 sur son
 *    propre voile, sous le minimum d'un symbole. Il est recalculé pour
 *    le fond sombre (voir COULEURS_SOMBRE.erreur).
 * Les voiles passent de 15 % à 20 % — un cran, pas une bascule : au-delà
 * c'est le SYMBOLE qui s'éteint, et le propriétaire demande les deux à
 * la fois. MESURÉ (pixel relu après composition, sur le fond de la
 * liste #262C34 puis sur celui des fenêtres #1A1F26), symbole contre
 * son propre voile : rose 3,29 et 3,82:1 · vert 4,87 et 5,74:1 · rouge
 * 3,41 et 3,96:1 · gris 8,55:1 des deux côtés. Tous au-dessus des 3:1
 * exigés d'un signe qui n'est pas du texte ; le rose est le plus juste
 * des quatre, et c'est ce qui borne le voile à 20 %.
 *
 * ⚠️ LE GRIS NE PREND PAS DE VOILE, ET C'EST VOULU : un gris dilué sur
 * un gris ne fait pas un disque, il fait une tache. Il monte d'un
 * barreau de l'échelle (`haut`, le niveau des empilements) et son
 * symbole passe du texte doux au texte plein — c'est ce qui le rend
 * « net » sans lui donner de couleur.
 *
 * ██ §3 (nº 672), REFAIT PAR LE §4 (nº 674) — LE TON `marque` ██
 * ------------------------------------------------------------------
 * CE QU'IL ÉTAIT À LA nº 672 : un cercle au FOND DU SITE (#0B0F14) et
 * une étoile DORÉE, avec un jeton `or` créé pour elle. Le propriétaire
 * l'a jugé HORS CHARTE et tranche : « l'étoile passe en ROSE
 * (primaire), le cercle au GRIS de la famille info ».
 * CE QU'IL EST DEVENU À LA nº 674 : le gris de `info` (`bg-sombre-haut`,
 * le barreau des empilements) et le ROSE de la charte. Aucune couleur
 * nouvelle — les deux jetons existaient bien avant la nº 672.
 * CE QU'IL EST DEPUIS LA nº 680 : le même rose sur UN CRAN PLUS SOMBRE,
 * `bg-sombre-eleve`. Voir la mesure au bas de cette note — c'est elle
 * que le propriétaire a suivie.
 *
 * ⚠️ POURQUOI CE TON SURVIT ALORS QUE L'OR MEURT. Le propriétaire
 * demande de retirer « ce qui ne sert plus » ; voici la réponse
 * précise, cas par cas :
 *  · LE JETON `or` EST SUPPRIMÉ, et de partout — config/tattoo,
 *    lib/theme, globals.css. Il était né à la nº 672 pour cette seule
 *    étoile ; plus aucun porteur, il meurt avec elle ;
 *  · LE TON `marque`, LUI, RESTE NÉCESSAIRE, et ce n'est pas un
 *    attachement : il est la SEULE combinaison « cercle gris + symbole
 *    ROSE » de la famille. `info` peint son symbole en BLANC
 *    (`text-sombre-texte`) ; lui donner du rose changerait les QUATRE
 *    autres écrans d'information (demande de style, style refusé,
 *    liste vide, la cloche du vide), ce que personne n'a demandé. Un
 *    ton de plus est la façon la plus courte de ne toucher à rien.
 * ⚠️ IL N'A TOUJOURS QU'UN SEUL PORTEUR : la bienvenue.
 *
 * ⚠️ LA MESURE QUI A DÉCIDÉ DE CE TON, ET COMMENT ELLE A SERVI. À la
 * nº 674 j'ai posé le gris de `info` comme demandé, en signalant que le
 * rose n'y rendait que 2,67:1 — SOUS les 3:1 qu'on exige d'un signe — et
 * qu'UN SEUL CRAN suffirait : `bg-sombre-eleve`, 3,93:1. Le propriétaire
 * a tranché en ce sens (nº 676, annulée avec elle ; reprise nº 680).
 * L'échelle complète, pour mémoire : doré 11,63:1 · rose sur son propre
 * voile (ton `attente`) 3,29:1 · rose sur `eleve` 3,93:1 · rose sur
 * `haut` 2,67:1.
 * ⚠️ CE TON N'A QU'UN PORTEUR — la bienvenue — et c'est ce qui rend le
 * cran sans danger : `info` garde `bg-sombre-haut`, donc les quatre
 * autres écrans d'information ne bougent pas d'un pixel.
 */
export type TonEvenement =
  | "attente"
  | "valide"
  | "probleme"
  | "info"
  | "marque";

/**
 * ██ nº 811 — LES QUATRE COULEURS REVIENNENT, L'ÉTOILE RESTE GRISE ██
 * ------------------------------------------------------------------
 * LA nº 809 AVAIT MIS LES CINQ TONS DANS LA MÊME ROBE (symbole blanc
 * sur rond gris, « la règle d'unité »). C'ÉTAIT UNE ERREUR DE
 * CONSIGNE, le propriétaire le dit à la nº 811 : chaque pastille
 * RETROUVE SA COULEUR D'ORIGINE — la coche du succès VERTE
 * (notifications, Contact, Signalement), l'horloge d'attente ROSE, la
 * corbeille et le hors-ligne ROUGES, l'enveloppe GRISE. L'échelle des
 * couleurs (vert « c'est fait », rouge « il manque », rose « on
 * attend », gris « on t'informe ») reparle, exactement comme la
 * nº 664 l'avait écrite plus haut : voiles à 20 %, contrastes mesurés.
 * ⚠️ LA SEULE CORRECTION DE COULEUR CONSERVÉE : LA BIENVENUE. L'étoile
 * n'est plus rose sur `sombre-eleve` (nº 680) : elle est BLANCHE sur
 * le GRIS de l'enveloppe — le ton `marque` porte désormais la robe de
 * `info`. Il reste un ton à part (un seul porteur, la bienvenue) pour
 * que ce choix se lise ici, et se défasse ici, sans toucher aux quatre
 * écrans d'information.
 * ⚠️ LES DIX SYMBOLES SONT REDESSINÉS À LA MÊME PASSE (Icones.tsx) :
 * ce fichier n'en dessine aucun, il ne fait que les habiller.
 */
export const TON_PASTILLE: Record<TonEvenement, string> = {
  attente: "bg-primaire/20 text-primaire",
  valide: "bg-sombre-succes/20 text-sombre-succes",
  probleme: "bg-sombre-erreur/20 text-sombre-erreur",
  info: "bg-sombre-haut text-sombre-texte",
  marque: "bg-sombre-haut text-sombre-texte",
};

/**
 * LES DEUX TAILLES, ET IL N'Y EN A PLUS QUE DEUX (point 2 du
 * propriétaire). Elles sont les DOMINANTES du relevé, pas des valeurs
 * neuves : 36 px était déjà la liste, 56 px déjà sept écrans sur neuf.
 * Les deux orphelines rentrent dans le rang — 48 (« Ta fiche est
 * retirée ») et 64 (« Message envoyé ! ») deviennent 56.
 *  · `liste`   — 36 px, symbole 18 : une LISTE, où la pastille
 *    accompagne une ligne de texte sans la dominer.
 *  · `fenetre` — 56 px, symbole 24 : un ÉCRAN entier dont elle est le
 *    premier signe, au-dessus du titre.
 * Les deux sont sur l'échelle de 4 (h-9 = 36, h-14 = 56), donc dans les
 * classes que Tailwind produit déjà : aucune taille arbitraire.
 */
export type TaillePastille = "liste" | "fenetre";

export const GEOMETRIE_PASTILLE: Record<
  TaillePastille,
  { boite: string; symbole: number }
> = {
  liste: { boite: "h-9 w-9", symbole: 18 },
  fenetre: { boite: "h-14 w-14", symbole: 24 },
};

/**
 * L'ÉPAISSEUR DU TRAIT DE LA FAMILLE — EN UNITÉS DU DESSIN, COMME
 * TOUTES LES ICÔNES DU SITE.
 * ██ nº 812 — LA RÈGLE DE TROIS DE LA nº 809 EST ANNULÉE ██
 * La nº 809 faisait rendre le trait à la MÊME épaisseur d'écran aux
 * deux tailles (1,5 px, par `traitPourTaille` : 2 unités à 18 px, 1,5
 * à 24). Résultat, vu par le propriétaire : dans la liste, un trait de
 * 2 unités sur un dessin de 18 px paraît GRAS — plus lourd, à taille
 * égale, que n'importe quelle icône historique du site, qui porte 1,8
 * unité quelle que soit sa taille. Il exige des TRAITS FINS, la règle
 * posée dès la conception des icônes (1,5 à 2 unités), et cohérents
 * avec les icônes historiques.
 * LA VALEUR : 1,5 UNITÉ, aux deux tailles — le bas de la fourchette de
 * la charte, le plus fin qu'elle autorise. Rendu : 1,125 px dans la
 * liste (18 px), 1,5 px dans une fenêtre (24 px). La famille suit
 * désormais la même loi que le reste du site : une épaisseur de dessin
 * fixe, et l'écran la met à l'échelle avec le symbole. (Le « même
 * pixel aux deux tailles » de la nº 664/809 cède devant cette règle :
 * c'est une décision du propriétaire, pas un oubli.)
 */
export const TRAIT_FAMILLE = 1.5;

/**
 * LE SYMBOLE ARRIVE EN COMPOSANT, PAS EN JSX DÉJÀ FAIT — et c'est ce
 * qui permet aux deux tailles d'exister. Le catalogue des
 * notifications écrivait `icone: <IconeHorloge taille={18} />` : la
 * taille y était figée à l'écriture, donc inutilisable dans une
 * fenêtre. En passant `IconeHorloge` lui-même, la pastille reste seule
 * juge de la taille ET de l'épaisseur.
 */
/**
 * ██ §1 (nº 829) — LA PROPORTION DU DESSIN, QUAND ELLE DOIT CHANGER ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE, sur la page du lien expiré : « l'icône
 * horloge est trop petite ». Elle est pourtant à la taille prévue
 * (24 px), et le rond aussi (56). LA CAUSE EST UNE PROPORTION, et elle
 * se lit dans le tableau ci-dessus :
 *   · `liste`   — 18 dans 36, le dessin occupe LA MOITIÉ du rond ;
 *   · `fenetre` — 24 dans 56, il n'en occupe que 43 %.
 * Une icône de fenêtre est donc RELATIVEMENT plus petite que celles
 * que l'on voit toute la journée dans la liste des notifications.
 * Sur un écran qui ne montre QU'ELLE, ça se voit.
 *
 * `dessin` permet de le corriger LÀ OÙ ON LE DEMANDE, sans toucher aux
 * autres écrans : `PROPORTION_LISTE` rend la taille qui donne la même
 * moitié de rond que la liste (28 dans 56).
 * ⚠️ ELLE N'EST PAS LE DÉFAUT, et c'est voulu : les autres pastilles de
 * fenêtre (Contact, hors-ligne, bienvenue, notifications vides) ne
 * bougent pas d'un pixel. Si le propriétaire veut un jour la même
 * proportion PARTOUT, c'est un seul nombre à changer — le `symbole` de
 * `fenetre`, ci-dessus — et ce commentaire dit pourquoi.
 */
export function PROPORTION_LISTE(taille: TaillePastille): number {
  const { symbole, boite } = GEOMETRIE_PASTILLE.liste;
  //  La boîte s'écrit en classes Tailwind (`h-9 w-9`) : on lit le
  //  nombre d'unités et on le convertit en pixels (1 unité = 4 px).
  const unites = Number(/h-(\d+)/.exec(boite)?.[1] ?? 9);
  const part = symbole / (unites * 4);
  const cote = Number(/h-(\d+)/.exec(GEOMETRIE_PASTILLE[taille].boite)?.[1] ?? 14) * 4;
  return Math.round(cote * part);
}

export function PastilleEvenement({
  ton,
  taille = "fenetre",
  dessin,
  symbole: Symbole,
  classe = "",
}: {
  ton: TonEvenement;
  taille?: TaillePastille;
  /** La taille du dessin, quand la proportion par défaut ne convient
      pas. Voir le §1 (nº 829) — un seul écran s'en sert. */
  dessin?: number;
  symbole: ComposantIcone;
  classe?: string;
}) {
  const { boite, symbole: symboleParDefaut } = GEOMETRIE_PASTILLE[taille];
  const symbole = dessin ?? symboleParDefaut;
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full
                  ${boite} ${TON_PASTILLE[ton]} ${classe}`}
    >
      <Symbole taille={symbole} trait={TRAIT_FAMILLE} />
    </span>
  );
}
