import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur et hébergement du site Roswel.",
};

/**
 * MENTIONS LÉGALES (étape 11) — les [À compléter] sont à remplir
 * avec les informations de l'éditeur avant le lancement public.
 */
export default function PageMentionsLegales() {
  return (
    <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
      <h1 className="text-xl font-bold mb-5">Mentions légales</h1>

      <div className="flex flex-col gap-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">Éditeur du site</h2>
          <p>
            [À compléter : prénom et nom, ou raison sociale]
            <br />
            [À compléter : statut — ex. entrepreneur individuel, SAS…]
            <br />
            [À compléter : adresse]
            <br />
            [À compléter : SIREN si société]
            <br />
            Contact : [À compléter : email]
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Directeur de la publication</h2>
          <p>[À compléter : prénom et nom]</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Hébergement</h2>
          <p>
            Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
            États-Unis (vercel.com).
            <br />
            Données et comptes : Supabase (projet hébergé dans l&apos;Union
            européenne — supabase.com).
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Crédits et attributions</h2>
          <p>
            Notes et nombres d&apos;avis fournis par Google (API Google
            Places). Adresses et communes : données publiques de l&apos;État
            (adresse.data.gouv.fr, geo.api.gouv.fr). Vérification
            d&apos;entreprises : annuaire officiel construit sur les données
            Sirene de l&apos;INSEE.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Voir aussi</h2>
          {/* Sur UNE SEULE ligne, séparés par « · », comme le pied de
              page du site (libellés courts, pas de retour à la ligne
              entre les liens). */}
          <p className="whitespace-nowrap overflow-x-auto">
            <Link href="/cgu" className="text-primaire underline">
              CGU
            </Link>
            {" · "}
            <Link href="/confidentialite" className="text-primaire underline">
              Politique de confidentialité
            </Link>
            {" · "}
            <Link href="/artisans/contact" className="text-primaire underline">
              Contact
            </Link>
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-8 text-center text-primaire font-semibold underline-offset-4 hover:underline min-h-[44px] flex items-center justify-center"
      >
        ← Retour à l&apos;accueil
      </Link>
    </main>
  );
}
