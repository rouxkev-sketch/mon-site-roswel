import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  COOKIE_COLONNES,
  taillePageServie,
} from "@/lib/colonnes-mosaique";
import { cleCookieTexte, phototequeDuCookie } from "@/lib/vue-phototheque";
import { SURFACE_RECHERCHE } from "@/lib/surface-affichage";
import {
  metadonneesAccueil,
  RenduAccueil,
  type ParametresAccueil,
} from "../_accueil/rendu";

/**
 * ██ LA RECHERCHE, ET SON ADRESSE À ELLE — /recherche (nº 652) ██
 * ==================================================================
 * ██ §1 (nº 652) — ELLE A UN NOM, DÉSORMAIS ██
 * ------------------------------------------------------------------
 * CE QU'ELLE ÉTAIT : le JUMEAU DYNAMIQUE de l'accueil (nº 357), à
 * l'adresse « /accueil-recherche », que PERSONNE ne tapait — le proxy
 * y réécrivait « / » dès que l'adresse portait une requête, et la
 * barre du navigateur continuait d'afficher « / ».
 * CE QU'ELLE DEVIENT : une page à part entière, à « /recherche », vers
 * laquelle les trois fabricants d'adresse du site mènent désormais
 * (IndexTatoueurs, EnTeteTatouage, CarteStyle). L'ADRESSE VISIBLE
 * CHANGE PENDANT UNE RECHERCHE, et c'est la décision du propriétaire.
 * ⚠️ LE FILET RESTE : le proxy réécrit toujours « / » à requête vers
 * cette page (proxy.ts). Un lien déjà partagé — « /?style=… » — sert
 * donc exactement la même chose qu'avant, sans redirection ni erreur.
 * ⚠️ CE QUI NE CHANGE PAS : le rendu reste celui du SERVEUR (nº 203),
 * l'état vit toujours dans l'adresse (règle nº 328), et le cookie de
 * colonnes garde sa taille de page exacte (nº 226).
 *
 * L'ACCUEIL NU, lui, vit dans page.tsx : PRÉRENDU, régénéré
 * périodiquement — c'est la correction du verdict de la nº 356 (le
 * rendu dynamique est la cause signée des éjections de retour sur
 * Chrome iPhone). Ce jumeau reste dynamique : c'est le prix, connu et
 * dit, pour que les recherches gardent leur rendu serveur — leur tour
 * viendra aux étapes suivantes du chantier.
 */
export const dynamic = "force-dynamic";

/**
 * ██ §1 (nº 665) — CETTE PAGE N'EST JAMAIS GARDÉE EN RÉSERVE ██
 * ==================================================================
 * CE QUE C'EST. `unstable_dynamicStaleTime` est le réglage que Next 16
 * prévoit POUR UNE PAGE — pas pour tout le site — et il dit une seule
 * chose : COMBIEN DE SECONDES le routeur du navigateur a le droit de
 * garder les données de cette page pour les resservir sans redemander.
 * Zéro seconde : chaque navigation vers « /recherche » repart au
 * serveur avec les critères exacts de l'adresse cliquée.
 * (Le type l'exige entier et positif ou nul — build/segment-config.)
 *
 * ⚠️ CE N'EST PAS UNE RÉPARATION, C'EST UN VERROU, et je le dis plutôt
 * que de le laisser croire. MESURÉ au banc sur la compilation de la
 * nº 664, AVANT cette ligne : quatre navigations d'affilée vers
 * « /recherche » avec des critères différents — dont deux vers des
 * critères DÉJÀ VISITÉS — sont TOUTES reparties au serveur, la page
 * servie s'accordait à l'adresse à chaque fois, et la garde « PAGE EN
 * RETARD » ne s'est pas déclenchée une seule fois. La raison est dans
 * le moteur : sans réglage, Next fixe la conservation des pages
 * dynamiques à ZÉRO (`__NEXT_CLIENT_ROUTER_DYNAMIC_STALETIME`, valeur
 * par défaut 0 — build/define-env.js), et la clé de rangement d'un
 * segment de PAGE inclut la chaîne de requête (« a page segment's vary
 * path also includes the search string » — segment-cache/vary-path.js).
 * CE QUE LA LIGNE APPORTE, ET C'EST RÉEL : ce zéro-là est un DÉFAUT
 * GLOBAL, pas une garantie. Le jour où quelqu'un règle
 * `experimental.staleTimes.dynamic` dans next.config — le geste
 * d'optimisation le plus banal qui soit —, TOUTES les pages dynamiques
 * du site se mettent à se resservir de mémoire, et la recherche
 * redevient fausse sans que personne n'ait touché à la recherche.
 * Écrite ici, la règle voyage avec la page qu'elle protège.
 *
 * ⚠️ LES RETOURS NE SONT PAS CONCERNÉS, et ce n'est pas une opinion :
 * une navigation arrière ou avant lit la réserve EN IGNORANT la durée
 * de conservation. Le moteur passe `-1` au lieu de l'heure courante
 * pour court-circuiter le contrôle de fraîcheur, et l'écrit en toutes
 * lettres : « A back/forward navigation will disregard the stale time »
 * (client/components/segment-cache/bfcache.js). La position restituée
 * (nº 653, nº 661) ne voit donc rien passer.
 *
 * ⚠️ AUCUNE AUTRE PAGE N'EST RALENTIE : ce réglage est PAR PAGE (« Pages
 * only — not allowed in layouts »). L'accueil, les fiches, les pages
 * style + ville gardent leur réserve entière.
 *
 * ⚠️ IL VA AVEC `PREPARER_LA_RECHERCHE_A_LAVANCE = false` (nº 656), et
 * les deux ne font pas le même travail : celui-là interdit de remplir
 * la case À L'AVANCE, celui-ci interdit de la RELIRE APRÈS COUP.
 *
 * ██ §1 (nº 669) — CE VERROU NE FERME QU'UNE PORTE SUR DEUX ██
 * ------------------------------------------------------------------
 * JE CORRIGE ICI CE QUE LA nº 665 AFFIRME AU-DESSUS, parce que c'est
 * faux et que la phrase servirait de référence. Elle dit que ce réglage
 * commande « combien de secondes le routeur du navigateur a le droit de
 * garder les données de cette page ». Il n'en commande qu'UNE PARTIE.
 * LE NAVIGATEUR TIENT DEUX RÉSERVES, ET ELLES N'OBÉISSENT PAS AU MÊME
 * NOMBRE (vérifié dans le moteur, Next 16.2.10) :
 *  · LA RÉSERVE DE RETOUR (« BFCache ») — c'est CELLE-CI que le réglage
 *    commande : sa valeur arrive dans `computeDynamicStaleAt`
 *    (client/components/segment-cache/bfcache.js), et nulle part
 *    ailleurs. C'est aussi celle qu'un retour arrière lit EN IGNORANT
 *    la durée (le `-1` cité plus haut) ;
 *  · LA RÉSERVE DE SEGMENTS — celle qui range le contenu des pages —
 *    prend la sienne AILLEURS, et elle a un PLANCHER :
 *      `getStaleTimeMs = (s) => Math.max(s, 30) * 1000`
 *    (client/components/segment-cache/cache.js). TRENTE SECONDES AU
 *    MINIMUM, quoi que le serveur annonce — y compris zéro.
 * ⚠️ ET NOS RÉPONSES N'ANNONCENT RIEN DU TOUT : mesuré au banc, une
 * réponse de navigation de « /recherche » ne porte AUCUN en-tête
 * `x-nextjs-stale-time` (l'accueil, lui, porte « 300 »). Sans en-tête,
 * le moteur retombe sur `STATIC_STALETIME_MS`, soit CINQ MINUTES
 * (`getStaleAtFromHeader`, même fichier).
 * ⚠️ CE QUE ÇA NE PROUVE PAS, ET JE NE VEUX PAS QUE LA NOTE LE LAISSE
 * CROIRE : la nº 669 a rejoué DOUZE FOIS le scénario complet du
 * propriétaire au banc (accueil à cartes, clic style, clic fiche, deux
 * retours, second clic style), sur les deux appareils et à six
 * cadences, avec un serveur ralenti à 1,2 s — la page servie s'est
 * accordée à l'adresse à chaque fois et la garde n'a jamais parlé. La
 * brèche décrite ci-dessus EXISTE DANS LE MOTEUR ; elle n'a pas été
 * prise sur le fait. Rien n'a donc été corrigé à la nº 669, et c'est
 * délibéré (consigne du propriétaire : pas de correction sans
 * reproduction).
 */
export const unstable_dynamicStaleTime = 0;

/** La taille de page au cookie des colonnes (nº 226-§1) — la lecture
    qui vivait dans l'accueil quand il était dynamique. */
async function taillePageDeLaRequete(): Promise<number> {
  const magasin = await cookies();
  return taillePageServie(magasin.get(COOKIE_COLONNES)?.value);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ParametresAccueil>;
}): Promise<Metadata> {
  const base = await metadonneesAccueil(
    await searchParams,
    await taillePageDeLaRequete()
  );
  /*  ██ §1 (nº 652) — CETTE ADRESSE N'EST PAS INDEXÉE ██
      Une page de RÉSULTATS n'a rien à faire dans un moteur de
      recherche : ses combinaisons sont innombrables (style, ville,
      rayon, page, disposition…) et chacune ferait une adresse de plus,
      toutes en double de la même chose. `index: false` le dit.
      `follow: true`, en revanche, est nécessaire : les liens de cette
      page mènent aux FICHES, et celles-là doivent être trouvées — les
      interdire de suivi couperait le chemin qui y conduit.
      ⚠️ LE RESTE DES MÉTADONNÉES NE BOUGE PAS : titre, description et
      adresse canonique viennent toujours de l'écriture partagée
      (`metadonneesAccueil`), qui pointe vers l'accueil — c'est lui, la
      page publique, et c'est vers lui que les moteurs doivent renvoyer. */
  return { ...base, robots: { index: false, follow: true } };
}

export default async function PageRecherche({
  searchParams,
}: {
  searchParams: Promise<ParametresAccueil>;
}) {
  const params = await searchParams;
  const magasin = await cookies();
  return (
    <RenduAccueil
      params={params}
      taillePage={taillePageServie(magasin.get(COOKIE_COLONNES)?.value)}
      phototequeSansTexte={phototequeDuCookie(
        magasin.get(cleCookieTexte(SURFACE_RECHERCHE))?.value
      )}
      mosaiqueNue={false}
    />
  );
}
