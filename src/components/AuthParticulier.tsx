"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";
import { ComposantCaptcha } from "@/components/ComposantCaptcha";

const FOURNISSEURS = [
  { code: "google", label: "Continuer avec Google" },
  { code: "apple", label: "Continuer avec Apple" },
] as const;

/**
 * CONNEXION / CRÉATION DE COMPTE PARTICULIER (§14)
 * ------------------------------------------------
 * Google, Apple ou email — jamais de SMS. Un compte n'est demandé
 * QUE pour gérer ses favoris (chercher reste libre).
 * Le reCAPTCHA invisible anti-robots arrive à l'étape 10 (il
 * s'active dans Supabase, sans changer ce formulaire).
 */
export function AuthParticulier({ suite = "/" }: { suite?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"inscription" | "connexion">("inscription");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Vérification anti-robots (active seulement si la clé est configurée)
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);
  const captchaActif = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function continuerAvec(fournisseur: (typeof FOURNISSEURS)[number]["code"]) {
    setMessage(null);
    const supabase = creerClientSupabaseNavigateur();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: fournisseur,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(suite)}`,
      },
    });
    if (error) {
      setMessage(
        "Ce mode de connexion n'est pas encore activé — utilise l'email en attendant."
      );
    }
  }

  async function validerEmail(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (captchaActif && !jetonCaptcha) {
      setMessage(
        "La vérification anti-robots se termine… réessaie dans une seconde."
      );
      return;
    }
    setEnCours(true);
    setMessage(null);
    const supabase = creerClientSupabaseNavigateur();

    if (mode === "inscription") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(suite)}`,
          data: { prenom: prenom.trim() || undefined },
          captchaToken: jetonCaptcha ?? undefined,
        },
      });
      if (error) setMessage(traduireErreur(error.message));
      else if (data.session) {
        router.refresh();
        return;
      } else {
        setMessage(
          "✉️ Un email de confirmation vient d'être envoyé : clique sur son lien puis reviens ici."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
        options: { captchaToken: jetonCaptcha ?? undefined },
      });
      if (error) setMessage(traduireErreur(error.message));
      else {
        router.refresh();
        return;
      }
    }
    setEnCours(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {FOURNISSEURS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => continuerAvec(code)}
          className="min-h-[48px] rounded-full border border-bordure font-medium text-sm hover:bg-fond-doux transition-colors"
        >
          {label}
        </button>
      ))}

      <div className="flex items-center gap-3 my-1 text-xs text-encre-douce">
        <span className="flex-1 border-t border-bordure" />
        ou par email
        <span className="flex-1 border-t border-bordure" />
      </div>

      <form onSubmit={validerEmail} className="flex flex-col gap-3">
        {mode === "inscription" && (
          <input
            type="text"
            autoComplete="given-name"
            placeholder="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="min-h-[48px] rounded-2xl border border-bordure bg-fond px-4 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25"
          />
        )}
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
        {/* Vérification anti-robots invisible (si configurée) */}
        <ComposantCaptcha surJeton={setJetonCaptcha} />

        <button
          type="submit"
          disabled={enCours}
          className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[48px] transition-colors disabled:opacity-60"
        >
          {enCours
            ? "Un instant…"
            : mode === "inscription"
              ? "Créer mon compte"
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
          ? "Déjà un compte ? Me connecter"
          : "Pas encore de compte ? M'inscrire"}
      </button>
    </div>
  );
}

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
