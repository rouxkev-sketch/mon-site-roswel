import type { Tatoueur } from "@/lib/tatoueurs";

/**
 * LA FICHE COMPLÈTE, DEMANDÉE À L'OUVERTURE DE LA FENÊTRE
 * ========================================================
 * Depuis la passe « performance », la mosaïque ne reçoit QU'UNE photo
 * par fiche — celle que la carte affiche. La fenêtre, elle, montre
 * tout le portfolio, les adresses et l'équipe : elle les demande au
 * moment où on l'ouvre, et pour cette fiche-là seulement.
 *
 * Le résultat est GARDÉ : rouvrir la même fiche ne redemande rien. Et
 * le survol la demande d'avance — quand le clic arrive, elle est déjà
 * là.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE (passe nº 143). Cette mécanique vivait
 * dans GrilleTatoueurs, pour la mosaïque seule. La page « Mes favoris »
 * ouvre désormais ses fiches DE LA MÊME FAÇON (§6B) : elle a besoin de
 * la même fonction — et surtout DU MÊME CACHE. Deux copies auraient
 * demandé deux fois la même fiche à la base, et se seraient
 * désynchronisées au premier changement.
 */
const fichesCompletes = new Map<string, Tatoueur>();
const demandesEnCours = new Map<string, Promise<Tatoueur | null>>();

/**
 * §1 (nº 745) — LA LECTURE IMMÉDIATE DU CACHE, SANS PROMESSE.
 * La fenêtre superposée veut savoir AU CLIC si la fiche complète est
 * déjà là (survol assez long, réouverture) : si oui, elle s'ouvre
 * directement complète — aucun habillage d'attente, aucun deux-temps.
 * Une promesse, même déjà résolue, arrive toujours un rendu trop tard.
 */
export function ficheCompleteImmediate(slug: string): Tatoueur | null {
  return fichesCompletes.get(slug) ?? null;
}

export function ficheComplete(slug: string): Promise<Tatoueur | null> {
  const deja = fichesCompletes.get(slug);
  if (deja) return Promise.resolve(deja);
  const enCours = demandesEnCours.get(slug);
  if (enCours) return enCours;
  const demande = fetch(`/api/tatoueur/${encodeURIComponent(slug)}`)
    .then((reponse) => (reponse.ok ? reponse.json() : null))
    .then((donnees: { tatoueur?: Tatoueur } | null) => {
      const fiche = donnees?.tatoueur ?? null;
      if (fiche) fichesCompletes.set(slug, fiche);
      return fiche;
    })
    .catch(() => null)
    .finally(() => demandesEnCours.delete(slug));
  demandesEnCours.set(slug, demande);
  return demande;
}
