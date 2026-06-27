import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { TestcaseService } from './services/testcase.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { TestcasePipe } from 'src/common/pipes/testcase.pipe';
import { BypassUserIdHeader } from 'src/common/decorators/bypass-user-id-header.decorator';
import { memoryStorage } from 'multer';
import { TestcaseProducer } from '../queue/producers/testcase.producer';
@Controller('testcase')
export class TestcaseController {
  constructor(private readonly testcaseService: TestcaseService, private readonly testcaseProducer: TestcaseProducer) {}

  @BypassUserIdHeader()
  @Post()
  // FilesInterceptor — parse multipart/form-data
  @UseInterceptors(FilesInterceptor('files', 100, {
    storage: memoryStorage(),
    limits: {
      fieldSize: 1024 * 1024, // 1MB
      files: 100
    }
  }))  // chuẩn bị data cho handler
  async testUploadFile(
    @UploadedFiles(TestcasePipe) files: Express.Multer.File[]
  ){
    await this.testcaseProducer.requestUpload({
      problemId: `asdfjasdf-01`,
      files,
      isSample: false,
    });
    return null;
  }
}
