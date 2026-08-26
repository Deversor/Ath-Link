import { z } from 'zod';

const INSTITUTIONAL_DOMAIN = '@psu.palawan.edu.ph';

export const SPORTS_LIST = [
  'Basketball',
  'Volleyball',
  'Football',
  'Badminton',
  'Table Tennis',
  'Swimming',
  'Track and Field',
  'Taekwondo',
  'Chess',
  'Sepak Takraw',
  'Baseball',
  'Softball',
  'Arnis',
  'Boxing',
  'Esports',
] as const;

export const ROLES = [
  { value: 'student', label: 'Student Athlete' },
  { value: 'coach', label: 'Coach' },
  { value: 'staff', label: 'Sports Office Staff' },
] as const;

export const signupSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .refine((val) => val.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN), {
        message: `Email must be a ${INSTITUTIONAL_DOMAIN} address`,
      }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['student', 'coach', 'staff'], {
      errorMap: () => ({ message: 'Please select a role' }),
    }),
    sport: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Sport is only required for the Student Athlete role
    if (data.role === 'student' && !data.sport) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select your sport program',
        path: ['sport'],
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
