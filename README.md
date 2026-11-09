# Hackathon CESUCA — Radar de Saúde do Cliente

Aplicação Next.js e base analítica construída com os dados sintéticos do Hackathon Data Cempro 2026. As planilhas de clientes, atendimentos e uso de serviços foram estruturadas em SQLite para alimentar um MVP de Customer Success e Suporte.

## Solução proposta

O **Radar de Saúde do Cliente** reúne sinais de suporte e utilização para mostrar quais clientes precisam de atenção e por quê. O score é transparente, calculado em SQL e serve como regra de triagem — não como previsão de cancelamento ou prova de causalidade.

## Executar a aplicação

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## LangChain no servidor

A configuração do LangChain está em [`lib/langchain.ts`](./lib/langchain.ts) e usa
`ChatGroq`. Para habilitá-la:

1. Copie `.env.example` para `.env.local`;
2. Preencha `GROQ_API_KEY` com uma chave criada no [console da Groq](https://console.groq.com/keys);
3. Ajuste `GROQ_MODEL` se necessário. O padrão é `openai/gpt-oss-20b`.

O módulo é marcado como server-only e a chave nunca deve ser prefixada com
`NEXT_PUBLIC_` nem usada em componentes do cliente.

### Streaming SSE

A rota `POST /stream` recebe `{ "input": "..." }` e transmite a resposta do
modelo como Server-Sent Events. Cada fragmento vem em
`data: {"content":"..."}`; o fim do fluxo é sinalizado por `data: [DONE]`.

O modelo também possui a tool server-side `consultar_banco`, que consulta o
SQLite somente por operações agregadas permitidas (`resumo_geral`,
`resumo_mes`, `top_assuntos` e `clientes_atencao`). A rota nunca executa SQL
enviado pelo usuário. O caminho do banco pode ser alterado com
`SQLITE_DB_PATH`; por padrão, usa `output/hackathon_cempro.sqlite`.

## Estrutura do banco

- `clientes`: cadastro mestre, com `cliente_id` como chave primária;
- `atendimentos`: chamados ligados a clientes por chave estrangeira;
- `uso_servicos`: uso mensal por cliente e serviço, com chave composta;
- `vw_resumo_servico`: adoção, intensidade de uso e suporte por serviço;
- `vw_saude_cliente`: fila explicável de priorização de clientes.

O banco pronto está em `output/hackathon_cempro.sqlite` e pode ser aberto diretamente no SQLiteStudio.

## Recriar e validar o banco

Com Python, pandas e openpyxl instalados:

```powershell
python scripts/importar_sqlite.py
python scripts/verificar_sqlite.py
```

O importador valida duplicidades e clientes órfãos, aplica restrições e índices e verifica as chaves estrangeiras. O segundo script confere integridade, acentos, contagens e as consultas de demonstração.

## Consulta principal

As consultas para o pitch estão em `sql/consultas_demo.sql`. O ranking principal pode ser consultado com:

```sql
SELECT
    cliente_id,
    nome_ficticio,
    score_atencao,
    faixa_atencao,
    atendimentos_pendentes,
    satisfacao_media
FROM vw_saude_cliente
ORDER BY score_atencao DESC
LIMIT 20;
```

## Conteúdo do projeto

```text
app/        aplicação web Next.js
data/       planilhas originais e dicionário de dados
docs/       proposta, alternativas e roteiro do pitch
output/     banco SQLite pronto
scripts/    importador e verificador
sql/        consultas para o MVP e demonstração
```

## Agentes do hackathon

O pacote em `agentes-hackathon` foi integrado à raiz para funcionar com Claude Code:

- `.claude/agents/`: 7 agentes especializados;
- `CLAUDE.md`: contexto e regras permanentes do projeto;
- `dados/`: cópia das planilhas esperada pelos agentes;
- `docs/01-projeto-perguntas.md` a `docs/04-plano-e-pitch.md`: análise, arquitetura e plano de execução;
- `docs/agentes-hackathon.md`: instruções originais do pacote.

O fluxo recomendado começa pelo agente `orquestrador`, que delega ETL, API, frontend, chatbot, QA e documentação.

## Limitações

- dados fictícios;
- janela de julho a setembro de 2026;
- correlação não implica causalidade;
- “operações por acesso” mede intensidade e pode ser maior que 1;
- o score precisa ser calibrado antes de uso em um negócio real.
