import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from 'typeorm'
import { v4 as uuid } from "uuid";

import { app } from '../../../../app';

let connection: Connection;
let idReceiver: string;

describe('Create Statement Controller', () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuid();
    idReceiver = uuid();

    const password = await hash("user", 8);

    await connection.query(
      `
        INSERT INTO users (id, name, email, password, created_at, updated_at)
         VALUES ('${id}', 'user', 'user@finapi.com.br', '${password}', 'now()', 'now()'),
         ('${idReceiver}', 'user2', 'user2@finapi.com.br', '${password}', 'now()', 'now()')
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it('should be able to create a new deposit statement', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const response = await request(app).post('/api/v1/statements/deposit')
      .send({ amount: 22.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).not.toHaveProperty('sender_id');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.description).toEqual('deposit');
    expect(response.body.amount).toEqual(22.5);
    expect(response.body.type).toEqual('deposit');
  })

  it('should be able to create a new withdraw statement', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const response = await request(app).post('/api/v1/statements/withdraw')
      .send({ amount: 10.5, description: 'withdraw' })
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).not.toHaveProperty('sender_id');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.description).toEqual('withdraw');
    expect(response.body.amount).toEqual(10.5);
    expect(response.body.type).toEqual('withdraw');
  })

  it('should be able to create a new transfer statement', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const response = await request(app).post(`/api/v1/statements/transfer/${idReceiver}`)
      .send({ amount: 10.5, description: 'transfer' })
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('sender_id');
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('updated_at');
    expect(response.body.description).toEqual('transfer');
    expect(response.body.sender_id).toEqual(response.body.user_id);
    expect(response.body.amount).toEqual(10.5);
    expect(response.body.type).toEqual('transfer');
  })

  it('should not be able to create a new statement when user does not have funds', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    const response = await request(app).post('/api/v1/statements/withdraw')
      .send({ amount: 90.5, description: 'withdraw' })
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Insufficient funds');
  })

  it('should not be able to create a new statement when user nonexists', async () => {
    const { body: { token } } = await request(app)
      .post("/api/v1/sessions")
      .send({ email: "user@finapi.com.br", password: "user" });

    await connection.query(
      `
        DELETE FROM users WHERE email = 'user@finapi.com.br'
      `
    )

    const response = await request(app).post('/api/v1/statements/deposit')
      .send({ amount: 10.5, description: 'deposit' })
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('User not found');
  })
})
