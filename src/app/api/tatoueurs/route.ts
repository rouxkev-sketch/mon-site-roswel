import { NextResponse } from "next/server";
import { CARTES_PAR_PAGE } from "@/config/tatouage";
import { lieuDepuisParametres } from "@/lib/geocodage";
import { criteresDeLieu, listerTatoueurs } from "@/lib/tatoueurs";

/**
 * LA RECHERCHE DE TATOUEURS — appelée par le moteur, sans rechargement
 * --------------------------------------------------------------------
 * Le moteur d'accueil n'a AUCUN bouton : chaque changement de style,
 * de ville ou de rayon appelle cette route et remplace les cartes.
 * La page, elle, ne se recharge jamais.
 *
 * Route PUBLIQUE (contrairement aux outils de /admin) : elle ne fait
 * que lire des fiches déjà publiques, et ne coûte rien.
 *
 * LE LIEU ARRIVE EN COORDONNÉES (lat/lon) ET AVEC SON NIVEAU, plus en
 * code de commune : la recherche fonctionne partout dans le monde, et
 * c'est le NIVEAU du lieu choisi (adresse, ville, région, pays) qui
 * décide du mode de recherche — voir `criteresDeLieu` dans
 * lib/tatoueurs.
 *
 * Essais :
 *   curl "http://localhost:3000/api/tatoueurs?lieu=Lyon&lat=45.76&lon=4.83&niveau=ville&ville=Lyon&rayon=50"
 *   curl "http://localhost:3000/api/tatoueurs?lieu=Allemagne&lat=51.16&lon=10.45&niveau=pays&paysCode=DE"
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const parametres = new URL(request.url).searchParams;
  const rayon = Number(parametres.get("rayon"));

  const lieu = lieuDepuisParametres(parametres);

  // LA PAGE DEMANDÉE — « voir plus » redemande la suivante, et rien
  // d'autre : la base ne rend jamais que ces 24 fiches-là.
  const page = Math.max(Number(parametres.get("page")) || 1, 1);

  const resultat = await listerTatoueurs({
    style: parametres.get("style") ?? "",
    //  LA NATURE cherchée — « tatouage » ou « flash » (passe nº 110).
    //  Une valeur inconnue est ignorée plus bas, comme un style.
    nature: parametres.get("nature") ?? "",
    ...criteresDeLieu(lieu, rayon),
    // Les interrupteurs ÉTEINTS par la personne : des slugs séparés
    // par des virgules — les inconnus sont simplement ignorés.
    exclure: (parametres.get("exclure") ?? "").split(",").filter(Boolean),
    limite: CARTES_PAR_PAGE,
    decalage: (page - 1) * CARTES_PAR_PAGE,
  });

  return NextResponse.json({
    ok: true,
    tatoueurs: resultat.tatoueurs,
    demonstration: resultat.demonstration,
    message: resultat.message,
    ville: resultat.ville,
    // COMBIEN RÉPONDENT EN TOUT : c'est lui qui décide s'il reste des
    // cartes à montrer sous le bouton « Voir plus ».
    total: resultat.total,
    page,
  });
}
