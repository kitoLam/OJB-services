import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { GatewayPayload } from '../types/gateway-payload';
import { UserRole } from '../enums/user-role';
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  validate(payload: { userId: string }): GatewayPayload {
    const user: GatewayPayload = {
      role: UserRole.HUNTER,
      userId: payload.userId,
    };
    return user;
  }
}
