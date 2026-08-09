import { RECHERCHE_EMAIL } from "@/config/roswel";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * RECHERCHE DES ADRESSES E-MAIL DES PROSPECTS
 * -------------------------------------------
 * L'annuaire Sirene ne fournit JAMAIS d'adresse e-mail. La seule
 * source légitime est le site internet de l'entreprise : on lit sa
 * page d'accueil, et si rien n'y figure, UNE page de contact. Jamais
 * plus loin.
 *
 * ON NE DEVINE RIEN. Pas de « contact@ » fabriqué, pas de
 * « prenom.nom@ » reconstitué : une adresse inventée part en rebond,
 * et un taux de rebond élevé détruit la réputation d'expéditeur — donc
 * la délivrabilité de tous les messages suivants. Ne rien trouver est
 * un résultat acceptable : le prospect reste « e-mail à trouver » et
 * sera contacté à la main.
 *
 * On respecte le robots.txt de chaque site visité. Un site qui nous
 * refuse est passé, et c'est écrit dans le compte rendu.
 */

/* ------------------------------------------------------------------
 * Ce que renvoie la recherche
 * ------------------------------------------------------------------ */

export type LigneResumeEmail = {
  entreprise: string;
  action:
    | "adresse trouvée"
    | "sans site"
    | "site injoignable"
    | "aucune adresse"
    | "lecture refusée"
    | "erreur";
  detail: string;
};

export type CompteursEmail = {
  examines: number;
  trouves: number;
  sansSite: number;
  injoignables: number;
  sansAdresse: number;
  robotsInterdit: number;
  erreurs: number;
};

export type ResultatRechercheEmail = {
  ok: boolean;
  message: string;
  compteurs: CompteursEmail;
  resume: LigneResumeEmail[];
  /** Les identifiants traités par CET appel (à ne pas reprendre). */
  traites: string[];
  /** Prospects encore sans adresse après cet appel. */
  restants: number;
};

/* ------------------------------------------------------------------
 * Lecture d'une page
 * ------------------------------------------------------------------ */

/** Attente entre deux sites, pour ne bousculer personne. */
function attendre(millisecondes: number): Promise<void> {
  return new Promise((suite) => setTimeout(suite, millisecondes));
}

type PageLue =
  | { etat: "ok"; html: string }
  | { etat: "echec"; message: string };

/**
 * UNE page, avec un délai d'attente COURT : un site lent ne doit pas
 * bloquer tout le lot. Le contenu est tronqué — on cherche une
 * adresse, pas à archiver le site.
 */
async function lirePage(
  adresse: string,
  // ⚠️ Le robots.txt est servi en « text/plain » : exiger du HTML
  // reviendrait à ne JAMAIS le lire, donc à ignorer l'interdiction
  // qu'il exprime. Les vraies pages, elles, doivent bien être du HTML
  // (on ne va pas fouiller un PDF ou une image).
  htmlSeulement = true
): Promise<PageLue> {
  try {
    const reponse = await fetch(adresse, {
      headers: {
        "user-agent": RECHERCHE_EMAIL.userAgent,
        accept: htmlSeulement
          ? "text/html,application/xhtml+xml"
          : "text/plain,*/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(RECHERCHE_EMAIL.delaiSiteMs),
    });
    if (!reponse.ok) {
      return { etat: "echec", message: `le site a répondu « ${reponse.status} »` };
    }
    const type = reponse.headers.get("content-type") ?? "";
    if (htmlSeulement && type && !/text\/html|application\/xhtml/i.test(type)) {
      return { etat: "echec", message: `ce n'est pas une page web (${type})` };
    }
    const texte = await reponse.text();
    return { etat: "ok", html: texte.slice(0, RECHERCHE_EMAIL.tailleMaximumPage) };
  } catch (e) {
    const cause = e instanceof Error ? e.message : String(e);
    return {
      etat: "echec",
      message: /timeout|abort/i.test(cause) ? "site trop lent" : cause,
    };
  }
}

/* ------------------------------------------------------------------
 * robots.txt
 * ------------------------------------------------------------------ */

type ReglesRobots = { interdits: string[]; autorises: string[] };

/**
 * Lit et interprète le robots.txt d'un site. Volontairement simple :
 * on retient les règles du groupe qui nous concerne (« RoswelBot »,
 * sinon « * »). Un robots.txt absent ou illisible vaut AUTORISATION —
 * c'est la convention.
 */
async function lireRobots(origine: string): Promise<ReglesRobots> {
  const vide: ReglesRobots = { interdits: [], autorises: [] };
  // `false` : on accepte le texte brut — c'est ainsi qu'un robots.txt
  // est servi.
  const lue = await lirePage(`${origine}/robots.txt`, false).catch(() => null);
  if (!lue || lue.etat !== "ok") return vide;

  const groupes = new Map<string, ReglesRobots>();
  let agentsCourants: string[] = [];
  let dansGroupe = false;

  for (const brut of lue.html.split(/\r?\n/)) {
    const ligne = brut.split("#")[0].trim();
    if (!ligne) continue;
    const separateur = ligne.indexOf(":");
    if (separateur === -1) continue;
    const cle = ligne.slice(0, separateur).trim().toLowerCase();
    const valeur = ligne.slice(separateur + 1).trim();

    if (cle === "user-agent") {
      if (dansGroupe) {
        agentsCourants = [];
        dansGroupe = false;
      }
      agentsCourants.push(valeur.toLowerCase());
      if (!groupes.has(valeur.toLowerCase())) {
        groupes.set(valeur.toLowerCase(), { interdits: [], autorises: [] });
      }
      continue;
    }
    if (cle !== "disallow" && cle !== "allow") continue;

    dansGroupe = true;
    for (const agent of agentsCourants) {
      const regles = groupes.get(agent);
      if (!regles) continue;
      if (cle === "disallow" && valeur !== "") regles.interdits.push(valeur);
      if (cle === "allow" && valeur !== "") regles.autorises.push(valeur);
    }
  }

  const nous = RECHERCHE_EMAIL.userAgent.split(/[\s/]/)[0].toLowerCase();
  return groupes.get(nous) ?? groupes.get("*") ?? vide;
}

/**
 * Ce chemin nous est-il ouvert ? Règle standard : la directive la plus
 * LONGUE l'emporte, et « Allow » gagne à longueur égale.
 */
function cheminAutorise(regles: ReglesRobots, chemin: string): boolean {
  const correspond = (motif: string) =>
    chemin.startsWith(motif.replace(/\*$/, "")) ? motif.length : 0;
  const interdit = Math.max(0, ...regles.interdits.map(correspond));
  const autorise = Math.max(0, ...regles.autorises.map(correspond));
  return autorise >= interdit;
}

/* ------------------------------------------------------------------
 * Extraction et tri des adresses
 * ------------------------------------------------------------------ */

/** Contrôle de forme — le même que partout dans le projet. */
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REGEX_MAILTO = /href\s*=\s*["']\s*mailto:([^"'?>]+)/gi;
const REGEX_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * Les fausses adresses les plus courantes : un nom de fichier
 * ressemble à s'y méprendre à une adresse (« logo@2x.png »,
 * « photo@3x.jpg »). Sans ce garde-fou, on enregistrerait des images.
 */
const EXTENSIONS_FICHIER = [
  "png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico", "bmp",
  "css", "js", "mjs", "json", "xml", "html", "htm", "php",
  "woff", "woff2", "ttf", "eot", "otf", "mp4", "webm", "mp3",
];

/** Les quelques ruses d'affichage qui cassent une recherche naïve. */
function deprotegerHtml(html: string): string {
  return html
    .replace(/&#0*64;|&#x0*40;|&commat;/gi, "@")
    .replace(/&#0*46;|&#x0*2e;/gi, ".")
    .replace(/%40/gi, "@");
}

/**
 * Les adresses présentes dans une page : les liens « mailto: »
 * d'abord (ce sont les vraies adresses de contact), le texte ensuite.
 * L'ordre est conservé : la première trouvée sera la première
 * candidate.
 */
export function extraireAdresses(html: string): string[] {
  const propre = deprotegerHtml(html);
  const trouvees: string[] = [];
  const vues = new Set<string>();

  const ajouter = (brut: string) => {
    const adresse = decodeURIComponent(brut.trim())
      .replace(/^mailto:/i, "")
      .replace(/[.,;:)\]}'"<>]+$/, "")
      .toLowerCase();
    if (!EMAIL_OK.test(adresse) || adresse.length > 200) return;
    // « logo@2x.png » a la forme d'une adresse : ce n'en est pas une.
    const extension = adresse.split(".").pop() ?? "";
    if (EXTENSIONS_FICHIER.includes(extension)) return;
    if (vues.has(adresse)) return;
    vues.add(adresse);
    trouvees.push(adresse);
  };

  for (const trouve of propre.matchAll(REGEX_MAILTO)) ajouter(trouve[1]);
  for (const trouve of propre.matchAll(REGEX_EMAIL)) ajouter(trouve[0]);
  return trouvees;
}

/** Le domaine « utile » : sans www, réduit aux deux derniers niveaux. */
function domaineRacine(hote: string): string {
  const morceaux = hote.toLowerCase().replace(/^www\./, "").split(".");
  return morceaux.slice(-2).join(".");
}

export type TriAdresses = {
  retenue: string | null;
  autres: string[];
  ecartees: string[];
};

/**
 * LE TRI DES CANDIDATES
 * ---------------------
 * 1. On écarte les adresses techniques (webmaster@, no-reply@…).
 * 2. On écarte les domaines TIERS — typiquement l'agence web ou
 *    l'hébergeur qui a fait le site.
 * 3. On PRIVILÉGIE le domaine du site. Les messageries grand public
 *    (Gmail, Orange…) viennent ensuite : dans le bâtiment, c'est
 *    l'adresse que l'artisan affiche le plus souvent sur son propre
 *    site. (Réglable : RECHERCHE_EMAIL.accepterMessageriesGrandPublic.)
 * 4. Les candidates restantes sont conservées pour arbitrage.
 */
export function trierAdresses(
  adresses: string[],
  hoteSite: string
): TriAdresses {
  const racineSite = domaineRacine(hoteSite);
  const memeDomaine: string[] = [];
  const grandPublic: string[] = [];
  const ecartees: string[] = [];

  for (const adresse of adresses) {
    const [prefixe, domaine] = adresse.split("@");
    if (!domaine) continue;

    if (RECHERCHE_EMAIL.prefixesEcartes.includes(prefixe)) {
      ecartees.push(`${adresse} (adresse technique)`);
      continue;
    }
    const racine = domaineRacine(domaine);
    if (racine === racineSite) {
      memeDomaine.push(adresse);
      continue;
    }
    if (
      RECHERCHE_EMAIL.accepterMessageriesGrandPublic &&
      RECHERCHE_EMAIL.messageriesGrandPublic.includes(racine)
    ) {
      grandPublic.push(adresse);
      continue;
    }
    ecartees.push(`${adresse} (domaine tiers)`);
  }

  const classees = [...memeDomaine, ...grandPublic];
  return {
    retenue: classees[0] ?? null,
    autres: classees.slice(1),
    ecartees,
  };
}

/* ------------------------------------------------------------------
 * Le lien vers la page de contact
 * ------------------------------------------------------------------ */

const REGEX_LIEN = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

/** Sans accents ni majuscules, pour comparer des libellés de menu. */
function simplifier(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * LA page de contact — une seule, sur le MÊME site. On suit un lien
 * dont le libellé parle de contact ou de devis. Rien d'autre : deux
 * pages par entreprise, c'est la limite.
 */
export function lienContact(html: string, base: string): string | null {
  const origine = new URL(base);
  for (const trouve of html.matchAll(REGEX_LIEN)) {
    const href = trouve[1];
    const libelle = simplifier(trouve[2].replace(/<[^>]*>/g, " "));
    if (!libelle) continue;
    if (!RECHERCHE_EMAIL.motsLienContact.some((mot) => libelle.includes(mot))) {
      continue;
    }
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
    try {
      const cible = new URL(href, base);
      if (cible.hostname !== origine.hostname) continue; // jamais ailleurs
      if (cible.href.replace(/#.*$/, "") === base.replace(/#.*$/, "")) continue;
      return cible.href;
    } catch {
      continue;
    }
  }
  return null;
}

/* ------------------------------------------------------------------
 * La recherche complète
 * ------------------------------------------------------------------ */

type ProspectARegarder = {
  id: string;
  raison_sociale: string;
  site_internet: string | null;
  statut: string;
  notes_admin: string | null;
};

type ClientAdmin = ReturnType<typeof creerClientSupabaseAdmin>;

/** Les prospects SANS adresse, dans le périmètre des filtres courants. */
async function prospectsSansAdresse(
  supabase: ClientAdmin,
  filtres: { statut?: string; metier?: string; commune?: string }
): Promise<ProspectARegarder[]> {
  let requete = supabase
    .from("artisans_prospects")
    .select("id, raison_sociale, site_internet, statut, notes_admin")
    .is("email", null)
    .order("raison_sociale", { ascending: true })
    .limit(5000);

  if (filtres.statut && filtres.statut !== "tous") {
    requete = requete.eq("statut", filtres.statut);
  }
  if (filtres.metier && filtres.metier !== "tous") {
    requete = requete.contains("metiers", [filtres.metier]);
  }
  if (filtres.commune && filtres.commune !== "toutes") {
    requete = requete.eq("ville_code_insee", filtres.commune);
  }

  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProspectARegarder[];
}

/**
 * UN prospect : jusqu'à deux pages, puis tri des adresses trouvées.
 * Ne lève jamais : tout ressort dans le résultat.
 */
async function chercherSurLeSite(
  site: string,
  robotsParOrigine: Map<string, ReglesRobots>
): Promise<
  | { etat: "trouve"; tri: TriAdresses; pages: number }
  | { etat: "rien"; pages: number; ecartees: string[] }
  | { etat: "injoignable"; message: string }
  | { etat: "refuse"; message: string }
> {
  let depart: URL;
  try {
    depart = new URL(site);
  } catch {
    return { etat: "injoignable", message: "adresse de site illisible" };
  }
  if (!/^https?:$/.test(depart.protocol)) {
    return { etat: "injoignable", message: "adresse de site illisible" };
  }

  // robots.txt : lu UNE fois par site, puis gardé en mémoire.
  const origine = depart.origin;
  let regles = robotsParOrigine.get(origine);
  if (!regles) {
    regles = await lireRobots(origine);
    robotsParOrigine.set(origine, regles);
  }
  if (!cheminAutorise(regles, depart.pathname || "/")) {
    return {
      etat: "refuse",
      message: "le robots.txt du site interdit la lecture de cette page",
    };
  }

  const accueil = await lirePage(depart.href);
  if (accueil.etat !== "ok") {
    return { etat: "injoignable", message: accueil.message };
  }

  let pages = 1;
  let adresses = extraireAdresses(accueil.html);
  let ecarteesTotal: string[] = [];

  if (adresses.length > 0) {
    const tri = trierAdresses(adresses, depart.hostname);
    if (tri.retenue) return { etat: "trouve", tri, pages };
    ecarteesTotal = tri.ecartees;
  }

  // Rien d'exploitable : UNE page de contact, pas davantage.
  if (pages < RECHERCHE_EMAIL.pagesParSite) {
    const contact = lienContact(accueil.html, depart.href);
    if (contact) {
      const cible = new URL(contact);
      if (cheminAutorise(regles, cible.pathname)) {
        const page = await lirePage(contact);
        pages += 1;
        if (page.etat === "ok") {
          adresses = extraireAdresses(page.html);
          if (adresses.length > 0) {
            const tri = trierAdresses(adresses, depart.hostname);
            if (tri.retenue) return { etat: "trouve", tri, pages };
            ecarteesTotal = [...ecarteesTotal, ...tri.ecartees];
          }
        }
      }
    }
  }

  return { etat: "rien", pages, ecartees: ecarteesTotal };
}

/** Ajoute une ligne aux notes, sans jamais effacer ce qui s'y trouve. */
function completerNotes(existantes: string | null, ajout: string): string {
  const base = (existantes ?? "").trim();
  return base ? `${base}\n${ajout}` : ajout;
}

export async function chercherAdressesEmail({
  statut,
  metier,
  commune,
  ignorer = [],
}: {
  statut?: string;
  metier?: string;
  commune?: string;
  ignorer?: string[];
}): Promise<ResultatRechercheEmail> {
  const resume: LigneResumeEmail[] = [];
  const traites: string[] = [];
  const compteurs: CompteursEmail = {
    examines: 0,
    trouves: 0,
    sansSite: 0,
    injoignables: 0,
    sansAdresse: 0,
    robotsInterdit: 0,
    erreurs: 0,
  };

  let supabase: ClientAdmin;
  let candidats: ProspectARegarder[];
  try {
    supabase = creerClientSupabaseAdmin();
    candidats = await prospectsSansAdresse(supabase, { statut, metier, commune });
  } catch (e) {
    return {
      ok: false,
      message: `Base injoignable : ${e instanceof Error ? e.message : String(e)}`,
      compteurs,
      resume,
      traites,
      restants: 0,
    };
  }

  const dejaVus = new Set(ignorer);
  const aFaire = candidats.filter((p) => !dejaVus.has(p.id));
  const lot = aFaire.slice(0, RECHERCHE_EMAIL.prospectsParAppel);
  const robotsParOrigine = new Map<string, ReglesRobots>();

  for (const [index, prospect] of lot.entries()) {
    compteurs.examines += 1;
    traites.push(prospect.id);

    // Pas de site : rien à lire, ce sera à la main.
    if (!prospect.site_internet) {
      compteurs.sansSite += 1;
      resume.push({
        entreprise: prospect.raison_sociale,
        action: "sans site",
        detail: "aucun site internet connu — à chercher à la main",
      });
      continue;
    }

    // Temporisation entre deux SITES (jamais avant le premier).
    if (index > 0) await attendre(RECHERCHE_EMAIL.pauseMs);

    try {
      const resultat = await chercherSurLeSite(
        prospect.site_internet,
        robotsParOrigine
      );

      if (resultat.etat === "refuse") {
        compteurs.robotsInterdit += 1;
        resume.push({
          entreprise: prospect.raison_sociale,
          action: "lecture refusée",
          detail: resultat.message,
        });
        continue;
      }
      if (resultat.etat === "injoignable") {
        compteurs.injoignables += 1;
        resume.push({
          entreprise: prospect.raison_sociale,
          action: "site injoignable",
          detail: resultat.message,
        });
        continue;
      }
      if (resultat.etat === "rien") {
        compteurs.sansAdresse += 1;
        resume.push({
          entreprise: prospect.raison_sociale,
          action: "aucune adresse",
          detail:
            `${resultat.pages} page(s) lue(s), aucune adresse exploitable` +
            (resultat.ecartees.length > 0
              ? ` — écartées : ${resultat.ecartees.join(", ")}`
              : ""),
        });
        continue;
      }

      // ----- Une adresse retenue : on écrit -----
      const { retenue, autres } = resultat.tri;
      const aEcrire: Record<string, unknown> = {
        email: retenue,
        email_source: "site_web",
        // Trouvée, pas vérifiée : la date reste vide tant que rien
        // n'a confirmé que l'adresse reçoit vraiment du courrier.
        email_verifie_le: null,
      };
      // Le travail qui manquait est fait : le prospect rejoint la file.
      if (prospect.statut === "email_a_trouver") {
        aEcrire.statut = "non_contacte";
      }
      if (autres.length > 0) {
        aEcrire.notes_admin = completerNotes(
          prospect.notes_admin,
          `Autres adresses trouvées sur le site : ${autres.join(", ")}`
        );
      }

      const { error } = await supabase
        .from("artisans_prospects")
        .update(aEcrire)
        .eq("id", prospect.id);
      if (error) throw new Error(error.message);

      compteurs.trouves += 1;
      resume.push({
        entreprise: prospect.raison_sociale,
        action: "adresse trouvée",
        detail:
          `${retenue} (${resultat.pages} page(s) lue(s))` +
          (autres.length > 0
            ? ` — ${autres.length} autre(s) candidate(s) notée(s)`
            : ""),
      });
    } catch (e) {
      compteurs.erreurs += 1;
      resume.push({
        entreprise: prospect.raison_sociale,
        action: "erreur",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const restants = aFaire.length - lot.length;
  const aLaMain =
    compteurs.sansSite +
    compteurs.injoignables +
    compteurs.sansAdresse +
    compteurs.robotsInterdit;

  const message =
    `${compteurs.examines} prospect(s) examiné(s) — ` +
    `${compteurs.trouves} adresse(s) trouvée(s). ` +
    `${aLaMain} sans adresse, à contacter à la main ` +
    `(${compteurs.sansSite} sans site, ${compteurs.injoignables} injoignable(s), ` +
    `${compteurs.sansAdresse} site(s) lu(s) sans résultat, ` +
    `${compteurs.robotsInterdit} lecture(s) refusée(s))` +
    (compteurs.erreurs > 0 ? `, ${compteurs.erreurs} erreur(s)` : "") +
    ".";

  return { ok: true, message, compteurs, resume, traites, restants };
}
