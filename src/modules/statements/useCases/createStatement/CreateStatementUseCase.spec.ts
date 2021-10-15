import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let usersRepositoryInMemory: IUsersRepository;
let statementsRepositoryInMemory: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Create Statement Use Case', () => {
  beforeEach(() => {
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createStatementUseCase = new CreateStatementUseCase(usersRepositoryInMemory, statementsRepositoryInMemory)
  })

  it('should be able to create a new deposit statement', async () => {
    const user = await usersRepositoryInMemory.create({
      name: 'Test Create Statement DEPOSIT',
      email: 'test@create.statement.deposit',
      password: 'test'
    });

    const statement = await createStatementUseCase.execute({
      user_id: user.id, type: OperationType.DEPOSIT, amount: 10.5, description: 'deposit'
    })

    expect(statement).toHaveProperty('id');
    expect(statement.type).toEqual(OperationType.DEPOSIT);
    expect(statement.amount).toEqual(10.5);
    expect(statement.description).toEqual('deposit');
  })

  it('should be able to create a new withdraw statement', async () => {
    const user = await usersRepositoryInMemory.create({
      name: 'Test Create Statement WITHDRAW',
      email: 'test@create.statement.withdraw',
      password: 'test'
    });

    await createStatementUseCase.execute({
      user_id: user.id, type: OperationType.DEPOSIT, amount: 10.5, description: 'deposit'
    })

    const statement = await createStatementUseCase.execute({
      user_id: user.id, type: OperationType.WITHDRAW, amount: 9.5, description: 'withdraw'
    })

    expect(statement).toHaveProperty('id');
    expect(statement.type).toEqual(OperationType.WITHDRAW);
    expect(statement.amount).toEqual(9.5);
    expect(statement.description).toEqual('withdraw');
  })

  it('should not be able to create a new statement when user nonexists', async () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: 'nonexistent', type: OperationType.DEPOSIT, amount: 10.5, description: 'deposit'
      })
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
  })

  it('should not be able to create a new statement when user does not have funds', async () => {
    expect(async () => {
      const user = await usersRepositoryInMemory.create({
        name: 'No Funds',
        email: 'test@no.funds',
        password: 'test'
      });

      await createStatementUseCase.execute({
        user_id: user.id, type: OperationType.WITHDRAW, amount: 9.5, description: 'withdraw'
      })
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
  })
})
