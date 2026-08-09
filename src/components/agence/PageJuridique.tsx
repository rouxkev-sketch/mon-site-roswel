/**
 * LE GABARIT DES PAGES JURIDIQUES
 * ================================
 * Titre, date de mise à jour, et le corps du texte. Les trois pages
 * (confidentialité, mentions légales, contact) l'utilisent : elles se
 * ressemblent donc par construction, et le jour où le contenu arrive,
 * il n'y a qu'à remplacer les blocs.
 *
 * `prose-juridique` (globals.css) donne le rythme de lecture : une
 * ligne d'environ 70 caractères, des titres respirés, une hiérarchie
 * lisible — sans plugin de mise en forme.
 */
export function PageJuridique({
  titre,
  introduction,
  children,
}: {
  titre: string;
  introduction?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 pt-16 sm:pt-24">
      <article className="max-w-[70ch]">
        <h1 className="font-bold tracking-[-0.02em] leading-[1.1] text-[clamp(2rem,4.6vw,3rem)]">
          {titre}
        </h1>
        {introduction && (
          <p className="mt-6 text-[17px] leading-relaxed text-black/60">
            {introduction}
          </p>
        )}
        <div className="prose-juridique mt-10">{children}</div>
      </article>
    </main>
  );
}

/**
 * L'AVERTISSEMENT DE PAGE VIDE. Affiché tant que le contenu
 * définitif n'a pas été fourni : une page juridique vide SANS le dire
 * laisse croire qu'il n'y a rien à déclarer — ce qui, légalement,
 * n'est jamais le cas.
 */
export function ContenuAVenir({ quoi }: { quoi: string }) {
  return (
    <p className="rounded-2xl border border-primaire/30 bg-primaire-clair px-5 py-4 text-[15px] text-black/70">
      <span className="font-semibold">Contenu à venir.</span> {quoi} Ce texte
      doit être rédigé avant la mise en ligne du site.
    </p>
  );
}
