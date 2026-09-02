import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnTeteTatouage } from "@/components/EnTeteTatouage";
import { PageRattachement } from "@/components/PageRattachement";
import { lireDemarchageParJeton } from "@/lib/demarchage-serveur";

/**
 * LA PAGE DE RATTACHEMENT — /rejoindre/<jeton>
 * ==============================================
 * Le lien qu'on envoie au tatoueur. Il y trouve LA ou LES fiches
 * qu'on a préparées pour lui, et deux gestes : les récupérer (en
 * créant son compte), ou les faire retirer.
 *
 * ⚠️ AUCUN LIEN NE MÈNE ICI. Cette page ne s'atteint que par son
 * jeton — elle n'est ni dans le menu, ni dans le plan du site, et les
 * moteurs de recherche n'ont rien à y faire (voir `robots` plus bas).
 * Un jeton inconnu répond « introuvable », sans jamais dire s'il a
 * existé : on ne renseigne pas qui cherche.
 *
 * ⚠️ LA LECTURE EST FAITE ICI, CÔTÉ SERVEUR. Le navigateur ne reçoit
 * que ce qu'il doit afficher — jamais la table des jetons.
 */

export const metadata: Metadata = {
  title: "Claim my portfolio",
  robots: { index: false, follow: false },
};

export default async function PageRejoindre({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  const demarchage = await lireDemarchageParJeton(jeton);
  if (!demarchage) notFound();

  return (
    <>
      <EnTeteTatouage />
      <PageRattachement
        jeton={demarchage.jeton}
        etat={demarchage.etat}
        dejaRattache={Boolean(demarchage.rattacheA)}
        fiches={demarchage.fiches.map((f) => ({
          id: f.id,
          nom: f.nom,
          slug: f.slug,
          ville: f.ville,
          type: f.type,
          photo: f.photo,
          retiree: f.retiree,
        }))}
      />
    </>
  );
}
