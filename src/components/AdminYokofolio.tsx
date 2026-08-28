"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  libelleFiltre,
  libelleStyle,
  MARQUE_YOKOFOLIO,
  MOTIFS_MODERATION,
  MOTIFS_SIGNALEMENT,
  famillesStyles,
} from "@/config/tatouage";
import { estCourrielAdmin } from "@/lib/admin-yokofolio-client";
//  §4 (nº 332) — un état qui vit dans l'adresse, une entrée par pas :
//  l'écriture commune du C-6 (lib/etape-dans-adresse).
import { useEtapeDansLAdresse } from "@/lib/etape-dans-adresse";
//  §3 (nº 330) — l'étape d'historique, écriture unique des quatre
//  surfaces qui couvrent l'écran.
import { useEtapeQuiSeReferme } from "@/lib/etape-refermable";
import { AdminDemarchage } from "@/components/AdminDemarchage";
import { LogoYokofolio } from "@/components/LogoYokofolio";
import { Patience, SqueletteLignes } from "@/components/Squelette";
import { useUtilisateur } from "@/lib/use-utilisateur";
import type { Tatoueur } from "@/lib/tatoueurs";
//  §1 (nº 693) — le délai de garde des lectures du navigateur,
//  écrit une seule fois (voir lib/lecture-navigateur).
import { lireDuServeur } from "@/lib/lecture-navigateur";

/**
 * L'ADMIN DE YOKOFOLIO — reparti de zéro
 * =======================================
 * Charte sombre du site, gabarit des outils d'aujourd'hui : une BARRE
 * LATÉRALE de navigation (extensible — ajouter une section = une
 * entrée dans SECTIONS) et une ZONE DE CONTENU.
 *
 * ACCÈS : les comptes dont l'adresse figure dans COURRIELS_ADMIN
 * (src/config/tatouage.ts). L'écran vérifie pour l'affichage ; chaque
 * API revérifie côté serveur — c'est elle, la vraie serrure.
 *
 * SECTIONS :
 *  - FICHES À VALIDER : par ordre d'arrivée ; l'écran de vérification
 *    montre TOUT (nom, adresse, bio, styles et chaque photo, filtres,
 *    liens cliquables) ; VALIDER publie, DEMANDER DES MODIFICATIONS
 *    et METTRE HORS LIGNE exigent au moins un motif coché (enregistré
 *    avec la décision, et envoyé en notification) ;
 *  - SIGNALEMENTS : les signalements des visiteurs, lien vers la
 *    fiche, archivage après traitement.
 *
 * ⚠️ CETTE FILE VAUT POUR TOUTES LES FICHES (passe nº 152), celles des
 * tatoueurs comme celles de l'administrateur. La nº 145 avait sorti ces
 * dernières du parcours de modération — utile à leur CRÉATION (elles se
 * publient d'un interrupteur, dans le démarchage), désastreux à leur
 * MODIFICATION : modifier une fiche en ligne écrit les changements dans
 * un brouillon et la met « en attente », donc dans une file dont elle
 * était exclue. Elle y restait pour toujours, et le changement avec.
 * Une fiche d'administrateur revient donc ici DÈS QU'ELLE PORTE UN
 * BROUILLON — et rien d'autre n'a bougé.
 */

type FicheAdmin = Tatoueur & {
  statut?: string | null;
  cree_le?: string | null;
  /** §2 (nº 688) — TOUTES les photos de la fiche, comptées une seule
      fois chacune (galerie, photos de style, vignette, tableau
      `photos`). C'est le nombre que la confirmation de suppression
      annonce. Absent d'une réponse d'avant cette passe, ou d'une base
      où la table des photos manque : la fenêtre le dit alors au lieu
      d'inventer un chiffre. */
  photos_total?: number;
  /** Vrai = ce sont des MODIFICATIONS d'une fiche déjà en ligne. */
  modification?: boolean;
  /** CE QUI A CHANGÉ — les champs du brouillon qui diffèrent de la
      version en ligne, déjà nommés en français par la route. Vide sur
      une création : tout est neuf, il n'y a rien à comparer. */
  champs_modifies?: string[];
  /** Vrai = fiche d'un compte administrateur. Elle n'arrive ici QUE
      pour une modification en attente (passe nº 152). */
  fiche_admin?: boolean;
  /** L'adresse du compte propriétaire, quand elle est lisible. */
  compte?: string | null;
};

/** Le libellé français d'un motif de signalement (slug sinon). */
function libelleSignalement(slug: string): string {
  return MOTIFS_SIGNALEMENT.find((m) => m.slug === slug)?.label ?? slug;
}

type Signalement = {
  id: number;
  tatoueur_slug: string;
  motifs: string[];
  details: string | null;
  /** La note de traitement de l'admin — relue sur la carte. */
  note?: string | null;
  traite: boolean;
  cree_le: string;
};

const SECTIONS = [
  { cle: "fiches", libelle: "Portfolios à valider" },
  { cle: "signalements", libelle: "Signalements" },
  //  LES STYLES PROPOSÉS PAR LES TATOUEURS (passe nº 122). Accepter
  //  en ajoute un au catalogue du site ; refuser clôt la demande. Dans
  //  les deux cas, le tatoueur est prévenu.
  { cle: "styles", libelle: "Suggestions de styles" },
  //  LE DÉMARCHAGE (passe nº 135) — il REMPLACE « Mes fiches
  //  d'essai ». L'interrupteur n'a pas disparu : il vit désormais dans
  //  le tableau, où il ne sert plus à « voir sa fiche le temps d'un
  //  test » mais à LA METTRE EN LIGNE — une fiche d'administrateur ne
  //  passe pas par la validation POUR EXISTER. Ses MODIFICATIONS, si
  //  (passe nº 152) : elles reviennent dans « Fiches à valider ».
  { cle: "demarchage", libelle: "Démarchage" },
] as const;

/** UNE SUGGESTION DE STYLE, telle que la sert l'API. */
type SuggestionStyle = {
  id: string;
  propose: string;
  etat: "en_attente" | "acceptee" | "refusee";
  label: string | null;
  slug: string | null;
  famille: string | null;
  message: string | null;
  fiche_nom: string | null;
  /** L'ADRESSE DE LA FICHE du proposeur (passe nº 123), pour aller la
      consulter avant de décider. Null quand le compte n'en a aucune. */
  fiche_slug: string | null;
  courriel: string | null;
  cree_le: string;
  traite_le: string | null;
};

/** LE BROUILLON DE DÉCISION — ce que l'administration est en train
    d'écrire sur une demande, avant de le confirmer. */
type BrouillonDecision = {
  id: string;
  decision: "accepter" | "refuser";
  /** Le nom retenu. Prérempli avec la proposition, modifiable :
      c'est l'administration qui tranche du nom, pas le demandeur. */
  label: string;
  /** null = la liste principale ; sinon le slug de la famille. */
  famille: string | null;
  message: string;
};

type SectionCle = (typeof SECTIONS)[number]["cle"];

/** §4 (nº 332) — CE QUE L'ADRESSE A LE DROIT DE DIRE. Une clé inconnue
    rend `null`, et l'écriture commune retombe alors sur la section
    d'arrivée : une adresse bricolée ne peut pas afficher un écran
    vide. La liste est celle des sections, jamais une seconde. */
function reconnaitreLaSection(brut: string): SectionCle | null {
  const trouvee = SECTIONS.find((s) => s.cle === brut);
  return trouvee ? (trouvee.cle as SectionCle) : null;
}

/** LA GRAMMAIRE DES CHAMPS (passe nº 136) — la même que le formulaire
    et la page Sécurité : pas de contour, le focus ÉCLAIRCIT le fond.
    ⚠️ `border border-transparent` réserve l'épaisseur : sans elle, le
    texte bougerait d'un pixel au focus sur certains navigateurs. */
const CHAMP =
  "w-full rounded-lg border border-transparent bg-sombre-eleve-clair px-4 text-sombre-texte placeholder:text-sombre-texte-doux outline-none transition-colors focus:bg-sombre-haut";

/** L'ENCADRÉ D'ERREUR — la SEULE exception au « zéro contour ». */
const ERREUR =
  "rounded-lg border border-erreur/50 bg-erreur/10 px-4 py-3 text-[13px] leading-relaxed text-sombre-texte";

function dateCourte(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AdminYokofolio() {
  const { utilisateur, pret } = useUtilisateur();
  /**
   * §4 (nº 332) — LA SECTION VIT DANS L'ADRESSE, ET CHAQUE PAS COMPTE.
   * ------------------------------------------------------------------
   * C'est la moitié du C-6 (inventaire nº 327), et le POINT 5 de la
   * règle de navigation. Elle vivait dans un `useState` : passer d'une
   * section à l'autre, puis appuyer sur retour, faisait SORTIR de
   * l'administration au lieu de ramener à la section précédente.
   * ⚠️ ET CE N'EST PAS LA RÈGLE DE L'ONGLET PROFIL / PORTFOLIO : là-bas
   * on REMPLACE l'entrée (changer d'onglet n'est pas un déplacement) ;
   * ici on en POSE une par pas, parce que changer de section EN EST un
   * — décision du propriétaire à la nº 332. L'écriture est commune
   * (lib/etape-dans-adresse), rien n'est recopié ici.
   * ⚠️ UNE SECTION INCONNUE dans l'adresse retombe sur « fiches » :
   * l'écran d'arrivée, jamais un écran vide.
   */
  const [section, setSection] = useEtapeDansLAdresse<SectionCle>(
    "section",
    "fiches",
    reconnaitreLaSection
  );

  /* ---- Fiches à valider ---- */
  const [fiches, setFiches] = useState<FicheAdmin[] | null>(null);
  const [ficheOuverte, setFicheOuverte] = useState<FicheAdmin | null>(null);
  /**
   * §3 (nº 330) — LE RETOUR REFERME LA FICHE OUVERTE, il ne quitte pas
   * l'administration.
   * ------------------------------------------------------------------
   * Quatrième et dernière des surfaces du C-4 (inventaire nº 327).
   * Elle repose sur LE MÊME MÉCANISME que les trois autres — un état
   * de composant qui remplace ce qu'on regardait sans changer
   * d'adresse : l'écriture unique (lib/etape-refermable) s'y applique
   * telle quelle, sans rien d'inventé pour elle.
   * ⚠️ LA SECTION D'ADMINISTRATION N'EST PAS TOUCHÉE : c'est un état de
   * page (C-6), et le propriétaire l'a explicitement réservée à la
   * passe suivante.
   */
  useEtapeQuiSeReferme(ficheOuverte !== null, () => setFicheOuverte(null));
  const [erreurFiches, setErreurFiches] = useState<string | null>(null);
  /* ---- La demande de modifications ---- */
  const [motifsCoches, setMotifsCoches] = useState<string[]>([]);
  const [noteMotif, setNoteMotif] = useState("");
  /** LE PANNEAU DES MOTIFS — fermé, ou ouvert POUR UNE DÉCISION
      précise : « modifier » (rendre la main au tatoueur) ou
      « hors_ligne » (dépublier). Les deux exigent au moins un motif,
      et n'ont donc qu'un seul panneau — c'est le bouton qui a
      appelé qui dit ce que fera « Envoyer ». */
  const [refusOuvert, setRefusOuvert] = useState<
    null | "modifier" | "hors_ligne"
  >(null);
  const [envoiDecision, setEnvoiDecision] = useState(false);
  /**
   * ██ §2 (nº 688) — LA SUPPRESSION SE TAPE, ELLE NE SE CLIQUE PLUS ██
   * ------------------------------------------------------------------
   * CE QUI EST ARRIVÉ, ET C'EST LA RAISON DE CETTE PASSE : le
   * propriétaire a supprimé LA MAUVAISE DEMANDE. Un seul clic, un
   * `window.confirm` qui ne nommait rien (« ce portfolio »), et une
   * perte définitive — ni corbeille, ni délai, ni retour possible.
   * TROIS CHOSES CHANGENT, et ce sont les trois qu'il a demandées :
   *  · la fenêtre NOMME ce qui part — le nom du portfolio et son
   *    nombre de photos, pour que deux lignes qui se ressemblent ne
   *    puissent plus se confondre ;
   *  · elle DIT que c'est immédiat et définitif, en toutes lettres ;
   *  · elle EXIGE de taper SUPPRIMER. C'est l'usage des grands outils
   *    pour l'irréversible, et c'est déjà celui du site : la même
   *    fenêtre existe depuis longtemps pour retirer un style de son
   *    propre portfolio (BlocPortfolio). On en reprend l'écriture au
   *    caractère — mêmes classes, mêmes mots, même bouton — plutôt que
   *    d'en dessiner une seconde qui finirait par diverger.
   * ⚠️ ET LE DÉCOMPTE DES PHOTOS, LUI, REVIENT : la nº 110 l'avait
   * retiré de la fenêtre du tatoueur (« la phrase faisait peur pour
   * rien »). Ici il ne fait pas peur, il DÉSIGNE : celui qui supprime
   * n'est pas celui qui a déposé, et le chiffre est le seul repère qui
   * distingue deux demandes voisines. Les deux fenêtres ne poursuivent
   * pas le même but ; c'est pourquoi elles ne disent pas la même chose.
   *
   * ⚠️ ET LA SUPPRESSION D'UN COMPTE ENTIER ? ELLE N'EXISTE PAS ICI —
   * vérifié, puisque la consigne le demandait. L'administration ne
   * supprime que des FICHES : la seule route qui efface un compte
   * (`/api/compte/supprimer`) lit la session de l'appelant et efface
   * SON compte à lui, jamais celui d'un autre. Le chemin par lequel une
   * personne supprime le sien porte déjà les mêmes garde-fous, et
   * davantage : il faut écrire SUPPRIMER (BlocSuppressions), et trente
   * jours s'écoulent avant l'effacement réel. Il n'y a donc rien à
   * poser de ce côté.
   */
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [saisieSuppression, setSaisieSuppression] = useState("");
  const suppressionConfirmee =
    saisieSuppression.trim().toLowerCase() === "supprimer";
  /* ---- Signalements ---- */
  const [signalements, setSignalements] = useState<Signalement[] | null>(null);
  const [erreurSignalements, setErreurSignalements] = useState<string | null>(
    null
  );
  /** La note en cours d'écriture ({ id, texte }), ou null. */
  const [noteEnCours, setNoteEnCours] = useState<{
    id: number;
    texte: string;
  } | null>(null);
  /* ---- Suggestions de styles (passe nº 122) ---- */
  const [suggestions, setSuggestions] = useState<SuggestionStyle[] | null>(
    null
  );
  const [erreurSuggestions, setErreurSuggestions] = useState<string | null>(
    null
  );
  /** La demande en cours de décision, et ce qui s'y écrit. Une seule
      à la fois : deux panneaux ouverts inviteraient à confondre les
      messages. */
  const [brouillon, setBrouillon] = useState<BrouillonDecision | null>(null);
  const [envoiSuggestion, setEnvoiSuggestion] = useState(false);
  /** LE STYLE DONT LE RETRAIT EST DEMANDÉ (passe nº 123) — sa ligne
      montre alors la confirmation, à la place du bouton. */
  const [aRetirer, setARetirer] = useState<string | null>(null);

  const admin = pret && estCourrielAdmin(utilisateur?.email);

  const chargerFiches = useCallback(async () => {
    try {
      const reponse = await lireDuServeur("/api/admin/yokofolio/fiches");
      const donnees = (await reponse.json()) as {
        ok: boolean;
        fiches?: FicheAdmin[];
        message?: string;
      };
      if (!donnees.ok) throw new Error(donnees.message);
      setFiches(donnees.fiches ?? []);
      setErreurFiches(null);
    } catch (e) {
      setFiches([]);
      setErreurFiches(e instanceof Error ? e.message : "Lecture impossible.");
    }
  }, []);

  const chargerSuggestions = useCallback(async () => {
    try {
      const reponse = await lireDuServeur("/api/admin/yokofolio/suggestions-styles");
      const donnees = (await reponse.json()) as {
        ok: boolean;
        suggestions?: SuggestionStyle[];
        message?: string;
      };
      if (!donnees.ok) throw new Error(donnees.message);
      setSuggestions(donnees.suggestions ?? []);
      setErreurSuggestions(null);
    } catch (e) {
      setSuggestions([]);
      setErreurSuggestions(
        e instanceof Error ? e.message : "Lecture impossible."
      );
    }
  }, []);

  const chargerSignalements = useCallback(async () => {
    try {
      const reponse = await lireDuServeur("/api/admin/yokofolio/signalements");
      const donnees = (await reponse.json()) as {
        ok: boolean;
        signalements?: Signalement[];
        message?: string;
      };
      if (!donnees.ok) throw new Error(donnees.message);
      setSignalements(donnees.signalements ?? []);
      setErreurSignalements(null);
    } catch (e) {
      setSignalements([]);
      setErreurSignalements(
        e instanceof Error ? e.message : "Lecture impossible."
      );
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    // Chargements DIFFÉRÉS d'un tour : l'effet ne pose jamais d'état
    // de façon synchrone (règle react-hooks), et un aller-retour
    // section A → B → A ne relance rien d'inutile.
    const minuteur = window.setTimeout(() => {
      if (section === "fiches" && fiches === null) chargerFiches();
      if (section === "signalements" && signalements === null) {
        chargerSignalements();
      }
      if (section === "styles" && suggestions === null) chargerSuggestions();
      //  ⚠️ LE DÉMARCHAGE SE CHARGE TOUT SEUL (passe nº 135) : son
      //  écran est un composant à part (AdminDemarchage), qui lit ce
      //  qu'il lui faut à son ouverture. Rien à réveiller d'ici.
    }, 0);
    return () => window.clearTimeout(minuteur);
  }, [
    admin,
    section,
    fiches,
    signalements,
    suggestions,
    chargerFiches,
    chargerSignalements,
    chargerSuggestions,
  ]);

  /** RETIRER UN STYLE DÉJÀ ACCEPTÉ (passe nº 123).
      ⚠️ C'EST UNE CORRECTION, PAS UNE DÉCISION : le tatoueur n'est
      pas prévenu (voir la route). Le style quitte le catalogue ; les
      portfolios qui l'avaient coché gardent son slug en base, sans
      l'afficher — réaccepter le même nom le fait revenir tel quel. */
  async function retirerLeStyle(id: string) {
    if (envoiSuggestion) return;
    setEnvoiSuggestion(true);
    setErreurSuggestions(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/suggestions-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision: "retirer" }),
      });
      const donnees = (await reponse.json()) as {
        ok: boolean;
        message?: string;
      };
      if (!donnees.ok) throw new Error(donnees.message);
      setARetirer(null);
      setSuggestions(null); // relecture : la ligne montre son nouvel état
    } catch (e) {
      setErreurSuggestions(
        e instanceof Error ? e.message : "Le retrait n'a pas abouti."
      );
    } finally {
      setEnvoiSuggestion(false);
    }
  }

  /** TRANCHER UNE DEMANDE — accepter (avec nom et rangement) ou
      refuser. Le message facultatif part dans les deux cas. */
  async function deciderSuggestion() {
    if (!brouillon || envoiSuggestion) return;
    setEnvoiSuggestion(true);
    setErreurSuggestions(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/suggestions-styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: brouillon.id,
          decision: brouillon.decision,
          label: brouillon.label,
          famille: brouillon.famille,
          message: brouillon.message,
        }),
      });
      const donnees = (await reponse.json()) as {
        ok: boolean;
        message?: string;
      };
      if (!donnees.ok) throw new Error(donnees.message);
      setBrouillon(null);
      setSuggestions(null); // relecture : la liste montre la décision
    } catch (e) {
      setErreurSuggestions(
        e instanceof Error ? e.message : "La décision n'a pas abouti."
      );
    } finally {
      setEnvoiSuggestion(false);
    }
  }

  async function decider(
    action: "valider" | "modifier" | "hors_ligne" | "supprimer"
  ) {
    if (!ficheOuverte || envoiDecision) return;
    setEnvoiDecision(true);
    try {
      const reponse = await fetch("/api/admin/yokofolio/fiches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ficheOuverte.id,
          action,
          motifs: motifsCoches,
          note: noteMotif,
        }),
      });
      const donnees = (await reponse.json()) as { ok: boolean; message?: string };
      if (!donnees.ok) throw new Error(donnees.message);
      setFicheOuverte(null);
      setRefusOuvert(null);
      setMotifsCoches([]);
      setNoteMotif("");
      //  §2 (nº 688) — LA FENÊTRE DE SUPPRESSION SE REFERME AVEC LA
      //  FICHE, et son mot est effacé : la prochaine suppression
      //  redemandera de le taper. Un champ resté rempli aurait fait de
      //  la seconde un simple clic — exactement ce qu'on retire.
      setSuppressionOuverte(false);
      setSaisieSuppression("");
      await chargerFiches();
    } catch (e) {
      setErreurFiches(
        e instanceof Error ? e.message : "La décision n'a pas été enregistrée."
      );
    } finally {
      setEnvoiDecision(false);
    }
  }

  /** ROUVRIR LE BLOC 1 D'UNE FICHE — action d'administration.
      Le tatoueur redevient libre de corriger son type et ses lieux
      d'exercice, et il en est prévenu par une notification. */
  async function deverrouillerExercice() {
    if (!ficheOuverte || envoiDecision) return;
    setEnvoiDecision(true);
    try {
      const reponse = await fetch(
        "/api/admin/yokofolio/deverrouiller-exercice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: ficheOuverte.id }),
        }
      );
      const donnees = (await reponse.json()) as { ok: boolean; message?: string };
      if (!donnees.ok) throw new Error(donnees.message);
      setErreurFiches(
        "Le premier bloc de ce portfolio est rouvert : le tatoueur peut le corriger, puis le confirmer de nouveau."
      );
    } catch (e) {
      setErreurFiches(
        e instanceof Error ? e.message : "Le déblocage n'a pas abouti."
      );
    } finally {
      setEnvoiDecision(false);
    }
  }

  async function enregistrerNote() {
    if (!noteEnCours) return;
    try {
      const reponse = await fetch("/api/admin/yokofolio/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteEnCours.id, note: noteEnCours.texte }),
      });
      const donnees = (await reponse.json()) as { ok: boolean; message?: string };
      if (!donnees.ok) throw new Error(donnees.message);
      setNoteEnCours(null);
      await chargerSignalements();
    } catch (e) {
      setErreurSignalements(
        e instanceof Error ? e.message : "La note n'a pas été enregistrée."
      );
    }
  }

  async function archiverSignalement(id: number) {
    try {
      await fetch("/api/admin/yokofolio/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await chargerSignalements();
    } catch {
      // la liste rechargée dira l'état réel
    }
  }

  const autreCoche = motifsCoches.includes("autre");
  const refusPret =
    motifsCoches.length > 0 && (!autreCoche || noteMotif.trim().length >= 5);

  /* ---------- LES PORTES ---------- */
  if (!pret) return <main className="flex-1" aria-hidden="true" />;
  if (!utilisateur || !admin) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[440px] px-5 pt-16 pb-24 text-center">
        <h1 className="text-[clamp(1.5rem,4vw,1.9rem)] font-bold text-sombre-texte">
          Espace réservé
        </h1>
        <p className="mt-3 text-sombre-texte-doux leading-relaxed">
          {utilisateur
            ? "Ce compte n'est pas administrateur de yokofolio."
            : "Connecte-toi avec un compte administrateur pour ouvrir cette page."}
        </p>
        <Link
          href={utilisateur ? "/" : "/devenir-tatoueur"}
          className="mt-7 inline-flex items-center justify-center rounded-full
                     px-7 min-h-[52px] bg-primaire hover:bg-primaire-fonce
                     text-white font-semibold transition-colors"
        >
          {utilisateur ? "Retour à l'accueil" : "Me connecter"}
        </Link>
      </main>
    );
  }

  /* ---------- L'ADMIN ---------- */
  return (
    /*  ⚠️ LA MÊME LARGEUR QUE LE RESTE DU SITE (passe nº 142) : 1760 px
        et les mêmes marges (`px-4 sm:px-6`) que le contenu de
        `(tatouage)/layout.tsx`. L'admin s'arrêtait à 1400 px et se
        détachait donc de toutes les autres pages — sur un grand écran,
        le tableau de démarchage était visiblement plus étroit que la
        mosaïque, sans qu'aucune raison ne le justifie. */
    <main className="flex-1 mx-auto w-full max-w-[1760px] px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
      {/* ---- LA BARRE LATÉRALE — extensible ---- */}
      <aside className="lg:w-[230px] shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <LogoYokofolio variante="icone" hauteur={28} classe="h-7 w-7" />
          <p className="text-[15px] font-bold text-sombre-texte">
            Admin {MARQUE_YOKOFOLIO.nom}
          </p>
        </div>
        {/* ⚠️ LA BARRE SE PLIE SOUS 1024 px (passe nº 123). Elle
            alignait ses entrées sur UNE SEULE LIGNE, sans repli ni
            défilement : à trois sections ça passait de justesse, la
            quatrième (« Suggestions de styles », passe nº 122) a fait
            déborder la PAGE ENTIÈRE — 440 px de large sur un écran de
            320, avec un défilement horizontal parasite sur tout
            l'admin. `flex-wrap` laisse les entrées descendre à la
            ligne ; en colonne (≥ 1024 px) le repli n'a plus lieu
            d'être, d'où `lg:flex-nowrap`. */}
        <nav
          aria-label="Sections de l'admin"
          className="mt-4 flex flex-wrap lg:flex-col lg:flex-nowrap gap-1.5"
        >
          {SECTIONS.map((entree) => (
            <button
              key={entree.cle}
              type="button"
              onClick={() => setSection(entree.cle)}
              aria-current={section === entree.cle ? "page" : undefined}
              className={`rounded-lg px-4 min-h-[42px] text-left text-[14.5px] font-semibold
                         transition-colors ${
                           section === entree.cle
                             ? "bg-sombre-eleve-clair text-primaire"
                             : "text-sombre-texte-doux hover:text-sombre-texte hover:bg-sombre-carte"
                         }`}
            >
              {entree.libelle}
              {entree.cle === "signalements" &&
                (signalements?.filter((s) => !s.traite).length ?? 0) > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primaire px-2 min-h-[20px] text-[11.5px] text-white">
                    {signalements!.filter((s) => !s.traite).length}
                  </span>
                )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ---- LA ZONE DE CONTENU ---- */}
      <section className="min-w-0 flex-1">
        {section === "fiches" && !ficheOuverte && (
          <>
            <h1 className="text-[22px] font-bold text-sombre-texte">
              Portfolios à valider
            </h1>
            {erreurFiches && (
              <p className={`mt-4 ${ERREUR}`}>{erreurFiches}</p>
            )}
            <div className="mt-5 flex flex-col gap-2.5">
              {fiches === null && (
                <Patience>
                  <SqueletteLignes nombre={3} />
                </Patience>
              )}
              {fiches?.length === 0 && !erreurFiches && (
                <p className="rounded-xl bg-sombre-carte px-4 py-5 text-sombre-texte-doux">
                  Aucun portfolio en attente — tout est à jour.
                </p>
              )}
              {fiches?.map((fiche) => (
                <button
                  key={fiche.id}
                  type="button"
                  onClick={() => {
                    setFicheOuverte(fiche);
                    setRefusOuvert(null);
                    setMotifsCoches([]);
                    setNoteMotif("");
                  }}
                  className="w-full rounded-xl bg-sombre-carte px-5 py-4 text-left
                             hover:bg-sombre-eleve transition-colors
                             flex items-center justify-between gap-4"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-sombre-texte truncate">
                      {fiche.nom}
                    </span>
                    <span className="block text-[13px] text-sombre-texte-doux truncate">
                      {fiche.ville_nom} · {fiche.styles.length} style
                      {fiche.styles.length > 1 ? "s" : ""}
                      {fiche.cree_le ? ` · reçue le ${dateCourte(fiche.cree_le)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 flex flex-wrap items-center justify-end gap-2.5">
                    {/*  UNE FICHE D'ADMINISTRATEUR SE DIT (nº 152) :
                         elle n'arrive dans cette file QUE pour une
                         modification — sa création, elle, se publie
                         d'un interrupteur dans le démarchage. */}
                    {fiche.fiche_admin && (
                      <span className="rounded-full bg-sombre-eleve px-2.5 min-h-[24px] inline-flex items-center text-[12px] font-medium text-sombre-texte-doux">
                        Portfolio d&apos;administrateur
                      </span>
                    )}
                    {fiche.modification && (
                      <span className="rounded-full bg-primaire-voile px-2.5 min-h-[24px] inline-flex items-center text-[12px] font-medium text-sombre-texte">
                        Modification d&apos;un portfolio en ligne
                      </span>
                    )}
                    <span className="text-[13px] font-semibold text-primaire">
                      Vérifier →
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {section === "fiches" && ficheOuverte && (
          <>
            <button
              type="button"
              onClick={() => setFicheOuverte(null)}
              className="text-[13.5px] text-sombre-texte-doux hover:text-primaire transition-colors"
            >
              ← Retour à la liste
            </button>
            <h1 className="mt-2 text-[22px] font-bold text-sombre-texte">
              {ficheOuverte.nom}
            </h1>
            <p className="mt-1 text-[14px] text-sombre-texte-doux">
              {ficheOuverte.adresse ? `${ficheOuverte.adresse}, ` : ""}
              {ficheOuverte.code_postal} {ficheOuverte.ville_nom}
              {ficheOuverte.compte ? ` · ${ficheOuverte.compte}` : ""}
            </p>

            {/*  CE QUI A CHANGÉ (passe nº 152) — sur une MODIFICATION,
                 l'écran montre déjà la version modifiée ; ce bandeau
                 dit OÙ REGARDER. Sans lui, relire une fiche entière
                 pour un lien TikTok corrigé décourage la relecture, et
                 c'est ainsi qu'une file d'attente s'allonge.
                 Une fiche d'administrateur le rappelle ici aussi : elle
                 n'est dans cette file QUE pour sa modification. */}
            {ficheOuverte.modification && (
              <div className="mt-3 rounded-xl bg-sombre-carte px-4 py-3">
                <p className="text-[13px] font-semibold text-sombre-texte">
                  Modification d&apos;une fiche déjà en ligne
                  {ficheOuverte.fiche_admin
                    ? " (portfolio d'administrateur)"
                    : ""}
                </p>
                {ficheOuverte.champs_modifies?.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {ficheOuverte.champs_modifies.map((champ) => (
                      <li
                        key={champ}
                        className="rounded-full bg-primaire-voile px-2.5 min-h-[26px]
                                   inline-flex items-center text-[12.5px] text-sombre-texte"
                      >
                        {champ}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-[13px] text-sombre-texte-doux">
                    Aucun champ public ne diffère — la modification porte
                    sur des éléments écrits directement (photos, modes
                    d&apos;exercice, adresses).
                  </p>
                )}
                <p className="mt-2 text-[13px] leading-relaxed text-sombre-texte-doux">
                  La version publique n&apos;a pas bougé : elle attend
                  cette décision. « Valider » la remplace par ce qui est
                  affiché ci-dessous.
                </p>
              </div>
            )}

            {/* Les liens — CLIQUABLES, nouvel onglet. */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
              <a href={ficheOuverte.lien_instagram} target="_blank" rel="noopener noreferrer" className="text-primaire hover:underline underline-offset-4">
                Instagram ↗
              </a>
              {ficheOuverte.lien_tiktok && (
                <a href={ficheOuverte.lien_tiktok} target="_blank" rel="noopener noreferrer" className="text-primaire hover:underline underline-offset-4">
                  TikTok ↗
                </a>
              )}
              {ficheOuverte.site_web && (
                <a href={ficheOuverte.site_web} target="_blank" rel="noopener noreferrer" className="text-primaire hover:underline underline-offset-4">
                  Site web ↗
                </a>
              )}
            </div>

            {ficheOuverte.bio && (
              <p className="mt-4 max-w-[640px] rounded-lg bg-sombre-carte px-4 py-3 text-[14.5px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
                {ficheOuverte.bio}
              </p>
            )}

            {/* Les filtres cochés. */}
            {(ficheOuverte.filtres_technique?.length ||
              ficheOuverte.filtres_composition?.length) ? (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {[
                  ...(ficheOuverte.filtres_technique ?? []),
                  ...(ficheOuverte.filtres_composition ?? []),
                ].map((slug) => (
                  <li
                    key={slug}
                    className="rounded-full bg-sombre-carte px-2.5 min-h-[26px]
                               inline-flex items-center text-[12.5px] text-sombre-texte-doux"
                  >
                    {libelleFiltre(slug)}
                  </li>
                ))}
              </ul>
            ) : null}

            {/* CHAQUE PHOTO, avec son style. */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Object.entries(ficheOuverte.photos_styles ?? {}).map(
                ([slug, url]) => (
                  <figure key={slug} className="min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        photos envoyées par les tatoueurs (adresses
                        Supabase Storage), affichées telles quelles. */}
                    <img
                      src={url}
                      alt={`Photo du style ${libelleStyle(slug)}`}
                      className="w-full aspect-[4/5] object-cover rounded-lg"
                    />
                    <figcaption className="mt-1 text-[12.5px] text-sombre-texte-doux">
                      {libelleStyle(slug)}
                    </figcaption>
                  </figure>
                )
              )}
            </div>

            {erreurFiches && (
              <p className={`mt-4 ${ERREUR}`}>{erreurFiches}</p>
            )}

            {/* LES ACTIONS. La capsule ROSE PLEINE est réservée à celle
                qui conclut — publier ; les intermédiaires gardent leur
                capsule naturelle, et METTRE HORS LIGNE, qui retire une
                fiche du public, s'écrit en TEXTE BRUT (charte : une
                action négative ne porte jamais de capsule). */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => decider("valider")}
                disabled={envoiDecision}
                className="inline-flex items-center justify-center rounded-full px-7 min-h-[48px]
                           bg-primaire hover:bg-primaire-fonce text-white font-semibold
                           transition-colors disabled:opacity-60"
              >
                {ficheOuverte.modification
                  ? "Valider — publier la modification"
                  : "Valider — publier le portfolio"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setRefusOuvert((etat) =>
                    etat === "modifier" ? null : "modifier"
                  )
                }
                aria-expanded={refusOuvert === "modifier"}
                className="inline-flex items-center justify-center rounded-full px-7 min-h-[48px]
                           bg-sombre-eleve text-sombre-texte
                           hover:bg-sombre-eleve-clair transition-colors"
              >
                Demander des modifications
              </button>

              {/* ROUVRIR LE BLOC 1 — la seule action qui défait un
                  choix du tatoueur. Elle vit donc à part, en dernier,
                  et se nomme pour ce qu'elle est. La base n'accepte
                  ce déblocage que par cette route (clé de service), et
                  elle en garde la trace : qui, et quand. */}
              <button
                type="button"
                onClick={deverrouillerExercice}
                disabled={envoiDecision}
                className="inline-flex items-center justify-center rounded-full px-7 min-h-[48px]
                           bg-sombre-eleve text-sombre-texte-doux
                           hover:bg-sombre-eleve-clair
                           transition-colors disabled:opacity-60"
              >
                Rouvrir le premier bloc (artiste / studio)
              </button>

              {/*  METTRE HORS LIGNE — la sanction. Elle DÉPUBLIE la
                   fiche (elle quitte la recherche et les pages
                   publiques) sans toucher au compte : le tatoueur garde
                   son espace pour corriger. Elle exige les mêmes motifs
                   que le refus, et prévient par la même notification.
                   TEXTE BRUT, en dernier : c'est la règle des actions
                   négatives, et sa place dit son poids. */}
              <button
                type="button"
                onClick={() =>
                  setRefusOuvert((etat) =>
                    etat === "hors_ligne" ? null : "hors_ligne"
                  )
                }
                aria-expanded={refusOuvert === "hors_ligne"}
                className="inline-flex items-center justify-center px-2 min-h-[48px]
                           text-[14.5px] font-semibold text-sombre-texte-doux
                           hover:text-erreur transition-colors"
              >
                Mettre le portfolio hors ligne
              </button>

              {/*  ██ §1 (nº 675) — SUPPRIMER LA DEMANDE ██
                   ======================================================
                   CE QU'ELLE EST, ET ELLE N'A PAS D'ÉQUIVALENT ICI : les
                   trois décisions ci-dessus MODIFIENT le portfolio — la
                   ligne reste, le tatoueur la garde. Celle-ci l'EFFACE,
                   avec ses photos. Le propriétaire la demande pour un
                   cas précis : un FAUX COMPTE, un portfolio qui n'aurait
                   jamais dû être déposé.
                   ELLE EST DONC LA DERNIÈRE, EN TEXTE BRUT ET EN ROUGE :
                   la règle des actions négatives (aucune capsule), et sa
                   place dit son poids. C'est la seule du site à porter
                   le rouge AU REPOS — parce qu'elle est la seule qui
                   détruise.
                   ⚠️ ELLE DEMANDE CONFIRMATION, et c'est le seul endroit
                   de cet écran qui le fasse : rien ne rattrape un
                   effacement.
                   ██ §2 (nº 688) — ET CE N'EST PLUS LE `confirm` DU
                   NAVIGATEUR ██
                   La note d'origine le jugeait suffisant — « une fenêtre
                   de plus, pour un geste qui doit rester rare, serait du
                   décor ». LE PROPRIÉTAIRE A SUPPRIMÉ LA MAUVAISE
                   DEMANDE avec, et cette phrase est donc annulée : un
                   `confirm` ne nomme rien, se valide d'un réflexe et se
                   confond avec dix autres. La fenêtre du site le
                   remplace — elle NOMME le portfolio et ses photos, DIT
                   que c'est définitif, et fait TAPER le mot. La note du
                   §2, en tête du composant, dit pourquoi c'est celle-là
                   et pas une neuve.
                   ⚠️ LE COMPTE N'EST PAS TOUCHÉ : la personne garde son
                   espace, ses favoris, ses suivis, et retrouve son
                   identité de particulier au premier chargement (la
                   règle de la nº 675). */}
              <button
                type="button"
                onClick={() => {
                  setSaisieSuppression("");
                  setSuppressionOuverte(true);
                }}
                disabled={envoiDecision}
                className="inline-flex items-center justify-center px-2 min-h-[48px]
                           text-[14.5px] font-semibold text-erreur
                           hover:text-sombre-texte transition-colors
                           disabled:opacity-60"
              >
                Supprimer la demande
              </button>
            </div>

            {/* LE MOTIF — obligatoire pour les DEUX décisions qui
                rendent la main (demander des modifications) ou
                dépublient (mettre hors ligne). Un seul panneau : c'est
                le bouton qui l'a ouvert qui dit ce que fera l'envoi. */}
            {refusOuvert && (
              <div className="mt-4 max-w-[560px] rounded-xl bg-sombre-carte p-5">
                <p className="text-[14px] font-semibold text-sombre-texte">
                  {refusOuvert === "hors_ligne"
                    ? "Pourquoi ce portfolio quitte-t-il le site ?"
                    : "Pourquoi ?"}
                </p>
                <div className="mt-3 flex flex-col gap-1">
                  {MOTIFS_MODERATION.map((motif) => (
                    <label
                      key={motif.slug}
                      className="flex items-center gap-2.5 min-h-[34px] text-[14.5px] text-sombre-texte cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={motifsCoches.includes(motif.slug)}
                        onChange={() =>
                          setMotifsCoches((courants) =>
                            courants.includes(motif.slug)
                              ? courants.filter((m) => m !== motif.slug)
                              : [...courants, motif.slug]
                          )
                        }
                        className="w-4 h-4 accent-(--rw-primaire)"
                      />
                      {motif.label}
                    </label>
                  ))}
                </div>
                {autreCoche && (
                  <textarea
                    value={noteMotif}
                    onChange={(e) => setNoteMotif(e.target.value)}
                    rows={3}
                    maxLength={600}
                    placeholder="Précise en quelques mots…"
                    aria-label="Préciser le motif"
                    className={`mt-3 py-3 text-[14.5px] resize-y ${CHAMP}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => decider(refusOuvert)}
                  disabled={!refusPret || envoiDecision}
                  className="mt-4 inline-flex items-center justify-center rounded-full px-6 min-h-[46px]
                             bg-erreur text-white font-semibold transition-opacity
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {envoiDecision
                    ? "Envoi…"
                    : refusOuvert === "hors_ligne"
                      ? "Retirer le portfolio du site"
                      : "Envoyer la demande"}
                </button>
              </div>
            )}

            {/* ---------- §2 (nº 688) — LA FENÊTRE « TAPER SUPPRIMER »
                 ----------
                 L'ÉCRITURE EST CELLE DE BlocPortfolio, au caractère :
                 mêmes classes, même champ, mêmes deux boutons, même
                 voile cliquable pour annuler. Ce qui diffère est le
                 TEXTE, et rien d'autre — c'est la consigne du
                 propriétaire (nommer, avertir, faire taper).
                 ⚠️ ELLE NE VIT QUE DANS CE BLOC, donc `ficheOuverte`
                 n'est jamais nul ici : pas de garde à écrire, pas de
                 fenêtre orpheline possible.
                 ⚠️ PAS DE PORTAIL, ET C'EST VOULU : l'écran
                 d'administration n'a ni barre fixe floutée ni racine
                 d'arrière-plan — le `fixed inset-0` suffit, et un
                 portail n'apporterait ici qu'une indirection. */}
            {suppressionOuverte && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Supprimer la demande"
                className="fixed inset-0 z-[80] flex items-center justify-center p-4"
              >
                <button
                  type="button"
                  aria-label="Annuler"
                  onClick={() => setSuppressionOuverte(false)}
                  className="absolute inset-0 bg-black/25 cursor-default
                             opacity-100 transition-opacity duration-200 starting:opacity-0"
                />
                <div
                  className="relative w-full max-w-[380px] rounded-xl
                             bg-sombre-carte p-5
                             shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
                >
                  <h2 className="text-[17px] font-bold text-sombre-texte">
                    Supprimer «&nbsp;{ficheOuverte.nom}&nbsp;»&nbsp;?
                  </h2>
                  {/*  CE QUI PART, NOMMÉ. Le nombre de photos vient du
                       serveur (§2 nº 688, route des fiches) : il compte
                       des ADRESSES DISTINCTES, galerie comprise.
                       ⚠️ QUAND LE SERVEUR NE LE SAIT PAS — réponse
                       d'avant cette passe, table des photos absente —
                       on ne devine pas : la phrase le dit. */}
                  <p className="mt-2 text-[13.5px] leading-relaxed text-sombre-texte-doux">
                    {typeof ficheOuverte.photos_total === "number"
                      ? `Ce portfolio et ses ${ficheOuverte.photos_total} photo${
                          ficheOuverte.photos_total > 1 ? "s" : ""
                        } seront effacés.`
                      : "Ce portfolio et toutes ses photos seront effacés (nombre de photos inconnu)."}{" "}
                    <span className="font-semibold text-erreur">
                      Immédiat et définitif — aucune récupération possible.
                    </span>{" "}
                    Le compte de la personne, lui, n&apos;est pas supprimé.
                  </p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-sombre-texte-doux">
                    Pour confirmer, tape{" "}
                    <span className="font-bold text-erreur">SUPPRIMER</span>{" "}
                    ci-dessous.
                  </p>
                  <input
                    type="text"
                    value={saisieSuppression}
                    onChange={(evenement) =>
                      setSaisieSuppression(evenement.target.value)
                    }
                    placeholder="SUPPRIMER"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-label="Tape SUPPRIMER pour confirmer"
                    className="mt-4 w-full min-h-[48px] rounded-lg border border-transparent
                               bg-sombre-eleve-clair px-4 text-base tracking-wide text-sombre-texte
                               placeholder:text-sombre-texte-doux/50 outline-none
                               transition-colors focus:bg-sombre-haut"
                  />
                  {/* RÈGLE DES BOUTONS (passe nº 112) : l'action porte
                      une capsule à sa mesure, le retrait est un texte
                      nu. */}
                  <div className="mt-4 flex items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setSuppressionOuverte(false)}
                      className="px-2 min-h-[44px] text-[14px] font-semibold
                                 text-sombre-texte-doux transition-colors
                                 hover:text-sombre-texte"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={!suppressionConfirmee || envoiDecision}
                      onClick={() => void decider("supprimer")}
                      className="inline-flex items-center rounded-full bg-erreur px-6
                                 min-h-[46px] font-semibold text-white transition-opacity
                                 hover:opacity-90 disabled:cursor-not-allowed
                                 disabled:opacity-40"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {section === "signalements" && (
          <>
            <h1 className="text-[22px] font-bold text-sombre-texte">
              Signalements
            </h1>
            {erreurSignalements && (
              <p className={`mt-4 ${ERREUR}`}>{erreurSignalements}</p>
            )}
            <div className="mt-5 flex flex-col gap-2.5">
              {signalements === null && (
                <Patience>
                  <SqueletteLignes nombre={3} />
                </Patience>
              )}
              {signalements?.length === 0 && !erreurSignalements && (
                <p className="rounded-xl bg-sombre-carte px-4 py-5 text-sombre-texte-doux">
                  Aucun signalement — tant mieux.
                </p>
              )}
              {signalements?.map((s) => (
                <article
                  key={s.id}
                  className={`rounded-xl px-5 py-4 ${
                    s.traite
                      ? "bg-sombre-carte/50 opacity-70"
                      : "bg-sombre-carte"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-sombre-texte">
                      <Link
                        href={`/tatoueur/${s.tatoueur_slug}`}
                        target="_blank"
                        className="hover:text-primaire transition-colors"
                      >
                        /tatoueur/{s.tatoueur_slug} ↗
                      </Link>
                    </p>
                    <p className="text-[12.5px] text-sombre-texte-doux">
                      {dateCourte(s.cree_le)}
                      {s.traite ? " · archivé" : ""}
                    </p>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {s.motifs.map((m) => (
                      <li
                        key={m}
                        className="rounded-full bg-erreur/15 text-erreur px-2.5 min-h-[24px]
                                   inline-flex items-center text-[12.5px] font-medium"
                      >
                        {libelleSignalement(m)}
                      </li>
                    ))}
                  </ul>
                  {s.details && (
                    <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
                      {s.details}
                    </p>
                  )}

                  {/* LA NOTE DE TRAITEMENT — écrite ici, RELUE ici,
                      avant comme après archivage. */}
                  {s.note && noteEnCours?.id !== s.id && (
                    <p className="mt-3 rounded-lg bg-sombre-eleve px-3.5 py-2.5 text-[13.5px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
                      <span className="block text-[11.5px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                        Note
                      </span>
                      {s.note}
                    </p>
                  )}
                  {noteEnCours?.id === s.id ? (
                    <div className="mt-3">
                      <textarea
                        value={noteEnCours.texte}
                        onChange={(e) =>
                          setNoteEnCours({ id: s.id, texte: e.target.value })
                        }
                        rows={3}
                        maxLength={600}
                        placeholder="Ce que tu as constaté, ce que tu as fait…"
                        aria-label="Note de traitement"
                        className={`py-2.5 text-[14px] resize-y ${CHAMP}`}
                      />
                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={enregistrerNote}
                          className="rounded-full bg-sombre-eleve hover:bg-sombre-eleve-clair px-4 min-h-[36px]
                                     text-[13.5px] font-semibold text-sombre-texte transition-colors"
                        >
                          Enregistrer la note
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteEnCours(null)}
                          className="text-[13.5px] text-sombre-texte-doux hover:text-sombre-texte transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setNoteEnCours({ id: s.id, texte: s.note ?? "" })
                        }
                        className="text-[13.5px] font-semibold text-sombre-texte-doux
                                   hover:text-primaire transition-colors"
                      >
                        {s.note ? "Modifier la note" : "Ajouter une note"}
                      </button>
                      {!s.traite && (
                        <button
                          type="button"
                          onClick={() => archiverSignalement(s.id)}
                          className="text-[13.5px] font-semibold text-sombre-texte-doux
                                     hover:text-primaire transition-colors"
                        >
                          Archiver ce signalement
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}

        {/* ================================================================
         * LES SUGGESTIONS DE STYLES (passe nº 122)
         * ================================================================
         * ⚠️ ACCEPTER ICI AJOUTE UN STYLE AU SITE. Ce n'est pas une
         * validation de plus : la ligne acceptée EST le style — il
         * apparaît dans la fenêtre du formulaire, dans le menu Explorer,
         * et prend sa place à sa lettre. D'où les deux décisions à
         * prendre avant de valider :
         *  · LE NOM. Celui du tatoueur est prérempli, jamais imposé —
         *    « tribal maori » devient « Maori » si c'est ça, le style.
         *    Le slug de l'adresse en découle, et ne se saisit pas.
         *  · LE RANGEMENT. La liste principale, ou le sous-menu
         *    « Cultures du monde ».
         * ============================================================== */}
        {section === "styles" && (
          <>
            <h1 className="text-[22px] font-bold text-sombre-texte">
              Suggestions de styles
            </h1>
            {erreurSuggestions && (
              <p className={`mt-4 ${ERREUR}`}>{erreurSuggestions}</p>
            )}
            <div className="mt-5 flex flex-col gap-2.5">
              {suggestions === null && (
                <Patience>
                  <SqueletteLignes nombre={3} />
                </Patience>
              )}
              {suggestions?.length === 0 && !erreurSuggestions && (
                <p className="rounded-xl bg-sombre-carte px-4 py-5 text-sombre-texte-doux">
                  Aucune suggestion pour l&apos;instant.
                </p>
              )}
              {suggestions?.map((demande) => {
                const enAttente = demande.etat === "en_attente";
                const ouvert = brouillon?.id === demande.id;
                return (
                  <article
                    key={demande.id}
                    className={`rounded-xl px-5 py-4 ${
                      enAttente
                        ? "bg-sombre-carte"
                        : "bg-sombre-carte/50 opacity-80"
                    }`}
                  >
                    {/* LE STYLE PROPOSÉ, LE DEMANDEUR, LA DATE */}
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-[17px] font-bold text-sombre-texte [overflow-wrap:anywhere]">
                        {demande.propose}
                      </p>
                      <p className="text-[12.5px] text-sombre-texte-doux">
                        {dateCourte(demande.cree_le)}
                      </p>
                    </div>
                    <p className="mt-1 text-[13px] text-sombre-texte-doux [overflow-wrap:anywhere]">
                      {[demande.courriel ?? "compte supprimé", demande.fiche_nom]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {/* ⚠️ LE LIEN VERS SA FICHE (passe nº 123). Un nom
                        de style ne dit rien du travail de celui qui le
                        propose : « Sumi-e » se juge en regardant son
                        portfolio, pas son adresse de courriel. Nouvel
                        onglet — on ne quitte pas la liste en cours.
                        Absent quand le compte n'a aucune fiche : un
                        lien mort serait pire que pas de lien. */}
                    {demande.fiche_slug && (
                      <p className="mt-1">
                        <Link
                          href={`/tatoueur/${demande.fiche_slug}`}
                          target="_blank"
                          className="text-[13px] font-semibold text-sombre-texte
                                     underline underline-offset-2
                                     transition-colors hover:text-primaire"
                        >
                          Voir son portfolio ↗
                        </Link>
                      </p>
                    )}

                    {/* CE QUI A DÉJÀ ÉTÉ DÉCIDÉ */}
                    {!enAttente && (
                      <div className="mt-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 min-h-[24px]
                                      text-[12.5px] font-medium ${
                                        demande.etat === "acceptee"
                                          ? "bg-[#34D399]/15 text-[#34D399]"
                                          : "bg-erreur/15 text-erreur"
                                      }`}
                        >
                          {demande.etat === "acceptee"
                            ? `Ajouté — ${demande.label} (/${demande.slug})`
                            : "Refusé"}
                        </span>
                        {demande.famille && (
                          //  LE NOM DE LA FAMILLE, LU À SA SOURCE
                          //  (nº 239-§2) : il était écrit en dur, et
                          //  aurait survécu au renommage.
                          <span className="ml-2 text-[12.5px] text-sombre-texte-doux">
                            {famillesStyles().find(
                              (famille) => famille.slug === demande.famille
                            )?.label ?? demande.famille}
                          </span>
                        )}
                        {demande.message && (
                          <p className="mt-2 text-[13.5px] leading-relaxed text-sombre-texte whitespace-pre-line [overflow-wrap:anywhere]">
                            {demande.message}
                          </p>
                        )}

                        {/* ⚠️ RETIRER UN STYLE ACCEPTÉ (passe nº 123).
                            Cette manœuvre se faisait en SQL — une
                            requête à écrire à la main pour défaire une
                            validation trop rapide. Elle tient
                            maintenant sur la ligne du style.
                            CE N'EST PAS UNE DÉCISION SUR UNE DEMANDE :
                            aucun message, aucune notification (voir la
                            route). Texte brut rouge, comme toute action
                            qui détruit — et une confirmation, parce
                            qu'un style retiré disparaît des portfolios
                            qui l'affichaient. */}
                        {demande.etat === "acceptee" &&
                          (aRetirer === demande.id ? (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[13.5px] font-semibold text-sombre-texte">
                                Retirer ce style de la liste&nbsp;?
                              </p>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setARetirer(null)}
                                  className="px-2 min-h-[38px] text-[13.5px] font-semibold
                                             text-sombre-texte-doux transition-colors
                                             hover:text-sombre-texte"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void retirerLeStyle(demande.id)}
                                  disabled={envoiSuggestion}
                                  className="px-2 min-h-[38px] text-[13.5px] font-semibold
                                             text-erreur transition-opacity
                                             hover:opacity-75 disabled:opacity-40"
                                >
                                  {envoiSuggestion ? "Retrait…" : "Retirer"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setARetirer(demande.id)}
                              className="mt-3 px-2 min-h-[38px] -ml-2 text-[13.5px]
                                         font-semibold text-erreur transition-opacity
                                         hover:opacity-75"
                            >
                              Retirer le style
                            </button>
                          ))}
                      </div>
                    )}

                    {/* LES DEUX PORTES — ouvertes seulement en attente */}
                    {enAttente && !ouvert && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setBrouillon({
                              id: demande.id,
                              decision: "accepter",
                              label: demande.propose,
                              famille: null,
                              message: "",
                            })
                          }
                          className="min-h-[40px] rounded-full bg-sombre-eleve px-4
                                     text-[14px] font-semibold text-sombre-texte
                                     transition-colors hover:bg-sombre-eleve-clair"
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setBrouillon({
                              id: demande.id,
                              decision: "refuser",
                              label: demande.propose,
                              famille: null,
                              message: "",
                            })
                          }
                          //  Refuser : action négative — texte brut,
                          //  jamais de capsule (règle des boutons).
                          className="px-2 min-h-[40px] text-[14px] font-semibold
                                     text-erreur transition-opacity hover:opacity-75"
                        >
                          Refuser
                        </button>
                      </div>
                    )}

                    {/* LE PANNEAU DE DÉCISION */}
                    {ouvert && brouillon && (
                      <div className="mt-4 flex flex-col gap-3">
                        {brouillon.decision === "accepter" && (
                          <>
                            <label className="flex flex-col gap-1.5">
                              <span className="text-[12.5px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                                Nom du style
                              </span>
                              <input
                                type="text"
                                value={brouillon.label}
                                maxLength={40}
                                onChange={(e) =>
                                  setBrouillon({
                                    ...brouillon,
                                    label: e.target.value,
                                  })
                                }
                                className={`min-h-[48px] text-[15px] ${CHAMP}`}
                              />
                            </label>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[12.5px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                                Où le ranger
                              </span>
                              <div
                                role="radiogroup"
                                aria-label="Où ranger le style"
                                className="flex flex-wrap gap-2"
                              >
                                {/*  ⚠️ LES FAMILLES VIENNENT DE LEUR
                                     SOURCE UNIQUE (nº 239-§2) : elles
                                     étaient RECOPIÉES ici, slug et
                                     libellé en dur. Deux listes
                                     divergent toujours — celle-ci
                                     aurait annoncé « Traditionnel
                                     ethnique » après le renommage,
                                     tout en écrivant le bon slug.
                                     Ajouter une famille au site ne
                                     demande plus de toucher cet
                                     écran. */}
                                {[
                                  { valeur: null, libelle: "Liste principale" },
                                  ...famillesStyles().map((famille) => ({
                                    valeur: famille.slug as string | null,
                                    libelle: famille.label,
                                  })),
                                ].map((choix) => {
                                  const actif = brouillon.famille === choix.valeur;
                                  return (
                                    <button
                                      key={choix.libelle}
                                      type="button"
                                      role="radio"
                                      aria-checked={actif}
                                      onClick={() =>
                                        setBrouillon({
                                          ...brouillon,
                                          famille: choix.valeur,
                                        })
                                      }
                                      //  LE ROSE MARQUE LE CHOISI — c'est
                                      //  exactement ce que la charte lui
                                      //  réserve (badge sélectionné).
                                      className={`min-h-[38px] rounded-full px-4 text-[13.5px]
                                                  font-semibold transition-colors ${
                                                    actif
                                                      ? "bg-primaire text-white"
                                                      : "bg-sombre-eleve text-sombre-texte hover:bg-sombre-eleve-clair"
                                                  }`}
                                    >
                                      {choix.libelle}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                        <label className="flex flex-col gap-1.5">
                          <span className="text-[12.5px] font-semibold uppercase tracking-wide text-sombre-texte-doux">
                            Message au tatoueur (facultatif)
                          </span>
                          <textarea
                            value={brouillon.message}
                            rows={3}
                            maxLength={600}
                            onChange={(e) =>
                              setBrouillon({
                                ...brouillon,
                                message: e.target.value,
                              })
                            }
                            className={`py-2.5 text-[14px] leading-relaxed ${CHAMP}`}
                          />
                        </label>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setBrouillon(null)}
                            className="px-2 min-h-[40px] text-[14px] font-semibold
                                       text-sombre-texte-doux transition-colors
                                       hover:text-sombre-texte"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={() => void deciderSuggestion()}
                            disabled={
                              envoiSuggestion ||
                              (brouillon.decision === "accepter" &&
                                brouillon.label.trim().length < 2)
                            }
                            //  L'ACTION FINALE DE CET ÉCHANGE : capsule
                            //  pleine, rose pour l'ajout — rouge pour le
                            //  refus, qui reste un texte brut.
                            className={
                              brouillon.decision === "accepter"
                                ? `min-h-[40px] rounded-full bg-primaire px-5 text-[14px]
                                   font-semibold text-white transition-opacity
                                   hover:opacity-90 disabled:opacity-40`
                                : `px-2 min-h-[40px] text-[14px] font-semibold text-erreur
                                   transition-opacity hover:opacity-75 disabled:opacity-40`
                            }
                          >
                            {envoiSuggestion
                              ? "Envoi…"
                              : brouillon.decision === "accepter"
                                ? "Ajouter le style"
                                : "Refuser la demande"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* ================================================================
         * LE DÉMARCHAGE — le tableau, et le message qu'il produit
         * ================================================================
         * Il REMPLACE « Mes fiches d'essai » (passe nº 135). Tout vit
         * dans son propre composant : le tableau, la sélection
         * multiple, l'interrupteur « Rendre publique », les envois
         * fusionnés, et l'écran du message prêt à copier.
         * ============================================================== */}
        {section === "demarchage" && <AdminDemarchage />}
      </section>
    </main>
  );
}
