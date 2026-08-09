"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";

const FOURNISSEURS = [
  { code: "google", label: "Continuer avec Google", icone: "🇬" },
  { code: "facebook", label: "Continuer avec Facebook", icone: "🇫" },
  { code: "apple", label: "Continuer avec Apple", icone: "" },
] as const;

/**
 * CONNEXION / INSCRIPTION DES ARTISANS
 * ------------------------------------
 * Google, Facebook, Apple (à activer dans Supabase, voir
 * docs/CONFIGURATION-SUPABASE.md) ou email + mot de passe.
 * Après connexion → l'espace artisan.
 */
export function AuthArtisan() {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("inscription");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function continuerAvec(fournisseur: (typeof FOURNISSEURS)[number]["code"]) {
    setMessage(null);
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: fournisseur,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/artisan/espace`,
      },
    });
    if (error) {
      setMessage(
        "Ce mode de connexion n'est pas encore activé. Utilise l'email en attendant (activation : docs/CONFIGURATION-SUPABASE.md)."
      );
    }
  }

  async function validerEmail(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setMessage(null);
    const supabase = creerClientSupabaseNavigateur();

    if (mode === "inscription") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/artisan/espace`,
        },
      });
      if (error) {
        setMessage(traduireErreur(error.message));
      } else if (data.session) {
        // Confirmation d'email désactivée : connecté immédiatement
        router.push("/artisan/espace");
        router.refresh();
        return;
      } else {
        setMessage(
          "✉️ C'est presque fini : un email de confirmation vient d'être envoyé. Clique sur son lien, puis reviens ici."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      if (error) {
        setMessage(traduireErreur(error.message));
      } else {
        router.push("/artisan/espace");
        router.refresh();
        return;
      }
    }
    setEnCours(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Connexion en un clic */}
      {FOURNISSEURS.map(({ code, label, icone }) => (
        <button
          key={code}
          type="button"
          onClick={() => continuerAvec(code)}
          className="min-h-[48px] rounded-full border border-bordure font-medium text-sm hover:bg-fond-doux transition-colors"
        >
          {icone} {label}
        </button>
      ))}

      <div className="flex items-center gap-3 my-1 text-xs text-encre-douce">
        <span className="flex-1 border-t border-bordure" />
        ou par email
        <span className="flex-1 border-t border-bordure" />
      </div>

      {/* Email + mot de passe */}
      <form onSubmit={validerEmail} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[48px] rounded-2xl border border-bordure bg-fond px-4 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "inscription" ? "new-password" : "current-password"}
          placeholder="Mot de passe (8 caractères minimum)"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="min-h-[48px] rounded-2xl border border-bordure bg-fond px-4 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25"
        />
        <button
          type="submit"
          disabled={enCours}
          className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[48px] transition-colors disabled:opacity-60"
        >
          {enCours
            ? "Un instant…"
            : mode === "inscription"
              ? "Créer mon compte artisan"
              : "Me connecter"}
        </button>
      </form>

      {message && (
        <p className="text-sm text-encre-douce bg-fond-doux border border-bordure rounded-2xl p-3">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(mode === "inscription" ? "connexion" : "inscription");
          setMessage(null);
        }}
        className="text-sm text-primaire font-medium min-h-[44px]"
      >
        {mode === "inscription"
          ? "Déjà inscrit ? Me connecter"
          : "Pas encore de compte ? M'inscrire"}
      </button>
    </div>
  );
}

/** Les erreurs Supabase les plus courantes, en français simple */
function traduireErreur(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (message.includes("already registered"))
    return "Un compte existe déjà avec cet email : utilise « Me connecter ».";
  if (message.includes("Password should be"))
    return "Le mot de passe doit faire au moins 8 caractères.";
  if (message.includes("Email not confirmed"))
    return "Email pas encore confirmé : clique sur le lien reçu par email, puis réessaie.";
  return `Un problème est survenu : ${message}`;
}
