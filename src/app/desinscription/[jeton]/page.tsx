import type { Metadata } from "next";
import Link from "next/link";
import { entrepriseDuJeton } from "@/lib/desinscription";
import { LogoComplet } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Ne plus recevoir de messages",
  // Ces adresses ne doivent JAMAIS finir dans un moteur de recherche :
  // elles contiennent un jeton personnel.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * PAGE PUBLIQUE — DÉSINSCRIPTION
 * ===============================
 * L'adresse figure en bas de chaque message de prospection. Aucune
 * connexion, aucun formulaire à remplir, aucune question du type
 * « pourquoi partez-vous ? » : un bouton, et c'est fini.
 *
 * POURQUOI UN BOUTON ET NON UNE DÉSINSCRIPTION AU CHARGEMENT
 * ----------------------------------------------------------
 * Les messageries et les antivirus VISITENT les liens des e-mails
 * pour les vérifier. Si la simple ouverture de la page désinscrivait,
 * des artisans seraient désinscrits sans avoir rien demandé — et on
 * ne s'en apercevrait jamais. Le clic humain reste nécessaire ici.
 *
 * Les messageries qui proposent leur propre bouton « Se désabonner »
 * (Gmail, Outlook) passent, elles, par /api/desinscription/[jeton] :
 * c'est un vrai POST, jamais déclenché par une simple vérification.
 */
export default async function PageDesinscription({
  params,
  searchParams,
}: {
  params: Promise<{ jeton: string }>;
  searchParams: Promise<{ fait?: string }>;
}) {
  const { jeton } = await params;
  const { fait } = await searchParams;
  const { entreprise, dejaFait } = await entrepriseDuJeton(jeton);

  const termine = fait === "1" || dejaFait;
  const lienInconnu = entreprise === null;

  return (
    <main className="flex-1 flex flex-col items-center px-5 py-12">
      <div className="w-full max-w-[560px] flex flex-col gap-6">
        <LogoComplet tailleIcone={32} />

        {lienInconnu ? (
          <div className="rounded-2xl border border-bordure bg-fond p-6 flex flex-col gap-3">
            <h1 className="text-xl font-bold">Ce lien n&apos;est plus valable</h1>
            <p className="text-encre-douce">
              Il a peut-être déjà servi, ou il a été recopié incomplètement.
              Si vous recevez encore des messages de notre part, répondez
              simplement à l&apos;un d&apos;eux : nous vous retirons de la liste
              à la main, le jour même.
            </p>
            <Link
              href="/artisans/contact"
              className="text-primaire underline text-sm min-h-[44px] flex items-center"
            >
              Nous écrire
            </Link>
          </div>
        ) : termine ? (
          <div className="rounded-2xl border border-succes/40 bg-succes/5 p-6 flex flex-col gap-3">
            <h1 className="text-xl font-bold">C&apos;est fait</h1>
            <p>
              <span className="font-semibold">{entreprise}</span> ne recevra plus
              aucun message de Roswel. Vous n&apos;avez rien d&apos;autre à faire.
            </p>
            <p className="text-sm text-encre-douce">
              Si vous changez d&apos;avis un jour, vous pourrez créer votre fiche
              vous-même — c&apos;est gratuit et cela ne dépend que de vous.
            </p>
            <Link
              href="/"
              className="text-primaire underline text-sm min-h-[44px] flex items-center"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-bordure bg-fond p-6 flex flex-col gap-4">
            <h1 className="text-xl font-bold">Ne plus recevoir de messages</h1>
            <p>
              Vous êtes sur le point de retirer{" "}
              <span className="font-semibold">{entreprise}</span> de notre liste.
              Plus aucun message ne partira, et cette décision est définitive de
              notre côté.
            </p>

            {/* Le bouton POSTE vers /api/desinscription/[jeton] : la même
                adresse que celle de l'en-tête technique des messages. */}
            <form action={`/api/desinscription/${jeton}`} method="post">
              <button
                type="submit"
                className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-6 min-h-[48px] w-full sm:w-auto transition-colors"
              >
                Confirmer ma désinscription
              </button>
            </form>

            <p className="text-sm text-encre-douce">
              Vous préférez nous en parler ?{" "}
              <Link href="/artisans/contact" className="text-primaire underline">
                Écrivez-nous
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
