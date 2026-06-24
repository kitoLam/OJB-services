import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvConfig, envConfig } from './config/env.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemModule } from './modules/problem/problem.module';
import { TestcaseModule } from './modules/testcase/testcase.module';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { HeaderInfoGuard } from './common/guards/header-info.guard';
import { ZodValidationPipe } from './common/pipes/validation';
import { MinioModule } from './common/modules/minio/minio.module';
import { QueueModule } from './modules/queue/queue.module';
import { WorkerModule } from './modules/worker/worker.module';
// nếu gõ ở terminal `npm run start:dev` -> lấy cái env ta cấu hình ở script (development)
const ENV = process.env.NODE_ENV;
@Module({
  imports: [
    // setup 1 lần với forRoot
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [envConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig>) => ({
        type: 'mysql',
        host: configService.get('db.host', { infer: true }),
        password: configService.get('db.password', { infer: true }),
        port: configService.get('db.port', { infer: true }),
        username: configService.get('db.username', { infer: true }),
        database: configService.get('db.databaseName', { infer: true }),
        synchronize: false,
        entities: [],
      }),
    }),
    ProblemModule,
    TestcaseModule,
    MinioModule.forRootAsync(),
    QueueModule,   // producer (publish job) — @Global nên dùng được ở ProblemService
    WorkerModule,  // consumer (worker) — chạy chung process qua connectMicroservice
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: HeaderInfoGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
