import { SetMetadata } from "@nestjs/common";
import { BYPASS_RESPONSE_INTERCEPTOR } from "../constants/decorator-name";

export const BypassResponseInterceptor = () =>
  SetMetadata(BYPASS_RESPONSE_INTERCEPTOR, true);
