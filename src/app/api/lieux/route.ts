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

/**
 * §1 (nº 230) — LE CACHE DU SERVEUR, EN MÉMOIRE VIVE
 * ==================================================================
 * LE DÉTOUR DE LA Nº 228 EST LÉGITIME (navigateur → nous → géocodeur)
 * mais il coûte un aller-retour de plus, et cela se voyait. Une même
 * saisie ne doit interroger le géocodeur QU'UNE FOIS : « paris » est
 * tapé par tout le monde, et sa réponse ne change pas d'une heure à
 * l'autre.
 *
 * MÉMOIRE VIVE, ET C'EST SUFFISANT : ce cache vit dans le processus
 * du serveur, se perd à chaque redéploiement, et n'a besoin de rien
 * d'autre — ni Redis, ni table. Le `Cache-Control` de la réponse fait
 * le reste du chemin (navigateur et cache partagé).
 *
 * ⚠️ SEULES LES RÉPONSES DU GÉOCODEUR SONT GARDÉES. Une réponse du
 * FILET (nos villes, quand le géocodeur est muet) est une réponse
 * DÉGRADÉE : la mettre en cache figerait la panne bien après sa fin.
 */
const cache = new Map<string, { lieux: unknown[]; expire: number }>();
/** Un quart d'heure : les lieux ne bougent pas, et la mémoire reste
    minuscule. */
const DUREE_CACHE_MS = 15 * 60_000;
/** Plafond du cache — au-delà, la plus ancienne entrée part. */
const CACHE_MAXIMUM = 500;

/** La clé : espaces resserrés, casse et accents ignorés — « PARIS »,
    « paris » et « Paris  » sont la même question. */
function cleCache(saisie: string): string {
  return saisie
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr");
}

/**
 * LE GÉOCODEUR VIENT-IL DE TOMBER ? (nº 230-§1)
 * ==================================================================
 * Quand il ne répond pas, chaque frappe paie l'attente AVANT que le
 * filet ne prenne la main — jusqu'à quatre secondes et demie par
 * lettre, et la recherche devient inutilisable au moment précis où
 * elle devrait faire comme si de rien n'était. On note donc l'échec :
 * pendant les trente secondes qui suivent, on va DIRECTEMENT au
 * filet, sans repasser par le service muet. Trente secondes, c'est
 * assez court pour qu'un service qui revient soit repris tout de
 * suite, et assez long pour qu'une recherche entière ne paie l'attente
 * qu'une fois.
 */
let pannePayeeJusqua = 0;
const MEMO_PANNE_MS = 30_000;

export async function GET(requete: Request) {
  const saisie = (new URL(requete.url).searchParams.get("q") ?? "").trim();
  if (saisie.length < SAISIE_MINIMUM) {
    return NextResponse.json(
      { lieux: [], source: "vide" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  //  DÉJÀ DEMANDÉ RÉCEMMENT ? On répond sans sortir du processus.
  const cle = cleCache(saisie);
  const garde = cache.get(cle);
  if (garde && garde.expire > Date.now()) {
    return NextResponse.json(
      { lieux: garde.lieux, source: "cache" },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=900" } }
    );
  }

  //  LE CHEMIN NORMAL — le géocodeur, interrogé par le serveur. On le
  //  saute tant que la panne notée n'a pas expiré.
  if (Date.now() >= pannePayeeJusqua) {
    try {
      const lieux = await chercherChezPhoton(
        saisie,
        AbortSignal.timeout(PATIENCE_MS)
      );
      if (lieux.length > 0) {
        //  Il répond : la panne éventuelle est levée.
        pannePayeeJusqua = 0;
        if (cache.size >= CACHE_MAXIMUM) {
          const plusAncienne = cache.keys().next().value;
          if (plusAncienne !== undefined) cache.delete(plusAncienne);
        }
        cache.set(cle, { lieux, expire: Date.now() + DUREE_CACHE_MS });
        return NextResponse.json(
          { lieux, source: "geocodeur" },
          {
            //  Une même saisie donne la même réponse : un quart d'heure
            //  de cache partagé ménage un service public et gratuit, et
            //  une minute côté navigateur suffit à absorber les
            //  allers-retours d'une même recherche.
            headers: { "Cache-Control": "public, max-age=60, s-maxage=900" },
          }
        );
      }
    } catch {
      //  Injoignable, trop lent, ou en erreur : on note la panne — les
      //  frappes suivantes iront droit au filet — et on continue.
      pannePayeeJusqua = Date.now() + MEMO_PANNE_MS;
    }
  }

  //  LE FILET — nos villes. Jamais mis en cache : c'est une réponse
  //  de repli, elle ne doit pas survivre au retour du géocodeur.
  const lieux = await villesDuCatalogue(saisie);
  return NextResponse.json(
    { lieux, source: "catalogue" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
