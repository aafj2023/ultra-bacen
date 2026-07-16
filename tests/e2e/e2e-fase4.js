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
    res.writeHead(200, { 'content-type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' }[path.extname(p)] || 'text/plain' });
    res.end(data);
  });
});
const CDN = {
  'chart.js@4.5.0/dist/chart.umd.js': 'chart.js/dist/chart.umd.js',
  'dexie@4.4.4/dist/dexie.min.js': 'dexie/dist/dexie.min.js',
  'katex@0.17.0/dist/katex.min.css': 'katex/dist/katex.min.css',
  'katex@0.17.0/dist/katex.min.js': 'katex/dist/katex.min.js',
  'katex@0.17.0/dist/contrib/auto-render.min.js': 'katex/dist/contrib/auto-render.min.js'
};
(async () => {
  await new Promise(r => server.listen(8142, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const errors = []; let fails = 0, count = 0;
  const eq = (n, g, w) => { count++; if (JSON.stringify(g) !== JSON.stringify(w)) { fails++; console.error(`✗ ${n}: got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
  const page = await (await browser.newContext({ viewport: { width: 400, height: 880 }, serviceWorkers: 'block' })).newPage();
  await page.route('**/cdn.jsdelivr.net/npm/**', route => {
    const k = Object.keys(CDN).find(k => route.request().url().includes(k));
    if (!k) return route.abort();
    route.fulfill({ body: fs.readFileSync(path.join(NM, CDN[k])), contentType: route.request().url().endsWith('.css') ? 'text/css' : 'text/javascript' });
  });
  await page.route('**/www.gstatic.com/**', r => r.abort());
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8142/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);
  await page.waitForTimeout(400);

  // drill-down: MACRO tem 19 micros na ordem da fila (MAC-02 primeiro)
  await page.click('nav button[data-tab="terr"]');
  await page.click('#terrList .terr-row:nth-child(2)'); // Macroeconomia (2ª linha; 1ª é Português)
  await page.waitForTimeout(300);
  eq('19 micros no MACRO', await page.locator('#terrDetail .micro-row').count(), 19);
  eq('primeiro da lista é MAC-02', (await page.locator('#terrDetail .micro-row .cod').first().innerText()).trim(), 'MAC-02');
  eq('natureza no header', (await page.locator('#terrDetail .badge').nth(1).innerText()).trim(), 'RECONSTRUCAO');

  // sheet do micro: status GERADO + driveUrl
  await page.locator('#terrDetail .micro-row').first().click();
  await page.waitForTimeout(200);
  eq('sheet aberto', await page.locator('#microBack.open').count(), 1);
  await page.evaluate(() => { document.getElementById('mDrive').value = 'https://drive.google.com/x/mac02'; });
  await page.click('#microSheet button.btn.small'); // Salvar
  await page.waitForTimeout(200);
  await page.click('#microSheet .stbtns button:nth-child(2)'); // GERADO
  await page.waitForTimeout(300);
  const m = await page.evaluate(() => Store.get('microconteudos', 'MAC-02'));
  eq('status GERADO persistido', m.status, 'GERADO');
  eq('geradoEm carimbado', typeof m.geradoEm, 'string');
  eq('driveUrl salvo', m.driveUrl, 'https://drive.google.com/x/mac02');

  // fila do Início avança (GERADO sai da fila de geração)
  await page.click('#microSheet .btn.sec'); // Fechar
  await page.click('nav button[data-tab="inicio"]');
  await page.waitForTimeout(300);
  eq('próximo arquivo virou MAC-01', (await page.locator('#proximo .cod').innerText()).trim(), 'MAC-01');

  // URL inválida é rejeitada
  await page.click('nav button[data-tab="terr"]');
  await page.waitForTimeout(200);
  await page.locator('#terrDetail .micro-row').nth(1).click();
  await page.waitForTimeout(200);
  await page.evaluate(() => { document.getElementById('mDrive').value = 'nota-qualquer'; });
  await page.click('#microSheet button.btn.small');
  await page.waitForTimeout(200);
  eq('URL inválida não persiste', (await page.evaluate(() => Store.get('microconteudos', 'MAC-01'))).driveUrl, null);

  // reload: status/drive persistem no idb; voltar do drill funciona
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.waitForFunction(() => window.Store && Store.ready);
  const m2 = await page.evaluate(() => Store.get('microconteudos', 'MAC-02'));
  eq('reload preserva GERADO', m2.status, 'GERADO');
  eq('reload preserva driveUrl', m2.driveUrl, 'https://drive.google.com/x/mac02');
  await page.click('nav button[data-tab="terr"]');
  await page.click('#terrList .terr-row:nth-child(2)');
  await page.waitForTimeout(200);
  await page.click('#terrDetail .backbtn');
  await page.waitForTimeout(200);
  eq('voltar restaura o grid', await page.locator('#terrList .terr-row').count(), 11);
  await page.click('#terrList .terr-row:nth-child(2)');
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'bcb-terr.png' });

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-4 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
