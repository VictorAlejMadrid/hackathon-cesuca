# Perguntas do desafio — respostas da equipe

## Qual problema específico a equipe quer resolver?
Ao fim do mês, o gestor de suporte não tem uma visão única e confiável dos atendimentos, dos clientes e do uso dos
serviços. Para responder perguntas simples ele cruza três planilhas à mão, e padrões importantes passam despercebidos
(prioridade "Alta" que não é atendida mais rápido; pendentes que ficam semanas abertos). A solução é um painel mensal
em que o gestor escolhe as colunas que quer cruzar e um chatbot de IA escreve o insight sobre o recorte escolhido.

## Quem se beneficiará e como?
- **Gestor de suporte:** fecha o mês em minutos, compara com o mês anterior e monta a própria análise sem pedir relatório.
- **Direção e comercial:** perguntam ao chatbot em português, sem saber filtrar planilha.
- **Equipe de suporte:** recebe alertas do que precisa de ação (pendentes antigos, clientes com queda de uso).
- **Clientes:** chamados esquecidos e clientes se afastando passam a ser notados antes.

## Qual evidência nos dados sustenta a escolha?
| Achado | Valor |
|---|---|
| Tempo médio de resolução, prioridade Alta vs Baixa | 130 vs 102 min |
| "Erro no sistema": tempo médio | 183 min (demais ≈ 100–117) |
| Notas 1–2 em Lentidão / Relatório | 30% / 26% (demais 7–14%) |
| Pendentes abertos há 30+ dias | 24 de 40 |
| Clientes com queda de acessos > 30% (jul→set) | 36 de 100 |
| Chamados por mês (jul, ago, set) | 106, 108, 86 |
| Correlação tempo de resolução × nota (Spearman) | 0,04 (≈ nula) |

Há 3 meses para comparar e 3 planilhas ligadas por `cliente_id`, o que permite cruzamentos (setor × nota, porte × tempo).

## O que será demonstrado funcionando ao final?
Demo de ~3 minutos:
1. **Painel do mês:** seletor de mês; chamados, pendentes, tempo médio, nota média e uso, com variação vs mês anterior.
2. **Alertas automáticos:** pendentes antigos e clientes com queda de acessos.
3. **Construtor de insights:** o gestor escolhe dimensão + métrica (ex.: prioridade × tempo de resolução); o código monta
   tabela e gráfico e liga as planilhas por `cliente_id` quando preciso.
4. **Chatbot (Gemini):** recebe só a tabela agregada e escreve o insight, dizendo também o que NÃO dá para concluir.
   Em um recorte sem diferença relevante (ex.: porte × nota) deve afirmar que o indício é fraco.
5. Perguntas de continuação sobre o mesmo recorte ("e só em setembro?").

Números vêm do código; a IA só redige. Painel e construtor funcionam mesmo se a API falhar.

## Quais limitações ou riscos da solução devem ser explicados?
- **Sem causalidade:** o dicionário proíbe; o chatbot descreve, não explica "por quê".
- **Dados sintéticos e curtos:** 3 meses, 100 clientes, ~30 chamados por assunto; diferenças são indícios; variação mensal pode ser ruído.
- **Setembro incompleto:** dados até 29/09; backlog de setembro inflado por chamados recentes. A UI avisa.
- **Ligação entre tabelas:** cruzar atendimentos × uso direto duplica linhas; agregamos por cliente antes e bloqueamos combinações sem sentido.
- **Uso por serviço:** o serviço muda a cada mês; tendência vale para o total do cliente.
- **Erros da IA:** pode interpretar mal ou inventar; mitigação: cálculo em código, só números da tabela, tabela exibida ao lado.
- **Privacidade/segredos:** só agregados fictícios vão à API; chave em variável de ambiente.
- **Dependência de internet na demo:** respostas pré-geradas como reserva.
- **Escopo de 2 h:** prioridade = núcleo (painel + construtor), depois IA, depois extras.
