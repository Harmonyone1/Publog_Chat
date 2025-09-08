export type AnswerView =
  | { type: 'kpi'; title: string; value: number | string; unit?: string }
  | { type: 'bar'; title: string; data: any[]; encoding: { x: string; y: string } }
  | { type: 'table'; title: string; columns: string[]; rows: (string | number | null)[][] };

export type AnswerPayload = {
  answer: string;
  explanation?: string;
  views: AnswerView[];
  raw?: { columns: string[]; rows: (string | number | null)[][] };
  meta?: Record<string, any>;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  views?: AnswerView[];
  explanation?: string;
  error?: string;
  createdAt: number;
};
