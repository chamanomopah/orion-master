# Orquestração PAI vs Agent-Teams - Comparação Técnica Detalhada

**Data:** 2026-02-10
**Autor:** Investigação técnica PAI
**Status:** Documentação de referência

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura PAI Atual](#arquitetura-pai-atual)
3. [Agent-Teams Experimental](#agent-teams-experimental)
4. [Comparação Detalhada](#comparação-detalhada)
5. [Protocolos de Comunicação](#protocolos-de-comunicação)
6. [Exemplos de Código](#exemplos-de-código)
7. [Quando Usar Cada Um](#quando-usar-cada-um)
8. [Referências](#referências)

---

## 🎯 Visão Geral

Esta documentação compara duas abordagens de orquestração de agentes no Claude Code:

- **PAI (Task Tool + subagent_type)**: Sistema atual production-ready
- **Agent-Teams**: Feature experimental com coordenação automática

### Diferença Principal

| Aspecto | PAI Task Tool | Agent-Teams |
|---------|---------------|-------------|
| **Persistência** | Efêmero | Permanente |
| **Coordenação** | Manual (pai orquestra) | Automática (time auto-organiza) |
| **Comunicação** | Pai → Filho | Todos ↔ Todos |
| **Status** | Production-ready | Experimental |

---

## 🏗️ Arquitetura PAI Atual

### Como Funciona

A orquestração PAI usa o **Task tool** com parâmetro `subagent_type` para criar agentes filhos.

```typescript
Task({
  subagent_type: "Engineer",  // Tipo pré-definido
  prompt: "Implement feature X",
  model: "sonnet",            // Opcional
  run_in_background: false    // Opcional
})
```

### Fluxo de Execução

```
┌─────────────────────────────────────────────────────────┐
│ 1. AGENTE PAI (Claude principal)                        │
│    └─> Identifica necessidade de delegar               │
│    └─> Invoca Task tool com subagent_type              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CLAUDE CODE TASK TOOL ENGINE                         │
│    ├─> Cria NOVA SESSÃO Claude isolada                 │
│    ├─> Subagent herda contexto do pai                  │
│    ├─> Aplica whitelist de tools seguras               │
│    └─> Executa em processo separado                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. SUBAGENTE (Filho)                                    │
│    ├─> Recebe prompt completo                          │
│    ├─> Tem acesso limitado a tools (whitelist)         │
│    ├─> Processa tarefa independentemente               │
│    └─> Retorna resultado ao pai                        │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 4. COMUNICAÇÃO PAI-FILHO                                │
│    ├─> JSON protocol para estruturar dados             │
│    ├─> agent_handle.send_message() (experimental)      │
│    └─> Output capturado e processado pelo pai          │
└─────────────────────────────────────────────────────────┘
```

### Tipos de Subagentes Disponíveis

```typescript
const SUBAGENT_TYPES = {
  // Implementação
  'Engineer': 'Código e implementação',
  'Architect': 'Design de sistema',
  'Designer': 'UX/UI',

  // Pesquisa
  'ClaudeResearcher': 'Pesquisa via Claude',
  'GeminiResearcher': 'Pesquisa via Gemini',
  'GrokResearcher': 'Pesquisa via Grok',

  // Exploração
  'Explore': 'Exploração de codebase',
  'Intern': 'Tarefas gerais paralelas',

  // Qualidade
  'QATester': 'Testes browser',
  'Pentester': 'Testes segurança',
  'Plan': 'Planejamento'
};
```

### Métodos de Comunicação

#### 1. Output Direto (Padrão)

```typescript
const result = Task({
  subagent_type: "Engineer",
  prompt: "Implement login form",
  model: "sonnet"
})

console.log(result)
// → "Login form implemented at src/Login.tsx"
```

#### 2. agent_handle.send_message() (Experimental)

```typescript
Task({
  subagent_type: "Engineer",
  prompt: "Implement login form",
  on_message: (agent_handle) => {
    // Pai pode enviar mensagens ATIVAS durante execução
    agent_handle.send_message("STOP. Use TypeScript strict mode")
  }
})
```

#### 3. Background + Output File

```typescript
const backgroundTask = Task({
  subagent_type: "Explore",
  prompt: "Explore entire codebase",
  run_in_background: true
})
// → Retorna { task_id, output_file }

// Recuperar resultado depois
const output = TaskOutput({ task_id: backgroundTask.task_id })
```

### Orquestração em Paralelo

```typescript
// Lance TODOS os agents em paralelo (um só round trip)
const [research1, research2, research3] = await Promise.all([
  Task({ subagent_type: "Intern", model: "haiku", prompt: "Research A" }),
  Task({ subagent_type: "Intern", model: "haiku", prompt: "Research B" }),
  Task({ subagent_type: "Intern", model: "haiku", prompt: "Research C" })
])

// Spotcheck pattern: verificar consistência
const verification = Task({
  subagent_type: "Intern",
  model: "haiku",
  prompt: `Verify consistency: ${JSON.stringify([research1, research2, research3])}`
})
```

---

## 🆕 Agent-Teams Experimental

### Como Funciona

O **agent-teams** adiciona o parâmetro `team_name` ao Task tool, transformando subagentes em membros de um time persistente.

```typescript
Task({
  subagent_type: "Engineer",
  team_name: "my_team",  // ← CRIA/ENTRA NUM TIME PERSISTENTE
  name: "frontend_dev",   // ← Nome do teammate
  prompt: "Build frontend"
})

// Outro agent entra no MESMO time
Task({
  subagent_type: "Engineer",
  team_name: "my_team",  // ← MESMO TIME
  name: "backend_dev",   // ← DIFERENTE ROLE
  prompt: "Build backend"
})
```

### Arquitetura Agent-Teams

```
┌───────────────────────────────────────────────────────────┐
│ TEAM LEADER (Sessão Claude principal)                    │
│ ├─> TeamCreate({ team_name: "dev_team" })               │
│ │   └─> Cria configuração de time                       │
│ │   └─> Cria task list compartilhada                    │
│ └─> Task({ team_name: "dev_team", name: "member1" })    │
│     └─> Spawns teammate PERSISTENTE                     │
└───────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ TEAMMATE 1   │ │ TEAMMATE 2   │ │ TEAMMATE 3   │
│ frontend_dev │ │ backend_dev  │ │ qa_tester    │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Permanente   │ │ Permanente   │ │ Permanente   │
│ Compartilha  │ │ Compartilha  │ │ Compartilha  │
│ task list    │ │ task list    │ │ task list    │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
              ┌─────────────────────┐
              │ SHARED TASK LIST    │
              │ • Auto-assign       │
              │ • Messaging         │
              │ • Coordination      │
              └─────────────────────┘
```

### Fluxo Completo

```typescript
// 1. Leader cria o time
TeamCreate({
  team_name: "compiler_team",
  members: ["lexer", "parser", "codegen", "optimizer"]
})

// 2. Leader spawna teammates persistentes
Task({
  subagent_type: "Intern",
  team_name: "compiler_team",
  name: "lexer",
  prompt: "Build lexer for C language",
  model: "sonnet"
})

Task({
  subagent_type: "Intern",
  team_name: "compiler_team",
  name: "parser",
  prompt: "Build parser using lexer output",
  model: "sonnet"
})

// 3. Teammates se comunicam via task list compartilhada
// 4. Leader monitora progresso e intervêm se necessário
// 5. Teammates podem chamar outros teammates
```

---

## 📊 Comparação Detalhada

### Tabela Comparativa

| Aspecto | PAI (Task Tool) | Agent-Teams |
|---------|-----------------|-------------|
| **Persistência** | Efêmero (executa e morre) | Permanente (vive enquanto time existe) |
| **Coordenação** | Manual (pai orquestra tudo) | Automática (task list compartilhada) |
| **Comunicação** | Pai → Filho (unidirecional) | Todos ↔ Todos (bidirecional) |
| **Escalabilidade** | Paralelismo limitado (2-5) | Swarms grandes (5-20+) |
| **Estado** | Sem estado entre calls | Estado compartilhado no time |
| **Auto-organização** | Não | Sim |
| **Workflow** | Sequencial ou paralelo simples | Adaptativo e dinâmico |
| **Status** | Production-ready | Experimental |
| **Complexidade** | Baixa | Média-Alta |
| **Use case principal** | Tarefas específicas | Projetos complexos de longo prazo |

### Trade-offs

#### PAI Task Tool - Vantagens
- ✅ Simples e direto
- ✅ Production-ready
- ✅ Controle total do pai
- ✅ Menor overhead
- ✅ Melhor para tarefas únicas

#### PAI Task Tool - Limitações
- ❌ Sem coordenação automática
- ❌ Comunicação unidirecional
- ❌ Sem estado compartilhado
- ❌ Difícil escalar além de 5 agents

#### Agent-Teams - Vantagens
- ✅ Auto-organização
- ✅ Estado compartilhado
- ✅ Comunicação multi-direcional
- ✅ Escalável para swarms grandes
- ✅ Workflow adaptativo

#### Agent-Teams - Limitações
- ❌ Experimental (bugs possíveis)
- ❌ Mais complexo
- ❌ Maior overhead
- ❌ Difícil debugar
- ❌ Requer mais setup

---

## 📡 Protocolos de Comunicação

### JSON Protocol (Pai ↔ Filho)

#### Request do Pai

```json
{
  "version": "1.0",
  "type": "task_request",
  "from_agent": "parent_session_id",
  "to_agent": "child_session_id",
  "timestamp": "2026-02-10T07:43:51Z",
  "payload": {
    "subagent_type": "Engineer",
    "prompt": "Implement feature",
    "context": {
      "files": ["src/main.ts"],
      "tools": ["Read", "Write", "Edit"]
    }
  },
  "metadata": {
    "model": "sonnet",
    "parent_handle": "agent_handle_abc123"
  }
}
```

#### Resposta do Filho

```json
{
  "version": "1.0",
  "type": "task_result",
  "from_agent": "child_session_id",
  "to_agent": "parent_session_id",
  "timestamp": "2026-02-10T07:44:02Z",
  "payload": {
    "status": "success",
    "result": "Feature implemented at src/feature.ts",
    "artifacts": ["src/feature.ts", "src/feature.test.ts"]
  }
}
```

### Team Communication (Agent-Teams)

#### Shared Task List

```json
{
  "team_name": "compiler_team",
  "created_at": "2026-02-10T07:40:00Z",
  "members": ["lexer", "parser", "codegen"],
  "task_list": {
    "pending": [
      {
        "id": "task_1",
        "assigned_to": "lexer",
        "description": "Build token parser",
        "dependencies": []
      }
    ],
    "in_progress": [],
    "completed": []
  },
  "messaging": [
    {
      "from": "lexer",
      "to": "parser",
      "message": "Lexer complete, tokens ready",
      "timestamp": "2026-02-10T07:45:00Z"
    }
  ]
}
```

---

## 💻 Exemplos de Código

### Caso 1: Pesquisa Paralela

#### Abordagem PAI

```typescript
// PAI/SKILL.md - Parallel research
const topics = ["AI safety", "LLM scaling", "Alignment"]

const results = await Promise.all(
  topics.map(topic =>
    Task({
      subagent_type: "ClaudeResearcher",
      model: "sonnet",
      prompt: `Research: ${topic}. Provide latest papers and findings.`
    })
  )
)

// Pai agrega resultados manualmente
const summary = Task({
  subagent_type: "Intern",
  model: "haiku",
  prompt: `Synthesize research: ${JSON.stringify(results)}`
})
```

#### Abordagem Agent-Teams

```typescript
// Leader cria time de pesquisa
TeamCreate({
  team_name: "research_team",
  shared_context: "AI safety research"
})

// Spawna 3 pesquisadores persistentes
for (const topic of topics) {
  Task({
    subagent_type: "ClaudeResearcher",
    team_name: "research_team",
    name: topic.replace(" ", "_"),
    prompt: `Research ${topic} and add to shared team knowledge`,
    model: "sonnet"
  })
}

// Teammates SE AUTO-ORGANIZAM via task list
// Leader só monitora e intervêm se necessário
```

### Caso 2: Pipeline de Desenvolvimento

#### Abordagem PAI (Pipeline Pattern)

```typescript
// PAI/SKILL.md - Pipeline pattern
// 1. Architect
const architecture = await Task({
  subagent_type: "Architect",
  model: "opus",
  prompt: "Design system architecture for feature X"
})

// 2. Engineer (usa output do architect)
const implementation = await Task({
  subagent_type: "Engineer",
  model: "sonnet",
  prompt: `Implement: ${architecture}`
})

// 3. QA Tester
const testing = await Task({
  subagent_type: "QATester",
  prompt: `Test implementation: ${implementation}`
})
```

#### Abordagem Agent-Teams

```typescript
// Team persistente de desenvolvimento
TeamCreate({
  team_name: "dev_team",
  workflow: "architect → implement → test → deploy"
})

// Membros se conhecem e se chamam automaticamente
Task({ subagent_type: "Architect", team_name: "dev_team", name: "arch" })
Task({ subagent_type: "Engineer", team_name: "dev_team", name: "dev" })
Task({ subagent_type: "QATester", team_name: "dev_team", name: "qa" })

// Architect chama Engineer automaticamente
// Engineer chama QA automaticamente
// Coordenação é IMPLÍCITA
```

### Caso 3: Compilador C (16 Agents)

#### Abordagem PAI

```typescript
// Muito complexo orquestrar manualmente
// Teria que criar 16 Task calls sequenciais ou complicar
// com Promise.all() e dependencies manuais

const stages = [
  "lexer", "parser", "ast_optimizer", "ir_generator",
  "ir_optimizer", "x86_backend", "arm_backend", "riscv_backend",
  // ... 8 mais
]

// Código fica muito complexo
```

#### Abordagem Agent-Teams

```typescript
// Time de 16 agentes auto-organizáveis
TeamCreate({
  team_name: "compiler_team",
  workflow: "full_pipeline"
})

// Spawna todos de uma vez
const roles = [
  "lexer", "parser", "ast", "ir_gen",
  "opt1", "opt2", "opt3", "x86", "arm", "riscv",
  "tests", "docs", "benchmarks", "validation", "integration"
]

roles.map(role =>
  Task({
    subagent_type: "Intern",
    team_name: "compiler_team",
    name: role,
    prompt: `Handle ${role} stage in compiler`,
    model: "sonnet"
  })
)

// Teammates se auto-organizam e chamam uns aos outros
```

---

## 🎯 Quando Usar Cada Um

### Use PAI Task Tool quando:

- ✅ Tarefas únicas, bem definidas
- ✅ Workflow sequencial simples
- ✅ Paralelismo limitado (2-5 agents)
- ✅ Controle direto do pai necessário
- ✅ Sem necessidade de coordenação complexa
- ✅ Production-ready necessário
- ✅ Overhead deve ser mínimo

**Exemplos:**
- Implementar uma feature específica
- Pesquisar 3 tópicos em paralelo
- Testar componentes independentes
- Explorar codebase

### Use Agent-Teams quando:

- ✅ Projetos complexos, multi-etapas
- ✅ Muitos agents (5-20+)
- ✅ Auto-organização necessária
- ✅ Estado compartilhado importante
- ✅ Workflow dinâmico/adaptativo
- ✅ Coordenação automática desejada
- ✅ Feature experimental aceitável

**Exemplos:**
- Construir compilador completo
- Sistema com múltiplos serviços interdependentes
- Pesquisa contínua com múltiplas frentes
- Projetos de longo prazo

---

## 📚 Referências

### Documentação Oficial

- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams) - Documentação oficial de agent-teams
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents) - Como criar subagentes customizados

### Artigos Técnicos

- [From Tasks to Swarms: Agent Teams in Claude Code](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code) - Análise detalhada da evolução
- [Task Tool vs. Subagents: How Agents Work](https://ibuildwith.ai/blog/task-tool-vs-subagents-how-agents-work-in-claude-code/) - Task tool como engine de paralelização
- [Agent design lessons from Claude Code](https://jannesklaas.github.io/ai/2025/07/20/claude-code-agent-design.html) - Lições de design de agentes
- [Building a C compiler with parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler) - Caso real com 16 agentes

### Tutoriais e Guias

- [How to Set Up and Use Claude Code Agent Teams](https://darasoba.medium.com/how-to-set-up-and-use-claude-code-agent-teams-and-actually-get-great-results-9a34f8648f6d) - Tutorial prático
- [Claude 4.6 Agent Teams Complete Tutorial](https://help.apiyi.com/en/claude-4-6-agent-teams-how-to-use-guide-en.html) - 5 cenários reais

### Gists de Implementação

- [TeammateTool Implementation Guide](https://gist.github.com/sorrycc/4702f258f3d505495f4d5d984576a08d) - Detalhes de implementação
- [Swarm Orchestration Skill](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea) - Skill de orquestração

### GitHub Issues

- [Parent-Child Agent Communication #1770](https://github.com/anthropics/claude-code/issues/1770) - Comunicação pai-filho
- [Task tool model parameter bug #24668](https://github.com/anthropics/claude-code/issues/24668) - Bug recente em desenvolvimento
- [SubAgent Tool Whitelist - Reddit](https://www.reddit.com/r/AI_Agents/comments/1lrdz4p/about_claude_codes_task_tool_subagent_design/) - Discussão sobre segurança

---

## 📝 Notas Adicionais

### Como Ativar Agent-Teams

Agent-teams é experimental. Para ativar:

1. Atualizar Claude Code para versão mais recente
2. Adicionar em `~/.claude/settings.json`:
   ```json
   {
     "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": true
   }
   ```
3. Iniciar nova sessão

### Bugs Conhecidos

- `model` parameter pode ser ignorado com `team_name` (Issue #24668)
- Comunicação entre teammates ainda está em desenvolvimento
- Debugar swarms grandes é desafiador

### Recomendações

- **Comece com Task tool** para entender a base
- **Experimente agent-teams** em projetos não-críticos
- **Use model selection** adequado (haiku para tasks simples)
- **Sempre verifique** outputs de subagentes
- **Monitore custos** com múltiplos agents

---

**Fim do Documento**

Para perguntas ou atualizações, consulte as referências acima ou investigue o código-fonte em `~/.claude/skills/PAI/`
