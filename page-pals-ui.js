function palName(id,stage=0){return state.rewards?.pagePalCatalog?.[id]?.[stage]?.name||'Pal #'+id;}
function palForm(id,stage=0){return state.rewards?.pagePalCatalog?.[id]?.[stage]?.form??stage+1;}
function palCost(id,stage=0){return (state.rewards?.pagePalPrices?.[id]??5)+5*stage;}
function palImage(id,stage){const form=state.rewards?.pagePalCatalog?.[id]?.[stage];return form?'assets/Page%20Pals/'+encodeURIComponent(form.file):'';}
function freePalAccess(){return ['parent','monitor'].includes(state.auth?.role);}
function freePalScope(){return state.view==='monitor'?'monitor':'parent';}
function freePalSelection(){return localRead('page-pal-preview-'+freePalScope(),null);}
function previewPagePal(id,stage){
  if(!freePalAccess())return;
  const forms=state.rewards?.pagePalCatalog?.[id];
  if(id!=='clear'&&(!forms||!Number.isInteger(stage)||!forms[stage]))return;
  localWrite('page-pal-preview-'+freePalScope(),id==='clear'?null:{id,stage});
  renderPagePal();drawPagePals();
}
function drawPagePals(page,ownedOnly){
  const browseScope=[state.auth?.role,state.view].join(':'),previous=state.palBrowse?.scope===browseScope?state.palBrowse:null;
  page=page??previous?.page??0;ownedOnly=ownedOnly??previous?.ownedOnly??false;
  const dialog=typeof document!=='undefined'?document.getElementById('app-dialog'):null;
  const keepPosition=dialog?.dataset.dialog==='page-pals'&&previous?.page===page&&previous?.ownedOnly===ownedOnly;
  const scrollTop=keepPosition?dialog.scrollTop:0;
  const focusedPal=keepPosition?document.activeElement?.dataset?.palForm:null;
  state.rewardCatalog='pals';
  const role=state.auth.role,parent=freePalAccess(),r=state.rewards,owned=r.pals?.[role]||{},equipped=parent?freePalSelection()?.id:r.equippedPals?.[role],balance=r.balances[role]||0;
  const entries=Object.entries(r.pagePalCatalog||{}).sort((a,b)=>Number(a[0])-Number(b[0])).filter(([id])=>parent||!ownedOnly||Object.hasOwn(owned,id)),pages=Math.max(1,Math.ceil(entries.length/24));page=Math.max(0,Math.min(page,pages-1));
  state.palBrowse={scope:browseScope,page,ownedOnly};
  const pagination=position=>`<nav class="pal-pagination" aria-label="Page Pals pagination ${position}"><button type="button" class="button light" ${page===0?'disabled':''} onclick="drawPagePals(${page-1},${ownedOnly})">Previous</button><span aria-live="polite">Page ${page+1} of ${pages}</span><button type="button" class="button light" ${page===pages-1?'disabled':''} onclick="drawPagePals(${page+1},${ownedOnly})">Next</button></nav>`;
  const cards=entries.slice(page*24,page*24+24).map(([id,forms])=>{
    const stage=parent?(equipped===id?freePalSelection().stage:0):(owned[id]??-1),next=stage+1,cost=palCost(id,next);
    return `<article class="panel store-unlock-card pal-card"><img class="pal-preview" src="${palImage(id,Math.max(stage,0))}" alt="${esc(palName(id,Math.max(stage,0)))} · Form ${palForm(id,Math.max(stage,0))}" loading="lazy"><h4>${esc(palName(id,Math.max(stage,0)))}</h4><p class="small">${palCost(id)} points base</p><p class="small">${stage<0?'Not owned':'Form '+palForm(id,stage)}${equipped===id?' · Equipped':''}</p>${stage>=0&&next<forms.length?`<img class="pal-next" src="${palImage(id,next)}" alt="${esc(palName(id,next))} · Form ${palForm(id,next)}" loading="lazy">`:''}<div class="pal-card-actions">${parent?`<label>Form<select data-pal-form="${id}" onchange="previewPagePal('${id}',Number(this.value))">${forms.map((form,index)=>`<option value="${index}" ${stage===index?'selected':''}>${esc(form.name||'Pal #'+id)} · Form ${form.form??index+1}</option>`).join('')}</select></label><button class="button" onclick="previewPagePal('${id}',${stage})">${equipped===id?'Equipped':'Equip free'}</button>`:`${next<forms.length?`<button class="button" ${balance<cost?'disabled':''} onclick="confirmPal('${id}',${next})">${stage<0?'Buy':'Upgrade'} · ${cost} points</button>`:'<span class="small">Fully upgraded</span>'}${stage>=0?`<button class="button light" ${equipped===id?'disabled':''} onclick="storeAction({rewardAction:'equipPal',id:'${id}'})">${equipped===id?'Equipped':'Equip'}</button>`:''}`}</div></article>`;
  }).join('');
  openDialog('page-pals',`<h2>⭐ Rewards Store</h2>${storeNavigation('pals')}<h3>Page Pals</h3><p>${parent?'All pals and forms are free to try on the parent and shared dashboards.':'Pals start at 5 points. More elaborate pals cost 7, 9, or 12 points. Each new form costs 5 more than the previous form. Equip one to keep you company.'}</p><div class="actions"><button class="button light" onclick="togglePalMotion()">${palMotionAllowed()?'Pause pal movement':'Start pal movement'}</button><strong>${parent?'Free access':balance+' points'}</strong><button class="button light" onclick="drawPagePals(0,${!ownedOnly})">${ownedOnly?'Show all pals':'My pals'}</button>${equipped?`<button class="button light" onclick="${parent?`previewPagePal('clear',0)`:`storeAction({rewardAction:'equipPal',id:'clear'})`}">Put pal away</button>`:''}</div>${pagination('top')}<div class="store-unlock-grid pal-grid">${cards||'<p>No pals yet. Browse all pals to find your first companion.</p>'}</div>${pagination('bottom')}<p id="store-error" class="form-error" role="alert"></p>`);
  if(typeof document!=='undefined'){
    const updated=document.getElementById('app-dialog');
    if(focusedPal)updated?.querySelector('[data-pal-form="'+focusedPal+'"]')?.focus({preventScroll:true});
    if(updated)updated.scrollTop=scrollTop;
  }
}
function confirmPal(id,stage){
  const cost=palCost(id,stage);
  openDialog('pal-confirm',`<h2>${stage?'Upgrade to':'Buy'} ${esc(palName(id,stage))}?</h2><img class="pal-preview" src="${palImage(id,stage)}" alt="${esc(palName(id,stage))} · Form ${palForm(id,stage)}"><p>Form ${palForm(id,stage)} costs ${cost} points. Yours permanently.</p><div class="actions"><button class="button" onclick="storeAction({rewardAction:'buyPal',id:'${id}',stage:${stage}})">Spend ${cost} points</button><button class="button light" onclick="drawPagePals()">Back to Page Pals</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
function palMotionAllowed(){
  const override=localRead('page-pal-motion','system');
  if(override!=='system')return override==='full';
  const motion=prefs().motion;
  return motion==='full'||motion!=='reduced'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function togglePalMotion(){
  localWrite('page-pal-motion',palMotionAllowed()?'reduced':'full');
  document.getElementById('page-pal')?.remove();renderPagePal();drawPagePals();
}
let palTimer=null;
function renderPagePal(){
  const existing=document.getElementById('page-pal');
  const role=state.auth?.role,preview=freePalAccess()?freePalSelection():null,id=preview?.id||state.rewards?.equippedPals?.[role],stage=preview?.stage??state.rewards?.pals?.[role]?.[id];
  const identity=[role,state.view,id,stage].join(':');
  if(state.view&&stage!==undefined&&existing?.dataset.palIdentity===identity)return;
  clearTimeout(palTimer);existing?.remove();
  if(!state.view||stage===undefined||!palImage(id,stage))return;
  const node=document.createElement('button');node.id='page-pal';node.dataset.palIdentity=identity;node.dataset.motion=palMotionAllowed()?'full':'reduced';node.className='page-pal';node.type='button';node.title=palName(id,stage)+' · Form '+palForm(id,stage)+' — click to hop; put away in the store';node.setAttribute('aria-label','Play with '+palName(id,stage)+' · Form '+palForm(id,stage));node.innerHTML=`<span class="pal-facing"><img src="${palImage(id,stage)}" alt=""></span>`;document.body.append(node);
  let x=24;node.style.left=x+'px';
  node.onclick=()=>{const image=node.querySelector('img');image.classList.remove('pal-hop');void image.offsetWidth;image.classList.add('pal-hop');};
  const step=()=>{
    if(!node.isConnected)return;
    const reduced=!palMotionAllowed();node.dataset.motion=reduced?'reduced':'full';
    if(document.hidden||reduced){node.classList.remove('pal-walking');palTimer=setTimeout(step,3000);return;}
    const maxX=Math.max(0,window.innerWidth-96),distance=120+Math.random()*180;
    const target=Math.max(0,Math.min(maxX,x+(x<maxX/2?distance:-distance))),duration=Math.max(1200,Math.abs(target-x)/32*1000);
    node.querySelector('.pal-facing').style.transform=target<x?'scaleX(-1)':'scaleX(1)';node.classList.add('pal-walking');node.style.setProperty('transition','left '+duration+'ms linear','important');node.style.left=target+'px';x=target;
    palTimer=setTimeout(()=>{node.classList.remove('pal-walking');palTimer=setTimeout(step,2500+Math.random()*5000);},duration);
  };
  palTimer=setTimeout(step,150);
}
