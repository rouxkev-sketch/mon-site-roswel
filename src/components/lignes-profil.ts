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
export const ECRITURE_LIGNE_FICHE =
  "text-[15px] leading-snug text-sombre-texte-doux";

export const BOITE_ICONE_LIGNE =
  "flex h-[22px] w-[22px] shrink-0 items-center justify-center";

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
