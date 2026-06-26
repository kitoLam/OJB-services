import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { EnvConfig } from 'src/config/env.config';
import { MinIOService } from './services/minio.service';
export const MINIO_CLIENT = "MINIO_CLIENT"; 
@Global()
@Module({})
export class MinIOModule {
  static forRootAsync (): DynamicModule {
    return {
      module: MinIOModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: MINIO_CLIENT,
          inject: [ConfigService],
          useFactory: (config: ConfigService<EnvConfig>) => {
            return new Minio.Client({
              endPoint: config.get('minio.endPoint', { infer: true })!,
              port: config.get('minio.port', { infer: true }),
              useSSL: config.get('minio.useSSL', { infer: true }),
              accessKey: config.get('minio.accessKey', { infer: true }),
              secretKey: config.get('minio.secretKey', { infer: true }),
            })
          }
        },
        MinIOService
      ],
      exports: [MinIOService]
    }
  }
}
