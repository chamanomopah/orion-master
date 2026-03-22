# Variáveis Globais Dinâmicas

**Categoria:** Ideia | **Data:** 2026-03-21 | **Ref:** CONCEITOS-A1

---

## Resumo

Sistema que permite usar `{{variavel}}` em qualquer arquivo e ter os valores atualizados automaticamente quando o contexto muda (app ativo, URL, etc).

---

## Problema que Resolve

| Abordagem Tradicional | Problema |
|----------------------|----------|
| Editar cada arquivo manualmente | Tedioso, propenso a erros |
| Hardcoded nos scripts | Precisa reeditar código |
| Variáveis de ambiente Windows | Só atualiza para novos processos |
| HTTP endpoints | Requer lógica no cliente |

---

## Solução

**Arquitetura:**

```
1. Arquivos com {{placeholders}}
   ↓
2. Watcher descobre automaticamente
   ↓
3. Monitora mudanças de contexto
   ↓
4. Substitui placeholders em tempo real
```

---

## Implementação

### Arquivo Principal
`universal_watcher.py` - Monitora diretórios e atualiza placeholders

### Uso

```yaml
# monitored/config.yaml
app: {{current_app}}
user: {{username}}
timestamp: {{current_timestamp}}
```

```bash
python universal_watcher.py
```

Resultado:
```yaml
app: Visual Studio Code
user: JOSE
timestamp: 1742123456
```

---

## Variáveis Disponíveis

| Variável | Descrição |
|----------|-----------|
| `{{current_app}}` | Janela ativa no Windows |
| `{{current_time}}` | Data/hora atual |
| `{{current_date}}` | Data atual |
| `{{current_timestamp}}` | Unix timestamp |
| `{{username}}` | Nome do usuário (env) |
| `{{computername}}` | Nome do computador (env) |
| `{{project_dir}}` | Diretório do projeto |

---

## Extensibilidade

### Adicionar nova variável:

```python
# Em universal_watcher.py - get_current_values()
values["minha_var"] = meu_valor
```

### Adicionar novo diretório monitorado:

```python
WATCH_DIRS = [
    Path(__file__).parent / "watched",
    Path("C:/outro/caminho"),  # <-- adicionar aqui
]
```

### Adicionar nova extensão de arquivo:

```python
PROCESS_EXTENSIONS = {".txt", ".md", ".json", ".minha_ext"}
```

---

## Use Cases

1. **Transcrições com contexto** - Inclui app ativo automaticamente
2. **Relatórios** - Timestamp e usuário automático
3. **Configurações multi-ambiente** - Valores dinâmicos por contexto
4. **Time tracking** - Registra app em uso
5. **Snippets context-aware** - Comportamento diferente por app

---

## Localização

`B-software/E-vars-global/` - Implementação completa

---

## Notas

- Escalável para 500+ arquivos
- Não precisa registrar cada arquivo
- Descobre arquivos com placeholders automaticamente
- Apenas atualiza quando contexto muda (eficiente)
