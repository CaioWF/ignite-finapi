import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";


let usersRepositoryInMemory: IUsersRepository
let createUserUseCase: CreateUserUseCase
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Authenticate User Use Case", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory)
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
  });

  it('should be able to authenticate an user', async () => {
    const user: ICreateUserDTO = {
      name: 'auth user', email: 'auth@auth.com', password: 'auth'
    }

    await createUserUseCase.execute(user);

    const session = await authenticateUserUseCase.execute({
      email: 'auth@auth.com', password: 'auth'
    });

    expect(session).toHaveProperty('user');
    expect(session).toHaveProperty('token');
    expect(session.user.email).toEqual(user.email);
  })

  it('should not be able to authenticate an user with incorrect email', async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: 'incorrectmail@auth.com', password: 'auth'
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })

  it('should not be able to authenticate an user with incorrect password', async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: 'auth user', email: 'correctmail@auth.com', password: 'auth'
      }

      await createUserUseCase.execute(user);

      await authenticateUserUseCase.execute({
        email: 'correctmail@auth.com', password: 'wrong password'
      });
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
  })

})
