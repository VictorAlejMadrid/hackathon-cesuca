# Ideias de solução para o hackathon

## Recomendação: Radar de Saúde do Cliente

### Problema

As informações de cadastro, suporte e uso estão separadas. Isso dificulta responder rapidamente quais clientes precisam de atenção e por quê.

### Solução

Um painel de Customer Success/Suporte que reúne os três conjuntos de dados e cria uma fila de atuação explicável. A visão `vw_saude_cliente` já entrega o MVP analítico no SQLite.

### Demonstração sugerida

1. Mostrar os KPIs gerais: 100 clientes, 300 atendimentos e 40 pendências.
2. Comparar os quatro serviços em volume de uso, intensidade de operações e suporte.
3. Abrir o ranking de clientes e filtrar os casos críticos.
4. Explicar os sinais que compõem o score: pendências, avaliações baixas, demora, baixa intensidade de operações e queda de acessos.
5. Simular uma ação: contato proativo, treinamento ou encaminhamento técnico.

### Diferencial para a banca

- score transparente e auditável em SQL;
- foco em decisão operacional, não apenas em gráficos;
- possibilidade de conectar um dashboard, API ou assistente em linguagem natural;
- proteção contra interpretações indevidas: o score prioriza casos, mas não prevê churn nem prova causalidade.

## Alternativa 2: Central de Eficiência do Suporte

Painel para líderes de atendimento acompanharem pendências, tempo de resolução, satisfação e principais assuntos por serviço, prioridade e canal.

Perguntas que a solução responde:

- onde está a maior fila pendente;
- quais assuntos mais demandam suporte;
- quais serviços têm maior tempo médio de resolução;
- quais canais concentram avaliações baixas.

É a opção mais simples para construir e demonstrar, mas integra menos o conjunto de uso dos serviços.

## Alternativa 3: Assistente de Adoção e Treinamento

Segmenta clientes com pouca intensidade de uso e combina esse sinal com assuntos como dúvida, instalação, acesso e senha. O sistema sugere trilhas de treinamento ou contato de onboarding.

Exemplos de ações:

- enviar tutorial do serviço com baixa adoção;
- oferecer treinamento quando houver dúvidas recorrentes;
- identificar clientes com muitos acessos e poucas operações;
- encaminhar erros e lentidão para análise técnica.

Essa proposta é boa para uma narrativa de crescimento e experiência do cliente, mas as recomendações devem continuar explicáveis e revisadas por uma pessoa.

## Arquitetura rápida do MVP

```text
Planilhas Excel -> importador Python -> SQLite -> API/dashboard -> fila de ações
```

Uma implementação rápida pode usar Streamlit ou FastAPI no backend e um dashboard simples. O arquivo `sql/consultas_demo.sql` contém as consultas iniciais para os cartões, tabelas e gráficos.

## Limitações que devem ser mencionadas

- dados fictícios e janela curta, de julho a setembro de 2026;
- correlação não implica causalidade;
- “operações por acesso” mede intensidade e pode ser maior que 1;
- o score é uma regra de triagem e precisa ser calibrado com objetivos reais do negócio;
- não há rótulo de cancelamento, receita ou SLA contratado para treinar um modelo preditivo confiável.
