import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * ██ ADMIN YOKOFOLIO — LES MESSAGES DU FORMULAIRE DE CONTACT (nº 801) ██
 * ====================================================================
 * CE QU'ELLE RÉPARE : depuis la nº 800, on sait que les messages de
 * /contact arrivent bien dans `messages_yokofolio` — c'est mesuré. Mais
 * ILS N'ÉTAIENT VISIBLES NULLE PART. Le seul chemin vers eux était le
 * courriel envoyé à `CONTACT_EMAIL` : un message perdu dans une boîte,
 * ou un envoi qui échoue, et le message n'existait plus pour personne.
 *
 * GET  : la liste, DU PLUS RÉCENT AU PLUS ANCIEN.
 *        ⚠️ ET PAS « les non-lus d'abord », contrairement aux
 *        signalements : le propriétaire a demandé l'ordre du temps,
 *        et un courrier se lit dans l'ordre où il arrive. Le badge et
 *        la pastille disent ce qui n'est pas lu ; le rang ne s'en mêle
 *        pas, sans quoi un message basculerait de place à la lecture.
 * POST : { id, lu } → marque ce message lu ou non lu.
 *
 * ⚠️ AUCUNE MIGRATION : la colonne existe DÉJÀ. `messages_yokofolio`
 * porte `traite boolean not null default false` depuis sa création
 * (supabase/yokofolio-contact.sql) et RIEN dans tout le site ne s'en
 * servait — vérifié. C'est elle qui porte le « lu ». On ne demande donc
 * aucun collage SQL au propriétaire.
 * ⚠️ POURQUOI LE NOM DIFFÈRE À L'ÉCRAN : la colonne s'appelle `traite`,
 * l'écran dit « lu ». C'est voulu — le mot de la base ne se change pas
 * sans migration, et « lu / non lu » est ce que le propriétaire a
 * demandé. La traduction se fait ICI, en un seul endroit.
 *
 * ⚠️ L'IP N'EST JAMAIS RENDUE. Elle est en base pour une seule chose :
 * limiter les envois d'un même visiteur (nº du formulaire). Ce n'est
 * pas une information à afficher, et une donnée qu'on ne sert pas est
 * une donnée qu'on ne peut pas fuir. Les colonnes sont donc nommées
 * une par une, jamais `select("*")`.
 *
 * Accès : administrateurs uniquement, vérifié CÔTÉ SERVEUR — comme
 * toutes les routes de cet espace.
 */

/** Les colonnes servies à l'écran, et elles seules (jamais l'IP). */
const COLONNES = "id, nom, email, message, traite, cree_le";

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
      .from("messages_yokofolio")
      .select(COLONNES)
      .order("cree_le", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, messages: data ?? [] });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Couldn't load (has migration supabase/yokofolio-contact.sql been applied?): ${e instanceof Error ? e.message : String(e)}`,
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
    id?: number | string;
    lu?: boolean;
  } | null;
  /*  ⚠️ `!corps?.id` NE SUFFIRAIT PAS ET `typeof lu` NON PLUS SEUL :
      l'identifiant est un entier, et `lu` vaut légitimement `false`
      (« remettre en non lu »). On teste donc la PRÉSENCE, pas la
      vérité — une valeur fausse est une valeur. */
  if (corps?.id === undefined || typeof corps.lu !== "boolean") {
    return NextResponse.json(
      { ok: false, message: "Incomplete request." },
      { status: 400 }
    );
  }
  try {
    const admin = creerClientSupabaseAdmin();
    const { error } = await admin
      .from("messages_yokofolio")
      .update({ traite: corps.lu })
      .eq("id", corps.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `Saving failed: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 500 }
    );
  }
}
