"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LARGEUR_SITE, libelleStyle } from "@/config/tatouage";
import { libelleNature, NATURES_PHOTO } from "@/lib/photos-tatoueur";
import { IconeChevronBas } from "@/components/Icones";
import { CarteTatoueur } from "@/components/CarteTatoueur";
import { BlocSuivis } from "@/components/BlocSuivis";
import { FenetreFiche } from "@/components/FenetreFiche";
import { OngletsLigne } from "@/components/OngletsLigne";
import {
  CLE_FENETRE_FICHE,
  type ContexteFenetreFiche,
} from "@/components/RetourFenetreFiche";
import { cleDEnsemble, RENDU_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import { ficheComplete } from "@/lib/fiche-complete";
import type { PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * MA SÉLECTION — les photos gardées, et les tatoueurs suivis
 * ==========================================================
 * §1 (nº 243) — DEUX ONGLETS, `Photos · Tatoueurs`, et PLUS DE
 * FENÊTRE. Les suivis vivaient derrière un bouton, dans une fenêtre
 * qui défilait sur elle-même : deux défilements imbriqués et une
 * boîte dans une boîte. Elle est supprimée, code compris. Tout vit
 * dans la page, pleine largeur, un seul défilement.
 *
 * ⚠️ L'ONGLET ACTIF VIT DANS L'ADRESSE (`?onglet=…`), comme tout le
 * reste depuis la nº 191 : une entrée d'historique par changement, et
 * le retour d'une fiche rend le bon onglet ET la bonne position (la
 * mémoire de défilement est indexée sur `chemin + recherche`, voir
 * MemoireNavigation — l'onglet en fait donc partie, sans une ligne
 * de plus).
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

/** Les deux onglets — leur clé voyage dans l'adresse. */
const ONGLET_PHOTOS = "photos";
const ONGLET_SUIVIS = "tatoueurs";

export function PageFavoris({
  photos,
  suivis,
  ongletInitial,
}: {
  photos: PhotoFavorite[];
  suivis: TatoueurSuivi[];
  /** L'onglet demandé par l'adresse, lu par le SERVEUR : la page naît
      dans le bon onglet, elle ne se corrige pas après coup. */
  ongletInitial?: string;
}) {
  const [style, setStyle] = useState(TOUS);
  const [nature, setNature] = useState(TOUS);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [onglet, setOnglet] = useState(
    ongletInitial === ONGLET_SUIVIS ? ONGLET_SUIVIS : ONGLET_PHOTOS
  );

  /**
   * L'ONGLET DANS L'ADRESSE — une entrée d'historique par changement.
   * ⚠️ `history.pushState`, PAS `router.push` : le routeur remonterait
   * la page en haut et rejouerait le rendu serveur pour un simple
   * changement d'onglet. On écrit l'adresse, on garde la place.
   * Le RETOUR (`popstate`) rejoue l'onglet écrit dans l'adresse.
   */
  const choisirOnglet = useCallback((suivant: string) => {
    setOnglet(suivant);
    const adresse =
      suivant === ONGLET_SUIVIS
        ? `${window.location.pathname}?onglet=${ONGLET_SUIVIS}`
        : window.location.pathname;
    window.history.pushState({ ongletSelection: suivant }, "", adresse);
  }, []);

  useEffect(() => {
    const auRetour = () => {
      const demande = new URLSearchParams(window.location.search).get("onglet");
      setOnglet(demande === ONGLET_SUIVIS ? ONGLET_SUIVIS : ONGLET_PHOTOS);
    };
    window.addEventListener("popstate", auRetour);
    return () => window.removeEventListener("popstate", auRetour);
  }, []);

  /**
   * §5 (nº 243) — LA DERNIÈRE VISITE S'ÉCRIT AU DÉPART, JAMAIS À
   * L'OUVERTURE : écrite à l'arrivée, elle effacerait les compteurs
   * avant qu'ils n'aient été lus. La valeur affichée vient du rendu
   * serveur (lue au montage) ; ici, on ne fait que MARQUER la visite
   * quand on s'en va — `pagehide` couvre la fermeture d'onglet et le
   * passage en arrière-plan sur iOS (`beforeunload` n'y est pas
   * fiable), le nettoyage de l'effet couvre la navigation interne.
   * `sendBeacon` : la requête survit au départ de la page.
   */
  useEffect(() => {
    let marquee = false;
    const marquer = () => {
      if (marquee) return;
      marquee = true;
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/selection/visite", new Blob([], { type: "text/plain" }));
        } else {
          void fetch("/api/selection/visite", { method: "POST", keepalive: true });
        }
      } catch {
        //  Sans importance : le compteur restera celui d'avant.
      }
    };
    window.addEventListener("pagehide", marquer);
    return () => {
      window.removeEventListener("pagehide", marquer);
      marquer();
    };
  }, []);

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
  /** ⚠️ IL COMPTE LES ENSEMBLES, PLUS LES PHOTOS (nº 213-§3d) : la
      page affiche un élément par ensemble — le sélecteur doit annoncer
      ce qu'il va montrer, pas ce qu'il contient. Trois ensembles de
      réalisme font « 3 », qu'ils portent trois photos ou trente. */
  const stylesGardes = useMemo(() => {
    const compte = new Map<string, Set<string>>();
    for (const photo of photos) {
      const vus = compte.get(photo.style) ?? new Set<string>();
      vus.add(cleEnsembleFavori(photo));
      compte.set(photo.style, vus);
    }
    return [...compte.entries()].map(([slug, vus]) => ({
      slug,
      label: libelleStyle(slug),
      nombre: vus.size,
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

  /**
   * LES ENSEMBLES À MONTRER — un par ensemble, dans l'ordre d'arrivée
   * (le plus récemment enrichi d'abord), CHACUN SOUS LA FORME D'UNE
   * FICHE (nº 213-§3b).
   * ⚠️ C'EST LA CARTE DE LA MOSAÏQUE qui les affiche désormais, sans
   * variante : elle attend un tatoueur et sa galerie. On lui donne
   * donc le tatoueur de l'ensemble, et pour galerie LES PHOTOS DE CET
   * ENSEMBLE — ce qui fait tomber juste, sans rien écrire de plus, la
   * photo montrée, le cœur (qui aime l'ensemble) et, en pleine largeur
   * au doigt, le défilement des photos.
   * Les champs qu'une carte ne lit pas (coordonnées, réseaux) sont
   * neutres : les inventer serait pire que les laisser vides.
   */
  const ensemblesVisibles = useMemo(() => {
    const vus = new Set<string>();
    const liste: Array<{
      cle: string;
      fiche: Tatoueur;
      photo: PhotoFavorite;
    }> = [];
    for (const photo of visibles) {
      const cle = cleEnsembleFavori(photo);
      if (vus.has(cle)) continue;
      vus.add(cle);
      const duMemeEnsemble = photos.filter(
        (autre) => cleEnsembleFavori(autre) === cle
      );
      liste.push({
        cle,
        photo,
        fiche: {
          id: photo.tatoueurId,
          nom: photo.tatoueurNom,
          slug: photo.tatoueurSlug,
          type_fiche: photo.typeFiche,
          etablissement: photo.etablissement,
          photo_profil: photo.photoProfil,
          ville_nom: photo.ville,
          ville_slug: "",
          region: photo.region,
          pays: photo.pays,
          code_pays: photo.codePays,
          latitude: 0,
          longitude: 0,
          styles: [photo.style],
          lien_instagram: "",
          photo_principale: photo.miniature,
          photos_styles: {},
          photos: [],
          publie: true,
          galerie: duMemeEnsemble.map((entree, rang) => ({
            id: entree.id,
            style: entree.style,
            rendu: entree.rendu,
            nature: entree.nature,
            url: entree.url,
            miniature: entree.miniature,
            ordre: rang,
          })),
        },
      });
    }
    return liste;
  }, [visibles, photos]);

  const styleChoisi = stylesGardes.find((entree) => entree.slug === style);

  return (
    /*  ⚠️ LA LARGEUR DE LA MOSAÏQUE (nº 213-§3a) : `LARGEUR_SITE` et
        les mêmes marges latérales que l'accueil — cette page montre
        les mêmes cartes, elle doit occuper le même espace. */
    <main
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pt-6 pb-16`}
    >
      {/* ---------- LE TITRE, ET LE SÉLECTEUR (nº 243-§1) ---------- */}
      {/* ⚠️ « MA SÉLECTION », ET PLUS « Mes favoris » (nº 145-§3) —
          le mot du site pour la pochette où l'on range ce qu'on
          veut retrouver. Même graisse, même taille. */}
      <h1 className="text-[22px] font-bold tracking-tight text-sombre-texte">
        Ma sélection
      </h1>

      {/* LE SÉLECTEUR DE LIGNE HABITUEL — celui d'Explorer / Filtres
          et de Profil / Portfolio (OngletsLigne), à deux positions. */}
      <div className="mt-5 max-w-[320px]">
        <OngletsLigne
          ariaLabel="Photos ou tatoueurs suivis"
          cleActive={onglet}
          surChoix={choisirOnglet}
          options={[
            { cle: ONGLET_PHOTOS, label: "Photos" },
            { cle: ONGLET_SUIVIS, label: "Tatoueurs" },
          ]}
        />
      </div>

      {/* ---------- L'ONGLET « TATOUEURS » (nº 243-§2 à §5) ---------- */}
      {onglet === ONGLET_SUIVIS && (
        <BlocSuivis suivis={suivis} favoris={photos} />
      )}

      {onglet === ONGLET_SUIVIS ? null : photos.length === 0 ? (
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
          {ensemblesVisibles.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-sombre-carte px-4 py-6 text-center text-[14px] text-sombre-texte-doux">
              Rien d&apos;enregistré dans ce style.
            </p>
          ) : (
            /*  ⚠️ LA GRILLE DE LA MOSAÏQUE, AU MOT PRÈS (nº 213-§3a) :
                mêmes colonnes à chaque largeur, même gouttière. Deux
                pages qui montrent les mêmes cartes ne peuvent pas les
                ranger autrement. */
            <ul
              className="mt-6 grid gap-x-4 gap-y-8
                         grid-cols-2 md:grid-cols-3 xl:grid-cols-4
                         2xl:grid-cols-5 3xl:grid-cols-6"
            >
              {ensemblesVisibles.map(({ cle, fiche, photo }) => (
                <li key={cle}>
                  {/*  ⚠️ LA CARTE DE LA MOSAÏQUE, SANS VARIANTE
                       (nº 213-§3b) — le même composant que la
                       recherche, donc les mêmes proportions, le même
                       cœur, le même sous-titre, et le défilement des
                       photos en pleine largeur. */}
                  <CarteTatoueur
                    tatoueur={fiche}
                    styleRecherche={photo.style}
                    renduRecherche={photo.rendu ?? ""}
                    surOuverture={() =>
                      void ouvrirLaFiche(
                        photo.tatoueurSlug,
                        photo.style,
                        `/tatoueur/${photo.tatoueurSlug}?style=${photo.style}` +
                          `&nature=${photo.nature}&rendu=${
                            photo.rendu ?? RENDU_PAR_DEFAUT
                          }`
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
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

/** LA CLÉ D'UN ENSEMBLE ENREGISTRÉ — celle du site (style, catégorie,
    rendu), plus LE TATOUEUR : deux artistes peuvent avoir chacun leur
    « réalisme · noir et gris », et ce sont deux ensembles. */
function cleEnsembleFavori(photo: PhotoFavorite): string {
  return `${photo.tatoueurSlug}·${cleDEnsemble(photo)}`;
}

