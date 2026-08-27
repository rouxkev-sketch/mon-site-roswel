import type { Metadata } from "next";
import { TAILLE_PAGE_REPLI } from "@/lib/colonnes-mosaique";
import { phototequeDuCookie } from "@/lib/vue-phototheque";
import { metadonneesAccueil, RenduAccueil } from "./_accueil/rendu";

/**
 * ██ L'ACCUEIL NU EST PRÉRENDU (nº 357 — étape 1 du chantier) ██
 * ==================================================================
 * LE VERDICT DE LA nº 356, signé par trois jours d'épreuves sur le
 * téléphone du propriétaire : le RENDU DYNAMIQUE est la cause des
 * éjections de retour sur Chrome iPhone — un témoin d'une ligne de
 * différence suffisait à casser. Cette page est donc PRÉPARÉE
 * D'AVANCE : plus aucune lecture de cookies, d'en-têtes ni de
 * paramètres — tout ce qui variait par la requête vit désormais dans
 * le JUMEAU (recherche/page.tsx), que le proxy sert par
 * réécriture dès que « / » porte une requête.
 *
 * RÉGÉNÉRÉE PÉRIODIQUEMENT, ET NON FIGÉE À LA COMPILATION : le
 * catalogue vit (inscriptions, validations, mélange du jour) — figé,
 * l'accueil mentirait ; cinq minutes de retard au pire, c'est le prix
 * choisi, et il est dit.
 *
 * LA TAILLE DE PAGE EST LE REPLI DE LA nº 226 (24 cartes) : la page ne
 * peut plus lire le cookie des colonnes. 24 est un multiple de 2, 3,
 * 4 et 6 colonnes — la rangée reste pleine partout, SAUF au palier de
 * cinq colonnes (96 à 104 rem), où une garde CSS (globals.css,
 * `data-mosaique-nue`) masque les quatre cartes de trop : vingt
 * cartes, quatre rangées pleines. Dès que l'adresse porte une requête
 * (« Voir plus », une recherche), le jumeau reprend la taille exacte
 * au cookie, comme avant.
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return metadonneesAccueil({}, TAILLE_PAGE_REPLI);
}

export default function AccueilNu() {
  return (
    <RenduAccueil
      params={{}}
      taillePage={TAILLE_PAGE_REPLI}
      phototequeSansTexte={phototequeDuCookie(undefined)}
      mosaiqueNue
    />
  );
}
