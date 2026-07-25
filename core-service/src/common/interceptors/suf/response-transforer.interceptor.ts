import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { BYPASS_RESPONSE_INTERCEPTOR } from 'src/common/constants/decorator-name';
import { SuccessResponse } from 'src/common/dto/response/success.response';

@Injectable()
export class ResponseTransformerInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const bypass = this.reflector.getAllAndOverride<boolean>(
      BYPASS_RESPONSE_INTERCEPTOR,
      [context.getHandler(), context.getClass()],
    );

    if (bypass) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const traceId = String(request.headers['x-trace-id'] ?? '');

    return next.handle().pipe(
      map((payload) => this.transform(payload, traceId)),
    );
  }

  private transform(payload: any, traceId: string): SuccessResponse {
    if (payload instanceof SuccessResponse) {
      return payload;
    }

    // Controller trả về object dạng { data, metadata, message }
    const { data, metadata, message } = payload ?? {};

    return new SuccessResponse({
      message: message ?? 'Success',
      traceId,
      timestamp: new Date(),
      data: data ?? null,
      metadata: metadata ?? undefined,
    });
  }
}
