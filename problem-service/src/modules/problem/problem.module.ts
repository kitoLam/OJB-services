import { Module } from '@nestjs/common';
import { ProblemService } from './services/problem.service'; 
import { ProblemController } from './problem.controller';
import { ProblemRepository } from './repositories/problem.repository';

@Module({
  controllers: [ProblemController],
  providers: [ProblemService, ProblemRepository],
})
export class ProblemModule {}
