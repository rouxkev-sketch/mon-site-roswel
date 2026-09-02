import { nomVilleCourt } from "@/lib/villes";
import { contexteSuggestion } from "@/lib/adresse";
import type { LieuTrouve, PrecisionLieu } from "@/lib/geocodage/types";

/**
 * LE FOURNISSEUR PHOTON (OpenStreetMap) — le SEUL fichier qui connaît
 * ce service. Tout le reste du site parle en `LieuTrouve`.
 * ===================================================================
 * Photon (https://photon.komoot.io) est un géocodeur public, gratuit,
 * SANS CLÉ, bâti sur les données d'OpenStreetMap : couverture
 * MONDIALE, adresses comme villes, et une recherche « au fil de la
 * frappe » (c'est son métier — il est fait pour ça).
 *
 * CHANGER DE FOURNISSEUR : écrire un fichier de la même forme
 * (`FournisseurGeocodage`) et le brancher dans index.ts. Aucun
 * composant, aucune colonne de base ne bouge — c'est tout l'intérêt de
 * ce découpage. Le jour où nous hébergeons NOTRE Photon, seule
 * l'adresse ci-dessous change (variable d'environnement prévue).
 *
 * `lang=fr` : Photon renvoie les noms traduits quand OpenStreetMap les
 * porte — « États-Unis », « Allemagne »… Les noms de lieux, eux,
 * restent dans leur langue (c'est bien : « München » se cherche aussi
 * bien que « Munich », les deux ramènent la même ville).
 */

/** L'adresse du service — surchargeable le jour d'un Photon à nous. */
const ADRESSE_PHOTON =
  process.env.NEXT_PUBLIC_PHOTON_URL ?? "https://photon.komoot.io/api/";

/** Combien de suggestions au plus. Huit : de quoi lever une ambiguïté
    sans noyer la liste (et sans faire défiler sur un téléphone). */
const NOMBRE_SUGGESTIONS = 8;

/** Ce que Photon renvoie, tel quel (GeoJSON). Décrit ici pour que
    personne d'autre n'ait à connaître cette forme. */
type TraitPhoton = {
  properties?: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
  geometry?: { coordinates?: [number, number] };
};

/** Un texte non vide, débarrassé de ses espaces ; null sinon. */
function propre(valeur: string | undefined | null): string | null {
  const texte = (valeur ?? "").trim();
  return texte.length > 0 ? texte : null;
}

/**
 * LE NIVEAU DE PRÉCISION du résultat, d'après ce que Photon en dit —
 * et c'est lui qui décidera COMMENT on cherche (distance, région ou
 * pays entier ; voir lib/tatoueurs).
 * Une rue ou un numéro = une adresse ; une ville, un village, un
 * quartier = une ville ; un État, une région, un département = une
 * région ; un PAYS a son niveau à lui.
 * AUCUNE LISTE DE PAYS N'EST ÉCRITE ICI : c'est le type renvoyé par
 * OpenStreetMap qui parle — « Allemagne », « Canada » ou « Japon »
 * sont reconnus sans que le code ne les connaisse.
 */
function precisionDe(type: string | undefined, rue: string | null): PrecisionLieu {
  if (rue) return "adresse";
  if (type === "house" || type === "street") return "adresse";
  if (type === "country") return "pays";
  if (type === "city" || type === "district" || type === "locality") {
    return "ville";
  }
  if (type === "state" || type === "county") return "region";
  return "ville";
}

/*
 * ⚠️ `contexteDe` A ÉTÉ RETIRÉE À LA PASSE Nº 114. Elle composait ici
 * la ligne grise des suggestions — ville, région, pays — et posait
 * donc la RÉGION pour tous les pays, y compris la France
 * (« Vézilly, Hauts-de-France, France »). C'est exactement la règle
 * que cette passe interdit. La composition est passée à
 * `contexteSuggestion` (lib/adresse), qui la tient pour tout le site :
 * une règle d'adresse n'a pas à exister chez un fournisseur de
 * géocodage.
 */

/** Un trait Photon → un lieu de yokofolio. Null si inexploitable
    (sans coordonnées, il n'y a pas de recherche par rayon possible). */
function convertir(trait: TraitPhoton): LieuTrouve | null {
  const p = trait.properties ?? {};
  const coordonnees = trait.geometry?.coordinates;
  if (!coordonnees || coordonnees.length < 2) return null;
  const [longitude, latitude] = coordonnees;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const numero = propre(p.housenumber);
  const rue = propre(p.street);
  const nom = propre(p.name);
  // « Lyon 3e Arrondissement » → « Lyon 3e » : la règle d'affichage du
  // site vaut aussi pour ce qui vient d'OpenStreetMap.
  const ville = propre(p.city) ? nomVilleCourt(propre(p.city)!) : null;
  const region = propre(p.state) ?? propre(p.county);
  const pays = propre(p.country);

  // L'INTITULÉ : l'adresse postale si on en a une, le nom du lieu
  // sinon. Photon place parfois la rue dans `name` (résultat de type
  // « street ») : les deux cas sont couverts.
  const ligneRue = rue
    ? [numero, rue].filter(Boolean).join(" ")
    : numero && nom
      ? `${numero} ${nom}`
      : null;
  const intitule = ligneRue ?? nom ?? ville ?? region ?? pays ?? "";
  if (!intitule) return null;

  const precision = precisionDe(p.type, ligneRue);

  // QUAND L'ENTRÉE EST ELLE-MÊME UNE RÉGION OU UN PAYS, Photon met son
  // nom dans `name` et laisse `state`/`country` vides : on les
  // renseigne à partir de l'intitulé. C'est ce qui permet ensuite de
  // comparer aux fiches (leur région, leur pays) — sans quoi choisir
  // « Bayern » ou « Allemagne » ne trouverait rien.
  const regionRetenue = precision === "region" ? (region ?? nom) : region;
  const paysRetenu = precision === "pays" ? (pays ?? nom) : pays;

  return {
    identifiant: `photon:${p.osm_type ?? "?"}:${p.osm_id ?? "0"}`,
    intitule: nomVilleCourt(intitule),
    //  ⚠️ LE CONTEXTE SUIT LA RÈGLE DU CODE ADMINISTRATIF (passe
    //  nº 114) : code postal + ville, le code de l'État seulement pour
    //  les pays qui l'écrivent, puis le pays. Il ne répète jamais
    //  l'intitulé. La règle vit dans lib/adresse — pas ici.
    contexte: contexteSuggestion(
      {
        code_postal: propre(p.postcode),
        ville: ville ?? (precision === "ville" ? nomVilleCourt(intitule) : null),
        region: regionRetenue,
        pays: paysRetenu,
        code_pays: propre(p.countrycode)?.toUpperCase() ?? null,
      },
      nomVilleCourt(intitule)
    ),
    adresse: ligneRue,
    // Une ville choisie SEULE n'a pas de `city` chez Photon : c'est
    // son nom qui fait la ville.
    ville: ville ?? (precision === "ville" ? nomVilleCourt(intitule) : null),
    code_postal: propre(p.postcode),
    region: regionRetenue,
    pays: paysRetenu,
    code_pays: propre(p.countrycode)?.toUpperCase() ?? null,
    latitude,
    longitude,
    precision,
  };
}

/**
 * LA RECHERCHE — la seule fonction exportée, à la forme exacte de
 * `FournisseurGeocodage`. Le `signal` vient de l'appelant : c'est lui
 * qui annule la requête précédente quand la frappe continue.
 */
export async function chercherChezPhoton(
  saisie: string,
  signal: AbortSignal
): Promise<LieuTrouve[]> {
  const adresse = new URL(ADRESSE_PHOTON);
  adresse.searchParams.set("q", saisie);
  adresse.searchParams.set("lang", "en");
  adresse.searchParams.set("limit", String(NOMBRE_SUGGESTIONS * 2));

  const reponse = await fetch(adresse, { signal });
  if (!reponse.ok) throw new Error(`Photon answered ${reponse.status}`);
  const donnees = (await reponse.json()) as { features?: TraitPhoton[] };

  const lieux: LieuTrouve[] = [];
  const vus = new Set<string>();
  for (const trait of donnees.features ?? []) {
    const lieu = convertir(trait);
    if (!lieu) continue;
    // DÉDOUBLONNAGE À L'AFFICHAGE : deux entrées OpenStreetMap
    // distinctes peuvent se lire exactement pareil (le nœud et la
    // relation d'une même ville). Une seule ligne dans la liste.
    const cle = `${lieu.intitule}|${lieu.contexte}`.toLocaleLowerCase("fr");
    if (vus.has(cle)) continue;
    vus.add(cle);
    lieux.push(lieu);
    if (lieux.length >= NOMBRE_SUGGESTIONS) break;
  }
  return lieux;
}
