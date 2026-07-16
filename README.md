# 🏛️ BCB Study — Painel de Comando da Aprovação

App de gestão de aprovação para **Auditor do Banco Central do Brasil — Economia e Finanças**.
Prova estimada **mar/2027**, edital até **03/01/2027**, banca-hipótese **Cebraspe**.
Horizonte: 35 semanas · ~560 h · 16 h/semana.

**App no ar:** https://aafj2023.github.io/ultra-bacen/
*(irmão arquitetural do [R+ Study](https://github.com/aafj2023/r-plus-study) — single-file, vanilla, PWA)*

## O que é

O painel registra, mede, projeta e cobra. As **aulas nascem fora** (Prompt Mestre em conversas
do Claude → `.md` no Google Drive); o app rastreia status, guarda o link e diz o que vem depois.
Não há LLM embutido.

- **Motor Cebraspe:** +1,00/−0,50/0 · líquido como métrica-mestra · limiar de marcação p>1/3 ·
  calibração 1–5 com Brier score · taxonomia fechada de 7 erros
- **Motor de ritmo por território:** 11 territórios com peso; média agregada nunca mascara
  atraso (Finanças adiantada ≠ Econometria em dia)
- **Plano seedado:** 107 microconteúdos + 8 dormentes · cronograma de 35 semanas · CP1–CP4
  com critérios numéricos e gatilho automático de reforço de Econometria
- **Stack:** `index.html` single-file · Chart.js/Dexie/Firebase compat/KaTeX via CDN pinado
  com SRI · IndexedDB com fallback localStorage · sync Firestore doc único · GitHub Pages

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | O app inteiro (CSS+HTML+JS; blocos testáveis entre marcadores `/*<bloco>*/`) |
| `sw.js` · `manifest.webmanifest` | PWA (cache `bcb-v1`) |
| `firestore.rules` | Regras definitivas (allowlist) — publicar no console do projeto `aprov-bacen` |
| `tests/` | Bancada Node: extrai os blocos do index.html e roda os gates de cada fase |
| `docs/` | `ARQUITETURA-HERDADA.md` (mapa do clone R+→BCB) · `DECISOES.md` (log vivo) |
| `mentor/` | Kit de mentoria estratégica (diagnóstico, cenário do concurso, plano) |
| `PROXIMOS_PASSOS.md` | Memória entre sessões (estado das fases 0–12) |

## Desenvolvimento

- **Gates:** `node tests/motor.test.js` · `node tests/store.test.js` — rodar antes de commit.
- **Publicar:** commit + push na `main` → GitHub Pages republica em ~1 min.
- **Mudou lib do CDN?** Atualizar tag no `index.html` + `PRECACHE` no `sw.js` + bump `bcb-vN`.
- Datas de calendário são strings locais `YYYY-MM-DD` (`parseYMD`) — nunca `Date` UTC.
- Prefixos de armazenamento: `bcb1_*` / `bcbDB` / `bcb-v1` — nunca `rplus*`.
