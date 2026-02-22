# **Definicao de Sprint: Expansao do Protocolo de Performance (PRO)**

## **1\. Visao Estrategica da Sprint**

### **1.1 Objetivo Estrategico**

Implementar a infraestrutura tecnica e pedagogica para os modulos de alta performance (Automacao, Ritmo e Precisao), corrigindo o gap de persistencia entre a interface de modulos e o motor de treinamento, e estabelecendo a barreira de conversao para o Protocolo PRO.

### **1.2 Problema Solucionado**

Atualmente, existe uma desconexao entre a UI de modulos e o servico de sessao (os treinos iniciados via modulos nao computam progresso pedagogico real). Alem disso, os modulos PRO sao apenas placeholders visuais sem logica de execucao ou regras de desbloqueio associadas.

### **1.3 Hipotese Pedagogica**

Ao introduzir a "Interferencia Cognitiva Controlada" (Modulo Precisao) e a "Cadencia Progressiva" (Modulo Ritmo), o usuario desenvolve estabilidade neural sob pressao, reduzindo a variabilidade do tempo de resposta e consolidando a automacao dos 15 conceitos nucleares.

### **1.4 Metricas de Sucesso (KPIs)**

* Educacional: Reducao de 15% na variabilidade de tempo (Standard Deviation) em sessoes de Ritmo.  
* Produto: 100% das sessoes iniciadas via Modulos devem registrar concept\_id e lesson\_id no banco.  
* Negocio: Taxa de clique no CTA "Requer Protocolo Pro" superior a 20% para usuarios gratuitos.

## ---

**2\. Escopo Funcional Detalhado**

### **2.1 Fluxo de Acesso PRO**

* Implementacao de verificacao de status is\_pro no carregamento dos detalhes do modulo.  
* Bloqueio de acesso as aulas dos modulos: Automacao (ID 3), Ritmo (ID 4\) e Precisao (ID 5).  
* Modal de conversao "Upgrade de Protocolo" com copy focado em "Evolucao Estrutural Avancada" (conforme Brand Book).

### **2.2 Reconstrucao do Inicio de Treino**

* Refatoracao da rota /training para aceitar parametros opcionais: ?conceptId=X\&lessonNumber=Y.  
* Integracao da useSession com os parametros da URL para garantir que sessionService.completeSession envie os metadados pedagogicos corretos.

### **2.3 Novas Mecanicas de Execucao (Exclusivas PRO)**

* **Modo Fluxo (Automacao):** Apresentacao de questoes em sequencia ininterrupta sem feedback imediato entre elas, apenas ao final do bloco de 10\.  
* **Cronometro Inteligente (Ritmo):** Timer regressivo que se ajusta dinamicamente: se o usuario acerta 3 vezes seguidas abaixo do tempo, o limite para a proxima questao diminui em 100ms.  
* **Interferencia (Precisao):** Alternancia rapida entre operacoes inversas (Soma/Subtracao) ou conceitos distintos (Multiplicacao por 5 / Multiplicacao por 9\) no mesmo bloco.

## ---

**3\. Escopo Tecnico e Arquitetura de Dados**

### **3.1 Integracao com Supabase**

* **Tabela profiles:** Validacao da coluna subscription\_tier (enum: 'free', 'pro').  
* **Tabela concept\_progress:** Garantir que o seed inicial contenha os registros para os conceitos 16 a 24 (PRO).  
* **RPC get\_adaptive\_recommendation:** Atualizacao para incluir os novos IDs de modulos na logica de sugestao quando o usuario atingir estabilidade no Nucleo Fundacional.

### **3.2 Algoritmo de Dificuldade Adaptativa (Fase PRO)**

* Implementacao de threshold de estabilidade: O sistema deve calcular a mediana de tempo das ultimas 5 sessoes.  
* Se stability\_score \> 0.85 e accuracy \>= 95%, o sistema ativa o "Modo Compressao" (menos etapas visuais na estrutura tecnica).

### **3.3 Regras de Desbloqueio e Progressao**

* Modulo Automacao: Desbloqueia apos conclusao de todos os conceitos (1-15) do modulo Consolidacao.  
* Modulo Ritmo: Requer 80% de conceitos "Mastered" nos modulos anteriores.  
* Modulo Precisao: Requer estabilidade comprovada (variabilidade \< 200ms) no modulo Ritmo.

## ---

**4\. Arquitetura Pedagogica Interna (Modulos PRO)**

### **4.1 Modulo: Automacao**

* **Foco:** Reconhecimento de padroes sem decomposicao consciente.  
* **Tipos de Exercicios:** Questoes "Flash" (exposicao curta do numero) para estimular memoria de trabalho.  
* **Estrutura de Aula:** 60 interacoes rapidas focadas em trios pitagoricos e complementos decimais.

### **4.2 Modulo: Ritmo**

* **Foco:** Manutencao da precisao sob cadencia fixa.  
* **Mecanica:** Metronomo visual/sonoro discreto (opcional) que define o tempo limite para cada entrada.  
* **Penalidade:** Erros sob timer impactam o stability\_score de forma mais agressiva que erros em treinos livres.

### **4.3 Modulo: Precisao**

* **Foco:** Resistencia a distracao e alternancia de contexto.  
* **Tipos de Exercicios:** Operacoes mistas com numeros de 3 digitos e decimais intermediarios (ex: 5 x 3.5).  
* **Logica de Reforco:** Se a precisao cair abaixo de 80%, o sistema forca o retorno imediato ao Bloco de Estrutura Tecnica (Aula 1 do conceito correspondente).

## ---

**5\. UX/UI: Ajustes Necessarios**

* **Identidade Visual:** Modulos PRO devem utilizar uma borda sutil com a cor Primary Accent (\#3A72F8) para diferenciar do Surface padrao.  
* **Feedback de Performance:** Substituir "Acertos" por "Indice de Estabilidade" nos resultados das sessoes PRO.  
* **Navegacao:** Inclusao de Breadcrumbs Modulos \> Detalhe do Conceito \> Treino para manter o contexto espacial do usuario.  
* **Loading State:** Implementacao de Skeleton screens especificos para a lista de aulas para evitar saltos de layout durante o fetch do concept\_progress.

## ---

**6\. Eventos de Tracking e Analytics**

* session\_start: Incluir is\_pro\_session, concept\_id, lesson\_number.  
* pro\_paywall\_view: Disparado ao tentar acessar modulo bloqueado.  
* adaptive\_adjustment: Disparado quando o algoritmo altera o tempo do Smart Timer ou o nivel de dificuldade.  
* concept\_mastered: Disparado quando o SQL confirma a transicao para o status mastered.

## ---

**7\. Criterios de Aceite (Definition of Done)**

* O fluxo completo de uma aula (ID 1 a 24\) deve persistir progresso no banco via RPC complete\_session.  
* Usuarios free nao conseguem iniciar treinos de modulos PRO via URL direta (validacao no useEffect da pagina de treino).  
* O cronometro inteligente deve ajustar o tempo em tempo real sem causar re-renders que limpem o input do usuario.  
* A barra de progresso do modulo deve refletir a media ponderada dos status dos conceitos (mastered \= 100%, completed \= 75%, in\_progress \= 30%).

## ---

**8\. Riscos e Dependencias**

* **Risco de Performance:** O calculo de variabilidade de tempo em tempo real no frontend pode impactar dispositivos de baixo custo. Mitigacao: Realizar calculos pesados apenas no final da sessao via RPC.  
* **Dependencia de Dados:** A ausencia de um seed de dados para novos usuarios pode quebrar a UI de modulos. Dependencia: Script de migracao 005\_pro\_concepts.sql deve ser executado antes do deploy do frontend.  
* **Inconsistencia Pedagogica:** A taxonomia dos nomes dos conceitos deve ser unificada entre o MOTOR PEDAGÓGICO.md e o banco de dados.