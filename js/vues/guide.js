/* Fluxe Suivi — Écran Guide « ? » : bibliothèque des machines et carte Ma salle.
   Trois réglages SÉPARÉS (avant, tout était mélangé dans une seule rangée de boutons) :
   - gv : la vue  → 'salle' (mes machines), 'tout' (toutes) ou 'cat' (catalogues d'enseignes)
   - gc : le catalogue affiché quand gv = 'cat' → C1 (⭐ On Air) ou C2 (autres enseignes)
   - gm : le muscle → 'Tous' ou un muscle (Pectoraux, Dos…), valable dans toutes les vues */
import {VER} from '../config.js';
import {C1,C2,LIB,M,ONAIR,OTHERCAT,whoHas} from '../catalogue.js';
import {S} from '../etat.js';
import {esc,norm} from '../outils.js';
import {chainOf,gymCur,inGym,vis} from '../salle.js';
import {thumb} from '../icones.js';

export let gq='',gm='Tous',gv='tout',gc=C1;
export function setGq(v){gq=v}
export function setGm(v){gm=M.includes(v)?v:'Tous'}
export function setGv(v){gv=['salle','tout','cat'].includes(v)?v:'tout'}
export function setGc(v){gc=v===C2?C2:C1}

/* Une ligne de la bibliothèque : dessin, nom, muscle, étiquette de marque, bouton ✓ / + */
function row([n,m,tg]){
  const g=gymCur(),on=g&&inGym(n);
  const who=gv==='cat'&&gc===C2&&whoHas(n).length?`<small class="who">${esc(whoHas(n).join(' · '))}</small>`:'';
  const btn=g?`<button class="tg${on?' on':''}" data-act="gtog" data-n="${esc(n)}" aria-pressed="${!!on}" aria-label="${on?'Retirer de':'Ajouter à'} ${esc(g.name)} : ${esc(n)}">${on?'✓':'+'}</button>`:'';
  return `<div class="gi${on?' in':''}">${thumb(n,'lg')}<div class="pt"><b>${esc(n)}</b><span>${esc(m)}${tg?` <em class="mk">${esc(tg)}</em>`:''}</span>${who}</div>${btn}</div>`;
}

export function glist(){
  const g=gymCur();
  if(!g&&gv!=='tout')gv='tout'; /* sans salle : seulement « Toutes » */
  const q=norm(gq),garde=([n,m])=>norm(n).includes(q)&&(gm==='Tous'||m===gm);
  /* Catalogue d'enseigne : rangé par familles de machines */
  if(gv==='cat'){
    const L=n=>LIB.find(x=>x[0]===n),seen=new Set();
    return (gc===C1?ONAIR:OTHERCAT).groups.map(gr=>{
      const l=gr.eq().filter(n=>!seen.has(n)&&seen.add(n)).map(L).filter(Boolean).filter(garde);
      return l.length?`<h2 class="cg">${esc(gr.t)}<small>${l.length}</small></h2>${l.map(row).join('')}`:'';
    }).join('')||'<p class="empty">Aucune machine pour ce choix.</p>';
  }
  const l=LIB.filter(x=>vis(x[0])&&(gv!=='salle'||inGym(x[0]))&&garde(x));
  if(l.length)return l.map(row).join('');
  return `<p class="empty">${gv==='salle'&&!g.eq.length?'Aucune machine cochée pour l’instant. Va dans « Toutes » et touche + sur les machines de ta salle.':'Aucune machine pour ce choix.'}</p>`;
}

/* Carte « Ma salle » en haut du Guide */
export function gymCard(){
  const g=gymCur();
  if(!S.gyms.length)return `<div class="card gym"><div class="hist-date">🏋️ Ma salle</div><div class="mu">Crée ta salle : tu coches ses machines, tu ne vois qu’elles pendant ta séance, et tes réglages (siège, hauteur…) lui sont propres.</div><button class="btn" data-act="gnew">Créer ma salle</button></div>`;
  const ch=chainOf(g),nb=g?g.eq.length:0;
  return `<div class="card gym"><div class="hist-date">🏋️ ${g?esc(g.name):'Aucune salle choisie'}</div>
<div class="mu">${g?`${nb} machine${nb>1?'s':''}${ch?' · modèle '+esc(ch.name)+', à vérifier sur place':''}`:'Choisis la salle où tu t’entraînes.'}</div>
<div class="chips">${S.gyms.map(x=>`<button class="chip${x.id===S.gym?' on':''}" data-act="gsel" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}<button class="chip" data-act="gsel" data-id="">Aucune</button><button class="chip" data-act="gnew">+ Nouvelle</button></div>
${g?`<div class="lk"><button class="del" style="color:var(--accent)" data-act="gren">Renommer</button><button class="del" data-act="gdel">Supprimer</button></div>`:''}</div>`;
}

/* Interrupteur à plusieurs positions (une seule active) */
const seg=(act,cur,l)=>`<div class="seg" role="group">${l.map(([v,t])=>`<button class="${cur===v?'on':''}" data-act="${act}" data-v="${esc(v)}" aria-pressed="${cur===v}">${esc(t)}</button>`).join('')}</div>`;

export function viewGuide(){
  const g=gymCur();
  if(!g&&gv!=='tout')gv='tout';
  const vues=g?seg('gv',gv,[['salle','Ma salle'],['tout','Toutes'],['cat','Catalogues']]):'';
  const cats=g&&gv==='cat'?`<div class="chips cats">${[[C1,'⭐ On Air'],[C2,'Autres enseignes']].map(([v,t])=>`<button class="chip${gc===v?' on':''}" data-act="gc" data-v="${esc(v)}">${t}</button>`).join('')}</div>`:'';
  const muscles=`<div class="chips">${['Tous',...M].map(m=>`<button class="chip${gm===m?' on':''}" data-act="gm" data-m="${esc(m)}">${m==='Tous'?'Tous les muscles':esc(m)}</button>`).join('')}</div>`;
  return `<h1>Guide</h1><p class="sub">Repère les machines de ta salle. Chaque dessin montre le type de machine.</p>${gymCard()}
${vues}${cats}<input id="gq" placeholder="Rechercher une machine" value="${esc(gq)}" autocomplete="off" aria-label="Rechercher une machine">${muscles}<div id="gl">${glist()}</div><p class="mu" style="text-align:center;margin-top:18px">Fluxe v${VER}</p>`;
}
