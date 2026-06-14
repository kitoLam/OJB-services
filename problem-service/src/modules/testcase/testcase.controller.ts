import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TestcaseService } from './services/testcase.service';

@Controller('testcase')
export class TestcaseController {
  constructor(private readonly testcaseService: TestcaseService) {}

}
