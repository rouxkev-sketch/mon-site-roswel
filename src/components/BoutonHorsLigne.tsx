"use client";

import { useEffect, useState } from "react";
import { MOTIFS_MODERATION } from "@/config/tatouage";
import { declarerDepartVouluVersLAccueil } from "@/lib/navigation-session";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import { IconeHorsLigne } from "@/components/Icones";
//  §1 (nº 664) — la pastille d'événement de la famille.
import { PastilleEvenement } from "@/components/PastilleEvenement";
import { creerClientSupabaseNavigateur } from "@/lib/supabase/client";

/**
 * « METTRE LA FICHE HORS LIGNE » — l'action d'ADMINISTRATION des fiches
 * ======================================================================
 * Posée à côté du drapeau « Signaler cette fiche », VISIBLE PAR LE SEUL
 * ADMINISTRATEUR — et cette visibilité est décidée CÔTÉ SERVEUR : le
 * composant ne rend RIEN tant que /api/admin/yokofolio/moi (qui vérifie
 * la session ET la liste des administrateurs, côté serveur) n'a pas
 * répondu « admin ». Un visiteur sans session n'appelle même pas l'API.
 * L'ACTION elle-même est revérifiée par son API : aucun navigateur ne
 * peut la forcer.
 *
 * LE GESTE : l'admin coche les MOTIFS (la même liste pré-enregistrée
 * que le refus de validation — chaque motif est rattaché à un champ du
 * formulaire), ajoute une note au besoin, confirme. La fiche est
 * DÉPUBLIÉE (recherche, mosaïque, pages publiques : disparue) mais le
 * COMPTE n'est pas bloqué : le tatoueur garde son espace, voit les
 * champs en rouge, corrige, réenregistre — et la fiche repart en
 * validation.
 */
export function BoutonHorsLigne({
  idFiche,
  nom,
}: {
  idFiche: string;
  nom: string;
}) {
  const [admin, setAdmin] = useState(false);
  const [ouverte, setOuverte] = useState(false);
  const [motifs, setMotifs] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [fait, setFait] = useState(false);

  /* LA QUESTION AU SERVEUR — posée UNIQUEMENT si une session existe
     dans ce navigateur (les visiteurs anonymes ne déclenchent aucun
     appel). La réponse du serveur, et elle seule, fait apparaître le
     bouton. */
  useEffect(() => {
    let abandonne = false;
    (async () => {
      try {
        const { data } = await creerClientSupabaseNavigateur().auth.getSession();
        if (!data.session || abandonne) return;
        const reponse = await fetch("/api/admin/yokofolio/moi");
        const donnees = (await reponse.json().catch(() => null)) as {
          admin?: boolean;
        } | null;
        if (!abandonne && donnees?.admin) setAdmin(true);
      } catch {
        // Hors ligne ou API muette : pas d'action d'admin, c'est tout.
      }
    })();
    return () => {
      abandonne = true;
    };
  }, []);

  if (!admin) return null;

  const autreCoche = motifs.includes("autre");
  const pretAEnvoyer =
    motifs.length > 0 && (!autreCoche || note.trim().length >= 5);

  function basculerMotif(slug: string) {
    setMotifs((courants) =>
      courants.includes(slug)
        ? courants.filter((s) => s !== slug)
        : [...courants, slug]
    );
  }

  async function confirmer() {
    if (!pretAEnvoyer || envoiEnCours) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/fiches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: idFiche,
          action: "hors_ligne",
          motifs,
          note: note.trim(),
        }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "La mise hors ligne a échoué.");
      }
      setFait(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La mise hors ligne a échoué.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <>
      {/* LE DÉCLENCHEUR — EXACTEMENT le traitement du signalement :
          une icône, un libellé, aucun encadré. Il vit SOUS le
          signalement, avec sa marge : c'est cette place, et la
          couleur ROUGE des actions graves, qui disent le pouvoir
          d'administration — pas une boîte dessinée autour. */}
      <button
        type="button"
        onClick={() => setOuverte(true)}
        className="flex w-fit items-center gap-1.5 text-[13px]
                   text-erreur/80 hover:text-erreur transition-colors"
      >
        <IconeHorsLigne taille={16} classe="shrink-0" />
        Mettre le portfolio hors ligne
      </button>

      {ouverte && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Mettre le portfolio de ${nom} hors ligne`}
          className="fixed inset-0 z-[80] flex items-center justify-center p-5"
        >
          <div
            aria-hidden="true"
            onClick={() => !envoiEnCours && setOuverte(false)}
            className="absolute inset-0 bg-black/25
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
          />
          <div
            /*  §1 (nº 544) — PLUS DE VERRE : l'attribut est retiré, le
                 jeton `carte` de la nº 466 le remplace (la teinte des
                 nº 542-543). `globals.css` intact (règle nº 172), le
                 liseré part avec l'attribut, rien d'autre ne bouge —
                 ni largeur, ni arrondi, ni voile.
                 ⚠️ LA BORDURE CI-DESSOUS N'EST PAS DE MOI ET RESTE :
                 elle est antérieure, et cette passe ne touche qu'à la
                 couleur de fond. */
            className="relative w-full max-w-[440px] rounded-2xl
                       border border-sombre-bordure bg-sombre-carte p-6"
          >
            {fait ? (
              /* ---- C'EST FAIT ---- */
              <div className="text-center py-4">
                {/*  §1 (nº 664) — la pastille de la famille : c'est CET
                     écran qui donnait déjà le bon ton aux trois écrans
                     « hors ligne » (le rouge du retrait) ; les deux
                     autres le rejoignent. Le rouge, lui, est recalculé
                     pour le fond sombre — voir COULEURS_SOMBRE. */}
                <PastilleEvenement
                  ton="probleme"
                  symbole={IconeHorsLigne}
                  classe="mx-auto"
                />
                <h2 className="mt-4 text-lg font-bold text-sombre-texte">
                  Portfolio mis hors ligne
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
                  Il a disparu de la recherche et des pages publiques.
                  {" "}{nom} garde son espace : les motifs cochés y guident
                  la correction, et le portfolio repartira en validation.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    //  §1 (nº 429) — départ voulu vers l'accueil : le
                    //  filet de réparation du repli s'abstient.
                    declarerDepartVouluVersLAccueil();
                    window.location.assign("/");
                  }}
                  className="mt-6 inline-flex items-center justify-center rounded-full
                             px-6 min-h-[46px] bg-primaire hover:bg-primaire-fonce
                             text-white font-semibold transition-colors"
                >
                  Compris
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-bold text-sombre-texte">
                    Mettre le portfolio hors ligne
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
                <p className="mt-1 text-[13.5px] leading-relaxed text-sombre-texte-doux">
                  La fiche de {nom} disparaîtra de la recherche et des
                  pages publiques. Son compte reste actif : les motifs
                  cochés s&apos;afficheront en rouge dans son formulaire,
                  pour qu&apos;il corrige.
                </p>

                <div className="mt-4 flex flex-col gap-1">
                  {MOTIFS_MODERATION.map((motif) => (
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

                <textarea
                  {...sansRemplissageAuto("note-hors-ligne")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder={
                    autreCoche
                      ? "Précise le motif (obligatoire)…"
                      : "Note pour le tatoueur (facultatif)…"
                  }
                  aria-label="Note pour le tatoueur"
                  className="mt-3 w-full rounded-xl border border-sombre-bordure
                             bg-sombre-eleve px-4 py-3 text-[14.5px] text-sombre-texte
                             placeholder:text-sombre-texte-doux outline-none resize-y
                             focus:border-primaire focus:ring-2 focus:ring-primaire/25"
                />

                {erreur && (
                  <p role="alert" className="mt-3 text-[13px] text-erreur">
                    {erreur}
                  </p>
                )}

                <button
                  type="button"
                  onClick={confirmer}
                  disabled={!pretAEnvoyer || envoiEnCours}
                  className="mt-5 w-full inline-flex items-center justify-center
                             rounded-full min-h-[48px] bg-erreur hover:opacity-90
                             text-white font-semibold transition-opacity
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {envoiEnCours ? "Mise hors ligne…" : "Mettre hors ligne"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
