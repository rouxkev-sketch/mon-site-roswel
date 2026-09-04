/**
 * ██ UNE LECTURE PARTAGÉE ENTRE LES MÉTADONNÉES ET LA PAGE ██
 * ==================================================================
 * (§1 nº 725 — l'écriture unique du remède posé à la nº 724.)
 *
 * LE PROBLÈME QU'ELLE RÉSOUT, ET IL EST MESURÉ. Dans cette version de
 * Next, `generateMetadata` ne se rend PAS dans la même portée que la
 * page : le `cache` de React, qui devrait réunir leurs lectures, ne les
 * réunit pas. Chaque affichage envoie donc DEUX FOIS les mêmes requêtes
 * à la base — relevé au journal de la doublure, page par page :
 *
 *     /tattoo/[style]/[ville]   16 requêtes pour 7 distinctes (nº 724)
 *     /search                  18 requêtes, plusieurs en double (nº 725)
 *
 * Pas une milliseconde de plus pour le visiteur — les deux partent
 * ensemble et attendent la même latence — mais deux fois la facture de
 * base de données.
 *
 * ⚠️ ON MÉMORISE LA PROMESSE, PAS LE RÉSULTAT, et c'est tout le point :
 * les deux appels partent au même instant (cinq millisecondes d'écart,
 * mesuré nº 687). Une mémoire de RÉSULTATS arriverait trop tard — le
 * second appel serait déjà parti. En rangeant la promesse dès le
 * premier appel, le second se greffe dessus et n'envoie rien.
 *
 * ⚠️ QUELQUES SECONDES, ET PAS DAVANTAGE : c'est un PONT entre deux
 * appels simultanés, pas un cache de données. Les pages qui s'en
 * servent portent déjà le leur, et il est bien plus long.
 *
 * ⚠️ UNE PROMESSE REJETÉE N'EST JAMAIS GARDÉE : elle est retirée de la
 * mémoire, sans quoi une panne d'un instant se rejouerait pour tout le
 * monde pendant toute la durée.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE (piège nº 378). La nº 724 a écrit ce
 * mécanisme dans `lib/style-ville`. La nº 725 en avait besoin pour
 * `/search` : une seconde copie, et la première passe qui corrigerait
 * l'une laisserait l'autre derrière. Le motif lui-même n'est pas neuf —
 * c'est celui de `lib/fiches-admin` (identifiants administrateurs),
 * éprouvé depuis longtemps dans le projet.
 */

/** La durée par défaut : le temps que les deux appels se rejoignent. */
export const DUREE_MEMOIRE_MS = 10_000;

/**
 * Enveloppe une lecture pour que deux appelants simultanés n'en
 * déclenchent qu'une. `cle` doit décrire ENTIÈREMENT la lecture — c'est
 * elle, et rien d'autre, qui décide si deux appels sont le même.
 */
export function memoireCourte<Args extends unknown[], Resultat>(
  lire: (...args: Args) => Promise<Resultat>,
  cleDe: (...args: Args) => string,
  dureeMs: number = DUREE_MEMOIRE_MS
): (...args: Args) => Promise<Resultat> {
  const memoire = new Map<
    string,
    { promesse: Promise<Resultat>; expire: number }
  >();
  return (...args: Args) => {
    const cle = cleDe(...args);
    const maintenant = Date.now();
    const connue = memoire.get(cle);
    if (connue && connue.expire > maintenant) return connue.promesse;
    //  Le ménage, à l'entrée : la mémoire ne garde jamais plus que les
    //  clés vivantes — quelques-unes, le temps d'un affichage.
    for (const [autre, valeur] of memoire) {
      if (valeur.expire <= maintenant) memoire.delete(autre);
    }
    const promesse = lire(...args);
    memoire.set(cle, { promesse, expire: maintenant + dureeMs });
    promesse.catch(() => memoire.delete(cle));
    return promesse;
  };
}
