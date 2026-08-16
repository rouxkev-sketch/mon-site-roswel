/**
 * CE QUI EST OUVERT DANS UN MENU, ET CE QUI SE VOIT
 * ==================================================================
 * (passe nº 317, §1 et §2-a)
 *
 * POURQUOI CES DEUX RÈGLES VIVENT ICI, ET PLUS DANS LE COMPOSANT.
 * Elles décident de ce que la personne voit en ouvrant un filtre —
 * c'est-à-dire de tout. Tant qu'elles vivaient au milieu du rendu de
 * `MenuDeroulant`, aucun banc ne pouvait les EXÉCUTER : on ne pouvait
 * que les relire, et relire n'a jamais attrapé le défaut du §1, qui a
 * vécu une passe entière sans se voir. Sorties d'ici, elles se jouent
 * sur des cas nommés — un menu à un groupe, un menu à deux, une valeur
 * vide, un sous-titre — sans ouvrir un navigateur.
 *
 * ⚠️ CE MODULE NE CONNAÎT AUCUN MOT DU PRODUIT : ni « Styles », ni
 * « ARTISTE », ni « Cultures du monde ». Il ne lit que la forme des
 * entrées. C'est ce qui lui permet de servir les trois menus du site
 * — le moteur, les favoris, les portfolios suivis — sans en
 * privilégier aucun.
 */

/** Ce que ces règles lisent d'une entrée de menu — et rien de plus. */
export type EntreeRepliable = {
  value: string;
  groupe?: string;
  sousGroupe?: string;
  /** §2 (nº 317) — cette sous-section est un SOUS-TITRE, pas une porte. */
  sousTitre?: boolean;
};

/**
 * §1 (nº 317) — CE QUI S'OUVRE À L'OUVERTURE : LE CHOIX COURANT, ET
 * RIEN D'AUTRE.
 * ------------------------------------------------------------------
 * LE DÉFAUT QUE CETTE RÈGLE CORRIGE, ET SA CAUSE EXACTE. Le menu des
 * portfolios suivis a une tête « Tous les styles » DONT LA VALEUR EST
 * VIDE — et l'état d'ouverture du filtre est, lui aussi, la valeur
 * vide. La recherche du « choix courant » trouvait donc cette tête,
 * en déduisait « le choix est dans le groupe Styles », et ouvrait ce
 * groupe tout seul à l'arrivée. L'onglet des favoris n'a jamais eu ce
 * comportement par pur hasard : ses têtes s'appellent « tatouage » et
 * « flash », aucune n'est vide, donc rien ne se trouvait.
 *
 * LA RÈGLE, ÉCRITE PLUTÔT QUE SUBIE : UNE VALEUR VIDE N'EST PAS UN
 * CHOIX, c'est l'absence de choix — et une absence de choix n'ouvre
 * rien. Dès qu'un vrai choix existe, le repli le retrouve exactement
 * comme avant, sa famille comprise.
 *
 * ⚠️ UN MÊME STYLE PEUT TENIR DEUX PLACES (nº 291) : « Japonais ·
 * Irezumi » se lit à sa lettre ET dans « Cultures du monde ». On
 * préfère donc l'entrée DE PREMIER NIVEAU — sans quoi le choisir dans
 * la liste alphabétique ouvrirait la famille au rendez-vous suivant.
 */
export function replieALOuverture(
  options: ReadonlyArray<EntreeRepliable>,
  valeur: string
): { groupe: string | null; sousGroupe: string | null } {
  if (!valeur) return { groupe: null, sousGroupe: null };
  const choisie =
    options.find((option) => option.value === valeur && !option.sousGroupe) ??
    options.find((option) => option.value === valeur);
  return {
    groupe: choisie?.groupe ?? null,
    sousGroupe: choisie?.sousGroupe ?? null,
  };
}

/**
 * §2-a (nº 317) — LES SOUS-SECTIONS QUI NE SE PLIENT PAS.
 * ------------------------------------------------------------------
 * « ARTISTE » et « LIEU » ne sont pas des portes : ils ANNONCENT. La
 * liste de leurs noms se lit sur les entrées elles-mêmes, jamais
 * écrite à la main — et « Cultures du monde », qui ne porte pas le
 * drapeau, garde sa porte entière.
 */
export function sousTitresDe(
  options: ReadonlyArray<EntreeRepliable>
): Set<string> {
  return new Set(
    options
      .filter((option) => option.sousTitre && option.sousGroupe)
      .map((option) => option.sousGroupe as string)
  );
}

/**
 * §2 (nº 304) — UN SEUL GROUPE N'A PAS DE PORTE.
 * ------------------------------------------------------------------
 * Le pliage PAR GROUPE ne joue qu'à partir de DEUX groupes. À un seul,
 * l'en-tête redevient une étiquette (pas de flèche, rien à toucher) et
 * ses options sont visibles d'emblée : une porte qui ne mène qu'à une
 * pièce n'est pas une porte.
 * ⚠️ ELLE NE TOUCHE PAS AUX SOUS-SECTIONS : « Cultures du monde »
 * garde la sienne, elle en est une vraie.
 */
export function aDesPortesDeGroupe(
  options: ReadonlyArray<EntreeRepliable>,
  repliable: boolean
): boolean {
  return (
    repliable &&
    new Set(options.map((option) => option.groupe).filter(Boolean)).size > 1
  );
}

/**
 * CETTE OPTION SE VOIT-ELLE ? Toujours, sauf si son groupe est replié
 * — ou sa sous-section, quand elle en a une VRAIE. Un menu non
 * repliable ne replie rien.
 */
export function optionSeVoit(
  option: EntreeRepliable,
  etat: {
    repliable: boolean;
    portesDeGroupe: boolean;
    groupeDeplie: string | null;
    sousGroupeDeplie: string | null;
    sousTitres: Set<string>;
  }
): boolean {
  if (!etat.repliable) return true;
  //  §2 (nº 304) — sans portes de groupe, le groupe ne cache rien.
  if (
    etat.portesDeGroupe &&
    option.groupe &&
    option.groupe !== etat.groupeDeplie
  ) {
    return false;
  }
  if (!option.sousGroupe) return true;
  //  §2-a (nº 317) — sous un SOUS-TITRE, rien ne se cache : il n'y a
  //  pas de porte à ouvrir, donc rien à tenir fermé.
  if (etat.sousTitres.has(option.sousGroupe)) return true;
  return option.sousGroupe === etat.sousGroupeDeplie;
}
