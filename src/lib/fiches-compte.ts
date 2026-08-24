"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * LES FICHES D'UN COMPTE — un compte, PLUSIEURS fiches
 * =====================================================
 * Un artiste qui possède aussi son salon, un gérant qui administre
 * trois établissements : un compte gère désormais une LISTE de
 * fiches, chacune avec son propre état.
 *
 * TOUT CE QUI SUIT VIT ICI, ET NULLE PART AILLEURS :
 *  - comment on LIT la liste des fiches d'un compte ;
 *  - comment on déduit l'ÉTAT d'une fiche (en attente, en ligne,
 *    hors ligne, modifications, suppression en cours) ;
 *  - LAQUELLE est la fiche « active » — celle sur laquelle
 *    travaillent le formulaire, l'aperçu et le menu.
 *
 * LA FICHE ACTIVE se choisit dans cet ordre, du plus explicite au
 * plus commode :
 *   1. l'identifiant demandé dans l'adresse (?fiche=…) ;
 *   2. celui mémorisé dans le navigateur (le dernier choisi) ;
 *   3. la première de la liste.
 * Ce dernier repli garantit qu'il y a TOUJOURS une fiche active dès
 * qu'il en existe une — jamais d'écran vide par accident.
 */

/** Une fiche telle que l'espace du compte a besoin de la connaître. */
export type FicheDuCompte = {
  id: string;
  nom: string;
  slug: string | null;
  publie: boolean;
  statut: string | null;
  brouillon: unknown;
  hors_ligne: boolean | null;
  supprime_le: string | null;
  purge_le: string | null;
  cree_le: string | null;
  /** §1 (nº 549) — LA PHOTO DE PROFIL DU PORTFOLIO. Lue ici parce que
      la page « Mon compte » du doigt la montre en tête (le rond de
      64 px qui remplace le cœur de la marque). Elle est écrite DÈS
      L'ENREGISTREMENT de la fiche, pas à sa publication
      (FormulaireFiche, la charge principale) : un portfolio en attente
      de validation porte donc déjà la sienne. Nulle quand rien n'a
      été déposé. */
  photo_profil: string | null;
};

/** L'état d'une fiche, tel que l'espace du compte l'affiche. */
export type EtatFiche =
  | "attente"
  | "enLigne"
  | "modifications"
  | "horsLigne"
  | "suppression"
  | "aucune";

/** Les colonnes lues — nommées une seule fois. */
const COLONNES =
  "id, nom, slug, publie, statut, brouillon, hors_ligne, supprime_le, purge_le, cree_le, photo_profil";

/** Les colonnes qui n'existent qu'après une migration récente : si
    l'une manque, on relit sans elle plutôt que de tout perdre. */
//  §1 (nº 549) — `photo_profil` rejoint les DEUX listes : c'est une
//  colonne de toujours (la fiche publique la lit depuis longtemps),
//  elle ne peut donc pas faire échouer la lecture de repli.
const COLONNES_SOBRES =
  "id, nom, slug, publie, statut, brouillon, photo_profil";

/**
 * TOUTES LES FICHES DU COMPTE, de la plus ancienne à la plus récente
 * (la première créée reste la première de la liste — l'ordre ne
 * change pas sous les yeux de la personne).
 */
export async function chargerFichesDuCompte(
  supabase: SupabaseClient,
  idUtilisateur: string
): Promise<FicheDuCompte[]> {
  // Le type de retour varie avec la liste de colonnes : on ne garde
  // que ce qui nous intéresse — l'erreur et les lignes brutes.
  let reponse: { error: unknown; data: unknown } = await supabase
    .from("tatoueurs")
    .select(COLONNES)
    .eq("user_id", idUtilisateur)
    .order("cree_le", { ascending: true });
  if (reponse.error) {
    reponse = await supabase
      .from("tatoueurs")
      .select(COLONNES_SOBRES)
      .eq("user_id", idUtilisateur);
  }
  if (reponse.error || !Array.isArray(reponse.data)) return [];
  return (reponse.data as Array<Record<string, unknown>>).map((ligne) => ({
    id: String(ligne.id),
    nom: String(ligne.nom ?? "Fiche sans nom"),
    slug: (ligne.slug as string | null) ?? null,
    publie: Boolean(ligne.publie),
    statut: (ligne.statut as string | null) ?? null,
    brouillon: ligne.brouillon ?? null,
    hors_ligne: (ligne.hors_ligne as boolean | null) ?? null,
    supprime_le: (ligne.supprime_le as string | null) ?? null,
    purge_le: (ligne.purge_le as string | null) ?? null,
    cree_le: (ligne.cree_le as string | null) ?? null,
    photo_profil: (ligne.photo_profil as string | null) ?? null,
  }));
}

/**
 * L'ÉTAT D'UNE FICHE — l'ordre des tests compte : une suppression en
 * cours prime sur tout le reste (c'est la nouvelle la plus grave),
 * puis une mise hors ligne, puis les modifications demandées, puis
 * l'attente de validation, et enfin la mise en ligne.
 */
export function etatDeLaFiche(fiche: FicheDuCompte | null): EtatFiche {
  if (!fiche) return "aucune";
  if (fiche.purge_le || fiche.supprime_le) return "suppression";
  if (fiche.hors_ligne) return "horsLigne";
  if (fiche.statut === "modifications") return "modifications";
  if (
    (fiche.statut ?? "en_attente") === "en_attente" &&
    (!fiche.publie || fiche.brouillon != null)
  ) {
    return "attente";
  }
  if (fiche.publie) return "enLigne";
  return "aucune";
}

/** Le libellé court d'un état — celui qui s'affiche dans le
    sélecteur, à côté du nom de chaque fiche. */
export const LIBELLE_ETAT: Record<EtatFiche, string> = {
  attente: "En validation",
  enLigne: "En ligne",
  modifications: "À corriger",
  horsLigne: "Hors ligne",
  suppression: "Suppression en cours",
  aucune: "Brouillon",
};

/** La couleur de la pastille d'état — la même grammaire partout. */
export const COULEUR_ETAT: Record<EtatFiche, string> = {
  attente: "bg-primaire",
  enLigne: "bg-[#34D399]",
  modifications: "bg-erreur",
  horsLigne: "bg-erreur",
  suppression: "bg-erreur",
  aucune: "bg-sombre-texte-doux",
};

/* ------------------------------------------------------------------
 * LA FICHE ACTIVE — mémorisée d'une page à l'autre
 * ------------------------------------------------------------------ */

const CLE_MEMOIRE = "yokofolio-fiche-active";

/** L'identifiant retenu la dernière fois, s'il y en a un. */
export function ficheMemorisee(): string | null {
  try {
    return window.localStorage.getItem(CLE_MEMOIRE);
  } catch {
    return null;
  }
}

/** Retient le choix — sans jamais faire échouer l'interface si le
    navigateur refuse d'écrire (navigation privée…). */
export function memoriserFiche(id: string | null) {
  try {
    if (id) window.localStorage.setItem(CLE_MEMOIRE, id);
    else window.localStorage.removeItem(CLE_MEMOIRE);
  } catch {
    // Rien à faire : le repli sur la première fiche reste valable.
  }
}

/**
 * LAQUELLE TRAVAILLE-T-ON ? L'adresse d'abord, la mémoire ensuite, la
 * première de la liste en dernier recours.
 */
export function ficheActive(
  fiches: FicheDuCompte[],
  idDemande?: string | null
): FicheDuCompte | null {
  if (fiches.length === 0) return null;
  if (idDemande) {
    const voulue = fiches.find((f) => f.id === idDemande);
    if (voulue) return voulue;
  }
  const retenue = ficheMemorisee();
  if (retenue) {
    const memorisee = fiches.find((f) => f.id === retenue);
    if (memorisee) return memorisee;
  }
  return fiches[0];
}
