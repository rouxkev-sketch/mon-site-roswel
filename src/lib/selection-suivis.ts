import { modesOrdonnes, type ModeExerciceFiche } from "@/lib/modes-exercice";
//  §2 (nº 301) — LA VILLE ET LE PAYS, PAR L'ÉCRITURE UNIQUE DU SITE :
//  `ligneCarte` est celle des cartes de la mosaïque (« Lyon, France »,
//  « Austin, TX, États-Unis »). Aucune seconde grammaire de lieu n'est
//  écrite ici — c'est la règle de lib/adresse depuis toujours.
import { ligneCarte } from "@/lib/adresse";
import {
  genreMode,
  libelleTypeFiche,
  valeurExplorer,
} from "@/config/tatouage";
import {
  cleDEnsemble,
  natureConnue,
  ordreDeLArtiste,
} from "@/lib/photos-tatoueur";
import { CLE_TOTAL, type ChoixSelection } from "@/lib/filtres-selection";
import type { PhotoDuSuivi, PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";

/**
 * L'ONGLET « TATOUEURS » DE MA SÉLECTION — LES RÈGLES, SANS UN PIXEL
 * ==================================================================
 * (passe nº 243-§2, §3 et §4)
 *
 * TOUT CE QUI SE DÉCIDE VIT ICI, et rien de ce qui se dessine : le
 * classement en trois groupes, le tri de chacun, le choix des trois
 * photos et la petite ligne qui dit d'où elles viennent. Le composant
 * n'a plus qu'à poser ce que ces fonctions rendent — et le banc peut
 * les vérifier sans ouvrir un navigateur.
 *
 * ⚠️ AUCUNE SECONDE SOURCE. Les dates de guest viennent des modes
 * d'exercice (migration nº 21), les libellés de `libelleLieuDuMode`,
 * `libelleSecteurDuMode` et `genreMode` — rien n'est réécrit ici.
 */

/** Les sept jours qui font « cette semaine ». */
export const JOURS_PROCHES = 7;

export type GroupeSuivis = {
  cle: "semaine" | "avenir" | "tous";
  titre: string;
  suivis: TatoueurSuivi[];
};

/** LE JOUR CIVIL, en « AAAA-MM-JJ » — la forme des dates en base, donc
    comparable telle quelle, sans fuseau ni objet Date. */
export function jourCivil(decalageEnJours = 0): string {
  const maintenant = new Date();
  maintenant.setDate(maintenant.getDate() + decalageEnJours);
  return maintenant.toISOString().slice(0, 10);
}

/**
 * LA SESSION GUEST QUI COMPTE POUR CE SUIVI — la plus proche qui
 * N'EST PAS TERMINÉE. Une session finie n'apparaît dans aucun groupe
 * daté (§2), et c'est ici, une seule fois, que la règle est écrite.
 */
export function guestDuSuivi(
  suivi: TatoueurSuivi,
  aujourdhui = jourCivil()
): ModeExerciceFiche | null {
  const guests = modesOrdonnes(suivi.modes).filter(
    (mode) =>
      mode.genre === "guest" &&
      mode.debut_le &&
      //  La date de fin est INCLUSE : on est encore guest le dernier
      //  jour annoncé (la règle de `sessionTerminee`, lib/modes).
      (!mode.fin_le || mode.fin_le >= aujourdhui)
  );
  return guests[0] ?? null;
}

/**
 * LES TROIS GROUPES, DANS L'ORDRE (§2) — « cette semaine » d'abord :
 * ce qui arrive le plus tôt se lit en premier.
 *  · CETTE SEMAINE — une session guest commence ou se déroule dans les
 *    sept prochains jours (donc déjà commencée et pas finie, aussi) ;
 *  · À VENIR — elle commence au-delà de sept jours ;
 *  · TOUS LES SUIVIS — tous les autres.
 * Tri : par date de début croissante dans les deux premiers, par
 * publication la plus récente dans le troisième.
 * ⚠️ UN GROUPE VIDE N'EST PAS RENDU : il n'est pas dans la liste.
 */
export function groupesDeSuivis(
  suivis: TatoueurSuivi[],
  aujourdhui = jourCivil()
): GroupeSuivis[] {
  const limite = jourCivilDepuis(aujourdhui, JOURS_PROCHES);
  const semaine: TatoueurSuivi[] = [];
  const avenir: TatoueurSuivi[] = [];
  const tous: TatoueurSuivi[] = [];

  for (const suivi of suivis) {
    const guest = guestDuSuivi(suivi, aujourdhui);
    if (!guest || !guest.debut_le) {
      tous.push(suivi);
      continue;
    }
    if (guest.debut_le <= limite) semaine.push(suivi);
    else avenir.push(suivi);
  }

  const parDebut = (a: TatoueurSuivi, b: TatoueurSuivi) =>
    (guestDuSuivi(a, aujourdhui)?.debut_le ?? "").localeCompare(
      guestDuSuivi(b, aujourdhui)?.debut_le ?? ""
    );
  //  « Publication la plus récente » : la date de la photo la plus
  //  fraîche (les publications arrivent déjà triées).
  const parPublication = (a: TatoueurSuivi, b: TatoueurSuivi) =>
    (b.recentes[0]?.creeLe ?? "").localeCompare(a.recentes[0]?.creeLe ?? "");

  return [
    { cle: "semaine" as const, titre: "Cette semaine", suivis: semaine.sort(parDebut) },
    { cle: "avenir" as const, titre: "À venir", suivis: avenir.sort(parDebut) },
    { cle: "tous" as const, titre: "Tous les portfolios", suivis: tous.sort(parPublication) },
  ].filter((groupe) => groupe.suivis.length > 0);
}

/** Le jour civil obtenu en avançant de N jours à partir d'un autre. */
export function jourCivilDepuis(jour: string, jours: number): string {
  const date = new Date(`${jour}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

/* ==================================================================
 * LA LIGNE D'INFORMATION (§3)
 * ================================================================== */

/** « 3 – 8 mars » — les deux bornes d'une session, au plus court.
    Le mois n'est écrit qu'une fois quand il est le même. */
const MOIS_COURTS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
export function periodeDuGuest(mode: {
  debut_le: string | null;
  fin_le: string | null;
}): string {
  if (!mode.debut_le) return "";
  const [, moisD, jourD] = mode.debut_le.split("-");
  const jour = (valeur: string) => String(Number(valeur));
  const nom = (valeur: string) => MOIS_COURTS[Number(valeur) - 1] ?? "";
  if (!mode.fin_le) return `${jour(jourD)} ${nom(moisD)}`;
  const [, moisF, jourF] = mode.fin_le.split("-");
  return moisD === moisF
    ? `${jour(jourD)} – ${jour(jourF)} ${nom(moisF)}`
    : `${jour(jourD)} ${nom(moisD)} – ${jour(jourF)} ${nom(moisF)}`;
}

/** Une ligne d'information — une par mode d'exercice (§4, nº 247). */
export type LigneInfoSuivi = {
  /** Une clé stable pour la liste (l'identifiant du mode, à défaut son
      rang). */
  cle: string;
  /** Ce qui précède la date : « Guest à Lyon », « En salon · Lyon 1er ». */
  avant: string;
  /** La période d'une session guest, rendue À PART pour que le
      composant la traite seule (nº 244-§3 — l'urgence est
      TYPOGRAPHIQUE, jamais une couleur). Vide pour les autres modes. */
  date: string;
  guest: boolean;
  /** La session commence (ou se déroule) dans les sept jours. */
  proche: boolean;
};

/**
 * CE QUI S'ÉCRIT SOUS LE NOM (§3), MODE PAR MODE (§4, nº 247)
 * ==================================================================
 * ⚠️ UNE FICHE PEUT EN CUMULER PLUSIEURS, et l'information était
 * ÉCRASÉE : on n'écrivait qu'une ligne — la session guest s'il y en
 * avait une, sinon le premier mode de l'ordre officiel. Lola, à
 * domicile ET résidente en salon ET guest ailleurs, n'en montrait
 * qu'un tiers.
 * CHAQUE MODE A DÉSORMAIS SA LIGNE, les unes sous les autres, DANS
 * L'ORDRE DÉJÀ ÉTABLI par `modesOrdonnes` (à domicile, en studio, en
 * salon, guest) — aucun second classement n'est écrit ici.
 *   · artiste en salon   → « En salon · Lyon, France »
 *   · artiste à domicile → « À domicile · Bordeaux, France »
 *   · guest              → « Guest · Lyon, France · 3 – 8 mars »
 *   · salon ou studio    → « Salon · Lyon, France » (il n'a pas de
 *     mode : il EST le lieu — une seule ligne, comme avant)
 * Les mots viennent de `genreMode`, `ligneCarte` et
 * `libelleTypeFiche` : aucun libellé n'est inventé ici.
 *
 * §2 (nº 301) — PLUS JAMAIS L'ADRESSE COMPLÈTE. On lisait « En salon ·
 * 12 Rue de la République, Lyon » : la rue et le numéro n'apprennent
 * rien dans une LISTE — on y cherche qui on suit et où il se trouve, on
 * ne s'y rend pas. La forme est donc LE MODE EN FORME COURTE (« En
 * salon », « En studio », « À domicile », « Guest » — les `label` de
 * `GENRES_MODE`, jamais les libellés longs de la fiche du genre
 * « FONDATEUR DU SALON », qui eux ne changent pas), puis LA VILLE ET LE
 * PAYS par `ligneCarte`. Ni rue, ni numéro, jamais.
 *
 * ⚠️ UNE SESSION GUEST TERMINÉE NE S'ÉCRIT PAS : la règle du §2
 * (nº 243) vaut ligne à ligne — elle est passée, elle ne dit plus où
 * l'artiste se trouve.
 */
export function lignesDInformation(
  suivi: TatoueurSuivi,
  aujourdhui = jourCivil()
): LigneInfoSuivi[] {
  const lignes: LigneInfoSuivi[] = [];
  /**
   * §2 (nº 301) — LA VILLE ET LE PAYS DU MODE, ET RIEN D'AUTRE.
   * ------------------------------------------------------------------
   * Le mode porte son propre lieu ; quand il n'en a pas (un guest qui
   * ne dit qu'un intitulé, par exemple), on retombe sur celui de la
   * fiche. `ligneCarte` fait le reste — c'est elle qui sait quand une
   * division s'écrit (« Austin, TX, États-Unis ») et quand elle ne
   * s'écrit pas (« Lyon, France »).
   */
  const villeEtPaysDuMode = (mode: ModeExerciceFiche) =>
    ligneCarte({
      ville: mode.ville ?? mode.intitule ?? suivi.ville,
      region: mode.region ?? suivi.region,
      pays: mode.pays ?? suivi.pays,
      code_pays: mode.code_pays ?? suivi.codePays,
    });
  modesOrdonnes(suivi.modes).forEach((mode, rang) => {
    const cle = mode.id ?? `${mode.genre}-${rang}`;
    if (mode.genre === "guest") {
      //  Terminée : elle ne dit plus rien (règle du §2, nº 243).
      if (mode.fin_le && mode.fin_le < aujourdhui) return;
      lignes.push({
        cle,
        avant: [genreMode("guest").label, villeEtPaysDuMode(mode)]
          .filter(Boolean)
          .join(" · "),
        date: periodeDuGuest(mode),
        guest: true,
        proche:
          Boolean(mode.debut_le) &&
          mode.debut_le! <= jourCivilDepuis(aujourdhui, JOURS_PROCHES),
      });
      return;
    }
    lignes.push({
      cle,
      avant: [genreMode(mode.genre).label, villeEtPaysDuMode(mode)]
        .filter(Boolean)
        .join(" · "),
      date: "",
      guest: false,
      proche: false,
    });
  });
  if (lignes.length > 0) return lignes;
  //  Aucun mode : un salon ou un studio EST le lieu — « Salon · Lyon,
  //  France ». Même grammaire, même fonction.
  const texteLieu = [
    libelleTypeFiche(suivi.typeFiche, suivi.etablissement),
    ligneCarte({
      ville: suivi.ville,
      region: suivi.region,
      pays: suivi.pays,
      code_pays: suivi.codePays,
    }),
  ]
    .filter(Boolean)
    .join(" · ");
  if (!texteLieu) return [];
  return [
    { cle: "lieu", avant: texteLieu, date: "", guest: false, proche: false },
  ];
}

/* ==================================================================
 * LA GALERIE D'UN PORTFOLIO SUIVI (§1, nº 302)
 * ================================================================== */

export type BandeDeTrois = {
  photos: PhotoDuSuivi[];
};

/**
 * COMBIEN DE VIGNETTES AU MAXIMUM — VINGT (nº 302-§1).
 * ------------------------------------------------------------------
 * C'était dix, suivies d'une case « Voir plus ». La case est SUPPRIMÉE
 * (code compris) : la galerie s'arrête à vingt, et s'il y a moins de
 * photos disponibles il y en a moins, sans message.
 */
export const VIGNETTES_MAX = 20;

/**
 * COMBIEN DE PHOTOS UN STYLE DOIT AVOIR POUR ENTRER DANS L'ALTERNANCE
 * (règle 4, nº 302-§1). En dessous, il n'y entre pas.
 */
export const PHOTOS_POUR_ALTERNER = 8;

/**
 * LES CINQ RÈGLES DE COMPOSITION (nº 302-§1)
 * ==================================================================
 * ⚠️ CE QUI EST ANNULÉ : la bande de la nº 243 montrait « vos coups de
 * cœur », à défaut les dernières réalisations, à défaut les derniers
 * flashs — trois cas exclusifs, dix photos, et une case « Voir plus ».
 * Tout cela est remplacé par les cinq règles ci-dessous. Le nom du
 * type est conservé pour ne pas éparpiller un renommage dans toute la
 * page ; ce qu'il contient, lui, est neuf.
 *
 * RÈGLE 1 — QUE DES RÉALISATIONS, JAMAIS UN FLASH. Un flash est un
 * dessin proposé : il ne montre pas la main de l'artiste sur la peau.
 *
 * RÈGLE 2 — UN SEUL STYLE : ses photos. Et s'il est divisé entre
 * COULEUR et NOIR ET GRIS, on ALTERNE entre les deux — une couleur,
 * une noir et gris, et ainsi de suite. (Dans le modèle du site, un
 * style divisé par le rendu, ce sont deux carrousels : `cleDEnsemble`
 * le dit déjà, on ne réinvente rien.)
 *
 * RÈGLE 3 — PLUSIEURS STYLES : une photo du premier, une du deuxième,
 * et ainsi de suite, en boucle, jusqu'à vingt. Le tour de rôle vaut à
 * trois styles comme à dix.
 *
 * RÈGLE 4 — UN STYLE N'ENTRE DANS L'ALTERNANCE QUE S'IL COMPTE AU
 * MOINS HUIT PHOTOS. ⚠️ ET C'EST UNE RÈGLE D'ALTERNANCE, pas une
 * règle d'exclusion : si AUCUN style n'atteint huit, ils reviennent
 * tous — sans quoi la galerie d'un artiste qui débute serait vide, ce
 * qui n'est demandé nulle part.
 *
 * RÈGLE 5 — LES J'AIME PASSENT DEVANT. Dans chaque style, les photos
 * qui ont reçu au moins un j'aime s'affichent d'abord, par nombre
 * DÉCROISSANT ; les autres suivent dans l'ordre de l'artiste.
 * L'alternance de la règle 3 n'est pas touchée : chaque style donne
 * simplement ses meilleures d'abord.
 *
 * ⚠️ L'ORDRE DES STYLES est celui de leur photo la plus récente : la
 * lecture arrive déjà rangée par date décroissante (voir
 * `lireLesFavoris`), on prend donc l'ordre d'apparition. Aucun second
 * classement n'est écrit ici.
 */
//  ⚠️ LES FAVORIS DU VISITEUR NE COMMANDENT PLUS RIEN (nº 302), et le
//  paramètre qui les portait est parti avec eux : la règle 5 parle des
//  j'aime REÇUS par la photo, tous comptes confondus (`photo.jaime`),
//  pas de ce que celui qui regarde a gardé.
export function bandeDeTrois(suivi: TatoueurSuivi): BandeDeTrois {
  //  RÈGLE 1 — que des réalisations.
  const realisations = suivi.recentes.filter(
    (photo) => natureConnue(photo.nature) !== "flash"
  );
  if (realisations.length === 0) return { photos: [] };

  //  LES STYLES, DANS L'ORDRE D'APPARITION (donc du plus récent).
  const parStyle = new Map<string, PhotoDuSuivi[]>();
  for (const photo of realisations) {
    const liste = parStyle.get(photo.style) ?? [];
    liste.push(photo);
    parStyle.set(photo.style, liste);
  }

  /** RÈGLE 5 — les plus aimées d'abord, puis l'ordre de l'artiste. */
  const parJaimePuisArtiste = (photos: PhotoDuSuivi[]) =>
    ordreDeLArtiste(photos)
      .map((photo, rang) => ({ photo, rang }))
      .sort((a, b) => b.photo.jaime - a.photo.jaime || a.rang - b.rang)
      .map(({ photo }) => photo);

  /** Le tour de rôle : une de chaque file, en boucle, jusqu'au bout. */
  const alterner = (files: PhotoDuSuivi[][]): PhotoDuSuivi[] => {
    const sortie: PhotoDuSuivi[] = [];
    const restes = files.map((file) => [...file]);
    while (sortie.length < VIGNETTES_MAX && restes.some((f) => f.length > 0)) {
      for (const file of restes) {
        if (sortie.length >= VIGNETTES_MAX) break;
        const photo = file.shift();
        if (photo) sortie.push(photo);
      }
    }
    return sortie;
  };

  //  RÈGLE 2 — un seul style : ses photos, et l'alternance des rendus
  //  quand il en porte deux.
  if (parStyle.size === 1) {
    const photos = [...parStyle.values()][0];
    const parRendu = new Map<string, PhotoDuSuivi[]>();
    for (const photo of photos) {
      const cle = cleDEnsemble(photo);
      const liste = parRendu.get(cle) ?? [];
      liste.push(photo);
      parRendu.set(cle, liste);
    }
    return {
      photos: alterner(
        [...parRendu.values()].map((liste) => parJaimePuisArtiste(liste))
      ),
    };
  }

  //  RÈGLE 4 — qui a le droit d'alterner. Personne n'atteint huit :
  //  tout le monde revient (voir la note de la règle 4).
  const assezFournis = [...parStyle.values()].filter(
    (photos) => photos.length >= PHOTOS_POUR_ALTERNER
  );
  const retenus = assezFournis.length > 0 ? assezFournis : [...parStyle.values()];

  //  RÈGLE 3 — un tour de rôle entre les styles retenus, la règle 5
  //  décidant de l'ordre à l'intérieur de chacun.
  return { photos: alterner(retenus.map((liste) => parJaimePuisArtiste(liste))) };
}

/* ==================================================================
 * LE FILTRE DES DEUX MENUS (nº 245-§3, refait nº 247-§2 et §3)
 * ==================================================================
 * UNE SEULE RÈGLE, deux usages : elle filtre ce qui s'affiche, et elle
 * compte les entrées du menu. Elle porte désormais sur LES DEUX TAGS
 * du menu « Explorer » — la CATÉGORIE puis le style —, jamais sur le
 * style seul : c'est le §3 de la nº 247.
 * Les comptes sont indexés par la valeur d'Explorer (« flash »,
 * « flash:maori »…), les totaux de catégorie compris : c'est
 * exactement ce que `entreesDuFiltre` attend.
 */

/** Cette photo répond-elle au choix courant ? Un tag non demandé ne
    dit jamais non. */
export function photoDuChoix(
  photo: { style: string; nature?: string | null },
  choix: Pick<ChoixSelection, "nature" | "style">
): boolean {
  if (choix.nature && natureConnue(photo.nature) !== choix.nature) return false;
  if (choix.style && photo.style !== choix.style) return false;
  return true;
}

/** Les suivis qui répondent au choix — un artiste PORTE un tag dès
    qu'une de ses publications le porte. Aucun tag : la liste entière. */
export function suivisDuChoix(
  suivis: TatoueurSuivi[],
  choix: Pick<ChoixSelection, "nature" | "style">
): TatoueurSuivi[] {
  if (!choix.nature && !choix.style) return suivis;
  return suivis.filter((suivi) =>
    suivi.recentes.some((photo) => photoDuChoix(photo, choix))
  );
}

/** Le nombre d'ARTISTES par entrée — le menu filtre des artistes, il
    les compte donc. */
export function comptesDesSuivis(
  suivis: TatoueurSuivi[]
): Map<string, number> {
  const comptes = new Map<string, number>();
  for (const suivi of suivis) {
    const cles = new Set<string>();
    //  §1 (nº 257) — LE TOTAL, et LE STYLE SEUL. Le menu des suivis
    //  n'a plus de porte de catégorie : il compte les artistes PAR
    //  STYLE, toutes catégories confondues (un artiste qui a un maori
    //  réalisé ET un flash maori compte une fois), et le total sert la
    //  tête « Tous les styles ». Les clés de couple restent : elles
    //  servent encore au menu des favoris.
    cles.add(CLE_TOTAL);
    for (const photo of suivi.recentes) {
      const nature = natureConnue(photo.nature);
      cles.add(valeurExplorer(nature, ""));
      cles.add(valeurExplorer(nature, photo.style));
      if (photo.style) cles.add(photo.style);
    }
    for (const cle of cles) comptes.set(cle, (comptes.get(cle) ?? 0) + 1);
  }
  return comptes;
}

/** Le nombre d'ENSEMBLES aimés par entrée — le menu « Mes favoris »
    annonce ce qu'il va montrer (une carte = un ensemble, nº 213-§3d). */
export function comptesDesFavoris(
  photos: PhotoFavorite[]
): Map<string, number> {
  const parCle = new Map<string, Set<string>>();
  const ajouter = (cle: string, ensemble: string) => {
    const vus = parCle.get(cle) ?? new Set<string>();
    vus.add(ensemble);
    parCle.set(cle, vus);
  };
  for (const photo of photos) {
    const nature = natureConnue(photo.nature);
    //  L'ENSEMBLE, tel que le site le définit partout (style +
    //  catégorie + rendu), plus le tatoueur : deux artistes ont chacun
    //  leur « réalisme · noir et gris ».
    const ensemble = `${photo.tatoueurSlug}·${cleDEnsemble(photo)}`;
    ajouter(valeurExplorer(nature, ""), ensemble);
    ajouter(valeurExplorer(nature, photo.style), ensemble);
  }
  return new Map([...parCle].map(([cle, vus]) => [cle, vus.size]));
}

/** « 3 nouvelles réalisations » — le compte du §5, jamais à zéro. */
export function libelleNouveautes(nombre: number): string {
  if (nombre <= 0) return "";
  return `${nombre} nouvelle${nombre > 1 ? "s" : ""} réalisation${
    nombre > 1 ? "s" : ""
  }`;
}
