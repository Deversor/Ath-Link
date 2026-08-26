import { z } from 'zod';

// Change '@psu.edu' to whatever your institution's actual domain is
// (e.g. '@psu.palawan.edu.ph').
const INSTITUTIONAL_DOMAIN = '@psu.palawan.edu.ph';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .refine((val) => val.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN), {
      message: `Email must be a ${INSTITUTIONAL_DOMAIN} address`,
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;