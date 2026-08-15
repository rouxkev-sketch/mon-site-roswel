"use client";

import { useMemo, useState } from "react";
import {
  libelleStyle,
  MARQUE_YOKOFOLIO,
} from "@/config/tatouage";
import { villeAffichee } from "@/lib/adresse";
import { BoutonPartageFiche } from "@/components/BoutonPartageFiche";
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { CarrouselPortfolio } from "@/components/CarrouselPortfolio";
import { ContenuFiche } from "@/components/ContenuFiche";
import { PileFiches } from "@/components/PileFiches";
import {
  galerieParStyles,
  ouvertureGalerie,
  serieDeLOuverture,
  serieMontree,
} from "@/lib/photo-tatoueur";
import { NATURE_PAR_DEFAUT, ensembleDeLaPhoto } from "@/lib/photos-tatoueur";
import type { Tatoueur } from "@/lib/tatoueurs";

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
  natureInitiale = "",
  apercu = false,
  suiviAuDepart = false,
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
  /** LA CATÉGORIE CHERCHÉE (réalisation, flash). Avec le style et le
      rendu, les trois désignent UN ENSEMBLE : la fiche s'ouvre alors
      sur cette série seule (nº 210-§1). */
  natureInitiale?: string;
  /** Vrai dans l'espace tatoueur (« Ma fiche ») : aperçu public SANS
      partage ni signalement, dans un <div> et non un <main>. */
  apercu?: boolean;
  /** SUIT-ON DÉJÀ CE TATOUEUR ? — la page l'a demandé au serveur
      (nº 208-§1) : le bouton naît juste, sans se corriger. */
  suiviAuDepart?: boolean;
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
      //  ⚠️ LES TROIS CRITÈRES, PAS DEUX (nº 217-§3) : la catégorie
      //  cherchée décide elle aussi du style ouvert et de la photo
      //  d'ouverture. Sans elle, « flash + aquarelle » ouvrait sur la
      //  première aquarelle — une RÉALISATION.
      ouvertureGalerie(
        galerieParStyles(tatoueur),
        styleInitial,
        renduInitial,
        natureInitiale
      ),
    [tatoueur, styleInitial, renduInitial, natureInitiale]
  );
  const groupes = ouverture.groupes;

  /** LE STYLE AFFICHÉ — c'est une vignette de l'onglet « Portfolio »
      qui en change, et le carrousel suit. */
  const [styleAffiche, setStyleAffiche] = useState(ouverture.style);
  /** LA SÉRIE OUVERTE (nº 204-§3) — catégorie + rendu d'une vignette
      touchée : le carrousel ne montre alors QUE cette galerie de
      dépôt. `null` à l'arrivée : le style entier, comme toujours.
      ⚠️ SAUF QUAND L'ADRESSE DÉSIGNE UN ENSEMBLE (nº 210-§1) : les
      trois tags réunis — style, catégorie, rendu — ne peuvent désigner
      qu'une série, et c'est elle qu'on vient voir (c'est le lien que
      « Ma sélection » écrit). */
  /*  ⚠️ LA CATÉGORIE SUFFIT À RESTREINDRE (nº 217-§3). Il fallait
      auparavant LES TROIS tags pour que le carrousel se limite à une
      série ; une recherche « flash + aquarelle », qui n'en porte que
      deux, laissait donc défiler les réalisations avec les flashs.
      `rendu` vide veut désormais dire « tous les rendus » : on montre
      ce qu'on est venu voir, sans jamais montrer autre chose. */
  /*  §4 (nº 272) — UN STYLE CHERCHÉ SANS CATÉGORIE VAUT
      « RÉALISATIONS ». La catégorie voyageait (nº 247) mais les
      chemins de recherche PAR STYLE SEUL (le champ « Recherche », les
      pages de style) n'en portent pas : la fiche montrait alors le
      style ENTIER, flashs compris. Chercher « réaliste », c'est
      chercher des réalisations réalistes — « Réalisations » est la
      catégorie par défaut du menu Explorer (NATURE_PAR_DEFAUT). La
      fiche ouverte depuis une recherche ne montre QUE le carrousel
      demandé — le style ET la catégorie ; le reste du travail reste
      accessible par l'onglet Portfolio. SANS recherche (lien direct,
      favoris, équipe d'un salon — aucun paramètre) : tout, comme
      toujours. Même règle dans FenetreFiche. */
  const serieCherchee =
    natureInitiale || styleInitial
      ? { nature: natureInitiale || NATURE_PAR_DEFAUT, rendu: renduInitial }
      : null;
  /*  §2 (nº 278) — SANS RECHERCHE, ON N'OUVRE PLUS « TOUT LE STYLE ».
      La règle 3 du carrousel (lib/photos-tatoueur) interdit de mêler
      deux galeries : le carrousel s'ouvre donc sur L'ENSEMBLE DE LA
      PREMIÈRE PHOTO de l'artiste — sa vitrine (règle 1). La consigne
      « sans recherche, montre tout » (nº 272-§4) est annulée par la
      définition de la nº 278-§0. Rien n'est perdu : les autres séries
      du style vivent dans l'onglet Portfolio, sous leurs vignettes. */
  const serieInitiale =
    serieCherchee ?? serieDeLOuverture(groupes, ouverture.style);
  const [serieOuverte, setSerieOuverte] = useState<{
    nature: string;
    rendu: string;
  } | null>(serieInitiale);
  /** L'INDICE de la photo affichée, DANS la série montrée. Une série
      restreinte commence à sa première photo — elle répond déjà à tout
      ce qui a été cherché. */
  const [indicePhoto, setIndicePhoto] = useState(
    serieCherchee ? 0 : ouverture.indice
  );

  const groupeAffiche =
    groupes.find((groupe) => groupe.slug === styleAffiche) ?? groupes[0];
  const photosDuStyleEntier = groupeAffiche?.photos ?? [];
  /*  §1 (nº 247) — LA SÉRIE VIENT DE `serieMontree`, L'ÉCRITURE
      UNIQUE : une catégorie demandée n'y est jamais violée. Le filtre
      qui vivait ici en double (page ET fenêtre superposée) est parti
      avec son repli « série vide → tout le style » — le chemin par
      lequel une réalisation entrait dans un carrousel de flashs. */
  const photosRestreintes = serieMontree(photosDuStyleEntier, serieOuverte);
  //  UN CARROUSEL VIDE N'EXISTE PAS : ce style n'a rien de la
  //  catégorie demandée (une adresse écrite à la main — `ouvertureGalerie`
  //  met sinon devant un style qui l'a). On montre alors le style
  //  entier, mais LA SÉRIE EST ABANDONNÉE : le carrousel ne déclare
  //  plus aucune catégorie, il ne prétend donc rien montrer d'autre
  //  que ce style.
  const serieEffective = photosRestreintes.length > 0 ? serieOuverte : null;
  const photosDuCarrousel =
    photosRestreintes.length > 0 ? photosRestreintes : photosDuStyleEntier;

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
  /**
   * L'ENSEMBLE DE LA PHOTO REGARDÉE — et il ne dépend plus du chemin
   * d'arrivée (nº 210-§2).
   * ⚠️ IL SE CALCULE DEPUIS LA GALERIE BRUTE du tatoueur, la seule
   * liste où chaque photo porte SES TROIS TAGS (style, catégorie,
   * rendu). Le carrousel, lui, est déjà groupé par style : ses photos
   * ne portent pas le leur, et ce qu'il contient dépend de la façon
   * dont on est arrivé — une vignette du portfolio ouvre un ensemble,
   * une carte de la mosaïque ouvre tout le style. En repartant de la
   * galerie, la réponse est la même par les deux chemins.
   */
  const galerieAffichee = ensembleDeLaPhoto(
    tatoueur.galerie ?? [],
    (tatoueur.galerie ?? []).find(
      (photo) => photo.id === photoAffichee?.cle
    ) ?? { style: "", rendu: null }
  ).map((photo) => photo.id);

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
      nom tient sa place — jamais de trou dans la mise en page. */  const boutonPartage = (
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
  const Racine = apercu ? "div" : "main";

  return (
    /*  LA PILE DES FICHES SUPERPOSÉES (nº 226-§5) : depuis cette page,
        un membre d'équipe ou le salon d'un profil s'ouvre en FENÊTRE
        par-dessus — web comme mobile — et le retour rend cette page,
        à sa position de défilement. Inactive en aperçu (« Ma fiche ») :
        les liens y restent des liens. */
    <PileFiches actif={!apercu}>
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
          {/*  ⚠️ LA PHOTO SE NOMME (nº 209-§5a) : le contenu partagé
               lit son bas pour savoir où arrêter la remontée, sans
               rien connaître de la géométrie de cette page. */}
          <div
            data-photo-fiche=""
            className="lg:w-[calc((100vh-119px)*0.8)] max-w-full mobile:-mx-4 mobile:-mt-4 mobile:max-w-none"
          >
            <CarrouselPortfolio
              photos={photosDuCarrousel}
              nomTatoueur={tatoueur.nom}
              styleLabel={groupeAffiche?.label ?? ""}
              //  §1 (nº 247) — LE CARROUSEL DIT CE QU'IL MONTRE : la
              //  catégorie qu'il déclare est celle de TOUTES ses
              //  photos, sans exception (rien quand il montre un style
              //  entier).
              natureDeLaSerie={serieEffective?.nature ?? ""}
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
                        galerie={galerieAffichee}
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
                    galerie={galerieAffichee}
                    variante="fiche-mobile"
                  />
                </div>
              )}
            </CarrouselPortfolio>
          </div>

          {/*  L'AVERTISSEMENT DE DÉMONSTRATION a rejoint le contenu
               partagé (nº 199) : il s'affiche en tête de la colonne,
               donc juste sous la photo au doigt. */}
        </div>

        {/* ---------- La colonne de lecture — L'ORDRE DU FICHIER DE
            RÉFÉRENCE : 1 nom · 2 adresse · 3 site · 4 bio ·
            5-6 réseaux · 7-9 les trois sections · 10 signalement —
            chaque grand bloc détaché d'une ligne. PAS de fil
            d'Ariane : la lecture commence par le nom.
            WEB : la colonne DÉFILE TOUTE SEULE (overflow-y-auto) dans
            la même hauteur que la photo — même butée haute (79 + 20),
            même hauteur maximale (100vh − 119) : la marge sous son
            contenu, à bout de course, égale la marge sous la photo.
            ⚠️ SON FOND EST ÉCRIT (nº 207-§4) : les deux blocs qui ne
            défilent pas (la rangée du haut, le sélecteur de catégorie)
            le reprennent par `bg-inherit` — le contenu partagé n'a
            ainsi aucune couleur d'enveloppe à connaître. C'est
            l'anthracite de la page : rien ne change à l'œil.
            ⚠️ ET IL VOYAGE PAR UNE VARIABLE (nº 209-§6) : `bg-inherit`
            ne prend que le fond du PARENT DIRECT — les blocs collants
            enfouis plus bas (le sélecteur de catégorie vit dans le
            panneau du portfolio) héritaient donc du transparent, et on
            voyait le contenu défiler derrière. Une variable, elle,
            traverse tout l'arbre. */}        <div className="lg:sticky lg:top-[99px] lg:self-start lg:max-h-[calc(100vh-119px)] lg:overflow-y-auto min-w-0 flex flex-col bg-sombre-fond [--fond-colonne:var(--rw-sombre-fond)]">
          {/*  ⚠️ LE CONTENU DE LA FICHE VIT DANS UN SEUL COMPOSANT
               (nº 199) : cette page et la fenêtre superposée du web
               affichent le MÊME. Ce qui reste ici est l'enveloppe — la
               grille à deux colonnes, la photo, et les boutons posés
               dessus. */}
          <ContenuFiche
            tatoueur={tatoueur}
            groupes={groupes}
            studioCourant={studioCourant}
            demonstration={demonstration}
            apercu={apercu}
            //  §3 (nº 276) — plus de natureCherchee / renduCherche : le
            //  panneau montre les deux sections, il n'a plus rien à
            //  ouvrir « au bon endroit ». La série cherchée continue,
            //  elle, d'ouvrir le carrousel ci-dessus (serieCherchee).
            suiviAuDepart={suiviAuDepart}
            surSerieChoisie={(serie) => {
              setStyleAffiche(serie.style);
              setSerieOuverte({ nature: serie.nature, rendu: serie.rendu });
              setIndicePhoto(0);
              /*  ⚠️ PLUS AUCUNE REMONTÉE ICI (nº 238-§1), ET C'EST LA
                  CAUSE DE « LA PAGE DESCEND ».
                  --------------------------------------------------
                  CE QUI SE PASSAIT, mesuré au banc depuis le bas de la
                  galerie (départ 2967) :
                    t=0 ms   → 0    (le saut instantané écrit ICI, nº 218-§3)
                    t=100 ms → 24
                    t=250 ms → 340
                    t=500 ms → 488  (le repère « sous la barre »)
                  DEUX mécanismes agissaient sur le même geste : ce
                  `scrollTo(0)` instantané, puis la remontée douce
                  ajoutée par la nº 236-§1. L'œil ne voit pas le saut —
                  il voit la page GLISSER VERS LE BAS de 0 à 488. Le
                  défaut n'était donc ni un calcul faux ni une hauteur
                  mal lue : c'était un mouvement de trop.
                  IL N'EN RESTE QU'UN, `remonterSousLaBarre` (dans
                  ContenuFiche), le MÊME que Profil / Portfolio —
                  mesuré au même repère, 488, et déclenché seulement
                  quand la nouvelle liste a sa hauteur définitive. */
            }}
          />
        </div>
      </div>
    </Racine>
    </PileFiches>
  );
}
