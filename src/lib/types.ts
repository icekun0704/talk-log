export type MsgType = "text" | "stamp" | "photo" | "video" | "file" | "other";

export interface Message {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  sender: string;
  content: string;
  type: MsgType;
  /** minutes since 1970-01-01 UTC, used for interval math */
  t: number;
}

export interface DayStat {
  date: string;
  total: number;
  a: number;
  b: number;
  chars: number;
}

export interface HourlyDay {
  date: string;
  hours: number[];
}

export interface Names {
  a: string;
  b: string;
}

export interface ParsedChat {
  RAW: DayStat[];
  HOURLY_BY_DAY: HourlyDay[];
  names: Names;
  chatTitle: string | null;
  messageCount: number;
  messages: Message[];
}

export type RangeKey = "1W" | "2W" | "1M" | "ALL";

export interface RangeOption {
  key: RangeKey;
  label: string;
  days: number;
}

export interface DayStatDelta extends DayStat {
  dayDelta: number;
  dayPct: number;
}

export interface StreakSegment {
  start: string;
  end: string;
  length: number;
}
