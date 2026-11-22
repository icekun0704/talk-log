import { useMemo } from "react";
import { AreaTrend, Donut } from "../components/charts";
import { BarList, Card, CardHead, EmptyState, RankItem, SplitBar } from "../components/ui";
import {
  emojiRanking,
  emojiTrend,
  topicCounts,
  typeCounts,
  wordRanking,
  type TypeKey,
} from "../lib/analytics";
import { fmtInt } from "../lib/format";
import type { ViewProps } from "./types";

const TYPE_LABEL: Record<TypeKey, string> = {
  text: "テキスト",
  stamp: "スタンプ",
  photo: "写真",
  video: "動画",
  file: "ファイル",
  other: "その他",
};
const TYPE_COLOR: Record<TypeKey, string> = {
  text: "var(--a)",
  stamp: "#8B7CFF",
  photo: "#3ED598",
  video: "#FFA63D",
  file: "#5B9DFF",
  other: "var(--muted)",
};

export function BreakdownView({ chat, stats }: ViewProps) {
  const { messagesInRange } = stats;
  const words = useMemo(() => wordRanking(messagesInRange, 12), [messagesInRange]);
  const emojis = useMemo(() => emojiRanking(messagesInRange, 12), [messagesInRange]);
  const topics = useMemo(() => topicCounts(messagesInRange), [messagesInRange]);
  const trend = useMemo(() => emojiTrend(messagesInRange), [messagesInRange]);
  const types = useMemo(() => typeCounts(messagesInRange, chat.names), [messagesInRange, chat.names]);

  const typeRows = (["text", "stamp", "photo", "video", "file", "other"] as TypeKey[])
    .map((k) => ({ key: k, value: types.a[k] + types.b[k] }))
    .filter((t) => t.value > 0);
  const typeTotal = typeRows.reduce((s, t) => s + t.value, 0);
  const wordMax = words[0]?.count || 1;
  const topicTotal = topics.reduce((s, t) => s + t.count, 0);

  return (
    <div className="stack">
      <div className="grid grid-main">
        <Card>
          <CardHead title="メッセージの種類" sub={`${fmtInt(typeTotal)} 件の内訳`} icon="pie" />
          <div className="donut-wrap">
            <Donut
              segments={typeRows.map((t) => ({ label: TYPE_LABEL[t.key], value: t.value, color: TYPE_COLOR[t.key] }))}
              centerLabel="メッセージ"
              size={158}
            />
            <div style={{ flex: 1, minWidth: 190 }}>
              <div className="stat-list">
                {typeRows.map((t) => (
                  <div className="stat-row" key={t.key} style={{ padding: "8px 0" }}>
                    <span className="stat-key">
                      <i className="legend-swatch" style={{ background: TYPE_COLOR[t.key] }} />
                      {TYPE_LABEL[t.key]}
                    </span>
                    <span className="stat-val">
                      {fmtInt(t.value)}
                      <small>{typeTotal ? Math.round((t.value / typeTotal) * 100) : 0}%</small>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="送信者別" sub="だれが何を送っているか" icon="users" />
          <div className="stack" style={{ gap: 16 }}>
            {(
              [
                ["a", chat.names.a, types.a],
                ["b", chat.names.b, types.b],
              ] as const
            ).map(([who, name, t]) => {
              const total = Object.values(t).reduce((s, v) => s + v, 0);
              return (
                <div key={who}>
                  <div className="spread" style={{ marginBottom: 8 }}>
                    <span className="row" style={{ gap: 7 }}>
                      <span className={`person-dot ${who}`}>{Array.from(name)[0]}</span>
                      <strong style={{ fontSize: 13 }}>{name}</strong>
                    </span>
                    <span className="small muted">{fmtInt(total)} 件</span>
                  </div>
                  <SplitBar
                    a={t.text}
                    b={total - t.text}
                    aLabel="テキスト"
                    bLabel="その他"
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card>
          <CardHead title="よく使った言葉" sub="テキストメッセージから集計" icon="message" />
          {words.length === 0 ? (
            <EmptyState icon="message" title="集計できる言葉がありません" />
          ) : (
            <div>
              {words.map((w, i) => (
                <RankItem key={w.word} index={i} name={w.word} count={w.count} max={wordMax} suffix="回" />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHead title="絵文字ランキング" sub="よく使う絵文字" icon="heart" />
          {emojis.length === 0 ? (
            <EmptyState icon="heart" title="絵文字が見つかりませんでした" />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                gap: 10,
              }}
            >
              {emojis.map((e, i) => (
                <div
                  key={e.emoji}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "10px 8px",
                    textAlign: "center",
                    background: i === 0 ? "var(--a-soft)" : "var(--surface)",
                  }}
                >
                  <div style={{ fontSize: 26, lineHeight: 1.2 }}>{e.emoji}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>{fmtInt(e.count)} 回</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-main">
        <Card>
          <CardHead title="会話トピック分類" sub="キーワードから見た話題の傾向" icon="pie" />
          <BarList
            items={topics.map((t) => ({
              label: (
                <span className="row" style={{ gap: 7 }}>
                  <span>{t.emoji}</span>
                  {t.label}
                </span>
              ),
              value: t.count,
              hint: `${t.pct}%`,
            }))}
            formatValue={(v) => `${fmtInt(v)}件`}
          />
          <p className="small faint" style={{ marginTop: 12 }}>
            キーワードから簡易的に分類した話題の傾向です。合計 {fmtInt(topicTotal)} 件が分類されました。
          </p>
        </Card>

        <Card>
          <CardHead title="絵文字使用率の推移" sub="月ごとの絵文字の数" icon="detail" />
          {trend.length === 0 ? (
            <EmptyState icon="heart" title="絵文字の記録がありません" />
          ) : (
            <AreaTrend
              data={trend.map((t) => ({ label: t.label, value: t.count }))}
              color="var(--accent)"
              height={220}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
