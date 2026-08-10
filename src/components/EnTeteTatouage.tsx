"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { estDefilementProgramme } from "@/lib/defilement-programme";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lieuVersParametres } from "@/lib/geocodage";
import { MARQUE_YOKOFOLIO, TEXTES_TATOUAGE } from "@/config/tatouage";
import { IconeFanion, IconeLoupe, IconeSilhouette } from "@/components/Icones";
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
import { ouvrirRecherche } from "@/lib/recherche-mobile";

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

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux). */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function EnTeteTatouage({
  criteres,
  criteresInitiaux,
  surRecherche,
}: {
  /** Critères PILOTÉS PAR LA PAGE (accueil). Absent = état interne. */
  criteres?: CritèresTatouage;
  criteresInitiaux?: Partial<CritèresTatouage>;
  surRecherche?: (criteres: CritèresTatouage) => void;
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

  /**
   * LES DEUX ÉTATS DE LA BARRE SONT RÉTABLIS (passe nº 156-§2)
   * ===========================================================
   * EN HAUT DE PAGE elle est TRANSPARENTE — elle appartient à la page,
   * et rien ne passe derrière elle : un fond posé là ne fait qu'une
   * bande claire sans raison. DÈS QUE DU CONTENU PASSE DESSOUS, elle
   * prend son fond opaque, et c'est cette clarté qui la détache
   * (charte : jamais un trait).
   *
   * ⚠️ LA Nº 154 AVAIT SUPPRIMÉ LES DEUX ÉTATS pour arrêter un
   * clignotement. C'était la mauvaise moitié du problème : le défaut
   * n'était pas d'avoir deux états, mais LA FAÇON D'EN CHANGER. Trois
   * causes, trois corrections :
   *
   *  1. L'ÉTAT DE DÉPART ÉTAIT FAUX. `posee` naissait à faux, puis un
   *     effet le corrigeait APRÈS la première peinture : une fiche
   *     ouverte à une position mémorisée affichait donc une barre
   *     transparente, puis son fond « dans un second temps ». Il est
   *     désormais calculé AVANT LA PEINTURE (`useLayoutEffect`) — la
   *     première image est déjà la bonne.
   *  2. LA TRANSITION ELLE-MÊME ÉTAIT LE CLIGNOTEMENT. Mesuré au
   *     banc : un fondu de 200 ms fait passer la barre par une
   *     quinzaine de valeurs SEMI-TRANSPARENTES — et c'est pendant
   *     ces images-là que le contenu se voit à travers elle, ce que
   *     l'œil lit comme « elle disparaît, puis revient ». Il n'y a
   *     plus de transition du tout : la bascule se fait en UNE image,
   *     à un instant où le contenu n'a défilé que de huit pixels — il
   *     n'y a donc rien derrière la barre à révéler. Un changement
   *     qu'on ne peut pas voir vaut mieux qu'un fondu qu'on voit.
   *  3. LE SEUIL UNIQUE OSCILLAIT. À 8 px près, l'élastique de fin de
   *     défilement et les micro-mouvements faisaient basculer l'état
   *     plusieurs fois par seconde. Deux seuils désormais (HYSTÉRÉSIS) :
   *     on POSE le fond au-delà de 8 px, on ne le retire qu'au RETOUR
   *     COMPLET en haut (2 px). Entre les deux, rien ne bouge.
   *
   * Et la bascule elle-même est imperceptible par construction : au
   * moment où elle se produit, le contenu n'a défilé que de quelques
   * pixels — il n'y a rien derrière la barre à masquer ou à révéler.
   */
  /** Le fond est-il posé ? Faux = transparente (haut de page). */
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
  /** SUR L'ACCUEIL, ET LÀ SEULEMENT, la barre porte la rangée du
      moteur sur smartphone (nº 150-§3) : l'accueil est la page qui
      PILOTE la recherche — elle fournit `surRecherche`. Partout
      ailleurs, la rangée n'existe pas : c'est LA LOUPE de la barre qui
      mène à la recherche. */
  const surAccueil = Boolean(surRecherche);
  /** LA LOUPE EST VISIBLE quand la rangée ne l'est pas : partout hors
      accueil, et sur l'accueil dès que la rangée est repliée. */
  const loupeVisible = !surAccueil || moteurReplie;
  /**
   * L'ÉCRAN EST-IL ÉTROIT ? — c'est-à-dire : la rangée du moteur est-
   * elle réellement repliable ici ?
   * ⚠️ SANS CETTE QUESTION, LE MOTEUR WEB DEVENAIT INERTE (nº 154-§5).
   * Le repli est une affaire de LARGEUR (variantes `max-lg:`), mais
   * `inert` et `aria-hidden` sont des ATTRIBUTS : ils ne connaissent
   * pas les points de rupture et s'appliquaient à TOUTES les largeurs.
   * Sur le web, dès qu'on avait défilé de 24 px, `moteurReplie`
   * passait à vrai et l'enveloppe entière — encadré, filtres, bouton
   * du texte des cartes — devenait inerte : les clics ne produisaient
   * plus rien, alors que tout restait parfaitement visible. En haut de
   * page, elle repassait à faux et tout refonctionnait.
   * On lit donc la MÊME borne que la feuille de style (1024 px), et
   * l'inertie ne vaut que là où la rangée se replie vraiment.
   * (Ceci ne touche pas C1 : la détection par appareil décide de ce
   * qu'on affiche, pas du point de rupture d'une variante Tailwind.)
   */
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const borne = window.matchMedia("(max-width: 1023.98px)");
    const lire = () => setEtroit(borne.matches);
    lire();
    borne.addEventListener("change", lire);
    return () => borne.removeEventListener("change", lire);
  }, []);
  /** La rangée est-elle VRAIMENT hors de portée ? */
  const rangeeEscamotee = surAccueil && moteurReplie && etroit;

  //  ⚠️ AVANT LA PEINTURE (nº 156-§2) : la toute première lecture doit
  //  décider du fond AVANT que la barre ne s'affiche — sinon une page
  //  ouverte à une position mémorisée montre une barre transparente,
  //  puis son fond « dans un second temps ».
  useEffetAvantPeinture(() => {
    /* ============================================================
     * LE REPLI, REFAIT DE A À Z (nº 150-§5) — un seul mouvement.
     * ------------------------------------------------------------
     * L'ancienne mécanique jugeait CHAQUE lecture de scroll (delta
     * > 4 px) et se protégeait de ses propres conséquences par un GEL
     * de 400 ms : les bascules différées repartaient en sens inverse
     * en pleine transition — trois mouvements visibles au lieu d'un.
     *
     * La nouvelle règle juge le GESTE, pas la lecture :
     *  · un CUMUL DIRECTIONNEL additionne les deltas tant que le sens
     *    ne change pas, et repart de zéro quand il s'inverse ;
     *  · 24 px cumulés vers le bas replient ; 12 px cumulés vers le
     *    haut déplient — le retour reste immédiat au premier vrai
     *    geste, où qu'on soit dans la page ;
     *  · sous 64 px du haut, toujours dépliée.
     * AUCUN gel : l'état ne peut plus se contredire en cours de
     * transition, car les faux gestes sont traités À LA SOURCE :
     *  · le RE-BORNAGE du bas de page (replier raccourcit le document,
     *    le navigateur re-borne le défilement — delta négatif) : un
     *    delta négatif qui laisse le défilement collé au bas n'est pas
     *    un geste, il est ignoré ;
     *  · l'ANCRAGE de défilement (déplier rallonge le header, le
     *    navigateur « compensait » — delta positif) : il est désactivé
     *    pour de bon (`overflow-anchor: none`, globals.css).
     * ============================================================ */
    let yPrecedent = window.scrollY;
    let cumul = 0;
    let replieCourant = false;
    const poserReplie = (valeur: boolean) => {
      if (replieCourant === valeur) return;
      replieCourant = valeur;
      cumul = 0;
      setMoteurReplie(valeur);
    };
    /** Le fond, avec sa zone morte : `null` = on ne touche à rien. */
    let fondCourant = window.scrollY > 8;
    const poserLeFond = (valeur: boolean | null) => {
      if (valeur === null || fondCourant === valeur) return;
      fondCourant = valeur;
      setPosee(valeur);
    };
    const lire = () => {
      const y = window.scrollY;
      const delta = y - yPrecedent;
      yPrecedent = y;
      //  ⚠️ UN DÉFILEMENT POSÉ PAR LE SITE N'EST PAS UN GESTE
      //  (nº 154-§6A). Changer de disposition, montrer ou masquer le
      //  texte des cartes, restituer une position au retour : chacun
      //  de ces gestes REPOSE la page (lib/carte-du-haut,
      //  lib/restitution-position). Le saut franchissait les 24 px et
      //  repliait la rangée alors que personne n'avait fait défiler
      //  quoi que ce soit. On prend acte de la nouvelle position — le
      //  cumul, lui, ne bouge pas.
      //  LE FOND DE LA BARRE, LUI, SUIT TOUJOURS LA POSITION — même
      //  pendant un défilement posé par le site : il décrit ce qu'on
      //  voit, il ne juge aucune intention. HYSTÉRÉSIS (nº 156-§2) :
      //  on POSE le fond au-delà de 8 px, on ne le retire qu'au retour
      //  complet en haut (2 px) — entre les deux, rien ne bascule.
      poserLeFond(y > 8 ? true : y <= 2 ? false : null);
      if (estDefilementProgramme()) {
        cumul = 0;
        return;
      }
      if (y < 64) {
        poserReplie(false);
        cumul = 0;
        return;
      }
      if (delta === 0) return;
      const yMax = document.documentElement.scrollHeight - window.innerHeight;
      if (delta < 0 && y >= yMax - 2) return;
      cumul = Math.sign(delta) === Math.sign(cumul) ? cumul + delta : delta;
      if (cumul > 24) poserReplie(true);
      else if (cumul < -12) poserReplie(false);
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
      //  barre. Le fond posé est PLEIN — plus rien ne passe, et le flou
      //  d'arrière-plan n'a plus rien à flouter : retiré.
      //  ⚠️ DEUX ÉTATS, RÉTABLIS (nº 156-§2) : transparente en haut de
      //  page (rien ne passe derrière elle), opaque dès que du contenu
      //  défile dessous. La transition n'est armée qu'après la
      //  première peinture — voir le commentaire de `posee`. Toujours
      //  AUCUN trait : c'est un acquis.
      className={`sticky top-0 z-50 ${
        posee ? "bg-sombre-carte" : "bg-transparent"
      }`}
    >
      <div
        //  ⚠️ PLUS DE gap-y (nº 147-§7) : l'espace au-dessus de la
        //  rangée du moteur vit DANS la rangée (`pt-3` de son
        //  enveloppe), pour disparaître AVEC elle quand elle se
        //  replie — un gap de grille, lui, serait resté.
        className="mx-auto w-full max-w-[1760px] px-4 sm:px-6
                   flex flex-wrap lg:flex-nowrap items-center gap-x-5 py-3"
      >
        {/* LOGO ET ACTIONS PRENNENT LA MÊME PLACE (`lg:flex-1` des deux
            côtés) : c'est ce qui met le moteur au milieu de la barre.
            ⚠️ L'ANCRAGE AU CENTRE DE LA PAGE (nº 147-§3) EST ANNULÉ
            (nº 150-§1), à la demande du propriétaire : retour EXACT à
            la règle de la nº 146-§2 — chaque côté réclame AU MOINS son
            contenu (`lg:min-w-fit`), seul le moteur (`lg:shrink` +
            `min-w-0`) peut céder, le logo jamais. Plus de réserve
            `--cote-barre`, plus de ResizeObserver. */}
        {/*  ⚠️ LE LOGO CÈDE AVANT QUE LA BARRE NE SE CASSE (nº 154-§4).
             Il était `shrink-0` à TOUTES les largeurs : à 320 px, le
             logo entier plus les trois icônes (loupe, fanion, compte)
             dépassaient la ligne, et le conteneur — qui doit rester
             `flex-wrap` pour que la rangée du moteur passe SOUS la
             barre — les renvoyait à la ligne. Vu de l'écran : le logo
             seul en haut, les icônes en dessous à droite.
             ⚠️ ET C'EST `basis-0` QUI COMPTE, PAS `shrink` : un
             conteneur qui peut passer à la ligne place ses éléments
             AVANT de les rétrécir — il compare leur taille de départ,
             pas leur taille possible. Un logo « rétrécissable » mais
             large au départ cassait donc quand même la ligne. Avec une
             taille de départ NULLE, il ne la casse jamais : il prend
             ensuite la place qui reste (`grow`), et l'image s'y borne.
             Au-delà de 1024 px, rien ne change : `lg:min-w-fit` garde
             la règle de la nº 146-§2 — seul le moteur cède, jamais le
             logo. */}
        <div className="min-w-0 basis-0 grow shrink order-1 lg:basis-auto lg:shrink-0 lg:flex-1 lg:min-w-fit">
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
            aria-label={`Accueil ${MARQUE_YOKOFOLIO.nom}`}
            draggable={false}
            className="block w-fit cursor-pointer rounded-lg
                       focus-visible:outline-2 focus-visible:outline-offset-4
                       focus-visible:outline-primaire"
          >
            {/* LE LOGO COMPLET, PARTOUT — le fichier du propriétaire,
                affiché tel quel. Sur smartphone il perd juste quelques
                pixels de hauteur, jamais son nom. */}
            {/*  `max-w-full` : sur un écran très étroit, le logo se
                 borne à la place qui reste au lieu de pousser les
                 icônes à la ligne (nº 154-§4). Sa hauteur commande, sa
                 largeur suit — il n'est jamais déformé. */}
            <LogoYokofolio
              hauteur={48}
              classe="h-9 sm:h-11 lg:h-12 w-auto max-w-full object-contain object-left"
            />
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
        {/*  ⚠️ LA RANGÉE DU MOTEUR N'EXISTE QUE SUR L'ACCUEIL
             (nº 150-§3) : partout ailleurs, `hidden lg:flex` — RIEN
             sous 1024 px (la loupe de la nav mène à la recherche), et
             le moteur web ordinaire au-delà. La régression corrigée :
             les variantes de repli `max-lg:grid` s'appliquaient SANS
             condition et rallumaient la rangée sur toutes les pages,
             par-dessus leur `hidden`.
             SUR L'ACCUEIL, elle SE REPLIE au défilement (nº 150-§5) :
             une grille à UNE COLONNE PLEINE LARGEUR
             (`grid-cols-[minmax(0,1fr)]` — la colonne implicite se
             dimensionnait au contenu et `justify-center` la centrait :
             c'était la marge parasite du §4) et UNE LIGNE qui passe de
             1fr à 0fr : la hauteur exacte se replie, le contenu est
             coupé par l'overflow de l'enveloppe — il se replie AVEC la
             rangée, jamais après. */}
        <div
          data-rangee-moteur=""
          className={`order-3 lg:order-2 basis-full lg:basis-[680px] lg:shrink lg:grow-0
                      min-w-0 justify-center ${
                        surAccueil
                          ? `max-lg:grid max-lg:grid-cols-[minmax(0,1fr)]
                             max-lg:transition-[grid-template-rows,opacity]
                             max-lg:duration-300 max-lg:ease-out ${
                               moteurReplie
                                 ? "max-lg:grid-rows-[0fr] max-lg:opacity-0"
                                 : "max-lg:grid-rows-[1fr] max-lg:opacity-100"
                             } lg:flex`
                          : "hidden lg:flex"
                      }`}
          //  ⚠️ SEULEMENT LÀ OÙ LA RANGÉE SE REPLIE VRAIMENT
          //  (nº 154-§5) : ces deux attributs ignorent les points de
          //  rupture — appliqués sur le web, ils rendaient le moteur
          //  entier inerte dès qu'on avait défilé.
          aria-hidden={rangeeEscamotee || undefined}
          inert={rangeeEscamotee || undefined}
        >
          <div className="max-lg:min-h-0 max-lg:overflow-hidden flex w-full justify-center">
            {/*  Le pt-3 remplace l'ancien gap-y-3 du parent : il
                 appartient à la rangée et se replie avec elle. */}
            <div
              className={`w-full max-w-[720px] lg:pt-0 ${
                surAccueil ? "max-lg:pt-3" : ""
              }`}
            >
              <MoteurTatouage
                criteres={valeur}
                surChangement={chercher}
                rangeeMobile={surAccueil}
              />
            </div>
          </div>
        </div>

        <nav
          aria-label="Langue et compte"
          //  gap-3 (nº 141-§7) : le cœur — ou le globe — respirait mal
          //  contre « Mon espace ».
          className="order-2 lg:order-3 ml-auto lg:flex-1 lg:min-w-fit shrink-0 flex items-center justify-end gap-3"
        >
          {/* LA LOUPE (nº 150-§3) — smartphone et écrans étroits
              seulement : elle mène à la recherche PARTOUT où la rangée
              du moteur n'est pas là — sur toutes les pages hors
              accueil, et sur l'accueil dès que la rangée est repliée.
              Elle garde sa place dans la barre même invisible
              (opacité seule) : son apparition ne décale jamais les
              icônes voisines, et elle suit le repli sans décalage.
              Rang 24, l'échelle de la barre. */}
          <button
            type="button"
            onClick={() => ouvrirRecherche(valeur)}
            aria-label="Rechercher"
            title="Rechercher"
            aria-hidden={!loupeVisible || undefined}
            tabIndex={loupeVisible ? 0 : -1}
            style={{ height: HAUTEUR_ACTIONS, width: HAUTEUR_ACTIONS }}
            className={`flex lg:hidden shrink-0 items-center justify-center rounded-full
                       transition-opacity duration-200 hover:bg-sombre-eleve
                       text-sombre-texte
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire ${
                         loupeVisible
                           ? "opacity-100"
                           : "opacity-0 pointer-events-none"
                       }`}
          >
            <IconeLoupe taille={24} />
          </button>
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
        </nav>
      </div>
    </header>
  );
}
