# 📖 Módulos 9, 12, 13 — Metas/OKRs, Relatórios e Manual Operacional

## 1. OKRs (Módulo 9)

### Objetivo do ciclo (até a prova): estar entre os aprovados de Auditor — Economia e Finanças

**OKR Q3/2026 (jul–set) — "Fundação medida"**
- KR1: 100% das disciplinas com bateria de calibragem (≥20 questões) até 19/07
- KR2: líquida ≥60% em Economia e ≥50% em Estatística até 30/09
- KR3: constância ≥85% (6/7 dias) em ≥10 das 12 semanas
- KR4: 12 discursivas corrigidas por espelho (1/semana)
- KR5: ≥260 h líquidas no trimestre (22 h/sem × 12)

**OKR Q4/2026 (out–dez) — "Nível de prova"**
- KR1: líquida global ≥65%; nenhuma disciplina MÁXIMA <55%
- KR2: 2 simulados completos estilo 2024 com líquida ≥60%
- KR3: Direito Const./Adm. saindo do zero: ≥300 questões, líquida ≥60%
- KR4: fila SRS nunca >3 dias de atraso no trimestre

Metas menores derivam dos OKRs: **diária** = fechar os blocos do dia + revisões da fila;
**semanal** = meta de horas + 1 discursiva + fila zerada; **mensal** = KRs proporcionais
(medir no relatório mensal). Critério de adaptação: OKR com <70% de progresso na metade do
período → renegociar o KR (escopo), nunca abandonar silenciosamente.

## 2. Rotinas (Módulo 13)

**Diária (3–4 h líquidas + 5 min de gestão)**
1. Abrir o app Ultra BACEN → aba Início: fazer o que está em "Prioridades de hoje" (revisões primeiro).
2. Blocos do ciclo (50 min + 10 de pausa; maior ROI no seu horário de pico).
3. Registrar cada bloco no app na hora (≤1 min; alimenta tudo).
4. Dose diária: 20 questões de Português Cebraspe.
5. Fechar: olhar o Motor de decisão; se houver 🔴, ele define o primeiro bloco de amanhã.

**Semanal (domingo, 20 min)**
1. App → Disciplinas: ler a tabela ordenada por ROI; anotar a pior disciplina (restrição TOC da semana).
2. Rodar mentalmente as regras não automatizadas do `02-motor-de-decisao.md` (E3–E6, S1–S5).
3. Exportar backup JSON (Config → Exportar).
4. Preencher 1 linha nos KPIs semanais do `../04-controle-evolucao.md` (ou commitá-lo via app do GitHub).
5. Planejar os blocos da semana (quantidade por disciplina ∝ ROI).

**Mensal (1º domingo do mês, 45 min)**
1. Relatório mensal (template §3) — comparar com o anterior.
2. Recalcular domínio 0–5 de cada disciplina pela líquida 30d.
3. Checklist de gargalos do `../04-controle-evolucao.md` §4.
4. Simulado do mês + análise de erros por classe.
5. Sessão de mentoria: abrir o Claude no repositório e pedir a reotimização (Etapa 13).

## 3. Relatórios (Módulo 12) — templates

**Diário (automático — é a própria aba Início do app):** horas do dia, fila SRS, alertas.

**Semanal (5 linhas, no `04-controle-evolucao.md`):**
```
Semana ____: __h líquidas (meta __) · __ questões · líquida __% · constância _/7
Restrição da semana (TOC): ____________  → ação: ____________
```

**Mensal:**
```
Mês ____ | Horas: __ (meta __) | Questões: __ | Líquida global: __% (Δ vs mês anterior: __)
Top 3 evoluções: ______ | Top 3 riscos: ______
Disciplinas 🔴: ______ → plano corretivo: ______
Simulado do mês: __% líquida | erros: conceito __ / interpretação __ / atenção __ / revisão __
Decisões tomadas (log): ______
```

**Trimestral / executivo:** progresso dos OKRs (KR a KR, % atingido), curva da líquida global
nas 12 semanas, horas acumuladas vs. plano, prontidão (app) no início × fim do trimestre,
e UMA decisão estratégica (ex.: rebalancear metas de horas entre disciplinas).

## 4. Melhoria contínua (PDCA permanente)

- **Plan:** blocos da semana ∝ ROI (domingo).
- **Do:** executar e registrar tudo no app.
- **Check:** relatórios semanal/mensal + motor de decisão.
- **Act:** aplicar as regras disparadas; 1 experimento de método por mês no máximo
  (ex.: trocar leitura por videoaula em Direito) — medir 2 semanas antes de adotar.

Princípio antifrágil: todo erro de questão é insumo (error log → flashcard → revisão
cumulativa). Todo dia quebrado é dado (investigar o gatilho, redesenhar a rotina). O sistema
não pune variação — aprende com ela.

## 5. Implementações

| Camada | Onde | Status |
|---|---|---|
| App PWA (registro + dashboard + SRS + motor) | raiz deste repositório (GitHub Pages) — instalável no celular | ✅ pronto |
| Especificação e fórmulas (Sheets/Excel/Notion) | `01-implementacao-sheets.md` | ✅ opcional |
| Regras completas do motor | `02-motor-de-decisao.md` | ✅ |
| Diagnóstico e plano estratégico | `../01-diagnostico.md`, `../03-plano-pre-edital.md` | ✅ |
| Mentoria contínua (reotimização) | sessões do Claude neste repositório | ♻️ mensal |
