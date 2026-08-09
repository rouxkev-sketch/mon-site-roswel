import type { Metadata } from "next";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { AuthParticulier } from "@/components/AuthParticulier";
import { MonCompte } from "@/components/MonCompte";
import { OngletsParticulier } from "@/components/OngletsParticulier";

export const metadata: Metadata = { title: "Mon compte" };

/**
 * MON COMPTE — onglet 3 de l'espace particulier (§15)
 * ---------------------------------------------------
 * Non connecté : le bloc de connexion/inscription.
 * Connecté : les réglages, adaptés au mode de connexion.
 */
export default async function PageCompte() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
        <h1 className="text-xl font-bold mb-4">Mon compte</h1>
        <AuthParticulier suite="/compte" />
      </main>
    );
  }

  // Le profil (prénom, téléphone) et le mode de connexion
  const { data: profil } = await supabase
    .from("particuliers")
    .select("prenom, telephone")
    .eq("id", user.id)
    .maybeSingle();

  const fournisseur = (user.app_metadata?.provider as string) ?? "email";

  return (
    <main className="flex-1 flex flex-col px-5 py-6 pb-24 max-w-[730px] w-full mx-auto">
      <h1 className="text-xl font-bold mb-5">Mon compte</h1>

      <MonCompte
        userId={user.id}
        email={user.email ?? ""}
        fournisseur={fournisseur}
        prenomInitial={
          profil?.prenom ?? (user.user_metadata?.prenom as string | null) ?? null
        }
        telephoneInitial={profil?.telephone ?? null}
      />

      <OngletsParticulier actif="compte" />
    </main>
  );
}
