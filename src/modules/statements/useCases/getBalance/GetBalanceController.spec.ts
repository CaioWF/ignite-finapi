import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from 'typeorm'
import { v4 as uuid } from "uuid";

import { app } from '../../../../app';

let connection: Connection;

describe('Get Balance Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuid();
    const password = await hash("user", 8);

    await connection.query(
      `
        INSERT INTO users (id, name, email, password, created_at, updated_at)
         VALUES ('${id}', 'user', 'user@finapi.com.br', '${password}', 'now()', 'now()')
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to get a balance', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    await request(app).post('/api/v1/statements/deposit')
      .send({ amount: 10.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    await request(app).post('/api/v1/statements/withdraw')
      .send({ amount: 9.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    const response = await request(app).get('/api/v1/statements/balance')
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance');
    expect(response.body).toHaveProperty('statement');
    expect(response.body.balance).toEqual(1);
    expect(response.body.statement.length).toEqual(2);
  })

  it('should not be able to get a balance when user nonexists', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    await request(app).post('/api/v1/statements/deposit')
      .send({ amount: 10.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    await request(app).post('/api/v1/statements/withdraw')
      .send({ amount: 9.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    await connection.query(
      `
        DELETE FROM users WHERE email = 'user@finapi.com.br'
      `
    )

    const response = await request(app).get('/api/v1/statements/balance')
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('User not found');
  })
})
