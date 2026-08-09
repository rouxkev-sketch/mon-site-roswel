/**
 * DÉMARRER LE SITE EN DÉVELOPPEMENT — SANS PANNE MUETTE
 * ======================================================
 *   npm run dev
 *
 * C'est le remplaçant de `npx next dev`. Il fait exactement la même
 * chose, plus deux garanties que `next dev` ne donne pas :
 *
 *  1. IL VÉRIFIE L'INSTALLATION AVANT DE PARTIR. Si node_modules est
 *     incomplet — le moteur natif de Next absent ou abîmé, une
 *     bibliothèque manquante —, il refuse de démarrer, dit CE QUI
 *     MANQUE et donne la commande de réparation. Sans ça, Next affiche
 *     « ✓ Ready » (qu'il écrit AVANT de charger quoi que ce soit) puis
 *     le site reste muet, sans un mot d'explication.
 *
 *  2. IL DIT POURQUOI ÇA S'EST ARRÊTÉ. `next dev` surveille un
 *     processus enfant qui fait tout le travail. Quand cet enfant est
 *     TUÉ (mémoire épuisée, moteur natif qui plante), le surveillant
 *     l'ignore volontairement — son code dit
 *     `if (sessionStopHandled || signal) return` — et s'éteint donc
 *     avec le CODE 0, SANS AUCUN MESSAGE. Vu du terminal : « ✓ Ready »,
 *     puis plus rien, comme si tout s'était bien passé. Ici, un arrêt
 *     anormal est NOMMÉ.
 *
 * Tout ce qu'on ajoute après la commande est transmis tel quel :
 *   npm run dev -- --port 3001
 *   npm run dev -- --webpack
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afficherVerification, RACINE, REPARATION } from "./verifier-installation.mjs";

const ROUGE = "\u001B[31m";
const GRAS = "\u001B[1m";
const FIN = "\u001B[0m";

// ÉTAPE 1 — L'INSTALLATION. En silence quand tout va bien : on ne va
// pas ajouter une ligne de bavardage à chaque démarrage.
if (!afficherVerification({ silencieuxSiOk: true })) {
  process.exit(1);
}

// ÉTAPE 2 — LANCER NEXT.
// On appelle le programme de Next DIRECTEMENT avec le même Node que
// celui qui exécute ce fichier, sans passer par npx : une couche de
// moins entre le terminal et le serveur, donc un code de sortie et des
// signaux qui arrivent intacts.
const programmeNext = join(RACINE, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(programmeNext)) {
  console.log("");
  console.log(`${ROUGE}${GRAS}✗  Next n'est pas installé dans ce dossier.${FIN}`);
  console.log("");
  console.log(REPARATION);
  console.log("");
  process.exit(1);
}

const arguments_ = process.argv.slice(2);
const serveur = spawn(process.execPath, [programmeNext, "dev", ...arguments_], {
  cwd: RACINE,
  stdio: "inherit",
});

// Ctrl+C et arrêt du terminal : on transmet, et on laisse Next faire son
// ménage (il ferme le serveur proprement avant de rendre la main). Le
// drapeau distingue CET arrêt-là — voulu — de tous les autres.
let arretDemande = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    arretDemande = true;
    serveur.kill(signal);
  });
}

serveur.on("error", (erreur) => {
  console.log("");
  console.log(`${ROUGE}${GRAS}✗  Impossible de lancer Next : ${erreur.message}${FIN}`);
  console.log("");
  process.exit(1);
});

/**
 * L'ARRÊT — et sa raison.
 * `signal` non nul = le processus a été TUÉ, il n'a pas décidé de
 * s'arrêter. C'est le cas que `next dev` passe sous silence, et c'est
 * presque toujours l'un de ces trois-là.
 */
serveur.on("exit", (code, signal) => {
  if (arretDemande) {
    process.exit(0);
  }

  if (signal) {
    console.log("");
    console.log(`${ROUGE}${GRAS}✗  LE SERVEUR A ÉTÉ TUÉ (signal ${signal}).${FIN}`);
    console.log("");
    console.log("   Il ne s'est pas arrêté tout seul : quelque chose l'a interrompu.");
    console.log("   Dans l'ordre de fréquence :");
    console.log("");
    console.log(
      `   ${GRAS}1. La mémoire de la machine est épuisée${FIN} (signal SIGKILL).`
    );
    console.log(
      "      En développement, le serveur occupe à lui seul environ 1 Go."
    );
    console.log(
      "      Fermer les autres applications — un navigateur avec beaucoup"
    );
    console.log("      d'onglets suffit à faire pencher la balance.");
    console.log("");
    console.log(
      `   ${GRAS}2. Le moteur natif de Next a planté${FIN} (SIGSEGV, SIGABRT, SIGILL).`
    );
    console.log("      Réinstallation propre :");
    console.log("         rm -rf node_modules && npm ci");
    console.log("");
    console.log(`   ${GRAS}3. Quelqu'un a arrêté le processus${FIN} — une autre fenêtre,`);
    console.log("      un outil de nettoyage, une mise en veille.");
    console.log("");
    process.exit(1);
  }

  if (code !== 0) {
    console.log("");
    console.log(`${ROUGE}${GRAS}✗  Next s'est arrêté avec le code ${code}.${FIN}`);
    console.log("   Le message d'erreur est juste au-dessus.");
    console.log("");
    process.exit(code ?? 1);
  }

  // Code 0 SANS demande d'arrêt : c'est exactement le cas trompeur.
  // Next ne rend 0 de lui-même que si son propre enfant a été tué —
  // il ne sort jamais en 0 dans son fonctionnement normal.
  console.log("");
  console.log(`${ROUGE}${GRAS}✗  Next s'est arrêté seul, sans erreur affichée.${FIN}`);
  console.log("");
  console.log("   Ce n'est pas normal : un serveur de développement ne s'arrête");
  console.log("   pas tout seul. Le processus qui fait le travail a été tué, et");
  console.log("   Next a avalé le message.");
  console.log("");
  console.log("   Vérifier l'installation :");
  console.log("      node outils/verifier-installation.mjs");
  console.log("");
  process.exit(1);
});
