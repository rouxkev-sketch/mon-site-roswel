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
 * 1) LE ROSE N'ÉTAIT PAS UN VOILE DE ROSE. Il s'écrivait
 *    `bg-primaire-voile` — #291320, une couleur OPAQUE plus SOMBRE que
 *    le fond des fenêtres (#262C34). Le cercle ne se voyait donc pas :
 *    il faisait un trou. Il devient un vrai voile du rose primaire.
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
 * CE QU'IL DEVIENT : le gris de `info` (`bg-sombre-haut`, le barreau
 * des empilements) et le ROSE de la charte. Aucune couleur nouvelle —
 * les deux jetons existaient bien avant la nº 672.
 *
 * ⚠️ POURQUOI CE TON SURVIT ALORS QUE L'OR MEURT. Le propriétaire
 * demande de retirer « ce qui ne sert plus » ; voici la réponse
 * précise, cas par cas :
 *  · LE JETON `or` EST SUPPRIMÉ, et de partout — config/tatouage,
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
 * ⚠️ CE QUE ÇA VAUT, MESURÉ, ET JE LE DIS PLUTÔT QUE DE LE TAIRE : le
 * rose sur le gris `haut` rend 2,67:1 — SOUS les 3:1 qu'on exige d'un
 * signe. Ce n'est pas une objection à la décision du propriétaire,
 * c'est un fait qu'il doit connaître : le doré rendait 11,63:1, et le
 * rose sur son propre voile (ton `attente`) rend 3,29:1. S'il veut un
 * jour les 3:1 SANS quitter le gris, UN SEUL CRAN suffit — le même
 * rose sur `bg-sombre-eleve` rend 3,93:1. Rien n'est changé de ma
 * propre initiative : c'est le gris de `info` qui est demandé, c'est
 * celui-là qui est posé.
 */
export type TonEvenement =
  | "attente"
  | "valide"
  | "probleme"
  | "info"
  | "marque";

export const TON_PASTILLE: Record<TonEvenement, string> = {
  attente: "bg-primaire/20 text-primaire",
  valide: "bg-sombre-succes/20 text-sombre-succes",
  probleme: "bg-sombre-erreur/20 text-sombre-erreur",
  info: "bg-sombre-haut text-sombre-texte",
  //  §4 (nº 674) — le gris de `info`, et le ROSE de la charte. Comme
  //  `info`, il ne prend PAS de voile : un gris dilué sur un gris ne
  //  fait pas un disque (voir la note des quatre tons ci-dessus).
  marque: "bg-sombre-haut text-primaire",
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
 * L'ÉPAISSEUR DU TRAIT DE LA FAMILLE, EN PIXELS RENDUS À L'ÉCRAN.
 * ⚠️ CE N'EST PAS LA VALEUR QU'ON PASSE À `strokeWidth` : les icônes
 * sont dessinées dans une `viewBox` de 24 et mises à l'échelle. Un
 * `strokeWidth` de 1,8 rend 1,8 px à 24 px de large, mais seulement
 * 1,35 px à 18 px — c'est pourquoi la même coche paraissait plus maigre
 * dans la liste que dans une fenêtre. `traitPourTaille` fait la règle
 * de trois pour que le trait rende LA MÊME ÉPAISSEUR aux deux tailles,
 * ce que le propriétaire demande au point 6.
 * LA VALEUR : 1,5 px. Plus fin que le 1,8 des grandes icônes d'avant
 * (« traits FINS », point 6) et plus franc que le 1,35 des petites.
 */
export const TRAIT_FAMILLE = 1.5;

export function traitPourTaille(taille: number): number {
  return (TRAIT_FAMILLE * 24) / taille;
}

/**
 * LE SYMBOLE ARRIVE EN COMPOSANT, PAS EN JSX DÉJÀ FAIT — et c'est ce
 * qui permet aux deux tailles d'exister. Le catalogue des
 * notifications écrivait `icone: <IconeHorloge taille={18} />` : la
 * taille y était figée à l'écriture, donc inutilisable dans une
 * fenêtre. En passant `IconeHorloge` lui-même, la pastille reste seule
 * juge de la taille ET de l'épaisseur.
 */
export function PastilleEvenement({
  ton,
  taille = "fenetre",
  symbole: Symbole,
  classe = "",
}: {
  ton: TonEvenement;
  taille?: TaillePastille;
  symbole: ComposantIcone;
  classe?: string;
}) {
  const { boite, symbole } = GEOMETRIE_PASTILLE[taille];
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full
                  ${boite} ${TON_PASTILLE[ton]} ${classe}`}
    >
      <Symbole taille={symbole} trait={traitPourTaille(symbole)} />
    </span>
  );
}
