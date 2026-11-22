import { useMemo } from "react";
import { Icon } from "../components/Icon";
import { Card, CardHead, Kpi, StatRow } from "../components/ui";
import { milestones } from "../lib/analytics";
import { fmtDateJP, fmtInt } from "../lib/format";
import type { BaseViewProps } from "./types";

export function StreakView({ chat, stats }: BaseViewProps) {
  const { currentStreak, longestStreak, topStreaks, streaks } = stats;
  const info = useMemo(() => milestones(chat.RAW), [chat.RAW]);

  const last60 = useMemo(() => {
    const set = new Set(chat.RAW.map((d) => d.date));
    const lastDate = chat.RAW[chat.RAW.length - 1].date;
    const out: { date: string; talked: boolean }[] = [];
    const end = new Date(`${lastDate}T00:00:00`);
    for (let i = 59; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({ date: key, talked: set.has(key) });
    }
    return out;
  }, [chat.RAW]);

  const progress = info.isExact
    ? 100
    : Math.round(((info.distinctDays % 50) / 50) * 100);

  return (
    <div className="stack">
      <div className="grid grid-4">
        <Kpi
          label="いまの連続記録"
          icon="flame"
          value={currentStreak ? fmtInt(currentStreak.length) : "0"}
          unit="日"
          accent="var(--b)"
          foot={<span>{currentStreak ? `${fmtDateJP(currentStreak.start)}〜` : "連続記録なし"}</span>}
        />
        <Kpi
          label="最長の連続記録"
          icon="sparkles"
          value={longestStreak ? fmtInt(longestStreak.length) : "0"}
          unit="日"
          foot={<span>{longestStreak ? `${fmtDateJP(longestStreak.start)}〜${fmtDateJP(longestStreak.end)}` : "—"}</span>}
        />
        <Kpi
          label="累計トーク日数"
          icon="calendar"
          value={fmtInt(info.distinctDays)}
          unit="日"
          foot={<span>次の目標まで {Math.max(0, info.nextTarget - info.distinctDays)} 日</span>}
        />
        <Kpi
          label="連続記録の回数"
          icon="history"
          value={fmtInt(streaks.length)}
          unit="回"
          foot={<span>2日以上の記録 {streaks.filter((s) => s.length >= 2).length} 回</span>}
        />
      </div>

      <div className="grid grid-main">
        <div className="stack">
        <Card>
          <CardHead title="直近60日のやりとり" sub="話した日に色がつきます" icon="calendar" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(18px, 1fr))",
              gap: 5,
              marginTop: 4,
            }}
            role="img"
            aria-label={`直近60日のうち${last60.filter((d) => d.talked).length}日にやりとりがあります`}
          >
            {last60.map((d) => (
              <div
                key={d.date}
                title={`${fmtDateJP(d.date)} ${d.talked ? "やりとりあり" : "なし"}`}
                style={{
                  aspectRatio: "1",
                  borderRadius: 5,
                  background: d.talked ? "var(--a)" : "var(--surface-2)",
                  opacity: d.talked ? 0.85 : 1,
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
          <div className="chart-legend" style={{ marginTop: 14 }}>
            <span className="legend-item">
              <i className="legend-swatch" style={{ background: "var(--a)" }} />
              やりとりした日
            </span>
            <span className="legend-item">
              <i className="legend-swatch" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} />
              していない日
            </span>
            <span className="faint" style={{ marginLeft: "auto" }}>
              直近60日で {last60.filter((d) => d.talked).length} 日
            </span>
          </div>
        </Card>

        <Card>
          <CardHead title="記念日・マイルストーン" sub="50日ごとと、トーク開始からの周年" icon="heart" />
          {info.achieved.length === 0 ? (
            <div className="chart-empty">まだマイルストーンに到達していません</div>
          ) : (
            <div className="stat-list">
              {info.achieved.slice(-8).reverse().map((m, i) => (
                <StatRow
                  key={i}
                  label={
                    <span className="row" style={{ gap: 7 }}>
                      <Icon name={m.type === "anniv" ? "heart" : "sparkles"} size={14} />
                      {m.label}
                    </span>
                  }
                  value={m.date ? fmtDateJP(m.date) : m.dateObj ? fmtDateJP(m.dateObj.toISOString().slice(0, 10)) : "—"}
                />
              ))}
            </div>
          )}
        </Card>
        </div>

        <div className="stack">
          <Card>
            <CardHead title="次の目標" sub={`累計 ${fmtInt(info.distinctDays)} 日`} icon="zap" />
            <div className="spread" style={{ alignItems: "flex-end" }}>
              <div className="kpi-value" style={{ fontSize: 28 }}>
                {fmtInt(info.nextTarget)}
                <span className="kpi-unit">日</span>
              </div>
              <span className="pill accent">{progress}%</span>
            </div>
            <div className="meter" style={{ marginTop: 12, height: 10 }}>
              <i style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--a), var(--accent))" }} />
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              {info.isExact
                ? "ちょうど目標日に到達しています。おめでとうございます！"
                : `あと ${Math.max(0, info.nextTarget - info.distinctDays)} 日で次の目標です。`}
            </p>
          </Card>

          <Card>
            <CardHead title="これまでの記録" icon="sparkles" />
            {topStreaks.length === 0 ? (
              <div className="chart-empty">まだ記録がありません</div>
            ) : (
              <div className="stat-list">
                {topStreaks.map((s, i) => (
                  <StatRow
                    key={i}
                    label={
                      <>
                        {i + 1}位・{fmtDateJP(s.start)}〜{fmtDateJP(s.end)}
                      </>
                    }
                    value={`${fmtInt(s.length)} 日`}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
          <CardHead title="連続記録の一覧" sub="2日以上続いた期間" icon="history" />
          <div className="stat-list" style={{ maxHeight: 320, overflowY: "auto" }}>
            {[...streaks]
              .filter((s) => s.length >= 2)
              .sort((a, b) => (a.start < b.start ? 1 : -1))
              .slice(0, 12)
              .map((s, i) => (
                <StatRow
                  key={i}
                  label={`${fmtDateJP(s.start)} 〜 ${fmtDateJP(s.end)}`}
                  value={`${fmtInt(s.length)} 日`}
                />
              ))}
            {streaks.filter((s) => s.length >= 2).length === 0 && (
              <div className="chart-empty">2日以上続いた記録はありません</div>
            )}
          </div>
      </Card>
    </div>
  );
}
