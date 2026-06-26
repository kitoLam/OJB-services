import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { BYPASS_USER_ID_HEADER } from "../constants/decorator-name";

// muốn không check cái nào thì tự if else ên, còn không thì gắn vào hoi

@Injectable()
export class HeaderInfoGuard implements CanActivate{

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isBypassUserId = this.reflector.getAllAndOverride(BYPASS_USER_ID_HEADER, [
      context.getHandler(),
      context.getClass()
    ])
    // console.log(`isBypassUserId::`, isBypassUserId);
    // chỉ có userId bị bypass
    if(isBypassUserId) return true; 
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];
    if(!userId){
      throw new UnauthorizedException('Not valid userId');
    }
    request.gatewayContext = {
      userId, role
    };

    return true;
  }
}
