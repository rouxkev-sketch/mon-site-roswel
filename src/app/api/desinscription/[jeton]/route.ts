import { NextResponse } from "next/server";
import { desinscrire } from "@/lib/desinscription";

/**
 * DÉSINSCRIPTION EN UN CLIC (RFC 8058)
 * =====================================
 * C'est l'adresse que porte l'en-tête `List-Unsubscribe` de chaque
 * message de prospection. Gmail et Outlook affichent alors LEUR
 * bouton « Se désabonner » en haut du message : le destinataire n'a
 * pas à ouvrir quoi que ce soit, ni à chercher un lien en bas de
 * page. Un clic, un POST ici, c'est fini.
 *
 * Pourquoi une route à part de la page /desinscription/[jeton] : la
 * norme impose que l'adresse de l'en-tête réponde à une requête POST
 * sans aucune interaction. Une page, elle, doit d'abord demander
 * confirmation à un humain — les deux ne peuvent pas être la même
 * adresse.
 *
 * Deux publics, une seule route :
 *  - la messagerie envoie un POST « machine » → réponse JSON ;
 *  - le bouton de la page envoie un POST de formulaire → on renvoie
 *    l'humain vers la page, qui lui confirme que c'est fait.
 *
 * AUCUN SECRET N'EST NÉCESSAIRE : le jeton EST le secret. Il est
 * unique, imprévisible (uuid), propre à chaque prospect, et l'adresse
 * e-mail n'apparaît jamais dans l'adresse web.
 */

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jeton: string }> }
) {
  const { jeton } = await params;
  const resultat = await desinscrire(jeton);

  // Requête venue d'un navigateur (le bouton de la page) : on renvoie
  // vers la page, qui affiche le message de confirmation.
  const accepte = request.headers.get("accept") ?? "";
  if (accepte.includes("text/html")) {
    return NextResponse.redirect(
      new URL(`/desinscription/${jeton}?fait=1`, request.url),
      // 303 : le navigateur repasse en GET, et un rafraîchissement ne
      // renvoie pas le formulaire une seconde fois.
      303
    );
  }

  // Requête « machine » (Gmail, Outlook) : toujours 200, même si le
  // jeton est inconnu — une messagerie n'a que faire du détail, et
  // une erreur la ferait réessayer pour rien.
  return NextResponse.json({ ok: true, message: resultat.message });
}
