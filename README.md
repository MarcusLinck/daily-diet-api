# Daily Diet API

API REST para registrar usuários e acompanhar refeições, incluindo quais refeições estão ou não dentro da dieta. O projeto usa Fastify, TypeScript, Prisma e PostgreSQL.

## Requisitos

- Node.js 20 ou superior
- npm
- Docker e Docker Compose (ou uma instância PostgreSQL própria)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o PostgreSQL fornecido pelo projeto:

   ```bash
   docker compose up -d
   ```

   O serviço publica o banco na porta `5432`, com banco `dailydiet` e credenciais locais `docker`/`docker`. Para usar outro PostgreSQL, atualize a URL no próximo passo.

3. Crie um arquivo `.env` na raiz, usando `.env.example` como referência:

   ```dotenv
   NODE_ENV=dev
   DATABASE_URL=postgresql://docker:docker@localhost:5432/dailydiet?schema=public
   JWT_SECRET=substitua-por-um-segredo-longo-e-aleatorio
   PORT=3333
   ```

   Use um segredo forte e exclusivo em ambientes que não sejam locais.

4. Gere o Prisma Client e aplique as migrações:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

## Executar

Servidor de desenvolvimento, com reinicialização automática:

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3333` (ou na porta definida por `PORT`).

Para compilar e iniciar:

```bash
npm run build
npm start
```

## Autenticação

Cadastre um usuário e faça login pela rota `POST /sessions`. A resposta fornece um JWT válido por um dia. Envie-o nas rotas de refeições no cabeçalho:

```http
Authorization: Bearer <token>
```

As rotas de refeições respondem com `401 Unauthorized` quando o token está ausente ou inválido.

## Rotas

### Usuários e sessões

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/users` | Público | Cadastra um usuário. |
| `POST` | `/sessions` | Público | Autentica e retorna um JWT. |

Exemplo de cadastro:

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "senha-com-no-minimo-6-caracteres"
}
```

Resposta (`201 Created`):

```json
{
  "userId": "uuid-do-usuario"
}
```

Exemplo de login:

```json
{
  "email": "maria@example.com",
  "password": "senha-com-no-minimo-6-caracteres"
}
```

Resposta (`200 OK`):

```json
{
  "token": "jwt"
}
```

### Refeições

Todas as rotas abaixo exigem JWT.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/meals` | Cadastra uma refeição para o usuário autenticado. |
| `GET` | `/meals` | Lista as refeições do usuário, da mais recente para a mais antiga. |
| `GET` | `/meals/:id` | Busca uma refeição do usuário pelo UUID. |
| `PUT` | `/meals/:id` | Atualiza os dados de uma refeição do usuário. |
| `DELETE` | `/meals/:id` | Exclui uma refeição do usuário. |
| `GET` | `/meals/metrics` | Retorna as métricas das refeições do usuário. |

Exemplo de cadastro ou atualização de refeição:

```json
{
  "name": "Almoço",
  "description": "Frango com salada",
  "date": "2026-10-08T12:30:00.000Z",
  "isOnDiet": true
}
```

O cadastro responde com `201 Created` e um `mealId`. A atualização e a exclusão respondem com `204 No Content`. Uma refeição que não existe ou pertence a outro usuário responde com `404 Not Found`.

Exemplo de resposta de métricas:

```json
{
  "metrics": {
    "totalMeals": 10,
    "totalMealsOnDiet": 7,
    "totalMealsOffDiet": 3,
    "bestOnDietSequence": 4
  }
}
```

As métricas incluem totais de refeições dentro e fora da dieta e a maior sequência consecutiva de refeições dentro da dieta.

## Testes

Os testes são de integração (E2E) e precisam de um PostgreSQL configurado pelas variáveis do `.env`:

```bash
npm test
```

Os testes usam e-mails fixos e não limpam os registros criados. Para execuções repetidas, use um banco de testes vazio ou limpe os dados de teste antes de rodá-los novamente.

## Estrutura principal

```text
src/
  env/          Validação das variáveis de ambiente
  lib/          Cliente Prisma
  middlewares/  Autenticação JWT
  routes/       Rotas de usuários, sessões e refeições
  app.ts        Configuração da aplicação Fastify
  server.ts     Inicialização do servidor HTTP
prisma/
  migrations/   Migrações do banco
  schema.prisma Modelos User e Meal
tests/          Testes E2E
```
