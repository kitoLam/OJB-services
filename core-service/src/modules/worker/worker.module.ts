import { Module } from '@nestjs/common';
import { TestcaseConsumer } from './consumers/testcase.consumer';
import { TestcaseModule } from '../testcase/testcase.module';

@Module({
  imports: [TestcaseModule],
  controllers: [TestcaseConsumer],
  providers: [],
})
export class WorkerModule {}
