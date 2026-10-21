import {fixture} from '../tests/test-server.js';import {onRequestPost} from '../functions/api/auth.js';
const env=await fixture();let calls=0;const prepare=env.DB.prepare.bind(env.DB);env.DB.prepare=sql=>{const s=prepare(sql);for(const name of ['first','all','run']){const old=s[name].bind(s);s[name]=(...args)=>{calls++;return old(...args);};}return s;};
for(const role of ['parent','leon']){calls=0;const r=await onRequestPost({env,request:new Request('https://local/api/auth',{method:'POST',body:JSON.stringify({role,password:'test-password'})})});console.log(role,r.status,calls);}
