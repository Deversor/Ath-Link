import { z } from 'zod';

export const coachProfileSetupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().min(1, 'Contact number is required'),
  specialization: z.string().min(1, 'Please list your specialization'),
  yearsExperience: z
    .number({ invalid_type_error: 'Years of experience is required' })
    .min(0, 'Enter a valid number of years'),
});

export type CoachProfileSetupValues = z.infer<typeof coachProfileSetupSchema>;
