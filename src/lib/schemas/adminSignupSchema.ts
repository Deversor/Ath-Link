import { z } from 'zod';

const INSTITUTIONAL_DOMAIN = '@psu.palawan.edu.ph';

export const ADMIN_ROLES = [
  { value: 'staff_admin', label: 'Staff Admin' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'superadmin', label: 'Super Admin' },
] as const;

export const adminSignupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .refine((val) => val.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN), {
      message: `Email must be a ${INSTITUTIONAL_DOMAIN} address`,
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['staff_admin', 'registrar', 'superadmin'], {
    error: 'Please select a role',
  }),
  agreeToTerms: z.literal(true, {
    error: 'You must agree to the Terms of Service and Privacy Policy',
  }),
});

export type AdminSignupValues = z.infer<typeof adminSignupSchema>;