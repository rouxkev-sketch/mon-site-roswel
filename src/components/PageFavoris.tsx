"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LARGEUR_SITE } from "@/config/tatouage";
import {
  lireSelection,
  MENU_JAIME,
  MENU_SUIVIS,
  poserSelection,
  valeurDuMenu,
  type EntreeFiltre,
  type MenuSelection,
} from "@/lib/filtres-selection";
import { lireRequeteCourante, souscrireAdresse } from "@/lib/adresse-courante";
import { CarteTatoueur } from "@/components/CarteTatoueur";
import { CLASSES_GRILLE_CARTES } from "@/components/GrilleTatoueurs";
import { BlocSuivis } from "@/components/BlocSuivis";
import { FenetreFiche } from "@/components/FenetreFiche";
import { LigneResultats } from "@/components/LigneResultats";
import { MenuDeroulant } from "@/components/MenuDeroulant";
import { libelleExplorer } from "@/components/MoteurTatouage";
import {
  CLE_FENETRE_FICHE,
  type ContexteFenetreFiche,
} from "@/components/RetourFenetreFiche";
import {
  cleDEnsemble,
  natureConnue,
  RENDU_PAR_DEFAUT,
} from "@/lib/photos-tatoueur";
import { photoDuChoix, suivisDuChoix } from "@/lib/selection-suivis";
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
 * sont LES DEUX MENUS de la barre — « Mes j'aime » et « Mes suivis »
 * (MenusSelection, posés dans la rangée de EnTeteTatouage à la place
 * du bloc de recherche) — qui décident de ce qui s'affiche. Les deux
 * sections sont là, l'une sous l'autre : les photos gardées, puis les
 * artistes suivis.
 *
 * ⚠️ LES DEUX CHOIX VIVENT DANS L'ADRESSE (`?jaime=…`, `?suivis=…`),
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

export function PageFavoris({
  photos,
  suivis,
  entreesJaime,
  entreesSuivis,
}: {
  photos: PhotoFavorite[];
  suivis: TatoueurSuivi[];
  /** §3 (nº 249) — LES ENTRÉES DES DEUX MENUS, calculées par le
      serveur (les mêmes que celles de la barre) : sur le web, ce sont
      les TITRES de cette page qui portent désormais les menus. */
  entreesJaime: EntreeFiltre[];
  entreesSuivis: EntreeFiltre[];
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
      (adresse sans paramètre), c'est « Mes j'aime » : les favoris
      seuls, aucun suivi. */
  const surLesJaime = choix.menu === MENU_JAIME;

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
  const [serieOuverte, setSerieOuverte] = useState({
    cle: "",
    style: "",
    nature: "",
    rendu: "",
  });
  const visible =
    ficheOuverte !== null && pathname === `/tatoueur/${ficheOuverte.slug}`;

  const ouvrirLaFiche = useCallback(
    async (
      slug: string,
      serie: { cle: string; style: string; nature: string; rendu: string },
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
  const visibles = surLesJaime
    ? photos.filter((photo) => photoDuChoix(photo, { nature, style }))
    : [];
  const suivisVisibles = surLesJaime
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
  const ensemblesVisibles = (() => {
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
  })();

  return (
    /*  ⚠️ LA LARGEUR DE LA MOSAÏQUE (nº 213-§3a) : `LARGEUR_SITE` et
        les mêmes marges latérales que l'accueil — cette page montre
        les mêmes cartes, elle doit occuper le même espace. */
    <main
      className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pt-6 pb-16`}
    >
      {/* ---------- LE TITRE (§2, nº 249) ----------
           « Ma sélection » et le sous-titre en capitales ont DISPARU.
           À la place, L'ÉCRITURE DE LA PAGE DE RECHERCHE — le même
           composant (`LigneResultats`), la même hiérarchie : le titre
           est le menu qui mène la recherche (« Mes j'aime », aussi le
           titre de l'écran d'ouverture, ou « Mes suivis »), et
           dessous, LE CRITÈRE EN COURS, écrit par `libelleExplorer` —
           l'écriture exacte de la page de recherche (« Réalisations ·
           Abstrait », « Tous les flashs ») ; rien sans critère.
           §3 — SUR LE WEB, CE TITRE EST LE CONTRÔLE : voir
           `titreControle`. */}
      <LigneResultats
        titre={titreControle(
          surLesJaime ? MENU_JAIME : MENU_SUIVIS,
          surLesJaime ? "Mes j'aime" : "Mes suivis",
          surLesJaime ? entreesJaime : entreesSuivis,
          choix
        )}
        sousTitre={libelleExplorer(nature, style) || null}
      />

      {/* ---------- LES PHOTOS GARDÉES ----------
           §2 (nº 247) — LES DEUX MENUS SONT EXCLUSIFS : cette section
           n'existe que si « Mes j'aime » mène la recherche. Choisir
           dans « Mes suivis » la fait disparaître, et réciproquement —
           on ne lit jamais deux recherches à la fois. */}
      {!surLesJaime ? null : photos.length === 0 ? (
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
            <ul className={`mt-6 ${CLASSES_GRILLE_CARTES}`}>
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
                    surOuverture={() =>
                      void ouvrirLaFiche(
                        photo.tatoueurSlug,
                        {
                          cle,
                          style: photo.style,
                          nature: natureConnue(photo.nature),
                          rendu: photo.rendu ?? RENDU_PAR_DEFAUT,
                        },
                        `/tatoueur/${photo.tatoueurSlug}?style=${photo.style}` +
                          `&nature=${natureConnue(photo.nature)}&rendu=${
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

      {/* ---------- LES ARTISTES SUIVIS (nº 243-§2 à §5) ----------
           §2 (nº 247) — ILS N'APPARAISSENT QUE SI « Mes suivis » mène
           la recherche : à l'ouverture, la page ne montre QUE les
           favoris. §2 (nº 249) — le sous-titre en capitales est parti :
           le TITRE de la page dit déjà « Mes suivis ». */}
      {!surLesJaime && (
        <BlocSuivis suivis={suivisVisibles} favoris={photos} />
      )}

      {/* ---------- LE TITRE INACTIF (§3, nº 249), WEB SEULEMENT ----
           Les DEUX titres sont les contrôles : celui de la recherche
           en cours est en tête de page, l'AUTRE attend ici, même
           écriture (`LigneResultats`), même chevron, même fenêtre de
           menu — c'est la porte vers l'autre recherche. En `h2` : une
           page n'a qu'un titre. Sur smartphone il n'existe pas : la
           barre garde son bandeau, qui est la commande (§3). */}
      <div data-titre-inactif="" className="hidden lg:block">
        <LigneResultats
          balise="h2"
          titre={titreControle(
            surLesJaime ? MENU_SUIVIS : MENU_JAIME,
            surLesJaime ? "Mes suivis" : "Mes j'aime",
            surLesJaime ? entreesSuivis : entreesJaime,
            choix
          )}
          sousTitre={null}
        />
      </div>

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

/**
 * LE TITRE-CONTRÔLE (§3, nº 249)
 * ==================================================================
 * SUR SMARTPHONE, le titre est UN MOT : la commande reste le bandeau
 * de la barre, avec son repli — rien ne change de ce côté.
 * SUR LE WEB, LE TITRE EST LE MENU. Le bloc à deux menus de la barre
 * (nº 245/246) faisait doublon : le titre annonce déjà « Mes suivis ·
 * Réalisations · Abstrait » — c'est donc LUI qui s'ouvre. Rien n'est
 * redessiné : c'est `MenuDeroulant`, LE menu de la maison — son
 * chevron (la flèche qu'il porte depuis toujours, celle qui dit qu'il
 * s'ouvre), son panneau `[data-verre-menu]`, et le drapeau `repliable`
 * SANS LEQUEL ni les portes de catégorie ni la sous-porte « Cultures
 * du monde » n'existent (la leçon payée à la nº 247-§3).
 *  · `libelleValeur` fige le texte du champ sur LE NOM DU MENU — le
 *    critère choisi, lui, s'écrit dans le sous-titre, comme sur la
 *    page de recherche ;
 *  · la typographie est CELLE DU TITRE : le bouton hérite de la
 *    police de son heading (le socle du projet fait hériter les
 *    boutons), aucune valeur n'est écrite ici ;
 *  · `-ml-4` rend le rembourrage gauche du champ (`pl-4`) : le texte
 *    du titre s'aligne au pixel sur le sous-titre et sur le titre
 *    smartphone — une compensation de boîte, pas un choix graphique.
 */
function titreControle(
  cle: MenuSelection,
  nom: string,
  entrees: EntreeFiltre[],
  choix: ReturnType<typeof lireSelection>
): React.ReactNode {
  if (entrees.length === 0) return nom;
  return (
    <>
      <span className="lg:hidden">{nom}</span>
      <span data-titre-menu={cle} className="hidden lg:inline-block -ml-4">
        <MenuDeroulant
          valeur={valeurDuMenu(choix, cle)}
          surChangement={(valeur) => poserSelection(cle, valeur)}
          options={entrees}
          ariaLabel={nom}
          placeholder={nom}
          libelleValeur={nom}
          hauteur="min-h-0"
          taillePolice=""
          sansBordure
          sombre
          repliable
        />
      </span>
    </>
  );
}

