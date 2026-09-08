import { Client } from '@elastic/elasticsearch';
import { env } from './env.js';

let esClientInstance: Client | null = null;

if (env.ELASTICSEARCH_NODE) {
  try {
    esClientInstance = new Client({
      node: env.ELASTICSEARCH_NODE,
      ...(env.ELASTICSEARCH_API_KEY
        ? {
            auth: {
              apiKey: env.ELASTICSEARCH_API_KEY,
            },
          }
        : {}),
    });
    console.log('🔍 Elasticsearch client initialized with node:', env.ELASTICSEARCH_NODE);
  } catch (error) {
    console.warn('[Elasticsearch Init Warning] Could not instantiate Client:', error instanceof Error ? error.message : error);
    esClientInstance = null;
  }
} else {
  console.log('ℹ️ ELASTICSEARCH_NODE not configured. Elasticsearch search index disabled (PostgreSQL fallback active).');
}

export const esClient: Client | null = esClientInstance;

/**
 * Safely pings Elasticsearch to verify node reachability without throwing exceptions.
 */
export const isElasticsearchAvailable = async (): Promise<boolean> => {
  if (!esClient) return false;
  try {
    const res = await esClient.ping();
    return Boolean(res);

  } catch (err) {
    console.warn('[Elasticsearch Ping Warning] Search node unreachable:', err instanceof Error ? err.message : err);
    return false;
  }
};
