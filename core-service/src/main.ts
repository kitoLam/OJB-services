import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EnvConfig } from './config/env.config';
import { TESTCASE_QUEUE } from './modules/queue/constants/queue.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig>);
  const PORT = `${process.env.PORT}`;

  app.useGlobalPipes(new ValidationPipe());


  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.get('rabbitmq.url', { infer: true })!],
      queue: TESTCASE_QUEUE,
      queueOptions: { durable: true },
      noAck: true,
      prefetchCount: 1,   // mỗi lần worker ôm 1 job, tránh quá tải
    },
  });

  await app.startAllMicroservices();
  await app.listen(PORT);
}
bootstrap();
