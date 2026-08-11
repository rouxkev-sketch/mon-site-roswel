"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ICONES_RESEAUX,
  libelleFiltre,
  libelleStyle,
  MARQUE_YOKOFOLIO,
} from "@/config/tatouage";
import { villeAffichee } from "@/lib/adresse";
import { BoutonHorsLigne } from "@/components/BoutonHorsLigne";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { BoutonSuivre } from "@/components/BoutonSuivre";
import { CarrouselPortfolio } from "@/components/CarrouselPortfolio";
import {
  PanneauPortfolio,
  SelecteurOngletAffiche,
  type OngletAffiche,
} from "@/components/PortfolioDeLAffiche";
import { NATURE_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import { FenetreSignalement } from "@/components/FenetreSignalement";
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
 * LA FICHE COMPLÈTE D'UN TATOUEUR — le mode d'ARRIVÉE DIRECTE
 * ============================================================
 * C'est la page qu'ouvre un lien partagé ou un moteur de recherche
 * (/tatoueur/nom). Depuis la GRILLE, c'est la FENÊTRE (FenetreFiche)
 * qui s'ouvre à la place — même mécanique qu'Instagram : la fenêtre
 * pour naviguer, la page pour arriver.
 *
 * L'IMAGE EST LA PAGE : une photo par style, AVEC BUTÉES (plus de
 * boucle). Si la fiche a été ouverte APRÈS une recherche par style
 * (`styleInitial`), le carrousel S'OUVRE SUR LA PHOTO DE CE STYLE.
 *
 * LA COLONNE DE LECTURE — l'ordre du fichier de référence, du haut
 * vers le bas :
 *   1 le nom · 2 l'adresse · 3 le site · 4 la bio · 5 Instagram ·
 *   6 TikTok · 7 Styles · 8 Technique · 9 Composition ·
 *   10 le signalement. PAS de fil d'Ariane : la page partagée
 *   commence par le nom, rien au-dessus.
 * Les blocs RESPIRENT (marges larges), et des LIGNES DE SÉPARATION
 * discrètes détachent : réseaux | Styles | Technique | Composition |
 * signalement. Ces lignes n'existent QUE sur cette page — la fenêtre
 * superposée s'en passe (elle est déjà cadrée).
 *
 * INSTAGRAM ET TIKTOK SONT LES BOUTONS-PHARES : les seuls éléments
 * au liseré rose et au léger halo — c'est la visite que la fiche
 * existe pour déclencher. L'icône ronde garde son fin cercle blanc ;
 * le texte est une invitation (« Voir son Instagram »), centrée. Les
 * badges de STYLES gardent leur robe neutre (le survol rose dit seul
 * qu'ils se cliquent).
 *
 * L'ADRESSE ET LE SITE, à la taille de la bio, portent les icônes
 * déposées par le propriétaire (public/adresse.png et public/site.png,
 * des glyphes noirs) passées en CLAIR par un simple filtre `invert` —
 * les fichiers eux-mêmes ne sont jamais retouchés.
 *
 * `apercu` : le mode « Ma fiche » de l'espace tatoueur — la fiche
 * telle que le public la voit, SANS le partage ni le signalement, et
 * rendue dans un <div> (la page de l'espace a déjà son <main>).
 *
 * AUCUNE INFORMATION D'ÉTAT ICI : une fiche consultée depuis la
 * recherche ou une adresse publique est la même pour tout le monde,
 * son propriétaire compris — l'état (« en cours de validation »…) ne
 * vit QUE dans le menu « Mon espace » et dans le formulaire.
 */
export function FicheTatoueur({
  studioCourant,
  tatoueur,
  demonstration,
  styleInitial = "",
  renduInitial = "",
  apercu = false,
}: {
  tatoueur: Tatoueur;
  demonstration: boolean;
  /** LE STUDIO REGARDÉ, quand l'adresse porte « ?studio=<id> ». Une
      enseigne à plusieurs adresses met alors CELLE-CI en tête
      (« Studio actuel »), les autres restant listées dessous. */
  studioCourant?: string | null;
  /** Le style CHERCHÉ avant d'ouvrir la fiche : le carrousel s'ouvre
      sur CE style. Vide : le premier style de la fiche. */
  styleInitial?: string;
  /** LE RENDU CHERCHÉ (noir et gris, ou couleur), quand la recherche
      portait sur lui : le carrousel s'ouvre sur une photo qui y
      correspond. */
  renduInitial?: string;
  /** Vrai dans l'espace tatoueur (« Ma fiche ») : aperçu public SANS
      partage ni signalement, dans un <div> et non un <main>. */
  apercu?: boolean;
}) {
  const styles = tatoueur.styles.map((slug) => ({
    slug,
    label: libelleStyle(slug),
  }));
  const stylePrincipal = styles[0];

  /** LE PORTFOLIO, GROUPÉ PAR STYLE — et non plus une photo par
      style. Le style cherché passe en tête ; l'indice d'ouverture
      tient compte du RENDU cherché (voir `ouvertureGalerie`). */
  const ouverture = useMemo(
    () =>
      ouvertureGalerie(galerieParStyles(tatoueur), styleInitial, renduInitial),
    [tatoueur, styleInitial, renduInitial]
  );
  const groupes = ouverture.groupes;

  /** LE STYLE AFFICHÉ — c'est le sélecteur posé sur l'image qui en
      change, et le carrousel suit. */
  const [styleAffiche, setStyleAffiche] = useState(ouverture.style);
  /** L'INDICE de la photo affichée, DANS ce style. */
  const [indicePhoto, setIndicePhoto] = useState(ouverture.indice);

  /**
   * LES DEUX ONGLETS DE L'AFFICHE (nº 197-§1)
   * ------------------------------------------------------------------
   * « Profil » montre le contenu de l'affiche, inchangé ; « Portfolio »
   * montre les styles publiés, catégorie par catégorie. Le sélecteur
   * vit EN TÊTE DE LA COLONNE DE LECTURE : sur smartphone, cette
   * colonne vient juste sous la photo principale ; sur le web, elle
   * commence là où se tiendrait un fil d'Ariane. Un seul endroit, donc,
   * pour les deux versions — aucune copie.
   */
  const [onglet, setOnglet] = useState<OngletAffiche>("profil");
  /** La catégorie regardée dans l'onglet « Portfolio » (nº 197-§2). */
  const [categorie, setCategorie] = useState<string>(NATURE_PAR_DEFAUT);

  const groupeAffiche =
    groupes.find((groupe) => groupe.slug === styleAffiche) ?? groupes[0];
  const photosDuCarrousel = groupeAffiche?.photos ?? [];

  /** LA PHOTO SOUS LES YEUX — celle que le cœur enregistre. Elle suit
      le carrousel : changer de photo change ce qu'on enregistre, et le
      cœur se rallume (ou s'éteint) selon que CELLE-CI est déjà gardée.
      ⚠️ `cle` N'EST L'IDENTIFIANT DE BASE QUE POUR UN PORTFOLIO
      CATALOGUÉ (migration nº 31). Les fiches d'avant portent une clé
      FABRIQUÉE (« style-adresse ») qui ne désigne aucune ligne :
      enregistrer serait impossible.
      ⚠️ ON NE JUGE PLUS LA FICHE ENTIÈRE (passe nº 142) : le test se
      faisait sur `galerie.length`, donc une seule photo non cataloguée
      suffisait à priver TOUT le carrousel de son cœur. C'est
      `BoutonCoeurPhoto` qui tranche, PHOTO PAR PHOTO — la seule
      question qui vaille étant « CETTE image-ci existe-t-elle en
      base ? ». (La migration nº 55 catalogue les portfolios que la
      nº 31 avait laissés de côté : après elle, la réponse est oui
      partout.) */
  const photoAffichee = photosDuCarrousel[indicePhoto] ?? photosDuCarrousel[0];

  /*  ⚠️ LE SÉLECTEUR DE STYLE POSÉ SUR LA PHOTO A ÉTÉ SUPPRIMÉ
      (nº 198-§1) — le badge déroulant du bas gauche (mobile) comme le
      menu du haut gauche (web). La navigation entre styles vit
      désormais dans l'onglet « Portfolio » (nº 197) : les vignettes
      remplacent le menu, il n'avait plus de raison d'être. */

  /** LA LIGNE D'ADRESSE, LISIBLE PARTOUT DANS LE MONDE : le pays
      s'ajoute dès qu'il n'est pas la France — « 10001 New York,
      États-Unis » se comprend, « 10001 New York » beaucoup moins. */


  /** CE QUI S'ÉCRIT SOUS LE MODE D'EXERCICE — une seule ligne
      d'adresse pour un salon ou un artiste en salon, la ville pour
      celui qui travaille sur zone, TOUTES LES VILLES pour un
      itinérant. Chacune ouvre la carte : d'où le rose. */

  /** LA PHOTO DE PROFIL, RONDE, à côté du nom — 92 px : elle ne
      décore plus, elle ANCRE le haut de la fiche. En dessous, elle
      passait pour une vignette posée à côté d'un titre ; à cette
      taille, c'est un portrait, et le nom lui répond.
      Une fiche d'avant la refonte n'en a pas encore : l'initiale du
      nom tient sa place — jamais de trou dans la mise en page. */
  const avatarProfil = (
    <span
      className="flex h-[92px] w-[92px] shrink-0 items-center justify-center
                 overflow-hidden rounded-full border border-sombre-bordure
                 bg-sombre-eleve"
    >
      {tatoueur.photo_profil ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           photo déposée par le tatoueur, servie telle quelle. */
        <img
          src={tatoueur.photo_profil}
          alt={`Photo de ${tatoueur.nom}`}
          width={PORTRAIT_ROND}
          height={PORTRAIT_ROND}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true" className="text-[32px] font-bold text-sombre-texte-doux">
          {tatoueur.nom.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );

  const boutonPartage = (
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
  );

  /** L'avertissement des fiches de démonstration — sa place change :
      au-dessus de tout sur le web, SOUS la photo sur smartphone (la
      page mobile doit commencer par l'image, sans bande au-dessus). */
  const noteDemonstration = (classes: string) => (
    <p
      className={`${classes} rounded-xl border border-primaire/40 bg-primaire/10 px-4 py-3 text-sm text-sombre-texte`}
    >
      Fiche de DÉMONSTRATION : ce tatoueur n&apos;existe pas, et
      l&apos;image est un aplat de couleur — aucune photo de tatouage
      n&apos;est publiée sans l&apos;accord de son auteur.
    </p>
  );

  /** L'icône RONDE officielle d'un réseau — fichier du propriétaire,
      affiché tel quel, détouré d'un FIN CERCLE BLANC sur les DEUX
      réseaux (Instagram aussi est sombre sur notre fond). 44 px :
      c'est elle qui donne sa présence au bouton-phare. */
  const iconeReseau = (reseau: "instagram" | "tiktok" | "youtube") => (
    /* eslint-disable-next-line @next/next/no-img-element --
       icône officielle déposée par le propriétaire, affichée telle
       quelle. */
    <img
      src={ICONES_RESEAUX[reseau]}
      alt=""
      width={44}
      height={44}
      className="w-11 h-11 shrink-0 rounded-full ring-1 ring-white/25"
    />
  );

  /** INSTAGRAM ET TIKTOK — LES DEUX BOUTONS-PHARES DE LA FICHE.
      C'est LA visite qu'on veut déclencher : le portfolio entier vit
      sur ces comptes. Alors ils se détachent de tout le reste :
      SEULS éléments de la fiche au liseré ROSE et au léger halo —
      l'œil va droit sur eux, sans criard.

      LA GÉOMÉTRIE, REPRISE À ZÉRO — trois colonnes, pas deux.
      Le texte était centré dans LA PLACE QUI RESTAIT à droite de
      l'icône, et le badge n'avait aucune marge à droite : le libellé
      tombait donc trop à droite, et il frôlait le bord. Désormais une
      grille `44px | 1fr | 44px` : l'icône occupe la colonne de
      gauche, une colonne FANTÔME de même largeur lui répond à droite,
      et le texte vit dans la colonne du milieu — donc EXACTEMENT au
      centre du badge, quel que soit le libellé. Les marges se
      déduisent : 16 px de chaque côté (px-4), 12 px entre les
      colonnes (gap-3), soit 72 px avant et après la zone de texte.
      Hauteur portée à 68 px : ce sont les boutons les plus importants
      de la fiche, ils en ont la présence. */
  const badgeReseau = (reseau: "instagram" | "tiktok" | "youtube") => {
    const lien =
      reseau === "instagram"
        ? tatoueur.lien_instagram
        : reseau === "tiktok"
          ? tatoueur.lien_tiktok
          : tatoueur.lien_youtube;
    if (!lien) return null;
    const nomReseau =
      reseau === "instagram"
        ? "Instagram"
        : reseau === "tiktok"
          ? "TikTok"
          : "YouTube";
    return (
      <a
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
        {iconeReseau(reseau)}
        <span className="min-w-0 truncate text-center text-[16px] font-semibold text-sombre-texte">
          Voir son {nomReseau}
        </span>
        {/* LA COLONNE FANTÔME — elle ne montre rien, elle ÉQUILIBRE :
            sans elle, le texte ne peut pas être au centre du badge. */}
        <span aria-hidden="true" />
      </a>
    );
  };

  /** L'adresse et le site — chacun SA ligne, à la taille de la bio,
      dans le GRIS DOUX des titres de sections (« Styles ») : texte et
      icône d'une seule voix. Les icônes du propriétaire (adresse.png /
      site.png, des glyphes noirs) passent en clair par `invert`, et
      l'opacité les cale sur ce même gris. */
  const iconeInfo = (fichier: string) => (
    /* eslint-disable-next-line @next/next/no-img-element --
       icône déposée par le propriétaire, affichée telle quelle (le
       filtre CSS ne modifie pas le fichier). */
    <img
      src={fichier}
      alt=""
      width={16}
      height={16}
      className="w-4 h-4 shrink-0 invert opacity-60"
    />
  );

  /** LES TROIS SECTIONS DE BADGES — Styles, Technique, Composition.
      UN SEUL format ET UNE SEULE couleur de badge partout : les styles
      ne portent plus de nuance rose, seul leur survol dit qu'ils se
      cliquent. Un groupe vide n'affiche pas son titre. */
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

  /** LA LIGNE DE SÉPARATION DES BLOCS — un gris TRÈS sombre, discret
      mais lisible sur l'anthracite (réservée à cette page).
      ELLE VA D'UN BORD À L'AUTRE DU BLOC. Sur smartphone, la page
      porte 16 px de marge latérale : la ligne s'arrêtait donc à 16 px
      des deux bords pendant que la photo, elle, touchait l'écran —
      un trait suspendu au milieu de rien. Elle ressort maintenant de
      ces marges (`-mx-4`) et les rend à son contenu (`px-4`) : le
      trait traverse, le texte ne bouge pas d'un pixel. */
  /** LE STUDIO DONT ON LIT LES HORAIRES — le même que celui dont on
      lit l'adresse (voir `studioAffiche`). */
  const studioDesHoraires = studioAffiche(tatoueur, studioCourant);

  const separation =
    "border-t border-sombre-bordure/60 mobile:-mx-4 mobile:px-4";

  const Racine = apercu ? "div" : "main";

  return (
    <Racine
      // En aperçu (« Ma fiche »), l'ESPACE fournit déjà le cadre
      // (largeur, marges latérales, marge du haut) : ne pas les
      // doubler — la photo mobile reste ainsi bord à bord et vient
      // TOUCHER la barre fixe, comme sur la vraie page.
      // WEB : le bas de page se réduit à la MÊME marge que le haut
      // (20 px) — c'est elle qui ferme la géométrie du point d'équerre
      // photo/écran (voir la piste photo).
      className={
        apercu
          ? "w-full pb-16 lg:pb-5"
          : "flex-1 mx-auto w-full max-w-[1760px] px-4 sm:px-6 pt-4 lg:pt-5 pb-16 lg:pb-5"
      }
    >
      {/* Les DEUX COLONNES FORMENT UN ENSEMBLE CENTRÉ : la piste photo
          prend sa largeur réelle (`auto`), la colonne de lecture est
          bornée (340 à 400 px), et `justify-center` centre le tout —
          plus de photo collée à gauche avec un trou au milieu. */}
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[auto_minmax(340px,400px)] lg:justify-center">
        {/* ---------- La photo — calée dans la hauteur visible (web) ---------- */}
        <div className="flex flex-col gap-3 min-w-0">
          {/* SMARTPHONE : RIEN au-dessus de la photo — ni flèche
              retour (le site n'en a nulle part), ni partage : la page
              commence par l'image. */}

          {/* LA HAUTEUR DE LA PHOTO ÉPOUSE L'ÉCRAN (web) : la marge
              entre le BAS de l'image et le bas de la fenêtre doit être
              IDENTIQUE à celle entre la barre fixe et le HAUT de
              l'image. Barre fixe : 79 px ; marge : 20 px de chaque
              côté → hauteur de photo = 100vh − 119 px, et le ratio 4:5
              donne la largeur (× 0,8). Même équation dans la colonne
              de lecture (butée basse et hauteur maximale).
              SMARTPHONE : la photo ANNULE les marges de la page — elle
              touche la barre fixe du haut et les deux bords. */}
          <div className="lg:w-[calc((100vh-119px)*0.8)] max-w-full mobile:-mx-4 mobile:-mt-4 mobile:max-w-none">
            <CarrouselPortfolio
              photos={photosDuCarrousel}
              nomTatoueur={tatoueur.nom}
              styleLabel={groupeAffiche?.label ?? ""}
              indice={indicePhoto}
              surChangement={setIndicePhoto}
            >
              {/* WEB : le CŒUR puis le PARTAGE dans la photo, angle
                  haut droit — la page rejoint la fenêtre. Le cœur est
                  À GAUCHE du partage (passe nº 137) : enregistrer est
                  le geste courant, partager l'exception.
                  Pas d'aperçu : l'espace tatoueur montre la fiche sans
                  ces boutons. */}
              {/*  §3 (nº 198) — LES DEUX BOUTONS DU WEB CHANGENT DE
                   COIN : le partage passe dans l'angle GAUCHE de la
                   photo (la place libérée par le menu de style), et le
                   cœur prend la place qu'il occupait, à droite. Chacun
                   seul dans son angle — plus de paire. */}
              {!apercu && (
                <>
                  <div className="mobile:hidden absolute top-3 left-3 z-[2]">
                    {boutonPartage}
                  </div>
                  {photoAffichee && (
                    <div className="mobile:hidden absolute top-3 right-3 z-[2]">
                      <BoutonCoeurPhoto
                        photoId={photoAffichee.cle}
                        variante="fiche"
                      />
                    </div>
                  )}
                </>
              )}

              {/* SMARTPHONE : le cœur DANS l'image, angle BAS DROIT —
                  au pouce, et loin de la barre fixe du haut. */}
              {!apercu && photoAffichee && (
                <div className="hidden mobile:block absolute bottom-3 right-3">
                  {/*  ⚠️ LE GABARIT TACTILE (nº 198-§2) : 48 px de
                       cible, glyphe à 30 — l'ombre portée du trait le
                       garde lisible sur photo claire comme sombre. */}
                  <BoutonCoeurPhoto
                    photoId={photoAffichee.cle}
                    variante="fiche-mobile"
                  />
                </div>
              )}
            </CarrouselPortfolio>
          </div>

          {/* SMARTPHONE : l'avertissement de démonstration vient APRÈS
              la photo — la page commence par l'image, sans bande. */}
          {demonstration && noteDemonstration("hidden mobile:block")}
        </div>

        {/* ---------- La colonne de lecture — L'ORDRE DU FICHIER DE
            RÉFÉRENCE : 1 nom · 2 adresse · 3 site · 4 bio ·
            5-6 réseaux · 7-9 les trois sections · 10 signalement —
            chaque grand bloc détaché d'une ligne. PAS de fil
            d'Ariane : la lecture commence par le nom.
            WEB : la colonne DÉFILE TOUTE SEULE (overflow-y-auto) dans
            la même hauteur que la photo — même butée haute (79 + 20),
            même hauteur maximale (100vh − 119) : la marge sous son
            contenu, à bout de course, égale la marge sous la photo. */}
        <div className="lg:sticky lg:top-[99px] lg:self-start lg:max-h-[calc(100vh-119px)] lg:overflow-y-auto min-w-0 flex flex-col">
          {/* L'avertissement de démonstration (web) vit DANS la
              colonne : la photo garde sa géométrie pleine hauteur. */}
          {demonstration && noteDemonstration("mobile:hidden mb-6")}

          {/*  LES DEUX ONGLETS (nº 197-§1) — forme du sélecteur du
               formulaire, couleurs du badge de filtre. Voir
               PortfolioDeLAffiche. */}
          <SelecteurOngletAffiche valeur={onglet} surChoix={setOnglet} />

          {onglet === "portfolio" && (
            <PanneauPortfolio
              groupes={groupes}
              nature={categorie}
              surNature={setCategorie}
              nomTatoueur={tatoueur.nom}
              surStyle={(slug) => {
                //  §4 — LA GALERIE PRINCIPALE MONTRE CE STYLE, et la
                //  page remonte en haut pour qu'on le voie.
                setStyleAffiche(slug);
                setIndicePhoto(0);
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
            />
          )}

          {onglet === "profil" && (
          <>
          {/* 1. L'IDENTITÉ — LE NOM D'ABORD, sa nature ensuite.
              C'est l'ordre de lecture des bonnes pages de profil : on
              lit un NOM, puis on apprend ce qu'il est. Le nom revient
              donc AU-DESSUS, à une taille de titre de profil — plus
              de bandeau publicitaire : 1,45 rem à 1,75 rem, resserré,
              sur une interligne courte. Sous lui, « ARTISTE » ou
              « SALON » en capitales minuscules et espacées : une
              étiquette, pas un titre. */}
          <div className="flex items-center gap-5">
            {avatarProfil}
            <div className="min-w-0">
              <h1 className="text-[clamp(1.45rem,2.1vw,1.75rem)] font-bold tracking-tight text-sombre-texte leading-[1.15]">
                {tatoueur.nom}
              </h1>
              <p className="mt-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sombre-texte-doux">
                {sousLeNom(tatoueur)}
              </p>
            </div>
          </div>

          {/* « SUIVRE » — juste sous l'identité, avant tout le reste
              (passe nº 137). L'emplacement était libre : c'est celui
              que prennent tous les profils, parce que c'est là qu'on
              décide si l'on veut garder quelqu'un. Absent de l'aperçu :
              on ne se suit pas soi-même. */}
          {!apercu && (
            <div className="mt-5">
              <BoutonSuivre
                tatoueurId={tatoueur.id}
                nomTatoueur={tatoueur.nom}
              />
            </div>
          )}

          {/* 2-3. OÙ, puis LE SITE. À DROITE DE L'ICÔNE : LA
              LOCALISATION ELLE-MÊME. Le mot « adresse » y figurait —
              une étiquette qui répétait l'icône et volait la place de
              l'information. C'est donc le lieu qui vient là, DANS LE
              GRIS DE L'ICÔNE (texte et icône d'une seule voix, comme
              la ligne du site juste dessous) et qui passe AU ROSE au
              survol ou au toucher : la couleur ne sert plus à
              signaler, elle sert à répondre.
              Le MODE D'EXERCICE ne disparaît que lorsqu'il ne dit
              rien de plus que l'adresse (le cas des salons) ; « en
              salon », « sur zone » ou « itinérant » restent, en
              petit, sous le lieu qu'ils qualifient.
              Le retrait n'est plus un décalage écrit en dur : il
              résulte de l'alignement, le texte se cale tout seul sur
              l'icône, quelle que soit la taille de celle-ci. */}
          <div className="mt-7 flex flex-col gap-3.5">
            <div className="flex items-start gap-2.5">
              {/* L'ÉPINGLE ne sert qu'aux ADRESSES : les modes
                  d'exercice portent déjà, chacun, leur propre icône
                  ronde — deux icônes sur la même ligne se disputent
                  l'œil sans rien apprendre de plus. */}
              {!(
                tatoueur.type_fiche === "artiste" &&
                (tatoueur.modes ?? []).length > 0
              ) && (
                <span className="mt-[3px] flex shrink-0">
                  {iconeInfo("/adresse.png")}
                </span>
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
                  <BlocAdresses tatoueur={tatoueur} studioCourantId={studioCourant} />
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
                {/* L'ICÔNE « WORLD » remplace site.png : posée en
                    masque, à la MÊME taille (17 px), elle prend la
                    couleur de la ligne — donc elle passe au rose avec
                    le texte au survol, ce que l'ancienne image ne
                    faisait pas. */}
                <IconeWorld taille={16} />
                {/* LE TITRE CHOISI PAR LE TATOUEUR (passe nº 116) —
                    et, pour une fiche d'avant la migration nº 51, le
                    libellé d'avant (service ou domaine). */}
                {tatoueur.titre_site_web || libelleDuLien(tatoueur.site_web)}
              </a>
            )}
            {/* LA PAGE DE LIENS — SA PROPRE LIGNE, SON PROPRE LIBELLÉ
                (passe nº 102). Elle partageait le champ du site : on
                ne pouvait montrer que l'un des deux. Elle a désormais
                sa colonne, et elle s'affiche sous le site avec le nom
                du service — « Linktree », « Beacons » — que
                `libelleDuLien` lit dans l'adresse. Même icône que le
                site : les deux mènent ailleurs, sur le web. */}
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

          {/* 4. LA BIO — retours à la ligne SAISIS respectés
              (whitespace-pre-line), mots sans espace coupés proprement
              (overflow-wrap) : jamais de débordement. */}
          {tatoueur.bio && (
            <p className="mt-6 text-[15px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
              {tatoueur.bio}
            </p>
          )}

          {/* 5-6. INSTAGRAM puis TIKTOK — des badges au format des
              sections, PLEINE LARGEUR (jusqu'à la marge droite du
              bloc, comme la bio), l'icône ronde cerclée de blanc posée
              avec sa marge d'air égale. */}
          <div className="mt-8 flex flex-col gap-3">
            {badgeReseau("instagram")}
            {badgeReseau("tiktok")}
            {/* ⚠️ PLUS DE BADGE YOUTUBE (passe nº 101). YouTube a
                quitté le produit : le formulaire ne le propose plus.
                Le publier quand même reviendrait à afficher un lien
                que son propriétaire ne peut PLUS ni corriger ni
                retirer — un cul-de-sac sur sa propre fiche.
                ⚠️ LA DONNÉE N'EST PAS PERDUE : la colonne
                `lien_youtube` garde son contenu, et le formulaire ne
                l'écrit plus jamais. Rétablir l'affichage tiendrait en
                une ligne, ici. */}
          </div>


          {/* LES HORAIRES — juste sous les réseaux, AVANT l'équipe :
              « c'est ouvert ? » précède toujours « qui y travaille ? ».
              Réservé aux studios : un artiste reçoit sur rendez-vous,
              il n'a pas d'heures d'ouverture au public. */}
          {tatoueur.type_fiche !== "artiste" &&
            aDesHoraires(studioDesHoraires?.horaires) && (
            <div className={`mt-8 pt-7 ${separation}`}>
              <HorairesStudio
                horaires={studioDesHoraires?.horaires}
                fuseau={studioDesHoraires?.fuseau}
                titreClasse="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux"
              />
            </div>
          )}

          {/* L'ÉQUIPE — SOUS les adresses, et seulement pour un
              salon : c'est la deuxième chose qu'on vient y chercher,
              juste après « où est-ce ? ». Rien n'est stocké : les
              avatars se déduisent des rattachements validés, et
              disparaissent d'eux-mêmes quand un artiste passe hors
              ligne, supprime sa fiche, ou termine sa session guest. */}
          {(tatoueur.equipe ?? []).length > 0 && (
            <div className={`mt-8 pt-7 ${separation}`}>
              <BlocEquipe
                equipe={tatoueur.equipe}
                titreClasse="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux"
              />
            </div>
          )}

          {/* 7-9. LES TROIS SECTIONS — chacune ouverte par une ligne
              de séparation discrète (l'apanage de cette page), un
              titre plus affirmé, puis ses badges — tous de la même
              robe neutre. */}
          {groupesBadges.map(
            (groupe) =>
              groupe.slugs.length > 0 && (
                <div key={groupe.titre} className={`mt-8 pt-7 ${separation}`}>
                  <h2 className="text-[14px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                    {groupe.titre}
                  </h2>
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

          {/* 10. LE SIGNALEMENT — dernier bloc, derrière sa ligne.
              Pas d'aperçu : l'espace tatoueur ne se signale pas
              lui-même. EN DESSOUS, et non plus à côté : la mise hors
              ligne, action d'ADMINISTRATION — le composant ne rend
              rien tant que le SERVEUR n'a pas reconnu l'administrateur.
              CÔTE À CÔTE, les deux se ressemblaient trop : un lien
              PUBLIC (signaler) et un pouvoir d'ADMINISTRATION (retirer
              la fiche du site) n'ont rien à faire sur la même ligne.
              L'un reste un lien de texte gris ; l'autre descend d'un
              cran et prend la robe d'un BOUTON cerclé de rouge — on ne
              peut plus les confondre, ni les cliquer l'un pour
              l'autre. */}
          {!apercu && (
            <div
              className={`mt-8 pt-6 ${separation} flex flex-col items-start gap-4`}
            >
              <FenetreSignalement slug={tatoueur.slug} nom={tatoueur.nom} />
              <BoutonHorsLigne idFiche={tatoueur.id} nom={tatoueur.nom} />
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </Racine>
  );
}
