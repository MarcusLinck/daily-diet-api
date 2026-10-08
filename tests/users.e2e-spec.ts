import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

describe('Users Routes (E2E)', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to register a new user', async () => {
    const response = await request(app.server).post('/users').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    expect(response.statusCode).toEqual(201)
    expect(response.body).toHaveProperty('userId')
  })

  it('should be able to authenticate an existing user', async () => {
    await request(app.server).post('/users').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    })

    const response = await request(app.server).post('/sessions').send({
      email: 'jane@example.com',
      password: 'password123',
    })

    expect(response.statusCode).toEqual(200)
    expect(response.body).toHaveProperty('token')
  })
})