"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconeCocheListe, IconeLienExterne } from "@/components/Icones";
import { OngletsLigne } from "@/components/OngletsLigne";
import { Patience, SqueletteLignes } from "@/components/Squelette";
import {
  COULEUR_ETAT_DEMARCHAGE,
  JOURS_APRES_RATTACHEMENT,
  JOURS_APRES_SUPPRESSION,
  LIBELLE_ETAT_DEMARCHAGE,
  LIBELLE_TYPE_FICHE,
  type EtatLigne,
  type TypeFiche,
} from "@/lib/demarchage";
//  §1 (nº 693) — le délai de garde des lectures du navigateur,
//  écrit une seule fois (voir lib/lecture-navigateur).
import { lireDuServeur } from "@/lib/lecture-navigateur";

/**
 * LE TABLEAU DE DÉMARCHAGE — /admin
 * ===================================
 * C'est la fonctionnalité qui donne du CONTENU au lancement : personne
 * ne remplit un formulaire pour un site inconnu et vide. On prépare
 * des portfolios à partir de ce qui est public, on les met en ligne, et
 * on écrit à leur tatoueur — « c'est prêt, tu le récupères ou tu le
 * fais retirer ».
 *
 * ⚠️ IL REMPLACE « MES FICHES D'ESSAI » (passe nº 135). L'interrupteur
 * de la migration nº 43 n'a pas disparu : il a changé de place et de
 * rôle affiché. Il ne sert plus à « voir sa fiche d'essai le temps
 * d'un test » — il MET LA FICHE EN LIGNE, tout simplement, parce
 * qu'une fiche d'administrateur ne passe plus par la validation.
 *
 * DEUX SORTES DE LIGNES, ET UNE SEULE LISTE :
 *  · une FICHE SEULE, qu'on n'a écrite à personne — cochable ;
 *  · un ENVOI, né du geste « Valider » : les fiches cochées ensemble
 *    ont FUSIONNÉ en une seule entrée, qui les empile, porte un statut
 *    commun et garde ses liens.
 *
 * LES STATUTS AVANCENT SEULS. L'administrateur ne coche rien :
 * « à envoyer » tant qu'aucun lien n'existe, « envoyé » dès que le
 * lien est généré, « compte créé » quand le tatoueur s'est rattaché,
 * « supprimé » quand il a refusé. Chacun est la conséquence d'un geste
 * réel — jamais d'une case à cocher.
 */

/** LES DEUX POSITIONS DU SÉLECTEUR (passe nº 142). */
type Vue = "a_envoyer" | "envoye";

type FicheLigne = {
  id: string;
  nom: string;
  slug: string | null;
  ville: string | null;
  type: TypeFiche;
  photo: string | null;
  enLigne: boolean;
  retiree: boolean;
  date: string | null;
};

type Groupe = {
  /** Vide tant que l'envoi n'existe pas en base (brouillon). */
  id: string;
  /** VRAI : composé, pas encore validé — rien n'est écrit nulle part. */
  brouillon: boolean;
  /** Le jeton du lien. Rendu au serveur à la validation, pour que le
      message déjà copié reste exact (voir la route). */
  jeton: string;
  etat: EtatLigne;
  envoyeLe: string;
  rattacheLe: string | null;
  retireLe: string | null;
  lien: string;
  fiches: FicheLigne[];
  message: string;
};

/** L'ERREUR — la seule exception de la charte : l'encadré rouge. */
const ERREUR =
  "rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3 " +
  "text-[13.5px] leading-relaxed text-sombre-texte";

function dateCourte(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** LA PASTILLE D'ÉTAT — un point de couleur et un mot, jamais un
    encadré : le tableau porte déjà assez de traits. */
function Etat({ etat }: { etat: EtatLigne }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-sombre-texte-doux">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${COULEUR_ETAT_DEMARCHAGE[etat]}`}
      />
      {LIBELLE_ETAT_DEMARCHAGE[etat]}
    </span>
  );
}

/** LA PHOTO DE PROFIL, ronde — ou l'initiale à défaut. Une ligne sans
    visage se lit mal quand on en parcourt trente. */
function Vignette({ fiche, taille = 40 }: { fiche: FicheLigne; taille?: number }) {
  if (fiche.photo) {
    return (
      <Image
        src={fiche.photo}
        alt=""
        width={taille}
        height={taille}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: taille, height: taille }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="shrink-0 inline-flex items-center justify-center rounded-full
                 bg-sombre-eleve-clair text-[14px] font-semibold text-sombre-texte-doux"
      style={{ width: taille, height: taille }}
    >
      {fiche.nom.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AdminDemarchage() {
  const [aEnvoyer, setAEnvoyer] = useState<FicheLigne[] | null>(null);
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cochees, setCochees] = useState<string[]>([]);
  const [enCours, setEnCours] = useState<string | null>(null);
  /** L'écran du message — ouvert, il remplace le tableau. */
  const [ouvert, setOuvert] = useState<Groupe | null>(null);
  /** LA LISTE REGARDÉE — « À envoyer » ou « Envoyé ». */
  const [vue, setVue] = useState<Vue>("a_envoyer");
  /** L'envoi dont on demande la confirmation d'annulation. */
  const [aAnnuler, setAAnnuler] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const reponse = await lireDuServeur("/api/admin/yokofolio/demarchage");
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        aEnvoyer?: FicheLigne[];
        groupes?: Groupe[];
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "Couldn't load.");
      }
      setAEnvoyer(donnees.aEnvoyer ?? []);
      setGroupes(donnees.groupes ?? []);
    } catch (e) {
      setAEnvoyer([]);
      setErreur(e instanceof Error ? e.message : "Couldn't load.");
    }
  }, []);

  //  LA PREMIÈRE LECTURE, DIFFÉRÉE D'UN TOUR — la règle de React (et
  //  celle de l'admin, qui fait pareil) : un effet ne pose jamais
  //  d'état de façon synchrone, sous peine de rendus en cascade.
  useEffect(() => {
    const minuteur = window.setTimeout(() => void charger(), 0);
    return () => window.clearTimeout(minuteur);
  }, [charger]);

  /** L'INTERRUPTEUR — il met la fiche en ligne, ou l'en retire. */
  async function basculer(fiche: FicheLigne) {
    setEnCours(fiche.id);
    setErreur(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/demarchage/fiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fiche.id, publique: !fiche.enLigne }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "Couldn't save.");
      }
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setEnCours(null);
    }
  }

  /** REMETTRE EN PLACE une fiche que le tatoueur a fait retirer. */
  async function restaurer(fiche: FicheLigne) {
    setEnCours(fiche.id);
    setErreur(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/demarchage/fiche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: fiche.id, restaurer: true }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "Couldn't restore.");
      }
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Couldn't restore.");
    } finally {
      setEnCours(null);
    }
  }

  /** COMPOSER LE MESSAGE — et RIEN DE PLUS (passe nº 142).
      Le serveur tire le jeton et écrit le texte ; aucune ligne n'est
      créée. L'envoi n'existera qu'au « Valider l'envoi » de l'écran
      suivant — d'ici là, « Retour » ne laisse aucune trace. */
  async function composerLeMessage() {
    if (cochees.length === 0) return;
    setEnCours("selection");
    setErreur(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/demarchage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiches: cochees, apercu: true }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        groupe?: Groupe;
      } | null;
      if (!reponse.ok || !donnees?.ok || !donnees.groupe) {
        throw new Error(donnees?.message ?? "Couldn't compose.");
      }
      setOuvert(donnees.groupe);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Couldn't compose.");
    } finally {
      setEnCours(null);
    }
  }

  /** VALIDER L'ENVOI : c'est ICI, et nulle part avant, que l'envoi
      naît. Le jeton du brouillon est repris tel quel — le message déjà
      copié reste donc juste au caractère près. */
  async function validerLEnvoi(brouillon: Groupe) {
    const reponse = await fetch("/api/admin/yokofolio/demarchage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fiches: brouillon.fiches.map((f) => f.id),
        jeton: brouillon.jeton,
      }),
    });
    const donnees = (await reponse.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
      groupe?: Groupe;
    } | null;
    if (!reponse.ok || !donnees?.ok) {
      throw new Error(donnees?.message ?? "Couldn't confirm.");
    }
    setCochees([]);
    setOuvert(null);
    //  ON REVIENT SUR LA LISTE OÙ LES LIGNES VIENNENT D'ATTERRIR : le
    //  geste s'appelle « Valider l'envoi », son résultat est un envoi —
    //  on le montre, plutôt que de laisser deviner qu'il a eu lieu.
    setVue("envoye");
    await charger();
  }

  /** ANNULER UN ENVOI — la ligne disparaît, ses fiches reviennent dans
      « À envoyer ». La confirmation est demandée par la ligne
      elle-même (voir `LigneEnvoi`) : on n'arrive ici qu'après. */
  async function annulerLEnvoi(groupe: Groupe) {
    setEnCours(groupe.id);
    setErreur(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/demarchage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: groupe.id }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "Couldn't cancel.");
      }
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Couldn't cancel.");
    } finally {
      setEnCours(null);
    }
  }

  /* ================================================================
   * L'ÉCRAN DU MESSAGE — il remplace le tableau, comme l'écran de
   * vérification d'une fiche remplace la file d'attente.
   * ============================================================== */
  if (ouvert) {
    return (
      <EcranMessage
        groupe={ouvert}
        onRetour={() => setOuvert(null)}
        onValider={ouvert.brouillon ? validerLEnvoi : undefined}
      />
    );
  }

  const enLigneCount = (aEnvoyer ?? []).filter((f) => f.enLigne).length;

  return (
    <>
      <h1 className="text-[22px] font-bold text-sombre-texte">Outreach</h1>

      {erreur && (
        <p role="status" className={`mt-4 ${ERREUR}`}>
          {erreur}
        </p>
      )}

      {aEnvoyer === null ? (
        <div className="mt-6">
          <Patience>
            <SqueletteLignes nombre={4} ton="eleve" />
          </Patience>
        </div>
      ) : aEnvoyer.length === 0 && groupes.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-sombre-carte px-4 py-6 text-center
                      text-[14px] leading-relaxed text-sombre-texte-doux">
          No portfolio created from an admin account.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {/* LE SÉLECTEUR À DEUX POSITIONS (passe nº 142) — la grammaire
              du site : les mots côte à côte, la ligne fine grise, le
              segment actif épais et rose. Les deux listes se
              succédaient l'une sous l'autre ; sur un tableau qui
              grandit, il fallait défiler tout « À envoyer » pour
              atteindre « Envoyé ». Elles occupent désormais la même
              place, et l'on choisit celle qu'on regarde.
              PLUS DE TITRES DE SECTION : le segment actif les dit. */}
          <div className="max-w-[360px]">
            <OngletsLigne
              options={[
                { cle: "a_envoyer", label: "To send" },
                { cle: "envoye", label: "Sent" },
              ]}
              cleActive={vue}
              surChoix={(cle) => setVue(cle as Vue)}
              ariaLabel="To send or sent"
            />
          </div>

          {/* ---------- LES FICHES À ENVOYER ---------- */}
          {vue === "a_envoyer" && (
            <section>
              {aEnvoyer.length === 0 ? (
                <p className="rounded-2xl bg-sombre-carte px-4 py-6 text-center
                              text-[14px] text-sombre-texte-doux">
                  Nothing to send.
                </p>
              ) : (
              <>
              {/* LA PLACE DU HAUT REVIENT À L'ACTION (passe nº 142) :
                  c'est le bouton qui s'y tient, là où se lisait
                  « N en ligne sur M ». Le compte, lui, descend sous le
                  tableau — c'est un CONSTAT, pas un geste, et un
                  constat se lit après ce qu'il compte. */}
              <div className="flex justify-end px-1">
                {/* L'ACTION FINALE DE L'ÉCRAN : capsule pleine rose, une
                    seule — et elle ne s'allume qu'avec une sélection.
                    ⚠️ SANS L'AVION (passe nº 142) : le libellé dit déjà
                    tout, et le dessin d'un avion promettait un envoi
                    que ce bouton ne fait pas — il compose un message,
                    c'est l'écran suivant qui envoie. */}
                <button
                  type="button"
                  disabled={cochees.length === 0 || enCours === "selection"}
                  onClick={() => void composerLeMessage()}
                  className={`inline-flex w-full items-center justify-center
                             rounded-full min-h-[50px] text-[15px] font-semibold
                             transition-colors sm:w-auto sm:px-8 ${
                               cochees.length > 0
                                 ? "bg-primaire hover:bg-primaire-fonce text-white"
                                 : "bg-sombre-eleve text-sombre-texte-doux cursor-not-allowed"
                             }`}
                >
                  {enCours === "selection"
                    ? "One moment…"
                    : cochees.length > 1
                      ? `Write the message (${cochees.length} portfolios)`
                      : "Write the message"}
                </button>
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {aEnvoyer.map((fiche) => {
                  const choisie = cochees.includes(fiche.id);
                  return (
                    <li
                      key={fiche.id}
                      className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl
                                  px-4 py-3 transition-colors ${
                                    choisie
                                      ? "bg-sombre-eleve-clair"
                                      : "bg-sombre-carte"
                                  }`}
                    >
                      {/* LA CASE — c'est elle qui groupe : on coche les
                          fiches d'un MÊME tatoueur, puis on valide.
                          Sur l'étroit, l'identité prend TOUTE la rangée
                          (w-full) : interrupteur, état et date se replient
                          dessous au lieu d'écraser le nom. */}
                      <label className="flex w-full min-w-0 cursor-pointer items-center gap-3 sm:w-auto sm:flex-1">
                        <input
                          type="checkbox"
                          checked={choisie}
                          onChange={(e) =>
                            setCochees((liste) =>
                              e.target.checked
                                ? [...liste, fiche.id]
                                : liste.filter((id) => id !== fiche.id)
                            )
                          }
                          aria-label={`Reach out to ${fiche.nom}`}
                          className="h-[18px] w-[18px] shrink-0 accent-primaire"
                        />
                        <Vignette fiche={fiche} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-semibold text-sombre-texte">
                            {fiche.nom}
                          </span>
                          <span className="block truncate text-[12.5px] text-sombre-texte-doux">
                            {LIBELLE_TYPE_FICHE[fiche.type]}
                            {fiche.ville ? ` · ${fiche.ville}` : ""}
                          </span>
                        </span>
                      </label>

                      <Interrupteur
                        actif={fiche.enLigne}
                        occupe={enCours === fiche.id}
                        libelle={`Make ${fiche.nom} public`}
                        onBascule={() => void basculer(fiche)}
                      />

                      <span className="w-[104px] shrink-0">
                        <Etat etat="a_envoyer" />
                      </span>
                      <span className="w-[70px] shrink-0 text-right text-[12.5px] text-sombre-texte-doux">
                        {dateCourte(fiche.date)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* LE COMPTE, EN BAS À DROITE — sous ce qu'il compte. */}
              <p className="mt-3 px-1 text-right text-[13px] text-sombre-texte-doux">
                {enLigneCount} online out of {aEnvoyer.length}
              </p>
              </>
              )}
            </section>
          )}

          {/* ---------- LES ENVOIS — les lignes fusionnées ---------- */}
          {vue === "envoye" && (
            <section>
              {groupes.length === 0 ? (
                <p className="rounded-2xl bg-sombre-carte px-4 py-6 text-center
                              text-[14px] text-sombre-texte-doux">
                  Nothing sent yet.
                </p>
              ) : (
              <ul className="flex flex-col gap-2">
                {groupes.map((groupe) => (
                  <li
                    key={groupe.id}
                    className="rounded-2xl bg-sombre-carte px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                      {/* LES FICHES EMPILÉES — photos et noms, l'une
                          sous l'autre : c'est UN envoi, pas trois. Même
                          repli que la liste À envoyer sur l'étroit. */}
                      <ul className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-1">
                        {groupe.fiches.map((fiche) => (
                          <li
                            key={fiche.id}
                            className="flex items-center gap-3"
                          >
                            <Vignette fiche={fiche} taille={34} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-semibold text-sombre-texte">
                                {fiche.nom}
                                {fiche.retiree && (
                                  <span className="ml-2 text-[12px] font-normal text-erreur">
                                    removed
                                  </span>
                                )}
                              </span>
                              <span className="block truncate text-[12px] text-sombre-texte-doux">
                                {LIBELLE_TYPE_FICHE[fiche.type]}
                                {fiche.slug && (
                                  <>
                                    {" · "}
                                    <Link
                                      href={`/artist/${fiche.slug}`}
                                      target="_blank"
                                      className="underline underline-offset-2 hover:text-primaire"
                                    >
                                      /artist/{fiche.slug}
                                    </Link>
                                  </>
                                )}
                              </span>
                            </span>
                            {/* LA RESTAURATION — ce que voit
                                l'administrateur d'une suppression :
                                pas une disparition, une fiche
                                « retirée » qu'il peut remettre. */}
                            {fiche.retiree && (
                              <button
                                type="button"
                                disabled={enCours === fiche.id}
                                onClick={() => void restaurer(fiche)}
                                className="shrink-0 rounded-full bg-sombre-eleve px-4 min-h-[36px]
                                           text-[12.5px] font-semibold text-sombre-texte
                                           hover:bg-sombre-eleve-clair transition-colors
                                           disabled:opacity-50"
                              >
                                {enCours === fiche.id ? "…" : "Restore"}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      <span className="w-[104px] shrink-0">
                        <Etat etat={groupe.etat} />
                      </span>
                      <span className="w-[70px] shrink-0 text-right text-[12.5px] text-sombre-texte-doux">
                        {dateCourte(
                          groupe.retireLe ?? groupe.rattacheLe ?? groupe.envoyeLe
                        )}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button
                        type="button"
                        onClick={() => setOuvert(groupe)}
                        className="inline-flex items-center gap-2 rounded-full bg-sombre-eleve
                                   px-4 min-h-[38px] text-[13px] font-semibold text-sombre-texte
                                   hover:bg-sombre-eleve-clair transition-colors"
                      >
                        See the message
                      </button>
                      <code className="min-w-0 flex-1 truncate text-[12px] text-sombre-texte-doux">
                        {groupe.lien}
                      </code>
                    </div>

                    {/* ANNULER L'ENVOI (passe nº 142) — un message
                        généré par erreur n'avait aucune issue : la
                        ligne restait « Envoyée » à jamais, et la seule
                        sortie était de toucher la base à la main.
                        TEXTE BRUT, comme toute action qui défait, et
                        une CONFIRMATION, parce que le jeton meurt avec
                        la ligne : le lien déjà envoyé cesse de mener
                        quelque part.
                        Seulement sur un envoi que personne n'a encore
                        touché — un rattachement ou un retrait est le
                        geste de quelqu'un d'autre, on ne le réécrit
                        pas (la route le refuse aussi). */}
                    {groupe.etat === "envoye" &&
                      (aAnnuler === groupe.id ? (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-[13.5px] font-semibold text-sombre-texte">
                            Cancel this send?
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAAnnuler(null)}
                              className="px-2 min-h-[38px] text-[13.5px] font-semibold
                                         text-sombre-texte-doux transition-colors
                                         hover:text-sombre-texte"
                            >
                              No
                            </button>
                            <button
                              type="button"
                              disabled={enCours === groupe.id}
                              onClick={() => {
                                setAAnnuler(null);
                                void annulerLEnvoi(groupe);
                              }}
                              className="px-2 min-h-[38px] text-[13.5px] font-semibold
                                         text-erreur transition-opacity
                                         hover:opacity-75 disabled:opacity-40"
                            >
                              {enCours === groupe.id ? "Canceling…" : "Cancel the send"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAAnnuler(groupe.id)}
                          className="mt-2 px-2 -ml-2 min-h-[38px] text-[13px] font-semibold
                                     text-sombre-texte-doux transition-colors
                                     hover:text-erreur"
                        >
                          Cancel the send
                        </button>
                      ))}

                    {/* CE QUI RESTE À COURIR — dit une fois, en clair. */}
                    {groupe.etat !== "envoye" && (
                      <p className="mt-2 text-[12px] text-sombre-texte-doux">
                        {groupe.etat === "compte_cree"
                          ? `This entry leaves the board ${JOURS_APRES_RATTACHEMENT} days after linking.`
                          : `Permanently deleted ${JOURS_APRES_SUPPRESSION} days after removal.`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}

/** L'INTERRUPTEUR « RENDRE PUBLIQUE » — le même dessin que celui des
    réglages du formulaire : une piste qui s'éclaircit, un curseur qui
    glisse, et le rose quand c'est allumé (c'est l'état d'une fiche,
    l'un des emplois réservés du rose). */
function Interrupteur({
  actif,
  occupe,
  libelle,
  onBascule,
}: {
  actif: boolean;
  occupe: boolean;
  libelle: string;
  onBascule: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={libelle}
      disabled={occupe}
      onClick={onBascule}
      className="shrink-0 inline-flex items-center gap-2.5 min-h-[40px]
                 text-[13px] font-semibold text-sombre-texte-doux
                 transition-colors disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`relative inline-block h-[22px] w-[38px] rounded-full
                    transition-colors ${
                      actif ? "bg-primaire" : "bg-sombre-eleve-clair"
                    }`}
      >
        <span
          className={`absolute top-[3px] h-4 w-4 rounded-full bg-white
                      transition-[left] ${actif ? "left-[19px]" : "left-[3px]"}`}
        />
      </span>
      <span className={actif ? "text-sombre-texte" : ""}>
        {occupe ? "…" : "Online"}
      </span>
    </button>
  );
}

/**
 * L'ÉCRAN DU MESSAGE — prêt à copier, et modifiable
 * ==================================================
 * Le site l'écrit ; l'administrateur le relit et le retouche s'il veut.
 * On ne prétend pas écrire mieux que lui : on lui évite de tout
 * retaper trente fois, et on garantit que les LIENS sont justes —
 * c'est là que l'erreur coûte cher.
 */
function EcranMessage({
  groupe,
  onRetour,
  onValider,
}: {
  groupe: Groupe;
  onRetour: () => void;
  /** Absent quand on RELIT un envoi déjà fait : il n'y a plus rien à
      valider, l'écran n'est alors qu'une lecture. */
  onValider?: (groupe: Groupe) => Promise<void>;
}) {
  const [texte, setTexte] = useState(groupe.message);
  const [copie, setCopie] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider() {
    if (!onValider) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      await onValider(groupe);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Couldn't confirm.");
      setEnvoiEnCours(false);
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
    } catch {
      //  Presse-papiers refusé (page non sécurisée, permission) : on
      //  sélectionne le texte, la copie se fait à la main.
      const zone = document.getElementById("message-demarchage");
      if (zone instanceof HTMLTextAreaElement) zone.select();
    }
    setCopie(true);
    window.setTimeout(() => setCopie(false), 2500);
  }

  return (
    <>
      {/* ⚠️ PLUS DE « Retour au tableau » EN TÊTE (passe nº 142) :
          l'écran a maintenant SES DEUX BOUTONS en bas — « Retour » et
          « Valider l'envoi ». Deux retours à deux endroits, dont l'un
          au-dessus du titre, laissaient croire qu'ils ne faisaient pas
          la même chose. */}
      <h1 className="text-[22px] font-bold text-sombre-texte">The message</h1>

      {/* LES FICHES DE L'ENVOI — de quoi on parle, en tête. */}
      <ul className="mt-4 flex flex-col gap-2">
        {groupe.fiches.map((fiche) => (
          <li
            key={fiche.id}
            className="flex items-center gap-3 rounded-xl bg-sombre-carte px-4 min-h-[54px]"
          >
            <Vignette fiche={fiche} taille={32} />
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-sombre-texte">
              {fiche.nom}
            </span>
            {fiche.slug && (
              <Link
                href={`/artist/${fiche.slug}`}
                target="_blank"
                className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px]
                           text-sombre-texte-doux hover:text-primaire transition-colors"
              >
                View
                <IconeLienExterne taille={14} />
              </Link>
            )}
          </li>
        ))}
      </ul>

      {/* LE MESSAGE, MODIFIABLE. La zone grandit avec le texte : on
          doit le lire en entier avant de l'envoyer à quelqu'un. */}
      <textarea
        id="message-demarchage"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={16}
        aria-label="Outreach message"
        className="mt-5 w-full rounded-2xl border border-transparent bg-sombre-carte
                   px-4 py-4 text-[14px] leading-relaxed text-sombre-texte
                   outline-none transition-colors focus:bg-sombre-eleve
                   [font-family:inherit] resize-y"
      />

      {erreur && <p role="status" className={`mt-4 ${ERREUR}`}>{erreur}</p>}

      {/* LES TROIS GESTES DE L'ÉCRAN, dans l'ordre de la charte :
          « Retour » en TEXTE BRUT (il défait, il ne crée rien),
          « Copier le message » en capsule NATURELLE (geste
          intermédiaire — on copie, puis on valide), et
          « Valider l'envoi » en CAPSULE PLEINE ROSE : c'est l'action
          finale, la seule qui écrive quelque chose.
          ⚠️ AVANT LA PASSE Nº 142, L'ENVOI ÉTAIT DÉJÀ CRÉÉ à l'arrivée
          sur cet écran : « Retour » laissait une ligne derrière lui, et
          rien ne demandait confirmation. Désormais, tant qu'on n'a pas
          touché « Valider l'envoi », rien n'existe. */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetour}
          className="px-2 -ml-2 min-h-[50px] text-[14.5px] font-semibold
                     text-sombre-texte-doux transition-colors
                     hover:text-sombre-texte"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => void copier()}
          className="inline-flex items-center justify-center gap-2 rounded-full
                     min-h-[50px] px-6 bg-sombre-eleve hover:bg-sombre-eleve-clair
                     text-[14.5px] font-semibold text-sombre-texte transition-colors"
        >
          <IconeCocheListe taille={18} />
          {copie ? "Copied" : "Copy the message"}
        </button>

        {onValider && (
          <button
            type="button"
            disabled={envoiEnCours}
            onClick={() => void valider()}
            className="inline-flex flex-1 items-center justify-center rounded-full
                       min-h-[50px] bg-primaire hover:bg-primaire-fonce
                       text-[15px] font-semibold text-white transition-colors
                       disabled:opacity-60 sm:flex-none sm:px-8"
          >
            {envoiEnCours ? "One moment…" : "Confirm the send"}
          </button>
        )}
      </div>

      <p className="mt-4 text-[12.5px] text-sombre-texte-doux">
        Claim link: <code>{groupe.lien}</code>
      </p>
    </>
  );
}
