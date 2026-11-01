# Folhagem & Cia — API de gerenciamento de plantas

API REST desenvolvida como parte do desafio de Produto/Desenvolvimento do CITi, com o objetivo de gerenciar o catálogo de plantas, controlar o estoque e registrar vendas.

**Tecnologias:** Node.js, Express, TypeScript, Prisma, PostgreSQL e Docker.

## 1. Como executar o projeto

### Pré-requisitos

- Docker Desktop instalado e em execução.
- Node.js 20 ou superior.
- Yarn.

### Instalação

Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/luiznassar/desafio-dev-citi.git
cd desafio-dev-citi
```

Crie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

No PowerShell, caso necessário:

```powershell
Copy-Item .env.example .env
```

Instale as dependências:

```bash
yarn
```

Inicie os containers:

```bash
docker compose up -d --build
```

Aplique as migrations do banco de dados:

```bash
yarn migration
```

A API estará disponível em:

`http://localhost:3001`

Para verificar o funcionamento, acesse `http://localhost:3001/`.

## 2. Estrutura do projeto

```text
prisma/
  schema.prisma
  migrations/

src/
  controllers/
    PlantaController.ts
  repositories/
    PlantaRepository.ts
  database/
    index.ts
  routes.ts
  server.ts
```

A aplicação utiliza a seguinte organização:

- **Routes:** definem os endpoints e direcionam as requisições.
- **Controllers:** recebem as requisições, validam os dados e retornam as respostas HTTP.
- **Repositories:** concentram as operações de acesso ao banco de dados.
- **Prisma:** realiza a comunicação com o PostgreSQL.

## 3. Modelo de dados — Planta

| Campo | Tipo | Descrição |
|---|---|---|
| id | Int | Identificador único, gerado automaticamente |
| nome | String | Nome da planta |
| especie | String | Espécie da planta |
| preco | Int | Preço em centavos |
| estoque | Int | Quantidade disponível |
| luminosidade | Enum | Necessidade de luminosidade |
| petFriendly | Boolean | Indica se é segura para animais |
| regaACadaDias | Int | Intervalo de rega em dias |
| createdAt | DateTime | Data de criação automática |
| updatedAt | DateTime | Data de atualização automática |

Valores aceitos para `luminosidade`:

- `SOMBRA`
- `MEIA_SOMBRA`
- `SOL_PLENO`

## 4. Endpoints da API

Base URL: `http://localhost:3001`

### Cadastro de plantas

**POST `/plantas`**

Cadastra uma nova planta.

Exemplo de corpo:

```json
{
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 4500,
  "estoque": 10,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 7
}
```

Resposta de sucesso: `201 Created`.

### Listagem de plantas

**GET `/plantas`**

Retorna todas as plantas cadastradas.

Também permite aplicar filtros:

- `?luminosidade=SOMBRA`
- `?petFriendly=true`
- `?luminosidade=MEIA_SOMBRA&petFriendly=false`

Resposta de sucesso: `200 OK`.

### Busca por ID

**GET `/plantas/:id`**

Retorna os dados de uma planta específica.

Exemplo: `GET /plantas/1`.

Respostas: `200 OK` ou `404 Not Found`.

### Atualização de planta

**PATCH `/plantas/:id`**

Atualiza parcialmente os dados de uma planta. Apenas os campos que precisam ser alterados devem ser enviados.

Exemplo:

```json
{
  "preco": 5000,
  "estoque": 15
}
```

Respostas: `200 OK`, `400 Bad Request` ou `404 Not Found`.

### Exclusão de planta

**DELETE `/plantas/:id`**

Remove uma planta pelo identificador.

Resposta de sucesso: `204 No Content`.

### Registro de venda

**POST `/plantas/:id/venda`**

Registra a venda de uma quantidade de unidades de determinada planta, atualizando o estoque automaticamente.

Exemplo:

```json
{
  "quantidade": 2
}
```

Respostas:
- `200 OK`: venda realizada.
- `400 Bad Request`: quantidade inválida ou estoque insuficiente.
- `404 Not Found`: planta não encontrada.

O sistema impede que o estoque fique negativo.

### Valor total do estoque

**GET `/plantas/estoque/valor-total`**

Retorna o valor financeiro total do estoque e a quantidade total de vasos disponíveis.

Exemplo de resposta:

```json
{
  "valorTotalEmCentavos": 154300,
  "totalDeVasos": 37
}
```

O valor financeiro é calculado pela soma de `preco × estoque` de todas as plantas cadastradas.

## 5. Validações e tratamento de erros

A API realiza validações para garantir a integridade dos dados:

- Todos os campos são obrigatórios no cadastro.
- O preço deve ser um número inteiro maior que zero, informado em centavos.
- O estoque deve ser um número inteiro maior ou igual a zero.
- A luminosidade deve corresponder a um dos valores permitidos.
- `petFriendly` deve ser booleano.
- `regaACadaDias` deve ser um número inteiro maior ou igual a um.
- Atualizações parciais validam os campos enviados.
- A quantidade de uma venda deve ser um número inteiro maior que zero.
- Uma venda não pode ultrapassar o estoque disponível.
- Filtros inválidos são rejeitados.

### Códigos HTTP utilizados

| Código | Significado |
|---|---|
| 200 | Requisição realizada com sucesso |
| 201 | Recurso criado com sucesso |
| 204 | Recurso excluído com sucesso |
| 400 | Dados ou parâmetros inválidos |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

## 6. Decisões de implementação

- Os preços são armazenados em centavos para evitar problemas de precisão com valores monetários.
- O controle de vendas utiliza uma atualização condicional do estoque, impedindo que duas operações permitam a venda de unidades indisponíveis.
- O estoque pode ser cadastrado com valor zero, representando plantas esgotadas.
- As operações de banco de dados são isoladas na camada Repository.
- As validações das requisições são realizadas na camada Controller.

## 7. Comandos úteis

| Comando | Função |
|---|---|
| `docker compose up -d` | Inicia os containers |
| `docker compose down` | Para os containers |
| `docker compose logs -f server` | Exibe os logs da API |
| `yarn migration` | Executa as migrations |
| `yarn studio` | Abre o Prisma Studio |
| `yarn typecheck` | Verifica erros de tipagem |

## 8. Testes

As rotas foram testadas com requisições HTTP, verificando operações de cadastro, listagem, busca, atualização, exclusão, filtros, vendas e cálculo do estoque.

Também foram testados cenários de erro, incluindo dados inválidos, identificadores inexistentes, estoque insuficiente e tentativas de atualização com valores inválidos.
