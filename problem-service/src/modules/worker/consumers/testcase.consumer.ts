import { Controller} from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { TESTCASE_UPLOAD_PATTERN } from 'src/modules/queue/constants/queue.constants';
import { TestcaseService } from 'src/modules/testcase/services/testcase.service';

// @Controller (không route HTTP) — NestJS microservice discover @EventPattern ở đây
@Controller()
export class TestcaseConsumer {

  constructor(private readonly testcaseService: TestcaseService) {}

  @EventPattern(TESTCASE_UPLOAD_PATTERN)
  async handleUpload(
    @Payload() msg: any,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    // noAck=false ở main.ts -> phải tự ack/nack qua channel
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    console.log(`msg::${msg}`);
    console.log(`originMsg::${originalMsg}`);
    const fakeProblemId = 'esdf07835-1sdf';
    await this.testcaseService.uploadTestcases(fakeProblemId, originalMsg as any);
    try {
      channel.ack(originalMsg);
    } catch (err) {
      // requeue=false -> message bị loại (vào DLQ nếu queue có cấu hình dead-letter)
      channel.nack(originalMsg, false, false);
    }
  }

}
