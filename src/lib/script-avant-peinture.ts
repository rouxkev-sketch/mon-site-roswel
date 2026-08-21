import { COULEURS_SOMBRE } from "@/config/tatouage";
//  §1 (nº 335) — LA RÈGLE DE LA CLÉ N'EST PLUS RECOPIÉE ICI : elle est
//  fabriquée par le module qui la porte (lib/adresse-recherche).
import { conditionDeReglagePourLeScript } from "@/lib/adresse-recherche";
import {
  COOKIE_COLONNES,
  expressionColonnes,
  SUFFIXE_COOKIE_AFFICHAGE,
} from "@/lib/colonnes-mosaique";
import {
  AGE_MAXIMUM_MS,
  AGE_POSITION_MS,
  CLE_DEPART_VOULU,
  CLE_JOURNAL,
  CLE_ONGLET,
  CLE_RATTRAPAGE_FILET,
  CLE_RESTAURER,
  PREFIXE_DEFILEMENT,
} from "@/lib/navigation-session";
//  §2 (nº 428) — le filet de réparation du repli écrit sa ligne au
//  journal de la SONDE (sonde-bascule) : mêmes clés, même format —
//  aucune copie de la règle ici. ⚠️ Les clés viennent du module NU
//  (lib/cles-sonde-bascule), pas de journal-bascule : « use client »
//  n'expose au serveur que des références opaques, et l'interpolation
//  rendait « undefined » (mesuré sur le HTML prérendu de cette passe).
import {
  CLE_ARMEE as CLE_ARMEE_SONDE,
  CLE_JOURNAL as CLE_JOURNAL_SONDE,
} from "@/lib/cles-sonde-bascule";
//  §1 (nº 335) — la marque « nais avec la rangée repliée », écrite une
//  seule fois (lib/reserve-barre) et lue par la barre à sa naissance.
import {
  MARQUE_RANGEE,
  RESERVE_LOGO,
  VARIABLE_RESERVE_REPLIEE,
} from "@/lib/reserve-barre";
//  §1 (nº 337) — « on ne pose une position que sur du contenu ». Le
//  script ne peut pas appeler la règle : elle lui rend sa boucle TOUTE
//  FAITE, à partir des mêmes constantes. Aucune copie à la main.
import { boucleDAttentePourLeScript } from "@/lib/pose-sur-contenu";
//  §1 et §2 (nº 343) — l'armement DURABLE des sondes, et le journal de
//  l'historique qui commence avant tout code d'application. Les deux
//  textes sont FABRIQUÉS par les modules qui portent la règle : aucune
//  copie à la main ici.
import { armementPourLeScript, MARQUE_SONDES } from "@/lib/sondes-armees";
import { amorceDuJournalPourLeScript } from "@/lib/journal-historique";
//  §1 (nº 345) — « y a-t-il une VRAIE page derrière moi ? ». La règle
//  est écrite une fois (lib/bas-de-la-pile) et rend son relevé TOUT
//  FAIT : aucune copie à la main ici non plus.
import { releveDuBasPourLeScript } from "@/lib/bas-de-la-pile";
//  nº 353 — le banc d'épreuve par variantes : le texte est fabriqué
//  par le module qui porte la règle (lib/variantes-essai).
import { variantePourLeScript } from "@/lib/variantes-essai";

/**
 * TOUT CE QUI DOIT ÊTRE DÉCIDÉ AVANT LA PREMIÈRE PEINTURE
 * =======================================================
 * Ce texte est posé dans un <script> BLOQUANT, au tout début de
 * l'enveloppe de yokofolio : le navigateur l'exécute pendant l'analyse
 * du HTML, avant d'avoir peint le moindre pixel et avant que React
 * n'existe. C'est le SEUL endroit d'où l'on peut agir sans que l'œil
 * voie quoi que ce soit bouger.
 *
 * IL FAIT CINQ CHOSES, ET TOUTES POUR LA MÊME RAISON :
 *
 * 0. LE NOMBRE DE COLONNES DE LA MOSAÏQUE, écrit dans un cookie
 *    (nº 226-§1). Le serveur doit connaître ce nombre pour servir une
 *    page de `colonnes × 6` cartes — sans quoi la dernière rangée est
 *    incomplète —, et il rend le HTML avant qu'aucune ligne de
 *    JavaScript n'ait tourné : le cookie est le seul canal. Il est
 *    écrit ICI, et NULLE PART AILLEURS — surtout pas au
 *    redimensionnement : c'est ce qui garantit qu'une taille de page
 *    est décidée une seule fois par chargement et ne bouge plus de
 *    toute la pagination. Voir src/lib/colonnes-mosaique.ts, qui porte
 *    les paliers et dit ce que coûte la toute première visite.
 *
 * 1. L'APPAREIL et LE FOND ANTHRACITE sur <html> — déjà là depuis les
 *    passes 60 et 103.
 *
 * 2. LA RESTAURATION NATIVE DU DÉFILEMENT EST COUPÉE. Elle l'était
 *    depuis un effet React, c'est-à-dire TROP TARD : le navigateur avait
 *    déjà eu le temps de replacer la page à sa façon.
 *
 * 3. LA REPRISE DE SESSION. C'ÉTAIT LA PAGE FANTÔME : au réveil, le
 *    navigateur rouvrait une vieille étape (la mosaïque), React la
 *    rendait, on la VOYAIT une seconde, puis un composant décidait de
 *    repartir vers la vraie page. La décision est ici prise avant la
 *    première peinture.
 *
 *    ⚠️ MAIS DÉCIDER TÔT NE SUFFIT PAS, ET C'EST CE QUI A MANQUÉ À LA
 *    PASSE PRÉCÉDENTE. `location.replace` ne fige pas le document : il
 *    LANCE une navigation. Pendant que la nouvelle page voyage — et sur
 *    un téléphone en Wi-Fi, cela dure —, le navigateur continue
 *    d'analyser, de rendre et de PEINDRE celle qui est là. La mosaïque
 *    s'affichait donc quand même, une seconde, avant la fiche.
 *    On MASQUE donc le document dans le même souffle : `visibility:
 *    hidden` sur <html>, posé AVANT le départ. Le fond anthracite, lui,
 *    reste peint (il vient du canevas, que la visibilité ne concerne
 *    pas) — l'utilisateur voit un écran anthracite uni, puis sa page.
 *    Jamais la mauvaise.
 *    FILET : si la navigation n'aboutit pas (hors ligne), la visibilité
 *    revient au bout de trois secondes. Mieux vaut une page tardive
 *    qu'un écran vide définitif.
 *
 * 4. LA POSITION DE DÉFILEMENT. Elle était appliquée après le premier
 *    rendu — on voyait donc le haut de la page, puis la descente. Ici,
 *    la hauteur nécessaire est RÉSERVÉE sur <html> et le défilement est
 *    posé tout de suite : la première image peinte est déjà la bonne.
 *    (La réserve s'efface ensuite toute seule — voir
 *    src/lib/restitution-position.ts, qui applique exactement la même
 *    mécanique pour les retours qui ne changent pas de document.)
 *
 *    ⚠️ LE DÉFILEMENT EST DÉSORMAIS IMMÉDIAT (§1, nº 335) — ET C'EST LA
 *    DETTE DE LA PASSE 115 QUI SE SOLDE. L'histoire, en clair :
 *     · la forme à DEUX arguments — `scrollTo(0, y)` — n'a pas
 *       d'option : elle obéit au défilement doux déclaré globalement
 *       par le site, et la page GLISSE jusqu'à sa position au lieu de
 *       s'y poser (filmé image par image à la passe 115 : y=0 à 46 ms,
 *       puis 133, 348, 648… et 900 seulement à 593 ms) ;
 *     · l'immédiat avait été ESSAYÉ, MESURÉ, ANNULÉ : la position
 *       repartait à ZÉRO, parce que le document venait d'être remplacé
 *       et n'avait pas encore sa hauteur — un défilement instantané y
 *       est raboté sur-le-champ, là où le glissement continue de
 *       progresser pendant que la page grandit ;
 *     · la note de l'époque concluait : « le glissement visible ne se
 *       corrigera qu'en garantissant la hauteur AVANT de défiler ».
 *       C'EST FAIT DEPUIS, deux lignes plus haut : la réserve
 *       (`min-height`) est posée avant le défilement. La raison qui
 *       imposait le glissement n'existe plus.
 *    ET IL FALLAIT LE SOLDER, parce que ce glissement n'était pas
 *    seulement visible : la barre y lisait un GESTE. Six cents
 *    millisecondes de défilement vers le bas que personne n'a faits,
 *    et le seuil des 24 px est franchi — la rangée de recherche se
 *    repliait toute seule APRÈS la première image. C'est cela, « les
 *    cartes s'affichent puis remontent légèrement » (nº 335-§1), et
 *    c'est cela aussi les 58 px de trop : la réserve avait rétréci
 *    sous une position posée pour la réserve dépliée.
 *
 * ⚠️ RIEN N'EST ÉCRIT SUR <body>. React le rend : tout attribut ou
 * style posé dessus avant l'hydratation est un écart d'hydratation
 * (mesuré à la passe 107). <html>, lui, ne pose aucun problème.
 *
 * ⚠️ CE SCRIPT NE DOIT JAMAIS LEVER D'EXCEPTION : il bloque l'analyse du
 * HTML. D'où le `try` qui enveloppe tout ce qui touche au stockage — en
 * navigation privée stricte, y accéder JETTE.
 */
export function scriptAvantPeinture(): string {
  const journal = JSON.stringify(CLE_JOURNAL);
  const onglet = JSON.stringify(CLE_ONGLET);
  const restaurer = JSON.stringify(CLE_RESTAURER);
  const prefixe = JSON.stringify(PREFIXE_DEFILEMENT);
  const fond = JSON.stringify(COULEURS_SOMBRE.fond);
  //  §2 (nº 428) — le filet de réparation du repli de navigation.
  const rattrapage = JSON.stringify(CLE_RATTRAPAGE_FILET);
  const armeeSonde = JSON.stringify(CLE_ARMEE_SONDE);
  const journalSonde = JSON.stringify(CLE_JOURNAL_SONDE);
  //  §1 (nº 429) — la déclaration « départ voulu vers l'accueil ».
  const intention = JSON.stringify(CLE_DEPART_VOULU);

  return `(function(){
var r=document.documentElement;
/* ██ §1 (nº 431) — L'APPAREIL, JUSTE DÈS LA PREMIÈRE IMAGE, MÊME AU
   RECHARGEMENT TIRÉ DU DOIGT. Le relevé du propriétaire (Safari,
   Chrome ET Brave — un seul moteur, WebKit) : après un pull-to-refresh
   d'une fiche, l'interface WEB s'installe sur le téléphone et
   PERSISTE. Or « data-appareil » n'a qu'un écrivain — ce bloc-ci — et
   toute la mise en page (« mobile: », globals.css), les portes de
   geste (fenêtre de carrousel, pile des fiches…) et le crochet
   useAppareilMobile ne font que le LIRE : pour que le symptôme
   existe, il faut que matchMedia("(pointer: coarse)") ait répondu
   FAUX à l'instant où ce script tourne — l'analyse du document
   PROVISOIRE d'un rechargement tiré du doigt, avant que le moteur ne
   soit attaché à la vraie fenêtre. UN APPAREIL NE CHANGE PAS ENTRE
   DEUX PAGES D'UN MÊME ONGLET : la dernière réponse SÛRE (mémoire de
   session, écrite aux instants fiables) fait donc foi pour la
   première image — un pull-to-refresh a toujours une page avant lui,
   la mémoire est toujours là. La mesure est reprise aux instants
   FIABLES (première image peinte, pageshow, événement de changement
   du média) et remet mémoire et attribut à jour : un vrai changement
   d'appareil (souris branchée sur tablette) est suivi, jamais figé. */
var appMemo=null;try{appMemo=sessionStorage.getItem("roswel:appareil")}catch(e){}
var appMedia=matchMedia("(pointer: coarse)");
r.dataset.appareil=(appMemo==="mobile"||appMemo==="web")?appMemo:(appMedia.matches?"mobile":"web");
var appFixer=function(){var v=matchMedia("(pointer: coarse)").matches?"mobile":"web";
r.dataset.appareil=v;try{sessionStorage.setItem("roswel:appareil",v)}catch(e){}};
requestAnimationFrame(appFixer);
addEventListener("pageshow",appFixer);
try{appMedia.addEventListener("change",appFixer)}catch(e){}
/* §B (nº 347) — LE MILLÉSIME DU SCRIPT. Deux passes de suite, des
   blocs de ce script ont semblé ne jamais tourner sur le téléphone du
   propriétaire alors qu'ils tournent ici. Ce numéro tranche : le
   journal le relève à son ouverture. S'il lit un HTML SANS numéro (ou
   avec un vieux), la page servie est PÉRIMÉE — un cache la retient —
   et aucun des blocs récents n'y a jamais été. À INCRÉMENTER à chaque
   passe qui modifie ce script. */
r.dataset.versionScript="438";
r.style.backgroundColor=${fond};
/* nº 357 — LE COMPTE, DIT AVANT LA PREMIÈRE PEINTURE. L'accueil est
   prérendu : le serveur ne connaît plus la session, et c'est CE
   script qui la dit à la garde CSS (globals.css) — connecté (cookie
   de session Supabase présent), revenant (déjà connecté ici), ou
   nouveau. Aucun état faux peint, jamais : la promesse nº 203, tenue
   sans rendu dynamique. Et la marque du nu total (nº 354) passe elle
   aussi au client — même lecture, même endroit. */
/* nº 359 — LA GARDE DE LA FICHE PRÉPARÉE D'AVANCE. Ses tags sont lus
   par le navigateur APRÈS l'hydratation ; pour que l'œil ne voie
   jamais un état que l'adresse contredit, la colonne de photo est
   tenue masquée (CSS, globals.css) quand l'adresse porte des tags —
   et c'est FicheSelonLAdresse qui lève la garde, une fois la fiche
   resemée. « entree=lien » (règle 6) retire la photo tout court.
   nº 360 — L'ADRESSE EXACTE D'UNE FICHE, et elle seule : l'ancien
   test (« commence par /tatoueur/ ») posait la garde aussi sur la
   page de carrousel partagé et sur le jumeau complet — où PERSONNE ne
   la lève (FicheSelonLAdresse n'y est pas montée) : photo masquée
   pour toujours. */
try{if(/^\\/tatoueur\\/[^\\/]+$/.test(location.pathname)){var qf=location.search;
if(qf&&/[?&](style|rendu|nature|photo|studio|entree)=/.test(qf)){r.dataset.ficheParametree="1";
if(/[?&]entree=lien(&|$)/.test(qf))r.dataset.entreeLien="1";}}}catch(e){}
try{var ck=document.cookie;
r.dataset.compte=/(^|; )sb-[^=]*-auth-token/.test(ck)?"connecte":(ck.indexOf("yf_deja_connecte=1")>=0?"revenant":"nouveau");
if(ck.indexOf("yf_nu_total=1")>=0)r.dataset.variante="nu-total";
}catch(e){}
/* 0. LE NOMBRE DE COLONNES, POUR LA PROCHAINE RÉPONSE DU SERVEUR
   (nº 226-§1). La politique du cookie — validité, portée, samesite —
   est écrite UNE fois (SUFFIXE_COOKIE_AFFICHAGE, lib/colonnes-
   mosaique) et partagée avec le cookie de mise en page (nº 257-§2). */
try{document.cookie=${JSON.stringify(COOKIE_COLONNES)}+"="+(${expressionColonnes()})+${JSON.stringify(SUFFIXE_COOKIE_AFFICHAGE)}}catch(e){}
/* ██ nº 363 — LA RESTAURATION REDEVIENT AUTOMATIQUE ██
   Le site posait « manual » depuis la nº 143, pour une raison exacte :
   la restauration native s'applique IMMÉDIATEMENT au retour, pendant
   que l'ancienne page est encore à l'écran, d'où un sursaut de quelques
   pixels. Nous reposions donc la position nous-mêmes, après coup.
   CE QUI A CHANGÉ, ET C'EST LA MESURE DE LA nº 362 : au retour par
   GLISSEMENT, l'écran est noir pendant tout le geste dès que la page
   était défilée — et le relevé du propriétaire a innocenté tout le
   reste (position conservée à l'instant du changement d'adresse, aucun
   masque, aucun effondrement du document, 6 Mo décodés). Il ne restait
   que le moteur. Or un retour de carte est une navigation DANS LE MÊME
   DOCUMENT : pendant le geste, le moteur n'a que l'entrée d'historique
   pour savoir OÙ se placer — et « manual » lui dit précisément de ne
   rien placer. On lui rend donc la main : « auto ».
   ⚠️ ÉCRIT EXPLICITEMENT, pas retiré : « auto » est le défaut, mais
   l'écrire dit que c'est un choix, et un seul mot suffit à revenir.
   ⚠️ NOS POSITIONS NE DÉPENDENT PAS DE CE RÉGLAGE, et c'est ce qui
   rend l'essai sûr : la mémoire de navigation, la réserve de hauteur
   du bloc 4 ci-dessous et « rendreLaPlace » (lib/restitution-position)
   restent l'autorité — elles posent la MÊME valeur que celle que le
   moteur a rangée dans l'entrée (la position du départ), et la réserve
   garantit que le document est assez haut au moment où l'un ou l'autre
   la pose. */
try{history.scrollRestoration="auto"}catch(e){}
/* §1 (nº 343) — L'ARMEMENT DURABLE DES SONDES, LU AU PLUS TÔT.
   Le défaut que le propriétaire poursuit ne se produit QU'À L'ADRESSE
   NUE : une sonde armée par l'adresse le fait disparaître. L'armement
   vit donc dans la mémoire locale, survit à l'ouverture d'un onglet
   neuf, et se lit ICI — avant toute ligne d'application.
   ⚠️ DÉSARMÉ, CE BLOC NE FAIT QU'UNE LECTURE : aucune écriture, aucun
   attribut, aucun écouteur. */
try{${armementPourLeScript()}}catch(e){}
/* nº 353 — LA VARIANTE D'ESSAI, lue au plus tôt : chaque porte du
   site lit la marque qu'elle pose. Sans variante : une lecture. */
try{${variantePourLeScript()}}catch(e){}
/* §2 (nº 343) — ET LE JOURNAL DE L'HISTORIQUE COMMENCE ICI. Armé
   seulement : les toutes premières entrées de la pile — celles qui
   expulsent du site — sont enregistrées avant que React n'existe. */
try{if((r.dataset[${JSON.stringify(MARQUE_SONDES)}]||"").indexOf("historique")>=0){${amorceDuJournalPourLeScript()}}}catch(e){}
/* §1 (nº 345) — LA PROFONDEUR DE LA PILE À NOTRE ARRIVÉE, et le
   référent qui va avec. C'est ce que le filet du retour compare pour
   savoir s'il y a une VRAIE page derrière (lib/bas-de-la-pile).
   ⚠️ ICI ET NULLE PART AILLEURS : relevé plus tard, il aurait compté
   nos propres entrées — celle du routeur, celle d'une surface, celle
   du filet lui-même — comme si elles étaient là avant nous. Une seule
   écriture, au PREMIER document de l'onglet ; les suivants passent. */
try{${releveDuBasPourLeScript()}}catch(e){}
try{
var adresse=location.pathname+location.search;
var nav=(performance.getEntriesByType("navigation")[0]||{}).type||"navigate";
var jour=function(c,s){try{var b=s.getItem(c);return b?JSON.parse(b):null}catch(e){return null}};
var maintenant=Date.now();
var age=${AGE_MAXIMUM_MS};
/* La POSITION, elle, ne vit qu'une demi-heure (nº 181-§1c). */
var agePosition=${AGE_POSITION_MS};

/* 3. LA REPRISE DE SESSION, AVANT TOUTE PEINTURE. */
var memoireOnglet=jour(${onglet},sessionStorage)||{};
var derniereOnglet=memoireOnglet.derniere||null;
var visites=jour(${journal},localStorage);
if(visites&&maintenant-(visites.date||0)>age)visites=null;
var vers=null;
/* §2 (nº 428) — la marque du rattrapage du filet (RetourGaranti) : ce
   départ vers l'accueil nu était VOULU. Consommée ICI, une fois, quel
   que soit le chemin : elle ne concerne que CE document-ci. */
var marqueRattrapage=null;
try{marqueRattrapage=sessionStorage.getItem(${rattrapage});if(marqueRattrapage)sessionStorage.removeItem(${rattrapage})}catch(e){}
/* §1 (nº 429) — LA DÉCLARATION D'INTENTION, posée au clic par tout
   lien interne du site vers l'accueil nu (le logo en tête — un <a>
   NATIF : chaque clic est une navigation de document, et le filet la
   prenait pour un repli : « le logo ne ramène plus à l'accueil »,
   relevé nº 429). Consommée ici, une fois, fraîche huit secondes —
   une navigation douce qui n'a pas déchargé le document la laisse
   simplement expirer. */
var intentionAccueil=null;
try{intentionAccueil=sessionStorage.getItem(${intention});if(intentionAccueil)sessionStorage.removeItem(${intention})}catch(e){}
var departVouluFrais=Boolean(intentionAccueil)&&maintenant-(Number(intentionAccueil)||0)<8000;
/* §1 (nº 429) — LE RÉFÉRENT TRANCHE LA SAISIE À LA MAIN : une adresse
   tapée (ou un favori, ou un lien d'ailleurs) n'envoie AUCUN référent
   de notre origine ; le repli du routeur, lui, est un
   location.replace lancé PAR une page du site — son référent est la
   page quittée, même origine. Vide, illisible ou étranger : le filet
   S'ABSTIENT — « un visiteur bloqué contre son gré est pire qu'un
   repli non réparé » (la règle du propriétaire, nº 429). */
var refDuSite=false;
try{var refD=document.referrer||"";refDuSite=refD===location.origin||refD.indexOf(location.origin+"/")===0}catch(e){}
if(nav==="reload"&&derniereOnglet&&derniereOnglet!==adresse){vers=derniereOnglet}
else if(nav==="navigate"&&!derniereOnglet&&adresse==="/"&&visites&&visites.courante&&visites.courante!=="/"&&(matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)){vers=visites.courante}
/* ██ §2 (nº 428, CIVILISÉ nº 429) — LE FILET DE RÉPARATION DU REPLI ██
   Le repli du routeur (deux désaccords d'arbre d'affilée, ou un échec
   réseau — la réécriture de « / » vers le jumeau les fabrique) part
   en NAVIGATION DE DOCUMENT vers l'adresse canonique INTERNE restée
   « / » NU : critères, page et mélange perdus en route. ICI, avant
   toute peinture, la table de décision — et elle exige TOUT :
    · le document naît en « navigate » sur une adresse sans AUCUN
      paramètre de recherche ;
    · la même session vient de quitter (< 8 s, pagehide noté par
      MemoireNavigation) une adresse de « / » qui en portait ;
    · le RÉFÉRENT est une page du site — un repli est toujours lancé
      PAR une page ; une saisie à la main n'en envoie aucun (la leçon
      de la nº 429 : le pari des huit secondes seul était faux) ;
    · AUCUNE intention d'accueil déclarée (le logo…), AUCUN rattrapage
      du filet (RetourGaranti) — leurs marques ci-dessus.
   Alors seulement : l'adresse complète est rendue. Dans tout autre
   cas — et dans le doute — le filet NE RÉPARE PAS : un visiteur
   bloqué contre son gré est pire qu'un repli non réparé.
   La ligne s'écrit au journal de la sonde : aucun repli muet. */
else if(nav==="navigate"&&location.pathname==="/"&&!marqueRattrapage&&!departVouluFrais&&refDuSite&&derniereOnglet&&derniereOnglet.indexOf("/?")===0&&memoireOnglet.quand&&maintenant-memoireOnglet.quand<8000){
var pn=new URLSearchParams(location.search);var nue=true;
pn.forEach(function(v,n){if(!(${conditionDeReglagePourLeScript("n")}))nue=false});
var pd=new URLSearchParams(derniereOnglet.slice(derniereOnglet.indexOf("?")+1));var pleine=false;
pd.forEach(function(v,n){if(!(${conditionDeReglagePourLeScript("n")}))pleine=true});
if(nue&&pleine){vers=derniereOnglet;
try{if(sessionStorage.getItem(${armeeSonde})==="1"){var jr=[];
try{jr=JSON.parse(sessionStorage.getItem(${journalSonde})||"[]")}catch(e2){jr=[]}
jr.push({t:0,texte:"⚠️ REPLI DOCUMENT RÉPARÉ · le routeur a rechargé sur "+adresse+" (navigation de document, les critères perdus en route) · l'adresse complète est rendue : "+vers});
sessionStorage.setItem(${journalSonde},JSON.stringify(jr))}}catch(e3){}}}
if(vers){
try{sessionStorage.setItem(${restaurer},vers)}catch(e){}
r.style.visibility="hidden";
setTimeout(function(){r.style.visibility=""},3000);
location.replace(vers);
return}

/* 4. LA POSITION, RÉSERVE COMPRISE. */
var demande=null;try{demande=sessionStorage.getItem(${restaurer})}catch(e){}
var attendue=demande&&(demande==="1"||demande===adresse);
if(attendue){try{sessionStorage.removeItem(${restaurer})}catch(e){}}
if(nav==="navigate"&&!attendue)return;
/* ⚠️ LA CLÉ EST L'ADRESSE CANONIQUE DE LA RECHERCHE (nº 184-§2) :
   critères compris, réglages de sonde exclus, paramètres triés.
   §1 (nº 335) — LA CONDITION CI-DESSOUS EST FABRIQUÉE PAR
   lib/adresse-recherche, à partir des MÊMES constantes que le reste
   du site : il n'y a plus deux copies de la règle à tenir d'accord. */
var p=new URLSearchParams(location.search);var noms=[];
p.forEach(function(v,n){noms.push(n)});
for(var i=0;i<noms.length;i++){var n=noms[i];
if(${conditionDeReglagePourLeScript('n')})p.delete(n)}
p.sort();var q=p.toString();
var cle=location.pathname+(q?"?"+q:"");
var note=jour(${prefixe}+cle,localStorage);
if(!note||!note.y||maintenant-(note.date||0)>agePosition)return;
r.dataset.positionPosee=String(note.y);
/* §1 (nº 335) — LA RANGÉE NAÎT DANS L'ÉTAT OÙ ON L'A LAISSÉE. La
   place gardée porte les deux (lib/navigation-session) ; la barre
   lit cette marque à sa naissance (lib/reserve-barre). Sans elle,
   la réserve renaît dépliée et tout le contenu descend d'un cran. */
if(note.p){r.style.setProperty(${JSON.stringify(VARIABLE_RESERVE_REPLIEE)},${JSON.stringify(`${RESERVE_LOGO}px`)});r.dataset[${JSON.stringify(MARQUE_RANGEE)}]="1"}
/* §1 (nº 337) — ON ATTEND QUE LE CONTENU SOIT LÀ. La réserve de
   hauteur et le défilement ne sont plus posés sur-le-champ : sur un
   document qui n'a pas fini d'arriver, ils rendaient le document
   grand et VIDE, et l'on se posait à 900 px devant rien. La boucle
   d'attente est celle de lib/pose-sur-contenu — pas une copie : ce
   texte EST fabriqué par elle. Le défilement reste IMMÉDIAT (point 4
   de l'en-tête) : c'est l'instant qui change, pas la manière. */
${boucleDAttentePourLeScript(
  "note.y",
  `r.style.minHeight=(note.y+innerHeight)+"px";scrollTo({top:note.y,left:0,behavior:"instant"})`
)};
/* FILET : si React ne démarre jamais, la réserve part quand même. */
setTimeout(function(){if(r.dataset.positionPosee){r.style.minHeight="";delete r.dataset.positionPosee}},6000);
}catch(e){}
})();`;
}
