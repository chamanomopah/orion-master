# Claude Code: Isolamento de Subagentes com Skills e MCPs Exclusivos

**Data:** 2026-03-18
**Categoria:** Orquestração de Multi-Agentes
**Tags:** `claude-code` `subagentes` `mcp` `skills` `isolamento` `segurança`

---

## Resumo Executivo

Pesquisa sobre como configurar subagentes no Claude Code com **skills e MCPs exclusivos** — recursos que só determinado subagente pode acessar, sem disponibilidade na sessão principal ou em outros agentes.

---

## 1. MCP Servers Escopados ao Subagente

### Conceito
Use o campo `mcpServers` com definições **inline** para criar conexões MCP que só existem durante a execução do subagente.

### Exemplo Prático

```yaml
---
name: secure-data-processor
description: Processa dados sensíveis com MCPs exclusivos
mcpServers:
  # Definição inline - SÓ este subagente tem acesso
  - my-secure-db:
      type: stdio
      command: npx
      args: ["-y", "@my-org/secure-mcp@latest"]
      env:
        API_KEY: "${SECURE_KEY}"
  # Referência compartilhada - mas pode ser restrito via permissions
  - slack
---
```

### Comportamento de Isolamento
- MCPs **inline** não aparecem na sessão principal
- MCPs **inline** não aparecem em outros subagentes
- A conexão é criada quando o subagente inicia
- A conexão é destruída quando o subagente termina

---

## 2. Skills Exclusivas via Frontmatter

### Conceito
Skills carregadas no subagente via campo `skills` são injetadas **apenas** naquele contexto específico.

### Exemplo Prático

```yaml
---
name: api-developer
description: Desenvolvedor de API com padrões exclusivos
skills:
  - internal-api-conventions  # Só este subagente carrega
  - proprietary-patterns      # Não disponível em outras sessões
---
```

### Regras de Herança
- Subagentes **NÃO herdam** skills da sessão principal
- Skills devem ser listadas explicitamente no frontmatter
- O conteúdo completo da skill é injetado no startup do subagente

---

## 3. Bloqueio de Skills em Outros Contextos

### Conceito
Use `permissions.deny` no `settings.json` para impedir que outras sessões usem determinadas skills.

### Configuração Global

```json
// ~/.claude/settings.json ou .claude/settings.json
{
  "permissions": {
    "deny": [
      "Skill(internal-api-conventions)",
      "Skill(proprietary-patterns)",
      "Skill(secret-workflow *)"
    ]
  }
}
```

### Comportamento
- Sessão principal não pode usar essas skills
- Outros subagentes não podem usar essas skills
- **MAS**: o subagente que carrega via `skills` ainda pode usar (injeção direta no prompt)

---

## 4. Padrão Completo: Subagente Isolado

### Exemplo de Produção

```yaml
---
name: payment-processor
description: Processa pagamentos com ferramentas exclusivas
model: sonnet
tools: Read, Bash, Edit
mcpServers:
  - payment-gateway:
      type: stdio
      command: python
      args: ["/path/to/secure/payment-mcp.py"]
skills:
  - payment-protocols
  - compliance-rules
permissionMode: default
memory: local
---

You are a payment processing specialist. Use the preloaded MCP servers
and skills to process transactions securely.

Rules:
- Only use the payment-gateway MCP for transactions
- Follow compliance-rules from preloaded skills
- Never expose payment details in outputs
```

---

## 5. Estratégia de Isolamento em Camadas

| Camada | Onde Configurar | Quem Pode Acessar |
|--------|-----------------|-------------------|
| **Skills em `~/.claude/skills/`** | Disponível globalmente | Todas as sessões |
| **Skills em `.claude/skills/`** | Apenas projeto | Sessões do projeto |
| **Skills em subagente `skills`** | Apenas subagente | Só esse subagente |
| **MCP inline em subagente** | Só quando roda | Só esse subagente |
| **MCP em `.mcp.json`** | Global ou projeto | Depende do escopo |

---

## 6. Restringir Ferramentas Específicas

### Via Subagent Frontmatter

```yaml
---
name: readonly-auditor
description: Auditor sem permissão de escrita
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
---
```

### Via Hooks

```yaml
---
name: protected-operation
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/block-mutating-commands.sh"
---
```

---

## 7. Impedir Spawn de Outros Subagentes

```yaml
---
name: leaf-worker
description: Worker que não spawn outros agentes
tools: Read, Write, Edit, Bash, Grep, Glob
# NÃO incluir "Agent" no tools
---
```

Subagentes **nunca spawnam outros subagentes** por padrão, mas remover `Agent` de `tools` garante isolamento total.

---

## Referências

- **Documentação Claude Code:**
  - `ASSETS/DOCS/A-essentials/A-claude_code_modules/1-claude_code_mcp.md`
  - `ASSETS/DOCS/A-essentials/A-claude_code_modules/2-skills.md`
  - `ASSETS/DOCS/A-essentials/A-claude_code_modules/3-sub-agents.md`
- **MCP Official Docs:** https://modelcontextprotocol.io/docs

---

## Conclusão

Para criar recursos exclusivos para subagentes:

1. **MCPs exclusivos** → Use definições `inline` no `mcpServers`
2. **Skills exclusivas** → Carregue via `skills` + bloquee globalmente com `permissions.deny`
3. **Impedir spawn** → Não inclua `Agent` no `tools`
4. **Validação condicional** → Use hooks `PreToolUse` para restringir operações
