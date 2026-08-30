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
    console.warn("[conventions] catalogue non lu :", error.message);
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
