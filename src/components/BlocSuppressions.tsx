"use client";

import { useCallback, useEffect, useState } from "react";
import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
//  nº 819 — le bouton des courriels de suppression (`?reactiver=…`).
import {
  CHEMIN_SECURITE,
  PARAM_REACTIVER,
  REACTIVER_COMPTE,
} from "@/lib/reactivation";
//  nº 820 — le départ vers l'accueil (déclaration comprise) vit dans
//  cette écriture-là, partagée avec la déconnexion.
import {
  marquerLeDepartVersLAccueil,
  partirVersLAccueil,
} from "@/lib/depart-accueil";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import {
  chargerFichesDuCompte,
  type FicheDuCompte,
} from "@/lib/fiches-compte";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { Patience, SqueletteLignes } from "@/components/Squelette";
//  §1 (nº 785) — la pastille de bout de ligne, partagée avec la page
//  « Sécurité » : le propriétaire les veut identiques.
import { PastilleAction, TEXTE_BOUT_DE_LIGNE } from "@/components/Pastille";

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
/**
 * ██ LE SURTITRE D'UN GROUPE (passe nº 789) ██
 * ==================================================================
 * La zone « Supprimer » empilait jusqu'à trois sortes d'encadrés sans
 * rien pour les distinguer : ceux qui s'effacent, ceux qu'on peut
 * effacer, et le compte. Trois natures, une seule pile.
 * TROIS SURTITRES les séparent désormais — « EN COURS », « PORTFOLIO »,
 * « COMPTE » —, gris, en majuscules, calés à gauche au-dessus de leur
 * groupe.
 *
 * ⚠️ UN SEUL PAR GROUPE, quel qu'en soit le contenu : « PORTFOLIO »
 * coiffe la pile entière, même à cinq portfolios. Ce n'est pas une
 * étiquette de ligne, c'est un nom de section.
 * ⚠️ UN GROUPE VIDE N'EN PORTE PAS. Ils apparaissent et disparaissent
 * avec ce qu'ils annoncent : lancer la suppression du dernier
 * portfolio fait passer « PORTFOLIO » à « EN COURS », et l'annuler
 * fait l'inverse.
 * ⚠️ UNE SEULE ÉCRITURE (piège nº 378) : trois copies d'un même
 * surtitre finiraient par ne plus se ressembler.
 */
function Surtitre({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-2 px-1 text-[12px] font-semibold uppercase
                 tracking-[0.08em] text-sombre-texte-doux"
    >
      {children}
    </h3>
  );
}

/**
 * ██ §5 (nº 820) — LE ROUGE DE « DELETE », CELUI DE LA CHARTE ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : « le rouge actuel est trop vif, hors
 * charte ». LA CAUSE, NOMMÉE : ces deux liens portaient `text-erreur`
 * — #D32E28, le rouge des messages d'erreur, calculé pour une PAGE
 * BLANCHE (globals.css le dit déjà : « fait pour une page blanche »).
 * Un rouge orangé, étranger au bleu nuit du fond et à la marque.
 * LE REMÈDE : le rouge de la charte, #E11144 (`text-primaire`, la
 * primaire du site) — et le survol de la famille des liens d'action
 * (PastilleAction, nº 815) : une base légèrement retenue qui s'allume
 * au survol, jamais de soulignement. Ici, la retenue est l'opacité
 * (85 %), l'idiome déjà en place sur ces liens ; au survol, le rouge
 * plein, exactement #E11144.
 * ⚠️ UNE SEULE ÉCRITURE POUR LES DEUX LIENS (pièges nº 378/379) : le
 * « Delete » d'un portfolio et celui du compte étaient décrits deux
 * fois, au caractère près. Ils partagent désormais cette constante —
 * ils ne peuvent plus diverger.
 */
const LIEN_SUPPRIMER =
  `shrink-0 rounded-full px-4 min-h-[38px] ${TEXTE_BOUT_DE_LIGNE} ` +
  "text-primaire/85 hover:text-primaire transition-colors";

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
  /** nº 819 — ce qu'une réactivation venue d'un courriel a fait : une
      information sur fond élevé (la règle de la page, nº 134), pas un
      accent. `null` tant qu'aucun lien n'a été suivi. */
  const [message, setMessage] = useState<string | null>(null);

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

  /*  nº 819 — MÉMORISÉE (`useCallback`) ET ELLE DIT SI ELLE A ABOUTI :
      l'effet du lien de réactivation, plus bas, l'appelle une fois au
      montage et a besoin d'une référence stable et d'une réponse. Le
      corps, lui, ne change pas. */
  const demanderSuppressionFiche = useCallback(
    async (id: string, annuler: boolean): Promise<boolean> => {
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
          throw new Error(donnees?.message ?? "The operation failed.");
        }
        setFicheAConfirmer(null);
        setConfirmation("");
        await recharger();
        return true;
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "The operation failed.");
        return false;
      } finally {
        setEnCours(false);
      }
    },
    [recharger]
  );

  /*  ██ nº 819 — LE BOUTON DES COURRIELS DE SUPPRESSION ██
      « Reactivate my account » / « Reactivate my portfolio » mènent ICI
      avec `?reactiver=compte` ou `?reactiver=<identifiant>`
      (lib/reactivation). On joue l'annulation EXISTANTE — la route de
      réactivation du compte (celle de la reconnexion, nº 313), ou la
      suppression de portfolio jouée à l'envers (`annuler: true`, comme
      « Cancel » ci-dessous) — puis on EFFACE le paramètre de l'adresse
      (`replaceState`, que le routeur suit) : un rechargement ne rejoue
      rien. Une seule fois, au montage ; la fonction est stable. */
  useEffect(() => {
    const cible = new URLSearchParams(window.location.search).get(
      PARAM_REACTIVER
    );
    if (!cible) return;
    window.history.replaceState(window.history.state, "", CHEMIN_SECURITE);
    void (async () => {
      if (cible !== REACTIVER_COMPTE) {
        if (await demanderSuppressionFiche(cible, true)) {
          setMessage("Deletion canceled: your portfolio is back as it was.");
        }
        return;
      }
      setEnCours(true);
      setErreur(null);
      try {
        const reponse = await fetch("/api/tatoueur/reactiver", {
          method: "POST",
        });
        const donnees = (await reponse.json().catch(() => null)) as {
          ok?: boolean;
          reactive?: boolean;
        } | null;
        if (!reponse.ok || !donnees?.ok) {
          throw new Error("Reactivation failed. Try again.");
        }
        setMessage(
          donnees.reactive
            ? "Deletion canceled: your account and your portfolios are back as they were."
            : "Your account is active — the deletion is canceled."
        );
      } catch (e) {
        setErreur(
          e instanceof Error ? e.message : "Reactivation failed. Try again."
        );
      } finally {
        setEnCours(false);
      }
    })();
  }, [demanderSuppressionFiche]);

  async function supprimerLeCompte() {
    if (confirmation.trim().toUpperCase() !== "DELETE") return;
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
        throw new Error(donnees?.message ?? "Deletion failed.");
      }
      /*  nº 820 — LE DÉPART EST MARQUÉ AVANT L'EFFACEMENT DE LA
          SESSION : sans cela, la garde de cette page-ci (Securite,
          « plus personne ici → la page de connexion ») se réveille dès
          que la session tombe, et son `router.replace` gagne la course
          contre le chargement de l'accueil — c'est le relevé du
          propriétaire (« après la suppression, j'atterris sur la page
          de connexion »). */
      marquerLeDepartVersLAccueil();
      try {
        await creerClientSupabaseNavigateur().auth.signOut();
      } catch {
        // Session déjà invalide : c'est le but.
      }
      setCompteAConfirmer(false);
      //  §1 (nº 429) — départ voulu vers l'accueil : le filet de
      //  réparation du repli n'a pas à s'en mêler. L'écriture vit
      //  désormais dans lib/depart-accueil, partagée avec la
      //  déconnexion (nº 820).
      partirVersLAccueil();
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Deletion failed."
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
          Delete
        </h2>
      </div>
      {/* UN ÉCART DE LIGNE, UN ÉCART DE SECTION (passe nº 134, revu
          nº 789). Les lignes d'un même groupe gardent leurs 16 px —
          la marge qui sépare deux champs du bloc « Changer de mot de
          passe ». Mais LES GROUPES, eux, prennent 32 px : c'est la
          consigne du propriétaire, « un surtitre ne doit jamais être
          collé à l'encadré du groupe précédent ».
          ⚠️ LE RAPPORT EST CE QUI COMPTE, ET IL EST DE QUATRE POUR UN :
          32 px au-dessus d'un surtitre, 8 px entre lui et son encadré
          (le `mb-2` de `Surtitre`). Un titre doit toucher ce qu'il
          nomme et se détacher de ce qui précède ; l'inverse le
          rattacherait au groupe du dessus.
          Les intertitres en phrase (« Supprimer un portfolio »,
          « Supprimer le compte ») avaient disparu à la nº 134 ; ce qui
          revient n'est pas eux — ce sont des noms de section, en un
          mot, gris et discrets. */}
      <div className="mt-3 flex flex-col gap-8 bg-sombre-carte rounded-xl px-4 py-6 sm:px-7 sm:py-7">

      {/* ---------- LES SUPPRESSIONS EN COURS ----------
          En tête, parce que c'est ce qui presse : le délai court.
          SEULES LIGNES À DEUX ÉTAGES : la date de l'effacement
          définitif est une information qu'on ne peut pas taire. */}
      {enSuppression.length > 0 && (
        <section>
          <Surtitre>In progress</Surtitre>
        <div className="flex flex-col gap-4">
          {enSuppression.map((fiche) => (
            <div
              key={fiche.id}
              /*  §1 (nº 786) — L'AIR DE RÉFÉRENCE DES QUATRE CÔTÉS :
                  `px-4`, soit les 16 px qui séparent le bord gauche du
                  texte. La pastille faisant 28 px dans une ligne de 54
                  (nº 787), il reste 13 px en haut et en bas — l'air
                  droit tient, le vertical se recalcule. Voir la note de
                  `Pastille`, où ces trois nombres vivent, et celle de
                  `LIGNE_METHODE` (Securite) pour le retrait vertical et
                  le `flex-wrap` partis d'ici à la nº 785 : ils cassaient
                  l'égalité des airs.
                  ⚠️ ELLE GARDE SON `pr-4`, contrairement aux lignes de
                  la liste juste en dessous — et depuis la nº 803 CE
                  N'EST PLUS POUR LA MÊME RAISON. « Annuler » était une
                  pastille à fond, dont on voyait le bord : c'était ce
                  bord-là qu'on alignait. Le propriétaire en a fait un
                  LIEN TEXTE, sans fond ni retrait horizontal — c'est
                  donc le `pr-4` de la ligne, et lui seul, qui pose le
                  mot à 16 px du bord. Les lignes de la liste arrivent
                  au même endroit par l'autre chemin (`pr-0` sur la
                  ligne, `px-4` sur le bouton, expliqué là-bas) : les
                  deux listes s'alignent, ce qui est le but. */
              className="flex items-center gap-x-4
                         rounded-lg bg-sombre-eleve px-4 min-h-[54px]"
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
                  Deletion on{" "}
                  {new Date(fiche.purge_le as string).toLocaleDateString(
                    "en-US"
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
                titre={`Cancel the deletion of "${fiche.nom}"`}
              >
                Cancel
              </PastilleAction>
            </div>
          ))}
        </div>
        </section>
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
        //  ⚠️ SANS SURTITRE (nº 789) : on ne nomme pas un groupe dont
        //  on ignore encore le contenu.
        <Patience>
          <SqueletteLignes nombre={2} ton="eleve" />
        </Patience>
      ) : encoreSupprimables.length === 0 ? (
        /*  ██ §1 (nº 789) — LE GROUPE VIDE NE PORTE PAS SON NOM ██
            Consigne : « un groupe vide n'affiche pas son titre ».
            ██ nº 815 — ET IL NE DIT PLUS RIEN DU TOUT ██
            La phrase « No portfolio to delete. » (nº 789) s'affichait
            à un PARTICULIER — un compte qui n'a jamais eu de
            portfolio — comme le constat d'un manque. Décision du
            propriétaire : rien. La zone « Delete » d'un particulier
            commence directement par le surtitre ACCOUNT et l'encadré
            « Delete account ». (La phrase s'effaçait déjà quand le
            dernier portfolio était en cours de suppression.) */
        null
      ) : (
        <section>
          <Surtitre>Portfolio</Surtitre>
        <ul className="flex flex-col gap-4">
          {encoreSupprimables.map((fiche) => (
            <li
              key={fiche.id}
              className="flex items-center gap-x-4
                         rounded-lg bg-sombre-eleve pl-4 pr-0 min-h-[54px]"
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
                className={LIEN_SUPPRIMER}
              >
                Delete
              </button>
              {/*  ⚠️ SON RETRAIT DROIT EST CELUI DE LA LIGNE (nº 786).
                   LE DÉFAUT DU PROPRIÉTAIRE : « trop d'air à leur
                   droite ». La ligne posait 16 px, le bouton 16 de
                   plus — le mot « Supprimer » finissait à 32 px du
                   bord quand le nom, à gauche, en avait 16.
                   LA RÈGLE, ET ELLE NE VAUT QUE POUR UN BOUTON SANS
                   FOND : c'est la ligne qui renonce à son `pr` (elle
                   passe à `pr-0`) et le bouton qui garde le sien. Le
                   TEXTE se retrouve donc à 16 px, et la zone où le
                   doigt peut appuyer va jusqu'au bord — on gagne de la
                   cible au lieu d'en perdre.
                   ⚠️ L'AUTRE LISTE Y ARRIVE AUTREMENT (revu nº 803) :
                   « Annuler » n'a AUCUN retrait horizontal, et c'est
                   le `pr-4` de sa ligne qui le pose à 16 px. Chemin
                   inverse, même bord — c'est ce bord commun qui compte,
                   pas la recette. (Avant la nº 803 « Annuler » était
                   une pastille à fond : on alignait son bord visible.) */}
            </li>
          ))}
        </ul>
        </section>
      )}

      {/* ---------- LE COMPTE — LA MÊME LIGNE QUE LES PORTFOLIOS ----
          (nº 134) : même encadré, même hauteur, le titre à gauche et
          « Supprimer » à l'opposé. Les deux phrases d'explication ont
          disparu — ce qui se passe (le délai, l'annulation) se lit
          dans la fenêtre de confirmation, au moment où ça compte. */}
      <section>
        {/*  §1 (nº 789) — CELUI-CI NE DISPARAÎT JAMAIS : il n'y a qu'un
             compte, et il est toujours là. Les deux autres surtitres
             vont et viennent avec leur contenu ; celui-ci est le seul
             qui ne dépende de rien. */}
        {/*  nº 815 — « Account », plus « Compte » : le seul mot
             français resté à l'écran dans cette zone (un mot seul,
             invisible au recenseur). Relevé en corrigeant le point 6. */}
        <Surtitre>Account</Surtitre>
      <div
        className="flex items-center gap-x-4
                   rounded-lg bg-sombre-eleve pl-4 pr-0 min-h-[54px]"
      >
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-sombre-texte">
          Delete account
        </span>
        <button
          type="button"
          onClick={() => {
            setConfirmation("");
            setErreur(null);
            setCompteAConfirmer(true);
          }}
          className={LIEN_SUPPRIMER}
        >
          Delete
        </button>
      </div>
      </section>

      {/*  §A3 (nº 788) — CE PAVÉ ROUGE-CI RESTE, ET C'EST VOULU : il ne
           reproche rien à un champ, il annonce qu'une OPÉRATION a
           échoué (le serveur n'a pas répondu, la suppression n'a pas
           abouti). Le standard de la nº 788 vise les erreurs de SAISIE,
           qui ont un champ à désigner ; celle-ci n'en a aucun. */}
      {/*  nº 819 — ce que le lien d'un courriel de suppression a fait :
           une information sur fond élevé (la règle de la page Sécurité,
           nº 134 / nº 788 — mêmes classes que son `MESSAGE`, qu'on ne
           peut pas importer d'ici sans boucler). */}
      {message && (
        <p
          role="status"
          className="rounded-lg bg-sombre-eleve px-4 py-3 text-[13.5px]
                     leading-relaxed text-sombre-texte"
        >
          {message}
        </p>
      )}
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
          titre={`Delete "${ficheAConfirmer.nom}"?`}
          onFermer={() => setFicheAConfirmer(null)}
        >
          {/*  ⚠️ « OU SUR LA FICHE DE TON PORTFOLIO » — PLUS « modifie
               simplement » (passe nº 133) : modifier un portfolio ne
               réactive plus rien. La seule autre porte est le bouton
               « Réactiver mon portfolio », qui attend sur la fiche
               désactivée (voir FormulaireFiche). */}
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            The portfolio disappears from public view right away, and will be
            permanently deleted in {DELAI_SUPPRESSION_JOURS} days —
            photos included.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Changed your mind? Cancel here, or from your
            portfolio: the deletion stops by itself.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Your account and your other portfolios don&apos;t change.
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
            {enCours ? "One moment…" : "Delete portfolio"}
          </button>
          <button
            type="button"
            onClick={() => setFicheAConfirmer(null)}
            className="mt-3 inline-flex w-full items-center justify-center
                       min-h-[44px] text-[14px] text-sombre-texte-doux
                       hover:text-sombre-texte transition-colors"
          >
            Cancel
          </button>
        </FenetreConfirmation>
      )}

      {/* ---------- LA CONFIRMATION DU COMPTE — écrire SUPPRIMER ---- */}
      {compteAConfirmer && (
        <FenetreConfirmation
          titre="Delete your account?"
          onFermer={() => setCompteAConfirmer(false)}
        >
          {/* TROIS PHRASES COURTES (nº 129) : ce qui se passe, comment
              revenir en arrière, ce qu'il faut taper. Le MÉCANISME ne
              change pas — il faut toujours écrire SUPPRIMER. */}
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Your account and portfolios will be hidden immediately, then
            permanently deleted in {DELAI_SUPPRESSION_JOURS} days.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            You can cancel by logging back in before then.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
            Type <strong className="text-sombre-texte">DELETE</strong> to
            confirm.
          </p>
          <input
            type="text"
            {...sansRemplissageAuto("confirmation-suppression")}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            className="mt-4 w-full min-h-[48px] rounded-lg border border-transparent
                       bg-sombre-eleve-clair px-4 text-base text-sombre-texte
                       placeholder:text-sombre-texte-doux outline-none
                       transition-colors focus:bg-sombre-haut"
          />
          <button
            type="button"
            onClick={supprimerLeCompte}
            disabled={
              enCours || confirmation.trim().toUpperCase() !== "DELETE"
            }
            className="mt-6 inline-flex w-full items-center justify-center
                       min-h-[50px] rounded-full bg-erreur text-white
                       font-semibold transition-opacity
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enCours ? "One moment…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => setCompteAConfirmer(false)}
            className="mt-3 inline-flex w-full items-center justify-center
                       min-h-[44px] text-[14px] text-sombre-texte-doux
                       hover:text-sombre-texte transition-colors"
          >
            Cancel
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
