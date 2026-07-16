// ═══════════════════════════════════════════════════════════════════════════
// MOTOR CEBRASPE — funções puras (§5 da spec). Sem estado, sem DOM, sem I/O.
// Inlined no index.html na Fase 3; testado em Node (tests/motor.test.js).
// Regras NÃO negociáveis: +1,00 acerto · −0,50 erro · 0 branco · limiar p>1/3.
// Precisão: nunca arredondar em cálculo interno; formatação só na UI (fmt4).
// ═══════════════════════════════════════════════════════════════════════════
(function (root) {
'use strict';

// ── §5.2 Limiar de marcação ─────────────────────────────────────────────────
// EV(marcar) = p·1,00 + (1−p)·(−0,50) = 1,5p − 0,5  →  EV>0 ⟺ p>1/3.
// 1/3 EXATO (a spec escreve 0.3333, mas §5.4 proíbe arredondar internamente;
// 0.3333 < 1/3 marcaria itens com EV negativo). Exibição: LIMIAR_LABEL.
var LIMIAR = 1 / 3;
var LIMIAR_LABEL = '33,33%';

// ── §5.1 Pontuação (score SEMPRE derivado) ──────────────────────────────────
// resposta/gabarito ∈ 'C' | 'E' | 'BRANCO' (gabarito nunca é BRANCO).
function corrigirItem(resposta, gabarito) {
  if (resposta !== 'C' && resposta !== 'E' && resposta !== 'BRANCO')
    throw new Error('resposta inválida: ' + resposta);
  if (gabarito !== 'C' && gabarito !== 'E')
    throw new Error('gabarito inválido: ' + gabarito);
  if (resposta === 'BRANCO') return { correto: null, score: 0 };
  var ok = resposta === gabarito;
  return { correto: ok, score: ok ? 1.0 : -0.5 };
}

// ── §5.3 Percentual líquido — A métrica. Bruto é secundário. ────────────────
// Retorna fração [−0.5, 1] (ex.: 0.6875) ou null sem itens. Nunca arredonda.
function liquido(acertos, erros, total) {
  if (!total || total <= 0) return null;
  return (acertos - 0.5 * erros) / total;
}
function bruto(acertos, total) {
  if (!total || total <= 0) return null;
  return acertos / total;
}

// ── §5.2 EV e decisão de marcação ───────────────────────────────────────────
function evMarcar(p) { return 1.5 * p - 0.5; }
function deveMarcar(p) { return p > LIMIAR; }  // estrito: p=1/3 → EV=0 → branco

// ── §5.5 Calibração ─────────────────────────────────────────────────────────
// Probabilidade declarada por nível de confiança (faixas da spec).
var FAIXA_CONFIANCA = { 1: 0.20, 2: 0.40, 3: 0.60, 4: 0.80, 5: 0.95 };

// Erro de calibração de UM item (flag imediata, §5.2):
//   marcou com confiança ≤2 (EV declarado negativo) ou absteve com ≥3.
function erroCalibracaoItem(resposta, confianca) {
  if (!(confianca >= 1 && confianca <= 5)) throw new Error('confiança inválida: ' + confianca);
  var marcou = resposta !== 'BRANCO';
  if (marcou && confianca <= 2) return 'MARCACAO_BAIXA_CONFIANCA';
  if (!marcou && confianca >= 3) return 'ABSTENCAO_ALTA_CONFIANCA';
  return null;
}

// Brier score: média((p_declarada − acerto)²), acerto∈{0,1}.
// Só itens MARCADOS entram (branco não tem outcome binário). null se vazio.
function brier(itens) {
  var s = 0, n = 0;
  for (var i = 0; i < itens.length; i++) {
    var it = itens[i];
    if (it.resposta === 'BRANCO' || it.correto === null || it.correto === undefined) continue;
    var p = FAIXA_CONFIANCA[it.confianca];
    if (p === undefined) throw new Error('confiança inválida: ' + it.confianca);
    var a = it.correto ? 1 : 0;
    s += (p - a) * (p - a); n++;
  }
  return n ? s / n : null;
}

// Diagnóstico por nível: real < esperado−tol → superconfiante (o pecado caro:
// cada erro custa 1,5 de swing); real > esperado+tol → subconfiante.
// Retorna { niveis: {1..5: {n, real, esperado, diag}}, brier, diag } — diag
// agregado = do nível marcado mais populoso com problema, ou 'calibrado'.
function diagnosticoCalibracao(itens, tol) {
  tol = (tol === undefined) ? 0.10 : tol;
  var niveis = {}, c;
  for (c = 1; c <= 5; c++) niveis[c] = { n: 0, acertos: 0 };
  itens.forEach(function (it) {
    if (it.resposta === 'BRANCO' || it.correto === null || it.correto === undefined) return;
    niveis[it.confianca].n++;
    if (it.correto) niveis[it.confianca].acertos++;
  });
  var pior = null;
  for (c = 1; c <= 5; c++) {
    var v = niveis[c];
    v.esperado = FAIXA_CONFIANCA[c];
    v.real = v.n ? v.acertos / v.n : null;
    v.diag = v.real === null ? null
      : v.real < v.esperado - tol ? 'superconfiante'
      : v.real > v.esperado + tol ? 'subconfiante'
      : 'calibrado';
    if (v.diag && v.diag !== 'calibrado' && (!pior || v.n > pior.n)) pior = { n: v.n, diag: v.diag };
  }
  return { niveis: niveis, brier: brier(itens), diag: pior ? pior.diag : 'calibrado' };
}

// ── §5.6 Taxonomia de erros (enum FECHADO — sem classificação, item não sai
// da fila de reteste; o bloqueio de fluxo é da UI, a validação é daqui) ──────
var TIPOS_ERRO = {
  NORMATIVO_DESATUALIZADO: 'Convicção em norma revogada',
  VERDADE_ESTRANHA:        'Verdade contraintuitiva marcada como Errado',
  CALCULO_SOB_PRESSAO:     'Execução numérica sob pressão',
  CALIBRACAO:              'Marcação/abstenção fora do limiar',
  FORMALISMO:              'Prática ≠ premissa formal do modelo',
  LACUNA_CONTEUDO:         'Desconhecimento puro',
  INTERPRETACAO:           'Leitura do enunciado'
};
function tipoErroValido(t) { return Object.prototype.hasOwnProperty.call(TIPOS_ERRO, t); }

// ── Agregador de lote (treino/revisão/simulado): tudo derivado ──────────────
// itens: [{resposta,'C'|'E'|'BRANCO', gabarito, confianca}] → totais + líquido.
function corrigirLote(itens) {
  var acertos = 0, erros = 0, brancos = 0, escore = 0;
  var corrigidos = itens.map(function (it) {
    var r = corrigirItem(it.resposta, it.gabarito);
    if (r.correto === true) acertos++;
    else if (r.correto === false) erros++;
    else brancos++;
    escore += r.score;
    var flag = (it.confianca !== undefined) ? erroCalibracaoItem(it.resposta, it.confianca) : null;
    return { correto: r.correto, score: r.score, flagCalibracao: flag };
  });
  return {
    itens: corrigidos, total: itens.length,
    acertos: acertos, erros: erros, brancos: brancos,
    escore: escore,                                  // pontos Cebraspe (soma)
    liquido: liquido(acertos, erros, itens.length),  // fração, não arredondada
    bruto: bruto(acertos, itens.length)
  };
}

// ── §5.4 Formatação (ÚNICO lugar onde se arredonda; 4 casas) ────────────────
function fmt4(x) {
  if (x === null || x === undefined || isNaN(x)) return '—';
  return x.toFixed(4).replace('.', ',');
}
function fmtPct(x, casas) { // fração → percentual pt-BR (padrão 2 casas na UI)
  if (x === null || x === undefined || isNaN(x)) return '—';
  return (x * 100).toFixed(casas === undefined ? 2 : casas).replace('.', ',') + '%';
}

// ── §11 Blueprint da prova (VERSIONADO — nunca hardcode peso em componente) ─
var BLUEPRINT_2024 = {
  versao: '2024', totalItens: 120, duracaoMin: 210,
  acerto: 1.0, erro: -0.5, branco: 0,
  discursivas: { qtd: 2, pontos: 50, linhas: 80 },
  pesos: { PORTUGUES: 25, MACRO: 18, FINANCAS: 18, ESTATISTICA_ECONOMETRIA: 12,
           COSIF: 12, MICRO: 10, LOGICA_ESTAT: 10, FMM: 10, DIREITO: 5 }
};

// Composição de simulado com n itens na proporção real do blueprint ativo.
// Maior-resto (Hamilton): soma EXATAMENTE n, sem viés de arredondamento.
function composicaoSimulado(blueprint, n) {
  var chaves = Object.keys(blueprint.pesos);
  var somaPesos = chaves.reduce(function (s, k) { return s + blueprint.pesos[k]; }, 0);
  var exatos = chaves.map(function (k) {
    var e = n * blueprint.pesos[k] / somaPesos;
    return { k: k, base: Math.floor(e), resto: e - Math.floor(e) };
  });
  var faltam = n - exatos.reduce(function (s, x) { return s + x.base; }, 0);
  var porResto = exatos.slice().sort(function (a, b) { return b.resto - a.resto || a.k.localeCompare(b.k); });
  var ganhaExtra = {};
  porResto.forEach(function (x, i) { if (i < faltam) ganhaExtra[x.k] = true; });
  var out = {}; // ordem das chaves = ordem do blueprint (determinística p/ UI)
  exatos.forEach(function (x) { out[x.k] = x.base + (ganhaExtra[x.k] ? 1 : 0); });
  return out;
}

var M = {
  LIMIAR: LIMIAR, LIMIAR_LABEL: LIMIAR_LABEL, FAIXA_CONFIANCA: FAIXA_CONFIANCA,
  TIPOS_ERRO: TIPOS_ERRO, BLUEPRINT_2024: BLUEPRINT_2024,
  corrigirItem: corrigirItem, corrigirLote: corrigirLote,
  liquido: liquido, bruto: bruto,
  evMarcar: evMarcar, deveMarcar: deveMarcar,
  erroCalibracaoItem: erroCalibracaoItem, brier: brier,
  diagnosticoCalibracao: diagnosticoCalibracao, tipoErroValido: tipoErroValido,
  fmt4: fmt4, fmtPct: fmtPct, composicaoSimulado: composicaoSimulado
};
if (typeof module !== 'undefined' && module.exports) module.exports = M;
else root.MotorCebraspe = M;
})(typeof self !== 'undefined' ? self : this);
