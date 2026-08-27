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
 * ██ §3 (nº 672) — UN CINQUIÈME TON : `marque`, LA VOIX DU SITE ██
 * ------------------------------------------------------------------
 * CE QUE C'EST, ET IL EST DEMANDÉ NOMMÉMENT : le cercle presque noir à
 * l'ÉTOILE DORÉE du message de bienvenue. Le propriétaire choisit les
 * deux couleurs — « fond du site #0B0F14, étoile dorée/ambre ».
 * POURQUOI UN TON, ET PAS UN CAS PARTICULIER ÉCRIT DANS LE CATALOGUE :
 * parce que c'est exactement ce que ce fichier existe pour empêcher. Un
 * cercle peint à la main dans `FenetreNotifications` serait le dixième
 * du relevé de la nº 663 — une écriture qui ne suivrait plus la famille.
 * Un ton de plus, c'est une ligne de plus dans la table, et le reste
 * (les deux tailles, le trait, la géométrie) est repris sans un mot.
 * ⚠️ IL NE CASSE PAS LA RÈGLE DES QUATRE SENS, IL LA PROLONGE. Les
 * quatre disent ce qu'IL FAUT COMPRENDRE d'un événement (attendre,
 * c'est fait, il manque quelque chose, on t'informe). Celui-ci ne dit
 * rien de l'événement : il dit QUI PARLE — YokoFolio en son nom propre.
 * C'est la suite directe du §2 de la nº 668, qui avait déjà élargi le
 * rose à « la voix du site » ; le propriétaire lui donne sa couleur à
 * lui, l'élargissement du rose est donc annulé et le rose reprend son
 * sens strict.
 * ⚠️ IL N'A QU'UN SEUL PORTEUR, et c'est ce qui le garde sûr : la
 * bienvenue. Aucun autre écran ne doit le prendre sans que le
 * propriétaire le demande.
 * ⚠️ SON CERCLE EST PLUS SOMBRE QUE CE QUI LE PORTE, ET C'EST UN CHOIX
 * ASSUMÉ — je le dis parce que la nº 664 reprochait exactement cela au
 * rose d'alors (« il faisait un trou »). La différence est que ce
 * n'était PAS voulu à la nº 664, et que ça l'est ici : un ciel de nuit
 * pour une étoile. Ce qui compte est le contraste de l'ÉTOILE sur son
 * cercle (11,6:1), pas celui du cercle sur la rangée (1,16:1 dans une
 * fenêtre, 1,25:1 sur une rangée non lue).
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
  //  §3 (nº 672) — PAS DE VOILE ICI NON PLUS, et pour l'autre raison :
  //  le fond n'est pas une dilution de l'or, c'est le FOND DU SITE, à
  //  plein. Les deux jetons sont ceux que le propriétaire nomme.
  marque: "bg-sombre-fond text-sombre-or",
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
