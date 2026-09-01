/**
 * ██ LES PHOTOS PASSENT PAR NOTRE PORTE (passe nº 782) ██
 * ==================================================================
 * POURQUOI CE FICHIER EXISTE, ET C'EST UNE HISTOIRE MESURÉE.
 *
 * Le stockage Supabase RANGE la consigne de cache qu'on lui donne (son
 * API la rapporte) mais il SERT `no-cache` — établi à la nº 781 sur
 * les DEUX projets, sur un fichier neuf, après avoir essayé les cinq
 * façons d'écrire qu'il accepte. `no-cache` ne veut pas dire « garde-la
 * une heure » : il veut dire « ne réutilise jamais sans me redemander
 * d'abord ». Le réseau de diffusion ne peut donc RIEN garder, et
 * chaque affichage repart jusqu'à l'origine — désormais aux
 * États-Unis.
 *
 * On cesse d'attendre que ce service change d'avis : LA DIFFUSION
 * PASSE DE NOTRE CÔTÉ. Une photo n'est plus demandée à
 * `<projet>.supabase.co` par le navigateur ; elle est demandée à
 * NOTRE site, qui la relaie et pose LUI-MÊME la consigne de cache.
 * Vercel garde alors la réponse à son bord — près du visiteur — et la
 * ressert sans rien redemander à personne.
 *
 * ⚠️ LES ADRESSES EN BASE NE CHANGENT PAS (la leçon de la nº 775, où
 * une bascule de projet avait laissé mille adresses périmées) : la
 * base continue de porter l'adresse Supabase, entière. C'est À
 * L'AFFICHAGE qu'on la traduit, et nulle part ailleurs. Rien à migrer,
 * rien à défaire si l'on veut revenir en arrière.
 *
 * ⚠️ CE N'EST PAS L'OPTIMISEUR D'IMAGES, ET C'EST VOULU. Les CARTES de
 * la mosaïque, elles, passent par lui depuis la nº 366 — parce qu'elles
 * ont besoin d'une taille adaptée à l'écran (c'est ce qui a corrigé
 * leur grain), et cela ne change pas. Mais une photo de FICHE est déjà
 * à sa taille : la faire re-encoder n'apporterait rien, coûterait une
 * transformation facturée par photo et par largeur, et surtout
 * changerait les octets — alors que la règle nº 280 veut qu'une photo
 * arrive EN UNE SEULE FOIS, jamais en deux temps. Ici, les octets
 * servis sont exactement ceux du stockage : rien ne change à l'œil.
 */

/**
 * LA PORTE. Tout ce qui commence par là est relayé par notre route
 * (`app/photos/[...chemin]/route.ts`), qui pose la consigne de cache.
 * ⚠️ ÉCRITE UNE SEULE FOIS : la route et le traducteur ci-dessous la
 * lisent tous les deux ici (piège nº 378).
 */
export const PORTE_PHOTOS = "/photos";

/**
 * Reconnaît une adresse de fichier du stockage Supabase et en tire le
 * chemin utile — `<seau>/<dossier>/<fichier>`.
 *
 * ⚠️ ELLE ACCEPTE N'IMPORTE QUEL PROJET, ET C'EST DÉLIBÉRÉ : après une
 * bascule, la base peut porter quelque temps des adresses de l'ancien
 * (nº 775). La route, elle, ira toujours chercher dans le projet
 * COURANT — le seul où les fichiers sont sûrs d'être. Une adresse
 * périmée redevient donc affichable au lieu d'être cassée.
 */
const ADRESSE_STOCKAGE =
  /^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?(.+)$/;

/**
 * TRADUIRE UNE ADRESSE POUR L'AFFICHAGE.
 *  · une photo du stockage  → `/photos/<seau>/<chemin>` (notre porte) ;
 *  · tout le reste          → rendu tel quel, sans y toucher.
 * Ce « reste » compte : les images de démonstration (`/images-demo/…`),
 * les aperçus locaux d'un fichier qu'on vient de choisir (`blob:`),
 * les images de `public/`. Aucune n'a affaire au stockage.
 */
export function photoDuBord(
  adresse: string | null | undefined
): string {
  if (!adresse) return "";
  //  Une adresse déjà traduite ne se retraduit pas (une vue peut
  //  passer par deux écritures — la garde coûte un test).
  if (adresse.startsWith(`${PORTE_PHOTOS}/`)) return adresse;
  const trouve = ADRESSE_STOCKAGE.exec(adresse);
  if (!trouve) return adresse;
  //  ⚠️ LA REQUÊTE EST ABANDONNÉE (`?token=…`, `?t=…`) : notre route
  //  redemande le fichier elle-même, avec ses propres droits. Garder
  //  un jeton d'accès dans une adresse publique serait le publier.
  const chemin = trouve[1].split("?")[0];
  return `${PORTE_PHOTOS}/${chemin}`;
}

/**
 * ⚠️ CE QUI NE PASSE PAS PAR LA PORTE, ET POURQUOI ON N'A PAS ÉCRIT DE
 * SECONDE FONCTION POUR EUX : les images de PARTAGE (celles que les
 * réseaux sociaux vont chercher) sont fabriquées par le serveur, qui
 * télécharge la photo lui-même, une fois, au moment de composer
 * l'image. Ce chemin-là ne passe jamais par un navigateur de visiteur :
 * lui faire traverser notre porte n'économiserait aucun aller-retour et
 * ajouterait un détour. Elles gardent donc l'adresse du stockage.
 */
