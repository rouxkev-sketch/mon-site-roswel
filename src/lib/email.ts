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
  /**
   * nº 817 — LA VERSION HABILLÉE du courriel (lib/courriel-habille).
   * Elle part À CÔTÉ du texte, jamais à sa place : Resend envoie les
   * deux, et le client de messagerie choisit. Sans elle, le courriel
   * part en texte nu, comme avant.
   */
  html?: string;
};

/** L'adresse de l'API de Resend — la vraie, celle qui envoie. */
const RESEND = "https://api.resend.com/emails";

/**
 * ██ §1 (nº 830) — L'ADRESSE DE L'API NE PEUT PLUS DÉTOURNER ██
 * ------------------------------------------------------------------
 * `RESEND_API_URL` est né à la nº 817 POUR LES BANCS : une doublure
 * locale qui garde ce qu'on lui envoie au lieu de l'expédier. La note
 * disait « en production la variable n'existe pas » — c'était une
 * ESPÉRANCE, pas une garantie. Elle ne figure même pas dans
 * `.env.local.example` : personne ne savait qu'elle existait, donc
 * personne n'aurait pensé à la chercher si elle se retrouvait posée
 * sur l'hébergeur. Or elle aurait fait EXACTEMENT ce que le
 * propriétaire décrit : chaque envoi part ailleurs, échoue, et
 * personne n'en sait rien.
 *
 * LA RÈGLE : ELLE N'EST HONORÉE QUE SI ELLE DÉSIGNE CETTE MACHINE.
 * Toute autre adresse est refusée, et le refus se dit.
 * ⚠️ POURQUOI PAS « SEULEMENT HORS PRODUCTION », qui semblait plus
 * simple : parce que LES BANCS TOURNENT EN PRODUCTION. Ils bâtissent
 * le site puis le servent par `next start`, et Next y pose
 * `NODE_ENV=production` — la garde aurait donc coupé les bancs sans
 * rien protéger de plus. La leçon est plus large que cette variable :
 * un garde-fou réglé sur l'environnement se trompe de cible dès qu'un
 * banc s'exécute comme la production. Ici c'est L'ADRESSE qui décide,
 * et une adresse locale ne peut désigner un service d'envoi que sur
 * la machine où l'on travaille.
 */
const LOCALE = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/;

function adresseDeLApi(): string {
  const demandee = process.env.RESEND_API_URL;
  if (!demandee) return RESEND;
  if (LOCALE.test(demandee)) return demandee;
  console.error(
    `📧 RESEND_API_URL vaut « ${demandee} » : elle ne désigne pas cette ` +
      "machine et sera IGNORÉE. Cette variable ne sert qu'aux bancs ; " +
      "les envois partent chez Resend."
  );
  return RESEND;
}

/**
 * ██ §2 (nº 830) — UN ENVOI QUI ÉCHOUE DOIT LE DIRE ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE : « aucun e-mail ne part en production ».
 * Le message de contact arrivait bien en base et dans l'écran
 * d'administration, mais rien dans la boîte — et RIEN NULLE PART pour
 * dire pourquoi.
 * LA CAUSE DE CETTE CÉCITÉ, ici même : l'échec était rendu SANS ÊTRE
 * LU. `if (!reponse.ok) return { resultat: "echec" }` jetait le corps
 * de la réponse, qui est précisément l'endroit où Resend écrit la
 * raison. Le `catch` faisait de même. Un envoi pouvait donc rater
 * cent fois de suite sans laisser une ligne.
 * ⚠️ ON NE FAIT JAMAIS ÉCHOUER L'ACTION EN COURS pour autant : un
 * message de contact enregistré ne doit pas être perdu parce que sa
 * notification n'est pas partie. C'est la règle d'origine, et elle
 * reste. Ce qui change, c'est qu'on SAIT.
 * ⚠️ LA RAISON EST RECOPIÉE TELLE QUELLE, sans interprétation : c'est
 * Resend qui sait pourquoi il refuse, pas nous.
 */
function direLEchec(ou: string, quoi: string): void {
  console.error(`📧 ENVOI REFUSÉ (${ou}) — ${quoi}`);
}

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
    /*  §3 (nº 830) — SANS CLÉ, EN PRODUCTION, C'EST UNE PANNE. En
        développement, la simulation est le confort voulu depuis
        toujours : on travaille sans compte Resend. EN LIGNE, c'est
        tout autre chose — le site croit envoyer et n'envoie rien, et
        le journal n'en disait qu'un mot rassurant (« SIMULATED »).
        C'est l'un des deux états qui produisent EXACTEMENT ce que le
        propriétaire décrit. Il se dit donc comme une erreur. */
    if (process.env.NODE_ENV === "production") {
      direLEchec(
        destinataire,
        "RESEND_API_KEY est ABSENTE de l'hébergeur : aucun e-mail ne peut " +
          "partir. À poser dans les variables d'environnement du projet."
      );
      return { resultat: "echec", id: null };
    }
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
    const reponse = await fetch(adresseDeLApi(), {
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
        ...(options.html ? { html: options.html } : {}),
        ...(Object.keys(entetes).length > 0 ? { headers: entetes } : {}),
      }),
    });
    if (!reponse.ok) {
      //  LE CORPS DE LA RÉPONSE EST LA RAISON : on le lit, on le dit.
      const raison = await reponse.text().catch(() => "");
      direLEchec(destinataire, `Resend a répondu ${reponse.status} — ${raison || "(corps vide)"}`);
      /*  §4 (nº 830) — LE PIÈGE DE L'EXPÉDITEUR D'ESSAI, NOMMÉ. Sans
          domaine vérifié, `RESEND_EXPEDITEUR` est vide et l'on retombe
          sur `onboarding@resend.dev` — l'adresse d'essai de Resend,
          qui N'ACCEPTE QUE LE PROPRIÉTAIRE DU COMPTE comme
          destinataire. Tout e-mail à un artiste, à un visiteur, à
          quiconque d'autre est refusé. C'est le second des deux états
          qui produisent ce que le propriétaire décrit, et il ne se
          devine pas : on le dit en clair, avec le geste qui le règle. */
      if (/only send testing emails|verify a domain|not verified/i.test(raison)) {
        direLEchec(
          destinataire,
          `L'EXPÉDITEUR EST CELUI D'ESSAI (${EXPEDITEUR}). Sans domaine ` +
            "vérifié chez Resend, il n'écrit qu'au propriétaire du compte. " +
            "Vérifier un domaine sur resend.com/domains, puis poser " +
            "RESEND_EXPEDITEUR sur l'hébergeur."
        );
      }
      return { resultat: "echec", id: null };
    }

    // Resend renvoie { id: "..." } : on le garde pour les rebonds.
    const donnees = (await reponse.json().catch(() => null)) as {
      id?: string;
    } | null;
    return { resultat: "envoye", id: donnees?.id ?? null };
  } catch (erreur) {
    //  Le réseau, un nom d'hôte qui ne répond pas, un pare-feu : la
    //  cause est dans l'exception, et elle était jetée elle aussi.
    direLEchec(
      destinataire,
      `l'appel n'a pas abouti — ${erreur instanceof Error ? erreur.message : String(erreur)}`
    );
    return { resultat: "echec", id: null }; // n'interrompt jamais l'action en cours
  }
}

/**
 * L'envoi simple, tel qu'il a toujours été : les notifications du
 * site (validation d'une fiche, message de contact…) n'ont que faire
 * de l'identifiant Resend.
 * nº 817 — `html`, facultatif : la version habillée, à côté du texte.
 */
export async function envoyerEmail(
  destinataire: string,
  sujet: string,
  texte: string,
  html?: string
): Promise<ResultatEnvoiEmail> {
  const { resultat } = await envoyerEmailDetaille(destinataire, sujet, texte, {
    html,
  });
  return resultat;
}

/**
 * ██ §5 (nº 830) — L'ÉTAT DE LA CHAÎNE D'ENVOI, EN UN COUP D'ŒIL ██
 * ------------------------------------------------------------------
 * Trois choses peuvent empêcher un e-mail de partir, et AUCUNE n'était
 * visible d'où que ce soit :
 *  1. la CLÉ manque sur l'hébergeur (le site simule et se tait) ;
 *  2. l'EXPÉDITEUR est celui d'essai de Resend, qui n'écrit qu'au
 *     propriétaire du compte — tout autre destinataire est refusé ;
 *  3. l'ADRESSE DE L'API a été détournée par `RESEND_API_URL`.
 * Cette fonction les dit toutes les trois, et si on lui donne un
 * destinataire, elle TENTE UN VRAI ENVOI et rend la réponse de Resend
 * telle quelle.
 * ⚠️ ELLE NE REND JAMAIS LA CLÉ — seulement sa présence et sa
 * longueur. Une clé ne se montre pas, même à l'administration.
 */
export async function diagnosticCourriel(destinataire?: string): Promise<{
  cle: { presente: boolean; longueur: number };
  expediteur: string;
  expediteurDEssai: boolean;
  adresseApi: string;
  adresseDetournee: boolean;
  environnement: string;
  essai?: { statut: number | null; reponse: string; parti: boolean };
}> {
  const cle = process.env.RESEND_API_KEY ?? "";
  const demandee = process.env.RESEND_API_URL;
  const etat = {
    cle: { presente: cle.length > 0, longueur: cle.length },
    expediteur: EXPEDITEUR,
    expediteurDEssai: EXPEDITEUR.includes("resend.dev"),
    adresseApi: adresseDeLApi(),
    adresseDetournee: Boolean(demandee) && adresseDeLApi() !== demandee,
    environnement: process.env.NODE_ENV ?? "(inconnu)",
  };
  if (!destinataire) return etat;

  if (!cle) {
    return {
      ...etat,
      essai: {
        statut: null,
        reponse: "RESEND_API_KEY absente : rien n'a été tenté.",
        parti: false,
      },
    };
  }
  try {
    const reponse = await fetch(adresseDeLApi(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: destinataire,
        subject: `${MARQUE_YOKOFOLIO.nom} — email delivery check`,
        text:
          "This is the delivery check from your admin panel.\n" +
          "If you are reading it, sending works.",
      }),
    });
    const brut = await reponse.text().catch(() => "");
    return {
      ...etat,
      essai: { statut: reponse.status, reponse: brut, parti: reponse.ok },
    };
  } catch (erreur) {
    return {
      ...etat,
      essai: {
        statut: null,
        reponse: erreur instanceof Error ? erreur.message : String(erreur),
        parti: false,
      },
    };
  }
}
