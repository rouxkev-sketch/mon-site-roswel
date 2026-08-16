/**
 * LE RÉSOLVEUR D'ALIAS `@/` POUR LES BANCS (nº 302)
 * ==================================================================
 * ⚠️ POURQUOI CE FICHIER. Les règles de composition d'une galerie sont
 * du CALCUL PUR (`lib/selection-suivis`) : la meilleure preuve n'est
 * pas de les lire, c'est de les EXÉCUTER et de regarder ce qu'elles
 * rendent. Or le projet écrit ses imports en `@/lib/…` — un alias que
 * Node ne connaît pas.
 * Ce crochet de résolution le traduit en chemin de fichier, et Node 22
 * fait le reste : il lit le TypeScript directement (les types sont
 * effacés, sans compilation). Le code du site n'est modifié d'aucune
 * façon — c'est le RÉSOLVEUR qu'on complète, pas le produit.
 * ⚠️ RÉSERVÉ AUX BANCS : rien dans `src/` ne charge ce fichier.
 */
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const RACINE = process.env.RACINE ?? "/home/user/mon-site-roswel";

export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = `${RACINE}/src/${specifier.slice(2)}`;
    const chemin = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
      (candidat) => existsSync(candidat)
    );
    if (chemin) return next(pathToFileURL(chemin).href, context);
  }
  return next(specifier, context);
}
