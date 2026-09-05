import { modesOrdonnes, type ModeExerciceFiche } from "@/lib/modes-exercice";
//  §2 (nº 301) — LA VILLE ET LE PAYS, PAR L'ÉCRITURE UNIQUE DU SITE :
//  `ligneCarte` est celle des cartes de la mosaïque (« Lyon, France »,
//  « Austin, TX, États-Unis »). Aucune seconde grammaire de lieu n'est
//  écrite ici — c'est la règle de lib/adresse depuis toujours.
//  §1 (nº 585) — ET LE NOM DU PAYS À PART, de la même source : c'est
//  celle que `ligneCarte` emploie elle-même en interne, pas une
//  seconde table.
//  §3-b (nº 589) — ET LA DIVISION, de la même source encore : c'est la
//  fonction que `ligneCarte` consulte pour décider si un État s'écrit.
import {
  codeAdministratif,
  ligneCarte,
  nomPaysAffiche,
  type LieuAffichable,
} from "@/lib/adresse";
//  §2 (nº 862) — `libelleTypeFiche` N'EST PLUS APPELÉ D'ICI : le type
//  a quitté la ligne d'identité pour le badge de la rangée, qui le lit
//  à la même source (BadgeTypeDeFiche). Un import qui ne sert plus est
//  un piège pour la passe suivante ; il part avec l'appel.
import { natureDeLaFiche, valeurExplorer } from "@/config/tatouage";
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
 * d'exercice (migration nº 21) et le LIEU de la ligne d'identité de
 * `ligneCarte` — rien n'est réécrit ici. (Le TYPE en venait aussi, par
 * `libelleTypeFiche` ; il a quitté cette ligne à la nº 862 pour le
 * badge de la rangée, qui appelle la même fonction.)
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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function periodeDuGuest(mode: {
  debut_le: string | null;
  fin_le: string | null;
}): string {
  if (!mode.debut_le) return "";
  const [, moisD, jourD] = mode.debut_le.split("-");
  const jour = (valeur: string) => String(Number(valeur));
  const nom = (valeur: string) => MOIS_COURTS[Number(valeur) - 1] ?? "";
  if (!mode.fin_le) return `${nom(moisD)} ${jour(jourD)}`;
  const [, moisF, jourF] = mode.fin_le.split("-");
  return moisD === moisF
    ? `${nom(moisF)} ${jour(jourD)}–${jour(jourF)}`
    : `${nom(moisD)} ${jour(jourD)} – ${nom(moisF)} ${jour(jourF)}`;
}

/**
 * CE QUI S'ÉCRIT SOUS LE NOM — UNE SEULE GRAMMAIRE POUR TOUT LE MONDE
 * ==================================================================
 * (§3, passe nº 323)
 *
 * LA RÈGLE, EN DEUX SEGMENTS ET PAS UN DE PLUS :
 *
 *     LE TYPE: OÙ
 *
 *   · Artiste: Paris, France
 *   · Artiste: Austin, TX, USA
 *   · Artiste: Félines · Paris, France      (plusieurs villes, un pays)
 *   · Artiste: Berlin, Allemagne | Paris, France      (plusieurs pays)
 *   · Studio:  Félines, France
 *   · Salon:   Austin, TX, USA
 *
 * ██ §2 (nº 862) — IL N'EN RESTE QUE LE SECOND SEGMENT ██
 * Le premier — le type et ses deux points — est monté dans le BADGE de
 * la rangée (BlocSuivis). La ligne s'écrit donc « Paris, France »,
 * « Félines · Paris, France », « Berlin, Allemagne | Paris, France ».
 * Les exemples ci-dessus gardent leur type PARCE QU'ILS DISENT
 * L'HISTOIRE de cette ligne ; la règle vivante est celle du dessous.
 *
 * ⚠️ LA FORME DU SECOND SEGMENT A ÉTÉ REPRISE SIX FOIS DEPUIS, et la
 * règle des DEUX SEGMENTS n'a pas bougé une seule : la nº 585 a
 * supprimé le « +N » qui comptait les villes sans les nommer, la
 * nº 586 a mis une barre verticale entre les pays, la nº 587 un point
 * médian devant le pays, la nº 589 une puce derrière le type, la
 * nº 590 a fixé la ponctuation définitive (virgule pour une ville,
 * point médian pour plusieurs) et écrit « USA » partout, la nº 591 a
 * rangé le tout par ordre alphabétique. C'est `lieuxEcrits` qui écrit
 * ce second segment, et lui seul.
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
 * ⚠️ AUCUN MOT N'EST INVENTÉ ICI, et c'est le point. Le TYPE se lit
 * chez `libelleTypeFiche` — « Artiste », « Salon », « Studio », les
 * mots des cartes et des têtes de fiche —, et depuis la nº 862 c'est le
 * BADGE de la rangée qui l'appelle, plus cette ligne : le mot est le
 * même, il a seulement changé de place. `ligneCarte` (nº 301)
 * écrit le lieu, avec sa division quand le pays l'écrit (« Austin, TX,
 * États-Unis ») et sans quand il ne l'écrit pas (« Lyon, France ») ;
 * `lieuxEcrits` n'en reprend ensuite que la ponctuation entre la ville
 * et le pays, sans jamais renommer ni l'une ni l'autre.
 */

/**
 * LES VILLES OÙ CET ARTISTE TRAVAILLE, DÉDOUBLONNÉES, DANS SON ORDRE.
 * ------------------------------------------------------------------
 * §3-e — ON PARCOURT `suivi.modes` TEL QUEL. ⚠️ SURTOUT PAS
 * `modesOrdonnes`, qui range par genre (à domicile, en studio, en
 * salon, guest) : ce classement-là mélangerait la façon d'exercer et
 * l'endroit où l'on exerce, deux questions différentes.
 * ⚠️ CETTE FONCTION NE CLASSE DONC RIEN, et c'est voulu : elle RELÈVE
 * les lieux. Le RANGEMENT de la ligne se décide à l'écriture, où il
 * est alphabétique depuis la nº 591 — voir `lieuxEcrits`. Ce qui sort
 * d'ici garde l'ordre des modes, et `villesDuSuivi` avec lui.
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
 * ⚠️ ET LA DIVISION EN TROISIÈME (§3-b nº 589) : les États américains
 * passent entre parenthèses derrière leur ville, ce qui demande de
 * savoir lequel est une division et lequel est une ville. Comme pour le
 * pays, on le DEMANDE plutôt que de le deviner dans la chaîne.
 */
type LieuDuSuivi = { ligne: string; pays: string; division: string };

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
    lieux.push({
      ligne,
      pays: nomPaysAffiche(lieu),
      division: codeAdministratif(lieu.region, lieu.code_pays) ?? "",
    });
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
 *  · UNE SEULE VILLE DANS LE PAYS → une VIRGULE devant le pays :
 *    « Paris, France », « Austin, TX, USA » ;
 *  · PLUSIEURS VILLES DANS LE MÊME PAYS → un POINT MÉDIAN entre les
 *    villes, puis une VIRGULE devant le pays (§1 nº 613, qui reprend
 *    le point médian que la nº 590 posait là) : « Félines · Paris,
 *    France », « Austin, TX · Miami, FL, USA » ;
 *  · PLUSIEURS PAYS → les groupes séparés par une BARRE VERTICALE :
 *    « Austin, TX · Miami, FL, USA | Paris, France ».
 *
 * ██ §1 (nº 590) — LA RÈGLE DÉFINITIVE, ET CE QU'ELLE REMPLACE ██
 * Elle annule la ponctuation des nº 585 à nº 589, essayée en cinq
 * passes. CE QUI CHANGE PAR RAPPORT À LA nº 589 :
 *  · LE POINT MÉDIAN N'APPARAÎT PLUS QU'À PARTIR DE DEUX VILLES DANS
 *    UN MÊME PAYS. À une seule ville, c'est la VIRGULE — la ponctuation
 *    ordinaire d'une adresse, celle que `ligneCarte` écrit déjà ;
 *  · L'ÉTAT AMÉRICAIN REVIENT À SA VIRGULE, collée à sa ville. Les
 *    parenthèses de la nº 589 sont abandonnées : ce n'est pas la
 *    convention américaine, et l'usage écrit « Austin, TX ».
 * CE QUE ÇA SIMPLIFIE : le point médian ne sert plus qu'à UNE chose —
 * dire qu'on énumère. Dès qu'il apparaît, il y a plusieurs villes ; on
 * lit donc la structure sans connaître la règle.
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
 * ██ §1 (nº 591) — L'ORDRE EST ALPHABÉTIQUE, À DEUX NIVEAUX ██
 * LES PAYS entre eux, puis LES VILLES de chacun. L'ordre de
 * DÉCLARATION n'entre plus en ligne de compte : ni le lieu principal,
 * ni la façon d'exercer (salon, studio, guest) ne donnent la première
 * place. Le propriétaire l'a demandé ainsi — une liste se lit mieux
 * quand on sait où chercher un nom.
 * ⚠️ UN ÉTAT NE CLASSE RIEN : il est collé à sa ville et voyage avec
 * elle. C'est la VILLE qui décide du rang — « Austin, TX » se range à
 * la lettre A, jamais à la lettre T.
 * ⚠️ ET LA TRONCATURE COUPE APRÈS LE TRI : les trois lieux qui restent
 * sont donc les trois PREMIERS ALPHABÉTIQUEMENT, plus les trois
 * premiers déclarés. Un artiste qui exerce à Paris, Lyon, Nice et
 * Brest lira « Brest · Lyon · Nice…, France » — Paris passe derrière
 * l'élision, alors qu'il était en tête de sa déclaration. C'est la
 * conséquence directe de ce qui est demandé, et elle est assumée.
 *
 * ⚠️ JAMAIS DE SÉPARATEUR ORPHELIN (charte, nº 386) : un lieu sans
 * pays connu s'écrit seul et ne se groupe avec personne ; un pays sans
 * ville s'écrit seul aussi, sans virgule devant lui.
 */
/**
 * ██ §2 (nº 862) — LES DEUX POINTS N'ONT PLUS DE TYPE À ANNONCER ██
 * ------------------------------------------------------------------
 * `APRES_LE_TYPE` (« : ») EST SUPPRIMÉ, CODE COMPRIS. Il joignait le
 * TYPE au LIEU sur la ligne des portfolios suivis — « Artiste: Paris,
 * France », la règle de la nº 613. Le propriétaire fait monter le type
 * dans un BADGE, à droite de la rangée (voir BlocSuivis), et la ligne
 * « garde la ville seule » : il n'y a plus rien à annoncer, donc plus
 * rien à ponctuer.
 * ⚠️ CE QUE LA nº 613 DISAIT ET QUI RESTE VRAI AILLEURS : les cartes et
 * la fiche composent leur « Type · Lieu » CHEZ ELLES (`sousTitreDeCarte`,
 * lib/photo-tatoueur) avec le point médian de la nº 843 — cette
 * ponctuation-ci n'était pas la leur, et sa disparition ne les touche
 * pas. Les portfolios suivis étaient son seul porteur.
 * ⚠️ LA HIÉRARCHIE DU LIEU NE BOUGE PAS D'UN CARACTÈRE : la virgule
 * mène au pays, le point médian énumère les villes d'un même pays, la
 * barre verticale sépare deux pays (les trois constantes ci-dessous).
 */

const SEPARATEUR_DE_PAYS = " | ";
/**
 * Ce qui sépare DEUX VILLES d'un même pays : le point médian, qui dit
 * une seule chose — « et aussi ».
 * ⚠️ §1 (nº 613) — IL NE SERT PLUS QU'ENTRE LES VILLES. La nº 590 le
 * posait AUSSI devant le pays quand il y avait plusieurs villes ; le
 * propriétaire l'a repris : le pays est désormais TOUJOURS annoncé par
 * une virgule, qu'il y ait une ville ou six. Une énumération de villes
 * reste une énumération, mais son pays se lit comme dans une adresse
 * ordinaire — « Félines · Paris, France ».
 */
const ENTRE_LES_VILLES = " · ";

/** La ponctuation qui mène au pays — celle d'une adresse ordinaire, et
    désormais la seule (§1 nº 613). */
const APRES_UNE_VILLE = ", ";

/**
 * ██ §1 (nº 591) — LE RANGEMENT ALPHABÉTIQUE, EN FRANÇAIS ██
 * ------------------------------------------------------------------
 * PAS `<` NI `localeCompare` NU, et c'est tout le point : comparer des
 * chaînes JavaScript, c'est comparer des NUMÉROS DE CARACTÈRES. « Évry »
 * y tombe après « Zurich », parce que le É porte un numéro bien plus
 * haut que les lettres nues — et « lyon » avant « Paris » pour la même
 * raison, les majuscules venant avant les minuscules.
 * `Intl.Collator` range comme un dictionnaire français : les accents
 * n'écartent pas une lettre de sa place, et la casse ne compte pas.
 * `sensitivity: "base"` dit exactement cela — « Évry » et « Evry » sont
 * la MÊME entrée pour le classement, comme « PARIS » et « Paris ».
 * ⚠️ CONSTRUIT UNE SEULE FOIS, à l'échelle du module : un comparateur
 * fabriqué dans le tri se refabriquerait à chaque comparaison, et c'est
 * l'objet le plus cher de la famille `Intl`.
 * ⚠️ ON RANGE SUR CE QUI S'ÉCRIT, jamais sur la donnée d'origine. Le
 * pays a pu être abrégé en chemin (« États-Unis » devenu « USA » à la
 * nº 590) : trier sur le nom d'origine rangerait « USA » à la lettre É,
 * et la ligne paraîtrait mal classée à qui la lit. Ce que l'œil
 * compare, c'est ce que l'œil voit.
 */
const ALPHABET = new Intl.Collator("en", { sensitivity: "base" });

function lieuxEcrits(lieux: LieuDuSuivi[]): string {
  if (lieux.length === 0) return "";

  /*  ██ §1 (nº 591) — TOUT EST RANGÉ PAR ORDRE ALPHABÉTIQUE ██
      Le pays d'abord, la ville ensuite : un seul tri en amont suffit
      donc aux DEUX niveaux que le propriétaire demande, puisque le
      groupement qui suit conserve l'ordre reçu. */
  const ranges = lieux
    .map((lieu) => ({ pays: lieu.pays, sujet: sujetDuLieu(lieu) }))
    .sort(
      (a, b) =>
        //  Un lieu SANS PAYS CONNU passe après tous les autres : on ne
        //  peut pas le ranger entre des pays qu'il ne nomme pas, et lui
        //  donner la première place mettrait en tête le moins
        //  renseigné.
        Number(!a.pays) - Number(!b.pays) ||
        ALPHABET.compare(a.pays, b.pays) ||
        ALPHABET.compare(a.sujet, b.sujet)
    );

  const retenus = ranges.slice(0, LIEUX_AFFICHES);
  const groupes: Array<{ pays: string; sujets: string[] }> = [];
  for (const lieu of retenus) {
    const groupe = lieu.pays
      ? groupes.find((autre) => autre.pays === lieu.pays)
      : undefined;
    if (groupe) groupe.sujets.push(lieu.sujet);
    else groupes.push({ pays: lieu.pays, sujets: [lieu.sujet] });
  }
  if (lieux.length > retenus.length) {
    const dernier = groupes[groupes.length - 1];
    const rang = dernier.sujets.length - 1;
    dernier.sujets[rang] = `${dernier.sujets[rang]}…`;
  }
  return groupes
    .map((groupe) => {
      const villes = groupe.sujets.filter(Boolean);
      /*  §1 (nº 613) — LE PAYS EST TOUJOURS ANNONCÉ PAR UNE VIRGULE,
          et le nombre de villes n'y change plus rien. La nº 590 faisait
          suivre le pays du signe de l'énumération quand il y en avait
          une — « Félines · Paris · France » ; le propriétaire veut la
          virgule dans tous les cas : « Félines · Paris, France ». Le
          point médian ne sert donc plus qu'ENTRE les villes.
          ⚠️ `filter(Boolean)` AVANT DE JOINDRE (charte, nº 386) : un
          groupe sans pays ne produit aucune virgule orpheline. */
      return [villes.join(ENTRE_LES_VILLES), groupe.pays]
        .filter(Boolean)
        .join(APRES_UNE_VILLE);
    })
    .join(SEPARATEUR_DE_PAYS);
}

/**
 * CE QUI SE LIT DEVANT LE PAYS — la ville, avec sa division quand le
 * pays l'écrit. On le RETIRE de la ligne au lieu de le recomposer :
 * c'est la garantie qu'aucune seconde grammaire ne s'installe ici.
 * Un lieu qui n'est QUE son pays n'a rien devant lui ; un lieu sans
 * pays connu est tout entier son propre sujet.
 *
 * ⛔ §3-b (nº 589) — L'ÉTAT ENTRE PARENTHÈSES EST ABANDONNÉ (nº 590).
 * Cette passe-là écrivait « Austin (TX), Miami (FL) » pour qu'on ne
 * confonde pas une ville et un État dans une énumération à virgules.
 * LE PROPRIÉTAIRE A TRANCHÉ AUTREMENT, et mieux : ce n'est pas la
 * convention américaine — l'usage écrit « Austin, TX ». La confusion
 * qu'on cherchait à éviter disparaît d'elle-même puisque, à partir de
 * deux villes, ce sont les VILLES qui se séparent par un point médian
 * — « Austin, TX · Miami, FL, USA ». La virgule relie ce qu'une adresse
 * relie : une ville et sa précision, puis le groupe et son pays
 * (§1 nº 613).
 * ⚠️ CE QUI RESTE DE CETTE PASSE : `division` sur le lieu. Elle n'est
 * plus employée par cette fonction, mais elle dit ce que la ligne
 * contient et le type la porte ; la retirer demanderait de la
 * redemander le jour où la forme rebouge.
 * ⚠️ LES CARTES DE LA MOSAÏQUE N'ONT JAMAIS VU AUCUNE DE CES FORMES :
 * elles emploient `ligneLieuDeCarte`, qui écarte l'État depuis la
 * nº 486.
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
 * LA LIGNE SOUS LE NOM — « Félines · Paris, France ».
 * ------------------------------------------------------------------
 * ██ §2 (nº 862) — LE TYPE N'Y EST PLUS : LA LOCALITÉ SEULE ██
 * DÉCISION DU PROPRIÉTAIRE : « le type disparaît de la ligne de la
 * localité (elle garde la ville seule) » — il est monté dans le BADGE
 * qui remplace « Following » à droite de la rangée (BlocSuivis,
 * BadgeTypeDeFiche). Deux endroits diraient deux fois la même chose ;
 * un seul le dit.
 * ⚠️ CE QUI PART EXACTEMENT : l'appel à `libelleTypeFiche` et les deux
 * points qui le suivaient (`APRES_LE_TYPE`, supprimé plus haut). LE
 * LIEU NE CHANGE PAS D'UN CARACTÈRE : mêmes villes, même groupement
 * par pays, même plafond — c'est `lieuxEcrits` qui l'écrit, et elle
 * n'est pas touchée.
 * ⚠️ ET LE MOT DU TYPE N'EST PAS PERDU : le badge le lit à la même
 * source (`libelleTypeFiche`, config/tatouage), jamais une seconde
 * table de mots.
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
  return lieuxEcrits(lieuxDuSuivi(suivi, aujourdhui));
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
 * ██ LA COMPOSITION DE LA BANDE — REFAITE À LA nº 638 ██
 * ==================================================================
 * ⚠️ CE QUI EST ANNULÉ : les cinq règles de la nº 302, qui groupaient
 * par STYLE seul, exigeaient huit photos pour entrer dans l'alternance
 * (`PHOTOS_POUR_ALTERNER`, supprimée avec elles) et rangeaient les
 * styles par leur photo la plus récente. Le propriétaire a tranché
 * autrement à la nº 638 ; le reste de la nº 302 — un cœur = une photo,
 * les vingt vignettes, l'ordre de l'artiste — ne bouge pas.
 *
 * RÈGLE 1 — QUE DES RÉALISATIONS, JAMAIS UN FLASH. Un flash est un
 * dessin proposé : il ne montre pas la main de l'artiste sur la peau.
 * (Inchangée depuis la nº 302.)
 *
 * RÈGLE 2 — UN GROUPE = UN STYLE **ET** UN RENDU. « Réalisme couleur »,
 * « Réalisme noir » et « Réalisme noir et gris » sont TROIS groupes.
 * ⚠️ AUCUNE DÉFINITION NEUVE : c'est `cleDEnsemble` (lib/photos-tatoueur),
 * celle-là même qui définit un carrousel depuis la nº 278.
 *
 * RÈGLE 3 — DANS CHAQUE GROUPE, LES PLUS AIMÉES D'ABORD, du plus grand
 * nombre de favoris au plus petit ; celles qui n'en ont aucun suivent,
 * DANS L'ORDRE VOULU PAR L'ARTISTE.
 * ⚠️ LA DATE DE PUBLICATION NE CHOISIT PLUS RIEN (nº 638) : elle ne
 * décide ni quelle photo, ni quel groupe, ni quel style passe devant.
 *
 * RÈGLE 4 — L'ALTERNANCE : une photo de chaque groupe, à tour de rôle,
 * jusqu'à vingt. Il n'y a plus de seuil d'entrée : un groupe d'une
 * seule photo alterne comme un groupe de vingt.
 *
 * RÈGLE 5 — ET LES GROUPES SONT ENTRELACÉS pour qu'un même style ne se
 * répète pas deux fois de suite. Voir `entrelacerLesGroupes`.
 *
 * RÈGLE 6 — UN SEUL GROUPE : ses vingt plus aimées, dans l'ordre. Rien
 * à alterner — et rien à écrire pour ce cas, l'alternance sur une seule
 * file rend exactement cela.
 *
 * ██ L'ORDRE NE BOUGE QU'À TROIS CONDITIONS, ET C'EST VOULU (nº 638) ██
 * Un favori qui change, l'artiste qui réordonne sa galerie, une photo
 * publiée ou retirée. RIEN D'AUTRE : ni l'heure, ni la date de
 * publication, ni le chemin qui a construit la liste. C'est pourquoi
 * l'ordre des styles et des rendus se décide sur LEUR MEILLEUR NOMBRE
 * DE FAVORIS, et retombe à égalité sur l'alphabet de la clé du groupe —
 * un départage qui ne dépend de rien.
 */

/** Un groupe de la bande : un style, un rendu, ses photos rangées. */
type GroupeDeBande = {
  /** La clé `cleDEnsemble` — style + catégorie + rendu (nº 278). */
  cle: string;
  /** Le slug du style, pour l'entrelacement de la règle 5. */
  style: string;
  /** Ses photos, les plus aimées d'abord (règle 3). */
  photos: PhotoDuSuivi[];
  /** Les favoris de sa meilleure photo — l'ordre des groupes. */
  meilleur: number;
};

/**
 * ██ §5 (nº 638) — L'ENTRELACEMENT : JAMAIS DEUX FOIS LE MÊME STYLE ██
 * ==================================================================
 * CE QU'ON VEUT, avec réalisme (3 rendus) + aquarelle + blackwork +
 * dotwork :
 *   Réalisme couleur · Aquarelle · Réalisme noir · Blackwork ·
 *   Réalisme noir et gris · Dotwork
 * et non « les trois réalismes, puis les trois autres ».
 *
 * COMMENT, EN DEUX TEMPS ET SANS RIEN DE SAVANT :
 *  1. on range les STYLES du plus fourni en groupes au moins fourni —
 *     celui qui risque de se répéter passe donc en premier ;
 *  2. on distribue les groupes ainsi mis à plat DANS LES PLACES
 *     PAIRES d'abord (0, 2, 4…), puis dans les impaires (1, 3, 5…).
 * Le style le plus fourni occupe ainsi une place sur deux, et les
 * autres viennent se glisser entre elles. Sur l'exemple ci-dessus :
 * les trois réalismes prennent 0, 2 et 4 ; aquarelle, blackwork et
 * dotwork prennent 1, 3 et 5 — mot pour mot ce qui est demandé.
 *
 * ⚠️ CE QU'IL SE PASSE QUAND UN STYLE PORTE PLUS DE LA MOITIÉ DES
 * GROUPES, et il faut le dire : la répétition devient MATHÉMATIQUEMENT
 * inévitable — trois rendus de réalisme et un seul autre style, ce sont
 * quatre places pour trois réalismes, deux d'entre eux se toucheront
 * quoi qu'on fasse. L'entrelacement la REPOUSSE, il ne la supprime pas,
 * et il ne prétend pas être optimal dans ce cas-là : il rend
 * « R · R · R · A » là où le mieux possible serait « R · A · R · R ».
 * Un cas rare, un pixel de mieux à gagner, et une règle simple à garder.
 * ⚠️ DÉTERMINISTE : aucune dépendance à l'heure ni au hasard. Deux
 * visites sans changement rendent le même ordre.
 */
function entrelacerLesGroupes(groupes: GroupeDeBande[]): GroupeDeBande[] {
  //  L'ORDRE DE RÉFÉRENCE : le meilleur favori d'abord, puis l'alphabet
  //  de la clé — voir « L'ORDRE NE BOUGE QU'À TROIS CONDITIONS ».
  const comparer = (a: GroupeDeBande, b: GroupeDeBande) =>
    b.meilleur - a.meilleur || a.cle.localeCompare(b.cle);

  const parStyle = new Map<string, GroupeDeBande[]>();
  for (const groupe of [...groupes].sort(comparer)) {
    const file = parStyle.get(groupe.style) ?? [];
    file.push(groupe);
    parStyle.set(groupe.style, file);
  }
  //  1. LES STYLES, DU PLUS FOURNI AU MOINS FOURNI.
  const aplat = [...parStyle.values()]
    .sort((a, b) => b.length - a.length || comparer(a[0], b[0]))
    .flat();

  //  2. LES PLACES PAIRES, PUIS LES IMPAIRES.
  const places: GroupeDeBande[] = new Array(aplat.length);
  let place = 0;
  for (const groupe of aplat) {
    places[place] = groupe;
    place += 2;
    if (place >= aplat.length) place = 1;
  }
  return places;
}

//  ⚠️ LES FAVORIS DU VISITEUR NE COMMANDENT RIEN (nº 302, tenu nº 638) :
//  les règles parlent des favoris REÇUS par la photo, tous comptes
//  confondus (`photo.jaime`), pas de ce que celui qui regarde a gardé.
export function bandeDeTrois(suivi: TatoueurSuivi): BandeDeTrois {
  //  RÈGLE 1 — que des réalisations.
  const realisations = suivi.recentes.filter(
    (photo) => natureConnue(photo.nature) !== "flash"
  );
  if (realisations.length === 0) return { photos: [] };

  //  RÈGLE 2 — les groupes : style ET rendu, par `cleDEnsemble`.
  const parGroupe = new Map<string, PhotoDuSuivi[]>();
  for (const photo of realisations) {
    const cle = cleDEnsemble(photo);
    const liste = parGroupe.get(cle) ?? [];
    liste.push(photo);
    parGroupe.set(cle, liste);
  }

  //  RÈGLE 3 — les plus aimées d'abord, puis l'ordre de l'artiste.
  const groupes: GroupeDeBande[] = [];
  for (const [cle, photos] of parGroupe) {
    const rangees = ordreDeLArtiste(photos)
      .map((photo, rang) => ({ photo, rang }))
      .sort((a, b) => b.photo.jaime - a.photo.jaime || a.rang - b.rang)
      .map(({ photo }) => photo);
    groupes.push({
      cle,
      style: rangees[0].style,
      photos: rangees,
      meilleur: rangees[0].jaime,
    });
  }

  //  RÈGLES 4, 5 ET 6 — le tour de rôle sur les groupes entrelacés.
  //  Un seul groupe : la boucle vide sa file dans l'ordre, ce qui EST
  //  « les vingt plus aimées » — aucun cas particulier à écrire.
  const files = entrelacerLesGroupes(groupes).map((groupe) => [
    ...groupe.photos,
  ]);
  const photos: PhotoDuSuivi[] = [];
  while (photos.length < VIGNETTES_MAX && files.some((f) => f.length > 0)) {
    for (const file of files) {
      if (photos.length >= VIGNETTES_MAX) break;
      const photo = file.shift();
      if (photo) photos.push(photo);
    }
  }
  return { photos };
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
    return surLesFavoris ? "No favorite photos yet" : "No portfolios followed yet";
  }
  if (!filtreActif) return `${total} ${nom(total)}`;
  if (visibles === 0) {
    return `${surLesFavoris ? "No photos" : "No portfolios"} out of ${total}`;
  }
  return `${visibles} ${nom(visibles)} out of ${total}`;
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
  return `${nombre} new tattoo${nombre > 1 ? "s" : ""}`;
}
