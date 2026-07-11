import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
@Injectable()
export class TestcasePipe implements PipeTransform {
  transform(files: Express.Multer.File[], _metadata: ArgumentMetadata) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được upload');
    }

    const inputPattern = /^input-(\d+)\.txt$/;
    const outputPattern = /^output-(\d+)\.txt$/;

    const inputNumbers = new Set<number>();
    const outputNumbers = new Set<number>();
    const invalidFiles: string[] = [];

    for (const file of files) {
      const inputMatch = file.originalname.match(inputPattern);
      const outputMatch = file.originalname.match(outputPattern);

      if (inputMatch) {
        inputNumbers.add(Number(inputMatch[1]));
      } else if (outputMatch) {
        outputNumbers.add(Number(outputMatch[1]));
      } else {
        invalidFiles.push(file.originalname);
      }
    }

    if (invalidFiles.length > 0) {
      throw new BadRequestException(
        `File sai format: ${invalidFiles.join(', ')}. ` +
          `Chỉ chấp nhận input-{n}.txt và output-{n}.txt`,
      );
    }

    // ③ Check đủ cặp
    const missingOutputs: number[] = [];
    const missingInputs: number[] = [];

    for (const n of inputNumbers) {
      if (!outputNumbers.has(n)) missingOutputs.push(n);
    }
    for (const n of outputNumbers) {
      if (!inputNumbers.has(n)) missingInputs.push(n);
    }

    if (missingOutputs.length > 0) {
      throw new BadRequestException(
        `Thiếu output cho test: ${missingOutputs.map((n) => `output-${n}.txt`).join(', ')}`,
      );
    }

    if (missingInputs.length > 0) {
      throw new BadRequestException(
        `Thiếu input cho test: ${missingInputs.map((n) => `input-${n}.txt`).join(', ')}`,
      );
    }

    return files;
  }
}
