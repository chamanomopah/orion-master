Introdução
Aprenda a automatizar seu fluxo de trabalho no Upwork com a API da Vollna.

Automatize todo o seu fluxo de trabalho no Upwork: descubra novos projetos por meio de filtros personalizados, acompanhe as análises de propostas, gerencie convites e monitore perfis do Upwork, tudo por meio de uma API poderosa.
O acesso à API está incluído no plano Agency .
​
Autenticação
Para usar a API da Vollna, você precisa primeiro criar uma conta. Siga estes passos para obter seu token de API:
Crie uma conta em vollna.com
Acesse seu painel de controle.
Clique no menu do seu perfil (canto superior direito).
Selecione “Tokens de API”
Gere um novo token de API
Seu token de API possui muitos privilégios, portanto, certifique-se de mantê-lo em segurança! Não compartilhe seu token de API em áreas de acesso público, como GitHub, código do lado do cliente, etc.
Todas as requisições à API devem ser feitas via HTTPS. Requisições feitas via HTTP simples falharão. Requisições à API sem autenticação também falharão.
Inclua seu token de API no X-API-TOKENcabeçalho de cada solicitação:
​
Limitação de taxa
A API Vollna implementa uma limitação de taxa de 5 requisições por minuto. Limitações de taxa na API são essenciais para gerenciar a carga do servidor e garantir um serviço consistente e confiável para todos os usuários. Ao limitar o número de requisições que um usuário pode fazer por minuto, evita-se que um único usuário sobrecarregue o sistema, o que pode levar a tempos de resposta mais lentos ou interrupções do sistema, garantindo assim o uso justo e a disponibilidade do serviço para todos.
Quando os limites de taxa forem excedidos, a API retornará um código de status 429 com a seguinte resposta:
{
  "error": "Rate limit exceeded"
}
​
Sistema de Crédito
Para garantir o uso justo e evitar o abuso da API, implementamos um sistema de créditos para determinados endpoints. Cada requisição à API para recuperar projetos consome créditos com base no número de projetos retornados. Esse sistema ajuda a manter a qualidade do serviço e impede a extração não autorizada de dados.
Os créditos do projeto são consumidos nestes pontos de acesso:
GET /filters/{id}/projects
GET /results/{id}/projects
GET /projects/lookup
O sistema de crédito foi projetado para atender às operações comerciais normais, evitando abusos. A maioria das agências considerará sua alocação de crédito mensal mais do que suficiente para suas necessidades.
Cada resposta bem-sucedida dos endpoints de recuperação de projetos acima inclui um creditsobjeto, permitindo que você acompanhe o uso em tempo real:
{
  "credits": {
    "remaining": 9995,
    "reset_date": "2026-01-16T00:00:00+00:00",
    "new_projects_consumed": 5,
    "total_projects_returned": 20
  }
}
A sua alocação de créditos de projeto é individual por assinatura de equipe e pode ser visualizada no seu painel de controle em https://www.vollna.com/dashboard/team/api-tokens .
Quando os créditos se esgotarem, a API retornará um código de status 402 com a seguinte resposta:
{
  "error": "Insufficient credits",
  "credits_remaining": 0,
  "credits_reset_date": "2024-04-01T00:00:00Z"
}
​
Formatos de resposta comuns
​
Resposta bem-sucedida
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
​
Resposta de erro
{
  "error": "Error message"
}
​
Códigos de status
A Vollna utiliza códigos de resposta HTTP padrão para indicar o sucesso ou a falha de uma solicitação de API.
Em geral:
Códigos na faixa 2xx indicam sucesso.
Códigos na faixa 4xx indicam um erro que falhou com base nas informações fornecidas.
Código	Nome	Resumo
200	OK	Tudo funcionou como esperado.
400	Pedido ruim	A solicitação foi considerada inaceitável, geralmente devido à ausência de um parâmetro obrigatório.
401	Não autorizado	Token de API inválido ou ausente fornecido no cabeçalho X-API-TOKEN
402	Pagamento necessário	A assinatura da equipe está inativa ou os créditos da API do projeto estão esgotados.
403	Proibido	O token da API não tem permissões para realizar a solicitação.
404	Não encontrado	O recurso solicitado não foi encontrado.
429	Muitos pedidos	A solicitação foi rejeitada devido à limitação de taxa (consulte a seção Limitação de Taxa).
500	Erro do Servidor Interno	A solicitação falhou devido a um erro do servidor.