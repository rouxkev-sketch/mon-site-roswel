import { creerClientSupabaseServeur } from "@/lib/supabase/server";
import { natureConnue } from "@/lib/photos-tatoueur";

/**
 * CE QUE LA PAGE « MES FAVORIS » LIT — côté serveur
 * ==================================================
 * TROIS LECTURES SIMPLES, ET PAS UNE JOINTURE IMBRIQUÉE. C'est la
 * règle de la maison (voir `garnirFiches` dans lib/tatoueurs) et elle
 * a ici une deuxième raison : `favoris_photos` et `photos_tatoueur`
 * n'ont pas les mêmes politiques de lecture. Une imbriquée mélangerait
 * les deux dans une seule requête, et le moindre changement de
 * politique la ferait taire sans un mot. Trois lectures se lisent, se
 * mesurent et se réparent une par une.
 *
 * ⚠️ ON N'AFFICHE QUE CE QUI EST ENCORE PUBLIÉ. Une fiche retirée du
 * site (hors ligne, suppression en cours, modération) disparaît des
 * favoris tant qu'elle n'est pas revenue — et REVIENT d'elle-même le
 * jour où elle est republiée : la ligne de favori, elle, n'a jamais
 * bougé. C'est exactement ce qu'on veut : ne rien perdre, ne rien
 * montrer qui ne soit pas public.
 */

/** UNE PHOTO ENREGISTRÉE, avec ce qu'il faut pour l'afficher. */
export type PhotoFavorite = {
  /** L'identifiant de la photo — la clé du cœur. */
  id: string;
  url: string;
  miniature: string;
  style: string;
  rendu: string | null;
  nature: string;
  /** Le tatoueur à qui elle appartient — la carte le nomme. */
  tatoueurNom: string;
  tatoueurSlug: string;
  /** DE QUI VIENT LA PHOTO — « Artiste », « Salon », « Studio ».
      La carte de la mosaïque le dit dans l'image ; celle des favoris
      le disait pas (passe nº 142), et deux cartes identiques qui ne
      portent pas la même information se lisent comme deux objets
      différents. Les deux colonnes voyagent ensemble : c'est
      `libelleTypeFiche` qui en fait un mot. */
  typeFiche: string;
  etablissement: string;
  /** LE PORTRAIT DU TATOUEUR — la carte de la mosaïque le pose sous
      l'image ; celle des favoris ne le portait pas (nº 143-6A). */
  photoProfil: string | null;
};

/** UN TATOUEUR SUIVI, tel que la fenêtre le montre. */
export type TatoueurSuivi = {
  id: string;
  nom: string;
  slug: string;
  ville: string;
  region: string | null;
  pays: string | null;
  codePays: string | null;
  photoProfil: string | null;
};

export type ContenuFavoris = {
  photos: PhotoFavorite[];
  suivis: TatoueurSuivi[];
};

const VIDE: ContenuFavoris = { photos: [], suivis: [] };

/**
 * TOUT CE QUE CE COMPTE A GARDÉ. Rendu VIDE — jamais en erreur — si
 * les migrations nº 53 et 54 ne sont pas encore passées : la page
 * s'affiche alors avec son état vide, ce qui est la vérité.
 */
export async function lireLesFavoris(
  utilisateurId: string
): Promise<ContenuFavoris> {
  try {
    const supabase = await creerClientSupabaseServeur();

    /* ---- 1. LES LIGNES DE FAVORIS, la plus récente d'abord ---- */
    const [lignesPhotos, lignesSuivis] = await Promise.all([
      supabase
        .from("favoris_photos")
        .select("photo_id, cree_le")
        .eq("utilisateur_id", utilisateurId)
        .order("cree_le", { ascending: false }),
      supabase
        .from("tatoueurs_suivis")
        .select("tatoueur_id, cree_le")
        .eq("utilisateur_id", utilisateurId)
        .order("cree_le", { ascending: false }),
    ]);

    const idsPhotos = (lignesPhotos.data ?? []).map(
      (ligne) => ligne.photo_id as string
    );
    const idsSuivis = (lignesSuivis.data ?? []).map(
      (ligne) => ligne.tatoueur_id as string
    );
    if (idsPhotos.length === 0 && idsSuivis.length === 0) return VIDE;

    /* ---- 2. LES PHOTOS, puis LES FICHES qui les portent ---- */
    const photos =
      idsPhotos.length > 0
        ? await supabase
            .from("photos_tatoueur")
            .select("id, tatoueur_id, style, rendu, nature, url, miniature")
            .in("id", idsPhotos)
        : { data: [], error: null };

    type LignePhoto = {
      id: string;
      tatoueur_id: string;
      style: string;
      rendu: string | null;
      nature?: string | null;
      url: string;
      miniature: string | null;
    };
    const brutes = (photos.error ? [] : (photos.data ?? [])) as unknown as
      LignePhoto[];

    //  TOUTES LES FICHES CONCERNÉES — celles des photos ET celles
    //  qu'on suit, en UNE lecture. Publiées seulement.
    const idsFiches = [
      ...new Set([...brutes.map((p) => p.tatoueur_id), ...idsSuivis]),
    ];
    const fiches =
      idsFiches.length > 0
        ? await supabase
            .from("tatoueurs")
            .select(
              "id, nom, slug, ville_nom, region, pays, code_pays, photo_profil, " +
                //  LE BADGE DE LA CARTE (passe nº 142) — les deux
                //  colonnes que `libelleTypeFiche` croise.
                "type_fiche, etablissement"
            )
            .in("id", idsFiches)
            .eq("publie", true)
        : { data: [], error: null };

    type LigneFiche = {
      id: string;
      nom: string;
      slug: string;
      ville_nom: string | null;
      region: string | null;
      pays: string | null;
      code_pays: string | null;
      photo_profil: string | null;
      type_fiche: string | null;
      etablissement: string | null;
    };
    const parFiche = new Map<string, LigneFiche>();
    for (const ligne of (fiches.error ? [] : (fiches.data ?? [])) as unknown as
      LigneFiche[]) {
      parFiche.set(ligne.id, ligne);
    }

    /* ---- 3. REMISE DANS L'ORDRE DES FAVORIS ----
       ⚠️ C'EST `idsPhotos` QUI COMMANDE, pas la base : `in(...)` rend
       les lignes dans l'ordre qui l'arrange. L'ordre voulu est celui
       de l'enregistrement, le dernier d'abord — il vient de la
       première lecture, et on le rejoue ici. */
    const parPhoto = new Map(brutes.map((photo) => [photo.id, photo]));
    const listePhotos: PhotoFavorite[] = [];
    for (const id of idsPhotos) {
      const photo = parPhoto.get(id);
      if (!photo) continue;
      const fiche = parFiche.get(photo.tatoueur_id);
      if (!fiche) continue; // Fiche dépubliée : on n'affiche pas.
      listePhotos.push({
        id: photo.id,
        url: photo.url,
        miniature: photo.miniature || photo.url,
        style: photo.style,
        rendu: photo.rendu,
        nature: natureConnue(photo.nature),
        tatoueurNom: fiche.nom,
        tatoueurSlug: fiche.slug,
        //  LES MÊMES REPLIS QUE `normaliser` dans lib/tatoueurs : une
        //  fiche d'avant la migration nº 38 n'a ni l'une ni l'autre.
        typeFiche: fiche.type_fiche ?? "salon",
        etablissement: fiche.etablissement ?? "salon",
        photoProfil: fiche.photo_profil,
      });
    }

    const listeSuivis: TatoueurSuivi[] = [];
    for (const id of idsSuivis) {
      const fiche = parFiche.get(id);
      if (!fiche) continue;
      listeSuivis.push({
        id: fiche.id,
        nom: fiche.nom,
        slug: fiche.slug,
        ville: fiche.ville_nom ?? "",
        region: fiche.region,
        pays: fiche.pays,
        codePays: fiche.code_pays,
        photoProfil: fiche.photo_profil,
      });
    }

    return { photos: listePhotos, suivis: listeSuivis };
  } catch {
    //  Migrations pas encore passées, base injoignable : la page
    //  montre son état vide. Elle ne tombe jamais en erreur.
    return VIDE;
  }
}
