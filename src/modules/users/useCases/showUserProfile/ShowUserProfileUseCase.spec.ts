import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase"

let usersRepositoryInMemory: IUsersRepository;
let createUserUseCase: CreateUserUseCase
let showUserProfileUseCase: ShowUserProfileUseCase;

describe('Show User Profile Use Case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepositoryInMemory)
  })

  it('should be able to show a user profile', async () => {
    const userData: ICreateUserDTO = {
      name: 'auth user', email: 'auth@auth.com', password: 'auth'
    }

    const user = await createUserUseCase.execute(userData);

    const userProfile = await showUserProfileUseCase.execute(user.id)

    expect(userProfile).toHaveProperty('id')
    expect(userProfile.id).toEqual(user.id)
    expect(userProfile.email).toEqual(user.email)
    expect(userProfile.name).toEqual(user.name)
  })

  it('should not be able to show a user profile with nonexistent user', async () => {
    expect(async () => {
      await showUserProfileUseCase.execute('nonexistent user')
    }).rejects.toBeInstanceOf(ShowUserProfileError)
  })
})
