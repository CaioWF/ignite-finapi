import { InMemoryStatementsRepository } from "@modules/statements/repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "@modules/statements/repositories/IStatementsRepository";
import { InMemoryUsersRepository } from "@modules/users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let usersRepositoryInMemory: IUsersRepository;
let statementsRepositoryInMemory: IStatementsRepository;
let getStatementOperationUseCase: GetStatementOperationUseCase

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
}

describe('Get Statement Operation Use Case', () => {
  beforeEach(() => {
    statementsRepositoryInMemory = new InMemoryStatementsRepository();
    usersRepositoryInMemory = new InMemoryUsersRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(usersRepositoryInMemory, statementsRepositoryInMemory)
  })

  it('should be able to get a statement operation', async () => {
    const user = await usersRepositoryInMemory.create({
      name: 'Test Get Operation',
      email: 'test@get.operation',
      password: 'test'
    });

    const statement = await statementsRepositoryInMemory.create({
      user_id: user.id, type: OperationType.DEPOSIT, amount: 10.5, description: 'deposit', sender_id: null
    })

    const statementOperation = await getStatementOperationUseCase.execute({ user_id: user.id, statement_id: statement.id })

    expect(statementOperation.id).toEqual(statement.id);
    expect(statementOperation.user_id).toEqual(user.id);
    expect(statementOperation.type).toEqual(OperationType.DEPOSIT);
    expect(statementOperation.amount).toEqual(10.5);
    expect(statementOperation.description).toEqual('deposit');
  })

  it('should not be able to get a statement operation when statement nonexists', async () => {
    expect(async () => {
      const user = await usersRepositoryInMemory.create({
        name: 'Test Get Operation Error',
        email: 'test@get.operation.error',
        password: 'test'
      });

      await getStatementOperationUseCase.execute({ user_id: user.id, statement_id: 'nonexistent' })
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)
  })
})
