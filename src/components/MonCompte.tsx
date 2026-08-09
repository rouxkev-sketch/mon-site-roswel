"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { BoutonDeconnexion } from "@/components/BoutonDeconnexion";

const classeChamp =
  "w-full min-h-[48px] rounded-2xl border border-bordure bg-fond px-4 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25";

const NOMS_FOURNISSEURS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
};

/**
 * MON COMPTE — onglet 3 de l'espace particulier (§15)
 * ---------------------------------------------------
 * S'adapte au mode de connexion :
 * - email/mot de passe → email, mot de passe ET téléphone modifiables ;
 * - Google/Apple/Facebook → email et mot de passe gérés par le
 *   fournisseur (affichés en lecture seule), seul le téléphone (et le
 *   prénom) restent modifiables.
 * Suppression du compte possible dans tous les cas (RGPD).
 */
export function MonCompte({
  userId,
  email,
  fournisseur,
  prenomInitial,
  telephoneInitial,
}: {
  userId: string;
  email: string;
  fournisseur: string; // "email", "google", "apple", "facebook"…
  prenomInitial: string | null;
  telephoneInitial: string | null;
}) {
  const router = useRouter();
  const connexionParEmail = fournisseur === "email";

  const [prenom, setPrenom] = useState(prenomInitial ?? "");
  const [telephone, setTelephone] = useState(telephoneInitial ?? "");
  const [messageProfil, setMessageProfil] = useState<string | null>(null);

  const [nouvelEmail, setNouvelEmail] = useState(email);
  const [messageEmail, setMessageEmail] = useState<string | null>(null);
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [messageMdp, setMessageMdp] = useState<string | null>(null);

  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [messageSuppression, setMessageSuppression] = useState<string | null>(null);

  /* ----- Prénom + téléphone (toujours modifiables) ----- */
  async function enregistrerProfil() {
    setMessageProfil(null);
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.from("particuliers").upsert({
      id: userId,
      prenom: prenom.trim() || null,
      telephone: telephone.trim() || null,
    });
    setMessageProfil(error ? `❌ ${error.message}` : "✅ Enregistré.");
  }

  /* ----- Email (seulement en connexion email) ----- */
  async function changerEmail() {
    setMessageEmail(null);
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.updateUser({ email: nouvelEmail });
    setMessageEmail(
      error
        ? `❌ ${error.message}`
        : "✅ Presque fini : un email de confirmation a été envoyé à l'ancienne ET à la nouvelle adresse."
    );
  }

  /* ----- Mot de passe (seulement en connexion email) ----- */
  async function changerMotDePasse() {
    setMessageMdp(null);
    if (nouveauMdp.length < 8) {
      setMessageMdp("❌ Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp });
    if (!error) setNouveauMdp("");
    setMessageMdp(error ? `❌ ${error.message}` : "✅ Mot de passe modifié.");
  }

  /* ----- Suppression du compte (RGPD, action définitive) ----- */
  async function supprimerCompte() {
    setSuppressionEnCours(true);
    setMessageSuppression(null);
    try {
      const reponse = await fetch("/api/compte/supprimer", { method: "POST" });
      const resultat = (await reponse.json()) as { ok: boolean; message?: string };
      if (resultat.ok) {
        const supabase = creerClientSupabaseNavigateur();
        await supabase.auth.signOut();
        router.push("/?compte=supprime");
        router.refresh();
        return;
      }
      setMessageSuppression(`❌ ${resultat.message ?? "Suppression impossible."}`);
    } catch {
      setMessageSuppression("❌ Pas de réponse du serveur.");
    }
    setSuppressionEnCours(false);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ----- Profil ----- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Mes informations</h2>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Prénom</span>
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className={classeChamp}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">
            Téléphone{" "}
            <span className="text-encre-douce font-normal">
              (pré-remplit vos demandes — facultatif)
            </span>
          </span>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="06 12 34 56 78"
            className={classeChamp}
          />
        </label>
        <button
          type="button"
          onClick={enregistrerProfil}
          className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[46px] text-sm transition-colors"
        >
          Enregistrer
        </button>
        {messageProfil && <p className="text-sm">{messageProfil}</p>}
      </section>

      {/* ----- Connexion ----- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Ma connexion</h2>

        {connexionParEmail ? (
          <>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">Adresse email</span>
              <input
                type="email"
                value={nouvelEmail}
                onChange={(e) => setNouvelEmail(e.target.value)}
                className={classeChamp}
              />
            </label>
            <button
              type="button"
              onClick={changerEmail}
              disabled={nouvelEmail === email}
              className="border border-bordure font-semibold rounded-full min-h-[46px] text-sm hover:bg-fond-doux transition-colors disabled:opacity-40"
            >
              Changer d&apos;email
            </button>
            {messageEmail && <p className="text-sm">{messageEmail}</p>}

            <label className="block mt-2">
              <span className="block text-sm font-medium mb-1.5">
                Nouveau mot de passe
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={nouveauMdp}
                onChange={(e) => setNouveauMdp(e.target.value)}
                placeholder="8 caractères minimum"
                className={classeChamp}
              />
            </label>
            <button
              type="button"
              onClick={changerMotDePasse}
              disabled={nouveauMdp.length === 0}
              className="border border-bordure font-semibold rounded-full min-h-[46px] text-sm hover:bg-fond-doux transition-colors disabled:opacity-40"
            >
              Changer le mot de passe
            </button>
            {messageMdp && <p className="text-sm">{messageMdp}</p>}
          </>
        ) : (
          <div className="rounded-2xl bg-fond-doux border border-bordure p-4 text-sm">
            <p className="font-medium">
              Connecté avec {NOMS_FOURNISSEURS[fournisseur] ?? fournisseur} ·{" "}
              {email}
            </p>
            <p className="text-encre-douce mt-1">
              L&apos;email et le mot de passe sont gérés par{" "}
              {NOMS_FOURNISSEURS[fournisseur] ?? "votre fournisseur"} — ils ne
              se modifient pas ici. Le prénom et le téléphone ci-dessus restent
              modifiables.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <BoutonDeconnexion />
        </div>
      </section>

      {/* ----- Suppression (RGPD) ----- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-erreur">Zone sensible</h2>
        {!confirmationSuppression ? (
          <button
            type="button"
            onClick={() => setConfirmationSuppression(true)}
            className="border border-erreur/40 text-erreur font-semibold rounded-full min-h-[46px] text-sm hover:bg-erreur/5 transition-colors"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="rounded-2xl border border-erreur/40 bg-erreur/5 p-4 text-sm flex flex-col gap-3">
            <p className="font-semibold">⚠️ Action définitive</p>
            <p className="text-encre-douce">
              Votre compte, vos conversations et vos données personnelles
              seront effacés définitivement. Cette action ne peut pas être
              annulée.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={supprimerCompte}
                disabled={suppressionEnCours}
                className="flex-1 bg-erreur text-white font-semibold rounded-full min-h-[46px] text-sm disabled:opacity-60"
              >
                {suppressionEnCours ? "Suppression…" : "Oui, supprimer définitivement"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmationSuppression(false)}
                className="flex-1 border border-bordure font-semibold rounded-full min-h-[46px] text-sm"
              >
                Annuler
              </button>
            </div>
            {messageSuppression && <p>{messageSuppression}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
