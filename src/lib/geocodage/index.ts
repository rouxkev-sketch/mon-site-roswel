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
 * RIEN N'EST FABRIQUÉ QUAND ON NE SAIT PAS : sans code ISO, et quand
 * le lieu EST déjà un pays, la fonction rend `null` — l'appelant passe
 * alors au palier suivant, le monde.
 *
 * ██ §1 (nº 510) — POURQUOI LE BADGE DU PAYS NE PARAISSAIT JAMAIS ██
 * ==================================================================
 * LE SYMPTÔME : à Marseille, le badge du rayon marchait, mais le
 * second disait « Partout dans le monde » au lieu de « Chercher en
 * France ». Le palier « pays » n'existait pour personne.
 * LA CAUSE, ET ELLE EST DANS L'ADRESSE. Cette fonction exigeait DEUX
 * choses — le NOM du pays et son CODE ISO. Le code arrive bien
 * (`paysCode=FR`) ; le nom, jamais. `lieuVersParametres`, juste en
 * dessous, ne sérialise PAS `pays` : l'adresse ne porte donc pas ce
 * nom, et `lieuDepuisParametres` ne peut pas l'inventer — il ne le
 * rend que lorsque le lieu EST lui-même un pays, où l'intitulé fait
 * office de nom. Pour toute VILLE, `lieu.pays` vaut `null`, et la
 * condition tombait à chaque fois.
 * ⚠️ CE N'EST PAS LA MÊME SOURCE QUE LES CARTES. « Lyon, France » sous
 * une vignette (nº 486) vient de la colonne `pays` de la FICHE, en
 * base — le pays du tatoueur, pas celui de la recherche. Les deux ne
 * se croisent nulle part : que l'un s'affiche n'a jamais rien promis
 * sur l'autre.
 * LE REMÈDE : LE CODE ISO SUFFIT, ET LE NOM S'EN DÉDUIT. On garde
 * `lieu.pays` quand il est là — un lieu frais, sorti du géocodeur, le
 * porte, et c'est le mot exact que le champ affiche — et on retombe
 * sinon sur le nom français du code (`Intl.DisplayNames`).
 * ⚠️ AUCUNE ADRESSE NE CHANGE, et c'est délibéré : ajouter le nom du
 * pays aux paramètres aurait allongé toutes les adresses ET laissé
 * sans badge les liens DÉJÀ partagés, qui ne le porteraient pas. En
 * lisant le code, on répare aussi le passé (règle nº 328 : l'état vit
 * dans l'adresse — on ne lui ajoute rien qu'on puisse déduire).
 */

/**
 * LE NOM FRANÇAIS D'UN CODE PAYS — « FR » → « France », « US » →
 * « États-Unis », « JP » → « Japon ».
 * ⚠️ AUCUNE TABLE ÉCRITE À LA MAIN : `Intl.DisplayNames` porte les
 * données de langue du système (les mêmes que celles de l'écriture des
 * dates), donc les deux cents pays sans qu'on en recopie un seul. La
 * TABLE DES PRÉPOSITIONS, elle, reste irréductible — le genre d'un nom
 * de pays ne se calcule pas (voir lib/preposition-pays).
 * ⚠️ UN CODE INCONNU SE RECONNAÎT : `of()` rend alors le code lui-même
 * (« XX » → « XX »). On le refuse plutôt que d'écrire deux lettres en
 * majuscules dans un badge.
 * ⚠️ ET SI LA FONCTION N'EXISTE PAS (environnement trop ancien), on
 * rend une chaîne vide : l'appelant passe au palier monde, comme pour
 * un pays inconnu. Jamais d'exception jetée à l'affichage.
 */
function nomDuPays(code: string): string {
  try {
    const noms = new Intl.DisplayNames(["en"], { type: "region" });
    const nom = noms.of(code) ?? "";
    return nom.toUpperCase() === code.toUpperCase() ? "" : nom;
  } catch {
    return "";
  }
}

export function paysDuLieu(lieu: LieuTrouve | null): LieuTrouve | null {
  if (!lieu || lieu.precision === "pays") return null;
  const code = (lieu.code_pays ?? "").trim().toUpperCase();
  if (!code) return null;
  //  Le mot du géocodeur d'abord — c'est celui que le champ affiche ;
  //  le nom du code ensuite, pour tout lieu revenu par l'adresse.
  const nom = (lieu.pays ?? "").trim() || nomDuPays(code);
  if (!nom) return null;
  return {
    identifiant: `pays:${code}`,
    intitule: nom,
    //  Un pays se suffit : rien ne lève d'ambiguïté au-dessus de lui.
    contexte: "",
    adresse: null,
    ville: null,
    code_postal: null,
    region: null,
    pays: nom,
    code_pays: code,
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
