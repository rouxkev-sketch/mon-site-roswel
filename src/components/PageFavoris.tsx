"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  libelleStyle,
  libelleTypeFiche,
  PORTRAIT_ROND,
} from "@/config/tatouage";
import {
  libelleNature,
  libelleRendu,
  NATURES_PHOTO,
} from "@/lib/photos-tatoueur";
import { IconeChevronBas } from "@/components/Icones";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { FenetreTatoueursSuivis } from "@/components/FenetreTatoueursSuivis";
import { FenetreFiche } from "@/components/FenetreFiche";
import { OngletsLigne } from "@/components/OngletsLigne";
import {
  CLE_FENETRE_FICHE,
  type ContexteFenetreFiche,
} from "@/components/RetourFenetreFiche";
import { useEtatFavori } from "@/lib/favoris-yokofolio";
import { ficheComplete } from "@/lib/fiche-complete";
import type { PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * MES FAVORIS — les photos gardées, et les tatoueurs suivis
 * ==========================================================
 * LES PHOTOS SONT LE CONTENU PRINCIPAL, en cartes : c'est ce qu'on
 * vient revoir. Les tatoueurs suivis vivent DERRIÈRE UN BOUTON, en
 * haut : une liste de noms n'a pas à disputer la place à des images.
 *
 * LE MENU DES STYLES NE MONTRE QUE LES STYLES ENREGISTRÉS, et c'est le
 * point important : les trente-huit styles du site dans un menu où
 * trente-cinq entrées ne donnent rien seraient inutilisables. La liste
 * est donc CALCULÉE à partir des photos gardées (voir `stylesGardes`),
 * chacune avec son nombre. Elle se réduit toute seule quand on retire
 * des photos.
 *
 * ⚠️ UNE PHOTO RETIRÉE NE DISPARAÎT PAS SOUS LE DOIGT. Le cœur
 * s'éteint, la carte PÂLIT et reste en place : on peut se raviser
 * d'un second toucher. Elle ne s'en va qu'au prochain affichage de la
 * page. Faire disparaître une image à l'instant où on la touche, c'est
 * empêcher de revenir sur une erreur — et donner l'impression que
 * quelque chose s'est cassé.
 */

/** LE MENU DES STYLES — « tous » compris. */
const TOUS = "tous";

export function PageFavoris({
  photos,
  suivis,
}: {
  photos: PhotoFavorite[];
  suivis: TatoueurSuivi[];
}) {
  const [style, setStyle] = useState(TOUS);
  const [nature, setNature] = useState(TOUS);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [fenetreSuivis, setFenetreSuivis] = useState(false);

  /* ================================================================
   * LA FICHE EN FENÊTRE SUPERPOSÉE (nº 143-6B)
   * ================================================================
   * Une carte de favori mène à une fiche EXACTEMENT comme une carte de
   * la mosaïque : sur le web, elle s'ouvre PAR-DESSUS la page, sans la
   * quitter. Elle naviguait, et l'on perdait sa place dans une liste
   * qu'on est précisément en train de parcourir.
   *
   * ⚠️ LA MÊME MÉCANIQUE QUE LA MOSAÏQUE, à la lettre — `pushState`
   * vers /tatoueur/…, le drapeau `data-fenetre-fiche` posé AVANT lui
   * (DefilementEnHaut le lit à ce moment-là), la note de rechargement,
   * et la fenêtre qui ne vit que tant que l'adresse est la sienne. Le
   * bouton « précédent » la referme sans une ligne de plus.
   *
   * ⚠️ UNE SEULE DIFFÉRENCE, et elle est dans la donnée : la mosaïque
   * tient déjà une fiche (allégée) pour chaque carte et ouvre donc
   * INSTANTANÉMENT ; ici, on n'a que le slug de la photo. On demande
   * la fiche — mais le survol l'a presque toujours déjà rapportée
   * (`ficheComplete` garde ses réponses), si bien que le clic ouvre
   * sans attendre. Base injoignable : on laisse le lien faire son
   * travail, et la page de fiche s'ouvre normalement.
   */
  const pathname = usePathname();
  const [ficheOuverte, setFicheOuverte] = useState<Tatoueur | null>(null);
  const [positionPage, setPositionPage] = useState(0);
  const [styleOuvert, setStyleOuvert] = useState("");
  const visible =
    ficheOuverte !== null && pathname === `/tatoueur/${ficheOuverte.slug}`;

  const ouvrirLaFiche = useCallback(
    async (slug: string, styleDeLaPhoto: string, adresse: string) => {
      const fiche = await ficheComplete(slug);
      if (!fiche) {
        //  Rien à montrer : on s'efface devant la navigation normale.
        window.location.assign(adresse);
        return;
      }
      try {
        const note: ContexteFenetreFiche = {
          slug,
          retour: window.location.pathname + window.location.search,
          defilement: window.scrollY,
        };
        sessionStorage.setItem(CLE_FENETRE_FICHE, JSON.stringify(note));
      } catch {
        // Stockage indisponible : le rechargement servira la page.
      }
      setPositionPage(window.scrollY);
      setStyleOuvert(styleDeLaPhoto);
      document.documentElement.setAttribute("data-fenetre-fiche", "1");
      window.history.pushState({ fenetreFiche: true }, "", `/tatoueur/${slug}`);
      setFicheOuverte(fiche);
    },
    []
  );

  const fermerLaFiche = useCallback(() => {
    document.documentElement.removeAttribute("data-fenetre-fiche");
    try {
      sessionStorage.removeItem(CLE_FENETRE_FICHE);
    } catch {
      // Sans importance : la note ne sert qu'au rechargement.
    }
    setFicheOuverte(null);
  }, []);

  /** LES STYLES RÉELLEMENT ENREGISTRÉS, avec leur nombre — dans
      l'ordre d'arrivée des photos (la plus récente d'abord), donc le
      style qu'on vient d'enrichir se présente en premier. */
  const stylesGardes = useMemo(() => {
    const compte = new Map<string, number>();
    for (const photo of photos) {
      compte.set(photo.style, (compte.get(photo.style) ?? 0) + 1);
    }
    return [...compte.entries()].map(([slug, nombre]) => ({
      slug,
      label: libelleStyle(slug),
      nombre,
    }));
  }, [photos]);

  /** LES NATURES PRÉSENTES — même règle. C'est elle qui décide s'il y
      a un choix à offrir : avec une seule nature enregistrée, il n'y a
      rien à choisir, et le sélecteur ne s'affiche pas. */
  const naturesGardees = useMemo(() => {
    const presentes = new Set(photos.map((photo) => photo.nature));
    return NATURES_PHOTO.filter((n) => presentes.has(n.slug));
  }, [photos]);
  const choixDeNature = naturesGardees.length > 1;

  const visibles = photos.filter(
    (photo) =>
      (style === TOUS || photo.style === style) &&
      (nature === TOUS || !choixDeNature || photo.nature === nature)
  );

  const styleChoisi = stylesGardes.find((entree) => entree.slug === style);

  return (
    <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-6 pb-16">
      {/* ---------- LE TITRE, ET LES SUIVIS ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="text-[22px] font-bold tracking-tight text-sombre-texte">
          Mes favoris
        </h1>

        {/* LE BOUTON DES SUIVIS — DISCRET, et il porte le compte.
            Capsule naturelle, sans rose : ce n'est pas l'action de la
            page, c'est une porte à côté. */}
        <button
          type="button"
          onClick={() => setFenetreSuivis(true)}
          className="inline-flex min-h-[40px] items-center rounded-full bg-sombre-carte
                     px-4 text-[13.5px] font-semibold text-sombre-texte
                     transition-colors hover:bg-sombre-eleve
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primaire"
        >
          Tatoueurs suivis · {suivis.length}
        </button>
      </div>

      {photos.length === 0 ? (
        /* L'ÉTAT VIDE — il dit quoi faire, en une ligne, et ouvre la
           porte. Pas de dessin, pas de paragraphe. */
        <div className="mt-8 rounded-2xl bg-sombre-carte px-5 py-8 text-center">
          <p className="text-[14.5px] leading-relaxed text-sombre-texte-doux">
            Touche le cœur d&apos;une photo pour la retrouver ici.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center
                       rounded-full bg-sombre-eleve px-6 text-[14.5px] font-semibold
                       text-sombre-texte transition-colors hover:bg-sombre-eleve-clair"
          >
            Explorer les portfolios
          </Link>
        </div>
      ) : (
        <>
          {/* ---------- LES DEUX FILTRES ---------- */}
          <div className="mt-5 flex flex-col gap-4">
            {/* LE MENU DÉROULANT DES STYLES — un CHAMP, donc : pas de
                contour, un fond, un chevron. Il s'ouvre par-dessus la
                grille (absolute), il ne la pousse pas. */}
            <div className="relative w-full max-w-[280px]">
              <button
                type="button"
                onClick={() => setMenuOuvert((ouvert) => !ouvert)}
                aria-expanded={menuOuvert}
                aria-haspopup="listbox"
                className={`flex w-full items-center gap-3 rounded-xl px-4 min-h-[48px]
                           text-left transition-colors ${
                             menuOuvert
                               ? "bg-sombre-eleve-clair"
                               : "bg-sombre-eleve hover:bg-sombre-eleve-clair"
                           }`}
              >
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-sombre-texte">
                  {styleChoisi ? styleChoisi.label : "Tous les styles"}
                </span>
                <span className="shrink-0 text-[13px] text-sombre-texte-doux">
                  {styleChoisi ? styleChoisi.nombre : photos.length}
                </span>
                <IconeChevronBas
                  taille={16}
                  classe={`shrink-0 transition-transform ${
                    menuOuvert
                      ? "rotate-180 text-primaire"
                      : "text-sombre-texte-doux"
                  }`}
                />
              </button>

              {menuOuvert && (
                <div
                  role="listbox"
                  aria-label="Filtrer par style"
                  className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden
                             rounded-xl bg-sombre-eleve-clair"
                >
                  <ul className="max-h-[280px] overflow-y-auto overscroll-contain">
                    {[{ slug: TOUS, label: "Tous les styles", nombre: photos.length }]
                      .concat(stylesGardes)
                      .map((entree) => (
                        <li key={entree.slug}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={style === entree.slug}
                            onClick={() => {
                              setStyle(entree.slug);
                              setMenuOuvert(false);
                            }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left
                                       transition-colors hover:bg-white/[0.06] ${
                                         style === entree.slug
                                           ? "bg-white/[0.04]"
                                           : ""
                                       }`}
                          >
                            <span className="min-w-0 flex-1 truncate text-[14.5px] text-sombre-texte">
                              {entree.label}
                            </span>
                            <span className="shrink-0 text-[12.5px] text-sombre-texte-doux">
                              {entree.nombre}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* RÉALISATIONS / FLASHS — ET SEULEMENT SI LES DEUX ONT ÉTÉ
                ENREGISTRÉS. L'affichage par défaut est « Tout », c'est
                à dire les deux MÉLANGÉS, dans l'ordre où ils ont été
                gardés. Une seule nature enregistrée : aucun sélecteur,
                puisqu'il n'y a rien à choisir. */}
            {choixDeNature && (
              <div className="max-w-[320px]">
                <OngletsLigne
                  ariaLabel="Réalisations ou flashs"
                  cleActive={nature}
                  surChoix={setNature}
                  options={[
                    { cle: TOUS, label: "Tout" },
                    ...naturesGardees.map((n) => ({
                      cle: n.slug,
                      label: libelleNature(n.slug) + "s",
                    })),
                  ]}
                />
              </div>
            )}
          </div>

          {/* ---------- LES PHOTOS, EN CARTES ---------- */}
          {visibles.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-sombre-carte px-4 py-6 text-center text-[14px] text-sombre-texte-doux">
              Rien d&apos;enregistré dans ce style.
            </p>
          ) : (
            <ul
              className="mt-6 grid gap-3 sm:gap-4
                         grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {visibles.map((photo) => (
                <CartePhotoFavorite
                  key={photo.id}
                  photo={photo}
                  surOuverture={ouvrirLaFiche}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {fenetreSuivis && (
        <FenetreTatoueursSuivis
          suivis={suivis}
          onFermer={() => setFenetreSuivis(false)}
        />
      )}

      {/* `key` : chaque ouverture repart de la photo du style gardé,
          jamais de l'état d'une fiche précédente. */}
      <FenetreFiche
        key={ficheOuverte?.id ?? "fermee"}
        tatoueur={visible ? ficheOuverte : null}
        styleRecherche={styleOuvert}
        positionGrille={positionPage}
        surFermeture={fermerLaFiche}
      />
    </main>
  );
}

/**
 * UNE PHOTO ENREGISTRÉE — la carte
 * =================================
 * Le même vocabulaire que la mosaïque : l'image en 4:5, le cœur DANS
 * l'image en haut à droite, et sous elle le nom du tatoueur puis la
 * légende de la photo. Toute la carte mène à la fiche, ouverte sur le
 * bon style (`?style=…`) : on retombe exactement sur ce qu'on
 * regardait.
 */
function CartePhotoFavorite({
  photo,
  surOuverture,
}: {
  photo: PhotoFavorite;
  /** WEB : ouvre la fiche PAR-DESSUS la page (nº 143-6B). */
  surOuverture: (
    slug: string,
    style: string,
    adresse: string
  ) => Promise<void>;
}) {
  //  ⚠️ ON LIT L'ÉTAT PARTAGÉ ICI AUSSI : retirer une photo la fait
  //  PÂLIR sans la faire disparaître (voir l'en-tête du fichier).
  const gardee = useEtatFavori("photo", photo.id, true);

  const adresse = `/tatoueur/${photo.tatoueurSlug}?style=${photo.style}`;

  /** Le survol demande la fiche d'avance : au clic, elle est là. */
  function surApproche() {
    if (document.documentElement.dataset.appareil === "mobile") return;
    void ficheComplete(photo.tatoueurSlug);
  }

  function auClic(evenement: React.MouseEvent) {
    //  Nouvel onglet, clic du milieu… : on ne touche à rien.
    if (
      evenement.metaKey ||
      evenement.ctrlKey ||
      evenement.shiftKey ||
      evenement.altKey
    ) {
      return;
    }
    //  SMARTPHONE : une vraie navigation, comme depuis la mosaïque —
    //  la fenêtre superposée est un geste d'écran large.
    if (document.documentElement.dataset.appareil === "mobile") return;
    evenement.preventDefault();
    void surOuverture(photo.tatoueurSlug, photo.style, adresse);
  }

  return (
    <li className="group relative flex flex-col" onPointerEnter={surApproche}>
      <div
        className={`relative w-full aspect-4/5 overflow-hidden bg-sombre-eleve
                    transition-opacity ${gardee ? "" : "opacity-40"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element --
            photo déposée par le tatoueur, servie telle quelle. */}
        <img
          src={photo.miniature}
          alt={`${libelleStyle(photo.style)} — ${photo.tatoueurNom}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {/* LE BADGE « Artiste » / « Salon » / « Studio » — angle BAS
            DROIT, dans l'image : le MÊME traitement qu'en mosaïque, au
            pixel près (pastille noire à 38 %, flou d'arrière-plan,
            hauteur fixe, texte blanc). Il manquait ici (passe nº 142),
            et deux cartes qui se ressemblent doivent dire la même
            chose — sinon on croit regarder deux objets différents. */}
        <span
          className="absolute bottom-2 right-2 inline-flex h-[22px]
                     items-center justify-center rounded-full
                     bg-black/38 backdrop-blur-md
                     px-2.5 text-[11.5px] font-semibold leading-none
                     text-white pointer-events-none select-none"
        >
          {libelleTypeFiche(photo.typeFiche, photo.etablissement)}
        </span>

        <div className="absolute top-2 right-2">
          <BoutonCoeurPhoto photoId={photo.id} enregistreeAuDepart />
        </div>
      </div>

      {/* SOUS LA CARTE — LE PORTRAIT, puis les deux lignes de texte :
          le calage exact de la mosaïque (nº 143-6A). Il manquait ici,
          et c'est justement l'élément qui dit DE QUI est la photo d'un
          coup d'œil, dans une page qui mélange les tatoueurs.
          Le repli des fiches sans portrait est le même partout :
          l'initiale, sur le fond élevé. */}
      <div className="pt-2.5 px-0.5 min-w-0 flex items-center gap-2.5">
        <span
          className="shrink-0 h-10 w-10 flex items-center justify-center
                     overflow-hidden rounded-full bg-sombre-eleve"
        >
          {photo.photoProfil ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               photo déposée par le tatoueur, servie telle quelle. */
            <img
              src={photo.photoProfil}
              alt=""
              loading="lazy"
              width={PORTRAIT_ROND}
              height={PORTRAIT_ROND}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="text-[13px] font-bold text-sombre-texte-doux"
            >
              {photo.tatoueurNom.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-sombre-texte leading-[19px]">
            <Link
              href={adresse}
              onClick={auClic}
              className="outline-none after:absolute after:inset-0 after:content-['']
                         focus-visible:underline"
            >
              {photo.tatoueurNom}
            </Link>
          </p>
          <p className="truncate text-[12.5px] text-sombre-texte-doux leading-[19px]">
            {[
              libelleStyle(photo.style),
              photo.rendu ? libelleRendu(photo.rendu) : "",
              photo.nature === "flash" ? libelleNature("flash") : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
    </li>
  );
}
