import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Card, CardHead, Segmented } from "../components/ui";
import { fmtDateJP, fmtInt } from "../lib/format";
import type { BaseViewProps } from "./types";

export function ReplayView({ chat }: BaseViewProps) {
  const days = useMemo(() => [...new Set(chat.messages.map((m) => m.date))], [chat.messages]);
  const [day, setDay] = useState(() => days[days.length - 1] || "");
  const dayMessages = useMemo(() => chat.messages.filter((m) => m.date === day), [chat.messages, day]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    setPlaying(false);
  }, [day]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const interval = Math.max(120, 420 / speed);
    const step = (now: number) => {
      acc += now - last;
      last = now;
      while (acc >= interval && indexRef.current < dayMessages.length) {
        acc -= interval;
        indexRef.current += 1;
        setIndex(indexRef.current);
      }
      if (indexRef.current >= dayMessages.length) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, dayMessages.length]);

  useEffect(() => {
    const el = stageRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [index]);

  const visible = dayMessages.slice(0, index);
  const progress = dayMessages.length ? (index / dayMessages.length) * 100 : 0;
  const current = dayMessages[Math.min(index, dayMessages.length - 1)];

  return (
    <div className="stack">
      <div className="grid grid-main">
        <Card>
          <CardHead
            title="トーク再生"
            sub={day ? `${fmtDateJP(day)}・${fmtInt(dayMessages.length)}件` : "日付を選んでください"}
            icon="play"
            right={
              <select
                className="select"
                style={{ width: "auto", minWidth: 150 }}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                aria-label="再生する日を選ぶ"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {fmtDateJP(d)}
                  </option>
                ))}
              </select>
            }
          />

          <div className="replay-stage" ref={stageRef} aria-live="polite">
            {visible.length === 0 && (
              <div className="chart-empty">「再生」を押すと、この日の会話が流れます。</div>
            )}
            {visible.map((m, i) => {
              const showDate = i === 0;
              return (
                <div key={i} style={{ display: "contents" }}>
                  {showDate && <div className="replay-day-label">{fmtDateJP(m.date)}</div>}
                  <div
                    className={`bubble ${m.sender === chat.names.a ? "a" : "b"}`}
                    style={{
                      alignSelf: m.sender === chat.names.a ? "flex-start" : "flex-end",
                      animation: "fadeIn .3s var(--ease) both",
                    }}
                  >
                    <div className="bubble-meta">
                      <span>{m.sender}</span>
                      <span>{m.time}</span>
                    </div>
                    <span className={m.type !== "text" ? "msg-type" : ""}>{m.content}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="replay-controls">
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => {
                if (index >= dayMessages.length) {
                  indexRef.current = 0;
                  setIndex(0);
                }
                setPlaying((p) => !p);
              }}
              aria-label={playing ? "一時停止" : "再生"}
            >
              <Icon name={playing ? "pause" : "play"} size={14} />
              {playing ? "一時停止" : index >= dayMessages.length ? "もう一度" : "再生"}
            </button>
            <button type="button" className="btn" onClick={() => { setPlaying(false); indexRef.current = 0; setIndex(0); }}>
              <Icon name="refresh" size={14} />
              最初から
            </button>
            <div className="progress-track" aria-hidden="true">
              <i style={{ width: `${progress}%` }} />
            </div>
            <span className="small muted tnum">
              {Math.min(index, dayMessages.length)} / {dayMessages.length}
            </span>
            <Segmented
              options={[
                { key: "1", label: "1x" },
                { key: "2", label: "2x" },
                { key: "4", label: "4x" },
              ]}
              value={String(speed)}
              onChange={(v) => setSpeed(Number(v))}
              ariaLabel="再生スピード"
              small
            />
          </div>
        </Card>

        <div className="stack">
          <Card>
            <CardHead title="この日について" icon="info" />
            {dayMessages.length > 0 ? (
              <div className="stat-list">
                <div className="stat-row">
                  <span className="stat-key">メッセージ</span>
                  <span className="stat-val">{fmtInt(dayMessages.length)} 件</span>
                </div>
                <div className="stat-row">
                  <span className="stat-key">最初のメッセージ</span>
                  <span className="stat-val">{dayMessages[0].time}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-key">最後のメッセージ</span>
                  <span className="stat-val">{dayMessages[dayMessages.length - 1].time}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-key">いま表示中</span>
                  <span className="stat-val">{current ? current.time : "—"}</span>
                </div>
              </div>
            ) : (
              <div className="chart-empty">この日のメッセージはありません</div>
            )}
          </Card>
          <Card>
            <CardHead title="ヒント" icon="zap" />
            <p className="small muted" style={{ lineHeight: 1.9 }}>
              再生スピードを上げると、短い時間で一日の流れを追えます。長い日は 4x がおすすめです。
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
