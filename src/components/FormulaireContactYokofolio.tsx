"use client";

import { useState } from "react";
import { CONTACT_YOKOFOLIO } from "@/config/tatouage";
import { IconeCocheListe } from "@/components/Icones";
//  §1 (nº 664) — la pastille d'événement de la famille.
import { PastilleEvenement } from "@/components/PastilleEvenement";

/**
 * LE FORMULAIRE DE CONTACT DE YOKOFOLIO — /contact
 * =================================================
 * Trois champs (nom, e-mail, message), la validation en français,
 * l'envoi vers /api/tatoueur/contact (enregistrement en base +
 * transmission e-mail à l'exploitant via le service existant), puis
 * un écran de confirmation. Charte sombre du site, sobre.
 *
 * ⚠️⚠️ EXCEPTION DE MISE EN PAGE — LA RÈGLE, ET ELLE FAIT AUTORITÉ ICI
 * ==================================================================
 * CES DEUX PAGES ONT LEUR PROPRE MISE EN PAGE, PLUS LIBRE QUE LA
 * CHARTE DU RESTE DU SITE. C'EST UNE EXCEPTION ASSUMÉE, DÉCIDÉE PAR LE
 * PROPRIÉTAIRE À LA PASSE Nº 320 APRÈS AVOIR VU LE RÉSULTAT DE LEUR
 * PASSAGE À LA CHARTE. AUCUNE PASSE FUTURE NE DOIT LES Y RAMENER.
 *
 * (« ces deux pages » : /contact — dont ce formulaire — et
 * /qui-sommes-nous.)
 *
 * SONT DONC VOULUS ICI, et ne sont PAS des oublis de charte :
 *  · les CONTOURS des champs (`border-sombre-bordure`) ;
 *  · le FOCUS ROSE et son halo (`focus:border-primaire`,
 *    `focus:ring-2 focus:ring-primaire/25`) ;
 *  · les ARRONDIS DE 12 px (`rounded-xl`) sur des champs ;
 *  · les LIBELLÉS AU-DESSUS des champs ;
 *  · le ROND ROSE de l'écran de confirmation.
 * La nº 319 les avait tous retirés : c'est ANNULÉ.
 *
 * ⚠️ SAUF DEUX MOTS, GARDÉS DE LA nº 319 SUR CONSIGNE : le champ du
 * nom affiche « Nom » et celui du courriel « E-mail », DANS le champ —
 * même si cette mise en page pose par ailleurs ses libellés au-dessus.
 * Le libellé du dessus reste, lui, pour le lecteur d'écran et le clic
 * (`<label htmlFor>`) : ce sont deux choses différentes, et le
 * propriétaire n'a demandé que le mot DANS le champ. Le troisième
 * champ (message) n'était pas visé : sa phrase indicative d'avant ne
 * bouge pas.
 */

const CHAMP =
  "w-full min-h-[52px] rounded-xl border bg-sombre-eleve px-4 text-base " +
  "text-sombre-texte placeholder:text-sombre-texte-doux outline-none " +
  "transition-colors focus:border-primaire focus:ring-2 focus:ring-primaire/25";

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

  /* ---------- LA CONFIRMATION ---------- */
  if (envoye) {
    return (
      <div className="mt-10 text-center">
        {/*  ██ §3 (nº 664) — CE CERCLE N'ÉTAIT PAS UNE ICÔNE ██
             C'était le CARACTÈRE « ✓ » posé dans un rond, en `text-3xl`.
             Il ne suivait donc aucune décision de la famille — ni son
             trait, ni sa taille, ni ses tons — et il changeait de dessin
             avec la police de l'appareil. Le propriétaire demande la
             vraie coche.
             DEUX AUTRES CHOSES RENTRENT DANS LE RANG : le cercle faisait
             64 px, la plus grande taille du site et la seule fois où
             elle servait ; et le ton passe du rose au vert — le message
             est PARTI, il n'attend aucune décision. */}
        <PastilleEvenement
          ton="valide"
          symbole={IconeCocheListe}
          classe="mx-auto"
        />
        <h2 className="mt-5 text-[clamp(1.3rem,3vw,1.6rem)] font-bold text-sombre-texte">
          Message envoyé !
        </h2>
        <p className="mt-3 text-sombre-texte-doux leading-relaxed">
          Merci de nous avoir écrit — on te répond à{" "}
          <strong className="text-sombre-texte">{email.trim()}</strong>, en
          général sous 48 heures.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} noValidate className="mt-8 flex flex-col gap-4">
      <div>
        <label
          htmlFor="contact-nom"
          className="block text-sm font-medium text-sombre-texte mb-1.5"
        >
          Ton nom
        </label>
        <input
          id="contact-nom"
          type="text"
          autoComplete="name"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          //  §1 (nº 320) — GARDÉ DE LA nº 319 : « Nom », dans le champ.
          placeholder="Nom"
          aria-invalid={Boolean(erreurs.nom)}
          className={`${CHAMP} ${erreurs.nom ? "border-erreur" : "border-sombre-bordure"}`}
        />
        {erreurs.nom && (
          <p className="mt-1.5 text-[13px] text-erreur">{erreurs.nom}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-sombre-texte mb-1.5"
        >
          Ton adresse e-mail
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          //  §1 (nº 320) — GARDÉ DE LA nº 319 : « E-mail », dans le champ.
          placeholder="E-mail"
          aria-invalid={Boolean(erreurs.email)}
          className={`${CHAMP} ${erreurs.email ? "border-erreur" : "border-sombre-bordure"}`}
        />
        {erreurs.email && (
          <p className="mt-1.5 text-[13px] text-erreur">{erreurs.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-sombre-texte mb-1.5"
        >
          Ton message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={CONTACT_YOKOFOLIO.messageMax}
          placeholder="Une question, une idée, un problème — on lit tout."
          aria-invalid={Boolean(erreurs.message)}
          className={`w-full rounded-xl border bg-sombre-eleve px-4 py-3 text-base
                     leading-relaxed text-sombre-texte outline-none resize-y
                     placeholder:text-sombre-texte-doux transition-colors
                     focus:border-primaire focus:ring-2 focus:ring-primaire/25 ${
                       erreurs.message ? "border-erreur" : "border-sombre-bordure"
                     }`}
        />
        {erreurs.message && (
          <p className="mt-1.5 text-[13px] text-erreur">{erreurs.message}</p>
        )}
      </div>

      {erreurs.general && (
        <p
          role="alert"
          className="rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3 text-sm text-sombre-texte"
        >
          {erreurs.general}
        </p>
      )}

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
