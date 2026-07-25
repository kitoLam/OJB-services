export class ErrorResponse {
  isSuccess: boolean = false;

  message: string;

  errorCode: string;

  errorList?: string[]

  traceId: string;

  timestamp: Date;

  constructor(payload: {
    message: string,
    traceId: string,
    ts: Date,
    errorCode: string,
    errorList?: string[]
  }){
    this.message = payload.message;
    this.traceId = payload.traceId;
    this.timestamp = payload.ts;
    this.errorList = payload.errorList;
    this.errorCode = payload.errorCode;
  }
}