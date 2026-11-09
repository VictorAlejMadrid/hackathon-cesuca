-- 1. KPIs gerais para abrir a apresentação
SELECT
    (SELECT COUNT(*) FROM clientes) AS clientes,
    COUNT(*) AS atendimentos,
    SUM(status = 'Pendente') AS pendentes,
    ROUND(100.0 * SUM(status = 'Pendente') / COUNT(*), 1) AS percentual_pendente,
    ROUND(AVG(tempo_resolucao_min), 1) AS tempo_medio_resolucao_min,
    ROUND(AVG(satisfacao_1_a_5), 2) AS satisfacao_media
FROM atendimentos;

-- 2. Comparação de adoção e suporte por serviço
SELECT *
FROM vw_resumo_servico
ORDER BY pendentes DESC, atendimentos DESC;

-- 3. Fila de clientes para atuação de Customer Success/Suporte
SELECT
    cliente_id,
    nome_ficticio,
    porte,
    setor,
    cidade,
    score_atencao,
    faixa_atencao,
    atendimentos_pendentes,
    satisfacao_media,
    tempo_medio_resolucao_min,
    taxa_operacoes_por_acesso,
    acessos_primeiro_mes,
    acessos_ultimo_mes
FROM vw_saude_cliente
ORDER BY score_atencao DESC, atendimentos_pendentes DESC, cliente_id
LIMIT 20;

-- 4. Motivos mais frequentes dos chamados pendentes
SELECT assunto, prioridade, COUNT(*) AS quantidade
FROM atendimentos
WHERE status = 'Pendente'
GROUP BY assunto, prioridade
ORDER BY quantidade DESC, assunto, prioridade;

-- 5. Evolução mensal de uso
SELECT
    mes,
    SUM(acessos) AS acessos,
    SUM(operacoes_realizadas) AS operacoes,
    ROUND(1.0 * SUM(operacoes_realizadas) / NULLIF(SUM(acessos), 0), 4) AS taxa_operacoes_por_acesso
FROM uso_servicos
GROUP BY mes
ORDER BY mes;

-- 6. Integridade: deve retornar zero linhas
PRAGMA foreign_key_check;
