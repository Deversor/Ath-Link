import { z } from 'zod';

export const facilityReservationSchema = z.object({
  purpose: z.string().min(1, 'Please describe the purpose of your reservation'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  expectedAttendees: z.number().optional(),
  agree: z.literal(true, {
    error: 'You must agree to the facility use policies',
  }),
});

export type FacilityReservationValues = z.infer<typeof facilityReservationSchema>;