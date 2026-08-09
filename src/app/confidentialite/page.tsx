import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Roswel traite les données personnelles.",
};

/**
 * POLITIQUE DE CONFIDENTIALITÉ (étape 11) — modèle à faire relire
 * par un professionnel avant le lancement public.
 */
export default function PageConfidentialite() {
  return (
    <main className="flex-1 flex flex-col px-5 py-6 max-w-[730px] w-full mx-auto">
      <h1 className="text-xl font-bold">Politique de confidentialité</h1>
      <p className="text-xs text-encre-douce mt-1 mb-5">
        Dernière mise à jour : [À compléter : date de mise en ligne]
      </p>

      <div className="flex flex-col gap-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">Les données collectées</h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong>Compte particulier :</strong> email, prénom, téléphone
              (facultatif), conversations et photos jointes.
            </li>
            <li>
              <strong>Compte artisan :</strong> les informations de la fiche
              publique (nom affiché, photo, métiers, zone d&apos;intervention,
              contacts choisis, SIREN le cas échéant) et l&apos;adresse
              précise, qui n&apos;est <strong>jamais publiée</strong> (elle
              sert au calcul de distance).
            </li>
            <li>
              <strong>Navigation :</strong> uniquement des cookies essentiels
              (rester connecté) — pas de cookies publicitaires ni de traçage.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Ce que Roswel ne fait pas</h2>
          <p>
            Pas de revente de données. Pas de publicité ciblée. L&apos;email
            d&apos;un particulier n&apos;est <strong>jamais</strong> montré
            aux artisans ; les emails de notification ne contiennent ni le
            contenu des messages ni l&apos;adresse de l&apos;autre partie.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Où sont hébergées les données</h2>
          <p>
            Dans l&apos;Union européenne, chez Supabase (base de données et
            comptes). Le site est servi par Vercel. Les emails de
            notification passent par Resend. La protection anti-robots
            éventuelle utilise Cloudflare Turnstile.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Notes et avis : Google</h2>
          <p>
            Les notes et nombres d&apos;avis affichés sont{" "}
            <strong>fournis par Google</strong> (API Google Places),
            rafraîchis régulièrement et non conservés durablement. Les avis
            eux-mêmes se lisent et se déposent sur Google. Google en est
            l&apos;unique responsable ; Roswel n&apos;héberge aucun avis.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Vos droits (RGPD)</h2>
          <p>
            Accès, rectification, effacement, portabilité : la plupart de ces
            droits s&apos;exercent directement dans « Mon compte » — dont la{" "}
            <strong>suppression définitive du compte</strong> (données
            personnelles effacées). Pour toute autre demande :
            [À compléter : email de contact], réponse sous 30 jours.
            Réclamation possible auprès de la CNIL (cnil.fr).
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Durées de conservation</h2>
          <p>
            Les données d&apos;un compte sont conservées tant que le compte
            existe, puis effacées à sa suppression. Les fiches artisans
            retirées cessent d&apos;être publiées immédiatement.
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
