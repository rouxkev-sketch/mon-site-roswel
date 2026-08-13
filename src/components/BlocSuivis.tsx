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
 * L'ONGLET « TATOUEURS » DE MA SÉLECTION (passe nº 243)
 * ==================================================================
 * IL REMPLACE UNE FENÊTRE, et c'est le point de départ : les suivis
 * vivaient dans une fenêtre superposée qui défilait sur elle-même —
 * deux défilements imbriqués et une boîte dans une boîte, que la
 * charte interdit. La fenêtre est SUPPRIMÉE, code compris ; tout vit
 * dans la page, pleine largeur, un seul défilement.
 *
 * CE QUI SE DÉCIDE N'EST PAS ICI : les trois groupes, leur tri, le
 * choix des trois photos et les libellés vivent dans
 * `lib/selection-suivis`. Ce fichier POSE, il ne juge pas.
 *
 * ⚠️ AUCUNE VALEUR GRAPHIQUE INVENTÉE : la ligne d'identité reprend
 * `CLASSES_LIGNE_CLIQUABLE` (nº 232) et `PhotoRonde` (nº 224/227) —
 * les mêmes briques que les lignes d'équipe et d'adresse d'une fiche.
 * Ce qui est propre à cette passe (les titres de groupe, la bande de
 * trois) est posé nu, sans couleur ni graisse décidée ici : la passe
 * de finition tranchera.
 *
 * ⚠️ CE QUI EST CLIQUABLE, ET RIEN D'AUTRE (§3) : la ligne d'identité
 * ouvre la fiche — pastille comprise, elle est DANS le lien —, une
 * vignette ouvre la photo. La petite ligne de provenance, les titres
 * de groupe et le compte de nouveautés ne sont pas des boutons.
 */

export function BlocSuivis({
  suivis,
  favoris,
}: {
  suivis: TatoueurSuivi[];
  /** Les photos aimées — elles décident du premier cas du §4. */
  favoris: PhotoFavorite[];
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
    <div data-onglet-suivis="" className="mt-6 flex flex-col gap-10">
      {groupes.map((groupe) => (
        /*  ⚠️ UN GROUPE VIDE NE REND RIEN — ni titre, ni espace : il
             n'est même pas dans la liste (voir `groupesDeSuivis`). */
        <section key={groupe.cle} data-groupe-suivis={groupe.cle}>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sombre-texte-doux">
            {groupe.titre}
          </h2>
          <ul className="mt-4 flex flex-col gap-8">
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
    <div data-suivi={suivi.slug} className="flex flex-col gap-3">
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
          <span
            data-info-suivi=""
            //  ⚠️ LA DATE PROCHE EST MARQUÉE, PAS COLORÉE (§3) : cet
            //  attribut existe POUR la passe de finition — ici, aucune
            //  couleur, aucune graisse particulière.
            data-guest-proche={info.proche ? "" : undefined}
            className="truncate text-[13.5px] leading-relaxed text-sombre-texte-doux"
          >
            {info.texte}
            {nouveautes && (
              <>
                {info.texte ? " · " : ""}
                <span data-nouveautes="">{nouveautes}</span>
              </>
            )}
          </span>
        </span>
      </Link>

      {/* 2 · D'OÙ VIENNENT LES PHOTOS — une petite ligne, pas un lien. */}
      {bande.photos.length > 0 && (
        <p
          data-provenance={bande.cas}
          className="text-[12.5px] leading-relaxed text-sombre-texte-doux"
        >
          {bande.provenance}
        </p>
      )}

      {/* 3 · LA BANDE DE TROIS — trois colonnes égales, carrées.
             ⚠️ MOINS DE TROIS PHOTOS : on n'affiche que ce qui existe,
             jamais un doublon, jamais une case vide comblée. */}
      {bande.photos.length > 0 && (
        <ul data-bande-suivi="" className="grid grid-cols-3 gap-2">
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
                className="block aspect-square overflow-hidden rounded-lg bg-sombre-eleve"
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
