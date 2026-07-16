// Bancada de testes da Fase 1 — Node puro, zero dependências.
// Rodar: node tests/motor.test.js  (exit 1 se qualquer caso falhar)
'use strict';
const { loadBlock } = require('./_extract.js');
const C = loadBlock('motor-cebraspe');
const R = loadBlock('motor-ritmo');

let fails = 0, count = 0;
function eq(nome, got, want) {
  count++;
  const ok = Number.isFinite(want) && Number.isFinite(got)
    ? Math.abs(got - want) < 1e-12
    : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.error(`✗ ${nome}\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(want)}`); }
}
function throws(nome, fn) {
  count++;
  try { fn(); fails++; console.error(`✗ ${nome} (não lançou)`); } catch (e) { /* ok */ }
}

// ═══ §5.1 Pontuação ═══
eq('acerto C', C.corrigirItem('C', 'C'), { correto: true, score: 1 });
eq('erro E×C', C.corrigirItem('E', 'C'), { correto: false, score: -0.5 });
eq('branco', C.corrigirItem('BRANCO', 'E'), { correto: null, score: 0 });
throws('resposta inválida', () => C.corrigirItem('X', 'C'));
throws('gabarito BRANCO é inválido', () => C.corrigirItem('C', 'BRANCO'));

// ═══ §5.2 EV e limiar ═══
eq('EV(1/3) = 0 exato', C.evMarcar(1 / 3), 0);
eq('p=1/3 NÃO marca (estrito)', C.deveMarcar(1 / 3), false);
eq('p=0.3334 marca', C.deveMarcar(0.3334), true);
eq('p=0.3333 NÃO marca (por isso LIMIAR≠0.3333)', C.deveMarcar(0.3333), false);
eq('LIMIAR é 1/3 exato', C.LIMIAR, 1 / 3);
eq('EV(1)=1', C.evMarcar(1), 1);
eq('EV(0)=−0.5', C.evMarcar(0), -0.5);

// ═══ §5.3 Líquido ═══
eq('líquido 100a/20e/120t', C.liquido(100, 20, 120), (100 - 10) / 120); // 0.75
eq('líquido tudo errado = −0.5', C.liquido(0, 10, 10), -0.5);
eq('líquido total 0 → null', C.liquido(0, 0, 0), null);
eq('líquido só brancos', C.liquido(0, 0, 10), 0);
// §5.4: sem arredondamento interno — 4 casas só na formatação
eq('fmt4', C.fmt4(0.6875), '0,6875');
eq('fmtPct 4 casas', C.fmtPct(2 / 3, 4), '66,6667%');
eq('fmt de null', C.fmt4(null), '—');

// ═══ §5.5 Calibração ═══
eq('flag: marcou com conf 2', C.erroCalibracaoItem('C', 2), 'MARCACAO_BAIXA_CONFIANCA');
eq('flag: absteve com conf 3', C.erroCalibracaoItem('BRANCO', 3), 'ABSTENCAO_ALTA_CONFIANCA');
eq('ok: marcou com conf 3', C.erroCalibracaoItem('E', 3), null);
eq('ok: absteve com conf 2', C.erroCalibracaoItem('BRANCO', 2), null);
throws('confiança fora de 1..5', () => C.erroCalibracaoItem('C', 0));

// Brier: acerto com conf 5 → (0.95−1)²=0.0025 · erro com conf 5 → (0.95−0)²=0.9025
eq('brier conhecido', C.brier([
  { resposta: 'C', correto: true, confianca: 5 },
  { resposta: 'C', correto: false, confianca: 5 },
]), (0.0025 + 0.9025) / 2);
eq('brier ignora brancos', C.brier([{ resposta: 'BRANCO', correto: null, confianca: 4 }]), null);

// Diagnóstico: 10 itens conf 4 (esperado 80%) com 5 acertos (50%) → superconfiante
{
  const itens = Array.from({ length: 10 }, (_, i) => ({ resposta: 'C', correto: i < 5, confianca: 4 }));
  const d = C.diagnosticoCalibracao(itens);
  eq('superconfiante detectado', d.niveis[4].diag, 'superconfiante');
  eq('diag agregado', d.diag, 'superconfiante');
  eq('real do nível', d.niveis[4].real, 0.5);
}
// Subconfiante: conf 1 (esperado 20%) com 100% de acerto
{
  const d = C.diagnosticoCalibracao([{ resposta: 'C', correto: true, confianca: 1 }]);
  eq('subconfiante detectado', d.niveis[1].diag, 'subconfiante');
}

// ═══ §5.6 Taxonomia ═══
eq('7 tipos de erro', Object.keys(C.TIPOS_ERRO).length, 7);
eq('tipo válido', C.tipoErroValido('FORMALISMO'), true);
eq('tipo inválido', C.tipoErroValido('CHUTE'), false);

// ═══ Lote ═══
{
  const lote = C.corrigirLote([
    { resposta: 'C', gabarito: 'C', confianca: 4 },
    { resposta: 'E', gabarito: 'C', confianca: 2 },   // erro + flag calibração
    { resposta: 'BRANCO', gabarito: 'E', confianca: 1 },
  ]);
  eq('lote acertos/erros/brancos', [lote.acertos, lote.erros, lote.brancos], [1, 1, 1]);
  eq('lote escore', lote.escore, 0.5);
  eq('lote líquido', lote.liquido, 0.5 / 3);
  eq('lote flag do item 2', lote.itens[1].flagCalibracao, 'MARCACAO_BAIXA_CONFIANCA');
}

// ═══ §11 Blueprint ═══
{
  const soma = Object.values(C.BLUEPRINT_2024.pesos).reduce((a, b) => a + b, 0);
  eq('pesos 2024 somam 120', soma, 120);
  eq('120 itens ⇒ composição = pesos', C.composicaoSimulado(C.BLUEPRINT_2024, 120), C.BLUEPRINT_2024.pesos);
  const c100 = C.composicaoSimulado(C.BLUEPRINT_2024, 100);
  eq('100 itens somam 100', Object.values(c100).reduce((a, b) => a + b, 0), 100);
  const c37 = C.composicaoSimulado(C.BLUEPRINT_2024, 37);
  eq('37 itens somam 37 (maior-resto)', Object.values(c37).reduce((a, b) => a + b, 0), 37);
}

// ═══ §6 pacing — limiares exatos herdados do R+ ═══
// expected = 10*(5/10) = 5 → banda: >5.5 ahead · ≥4.5 ontrack · <4.5 behind
eq('done ≥ target → done', R.pacing(10, 10, 5, 10).status, 'done');
eq('borda: done == expected*1.1 → ontrack (estrito)', R.pacing(10, 5.5, 5, 10).status, 'ontrack');
eq('acima de 1.1 → ahead', R.pacing(10, 5.51, 5, 10).status, 'ahead');
eq('borda: done == expected*0.9 → ontrack (inclusivo)', R.pacing(10, 4.5, 5, 10).status, 'ontrack');
eq('abaixo de 0.9 → behind', R.pacing(10, 4.49, 5, 10).status, 'behind');
eq('target 0, done 0 → ontrack', R.pacing(0, 0, 3, 7).status, 'ontrack');
eq('dTotal 0 não explode', R.pacing(10, 0, 0, 0).status, 'ontrack');
eq('expPct posiciona pmark', R.pacing(10, 0, 5, 10).expPct, 50);

// ═══ §6 alvos e semana-tipo ═══
{
  const somaAlvo = Object.values(R.ALVO_F1).reduce((a, b) => a + b, 0);
  eq('ALVO_F1 soma 15h', somaAlvo, 15);
  const somaSemana = R.SEMANA_TIPO_F1.flat().reduce((a, b) => a + b.h, 0);
  eq('semana-tipo soma 16h', somaSemana, 16);
  eq('domingo tem discursiva (inviolável)', R.SEMANA_TIPO_F1[6].some(b => b.t === 'DISCURSIVA'), true);
}

// ═══ pacing por território (o agregado NÃO mascara) ═══
{
  // Quarta à noite (diaIdx 2 ⇒ 3/7 da semana): Finanças adiantada, Econometria zerada
  const p = R.pacingSemanaPorTerritorio(R.ALVO_F1, { FINANCAS: 2.5, ECONOMETRIA: 0 }, 2);
  eq('Finanças done', p.FINANCAS.status, 'done');
  eq('Econometria behind', p.ECONOMETRIA.status, 'behind');
}

// ═══ progresso ponderado ═══
eq('ponderado: 100% num peso 18 e 0% num peso 18 = 50%',
  R.progressoPonderado([
    { id: 'FIN', peso: 18, concluidos: 14, total: 14 },
    { id: 'MAC', peso: 18, concluidos: 0, total: 19 },
  ]), 50);
eq('território total 0 fica fora do denominador',
  R.progressoPonderado([
    { id: 'FIN', peso: 18, concluidos: 7, total: 14 },
    { id: 'ATU', peso: 5, concluidos: 0, total: 0 },
  ]), 50);
eq('sem territórios → 0', R.progressoPonderado([]), 0);

// ═══ examPacing (±5pp) ═══
eq('behind: 5.1pp abaixo', R.examPacing(20, 10, 35).status, ((10 / 35) * 100 - 20 > 5) ? 'behind' : 'ontrack');
eq('borda: exatamente −5pp é ontrack', R.examPacing((10 / 35) * 100 - 5, 10, 35).status, 'ontrack');
eq('ahead a +5.01pp', R.examPacing((10 / 35) * 100 + 5.01, 10, 35).status, 'ahead');

// ═══ §10 checkpoints ═══
{
  const cp1 = R.CHECKPOINTS[0];
  const ok = R.avaliaCheckpoint(cp1, {
    liquidoPorTerritorio: { FINANCAS: 0.86, MACRO: 0.65, ECONOMETRIA: 0.60, LOGICA: 0.71, COSIF: 0.60, ESTATISTICA: 0.80, DIREITO: 0.50 },
    discursivas: 8,
  });
  eq('CP1 aprovado nas bordas (≥ inclusivo)', ok.aprovado, true);
  const falho = R.avaliaCheckpoint(cp1, {
    liquidoPorTerritorio: { FINANCAS: 0.86, MACRO: 0.65, ECONOMETRIA: 0.59, LOGICA: 0.71, COSIF: 0.60, ESTATISTICA: 0.80, DIREITO: 0.50 },
    discursivas: 7,
  });
  eq('CP1 reprova: 2 pendências (Econometria + discursivas)', falho.pendencias.length, 2);
  const semDado = R.avaliaCheckpoint(cp1, { liquidoPorTerritorio: {}, discursivas: 8 });
  eq('CP1 sem dado = reprovado (7 pendências)', semDado.pendencias.length, 7);
}

// ═══ §9.4 gatilho Econometria ═══
eq('59.99% dispara', R.gatilhoReforcoEconometria(0.5999).dispara, true);
eq('60% exato NÃO dispara (≥ inclusivo)', R.gatilhoReforcoEconometria(0.60).dispara, false);
eq('sem dado dispara', R.gatilhoReforcoEconometria(null).dispara, true);

console.log(fails === 0 ? `✅ ${count}/${count} casos passaram` : `❌ ${fails}/${count} falharam`);
process.exit(fails ? 1 : 0);
