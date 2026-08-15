"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { corpsGele, gelerLeCorps } from "@/lib/gel-du-corps";
import { PORTRAIT_ROND } from "@/config/tatouage";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import {
  CarrouselPortfolio,
  PointsDuCarrousel,
} from "@/components/CarrouselPortfolio";
import { LogoYokofolio } from "@/components/LogoYokofolio";
import {
  cheminDuCarrousel,
  galerieParStyles,
  ouvertureGalerie,
  serieDeLOuverture,
  serieMontree,
} from "@/lib/photo-tatoueur";
import {
  ensembleDeLaPhoto,
  libelleNature,
  libelleRendu,
} from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * ██ LA FENÊTRE DE CARROUSEL — SMARTPHONE SEULEMENT (nº 284) ██
 * ==================================================================
 * LE DÉFAUT QU'ELLE SUPPRIME. Dans le portfolio d'un profil, toucher
 * un carrousel REMONTAIT la page en haut pour l'afficher dans la
 * galerie principale. Un salon à beaucoup de styles, c'était un
 * va-et-vient permanent : descendre chercher, toucher, remonter malgré
 * soi, redescendre. Désormais une PAGE ENTIÈRE s'ouvre PAR-DESSUS —
 * et en la refermant on retombe EXACTEMENT à l'endroit touché : le
 * carrousel suivant est sous le doigt.
 *
 * CE QU'ELLE MONTRE, du haut vers le bas :
 *  · une barre : la FLÈCHE RETOUR à gauche, le LOGO YokoFolio au
 *    centre, RIEN à droite (ni croix, ni seconde flèche) ;
 *  · le STYLE en blanc et en gras, centré ; dessous, en gris et plus
 *    petit, la nature et le rendu — « Réalisation · Noir et gris » ;
 *  · LA PHOTO en pleine largeur, NETTE : rien de posé dessus — pas de
 *    capsule « 3/12 » ici, les points le disent déjà ;
 *  · UNE SEULE LIGNE sous la photo : le ROND DE PROFIL à gauche, les
 *    POINTS au centre (la frise du web, reprise telle quelle —
 *    `PointsDuCarrousel`), le CŒUR à droite (l'existant, qui aime
 *    TOUT le carrousel d'un coup — rien n'est redessiné).
 * Fond anthracite (`bg-sombre-fond`), AUCUN contour nulle part. Le
 * menu fixe du site disparaît tant qu'elle est ouverte : elle couvre
 * tout l'écran (fixed, z-70 — la barre vit à z-50), et sa page dédiée
 * ne le rend même pas.
 *
 * ⚠️ LE DÉFILEMENT EST CELUI QUI EXISTE (nº 209-§7, recalé nº 282) :
 * `CarrouselPortfolio`, défilement natif avec accrochage. RIEN n'est
 * réinventé ici — ni translation, ni remontage d'indice : trois passes
 * ont payé pour le remettre d'aplomb.
 *
 * DEUX FAÇONS D'EXISTER, une seule vérité — L'ADRESSE :
 *  · SUPERPOSÉE (`surFermeture` fourni) : la fiche l'a ouverte par un
 *    `pushState` vers `/tatoueur/<slug>/carrousel?…` — UNE entrée
 *    d'historique, pas une de plus. Le corps est GELÉ à la position du
 *    toucher (gel-du-corps, l'écriture unique) ; fermer, c'est
 *    `history.back()` : l'entrée s'en va, le gel rend la position AU
 *    PIXEL — rien n'a été remonté ni recalculé. Le bouton retour du
 *    téléphone et le glissement du bord font le même `back()`, donc
 *    exactement la même chose que la flèche ;
 *  · PAGE À PART ENTIÈRE (`surFermeture` absent) : un lien partagé —
 *    le serveur sert cette même fenêtre (route
 *    `/tatoueur/[slug]/carrousel`). Aucune page dessous : la flèche
 *    est un vrai lien vers LA FICHE, sur ce carrousel. Sur un écran
 *    non tactile, la fenêtre n'existe pas : on repart vers la fiche
 *    (`location.replace`) — LA VERSION WEB NE CHANGE EN RIEN.
 *
 * LES TROIS COMMANDES — trois destinations, aucun doublon :
 *  1. LA FLÈCHE → la fiche, sur ce carrousel, dans le portfolio
 *     (retour d'historique si l'on venait du profil, lien sinon) ;
 *  2. LE LOGO → l'accueil ;
 *  3. LE ROND DE PROFIL → la fiche, section PROFIL. Un VRAI lien (une
 *     navigation de document neuve) : la page arrive en haut, profil
 *     sous la photo — c'est `DefilementEnHaut` qui garantit la
 *     remontée, comme pour toute arrivée sur une fiche.
 * ⚠️ Les trois sont des <a> ORDINAIRES (jamais un <Link>) : depuis une
 * fenêtre posée sur un corps gelé, une navigation de client laisserait
 * le dégel reposer l'ancienne position sur la NOUVELLE page. Une
 * navigation de document repart de zéro, proprement.
 *
 * ELLE S'OUVRE SUR LA PHOTO TOUCHÉE, jamais sur la première :
 * `photoInitiale` est le rang dans le carrousel — la fiche le calcule
 * depuis la photo réellement touchée, l'adresse le porte (`photo=N`).
 */
export function FenetreCarrousel({
  tatoueur,
  style = "",
  serie = null,
  photoInitiale = 0,
  positionPage = 0,
  surFermeture,
}: {
  tatoueur: Tatoueur;
  /** Le style du carrousel ouvert. Vide (arrivée sans tag) : le
      premier style de la fiche, comme la page. */
  style?: string;
  /** La série — nature + rendu. `null` : l'ensemble de la première
      photo du style (la règle de la nº 278-§2), jamais « tout ». */
  serie?: { nature: string; rendu: string } | null;
  /** LE RANG DE LA PHOTO TOUCHÉE — la fenêtre s'ouvre sur elle. */
  photoInitiale?: number;
  /** SUPERPOSÉE : la position de la page au moment du toucher,
      capturée AVANT le pushState — c'est elle que le gel rendra. */
  positionPage?: number;
  /** SUPERPOSÉE : referme (la fiche fait machine arrière dans
      l'historique). Absent : page à part entière, la flèche est un
      lien. */
  surFermeture?: () => void;
}) {
  const superposee = Boolean(surFermeture);

  /*  LE MÊME CALCUL QUE LA PAGE ET QUE LA FENÊTRE DU WEB (voir les
      jumeaux dans FicheTatoueur et FenetreFiche) : le portfolio groupé
      par style, la série demandée, et le repli documenté — une série
      vide abandonne sa déclaration plutôt que de mentir. */
  const ouverture = useMemo(
    () =>
      ouvertureGalerie(
        galerieParStyles(tatoueur),
        style,
        serie?.rendu ?? "",
        serie?.nature ?? ""
      ),
    [tatoueur, style, serie?.rendu, serie?.nature]
  );
  const groupes = ouverture.groupes;
  const groupeAffiche =
    groupes.find((groupe) => groupe.slug === (style || ouverture.style)) ??
    groupes[0];
  const photosDuStyle = groupeAffiche?.photos ?? [];
  const serieDemandee =
    serie ?? serieDeLOuverture(groupes, groupeAffiche?.slug ?? "");
  const photosRestreintes = serieMontree(photosDuStyle, serieDemandee);
  const serieEffective = photosRestreintes.length > 0 ? serieDemandee : null;
  const photos =
    photosRestreintes.length > 0 ? photosRestreintes : photosDuStyle;
  const n = photos.length;

  /** L'INDICE — il naît sur LA PHOTO TOUCHÉE, borné à la série. */
  const [indice, setIndice] = useState(() =>
    Math.min(Math.max(photoInitiale, 0), Math.max(n - 1, 0))
  );
  const rang = Math.min(indice, Math.max(0, n - 1));
  const photoAffichee = photos[rang];

  /** LA FICHE, SUR CE CARROUSEL — la destination de la flèche (page à
      part entière) et du repli non tactile. */
  const adresseFiche = cheminDuCarrousel(
    tatoueur.slug,
    groupeAffiche?.slug ?? "",
    serieEffective
  );

  /** LE CADRE DE CETTE FENÊTRE — les points du bas s'adressent à lui,
      et à lui seul (jamais au carrousel de la fiche restée dessous). */
  const conteneur = useRef<HTMLDivElement>(null);
  /** UN ROND TOUCHÉ : la même règle que `allerA` (nº 209-§7) —
      `scrollTo` vers `offsetLeft`, la position que le navigateur a
      lui-même posée. Aucune largeur n'est lue nulle part. */
  const allerAuRang = (vise: number) => {
    const zone = conteneur.current?.querySelector<HTMLElement>(
      '[data-role="cadre"]'
    );
    const colonne = zone?.querySelector<HTMLElement>(
      `[data-role="colonne ${vise}"]`
    );
    if (!zone || !colonne) return;
    zone.scrollTo({ left: colonne.offsetLeft, behavior: "smooth" });
  };

  /**
   * SUPERPOSÉE : LE GEL DU CORPS — l'écriture unique (lib/gel-du-corps),
   * exactement le compte de la fenêtre du web (nº 226-§5). La position
   * gelée est celle du toucher ; la fermer la rend AU PIXEL. Le drapeau
   * `data-fenetre-fiche` suit le même compte : c'est lui qui retient
   * `DefilementEnHaut` de remonter la page sous la fenêtre.
   */
  useEffect(() => {
    if (!superposee) return;
    const degeler = gelerLeCorps(positionPage);
    document.documentElement.setAttribute("data-fenetre-fiche", "1");
    return () => {
      degeler();
      if (corpsGele()) return;
      document.documentElement.removeAttribute("data-fenetre-fiche");
    };
  }, [superposee, positionPage]);

  /**
   * PAGE À PART ENTIÈRE, ÉCRAN NON TACTILE : LA FENÊTRE N'EXISTE PAS.
   * La version web ne change en rien (nº 284) — on repart vers la
   * fiche, sur ce carrousel, sans laisser d'entrée d'historique
   * (`replace` : le bouton précédent ne retombe pas sur la fenêtre).
   */
  useEffect(() => {
    if (superposee) return;
    if (document.documentElement.dataset.appareil === "mobile") return;
    window.location.replace(adresseFiche);
  }, [superposee, adresseFiche]);

  /** LE ROND DE PROFIL — la photo du compte, ou l'initiale (le même
      dessin que la fiche : aucun contour, le fond détache). */
  const rondDeProfil = (
    <a
      href={`/tatoueur/${tatoueur.slug}`}
      aria-label={`Voir le profil de ${tatoueur.nom}`}
      className="flex h-10 w-10 shrink-0 items-center justify-center
                 justify-self-start overflow-hidden rounded-full bg-sombre-eleve"
    >
      {tatoueur.photo_profil ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par le tatoueur, servie telle quelle (la même
           règle que le portrait rond de la fiche). */
        <img
          src={tatoueur.photo_profil}
          alt=""
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-[16px] font-bold text-sombre-texte-doux"
        >
          {tatoueur.nom.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </a>
  );

  /** LE CŒUR — l'existant, tel quel : il aime TOUT le carrousel d'un
      geste (l'ensemble de la photo regardée, calculé depuis la galerie
      brute — la seule liste où chaque photo porte ses trois tags,
      nº 210-§2). Sur une photo non cataloguée, il ne se rend pas :
      c'est sa propre règle, on ne la double pas. */
  const coeur = photoAffichee?.cle ? (
    <BoutonCoeurPhoto
      photoId={photoAffichee.cle}
      galerie={ensembleDeLaPhoto(
        tatoueur.galerie ?? [],
        (tatoueur.galerie ?? []).find(
          (entree) => entree.id === photoAffichee.cle
        ) ?? { style: "", rendu: null }
      ).map((entree) => entree.id)}
      variante="fiche-mobile"
    />
  ) : null;

  return (
    <div
      ref={conteneur}
      data-fenetre-carrousel=""
      role={superposee ? "dialog" : undefined}
      aria-modal={superposee || undefined}
      aria-label={`Portfolio de ${tatoueur.nom} — ${groupeAffiche?.label ?? ""}`}
      /*  PAGE ENTIÈRE, fond anthracite, AUCUN contour. Elle couvre la
          barre fixe du site (z-50) : le menu disparaît tant qu'elle
          vit, et revient à la fermeture — sans qu'on touche à la
          barre. Elle défile verticalement si l'écran est court. */
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain
                 bg-sombre-fond opacity-100 transition-opacity duration-200
                 starting:opacity-0"
    >
      {/* LA BARRE DU HAUT — flèche · logo · rien. Le vide de droite a
          la largeur de la flèche : le logo est au centre VRAI. */}
      <div className="flex h-14 items-center justify-between px-1.5">
        {surFermeture ? (
          <button
            type="button"
            aria-label="Retour"
            onClick={surFermeture}
            className="flex h-11 w-11 items-center justify-center
                       text-sombre-texte"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14.5 5.5 8 12l6.5 6.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          //  ARRIVÉE DIRECTE (lien partagé) : aucune page précédente à
          //  retrouver — la flèche EMMÈNE sur la fiche, au portfolio,
          //  sur ce carrousel.
          <a
            href={adresseFiche}
            aria-label="Voir la fiche"
            className="flex h-11 w-11 items-center justify-center
                       text-sombre-texte"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M14.5 5.5 8 12l6.5 6.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
            VOULU : une navigation de DOCUMENT, pas de client. Depuis
            une fenêtre posée sur un corps gelé, un <Link> laisserait
            le dégel reposer l'ancienne position sur l'accueil (voir la
            note de tête) ; un <a> repart de zéro, en haut. */}
        <a href="/" aria-label="Accueil YokoFolio" className="flex items-center">
          <LogoYokofolio hauteur={24} />
        </a>
        <span className="h-11 w-11" aria-hidden="true" />
      </div>

      {/* LE STYLE, EN BLANC ET EN GRAS ; dessous, la nature et le
          rendu en gris, plus petits — « Réalisation · Noir et gris ». */}
      <div className="px-4 pb-3 text-center">
        <h1 className="text-[17px] font-bold text-sombre-texte">
          {groupeAffiche?.label ?? ""}
        </h1>
        {serieEffective && (
          <p className="mt-0.5 text-[13px] text-sombre-texte-doux">
            {libelleNature(serieEffective.nature)}
            {serieEffective.rendu
              ? ` · ${libelleRendu(serieEffective.rendu)}`
              : ""}
          </p>
        )}
      </div>

      {/* LA PHOTO, PLEINE LARGEUR — LE carrousel du site (défilement
          natif, accrochage, nº 209-§7). NETTE : ni capsule, ni points
          dans l'image. */}
      <CarrouselPortfolio
        photos={photos}
        nomTatoueur={tatoueur.nom}
        styleLabel={groupeAffiche?.label ?? ""}
        natureDeLaSerie={serieEffective?.nature ?? ""}
        indice={rang}
        surChangement={setIndice}
        sansCompteur
        sansPoints
      />

      {/* LA LIGNE SOUS LA PHOTO — rond de profil · points · cœur. Les
          colonnes des bords ont la largeur du cœur (48 px) : les
          points sont au centre VRAI. Une série d'UNE photo n'a pas de
          points — la ligne reste, rond et cœur à leur place. */}
      <div className="grid grid-cols-[48px_1fr_48px] items-center px-4 pt-3 pb-6">
        {rondDeProfil}
        <div className="flex justify-center">
          {n > 1 && (
            <PointsDuCarrousel
              photos={photos}
              indice={rang}
              surRang={allerAuRang}
            />
          )}
        </div>
        <div className="flex justify-end">{coeur}</div>
      </div>
    </div>
  );
}
