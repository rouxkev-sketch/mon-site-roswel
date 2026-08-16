"use client";

import { useState } from "react";
import { CONTACT_YOKOFOLIO } from "@/config/tatouage";

/**
 * LE FORMULAIRE DE CONTACT DE YOKOFOLIO — /contact
 * =================================================
 * Trois champs (nom, e-mail, message), la validation en français,
 * l'envoi vers /api/tatoueur/contact (enregistrement en base +
 * transmission e-mail à l'exploitant), puis un écran de confirmation.
 *
 * §1 et §3 (nº 319) — LE FORMULAIRE PASSE À LA CHARTE. Ce qui est
 * parti, et pourquoi :
 *  · LES CONTOURS des champs (`border-sombre-bordure`) — la charte
 *    n'en veut nulle part : le champ est un FOND (`eleve-clair`,
 *    #3F3F47) qui s'éclaircit au focus (`haut`, #4A4A53). La bordure
 *    de boîte reste TRANSPARENTE, et ne se peint qu'en rouge, champ
 *    par champ, quand quelque chose manque ;
 *  · LE FOCUS ROSE (`focus:border-primaire` + halo `ring-primaire/25`)
 *    — le rose ne signale JAMAIS un champ actif ;
 *  · LES ARRONDIS `rounded-xl` (12 px, l'arrondi des BLOCS) — un champ
 *    s'arrondit à 8 px (`rounded-lg`, nº 287) ;
 *  · LES LIBELLÉS AU-DESSUS DES CHAMPS (« Ton nom », « Ton adresse
 *    e-mail », « Ton message ») — les libellés vivent DANS les champs,
 *    comme partout : « Nom », « E-mail », « Message » (§3 — et plus
 *    de « Ex. Léa »). L'accessibilité les garde en `aria-label` ;
 *  · LE ROND ROSE DE LA CONFIRMATION (✓ sur `primaire-voile`) — le
 *    rose est réservé (badge sélectionné, action finale, sélecteur,
 *    état de fiche, survols de barre, porte de famille) : un décor de
 *    confirmation n'en fait pas partie.
 *
 * ⚠️ LA ROBE DU CHAMP EST CELLE DU SITE, à la lettre : la chaîne
 * `CHAMP` est la copie exacte de celle d'EcranAuthentification —
 * elle-même « la copie exacte de celui du formulaire et de Sécurité ».
 * L'encadré d'erreur général reprend `ERREUR` du même écran : la seule
 * exception de contour actée par la charte.
 */

const CHAMP =
  "w-full min-h-[52px] rounded-lg border bg-sombre-eleve-clair px-4 text-base " +
  "text-sombre-texte placeholder:text-sombre-texte-doux outline-none " +
  "transition-colors focus:bg-sombre-haut";

/** L'ERREUR — la seule exception de la charte : l'encadré rouge. */
const ERREUR =
  "rounded-lg border border-erreur/50 bg-erreur/10 px-4 py-3 text-[13px] leading-relaxed text-sombre-texte";

export function FormulaireContactYokofolio() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    const trouvees: Record<string, string> = {};
    if (nom.trim().length < 2) {
      trouvees.nom = "Ton nom (ou un pseudo) est nécessaire.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      trouvees.email = "Cette adresse e-mail n'a pas l'air complète.";
    }
    if (message.trim().length < CONTACT_YOKOFOLIO.messageMin) {
      trouvees.message = `Ton message doit faire au moins ${CONTACT_YOKOFOLIO.messageMin} caractères.`;
    }
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;

    setEnCours(true);
    try {
      const reponse = await fetch("/api/tatoueur/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "L'envoi n'a pas abouti.");
      }
      setEnvoye(true);
    } catch (erreur) {
      setErreurs({
        general:
          erreur instanceof Error
            ? erreur.message
            : "L'envoi n'a pas abouti. Réessaie dans un instant.",
      });
    } finally {
      setEnCours(false);
    }
  }

  /* ---------- LA CONFIRMATION — sobre, sans décor rose ---------- */
  if (envoye) {
    return (
      <div className="mt-10">
        <h2 className="text-[20px] font-bold text-sombre-texte">
          Message envoyé&nbsp;!
        </h2>
        <p className="mt-3 text-[15px] text-sombre-texte-doux leading-relaxed">
          Merci de nous avoir écrit — on te répond à{" "}
          <strong className="text-sombre-texte">{email.trim()}</strong>, en
          général sous 48&nbsp;heures.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} noValidate className="mt-8 flex flex-col gap-4">
      {/*  §3 — LE LIBELLÉ VIT DANS LE CHAMP : « Nom », plus de
           « ex. Léa ». La bordure est transparente au repos, rouge
           champ par champ quand quelque chose manque — jamais laissée
           à `currentColor`. */}
      <div>
        <input
          id="contact-nom"
          type="text"
          autoComplete="name"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom"
          aria-label="Nom"
          aria-invalid={Boolean(erreurs.nom)}
          className={`${CHAMP} ${erreurs.nom ? "border-erreur" : "border-transparent"}`}
        />
        {erreurs.nom && (
          <p className="mt-1.5 text-[13px] text-erreur">{erreurs.nom}</p>
        )}
      </div>

      <div>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          aria-label="E-mail"
          aria-invalid={Boolean(erreurs.email)}
          className={`${CHAMP} ${erreurs.email ? "border-erreur" : "border-transparent"}`}
        />
        {erreurs.email && (
          <p className="mt-1.5 text-[13px] text-erreur">{erreurs.email}</p>
        )}
      </div>

      <div>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={CONTACT_YOKOFOLIO.messageMax}
          placeholder="Message"
          aria-label="Message"
          aria-invalid={Boolean(erreurs.message)}
          className={`w-full rounded-lg border bg-sombre-eleve-clair px-4 py-3 text-base
                     leading-relaxed text-sombre-texte outline-none resize-y
                     placeholder:text-sombre-texte-doux transition-colors
                     focus:bg-sombre-haut ${
                       erreurs.message ? "border-erreur" : "border-transparent"
                     }`}
        />
        {erreurs.message && (
          <p className="mt-1.5 text-[13px] text-erreur">{erreurs.message}</p>
        )}
      </div>

      {erreurs.general && (
        <p role="alert" className={ERREUR}>
          {erreurs.general}
        </p>
      )}

      {/*  L'ACTION FINALE — la capsule rose pleine largeur, la seule
           de la page (la même écriture que le bouton d'authentification). */}
      <button
        type="submit"
        disabled={enCours}
        className="mt-1 inline-flex items-center justify-center rounded-full
                   min-h-[52px] bg-primaire hover:bg-primaire-fonce
                   text-white font-semibold transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {enCours ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}
