import { Injectable, NotFoundException } from '@nestjs/common';
import { type CreateProblemRequest } from '../schemas/requests/problem-request.schema';
import { ProblemRepository } from '../repositories/problem.repository';
import { TestcaseProducer } from 'src/modules/queue/producers/testcase.producer';
import { Like, IsNull } from 'typeorm';
import { type FindAllProblemsDto } from '../schemas/query/problem-query.schema';

@Injectable()
export class ProblemService {

  constructor(
    private readonly problemRepository: ProblemRepository,
    private readonly testcaseProducer: TestcaseProducer
  ) { }

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

  async findAll(query: FindAllProblemsDto) {
    const { page, limit, title, difficulty, probStatus, testcaseStatus, sortBy, sortOrder } = query;

    const where: any = {
      deletedAt: IsNull(),
    };

    if (title) {
      where.title = Like(`%${title}%`);
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (probStatus) {
      where.status = probStatus;
    }

    if (testcaseStatus) {
      where.testcaseStatus = testcaseStatus;
    }

    const order: any = {};
    if (sortBy) {
      order[sortBy] = sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return this.problemRepository.findWithPagination({
      page,
      limit,
      where,
      order,
    });
  }

  async findOne(id: string) {
    const problem = await this.problemRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!problem) {
      throw new NotFoundException(`Problem with ID ${id} not found`);
    }
    return problem;
  }

  async remove(id: string) {
    const problem = await this.findOne(id);
    await this.problemRepository.softDelete(id);
    return problem;
  }
}
