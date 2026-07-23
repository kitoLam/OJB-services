import { BaseEntity } from "src/common/entities/base.entity";
import { Testcase } from "src/modules/testcase/entities/testcase.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Difficulty, ProblemSample, ProblemStatus, TestcasePollStatus } from "../enums/problem.enum";

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

  @Column({ name: 'difficulty', type: 'enum', enum: Difficulty })
  difficulty: Difficulty;

  @Column({ name: 'status', type: 'enum', enum: ProblemStatus, default: ProblemStatus.DRAFT })
  status: ProblemStatus;

  @Column({ name: 'ac_count', type: 'int', default: 0 })
  acCount: number;

  @Column({ name: 'submit_count', type: 'int', default: 0 })
  submitCount: number;

  @Column({
    name: 'testcase_status',
    type: 'enum',
    enum: TestcasePollStatus,
    default: TestcasePollStatus.PENDING,
  })
  testcaseStatus: TestcasePollStatus;

  @Column({
    name: 'total_testcase',
    type: "number"
  })
  totalTestcase: number;

  @OneToMany(() => Testcase, (tc) => tc.problem)
  testcases: Testcase[];
}
