import { NextRequest, NextResponse } from "next/server";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * LES RATTACHEMENTS ENTRE FICHES
 * ===============================
 * POST   { artisteId, salonId, modeId?, origine } — RATTACHER.
 * DELETE { liaisonId } ou ?id=… — DÉTACHER.
 *
 * ⚠️ IL N'Y A PLUS DE DEMANDE, PLUS D'ACCORD, PLUS DE RÉPONSE.
 * -----------------------------------------------------------
 * Un rattachement était une DEMANDE : elle partait en « attente », une
 * notification arrivait chez l'autre, et il fallait cliquer « Valider »
 * pour que l'artiste apparaisse dans l'équipe. Trois écrans, deux
 * personnes, et un délai — pour une information que les deux
 * connaissaient déjà.
 *
 * Désormais le lien est IMMÉDIAT, dans les deux sens :
 *  · un salon ajoute un artiste à son équipe → il y est aussitôt ;
 *  · un artiste déclare travailler dans un salon → il apparaît
 *    aussitôt dans l'équipe de ce salon.
 *
 * CE QUI REMPLACE L'AUTORISATION, C'EST LA RÉVERSIBILITÉ. Les DEUX
 * bouts peuvent défaire le lien à tout moment (`DELETE`), et les
 * politiques de sécurité de la base l'autorisent des deux côtés
 * (migration nº 26, « retirer sa liaison »). Se tromper ne coûte
 * qu'un clic — c'est ce qui rend l'accord préalable inutile.
 *
 * ⚠️ CE QUI N'EST PAS TOUCHÉ : la modération par l'administrateur.
 * Une fiche reste validée, mise hors ligne ou refusée par l'admin,
 * exactement comme avant. Un rattachement est un fait entre deux
 * professionnels ; une publication est une décision éditoriale. Les
 * deux n'ont jamais eu à obéir à la même règle.
 *
 * ON ÉCRIT AVEC LA SESSION de la personne, jamais avec la clé de
 * service : les politiques de la base ont le dernier mot, même si la
 * requête est trafiquée.
 *
 * ⚠️⚠️ LEÇON DE LA PANNE DES RATTACHEMENTS (passe nº 102) — À LIRE
 * AVANT DE TOUCHER À CE FICHIER.
 * Pendant des semaines, tout rattachement échouait sur ce message :
 * « Vérifie que la fiche t'appartient ». Il était FAUX : la fiche
 * appartenait bien à celui qui cliquait. La vraie cause était en base
 * (la politique d'écriture exigeait encore l'ancien statut
 * `demande` — voir la migration nº 45), et personne ne pouvait le
 * savoir PARCE QUE CE FICHIER JETAIT L'ERREUR DE SUPABASE SANS LA
 * REGARDER. Un seul message, pour toutes les causes.
 *
 * D'OÙ DEUX RÈGLES, désormais tenues plus bas :
 *  1. L'ERREUR EST ÉCRITE DANS LE JOURNAL DU SERVEUR, toujours, avec
 *     son code. C'est la seule trace exploitable quand ça casse.
 *  2. ON NE DIT « ce n'est pas ta fiche » QUE SI C'EST VRAIMENT LE
 *     REFUS D'UNE POLITIQUE (code 42501). Toute autre panne dit
 *     qu'elle est technique — un message qui accuse la personne à
 *     tort lui fait chercher au mauvais endroit, indéfiniment.
 */

export const dynamic = "force-dynamic";

type CorpsDemande = {
  artisteId?: string;
  salonId?: string;
  modeId?: string | null;
  /** D'où part le rattachement — pour l'affichage, et pour distinguer
      le bloc 12 (« adresse ») du bloc équipe. */
  origine?: "artiste" | "salon" | "adresse";
};

export async function POST(requete: NextRequest) {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Log in to manage your links." },
      { status: 401 }
    );
  }

  const corps = (await requete.json().catch(() => ({}))) as CorpsDemande;
  if (!corps.artisteId || !corps.salonId) {
    return NextResponse.json(
      { ok: false, message: "One of the two portfolios is missing." },
      { status: 400 }
    );
  }
  if (corps.artisteId === corps.salonId) {
    return NextResponse.json(
      { ok: false, message: "A portfolio can't link to itself." },
      { status: 400 }
    );
  }

  //  DÉJÀ LIÉES ? On ne crée pas de doublon, et surtout on ne répond
  //  pas par une erreur : le résultat voulu est atteint.
  //  ⚠️ SAUF SI LA LIGNE TROUVÉE EST UN ANCIEN REFUS. La migration
  //  nº 39 a laissé les `refusee` en place à dessein, en promettant
  //  que leurs propriétaires « peuvent refaire le lien d'un clic si
  //  c'était une erreur ». Sans ce cas, la promesse était fausse : la
  //  ligne refusée répondait « déjà fait », l'écran affichait un
  //  succès, et l'équipe restait vide — la vue ne lit que les
  //  validées. On efface donc le refus (les deux bouts en ont le
  //  droit) et on repart sur un rattachement neuf.
  /*  ██ §1 (nº 410) — LE DOUBLON SE JUGE PAR MODE, PAS PAR SALON ██
       ============================================================
       C'ÉTAIT LA CAUSE, ET ELLE EST ICI. Cette recherche ne portait
       que sur (artiste, salon) : un artiste RÉSIDENT d'un studio qui
       déclarait EN PLUS un guest chez ce même studio voyait sa
       seconde demande répondre « déjà fait » — la liaison du guest
       n'était jamais créée, donc la vue `equipe_salon` n'avait qu'une
       ligne à rendre, et le guest n'existait nulle part.
       ⚠️ LA BASE, ELLE, AVAIT RAISON DEPUIS LE DÉBUT : son index
       d'unicité s'appelle `idx_liaisons_unique` et porte sur
       (artiste_id, salon_id, coalesce(mode_id, …)) — « UNE SEULE
       liaison par (artiste, salon, MODE) », dit son commentaire
       (yokofolio-modes-et-liaisons.sql). C'est le code qui était plus
       sévère que le schéma, et qui refusait ce que la base autorisait.
       ⚠️ ET `maybeSingle()` SERAIT DEVENU UNE BOMBE : dès qu'un artiste
       a deux liaisons chez un même salon, une recherche sans `mode_id`
       en trouve deux et `maybeSingle` LÈVE UNE ERREUR. Ajouter le mode
       ne fait donc pas que réparer le cas manquant — c'est ce qui rend
       cette ligne juste.
       ⚠️ AUCUN VRAI DOUBLON N'EST OUVERT : un mode donné n'a toujours
       qu'une liaison, et une invitation partie DU SALON (sans mode)
       reste unique elle aussi — `mode_id is null` est une valeur comme
       une autre pour cette recherche, exactement comme le
       `coalesce(...)` de l'index. */
  const rechercheLiaison = supabase
    .from("liaisons_artiste_salon")
    .select("id, statut")
    .eq("artiste_id", corps.artisteId)
    .eq("salon_id", corps.salonId);
  const { data: dejaLa } = await (corps.modeId
    ? rechercheLiaison.eq("mode_id", corps.modeId)
    : rechercheLiaison.is("mode_id", null)
  ).maybeSingle();
  const ancienne = dejaLa as { id: string; statut: string } | null;
  if (ancienne && ancienne.statut !== "refusee") {
    return NextResponse.json({ ok: true, deja: true });
  }
  if (ancienne) {
    await supabase
      .from("liaisons_artiste_salon")
      .delete()
      .eq("id", ancienne.id);
  }

  /*  ██ §1 (nº 412) — DEUX GARDES, POUR QU'UN RÉENREGISTREMENT NE
       MULTIPLIE PLUS JAMAIS LES LIGNES ██
       ================================================================
       LE RELEVÉ (Gaston, trois lignes) : la fiche du salon portait une
       liaison SANS MODE — l'écriture d'AVANT que les liaisons pendent
       aux modes, ou une invitation partie du salon. La nº 410 juge le
       doublon PAR MODE : cette vieille ligne ne répondait à aucune des
       deux recherches, elle est donc restée, et les deux liaisons par
       mode se sont ajoutées À CÔTÉ — une ligne de trop.
       LA RÈGLE POSÉE : pour un même (artiste, salon), une liaison SANS
       mode n'est légitime QUE s'il n'existe aucune liaison PAR MODE.
       La déclaration de l'artiste dit tout ce que l'invitation disait,
       et plus précisément — les deux ne s'empilent jamais. */
  if (corps.modeId) {
    //  L'artiste déclare un mode ici : la ligne sans mode du même
    //  couple, si elle existe, est REMPLACÉE par celle-ci.
    await supabase
      .from("liaisons_artiste_salon")
      .delete()
      .eq("artiste_id", corps.artisteId)
      .eq("salon_id", corps.salonId)
      .is("mode_id", null);
    //  ET LE MODE NE VIT QU'À UN ENDROIT : s'il désignait un AUTRE
    //  salon avant (l'artiste a changé le lieu de son encadré sans le
    //  fermer), sa liaison là-bas ne dit plus rien de vrai — elle
    //  part. Sans cette ligne, l'artiste resterait affiché dans
    //  l'équipe de son ancien salon.
    await supabase
      .from("liaisons_artiste_salon")
      .delete()
      .eq("mode_id", corps.modeId)
      .neq("salon_id", corps.salonId);
  } else {
    //  Une invitation (du salon) ou un lien d'adresse : si l'artiste
    //  est DÉJÀ là par l'un de ses modes, il n'y a rien à ajouter —
    //  répondre « déjà fait » est la vérité, et c'est ce qui empêche
    //  de recréer la ligne parasite par l'autre bout.
    const { data: parUnMode } = await supabase
      .from("liaisons_artiste_salon")
      .select("id")
      .eq("artiste_id", corps.artisteId)
      .eq("salon_id", corps.salonId)
      .not("mode_id", "is", null)
      .limit(1)
      .maybeSingle();
    if (parUnMode) {
      return NextResponse.json({ ok: true, deja: true });
    }
  }

  const { data, error } = await supabase
    .from("liaisons_artiste_salon")
    .insert({
      artiste_id: corps.artisteId,
      salon_id: corps.salonId,
      mode_id: corps.modeId ?? null,
      //  TROIS ORIGINES : « artiste » et « salon » disent qui a
      //  rattaché qui dans une équipe ; « adresse » marque les liens
      //  du bloc 12, entre deux ÉTABLISSEMENTS. C'est ce mot qui
      //  permet aux deux blocs de ne pas se mélanger.
      origine:
        corps.origine === "salon" || corps.origine === "adresse"
          ? corps.origine
          : "artiste",
      //  ⚠️ VALIDÉE D'EMBLÉE. La colonne `statut` reste dans la table :
      //  les liaisons déjà en base la portent, et la vue `equipe_salon`
      //  la lit. On l'écrit simplement toujours à « validee ».
      statut: "validee",
      repondu_le: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    //  RÈGLE 1 — LA TRACE. Sans elle, la panne de la passe nº 102
    //  était invisible : on ne savait même pas que la base répondait.
    console.error("[liaison] write refused", {
      code: error?.code ?? null,
      message: error?.message ?? "no row written",
      details: error?.details ?? null,
      origine: corps.origine ?? "artiste",
    });
    //  RÈGLE 2 — LE BON MESSAGE. 42501 est le refus d'une politique :
    //  là, et seulement là, la propriété de la fiche est en cause.
    const refusDePolitique = error?.code === "42501";
    return NextResponse.json(
      {
        ok: false,
        message: refusDePolitique
          ? "This portfolio isn't yours: the link wasn't saved."
          : "The link couldn't be saved. Try again in a moment.",
      },
      { status: refusDePolitique ? 403 : 500 }
    );
  }

  return NextResponse.json({ ok: true, liaisonId: (data as { id: string }).id });
}

export async function DELETE(requete: NextRequest) {
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Log in to manage your links." },
      { status: 401 }
    );
  }

  //  DEUX FAÇONS DE DIRE LEQUEL : dans le corps (l'équipe) ou dans
  //  l'adresse (le bloc 12, qui n'envoie pas de corps).
  const corps = (await requete.json().catch(() => ({}))) as {
    liaisonId?: string;
  };
  const liaisonId =
    corps.liaisonId ?? requete.nextUrl.searchParams.get("id") ?? null;
  if (!liaisonId) {
    return NextResponse.json(
      { ok: false, message: "Which link?" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("liaisons_artiste_salon")
    .delete()
    .eq("id", liaisonId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      {
        ok: false,
        message: "This link isn't yours, or it no longer exists.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
