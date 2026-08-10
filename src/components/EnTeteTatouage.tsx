"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lieuVersParametres } from "@/lib/geocodage";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { IconeFanion, IconeSilhouette } from "@/components/Icones";
import { LogoYokofolio } from "@/components/LogoYokofolio";
import { MenuEspace } from "@/components/MenuEspace";
import { SelecteurLangue } from "@/components/SelecteurLangue";
import {
  lireDejaConnecte,
  lireDejaConnecteServeur,
  marquerDejaConnecte,
  souscrireStockage,
} from "@/lib/deja-connecte";
import { useUtilisateur } from "@/lib/use-utilisateur";
import {
  criteresComplets,
  MoteurTatouage,
  type CritèresTatouage,
} from "@/components/MoteurTatouage";

/**
 * LA BARRE FIXE DE YOKOFOLIO
 * ==========================
 * Logo à gauche, moteur de recherche AU CENTRE, et à droite le globe
 * des langues puis le compte. Rien d'autre.
 *
 * LE LOGO COMPLET S'AFFICHE PARTOUT, smartphone compris : une marque
 * se lit, elle ne se devine pas — le cœur seul ne suffit pas. Sur
 * smartphone, c'est le bouton de compte qui se réduit en icône pour
 * lui laisser la place.
 *
 * LE COMPTE, trois états :
 *  - jamais venu : « Rejoindre » (web) / l'icône personnage
 *    grise, du même poids visuel que le globe (smartphone) — la
 *    formule d'invitation est réservée à qui n'a jamais eu de compte
 *    ici ;
 *  - DÉJÀ CONNECTÉ SUR CE NAVIGATEUR puis déconnecté : « Se
 *    connecter » — la mémoire est un simple drapeau local (« 1 »),
 *    sans aucune donnée personnelle, comme le font les grands sites ;
 *  - connecté : « MON ESPACE » (web) / l'icône passée en ROSE
 *    (smartphone) — et le bouton n'emmène plus nulle part : il OUVRE
 *    LE MENU DE COMPTE (MenuEspace) — état de la fiche, Modification,
 *    Ma fiche, Déconnexion.
 *
 * LE MOTEUR peut être retiré de la barre MOBILE (`moteurMobile`) : sur
 * les pages sans rapport avec la recherche (connexion, mentions
 * légales, qui sommes-nous), la barre du smartphone ne montre que le
 * logo, le globe et le compte. Sur le web, le moteur reste : il RAMÈNE
 * à l'accueil avec les critères choisis.
 *
 * DEUX FAÇONS DE CHERCHER, un seul composant :
 *  - sur l'accueil, `criteres` et `surRecherche` sont fournis → la
 *    grille se met à jour sur place, sans rechargement ;
 *  - ailleurs (fiche, page style + ville), ils ne le sont pas → le
 *    moteur garde son propre état et RAMÈNE à l'accueil avec les
 *    critères dans l'adresse.
 */

/** Hauteur du globe et du bouton de compte : ils s'alignent au pixel. */
const HAUTEUR_ACTIONS = 40;

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function EnTeteTatouage({
  criteres,
  criteresInitiaux,
  surRecherche,
  moteurMobile = true,
}: {
  /** Critères PILOTÉS PAR LA PAGE (accueil). Absent = état interne. */
  criteres?: CritèresTatouage;
  criteresInitiaux?: Partial<CritèresTatouage>;
  surRecherche?: (criteres: CritèresTatouage) => void;
  /** Faux = pas d'encadré de recherche dans la barre du SMARTPHONE
      (pages connexion, légales, qui sommes-nous). Le web le garde. */
  moteurMobile?: boolean;
}) {
  const router = useRouter();
  const { utilisateur, nom } = useUtilisateur();
  const connecte = utilisateur !== null;

  /** Vrai si un compte s'est DÉJÀ connecté sur ce navigateur : le
      bouton dit alors « Se connecter » au lieu d'inviter à s'inscrire. */
  const dejaConnecte = useSyncExternalStore(
    souscrireStockage,
    lireDejaConnecte,
    lireDejaConnecteServeur
  );
  // Chaque session connectée POSE le drapeau — c'est tout ce qu'on
  // retient de ce navigateur.
  useEffect(() => {
    if (connecte) marquerDejaConnecte();
  }, [connecte]);

  // État interne, utilisé UNIQUEMENT quand la page ne pilote rien
  // (fiche, page style + ville).
  const [internes, setInternes] = useState(() =>
    criteresComplets(criteresInitiaux)
  );
  const valeur = criteres ?? internes;

  function chercher(suivants: CritèresTatouage) {
    if (surRecherche) {
      surRecherche(suivants);
      return;
    }
    setInternes(suivants);
    const parametres = new URLSearchParams();
    if (suivants.style) parametres.set("style", suivants.style);
    if (suivants.exclure.length > 0) {
      parametres.set("exclure", suivants.exclure.join(","));
    }
    if (suivants.lieu) {
      // Le LIEU voyage en clair dans l'adresse (intitulé, contexte,
      // coordonnées) : la recherche reste partageable et survit au
      // rechargement — voir lib/geocodage.
      for (const [cle, valeur] of Object.entries(
        lieuVersParametres(suivants.lieu)
      )) {
        parametres.set(cle, valeur);
      }
      parametres.set("rayon", String(suivants.rayonKm));
    }
    const requete = parametres.toString();
    router.push(requete ? `/?${requete}` : "/");
  }

  /** Déconnecté : « Se connecter » pour qui est déjà venu, la formule
      d'invitation pour les autres. Le même libellé sert d'info-bulle à
      l'icône du smartphone. (Connecté, c'est MenuEspace qui joue.) */
  const libelleDeconnecte = dejaConnecte
    ? "Se connecter"
    : TEXTES_TATOUAGE.lienInscription;

  /** LA BARRE SE POSE AU DÉFILEMENT (passe nº 144-§1). Le trait qui la
      séparait du contenu était LE DERNIER CONTOUR du site : il a
      disparu. À sa place, la règle de la charte — les niveaux se
      distinguent par leur CLARTÉ : en haut de page la barre est
      TRANSPARENTE (elle appartient à la page) ; dès que du contenu
      passe dessous, son fond s'éclaircit d'un cran, et c'est cette
      nuance qui la détache. Le seuil de 8 px évite le clignotement sur
      les micro-défilements élastiques. */
  const [posee, setPosee] = useState(false);
  /** LA LIGNE DE RECHERCHE SE RÉTRACTE (passe nº 147-§7, smartphone).
      En DESCENDANT dans les cartes, la rangée du moteur se replie et
      libère sa hauteur ; elle REVIENT AU PREMIER GESTE vers le haut —
      immédiatement, sans attendre le haut de page : c'est ce qui
      distingue une barre rétractable réussie d'une barre pénible.
      Près du haut (moins de 64 px), elle est toujours dépliée. Le
      seuil de 4 px par lecture ignore l'élastique du défilement.
      ⚠️ LA RANGÉE DU LOGO NE BOUGE JAMAIS : sans lui, plus de repère. */
  const [moteurReplie, setMoteurReplie] = useState(false);
  /** LE CENTRAGE DE LA BARRE (passe nº 147-§3). Le bloc central était
      centré dans L'ESPACE RESTANT : le logo étant plus large que les
      actions, il dérivait vers la droite — et en resserrant la
      fenêtre, l'encadré finissait collé au logo avec du vide à
      droite. On mesure la largeur NATURELLE des deux flancs (le lien
      du logo, le contenu de la nav) et chacun réserve LA PLUS LARGE
      des deux : rien ne pousse plus le milieu. ResizeObserver : le
      contenu de droite change avec la session (globe ↔ fanion,
      libellés), le logo avec les points de rupture. */
  const contenuGauche = useRef<HTMLAnchorElement>(null);
  const contenuDroit = useRef<HTMLDivElement>(null);
  const [cote, setCote] = useState(0);
  useEffetAvantPeinture(() => {
    const mesurer = () => {
      const g = contenuGauche.current?.getBoundingClientRect().width ?? 0;
      const d = contenuDroit.current?.getBoundingClientRect().width ?? 0;
      setCote(Math.ceil(Math.max(g, d)));
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    if (contenuGauche.current) observateur.observe(contenuGauche.current);
    if (contenuDroit.current) observateur.observe(contenuDroit.current);
    return () => observateur.disconnect();
  }, []);
  useEffect(() => {
    let yPrecedent = window.scrollY;
    //  ⚠️ LES FAUX GESTES DU NAVIGATEUR, ET LE GEL QUI LES NEUTRALISE.
    //  Replier ou déplier la rangée change la hauteur du document, et
    //  le navigateur réagit par SES PROPRES défilements : le re-bornage
    //  du bas de page (delta négatif après un repli) et l'ancrage de
    //  défilement (deltas positifs pendant un dépliement). Lus comme
    //  des gestes, ils inversaient l'état à peine posé — la barre
    //  OSCILLAIT. Après chaque bascule, un GEL de 400 ms (la
    //  transition dure 300 ms) interdit donc aux deltas de la
    //  contredire ; un vrai geste, lui, continue au-delà du gel et
    //  garde le dernier mot.
    let replieCourant = false;
    let gelJusqua = 0;
    const basculer = (valeur: boolean) => {
      if (replieCourant === valeur) return;
      replieCourant = valeur;
      gelJusqua = performance.now() + 400;
      setMoteurReplie(valeur);
    };
    const lire = () => {
      const y = window.scrollY;
      const delta = y - yPrecedent;
      yPrecedent = y;
      setPosee(y > 8);
      //  Près du haut : toujours dépliée, gel ou pas.
      if (y < 64) {
        basculer(false);
        return;
      }
      if (performance.now() < gelJusqua) return;
      const yMax =
        document.documentElement.scrollHeight - window.innerHeight;
      if (delta > 4) basculer(true);
      //  Collé au bas de page, un delta négatif peut encore être un
      //  re-bornage tardif : il ne compte que plus haut.
      else if (delta < -4 && y < yMax - 2) basculer(false);
    };
    lire();
    window.addEventListener("scroll", lire, { passive: true });
    return () => window.removeEventListener("scroll", lire);
  }, []);

  return (
    <header
      // Le repère du haut de l'écran : la mosaïque s'en sert pour
      // remettre sous les yeux la même carte après un changement de
      // disposition (voir src/lib/carte-du-haut.ts).
      data-barre-fixe=""
      //  ⚠️ OPAQUE, TOUT À FAIT (nº 147-§2, troisième signalement) : à
      //  90 puis 95 %, le contenu transparaissait encore derrière la
      //  barre. Le fond posé est désormais PLEIN — plus rien ne passe,
      //  et le flou d'arrière-plan n'a plus rien à flouter : retiré.
      //  Toujours AUCUN trait : c'est un acquis.
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        posee ? "bg-sombre-carte" : "bg-transparent"
      }`}
      //  LA MÊME LARGEUR RÉSERVÉE DES DEUX CÔTÉS (nº 147-§3) : mesurée
      //  au navigateur (le contenu naturel du logo et celui des
      //  actions), la plus large des deux est posée ici en variable —
      //  les deux flancs la liront comme largeur minimale, et le bloc
      //  central reste ANCRÉ AU CENTRE DE LA PAGE à toutes les
      //  largeurs, au lieu de dériver vers le flanc le plus étroit.
      style={
        cote > 0
          ? ({ "--cote-barre": `${cote}px` } as React.CSSProperties)
          : undefined
      }
    >
      <div
        //  ⚠️ PLUS DE gap-y (nº 147-§7) : l'espace au-dessus de la
        //  rangée du moteur vit DANS la rangée (`pt-3` de son
        //  enveloppe), pour disparaître AVEC elle quand elle se
        //  replie — un gap de grille, lui, serait resté.
        className="mx-auto w-full max-w-[1760px] px-4 sm:px-6
                   flex flex-wrap lg:flex-nowrap items-center gap-x-5 py-3"
      >
        {/* LOGO ET ACTIONS PRENNENT LA MÊME PLACE : c'est ce qui met
            le moteur au milieu de la barre.
            ⚠️ LA MÊME LARGEUR MINIMALE DES DEUX CÔTÉS (nº 147-§3) —
            `var(--cote-barre)`, la plus large des deux mesures, posée
            sur le header. Centré dans l'espace restant, le bloc
            central DÉRIVAIT vers le flanc le plus étroit ; ancré entre
            deux réserves égales, il reste au CENTRE DE LA PAGE et se
            rétracte symétriquement. Avant la première mesure, repli
            sur `fit-content` (la règle de la nº 146-§2 : chaque côté
            réclame au moins son contenu, seul le moteur — `lg:shrink`
            + `min-w-0` — peut céder, le logo jamais). */}
        <div className="shrink-0 order-1 lg:flex-1 lg:min-w-[var(--cote-barre,fit-content)]">
          {/* LE LOGO RAMÈNE À L'ACCUEIL — un lien NATIF, exprès. La
              navigation douce de Next a déjà avalé ce clic deux fois
              (page du compte, puis page de création de fiche) : ici,
              c'est le NAVIGATEUR qui navigue, rien ne peut s'interposer
              — et le curseur main est garanti. `draggable=false` :
              une image de lien se laisse « traîner » par défaut, et un
              clic légèrement glissé partait en glisser-déposer muet au
              lieu de naviguer. Le lien épouse le logo (`w-fit`) : pas
              de zone cliquable invisible sur la moitié de la barre. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              c'est un <a> natif PAR CHOIX : la navigation douce de
              <Link> a déjà avalé ce clic en silence, deux fois. */}
          <a
            href="/"
            ref={contenuGauche}
            aria-label={`Accueil ${MARQUE_YOKOFOLIO.nom}`}
            draggable={false}
            className="block w-fit cursor-pointer rounded-lg
                       focus-visible:outline-2 focus-visible:outline-offset-4
                       focus-visible:outline-primaire"
          >
            {/* LE LOGO COMPLET, PARTOUT — le fichier du propriétaire,
                affiché tel quel. Sur smartphone il perd juste quelques
                pixels de hauteur, jamais son nom. */}
            <LogoYokofolio hauteur={48} classe="h-9 sm:h-11 lg:h-12 w-auto" />
          </a>
        </div>

        {/* LE MOTEUR, CENTRÉ. Il passe sous la barre en dessous de
            1024 px (il lui faut de la place pour respirer), et revient
            au milieu dès qu'il y en a. `moteurMobile` faux : il
            disparaît sous 768 px — sur une page sans recherche, un
            moteur dans la barre n'est que du bruit. */}
        {/*  ⚠️ ÉLARGI (nº 144-§4) : 520 px laissaient à peine 200 px à
             chacun des deux champs alors que la barre avait de la
             place. 680 px — la juste mesure : les champs respirent,
             et le moteur reste une PILULE au centre de la barre, pas
             une barre dans la barre.
             ⚠️ ET 680 EST UN MAXIMUM, PAS UNE LARGEUR FIXE (nº 146-§2) :
             `lg:shrink` + `min-w-0` laissent l'encadré se réduire dès
             que la barre manque de place — AVANT que quoi que ce soit
             d'autre ne cède (voir le `lg:min-w-fit` des deux côtés). */}
        {/*  ⚠️ LA RANGÉE SE REPLIE AU DÉFILEMENT (nº 147-§7, sous
             1024 px seulement) : une GRILLE À UNE LIGNE dont la ligne
             passe de 1fr à 0fr — la hauteur EXACTE se replie, sans
             valeur magique, et la transition la rend fluide. Le web
             (lg) reste un flex ordinaire, jamais replié. */}
        <div
          data-rangee-moteur=""
          className={`order-3 lg:order-2 basis-full lg:basis-[680px] lg:shrink lg:grow-0
                      min-w-0 justify-center
                      max-lg:grid max-lg:transition-[grid-template-rows,opacity]
                      max-lg:duration-300 max-lg:ease-out ${
                        moteurReplie
                          ? "max-lg:grid-rows-[0fr] max-lg:opacity-0"
                          : "max-lg:grid-rows-[1fr] max-lg:opacity-100"
                      } ${moteurMobile ? "lg:flex" : "hidden md:grid lg:flex"}`}
          aria-hidden={moteurReplie || undefined}
          inert={moteurReplie || undefined}
        >
          <div className="max-lg:min-h-0 max-lg:overflow-hidden flex w-full justify-center">
            {/*  Le pt-3 remplace l'ancien gap-y-3 du parent : il
                 appartient à la rangée et se replie avec elle. */}
            <div className="w-full max-w-[720px] max-lg:pt-3 lg:pt-0">
              <MoteurTatouage criteres={valeur} surChangement={chercher} />
            </div>
          </div>
        </div>

        <nav
          aria-label="Langue et compte"
          //  gap-3 (nº 141-§7) : le cœur — ou le globe — respirait mal
          //  contre « Mon espace ».
          className="order-2 lg:order-3 ml-auto lg:flex-1 lg:min-w-[var(--cote-barre,fit-content)] shrink-0 flex items-center justify-end gap-3"
        >
          {/* L'ENVELOPPE DE MESURE (nº 147-§3) : la largeur NATURELLE
              du contenu de droite, lue par le ResizeObserver — la nav,
              étirée par flex-1, ne peut pas se mesurer elle-même. */}
          <div ref={contenuDroit} className="flex w-fit items-center gap-3">
          {/* ⚠️ LA PLACE À GAUCHE DU COMPTE CHANGE DE MAIN SELON QU'ON
              EST CONNECTÉ (passe nº 137) :
               · DÉCONNECTÉ — le GLOBE des langues, comme toujours ;
               · CONNECTÉ — le CŒUR des favoris. Le globe, lui,
                 déménage dans la fenêtre « Mon compte », au-dessus de
                 Sécurité.
              Pourquoi un échange et non un ajout : la barre du
              smartphone tient trois éléments (logo, moteur, compte) et
              pas un de plus. Entre un sélecteur de langue qui ne
              propose qu'une langue et l'accès à ses propres photos, le
              choix se fait tout seul — et le globe reste à un geste,
              dans le menu. */}
          {connecte && utilisateur ? (
            <Link
              href="/mes-favoris"
              aria-label="Ma sélection"
              title="Ma sélection"
              style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
              className="shrink-0 flex items-center justify-center rounded-full
                         transition-colors hover:bg-sombre-eleve
                         focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-primaire
                         text-sombre-texte hover:text-primaire"
            >
              {/* ⚠️ LE FANION, ET PLUS LE CŒUR (nº 145-§3) : cette
                  icône désigne LA PAGE « Ma sélection », pas le geste
                  d'aimer une photo. Le cœur reste, lui, sur les cartes
                  et les fiches.
                  RANG 24 (nº 147-§6) : les icônes de la barre — globe,
                  fanion, compte — montent de 22 à 24, web et
                  smartphone. */}
              <IconeFanion taille={24} />
            </Link>
          ) : (
            <SelecteurLangue hauteur={HAUTEUR_ACTIONS} />
          )}

          {connecte && utilisateur ? (
            /* CONNECTÉ : « Mon espace » — le menu de compte (état de
               la fiche, Modification, Ma fiche, Déconnexion). */
            <MenuEspace
              idUtilisateur={utilisateur.id}
              nom={nom}
              hauteur={HAUTEUR_ACTIONS}
            />
          ) : (
            <>
              {/* SMARTPHONE : l'icône personnage, HABILLÉE COMME LE
                  GLOBE (grise, même gabarit, même survol) — elle mène
                  à la connexion. */}
              <Link
                href="/devenir-tatoueur"
                aria-label={libelleDeconnecte}
                title={libelleDeconnecte}
                style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
                className="sm:hidden flex items-center justify-center rounded-full
                           transition-colors hover:bg-sombre-eleve
                           focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-primaire
                           text-sombre-texte hover:text-primaire"
              >
                {/*  LA SILHOUETTE SEULE, rang 24 (nº 147-§5 et §6). */}
                <IconeSilhouette taille={24} />
              </Link>

              {/* WEB : le bouton rose. Jamais venu, il invite ; déjà
                  venu, « Se connecter ». */}
              <Link
                href="/devenir-tatoueur"
                aria-label={libelleDeconnecte}
                style={{ height: HAUTEUR_ACTIONS }}
                className="hidden sm:flex rounded-full px-5 items-center gap-2
                           bg-primaire hover:bg-primaire-fonce text-white
                           text-sm font-semibold transition-colors whitespace-nowrap
                           focus-visible:outline-2 focus-visible:outline-offset-2
                           focus-visible:outline-primaire"
              >
                <span className="max-w-[180px] truncate">
                  {libelleDeconnecte}
                </span>
              </Link>
            </>
          )}
          </div>
        </nav>
      </div>
    </header>
  );
}
