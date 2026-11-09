# Arquitetura

## Estrutura de pastas sugerida
```
app/                      # Next.js App Router
  page.tsx                # painel do mês
  construtor/page.tsx     # construtor de insights
  chat/ (ou painel lateral)
  api/resumo/route.ts     # KPIs do mês + variação
  api/alertas/route.ts
  api/construtor/route.ts # executa recorte (whitelist)
  api/chat/route.ts       # Gemini + function calling
lib/db.ts                 # conexão better-sqlite3 (singleton)
lib/catalogo.ts           # whitelist de colunas/métricas
lib/queries.ts            # consultas parametrizadas
lib/gemini.ts             # cliente + prompts + tools
scripts/seed.ts           # xlsx -> SQLite
data/app.db               # gerado (não versionar)
```

## Schema SQLite
```sql
CREATE TABLE clientes(
  cliente_id TEXT PRIMARY KEY, nome_ficticio TEXT, porte TEXT, setor TEXT, cidade TEXT, data_cadastro TEXT);
CREATE TABLE atendimentos(
  atendimento_id TEXT PRIMARY KEY, cliente_id TEXT REFERENCES clientes, data_abertura TEXT,
  mes TEXT,                         -- AAAA-MM derivado de data_abertura
  servico TEXT, assunto TEXT, canal TEXT, prioridade TEXT, status TEXT,
  tempo_resolucao_min REAL NULL, satisfacao REAL NULL);
CREATE TABLE uso_servicos(
  cliente_id TEXT REFERENCES clientes, mes TEXT, servico TEXT, acessos INTEGER, operacoes INTEGER,
  PRIMARY KEY(cliente_id, mes, servico));
CREATE INDEX ix_at_mes ON atendimentos(mes); CREATE INDEX ix_at_cli ON atendimentos(cliente_id);

-- Visão segura para cruzar atendimento com atributos do cliente (N:1, sem explosão)
CREATE VIEW v_atend AS
  SELECT a.*, c.porte, c.setor, c.cidade FROM atendimentos a JOIN clientes c USING(cliente_id);

-- Visão por cliente e mês: único lugar onde atendimento e uso se encontram
CREATE VIEW v_cliente_mes AS
  WITH at AS (SELECT cliente_id, mes, COUNT(*) chamados,
                SUM(status='Pendente') pendentes, AVG(tempo_resolucao_min) tempo_medio, AVG(satisfacao) nota_media
              FROM atendimentos GROUP BY cliente_id, mes),
       us AS (SELECT cliente_id, mes, SUM(acessos) acessos, SUM(operacoes) operacoes
              FROM uso_servicos GROUP BY cliente_id, mes)
  SELECT c.cliente_id, c.porte, c.setor, c.cidade, m.mes,
         COALESCE(at.chamados,0) chamados, COALESCE(at.pendentes,0) pendentes,
         at.tempo_medio, at.nota_media, COALESCE(us.acessos,0) acessos, COALESCE(us.operacoes,0) operacoes
  FROM clientes c CROSS JOIN (SELECT DISTINCT mes FROM uso_servicos) m
  LEFT JOIN at ON at.cliente_id=c.cliente_id AND at.mes=m.mes
  LEFT JOIN us ON us.cliente_id=c.cliente_id AND us.mes=m.mes;
```
Atenção: nota/tempo médios são nulos para quem só tem pendentes; usar média ponderada ao agregar por grupo (AVG sobre linhas de atendimento, não média de médias).

## KPIs do painel (por mês, com variação vs mês anterior)
Chamados abertos; resolvidos; pendentes; tempo médio de resolução; nota média; % de notas 1–2; acessos; operações.
Visões: por assunto, canal, serviço e prioridade. Alertas: pendentes com 30+ dias (idade calculada contra a data de referência = último dia com dados);
clientes com queda de acessos > 30% do último mês vs média dos anteriores; assunto cujo tempo ou % de nota baixa piorou vs mês anterior.
Banner fixo quando o mês selecionado é o último: "dados até 29/09; backlog inflado".

## Construtor de insights
**Catálogo (whitelist)** em `lib/catalogo.ts`:
- Dimensões de atendimento (fonte `v_atend`): mes, assunto, canal, prioridade, servico, status, porte, setor, cidade.
- Métricas de atendimento: contagem de chamados, tempo_resolucao_min (AVG/MEDIAN, só Resolvido), satisfacao (AVG, % notas ≤ 2, só Resolvido), % pendentes.
- Dimensões de cliente (fonte `v_cliente_mes`): mes, porte, setor, cidade.
- Métricas de uso (fonte `v_cliente_mes`): acessos, operacoes (SUM/AVG por cliente), operacoes por acesso.
**Regras de combinação:** a fonte é escolhida pelo conjunto de campos. Qualquer mistura de métrica de uso com dimensão de atendimento
(assunto, canal, prioridade, servico) é bloqueada com mensagem clara. Métricas de tempo/nota ignoram pendentes automaticamente e informam isso.
**Saída:** `{ linhas:[{grupo, valor, n}], fonte, filtros, avisos[] }` onde `avisos` inclui amostra pequena (n<10), nulos excluídos e, para duas métricas numéricas, a correlação de Spearman com texto fixo "associação, não causalidade".
**UI:** selects de dimensão/métrica/agregação/filtros, tabela com n, gráfico, botão "Gerar insight" que chama o chat com a saída acima.

## Chatbot (Gemini, function calling)
- `POST /api/chat` recebe `{ mensagem, historico, contexto? }` (contexto = saída do construtor).
- Ferramentas declaradas ao modelo (todas executadas no servidor, SQL parametrizado):
  `resumo_mes(mes)`, `comparar_meses(mes_a, mes_b)`, `top_assuntos(metrica, mes?)`, `pendentes_antigos(dias_min)`,
  `clientes_queda_uso(limiar)`, `ficha_cliente(cliente_id)`, `executar_recorte(dimensao, metrica, agregacao, filtros)` (usa o catálogo).
- System prompt (pt-BR): usar apenas números devolvidos pelas ferramentas; nunca inferir causalidade; citar `n` e dizer quando a amostra for pequena;
  se os dados não respondem, dizer isso; respostas curtas (até ~6 linhas) com a conclusão primeiro.
- A resposta devolve `{ texto, fontes:[{ferramenta, parametros, tabela}] }`; a UI mostra as tabelas ao lado do texto.
- Modo reserva: se faltar chave/internet ou houver erro, usar gerador de texto por template a partir da mesma tabela (sem IA) e indicar "modo offline".
- Modelo e chave via env: `GEMINI_MODEL`, `GEMINI_API_KEY`. Limitar histórico e tamanho de tabelas enviadas (agregados, no máx. ~50 linhas).

## Segurança
SQL só por funções fixas; entradas validadas contra o catálogo (zod); nunca interpolar strings do usuário no SQL;
chave só no servidor; `.env.local` no `.gitignore`.
