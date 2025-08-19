import KnowledgeBaseEntry from '../models/KnowledgeBaseEntry.js';

/**
 * Normalize a single entry for KB
 */
export function normalizeEntry(row, fileName, domainId, type = 'upload') {
  const suburb = row.suburbname?.trim().toUpperCase() || 'UNKNOWN';
  const postcode = row.postcode ? Number(row.postcode) : null;
  const answer = row.response?.trim() || 'No response provided';
  const council = row.council_seat?.trim().toUpperCase() || '';

  return {
    domainId,
    type,
    question: `${suburb} (${postcode})`,
    answer,
    suburb,
    postcode,
    council,
    lat: row.lat || null,
    lng: row.lng || null,
    status: 'active',
    tags: answer.toLowerCase().includes('yes') ? ['serviceable'] : ['non-serviceable'],
    metadata: { filename: fileName, uploadDate: new Date() }
  };
}

/**
 * Bulk insert or update KB entries to avoid duplicates
 */
export async function insertOrUpdateEntries(entries) {
  if (!entries.length) return 0;

  const bulkOps = entries.map(entry => ({
    updateOne: {
      filter: { domainId: entry.domainId, suburb: entry.suburb, postcode: entry.postcode },
      update: { $set: entry },
      upsert: true
    }
  }));

  const result = await KnowledgeBaseEntry.bulkWrite(bulkOps);
  return result.upsertedCount + result.modifiedCount;
}
