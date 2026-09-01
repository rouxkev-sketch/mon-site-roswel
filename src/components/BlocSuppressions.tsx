"use client";

import { useCallback, useEffect, useState } from "react";
import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import { declarerDepartVouluVersLAccueil } from "@/lib/navigation-session";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import {
  chargerFichesDuCompte,
  type FicheDuCompte,
} from "@/lib/fiches-compte";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { Patience, SqueletteLignes } from "@/components/Squelette";
//  §1 (nº 785) — la pastille de bout de ligne, partagée avec la page
//  « Sécurité » : le propriétaire les veut identiques.
import { PastilleAction } from "@/components/Pastille";

/**
 * LES SUPPRESSIONS — en bas de la page Sécurité
 * =====================================================
 * DEUX ACTIONS, et il ne faut jamais les confondre :
 *
 *  1. SUPPRIMER UNE FICHE — on choisit LAQUELLE. Elle disparaît du
 *     public tout de suite ; l'effacement définitif attend 30 jours.
 *     ⚠️ LA MODIFIER N'ANNULE PLUS RIEN (passe nº 133) : la
 *     suppression se défaisait toute seule au premier enregistrement,
 *     un geste destructeur annulé par un geste anodin, sans que rien
 *     ne le dise. Deux portes désormais, toutes deux explicites :
 *     « Annuler la suppression » ici, ou le bouton « Réactiver mon
 *     portfolio » qui attend sur la fiche désactivée.
 *     Le compte, lui, n'est pas touché : les autres fiches vivent.
 *
 *  2. SUPPRIMER LE COMPTE — le même délai de 30 jours, la même
 *     réactivation automatique à la reconnexion, et il emporte
 *     TOUTES les fiches.
 *
 * TANT QUE LE DÉLAI COURT, « ANNULER LA SUPPRESSION » est visible ici
 * — et une notification en garde la trace. Rien ne se joue en
 * silence.
 *
 * L'ENCADRÉ N'EST PLUS ROUGE (passe nº 129). Il portait un liseré et
 * un fond rouge dilués, une pastille et une corbeille, et deux filets
 * de séparation : beaucoup de signaux pour une zone où l'on ne clique
 * de toute façon rien sans confirmer par écrit. Il prend la robe des
 * autres blocs de la page. Le rouge reste là où il désigne vraiment
 * un geste irréversible : le mot « Supprimer » des boutons, et la
 * fenêtre de confirmation.
 */
export function BlocSuppressions() {
  const { fiches, recharger, chargement } = useFichesDuCompte();

  /** Quelle fiche est en cours de suppression ? (une seule fenêtre à
      la fois — celle de la fiche, ou celle du compte). */
  const [ficheAConfirmer, setFicheAConfirmer] = useState<FicheDuCompte | null>(
    null
  );
  const [compteAConfirmer, setCompteAConfirmer] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");

  /**
   * ██ §2 (nº 784) — UN PORTFOLIO, UNE SEULE MENTION ██
   * ------------------------------------------------------------------
   * LE DÉFAUT DU PROPRIÉTAIRE : une fiche dont la suppression est
   * lancée apparaissait DEUX FOIS — en tête dans son encadré
   * « Suppression définitive le … · Annuler la suppression », et de
   * nouveau plus bas dans la liste des portfolios, avec un bouton
   * « Supprimer » grisé. La seconde ligne ne servait à rien : elle ne
   * disait rien de plus, et son bouton refusait le seul geste qu'il
   * proposait.
   * LA RÈGLE : les deux listes se partagent les fiches au lieu de se
   * les disputer — en haut celles qui s'effacent, en bas celles qu'on
   * PEUT encore effacer. Annuler rend la fiche à la seconde, puisque
   * `purge_le` redevient vide.
   * ⚠️ UNE SEULE SOURCE (piège nº 379) : les deux sortent du même
   * `fiches`, par le même critère lu dans les deux sens. Rien ne peut
   * tomber entre les deux, ni figurer dans les deux.
   */
  const enSuppression = fiches.filter((f) => f.purge_le);
  const encoreSupprimables = fiches.filter((f) => !f.purge_le);

  async function demanderSuppressionFiche(id: string, annuler: boolean) {
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/tatoueur/supprimer-fiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, annuler }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "L'opération n'a pas abouti.");
      }
      setFicheAConfirmer(null);
      setConfirmation("");
      await recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'opération n'a pas abouti.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimerLeCompte() {
    if (confirmation.trim().toUpperCase() !== "SUPPRIMER") return;
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/tatoueur/supprimer-compte", {
        method: "POST",
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "La suppression n'a pas abouti.");
      }
      try {
        await creerClientSupabaseNavigateur().auth.signOut();
      } catch {
        // Session déjà invalide : c'est le but.
      }
      setCompteAConfirmer(false);
      //  §1 (nº 429) — départ voulu vers l'accueil : le filet de
      //  réparation du repli n'a pas à s'en mêler.
      declarerDepartVouluVersLAccueil();
      window.location.assign("/");
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "La suppression n'a pas abouti."
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section>
      {/* PLUS DE CORBEILLE NI DE PHRASE D'INTRODUCTION (nº 129) ; et
          depuis la nº 130 le TITRE VIT AU-DESSUS de l'encadré, comme
          tous ceux de la page — aligné sur le texte de la carte, à la
          grammaire de Section (formulaire, nº 125/128). */}
      <div className="px-4 sm:px-7">
        <h2 className="text-[18px] font-semibold tracking-tight text-sombre-texte">
          Supprimer
        </h2>
      </div>
      {/* UNE SEULE COLONNE, UN SEUL ÉCART (passe nº 134) : 16 px entre
          chaque ligne — exactement la marge qui sépare deux champs du
          bloc « Changer de mot de passe » (gap-4). Les intertitres
          « Supprimer un portfolio » et « Supprimer le compte » ont
          disparu : chaque ligne porte son nom, le titre du bloc suffit. */}
      <div className="mt-3 flex flex-col gap-4 bg-sombre-carte rounded-xl px-4 py-6 sm:px-7 sm:py-7">

      {/* ---------- LES SUPPRESSIONS EN COURS ----------
          En tête, parce que c'est ce qui presse : le délai court.
          SEULES LIGNES À DEUX ÉTAGES : la date de l'effacement
          définitif est une information qu'on ne peut pas taire. */}
      {enSuppression.length > 0 && (
        <div className="flex flex-col gap-4">
          {enSuppression.map((fiche) => (
            <div
              key={fiche.id}
              /*  §1 (nº 785) — LE MÊME AIR QU'AILLEURS : `pl-4 pr-2`,
                  pour que les huit pixels qui restent au-dessus et en
                  dessous de la pastille se retrouvent aussi à sa droite.
                  Voir la note de `Pastille`, où les trois nombres qui se
                  tiennent (54, 38, 8) sont expliqués, et celle de
                  `LIGNE_METHODE` (Securite) pour le retrait vertical et
                  le `flex-wrap` qui sont partis d'ici pour la même
                  raison : ils cassaient l'égalité des trois airs. */
              className="flex items-center gap-x-4
                         rounded-lg bg-sombre-eleve pl-4 pr-2 min-h-[54px]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-sombre-texte">
                  {fiche.nom}
                </span>
                {/*  §1 (nº 785) — « Suppression le … », plus
                     « Suppression DÉFINITIVE le … » (consigne). Le mot
                     alourdissait une ligne qui porte déjà sa date, et
                     ce qu'il ajoutait — que c'est sans retour — est
                     précisément ce que le bouton d'à côté dément tant
                     qu'il est là. */}
                <span className="block text-[12.5px] text-sombre-texte-doux">
                  Suppression le{" "}
                  {new Date(fiche.purge_le as string).toLocaleDateString(
                    "fr-FR"
                  )}
                </span>
              </span>
              {/*  §1 (nº 785) — « Annuler », plus « Annuler la
                   suppression » : la ligne dit déjà de quoi il s'agit.
                   Le titre le redit à qui survole, et aux lecteurs
                   d'écran, pour qui ce mot voyage parfois seul. */}
              <PastilleAction
                disabled={enCours}
                onClick={() => demanderSuppressionFiche(fiche.id, true)}
                titre={`Annuler la suppression de « ${fiche.nom} »`}
              >
                Annuler
              </PastilleAction>
            </div>
          ))}
        </div>
      )}

      {/* ---------- LES PORTFOLIOS QU'ON PEUT ENCORE SUPPRIMER ----------
          LE NOM, ET RIEN D'AUTRE (nº 134) : la pastille et l'état
          (« En validation », « En ligne ») encombraient une ligne dont
          le seul enjeu est DE QUEL portfolio on parle — l'état se lit
          dans le menu « Mon espace ». Chaque ligne prend la hauteur
          des champs du bloc « Méthode de connexion » (54 px).
          §2 (nº 784) — CEUX DONT LA SUPPRESSION EST LANCÉE N'Y SONT
          PLUS : ils vivent dans l'encadré du dessus, qui dit leur date
          et porte leur annulation. Voir la note de `enSuppression`. */}
      {chargement ? (
        //  La silhouette des lignes qui viennent (passe nº 118) —
        //  `eleve` : on est DANS une carte, le ton monte d'un cran.
        <Patience>
          <SqueletteLignes nombre={2} ton="eleve" />
        </Patience>
      ) : encoreSupprimables.length === 0 ? (
        <p className="text-[13px] text-sombre-texte-doux">
          Aucun portfolio à supprimer.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {encoreSupprimables.map((fiche) => (
            <li
              key={fiche.id}
              className="flex items-center gap-x-4
                         rounded-lg bg-sombre-eleve px-4 min-h-[54px]"
            >
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-sombre-texte">
                {fiche.nom}
              </span>
              {/*  §2 (nº 784) — PLUS DE `disabled` ICI : il ne servait
                   qu'aux fiches en cours de suppression, qui ne sont
                   plus dans cette liste. Le garder aurait laissé
                   croire à un cas qui ne peut plus se produire. */}
              <button
                type="button"
                onClick={() => {
                  setErreur(null);
                  setFicheAConfirmer(fiche);
                }}
                className="shrink-0 rounded-full px-4 min-h-[38px] text-[13px] font-semibold
                           text-erreur/85 hover:text-erreur transition-colors"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- LE COMPTE — LA MÊME LIGNE QUE LES PORTFOLIOS ----
          (nº 134) : même encadré, même hauteur, le titre à gauche et
          « Supprimer » à l'opposé. Les deux phrases d'explication ont
          disparu — ce qui se passe (le délai, l'annulation) se lit
          dans la fenêtre de confirmation, au moment où ça compte. */}
      <div
        className="flex items-center gap-x-4
                   rounded-lg bg-sombre-eleve px-4 min-h-[54px]"
      >
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-sombre-texte">
          Supprimer le compte
        </span>
        <button
          type="button"
          onClick={() => {
            setConfirmation("");
            setErreur(null);
            setCompteAConfirmer(true);
          }}
          className="shrink-0 rounded-full px-4 min-h-[38px] text-[13px] font-semibold
                     text-erreur/85 hover:text-erreur transition-colors"
        >
          Supprimer
        </button>
      </div>

      {erreur && (
        <p
          role="alert"
          className="rounded-lg border border-erreur/50 bg-erreur/10
                     px-4 py-3 text-[13px] leading-relaxed text-sombre-texte"
        >
          {erreur}
        </p>
      )}
      </div>

      {/* ---------- LA CONFIRMATION D'UNE FICHE ---------- */}
      {ficheAConfirmer && (
        <FenetreConfirmation
          titre={`Supprimer « ${ficheAConfirmer.nom} » ?`}
          onFermer={() => setFicheAConfirmer(null)}
        >
          {/*  ⚠️ « OU SUR LA FICHE DE TON PORTFOLIO » — PLUS « modifie
               simplement » (passe nº 133) : modifier un portfolio ne
               réactive plus rien. La seule autre porte est le bouton
               « Réactiver mon portfolio », qui attend sur la fiche
               désactivée (voir FormulaireFiche). */}
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Le portfolio disparaît du public tout de suite, et sera
            définitivement supprimé dans {DELAI_SUPPRESSION_JOURS} jours —
            photos comprises.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Tu changes d&apos;avis&nbsp;? Annule ici, ou depuis ton
            portfolio&nbsp;: la suppression s&apos;arrête d&apos;elle-même.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Ton compte et tes autres portfolios ne bougent pas.
          </p>
          {/* LA RÈGLE POSITIF/NÉGATIF (nº 130, comme la fenêtre de
              retour) : l'action de la fenêtre en CAPSULE PLEINE
              LARGEUR — rouge, c'est une destruction — et « Annuler »
              en TEXTE BRUT dessous. Plus de deux capsules côte à
              côte qui se disputaient le geste. */}
          <button
            type="button"
            disabled={enCours}
            onClick={() =>
              demanderSuppressionFiche(ficheAConfirmer.id, false)
            }
            className="mt-6 inline-flex w-full items-center justify-center
                       min-h-[50px] rounded-full bg-erreur text-white
                       font-semibold transition-opacity disabled:opacity-40"
          >
            {enCours ? "Un instant…" : "Supprimer le portfolio"}
          </button>
          <button
            type="button"
            onClick={() => setFicheAConfirmer(null)}
            className="mt-3 inline-flex w-full items-center justify-center
                       min-h-[44px] text-[14px] text-sombre-texte-doux
                       hover:text-sombre-texte transition-colors"
          >
            Annuler
          </button>
        </FenetreConfirmation>
      )}

      {/* ---------- LA CONFIRMATION DU COMPTE — écrire SUPPRIMER ---- */}
      {compteAConfirmer && (
        <FenetreConfirmation
          titre="Supprimer ton compte ?"
          onFermer={() => setCompteAConfirmer(false)}
        >
          {/* TROIS PHRASES COURTES (nº 129) : ce qui se passe, comment
              revenir en arrière, ce qu'il faut taper. Le MÉCANISME ne
              change pas — il faut toujours écrire SUPPRIMER. */}
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Ton compte et tes portfolios seront masqués immédiatement, puis
            supprimés définitivement dans {DELAI_SUPPRESSION_JOURS} jours.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Tu peux annuler en te reconnectant avant ce délai.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Saisis <strong className="text-sombre-texte">SUPPRIMER</strong> pour
            confirmer.
          </p>
          <input
            type="text"
            {...sansRemplissageAuto("confirmation-suppression")}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="SUPPRIMER"
            aria-label="Écris SUPPRIMER pour confirmer"
            className="mt-4 w-full min-h-[48px] rounded-lg border border-transparent
                       bg-sombre-eleve-clair px-4 text-base text-sombre-texte
                       placeholder:text-sombre-texte-doux outline-none
                       transition-colors focus:bg-sombre-haut"
          />
          <button
            type="button"
            onClick={supprimerLeCompte}
            disabled={
              enCours || confirmation.trim().toUpperCase() !== "SUPPRIMER"
            }
            className="mt-6 inline-flex w-full items-center justify-center
                       min-h-[50px] rounded-full bg-erreur text-white
                       font-semibold transition-opacity
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enCours ? "Un instant…" : "Supprimer"}
          </button>
          <button
            type="button"
            onClick={() => setCompteAConfirmer(false)}
            className="mt-3 inline-flex w-full items-center justify-center
                       min-h-[44px] text-[14px] text-sombre-texte-doux
                       hover:text-sombre-texte transition-colors"
          >
            Annuler
          </button>
        </FenetreConfirmation>
      )}
    </section>
  );
}

/** La fenêtre de confirmation — une seule robe pour les deux gestes. */
function FenetreConfirmation({
  titre,
  onFermer,
  children,
}: {
  titre: string;
  onFermer: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      className="fixed inset-0 z-[80] flex items-center justify-center p-5"
    >
      <div
        aria-hidden="true"
        onClick={onFermer}
        className="absolute inset-0 bg-black/80"
      />
      <div className="relative w-full max-w-[440px] rounded-xl bg-sombre-carte p-6 sm:p-7 text-left">
        <h2 className="text-lg font-bold text-sombre-texte">{titre}</h2>
        {children}
      </div>
    </div>
  );
}

/** Les fiches du compte, rechargeables — la liste que les deux
    actions consultent. La lecture est ASYNCHRONE (elle ne pose son
    résultat qu'au retour du serveur) : rien n'est écrit dans le corps
    de l'effet, ce que React déconseille. */
function useFichesDuCompte() {
  const [fiches, setFiches] = useState<FicheDuCompte[]>([]);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    try {
      const supabase = creerClientSupabaseNavigateur();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setFiches([]);
        return;
      }
      setFiches(await chargerFichesDuCompte(supabase, data.user.id));
    } catch {
      setFiches([]);
    } finally {
      setChargement(false);
    }
  }, []);

  // La première lecture, à l'ouverture de la page. On passe par une
  // fonction asynchrone : rien n'est posé dans le corps de l'effet,
  // tout attend la réponse du serveur.
  useEffect(() => {
    let abandonne = false;
    (async () => {
      try {
        const supabase = creerClientSupabaseNavigateur();
        const { data } = await supabase.auth.getUser();
        if (abandonne) return;
        const liste = data.user
          ? await chargerFichesDuCompte(supabase, data.user.id)
          : [];
        if (!abandonne) {
          setFiches(liste);
          setChargement(false);
        }
      } catch {
        if (!abandonne) setChargement(false);
      }
    })();
    return () => {
      abandonne = true;
    };
  }, []);

  return { fiches, recharger, chargement };
}
