# Sistema de Referências Unificado

**Índice mestre de todas as categorias de recursos**

---

## Estrutura de Citação

```
[Categoria falada] + [Letras da Pasta] + [Número do Arquivo]
```

| Componente | Representação | Exemplo |
|------------|---------------|---------|
| Categoria | Falado explicitamente | "documentação", "pesquisa", "diagrama" |
| Pasta | Letras (1 por nível) | A, B, AB, ABC |
| Arquivo | Número | 1, 2, 3 |

### Exemplos de Uso

| Fala | Significado |
|------|-------------|
| "documentação A1" | DOCS, Pasta A, Arquivo 1 |
| "documentação AB3" | DOCS, Pasta A → Sub B, Arquivo 3 |
| "pesquisa B2" | RESEARCH, Pasta B, Arquivo 2 |
| "diagrama C1" | DIAGRAMS, Pasta C, Arquivo 1 |

---

## Categorias Disponíveis

| Categoria | Caminho | Prefixo Falado |
|-----------|---------|----------------|
| DOCS | ASSETS/DOCS | "documentação" |
| DIAGRAMS | ASSETS/DIAGRAMS | "diagrama" |
| RESEARCH | ASSETS/RESEARCH | "pesquisa" |
| AGENTS | agents | "agente" |
| SKILLS | skills | "skill" |

---

## DOCS - Documentação

**Localização:** `ASSETS/DOCS`

| Pasta | Conteúdo | Arquivos |
|-------|----------|----------|
| A | Essentials | Subpastas AB, AC |
| B | Human-in-a-loop | 3 arquivos |
| C | Individual_agents | 12 arquivos |
| D | Orchestration | 5 arquivos |
| E | Workflows | 13 arquivos |

**Ver INDEX.md completo:** `ASSETS/DOCS/INDEX.md`

---

## DIAGRAMS - Diagramas

**Localização:** `ASSETS/DIAGRAMS`

| Pasta | Conteúdo | Arquivos |
|-------|----------|----------|
| A | Flowcharts | 1 arquivo |
| B | Sequences | 0 arquivos |
| C | Architecture | 0 arquivos |
| D | Mindmaps | 0 arquivos |
| E | Entity-relationship | 0 arquivos |

**Ver INDEX.md completo:** `ASSETS/DIAGRAMS/INDEX.md`

---

## RESEARCH - Pesquisas

**Localização:** `ASSETS/RESEARCH`

| Pasta | Conteúdo | Arquivos |
|-------|----------|----------|
| A | AI-agents | 0 arquivos |
| B | Orchestration | 0 arquivos |
| C | Workflows | 0 arquivos |
| D | Patterns | 0 arquivos |
| E | Case-studies | 0 arquivos |

**Ver INDEX.md completo:** `ASSETS/RESEARCH/INDEX.md`

---

## Regras de Criação

### Pastas
- **Formato:** `[Letra]-[nome-descritivo]`
- **Exemplo:** `A-essentials`, `AB-mcp`, `ABC-servers`

### Arquivos
- **Formato:** `[Número]-[nome-descritivo].md`
- **Exemplo:** `1-claude-code.md`, `2-mcp.md`

### Subpastas (Hierarquia)
```
A-essentials/          → nível 1 (A)
├── AB-mcp/            → nível 2 (AB)
│   └── ABC-servers/   → nível 3 (ABC)
│       └── 1-guide.md → ABC1
```

---

*Última atualização: 2026-03-18*
