import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { hash, compare } from 'bcryptjs'
import { prisma } from '../lib/prisma'

export async function usersRoutes(app: FastifyInstance) {
  // Cadastro de Usuário
  app.post('/users', async (request, reply) => {
    const registerBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
    })

    const { name, email, password } = registerBodySchema.parse(request.body)

    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (userWithSameEmail) {
      return reply.status(409).send({ message: 'E-mail já cadastrado.' })
    }

    const password_hash = await hash(password, 6)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
      },
    })

    return reply.status(201).send({ userId: user.id })
  })

  // Autenticação (Login)
  app.post('/sessions', async (request, reply) => {
    const authenticateBodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const { email, password } = authenticateBodySchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return reply.status(400).send({ message: 'Credenciais inválidas.' })
    }

    const doesPasswordMatch = await compare(password, user.password_hash)

    if (!doesPasswordMatch) {
      return reply.status(400).send({ message: 'Credenciais inválidas.' })
    }

    // Geração do JWT
    const token = await reply.jwtSign(
      {},
      {
        sign: {
          sub: user.id,
        },
      },
    )

    return reply.status(200).send({ token })
  })
}