# Plano de execução (2 h) e pitch

## Ordem e critérios de aceite
1. **dados-etl (≈15 min):** `scripts/seed.ts` cria `data/app.db` a partir de `dados/*.xlsx`. Aceite: contagens 100/300/300, 40 pendentes com tempo/nota nulos, views criadas, checagens de integridade passam.
2. **backend-api (≈25 min):** catálogo, queries e rotas `/api/resumo`, `/api/alertas`, `/api/construtor`. Aceite: valores batem com a seção "Observações numéricas" de `02-mapeamento-dados.md`.
3. **frontend-painel (≈35 min):** painel do mês, alertas, construtor com tabela e gráfico. Aceite: mudar o mês atualiza tudo; combinação inválida mostra aviso; `n` visível.
4. **ia-chatbot (≈25 min):** `/api/chat` com ferramentas, prompt, modo offline e UI de chat com fontes. Aceite: 5 perguntas do roteiro abaixo respondidas corretamente; com a chave removida o modo offline funciona.
5. **qa-validador (≈10 min):** testes de números, bloqueios e de segurança. Aceite: relatório sem pendências críticas.
6. **docs-pitch (≈10 min):** README, descrição em 5 frases, roteiro do pitch, lista de recursos de IA.
Corte de escopo, se faltar tempo: primeiro cortar alertas de piora por assunto, depois a ficha de cliente; nunca cortar o modo offline.

## Perguntas de teste do chatbot
1. "Como foi agosto comparado a julho?"
2. "A prioridade Alta é atendida mais rápido?"  (esperado: não; 130 vs 102 min, sem afirmar causa)
3. "Quais clientes devo ligar esta semana?"  (queda de acessos + pendentes antigos)
4. "Porte influencia a nota?"  (esperado: diferença mínima, indício fraco)
5. "Qual a receita do mês?"  (esperado: dizer que não há esse dado)

## Descrição em 5 frases (entregável)
O gestor de suporte não consegue fechar o mês de forma confiável cruzando três planilhas à mão. Nos dados, a prioridade Alta demora mais (130 min) que a Baixa (102 min) e 24 de 40 pendentes têm mais de 30 dias. Construímos um painel mensal em Next.js e SQLite em que o gestor escolhe as colunas a cruzar e vê tabela e gráfico com alertas automáticos. Um chatbot com Gemini redige o insight sobre os números calculados pelo código e informa o que não se pode concluir. O benefício é fechar o mês em minutos e agir antes de perder clientes.

## Pitch (5 min)
- **1 min:** problema e público (gestor, direção, suporte) + a inversão da prioridade.
- **3 min:** demo = painel do mês → alerta de pendentes → construtor (prioridade × tempo) → "Gerar insight" → pergunta livre ao chat (mostrar a tabela-fonte) → exemplo "porte × nota" em que a IA diz que não há diferença.
- **1 min:** limitações (sem causalidade, 3 meses, dados sintéticos, setembro incompleto), uso de IA declarado e próximo passo (calibrar com SLA e cancelamentos reais, upload mensal de planilhas).
