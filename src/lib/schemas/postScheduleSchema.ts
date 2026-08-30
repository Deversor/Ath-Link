import { z } from 'zod';

export const postScheduleSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  duration: z.string().min(1, 'Duration is required'),
  sessionType: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  notesForAthletes: z.string().optional(),
});

export type PostScheduleValues = z.infer<typeof postScheduleSchema>;
