import { BaseEntity } from "src/common/entities/base.entity";
import { Testcase } from "src/modules/testcase/entities/testcase.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum JudgeType {
  ALGO = 'ALGO',
  SQL = 'SQL',
}

export enum ProblemStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLIC = 'PUBLIC',
}

export interface ProblemSample {
  input: string;
  output: string;
  explanation?: string;
}

@Entity('problem')
export class Problem extends BaseEntity{

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  statement: string;

  @Column({ name: 'input_format', type: 'text' })
  inputFormat: string;

  @Column({ name: 'output_format', type: 'text' })
  outputFormat: string;

  @Column({ type: 'text' })
  constraints: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  samples: ProblemSample[];

  @Column({ name: 'time_limit_ms', type: 'int' })
  timeLimitMs: number;

  @Column({ name: 'memory_limit_mb', type: 'int' })
  memoryLimitMb: number;

  @Column({ type: 'enum', enum: Difficulty })
  difficulty: Difficulty;

  @Column({ name: 'judge_type', type: 'enum', enum: JudgeType })
  judgeType: JudgeType;

  @Column({ type: 'enum', enum: ProblemStatus, default: ProblemStatus.DRAFT })
  status: ProblemStatus;

  @Column({ name: 'ac_count', type: 'int', default: 0 })
  acCount: number;

  @Column({ name: 'submit_count', type: 'int', default: 0 })
  submitCount: number;

  @OneToMany(() => Testcase, (tc) => tc.problem)
  testcases: Testcase[];
}
