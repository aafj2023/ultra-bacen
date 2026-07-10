# 🧠 Ultra Sistema de Gestão da Aprovação — BACEN (Arquitetura)

> Sistema operacional de alta performance para aprovação no concurso de **Auditor/Especialista
> do BACEN — Economia e Finanças**. Concebido como software: dados → indicadores → decisões →
> ações → medição (loop fechado, PDCA contínuo). Perfil do usuário: ver `../01-diagnostico.md`.

## Visão geral da arquitetura

```
┌──────────────────────── CAMADA DE ENTRADA (registro diário, ≤3 min) ────────────────────────┐
│  Bloco de estudo (disciplina, tipo, minutos, assunto)  ·  Questões (total, certas, erradas) │
│  Revisão concluída  ·  Simulado (nota por disciplina)                                       │
└──────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                       ▼
┌──────────────────────── CAMADA DE DADOS (banco único, 4 tabelas) ───────────────────────────┐
│  SESSOES · QUESTOES(agregado por sessão) · REVISOES(SRS) · SIMULADOS                        │
└──────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                       ▼
┌─────────────── CAMADA DE INDICADORES (fórmulas — Módulos 3, 8, 9) ──────────────────────────┐
│  Taxa líquida Cebraspe · horas realizadas/restantes · risco de esquecimento · ROI/disciplina│
│  constância · eficiência · prontidão · semáforos                                            │
└──────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                       ▼
┌─────────────── CAMADA DE DECISÃO (motor de regras — Módulo 11) ─────────────────────────────┐
│  SE indicador cruza limiar ENTÃO ação recomendada (redistribuir ciclo, antecipar revisão…)  │
└──────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                       ▼
┌─────────────── CAMADA DE APRESENTAÇÃO (gestão à vista — Módulos 8, 10, 12) ─────────────────┐
│  app PWA Ultra BACEN (dashboard) · relatórios D/S/M · alertas · prioridades do dia        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Implementações disponíveis:** app Ultra BACEN (pronto, zero configuração, dados no navegador
com export/import) · Google Sheets/Excel (fórmulas em `01-implementacao-sheets.md`) · Notion
(mapeamento no mesmo arquivo). O app R+ Study (repositório `r-plus-study`) cobre contadores/streak/SRS
básico e pode ser usado como camada de captura móvel.

**Princípios de projeto:** (1) *antifrágil* — o sistema melhora com erros: cada erro alimenta
o Error Log, que realimenta o SRS e o ciclo; (2) *adaptativo* — nenhum número do plano é fixo;
tudo é recalculado pelas regras do Módulo 11; (3) *Lean* — registro em ≤3 min/dia; métrica que
não muda decisão é descartada; (4) *TOC* — a cada semana existe UMA restrição ativa (a
disciplina/hábito que limita a nota) e o sistema aponta qual é.

---

## MÓDULO 1 — Diagnóstico estratégico (estado atual)

Snapshot de 10/07/2026 (fonte: `../01-diagnostico.md`):

| Dimensão | Valor |
|---|---|
| Perfil | Economista · Insper (finanças) · CFP · ex-XP · FP&A (Warren, Cosan) |
| Experiência em concursos | **Zero** (gargalo nº 1 = calibragem de banca, não conteúdo) |
| Dominadas (hipótese a validar) | Macro, Micro, Finanças, SFN/mercados |
| Críticas | Estatística/Econometria (incógnita), Contabilidade→COSIF, discursivas |
| Desconhecidas | Direito Const./Adm., técnica certo/errado Cebraspe |
| Tempo | 3–4 h líquidas/dia (~20–24 h/semana) |
| Energia | A mapear na semana 1 (registrar rendimento por período do dia) |
| Ganho rápido | Reativar economia por questões (não reler teoria) |
| Risco principal | Quebra de constância no mês 2 (padrão de estreante) |

**Matriz de prioridade** (escala 1–5 por critério; ROI = peso × incidência × (5−domínio) / dificuldade):

| Disciplina | Peso | Incid. Cebraspe | Dificuldade | Domínio atual | ROI | Prioridade |
|---|---|---|---|---|---|---|
| Estatística/Econometria | 5 | 5 | 4 | 2? | **18,8** | MÁXIMA |
| Contabilidade→COSIF | 4 | 4 | 4 | 1,5 | **14,0** | MÁXIMA |
| Técnica de banca + discursiva | 5 | 5 | 3 | 0 | **41,7*** | MÁXIMA (transversal) |
| Macro/Micro/Monetária | 5 | 5 | 3 | 3,5 | 12,5 | ALTA (via questões) |
| Português Cebraspe | 4 | 5 | 2 | 3? | 10,0 | ALTA (diária, dose baixa) |
| Direito Const./Adm. | 3 | 4 | 2 | 0,5 | 13,5 | MÉDIA→ALTA (diluir já) |
| SFN/Normativos | 3 | 4 | 2 | 3,5 | 4,5 | MÉDIA |
| Finanças / Ec. Int. / Ec. Bras. | 4 | 4 | 2 | 4 | 4,0 | MANUTENÇÃO |
| Inglês / RLM | 2 | 3 | 2 | 3? | 3,0 | MANUTENÇÃO |

\* transversal: multiplica a nota de TODAS as outras (penalização certo/errado). Números com
`?` são estimativas — a **bateria de calibragem da semana 1** (20 questões/matéria) substitui.

## MÓDULO 2 — Mapa estratégico da aprovação (roadmap)

| Fase | Período | Entregas | Critério objetivo para avançar (gate) |
|---|---|---|---|
| **F0 Calibragem** | Semana 1 | Bateria de 20 questões/matéria; matriz de prioridade recalculada | 100% das matérias medidas |
| **F1 Fundação** | jul–set/2026 | Estatística e Contab. do zero ao intermediário; economia reativada; hábito | Taxa líquida ≥60% em Economia; ≥50% Estatística; constância ≥85%; 1 discursiva/sem há 4 sem |
| **F2 Expansão** | out–dez/2026 | Direitos + COSIF avançado; 1º simulado completo estilo 2024 | Taxa líquida global ≥65%; simulado ≥60% líquido |
| **F3 Pós-edital** | edital (≤jan/2027) → prova−30d | Replanejar em 48h; cobrir 100% do programa real; simulado semanal | Cobertura ≥90% do edital; líquida ≥70% nas Máximas |
| **F4 Reta final** | prova−30d → prova−7d | Só revisão+questões+simulados; zero teoria nova | Fila SRS zerada; 4 simulados no horário real |
| **F5 Semana da prova** | prova−7d → prova−3d | Revisão dos mapas/flashcards marcados; sono regulado (7h30+) | — |
| **F6 Últimos 3 dias** | prova−3d → véspera | 50% carga; só erros marcados + normativos; logística resolvida | — |
| **F7 Dia da prova** | D | Protocolo: café habitual, chegar 1h antes, estratégia de branco/chute por bloco | — |

Regra de gate: **não avançar de fase sem cumprir o critério** — antes, o motor de decisão
(Módulo 11) redistribui o ciclo para fechar o gap. Fases têm data-alvo, gates têm dado.

## MÓDULOS 3–12 — onde estão

| Módulo | Implementação |
|---|---|
| 3. Gestão das disciplinas (20 campos: peso, horas, %, líquida, risco, ROI, status…) | Tabela `DISCIPLINAS` — fórmulas em `01-implementacao-sheets.md` §2; visão no app Ultra BACEN |
| 4. Ciclo inteligente (por blocos, não por dias) | Algoritmo em `01-implementacao-sheets.md` §3 + regras C1–C6 do motor |
| 5. Revisões (SRS + error log + risco de esquecimento) | `01-implementacao-sheets.md` §4; fila automática no app Ultra BACEN |
| 6. Questões (banca/assunto/dificuldade/armadilhas) | `01-implementacao-sheets.md` §5 (inclui taxonomia de armadilhas Cebraspe) |
| 7. Simulados | `01-implementacao-sheets.md` §6 |
| 8. Dashboard executivo | app Ultra BACEN (KPIs, semáforos, gráficos, prontidão, alertas) |
| 9. Metas / OKRs | `03-manual-operacional.md` §1 |
| 10. Gestão à vista (semáforos, alertas, prioridades) | app Ultra BACEN + limiares em `02-motor-de-decisao.md` |
| 11. Motor de decisão (regras SE/ENTÃO) | `02-motor-de-decisao.md` (36 regras) — 12 delas rodam automaticamente no painel |
| 12. Relatórios (D/S/M/T/executivo) | Templates em `03-manual-operacional.md` §3 |
| 13. Implementação + manuais + rotinas | `03-manual-operacional.md` + `01-implementacao-sheets.md` |

## Modelo de dados (comum a todas as implementações)

```
DISCIPLINAS (cadastro): id · nome · peso(1-5) · incidencia(1-5) · dificuldade(1-5) ·
  dominio_atual(0-5) · dominio_alvo · meta_horas_pre_edital · alvo_taxa_liquida(%) · prioridade

SESSOES (1 linha por bloco): data · disciplina · tipo(teoria|questoes|revisao|discursiva|simulado)
  · minutos · assunto · q_total · q_certas · q_erradas · periodo(manha|tarde|noite) · obs

REVISOES (SRS, 1 linha por assunto): disciplina · assunto · data_aprendizado · estagio(0-7:
  D+1,3,7,15,30,60,90,180) · proxima_revisao · ultima_taxa · status

SIMULADOS: data · tipo(mini|parcial|completo) · por_disciplina{total, certas, erradas} ·
  tempo_medio_questao · erros{conceito, interpretacao, atencao, revisao}
```

**Métrica-mestra do sistema:** `taxa_liquida = (certas − erradas) / total` — é a nota real no
Cebraspe (1 erro anula 1 acerto). Toda decisão usa líquida, nunca bruta. Meta de aprovação
histórica em provas concorridas do BCB: **líquida ≥ 70% nos específicos** [ESTIMATIVA — os
cortes reais de 2024 devem ser conferidos no resultado oficial do Cebraspe].
