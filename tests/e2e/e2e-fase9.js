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
  await new Promise(r => server.listen(8147, r));
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
  await page.goto('http://localhost:8147/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);
  await page.waitForTimeout(400);

  // registrar sessão de MACRO 120min → horizonte reflete
  await page.selectOption('#sTerr', 'MACRO');
  await page.fill('#sMin', '120');
  await page.click('#btnSessao');
  await page.waitForTimeout(400);
  eq('sessão de hoje listada', (await page.locator('#sHoje').innerText()).includes('2,0h'), true);
  const hor = await page.locator('#horizontes').innerText();
  eq('horizonte MACRO mostra 2,0/3,5h', hor.includes('2,0/3,5h'), true);
  eq('pílulas presentes', /no ritmo|adiantado|atrasado|feito/.test(hor), true);
  // desfazer
  await page.evaluate(() => desfazerSessao());
  await page.waitForTimeout(300);
  eq('desfazer zera', (await page.locator('#sHoje').innerText()).includes('Nada registrado'), true);
  await page.click('#btnSessao'); // registra de novo p/ stats
  await page.waitForTimeout(300);

  // gera itens p/ stats: 1 questão respondida errada com taxonomia
  await page.evaluate(async () => {
    await Store.add('banco', { microcodigo: 'MAC-02', territorio: 'MACRO', gabarito: 'C', enunciado: 'Julgue o item de teste de stats para a fase nove.', fonte: null, comentario: null, favorita: false });
    await Store.add('itens', { data: today(), bancoId: 1, microcodigo: 'MAC-02', territorio: 'MACRO', loteId: 1, resposta: 'E', correto: false, confianca: 4, tempoMs: 30000, tipoErro: 'FORMALISMO', score: -0.5, flagCalibracao: null });
    await Store.add('itens', { data: today(), bancoId: 1, microcodigo: 'MAC-02', territorio: 'MACRO', loteId: 1, resposta: 'C', correto: true, confianca: 4, tempoMs: 20000, tipoErro: null, score: 1, flagCalibracao: null });
    renderStats();
  });
  await page.waitForTimeout(500);
  const top = await page.locator('#stTop').innerText();
  eq('streak ≥1', /streak\s+\d+d/.test(top), true);
  eq('líquido no topo', top.includes('Líquido'), true);
  eq('tempo médio', /t\/item\s+\d+s/.test(top), true);
  eq('cobertura ponderada', top.includes('cobertura'), true);
  eq('heatmap com 84 células', await page.locator('#stHeat i').count(), 84);
  eq('célula de hoje ativa', await page.locator('#stHeat i.l1, #stHeat i.l2, #stHeat i.l3, #stHeat i.l4').count() >= 1, true);
  eq('mapa de erros mostra FORMALISMO', (await page.locator('#stErros').innerText()).includes('FORMALISMO'), true);
  // gráficos renderizados (canvas com contexto usado)
  eq('gráfico do líquido existe', await page.evaluate(() => !!window.chLiq || document.getElementById('chLiq').width > 0), true);
  await page.click('nav button[data-tab="mais"]');
  await page.waitForTimeout(500);
  eq('gráfico de calibração renderiza no pane visível', await page.evaluate(() => !!window.chCal && document.getElementById('chCal').width > 0), true);
  await page.click('nav button[data-tab="mais"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'bcb-stats.png', fullPage: true });

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-9 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
