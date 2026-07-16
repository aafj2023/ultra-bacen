// ═══════════════════════════════════════════════════════════════════════════
// MOTOR DE RITMO — por território (§6 da spec). Funções puras, sem estado.
// Assinatura/limiares/status HERDADOS do R+ (pacing intacto — ver
// docs/ARQUITETURA-HERDADA.md §1.2); a mudança central é operar POR TERRITÓRIO
// em vez de agregado (média esconderia Finanças adiantada mascarando
// Econometria atrasada).
// ═══════════════════════════════════════════════════════════════════════════
(function (root) {
'use strict';

// ── Núcleo herdado do R+ (limiares NÃO negociáveis, §6) ─────────────────────
// done >= target → 'done' · done > expected*1.1 → 'ahead'
// done >= expected*0.9 → 'ontrack' · senão → 'behind'
function pacing(target, done, dElapsed, dTotal) {
  if (!dTotal || dTotal <= 0) { dElapsed = 0; dTotal = 1; }
  if (dElapsed < 0) dElapsed = 0;
  if (dElapsed > dTotal) dElapsed = dTotal;
  var expected = target * (dElapsed / dTotal);
  var status =
    (target > 0 && done >= target) ? 'done' :
    (done > expected * 1.1)        ? 'ahead' :
    (done >= expected * 0.9)       ? 'ontrack' : 'behind';
  return {
    target: target, done: done, expected: expected, status: status,
    pct: target > 0 ? Math.min(100, done / target * 100) : 0,
    expPct: target > 0 ? Math.min(100, expected / target * 100) : 0  // marca pmark
  };
}

// ── §6 Alvos da Fase 1 (h/semana; Σ=15h + ~1h folga = 16h disponíveis) ──────
var ALVO_F1 = { MACRO: 3.5, ECONOMETRIA: 2.5, FINANCAS: 2.5, COSIF: 2.0,
                LOGICA: 1.5, DIREITO: 1.0, DISCURSIVA: 1.0, DRILL: 1.0 };

// ── §6 Semana-tipo Fase 1 (0=Seg … 6=Dom — o "Hoje" sabe o cardápio) ────────
var SEMANA_TIPO_F1 = [
  [{ t: 'MACRO', h: 2.0 }],
  [{ t: 'ECONOMETRIA', h: 2.0 }],
  [{ t: 'FINANCAS', h: 2.0 }],
  [{ t: 'MACRO', h: 1.5 }, { t: 'ECONOMETRIA', h: 0.5 }],
  [{ t: 'COSIF', h: 1.5 }, { t: 'LOGICA', h: 0.25 }, { t: 'DIREITO', h: 0.25 }],
  [{ t: 'DRILL', h: 1.0 }, { t: 'COSIF', h: 1.0 }, { t: 'LOGICA', h: 1.0 }],
  [{ t: 'DISCURSIVA', h: 1.0 }, { t: 'REVISAO_ANKI', h: 1.0 }, { t: 'QUESTOES', h: 1.0 }]
];

// Invioláveis (§6): marcar em vermelho se a semana for perdida.
var INVIOLAVEIS = ['ANKI_DIARIO', 'DISCURSIVA_DOMINGO'];

// ── Ritmo semanal POR TERRITÓRIO ────────────────────────────────────────────
// alvos: mapa território→h/semana (ex.: ALVO_F1) · horasFeitas: mapa
// território→h realizadas na semana · diaIdx: 0=Seg…6=Dom (dias decorridos
// INCLUINDO hoje = diaIdx+1). Retorna mapa território→pacing().
function pacingSemanaPorTerritorio(alvos, horasFeitas, diaIdx) {
  var out = {};
  Object.keys(alvos).forEach(function (t) {
    out[t] = pacing(alvos[t], horasFeitas[t] || 0, diaIdx + 1, 7);
  });
  return out;
}

// ── Progresso ponderado por peso (§6: donePct do examPacing) ────────────────
// territorios: [{id, peso, concluidos, total}] (microconteúdos ATIVOS; total=0
// e dormentes ficam de fora do numerador E do denominador).
// Retorna percentual 0–100, não arredondado.
function progressoPonderado(territorios) {
  var num = 0, den = 0;
  territorios.forEach(function (t) {
    if (!t.total || t.total <= 0) return;
    num += t.peso * (t.concluidos / t.total);
    den += t.peso;
  });
  return den > 0 ? (num / den) * 100 : 0;
}

// ── §6 Projeção até a prova (examPacing adaptado) ───────────────────────────
// plannedPct = semanasDecorridas/totalSemanas · behind se donePct < planned−5.
// 'ahead' espelhado a +5pp (premissa registrada em docs/DECISOES.md).
function examPacing(donePct, semanasDecorridas, totalSemanas) {
  totalSemanas = totalSemanas || 35;
  var plannedPct = Math.min(100, (semanasDecorridas / totalSemanas) * 100);
  var status = donePct < plannedPct - 5 ? 'behind'
             : donePct > plannedPct + 5 ? 'ahead' : 'ontrack';
  return { donePct: donePct, plannedPct: plannedPct, status: status,
           gapPP: donePct - plannedPct };
}

// ── §10 Checkpoints (todo critério lê LÍQUIDO — frações, nunca bruto) ───────
var CHECKPOINTS = [
  { id: 'CP1', semana: 10, criterios: { FINANCAS: 0.85, MACRO: 0.65, ECONOMETRIA: 0.60,
      LOGICA: 0.70, COSIF: 0.60, ESTATISTICA: 0.80, DIREITO: 0.50 }, discursivasMin: 8 },
  { id: 'CP2', semana: 16, liquidoGlobalMin: 0.65, itensMin: 100 },
  { id: 'CP3', semana: 22, liquidoGlobalMin: 0.70, discursivasMin: 20, coberturaMin: 100 },
  { id: 'CP4', semana: 31, liquidoGlobalMin: 0.75 }
];

// medidas: { liquidoPorTerritorio:{T:fração|null}, liquidoGlobal, discursivas,
//            itens, coberturaPct }. Retorna { aprovado, pendencias:[texto] }.
function avaliaCheckpoint(cp, medidas) {
  var pend = [];
  if (cp.criterios) Object.keys(cp.criterios).forEach(function (t) {
    var atual = medidas.liquidoPorTerritorio ? medidas.liquidoPorTerritorio[t] : null;
    if (atual === null || atual === undefined)
      pend.push(t + ': sem dado (mínimo ' + (cp.criterios[t] * 100) + '% líquido)');
    else if (atual < cp.criterios[t])
      pend.push(t + ': líquido ' + (atual * 100).toFixed(2) + '% < ' + (cp.criterios[t] * 100) + '%');
  });
  if (cp.liquidoGlobalMin !== undefined && !(medidas.liquidoGlobal >= cp.liquidoGlobalMin))
    pend.push('líquido global ' + (medidas.liquidoGlobal != null ? (medidas.liquidoGlobal * 100).toFixed(2) + '%' : 'sem dado') + ' < ' + (cp.liquidoGlobalMin * 100) + '%');
  if (cp.discursivasMin !== undefined && !(medidas.discursivas >= cp.discursivasMin))
    pend.push('discursivas ' + (medidas.discursivas || 0) + ' < ' + cp.discursivasMin);
  if (cp.itensMin !== undefined && !(medidas.itens >= cp.itensMin))
    pend.push('itens ' + (medidas.itens || 0) + ' < ' + cp.itensMin);
  if (cp.coberturaMin !== undefined && !(medidas.coberturaPct >= cp.coberturaMin))
    pend.push('cobertura ' + (medidas.coberturaPct || 0) + '% < ' + cp.coberturaMin + '%');
  return { aprovado: pend.length === 0, pendencias: pend };
}

// ── §9.4 Gatilho automático da Econometria ──────────────────────────────────
// CP1 com Econometria < 60% líquido → 1 semana de reforço exclusivo (folga
// cobre) + alerta. Puro: decide; quem replaneja o cronograma é a camada de UI.
function gatilhoReforcoEconometria(liquidoEconometria) {
  if (liquidoEconometria === null || liquidoEconometria === undefined)
    return { dispara: true, motivo: 'CP1 sem dado de Econometria — trate como reprovado no critério.' };
  if (liquidoEconometria < 0.60)
    return { dispara: true, motivo: 'Econometria ' + (liquidoEconometria * 100).toFixed(2) +
             '% < 60% no CP1 → alocar 1 semana de reforço exclusivo (consome folga).' };
  return { dispara: false, motivo: null };
}

var M = {
  pacing: pacing, ALVO_F1: ALVO_F1, SEMANA_TIPO_F1: SEMANA_TIPO_F1,
  INVIOLAVEIS: INVIOLAVEIS,
  pacingSemanaPorTerritorio: pacingSemanaPorTerritorio,
  progressoPonderado: progressoPonderado, examPacing: examPacing,
  CHECKPOINTS: CHECKPOINTS, avaliaCheckpoint: avaliaCheckpoint,
  gatilhoReforcoEconometria: gatilhoReforcoEconometria
};
if (typeof module !== 'undefined' && module.exports) module.exports = M;
else root.MotorRitmo = M;
})(typeof self !== 'undefined' ? self : this);
