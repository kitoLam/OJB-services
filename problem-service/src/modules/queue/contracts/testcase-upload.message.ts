// ============================================================
//  Hợp đồng message (contract) giữa producer và consumer.
//  CHỈ chứa metadata + đường dẫn file tạm — KHÔNG nhét bytes file
//  vào message (giữ message nhỏ, RabbitMQ không phải nơi chứa file).
// ============================================================

// Một testcase = 1 cặp input/output
export interface TestcasePairRef {
  orderIndex: number;
  isSample: boolean;
  inputTmpPath: string;  // đường dẫn file input ở thư mục tạm (local)
  outputTmpPath: string; // đường dẫn file output ở thư mục tạm (local)
}

export interface TestcaseUploadRequestedMessage {
  jobId: string;     // để trace/log
  problemId: string; // problem mà testcase thuộc về
  testcases: TestcasePairRef[];
}
