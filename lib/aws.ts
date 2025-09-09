import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

let docClient: DynamoDBDocumentClient | null = null;

export function getDdb(): DynamoDBDocumentClient | null {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const tableSaved = process.env.DDB_TABLE_SAVED;
  const tableHistory = process.env.DDB_TABLE_HISTORY;
  const tableMessages = process.env.DDB_TABLE_MESSAGES;
  if (!tableSaved && !tableHistory && !tableMessages) return null; // Not configured
  if (docClient) return docClient;
  try {
    const client = new DynamoDBClient({ region });
    docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
    return docClient;
  } catch {
    return null;
  }
}

export const TABLE_SAVED = process.env.DDB_TABLE_SAVED;
export const TABLE_HISTORY = process.env.DDB_TABLE_HISTORY;
export const TABLE_MESSAGES = process.env.DDB_TABLE_MESSAGES;
export const TABLE_PREFS = process.env.DDB_TABLE_PREFS;
