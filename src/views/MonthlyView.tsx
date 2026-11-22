import { useMemo } from "react";
import { BarSeries } from "../components/charts";
import { Card, CardHead, Kpi, SplitBar, StatRow } from "../components/ui";
import { monthlyStats } from "../lib/analytics";
import { fmtDateJP, fmtInt, fmtMonth } from "../lib/format";
import type { BaseViewProps } from "./types";

export function MonthlyView({ chat }: BaseViewProps) {
  const monthly = useMemo(() => [...monthlyStats(chat.RAW)].reverse(), [chat.RAW]);
  const total = monthly.reduce((s, m) => s + m.total, 0);
  const best = monthly.reduce((b, m) => (m.total > b.total ? m : b), monthly[0]);
  const avg = total / Math.max(1, monthly.length);
  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const diff = last && prev ? last.total - prev.total : 0;

  return (
    <div className="stack">
      <div className="grid grid-4">
        <Kpi label="トークした月" icon="monthly" value={fmtInt(monthly.length)} unit="ヶ月" foot={<span>{fmtMonth(monthly[0].ym)}〜</span>} />
        <Kpi label="月平均" icon="detail" value={fmtInt(avg)} unit="件" foot={<span>1ヶ月あたり</span>} />
        <Kpi
          label="いちばん話した月"
          icon="sparkles"
          value={fmtMonth(best.ym)}
          accent="var(--b)"
          foot={<span>{fmtInt(best.total)} 件</span>}
        />
        <Kpi
          label="先月との比較"
          icon="compare"
          value={
            prev ? (
              <span className={diff >= 0 ? "pos" : "neg"}>
                {diff >= 0 ? "+" : "−"}
                {fmtInt(Math.abs(diff))}
              </span>
            ) : (
              "—"
            )
          }
          unit={prev ? "件" : undefined}
          foot={<span>{last && prev ? `${fmtMonth(last.ym)} と ${fmtMonth(prev.ym)}` : "比較できる月がありません"}</span>}
        />
      </div>

      <Card>
        <CardHead title="月ごとのメッセージ数" sub="古い月から新しい月へ" icon="monthly" />
        <BarSeries
          values={monthly.map((m) => m.total)}
          labels={monthly.map((m) => fmtMonth(m.ym))}
          height={230}
          colorFor={(i) => (monthly[i].ym === best.ym ? "var(--b)" : "var(--a)")}
          ariaLabel="月ごとのメッセージ数"
        />
      </Card>

      <div className="grid grid-main">
        <Card>
          <CardHead title="月別の内訳" sub="月ごとの件数と、いちばん話した日" icon="history" />
          <div className="stat-list">
            {[...monthly].reverse().map((m) => (
              <div key={m.ym} style={{ padding: "11px 0", borderBottom: "1px dashed var(--border)" }}>
                <div className="spread" style={{ marginBottom: 6 }}>
                  <strong style={{ fontSize: 13 }}>{fmtMonth(m.ym)}</strong>
                  <span className="tnum" style={{ fontWeight: 700 }}>
                    {fmtInt(m.total)} <span className="faint small">件</span>
                  </span>
                </div>
                <SplitBar a={m.a} b={m.b} aLabel={chat.names.a} bLabel={chat.names.b} />
                <div className="small muted" style={{ marginTop: 6 }}>
                  {m.days} 日・いちばん多い日 {fmtDateJP(m.topDay.date)}（{fmtInt(m.topDay.total)}件）
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="stack">
          <Card>
            <CardHead title="累計" icon="calendar" />
            <div className="stat-list">
              <StatRow label="総メッセージ数" value={`${fmtInt(total)} 件`} />
              <StatRow label="総文字数" value={`${fmtInt(monthly.reduce((s, m) => s + m.chars, 0))} 字`} />
              <StatRow label="いちばん多い月" value={fmtMonth(best.ym)} />
              <StatRow label="その月の件数" value={`${fmtInt(best.total)} 件`} />
            </div>
          </Card>
          <Card>
            <CardHead title="成長のようす" icon="detail" />
            <p className="small muted" style={{ lineHeight: 1.9 }}>
              {last && prev
                ? diff >= 0
                  ? `${fmtMonth(last.ym)} は前の月より ${fmtInt(diff)} 件多く、会話が増えています。`
                  : `${fmtMonth(last.ym)} は前の月より ${fmtInt(Math.abs(diff))} 件少なめです。`
                : "月をまたいだ比較には、2ヶ月以上のデータが必要です。"}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
