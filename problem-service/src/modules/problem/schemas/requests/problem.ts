import z from 'zod';
import { Difficulty, JudgeType, ProblemStatus } from '../../entities/problem.entity';

export const createProblemRequestSchema = z.object({
  title: z.string().nonempty(),
  statement: z.string().nonempty(),
  inputFormat: z.string(),
  outputFormat: z.string(),
  constraints: z.string(),
  samples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().nullable(),
      }),
    )
    .min(0),
    timeLimitMs: z.number(),
    memoryLimitMb: z.number(),
    difficulty: z.enum(Difficulty),
    judgeType: z.enum(JudgeType),
    status: z.enum(ProblemStatus),
    acCount: z.number(),
    submitCount: z.number()
});

export type CreateProblemRequest = z.infer<typeof createProblemRequestSchema>;
