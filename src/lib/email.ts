/**
 * ENVOI DES EMAILS DE NOTIFICATION (côté serveur uniquement)
 * ----------------------------------------------------------
 * Passe par le service Resend (resend.com — gratuit jusqu'à
 * 100 emails/jour) si la clé RESEND_API_KEY est renseignée dans
 * .env.local. Sans clé : l'email est « simulé » (affiché dans le
 * terminal de `npm run dev`) pour développer sans compte.
 *
 * Rappel du cahier des charges : ces emails n'embarquent jamais le
 * contenu des messages ni l'adresse email de l'autre partie.
 */
import { MARQUE_YOKOFOLIO } from "@/config/tatouage";

/**
 * ██ nº 761 — LES COURRIELS PARTAIENT SIGNÉS « ROSWEL » ██
 * Ce repli disait `Roswel <onboarding@resend.dev>`, et il s'appliquait
 * VRAIMENT : `RESEND_EXPEDITEUR` est vide. Chaque notification envoyée
 * par YokoFolio arrivait donc dans une boîte au nom de l'ancien
 * produit. Trouvé en cherchant les derniers restes de Roswel dans le
 * code — c'était le seul qui sortait du site.
 * ⚠️ L'ADRESSE NE CHANGE PAS : `onboarding@resend.dev` est l'expéditeur
 * d'essai de Resend, le seul qui fonctionne sans domaine vérifié. Seul
 * le NOM affiché change. Le jour où un domaine sera vérifié, c'est
 * `RESEND_EXPEDITEUR` qu'on remplira — pas cette ligne.
 */
const EXPEDITEUR =
  process.env.RESEND_EXPEDITEUR ?? `${MARQUE_YOKOFOLIO.nom} <onboarding@resend.dev>`;

/** Adresse publique du site, pour construire les liens des emails.
    Réexportée depuis src/lib/site.ts : UNE SEULE source pour tout le
    site (emails, référencement, données structurées). */
export { adresseDuSite } from "@/lib/site";

export type ResultatEnvoiEmail = "envoye" | "simule" | "echec";

export type OptionsEmail = {
  /**
   * Adresse de DÉSINSCRIPTION (prospection uniquement).
   * Elle part dans deux en-têtes techniques :
   *  - `List-Unsubscribe` : Gmail et Outlook affichent alors leur
   *    propre bouton « Se désabonner » en haut du message ;
   *  - `List-Unsubscribe-Post` : la désinscription se fait en UN clic,
   *    sans ouvrir le message (RFC 8058).
   *
   * Ce n'est pas un détail de confort : depuis 2024, Gmail EXIGE ces
   * en-têtes des expéditeurs d'e-mails non sollicités. Sans eux, le
   * destinataire n'a qu'un bouton sous la main — « courrier
   * indésirable » — et c'est le domaine entier qui trinque.
   */
  desinscription?: string;
};

/**
 * L'ENVOI DÉTAILLÉ : le résultat ET l'identifiant Resend.
 * L'identifiant est indispensable à la prospection : c'est lui qui
 * permet de rapprocher, des jours plus tard, une notification de
 * rebond ou de plainte de l'envoi qui l'a provoquée.
 */
export async function envoyerEmailDetaille(
  destinataire: string,
  sujet: string,
  texte: string,
  options: OptionsEmail = {}
): Promise<{ resultat: ResultatEnvoiEmail; id: string | null }> {
  const cle = process.env.RESEND_API_KEY;

  if (!cle) {
    console.log(
      `\n📧 [SIMULATED EMAIL — set RESEND_API_KEY in .env.local to really send]\n` +
        `   To: ${destinataire}\n   Subject: ${sujet}\n` +
        (options.desinscription
          ? `   Unsubscribe: ${options.desinscription}\n`
          : "") +
        `   ${texte.replaceAll("\n", "\n   ")}\n`
    );
    return { resultat: "simule", id: null };
  }

  const entetes: Record<string, string> = {};
  if (options.desinscription) {
    entetes["List-Unsubscribe"] = `<${options.desinscription}>`;
    entetes["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: destinataire,
        subject: sujet,
        text: texte,
        ...(Object.keys(entetes).length > 0 ? { headers: entetes } : {}),
      }),
    });
    if (!reponse.ok) return { resultat: "echec", id: null };

    // Resend renvoie { id: "..." } : on le garde pour les rebonds.
    const donnees = (await reponse.json().catch(() => null)) as {
      id?: string;
    } | null;
    return { resultat: "envoye", id: donnees?.id ?? null };
  } catch {
    return { resultat: "echec", id: null }; // n'interrompt jamais l'action en cours
  }
}

/**
 * L'envoi simple, tel qu'il a toujours été : les notifications du
 * site (validation d'une fiche, message de contact…) n'ont que faire
 * de l'identifiant Resend.
 */
export async function envoyerEmail(
  destinataire: string,
  sujet: string,
  texte: string
): Promise<ResultatEnvoiEmail> {
  const { resultat } = await envoyerEmailDetaille(destinataire, sujet, texte);
  return resultat;
}
