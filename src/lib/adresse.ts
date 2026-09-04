/**
 * L'ADRESSE, ÉCRITE UNE SEULE FOIS POUR TOUT LE SITE
 * ===================================================
 * ⚠️ CE FICHIER EST LA SEULE AUTORITÉ. Aucune carte, aucune fiche,
 * aucun champ, aucun moteur ne recompose une adresse à la main : ils
 * appellent l'une des fonctions d'ici. C'est la condition pour que la
 * règle du code administratif — la règle centrale de cette passe —
 * ne puisse pas diverger d'un écran à l'autre.
 *
 * SÉPARER CE QUE VOIT L'HUMAIN DE CE QUE LIT GOOGLE
 * --------------------------------------------------
 * L'humain veut une adresse COURTE et lisible ; Google veut l'adresse
 * EXACTE, code postal compris. Quatre écritures, donc, et une seule
 * source :
 *
 *   ligneCarte()        « Lyon, France » · « Miami, FL, USA »
 *                       Ni rue, ni code postal, ni région hors liste.
 *   ligneFiche()        « 18 Chemin du Bois de la Noue, Vézilly, France »
 *                       La rue revient, le code postal reste dehors :
 *                       le lien Google Maps emmène le client, il n'a
 *                       pas à recopier un code.
 *   ligneMoteur()       « Sydney, NSW, Australia » — la même que
 *                       ligneCarte, le pays sous sa forme
 *                       internationale : dans la barre de recherche, la
 *                       place manque. ⚠️ DEPUIS LA nº 590 LES DEUX
 *                       DISENT « USA » : les États-Unis s'abrègent dès
 *                       `RACCOURCIS_PAYS`, donc partout. Cette écriture
 *                       ne se distingue plus que sur les quatre autres
 *                       pays de `ABREGES_MOTEUR`.
 *   contexteSuggestion() « 69001 Lyon, France » — LE SEUL ENDROIT où
 *                       le code postal s'affiche, et seulement PENDANT
 *                       LA SAISIE : il faut pouvoir trancher entre deux
 *                       adresses qui se ressemblent. Il disparaît dès
 *                       que le lieu est retenu.
 *   adresseStructuree() l'adresse COMPLÈTE, invisible, pour les
 *                       moteurs (Schema.org PostalAddress).
 *
 * ⚠️ LE CHAMP DU FORMULAIRE ÉCRIT COMME UNE FICHE (passe nº 115). Il a
 * porté un temps le code postal et l'arrondissement une fois l'adresse
 * validée : plus maintenant. Ce qu'on a choisi doit se relire comme ce
 * que le visiteur lira — « 12 rue de la Paix, Lyon, France ». Le code
 * postal a servi à choisir, dans les suggestions ; sa mission
 * s'arrête là.
 *
 * LA RÈGLE DU CODE ADMINISTRATIF
 * -------------------------------
 * Dans certains pays, une ville ne se situe pas sans son État : il y a
 * un Springfield dans une trentaine d'États américains. Ces pays-là
 * abrègent leur division dans l'adresse courante, et tout le monde lit
 * ces deux ou trois lettres : « Miami, FL », « Toronto, ON »,
 * « Sydney, NSW ». C'est cette liste, et elle seule, qui autorise
 * l'affichage de la division.
 *
 * PARTOUT AILLEURS — France, Allemagne, Espagne, Italie, Japon et le
 * reste du monde — ON PASSE DIRECTEMENT DE LA VILLE AU PAYS. Personne
 * n'écrit « Vézilly, Hauts-de-France » : la région n'aide pas à situer,
 * elle allonge. AUCUNE EXCEPTION.
 *
 * ⚠️ SEUL CAS OÙ UNE RÉGION HORS LISTE S'ÉCRIT : quand elle EST le lieu
 * cherché (quelqu'un a choisi « Bavière » dans le moteur). Elle n'est
 * alors pas un complément de la ville — elle est le sujet. Voir
 * `ligneCarte`, qui le traite explicitement.
 *
 * LE NOM DU PAYS VIENT DES DONNÉES — le géocodeur est interrogé en
 * ANGLAIS depuis la nº 805 (`lang=en`, photon.ts), et les fiches
 * écrites avant portent encore des noms français — mais il passe par
 * DEUX TABLES, et deux seulement :
 *  · RACCOURCIS_PAYS coupe les formes officielles interminables
 *    (« États-Unis d'Amérique » → « USA » depuis la nº 590, « Royaume-Uni
 *    de Grande-Bretagne et d'Irlande du Nord » → « Royaume-Uni ») ;
 *  · ABREGES_MOTEUR abrège pour la barre de recherche, et pour elle
 *    seule (« Royaume-Uni » → « UK »).
 * Voir `nomPaysAffiche` et `nomPaysMoteur`.
 */

/* ================================================================
 * LES PAYS QUI AFFICHENT LEUR CODE ADMINISTRATIF
 * ================================================================ */

/**
 * UNE ENTRÉE PAR PAYS, indexée sur le code ISO à deux lettres. Pour
 * chaque division : son CODE tel qu'il s'affiche, et TOUS LES NOMS
 * sous lesquels le géocodeur peut la renvoyer, séparés par « | ».
 *
 * ⚠️ POURQUOI PLUSIEURS NOMS : Photon renvoie le nom COMPLET de la
 * division, dans la langue de la requête quand il la connaît (« Floride
 * », « Nouvelle-Galles du Sud ») et dans la langue locale sinon
 * (« Bayern », « São Paulo »). Une table à un seul nom raterait la
 * moitié des cas. La comparaison est faite sans accents ni
 * ponctuation (voir `sansOrnement`), ce qui absorbe le reste.
 *
 * LE CODE CHOISI est celui que le pays écrit VRAIMENT dans ses
 * adresses — pas systématiquement la norme ISO :
 *   · États-Unis, Canada, Australie, Brésil, Inde → le code ISO,
 *     qui est justement l'abréviation postale du pays ;
 *   · MEXIQUE → les abréviations mexicaines usuelles (CDMX, Jal.,
 *     N.L., Q.R.…), et non les codes ISO à trois lettres (AGU, JAL),
 *     que personne n'écrit et que Google n'affiche pas.
 */
const DIVISIONS: Record<string, Record<string, string>> = {
  /* ---------------- ÉTATS-UNIS ---------------- */
  US: {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California|Californie",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District of Columbia|District de Columbia|Washington DC",
    FL: "Florida|Floride",
    GA: "Georgia|Géorgie",
    HI: "Hawaii|Hawaï|Hawaii County",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana|Louisiane",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico|Nouveau-Mexique",
    NY: "New York|État de New York",
    NC: "North Carolina|Caroline du Nord",
    ND: "North Dakota|Dakota du Nord",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon|Orégon",
    PA: "Pennsylvania|Pennsylvanie",
    RI: "Rhode Island",
    SC: "South Carolina|Caroline du Sud",
    SD: "South Dakota|Dakota du Sud",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia|Virginie",
    WA: "Washington|État de Washington",
    WV: "West Virginia|Virginie-Occidentale|Virginie occidentale",
    WI: "Wisconsin",
    WY: "Wyoming",
  },

  /* ---------------- CANADA ---------------- */
  CA: {
    AB: "Alberta",
    BC: "British Columbia|Colombie-Britannique",
    MB: "Manitoba",
    NB: "New Brunswick|Nouveau-Brunswick",
    NL: "Newfoundland and Labrador|Terre-Neuve-et-Labrador",
    NS: "Nova Scotia|Nouvelle-Écosse",
    NT: "Northwest Territories|Territoires du Nord-Ouest",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island|Île-du-Prince-Édouard",
    QC: "Quebec|Québec",
    SK: "Saskatchewan",
    YT: "Yukon",
  },

  /* ---------------- AUSTRALIE ---------------- */
  AU: {
    ACT: "Australian Capital Territory|Territoire de la capitale australienne",
    NSW: "New South Wales|Nouvelle-Galles du Sud",
    NT: "Northern Territory|Territoire du Nord",
    QLD: "Queensland",
    SA: "South Australia|Australie-Méridionale",
    TAS: "Tasmania|Tasmanie",
    VIC: "Victoria",
    WA: "Western Australia|Australie-Occidentale",
  },

  /* ---------------- BRÉSIL (« UF ») ---------------- */
  BR: {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amapá",
    AM: "Amazonas|Amazonie",
    BA: "Bahia",
    CE: "Ceará",
    DF: "Distrito Federal|District fédéral",
    ES: "Espírito Santo",
    GO: "Goiás",
    MA: "Maranhão",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Pará",
    PB: "Paraíba",
    PR: "Paraná",
    PE: "Pernambuco|Pernambouc",
    PI: "Piauí",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rondônia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "São Paulo",
    SE: "Sergipe",
    TO: "Tocantins",
  },

  /* ---------------- INDE ---------------- */
  IN: {
    AN: "Andaman and Nicobar Islands|Îles Andaman-et-Nicobar",
    AP: "Andhra Pradesh",
    AR: "Arunachal Pradesh",
    AS: "Assam",
    BR: "Bihar",
    CH: "Chandigarh",
    CT: "Chhattisgarh",
    DH: "Dadra and Nagar Haveli and Daman and Diu",
    DL: "Delhi|National Capital Territory of Delhi",
    GA: "Goa",
    GJ: "Gujarat",
    HR: "Haryana",
    HP: "Himachal Pradesh",
    JK: "Jammu and Kashmir|Jammu-et-Cachemire",
    JH: "Jharkhand",
    KA: "Karnataka",
    KL: "Kerala",
    LA: "Ladakh",
    LD: "Lakshadweep",
    MP: "Madhya Pradesh",
    MH: "Maharashtra",
    MN: "Manipur",
    ML: "Meghalaya",
    MZ: "Mizoram",
    NL: "Nagaland",
    OD: "Odisha|Orissa",
    PY: "Puducherry|Pondichéry",
    PB: "Punjab|Pendjab",
    RJ: "Rajasthan",
    SK: "Sikkim",
    TN: "Tamil Nadu",
    TG: "Telangana",
    TR: "Tripura",
    UP: "Uttar Pradesh",
    UK: "Uttarakhand",
    WB: "West Bengal|Bengale-Occidental",
  },

  /* ---------------- MEXIQUE ---------------- */
  MX: {
    "Ags.": "Aguascalientes",
    "B.C.": "Baja California|Basse-Californie",
    "B.C.S.": "Baja California Sur|Basse-Californie du Sud",
    "Camp.": "Campeche",
    "Chis.": "Chiapas",
    "Chih.": "Chihuahua",
    CDMX: "Ciudad de México|Mexico City|Mexico|District fédéral",
    "Coah.": "Coahuila|Coahuila de Zaragoza",
    "Col.": "Colima",
    "Dgo.": "Durango",
    "Gto.": "Guanajuato",
    "Gro.": "Guerrero",
    "Hgo.": "Hidalgo",
    "Jal.": "Jalisco",
    "Edo. Méx.": "Estado de México|État de Mexico|México",
    "Mich.": "Michoacán|Michoacán de Ocampo",
    "Mor.": "Morelos",
    "Nay.": "Nayarit",
    "N.L.": "Nuevo León",
    "Oax.": "Oaxaca",
    "Pue.": "Puebla",
    "Qro.": "Querétaro",
    "Q.R.": "Quintana Roo",
    "S.L.P.": "San Luis Potosí",
    "Sin.": "Sinaloa",
    "Son.": "Sonora",
    "Tab.": "Tabasco",
    "Tamps.": "Tamaulipas",
    "Tlax.": "Tlaxcala",
    "Ver.": "Veracruz|Veracruz de Ignacio de la Llave",
    "Yuc.": "Yucatán",
    "Zac.": "Zacatecas",
  },
};

/** Les pays de la liste, en clair — pour les tests et le contrôle. */
export const PAYS_AVEC_CODE_ADMIN = Object.keys(DIVISIONS);

/** Sans accents, sans ponctuation, sans casse : « Île-du-Prince-Édouard »
    et « ile du prince edouard » deviennent la même clé. */
function sansOrnement(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** L'index inverse : nom normalisé → code, par pays. Construit UNE
    fois au chargement — la table ne bouge pas en cours de route. */
const INDEX_DIVISIONS: Record<string, Map<string, string>> = {};
for (const [pays, divisions] of Object.entries(DIVISIONS)) {
  const index = new Map<string, string>();
  for (const [code, noms] of Object.entries(divisions)) {
    //  Le code lui-même est une entrée : certaines sources renvoient
    //  déjà « FL » plutôt que « Florida ».
    index.set(sansOrnement(code), code);
    for (const nom of noms.split("|")) index.set(sansOrnement(nom), code);
  }
  INDEX_DIVISIONS[pays] = index;
}

/**
 * LE CODE ADMINISTRATIF D'UNE DIVISION — ou null.
 * ⚠️ C'EST LA RÈGLE, ET ELLE N'EXISTE QU'ICI. Null veut dire « ce pays
 * n'affiche pas sa division » : ni parce qu'on ne la connaît pas, ni
 * par prudence — parce que personne ne l'écrit là-bas.
 */
export function codeAdministratif(
  region: string | null | undefined,
  codePays: string | null | undefined
): string | null {
  if (!region || !codePays) return null;
  const index = INDEX_DIVISIONS[codePays.toUpperCase()];
  if (!index) return null;
  return index.get(sansOrnement(region)) ?? null;
}

/** Ce pays affiche-t-il sa division ? (le prédicat, pour les tests) */
export function paysAfficheSaDivision(
  codePays: string | null | undefined
): boolean {
  return Boolean(codePays && DIVISIONS[codePays.toUpperCase()]);
}

/* ================================================================
 * LES ARRONDISSEMENTS — un affichage, jamais une donnée
 * ================================================================ */

/**
 * « Lyon 1er Arrondissement », « Lyon 1er », « Paris 15e » → « Lyon »,
 * « Paris ». Le numéro d'arrondissement ne dit rien à personne hors de
 * la ville, et il alourdit chaque carte.
 *
 * ⚠️⚠️ CETTE FONCTION NE TOUCHE QUE L'AFFICHAGE, JAMAIS LES DONNÉES.
 * Les adresses publiées — /artist/atelier-corvus-lyon-1er,
 * /tattoo/realisme/lyon-1er — sont indexées et partagées : les
 * changer casserait tout le référencement acquis. C'est pourquoi la
 * base garde « Lyon 1er », que `nomVilleCourt` (lib/villes) reste la
 * normalisation des DONNÉES, et que les slugs continuent d'être
 * calculés sur le nom complet. Ne jamais appeler `villeAffichee`
 * avant un `slugifier`.
 */
export function villeAffichee(nom: string | null | undefined): string {
  if (!nom) return "";
  return nom
    .replace(/\s+arrondissement$/i, "")
    //  « Lyon 1er », « Paris 15e », « Marseille 3ème » — le numéro
    //  ordinal en fin de nom, et lui seul (« Aix-en-Provence » ne
    //  contient aucun numéro à supprimer).
    .replace(/\s+\d+\s*(?:er|ère|e|ème|eme)$/i, "")
    .trim();
}

/* ================================================================
 * LES QUATRE ÉCRITURES
 * ================================================================ */

/** Un lieu réduit à ce dont l'affichage a besoin. Fiches, studios,
    modes d'exercice et lieux du géocodeur s'y ramènent tous. */
export type LieuAffichable = {
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
  region?: string | null;
  pays?: string | null;
  code_pays?: string | null;
};

/** Assemble en écartant les vides, sans virgule orpheline. */
function joindre(morceaux: Array<string | null | undefined>): string {
  return morceaux
    .map((bout) => (bout ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * §3 · LES NOMS DE PAYS TROP LONGS, RACCOURCIS À LEUR FORME USUELLE.
 * OpenStreetMap donne parfois la forme officielle — « États-Unis
 * d'Amérique », « Royaume-Uni de Grande-Bretagne et d'Irlande du
 * Nord » — qui n'apprend rien de plus et mange la ligne.
 *
 * ⚠️ TABLE EXPLICITE, PAS DE RÈGLE GÉNÉRALE. On serait tenté de couper
 * mécaniquement « République de… », « Royaume de… » : ce serait faux
 * pour « République dominicaine », « République centrafricaine » ou
 * « République tchèque », dont le premier mot fait partie du nom
 * usuel. Une ligne par cas, donc, et aucune surprise.
 *
 * Clé : le nom sans accents ni ponctuation (voir `sansOrnement`).
 */
const RACCOURCIS_PAYS: Record<string, string> = {};
for (const [complet, court] of [
  /*  ██ §2 (nº 590) — LES ÉTATS-UNIS S'ÉCRIVENT « USA », PARTOUT ██
      LE DÉFAUT, RELEVÉ PAR LE PROPRIÉTAIRE : la fiche écrivait
      « États-Unis » et la barre de recherche « USA » — deux noms pour
      un même pays, sur le même écran quand on cherche puis qu'on
      ouvre. Il aligne sur « USA », qui est la forme que tout le monde
      lit et celle qui tient sur une ligne.
      C'EST ICI QUE LE NOM EST PRODUIT, et nulle part ailleurs :
      `nomPaysAffiche` lit cette table, et TOUT ce qui écrit un lieu
      passe par elle — les fiches, les cartes de la mosaïque, les
      formulaires, la ligne des portfolios suivis. Le changement vaut
      donc pour tout le site, ce qui est exactement ce qui était
      demandé.
      ⚠️ ET LA QUATRIÈME ENTRÉE COMPTE AUTANT QUE LES TROIS AUTRES : la
      base peut porter « États-Unis » sans forme officielle, la table
      ne l'aurait alors jamais rencontré. */
  /*  ██ nº 805 — LA COLONNE DE DROITE EST EN ANGLAIS, ET LA GAUCHE
      RECONNAÎT TOUT ██
      Le site est anglais (nº 804). Cette table sert à AFFICHER un pays
      sous sa forme courte : sa cible devient donc l'anglais (« USA »,
      « UK », « Germany »). Et sa source s'élargit : le géocodeur rend
      désormais des noms anglais (`lang=en`, photon.ts), mais les fiches
      écrites AVANT la nº 805 portent des noms FRANÇAIS en base
      (« Allemagne », « Royaume-Uni ») — ils ne sont pas réécrits, ils
      sont RECONNUS ici et affichés en anglais. Pour chaque pays : la
      forme officielle anglaise, la forme officielle française, la forme
      courte française. La forme courte anglaise n'a pas besoin de ligne
      (elle se rend telle quelle). */
  ["United States of America", "USA"],
  ["United States", "USA"],
  ["États-Unis d'Amérique", "USA"],
  ["États-Unis", "USA"],
  ["United Kingdom of Great Britain and Northern Ireland", "UK"],
  ["United Kingdom", "UK"],
  ["Royaume-Uni de Grande-Bretagne et d'Irlande du Nord", "UK"],
  ["Royaume-Uni", "UK"],
  ["People's Republic of China", "China"],
  ["République populaire de Chine", "China"],
  ["Chine", "China"],
  ["Federal Republic of Germany", "Germany"],
  ["République fédérale d'Allemagne", "Germany"],
  ["Allemagne", "Germany"],
  ["French Republic", "France"],
  ["République française", "France"],
  ["Kingdom of Spain", "Spain"],
  ["Royaume d'Espagne", "Spain"],
  ["Espagne", "Spain"],
  ["Italian Republic", "Italy"],
  ["République italienne", "Italy"],
  ["Italie", "Italy"],
  ["Portuguese Republic", "Portugal"],
  ["République portugaise", "Portugal"],
  ["Kingdom of Belgium", "Belgium"],
  ["Royaume de Belgique", "Belgium"],
  ["Belgique", "Belgium"],
  ["Kingdom of the Netherlands", "Netherlands"],
  ["Royaume des Pays-Bas", "Netherlands"],
  ["Pays-Bas", "Netherlands"],
  ["Swiss Confederation", "Switzerland"],
  ["Confédération suisse", "Switzerland"],
  ["Suisse", "Switzerland"],
  ["Republic of Austria", "Austria"],
  ["République d'Autriche", "Austria"],
  ["Autriche", "Austria"],
  ["Grand Duchy of Luxembourg", "Luxembourg"],
  ["Grand-Duché de Luxembourg", "Luxembourg"],
  ["Hellenic Republic", "Greece"],
  ["République hellénique", "Greece"],
  ["Grèce", "Greece"],
  ["Republic of Poland", "Poland"],
  ["République de Pologne", "Poland"],
  ["Pologne", "Poland"],
  ["Russian Federation", "Russia"],
  ["Fédération de Russie", "Russia"],
  ["Russie", "Russia"],
  ["Kingdom of Sweden", "Sweden"],
  ["Royaume de Suède", "Sweden"],
  ["Suède", "Sweden"],
  ["Kingdom of Norway", "Norway"],
  ["Royaume de Norvège", "Norway"],
  ["Norvège", "Norway"],
  ["Kingdom of Denmark", "Denmark"],
  ["Royaume de Danemark", "Denmark"],
  ["Danemark", "Denmark"],
  ["Republic of Finland", "Finland"],
  ["République de Finlande", "Finland"],
  ["Finlande", "Finland"],
  ["Republic of Korea", "South Korea"],
  ["République de Corée", "South Korea"],
  ["Corée du Sud", "South Korea"],
  ["Islamic Republic of Iran", "Iran"],
  ["République islamique d'Iran", "Iran"],
  ["Republic of Türkiye", "Turkey"],
  ["Republic of Turkey", "Turkey"],
  ["République de Turquie", "Turkey"],
  ["Türkiye", "Turkey"],
  ["Turquie", "Turkey"],
  ["Arab Republic of Egypt", "Egypt"],
  ["République arabe d'Égypte", "Egypt"],
  ["Égypte", "Egypt"],
  ["Kingdom of Morocco", "Morocco"],
  ["Royaume du Maroc", "Morocco"],
  ["Maroc", "Morocco"],
  ["Republic of Tunisia", "Tunisia"],
  ["République tunisienne", "Tunisia"],
  ["Tunisie", "Tunisia"],
  ["People's Democratic Republic of Algeria", "Algeria"],
  ["République algérienne démocratique et populaire", "Algeria"],
  ["Algérie", "Algeria"],
  ["Republic of South Africa", "South Africa"],
  ["République d'Afrique du Sud", "South Africa"],
  ["Afrique du Sud", "South Africa"],
  ["Federative Republic of Brazil", "Brazil"],
  ["République fédérative du Brésil", "Brazil"],
  ["Brésil", "Brazil"],
  ["United Mexican States", "Mexico"],
  ["États-Unis mexicains", "Mexico"],
  ["Mexique", "Mexico"],
  ["Argentine Republic", "Argentina"],
  ["République argentine", "Argentina"],
  ["Argentine", "Argentina"],
  ["Commonwealth of Australia", "Australia"],
  ["Commonwealth d'Australie", "Australia"],
  ["Australie", "Australia"],
  ["Republic of India", "India"],
  ["République de l'Inde", "India"],
  ["Inde", "India"],
  ["Republic of Singapore", "Singapore"],
  ["République de Singapour", "Singapore"],
  ["Singapour", "Singapore"],
  ["Kingdom of Thailand", "Thailand"],
  ["Royaume de Thaïlande", "Thailand"],
  ["Thaïlande", "Thailand"],
  ["Republic of the Philippines", "Philippines"],
  ["République des Philippines", "Philippines"],
  ["Republic of Indonesia", "Indonesia"],
  ["République d'Indonésie", "Indonesia"],
  ["Indonésie", "Indonesia"],
  ["Democratic Republic of the Congo", "DR Congo"],
  ["République démocratique du Congo", "DR Congo"],
  ["RD Congo", "DR Congo"],
  ["Japon", "Japan"],
  ["Nouvelle-Zélande", "New Zealand"],
  ["Émirats arabes unis", "United Arab Emirates"],
  ["Irlande", "Ireland"],
  ["Canada", "Canada"],
] as const) {
  RACCOURCIS_PAYS[sansOrnement(complet)] = court;
}

/**
 * §4 · LE PAYS ABRÉGÉ, RÉSERVÉ À LA BARRE DE RECHERCHE.
 * Là, et là seulement, la place manque : la ligne porte déjà le style
 * cherché, la ville et le rayon. On prend donc la forme abrégée que
 * tout le monde lit — « Miami, FL, USA », « Sydney, NSW, Australia ».
 *
 * ⚠️ TRÈS PEU D'ENTRÉES, ET C'EST VOULU. Un pays n'entre ici que si sa
 * forme courte est reconnue PARTOUT, hors de son propre pays. « USA »,
 * « UK », « UAE », « NZ » le sont ; « ALL » pour l'Allemagne ou
 * « ESP » pour l'Espagne ne le sont pas — ce sont des codes de
 * fédérations sportives, personne n'écrit une adresse comme ça. Tous
 * les autres pays gardent leur nom court anglais (celui que rend
 * `nomPaysAffiche` depuis la nº 805).
 *
 * ⚠️ « AUSTRALIA » N'EST PAS UNE ABRÉVIATION mais la forme
 * internationale du nom, demandée telle quelle : c'est ainsi que le
 * pays s'écrit sur les adresses du monde entier, comme « Canada », qui
 * n'a lui besoin d'aucune entrée.
 *
 * ⚠️ §2 (nº 590) — LES ÉTATS-UNIS ONT QUITTÉ CETTE TABLE, et ce n'est
 * pas un oubli : ils s'écrivent « USA » DÈS `RACCOURCIS_PAYS`, donc
 * partout et plus seulement ici. L'entrée n'aurait plus rien à
 * traduire — `nomPaysMoteur` part de `nomPaysAffiche`, qui rend
 * désormais « USA » directement. La barre de recherche écrit donc le
 * même mot qu'avant, par un chemin plus court.
 * ⚠️ LES QUATRE AUTRES RESTENT, ET C'EST DÉLIBÉRÉ : le propriétaire a
 * demandé « USA », pas un alignement général. « Royaume-Uni » → UK,
 * « Émirats arabes unis » → UAE, « Australie » → Australia,
 * « Nouvelle-Zélande » → NZ continuent donc de n'abréger que dans la
 * barre. Le jour où il voudra les aligner aussi, c'est la même
 * opération : déplacer la ligne d'une table à l'autre.
 */
const ABREGES_MOTEUR: Record<string, string> = {};
for (const [nom, abrege] of [
  //  nº 805 — les entrées sont les formes COURTES ANGLAISES rendues par
  //  `nomPaysAffiche` (la table du dessus les produit) ; « UK » et
  //  « Australia » y sont déjà courts, ils n'ont plus besoin de ligne.
  ["United Arab Emirates", "UAE"],
  ["New Zealand", "NZ"],
] as const) {
  ABREGES_MOTEUR[sansOrnement(nom)] = abrege;
}

/** LE NOM DU PAYS TEL QU'IL S'AFFICHE sur les cartes et les fiches :
    celui des données, raccourci quand la source l'a donné en forme
    officielle. Un seul point de passage. */
export function nomPaysAffiche(lieu: LieuAffichable): string {
  const brut = (lieu.pays ?? "").trim();
  if (!brut) return "";
  return RACCOURCIS_PAYS[sansOrnement(brut)] ?? brut;
}

/** LE NOM DU PAYS DANS LA BARRE DE RECHERCHE — abrégé quand une forme
    internationale existe, le nom court anglais sinon. */
export function nomPaysMoteur(lieu: LieuAffichable): string {
  const affiche = nomPaysAffiche(lieu);
  if (!affiche) return "";
  return ABREGES_MOTEUR[sansOrnement(affiche)] ?? affiche;
}

/**
 * LA DIVISION, QUAND ELLE A LE DROIT DE S'AFFICHER — le code pour les
 * pays de la liste, rien pour tous les autres.
 */
function divisionAffichee(lieu: LieuAffichable): string | null {
  return codeAdministratif(lieu.region, lieu.code_pays);
}

/**
 * §2 · LES CARTES, ET LE MOTEUR UNE FOIS LE LIEU VALIDÉ.
 *   « Lyon, France » · « Miami, FL, États-Unis » · « Sydney, NSW, Australie »
 * Ni rue, ni code postal, ni région hors liste.
 *
 * SANS VILLE, le lieu cherché EST une division ou un pays : elle
 * devient alors le sujet de la ligne et s'écrit — code pour les pays
 * de la liste (« FL, États-Unis »), nom complet sinon (« Bavière,
 * Allemagne »). Ce n'est pas une exception à la règle : la règle
 * interdit d'AJOUTER la région à une ville, pas de nommer le lieu
 * qu'on a demandé.
 */
export function ligneCarte(lieu: LieuAffichable): string {
  return villeEtPays(lieu, nomPaysAffiche(lieu));
}

/**
 * §4 · LA MÊME LIGNE, POUR LA BARRE DE RECHERCHE : pays abrégé.
 *   « Miami, FL, USA » · « Sydney, NSW, Australia » · « Lyon, France »
 * ⚠️ RÉSERVÉE AU MOTEUR. Une carte ou une fiche a la place d'écrire
 * « États-Unis » ; la barre de recherche, non.
 */
export function ligneMoteur(lieu: LieuAffichable): string {
  return villeEtPays(lieu, nomPaysMoteur(lieu));
}

/**
 * ██ §2-bis (nº 486) · LA LIGNE D'UNE CARTE : « VILLE, PAYS » ██
 * ==================================================================
 *   « Austin, United States » · « Tokyo, Japan » · « Lyon, France »
 *
 * NI ÉTAT, NI RÉGION — et c'est tout ce qui la distingue de
 * `ligneCarte` ci-dessus. Le site s'ouvre à l'international : sur une
 * vignette, « Studio • Austin, Texas, United States » ne tient pas, et
 * l'État n'apprend rien à qui découvre des artistes du monde entier.
 * Le PAYS, lui, est toujours écrit : c'est LUI l'information — le
 * visiteur n'a choisi aucune destination, il faut donc lui dire où il
 * regarde.
 *
 * ⚠️ POURQUOI UNE ÉCRITURE DE PLUS PLUTÔT QUE DE CHANGER LES DEUX
 * AUTRES, et c'est la raison qui compte : `ligneCarte` et
 * `ligneCarteMobile` ne servent PAS qu'aux cartes, malgré leurs noms.
 * La FICHE les consomme (la rangée du profil de la vue photo au doigt,
 * FicheTatoueur ; les modes d'exercice, lib/modes-exercice), le MOTEUR
 * aussi (le titre des résultats, IndexTatoueurs), et trois formulaires
 * avec eux. Leur retirer l'État aurait donc appauvri la fiche — que le
 * propriétaire veut complète — pour régler un problème de vignette.
 * Une carte a désormais SA ligne ; les autres gardent la leur.
 *
 * ⚠️ ET ELLE VAUT POUR LES DEUX APPAREILS. Les deux écritures de la
 * nº 212-§6 se justifiaient par l'ÉTAT : `ligneCarteMobile` abrégeait
 * le pays quand une division s'écrivait, parce que « Austin, TX,
 * États-Unis d'Amérique » débordait. Sans division, il n'y a plus rien
 * à abréger — les deux lignes diraient mot pour mot la même chose, et
 * la carte n'a plus qu'une seule écriture au lieu de deux.
 *
 * SANS VILLE, on retombe sur ce qu'on a — le pays seul, ou la région
 * si elle est le seul nom connu : `joindre` écarte les morceaux vides,
 * donc jamais de virgule orpheline.
 */
export function ligneLieuDeCarte(lieu: LieuAffichable): string {
  const ville = villeAffichee(lieu.ville);
  if (!ville) return joindre([(lieu.region ?? "").trim(), nomPaysAffiche(lieu)]);
  return joindre([ville, nomPaysAffiche(lieu)]);
}

/**
 * §4bis · LA MÊME LIGNE, RESSERRÉE POUR LE SMARTPHONE (nº 212-§6)
 *   « Austin, TX, USA » · « Lyon, France »
 * ⚠️ LE PAYS N'EST ABRÉGÉ QUE LORSQU'UNE DIVISION S'ÉCRIT, et c'est
 * tout le propos : « Austin, TX, États-Unis d'Amérique » ne tient pas
 * sur la ligne d'une carte au doigt, alors que « Lyon, France » y tient
 * très bien — abréger la France n'apporterait rien et rendrait le site
 * télégraphique.
 * ⚠️ AUCUNE ABRÉVIATION N'EST INVENTÉE ICI : on reprend `ABREGES_MOTEUR`,
 * la table de la barre de recherche (« États-Unis » → « USA »), par
 * `nomPaysMoteur`. Une deuxième table finirait par la contredire.
 */
export function ligneCarteMobile(lieu: LieuAffichable): string {
  const abrege = divisionAffichee(lieu) !== null;
  return villeEtPays(lieu, abrege ? nomPaysMoteur(lieu) : nomPaysAffiche(lieu));
}

/** Le corps commun des deux : ville, division si le pays l'écrit, pays
    — sous le nom qu'on lui donne. */
function villeEtPays(lieu: LieuAffichable, pays: string): string {
  const ville = villeAffichee(lieu.ville);
  if (!ville) {
    const division = divisionAffichee(lieu) ?? (lieu.region ?? "").trim();
    return joindre([division, pays]);
  }
  return joindre([ville, divisionAffichee(lieu), pays]);
}

/**
 * §3 · LES FICHES PUBLIQUES — la rue revient, le code postal non.
 *   « 18 Chemin du Bois de la Noue, Vézilly, France »
 *   « 123 Ocean Drive, Miami, FL, États-Unis »
 * Le lien Google Maps posé à côté emmène le client : il n'a aucune
 * raison de recopier un code postal.
 */
export function ligneFiche(lieu: LieuAffichable): string {
  return joindre([lieu.adresse, ligneCarte(lieu)]);
}

/*
 * ⚠️ `ligneChamp` A ÉTÉ SUPPRIMÉE À LA PASSE Nº 115. Elle écrivait,
 * dans le champ du formulaire, l'adresse avec son code postal ET son
 * arrondissement une fois validée — « 12 rue de la Paix, 69001 Lyon
 * 1er, France ». C'était une écriture de plus à maintenir pour un
 * résultat que personne ne voulait lire : ce qu'on vient de choisir
 * doit se relire comme le visiteur le lira. Le champ appelle
 * désormais `ligneFiche`, comme la fiche.
 */

/**
 * §2 · CE QUI SE LIT SOUS UNE SUGGESTION, en gris, pendant la saisie.
 * L'intitulé (la rue, ou le nom du lieu) est déjà écrit au-dessus en
 * gras : cette ligne porte ce qui SITUE — code postal, ville, code de
 * l'État si le pays l'écrit, pays. Elle ne répète jamais l'intitulé.
 *
 * ⚠️ C'EST LE SEUL ENDROIT DU SITE OÙ LE CODE POSTAL S'AFFICHE, et il
 * y reste parce qu'on est en train de CHOISIR : deux « Rue de la
 * Paix » dans deux arrondissements ne se distinguent pas autrement, et
 * une suggestion qui ne permet pas de trancher ne sert à rien. Il
 * disparaît dès que le lieu est retenu — le champ passe alors à
 * `ligneFiche`.
 *
 * ⚠️ L'ARRONDISSEMENT, LUI, NE S'ÉCRIT PAS MÊME ICI (passe nº 115) :
 * « 69001 Lyon » et « 69002 Lyon » se distinguent déjà par leur code
 * postal, et la règle « aucun arrondissement à l'écran » ne souffre
 * aucune exception.
 */
export function contexteSuggestion(
  lieu: LieuAffichable,
  intitule: string
): string {
  const memeQueLIntitule = (bout: string) =>
    bout.trim().toLowerCase() === intitule.trim().toLowerCase();
  const villeEtCode = [
    (lieu.code_postal ?? "").trim(),
    villeAffichee(lieu.ville),
  ]
    .filter(Boolean)
    .join(" ");
  const division = divisionAffichee(lieu) ?? "";
  const pays = nomPaysAffiche(lieu);
  return joindre(
    [villeEtCode, division, pays].filter(
      (bout) => bout && !memeQueLIntitule(bout)
    )
  );
}

/**
 * CE QU'ON ENVOIE À GOOGLE MAPS quand on clique une adresse — la
 * version COMPLÈTE, code postal et pays compris. Un plan n'est pas un
 * affichage : lui retirer le code postal, c'est le poser sur une rue
 * homonyme à l'autre bout du monde.
 */
export function ligneMaps(lieu: LieuAffichable): string {
  const villeEtCode = [(lieu.code_postal ?? "").trim(), villeAffichee(lieu.ville)]
    .filter(Boolean)
    .join(" ");
  return joindre([
    lieu.adresse,
    villeEtCode,
    (lieu.region ?? "").trim(),
    nomPaysAffiche(lieu),
  ]);
}

/* ================================================================
 * §4 · CE QUE LIT GOOGLE — Schema.org / JSON-LD
 * ================================================================ */

/**
 * L'ADRESSE STRUCTURÉE, INVISIBLE ET COMPLÈTE.
 * ⚠️ ELLE NE REPREND PAS L'ADRESSE AFFICHÉE, et c'est tout l'objet du
 * point : l'humain lit « Miami, FL, États-Unis », le moteur reçoit la
 * rue, le code postal, la ville, la RÉGION EN TOUTES LETTRES et le
 * code ISO du pays. C'est ce bloc qui permet de situer un salon sur
 * une carte et de le faire apparaître dans les résultats locaux —
 * sans lui, le site est invisible là où tout le monde cherche.
 *
 * `addressRegion` porte le NOM COMPLET (« Florida »), jamais le code :
 * Schema.org attend la division, pas son abréviation d'affichage.
 * `addressLocality` porte la ville TELLE QU'ELLE EST EN BASE, avec son
 * arrondissement — un moteur situe mieux « Lyon 1er » que « Lyon ».
 * `addressCountry` porte le code ISO à deux lettres, la seule forme
 * que Schema.org recommande.
 */
export function adresseStructuree(lieu: LieuAffichable): Record<string, string> {
  const champs: Record<string, string> = { "@type": "PostalAddress" };
  const poser = (cle: string, valeur: string | null | undefined) => {
    const propre = (valeur ?? "").trim();
    if (propre) champs[cle] = propre;
  };
  poser("streetAddress", lieu.adresse);
  poser("postalCode", lieu.code_postal);
  poser("addressLocality", lieu.ville);
  poser("addressRegion", lieu.region);
  //  LE CODE ISO D'ABORD, le nom en repli : une fiche d'avant la
  //  localisation mondiale n'a parfois que le nom du pays.
  poser("addressCountry", lieu.code_pays?.toUpperCase() ?? lieu.pays);
  return champs;
}
