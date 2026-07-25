import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseTransformerInterceptor } from './common/interceptors/suf/response-transforer.interceptor';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EnvConfig } from './config/env.config';
import { TESTCASE_QUEUE } from './modules/queue/constants/queue.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvConfig>);
  const PORT = `${process.env.PORT}`;

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(
    new ResponseTransformerInterceptor(app.get(Reflector)),
  );

  // Gắn microservice RMQ vào CÙNG process (hybrid app):
  // các @EventPattern trong WorkerModule sẽ tiêu thụ message từ queue này.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`${config.get('rabbitmq.url', { infer: true })}`],
      queue: TESTCASE_QUEUE,
      queueOptions: { durable: true },
      noAck: true,
      prefetchCount: 1,
    },
  });

  await app.startAllMicroservices();
  await app.listen(PORT);
}
bootstrap();
