import { NextRequest, NextResponse } from "next/server";
import { catalogueStyles } from "@/config/tatouage";
import { slugifier } from "@/lib/slug";
import { creerNotification } from "@/lib/notifications";
import { chargerStylesAjoutes } from "@/lib/styles-ajoutes";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * PROPOSER UN STYLE — « Un style manque ? » (passe nº 122)
 * ========================================================
 * Le bas de la fenêtre « Ajouter un style », dans le formulaire de
 * portfolio. RÉSERVÉ AUX COMPTES CONNECTÉS : la fonctionnalité vit
 * dans le formulaire de création, et une demande anonyme n'aurait
 * personne à prévenir de la réponse.
 *
 * TROIS REFUS POSSIBLES, tous dits AVANT d'écrire quoi que ce soit —
 * une demande inutile ne doit pas atterrir sur le bureau de
 * l'administration :
 *  1. LE STYLE EXISTE DÉJÀ. Comparaison par SLUG, pas par texte :
 *     « fine line », « Fine-Line » et « FINE LINE » donnent tous
 *     `fine-line`. On répond avec le VRAI libellé du catalogue —
 *     c'est une réponse utile, pas une porte fermée : le tatoueur
 *     saura sous quel nom le chercher.
 *  2. LA MÊME DEMANDE EST DÉJÀ EN ATTENTE, du même compte. La
 *     reproposer ne l'accélère pas.
 *  3. LE QUOTA EST ATTEINT (voir plus bas).
 */

/* ================================================================
 * LE QUOTA — trois propositions par semaine glissante
 * ================================================================
 * POURQUOI TROIS. Un tatoueur qui parcourt les trente-huit styles en
 * repère un ou deux qui manquent à son travail, rarement plus : trois
 * couvre largement l'usage sincère, y compris l'hésitation (« je
 * propose les deux noms »). Au-delà, ce n'est plus une découverte,
 * c'est une liste — et une liste se discute par écrit, pas par
 * formulaire.
 *
 * POURQUOI UNE SEMAINE GLISSANTE, ET PAS « PAR SEMAINE CIVILE ».
 * Une semaine civile se remet à zéro le lundi à minuit : on pourrait
 * en poster trois le dimanche soir et trois le lundi matin — six en
 * douze heures, six fois plus que ce qu'on croyait autoriser. La
 * fenêtre glissante n'a pas de couture : elle compte TOUJOURS les
 * sept derniers jours, quelle que soit l'heure.
 *
 * CE QUE ÇA PLAFONNE VRAIMENT : douze demandes par mois et par
 * compte, dans le pire des cas. Une personne seule absorbe ça sans
 * peine ; un robot, lui, n'y trouve aucun intérêt.
 */
const QUOTA_SUGGESTIONS = 3;
const FENETRE_QUOTA_JOURS = 7;

/** Les trois issues rendues au navigateur, en plus de la réussite. */
type Refus = "existe" | "doublon" | "quota";

export async function POST(requete: NextRequest) {
  /* ---- 1. QUI DEMANDE ? ---- */
  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "Il faut être connecté pour proposer un style." },
      { status: 401 }
    );
  }

  /* ---- 2. CE QUI EST DEMANDÉ ---- */
  const corps = (await requete.json().catch(() => null)) as {
    propose?: string;
    ficheId?: string | null;
    ficheNom?: string | null;
  } | null;

  const propose = (corps?.propose ?? "").trim().replace(/\s+/g, " ");
  if (propose.length < 2 || propose.length > 40) {
    return NextResponse.json(
      { ok: false, message: "Écris le nom du style (2 à 40 caractères)." },
      { status: 400 }
    );
  }

  const slug = slugifier(propose);
  if (!slug) {
    return NextResponse.json(
      { ok: false, message: "Ce nom ne contient aucune lettre." },
      { status: 400 }
    );
  }

  try {
    /* ---- 3. LE STYLE EXISTE-T-IL DÉJÀ ? ---- */
    //  Le catalogue est relu ici même : sans ça, un style accepté il y
    //  a trente secondes passerait encore pour manquant.
    await chargerStylesAjoutes();
    const deja = catalogueStyles().find((style) => style.slug === slug);
    if (deja) {
      return NextResponse.json({
        ok: false,
        refus: "existe" satisfies Refus,
        libelle: deja.label,
        message: `« ${deja.label} » est déjà dans la liste.`,
      });
    }

    const admin = creerClientSupabaseAdmin();

    /* ---- 4. LA MÊME DEMANDE EST-ELLE DÉJÀ EN ATTENTE ? ---- */
    //  Le slug sert de comparaison : deux orthographes du même mot
    //  sont la même demande.
    const { data: siennes, error: erreurSiennes } = await admin
      .from("suggestions_style")
      .select("propose, cree_le, etat")
      .eq("user_id", user.id)
      .order("cree_le", { ascending: false })
      .limit(50);
    if (erreurSiennes) throw new Error(erreurSiennes.message);

    const lignes = (siennes ?? []) as Array<{
      propose: string;
      cree_le: string;
      etat: string;
    }>;

    if (
      lignes.some(
        (ligne) =>
          ligne.etat === "en_attente" && slugifier(ligne.propose) === slug
      )
    ) {
      return NextResponse.json({
        ok: false,
        refus: "doublon" satisfies Refus,
        message: "Tu as déjà proposé ce style — il est en cours d'examen.",
      });
    }

    /* ---- 5. LE QUOTA ---- */
    const debutFenetre =
      Date.now() - FENETRE_QUOTA_JOURS * 24 * 60 * 60 * 1000;
    const recentes = lignes.filter(
      (ligne) => new Date(ligne.cree_le).getTime() >= debutFenetre
    );
    if (recentes.length >= QUOTA_SUGGESTIONS) {
      return NextResponse.json({
        ok: false,
        refus: "quota" satisfies Refus,
        message: `Tu as déjà proposé ${QUOTA_SUGGESTIONS} styles cette semaine. Reviens dans quelques jours.`,
      });
    }

    /* ---- 6. L'ÉCRITURE ---- */
    //  ⚠️ PAR LA CLÉ DE SERVICE, ET NON PAR LE CLIENT DU TATOUEUR.
    //  Ce n'est pas un contournement de la politique d'insertion (elle
    //  reste la serrure côté base) : c'est que le nom de la fiche, lui,
    //  doit être recopié tel qu'il est EN BASE — un navigateur peut
    //  envoyer ce qu'il veut dans `ficheNom`.
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

    const { error } = await admin.from("suggestions_style").insert({
      user_id: user.id,
      fiche_id: ficheId,
      fiche_nom: ficheNom,
      propose,
      etat: "en_attente",
    });
    if (error) throw new Error(error.message);

    //  L'ACCUSÉ DE RÉCEPTION (passe nº 132) — la demande vient
    //  d'entrer en file : la boîte de nouvelles le dit, pour que la
    //  réponse (« Style accepté / refusé ») n'arrive pas de nulle
    //  part des jours plus tard. Jamais bloquant, comme toujours.
    await creerNotification({
      userId: user.id,
      ficheId,
      ficheNom,
      genre: "demande_style",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: `La demande n'a pas pu être enregistrée (migration supabase/yokofolio-suggestions-styles.sql passée ?) : ${
          e instanceof Error ? e.message : String(e)
        }`,
      },
      { status: 500 }
    );
  }
}
