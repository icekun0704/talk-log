import { useMemo, useState } from "react";
import { MiniBars } from "../components/charts";
import { Icon } from "../components/Icon";
import { Card, CardHead, EmptyState, Segmented } from "../components/ui";
import { WEEKDAY_LABELS } from "../lib/analytics";
import { fmtDateJP, fmtInt, fmtWeekday } from "../lib/format";
import type { Message } from "../lib/types";
import type { ViewProps } from "./types";

type SortKey = "new" | "old" | "most";

export function HistoryView({ chat, stats }: ViewProps) {
  const { sliced } = stats;
  const [query, setQuery] = useState("");
  const [sender, setSender] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [limit, setLimit] = useState(40);
  const [selected, setSelected] = useState<string | null>(null);

  const hourlyMap = useMemo(
    () => new Map(chat.HOURLY_BY_DAY.map((h) => [h.date, h.hours])),
    [chat.HOURLY_BY_DAY],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of stats.messagesInRange) {
      if (sender !== "all" && m.sender !== sender) continue;
      if (query.trim() && !m.content.toLowerCase().includes(query.trim().toLowerCase())) continue;
      const arr = map.get(m.date);
      if (arr) arr.push(m);
      else map.set(m.date, [m]);
    }
    return map;
  }, [stats.messagesInRange, sender, query]);

  const rows = useMemo(() => {
    let base = sliced;
    if (query.trim() || sender !== "all") {
      base = sliced.filter((d) => byDay.has(d.date));
    }
    const arr = [...base];
    if (sort === "new") arr.sort((a, b) => (a.date < b.date ? 1 : -1));
    else if (sort === "old") arr.sort((a, b) => (a.date < b.date ? -1 : 1));
    else arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [sliced, byDay, query, sender, sort]);

  const selectedMessages = selected ? byDay.get(selected) || [] : [];

  return (
    <div className="stack">
      <Card>
        <CardHead
          title="日別のやりとり"
          sub={`${rows.length} 日を表示中${query || sender !== "all" ? "（絞り込み中）" : ""}`}
          icon="history"
          right={
            <Segmented
              options={[
                { key: "new", label: "新しい順" },
                { key: "old", label: "古い順" },
                { key: "most", label: "多い順" },
              ]}
              value={sort}
              onChange={setSort}
              ariaLabel="並び順"
              small
            />
          }
        />

        <div className="row" style={{ marginBottom: 14 }}>
          <div className="search-box" style={{ flex: "1 1 220px" }}>
            <Icon name="search" size={16} />
            <input
              className="input"
              type="search"
              placeholder="この日のメッセージを絞り込む"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="メッセージを絞り込む"
            />
          </div>
          <Segmented
            options={[
              { key: "all", label: "全員" },
              { key: "a", label: chat.names.a },
              { key: "b", label: chat.names.b },
            ]}
            value={sender}
            onChange={setSender}
            ariaLabel="送信者で絞り込む"
            small
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon="search" title="条件に合う日がありません">
            検索語や送信者を変えてみてください。
          </EmptyState>
        ) : (
          <>
            <div className="day-list">
              {rows.slice(0, limit).map((d) => {
                const hours = hourlyMap.get(d.date) || new Array(24).fill(0);
                const isSel = selected === d.date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    className="day-row"
                    style={isSel ? { borderColor: "var(--a)", background: "var(--a-soft)" } : undefined}
                    onClick={() => setSelected(isSel ? null : d.date)}
                    aria-expanded={isSel}
                  >
                    <span className="day-date">
                      {fmtDateJP(d.date)}
                      <small>{fmtWeekday(d.date)}曜日</small>
                    </span>
                    <span className="day-spark">
                      <MiniBars values={hours} color="var(--a)" />
                    </span>
                    <span className="day-total">
                      {fmtInt(d.total)} 件
                      <small>
                        {chat.names.a} {d.a}・{chat.names.b} {d.b}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
            {rows.length > limit && (
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button type="button" className="btn" onClick={() => setLimit((n) => n + 60)}>
                  さらに表示（残り {rows.length - limit} 日）
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {selected && (
        <Card>
          <CardHead
            title={`${fmtDateJP(selected)}（${WEEKDAY_LABELS[new Date(`${selected}T00:00:00`).getDay()]}）のメッセージ`}
            sub={`${selectedMessages.length} 件`}
            icon="message"
            right={
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                <Icon name="close" size={14} />
                閉じる
              </button>
            }
          />
          {selectedMessages.length === 0 ? (
            <EmptyState icon="message" title="この日には表示できるメッセージがありません" />
          ) : (
            <div className="msg-list" style={{ maxHeight: 460, overflowY: "auto" }}>
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
      )}
    </div>
  );
}
