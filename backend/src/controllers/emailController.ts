import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/emailService.js';
import {
  scheduleEmailSchema,
  scheduleBatchEmailSchema,
  getEmailsQuerySchema,
} from '../schemas/emailSchema.js';

export class EmailController {
  /**
   * POST /api/emails/schedule
   */
  static async schedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = scheduleEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      const result = await EmailService.scheduleEmail(parsed.data);
      res.status(201).json({
        success: true,
        message: 'Email scheduled successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/emails/schedule-batch
   */
  static async scheduleBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = scheduleBatchEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      const result = await EmailService.scheduleBatch(parsed.data);
      res.status(201).json({
        success: true,
        message: `Successfully scheduled batch of ${result.totalQueued} emails`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/emails/scheduled
   */
  static async getScheduled(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = getEmailsQuerySchema.safeParse(req.query);
      const { page = 1, limit = 20 } = parsed.success ? parsed.data : { page: 1, limit: 20 };

      const result = await EmailService.getScheduledEmails(undefined, page, limit);
      res.status(200).json({
        success: true,
        data: result.emails,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/emails/sent
   */
  static async getSent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = getEmailsQuerySchema.safeParse(req.query);
      const { page = 1, limit = 20 } = parsed.success ? parsed.data : { page: 1, limit: 20 };

      const result = await EmailService.getSentEmails(undefined, page, limit);
      res.status(200).json({
        success: true,
        data: result.emails,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/emails/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const email = await EmailService.getEmailById(id);

      if (!email) {
        res.status(404).json({
          success: false,
          error: 'Email not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: email,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/emails/:id
   */
  static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await EmailService.cancelEmail(id);

      if (!result.found) {
        res.status(404).json({
          success: false,
          error: result.error,
        });
        return;
      }

      if (!result.canCancel) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Scheduled email cancelled successfully',
        data: result.email,
      });
    } catch (error) {
      next(error);
    }
  }
}
