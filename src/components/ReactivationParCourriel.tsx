"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PARAM_REACTIVER, REACTIVER_COMPTE } from "@/lib/reactivation";
import { Toast, type TonToast } from "@/components/Toast";

/**
 * ██ nº 832 — LE BOUTON DU COURRIEL, JOUÉ SUR LA PAGE D'ARRIVÉE ██
 * ==================================================================
 * LE DÉFAUT DU PROPRIÉTAIRE : « Reactivate my portfolio » et
 * « Reactivate my account » menaient tous deux à la page SÉCURITÉ —
 * celle d'où l'on supprime. On cliquait pour récupérer quelque chose,
 * et l'on arrivait devant les boutons de suppression.
 *
 * CE QUI CHANGE : la destination (lib/reactivation, §1) — « My
 * portfolio » pour un portfolio, « My selection » pour un compte. Le
 * geste, lui, est CE COMPOSANT : il lit `?reactiver=`, joue
 * l'annulation existante, puis efface le paramètre de l'adresse pour
 * qu'un rechargement ne rejoue rien.
 *
 * ⚠️ IL VIENT DE `BlocSuppressions` (nº 819), OÙ IL ÉTAIT ENFERMÉ. Il
 * y était un effet parmi les états d'un gros composant de la page
 * Sécurité ; il devait servir sur trois pages. Le sortir est la seule
 * façon de n'avoir qu'UNE écriture du geste (piège nº 378) — et c'est
 * pour la même raison qu'il est monté sur Sécurité AUSSI : les
 * courriels déjà partis pointent là-bas, et ils doivent continuer de
 * marcher.
 *
 * ⚠️ IL NE VÉRIFIE PAS LA SESSION, ET C'EST VOULU : chaque page
 * d'arrivée a déjà sa garde, et c'est elle qui sait renvoyer à la
 * connexion en gardant l'adresse (`connexionEnGardantLaReactivation`).
 * Une troisième vérification ici ne ferait que courir contre elles.
 *
 * Les deux routes appelées sont celles des boutons de la page
 * Sécurité — la réactivation du compte (nº 313) et la suppression de
 * portfolio jouée à l'envers. Aucune règle n'est réécrite ici : elles
 * vivent côté serveur, et deux appelants pour une même route (un
 * bouton, un lien de courriel) est le fonctionnement normal.
 *
 * ██ §1 (nº 837) — LA CONFIRMATION EST UN TOAST, PLUS UNE LIGNE NUE ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE : la phrase s'affichait en paragraphe nu
 * sous la barre fixe — dans le flux, sans forme. Elle passe par le
 * toast du site (`components/Toast`, une seule écriture) : bloc
 * sombre, pastille à coche verte, cinq secondes, puis plus rien. Ce
 * composant ne peint donc plus AUCUN élément dans la page : il rend le
 * toast tant qu'il a quelque chose à dire, et le retire quand le toast
 * a fini.
 *
 * ET LE MESSAGE DU COMPTE S'ADAPTE, sur consigne : « your account and
 * your portfolios are back » quand des portfolios sont revenus avec le
 * compte, « your account is back » quand il n'en avait aucun. C'est
 * la route qui compte (`/api/tatoueur/reactiver` rend `portfolios`),
 * et l'écran ne fait que choisir la phrase.
 *
 * ⚠️ LA TROISIÈME PHRASE DE LA nº 832 (« Your account is active — the
 * deletion is canceled. ») DISPARAÎT, ET IL FAUT DIRE POURQUOI. Elle
 * répondait au cas où la route n'avait « rien à annuler ». Or c'est le
 * CAS NORMAL, pas le cas rare : demander la suppression déconnecte, on
 * clique donc le bouton déconnecté, et la CONNEXION qui suit annule
 * déjà la suppression (`EcranAuthentification` appelle la route juste
 * après le mot de passe ; `auth/callback` fait de même pour un lien ou
 * Google). À l'arrivée, la route répondait « rien à annuler », et
 * l'écran disait « déjà actif » à quelqu'un dont le clic venait,
 * précisément, d'annuler la suppression. La confirmation parle du
 * GESTE, pas de l'ordre des appels : « Deletion canceled », dans tous
 * les cas où la route a réussi.
 */
export function ReactivationParCourriel() {
  const router = useRouter();
  const [dit, setDit] = useState<{ ton: TonToast; message: string } | null>(
    null
  );

  useEffect(() => {
    const adresse = new URL(window.location.href);
    const cible = adresse.searchParams.get(PARAM_REACTIVER);
    if (!cible) return;
    /*  L'ADRESSE SE NETTOIE AVANT L'APPEL : un rechargement pendant
        l'attente ne doit pas relancer l'annulation.
        ⚠️ PAR LE ROUTEUR, ET NON PAR `history.replaceState` — mesuré au
        banc de cette passe : un `replaceState` change l'adresse dans le
        navigateur SANS que le routeur de Next le sache, et le
        `router.refresh()` qui suit resynchronise sur l'adresse qu'il a
        gardée, paramètre compris. Le paramètre revenait donc à l'écran
        (`?reactiver=fiche-832` relevé sur « My portfolio »), et un
        rechargement rejouait l'annulation. `router.replace` le dit au
        routeur : l'adresse propre est alors la sienne. */
    adresse.searchParams.delete(PARAM_REACTIVER);
    router.replace(`${adresse.pathname}${adresse.search}`, { scroll: false });

    void (async () => {
      try {
        if (cible === REACTIVER_COMPTE) {
          const reponse = await fetch("/api/tatoueur/reactiver", {
            method: "POST",
          });
          const donnees = (await reponse.json().catch(() => null)) as {
            ok?: boolean;
            portfolios?: number | null;
          } | null;
          if (!reponse.ok || !donnees?.ok) {
            throw new Error("Reactivation failed. Try again.");
          }
          /*  §1 (nº 837) — LA PHRASE SUIT LE COMPTE DE PORTFOLIOS. Un
              compte inconnu (`null` : la base n'a pas répondu à ce
              décompte-là) prend la phrase complète — c'est celle du
              courriel, et celle de la plupart des comptes. Seul un
              zéro certain la raccourcit. */
          setDit({
            ton: "valide",
            message:
              donnees.portfolios === 0
                ? "Deletion canceled: your account is back as it was."
                : "Deletion canceled: your account and your portfolios are back as they were.",
          });
        } else {
          const reponse = await fetch("/api/tatoueur/supprimer-fiche", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: cible, annuler: true }),
          });
          const donnees = (await reponse.json().catch(() => null)) as {
            ok?: boolean;
            message?: string;
          } | null;
          if (!reponse.ok || !donnees?.ok) {
            throw new Error(donnees?.message ?? "The operation failed.");
          }
          setDit({
            ton: "valide",
            message: "Deletion canceled: your portfolio is back as it was.",
          });
        }
        //  LA PAGE MONTRE CE QUI VIENT DE REVENIR : sans cela, on
        //  arriverait sur « My portfolio » ou « My selection » dans
        //  l'état d'avant l'annulation.
        router.refresh();
      } catch (e) {
        setDit({
          ton: "probleme",
          message:
            e instanceof Error ? e.message : "Reactivation failed. Try again.",
        });
      }
    })();
  }, [router]);

  if (!dit) return null;
  return (
    <Toast ton={dit.ton} message={dit.message} onFini={() => setDit(null)} />
  );
}
