import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import { habillerCourriel } from "@/lib/courriel-habille";
import { envoyerEmail } from "@/lib/email";
import { REACTIVER_COMPTE, cheminDeReactivation } from "@/lib/reactivation";
import { adresseDuSite } from "@/lib/site";

/**
 * ██ nº 819 — LES DEUX COURRIELS « EN COURS DE SUPPRESSION » ██
 * ==================================================================
 * Jusqu'ici, demander la suppression de son compte ou d'un portfolio
 * ne laissait qu'une notification dans la cloche — et le compte, lui,
 * était déconnecté dans la foulée : plus rien à relire. Le propriétaire
 * veut un courriel, habillé à la charte (le gabarit de la nº 817 :
 * logo, bouton rouge, pied sobre), qui dise LA DATE de la suppression
 * définitive et porte UN BOUTON qui réactive — « Reactivate my
 * account » / « Reactivate my portfolio » — vers l'annulation
 * existante (lib/reactivation dit le chemin, BlocSuppressions le joue).
 *
 * UNE SEULE ÉCRITURE pour les deux : même date, même tournure, même
 * bouton ; seuls les mots qui nomment l'objet changent. Les textes
 * sont ceux du site (lexique nº 804) : « you » direct, phrases courtes,
 * le fait puis le geste.
 * ⚠️ L'ENVOI NE BLOQUE JAMAIS LA SUPPRESSION : `envoyerEmail` ne lève
 * rien (réseau muet, clé absente → simulé), et les routes l'appellent
 * APRÈS avoir écrit en base. Le courriel est une commodité, la
 * notification reste.
 */

/** La date de suppression définitive, en toutes lettres — « October
    2, 2026 » — la lecture américaine du site (`en-US`). */
export function dateDeSuppression(purgeLe: string): string {
  return new Date(purgeLe).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function envoyerCourrielSuppression(
  destinataire: string,
  contenu: {
    sujet: string;
    titre: string;
    paragraphes: string[];
    bouton: string;
    cible: string;
  }
): Promise<void> {
  const courriel = habillerCourriel({
    titre: contenu.titre,
    paragraphes: contenu.paragraphes,
    action: {
      libelle: contenu.bouton,
      url: `${adresseDuSite()}${cheminDeReactivation(contenu.cible)}`,
    },
    note: "If you do nothing, the deletion goes ahead on that date.",
  });
  await envoyerEmail(destinataire, contenu.sujet, courriel.texte, courriel.html);
}

/** « Compte en cours de suppression » : la date, le bouton. */
export async function envoyerCourrielSuppressionCompte(
  destinataire: string,
  purgeLe: string
): Promise<void> {
  const date = dateDeSuppression(purgeLe);
  await envoyerCourrielSuppression(destinataire, {
    sujet: `Your YokoFolio account will be deleted on ${date}`,
    titre: "Account deletion in progress",
    paragraphes: [
      `You asked to delete your account. It is hidden from the site right now, portfolios included, and it will be permanently deleted on ${date} — photos included.`,
      `Changed your mind? You have ${DELAI_SUPPRESSION_JOURS} days. Reactivate your account and everything comes back as it was. Simply logging back in cancels the deletion too.`,
    ],
    bouton: "Reactivate my account",
    cible: REACTIVER_COMPTE,
  });
}

/** « Portfolio en cours de suppression » : le nom, la date, le bouton. */
export async function envoyerCourrielSuppressionPortfolio(
  destinataire: string,
  nom: string,
  id: string,
  purgeLe: string
): Promise<void> {
  const date = dateDeSuppression(purgeLe);
  await envoyerCourrielSuppression(destinataire, {
    sujet: `Your portfolio "${nom}" will be deleted on ${date}`,
    titre: "Portfolio deletion in progress",
    paragraphes: [
      `You asked to delete "${nom}". It is hidden from the site right now, and it will be permanently deleted on ${date} — photos included.`,
      `Changed your mind? You have ${DELAI_SUPPRESSION_JOURS} days. Reactivate it and everything comes back as it was. Your account and your other portfolios don't change.`,
    ],
    bouton: "Reactivate my portfolio",
    cible: id,
  });
}
