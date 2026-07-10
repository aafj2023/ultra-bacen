# 🏛️ Ultra BACEN — Sistema de Gestão da Aprovação

PWA de alta performance para a preparação ao concurso de **Auditor do Banco Central do Brasil
(Área Economia e Finanças)** — concurso autorizado em 03/07/2026 (170 vagas, edital previsto
até jan/2027).

**App no ar:** https://aafj2023.github.io/ultra-bacen/ *(GitHub Pages — ver "Publicação" abaixo)*

## O que o app faz

- 📊 **Dashboard executivo:** prontidão 0–100, horas vs. meta, taxa líquida Cebraspe 30d,
  constância, gráficos semanais (horas e desempenho) em tema claro/escuro
- 🚦 **Gestão à vista:** semáforo por disciplina (estável/atenção/crítico) + prioridades do dia
- ⚙️ **Motor de decisão:** 12 regras SE/ENTÃO automáticas (ex.: líquida < alvo−15 p.p. →
  aumentar carga; fila SRS estourada → zerar antes de conteúdo novo)
- 🔁 **Revisão espaçada (SRS):** 1·3·7·15·30·60·90·180 dias; recall <50% regride o estágio
- 📚 **Gestão das disciplinas:** horas, questões, líquida, domínio, ROI dinâmico
- ➕ **Registro em ≤1 min** por bloco; dados no navegador (localStorage) com backup JSON
- 📱 **PWA:** instalável no celular ("Adicionar à tela inicial") e funciona offline

Métrica-mestra: **taxa líquida Cebraspe = (certas − erradas) ÷ total** — 1 erro anula 1 acerto.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` · `sw.js` · `manifest.webmanifest` | O app (single-file + service worker) |
| `mentor/` | Kit de mentoria: diagnóstico, cenário do concurso, plano pré-edital, KPIs |
| `mentor/sistema/` | Ultra Sistema: arquitetura (13 módulos), fórmulas Sheets/Notion, 36 regras do motor, manual operacional |

## Publicação (uma vez)

GitHub → **Settings → Pages → Source: Deploy from a branch → `main` / root → Save.**
Em ~1 min o app estará no ar. Toda mudança commitada em `main` republica sozinha.

## Desenvolvimento

Editar `index.html` → commit → push. Ao mudar libs em cache, subir a versão em `sw.js`
(`CACHE = 'ultra-bacen-vN'`). Testar local: qualquer servidor estático na raiz.
