import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TEST_CASE_BUCKET } from 'src/common/constants/minio-bucket-name';
import { MinIOService } from 'src/common/modules/minio/services/minio.service';

@Injectable()
export class TestcaseService {
  constructor(private readonly minioService: MinIOService) {}
  async uploadTestcases(problemId: string, files: Express.Multer.File[]) {
    const uploaded: string[] = [];
    const failed: string[] = [];
    // upload 10 file 1 lượt
    const CONCURRENCY = 10;

    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY);

      await Promise.all(
        batch.map(async (file) => {
          const objectName = `problem-${problemId}/${file.originalname}`;
          try {
            await this.minioService.uploadFile(
              TEST_CASE_BUCKET,
              objectName,
              file,
            );
            uploaded.push(file.originalname);
          } catch {
            failed.push(file.originalname);
          }
        }),
      );
    }

    if (failed.length > 0) {
      throw new InternalServerErrorException(
        `Upload thất bại: ${failed.join(', ')}`,
      );
    }
  }
}
