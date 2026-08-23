/**
 * ██ §2 (nº 509) — « EN FRANCE », « AUX ÉTATS-UNIS », « AU JAPON » ██
 * ==================================================================
 * À QUOI ÇA SERT, ET À RIEN D'AUTRE : écrire le palier « pays » des
 * issues de « Aucun résultat » (composants/AucunResultat, posé par
 * IndexTatoueurs). Le propriétaire veut lire le nom du pays dans le
 * badge — « Chercher en France » — et non plus un « Chercher partout »
 * qui saute du quartier au monde entier d'un coup.
 *
 * ⚠️ LE FRANÇAIS N'A PAS DE RÈGLE CALCULABLE ICI, et c'est la seule
 * chose à comprendre avant de toucher ce fichier. La préposition
 * dépend du GENRE et du NOMBRE du nom de pays, qui ne se lisent nulle
 * part dans les données : « le Japon » mais « la France », « les
 * États-Unis » mais « Cuba » sans article du tout. Aucune terminaison
 * ne tranche — « Mexique » est masculin, « Belgique » féminin.
 *
 * LA MÉTHODE, DONC : UNE TABLE D'EXCEPTIONS, ET UN REPLI SÛR.
 *  · la table est clée par CODE ISO à deux lettres (`code_pays`), pas
 *    par le nom : le code ne change pas, ne s'orthographie pas de deux
 *    façons et ne dépend d'aucune traduction ;
 *  · elle ne liste QUE les trois cas minoritaires — « aux » (pluriel),
 *    « au » (masculin à consonne), « à » (pays sans article) ;
 *  · TOUT LE RESTE PREND « EN », et c'est juste pour la grande
 *    majorité : les pays féminins (« en Espagne », « en Italie ») et
 *    les masculins à voyelle initiale (« en Iran », « en Angola »).
 *
 * ⚠️ CE QUE CE REPLI PEUT ENCORE RATER, dit franchement : un pays
 * MASCULIN À CONSONNE absent de la table se lira « en » au lieu de
 * « au ». C'est une faute de langue, jamais une erreur de recherche —
 * le badge cherche au bon endroit dans tous les cas. La table couvre
 * les pays où le site a des fiches ou peut en avoir ; la compléter est
 * une ligne, et c'est le seul endroit où le faire.
 *
 * ⚠️ SANS CODE PAYS, IL N'Y A PAS DE BADGE DU TOUT : l'appelant passe
 * alors directement au palier « monde » (voir IndexTatoueurs). On
 * n'écrit jamais une préposition au hasard sur un nom qu'on ne
 * reconnaît pas.
 */

/** Les pays dont le nom est PLURIEL : « aux Pays-Bas ». */
const PLURIELS = [
  "US", // États-Unis
  "NL", // Pays-Bas
  "PH", // Philippines
  "AE", // Émirats arabes unis
  "BS", // Bahamas
  "KM", // Comores
  "MV", // Maldives
  "SC", // Seychelles
  "SB", // Îles Salomon
  "FJ", // Fidji
  "MH", // Îles Marshall
  "KI", // Kiribati
  "TO", // Tonga
  "PW", // Palaos
  "KY", // Îles Caïmans
  "VI", // Îles Vierges
  "CK", // Îles Cook
  "FK", // Îles Malouines
] as const;

/** Les pays MASCULINS à consonne initiale : « au Japon ». */
const MASCULINS = [
  // Amériques
  "CA", // Canada
  "BR", // Brésil
  "MX", // Mexique
  "CL", // Chili
  "PE", // Pérou
  "VE", // Venezuela
  "PY", // Paraguay
  "UY", // Uruguay
  "SR", // Suriname
  "GY", // Guyana
  "BZ", // Belize
  "SV", // Salvador
  "GT", // Guatemala
  "HN", // Honduras
  "NI", // Nicaragua
  "CR", // Costa Rica
  "PA", // Panama
  "GL", // Groenland
  // Europe
  "PT", // Portugal
  "DK", // Danemark
  "LU", // Luxembourg
  "LI", // Liechtenstein
  "ME", // Monténégro
  "XK", // Kosovo (code de fait, servi par les fournisseurs)
  "BY", // Bélarus
  // Afrique
  "MA", // Maroc
  "SN", // Sénégal
  "ML", // Mali
  "NE", // Niger
  "TD", // Tchad
  "TG", // Togo
  "BJ", // Bénin
  "BF", // Burkina Faso
  "GA", // Gabon
  "CG", // Congo
  "CD", // Congo (RDC)
  "RW", // Rwanda
  "BI", // Burundi
  "MZ", // Mozambique
  "ZW", // Zimbabwe
  "BW", // Botswana
  "LS", // Lesotho
  "SZ", // Eswatini
  "MW", // Malawi
  "SD", // Soudan
  "SS", // Soudan du Sud
  "LR", // Liberia
  "GH", // Ghana
  "NG", // Nigeria
  "KE", // Kenya
  "CV", // Cap-Vert
  // Asie et Moyen-Orient
  "JP", // Japon
  "VN", // Vietnam
  "KH", // Cambodge
  "LA", // Laos
  "BD", // Bangladesh
  "PK", // Pakistan
  "NP", // Népal
  "LK", // Sri Lanka
  "BT", // Bhoutan
  "MM", // Myanmar
  "TJ", // Tadjikistan
  "TM", // Turkménistan
  "KZ", // Kazakhstan
  "KG", // Kirghizistan
  "YE", // Yémen
  "QA", // Qatar
  "KW", // Koweït
  "LB", // Liban
  // Océanie
  "VU", // Vanuatu
] as const;

/** Les pays SANS ARTICLE : « à Cuba », « à Singapour ». */
const SANS_ARTICLE = [
  "CU", // Cuba
  "MG", // Madagascar
  "MT", // Malte
  "CY", // Chypre
  "SG", // Singapour
  "MC", // Monaco
  "TW", // Taïwan
  "BH", // Bahreïn
  "HT", // Haïti
  "DJ", // Djibouti
  "MU", // Maurice
  "SM", // Saint-Marin
  "VA", // Vatican
  "HK", // Hong Kong
  "MO", // Macao
  "BN", // Brunei
  "TL", // Timor oriental
  "OM", // Oman
  "NR", // Nauru
  "TV", // Tuvalu
  "WS", // Samoa
  //  ⚠️ NE PAS AJOUTER ICI les îles dont le nom porte un article :
  //  l'Islande, l'Irlande, la Jamaïque et la Nouvelle-Zélande sont
  //  féminines — elles prennent « en » par le repli, et c'est juste.
] as const;

const TABLE = new Map<string, string>();
for (const code of PLURIELS) TABLE.set(code, "aux");
for (const code of MASCULINS) TABLE.set(code, "au");
for (const code of SANS_ARTICLE) TABLE.set(code, "à");

/**
 * LE NOM DU PAYS PRÉCÉDÉ DE SA PRÉPOSITION — « en France », « aux
 * États-Unis », « au Japon », « à Cuba ».
 * @param nom  le nom du pays, déjà écrit comme le site l'affiche
 *   (`nomPaysAffiche`, lib/adresse) — ce fichier n'écrit pas les noms,
 *   il ne pose que le mot devant.
 * @param code le code ISO à deux lettres. Inconnu ou absent : « en »,
 *   le repli majoritaire.
 */
export function paysAvecPreposition(
  nom: string,
  code: string | null | undefined
): string {
  const preposition = TABLE.get((code ?? "").trim().toUpperCase()) ?? "en";
  return `${preposition} ${nom}`;
}
