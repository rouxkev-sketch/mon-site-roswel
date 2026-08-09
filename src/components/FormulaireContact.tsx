"use client";

import { useState } from "react";
import { CONTACT, SUJETS_CONTACT } from "@/config/roswel";
import { ComposantCaptcha } from "@/components/ComposantCaptcha";
import { MenuDeroulant } from "@/components/MenuDeroulant";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * FORMULAIRE DE CONTACT (/contact)
 * --------------------------------
 * Nom, email, sujet et message obligatoire (20-1000 caractères, avec
 * compteur). Vérification anti-robots invisible (Turnstile, si
 * configurée). À l'envoi, message transmis par email à l'exploitant.
 * La confirmation est toujours la même, qu'un garde-fou anti-spam
 * serveur ait ou non laissé passer le message.
 */
export function FormulaireContact() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState(SUJETS_CONTACT[0].cle);
  const [message, setMessage] = useState("");
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [retour, setRetour] = useState<string | null>(null);

  const captchaActif = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const messageAssezLong = message.trim().length >= CONTACT.messageMin;
  const pret =
    nom.trim() !== "" &&
    EMAIL_OK.test(email.trim()) &&
    messageAssezLong &&
    !enCours;

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!pret) return;
    if (captchaActif && !jetonCaptcha) {
      setRetour(
        "La vérification anti-robots se termine… réessaie dans une seconde."
      );
      return;
    }
    setEnCours(true);
    setRetour(null);
    try {
      const reponse = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          sujet,
          message: message.trim(),
          jetonCaptcha: jetonCaptcha ?? undefined,
        }),
      });
      const resultat = (await reponse.json()) as { ok: boolean; message: string };
      if (resultat.ok) setEnvoye(true);
      else {
        setRetour(resultat.message);
        setEnCours(false);
      }
    } catch {
      setRetour("Envoi impossible pour le moment. Réessaie plus tard.");
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <div className="rounded-3xl border border-bordure bg-fond-doux p-6 text-center">
        <p className="text-2xl" aria-hidden>
          ✓
        </p>
        <p className="mt-2 font-semibold">{CONTACT.messageConfirmation}</p>
      </div>
    );
  }

  const champ =
    "min-h-[48px] rounded-2xl border border-bordure bg-fond px-4 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25";

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nom</span>
        <input
          type="text"
          autoComplete="name"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className={champ}
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={champ}
          required
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Sujet</span>
        {/* Le MÊME menu déroulant que « Catégorie d'artisan » et
            « Ville » : contour + flèche rose à l'ouverture. */}
        <MenuDeroulant
          valeur={sujet}
          surChangement={setSujet}
          options={SUJETS_CONTACT.map(({ cle, label }) => ({ value: cle, label }))}
          ariaLabel="Sujet"
          hauteur="min-h-[48px]"
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Message</span>
        <textarea
          value={message}
          onChange={(e) =>
            setMessage(e.target.value.slice(0, CONTACT.messageMax))
          }
          rows={6}
          maxLength={CONTACT.messageMax}
          placeholder={`Votre message (${CONTACT.messageMin} caractères minimum)`}
          className="rounded-2xl border border-bordure bg-fond px-4 py-3 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25 resize-none"
          required
        />
        <span
          className={`text-xs text-right ${
            messageAssezLong || message.length === 0
              ? "text-encre-douce"
              : "text-erreur"
          }`}
        >
          {message.length}/{CONTACT.messageMax}
        </span>
      </label>

      {/* Vérification anti-robots invisible (si configurée) */}
      <ComposantCaptcha surJeton={setJetonCaptcha} />

      {retour && (
        <p className="text-sm text-encre-douce bg-fond-doux border border-bordure rounded-2xl p-3">
          {retour}
        </p>
      )}

      <button
        type="submit"
        disabled={!pret}
        className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full min-h-[52px] text-base transition-colors disabled:opacity-45"
      >
        {enCours ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
