import { Inject, Injectable } from "@nestjs/common";
import { MINIO_CLIENT } from "../constants/minio.constant";
import * as Minio from 'minio';
@Injectable()
export class MinIOService {
  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client
  ){}
  /**
   * Để upload 1 file ta sử dụng hàm putObject, tưởng tượng object là 1 file thì cần biết nó cần trong folder(bucket) nào, đường dẫn đó đi như nào (objectPath)
   * @param bucket 
   * @param objectPath 
   * @param file 
   */
  async uploadFile(
    bucket: string,
    objectPath: string,
    file: Express.Multer.File
  ): Promise<void> {
    await this.minioClient.putObject(
      bucket, 
      objectPath,
      file.buffer,
      file.size
    )
  }

  async deleteFile(bucket: string, objectPath: string): Promise<void> {
    await this.minioClient.removeObject(bucket, objectPath);
  }
}