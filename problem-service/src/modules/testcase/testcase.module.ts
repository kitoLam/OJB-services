import { Module } from '@nestjs/common';
import { TestcaseService } from './services/testcase.service';
import { TestcaseController } from './testcase.controller';
import { TestcaseRepository } from './repositories/testcase.repository';

@Module({
  imports: [],
  controllers: [TestcaseController],
  providers: [TestcaseService, TestcaseRepository],
  exports: [TestcaseService]
})
export class TestcaseModule {}
