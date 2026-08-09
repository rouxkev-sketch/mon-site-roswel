import { NextRequest, NextResponse } from "next/server";
import { DELAI_SUPPRESSION_JOURS } from "@/config/tatouage";
import { lireDemarchageParJeton } from "@/lib/demarchage-serveur";
import { rafraichirPagesPubliques } from "@/lib/rafraichir";
import { echeanceSuppression } from "@/lib/suppression-compte";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * LE RATTACHEMENT — ce que le lien de démarchage permet de faire
 * ===============================================================
 * POST { jeton, action } — trois gestes, et trois seulement :
 *
 *  · « rattacher » — les fiches du jeton passent au compte CONNECTÉ.
 *    Toutes ensemble : on ne peut pas en accepter une et refuser
 *    l'autre. C'est le seul geste qui exige une session, parce qu'il
 *    faut bien savoir À QUI donner les fiches.
 *
 *  · « supprimer » — les fiches quittent le public tout de suite, et
 *    seront effacées dans 30 jours. AUCUNE SESSION REQUISE : quelqu'un
 *    qui ne veut pas de sa fiche n'a aucune raison de créer un compte
 *    pour la faire retirer. Ce serait un péage.
 *
 *  · « reactiver » — la suppression est défaite, tant que le délai
 *    court. Même porte, même lien.
 *
 * ⚠️ LE JETON EST LA SEULE SERRURE POUR LES DEUX DERNIERS, et c'est
 * assumé (voir lib/demarchage-serveur). Il est long, tiré au sort, et
 * sans rapport avec l'identifiant des fiches : on ne peut pas obtenir
 * celui du voisin en essayant le suivant.
 *
 * ⚠️ RATTACHER AJOUTE, NE REMPLACE JAMAIS. Le site gère plusieurs
 * portfolios par compte : les fiches du jeton s'ajoutent à celles que
 * la personne posséderait déjà. Aucune requête ici ne touche à une
 * fiche qui n'est pas dans le jeton.
 *
 * ⚠️ ET LE STATUT DU DÉMARCHAGE AVANCE ICI, TOUT SEUL : ces trois
 * gestes sont les seuls événements qui le font bouger. L'administrateur
 * ne coche rien, jamais.
 */

export async function POST(requete: NextRequest) {
  let corps: { jeton?: string; action?: string } | null = null;
  try {
    corps = (await requete.json()) as { jeton?: string; action?: string };
  } catch {
    corps = null;
  }
  const jeton = corps?.jeton?.trim() ?? "";
  const action = corps?.action ?? "";
  if (!jeton || !["rattacher", "supprimer", "reactiver"].includes(action)) {
    return NextResponse.json(
      { ok: false, message: "Requête incomplète." },
      { status: 400 }
    );
  }

  const demarchage = await lireDemarchageParJeton(jeton);
  if (!demarchage) {
    return NextResponse.json(
      { ok: false, message: "Ce lien n'est plus valable." },
      { status: 404 }
    );
  }

  const admin = creerClientSupabaseAdmin();
  const ids = demarchage.fiches.map((f) => f.id);

  try {
    /* ---------------- RATTACHER ---------------- */
    if (action === "rattacher") {
      const supabase = await creerClientSupabaseServeur();
      const { data } = await supabase.auth.getUser();
      const utilisateur = data.user;
      if (!utilisateur) {
        return NextResponse.json(
          {
            ok: false,
            message: "Crée ton compte d'abord : c'est lui qui recevra les fiches.",
          },
          { status: 401 }
        );
      }

      //  DÉJÀ RATTACHÉ À QUELQU'UN D'AUTRE : on ne redonne pas des
      //  fiches qui ont trouvé leur propriétaire. Le lien reste utile
      //  à CE propriétaire (supprimer, réactiver) et à personne
      //  d'autre.
      if (demarchage.rattacheA && demarchage.rattacheA !== utilisateur.id) {
        return NextResponse.json(
          {
            ok: false,
            message: "Ces fiches ont déjà été récupérées par un autre compte.",
          },
          { status: 409 }
        );
      }

      //  LES FICHES CHANGENT DE MAIN. `user_id` seul : rien d'autre
      //  n'est touché — ni le contenu, ni les photos, ni la
      //  publication. Le tatoueur retrouve exactement ce qu'il a vu
      //  en ligne.
      //  ⚠️ ET SEULEMENT CELLES DU JETON (`in ids`) : les fiches que
      //  le compte posséderait déjà ne sont pas dans cette liste, donc
      //  pas dans cette requête.
      const passation = await admin
        .from("tatoueurs")
        .update({ user_id: utilisateur.id })
        .in("id", ids);
      if (passation.error) throw new Error(passation.error.message);

      //  LA DATE DU RATTACHEMENT NE SE RÉÉCRIT PAS. C'est elle qui
      //  compte la semaine au bout de laquelle la ligne quitte le
      //  tableau : la remettre à zéro à chaque visite du lien
      //  ferait vivre l'entrée éternellement.
      const suivant: Record<string, unknown> = {
        statut: "compte_cree",
        rattache_a: utilisateur.id,
      };
      if (!demarchage.rattacheA) {
        suivant.rattache_le = new Date().toISOString();
      }
      const suite = await admin
        .from("demarchages")
        .update(suivant)
        .eq("id", demarchage.id);
      if (suite.error) throw new Error(suite.error.message);

      rafraichirPagesPubliques();
      return NextResponse.json({ ok: true, fiches: ids.length });
    }

    /* ---------------- SUPPRIMER ---------------- */
    if (action === "supprimer") {
      const echeance = echeanceSuppression().toISOString();
      const retrait = await admin
        .from("tatoueurs")
        .update({
          supprime_le: new Date().toISOString(),
          purge_le: echeance,
        })
        .in("id", ids);
      if (retrait.error) throw new Error(retrait.error.message);

      const suite = await admin
        .from("demarchages")
        .update({ statut: "supprime", retire_le: new Date().toISOString() })
        .eq("id", demarchage.id);
      if (suite.error) throw new Error(suite.error.message);

      rafraichirPagesPubliques();
      return NextResponse.json({
        ok: true,
        jours: DELAI_SUPPRESSION_JOURS,
        purgeLe: echeance,
      });
    }

    /* ---------------- RÉACTIVER ---------------- */
    const remise = await admin
      .from("tatoueurs")
      .update({ supprime_le: null, purge_le: null })
      .in("id", ids);
    if (remise.error) throw new Error(remise.error.message);

    //  ON REVIENT À L'ÉTAT D'AVANT : rattaché si un compte l'avait
    //  déjà pris, simplement envoyé sinon.
    const suite = await admin
      .from("demarchages")
      .update({
        statut: demarchage.rattacheA ? "compte_cree" : "envoye",
        retire_le: null,
      })
      .eq("id", demarchage.id);
    if (suite.error) throw new Error(suite.error.message);

    rafraichirPagesPubliques();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: e instanceof Error ? e.message : "L'opération n'a pas abouti.",
      },
      { status: 500 }
    );
  }
}
