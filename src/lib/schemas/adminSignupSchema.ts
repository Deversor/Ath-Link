import { z } from 'zod';

export const ADMIN_ROLES = [
  { value: 'staff_admin', label: 'Staff Admin' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'superadmin', label: 'Super Admin' },
] as const;

export const adminSignupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['staff_admin', 'registrar', 'superadmin'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
});

export type AdminSignupValues = z.infer<typeof adminSignupSchema>;
