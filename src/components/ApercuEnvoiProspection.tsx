"use client";

import { useEffect, useState } from "react";
import { FenetreModale } from "@/components/FenetreModale";

/**
 * L'ÉCRAN D'APERÇU AVANT ENVOI
 * =============================
 * Le dernier arrêt avant que des messages partent à de vraies
 * personnes. On y voit les textes EXACTS, avec les vraies données —
 * pas un modèle avec des {étiquettes}. Une faute de calcul dans le
 * score, une ville manquante, un nom d'entreprise bancal : ça se voit
 * ici, pas dans la boîte de réception d'un artisan.
 *
 * DEUX POPULATIONS, DEUX GESTES, UN SEUL ÉCRAN :
 *  - AVEC ADRESSE → « Mettre en file d'attente ». Les messages
 *    partiront tout seuls, étalés dans la journée, même navigateur
 *    fermé.
 *  - SANS ADRESSE → le message est prêt à être recopié dans le
 *    formulaire de contact de leur site. Un bouton « Copier », un lien
 *    vers le site, et « Marquer comme envoyé » pour ne pas le refaire
 *    deux fois. Ces contacts-là ne comptent PAS dans le quota.
 */

export type MessagePret = {
  prospectId: string;
  entreprise: string;
  email: string | null;
  siteInternet: string | null;
  numeroRelance: number;
  gabarit: string;
  sujet: string;
  texte: string;
  lienDesinscription: string;
};

export type Apercu = {
  ok: boolean;
  message?: string;
  automatiques: MessagePret[];
  aLaMain: MessagePret[];
  ecartes: Array<{ entreprise: string; raison: string }>;
  quotaRestant: number;
  horsPlage: boolean;
  premierDepart: string;
};

const NOM_ETAPE: Record<string, string> = {
  premierContact: "Premier contact",
  relance1: "Relance 1 (J+7)",
  relance2: "Relance 2 (J+14)",
  relance3: "Relance 3 (J+30)",
};

/** « 14 h 05 », heure de Paris — la même que celle du moteur d'envoi. */
function heureLisible(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(new Date(iso))
      .replace(":", " h ");
  } catch {
    return "—";
  }
}

export function ApercuEnvoiProspection({
  surFermeture,
  prospectIds,
  commune,
  apercu: modeApercu = false,
  donneesFictives = null,
  surEnvoiEffectue,
}: {
  surFermeture: () => void;
  prospectIds: string[];
  /** Le filtre commune en cours : il borne la liste « sans adresse ». */
  commune: string;
  /** Page de démonstration : rien ne part, rien n'est enregistré. */
  apercu?: boolean;
  /**
   * Messages FICTIFS fournis par la page de démonstration. Quand ils
   * sont là, aucun appel réseau : la mise en page se vérifie sans
   * base de données, exactement comme le reste de l'aperçu.
   */
  donneesFictives?: Apercu | null;
  /** Appelé après une mise en file réussie (pour rafraîchir la page). */
  surEnvoiEffectue: () => void;
}) {
  const [donnees, setDonnees] = useState<Apercu | null>(donneesFictives);
  // Vrai dès le montage : le composant n'est monté QUE lorsque la
  // fenêtre s'ouvre, et la première chose qu'il fait est de demander
  // l'aperçu. Partir de `true` évite de remettre un état à zéro dans
  // l'effet — React déconseille formellement d'y appeler setState.
  const [chargement, setChargement] = useState(donneesFictives === null);
  const [probleme, setProbleme] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [resultat, setResultat] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [copie, setCopie] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, boolean>>({});

  // L'aperçu est demandé À CHAQUE ouverture : entre deux ouvertures,
  // une désinscription ou un rebond a pu tout changer.
  useEffect(() => {
    // Démonstration : les messages sont déjà là, on ne demande rien.
    if (donneesFictives !== null) return;
    let annule = false;

    (async () => {
      try {
        const reponse = await fetch("/api/admin/prospection-envoi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apercu: true, prospectIds, commune }),
        });
        const recu = (await reponse.json()) as Apercu;
        if (annule) return;
        if (!recu.ok) {
          setProbleme(recu.message ?? "Aperçu impossible.");
        } else {
          setDonnees(recu);
        }
      } catch {
        if (!annule) {
          setProbleme(
            "Pas de réponse du serveur. Vérifier que `npm run dev` tourne, puis rouvrir."
          );
        }
      } finally {
        if (!annule) setChargement(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [prospectIds, commune, donneesFictives]);

  async function mettreEnFile() {
    if (envoiEnCours || !donnees) return;
    setEnvoiEnCours(true);
    setResultat(null);

    if (modeApercu) {
      setResultat({
        ok: true,
        message: "Aperçu : aucune mise en file d'attente depuis cette page.",
      });
      setEnvoiEnCours(false);
      return;
    }

    try {
      const reponse = await fetch("/api/admin/prospection-envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectIds: donnees.automatiques.map((m) => m.prospectId),
        }),
      });
      const recu = (await reponse.json()) as { ok: boolean; message: string };
      setResultat(recu);
      if (recu.ok) surEnvoiEffectue();
    } catch {
      setResultat({
        ok: false,
        message: "Pas de réponse du serveur. Rien n'a été mis en file d'attente.",
      });
    }
    setEnvoiEnCours(false);
  }

  async function copier(message: MessagePret) {
    const texte = `${message.sujet}\n\n${message.texte}`;
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(message.prospectId);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      setProbleme(
        "Le navigateur a refusé la copie : sélectionner le texte et le copier à la main."
      );
    }
  }

  async function marquerEnvoye(message: MessagePret) {
    setNotes((n) => ({ ...n, [message.prospectId]: true }));
    if (modeApercu) return;
    try {
      await fetch("/api/admin/prospection-envoi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulaireEnvoye: message.prospectId }),
      });
      surEnvoiEffectue();
    } catch {
      setNotes((n) => ({ ...n, [message.prospectId]: false }));
      setProbleme("Le contact n'a pas pu être noté. Réessayer.");
    }
  }

  const trop =
    donnees !== null && donnees.automatiques.length > donnees.quotaRestant;

  return (
    <FenetreModale
      ouvert
      surFermeture={surFermeture}
      idTitre="titre-apercu-envoi"
    >
      <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto defilement-discret">
        <h2 id="titre-apercu-envoi" className="text-lg font-bold">
          Aperçu avant envoi
        </h2>

        {chargement && (
          <p className="text-sm text-encre-douce">Préparation des messages…</p>
        )}

        {probleme && (
          <p className="text-sm rounded-xl border border-erreur/40 bg-erreur/5 p-3">
            ❌ {probleme}
          </p>
        )}

        {donnees && (
          <>
            {/* ---------- Ce qui va se passer ---------- */}
            <div className="rounded-xl border border-bordure bg-fond-doux p-3 text-sm flex flex-col gap-1">
              <p>
                <span className="font-semibold tabular-nums">
                  {donnees.automatiques.length}
                </span>{" "}
                message{donnees.automatiques.length > 1 ? "s" : ""} partiront tout
                seuls, à partir de{" "}
                <span className="font-semibold">
                  {heureLisible(donnees.premierDepart)}
                </span>
                .
              </p>
              <p className="text-encre-douce">
                Quota restant sur 24 h glissantes :{" "}
                <span className="tabular-nums">{donnees.quotaRestant}</span>.
                {donnees.horsPlage &&
                  " Nous sommes hors de la plage d'envoi : le départ est programmé pour la prochaine ouverture."}
              </p>
            </div>

            {trop && (
              <p className="text-sm rounded-xl border border-alerte/50 bg-alerte/5 p-3">
                ⚠ La sélection dépasse le quota restant : seuls les{" "}
                {donnees.quotaRestant} premiers seront mis en file, les autres
                seront écartés et devront être relancés demain.
              </p>
            )}

            {donnees.ecartes.length > 0 && (
              <div className="rounded-xl border border-alerte/50 bg-alerte/5 p-3 text-sm">
                <p className="font-semibold mb-1">
                  {donnees.ecartes.length} prospect
                  {donnees.ecartes.length > 1 ? "s" : ""} écarté
                  {donnees.ecartes.length > 1 ? "s" : ""}
                </p>
                <ul className="flex flex-col gap-0.5 text-encre-douce">
                  {donnees.ecartes.map((e) => (
                    <li key={`${e.entreprise}-${e.raison}`}>
                      <span className="font-semibold">{e.entreprise}</span> —{" "}
                      {e.raison}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ---------- 1. Envoi automatique ---------- */}
            {donnees.automatiques.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="font-semibold">
                  Envoi automatique ({donnees.automatiques.length})
                </h3>
                {donnees.automatiques.map((message) => (
                  <MessageAffiche key={message.prospectId} message={message} />
                ))}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={mettreEnFile}
                    disabled={envoiEnCours}
                    className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-full px-6 min-h-[44px] transition-colors disabled:opacity-60"
                  >
                    {envoiEnCours
                      ? "Mise en file…"
                      : `Mettre ${donnees.automatiques.length} message${
                          donnees.automatiques.length > 1 ? "s" : ""
                        } en file d'attente`}
                  </button>
                  <button
                    type="button"
                    onClick={surFermeture}
                    className="border border-bordure hover:bg-fond-doux font-semibold text-sm rounded-full px-5 min-h-[44px] transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </section>
            )}

            {resultat && (
              <p
                className={`text-sm rounded-xl border p-3 ${
                  resultat.ok
                    ? "border-succes/40 bg-succes/5"
                    : "border-erreur/40 bg-erreur/5"
                }`}
              >
                {resultat.ok ? "✅ " : "❌ "}
                {resultat.message}
              </p>
            )}

            {/* ---------- 2. À recopier à la main ---------- */}
            {donnees.aLaMain.length > 0 && (
              <section className="flex flex-col gap-3 border-t border-bordure pt-4">
                <div>
                  <h3 className="font-semibold">
                    À recopier dans leur formulaire ({donnees.aLaMain.length})
                  </h3>
                  <p className="text-sm text-encre-douce">
                    Ces artisans n&apos;ont pas d&apos;adresse e-mail connue, mais
                    ils ont un site. Ces contacts ne comptent pas dans le quota :
                    ils ne passent pas par notre serveur d&apos;envoi.
                  </p>
                </div>

                {donnees.aLaMain.map((message) => (
                  <div
                    key={message.prospectId}
                    className="rounded-xl border border-bordure p-3 flex flex-col gap-2"
                  >
                    <MessageAffiche message={message} sansCadre />
                    <div className="flex flex-wrap items-center gap-2">
                      {message.siteInternet && (
                        <a
                          href={message.siteInternet}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primaire underline text-sm min-h-[36px] flex items-center"
                        >
                          Ouvrir leur site
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => copier(message)}
                        className="border border-bordure hover:bg-fond-doux font-semibold text-sm rounded-full px-4 min-h-[36px] transition-colors"
                      >
                        {copie === message.prospectId ? "Copié ✓" : "Copier"}
                      </button>
                      <button
                        type="button"
                        onClick={() => marquerEnvoye(message)}
                        disabled={notes[message.prospectId] === true}
                        className="border border-bordure hover:bg-fond-doux font-semibold text-sm rounded-full px-4 min-h-[36px] transition-colors disabled:opacity-60"
                      >
                        {notes[message.prospectId]
                          ? "Noté ✓"
                          : "Marquer comme envoyé"}
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {donnees.automatiques.length === 0 &&
              donnees.aLaMain.length === 0 && (
                <p className="text-sm text-encre-douce">
                  Rien à envoyer avec cette sélection.
                </p>
              )}
          </>
        )}
      </div>
    </FenetreModale>
  );
}

/** Un message tel qu'il partira : sujet, corps, étape de la séquence. */
function MessageAffiche({
  message,
  sansCadre = false,
}: {
  message: MessagePret;
  sansCadre?: boolean;
}) {
  return (
    <div
      className={
        sansCadre ? "flex flex-col gap-1" : "rounded-xl border border-bordure p-3 flex flex-col gap-1"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{message.entreprise}</p>
        <p className="text-xs text-encre-douce">
          {NOM_ETAPE[message.gabarit] ?? message.gabarit}
          {message.email ? ` · ${message.email}` : " · sans adresse"}
        </p>
      </div>
      <p className="text-sm font-semibold">{message.sujet}</p>
      <pre className="text-sm whitespace-pre-wrap font-sans text-encre-douce">
        {message.texte}
      </pre>
    </div>
  );
}
