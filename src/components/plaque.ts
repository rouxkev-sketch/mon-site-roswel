/**
 * ██ L'ÉCRITURE D'UNE PLAQUE — UNE SEULE, PARTAGÉE ██
 * ==================================================================
 * (§2, §3 et §4 nº 492 · §1 nº 493 · §2 nº 496 · §1 nº 497 ·
 *  DÉMÉNAGÉE ICI par la nº 502.)
 *
 * UNE PLAQUE, C'EST QUOI : un fond uni PERMANENT, quatre coins à
 * 12 px, aucun contour, un air intérieur ÉGAL sur les quatre côtés, et
 * un arrêt net aux marges de l'interface. C'est le dessin des membres
 * d'équipe d'un salon et des lieux d'une fiche d'artiste.
 * ⚠️ nº 844 — ELLE AVAIT UN TROISIÈME PORTEUR, LA RANGÉE DU PROFIL DE
 * LA VUE PHOTO AU DOIGT (nº 502) : ce bloc a été SUPPRIMÉ (décision du
 * propriétaire, il n'était plus affiché nulle part depuis la nº 841).
 * Ce fichier ne perd rien pour autant — il existe pour que deux
 * porteurs ne divergent pas, et il en reste deux.
 *
 * ⚠️ POURQUOI CE FICHIER EXISTE, ET C'EST LA RAISON DE
 * `lignes-profil.ts` À LA LETTRE : ces deux constantes vivaient dans
 * `BlocLieux`, sans être exportées. La nº 502 en a eu besoin depuis
 * `FicheTatoueur`, qui n'a rien à faire avec le bloc des lieux — et
 * recopier un dessin, c'est le condamner à diverger à la passe
 * suivante. Elles sont donc posées ICI, dans un fichier QUI NE DÉPEND
 * DE RIEN : tous les porteurs le consomment, aucun ne le recopie.
 *
 * ⚠️ AUCUNE VALEUR N'A CHANGÉ à ce déménagement : ce sont les chaînes
 * de la nº 497, au caractère près.
 *
 * ==================================================================
 * ⚠️⚠️ RÈGLE DU SITE, À TENIR PAR TOUTES LES PASSES QUI SUIVENT
 * (§1, nº 497) : DANS UNE PLAQUE, L'AIR INTÉRIEUR EST LE MÊME EN HAUT,
 * EN BAS, À GAUCHE ET À DROITE. Un seul nombre, sur les quatre côtés.
 * Une plaque n'est pas une ligne de texte : elle a une épaisseur, et
 * cette épaisseur ne se lit juste que si elle est constante tout
 * autour. Dès qu'un côté diffère, l'œil voit le contenu « collé »
 * quelque part, même quand tout est aligné au pixel.
 * D'où `p-3` — DOUZE partout, en UNE classe et non en deux : une seule
 * classe par propriété (piège nº 389), et surtout une seule valeur à
 * lire, donc impossible à désaccorder.
 *
 * ⚠️ LE FOND EST `bg-sombre-eleve`, ET IL Y EST REVENU (nº 524) APRÈS
 * L'ESSAI DE LA nº 523 — qui l'avait fait descendre d'un cran, à
 * `carte`. Le propriétaire a jugé à l'écran : trop sombre, les plaques
 * se fondaient dans la page. Tout ce que cet essai avait ajusté en
 * cascade est revenu avec lui : le survol et le rond du lieu.
 * ⚠️ CE QUE LA nº 523 AVAIT RAISON DE CORRIGER, ET QUI RESTE ACQUIS :
 * la note d'alors disait que `eleve` était le seul cran se détachant
 * des DEUX supports d'une plaque — la page et la fenêtre superposée —,
 * « un cran plus bas serait la couleur de la page ». C'ÉTAIT VRAI
 * quand elle a été écrite, et ça ne l'est plus : les nº 499 à 501 ont
 * donné à la fenêtre le fond de la PAGE, les deux supports sont donc
 * devenus le même. `carte` n'est donc pas invisible — il est
 * seulement trop discret, ce qui est un jugement de l'œil, pas une
 * contrainte de l'échelle. La différence compte pour qui voudra
 * rouvrir ce dossier.
 *
 * ⚠️ CE QUI SE POSE SUR UNE PLAQUE DOIT MONTER D'AUTANT : le rond d'un
 * LIEU SAISI À LA MAIN — un salon ou un studio sans fiche — porte une
 * icône par défaut, et il peint `bg-sombre-eleve` s'il n'a pas
 * d'ordre. Il disparaîtrait dans sa plaque. Ses porteurs lui passent
 * donc TROIS crans au-dessus (`bg-sombre-haut`), pour que le rond ET
 * son icône restent lisibles au repos comme au survol — voir la note
 * de `PhotoRonde` (nº 492).
 * ⚠️ UN MEMBRE D'ÉQUIPE, LUI, A TOUJOURS UNE PHOTO (précision du
 * propriétaire, nº 524) : son rond n'a pas d'état de repli, et il
 * n'existe aucune pastille d'initiales dans une plaque.
 *
 * ==================================================================
 * ██ LE NOM SUR UNE PLAQUE (nº 555) — SEIZE PIXELS, DEMI-GRAS ██
 * ------------------------------------------------------------------
 * CE FICHIER NE PORTE QUE LA BOÎTE, jamais le texte : les plaques
 * n'ont ni le même interligne ni la même façon de couper un nom long.
 * Il n'y a donc pas de constante à lire — mais il y a une RÈGLE, et
 * elle s'écrit ici parce que c'est ici qu'on vient quand on touche une
 * plaque :
 *
 *   LE NOM D'UNE PLAQUE VAUT 16 px ET `font-semibold`.
 *
 * SES PORTEURS, ET IL N'Y EN A PAS UN TROISIÈME :
 *  · `BlocLieux` — le nom d'un membre d'équipe ;
 *  · `BlocLieux` — le nom d'un lieu (`TroisLignesDuLieu`).
 * (Le troisième, la rangée du profil de la vue photo, est parti avec
 *  elle à la nº 844.)
 *
 * D'OÙ ELLE VIENT : le relevé de la nº 554 a trouvé DEUX graisses
 * pour deux plaques identiques (`font-medium` sur l'équipe,
 * `font-semibold` sur les lieux) et une fiche à DEUX rangs seulement
 * — le nom du tatoueur en 19-20 px, tout le reste en 15. La nº 555
 * réunit les graisses et donne aux noms le cran qui manquait.
 * ⚠️ CE QUI RESTE À 15 px, ET C'EST LA MOITIÉ DE LA RÈGLE : tout ce
 * qui N'EST PAS un nom — l'adresse sous un nom de lieu, les styles
 * d'un membre, la mention grise au-dessus de la plaque. Le cran de 16
 * appartient aux noms, et à eux seuls.
 */
export const ENCADRE_MEMBRE =
  "flex items-start gap-3.5 rounded-xl bg-sombre-eleve p-3";

/** La même plaque, cliquable : le fond monte d'un cran au survol, et
    l'appui le tient au doigt, où il n'y a pas de survol. */
export const ENCADRE_MEMBRE_CLIQUABLE =
  `group ${ENCADRE_MEMBRE} transition-colors ` +
  "hover:bg-sombre-eleve-clair active:bg-sombre-eleve-clair";

/**
 * ██ nº 753 — LA PLAQUE-INFO : CE QUI NE MÈNE NULLE PART ██
 * ==================================================================
 * LA RÈGLE, POSÉE PAR LE PROPRIÉTAIRE ET VALABLE PARTOUT : une plaque
 * SANS FICHE derrière — un salon ou un studio saisi à la main, un
 * guest hors site, et depuis cette passe les conventions et les villes
 * du mode « Autre » — ne s'habille plus comme une plaque cliquable.
 *  · PAS DE FOND — elle ne se détache pas, elle informe ;
 *  · PAS DE CHEVRON — on ne promet pas une page qui n'existe pas
 *    (c'était déjà la règle de la nº 496) ;
 *  · UN CONTOUR FIN, et c'est la nouveauté.
 *
 * ⚠️ LE CONTOUR EST UNE EXCEPTION ASSUMÉE À LA CHARTE. « Aucun encadré,
 * aucun contour » ouvre le bloc des lieux depuis la nº 222, et la
 * règle reste entière PARTOUT AILLEURS. Ici, le contour n'est pas une
 * décoration : c'est LE SIGNAL qui distingue l'information de
 * l'action. Sans lui, deux plaques au même endroit — l'une qui
 * s'ouvre, l'autre non — ne se distinguaient que par l'absence d'un
 * chevron, à 16 px du bord droit.
 *
 * ⚠️ LA TEINTE — `sombre-haut` (#3E4650), ET AUCUNE VALEUR NEUVE :
 * c'est EXACTEMENT la couleur du rond que porte cette plaque
 * (`classeFond="bg-sombre-haut"`, nº 524). Le contour et le rond
 * parlent donc d'une seule voix, et l'objet se lit d'un bloc. Sur le
 * fond de page (#0B0F14) comme sous la fenêtre superposée, il se voit
 * sans peser. LE PROPRIÉTAIRE TRANCHE À L'ŒIL : les deux voisins sont
 * `sombre-trait` (#2F353E, un cran plus discret) et `sombre-haut-clair`
 * (#4A525D, un cran plus marqué) — un seul mot à changer ici.
 *
 * ⚠️ L'AIR INTÉRIEUR RESTE `p-3` — LA RÈGLE DU §1 nº 497 EST TENUE :
 * DOUZE pixels sur les quatre côtés, en une seule classe. Le contour
 * s'ajoute PAR-DESSUS, et voici ce que ça donne, MESURÉ (banc nº 753,
 * colonne de 340 px) :
 *   · plaque cliquable — 76 px de haut, 12 px d'air ;
 *   · plaque-info      — 78 px de haut, 13 px d'air.
 * DEUX PIXELS DE PLUS, UN D'AIR OPTIQUE EN PLUS, et c'est le prix du
 * trait : `border` s'ajoute au rembourrage, il ne le rogne pas.
 * ⚠️ CE QUI COMPTE POUR L'ŒIL EST INTACT : la LARGEUR est la même
 * (340 px des deux côtés) et les bords gauche et droit s'alignent au
 * pixel — c'est ce qu'on lit dans une colonne. Les 32 px qui séparent
 * deux plaques (`gap-8`) rendent les 2 px de hauteur invisibles.
 * ⚠️ ON NE COMPENSE PAS en descendant le rembourrage à onze pixels :
 * ce serait une valeur hors de l'échelle du site pour rattraper un
 * pixel que personne ne voit, et la règle des quatre côtés égaux se
 * lirait moins bien.
 * ⚠️ ET LA VALEUR N'EST PAS ÉCRITE EN CLASSE, MÊME ICI : le scanner de
 * Tailwind v4 LIT LES COMMENTAIRES. La première rédaction de cette
 * note citait le rembourrage refusé sous sa forme de classe — la
 * feuille a gagné une règle pour une classe que personne n'emploie
 * (mesuré : +25 octets, +1 bloc). On nomme donc la valeur en toutes
 * lettres, jamais en classe.
 */
export const ENCADRE_PLAQUE_INFO =
  "flex items-start gap-3.5 rounded-xl border border-sombre-haut p-3";
