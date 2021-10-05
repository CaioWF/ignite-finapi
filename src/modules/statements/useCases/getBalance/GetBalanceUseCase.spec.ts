import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let usersRepositoryInMemory: IUsersRepository;
let statementsRepositoryInMemory: IStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe("Get Balance Use Case", () => {
  beforeEach(() => {
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    usersRepositoryInMemory = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(statementsRepositoryInMemory, usersRepositoryInMemory)
  })

  it('should be able to get a balance', async () => {
    const user = await usersRepositoryInMemory.create({
      name: 'Test Get Balance',
      email: 'test@get.balance',
      password: 'test'
    });

    await statementsRepositoryInMemory.create({
      user_id: user.id, type: OperationType.DEPOSIT, amount: 10.5, description: 'deposit'
    })

    await statementsRepositoryInMemory.create({
      user_id: user.id, type: OperationType.WITHDRAW, amount: 9, description: 'withdraw'
    })

    const userBalance = await getBalanceUseCase.execute({ user_id: user.id })

    expect(userBalance).toHaveProperty('statement');
    expect(userBalance).toHaveProperty('balance');
    expect(userBalance.statement.length).toEqual(2);
    expect(userBalance.balance).toEqual(1.5);
  })

  it('should not be able to get a balance when user nonexists', async () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: 'nonexistent'
      })
    }).rejects.toBeInstanceOf(GetBalanceError)
  })
})
