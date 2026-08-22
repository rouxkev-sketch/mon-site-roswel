"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CADRE_PHOTO_PORTFOLIO,
  libelleStyle,
  libelleTypeFiche,
  //  nº 366 — les dimensions intrinsèques de la photo sont désormais
  //  déclarées par `PhotoDeCarte`, l'écriture unique de l'image d'une
  //  carte : la réserve de hauteur ne se fait plus qu'à un endroit.
  PORTRAIT_ROND,
} from "@/config/tatouage";
import { useDispositionGrille } from "@/components/AffichageMosaique";
import { legendeDeCarte, photoChoisie, photoPourStyle } from "@/lib/photo-tatoueur";
import {
  ensembleDeLaPhoto,
  natureConnue,
  partiesDeGalerie,
  SEPARATEUR_GALERIE,
  vignetteDe,
} from "@/lib/photos-tatoueur";
//  §2 (nº 452) — le fanion revient sur les cartes de « Ma sélection »
//  (et d'elles seules) : l'import que la nº 445 avait retiré.
import { BoutonCoeurPhoto } from "@/components/BoutonCoeurPhoto";
import { PhotoDeCarte, TAILLES_CARTE } from "@/components/PhotoDeCarte";
import { ligneCarte, ligneCarteMobile } from "@/lib/adresse";
import { pincementRecent, usePincement } from "@/components/ZoomPincement";
//  ⚠️ TEMPORAIRE (nº 219-§1) — la sonde du carrousel compte les
//  cartes vivantes : c'est la ligne qui dit si naviguer dans un
//  portfolio reconstruit la mosaïque. Sans `?sonde-carrousel=1`,
//  ces appels ne coûtent rien.
import {
  noterDemontage as noterDemontageCarte,
  noterMontage as noterMontageCarte,
} from "@/lib/journal-carrousel";
import type { Tatoueur } from "@/lib/tatoueurs";
//  ⚠️ TEMPORAIRE (nº 175-§6) — la sonde-journal note l'ouverture d'une
//  fiche. Elle n'écrit RIEN sans `?sonde-bascule=1`.
import { noter, sauvegarderMaintenant } from "@/lib/journal-bascule";
import { mecanismeCoupe } from "@/lib/variantes-essai";

/**
 * LA CARTE D'UN TATOUEUR
 * ======================
 * NI CONTOUR, NI CADRE : une image, et son nom dessous. La carte ne
 * s'annonce pas, elle laisse voir. C'est le parti pris des galeries
 * d'aujourd'hui — ce qui tient la grille, c'est le rythme des images,
 * pas des rectangles dessinés autour.
 *
 * L'ombre est DOUCE au repos et se creuse au survol : elle donne du
 * relief sans jamais faire un contour. AUCUN grossissement de la photo
 * au survol — le curseur main suffit à dire que la carte se clique.
 *
 * SOUS L'IMAGE : LE PORTRAIT ROND, puis deux lignes de texte — le
 * nom, puis la ville, et rien de plus. Le portrait fait EXACTEMENT la
 * hauteur de ces deux lignes. Il disparaît en deux colonnes sur
 * smartphone, où la carte est trop étroite pour lui.
 * La seule chose posée DANS l'image est une pastille sombre ALLÉGÉE,
 * angle bas DROIT : « Artiste » ou « Salon ». Ni styles, ni icône de
 * réseau — les réseaux vivent sur la fiche.
 *
 * LA PHOTO SUIT LE STYLE CHERCHÉ (voir `photoPourStyle`) : qui cherche
 * « réalisme » voit le réalisme de ce tatoueur, pas sa première image.
 *
 * TOUTE LA CARTE EST CLIQUABLE et mène à la fiche, par le lien étiré
 * en fond (`after:absolute after:inset-0`).
 *
 * SMARTPHONE (variante `mobile:`) : la grille imite Instagram — image
 * aux ANGLES DROITS, bord à bord, nom un cran plus discret (la ville
 * ne change pas). La photo s'AGRANDIT AU PINCEMENT à deux doigts
 * (usePincement) : le lien étiré recouvre l'image, c'est donc LA
 * CARTE ENTIÈRE qui écoute les doigts, et SEULE LA PHOTO qui grossit.
 * Un pincement n'ouvre JAMAIS la fiche : seul le tap simple navigue
 * (garde `pincementRecent` dans `auClic`).
 */
function CarteTatoueurNue({
  tatoueur,
  styleRecherche = "",
  renduRecherche = "",
  natureRecherche = "",
  photoRecherche = "",
  prioritaire = false,
  phototheque = false,
  fanion = false,
  surOuverture,
  surApproche,
}: {
  /** LA VUE PHOTOTHÈQUE (nº 140) : la photo seule — ni badge, ni
      portrait, ni nom, ni adresse. SEUL LE FANION des favoris reste,
      dans l'angle (et seulement là où il est encore posé — voir
      `fanion` ci-dessous). Le clic mène à la fiche, comme toujours. */
  phototheque?: boolean;
  /**
   * §2 (nº 452) — LE FANION REVIENT, ET SEULEMENT SUR « MA SÉLECTION ».
   * ------------------------------------------------------------------
   * La nº 445 l'avait retiré de TOUTES les cartes ; le propriétaire le
   * rend à la page « Ma sélection » (retirer un favori depuis la page
   * redevient possible) et à elle seule — la mosaïque du moteur reste
   * sans fanion. UN RÉGLAGE EXPLICITE, JAMAIS UNE DEVINETTE D'ADRESSE
   * (le mot d'ordre de la nº 365) : PageFavoris le passe, personne
   * d'autre. Vrai : le fanion vit dans l'angle bas droit de l'image,
   * VISIBLE EN PERMANENCE (l'ancien réglage `toujours`), même
   * comportement (règle 137 : son état se charge côté navigateur).
   */
  fanion?: boolean;
  tatoueur: Tatoueur;
  /** Le style demandé dans le moteur, s'il y en a un. */
  styleRecherche?: string;
  /** LE RENDU demandé, s'il n'en reste qu'un allumé : chercher de la
      couleur et tomber sur du noir et gris serait un mensonge
      d'affichage. */
  renduRecherche?: string;
  /** LA CATÉGORIE demandée (réalisation, flash) — la carte montre alors
      une photo QUI EN EST (nº 216-§1). */
  natureRecherche?: string;
  /** §4 (nº 302) — L'IDENTIFIANT D'UNE PHOTO PRÉCISE, quand la carte
      EST une photo (« Ma sélection de photos »). Il voyage dans
      l'adresse : au doigt, où la carte NAVIGUE, la fiche s'ouvre alors
      sur cette photo-là. Vide partout ailleurs — une carte de mosaïque
      montre un carrousel, pas une image choisie. */
  photoRecherche?: string;
  /** LES PREMIÈRES CARTES DE LA GRILLE. Leur photo est celle que
      Google mesure (le « plus grand élément affiché ») : elle ne doit
      PAS être différée — voir GrilleTatoueurs. */
  prioritaire?: boolean;
  /** GRAND ÉCRAN (≥ 1024 px) : ouvre la FENÊTRE de fiche par-dessus la
      grille au lieu de naviguer (mécanique d'Instagram). Le lien reste
      un vrai lien : clic du milieu, Ctrl+clic et moteurs de recherche
      vont toujours à la page /tatoueur/nom. */
  /** §2 (nº 371) — L'OUVERTURE EN FENÊTRE reçoit désormais LA PHOTO
      REGARDÉE : sans elle, le web rouvrait la première du carrousel
      alors que le doigt, lui, l'emportait déjà dans l'adresse. Les
      deux chemins disent maintenant la même chose. */
  surOuverture?: (tatoueur: Tatoueur, photoRegardee: string) => void;
  /** LE SURVOL (web) : la grille en profite pour demander d'avance la
      fiche complète — au clic, la fenêtre a déjà tout. N'a aucun effet
      visible. */
  surApproche?: (tatoueur: Tatoueur) => void;
}) {
  const photo = photoPourStyle(
    tatoueur,
    styleRecherche,
    renduRecherche,
    natureRecherche
  );
  /** LA PHOTO EXACTE QU'ON REGARDE — c'est ELLE que le cœur
      enregistre, pas « une photo de ce tatoueur ». Absente quand la
      galerie est vide (fiche d'avant le portfolio catalogué, ou fiche
      de démonstration) : le cœur ne s'affiche alors pas — enregistrer
      une image qui n'existe pas en base n'aurait aucun sens. */
  const photoEnregistrable = photoChoisie(
    tatoueur,
    styleRecherche,
    renduRecherche,
    natureRecherche
  );
  /** En « une colonne » (bouton de disposition, vrais mobiles), le
      nom et la localité GRANDISSENT sous la grande image. La valeur
      vient de L'ADRESSE (nº 203-§1b), servie par le serveur. */
  const disposition = useDispositionGrille();
  const uneColonne = disposition === "une";
  /*  §2 (nº 365), levé à la nº 369 — LE CROCHET D'APPAREIL A DISPARU
      D'ICI, et c'est un gain. Il servait à décider en JavaScript ce que
      la carte montre selon le doigt ou la souris ; tout cela se décide
      désormais EN CSS (variantes `mobile:` et `pointer-fine:`, posées
      sur `data-appareil` et sur le média du pointeur). Deux
      conséquences : le rendu du serveur est déjà le bon — plus de
      première image « web » corrigée une image plus tard —, et il n'y a
      plus qu'une seule autorité sur cette question, la feuille de
      style. La règle de la nº 60 (l'appareil, jamais la largeur) est
      tenue par la variante elle-même. */

  /**
   * §5 (nº 211) — LES PHOTOS QUI DÉFILENT DANS LA CARTE
   * ==================================================================
   * L'ENSEMBLE de la photo montrée : même style, même catégorie, même
   * rendu (la définition du site, lib/photos-tatoueur). C'est
   * exactement ce que le CŒUR de la carte enregistre — on fait donc
   * défiler ce qu'on aime, et rien d'autre : aucun état à tenir
   * d'accord entre les deux.
   * ⚠️ EN PLEINE LARGEUR SEULEMENT, et seulement s'il y a plus d'une
   * photo. En deux colonnes, une carte fait 190 px : y faire défiler
   * des images n'apporterait rien et volerait le défilement vertical
   * de la mosaïque.
   */
  const photosDeLaCarte = photoEnregistrable
    ? ensembleDeLaPhoto(tatoueur.galerie, photoEnregistrable).map((entree) => ({
        cle: entree.id,
        url: entree.url,
        miniature: vignetteDe(entree),
        rendu: entree.rendu,
        nature: natureConnue(entree.nature),
        legende: "",
      }))
    : [];
  /** ⚠️ LE TEXTE ET LE DÉFILEMENT SONT INDÉPENDANTS (nº 213-§1) : la
      photothèque masque les TEXTES, elle n'a jamais eu à décider si
      les photos défilent. La condition `!phototheque` les liait, et
      retirer le texte emportait le défilement et ses ronds. */
  /**
   * §1 (nº 367) — LES DEUX FORMATS DÉFILENT, AU DOIGT.
   * ------------------------------------------------------------------
   * CE QUI L'EMPÊCHAIT : rien n'était désactivé, et aucune photo ne
   * manquait — LE CARROUSEL N'ÉTAIT PAS MONTÉ. La condition exigeait
   * `uneColonne` : en deux colonnes, la carte rendait une image simple,
   * et il n'y avait donc rien à faire défiler. La borne datait de la
   * nº 211-§5 (« une carte de 190 px : y faire défiler des images
   * n'apporterait rien ») ; le propriétaire la lève.
   * ⚠️ LE WEB NE BOUGE PAS : il garde exactement sa condition d'avant
   * (`uneColonne`), et n'a donc de défilé que si l'adresse demande la
   * pleine largeur — comme aujourd'hui.
   * ⚠️ AUCUNE PHOTO NE CHANGE À L'ÉCRAN : la première du défilé est
   * `photosDeLaCarte[0]`, et c'est exactement celle que l'image simple
   * montrait (`photoChoisie` rend la PREMIÈRE de l'ensemble dans
   * l'ordre de l'artiste — lib/photo-tatoueur). Même adresse d'image,
   * donc rien à retélécharger et rien à voir passer.
   */
  /**
   * ██ §2 (nº 395) — LE STYLE ÉCRIT SOUS LA CARTE ██
   * ==================================================================
   * QUEL STYLE, ET POURQUOI CELUI-LÀ : celui de LA PHOTO QU'ON REGARDE
   * (`photoEnregistrable.style`). C'est la seule réponse qui ne mente
   * pas — la photo d'une carte est choisie par `photoPourStyle` selon
   * ce que le moteur cherche, elle n'est pas « la première image de
   * l'artiste ».
   *
   * ⚠️ LE LIBELLÉ NE SUIT PAS LE DÉFILÉ, ET IL N'A PAS À LE SUIVRE :
   * `photosDeLaCarte` est L'ENSEMBLE de la photo montrée — même style,
   * même catégorie, même rendu (§5, nº 211, et `ensembleDeLaPhoto`).
   * Une carte ne fait donc défiler QU'UN SEUL style : faire suivre le
   * texte reviendrait à réécrire le même mot. C'est exactement la
   * raison écrite à la nº 376 pour le titre de galerie de la fiche.
   *
   * ⚠️ LES DEUX REPLIS, DANS CET ORDRE, ET LA LIGNE N'EST JAMAIS VIDE :
   *  · pas de photo en base (fiche d'avant le portfolio catalogué, ou
   *    fiche de démonstration) → LE PREMIER STYLE DÉCLARÉ de l'artiste,
   *    qui reste vrai de lui même si aucune image ne l'illustre ;
   *  · aucun style déclaré non plus → LE NOM DE L'ARTISTE, c'est-à-dire
   *    EXACTEMENT la ligne d'aujourd'hui. Jamais un blanc, jamais une
   *    ligne vide : la hauteur du bloc de texte est la même au pixel
   *    dans les trois cas (règle nº 226), donc la carte ne change ni de
   *    taille ni de place.
   * ⚠️ LE MOT DU CATALOGUE, PAS LE SLUG : `libelleStyle` — l'écriture
   * unique de la charte, celle que la fiche et les filtres emploient.
   *
   * ██ §9 (nº 405) — LE RENDU SUIT LE STYLE : « Réalisme • Noir et gris » ██
   * ==================================================================
   * C'EST `titreDeGalerie` QUI L'ÉCRIT, et non une recomposition
   * locale : le libellé demandé est EXACTEMENT le sien — « Style •
   * Rendu », la puce U+2022 de la nº 393, le mot du catalogue pour le
   * rendu (`libelleRendu`). Le consommer plutôt que de le refaire, ce
   * n'est pas seulement plus court : c'est ce qui garantit que la
   * ligne sous une carte, le titre sous la fenêtre du web (nº 393) et
   * la ligne sous la photo au doigt (nº 376) ne pourront jamais
   * diverger — la nº 404 vient d'ajouter « Noir » à la liste des
   * rendus, et cette carte l'a suivi sans qu'on la touche.
   *
   * ⚠️ IL PORTE DÉJÀ LES DEUX GARDES DONT CETTE LIGNE A BESOIN :
   *  · rendu absent → LE STYLE SEUL, jamais une puce orpheline. C'est
   *    le cas des replis ci-dessous (le premier style DÉCLARÉ d'un
   *    artiste sans photo n'a évidemment pas de rendu) ;
   *  · style absent → la chaîne VIDE, que le `||` suivant rattrape en
   *    retombant sur le nom de l'artiste.
   * ⚠️ LE RENDU NE SUIT PAS LE DÉFILÉ, POUR LA RAISON QUI VAUT DÉJÀ
   * POUR LE STYLE : `photosDeLaCarte` est L'ENSEMBLE de la photo
   * montrée — même style, même catégorie, MÊME RENDU. Une carte ne
   * fait donc défiler qu'un seul rendu ; le libellé est figé par
   * construction, il n'y a rien à synchroniser.
   */
  const styleDeLaCarte =
    photoEnregistrable?.style || tatoueur.styles?.[0] || "";
  /**
   * ██ §1 (nº 407) — LE STYLE EN GRAS, LE RESTE EN NORMAL ██
   * ------------------------------------------------------------------
   * « **Réalisme** • Noir et gris ». Il faut donc les DEUX PARTIES,
   * là où la nº 405 se contentait de la chaîne entière.
   * ⚠️ ELLES NE SONT PAS RECOMPOSÉES ICI : `partiesDeGalerie` est
   * devenue LA SOURCE du libellé (lib/photos-tatoueur), et
   * `titreDeGalerie` sa mise bout à bout. La puce et le mot du rendu
   * ne sont écrits qu'à cet endroit-là ; cette carte ne fait que
   * peindre ce qu'on lui rend. Aucune divergence possible avec le
   * titre de la fiche ou celui de la fenêtre du web.
   */
  /**
   * ██ §1 (nº 480) — LE STYLE S'ÉCRIT MAINTENANT SUR TOUTES LES CARTES ██
   * ------------------------------------------------------------------
   * IL NE DÉPEND PLUS DE LA SURFACE. La nº 395 réservait cette ligne à
   * l'accueil au repos, parce qu'elle PRENAIT LA PLACE du nom : il
   * fallait choisir. La carte a désormais TROIS lignes — le style au
   * premier rang, le nom au deuxième —, et le choix n'existe plus : les
   * deux sont là, partout. Le réglage `premiereLigne` est donc retiré
   * de ce composant et de ceux qui le passaient (GrilleTatoueurs,
   * IndexTatoueurs) : un réglage sans objet est un piège pour la passe
   * suivante.
   * ⚠️ RIEN D'AUTRE NE CHANGE DANS LE CALCUL : même source
   * (`partiesDeGalerie`, lib/photos-tatoueur), mêmes replis, même
   * rendu — celui de la photo montrée, et rien d'autre : le repli
   * « premier style déclaré » n'a pas de photo, donc pas de rendu, et
   * la fonction rend alors le style seul (jamais une puce orpheline).
   * ⚠️ ET QUAND IL N'Y A RIEN À DIRE, LA LIGNE NE S'ÉCRIT PAS : sans
   * style connu, `partiesDeGalerie` rend `null` et la première ligne
   * est simplement absente (voir le rendu). On n'invente pas un
   * contenu de remplacement, et l'on n'écrit pas une ligne vide.
   */
  const partiesDuTitre = partiesDeGalerie(
    styleDeLaCarte ? libelleStyle(styleDeLaCarte) : "",
    photoEnregistrable?.style ? photoEnregistrable.rendu : null
  );
  /**
   * §2 (nº 372) — LA CLÉ DE CETTE CARTE, pour la mémoire des photos.
   * La même que celle de la mosaïque (`carrousel.cle`, sinon
   * l'identifiant de la fiche — deux galeries d'un même artiste sont
   * deux cartes), plus la photo que « Ma sélection » désigne : sur
   * cette page, une même fiche peut avoir plusieurs cartes.
   */
  const cleDeLaCarte = `${tatoueur.carrousel?.cle ?? tatoueur.id}|${photoRecherche}`;
  /*  §1 (nº 445) — PLUS D'ÉTAT DE POSITION DANS LA CARTE : le
      carrousel parti, il n'y a plus de rang courant à tenir, ni de
      mémoire de photo à semer d'une visite à l'autre
      (lib/memoire-cartes n'est plus appelée d'ici). La photo est
      fixe : c'est celle que `photoPourStyle` choisit, comme la
      colonne 0 du défilé d'hier. */
  /**
   * §3 (nº 365) — LA PHOTO QU'ON REGARDE. Sans défilé (une seule
   * photo), c'est la photo choisie de la carte — comme avant. Avec
   * défilé, c'est celle du rang courant ; le repli garde la photo
   * choisie si le rang sort de la liste (recomposition, filtre qui
   * change).
   * §2 (nº 371) — ELLE SERT MAINTENANT DEUX FOIS, et c'est voulu :
   * le FANION l'enregistre (nº 365), et le LIEN l'emporte jusqu'à la
   * fiche. Une seule valeur, donc jamais deux vérités sur « quelle
   * photo je regarde ». `photoRecherche` (« Ma sélection », nº 302)
   * reste le point de départ quand la carte EST une photo précise :
   * c'est aussi le rang 0 de son défilé, les deux disent la même
   * chose tant qu'on n'a pas fait défiler.
   */
  //  ⚠️ `||` ET NON `??` : `photoRecherche` vaut la CHAÎNE VIDE quand
  //  personne ne l'a passée — `??` ne la sauterait pas, et la carte
  //  perdrait sa photo. Ici, « vide » veut dire « rien à dire ».
  const photoRegardee =
    photosDeLaCarte[0]?.cle ||
    photoRecherche ||
    photoEnregistrable?.id ||
    "";

  /** Le lieu de la fiche, tel que les deux écritures de la ligne le
      lisent (voir plus bas, nº 212-§6). */
  const lieuDeLaCarte = {
    ville: tatoueur.ville_nom,
    region: tatoueur.region,
    pays: tatoueur.pays,
    code_pays: tatoueur.code_pays,
  };

  /** LE ZOOM AU PINCEMENT (vrais mobiles) : la carte écoute, la photo
      grossit — voir ZoomPincement.tsx pour la mécanique. */
  const zoneCarte = useRef<HTMLElement>(null);
  const cadrePhoto = useRef<HTMLDivElement>(null);
  const gestesPincement = usePincement({
    ecoute: zoneCarte,
    cible: cadrePhoto,
    //  Les zooms des CARTES se comptent à part de celui de la fiche
    //  (nº 219-§1) : le relevé doit pouvoir dire « zéro montage de
    //  carte » quand on navigue dans un portfolio.
    nom: "zoom (carte)",
  });

  /*  SONDE (nº 219-§1) — LA CARTE EST-ELLE REMONTÉE ? Le relevé de la
      nº 218 montrait vingt-quatre montages en bloc à chaque changement
      de sélecteur : c'est ce compteur qui doit rester à plat. */
  useEffect(() => {
    noterMontageCarte("carte");
    return () => noterDemontageCarte("carte");
  }, []);

  /** L'ADRESSE DE LA FICHE — elle EMPORTE le style cherché (?style=…) :
      la fiche ouvre alors son carrousel sur la photo de CE style, la
      continuité exacte de la photo de la carte. Calculée une fois : le
      lien l'affiche, et la navigation de document du smartphone s'en
      sert aussi. */
  const adresseFiche = (() => {
    const suite = new URLSearchParams();
    if (styleRecherche) suite.set("style", styleRecherche);
    if (renduRecherche) suite.set("rendu", renduRecherche);
    //  LA CATÉGORIE VOYAGE AVEC (nº 216-§1) : la fiche s'ouvre alors
    //  sur l'ensemble qu'on regardait, pas sur tout le style.
    if (natureRecherche) suite.set("nature", natureRecherche);
    /*  §2 (nº 371) — LA PHOTO QU'ON REGARDE PART AVEC LE LIEN.
        ------------------------------------------------------------
        AVANT : seule « Ma sélection » désignait une photo
        (`photoRecherche`, nº 302-§4) ; une carte de mosaïque n'en
        disait rien, et la fiche s'ouvrait sur la première du
        carrousel — même si l'on avait fait défiler jusqu'à la sixième.
        DÉSORMAIS : c'est LA PHOTO AFFICHÉE à l'instant du clic
        (`photoRegardee`, le rang du défilé — la même valeur que le
        fanion enregistre depuis la nº 365). Sans défilé, c'est la
        photo choisie de la carte : l'adresse dit alors exactement ce
        qu'elle montrait déjà.
        ⚠️ AUCUN MÉCANISME NOUVEAU : `?photo=` existe depuis la nº 302,
        la fiche sait le lire (FicheSelonLAdresse → `photoInitiale` →
        `ouvertureSurUnePhoto`), et l'adresse reste la SEULE mémoire de
        cet état (règles 328/329). Le lien change de cible à mesure
        qu'on fait défiler — un attribut, pas une navigation : le
        défilement ne crée toujours aucune entrée d'historique. */
    if (photoRegardee) suite.set("photo", photoRegardee);
    const requete = suite.toString();
    return requete
      ? `/tatoueur/${tatoueur.slug}?${requete}`
      : `/tatoueur/${tatoueur.slug}`;
  })();

  /** LA BALISE DE POPULARITÉ : chaque clic vers la fiche est signalé
      au serveur (qui dédoublonne par visiteur sur 24 h et écarte les
      robots — voir /api/tatoueur/clic). `sendBeacon` : l'envoi part
      sans retarder la navigation, et survit même au départ de la
      page. Jamais bloquant, jamais d'erreur visible. */
  function signalerClic() {
    //  nº 353 — porte du banc (FAMILLE 2 du complément) : la balise
    //  est la seule API de la chaîne du toucher — la couper dit si
    //  elle consomme l'activation que l'auto-réparation dépense.
    if (mecanismeCoupe("balise")) return;
    try {
      const corps = new Blob([JSON.stringify({ slug: tatoueur.slug })], {
        type: "application/json",
      });
      if (!navigator.sendBeacon?.("/api/tatoueur/clic", corps)) {
        fetch("/api/tatoueur/clic", {
          method: "POST",
          body: JSON.stringify({ slug: tatoueur.slug }),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Navigateur sans balise : le clic ne sera pas compté, c'est tout.
    }
  }

  /** N'intercepte QUE le clic simple, sur les APPAREILS À SOURIS
      (toute largeur de fenêtre — la fenêtre superposée sait s'y
      adapter) : toute autre combinaison (nouvel onglet, clic du
      milieu…) garde le lien, et les vrais mobiles naviguent vers la
      page. Le clic est COMPTÉ dans tous les cas — SAUF au sortir d'un
      pincement : agrandir une photo n'est pas choisir une fiche. */
  function auClic(evenement: React.MouseEvent) {
    if (pincementRecent()) {
      evenement.preventDefault();
      return;
    }
    signalerClic();
    //  ⚠️ TEMPORAIRE (nº 175-§6) — LA SONDE-JOURNAL. On note QUELLE
    //  fiche on ouvre et D'OÙ on part : sans la position de départ,
    //  aucun retour ne peut être jugé. N'écrit rien sans
    //  `?sonde-bascule=1`.
    noter(
      `OUVERTURE FICHE ${tatoueur.slug} · défilement ${Math.round(
        window.scrollY
      )} · depuis ${window.location.pathname}${window.location.search}`
    );
    //  Le journal part avec nous : la page suivante le relira.
    sauvegarderMaintenant();
    // Nouvel onglet, clic du milieu… : on ne touche à rien.
    if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;

    /**
     * SUR SMARTPHONE : LA MÊME NAVIGATION INTERNE QUE SUR LE WEB
     * ===========================================================
     * (refonte nº 191)
     * ⚠️ LE `location.assign` A ÉTÉ SUPPRIMÉ, ET AVEC LUI L'ESSAI
     * `?essai=document` qui l'allumait. Il avait été fabriqué pour une
     * hypothèse : le balayage du doigt ne révèle une capture que si la
     * page précédente est un VRAI document, donc une navigation de
     * document devait rendre l'image manquante. Éprouvée sur l'iPhone
     * du propriétaire, elle n'a rien rendu — l'écran reste noir — et
     * elle coûtait tout le reste : document rechargé, page reconstruite,
     * mosaïque et position à retrouver par des mémoires parallèles.
     *
     * Une carte est donc un LIEN ORDINAIRE, sur mobile comme sur le
     * web : on ne fait rien, et `<Link>` navigue. La mosaïque n'est pas
     * démontée par un rechargement, l'adresse porte tout ce qu'il faut
     * pour la reconstruire (critères ET nombre de pages), et le retour
     * la retrouve telle quelle.
     *
     * ⚠️ SUR LE WEB, la fiche s'ouvre en FENÊTRE superposée
     * (`surOuverture`) : la grille n'est jamais démontée. C'est le seul
     * cas où l'on intercepte le clic.
     */
    if (document.documentElement.dataset.appareil === "mobile") {
      // ⚠️ ON S'ARRÊTE ICI : sur un vrai mobile, la fenêtre superposée
      // du web n'a rien à faire. Sans cet arrêt, le lien ouvrait la
      // fenêtre au lieu de naviguer — mesuré.
      return;
    }

    if (!surOuverture) return;
    evenement.preventDefault();
    //  §2 (nº 371) — la photo affichée à CET instant part avec.
    surOuverture(tatoueur, photoRegardee);
  }

  return (
    <article
      ref={zoneCarte}
      //  Son identité, pour la retrouver après un changement de
      //  disposition (voir src/lib/carte-du-haut.ts).
      //  §1 (nº 279) — C'EST LA CLÉ DU CARROUSEL quand la carte en
      //  montre un : deux galeries d'un même artiste sont deux cartes
      //  distinctes, et la mémoire de position doit pouvoir les
      //  distinguer — l'identifiant de la fiche ne le peut plus.
      data-carte={tatoueur.carrousel?.cle ?? tatoueur.id}
      /**
       * ██ §3 (nº 424) — `content-visibility: auto` EST RETIRÉ DE LA
       * CARTE, ET VOICI POURQUOI ██
       * ------------------------------------------------------------
       * CE QU'IL FAISAIT (nº 224-§4) : une carte hors champ n'était ni
       * mise en page ni peinte, et `contain-intrinsic-size: auto 460px`
       * tenait sa place — la hauteur MÉMORISÉE pour une carte déjà vue,
       * 460 px d'estimation pour les autres.
       *
       * CE QU'IL COÛTAIT, constaté sur l'iPhone du propriétaire : LA
       * REMONTÉE PAR PALIERS après une pagination — « la première ligne
       * de cartes descend, se bloque, remonte de plusieurs centimètres,
       * puis la suivante fait pareil ». Le mécanisme : en remontant,
       * chaque rangée qui rentre dans le champ est REMISE EN PAGE à sa
       * hauteur réelle (≈ 300 px en deux colonnes, ≈ 550 en une — les
       * 460 estimés ne sont justes nulle part) ; et sur WebKit — Chrome
       * sur iPhone EST WebKit — le garde-fou de la nº 224-§3 n'existe
       * pas : `overflow-anchor: none` n'y est pas implémenté, l'ANCRAGE
       * NATIF reste actif, et il « compense » chaque correction de
       * hauteur en déplaçant le défilement. Une rangée, un à-coup.
       * (La hauteur mémorisée n'y sauve rien : WebKit rejoue la mise en
       * page des cartes dé-sautées par vagues, et chaque vague ancre.)
       *
       * CE QUI GARDE LA MÉMOIRE SOUS CONTRÔLE SANS LUI : le SECOND
       * levier de la nº 224-§4 — l'observateur unique de la grille qui
       * rend la SOURCE des images à plus de deux écrans (les bitmaps
       * décodés, le vrai poids) — reste entier. Le squelette DOM d'une
       * carte (une image, trois lignes) est léger ; c'est l'image
       * décodée qui tuait l'onglet, et elle reste libérée.
       */
      className="group relative flex flex-col"
      // Le doigt garde le défilement ; le pincement, non — il zoome
      // la photo (jamais la page).
      style={{ touchAction: "pan-x pan-y" }}
      onPointerEnter={surApproche ? () => surApproche(tatoueur) : undefined}
      {...gestesPincement}
    >
      {/* L'ENVELOPPE DE LA PHOTO — elle ne bouge JAMAIS. C'est elle
          qui porte le badge : le pincement ne transforme que le cadre
          intérieur, le badge reste donc à sa place et à sa taille,
          comme le badge de style des fiches. */}
      <div className="relative">
        {/* La photo : 4:5, elle porte la carte. Angles DROITS partout —
            la grille assume le rythme des images, sans coins adoucis.
            C'est CE CADRE ENTIER que le pincement agrandit (il passe
            par-dessus ses voisines le temps du geste, puis se range). */}
        <div
          ref={cadrePhoto}
          className={`relative w-full ${CADRE_PHOTO_PORTFOLIO} overflow-hidden rounded-none
                     bg-sombre-eleve
                     shadow-[0_2px_12px_rgba(0,0,0,0.35)]
                     transition-shadow duration-300
                     group-hover:shadow-[0_12px_34px_rgba(0,0,0,0.55)]`}
        >
          {/*  ⚠️ LA SOURCE NE DÉPEND PAS DE LA DISPOSITION (nº 175-§5),
               ET CELA DOIT LE RESTER.
               ------------------------------------------------------
               Le propriétaire voit l'écran se vider à la bascule de
               disposition — et presque jamais au bouton du texte. La
               seule différence entre les deux : la disposition change
               la LARGEUR des cartes. Si la largeur demandée changeait
               avec elle, le navigateur écarterait les images qu'il a
               pour en retélécharger d'autres, et il ne resterait que le
               fond le temps du chargement.
               ELLE NE CHANGE PAS, et c'est vérifié : `photo` est
               calculée SANS jamais lire `disposition` ; il n'y a ni
               `srcset` ni `sizes` — donc AUCUNE largeur négociée ; et
               les dimensions déclarées sont celles de la PLEINE
               LARGEUR (1080 × 1350), en deux colonnes comme en une.
               L'image chargée est donc réutilisée telle quelle, et
               seuls les styles la redimensionnent.
               ⚠️ NE JAMAIS introduire ici un `sizes`, un `srcset`, une
               largeur dans l'URL, ni une source choisie d'après
               `uneColonne` : ce serait exactement le défaut. */}
          {/*  §5 (nº 211) — EN PLEINE LARGEUR AU DOIGT, LES PHOTOS DE
               L'ENSEMBLE DÉFILENT DANS LA CARTE.
               C'est LE MÊME carrousel que la fiche (nº 209-§7) :
               défilement natif, accrochage, aucune largeur mesurée. En
               variante « carte » il ne montre que les MINIATURES,
               n'affiche ni compteur ni flèches, laisse le pincement à
               la carte, et ne charge la suite qu'au premier geste.
               ⚠️ IL PASSE AU-DESSUS DU LIEN ÉTIRÉ (`z-[1]`) : sinon le
               pseudo-élément du nom recouvrirait l'image et capterait
               le glissement. Chaque photo est donc elle-même un lien —
               un toucher ouvre la fiche, un glissement défile.
               En deux colonnes et sur le web : l'image simple d'avant,
               inchangée. */}
          {/*  ██ §1 (nº 445) — LA CARTE NE FAIT PLUS DÉFILER : UNE SEULE
               PHOTO, FIXE ██
               ------------------------------------------------------
               DÉCISION DU PROPRIÉTAIRE (passe nº 445) : le carrousel de
               la carte est retiré, mobile comme ordinateur. Partent
               avec lui, tous portés par ce carrousel : le glissement
               sur la photo, les FLÈCHES du web et la CAPSULE de
               défilement (le compteur, en haut de l'image).
               ⚠️ AUCUNE PHOTO NE CHANGE À L'ÉCRAN, et c'est la règle
               175-§5 : la colonne 0 du défilé ÉTAIT déjà l'image que
               PhotoDeCarte affiche ci-dessous (`photoPourStyle`, la
               même source, la même adresse — la note nº 367/369 le
               disait dans l'autre sens). Rien à retélécharger, rien à
               voir passer.
               ⚠️ LES CARROUSELS DES FICHES NE SONT PAS CONCERNÉS : la
               page de fiche et la fenêtre superposée montent leur
               propre CarrouselPortfolio, intact — ils défilent comme
               avant.
               ⚠️ LE PINCEMENT RESTE (nº 276) : il vit sur la carte,
               pas sur le carrousel.
               §1 (nº 366) — L'ÉCRITURE UNIQUE DE LA PHOTO DE CARTE
              (components/PhotoDeCarte) : elle part de l'ORIGINAL quand
              la photo est cataloguée, et laisse l'optimiseur fabriquer
              la taille exacte de l'écran, densité comprise. La
              démonstration (SVG) et les fiches d'avant le catalogue
              n'ont pas d'original : elles sont servies telles quelles,
              exactement comme avant. La réserve de hauteur, le
              chargement paresseux et la priorité ne bougent pas. */}
          <PhotoDeCarte
            url={photo}
            urlPleine={photoEnregistrable?.url}
            tailles={TAILLES_CARTE}
            // CE QUE MONTRE VRAIMENT LA CARTE : le nom, la ville, et le
            // style (avec le rendu quand la photo est taguée) — voir
            // `legendeDeCarte`.
            alt={legendeDeCarte(
              tatoueur,
              styleRecherche,
              renduRecherche,
              natureRecherche
            )}
            // LES PREMIÈRES CARTES NE SONT PAS DIFFÉRÉES : l'image
            // mesurée par Google ne doit pas attendre le défilement.
            chargement={prioritaire ? "eager" : "lazy"}
            priorite={prioritaire ? "high" : undefined}
            classe="w-full h-full object-cover"
          />
        </div>

        {/* LE BADGE « Artiste » / « Salon » — DANS l'image, angle bas
            DROIT. UNE PASTILLE SOMBRE, ALLÉGÉE : le noir à 38 %
            seulement, avec un flou d'arrière-plan qui va chercher la
            couleur de la photo en dessous. AUCUN CONTOUR : le liseré
            blanc qu'il portait dessinait un objet là où l'on voulait
            juste une ombre posée — il se voyait plus que le texte.
            Le texte reste blanc : il se lit sur une photo sombre
            comme sur une photo claire, sans jamais s'imposer.
            LE CALAGE, tenu au pixel : `inline-flex` + `justify-center`
            + `items-center`, une HAUTEUR FIXE et `leading-none`. Le
            texte est alors centré pour de bon, horizontalement comme
            verticalement — les 10 px de retrait sont exactement les
            mêmes à gauche et à droite, et la hauteur de ligne ne
            décale plus le mot vers le haut. */}
        {/*  ⚠️ LE BADGE A QUITTÉ L'IMAGE (nº 211-§2). Il disait une
             chose utile — artiste, salon ou studio — mais il la disait
             SUR la photo, qui est le sujet. Il est désormais le
             PREMIER MOT DU SOUS-TITRE, devant la localité :
             « Artiste · Lyon, France ». La place qu'il libère revient
             au CŒUR, qui est un geste et mérite l'angle le plus
             accessible au pouce. */}

        {/*  ██ §2 (nº 445, rouvert nº 452) — LE FANION : PARTI DE
             PARTOUT, REVENU SUR « MA SÉLECTION » SEULE ██
             ------------------------------------------------------
             La nº 445 l'avait retiré de toutes les cartes ; la nº 452
             le rend à « Ma sélection » (le drapeau `fanion`, passé par
             PageFavoris et par personne d'autre) : l'angle bas droit
             de l'image, VISIBLE EN PERMANENCE — l'ancien réglage
             `toujours`, au pixel (nº 212-§5 : le coin se mesure au
             GLYPHE, d'où le `-mb-1 -mr-1` hors pleine largeur). Même
             bouton que partout (BoutonCoeurPhoto : preventDefault +
             stopPropagation — toucher le fanion n'ouvre jamais la
             fiche), même clé par photo, règle 137 intacte.
             ⚠️ LA MOSAÏQUE DU MOTEUR RESTE NUE : sans le drapeau, rien
             ne se pose sur la photo — ni compteur (nº 214-§0), ni
             badge (nº 211-§2), ni fanion. */}
        {fanion && photoRegardee && (
          <div
            className={
              uneColonne
                ? "absolute bottom-2 right-2"
                : "absolute bottom-2 right-2 -mb-1 -mr-1"
            }
          >
            <BoutonCoeurPhoto
              key={photoRegardee}
              photoId={photoRegardee}
              variante={uneColonne ? "fiche-mobile" : "carte"}
            />
          </div>
        )}

        {/* EN PHOTOTHÈQUE, LE LIEN DE FICHE RECOUVRE L'IMAGE : le bloc
            de texte qui portait le lien étiré est masqué, la photo
            doit rester cliquable. Même clic, même mécanique (fenêtre
            sur le web, navigation de document sur mobile), même
            préchargement — c'est `auClic` qui décide, comme pour le
            lien du nom. z-[1] : sous le cœur (z-10), au-dessus de la
            photo. */}
        {/*  ⚠️ PAS QUAND LES PHOTOS DÉFILENT (nº 213-§1) : le carrousel
             porte DÉJÀ un lien par photo (nº 211-§5). Deux liens
             superposés se disputeraient le doigt, et celui-ci
             recouvrirait le défilement. */}
        {phototheque && (
          <Link
            href={adresseFiche}
            aria-label={`Voir la fiche de ${tatoueur.nom}`}
            onClick={auClic}
            //  nº 361 — PAS DE SAUT DU ROUTEUR : sa remise à zéro part
            //  AVANT que le navigateur n'ait pris la photo d'adieu de
            //  la mosaïque (l'écran noir du glissement retour). C'est
            //  DefilementEnHaut qui remonte, à l'adresse commise —
            //  après la photo, toujours avant la peinture.
            scroll={false}
            className="absolute inset-0 z-[1] outline-none
                       focus-visible:outline-2 focus-visible:-outline-offset-2
                       focus-visible:outline-primaire"
          />
        )}
      </div>

      {/* SOUS LA CARTE : le portrait, puis deux lignes de texte.
          Sur mobile, l'image touche les bords : le texte reprend une
          marge intérieure, et le nom descend d'un cran (la ville,
          elle, ne bouge pas).

          LE PORTRAIT ROND, À GAUCHE — il donne un visage à chaque
          carte, ce qu'une photo de tatouage ne fait jamais.

          ⚠️ SA TAILLE EST DONNÉE EN PIXELS, LARGEUR ET HAUTEUR — et
          c'est la seule façon d'en garantir un CERCLE. La version
          précédente demandait « la hauteur du bloc de texte »
          (`self-stretch`) et « la largeur = la hauteur »
          (`aspect-square`) : deux règles qui se mordent la queue. Dans
          une rangée, le navigateur calcule les LARGEURS d'abord, les
          hauteurs ensuite ; au moment de choisir la largeur du
          portrait, la hauteur à copier n'existe pas encore. Il prenait
          donc la largeur du contenu — quelques pixels — puis
          l'étirait en hauteur : le rectangle vertical de la capture.
          Aucune largeur de carte, aucune longueur de nom ne peut
          désormais l'aplatir.

          LES DEUX LIGNES ONT UNE HAUTEUR DE LIGNE FIXE (19 px, 21 px
          en une colonne sur smartphone) et sont limitées à UNE ligne :
          le bloc de texte mesure donc toujours 40 px (44 px), soit
          exactement le portrait. Le haut du cercle est au haut du nom,
          son bas au bas de la localité — nom court, nom long ou nom
          très long tronqué, la mesure ne bouge pas.
          EN DEUX COLONNES SUR SMARTPHONE, il disparaît : la carte n'y
          fait que 190 px de large, le portrait mangerait le nom. */}
      {!phototheque && (
      <div
        /*  ██ §3 (nº 398) — L'AIR AU-DESSUS DE LA PHOTO DE PROFIL ██
             PLEINE LARGEUR AU DOIGT SEULEMENT. L'air entre le bas de
             l'image et le rond de profil y valait dix pixels ; le
             propriétaire les trouvait trop serrés, et cette passe-là
             les avait portés à seize — la marge que cette même rangée
             portait alors de chaque côté.
             ⚠️ CES DEUX VALEURS ONT ÉTÉ REVUES DEPUIS, et cette note ne
             tient plus que pour l'histoire : la marge latérale est
             tombée à huit pixels à la nº 481, et les airs du haut ont
             été resserrés à la nº 482 — six pixels côte à côte, dix en
             pleine largeur. Les valeurs qui font foi sont celles de la
             note suivante.
             ⚠️ L'ESPACE SOUS LA PHOTO N'EST PAS ICI : cette rangée n'a
             aucun rembourrage bas, la carte s'arrête sur son texte. Ce
             qui suit est la gouttière de la grille — voir
             GrilleTatoueurs, où elle passe de 32 à 24 px. */
        /*  ██ §2 ET §3 (nº 481) — L'AIR SOUS LA PHOTO, ET LA MARGE DU
             TEXTE AU DOIGT ██
             ------------------------------------------------------
             LE WEB — L'AIR ENTRE LE BAS DE LA PHOTO ET LA PREMIÈRE
             LIGNE PASSE DE 12 À 6 PIXELS (la moitié, `pt-1.5`). Il ne
             vaut QUE pour la souris : le doigt a ses propres valeurs
             juste en dessous, dans la variante, et elles ne bougent pas
             — dix pixels côte à côte, seize en pleine largeur.
             LE DOIGT — LA MARGE LATÉRALE DU TEXTE PASSE DE 16 À 8
             PIXELS (`mobile:px-2`), c'est-à-dire la moitié demandée :
             au doigt la photo touche les bords de l'écran, et le texte
             commençait bien trop loin de son bord gauche. Les DEUX
             côtés suivent, pour que la ligne reste centrée dans la
             carte — et les trois lignes bougent ensemble, puisqu'elles
             vivent toutes dans cette boîte : elles restent alignées
             entre elles au pixel. Le web garde sa marge (deux pixels),
             hors variante.
             ⚠️ UNE JUSTIFICATION DEVENUE FAUSSE, ET JE LA CORRIGE ICI :
             la nº 398 avait choisi les seize pixels d'air du haut en
             pleine largeur PARCE QUE cette rangée portait alors la même
             valeur de chaque côté. Ce n'est plus vrai — les côtés
             valent huit désormais, le haut garde ses seize. La valeur
             du haut ne change pas pour autant : le propriétaire l'a
             réglée à l'œil, elle lui appartient. */
        /*  ██ §1 (nº 484) — LES AIRS DU DOIGT SUIVENT UNE SEULE
             ÉCHELLE, ET UN SEUL PRINCIPE ██
             ==================================================
             CE QUI N'ALLAIT PAS, et ce n'était pas une affaire de
             millimètre : trois passes de réglage à l'œil (nº 480 à
             nº 482) avaient laissé des écarts qui ne se répondaient
             pas — un pixel ici, six là, dix ailleurs. Des valeurs
             hors échelle ne peuvent pas former un rythme, quel que
             soit le soin mis à chacune.
             L'ÉCHELLE, DÉSORMAIS : tous les airs de ce bloc sont des
             multiples de QUATRE — quatre, huit, douze. Aucune valeur
             en dehors.
             LE PRINCIPE QUI LES DISTRIBUE — la proximité : ce qui
             parle du même sujet se serre, ce qui parle d'autre chose
             s'éloigne.
              · LA LIGNE DU STYLE DÉCRIT LA PHOTO qui la surmonte :
                elle en reste PROCHE — HUIT pixels (`mobile:pt-2`),
                ici même ;
              · LE NOM ET LA LOCALITÉ parlent du même portfolio : ils
                forment un bloc SERRÉ — QUATRE pixels (voir leur
                bloc, plus bas) ;
              · ENTRE LES DEUX, la césure : DOUZE pixels. Trois fois
                l'écart interne du bloc du bas, et la moitié en plus
                que l'air de la photo. L'œil range alors tout seul :
                une photo et sa description, puis un portfolio.
             ⚠️ UNE SEULE VALEUR POUR LES DEUX DISPOSITIONS DU DOIGT :
             le ternaire qui distinguait les cartes côte à côte de la
             pleine largeur disparaît. Deux valeurs pour une même
             question, c'était déjà une entorse à l'échelle.
             ⚠️ LE WEB NE BOUGE PAS — six pixels sous la photo, hors
             variante du doigt ; sa marge latérale non plus. */
        className="pt-1.5 px-0.5 mobile:pt-2 mobile:px-2"
      >
        {/*  ██ §1 (nº 480) — LA LIGNE 1 : LE STYLE ET LE RENDU ██
             ------------------------------------------------------
             CE QUE LA CARTE MONTRAIT AVANT, en deux lignes : le NOM de
             l'artiste (ou, sur le seul accueil au repos, « Style •
             Rendu » À SA PLACE), puis « Type de fiche • Localité » en
             gris. Le nom et le style ne pouvaient pas coexister.
             CE QU'ELLE MONTRE MAINTENANT, en trois : le style et son
             rendu ICI, le nom du portfolio dessous, la localité en
             troisième. Plus de choix à faire, et la même chose PARTOUT
             — accueil, résultats, page style + ville, Ma sélection
             (favoris comme suivis) : ces surfaces rendent toutes CETTE
             carte, l'unique écriture du texte sous une image.
             SA PLACE AU WEB : au-dessus du rond de profil, et alignée
             sur SON bord gauche — elle est le premier élément de la
             colonne, le rond ouvre la rangée suivante. AU DOIGT, où le
             rond ne se rend pas (deux colonnes), les trois lignes
             s'empilent d'elles-mêmes.
             L'AIR SOUS ELLE — RELEVÉ À LA nº 481, PUIS À LA nº 482 :
             douze pixels au web, six au doigt ; en face, l'écart entre
             les lignes 2 et 3 vaut deux pixels au web et UN au doigt
             (voir leur bloc, plus bas). Le respir reste donc bien plus
             grand au-dessus du nom qu'au-dessus de la localité, des
             deux côtés — et l'écart s'est même creusé au doigt.
             SA GRAISSE ET SA TAILLE — LA GRAISSE A CHANGÉ À LA nº 481 :
             graisse normale (le nom, lui, est demi-gras), blanc, et
             EXACTEMENT le corps du nom (15 px, 14 au doigt côte à côte,
             17 en pleine largeur) — les deux premières lignes se
             répondent, la troisième descend d'un cran.
             ⚠️ LA NUANCE DE LA nº 407 EST LEVÉE ICI : le rendu y
             passait en graisse normale pour se distinguer du style
             DANS UNE LIGNE UNIQUE. Trois lignes portent désormais
             cette hiérarchie, et la ligne entière tient une seule
             graisse — celle que la nº 481 a fixée.
             ⚠️ LA PUCE EST CELLE DU SITE (`SEPARATEUR_GALERIE`,
             lib/photos-tatoueur) : aucune ponctuation inventée, et le
             rendu absent ne laisse jamais de puce orpheline. */}
        {partiesDuTitre && (
          <p
            /*  ██ §1 ET §3 (nº 481) — LA GRAISSE ET L'AIR DE LA LIGNE 1 ██
                LA GRAISSE S'INVERSE AVEC CELLE DU NOM : cette ligne
                était demi-grasse et le nom gras ; elle passe en graisse
                NORMALE, et le nom prend le demi-gras (voir plus bas).
                C'est le nom qui doit peser le plus des deux, et il le
                fait maintenant d'un cran, sans crier. Ni la taille ni
                la couleur ne bougent : même corps que le nom, même
                jeton de blanc.
                L'AIR SOUS ELLE VAUT DOUZE PIXELS (`mb-3`), et c'est
                LA CÉSURE de la carte : cette ligne parle de la photo,
                le bloc du dessous parle du portfolio — les deux ne
                doivent pas se lire ensemble.
                §1 (nº 484) — LES DEUX APPAREILS PARTAGENT DÉSORMAIS
                CETTE VALEUR : le doigt en avait six, ce qui ne
                détachait plus assez la ligne une fois le bloc du bas
                resserré. La variante qui les séparait disparaît — une
                seule classe, donc un seul comportement, et rien à
                tenir d'accord.
                LA HAUTEUR DE LIGNE, ELLE, RESTE SÉPARÉE : dix-neuf
                pixels au web (inchangés), seize au doigt côte à côte,
                vingt en pleine largeur — voir la note de la hauteur,
                sur la ligne du nom. */
            className={`font-normal leading-[19px] line-clamp-1 mb-3 text-[15px] text-sombre-texte ${
              uneColonne
                ? "mobile:text-[17px] mobile:leading-[20px]"
                : "mobile:leading-[16px] mobile:text-[14px]"
            }`}
          >
            {partiesDuTitre.style}
            {partiesDuTitre.rendu && (
              <>
                {SEPARATEUR_GALERIE}
                {partiesDuTitre.rendu}
              </>
            )}
          </p>
        )}

        {/*  §1 (nº 480) — LA RANGÉE DES LIGNES 2 ET 3 : le rond de
             profil, puis le nom et la localité. C'est l'ancienne
             rangée, déplacée d'un cran sous la ligne du style — ses
             classes, son écart de 10 px et la hauteur du rond n'ont
             pas bougé. */}
        <div className="flex items-center gap-2.5">
        <span
          className={`shrink-0 h-10 w-10 flex items-center
                     justify-center overflow-hidden rounded-full
                     bg-sombre-eleve ${
                       uneColonne ? "mobile:h-11 mobile:w-11" : "mobile:hidden"
                     }`}
        >
          {tatoueur.photo_profil ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               photo déposée par le tatoueur, servie telle quelle. */
            <img
              src={tatoueur.photo_profil}
              alt=""
              loading="lazy"
              width={PORTRAIT_ROND}
              height={PORTRAIT_ROND}
              className="h-full w-full object-cover"
            />
          ) : (
            /* LE REPLI DES FICHES D'AVANT LA PHOTO DE PROFIL :
               l'initiale, comme partout ailleurs sur le site. */
            <span
              aria-hidden="true"
              className="text-[13px] font-bold text-sombre-texte-doux"
            >
              {tatoueur.nom.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        {/* LE BLOC DE TEXTE — deux lignes, hauteur au pixel : 19 + 2 +
            19 = 40 px (21 + 2 + 21 = 44 px en une colonne sur
            smartphone). C'est cette hauteur que le portrait reprend. */}
        {/*  ██ §1 (nº 484) — LE BLOC SERRÉ : LE NOM ET SA LOCALITÉ ██
             QUATRE PIXELS au doigt (`mobile:gap-1`), le premier cran
             de l'échelle. Ces deux lignes parlent du MÊME portfolio :
             elles se lisent d'un seul tenant, et douze pixels les
             séparent de la ligne du style, qui parle d'autre chose.
             ⚠️ POURQUOI QUATRE, ALORS QUE LA nº 482 ÉTAIT DESCENDUE À
             UN : parce que la hauteur de ligne se resserre en même
             temps (voir la note de la ligne du nom). Le pixel unique
             ne faisait que compenser le blanc que la hauteur de ligne
             posait autour de chaque texte ; ce blanc parti, quatre
             pixels d'écart RÉEL serrent mieux les deux lignes qu'un
             pixel n'y parvenait — et cette fois la valeur est dans
             l'échelle.
             ⚠️ LE WEB GARDE SES DEUX PIXELS (`gap-0.5`, hors variante),
             avec sa hauteur de ligne inchangée. */}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5 mobile:gap-1">
        <h3
          /*  ██ §1 (nº 484) — LA HAUTEUR DE LIGNE SE RESSERRE, AU
              DOIGT ██
              ------------------------------------------------------
              POURQUOI ELLE COMPTE PLUS QUE LES ÉCARTS EUX-MÊMES :
              dix-neuf pixels de hauteur pour un texte de quatorze,
              cela pose environ deux pixels et demi de blanc AU-DESSUS
              et EN DESSOUS de chaque ligne — un blanc qu'on ne voit
              pas, qu'aucun réglage d'écart ne peut retirer, et qui
              fausse toutes les mesures faites à côté. C'est lui qui a
              fait descendre l'écart du bas jusqu'à un pixel à la
              nº 482 : on compensait un blanc au lieu de le supprimer.
              LES VALEURS, DANS L'ÉCHELLE DE QUATRE : SEIZE pixels
              pour les cartes côte à côte (textes de 14 et 13), VINGT
              en pleine largeur (textes de 17 et 14,5). Les trois
              lignes suivent ensemble — sans quoi elles ne
              s'aligneraient plus entre elles.
              ⚠️ LE ROND DE PROFIL N'EST PAS CASSÉ, ET C'EST VÉRIFIÉ :
              sa taille reprend la hauteur des lignes 2 et 3, écart
              compris. En pleine largeur au doigt, celles-ci mesurent
              désormais 20 + 4 + 20 = QUARANTE-QUATRE pixels — très
              exactement la taille qu'il porte déjà (44). Au web, rien
              ne change : 19 + 2 + 19 = QUARANTE, sa taille de base.
              Et sur les cartes côte à côte, il ne se rend pas. Le
              rond garde donc sa taille dans les trois cas, sans qu'on
              ait eu à la figer ni à la recalculer.
              ⚠️ LE WEB GARDE SA HAUTEUR (dix-neuf pixels, classe de
              base) : seules les variantes du doigt changent. */
          /*  §1 (nº 480, réglé nº 481) — LA LIGNE 2 : LE NOM DU
              PORTFOLIO. Même corps que la ligne du style juste
              au-dessus — les deux premières lignes se répondent au
              pixel —, et c'est la GRAISSE qui les distingue : le nom
              est demi-gras, le style est en graisse normale. Les deux
              valeurs viennent d'être échangées (nº 481) ; l'écart entre
              elles est le même qu'avant, d'un cran, mais il pèse
              désormais moins lourd à l'œil. Le blanc vient du jeton,
              comme avant. */
          className={`font-semibold leading-[19px] line-clamp-1 text-[15px] text-sombre-texte ${
            uneColonne
              ? "mobile:text-[17px] mobile:leading-[20px]"
              : "mobile:leading-[16px] mobile:text-[14px]"
          }`}
        >
          {/* Le lien de fiche s'étire sur TOUTE la carte. Il EMPORTE
              le style cherché (?style=…) : la page de fiche ouvre
              alors son carrousel sur la photo de CE style — la
              continuité exacte de la photo de la carte. */}
          <Link
            href={adresseFiche}
            // ⚠️ SUR SMARTPHONE, LE PRÉCHARGEMENT NE SERT PLUS À RIEN :
            // le clic part en navigation de document, et ce que Next
            // précharge (la charge du routeur) ne peut pas la servir.
            // Dix-huit cartes, dix-huit demandes inutiles. Le web, lui,
            // garde son préchargement — sa fenêtre s'en sert vraiment.
            onClick={auClic}
            //  nº 361 — PAS DE SAUT DU ROUTEUR (voir le lien de la
            //  photothèque ci-dessus) : DefilementEnHaut remonte à
            //  l'adresse commise, après la photo d'adieu du navigateur.
            scroll={false}
            /*  §2 (nº 395), RÉGLÉ AUTREMENT À LA nº 480 — LE LIEN DIT
                 LE NOM DE LUI-MÊME. Il fallait un `aria-label` tant que
                 cette ligne pouvait porter le STYLE à la place du nom :
                 dix-huit cartes se seraient appelées « Réalisme » pour
                 qui ne voit pas. Le nom occupe désormais cette ligne à
                 lui seul, et le texte du lien EST donc son nom
                 accessible — l'étiquette de secours n'a plus d'objet. */
            className="outline-none after:absolute after:inset-0 after:content-['']
                       focus-visible:underline"
          >
            {/*  §1 (nº 407) — LE STYLE EN GRAS, LA PUCE ET LE RENDU EN
                 NORMAL. Le `<h3>` porte déjà `font-semibold` : c'est
                 donc le RESTE qui est allégé (`font-normal`), pas le
                 style qui est alourdi — une graisse de plus sur un
                 titre déjà semi-gras aurait pesé sur une ligne de
                 15 px. Deux `<span>` dans le même lien, sans espace
                 ajouté : le séparateur porte les siens.
                 ⚠️ LA HAUTEUR NE BOUGE PAS : même police, même corps,
                 même `leading`, et le `line-clamp-1` du `<h3>` tient
                 toujours la ligne unique. Ce qui change, c'est que le
                 gras étant un peu plus large, un libellé long atteint
                 l'ellipse un peu plus tôt — il s'abrège, il ne
                 déborde ni ne passe à la ligne.
                 ⚠️ SANS PARTIES (les trois autres surfaces, ou un
                 artiste sans style), c'est le NOM qui s'écrit, tel
                 quel — aucun morceau, aucune puce. */}
            {tatoueur.nom}
          </Link>
        </h3>
        <p
          className={`text-sombre-texte-doux leading-[19px] line-clamp-1 ${
            uneColonne
              ? "text-[14.5px] mobile:leading-[20px]"
              : "text-[13px] mobile:leading-[16px]"
          }`}
        >
          {/* ⚠️ LE TYPE DE FICHE OUVRE LA LIGNE (nº 211-§2) — il a
              quitté l'image, où il couvrait la photo : « Artiste ·
              Lyon, France ». Puis VILLE ET PAYS, rien d'autre (passe
              nº 114) — avec le code de l'État pour les pays qui
              l'écrivent (« Miami, FL, États-Unis »). La règle du lieu
              vit dans lib/adresse, jamais ici. */}
          {/*  ⚠️ DEUX ÉCRITURES DU MÊME LIEU (nº 212-§6) : au doigt, le
               pays s'abrège dès qu'un état s'écrit (« Austin, TX,
               USA ») — sinon la ligne déborde. Sur le web, la place ne
               manque pas : le pays reste en toutes lettres. Les deux
               sont posées, une seule s'affiche. */}
          {/*  §1 (nº 395) — LA PUCE REMPLACE LE POINT MÉDIAN, ici et
               dans la variante du doigt juste dessous. Le site n'a plus
               qu'une ponctuation pour séparer deux valeurs : celle des
               pratiques, des styles, du bloc artiste et — depuis la
               nº 393 — des titres de galerie.
               ⚠️ CE LIBELLÉ N'EST PAS FACTORISÉ, et ce n'est pas un
               oubli : les deux écritures ci-dessous ne partagent pas la
               même règle de lieu (`ligneCarte` au large, `ligneCarteMobile`
               au doigt, nº 212-§6). Elles vivent donc où elles sont, et
               la puce est changée aux DEUX. Il n'y en a pas d'autre :
               toutes les surfaces qui montrent cette ligne — accueil,
               jumeau de recherche, résultats, vitrines, Ma sélection —
               rendent CETTE carte. */}
          <span className="mobile:hidden">
            {[
              libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement),
              ligneCarte(lieuDeLaCarte),
            ]
              .filter(Boolean)
              .join(" • ")}
          </span>
          <span className="hidden mobile:inline">
            {[
              libelleTypeFiche(tatoueur.type_fiche, tatoueur.etablissement),
              ligneCarteMobile(lieuDeLaCarte),
            ]
              .filter(Boolean)
              .join(" • ")}
          </span>
        </p>
        </div>
        </div>
      </div>
      )}
    </article>
  );
}

/**
 * ⚠️ LA CARTE EST MÉMORISÉE (passe nº 219-§1)
 * ==================================================================
 * LE DÉFAUT MESURÉ PAR LA SONDE : naviguer dans un portfolio — donc
 * changer l'état de la FENÊTRE superposée — faisait retraverser les
 * vingt-quatre cartes de la mosaïque, avec leurs carrousels, leurs
 * zooms et leurs écouteurs. Deux ou trois clics, et l'appareil
 * saturait.
 *
 * LA CAUSE : la fenêtre et les cartes sont rendues par le MÊME
 * composant (GrilleTatoueurs). Tout état de la fenêtre qui y vit —
 * la fiche ouverte, la position de la grille — provoque un rendu de
 * ce composant, donc de ses vingt-quatre enfants.
 *
 * LA COUPURE : `memo`. Une carte ne se re-rend plus que si SES
 * PROPRES données changent. Encore faut-il que ses propriétés soient
 * stables d'un rendu à l'autre — c'est pourquoi `surOuverture` et
 * `surApproche` reçoivent désormais la fiche EN ARGUMENT au lieu
 * d'être des fermetures fabriquées à chaque rendu : la grille peut
 * ainsi passer deux fonctions constantes (`useCallback`).
 */
export const CarteTatoueur = memo(CarteTatoueurNue);
