A secao de modulos esta organizada em:

Lista de modulos em /modules

Detalhe do modulo em /modules/:moduleId

Modulos principais visiveis:

tabuada

foundational

consolidation

Nos modulos foundational e consolidation:

Cada conceito possui 3 aulas fixas:

Estrutura

Compressao

Ritmo

Cada aula possui status proprio (locked, available, completed).

A progressao depende de concept_id e lesson_number.

A finalizacao de sessao ativa a funcao RPC complete_session, que:

Marca aula como concluida

Desbloqueia proxima aula

Marca conceito como mastered

Desbloqueia proximo conceito

Natureza atual das aulas

Atualmente, as aulas sao essencialmente:

Treinos praticos com questoes

Estrutura de sessao com metricas (precisao, variabilidade de tempo, estabilidade)

Persistencia via session_service

Nao existe um tipo de aula explicitamente expositiva.
O modelo atual pressupoe que o ensino acontece dentro do treino estruturado.

Ponto de encaixe para nova funcionalidade

O melhor ponto de encaixe e dentro da propria estrutura de conceito e aula.

Cada conceito ja possui:

Aula 1 Estrutura

Aula 2 Compressao

Aula 3 Ritmo

A proposta e transformar a Aula 1 Estrutura em um modelo hibrido:

Parte expositiva interativa

Parte pratica guiada
Mantendo lesson_number = 1 para nao quebrar a logica de progressao.

Alternativamente, pode-se criar um novo tipo de aula (lesson_type = theory) mantendo o mesmo conceito, mas isso exigiria extensao do schema.

Proposta detalhada da nova Aula Interativa de Calculo Mental

Objetivo da nova feature

Criar uma aula expositiva e interativa que ensine:

Estruturas mentais

Macetes estruturais

Decomposicoes

Compensacoes

Padroes de compressao

Transferencia para variacoes

Sem romper com o motor pedagogico atual.

Estrutura didatica da nova aula interativa

Essa aula deve seguir o template estrutural do motor pedagogico:

Bloco 1 Aquecimento Neural

2 a 4 questoes simples

Sem timer

Objetivo: ativar padrao mental

Mesmo modelo atual de questoes

Bloco 2 Estrutura Tecnica Expositiva Interativa

Novo bloco formalizado.

Conteudo:

Explicacao textual curta e tecnica

Exemplo passo a passo

Visualizacao da decomposicao

Destaque da regra mental

Formato:

Step-by-step controlado

Usuario clica em “proximo passo”

Sistema revela:

Etapa 1

Validacao

Etapa 2

Resultado final

Exemplo Multiplicacao por 5:

Mostrar 5 x 14

Etapa 1: 14 x 10

Etapa 2: dividir por 2

Conclusao

Bloco 3 Execucao Guiada com Validacao de Etapas

Diferenca importante:
Nao apenas resposta final.

Usuario precisa preencher:

Resultado intermediario

Resultado final

Sistema valida cada etapa.
Em caso de erro:

Feedback classificado:

Erro de decomposicao

Erro de compensacao

Erro de transporte

Erro de ritmo

Bloco 4 Consolidação Estrutural

5 a 10 exercicios

Sem timer

Apenas resposta final

Sistema monitora precisao e variabilidade

Bloco 5 Mini Compressao

Sistema esconde etapas intermediarias

Usuario resolve mentalmente

Leve reducao de tempo

Se precisao >= 90 por cento, libera Aula 2

Bloco 6 Sintese

Tela final com:

Resumo tecnico

Indicador de estabilidade

Mensagem neutra tecnica

Botao Finalizar Aula

Formato de interacao

Tipos de interacao novos

a) StepBlock
Componente que revela a tecnica passo a passo.

b) GuidedStepInput
Campo onde usuario preenche resultado intermediario.
Validacao instantanea.

c) StructuralFeedbackCard
Exibe classificacao tecnica do erro.

d) StabilityIndicator
Mostra:

Precisao

Variabilidade

Recomendacao tecnica

Integracao com logica adaptativa

Regras:

Precisao < 80 por cento
Ativar reforco estrutural dentro da propria aula.

Precisao >= 90 e variabilidade baixa
Marcar aula como completed.

Se alta estabilidade
Marcar como strong completion para facilitar mastered no conceito.

Insercao dentro dos modulos existentes

Opcao recomendada: manter dentro da Aula 1 Estrutura.

Motivos:

Coerente com o motor pedagogico.

Estrutura antes de compressao.

Nao cria modulo paralelo.

Mantem 3 aulas por conceito.

Nao quebra logica de desbloqueio existente.

Fluxo proposto:

/modules
-> selecionar foundational
-> conceito 7 Multiplicacao por 5
-> Aula 1 Estrutura
-> Nova Aula Interativa Expositiva + Guiada
-> Finaliza
-> RPC complete_session com:
concept_id
lesson_number = 1

Adequacao ao motor pedagogico

Estabilidade precede velocidade

A aula expositiva elimina pressao inicial.
Consolida estrutura antes do ritmo.

Estrutura antes de compressao

Formaliza a camada estruturada que ja existe no documento pedagogico, mas ainda nao esta modelada explicitamente na UI.

Erro como dado tecnico

Classificacao de erro por etapa implementa exatamente esse principio.

Pratica distribuida com espiralamento

Aula 1 ensina.
Aula 2 retoma com compressao.
Aula 3 retoma com interferencia.

Mensuracao como motor motivacional

Nao usar gamificacao.
Mostrar:

Estabilidade

Consistencia

Variabilidade

Sugestoes de implementacao tecnica

Extensao do modelo de aula

Criar estrutura configuravel por conceito:

lesson_content table:

id

concept_id

lesson_number

lesson_type (structure, compression, rhythm)

content_json

content_json pode conter:

blocos

exemplos

regras

variacoes

Novo fluxo de execucao de aula

Criar pagina:
LessonExecution.tsx

Parametros:

concept_id

lesson_number

Essa pagina:

Carrega content_json

Renderiza blocos dinamicamente

Usa useSession para persistir

Ajustes necessarios

Hoje:
Modules.tsx redireciona para /training generico.

Precisa:

Redirecionar para:
/lesson/:conceptId/:lessonNumber

E somente apos finalizar chamar:
sessionService.completeSession({
concept_id,
lesson_number
})

Persistencia de dados adicionais

Opcional:
Salvar tambem:

structural_error_type

intermediate_error_count
Para enriquecer analytics futuros.

Desafios

Manter simplicidade

Risco:
Excesso de texto.
Solução:
Textos curtos, tecnicos, objetivos.

Nao quebrar fluxo adaptativo

Garantir que:

Aula 1 ainda gere sessao valida

complete_session continue funcionando

lesson_number seja enviado corretamente

Seed inicial de progresso

Garantir que:

Primeiro conceito venha com lesson_1_status = available

Demais locked

Performance

Como cada aula pode ter 20 a 60 interacoes:

Usar renderizacao incremental

Evitar estado global pesado

Recomendacoes finais

Transformar Aula 1 em aula expositiva interativa estruturada.

Criar rota dedicada de execucao de aula.

Garantir envio de concept_id e lesson_number ao backend.

Implementar validacao de etapas para materializar o principio “erro como dado tecnico”.

Manter linguagem tecnica consistente com branding.

Evitar criar novo modulo paralelo, integrar na arquitetura existente.

Resultado esperado

A secao de modulos deixa de ser apenas um gateway para treino e passa a:

Ensinar explicitamente a tecnica.

Guiar a estruturacao mental.

Medir estabilidade.

Integrar explicacao e pratica no mesmo fluxo.

Isso alinha implementacao tecnica, arquitetura de banco e motor pedagogico, reduzindo o gap atual entre design conceitual e experiencia real do usuario.