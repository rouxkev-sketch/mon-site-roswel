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
 * ⚠️ LE FOND EST `bg-sombre-eleve`, ET IL Y EST REVENU (nº 524) APRÈS
 * L'ESSAI DE LA nº 523 — qui l'avait fait descendre d'un cran, à
 * `carte`. Le propriétaire a jugé à l'écran : trop sombre, les plaques
 * se fondaient dans la page. Tout ce que cet essai avait ajusté en
 * cascade est revenu avec lui : le survol et le rond du lieu.
 * ⚠️ CE QUE LA nº 523 AVAIT RAISON DE CORRIGER, ET QUI RESTE ACQUIS :
 * la note d'alors disait que `eleve` était le seul cran se détachant
 * des DEUX supports d'une plaque — la page et la fenêtre superposée —,
 * « un cran plus bas serait la couleur de la page ». C'ÉTAIT VRAI
 * quand elle a été écrite, et ça ne l'est plus : les nº 499 à 501 ont
 * donné à la fenêtre le fond de la PAGE, les deux supports sont donc
 * devenus le même. `carte` n'est donc pas invisible — il est
 * seulement trop discret, ce qui est un jugement de l'œil, pas une
 * contrainte de l'échelle. La différence compte pour qui voudra
 * rouvrir ce dossier.
 *
 * ⚠️ CE QUI SE POSE SUR UNE PLAQUE DOIT MONTER D'AUTANT : le rond d'un
 * LIEU SAISI À LA MAIN — un salon ou un studio sans fiche — porte une
 * icône par défaut, et il peint `bg-sombre-eleve` s'il n'a pas
 * d'ordre. Il disparaîtrait dans sa plaque. Ses porteurs lui passent
 * donc TROIS crans au-dessus (`bg-sombre-haut`), pour que le rond ET
 * son icône restent lisibles au repos comme au survol — voir la note
 * de `PhotoRonde` (nº 492).
 * ⚠️ UN MEMBRE D'ÉQUIPE, LUI, A TOUJOURS UNE PHOTO (précision du
 * propriétaire, nº 524) : son rond n'a pas d'état de repli, et il
 * n'existe aucune pastille d'initiales dans une plaque.
 */
export const ENCADRE_MEMBRE =
  "flex items-start gap-3.5 rounded-xl bg-sombre-eleve p-3";

/** La même plaque, cliquable : le fond monte d'un cran au survol, et
    l'appui le tient au doigt, où il n'y a pas de survol. */
export const ENCADRE_MEMBRE_CLIQUABLE =
  `group ${ENCADRE_MEMBRE} transition-colors ` +
  "hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair";
