import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1440,height:1000} });
await p.goto('http://localhost:4173/', {waitUntil:'networkidle'}); await p.waitForTimeout(700);
await p.screenshot({path:'/tmp/h2.png', fullPage:true});
await b.close();
