import { NextRequest, NextResponse } from "next/server";
import { catalogueStyles, FAMILLES_STYLES } from "@/config/tatouage";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { adresseDuSite, envoyerEmailDetaille } from "@/lib/email";
//  nº 817 — l'habillage des courriels du site, écrit une fois.
import { habillerCourriel } from "@/lib/courriel-habille";
import { creerNotification } from "@/lib/notifications";
import { rafraichirToutLeSite } from "@/lib/rafraichir";
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

/**
 * ██ nº 807 — LA COLLISION SE CHERCHE AUSSI PAR LE NOM ██
 * ------------------------------------------------------------------
 * Le garde-fou ne comparait que les LIMACES : « Néo-traditionnel »
 * (→ neo-traditionnel) était refusé, mais « Neo-traditional »
 * (→ neo-traditional) passait — une autre limace, le MÊME style. C'est
 * exactement le doublon que le propriétaire a trouvé en base. On
 * compare donc la limace du nom proposé à la limace de chaque style
 * ET à la limace de son libellé : « Realism » heurte le style
 * `realisme` parce que son libellé, mis en limace, donne `realism`.
 * Rend le style heurté, ou null. Appelé à l'acceptation et au
 * renommage — même règle aux deux portes.
 */
function collisionDansLeCatalogue(
  slugNeuf: string
): { slug: string; label: string } | null {
  return (
    catalogueStyles().find(
      (style) => style.slug === slugNeuf || slugifier(style.label) === slugNeuf
    ) ?? null
  );
}

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
        message: `Couldn't load (has migration supabase/yokofolio-suggestions-styles.sql been applied?): ${
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
    decision?: "accepter" | "refuser" | "retirer" | "renommer";
    label?: string;
    famille?: string | null;
    message?: string;
  } | null;

  const DECISIONS = ["accepter", "refuser", "retirer", "renommer"] as const;
  if (!corps?.id || !DECISIONS.includes(corps.decision as never)) {
    return NextResponse.json(
      { ok: false, message: "Incomplete request." },
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
   *  · elle NE POSE PAS DE NOTIFICATION dans la cloche.
   *
   * ██ §2 (nº 834) — MAIS ELLE ÉCRIT, DÉSORMAIS ██
   * ⚠️ CETTE NOTE DISAIT LE CONTRAIRE, et il faut le dire : « elle ne
   * prévient pas le tatoueur », avec pour raison qu'un « Style
   * refusé » reçu des jours après un « Style ajouté » inquiéterait
   * pour une simple hésitation d'administration. LE PROPRIÉTAIRE A
   * TRANCHÉ AUTREMENT : un style qu'on a vu entrer au catalogue et qui
   * en sort sans un mot est plus déroutant qu'un message qui
   * l'explique. Le courriel du retrait ne dit donc pas « refusé » — il
   * dit ce qui s'est passé, remercie, et invite à recommencer
   * (`textesDuCourriel`, §1).
   * ⚠️ LA CLOCHE, ELLE, RESTE MUETTE : seul le courriel a été demandé,
   * et une notification « Style refusé » rouvrirait exactement le
   * malentendu que l'ancienne note craignait.
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
        //  nº 834 — `user_id` EN PLUS : c'est à lui qu'on écrit
        //  désormais (voir le §2 juste au-dessus de ce bloc).
        .select("id, label, user_id");
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            message: "This style is no longer on the list — nothing to remove.",
          },
          { status: 409 }
        );
      }
      //  Le catalogue vient de rétrécir : la prochaine page doit le
      //  relire sans attendre la minute de cache.
      oublierStylesAjoutes();
      rafraichirToutLeSite();
      const retiree = data[0] as { label: string | null; user_id: string | null };
      const courriel = await envoyerCourriel(
        admin,
        retiree.user_id,
        "retirer",
        retiree.label,
        ""
      );
      return NextResponse.json({ ok: true, courriel });
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          message: `Removal failed: ${
            e instanceof Error ? e.message : String(e)
          }`,
        },
        { status: 500 }
      );
    }
  }

  /* ================================================================
   * RENOMMER UN STYLE DÉJÀ ACCEPTÉ (passe nº 807)
   * ================================================================
   * Le manque que le propriétaire a vu : l'écran savait AJOUTER un
   * style et le RETIRER, jamais corriger son nom — deux libellés
   * français acceptés avant la traduction ne pouvaient se réparer
   * qu'en SQL. Comme le retrait, c'est une CORRECTION, pas une
   * décision : ligne acceptée seulement, ni message, ni notification,
   * ni courriel au tatoueur.
   * ⚠️ LA LIMACE NE SUIT LE NOM QUE SI C'EST SANS RISQUE, et « sans
   * risque » se MESURE, il ne se devine pas : elle est écrite dans les
   * portfolios (`tatoueurs.styles`, et la clé de `photos_styles` qui
   * va avec) et sur chaque photo (`photos_tatoueur.style`), et elle
   * fait l'adresse publique /tattoo/<limace>/<ville>. On compte donc
   * ce qui la porte : ZÉRO → la limace est recalculée du nouveau nom
   * (après le même contrôle de collision qu'à l'acceptation) ; SINON
   * elle reste, seul le libellé change, et la réponse dit combien de
   * portfolios et de photos l'ont retenue. Déplacer une limace portée
   * par des fiches, c'est la fusion de docs/SQL-807-STYLES-AJOUTES.md :
   * une requête relue à la main, jamais un clic.
   * `photos_styles` n'est pas compté à part : sa clé n'existe que pour
   * un style déjà présent dans `styles` (le formulaire écrit les deux
   * ensemble). */
  if (corps.decision === "renommer") {
    const label = (corps.label ?? "").trim().replace(/\s+/g, " ");
    if (label.length < 2 || label.length > 40) {
      return NextResponse.json(
        { ok: false, message: "The style name must be 2 to 40 characters." },
        { status: 400 }
      );
    }
    const slugNeuf = slugifier(label);
    if (!slugNeuf) {
      return NextResponse.json(
        { ok: false, message: "This name doesn't make a valid URL." },
        { status: 400 }
      );
    }
    try {
      const admin = creerClientSupabaseAdmin();
      const { data: ligne, error: erreurLecture } = await admin
        .from("suggestions_style")
        .select("id, etat, label, slug")
        .eq("id", corps.id)
        .maybeSingle();
      if (erreurLecture) throw new Error(erreurLecture.message);
      const style = ligne as {
        id: string;
        etat: string;
        label: string | null;
        slug: string | null;
      } | null;
      if (!style || style.etat !== "acceptee" || !style.slug) {
        return NextResponse.json(
          {
            ok: false,
            message: "This style is no longer on the list — nothing to rename.",
          },
          { status: 409 }
        );
      }
      const ancien = style.slug;
      let slug = ancien;
      let references = 0;
      if (slugNeuf !== ancien) {
        const [fiches, photos] = await Promise.all([
          admin.from("tatoueurs").select("id").contains("styles", [ancien]).limit(1000),
          admin.from("photos_tatoueur").select("id").eq("style", ancien).limit(1000),
        ]);
        if (fiches.error) throw new Error(fiches.error.message);
        if (photos.error) throw new Error(photos.error.message);
        references = (fiches.data?.length ?? 0) + (photos.data?.length ?? 0);
        if (references === 0) {
          await chargerStylesAjoutes();
          const collision = collisionDansLeCatalogue(slugNeuf);
          if (collision) {
            return NextResponse.json(
              {
                ok: false,
                message: `"${collision.label}" already exists (/${collision.slug}). Pick another name.`,
              },
              { status: 409 }
            );
          }
          slug = slugNeuf;
        }
      }
      const { data: ecrit, error: erreurEcriture } = await admin
        .from("suggestions_style")
        .update({ label, slug })
        .eq("id", style.id)
        //  ⚠️ SEULEMENT SI ELLE EST ENCORE ACCEPTÉE — même garde que le
        //  retrait : deux onglets ne peuvent pas se contredire.
        .eq("etat", "acceptee")
        .select("id");
      if (erreurEcriture) throw new Error(erreurEcriture.message);
      if (!ecrit || ecrit.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            message: "This style is no longer on the list — nothing to rename.",
          },
          { status: 409 }
        );
      }
      //  Le catalogue vient de changer : la prochaine page le relit
      //  sans attendre la minute de cache.
      oublierStylesAjoutes();
      rafraichirToutLeSite();
      return NextResponse.json({
        ok: true,
        label,
        slug,
        slugConserve: slug === ancien && slugNeuf !== ancien,
        references,
      });
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          message: `Renaming failed: ${e instanceof Error ? e.message : String(e)}`,
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
        { ok: false, message: "This request no longer exists." },
        { status: 404 }
      );
    }
    if (demande.etat !== "en_attente") {
      return NextResponse.json(
        { ok: false, message: "This request has already been decided." },
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
          { ok: false, message: "The style name must be 2 to 40 characters." },
          { status: 400 }
        );
      }
      slug = slugifier(label);
      if (!slug) {
        return NextResponse.json(
          { ok: false, message: "This name doesn't make a valid URL." },
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
          { ok: false, message: "This category doesn't exist." },
          { status: 400 }
        );
      }

      //  ⚠️ LE SLUG DOIT ÊTRE LIBRE. La base a son index unique sur les
      //  lignes acceptées, mais il ne connaît pas les trente-huit
      //  styles du CODE : c'est ici qu'on les vérifie. Sans ça, on
      //  pourrait accepter « Fine-line » à côté de « Fine Line » — deux
      //  entrées, une seule adresse, et la page style + ville qui ne
      //  sait plus laquelle servir.
      //  nº 807 — ET LE NOM AUSSI (voir `collisionDansLeCatalogue`) :
      //  « Neo-traditional » ne passe plus à côté de `neo-traditionnel`.
      await chargerStylesAjoutes();
      const collision = collisionDansLeCatalogue(slug);
      if (collision) {
        return NextResponse.json(
          {
            ok: false,
            message: `"${collision.label}" already exists (/${collision.slug}). Pick another name.`,
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
      rafraichirToutLeSite();

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
          ? `"${nomDitAuTatoueur}" is now on the style list.`
          : `"${nomDitAuTatoueur}" wasn't added.`,
        message,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    /*  §1 (nº 832) — LE SORT DU COURRIEL REMONTE À L'ÉCRAN. Il partait
        (ou pas) sans que personne ne le sache : le propriétaire a
        accepté un style et n'a rien reçu, sans un mot nulle part. La
        décision reste NON BLOQUANTE — elle est déjà écrite en base —
        mais son résultat voyage désormais avec la réponse, et
        l'écran d'administration le dit. */
    const courriel = await envoyerCourriel(
      admin,
      demande.user_id,
      accepte ? "accepter" : "refuser",
      nomDitAuTatoueur,
      message
    );

    return NextResponse.json({ ok: true, courriel });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `The decision couldn't be saved: ${
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
 *
 * ██ §2 (nº 832) — IL PARTAIT DANS LE NOIR, ET C'ÉTAIT LE DÉFAUT ██
 * ------------------------------------------------------------------
 * LE DÉFAUT DU PROPRIÉTAIRE : style suggéré depuis son compte, accepté
 * dans l'administration, AUCUN e-mail. Le formulaire de contact, lui,
 * arrivait — la chaîne Resend marchait donc.
 *
 * CE QUI RENDAIT LA PANNE INTROUVABLE, ici même. Cette fonction avait
 * TROIS SORTIES MUETTES et pas une seule trace :
 *  · `if (!userId) return` — la demande n'a pas d'auteur ;
 *  · `const { data } = await …getUserById(…)` — L'ERREUR N'ÉTAIT MÊME
 *    PAS LUE : une lecture refusée ou expirée (le délai de garde de la
 *    nº 686) rendait `data` nul, et l'on repartait sans un mot ;
 *  · `if (!destinataire) return` — le compte n'a pas d'adresse.
 * Et quand l'envoi était bel et bien tenté, SON RÉSULTAT ÉTAIT JETÉ :
 * `envoyerEmail` rend « envoye » ou « echec », personne ne le lisait.
 * Un refus de Resend — celui que le §4 de la nº 830 nomme, quand
 * l'expéditeur d'essai n'a pas le droit d'écrire à quelqu'un d'autre
 * que le propriétaire du compte — passait donc totalement inaperçu.
 * C'est très exactement la différence avec le formulaire de contact,
 * qui écrit TOUJOURS à la même adresse : celle du propriétaire.
 *
 * CE QU'ELLE FAIT MAINTENANT : chaque sortie se dit dans le journal
 * du serveur ET remonte à l'écran d'administration, avec l'adresse
 * visée. Plus une seule branche silencieuse.
 */
/** Les trois décisions qui écrivent au suggéreur (nº 834 : le retrait
    en fait partie, il n'écrivait à personne). */
type DecisionCourriel = "accepter" | "refuser" | "retirer";

type EtatCourriel =
  | "envoye"
  | "simule"
  | "echec"
  //  nº 833 — DISTINGUÉ DE « echec » : celui-ci n'a jamais atteint
  //  Resend (préparation du courriel), et l'écran ne doit pas renvoyer
  //  le propriétaire vers les journaux du service d'envoi pour rien.
  | "echec-avant-envoi"
  | "sans-compte"
  | "sans-adresse";

/** Ce que l'administration reçoit : l'état, à qui on a écrit, et —
    nº 833 — l'identifiant que Resend rend pour un envoi accepté. */
export type SortDuCourriel = {
  etat: EtatCourriel;
  destinataire: string | null;
  identifiant?: string | null;
};

function noter(quoi: string): void {
  console.error(`📧 STYLE — ${quoi}`);
}

/**
 * ██ §1 (nº 834) — LES TROIS TEXTES, AU MÊME ENDROIT ██
 * ------------------------------------------------------------------
 * Ils étaient deux, écrits en ternaires dans le corps de l'envoi. Le
 * RETRAIT en ajoute un troisième (décision du propriétaire), et trois
 * ternaires imbriqués deviendraient illisibles — c'est le moment de
 * les sortir. Une table : une décision, un sujet, une phrase.
 * Ce sont les mots du propriétaire, au caractère près.
 */
function textesDuCourriel(
  decision: DecisionCourriel,
  nomDuStyle: string | null
): { sujet: string; phrase: string } {
  switch (decision) {
    case "accepter":
      return {
        sujet: "Your style is live!",
        phrase: `Great news — "${nomDuStyle}" is now part of YokoFolio's style catalog. Thanks for helping the collection grow.`,
      };
    case "refuser":
      return {
        sujet: "About your style suggestion",
        phrase: `Thanks for suggesting "${nomDuStyle}" — we appreciate it. This one didn't make the cut this time, but keep them coming.`,
      };
    default:
      /*  LE RETRAIT (nº 834) — un style qui ÉTAIT au catalogue en
          sort. Le sujet nomme le style, parce que le destinataire
          l'avait vu accepté : sans son nom, le message serait une
          énigme. */
      return {
        sujet: `About your style "${nomDuStyle}"`,
        phrase: `We've removed "${nomDuStyle}" from YokoFolio's style catalog after a review. Thanks again for suggesting it — keep them coming.`,
      };
  }
}

async function envoyerCourriel(
  admin: ReturnType<typeof creerClientSupabaseAdmin>,
  userId: string | null,
  decision: DecisionCourriel,
  nomDuStyle: string | null,
  message: string
): Promise<SortDuCourriel> {
  if (!userId) {
    noter("la demande n'a pas d'auteur (user_id vide) : rien à qui écrire.");
    return { etat: "sans-compte", destinataire: null };
  }
  try {
    //  ⚠️ L'ERREUR SE LIT. C'est elle qui dit qu'une lecture a été
    //  refusée (clé) ou abandonnée (délai de garde), et elle était
    //  jetée depuis l'origine.
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) {
      noter(`le compte ${userId} n'a pas pu être lu — ${error.message}`);
      return { etat: "sans-adresse", destinataire: null };
    }
    const destinataire = data?.user?.email;
    if (!destinataire) {
      noter(`le compte ${userId} n'a pas d'adresse de courriel.`);
      return { etat: "sans-adresse", destinataire: null };
    }

    /*  nº 833 — LES TEXTES SONT CEUX DU PROPRIÉTAIRE (§1 ci-dessous,
        où ils vivent tous les trois depuis la nº 834). Ils disaient
        « Style added » / « Style declined » et récitaient l'état d'un
        dossier ; ils parlent maintenant à quelqu'un.
        nº 817 — LE COURRIEL HABILLÉ (lib/courriel-habille) : les mêmes
        phrases, dans la charte du site ; le lien d'action part avec.
        Le texte nu part à côté. */
    const { sujet, phrase } = textesDuCourriel(decision, nomDuStyle);
    const courriel = habillerCourriel({
      titre: sujet,
      paragraphes: [phrase, message].filter(Boolean),
      action: lienDuPortfolio(decision),
    });

    /*  ██ §2 (nº 833) — L'IDENTIFIANT DE L'ENVOI REMONTE ██
        LE DÉFAUT DU PROPRIÉTAIRE : le courriel de REFUS arrive, celui
        d'ACCEPTATION non — et l'écran disait « Email sent » pour les
        deux. Il manquait de quoi trancher entre « il n'est jamais
        parti » et « il est parti et le destinataire ne l'a pas vu ».
        Resend rend un IDENTIFIANT à chaque envoi accepté ; c'est lui
        qui permet d'ouvrir resend.com/emails et de lire le sort réel
        du message (remis, rejeté, signalé). `envoyerEmail` le jetait ;
        on passe donc par `envoyerEmailDetaille`, qui le rend. */
    const { resultat, id } = await envoyerEmailDetaille(
      destinataire,
      sujet,
      courriel.texte,
      { html: courriel.html }
    );
    if (resultat === "echec") {
      noter(`l'envoi à ${destinataire} a été REFUSÉ (la raison est au-dessus).`);
    } else {
      noter(`envoi « ${sujet} » à ${destinataire} — identifiant Resend ${id ?? "(aucun)"}.`);
    }
    return { etat: resultat, destinataire, identifiant: id };
  } catch (erreur) {
    /*  ⚠️ CE N'EST PAS RESEND QUI A REFUSÉ ICI, et le dire compte : une
        exception à ce point vient de la préparation du courriel (une
        adresse de site absente, une lecture de compte qui expire), pas
        du service d'envoi. L'écran d'administration distingue les deux
        depuis cette passe. */
    noter(
      `l'envoi n'a pas abouti AVANT d'atteindre Resend — ${
        erreur instanceof Error ? erreur.message : String(erreur)
      }`
    );
    return { etat: "echec-avant-envoi", destinataire: null };
  }
}

/**
 * ██ §3 (nº 833) — LE LIEN D'ACTION NE PEUT PLUS TUER L'ENVOI ██
 * ------------------------------------------------------------------
 * LA PISTE QUI SEMBLAIT ÉVIDENTE, ET QUE LA MESURE A ÉCARTÉE. La seule
 * différence de code entre les deux courriels était ici : la branche
 * ACCEPTATION appelait `adresseDuSite()` pour composer l'adresse du
 * bouton, celle du REFUS jamais. Or `adresseDuSite()` LÈVE en
 * production quand `NEXT_PUBLIC_SITE_URL` manque (lib/site — une panne
 * franche voulue). L'explication tenait debout : l'exception tombe
 * dans le `catch` ci-dessus, et seul l'e-mail d'acceptation meurt.
 *
 * DEUX MESURES L'ONT DÉMENTIE, et je les écris parce qu'elles valent
 * plus que l'hypothèse :
 *  1. un site bâti PUIS servi sans cette variable envoie quand même
 *     les deux courriels, bouton compris ;
 *  2. la lui retirer à l'exécution ne change rien non plus — les
 *     variables `NEXT_PUBLIC_*` sont CUITES DANS LE BÂTI, et c'est la
 *     valeur du jour du bâti qui sert au runtime.
 * ⚠️ ET `habillerCourriel` L'APPELLE AUSSI, par défaut de paramètre :
 * si elle levait vraiment, LES DEUX courriels tomberaient, pas un
 * seul. L'asymétrie n'aurait donc pas pu produire ce que le
 * propriétaire décrit.
 *
 * CE QUI RESTE, ET POURQUOI ON LE GARDE : un courriel ne doit jamais
 * échouer parce que son BOUTON n'a pas pu être composé. Le lien est un
 * supplément ; s'il ne peut pas être fait, le courriel part sans lui et
 * le journal dit pourquoi. La cause de la panne du propriétaire, elle,
 * se lira dans l'identifiant Resend du §2.
 */
function lienDuPortfolio(
  decision: DecisionCourriel
): { libelle: string; url: string } | null {
  //  ⚠️ SEULE L'ACCEPTATION MÈNE QUELQUE PART : un refus n'a rien à
  //  ouvrir, et un RETRAIT non plus (nº 834) — envoyer quelqu'un vers
  //  son portfolio pour lui montrer un style qui vient d'en disparaître
  //  serait une invitation à la déception.
  if (decision !== "accepter") return null;
  try {
    return {
      libelle: "Open my portfolio",
      url: `${adresseDuSite()}/become-an-artist/portfolio`,
    };
  } catch (erreur) {
    noter(
      `le courriel part SANS son bouton — ${
        erreur instanceof Error ? erreur.message : String(erreur)
      }`
    );
    return null;
  }
}
