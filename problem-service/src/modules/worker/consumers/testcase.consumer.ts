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
    // @Payload() đã tự decode Buffer → objec
    @Payload() msg: TestcaseUploadRequestedMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    // noAck=false ở main.ts -> phải tự ack/nack qua channel
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.testcaseService.uploadTestcases(msg.problemId, msg.files, msg.isSample);
      channel.ack(originalMsg);
    } catch (err) {
      console.log(err)
      // requeue=false -> message bị loại (vào DLQ nếu queue có cấu hình dead-letter)
      channel.nack(originalMsg, false, false);
      console.log('fail job');
    }
  }
}
