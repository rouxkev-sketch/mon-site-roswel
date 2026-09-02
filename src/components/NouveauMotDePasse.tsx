"use client";

import { useState } from "react";
//  §B9 (nº 788) — l'œil partagé (voir erreurs-formulaire).
import { BoutonOeil, PLACE_DE_L_OEIL } from "@/components/erreurs-formulaire";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { useUtilisateur } from "@/lib/use-utilisateur";
import { ARRIVEE_APRES_CONNEXION } from "@/config/tatouage";

/**
 * CHOISIR UN NOUVEAU MOT DE PASSE
 * ================================
 * La page qu'ouvre le lien de l'e-mail « Mot de passe oublié ? »
 * (Supabase y connecte la personne le temps de la réinitialisation,
 * via /auth/callback). Un seul travail : le nouveau mot de passe,
 * saisi deux fois, huit caractères au minimum.
 *
 * Lien périmé ou déjà utilisé : pas de session — on le dit, et on
 * ramène vers la connexion pour redemander un e-mail.
 */

const LONGUEUR_MINIMALE = 8;

const CHAMP =
  "w-full min-h-[52px] rounded-xl border bg-sombre-eleve px-4 text-base " +
  "text-sombre-texte placeholder:text-sombre-texte-doux outline-none " +
  "transition-colors focus:border-primaire focus:ring-2 focus:ring-primaire/25";

export function NouveauMotDePasse() {
  const router = useRouter();
  const { utilisateur, pret } = useUtilisateur();

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [fait, setFait] = useState(false);

  async function enregistrer(evenement: React.FormEvent) {
    evenement.preventDefault();
    const trouvees: Record<string, string> = {};
    if (motDePasse.length < LONGUEUR_MINIMALE) {
      trouvees.motDePasse = `At least ${LONGUEUR_MINIMALE} characters.`;
    } else if (confirmation !== motDePasse) {
      trouvees.confirmation = "The two passwords don't match.";
    }
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    setEnCours(true);
    try {
      const supabase = creerClientSupabaseNavigateur();
      const { error } = await supabase.auth.updateUser({
        password: motDePasse,
      });
      if (error) throw error;
      setFait(true);
      // Le compte est connecté avec son nouveau mot de passe :
      // direction « MA FICHE », exactement comme après toute autre
      // connexion (passe nº 131 — une seule adresse d'arrivée).
      window.setTimeout(() => router.push(ARRIVEE_APRES_CONNEXION), 1600);
    } catch (erreur) {
      const brut =
        erreur instanceof Error ? erreur.message.toLowerCase() : "";
      setErreurs({
        general: brut.includes("should be different")
          ? "This password is the same as the old one — choose a new one."
          : brut.includes("password should be")
            ? `Your password must be at least ${LONGUEUR_MINIMALE} characters.`
            : "Saving failed. Try again.",
      });
    } finally {
      setEnCours(false);
    }
  }

  /* Le temps que la session du lien s'installe. */
  if (!pret) {
    return <main className="flex-1" aria-hidden="true" />;
  }

  /* ---------- LIEN PÉRIMÉ (pas de session) ---------- */
  if (!utilisateur) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pt-12 sm:pt-16 pb-24 text-center">
        <h1 className="text-[clamp(1.5rem,4vw,1.9rem)] font-bold text-sombre-texte">
          This link is no longer valid
        </h1>
        <p className="mt-3 text-sombre-texte-doux leading-relaxed">
          It expired, or it was already used. Request a new email from the
          login page (&quot;Forgot your password?&quot;) — it only takes
          a minute.
        </p>
        <Link
          href="/devenir-tatoueur"
          className="mt-7 inline-flex items-center justify-center rounded-full
                     px-7 min-h-[52px] bg-primaire hover:bg-primaire-fonce
                     text-white font-semibold transition-colors"
        >
          Back to login
        </Link>
      </main>
    );
  }

  /* ---------- LE NOUVEAU MOT DE PASSE ---------- */
  return (
    <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pt-12 sm:pt-16 pb-24">
      <h1 className="text-[clamp(1.5rem,4vw,1.9rem)] font-bold text-sombre-texte text-center">
        Choose your new password
      </h1>
      <p className="mt-2 text-center text-[15px] text-sombre-texte-doux">
        At least {LONGUEUR_MINIMALE} characters — and this time, one
        you&apos;ll remember.
      </p>

      {fait ? (
        <p
          role="status"
          className="mt-8 rounded-xl border border-primaire/40 bg-primaire/10 px-4 py-3 text-sm text-sombre-texte"
        >
          Saved: your password is changed. Heading to your
          portfolio…
        </p>
      ) : (
        <form onSubmit={enregistrer} noValidate className="mt-8 flex flex-col gap-4">
          <div>
            <label
              htmlFor="nouveau-mdp"
              className="block text-sm font-medium text-sombre-texte mb-1.5"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="nouveau-mdp"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                aria-invalid={Boolean(erreurs.motDePasse)}
                placeholder={`At least ${LONGUEUR_MINIMALE} characters`}
                style={{ paddingRight: PLACE_DE_L_OEIL }}
                className={`${CHAMP} ${
                  erreurs.motDePasse ? "border-erreur" : "border-sombre-bordure"
                }`}
              />
              {/*  §B9 (nº 788) — LE MÊME ŒIL QUE PARTOUT AILLEURS. La
                   consigne dit « partout où ce mécanisme existe » : cette
                   page est l'aboutissement de « Mot de passe oublié ? »,
                   à deux clics de la connexion. La laisser au mot aurait
                   fait une incohérence qu'on rencontre en une minute. */}
              <BoutonOeil visible={visible} surBascule={() => setVisible((v) => !v)} />
            </div>
            {erreurs.motDePasse && (
              <p className="mt-1.5 text-[13px] text-erreur">
                {erreurs.motDePasse}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="nouveau-mdp-confirmation"
              className="block text-sm font-medium text-sombre-texte mb-1.5"
            >
              Confirm the password
            </label>
            <input
              id="nouveau-mdp-confirmation"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              aria-invalid={Boolean(erreurs.confirmation)}
              placeholder="The same one, once more"
              className={`${CHAMP} ${
                erreurs.confirmation ? "border-erreur" : "border-sombre-bordure"
              }`}
            />
            {erreurs.confirmation && (
              <p className="mt-1.5 text-[13px] text-erreur">
                {erreurs.confirmation}
              </p>
            )}
          </div>

          {erreurs.general && (
            <p
              role="alert"
              className="rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3 text-sm text-sombre-texte"
            >
              {erreurs.general}
            </p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="mt-1 inline-flex items-center justify-center rounded-full
                       min-h-[52px] bg-primaire hover:bg-primaire-fonce
                       text-white font-semibold transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enCours ? "One moment…" : "Save password"}
          </button>
        </form>
      )}
    </main>
  );
}
