import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { EnvConfig } from 'src/config/env.config';
export const MINIO_CLIENT = "MINIO_CLIENT"; 
@Global()
@Module({})
export class MinioModule {
  static forRootAsync (): DynamicModule {
    return {
      module: MinioModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: MINIO_CLIENT,
          inject: [ConfigService],
          useFactory: (config: ConfigService<EnvConfig>) => {
            return new Minio.Client({
              endPoint: config.get('minio.accessKey', { infer: true })!,
              port: config.get('minio.port', { infer: true }),
              useSSL: config.get('minio.useSSL', { infer: true }),
              accessKey: config.get('minio.accessKey', { infer: true }),
              secretKey: config.get('minio.secretKey', { infer: true }),
            })
          }
        }
      ]      
    }
  }
}
