import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ProblemService } from './services/problem.service';
import { type CreateProblemRequest } from './schemas/requests/problem-request.schema';
import { type FindAllProblemsDto } from './schemas/query/problem-query.schema';
import { BypassUserIdHeader } from 'src/common/decorators/bypass-user-id-header.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TestcasePipe } from 'src/common/pipes/testcase.pipe';

@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: {
        fileSize: 1024 * 1024,
      },
    }),
  )
  create(
    @UploadedFile(TestcasePipe) files: MulterFile[],
    @Body() createProblemDto: CreateProblemRequest,
  ) {
    return this.problemService.create(createProblemDto, files);
  }

  @Get()
  @BypassUserIdHeader()
  findAll(@Query() query: FindAllProblemsDto) {
    return this.problemService.findAll(query);
  }

  @Get(':id')
  @BypassUserIdHeader()
  findOne(@Param('id') id: string) {
    return this.problemService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.problemService.remove(+id);
  }
}
