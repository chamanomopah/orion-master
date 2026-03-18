---
name: tavily-search
description: Realiza pesquisas online usando Tavily MCP. Use para qualquer pesquisa na web, buscar informações atuais, investigar tópicos, ou responder perguntas que requerem dados da internet. Decide automaticamente entre resposta rápida (terminal) ou pesquisa avançada (cria arquivo em ASSETS/RESEARCH/).
argument-hint: [query] [--advanced] [--domain <url>]
allowed-tools: mcp__tavily-remote-mcp__tavily_search, mcp__tavily-remote-mcp__tavily_extract, Bash(python *), Read, Write
---

# /tavily-search

Skill principal para pesquisas online (usando Tavily MCP).

## Modos de operação (automático)

Esta skill decide automaticamente o modo baseado na complexidade da query:

### 📋 **Modo RÁPIDO** (resposta direta)
Usado para:
- Perguntas específicas com respostas objetivas
- Definições, fatos, datas, números
- Queries simples e diretas
- "Qual é...", "Quanto é...", "Quem é...", "Quando..."

**Comportamento:** Retorna resultado formatado no terminal. **NÃO cria arquivo.**

### 📁 **Modo AVANÇADO** (cria arquivo)
Usado para:
- Pesquisas com múltiplos subtemas
- Tópicos que precisam de análise profunda
- Contexto extenso que não cabe no terminal
- "Pesquise sobre...", "Investigue...", "Estude..."
- Quando o usuário explicitamente pede arquivo

**Comportamento:** Cria arquivo .md em `ASSETS/RESEARCH/` + atualiza índice.

## Fluxo de decisão

```
Query recebida
       │
       ▼
┌──────────────────────────────┐
│ É pergunta simples/direta?   │
└──────────────────────────────┘
       │ SIM              │ NÃO
       ▼                  ▼
  Modo RÁPIDO         Modo AVANÇADO
  (terminal)          (arquivo .md)
```

## Ferramentas Tavily MCP

### `tavily_search` - Busca web
- `query`: Texto da pesquisa
- `max_results`: 1-10 resultados
- `search_depth`: basic | advanced | fast | ultra-fast
- `time_range`: day | week | month | year
- `include_domains`: Limita a domínios específicos
- `exclude_domains`: Exclui domínios
- `include_raw_content`: Retorna HTML completo

### `tavily_extract` - Extrai conteúdo de URLs
- `urls`: Lista de URLs
- `extract_depth`: basic | advanced
- `format`: markdown | text

## Estratégia de execução

### Para Modo RÁPIDO:
1. Executa `tavily_search` com `search_depth: basic` ou `advanced`
2. Processa resultados
3. Retorna resposta formatada no terminal com fontes

### Para Modo AVANÇADO:
1. Executa `tavily_search` com `search_depth: advanced`
2. Se necessário, extrai conteúdo completo com `tavily_extract`
3. Analisa e estrutura o conteúdo
4. Determina subpasta apropriada em `ASSETS/RESEARCH/`:
   - `A-ai-agents/` - Agentes AI, LLMs, RAG
   - `B-orchestration/` - Orquestração, multi-agent
   - `C-workflows/` - Workflows, automações
   - `D-patterns/` - Padrões, arquiteturas
   - `E-case-studies/` - Estudos de caso
   - Ou cria nova subpasta se necessário
5. Cria arquivo: `NN-topico-relevante.md`
6. Executa `update-index` automaticamente

## Formato de resposta

### Modo RÁPIDO (terminal):
```
## [Título resumido]

[Resposta concisa em 2-5 parágrafos]

**Fontes:**
- [Título](URL)
- [Título](URL)
```

### Modo AVANÇADO (arquivo):
```markdown
# [Título da Pesquisa]

**Data:** YYYY-MM-DD  
**Query:** [query usada]  
**Modo:** Pesquisa Avançada

## Resumo Executivo
[Resumo de 2-3 parágrafos]

## Principais Descobertas
- [Descoberta 1]
- [Descoberta 2]
- [Descoberta 3]

## Análise Detalhada
### [Subtema 1]
[Conteúdo detalhado]

### [Subtema 2]
[Conteúdo detalhado]

## Fontes
- [Título](URL)
- [Título](URL)
```

## Exemplos de uso

```
# Modo RÁPIDO (resposta direta)
/tavily-search Qual a capital do Japão?
/tavily-search Preço do Bitcoin hoje
/tavily-search Quem ganhou o Oscar 2025?

# Modo AVANÇADO (cria arquivo)
/tavily-search Pesquise sobre os últimos avanços em agentes AI autônomos
/tavily-search Investigue o estado da arte de RAG em 2026
/tavily-search Estude padrões de orquestração de multi-agentes
```

## Notas importantes

- **SEMPRE** usa Tavily MCP (nunca WebSearch padrão)
- **NUNCA** usa `tavily_research` - consome muitos tokens
- Decisão modo rápido/avançado é **automática** baseada na query
- Índices são atualizados automaticamente após criar arquivo
- Respostas sempre incluem fontes como hyperlinks
