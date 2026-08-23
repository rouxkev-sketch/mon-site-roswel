import { chercherChezNous } from "@/lib/geocodage/notre-serveur";
import type {
  FournisseurGeocodage,
  LieuTrouve,
  PrecisionLieu,
  ReponseGeocodage,
} from "@/lib/geocodage/types";

export type {
  LieuTrouve,
  PrecisionLieu,
  ReponseGeocodage,
} from "@/lib/geocodage/types";

/**
 * LE GÉOCODAGE DE YOKOFOLIO — la porte d'entrée unique
 * =====================================================
 * Les composants n'appellent QUE ce fichier. Ils ne savent pas qu'il
 * existe un service nommé Photon, et n'ont pas à le savoir : le jour
 * où nous changeons de fournisseur (Photon hébergé par nous, autre
 * géocodeur), seule la ligne `FOURNISSEUR` ci-dessous bouge.
 *
 * TROIS PROTECTIONS, ici et pas ailleurs — le service est public et
 * gratuit, on ne le maltraite pas :
 *  1. PLANCHER DE SAISIE — rien n'est demandé sous 2 caractères
 *     (nº 230-§1) ;
 *  2. MÉMOIRE DE SESSION — une saisie déjà cherchée n'est JAMAIS
 *     redemandée (la mémoire vit le temps de l'onglet, plafonnée) ;
 *  3. ANNULATION — chaque recherche annule la précédente (`AbortSignal`),
 *     et la PAUSE DE FRAPPE est tenue par le composant qui saisit
 *     (voir `PAUSE_FRAPPE_MS`, utilisé par ChampLocalisation).
 *
 * Aucune exception ne sort d'ici : la réponse dit `ok: false` avec la
 * panne, et le champ affiche un message clair.
 */

/**
 * Le fournisseur en service. Une ligne à changer, rien d'autre — et
 * c'est ce qu'a fait la nº 228-§1 : le navigateur n'appelle plus
 * Photon directement (un domaine tiers que n'importe quel bloqueur,
 * protection anti-pistage ou réseau d'entreprise peut couper, ce qui
 * rendait le moteur muet), mais NOTRE route `/api/lieux`. C'est le
 * SERVEUR qui parle à Photon désormais — et qui sert nos propres
 * villes quand Photon ne répond pas.
 */
const FOURNISSEUR: FournisseurGeocodage = chercherChezNous;

/** Sous ce nombre de caractères, aucune requête n'est envoyée.
    DEUX depuis la nº 230-§1 (trois avant) : « ly », « pa » suffisent
    à lancer la recherche, et la liste est là avant la troisième
    lettre. */
export const SAISIE_MINIMUM = 2;

/** La pause de frappe avant d'interroger le fournisseur (ms).
    250 depuis la nº 230-§1 : cinquante millisecondes gagnées sur
    chaque frappe, sans multiplier les requêtes. */
export const PAUSE_FRAPPE_MS = 250;

/** La mémoire de session : saisie normalisée → lieux trouvés. */
const memoire = new Map<string, LieuTrouve[]>();
/** Plafond de la mémoire — au-delà, les plus anciennes entrées
    partent. Une session de recherche n'a jamais besoin de plus. */
const MEMOIRE_MAXIMUM = 120;

/** La clé de mémoire : espaces resserrés, casse ignorée. « LYON  1er »
    et « lyon 1er » sont la même question. */
function cleMemoire(saisie: string): string {
  return saisie.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");
}

/** La recherche en cours, à annuler dès que la suivante arrive. */
let enCours: AbortController | null = null;

/**
 * CHERCHER UN LIEU. Ne jette jamais.
 * - saisie trop courte → liste vide, sans requête ;
 * - déjà cherchée → réponse immédiate, sans requête ;
 * - requête annulée par une frappe → panne « annulee » (le champ
 *   l'ignore : une autre réponse arrive derrière) ;
 * - service muet ou en erreur → panne « reseau » (message affiché).
 */
export async function chercherLieux(
  saisie: string
): Promise<ReponseGeocodage> {
  const cle = cleMemoire(saisie);
  if (cle.length < SAISIE_MINIMUM) return { ok: true, lieux: [] };

  const deja = memoire.get(cle);
  if (deja) return { ok: true, lieux: deja };

  enCours?.abort();
  const controleur = new AbortController();
  enCours = controleur;

  try {
    const lieux = await FOURNISSEUR(saisie.trim(), controleur.signal);
    if (memoire.size >= MEMOIRE_MAXIMUM) {
      const plusAncienne = memoire.keys().next().value;
      if (plusAncienne !== undefined) memoire.delete(plusAncienne);
    }
    memoire.set(cle, lieux);
    return { ok: true, lieux };
  } catch (erreur) {
    if (erreur instanceof DOMException && erreur.name === "AbortError") {
      return { ok: false, panne: "annulee" };
    }
    return { ok: false, panne: "reseau" };
  } finally {
    if (enCours === controleur) enCours = null;
  }
}

/** Vide la mémoire — les tests s'en servent pour repartir à zéro. */
export function oublierLieux() {
  memoire.clear();
}

/* ------------------------------------------------------------------
 * LE LIEU DANS L'ADRESSE DE LA PAGE
 * ------------------------------------------------------------------
 * Une recherche doit être PARTAGEABLE et survivre à un rechargement :
 * le lieu voyage donc dans l'adresse, en clair. Quatre paramètres
 * lisibles plutôt qu'un jeton opaque — « ?lieu=Lyon+1er&lat=45.76…&
 * lon=4.83…&rayon=25 » se lit, se copie, se corrige à la main.
 *
 * Le lieu reconstruit depuis l'adresse est VOLONTAIREMENT minimal :
 * de quoi l'AFFICHER (intitulé, contexte) et CHERCHER autour
 * (coordonnées). Le détail complet (code postal, région, pays) n'a
 * d'intérêt qu'au moment de l'enregistrement d'une fiche, pas ici.
 */

/* ------------------------------------------------------------------
 * LE LIEU D'UNE FICHE DÉJÀ ENREGISTRÉE
 * ------------------------------------------------------------------
 * La base range la localisation à plat (une colonne par information,
 * voir supabase/yokofolio-localisation-mondiale.sql). Ceci la
 * remonte en un `LieuTrouve` — c'est ce qui permet au formulaire de
 * rouvrir sur le lieu déjà choisi, sans rien redemander.
 * Fonctionne AUSSI pour les fiches d'avant la refonte : elles n'ont
 * ni pays ni identifiant, mais elles ont une ville et des
 * coordonnées — largement de quoi s'afficher.
 */
export function lieuDepuisFiche(
  ligne: Record<string, unknown> | null | undefined
): LieuTrouve | null {
  if (!ligne) return null;
  const texte = (cle: string): string | null => {
    const valeur = ligne[cle];
    if (typeof valeur !== "string") return null;
    const propre = valeur.trim();
    return propre.length > 0 ? propre : null;
  };
  const nombre = (cle: string): number => Number(ligne[cle]);

  const adresse = texte("adresse");
  const ville = texte("ville_nom");
  const region = texte("region");
  const pays = texte("pays");
  const latitude = nombre("latitude");
  const longitude = nombre("longitude");
  const intitule = adresse ?? ville;
  if (!intitule) return null;

  const contexteMorceaux = [
    ville && ville !== intitule ? ville : null,
    region,
    pays,
  ].filter(Boolean) as string[];

  return {
    identifiant: texte("lieu_id") ?? `fiche:${intitule}`,
    intitule,
    contexte: contexteMorceaux.join(", "),
    adresse,
    ville,
    code_postal: texte("code_postal"),
    region,
    pays,
    code_pays: texte("code_pays"),
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
    precision: adresse ? "adresse" : "ville",
  };
}

/**
 * ██ §2 (nº 509) — LE PAYS D'UN LIEU, COMME LIEU À PART ENTIÈRE ██
 * ==================================================================
 * À QUOI ÇA SERT : le palier « pays » des issues de « Aucun résultat ».
 * Le propriétaire ne veut plus qu'un « Chercher partout » saute du
 * quartier au monde entier ; on élargit d'abord AU PAYS de la
 * recherche en cours, et le monde ne vient qu'après.
 *
 * CE QUE LE LIEU FABRIQUÉ PORTE, ET CE QU'IL LAISSE :
 *  · `precision: "pays"` — c'est LUI qui commande : la fonction de
 *    base (rechercher_tatoueurs) ne regarde alors que `p_code_pays`,
 *    et ignore la région comme la ville ;
 *  · la RÉGION ET LA VILLE SONT DONC MISES À NULL, et pas seulement
 *    « ignorées » : un lieu-pays qui garderait le nom d'une commune
 *    serait un lieu qui ment, et le premier lecteur distrait s'en
 *    servirait ;
 *  · les COORDONNÉES sont celles du lieu de départ. Elles ne servent
 *    plus à chercher (aucun rayon au niveau d'un pays — voir
 *    `criteresDeLieu`), mais elles doivent rester VALIDES : c'est à
 *    elles que `lieuDepuisParametres` reconnaît une adresse portant un
 *    lieu, au rechargement comme au partage (règle nº 328).
 *
 * RIEN N'EST FABRIQUÉ QUAND ON NE SAIT PAS : sans nom de pays ni code
 * ISO, et quand le lieu EST déjà un pays, la fonction rend `null` —
 * l'appelant passe alors au palier suivant, le monde.
 */
export function paysDuLieu(lieu: LieuTrouve | null): LieuTrouve | null {
  if (!lieu || lieu.precision === "pays") return null;
  const nom = (lieu.pays ?? "").trim();
  const code = (lieu.code_pays ?? "").trim();
  if (!nom || !code) return null;
  return {
    identifiant: `pays:${code.toUpperCase()}`,
    intitule: nom,
    //  Un pays se suffit : rien ne lève d'ambiguïté au-dessus de lui.
    contexte: "",
    adresse: null,
    ville: null,
    code_postal: null,
    region: null,
    pays: nom,
    code_pays: code.toUpperCase(),
    latitude: lieu.latitude,
    longitude: lieu.longitude,
    precision: "pays",
  };
}

/** Les paramètres d'adresse pour un lieu (vides s'il n'y en a pas).
    La PRÉCISION voyage avec : c'est elle qui dira au serveur COMMENT
    chercher (distance autour d'un point, région entière, pays
    entier) — et le pays / la région suivent, puisqu'ils servent alors
    de critère. */
export function lieuVersParametres(
  lieu: LieuTrouve | null
): Record<string, string> {
  if (!lieu) return {};
  return {
    lieu: lieu.intitule,
    ...(lieu.contexte ? { zone: lieu.contexte } : {}),
    lat: lieu.latitude.toFixed(5),
    lon: lieu.longitude.toFixed(5),
    niveau: lieu.precision,
    ...(lieu.code_pays ? { paysCode: lieu.code_pays } : {}),
    ...(lieu.region ? { region: lieu.region } : {}),
    // La VILLE voyage aussi : c'est elle que la recherche « sans
    // rayon » compare aux fiches (une commune, pas un cercle vide).
    ...(lieu.ville ? { ville: lieu.ville } : {}),
  };
}

/** Le lieu porté par une adresse — null si elle n'en porte pas (ou
    si ses coordonnées ne tiennent pas debout). */
export function lieuDepuisParametres(
  parametres: URLSearchParams | Record<string, string | undefined>
): LieuTrouve | null {
  const lire = (cle: string) =>
    parametres instanceof URLSearchParams
      ? parametres.get(cle)
      : (parametres[cle] ?? null);

  const intitule = (lire("lieu") ?? "").trim();
  const latitude = Number(lire("lat"));
  const longitude = Number(lire("lon"));
  if (!intitule) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  // Le niveau porté par l'adresse, validé — une valeur inconnue (ou
  // une adresse d'avant cette version) retombe sur « ville », le
  // comportement d'origine.
  const niveauBrut = (lire("niveau") ?? "").trim();
  const precision: PrecisionLieu = (
    ["adresse", "ville", "region", "pays"] as const
  ).includes(niveauBrut as PrecisionLieu)
    ? (niveauBrut as PrecisionLieu)
    : "ville";
  const region = (lire("region") ?? "").trim() || null;
  const codePays = (lire("paysCode") ?? "").trim().toUpperCase() || null;
  const villePortee = (lire("ville") ?? "").trim() || null;

  return {
    identifiant: `adresse:${latitude},${longitude}`,
    intitule,
    contexte: (lire("zone") ?? "").trim(),
    adresse: null,
    ville:
      villePortee ??
      (precision === "ville" || precision === "adresse" ? intitule : null),
    code_postal: null,
    region: precision === "region" ? (region ?? intitule) : region,
    pays: precision === "pays" ? intitule : null,
    code_pays: codePays,
    latitude,
    longitude,
    precision,
  };
}
