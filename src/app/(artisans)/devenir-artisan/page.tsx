import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { AuthArtisan } from "@/components/AuthArtisan";

export const metadata: Metadata = {
  title: "Devenir artisan Roswel",
  description:
    "Inscrivez votre activité sur Roswel : votre réputation réelle (avis Google, Instagram) travaille pour vous. Inscription gratuite, partout en France.",
};

/**
 * PORTE D'ENTRÉE DES ARTISANS (étape 8a)
 * --------------------------------------
 * Un mot sur l'intérêt de Roswel, puis connexion / création de
 * compte. Déjà connecté → direction l'espace artisan.
 */
export default async function PageDevenirArtisan() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/artisan/espace");

  return (
    <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
      <h1 className="text-2xl font-bold text-balance">
        Votre réputation travaille pour vous
      </h1>
      <p className="text-encre-douce mt-2 text-sm">
        Roswel classe les artisans sur leurs preuves : avis Google et
        présence Instagram. Inscription gratuite, ouverte partout en
        France.
      </p>

      <ul className="flex flex-col gap-2 mt-5 mb-7 text-sm">
        <li className="flex gap-2.5 items-start">
          <span aria-hidden>🏅</span>
          Un score de confiance sur 100, calculé sur du réel
        </li>
        <li className="flex gap-2.5 items-start">
          <span aria-hidden>📍</span>
          Vous choisissez votre zone : votre ville + un rayon
        </li>
        <li className="flex gap-2.5 items-start">
          <span aria-hidden>💬</span>
          Les demandes clients arrivent directement sur votre WhatsApp
        </li>
      </ul>

      <AuthArtisan />
    </main>
  );
}
