"use client";

import { useState } from "react";
import { RENDEZ_VOUS } from "@/config/agence";

/**
 * LE FORMULAIRE DE PRISE DE RENDEZ-VOUS
 * ======================================
 * Sept champs, dont un facultatif. La validation se fait DEUX FOIS :
 * ici pour répondre tout de suite, et sur le serveur parce qu'un
 * contrôle côté navigateur se contourne en dix secondes.
 *
 * COMMENT LES ERREURS SE COMPORTENT — c'est ce qui distingue un
 * formulaire agréable d'un formulaire pénible :
 *  - RIEN n'est signalé tant qu'on n'a pas essayé d'envoyer. Voir
 *    « champ obligatoire » sur un champ qu'on n'a pas encore atteint
 *    est décourageant, et faux ;
 *  - après un envoi refusé, l'erreur d'un champ DISPARAÎT dès qu'on
 *    le corrige, sans attendre un second envoi ;
 *  - le premier champ fautif reçoit le focus : au clavier, on
 *    n'a pas à chercher où ça coince ;
 *  - chaque erreur est reliée à son champ par `aria-describedby`, et
 *    `aria-invalid` la signale — un lecteur d'écran annonce donc le
 *    problème en arrivant sur le champ, pas seulement la couleur.
 */

type Champs = {
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  taille: string;
  besoin: string;
};

const VIDE: Champs = {
  nom: "",
  entreprise: "",
  email: "",
  telephone: "",
  taille: "",
  besoin: "",
};

/** Contrôle volontairement simple : le vrai test, c'est la réception. */
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Les mêmes règles que le serveur, mot pour mot. */
function verifier(champs: Champs): Partial<Record<keyof Champs, string>> {
  const erreurs: Partial<Record<keyof Champs, string>> = {};
  if (champs.nom.trim().length < 2) {
    erreurs.nom = "Merci d'indiquer votre nom.";
  }
  if (champs.entreprise.trim().length < 2) {
    erreurs.entreprise = "Merci d'indiquer le nom de votre entreprise.";
  }
  if (!EMAIL_OK.test(champs.email.trim())) {
    erreurs.email = "Une adresse du type nom@entreprise.fr est attendue.";
  }
  if (!champs.taille) {
    erreurs.taille = "Merci de choisir la taille de votre entreprise.";
  }
  const besoin = champs.besoin.trim();
  if (besoin.length < RENDEZ_VOUS.besoinMin) {
    erreurs.besoin = `Quelques mots de plus, s'il vous plaît (${RENDEZ_VOUS.besoinMin} caractères minimum).`;
  } else if (besoin.length > RENDEZ_VOUS.besoinMax) {
    erreurs.besoin = `Message trop long (${RENDEZ_VOUS.besoinMax} caractères maximum).`;
  }
  return erreurs;
}

const CLASSE_ETIQUETTE = "block text-[15px] font-semibold mb-2";
const CLASSE_CHAMP =
  "w-full min-h-[52px] rounded-xl border bg-white px-4 text-base text-black " +
  "outline-none transition-colors placeholder:text-black/35 " +
  "focus:border-primaire focus:ring-2 focus:ring-primaire/25";

export function FormulaireRendezVous() {
  const [champs, setChamps] = useState<Champs>(VIDE);
  const [erreurs, setErreurs] = useState<Partial<Record<keyof Champs, string>>>({});
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [echec, setEchec] = useState<string | null>(null);

  function modifier(nom: keyof Champs, valeur: string) {
    setChamps((c) => ({ ...c, [nom]: valeur }));
    // L'erreur s'efface dès que le champ redevient valable.
    setErreurs((e) => {
      if (!e[nom]) return e;
      const suivantes = verifier({ ...champs, [nom]: valeur });
      const copie = { ...e };
      if (!suivantes[nom]) delete copie[nom];
      return copie;
    });
  }

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (envoi) return;
    setEchec(null);

    const trouvees = verifier(champs);
    setErreurs(trouvees);
    const premiere = Object.keys(trouvees)[0];
    if (premiere) {
      document.getElementById(`rdv-${premiere}`)?.focus();
      return;
    }

    setEnvoi(true);
    try {
      const reponse = await fetch("/api/rendez-vous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(champs),
      });
      const donnees = (await reponse.json()) as { ok: boolean; message?: string };
      if (donnees.ok) setEnvoye(true);
      else setEchec(donnees.message ?? "L'envoi n'a pas abouti.");
    } catch {
      setEchec(
        "Pas de réponse du serveur. Vérifier la connexion, puis réessayer."
      );
    }
    setEnvoi(false);
  }

  // ----- La confirmation remplace le formulaire -----
  if (envoye) {
    return (
      <div
        role="status"
        className="rounded-3xl bg-black/[0.035] px-7 sm:px-10 py-12 text-center"
      >
        <span
          aria-hidden="true"
          className="mx-auto w-14 h-14 rounded-full bg-primaire text-white
                     flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h2 className="mt-6 text-[clamp(1.4rem,3vw,1.9rem)] font-bold tracking-[-0.015em]">
          {RENDEZ_VOUS.confirmationTitre}
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-black/60">
          {RENDEZ_VOUS.confirmationTexte}
        </p>
      </div>
    );
  }

  const restants = RENDEZ_VOUS.besoinMax - champs.besoin.length;

  return (
    <form onSubmit={envoyer} noValidate className="flex flex-col gap-6">
      {/* Nom + entreprise, côte à côte dès qu'il y a la place. */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Champ
          nom="nom"
          etiquette="Nom"
          valeur={champs.nom}
          erreur={erreurs.nom}
          surChangement={modifier}
          autoComplete="name"
          placeholder="Prénom et nom"
        />
        <Champ
          nom="entreprise"
          etiquette="Entreprise"
          valeur={champs.entreprise}
          erreur={erreurs.entreprise}
          surChangement={modifier}
          autoComplete="organization"
          placeholder="Nom de votre entreprise"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Champ
          nom="email"
          etiquette="E-mail"
          type="email"
          valeur={champs.email}
          erreur={erreurs.email}
          surChangement={modifier}
          autoComplete="email"
          placeholder="nom@entreprise.fr"
        />
        <Champ
          nom="telephone"
          etiquette="Téléphone"
          facultatif
          type="tel"
          valeur={champs.telephone}
          erreur={erreurs.telephone}
          surChangement={modifier}
          autoComplete="tel"
          placeholder="06 12 34 56 78"
        />
      </div>

      {/* Taille de l'entreprise */}
      <div>
        <label htmlFor="rdv-taille" className={CLASSE_ETIQUETTE}>
          Taille de l&apos;entreprise
        </label>
        <select
          id="rdv-taille"
          name="taille"
          value={champs.taille}
          onChange={(e) => modifier("taille", e.target.value)}
          aria-invalid={Boolean(erreurs.taille)}
          aria-describedby={erreurs.taille ? "erreur-taille" : undefined}
          className={`${CLASSE_CHAMP} appearance-none pr-10 ${
            erreurs.taille ? "border-erreur" : "border-black/15"
          }`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23EE3D6F' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.9rem center",
          }}
        >
          <option value="">Choisir…</option>
          {RENDEZ_VOUS.taillesEntreprise.map((taille) => (
            <option key={taille.valeur} value={taille.valeur}>
              {taille.label}
            </option>
          ))}
        </select>
        {erreurs.taille && <Erreur id="erreur-taille">{erreurs.taille}</Erreur>}
      </div>

      {/* Le besoin */}
      <div>
        <label htmlFor="rdv-besoin" className={CLASSE_ETIQUETTE}>
          Décrivez votre besoin
        </label>
        <textarea
          id="rdv-besoin"
          name="besoin"
          rows={6}
          value={champs.besoin}
          onChange={(e) => modifier("besoin", e.target.value)}
          maxLength={RENDEZ_VOUS.besoinMax}
          aria-invalid={Boolean(erreurs.besoin)}
          aria-describedby={`compteur-besoin${erreurs.besoin ? " erreur-besoin" : ""}`}
          placeholder="Ce que vous aimeriez automatiser, améliorer ou comprendre."
          className={`${CLASSE_CHAMP} min-h-[160px] py-3.5 leading-relaxed resize-y ${
            erreurs.besoin ? "border-erreur" : "border-black/15"
          }`}
        />
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          {erreurs.besoin ? (
            <Erreur id="erreur-besoin">{erreurs.besoin}</Erreur>
          ) : (
            <span />
          )}
          <span
            id="compteur-besoin"
            className="text-[13px] text-black/40 tabular-nums"
          >
            {restants} caractères restants
          </span>
        </div>
      </div>

      {echec && (
        <p
          role="alert"
          className="rounded-xl border border-erreur/40 bg-erreur/5 px-4 py-3 text-[15px]"
        >
          {echec}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={envoi}
          className="inline-flex items-center justify-center rounded-full bg-primaire
                     hover:bg-primaire-fonce disabled:opacity-60 text-white font-semibold
                     transition-colors px-9 h-14 text-base
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-primaire"
        >
          {envoi ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------
 * Les briques du formulaire
 * ------------------------------------------------------------------ */

function Erreur({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-[13px] font-medium text-erreur">
      {children}
    </p>
  );
}

function Champ({
  nom,
  etiquette,
  valeur,
  erreur,
  surChangement,
  type = "text",
  facultatif = false,
  autoComplete,
  placeholder,
}: {
  nom: keyof Champs;
  etiquette: string;
  valeur: string;
  erreur?: string;
  surChangement: (nom: keyof Champs, valeur: string) => void;
  type?: string;
  facultatif?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const id = `rdv-${nom}`;
  return (
    <div>
      <label htmlFor={id} className={CLASSE_ETIQUETTE}>
        {etiquette}
        {facultatif && (
          <span className="ml-2 font-normal text-black/40">(facultatif)</span>
        )}
      </label>
      <input
        id={id}
        name={nom}
        type={type}
        value={valeur}
        onChange={(e) => surChangement(nom, e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(erreur)}
        aria-describedby={erreur ? `erreur-${nom}` : undefined}
        className={`${CLASSE_CHAMP} ${erreur ? "border-erreur" : "border-black/15"}`}
      />
      {erreur && (
        <div className="mt-2">
          <Erreur id={`erreur-${nom}`}>{erreur}</Erreur>
        </div>
      )}
    </div>
  );
}
