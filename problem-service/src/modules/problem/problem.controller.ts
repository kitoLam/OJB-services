import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProblemService } from './services/problem.service';
import { type CreateProblemRequest } from './schemas/requests/problem';
import { BypassUserIdHeader } from 'src/common/decorators/bypass-user-id-header.decorator';

@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Post()
  create(@Body() createProblemDto: CreateProblemRequest) {
    return this.problemService.create(createProblemDto);
  }

  @Get()
  @BypassUserIdHeader()
  findAll() {
    return this.problemService.findAll();
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
