// Local test harness: real SQLite plus the same Cloudflare request handlers.
import { DatabaseSync } from 'node:sqlite';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { onRequestPost as auth } from '../functions/api/auth.js';
import { onRequestPost as assignments } from '../functions/api/assignments.js';
import { hash } from '../functions/api/shared.js';

export function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const DB = {
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args=args; return this; },
        async first() { return sqlite.prepare(sql).get(...this.args) || null; },
        async all() { return { results: sqlite.prepare(sql).all(...this.args) }; },
        async run() { return sqlite.prepare(sql).run(...this.args); }
      };
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { const rows=[];for(const statement of statements)rows.push(await statement.run());sqlite.exec('COMMIT');return rows; }
      catch(error){sqlite.exec('ROLLBACK');throw error;}
    }
  };
  return { DB, sqlite };
}
export async function fixture() {
  const { DB, sqlite }=database();
  for(const role of ['leon','logan','parent'])await DB.prepare('INSERT INTO settings (key,value) VALUES (?,?)').bind(role+'_password',await hash('test-password')).run();
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  const shift=n=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  for(const student of ['leon','logan'])for(const [i,title,due,done] of [[0,'Today’s math assignment',today,0],[1,'A long assignment title that should wrap naturally on a phone without being clipped or overlapping the controls',shift(3),0],[2,'Later assignment',shift(4),0],[3,'Past-due assignment',shift(-2),0],[4,'Completed practice',today,1],[5,'No date yet','',0]])await DB.prepare('INSERT INTO assignments (id,student,subject,title,due,done) VALUES (?,?,?,?,?,?)').bind(student+'-'+i,student,i===1?'ela':'math',title,due,done).run();
  for(const student of ['leon','logan'])await DB.prepare('INSERT INTO settings (key,value) VALUES (?,?)').bind(student+'_schedule',JSON.stringify({template:[{subject:'math',time:'09:00',label:'Math'},{subject:'ela',time:'10:00',label:'Language Arts'},{subject:'break',time:'12:00',label:'Lunch'}],days:{}})).run();
  return { DB, sqlite };
}
export async function startServer(port=4173) {
  const env=await fixture(), root=resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));
  const server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname.startsWith('/api/')){
        let body='';for await(const chunk of req)body+=chunk;
        const request=new Request(url,{method:req.method,headers:{'content-type':'application/json'},body});
        const response=await (url.pathname==='/api/auth'?auth:assignments)({request,env});
        res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text());return;
      }
      const pathname=url.pathname==='/'?'/index.html':url.pathname;
      const path=resolve(root,'.'+pathname);
      if(!path.startsWith(root+'\\')&&!path.startsWith(root+'/')){res.writeHead(403);res.end();return;}
      const content=readFileSync(path);
      res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(path)]||'application/octet-stream'});res.end(content);
    }catch(error){res.writeHead(500);res.end(String(error));}
  });
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));return { server, env };
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'))){await startServer();console.log('Test dashboard at http://127.0.0.1:4173');}
