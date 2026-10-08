import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

describe('Meals Routes (E2E)', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to create, list and retrieve metrics for meals', async () => {
    // 1. Criar usuário e autenticar
    await request(app.server).post('/users').send({
      name: 'Diet User',
      email: 'diet@example.com',
      password: 'password123',
    })

    const authResponse = await request(app.server).post('/sessions').send({
      email: 'diet@example.com',
      password: 'password123',
    })

    const { token } = authResponse.body

    // 2. Criar uma refeição
    const mealResponse = await request(app.server)
      .post('/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Almoço Saudável',
        description: 'Frango com salada',
        date: new Date(),
        isOnDiet: true,
      })

    expect(mealResponse.statusCode).toEqual(201)

    // 3. Listar refeições
    const listResponse = await request(app.server)
      .get('/meals')
      .set('Authorization', `Bearer ${token}`)

    expect(listResponse.statusCode).toEqual(200)
    expect(listResponse.body.meals).toHaveLength(1)

    // 4. Buscar métricas
    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Authorization', `Bearer ${token}`)

    expect(metricsResponse.statusCode).toEqual(200)
    expect(metricsResponse.body.metrics).toEqual({
      totalMeals: 1,
      totalMealsOnDiet: 1,
      totalMealsOffDiet: 0,
      bestOnDietSequence: 1,
    })
  })
})