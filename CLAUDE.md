# Projeto: Painel de fechamento mensal com chatbot (Hackathon Data Cempro 2026)

## Contexto
Dados 100% fictícios de uma empresa de software (clientes, atendimentos, uso de serviços; jul–set/2026).
O gestor de suporte escolhe o mês, vê indicadores e alertas, monta cruzamentos escolhendo colunas
(construtor de insights) e conversa com um chatbot (Gemini) que redige insights sobre os números calculados.
Detalhes: `docs/01..04`. Dados em `dados/`.

## Stack e convenções
- Next.js 15 (App Router) + TypeScript + Tailwind; gráficos com Recharts.
- SQLite via `better-sqlite3`, arquivo `data/app.db` gerado por `scripts/seed.ts` a partir de `dados/*.xlsx` (pacote `xlsx`).
- IA: SDK `@google/genai`, modelo em `GEMINI_MODEL` (env), chave em `GEMINI_API_KEY` (env, só no servidor).
- Interface e textos em português do Brasil. Código e nomes de variáveis em inglês ou português, de forma consistente.
- Consultas SQL sempre parametrizadas; nomes de coluna só vindos de um **catálogo whitelist** (nunca de input cru).

## Regras inegociáveis
1. Números vêm de SQL. O LLM nunca calcula nem inventa números; só recebe tabelas agregadas e as descreve.
2. Nunca afirmar causalidade (o dicionário de dados proíbe). Usar "associado a", "coincide com".
3. Mostrar sempre o `n` de cada grupo; sinalizar `n < 10` como indício fraco.
4. Nunca juntar `atendimentos` com `uso_servicos` direto (explode linhas). Usar a visão agregada por cliente/mês.
5. Só dados fictícios vão para a API; nunca linhas individuais, só agregados. Chave fora do código.
6. O app deve funcionar sem internet/Gemini (modo reserva com respostas pré-geradas e núcleo sem IA).
7. Setembro está incompleto (dados até 29/09): avisar na UI que o backlog do mês é inflado.
8. Identificar no README os recursos de IA e bibliotecas usados (exigência do desafio).

## Pontos de atenção dos dados
- `tempo_resolucao_min` e `satisfacao_1_a_5` são nulos nos 40 pendentes.
- Cada cliente tem 3 linhas de uso (uma por mês) e o serviço muda de mês a mês → tendência de uso só no total do cliente.
- Correlação tempo × nota ≈ 0,04.
