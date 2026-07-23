export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum ProblemStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLIC = 'PUBLIC',
}

// Trạng thái upload testcase (worker cập nhật) để user poll/biết tiến độ
export enum TestcasePollStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface ProblemSample {
  input: string;
  output: string;
  explanation?: string;
}