import { useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Card, CardHead, EmptyState, Segmented, SplitBar, TrendBadge } from "../components/ui";
import { rangeSummary } from "../lib/analytics";
import { fmtDateJP, fmtInt, fmtNum, fmtRange } from "../lib/format";
import type { DayStat, ParsedChat } from "../lib/types";
import type { BaseViewProps } from "./types";

interface CompareViewProps extends BaseViewProps {
  compareChat: ParsedChat | null;
  compareError: string | null;
  onLoadCompare: (file: File) => void;
  onClearCompare: () => void;
}

type Mode = "period" | "file";

export function CompareView({
  chat,
  stats,
  compareChat,
  compareError,
  onLoadCompare,
  onClearCompare,
}: CompareViewProps) {
  const [mode, setMode] = useState<Mode>("period");
  const inputRef = useRef<HTMLInputElement>(null);
  const { sliced, summary } = stats;

  const previous = useMemo<DayStat[] | null>(() => {
    if (sliced.length === 0) return null;
    const startIdx = chat.RAW.findIndex((d) => d.date === sliced[0].date);
    if (startIdx <= 0) return null;
    const n = sliced.length;
    return chat.RAW.slice(Math.max(0, startIdx - n), startIdx);
  }, [chat.RAW, sliced]);

  const prevSummary = previous ? rangeSummary(previous) : null;

  const fileSummary = compareChat ? rangeSummary(compareChat.RAW) : null;

  const current = {
    label: "今回の期間",
    range: sliced.length ? fmtRange(sliced[0].date, sliced[sliced.length - 1].date) : "—",
    total: summary.total,
    days: sliced.length,
    avg: summary.avg,
    chars: summary.chars,
    a: summary.a,
    b: summary.b,
    aName: chat.names.a,
    bName: chat.names.b,
    peak: summary.peak,
  };

  const other =
    mode === "period" && prevSummary && previous
      ? {
          label: "前の期間",
          range: fmtRange(previous[0].date, previous[previous.length - 1].date),
          total: prevSummary.total,
          days: previous.length,
          avg: prevSummary.avg,
          chars: prevSummary.chars,
          a: prevSummary.a,
          b: prevSummary.b,
          aName: chat.names.a,
          bName: chat.names.b,
          peak: prevSummary.peak,
        }
      : mode === "file" && compareChat && fileSummary
        ? {
            label: compareChat.chatTitle || "比較するトーク",
            range: fmtRange(compareChat.RAW[0].date, compareChat.RAW[compareChat.RAW.length - 1].date),
            total: fileSummary.total,
            days: compareChat.RAW.length,
            avg: fileSummary.avg,
            chars: fileSummary.chars,
            a: fileSummary.a,
            b: fileSummary.b,
            aName: compareChat.names.a,
            bName: compareChat.names.b,
            peak: fileSummary.peak,
          }
        : null;

  const maxTotal = other ? Math.max(current.total, other.total, 1) : 1;

  return (
    <div className="stack">
      <Card>
        <CardHead
          title="比較のしかた"
          sub="同じトークの期間どうし、または別のトークファイルと比べられます"
          icon="compare"
          right={
            <Segmented
              options={[
                { key: "period", label: "期間で比較" },
                { key: "file", label: "ファイルで比較" },
              ]}
              value={mode}
              onChange={setMode}
              ariaLabel="比較モード"
            />
          }
        />
        {mode === "file" && (
          <div className="row" style={{ alignItems: "center" }}>
            <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
              <Icon name="upload" size={15} />
              {compareChat ? "別のファイルに変更" : "比較するファイルを選ぶ"}
            </button>
            {compareChat && (
              <>
                <span className="pill accent">
                  {compareChat.chatTitle || "比較ファイル"}・{fmtInt(compareChat.messageCount)}件
                </span>
                <button type="button" className="btn btn-ghost" onClick={onClearCompare}>
                  <Icon name="close" size={14} />
                  解除
                </button>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".txt,text/plain"
              className="visually-hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onLoadCompare(file);
                e.target.value = "";
              }}
            />
            {compareError && <span className="upload-error" style={{ margin: 0 }}>{compareError}</span>}
          </div>
        )}
      </Card>

      {!other ? (
        <Card>
          <EmptyState icon="compare" title={mode === "period" ? "比較できる前の期間がありません" : "比較するファイルを選んでください"}>
            {mode === "period"
              ? "この期間より前のデータが必要です。集計期間を短くするか、全期間を選んでください。"
              : "別のトーク履歴ファイルを読み込むと、ふたつのトークを並べて比べられます。"}
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid grid-2">
            {[current, other].map((side, i) => (
              <Card key={i}>
                <div className="spread" style={{ marginBottom: 10 }}>
                  <span className="pill accent">{side.label}</span>
                  <span className="small muted">{side.range}</span>
                </div>
                <div className="kpi-value" style={{ fontSize: 30 }}>
                  {fmtInt(side.total)}
                  <span className="kpi-unit">件</span>
                </div>
                <div className="bar-track" style={{ margin: "12px 0 14px", height: 10 }}>
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(side.total / maxTotal) * 100}%`,
                      background: i === 0 ? "var(--a)" : "var(--accent)",
                    }}
                  />
                </div>
                <div className="stat-list">
                  <div className="stat-row">
                    <span className="stat-key">やりとりした日</span>
                    <span className="stat-val">{side.days} 日</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-key">1日平均</span>
                    <span className="stat-val">{fmtNum(side.avg)} 件</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-key">文字数</span>
                    <span className="stat-val">{fmtInt(side.chars)} 字</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-key">いちばん多い日</span>
                    <span className="stat-val">
                      {fmtDateJP(side.peak.date)}・{fmtInt(side.peak.total)}件
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <SplitBar a={side.a} b={side.b} aLabel={side.aName} bLabel={side.bName} />
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <CardHead title="差分" sub={`${current.label} − ${other.label}`} icon="detail" />
            <div className="stat-list">
              <div className="stat-row">
                <span className="stat-key">メッセージ数</span>
                <span className="stat-val">
                  <TrendBadge value={current.total - other.total} suffix="件" />
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-key">1日平均</span>
                <span className="stat-val">
                  <TrendBadge value={current.avg - other.avg} suffix="件" />
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-key">文字数</span>
                <span className="stat-val">
                  <TrendBadge value={current.chars - other.chars} suffix="字" />
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-key">やりとりした日</span>
                <span className="stat-val">
                  <TrendBadge value={current.days - other.days} suffix="日" />
                </span>
              </div>
            </div>
            <p className="small muted" style={{ marginTop: 12, lineHeight: 1.8 }}>
              {current.total === other.total
                ? "ぴったり同じくらいのやりとりです。"
                : current.total > other.total
                  ? `${current.label}のほうが ${fmtInt(current.total - other.total)} 件多く話しています。`
                  : `${other.label}のほうが ${fmtInt(other.total - current.total)} 件多く話しています。`}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
