import type { DayStat, HourlyDay, Message, MsgType, ParsedChat } from "./types";

const DATE_RE = /^(\d{4})\/(\d{2})\/(\d{2})\(.\)\s*$/;
const MSG_RE = /^(\d{2}):(\d{2})\t([^\t]+)\t(.*)$/;

const TYPE_MARKERS: Record<string, MsgType> = {
  "[スタンプ]": "stamp",
  "[写真]": "photo",
  "[動画]": "video",
  "[ファイル]": "file",
  "[アルバム]": "file",
  "[位置情報]": "other",
  "[音声メッセージ]": "other",
  "[ノート]": "other",
};
const MARKER_SET = new Set(Object.keys(TYPE_MARKERS));

/** LINE's exported text is UTF-8; BOM must be stripped or the first line breaks. */
export function normalizeSource(text: string): string {
  return text.replace(/^﻿/, "");
}

function isLineWhitespace(code: number): boolean {
  return (
    code === 32 ||
    (code >= 9 && code <= 13) ||
    code === 160 ||
    code === 5760 ||
    (code >= 8192 && code <= 8202) ||
    code === 8232 ||
    code === 8233 ||
    code === 8239 ||
    code === 8287 ||
    code === 12288 ||
    code === 65279
  );
}

const dateCache = new Map<string, number>();
/** UTC midnight of a YYYY-MM-DD string, in ms. */
export function dayMs(date: string): number {
  let v = dateCache.get(date);
  if (v === undefined) {
    const [y, m, d] = date.split("-").map(Number);
    v = Date.UTC(y, m - 1, d);
    dateCache.set(date, v);
  }
  return v;
}

/** UTC weekday (0=Sun) for a YYYY-MM-DD string. */
const weekdayCache = new Map<string, number>();
export function weekdayOf(date: string): number {
  let v = weekdayCache.get(date);
  if (v === undefined) {
    v = new Date(dayMs(date)).getUTCDay();
    weekdayCache.set(date, v);
  }
  return v;
}

export function addDays(date: string, n: number): string {
  return new Date(dayMs(date) + n * 864e5).toISOString().slice(0, 10);
}

export function minutesSinceEpoch(m: Message): number {
  if (m.t !== undefined) return m.t;
  return (
    dayMs(m.date) / 6e4 +
    parseInt(m.time.slice(0, 2), 10) * 60 +
    parseInt(m.time.slice(3, 5), 10)
  );
}

/**
 * Parses a LINE "トーク履歴" text export.
 * Returns null when no dated message could be found.
 */
export function parseLineChat(input: string): ParsedChat | null {
  const text = normalizeSource(input);
  const hasLoneCR = /\r/.test(text) && !/\r\n/.test(text);
  const simple =
    !hasLoneCR &&
    text.indexOf(String.fromCharCode(0x2028)) < 0 &&
    text.indexOf(String.fromCharCode(0x2029)) < 0;

  let chatTitle: string | null = null;
  const perDay = new Map<string, { total: number; bySender: Map<string, number>; chars: number; hours: number[] }>();
  const perSender = new Map<string, number>();
  const messages: Message[] = [];

  let currentDate: string | null = null;
  let currentDay: { total: number; bySender: Map<string, number>; chars: number; hours: number[] } | null = null;
  let dayOffset = 0;

  const push = (time: string, hour: number, minute: number, sender: string, rawContent: string) => {
    const first = rawContent.charCodeAt(0);
    const content = first > 32 && first < 160 ? rawContent : rawContent.trim();
    const marked = content.charCodeAt(0) === 91;
    const type: MsgType = (marked && TYPE_MARKERS[content]) || "text";

    if (!currentDay) {
      currentDay = { total: 0, bySender: new Map(), chars: 0, hours: new Array(24).fill(0) };
      perDay.set(currentDate!, currentDay);
    }
    const day = currentDay;

    day.total += 1;
    day.bySender.set(sender, (day.bySender.get(sender) || 0) + 1);
    if (hour >= 0 && hour < 24) day.hours[hour] += 1;

    if (!(marked && MARKER_SET.has(content))) {
      let len = content.length;
      for (let i = 0; i < content.length; i++) {
        const c = content.charCodeAt(i);
        if (c >= 0xd800 && c <= 0xdbff) len--;
      }
      day.chars += len;
    }

    perSender.set(sender, (perSender.get(sender) || 0) + 1);
    messages.push({
      date: currentDate!,
      time,
      sender,
      content,
      type,
      t: dayOffset + hour * 60 + minute,
    });
  };

  const setDate = (m: RegExpExecArray) => {
    currentDate = `${m[1]}-${m[2]}-${m[3]}`;
    currentDay = perDay.get(currentDate) || null;
    dayOffset = dayMs(currentDate) / 6e4;
  };

  if (simple) {
    const total = text.length;
    let lineStart = 0;
    let next = text.indexOf("\n");
    if (next < 0) next = total;
    let head = text.slice(0, next);
    if (head.charCodeAt(head.length - 1) === 13) head = head.slice(0, -1);
    const title = /^\[LINE\]\s*(.+?)とのトーク履歴/.exec(head);
    if (title) chatTitle = title[1].trim();

    const senderCache: string[] = [];
    let tabHint = -1;
    let pos = 0;

    while (pos <= total) {
      const start = pos;
      let end = text.indexOf("\n", pos);
      if (end < 0) end = total;
      pos = end + 1;

      let trimEnd = end;
      while (trimEnd > start) {
        const code = text.charCodeAt(trimEnd - 1);
        if (code > 32 && code < 160) break;
        if (isLineWhitespace(code)) trimEnd--;
        else break;
      }
      const len = trimEnd - start;
      if (len === 0) continue;

      if (len > 2 && text.charCodeAt(start + 2) === 58) {
        // "HH:" — message line
        if (currentDate === null || len < 8) continue;
        const h1 = text.charCodeAt(start) - 48;
        const h2 = text.charCodeAt(start + 1) - 48;
        const m1 = text.charCodeAt(start + 3) - 48;
        const m2 = text.charCodeAt(start + 4) - 48;
        if (
          h1 < 0 || h1 > 9 ||
          h2 < 0 || h2 > 9 ||
          m1 < 0 || m1 > 9 ||
          m2 < 0 || m2 > 9 ||
          text.charCodeAt(start + 5) !== 9
        ) {
          continue;
        }
        if (tabHint < start + 6) {
          tabHint = text.indexOf("\t", start + 6);
          if (tabHint < 0) tabHint = total + 1;
        }
        const tab = tabHint;
        if (tab <= start + 6 || tab >= trimEnd) continue;
        const senderLen = tab - start - 6;
        let sender: string | null = null;
        for (let i = 0; i < senderCache.length; i++) {
          const s = senderCache[i];
          if (s.length === senderLen && text.startsWith(s, start + 6)) {
            sender = s;
            break;
          }
        }
        if (sender === null) {
          sender = text.slice(start + 6, tab);
          if (senderCache.length < 8) senderCache.push(sender);
        }
        push(
          text.slice(start, start + 5),
          h1 * 10 + h2,
          m1 * 10 + m2,
          sender,
          text.slice(tab + 1, trimEnd),
        );
      } else if (len === 13) {
        const dm = DATE_RE.exec(text.slice(start, trimEnd));
        if (dm) setDate(dm);
      }
    }
  } else {
    const lines = text.split(/\r?\n/);
    const title = /^\[LINE\]\s*(.+?)とのトーク履歴/.exec(lines[0] || "");
    if (title) chatTitle = title[1].trim();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      if (line.length === 0) continue;
      if (line.charCodeAt(2) !== 58) {
        const dm = DATE_RE.exec(line);
        if (dm) setDate(dm);
        continue;
      }
      const mm = MSG_RE.exec(line);
      if (mm && currentDate !== null) {
        push(`${mm[1]}:${mm[2]}`, parseInt(mm[1], 10), parseInt(mm[2], 10), mm[3], mm[4]);
      }
    }
  }

  const dates = [...perDay.keys()].sort();
  if (dates.length === 0) return null;

  const ranked = [...perSender.entries()].sort((x, y) => y[1] - x[1]).map(([name]) => name);
  const nameA = ranked[0] || "A";
  const nameB = ranked[1] || "B";

  const RAW: DayStat[] = dates.map((date) => {
    const d = perDay.get(date)!;
    return {
      date,
      total: d.total,
      a: d.bySender.get(nameA) || 0,
      b: d.bySender.get(nameB) || 0,
      chars: d.chars,
    };
  });
  const HOURLY_BY_DAY: HourlyDay[] = dates.map((date) => ({
    date,
    hours: perDay.get(date)!.hours,
  }));

  return {
    RAW,
    HOURLY_BY_DAY,
    names: { a: nameA, b: nameB },
    chatTitle,
    messageCount: RAW.reduce((sum, d) => sum + d.total, 0),
    messages,
  };
}
