import { NextRequest, NextResponse } from "next/server";
//  nº 756 — LES BORNES DU NOM VIENNENT DU CATALOGUE : l'administration
//  corrige ce même nom à l'acceptation (api/admin/yokofolio/
//  demandes-convention), et deux bornes recopiées auraient divergé.
import {
  NOM_CONVENTION_MAXIMUM,
  NOM_CONVENTION_MINIMUM,
} from "@/lib/conventions";
import { slugifier } from "@/lib/slug";
import { creerNotification } from "@/lib/notifications";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * PROPOSER UNE CONVENTION — “Convention missing? Let us know” (nº 750)
 * ====================================================================
 * LE DÉCALQUE EXACT DE « UN STYLE MANQUE ? » (api/artist/
 * suggestion-style, nº 122), pièce par pièce — c'est la conception
 * nº 748-E, et le décalque est volontaire : deux mécanismes de demande
 * qui se ressembleraient sans se copier finiraient par diverger.
 *
 * CE QUI CHANGE, ET C'EST TOUT : un style se compare par SLUG SEUL, une
 * convention par SLUG **ET PAYS** — « Tattoo Expo » à Berlin et « Tattoo
 * Expo » à Austin sont deux conventions, pas un doublon. C'est aussi la
 * clé de l'index unique posé en base (`conventions_slug_pays_uniques`).
 *
 * RÉSERVÉ AUX COMPTES CONNECTÉS, pour la raison de la nº 122 : une
 * demande anonyme n'aurait personne à prévenir de la réponse.
 *
 * DEUX REFUS POSSIBLES, dits AVANT d'écrire quoi que ce soit — une
 * demande inutile ne doit pas atterrir sur le bureau de
 * l'administration :
 *  1. LA CONVENTION EXISTE DÉJÀ dans ce pays (une ligne « acceptee ») :
 *     on répond avec son VRAI nom, pour que l'artiste sache sous quel
 *     libellé la chercher dans le menu ;
 *  2. LA MÊME DEMANDE EST DÉJÀ EN ATTENTE, du même compte. La
 *     reproposer ne l'accélère pas.
 * ⚠️ AUCUN QUOTA, comme pour les styles depuis la nº 304 : rien ne
 * limite le nombre de demandes.
 *
 * ⚠️ L'ÉCRAN D'ADMINISTRATION QUI LES TRAITE EST ARRIVÉ À LA nº 756
 * (api/admin/yokofolio/demandes-convention, et la section
 * « Suggestions » de l'admin). Une demande déposée attend en base,
 * `etat = 'en_attente'` — et n'apparaît dans AUCUN menu tant qu'elle
 * n'est pas acceptée : la lecture du catalogue ne prend que les lignes
 * « acceptee » (lib/conventions).
 */

/** Les deux issues rendues au navigateur, en plus de la réussite. */
type Refus = "existe" | "doublon";

/*  ⚠️ nº 756 — LES BORNES DU NOM ONT DÉMÉNAGÉ dans `lib/conventions`
    (voir l'import) : l'écran d'administration les lit aussi. Le motif
    de leur valeur est écrit là-bas, il n'est pas recopié ici. */
const MESSAGE_MAXIMUM = 300;

export async function POST(requete: NextRequest) {
  /* ---- 1. QUI DEMANDE ? ---- */
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "You need to be logged in to suggest a convention.",
      },
      { status: 401 }
    );
  }

  /* ---- 2. CE QUI EST DEMANDÉ ---- */
  const corps = (await requete.json().catch(() => null)) as {
    propose?: string;
    codePays?: string | null;
    message?: string | null;
    ficheId?: string | null;
  } | null;

  const propose = (corps?.propose ?? "").trim().replace(/\s+/g, " ");
  if (
    propose.length < NOM_CONVENTION_MINIMUM ||
    propose.length > NOM_CONVENTION_MAXIMUM
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: `Enter the convention's name (${NOM_CONVENTION_MINIMUM} to ${NOM_CONVENTION_MAXIMUM} characters).`,
      },
      { status: 400 }
    );
  }

  //  LE PAYS EST OBLIGATOIRE, et la base le redit (`code_pays not null`
  //  + `check (code_pays ~ '^[A-Z]{2}$')`) : c'est la CLÉ du menu
  //  déroulant — une convention sans pays ne pourrait se ranger nulle
  //  part.
  const codePays = (corps?.codePays ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(codePays)) {
    return NextResponse.json(
      { ok: false, message: "Choose this convention's country." },
      { status: 400 }
    );
  }

  const slug = slugifier(propose);
  if (!slug) {
    return NextResponse.json(
      { ok: false, message: "This name has no letters." },
      { status: 400 }
    );
  }

  const message = (corps?.message ?? "").trim().slice(0, MESSAGE_MAXIMUM);

  try {
    const admin = creerClientSupabaseAdmin();

    /* ---- 3. LA CONVENTION EXISTE-T-ELLE DÉJÀ DANS CE PAYS ? ---- */
    //  On lit les acceptées de ce pays et on compare par SLUG : deux
    //  orthographes du même nom sont la même convention.
    const { data: acceptees, error: erreurCatalogue } = await admin
      .from("conventions")
      .select("nom, slug")
      .eq("etat", "acceptee")
      .eq("code_pays", codePays);
    if (erreurCatalogue) throw new Error(erreurCatalogue.message);

    const deja = (
      (acceptees ?? []) as Array<{ nom: string | null; slug: string | null }>
    ).find((ligne) => (ligne.slug ?? slugifier(ligne.nom ?? "")) === slug);
    if (deja) {
      return NextResponse.json({
        ok: false,
        refus: "existe" satisfies Refus,
        libelle: deja.nom ?? propose,
        message: `"${deja.nom ?? propose}" is already on the list.`,
      });
    }

    /* ---- 4. LA MÊME DEMANDE EST-ELLE DÉJÀ EN ATTENTE ? ---- */
    const { data: siennes, error: erreurSiennes } = await admin
      .from("conventions")
      .select("propose, code_pays, etat")
      .eq("propose_par", user.id)
      .eq("etat", "en_attente")
      .limit(100);
    if (erreurSiennes) throw new Error(erreurSiennes.message);

    const enAttente = (
      (siennes ?? []) as Array<{ propose: string; code_pays: string }>
    ).some(
      (ligne) =>
        ligne.code_pays === codePays && slugifier(ligne.propose) === slug
    );
    if (enAttente) {
      return NextResponse.json({
        ok: false,
        refus: "doublon" satisfies Refus,
        message: "You already suggested this convention — it's under review.",
      });
    }

    /* ---- 5. L'ÉCRITURE ---- */
    //  ⚠️ PAR LA CLÉ DE SERVICE, pour la raison de la nº 122 : le nom
    //  de la fiche doit être recopié tel qu'il est EN BASE — un
    //  navigateur peut envoyer ce qu'il veut dans `ficheId`.
    let ficheNom: string | null = null;
    let ficheId: string | null = null;
    if (corps?.ficheId) {
      const { data: fiche } = await admin
        .from("tatoueurs")
        .select("id, nom, user_id")
        .eq("id", corps.ficheId)
        .maybeSingle();
      const ligne = fiche as {
        id: string;
        nom: string | null;
        user_id: string | null;
      } | null;
      //  La fiche n'est retenue que si elle appartient bien au
      //  demandeur : sinon on garde la demande, sans le contexte.
      if (ligne && ligne.user_id === user.id) {
        ficheId = ligne.id;
        ficheNom = ligne.nom ?? null;
      }
    }

    //  ⚠️ NI `nom` NI `slug` NI `traite_le` : ce sont les colonnes de la
    //  DÉCISION, posées par l'administration à l'acceptation. La règle
    //  d'accès de la base l'exige d'ailleurs pour une insertion par un
    //  compte ordinaire (politique « proposer une convention ») ; on
    //  écrit ici avec la clé de service, mais on s'y tient — personne
    //  ne s'auto-accepte, quel que soit le chemin.
    const { error } = await admin.from("conventions").insert({
      propose,
      code_pays: codePays,
      message: message || null,
      propose_par: user.id,
      fiche_id: ficheId,
      fiche_nom: ficheNom,
      etat: "en_attente",
    });
    if (error) throw new Error(error.message);

    //  L'ACCUSÉ DE RÉCEPTION (le motif de la nº 132) — la demande vient
    //  d'entrer en file : la boîte de nouvelles le dit, pour que la
    //  réponse n'arrive pas de nulle part des jours plus tard. Jamais
    //  bloquant, comme toujours.
    await creerNotification({
      userId: user.id,
      ficheId,
      ficheNom,
      genre: "demande_convention",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `The request couldn't be saved (was the migration supabase/yokofolio-conventions-et-independent.sql run?): ${
          e instanceof Error ? e.message : String(e)
        }`,
      },
      { status: 500 }
    );
  }
}
