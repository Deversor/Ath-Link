import { z } from 'zod';

export const reportSchema = z.object({
  title: z.string().min(1, 'Report title is required'),
  content: z.string().min(1, 'Report content is required'),
});

export type ReportValues = z.infer<typeof reportSchema>;
