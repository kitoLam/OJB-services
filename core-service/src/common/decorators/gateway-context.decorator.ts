import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GatewayPayload } from '../types/gateway-payload';

export const GatewayContext = createParamDecorator(
  (field: keyof GatewayPayload | undefined, ctx: ExecutionContext) => {
    const gatewayContext: GatewayPayload = ctx.switchToHttp().getRequest().gatewayContext;
    return field ? gatewayContext?.[field] : gatewayContext;
  },
);