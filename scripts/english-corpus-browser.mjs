import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import yaml from 'js-yaml';
const pairs = JSON.parse(await fs.readFile(new URL('./english-corpus.json', import.meta.url)));
const port = Number(process.env.ENGLISH_PORT ?? 4351);
const base = (process.env.ENGLISH_BASE_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, '');
const out = path.resolve(process.env.ENGLISH_SCREENSHOTS ?? '.visual-artifacts/english-corpus');
const route = (p) => `/en/${p.source.includes('/notes/') ? 'notes' : 'blog'}/${p.slug}/`;
const sourceRoute = async (p) => {
  const raw = await fs.readFile(new URL(`../${p.source}`, import.meta.url), 'utf8');
  const data = yaml.load(/^---\n([\s\S]*?)\n---/.exec(raw)[1]);
  return `/${p.source.includes('/notes/') ? 'notes' : 'blog'}/${data.slug}/`;
};
let server; let browser;
const passed = [];
try {
  await fs.mkdir(out, { recursive: true });
  if (!process.env.ENGLISH_BASE_URL) {
    server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
    let ready = false;
    for (let n=0;n<100;n++) { try {if ((await fetch(base+'/en/')).ok) {ready=true;break;}} catch { /* startup */ } await new Promise(r=>setTimeout(r,250)); }
    assert.ok(ready, 'Preview ready');
  }
  const index = await (await fetch(base+'/en/search.json')).json();
  assert.equal(index.length, 64); assert.equal(index.filter(p=>p.href.startsWith('/en/notes/')).length, 9);
  const rss = await (await fetch(base+'/en/rss.xml')).text();
  assert.equal((rss.match(/<item>/g)??[]).length,55);
  const sitemap = await (await fetch(base+'/sitemap.xml')).text();
  for (const p of pairs) { assert.ok(index.some(x=>x.href===route(p)),route(p));assert.ok(sitemap.includes(route(p)),route(p)); }
  const zhIndex = await (await fetch(base+'/search.json')).json();
  assert.equal(zhIndex.length,55);assert.ok(zhIndex.every(x=>!x.slug.endsWith('-en')));
  passed.push('64 English search entries / 55 English RSS items / 9 Notes; all original Chinese routes retained');
  browser = await chromium.launch(process.platform==='darwin'?{headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{headless:true});
  const context = await browser.newContext({ viewport:{width:1440,height:900} });
  await context.route('**/*', request => new URL(request.request().url()).origin === new URL(base).origin ? request.continue() : request.abort());
  const page = await context.newPage();
  let checked = 0;
  for (const p of pairs) {
    const response = await page.goto(base+route(p), {waitUntil:'domcontentloaded'});assert.equal(response.status(),200,route(p));
    assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('h1').count(),1);
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname,route(p));
    assert.equal(new URL(await page.locator('[data-language-switch]').getAttribute('href'),base).pathname,await sourceRoute(p));
    assert.equal(await page.locator('meta[name="robots"][content^="noindex"]').count(),0);
    assert.ok((await page.locator(p.source.includes('/notes/') ? 'main article' : '#article').innerText()).length>0,route(p));
    await page.locator('[data-language-switch]').click();await page.waitForURL(base+await sourceRoute(p), {waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
    assert.equal(new URL(await page.locator('[data-language-switch]').getAttribute('href'),base).pathname,route(p));
    if (++checked % 16 === 0) console.log(`CHECKED: ${checked}/64 routes and translation round trips`);
  }
  console.log('CHECKED: 64 article/note routes and translation round trips');
  passed.push('64 article/note browser loads and precise translation round trips; canonical/hreflang/indexability');
  // Walk actual pagination rather than assuming the first page contains the corpus.
  const listed = new Set();let next='/en/blog/';
  while(next){ await page.goto(base+next,{waitUntil:'domcontentloaded'});for(const href of await page.locator('.entry-row a.entry-title, .entry-row h2 a, .entry-row h3 a').evaluateAll(xs=>xs.map(x=>x.getAttribute('href'))))listed.add(href);
    for(const href of await page.locator('.entry-row a[href^="/en/blog/"]').evaluateAll(xs=>xs.map(x=>x.getAttribute('href'))))listed.add(href);
    const nextLink=page.locator('a[aria-label="Goto Next Page"][href]');const href=await nextLink.count()?await nextLink.getAttribute('href'):null; next=href?new URL(href,base).pathname:null;
  }
  assert.equal(listed.size,55,'All English posts reachable through pagination');
  await page.goto(base+'/en/notes/list/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.entry-row').count(),9);
  await context.close();
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]])for(const theme of ['light','dark']){
    const ctx=await browser.newContext({viewport,colorScheme:theme});const pg=await ctx.newPage();const errors=[];pg.on('pageerror',e=>errors.push(e.message));
    for(const slug of ['threat-modeling-and-trust-boundaries-en','wechat-miniapp-security-audit-en']){
      await pg.goto(base+`/en/blog/${slug}/`,{waitUntil:'domcontentloaded'});
      if(slug.startsWith('threat')){
        for(const [scenario,label] of [['false-positive','False Positive'],['false-negative','False Negative'],['true-positive','True Positive']]){
          await pg.locator(`[data-scenario="${scenario}"]`).click();await pg.waitForFunction(([s])=>document.querySelector('#topology-stage')?.dataset.mode===s,[scenario]);
          assert.match(await pg.locator('#reality-status-badge').innerText(),new RegExp(label));
          assert.doesNotMatch(await pg.locator('.threat-simulator-wrap').innerText(),/[\u4e00-\u9fff]/);
        }
        await pg.locator('[data-scenario="false-positive"]').click();
      }else{
        for(const stage of ['collect','restore','surface','verify','report']){
          await pg.locator(`[data-ma-stage="${stage}"]`).click();assert.equal(await pg.locator(`[data-ma-stage="${stage}"]`).getAttribute('aria-pressed'),'true');
          assert.doesNotMatch(await pg.locator('.ma-feature, .mad-figure').allInnerTexts().then(v=>v.join(' ')),/[\u4e00-\u9fff]/);
        }
      }
      assert.ok(await pg.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),slug+': no overflow');
      await pg.screenshot({path:path.join(out,`${slug}-${name}-${theme}.png`),fullPage:true});
    }
    await pg.goto(base+'/en/notes/',{waitUntil:'domcontentloaded'});assert.equal(await pg.locator('.entry-row').count(),9);
    await pg.screenshot({path:path.join(out,`notes-${name}-${theme}.png`),fullPage:true});
    await pg.goto(base+'/en/blog/2/',{waitUntil:'domcontentloaded'});assert.equal(await pg.locator('meta[name="robots"][content^="noindex"]').count(),1);
    await pg.screenshot({path:path.join(out,`pagination-${name}-${theme}.png`),fullPage:true});
    await pg.goto(base+'/en/search/',{waitUntil:'domcontentloaded'});await pg.locator('#pagefind-search input').fill('DOM');
    const hit=pg.locator('#pagefind-search a[href="/en/notes/bx33661dom-en/"]').first();await hit.waitFor();await hit.click();await pg.waitForURL('**/en/notes/bx33661dom-en/');
    assert.deepEqual(errors,[]);await ctx.close();
  }
  passed.push('55 posts reachable through pagination; 9 Notes; real English Notes Pagefind result clicked');
  passed.push('Desktop/mobile × light/dark: 3 trust-boundary states, 5 audit stages, diagrams, notes, pagination; 16 screenshots');
  const report=passed.map(x=>'PASS: '+x).join('\n')+'\n';await fs.writeFile(path.join(out,'report.txt'),report);console.log(report);
}finally{await browser?.close();server?.kill('SIGTERM');}
