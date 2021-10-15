import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from 'typeorm'
import { v4 as uuid } from "uuid";

import { app } from '../../../../app';

let connection: Connection;

describe('Show User Profile Controller', () => {
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

  it('should be able to show a user profile', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const response = await request(app).get('/api/v1/profile')
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.email).toEqual('user@finapi.com.br');
    expect(response.body.name).toEqual('user');
  })

  it('should not be able to show a user profile', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    await connection.query(
      `
        DELETE FROM users WHERE email = 'user@finapi.com.br'
      `
    )

    const response = await request(app).get('/api/v1/profile')
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('User not found');
  })
})
