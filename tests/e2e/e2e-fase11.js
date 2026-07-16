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
  await new Promise(r => server.listen(8149, r));
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
  await page.goto('http://localhost:8149/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  for (let i = 0; i < 4; i++) { await page.click('#obNext'); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.Store && Store.ready);
  await page.waitForTimeout(300);

  // blueprint 2024 default no Plano
  await page.click('nav button[data-tab="mais"]');
  await page.waitForTimeout(400);
  eq('blueprint 2024 default', (await page.locator('#bpAtivo').innerText()).trim(), '2024');
  eq('resumo com limiar 33,33%', (await page.locator('#bpResumo').innerText()).includes('33,33%'), true);
  eq('allowlist oculta em modo local', await page.locator('#allowBox').isVisible(), false);

  // gap analysis: cola edital com Solow (IGUAL) + SFN (gatilho)
  await page.click('#btnGap');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.getElementById('gapTxt').value =
      'Solow: estado estacionario, regra de ouro, convergencia\n' +
      'Lei 4.595 e a estrutura do Sistema Financeiro Nacional\n' +
      'Topico completamente inedito de regulacao de criptoativos e stablecoins';
  });
  await page.evaluate(() => rodarGap());
  await page.waitForTimeout(400);
  const res = await page.locator('#gapResult').innerText();
  eq('IGUAL contado', res.includes('IGUAL'), true);
  eq('gatilho SFN listado', res.includes('CONT-SFN-01'), true);
  eq('relatório persistido', await page.evaluate(() => Store.getSetting('gapAnalysis2027').then(g => g.marcas.length)), 3);

  // ativa dormentes → saem de dormente e entram no território CONT
  await page.evaluate(() => ativarDormentes());
  await page.waitForTimeout(400);
  const sfn = await page.evaluate(() => Store.get('microconteudos', 'CONT-SFN-01'));
  eq('dormente ativado', [sfn.dormente, sfn.territorio], [false, 'CONT']);
  // agora aparece na fila quando tudo mais estiver concluído (prioridade CONT = última)
  const fila = await page.evaluate(async () => {
    const micros = (await Store.all('microconteudos')).map(m =>
      (!m.dormente && m.prioridade !== 'CONT') ? Object.assign({}, m, { status: 'CONCLUIDO' }) : m);
    return Seeds.proximoArquivo(micros);
  });
  eq('CONT entra no fim da fila', fila.codigo, 'CONT-SFN-01');

  // blueprint 2027 com penalização −1 → limiar 50%
  await page.evaluate(() => { document.getElementById('bpErro').value = '-1'; document.getElementById('bpErro').dispatchEvent(new Event('input')); });
  await page.waitForTimeout(150);
  eq('limiar recalibrado exibido', (await page.locator('#bpLimiar').innerText()).includes('50,00%'), true);
  await page.evaluate(() => ativarBlueprint2027());
  await page.waitForTimeout(300);
  eq('blueprint 2027 ativo', (await page.locator('#bpAtivo').innerText()).trim(), '2027');
  eq('resumo mostra −1,00 e 50,00%', (await page.locator('#bpResumo').innerText()).includes('50,00%'), true);
  // persiste no reload
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.waitForFunction(() => window.Store && Store.ready);
  eq('2027 sobrevive ao reload', await page.evaluate(() => blueprintAtivo().versao), '2027');
  eq('simulado usaria erro −1', await page.evaluate(() => blueprintAtivo().erro), -1);

  // export 03: conteúdo direto da função pura com dados vivos
  await page.evaluate(() => setMicroStatus('MAC-02', 'CONCLUIDO'));
  await page.waitForTimeout(300);
  const md = await page.evaluate(async () => Seeds.gerarMapa03(await Store.all('microconteudos'), today()));
  eq('03 marca MAC-02 concluído', md.includes('- [x] **MAC-02**'), true);
  eq('03 tem seção CONT (ativados)', md.includes('CONT-SFN-01'), true);
  eq('03 mantém dormentes restantes', md.includes('## DORMENTES'), true);

  await browser.close(); server.close();
  if (errors.length) { console.error('ERROS:\n' + errors.join('\n')); process.exit(1); }
  console.log(fails === 0 ? `✅ e2e fase-11/12 ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FALHA:', e); server.close(); process.exit(1); });
