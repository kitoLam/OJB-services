import { SetMetadata } from "@nestjs/common";
import { BYPASS_USER_ID_HEADER } from "../constants/decorator-name";

export const BypassUserIdHeader = () => SetMetadata(BYPASS_USER_ID_HEADER, true);