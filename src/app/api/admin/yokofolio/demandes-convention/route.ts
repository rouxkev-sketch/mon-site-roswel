import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import {
  NOM_CONVENTION_MAXIMUM,
  NOM_CONVENTION_MINIMUM,
} from "@/lib/conventions";
import { adresseDuSite, envoyerEmail } from "@/lib/email";
import { creerNotification } from "@/lib/notifications";
import { slugifier } from "@/lib/slug";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * ADMIN YOKOFOLIO — LES DEMANDES DE CONVENTION (passe nº 756)
 * ==========================================================
 * LE DÉCALQUE DE `suggestions-styles` (nº 122), pièce par pièce — et
 * le décalque est VOULU, c'est la consigne du propriétaire : deux
 * écrans de traitement qui se ressembleraient sans se copier finiraient
 * par diverger. La route de DÉPÔT l'avait déjà fait pour la demande
 * (api/tatoueur/suggestion-convention, nº 750) ; celle-ci le fait pour
 * la décision.
 *
 * GET  : les demandes reçues, les plus récentes d'abord.
 * POST : { id, decision: "accepter" | "refuser", nom?, lieu?, message? }
 *        → tranche.
 *
 * ██ CE QUI DIFFÈRE DES STYLES, ET C'EST TOUT ██
 *  · UN STYLE SE RANGE dans une FAMILLE ; une convention se pose
 *    QUELQUE PART. L'acceptation exige donc une LOCALISATION —
 *    la ville, la région, le pays et le POINT —, saisie par le champ
 *    de localité du site (`ChampLocalisation`, celui du formulaire).
 *    Sans coordonnées, la convention entrerait au catalogue sans
 *    pouvoir situer personne : `lieuDeLaConvention` rendrait `null` et
 *    le mode resterait incomplet à l'écran (nº 750). On refuse donc
 *    avant, plutôt que d'écrire une entrée inutilisable.
 *  · LE DÉDOUBLONNAGE SE FAIT PAR SLUG **ET PAYS**, jamais par slug
 *    seul : « Tattoo Expo » à Berlin et « Tattoo Expo » à Austin sont
 *    deux conventions. C'est la clé de l'index unique posé en base
 *    (`conventions_slug_pays_uniques`), et la règle que la route de
 *    dépôt applique déjà.
 *  · AUCUN CATALOGUE À OUBLIER. Les styles gardent une copie en
 *    mémoire (`oublierStylesAjoutes`) ; les conventions se relisent à
 *    chaque montage du formulaire (`chargerConventionsAcceptees`), il
 *    n'y a rien à invalider.
 *
 * ⚠️ PAS DE « RETIRER » ICI. Les styles savent défaire une acceptation
 * trop rapide (nº 123) ; le propriétaire n'a demandé QUE deux portes
 * pour les conventions — accepter, refuser. Le geste de secours reste
 * celui de toujours : repasser `etat` à « refusee » en SQL.
 *
 * ⚠️ LE PAYS DE LA DEMANDE PEUT ÊTRE CORRIGÉ, et c'est voulu : c'est le
 * champ de localité qui fait foi (« qui remplit ville, région, pays,
 * coordonnées », consigne nº 756-3). Un artiste qui range « Milano
 * Tattoo Convention » sous « FR » ne condamne pas sa demande.
 *
 * Accès : administrateurs uniquement, vérifié CÔTÉ SERVEUR — la même
 * garde que toutes les routes de cet espace (`verifierAdmin`).
 */

/** Le plafond du message d'accompagnement — celui des styles (nº 122) :
    il tient dans une notification et dans un courriel court. */
const MESSAGE_MAXIMUM = 600;

/** LA LOCALISATION POSÉE PAR L'ADMINISTRATION, telle que le champ de
    localité la rend (`LieuTrouve`, réduit à ce que la table porte).
    ⚠️ ELLE EST RELUE, JAMAIS CRUE : un navigateur envoie ce qu'il veut,
    et c'est le serveur qui décide si elle suffit (voir `lieuRetenu`). */
type LieuPropose = {
  ville?: string | null;
  region?: string | null;
  code_pays?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** Ce qu'une ligne de `conventions` rend à l'écran d'administration. */
type LigneConvention = {
  user_id?: string | null;
  propose_par: string | null;
  fiche_id: string | null;
  [cle: string]: unknown;
};

export async function GET() {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }
  try {
    const admin = creerClientSupabaseAdmin();
    const { data, error } = await admin
      .from("conventions")
      .select(
        "id, propose, etat, nom, slug, code_pays, ville, region, latitude, longitude, message, fiche_id, fiche_nom, cree_le, traite_le, propose_par"
      )
      .order("cree_le", { ascending: false });
    if (error) throw new Error(error.message);

    const lignes = (data ?? []) as LigneConvention[];

    /*  ---- L'ADRESSE DE COURRIEL DU PROPOSEUR ----
        Relue dans les comptes, jamais recopiée en base : c'est elle qui
        identifie le demandeur pour l'administration, et elle peut
        changer. (Le motif est celui de la nº 122, au mot près.)
        ⚠️ LA COLONNE S'APPELLE `propose_par` ICI, `user_id` chez les
        styles — c'est la seule différence de nom entre les deux
        tables. Elle est traduite DÈS LA LECTURE, pour que l'écran
        n'ait qu'un seul vocabulaire à connaître. */
    const comptes = new Map<string, string>();
    for (const identifiant of new Set(
      lignes.map((ligne) => ligne.propose_par).filter(Boolean) as string[]
    )) {
      const { data: compte } = await admin.auth.admin.getUserById(identifiant);
      if (compte?.user?.email) comptes.set(identifiant, compte.user.email);
    }

    /*  ---- L'ADRESSE DE SA FICHE (le motif de la nº 123) ----
        Pour aller la CONSULTER avant de décider. Deux chemins, dans cet
        ordre : la fiche d'où la demande est partie, puis à défaut la
        fiche du compte — une demande partie d'un brouillon jamais
        enregistré n'a pas de `fiche_id`, et c'est justement là qu'un
        lien manquerait le plus. Aucune des deux ne répond ? Pas de
        lien — jamais un lien mort. */
    const slugsParFiche = new Map<string, string>();
    const idsFiches = [
      ...new Set(lignes.map((l) => l.fiche_id).filter(Boolean) as string[]),
    ];
    if (idsFiches.length > 0) {
      const { data: fiches } = await admin
        .from("tatoueurs")
        .select("id, slug")
        .in("id", idsFiches);
      for (const fiche of (fiches ?? []) as Array<{
        id: string;
        slug: string | null;
      }>) {
        if (fiche.slug) slugsParFiche.set(fiche.id, fiche.slug);
      }
    }

    const slugsParCompte = new Map<string, string>();
    const comptesSansFiche = [
      ...new Set(
        lignes
          .filter((l) => l.propose_par && !slugsParFiche.has(l.fiche_id ?? ""))
          .map((l) => l.propose_par) as string[]
      ),
    ];
    if (comptesSansFiche.length > 0) {
      const { data: fiches } = await admin
        .from("tatoueurs")
        .select("user_id, slug, cree_le")
        .in("user_id", comptesSansFiche)
        .is("supprime_le", null)
        .order("cree_le", { ascending: false });
      for (const fiche of (fiches ?? []) as Array<{
        user_id: string;
        slug: string | null;
      }>) {
        //  La PREMIÈRE rencontrée est la plus récente (tri ci-dessus).
        if (fiche.slug && !slugsParCompte.has(fiche.user_id)) {
          slugsParCompte.set(fiche.user_id, fiche.slug);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      demandes: lignes.map((ligne) => ({
        ...ligne,
        courriel: ligne.propose_par
          ? (comptes.get(ligne.propose_par) ?? null)
          : null,
        fiche_slug:
          (ligne.fiche_id ? slugsParFiche.get(ligne.fiche_id) : null) ??
          (ligne.propose_par ? slugsParCompte.get(ligne.propose_par) : null) ??
          null,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Lecture impossible (migration supabase/yokofolio-conventions-et-independent.sql passée ?) : ${
          e instanceof Error ? e.message : String(e)
        }`,
      },
      { status: 500 }
    );
  }
}

export async function POST(requete: NextRequest) {
  const refus = await verifierAdmin();
  if (refus) {
    return NextResponse.json(
      { ok: false, message: refus.message },
      { status: refus.statut }
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    id?: string;
    decision?: "accepter" | "refuser";
    nom?: string;
    lieu?: LieuPropose | null;
    message?: string;
  } | null;

  const DECISIONS = ["accepter", "refuser"] as const;
  if (!corps?.id || !DECISIONS.includes(corps.decision as never)) {
    return NextResponse.json(
      { ok: false, message: "Demande incomplète." },
      { status: 400 }
    );
  }

  const message = (corps.message ?? "").trim().slice(0, MESSAGE_MAXIMUM);

  try {
    const admin = creerClientSupabaseAdmin();

    /* ---- LA DEMANDE, TELLE QU'ELLE EST EN BASE ---- */
    const { data: ligne, error: erreurLecture } = await admin
      .from("conventions")
      .select("id, propose, etat, code_pays, propose_par, fiche_id, fiche_nom")
      .eq("id", corps.id)
      .maybeSingle();
    if (erreurLecture) throw new Error(erreurLecture.message);
    const demande = ligne as {
      id: string;
      propose: string;
      etat: string;
      code_pays: string;
      propose_par: string | null;
      fiche_id: string | null;
      fiche_nom: string | null;
    } | null;
    if (!demande) {
      return NextResponse.json(
        { ok: false, message: "Cette demande n'existe plus." },
        { status: 404 }
      );
    }
    if (demande.etat !== "en_attente") {
      return NextResponse.json(
        { ok: false, message: "Cette demande a déjà été tranchée." },
        { status: 409 }
      );
    }

    /* ---- CE QU'ON ÉCRIT ---- */
    let nom: string | null = null;
    let slug: string | null = null;
    let codePays = demande.code_pays;
    let ville: string | null = null;
    let region: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (corps.decision === "accepter") {
      //  LE NOM RETENU : celui de l'administration s'il en a donné un,
      //  sinon la proposition telle quelle. Les bornes viennent du
      //  catalogue — les mêmes que celles du dépôt (nº 756).
      nom = (corps.nom ?? demande.propose).trim().replace(/\s+/g, " ");
      if (
        nom.length < NOM_CONVENTION_MINIMUM ||
        nom.length > NOM_CONVENTION_MAXIMUM
      ) {
        return NextResponse.json(
          {
            ok: false,
            message: `Le nom de la convention doit faire ${NOM_CONVENTION_MINIMUM} à ${NOM_CONVENTION_MAXIMUM} caractères.`,
          },
          { status: 400 }
        );
      }
      slug = slugifier(nom);
      if (!slug) {
        return NextResponse.json(
          { ok: false, message: "Ce nom ne contient aucune lettre." },
          { status: 400 }
        );
      }

      //  LA LOCALISATION — obligatoire, et vérifiée ICI : le champ de
      //  localité la rend complète, mais c'est le serveur qui tranche.
      const lieu = corps.lieu ?? null;
      latitude = typeof lieu?.latitude === "number" ? lieu.latitude : null;
      longitude = typeof lieu?.longitude === "number" ? lieu.longitude : null;
      if (latitude === null || longitude === null) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Choisis la ville de la convention dans la liste — c'est elle qui donne ses coordonnées.",
          },
          { status: 400 }
        );
      }
      ville = (lieu?.ville ?? "").trim() || null;
      region = (lieu?.region ?? "").trim() || null;
      //  LE PAYS DU LIEU FAIT FOI quand il en porte un (consigne
      //  nº 756-3) ; sinon celui de la demande reste. La base le
      //  redit : `code_pays not null check (~ '^[A-Z]{2}$')`.
      const paysDuLieu = (lieu?.code_pays ?? "").trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(paysDuLieu)) codePays = paysDuLieu;
      if (!/^[A-Z]{2}$/.test(codePays)) {
        return NextResponse.json(
          { ok: false, message: "Le pays de cette convention est illisible." },
          { status: 400 }
        );
      }

      /*  ⚠️ LE COUPLE (SLUG, PAYS) DOIT ÊTRE LIBRE. La base a son index
          unique sur les lignes acceptées ; on le vérifie AVANT pour
          rendre un message lisible plutôt qu'une erreur de contrainte —
          et pour nommer la convention qui occupe déjà la place, comme
          la route de dépôt le fait pour l'artiste. */
      const { data: acceptees, error: erreurCatalogue } = await admin
        .from("conventions")
        .select("id, nom, slug")
        .eq("etat", "acceptee")
        .eq("code_pays", codePays);
      if (erreurCatalogue) throw new Error(erreurCatalogue.message);
      const collision = (
        (acceptees ?? []) as Array<{
          id: string;
          nom: string | null;
          slug: string | null;
        }>
      ).find(
        (autre) =>
          autre.id !== demande.id &&
          (autre.slug ?? slugifier(autre.nom ?? "")) === slug
      );
      if (collision) {
        return NextResponse.json(
          {
            ok: false,
            message: `« ${collision.nom ?? slug} » occupe déjà cette place dans ce pays. Choisis un autre nom.`,
          },
          { status: 409 }
        );
      }
    }

    /* ---- LA DÉCISION ---- */
    const accepte = corps.decision === "accepter";
    const { error: erreurEcriture } = await admin
      .from("conventions")
      .update({
        etat: accepte ? "acceptee" : "refusee",
        nom,
        slug,
        //  ⚠️ LE PAYS N'EST RÉÉCRIT QUE SUR UNE ACCEPTATION : une
        //  demande refusée garde le sien, tel que l'artiste l'a rangée.
        ...(accepte ? { code_pays: codePays } : {}),
        ville,
        region,
        latitude,
        longitude,
        message: message || null,
        traite_le: new Date().toISOString(),
      })
      .eq("id", demande.id)
      //  ⚠️ ON NE TRANCHE QUE CE QUI EST ENCORE EN ATTENTE : deux
      //  onglets d'administration ouverts sur la même demande ne
      //  peuvent pas se contredire. (Le motif de la nº 122.)
      .eq("etat", "en_attente");
    if (erreurEcriture) throw new Error(erreurEcriture.message);

    /* ---- LA RÉPONSE AU TATOUEUR — deux canaux, jamais bloquants ----
       Une décision d'administration ne doit pas échouer parce qu'un
       service de courriel est en panne : les deux envois sont écrits
       l'un après l'autre, et aucun ne remonte d'erreur. */
    const nomDitAuTatoueur = accepte ? nom : demande.propose;

    await creerNotification({
      userId: demande.propose_par,
      ficheId: demande.fiche_id,
      ficheNom: demande.fiche_nom,
      genre: accepte ? "convention_ajoutee" : "convention_refusee",
      //  ⚠️ LA FORME DE LA PHRASE EST CELLE DES STYLES, et ce n'est pas
      //  cosmétique : l'affichage y relit le nom entre guillemets
      //  français (`nomDuStyle`, FenetreNotifications), et le message
      //  de l'administration après la ligne vide (`messageAdmin`).
      detail: [
        accepte
          ? `« ${nomDitAuTatoueur} » rejoint la liste des conventions.`
          : `« ${nomDitAuTatoueur} » n'a pas été retenue.`,
        message,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    await envoyerCourriel(
      admin,
      demande.propose_par,
      accepte,
      nomDitAuTatoueur,
      message
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `La décision n'a pas pu être enregistrée : ${
          e instanceof Error ? e.message : String(e)
        }`,
      },
      { status: 500 }
    );
  }
}

/**
 * LE COURRIEL — le même contenu que la notification.
 * Il passe par `envoyerEmail` (src/lib/email.ts), le mécanisme déjà en
 * place : Resend si RESEND_API_KEY est renseignée, sinon un envoi
 * SIMULÉ écrit dans le terminal. JAMAIS BLOQUANT — on note et on
 * continue. (Le décalque de `suggestions-styles`, nº 122.)
 */
async function envoyerCourriel(
  admin: ReturnType<typeof creerClientSupabaseAdmin>,
  userId: string | null,
  accepte: boolean,
  nomDeLaConvention: string | null,
  message: string
): Promise<void> {
  if (!userId) return;
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const destinataire = data?.user?.email;
    if (!destinataire) return;

    const sujet = accepte ? "Convention added" : "Convention declined";
    const corps = [
      accepte
        ? `Good news: "${nomDeLaConvention}" is now on YokoFolio's convention list.`
        : `"${nomDeLaConvention}" wasn't accepted.`,
      message,
      accepte
        ? `To add it to your portfolio, open it and pick it in the "Convention" tab:\n${adresseDuSite()}/devenir-tatoueur/fiche`
        : "",
      "— YokoFolio",
    ]
      .filter(Boolean)
      .join("\n\n");

    await envoyerEmail(destinataire, sujet, corps);
  } catch (erreur) {
    console.warn(
      "[convention request] email not sent:",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
  }
}
