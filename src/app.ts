import fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import { env } from './env'
import { usersRoutes } from './routes/users'
import { mealsRoutes } from './routes/meals'

export const app = fastify()

app.register(fastifyCookie)

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  cookie: {
    cookieName: 'refreshToken',
    signed: false,
  },
  sign: {
    expiresIn: '1d',
  },
})

// Registro de Rotas
app.register(usersRoutes)
app.register(mealsRoutes)