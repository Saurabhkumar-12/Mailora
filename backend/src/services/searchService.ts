import { esClient, isElasticsearchAvailable } from '../config/elasticsearch.js';

export const ELASTICSEARCH_INDEX = 'mailora-emails';

export interface EmailDocument {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  jobId?: string | null;
  userId: string;
  senderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SearchService {
  /**
   * Creates the `mailora-emails` index with proper field mappings if it does not already exist.
   */
  static async ensureIndexExists(): Promise<boolean> {
    if (!esClient || !(await isElasticsearchAvailable())) {
      return false;
    }

    try {
      const exists = await esClient.indices.exists({ index: ELASTICSEARCH_INDEX });
      if (!exists) {
        await esClient.indices.create({
          index: ELASTICSEARCH_INDEX,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              failedAt: { type: 'date' },
              errorMessage: { type: 'text' },
              jobId: { type: 'keyword' },
              userId: { type: 'keyword' },
              senderId: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
            },
          },
        });
        console.log(`✅ Created Elasticsearch index: ${ELASTICSEARCH_INDEX}`);
      }
      return true;
    } catch (error) {
      console.warn(
        '[Search Index Warning] Failed to verify/create index:',
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  /**
   * Idempotently indexes or updates an email document using `email.id` as document `_id`.
   */
  static async indexEmail(email: {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    scheduledAt: Date;
    sentAt?: Date | null;
    failedAt?: Date | null;
    errorMessage?: string | null;
    jobId?: string | null;
    userId: string;
    senderId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<boolean> {
    if (!esClient) return false;

    try {
      const doc: EmailDocument = {
        id: email.id,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: email.sentAt ? email.sentAt.toISOString() : null,
        failedAt: email.failedAt ? email.failedAt.toISOString() : null,
        errorMessage: email.errorMessage || null,
        jobId: email.jobId || null,
        userId: email.userId,
        senderId: email.senderId || null,
        createdAt: email.createdAt.toISOString(),
        updatedAt: email.updatedAt.toISOString(),
      };

      await esClient.index({
        index: ELASTICSEARCH_INDEX,
        id: email.id, // Idempotent document ID
        document: doc,
      });

      return true;
    } catch (error) {
      console.warn(
        `[Search Index Warning] Could not index email ${email.id}:`,
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  /**
   * Performs multi-match full-text search across recipient, subject, and body fields with pagination.
   */
  static async searchEmails(
    queryText: string,
    page: number = 1,
    limit: number = 20,
    userId?: string
  ) {
    if (!esClient || !(await isElasticsearchAvailable())) {
      return {
        available: false,
        total: 0,
        hits: [],
        message: 'Elasticsearch search service is currently unavailable.',
      };
    }

    const from = (page - 1) * limit;

    const mustClauses: Record<string, unknown>[] = [];
    if (queryText && queryText.trim().length > 0) {
      mustClauses.push({
        multi_match: {
          query: queryText.trim(),
          fields: ['recipient^3', 'recipient.keyword^3', 'subject^2', 'body'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      mustClauses.push({ match_all: {} });
    }

    if (userId) {
      mustClauses.push({ term: { userId } });
    }

    try {
      const response = await esClient.search({
        index: ELASTICSEARCH_INDEX,
        from,
        size: limit,
        query: {
          bool: {
            must: mustClauses,
          },
        },
        sort: [{ createdAt: { order: 'desc' } }],
      });

      const hits = response.hits.hits.map((hit) => hit._source as EmailDocument);
      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : response.hits.total?.value || 0;

      return {
        available: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hits,
      };
    } catch (error) {
      console.warn(
        '[Search Warning] Elasticsearch query failed:',
        error instanceof Error ? error.message : error
      );
      return {
        available: false,
        total: 0,
        hits: [],
        message: 'Search query failed to execute against Elasticsearch.',
      };
    }
  }
}
