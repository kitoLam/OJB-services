import { Module } from '@nestjs/common';
import { TestcaseConsumer } from './consumers/testcase.consumer';
import { TestcaseModule } from '../testcase/testcase.module';

// Gom toàn bộ consumers (worker) của service vào đây.
// Thêm consumer mới: khai báo class @EventPattern rồi đăng ký vào controllers.
@Module({
  imports: [TestcaseModule],
  controllers: [TestcaseConsumer],
  providers: [],
})
export class WorkerModule {}
