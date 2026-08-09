import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MonCompte } from "@/components/MonCompte";
import { OngletsParticulier } from "@/components/OngletsParticulier";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Aperçu de Mon compte (outil)",
};

/**
 * PAGE OUTIL — APERÇU DE « MON COMPTE » (étape 10)
 * ------------------------------------------------
 * Les deux variantes côte à côte : connexion par email (tout
 * modifiable) et connexion Google (lecture seule sauf téléphone).
 * Données fictives, boutons sans effet. Développement uniquement :
 * http://localhost:3000/admin/apercu-compte
 */
export default function PageApercuCompte() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-10 pb-24">
      <LogoComplet tailleIcone={32} />

      <div className="w-full max-w-[730px] mt-8 flex flex-col gap-10">
        <div>
          <h1 className="text-xl font-bold">Aperçu : Mon compte</h1>
          <p className="text-encre-douce text-sm mt-1">
            Données fictives — les boutons sont sans effet ici.
          </p>
        </div>

        <section>
          <h2 className="text-sm font-semibold mb-3 text-primaire">
            Variante 1 — connexion par email
          </h2>
          <div className="rounded-3xl border border-bordure p-4">
            <MonCompte
              userId="apercu"
              email="camille@exemple.fr"
              fournisseur="email"
              prenomInitial="Camille"
              telephoneInitial="06 12 34 56 78"
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3 text-primaire">
            Variante 2 — connexion avec Google
          </h2>
          <div className="rounded-3xl border border-bordure p-4">
            <MonCompte
              userId="apercu"
              email="camille@gmail.com"
              fournisseur="google"
              prenomInitial="Camille"
              telephoneInitial={null}
            />
          </div>
        </section>
      </div>

      <OngletsParticulier actif="compte" />
    </main>
  );
}
