import { NextRequest, NextResponse } from "next/server";
import { catalogueStyles, FAMILLES_STYLES } from "@/config/tatouage";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { adresseDuSite, envoyerEmail } from "@/lib/email";
import { creerNotification } from "@/lib/notifications";
import { slugifier } from "@/lib/slug";
import {
  chargerStylesAjoutes,
  oublierStylesAjoutes,
} from "@/lib/styles-ajoutes";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * ADMIN YOKOFOLIO — LES SUGGESTIONS DE STYLES (passe nº 122)
 * ==========================================================
 * GET  : les demandes reçues — les en attente d'abord, puis par date.
 * POST : { id, decision: "accepter" | "refuser", label?, famille?,
 *          message? } → tranche.
 *
 * ACCEPTER exige un NOM (celui proposé, ou celui que l'administration
 * lui préfère) et un RANGEMENT (la liste principale, ou la famille
 * « Cultures du monde »). Le slug est calculé à partir du nom
 * retenu — jamais saisi : il entre dans des adresses publiques, et un
 * slug tapé à la main finit toujours par porter une majuscule ou un
 * accent.
 *
 * DANS LES DEUX CAS, un message facultatif part avec la décision. Il
 * voyage par DEUX CANAUX (notification + courriel), écrits l'un après
 * l'autre et JAMAIS BLOQUANTS : une décision d'administration ne doit
 * pas échouer parce qu'un service de courriel est en panne.
 *
 * Accès : administrateurs uniquement, vérifié CÔTÉ SERVEUR.
 */

/** Le plafond du message d'accompagnement — il tient dans une
    notification et dans un courriel court. */
const MESSAGE_MAXIMUM = 600;

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
      .from("suggestions_style")
      .select(
        "id, propose, etat, label, slug, famille, message, fiche_id, fiche_nom, cree_le, traite_le, user_id"
      )
      .order("cree_le", { ascending: false });
    if (error) throw new Error(error.message);

    const lignes = (data ?? []) as Array<{
      user_id: string | null;
      fiche_id: string | null;
      [cle: string]: unknown;
    }>;

    //  LE NOM DU TATOUEUR — relu dans les comptes, jamais recopié en
    //  base : c'est l'adresse de courriel qui identifie le proposeur
    //  pour l'administration, et elle peut changer.
    const comptes = new Map<string, string>();
    for (const identifiant of new Set(
      lignes.map((ligne) => ligne.user_id).filter(Boolean) as string[]
    )) {
      const { data: compte } = await admin.auth.admin.getUserById(identifiant);
      if (compte?.user?.email) comptes.set(identifiant, compte.user.email);
    }

    /* ---- L'ADRESSE DE SA FICHE (passe nº 123) ----
       Pour aller la CONSULTER avant de décider : un nom de style ne
       dit rien du travail de celui qui le propose.
       DEUX CHEMINS, dans cet ordre :
        · la fiche d'où la demande est partie (`fiche_id`) — la bonne
          réponse quand elle existe ;
        · à défaut, LA FICHE DU COMPTE. Une demande partie d'un
          brouillon jamais enregistré n'a pas de `fiche_id`, et c'est
          justement là qu'un lien manquerait le plus : le proposeur a
          souvent une autre fiche, déjà en ligne.
       Aucune des deux ne répond ? Pas de lien — jamais un lien mort. */
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
          .filter((l) => l.user_id && !slugsParFiche.has(l.fiche_id ?? ""))
          .map((l) => l.user_id) as string[]
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
      suggestions: lignes.map((ligne) => ({
        ...ligne,
        courriel: ligne.user_id ? (comptes.get(ligne.user_id) ?? null) : null,
        fiche_slug:
          (ligne.fiche_id ? slugsParFiche.get(ligne.fiche_id) : null) ??
          (ligne.user_id ? slugsParCompte.get(ligne.user_id) : null) ??
          null,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Lecture impossible (migration supabase/yokofolio-suggestions-styles.sql passée ?) : ${
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
    decision?: "accepter" | "refuser" | "retirer";
    label?: string;
    famille?: string | null;
    message?: string;
  } | null;

  const DECISIONS = ["accepter", "refuser", "retirer"] as const;
  if (!corps?.id || !DECISIONS.includes(corps.decision as never)) {
    return NextResponse.json(
      { ok: false, message: "Demande incomplète." },
      { status: 400 }
    );
  }

  /* ================================================================
   * RETIRER UN STYLE DÉJÀ ACCEPTÉ (passe nº 123)
   * ================================================================
   * ⚠️ CE N'EST PAS UNE DÉCISION SUR UNE DEMANDE, C'EST UNE
   * CORRECTION. La différence commande tout le reste :
   *  · elle ne s'applique qu'à une ligne DÉJÀ ACCEPTÉE ;
   *  · elle ne demande ni nom, ni rangement, ni message ;
   *  · elle NE PRÉVIENT PAS LE TATOUEUR. Le cas d'usage est « j'ai
   *    validé par erreur » : lui écrire « Style refusé » des jours
   *    après un « Style ajouté » l'inquiéterait pour une hésitation
   *    d'administration. (Si un jour il faut retirer un style
   *    largement adopté, ce sera un message écrit à la main, pas une
   *    notification automatique.)
   * Techniquement, c'est le même geste que la requête SQL de secours :
   * repasser `etat` à « refusee ». Le slug se libère (l'index unique
   * ne vaut que sur les acceptées) et le style quitte le catalogue au
   * prochain chargement.
   * ⚠️ CE QUI RESTE : les portfolios qui avaient coché ce style
   * gardent son slug en base. Il ne s'affiche plus nulle part, et
   * réaccepter le même nom le fait revenir tel quel. */
  if (corps.decision === "retirer") {
    try {
      const admin = creerClientSupabaseAdmin();
      const { data, error } = await admin
        .from("suggestions_style")
        .update({ etat: "refusee", traite_le: new Date().toISOString() })
        .eq("id", corps.id)
        //  ⚠️ SEULEMENT SI ELLE EST ENCORE ACCEPTÉE : deux onglets
        //  ouverts sur la même ligne ne peuvent pas se contredire.
        .eq("etat", "acceptee")
        .select("id, label");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            message: "Ce style n'est plus dans la liste — rien à retirer.",
          },
          { status: 409 }
        );
      }
      //  Le catalogue vient de rétrécir : la prochaine page doit le
      //  relire sans attendre la minute de cache.
      oublierStylesAjoutes();
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          message: `Le retrait n'a pas abouti : ${
            e instanceof Error ? e.message : String(e)
          }`,
        },
        { status: 500 }
      );
    }
  }

  const message = (corps.message ?? "").trim().slice(0, MESSAGE_MAXIMUM);

  try {
    const admin = creerClientSupabaseAdmin();

    /* ---- LA DEMANDE, TELLE QU'ELLE EST EN BASE ---- */
    const { data: ligne, error: erreurLecture } = await admin
      .from("suggestions_style")
      .select("id, propose, etat, user_id, fiche_id, fiche_nom")
      .eq("id", corps.id)
      .maybeSingle();
    if (erreurLecture) throw new Error(erreurLecture.message);
    const demande = ligne as {
      id: string;
      propose: string;
      etat: string;
      user_id: string | null;
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
    let label: string | null = null;
    let slug: string | null = null;
    let famille: string | null = null;

    if (corps.decision === "accepter") {
      //  LE NOM RETENU : celui de l'administration s'il en a donné un,
      //  sinon la proposition telle quelle.
      label = (corps.label ?? demande.propose).trim().replace(/\s+/g, " ");
      if (label.length < 2 || label.length > 40) {
        return NextResponse.json(
          { ok: false, message: "Le nom du style doit faire 2 à 40 caractères." },
          { status: 400 }
        );
      }
      slug = slugifier(label);
      if (!slug) {
        return NextResponse.json(
          { ok: false, message: "Ce nom ne donne aucune adresse valable." },
          { status: 400 }
        );
      }

      //  LE RANGEMENT : la liste principale, ou une famille connue.
      famille = corps.famille ?? null;
      if (
        famille !== null &&
        !FAMILLES_STYLES.some((f) => f.slug === famille)
      ) {
        return NextResponse.json(
          { ok: false, message: "Ce rangement n'existe pas." },
          { status: 400 }
        );
      }

      //  ⚠️ LE SLUG DOIT ÊTRE LIBRE. La base a son index unique sur les
      //  lignes acceptées, mais il ne connaît pas les trente-huit
      //  styles du CODE : c'est ici qu'on les vérifie. Sans ça, on
      //  pourrait accepter « Fine-line » à côté de « Fine Line » — deux
      //  entrées, une seule adresse, et la page style + ville qui ne
      //  sait plus laquelle servir.
      await chargerStylesAjoutes();
      const collision = catalogueStyles().find((style) => style.slug === slug);
      if (collision) {
        return NextResponse.json(
          {
            ok: false,
            message: `« ${collision.label} » occupe déjà cette adresse (${slug}). Choisis un autre nom.`,
          },
          { status: 409 }
        );
      }
    }

    /* ---- LA DÉCISION ---- */
    const { error: erreurEcriture } = await admin
      .from("suggestions_style")
      .update({
        etat: corps.decision === "accepter" ? "acceptee" : "refusee",
        label,
        slug,
        famille,
        message: message || null,
        traite_le: new Date().toISOString(),
      })
      .eq("id", demande.id)
      //  ⚠️ ON NE TRANCHE QUE CE QUI EST ENCORE EN ATTENTE : deux
      //  onglets d'administration ouverts sur la même demande ne
      //  peuvent pas se contredire.
      .eq("etat", "en_attente");
    if (erreurEcriture) throw new Error(erreurEcriture.message);

    //  Le catalogue vient de changer : la prochaine page doit le relire
    //  sans attendre la minute de cache.
    oublierStylesAjoutes();

    /* ---- LA RÉPONSE AU TATOUEUR — deux canaux, jamais bloquants ---- */
    const accepte = corps.decision === "accepter";
    const nomDitAuTatoueur = accepte ? label : demande.propose;

    await creerNotification({
      userId: demande.user_id,
      ficheId: demande.fiche_id,
      ficheNom: demande.fiche_nom,
      genre: accepte ? "style_ajoute" : "style_refuse",
      //  LE DÉTAIL DIT DEUX CHOSES : de quel style on parle, et ce que
      //  l'administration a ajouté. Le style d'abord — une nouvelle
      //  qui ne nomme pas son sujet ne sert à rien.
      detail: [
        accepte
          ? `« ${nomDitAuTatoueur} » rejoint la liste des styles.`
          : `« ${nomDitAuTatoueur} » n'a pas été retenu.`,
        message,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    await envoyerCourriel(admin, demande.user_id, accepte, nomDitAuTatoueur, message);

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
 * Il passe par `envoyerEmail` (src/lib/email.ts), le mécanisme déjà
 * en place sur le site : Resend si RESEND_API_KEY est renseignée,
 * sinon un envoi SIMULÉ écrit dans le terminal de `npm run dev`.
 * JAMAIS BLOQUANT — on note et on continue.
 */
async function envoyerCourriel(
  admin: ReturnType<typeof creerClientSupabaseAdmin>,
  userId: string | null,
  accepte: boolean,
  nomDuStyle: string | null,
  message: string
): Promise<void> {
  if (!userId) return;
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const destinataire = data?.user?.email;
    if (!destinataire) return;

    const sujet = accepte ? "Style added" : "Style declined";
    const corps = [
      accepte
        ? `Good news: "${nomDuStyle}" is now on YokoFolio's style list.`
        : `"${nomDuStyle}" wasn't accepted.`,
      message,
      accepte
        ? `To add it to your portfolio, open it and check it under "Add a style & photos":\n${adresseDuSite()}/devenir-tatoueur/fiche`
        : "",
      "— YokoFolio",
    ]
      .filter(Boolean)
      .join("\n\n");

    await envoyerEmail(destinataire, sujet, corps);
  } catch (erreur) {
    console.warn(
      "[style suggestion] email not sent:",
      erreur instanceof Error ? erreur.message : String(erreur)
    );
  }
}
