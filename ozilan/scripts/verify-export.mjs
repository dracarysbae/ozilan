import {readdir,readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('out'),base=(process.env.NEXT_PUBLIC_BASE_PATH??'').replace(/\/$/,'');
let pages=0,references=0;
async function inspect(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const filename=path.join(directory,entry.name);
    if(entry.isDirectory()){await inspect(filename);continue;}
    if(!entry.name.endsWith('.html'))continue;
    let html=await readFile(filename,'utf8');
    const bootstrap=html.match(/<script\b[^>]*id="ozilan-asset-recovery"[^>]*>[\s\S]*?<\/script>/)?.[0];
    if(!bootstrap)throw Error(`Missing asset recovery bootstrap in ${filename}`);
    // Async scripts can execute immediately from cache. Install recovery before any of them.
    html=html.replace(bootstrap,'').replace(/(<head\b[^>]*>)/,`$1${bootstrap}`);
    await writeFile(filename,html);
    for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
      const resource=new URL(match[1],'https://export.local');
      if(resource.origin!=='https://export.local'||!resource.pathname.includes('/_next/static/'))continue;
      if(!resource.pathname.startsWith(`${base}/_next/static/`))throw Error(`Wrong asset prefix in ${filename}: ${resource.pathname}`);
      const relative=decodeURIComponent(resource.pathname.slice(base.length+1));
      const target=path.resolve(root,relative);
      if(!target.startsWith(root+path.sep))throw Error(`Asset outside export: ${relative}`);
      await access(target);references++;
    }
    pages++;
  }
}
await inspect(root);
console.log(`Static export verified: ${pages} pages, ${references} local asset references; recovery runs before Next scripts.`);
