import { domaineDuSite } from "@/lib/domaine";

/**
 * LES LIENS D'UNE FICHE — leur nature, lue dans l'adresse
 * ========================================================
 * DEUX CHAMPS, DEUX RÉALITÉS (passe nº 102). Beaucoup de tatoueurs
 * n'ont pas de site : ils ont un LINKTREE ou un BEACONS, la
 * page-sommaire qui rassemble leurs comptes et leur prise de
 * rendez-vous. Beaucoup d'autres ont LES DEUX. Ils partageaient un
 * seul champ, « Site web, Linktree ou Beacons » — ce qui obligeait
 * ces derniers à en sacrifier un. Ce sont désormais deux champs, deux
 * colonnes, deux lignes sur la fiche publique.
 *
 * LA RECONNAISSANCE PORTE SUR LE DOMAINE, pas sur l'adresse entière :
 * « linktr.ee/moi » et « www.linktree.com/moi » comptent tous les
 * deux, mais « mon-site.fr/mon-linktree » reste un site — sinon le
 * mot suffirait à changer l'étiquette, et n'importe quel chemin
 * pourrait mentir sur la nature du lien.
 */

/** Les trois écritures vivantes de Linktree, et les deux de Beacons.
    ⚠️ DÉCLARÉS ICI, EN TÊTE : `libelleDuLien` s'en sert juste en
    dessous, et une constante qui vit plus bas que son premier usage
    finit toujours par se faire déplacer par erreur. */
const DOMAINES_LINKTREE = ["linktr.ee", "linktree.com", "www.linktree.com"];
const DOMAINES_BEACONS = ["beacons.ai", "beacons.page"];

export function estLinktree(adresse: string | null | undefined): boolean {
  if (!adresse) return false;
  const domaine = domaineDuSite(adresse).toLowerCase();
  return DOMAINES_LINKTREE.some(
    (connu) => domaine === connu || domaine.endsWith(`.${connu}`)
  );
}

/**
 * CE QUE LE LIEN AFFICHE SUR LA FICHE PUBLIQUE.
 * · Linktree → « Linktree », Beacons → « Beacons » : le NOM DU
 *   SERVICE, parce que c'est ce que la personne cherche du regard, pas
 *   « linktr.ee/xxxx » ;
 * · tout le reste → le domaine (« ateliercorvus.fr »).
 * ⚠️ BEACONS A REJOINT LA LISTE à la passe nº 102, quand la page de
 *   liens a pris son propre champ : sans lui, un Beacons se serait
 *   affiché « beacons.ai » — le nom du service, écrit à l'envers.
 */
export function libelleDuLien(adresse: string): string {
  if (estLinktree(adresse)) return "Linktree";
  const domaine = domaineDuSite(adresse).toLowerCase();
  if (
    DOMAINES_BEACONS.some(
      (connu) => domaine === connu || domaine.endsWith(`.${connu}`)
    )
  ) {
    return "Beacons";
  }
  return domaineDuSite(adresse);
}

/* =====================================================================
 * LES LIENS LIBRES DU FORMULAIRE (passe nº 116)
 * ===================================================================== */
/**
 * LA FORME D'UNE ADRESSE LIBRE — un nom de domaine avec son extension,
 * chemin libre : « tattoulyon.fr » suffit, le protocole s'ajoute tout
 * seul. C'est la règle historique du champ « Site web », désormais
 * partagée par les DEUX emplacements « Ajouter un lien » : l'URL est
 * vérifiée dans sa FORME, et rien d'autre — AUCUN service n'est
 * deviné, aucun titre n'est déduit (consigne de la passe nº 116 : le
 * titre appartient à la personne).
 */
export const FORME_URL_LIBRE =
  /^https?:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/\S*)?$/i;

/** Nettoie et valide une adresse libre.
    `undefined` = champ vide (pas une erreur en soi) ; `null` = forme
    refusée ; sinon l'adresse complète, protocole compris. */
export function normaliserUrlLibre(brut: string): string | null | undefined {
  const texte = brut.trim();
  if (!texte) return undefined;
  const avecProtocole = /^https?:\/\//i.test(texte) ? texte : `https://${texte}`;
  return FORME_URL_LIBRE.test(avecProtocole) ? avecProtocole : null;
}

/* =====================================================================
 * RECONNAÎTRE UN LIEN DANS LE FORMULAIRE
 * =====================================================================
 * ⚠️⚠️ CE QUE CETTE RECONNAISSANCE GARANTIT, ET CE QU'ELLE NE GARANTIT
 * PAS. C'est la question la plus importante de ce module, et la
 * réponse doit rester écrite ici, faute de quoi un libellé finira par
 * promettre ce que le code ne fait pas.
 *
 * ELLE GARANTIT DEUX CHOSES, ET DEUX SEULEMENT :
 *   1. que l'adresse est BIEN FORMÉE (une URL que le navigateur sait
 *      ouvrir) ;
 *   2. qu'elle pointe vers un DOMAINE RECONNU — instagram.com,
 *      tiktok.com, linktr.ee, beacons.ai — ou, à défaut, vers un site
 *      ordinaire.
 *
 * ELLE NE GARANTIT RIEN D'AUTRE. En particulier, elle NE DIT PAS :
 *   · que le compte EXISTE (personne n'a appelé Instagram) ;
 *   · qu'il est PUBLIC, ni actif, ni à jour ;
 *   · qu'il APPARTIENT à la personne qui le saisit.
 * Rien de tout cela n'est vérifiable sans appeler ces services — et
 * les appeler depuis le navigateur du tatoueur est impossible (ils
 * refusent les requêtes croisées), tandis que les appeler depuis le
 * serveur demanderait une clé d'API par service, une limite de débit,
 * et un traitement des pannes. Ce n'est pas le sujet de ce champ.
 *
 * ⚠️ D'OÙ LE VOCABULAIRE, CHOISI POUR NE PAS MENTIR :
 * on écrit « Adresse Instagram valide », JAMAIS « Instagram
 * connecté ». « Connecté » décrirait une liaison établie entre deux
 * comptes ; ici, il n'y a qu'une chaîne de caractères bien écrite.
 * La nuance n'est pas de la pédanterie : un tatoueur qui lit
 * « connecté » ne reviendra pas vérifier sa faute de frappe.
 * ===================================================================== */

/** Les services qu'on sait nommer à partir de leur domaine. */
export type ServiceLien =
  | "instagram"
  | "tiktok"
  | "linktree"
  | "beacons"
  | "site";

export type LienReconnu = {
  service: ServiceLien;
  /** Le nom du service, tel qu'on l'affiche. */
  nom: string;
  /** CE QUI IDENTIFIE LA PAGE — « @tonatelier » pour un réseau, le
      domaine pour un site. C'est la moitié utile du retour : elle
      permet de RELIRE ce qu'on a saisi sans déchiffrer une URL. */
  identite: string;
  /** L'adresse normalisée (https:// ajouté au besoin). */
  adresse: string;
};

/** Le domaine d'une adresse, sans « www. », ou "" si illisible. */
function domaineNu(adresse: string): string {
  const brute = adresse.trim();
  if (!brute) return "";
  const avecProtocole = /^https?:\/\//i.test(brute) ? brute : `https://${brute}`;
  try {
    return new URL(avecProtocole).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Le premier segment du chemin — le pseudo, sur tous ces services. */
function premierSegment(adresse: string): string {
  const avecProtocole = /^https?:\/\//i.test(adresse.trim())
    ? adresse.trim()
    : `https://${adresse.trim()}`;
  try {
    const chemin = new URL(avecProtocole).pathname.split("/").filter(Boolean);
    return chemin[0] ? decodeURIComponent(chemin[0]) : "";
  } catch {
    return "";
  }
}

/** Le pseudo affiché : toujours précédé d'un « @ », jamais deux. */
function pseudo(segment: string): string {
  const propre = segment.replace(/^@+/, "");
  return propre ? `@${propre}` : "";
}

/**
 * RECONNAÎTRE UNE ADRESSE — ou dire qu'on n'y arrive pas.
 * Rend `null` quand l'adresse est vide, mal formée, ou qu'elle
 * désigne un service reconnu SANS pseudo derrière (une adresse
 * « instagram.com » toute seule ne mène à personne).
 */
export function reconnaitreLien(
  adresse: string | null | undefined
): LienReconnu | null {
  const brute = (adresse ?? "").trim();
  if (!brute) return null;
  const domaine = domaineNu(brute);
  //  UN DOMAINE DOIT AVOIR UN POINT ET UNE EXTENSION : sans cela,
  //  « tonatelier » ou « mon site » passeraient pour des URL — le
  //  constructeur URL les accepte, un navigateur non.
  if (!domaine || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domaine)) return null;
  const normalisee = /^https?:\/\//i.test(brute) ? brute : `https://${brute}`;
  const segment = premierSegment(brute);

  const estDomaine = (liste: string[]) =>
    liste.some((connu) => domaine === connu || domaine.endsWith(`.${connu}`));

  if (estDomaine(["instagram.com"])) {
    if (!segment) return null;
    return { service: "instagram", nom: "Instagram", identite: pseudo(segment), adresse: normalisee };
  }
  if (estDomaine(["tiktok.com"])) {
    if (!segment) return null;
    return { service: "tiktok", nom: "TikTok", identite: pseudo(segment), adresse: normalisee };
  }
  if (estLinktree(brute)) {
    if (!segment) return null;
    return { service: "linktree", nom: "Linktree", identite: segment, adresse: normalisee };
  }
  if (estDomaine(DOMAINES_BEACONS)) {
    if (!segment) return null;
    return { service: "beacons", nom: "Beacons", identite: segment, adresse: normalisee };
  }
  //  TOUT LE RESTE EST UN SITE ORDINAIRE. On n'exige aucun chemin :
  //  « ateliercorvus.fr » est une adresse complète.
  return { service: "site", nom: "Site web", identite: domaine, adresse: normalisee };
}

/* =====================================================================
 * DEUX CHAMPS, DEUX FAMILLES DE SERVICES (passe nº 102)
 * =====================================================================
 * « Site web, Linktree ou Beacons » était UN SEUL champ. Il en fait
 * DEUX désormais — « Site web » d'un côté, « Linktree ou Beacons » de
 * l'autre — parce que ce ne sont pas la même chose pour le visiteur :
 * un site, on le visite ; une page de liens, on y cherche un bouton de
 * prise de rendez-vous. Beaucoup de tatoueurs ont les deux, et
 * l'ancien champ unique les forçait à en sacrifier un.
 *
 * ⚠️ CHAQUE CHAMP N'ACCEPTE QUE CE QU'IL ANNONCE. Coller un Linktree
 * dans « Site web » n'est pas une faute de frappe à corriger en
 * silence : c'est un malentendu sur ce qu'on demande. On le dit, et on
 * nomme le champ où l'adresse a sa place.
 * ===================================================================== */

/** Les quatre champs de liens du formulaire. */
export type ChampLien = "instagram" | "tiktok" | "site" | "pageDeLiens";

/** Ce que chaque champ accepte, et comment on le nomme quand il faut
    renvoyer quelqu'un vers le bon. */
const CHAMPS: Record<ChampLien, { nom: string; admis: ServiceLien[] }> = {
  instagram: { nom: "Instagram", admis: ["instagram"] },
  tiktok: { nom: "TikTok", admis: ["tiktok"] },
  site: { nom: "Site web", admis: ["site"] },
  pageDeLiens: {
    nom: "Linktree / Beacons",
    admis: ["linktree", "beacons"],
  },
};

export type EtatDuLien =
  /** Rien de saisi — un champ facultatif vide n'a rien à dire. */
  | { genre: "vide" }
  /** Trop court pour être jugé : on ne crie pas pendant la frappe. */
  | { genre: "en-cours" }
  /** Reconnu ET à sa place : on n'affiche QUE l'identité extraite. */
  | { genre: "bon"; identite: string }
  /** Refusé : une phrase courte, qui dit quoi faire. */
  | { genre: "faux"; phrase: string };

/**
 * L'ÉTAT D'UN CHAMP DE LIEN — la seule fonction que l'écran consulte.
 *
 * ⚠️ LE RETOUR EST VOLONTAIREMENT MAIGRE (passe nº 102). Il disait
 * « Adresse Instagram valide · @yoko.folio » : deux informations dont
 * la première est déjà écrite dans le champ juste au-dessus. On ne
 * garde que celle qu'on ne connaissait pas — l'identité extraite. Elle
 * seule permet de RELIRE ce qu'on a collé sans déchiffrer une URL.
 */
export function etatDuLien(saisi: string, champ: ChampLien): EtatDuLien {
  const propre = saisi.trim();
  if (!propre) return { genre: "vide" };
  //  TANT QU'IL N'Y A PAS DE POINT, l'adresse est forcément
  //  incomplète : afficher une croix au troisième caractère, c'est
  //  reprocher à quelqu'un de ne pas avoir fini d'écrire.
  if (!propre.includes(".")) return { genre: "en-cours" };

  const reconnu = reconnaitreLien(propre);
  const attendu = CHAMPS[champ];
  if (!reconnu) {
    return { genre: "faux", phrase: "Adresse incomplète ou mal écrite." };
  }
  if (!attendu.admis.includes(reconnu.service)) {
    //  ON NOMME LE CHAMP OÙ ELLE VA. Sans cela, « adresse refusée »
    //  laisse chercher une faute de frappe qui n'existe pas.
    const bonChamp = (Object.keys(CHAMPS) as ChampLien[]).find((cle) =>
      CHAMPS[cle].admis.includes(reconnu.service)
    );
    return {
      genre: "faux",
      phrase: bonChamp
        ? `Ça, c'est pour le champ « ${CHAMPS[bonChamp].nom} ».`
        : `Ce champ attend une adresse ${attendu.nom}.`,
    };
  }
  return { genre: "bon", identite: reconnu.identite };
}

