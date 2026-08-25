import { modesOrdonnes, type ModeExerciceFiche } from "@/lib/modes-exercice";
//  §2 (nº 301) — LA VILLE ET LE PAYS, PAR L'ÉCRITURE UNIQUE DU SITE :
//  `ligneCarte` est celle des cartes de la mosaïque (« Lyon, France »,
//  « Austin, TX, États-Unis »). Aucune seconde grammaire de lieu n'est
//  écrite ici — c'est la règle de lib/adresse depuis toujours.
//  §1 (nº 585) — ET LE NOM DU PAYS À PART, de la même source : c'est
//  celle que `ligneCarte` emploie elle-même en interne, pas une
//  seconde table.
import { ligneCarte, nomPaysAffiche, type LieuAffichable } from "@/lib/adresse";
import {
  libelleTypeFiche,
  natureDeLaFiche,
  valeurExplorer,
} from "@/config/tatouage";
import {
  cleDEnsemble,
  natureConnue,
  ordreDeLArtiste,
} from "@/lib/photos-tatoueur";
import {
  CLE_TOTAL,
  cleProfil,
  TOUS_LES_PROFILS,
  type ChoixSelection,
} from "@/lib/filtres-selection";
import type { PhotoDuSuivi, PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";
import type { Tatoueur } from "@/lib/tatoueurs";

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
 * d'exercice (migration nº 21) ; le TYPE de la ligne d'identité vient
 * de `libelleTypeFiche` et son LIEU de `ligneCarte` — rien n'est
 * réécrit ici.
 * ⚠️ `genreMode` A QUITTÉ CE FICHIER À LA nº 323 : il écrivait « En
 * salon », « À domicile », « Guest » sous le nom. Le mode d'exercice
 * ne s'affiche plus sur cette ligne (§3-a) — l'import partait donc
 * avec lui.
 */

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
 * ██ §2 (nº 412) — UNE SEULE LISTE, LES TROIS GROUPES SONT SUPPRIMÉS ██
 * ==================================================================
 * CE QU'IL Y AVAIT ICI : `groupesDeSuivis` (nº 243) rangeait les
 * suivis en « Cette semaine », « À venir », « Tous les portfolios »
 * selon les sessions guest, et l'onglet Portfolios écrivait un titre
 * par groupe — masqués depuis la nº 249 tant qu'il n'y avait QU'UN
 * groupe. Le classement a dormi des mois : aucun artiste suivi n'avait
 * de session guest, tout tombait dans « tous », aucun titre ne
 * s'écrivait. La première vraie session (nº 410-411) l'a réveillé — et
 * le propriétaire a découvert des titres et un trait qu'il n'avait
 * jamais demandés. Il les supprime : LA LISTE SEULE.
 *
 * L'ORDRE QUI RESTE est celui que la liste avait pendant tout ce
 * temps : la PUBLICATION LA PLUS RÉCENTE d'abord — l'ordre du groupe
 * « tous », c'est-à-dire la présentation qu'il a toujours vue. Une
 * session guest ne fait plus remonter personne.
 * ⚠️ `guestDuSuivi` et `periodeDuGuest` RESTENT : elles servent la
 * ligne de dates DANS le bloc d'un artiste, qui ne change pas.
 */
export function suivisAPlat(suivis: TatoueurSuivi[]): TatoueurSuivi[] {
  return suivis
    .slice()
    .sort((a, b) =>
      (b.recentes[0]?.creeLe ?? "").localeCompare(a.recentes[0]?.creeLe ?? "")
    );
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

/**
 * CE QUI S'ÉCRIT SOUS LE NOM — UNE SEULE GRAMMAIRE POUR TOUT LE MONDE
 * ==================================================================
 * (§3, passe nº 323)
 *
 * LA RÈGLE, EN DEUX SEGMENTS ET PAS UN DE PLUS :
 *
 *     LE TYPE · OÙ
 *
 *   · Artiste · Paris · France
 *   · Artiste · Austin, TX · États-Unis
 *   · Artiste · Paris, Félines · France        (trois villes, un pays)
 *   · Artiste · Paris · France | Berlin · Allemagne     (deux pays)
 *   · Studio  · Félines · France
 *   · Salon   · Austin, TX · États-Unis
 *
 * ⚠️ LA FORME DU SECOND SEGMENT A ÉTÉ REPRISE TROIS FOIS DEPUIS : la
 * nº 585 a supprimé le « +N » qui comptait les villes sans les nommer,
 * la nº 586 a mis une barre verticale entre les pays, la nº 587 un
 * point médian devant le pays. La règle des DEUX SEGMENTS, elle, n'a
 * pas bougé — c'est `lieuxEcrits` qui écrit le second.
 *
 * CE QUI NE VA PLUS, ET POURQUOI ON L'A CHANGÉ. La liste mélangeait
 * DEUX grammaires : pour un lieu, le premier mot disait CE QU'IL EST
 * (« Studio ») ; pour un artiste, il disait COMMENT IL TRAVAILLE
 * (« En salon »). Deux questions différentes sur la même colonne — et
 * le mot « artiste », lui, n'apparaissait nulle part. Désormais le
 * premier segment répond toujours à « c'est quoi ? », le second
 * toujours à « où ? ».
 *
 * ⚠️ LE MODE D'EXERCICE A QUITTÉ CETTE LIGNE (§3-a). « En salon »,
 * « En studio », « À domicile », « Guest » : plus aucun. Ils ne sont
 * pas perdus — la FICHE les porte, et elle a la place de les écrire.
 * LES GUESTS SERONT TRAITÉS À PART, sur la page des notifications :
 * c'est pourquoi `periodeDuGuest` et `guestDuSuivi` restent exportées
 * alors que cette ligne ne les appelle plus. Ce n'est pas un oubli,
 * c'est une attente annoncée par le propriétaire.
 *
 * ⚠️ AUCUN MOT N'EST INVENTÉ ICI, et c'est le point : `libelleTypeFiche`
 * écrit déjà « Artiste », « Salon » et « Studio » pour les cartes de la
 * mosaïque et les têtes de fiche. On l'appelle — donc un artiste
 * s'appelle « Artiste » ICI EXACTEMENT COMME AILLEURS, et le jour où ce
 * mot changera il changera partout d'un coup. `ligneCarte` (nº 301)
 * écrit le lieu, avec sa division quand le pays l'écrit (« Austin, TX,
 * États-Unis ») et sans quand il ne l'écrit pas (« Lyon, France ») ;
 * `lieuxEcrits` n'en reprend ensuite que la ponctuation entre la ville
 * et le pays, sans jamais renommer ni l'une ni l'autre.
 */

/**
 * LES VILLES OÙ CET ARTISTE TRAVAILLE, DÉDOUBLONNÉES, DANS SON ORDRE.
 * ------------------------------------------------------------------
 * §3-e — L'ORDRE EST CELUI QU'IL A DÉCLARÉ : on parcourt `suivi.modes`
 * TEL QUEL. ⚠️ SURTOUT PAS `modesOrdonnes`, qui range par genre (à
 * domicile, en studio, en salon, guest) — c'était le bon classement
 * quand chaque mode avait sa ligne ; ici il déciderait à la place de
 * l'artiste QUELLE ville se lit en premier.
 *
 * §3-d — DÉDOUBLONNÉES SUR LA LIGNE RENDUE, et non sur le nom brut :
 * deux modes qui s'écrivent pareil à l'écran SONT la même ville pour
 * qui lit. C'est ce qui fait qu'un artiste qui reçoit chez lui ET
 * travaille en salon dans la même ville affiche « Artiste · Paris,
 * France » — une seule fois, sans rien d'ajouté. C'est le cas le plus
 * fréquent, il reste court.
 *
 * §3-f — UNE VILLE, JAMAIS UNE ADRESSE. On ne lit que `ville`,
 * `region`, `pays`, `code_pays` — ni rue ni numéro n'entrent dans
 * `ligneCarte`. Et on ne se replie PAS sur l'intitulé d'un mode (le
 * nom du lieu qui accueille) : ce n'est pas une ville. Un mode sans
 * ville reprend celle de la fiche.
 *
 * ⚠️ UNE SESSION GUEST TERMINÉE NE COMPTE PAS. Elle ne dit plus où
 * l'artiste se trouve — c'est la règle du §2 de la nº 243, et elle
 * vaut ici comme elle valait ligne à ligne : nommer une ville qu'il a
 * quittée l'annoncerait à un endroit où il n'est plus.
 *
 * ⚠️ UN GUEST EN COURS, LUI, COMPTE COMME LES AUTRES (décision du
 * propriétaire, nº 585) : un salon à Paris et un guest à Berlin
 * s'écrivent « Paris, France · Berlin, Allemagne », sans que rien ne
 * distingue le fixe du passage. La ligne dit OÙ ON LE TROUVE, pas à
 * quel titre.
 */

/**
 * ██ UN LIEU RETENU : SA LIGNE, ET SON PAYS À PART (nº 585) ██
 * ------------------------------------------------------------------
 * POURQUOI LES DEUX. La ligne est celle du site (`ligneCarte`) —
 * « Lyon, France », « Austin, TX, États-Unis » : c'est elle qui NOMME
 * le lieu, et elle seule ; c'est aussi sur elle que deux modes se
 * reconnaissent comme un même endroit (le dédoublonnage, §3-d).
 * Mais la règle du propriétaire GROUPE PAR PAYS : il faut donc savoir
 * lequel, et le nom du pays ne se devine pas dans une chaîne déjà
 * composée. On le demande à la MÊME écriture que `ligneCarte` emploie
 * en interne (`nomPaysAffiche`) — aucune seconde grammaire de lieu.
 * ⚠️ DEPUIS LA nº 587, LA LIGNE N'EST PLUS ÉCRITE TELLE QUELLE nulle
 * part : même seul, un lieu voit sa virgule de pays remplacée par un
 * point médian. Le champ reste ce qui nomme et ce qui dédoublonne.
 */
type LieuDuSuivi = { ligne: string; pays: string };

/**
 * Le parcours des modes, une fois pour toutes : c'est lui qui décide
 * QUELS lieux comptent, dans quel ordre, et sans doublon.
 * ⚠️ `villesDuSuivi` (juste dessous) n'en garde que les lignes : sa
 * signature ne change pas d'un caractère, ce qui la lit ne voit rien.
 */
function lieuxDuSuivi(
  suivi: TatoueurSuivi,
  aujourdhui = jourCivil()
): LieuDuSuivi[] {
  const lieux: LieuDuSuivi[] = [];
  const ajouter = (lieu: LieuAffichable) => {
    const ligne = ligneCarte(lieu);
    if (!ligne || lieux.some((autre) => autre.ligne === ligne)) return;
    lieux.push({ ligne, pays: nomPaysAffiche(lieu) });
  };
  for (const mode of suivi.modes) {
    if (mode.genre === "guest" && mode.fin_le && mode.fin_le < aujourdhui) {
      continue;
    }
    ajouter({
      ville: mode.ville ?? suivi.ville,
      region: mode.region ?? suivi.region,
      pays: mode.pays ?? suivi.pays,
      code_pays: mode.code_pays ?? suivi.codePays,
    });
  }
  //  Aucun mode (un salon, un studio — ou un artiste qui n'en a pas
  //  déclaré) : la fiche EST le lieu.
  if (lieux.length === 0) {
    ajouter({
      ville: suivi.ville,
      region: suivi.region,
      pays: suivi.pays,
      code_pays: suivi.codePays,
    });
  }
  return lieux;
}

export function villesDuSuivi(
  suivi: TatoueurSuivi,
  aujourdhui = jourCivil()
): string[] {
  return lieuxDuSuivi(suivi, aujourdhui).map((lieu) => lieu.ligne);
}

/**
 * ██ COMBIEN DE LIEUX S'ÉCRIVENT, AU PLUS (nº 585) ██
 * ------------------------------------------------------------------
 * TROIS, et c'est le plafond que le site emploie déjà pour une
 * énumération de la même famille — les styles d'une ligne d'équipe
 * (`STYLES_EQUIPE_AFFICHES`, nº 313). Au-delà, la ligne d'un artiste
 * devient un paragraphe, et elle vit sous un nom, dans une liste.
 * CE QUI DÉPASSE N'EST PAS COMPTÉ, IL EST ÉLIDÉ : des points de
 * suspension collés au dernier nom écrit. Le propriétaire ne veut
 * plus lire un nombre (« +2 ») — il veut lire des villes.
 */
export const LIEUX_AFFICHES = 3;

/**
 * ██ LES LIEUX, ÉCRITS (nº 585, forme reprise nº 586) ██
 * ==================================================================
 * LA RÈGLE DU PROPRIÉTAIRE, mot pour mot :
 *  · UN SEUL LIEU → « Paris · France », division comprise devant le
 *    point médian (« Austin, TX · États-Unis ») ;
 *  · UN SEUL PAYS, plusieurs villes → les villes entre elles par des
 *    VIRGULES, le pays introduit par un POINT MÉDIAN : « Paris,
 *    Félines · France » ;
 *  · PLUSIEURS PAYS → chaque groupe s'écrit de cette même façon, et
 *    les groupes sont séparés par UNE BARRE VERTICALE : « Paris,
 *    Félines · France | Berlin · Allemagne ».
 *
 * ██ §1 (nº 587) — LE PAYS S'ANNONCE PAR UN POINT MÉDIAN ██
 * La nº 586 le posait après une virgule, au même rang que les villes.
 * Le propriétaire veut qu'on VOIE le changement de nature : une liste
 * de villes d'un côté, le pays qui les contient de l'autre. Les trois
 * cas ci-dessus n'en font donc plus qu'UN SEUL à composer — villes,
 * point médian, pays — et le raccourci qui rendait la ligne toute
 * faite pour un lieu unique n'a plus lieu d'être : il écrivait la
 * virgule de `ligneCarte`.
 *
 * ██ §1 (nº 586) — POURQUOI LA BARRE, ET PAS LE POINT MÉDIAN ██
 * La nº 585 posait le pays après un point médian (« Paris, Lyon ·
 * France ») et séparait les pays de la même façon. Le propriétaire l'a
 * relevé : LE MÊME SIGNE SERVAIT À DEUX CHOSES à la fois — dire « et
 * voilà le pays » et dire « et voilà un autre pays » —, si bien qu'on
 * ne savait plus, à la lecture, si « France » fermait un groupe ou en
 * ouvrait un. Le point médian retrouve donc son seul emploi de la
 * ligne : séparer le métier de la localisation. Ce qui sépare les
 * PAYS est un signe qui n'y sert à rien d'autre.
 * CONSÉQUENCE HEUREUSE : les deux derniers cas s'écrivent maintenant
 * de la MÊME façon — un groupe, c'est ses villes puis son pays — et
 * il n'y a plus qu'une seule forme à composer au lieu de deux.
 *
 * L'ORDRE NE SE DÉCIDE PAS ICI : c'est celui des modes, donc celui que
 * l'artiste a déclaré (§3-e ci-dessus). Les groupes de pays suivent le
 * premier lieu qui les nomme. Trier alphabétiquement déplacerait son
 * lieu principal, qu'il a mis en tête.
 *
 * ⚠️ JAMAIS DE SÉPARATEUR ORPHELIN (charte, nº 386) : un lieu sans
 * pays connu s'écrit seul et ne se groupe avec personne ; un pays sans
 * ville s'écrit seul aussi, sans virgule devant lui.
 */
const SEPARATEUR_DE_PAYS = " | ";
/** Ce qui annonce le pays derrière ses villes (§1 nº 587). C'est le
    point médian du site, celui-là même qui sépare le métier de la
    localisation — un cran plus haut que la virgule des villes. */
const AVANT_LE_PAYS = " · ";

function lieuxEcrits(lieux: LieuDuSuivi[]): string {
  if (lieux.length === 0) return "";

  const retenus = lieux.slice(0, LIEUX_AFFICHES);
  const groupes: Array<{ pays: string; sujets: string[] }> = [];
  for (const lieu of retenus) {
    const groupe = lieu.pays
      ? groupes.find((autre) => autre.pays === lieu.pays)
      : undefined;
    if (groupe) groupe.sujets.push(sujetDuLieu(lieu));
    else groupes.push({ pays: lieu.pays, sujets: [sujetDuLieu(lieu)] });
  }
  if (lieux.length > retenus.length) {
    const dernier = groupes[groupes.length - 1];
    const rang = dernier.sujets.length - 1;
    dernier.sujets[rang] = `${dernier.sujets[rang]}…`;
  }
  return groupes
    .map((groupe) =>
      [groupe.sujets.filter(Boolean).join(", "), groupe.pays]
        .filter(Boolean)
        .join(AVANT_LE_PAYS)
    )
    .join(SEPARATEUR_DE_PAYS);
}

/**
 * CE QUI SE LIT DEVANT LE PAYS — la ville, avec sa division quand le
 * pays l'écrit. On le RETIRE de la ligne au lieu de le recomposer :
 * c'est la garantie qu'aucune seconde grammaire ne s'installe ici.
 * Un lieu qui n'est QUE son pays n'a rien devant lui ; un lieu sans
 * pays connu est tout entier son propre sujet.
 */
function sujetDuLieu(lieu: LieuDuSuivi): string {
  if (!lieu.pays) return lieu.ligne;
  if (lieu.ligne === lieu.pays) return "";
  const suffixe = `, ${lieu.pays}`;
  return lieu.ligne.endsWith(suffixe)
    ? lieu.ligne.slice(0, -suffixe.length)
    : lieu.ligne;
}

/**
 * LA LIGNE SOUS LE NOM — « Artiste · Paris, Félines · France ».
 * ------------------------------------------------------------------
 * ██ §1 (nº 585) — ON LIT DES VILLES, PLUS UN NOMBRE ██
 * §3-b et §3-c SONT ANNULÉS. La ligne écrivait la première ville en
 * entier puis COMPTAIT les autres — « Paris, France +1 ». Le
 * propriétaire l'a relevé : ce « +1 » ne dit pas ce qu'il compte, et
 * qui lit ne peut pas le deviner. Les villes s'écrivent désormais
 * toutes, groupées par pays ; la règle complète vit dans
 * `lieuxEcrits`, avec ses trois cas et son plafond.
 * ⚠️ ELLE REND UNE CHAÎNE, PLUS UNE LISTE. Il y avait UNE LIGNE PAR
 * MODE (nº 247-§4), et le type `LigneInfoSuivi` qui allait avec, avec
 * sa date de guest et son drapeau « proche ». Tout cela part avec les
 * modes : il n'y a plus qu'une ligne, elle n'a pas de date, elle n'a
 * pas d'urgence à signaler. Le composant s'en trouve d'autant plus
 * simple — voir BlocSuivis.
 */
export function ligneDIdentite(
  suivi: TatoueurSuivi,
  aujourdhui = jourCivil()
): string {
  const type = libelleTypeFiche(suivi.typeFiche, suivi.etablissement);
  const ou = lieuxEcrits(lieuxDuSuivi(suivi, aujourdhui));
  return [type, ou].filter(Boolean).join(" · ");
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
 * LES CARTES DE « MA SÉLECTION DE PHOTOS » (§2, nº 303)
 * ==================================================================
 * UNE PHOTO AIMÉE = UNE CARTE.
 * ------------------------------------------------------------------
 * LE DÉFAUT : depuis la nº 302, un cœur ne met en favori QUE la photo
 * touchée. La page, elle, DÉDOUBLONNAIT PAR CARROUSEL — aimer trois
 * photos d'un même carrousel n'en montrait qu'UNE, et le propriétaire
 * ne retrouvait pas ce qu'il avait gardé.
 * LE DÉDOUBLONNAGE EST SUPPRIMÉ, et la carte montre SA photo : la
 * galerie qu'on lui donne ne contient qu'elle. Cliquer tombe pile
 * dessus, par le mécanisme de la nº 302 (`?photo=`,
 * `ouvertureSurUnePhoto`) — rien de neuf n'est écrit pour ça.
 * ⚠️ L'ORDRE NE CHANGE PAS : la liste arrive rangée par date
 * d'enregistrement du cœur, la plus récente d'abord.
 * ⚠️ CETTE RÈGLE VIT ICI, ET NON DANS LE COMPOSANT : sortie de React,
 * elle s'exécute, donc elle se prouve.
 * ⚠️ ET ELLE DÉPEND DE LA MIGRATION POUR LES ANCIENNES DONNÉES : tant
 * que `yokofolio-coeur-une-photo.sql` n'est pas passée, un carrousel
 * aimé AVANT la nº 302 a toutes ses lignes en base — il donnera donc
 * autant de cartes qu'il avait de photos. C'est exactement ce que la
 * migration convertit.
 * Les champs qu'une carte ne lit pas (coordonnées, réseaux) sont
 * neutres : les inventer serait pire que les laisser vides.
 */
export function cartesDesFavoris(
  visibles: PhotoFavorite[]
): Array<{ cle: string; fiche: Tatoueur; photo: PhotoFavorite }> {
  const liste: Array<{
    cle: string;
    fiche: Tatoueur;
    photo: PhotoFavorite;
  }> = [];
  for (const photo of visibles) {
    //  LA CLÉ EST CELLE DE LA PHOTO : deux photos d'un même carrousel
    //  ne peuvent plus se confondre.
    const cle = photo.id;
    //  §1 (nº 278) — DANS L'ORDRE DE L'ARTISTE, ET NON DANS CELUI
    //  DES FAVORIS. C'était LE défaut relevé : la liste `photos`
    //  arrive rangée par date d'enregistrement du cœur, et un cœur
    //  de galerie écrit toutes ses lignes d'un coup — leur ordre
    //  n'avait donc aucun sens. La règle 1 du carrousel (voir
    //  lib/photos-tatoueur) veut la première photo de l'artiste en
    //  premier : c'est `ordre` qui le dit, et lui seul.
    //  §2 (nº 303) — LA CARTE MONTRE SA PHOTO, ET ELLE SEULE. On lui
    //  donnait tout le carrousel : elle affichait alors la PREMIÈRE
    //  photo de l'artiste, la même pour les trois cartes d'un même
    //  carrousel. La fiche qui s'ouvre, elle, garde bien tout le
    //  carrousel — elle est demandée au serveur (`ficheComplete`).
    const duMemeEnsemble = [photo];
    liste.push({
      cle,
      photo,
      fiche: {
        id: photo.tatoueurId,
        nom: photo.tatoueurNom,
        slug: photo.tatoueurSlug,
        type_fiche: photo.typeFiche,
        etablissement: photo.etablissement,
        photo_profil: photo.photoProfil,
        ville_nom: photo.ville,
        ville_slug: "",
        region: photo.region,
        pays: photo.pays,
        code_pays: photo.codePays,
        latitude: 0,
        longitude: 0,
        styles: [photo.style],
        lien_instagram: "",
        //  §1 (nº 278) — LA PREMIÈRE PHOTO DE L'ARTISTE, jamais la
        //  dernière aimée : ce repli ne sert qu'aux galeries vides,
        //  mais il ne doit pas mentir non plus.
        photo_principale: duMemeEnsemble[0]?.miniature ?? photo.miniature,
        photos_styles: {},
        photos: [],
        publie: true,
        //  §1 (nº 278) — ON GARDE `ordre`, LA VALEUR DE L'ARTISTE, et
        //  non le rang dans la liste des favoris : c'est elle que
        //  `galerieOrdonnee` relit ensuite, partout.
        galerie: duMemeEnsemble.map((entree) => ({
          id: entree.id,
          style: entree.style,
          rendu: entree.rendu,
          nature: entree.nature,
          url: entree.url,
          miniature: entree.miniature,
          ordre: entree.ordre,
        })),
      },
    });
  }
return liste;
}

/* ==================================================================
 * LE COMPTE, SOUS LE TITRE DE « MA SÉLECTION » (§1, nº 303)
 * ==================================================================
 * ⚠️ LA LIGNE DU SOUS-TITRE N'EST PLUS JAMAIS VIDE. Jusqu'ici elle ne
 * disait QUE le filtre en cours (« Réalisme », « Réalisations ·
 * Abstrait ») et restait muette sans filtre — c'est pour ça que la
 * nº 301 avait dû lui RÉSERVER sa hauteur. Elle porte désormais le
 * COMPTE, qui existe toujours. (La réservation reste : elle ne coûte
 * rien, et elle protège d'un cas qu'on n'aurait pas prévu.)
 *
 * ⚠️ ET LE NOM DU FILTRE N'EST PAS PERDU : quand un filtre est actif,
 * les deux informations tiennent ensemble — « Réalisme · 7 portfolios
 * sur 18 ». Supprimer le nom du filtre en silence aurait fait perdre
 * une information que la page donnait depuis la nº 249.
 *
 * LES TROIS CAS, ET ILS SONT TOUS ÉCRITS ICI :
 *  · SINGULIER — « 1 portfolio », « 1 photo », jamais « 1 portfolios » ;
 *  · VIDE — « Aucun portfolio suivi », « Aucune photo en favori »,
 *    jamais « 0 portfolios » ;
 *  · FILTRE ACTIF — « 7 portfolios sur 18 » : le compte reste, et il
 *    dit ce que le filtre a laissé. Un filtre qui ne laisse rien se dit
 *    « Aucun portfolio sur 18 » — jamais « 0 portfolio sur 18 ».
 */
export function compteDeLaSelection({
  surLesFavoris,
  total,
  visibles,
  filtreActif,
}: {
  /** Vrai sur « Ma sélection de photos », faux sur les portfolios. */
  surLesFavoris: boolean;
  /** Tout ce que le compte possède, filtre ou pas. */
  total: number;
  /** Ce que le filtre laisse — égal à `total` sans filtre. */
  visibles: number;
  filtreActif: boolean;
}): string {
  const nom = (n: number) =>
    surLesFavoris ? (n > 1 ? "photos" : "photo") : n > 1 ? "portfolios" : "portfolio";
  //  RIEN DU TOUT — et on le dit avec le mot juste, pas avec un zéro.
  if (total === 0) {
    return surLesFavoris ? "Aucune photo en favori" : "Aucun portfolio suivi";
  }
  if (!filtreActif) return `${total} ${nom(total)}`;
  if (visibles === 0) {
    return `${surLesFavoris ? "Aucune photo" : "Aucun portfolio"} sur ${total}`;
  }
  return `${visibles} ${nom(visibles)} sur ${total}`;
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

/**
 * §2 (nº 316) — LES CLÉS DE PROFIL D'UN PORTFOLIO SUIVI.
 * ------------------------------------------------------------------
 * ÉCRITE UNE SEULE FOIS, ET LUE DEUX : par le COMPTAGE des entrées du
 * menu et par le FILTRAGE de la liste. C'est la seule façon qu'un
 * nombre affiché ne mente jamais sur ce qu'il montrera — la nº 314-§2
 * a rappelé ce que coûte un compte qui suit sa propre règle.
 *
 * LA RÈGLE, EN UNE LIGNE (nº 321) : UN PORTFOLIO SUIVI PORTE SON
 * TYPE, ET RIEN D'AUTRE — « artiste », « prive » (Studio) ou
 * « salon ». C'est `natureDeLaFiche` qui tranche, la même autorité que
 * les fiches et les cartes.
 *
 * ⚠️ CE QUE LA nº 321 A RETIRÉ : les MODES D'EXERCICE (à domicile, en
 * studio, en salon, guest). Un artiste apparaissait alors sous chacun
 * de ses modes, et le menu portait deux sous-titres pour séparer les
 * deux mondes. Le propriétaire a tranché autrement : le filtre porte
 * sur le TYPE du portfolio, une question à laquelle toute fiche répond
 * — d'où la liste plate, et d'où le fait qu'aucun portfolio ne peut
 * plus manquer à l'appel.
 */
export function clesDuProfil(suivi: TatoueurSuivi): string[] {
  const nature = natureDeLaFiche(suivi.typeFiche, suivi.etablissement);
  /*  LA TÊTE DU GROUPE EST UNE CLÉ COMME LES AUTRES. « Tous les
      profils » n'est pas un raccourci d'affichage : il se compte et se
      filtre par cette même fonction, donc son nombre ne peut pas
      mentir sur ce qu'il montrera. */
  return [TOUS_LES_PROFILS, cleProfil(nature)];
}

/** Les suivis qui répondent au choix — un artiste PORTE un tag dès
    qu'une de ses publications le porte. Aucun tag : la liste entière. */
export function suivisDuChoix(
  suivis: TatoueurSuivi[],
  choix: Pick<ChoixSelection, "nature" | "style" | "profil">
): TatoueurSuivi[] {
  /*  §2-e (nº 316) — LE PROFIL FILTRE COMME LE STYLE : même place dans
      l'adresse, même place ici. Il passe AVANT le reste parce qu'il
      l'exclut par construction (voir `lireSelection`) — écrire les
      deux tests l'un après l'autre laisserait croire qu'ils peuvent se
      cumuler, ce qui est faux. */
  if (choix.profil) {
    return suivis.filter((suivi) => clesDuProfil(suivi).includes(choix.profil));
  }
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
    //  §2-c et §2-d (nº 316) — LES CLÉS DU SECOND MENU, par la MÊME
    //  fonction que le filtrage (`clesDuProfil`) : le nombre annoncé
    //  et la liste montrée ne peuvent pas diverger. Et rien ne
    //  s'affiche qui n'existe pas — une entrée sans compte n'entre
    //  jamais dans cette table, donc jamais dans le menu.
    for (const cle of clesDuProfil(suivi)) cles.add(cle);
    for (const cle of cles) comptes.set(cle, (comptes.get(cle) ?? 0) + 1);
  }
  return comptes;
}

/** Le nombre de PHOTOS aimées par entrée — le menu « Mes favoris »
    annonce ce qu'il va montrer (une carte = une photo depuis la
    nº 302 ; le compte a suivi à la nº 314-§2). */
export function comptesDesFavoris(
  photos: PhotoFavorite[]
): Map<string, number> {
  /**
   * §2 (nº 314) — ON COMPTE LES PHOTOS AIMÉES, PLUS LES ENSEMBLES.
   * ------------------------------------------------------------------
   * CE QUI ÉTAIT COMPTÉ : le nombre d'ENSEMBLES distincts
   * (`tatoueur · style · catégorie · rendu`) touchés par au moins un
   * cœur. Six photos aimées d'un même carrousel de réalisme ne faisaient
   * donc qu'UN, et le menu affichait « 1 » là où le propriétaire en
   * attendait six.
   * POURQUOI C'ÉTAIT ÉCRIT AINSI, ET POURQUOI ÇA NE L'EST PLUS : jusqu'à
   * la nº 302, un cœur mettait en favori TOUT un ensemble — compter les
   * ensembles était donc compter les gestes. Depuis la nº 302, UN CŒUR
   * NE VAUT QU'UNE PHOTO : le compte naturel est celui des photos, et
   * c'est celui-là qu'on écrit.
   * ⚠️ LES DEUX CLÉS SUIVENT LA MÊME RÈGLE — la catégorie seule
   * (« Réalisation », « Flash ») comme le couple catégorie + style. On
   * ne peut donc plus lire des photos d'un côté et des ensembles de
   * l'autre : partout, ce sont des photos.
   */
  const parCle = new Map<string, number>();
  const ajouter = (cle: string) => parCle.set(cle, (parCle.get(cle) ?? 0) + 1);
  for (const photo of photos) {
    const nature = natureConnue(photo.nature);
    /*  §3 (nº 321) — LE TOTAL, pour « Tous les favoris ». La clé est
        la MÊME que celle des suivis (`CLE_TOTAL`, une étoile), parce
        que les deux menus posent la même question : « combien en
        tout ? ». Elle est comptée UNE FOIS PAR PHOTO, comme les deux
        autres — le total d'un menu qui montre des photos est le
        nombre de photos, pas le nombre d'entrées qu'elles nourrissent. */
    ajouter(CLE_TOTAL);
    //  La catégorie seule, puis la catégorie et le style : une photo
    //  compte pour un dans chacune des deux entrées qu'elle nourrit.
    ajouter(valeurExplorer(nature, ""));
    ajouter(valeurExplorer(nature, photo.style));
  }
  return parCle;
}

/** « 3 nouvelles réalisations » — le compte du §5, jamais à zéro. */
export function libelleNouveautes(nombre: number): string {
  if (nombre <= 0) return "";
  return `${nombre} nouvelle${nombre > 1 ? "s" : ""} réalisation${
    nombre > 1 ? "s" : ""
  }`;
}
