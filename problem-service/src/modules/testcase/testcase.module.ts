import { Module } from '@nestjs/common';
import { TestcaseService } from './services/testcase.service';
import { TestcaseController } from './testcase.controller';

@Module({
  imports: [],
  controllers: [TestcaseController],
  providers: [TestcaseService],
})
export class TestcaseModule {}
