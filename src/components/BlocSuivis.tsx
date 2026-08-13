"use client";

import Link from "next/link";
import { CLASSES_LIGNE_CLIQUABLE, PhotoRonde } from "@/components/BlocLieux";
import {
  bandeDeTrois,
  groupesDeSuivis,
  libelleNouveautes,
  ligneDInformation,
} from "@/lib/selection-suivis";
import type { PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";

/**
 * LES ARTISTES SUIVIS, DANS « MA SÉLECTION » (nº 243, revu nº 245)
 * ==================================================================
 * IL REMPLACE UNE FENÊTRE, et c'est le point de départ : les suivis
 * vivaient dans une fenêtre superposée qui défilait sur elle-même —
 * deux défilements imbriqués et une boîte dans une boîte, que la
 * charte interdit. La fenêtre est SUPPRIMÉE, code compris ; tout vit
 * dans la page, pleine largeur, un seul défilement.
 * ⚠️ ET PLUS DERRIÈRE UN ONGLET NON PLUS (nº 245-§2) : le va-et-vient
 * `Photos · Tatoueurs` est supprimé, code compris. Cette section suit
 * les photos dans la page, et c'est le menu « Mes suivis » de la
 * barre qui décide de ce qu'elle montre.
 *
 * CE QUI SE DÉCIDE N'EST PAS ICI : les trois groupes, leur tri, le
 * choix des trois photos et les libellés vivent dans
 * `lib/selection-suivis`. Ce fichier POSE, il ne juge pas.
 *
 * ⚠️ AUCUNE VALEUR GRAPHIQUE INVENTÉE : la ligne d'identité reprend
 * `CLASSES_LIGNE_CLIQUABLE` (nº 232) et `PhotoRonde` (nº 224/227) —
 * les mêmes briques que les lignes d'équipe et d'adresse d'une fiche.
 * LA FINITION EST CELLE DE LA nº 244-§2 : titres de groupe aux
 * capitales des sections de fiche (13 px), 40 px de part et d'autre
 * des lignes de séparation, 34 px entre blocs, 12/8 px autour de la
 * ligne de provenance, bande à 6 px d'écart et rayon 10 — le rythme
 * du site, pas des valeurs inventées. L'urgence d'une date proche est
 * TYPOGRAPHIQUE (§3) : blanc semi-gras, jamais une couleur.
 *
 * ⚠️ CE QUI EST CLIQUABLE, ET RIEN D'AUTRE (§3) : la ligne d'identité
 * ouvre la fiche — pastille comprise, elle est DANS le lien —, une
 * vignette ouvre la photo. La petite ligne de provenance, les titres
 * de groupe et le compte de nouveautés ne sont pas des boutons.
 */

export function BlocSuivis({
  suivis,
  favoris,
  titre,
}: {
  suivis: TatoueurSuivi[];
  /** Les photos aimées — elles décident du premier cas du §4. */
  favoris: PhotoFavorite[];
  /** Le titre de la section, quand elle en porte un (nº 245-§2 : les
      suivis suivent les photos dans la page, ils se nomment). */
  titre?: string;
}) {
  const groupes = groupesDeSuivis(suivis);

  if (suivis.length === 0) {
    return (
      <p
        data-suivis-vide=""
        className="mt-8 rounded-2xl bg-sombre-carte px-5 py-8 text-center
                   text-[14.5px] leading-relaxed text-sombre-texte-doux"
      >
        Suis un artiste pour retrouver ici ce qu&apos;il publie.
      </p>
    );
  }

  return (
    <div data-section-suivis="" className="mt-10">
      {titre && (
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
          {titre}
        </h2>
      )}
      {groupes.map((groupe, rang) => (
        /*  ⚠️ UN GROUPE VIDE NE REND RIEN — ni titre, ni espace : il
             n'est même pas dans la liste (voir `groupesDeSuivis`).
             §2 (nº 244) — 40 px DE PART ET D'AUTRE de la ligne de
             séparation entre deux groupes (`mt-10 pt-10`), le rythme
             des sections de fiche depuis la nº 223. Le premier groupe
             n'a pas de ligne au-dessus de lui. */
        <section
          key={groupe.cle}
          data-groupe-suivis={groupe.cle}
          className={
            rang > 0 ? "mt-10 border-t border-sombre-bordure/60 pt-10" : ""
          }
        >
          {/*  §2 (nº 244) — LES CAPITALES DES SECTIONS DE FICHE
               (nº 223) : 13 px, grises, espacées — la classe exacte
               des titres de l'onglet Profil. */}
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
            {groupe.titre}
          </h2>
          {/*  34 px entre deux blocs d'artiste (nº 244-§2).
               §5 (nº 245) — DEUX COLONNES EN PLEINE LARGEUR : une
               grille à partir de `lg`, une seule colonne en dessous.
               ⚠️ `minmax(0,1fr)` ET NON `1fr` — c'est le piège de la
               nº 228 : une colonne `1fr` se dimensionne à son contenu
               (un nom long, une adresse), et la page déborde en
               largeur. Avec le plancher à zéro, la colonne cède, et
               `scrollWidth` reste égal à `clientWidth`. */}
          <ul
            className="mt-5 grid gap-x-8 gap-y-[34px]
                       grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            {groupe.suivis.map((suivi) => (
              <li key={suivi.id}>
                <BlocDUnSuivi suivi={suivi} favoris={favoris} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** LE BLOC D'UN ARTISTE — trois étages (§3). */
function BlocDUnSuivi({
  suivi,
  favoris,
}: {
  suivi: TatoueurSuivi;
  favoris: PhotoFavorite[];
}) {
  const info = ligneDInformation(suivi);
  const bande = bandeDeTrois(suivi, favoris);
  const nouveautes = libelleNouveautes(suivi.nouveautes);

  return (
    <div data-suivi={suivi.slug} className="flex flex-col">
      {/* 1 · LA LIGNE D'IDENTITÉ — UN SEUL LIEN, pastille comprise. */}
      <Link
        href={`/tatoueur/${suivi.slug}`}
        data-ligne-suivi=""
        className={CLASSES_LIGNE_CLIQUABLE}
      >
        <PhotoRonde
          source={suivi.photoProfil}
          //  Un suivi peut être un artiste comme un salon : le repli
          //  « lieu » porte le glyphe d'adresse, celui que la fiche
          //  emploie déjà pour un lieu sans photo.
          nature={suivi.modes.length > 0 ? "personne" : "lieu"}
        />
        <span className="flex min-h-13 min-w-0 flex-1 flex-col justify-center">
          <span className="truncate text-[15px] font-semibold text-sombre-texte">
            {suivi.nom}
          </span>
          {/*  §2 (nº 244) — la ligne d'information : 14 px, grise.
               §3 — L'URGENCE PAR LA TYPOGRAPHIE, JAMAIS PAR LA
               COULEUR : quand la session tombe dans les sept jours,
               LA DATE seule passe du gris au BLANC semi-gras — aucun
               rose, aucun vert, aucun rouge, aucun badge. */}
          <span
            data-info-suivi=""
            data-guest-proche={info.proche ? "" : undefined}
            className="truncate text-[14px] leading-relaxed text-sombre-texte-doux"
          >
            {info.avant}
            {info.date && (
              <>
                {info.avant ? " · " : ""}
                <span
                  data-date-guest=""
                  className={
                    info.proche ? "font-semibold text-sombre-texte" : ""
                  }
                >
                  {info.date}
                </span>
              </>
            )}
            {nouveautes && (
              <>
                {info.texte ? " · " : ""}
                <span data-nouveautes="">{nouveautes}</span>
              </>
            )}
          </span>
        </span>
      </Link>

      {/* 2 · D'OÙ VIENNENT LES PHOTOS — une petite ligne, pas un lien.
             §2 (nº 244) : 13 px, grise, 12 px sous la ligne d'identité
             (mt-3), 8 px au-dessus de la bande (son mt-2). */}
      {bande.photos.length > 0 && (
        <p
          data-provenance={bande.cas}
          className="mt-3 text-[13px] leading-relaxed text-sombre-texte-doux"
        >
          {bande.provenance}
        </p>
      )}

      {/* 3 · LA BANDE DE TROIS — trois colonnes égales, carrées.
             ⚠️ MOINS DE TROIS PHOTOS : on n'affiche que ce qui existe,
             jamais un doublon, jamais une case vide comblée. */}
      {bande.photos.length > 0 && (
        /*  §2 (nº 244) — 6 px d'écart, rayon 10 px. */
        <ul data-bande-suivi="" className="mt-2 grid grid-cols-3 gap-1.5">
          {bande.photos.map((photo) => (
            <li key={photo.id}>
              {/*  UNE VIGNETTE OUVRE LA PHOTO, et elle seule : la
                   fiche s'ouvre sur cette photo, dans son ensemble
                   (style + catégorie + rendu), exactement comme une
                   carte de la mosaïque le fait. */}
              <Link
                href={
                  `/tatoueur/${suivi.slug}?style=${photo.style}` +
                  `&nature=${photo.nature}` +
                  (photo.rendu ? `&rendu=${photo.rendu}` : "") +
                  `&photo=${photo.id}`
                }
                data-vignette-suivi={photo.id}
                //  §4 (nº 244) — au doigt, une BRÈVE baisse d'opacité,
                //  rien de plus : ni voile, ni contour, ni rose.
                className="block aspect-square overflow-hidden rounded-[10px]
                           bg-sombre-eleve transition-opacity active:opacity-75"
              >
                {/* eslint-disable-next-line @next/next/no-img-element --
                    photo déposée par le tatoueur, servie telle quelle. */}
                <img
                  src={photo.miniature}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
