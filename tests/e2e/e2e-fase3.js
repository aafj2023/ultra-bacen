const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = require('path').join(__dirname, '..', '..');
const NM = process.env.CDN_MODULES || path.join(__dirname, 'node_modules');

const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.css': 'text/css' }[path.extname(p)] || 'text/plain';
    res.writeHead(200, { 'content-type': mime }); res.end(data);
  });
});

const CDN_MAP = {
  'chart.js@4.5.0/dist/chart.umd.js': 'chart.js/dist/chart.umd.js',
  'dexie@4.4.4/dist/dexie.min.js': 'dexie/dist/dexie.min.js',
  'katex@0.17.0/dist/katex.min.css': 'katex/dist/katex.min.css',
  'katex@0.17.0/dist/katex.min.js': 'katex/dist/katex.min.js',
  'katex@0.17.0/dist/contrib/auto-render.min.js': 'katex/dist/contrib/auto-render.min.js'
};

(async () => {
  await new Promise(r => server.listen(8141, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const errors = [];
  let fails = 0, count = 0;
  const eq = (nome, got, want) => {
    count++;
    if (JSON.stringify(got) !== JSON.stringify(want)) { fails++; console.error(`✗ ${nome}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
  };

  const ctx = await browser.newContext({ viewport: { width: 400, height: 880 }, colorScheme: 'light', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  // CDN local; firebase (gstatic) BLOQUEADO → testa degradação p/ modo local
  await page.route('**/cdn.jsdelivr.net/npm/**', route => {
    const url = route.request().url();
    const key = Object.keys(CDN_MAP).find(k => url.includes(k));
    if (!key) return route.abort();
    route.fulfill({ body: fs.readFileSync(path.join(NM, CDN_MAP[key])), contentType: url.endsWith('.css') ? 'text/css' : 'text/javascript' });
  });
  await page.route('**/www.gstatic.com/**', route => route.abort());
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/gstatic|ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });

  await page.goto('http://localhost:8141/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // modo local: banner visível, gate NÃO
  eq('banner modo local', await page.locator('#localBanner').isVisible(), true);
  eq('gate fechado', await page.locator('#gate.open').count(), 0);
  // onboarding: 4 slides
  eq('onboarding aberto', await page.locator('#ob.open').count(), 1);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(150); }
  eq('app visível pós-onboarding', await page.locator('#app').isVisible(), true);

  // Store em modo idb + volumetria dentro do IndexedDB real
  await page.waitForFunction(() => window.Store && Store.ready);
  eq('modo idb', await page.evaluate(() => Store.mode), 'idb');
  eq('115 micros no idb', await page.evaluate(async () => (await Store.all('microconteudos')).length), 115);
  eq('35 semanas no idb', await page.evaluate(async () => (await Store.all('cronograma')).length), 35);

  // Início: próximo arquivo MAC-02 + missão do dia
  await page.waitForTimeout(400);
  eq('próximo arquivo é MAC-02', (await page.locator('#proximo .cod').innerText()).trim(), 'MAC-02');
  eq('missão tem blocos', (await page.locator('#missao li').count()) > 0, true);

  // Territórios: 11 linhas
  await page.click('nav button[data-tab="terr"]');
  eq('11 territórios', await page.locator('#terrList .rowline').count(), 11);

  // navegação pelas 5 abas sem erro
  for (const t of ['itens', 'rev', 'mais', 'inicio']) await page.click(`nav button[data-tab="${t}"]`);

  // tema: auto → light → dark
  await page.click('#btnAvatar'); await page.click('#miTheme'); await page.click('#miTheme');
  eq('tema dark aplicado', await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
  await page.screenshot({ path: 'bcb-dark.png' });

  // reload: D.done persiste (sem onboarding), micros persistem no idb
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  eq('sem onboarding no reload', await page.locator('#ob.open').count(), 0);
  eq('app direto no reload', await page.locator('#app').isVisible(), true);
  await page.waitForFunction(() => window.Store && Store.ready);
  eq('micros persistem no idb', await page.evaluate(async () => (await Store.all('microconteudos')).length), 115);
  eq('tema dark persistiu', await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');

  // marca MAC-02 concluído → próximo vira MAC-01 (transição de status ponta a ponta)
  await page.evaluate(async () => { await Store.update('microconteudos', 'MAC-02', { status: 'CONCLUIDO' }); renderAll(); });
  await page.waitForTimeout(300);
  eq('fila avança p/ MAC-01', (await page.locator('#proximo .cod').innerText()).trim(), 'MAC-01');

  // screenshot claro
  await page.evaluate(() => { D.theme = 'light'; save(); applyTheme(); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'bcb-light.png', fullPage: true });

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS DE PÁGINA:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
