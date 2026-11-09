# Mapeamento dos dados

```
clientes (100) ──1:N── atendimentos (300)
     cliente_id └─1:N── uso_servicos (300)
```

| Tabela | Granularidade | Campos |
|---|---|---|
| clientes | 1 por cliente | cliente_id, nome_ficticio, porte (Micro/Pequena/Média), setor (Comércio/Indústria/Serviços/Tecnologia), cidade (5), data_cadastro |
| atendimentos | 1 por chamado (01/07–29/09/2026) | atendimento_id, cliente_id, data_abertura, servico, assunto (8), canal (Portal/E-mail/WhatsApp/Telefone), prioridade (Alta/Normal/Baixa), status (Resolvido/Pendente), tempo_resolucao_min, satisfacao_1_a_5 |
| uso_servicos | cliente × mês × serviço | cliente_id, mes (AAAA-MM), servico, acessos, operacoes_realizadas |

Serviços: Portal Web, Aplicativo Mobile, Sistema Alfa, Sistema Beta.
Assuntos: Dúvida de utilização, Acesso e senha, Atualização, Lentidão, Solicitação de melhoria, Relatório, Erro no sistema, Instalação.

## Qualidade verificada
- IDs de atendimento únicos; nenhum cliente órfão em atendimentos ou uso; sem duplicidade (cliente, mês, serviço).
- 260 resolvidos e 40 pendentes; tempo e nota são nulos exatamente nos pendentes.
- Cada cliente tem exatamente 3 linhas de uso (jul, ago, set), mas o serviço varia por mês.
- 98 clientes têm chamados; C074 e C093 não têm nenhum. Há 6 linhas de uso com acessos = 0.
- Tempos de resolução entre 8 e 280 min (todo chamado resolvido no mesmo dia).
- Dados de atendimento vão até 29/09/2026.

## Observações numéricas
- Chamados por mês: jul 106, ago 108, set 86. Pendentes por mês de abertura: 15, 9, 16.
- Acessos por mês: 3.629, 3.671, 3.483. Operações: 1.824, 1.712, 1.805.
- Tempo por canal: Telefone 125 min (nota 3,60), Portal 106 min (nota 4,00).
- Setor × acessos por cliente: Tecnologia 91, Serviços 121. Cidade × nota: Porto Alegre 3,58, Canoas 4,02.
- 44 pares (cliente, assunto) com 2+ chamados (reincidência).
