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
      libelle: "At least 8 characters",
      ok: mdp.length >= LONGUEUR_MINIMALE,
    },
    {
      cle: "casse",
      libelle: "one small and one capital letter",
      ok: /[a-z]/.test(mdp) && /[A-Z]/.test(mdp),
    },
    { cle: "chiffre", libelle: "a number", ok: /\d/.test(mdp) },
    {
      cle: "symbole",
      libelle: "a symbol (!, ?, #…)",
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
  { libelle: "Too short", couleur: "#6E6E76", segments: 0 },
  { libelle: "Weak", couleur: "#D9534F", segments: 1 },
  { libelle: "Medium", couleur: "#E0A73C", segments: 2 },
  { libelle: "Strong", couleur: "#4CAF7D", segments: 3 },
] as const;

/** Les erreurs Supabase, traduites en français — jamais d'anglais
    brut sous les yeux de quelqu'un. */
export function messageErreurAuth(erreur: unknown): string {
  const brut =
    erreur instanceof Error ? erreur.message.toLowerCase() : String(erreur);
  if (brut.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (brut.includes("email not confirmed"))
    return "Your email isn't confirmed yet: open the email we sent you.";
  if (brut.includes("already registered") || brut.includes("already been registered"))
    return "An account already exists with this email.";
  if (brut.includes("password should be"))
    return `Your password must be at least ${LONGUEUR_MINIMALE} characters.`;
  if (brut.includes("same password") || brut.includes("should be different"))
    return "The new password must be different from the old one.";
  if (brut.includes("rate limit") || brut.includes("too many"))
    return "Too many attempts in a row. Wait a few minutes, then try again.";
  if (brut.includes("fetch") || brut.includes("network"))
    return "Can't reach the server. Check your connection, then try again.";
  return "Something went wrong. Try again.";
}
