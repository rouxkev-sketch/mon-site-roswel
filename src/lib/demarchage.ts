/**
 * LE DÉMARCHAGE — le vocabulaire, les statuts, et le message
 * ============================================================
 * Personne ne remplit un formulaire pour un site inconnu et vide. On
 * prépare donc des portfolios à partir de ce qui est public, on les
 * met en ligne, et on écrit au tatoueur : « c'est prêt — tu le
 * récupères, ou tu le fais retirer ».
 *
 * CE FICHIER NE TOUCHE NI À LA BASE NI AU RÉSEAU. Il ne contient que
 * des règles pures : le mot de chaque statut, le délai au bout duquel
 * une ligne quitte le tableau, et la RÉDACTION du message. Il est donc
 * lisible des deux côtés (serveur et navigateur) et vérifiable sans
 * rien monter.
 *
 * ⚠️ LE JETON, LUI, N'EST PAS ICI (voir l'API du démarchage) : il se
 * tire avec `crypto.randomBytes`, qui n'existe que côté serveur. Un
 * jeton fabriqué dans le navigateur serait un jeton que le navigateur
 * sait fabriquer.
 */

/** Les trois états d'un envoi. « À envoyer » n'en est pas un : c'est
    l'ABSENCE d'envoi — une fiche qu'on n'a encore écrite à personne. */
export type StatutDemarchage = "envoye" | "compte_cree" | "supprime";

/** L'état d'une LIGNE du tableau, envois et fiches vierges confondus. */
export type EtatLigne = "a_envoyer" | StatutDemarchage;

export const LIBELLE_ETAT_DEMARCHAGE: Record<EtatLigne, string> = {
  a_envoyer: "À envoyer",
  envoye: "Envoyé",
  compte_cree: "Compte créé",
  supprime: "Supprimé",
};

/**
 * LA COULEUR DE CHAQUE ÉTAT (charte) : le vert dit « c'est arrivé »
 * — un compte créé est exactement ce qu'on cherchait ; le rose
 * marque l'état d'une fiche en cours (elle attend une réponse) ; le
 * rouge dit un retrait. « À envoyer » n'est pas un événement : il
 * reste neutre.
 */
export const COULEUR_ETAT_DEMARCHAGE: Record<EtatLigne, string> = {
  a_envoyer: "bg-sombre-texte-doux",
  envoye: "bg-primaire",
  compte_cree: "bg-[#34D399]",
  supprime: "bg-erreur",
};

/** COMBIEN DE TEMPS UNE LIGNE RESTE APRÈS SA FIN.
    Un compte créé, c'est fini : la ligne a une semaine pour être vue,
    puis elle s'en va. Une suppression garde trente jours — le temps
    exact pendant lequel le tatoueur peut encore revenir sur sa
    décision, et donc le temps pendant lequel l'administrateur peut
    avoir besoin de restaurer la fiche. */
export const JOURS_APRES_RATTACHEMENT = 7;
export const JOURS_APRES_SUPPRESSION = 30;

/** Le type d'une fiche, tel que le tableau et le message le disent. */
export type TypeFiche = "artiste" | "studio" | "salon";

export const LIBELLE_TYPE_FICHE: Record<TypeFiche, string> = {
  artiste: "Artiste",
  studio: "Studio",
  salon: "Salon",
};

/**
 * LE TYPE D'UNE FICHE, tel qu'il vit en base — deux colonnes pour
 * trois mots. `type_fiche` distingue l'artiste du lieu ;
 * `etablissement` distingue, PARMI les lieux, le studio privé du
 * salon. La règle est écrite ici une fois pour toutes : le tableau,
 * le message et l'API disent forcément la même chose.
 */
export function typeDeLaFiche(f: {
  type_fiche?: string | null;
  etablissement?: string | null;
}): TypeFiche {
  if ((f.type_fiche ?? "salon") === "artiste") return "artiste";
  return (f.etablissement ?? "salon") === "prive" ? "studio" : "salon";
}

/** Une fiche telle que le message a besoin de la connaître. */
export type FicheDemarchee = {
  nom: string;
  slug: string | null;
  type: TypeFiche;
};

/**
 * LE MESSAGE DE DÉMARCHAGE — écrit par le site, adapté aux fiches
 * =================================================================
 * Il part en MESSAGE PRIVÉ INSTAGRAM : c'est ce registre-là, et pas
 * un autre. Court, direct, tutoyé, sans formule d'usage et sans
 * paragraphe de présentation — on a quelques secondes avant que le
 * pouce défile.
 *
 * TROIS CHOSES, DANS CET ORDRE, PARCE QUE C'EST L'ORDRE DES
 * QUESTIONS QU'ON SE POSE EN LE LISANT :
 *  1. qu'est-ce que c'est, et qu'est-ce qui existe déjà (le lien de
 *     chaque fiche — on peut vérifier avant de répondre) ;
 *  2. comment le récupérer (LE lien de rattachement) ;
 *  3. comment s'en débarrasser — dit clairement, et par le MÊME lien.
 *     Un démarchage qui cache la sortie se lit comme un piège.
 *
 * IL S'ADAPTE : un artiste seul ne se démarche pas comme un salon à
 * trois fiches. Le nombre, le mot (« portfolio », « la page de ton
 * salon »), la liste à puces et les accords suivent ce qu'on a coché.
 *
 * ⚠️ LES LIENS PORTENT LE VRAI DOMAINE. `adresseDuSite()` est passée
 * en argument par l'appelant : cette fonction n'invente aucune
 * adresse, et ne peut donc pas écrire « localhost » dans un message
 * qu'on colle chez quelqu'un.
 */
export function messageDemarchage(
  fiches: FicheDemarchee[],
  lienRattachement: string,
  adresse: string
): string {
  if (fiches.length === 0) return "";

  const plusieurs = fiches.length > 1;
  //  À QUI ON PARLE : le nom de la PREMIÈRE fiche cochée. Pour un
  //  salon à plusieurs fiches, c'est le nom du salon ; pour un
  //  artiste, le sien. Dans les deux cas, c'est le nom sous lequel il
  //  se reconnaît.
  const destinataire = fiches[0].nom;

  const lienFiche = (f: FicheDemarchee) =>
    f.slug ? `${adresse}/tatoueur/${f.slug}` : "(adresse en préparation)";

  //  LE MOT JUSTE POUR CE QU'ON A PRÉPARÉ. Un artiste a un
  //  « portfolio » ; un salon et un studio ont une « page » — leur
  //  portfolio, c'est celui de leurs artistes.
  const chose = plusieurs
    ? `${fiches.length} pages`
    : fiches[0].type === "artiste"
      ? "un portfolio"
      : fiches[0].type === "studio"
        ? "la page de ton studio"
        : "la page de ton salon";

  const accord = plusieurs ? "elles sont" : "il est";
  const leur = plusieurs ? "Elles sont à toi" : "Il est à toi";
  const surQuoi = plusieurs
    ? `sur les ${fiches.length}`
    : "dessus";
  const lesRetirer = plusieurs ? "les retirer" : "le retirer";
  const lesSupprimer = plusieurs ? "les supprimer" : "le supprimer";

  //  LA LISTE. Une seule fiche : son lien sur sa propre ligne, rien
  //  de plus. Plusieurs : une puce par fiche, avec son nom — sans
  //  quoi on ne sait pas laquelle est laquelle.
  const liste = plusieurs
    ? fiches.map((f) => `• ${f.nom} — ${lienFiche(f)}`).join("\n")
    : lienFiche(fiches[0]);

  return [
    `Salut ${destinataire} 👋`,
    "",
    "Je lance YokoFolio, un annuaire de tatoueurs classés par style.",
    "",
    `Je t'ai préparé ${chose} à partir de ce qui est public sur ton compte, ${accord} déjà en ligne :`,
    liste,
    "",
    `${leur} si tu ${plusieurs ? "les" : "le"} veux : ce lien te donne la main ${surQuoi} (modifier, ajouter des photos, ou ${lesSupprimer}).`,
    lienRattachement,
    "",
    `C'est gratuit et sans engagement. Si tu préfères ne pas y figurer, le même lien te permet de ${lesRetirer}.`,
  ].join("\n");
}

/** L'adresse publique d'un lien de rattachement — une seule écriture,
    partagée par le message, le tableau et la page elle-même. */
export function lienDeRattachement(adresse: string, jeton: string): string {
  return `${adresse}/rejoindre/${jeton}`;
}
