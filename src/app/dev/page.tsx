import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TableauDeBordDesSondes from "@/components/TableauDeBordDesSondes";
import { verifierAdmin } from "@/lib/admin-yokofolio";

/**
 * ██ §1 (nº 790) — LE VERROU ADMIN DEVANT LE TABLEAU DE BORD ██
 * ==================================================================
 * CE QUE LE PROPRIÉTAIRE DEMANDE, AVANT LA MISE EN LIGNE : la page est
 * GARDÉE — elle sert encore — mais elle n'est ouverte qu'au compte
 * admin. Tout autre visiteur reçoit la page introuvable du site.
 *
 * POURQUOI ELLE NE POUVAIT PAS SE GARDER TOUTE SEULE JUSQU'ICI : elle
 * était `"use client"` de bout en bout. Un écran client ne peut que
 * DEMANDER qui est connecté, une fois la page déjà envoyée — le code
 * du tableau de bord serait parti dans le navigateur de n'importe qui,
 * et un simple retrait de la ligne qui affiche le refus l'aurait
 * rouvert. Le corps est donc passé dans
 * `src/components/TableauDeBordDesSondes` (il n'a pas changé), et
 * cette page-ci est devenue une page SERVEUR : elle interroge la
 * session AVANT de rendre quoi que ce soit.
 *
 * ⚠️ MÊME MÉCANISME QUE /admin, littéralement : `verifierAdmin()`
 * (src/lib/admin-yokofolio) — la session lue dans les cookies côté
 * serveur, l'adresse comparée à COURRIELS_ADMIN. Une seule écriture de
 * la règle, comme partout ailleurs.
 *
 * ⚠️ REFUS = INTROUVABLE, ET NON « ACCÈS REFUSÉ ». Un message d'accès
 * refusé annonce à qui passe par là qu'il y a quelque chose à trouver ;
 * `notFound()` rend la page 404 du site — la même que pour une adresse
 * qui n'a jamais existé. Déconnecté ou compte ordinaire : même réponse,
 * on ne distingue pas les deux.
 *
 * ⚠️ ET LES ROUTES DE SERVICE AVEC : `api/dev/journal-de-bord` et
 * `api/dev/journal-sonde` portent le même verrou. Garder la page sans
 * garder les routes n'aurait rien gardé du tout.
 */

//  Elle lit la session : rien à préparer d'avance, jamais de cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sondes de développement",
  //  Un outil d'atelier n'a rien à faire dans un moteur de recherche.
  robots: { index: false, follow: false },
};

export default async function PageDesSondes() {
  if (await verifierAdmin()) notFound();
  return <TableauDeBordDesSondes />;
}
