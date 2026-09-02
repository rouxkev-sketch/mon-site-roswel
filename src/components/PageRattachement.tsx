"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ARRIVEE_APRES_CONNEXION, DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import { EcranAuthentification } from "@/components/EcranAuthentification";
import { IconeHorsLigne, IconeLienExterne } from "@/components/Icones";
//  §1 (nº 664) — la pastille d'événement de la famille.
import { PastilleEvenement } from "@/components/PastilleEvenement";
import { sansRemplissageAuto } from "@/lib/champs-sans-remplissage";
import { LIBELLE_TYPE_FICHE, type EtatLigne, type TypeFiche } from "@/lib/demarchage";
import { useUtilisateur } from "@/lib/use-utilisateur";

/**
 * LA PAGE DE RATTACHEMENT — ce que le tatoueur voit en cliquant
 * ==============================================================
 * Trois écrans, un seul lien :
 *
 *  1. IL N'A PAS DE COMPTE (le cas normal) : ses fiches, puis L'ÉCRAN
 *     DE CRÉATION DE COMPTE — le vrai, celui de /devenir-tatoueur,
 *     réutilisé tel quel. Une seule différence : le sélecteur
 *     « Créer mon compte / Me connecter » disparaît.
 *
 *  2. IL VIENT DE SE CONNECTER : le rattachement se fait TOUT SEUL,
 *     sans un bouton de plus. Il a cliqué sur le lien, il a créé son
 *     compte : il a dit oui deux fois, une troisième serait une
 *     formalité. TOUTES les fiches du jeton partent ensemble — il ne
 *     peut pas en accepter une et refuser l'autre.
 *
 *  3. IL A SUPPRIMÉ : l'écran le dit, et garde le bouton qui défait
 *     le geste tant que le délai court.
 *
 * ⚠️ « SUPPRIMER MA FICHE » NE DEMANDE PAS DE COMPTE. Quelqu'un qui ne
 * veut pas figurer sur le site n'a aucune raison d'en créer un pour
 * s'en aller : ce serait un péage. Le jeton suffit — mais le mot
 * SUPPRIMER doit être écrit, comme partout ailleurs sur le site.
 */

type FicheAffichee = {
  id: string;
  nom: string;
  slug: string | null;
  ville: string | null;
  type: TypeFiche;
  photo: string | null;
  retiree: boolean;
};

export function PageRattachement({
  jeton,
  etat,
  dejaRattache,
  fiches,
}: {
  jeton: string;
  etat: EtatLigne;
  dejaRattache: boolean;
  fiches: FicheAffichee[];
}) {
  const { utilisateur, pret } = useUtilisateur();
  const plusieurs = fiches.length > 1;

  /** Ce que le rattachement automatique a donné. */
  const [rattache, setRattache] = useState(dejaRattache);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  /** La suppression, et son mot à écrire. */
  const [fenetreSuppression, setFenetreSuppression] = useState(false);
  const [motDeConfirmation, setMotDeConfirmation] = useState("");
  const [retire, setRetire] = useState(etat === "supprime");

  const appeler = useCallback(
    async (action: "rattacher" | "supprimer" | "reactiver") => {
      const reponse = await fetch("/api/rattachement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton, action }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "The operation failed.");
      }
    },
    [jeton]
  );

  /* ---------- LE RATTACHEMENT AUTOMATIQUE ----------
     Dès qu'une session existe, les fiches partent. C'est ce qui rend
     le parcours indifférent au réglage de Supabase : session immédiate
     ou confirmation par e-mail (le lien de l'e-mail revient ICI, sur
     cette page), le résultat est le même. */
  useEffect(() => {
    if (!pret || !utilisateur || rattache || retire) return;
    const minuteur = window.setTimeout(() => {
      void (async () => {
        setEnCours(true);
        try {
          await appeler("rattacher");
          setRattache(true);
          setErreur(null);
        } catch (e) {
          setErreur(
            e instanceof Error ? e.message : "Linking failed."
          );
        } finally {
          setEnCours(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(minuteur);
  }, [pret, utilisateur, rattache, retire, appeler]);

  async function supprimer() {
    if (motDeConfirmation.trim().toUpperCase() !== "DELETE") return;
    setEnCours(true);
    setErreur(null);
    try {
      await appeler("supprimer");
      setRetire(true);
      setFenetreSuppression(false);
      setMotDeConfirmation("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Deletion failed.");
    } finally {
      setEnCours(false);
    }
  }

  async function reactiver() {
    setEnCours(true);
    setErreur(null);
    try {
      await appeler("reactiver");
      setRetire(false);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Reactivation failed.");
    } finally {
      setEnCours(false);
    }
  }

  /* ================================================================
   * ÉCRAN 3 — LA FICHE EST RETIRÉE
   * ============================================================== */
  if (retire) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[560px] px-4 sm:px-6 pt-10 sm:pt-14 pb-24">
        <div className="rounded-xl bg-sombre-carte px-4 py-8 text-center sm:px-7">
          {/*  §1 (nº 664) — DEUX CHANGEMENTS ICI, ET LES DEUX VIENNENT
               de l'inventaire de la nº 663 : le cercle faisait 48 px,
               la seule fois de tout le site (les deux tailles de la
               famille sont 36 et 56), et il était gris alors que les
               deux autres écrans « hors ligne » disent le rouge du
               retrait. */}
          <PastilleEvenement
            ton="probleme"
            symbole={IconeHorsLigne}
            classe="mx-auto"
          />
          <h1 className="mt-4 text-[clamp(1.4rem,4vw,1.8rem)] font-bold text-sombre-texte">
            {plusieurs ? "Your portfolios are removed" : "Your portfolio is removed"}
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-sombre-texte-doux">
            {plusieurs
              ? `They're no longer visible on the site. They'll be permanently deleted in ${DELAI_SUPPRESSION_JOURS} days.`
              : `It's no longer visible on the site. It'll be permanently deleted in ${DELAI_SUPPRESSION_JOURS} days.`}
          </p>
          <button
            type="button"
            disabled={enCours}
            onClick={() => void reactiver()}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full
                       min-h-[50px] bg-primaire hover:bg-primaire-fonce
                       text-[15px] font-semibold text-white transition-colors
                       disabled:opacity-60"
          >
            {enCours
              ? "One moment…"
              : plusieurs
                ? "Put my portfolios back online"
                : "Put my portfolio back online"}
          </button>
          {erreur && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-erreur/50 bg-erreur/10 px-4 py-3
                         text-[13px] leading-relaxed text-sombre-texte"
            >
              {erreur}
            </p>
          )}
        </div>
      </main>
    );
  }

  /* ================================================================
   * ÉCRAN 2 — C'EST FAIT
   * ============================================================== */
  if (rattache && utilisateur) {
    return (
      <main className="flex-1 mx-auto w-full max-w-[560px] px-4 sm:px-6 pt-10 sm:pt-14 pb-24">
        <h1 className="text-center text-[clamp(1.5rem,4.5vw,2rem)] font-bold text-sombre-texte">
          {plusieurs ? "Your portfolios are yours" : "Your portfolio is yours"}
        </h1>

        <ListeDesFiches fiches={fiches} classe="mt-7" />

        <Link
          href={ARRIVEE_APRES_CONNEXION}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full
                     min-h-[52px] bg-primaire hover:bg-primaire-fonce
                     text-[15px] font-semibold text-white transition-colors"
        >
          Open my account
        </Link>

        <BlocSuppression
          plusieurs={plusieurs}
          ouverte={fenetreSuppression}
          onOuvrir={() => setFenetreSuppression(true)}
          onFermer={() => setFenetreSuppression(false)}
          mot={motDeConfirmation}
          onMot={setMotDeConfirmation}
          onSupprimer={() => void supprimer()}
          enCours={enCours}
        />
        {erreur && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-erreur/50 bg-erreur/10 px-4 py-3
                       text-[13px] leading-relaxed text-sombre-texte"
          >
            {erreur}
          </p>
        )}
      </main>
    );
  }

  /* ================================================================
   * ÉCRAN 1 — LES FICHES, PUIS LA CRÉATION DE COMPTE
   * ============================================================== */
  return (
    <>
      <main className="flex-1 mx-auto w-full max-w-[440px] px-5 sm:px-6 pt-10 sm:pt-14 pb-0">
        <h1 className="text-center text-[clamp(1.5rem,4.5vw,2rem)] font-bold leading-tight text-sombre-texte">
          {plusieurs
            ? "Your portfolios are ready"
            : "Your portfolio is ready"}
        </h1>
        <p className="mt-2 text-center text-[15px] leading-relaxed text-sombre-texte-doux">
          {plusieurs
            ? "Create your account to claim them."
            : "Create your account to claim it."}
        </p>

        <ListeDesFiches fiches={fiches} classe="mt-7" />

        {enCours && (
          <p className="mt-5 text-center text-[13.5px] text-sombre-texte-doux">
            One moment…
          </p>
        )}
        {erreur && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-erreur/50 bg-erreur/10 px-4 py-3
                       text-[13px] leading-relaxed text-sombre-texte"
          >
            {erreur}
          </p>
        )}
      </main>

      {/* L'ÉCRAN DE CRÉATION DE COMPTE — celui du site, tel quel,
          sélecteur en moins. Il porte son propre <main>, sa capsule
          finale et sa jauge de force. */}
      <EcranAuthentification rattachement={{ jeton }} />

      <div className="mx-auto w-full max-w-[440px] px-5 sm:px-6 pb-24">
        <BlocSuppression
          plusieurs={plusieurs}
          ouverte={fenetreSuppression}
          onOuvrir={() => setFenetreSuppression(true)}
          onFermer={() => setFenetreSuppression(false)}
          mot={motDeConfirmation}
          onMot={setMotDeConfirmation}
          onSupprimer={() => void supprimer()}
          enCours={enCours}
        />
      </div>
    </>
  );
}

/** LES FICHES DU LIEN — photo, nom, type, et de quoi aller voir. */
function ListeDesFiches({
  fiches,
  classe = "",
}: {
  fiches: FicheAffichee[];
  classe?: string;
}) {
  return (
    <ul className={`flex flex-col gap-2 ${classe}`}>
      {fiches.map((fiche) => (
        <li
          key={fiche.id}
          className="flex items-center gap-3 rounded-xl bg-sombre-carte px-4 py-3"
        >
          {fiche.photo ? (
            <Image
              src={fiche.photo}
              alt=""
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center
                         rounded-full bg-sombre-eleve text-[15px] font-semibold
                         text-sombre-texte-doux"
            >
              {fiche.nom.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-sombre-texte">
              {fiche.nom}
            </span>
            <span className="block truncate text-[12.5px] text-sombre-texte-doux">
              {LIBELLE_TYPE_FICHE[fiche.type]}
              {fiche.ville ? ` · ${fiche.ville}` : ""}
            </span>
          </span>
          {fiche.slug && (
            <Link
              href={`/tatoueur/${fiche.slug}`}
              target="_blank"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full
                         bg-sombre-eleve px-4 min-h-[38px] text-[13px] font-semibold
                         text-sombre-texte hover:bg-sombre-eleve-clair transition-colors"
            >
              View
              <IconeLienExterne taille={14} />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * « SUPPRIMER MA FICHE » — en bas de page, en texte brut
 * =======================================================
 * La charte le veut ainsi : supprimer n'a jamais de capsule. Et le
 * geste est protégé par LE MOT ÉCRIT — le même mécanisme que la
 * suppression d'un compte, pour la même raison : on ne supprime pas
 * en effleurant un écran dans un métro.
 */
function BlocSuppression({
  plusieurs,
  ouverte,
  onOuvrir,
  onFermer,
  mot,
  onMot,
  onSupprimer,
  enCours,
}: {
  plusieurs: boolean;
  ouverte: boolean;
  onOuvrir: () => void;
  onFermer: () => void;
  mot: string;
  onMot: (valeur: string) => void;
  onSupprimer: () => void;
  enCours: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOuvrir}
        className="mt-8 inline-flex w-full items-center justify-center min-h-[44px]
                   text-[13.5px] font-semibold text-erreur/85 hover:text-erreur
                   transition-colors"
      >
        {plusieurs ? "Delete my portfolios" : "Delete my portfolio"}
      </button>

      {ouverte && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={plusieurs ? "Delete my portfolios" : "Delete my portfolio"}
          className="fixed inset-0 z-[80] flex items-center justify-center p-5"
        >
          <div
            aria-hidden="true"
            onClick={onFermer}
            className="absolute inset-0 bg-black/25
                   opacity-100 transition-opacity duration-200 starting:opacity-0"
          />
          <div
            /*  §1 (nº 544) — PLUS DE VERRE : l'attribut est retiré, le
                 jeton `carte` de la nº 466 le remplace (la teinte des
                 nº 542-543). `globals.css` intact (règle nº 172), le
                 liseré part avec l'attribut, rien d'autre ne bouge. */
            className="relative w-full max-w-[440px] rounded-xl bg-sombre-carte p-6 sm:p-7 text-left"
          >
            <h2 className="text-lg font-bold text-sombre-texte">
              {plusieurs ? "Delete my portfolios?" : "Delete my portfolio?"}
            </h2>
            {/* LE MESSAGE EXACT — trois phrases, et pas une de plus :
                ce qui se passe, l'échéance, la porte de retour. */}
            <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
              {plusieurs ? "Your portfolios will be removed" : "Your portfolio will be removed"}{" "}
              from the site. {plusieurs ? "They'll be" : "It'll be"} permanently
              deleted in {DELAI_SUPPRESSION_JOURS} days.
              You can reactivate {plusieurs ? "them" : "it"} from this link before
              then.
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-sombre-texte-doux">
              Type <strong className="text-sombre-texte">DELETE</strong> to
              confirm.
            </p>
            <input
              type="text"
              {...sansRemplissageAuto("confirmation-rattachement")}
              value={mot}
              onChange={(e) => onMot(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              className="mt-4 w-full min-h-[48px] rounded-lg border border-transparent
                         bg-sombre-eleve-clair px-4 text-base text-sombre-texte
                         placeholder:text-sombre-texte-doux outline-none
                         transition-colors focus:bg-sombre-haut"
            />
            <button
              type="button"
              onClick={onSupprimer}
              disabled={enCours || mot.trim().toUpperCase() !== "DELETE"}
              className="mt-6 inline-flex w-full items-center justify-center
                         min-h-[50px] rounded-full bg-erreur text-white
                         font-semibold transition-opacity
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enCours ? "One moment…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={onFermer}
              className="mt-3 inline-flex w-full items-center justify-center
                         min-h-[44px] text-[14px] text-sombre-texte-doux
                         hover:text-sombre-texte transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
