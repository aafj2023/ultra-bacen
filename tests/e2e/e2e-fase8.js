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
  await new Promise(r => server.listen(8146, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
  const errors = []; let fails = 0, count = 0;
  const eq = (n, g, w) => { count++; if (JSON.stringify(g) !== JSON.stringify(w)) { fails++; console.error(`✗ ${n}: got ${JSON.stringify(g)} want ${JSON.stringify(w)}`); } };
  const page = await (await browser.newContext({ viewport: { width: 400, height: 900 }, serviceWorkers: 'block' })).newPage();
  await page.route('**/cdn.jsdelivr.net/npm/**', route => {
    const k = Object.keys(CDN).find(k => route.request().url().includes(k));
    if (!k) return route.abort();
    route.fulfill({ body: fs.readFileSync(path.join(NM, CDN[k])), contentType: route.request().url().endsWith('.css') ? 'text/css' : 'text/javascript' });
  });
  await page.route('**/www.gstatic.com/**', r => r.abort());
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('http://localhost:8146/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);
  await page.waitForTimeout(300);

  // gancho: micro → EM_ESTUDO agenda D+1 (MAC-02, sem dobra)
  await page.evaluate(() => setMicroStatus('MAC-02', 'EM_ESTUDO'));
  await page.waitForTimeout(300);
  await page.evaluate(() => fecharMicro());
  let revs = await page.evaluate(() => Store.all('revisoes'));
  eq('revisão criada no estudo', revs.length, 1);
  eq('D+1 sem dobra', revs[0].dueDate, await page.evaluate(() => Seeds.addDias(today(), 1)));
  // COSIF (dobra): D+1 continua 1 (min 1)
  await page.evaluate(() => setMicroStatus('COS-01', 'CONCLUIDO'));
  await page.waitForTimeout(300);
  await page.evaluate(() => fecharMicro());
  // idempotente: repetir status não duplica
  await page.evaluate(() => setMicroStatus('MAC-02', 'CONCLUIDO'));
  await page.waitForTimeout(300);
  await page.evaluate(() => fecharMicro());
  revs = await page.evaluate(() => Store.all('revisoes'));
  eq('sem duplicata p/ mesmo tópico', revs.length, 2);

  // vence a revisão do MAC-02 (simula ontem) → fila de hoje mostra
  await page.evaluate(async () => {
    const r = (await Store.all('revisoes')).find(x => x.topicId === 'MAC-02');
    await Store.update('revisoes', r.id, { dueDate: Seeds.addDias(today(), -1) });
    renderRevisoes();
  });
  await page.click('nav button[data-tab="rev"]');
  await page.waitForTimeout(300);
  eq('fila mostra atrasada', (await page.locator('#revHoje').innerText()).includes('atrasada'), true);
  eq('badge na nav', (await page.locator('nav button[data-tab="rev"]').innerText()).includes('(1)'), true);

  // OK → stage 2, D+7 a partir de hoje
  await page.locator('#revHoje .btn.small').first().click();
  await page.waitForTimeout(300);
  revs = await page.evaluate(() => Store.all('revisoes'));
  const mac = revs.find(r => r.topicId === 'MAC-02');
  eq('OK → stage 2', mac.stage, 2);
  eq('OK → D+7 de hoje', mac.dueDate, await page.evaluate(() => Seeds.addDias(today(), 7)));

  // Difícil: vence a do COS-01 e clica Difícil → +2d stage mantido
  await page.evaluate(async () => {
    const r = (await Store.all('revisoes')).find(x => x.topicId === 'COS-01');
    await Store.update('revisoes', r.id, { dueDate: today() });
    renderRevisoes();
  });
  await page.waitForTimeout(200);
  await page.locator('#revHoje .btn.sec.small').first().click();
  await page.waitForTimeout(300);
  const cos = (await page.evaluate(() => Store.all('revisoes'))).find(r => r.topicId === 'COS-01');
  eq('difícil mantém stage', cos.stage, 1);
  eq('difícil +2d', cos.dueDate, await page.evaluate(() => Seeds.addDias(today(), 2)));

  // retro: marca 3 micros estudados sem revisão e reconstrói (teto 2)
  await page.evaluate(async () => {
    for (const c of ['LOG-02', 'LOG-03', 'FIN-08'])
      await Store.update('microconteudos', c, { status: 'EM_ESTUDO' }); // direto, sem gancho
    D.reviewBudget = 2; save();
    page_dialogs_accept = true;
  });
  page.on('dialog', d => d.accept());
  await page.evaluate(() => executarRetro());
  await page.waitForTimeout(400);
  revs = await page.evaluate(() => Store.all('revisoes'));
  const retro = revs.filter(r => r.origin === 'retro');
  eq('3 retro agendadas', retro.length, 3);
  const porDia = {};
  retro.forEach(r => porDia[r.dueDate] = (porDia[r.dueDate] || 0) + 1);
  eq('teto 2/dia respeitado', Object.values(porDia).every(n => n <= 2), true);
  await page.screenshot({ path: 'bcb-srs.png' });

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-8 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
