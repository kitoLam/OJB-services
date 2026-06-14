import { Injectable } from '@nestjs/common';
import { type CreateProblemRequest } from '../schemas/requests/problem';
import { ProblemRepository } from '../repositories/problem.repository';

@Injectable()
export class ProblemService {
  
  constructor(
    readonly problemRepository: ProblemRepository,
  ) {}

  create(createProblemDto: CreateProblemRequest) {
    
    return 'This action adds a new problem';
  }

  findAll() {
    return `This action returns all problem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} problem`;
  }

  remove(id: number) {
    return `This action removes a #${id} problem`;
  }
}
