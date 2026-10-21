function palImage(id,stage){const form=state.rewards?.pagePalCatalog?.[id]?.[stage];return form?'assets/Page%20Pals/'+encodeURIComponent(form.file):'';}
function drawPagePals(page=0,ownedOnly=false){
  state.rewardCatalog='pals';
  const role=state.auth.role,parent=role==='parent',r=state.rewards,owned=r.pals?.[role]||{},equipped=r.equippedPals?.[role],balance=r.balances[role]||0;
  const entries=Object.entries(r.pagePalCatalog||{}).sort((a,b)=>Number(a[0])-Number(b[0])).filter(([id])=>!ownedOnly||Object.hasOwn(owned,id)),pages=Math.max(1,Math.ceil(entries.length/24));page=Math.max(0,Math.min(page,pages-1));
  const cards=entries.slice(page*24,page*24+24).map(([id,forms])=>{
    const stage=owned[id]??-1,next=stage+1,cost=5*(next+1);
    return `<article class="panel store-unlock-card"><img class="pal-preview" src="${palImage(id,Math.max(stage,0))}" alt="Page Pal #${id}" loading="lazy"><h4>Pal #${id}</h4><p class="small">${stage<0?'Not owned':'Form '+(stage+1)+' of '+forms.length}${equipped===id?' · Equipped':''}</p>${stage>=0&&next<forms.length?`<img class="pal-next" src="${palImage(id,next)}" alt="Next form" loading="lazy">`:''}${parent?'':`${next<forms.length?`<button class="button" ${balance<cost?'disabled':''} onclick="confirmPal('${id}',${next})">${stage<0?'Buy':'Upgrade'} · ${cost} points</button>`:'<span class="small">Fully upgraded</span>'}${stage>=0?`<button class="button light" ${equipped===id?'disabled':''} onclick="storeAction({rewardAction:'equipPal',id:'${id}'})">${equipped===id?'Equipped':'Equip'}</button>`:''}`}</article>`;
  }).join('');
  openDialog('page-pals',`<h2>⭐ Rewards Store</h2>${storeNavigation('pals')}<h3>Page Pals</h3><p>Buy a pal for 5 points. Upgrades cost 10 points, then 15 points. Equip one to keep you company.</p><div class="actions"><strong>${parent?'Preview catalog':balance+' points'}</strong><button class="button light" onclick="drawPagePals(0,${!ownedOnly})">${ownedOnly?'Show all pals':'My pals'}</button>${equipped?`<button class="button light" onclick="storeAction({rewardAction:'equipPal',id:'clear'})">Put pal away</button>`:''}</div><div class="store-unlock-grid">${cards||'<p>No pals yet. Browse all pals to find your first companion.</p>'}</div><div class="actions"><button class="button light" ${page===0?'disabled':''} onclick="drawPagePals(${page-1},${ownedOnly})">Previous</button><span>Page ${page+1} of ${pages}</span><button class="button light" ${page===pages-1?'disabled':''} onclick="drawPagePals(${page+1},${ownedOnly})">Next</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
function confirmPal(id,stage){
  const cost=5*(stage+1);
  openDialog('pal-confirm',`<h2>${stage?'Upgrade':'Buy'} Pal #${esc(id)}?</h2><img class="pal-preview" src="${palImage(id,stage)}" alt="Form ${stage+1}"><p>Form ${stage+1} costs ${cost} points. Yours permanently.</p><div class="actions"><button class="button" onclick="storeAction({rewardAction:'buyPal',id:'${id}',stage:${stage}})">Spend ${cost} points</button><button class="button light" onclick="drawPagePals()">Back to Page Pals</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
let palTimer=null;
function renderPagePal(){
  clearTimeout(palTimer);document.getElementById('page-pal')?.remove();
  const role=state.auth?.role,id=state.rewards?.equippedPals?.[role],stage=state.rewards?.pals?.[role]?.[id];
  if(!['leon','logan'].includes(role)||!state.view||stage===undefined)return;
  const node=document.createElement('button');node.id='page-pal';node.className='page-pal';node.type='button';node.title='Page Pal — click to hop; put away in the store';node.setAttribute('aria-label','Play with Pal #'+id);node.innerHTML=`<span class="pal-facing"><img src="${palImage(id,stage)}" alt=""></span>`;document.body.append(node);
  let x=24;node.style.left=x+'px';
  node.onclick=()=>{const image=node.querySelector('img');image.classList.remove('pal-hop');void image.offsetWidth;image.classList.add('pal-hop');};
  const step=()=>{
    if(!node.isConnected)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches||prefs().motion==='reduced';
    if(document.hidden||reduced){node.classList.remove('pal-walking');palTimer=setTimeout(step,3000);return;}
    const target=Math.max(0,Math.random()*Math.max(0,window.innerWidth-96)),duration=Math.max(1200,Math.abs(target-x)/32*1000);
    node.querySelector('.pal-facing').style.transform=target<x?'scaleX(-1)':'scaleX(1)';node.classList.add('pal-walking');node.style.transition='left '+duration+'ms linear';node.style.left=target+'px';x=target;
    palTimer=setTimeout(()=>{node.classList.remove('pal-walking');palTimer=setTimeout(step,2500+Math.random()*5000);},duration);
  };
  palTimer=setTimeout(step,2500);
}
