import z from 'zod';
import { Difficulty, ProblemStatus } from '../../entities/problem.entity';

export const createProblemRequestSchema = z.object({
  title: z.string().nonempty(),
  statement: z.string().nonempty(),
  inputFormat: z.string().nonempty(),
  outputFormat: z.string().nonempty(),
  constraints: z.string().nonempty(),
  samples: z
    .array(
      z.object({
        input: z.string().nonempty(),
        output: z.string().nonempty(),
        explanation: z.string().optional(),
      }),
    )
    .min(1),
  timeLimitMs: z.number().positive().nonoptional(),
  memoryLimitMb: z.number().positive().nonoptional(),
  difficulty: z.enum(Difficulty),
  problemStatus: z.enum(ProblemStatus)
});

export type CreateProblemRequest = z.infer<typeof createProblemRequestSchema>;
