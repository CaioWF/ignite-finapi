import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from 'typeorm'
import { v4 as uuid } from "uuid";

import { app } from '../../../../app';

let connection: Connection;

describe('Get Statement Operation Controller', () => {
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

  it('should be able to get statement operation', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const { body: { id } } = await request(app).post('/api/v1/statements/deposit')
      .send({ amount: 10.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    const response = await request(app).get(`/api/v1/statements/${id}`)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.description).toEqual('deposit');
    expect(response.body.amount).toEqual('10.50');
    expect(response.body.type).toEqual('deposit');
  })

  it('should not be able to get a statement operation when statement nonexists', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const response = await request(app).get(`/api/v1/statements/${uuid()}`)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Statement not found');
  })

  it('should not be able to get a statement operation when user nonexists', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const { body: { id } } = await request(app).post('/api/v1/statements/deposit')
      .send({ amount: 10.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    await connection.query(
      `
        DELETE FROM users WHERE email = 'user@finapi.com.br'
      `
    )

    const response = await request(app).get(`/api/v1/statements/${id}`)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('User not found');
  })
})
