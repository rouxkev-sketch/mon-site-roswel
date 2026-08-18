import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  COOKIE_COLONNES,
  taillePageServie,
} from "@/lib/colonnes-mosaique";
import { cleCookieTexte, phototequeDuCookie } from "@/lib/vue-phototheque";
import { SURFACE_RECHERCHE } from "@/lib/surface-affichage";
import {
  metadonneesAccueil,
  RenduAccueil,
  type ParametresAccueil,
} from "../_accueil/rendu";

/**
 * ██ LE JUMEAU DYNAMIQUE DE L'ACCUEIL (nº 357) ██
 * ==================================================================
 * PERSONNE NE TAPE CETTE ADRESSE : le proxy RÉÉCRIT « / » vers ici
 * dès que l'adresse porte une requête (?style=…, ?page=…, ?sonde-…).
 * L'adresse du navigateur reste « / » — l'état continue de vivre dans
 * l'adresse (règle nº 328), les liens partagés et les moteurs de
 * recherche reçoivent les bonnes cartes rendues PAR LE SERVEUR
 * (nº 203), et le cookie de colonnes garde sa taille de page exacte
 * (nº 226).
 *
 * L'ACCUEIL NU, lui, vit dans page.tsx : PRÉRENDU, régénéré
 * périodiquement — c'est la correction du verdict de la nº 356 (le
 * rendu dynamique est la cause signée des éjections de retour sur
 * Chrome iPhone). Ce jumeau reste dynamique : c'est le prix, connu et
 * dit, pour que les recherches gardent leur rendu serveur — leur tour
 * viendra aux étapes suivantes du chantier.
 */
export const dynamic = "force-dynamic";

/** La taille de page au cookie des colonnes (nº 226-§1) — la lecture
    qui vivait dans l'accueil quand il était dynamique. */
async function taillePageDeLaRequete(): Promise<number> {
  const magasin = await cookies();
  return taillePageServie(magasin.get(COOKIE_COLONNES)?.value);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ParametresAccueil>;
}): Promise<Metadata> {
  return metadonneesAccueil(await searchParams, await taillePageDeLaRequete());
}

export default async function AccueilRecherche({
  searchParams,
}: {
  searchParams: Promise<ParametresAccueil>;
}) {
  const params = await searchParams;
  const magasin = await cookies();
  return (
    <RenduAccueil
      params={params}
      taillePage={taillePageServie(magasin.get(COOKIE_COLONNES)?.value)}
      phototequeSansTexte={phototequeDuCookie(
        magasin.get(cleCookieTexte(SURFACE_RECHERCHE))?.value
      )}
      mosaiqueNue={false}
    />
  );
}
