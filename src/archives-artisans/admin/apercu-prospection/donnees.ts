import {
  SEUILS_CONSOMMATION_GOOGLE,
  TYPES_APPEL_GOOGLE,
  type TypeAppelGoogle,
} from "@/config/roswel";
import type { IndicateursEnvoi } from "@/lib/prospection-quota";
import type { ConsommationGoogle } from "@/lib/journal-google";
import type {
  CommuneProspect,
  LigneProspect,
} from "@/components/TableauProspection";

/**
 * DONNÉES FICTIVES DE LA PROSPECTION (outil d'aperçu)
 * ---------------------------------------------------
 * Servent à /admin/apercu-prospection : vérifier la mise en page du
 * tableau SANS base de données. Aucune de ces entreprises n'existe.
 *
 * Le jeu couvre exprès tous les cas de figure de l'affichage :
 *  - un nom d'ENTREPRENEUR INDIVIDUEL avec enseigne entre parenthèses
 *    (« MAVIA DIAKITE (ASSAMARI) ») → la personne passe en petit sous
 *    le nom de société ;
 *  - une SOCIÉTÉ seule (« CLADINVEST CONSTRUCTION ») ;
 *  - deux noms qui SE RESSEMBLENT (« MOREAU CHAUFFAGE » et
 *    « Moreau Chauffage ») : un seul doit s'afficher ;
 *  - deux noms VRAIMENT différents : le second descend en petit ;
 *  - un nom très long, pour vérifier qu'il ne casse pas la colonne ;
 *  - adresse e-mail connue / absente (champ de saisie dans la case) ;
 *  - site internet et compte Instagram présents / absents ;
 *  - une entreprise de moins d'un an (« 0 ») et une sans date de
 *    création (« — ») ;
 *  - LE MÉTIER : affiché quand le code d'activité ne désigne qu'un
 *    métier (43.21A, 43.32A, 43.99C…), « — » quand il en couvre
 *    plusieurs (43.22A, 43.32B, 43.34Z) tant que Google n'a pas
 *    tranché — et affiché malgré l'ambiguïté quand il l'a fait ;
 *  - LES SEPT STATUTS, chacun avec sa couleur ;
 *  - les quatre états de la CASE À COCHER : cochable, sans e-mail,
 *    rebond / ne plus contacter, et séquence terminée (4 envois) ;
 *  - une relance EN RETARD et une relance qui approche ;
 *  - un CONTACT PAR FORMULAIRE déjà noté (la ligne montre la date, et
 *    plus le lien) sur une raison sociale interminable ;
 *  - une note d'avertissement (plusieurs fiches pour un même SIREN).
 */

/** Une date « il y a N années », pour que l'aperçu ne vieillisse pas. */
function ilYA(annees: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - annees);
  return date.toISOString().slice(0, 10);
}

/** Une date « il y a N mois » (entreprise toute jeune). */
function ilYAMois(mois: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - mois);
  return date.toISOString().slice(0, 10);
}

/** Un instant « il y a N jours », pour les dates d'envoi. */
function ilYAJours(jours: number): string {
  return new Date(Date.now() - jours * 24 * 3600 * 1000).toISOString();
}

export const PROSPECTS_APERCU: LigneProspect[] = [
  {
    id: "apercu-1",
    code_naf: "4322A", // ambigu, MAIS Google a tranché → affiché
    metier_confirme: true,
    // Entrepreneur individuel : personne + enseigne
    raison_sociale: "MAVIA DIAKITE (ASSAMARI)",
    nom_commercial: null,
    ville_nom: "Écully",
    ville_code_postal: "69130",
    siren: "812345678",
    date_creation_entreprise: ilYA(18),
    email: "contact@assamari.example",
    site_internet: "https://www.assamari.example/contact",
    lien_instagram: "https://www.instagram.com/assamari.plomberie/",
    metiers: ["plombier", "chauffagiste"],
    statut: "non_contacte",
    nombre_envois: 0,
    premier_envoi_le: null,
    dernier_envoi_le: null,
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: null,
  },
  {
    id: "apercu-2",
    code_naf: null, // aucun code : « — »
    raison_sociale: "CLADINVEST CONSTRUCTION",
    nom_commercial: null,
    ville_nom: "Écully",
    ville_code_postal: "69130",
    siren: "798452136",
    date_creation_entreprise: ilYA(12),
    email: null, // → champ de saisie, et case à cocher désactivée
    site_internet: "https://cladinvest-construction.example",
    lien_instagram: null,
    metiers: [],
    statut: "email_a_trouver",
    nombre_envois: 0,
    premier_envoi_le: null,
    dernier_envoi_le: null,
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: null,
  },
  {
    id: "apercu-3",
    code_naf: "4322B", // chauffagiste seul → affiché
    raison_sociale:
      "SARL BERNARD ET FILS INSTALLATIONS SANITAIRES ET THERMIQUES DU RHÔNE (BERNARD & FILS)",
    nom_commercial: null,
    ville_nom: "Écully",
    ville_code_postal: "69130",
    siren: "884569721",
    date_creation_entreprise: ilYA(31),
    email: null, // ni adresse, ni site : tout est à chercher à la main
    site_internet: null,
    lien_instagram: null,
    metiers: ["chauffagiste"],
    statut: "email_a_trouver",
    nombre_envois: 0,
    premier_envoi_le: null,
    dernier_envoi_le: null,
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: null,
  },
  {
    id: "apercu-4",
    code_naf: "4322A", // eau et gaz : AMBIGU → « — »
    raison_sociale: "AQUA SERVICES LYON OUEST",
    // Un nom commercial VRAIMENT différent : il descend en petit.
    nom_commercial: "Plomberie du Point du Jour",
    ville_nom: "Écully",
    ville_code_postal: "69130",
    siren: "903124785",
    date_creation_entreprise: ilYAMois(7), // → « 0 »
    email: "bonjour@aqua-services.example",
    site_internet: null,
    lien_instagram: null,
    metiers: ["plombier"],
    statut: "relance_en_cours",
    // Premier contact il y a 9 jours : la relance J+7 est EN RETARD.
    nombre_envois: 1,
    premier_envoi_le: ilYAJours(9),
    dernier_envoi_le: ilYAJours(9),
    prochain_envoi_le: null, // → déduit : J+7, donc dépassé
    contact_formulaire_le: null,
    notes_admin: null,
  },
  {
    id: "apercu-5",
    code_naf: "4322B", // chauffagiste seul → affiché
    raison_sociale: "NICOLAS MOREAU (MOREAU CHAUFFAGE)",
    nom_commercial: "Moreau Chauffage",
    ville_nom: "Villeurbanne",
    ville_code_postal: "69100",
    siren: "521489637",
    date_creation_entreprise: ilYA(9),
    email: "n.moreau@moreau-chauffage.example",
    site_internet: "https://moreau-chauffage.example",
    lien_instagram: "https://instagram.com/moreau.chauffage",
    metiers: ["chauffagiste"],
    statut: "reponse_recue",
    nombre_envois: 2,
    premier_envoi_le: ilYAJours(11),
    dernier_envoi_le: ilYAJours(4),
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: "A répondu : intéressé, rappeler après les congés.",
  },
  {
    id: "apercu-6",
    code_naf: "4321A", // électricité : un seul métier → affiché
    raison_sociale: "ELEC PRESQU'ÎLE",
    nom_commercial: "Élec'Presqu'île",
    ville_nom: "Lyon",
    ville_code_postal: "69002",
    siren: "812365479",
    date_creation_entreprise: ilYA(16),
    email: "contact@elec-presquile.example",
    site_internet: null,
    lien_instagram: null,
    metiers: ["electricien"],
    statut: "compte_cree",
    nombre_envois: 3,
    premier_envoi_le: ilYAJours(20),
    dernier_envoi_le: ilYAJours(6),
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: null,
  },
  {
    id: "apercu-7",
    code_naf: "4332B", // serrurier OU menuisier : AMBIGU → « — »
    raison_sociale: "DUPONT INSTALLATIONS",
    nom_commercial: null,
    ville_nom: "Écully",
    ville_code_postal: "69130",
    siren: "452178963",
    date_creation_entreprise: ilYA(4),
    email: "contact@dupont-installations.example",
    site_internet: null,
    lien_instagram: null,
    metiers: ["serrurier", "menuisier"],
    // LE CAS À ARBITRER : la ligne doit se distinguer visuellement.
    statut: "non_contacte",
    nombre_envois: 0,
    premier_envoi_le: null,
    dernier_envoi_le: null,
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin:
      "⚠ 2 fiches partagent ce SIREN (Dupont Installations, Dupont Plomberie) : rattachement à faire à la main.",
  },
  {
    id: "apercu-8",
    code_naf: null, // aucun code exploitable
    raison_sociale: "THERMIQUE DU VAL",
    nom_commercial: null,
    ville_nom: "Villeurbanne",
    ville_code_postal: "69100",
    siren: "915002784",
    date_creation_entreprise: null, // → ancienneté « — »
    email: "contact@thermique-du-val.example",
    site_internet: null,
    lien_instagram: null,
    metiers: [], // → « — » dans la colonne Métier
    statut: "rebond",
    nombre_envois: 1,
    premier_envoi_le: ilYAJours(5),
    dernier_envoi_le: ilYAJours(5),
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: "Adresse rejetée par le serveur du destinataire.",
  },
  {
    id: "apercu-9",
    code_naf: "4334Z", // peintre OU vitrier : AMBIGU → « — »
    raison_sociale: "SANITAIRE EXPRESS 69",
    nom_commercial: null,
    ville_nom: "Écully",
    ville_code_postal: "69130",
    siren: "902113447",
    date_creation_entreprise: ilYA(2),
    email: "contact@sanitaire-express.example",
    site_internet: "https://www.sanitaire-express.example",
    lien_instagram: null,
    metiers: ["peintre", "vitrier"],
    statut: "ne_plus_contacter",
    nombre_envois: 2,
    premier_envoi_le: ilYAJours(18),
    dernier_envoi_le: ilYAJours(11),
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: "Désinscription demandée le 3 juillet.",
  },
  {
    id: "apercu-10",
    code_naf: "4399C", // maçonnerie : un seul métier → affiché
    // SÉQUENCE TERMINÉE : ligne grisée, case à cocher désactivée.
    raison_sociale: "TOITURE DU RHÔNE",
    nom_commercial: null,
    ville_nom: "Villeurbanne",
    ville_code_postal: "69100",
    siren: "784512369",
    date_creation_entreprise: ilYA(23),
    email: "contact@toiture-du-rhone.example",
    site_internet: "https://toiture-du-rhone.example",
    lien_instagram: null,
    metiers: ["couvreur"],
    statut: "relance_en_cours",
    nombre_envois: 4, // = NOMBRE_ENVOIS_MAXIMUM : plus rien ne part
    premier_envoi_le: ilYAJours(34),
    dernier_envoi_le: ilYAJours(4),
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    notes_admin: null,
  },
  {
    id: "apercu-11",
    code_naf: "4332A", // menuiserie bois : un seul métier → affiché
    // RELANCE QUI APPROCHE (dans 3 jours), pas encore due.
    raison_sociale: "MENUISERIE DES MONTS D'OR",
    nom_commercial: null,
    ville_nom: "Écully",
    ville_code_postal: "69130",
    siren: "651239874",
    date_creation_entreprise: ilYA(7),
    email: "atelier@menuiserie-monts-dor.example",
    site_internet: null,
    lien_instagram: "https://www.instagram.com/menuiserie.montsdor/",
    metiers: ["menuisier"],
    statut: "relance_en_cours",
    nombre_envois: 1,
    premier_envoi_le: ilYAJours(4),
    dernier_envoi_le: ilYAJours(4),
    prochain_envoi_le: null, // → déduit : J+7, donc dans 3 jours
    contact_formulaire_le: null,
    notes_admin: null,
  },
  {
    id: "apercu-12",
    code_naf: "4321A", // électricité : un seul métier → affiché
    // DEUX CAS EN UN :
    //  - la RAISON SOCIALE INTERMINABLE, qui ne doit plus étirer la
    //    colonne Société (deux lignes, puis coupure et infobulle) ;
    //  - un CONTACT PAR FORMULAIRE DÉJÀ NOTÉ, passé le délai
    //    d'annulation : la ligne n'affiche plus qu'une date.
    raison_sociale:
      "SOCIETE ELECTRICITE BATIMENT TRAVAUX PUBLIC INFORMATIQUE NETTOYAGE LYONNAIS",
    nom_commercial: null,
    ville_nom: "Lyon",
    ville_code_postal: "69008",
    siren: "443128756",
    date_creation_entreprise: ilYA(6),
    email: null, // pas d'adresse : c'est le formulaire de son site
    site_internet: "https://www.sebtpin-lyon.example/contact",
    lien_instagram: null,
    metiers: ["electricien"],
    statut: "relance_en_cours",
    nombre_envois: 1,
    premier_envoi_le: ilYAJours(2),
    dernier_envoi_le: ilYAJours(2),
    prochain_envoi_le: null, // → déduit : J+7, donc dans 5 jours
    contact_formulaire_le: ilYAJours(2),
    notes_admin: null,
  },
];

export const COMMUNES_APERCU: CommuneProspect[] = [
  { code_insee: "69081", nom: "Écully", nombre: 6 },
  { code_insee: "69266", nom: "Villeurbanne", nombre: 3 },
  { code_insee: "69123", nom: "Lyon", nombre: 1 },
];

/**
 * DES INDICATEURS FICTIFS, mais crédibles.
 * En vrai (moteur d'envoi absent, journal vide), les quatre chiffres
 * sont à zéro : ici on les remplit pour VOIR la mise en page — le
 * rapport envoyés/plafond, la semaine de montée en charge, le vert du
 * taux de plainte et l'orange du restant.
 */
export const INDICATEURS_APERCU: IndicateursEnvoi = {
  fenetreHeures: 24,
  tauxPlainte: 0,
  plaintes: 0,
  seuilAlerte: 0.001,
  seuilCritique: 0.003,
  niveauPlainte: "bon",
  envoyes: 12,
  plafond: 20,
  semaine: 3,
  enCroisiere: false,
  restant: 8,
  formulaires: 3,
  journalManquant: false,
};

/**
 * Combien de prospects n'ont pas encore de fiche Google, pour le
 * libellé du bouton. Les lignes fictives ne portent pas d'identifiant
 * Google : ce nombre est donc inventé lui aussi, comme tout le reste
 * de cette page de démonstration.
 */
export const SANS_FICHE_GOOGLE_APERCU = 6;

/**
 * UNE CONSOMMATION GOOGLE FICTIVE, mais parlante : la recherche est
 * tranquille (2 % de sa franchise), la lecture des avis approche des
 * 90 % de la sienne — c'est exactement le cas où le rappel doit
 * passer au rouge et se faire remarquer.
 */
export const CONSOMMATION_GOOGLE_APERCU: ConsommationGoogle = (() => {
  const detail = (
    cle: TypeAppelGoogle,
    appels: number,
    parOutil: Array<{ outil: string; label: string; appels: number }>
  ) => {
    const reglage = TYPES_APPEL_GOOGLE[cle];
    const part = appels / reglage.franchiseMensuelle;
    return {
      cle,
      label: reglage.label,
      palier: reglage.palier as string,
      champs: reglage.champs,
      aQuoiCaSert: reglage.aQuoiCaSert,
      appels,
      franchise: reglage.franchiseMensuelle,
      part,
      niveau:
        part >= 1
          ? ("depasse" as const)
          : part >= SEUILS_CONSOMMATION_GOOGLE.critique
            ? ("critique" as const)
            : part >= SEUILS_CONSOMMATION_GOOGLE.attention
              ? ("attention" as const)
              : ("bon" as const),
      coutUnitaireEuro: reglage.coutUnitaireEuro,
      coutDepassementEuro:
        Math.max(0, appels - reglage.franchiseMensuelle) *
        reglage.coutUnitaireEuro,
      parOutil,
    };
  };

  const types = [
    detail("recherche", 118, [
      { outil: "google-prospects", label: "Recherche de fiches (prospection)", appels: 118 },
    ]),
    detail("recherche_avis", 12, [
      { outil: "avis-google", label: "Rafraîchissement manuel", appels: 12 },
    ]),
    detail("details_avis", 905, [
      { outil: "cron-avis-google", label: "Rafraîchissement automatique", appels: 826 },
      { outil: "google-prospects", label: "Recherche de fiches (prospection)", appels: 71 },
      { outil: "avis-google", label: "Rafraîchissement manuel", appels: 8 },
    ]),
  ];

  return {
    journalPresent: true,
    probleme: null,
    moisEnCours: "aperçu",
    premierAppelLe: null,
    types,
    historique: [],
    plusTendu: types.reduce((pire, t) => (t.part > pire.part ? t : pire)),
    echecs: 0,
  };
})();
