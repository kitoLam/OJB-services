import { PipeTransform, ArgumentMetadata, BadRequestException, Injectable } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const metatype = metadata.metatype as any;
    const schema: ZodSchema | undefined = metatype?.zodSchema;

    if (!schema) return value; // tham số không có schema -> bỏ qua, không phá route khác

    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Bad Request Error',
        errors: result.error.flatten(),
      });
    }
    return result.data;
  }
}