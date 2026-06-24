import { Controller} from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { TESTCASE_UPLOAD_PATTERN } from 'src/modules/queue/constants/queue.constants';

// @Controller (không route HTTP) — NestJS microservice discover @EventPattern ở đây
@Controller()
export class TestcaseConsumer {
  @EventPattern(TESTCASE_UPLOAD_PATTERN)
  async handleUpload(
    @Payload() msg: any,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    // noAck=false ở main.ts -> phải tự ack/nack qua channel
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      channel.ack(originalMsg);
    } catch (err) {
      // requeue=false -> message bị loại (vào DLQ nếu queue có cấu hình dead-letter)
      channel.nack(originalMsg, false, false);
    }
  }

}
