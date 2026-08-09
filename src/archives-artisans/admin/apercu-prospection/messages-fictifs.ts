import type { Apercu } from "@/components/ApercuEnvoiProspection";
import {
  construireMessage,
  plageDuJour,
  type MessagePret,
  type ProspectEnvoi,
} from "@/lib/prospection-envoi";

/**
 * L'ÉCRAN D'APERÇU AVANT ENVOI, AVEC DES DONNÉES FICTIVES
 * ========================================================
 * Sur /admin/apercu-prospection, la fenêtre « Préparer l'envoi »
 * n'interroge NI la base NI l'API : les messages sont fabriqués ici,
 * à partir d'entreprises inventées.
 *
 * Ce n'est pas une maquette pour autant : les textes passent par le
 * VRAI `construireMessage`, donc par les vrais gabarits de
 * src/config/roswel.ts et le vrai calcul de score. Une étiquette
 * {score} oubliée dans un gabarit se verrait ici, sans qu'un seul
 * artisan reçoive quoi que ce soit.
 */

/** Un prospect fictif complet, pour n'écrire que ce qui change. */
function prospect(modif: Partial<ProspectEnvoi>): ProspectEnvoi {
  return {
    id: "fictif",
    raison_sociale: "ENTREPRISE FICTIVE",
    nom_commercial: null,
    metiers: ["plombier"],
    ville_nom: "Écully",
    note_google: 4.7,
    nombre_avis_google: 24,
    date_creation_entreprise: "2011-05-12",
    email: "contact@exemple.example",
    site_internet: null,
    jeton_desinscription: "jeton-de-demonstration",
    statut: "non_contacte",
    nombre_envois: 0,
    premier_envoi_le: null,
    dernier_envoi_le: null,
    prochain_envoi_le: null,
    contact_formulaire_le: null,
    desinscrit_le: null,
    ...modif,
  };
}

function message(modif: Partial<ProspectEnvoi>): MessagePret {
  // `construireMessage` ne rend null que passé le 4e envoi ; les
  // exemples ci-dessous restent tous dans la séquence.
  return construireMessage(prospect(modif)) as MessagePret;
}

export function apercuEnvoiFictif(): Apercu {
  const maintenant = new Date();
  const { debut, fin } = plageDuJour(maintenant);
  const horsPlage = maintenant < debut || maintenant >= fin;

  return {
    ok: true,
    automatiques: [
      message({
        id: "apercu-1",
        raison_sociale: "MAVIA DIAKITE (ASSAMARI)",
        email: "contact@assamari.example",
        note_google: 4.8,
        nombre_avis_google: 37,
        date_creation_entreprise: "2008-03-01",
      }),
      // Une RELANCE, pour voir le second gabarit dans le même écran.
      message({
        id: "apercu-4",
        raison_sociale: "AQUA SERVICES LYON OUEST",
        nom_commercial: "Plomberie du Point du Jour",
        email: "bonjour@aqua-services.example",
        nombre_envois: 1,
        premier_envoi_le: new Date(
          maintenant.getTime() - 9 * 24 * 3600 * 1000
        ).toISOString(),
        note_google: 4.2,
        nombre_avis_google: 11,
        date_creation_entreprise: "2025-12-01",
      }),
    ],
    aLaMain: [
      message({
        id: "apercu-3",
        raison_sociale:
          "SARL BERNARD ET FILS INSTALLATIONS SANITAIRES ET THERMIQUES DU RHÔNE (BERNARD & FILS)",
        metiers: ["chauffagiste"],
        email: null,
        site_internet: "https://bernard-et-fils.example",
        note_google: null,
        nombre_avis_google: null,
        date_creation_entreprise: "1995-09-20",
      }),
    ],
    ecartes: [
      {
        entreprise: "SANITAIRE EXPRESS 69",
        raison: "Ce prospect s'est désinscrit : il ne doit plus jamais être contacté.",
      },
    ],
    quotaRestant: 8,
    horsPlage,
    premierDepart: (horsPlage ? debut : maintenant).toISOString(),
  };
}
