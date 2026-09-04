import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CARTES_PAR_PAGE,
  libelleStyle,
  stylesAlphabetiques,
} from "@/config/tatouage";
import { AucunResultat } from "@/components/AucunResultat";
//  §1 (nº 724) — le message d'indisponibilité du site, écrit une seule
//  fois (nº 278) : la version dégradée de cette page le reprend tel quel.
import { MESSAGE_INDISPONIBLE } from "@/lib/catalogue-demonstration";
import { chargerStyleVille as charger } from "@/lib/style-ville";
import { adresseDuSite } from "@/lib/site";
//  ⚠️ `villeAffichee`, PAS `nomVilleCourt` (passe nº 114) : les
//  titres et le fil d'Ariane disent « Lyon », jamais « Lyon 1er ».
//  L'ADRESSE, elle, reste /tattoo/realisme/lyon-1er — elle est
//  indexée et partagée, et `villeSlug` ne passe jamais par ici.
import { villeAffichee } from "@/lib/adresse";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { GrilleTatoueurs } from "@/components/GrilleTatoueurs";

/**
 * LES PAGES STYLE + VILLE — « Tatoueurs réalisme à Lyon »
 * ========================================================
 * Adresse : /tattoo/<style>/<ville>  (ex. /tattoo/realisme/lyon)
 *
 * Le pendant, pour les tatoueurs, des pages métier + ville des
 * artisans — et les mêmes règles :
 *  - style inconnu ou ville absente → page introuvable ;
 *  - page SANS résultat → `noindex` : elle reste affichable pour la
 *    personne qui cherche, mais n'entre jamais dans l'index des
 *    moteurs. Une page vide indexée abîme tout le site.
 *
 * Le rayon est volontairement absent ici : une page indexable doit
 * répondre à une question stable (« ce style, cette ville »). Le
 * rayon, lui, vit dans le moteur.
 */

type Parametres = { style: string; ville: string };

/**
 * ██ §1 (nº 687) — CETTE PAGE NE PRÉPARE PLUS SES VOISINES ██
 * ==================================================================
 * CE QUE LE BALAYAGE nº 681 A TROUVÉ, et c'était la pire page du site :
 * 6 322 ms. Sa requête la plus lente n'était pas une lecture de base —
 * c'était UNE AUTRE PAGE style + ville, à ~760 ms, et il y en avait
 * trois. La page préparait ses voisines.
 *
 * D'OÙ ELLES VIENNENT : le maillage « Autres styles à <ville> », plus
 * bas. Il rend un lien PAR STYLE sauf le courant. Au banc, quatre
 * styles font trois liens ; EN PRODUCTION, quarante et un styles en
 * font QUARANTE. Chaque lien préparé est un rendu serveur complet
 * d'une page qui interroge la base — quarante rendus pour un visiteur
 * qui en regardera un, ou aucun.
 *
 * ⚠️ LES LIENS NE BOUGENT PAS D'UN CARACTÈRE. Ce sont toujours de
 * vraies ancres, avec la même adresse et le même texte : cliquables,
 * suivables, indexables. C'est TOUT le maillage interne de cette page,
 * et c'est sa raison d'être — on ne touche pas à ce qui la fait
 * exister. Seule la PRÉPARATION À L'AVANCE est coupée.
 *
 * ⚠️ MÊME RÈGLE QU'À LA nº 656, ET POUR LA MÊME RAISON : préparer une
 * page que personne n'a demandée coûte un rendu serveur entier. Là-bas
 * c'étaient les cartes de style vers « /search »
 * (`PREPARER_LA_RECHERCHE_A_LAVANCE`), ici ce sont les styles voisins.
 *
 * ⚠️ LA PAGINATION GARDE SA PRÉPARATION, et c'est délibéré : deux liens
 * au plus, vers la page suivante ou précédente du MÊME couple, que le
 * visiteur qui fait défiler a toutes les chances de suivre. Deux
 * préparations utiles ne se comparent pas à quarante inutiles.
 */
const PREPARER_LES_STYLES_VOISINS = false;


type Recherche = Promise<{ page?: string }>;

/* La lecture — partagée avec l'image de partage du même segment, pour
   qu'un affichage de page ne fasse qu'UNE requête (voir
   lib/style-ville.ts). */

/** Le numéro de page demandé par l'adresse (?page=2), jamais moins de 1. */
function pageDemandee(valeur: string | undefined): number {
  return Math.max(Math.floor(Number(valeur)) || 1, 1);
}

/**
 * COMBIEN DE TEMPS CETTE PAGE RESTE EN CACHE
 * ===========================================
 * Une page « style + ville » répond à une question STABLE : elle ne
 * change que lorsqu'un tatoueur de cette ville publie, est validé ou
 * passe hors ligne. La recalculer à chaque passage de robot — et il y
 * en a des milliers, une page par style et par ville — n'apprend rien
 * à personne.
 *
 * CINQ MINUTES, et pas davantage : c'est le délai maximum entre la
 * validation d'une fiche par l'administrateur et son apparition ici.
 * Au-delà, la validation donnerait l'impression de ne pas marcher.
 *
 * ET CE N'EST QU'UN FILET : chaque décision de modération vide le
 * cache de ces pages sur-le-champ (voir src/lib/rafraichir.ts). Les
 * cinq minutes ne servent qu'aux changements qui passeraient à côté.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Parametres>;
  searchParams: Recherche;
}): Promise<Metadata> {
  const { style: styleSlug, ville: villeSlug } = await params;
  const page = pageDemandee((await searchParams).page);
  const { style, ville, tatoueurs, demonstration, total, indisponible } =
    await charger(styleSlug, villeSlug, page);
  /*  §1 (nº 724) — LA PANNE A SON PROPRE TITRE, et surtout son propre
      `robots`. Dire « Page introuvable » à un moteur pendant un
      incident, c'est l'inviter à désindexer une page qui existe. On
      annonce donc la page pour ce qu'elle est, et l'on demande de ne
      PAS l'indexer LE TEMPS DE LA PANNE — `follow` reste, les liens
      continuent d'être suivis. C'est le même couple que la page vide
      juste en dessous : aucun mécanisme neuf. */
  if (!style || (!ville && !indisponible)) return { title: "Page not found" };
  if (!ville) {
    return {
      title: `${libelleStyle(style)} tattoo artists`,
      robots: { index: false, follow: true },
    };
  }

  const titre = `${libelleStyle(style)} tattoo artists in ${villeAffichee(ville.nom)}`;
  const base = `${adresseDuSite()}/tattoo/${style}/${villeSlug}`;
  const dernierePage = Math.max(Math.ceil(total / CARTES_PAR_PAGE), 1);
  const adressePage = (n: number) => (n <= 1 ? base : `${base}?page=${n}`);
  return {
    // LA PAGE 2 PORTE SON NUMÉRO : deux pages de résultats ne doivent
    // pas se présenter aux moteurs sous le même titre.
    title: page > 1 ? `${titre} — page ${page}` : titre,
    description:
      `${titre}: compare the Instagram portfolios of tattoo artists ` +
      `specializing in ${libelleStyle(style).toLowerCase()}.`,
    alternates: {
      // CHAQUE PAGE EST SA PROPRE ADRESSE CANONIQUE — surtout pas la
      // page 1 : Google ne verrait plus jamais les suivantes.
      canonical: adressePage(page),
    },
    // LE FIL DE LA PAGINATION : « précédent » et « suivant » disent
    // aux moteurs que ces pages forment une SÉRIE.
    other: {
      ...(page > 1 ? { "link:prev": adressePage(page - 1) } : {}),
      ...(page < dernierePage ? { "link:next": adressePage(page + 1) } : {}),
    },
    // DEUX RAISONS DE NE PAS INDEXER :
    //  · JAMAIS de page vide dans Google ;
    //  · MODE DÉMONSTRATION — ces tatoueurs n'existent pas, et la page
    //    ne doit pas entrer dans l'index le temps que la base réponde.
    robots:
      tatoueurs.length === 0 || demonstration
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function PageStyleVille({
  params,
  searchParams,
}: {
  params: Promise<Parametres>;
  searchParams: Recherche;
}) {
  const { style: styleSlug, ville: villeSlug } = await params;
  const page = pageDemandee((await searchParams).page);
  const { style, ville, tatoueurs, total, indisponible } = await charger(
    styleSlug,
    villeSlug,
    page
  );
  /**
   * ██ §1 (nº 724) — UNE PANNE N'EST PAS UNE PAGE QUI N'EXISTE PAS ██
   * ------------------------------------------------------------------
   * LE DÉFAUT, MESURÉ : base éteinte, cette page rendait le contenu
   * « Page introuvable ». Ces pages-ci sont FAITES pour les moteurs de
   * recherche ; leur dire « cette adresse n'existe pas » pendant un
   * incident, c'est leur demander de la retirer de l'index — un coût
   * durable pour une panne passagère.
   * LA RÈGLE, DÉSORMAIS, ET ELLE TIENT EN DEUX LIGNES :
   *  · le STYLE est inconnu, ou la ville n'existe PAS (lecture réussie,
   *    aucune ligne) → « page introuvable », et c'est légitime ;
   *  · la base N'A PAS RÉPONDU → on ne conclut rien. La page se rend
   *    quand même — son titre, sa structure, son moteur — avec le
   *    message d'indisponibilité que le site emploie partout ailleurs
   *    (nº 278), et `noindex` le temps de l'incident (voir
   *    `generateMetadata`).
   * ⚠️ POURQUOI PAS UN 503, ET CE N'EST PAS UN OUBLI : dans cette
   * version de Next, une PAGE ne peut pas choisir son code de réponse.
   * Vérifié dans la documentation embarquée et dans l'API :
   * `next/navigation` n'expose que `notFound` (404), `forbidden` (403),
   * `unauthorized` (401) et les redirections — rien pour un 503. Le
   * seul canal serait le proxy, qui ne sait pas ce que la base a
   * répondu. On fait donc ce qui protège le mieux le référencement avec
   * ce qui existe : ne PAS dire « ça n'existe pas », et retirer la page
   * de l'index le temps de la panne — un `noindex` d'une heure se
   * rattrape, une désindexation pour 404 se paie des semaines.
   */
  if (!style || (!ville && !indisponible)) notFound();

  /*  §1 (nº 724) — LA VERSION DÉGRADÉE. La base n'a pas répondu : on
      rend la page — sa barre, son titre, sa structure — et l'on dit
      honnêtement ce qui se passe, avec le message que le site emploie
      partout ailleurs (`MESSAGE_INDISPONIBLE`, nº 278). Aucune donnée
      n'est inventée : ni nom de ville (on n'a que le morceau
      d'adresse), ni compte, ni carte.
      ⚠️ LE CADRE EST CELUI DE LA PAGE, RECOPIÉ NULLE PART : les mêmes
      classes de `<main>` que la branche normale, juste en dessous —
      largeur, marges et rythme partagés (piège nº 378).
      ⚠️ LE MOTEUR N'EMPORTE QUE LE STYLE : sans lecture de ville, il
      n'y a ni coordonnées ni nom à lui passer, et l'on n'en devine pas. */
  if (!ville) {
    return (
      <>
        <EnTeteTatouage criteresInitiaux={{ style }} />
        <main className="flex-1 mx-auto w-full max-w-[1760px] px-4 sm:px-6 pt-8 pb-16">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-6">
            <h1 className="text-[clamp(1.35rem,2.6vw,1.85rem)] font-bold leading-tight">
              {libelleStyle(style)} tattoo artists
            </h1>
            <p className="text-[15px] text-sombre-texte-doux">
              {MESSAGE_INDISPONIBLE}
            </p>
          </div>
        </main>
      </>
    );
  }

  const nomVille = villeAffichee(ville.nom);
  const libelle = libelleStyle(style);
  const dernierePage = Math.max(Math.ceil(total / CARTES_PAR_PAGE), 1);
  const adressePage = (n: number) =>
    n <= 1
      ? `/tattoo/${style}/${villeSlug}`
      : `/tattoo/${style}/${villeSlug}?page=${n}`;

  return (
    <>
      <EnTeteTatouage
        criteresInitiaux={{
          style,
          // Le moteur repart de CE lieu : son nom et ses coordonnées
          // suffisent — la recherche par rayon ne demande rien d'autre.
          lieu: {
            identifiant: `ville:${villeSlug}`,
            intitule: villeAffichee(ville.nom),
            contexte: "",
            adresse: null,
            ville: villeAffichee(ville.nom),
            code_postal: null,
            region: null,
            pays: null,
            code_pays: null,
            latitude: ville.latitude,
            longitude: ville.longitude,
            precision: "ville",
          },
        }}
      />

      <main className="flex-1 mx-auto w-full max-w-[1760px] px-4 sm:px-6 pt-8 pb-16">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mb-6">
          <h1 className="text-[clamp(1.35rem,2.6vw,1.85rem)] font-bold leading-tight">
            {libelle} tattoo artists in {nomVille}
          </h1>
          <p className="text-[15px] text-sombre-texte-doux">
            {total === 0
              ? "No tattoo artists yet."
              : `${total} portfolio${total > 1 ? "s" : ""} to compare.`}
            {dernierePage > 1 ? ` Page ${page} of ${dernierePage}.` : ""}
          </p>
        </div>

        {tatoueurs.length === 0 ? (
          /*  §2 (nº 307) — LE MÊME MESSAGE QUE LA MOSAÏQUE, à la lettre
              (composants/AucunResultat) : il était écrit ici une
              seconde fois, dans une autre formulation, et une
              correction posée dans l'un ne se voyait pas dans l'autre.
              §4 (nº 311) — ET IL N'Y RESTE QU'UNE SEULE ISSUE.
              ------------------------------------------------------
              « Élargir le rayon » est RETIRÉ de cette page. La nº 307
              l'y avait posé en le faisant pointer vers le moteur, au
              premier palier autour de la même ville ; c'était une
              pirouette. CETTE PAGE N'A PAS DE RAYON — c'est écrit en
              tête du fichier, et c'est ce qui fait d'elle une page
              indexable : « une question stable, ce style, cette
              ville ». Un bouton qui promet d'élargir un rayon qui
              n'existe pas trompe le visiteur.
              IL N'Y RESTE DONC QU'UNE SEULE ISSUE — la mosaïque sans
              lieu, en gardant le style de la page. Sur le MOTEUR, il y
              en a plusieurs, parce que là-bas le rayon existe pour de
              bon (voir IndexTatoueurs).
              §2 (nº 509) — ET SON LIBELLÉ DIT MAINTENANT OÙ ELLE MÈNE.
              ------------------------------------------------------
              « Chercher partout » a quitté le site : le propriétaire
              le trouvait brutal (du quartier au monde entier, sans
              rien entre les deux) et muet sur sa destination. Le
              moteur a désormais trois paliers — rayon, pays, monde ;
              CETTE page n'a que le dernier, et elle le NOMME :
              « Partout dans le monde ». Le lien ne change pas d'un
              caractère, seul le mot change.
              ⚠️ ET LE PALIER « PAYS » NE PEUT PAS EXISTER ICI : cette
              page ne connaît qu'un NOM de ville, jamais un lieu
              structuré — ni code ISO, ni coordonnées. On ne devine pas
              un pays à partir d'un nom de commune. */
          <AucunResultat
            issues={[
              { libelle: "Anywhere", href: `/?style=${style}` },
            ]}
          />
        ) : (
          // La page porte UN style : chaque carte montre la photo de CE
          // style-là, et la grille porte la FENÊTRE de fiche (grand
          // écran) — même mécanique que l'accueil.
          <GrilleTatoueurs tatoueurs={tatoueurs} styleRecherche={style} />
        )}

        {/* LA PAGINATION — de VRAIS liens, et c'est le point
            important : un bouton qui ne fait que changer un état
            n'existe pas pour un moteur de recherche, et les
            tatoueurs des pages 2 et suivantes ne seraient jamais
            découverts. Ici, chaque page a son adresse, son titre et
            son lien canonique. */}
        {dernierePage > 1 && (
          <nav
            aria-label="Result pages"
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {page > 1 && (
              <Link
                href={adressePage(page - 1)}
                rel="prev"
                className="inline-flex items-center rounded-full px-4 min-h-[40px]
                           border border-sombre-bordure bg-sombre-carte text-sm
                           hover:border-primaire hover:text-primaire transition-colors"
              >
                ← Previous page
              </Link>
            )}
            <span className="text-sm text-sombre-texte-doux">
              Page {page} of {dernierePage}
            </span>
            {page < dernierePage && (
              <Link
                href={adressePage(page + 1)}
                rel="next"
                className="inline-flex items-center rounded-full px-4 min-h-[40px]
                           border border-sombre-bordure bg-sombre-carte text-sm
                           hover:border-primaire hover:text-primaire transition-colors"
              >
                Next page →
              </Link>
            )}
          </nav>
        )}

        {/* Le maillage interne : les autres styles de la même ville.
            C'est ce qui fait découvrir les pages voisines, aux
            visiteurs comme aux moteurs. */}
        <nav aria-label="Other styles" className="mt-12">
          <h2 className="text-sm font-semibold text-sombre-texte-doux mb-3">
            Other styles in {nomVille}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {stylesAlphabetiques()
              .filter((s) => s.slug !== style)
              .map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/tattoo/${s.slug}/${villeSlug}`}
                  //  §1 (nº 687) — le lien reste, sa préparation part.
                  prefetch={PREPARER_LES_STYLES_VOISINS}
                  className="inline-flex items-center rounded-full px-3.5 min-h-[34px]
                             border border-sombre-bordure bg-sombre-carte text-sm
                             text-sombre-texte-doux hover:border-primaire
                             hover:text-primaire transition-colors"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </>
  );
}
