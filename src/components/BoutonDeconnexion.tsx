"use client";

import { useRouter } from "next/navigation";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";

/** Petit bouton « Se déconnecter » (espace artisan, puis particulier). */
export function BoutonDeconnexion() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = creerClientSupabaseNavigateur();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="text-sm text-encre-douce hover:text-erreur min-h-[44px] px-2 transition-colors"
    >
      Se déconnecter
    </button>
  );
}
