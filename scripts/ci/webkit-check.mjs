// Loads every page of the live site in WebKit (Safari's engine, used by every iPhone browser) at several
// device sizes and reports JS errors, whether the hero/page header is on screen, and blank areas.
import { webkit, devices } from 'playwright';
import { PNG } from 'pngjs';
const BASE = process.env.URL || 'https://aayera.pages.dev';
const PAGES = process.env.ONLY === 'none' ? [] : ['/', '/about/', '/business-verticals/', '/business-verticals/events-conferences/', '/business-verticals/academy/', '/clients/', '/contact/', '/industries/', '/our-platforms/'];
const DEVICES = {
  'iPhone 16 Plus': { ...devices['iPhone 15 Pro Max'], viewport: { width: 430, height: 739 }, screen: { width: 430, height: 932 }, deviceScaleFactor: 3 },
  'iPhone SE': devices['iPhone SE'],
  'iPad Mini': devices['iPad Mini'],
  'Safari Mac': { viewport: { width: 1440, height: 900 } },
};
// mean brightness (0-255) of each quarter of the screen, top to bottom
const bands = (buf) => { const png = PNG.sync.read(buf); const out = []; for (let b = 0; b < 4; b++) { let s = 0, n = 0; for (let y = Math.floor(png.height * b / 4); y < Math.floor(png.height * (b + 1) / 4); y += 6) for (let x = 0; x < png.width; x += 6) { const i = (y * png.width + x) * 4; s += (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3; n++; } out.push(Math.round(s / n)); } return out; };
const browser = await webkit.launch();
const T0 = Date.now();
const step = (msg) => console.log(`  [${((Date.now() - T0) / 1000).toFixed(1)}s] ${msg}`);
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT after ${ms / 1000}s: ${what}`)), ms))]);
setTimeout(() => { console.log('GLOBAL TIMEOUT: script exceeded 25 minutes'); process.exit(2); }, 25 * 60 * 1000);
let problems = 0;
for (const [dname, dev] of Object.entries(DEVICES).filter(([n]) => !process.env.ONLY || n === process.env.ONLY)) {
  for (const path of PAGES) {
    const b2 = await webkit.launch();
    const ctx = await b2.newContext(dev);
    const page = await ctx.newPage();
    const errs = [];
    let crashed = false;
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('crash', () => (crashed = true));
    page.setDefaultTimeout(20000);
    step(`${dname} ${path} start`);
    try {
    await withTimeout(page.goto(BASE + path, { waitUntil: 'load' }), 30000, 'goto');
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const hero = document.querySelector('.hero, .phero');
      const r = hero?.getBoundingClientRect();
      return { header: hero ? hero.className.split(' ')[0] : 'MISSING', headerH: r ? Math.round(r.height) : 0, sideScroll: document.documentElement.scrollWidth > innerWidth };
    });
    // scroll through the page so every island hydrates and every reveal runs, then look for errors again
    const H = await page.evaluate(() => document.body.scrollHeight);
    step(`${dname} ${path} loaded, scrolling ${H}px`);
    for (let y = 0; y < H; y += 500) { await withTimeout(page.evaluate((y) => scrollTo(0, y), y), 10000, `scrollTo ${y}`); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    const b = bands(await withTimeout(page.screenshot(), 20000, 'screenshot'));
    const bad = errs.length || info.header === 'MISSING' || info.headerH < 100 || info.sideScroll || Math.max(...b) < 12;
    if (bad) problems++;
    console.log(`${bad ? 'PROBLEM' : 'ok     '} ${dname.padEnd(15)} ${path.padEnd(42)} header=${info.header}(${info.headerH}px) brightness=${JSON.stringify(b)}${info.sideScroll ? ' SIDEWAYS-SCROLL' : ''}${errs.length ? ' ERRORS: ' + errs.join(' | ') : ''}`);
    } catch (e) {
      problems++;
      console.log(`PROBLEM ${dname.padEnd(15)} ${path.padEnd(42)} ${crashed ? 'PAGE CRASHED' : 'FAILED'}: ${e.message.split('\n')[0]}${errs.length ? ' ERRORS: ' + errs.join(' | ') : ''}`);
    }
    await withTimeout(b2.close(), 10000, 'close').catch(() => {});
  }
}
if (!process.env.ONLY || process.env.ONLY === 'none') {
// home page interactions on iPhone 16 Plus: swipe to change slide, swipe up for the photo-grid intro
{
  const errsHome = [];
  const ctx = await browser.newContext(DEVICES['iPhone 16 Plus']);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const state = () => page.evaluate(() => ({ slide: [...document.querySelectorAll('.slide')].findIndex((s) => s.classList.contains('on')), wall: getComputedStyle(document.querySelector('.mosaic')).opacity, y: Math.round(scrollY) }));
  const s0 = await state();
  await page.evaluate(() => window.scrollTo(0, 5)); // anything moving the page plays/skips the intro
  await page.waitForTimeout(2500);
  const s1 = await state();
  console.log(`home interactions (iPhone 16 Plus): start ${JSON.stringify(s0)} after scroll ${JSON.stringify(s1)}${errs.length ? ' ERRORS: ' + errs.join(' | ') : ''}`);
  if (errs.length) problems++;
  await ctx.close();
}
// People. Knowledge. Possibility. on iPhone 16 Plus: a glide into it must stop; nothing scrolls until it finishes
{
  const ctx = await browser.newContext(DEVICES['iPhone 16 Plus']);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const top = await page.evaluate(() => Math.round(document.querySelector('.expand').getBoundingClientRect().top + scrollY));
  const st = () => page.evaluate(() => ({ pageY: Math.round(scrollY), stageTop: Math.round(document.querySelector('.expand-sticky').getBoundingClientRect().top), frozen: document.body.style.position === 'fixed', words: [...document.querySelectorAll('.expand-words span')].map((e) => (+getComputedStyle(e).opacity).toFixed(0)).join('') }));
  await page.evaluate((y) => scrollTo(0, y - 120), top);
  await page.waitForTimeout(500);
  await page.evaluate(async () => { for (let i = 0; i < 6; i++) { scrollBy(0, 45); await new Promise((r) => requestAnimationFrame(r)); } });
  const during = await st();
  await page.waitForTimeout(2600);
  const after = await st();
  await page.evaluate(() => scrollBy(0, 300));
  await page.waitForTimeout(400);
  const scrolls = await st();
  const ok = during.frozen && during.stageTop === 0 && !after.frozen && after.pageY === top && after.words === '111' && scrolls.pageY > top && !errs.length;
  if (!ok) problems++;
  console.log(`${ok ? 'ok     ' : 'PROBLEM'} statement freeze (iPhone 16 Plus): section ${top} during ${JSON.stringify(during)} after ${JSON.stringify(after)} then ${JSON.stringify(scrolls)}${errs.length ? ' ERRORS: ' + errs.join(' | ') : ''}`);
  await ctx.close();
}
}
await browser.close();
console.log(problems ? `${problems} PROBLEM(S)` : 'ALL OK');
