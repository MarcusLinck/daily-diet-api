import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { checkJwt } from '../middlewares/check-jwt'

export async function mealsRoutes(app: FastifyInstance) {
  // Exige JWT em todas as rotas deste plugin
  app.addHook('onRequest', checkJwt)

  // 1. Cadastrar uma refeição
  app.post('/meals', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      isOnDiet: z.boolean(),
    })

    const { name, description, date, isOnDiet } = createMealBodySchema.parse(request.body)
    const userId = request.user.sub

    const meal = await prisma.meal.create({
      data: {
        name,
        description,
        date,
        is_on_diet: isOnDiet,
        user_id: userId,
      },
    })

    return reply.status(201).send({ mealId: meal.id })
  })

  // 2. Listar todas as refeições do usuário logado
  app.get('/meals', async (request, reply) => {
    const userId = request.user.sub

    const meals = await prisma.meal.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return reply.send({ meals })
  })

  // 3. Visualizar uma única refeição
  app.get('/meals/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)
    const userId = request.user.sub

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        user_id: userId,
      },
    })

    if (!meal) {
      return reply.status(404).send({ message: 'Refeição não encontrada.' })
    }

    return reply.send({ meal })
  })

  // 4. Editar uma refeição
  app.put('/meals/:id', async (request, reply) => {
    const updateMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const updateMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      isOnDiet: z.boolean(),
    })

    const { id } = updateMealParamsSchema.parse(request.params)
    const { name, description, date, isOnDiet } = updateMealBodySchema.parse(request.body)
    const userId = request.user.sub

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        user_id: userId,
      },
    })

    if (!meal) {
      return reply.status(404).send({ message: 'Refeição não encontrada.' })
    }

    await prisma.meal.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        date,
        is_on_diet: isOnDiet,
      },
    })

    return reply.status(204).send()
  })

  // 5. Apagar uma refeição
  app.delete('/meals/:id', async (request, reply) => {
    const deleteMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = deleteMealParamsSchema.parse(request.params)
    const userId = request.user.sub

    const meal = await prisma.meal.findFirst({
      where: {
        id,
        user_id: userId,
      },
    })

    if (!meal) {
      return reply.status(404).send({ message: 'Refeição não encontrada.' })
    }

    await prisma.meal.delete({
      where: {
        id,
      },
    })

    return reply.status(204).send()
  })

  // 6. Métricas do Usuário
  app.get('/meals/metrics', async (request, reply) => {
    const userId = request.user.sub

    const totalMeals = await prisma.meal.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        date: 'asc',
      },
    })

    const totalMealsOnDiet = totalMeals.filter((meal) => meal.is_on_diet).length
    const totalMealsOffDiet = totalMeals.length - totalMealsOnDiet

    // Algoritmo para calcular a melhor sequência de refeições dentro da dieta (Streak)
    const { bestOnDietSequence } = totalMeals.reduce(
      (acc, meal) => {
        if (meal.is_on_diet) {
          acc.currentSequence += 1
        } else {
          acc.currentSequence = 0
        }

        if (acc.currentSequence > acc.bestOnDietSequence) {
          acc.bestOnDietSequence = acc.currentSequence
        }

        return acc
      },
      { bestOnDietSequence: 0, currentSequence: 0 },
    )

    return reply.send({
      metrics: {
        totalMeals: totalMeals.length,
        totalMealsOnDiet,
        totalMealsOffDiet,
        bestOnDietSequence,
      },
    })
  })
}