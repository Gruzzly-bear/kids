import { PAGE_PALS } from './page-pals.js';
import { PAGE_PAL_PRICES } from './page-pal-prices.js';

const ids=Object.keys(PAGE_PALS).sort((a,b)=>Number(a)-Number(b));
let checksum=2166136261;
for(const char of JSON.stringify([PAGE_PALS,PAGE_PAL_PRICES]))checksum=Math.imul(checksum^char.charCodeAt(0),16777619)>>>0;
const version=checksum.toString(16);
export function onRequestGet({request}){
  const params=new URL(request.url).searchParams,pageNumber=Number(params.get('page')||0);
  if(params.has('manifest'))return Response.json({version,total:ids.length,pageSize:24},{headers:{'Cache-Control':'no-cache'}});
  if(!Number.isSafeInteger(pageNumber)||pageNumber<0)return Response.json({error:'Invalid page.'},{status:400});
  let available=ids;
  if(params.has('ids')){
    const requested=params.get('ids').split(',').filter(Boolean);
    if(requested.length>24||requested.some(id=>!Object.hasOwn(PAGE_PALS,id)))return Response.json({error:'Choose up to 24 valid pals.'},{status:400});
    available=[...new Set(requested)].sort((a,b)=>Number(a)-Number(b));
  }
  const page=Math.min(pageNumber,Math.max(0,Math.ceil(available.length/24)-1)),selected=available.slice(page*24,page*24+24);
  return Response.json({version,page,total:available.length,pageSize:24,catalog:Object.fromEntries(selected.map(id=>[id,PAGE_PALS[id]])),prices:Object.fromEntries(selected.map(id=>[id,PAGE_PAL_PRICES[id]]))},{headers:{'Cache-Control':params.get('v')===version?'public, max-age=31536000, immutable':'no-cache'}});
}
