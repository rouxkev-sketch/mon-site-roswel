/**
 * ██ nº 814 — LA SECTION DES PAGES DE TEXTE LÉGAL, ÉCRITE UNE FOIS ██
 * ==================================================================
 * Elle vivait dans `legal/page.tsx` (nº 322 → nº 813) ; « Terms of
 * Use » (nº 814) a exactement la même robe — titre net, texte lisible,
 * marges généreuses, filet entre les sections. Un composant de page ne
 * s'importe pas depuis un `page.tsx` (Next n'y tolère que la page et
 * ses métadonnées) : la section est donc ICI, et les deux pages la
 * lisent. Aucune classe n'a changé.
 *
 * `id` (nº 814) : une ancre, pour que « Terms of Use » puisse mener
 * DROIT à la section DMCA ou à la vie privée de la page légale
 * (`/legal#dmca`, `/legal#privacy`), et que le lien de l'écran de
 * consentement Google puisse pointer une section.
 * `scroll-mt-24` : la barre fixe du site ne couvre pas le titre visé.
 */

/**
 * ██ nº 815 — LES LIENS DES PAGES LÉGALES SONT BLEUS ██
 * Ils étaient au rouge de la marque (`text-primaire`), que le
 * propriétaire trouve vif ; ils prennent LE BLEU DES LIENS D'ACTION DU
 * SITE — `sombre-lien`, celui de « Unlink » / « Link » (`PastilleAction`,
 * nº 803/811) — et son survol (`sombre-lien-clair`), plus le soulignement
 * au survol qu'ils avaient déjà. Une seule écriture pour /legal et
 * /terms (liens internes, ancres, adresses e-mail).
 */
export const CLASSE_LIEN_LEGAL =
  "text-sombre-lien hover:text-sombre-lien-clair hover:underline transition-colors";
export function SectionLegale({
  titre,
  id,
  children,
}: {
  titre: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="border-t border-sombre-bordure pt-7 first:border-0 first:pt-0 scroll-mt-24"
    >
      <h2 className="text-[clamp(1.05rem,2.2vw,1.25rem)] font-bold text-sombre-texte">
        {titre}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-sombre-texte-doux">
        {children}
      </div>
    </section>
  );
}
