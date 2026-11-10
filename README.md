# Radar de Saúde do Cliente

MVP desenvolvido para o Hackathon Data Cempro 2026. O projeto cruza
atendimentos, cadastro de clientes e uso de serviços para ajudar gestores de
suporte a identificar clientes que precisam de atenção.

O painel apresenta indicadores mensais, gráficos e uma fila de priorização
explicável. O score é uma regra de triagem calculada no SQLite: não é previsão
de churn e não prova causalidade.

## Pré-requisitos

- Node.js 20.9 ou superior;
- npm;
- Python 3.10 ou superior, apenas para recriar ou validar o banco;
- Python `pandas` e `openpyxl`, para importar as planilhas.

O banco SQLite já versionado em `output/hackathon_cempro.sqlite` permite
executar a aplicação sem instalar Python.

## Instalação

Na raiz do projeto:

```powershell
npm install
```

Para recriar o banco a partir das planilhas:

```powershell
python -m pip install pandas openpyxl
python scripts/importar_sqlite.py
python scripts/verificar_sqlite.py
```

O importador lê `data/clientes.xlsx`, `data/atendimentos.xlsx` e
`data/uso_servicos.xlsx`, recria `output/hackathon_cempro.sqlite` e valida
chaves, restrições e visões analíticas.

## Execução

### Desenvolvimento

```powershell
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Produção local

```powershell
npm run build
npm run start
```

Os demais comandos disponíveis são:

```powershell
npm run lint
```

## Variáveis de ambiente

O dashboard e o fallback offline funcionam sem variáveis de ambiente. O
assistente com IA exige uma chave da Groq:

```text
GROQ_API_KEY=sua-chave
GROQ_MODEL=openai/gpt-oss-20b
```

Salve esses valores em `.env.local`. Nunca use o prefixo `NEXT_PUBLIC_` na
chave. Para apontar a aplicação a outro banco SQLite, defina também:

```text
SQLITE_DB_PATH=C:\caminho\para\hackathon_cempro.sqlite
```

Se `GROQ_API_KEY` estiver ausente ou a API estiver indisponível, o chat usa
respostas de fallback no modo offline. A chave é consumida apenas no servidor.

## Rotas principais

- `GET /api/dashboard`: retorna os dados agregados do painel;
- `POST /stream`: recebe `{ "input": "..." }` e transmite a resposta do
  assistente por Server-Sent Events;
- `GET /`: interface web do LIA.

O assistente consulta o SQLite somente com instruções `SELECT` ou `WITH`.
Comandos de escrita, múltiplas instruções e resultados acima de 100 linhas são
bloqueados ou limitados.

## Estrutura do projeto

```text
app/        páginas, layout e rotas da aplicação Next.js
components/ componentes visuais e gráficos
data/       planilhas originais e dicionário de dados
docs/       análise, arquitetura e roteiro do pitch
lib/        acesso ao SQLite, dados do dashboard e integração com Groq
output/     banco SQLite pronto para execução
scripts/    importação e validação do banco
sql/        consultas usadas na demonstração
types/      tipos TypeScript dos dados
```

As tabelas principais são `clientes`, `atendimentos` e `uso_servicos`. As views
`vw_resumo_servico` e `vw_saude_cliente` consolidam os indicadores usados no
dashboard.

## Limitações e próximos passos

- os dados são sintéticos e não representam clientes reais;
- o recorte cobre julho a setembro de 2026, e setembro contém dados somente até
  29/09;
- o score é uma heurística de priorização e precisa ser calibrado com dados
  reais, SLA, cancelamentos e validação do time de negócio;
- associações entre uso, atendimento, satisfação e score não devem ser
  interpretadas como causalidade;
- o banco é local e carregado em modo somente leitura pela aplicação;
- o assistente depende de acesso à API da Groq para respostas generativas; sem
  chave ou internet, o fallback offline cobre apenas perguntas e indicadores
  pré-definidos;
- não há autenticação, controle de permissões ou atualização automática das
  planilhas;
- o próximo passo é automatizar o upload mensal, recalibrar o score e incluir
  métricas reais de retenção e receita.

Mais detalhes sobre decisões de dados e arquitetura estão em
[`docs/02-mapeamento-dados.md`](./docs/02-mapeamento-dados.md) e
[`docs/03-arquitetura.md`](./docs/03-arquitetura.md).
