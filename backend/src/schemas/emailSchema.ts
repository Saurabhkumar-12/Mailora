import { z } from 'zod';

export const scheduleEmailSchema = z.object({
  recipient: z
    .string({ required_error: 'Recipient email is required' })
    .email('Invalid recipient email address')
    .max(255, 'Recipient email cannot exceed 255 characters')
    .trim(),
  subject: z
    .string({ required_error: 'Subject is required' })
    .min(1, 'Subject cannot be empty')
    .max(255, 'Subject cannot exceed 255 characters')
    .trim(),
  body: z
    .string({ required_error: 'Body is required' })
    .min(1, 'Body cannot be empty')
    .max(50000, 'Body cannot exceed 50,000 characters'),
  scheduledAt: z
    .string({ required_error: 'scheduledAt is required' })
    .datetime({ message: 'scheduledAt must be a valid ISO-8601 datetime string' }),
  senderId: z.string().cuid('Invalid senderId format').optional(),
  userId: z.string().cuid('Invalid userId format').optional(),
});

export const scheduleBatchEmailSchema = z.object({
  recipients: z
    .array(
      z
        .string()
        .email('Invalid recipient email address')
        .max(255, 'Recipient email cannot exceed 255 characters')
        .trim()
    )
    .min(1, 'At least one recipient is required')
    .max(1000, 'Maximum 1,000 recipients allowed per batch request'),
  subject: z
    .string({ required_error: 'Subject is required' })
    .min(1, 'Subject cannot be empty')
    .max(255, 'Subject cannot exceed 255 characters')
    .trim(),
  body: z
    .string({ required_error: 'Body is required' })
    .min(1, 'Body cannot be empty')
    .max(50000, 'Body cannot exceed 50,000 characters'),
  startTime: z
    .string()
    .datetime({ message: 'startTime must be a valid ISO-8601 datetime string' })
    .optional(),
  delayBetweenEmailsMs: z
    .number()
    .int('delayBetweenEmailsMs must be an integer')
    .min(0, 'delayBetweenEmailsMs cannot be negative')
    .max(3600000, 'delayBetweenEmailsMs cannot exceed 1 hour')
    .default(0),
  senderId: z.string().cuid('Invalid senderId format').optional(),
  userId: z.string().cuid('Invalid userId format').optional(),
});

export const getEmailsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 20)) : 20)),
  search: z.string().max(100).optional(),
});

export type ScheduleEmailInput = z.infer<typeof scheduleEmailSchema>;
export type ScheduleBatchEmailInput = z.infer<typeof scheduleBatchEmailSchema>;
export type GetEmailsQueryInput = z.infer<typeof getEmailsQuerySchema>;
