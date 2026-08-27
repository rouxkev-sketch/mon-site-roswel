"use client";

import { useEffect, useState } from "react";
import { MOTIFS_SIGNALEMENT } from "@/config/tatouage";
import { IconeCocheListe, IconeDrapeau } from "@/components/Icones";
//  §1 (nº 664) — la pastille d'événement de la famille.
import { PastilleEvenement } from "@/components/PastilleEvenement";

/**
 * « SIGNALER CETTE FICHE » — le lien discret et sa fenêtre
 * =========================================================
 * Sur chaque fiche (fenêtre, page, mobile), tout en bas de la
 * colonne : un petit lien sobre. Il ouvre une FENÊTRE SUPERPOSÉE à la
 * charte du site : des motifs à cocher (au moins un), « autre » avec
 * son champ libre, l'envoi, puis un écran de remerciement.
 *
 * AUCUNE DONNÉE PERSONNELLE n'est demandée au signaleur. Le
 * signalement part vers /api/tatoueur/signalement (enregistré en
 * base, lu par l'admin — section « Signalements »).
 */
export function FenetreSignalement({
  slug,
  nom,
}: {
  slug: string;
  nom: string;
}) {
  const [ouverte, setOuverte] = useState(false);
  const [motifs, setMotifs] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Échap referme — comme toutes les fenêtres du site.
  useEffect(() => {
    if (!ouverte) return;
    function auClavier(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuverte(false);
    }
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [ouverte]);

  function ouvrir() {
    setMotifs([]);
    setDetails("");
    setEnvoye(false);
    setErreur(null);
    setOuverte(true);
  }

  function basculerMotif(slugMotif: string) {
    setMotifs((courants) =>
      courants.includes(slugMotif)
        ? courants.filter((m) => m !== slugMotif)
        : [...courants, slugMotif]
    );
  }

  const autreCoche = motifs.includes("autre");
  const pretAEnvoyer =
    motifs.length > 0 && (!autreCoche || details.trim().length >= 5);

  async function envoyer() {
    if (!pretAEnvoyer || envoiEnCours) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/tatoueur/signalement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, motifs, details: details.trim() }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error("L'envoi n'a pas abouti.");
      }
      setEnvoye(true);
    } catch {
      setErreur("L'envoi n'a pas abouti. Réessaie dans un instant.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <>
      {/* LE LIEN — en bas à GAUCHE de la colonne, un DRAPEAU devant,
          SANS soulignement : discret mais reconnaissable, pareil sur
          web et smartphone. */}
      <button
        type="button"
        onClick={ouvrir}
        className="mr-auto flex w-fit items-center gap-1.5 text-[13px]
                   text-sombre-texte-doux hover:text-primaire transition-colors"
      >
        <IconeDrapeau taille={16} classe="shrink-0" />
        Signaler cette fiche
      </button>

      {ouverte && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Signaler la fiche de ${nom}`}
          className="fixed inset-0 z-[80] flex items-center justify-center p-5"
        >
          <div
            aria-hidden="true"
            onClick={() => setOuverte(false)}
            className="absolute inset-0 bg-black/25
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
          />
          <div
            /*  §1 (nº 544) — PLUS DE VERRE : l'attribut est retiré, le
                 jeton `carte` de la nº 466 le remplace (la teinte des
                 nº 542-543). `globals.css` intact (règle nº 172), le
                 liseré part avec l'attribut, rien d'autre ne bouge.
                 ⚠️ LA BORDURE CI-DESSOUS EST ANTÉRIEURE et reste :
                 cette passe ne touche qu'à la couleur de fond. */
            className="relative w-full max-w-[440px] rounded-2xl
                       border border-sombre-bordure bg-sombre-carte p-6"
          >
            {envoye ? (
              /* ---- LE REMERCIEMENT ---- */
              <div className="text-center py-4">
                {/*  ██ §3 (nº 664) — CE CERCLE N'ÉTAIT PAS UNE ICÔNE ██
                     C'était le CARACTÈRE « ✓ » posé dans un rond, en
                     `text-2xl`. Il ne suivait donc aucune décision de la
                     famille — ni son trait, ni sa taille, ni ses tons —
                     et il changeait de dessin avec la police de
                     l'appareil. Le propriétaire demande la vraie coche.
                     LE TON PASSE DU ROSE AU VERT : le rose dit « une
                     décision est attendue », or ici rien n'attend de
                     décision — le signalement est PARTI. */}
                <PastilleEvenement
                  ton="valide"
                  symbole={IconeCocheListe}
                  classe="mx-auto"
                />
                <h2 className="mt-4 text-lg font-bold text-sombre-texte">
                  Merci pour ton signalement
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
                  Il sera examiné rapidement. Rien d&apos;autre à faire de ton
                  côté.
                </p>
                <button
                  type="button"
                  onClick={() => setOuverte(false)}
                  className="mt-6 inline-flex items-center justify-center rounded-full
                             px-6 min-h-[46px] bg-primaire hover:bg-primaire-fonce
                             text-white font-semibold transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-bold text-sombre-texte">
                    Signaler cette fiche
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOuverte(false)}
                    aria-label="Fermer"
                    className="-mr-1 -mt-1 w-9 h-9 flex items-center justify-center
                               rounded-full text-sombre-texte-doux
                               hover:text-sombre-texte hover:bg-sombre-eleve
                               transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-[13.5px] text-sombre-texte-doux">
                  Coche ce qui pose problème — aucune donnée personnelle
                  n&apos;est demandée.
                </p>

                <div className="mt-4 flex flex-col gap-1">
                  {MOTIFS_SIGNALEMENT.map((motif) => (
                    <label
                      key={motif.slug}
                      className="flex items-center gap-2.5 min-h-[36px] text-[14.5px]
                                 text-sombre-texte cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={motifs.includes(motif.slug)}
                        onChange={() => basculerMotif(motif.slug)}
                        className="w-4 h-4 accent-(--rw-primaire)"
                      />
                      {motif.label}
                    </label>
                  ))}
                </div>

                {autreCoche && (
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    maxLength={600}
                    placeholder="Explique en quelques mots…"
                    aria-label="Préciser le signalement"
                    className="mt-3 w-full rounded-xl border border-sombre-bordure
                               bg-sombre-eleve px-4 py-3 text-[14.5px] text-sombre-texte
                               placeholder:text-sombre-texte-doux outline-none resize-y
                               focus:border-primaire focus:ring-2 focus:ring-primaire/25"
                  />
                )}

                {erreur && (
                  <p role="alert" className="mt-3 text-[13px] text-erreur">
                    {erreur}
                  </p>
                )}

                <button
                  type="button"
                  onClick={envoyer}
                  disabled={!pretAEnvoyer || envoiEnCours}
                  className="mt-5 w-full inline-flex items-center justify-center
                             rounded-full min-h-[48px] bg-primaire hover:bg-primaire-fonce
                             text-white font-semibold transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {envoiEnCours ? "Envoi…" : "Envoyer le signalement"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
