export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type EntityName =
  | "homepage_cards"
  | "timeline_entries"
  | "notes"
  | "open_when_cards"
  | "photos"
  | "songs"
  | "observations"
  | "scenarios"
  | "conversation_prompts"
  | "conversation_messages"
  | "user_submissions"
  | "easter_eggs"
  | "activity_events";

export type Row = {
  id: number;
  [key: string]: JsonValue;
};
