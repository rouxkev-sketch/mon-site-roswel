"use client";

import { useState } from "react";
import { MOTIFS_SIGNALEMENT, SIGNALEMENT } from "@/config/roswel";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import { ComposantCaptcha } from "@/components/ComposantCaptcha";
import { EnteteModale, FenetreModale } from "@/components/FenetreModale";
import { IconeDrapeau } from "@/components/Icones";
import { CLASSE_LIEN_FLECHE, TexteLienFleche } from "@/components/LienFleche";

/**
 * SIGNALER UNE FICHE (§ modération)
 * ---------------------------------
 * Lien discret (petit drapeau gris) posé en bas de la fiche, juste
 * au-dessus du pied de page. Au clic : une fenêtre « Sélectionner une
 * raison » où l'on choisit UNE raison (boutons ronds) et où l'on DOIT
 * détailler — commentaire obligatoire, de 30 à 500 caractères, compteur
 * sous le champ. Le bouton d'envoi ne s'active qu'une fois les deux
 * conditions remplies, et le serveur les revérifie l'une comme l'autre.
 * À l'ouverture, aucun champ n'est pré-sélectionné
 * (pas de curseur dans le commentaire). Accessible sans compte ; une
 * vérification anti-robots invisible (Turnstile, si configurée)
 * accompagne l'envoi. La confirmation est toujours la même, qu'un
 * garde-fou anti-spam serveur ait ou non laissé passer le signalement.
 */
export function BoutonSignalement({
  artisanId,
  variante = "pied",
  libelle = "Signaler",
}: {
  artisanId: string;
  /** « pied » : le lien discret centré sous la fiche (smartphone).
      « lien » : le déclencheur posé tel quel dans la ligne d'infos —
      sans marges ni centrage, c'est la ligne qui commande la mise en
      page. */
  variante?: "pied" | "lien";
  /** Texte du déclencheur en variante « lien ». Les 4 COLONNES du grand
      format n'ont la place que du mot « Signaler » (l'intitulé
      « Problème » est écrit au-dessus) ; la ligne EMPILÉE du téléphone,
      elle, n'a pas d'intitulé séparé et porte donc la phrase entière,
      « Signaler cet artisan ». */
  libelle?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  // UNE SEULE raison à la fois (boutons ronds) : l'état est le motif
  // choisi, pas une liste de cases cochées.
  const [motif, setMotif] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [jetonCaptcha, setJetonCaptcha] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const captchaActif = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const detail = commentaire.trim().length;
  const assezDeDetail = detail >= SIGNALEMENT.commentaireMin;
  // Le bouton d'envoi exige LES DEUX : une raison choisie ET le
  // minimum de détails. Le serveur revérifie la même chose.
  const pret = motif !== null && assezDeDetail && !enCours;

  // Échap, clic à l'extérieur, focus et blocage du défilement : tout
  // cela vit désormais dans la coque partagée (FenetreModale).

  function fermer() {
    setOuvert(false);
    // Remise à zéro (pour un éventuel nouveau signalement)
    setTimeout(() => {
      setMotif(null);
      setCommentaire("");
      setJetonCaptcha(null);
      setEnvoye(false);
      setMessage(null);
      setEnCours(false);
    }, 200);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!pret) return;
    if (captchaActif && !jetonCaptcha) {
      setMessage(
        "La vérification anti-robots se termine… réessaie dans une seconde."
      );
      return;
    }
    setEnCours(true);
    setMessage(null);
    try {
      const reponse = await fetch("/api/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisanId,
          // La base garde une LISTE de motifs (elle en acceptait
          // plusieurs) : on lui transmet la raison choisie, seule.
          motifs: motif ? [motif] : [],
          commentaire: commentaire.trim(),
          jetonCaptcha: jetonCaptcha ?? undefined,
        }),
      });
      const resultat = (await reponse.json()) as {
        ok: boolean;
        message: string;
      };
      if (resultat.ok) {
        setEnvoye(true);
      } else {
        setMessage(resultat.message);
        setEnCours(false);
      }
    } catch {
      setMessage("Envoi impossible pour le moment. Réessaie plus tard.");
      setEnCours(false);
    }
  }

  return (
    <>
      {/* ----- Le déclencheur -----
          « lien » : le seul mot « Signaler », dans la colonne
          « Problème » de la ligne d'infos (fiche ≥ 768 px) — l'icône
          drapeau est déjà posée au-dessus par la colonne.
          « pied » : le lien discret centré sous la fiche (smartphone). */}
      {variante === "lien" ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          // Style de lien commun à la fiche : rien au repos sinon la
          // flèche rose, souligné + rose au survol (voir LienFleche).
          className={`text-encre ${CLASSE_LIEN_FLECHE}`}
        >
          <TexteLienFleche>{libelle}</TexteLienFleche>
        </button>
      ) : (
        <div className="px-5 pt-6 pb-2 flex justify-center">
          <button
            type="button"
            onClick={() => setOuvert(true)}
            className="inline-flex items-center gap-1.5 text-xs text-encre-douce hover:underline underline-offset-2"
          >
            <IconeDrapeau taille={16} />
            Signaler cette fiche
          </button>
        </div>
      )}

      {/* ----- Fenêtre modale : la COQUE COMMUNE ----- */}
      <FenetreModale
        ouvert={ouvert}
        surFermeture={fermer}
        idTitre="titre-signalement"
        largeur="large"
      >
        <>
            <EnteteModale
              idTitre="titre-signalement"
              titre="Signaler cette fiche"
              surFermeture={fermer}
            />

            {envoye ? (
              <div className="mt-6 flex flex-col gap-5">
                <p className="text-sm text-encre-douce">
                  {SIGNALEMENT.messageConfirmation}
                </p>
                <button
                  type="button"
                  onClick={fermer}
                  className="bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-2xl min-h-[46px] text-sm transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={envoyer} className="mt-6 flex flex-col gap-6">
                {/* Les raisons : des BOUTONS RONDS, une seule à la fois —
                    le titre de la fenêtre le dit déjà, il n'y a donc plus
                    de libellé au-dessus de la liste. La légende reste
                    présente pour les lecteurs d'écran, sans être
                    affichée : sans elle, le groupe de boutons n'aurait
                    plus de nom du tout. */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">Raison du signalement</legend>
                  {MOTIFS_SIGNALEMENT.map(({ cle, label }) => (
                    <label
                      key={cle}
                      className="flex items-start gap-2.5 text-sm min-h-[40px] cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="motif-signalement"
                        value={cle}
                        checked={motif === cle}
                        onChange={() => setMotif(cle)}
                        className="w-4.5 h-4.5 mt-0.5 shrink-0 accent-(--rw-primaire)"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>

                {/* Commentaire OBLIGATOIRE + compteur */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="commentaire-signalement"
                    className="text-sm font-semibold"
                  >
                    Indiquez-nous plus de détails
                  </label>
                  <textarea
                    id="commentaire-signalement"
                    {...sansRemplissageAuto("commentaire-signalement")}
                    value={commentaire}
                    onChange={(e) =>
                      setCommentaire(
                        e.target.value.slice(0, SIGNALEMENT.commentaireMax)
                      )
                    }
                    rows={4}
                    required
                    minLength={SIGNALEMENT.commentaireMin}
                    maxLength={SIGNALEMENT.commentaireMax}
                    aria-describedby="compteur-signalement"
                    placeholder="Expliquez ce qui ne va pas"
                    className="rounded-2xl border border-bordure bg-fond px-3.5 py-3 text-base outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/25 resize-none"
                  />
                  {/* Le compteur est conservé ; tant que le minimum n'est
                      pas atteint, il le rappelle — sinon le bouton d'envoi
                      resterait inactif sans qu'on sache pourquoi. */}
                  <p
                    id="compteur-signalement"
                    className="text-xs text-right text-encre-douce"
                  >
                    {!assezDeDetail && (
                      <span>{SIGNALEMENT.commentaireMin} caractères minimum · </span>
                    )}
                    {commentaire.length}/{SIGNALEMENT.commentaireMax}
                  </p>
                </div>

                {/* Vérification anti-robots invisible (si configurée) */}
                <ComposantCaptcha surJeton={setJetonCaptcha} />

                {message && (
                  <p className="text-sm text-encre-douce bg-fond-doux border border-bordure rounded-2xl p-3">
                    {message}
                  </p>
                )}

                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={fermer}
                    className="flex-1 border border-bordure font-semibold rounded-2xl min-h-[46px] text-sm hover:bg-fond-doux transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!pret}
                    className="flex-1 bg-primaire hover:bg-primaire-fonce text-white font-semibold rounded-2xl min-h-[46px] text-sm transition-colors disabled:opacity-40"
                  >
                    {enCours ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              </form>
            )}
        </>
      </FenetreModale>
    </>
  );
}
