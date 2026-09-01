//  ██ nº 777 — LA DURÉE DE VALIDITÉ DES PHOTOS, LUE CHEZ LE SITE ██
//  ==================================================================
//  Le site la déclare à UN seul endroit : `src/lib/cache-photos.ts`
//  (`CACHE_PHOTOS`, posée à la nº 721). Un outil de ligne de commande
//  ne charge pas le code du site — il LIT donc la valeur dans le
//  fichier, au lieu de la recopier. Aucun nombre n'est écrit ici : si
//  le site change d'avis, les outils suivent (piège nº 378).
//
//  ⚠️ CE QUE CETTE DURÉE COMMANDE, ET QUI EST TOUT LE SUJET DE LA
//  nº 777 : l'en-tête `cache-control` de l'ENVOI. Le stockage le
//  retient dans les métadonnées de l'objet et le recopie ensuite sur
//  CHAQUE réponse — y compris celles que le CDN met en cache au bord.
//  Un envoi sans cet en-tête reçoit le défaut du service, `no-cache` :
//  le réseau de diffusion revalide alors chaque photo à l'origine, et
//  la distance jusqu'aux États-Unis se paie à chaque affichage.
//
//  ⚠️ `outils/reprendre-avatars.mjs` PORTE ENCORE SA PROPRE LECTURE de
//  la même constante, et c'est délibéré : elle vit là-bas dans une
//  fonction qui lit AUSSI la taille des variantes et la qualité
//  (`lireLesReglesDuSite`), et la brancher ici demanderait d'éprouver
//  cet outil-là contre une base — hors du sujet de cette passe. Les
//  deux lectures visent la MÊME source unique : c'est la valeur qui
//  ne doit exister qu'une fois, et elle n'existe qu'une fois.
import { readFile } from "node:fs/promises";
import path from "node:path";

/** La durée en SECONDES, en texte — la forme de l'en-tête. */
export async function dureeCachePhotos(racine = process.cwd()) {
  const source = await readFile(
    path.join(racine, "src", "lib", "cache-photos.ts"),
    "utf8"
  );
  const trouve = /CACHE_PHOTOS\s*=\s*"(\d+)"/.exec(source);
  if (!trouve) throw new Error("CACHE_PHOTOS introuvable dans lib/cache-photos");
  return trouve[1];
}

/** L'en-tête complet, écrit une seule fois pour tous les envois. */
export async function enTeteCachePhotos(racine = process.cwd()) {
  return `max-age=${await dureeCachePhotos(racine)}`;
}

/**
 * COMBIEN DE SECONDES DIT CETTE CONSIGNE ? — `null` quand elle n'en
 * dit aucune (`no-cache`, absente, illisible).
 * ⚠️ ON NE COMPARE PAS LES CHAÎNES : le service peut servir
 * `public, max-age=31536000` là où l'envoi disait `max-age=31536000`.
 * Les deux disent la même chose, et c'est le NOMBRE qui compte.
 */
export function secondesDeLaConsigne(consigne) {
  if (!consigne) return null;
  if (/no-store|no-cache/i.test(consigne)) return null;
  const trouve = /max-age\s*=\s*(\d+)/i.exec(consigne);
  return trouve ? Number(trouve[1]) : null;
}
