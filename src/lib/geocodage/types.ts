/**
 * LE FORMAT DE LIEU DE YOKOFOLIO — indépendant de tout fournisseur
 * =================================================================
 * C'est NOTRE vocabulaire, pas celui d'un service extérieur. Photon
 * (OpenStreetMap) le remplit aujourd'hui ; demain un serveur Photon
 * hébergé par nous, ou un autre géocodeur, le remplira à sa place :
 * seul le fichier du fournisseur (photon.ts) changera, jamais les
 * composants ni la base.
 *
 * QUATRE NIVEAUX DE PRÉCISION, un seul type : c'est `precision` qui
 * dit ce que la personne a choisi — et c'est LUI qui décide COMMENT
 * on cherche (voir lib/tatoueurs) :
 *  - « adresse »  : numéro + rue + ville (salon avec pignon sur rue)
 *                   → recherche par DISTANCE, avec le rayon ;
 *  - « ville »    : la ville seule (artiste sans adresse publique)
 *                   → recherche par DISTANCE, avec le rayon ;
 *  - « region »   : une région, un État, un Land, un département
 *                   → toutes les fiches de CETTE région, sans rayon ;
 *  - « pays »     : un pays entier
 *                   → toutes les fiches de CE pays, sans rayon.
 * Un rayon autour du centre d'un pays n'aurait aucun sens : 25 km
 * autour du centre de la France ne couvrent presque rien.
 * Rien n'est imposé : la personne prend l'entrée qui lui convient.
 */

/** Ce que la personne a choisi dans la liste. */
export type PrecisionLieu = "adresse" | "ville" | "region" | "pays";

/** UN LIEU, tel que yokofolio le connaît — le seul format qui circule
    dans les composants, l'API et la base. */
export type LieuTrouve = {
  /** Identifiant du fournisseur (« photon:relation:7444 ») : il permet
      de RETROUVER le lieu plus tard, chez le même fournisseur. */
  identifiant: string;
  /** Ce qui est écrit en GRAS dans la suggestion et dans le champ :
      « 10 Rue de la Paix », « Springfield », « Lyon 1er ». */
  intitule: string;
  /** Ce qui lève l'ambiguïté, sous l'intitulé : « Paris, Île-de-France,
      France », « Illinois, États-Unis ». Vide si le lieu se suffit. */
  contexte: string;
  /** Numéro et rue, quand la personne a choisi une adresse complète. */
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  /** État, province, région, Land… selon le pays. Null quand le pays
      n'en a pas (ou que le fournisseur n'en donne pas). Quand la
      personne a choisi une RÉGION, c'est ce champ qui porte son nom :
      c'est lui qu'on compare aux fiches. */
  region: string | null;
  pays: string | null;
  /** Code ISO à deux lettres, en MAJUSCULES (« FR », « US »). */
  code_pays: string | null;
  latitude: number;
  longitude: number;
  precision: PrecisionLieu;
};

/** Ce qu'une recherche renvoie — jamais d'exception jetée aux
    composants : soit des lieux, soit une panne nommée. */
export type ReponseGeocodage =
  | { ok: true; lieux: LieuTrouve[] }
  | { ok: false; panne: "reseau" | "annulee" };

/** Le contrat que TOUT fournisseur doit remplir. Changer de service,
    c'est écrire une nouvelle fonction de cette forme — rien d'autre. */
export type FournisseurGeocodage = (
  saisie: string,
  signal: AbortSignal
) => Promise<LieuTrouve[]>;
