import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from 'typeorm'
import { v4 as uuid } from "uuid";

import { app } from '../../../../app';

let connection: Connection;

describe('Authenticate User Controller', () => {
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

  it('should be able to authenticate an user', async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toEqual('user@finapi.com.br');
  })

  it('should not be able to authenticate an user with incorrect email', async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "nonexistent@finapi.com.br", password: "user" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Incorrect email or password');
  })

  it('should not be able to authenticate an user with incorrect password', async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "wrong pass" });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Incorrect email or password');
  })
})
