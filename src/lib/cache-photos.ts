/**
 * ██ COMBIEN DE TEMPS UNE PHOTO DÉPOSÉE RESTE VALABLE ██
 * ==================================================================
 * (§1 nº 721, sur la mesure de l'audit nº 720.)
 *
 * CE QUI SE PASSAIT, ET C'EST MESURÉ, PAS SUPPOSÉ. Aucun de nos envois
 * ne disait au stockage combien de temps sa réponse resterait valable.
 * Le service posait donc sa consigne par défaut, relevée en production
 * sur une vraie photo :
 *
 *     cache-control: no-cache
 *
 * `no-cache` ne veut pas dire « garde-la une heure » : il veut dire
 * « ne réutilise jamais sans me redemander d'abord ». Chaque visite
 * repayait donc chaque photo — avatars compris, qui sont demandés en
 * `<img>` direct et ne passent pas par l'optimiseur. Sur une grille de
 * fiches, cela fait le poste le plus lourd de la deuxième visite.
 *
 * ⚠️ POURQUOI UN AN EST SÛR ICI, ET NE L'EST PAS AILLEURS. Ces fichiers
 * sont IMMUABLES PAR CONSTRUCTION : leur nom porte l'instant du dépôt
 * (`avatar-1756000000000.jpg`, `1756000000000.jpg`). Remplacer une photo
 * ne réécrit pas le fichier — cela en dépose un AUTRE, sous un nom neuf,
 * et c'est la fiche en base qui change d'adresse. Un fichier de ce nom
 * ne peut donc jamais changer de contenu, et le garder un an ne peut
 * jamais montrer une image périmée.
 * C'est exactement ce qui distingue ces photos des images de `public/`
 * (logo, glyphes) : celles-là gardent leur nom quand elles changent, et
 * ne reçoivent pour cette raison qu'un jour, revalidable — jamais
 * `immutable`.
 *
 * ⚠️ LA CONSIGNE EST ÉCRITE AU MOMENT DE L'ENVOI, dans les métadonnées
 * de l'objet — jamais dans le fichier. Une photo déjà en ligne garde
 * donc la sienne, et l'API du stockage n'offre AUCUN moyen de la
 * changer sans réenvoyer le fichier (`copy` et `move` recopient les
 * métadonnées telles quelles). Deux outils réenvoient, et règlent donc
 * la consigne au passage :
 *  · `outils/reprendre-avatars` (nº 719) — les avatars, qu'il refait
 *    de toute façon ; ses envois portent cette durée depuis la nº 721 ;
 *  · `outils/reprendre-le-cache` (nº 777) — TOUT un seau, et rien
 *    d'autre : il relit chaque photo mal réglée et la renvoie à son
 *    propre chemin, telle quelle. Il ne touche pas à celles qui sont
 *    déjà bonnes.
 *
 * ⚠️ ET UNE COPIE ENTRE PROJETS NE TRANSPORTE PAS CETTE CONSIGNE
 * (relevé du propriétaire, nº 777) : les 1150 photos déménagées vers
 * le projet américain sont arrivées au défaut du service, `no-cache`,
 * parce que `demenager-photos` copiait les octets sans poser
 * l'en-tête. Il le pose depuis la nº 777 — et cet en-tête, comme tout
 * ce qui touche à cette durée dans les outils, la LIT ici même
 * (`outils/duree-cache-photos.mjs`).
 *
 * ⚠️ UNE SEULE ÉCRITURE, ET C'EST DÉLIBÉRÉ (piège nº 378). Sept envois
 * dans quatre fichiers, plus l'outil de reprise : si la valeur vivait à
 * sept endroits, une passe future en corrigerait six.
 */

/**
 * En SECONDES, et en TEXTE — c'est la forme qu'attend l'option
 * `cacheControl` du client de stockage, qui la recopie telle quelle
 * derrière `max-age=`.
 */
export const CACHE_PHOTOS = "31536000";

/**
 * Les options d'envoi communes à toute photo déposée par un visiteur.
 * `upsert` était déjà là partout ; seule la durée s'ajoute.
 */
export const ENVOI_PHOTO = { upsert: true, cacheControl: CACHE_PHOTOS };

/**
 * Les mêmes, quand le fichier est un JPEG que nous venons de fabriquer
 * (miniatures, variantes d'avatar) : le type déclaré dit le vrai, la
 * réduction ayant réencodé l'image.
 */
export const ENVOI_PHOTO_JPEG = {
  ...ENVOI_PHOTO,
  contentType: "image/jpeg",
};
