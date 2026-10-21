let pagePalCatalogCache=null;
const pagePalPages=new Map(),pagePalRequests=new Map();
let pagePalLoadToken=0,palCacheVersion=null,palVersionRequest=null;
async function palVersion(){
  if(palCacheVersion)return palCacheVersion;
  if(!palVersionRequest)palVersionRequest=fetch('/api/page-pals-catalog?manifest=1',{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Could not check pal catalog.');return response.json();}).then(data=>{palCacheVersion=data.version;localWrite('page-pal-cache-version',data.version);return data.version;}).catch(error=>{const saved=localRead('page-pal-cache-version',null);if(saved){palCacheVersion=saved;return saved;}palVersionRequest=null;throw error;});
  return palVersionRequest;
}
function rememberPalPage(key,data){
  pagePalPages.set(key,data);
  pagePalCatalogCache={catalog:{...(pagePalCatalogCache?.catalog||{}),...data.catalog},prices:{...(pagePalCatalogCache?.prices||{}),...data.prices}};
  return data;
}
function palForms(id){return pagePalCatalogCache?.catalog?.[id]||state.rewards?.pagePalCatalog?.[id];}
function palCatalog(){return {...(state.rewards?.pagePalCatalog||{}),...(pagePalCatalogCache?.catalog||{})};}
function ownedPalIds(){return Object.keys(state.rewards?.pals?.[state.auth?.role]||{}).sort((a,b)=>Number(a)-Number(b));}
function palPageKey(page,ownedOnly){return ownedOnly&&!freePalAccess()?'owned:'+ownedPalIds().join(',')+':'+page:'all:'+page;}
async function loadPalCatalog(page=0,ownedOnly=false){
  const key=palPageKey(page,ownedOnly);
  const version=await palVersion();
  const saved=localRead('page-pal-page-'+version+'-'+key,null);
  if(saved?.version===version&&saved.catalog)return rememberPalPage(key,saved);
  if(pagePalPages.has(key))return pagePalPages.get(key);
  if(!pagePalRequests.has(key)){
    const ids=ownedOnly&&!freePalAccess()?ownedPalIds():null;
    const query=ids?'ids='+ids.slice(page*24,page*24+24).join(','):'page='+page;
    const request=fetch('/api/page-pals-catalog?'+query+'&v='+encodeURIComponent(version)).then(response=>{if(!response.ok)throw Error('Could not load Page Pals.');return response.json();}).then(data=>{
      if(ids){data.total=ids.length;data.page=page;}
      localWrite('page-pal-page-'+data.version+'-'+key,data);
      return rememberPalPage(key,data);
    }).finally(()=>pagePalRequests.delete(key));
    pagePalRequests.set(key,request);
  }
  return pagePalRequests.get(key);
}
async function openPagePals(page,ownedOnly){
  const scope=[state.auth?.role,state.view].join(':'),previous=state.palBrowse?.scope===scope?state.palBrowse:null;
  page=page??previous?.page??0;ownedOnly=ownedOnly??previous?.ownedOnly??false;
  if(pagePalPages.has(palPageKey(page,ownedOnly))){drawPagePals(page,ownedOnly);return;}
  const token=++pagePalLoadToken;
  state.rewardCatalog='pals';state.palBrowse={scope,page,ownedOnly};
  openDialog('page-pals','<h2>Page Pals</h2>'+storeNavigation('pals')+'<p role="status">Loading this page…</p>');
  try{const data=await loadPalCatalog(page,ownedOnly);if(token===pagePalLoadToken&&state.rewardCatalog==='pals'&&document.getElementById('app-dialog')?.dataset.dialog==='page-pals'){drawPagePals(data.page,ownedOnly);renderPagePal();}}
  catch{const dialog=document.getElementById('app-dialog');if(token===pagePalLoadToken&&dialog?.dataset.dialog==='page-pals')openDialog('page-pals','<h2>Page Pals</h2><p>Could not load this page. Please try again.</p><button class="button" onclick="openPagePals()">Retry</button><button class="button light" onclick="drawRewards()">Back to store</button>');}
}
function palName(id,stage=0){return palForms(id)?.[stage]?.name||'Pal #'+id;}
function palForm(id,stage=0){return palForms(id)?.[stage]?.form??stage+1;}
function palCost(id,stage=0){return (pagePalCatalogCache?.prices?.[id]??state.rewards?.pagePalPrices?.[id]??5)+5*stage;}
function palImage(id,stage){const form=palForms(id)?.[stage];return form?'assets/Page%20Pals/'+encodeURIComponent(form.file):'';}
function palSprite(id,stage,className='pal-preview'){
  const form=palForms(id)?.[stage];if(!form)return '';
  const [x,y,width,height,canvasWidth,canvasHeight]=form.bounds||[0,0,200,150,200,150];
  return `<span class="${className} pal-sprite" role="img" aria-label="${esc(palName(id,stage))} · Form ${palForm(id,stage)}"><svg viewBox="${x} ${y} ${width} ${height}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><image href="${palImage(id,stage)}" width="${canvasWidth}" height="${canvasHeight}"/></svg></span>`;
}
function freePalAccess(){return ['parent','monitor'].includes(state.auth?.role);}
function freePalScope(){return state.view==='monitor'?'monitor':'parent';}
function freePalSelection(){const selection=localRead('page-pal-preview-'+freePalScope(),null);if(selection?.forms)state.rewards.pagePalCatalog={...(state.rewards.pagePalCatalog||{}),[selection.id]:selection.forms};return selection;}
function previewPagePal(id,stage){
  if(!freePalAccess())return;
  const forms=palForms(id);
  if(state.palFormPreviews?.forms)delete state.palFormPreviews.forms[id];
  if(id!=='clear'&&(!forms||!Number.isInteger(stage)||!forms[stage]))return;
  localWrite('page-pal-preview-'+freePalScope(),id==='clear'?null:{id,stage,forms});
  renderPagePal();drawPagePals();
}
function browsePalForm(id,stage){
  if(!palForms(id)?.[stage])return;
  const scope=[state.auth?.role,state.view].join(':');
  if(state.palFormPreviews?.scope!==scope)state.palFormPreviews={scope,forms:{}};
  state.palFormPreviews.forms[id]=stage;
  drawPagePals();
}
function palPagination(page,pages,ownedOnly,position){
  const shown=[...new Set([0,pages-1,...Array.from({length:5},(_,i)=>page+i-2)].filter(n=>n>=0&&n<pages))].sort((a,b)=>a-b);
  const numbers=shown.map((n,i)=>`${i&&n>shown[i-1]+1?'<span class="pal-page-gap" aria-hidden="true">…</span>':''}<button type="button" class="button light pal-page-number" aria-label="Page ${n+1}" ${n===page?'aria-current="page"':''} onclick="drawPagePals(${n},${ownedOnly})">${n+1}</button>`).join('');
  return `<nav class="pal-pagination" aria-label="Page Pals pagination ${position}"><button type="button" class="button light" ${page===0?'disabled':''} onclick="drawPagePals(${page-1},${ownedOnly})">Previous</button><div class="pal-page-numbers">${numbers}</div><button type="button" class="button light" ${page===pages-1?'disabled':''} onclick="drawPagePals(${page+1},${ownedOnly})">Next</button><span class="pal-page-status" aria-live="polite">Page ${page+1} of ${pages}</span></nav>`;
}
function drawPagePals(page,ownedOnly){
  const browseScope=[state.auth?.role,state.view].join(':'),previous=state.palBrowse?.scope===browseScope?state.palBrowse:null;
  page=page??previous?.page??0;ownedOnly=ownedOnly??previous?.ownedOnly??false;
  if(typeof fetch!=='undefined'&&!pagePalPages.has(palPageKey(page,ownedOnly))){openPagePals(page,ownedOnly);return;}
  ++pagePalLoadToken;
  const pageData=pagePalPages.get(palPageKey(page,ownedOnly));
  const dialog=typeof document!=='undefined'?document.getElementById('app-dialog'):null;
  const keepPosition=dialog?.dataset.dialog==='page-pals'&&previous?.page===page&&previous?.ownedOnly===ownedOnly;
  const scrollTop=keepPosition?dialog.scrollTop:0;
  const focusedPal=keepPosition?document.activeElement?.dataset?.palForm:null;
  state.rewardCatalog='pals';
  const role=state.auth.role,parent=freePalAccess(),r=state.rewards,owned=r.pals?.[role]||{},equipped=parent?freePalSelection()?.id:r.equippedPals?.[role],balance=r.balances[role]||0;
  const available=Object.entries(palCatalog()).sort((a,b)=>Number(a[0])-Number(b[0])).filter(([id])=>parent||!ownedOnly||Object.hasOwn(owned,id)),pages=Math.max(1,Math.ceil((pageData?.total??available.length)/24));page=Math.max(0,Math.min(page,pages-1));
  const entries=pageData?Object.entries(pageData.catalog).sort((a,b)=>Number(a[0])-Number(b[0])):available.slice(page*24,page*24+24);
  state.palBrowse={scope:browseScope,page,ownedOnly};
  const pagination=position=>palPagination(page,pages,ownedOnly,position);
  const cards=entries.map(([id,forms])=>{
    const stage=parent?(equipped===id?freePalSelection().stage:0):(owned[id]??-1),next=stage+1,cost=palCost(id,next);
    const selected=parent&&state.palFormPreviews?.scope===browseScope?state.palFormPreviews.forms[id]:undefined;
    const displayStage=selected!==undefined&&forms[selected]?selected:Math.max(stage,0),isEquipped=equipped===id&&(!parent||freePalSelection()?.stage===displayStage);
    return `<article class="panel store-unlock-card pal-card">${palSprite(id,displayStage)}<h4>${esc(palName(id,displayStage))}</h4><p class="small">${palCost(id)} points base</p><p class="small">${parent?'Form '+palForm(id,displayStage):stage<0?'Not owned':'Form '+palForm(id,stage)}${isEquipped?' · Equipped':''}</p>${stage>=0&&next<forms.length?`${palSprite(id,next,'pal-next')}`:''}<div class="pal-card-actions">${parent?`<label>Form<select data-pal-form="${id}" onchange="browsePalForm('${id}',Number(this.value))">${forms.map((form,index)=>`<option value="${index}" ${displayStage===index?'selected':''}>${esc(form.name||'Pal #'+id)} · Form ${form.form??index+1}</option>`).join('')}</select></label><button class="button" onclick="previewPagePal('${id}',${displayStage})" ${isEquipped?'disabled':''}>${isEquipped?'Equipped':'Equip free'}</button>`:`${next<forms.length?`<button class="button" ${balance<cost?'disabled':''} onclick="confirmPal('${id}',${next})">${stage<0?'Buy':'Upgrade'} · ${cost} points</button>`:'<span class="small">Fully upgraded</span>'}${stage>=0?`<button class="button light" ${equipped===id?'disabled':''} onclick="storeAction({rewardAction:'equipPal',id:'${id}'})">${equipped===id?'Equipped':'Equip'}</button>`:''}`}</div></article>`;
  }).join('');
  openDialog('page-pals',`<h2>⭐ Rewards Store</h2>${storeNavigation('pals')}<h3>Page Pals</h3><p>${parent?'All pals and forms are free to try.':'Pals from 5 points. Each upgrade costs 5 more. Equip one at a time.'}</p><div class="actions"><strong>${parent?'Free access':balance+' points'}</strong><button class="button light" onclick="drawPagePals(0,${!ownedOnly})">${ownedOnly?'Show all pals':'My pals'}</button>${equipped?`<button class="button light" onclick="${parent?`previewPagePal('clear',0)`:`storeAction({rewardAction:'equipPal',id:'clear'})`}">Put pal away</button>`:''}</div>${pagination('top')}<div class="store-unlock-grid pal-grid">${cards||'<p>No pals yet. Browse all pals to find your first companion.</p>'}</div>${pagination('bottom')}<p id="store-error" class="form-error" role="alert"></p>`);
  if(typeof document!=='undefined'){
    const updated=document.getElementById('app-dialog');
    if(focusedPal)updated?.querySelector('[data-pal-form="'+focusedPal+'"]')?.focus({preventScroll:true});
    if(updated)updated.scrollTop=scrollTop;
  }
}
function confirmPal(id,stage){
  const cost=palCost(id,stage);
  openDialog('pal-confirm',`<h2>${stage?'Upgrade to':'Buy'} ${esc(palName(id,stage))}?</h2>${palSprite(id,stage)}<p>Form ${palForm(id,stage)} costs ${cost} points. Yours permanently.</p><div class="actions"><button class="button" onclick="storeAction({rewardAction:'buyPal',id:'${id}',stage:${stage}})">Spend ${cost} points</button><button class="button light" onclick="drawPagePals()">Back to Page Pals</button></div><p id="store-error" class="form-error" role="alert"></p>`);
}
let palTimer=null;
function renderPagePal(){
  const existing=document.getElementById('page-pal');
  const role=state.auth?.role,preview=freePalAccess()?freePalSelection():null,id=preview?.id||state.rewards?.equippedPals?.[role],stage=preview?.stage??state.rewards?.pals?.[role]?.[id];
  const identity=[role,state.view,id,stage].join(':');
  if(state.view&&stage!==undefined&&existing?.dataset.palIdentity===identity)return;
  clearTimeout(palTimer);existing?.remove();
  if(!state.view||stage===undefined)return;
  if(!palImage(id,stage))return;
  const node=document.createElement('button');node.id='page-pal';node.dataset.palIdentity=identity;node.dataset.motion='full';node.className='page-pal';node.type='button';node.title=palName(id,stage)+' · Form '+palForm(id,stage)+' — click to hop; put away in the store';node.setAttribute('aria-label','Play with '+palName(id,stage)+' · Form '+palForm(id,stage));node.innerHTML=`<span class="pal-facing">${palSprite(id,stage,'pal-art')}</span>`;document.body.append(node);
  let x=24;node.style.left=x+'px';
  node.onclick=()=>{
    node.dataset.hopMotion='full';
    clearTimeout(palTimer);
    x=Math.max(0,Math.min(Math.max(0,window.innerWidth-node.offsetWidth),node.getBoundingClientRect().left));
    node.style.setProperty('transition','none','important');node.style.left=x+'px';
    node.classList.remove('pal-walking');node.classList.add('pal-paused');
    node.classList.remove('pal-hop');void node.offsetWidth;node.classList.add('pal-hop');
    palTimer=setTimeout(()=>{if(!node.isConnected)return;node.classList.remove('pal-paused');node.classList.remove('pal-hop');step();},1500);
  };
  const step=()=>{
    if(!node.isConnected)return;
    if(document.hidden){node.classList.remove('pal-walking');palTimer=setTimeout(step,3000);return;}
    const maxX=Math.max(0,window.innerWidth-node.offsetWidth),distance=120+Math.random()*180;
    const target=Math.max(0,Math.min(maxX,x+(x<maxX/2?distance:-distance))),duration=Math.max(1200,Math.abs(target-x)/32*1000);
    node.querySelector('.pal-facing').style.transform=target<x?'scaleX(-1)':'scaleX(1)';node.classList.add('pal-walking');node.style.setProperty('transition','left '+duration+'ms linear','important');node.style.left=target+'px';x=target;
    palTimer=setTimeout(()=>{node.classList.remove('pal-walking');palTimer=setTimeout(step,2500+Math.random()*5000);},duration);
  };
  palTimer=setTimeout(step,150);
}
