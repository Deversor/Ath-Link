import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  email: z.string().email('Enter a valid email address'),
  sport: z.string().min(1, 'Please select your sport'),
  yearLevel: z.string().min(1, 'Year level is required'),
  course: z.string().min(1, 'Course is required'),
  age: z
    .number({ invalid_type_error: 'Age is required' })
    .min(14, 'Age must be at least 14')
    .max(60, 'Enter a valid age'),
  position: z.string().optional(),
  hometown: z.string().optional(),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  bio: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
