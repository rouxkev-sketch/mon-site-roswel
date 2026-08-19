/**
 * L'ÉCRITURE D'UNE LIGNE DE PROFIL — UNE SEULE, PARTAGÉE
 * ==================================================================
 * (§2, nº 384 ; DÉMÉNAGÉE ICI par la §3, nº 388.)
 *
 * « Booking ouvert », le site, Instagram, les pratiques, les styles
 * et — depuis la nº 388 — l'ADRESSE d'un salon sont la MÊME ligne :
 * une icône de 22 px à gauche, un texte de 15 px en gris doux, dix
 * pixels entre les deux.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE, ET C'EST LA RAISON DE
 * `champs-formulaire.ts` À LA LETTRE : ces deux constantes vivaient
 * dans `ContenuFiche`. L'adresse, elle, se dessine dans `BlocLieux` —
 * c'est là que vivent ses données, son lien Google Maps et son volet
 * d'horaires. Les importer depuis `ContenuFiche` aurait fermé un
 * cercle (ContenuFiche → BlocLieux → ContenuFiche), et un cercle
 * d'imports se paie tôt ou tard par un module à moitié initialisé.
 * Elles sont donc posées ICI, dans un fichier qui ne dépend de rien :
 * les deux la consomment, aucune ne la recopie.
 *
 * ⚠️ AUCUNE VALEUR N'A CHANGÉ à ce déménagement : ce sont les chaînes
 * de la nº 384, au caractère près.
 */
/**
 * ██ §1 (nº 389) — LA COULEUR SORT DE L'ÉCRITURE COMMUNE ██
 * ==================================================================
 * LE DÉFAUT DE LA nº 388 : Instagram devait passer au bleu, il est
 * resté gris — alors que l'adresse, elle, était bien bleue.
 * LA CAUSE, RELEVÉE DANS LA FEUILLE COMPILÉE : la nº 388 posait DEUX
 * classes de couleur SUR LE MÊME ÉLÉMENT — `text-sombre-texte-doux`
 * (venu d'ici) et `text-sombre-lien` par-dessus. Elles ont la même
 * spécificité ; c'est donc L'ORDRE DE LA FEUILLE qui tranche, et
 * Tailwind range ses utilitaires par ordre alphabétique :
 * `sombre-lien` (offset 56378) vient AVANT `sombre-texte-doux`
 * (offset 56472). Le gris gagnait donc toujours, quel que soit
 * l'ordre d'écriture dans le `className`. L'adresse échappait au
 * défaut pour une seule raison : sa couleur est posée sur un AUTRE
 * élément (le texte du lien), sans gris concurrent.
 * LE REMÈDE : l'écriture commune ne porte plus de couleur du tout.
 * Chaque ligne dit la sienne — gris pour la plupart, bleu pour ce qui
 * sort du site. Deux classes ne peuvent plus se disputer.
 */
export const ECRITURE_LIGNE_FICHE = "text-[15px] leading-snug";

/** Le gris doux des lignes qui restent dans le site. */
export const LIGNE_GRISE = "text-sombre-texte-doux";

/**
 * §6 (nº 389) — LA BOÎTE DE L'ICÔNE ÉPOUSE LA PREMIÈRE LIGNE DU TEXTE.
 * ------------------------------------------------------------------
 * Elle mesurait 22 px de haut, alors que la ligne de texte qu'elle
 * accompagne en fait 20,625 (15 px × `leading-snug`, soit 1,375).
 * Avec `items-start`, les deux boîtes commencent au même point, mais
 * le glyphe est centré dans LA SIENNE : il tombait donc ~1,4 px plus
 * bas que le centre de la ligne — visible sur l'adresse, la plus
 * longue des cinq.
 * La hauteur est désormais dite en `em` : c'est EXACTEMENT la hauteur
 * de ligne, quelle que soit la taille du texte, et le glyphe se centre
 * sur la première ligne par construction. La largeur ne bouge pas —
 * la colonne d'icônes garde ses 22 px, donc l'alignement du texte de
 * toutes les lignes est inchangé au pixel.
 */
export const BOITE_ICONE_LIGNE =
  "flex h-[1.375em] w-[22px] shrink-0 items-center justify-center";

/**
 * §5 (nº 388) — CE QUI SORT DU SITE EST BLEU, ET S'ÉCLAIRCIT.
 * ------------------------------------------------------------------
 * Instagram et l'adresse mènent DEHORS : la convention du web
 * s'applique à eux, et à eux seuls. Le booking, le site et les styles
 * gardent le gris doux commun.
 * Le jeton et sa variante vivent dans la charte (`COULEURS_SOMBRE`,
 * `lien` / `lienClair`) : aucune couleur n'est écrite ici.
 */
export const LIEN_QUI_SORT =
  "text-sombre-lien hover:text-sombre-lien-clair transition-colors";
