/**
 * VÉRIFICATION ANTI-ROBOTS CÔTÉ SERVEUR (Cloudflare Turnstile)
 * ------------------------------------------------------------
 * Le composant `ComposantCaptcha` (navigateur) produit un jeton ;
 * cette fonction le valide auprès de Cloudflare depuis le serveur.
 *
 * Tant que la clé SECRÈTE `TURNSTILE_SECRET_KEY` n'est pas
 * renseignée dans `.env.local`, la vérification est CONSIDÉRÉE
 * COMME RÉUSSIE : le site fonctionne exactement comme avant en
 * développement (même philosophie que le composant, qui ne s'affiche
 * pas sans la clé « site »). Pour l'activer : renseigner la clé
 * « secret » Turnstile puis redémarrer `npm run dev`.
 */
export async function verifierTurnstile(
  jeton: string | null | undefined,
  ip?: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Pas de clé configurée → on ne bloque pas (dev / clé optionnelle).
  if (!secret) return true;

  // Clé configurée mais aucun jeton fourni → échec.
  if (!jeton) return false;

  try {
    const corps = new URLSearchParams();
    corps.set("secret", secret);
    corps.set("response", jeton);
    if (ip) corps.set("remoteip", ip);

    const reponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: corps,
      }
    );
    const resultat = (await reponse.json()) as { success?: boolean };
    return resultat.success === true;
  } catch {
    // Cloudflare injoignable : on refuse par prudence (la clé est active).
    return false;
  }
}
