# Pacote de agentes — Hackathon Data Cempro 2026

Solução: **painel de fechamento mensal + construtor de insights + chatbot (Gemini)** para o gestor de suporte.
Stack: **Next.js (App Router, TypeScript) + SQLite (better-sqlite3)**.

## Conteúdo
| Caminho | Para quê |
|---|---|
| `CLAUDE.md` | Contexto permanente do projeto (lido automaticamente pelo Claude Code) |
| `.claude/agents/` | 7 subagentes especializados |
| `docs/01-projeto-perguntas.md` | As 5 perguntas do desafio respondidas |
| `docs/02-mapeamento-dados.md` | Relações e qualidade dos dados |
| `docs/03-arquitetura.md` | Schema SQLite, rotas, construtor de insights, chatbot |
| `docs/04-plano-e-pitch.md` | Plano de 2 h, critérios de aceite e roteiro do pitch |
| `dados/` | Planilhas fictícias e dicionário de dados |

## Como usar
1. Descompacte na raiz do repositório do projeto (a pasta `.claude/agents` precisa ficar na raiz).
2. Abra o Claude Code na raiz e peça: *"Use o agente orquestrador para executar docs/04-plano-e-pitch.md"*.
3. O orquestrador delega nesta ordem: `dados-etl` → `backend-api` → `frontend-painel` → `ia-chatbot` → `qa-validador` → `docs-pitch`.
4. Variáveis de ambiente: copie `.env.example` (criado pelo orquestrador) para `.env.local` e informe `GEMINI_API_KEY`. Nunca versionar a chave.

## Regra de ouro
**Números são calculados pelo código (SQL); a IA só redige.** O núcleo do painel funciona sem a API do Gemini.
