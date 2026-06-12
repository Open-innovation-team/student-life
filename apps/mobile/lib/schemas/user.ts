import { z } from 'zod';

export const userUpdateSchema = z.object({
  firstName: z.string().max(50).min(2).optional(),
  lastName: z.string().max(50).min(2).optional(),
  establishment: z.string().max(255).min(4).optional(),
  sector: z.string().max(75).min(2).optional(),
  studyLevel: z.string().max(40).min(2).optional(),
});

export type UserUpdate = z.infer<typeof userUpdateSchema>;
