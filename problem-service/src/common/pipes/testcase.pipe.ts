import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
@Injectable()
export class TestcasePipe implements PipeTransform {
  transform(files: Express.Multer.File[], _metadata: ArgumentMetadata) {
    
  }
  
}