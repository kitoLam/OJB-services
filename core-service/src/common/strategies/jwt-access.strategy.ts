import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { EnvConfig } from "src/config/env.config";
import { GatewayPayload } from "../types/gateway-payload";
import { UserRole } from "../enums/user-role";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(config: ConfigService<EnvConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow('jwt.access_secret', {infer: true}),
      ignoreExpiration: false,
    });

  } 
  validate(payload: {
    userId: string
  }): GatewayPayload {
    //giả sử query db, ra được user rồi:
    const user : GatewayPayload = {
      role: UserRole.HUNTER,
      userId: payload.userId,
    }
    return user;
  }
}