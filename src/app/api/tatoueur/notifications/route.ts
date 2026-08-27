import { NextRequest, NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";
//  §1 (nº 663) — la pose du message de bienvenue, écrite là où vivent
//  les notifications (lib/notifications) : cette route ne fait que
//  l'appeler.
import { poserLaBienvenue, type Notification } from "@/lib/notifications";

/**
 * LES NOTIFICATIONS DU COMPTE CONNECTÉ
 * -------------------------------------
 * GET  : la liste, les plus récentes d'abord, et le nombre de non
 *        lues (c'est ce nombre que porte la pastille du menu).
 * POST : { id } marque UNE notification comme lue ;
 *        { tout: true } les marque TOUTES.
 *
 * ON LIT AVEC LA SESSION DE LA PERSONNE, pas avec la clé de service :
 * la politique de sécurité (RLS) fait alors tout le travail — on ne
 * peut voir et marquer QUE ses propres notifications, même si la
 * requête était trafiquée.
 *
 * TOLÉRANT À LA MIGRATION : tant que supabase/yokofolio-notifications
 * .sql n'est pas passé, la table n'existe pas — on répond alors une
 * liste vide, sans erreur. Le menu s'affiche, simplement sans
 * nouvelles.
 */

export async function GET() {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Connecte-toi pour voir tes notifications." },
      { status: 401 }
    );
  }

  const COLONNES =
    "id, fiche_id, fiche_nom, genre, titre, detail, motifs, creee_le, lue_le";
  // `liaison_id` n'arrive qu'avec la migration nº 26 : on la demande,
  // et on relit SANS elle si elle manque. Une colonne pas encore
  // ajoutée ne doit pas vider la boîte de nouvelles.
  // Le type est posé À LA MAIN : les deux `select` ne rendent pas la
  // même forme, et c'est exactement le but.
  let reponse: { data: unknown; error: unknown } = await supabase
    .from("notifications_compte")
    .select(`${COLONNES}, liaison_id`)
    .order("creee_le", { ascending: false })
    .limit(50);
  if (reponse.error) {
    reponse = await supabase
      .from("notifications_compte")
      .select(COLONNES)
      .order("creee_le", { ascending: false })
      .limit(50);
  }

  if (reponse.error) {
    // Table absente : aucune nouvelle, et surtout aucune panne.
    return NextResponse.json({ ok: true, notifications: [], nonLues: 0 });
  }

  const notifications = (Array.isArray(reponse.data)
    ? reponse.data
    : []) as Notification[];

  /*  ██ §1 (nº 663) — LE MESSAGE DE BIENVENUE, POSÉ À LA PREMIÈRE
      LECTURE ██
      ==================================================================
      POURQUOI ICI, ET PAS À L'INSCRIPTION : les trois écrans
      d'inscription appellent `signUp` depuis le NAVIGATEUR, et une
      notification ne s'écrit qu'avec la clé de service — il n'y a
      aucun passage serveur au moment où le compte naît. Le raisonnement
      complet est en tête de `poserLaBienvenue` (lib/notifications).
      LE TEST EST CELUI DE LA LISTE QU'ON VIENT DE LIRE : aucune requête
      de plus pour savoir si elle est déjà là.
      ⚠️ ELLE EST AJOUTÉE EN FIN DE LISTE, et c'est sa vraie place : la
      liste arrive du plus récent au plus ancien, et cette nouvelle-ci
      est, par construction, la plus ancienne du compte. Les suivantes
      s'empileront au-dessus d'elle — la consigne, mot pour mot.
      ⚠️ SI L'ÉCRITURE ÉCHOUE, ON N'AJOUTE RIEN : la boîte s'affiche
      comme avant. `poserLaBienvenue` ne lève jamais.
      ⚠️ ET LE PLAFOND DE CINQUANTE N'EST PAS TOUCHÉ : cinquante lignes
      lues, plus au pire cette ligne-ci qui n'y était pas encore. */
  if (!notifications.some((nouvelle) => nouvelle.genre === "bienvenue")) {
    const bienvenue = await poserLaBienvenue(user.id);
    if (bienvenue) notifications.push(bienvenue);
  }

  // LES DEMANDES DE RATTACHEMENT SONT RELUES À LA SOURCE.
  // Une notification est une PHRASE FIGÉE, écrite le jour de la
  // demande ; la liaison, elle, vit. Deux choses en dépendent et ne
  // pouvaient pas dormir dans la phrase :
  //  · L'ORIGINE — c'est elle qui décide des mots des boutons
  //    (« Accepter » pour une invitation reçue d'un salon,
  //    « Valider » pour un artiste qui se déclare chez soi) ;
  //  · LE STATUT — une demande déjà tranchée sur un autre appareil ne
  //    doit plus proposer de répondre.
  // Une seule requête pour toute la liste, et la lecture des liaisons
  // est publique : rien de coûteux, rien de sensible.
  //  ⚠️ PLUS RIEN À ENRICHIR ICI (passe C). Cette route relisait, pour
  //  chaque notification de rattachement, l'ORIGINE et le STATUT de la
  //  liaison — de quoi afficher « Accepter » ou « Valider », et de
  //  quoi taire le bouton d'une demande déjà tranchée ailleurs. Les
  //  rattachements sont désormais immédiats : il n'y a plus de demande,
  //  donc plus de bouton, donc plus rien à relire.
  return NextResponse.json({
    ok: true,
    notifications,
    nonLues: notifications.filter((n) => !n.lue_le).length,
  });
}

export async function POST(requete: NextRequest) {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Connecte-toi d'abord." },
      { status: 401 }
    );
  }

  const corps = (await requete.json().catch(() => null)) as {
    id?: string;
    tout?: boolean;
  } | null;

  const maintenant = new Date().toISOString();
  let requeteMaj = supabase
    .from("notifications_compte")
    .update({ lue_le: maintenant })
    .is("lue_le", null);

  if (!corps?.tout) {
    if (!corps?.id) {
      return NextResponse.json(
        { ok: false, message: "Demande incomplète." },
        { status: 400 }
      );
    }
    requeteMaj = requeteMaj.eq("id", corps.id);
  }

  const { error } = await requeteMaj;
  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
