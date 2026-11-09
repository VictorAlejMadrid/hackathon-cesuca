# Hackathon CESUCA — Radar de Saúde do Cliente

Projeto de análise dos dados sintéticos do Hackathon Data Cempro 2026. As planilhas de clientes, atendimentos e uso de serviços foram estruturadas em SQLite e transformadas em um MVP analítico para priorização de Customer Success e Suporte.

## Solução proposta

O **Radar de Saúde do Cliente** reúne sinais de suporte e utilização para mostrar quais clientes precisam de atenção e por quê. O score é transparente, calculado em SQL e serve como regra de triagem — não como previsão de cancelamento ou prova de causalidade.

## Estrutura do banco

- `clientes`: cadastro mestre, com `cliente_id` como chave primária;
- `atendimentos`: chamados ligados a clientes por chave estrangeira;
- `uso_servicos`: uso mensal por cliente e serviço, com chave composta;
- `vw_resumo_servico`: adoção, intensidade de uso e suporte por serviço;
- `vw_saude_cliente`: fila explicável de priorização de clientes.

O banco pronto está em `output/hackathon_cempro.sqlite` e pode ser aberto diretamente no SQLiteStudio.

## Recriar o banco

Com Python, pandas e openpyxl instalados:

```powershell
python scripts/importar_sqlite.py
```

O importador valida duplicidades e clientes órfãos, recria o banco, aplica restrições e índices e verifica as chaves estrangeiras.

## Validar o resultado

```powershell
python scripts/verificar_sqlite.py
```

O verificador confere integridade, chaves, acentos, contagens e as consultas de demonstração.

## Consultas para a apresentação

As consultas estão em `sql/consultas_demo.sql`. Para abrir o ranking principal:

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
data/       planilhas originais e dicionário de dados
docs/       proposta, alternativas e roteiro do pitch
output/     banco SQLite pronto
scripts/    importador e verificador
sql/        consultas para o MVP e demonstração
```

## Limitações

- dados fictícios;
- janela de julho a setembro de 2026;
- correlação não implica causalidade;
- “operações por acesso” mede intensidade e pode ser maior que 1;
- o score precisa ser calibrado antes de uso em um negócio real.
