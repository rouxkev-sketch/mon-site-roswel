"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LARGEUR_SITE } from "@/config/tatouage";
import { lireSelection, MENU_FAVORIS } from "@/lib/filtres-selection";
import { lireRequeteCourante, souscrireAdresse } from "@/lib/adresse-courante";
import { CarteTatoueur } from "@/components/CarteTatoueur";
import { CLASSES_GRILLE_CARTES } from "@/components/GrilleTatoueurs";
import { useVuePhototheque } from "@/components/AffichageMosaique";
import { BlocSuivis } from "@/components/BlocSuivis";
import { FenetreFiche } from "@/components/FenetreFiche";
import { LigneResultats } from "@/components/LigneResultats";
import { libelleDuChoix } from "@/components/MenusSelection";
import {
  CLE_FENETRE_FICHE,
  type ContexteFenetreFiche,
} from "@/components/RetourFenetreFiche";
import { natureConnue, RENDU_PAR_DEFAUT } from "@/lib/photos-tatoueur";
import {
  cartesDesFavoris,
  compteDeLaSelection,
  photoDuChoix,
  suivisDuChoix,
} from "@/lib/selection-suivis";
import { ficheComplete } from "@/lib/fiche-complete";
import type { PhotoFavorite, TatoueurSuivi } from "@/lib/favoris-serveur";
import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * MA SÉLECTION — les photos gardées, et les tatoueurs suivis
 * ==========================================================
 * §1 (nº 243) — PLUS DE FENÊTRE POUR LES SUIVIS : ils vivaient
 * derrière un bouton, dans une fenêtre qui défilait sur elle-même —
 * deux défilements imbriqués et une boîte dans une boîte. Supprimée,
 * code compris. Tout vit dans la page, un seul défilement.
 *
 * §2 (nº 245) — ET PLUS DE VA-ET-VIENT NON PLUS. Le sélecteur
 * `Photos · Tatoueurs` de la nº 243 est supprimé, code compris : ce
 * sont LES DEUX MENUS de la barre — « Mes favoris » et « Mes suivis »
 * (MenusSelection, posés dans la rangée de EnTeteTatouage à la place
 * du bloc de recherche) — qui décident de ce qui s'affiche. Les deux
 * sections sont là, l'une sous l'autre : les photos gardées, puis les
 * artistes suivis.
 *
 * ⚠️ LES DEUX CHOIX VIVENT DANS L'ADRESSE (`?favoris=…`, `?suivis=…`),
 * comme tout depuis la nº 191 — et c'est aussi ce qui les fait
 * partager par la BARRE et par la PAGE, deux composants frères : voir
 * lib/filtres-selection. Le retour d'une fiche rend donc le même
 * filtre ET la même position (la mémoire de défilement est indexée
 * sur `chemin + recherche`, MemoireNavigation).
 *
 * LES MENUS NE MONTRENT QUE LES STYLES PRÉSENTS, et c'est le point
 * important : les trente-huit styles du site dans un menu où
 * trente-cinq entrées ne donnent rien seraient inutilisables. Les
 * listes sont CALCULÉES (voir `entreesDuFiltre`), dans l'ordre et
 * avec les libellés du menu du moteur — aucune seconde liste.
 *
 * ⚠️ UNE PHOTO RETIRÉE NE DISPARAÎT PAS SOUS LE DOIGT. Le cœur
 * s'éteint, la carte PÂLIT et reste en place : on peut se raviser
 * d'un second toucher. Elle ne s'en va qu'au prochain affichage de la
 * page. Faire disparaître une image à l'instant où on la touche, c'est
 * empêcher de revenir sur une erreur — et donner l'impression que
 * quelque chose s'est cassé.
 */

/*  §1 (nº 253) — LA PAGE NE PORTE PLUS AUCUN MENU : les deux entrées
    qu'elle recevait depuis la nº 249 sont retournées à la BARRE, seule
    à commander (l'encadré sur le web, les deux titres au doigt). Elle
    n'ANNONCE plus que ce qui est cherché. */
export function PageFavoris({
  photos,
  suivis,
}: {
  photos: PhotoFavorite[];
  suivis: TatoueurSuivi[];
}) {
  //  LE FILTRE VIENT DE L'ADRESSE — la même source que les menus de la
  //  barre, lue par le même magasin (nº 245-§3, nº 247-§2).
  const requete = useSyncExternalStore(
    souscrireAdresse,
    lireRequeteCourante,
    () => ""
  );
  const choix = lireSelection(requete);
  /*  §2 (nº 247) — LES DEUX MENUS SONT EXCLUSIFS : un seul mène la
      recherche, et l'autre section n'est PAS affichée. À l'ouverture
      (adresse sans paramètre), c'est « Mes favoris » : les favoris
      seuls, aucun suivi. */
  const surLesFavoris = choix.menu === MENU_FAVORIS;
  /*  §4 (nº 255) — LA MISE EN PAGE DES CARTES. L'icône posée dans la
      barre commande la MÊME vue que sur la page de recherche : le
      magasin est partagé (lib/vue-phototheque, lu ici par le même
      abonnement que la mosaïque). Sans cette lecture, l'icône ne
      commanderait rien — les cartes de cette page ignoraient l'état.
      §2 (nº 257) — ET SON INSTANTANÉ SERVEUR EST CELUI DU COOKIE : le
      contexte le porte (voir plus bas), exactement comme la mosaïque
      le reçoit d'IndexTatoueurs. */
  const phototheque = useVuePhototheque();

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
  /**
   * §1 (nº 247) — LES TROIS TAGS DE L'ENSEMBLE OUVERT, ET PLUS LE SEUL
   * STYLE. C'est ICI que la catégorie se perdait : la fenêtre ne
   * recevait que `styleRecherche`, donc elle ouvrait TOUT le style —
   * et sa première photo est une réalisation. On ouvrait un flash, on
   * voyait une réalisation.
   */
  /*  §4 (nº 302) — ET L'IDENTIFIANT DE LA PHOTO TOUCHÉE. Les trois
      tags désignent une SÉRIE ; ils ne disent pas LAQUELLE des photos
      on a ouverte. La carte de favori EST une photo : son identifiant
      voyage avec, et la fenêtre s'ouvre dessus (« 8/14 »). */
  const [serieOuverte, setSerieOuverte] = useState({
    cle: "",
    style: "",
    nature: "",
    rendu: "",
    photo: "",
  });
  const visible =
    ficheOuverte !== null && pathname === `/tatoueur/${ficheOuverte.slug}`;

  const ouvrirLaFiche = useCallback(
    async (
      slug: string,
      serie: {
        cle: string;
        style: string;
        nature: string;
        rendu: string;
        photo: string;
      },
      adresse: string
    ) => {
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
      setSerieOuverte(serie);
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
  //  UN SEUL FILTRE, celui du menu actif (l'adresse) — et la règle vit
  //  dans `lib/selection-suivis`, écrite une fois pour le filtrage
  //  comme pour le comptage des entrées de menu.
  //  ⚠️ PLUS DE `useMemo` À LA MAIN ICI (nº 249) : le compilateur de
  //  React ne parvenait plus à préserver ces deux mémoïsations depuis
  //  que `choix` sert aussi aux titres — il mémoïse désormais
  //  lui-même, et ces filtres sur quelques dizaines d'éléments ne
  //  coûtent rien.
  const { nature, style } = choix;
  const visibles = surLesFavoris
    ? photos.filter((photo) => photoDuChoix(photo, { nature, style }))
    : [];
  const suivisVisibles = surLesFavoris
    ? []
    : suivisDuChoix(suivis, { nature, style });

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
   * ⚠️ PLUS DE `useMemo` À LA MAIN (nº 249) : sa dépendance `visibles`
   * est désormais calculée au rendu — c'est le compilateur de React
   * qui mémoïse, comme pour les deux filtres au-dessus.
   */
  /*  §2 (nº 303) — LA LISTE DES CARTES EST CALCULÉE HORS DE CE
      COMPOSANT (`cartesDesFavoris`, lib/selection-suivis) : une photo
      aimée = une carte, et c'est une RÈGLE, pas un détail d'affichage.
      Sortie d'ici, elle s'exécute — donc elle se prouve. */
  const ensemblesVisibles = cartesDesFavoris(visibles);

  return (
    /*  ⚠️ LA LARGEUR DE LA MOSAÏQUE (nº 213-§3a) : `LARGEUR_SITE` et
        les mêmes marges latérales que l'accueil — cette page montre
        les mêmes cartes, elle doit occuper le même espace. */
    <main
      /*  §1 (nº 254) — LE `pt-6` EN TROP EST PARTI : la page de
          recherche n'en met pas sur son <main> — c'est LigneResultats
          qui porte l'air du titre (pt-6 sm:pt-8, pb-5 sm:pb-6). Le
          doubler ici décalait « Mes favoris » de 24 px vers le bas par
          rapport à la recherche. Mêmes classes, même composant : les
          deux pages sont désormais identiques valeur par valeur. */
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16`}
    >
      {/* ---------- LE TITRE (§2, nº 249) ----------
           « Ma sélection » et le sous-titre en capitales ont DISPARU.
           À la place, L'ÉCRITURE DE LA PAGE DE RECHERCHE — le même
           composant (`LigneResultats`), la même hiérarchie : le titre
           est le menu qui mène la recherche (« Mes favoris », aussi le
           titre de l'écran d'ouverture, ou « Mes suivis »), et
           dessous, LE CRITÈRE EN COURS, écrit par `libelleExplorer` —
           l'écriture exacte de la page de recherche (« Réalisations ·
           Abstrait », « Tous les flashs ») ; rien sans critère.
           §3 — SUR LE WEB, CE TITRE EST LE CONTRÔLE : voir
           `titreControle`. */}
      {/*  §1 (nº 257) — LE SOUS-TITRE LIT LA MÊME ÉCRITURE QUE LE CHAMP
           DE LA BARRE (`libelleDuChoix`) : sur « Mes suivis », le menu
           n'a plus de catégorie, et `libelleExplorer` rendait « » pour
           un style pourtant choisi — le critère disparaissait de la
           page. Une seule écriture, deux endroits. */}
      {/*  §2 (nº 263) — le titre est un MOT NU depuis la nº 253 :
           `titreControle`, réduit à l'identité, est parti avec le
           titre inactif qu'il servait encore. */}
      {/*  §1 (nº 301) — LES DEUX TITRES DISENT CE QUE LA LISTE CONTIENT.
           « Mes suivis » → « Ma sélection de portfolios » : la liste ne
           contient PAS que des artistes — il y a aussi des salons et
           des studios, et « portfolio » est le seul mot qui couvre les
           trois. « Mes favoris » → « Ma sélection de photos » : celle-là
           contient des photos. ⚠️ AUCUNE SESSION FUTURE NE DOIT LES
           « CORRIGER » : ce sont les mots du propriétaire, et la raison
           est écrite ici.
           §1 (nº 301) — ET LE TITRE GARDE LE MÊME DÉGAGEMENT dans les
           deux cas (voir `degagementConstant`) : le sous-titre n'existe
           que sous un filtre, la page sautait de 30 px quand on le
           retirait. */}
      {/*  §1 (nº 303) — LE SOUS-TITRE PORTE LE COMPTE, et il ne peut
           plus être vide. ⚠️ LE NOM DU FILTRE EST GARDÉ : jusqu'ici
           cette ligne ne disait QUE lui (« Réalisme », « Réalisations ·
           Abstrait ») ; les deux tiennent ensemble — « Réalisme ·
           7 portfolios sur 18 ». Les trois cas (un, aucun, filtré)
           vivent dans `compteDeLaSelection`, pas ici. */}
      <LigneResultats
        titre={
          surLesFavoris ? "Ma sélection de photos" : "Ma sélection de portfolios"
        }
        sousTitre={
          [
            libelleDuChoix(choix),
            compteDeLaSelection({
              surLesFavoris,
              total: surLesFavoris ? photos.length : suivis.length,
              visibles: surLesFavoris ? visibles.length : suivisVisibles.length,
              filtreActif: Boolean(choix.nature || choix.style),
            }),
          ]
            .filter(Boolean)
            .join(" · ") || null
        }
        degagementConstant
      />

      {/* ---------- LES PHOTOS GARDÉES ----------
           §2 (nº 247) — LES DEUX MENUS SONT EXCLUSIFS : cette section
           n'existe que si « Mes favoris » mène la recherche. Choisir
           dans « Mes suivis » la fait disparaître, et réciproquement —
           on ne lit jamais deux recherches à la fois. */}
      {!surLesFavoris ? null : photos.length === 0 ? (
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
          {/*  ⚠️ LES DEUX FILTRES QUI VIVAIENT ICI SONT PARTIS
               (nº 245-§2) : le menu de style local et le sélecteur
               Réalisations / Flashs faisaient double emploi avec les
               deux menus de la barre, qui décident désormais seuls.
               Une seule écriture, et un seul endroit où choisir. */}
          {/* ---------- LES PHOTOS, EN CARTES ---------- */}
          {ensemblesVisibles.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-sombre-carte px-4 py-6 text-center text-[14px] text-sombre-texte-doux">
              Rien d&apos;enregistré dans ce style.
            </p>
          ) : (
            /*  ⚠️ LA GRILLE DE LA MOSAÏQUE, L'ÉCRITURE MÊME (nº 249-§4).
                Cette page en recopiait les colonnes mais PAS les
                gouttières du smartphone : ses cartes gardaient 16 px
                d'écart là où la recherche colle les siennes bord à
                bord (2 px). C'est désormais LA MÊME CHAÎNE DE CLASSES
                (`CLASSES_GRILLE_CARTES`, exportée par la mosaïque) —
                mêmes cartes, même grille, une seule écriture. */
            /*  §2 (nº 264) — PLUS AUCUNE MARGE AJOUTÉE SOUS LE BLOC DU
                TITRE : la recherche enchaîne sa grille directement sous
                le `pb` de LigneResultats (relevé vivant : 20 px au
                doigt, 24 sur le web, dans les DEUX états) — le `mt-6`
                d'ici s'y AJOUTAIT, et le bloc ne respectait plus les
                marges de la page de recherche. Même écriture, même
                rythme, plus rien d'ajouté. */
            <ul className={CLASSES_GRILLE_CARTES}>
              {ensemblesVisibles.map(({ cle, fiche, photo }) => (
                <li key={cle}>
                  {/*  ⚠️ LA CARTE DE LA MOSAÏQUE, SANS VARIANTE
                       (nº 213-§3b) — le même composant que la
                       recherche, donc les mêmes proportions, le même
                       cœur, le même sous-titre, et le défilement des
                       photos en pleine largeur. */}
                  {/*  §1 (nº 247) — LA CATÉGORIE VOYAGE, ELLE AUSSI.
                       Elle manquait ici : l'adresse que la carte
                       fabrique (`?style=…&rendu=…`) n'emportait donc
                       pas `&nature=`, et le smartphone — qui navigue
                       par ce lien — ouvrait TOUT le style. C'est la
                       moitié mobile du défaut. */}
                  <CarteTatoueur
                    tatoueur={fiche}
                    styleRecherche={photo.style}
                    renduRecherche={photo.rendu ?? ""}
                    natureRecherche={natureConnue(photo.nature)}
                    //  §4 (nº 302) — au doigt, la carte NAVIGUE : son
                    //  adresse porte la photo, et la fiche s'ouvre
                    //  dessus. Sur le web, c'est la fenêtre superposée
                    //  qui la reçoit (voir plus bas) — le même
                    //  identifiant, les deux chemins.
                    photoRecherche={photo.id}
                    //  §4 (nº 255) — LA MÊME VUE QUE LA MOSAÏQUE : le
                    //  drapeau que la carte attend depuis toujours, et
                    //  que cette page ne lui donnait pas.
                    phototheque={phototheque}
                    surOuverture={() =>
                      void ouvrirLaFiche(
                        photo.tatoueurSlug,
                        {
                          cle,
                          style: photo.style,
                          nature: natureConnue(photo.nature),
                          rendu: photo.rendu ?? RENDU_PAR_DEFAUT,
                          //  §4 (nº 302) — la photo elle-même.
                          photo: photo.id,
                        },
                        `/tatoueur/${photo.tatoueurSlug}?style=${photo.style}` +
                          `&nature=${natureConnue(photo.nature)}&rendu=${
                            photo.rendu ?? RENDU_PAR_DEFAUT
                          }&photo=${photo.id}`
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* ---------- LES ARTISTES SUIVIS (nº 243-§2 à §5) ----------
           §2 (nº 247) — ILS N'APPARAISSENT QUE SI « Mes suivis » mène
           la recherche : à l'ouverture, la page ne montre QUE les
           favoris. §2 (nº 249) — le sous-titre en capitales est parti :
           le TITRE de la page dit déjà « Mes suivis ». */}
      {!surLesFavoris && (
        /*  §2 (nº 312) — EN WEB, UN PORTFOLIO S'OUVRE EN FENÊTRE
            CENTRÉE SUPERPOSÉE, comme partout ailleurs sur le site.
            ⚠️ ON LUI PASSE `ouvrirLaFiche`, CELLE QUI SERT DÉJÀ AUX
            CARTES DE FAVORIS : même note de retour, même position de
            page mémorisée, même entrée d'historique, même fenêtre
            montée plus bas. Rien n'est écrit une seconde fois, et la
            fenêtre elle-même n'est pas touchée — elle est seulement
            ouverte depuis un endroit de plus.
            ⚠️ AU DOIGT, RIEN NE CHANGE : `BlocSuivis` n'appelle ce
            rappel que sur un appareil à pointeur fin (voir
            `ouvrirEnFenetre`) — ailleurs, ses liens naviguent. */
        <BlocSuivis
          suivis={suivisVisibles}
          surOuverture={(slug, serie, adresse) =>
            void ouvrirLaFiche(slug, serie, adresse)
          }
        />
      )}

      {/* ---------- LE TITRE INACTIF EST PARTI (§2, nº 263) ----------
           LA CAUSE DU RELEVÉ (« Mes suivis » traînait en bas de la
           page, sur le web) : un titre rendu HORS des blocs
           conditionnels. À la nº 249 c'était un CONTRÔLE — le titre de
           l'autre recherche, en menu, la porte pour y aller ; à la
           nº 253 la commande est retournée à la barre et il est devenu
           un MOT NU (`titreControle`) : il avait perdu sa raison
           d'être, pas sa place. Depuis la nº 247 les deux sections
           sont exclusives — sur « Favoris », RIEN des suivis ne se
           rend, ni titre ni espace ; le bloc entier est donc retiré,
           et la symétrie vaut sur « Suivis ». */}

      {/* `key` : chaque ouverture repart de L'ENSEMBLE ouvert, jamais
          de l'état d'une fiche précédente.
          ⚠️ ET L'ENSEMBLE, PAS SEULEMENT LA FICHE (nº 247-§1) : la clé
          ne portait que l'identifiant du tatoueur. Ouvrir un flash de
          Lola puis une de ses réalisations (ou l'inverse) réutilisait
          donc LA MÊME fenêtre — React garde l'état interne d'un
          composant dont la clé n'a pas changé, à commencer par la série
          et l'indice de photo. Une photo héritée de l'ensemble voisin,
          exactement. La mosaïque comptait déjà ses ouvertures pour
          cette raison (nº 220-§3) ; cette page ne le faisait pas. */}
      <FenetreFiche
        key={`${ficheOuverte?.id ?? "fermee"}-${serieOuverte.cle}`}
        tatoueur={visible ? ficheOuverte : null}
        styleRecherche={serieOuverte.style}
        //  LES TROIS TAGS, jusqu'au bout : la fenêtre s'ouvre sur
        //  L'ENSEMBLE qu'on a touché, jamais sur tout le style.
        natureRecherche={serieOuverte.nature}
        renduRecherche={serieOuverte.rendu}
        /*  §4 (nº 302) — LA PHOTO TOUCHÉE, ET NON LA PREMIÈRE DE SA
            SÉRIE. Une carte de favori EST une photo précise : la
            fenêtre s'ouvre dessus. */
        photoRecherche={serieOuverte.photo}
        positionGrille={positionPage}
        surFermeture={fermerLaFiche}
      />
    </main>
  );
}

/*  §2 (nº 303) — `cleEnsembleFavori` EST SUPPRIMÉE, code compris. Elle
    servait à DÉDOUBLONNER les favoris par carrousel — exactement ce
    que le propriétaire ne veut plus : une photo aimée, une carte. Rien
    d'autre ne l'appelait. */


