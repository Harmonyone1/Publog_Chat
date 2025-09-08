export type QAResponse = {
  answer: string;
  sql?: string;
  columns?: string[];
  rows?: (string | null)[][];
  citations?: { title?: string; url?: string }[];
  timing_ms?: number;
  workgroup?: string;
  error?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sql?: string;
  rowsPreview?: (string | null)[][];
  columnsPreview?: string[];
  error?: string;
  createdAt: number;
};
