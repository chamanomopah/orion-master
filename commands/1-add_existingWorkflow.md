# Modificar Workflow N8N Existente

Modifica um workflow existente no n8n usando scripts para manipular workflows grandes sem sobrecarregar o contexto.

## Antes de Começar

Leia as documentações para entender o sistema:
- @README_CATALOGO.md - Catálogo de nodes e sintaxe de criação
- @README_conectar.md - Sintaxe de conexões entre nodes
- @README_parameters.md - Sintaxe de configuração de parâmetros

## Como Funciona

**NOVA ORDEM** - Criar arquivos de configuração PRIMEIRO, depois executar scripts:

```
1. Baixar Workflow     → workflow_download.py <id> --parameters
2. Ler Estrutura       → _easy_nodes.md (gerado automaticamente)
3. CRIAR 3 ARQUIVOS    → .nodes + .formula + .params (ANTES de executar)
4. Executar Scripts    → um por um, usando o resultado do anterior
5. Atualizar n8n       → workflow_update.py <workflow_id> <workflow.json>
```

**Por que criar arquivos primeiro?**
- Facilita verificar erros antes de executar
- Permite revisar e ajustar sem reescrever comandos
- Evita execuções parciais com erros

## Instruções

### 1. Entender a Requisição

THINK HARD sobre:
- Quais nodes precisam ser criados?
- Como eles devem ser conectados?
- Quais parâmetros precisam ser configurados?
- Existe uma maneira mais eficiente de agrupar a criação?

### 2. Baixar o Workflow

```bash
python workflow_download.py <workflow_id> --parameters
```

Isso gera:
- `<nome>.json` - Workflow completo
- `<nome>_easy_nodes.md` - Resumo dos nodes e conexões (USE ESTE para contexto)

⚠️ **NUNCA leia o JSON diretamente** - Workflows n8n são muito grandes e sobrecarregam o contexto.

### 3. Ler Estrutura Atual

Leia o `_easy_nodes.md` gerado para entender:
- Nodes existentes e seus tipos
- Conexões atuais
- Nodes não conectados (disponíveis para uso)

### 4. CRIAR OS 3 ARQUIVOS DE CONFIGURAÇÃO

**ANTES de executar qualquer script**, crie os 3 arquivos:

#### 4.1. Arquivo `.nodes` (para nodes_create.py)

Contém a fórmula de nodes a serem criados.

```bash
# Nome sugerido: <workflow_descricao>.nodes
# Uso: python nodes_create.py arquivo.nodes -t workflow.json
```

**Formato**:
```
# Comentários começam com #
# Fórmula de nodes ( mesma sintaxe do nodes_create.py)
(7=agente1,agente2,agente3,agente4,agente5,agente6,agente7)agentTool
(7=router1,router2,router3,router4,router5,router6,router7)lmChatGoogleGemini
(7=memoria1,memoria2,memoria3,memoria4,memoria5,memoria6,memoria7)memoryPostgresChat
```

**Exemplo de arquivo .nodes completo**:
```nodes
# Criar 7 AgentTools com suporte completo
# Cada agente precisa de: AgentTool + Router + Memory

# AgentTools
(7=assistentePadrao,orquestradorWorkflows,gerenteProjetos,pesquisador,planejador,gestorCalendario,programador)agentTool

# Routers (Language Models)
(7=assistenteRouter,orquestradorRouter,gerenteProjRouter,pesquisadorRouter,planejadorRouter,gestorCalRouter,programadorRouter)lmChatGoogleGemini

# Memórias
(7=assistenteMemory,orquestradorMemory,gerenteProjMemory,pesquisadorMemory,planejadorMemory,gestorCalMemory,programadorMemory)memoryPostgresChat

# Execute Command Tools
(7=assistenteExec,orquestradorExec,gerenteProjExec,pesquisadorExec,planejadorExec,gestorCalExec,programadorExec)executeCommandTool

# Tools específicas
googleCalendarTool
```

#### 4.2. Arquivo `.formula` (para connections_create.py)

Contém as conexões entre nodes.

```bash
# Nome sugerido: <workflow_descricao>.formula
# Uso: python connections_create.py workflow.json arquivo.formula
```

**Exemplo de arquivo .formula completo**:
```formula
# Conectar AgentTools ao orquestrador (nero)
assistentePadrao>nero:ai_tool
orquestradorWorkflows>nero:ai_tool
gerenteProjetos>nero:ai_tool
pesquisador>nero:ai_tool
planejador>nero:ai_tool
gestorCalendario>nero:ai_tool
programador>nero:ai_tool

# Conectar Routers aos AgentTools
assistenteRouter>assistentePadrao:ai_languageModel
orquestradorRouter>orquestradorWorkflows:ai_languageModel
gerenteProjRouter>gerenteProjetos:ai_languageModel
pesquisadorRouter>pesquisador:ai_languageModel
planejadorRouter>planejador:ai_languageModel
gestorCalRouter>gestorCalendario:ai_languageModel
programadorRouter>programador:ai_languageModel

# Conectar Memórias aos AgentTools
assistenteMemory>assistentePadrao:ai_memory
orquestradorMemory>orquestradorWorkflows:ai_memory
gerenteProjMemory>gerenteProjetos:ai_memory
pesquisadorMemory>pesquisador:ai_memory
planejadorMemory>planejador:ai_memory
gestorCalMemory>gestorCalendario:ai_memory
programadorMemory>programador:ai_memory

# Conectar Execute Commands aos AgentTools
assistenteExec>assistentePadrao:ai_tool
orquestradorExec>orquestradorWorkflows:ai_tool
gerenteProjExec>gerenteProjetos:ai_tool
pesquisadorExec>pesquisador:ai_tool
planejadorExec>planejador:ai_tool
gestorCalExec>gestorCalendario:ai_tool
programadorExec>programador:ai_tool

# Conectar Google Calendar ao gestor de calendario
Google Calendar Tool>gestorCalendario:ai_tool
```

#### 4.3. Arquivo `.params` (para parameters.py)

Contém os parâmetros de configuração.

```bash
# Nome sugerido: <workflow_descricao>.params
# Uso: python parameters.py workflow.json arquivo.params
```

⚠️ **IMPORTANTE**: Arquivos .params NÃO suportam formatação Markdown.
- Use `#` para comentários
- Uma configuração por linha: `node:campo=valor`
- NÃO use `**`, `##`, ou qualquer formatação Markdown

⚠️ **CRÍTICO**: AgentTools usam `options.systemMessage`, NÃO `text`!

```params
# ORQUESTRADOR NERO (AI Agent principal)
nero:promptType=define
nero:text=You are NERO, the master orchestrator...

# ASSISTENTE PADRAO (AgentTool)
assistentePadrao:options.systemMessage=You are a helpful general assistant...

# ORQUESTRADOR DE WORKFLOWS (AgentTool)
orquestradorWorkflows:options.systemMessage=You are a Workflow Orchestration Specialist...
```

### 5. EXECUTAR OS SCRIPTS (um por um)

Após criar os 3 arquivos, execute os scripts em sequência:

#### 5.1. Criar Nodes
```bash
# Use o arquivo .nodes diretamente (MÉTODO RECOMENDADO)
python nodes_create.py arquivo.nodes -t workflow.json
# Resultado: workflow_nodesAdded.json

# EVITE $(cat arquivo.nodes) no Windows - pode ter problemas com codificação
```

#### 5.2. Criar Conexões
```bash
python connections_create.py workflow_nodesAdded.json arquivo.formula
# Resultado: workflow_nodesAdded_connected.json
```

#### 5.3. Configurar Parâmetros
```bash
python parameters.py workflow_nodesAdded_connected.json arquivo.params 
# Resultado: workflow_nodesAdded_connected_params.json
```

### 6. Validar Antes de Atualizar

```bash
# Listar nodes sem conexões (deve retornar vazio ou apenas esperados)
python connections_create.py workflow_final.json
```

### 7. Atualizar n8n

```bash
python workflow_update.py <workflow_id> workflow_final.json
```

## Scripts Suportados e Arquivos

| Script | Arquivo de Configuração | Uso |
|--------|------------------------|-----|
| `nodes_create.py` | `.nodes` | `python nodes_create.py x.nodes -t workflow.json ` |
| `connections_create.py` | `.formula` | `python connections_create.py workflow.json x.formula ` |
| `parameters.py` | `.params` | `python parameters.py workflow.json x.params` |
| `get_connection.py` | entrada `.json` | `python get_connection.py workflow.json` (gera _easy_nodes.md) |

## Padrões de Criação

### Agente com Suporte Completo

**Arquivo .nodes**:
```nodes
# Um agente com suporte completo
(1=meuAgentTool)agentTool
(1=meuRouter)lmChatGoogleGemini
(1=meuMemory)memoryPostgresChat
(1=meuExec)executeCommandTool
```

**Arquivo .formula**:
```formula
# Conexões do agente
meuRouter>meuAgentTool:ai_languageModel
meuMemory>meuAgentTool:ai_memory
meuExec>meuAgentTool:ai_tool
```

**Arquivo .params**:
```params
# AI Agent Tool
meuAgentTool:options.systemMessage=You are a specialist in...
```

**Execução**:
```bash
python nodes_create.py agente.nodes -t workflow.json
python connections_create.py workflow_nodesAdded.json agente.formula
python parameters.py workflow_nodesAdded_connected.json agente.params
```

### Múltiplos Agentes Similares

**Arquivo .nodes** (7 agentes):
```nodes
# 7 AgentTools
(7=assistentePadrao,orquestradorWorkflows,gerenteProjetos,pesquisador,planejador,gestorCalendario,programador)agentTool
# 7 Routers
(7=assistenteRouter,orquestradorRouter,gerenteProjRouter,pesquisadorRouter,planejadorRouter,gestorCalRouter,programadorRouter)lmChatGoogleGemini
# 7 Memórias
(7=assistenteMemory,orquestradorMemory,gerenteProjMemory,pesquisadorMemory,planejadorMemory,gestorCalMemory,programadorMemory)memoryPostgresChat
# 7 Execute Commands
(7=assistenteExec,orquestradorExec,gerenteProjExec,pesquisadorExec,planejadorExec,gestorCalExec,programadorExec)executeCommandTool
```

## Checklist

Antes de executar os scripts:
- [ ] Arquivo `.nodes` criado com todos os nodes necessários
- [ ] Arquivo `.formula` criado com todas as conexões
- [ ] Arquivo `.params` criado com todos os parâmetros

Antes de chamar `workflow_update.py`:
- [ ] Todos os nodes necessários foram criados?
- [ ] Todas as conexões foram aplicadas? (nenhum node órfão)
- [ ] AgentTools usam `options.systemMessage` (não `text`)
- [ ] AI Agents principais usam `text` e `promptType=define`
- [ ] Arquivo .params não tem formatação Markdown
- [ ] Validação foi executada sem erros

## Argumentos

- `workflow_id` (obrigatório): ID do workflow existente no n8n
- `modifications` (obrigatório): Descrição das modificações desejadas

## Exemplos

```
/add_existingWorkflow "KupahpM4tcDPotgf" "adicionar switch com 3 rotas (success, retry, error)"

/add_existingWorkflow "abc123def456" "adicionar 7 agentes especializados com suporte completo"

/add_existingWorkflow "xyz789" "conectar gerenteClaudeCode ao nero como tool"
```

## Scripts

| Script | Entrada | Saída | Arquivo de Config |
|--------|---------|-------|-------------------|
| `workflow_download.py` | workflow_id | `.json` + `_easy_nodes.md` | - |
| `get_connection.py` | `.json` | `_easy_nodes.md` | - |
| `nodes_create.py` | `.nodes` | `_nodesAdded.json` | `.nodes` |
| `connections_create.py` | `.formula` | `_connected.json` | `.formula` |
| `parameters.py` | `.params` | `_params.json` | `.params` |
| `workflow_update.py` | workflow_id + `.json` | Confirmação | - |

## Diretório de Trabalho

Scripts em: `C:\Users\JOSE\Downloads\cc_n8n_generator\claude_code_n8n_manager\`

## Sintaxe de Referência Rápida

### nodes_create.py (.nodes)
```
# Comentários com #
(7=nome1,nome2,...)tipo    # Multiplicação com nomes
tipo=nome                  # Nome personalizado
tipo                       # Nome padrão
```

### connections_create.py (.formula)
```
# Comentários com #
A>B                        # Conexão simples
A>(B\|C)                   # Múltiplas saídas
A<B:ai_tool                # Conexão com tipo
```

### parameters.py (.params)
```
# Comentários com #
node:campo=valor           # Configuração simples
node:options.campo=valor   # Campo aninhado
node:text=texto com espaços  # String com espaços
```
