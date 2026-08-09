"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconeAvion,
  IconeCocheListe,
  IconeFlecheRetour,
  IconeLienExterne,
} from "@/components/Icones";
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
  id: string;
  etat: EtatLigne;
  envoyeLe: string;
  rattacheLe: string | null;
  retireLe: string | null;
  lien: string;
  fiches: FicheLigne[];
  message: string;
};

function dateCourte(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
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

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/demarchage");
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        aEnvoyer?: FicheLigne[];
        groupes?: Groupe[];
      } | null;
      if (!reponse.ok || !donnees?.ok) {
        throw new Error(donnees?.message ?? "Lecture impossible.");
      }
      setAEnvoyer(donnees.aEnvoyer ?? []);
      setGroupes(donnees.groupes ?? []);
    } catch (e) {
      setAEnvoyer([]);
      setErreur(e instanceof Error ? e.message : "Lecture impossible.");
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
        throw new Error(donnees?.message ?? "Enregistrement impossible.");
      }
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
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
        throw new Error(donnees?.message ?? "Restauration impossible.");
      }
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Restauration impossible.");
    } finally {
      setEnCours(null);
    }
  }

  /** VALIDER LA SÉLECTION : un jeton naît, le message s'ouvre. */
  async function validerLaSelection() {
    if (cochees.length === 0) return;
    setEnCours("selection");
    setErreur(null);
    try {
      const reponse = await fetch("/api/admin/yokofolio/demarchage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiches: cochees }),
      });
      const donnees = (await reponse.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        groupe?: Groupe;
      } | null;
      if (!reponse.ok || !donnees?.ok || !donnees.groupe) {
        throw new Error(donnees?.message ?? "Création impossible.");
      }
      setCochees([]);
      setOuvert(donnees.groupe);
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setEnCours(null);
    }
  }

  /* ================================================================
   * L'ÉCRAN DU MESSAGE — il remplace le tableau, comme l'écran de
   * vérification d'une fiche remplace la file d'attente.
   * ============================================================== */
  if (ouvert) {
    return <EcranMessage groupe={ouvert} onRetour={() => setOuvert(null)} />;
  }

  const enLigneCount = (aEnvoyer ?? []).filter((f) => f.enLigne).length;

  return (
    <>
      <h1 className="text-[22px] font-bold text-sombre-texte">Démarchage</h1>

      {erreur && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-erreur/50 bg-erreur/10 px-4 py-3
                     text-[13.5px] leading-relaxed text-sombre-texte"
        >
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
          Aucune fiche créée depuis un compte administrateur.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {/* ---------- LES FICHES À ENVOYER ---------- */}
          {(aEnvoyer.length > 0 || cochees.length > 0) && (
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
                <h2 className="text-[16px] font-semibold tracking-tight text-sombre-texte">
                  À envoyer
                </h2>
                <span className="text-[13px] text-sombre-texte-doux">
                  {enLigneCount} en ligne sur {aEnvoyer.length}
                </span>
              </div>

              <ul className="mt-3 flex flex-col gap-2">
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
                          aria-label={`Démarcher ${fiche.nom}`}
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
                        libelle={`Rendre publique la fiche ${fiche.nom}`}
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

              {/* L'ACTION FINALE DE L'ÉCRAN : capsule pleine rose, une
                  seule — et elle ne s'allume qu'avec une sélection. */}
              <button
                type="button"
                disabled={cochees.length === 0 || enCours === "selection"}
                onClick={() => void validerLaSelection()}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2
                           rounded-full min-h-[50px] text-[15px] font-semibold
                           transition-colors sm:w-auto sm:px-8 ${
                             cochees.length > 0
                               ? "bg-primaire hover:bg-primaire-fonce text-white"
                               : "bg-sombre-eleve text-sombre-texte-doux cursor-not-allowed"
                           }`}
              >
                <IconeAvion taille={18} />
                {enCours === "selection"
                  ? "Un instant…"
                  : cochees.length > 1
                    ? `Générer le message (${cochees.length} fiches)`
                    : "Générer le message"}
              </button>
            </section>
          )}

          {/* ---------- LES ENVOIS — les lignes fusionnées ---------- */}
          {groupes.length > 0 && (
            <section>
              <div className="px-1">
                <h2 className="text-[16px] font-semibold tracking-tight text-sombre-texte">
                  Envoyés
                </h2>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
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
                                    retirée
                                  </span>
                                )}
                              </span>
                              <span className="block truncate text-[12px] text-sombre-texte-doux">
                                {LIBELLE_TYPE_FICHE[fiche.type]}
                                {fiche.slug && (
                                  <>
                                    {" · "}
                                    <Link
                                      href={`/tatoueur/${fiche.slug}`}
                                      target="_blank"
                                      className="underline underline-offset-2 hover:text-primaire"
                                    >
                                      /tatoueur/{fiche.slug}
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
                                {enCours === fiche.id ? "…" : "Restaurer"}
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
                        Voir le message
                      </button>
                      <code className="min-w-0 flex-1 truncate text-[12px] text-sombre-texte-doux">
                        {groupe.lien}
                      </code>
                    </div>

                    {/* CE QUI RESTE À COURIR — dit une fois, en clair. */}
                    {groupe.etat !== "envoye" && (
                      <p className="mt-2 text-[12px] text-sombre-texte-doux">
                        {groupe.etat === "compte_cree"
                          ? `Cette entrée disparaît du tableau ${JOURS_APRES_RATTACHEMENT} jours après le rattachement.`
                          : `Suppression définitive ${JOURS_APRES_SUPPRESSION} jours après le retrait.`}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
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
        {occupe ? "…" : "En ligne"}
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
}: {
  groupe: Groupe;
  onRetour: () => void;
}) {
  const [texte, setTexte] = useState(groupe.message);
  const [copie, setCopie] = useState(false);

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
      <button
        type="button"
        onClick={onRetour}
        className="inline-flex items-center gap-2 min-h-[40px] text-[14px]
                   text-sombre-texte-doux hover:text-sombre-texte transition-colors"
      >
        <IconeFlecheRetour taille={18} />
        Retour au tableau
      </button>

      <h1 className="mt-2 text-[22px] font-bold text-sombre-texte">
        Le message
      </h1>

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
                href={`/tatoueur/${fiche.slug}`}
                target="_blank"
                className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px]
                           text-sombre-texte-doux hover:text-primaire transition-colors"
              >
                Voir
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
        aria-label="Message de démarchage"
        className="mt-5 w-full rounded-2xl border border-transparent bg-sombre-carte
                   px-4 py-4 text-[14px] leading-relaxed text-sombre-texte
                   outline-none transition-colors focus:bg-sombre-eleve
                   [font-family:inherit] resize-y"
      />

      <button
        type="button"
        onClick={() => void copier()}
        className="mt-4 inline-flex w-full items-center justify-center gap-2
                   rounded-full min-h-[50px] bg-primaire hover:bg-primaire-fonce
                   text-[15px] font-semibold text-white transition-colors
                   sm:w-auto sm:px-8"
      >
        <IconeCocheListe taille={18} />
        {copie ? "Copié" : "Copier le message"}
      </button>

      <p className="mt-4 text-[12.5px] text-sombre-texte-doux">
        Lien de rattachement&nbsp;: <code>{groupe.lien}</code>
      </p>
    </>
  );
}
