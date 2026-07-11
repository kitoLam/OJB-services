import { UserRole } from "../enums/user-role";

export type GatewayPayload = {
  userId: string,
  role: UserRole,
}