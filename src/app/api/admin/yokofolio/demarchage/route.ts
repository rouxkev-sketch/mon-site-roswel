import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { adresseDuSite } from "@/lib/site";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";
import {
  JOURS_APRES_RATTACHEMENT,
  JOURS_APRES_SUPPRESSION,
  lienDeRattachement,
  messageDemarchage,
  typeDeLaFiche,
  type EtatLigne,
} from "@/lib/demarchage";

/**
 * ADMIN YOKOFOLIO — LE TABLEAU DE DÉMARCHAGE
 * ============================================
 * GET  : le tableau entier — les fiches de l'administrateur qu'on n'a
 *        écrites à personne (« à envoyer »), et les ENVOIS déjà faits,
 *        chacun avec ses fiches empilées, son statut, ses liens et son
 *        message.
 * POST : { fiches: string[] } — on coche, on valide. Un jeton naît, un
 *        envoi est créé, le message est rendu prêt à copier.
 *
 * ⚠️ LE JETON EST TIRÉ ICI, ET NULLE PART AILLEURS.
 * `randomBytes(32)` : 256 bits d'entropie, écrits en base64url (43
 * caractères). Il n'a AUCUN rapport avec l'identifiant de la fiche,
 * ni avec la date, ni avec un compteur — on ne peut donc pas obtenir
 * le lien du voisin en essayant le suivant. C'est ce qui permet au
 * lien d'être la SEULE serrure de la page de rattachement : il permet
 * de s'approprier des fiches ET de les supprimer, deux gestes qu'un
 * identifiant qui s'incrémente rendrait accessibles à quiconque sait
 * compter.
 *
 * ⚠️ LES STATUTS AVANCENT SEULS. Il n'y a AUCUNE route pour dire « ce
 * démarchage est passé à envoyé/compte créé/supprimé » :
 *  · « à envoyer » = pas d'envoi pour cette fiche ;
 *  · « envoyé »    = un envoi existe (le jeton a été généré) ;
 *  · « compte créé » = la page de rattachement a fait son travail ;
 *  · « supprimé »  = le tatoueur a cliqué « supprimer » sur cette page.
 * Chacun de ces mots est la conséquence d'un GESTE RÉEL, jamais d'une
 * case cochée par l'administrateur.
 *
 * ⚠️ CE QUI DISPARAÎT DU TABLEAU NE DISPARAÎT PAS DE LA BASE. Une
 * semaine après le rattachement, trente jours après une suppression,
 * la ligne cesse d'être servie — les lignes restent en base pour
 * répondre plus tard à « qui a-t-on démarché ? ».
 */

const SANS_MIGRATION =
  "La migration nº 52 (yokofolio-demarchage.sql) n'est pas passée : les tables du démarchage n'existent pas encore.";

function tableAbsente(message: string): boolean {
  const texte = message.toLowerCase();
  return (
    /relation .* does not exist/.test(texte) ||
    /could not find the table/.test(texte) ||
    texte.includes("schema cache")
  );
}

type LigneFiche = {
  id: string;
  nom: string | null;
  slug: string | null;
  ville_nom: string | null;
  type_fiche: string | null;
  etablissement: string | null;
  photo_profil: string | null;
  publie: boolean | null;
  admin_publique: boolean | null;
  supprime_le: string | null;
  user_id: string | null;
  cree_le: string | null;
};

type LigneEnvoi = {
  id: string;
  jeton: string;
  statut: string;
  envoye_le: string;
  rattache_le: string | null;
  retire_le: string | null;
};

const CHAMPS_FICHE =
  "id, nom, slug, ville_nom, type_fiche, etablissement, photo_profil, " +
  "publie, admin_publique, supprime_le, user_id, cree_le";

/** Une fiche, telle que l'écran la reçoit. */
function fichePourEcran(f: LigneFiche) {
  return {
    id: f.id,
    nom: f.nom ?? "(sans nom)",
    slug: f.slug,
    ville: f.ville_nom,
    type: typeDeLaFiche(f),
    photo: f.photo_profil,
    //  L'INTERRUPTEUR : allumé, la fiche est en ligne. Les deux
    //  colonnes vont ensemble depuis la passe nº 135 — une fiche
    //  d'administrateur ne passe plus par la validation, c'est
    //  l'interrupteur qui la publie.
    enLigne: Boolean(f.publie) && f.admin_publique === true,
    retiree: Boolean(f.supprime_le),
    date: f.cree_le,
  };
}

const JOUR_MS = 24 * 60 * 60 * 1000;

/** Une ligne finie doit-elle encore être montrée ? */
function encoreAuTableau(envoi: LigneEnvoi): boolean {
  const maintenant = Date.now();
  if (envoi.retire_le) {
    return (
      maintenant - new Date(envoi.retire_le).getTime() <
      JOURS_APRES_SUPPRESSION * JOUR_MS
    );
  }
  if (envoi.rattache_le) {
    return (
      maintenant - new Date(envoi.rattache_le).getTime() <
      JOURS_APRES_RATTACHEMENT * JOUR_MS
    );
  }
  return true;
}

/** L'état d'un envoi, LU DANS LES DATES — jamais dans la colonne.
    Deux façons de dire la même chose ; on écoute la plus sûre. */
function etatDeLEnvoi(envoi: LigneEnvoi): EtatLigne {
  if (envoi.retire_le) return "supprime";
  if (envoi.rattache_le) return "compte_cree";
  return "envoye";
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
    const comptes = await identifiantsAdmin();
    const adresse = adresseDuSite();

    //  1. LES ENVOIS DÉJÀ FAITS, et les fiches qu'ils emportent.
    //  ⚠️ On les lit AVANT les fiches de l'administrateur, parce
    //  qu'une fiche rattachée ne lui appartient plus : sans ce
    //  premier tour, elle quitterait le tableau à la seconde où le
    //  tatoueur crée son compte — c'est-à-dire au moment précis où
    //  l'on veut la voir passer en « compte créé ».
    const envois = await admin
      .from("demarchages")
      .select("id, jeton, statut, envoye_le, rattache_le, retire_le")
      .order("envoye_le", { ascending: false });
    if (envois.error) {
      if (tableAbsente(envois.error.message)) {
        return NextResponse.json(
          { ok: false, message: SANS_MIGRATION },
          { status: 409 }
        );
      }
      throw new Error(envois.error.message);
    }

    const listeEnvois = ((envois.data ?? []) as unknown as LigneEnvoi[]).filter(
      encoreAuTableau
    );

    const liens = listeEnvois.length
      ? await admin
          .from("demarchage_fiches")
          .select("demarchage_id, tatoueur_id")
          .in(
            "demarchage_id",
            listeEnvois.map((e) => e.id)
          )
      : { data: [], error: null };
    if (liens.error) throw new Error(liens.error.message);
    const attaches = (liens.data ?? []) as Array<{
      demarchage_id: string;
      tatoueur_id: string;
    }>;

    //  2. TOUTES LES FICHES CONCERNÉES : celles de l'administrateur
    //  (démarchées ou non) ET celles qu'un envoi emporte, même
    //  passées à leur tatoueur. Les supprimées comprises : c'est
    //  précisément l'état « supprimé » qu'on veut montrer.
    const idsDesEnvois = attaches.map((a) => a.tatoueur_id);
    const parId = new Map<string, LigneFiche>();

    if (comptes.length > 0) {
      const mienne = await admin
        .from("tatoueurs")
        .select(CHAMPS_FICHE)
        .in("user_id", comptes)
        .order("cree_le", { ascending: false });
      if (mienne.error) throw new Error(mienne.error.message);
      for (const f of (mienne.data ?? []) as unknown as LigneFiche[]) {
        parId.set(f.id, f);
      }
    }
    if (idsDesEnvois.length > 0) {
      const parties = await admin
        .from("tatoueurs")
        .select(CHAMPS_FICHE)
        .in("id", idsDesEnvois);
      if (parties.error) throw new Error(parties.error.message);
      for (const f of (parties.data ?? []) as unknown as LigneFiche[]) {
        parId.set(f.id, f);
      }
    }

    //  3. LES GROUPES — les lignes cochées ensemble ont FUSIONNÉ en
    //  une seule entrée, qui empile ses fiches.
    const fichesDejaEnvoyees = new Set<string>();
    const groupes = listeEnvois
      .map((envoi) => {
        const siennes = attaches
          .filter((a) => a.demarchage_id === envoi.id)
          .map((a) => parId.get(a.tatoueur_id))
          .filter((f): f is LigneFiche => Boolean(f))
          .map(fichePourEcran);
        for (const f of siennes) fichesDejaEnvoyees.add(f.id);
        const lien = lienDeRattachement(adresse, envoi.jeton);
        return {
          id: envoi.id,
          etat: etatDeLEnvoi(envoi),
          envoyeLe: envoi.envoye_le,
          rattacheLe: envoi.rattache_le,
          retireLe: envoi.retire_le,
          lien,
          fiches: siennes,
          message: messageDemarchage(
            siennes.map((f) => ({ nom: f.nom, slug: f.slug, type: f.type })),
            lien,
            adresse
          ),
        };
      })
      //  Un envoi dont TOUTES les fiches ont été purgées n'a plus rien
      //  à montrer : on ne sert pas une ligne vide.
      .filter((g) => g.fiches.length > 0);

    //  4. LES FICHES ENCORE VIERGES — celles qu'on n'a écrites à
    //  personne. Elles restent des lignes seules, cochables.
    const aEnvoyer = [...parId.values()]
      .filter(
        (f) =>
          !fichesDejaEnvoyees.has(f.id) &&
          f.user_id !== null &&
          comptes.includes(f.user_id)
      )
      .map(fichePourEcran);

    return NextResponse.json({ ok: true, aEnvoyer, groupes, adresse });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: e instanceof Error ? e.message : "Lecture impossible.",
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

  try {
    const corps = (await requete.json()) as { fiches?: string[] };
    const demandees = Array.isArray(corps.fiches) ? corps.fiches : [];
    if (demandees.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Aucune fiche cochée." },
        { status: 400 }
      );
    }

    const admin = creerClientSupabaseAdmin();
    const comptes = await identifiantsAdmin();
    const adresse = adresseDuSite();

    //  PREMIÈRE SERRURE : ces fiches appartiennent-elles bien à un
    //  compte administrateur ? Sans ce contrôle, un appel forgé
    //  fabriquerait un lien de suppression sur la fiche d'un VRAI
    //  tatoueur — le pire de ce que cette fonctionnalité peut faire.
    const lecture = await admin
      .from("tatoueurs")
      .select(CHAMPS_FICHE)
      .in("id", demandees);
    if (lecture.error) throw new Error(lecture.error.message);
    const fiches = (lecture.data ?? []) as unknown as LigneFiche[];
    if (fiches.length !== demandees.length) {
      return NextResponse.json(
        { ok: false, message: "Une des fiches est introuvable." },
        { status: 404 }
      );
    }
    const etrangere = fiches.find(
      (f) => !f.user_id || !comptes.includes(f.user_id)
    );
    if (etrangere) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Le démarchage ne concerne QUE les fiches d'un compte administrateur.",
        },
        { status: 403 }
      );
    }

    //  SECONDE SERRURE : une fiche déjà démarchée ne peut pas l'être
    //  deux fois. La base le tient aussi (index unique), mais un
    //  message clair vaut mieux qu'une erreur de contrainte.
    const deja = await admin
      .from("demarchage_fiches")
      .select("tatoueur_id")
      .in("tatoueur_id", demandees);
    if (deja.error) {
      if (tableAbsente(deja.error.message)) {
        return NextResponse.json(
          { ok: false, message: SANS_MIGRATION },
          { status: 409 }
        );
      }
      throw new Error(deja.error.message);
    }
    if ((deja.data ?? []).length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Une de ces fiches a déjà été démarchée : elle porte déjà un lien.",
        },
        { status: 409 }
      );
    }

    //  LE JETON. 32 octets tirés au sort, en base64url : 43
    //  caractères, 256 bits. Rien dedans ne vient de la fiche.
    const jeton = randomBytes(32).toString("base64url");

    const creation = await admin
      .from("demarchages")
      .insert({ jeton, statut: "envoye" })
      .select("id, jeton, statut, envoye_le, rattache_le, retire_le")
      .maybeSingle();
    if (creation.error) throw new Error(creation.error.message);
    const envoi = creation.data as unknown as LigneEnvoi | null;
    if (!envoi) throw new Error("L'envoi n'a pas pu être créé.");

    const rattachement = await admin.from("demarchage_fiches").insert(
      demandees.map((id) => ({ demarchage_id: envoi.id, tatoueur_id: id }))
    );
    if (rattachement.error) {
      //  On ne laisse pas un envoi orphelin derrière soi : un jeton
      //  sans fiche est un lien qui ne mène nulle part.
      await admin.from("demarchages").delete().eq("id", envoi.id);
      throw new Error(rattachement.error.message);
    }

    //  L'ORDRE DES FICHES DANS LE MESSAGE suit l'ordre coché : la
    //  première nommée est celle à qui l'on parle.
    const dansLOrdre = demandees
      .map((id) => fiches.find((f) => f.id === id))
      .filter((f): f is LigneFiche => Boolean(f))
      .map(fichePourEcran);
    const lien = lienDeRattachement(adresse, envoi.jeton);

    return NextResponse.json({
      ok: true,
      groupe: {
        id: envoi.id,
        etat: "envoye" as EtatLigne,
        envoyeLe: envoi.envoye_le,
        rattacheLe: null,
        retireLe: null,
        lien,
        fiches: dansLOrdre,
        message: messageDemarchage(
          dansLOrdre.map((f) => ({ nom: f.nom, slug: f.slug, type: f.type })),
          lien,
          adresse
        ),
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: e instanceof Error ? e.message : "Création impossible.",
      },
      { status: 500 }
    );
  }
}
