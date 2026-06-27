import { Injectable } from '@nestjs/common';
import { type CreateProblemRequest } from '../schemas/requests/problem-request.schema';
import { ProblemRepository } from '../repositories/problem.repository';
import { TestcaseProducer } from 'src/modules/queue/producers/testcase.producer';

@Injectable()
export class ProblemService {
  
  constructor(
    private readonly problemRepository: ProblemRepository,
    private readonly testcaseProducer: TestcaseProducer
  ) {}

  async create(createProblemDto: CreateProblemRequest, testedFiles: MulterFile[]) {
    const createdProblem = await this.problemRepository.save({
      ...createProblemDto,
      totalTestcase: testedFiles.length,
    });
    await this.testcaseProducer.requestUpload({
      files: testedFiles,
      problemId: createdProblem.id
    });
    return createdProblem;
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
