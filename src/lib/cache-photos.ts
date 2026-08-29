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
 * ⚠️ CE RÉGLAGE NE VAUT QUE POUR LES PHOTOS DÉPOSÉES APRÈS LA nº 721.
 * La consigne est écrite dans les métadonnées de l'objet AU MOMENT DE
 * L'ENVOI : les photos déjà en ligne gardent la leur, et l'API du
 * stockage n'offre AUCUN moyen de la changer sans réenvoyer le fichier
 * (`copy` et `move` recopient les métadonnées telles quelles). Pour les
 * avatars, la reprise nº 719 (`outils/reprendre-avatars.mjs`) réenvoie
 * de toute façon chaque photo : depuis la nº 721, ses envois portent
 * cette durée — la lancer règle donc aussi la consigne.
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
