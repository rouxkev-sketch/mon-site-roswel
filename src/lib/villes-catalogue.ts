import { catalogueDemoAutorise } from "@/lib/catalogue-demonstration";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { TATOUEURS_DEMO } from "@/lib/tatoueurs-demo";
import { lieuDepuisFiche, type LieuTrouve } from "@/lib/geocodage";
//  §1 (nº 694) — la règle « en ligne » du site entier, posée sur une
//  lecture. Une seule écriture (voir sa note dans lib/tatoueurs).
import { listeEnLigne } from "@/lib/tatoueurs";

/**
 * NOS PROPRES VILLES — LE FILET DU MOTEUR (passe nº 228-§1)
 * ==================================================================
 * POURQUOI CE FICHIER EXISTE. Les suggestions du champ d'adresse
 * viennent d'un géocodeur EXTÉRIEUR (Photon/OpenStreetMap). Le jour où
 * ce service est injoignable — panne chez lui, réseau du visiteur,
 * bloqueur de contenu, protection anti-pistage d'un iPhone —, la
 * fonction centrale du site devient muette : on tape « LYON » et il ne
 * se passe RIEN. C'est très exactement le relevé du propriétaire.
 *
 * CE QUE CE FICHIER RÉPOND : nous connaissons déjà des villes — celles
 * où nos tatoueurs travaillent. Elles sont dans NOTRE base, elles ne
 * dépendent d'aucun tiers, et ce sont les seules qui donneront des
 * résultats de toute façon (chercher une ville où nous n'avons aucune
 * fiche ne montrerait rien). Le géocodeur reste le chemin normal — il
 * connaît les rues, le monde entier ; ce filet ne prend la main que
 * lorsqu'il ne répond pas.
 *
 * ⚠️ CÔTÉ SERVEUR UNIQUEMENT : il lit la base avec le client serveur.
 *
 * ⚠️ nº 810 — LE FILET PARLE LA LANGUE DU SITE. Il relit des fiches dont
 * certaines ont été écrites AVANT la nº 805, avec un nom de pays
 * français (« États-Unis »), et sa ligne grise recollait ville, région
 * et pays bruts (« Texas, États-Unis ») — c'est l'une des deux sources
 * possibles du français relevé par le propriétaire (l'autre : un nom
 * qu'OpenStreetMap ne connaît pas en anglais). `lieuDepuisFiche`
 * (lib/geocodage) dit désormais le pays en anglais d'après son code, et
 * compose la ligne grise par la règle d'adresse du site (lib/adresse) :
 * « TX, USA » sous « Austin », « Paris, France » sans la région. La
 * RÉGION, elle, reste telle qu'en base (« Californie » d'une fiche
 * d'avant la nº 805 s'affiche « CA », mais ne répond plus à une
 * recherche « California ») : docs/SQL-810-LOCALITES.md et
 * outils/relire-les-lieux-en-anglais.mjs la réécrivent.
 */

/** La casse et les accents ne comptent pas : « LYON » trouve « Lyon »,
    « montreal » trouve « Montréal ». */
function aplati(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

/** Une ville du catalogue, ramenée au format de lieu du site. */
type LigneVille = {
  ville_nom?: string | null;
  region?: string | null;
  pays?: string | null;
  code_pays?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lieu_id?: string | null;
};

function versLieu(ligne: LigneVille): LieuTrouve | null {
  //  ⚠️ SANS `adresse` : `lieuDepuisFiche` en fait alors un lieu de
  //  précision « ville », ce qu'il est — jamais une adresse précise.
  return lieuDepuisFiche({
    ville_nom: ligne.ville_nom,
    region: ligne.region,
    pays: ligne.pays,
    code_pays: ligne.code_pays,
    latitude: ligne.latitude,
    longitude: ligne.longitude,
    //  L'identifiant dit d'où vient la suggestion — utile au relevé,
    //  et il ne peut pas entrer en collision avec « photon:… ».
    lieu_id: ligne.lieu_id ?? `yokofolio:${aplati(ligne.ville_nom ?? "")}`,
  });
}

/** Deux fois la même ville ne fait qu'une suggestion. */
function sansDoublons(lieux: LieuTrouve[]): LieuTrouve[] {
  const vues = new Set<string>();
  const gardes: LieuTrouve[] = [];
  for (const lieu of lieux) {
    const cle = `${aplati(lieu.intitule)}|${aplati(lieu.pays ?? "")}`;
    if (vues.has(cle)) continue;
    vues.add(cle);
    gardes.push(lieu);
  }
  return gardes;
}

/**
 * LES VILLES DE NOTRE CATALOGUE QUI COMMENCENT PAR CETTE SAISIE.
 * Jamais d'exception : base injoignable → les fiches de
 * démonstration, comme partout ailleurs sur le site.
 */
export async function villesDuCatalogue(
  saisie: string,
  maximum = 8
): Promise<LieuTrouve[]> {
  const cherche = aplati(saisie);
  if (cherche.length === 0) return [];

  try {
    const supabase = await creerClientSupabaseServeur();
    /*  §1 (nº 694) — « EN LIGNE », PAS « PUBLIÉE ». Une ville qui
        n'existait que par un portfolio en suppression différée était
        encore proposée ici : on la choisissait, et la recherche ne
        rendait rien. La même règle que partout, par la même écriture
        (`listeEnLigne`, lib/tatoueurs). */
    const lignes = await listeEnLigne<LigneVille>((verrous) =>
      supabase
        .from("tatoueurs")
        .select(
          "ville_nom, region, pays, code_pays, latitude, longitude, lieu_id, " +
            verrous
        )
        .ilike("ville_nom", `%${saisie.trim()}%`)
        //  Large avant dédoublonnage : dix fiches d'une même ville ne
        //  doivent pas manger la liste.
        .limit(maximum * 8)
    );
    const lieux = sansDoublons(
      lignes.map(versLieu).filter((lieu): lieu is LieuTrouve => lieu !== null)
    );
    if (lieux.length > 0) return lieux.slice(0, maximum);
  } catch {
    //  Base injoignable : on continue sur la démonstration.
  }

  //  §4 (nº 278) — EN PRODUCTION, AUCUNE VILLE DE DÉMONSTRATION NON
  //  PLUS : les suggestions de lieux viennent de la base ou de rien.
  //  Une ville inventée mènerait à une recherche vide, ou pire, à une
  //  fausse fiche (voir lib/catalogue-demonstration).
  if (!catalogueDemoAutorise()) return [];

  const demo = TATOUEURS_DEMO.filter((fiche) =>
    aplati(fiche.ville_nom ?? "").includes(cherche)
  ).map((fiche) =>
    versLieu({
      ville_nom: fiche.ville_nom,
      region: fiche.region,
      pays: fiche.pays,
      code_pays: fiche.code_pays,
      latitude: fiche.latitude,
      longitude: fiche.longitude,
      lieu_id: fiche.lieu_id,
    })
  );
  return sansDoublons(
    demo.filter((lieu): lieu is LieuTrouve => lieu !== null)
  ).slice(0, maximum);
}
