
export type FileUpload = {
  fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: { type: 'Buffer'; data: number[] }; // ← sau khi qua RabbitMQ
    size: number;
} | MulterFile

export interface TestcaseUploadRequestedMessage {
  problemId: string;
  files: FileUpload,
  isSample: boolean
}
