/**
 * LE CATALOGUE DES CONVENTIONS — la lecture (passe nº 749)
 * ========================================================
 * La table `conventions` (yokofolio-conventions-et-independent.sql)
 * tient le CATALOGUE et les DEMANDES ensemble, sur le modèle exact de
 * `suggestions_style` : une ligne « acceptee » EST une entrée du menu
 * du mode Convention. Ce fichier est la lecture de ce catalogue — le
 * futur formulaire (nº 750 : menu « pays », puis les conventions de ce
 * pays) et la fiche publique (nº 753) lisent CES fonctions, jamais
 * leur propre version.
 *
 * ⚠️ LE CLIENT EST PASSÉ EN PARAMÈTRE, et c'est voulu : la même
 * lecture sert au NAVIGATEUR (le formulaire, avec le client anonyme —
 * la règle d'accès « les conventions acceptees sont publiques » lui
 * suffit) et au SERVEUR (pages, administration). Importer ici l'un des
 * fabricants de client aurait lié ce fichier à un seul des deux mondes
 * — celui du serveur ne s'importe pas côté navigateur. Le type décrit
 * la seule chaîne d'appels employée : tous les clients Supabase du
 * site s'y conforment.
 *
 * ⚠️ JAMAIS BLOQUANTE, comme le catalogue des styles (styles-ajoutes) :
 * base injoignable ou migration pas passée → liste vide, le formulaire
 * dira « aucune convention » au lieu de casser une page.
 */

import type { LieuTrouve } from "@/lib/geocodage/types";

/** Ce que rend une lecture de liste — la forme commune aux clients
    Supabase du site (navigateur, serveur, admin). */
type ReponseListe = {
  data: unknown[] | null;
  error: { message: string } | null;
};

/**
 * LE CLIENT, VU D'ICI : une seule porte, `from`. VOLONTAIREMENT
 * MINIMAL — décrire la chaîne complète (`select`→`eq`→`order`) dans ce
 * type faisait sombrer le compilateur dans les génériques de
 * supabase-js (« Type instantiation is excessively deep », TS2589,
 * mesuré sur le client du navigateur à la nº 749). La porte suffit
 * pour l'appelant ; la FORME de la chaîne est dite plus bas, à
 * l'endroit unique où on l'emprunte.
 */
export type ClientConventions = {
  from(table: string): unknown;
};

/** La chaîne d'appels que la lecture emprunte — la forme est posée par
    un transtypage LOCAL (une seule occurrence), jamais exposée. */
type RequeteConventions = {
  select(colonnes: string): {
    eq(
      colonne: string,
      valeur: string
    ): {
      order(
        colonne: string,
        options: { ascending: boolean }
      ): PromiseLike<ReponseListe>;
    };
  };
};

/**
 * UNE CONVENTION ACCEPTÉE — une entrée du menu.
 * La localisation (ville, région, point) a été posée par
 * l'administration à l'acceptation : c'est ELLE que l'enregistrement
 * d'un mode recopiera sur la ligne (nº 750), comme pour un salon lié.
 * `debut_le`/`fin_le` sont les dates DE LA CONVENTION elle-même,
 * facultatives — l'artiste renseigne les SIENNES sur son mode.
 */
export type ConventionAcceptee = {
  id: string;
  nom: string;
  slug: string | null;
  /** Deux lettres majuscules — la clé du menu « pays ». */
  code_pays: string;
  ville: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  debut_le: string | null;
  fin_le: string | null;
};

/**
 * LES CONVENTIONS ACCEPTÉES, toutes — le catalogue entier, trié par
 * nom. Le découpage par pays est l'affaire des deux fonctions pures
 * ci-dessous : UNE lecture, puis tout se fait en mémoire (le menu
 * change de pays sans nouvelle requête).
 * Rend une liste VIDE en cas d'erreur — jamais une exception.
 */
export async function chargerConventionsAcceptees(
  client: ClientConventions
): Promise<ConventionAcceptee[]> {
  const requete = client.from("conventions") as RequeteConventions;
  const { data, error } = await requete
    .select(
      "id, nom, slug, code_pays, ville, region, latitude, longitude, debut_le, fin_le"
    )
    .eq("etat", "acceptee")
    .order("nom", { ascending: true });
  if (error) {
    console.warn("[conventions] catalog not read:", error.message);
    return [];
  }
  //  UNE ACCEPTÉE SANS NOM OU SANS PAYS N'EST PAS UNE ENTRÉE DE MENU :
  //  l'administration pose le nom à l'acceptation, mais une ligne
  //  malformée ne doit pas produire une option vide (la même prudence
  //  que styles-ajoutes sur slug/label).
  return (data ?? []).flatMap((brut) => {
    const ligne = brut as Partial<ConventionAcceptee> | null;
    if (
      !ligne ||
      typeof ligne.id !== "string" ||
      typeof ligne.nom !== "string" ||
      !ligne.nom.trim() ||
      typeof ligne.code_pays !== "string" ||
      !ligne.code_pays.trim()
    ) {
      return [];
    }
    return [
      {
        id: ligne.id,
        nom: ligne.nom,
        slug: ligne.slug ?? null,
        code_pays: ligne.code_pays,
        ville: ligne.ville ?? null,
        region: ligne.region ?? null,
        latitude: ligne.latitude ?? null,
        longitude: ligne.longitude ?? null,
        debut_le: ligne.debut_le ?? null,
        fin_le: ligne.fin_le ?? null,
      },
    ];
  });
}

/**
 * ██ nº 756 — LES BORNES DU NOM, ÉCRITES UNE SEULE FOIS ██
 * ==================================================================
 * DEUX ÉCRANS ÉCRIVENT CE NOM, et ils doivent s'accorder au caractère :
 *  · L'ARTISTE le propose (« Convention missing? Let us know », nº 750) ;
 *  · L'ADMINISTRATION le CORRIGE à l'acceptation (nº 756) — c'est elle
 *    qui tranche du libellé du catalogue.
 * Deux bornes recopiées auraient fini par diverger : une demande
 * acceptable côté artiste, refusée côté administration, sans que rien
 * ne le dise. Elles vivent donc ici, avec le reste du catalogue.
 * ⚠️ PLUS LONG QU'UN NOM DE STYLE (40 à la nº 122), et c'est le motif
 * de la nº 750 : « Empire State Tattoo Expo » fait déjà 24 caractères,
 * et certaines conventions portent leur ville et leur millésime.
 */
export const NOM_CONVENTION_MINIMUM = 2;
export const NOM_CONVENTION_MAXIMUM = 80;

/**
 * LES PAYS DU MENU — ceux qui ont AU MOINS une convention acceptée
 * (règle nº 748-B1 : on ne propose jamais un pays vide), en codes à
 * deux lettres, sans doublon, de A à Z.
 * ⚠️ FONCTION PURE : la règle s'exécute au banc, sans base — et deux
 * rendus donnent le même ordre, sur le serveur comme au navigateur.
 */
export function paysDesConventions(
  conventions: ConventionAcceptee[]
): string[] {
  return [...new Set(conventions.map((c) => c.code_pays))].sort();
}

/**
 * LES CONVENTIONS D'UN PAYS, par ordre alphabétique de nom (règle
 * nº 748-B1). `localeCompare` en anglais explicite : l'ordre ne
 * dépend ni de la langue du navigateur ni de celle du serveur.
 */
export function conventionsDuPays(
  conventions: ConventionAcceptee[],
  codePays: string
): ConventionAcceptee[] {
  return conventions
    .filter((c) => c.code_pays === codePays)
    .slice()
    .sort((a, b) => a.nom.localeCompare(b.nom, "en"));
}

/**
 * LE NOM D'UN PAYS, EN ANGLAIS — « FR » → « France », « US » →
 * « United States », « JP » → « Japan ».
 * ⚠️ AUCUNE TABLE ÉCRITE À LA MAIN, et c'est la méthode déjà en place
 * dans le site (`nomFrancaisDuPays`, lib/geocodage) : `Intl.DisplayNames`
 * porte les données de langue du système — les deux cents pays sans
 * qu'on en recopie un seul.
 * ⚠️ EN ANGLAIS, ET C'EST LA RÈGLE DE CE MODE (conception nº 748-C) :
 * les libellés NOUVEAUX sont en anglais, le site le sera au lancement.
 * ⚠️ UN CODE INCONNU REND LE CODE : `of()` fait déjà cela, et c'est le
 * bon repli ici — une entrée de menu doit afficher quelque chose. Même
 * chose si la fonction n'existe pas (environnement trop ancien) :
 * jamais d'exception à l'affichage.
 */
let nomsDePays: Intl.DisplayNames | null | undefined;

export function nomDuPays(code: string): string {
  const propre = (code ?? "").trim().toUpperCase();
  if (!propre) return "";
  if (nomsDePays === undefined) {
    try {
      nomsDePays = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      nomsDePays = null;
    }
  }
  try {
    return nomsDePays?.of(propre) || propre;
  } catch {
    return propre;
  }
}

/**
 * LA LOCALISATION D'UNE CONVENTION, DANS LA FORME D'UN LIEU (nº 750).
 * ==================================================================
 * C'est la pièce qui fait que le mode Convention n'a RIEN de spécial
 * en aval : choisir une convention pose ce lieu dans le mode, et tout
 * ce qui SITUE un mode — `pointDuMode`, `colonnesDuLieu`,
 * l'enregistrement, la vue `zones_tatoueur` — continue de lire le même
 * champ que pour les trois autres genres. C'est le motif du salon lié
 * (« recopiée exprès », migration nº 26), appliqué au catalogue.
 *
 * ⚠️ SANS COORDONNÉES, PAS DE LIEU — et le mode restera incomplet
 * plutôt que d'enregistrer une présence que personne ne pourra trouver
 * sur une carte. Le cas ne devrait pas exister (l'administration pose
 * la ville et le point à l'acceptation, conception nº 748-E) ; s'il
 * survient, il se voit à l'écran au lieu de se taire.
 */
export function lieuDeLaConvention(
  convention: ConventionAcceptee
): LieuTrouve | null {
  const { latitude, longitude } = convention;
  if (latitude == null || longitude == null) return null;
  const pays = nomDuPays(convention.code_pays);
  return {
    identifiant: `convention:${convention.id}`,
    //  L'ÉTIQUETTE est la VILLE quand on la connaît — jamais le nom de
    //  la convention : `intitule` sert de repli de ville à la lecture
    //  publique (`villeDuMode`, nº 417), et y mettre « Mondial du
    //  Tatouage » ferait écrire ce nom à la place d'une ville.
    intitule: convention.ville ?? pays,
    contexte: [convention.ville, convention.region, pays]
      .filter(Boolean)
      .join(", "),
    //  ⚠️ PAS D'ADRESSE : une convention se dit par sa ville. Le hall
    //  d'exposition n'a pas à figurer sur une fiche.
    adresse: null,
    ville: convention.ville,
    code_postal: null,
    region: convention.region,
    pays,
    code_pays: convention.code_pays,
    latitude,
    longitude,
    precision: "ville",
  };
}
