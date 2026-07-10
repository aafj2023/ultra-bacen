# 📗 Implementação em Google Sheets / Excel / Notion

> Banco de dados + fórmulas prontas. Crie uma planilha com **6 abas**: `CONFIG`, `DISCIPLINAS`,
> `SESSOES`, `REVISOES`, `SIMULADOS`, `PAINEL`. Fórmulas em sintaxe Google Sheets (pt-BR usa
> `;` como separador — troque `,`→`;` se sua planilha estiver em português). Para Excel, tudo
> funciona igual exceto onde indicado. Alternativa sem planilha: app Ultra BACEN já faz o núcleo.

## 1. Aba CONFIG

| A | B |
|---|---|
| meta_horas_semana | 22 |
| data_prova_estimada | 2027-05-15 |
| alvo_liquida_global | 70% |
| teto_revisoes_dia | 6 |

## 2. Aba DISCIPLINAS (Módulo 3) — 1 linha por disciplina

Colunas A–T (cabeçalho na linha 1; exemplo preenchido na linha 2):

| Col | Campo | Fórmula (linha 2) / preenchimento |
|---|---|---|
| A | Disciplina | `Estatística` (manual) |
| B | Peso (1–5) | `5` |
| C | Incidência (1–5) | `5` |
| D | Dificuldade (1–5) | `4` |
| E | Domínio atual (0–5) | recalculado mensalmente: `=MIN(5, ROUND(N2/20*5,1))` (líquida→escala 0–5) |
| F | Domínio desejado | `4.5` |
| G | Meta horas pré-edital | `120` |
| H | Horas realizadas | `=SUMIFS(SESSOES!$D:$D,SESSOES!$B:$B,$A2)/60` |
| I | Horas restantes | `=MAX(0,G2-H2)` |
| J | % concluído | `=IF(G2=0,0,H2/G2)` |
| K | Questões resolvidas | `=SUMIFS(SESSOES!$F:$F,SESSOES!$B:$B,$A2)` |
| L | Questões certas | `=SUMIFS(SESSOES!$G:$G,SESSOES!$B:$B,$A2)` |
| M | Questões erradas | `=SUMIFS(SESSOES!$H:$H,SESSOES!$B:$B,$A2)` |
| N | **Taxa líquida %** | `=IF(K2=0,"",(L2-M2)/K2)` |
| O | Líquida 30 dias | `=IFERROR((SUMIFS(SESSOES!$G:$G,SESSOES!$B:$B,$A2,SESSOES!$A:$A,">="&TODAY()-30)-SUMIFS(SESSOES!$H:$H,SESSOES!$B:$B,$A2,SESSOES!$A:$A,">="&TODAY()-30))/SUMIFS(SESSOES!$F:$F,SESSOES!$B:$B,$A2,SESSOES!$A:$A,">="&TODAY()-30),"")` |
| P | Dias sem contato | `=TODAY()-MAXIFS(SESSOES!$A:$A,SESSOES!$B:$B,$A2)` |
| Q | Risco de esquecimento | `=IF(P2>=21,"ALTO",IF(P2>=10,"MÉDIO","BAIXO"))` |
| R | Alvo líquida | `70%` (manual; 65% p/ Estatística até F2) |
| S | ROI (prioridade dinâmica) | `=B2*C2*(5-E2)/D2` |
| T | **Status (semáforo)** | `=IF(N2="", "⚪ SEM DADO", IF(AND(O2>=R2,P2<=7),"🟢 ESTÁVEL", IF(OR(O2<R2-0.15,Q2="ALTO"),"🔴 CRÍTICO","🟡 ATENÇÃO")))` |

Probabilidade de cair na prova (informativa): `=C2/5` formatado como %.
Ordene a visão do ciclo por **S (ROI) decrescente** — isso É a fila de prioridade.

## 3. Ciclo de estudos inteligente (Módulo 4) — algoritmo

O ciclo é uma **fila de blocos de 50 min, sem dias fixos**: terminou um bloco, puxa o próximo;
atrasou, nada quebra — a fila apenas continua (Lean: fluxo puxado, não empurrado).

Geração da fila (recalcular toda segunda, ou automático no app Ultra BACEN):

1. `blocos_semana = meta_horas_semana / 0,875` (50 min + 10 pausa ≈ 0,875 h). Com 22 h → **25 blocos**.
2. Reserve blocos fixos: 2 Português, 1 SFN/flashcards, 2 revisão SRS, 2 discursiva (sáb).
3. Distribua o restante (18) proporcionalmente ao **ROI normalizado** de cada disciplina:
   `blocos_i = ROUND(18 * S_i / SOMA(S))` — mínimo 1 para toda disciplina não estabilizada.
4. Restrições de sequência (fadiga/interleaving): nunca 2 blocos seguidos da mesma disciplina;
   alternar cálculo (Estatística/Contab/Economia) com leitura (Direito/SFN/Português);
   disciplina de maior ROI sempre no período de maior energia (registrado em SESSOES.periodo).
5. Disciplina `🟢 ESTÁVEL` por 3 semanas → sai da fila e entra em **manutenção** (1 bloco de
   questões a cada 10 dias) — regra M1 do motor.

## 4. Aba REVISOES (Módulo 5) — SRS + risco

Colunas: A Disciplina · B Assunto · C Data aprendizado · D Estágio (0–7) · E Próxima revisão ·
F Última taxa % · G Status.

- Intervalos: `{1,3,7,15,30,60,90,180}` dias. `E2: =C2 + CHOOSE(D2+1,1,3,7,15,30,60,90,180)`
- Ao concluir revisão: se acerto ≥70% → `D2 = D2+1` e `C2 = TODAY()`; se <70% → `D2 = MAX(0,D2-1)`
  (o assunto regride — retrieval falhou, intervalo encurta).
- Risco de esquecimento (Ebbinghaus operacionalizado): `=IF(TODAY()>E2+3,"🔴 ALTO",IF(TODAY()>=E2,"🟡 VENCIDA","🟢 EM DIA"))`
- **Agenda do dia** = filtrar `E ≤ HOJE`, ordenar por (risco DESC, última taxa ASC), cortar no
  `teto_revisoes_dia`. Tempo estimado: 12 min/assunto (5 recall escrito + questões).
- **Error log** (alimenta flashcards): manter na mesma aba, colunas H "Erro recorrente" e
  I "Armadilha" — cada erro repetido 2× vira flashcard obrigatório.

## 5. Aba SESSOES + gestão de questões (Módulo 6)

Colunas: A Data · B Disciplina · C Tipo · D Minutos · E Assunto · F Q.total · G Q.certas ·
H Q.erradas · I Período · J Obs/armadilha.

**Taxonomia de armadilhas Cebraspe** (marcar na coluna J a cada erro; contar com `COUNTIF`):

| Código | Armadilha | Antídoto |
|---|---|---|
| GEN | Generalização indevida ("sempre", "somente", "nunca") | Sublinhar quantificadores antes de julgar |
| RES | Restrição escondida no meio do item | Ler o item INTEIRO; erro comum de leitor rápido |
| INV | Inversão de causa/efeito ou de conceitos próximos | Tabela de pares confundíveis por disciplina |
| DES | Item desatualizado vs. norma vigente | Caderno de normativos vivos |
| EXT | Extrapolação plausível do texto/teoria | "Está ESCRITO ou estou deduzindo?" |
| CAL | Erro de cálculo/aritmética | Refazer à mão; conferir unidade/sinal |

Métricas por assunto (numa aba auxiliar ou tabela dinâmica): líquida por assunto, tempo médio
por questão (`minutos*60/F` quando tipo=questões), top-5 assuntos com pior líquida = **fila de
teoria dirigida** da semana seguinte.

## 6. Aba SIMULADOS (Módulo 7)

Colunas: A Data · B Tipo (mini/parcial/completo) · C Disciplina · D Total · E Certas · F Erradas
· G Líquida `=(E2-F2)/D2` · H Tempo médio/questão · I–L Erros por classe (conceito/interpretação/
atenção/revisão). 1 linha por disciplina por simulado.

- Comparação histórica: gráfico de linha da líquida por simulado (global e por disciplina).
- Ranking: `=RANK(G2, G$2:G$20)` dentro do mesmo simulado → pior disciplina ganha +1 bloco.
- Evolução alvo: +3 a +5 p.p. de líquida por simulado completo até estabilizar ≥70%.

## 7. Aba PAINEL (Módulo 8 em planilha)

KPIs (uma célula cada, formatação condicional = semáforo):

```
Horas na semana:   =SUMIFS(SESSOES!D:D,SESSOES!A:A,">="&(TODAY()-WEEKDAY(TODAY(),2)+1))/60
vs meta:           =horas_semana / CONFIG!B1
Líquida global 30d: (mesma estrutura da coluna O, sem filtro de disciplina)
Constância 7d:     =SUMPRODUCT((COUNTIFS(SESSOES!A:A,TODAY()-{0;1;2;3;4;5;6})>0)*1) & "/7"
Revisões vencidas: =COUNTIFS(REVISOES!E:E,"<="&TODAY(),REVISOES!G:G,"<>CONCLUÍDA")
Burn-down (horas): =SUM(DISCIPLINAS!I:I)  → gráfico vs. semanas restantes até a prova
Prontidão (0-100): =100*(0.3*MIN(1,SUM(DISCIPLINAS!H:H)/SUM(DISCIPLINAS!G:G))
                        +0.4*MIN(1,liquida_global/CONFIG!B3)
                        +0.2*(constancia_7d/7)
                        +0.1*MAX(0,1-revisoes_vencidas/10))
```

Gráficos recomendados (Inserir → Gráfico): barras de horas/semana com linha de meta; linha da
líquida semanal; heatmap = formatação condicional numa grade dia×disciplina; radar de domínio
(coluna E) — o app Ultra BACEN já traz os dois primeiros prontos.

## 8. Notion (mapeamento)

- Cada aba vira um **database**; fórmulas de coluna única portam direto (sintaxe Notion:
  `prop("Certas")`, `dateBetween(now(), prop("Última"), "days")`).
- Agregações entre tabelas (SUMIFS) viram **relations + rollups**: SESSOES→DISCIPLINAS
  (rollup soma de minutos, questões); REVISOES→DISCIPLINAS.
- Views prontas: *Hoje* (REVISOES filtrado `Próxima ≤ hoje`), *Kanban do ciclo* (SESSOES
  agrupado por status planejado/feito), *Gestão à vista* (DISCIPLINAS em gallery com semáforo).
- Limitação honesta: gráficos nativos do Notion são fracos — mantenha o app Ultra BACEN ou a
  planilha para as curvas, e o Notion para captura e Kanban, ou use tudo no app Ultra BACEN.

## 9. Exemplo preenchido (3 dias, para conferir suas fórmulas)

```
SESSOES:
2026-07-13 | Estatística | teoria    | 50 | Distribuições      | ·  | ·  | · | manhã
2026-07-13 | Português   | questoes  | 30 | Crase/regência     | 20 | 15 | 5 | tarde  → líquida 50%
2026-07-14 | Macro       | questoes  | 50 | IS-LM/Política mon.| 25 | 21 | 4 | manhã  → líquida 68%
2026-07-15 | Estatística | revisao   | 15 | Distribuições      | 10 | 8  | 2 | manhã  → líquida 60%

REVISOES (gerada pelo bloco de teoria de 13/07):
Estatística | Distribuições | 2026-07-13 | estágio 0 | próxima 2026-07-14 → feita 15/07 c/ 60%
→ 60%<70%? não regride (≥70 exige; 60 fica no MESMO estágio e reagenda +1 dia) — ajuste fino:
  <50% regride; 50–69% repete estágio; ≥70% avança.  [regra R4 do motor]
```
