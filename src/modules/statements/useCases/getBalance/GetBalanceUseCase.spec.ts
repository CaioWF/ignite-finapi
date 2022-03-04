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
  TRANSFER = 'transfer'
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

    const userToReceive = await usersRepositoryInMemory.create({
      name: 'Test Get Balance Transfer',
      email: 'test@get.balance.transfer',
      password: 'test'
    });

    await statementsRepositoryInMemory.create({
      user_id: user.id, type: OperationType.DEPOSIT, amount: 20.5, description: 'deposit', sender_id: null
    })

    await statementsRepositoryInMemory.create({
      user_id: user.id, type: OperationType.WITHDRAW, amount: 9, description: 'withdraw', sender_id: null
    })

    await statementsRepositoryInMemory.create({
      user_id: user.id, type: OperationType.TRANSFER, amount: 9, description: 'transfer', sender_id: user.id
    })

    const userBalance = await getBalanceUseCase.execute({ user_id: user.id })

    expect(userBalance).toHaveProperty('statement');
    expect(userBalance).toHaveProperty('balance');
    expect(userBalance.statement.length).toEqual(3);
    expect(userBalance.balance).toEqual(2.5);

    await statementsRepositoryInMemory.create({
      user_id: userToReceive.id, type: OperationType.TRANSFER, amount: 9, description: 'transfer', sender_id: user.id
    })

    const userReceiveBalance = await getBalanceUseCase.execute({ user_id: userToReceive.id })

    expect(userReceiveBalance).toHaveProperty('statement');
    expect(userReceiveBalance).toHaveProperty('balance');
    expect(userReceiveBalance.statement.length).toEqual(1);
    expect(userReceiveBalance.balance).toEqual(9);
  })

  it('should not be able to get a balance when user nonexists', async () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: 'nonexistent'
      })
    }).rejects.toBeInstanceOf(GetBalanceError)
  })
})
