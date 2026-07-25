import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/auth.service";
import { TokenService } from "./services/token.service";

@Module({
  providers: [AuthService, TokenService],
  controllers: [AuthController],
  exports: [TokenService, AuthService]
})
export class AuthModule {}