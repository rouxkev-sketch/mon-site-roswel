"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { villeAffichee } from "@/lib/adresse";
import { libelleStyle, MARQUE_YOKOFOLIO } from "@/config/tatouage";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { CarrouselPortfolio } from "@/components/CarrouselPortfolio";
import { ContenuFiche } from "@/components/ContenuFiche";
import { galerieParStyles, ouvertureGalerie } from "@/lib/photo-tatoueur";
import { RENDU_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * LA FENÊTRE DE FICHE — L'ENVELOPPE, ET RIEN QUE L'ENVELOPPE
 * =============================================================
 * Depuis la GRILLE (web, ≥ 1024 px), cliquer une carte n'ouvre plus
 * une page : cette fenêtre se superpose, la grille reste visible
 * derrière un voile sombre.
 *
 * ⚠️ CE FICHIER NE DESSINE PLUS LE CONTENU D'UNE FICHE (passe nº 199).
 * Il en portait une COPIE COMPLÈTE — identité, adresse, site, horaires,
 * bio, réseaux, équipe, badges, signalement — et les deux exemplaires
 * s'étaient éloignés : le sélecteur « Profil / Portfolio » de la nº 197
 * n'était arrivé que dans la page. Ouvrir une fiche depuis la mosaïque
 * ne montrait donc pas la même chose que coller son adresse dans la
 * barre du navigateur. Désormais le contenu vient de `ContenuFiche`,
 * l'unique composant, celui-là même qu'affiche la page.
 *
 * CE QUI RESTE ICI, ET RIEN D'AUTRE :
 *  - LA FAÇON DE S'OUVRIR ET DE SE FERMER : le voile, la croix hors de
 *    la fenêtre, Échap, et le gel de la grille en arrière-plan ;
 *  - LA MISE EN PAGE de l'enveloppe — deux colonnes larges (photo à
 *    gauche, contenu à droite), une seule colonne étroite ;
 *  - LES BOUTONS POSÉS SUR LA PHOTO, dont la place est celle du web
 *    depuis la nº 198-§3 : le PARTAGE dans l'angle haut GAUCHE, le
 *    CŒUR dans l'angle haut DROIT ;
 *  - LE FIL D'ARIANE (nº 201) : la page n'en a pas (nº 200-§1 — on y
 *    arrive directement), la fenêtre en a un, et il appartient à
 *    l'ENVELOPPE : c'est le chemin de la grille qu'elle recouvre, pas
 *    du contenu de la fiche. TEXTE SEUL, posé dans le voile AU-DESSUS
 *    de la fenêtre, calé sur son bord gauche — le bandeau de la nº 200
 *    (une surface sombre sur un voile déjà sombre, indiscernable, et
 *    qui recouvrait le haut de la photo) est supprimé : aucun fond,
 *    aucun encadré. Et il ne DÉPLACE rien (nº 202) : hors du flux, il
 *    s'écrit vers le haut dans le voile — la fenêtre garde exactement
 *    le centrage et les dimensions d'avant la nº 200.
 *
 * LA PHOTO, elle aussi, est le composant de la page (`CarrouselPortfolio`) :
 * la fenêtre avait son propre carrousel, avec ses flèches, ses points et
 * son compteur — trois pièces qui n'avaient pas reçu la nº 198 (capsule
 * qui se replie, pagination façon Instagram). Un seul carrousel, donc.
 *
 * RESPONSIVE, COMME INSTAGRAM : la fenêtre suit la largeur du
 * NAVIGATEUR, pas l'appareil.
 *  - large (≥ 1024 px) : les deux colonnes, et la hauteur se borne
 *    d'elle-même pour que la photo 4:5 garde EXACTEMENT ses
 *    proportions — jamais de photo écrasée entre deux largeurs ;
 *  - étroite (fenêtre rétrécie sous 1024 px) : UNE colonne — la photo
 *    EN HAUT, pleine largeur, les informations EN DESSOUS, et c'est la
 *    fenêtre elle-même qui défile verticalement.
 *  Sur les vrais mobiles, rien ne change : la grille y navigue vers la
 *  page complète, cette fenêtre ne s'y ouvre pas.
 *
 * L'ADRESSE DU NAVIGATEUR se met à jour à l'ouverture (pushState vers
 * /tatoueur/nom — partage possible) : c'est la grille (GrilleTatoueurs)
 * qui pousse l'adresse, et la fenêtre ne s'affiche que tant que
 * l'adresse correspond — le bouton « précédent » du navigateur la
 * referme donc naturellement. La PAGE complète, elle, reste servie aux
 * arrivées directes (lien partagé, moteurs) : le référencement ne voit
 * que des pages.
 */
export function FenetreFiche({
  tatoueur,
  styleRecherche = "",
  renduRecherche = "",
  positionGrille = 0,
  surFermeture,
}: {
  /** La fiche à montrer — null : fenêtre fermée. */
  tatoueur: Tatoueur | null;
  /** Le style cherché dans la grille : la fenêtre s'ouvre sur SA photo
      (la même que la carte cliquée). */
  styleRecherche?: string;
  /** LE RENDU cherché (noir et gris, ou couleur) : la fenêtre s'ouvre
      alors sur une photo qui y correspond. */
  renduRecherche?: string;
  /** La position de défilement de la grille AU CLIC (capturée par la
      grille avant le pushState) : figée à l'ouverture, rendue à la
      fermeture. */
  positionGrille?: number;
  /** Referme (la grille fait alors machine arrière dans l'historique). */
  surFermeture: () => void;
}) {
  // LE PORTFOLIO ENTIER, GROUPÉ PAR STYLE — comme la page de fiche.
  // Le style cherché passe en premier (continuité exacte avec la carte
  // cliquée), et le rendu cherché décide de la photo d'ouverture.
  const ouverture = useMemo(
    () =>
      ouvertureGalerie(
        tatoueur ? galerieParStyles(tatoueur) : [],
        styleRecherche,
        renduRecherche
      ),
    [tatoueur, styleRecherche, renduRecherche]
  );
  const groupes = ouverture.groupes;

  /** LE STYLE AFFICHÉ — c'est une vignette de l'onglet « Portfolio »
      qui en change (nº 197-§4) ; la fenêtre est remontée à chaque
      ouverture (voir la clé dans GrilleTatoueurs), l'état repart donc
      toujours du bon style. */
  const [styleAffiche, setStyleAffiche] = useState(ouverture.style);
  /** LA SÉRIE OUVERTE (nº 204-§3) — catégorie + rendu d'une vignette
      touchée : le carrousel ne montre alors QUE cette galerie de
      dépôt. `null` à l'ouverture : le style entier, comme toujours. */
  const [serieOuverte, setSerieOuverte] = useState<{
    nature: string;
    rendu: string;
  } | null>(null);
  const [indice, setIndice] = useState(ouverture.indice);

  /** LES DEUX BOÎTES QUI DÉFILENT — la fenêtre entière quand elle est
      en une colonne, la colonne de droite quand elle est en deux. Un
      toucher sur une vignette les remonte toutes les deux : dans une
      fenêtre superposée, le défilement de la PAGE ne veut rien dire
      (le corps est gelé le temps de l'ouverture). */
  const fenetreRef = useRef<HTMLDivElement>(null);
  const colonneRef = useRef<HTMLDivElement>(null);

  const groupeAffiche =
    groupes.find((groupe) => groupe.slug === styleAffiche) ?? groupes[0];
  const photosDuStyleAffiche = serieOuverte
    ? (groupeAffiche?.photos ?? []).filter(
        (photo) =>
          photo.nature === serieOuverte.nature &&
          (photo.rendu ?? RENDU_PAR_DEFAUT) === serieOuverte.rendu
      )
    : (groupeAffiche?.photos ?? []);
  const n = photosDuStyleAffiche.length;

  const ouverte = tatoueur !== null;

  // LE CLAVIER : Échap referme, ← → naviguent (avec butées) — et le
  // défilement de la grille est bloqué tant que la fenêtre est là.
  // (Des effets de PONT vers le navigateur : aucun état React n'y est
  // écrit directement.)
  useEffect(() => {
    if (!ouverte) return;
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") {
        surFermeture();
      } else if (evenement.key === "ArrowRight") {
        setIndice((courant) => Math.min(courant + 1, n - 1));
      } else if (evenement.key === "ArrowLeft") {
        setIndice((courant) => Math.max(courant - 1, 0));
      }
    };
    window.addEventListener("keydown", surTouche);
    // FIGER LA GRILLE SANS PERDRE SA POSITION. Couper l'overflow de la
    // racine remettrait son défilement à zéro (la grille sauterait en
    // haut derrière le voile). On fige donc le CORPS en place, décalé
    // de la position DU CLIC (capturée par la grille : après le
    // pushState, le routeur déplace brièvement le défilement — le lire
    // ici donnerait n'importe quoi) — et on la rend à la fermeture.
    const position = positionGrille;
    const corps = document.body.style;
    corps.position = "fixed";
    corps.top = `-${position}px`;
    corps.left = "0";
    corps.right = "0";
    corps.width = "100%";
    return () => {
      window.removeEventListener("keydown", surTouche);
      corps.position = "";
      corps.top = "";
      corps.left = "";
      corps.right = "";
      corps.width = "";
      // « instant » : le site déclare un défilement doux global — sans
      // lui, la restitution serait une animation visible.
      window.scrollTo({ top: position, left: 0, behavior: "instant" });
      // Le drapeau posé par la grille à l'ouverture (voir
      // GrilleTatoueurs) : on le retire quand la fenêtre disparaît,
      // quelle que soit la façon dont elle disparaît.
      document.documentElement.removeAttribute("data-fenetre-fiche");
    };
  }, [ouverte, n, positionGrille, surFermeture]);

  if (!tatoueur) return null;

  const rang = Math.min(indice, Math.max(0, n - 1));
  const photo = photosDuStyleAffiche[rang];
  /** LA PHOTO QUE LE CŒUR ENREGISTRE — celle qu'on regarde. `cle` est
      l'identifiant de base pour un portfolio catalogué (nº 31) ; les
      fiches d'avant portent une clé fabriquée, sans ligne en face.
      ⚠️ PLUS DE VERDICT SUR LA FICHE ENTIÈRE (passe nº 142) : c'est
      `BoutonCoeurPhoto` qui juge CETTE image-ci, comme sur la page de
      fiche — voir le commentaire jumeau dans FicheTatoueur.tsx. */
  const photoEnregistrable = photo?.cle;
  const stylePrincipal = groupes[0]
    ? { slug: groupes[0].slug, label: groupes[0].label }
    : tatoueur.styles[0]
      ? { slug: tatoueur.styles[0], label: libelleStyle(tatoueur.styles[0]) }
      : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fiche de ${tatoueur.nom}`}
      className="fixed inset-0 z-[60]
                 opacity-100 transition-opacity duration-200 starting:opacity-0"
    >
      {/* Le VOILE : la grille reste visible derrière ; un clic referme. */}
      <div
        aria-hidden="true"
        onClick={surFermeture}
        className="absolute inset-0 bg-black/80"
      />

      {/* LA CROIX — hors de la fenêtre, dans la zone ombrée. */}
      <button
        type="button"
        aria-label="Fermer la fiche"
        onClick={surFermeture}
        className="absolute top-4 right-5 z-[2] w-11 h-11 flex items-center
                   justify-center text-white hover:text-primaire transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* LA FENÊTRE — centrée. Large : deux colonnes. Étroite : UNE
          colonne (photo en haut, informations dessous) qui défile
          verticalement — le comportement d'Instagram, jamais l'état
          écrasé. La marge haute étroite (pt-16) laisse sa place à la
          croix. */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-16 lg:p-8 pointer-events-none">
        {/* ⚠️ LA FENÊTRE EST CENTRÉE EXACTEMENT COMME AVANT LA Nº 200
            (nº 202). Cette enveloppe ne fait qu'accrocher le fil
            d'Ariane : elle épouse la fenêtre (le fil, HORS du flux, ne
            pèse rien — ni dans sa largeur, ni dans sa hauteur), et
            c'est donc toujours la fenêtre seule que le conteneur
            centre. Pas un pixel de décalage. */}
        <div
          className="relative flex max-h-full flex-col
                     w-[min(560px,100%)] lg:w-auto"
        >
          {/* §1-§2 (nº 201) — LE FIL D'ARIANE, TEXTE SEUL DANS LE
              VOILE. Le bandeau de la nº 200 est SUPPRIMÉ : une surface
              sombre sur un voile déjà sombre ne se distinguait pas, et
              elle recouvrait le haut de la photo. Plus aucun fond,
              aucun encadré — le texte est posé AU-DESSUS de la fenêtre
              (`bottom-full` : il s'écrit dans le voile, vers le haut,
              et s'y adapte — JAMAIS la fenêtre, nº 202), aligné à
              gauche sur son bord, à 8 px de son bord haut (l'air d'une
              ligne, ni collé ni flottant). Gris clair sur le voile, le
              segment courant plus clair que les précédents — jamais de
              rose. */}
          <nav
            aria-label="Fil d'Ariane"
            className="pointer-events-auto absolute bottom-full left-0 mb-2 w-max max-w-full"
          >
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/70">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              {stylePrincipal && (
                <>
                  <li aria-hidden="true">›</li>
                  <li>
                    <Link
                      href={`/tatouage/${stylePrincipal.slug}/${tatoueur.ville_slug}`}
                      className="hover:text-white transition-colors"
                    >
                      {stylePrincipal.label}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="font-semibold text-white">
                {tatoueur.nom}
              </li>
            </ol>
          </nav>

          <div
            ref={fenetreRef}
            className="pointer-events-auto flex flex-col lg:flex-row
                       w-full lg:w-auto min-h-0
                       lg:h-[min(88vh,940px,calc((100vw-476px)*1.25))]
                       lg:max-w-[min(1200px,calc(100vw-96px))]
                       overflow-y-auto lg:overflow-hidden overscroll-contain
                       rounded-b-lg rounded-t-none lg:rounded-none lg:rounded-r-lg bg-sombre-carte
                       shadow-[0_24px_80px_rgba(0,0,0,0.6)]
                       scale-100 transition-transform duration-200 starting:scale-[0.97]"
          >
            {/* ---- LA PHOTO : collée aux bords — haut, gauche et bas en
                deux colonnes ; haut, gauche et droite en une seule. La
                hauteur de la fenêtre est bornée pour que le 4:5 ne soit
                JAMAIS écrasé. Le carrousel est CELUI DE LA PAGE : mêmes
                flèches, même pagination, même capsule. ---- */}
            <div className="relative w-full lg:w-auto lg:h-full aspect-[4/5] min-w-0 shrink-0 lg:shrink bg-black select-none">
              <CarrouselPortfolio
                photos={photosDuStyleAffiche}
                nomTatoueur={tatoueur.nom}
                styleLabel={groupeAffiche?.label ?? ""}
                indice={rang}
                surChangement={setIndice}
              >
                {/* LE PARTAGE À GAUCHE, LE CŒUR À DROITE — la place des
                    deux boutons du web depuis la nº 198-§3, celle de la
                    page. Chacun seul dans son angle (nº 201-§3 : le
                    bandeau parti, plus rien ne recouvre le haut de la
                    photo, ils reprennent leurs angles). */}
                <div className="absolute top-3 left-3 z-[2]">
                  <BoutonPartageFiche
                    nomArtisan={tatoueur.nom}
                    cheminFiche={`/tatoueur/${tatoueur.slug}`}
                    variante="fiche"
                    avecFenetre
                    sombre
                    metier={stylePrincipal?.label}
                    commune={villeAffichee(tatoueur.ville_nom)}
                    marque={MARQUE_YOKOFOLIO.nom}
                  />
                </div>
                {photoEnregistrable && (
                  <div className="absolute top-3 right-3 z-[2]">
                    <BoutonCoeurPhoto
                      photoId={photoEnregistrable}
                      variante="fiche"
                    />
                  </div>
                )}
              </CarrouselPortfolio>
            </div>

            {/* ---- LE CONTENU — sous la photo en une colonne (il défile
                avec la fenêtre), à sa droite en deux (il défile tout
                seul). ⚠️ C'EST LE COMPOSANT DE LA PAGE : les deux onglets,
                les vignettes par style, et tout l'onglet « Profil ». Rien
                n'est redessiné ici. ---- */}
            {/*  ⚠️ SON FOND EST ÉCRIT (nº 207-§4) : les deux blocs qui
                 ne défilent pas le reprennent par `bg-inherit`. C'est
                 déjà la couleur de la fenêtre — rien ne change à
                 l'œil. */}
            <div
              ref={colonneRef}
              className="w-full lg:w-[380px] shrink-0 lg:h-full lg:overflow-y-auto p-5 sm:p-6 flex flex-col bg-sombre-carte"
            >
              <ContenuFiche
                tatoueur={tatoueur}
                groupes={groupes}
                surSerieChoisie={(serie) => {
                  setStyleAffiche(serie.style);
                  setSerieOuverte({ nature: serie.nature, rendu: serie.rendu });
                  setIndice(0);
                  colonneRef.current?.scrollTo({ top: 0, behavior: "instant" });
                  fenetreRef.current?.scrollTo({ top: 0, behavior: "instant" });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
