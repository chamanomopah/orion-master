# Nome do usuário: Alfredo

sempre que o usuario falar pra adicionar na sua memoria/contexto, ele esta se referencido ao arquivo  C:\Users\JOSE\.claude\CLAUDE.md

---

## Sistema de Referências Unificado

Todas as citações seguem o formato: **[Letras][Número]**

- **Pastas = Letras** (A, B, AB, ABC...)
- **Arquivos = Números** (1, 2, 3...)
- **Categoria = falada** ("documentação", "pesquisa", "diagrama", "projeto", "cliente")

### Exemplos
- "documentação A1" → DOCS, Pasta A, Arquivo 1
- "pesquisa B2" → RESEARCH, Pasta B, Arquivo 2
- "diagrama C1" → DIAGRAMS, Pasta C, Arquivo 1
- "projeto D5" → PROJECTS, Projeto D, Arquivo 5

### Hierarquia
- `A1` = Pasta A, Arquivo 1
- `AB1` = Pasta A → Sub B, Arquivo 1
- `ABC1` = Pasta A → Sub B → Sub C, Arquivo 1

---

## Agentes Disponíveis (pasta: C:\Users\JOSE\.claude\agents)

**Total: 7 agentes** (6 numerados + 1 não numerado)

| Referência | Nome do Arquivo |
|------------|-----------------|
| Agente 1 | 1-meta-comp.md |
| Agente 2 | 2-gerente.md |
| Agente 3 | 3-n8n-nodes-generator.md |
| Agente 4 | 4-research_agent.md |
| Agente 5 | 5-browser-agent.md |
| Agente 6 | 6-computer-use-agent.md |
| Não numerado | meirmaid-diagram-builder.md |

**Nota:** Quando o usuário se referir a "agente X" (ex: "agente 1"), usar o agente correspondente pelo número no início do nome do arquivo.

## Habilidades/Skills Disponíveis (pasta: C:\Users\JOSE\.claude\skills)

**Total: 1 skill numerada**

| Referência | Nome da Pasta | Nome da Skill |
|------------|---------------|---------------|
| Skill 1 | 1-mermaid-diagram | mermaid-diagram |

**Nota:** Quando o usuário se referir a "skill X" (ex: "skill 1"), usar a skill correspondente pelo número no início do nome da pasta.

## Documentação DOCS (pasta: C:\Users\JOSE\.claude\ASSETS\DOCS)

**Curso de documentação em inglês sobre agentes AI**

**Total: 5 pastas | 35 arquivos**

### Índice de Pastas

| Referência | Pasta | Conteúdo |
|------------|-------|----------|
| documentação A | A-essentials | Módulos Claude Code, MCP |
| documentação B | B-human-in-a-loop | Human-in-the-loop patterns (3 arquivos) |
| documentação C | C-individual_agents | Agentes individuais (12 arquivos) |
| documentação D | D-orchestration | Orquestração (5 arquivos) |
| documentação E | E-workflows | Workflows e padrões (13 arquivos) |

### Como Citar

- **Formato:** "documentação" + `[Letras][Número]`
- **Exemplo:** "documentação A1" → Pasta A, Arquivo 1
- **Exemplo:** "documentação AB1" → Pasta A → Sub B, Arquivo 1
- **Múltiplos:** "documentação A arquivos 1, 2 e 3"

### Índice Completo

Veja arquivo `INDEX.md` em `C:\Users\JOSE\.claude\ASSETS\DOCS\INDEX.md` para referência completa.

**IMPORTANTE:** Quando o usuário citar documentação (ex: "use a documentação A1"), ler automaticamente o arquivo correspondente e usar como contexto.

---

## Diagramas DIAGRAMS (pasta: C:\Users\JOSE\.claude\ASSETS\DIAGRAMS)

**Diagramas em Mermaid (.mmd, .mermaid) organizados por categoria**

**Total: 5 pastas | 1 arquivo**

### Índice de Pastas

| Referência | Pasta | Conteúdo |
|------------|-------|----------|
| diagrama A | A-flowcharts | Fluxogramas e diagramas de processo |
| diagrama B | B-sequences | Diagramas de sequência |
| diagrama C | C-architecture | Diagramas de arquitetura |
| diagrama D | D-mindmaps | Mapas mentais |
| diagrama E | E-entity-relationship | Diagramas entidade-relacionamento |

### Como Citar

- **Formato:** "diagrama" + `[Letras][Número]`
- **Exemplo:** "diagrama A1" → Pasta A, Arquivo 1 (`ciclo_agua.mmd`)

### Índice Completo

Veja arquivo `INDEX.md` em `C:\Users\JOSE\.claude\ASSETS\DIAGRAMS\INDEX.md` para referência completa.

---

## Pesquisas RESEARCH (pasta: C:\Users\JOSE\.claude\ASSETS\RESEARCH)

**Pesquisas e estudos sobre agentes AI e padrões**

**Total: 5 pastas | 0 arquivos**

### Índice de Pastas

| Referência | Pasta | Conteúdo |
|------------|-------|----------|
| pesquisa A | A-ai-agents | Pesquisas sobre agentes de IA |
| pesquisa B | B-orchestration | Orquestração de multi-agentes |
| pesquisa C | C-workflows | Workflows e padrões de execução |
| pesquisa D | D-patterns | Padrões de design e implementação |
| pesquisa E | E-case-studies | Estudos de caso e exemplos práticos |

### Como Citar

- **Formato:** "pesquisa" + `[Letras][Número]`
- **Exemplo:** "pesquisa A1" → Pasta A, Arquivo 1

### Índice Completo

Veja arquivo `INDEX.md` em `C:\Users\JOSE\.claude\ASSETS\RESEARCH\INDEX.md` para referência completa.
