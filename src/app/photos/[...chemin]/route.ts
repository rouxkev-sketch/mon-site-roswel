import { CACHE_PHOTOS } from "@/lib/cache-photos";
import { PORTE_PHOTOS } from "@/lib/photos-du-bord";

/**
 * ██ LA PORTE DES PHOTOS (passe nº 782) ██
 * ==================================================================
 * Elle relaie une photo du stockage et pose SUR SA RÉPONSE la consigne
 * de cache que le stockage, lui, refuse de servir (nº 781). Vercel
 * garde alors cette réponse à son bord, au plus près du visiteur, et
 * la ressert sans redemander quoi que ce soit — plus d'aller-retour
 * jusqu'aux États-Unis à chaque affichage.
 *
 * CE QU'ELLE NE FAIT PAS, ET C'EST AUSSI IMPORTANT :
 *  · elle ne TRANSFORME rien — les octets rendus sont ceux du
 *    stockage, au bit près. Aucun ré-encodage, aucun redimensionnement,
 *    donc rien qui change à l'œil (règle nº 280) et aucune
 *    transformation d'image facturée ;
 *  · elle n'est PAS un relais ouvert : elle ne sait joindre que le
 *    stockage du projet courant, et rien d'autre. L'adresse demandée
 *    ne fournit que le chemin DANS ce stockage ; le début de l'adresse
 *    est écrit ici, jamais reçu.
 *
 * ⚠️ LE PROJET VISÉ EST TOUJOURS LE COURANT (`NEXT_PUBLIC_SUPABASE_URL`),
 * même si la base porte encore l'adresse d'un ancien projet (nº 775) :
 * les fichiers sont là où le site regarde aujourd'hui.
 */

/*  ⚠️ CETTE ROUTE VIT À CHAQUE DEMANDE, et c'est voulu : c'est la
    RÉPONSE qui est gardée au bord (par sa consigne de cache), pas la
    route qui est figée à la construction. Une photo déposée après la
    mise en ligne doit pouvoir être servie sans reconstruire le site. */
export const dynamic = "force-dynamic";

/**
 * LA CONSIGNE POSÉE SUR LA RÉPONSE.
 *  · `public`      — une photo de portfolio est publique ; sans ce mot,
 *                    aucun cache partagé n'a le droit de la garder ;
 *  · `max-age`     — pour le NAVIGATEUR du visiteur ;
 *  · `s-maxage`    — pour le cache PARTAGÉ, celui de Vercel : c'est lui
 *                    qui fait la différence entre « près de toi » et
 *                    « à l'autre bout du monde » ;
 *  · `immutable`   — le nom d'un fichier porte l'instant de son dépôt
 *                    (nº 721) : ce nom-là ne changera jamais de
 *                    contenu, le navigateur n'a donc RIEN à revalider.
 * ⚠️ LA DURÉE N'EST PAS ÉCRITE ICI : c'est celle du site
 * (`lib/cache-photos`, un an), la même que les envois posent depuis la
 * nº 721 — une seule écriture (piège nº 378).
 */
const CONSIGNE =
  `public, max-age=${CACHE_PHOTOS}, s-maxage=${CACHE_PHOTOS}, immutable`;

/** Le stockage du projet courant, sans barre finale. */
function racineDuStockage(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  return `${url.replace(/\/+$/, "")}/storage/v1/object/public`;
}

/**
 * LE CHEMIN DEMANDÉ, RENDU SÛR.
 * ⚠️ DEUX GARDES, ET CHACUNE FERME UNE PORTE :
 *  · aucun segment vide, `.` ou `..` — sans quoi une adresse bricolée
 *    remonterait hors du seau ;
 *  · le premier segment est le SEAU, et il doit ressembler à un nom de
 *    seau (lettres, chiffres, tirets) — pas à un hôte ni à un chemin.
 * Rien de ce que le visiteur envoie ne compose l'adresse au-delà de
 * ça : le début vient de l'environnement, jamais de la requête.
 */
function cheminSur(segments: string[]): string | null {
  if (segments.length < 2) return null;
  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") return null;
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segments[0])) return null;
  return segments.map(encodeURIComponent).join("/");
}

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ chemin: string[] }> }
) {
  const racine = racineDuStockage();
  if (!racine) {
    return new Response("stockage non configuré", { status: 503 });
  }
  const { chemin } = await params;
  const sur = cheminSur(chemin ?? []);
  if (!sur) {
    return new Response("chemin refusé", { status: 400 });
  }

  let amont: Response;
  try {
    amont = await fetch(`${racine}/${sur}`, {
      //  On transmet la question du navigateur « l'ai-je déjà ? » :
      //  le stockage peut alors répondre 304, sans corps.
      headers: {
        "if-none-match": requete.headers.get("if-none-match") ?? "",
        "if-modified-since": requete.headers.get("if-modified-since") ?? "",
      },
      //  ⚠️ PAS DE CACHE INTERNE ICI : c'est la RÉPONSE qui est gardée
      //  au bord, une fois, par sa consigne. Garder aussi la demande
      //  amont ne servirait qu'à retenir en double.
      cache: "no-store",
      redirect: "follow",
    });
  } catch {
    //  Le stockage ne répond pas : on le dit, et surtout on NE POSE PAS
    //  la consigne — une panne d'une seconde ne doit pas être gardée un
    //  an au bord du monde.
    return new Response("photo injoignable", {
      status: 502,
      headers: { "cache-control": "no-store" },
    });
  }

  if (amont.status === 304) {
    return new Response(null, {
      status: 304,
      headers: { "cache-control": CONSIGNE },
    });
  }
  if (!amont.ok) {
    //  Une photo absente reste absente : on rend le même refus, sans
    //  consigne de garde (voir juste au-dessus).
    return new Response(null, {
      status: amont.status,
      headers: { "cache-control": "no-store" },
    });
  }

  const entetes = new Headers();
  entetes.set(
    "content-type",
    amont.headers.get("content-type") ?? "application/octet-stream"
  );
  const etiquette = amont.headers.get("etag");
  if (etiquette) entetes.set("etag", etiquette);
  const longueur = amont.headers.get("content-length");
  if (longueur) entetes.set("content-length", longueur);
  //  LA CONSIGNE, ET C'EST TOUTE LA PASSE.
  entetes.set("cache-control", CONSIGNE);
  //  Une photo n'est pas un document : on interdit qu'un navigateur
  //  devine un autre type que celui annoncé.
  entetes.set("x-content-type-options", "nosniff");

  //  Le corps est RELAYÉ TEL QUEL, sans être chargé en mémoire : une
  //  photo de plusieurs méga-octets traverse sans peser sur la
  //  fonction.
  return new Response(amont.body, { status: 200, headers: entetes });
}

/*  La porte est nommée une seule fois (lib/photos-du-bord) ; on la
    relit ici pour que le fichier échoue à la construction si les deux
    venaient à diverger. */
if (PORTE_PHOTOS !== "/photos") {
  throw new Error(
    "PORTE_PHOTOS ne correspond plus au dossier de cette route (app/photos)"
  );
}
