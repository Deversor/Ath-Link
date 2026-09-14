import { z } from 'zod';

export const EVENT_TYPES = [
  'Seminar',
  'Workshop',
  'Sports Tournament/Competition',
  'Training/Practice Session',
  'Meeting/Assembly',
  'Cultural Event',
  'Intramurals',
  'Tryouts',
  'Team Building',
  'Other',
] as const;

export const facilityReservationFormSchema = z
  .object({
    facilityId: z.string().min(1, 'Please select a facility'),
    reservationType: z.enum(['event', 'practice'], { error: 'Please choose a reservation type' }),

    prepDate: z.string().optional(),
    prepTime: z.string().optional(),

    eventDate: z.string().min(1, 'Event date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    eventDuration: z.string().optional(),

    eventTitle: z.string().min(1, 'Event/session title is required'),
    organizationName: z.string().optional(),
    eventType: z.string().min(1, 'Please select an event type'),
    otherEventType: z.string().optional(),
    purpose: z.string().min(1, 'Please describe the purpose'),
    expectedAttendees: z.number({ error: 'Estimated attendees is required' }).min(1),

    contactFullName: z.string().min(1, "Contact person's name is required"),
    contactEmail: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    contactNumber: z.string().min(1, 'Contact number is required'),
    palsuIdNo: z.string().optional(),
    otherReminders: z.string().optional(),

    agree: z.literal(true, {
      error: 'You must agree to the facility use policies',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.eventType === 'Other' && !data.otherEventType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please specify the event type',
        path: ['otherEventType'],
      });
    }
    if (data.reservationType === 'event' && !data.organizationName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Organization name is required for events',
        path: ['organizationName'],
      });
    }
  });

export type FacilityReservationFormValues = z.infer<typeof facilityReservationFormSchema>;
