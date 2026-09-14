/** Runs before Next's scripts, including when an old cached HTML references a removed chunk. */
export function assetRecoveryScript(base:string):string {
  return `(function(base){
    var attempted=false;
    function recover(){
      if(attempted||navigator.onLine===false)return;
      try{
        var key='ozilan.asset-recovery',now=Date.now(),last=Number(sessionStorage.getItem(key)||0);
        if(now-last<120000)return;
        sessionStorage.setItem(key,String(now));
        attempted=true;
        var url=new URL(location.href);
        url.searchParams.set('_oz_refresh',String(now));
        location.replace(url.href);
      }catch(_){}
    }
    window.addEventListener('error',function(event){
      var target=event.target;
      if(!target||(target.tagName!=='SCRIPT'&&target.tagName!=='LINK'))return;
      try{
        var url=new URL(target.src||target.href,location.href);
        if(url.origin===location.origin&&url.pathname.indexOf(base+'/_next/static/')===0)recover();
      }catch(_){}
    },true);
    window.addEventListener('unhandledrejection',function(event){
      var reason=event.reason;
      var message=String(reason&&reason.message||reason||'');
      if(/ChunkLoadError|Loading chunk .+ failed|Failed to load chunk/.test(message))recover();
    });
  })(${JSON.stringify(base)});`;
}
