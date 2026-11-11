/* Fluxe Suivi — Dessins des machines et des exercices (v2.7, style « aplat dégradé »).
   Chaque dessin est un petit SVG (240 × 180, sol à y = 160) assemblé à partir de pièces communes :
   tubes en métal, coussins au dégradé Fluxe, disques, colonnes de poids, silhouettes.
   Rien n'est téléchargé : tout marche hors ligne et reste net sur tous les écrans.
   Règle : une MACHINE est dessinée seule ; un exercice aux POIDS LIBRES, au poids du corps ou à la poulie
   est dessiné avec une silhouette qui fait le mouvement (sinon tous les exercices à la barre se ressembleraient). */

/* ---------- Outils de géométrie ---------- */
const R=v=>Math.round(v*10)/10;
const P=a=>a.map(p=>R(p[0])+' '+R(p[1])).join('L');
const go=(p,a,l)=>[p[0]+Math.sin(a*Math.PI/180)*l,p[1]+Math.cos(a*Math.PI/180)*l]; /* angle 0 = vers le bas, 90 = vers l'avant (droite), 180 = vers le haut */
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];

/* ---------- Pièces ---------- */
const T=(...p)=>`<path class="dT" d="M${P(p)}"/><path class="dH" d="M${P(p)}"/>`; /* tube + reflet */
const Tc=d=>`<path class="dT" d="${d}"/><path class="dH" d="${d}"/>`; /* tube courbe (chemin libre) */
const pad=(a,b,e=12)=>{const l=R(Math.hypot(b[0]-a[0],b[1]-a[1])),g=R(Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI);
  return `<g transform="translate(${R(a[0])} ${R(a[1])}) rotate(${g})"><rect class="dPu" x="0" y="${R(-e/2+3)}" width="${l}" height="${e}" rx="${e/2}"/><rect class="dP" x="0" y="${-e/2}" width="${l}" height="${e}" rx="${e/2}"/></g>`;};
const plate=(c,r=17)=>`<circle class="dL" cx="${R(c[0])}" cy="${R(c[1])}" r="${r}"/><circle class="dLr" cx="${R(c[0])}" cy="${R(c[1])}" r="${R(r*.6)}"/><circle class="dLh" cx="${R(c[0])}" cy="${R(c[1])}" r="${R(Math.max(2.5,r*.2))}"/>`;
const G=(...p)=>`<path class="dG" d="M${P(p)}"/>`;              /* poignée */
const C=(...p)=>`<path class="dC" d="M${P(p)}"/>`;              /* câble */
const pul=(c,r=6)=>`<circle class="dU" cx="${R(c[0])}" cy="${R(c[1])}" r="${r}"/><circle class="dLh" cx="${R(c[0])}" cy="${R(c[1])}" r="2"/>`;
const box=(x,y,w,h,rx=4)=>`<rect class="dK" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
const scr=(x,y,w,h)=>`<rect class="dS" x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5"/>`;
const base=(a=28,b=212)=>T([a,160],[b,160]);
/* Colonne de poids. k : 'sel' = Hammer Strength Select (chapeau dégradé), 'ins' = Life Fitness Insignia (carter clair) */
function tower(x,y,w,k){const h=160-y,n=8,top=160-8-n*7;
  let s=`<rect class="${k==='ins'?'dKi':'dK'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/><rect class="dW" x="${x+6}" y="${y+8}" width="${w-12}" height="${h-14}" rx="3"/>`;
  s+=`<path class="dC2" d="M${x+w*.36} ${y+10}V${top}M${x+w*.64} ${y+10}V${top}"/>`;
  for(let i=0;i<n;i++)s+=`<rect class="dL" x="${x+8}" y="${top+i*7}" width="${w-16}" height="5" rx="1.5"/>`;
  s+=`<circle class="dLh" cx="${x+w/2}" cy="${top+3*7+2.5}" r="2"/>`;
  if(k==='sel')s+=`<rect class="dP" x="${x-3}" y="${y-4}" width="${w+6}" height="9" rx="4.5"/>`;
  if(k==='ins')s+=`<rect class="dP" x="${x+w-5}" y="${y+10}" width="3" height="${h-24}" rx="1.5"/>`;
  return s;}
/* Bras de levier à disques (Hammer Strength, Panatta) : pivot → poignée, disque sur un « klaxon » */
function lever(pv,h,o={}){const at=o.at??.45,m=mix(pv,h,at),side=o.side??-1,ang=Math.atan2(h[1]-pv[1],h[0]-pv[0]);
  const hn=[m[0]+Math.cos(ang+side*Math.PI/2)*(o.off??16),m[1]+Math.sin(ang+side*Math.PI/2)*(o.off??16)];
  const arm=o.curve?Tc(`M${R(pv[0])} ${R(pv[1])}Q${R(o.curve[0])} ${R(o.curve[1])} ${R(h[0])} ${R(h[1])}`):T(pv,h);
  return arm+T(m,hn)+plate(hn,o.r??17)+(o.r2?plate([hn[0]+3,hn[1]+3],o.r2):'')+`<circle class="dLh" cx="${R(pv[0])}" cy="${R(pv[1])}" r="5"/>`;}
const gripV=(h,l=13)=>G([h[0],h[1]-l],[h[0],h[1]+l]);

/* ---------- Silhouette (vue de profil, tournée vers la droite) ----------
   x,y = hanche ; t = buste ; thF/shF = cuisse/tibia de la jambe du fond ; thN/shN = jambe de devant ;
   uaF/faF, uaN/faN = bras/avant-bras du fond et de devant. Angles : 0 bas, 90 avant, 180 haut, -90 arrière. */
function F(x,y,t,thF,shF,thN,shN,uaF,faF,uaN,faN,o={}){const k=o.k||1,w=[x,y],s=go(w,t,40*k),h=go(s,t+(o.n||0),15*k);
  const kF=go(w,thF,36*k),fF=go(kF,shF,36*k),kN=go(w,thN,36*k),fN=go(kN,shN,36*k);
  const eF=go(s,uaF,27*k),hF=go(eF,faF,25*k),eN=go(s,uaN,27*k),hN=go(eN,faN,25*k);
  const toe=(f,a)=>o.toe===false?[]:[go(f,a+(o.ft??90),9*k)];
  const L=(c,p,wd)=>`<path class="${c}" stroke-width="${R(wd*k)}" d="M${P(p)}"/>`;
  return {far:L('dBf',[w,kF,fF,...toe(fF,shF)],10.5)+L('dBf',[s,eF,hF],8.5),
    mid:L('dB',[w,s],18)+`<circle class="dBh" cx="${R(h[0])}" cy="${R(h[1])}" r="${R(9.5*k)}"/>`,
    near:L('dB',[w,kN,fN,...toe(fN,shN)],11)+L('dBa',[s,eN,hN],9),w,s,h,hF,hN,fN,fF,kN,kF,eN,eF};}
const fig=(f,a='',b='',c='')=>f.far+a+f.mid+b+f.near+c;
/* Silhouette vue de face. aL/aR = [bras, avant-bras] (0 bas, 90 sur le côté, 180 haut) */
function FF(cx,o={}){const k=o.k||1,hy=o.hy??88,sy=hy-(o.tl??40)*k,lg=o.lg??6;
  const sl=[cx-15*k,sy+4*k],sr=[cx+15*k,sy+4*k],aL=o.aL||[8,0],aR=o.aR||aL;
  const eL=go(sl,-aL[0],27*k),hL=go(eL,-aL[1],25*k),eR=go(sr,aR[0],27*k),hR=go(eR,aR[1],25*k);
  const fy=o.fy??160,kn=o.kn??0;
  const L=(p,wd,c='dB')=>`<path class="${c}" stroke-width="${R(wd*k)}" d="M${P(p)}"/>`;
  const legs=o.nolegs?'':L([[cx-8*k,hy],[cx-(8+lg/2+kn)*k,(hy+fy)/2],[cx-(8+lg)*k,fy]],11)+L([[cx+8*k,hy],[cx+(8+lg/2+kn)*k,(hy+fy)/2],[cx+(8+lg)*k,fy]],11);
  const head=o.head||[cx,sy-11*k];
  return {s:legs+`<rect class="dBr" x="${R(cx-15*k)}" y="${R(sy)}" width="${R(30*k)}" height="${R(hy-sy+4)}" rx="${R(11*k)}"/>`+L([sl,eL,hL],9,'dBa')+L([sr,eR,hR],9,'dBa')+`<circle class="dBh" cx="${R(head[0])}" cy="${R(head[1])}" r="${R(9.5*k)}"/>`,hL,hR,sy};}

/* ---------- Matériel des poids libres ---------- */
const bb=(p,r=19)=>plate(p,r);                                          /* barre vue de bout */
const db=(p,far)=>`<circle class="${far?'dLf':'dL'}" cx="${R(p[0])}" cy="${R(p[1])}" r="8.5"/><circle class="dLh" cx="${R(p[0])}" cy="${R(p[1])}" r="2.5"/>`;
const dbV=p=>`<rect class="dL" x="${R(p[0]-5)}" y="${R(p[1]-17)}" width="10" height="10" rx="3"/><rect class="dL" x="${R(p[0]-5)}" y="${R(p[1]+7)}" width="10" height="10" rx="3"/>`;
const dbH=p=>`<rect class="dL" x="${R(p[0]-17)}" y="${R(p[1]-5)}" width="10" height="10" rx="3"/><rect class="dL" x="${R(p[0]+7)}" y="${R(p[1]-5)}" width="10" height="10" rx="3"/>`;
const kb=p=>`<path class="dG" d="M${R(p[0]-6)} ${R(p[1]+6)}Q${R(p[0])} ${R(p[1]-7)} ${R(p[0]+6)} ${R(p[1]+6)}"/><circle class="dK" cx="${R(p[0])}" cy="${R(p[1]+16)}" r="11"/>`;
const bench=(a,b,y=120)=>T([a+10,y],[a+10,160])+T([b-10,y],[b-10,160])+pad([a,y],[b,y],12);
const mat=(a=34,b=206)=>`<rect class="dM" x="${a}" y="154" width="${b-a}" height="6" rx="3"/>`;
/* Poste à poulie (vue de profil) à droite : x = bord avant, py = hauteur de la poulie */
const ctow=(x,py)=>`<rect class="dK" x="${x}" y="20" width="26" height="140" rx="5"/><rect class="dW" x="${x+5}" y="28" width="16" height="126" rx="3"/>`+(()=>{let s='';for(let i=0;i<7;i++)s+=`<rect class="dL" x="${x+7}" y="${103+i*7}" width="12" height="5" rx="1.5"/>`;return s;})()+pul([x-2,py]);

/* ---------- Gabarits de machines ---------- */
/* Presse assise (développés) : b = inclinaison du dossier, h = poignée, k = colonne ('s','sel','ins') sinon disques, pa = style Panatta */
function press(o={}){const y=o.y??118,b=o.b??10,h=o.h||[152,84],bs=[70,y-3],bt=go(bs,180+b,62);
  let s=base(24,206)+T([96,y+6],[96,160]);
  if(o.k){s+=tower(14,24,38,o.k)+T([52,30],[96,30])+T([96,30],[h[0]-4,h[1]-6])+gripV(h)+`<circle class="dLh" cx="96" cy="30" r="5"/>`;}
  else{const pv=o.pv||[94,26];s+=T([44,160],[44,38])+Tc(`M44 38Q44 ${pv[1]} ${pv[0]-14} ${pv[1]}`)+T([pv[0]-14,pv[1]],pv)+lever(pv,h,o.pa?{curve:[h[0]+8,pv[1]+8],at:.4,r:17,r2:12}:{})+gripV(h);
    if(o.pa)s+=T([170,160],[170,142])+plate([170,136],10);}
  return s+pad(bs,bt,13)+pad([66,y],[126,y],12);}
/* Rowing poitrine appuyée : h = poignée, k = colonne sinon disques */
function row(o={}){const h=o.h||[168,82];let s=base(30,214)+T([84,126],[84,160])+T([128,160],[128,96]);
  if(o.k){s+=tower(186,24,34,o.k)+T([186,30],[150,30])+T([150,30],[h[0],h[1]-6])+`<circle class="dLh" cx="150" cy="30" r="5"/>`;}
  else{const pv=o.pv||[182,24];s+=T([200,160],[200,34],pv)+lever(pv,h,{side:1,at:.5,off:18,...(o.pa?{curve:[pv[0]+10,h[1]-10],r2:12}:{})});}
  return s+gripV(h)+pad([60,120],[106,120],12)+pad([124,112],[134,58],13);}
/* Tirage vertical : k = colonne (barre au câble) sinon levier à disques par-dessus la tête */
function pull(o={}){let s=base(26,210)+T([88,132],[88,160]);
  if(o.k){s+=tower(150,22,44,o.k)+T([150,30],[66,30])+pul([62,36])+C([62,42],[62,62])+G([o.w?18:26,72],[o.w?28:34,64],[o.w?96:90,64],[o.w?106:98,72])+T([88,148],[150,148]);}
  else{const pv=[46,30],e=[o.w?134:124,44];s+=T([46,160],[46,30])+T([46,146],[88,146])+(o.pa?Tc(`M46 30Q${e[0]-20} 6 ${e[0]} ${e[1]}`):T(pv,e))+T(pv,[30,58])+plate([28,62],17)+(o.pa?plate([31,65],12):'')+`<circle class="dLh" cx="46" cy="30" r="5"/>`+G([e[0],e[1]-2],[e[0]-3,e[1]+22]);}
  return s+T([86,112],[86,126])+pad([66,106],[104,106],10)+pad([62,126],[114,126],12);}
/* Leg extension / leg curl assis : curl = rouleau derrière le mollet */
function legx(o={}){let s=base(26,212);const k=o.k;
  s+=T([104,128],[104,160]);
  if(k)s+=tower(18,26,36,k)+T([54,140],[104,140]);else s+=T([40,160],[40,110])+T([40,110],[66,110]);
  s+=pad([70,104],[58,48],13)+pad([66,116],[136,116],12);
  const kn=[140,112];s+=`<circle class="dLh" cx="${kn[0]}" cy="${kn[1]}" r="5"/>`+T([150,160],kn);
  if(o.curl){s+=T(kn,[166,138])+pad([150,96],[178,96],10)+pad([158,146],[178,132],13);}
  else{s+=T(kn,[150,150])+pad([140,152],[168,152],12);}
  if(!k)s+=T(kn,[176,98])+plate([182,92],16);
  return s+G([110,126],[110,138]);}
/* Presse inclinée 45° (traîneau sur rails) */
function press45(o={}){let s=base(22,218)+T([80,150],[204,40])+T([204,40],[204,160])+T([144,96],[144,160])+T([42,160],[56,144])+T([86,160],[78,145]);
  s+=pad([62,140],[34,104],13)+pad([52,142],[88,130],12);
  const sx=o.sx??168,sy=78-(sx-168)*.9;
  s+=`<g transform="rotate(-41.6 ${sx} ${sy})"><rect class="dK" x="${sx-24}" y="${sy-7}" width="48" height="14" rx="3"/></g>`;
  s+=`<g transform="rotate(48.4 ${sx-26} ${sy+2})"><rect class="dK" x="${sx-30}" y="${sy-22}" width="8" height="${o.small?26:46}" rx="2"/></g>`;
  return s+T([sx+8,sy-12],[sx+20,sy-2])+plate([sx+24,sy+3],15);}

/* ---------- Les dessins, machine par machine ---------- */
const D=Object.create(null);
const add=(names,fn)=>names.split('|').forEach(n=>{D[n]=fn;});

/* — Hammer Strength à disques — */
add('Développé couché Iso-Lateral',()=>press({b:10,h:[154,86]}));
add('Développé incliné Iso-Lateral',()=>press({b:28,h:[148,66]}));
add('Développé super incliné Iso-Lateral',()=>press({b:40,h:[138,52],pv:[90,22]}));
add('Développé décliné Iso-Lateral',()=>press({b:4,h:[156,104],pv:[96,34]}));
add('Pectoraux écartés Iso-Lateral (Wide Chest)',()=>press({b:12,h:[160,80],pv:[86,22]})+G([150,72],[170,72]));
add('Développé épaules Iso-Lateral',()=>press({b:6,h:[118,40],pv:[64,30]}));
add('Pullover machine',()=>{const pv=[92,62];return base(26,200)+T([96,124],[96,160])+T([44,160],[44,62],pv)+pad([70,115],[60,52],13)+pad([66,121],[124,121],12)+T(pv,[118,28])+pad([108,30],[130,22],11)+T(pv,[46,84])+plate([40,90],17)+`<circle class="dLh" cx="92" cy="62" r="5"/>`;});
add('Tirage vertical Iso-Lateral',()=>pull({}));
add('Tirage large Iso-Lateral (Wide Pulldown)',()=>pull({w:1}));
add('Rowing haut Iso-Lateral (High Row)',()=>row({h:[164,58]}));
add('Rowing Iso-Lateral',()=>row({h:[168,84]}));
add('Rowing bas Iso-Lateral (Low Row)',()=>row({h:[170,110],pv:[186,40]}));
add('Rowing D.Y. Iso-Lateral',()=>row({h:[170,98],pv:[190,30]})+G([164,98],[176,98]));
add('Rowing T-Bar',()=>base(24,214)+T([60,160],[150,96])+pad([142,96],[176,66],14)+T([150,96],[150,160])+T([40,160],[188,104])+G([180,94],[196,112])+T([150,122],[168,116])+plate([174,114],18)+`<circle class="dLh" cx="40" cy="160" r="5"/>`);
add('Shrug assis/debout machine',()=>base(26,214)+box(60,148,96,12,3)+T([48,160],[48,40],[120,40])+lever([48,40],[146,118],{side:1,at:.62,off:22})+gripV([146,118])+T([182,160],[182,96]));
add('Élévations latérales machine',()=>base(26,212)+T([104,126],[104,160])+pad([76,120],[132,120],12)+pad([144,110],[150,60],13)+T([150,96],[150,160])+T([44,160],[44,44],[96,44])+lever([96,44],[120,72],{side:1,at:.5,off:-28,r:16})+pad([112,62],[136,82],11));
add('Curl biceps assis',()=>base(26,212)+T([104,126],[104,160])+pad([76,120],[130,120],12)+T([150,160],[150,92])+pad([128,98],[164,80],13)+`<circle class="dLh" cx="168" cy="78" r="5"/>`+lever([168,78],[150,42],{side:1,at:-.6,off:2,r:17})+G([146,36],[158,48]));
add('Dips assis machine',()=>base(26,206)+T([92,124],[92,160])+pad([64,118],[124,118],12)+pad([68,114],[56,52],13)+T([42,160],[42,40],[92,40])+lever([92,40],[136,122],{side:1,at:.45,off:18})+G([132,120],[148,120]));
add('Squat Smith machine',()=>base(26,214)+T([110,160],[110,18])+T([130,160],[130,18])+T([104,18],[136,18])+T([104,74],[150,74])+plate([158,74],19)+T([110,92],[122,92])+pad([60,126],[170,126],12)+T([72,132],[72,160])+T([158,132],[158,160]));
add('Presse à cuisses linéaire',()=>press45({}));
add('Mollets presse',()=>press45({sx:182,small:1}));
add('Presse à cuisses Iso-Lateral',()=>base(22,218)+T([52,160],[60,128],[120,128])+pad([56,128],[110,128],12)+pad([58,124],[36,72],13)+T([196,160],[196,126])+`<circle class="dLh" cx="196" cy="126" r="5"/>`+T([196,126],[156,82])+`<g transform="rotate(-20 150 98)"><rect class="dK" x="146" y="70" width="8" height="52" rx="2"/></g>`+T([178,106],[192,94])+plate([196,90],16));
add('V-Squat',()=>base(22,218)+`<g transform="rotate(-12 126 150)"><rect class="dK" x="96" y="146" width="62" height="8" rx="3"/></g>`+T([198,160],[198,132])+`<circle class="dLh" cx="198" cy="132" r="5"/>`+T([198,132],[112,62])+pad([96,70],[126,52],12)+pad([86,46],[110,42],10)+T([140,85],[150,72])+plate([154,68],17)+G([118,38],[118,58]));
add('Hack squat',()=>base(22,218)+T([62,40],[178,152])+T([62,40],[62,160])+T([110,86],[110,160])+`<g transform="rotate(44 106 78)"><rect class="dK" x="84" y="72" width="44" height="14" rx="3"/></g>`+pad([98,98],[124,72],13)+pad([96,62],[114,46],10)+`<g transform="rotate(-18 176 146)"><rect class="dK" x="154" y="142" width="46" height="8" rx="3"/></g>`+T([90,72],[80,58])+plate([76,54],15));
add('Belt squat',()=>base(22,218)+box(70,144,92,16,3)+T([200,160],[200,128])+`<circle class="dLh" cx="200" cy="128" r="5"/>`+T([200,128],[108,96])+`<path class="dC" d="M116 99V128"/>`+pad([100,130],[132,130],8)+T([150,114],[150,104])+plate([150,98],16)+T([182,160],[182,70])+G([170,66],[192,66]));
add('Pendulum squat',()=>base(22,218)+T([50,160],[50,22],[96,22])+`<circle class="dLh" cx="96" cy="22" r="5"/>`+T([96,22],[124,110])+pad([110,118],[132,72],13)+pad([112,64],[134,56],10)+T([110,64],[84,50])+plate([78,46],16)+`<g transform="rotate(-16 160 148)"><rect class="dK" x="134" y="144" width="52" height="8" rx="3"/></g>`+T([160,148],[160,160]));
add('Leg extension machine',()=>legx({}));
add('Leg curl à genoux Iso-Lateral',()=>base(24,214)+T([96,160],[96,128])+pad([70,124],[122,124],13)+T([150,160],[150,88])+pad([126,80],[170,58],13)+G([170,56],[184,64])+`<circle class="dLh" cx="96" cy="128" r="5"/>`+T([96,128],[52,100])+pad([40,92],[62,104],11)+T([74,114],[66,90])+plate([64,84],16));
add('Mollets assis',()=>base(24,214)+box(56,112,58,10,5)+T([84,122],[84,160])+box(150,146,22,14,3)+T([196,160],[196,104])+`<circle class="dLh" cx="196" cy="104" r="5"/>`+T([196,104],[118,96])+pad([120,104],[150,104],12)+T([170,100],[170,86])+plate([170,80],16)+pad([66,108],[110,108],12));
add('Tibial machine',()=>base(24,214)+T([96,126],[96,160])+pad([66,120],[128,120],12)+pad([70,116],[60,56],13)+T([128,124],[170,140])+pad([150,130],[176,130],10)+pad([160,152],[184,152],10)+`<circle class="dLh" cx="170" cy="140" r="5"/>`+T([170,140],[196,112])+plate([200,106],15));
add('Nordic assisté',()=>base(24,214)+T([70,160],[70,128],[166,128],[166,160])+pad([76,124],[150,124],13)+T([60,128],[60,108])+pad([52,104],[70,104],10)+pad([52,118],[70,118],10)+T([166,128],[190,92])+plate([194,86],14));
add('Glute drive',()=>base(22,218)+box(40,132,60,8,3)+pad([44,128],[96,128],12)+pad([50,124],[36,92],13)+T([196,160],[196,108])+`<circle class="dLh" cx="196" cy="108" r="5"/>`+T([196,108],[110,104])+pad([102,112],[136,112],12)+T([160,106],[160,90])+plate([160,84],16)+box(140,150,40,10,3));
add('Reverse hyper',()=>base(24,214)+T([70,160],[70,92])+T([150,160],[150,92])+pad([60,92],[160,92],13)+G([166,90],[176,108])+`<circle class="dLh" cx="70" cy="104" r="5"/>`+T([70,104],[44,150])+pad([34,150],[56,150],10)+T([52,132],[34,120])+plate([30,118],15));
add('Crunch obliques',()=>base(24,212)+T([110,126],[110,160])+pad([80,120],[140,120],12)+pad([88,116],[78,58],13)+T([60,160],[60,40],[110,40])+lever([110,40],[146,76],{side:1,at:.4,off:-22,r:16})+pad([132,66],[156,90],12));

/* — Hammer Strength Select (colonne) — */
add('Tirage vertical Select',()=>pull({k:'sel'}));
add('Leg extension Select',()=>legx({k:'sel'}));
add('Abducteurs Select',()=>hip(1,'sel'));
add('Crunch abdominal Select',()=>crunchM('sel'));

/* — Life Fitness Insignia (colonne) — */
add('Presse pectorale Insignia',()=>press({k:'ins',b:8}));
add('Papillon / oiseau Insignia',()=>fly('ins'));
add('Tirage vertical Insignia',()=>pull({k:'ins'}));
add('Extension lombaires Insignia',()=>backx('ins'));
add('Élévations latérales Insignia',()=>tower(16,26,36,'ins')+base(24,206)+T([52,140],[104,140])+T([104,126],[104,160])+pad([76,120],[132,120],12)+pad([80,116],[70,56],13)+T([52,34],[100,34])+`<circle class="dLh" cx="100" cy="34" r="5"/>`+T([100,34],[124,72])+pad([116,62],[138,84],11));
add('Curl biceps Insignia',()=>tower(16,26,36,'ins')+base(24,206)+T([52,140],[100,140])+T([100,126],[100,160])+pad([72,120],[126,120],12)+T([150,160],[150,92])+pad([128,98],[164,80],13)+T([52,34],[168,34],[168,78])+`<circle class="dLh" cx="168" cy="78" r="5"/>`+T([168,78],[152,42])+G([146,38],[160,46]));
add('Dips / tractions assistés Insignia',()=>assist('ins'));
add('Leg extension Insignia',()=>legx({k:'ins'}));
add('Leg curl Insignia',()=>legx({k:'ins',curl:1}));
add('Mollets Insignia',()=>calfS('ins'));
add('Fessiers Insignia',()=>tower(16,26,36,'ins')+base(24,214)+T([52,150],[150,150])+box(110,146,40,10,3)+T([150,160],[150,70])+pad([130,90],[158,64],13)+G([154,60],[176,60])+`<circle class="dLh" cx="128" cy="112" r="5"/>`+T([52,34],[128,34],[128,112])+T([128,112],[86,124])+pad([78,116],[90,138],11));
add('Abducteurs Insignia',()=>hip(1,'ins'));
add('Adducteurs Insignia',()=>hip(0,'ins'));
add('Crunch abdominal Insignia',()=>crunchM('ins'));

/* — Panatta Freeweight Special — */
add('Tirage vertical convergent (Super Lat Machine)',()=>pull({pa:1}));
add('Rowing bas (Super Low Row)',()=>row({h:[170,108],pv:[188,40],pa:1}));
add('Développé vertical (Super Vertical Chest Press)',()=>press({b:8,h:[154,84],pa:1}));
add('Développé incliné (Super Inclined Chest Press)',()=>press({b:30,h:[146,62],pa:1}));
add('Développé décliné (Super Declined Chest Press)',()=>press({b:4,h:[156,104],pv:[96,34],pa:1}));
add('Rowing haut (Super High Row)',()=>row({h:[164,56],pa:1}));
add('Rowing puissance (Super Power Row)',()=>row({h:[170,94],pv:[190,28],pa:1})+G([162,94],[178,94]));
add('Rowing (Super Rowing)',()=>base(24,214)+T([60,160],[150,100])+pad([140,100],[174,70],14)+T([150,100],[150,160])+Tc('M40 160Q120 150 188 104')+G([180,94],[196,112])+T([140,138],[156,128])+plate([160,126],18)+plate([164,129],12)+`<circle class="dLh" cx="40" cy="160" r="5"/>`);
add('Pullover (Super Pullover)',()=>{const pv=[92,62];return base(26,200)+T([96,124],[96,160])+T([44,160],[44,62],pv)+pad([70,115],[60,52],13)+pad([66,121],[124,121],12)+Tc('M92 62Q124 56 120 26')+pad([110,30],[132,22],11)+T(pv,[46,84])+plate([40,90],17)+plate([43,93],12)+`<circle class="dLh" cx="92" cy="62" r="5"/>`;});
add('Écarté bas (Super Lower Chest Flight)',()=>press({b:12,h:[150,104],pv:[100,140],pa:1}));
add('Développé horizontal multi (Super Horizontal Multi Press)',()=>press({b:14,h:[156,90],pa:1})+G([146,90],[166,90]));
add('Développé vertical multi (Super Vertical Multi Press)',()=>press({b:6,h:[116,38],pv:[62,30],pa:1}));

/* — Machines guidées (colonne) et postes à poulie — */
function fly(k){return tower(16,26,36,k)+base(24,180)+T([52,148],[120,148])+T([120,129],[120,160])+T([52,92],[86,92])+T([52,32],[110,32])+Tc('M110 32Q132 32 130 50')+`<circle class="dLh" cx="110" cy="32" r="5"/>`+pad([90,116],[90,56],12)+pad([96,123],[146,123],12)+pad([130,96],[130,48],11);}
function hip(abd,k){let s=tower(98,20,44,k)+base(40,200)+T([120,132],[120,160]);
  s+=`<rect class="dPu" x="102" y="55" width="36" height="58" rx="10"/><rect class="dP" x="102" y="52" width="36" height="58" rx="10"/>`;
  s+=`<rect class="dPu" x="88" y="119" width="64" height="12" rx="6"/><rect class="dP" x="88" y="116" width="64" height="12" rx="6"/>`;
  const xs=abd?[70,170]:[102,138];
  s+=T([xs[0],130],[xs[0],146])+T([xs[1],130],[xs[1],146])+`<rect class="dPu" x="${xs[0]-6}" y="99" width="12" height="34" rx="6"/><rect class="dP" x="${xs[0]-6}" y="96" width="12" height="34" rx="6"/><rect class="dPu" x="${xs[1]-6}" y="99" width="12" height="34" rx="6"/><rect class="dP" x="${xs[1]-6}" y="96" width="12" height="34" rx="6"/>`;
  return s+T([xs[0],146],[120,146],[xs[1],146]);}
function crunchM(k){return tower(16,26,36,k)+base(24,206)+T([52,140],[104,140])+T([104,126],[104,160])+pad([76,120],[132,120],12)+pad([82,116],[72,56],13)+T([52,34],[96,34])+`<circle class="dLh" cx="96" cy="34" r="5"/>`+T([96,34],[124,58])+pad([114,50],[134,76],12)+G([128,44],[138,62]);}
function backx(k){return tower(16,26,36,k)+base(24,206)+T([52,140],[104,140])+T([104,126],[104,160])+pad([76,120],[132,120],12)+box(136,140,20,8,3)+T([146,148],[146,160])+T([52,104],[84,104])+pad([84,116],[74,62],13)+T([84,104],[62,48])+pad([48,46],[70,46],13)+`<circle class="dLh" cx="84" cy="104" r="5"/>`;}
function assist(k){return tower(16,22,36,k)+base(24,214)+T([52,30],[150,30],[150,160])+G([136,26],[160,26])+T([110,60],[150,60])+G([118,92],[150,92])+T([52,120],[90,120])+pad([70,116],[120,116],12)+box(120,146,30,8,3);}
function calfS(k){return tower(16,22,36,k)+base(24,206)+T([52,30],[110,30])+`<circle class="dLh" cx="110" cy="30" r="5"/>`+T([110,30],[116,70])+pad([104,72],[132,72],12)+G([120,66],[140,58])+box(96,146,40,10,3)+T([52,152],[96,152]);}
add('Pec deck (papillon)',()=>fly('s'));
add('Oiseau machine (reverse pec deck)',()=>tower(16,26,36,'s')+base(24,190)+T([52,148],[110,148])+T([110,129],[110,160])+pad([86,123],[136,123],12)+T([150,160],[150,104])+pad([144,110],[150,56],12)+T([52,32],[100,32])+Tc('M100 32Q170 30 172 60')+`<circle class="dLh" cx="100" cy="32" r="5"/>`+G([172,60],[172,86]));
add('Presse pectorale assise',()=>press({k:'s',b:8}));
add('Développé épaules machine',()=>press({k:'s',b:6,h:[118,42]}));
add('Tirage vertical machine (Lat Pulldown)',()=>pull({k:'s'}));
add('Tirage vertical',()=>pull({k:'s',w:1}));
add('Tractions assistées',()=>assist('s'));
add('Rowing assis machine',()=>row({k:'s',h:[166,84]}));
add('Tirage horizontal',()=>ctow(196,140)+base(20,214)+pad([40,118],[140,118],12)+T([60,124],[60,160])+T([124,124],[124,160])+`<g transform="rotate(-20 168 136)"><rect class="dK" x="164" y="118" width="8" height="36" rx="2"/></g>`+C([194,140],[176,112])+G([166,104],[176,112],[166,120]));
add('Extension lombaires machine',()=>backx('s'));
add('Curl machine',()=>tower(16,26,36,'s')+base(24,206)+T([52,140],[100,140])+T([100,126],[100,160])+pad([72,120],[126,120],12)+T([150,160],[150,92])+pad([128,98],[164,80],13)+T([52,34],[168,34],[168,78])+`<circle class="dLh" cx="168" cy="78" r="5"/>`+T([168,78],[152,42])+G([146,38],[160,46]));
add('Extension triceps machine',()=>tower(16,26,36,'s')+base(24,206)+T([52,140],[100,140])+T([100,126],[100,160])+pad([72,120],[126,120],12)+pad([76,116],[66,58],13)+T([150,160],[150,96])+pad([128,96],[162,84],13)+T([52,34],[132,34],[164,82])+`<circle class="dLh" cx="164" cy="82" r="5"/>`+T([164,82],[176,108])+G([170,110],[184,104]));
add('Crunch machine',()=>crunchM('s'));
add('Rotation du buste machine',()=>tower(150,26,40,'s')+base(30,206)+T([96,132],[96,160])+T([96,148],[150,148])+`<rect class="dPu" x="70" y="121" width="56" height="12" rx="6"/><rect class="dP" x="70" y="118" width="56" height="12" rx="6"/>`+T([98,118],[98,60])+`<ellipse class="dK" cx="98" cy="114" rx="22" ry="5"/>`+pad([84,90],[112,90],12)+pad([80,60],[116,60],10)+G([76,70],[76,84])+G([120,70],[120,84]));
add('Abducteurs machine',()=>hip(1,'s'));
add('Adducteurs machine',()=>hip(0,'s'));
add('Leg extension',()=>legx({k:'s'}));
add('Leg curl assis',()=>legx({k:'s',curl:1}));
add('Leg curl',()=>legx({curl:1}));
add('Leg curl allongé',()=>tower(16,26,36,'s')+base(24,214)+T([52,140],[90,140])+T([90,110],[90,160])+T([170,108],[170,160])+pad([70,106],[110,104],13)+pad([110,104],[184,94],13)+G([176,82],[194,82])+`<circle class="dLh" cx="64" cy="100" r="5"/>`+T([52,34],[64,34],[64,100])+T([64,100],[50,82])+pad([40,76],[60,76],11));
add('Presse à cuisses',()=>tower(194,24,34,'s')+base(20,228)+T([40,160],[50,130],[120,130])+pad([46,128],[108,128],12)+pad([50,124],[32,76],13)+box(166,74,10,62,2)+T([176,104],[194,104])+T([70,150],[184,150]));
add('Mollets debout',()=>calfS('s'));

/* — Cardio — */
const tread=inc=>{const g=inc?`transform="rotate(-8 120 146)"`:'';return `<g ${g}><rect class="dK" x="24" y="138" width="180" height="15" rx="7.5"/><rect class="dS" x="34" y="138" width="150" height="3" rx="1.5"/><path class="dK" d="M162 138Q164 120 196 122L210 138Z"/></g>`+T([40,152],[40,160])+T([196,146],[196,160])+T([190,128],[178,58])+G([180,76],[130,84])+pad([150,46],[200,36],22)+scr(160,36,30,10).replace('rect','rect transform="rotate(-11 175 41)"');};
add('Tapis de course',()=>tread(0));
add('Marche inclinée',()=>tread(1)+'<path class="dC" d="M60 112L150 98"/>');
add('PowerMill Climber',()=>base(30,210)+`<path class="dK" d="M50 160L60 120H90V100H120V80H150V60H168L178 160Z"/>`+'<path class="dC2" d="M60 120H90V100H120V80H150V60H168"/>'+T([176,150],[182,40])+pad([166,30],[204,24],18)+G([150,56],[176,52])+G([150,70],[176,66]));
add('Escalier (stepper)',()=>base(40,200)+box(60,140,110,20,6)+T([150,140],[150,50])+pad([134,40],[176,34],18)+G([110,72],[150,64])+`<g transform="rotate(-16 100 128)"><rect class="dK" x="76" y="124" width="46" height="8" rx="3"/></g><g transform="rotate(12 110 118)"><rect class="dL" x="90" y="114" width="40" height="7" rx="3"/></g>`+T([100,128],[100,140]));
add('Vélo droit',()=>base(50,190)+`<circle class="dK" cx="92" cy="122" r="22"/><circle class="dLh" cx="92" cy="122" r="6"/>`+T([80,160],[92,122])+T([92,122],[86,72])+pad([72,68],[102,64],10)+T([92,122],[150,92],[154,56])+pad([140,54],[168,50],12)+G([152,46],[172,40])+T([150,160],[150,108])+T([92,122],[104,140]));
add('Vélo semi-allongé',()=>base(30,210)+box(56,130,100,12,6)+pad([60,108],[110,108],13)+pad([62,104],[46,58],14)+T([84,114],[84,130])+`<circle class="dK" cx="168" cy="118" r="20"/><circle class="dLh" cx="168" cy="118" r="6"/>`+T([156,130],[180,106])+T([168,138],[168,160])+T([130,130],[146,80])+pad([138,74],[160,70],10)+G([112,102],[130,96]));
add('Elliptique',()=>base(24,216)+`<circle class="dK" cx="56" cy="128" r="22"/><circle class="dLh" cx="56" cy="128" r="6"/>`+T([56,128],[170,150])+`<g transform="rotate(10 126 140)"><rect class="dL" x="110" y="136" width="34" height="7" rx="3"/></g>`+T([170,160],[176,64])+T([176,64],[150,30])+T([176,64],[194,40])+G([146,26],[156,36])+pad([164,62],[196,56],14)+T([128,138],[160,96],[176,76]));
add('Rameur',()=>base(16,224)+T([30,150],[190,138])+`<circle class="dK" cx="194" cy="118" r="24"/><circle class="dS" cx="194" cy="118" r="8"/>`+pad([84,134],[112,132],10)+`<g transform="rotate(-50 160 130)"><rect class="dK" x="150" y="126" width="22" height="7" rx="3"/></g>`+C([170,112],[140,112])+G([136,104],[136,120])+T([30,150],[30,160])+T([190,142],[190,160])+T([178,96],[184,76])+box(176,62,20,14,3));
add('Assault bike',()=>base(30,220)+`<circle class="dK" cx="176" cy="112" r="30"/><circle class="dW" cx="176" cy="112" r="22"/><path class="dC2" d="M176 90V134M154 112H198M160 96L192 128M192 96L160 128"/>`+T([60,160],[96,118],[86,74])+pad([72,70],[102,66],11)+T([96,118],[150,160])+T([96,118],[146,96])+T([140,104],[120,40])+G([110,36],[130,42])+scr(150,62,14,8));
add('SkiErg',()=>box(96,14,48,52,6)+`<circle class="dS" cx="120" cy="40" r="11"/>`+T([120,66],[120,160])+box(70,150,100,10,3)+C([108,62],[96,104])+C([132,62],[144,104])+G([96,104],[96,124])+G([144,104],[144,124]));

/* ---------- Poids libres, poids du corps, poulies (avec silhouette) ---------- */
/* Pectoraux */
add('Développé couché',()=>{const f=F(150,110,-90,75,-5,70,-10,180,180,184,178);return T([86,160],[86,58])+G([80,60],[86,66])+bench(70,162,121)+fig(f)+bb(f.hN);});
add('Développé couché haltères',()=>{const f=F(150,110,-90,75,-5,70,-10,178,178,182,182);return bench(70,162,121)+f.far+db(f.hF,1)+f.mid+f.near+db(f.hN);});
add('Développé incliné barre',()=>{const f=F(140,116,-135,85,10,80,8,180,180,184,178);return T([108,160],[100,36])+G([92,40],[100,46])+T([140,124],[140,160])+T([140,160],[78,160])+pad([120,124],[160,124],12)+pad(go([140,124],-135,-4),go([140,124],-135,62),13)+fig(f)+bb(f.hN);});
add('Développé incliné haltères',()=>{const f=F(140,116,-135,85,10,80,8,178,178,182,182);return T([140,124],[140,160])+T([140,160],[78,160])+pad([120,124],[160,124],12)+pad(go([140,124],-135,-4),go([140,124],-135,62),13)+f.far+db(f.hF,1)+f.mid+f.near+db(f.hN);});
add('Développé décliné',()=>{const f=F(150,100,-74,55,-30,50,-35,180,180,184,178);return T([86,160],[86,62])+G([80,64],[86,70])+T([100,124],[100,160])+T([160,112],[160,160])+pad([60,120],[166,108],12)+pad([170,124],[184,124],10)+fig(f)+bb(f.hN);});
add('Pompes',()=>{const f=F(124,124,116,-64,-64,-66,-66,4,-6,0,0,{toe:false});return mat()+fig(f);});
add('Écarté poulie',()=>{const f=FF(120,{aL:[96,92],aR:[96,92],lg:14});return `<rect class="dK" x="14" y="20" width="22" height="140" rx="5"/><rect class="dK" x="204" y="20" width="22" height="140" rx="5"/>`+pul([38,64])+pul([202,64])+C([38,64],f.hL)+C([202,64],f.hR)+f.s+G([f.hL[0],f.hL[1]-8],[f.hL[0],f.hL[1]+8])+G([f.hR[0],f.hR[1]-8],[f.hR[0],f.hR[1]+8]);});
add('Écarté poulie vis-à-vis',()=>{const f=FF(120,{aL:[40,60],aR:[40,60],lg:14});return `<rect class="dK" x="14" y="16" width="22" height="144" rx="5"/><rect class="dK" x="204" y="16" width="22" height="144" rx="5"/>`+pul([38,26])+pul([202,26])+C([38,26],f.hL)+C([202,26],f.hR)+f.s+G([f.hL[0]-6,f.hL[1]],[f.hL[0]+6,f.hL[1]])+G([f.hR[0]-6,f.hR[1]],[f.hR[0]+6,f.hR[1]]);});
/* Dos */
add('Tractions',()=>{const f=F(112,98,180,20,-50,25,-55,150,200,140,200);return T([60,12],[196,12])+T([190,12],[190,160])+fig(f);});
add('Rowing barre',()=>{const f=F(100,90,125,18,-12,12,-8,-26,0,-32,4);return fig(f)+bb(f.hN);});
add('Soulevé de terre',()=>{const f=F(100,112,125,72,-14,68,-18,2,0,0,0);return fig(f)+bb([f.hN[0],141]);});
add('Rowing haltère unilatéral',()=>{const f=F(98,88,96,0,-90,5,0,30,-30,-22,0,{toe:false});return bench(54,170,124)+fig(f)+db(f.hN);});
add('Shrugs haltères',()=>{const f=FF(120,{aL:[10,0],aR:[10,0]});return f.s+dbV([f.hL[0],f.hL[1]+2])+dbV([f.hR[0],f.hR[1]+2]);});
add('Hyperextension (banc lombaires)',()=>{const f=F(114,104,135,-45,-45,-45,-45,60,-60,70,-70,{toe:false});return T([60,160],[90,140],[140,110])+T([140,110],[140,160])+pad([104,124],[130,98],13)+pad([56,150],[74,140],9)+box(46,150,24,8,3)+fig(f);});
/* Épaules */
add('Développé militaire',()=>{const f=F(120,101,180,-4,2,4,-2,166,176,168,176,{k:.82});return fig(f)+bb(f.hN,13);});
add('Élévations latérales',()=>{const f=FF(120,{aL:[86,88],aR:[86,88]});return f.s+db(f.hL)+db(f.hR);});
add('Oiseau',()=>{const f=FF(120,{hy:96,tl:18,head:[120,82],aL:[80,84],aR:[80,84],lg:10,kn:3});return f.s+db(f.hL)+db(f.hR);});
add('Développé épaules haltères',()=>{const f=FF(120,{aL:[90,180],aR:[90,180]});return f.s+dbH(f.hL)+dbH(f.hR);});
add('Élévations frontales',()=>{const f=F(120,88,180,-4,2,4,-2,8,4,90,90);return f.far+db(f.hF,1)+f.mid+f.near+db(f.hN);});
add('Face pull',()=>{const f=F(112,88,180,-6,2,8,-2,100,-150,96,-150);return ctow(200,50)+C([198,50],f.hN)+fig(f)+G([f.hN[0],f.hN[1]-8],[f.hN[0],f.hN[1]+8]);});
/* Bras */
add('Curl barre',()=>{const f=F(118,88,180,-4,2,4,-2,6,96,4,100);return fig(f)+bb(f.hN,16);});
add('Curl haltères',()=>{const f=F(118,88,180,-4,2,4,-2,4,6,4,112);return f.far+db(f.hF,1)+f.mid+f.near+db(f.hN);});
add('Curl marteau',()=>{const f=F(118,88,180,-4,2,4,-2,4,6,4,112);return f.far+f.mid+f.near+dbV(f.hN);});
add('Barre au front',()=>{const f=F(150,110,-90,75,-5,70,-10,190,-80,194,-84);return bench(70,162,121)+fig(f)+bb(f.hN,16);});
add('Curl pupitre (Larry Scott)',()=>{const f=F(96,120,172,85,0,80,0,60,166,62,160);return T([140,160],[140,108])+pad([112,92],[146,112],12)+T([96,126],[96,160])+pad([76,126],[116,126],11)+fig(f)+bb(f.hN,15);});
add('Curl concentré',()=>{const f=F(96,118,140,88,-4,80,0,10,16,8,150);return bench(56,130,128)+fig(f)+db(f.hN);});
add('Extension triceps nuque haltère',()=>{const f=F(120,100,180,-4,2,4,-2,172,-26,176,-30,{k:.86});return f.far+f.mid+f.near+dbV(f.hN);});
add('Curl poignets',()=>{const f=F(92,118,150,88,0,86,0,40,86,36,86);return bench(52,128,128)+fig(f)+bb(f.hN,14);});
add('Triceps poulie',()=>{const f=F(112,88,172,-6,2,8,-2,6,30,4,26);return ctow(196,28)+C([194,28],f.hN)+fig(f)+G([f.hN[0]-6,f.hN[1]],[f.hN[0]+8,f.hN[1]]);});
add('Dips',()=>{const f=F(120,92,170,10,-70,14,-74,2,0,0,0,{toe:false});return T([70,105],[176,105])+T([84,105],[84,160])+T([164,105],[164,160])+fig(f);});
add('Curl poulie basse',()=>{const f=F(112,88,180,-6,2,8,-2,4,150,4,150);return ctow(196,150)+C([194,150],f.hN)+fig(f)+G([f.hN[0]-6,f.hN[1]],[f.hN[0]+8,f.hN[1]]);});
add('Kickback triceps poulie',()=>{const f=F(110,88,120,14,-6,8,-4,30,10,-50,-90);return ctow(196,150)+C([194,150],f.hN)+fig(f);});
/* Jambes */
add('Squat',()=>{const f=F(100,123,145,88,-18,85,-20,-56,124,-60,121);return fig(f)+bb([f.s[0]-12,f.s[1]+4],16);});
add('Front squat',()=>{const f=F(100,122,160,88,-16,85,-18,86,-115,88,-115);return fig(f)+bb([f.s[0]+16,f.s[1]+6],15);});
add('Fentes',()=>{const f=F(118,112,180,-30,-80,70,0,-30,60,-34,60);return fig(f);});
add('Fentes bulgares',()=>{const f=F(124,110,176,-22,-100,72,0,2,0,0,0,{toe:false});return bench(36,100,122)+f.far+db(f.hF,1)+f.mid+f.near+db(f.hN);});
add('Step-up',()=>{const f=F(112,88,180,-10,0,75,-10,6,0,-4,0);return box(126,134,72,26,5)+fig(f);});
add('Soulevé de terre roumain',()=>{const f=F(98,88,110,6,-6,3,-4,2,0,0,0);return fig(f)+bb(f.hN);});
add('Good morning',()=>{const f=F(98,88,100,6,-8,3,-6,-60,140,-64,136);return fig(f)+bb([f.s[0]-2,f.s[1]-6]);});
/* Fessiers */
add('Hip thrust',()=>{const f=F(128,110,-90,70,-5,66,-8,120,90,124,86);return bench(40,92,116)+fig(f)+bb([128,92]);});
add('Kickback fessier poulie',()=>{const f=F(112,90,170,-40,-10,4,0,60,40,56,40);return ctow(196,150)+C([194,150],f.fF)+fig(f);});
/* Abdos */
add('Crunch',()=>{const f=F(112,150,-115,150,20,146,22,-150,60,-146,58);return mat()+fig(f);});
add('Gainage',()=>{const f=F(121,139,104.5,-75.5,-75.5,-76,-76,4,90,0,90,{toe:false});return mat()+fig(f);});
add('Relevé de jambes',()=>{const f=F(120,110,180,90,90,90,90,180,180,180,180,{toe:false});return T([60,18],[196,18])+T([190,18],[190,160])+fig(f);});
add('Crunch poulie',()=>{const f=F(110,122,140,0,-90,0,-90,170,-60,166,-64,{toe:false});return ctow(196,26)+C([194,26],f.hN)+mat(50,190)+fig(f);});
add('Roue abdominale',()=>{const f=F(100,118,110,-20,-90,-20,-90,50,50,48,50,{toe:false});return mat()+fig(f)+`<circle class="dK" cx="${R(f.hN[0])}" cy="147" r="13"/><circle class="dLh" cx="${R(f.hN[0])}" cy="147" r="4"/>`;});
add('Russian twist',()=>{const f=F(110,148,-150,130,60,126,62,100,130,96,126,{toe:false});return mat()+fig(f)+plate(f.hN,13);});
add('Relevé de genoux chaise romaine',()=>{const f=F(108,104,180,100,0,96,0,0,90,0,90,{toe:false});return T([86,160],[86,36])+T([86,150],[150,150])+pad([94,108],[94,52],12)+pad([90,92],[140,92],10)+G([140,86],[146,92])+f.far+f.mid+f.near;});
/* Corps entier et haltérophilie */
add('Arraché (snatch)',()=>{const f=F(104,128,165,88,-18,84,-22,172,180,176,180,{k:.8});return fig(f)+bb(f.hN,13);});
add('Épaulé (power clean)',()=>{const f=F(110,102,168,40,-30,36,-26,86,-115,88,-115,{k:.92});return fig(f)+bb([f.s[0]+15,f.s[1]+6],15);});
add('Épaulé-jeté',()=>{const f=F(116,110,180,-40,-26,48,0,180,180,182,180,{k:.8});return fig(f)+bb(f.hN,13);});
add('Push press',()=>{const f=F(116,108,176,26,-24,22,-20,140,176,144,172,{k:.82});return fig(f)+bb(f.hN,15);});
add('Thruster',()=>{const f=F(100,122,158,88,-16,85,-18,86,-115,88,-115);return f.far+f.mid+f.near+db([f.s[0]+13,f.s[1]-3]);});
add('Kettlebell swing',()=>{const f=F(108,90,172,-4,8,8,4,88,92,90,90);return fig(f)+kb(f.hN);});
add('Farmer walk',()=>{const f=F(120,90,180,-24,-8,22,4,2,0,-2,0);return f.far+kb(f.hF)+f.mid+f.near+kb(f.hN);});
add('Pull-over poulie',()=>{const f=F(100,88,150,-6,4,4,0,128,128,124,124);return ctow(200,24)+C([198,24],f.hN)+fig(f)+G([f.hN[0]-6,f.hN[1]+4],[f.hN[0]+6,f.hN[1]-4]);});

/* ---------- Ce que le reste de l'appli utilise ---------- */
/* Le dessin d'un exercice (ou '' s'il n'en a pas : exercice perso → ancien pictogramme) */
export function dessin(n){const f=D[n];if(!f)return '';
  return `<svg class="dx" viewBox="12 4 216 164" aria-hidden="true"><circle cx="120" cy="96" r="82" fill="url(#fxH)"/><ellipse class="dF" cx="120" cy="162" rx="96" ry="6"/>${f()}</svg>`;}
export const aDessin=n=>!!D[n];
export const NOMS_DESSINES=()=>Object.keys(D);
/* Dégradés et couleurs partagés par tous les dessins : à placer UNE fois dans la page */
export const DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="fxP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset=".55" stop-color="#818cf8"/><stop offset="1" stop-color="#c084fc"/></linearGradient>
<radialGradient id="fxH"><stop offset="0" stop-color="#818cf8" stop-opacity=".2"/><stop offset="1" stop-color="#818cf8" stop-opacity="0"/></radialGradient></defs>
<style>
.dx .dT{fill:none;stroke:#2b3255;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
.dx .dH{fill:none;stroke:#fff;stroke-opacity:.2;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.dx .dP{fill:url(#fxP)}.dx .dPu{fill:#3730a3;fill-opacity:.35}
.dx .dK{fill:#3a4268;stroke:#2b3255;stroke-width:2;stroke-linejoin:round}.dx .dKi{fill:#e4e8f5;stroke:#2b3255;stroke-width:2}
.dx .dW{fill:#232a4a}.dx .dL{fill:#c3cae2;stroke:#7e88ab;stroke-width:2}.dx .dLf{fill:#dde2f2;stroke:#a3abc8;stroke-width:2}
.dx .dLr{fill:none;stroke:#7e88ab;stroke-width:1.5}.dx .dLh{fill:#2b3255}
.dx .dU{fill:#c3cae2;stroke:#2b3255;stroke-width:2}
.dx .dG{fill:none;stroke:#0b1022;stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.dx .dC{fill:none;stroke:#6b7493;stroke-width:1.8;stroke-dasharray:4 3;stroke-linecap:round}.dx .dC2{fill:none;stroke:#6b7493;stroke-width:1.5}
.dx .dS{fill:#5eead4}.dx .dF{fill:#4f46e5;fill-opacity:.12}.dx .dM{fill:#c7cdf0}
.dx .dB,.dx .dBf,.dx .dBa{fill:none;stroke-linecap:round;stroke-linejoin:round}.dx .dB{stroke:#6a71ec}.dx .dBf{stroke:#b3b8f6}.dx .dBa{stroke:#454cc9}
.dx .dBh,.dx .dBr{fill:#6a71ec}
</style></svg>`;
