import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CARTES_PAR_PAGE,
  libelleStyle,
  stylesAlphabetiques,
} from "@/config/tatouage";
import { AucunResultat } from "@/components/AucunResultat";
import { chargerStyleVille as charger } from "@/lib/style-ville";
import { adresseDuSite } from "@/lib/site";
//  ⚠️ `villeAffichee`, PAS `nomVilleCourt` (passe nº 114) : les
//  titres et le fil d'Ariane disent « Lyon », jamais « Lyon 1er ».
//  L'ADRESSE, elle, reste /tatouage/realisme/lyon-1er — elle est
//  indexée et partagée, et `villeSlug` ne passe jamais par ici.
import { villeAffichee } from "@/lib/adresse";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { GrilleTatoueurs } from "@/components/GrilleTatoueurs";

/**
 * LES PAGES STYLE + VILLE — « Tatoueurs réalisme à Lyon »
 * ========================================================
 * Adresse : /tatouage/<style>/<ville>  (ex. /tatouage/realisme/lyon)
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
  const { style, ville, tatoueurs, demonstration, total } = await charger(
    styleSlug,
    villeSlug,
    page
  );
  if (!style || !ville) return { title: "Page introuvable" };

  const titre = `Tatoueurs ${libelleStyle(style).toLowerCase()} à ${villeAffichee(ville.nom)}`;
  const base = `${adresseDuSite()}/tatouage/${style}/${villeSlug}`;
  const dernierePage = Math.max(Math.ceil(total / CARTES_PAR_PAGE), 1);
  const adressePage = (n: number) => (n <= 1 ? base : `${base}?page=${n}`);
  return {
    // LA PAGE 2 PORTE SON NUMÉRO : deux pages de résultats ne doivent
    // pas se présenter aux moteurs sous le même titre.
    title: page > 1 ? `${titre} — page ${page}` : titre,
    description:
      `${titre} : compare les portfolios Instagram des tatoueurs ` +
      `spécialisés en ${libelleStyle(style).toLowerCase()}.`,
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
  const { style, ville, tatoueurs, total } = await charger(
    styleSlug,
    villeSlug,
    page
  );
  if (!style || !ville) notFound();

  const nomVille = villeAffichee(ville.nom);
  const libelle = libelleStyle(style);
  const dernierePage = Math.max(Math.ceil(total / CARTES_PAR_PAGE), 1);
  const adressePage = (n: number) =>
    n <= 1
      ? `/tatouage/${style}/${villeSlug}`
      : `/tatouage/${style}/${villeSlug}?page=${n}`;

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
            Tatoueurs {libelle.toLowerCase()} à {nomVille}
          </h1>
          <p className="text-[15px] text-sombre-texte-doux">
            {total === 0
              ? "Aucun tatoueur pour l'instant."
              : `${total} portfolio${total > 1 ? "s" : ""} à comparer.`}
            {dernierePage > 1 ? ` Page ${page} sur ${dernierePage}.` : ""}
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
              IL N'Y RESTE DONC QUE « Chercher partout » — la mosaïque
              sans lieu, en gardant le style de la page. Sur le MOTEUR,
              rien ne change : les deux boutons y restent, parce que
              là-bas le rayon existe pour de bon (voir
              IndexTatoueurs). */
          <AucunResultat
            issues={[{ libelle: "Chercher partout", href: `/?style=${style}` }]}
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
            aria-label="Pages de résultats"
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
                ← Page précédente
              </Link>
            )}
            <span className="text-sm text-sombre-texte-doux">
              Page {page} sur {dernierePage}
            </span>
            {page < dernierePage && (
              <Link
                href={adressePage(page + 1)}
                rel="next"
                className="inline-flex items-center rounded-full px-4 min-h-[40px]
                           border border-sombre-bordure bg-sombre-carte text-sm
                           hover:border-primaire hover:text-primaire transition-colors"
              >
                Page suivante →
              </Link>
            )}
          </nav>
        )}

        {/* Le maillage interne : les autres styles de la même ville.
            C'est ce qui fait découvrir les pages voisines, aux
            visiteurs comme aux moteurs. */}
        <nav aria-label="Autres styles" className="mt-12">
          <h2 className="text-sm font-semibold text-sombre-texte-doux mb-3">
            Autres styles à {nomVille}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {stylesAlphabetiques()
              .filter((s) => s.slug !== style)
              .map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/tatouage/${s.slug}/${villeSlug}`}
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
