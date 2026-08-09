import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Les règles d'utilisation de Roswel.",
};

/**
 * CGU (étape 11) — modèle sérieux mais à faire relire par un
 * professionnel du droit avant le lancement public.
 */
export default function PageCgu() {
  return (
    <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
      <h1 className="text-xl font-bold">Conditions générales d&apos;utilisation</h1>
      <p className="text-xs text-encre-douce mt-1 mb-5">
        Dernière mise à jour : [À compléter : date de mise en ligne]
      </p>

      <div className="flex flex-col gap-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">1. Ce qu&apos;est Roswel</h2>
          <p>
            Roswel est un service de <strong>mise en relation</strong> entre
            des particuliers et des artisans. Roswel n&apos;est ni une
            entreprise de travaux, ni un employeur des artisans référencés :
            les prestations sont conclues et réalisées directement entre le
            particulier et l&apos;artisan, sous leur seule responsabilité.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">2. Aucune garantie sur les prestations</h2>
          <p>
            Roswel ne garantit ni la disponibilité, ni la qualité, ni la
            conformité des prestations réalisées par les artisans. Le score
            de confiance est un indicateur calculé à partir de données
            publiques (avis Google, présence Instagram) : il éclaire le
            choix, il ne constitue pas une garantie.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">3. Les comptes</h2>
          <p>
            La recherche est libre. Un compte est nécessaire pour gérer des
            favoris ou présenter une fiche d&apos;artisan.
            Chacun est responsable de la confidentialité de ses identifiants
            et de l&apos;exactitude des informations fournies. Les fiches
            artisans sont vérifiées avant publication ; Roswel peut refuser
            ou retirer une fiche inexacte ou trompeuse.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">4. Le contact avec les artisans</h2>
          <p>
            Le contact se fait directement, par WhatsApp ou par téléphone,
            avec les coordonnées que l&apos;artisan choisit d&apos;afficher.
            Ces échanges ont lieu en dehors de Roswel : Roswel n&apos;y a
            pas accès et n&apos;en conserve aucune copie. Tout démarchage
            abusif peut être signalé.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">5. Les avis</h2>
          <p>
            Roswel ne collecte ni ne stocke aucun avis : les notes affichées
            proviennent de Google et les avis se déposent sur Google, selon
            les règles de Google.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">6. Données personnelles</h2>
          <p>
            Voir la{" "}
            <Link href="/confidentialite" className="text-primaire underline">
              politique de confidentialité
            </Link>
            . Chacun peut supprimer son compte à tout moment depuis « Mon
            compte » (suppression définitive).
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">7. Droit applicable</h2>
          <p>
            Les présentes conditions sont soumises au droit français.
            Éditeur : [À compléter : voir mentions légales].
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
