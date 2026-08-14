/**
 * ENGENDRER LA BIBLIOTHÈQUE D'ÉMOJIS (§4, passe nº 267)
 * ==================================================================
 * LE DÉFAUT QU'IL FERME : la liste d'émojis était CHOISIE À LA MAIN.
 * Elle avait donc des trous — les ronds de couleur manquaient à côté
 * des cœurs de couleur —, et toute correction à la main en aurait
 * laissé d'autres. On ne choisit plus : on SERT LE JEU COMPLET, celui
 * d'Unicode, rangé dans SES catégories officielles.
 *
 * COMMENT : ce script lit `emojibase-data` (les données Unicode
 * publiées, en français : libellés et mots-clés traduits) et écrit
 * `src/lib/emojis-donnees.ts`. Il tourne À LA DEMANDE, jamais au
 * build ni à l'exécution :
 *
 *     npm install --no-save emojibase-data
 *     node scripts/engendrer-emojis.mjs
 *
 * Le site, lui, n'a AUCUNE dépendance nouvelle : il lit le fichier
 * engendré, qui est du texte ordinaire versionné avec le reste.
 *
 * CE QU'ON ÉCARTE, ET POURQUOI :
 *  · le groupe « component » (teintes de peau et chevelures seules) :
 *    ce ne sont pas des émojis à poser dans une bio, ce sont des
 *    morceaux qui servent à en composer d'autres ;
 *  · les variantes de teinte de peau : elles multiplieraient la liste
 *    par six sans rien apprendre — le clavier du téléphone les propose
 *    au maintien du doigt, et une bio n'en a pas besoin.
 */
import { readFileSync, writeFileSync } from "node:fs";

const RACINE = new URL("..", import.meta.url).pathname;
const lireJson = (chemin) =>
  JSON.parse(readFileSync(`${RACINE}node_modules/emojibase-data/${chemin}`, "utf8"));

const emojis = lireJson("fr/compact.json");
const messages = lireJson("fr/messages.json");

/** LES CATÉGORIES OFFICIELLES, dans l'ordre d'Unicode — et leurs noms
    tels que le propriétaire les a demandés. */
const CATEGORIES = [
  ["smileys-emotion", "visages", "Visages et émotions"],
  ["people-body", "personnes", "Personnes"],
  ["animals-nature", "animaux", "Animaux et nature"],
  ["food-drink", "nourriture", "Nourriture"],
  ["travel-places", "voyages", "Voyages et lieux"],
  ["activities", "activites", "Activités"],
  ["objects", "objets", "Objets"],
  ["symbols", "symboles", "Symboles"],
  ["flags", "drapeaux", "Drapeaux"],
];

const numeroDuGroupe = new Map(
  messages.groups.map((groupe) => [groupe.key, groupe.order])
);

const sansAccents = (texte) =>
  texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

let total = 0;
const blocs = CATEGORIES.map(([cle, slug, titre]) => {
  const numero = numeroDuGroupe.get(cle);
  const entrees = emojis
    .filter((emoji) => emoji.group === numero)
    .sort((a, b) => a.order - b.order)
    .map((emoji) => {
      //  LES MOTS DE LA RECHERCHE : le libellé officiel et les
      //  mots-clés d'Unicode, sans accents, sans doublon.
      const mots = [...new Set(sansAccents([emoji.label, ...(emoji.tags ?? [])].join(" ")).split(/[\s,'’-]+/).filter(Boolean))];
      return `    [${JSON.stringify(emoji.unicode)}, ${JSON.stringify(mots.join(" "))}],`;
    });
  total += entrees.length;
  return `  {
    slug: ${JSON.stringify(slug)},
    titre: ${JSON.stringify(titre)},
    emojis: [
${entrees.join("\n")}
    ],
  },`;
});

const fichier = `/**
 * LA BIBLIOTHÈQUE D'ÉMOJIS — LE JEU COMPLET, ENGENDRÉ (§4, nº 267)
 * ==================================================================
 * ⚠️ CE FICHIER EST ENGENDRÉ. Ne le corrige pas à la main : c'est
 * précisément ce qui avait creusé des trous dans la liste d'avant (les
 * ronds de couleur manquaient à côté des cœurs de couleur). Pour le
 * refaire — nouvelle version d'Unicode, par exemple :
 *
 *     npm install --no-save emojibase-data
 *     node scripts/engendrer-emojis.mjs
 *
 * SOURCE : emojibase-data (les données Unicode publiées), en FRANÇAIS
 * — les libellés et les mots-clés de recherche sont ceux d'Unicode,
 * traduits, jamais inventés ici.
 * CONTENU : ${total} émojis, rangés dans les ${CATEGORIES.length} catégories officielles.
 * ÉCARTÉS : le groupe « component » (teintes seules) et les variantes
 * de teinte de peau — voir scripts/engendrer-emojis.mjs.
 */

export type EntreeEmoji = readonly [string, string];

export const CATEGORIES_EMOJIS: ReadonlyArray<{
  slug: string;
  titre: string;
  emojis: ReadonlyArray<EntreeEmoji>;
}> = [
${blocs.join("\n")}
];
`;

writeFileSync(`${RACINE}src/lib/emojis-donnees.ts`, fichier, "utf8");
console.log(`engendré : ${total} émojis · ${CATEGORIES.length} catégories`);
