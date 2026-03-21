# Jinja2 - Template Engine para Python

**Referência:** documentação G1

## O que é Jinja2?

Jinja2 é um motor de templates moderno e designer-friendly para Python, modelado após o Django's templates. Permite separar lógica de apresentação de forma limpa.

## Instalação

```bash
pip install Jinja2
```

## Conceitos Básicos

### Sintaxe delimitadores

| Delimitador | Uso | Exemplo |
|-------------|-----|---------|
| `{% ... %}` | Estruturas de controle | `{% if user %}` |
| `{{ ... }}` | Imprimir variáveis | `{{ nome }}` |
| `{# ... #}` | Comentários | `{# Isso não aparece #}` |

## Variáveis e Filtros

### Variáveis básicas
```python
from jinja2 import Template

template = Template('Olá {{ nome }}!')
print(template.render(nome='Alfredo'))  # Olá Alfredo!
```

### Filtros mais usados

```jinja
{{ texto|upper }}           # MAIÚSCULAS
{{ texto|lower }}           # minúsculas
{{ lista|length }}          # Tamanho da lista
{{ numero|round(2) }}       # Arredondar
{{ texto|replace('a', 'b') }} # Substituir
{{ lista|join(', ') }}      # Juntar elementos
{{ data|strftime('%d/%m') }} # Formatar data
{{ valor|default('N/A') }}   # Valor padrão
{{ html|safe }}             # Renderizar HTML sem escape
{{ texto|truncate(50) }}    # Truncar texto
```

## Estruturas de Controle

### If/Else
```jinja
{% if usuario.admin %}
    <p>Painel Admin</p>
{% elif usuario.premium %}
    <p>Premium</p>
{% else %}
    <p>Gratuito</p>
{% endif %}
```

### Loops
```jinja
{% for item in lista %}
    {{ loop.index }} - {{ item.nome }}
    {% if loop.first %} (primeiro) {% endif %}
    {% if loop.last %} (último) {% endif %}
{% else %}
    Nenhum item encontrado
{% endfor %}
```

## Herança de Templates

### Template base (`base.html`)
```jinja
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}Meu Site{% endblock %}</title>
    {% block head %}{% endblock %}
</head>
<body>
    {% block content %}{% endblock %}
</body>
</html>
```

### Template filho
```jinja
{% extends "base.html" %}

{% block title %}Página Inicial{% endblock %}

{% block content %}
    <h1>Bem-vindo!</h1>
{% endblock %}
```

## Macros (Funções reutilizáveis)

```jinja
{% macro input(nome, valor='', tipo='text') %}
    <input type="{{ tipo }}" name="{{ nome }}" value="{{ valor }}">
{% endmacro %}

{{ input('usuario') }}
{{ input('senha', tipo='password') }}
```

## Uso com Arquivos

### Carregar template de arquivo
```python
from jinja2 import Environment, FileSystemLoader

env = Environment(loader=FileSystemLoader('templates'))
template = env.get_template('index.html')
resultado = template.render(nome='Alfredo', idade=30)
```

### Estrutura de pastas recomendada
```
project/
├── templates/
│   ├── base.html
│   ├── index.html
│   └── components/
│       └── header.html
└── main.py
```

## Contexto Global

```python
env = Environment(loader=FileSystemLoader('templates'))

# Adicionar filtros customizados
def formatar_moeda(valor):
    return f"R$ {valor:.2f}"

env.filters['moeda'] = formatar_moeda

# Variáveis globais
env.globals['agora'] = datetime.datetime.now
```

## Exemplos Práticos

### Iterar sobre dicionário
```jinja
{% for key, value in dados.items() %}
    <strong>{{ key }}:</strong> {{ value }}
{% endfor %}
```

### Renderizar lista com índice
```jinja
<ul>
{% for i in range(10) %}
    <li>Item {{ i }}</li>
{% endfor %}
</ul>
```

### Template condicional com verificação
```jinja
{% if usuario is defined and usuario %}
    Olá, {{ usuario.nome }}!
{% endif %}
```

### Testes (expressões booleanas)
```jinja
{% if variavel is defined %}
{% if valor is none %}
{% if lista is sequence %}
{% if numero is divisibleby(3) %}
{% if texto is string %}
```

## Boas Práticas

1. **Separação de responsabilidades:** Lógica no Python, apresentação no Jinja2
2. **Use macros** para componentes repetitivos
3. **Herança** para layouts compartilhados
4. **Filtros customizados** para formatação específica
5. **Escape automático** está ativo por padrão (segurança XSS)

## Integrações Comuns

| Framework | Uso |
|-----------|-----|
| Flask | Já incluído nativamente |
| FastAPI | Use `Jinja2Templates` |
| Django | Pode substituir templates nativos |
| Scripts | Para gerar arquivos configuráveis |

## Referências

- Documentação oficial: https://jinja.palletsprojects.com/
- Templates sandboxed para segurança
- Suporte a assíncrono (async)
