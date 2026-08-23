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
 * ⚠️ LE FOND EST `bg-sombre-eleve`, ET CE CHOIX EST CONTRAINT : c'est
 * le seul cran de l'échelle (nº 466) qui se détache des DEUX supports
 * sur lesquels une plaque peut vivre — la page et la fenêtre
 * superposée du web. Un cran plus bas serait la couleur de la page,
 * donc invisible ; c'est la leçon du compteur de capsules (nº 491-§1).
 *
 * ⚠️ CE QUI SE POSE SUR UNE PLAQUE DOIT MONTER D'AUTANT : un rond de
 * repli sans photo peint `bg-sombre-eleve` par défaut disparaîtrait
 * dedans. Ses porteurs lui passent donc DEUX crans au-dessus
 * (`bg-sombre-haut`), pour qu'il reste lisible au repos comme au
 * survol — voir la note de `PhotoRonde` (nº 492).
 */
export const ENCADRE_MEMBRE =
  "flex items-start gap-3.5 rounded-xl bg-sombre-eleve p-3";

/** La même plaque, cliquable : le fond monte d'un cran au survol, et
    l'appui le tient au doigt, où il n'y a pas de survol. */
export const ENCADRE_MEMBRE_CLIQUABLE =
  `group ${ENCADRE_MEMBRE} transition-colors ` +
  "hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair";
