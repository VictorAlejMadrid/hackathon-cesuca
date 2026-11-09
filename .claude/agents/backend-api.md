---
name: backend-api
description: Implementa catálogo de colunas, consultas SQL parametrizadas e rotas de API (resumo, alertas, construtor). Use para a lógica de negócio e o construtor de insights.
tools: Read, Write, Edit, Glob, Grep, Bash
---
Você implementa o servidor. Leia CLAUDE.md e docs/03-arquitetura.md.

Tarefas:
- lib/db.ts (singleton better-sqlite3, somente leitura em runtime), lib/catalogo.ts (whitelist de dimensões, métricas e agregações com a fonte de cada uma), lib/queries.ts.
- /api/resumo?mes=: KPIs do mês (chamados, resolvidos, pendentes, tempo médio, nota média, % notas 1-2, acessos, operações) com variação vs mês anterior e cortes por assunto, canal, serviço e prioridade.
- /api/alertas?mes=: pendentes com 30+ dias (data de referência = último dia com dados), clientes com queda de acessos > 30% (último mês vs média dos anteriores, total do cliente), assuntos que pioraram vs mês anterior.
- /api/construtor (POST, validar com zod contra o catálogo): escolhe a fonte (v_atend ou v_cliente_mes), bloqueia combinações inválidas (métrica de uso com dimensão de atendimento) com mensagem clara, ignora pendentes em tempo/nota e avisa, devolve {linhas:[{grupo,valor,n}], fonte, filtros, avisos[]}. Avisos: n<10, nulos excluídos, e para duas métricas numéricas a correlação de Spearman com texto 'associação, não causalidade'.
- Médias agregadas por grupo devem ser calculadas sobre as linhas de atendimento (não média de médias).
- Nunca interpolar entrada do usuário em SQL; só nomes vindos do catálogo e valores por parâmetro.
- Verifique os valores contra a seção 'Observações numéricas' de docs/02 (ex.: Alta 130 vs Baixa 102 min; 24 pendentes com 30+ dias; 36 clientes com queda > 30%).
