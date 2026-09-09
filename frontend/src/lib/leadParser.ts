export interface LeadParseResult {
  validEmails: string[];
  totalParsed: number;
  invalidCount: number;
  duplicateCount: number;
  fileName: string;
  fileSizeKb: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates file extension and size.
 */
export function validateLeadFile(file: File): { isValid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !['csv', 'txt'].includes(extension)) {
    return { isValid: false, error: 'Invalid file format. Please upload a .csv or .txt file.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, error: 'File size exceeds 5MB limit. Please upload a smaller file.' };
  }

  return { isValid: true };
}

/**
 * Safely parses lead file (.csv or .txt) on client side, validating & deduplicating email addresses.
 */
export async function parseLeadFile(file: File): Promise<LeadParseResult> {
  const validation = validateLeadFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'File validation failed');
  }

  const text = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  const rawTokens: string[] = [];

  if (extension === 'csv') {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim()) continue;
      const columns = line.split(/[,;\t]/).map((col) => col.trim().replace(/^["']|["']$/g, ''));
      for (const col of columns) {
        if (col.includes('@')) {
          rawTokens.push(col);
        }
      }
    }
  } else {
    // TXT file - one or more emails per line
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const parts = line.split(/[\s,;\t]+/);
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          rawTokens.push(trimmed);
        }
      }
    }
  }

  let invalidCount = 0;
  let duplicateCount = 0;
  const seenSet = new Set<string>();
  const validEmails: string[] = [];

  for (const rawToken of rawTokens) {
    const normalized = rawToken.toLowerCase().trim();

    if (!EMAIL_REGEX.test(normalized) || normalized.length > 255) {
      invalidCount++;
      continue;
    }

    if (seenSet.has(normalized)) {
      duplicateCount++;
      continue;
    }

    seenSet.add(normalized);
    validEmails.push(normalized);
  }

  return {
    validEmails,
    totalParsed: rawTokens.length,
    invalidCount,
    duplicateCount,
    fileName: file.name,
    fileSizeKb: Math.round(file.size / 1024),
  };
}
