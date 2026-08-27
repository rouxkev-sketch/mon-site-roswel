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
 * ██ LA RECHERCHE, ET SON ADRESSE À ELLE — /recherche (nº 652) ██
 * ==================================================================
 * ██ §1 (nº 652) — ELLE A UN NOM, DÉSORMAIS ██
 * ------------------------------------------------------------------
 * CE QU'ELLE ÉTAIT : le JUMEAU DYNAMIQUE de l'accueil (nº 357), à
 * l'adresse « /accueil-recherche », que PERSONNE ne tapait — le proxy
 * y réécrivait « / » dès que l'adresse portait une requête, et la
 * barre du navigateur continuait d'afficher « / ».
 * CE QU'ELLE DEVIENT : une page à part entière, à « /recherche », vers
 * laquelle les trois fabricants d'adresse du site mènent désormais
 * (IndexTatoueurs, EnTeteTatouage, CarteStyle). L'ADRESSE VISIBLE
 * CHANGE PENDANT UNE RECHERCHE, et c'est la décision du propriétaire.
 * ⚠️ LE FILET RESTE : le proxy réécrit toujours « / » à requête vers
 * cette page (proxy.ts). Un lien déjà partagé — « /?style=… » — sert
 * donc exactement la même chose qu'avant, sans redirection ni erreur.
 * ⚠️ CE QUI NE CHANGE PAS : le rendu reste celui du SERVEUR (nº 203),
 * l'état vit toujours dans l'adresse (règle nº 328), et le cookie de
 * colonnes garde sa taille de page exacte (nº 226).
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
  const base = await metadonneesAccueil(
    await searchParams,
    await taillePageDeLaRequete()
  );
  /*  ██ §1 (nº 652) — CETTE ADRESSE N'EST PAS INDEXÉE ██
      Une page de RÉSULTATS n'a rien à faire dans un moteur de
      recherche : ses combinaisons sont innombrables (style, ville,
      rayon, page, disposition…) et chacune ferait une adresse de plus,
      toutes en double de la même chose. `index: false` le dit.
      `follow: true`, en revanche, est nécessaire : les liens de cette
      page mènent aux FICHES, et celles-là doivent être trouvées — les
      interdire de suivi couperait le chemin qui y conduit.
      ⚠️ LE RESTE DES MÉTADONNÉES NE BOUGE PAS : titre, description et
      adresse canonique viennent toujours de l'écriture partagée
      (`metadonneesAccueil`), qui pointe vers l'accueil — c'est lui, la
      page publique, et c'est vers lui que les moteurs doivent renvoyer. */
  return { ...base, robots: { index: false, follow: true } };
}

export default async function PageRecherche({
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
