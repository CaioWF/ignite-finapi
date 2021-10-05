import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase"

let usersRepositoryInMemory: IUsersRepository
let createUserUseCase: CreateUserUseCase;

describe("Create User Use Case", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
  })

  it('should be able to create a new user', async () => {
    const user = await createUserUseCase.execute({
      name: 'test', email: 'test@test.com', password: 'test'
    });

    expect(user).toHaveProperty('id');
    expect(user.name).toEqual('test');
    expect(user.email).toEqual('test@test.com');
    expect(user.password).toBeDefined();
  })

  it('should not be able to create a new user when email already registered', async () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: 'test', email: 'duplicated@test.com', password: 'test'
      });

      await createUserUseCase.execute({
        name: 'test', email: 'duplicated@test.com', password: 'test'
      });
    }).rejects.toBeInstanceOf(CreateUserError)
  })
})
