import { z } from 'zod';
import { Difficulty, ProblemStatus, TestcaseStatus } from '../../entities/problem.entity';

export const findAllProblemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  title: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  probStatus: z.nativeEnum(ProblemStatus).optional(),
  testcaseStatus: z.nativeEnum(TestcaseStatus).optional(),
  sortBy: z.enum(['acCount', 'submitCount', 'title', 'createdAt']).optional(),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => (val ? (val.toUpperCase() as 'ASC' | 'DESC') : undefined)),
});

export type FindAllProblemsDto = z.infer<typeof findAllProblemsQuerySchema>;
