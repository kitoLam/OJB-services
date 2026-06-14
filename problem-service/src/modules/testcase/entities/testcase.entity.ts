import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Problem } from 'src/modules/problem/entities/problem.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('testcases')
@Index(['problemId', 'orderIndex'], { unique: true })
export class Testcase extends BaseEntity{

  @ManyToOne(() => Problem, (problem) => problem.testcases, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'problem_id' })
  problem: Problem;

  @Column({ name: 'problem_id', type: 'uuid' })
  problemId: string;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;

  @Column({ name: 'is_sample', type: 'boolean', default: false })
  isSample: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'input_object_key', type: 'varchar', length: 512 })
  inputObjectKey: string;

  @Column({ name: 'output_object_key', type: 'varchar', length: 512 })
  outputObjectKey: string;

  @Column({ name: 'input_size_bytes', type: 'int' })
  inputSizeBytes: number;

  @Column({ name: 'output_size_bytes', type: 'int' })
  outputSizeBytes: number;

  @Column({ type: 'varchar', length: 64 }) // SHA-256 hex = 64 ký tự
  checksum: string;
}
