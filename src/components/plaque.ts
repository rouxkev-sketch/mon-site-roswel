/**
 * ██ L'ÉCRITURE D'UNE PLAQUE — UNE SEULE, PARTAGÉE ██
 * ==================================================================
 * (§2, §3 et §4 nº 492 · §1 nº 493 · §2 nº 496 · §1 nº 497 ·
 *  DÉMÉNAGÉE ICI par la nº 502.)
 *
 * UNE PLAQUE, C'EST QUOI : un fond uni PERMANENT, quatre coins à
 * 12 px, aucun contour, un air intérieur ÉGAL sur les quatre côtés, et
 * un arrêt net aux marges de l'interface. C'est le dessin des membres
 * d'équipe d'un salon, des lieux d'une fiche d'artiste, et — depuis la
 * nº 502 — de la rangée du profil dans la vue photo au doigt.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE, ET C'EST LA RAISON DE
 * `lignes-profil.ts` À LA LETTRE : ces deux constantes vivaient dans
 * `BlocLieux`, sans être exportées. La nº 502 en a eu besoin depuis
 * `FicheTatoueur`, qui n'a rien à faire avec le bloc des lieux — et
 * recopier un dessin, c'est le condamner à diverger à la passe
 * suivante. Elles sont donc posées ICI, dans un fichier QUI NE DÉPEND
 * DE RIEN : tous les porteurs le consomment, aucun ne le recopie.
 *
 * ⚠️ AUCUNE VALEUR N'A CHANGÉ à ce déménagement : ce sont les chaînes
 * de la nº 497, au caractère près.
 *
 * ==================================================================
 * ⚠️⚠️ RÈGLE DU SITE, À TENIR PAR TOUTES LES PASSES QUI SUIVENT
 * (§1, nº 497) : DANS UNE PLAQUE, L'AIR INTÉRIEUR EST LE MÊME EN HAUT,
 * EN BAS, À GAUCHE ET À DROITE. Un seul nombre, sur les quatre côtés.
 * Une plaque n'est pas une ligne de texte : elle a une épaisseur, et
 * cette épaisseur ne se lit juste que si elle est constante tout
 * autour. Dès qu'un côté diffère, l'œil voit le contenu « collé »
 * quelque part, même quand tout est aligné au pixel.
 * D'où `p-3` — DOUZE partout, en UNE classe et non en deux : une seule
 * classe par propriété (piège nº 389), et surtout une seule valeur à
 * lire, donc impossible à désaccorder.
 *
 * ██ §2 (nº 523) — LA PLAQUE DESCEND D'UN CRAN : `eleve` → `carte` ██
 * ==================================================================
 * CE QUE DISAIT LA NOTE D'AVANT, ET POURQUOI ELLE N'EST PLUS VRAIE :
 * « `eleve` est le seul cran qui se détache des DEUX supports d'une
 * plaque — la page et la fenêtre superposée ; un cran plus bas serait
 * la couleur de la page, donc invisible. » C'ÉTAIT JUSTE QUAND ELLE A
 * ÉTÉ ÉCRITE : la fenêtre superposée portait alors le gris `carte`, et
 * une plaque de cette couleur y aurait disparu. LES nº 499 À 501 ONT
 * DONNÉ À LA FENÊTRE LE FOND DE LA PAGE — les deux supports sont
 * devenus le MÊME —, et la contrainte est tombée avec eux. `carte` se
 * détache donc aujourd'hui des deux, puisqu'il n'y en a plus qu'un.
 * ⚠️ CE QUE ÇA COÛTE, DIT FRANCHEMENT : le contraste avec le fond
 * passe de 1,37 à 1,16. C'est peu, et c'est voulu — le propriétaire
 * trouvait les plaques trop claires. Un aplat large se distingue à
 * bien moins que du texte ; mais si elles paraissent maintenant se
 * fondre dans la page, le cran d'avant est le seul retour possible :
 * il n'y a rien entre les deux dans l'échelle.
 *
 * ⚠️ LE SURVOL DESCEND AVEC ELLE, et il le fallait : il montait
 * jusqu'à `eleve-clair`, ce qui aurait fait un saut de trois crans
 * depuis `carte` — un éclair au passage de la souris. Il vaut
 * désormais `eleve`, l'écart que la plaque portait elle-même hier.
 *
 * ⚠️ CE QUI SE POSE SUR UNE PLAQUE DESCEND D'AUTANT : un rond de repli
 * sans photo doit rester lisible AU REPOS COMME AU SURVOL (nº 492).
 * Il valait `bg-sombre-haut`, trois crans au-dessus de `eleve` ; ses
 * porteurs lui passent maintenant `bg-sombre-eleve-clair`, LES MÊMES
 * TROIS CRANS au-dessus de `carte`. Le rapport est conservé sur
 * l'échelle, pas recalculé à l'œil.
 */
export const ENCADRE_MEMBRE =
  "flex items-start gap-3.5 rounded-xl bg-sombre-carte p-3";

/** La même plaque, cliquable : le fond monte d'un cran au survol, et
    l'appui le tient au doigt, où il n'y a pas de survol. */
export const ENCADRE_MEMBRE_CLIQUABLE =
  `group ${ENCADRE_MEMBRE} transition-colors ` +
  "hover:bg-sombre-eleve active:bg-sombre-eleve";
