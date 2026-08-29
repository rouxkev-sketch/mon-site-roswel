/**
 * ██ §1 (nº 718) — LES VARIANTES DE L'AVATAR, EN UN SEUL ENDROIT ██
 * ==================================================================
 * CE QUE L'AUDIT nº 717 A TROUVÉ : l'avatar rond est servi en 800 × 800
 * — la sortie du recadreur — dans SEPT emplacements où il s'affiche
 * entre 40 et 92 px. Vingt fois trop grand sur les cartes, huit fois
 * sur la fiche. Le recadreur fabriquait déjà une miniature de 160 ;
 * elle était produite puis JETÉE, alors que le même mécanisme est
 * branché et fonctionne pour les photos de portfolio depuis la nº 366.
 *
 * ██ POURQUOI PAR LE NOM DU FICHIER, ET PAS PAR UNE COLONNE ██
 * ------------------------------------------------------------------
 * Les photos de portfolio ont, elles, une colonne `miniature` dans leur
 * table. L'avatar n'en a pas : `photo_profil` est UNE colonne, sur la
 * fiche. Y ajouter deux colonnes voudrait dire une migration de base —
 * à écrire, à jouer en production, et à tenir en accord avec le code.
 * ON S'EN PASSE : les adresses des variantes se DÉDUISENT de celle de
 * l'original, par une convention de nommage. Rien à migrer, rien à
 * lire de plus, et la règle vit ici, à un seul endroit (piège nº 378).
 *
 * ██ COMMENT ON SAIT QU'UNE PHOTO A DES VARIANTES — LE POINT DÉLICAT ██
 * ------------------------------------------------------------------
 * Les photos DÉJÀ déposées n'en ont pas. Deviner leur adresse
 * rendrait une image introuvable, et l'avatar disparaîtrait pour tous
 * les comptes existants — exactement ce que la consigne interdit.
 * LA MARQUE EST DONC DANS LE NOM : les photos déposées à partir de la
 * nº 718 s'appellent `avatar-…`, les anciennes `profil-…`. Le nom dit
 * ce que le fichier est, et il le dit sans qu'on ait à demander au
 * stockage. Une adresse qui ne porte pas la marque est rendue TELLE
 * QUELLE : l'ancien comportement, au pixel près.
 */

/** Le petit format — cartes, listes, barre fixe (affiché ~40 px). */
export const AVATAR_PETIT = 160;
/** Le format moyen — la fiche publique (affiché jusqu'à 92 px). */
export const AVATAR_MOYEN = 320;

/**
 * LE PRÉFIXE DES PHOTOS QUI ONT DES VARIANTES. Les anciennes portent
 * `profil-` : elles n'en ont pas, et ce nom-là ne doit jamais être
 * réemployé pour une photo qui en aurait.
 */
const PREFIXE_AVEC_VARIANTES = "avatar-";

/** Le nom du fichier d'origine, tel qu'il part au stockage. */
export function nomDuFichierAvatar(instant: number): string {
  return `${PREFIXE_AVEC_VARIANTES}${instant}.jpg`;
}

/** Le nom d'une variante, à partir du nom d'origine. */
export function nomDeLaVariante(nomOrigine: string, cote: number): string {
  return nomOrigine.replace(/\.jpg$/, `-${cote}.jpg`);
}

/**
 * L'ADRESSE À AFFICHER, pour la taille voulue.
 *
 * ⚠️ C'EST LA SEULE FONCTION QUE LES ÉCRANS APPELLENT, et elle ne peut
 * pas se tromper : sans adresse, elle rend ce qu'on lui a donné ; sans
 * la marque, elle rend l'original (le repli de la consigne) ; avec la
 * marque, elle rend la variante demandée.
 * ⚠️ ELLE NE VÉRIFIE RIEN AU RÉSEAU, et c'est voulu : une vérification
 * coûterait une requête par avatar — l'inverse du but poursuivi. La
 * marque dans le nom EST la garantie, puisque c'est le dépôt qui la
 * pose, et qu'il ne la pose qu'après avoir envoyé les deux variantes.
 */
export function sourceAvatar(
  adresse: string | null | undefined,
  cote: number = AVATAR_PETIT
): string {
  if (!adresse) return "";
  if (!adresse.includes(PREFIXE_AVEC_VARIANTES)) return adresse;
  return nomDeLaVariante(adresse, cote);
}
