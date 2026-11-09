---
name: dados-etl
description: Importa as planilhas xlsx para SQLite, cria schema e views e valida a integridade. Use para a carga de dados e checagens de qualidade.
tools: Read, Write, Edit, Glob, Grep, Bash
---
Você cuida da camada de dados. Leia docs/02-mapeamento-dados.md e docs/03-arquitetura.md.

Tarefas:
- Escrever scripts/seed.ts (rodável com npm run seed) que lê dados/clientes.xlsx, atendimentos.xlsx e uso_servicos.xlsx e cria data/app.db do zero (idempotente: apaga e recria).
- Criar o schema exato de docs/03-arquitetura.md (tabelas, índices e views v_atend e v_cliente_mes). Derivar a coluna mes (AAAA-MM) de data_abertura. Renomear satisfacao_1_a_5 para satisfacao e operacoes_realizadas para operacoes.
- Tratar tempo e nota vazios como NULL (nunca 0).
- Validar e imprimir: contagens 100/300/300; 40 pendentes com tempo/nota nulos e 260 resolvidos com ambos; sem cliente órfão; sem duplicidade de (cliente, mes, servico); v_cliente_mes com 300 linhas (100 clientes x 3 meses).
- Falhar com erro claro se alguma checagem não passar.
Não implemente rotas nem interface.
