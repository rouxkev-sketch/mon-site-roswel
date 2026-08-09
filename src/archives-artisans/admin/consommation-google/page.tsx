import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MOIS_HISTORIQUE_GOOGLE,
  PALIERS_GOOGLE,
  SEUILS_CONSOMMATION_GOOGLE,
} from "@/config/roswel";
import { lireConsommationGoogle } from "@/lib/journal-google";
import { LogoComplet } from "@/components/Logo";
import { BarreFranchise, euros } from "@/components/BarreFranchise";

export const metadata: Metadata = { title: "Consommation Google (admin)" };
export const dynamic = "force-dynamic";

/**
 * PAGE ADMIN — CONSOMMATION DE L'API GOOGLE PLACES
 * -------------------------------------------------
 * http://localhost:3000/admin/consommation-google (développement
 * uniquement, comme les autres outils).
 *
 * Elle répond à UNE question : où en suis-je dans les franchises
 * gratuites de ce mois ? Et elle y répond PAR TYPE D'APPEL, parce que
 * Google ne mutualise pas les franchises — un total unique ne dirait
 * rien d'utile.
 *
 * Ce qu'elle n'est pas : une facture. Elle lit le journal du projet,
 * qui ne connaît que les appels passés depuis sa mise en place. La
 * console Google Cloud reste seule autorité.
 */

/** Une date lisible, calculée en UTC (serveur et navigateur d'accord). */
function dateLongue(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const jour = String(date.getUTCDate()).padStart(2, "0");
  const mois = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${jour}/${mois}/${date.getUTCFullYear()}`;
}

export default async function PageConsommationGoogle() {
  if (process.env.NODE_ENV === "production") notFound();

  const consommation = await lireConsommationGoogle();
  const depassements = consommation.types.filter((t) => t.coutDepassementEuro > 0);
  const coutTotal = depassements.reduce((s, t) => s + t.coutDepassementEuro, 0);

  return (
    <main className="flex-1 flex flex-col px-5 py-8 w-full">
      <LogoComplet tailleIcone={32} />

      <div className="w-full min-w-0 max-w-[1000px] mt-8 flex flex-col gap-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-xl font-bold">Consommation Google</h1>
          <Link
            href="/admin/prospection"
            className="text-sm text-primaire underline"
          >
            ← Retour à la prospection
          </Link>
        </div>

        {/* ---------- Ce que cette page sait, et ce qu'elle ignore ---------- */}
        <div className="rounded-2xl border border-bordure bg-fond-doux p-4 flex flex-col gap-2 text-sm">
          <p>
            <span className="font-semibold">Mois en cours :</span>{" "}
            {consommation.moisEnCours}. Les franchises gratuites se remettent à
            zéro le 1<sup>er</sup> de chaque mois, et{" "}
            <span className="font-semibold">
              elles ne sont jamais mutualisées
            </span>{" "}
            : chaque type d&apos;appel a la sienne.
          </p>
          <p className="text-encre-douce">
            Ce tableau ne connaît que les appels passés{" "}
            <span className="font-semibold">
              depuis la mise en place du journal
            </span>
            {consommation.premierAppelLe
              ? ` (premier appel enregistré le ${dateLongue(consommation.premierAppelLe)})`
              : " (aucun appel enregistré pour l'instant)"}
            . L&apos;historique complet et la facture réelle sont sur la console
            Google Cloud :{" "}
            <a
              href="https://console.cloud.google.com/google/maps-apis/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primaire underline break-all"
            >
              console.cloud.google.com/google/maps-apis/metrics
            </a>
            .
          </p>
          <p className="text-encre-douce">
            Les franchises et les tarifs unitaires affichés ici sont{" "}
            <span className="font-semibold">indicatifs</span> : ils viennent de{" "}
            <code>src/config/roswel.ts</code> et doivent être vérifiés sur la
            grille officielle de Google.
          </p>
        </div>

        {consommation.probleme && (
          <p className="rounded-2xl border border-alerte/50 bg-alerte/5 p-4 text-sm">
            ⚠ {consommation.probleme}
          </p>
        )}

        {/* ---------- Le mois en cours, par type d'appel ---------- */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">
            Ce mois-ci, type d&apos;appel par type d&apos;appel
          </h2>

          {consommation.types.map((type) => (
            <article
              key={type.cle}
              className="rounded-2xl border border-bordure bg-fond p-4 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-semibold">
                  {type.label}{" "}
                  <span className="text-xs font-normal text-encre-douce">
                    palier {PALIERS_GOOGLE[type.palier as keyof typeof PALIERS_GOOGLE]?.label ?? type.palier}
                  </span>
                </h3>
                <p className="text-sm tabular-nums">
                  <span className="font-semibold">{type.appels}</span>
                  <span className="text-encre-douce">
                    {" "}
                    sur {type.franchise.toLocaleString("fr-FR")} offerts
                  </span>
                </p>
              </div>

              <BarreFranchise part={type.part} niveau={type.niveau} />

              <p className="text-xs text-encre-douce">
                {type.aQuoiCaSert} Champs demandés : {type.champs}. Tarif
                indicatif au-delà de la franchise :{" "}
                {euros(type.coutUnitaireEuro)} par appel.
              </p>

              {/* Le détail par outil : qui consomme quoi. */}
              {type.parOutil.length > 0 ? (
                <ul className="flex flex-col gap-1 text-sm border-t border-bordure pt-3">
                  {type.parOutil.map((outil) => (
                    <li
                      key={outil.outil}
                      className="flex flex-wrap items-baseline justify-between gap-2"
                    >
                      <span>{outil.label}</span>
                      <span className="tabular-nums text-encre-douce">
                        {outil.appels} appel{outil.appels > 1 ? "s" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-encre-douce border-t border-bordure pt-3">
                  Aucun appel de ce type ce mois-ci.
                </p>
              )}

              {/* LE COÛT NE S'AFFICHE QUE S'IL EXISTE. Annoncer un
                  montant alors que le gratuit couvre tout serait
                  trompeur — et ferait hésiter à lancer un outil qui ne
                  coûte rien. */}
              {type.coutDepassementEuro > 0 && (
                <p className="text-sm rounded-xl border border-erreur/40 bg-erreur/5 p-3">
                  Franchise dépassée de{" "}
                  <span className="font-semibold tabular-nums">
                    {type.appels - type.franchise}
                  </span>{" "}
                  appel(s) : environ{" "}
                  <span className="font-semibold">
                    {euros(type.coutDepassementEuro)}
                  </span>{" "}
                  facturés sur ce type d&apos;appel ce mois-ci.
                </p>
              )}
            </article>
          ))}

          {depassements.length > 1 && (
            <p className="text-sm rounded-xl border border-erreur/40 bg-erreur/5 p-3">
              Coût estimé du mois, tous types confondus :{" "}
              <span className="font-semibold">{euros(coutTotal)}</span>. Montant
              indicatif — la facture fait foi.
            </p>
          )}

          {depassements.length === 0 && (
            <p className="text-sm text-encre-douce">
              Aucune franchise dépassée ce mois-ci :{" "}
              <span className="font-semibold">rien n&apos;est facturé.</span>
            </p>
          )}

          {consommation.echecs > 0 && (
            <p className="text-sm text-encre-douce">
              {consommation.echecs} appel(s) en échec ce mois-ci. Ils sont
              comptés : un appel refusé par Google a souvent déjà été facturé.
            </p>
          )}
        </section>

        {/* ---------- La tendance ---------- */}
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">
            Les {MOIS_HISTORIQUE_GOOGLE} derniers mois
          </h2>
          <div className="w-full min-w-0 overflow-x-auto defilement-discret">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-bordure text-left text-xs text-encre-douce">
                  <th scope="col" className="py-2 pr-3 font-semibold">Mois</th>
                  {consommation.types.map((type) => (
                    <th
                      key={type.cle}
                      scope="col"
                      className="py-2 pr-3 font-semibold text-right"
                    >
                      {type.label}
                    </th>
                  ))}
                  <th scope="col" className="py-2 font-semibold text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {consommation.historique.length === 0 ? (
                  <tr>
                    <td
                      colSpan={consommation.types.length + 2}
                      className="py-3 text-encre-douce"
                    >
                      Aucun appel enregistré pour l&apos;instant.
                    </td>
                  </tr>
                ) : (
                  consommation.historique.map((mois, index) => (
                    <tr
                      key={mois.debut}
                      className={`border-b border-bordure ${
                        index === consommation.historique.length - 1
                          ? "font-semibold"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {mois.nom}
                        {index === consommation.historique.length - 1 && (
                          <span className="text-xs font-normal text-encre-douce">
                            {" "}
                            (en cours)
                          </span>
                        )}
                      </td>
                      {mois.parType.map((type) => (
                        <td
                          key={type.cle}
                          className="py-2.5 pr-3 tabular-nums text-right"
                        >
                          {type.appels}
                        </td>
                      ))}
                      <td className="py-2.5 tabular-nums text-right">
                        {mois.total}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-encre-douce">
            Un mois sans ligne n&apos;est pas forcément un mois sans appel : le
            journal ne remonte pas avant sa mise en place.
          </p>
        </section>

        {/* ---------- Les règles, en clair ---------- */}
        <section className="rounded-2xl border border-bordure bg-fond-doux p-4 flex flex-col gap-2 text-sm">
          <h2 className="font-bold">Comment lire ces chiffres</h2>
          <p className="text-encre-douce">
            La barre passe en{" "}
            <span className="font-semibold text-alerte">orange</span> à{" "}
            {Math.round(SEUILS_CONSOMMATION_GOOGLE.attention * 100)} % de la
            franchise, en{" "}
            <span className="font-semibold text-erreur">rouge</span> à{" "}
            {Math.round(SEUILS_CONSOMMATION_GOOGLE.critique * 100)} %. Au rouge,
            un seul lot peut faire basculer en payant.
          </p>
          <p className="text-encre-douce">
            Le palier d&apos;un appel dépend des{" "}
            <span className="font-semibold">champs demandés</span>, pas de
            l&apos;adresse appelée : demander la note et le nombre d&apos;avis
            fait passer n&apos;importe quel appel en « Enterprise », le palier le
            plus cher et la franchise la plus basse (
            {PALIERS_GOOGLE.enterprise.franchiseMensuelle.toLocaleString("fr-FR")}{" "}
            appels). C&apos;est pourquoi la recherche de fiches ne demande jamais
            la note : elle attend d&apos;être sûre de la correspondance.
          </p>
        </section>
      </div>
    </main>
  );
}
