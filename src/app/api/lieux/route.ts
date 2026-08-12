import { NextResponse } from "next/server";
import { chercherChezPhoton } from "@/lib/geocodage/photon";
import { SAISIE_MINIMUM } from "@/lib/geocodage";
import { villesDuCatalogue } from "@/lib/villes-catalogue";

/**
 * LES SUGGESTIONS DE LIEUX — SERVIES PAR NOTRE PROPRE DOMAINE
 * ==================================================================
 * (passe nº 228-§1)
 *
 * LA CAUSE MESURÉE. Le champ d'adresse du moteur appelait le
 * géocodeur DEPUIS LE NAVIGATEUR, directement sur
 * `https://photon.komoot.io`. Tout ce qui se met entre le visiteur et
 * ce domaine — panne du service, réseau d'entreprise, bloqueur de
 * contenu, protection anti-pistage d'un iPhone, DNS d'opérateur —
 * rend la fonction centrale du site muette : la frappe est bien
 * reçue, mais aucune suggestion n'arrive. Mesuré ici : la requête
 * partait bien et mourait en `ERR_TUNNEL_CONNECTION_FAILED`.
 *
 * CE QUE CETTE ROUTE CHANGE. Le navigateur ne parle plus qu'à NOTRE
 * domaine ; c'est le SERVEUR qui interroge le géocodeur. Plus de
 * requête vers un tiers depuis la page — donc plus rien à bloquer, ni
 * CORS, ni domaine inconnu.
 *
 * ET SURTOUT, UN FILET. Si le géocodeur ne répond pas, la route sert
 * NOS PROPRES VILLES (celles où des tatoueurs sont publiés, voir
 * lib/villes-catalogue). Le moteur est alors dégradé — les rues ne
 * sont plus proposées — mais il n'est jamais MUET, et il propose
 * exactement les villes qui donneront des résultats. La réponse dit
 * laquelle des deux sources a répondu (`source`), pour qu'un relevé
 * puisse le constater sans deviner.
 */

/** Au-delà, on n'attend plus le géocodeur : le filet répond. Une
    suggestion qui arrive en cinq secondes n'aide plus personne. */
const PATIENCE_MS = 4500;

export async function GET(requete: Request) {
  const saisie = (new URL(requete.url).searchParams.get("q") ?? "").trim();
  if (saisie.length < SAISIE_MINIMUM) {
    return NextResponse.json(
      { lieux: [], source: "vide" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  //  LE CHEMIN NORMAL — le géocodeur, interrogé par le serveur.
  try {
    const lieux = await chercherChezPhoton(
      saisie,
      AbortSignal.timeout(PATIENCE_MS)
    );
    if (lieux.length > 0) {
      return NextResponse.json(
        { lieux, source: "geocodeur" },
        {
          //  Une même saisie donne la même réponse : cinq minutes de
          //  cache partagé ménagent un service public et gratuit.
          headers: { "Cache-Control": "public, max-age=0, s-maxage=300" },
        }
      );
    }
  } catch {
    //  Injoignable, trop lent, ou en erreur : le filet prend la main.
  }

  //  LE FILET — nos villes. Jamais mis en cache : c'est une réponse
  //  de repli, elle ne doit pas survivre au retour du géocodeur.
  const lieux = await villesDuCatalogue(saisie);
  return NextResponse.json(
    { lieux, source: "catalogue" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
