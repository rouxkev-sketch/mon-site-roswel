"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconeCroix } from "@/components/Icones";
import {
  entreeDejaPosee,
  lireDefilementResultats,
  marquerEntreePosee,
  memoriserDefilementResultats,
  prendreLEntree,
  type VueRecherche,
} from "@/lib/recherche-mobile";

/**
 * LA PAGE DE RECHERCHE PLEIN ÉCRAN (smartphone)
 * ==============================================
 * ELLE REMPLACE LA FENÊTRE SUPERPOSÉE, ET C'EST UNE DÉCISION DE FOND.
 *
 * Dix passes ont été consacrées à faire tenir une fenêtre flottante
 * pendant que le clavier d'iOS arrive : glissement de l'arrière-plan,
 * saccades, bande blanche, menu mal placé, page qui descend. Chaque
 * correction en produisait une autre, parce que la cause était
 * STRUCTURELLE : un élément qu'il faut repositionner à la main quand
 * iOS déplace le viewport visuel, réduit le viewport de mise en page,
 * et ne donne aucune mesure qui décrive complètement ce mouvement.
 *
 * UNE PAGE NORMALE N'A RIEN À REPOSITIONNER. Le navigateur fait
 * défiler le document pour amener le champ au-dessus des touches —
 * c'est son travail, il le fait sur iOS comme sur Android, et il le
 * fait mieux que nous. C'est ce que font Apple, Airbnb et Booking sur
 * mobile : toucher la barre de recherche ouvre une PAGE.
 *
 * DEUX ÉTATS, ET UN SEUL COMPTE VRAIMENT
 * ---------------------------------------
 * · « posée » — L'ÉTAT DE TRAVAIL, celui où vit le clavier. La page
 *   est en FLUX NORMAL dans le document (`position: static`), le reste
 *   du site est retiré du flux (voir `data-recherche` dans
 *   globals.css), et le document ne contient donc plus qu'elle : il
 *   défile pour elle seule. AUCUNE mesure, AUCUN écouteur de viewport,
 *   AUCUNE compensation. C'est tout l'intérêt de la refonte.
 * · « arrive » / « part » — LA GLISSADE, et rien d'autre. La page est
 *   momentanément `position: fixed` pour passer PAR-DESSUS les
 *   résultats pendant qu'elle les couvre. Aucun champ n'a le doigt à
 *   cet instant, aucun clavier n'est en jeu : c'est une translation,
 *   pas un placement. Seul `transform` est animé — le navigateur la
 *   peint sans recalculer la moindre mise en page.
 *
 * SON ENTRÉE D'HISTORIQUE — SANS CHANGER D'ADRESSE, ET SANS PASSER
 * D'ADRESSE À `pushState`
 * -------------------------------------------------
 * ⚠️ CETTE NUANCE EST LA CAUSE DU DÉFAUT « LA PAGE DISPARAÎT
 * AUSSITÔT ». Voir `poserLEntree` plus bas : c'est là que tout se
 * joue, et le commentaire y explique la mécanique exacte.
 *
 * `pushState` pose une étape SUR L'ADRESSE COURANTE. Le retour arrière
 * du navigateur et le geste depuis le bord de l'écran la referment donc
 * comme n'importe quelle page, et fermer la recherche ne fait JAMAIS
 * quitter le site. Pourquoi pas une adresse à elle (`/recherche`) :
 *  · RÉFÉRENCEMENT — une adresse qui n'existe pas n'a pas besoin d'être
 *    désindexée. Rien à écrire dans le sitemap, aucun `noindex`, aucune
 *    canonique à corriger. C'est la garantie la plus forte, et elle est
 *    gratuite ;
 *  · l'adresse courante PORTE DÉJÀ LA RECHERCHE (`/?style=…&lieu=…`,
 *    posée par IndexTatoueurs). Une seconde adresse par-dessus voudrait
 *    dire deux écritures d'historique concurrentes au moment de
 *    « Valider » ;
 *  · la MÉMOIRE DE NAVIGATION et la REPRISE DE SESSION travaillent par
 *    adresse : le journal d'onglet resterait sur les résultats de toute
 *    façon — autant ne rien avoir à leur apprendre. Position de
 *    défilement mémorisée, retour depuis une fiche : inchangés.
 *
 * UNE SEULE PORTE DE SORTIE, ET UN SEUL DRAPEAU. `prendreLEntree()`
 * dit si NOTRE étape est encore au sommet de la pile — et le
 * « consomme » du même geste. La croix et « Valider » la dépilent
 * eux-mêmes (`history.back()`) puis lancent la glissade ; un vrai
 * retour arrière trouve le drapeau et lance la même glissade, sans
 * jamais rappeler `back()`. Impossible de dépiler deux fois, donc
 * impossible de sortir du site.
 * ⚠️ CE DRAPEAU VIT HORS DE REACT (lib/recherche-mobile) : dans une
 * référence de composant, un remontage l'aurait remis à faux, et la
 * page aurait posé une DEUXIÈME étape sans jamais dépiler la première.
 */

/**
 * POSER L'ÉTAPE D'HISTORIQUE — ET SURTOUT, SANS LUI DONNER D'ADRESSE.
 * ==================================================================
 * ⚠️ C'EST ICI QUE LA PAGE SE REFERMAIT TOUTE SEULE. Elle appelait :
 *
 *     window.history.pushState(état, "", window.location.href)
 *
 * L'adresse passée était pourtant la même que l'adresse courante — on
 * pouvait la croire sans effet. Elle ne l'est pas.
 *
 * Next remplace `history.pushState` par le sien (app-router). Sa
 * version dit, en substance :
 *
 *     data = copierLesInternesDeNext(data);
 *     if (url) { appliquerLAdresse(url); }   // ← TOUT EST LÀ
 *     return vraiPushState(data, _, url);
 *
 * `appliquerLAdresse` envoie au routeur une action de RESTAURATION,
 * celle qu'il emploie quand on traverse l'historique. Le réducteur qui
 * la traite (`restore-reducer`) relance de VRAIES requêtes vers le
 * serveur pour la route (`spawnDynamicRequests`), puis REMPLACE l'arbre
 * du routeur par le résultat — et, s'il ne peut pas réconcilier,
 * termine par une navigation DURE, c'est-à-dire un rechargement.
 *
 * Autrement dit : demander une étape d'historique revenait à demander
 * à Next de REFAIRE LA PAGE. L'arbre reconstruit, le moteur de
 * recherche — qui portait l'état « la page est ouverte » — était
 * remonté à neuf, et la page disparaissait dans la seconde.
 *
 * POURQUOI `?sonde=1` L'EN EMPÊCHAIT. Ce réducteur ne prend pas
 * toujours le même chemin : il compare l'adresse restaurée à celle
 * déjà rendue (`renderedSearch`, `canonicalUrl`) et à ce qu'il a en
 * cache. Une adresse avec un paramètre en plus ne se réconcilie pas
 * comme une adresse nue. Le propriétaire avait donc raison de le
 * signaler : ce n'était pas la sonde qui réparait quoi que ce soit,
 * c'était le paramètre qui changeait le chemin pris par Next.
 *
 * LA CORRECTION TIENT EN UN ARGUMENT RETIRÉ. Sans adresse, la
 * condition `if (url)` est fausse : Next ne dispatche RIEN, ne
 * requête RIEN, ne reconstruit RIEN. L'étape est posée par le
 * navigateur sur l'adresse courante — c'est le comportement natif
 * quand on omet l'adresse — et les internes du routeur y sont tout de
 * même recopiés (`copierLesInternesDeNext` s'exécute avant le test).
 * Le retour arrière reste donc parfaitement compris par Next.
 */
function poserLEntree() {
  // UNE SEULE FOIS. Un remontage ne doit pas empiler une deuxième
  // étape : le retour arrière n'en dépilerait qu'une, et la page
  // resterait ouverte sur une pile faussée.
  if (entreeDejaPosee()) return;
  marquerEntreePosee();
  // ⚠️ DEUX ARGUMENTS, JAMAIS TROIS. Voir ci-dessus.
  window.history.pushState({ rechercheMobile: true }, "");
}

/** La durée de la glissade — et EXACTEMENT celle de la transition CSS
    plus bas. Un seul chiffre : les deux ne peuvent pas se désaccorder. */
const DUREE_GLISSADE_MS = 320;

/** La courbe des feuilles d'iOS : départ franc, arrivée posée. */
const COURBE_GLISSADE = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Où en est la page. « posée » est le seul état où l'on saisit. */
type Phase = "arrive" | "posee" | "part";

const VUES_RECHERCHE = [
  { cle: "recherche" as const, label: "Recherche" },
  { cle: "filtres" as const, label: "Filtres" },
];

export function PageRechercheMobile({
  vue,
  surVue,
  filtresEteints,
  onValider,
  onAbandonner,
  onEffacer,
  children,
}: {
  vue: VueRecherche;
  surVue: (vue: VueRecherche) => void;
  /** Combien d'interrupteurs sont éteints (pastille de la bascule). */
  filtresEteints: number;
  /** « Valider » : la SEULE porte qui lance la recherche. */
  onValider: () => void;
  /** La croix et le retour arrière : on referme sans rien appliquer. */
  onAbandonner: () => void;
  /** Remet à zéro LA VUE AFFICHÉE (page ouverte, sans chercher). */
  onEffacer: () => void;
  children: React.ReactNode;
}) {
  /**
   * ⚠️ L'ARRIVÉE EST TOUJOURS JOUÉE, MÊME SI L'ÉTAPE D'HISTORIQUE EST
   * DÉJÀ POSÉE — ET C'EST UNE LEÇON PAYÉE COMPTANT.
   * Une version de cette passe sautait la glissade quand l'étape
   * existait déjà, pour éviter de revoir la page descendre après un
   * remontage. Mais React rejoue les effets sur une MÊME instance (mode
   * strict, Fast Refresh) sans remettre `useState` à zéro : la branche
   * « déjà posée » se déclenchait alors que `enPlace` valait encore
   * faux, et la page RESTAIT HORS ÉCRAN, translatée de −100 % — dans le
   * DOM, avec son marqueur, mais invisible. Impossible de distinguer
   * les deux cas par l'état, et le mauvais côté du pari coûte une page
   * blanche. On joue donc l'arrivée à chaque montage : au pire une
   * glissade de trois dixièmes de seconde, jamais un écran vide.
   */
  const [phase, setPhase] = useState<Phase>("arrive");
  /** Vrai = la page est à sa place ; faux = hors écran, par le haut. */
  const [enPlace, setEnPlace] = useState(false);

  /** Les sorties changent d'un rendu à l'autre : on les lit dans une
      référence, jamais dans les dépendances d'un effet (l'effet se
      démonterait et se remonterait à chaque frappe). */
  const sorties = useRef({ onValider, onAbandonner });
  useEffect(() => {
    sorties.current = { onValider, onAbandonner };
  }, [onValider, onAbandonner]);

  /**
   * L'ARRIVÉE — l'étape d'historique, puis la glissade.
   * À la fin de la glissade seulement, la page se POSE : le reste du
   * site quitte le flux et le document devient le sien. Faire les deux
   * d'un coup ferait disparaître les résultats d'un bloc au lieu de les
   * laisser se couvrir.
   */
  useEffect(() => {
    // ⚠️ LA POSITION DES RÉSULTATS N'EST PRISE QU'À LA PREMIÈRE
    // OUVERTURE : si l'étape est déjà posée, le document ne montre
    // plus les résultats (il est à la page de recherche), et relire
    // `scrollY` écraserait la bonne valeur par un zéro.
    if (!entreeDejaPosee()) memoriserDefilementResultats(window.scrollY);
    poserLEntree();

    const image = requestAnimationFrame(() => setEnPlace(true));
    const poser = window.setTimeout(() => {
      document.documentElement.dataset.recherche = "ouverte";
      setPhase("posee");
      // Le document ne contient plus qu'elle : on repart de son haut.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, DUREE_GLISSADE_MS);

    return () => {
      cancelAnimationFrame(image);
      window.clearTimeout(poser);
      // FILET DE SÉCURITÉ : quel que soit le chemin de démontage, le
      // site retrouve son flux. Sans lui, un démontage imprévu
      // laisserait la page blanche.
      delete document.documentElement.dataset.recherche;
    };
  }, []);

  /** LA GLISSADE DE SORTIE — le site reparaît DERRIÈRE la page, à sa
      position, et la page remonte par le haut. Rien n'est mesuré : on
      remet le défilement qu'on avait pris, c'est tout.
      « Valider » rend les résultats EN HAUT : une nouvelle recherche se
      lit depuis sa première carte, pas depuis le milieu de l'ancienne. */
  function glisserDehors(valider: boolean) {
    if (phase === "part") return;
    delete document.documentElement.dataset.recherche;
    setPhase("part");
    window.scrollTo({
      top: valider ? 0 : lireDefilementResultats(),
      left: 0,
      behavior: "instant",
    });
    // Deux images : la première peint la page redevenue fixe à sa
    // place, la seconde lance la transition. Une seule, et le
    // navigateur regrouperait les deux valeurs — aucun mouvement.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setEnPlace(false))
    );
    window.setTimeout(() => {
      const { onValider: valide, onAbandonner: abandonne } = sorties.current;
      if (valider) valide();
      else abandonne();
    }, DUREE_GLISSADE_MS);
  }

  /** LA CROIX ET « VALIDER » — ils dépilent NOTRE étape eux-mêmes,
      puis glissent. Le `popstate` qui suit trouve le drapeau baissé et
      ne fait rien : une seule fermeture, jamais deux. */
  function fermer(valider: boolean) {
    // `prendreLEntree()` rend vrai UNE SEULE FOIS : impossible de
    // dépiler deux fois, donc impossible de quitter le site.
    if (prendreLEntree()) window.history.back();
    glisserDehors(valider);
  }

  /**
   * LE RETOUR ARRIÈRE DU NAVIGATEUR — et le geste depuis le bord de
   * l'écran, qui est le même événement. Il referme la page comme
   * n'importe quelle autre : c'est tout l'intérêt d'avoir une vraie
   * étape d'historique.
   * Sans tableau de dépendances : l'écouteur voit toujours la phase
   * courante.
   */
  useEffect(() => {
    function auRetour() {
      // Faux = c'était notre propre `back()`, déjà traité.
      if (!prendreLEntree()) return;
      glisserDehors(false);
    }
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") fermer(false);
    }
    window.addEventListener("popstate", auRetour);
    document.addEventListener("keydown", auClavier);
    return () => {
      window.removeEventListener("popstate", auRetour);
      document.removeEventListener("keydown", auClavier);
    };
  });

  const enGlissade = phase !== "posee";

  return createPortal(
    <div
      // ⚠️ CE MARQUEUR EST LU PAR globals.css : c'est lui qui distingue
      // la page du reste du site quand celui-ci quitte le flux.
      data-page-recherche=""
      role="dialog"
      aria-modal="true"
      aria-label="Rechercher un tatoueur"
      style={
        enGlissade
          ? {
              transform: enPlace ? "translateY(0)" : "translateY(-100%)",
              transition: `transform ${DUREE_GLISSADE_MS}ms ${COURBE_GLISSADE}`,
            }
          : undefined
      }
      className={`${
        enGlissade
          ? // LA GLISSADE : par-dessus les résultats, le temps de les
            // couvrir. Seul `transform` bouge — aucune mise en page à
            // recalculer, le navigateur peint sur le compositeur.
            "fixed inset-0 z-[70] will-change-transform"
          : // POSÉE : une PAGE, en flux normal. Aucune position, aucun
            // repère d'écran — le navigateur fait défiler le document
            // pour dégager le champ du clavier, et c'est tout.
            "relative z-[70] min-h-[100dvh] w-full"
      } flex flex-col bg-sombre-fond text-sombre-texte
         motion-reduce:transition-none`}
    >
      {/* LA CROIX, EN HAUT À DROITE — la sortie sans appliquer. Le
          rembourrage haut respecte l'encoche : en application installée
          (barre d'état translucide), le contenu passerait dessous.

          ⚠️ CETTE LIGNE EST COLLANTE (`sticky`), ET C'EST DÉLIBÉRÉ.
          Quand on touche le champ de localité, la page défile pour
          l'amener en haut de l'écran (voir ChampLocalisation) : tout
          ce qui le précède sort alors par le haut. La CROIX, elle, est
          une des trois sorties — elle doit rester atteignable même au
          milieu d'une saisie. `sticky` est du CSS pur : le navigateur
          s'en charge, rien n'est mesuré ni déplacé à la main.
          Le fond opaque est obligatoire : sans lui, le contenu
          défilerait en transparence derrière la croix. */}
      <div
        className="sticky top-0 z-10 bg-sombre-fond
                   flex items-center justify-end px-4 pb-1
                   pt-[max(12px,env(safe-area-inset-top))]"
      >
        <button
          type="button"
          onClick={() => fermer(false)}
          aria-label="Fermer la recherche"
          className="flex h-11 w-11 items-center justify-center rounded-full
                     border border-sombre-bordure bg-sombre-eleve
                     text-sombre-texte active:border-primaire transition-colors"
        >
          <IconeCroix taille={16} />
        </button>
      </div>

      {/* LA BASCULE — deux moitiés dans une même piste arrondie,
          l'active en rose plein. Inchangée : elle a toujours bien
          fonctionné, seul son contenant change.
          Une PASTILLE ROSE sur « Filtres » signale des interrupteurs
          éteints rangés derrière la vue qu'on ne regarde pas. */}
      <div
        role="tablist"
        aria-label="Recherche ou filtres"
        className="mx-4 flex gap-1 rounded-full border border-sombre-bordure
                   bg-sombre-eleve p-1"
      >
        {VUES_RECHERCHE.map((onglet) => {
          const actif = onglet.cle === vue;
          const pastille = onglet.cle === "filtres" && filtresEteints > 0;
          return (
            <button
              key={onglet.cle}
              type="button"
              role="tab"
              aria-selected={actif}
              aria-controls="page-recherche-vue"
              onClick={() => surVue(onglet.cle)}
              className={`flex flex-1 items-center justify-center gap-1.5
                         rounded-full min-h-[42px] text-[15px] font-semibold
                         transition-colors ${
                           actif
                             ? "bg-primaire text-white"
                             : "text-sombre-texte-doux active:text-sombre-texte"
                         }`}
            >
              {onglet.label}
              {pastille && (
                <span
                  aria-hidden="true"
                  className={`h-[7px] w-[7px] rounded-full ${
                    actif ? "bg-white" : "bg-primaire"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* LA VUE — elle prend toute la hauteur restante, et s'allonge
          quand la liste de suggestions s'ouvre DANS LE FLUX sous le
          champ. C'est cet allongement qui rend le document défilable :
          le navigateur a alors de quoi remonter le champ au-dessus des
          touches, sans que personne ne lui dise comment. */}
      {/* ⚠️ `grow`, ET SURTOUT PAS `flex-1 min-h-0` — c'est ce qui
          empêchait le champ de remonter.
          `flex-1` pose `flex-basis: 0` et `min-h-0` autorise l'élément
          à être plus petit que son contenu : la vue restait donc à la
          hauteur de l'écran, la liste de suggestions DÉBORDAIT par le
          bas, et le DOCUMENT NE S'ALLONGEAIT PAS D'UN PIXEL. Sans
          hauteur à défiler, le défilement natif n'avait rien à faire,
          et le champ ne bougeait jamais (mesuré : gain de 0 px).
          `grow` part de la hauteur du CONTENU et grandit s'il reste de
          la place : la vue s'allonge donc quand la liste s'ouvre, le
          document devient défilable, et `scrollIntoView` peut amener
          le champ en haut. */}
      <div
        id="page-recherche-vue"
        role="tabpanel"
        className="flex grow flex-col gap-5 px-4 pt-5"
      >
        {children}
      </div>

      {/* LES DEUX BOUTONS, aux extrémités de la même ligne, DANS LES
          DEUX VUES et à la même place : « Effacer » (clair,
          secondaire) à gauche — il ne vide que la vue affichée, et ne
          cherche pas — et « Valider » (rose, plein) à droite, LE SEUL
          GESTE QUI LANCE LA RECHERCHE.
          EN FLUX, jamais collés en bas : un pied fixe repasserait sous
          le clavier, et c'est très exactement ce qu'on vient de
          supprimer. Quand la liste s'ouvre, ils descendent avec la
          page — on les rejoint en défilant, comme dans n'importe quel
          formulaire. */}
      <div
        className="flex items-center justify-between px-4 pt-6
                   pb-[max(20px,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={onEffacer}
          className="rounded-full px-6 min-h-[44px] text-[15px] font-semibold
                     bg-sombre-texte text-sombre-fond active:opacity-85
                     transition-opacity"
        >
          Effacer
        </button>
        <button
          type="button"
          onClick={() => fermer(true)}
          className="rounded-full px-6 min-h-[44px] text-[15px] font-semibold
                     bg-primaire active:bg-primaire-fonce text-white
                     transition-colors"
        >
          Valider
        </button>
      </div>
    </div>,
    document.body
  );
}
