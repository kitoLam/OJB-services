export interface CoreControllerResponse {
  message: string;
  data: Record<string, any> | undefined | null;
  metadata: Record<string, any> | undefined | null;
}
export class SuccessResponse {
  isSuccess: boolean = true;

  message: string;

  traceId: string;

  timestamp: Date;

  data: Record<string, any> | undefined | null;

  metadata: Record<string, any> | undefined | null;

  constructor(payload: {
    message: string;
    traceId: string;
    timestamp: Date;
    data: Record<string, any> | undefined | null;
    metadata: Record<string, any> | undefined | null;
  }) {
    this.message = payload.message;
    this.traceId = payload.traceId;
    this.timestamp = payload.timestamp;
    this.data = payload.data;
    this.metadata = payload.metadata;
  }
}
