"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LARGEUR_SITE,
  renduCherche,
  TEXTES_TATOUAGE,
} from "@/config/tatouage";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { GrilleTatoueurs } from "@/components/GrilleTatoueurs";
import { noterDemontage, noterMontage } from "@/lib/journal-bascule";
import { LigneResultats } from "@/components/LigneResultats";
import {
  criteresComplets,
  libelleExplorer,
  libelleStyleChoisi,
  type CritèresTatouage,
} from "@/components/MoteurTatouage";
import type { Tatoueur } from "@/lib/tatoueurs";
import { lieuVersParametres } from "@/lib/geocodage";
import {
  criteresDepuisAdresse,
  memeRecherche,
} from "@/lib/criteres-adresse";
import {
  adresseCourante,
  lireMosaique,
  memoriserMosaique,
} from "@/lib/mosaique-session";
import {
  adresseDeRecherche,
  criteresDeLAdresse,
} from "@/lib/adresse-recherche";
import {
  consommerValidation,
  traverseeEnCours,
} from "@/lib/etapes-historique";
import { estHydrate } from "@/lib/navigation-session";
import { sans } from "@/lib/interrupteurs-mesure";
import { useUtilisateur } from "@/lib/use-utilisateur";

/** useLayoutEffect côté navigateur, useEffect côté serveur (silencieux) */
const useEffetAvantPeinture =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * LA MOSAÏQUE MISE DE CÔTÉ, LUE DÈS LE PREMIER RENDU.
 * ====================================================
 * ⚠️ `estHydrate()` EST LE GARDE-FOU, ET IL EST INDISPENSABLE.
 * Au TOUT PREMIER chargement du document, il faut rendre EXACTEMENT ce
 * que le serveur a rendu, sinon l'hydratation se plaint et React
 * reconstruit tout le sous-arbre. Lors d'une NAVIGATION INTERNE — le
 * retour depuis une fiche, précisément — il n'y a plus d'hydratation à
 * respecter : le composant est monté à neuf côté navigateur, et il peut
 * lire sa mémoire immédiatement.
 * C'est le motif déjà employé par la liste de résultats du produit
 * artisans (ListeResultats), pour la même raison.
 */
function mosaiqueRestituee(premiers: Tatoueur[]) {
  if (!estHydrate()) return null;
  const note = lireMosaique(adresseCourante());
  if (!note || note.tatoueurs.length <= premiers.length) return null;
  return note;
}

/**
 * L'ACCUEIL DE YOKOFOLIO (adresse « / »)
 * =======================================
 * Barre fixe (moteur compris), ligne de résultats, puis la grille.
 * Rien d'autre : ni accroche, ni paragraphe d'introduction. Ce qu'on
 * vient voir, ce sont les images.
 *
 * UN SEUL composant client pour les trois : c'est LUI qui tient les
 * critères de recherche. Sans cet état commun, le moteur, la ligne de
 * résultats et la grille ne pourraient pas se parler sans recharger la
 * page.
 *
 * Les premières cartes arrivent DÉJÀ RENDUES par le serveur
 * (`premiers`) : la page est lisible et indexable avant même que le
 * navigateur n'exécute la moindre ligne. Les recherches suivantes
 * passent par /api/tatoueurs et remplacent la grille sur place.
 */
export function IndexTatoueurs({
  premiers,
  criteresInitiaux,
  demonstration,
  message,
  total,
}: {
  premiers: Tatoueur[];
  criteresInitiaux?: Partial<CritèresTatouage>;
  demonstration: boolean;
  message: string | null;
  /** COMBIEN DE TATOUEURS RÉPONDENT EN TOUT — pas seulement ceux de
      la première page. C'est lui qui décide s'il faut proposer
      « Voir plus ». */
  total: number;
}) {
  const router = useRouter();
  /**
   * LA MOSAÏQUE ENTIÈRE EST RENDUE DÈS LE PREMIER RENDU DU RETOUR.
   * ==============================================================
   * ⚠️ SUR SMARTPHONE, UNE CARTE EST UN VRAI LIEN : toucher une fiche
   * QUITTE cette page, et ce composant est démonté. Au retour, il se
   * remontait sur `premiers` — les vingt-quatre premières fiches. Tout
   * ce que « Voir plus » avait ajouté avait disparu, la page était donc
   * trop COURTE : la position mémorisée (900 px) était rabotée par le
   * navigateur à la hauteur disponible (249 px mesurés). Puis les
   * images se posaient, la page s'allongeait, et la restauration
   * repoussait par petits pas — le « recalage » d'une à deux secondes.
   * Restaurer le défilement sans restaurer la LONGUEUR ne pouvait pas
   * marcher.
   * (Sur le web, la fiche s'ouvre en fenêtre superposée : la grille
   * n'est jamais démontée, et le défaut n'existe pas. C'est pourquoi le
   * test permanent du retour, qui tourne en 1366, passait depuis
   * toujours.)
   *
   * ICI, DANS L'ÉTAT INITIAL : la page a sa hauteur définitive AVANT la
   * première peinture. Quand MemoireNavigation repose le défilement, il
   * tombe du premier coup — sans animation, sans rattrapage.
   */
  /**
   * ⚠️ LUE UNE SEULE FOIS, ET NON TROIS — mesuré à la passe 113.
   * Les trois états ci-dessous sortaient chacun de leur propre appel :
   * trois lectures de `sessionStorage` et trois analyses JSON de la
   * mosaïque ENTIÈRE — jusqu'à quarante-huit fiches — pendant le rendu
   * du retour, c'est-à-dire à l'instant précis où l'écran est encore
   * vide. Le travail était fait trois fois pour un seul résultat.
   */
  const [restituee] = useState(() => mosaiqueRestituee(premiers));

  /**
   * QUI REGARDE ? — pour l'appel aux tatoueurs, en bas de page
   * (passe nº 145-§2). Il ne s'affiche QUE pour un visiteur qui n'a
   * pas de compte : une fois connecté, on n'a plus rien à faire dans
   * une invitation à s'inscrire.
   * ⚠️ AUCUN CLIGNOTEMENT À CRAINDRE : la session est lue par le
   * SERVEUR dans la mise en page du groupe (FournisseurSession) et
   * transmise par le contexte — le HTML envoyé porte donc déjà la
   * bonne réponse, et l'hydratation n'a rien à corriger.
   */
  const { utilisateur } = useUtilisateur();

  const [tatoueurs, setTatoueurs] = useState<Tatoueur[]>(
    () => restituee?.tatoueurs ?? premiers
  );
  const [enTout, setEnTout] = useState(() => restituee?.total ?? total);
  const [page, setPage] = useState(() => restituee?.page ?? 1);

  const [enCours, setEnCours] = useState(false);
  const [suiteEnCours, setSuiteEnCours] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);
  const [criteres, setCriteres] = useState(() =>
    criteresComplets(criteresInitiaux)
  );

  /**
   * CE QUE LA LIGNE DE RÉSULTATS ANNONCE — et ce que les cartes
   * montrent. Volontairement DISTINCT de `criteres` : celui-ci change
   * dès qu'on touche un champ, alors que les cartes n'arrivent
   * qu'après la réponse. Sans cette distinction, la ligne annoncerait
   * « Lyon : 18 tatoueurs » en montrant encore les 18 d'avant.
   */
  const [affiches, setAffiches] = useState(() =>
    criteresComplets(criteresInitiaux)
  );

  // Chaque recherche porte un numéro : une réponse arrivée en retard
  // (réseau lent, frappe rapide) ne doit jamais écraser une plus
  // récente.
  const [derniere, setDerniere] = useState(0);

  /** L'ADRESSE DE LA DERNIÈRE RECHERCHE DEMANDÉE AU ROUTEUR — la seule
      qui dise à quoi la mosaïque courante correspond (voir l'effet de
      mise de côté plus bas). Nulle tant qu'aucune recherche n'a été
      lancée : l'adresse du navigateur est alors la bonne. */
  const adresseVisee = useRef<string | null>(null);

  /**
   * ET ON LA MET DE CÔTÉ DÈS QU'ELLE CHANGE — c'est-à-dire à chaque
   * « Voir plus » et à chaque recherche validée. Deux gestes rares : il
   * n'y a rien à ménager ici. Avant la peinture, pour qu'un départ
   * immédiat vers une fiche trouve la note déjà écrite.
   *
   * ⚠️ SOUS L'ADRESSE DEMANDÉE, PAS SOUS CELLE QU'ON LIT — mesuré à la
   * passe 113, et c'était un vrai trou. `chercher()` demande au routeur
   * `/?style=realisme`, mais un changement d'adresse du routeur est une
   * TRANSITION : elle n'est pas encore appliquée quand les résultats
   * arrivent et que cette note s'écrit. La mosaïque partait donc sous
   * l'ANCIENNE adresse. Au banc : mosaïque rangée sous `/`, retour
   * demandé sur `/?style=realisme` — plus rien ne correspondait, les 48
   * fiches étaient perdues, la page se reconstruisait à 4 cartes, et la
   * position mémorisée (1600) retombait à 549 faute de hauteur.
   * On range donc la mosaïque à l'adresse que l'on a DEMANDÉE.
   */
  useEffetAvantPeinture(() => {
    // ⚠️ INTERRUPTEUR DE MESURE (`&sans=memoire`), TEMPORAIRE : la même
    // écriture, mais APRÈS la peinture au lieu d'avant. Elle sérialise
    // jusqu'à quarante-huit fiches ; si cela pèse sur le retour, ce
    // décalage le dira.
    if (sans("memoire")) {
      const apres = requestAnimationFrame(() => {
        memoriserMosaique(
          adresseVisee.current ?? adresseCourante(),
          tatoueurs,
          page,
          enTout
        );
      });
      return () => cancelAnimationFrame(apres);
    }
    memoriserMosaique(
      adresseVisee.current ?? adresseCourante(),
      tatoueurs,
      page,
      enTout
    );
  }, [tatoueurs, page, enTout]);

  /** L'adresse d'API d'une recherche — la même pour la première page
      et pour les suivantes. */
  function parametresDe(suivants: CritèresTatouage): URLSearchParams {
    const parametres = new URLSearchParams();
    if (suivants.style) parametres.set("style", suivants.style);
    //  LA NATURE (tatouage / flash) voyage à côté du style, jamais
    //  fondue dedans : une adresse partagée reste lisible à l'œil nu.
    if (suivants.nature) parametres.set("nature", suivants.nature);
    if (suivants.exclure.length > 0) {
      parametres.set("exclure", suivants.exclure.join(","));
    }
    if (suivants.lieu) {
      // Le LIEU voyage en clair (intitulé, contexte, coordonnées) :
      // la recherche est partageable et survit au rechargement.
      for (const [cle, valeur] of Object.entries(
        lieuVersParametres(suivants.lieu)
      )) {
        parametres.set(cle, valeur);
      }
      parametres.set("rayon", String(suivants.rayonKm));
    }
    return parametres;
  }

  /**
   * LA RECHERCHE, EN DEUX MOITIÉS (passe nº 159-§1)
   * ================================================
   * `ecrireLAdresse` sépare enfin les deux gestes qui n'avaient jamais
   * eu de raison d'être soudés :
   *  · CHERCHER — poser les critères, appeler l'API, montrer ;
   *  · ÉCRIRE L'ADRESSE — empiler une étape d'historique.
   * Un RETOUR ARRIÈRE veut la première moitié SANS la seconde :
   * l'adresse est déjà celle que le navigateur vient de restaurer,
   * la réécrire n'ajouterait qu'une étape parasite (voir `auRetour`).
   */
  async function chercher(
    suivants: CritèresTatouage,
    ecrireLAdresse = true,
    /** VRAI pour une recherche VALIDÉE — le bouton « Valider » de la
        page de recherche du smartphone. Elle, et elle seule, POSE UNE
        ÉTAPE D'HISTORIQUE (passe nº 182). */
    validee = false
  ) {
    setCriteres(suivants);
    const numero = derniere + 1;
    setDerniere(numero);
    setEnCours(true);
    setEchec(null);

    const parametres = parametresDe(suivants);

    /**
     * L'ADRESSE PORTE TOUJOURS LA RECHERCHE EN COURS — par une VRAIE
     * navigation du routeur, pas un simple réécrivage de la barre :
     * c'est elle qui rend le RETOUR ARRIÈRE honnête. Partir sur une
     * fiche puis revenir restitue CES résultats (l'étape d'historique
     * connaît la recherche) à la position mémorisée.
     *
     * ⚠️ `push` ET NON PLUS `replace` (passe nº 156-§1). C'était le
     * défaut : `replace` ÉCRASE l'étape courante au lieu d'en empiler
     * une. Une recherche ne laissait donc AUCUNE trace dans
     * l'historique du navigateur — arrivé depuis Google, on cherchait,
     * on faisait retour… et on retombait sur Google, l'étape de la
     * recherche ayant remplacé celle de l'accueil au lieu de s'y
     * ajouter. (La passe nº 154 avait réparé le JOURNAL du site, qui
     * ne voyait pas les recherches ; l'historique du NAVIGATEUR, lui,
     * n'en voyait pas davantage — deux mémoires distinctes, deux
     * corrections.)
     * Chaque recherche est désormais une étape : le retour ramène à
     * l'état d'avant, puis, seulement ensuite, au site d'origine.
     * `scroll: false` : la grille ne saute pas pendant qu'on affine.
     */
    const requete = parametres.toString();
    const adresse = requete ? `/?${requete}` : "/";
    // C'est CETTE adresse que la mosaïque à venir décrira — la barre du
    // navigateur, elle, ne l'affichera que plus tard (transition).
    adresseVisee.current = adresse;
    //  ⚠️ UNE RECHERCHE QUI NE CHANGE RIEN N'EMPILE RIEN : rouvrir la
    //  page de recherche et valider sans avoir touché à un critère ne
    //  doit pas ajouter une étape identique à la précédente — le
    //  retour arrière semblerait alors ne rien faire.
    if (ecrireLAdresse) {
      /**
       * ⚠️ LE DROIT D'ÉCRIRE UNE ÉTAPE SE VÉRIFIE AVANT D'ÉCRIRE
       * (passe nº 184-§1)
       * ==============================================================
       * LE DÉFAUT RELEVÉ SUR L'IPHONE : chaque RETOUR ajoutait une
       * entrée au lieu d'en consommer une (3, 4, 5, 6…). L'étape posée
       * à la main pour une recherche validée se reposait au retour :
       * le code croyait à une nouvelle validation, empilait, et
       * effaçait du même geste les étapes suivantes — d'où le
       * tourne-en-rond puis la sortie du site.
       *
       * DEUX VERROUS, ET ILS SE LISENT ICI, DANS CET ORDRE :
       *  · `consommerValidation()` — le drapeau du bouton « Valider »
       *    ne sert QU'UNE FOIS et s'efface au premier regard ; il ne
       *    survit ni à une navigation ni à l'attente. Un
       *    `{ validee: true }` rejoué n'ouvre donc plus rien ;
       *  · `traverseeEnCours()` — le navigateur est-il en train de
       *    reculer ou d'avancer ? Tant qu'il l'est, RIEN ne s'empile :
       *    l'adresse est corrigée sur place (`replace`).
       * (Notre propre `back()`, celui que la page de recherche fait
       * pour dépiler sa marche, ne compte pas comme une traversée —
       * voir lib/etapes-historique.)
       */
      const traversee = traverseeEnCours();
      const poseUneEtape = validee && consommerValidation() && !traversee;
      if (traversee || adresseDeRecherche(adresse) === adresseCourante()) {
        router.replace(adresse, { scroll: false });
      } else if (poseUneEtape) {
        /**
         * UNE RECHERCHE VALIDÉE POSE UNE ÉTAPE, ET ON NE S'EN REMET
         * PLUS AU ROUTEUR (passe nº 182)
         * ==========================================================
         * LE DÉFAUT, relevé par la sonde sur l'iPhone du propriétaire :
         *
         *     POPSTATE … HISTORIQUE 2 entrées   ← à chaque retour
         *
         * L'historique ne grandissait jamais. Chercher « abstrait »
         * puis revenir en arrière le faisait SORTIR DU SITE.
         *
         * POURQUOI `router.push` NE SUFFIT PAS ICI. Sur smartphone, la
         * recherche est validée à la SORTIE de la page de recherche,
         * c'est-à-dire juste après que celle-ci a dépilé SON étape
         * (`history.back()`). Le navigateur se retrouve alors sur une
         * étape qui a encore une SUIVANTE ; ce qui s'écrit ensuite la
         * remplace au lieu de s'y ajouter — l'étape des résultats prend
         * la place de celle de la page de recherche, et le compte ne
         * bouge pas. Derrière les résultats, il ne reste donc rien du
         * site.
         *
         * CE QU'ON FAIT : on pose L'ÉTAPE NOUS-MÊME, sur l'adresse
         * courante — l'état de la mosaïque d'avant reste donc dessous —
         * puis on HABILLE cette étape neuve de l'adresse des résultats.
         * Le retour ramène à l'état d'avant la recherche, sur le site.
         *
         * ⚠️ `pushState` À DEUX ARGUMENTS, JAMAIS TROIS : passer une
         * adresse ferait reconstruire la page par Next (voir l'en-tête
         * de PageRechercheMobile, où cette leçon a été payée). L'état
         * courant est recopié pour que les internes du routeur suivent.
         * ⚠️ ET UNE SEULE PAR RECHERCHE VALIDÉE : ni la frappe, ni un
         * critère intermédiaire, ni le web — eux gardent le chemin
         * ordinaire juste en dessous.
         */
        window.history.pushState(window.history.state, "");
        router.replace(adresse, { scroll: false });
      } else {
        router.push(adresse, { scroll: false });
      }
    }

    try {
      const reponse = await fetch(`/api/tatoueurs?${parametres}`);
      const donnees = (await reponse.json()) as {
        ok: boolean;
        tatoueurs?: Tatoueur[];
        total?: number;
      };
      // Réponse dépassée : on la jette.
      if (numero < derniere) return;
      setTatoueurs(donnees.tatoueurs ?? []);
      setEnTout(donnees.total ?? (donnees.tatoueurs ?? []).length);
      // Toute nouvelle recherche repart de la première page.
      setPage(1);
      setAffiches(suivants);
    } catch {
      setEchec("La recherche n'a pas abouti. Vérifier la connexion, puis réessayer.");
    }
    setEnCours(false);
  }

  /**
   * LE RETOUR ARRIÈRE RELANCE LA RECHERCHE (passe nº 159-§1)
   * =========================================================
   * ⚠️ CE DÉFAUT A RÉSISTÉ À QUATRE PASSES parce qu'on cherchait au
   * mauvais endroit. La sonde, chez le propriétaire, l'a tranché :
   *
   *   [11658] PUSHSTATE   /?style=realisme      length 6 → 7
   *   [14643] PUSHSTATE   /?style=anime-manga   length 7 → 8
   *   [16020] REPLACESTATE /?style=realisme     length 8 → 8
   *   [16022] POPSTATE    /?style=realisme      length 8
   *
   * L'HISTORIQUE ÉTAIT PARFAIT. L'adresse recule bien. Seul l'ÉCRAN
   * restait sur « anime-manga » — et recharger la page suffisait à
   * remettre les bons résultats.
   *
   * LA CAUSE : les deux recherches ont le MÊME CHEMIN (« / »), seuls
   * les critères changent. React garde donc CETTE MÊME INSTANCE de
   * composant d'une étape à l'autre — avec son état intact, c'est-à-
   * dire la mosaïque d'anime-manga. Les critères ne vivent pas dans
   * l'adresse pour ce composant : ils vivent dans `useState`, posé une
   * fois au montage par `criteresInitiaux`. Un retour arrière ne
   * remonte rien, ne remet rien à zéro, et personne n'allait relire
   * l'adresse restaurée.
   *
   * LA CORRECTION : on écoute `popstate` — le seul événement qui dise
   * « le navigateur vient de changer d'étape » — on RELIT les critères
   * DANS L'ADRESSE, et on relance la recherche SANS réécrire
   * l'historique (l'adresse est déjà la bonne : la réécrire ajouterait
   * une étape parasite, et c'est justement le `replaceState` que la
   * sonde voyait passer deux millisecondes avant).
   *
   * ⚠️ SANS TABLEAU DE DÉPENDANCES : l'écouteur doit toujours voir la
   * dernière version de `chercher` (qui capture `derniere`). Le coût
   * est nul — un ajout et un retrait d'écouteur par rendu.
   */
  //  ⚠️ LA SONDE DE LA BASCULE (nº 173) : le conteneur de page est-il
  //  démonté, lui aussi, au clic ? (N'écrit que sous `?sonde-bascule=1`.)
  useEffect(() => {
    noterMontage("page (IndexTatoueurs)");
    return () => noterDemontage("page (IndexTatoueurs)");
  }, []);

  useEffect(() => {
    function auRetour() {
      const voulus = criteresDepuisAdresse(window.location.search);
      //  Rien n'a changé pour la mosaïque (un retour qui ne fait que
      //  refermer la page de recherche, par exemple) : on ne relance
      //  rien — « aucune recherche qui ne serve à rien » vaut aussi ici.
      if (memeRecherche(voulus, criteres)) return;
      void chercher(voulus, false);
    }
    window.addEventListener("popstate", auRetour);
    return () => window.removeEventListener("popstate", auRetour);
  });

  /**
   * « VOIR PLUS » — la page suivante, ajoutée à la suite
   * ====================================================
   * La base ne rend JAMAIS plus de 24 fiches à la fois (passe
   * « performance ») : les suivantes se demandent, elles ne sont pas
   * déjà là. Elles s'AJOUTENT — on ne perd pas ce qu'on regardait.
   *
   * Pourquoi un bouton et non un défilement infini ? Parce qu'un
   * défilement infini enlève toute chance d'atteindre le pied de page,
   * casse le retour arrière, et n'est suivi par aucun moteur de
   * recherche. Sur les pages « style + ville » — celles que Google
   * indexe — la pagination est même faite de VRAIS liens numérotés.
   */
  async function voirPlus() {
    if (suiteEnCours) return;
    setSuiteEnCours(true);
    setEchec(null);
    const suivante = page + 1;
    try {
      const parametres = parametresDe(affiches);
      parametres.set("page", String(suivante));
      const reponse = await fetch(`/api/tatoueurs?${parametres}`);
      const donnees = (await reponse.json()) as {
        tatoueurs?: Tatoueur[];
        total?: number;
      };
      const arrivees = donnees.tatoueurs ?? [];
      // Une même fiche ne doit pas apparaître deux fois si la base a
      // bougé entre deux pages.
      setTatoueurs((actuels) => {
        const connus = new Set(actuels.map((t) => t.id));
        return [...actuels, ...arrivees.filter((t) => !connus.has(t.id))];
      });
      if (typeof donnees.total === "number") setEnTout(donnees.total);
      setPage(suivante);
    } catch {
      setEchec("La suite n'a pas pu être chargée. Vérifier la connexion, puis réessayer.");
    }
    setSuiteEnCours(false);
  }

  const visibles = tatoueurs;
  const resteAVoir = enTout > visibles.length;

  return (
    <>
      <EnTeteTatouage
        criteres={criteres}
        surRecherche={(suivants, options) =>
          void chercher(suivants, true, options?.validee === true)
        }
      />

      <main
        /**
         * ⚠️ CE QUE LA MOSAÏQUE MONTRE VRAIMENT (nº 185-a).
         * La restitution de position ne doit pas poser une place dans
         * une page qui n'est pas encore la bonne : elle attend que les
         * critères RENDUS — ceux des cartes affichées, pas ceux qu'on
         * vient de demander — soient ceux de l'adresse courante. C'est
         * `affiches` qui les dit : il ne change qu'à l'arrivée des
         * cartes (voir plus haut, il est fait pour ça).
         * Le marqueur est calculé sans lire le navigateur : le serveur
         * et le client écrivent donc la même valeur, et l'hydratation
         * n'a rien à corriger.
         */
        data-criteres-mosaique={criteresDeLAdresse(`/?${parametresDe(affiches)}`)}
        className={`flex-1 mx-auto w-full ${LARGEUR_SITE} px-4 sm:px-6 pb-16`}
      >
        {/* LE TITRE DIT LA RECHERCHE (nº 140) — la pilule de la barre
            dit toujours « Recherche », c'est donc ICI que les critères
            se lisent. LA RÈGLE : le QUOI en titre (« Flashs ·
            Réalisme », « Tous les flashs », « Réalisme ») ; un lieu
            SEUL devient le titre ; les deux → le quoi en titre, le
            lieu derrière le compte. Sans recherche : « Explorer toutes
            les créations », sans sous-titre. */}
        {(() => {
          const quoi =
            libelleExplorer(affiches.nature, affiches.style) ||
            (affiches.style ? libelleStyleChoisi(affiches.style) : "");
          const lieu = affiches.lieu
            ? `${affiches.lieu.intitule}${
                affiches.lieu.precision === "ville" ||
                affiches.lieu.precision === "adresse"
                  ? ` ${affiches.rayonKm} km`
                  : ""
              }`
            : "";
          const compte = `${enTout} création${enTout > 1 ? "s" : ""}`;
          if (!quoi && !lieu) {
            return (
              <LigneResultats
                titre="Explorer toutes les créations"
                sousTitre={null}
              />
            );
          }
          return (
            <LigneResultats
              titre={quoi || affiches.lieu!.intitule}
              sousTitre={quoi && lieu ? `${compte} · ${lieu}` : compte}
            />
          );
        })()}

        {demonstration && message && (
          <p className="mb-6 rounded-xl border border-primaire/40 bg-primaire/10 px-4 py-3 text-sm text-sombre-texte">
            {message}
          </p>
        )}

        {echec && (
          <p className="mb-6 rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3 text-sm text-sombre-texte">
            {echec}
          </p>
        )}

        {visibles.length === 0 && (
          <p className="text-sombre-texte-doux py-10">
            Aucun tatoueur ne correspond à cette recherche. Élargir le rayon, ou
            effacer le lieu pour chercher partout.
          </p>
        )}
        {
          // La grille porte aussi la FENÊTRE de fiche (grand écran).
          //  ⚠️ ELLE N'EST JAMAIS DÉMONTÉE, ET C'EST LE POINT (nº 171) :
          //  elle vivait dans la branche d'un ternaire — un instant où
          //  la liste passe par le vide, et React la DÉTRUIT puis la
          //  reconstruit, images comprises. Vu de l'écran : tout le
          //  contenu disparaît, puis revient d'un coup. Le message du
          //  vide s'affiche désormais À CÔTÉ, sans rien démonter.
          //  ⚠️ ET SA CLÉ EST STABLE ET EXPLICITE : la disposition
          //  change PAR LES STYLES, jamais par un remontage — une clé
          //  qui bougerait suffirait à recréer toute la mosaïque.
          <GrilleTatoueurs
            key="mosaique"
            tatoueurs={visibles}
            styleRecherche={affiches.style}
            // LE RENDU vient des interrupteurs : il n'y a recherche par
            // rendu que lorsqu'il n'en reste qu'un allumé.
            renduRecherche={renduCherche(affiches.exclure)}
            estompee={enCours}
          />
        }

        {resteAVoir && (
          <div className="mt-10 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={voirPlus}
              disabled={suiteEnCours}
              className="inline-flex items-center justify-center rounded-full px-6 min-h-[46px]
                         border border-sombre-bordure bg-sombre-carte text-[15px]
                         text-sombre-texte hover:border-primaire hover:text-primaire
                         disabled:opacity-60 transition-colors"
            >
              {suiteEnCours ? "Chargement…" : "Voir plus de tatoueurs"}
            </button>
            <p className="text-[13px] text-sombre-texte-doux">
              {visibles.length} sur {enTout}
            </p>
          </div>
        )}

        {/* ---------- L'APPEL AUX TATOUEURS (passe nº 137) ----------
            EN BAS DE L'ACCUEIL, APRÈS LA MOSAÏQUE — et nulle part
            ailleurs. La barre fixe s'adresse maintenant à tout le
            monde (« Rejoindre ») : l'invitation aux professionnels
            descend ici, où elle rencontre quelqu'un qui vient de voir
            ce que le site fait de leur travail. Elle n'a rien à faire
            dans la barre, qui n'a pas la place — et quatre visiteurs
            sur cinq arrivent par le téléphone.
            DEUX LIGNES, PAS UNE DE PLUS : une question, un bouton.

            ⚠️ POUR LES VISITEURS SANS COMPTE, ET EUX SEULS (passe
            nº 145-§2). Un connecté a déjà franchi cette porte : lui
            redemander « Tu es tatoueur ? » en bas de chaque page
            d'accueil ne lui apprend rien et le traite en inconnu. La
            réponse vient du serveur avec la page, l'appel n'apparaît
            donc jamais pour disparaître ensuite. */}
        {!utilisateur && (
        <section className="mt-14 rounded-2xl bg-sombre-carte px-5 py-8 text-center">
          <h2 className="text-[19px] font-bold tracking-tight text-sombre-texte">
            {TEXTES_TATOUAGE.titreAppelTatoueur}
          </h2>
          {/* LE BOUTON MÈNE DROIT À LA CRÉATION DE PORTFOLIO — pas à
              une page de présentation. Un compte déjà connecté y
              arrive sur le formulaire vierge ; un visiteur passe
              d'abord par la création de compte, et y revient (c'est
              le rôle de `?suite=`). */}
          {/* ⚠️ ON REMONTE AVANT DE PARTIR (nº 143-§5). Ce bouton est
              le SEUL du site qu'on touche depuis le BAS d'une page très
              longue : la mosaïque fait plusieurs milliers de pixels, et
              la page d'après en fait quelques centaines. Remonter au
              départ, plutôt qu'à l'arrivée, ne laisse aucune chance à
              une image intermédiaire — la nouvelle page naît en haut.
              (DefilementEnHaut tient déjà le cas général, désormais
              avant peinture ; ici, c'est ceinture et bretelles pour le
              chemin le plus exposé.) */}
          <Link
            onClick={() =>
              window.scrollTo({ top: 0, left: 0, behavior: "instant" })
            }
            href={`/devenir-tatoueur?suite=${encodeURIComponent(
              "/devenir-tatoueur/fiche?fiche=nouvelle"
            )}`}
            className="mt-4 inline-flex min-h-[48px] items-center justify-center
                       rounded-full bg-primaire px-7 text-[15px] font-semibold
                       text-white transition-colors hover:bg-primaire-fonce
                       focus-visible:outline-2 focus-visible:outline-offset-2
                       focus-visible:outline-primaire"
          >
            {TEXTES_TATOUAGE.boutonAppelTatoueur}
          </Link>
        </section>
        )}
      </main>
    </>
  );
}
