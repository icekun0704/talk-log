import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { Card, CardHead, EmptyState, Segmented } from "../components/ui";
import { wordRanking } from "../lib/analytics";
import { fmtDateJP, fmtInt } from "../lib/format";
import type { MsgType } from "../lib/types";
import type { ViewProps } from "./types";

type TypeFilter = "all" | MsgType;

const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "text", label: "テキスト" },
  { key: "stamp", label: "スタンプ" },
  { key: "photo", label: "写真" },
  { key: "video", label: "動画" },
  { key: "file", label: "ファイル" },
];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SearchView({ chat, stats }: ViewProps) {
  const { messagesInRange } = stats;
  const [query, setQuery] = useState("");
  const [sender, setSender] = useState("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [limit, setLimit] = useState(80);

  const popular = useMemo(() => wordRanking(messagesInRange, 10), [messagesInRange]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messagesInRange.filter((m) => {
      if (sender !== "all" && m.sender !== sender) return false;
      if (type !== "all" && m.type !== type) return false;
      if (q && !m.content.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [messagesInRange, query, sender, type]);

  const hasFilter = query.trim() !== "" || sender !== "all" || type !== "all";

  return (
    <div className="stack">
      <Card>
        <CardHead title="キーワード検索" sub={`${fmtInt(messagesInRange.length)} 件のメッセージから検索`} icon="search" />
        <div className="search-box">
          <Icon name="search" size={17} />
          <input
            className="input"
            type="search"
            placeholder="例：ありがとう、おはよう、映画"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(80);
            }}
            aria-label="検索キーワード"
            autoComplete="off"
            style={{ fontSize: 15, padding: "12px 14px 12px 40px" }}
          />
        </div>

        <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
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
          <Segmented
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
            ariaLabel="メッセージの種類で絞り込む"
            small
          />
        </div>

        {!hasFilter && (
          <div style={{ marginTop: 16 }}>
            <div className="small muted" style={{ marginBottom: 8 }}>
              よく使われる言葉から探す
            </div>
            <div className="row" style={{ gap: 7 }}>
              {popular.map((w) => (
                <button
                  key={w.word}
                  type="button"
                  className="pill"
                  style={{ cursor: "pointer" }}
                  onClick={() => setQuery(w.word)}
                >
                  {w.word}
                  <span className="faint">{w.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHead
          title={hasFilter ? "検索結果" : "メッセージ一覧"}
          sub={`${fmtInt(results.length)} 件${hasFilter ? "が見つかりました" : ""}`}
          icon="message"
        />
        {results.length === 0 ? (
          <EmptyState icon="search" title="メッセージが見つかりませんでした">
            別のキーワードや条件で試してみてください。
          </EmptyState>
        ) : (
          <>
            <div className="msg-list">
              {results.slice(0, limit).map((m, i) => (
                <div className="msg-row" key={i}>
                  <span className="msg-date">
                    {fmtDateJP(m.date)} {m.time}
                  </span>
                  <span className={`msg-sender ${m.sender === chat.names.a ? "a" : "b"}`}>{m.sender}</span>
                  <span className={`msg-text ${m.type !== "text" ? "msg-type" : ""}`}>
                    <Highlight text={m.content} query={query} />
                  </span>
                </div>
              ))}
            </div>
            {results.length > limit && (
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button type="button" className="btn" onClick={() => setLimit((n) => n + 120)}>
                  さらに表示（残り {results.length - limit} 件）
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
