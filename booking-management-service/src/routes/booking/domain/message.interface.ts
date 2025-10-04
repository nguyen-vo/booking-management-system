export interface Message {
  topic: string;
  data: Record<string, unknown>;
  attributes?: Record<string, string>;
}
