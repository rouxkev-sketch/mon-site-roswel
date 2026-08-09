"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { villeAffichee } from "@/lib/adresse";
import {
  ICONES_RESEAUX,
  libelleFiltre,
  libelleStyle,
  MARQUE_YOKOFOLIO,
} from "@/config/tatouage";
import { BoutonHorsLigne } from "@/components/BoutonHorsLigne";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { BoutonSuivre } from "@/components/BoutonSuivre";
import { FenetreSignalement } from "@/components/FenetreSignalement";
import { PhotoProgressive } from "@/components/PhotoProgressive";
import { SelecteurStyleFiche } from "@/components/SelecteurStyleFiche";
import { libelleDuLien } from "@/lib/liens-fiche";
import { rendusDuPortfolio } from "@/lib/photos-tatoueur";
import { galerieParStyles, ouvertureGalerie } from "@/lib/photo-tatoueur";
import { HorairesStudio } from "@/components/HorairesStudio";
import { aDesHoraires } from "@/lib/horaires-studio";
import {
  BlocAdresses,
  BlocEquipe,
  LignesModes,
  sousLeNom,
  studioAffiche,
} from "@/components/BlocsFiche";
import { IconeWorld } from "@/components/Icones";
import type { Tatoueur } from "@/lib/tatoueurs";
import { PORTRAIT_ROND } from "@/config/tatouage";

/**
 * LA FENÊTRE DE FICHE — la mécanique d'Instagram, notre charte
 * =============================================================
 * Depuis la GRILLE (web, ≥ 1024 px), cliquer une carte n'ouvre plus
 * une page : cette fenêtre se superpose, la grille reste visible
 * derrière un voile sombre.
 *
 * LA STRUCTURE (mécanique d'Instagram, jamais son habillage) :
 *  - deux colonnes — à GAUCHE la photo, collée aux bords haut, gauche
 *    et bas de la fenêtre ; à DROITE la colonne d'informations
 *    (fil d'Ariane, nom, adresse, bio, styles, boutons) ;
 *  - la CROIX vit HORS de la fenêtre, en haut à droite de la zone
 *    ombrée ; le voile et Échap referment aussi ;
 *  - le défilement : flèche DANS la photo, à droite, mi-hauteur — la
 *    gauche n'apparaît qu'après le premier défilement. BUTÉES
 *    franches, pas de boucle. Points DANS la photo, en bas. Le badge
 *    du STYLE, DANS la photo, angle haut droit, change à chaque image.
 *
 * RESPONSIVE, COMME INSTAGRAM : la fenêtre suit la largeur du
 * NAVIGATEUR, pas l'appareil.
 *  - large (≥ 1024 px) : les deux colonnes, et la hauteur se borne
 *    d'elle-même pour que la photo 4:5 garde EXACTEMENT ses
 *    proportions — jamais de photo écrasée entre deux largeurs ;
 *  - étroite (fenêtre rétrécie sous 1024 px) : UNE colonne — la photo
 *    EN HAUT, pleine largeur, les informations EN DESSOUS, et c'est la
 *    fenêtre elle-même qui défile verticalement. Jamais d'état cassé.
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

  /** LE STYLE AFFICHÉ — c'est le sélecteur posé sur la photo qui en
      change ; la fenêtre est remontée à chaque ouverture (voir la clé
      dans GrilleTatoueurs), l'état repart donc toujours du bon style. */
  const [styleAffiche, setStyleAffiche] = useState(ouverture.style);
  const [indice, setIndice] = useState(ouverture.indice);

  const groupeAffiche =
    groupes.find((groupe) => groupe.slug === styleAffiche) ?? groupes[0];
  const photosDuStyleAffiche = groupeAffiche?.photos ?? [];
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
      fiches d'avant portent une clé fabriquée, sans ligne en face :
      pas de cœur pour elles. */
  const photoEnregistrable =
    (tatoueur?.galerie?.length ?? 0) > 0 ? photo?.cle : undefined;
  /** LA SUIVANTE — sa miniature part discrètement en avance : le
      passage à la photo d'après n'a plus rien à attendre. */
  const suivante = photosDuStyleAffiche[rang + 1];
  const stylePrincipal = groupes[0]
    ? { slug: groupes[0].slug, label: groupes[0].label }
    : tatoueur.styles[0]
      ? { slug: tatoueur.styles[0], label: libelleStyle(tatoueur.styles[0]) }
      : undefined;

  /** Les trois sections de badges — Styles, Technique, Composition :
      un seul format, les styles en nuance rose (cliquables), un
      groupe vide n'affiche pas son titre. */
  const groupesBadges: Array<{
    titre: string;
    slugs: string[];
    versPages?: boolean;
  }> = [
    { titre: "Styles", slugs: tatoueur.styles, versPages: true },
    { titre: "Technique", slugs: tatoueur.filtres_technique ?? [] },
    { titre: "Types de projets", slugs: tatoueur.filtres_composition ?? [] },
    // LES BESOINS — au même format que les deux autres : ce ne
    // sont pas des goûts, mais ils se lisent au même endroit.
    { titre: "Besoins", slugs: tatoueur.filtres_besoins ?? [] },
    // LE RENDU — le seul groupe que PERSONNE n'a coché : il se DÉDUIT
    // des tags des photos déposées (voir rendusDuPortfolio), tout
    // comme le filtre du moteur le lit. Un portfolio entièrement en
    // noir et gris n'affiche donc qu'une pastille, et une fiche dont
    // aucune photo n'est taguée (avant la migration nº 31) n'affiche
    // pas la section du tout.
    { titre: "Rendu", slugs: rendusDuPortfolio(tatoueur.galerie) },
  ];

  /** LA LIGNE DE SÉPARATION — D'UN BORD À L'AUTRE DE LA COLONNE.
      La colonne d'informations porte 20 px de marge intérieure (24 px
      au-delà de 640 px) : les traits s'arrêtaient donc à cette
      distance des deux bords, comme suspendus. Ils ressortent
      maintenant de cette marge (`-mx-5`) et la rendent aussitôt à leur
      contenu (`px-5`) : le trait traverse toute la colonne, le texte
      ne bouge pas d'un pixel. Le calcul tombe juste — le bloc élargi
      fait exactement la largeur de la boîte de remplissage, donc
      aucune barre de défilement horizontale. */
  const separation =
    "border-t border-sombre-bordure/60 -mx-5 sm:-mx-6 px-5 sm:px-6";

  /** LA LIGNE D'ADRESSE, LISIBLE PARTOUT DANS LE MONDE : le pays
      s'ajoute dès qu'il n'est pas la France — « 10001 New York,
      États-Unis » se comprend, « 10001 New York » beaucoup moins. */


  /** L'adresse — ou TOUTES LES VILLES d'un itinérant. Même règle que
      sur la page de fiche. */

  function aller(sens: 1 | -1) {
    const cible = indice + sens;
    if (cible < 0 || cible >= n) return;
    setIndice(cible);
  }

  const fleche = (sens: 1 | -1) => (
    <button
      type="button"
      aria-label={sens === 1 ? "Photo suivante" : "Photo précédente"}
      onClick={() => aller(sens)}
      // Au survol, le cercle s'éclaircit légèrement — jamais de rose,
      // le symbole ne bouge pas.
      className={`absolute ${sens === 1 ? "right-3" : "left-3"} top-1/2
                 -translate-y-1/2 w-9 h-9 rounded-full bg-sombre-fond/60
                 backdrop-blur flex items-center justify-center
                 text-sombre-texte hover:bg-sombre-eleve/75 transition-colors`}
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
        <div
          className="pointer-events-auto flex flex-col lg:flex-row
                     w-[min(560px,100%)] lg:w-auto max-h-full
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
              JAMAIS écrasé. ---- */}
          <div className="relative w-full lg:w-auto lg:h-full aspect-[4/5] min-w-0 shrink-0 lg:shrink bg-black select-none">
            {/* LA PHOTO — miniature d'abord, pleine résolution ensuite
                (voir PhotoProgressive). Une seule image montée à la
                fois : une galerie de quarante photos ne télécharge que
                celle qu'on regarde. */}
            {photo && (
              <PhotoProgressive
                key={photo.cle}
                miniature={photo.miniature}
                url={photo.url}
                alt={`Portfolio de ${tatoueur.nom} — ${
                  groupeAffiche?.label ?? ""
                }${photo.legende ? ` · ${photo.legende}` : ""}`}
                pleineResolution
                prioritaire
                classe="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* La MINIATURE de la suivante, préchargée sans être
                montrée : le défilement paraît instantané. */}
            {suivante && (
              /* eslint-disable-next-line @next/next/no-img-element --
                 préchargement invisible, jamais rendu à l'écran. */
              <img
                src={suivante.miniature}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute h-px w-px opacity-0"
              />
            )}

            {/* LE SÉLECTEUR DE STYLE — angle haut gauche, en
                typographie blanche : il REMPLACE le badge d'avant, et
                c'est lui qui change le contenu du carrousel. */}
            {groupeAffiche && (
              <SelecteurStyleFiche
                styles={groupes.map((groupe) => ({
                  slug: groupe.slug,
                  label: groupe.label,
                  nombre: groupe.photos.length,
                }))}
                valeur={groupeAffiche.slug}
                surChangement={(slug) => {
                  setStyleAffiche(slug);
                  setIndice(0);
                }}
              />
            )}

            {/* Le CŒUR puis le PARTAGE — dans la photo, angle haut
                droit. Le cœur À GAUCHE du partage (passe nº 137),
                exactement comme sur la page de fiche. */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {photoEnregistrable && (
                <BoutonCoeurPhoto
                  photoId={photoEnregistrable}
                  variante="fiche"
                />
              )}
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

            {/* Les flèches — la gauche seulement après le premier
                défilement, la droite jamais à la dernière (butées). */}
            {rang > 0 && fleche(-1)}
            {rang < n - 1 && fleche(1)}

            {/* Les points — dans la photo, en bas, centrés. MENUS,
                l'actif en BLANC : un repère, pas un ornement.
                AU-DELÀ DE DOUZE PHOTOS ils deviendraient une frise
                illisible : le COMPTEUR prend alors le relais. */}
            {n > 1 && n <= 12 && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center items-center gap-1.5">
                {photosDuStyleAffiche.map((entree, position) => (
                  <button
                    key={entree.cle}
                    type="button"
                    aria-label={`Voir la photo ${position + 1} sur ${n}`}
                    aria-current={position === rang ? "true" : undefined}
                    onClick={() => setIndice(position)}
                    className={`rounded-full transition-all ${
                      position === rang
                        ? "w-[5px] h-[5px] bg-white"
                        : "w-1 h-1 bg-white/45 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            )}
            {n > 12 && (
              <span
                className="absolute bottom-3 right-3 rounded-full bg-black/55
                           backdrop-blur px-2.5 py-1 text-[12px] font-semibold
                           text-white tabular-nums"
              >
                {rang + 1}/{n}
              </span>
            )}
          </div>

          {/* ---- LA COLONNE D'INFORMATIONS — sous la photo en une
              colonne (elle défile avec la fenêtre), à sa droite en
              deux (elle défile toute seule). L'ORDRE de la page de
              fiche (fil d'Ariane · nom · adresse · site · bio ·
              réseaux · les trois sections · signalement), AVEC les
              mêmes lignes de séparation discrètes qu'elle. ---- */}
          <div className="w-full lg:w-[380px] shrink-0 lg:h-full lg:overflow-y-auto p-5 sm:p-6 flex flex-col">
            {/* 1. Le fil d'Ariane — cliquable ; naviguer déroute vers
                la vraie page, la fenêtre s'efface avec la grille. */}
            <nav aria-label="Fil d'Ariane">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-sombre-texte-doux">
                <li>
                  <Link href="/" className="hover:text-sombre-texte transition-colors">
                    Accueil
                  </Link>
                </li>
                {stylePrincipal && (
                  <>
                    <li aria-hidden="true">›</li>
                    <li>
                      <Link
                        href={`/tatouage/${stylePrincipal.slug}/${tatoueur.ville_slug}`}
                        className="hover:text-sombre-texte transition-colors"
                      >
                        {stylePrincipal.label}
                      </Link>
                    </li>
                  </>
                )}
                <li aria-hidden="true">›</li>
                <li aria-current="page" className="font-semibold text-sombre-texte">
                  {tatoueur.nom}
                </li>
              </ol>
            </nav>

            {/* LE TRAIT SOUS LE FIL D'ARIANE (web) — le même que celui
                des sections, d'un bord à l'autre de la colonne : le fil
                cesse d'être posé sur l'identité, il devient un bandeau
                de repérage refermé sur lui-même. */}
            <div className={`mt-4 ${separation}`} />

            {/* 2. L'IDENTITÉ — MÊME COMPOSITION QUE LA PAGE, à
                l'échelle de la colonne : portrait rond de 76 px, LE
                NOM d'abord, à une taille de titre de profil, puis
                l'étiquette « ARTISTE » / « SALON » en dessous. */}
            <div className="mt-6 flex items-center gap-4">
              <span
                className="flex h-[76px] w-[76px] shrink-0 items-center justify-center
                           overflow-hidden rounded-full border border-sombre-bordure
                           bg-sombre-eleve"
              >
                {tatoueur.photo_profil ? (
                  /* eslint-disable-next-line @next/next/no-img-element --
                     photo déposée par le tatoueur, servie telle quelle. */
                  <img
                    src={tatoueur.photo_profil}
                    width={PORTRAIT_ROND}
                    height={PORTRAIT_ROND}
                    alt={`Photo de ${tatoueur.nom}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-[27px] font-bold text-sombre-texte-doux"
                  >
                    {tatoueur.nom.trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <h2 className="text-[21px] font-bold tracking-tight text-sombre-texte leading-[1.15]">
                  {tatoueur.nom}
                </h2>
                <p className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
                  {sousLeNom(tatoueur)}
                </p>
              </div>
            </div>

            {/* « SUIVRE » — sous l'identité, comme sur la page de
                fiche : les deux écrans montrent la même chose au même
                endroit (passe nº 137). */}
            <div className="mt-5">
              <BoutonSuivre
                tatoueurId={tatoueur.id}
                nomTatoueur={tatoueur.nom}
              />
            </div>

            {/* 3-4. OÙ, puis LE SITE. À DROITE DE L'ICÔNE : LA
                LOCALISATION elle-même, dans le GRIS de l'icône, qui
                passe au ROSE au survol ou au toucher. Le mot
                « adresse » n'y est plus : il répétait l'icône. Le
                mode d'exercice ne reste que lorsqu'il apprend
                quelque chose (en salon, sur zone, itinérant). */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                {/* L'ÉPINGLE ne sert qu'aux ADRESSES : chaque mode
                    d'exercice porte déjà sa propre icône ronde. */}
                {!(
                  tatoueur.type_fiche === "artiste" &&
                  (tatoueur.modes ?? []).length > 0
                ) && (
                  /* eslint-disable-next-line @next/next/no-img-element --
                     icône déposée par le propriétaire, telle quelle. */
                  <img
                    src="/adresse.png"
                    width={16}
                    height={16}
                    alt=""
                    className="mt-[3px] w-4 h-4 shrink-0 invert opacity-60"
                  />
                )}
                <div className="min-w-0 flex flex-col gap-1">
                  {/* UN ARTISTE MONTRE SES MODES D'EXERCICE — une ligne
                      chacun, avec son icône ronde (ou le logo du salon
                      auquel il est rattaché). UN SALON montre ses
                      ADRESSES. C'est la même place, et deux natures
                      d'information différentes. */}
                  {tatoueur.type_fiche === "artiste" &&
                  (tatoueur.modes ?? []).length > 0 ? (
                    <LignesModes modes={tatoueur.modes} />
                  ) : (
                    <BlocAdresses tatoueur={tatoueur} />
                  )}
                </div>
              </div>
              {tatoueur.site_web && (
                <a
                  href={tatoueur.site_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-2.5 text-[15px] leading-snug
                             text-sombre-texte-doux hover:text-primaire transition-colors"
                >
                  {/* L'ICÔNE « WORLD » remplace site.png, à la même
                      taille : posée en masque, elle prend la couleur
                      de la ligne et passe au rose avec elle. */}
                  <IconeWorld taille={16} />
                  {/* Le titre choisi (passe nº 116), sinon le libellé
                      d'avant — même règle que la page de fiche. */}
                  {tatoueur.titre_site_web || libelleDuLien(tatoueur.site_web)}
                </a>
              )}
              {/* LA PAGE DE LIENS — sa propre ligne, son propre
                  libellé (« Linktree », « Beacons »), depuis la passe
                  nº 102. Même traitement que le site : les deux
                  mènent ailleurs, sur le web. */}
              {tatoueur.page_de_liens && (
                <a
                  href={tatoueur.page_de_liens}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-2.5 text-[15px] leading-snug
                             text-sombre-texte-doux hover:text-primaire transition-colors"
                >
                  <IconeWorld taille={16} />
                  {tatoueur.titre_page_de_liens ||
                    libelleDuLien(tatoueur.page_de_liens)}
                </a>
              )}
            </div>

            {/* 5. LA BIO — retours à la ligne RESPECTÉS
                (whitespace-pre-line) et mots sans espace coupés
                proprement (overflow-wrap) : jamais de débordement. */}
            {tatoueur.bio && (
              <p className="mt-5 text-[15px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
                {tatoueur.bio}
              </p>
            )}

            {/* 6-7. INSTAGRAM puis TIKTOK — LES BOUTONS-PHARES, avec
                EXACTEMENT la géométrie de la page : une grille
                `44px | 1fr | 44px`, 16 px de marge de chaque côté,
                12 px entre les colonnes. La colonne fantôme de droite
                répond à l'icône de gauche — le libellé tombe donc au
                CENTRE du badge, et non plus au centre de ce qui reste
                à droite de l'icône. 68 px de haut : ce sont les
                éléments les plus importants de la fiche. */}
            <div className="mt-7 flex flex-col gap-3">
              {/* DEUX RÉSEAUX, PLUS TROIS (passe nº 101) : YouTube a
                  quitté le produit. La colonne `lien_youtube` garde
                  son contenu en base, mais plus rien ne la publie —
                  voir la note dans FicheTatoueur. */}
              {(["instagram", "tiktok"] as const).map((reseau) => {
                const lien =
                  reseau === "instagram"
                    ? tatoueur.lien_instagram
                    : tatoueur.lien_tiktok;
                if (!lien) return null;
                const nomReseau =
                  reseau === "instagram" ? "Instagram" : "TikTok";
                return (
                  <a
                    key={reseau}
                    href={lien}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${nomReseau} de ${tatoueur.nom} (nouvel onglet)`}
                    className="grid w-full h-[68px] grid-cols-[44px_1fr_44px] items-center gap-3
                               rounded-2xl px-4
                               border border-primaire/40 bg-sombre-eleve
                               shadow-[0_10px_32px_rgba(238,61,111,0.10)]
                               transition-[border-color,background-color,box-shadow]
                               hover:border-primaire hover:bg-primaire/10
                               hover:shadow-[0_12px_36px_rgba(238,61,111,0.22)]
                               active:bg-primaire/15"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        icône officielle déposée par le propriétaire,
                        affichée telle quelle. */}
                    <img
                      src={ICONES_RESEAUX[reseau]}
                      width={44}
                      height={44}
                      alt=""
                      className="w-11 h-11 shrink-0 rounded-full ring-1 ring-white/25"
                    />
                    <span className="min-w-0 truncate text-center text-[16px] font-semibold text-sombre-texte">
                      Voir son {nomReseau}
                    </span>
                    {/* La colonne fantôme : elle ne montre rien, elle
                        équilibre. */}
                    <span aria-hidden="true" />
                  </a>
                );
              })}
            </div>

            {/* 8-10. LES TROIS SECTIONS — chacune ouverte par la
                même ligne de séparation discrète que sur la page de
                fiche ; titres affirmés, badges d'une seule robe neutre
                (le survol rose des styles dit seul qu'ils se
                cliquent). */}
            {/* LES HORAIRES — la fenêtre montre EXACTEMENT ce que
                montre la page : même composant, même règle de fuseau.
                Studios seulement. */}
            {tatoueur.type_fiche !== "artiste" &&
              aDesHoraires(studioAffiche(tatoueur)?.horaires) && (
                <div className={`mt-8 pt-7 ${separation}`}>
                  <HorairesStudio
                    horaires={studioAffiche(tatoueur)?.horaires}
                    fuseau={studioAffiche(tatoueur)?.fuseau}
                    titreClasse="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux"
                  />
                </div>
              )}

            {/* L'ÉQUIPE — sous les adresses, comme sur la page. */}
            {(tatoueur.equipe ?? []).length > 0 && (
              <div className={`mt-8 pt-7 ${separation}`}>
                <BlocEquipe
                  equipe={tatoueur.equipe}
                  titreClasse="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux"
                />
              </div>
            )}

            {groupesBadges.map(
              (groupe) =>
                groupe.slugs.length > 0 && (
                  <div key={groupe.titre} className={`mt-7 pt-6 ${separation}`}>
                    <h3 className="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                      {groupe.titre}
                    </h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {groupe.slugs.map((slug) =>
                        groupe.versPages ? (
                          <li key={slug}>
                            <Link
                              href={`/tatouage/${slug}/${tatoueur.ville_slug}`}
                              className="inline-flex items-center rounded-full px-3.5 min-h-[32px]
                                         border border-sombre-bordure bg-sombre-eleve
                                         text-[13px] font-medium text-sombre-texte
                                         hover:border-primaire hover:text-primaire transition-colors"
                            >
                              {libelleStyle(slug)}
                            </Link>
                          </li>
                        ) : (
                          <li
                            key={slug}
                            className="inline-flex items-center rounded-full px-3.5 min-h-[32px]
                                       border border-sombre-bordure bg-sombre-eleve
                                       text-[13px] font-medium text-sombre-texte"
                          >
                            {libelleFiltre(slug)}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )
            )}

            {/* 11. Le signalement — discret, tout en bas, derrière
                sa ligne. EN DESSOUS, et non plus à côté : la mise hors
                ligne (administrateur seulement, reconnu par le
                serveur), avec sa robe de bouton cerclé de rouge — un
                lien public et un pouvoir d'administration ne peuvent
                plus se confondre. */}
            <div className={`mt-7 pt-5 ${separation} flex flex-col items-start gap-4`}>
              <FenetreSignalement slug={tatoueur.slug} nom={tatoueur.nom} />
              <BoutonHorsLigne idFiche={tatoueur.id} nom={tatoueur.nom} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
