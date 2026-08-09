import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ARRIVEE_AVEC_PORTFOLIO,
  ARRIVEE_SANS_PORTFOLIO,
} from "@/config/tatouage";
import { creerClientSupabaseServeur } from "@/lib/supabase/server";

/**
 * L'AIGUILLAGE D'APRÈS CONNEXION (passe nº 137)
 * ==============================================
 * Adresse : /apres-connexion
 *
 * ELLE N'AFFICHE RIEN. Elle pose UNE question à la base — « ce compte
 * a-t-il au moins un portfolio ? » — et redirige :
 *
 *   · OUI → sa fiche (l'aperçu public de son portfolio) ;
 *   · NON → ses favoris.
 *
 * ⚠️ ELLE REMPLACE LA RÈGLE DE LA PASSE Nº 131 (« toujours Ma
 * fiche »), qui datait d'un site où seuls les tatoueurs avaient un
 * compte. Elle vaut pour TOUS les chemins d'entrée — connexion,
 * création de compte, lien d'e-mail, nouveau mot de passe — parce
 * qu'ils mènent tous ici (voir ARRIVEE_APRES_CONNEXION).
 *
 * COMMENT ON SAIT QU'UN PORTFOLIO EXISTE : la ligne `tatoueurs` n'est
 * écrite QU'À L'ENVOI du formulaire (aucun brouillon n'est créé
 * avant). Une seule ligne suffit donc à répondre — d'où le `limit(1)` :
 * on ne compte pas, on cherche une preuve.
 *
 * ⚠️ ET UNE SUPPRESSION EN COURS RESTE UN PORTFOLIO. La ligne existe
 * encore pendant les 30 jours (c'est ce qui permet de la réactiver) :
 * son propriétaire doit arriver sur sa fiche, là où l'écran
 * « Portfolio désactivé » l'attend — pas sur des favoris vides qui ne
 * lui diraient rien de ce qui se passe.
 *
 * EN CAS DE DOUTE (base injoignable), ON ENVOIE VERS LA FICHE : c'est
 * la page qui sait se débrouiller seule — sans portfolio, elle affiche
 * le formulaire de création. L'inverse aurait montré des favoris vides
 * à un tatoueur.
 */
export const metadata: Metadata = {
  title: "Un instant…",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PageApresConnexion({
  searchParams,
}: {
  searchParams: Promise<{ bienvenue?: string }>;
}) {
  const { bienvenue } = await searchParams;
  //  « Bienvenue » traverse l'aiguillage : c'est la fiche qui l'affiche
  //  (retour d'un compte dont la suppression vient d'être annulée).
  const suffixe = bienvenue ? "&bienvenue=1" : "";

  const supabase = await creerClientSupabaseServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  //  Personne : la page de connexion. Elle n'a pas à être atteinte
  //  ainsi, mais une adresse tapée à la main ne doit rien casser.
  if (!user) redirect("/devenir-tatoueur");

  let aUnPortfolio = true;
  try {
    const { data, error } = await supabase
      .from("tatoueurs")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (!error) aUnPortfolio = (data ?? []).length > 0;
  } catch {
    //  Base injoignable : on garde le chemin qui sait se débrouiller.
  }

  redirect(
    aUnPortfolio
      ? `${ARRIVEE_AVEC_PORTFOLIO}${suffixe}`
      : ARRIVEE_SANS_PORTFOLIO
  );
}
