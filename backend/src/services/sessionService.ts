import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { User } from '@prisma/client';

export class SessionService {
  /**
   * Creates a persistent session in PostgreSQL for the given user ID.
   * Default session duration: 7 days.
   */
  static async createSession(userId: string, durationDays = 7): Promise<string> {
    const sid = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        sid,
        userId,
        expiresAt,
      },
    });

    return sid;
  }

  /**
   * Retrieves and validates the user associated with a given session ID.
   */
  static async getSessionUser(sid: string): Promise<User | null> {
    if (!sid) return null;

    const session = await prisma.session.findUnique({
      where: { sid },
      include: { user: true },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt.getTime() < Date.now()) {
      // Clean up expired session asynchronously
      prisma.session.delete({ where: { sid } }).catch(() => {});
      return null;
    }

    return session.user;
  }

  /**
   * Destroys/invalidates a session by ID.
   */
  static async destroySession(sid: string): Promise<void> {
    if (!sid) return;
    await prisma.session.deleteMany({
      where: { sid },
    });
  }
}
