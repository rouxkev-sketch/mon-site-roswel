import { NextRequest, NextResponse } from "next/server";
import { verifierAdmin } from "@/lib/admin-yokofolio";
import { identifiantsAdmin } from "@/lib/fiches-admin";
import { rafraichirPagesPubliques } from "@/lib/rafraichir";
import { creerClientSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * ADMIN YOKOFOLIO — L'INTERRUPTEUR, ET LA RESTAURATION
 * ======================================================
 * POST { id, publique: boolean } — « Rendre publique ».
 * POST { id, restaurer: true }   — remettre en place une fiche que le
 *                                  tatoueur a fait retirer.
 *
 * ⚠️ UNE FICHE D'ADMINISTRATEUR NE PASSE PLUS PAR LA VALIDATION À SA
 * CRÉATION (passe nº 135). Elle suivait le parcours de modération d'un
 * vrai tatoueur : envoyée en attente, relue, publiée. C'était absurde —
 * l'administrateur relisait ce qu'il venait d'écrire, et une fiche
 * préparée pour un démarchage restait invisible tant qu'il n'avait pas
 * cliqué « Valider » dans son propre écran.
 *
 * ⚠️ SES MODIFICATIONS, ELLES, Y REPASSENT (passe nº 152) : modifier
 * une fiche EN LIGNE écrit les changements dans un `brouillon` et pose
 * « en_attente ». L'interrupteur ne touche donc plus au statut tant
 * qu'un brouillon attend — sans quoi il ferait sortir la fiche de la
 * file de validation sans que rien n'ait été approuvé.
 *
 * DÉSORMAIS, L'INTERRUPTEUR FAIT TOUT : il pose `publie`,
 * `admin_publique` et — À L'ALLUMAGE SEULEMENT — `statut`.
 * ⚠️ CE QUE `admin_publique` NE FAIT PLUS (nº 275) : lever un
 * masquage. Ce masquage n'existe plus, ni côté site (nº 178) ni en
 * base (migration yokofolio-recherche-sans-masquage.sql) — c'est
 * `publie` qui rend une fiche publique, pour tout le monde. La colonne
 * ne sert plus qu'à CET écran : elle dit « cette fiche a été allumée
 * ici », et le tableau la relit pour afficher « en ligne ».
 * `statut`, lui, n'est écrit qu'à l'allumage (`validee`) : éteindre ne
 * touche pas à l'état de modération — voir la note de l'écriture.
 *
 * ⚠️ CELA NE CHANGE RIEN POUR LES VRAIS TATOUEURS : la seconde
 * serrure ci-dessous refuse toute fiche qui n'appartient pas à un
 * compte administrateur. Leur parcours de modération est intact.
 */

const SANS_MIGRATION =
  "La migration nº 43 (yokofolio-fiche-admin-publique.sql) n'est pas passée : la colonne admin_publique n'existe pas encore.";

function colonneAbsente(message: string): boolean {
  const texte = message.toLowerCase();
  return (
    /column\b[^]*\bdoes not exist/.test(texte) ||
    /could not find the .* column/.test(texte) ||
    texte.includes("schema cache")
  );
}

/**
 * §1 (nº 275) — UNE RÈGLE DE LA BASE QUI REFUSE LA VALEUR, ÇA SE DIT.
 * ====================================================================
 * LE DÉFAUT QUE CETTE FONCTION EMPÊCHE DE SE REPRODUIRE : l'écriture
 * ci-dessous posait `statut: "valide"` / `"brouillon"` — deux mots qui
 * n'existent dans AUCUNE contrainte de `tatoueurs` (elle n'admet que
 * en_attente, validee, refusee, modifications ; « valide » est le
 * vocabulaire du produit ARTISANS, `statut_validation`, une autre
 * table). PostgreSQL rejetait donc l'UPDATE ENTIER — `publie` et
 * `admin_publique` ne s'écrivaient pas davantage — et le repli, qui ne
 * connaissait que les « colonne absente », laissait remonter un
 * « Enregistrement impossible » muet. L'interrupteur paraissait mort
 * sans que rien ne dise pourquoi ; il a fallu le message brut de
 * Postgres, relevé à la main sur une fiche, pour le comprendre.
 * DÉSORMAIS : une violation de contrainte est RECONNUE et NOMMÉE dans
 * la réponse — la contrainte, et la valeur refusée quand le message la
 * porte. Le prochain défaut de ce genre se lira à l'écran.
 */
function contrainteRefusee(message: string): string | null {
  //  Postgres : « new row for relation "x" violates check constraint
  //  "y" » (23514), « violates foreign key constraint », « violates
  //  not-null constraint ». PostgREST relaie le texte tel quel.
  const forme = /violates ([a-z-]+ )?(check|foreign key|not-null|unique) constraint(?: "([^"]+)")?/i.exec(
    message
  );
  if (!forme) return null;
  const nom = forme[3] ? ` « ${forme[3]} »` : "";
  return (
    `La base a REFUSÉ la valeur : contrainte${nom} (${forme[2]}). ` +
    `Message d'origine : ${message}`
  );
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
    const corps = (await requete.json()) as {
      id?: string;
      publique?: boolean;
      restaurer?: boolean;
    };
    if (!corps.id) {
      return NextResponse.json(
        { ok: false, message: "Requête incomplète." },
        { status: 400 }
      );
    }

    const admin = creerClientSupabaseAdmin();

    //  LA SECONDE SERRURE : à qui appartient cette fiche ? Une fiche
    //  DÉJÀ RATTACHÉE à son tatoueur n'appartient plus à
    //  l'administrateur — et c'est très bien : il ne doit pas pouvoir
    //  publier ni dépublier la fiche de quelqu'un depuis cet écran.
    const proprio = await admin
      .from("tatoueurs")
      .select("id, user_id, supprime_le, brouillon")
      .eq("id", corps.id)
      .maybeSingle();
    if (proprio.error) throw new Error(proprio.error.message);
    const ligne = proprio.data as {
      user_id: string | null;
      supprime_le: string | null;
      brouillon?: Record<string, unknown> | null;
    } | null;
    if (!ligne) {
      return NextResponse.json(
        { ok: false, message: "Fiche introuvable." },
        { status: 404 }
      );
    }
    const comptes = await identifiantsAdmin();
    if (!ligne.user_id || !comptes.includes(ligne.user_id)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Cet écran ne pilote QUE les fiches d'un compte administrateur.",
        },
        { status: 403 }
      );
    }

    //  ---------- LA RESTAURATION ----------
    //  Le tatoueur a fait retirer sa fiche depuis son lien. Elle n'est
    //  pas effacée : elle attend trente jours. L'administrateur peut
    //  la remettre — c'est l'exact pendant du bouton « Réactiver mon
    //  portfolio » côté tatoueur.
    if (corps.restaurer) {
      const remise = await admin
        .from("tatoueurs")
        .update({ supprime_le: null, purge_le: null })
        .eq("id", corps.id);
      //  §1 (nº 275) — même règle qu'à l'interrupteur : un refus de la
      //  base se dit, il ne se tait pas.
      if (remise.error) {
        const refus = contrainteRefusee(remise.error.message);
        if (refus) {
          return NextResponse.json({ ok: false, message: refus }, { status: 409 });
        }
        throw new Error(remise.error.message);
      }
      rafraichirPagesPubliques();
      return NextResponse.json({ ok: true });
    }

    //  ---------- L'INTERRUPTEUR ----------
    if (typeof corps.publique !== "boolean") {
      return NextResponse.json(
        { ok: false, message: "Requête incomplète." },
        { status: 400 }
      );
    }

    //  LES TROIS COLONNES ENSEMBLE. Écrire `admin_publique` seul
    //  laissait la fiche invisible (elle n'était pas publiée) et
    //  l'interrupteur passait pour cassé.
    //  §1 (nº 275) — LES DEUX SENS N'ONT PAS LA MÊME ÉCRITURE, ET
    //  C'EST LA CORRECTION DU RELEVÉ (« violates check constraint
    //  tatoueurs_statut_check », fiche « Funambulink Ttt ») :
    //   · ALLUMER → `validee`, LE mot de la contrainte (les quatre
    //     valeurs admises : en_attente, validee, refusee,
    //     modifications). « valide », qui était écrit ici, n'en fait
    //     pas partie : il vient du produit artisans.
    //   · ÉTEINDRE → LE STATUT N'EST PAS TOUCHÉ. L'interrupteur ne
    //     pilote que la VISIBILITÉ ; l'état de modération appartient à
    //     la modération, et « brouillon » n'existait pas plus que
    //     « valide ». Une fiche éteinte garde donc le statut qu'elle
    //     avait — elle n'encombre aucune file, puisque la file lit
    //     `statut = 'en_attente'`.
    //  ⚠️ RIEN NE S'ALLUME TOUT SEUL : `admin_publique` reste `false`
    //  par défaut en base (migration nº 43) et n'est écrit qu'ici, sur
    //  un geste explicite du propriétaire.
    const valeurs: Record<string, unknown> = {
      admin_publique: corps.publique,
      publie: corps.publique,
    };
    if (corps.publique) valeurs.statut = "validee";
    //  ⚠️ UNE MODIFICATION EN ATTENTE N'EST PAS EFFACÉE PAR
    //  L'INTERRUPTEUR (passe nº 152). La fiche porte un `brouillon` :
    //  elle attend une décision dans « Fiches à valider », et son
    //  statut « en_attente » est CE QUI L'Y FAIT FIGURER. L'écraser
    //  d'un « validee » la ferait sortir de la file sans que personne
    //  n'ait rien approuvé — le changement resterait dans le brouillon,
    //  invisible, exactement le défaut que la nº 152 corrigeait.
    //  L'interrupteur garde donc son rôle — mettre en ligne ou retirer
    //  — sans jamais trancher à la place de la modération.
    if (ligne.brouillon != null) delete valeurs.statut;
    let ecriture = await admin
      .from("tatoueurs")
      .update(valeurs)
      .eq("id", corps.id);
    if (ecriture.error && colonneAbsente(ecriture.error.message)) {
      const message = ecriture.error.message.toLowerCase();
      //  Base pas encore migrée : on retire la colonne que l'erreur
      //  nomme et on réessaie — `publie` suffit à faire l'essentiel.
      for (const colonne of ["statut", "admin_publique"]) {
        if (message.includes(colonne)) delete valeurs[colonne];
      }
      ecriture = await admin
        .from("tatoueurs")
        .update(valeurs)
        .eq("id", corps.id);
      if (ecriture.error && colonneAbsente(ecriture.error.message)) {
        return NextResponse.json(
          { ok: false, message: SANS_MIGRATION },
          { status: 409 }
        );
      }
    }
    //  §1 (nº 275) — LA VIOLATION DE CONTRAINTE EST NOMMÉE, jamais
    //  avalée en « Enregistrement impossible » : c'est ce silence qui
    //  a rendu le défaut de l'interrupteur invisible pendant des
    //  passes entières. 409 : la demande est bonne, c'est l'état de la
    //  base qui la refuse.
    if (ecriture.error) {
      const refus = contrainteRefusee(ecriture.error.message);
      if (refus) {
        return NextResponse.json({ ok: false, message: refus }, { status: 409 });
      }
      throw new Error(ecriture.error.message);
    }

    //  LA MOSAÏQUE ET LE PLAN DU SITE SONT EN CACHE : sans ce
    //  rafraîchissement, la fiche mettrait l'âge du cache à
    //  apparaître (ou à disparaître).
    rafraichirPagesPubliques();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        message: e instanceof Error ? e.message : "Enregistrement impossible.",
      },
      { status: 500 }
    );
  }
}
