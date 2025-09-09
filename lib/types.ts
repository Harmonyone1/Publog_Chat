export type Column = { name: string; type?: string };
export type Row = any[];

export type ChatResp = { mode: 'chat'; answer: string };

export type SqlResp = {
  mode: 'sql';
  sql?: string;
  result?: {
    columns: Column[];
    rows: Row[]; // treat as any[][]
  };
};

export type AskResponse = ChatResp | SqlResp;

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: string;
  createdAt: number;
};
