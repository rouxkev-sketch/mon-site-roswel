"use client";

import { useRef } from "react";
import Link from "next/link";
import { CLASSES_LIGNE_CLIQUABLE, PhotoRonde } from "@/components/BlocLieux";
import { IconeCoeur } from "@/components/Icones";
import {
  bandeDeTrois,
  groupesDeSuivis,
  libelleNouveautes,
  lignesDInformation,
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
    /*  §2 (nº 249) — LES CAPITALES ONT DISPARU : « MES SUIVIS » (le
        titre de section de la nº 245) est parti — c'est le TITRE de la
        page qui dit désormais « Mes suivis » (LigneResultats, comme la
        page de recherche). Et « TOUS LES SUIVIS » ne s'écrit plus
        quand il est SEUL : un unique groupe sous un titre qui dit déjà
        la même chose n'apprenait rien. Les titres de groupe ne
        reviennent que quand le classement de la nº 243 a quelque chose
        à dire — une session guest classe les artistes en « Cette
        semaine », « À venir », « Tous les suivis ». */
    <div data-section-suivis="" className="mt-4">
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
               des titres de l'onglet Profil. §2 (nº 249) — SEULEMENT
               quand il y a PLUSIEURS groupes : voir plus haut. */}
          {groupes.length > 1 && (
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
              {groupe.titre}
            </h2>
          )}
          {/*  34 px entre deux blocs d'artiste (nº 244-§2).
               §5 (nº 247) — UNE FICHE PAR LIGNE, PLEINE LARGEUR : les
               deux colonnes de la nº 245 sont ABANDONNÉES. Le format
               du bloc (nº 243/244) ne change pas d'un pixel ; c'est sa
               bande de vignettes qui prend la largeur gagnée.
               ⚠️ `minmax(0,1fr)` ET NON `1fr` — c'est le piège de la
               nº 228 : une colonne `1fr` se dimensionne à son contenu
               (un nom long, une adresse), et la page déborde en
               largeur. Avec le plancher à zéro, la colonne cède, et
               `scrollWidth` reste égal à `clientWidth`. */}
          <ul className="mt-5 grid gap-[34px] grid-cols-[minmax(0,1fr)]">
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
  const lignes = lignesDInformation(suivi);
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
        {/*  §4 (nº 247) — LE NOM NE BOUGE PAS, LES LIGNES S'AJOUTENT
             SOUS LUI. Le bloc de texte est calé EN HAUT
             (`justify-start`) dès qu'il y a plusieurs modes : centré,
             il aurait fait remonter le nom au-dessus du rond quand le
             texte grandit. C'est la règle de la nº 241, telle quelle —
             le rond est ancré en haut (`items-start` de
             CLASSES_LIGNE_CLIQUABLE, `shrink-0` de PhotoRonde), il ne
             bouge JAMAIS, et le texte ne dépasse jamais au-dessus de
             lui. Un seul mode : la boîte de 52 px centre comme avant,
             au pixel. */}
        <span
          className={`flex min-h-13 min-w-0 flex-1 flex-col ${
            lignes.length > 1 ? "justify-start" : "justify-center"
          }`}
        >
          <span className="truncate text-[15px] font-semibold text-sombre-texte">
            {suivi.nom}
          </span>
          {/*  §2 (nº 244) — la ligne d'information : 14 px, grise.
               §3 — L'URGENCE PAR LA TYPOGRAPHIE, JAMAIS PAR LA
               COULEUR : quand la session tombe dans les sept jours,
               LA DATE seule passe du gris au BLANC semi-gras — aucun
               rose, aucun vert, aucun rouge, aucun badge.
               §4 (nº 247) — UNE LIGNE PAR MODE, les unes sous les
               autres, dans l'ordre de `modesOrdonnes`. */}
          {lignes.map((info) => (
            <span
              key={info.cle}
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
            </span>
          ))}
          {/*  LE COMPTE DE NOUVEAUTÉS (§5, nº 243) — sur SA ligne : il
               ne parle d'aucun mode en particulier. */}
          {nouveautes && (
            <span
              data-nouveautes=""
              className="truncate text-[14px] leading-relaxed text-sombre-texte-doux"
            >
              {nouveautes}
            </span>
          )}
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

      {/* 3 · LA BANDE DE VIGNETTES — §6 (nº 249) : ELLE DÉFILE.
             Elle ne se tronque plus à ce qui tient dans la largeur :
             c'est une rangée à défilement NATIF avec accrochage
             (`scroll-snap`), à la manière des rangées d'Apple ou de
             Netflix — la refonte du carrousel de portfolio (nº 209-§7),
             appliquée telle quelle : AUCUNE translation calculée.
              · au doigt, TROIS vignettes pleines, et la suivante
                DÉPASSE du bord droit — c'est ce dépassement qui dit
                qu'il y en a d'autres ; le web garde ses nombres
                d'aujourd'hui (4, 5, puis 6), même dépassement ;
              · l'accrochage est au CENTRE (`snap-center`) : dès qu'on
                a fait défiler, la précédente dépasse à GAUCHE — la
                rangée n'est jamais coupée net aux deux bords (les
                extrémités, elles, s'alignent au bord : le navigateur
                borne) ;
              · à la souris, deux flèches (`pointer-fine:` — la
                variante EXISTE, déclarée dans globals.css nº 208-§2 :
                vérifié, pas supposé) font défiler par `scrollBy`, une
                position que le navigateur possède ;
              · le débordement vit DANS la rangée (`overflow-x-auto`),
                jamais dans la page : le piège de la nº 228 ne peut pas
                se réveiller.
             ⚠️ MOINS DE PHOTOS QUE LA LARGEUR : on n'affiche que ce
             qui existe, jamais un doublon, jamais une case comblée. */}
      {bande.photos.length > 0 && (
        <RangeeDeVignettes suivi={suivi} bande={bande} />
      )}
    </div>
  );
}

/**
 * LA RANGÉE QUI DÉFILE (§5 et §6, nº 249)
 * ==================================================================
 * Les largeurs de case disent le NOMBRE VISIBLE, pas un pixel choisi :
 * `(100% − les écarts) / N,4` montre N vignettes pleines et 0,4 de la
 * suivante — le dépassement demandé. Les écarts restent les 6 px de la
 * nº 244 (`gap-1.5`), les angles droits ceux de la nº 247.
 */
const CASE_RANGEE =
  "shrink-0 snap-center basis-[calc((100%-12px)/3.4)] " +
  "sm:basis-[calc((100%-18px)/4.4)] lg:basis-[calc((100%-24px)/5.4)] " +
  "xl:basis-[calc((100%-30px)/6.4)]";

function RangeeDeVignettes({
  suivi,
  bande,
}: {
  suivi: TatoueurSuivi;
  bande: ReturnType<typeof bandeDeTrois>;
}) {
  const zone = useRef<HTMLUListElement>(null);

  /** Une page de défilement — `scrollBy`, jamais une translation. */
  const defiler = (sens: 1 | -1) => {
    const cadre = zone.current;
    if (!cadre) return;
    cadre.scrollBy({ left: sens * cadre.clientWidth, behavior: "smooth" });
  };

  /*  §4 (nº 250) — LES FLÈCHES VIVENT HORS DE LA RANGÉE : elles ne
      recouvrent plus jamais une vignette. Plus de capsule pleine ni de
      flou porté — l'icône à taille naturelle, grise, qui s'éclaircit ;
      l'appui pose le voile blanc des lignes cliquables (nº 229). Elles
      se rangent au-dessus de la rangée, calées à droite — le coin des
      rangées d'Apple. `pointer-fine:` : la variante déclarée en
      nº 208-§2 — au doigt, elles n'existent pas, le glissement
      suffit. */
  const fleche = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Vignettes suivantes" : "Vignettes précédentes"}
      onClick={() => defiler(sens)}
      className="hidden pointer-fine:flex h-8 w-8 items-center justify-center
                 rounded-full text-sombre-texte-doux transition-colors
                 hover:bg-white/5 hover:text-sombre-texte active:bg-white/10"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={sens === 1 ? "M9.5 5.5 16 12l-6.5 6.5" : "M14.5 5.5 8 12l6.5 6.5"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  return (
    <div className="mt-2">
      {/*  Les deux flèches, dans la marge HAUTE de la rangée (jamais
           dessus). Cachées au doigt : aucune hauteur ajoutée là. */}
      <div className="hidden pointer-fine:flex justify-end gap-1 mb-1">
        {fleche(-1)}
        {fleche(1)}
      </div>
      <ul
        ref={zone}
        data-bande-suivi=""
        data-cas={bande.cas}
        /*  §2 (nº 244) — 6 px d'écart. Le défilement est NATIF, la
            barre est masquée (elle n'apprendrait rien), et
            l'accrochage au centre laisse dépasser les deux voisines
            (§4, nº 250 : c'est LE DÉPASSEMENT SEUL qui dit la suite —
            aucun dégradé, aucun voile de bord). */
        className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory
                   [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {bande.photos.map((photo) => (
          <li key={photo.id} className={CASE_RANGEE}>
            {/*  UNE VIGNETTE OUVRE LA PHOTO, et elle seule : la fiche
                 s'ouvre sur cette photo, dans son ensemble (style +
                 catégorie + rendu), exactement comme une carte de la
                 mosaïque le fait. */}
            <Link
              href={
                `/tatoueur/${suivi.slug}?style=${photo.style}` +
                `&nature=${photo.nature}` +
                (photo.rendu ? `&rendu=${photo.rendu}` : "") +
                `&photo=${photo.id}`
              }
              data-vignette-suivi={photo.id}
              //  §4 (nº 244) — au doigt, une BRÈVE baisse d'opacité,
              //  rien de plus. §5 (nº 247) — angles droits.
              className="relative block aspect-square overflow-hidden rounded-none
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
              {/*  §5 (nº 249) — LE CŒUR DES VIGNETTES AIMÉES, en bas à
                   droite, sur elles SEULES (le cas « aimees » — les
                   premières affichées, l'ordre de la nº 243). Le
                   glyphe est celui du cœur allumé des photos
                   (nº 141-6B) : blanc plein, et l'ombre du trait —
                   c'est la lisibilité du glyphe sur photo claire comme
                   sombre (la décision de la nº 141-6A), PAS un halo ni
                   un fond : aucun cercle, aucune plaque derrière lui.
                   §3 (nº 250) — SA JUSTE TAILLE : UN HUITIÈME de la
                   largeur de la vignette (`w-[12.5%]` — il suit la
                   vignette, il ne l'écrase jamais), tenu à 8 px des
                   deux bords (`bottom-2 right-2`). */}
              {bande.cas === "aimees" && (
                <span
                  data-coeur-aime=""
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2 right-2 w-[12.5%]"
                >
                  <IconeCoeur
                    taille={24}
                    classe="block h-auto w-full fill-white text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.55))]"
                  />
                </span>
              )}
            </Link>
          </li>
        ))}
        {/*  §6 (nº 249) — LA CASE « VOIR PLUS », au bout du glissement,
             dès que la source compte au moins dix vignettes : elle
             mène au portfolio entier de la fiche.
             §4 (nº 250) — L'ÉCRITURE DES ACTIONS INTERMÉDIAIRES
             (charte, nº 217-§7) : une CAPSULE À TAILLE NATURELLE,
             centrée dans sa case — le gris relevé qui s'éclaircit au
             survol, jamais de rose plein, jamais une case pleine. */}
        {bande.voirPlus && (
          <li className={CASE_RANGEE}>
            <span className="flex aspect-square items-center justify-center">
              <Link
                href={`/tatoueur/${suivi.slug}`}
                data-voir-plus=""
                className="inline-flex items-center justify-center rounded-full
                           bg-sombre-eleve px-3.5 min-h-[32px] text-[13px]
                           font-medium text-sombre-texte transition-colors
                           hover:bg-sombre-haut active:opacity-80"
              >
                Voir plus
              </Link>
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
