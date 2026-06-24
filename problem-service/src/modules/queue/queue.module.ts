import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EnvConfig } from 'src/config/env.config';
import { TESTCASE_CLIENT, TESTCASE_UPLOAD_QUEUE } from './constants/queue.constants';
import { TestcaseProducer } from './producers/testcase.producer';

// @Global: producer (TestcaseProducer) inject được ở mọi module mà không phải import lại
@Global()
@Module({
  imports: [
    // Ở đây do là đóng vai client request đến server => mặc dù ở main đã đăng kí nhưng đó là dưới vai trò server, ở đây đăng kí dưới vai trò là 1 client
    ClientsModule.registerAsync([
      {
        name: TESTCASE_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService<EnvConfig>) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get('rabbitmq.url', { infer: true })!],
            queue: TESTCASE_UPLOAD_QUEUE,
            queueOptions: {
              durable: true, // queue sống sót khi RabbitMQ restart
            },
            persistent: true, // message được ghi xuống đĩa
          },
        }),
      },
    ]),
  ],
  providers: [TestcaseProducer],
  exports: [TestcaseProducer],
})
export class QueueModule {}
