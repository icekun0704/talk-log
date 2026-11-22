import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { Card, CardHead, EmptyState, StatRow } from "../components/ui";
import { calendarDays, WEEKDAY_LABELS } from "../lib/analytics";
import { fmtDateFull, fmtInt, fmtMonth } from "../lib/format";
import type { Message } from "../lib/types";
import type { BaseViewProps } from "./types";

export function CalendarView({ chat }: BaseViewProps) {
  const days = useMemo(() => calendarDays(chat.RAW), [chat.RAW]);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const months = useMemo(() => {
    const set = new Set(chat.RAW.map((d) => d.date.slice(0, 7)));
    return [...set].sort();
  }, [chat.RAW]);

  const [month, setMonth] = useState(() => months[months.length - 1]);
  const [selected, setSelected] = useState<string | null>(null);

  const monthIndex = months.indexOf(month);
  const [year, mon] = month.split("-").map(Number);
  const firstWeekday = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();

  const monthCells = useMemo(() => {
    const cells: ({ date: string; total: number } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${month}-${String(d).padStart(2, "0")}`;
      cells.push({ date: key, total: byDate.get(key)?.total || 0 });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month, firstWeekday, daysInMonth, byDate]);

  const monthMax = Math.max(1, ...monthCells.filter(Boolean).map((c) => c!.total));
  const monthTotal = monthCells.reduce((s, c) => s + (c?.total || 0), 0);
  const activeDays = monthCells.filter((c) => c && c.total > 0).length;
  const bestDay = monthCells
    .filter(Boolean)
    .reduce<{ date: string; total: number } | null>((best, c) => (!best || c!.total > best.total ? c! : best), null);

  const messagesByDate = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of chat.messages) {
      const arr = map.get(m.date);
      if (arr) arr.push(m);
      else map.set(m.date, [m]);
    }
    return map;
  }, [chat.messages]);

  const selectedMessages = selected ? messagesByDate.get(selected) || [] : [];

  return (
    <div className="stack">
      <div className="grid grid-main">
        <Card>
          <CardHead
            title={`${fmtMonth(month)}のカレンダー`}
            sub={`${fmtInt(monthTotal)} 件・${activeDays} 日やりとり`}
            icon="calendar"
            right={
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <button
                  type="button"
                  className="btn btn-icon"
                  aria-label="前の月"
                  disabled={monthIndex <= 0}
                  onClick={() => setMonth(months[Math.max(0, monthIndex - 1)])}
                  style={{ opacity: monthIndex <= 0 ? 0.4 : 1 }}
                >
                  <Icon name="chevron-left" size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-icon"
                  aria-label="次の月"
                  disabled={monthIndex >= months.length - 1}
                  onClick={() => setMonth(months[Math.min(months.length - 1, monthIndex + 1)])}
                  style={{ opacity: monthIndex >= months.length - 1 ? 0.4 : 1 }}
                >
                  <Icon name="chevron-right" size={16} />
                </button>
              </div>
            }
          />
          <div className="calendar-grid" style={{ marginBottom: 5 }}>
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={w} className={`calendar-weekday ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>
                {w}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {monthCells.map((c, i) =>
              c === null ? (
                <div key={`e${i}`} className="calendar-cell outside" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  key={c.date}
                  className={`calendar-cell${selected === c.date ? " selected" : ""}`}
                  style={{
                    background:
                      c.total === 0
                        ? "var(--surface-2)"
                        : `color-mix(in srgb, var(--a) ${Math.round(10 + (c.total / monthMax) * 50)}%, var(--surface))`,
                    color: "var(--text)",
                  }}
                  onClick={() => setSelected(selected === c.date ? null : c.date)}
                  aria-label={`${fmtDateFull(c.date)} ${c.total}件`}
                  aria-pressed={selected === c.date}
                >
                  <span>{parseInt(c.date.slice(8), 10)}</span>
                  {c.total > 0 && <span className="cal-count">{c.total}</span>}
                </button>
              ),
            )}
          </div>
          <div className="chart-legend" style={{ justifyContent: "space-between" }}>
            <span className="faint">日付をクリックすると、その日のやりとりが見られます</span>
            <span className="legend-item">
              少
              {[0.15, 0.35, 0.55, 0.75, 0.95].map((o) => (
                <i
                  key={o}
                  className="legend-swatch"
                  style={{ background: `color-mix(in srgb, var(--a) ${o * 100}%, var(--surface))`, width: 10, height: 10 }}
                />
              ))}
              多
            </span>
          </div>
        </Card>

        <div className="stack">
          <Card>
            <CardHead title="この月のまとめ" icon="sparkles" />
            <div className="stat-list">
              <StatRow label="メッセージ" value={`${fmtInt(monthTotal)} 件`} />
              <StatRow label="やりとりした日" value={`${activeDays} 日`} />
              <StatRow label="1日平均" value={`${fmtInt(monthTotal / Math.max(1, activeDays))} 件`} />
              <StatRow label="いちばん多い日" value={bestDay ? `${fmtDateFull(bestDay.date)}・${fmtInt(bestDay.total)}件` : "—"} />
            </div>
          </Card>

          <Card>
            <CardHead title={selected ? fmtDateFull(selected) : "日付を選択"} sub={selected ? `${selectedMessages.length} 件` : "カレンダーの日付をクリック"} icon="message" />
            {!selected ? (
              <EmptyState icon="calendar" title="日付を選んでください">
                その日のメッセージ一覧がここに表示されます。
              </EmptyState>
            ) : selectedMessages.length === 0 ? (
              <EmptyState icon="message" title="この日にはやりとりの記録がありません" />
            ) : (
              <div className="msg-list" style={{ maxHeight: 320, overflowY: "auto" }}>
                {selectedMessages.map((m, i) => (
                  <div className="msg-row" key={i}>
                    <span className="msg-date">{m.time}</span>
                    <span className={`msg-sender ${m.sender === chat.names.a ? "a" : "b"}`}>{m.sender}</span>
                    <span className={`msg-text ${m.type !== "text" ? "msg-type" : ""}`}>{m.content}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
