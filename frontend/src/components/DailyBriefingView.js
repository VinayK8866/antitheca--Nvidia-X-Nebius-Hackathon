"use client";

import { useState } from "react";
import { Sparkles, Moon, ArrowRight, Globe, RefreshCw, Clock, History, CheckCircle2, Send, Bell, ExternalLink, AlertCircle, Zap, ShieldAlert } from "lucide-react";

export default function DailyBriefingView({ briefing, onTriggerReplay, isReplaying, schedulerStatus, onSimulateSchedule, onTestDispatch }) {
  const isCronActive = schedulerStatus?.is_enabled ?? true;
  const timeUntilSleep = schedulerStatus?.time_until_sleep_cycle || "12h 4m";

  const [webhookUrl, setWebhookUrl] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  const handleSendDispatch = async () => {
    if (!onTestDispatch) return;
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await onTestDispatch(webhookUrl || undefined);
      setDispatchResult(res);
    } catch (err) {
      setDispatchResult({ status: "failed", error: err.message });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "36px 28px" }}>
      {/* Top Section Header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "24px",
        marginBottom: "28px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span className="engram-mono-badge">
              <Moon size={12} />
              COGNITIVE CONSOLIDATION
            </span>
            <span style={{
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
              fontSize: "0.78rem",
              color: "var(--text-muted)"
            }}>
              {briefing?.briefing_date || "Today's Briefing"}
            </span>
          </div>

          <h2 style={{
            fontSize: "1.9rem",
            fontWeight: "600",
            letterSpacing: "-0.03em",
            color: "var(--text-primary)"
          }}>
            {briefing?.headline || "What AntiTheca Thought About While You Slept"}
          </h2>
          <p style={{
            marginTop: "8px",
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            maxWidth: "720px",
            lineHeight: "1.6"
          }}>
            Every night at 03:00 AM, the autonomous engine scans your multimodal notes, detects topological bridges across concepts, flags dialectical paradoxes, and synthesizes external truth via Tavily.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={onTriggerReplay}
            disabled={isReplaying}
            className="engram-btn-primary"
            style={{ padding: "10px 20px" }}
          >
            <RefreshCw size={15} className={isReplaying ? "animate-spin" : ""} />
            <span>{isReplaying ? "Consolidating State..." : "Run Replay Cycle"}</span>
          </button>

          <button
            onClick={onSimulateSchedule}
            disabled={isReplaying}
            className="engram-btn-secondary"
            style={{ padding: "10px 18px" }}
          >
            <Moon size={14} />
            <span>Simulate 3:00 AM Cron</span>
          </button>
        </div>
      </div>

      {/* Autonomous Sleep Cron Status Bar */}
      <div className="engram-card" style={{
        padding: "16px 24px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="live-pulse-dot" style={{
            background: isCronActive ? "var(--emerald-wisdom)" : "var(--amber-fact)",
            boxShadow: isCronActive ? "0 0 8px var(--emerald-wisdom)" : "none"
          }} />
          <span style={{ fontWeight: "600", fontSize: "0.86rem", color: "var(--text-primary)" }}>
            Autonomous Sleep Daemon: {isCronActive ? "Active (Every Night at 03:00 AM)" : "Paused"}
          </span>
          <span style={{ color: "var(--text-muted)" }}>•</span>
          <span style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.82rem",
            color: "var(--text-secondary)"
          }}>
            Next autonomous consolidation in: <strong style={{ color: "var(--text-primary)" }}>{timeUntilSleep}</strong>
          </span>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.78rem",
          color: "var(--text-muted)"
        }}>
          <History size={14} />
          <span>Total Executions: <strong style={{ color: "var(--text-primary)" }}>{schedulerStatus?.total_autonomous_runs ?? 0}</strong></span>
        </div>
      </div>

      {/* Metrics Row (Scoreboard Aesthetics) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
        marginBottom: "28px"
      }}>
        <div className="scoreboard-box">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="scoreboard-label" style={{ marginTop: 0 }}>GRAPH CONNECTIONS</span>
            <Sparkles size={16} style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="scoreboard-num">
            {briefing?.new_connections || 0}
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--emerald-wisdom)", marginTop: "6px" }}>
            Active topological bridges formed
          </div>
        </div>

        <div className="scoreboard-box">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="scoreboard-label" style={{ marginTop: 0 }}>PARADOXES FLAGGED</span>
            <Zap size={16} style={{ color: "var(--crimson-challenge)" }} />
          </div>
          <div className="scoreboard-num" style={{ color: "var(--crimson-challenge)" }}>
            {briefing?.contradictions || 0}
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Dialectical contradictions under review
          </div>
        </div>

        <div className="scoreboard-box">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="scoreboard-label" style={{ marginTop: 0 }}>EXTERNAL WEB FACTS</span>
            <Globe size={16} style={{ color: "var(--cyan-tavily)" }} />
          </div>
          <div className="scoreboard-num">
            {briefing?.gaps_researched || 0}
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Verified via Tavily AI Search
          </div>
        </div>
      </div>

      {/* Morning Dispatch Webhook Panel */}
      <div className="engram-card" style={{
        padding: "20px 24px",
        marginBottom: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-primary)"
            }}>
              <Bell size={15} />
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Morning Executive Webhook
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                Dispatches your 03:00 AM synthesis to Discord, Slack, or Telegram as rich embeds
              </div>
            </div>
          </div>

          {dispatchResult && (
            <div className="engram-mono-badge" style={{
              borderColor: dispatchResult.status === "delivered" ? "var(--emerald-border)" : "var(--crimson-border)",
              color: dispatchResult.status === "delivered" ? "var(--emerald-wisdom)" : "var(--crimson-challenge)",
              background: dispatchResult.status === "delivered" ? "var(--emerald-bg)" : "var(--crimson-bg)"
            }}>
              {dispatchResult.status === "delivered" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              <span>
                {dispatchResult.status === "delivered"
                  ? `Delivered (${dispatchResult.code || "HTTP 200"})`
                  : `Failed: ${dispatchResult.error || "Unknown error"}`}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="Custom Discord / Slack Webhook URL (leave empty to use default mock endpoint)"
            style={{
              flex: 1,
              minWidth: "260px",
              padding: "9px 14px",
              borderRadius: "7px",
              border: "1px solid var(--border-hairline)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "0.82rem",
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
              outline: "none"
            }}
          />
          <button
            onClick={handleSendDispatch}
            disabled={isDispatching}
            className="engram-btn-secondary"
            style={{ padding: "8px 16px" }}
          >
            <Send size={13} className={isDispatching ? "animate-spin" : ""} />
            <span>{isDispatching ? "Dispatching..." : "Send Test Webhook"}</span>
          </button>
        </div>
      </div>

      {/* Main Executive Synthesis Markdown Body (Engram Scientific Style) */}
      <div className="engram-card" style={{ padding: "36px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-hairline)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={17} style={{ color: "var(--text-primary)" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Daily Executive Synthesis
            </h3>
          </div>

          <span className="engram-mono-badge">
            NVIDIA NEMOTRON 3 ULTRA 550B
          </span>
        </div>

        {briefing?.summary_markdown ? (
          <div style={{
            fontSize: "0.96rem",
            color: "var(--text-secondary)",
            whiteSpace: "pre-wrap",
            lineHeight: "1.75",
            fontFamily: "var(--font-geist-sans), 'Inter', sans-serif"
          }}>
            {briefing.summary_markdown}
          </div>
        ) : (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-tertiary)" }}>
            <p style={{ fontSize: "1.05rem", fontWeight: "500", color: "var(--text-primary)" }}>
              No overnight briefings generated yet.
            </p>
            <p style={{ fontSize: "0.85rem", marginTop: "6px" }}>
              Click "Run Replay Cycle" above or ingest new notes to trigger autonomous consolidation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
