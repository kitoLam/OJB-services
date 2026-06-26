import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { TestcaseService } from './services/testcase.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { TestcasePipe } from 'src/common/pipes/testcase.pipe';
import { BypassUserIdHeader } from 'src/common/decorators/bypass-user-id-header.decorator';
import { memoryStorage } from 'multer';
@Controller('testcase')
export class TestcaseController {
  constructor(private readonly testcaseService: TestcaseService) {}

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
  testUploadFile(
    @UploadedFiles(TestcasePipe) files: MulterFile[]
  ){
    files.forEach(file => {
      console.log(file)
    });
    return null;
  }
}
