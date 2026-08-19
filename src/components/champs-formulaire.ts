/**
 * L'ÉCRITURE D'UN CHAMP DU FORMULAIRE — UNE SEULE, PARTAGÉE
 * ==================================================================
 * (§1, nº 266)
 *
 * Elle vivait dans `FormulaireFiche` ; le champ du nom d'un lieu, né
 * dans le bloc 1 (DeuxZonesLieu), en a besoin lui aussi. L'importer
 * depuis le formulaire aurait fermé un cercle — FormulaireFiche →
 * BlocModesExercice → DeuxZonesLieu → FormulaireFiche — et un cercle
 * d'imports se paie tôt ou tard par un module à moitié initialisé.
 * Elle est donc posée ICI, dans un fichier qui ne dépend de rien : les
 * deux la consomment, aucune ne la recopie.
 *
 * ⚠️ AUCUNE VALEUR N'A CHANGÉ à ce déménagement : c'est la chaîne de
 * la nº 112, au caractère près. La bordure reste à la charge de
 * l'appelant (`border-transparent` au repos, `border-erreur` sur un
 * manque) — c'est ce qui permet à un même champ d'être neutre ici et
 * signalé là.
 */
/**
 * §1 (nº 388) — LE FOND REJOINT CELUI DES AUTRES CHAMPS.
 * ------------------------------------------------------------------
 * IL PORTAIT `bg-sombre-eleve`, un cran plus SOMBRE que tous ses
 * voisins : la bio (ChampBio), Instagram (ChampLienVerifie) et le lien
 * libre (LienLibre) sont tous sur `bg-sombre-eleve-clair`. Le champ du
 * nom détonnait donc au milieu d'eux.
 * Le focus monte d'autant, à `bg-sombre-haut` — exactement ce que font
 * les trois autres. Aucune couleur inventée : ce sont leurs deux
 * valeurs, reprises telles quelles.
 */
export const CHAMP =
  "w-full min-h-[52px] rounded-xl border bg-sombre-eleve-clair px-4 text-base " +
  "text-sombre-texte placeholder:text-sombre-texte-doux outline-none " +
  "transition-colors focus:bg-sombre-haut";
