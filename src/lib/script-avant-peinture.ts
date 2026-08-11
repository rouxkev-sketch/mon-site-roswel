import { COULEURS_SOMBRE } from "@/config/tatouage";
import {
  AGE_MAXIMUM_MS,
  AGE_POSITION_MS,
  CLE_JOURNAL,
  CLE_ONGLET,
  CLE_RESTAURER,
  PREFIXE_DEFILEMENT,
} from "@/lib/navigation-session";

/**
 * TOUT CE QUI DOIT ÊTRE DÉCIDÉ AVANT LA PREMIÈRE PEINTURE
 * =======================================================
 * Ce texte est posé dans un <script> BLOQUANT, au tout début de
 * l'enveloppe de yokofolio : le navigateur l'exécute pendant l'analyse
 * du HTML, avant d'avoir peint le moindre pixel et avant que React
 * n'existe. C'est le SEUL endroit d'où l'on peut agir sans que l'œil
 * voie quoi que ce soit bouger.
 *
 * IL FAIT QUATRE CHOSES, ET TOUTES POUR LA MÊME RAISON :
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
 *    ⚠️ ET LE DÉFILEMENT SE POSE PAR `scrollTo(0, y)`, LA FORME À DEUX
 *    ARGUMENTS — surtout pas par la forme à options. Mesuré à la passe
 *    115, dans les deux sens :
 *     · la forme à deux arguments n'a pas d'option, elle obéit donc au
 *       défilement doux déclaré globalement par le site : la page
 *       GLISSE jusqu'à sa position au lieu de s'y poser (filmé image
 *       par image : y=0 à 46 ms, puis 133, 348, 648… et 900 seulement
 *       à 593 ms). C'est visible, et j'ai voulu le corriger en
 *       demandant un défilement instantané.
 *     · ESSAYÉ, MESURÉ, ANNULÉ : la reprise de session repartait alors
 *       à ZÉRO. À cet instant, le document vient d'être remplacé et
 *       n'a pas encore sa hauteur ; un défilement instantané est donc
 *       raboté sur-le-champ, tandis que le défilement doux continue de
 *       progresser pendant que la page grandit, et finit par atteindre
 *       sa cible. Le lissage rattrape ici une hauteur qui n'existe pas
 *       encore.
 *    Le glissement visible ne se corrigera qu'en garantissant la
 *    hauteur AVANT de défiler sur ce chemin-là. Il reste à faire.
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

  return `(function(){
var r=document.documentElement;
r.dataset.appareil=matchMedia("(pointer: coarse)").matches?"mobile":"web";
r.style.backgroundColor=${fond};
try{history.scrollRestoration="manual"}catch(e){}
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
if(nav==="reload"&&derniereOnglet&&derniereOnglet!==adresse){vers=derniereOnglet}
else if(nav==="navigate"&&!derniereOnglet&&adresse==="/"&&visites&&visites.courante&&visites.courante!=="/"&&(matchMedia("(display-mode: standalone)").matches||navigator.standalone===true)){vers=visites.courante}
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
   critères compris, réglages de sonde exclus, paramètres triés. LA
   MÊME LOGIQUE QU'EN lib/adresse-recherche — si l'une change,
   l'autre aussi, sinon on irait chercher une clé que personne
   n'écrit. */
var p=new URLSearchParams(location.search);var noms=[];
p.forEach(function(v,n){noms.push(n)});
for(var i=0;i<noms.length;i++){var n=noms[i];
if(n.indexOf("sonde")===0||n==="clair"||n==="verre"||n==="flou"||n==="sans")p.delete(n)}
p.sort();var q=p.toString();
var cle=location.pathname+(q?"?"+q:"");
var note=jour(${prefixe}+cle,localStorage);
if(!note||!note.y||maintenant-(note.date||0)>agePosition)return;
r.style.minHeight=(note.y+innerHeight)+"px";
r.dataset.positionPosee=String(note.y);
/* Forme à DEUX ARGUMENTS : voir le point 4 de l'en-tête. */
scrollTo(0,note.y);
/* FILET : si React ne démarre jamais, la réserve part quand même. */
setTimeout(function(){if(r.dataset.positionPosee){r.style.minHeight="";delete r.dataset.positionPosee}},6000);
}catch(e){}
})();`;
}
