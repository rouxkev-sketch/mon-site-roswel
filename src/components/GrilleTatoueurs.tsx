"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { CarteTatoueur } from "@/components/CarteTatoueur";
import { FenetreFiche } from "@/components/FenetreFiche";
import {
  CLE_FENETRE_FICHE,
  type ContexteFenetreFiche,
} from "@/components/RetourFenetreFiche";
import { reposerLaCarteDuHaut } from "@/lib/carte-du-haut";
import { ficheComplete } from "@/lib/fiche-complete";
import {
  lirePhototheque,
  lirePhototequeServeur,
  souscrirePhototheque,
} from "@/lib/vue-phototheque";
import {
  lireDisposition,
  lireDispositionServeur,
  souscrireDisposition,
} from "@/lib/disposition-grille";
import type { Tatoueur } from "@/lib/tatoueurs";

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * LA GRILLE DES TATOUEURS — et sa fenêtre de fiche
 * =================================================
 * La même grille sert l'accueil et les pages style + ville. Sur grand
 * écran (≥ 1024 px), cliquer une carte OUVRE LA FENÊTRE par-dessus la
 * grille (mécanique d'Instagram) au lieu de naviguer ; sur smartphone,
 * le clic navigue vers la page complète, comme avant.
 *
 * L'ADRESSE SUIT LA FENÊTRE : à l'ouverture, `pushState` écrit
 * /tatoueur/nom dans la barre du navigateur (partage possible) — Next
 * sait lire ces pushState natifs. La fenêtre n'est montrée QUE tant
 * que l'adresse correspond : refermer, c'est faire machine arrière
 * dans l'historique, et le bouton « précédent » du navigateur referme
 * donc naturellement. Un rechargement sur /tatoueur/nom sert la vraie
 * page — le référencement ne voit jamais la fenêtre.
 *
 * Le drapeau `data-fenetre-fiche` posé sur <html> prévient
 * DefilementEnHaut : ce changement d'adresse ne doit PAS remonter la
 * grille en haut de page. La fenêtre retire le drapeau en s'effaçant.
 *
 * LE RECHARGEMENT SURVIT (sessionStorage) : chaque ouverture note d'où
 * elle part (adresse de la grille + défilement), chaque fermeture
 * efface la note. Recharger pendant qu'une fenêtre est ouverte sert la
 * page de fiche, qui lit la note (RetourFenetreFiche) et REVIENT ici
 * avec ?fenetre=<slug> : la grille rouvre alors la fenêtre, rend le
 * défilement, et nettoie l'adresse — recherche et retour arrière
 * intacts.
 */
/**
 * COMBIEN DE CARTES CHARGER EN PRIORITÉ ?
 * ========================================
 * Celles qu'on voit SANS DÉFILER, et pas une de plus : chaque image
 * déclarée prioritaire prend de la bande passante à celle que Google
 * mesure vraiment.
 *
 * La grille fait 2 colonnes au doigt, 3 dès 768 px, 4 dès 1280, puis
 * 5 et 6 sur les très grands écrans. Une carte fait une image 4:5 plus
 * deux lignes de texte : sur un écran d'ordinateur, la première rangée
 * tient à l'écran ; sur un téléphone, les deux premières rangées de
 * deux cartes.
 * QUATRE couvre donc les deux cas — la rangée entière jusqu'à 4
 * colonnes, et les quatre premières vignettes au doigt. Au-delà, on
 * précharge des images que personne ne regarde encore.
 */
const CARTES_PRIORITAIRES = 4;


export function GrilleTatoueurs({
  tatoueurs,
  styleRecherche = "",
  renduRecherche = "",
  estompee = false,
}: {
  tatoueurs: Tatoueur[];
  /** Le style demandé dans le moteur — les cartes montrent SA photo. */
  styleRecherche?: string;
  /** LE RENDU demandé (noir et gris, ou couleur), quand la recherche
      n'en laisse qu'un allumé : les cartes montrent une photo qui y
      correspond, et la fenêtre s'ouvre dessus. */
  renduRecherche?: string;
  /** Vrai pendant une recherche : la grille s'estompe. */
  estompee?: boolean;
}) {
  const pathname = usePathname();
  /** La disposition mobile (deux colonnes / une image par ligne) —
      choisie par le bouton rond de la barre, mémorisée localement. */
  const disposition = useSyncExternalStore(
    souscrireDisposition,
    lireDisposition,
    lireDispositionServeur
  );
  /** LA VUE PHOTOTHÈQUE (nº 140) — les images pures. Indépendante de
      la disposition : les deux se combinent librement. */
  const phototheque = useSyncExternalStore(
    souscrirePhototheque,
    lirePhototheque,
    lirePhototequeServeur
  );
  /**
   * LA CARTE QU'ON REGARDE SURVIT À LA BASCULE DE DISPOSITION.
   * Le bouton a noté laquelle occupait le haut de l'écran ; ici, la
   * nouvelle disposition vient d'être calculée mais pas encore peinte
   * (`useLayoutEffect`) : on repose la page sur cette même carte, et
   * l'œil ne voit aucun saut. Sans note — premier rendu, page en
   * haut — il ne se passe rien.
   */
  useEffetAvantPeinture(() => {
    reposerLaCarteDuHaut();
  }, [disposition]);

  const [ficheOuverte, setFicheOuverte] = useState<Tatoueur | null>(null);
  // La position de la grille AU MOMENT DU CLIC : c'est elle que la
  // fenêtre fige puis restitue. Capturée ici, AVANT le pushState —
  // après lui, le routeur peut déplacer brièvement le défilement.
  const [positionGrille, setPositionGrille] = useState(0);

  // La fenêtre ne vit que si l'adresse est la sienne : le bouton
  // « précédent » (l'adresse redevient celle de la grille) ou une
  // recherche depuis la barre la referment sans autre mécanique.
  const visible =
    ficheOuverte !== null && pathname === `/tatoueur/${ficheOuverte.slug}`;

  function ouvrir(tatoueur: Tatoueur) {
    // La note de rechargement : d'où l'on part (adresse de la grille,
    // critères compris — chercher() la tient à jour) et où l'on en
    // était. Elle ne sert QUE si la page est rechargée fenêtre ouverte
    // — toute fermeture propre l'efface (voir plus bas).
    try {
      const note: ContexteFenetreFiche = {
        slug: tatoueur.slug,
        retour: window.location.pathname + window.location.search,
        defilement: window.scrollY,
      };
      sessionStorage.setItem(CLE_FENETRE_FICHE, JSON.stringify(note));
    } catch {
      // Stockage indisponible : le rechargement servira la page
      // complète, comme avant — jamais bloquant.
    }
    setPositionGrille(window.scrollY);
    // Le drapeau AVANT le pushState : DefilementEnHaut le lit au
    // moment où l'adresse change.
    document.documentElement.setAttribute("data-fenetre-fiche", "1");
    window.history.pushState(
      { fenetreFiche: true },
      "",
      `/tatoueur/${tatoueur.slug}`
    );
    setFicheOuverte(tatoueur);
    // LE PORTFOLIO ENTIER ARRIVE JUSTE APRÈS — la fenêtre est déjà
    // ouverte, avec sa photo. On ne remplace la fiche que si c'est
    // toujours celle-là qui est affichée.
    void ficheComplete(tatoueur.slug).then((complete) => {
      if (!complete) return;
      setFicheOuverte((courante) =>
        courante && courante.slug === complete.slug ? complete : courante
      );
    });
  }

  /** Le survol suffit à la demander : au clic, elle est déjà là. */
  const precharger = useCallback((slug: string) => {
    if (document.documentElement.dataset.appareil === "mobile") return;
    void ficheComplete(slug);
  }, []);

  // Machine arrière : l'adresse de la grille revient, et `visible`
  // retombe tout seul. (Stable d'un rendu à l'autre : la fenêtre s'en
  // sert dans un effet qui ne doit tourner qu'une fois par ouverture.)
  const fermer = useCallback(() => {
    window.history.back();
  }, []);

  // FENÊTRE FERMÉE (machine arrière, croix, voile, Échap…) : la note
  // de rechargement n'a plus lieu d'être — elle ne doit survivre QU'À
  // un rechargement, jamais à une fermeture volontaire. Le drapeau
  // évite d'effacer AU MONTAGE la note qu'un rechargement vient
  // justement de laisser (l'effet de réouverture la lit juste après).
  const fenetreDejaVue = useRef(false);
  useEffect(() => {
    if (visible) {
      fenetreDejaVue.current = true;
      return;
    }
    if (!fenetreDejaVue.current) return;
    fenetreDejaVue.current = false;
    try {
      sessionStorage.removeItem(CLE_FENETRE_FICHE);
    } catch {
      // Rien : le stockage absent n'a jamais rien stocké non plus.
    }
  }, [visible]);
  // Quitter la grille fenêtre encore ouverte (fil d'Ariane…) : même
  // ménage au démontage.
  useEffect(
    () => () => {
      if (!fenetreDejaVue.current) return;
      try {
        sessionStorage.removeItem(CLE_FENETRE_FICHE);
      } catch {
        // Rien.
      }
    },
    []
  );

  // RETOUR DE RECHARGEMENT (?fenetre=<slug>) : la page de fiche nous a
  // renvoyé ici pour ROUVRIR la fenêtre. On rend d'abord le défilement
  // noté, on retire `fenetre` de l'adresse (elle doit rester l'adresse
  // PROPRE de la grille dans l'historique), puis on ouvre — l'effet ne
  // tourne qu'au premier rendu.
  const reouvertureFaite = useRef(false);
  useEffect(() => {
    if (reouvertureFaite.current) return;
    reouvertureFaite.current = true;
    if (document.documentElement.dataset.appareil === "mobile") return;
    const parametres = new URLSearchParams(window.location.search);
    const slugDemande = parametres.get("fenetre");
    if (!slugDemande) return;

    parametres.delete("fenetre");
    const requete = parametres.toString();
    const adressePropre =
      window.location.pathname + (requete ? `?${requete}` : "");

    const cible = tatoueurs.find((t) => t.slug === slugDemande);

    let defilement = 0;
    try {
      const note = JSON.parse(
        sessionStorage.getItem(CLE_FENETRE_FICHE) ?? "null"
      ) as ContexteFenetreFiche | null;
      if (note?.slug === slugDemande) defilement = note.defilement || 0;
    } catch {
      defilement = 0;
    }
    // TOUT SE JOUE UN TOUR PLUS TARD : jamais d'état posé en plein
    // montage, et surtout, à ce moment-là, Next a fini d'armer son
    // interception de l'historique — le nettoyage de l'adresse
    // (retirer `fenetre`) reçoit alors les internes du routeur, sans
    // lesquels le retour arrière ne saurait plus relire l'étape. La
    // remontée automatique d'arrivée de page (DefilementEnHaut) est
    // passée elle aussi : la position rendue ici n'est plus écrasée,
    // et `ouvrir` la capture telle quelle. « instant » : le défilement
    // doux global ferait de cette restitution une animation
    // interrompue par le rendu.
    const minuteur = window.setTimeout(() => {
      window.history.replaceState(null, "", adressePropre);
      if (!cible) return; // la fiche n'est plus dans ces résultats.
      window.scrollTo({ top: defilement, left: 0, behavior: "instant" });
      ouvrir(cible);
    }, 0);
    return () => window.clearTimeout(minuteur);
    // `ouvrir` et `tatoueurs` sont stables au premier rendu — l'effet
    // ne doit tourner qu'une fois, le garde-fou ci-dessus s'en charge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        aria-busy={estompee}
        // WEB : des interstices de 20 px sur les deux axes — les
        // cartes respirent, et la localité d'une rangée garde sa
        // distance avec les images de la suivante.
        // VRAIS MOBILES : la grille d'Instagram — bord à bord (elle
        // annule les marges de la page), un interstice d'UNE ligne
        // entre les deux colonnes, angles droits (voir CarteTatoueur).
        // EN « UNE COLONNE » (bouton de disposition) : une image par
        // ligne, bord à bord, rangées bien détachées — la colonne
        // unique est posée en style EN LIGNE : aucune règle de largeur
        // ne peut la contredire. Seuls les vrais mobiles y accèdent :
        // le bouton n'existe pas ailleurs.
        style={disposition === "une" ? { gridTemplateColumns: "1fr" } : undefined}
        // EN PHOTOTHÈQUE (nº 140), L'ÉCART HORIZONTAL EST REPORTÉ À LA
        // VERTICALE : une grille régulière dans les deux sens. Sur le
        // web l'écart des deux axes était déjà le même (gap-5) — c'est
        // la disparition des textes sous l'image qui rend l'écart
        // vertical VISUEL égal à l'horizontal. Sur smartphone, les
        // rangées reprennent l'interstice d'UNE ligne des colonnes
        // (2 px), en deux colonnes comme en pleine largeur.
        className={`grid gap-4 sm:gap-5 mobile:-mx-4 transition-opacity ${
          phototheque
            ? disposition === "une"
              ? "mobile:gap-y-[2px]"
              : "mobile:gap-[2px]"
            : disposition === "une"
              ? "mobile:gap-y-8"
              : "mobile:gap-x-[2px] mobile:gap-y-4"
        } ${
          estompee ? "opacity-60" : "opacity-100"
        } grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6`}
      >
        {tatoueurs.map((tatoueur, rang) => (
          <CarteTatoueur
            key={tatoueur.id}
            tatoueur={tatoueur}
            styleRecherche={styleRecherche}
            renduRecherche={renduRecherche}
            prioritaire={rang < CARTES_PRIORITAIRES}
            phototheque={phototheque}
            surApproche={() => precharger(tatoueur.slug)}
            surOuverture={() => ouvrir(tatoueur)}
          />
        ))}
      </div>

      {/* `key` : chaque ouverture repart de la photo du style cherché,
          jamais de l'état d'une fiche précédente. */}
      <FenetreFiche
        key={ficheOuverte?.id ?? "fermee"}
        tatoueur={visible ? ficheOuverte : null}
        styleRecherche={styleRecherche}
        renduRecherche={renduRecherche}
        positionGrille={positionGrille}
        surFermeture={fermer}
      />
    </>
  );
}
