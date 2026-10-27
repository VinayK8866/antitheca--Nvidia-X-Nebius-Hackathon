"use client";

import { useState } from "react";
import { Sparkles, Moon, ArrowRight, ShieldCheck, Zap, Globe, RefreshCw, Clock, History, CheckCircle2, Send, Bell, ExternalLink, AlertCircle } from "lucide-react";

export default function DailyBriefingView({ briefing, onTriggerReplay, isReplaying, schedulerStatus, onSimulateSchedule, onTestDispatch }) {
  const isCronActive = schedulerStatus?.is_enabled ?? true;
  const timeUntilSleep = schedulerStatus?.time_until_sleep_cycle || "12h 4m";
  const recentRuns = schedulerStatus?.recent_runs || [];

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
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: "28px 32px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderLeft: "4px solid var(--accent-primary)",
        flexWrap: "wrap",
        gap: "18px"
      }}>
        <div style={{ flex: 1, minWidth: "320px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              borderRadius: "6px",
              background: "var(--accent-light)",
              color: "var(--accent-primary)",
              fontSize: "0.75rem",
              fontWeight: "700",
              textTransform: "uppercase"
            }}>
              <Moon size={13} />
              Autonomous Overnight Synthesis
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>
              {briefing?.briefing_date || "Today's Briefing"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            {briefing?.headline || "What AntiTheca Thought About While You Slept"}
          </h1>
          <p style={{ marginTop: "6px", fontSize: "0.92rem", color: "var(--text-secondary)", maxWidth: "680px" }}>
            While inactive, AntiTheca scans newly ingested notes and reels, detects hidden topological bridges, verifies open questions via Tavily, and stress-tests assumptions with NVIDIA Nemotron 3 Ultra 550B.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={onTriggerReplay}
            disabled={isReplaying}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "var(--accent-gradient)",
              color: "#ffffff",
              fontSize: "0.88rem",
              fontWeight: "600",
              cursor: isReplaying ? "not-allowed" : "pointer",
              boxShadow: "var(--shadow-glow)",
              opacity: isReplaying ? 0.75 : 1,
              transition: "transform 0.15s ease"
            }}
          >
            <RefreshCw size={16} className={isReplaying ? "animate-spin" : ""} style={{ animation: isReplaying ? "spin 1s linear infinite" : "none" }} />
            <span>{isReplaying ? "Consolidating Thoughts..." : "Run Replay Cycle Now"}</span>
          </button>

          <button
            onClick={onSimulateSchedule}
            disabled={isReplaying}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
              color: "var(--emerald-wisdom)",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: isReplaying ? "not-allowed" : "pointer"
            }}
          >
            <Moon size={13} />
            <span>Simulate 3:00 AM Cron Sleep</span>
          </button>
        </div>
      </div>

      {/* Autonomous Sleep Cron Status Strip */}
      <div className="glass-panel" style={{
        padding: "14px 22px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-elevated)",
        flexWrap: "wrap",
        gap: "12px",
        fontSize: "0.82rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isCronActive ? "var(--emerald-wisdom)" : "var(--amber-fact)",
            boxShadow: isCronActive ? "0 0 8px var(--emerald-wisdom)" : "none"
          }} />
          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
            Autonomous Sleep Daemon: {isCronActive ? "Active (Every Night at 03:00 AM)" : "Paused"}
          </span>
          <span style={{ color: "var(--text-tertiary)" }}>•</span>
          <span style={{ color: "var(--text-secondary)" }}>
            Next autonomous cycle in: <strong style={{ color: "var(--accent-primary)" }}>{timeUntilSleep}</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)" }}>
          <History size={14} />
          <span>Total Autonomous Executions: <strong>{schedulerStatus?.total_autonomous_runs ?? 0}</strong></span>
        </div>
      </div>

      {/* Morning Dispatch Webhook Trigger (Discord/Slack notification integration) */}
      <div className="glass-panel" style={{
        padding: "16px 22px",
        marginBottom: "24px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(99, 102, 241, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary)"
            }}>
              <Bell size={15} />
            </div>
            <div>
              <div style={{ fontSize: "0.86rem", fontWeight: "700", color: "var(--text-primary)" }}>
                Morning Dispatch Webhook
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-tertiary)" }}>
                Dispatches your 03:00 AM executive brief to Discord, Slack, or Telegram as rich embeds
              </div>
            </div>
          </div>

          {dispatchResult && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.76rem",
              fontWeight: "600",
              background: dispatchResult.status === "delivered" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: dispatchResult.status === "delivered" ? "var(--emerald-wisdom)" : "var(--crimson-challenge)",
              border: `1px solid ${dispatchResult.status === "delivered" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}>
              {dispatchResult.status === "delivered" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
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
            placeholder="Custom Discord / Slack Webhook URL (leave empty to use default mock)"
            style={{
              flex: 1,
              minWidth: "260px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "0.82rem",
              fontFamily: "monospace"
            }}
          />
          <button
            onClick={handleSendDispatch}
            disabled={isDispatching}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--accent-primary)",
              background: "var(--accent-light)",
              color: "var(--accent-primary)",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: isDispatching ? "not-allowed" : "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <Send size={13} className={isDispatching ? "animate-spin" : ""} />
            <span>{isDispatching ? "Dispatching..." : "Send Test Briefing Webhook"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-tertiary)", fontSize: "0.82rem" }}>
            <span>Graph Connections</span>
            <Sparkles size={16} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "8px", color: "var(--text-primary)" }}>
            {briefing?.new_connections || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--emerald-wisdom)", marginTop: "4px" }}>
            Active topological links
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-tertiary)", fontSize: "0.82rem" }}>
            <span>Contradictions Flagged</span>
            <Zap size={16} style={{ color: "var(--crimson-challenge)" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "8px", color: "var(--crimson-challenge)" }}>
            {briefing?.contradictions || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
            Adversarial tensions to review
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-tertiary)", fontSize: "0.82rem" }}>
            <span>External Web Facts</span>
            <Globe size={16} style={{ color: "var(--cyan-tavily)" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "8px", color: "var(--cyan-tavily)" }}>
            {briefing?.gaps_researched || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
            Verified via Tavily AI Search
          </div>
        </div>
      </div>

      {/* Main Synthesis Markdown Body */}
      <div className="glass-panel" style={{ padding: "32px", lineHeight: "1.65" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={18} style={{ color: "var(--accent-primary)" }} />
          Daily Executive Synthesis (NVIDIA Nemotron 3 Ultra 550B)
        </h3>

        {briefing?.summary_markdown ? (
          <div style={{
            fontSize: "0.95rem",
            color: "var(--text-secondary)",
            whiteSpace: "pre-wrap",
            fontFamily: "inherit"
          }}>
            {briefing.summary_markdown}
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>
            <p style={{ fontSize: "1rem" }}>No overnight briefings generated yet.</p>
            <p style={{ fontSize: "0.85rem", marginTop: "6px" }}>Click "Run Replay Cycle Now" above or ingest new notes to trigger autonomous consolidation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
