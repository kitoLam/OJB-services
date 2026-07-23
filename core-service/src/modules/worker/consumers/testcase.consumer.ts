import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { TESTCASE_UPLOAD_PATTERN } from 'src/modules/queue/constants/queue.constants';
import type { TestcaseUploadRequestedMessage } from 'src/modules/queue/contracts/testcase-upload.message';
import { TestcaseService } from 'src/modules/testcase/services/testcase.service';

// @Controller (không route HTTP) — NestJS microservice discover @EventPattern ở đây
@Controller()
export class TestcaseConsumer {
  constructor(private readonly testcaseService: TestcaseService) {}

  @EventPattern(TESTCASE_UPLOAD_PATTERN)
  async handleUpload(
    @Payload() msg: TestcaseUploadRequestedMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.testcaseService.uploadTestcases(msg.problemId, msg.files);
  }
}
