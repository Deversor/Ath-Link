import { z } from 'zod';

export const profileSettingsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required'),
  age: z.number({ error: 'Age is required' }).min(14).max(60),
  bloodType: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  collegeDepartment: z.string().min(1, 'College/Department is required'),
  degreeProgram: z.string().min(1, 'Degree program is required'),
  yearLevel: z.string().min(1, 'Year level is required'),
});

export type ProfileSettingsValues = z.infer<typeof profileSettingsSchema>;