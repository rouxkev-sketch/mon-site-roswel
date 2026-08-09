"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COULEURS } from "@/config/roswel";
import type { ArtisanResultat, TypeArtisan } from "@/lib/recherche-artisans";
import type { FicheChargee } from "@/lib/fiche-artisan";
import {
  consommerRestaurationPosition,
  consommerTraversee,
  lirePageCourante,
} from "@/lib/navigation-session";
import { nomVilleCourt } from "@/lib/villes";
import { FicheArtisan } from "@/components/FicheArtisan";
import { IconeBouclierTrait, IconeLoupe } from "@/components/Icones";
import { ListeResultats } from "@/components/ListeResultats";
import { PiedDePage } from "@/components/PiedDePage";
import { RechercheCompacte } from "@/components/RechercheCompacte";

/** useLayoutEffect côté navigateur (silencieux côté serveur) :
    exécuté APRÈS la mise à jour du DOM mais AVANT la peinture —
    la restauration de position s'applique sans aucun flash */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Journal de diagnostic du retour, activé par window.__ROSWEL_DEBUG
    (posé par le test). Silencieux en usage normal. */
function journal(etape: string, details: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).__ROSWEL_DEBUG) {
    console.log(`[RETOUR] ${etape}`, JSON.stringify(details));
  }
}

/**
 * L'ÉCRAN DE RECHERCHE (liste + fiche)
 * ------------------------------------
 * - Page de résultats (toutes tailles) : le haut (moteur compact +
 *   filtres) reste STATIQUE, seule la zone à partir du titre défile
 *   (défilement interne discret, position mémorisée — le retour
 *   depuis une fiche retrouve la liste là où elle était).
 * - Sous 1024 px : liste pleine page ; la page fiche montre la
 *   fiche pleine page.
 * - À partir de 1024 px : deux colonnes FIXES centrées — liste
 *   compacte de 400 px à gauche, fiche de 540 px à droite, le reste
 *   de la largeur respire à l'extérieur. Le premier artisan
 *   s'affiche dès l'arrivée ; un clic remplace la fiche et met
 *   l'adresse sur /artisan/nom SANS navigation (la liste reste
 *   complète et immobile) ; précédent/suivant naviguent entre les
 *   artisans consultés.
 * Les deux pages (/[metier]/[ville] et /artisan/[slug]) rendent ce
 * même écran : adresses et contenu serveur inchangés (référencement
 * intact).
 */
export function EcranRecherche({
  metier,
  libelleMetier,
  villeSlug,
  commune,
  filtres,
  filtresActifs,
  inaccessible,
  artisans,
  userId,
  favoris,
  ficheInitiale,
  modeMobile,
  lienSansFiltre,
}: {
  metier: string;
  libelleMetier: string;
  villeSlug: string;
  commune: { nom: string; code_insee: string; code_postal: string } | null;
  filtres: {
    urgence: boolean;
    nuit: boolean;
    weekend: boolean;
    /** « tous » par défaut — fenêtre « Filtrer les résultats » */
    type: TypeArtisan;
  };
  filtresActifs: boolean;
  inaccessible: boolean;
  artisans: ArtisanResultat[];
  userId: string | null;
  favoris: string[];
  /** La fiche affichée à droite dès l'arrivée (premier artisan, ou
      l'artisan de la page fiche) */
  ficheInitiale: FicheChargee | null;
  /** Ce que montre la page sous 1024 px : la liste (page de
      résultats) ou la fiche (page /artisan/nom) */
  modeMobile: "liste" | "fiche";
  /** Où mène « Réessayez sans filtre ». Par défaut la MÊME recherche
      sans aucun filtre — c'est ce que fait la vraie page. La page
      d'aperçu (outil, hors production) s'en sert pour rester chez elle,
      afin qu'on puisse y rejouer le clic sans base de données. */
  lienSansFiltre?: string;
}) {
  const pathname = usePathname();
  const villeRecherchee = commune ? nomVilleCourt(commune.nom) : null;

  // ----- Sélection : pilotée par l'adresse (précédent/suivant du
  // navigateur compris), avec un état local de secours -----
  const slugInitial = ficheInitiale?.artisan.slug ?? null;
  const [slugClique, setSlugClique] = useState<string | null>(null);
  const slugDeLAdresse = pathname.startsWith("/artisan/")
    ? decodeURIComponent(pathname.slice("/artisan/".length))
    : null;
  const slugSelection =
    slugDeLAdresse ??
    slugClique ??
    slugInitial ??
    artisans[0]?.slug ??
    null;

  // Les fiches déjà chargées (l'initiale + celles ouvertes au clic)
  const [fiches, setFiches] = useState<ReadonlyMap<string, FicheChargee>>(
    () =>
      new Map(
        ficheInitiale && slugInitial ? [[slugInitial, ficheInitiale]] : []
      )
  );
  // Échec de chargement, mémorisé PAR fiche (changer de sélection
  // efface naturellement le message)
  const [slugEnEchec, setSlugEnEchec] = useState<string | null>(null);
  // (le garde-fou != null évite « null === null » : sans sélection,
  // il n'y a pas d'échec de chargement — juste rien à charger)
  const chargementEnEchec =
    slugSelection != null && slugEnEchec === slugSelection;
  const ficheCourante = slugSelection ? fiches.get(slugSelection) ?? null : null;
  // Le contour de la colonne fiche est TOUJOURS gris : aucune couleur
  // de niveau (rose/bleu) sur la fiche — seule la ligne « Très
  // recommandé » / « Recommandé » du bloc d'infos garde sa couleur.

  // Fiche manquante (clic ou retour vers un artisan pas encore vu) :
  // chargement via la route JSON — la précédente reste affichée
  useEffect(() => {
    if (!slugSelection || fiches.has(slugSelection)) return;
    let abandonne = false;
    (async () => {
      try {
        const reponse = await fetch(
          `/api/artisan/fiche-complete?slug=${encodeURIComponent(slugSelection)}`
        );
        if (!reponse.ok) throw new Error(String(reponse.status));
        const fiche = (await reponse.json()) as FicheChargee;
        if (!abandonne) {
          setFiches((actuelles) => {
            const suivantes = new Map(actuelles);
            suivantes.set(slugSelection, fiche);
            return suivantes;
          });
        }
      } catch {
        if (!abandonne) setSlugEnEchec(slugSelection);
      }
    })();
    return () => {
      abandonne = true;
    };
  }, [slugSelection, fiches]);

  // Retour/avant du navigateur : la sélection suit l'adresse
  // restaurée (fiche précédente, ou liste de départ)
  useEffect(() => {
    const surRetour = () => {
      const chemin = window.location.pathname;
      setSlugClique(
        chemin.startsWith("/artisan/")
          ? decodeURIComponent(chemin.slice("/artisan/".length))
          : null
      );
    };
    window.addEventListener("popstate", surRetour);
    return () => window.removeEventListener("popstate", surRetour);
  }, []);

  // La colonne de droite revient en haut à chaque changement de fiche
  const colonneFiche = useRef<HTMLElement>(null);
  const zoneListe = useRef<HTMLDivElement>(null);
  const cadreColonnes = useRef<HTMLDivElement>(null);
  useEffect(() => {
    colonneFiche.current?.scrollTo(0, 0);
  }, [slugSelection]);

  // ----- MOLETTE DANS LES MARGES (web, ≥ 768 px) -----
  // Les marges qui entourent les colonnes — le centrage du contenu
  // plafonné à 1192 px, les 16 px de bord, la gouttière de 20 px entre
  // les deux colonnes, l'air au-dessus et en dessous — n'appartiennent
  // à AUCUNE zone défilante : la molette n'y produisait rien.
  // La solution évidente serait de transformer ces marges en
  // rembourrage INTERNE des conteneurs défilants. Elle est ici
  // impraticable : la fiche est un CADRE de hauteur fixe (contour,
  // fond, ombre) dont seul le contenu défile ; élargir le conteneur
  // défilant jusqu'aux bords ferait défiler le cadre lui-même, qui
  // disparaîtrait vers le haut. Le rendu changerait.
  // On garde donc la mise en page au pixel près et on ROUTE la molette :
  // un évènement reçu dans une marge est appliqué à la colonne qui lui
  // fait face — celle de gauche à gauche de la frontière, celle de
  // droite au-delà. Quand le curseur est déjà au-dessus d'une zone
  // défilante, on ne fait rien : le navigateur s'en charge.
  useEffect(() => {
    const surMolette = (evenement: WheelEvent) => {
      // WEB uniquement : sous 768 px, rien ne change.
      if (window.innerWidth < 768) return;
      if (evenement.ctrlKey) return; // zoom du navigateur
      const cadre = cadreColonnes.current;
      if (!cadre) return;
      // On n'agit qu'À PARTIR du haut des colonnes : au-dessus se
      // trouve l'en-tête du site, qui ne doit rien commander.
      // En revanche tout ce qui est EN DESSOUS compte — c'est là que se
      // trouve la marge basse, hors du cadre.
      if (evenement.clientY < cadre.getBoundingClientRect().top) return;
      // Déjà sur une zone défilante ? on laisse faire le navigateur.
      let noeud = evenement.target as HTMLElement | null;
      while (noeud) {
        const style = getComputedStyle(noeud);
        if (
          /(auto|scroll)/.test(style.overflowY) &&
          noeud.scrollHeight > noeud.clientHeight + 1
        ) {
          return;
        }
        noeud = noeud.parentElement;
      }
      const colonnes = [zoneListe.current, colonneFiche.current].filter(
        (element): element is HTMLElement =>
          !!element &&
          element.getClientRects().length > 0 &&
          element.scrollHeight > element.clientHeight + 1
      );
      if (colonnes.length === 0) return;
      let cible = colonnes[0];
      if (colonnes.length === 2) {
        // La frontière : le milieu de la gouttière qui sépare les deux
        // colonnes. À gauche → les cartes, à droite → la fiche.
        const frontiere =
          (colonnes[0].getBoundingClientRect().right +
            colonnes[1].getBoundingClientRect().left) /
          2;
        cible = evenement.clientX < frontiere ? colonnes[0] : colonnes[1];
      }
      // deltaMode 1 = lignes, 2 = pages : ramené en pixels.
      const pas =
        evenement.deltaMode === 1
          ? evenement.deltaY * 16
          : evenement.deltaMode === 2
            ? evenement.deltaY * cible.clientHeight
            : evenement.deltaY;
      cible.scrollTop += pas;
      evenement.preventDefault();
    };
    // Écouteur posé sur la FENÊTRE, et non sur le cadre des colonnes :
    // les marges de centrage (le contenu est plafonné à 1192 px) et
    // l'air sous les colonnes sont EN DEHORS de ce cadre — un écouteur
    // qui y serait attaché ne les verrait jamais.
    // `passive: false` : React pose ses écouteurs de molette en mode
    // passif, où `preventDefault()` est ignoré — d'où l'écouteur natif.
    window.addEventListener("wheel", surMolette, { passive: false });
    return () => window.removeEventListener("wheel", surMolette);
  }, []);

  // ----- Menu repliable (SMARTPHONE uniquement, < 640 px) -----
  // Au défilement de la liste, le moteur (champs + filtres) se
  // replie en une barre compacte « métier · ville » + loupe qui
  // reste fixe en haut ; un tap la redéploie. Jamais de disparition
  // totale (motif Airbnb/Booking). Hystérésis : repli après 48 px,
  // redéploiement automatique près du haut (8 px) — pas de
  // clignotement à la frontière. Sur iPad/web : rien ne change.
  const [menuReplie, setMenuReplie] = useState(false);
  // Après un tap de redéploiement, le menu qui grandit peut faire
  // « sauter » la zone (recalage iOS) : on ignore ces défilements
  // parasites une demi-seconde
  const deploiementForce = useRef(0);
  useEffect(() => {
    const zone = zoneListe.current;
    if (!zone) return;
    const surDefilement = () => {
      if (!window.matchMedia("(max-width: 639.9px)").matches) return;
      if (Date.now() < deploiementForce.current) return;
      setMenuReplie((etat) =>
        etat ? zone.scrollTop > 8 : zone.scrollTop > 48
      );
    };
    zone.addEventListener("scroll", surDefilement, { passive: true });
    return () => zone.removeEventListener("scroll", surDefilement);
  }, []);

  function deployerMenu() {
    deploiementForce.current = Date.now() + 500;
    setMenuReplie(false);
  }

  // ----- Mémoire de défilement de la LISTE (zone interne) -----
  // Clé stable = la recherche elle-même (jamais l'adresse du moment,
  // qui devient /artisan/nom au fil des sélections)
  const cleDefilementListe = `roswel:defilement-liste:/${metier}/${villeSlug}?u=${
    filtres.urgence ? 1 : 0
  }&n=${filtres.nuit ? 1 : 0}&w=${filtres.weekend ? 1 : 0}&t=${filtres.type}`;

  useEffetAvantPeinture(() => {
    const zone = zoneListe.current;
    if (!zone) return;

    // Au montage APRÈS un retour (bouton retour de la fiche, ou
    // précédent/suivant du navigateur) : la liste retrouve sa
    // position — sinon (nouvelle recherche), elle démarre en haut
    const [navigation] = performance.getEntriesByType("navigation") as
      PerformanceNavigationTiming[];
    // Les deux drapeaux sont consommés ENSEMBLE (jamais de « ou »
    // court-circuité : un drapeau oublié ressurgirait sur une
    // recherche neuve) — et uniquement sur la page LISTE : la page
    // fiche ne doit pas les griller avant le retour. Dernier filet
    // (iPhone en plein écran : signaux parfois perdus) : le JOURNAL
    // persistant — si la page d'où l'on vient est une fiche, ce
    // montage de liste est un retour, on restaure.
    const traversee = consommerTraversee();
    const restauration = consommerRestaurationPosition();
    const vientDeFiche = lirePageCourante()?.startsWith("/artisan/") === true;
    const doitRestaurer =
      modeMobile === "liste"
        ? traversee ||
          restauration ||
          navigation?.type === "back_forward" ||
          vientDeFiche
        : false;
    let positionCible = 0;
    try {
      positionCible = Number(localStorage.getItem(cleDefilementListe)) || 0;
    } catch {
      // sans mémoire : haut de liste
    }
    journal("montage liste", {
      modeMobile,
      cle: cleDefilementListe,
      traversee,
      restauration,
      navType: navigation?.type,
      vientDeFiche,
      doitRestaurer,
      positionCible,
      zoneClientH: zone.clientHeight,
      zoneScrollH: zone.scrollHeight,
    });
    if (doitRestaurer && positionCible > 0) {
      // AVANT LA PREMIÈRE PEINTURE : la pagination « Voir plus »
      // est déjà rendue (longueur lue dès le premier rendu), la
      // position s'applique immédiatement — la liste apparaît
      // directement au bon endroit, sans flash en haut. Les
      // passes suivantes ne servent que de filet (premier
      // chargement après hydratation) et s'arrêtent dès que la
      // position est atteinte.
      let atteinte = false;
      const appliquer = (etape: string) => {
        if (atteinte) return;
        zone.scrollTop = positionCible;
        if (Math.abs(zone.scrollTop - positionCible) <= 1) atteinte = true;
        journal("restauration", {
          etape,
          voulu: positionCible,
          obtenu: zone.scrollTop,
          scrollH: zone.scrollHeight,
          atteinte,
        });
      };
      appliquer("sync");
      queueMicrotask(() => appliquer("microtask"));
      requestAnimationFrame(() => {
        appliquer("raf1");
        requestAnimationFrame(() => {
          appliquer("raf2");
          window.setTimeout(() => appliquer("timeout150"), 150);
        });
      });
    }

    // Seule la page de résultats gère la mémoire de position
    if (modeMobile !== "liste") return;

    // CAUSE RACINE du bug de retour (enfin diagnostiquée) :
    // au CLIC sur une carte, la navigation vers la fiche déclenche
    // une transition de mise en page (le <main> passe de
    // « recherche-fixe » à « mode-double », ce qui, via les règles
    // `body:has(...)`, modifie brièvement la hauteur de la liste
    // ENCORE MONTÉE). La liste rétrécit un court instant, le
    // navigateur BORNE (clamp) scrollTop à la nouvelle hauteur, un
    // événement `scroll` se déclenche, et l'écouteur de mémorisation
    // enregistrait cette valeur ROGNÉE — écrasant la vraie position.
    // Au retour, on restaurait donc une position trop basse (jusqu'à
    // « en haut » sur une liste longue).
    //
    // Correction : au CLIC sur une carte (phase de capture, AVANT
    // toute navigation), on fige la position EXACTE du moment, puis
    // on GÈLE toute écriture ultérieure — les clamps de transition ne
    // peuvent plus corrompre la mémoire. Sur grand écran (ouverture
    // en colonne, sans navigation) on ne gèle pas : la liste reste et
    // continue de mémoriser normalement.
    let gel = false;
    // Position capturée AU POINTERDOWN (avant la moindre transition
    // de mise en page) : à l'instant du clic, la liste a déjà pu
    // rétrécir et scrollTop est déjà rogné — trop tard. Le
    // pointerdown, lui, précède tout changement.
    let positionAuContact = Math.round(zone.scrollTop);
    const estLienCarte = (cible: EventTarget | null) =>
      cible instanceof Element && !!cible.closest('a[href^="/artisan/"]');

    const surContact = (evenement: Event) => {
      if (estLienCarte(evenement.target)) {
        positionAuContact = Math.round(zone.scrollTop);
      }
    };
    const figerAvantNavigation = (evenement: Event) => {
      if (!estLienCarte(evenement.target)) return;
      // Grand écran (≥ 1024 px, deux colonnes) : ouverture en colonne, la
      // liste reste montée et continue de mémoriser — pas de gel. Sous
      // 1024 px (une colonne, navigation vers la fiche), on gèle.
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      try {
        localStorage.setItem(cleDefilementListe, String(positionAuContact));
        journal("figé au clic", { valeur: positionAuContact, auClic: Math.round(zone.scrollTop) });
      } catch {
        // stockage indisponible
      }
      gel = true;
    };
    zone.addEventListener("pointerdown", surContact, true);
    zone.addEventListener("click", figerAvantNavigation, true);

    let ecriturePrevue = false;
    const memoriser = () => {
      if (gel || ecriturePrevue) return;
      ecriturePrevue = true;
      requestAnimationFrame(() => {
        ecriturePrevue = false;
        // Ceinture et bretelles : ni pendant le gel, ni depuis une
        // zone masquée
        if (gel || zone.clientHeight === 0) return;
        try {
          localStorage.setItem(
            cleDefilementListe,
            String(Math.round(zone.scrollTop))
          );
          journal("ecriture", { cle: cleDefilementListe, valeur: Math.round(zone.scrollTop) });
        } catch {
          // stockage indisponible : la liste reviendra en haut
        }
      });
    };
    zone.addEventListener("scroll", memoriser, { passive: true });
    return () => {
      zone.removeEventListener("pointerdown", surContact, true);
      zone.removeEventListener("click", figerAvantNavigation, true);
      zone.removeEventListener("scroll", memoriser);
    };
  }, [cleDefilementListe, modeMobile]);

  function ouvrirFiche(slug: string) {
    if (slug === slugSelection) return;
    setSlugClique(slug);
    // L'adresse suit la fiche affichée, SANS navigation ni
    // rechargement (chaque sélection reste dans l'historique) —
    // la liste, elle, ne bouge pas d'un pixel
    window.history.pushState(null, "", `/artisan/${slug}`);
  }

  return (
    // SOUS 1024 px : UNE SEULE COLONNE (liste OU fiche).
    //   • < 768 px (smartphone) : colonne FLUIDE, plafonnée à 730 px et
    //     centrée (petite marge dès ~730) ; le contenu de la liste est en
    //     plus borné à 560 px (voir plus bas) ;
    //   • 768–1023 px :
    //       - LISTE : PLEINE LARGEUR — moteur sur UNE ligne, séparateur bord
    //         à bord, cartes en GRILLE de 2 par rangée (voir RechercheCompacte
    //         et ListeResultats) ;
    //       - FICHE : bornée à 700 px et centrée (INCHANGÉE).
    //     L'EN-TÊTE reste PLEINE LARGEUR (logo au bord gauche de l'écran,
    //     icônes au bord droit — voir globals.css).
    // DÈS 1024 px : deux colonnes fluides liste/fiche = 480/660 (ratio web),
    // qui remplissent la largeur et rétrécissent ensemble sans saut. Contenu
    // plafonné à 1160 px (max-w 1192 = 1160 + 2×16), EXACTEMENT comme la page
    // d'accueil — même largeur max, mêmes marges. pt-4 sans pb.
    <div
      ref={cadreColonnes}
      className="flex-1 min-h-0 flex flex-col lg:flex-row lg:h-full lg:w-full lg:mx-auto lg:gap-5 lg:px-4 lg:pt-4 lg:max-w-[1192px]"
    >
      {/* ============ Colonne GAUCHE : moteur FIXE + liste ============ */}
      <section
        aria-label="Résultats de recherche"
        className={`${
          modeMobile === "liste" ? "flex" : "hidden"
        } lg:flex flex-col h-full min-h-0 w-full md:max-w-none mx-auto md:mx-0 lg:min-w-0 lg:flex-[480_1_0%]`}
      >
        {/* Le haut STATIQUE : moteur compact + filtres, souligné
            d'une FINE LIGNE de séparation (tous supports, menu
            déployé comme replié) qui marque la limite entre le menu
            fixe et le contenu qui défile dessous */}
        {commune && (
          <div
            className={`shrink-0 bg-fond min-[560px]:bg-fond-page border-b border-bordure px-4 pt-4 pb-3 lg:px-0.5 lg:pt-0 ${
              menuReplie ? "max-sm:pt-2 max-sm:pb-2" : ""
            }`}
          >
            {/* Le moteur occupe la PLEINE LARGEUR (bord à bord) — pas de
                marges latérales. Le moteur complet reste MONTÉ quand il est
                replié (les champs gardent leur saisie) — simplement masqué
                sur smartphone ; jamais masqué dès 640 px */}
            <div className={menuReplie ? "max-sm:hidden" : ""}>
              <RechercheCompacte
                metierActuel={metier}
                villeActuelle={{
                  nom: commune.nom,
                  slug: villeSlug,
                  code_insee: commune.code_insee,
                  code_postal: commune.code_postal,
                }}
                filtres={filtres}
              />
            </div>

            {/* La barre compacte du menu replié (smartphone) :
                loupe + « Plombier · Écully » — un tap redéploie */}
            {menuReplie && (
              <button
                type="button"
                onClick={deployerMenu}
                aria-label="Modifier la recherche"
                aria-expanded={false}
                className="sm:hidden w-full min-h-[44px] rounded-2xl border border-bordure bg-fond flex items-center gap-2.5 px-4 text-left active:bg-fond-doux transition-colors"
              >
                <IconeLoupe taille={17} classe="shrink-0 text-primaire" />
                {/* Résumé COMPLET : métier · ville · filtres actifs,
                    tronqué proprement (…) si trop long */}
                <span className="text-sm font-semibold truncate">
                  {[
                    libelleMetier,
                    nomVilleCourt(commune.nom),
                    filtres.urgence && "Urgence",
                    filtres.nuit && "La nuit",
                    filtres.weekend && "Le week-end",
                    filtres.type === "independant" && "Indépendants",
                    filtres.type === "societe" && "Entreprises",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            )}
          </div>
        )}

        {/* La zone DÉFILANTE : titre, compte, cartes, pied de page.
            En mode double, un retrait horizontal MINIMAL (2 px, aligné
            sur le moteur au-dessus) préserve le liseré DROIT des cartes.
            IMPORTANT — overflow-x est fixé EXPLICITEMENT à « hidden »
            (et non laissé se promouvoir en « auto » à cause du
            overflow-y) : le débord horizontal est simplement rogné, sans
            JAMAIS déclencher de barre de défilement horizontale parasite
            (qui apparaissait au redimensionnement / retour navigateur).
            Le défilement vertical (auto) garde sa barre masquée. */}
        {/* La zone des cartes est au FOND GRIS très clair — à TOUTES
            les tailles (mobile compris) : sur la page de résultats, seul
            le moteur au-dessus reste blanc en mobile ; dès 768 px, tout
            le moteur passe aussi au gris (voir le bloc statique ci-dessus).
            Les cartes (blanc pur) « flottent » sur ce gris. */}
        <div
          ref={zoneListe}
          className="colonne-defilante flex-1 min-h-0 overflow-y-auto overflow-x-hidden defilement-discret px-4 pb-4 lg:px-0.5 bg-fond-page max-lg:flex max-lg:flex-col"
        >
          {/* Rythme vertical de la page : 16 px sous la ligne de
              séparation, 6 px entre le titre et son compteur (ils
              forment un bloc), puis 16 px avant la première carte */}
          {/* « de confiance » dans le H1 : le visiteur qui arrive
              directement (Google) comprend tout de suite le
              positionnement de Roswel. */}
          {/* SOUS 768 px : le contenu de la liste (titre, compteur, cartes)
              est BORNÉ à 480 px et centré — les cartes restent resserrées et
              bien proportionnées, avec de VRAIES marges latérales (le moteur,
              lui, reste pleine largeur bord à bord — voir plus haut). Le fond
              gris garde la pleine largeur de la colonne. `md:contents`
              neutralise ce cadre dès 768 px : la grille 2 colonnes et le mode
              double gardent leur mise en page. */}
          {/* `w-full` est INDISPENSABLE depuis que la colonne est une
              colonne flexible (pied de page collant) : sur un élément
              flexible, une marge automatique horizontale ANNULE
              l'étirement et rabat la largeur sur celle du contenu — les
              cartes perdaient alors une douzaine de pixels. Avec
              `w-full`, on retrouve exactement le comportement de bloc :
              toute la largeur disponible, plafonnée à 480 px, centrée. */}
          <div className="w-full max-w-[480px] mx-auto md:contents">
          {/* SEO — UN SEUL <h1> par page. Page de RÉSULTATS
              (modeMobile « liste ») : ce titre EST le titre principal.
              Page FICHE (/artisan/nom) : la colonne de liste n'est qu'un
              complément — le titre principal est le nom de l'artisan, ce
              titre passe donc en <h2>. Rendu visuel identique. */}
          {modeMobile === "liste" ? (
            <h1 className="text-xl font-bold px-1 pt-4">
              {libelleMetier} de confiance
              {commune && <> à {nomVilleCourt(commune.nom)}</>}
            </h1>
          ) : (
            <h2 className="text-xl font-bold px-1 pt-4">
              {libelleMetier} de confiance
              {commune && <> à {nomVilleCourt(commune.nom)}</>}
            </h2>
          )}

          {inaccessible ? (
            <div className="mt-6 rounded-3xl border border-bordure bg-fond-doux p-6 text-center">
              <p className="text-encre-douce">
                Impossible de joindre la base pour le moment. Vérifie la
                connexion internet puis recharge la page.
              </p>
            </div>
          ) : artisans.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-bordure bg-fond-doux p-6 text-center">
              {/* Message sur deux lignes exactement, sans icône */}
              <p className="font-semibold">
                Aucun artisan disponible
                <br />
                pour cette recherche
              </p>
              {filtresActifs && (
                <Link
                  href={lienSansFiltre ?? `/${metier}/${villeSlug}`}
                  className="inline-flex items-center justify-center mt-2 min-h-[44px] text-sm text-primaire font-medium underline underline-offset-2"
                >
                  Réessayez sans filtre
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* BLOC 2 : « N artisans » en GRAS NOIR + séparateur « · » +
                  méthodologie en gris foncé (plus de pastille cerclée). */}
              <p className="mt-1.5 px-1 text-[12px]" style={{ color: "#474747" }}>
                <span className="font-bold" style={{ color: "#101B33" }}>
                  {artisans.length} artisan{artisans.length > 1 ? "s" : ""}
                </span>
                {" · classés par score de confiance"}
              </p>

              {/* BLOC 3 : ligne méthodologie DISCRÈTE, resserrée sous le
                  bloc 2 — petit bouclier rose + texte gris FONCÉ (#474747),
                  même gris que « classés par score de confiance » au-dessus. */}
              <p
                className="flex items-center gap-1.5 mt-2 px-1 text-[12px]"
                style={{ color: "#474747" }}
              >
                <span className="shrink-0 flex" style={{ color: "#D4537E" }} aria-hidden>
                  <IconeBouclierTrait taille={14} />
                </span>
                Avis Google · ancienneté vérifiée · présence Instagram
              </p>
              <ListeResultats
                artisans={artisans}
                userId={userId}
                favoris={favoris}
                villeRecherchee={villeRecherchee}
                metierRecherche={libelleMetier}
                surClicFiche={ouvrirFiche}
              />
            </>
          )}
          </div>

          {/* Sur mobile, le pied de page vit en fin de liste (celui
              du layout est masqué sur cette page) ; en mode double
              il est déjà dans la colonne de la fiche.
              PIED DE PAGE COLLANT : sur cette page, le pied ne peut pas
              compter sur le mécanisme habituel (corps en colonne, <main>
              extensible) — il n'est pas dans le <main>, il vit DANS la
              zone défilante des cartes, et celle du layout est masquée.
              Quand la recherche ne ramène qu'un ou deux artisans, il se
              retrouvait donc juste sous la dernière carte, avec une
              grande zone grise vide en dessous. `mt-auto` dans une
              colonne flexible absorbe exactement cette place perdue : le
              pied descend au bas de l'écran, le vide passe AU-DESSUS de
              lui. Contenu long : la marge automatique vaut zéro, le pied
              revient après la dernière carte et n'apparaît qu'en fin de
              défilement — il n'est jamais fixe.
              La colonne n'est mise en mode flexible QUE sous 1024 px
              (`max-lg:flex max-lg:flex-col`) : en mode deux colonnes, où
              le pied vit dans la fiche, rien ne change. */}
          <div className="lg:hidden mt-auto">
            <PiedDePage />
          </div>
        </div>
      </section>

      {/* ============ Colonne DROITE : la fiche ============ */}
      {/* Le cadre : la section intérieure défile ; le contour est un
          CALQUE posé PAR-DESSUS le bord du contenu (dernier enfant,
          pointer-events-none). Dessiné au-dessus, il est collé au
          contenu PAR CONSTRUCTION : plus jamais de fine marge
          blanche entre le trait et la photo, quel que soit le zoom
          ou la densité de l'écran. */}
      {/* DÈS 480 px, la fiche est un BLOC AUTONOME qui défile à
          l'intérieur (comme la colonne de droite du mode double) :
          - 480–767 px (fiche seule, une colonne) : bloc FLUIDE plafonné à
            730 px et centré, hauteur pleine (moins les marges), qui défile
            à l'intérieur — le contour englobe tout jusqu'au bandeau contact ;
          - 768–1023 px (une colonne) : bloc centré BORNÉ à 700 px (mêmes
            largeur/marges que la liste), toujours défilant à l'intérieur ;
          - ≥ 1024 px (deux colonnes FLUIDES) : la colonne fiche prend
            660 parts contre 480 pour la liste (ratio web), et rétrécit
            proportionnellement de 1024 à 1160 (plafond). La photo carrée
            suit automatiquement la largeur de la colonne.
          my-4 : marges haute ET basse égales ; le contour ne touche
          jamais les bords de la fenêtre. */}
      <div
        className={`${
          modeMobile === "fiche" ? "block" : "hidden"
        } lg:block relative min-w-0 min-[480px]:max-lg:flex-1 min-[480px]:max-lg:min-h-0 min-[480px]:max-lg:mx-auto min-[480px]:max-[560px]:w-full min-[480px]:max-[560px]:max-w-[730px] min-[560px]:max-lg:w-[calc(100%-32px)] min-[560px]:max-lg:max-w-[700px] min-[480px]:max-lg:my-4 lg:min-h-0 lg:mb-4 lg:flex-[660_1_0%]`}
      >
        <section
          ref={colonneFiche}
          aria-label="Fiche de l'artisan"
          // De 768 à 1023 px — la fiche SEULE sur une colonne — cette
          // section n'est PLUS un conteneur défilant : ni hauteur
          // imposée, ni `overflow` — sur AUCUN des deux axes. Poser
          // `overflow-x: hidden` seul ne suffisait pas à la neutraliser :
          // quand un axe est masqué, CSS force l'autre à `auto`, et la
          // section restait défilante. C'est la page qui défile, et la
          // barre du navigateur s'affiche à l'extrême droite de la
          // fenêtre au lieu d'être enfermée dans l'encadré arrondi.
          // Sous 768 px (téléphone) et dès 1024 px (deux colonnes), le
          // défilement interne est conservé tel quel.
          className="colonne-defilante min-[480px]:flex min-[480px]:flex-col min-[480px]:h-full min-[480px]:min-h-0 min-[480px]:overflow-y-auto min-[480px]:overflow-x-hidden defilement-discret min-[560px]:rounded-2xl min-[480px]:bg-fond min-[560px]:shadow-[0_1px_4px_rgba(16,27,51,0.06)]"
        >
          {ficheCourante ? (
            <FicheArtisan
              artisan={ficheCourante.artisan}
              favori={{
                userId,
                actif: favoris.includes(ficheCourante.artisan.id),
              }}
              communesCouvertes={ficheCourante.communesCouvertes}
              nombreFavoris={ficheCourante.nombreFavoris ?? null}
              metierSlug={metier}
              villeSlug={villeSlug}
              // Le nom de l'artisan n'est le <h1> de la page QUE sur la
              // page fiche (/artisan/nom). Sur la page de résultats, le
              // <h1> est « Métier de confiance à Ville » (ci-dessus).
              titrePrincipal={modeMobile === "fiche"}
            />
          ) : (
            <>
              <div className="max-w-[730px] mx-auto p-6 text-center text-encre-douce text-sm">
                {/* le message de connexion est réservé aux VRAIS échecs
                    de chargement — recherche sans résultat : état calme */}
                {chargementEnEchec
                  ? "Impossible de charger cette fiche pour le moment — vérifie la connexion puis réessaie."
                  : slugSelection
                    ? "Chargement de la fiche…"
                    : artisans.length === 0
                      ? "Aucun artisan à afficher — modifiez votre recherche."
                      : "Sélectionnez un artisan dans la liste pour afficher sa fiche."}
              </div>
              {/* LE PIED DE PAGE NE DÉPEND PAS DES RÉSULTATS.
                  En mode deux colonnes il vit DANS la fiche (celui du
                  layout est masqué sur cette page, et celui de la colonne
                  des cartes est réservé aux petites largeurs). Quand la
                  recherche ne ramenait aucun artisan, il n'y avait pas de
                  fiche — donc plus aucun pied de page nulle part. Il est
                  désormais rendu ici aussi, au même endroit et dans le
                  même style que dans une fiche : collé au bas de la
                  colonne par `mt-auto`, avec ses 32 px d'air au-dessus. */}
              <div className="mt-auto">
                <PiedDePage classe="pt-8 pb-4" />
              </div>
            </>
          )}
        </section>
        {/* z-50 : au-dessus de la barre de contact, pour que le
            contour reste continu jusqu'en bas du bloc.
            PRÉSENT DÈS 560 px (et non plus 768) : c'est la largeur à
            laquelle la fiche adopte la présentation de la version web,
            encadrement compris — coins 16 px, contour EXACTEMENT celui
            des cartes de résultats (#E6E7EB, 1 px) et ombre douce
            portée par la section. Sous 560 px (téléphone tenu en main),
            AUCUN contour : la fiche occupe tout l'écran, comme avant. */}
        <div
          aria-hidden
          className="hidden min-[560px]:block absolute inset-0 z-50 rounded-2xl border pointer-events-none"
          style={{ borderColor: COULEURS.bordureCarteClaire }}
        />
      </div>
    </div>
  );
}
