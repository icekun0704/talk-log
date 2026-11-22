import type { ParsedChat, RangeKey } from "../lib/types";
import type { useChatStats } from "../lib/useStats";

export interface BaseViewProps {
  chat: ParsedChat;
  stats: ReturnType<typeof useChatStats>;
}

export interface ViewProps extends BaseViewProps {
  rangeKey: RangeKey;
  setRangeKey: (r: RangeKey) => void;
}
