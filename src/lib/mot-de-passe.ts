/**
 * LA FORCE D'UN MOT DE PASSE — une seule règle pour tout le site
 * ===============================================================
 * Écrite ICI, et pas dans un écran : l'inscription et la page
 * « Sécurité » doivent exiger EXACTEMENT la même chose, et
 * l'annoncer avec les mêmes mots. Deux jauges qui divergeraient
 * seraient pires que pas de jauge du tout.
 *
 * Quatre exigences, trois niveaux. Sous 8 caractères : bloqué, la
 * jauge le dit. Ensuite, chaque critère rempli la fait monter :
 * faible → moyen → fort.
 */

/** Le minimum ABSOLU : en dessous, rien n'est envoyé au serveur. */
export const LONGUEUR_MINIMALE = 8;

export function evaluerMotDePasse(mdp: string) {
  const criteres = [
    {
      cle: "longueur",
      libelle: "8 caractères au minimum",
      ok: mdp.length >= LONGUEUR_MINIMALE,
    },
    {
      cle: "casse",
      libelle: "une minuscule et une majuscule",
      ok: /[a-z]/.test(mdp) && /[A-Z]/.test(mdp),
    },
    { cle: "chiffre", libelle: "un chiffre", ok: /\d/.test(mdp) },
    {
      cle: "symbole",
      libelle: "un symbole (!, ?, #…)",
      ok: /[^A-Za-z0-9\s]/.test(mdp),
    },
  ];
  const remplis = criteres.filter((c) => c.ok).length;
  const niveau: 0 | 1 | 2 | 3 = !criteres[0].ok
    ? 0
    : remplis <= 2
      ? 1
      : remplis === 3
        ? 2
        : 3;
  return { criteres, niveau };
}

/** La jauge : libellé + couleur par niveau (0 = trop court). */
export const NIVEAUX_MOT_DE_PASSE = [
  { libelle: "Trop court", couleur: "#6E6E76", segments: 0 },
  { libelle: "Faible", couleur: "#D9534F", segments: 1 },
  { libelle: "Moyen", couleur: "#E0A73C", segments: 2 },
  { libelle: "Fort", couleur: "#4CAF7D", segments: 3 },
] as const;

/** Les erreurs Supabase, traduites en français — jamais d'anglais
    brut sous les yeux de quelqu'un. */
export function messageErreurAuth(erreur: unknown): string {
  const brut =
    erreur instanceof Error ? erreur.message.toLowerCase() : String(erreur);
  if (brut.includes("invalid login credentials"))
    return "E-mail ou mot de passe incorrect.";
  if (brut.includes("email not confirmed"))
    return "Ton adresse n'est pas encore confirmée : ouvre l'e-mail qui t'a été envoyé.";
  if (brut.includes("already registered") || brut.includes("already been registered"))
    return "Un compte existe déjà avec cette adresse.";
  if (brut.includes("password should be"))
    return `Le mot de passe doit faire au moins ${LONGUEUR_MINIMALE} caractères.`;
  if (brut.includes("same password") || brut.includes("should be different"))
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (brut.includes("rate limit") || brut.includes("too many"))
    return "Trop d'essais d'affilée. Attends quelques minutes, puis réessaie.";
  if (brut.includes("fetch") || brut.includes("network"))
    return "Impossible de joindre le serveur. Vérifie ta connexion, puis réessaie.";
  return "Quelque chose n'a pas marché. Réessaie.";
}
