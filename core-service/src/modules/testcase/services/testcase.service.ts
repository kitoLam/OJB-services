import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { TEST_CASE_BUCKET } from 'src/common/modules/minio/constants/minio.constant';
import { MinIOService } from 'src/common/modules/minio/services/minio.service';
import { TestcaseRepository } from '../repositories/testcase.repository';
import type { FileUpload } from 'src/modules/queue/contracts/testcase-upload.message';
import { ProblemRepository } from 'src/modules/problem/repositories/problem.repository';
import { ProblemStatus, TestcaseStatus } from 'src/modules/problem/entities/problem.entity';

@Injectable()
export class TestcaseService {
  constructor(
    private readonly minioService: MinIOService,
    private readonly testcaseRepo: TestcaseRepository,
    private readonly problemRepo: ProblemRepository
  ) {}

  async cleanRedundantTestcase(problemId: string) {}

  async uploadTestcases(
    problemId: string,
    files: FileUpload[]
  ) {
    await this.problemRepo.update({
      id: problemId
    }, {
      testcaseStatus: TestcaseStatus.PROCESSING
    })
    const uploaded: {
      filePath: string;
      filename: string;
    }[] = [];
    const failed: string[] = [];
    const inputMap: Map<
      string,
      {
        objectPath: string;
        size: number;
      }
    > = new Map();
    const outputMap: Map<
      string,
      {
        objectPath: string;
        size: number;
      }
    > = new Map();
    const keySet: Set<string> = new Set();
    const CONCURRENCY = 10;
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, Math.min(i + CONCURRENCY, files.length));
      await Promise.all(
        batch.map(async (file) => {
          console.log(file);
          const objectName = `problem-${problemId}/${file.originalname}`;
          try {
            await this.minioService.uploadFile(TEST_CASE_BUCKET, objectName, {
              ...file,
              buffer: Buffer.isBuffer(file.buffer)
                ? file.buffer
                : Buffer.from((file.buffer as any).data),
            });
            uploaded.push({
              filePath: objectName,
              filename: file.originalname,
            });
            const [pre, suf] = file.originalname.split('-');
            if (pre == 'input') {
              inputMap.set(suf, {
                objectPath: objectName,
                size: file.size,
              });
            } else {
              outputMap.set(suf, {
                objectPath: objectName,
                size: file.size,
              });
            }
            keySet.add(suf);
          } catch (e) {
            failed.push(objectName);
          }
        }),
      );
    }

    if (failed.length > 0) {
      // TODO: clean all uploaded file
      
      // Cập nhật lại problemId đó sẽ có status là FAIL
      await this.problemRepo.update({
        id: problemId,
      }, {
        testcaseStatus: TestcaseStatus.FAILED
      });
      throw new InternalServerErrorException(
        `Upload thất bại: ${failed.join(', ')}`,
      );
    }
    // TODO: save all uploaded file to db by pair input-output
    let currentOrderIdx = 0;
    for (const item of keySet) {
      const input = inputMap.get(item);
      const output = outputMap.get(item);
      const testcase = {
        problemId: problemId,
        orderIndex: ++currentOrderIdx,
        inputObjectPath: input?.objectPath,
        outputObjectPath: output?.objectPath,
        inputSizeBytes: input?.size,
        outputSizeBytes: output?.size,
      };
      await this.testcaseRepo.save(testcase);
      await this.problemRepo.update({
        id: problemId,
      }, {
        testcaseStatus: TestcaseStatus.READY
      });
    }
  }
}
