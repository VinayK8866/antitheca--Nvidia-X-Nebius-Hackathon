"use client";

import { ArrowRight, Sparkles, Network, Zap, ShieldAlert, Clock, Compass } from "lucide-react";
import CognitiveReactor from "./CognitiveReactor";

export default function EngramHero({ systemStatus, schedulerStatus, onTriggerReplay, isReplaying, setActiveTab }) {
  const timeUntilSleep = schedulerStatus?.time_until_sleep_cycle || "12h 4m";

  return (
    <section style={{
      height: "calc(100vh - 64px)",
      maxHeight: "calc(100vh - 64px)",
      overflow: "hidden",
      background: "var(--bg-canvas)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "clamp(18px, 2.8vh, 36px) clamp(24px, 3.8vw, 54px)"
    }}>
      {/* Main Hero & Cognitive Reactor Grid Split (Expanded canvas to left) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "0.85fr 1.15fr",
        gap: "24px",
        alignItems: "center",
        flex: 1,
        minHeight: 0,
        position: "relative"
      }}>
        {/* Left Hero Narrative (Positioned cleanly above expanded canvas) */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
          maxWidth: "520px"
        }}>
          <p style={{
            fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
            fontSize: "clamp(0.72rem, 0.95vw, 0.8rem)",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "var(--text-muted)",
            marginBottom: "clamp(8px, 1.4vh, 16px)"
          }}>
            Applied AI Research Lab • Cognitive Architecture
          </p>

          <h1 style={{
            fontFamily: "var(--font-geist-sans), 'Inter', sans-serif",
            fontSize: "clamp(2rem, 3.4vw, 3.2rem)",
            fontWeight: "600",
            letterSpacing: "-0.035em",
            lineHeight: "1.12",
            color: "var(--text-primary)",
            marginBottom: "clamp(10px, 1.6vh, 18px)"
          }}>
            Architecting cognition.<br />
            <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>
              Synthesizing while you sleep.
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(0.86rem, 1.1vw, 0.98rem)",
            color: "var(--text-secondary)",
            lineHeight: "1.6",
            maxWidth: "580px",
            marginBottom: "clamp(16px, 2.2vh, 26px)"
          }}>
            AntiTheca runs an autonomous cognitive operating loop. When you are inactive, it consolidates memories across multimodal streams, exposes dialectical contradictions via NVIDIA Nemotron 3 Ultra 550B, and verifies real-world facts with Tavily.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTab("replay")}
              className="engram-btn-primary"
              style={{ padding: "9px 20px", fontSize: "0.86rem" }}
            >
              <span>Explore Cognitive Replay</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setActiveTab("graph")}
              className="engram-btn-secondary"
              style={{ padding: "9px 18px", fontSize: "0.86rem" }}
            >
              <Network size={14} style={{ color: "var(--text-primary)" }} />
              <span>Knowledge Topology</span>
            </button>

            <button
              onClick={() => setActiveTab("challenges")}
              className="engram-btn-secondary"
              style={{ padding: "9px 18px", fontSize: "0.86rem" }}
            >
              <ShieldAlert size={14} style={{ color: "var(--crimson-challenge)" }} />
              <span>Adversarial Radar</span>
            </button>
          </div>
        </div>

        {/* Right Dynamic Interactive Reactor Motion Graphics (Open, Free & Borderless) */}
        <div style={{
          height: "100%",
          width: "calc(100% + clamp(20px, 4vw, 60px))",
          marginLeft: "clamp(-60px, -4vw, -20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minHeight: 0,
          zIndex: 1
        }}>
          <CognitiveReactor setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* ReStructure.ai Scoreboard Strip (Pinned to bottom) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "14px",
        paddingTop: "16px",
        borderTop: "1px solid var(--border-hairline)",
        flexShrink: 0
      }}>
        <div className="scoreboard-box" style={{ padding: "clamp(10px, 1.8vh, 16px) clamp(14px, 1.6vw, 22px)" }}>
          <div className="scoreboard-num" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2.1rem)" }}>
            {systemStatus?.epistemic_stats?.total_nodes ?? 84}
          </div>
          <div className="scoreboard-label">
            Active Graph Nodes
          </div>
        </div>

        <div className="scoreboard-box" style={{ padding: "clamp(10px, 1.8vh, 16px) clamp(14px, 1.6vw, 22px)" }}>
          <div className="scoreboard-num" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2.1rem)", color: "var(--crimson-challenge)" }}>
            {systemStatus?.epistemic_stats?.open_adversarial_challenges ?? 3}
          </div>
          <div className="scoreboard-label">
            Dialectical Paradoxes
          </div>
        </div>

        <div className="scoreboard-box" style={{ padding: "clamp(10px, 1.8vh, 16px) clamp(14px, 1.6vw, 22px)" }}>
          <div className="scoreboard-num" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2.1rem)", color: "var(--emerald-wisdom)" }}>
            99.2%
          </div>
          <div className="scoreboard-label">
            Epistemic Coherence
          </div>
        </div>

        <div className="scoreboard-box" style={{ padding: "clamp(10px, 1.8vh, 16px) clamp(14px, 1.6vw, 22px)" }}>
          <div className="scoreboard-num" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2.1rem)" }}>
            {timeUntilSleep}
          </div>
          <div className="scoreboard-label">
            Next 03:00 AM Cron Sleep
          </div>
        </div>
      </div>
    </section>
  );
}
