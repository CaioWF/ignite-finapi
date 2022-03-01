import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

@injectable()
export class CreateStatementUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ user_id, type, amount, description, sender_id }: ICreateStatementDTO) {
    const user = await this.usersRepository.findById(user_id);
    const senderUser = await this.usersRepository.findById(sender_id);


    if(!user || (sender_id && !senderUser)) {
      throw new CreateStatementError.UserNotFound();
    }

    if(['withdraw', 'transfer'].includes(type)) {
      const { balance } = await this.statementsRepository.getUserBalance({ user_id });

      if (balance < amount) {
        throw new CreateStatementError.InsufficientFunds()
      }
    }

    const statementOperation = await this.statementsRepository.create({
      user_id,
      type,
      amount,
      description,
      sender_id
    });

    if(type === 'transfer') {
      const senderStatementOperation = await this.statementsRepository.create({
        user_id: sender_id,
        type,
        amount,
        description,
        sender_id
      });

      return senderStatementOperation
    }


    return statementOperation;
  }
}
