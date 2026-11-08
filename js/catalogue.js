/* Fluxe Suivi — Catalogue des exercices et des machines, modèles par enseigne (On Air et autres). */
export const M=['Pectoraux','Dos','Épaules','Bras','Jambes','Fessiers','Abdos','Corps entier','Cardio'];
const T={h:'Hammer Strength',s:'Machine guidée',p:'Poulie',e:'Eleiko',l:'Life Fitness'};
export const LIB=[].concat(...Object.entries({
Pectoraux:['Développé couché','Développé incliné haltères','Écarté poulie','Pompes','Développé couché haltères','Développé incliné barre','Développé décliné','Pec deck (papillon)|s','Presse pectorale assise|s','Développé couché Iso-Lateral|h','Développé incliné Iso-Lateral|h','Développé super incliné Iso-Lateral|h','Développé décliné Iso-Lateral|h','Pectoraux écartés Iso-Lateral (Wide Chest)|h','Pullover machine|h','Écarté poulie vis-à-vis|p'],
Dos:['Tractions','Rowing barre','Tirage vertical','Tirage horizontal','Soulevé de terre','Tractions assistées|s','Tirage vertical machine (Lat Pulldown)|s','Rowing assis machine|s','Tirage vertical Iso-Lateral|h','Tirage large Iso-Lateral (Wide Pulldown)|h','Rowing haut Iso-Lateral (High Row)|h','Rowing Iso-Lateral|h','Rowing bas Iso-Lateral (Low Row)|h','Rowing D.Y. Iso-Lateral|h','Rowing T-Bar|h','Shrug assis/debout machine|h','Pull-over poulie|p','Rowing haltère unilatéral','Shrugs haltères','Hyperextension (banc lombaires)','Extension lombaires machine|s'],
Épaules:['Développé militaire','Élévations latérales','Oiseau','Développé épaules haltères','Développé épaules machine|s','Oiseau machine (reverse pec deck)|s','Développé épaules Iso-Lateral|h','Élévations latérales machine|h','Face pull|p','Élévations frontales','Push press|e'],
Bras:['Curl barre','Curl marteau','Triceps poulie','Dips','Barre au front','Curl haltères','Curl pupitre (Larry Scott)','Curl concentré','Curl machine|s','Extension triceps machine|s','Curl biceps assis|h','Dips assis machine|h','Curl poulie basse|p','Kickback triceps poulie|p','Extension triceps nuque haltère','Curl poignets'],
Jambes:['Squat','Presse à cuisses','Fentes','Leg curl','Leg extension','Mollets debout','Front squat|e','Soulevé de terre roumain','Good morning','Fentes bulgares','Step-up','Leg curl allongé|s','Leg curl assis|s','Adducteurs machine|s','Squat Smith machine|h','Presse à cuisses linéaire|h','Presse à cuisses Iso-Lateral|h','V-Squat|h','Hack squat|h','Belt squat|h','Pendulum squat|h','Leg extension machine|h','Leg curl à genoux Iso-Lateral|h','Mollets assis|h','Mollets presse|h','Tibial machine|h','Nordic assisté|h'],
Fessiers:['Hip thrust','Glute drive|h','Abducteurs machine|s','Reverse hyper|h','Kickback fessier poulie|p'],
Abdos:['Crunch','Gainage','Relevé de jambes','Crunch machine|s','Crunch obliques|h','Crunch poulie|p','Roue abdominale','Russian twist','Relevé de genoux chaise romaine','Rotation du buste machine|s'],
'Corps entier':['Arraché (snatch)|e','Épaulé (power clean)|e','Épaulé-jeté|e','Thruster','Kettlebell swing','Farmer walk'],
Cardio:['Tapis de course','Marche inclinée','Vélo droit','Vélo semi-allongé','Elliptique','Rameur','Escalier (stepper)','PowerMill Climber|l','Assault bike','SkiErg']
}).map(([g,l])=>l.map(n=>{const[a,t]=n.split('|');return[a,g,T[t]||'']})));
/* Machines exclusives au catalogue On Air (modèles cités par Life Fitness et Panatta) : jamais mélangées aux autres salles */
const XO=[['Tirage vertical Select','Dos','Hammer Strength Select'],['Leg extension Select','Jambes','Hammer Strength Select'],['Abducteurs Select','Fessiers','Hammer Strength Select'],
['Tirage vertical convergent (Super Lat Machine)','Dos','Panatta'],['Rowing bas (Super Low Row)','Dos','Panatta'],['Développé vertical (Super Vertical Chest Press)','Pectoraux','Panatta'],['Développé incliné (Super Inclined Chest Press)','Pectoraux','Panatta'],['Développé décliné (Super Declined Chest Press)','Pectoraux','Panatta']];
export const XS=new Set(XO.map(x=>x[0]));LIB.push(...XO);
export const MU=Object.assign(Object.create(null),Object.fromEntries(LIB.map(x=>[x[0],x[1]])));
export const TG=Object.assign(Object.create(null),Object.fromEntries(LIB.map(x=>[x[0],x[2]])));
/* Modèles par enseigne (recherche web, novembre 2026).
   Les enseignes ne publient PAS la liste complète de leurs machines : seulement leurs marques et leurs zones,
   et chaque club est différent. Ces modèles sont donc un point de départ « probable » à vérifier sur place. */
const CARDIO=['Tapis de course','Marche inclinée','Vélo droit','Vélo semi-allongé','Elliptique','Rameur','Escalier (stepper)'];
const CROSS=['Rameur','Assault bike','SkiErg','Kettlebell swing','Farmer walk','Thruster'];
const pickLib=tags=>LIB.filter(([n,m,t])=>m!=='Cardio'&&!XS.has(n)&&tags.includes(t)).map(x=>x[0]);
const BASE=()=>[...pickLib(['','Machine guidée','Poulie']),...CARDIO];
/* ⭐ Catalogue On Air : enseigne prioritaire, catalogue à part, rangé par familles de machines */
export const ONAIR={id:'on-air',name:'On Air',brands:'Hammer Strength, Life Fitness, Panatta (grands clubs)',info:'Catalogue dédié : Hammer Strength à disques et Select, cardio Life Fitness, espace Panatta dans les grands clubs.',
groups:[
{t:'Hammer Strength à disques',on:1,eq:()=>pickLib(['Hammer Strength'])},
{t:'Hammer Strength Select (guidées)',on:1,eq:()=>XO.filter(x=>x[2]==='Hammer Strength Select').map(x=>x[0])},
{t:'Panatta Freeweight Special (grands clubs)',on:0,eq:()=>XO.filter(x=>x[2]==='Panatta').map(x=>x[0])},
{t:'Poids libres, poulies et machines guidées',on:1,eq:()=>pickLib(['','Machine guidée','Poulie'])},
{t:'Cardio Life Fitness',on:1,eq:()=>[...CARDIO,'PowerMill Climber']},
{t:'Haltérophilie (barres Eleiko)',on:0,eq:()=>pickLib(['Eleiko'])}]};
/* Catalogue séparé : les autres enseignes (jamais les machines exclusives On Air) */
export const OTHERS=[
{id:'basic-fit',name:'Basic-Fit',brands:'Matrix, Technogym dans certains clubs',info:'Poids libres, machines guidées, multi-stations et cardio.',eq:BASE},
{id:'fitness-park',name:'Fitness Park',brands:'Hammer Strength, Technogym',info:'Machines Hammer Strength, zone cross-training (rameur, airbike, SkiErg, kettlebells).',eq:()=>[...BASE(),...pickLib(['Hammer Strength']),...CROSS]},
{id:'neoness',name:'Neoness',brands:'Matrix',info:'Machines guidées, poids libres et cardio Matrix.',eq:BASE},
{id:'orange-bleue',name:'L’Orange Bleue',brands:'BH, Bodytone',info:'Machines guidées, poids libres et cardio (tapis, vélos, elliptiques, rameurs).',eq:BASE},
{id:'keepcool',name:'Keepcool',brands:'machines à air comprimé, Technogym dans certains clubs',info:'Machines guidées, poids libres, cardio ; espace « Lady Corner » dans plusieurs clubs.',eq:BASE}];
export const CHAINS=[ONAIR,...OTHERS];
/* machines cochées par défaut à la création d'une salle */
export const defOf=c=>[...new Set(c.groups?c.groups.filter(g=>g.on).flatMap(g=>g.eq()):c.eq())];
/* Deux catalogues distincts dans « Ma salle » :
   ⭐ Catalogue On Air (prioritaire) et Catalogue autres enseignes (toutes les autres réunies en un seul catalogue) */
export const C1='⭐ Catalogue On Air',C2='Catalogue autres enseignes';
export const OTHERCAT={groups:[
{t:'Poids libres, poulies et machines guidées',eq:()=>pickLib(['','Machine guidée','Poulie'])},
{t:'Cardio',eq:()=>CARDIO},
{t:'Cross-training',eq:()=>CROSS},
{t:'Hammer Strength à disques',eq:()=>pickLib(['Hammer Strength'])},
{t:'Haltérophilie (barres Eleiko)',eq:()=>pickLib(['Eleiko'])}]};
/* pour chaque machine du catalogue « autres enseignes » : quelles enseignes l'annoncent */
let WHO=null;export const whoHas=n=>{if(!WHO){WHO=Object.create(null);OTHERS.forEach(c=>c.eq().forEach(x=>{(WHO[x]=WHO[x]||[]).includes(c.name)||WHO[x].push(c.name)}))}return WHO[n]||[]};
