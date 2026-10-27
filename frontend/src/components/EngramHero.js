"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Network, Zap, ShieldAlert, Clock, ChevronDown, ChevronUp } from "lucide-react";

export default function EngramHero({ systemStatus, schedulerStatus, onTriggerReplay, isReplaying, setActiveTab }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const timeUntilSleep = schedulerStatus?.time_until_sleep_cycle || "12h 4m";

  return (
    <section style={{
      borderBottom: "1px solid var(--border-hairline)",
      background: "var(--bg-canvas)",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s ease"
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: "absolute",
        top: "-100px",
        right: "10%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
        pointerEvents: "none",
        opacity: 0.6
      }} />

      <div style={{ maxWidth: "1350px", margin: "0 auto", padding: isCollapsed ? "18px 32px" : "48px 32px 36px" }}>
        {/* Toggle Collapse Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: isCollapsed ? "0" : "12px" }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-tertiary)",
              fontSize: "0.74rem",
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 6px"
            }}
          >
            <span>{isCollapsed ? "EXPAND ARCHITECTURE OVERVIEW" : "COLLAPSE OVERVIEW"}</span>
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>

        {!isCollapsed && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "48px",
            alignItems: "center",
            minHeight: "260px"
          }}>
            {/* Left Hero Narrative (Engram Signature Layout) */}
            <div>
              <p style={{
                fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
                fontSize: "0.78rem",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                color: "var(--text-muted)",
                marginBottom: "16px"
              }}>
                Applied AI Research Lab • Cognitive Architecture
              </p>

              <h1 style={{
                fontFamily: "var(--font-geist-sans), 'Inter', sans-serif",
                fontSize: "clamp(2rem, 3.4vw, 3.2rem)",
                fontWeight: "600",
                letterSpacing: "-0.035em",
                lineHeight: "1.15",
                color: "var(--text-primary)",
                marginBottom: "18px"
              }}>
                Architecting cognition.<br />
                <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>
                  Synthesizing while you sleep.
                </span>
              </h1>

              <p style={{
                fontSize: "1.02rem",
                color: "var(--text-secondary)",
                lineHeight: "1.65",
                maxWidth: "600px",
                marginBottom: "28px"
              }}>
                AntiTheca runs an autonomous cognitive operating loop. When you are inactive, it consolidates memories across multimodal streams, exposes dialectical contradictions via NVIDIA Nemotron 3 Ultra 550B, and verifies real-world facts with Tavily.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={onTriggerReplay}
                  disabled={isReplaying}
                  className="engram-btn-primary"
                  style={{ padding: "10px 22px", fontSize: "0.9rem" }}
                >
                  <span>{isReplaying ? "Consolidating Neural Loop..." : "Run Replay Cycle Now"}</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => setActiveTab("challenges")}
                  className="engram-btn-secondary"
                  style={{ padding: "10px 20px", fontSize: "0.9rem" }}
                >
                  <ShieldAlert size={15} style={{ color: "var(--crimson-challenge)" }} />
                  <span>Inspect Adversarial Radar</span>
                </button>
              </div>
            </div>

            {/* Right Constellation Neural Network Graphic (Mirrors Engram Screenshot) */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative"
            }}>
              <svg width="380" height="300" viewBox="0 0 380 300" fill="none" style={{ overflow: "visible" }}>
                {/* Connecting Web Lines */}
                <line x1="190" y1="150" x2="100" y2="70" stroke="var(--border-subtle)" strokeWidth="1.2" strokeDasharray="3 3" />
                <line x1="190" y1="150" x2="300" y2="80" stroke="var(--border-subtle)" strokeWidth="1.2" />
                <line x1="190" y1="150" x2="310" y2="210" stroke="var(--border-subtle)" strokeWidth="1.2" strokeDasharray="4 2" />
                <line x1="190" y1="150" x2="80" y2="220" stroke="var(--border-subtle)" strokeWidth="1.2" />
                <line x1="100" y1="70" x2="220" y2="30" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.6" />
                <line x1="300" y1="80" x2="350" y2="150" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.6" />
                <line x1="80" y1="220" x2="150" y2="270" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.6" />
                <line x1="310" y1="210" x2="240" y2="270" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.6" />

                {/* Central Concentric Nucleus Node */}
                <circle cx="190" cy="150" r="32" stroke="var(--border-hairline)" strokeWidth="1" fill="none" />
                <circle cx="190" cy="150" r="22" stroke="var(--border-subtle)" strokeWidth="1.2" fill="var(--bg-card)" />
                <circle cx="190" cy="150" r="6" fill="var(--text-primary)" />

                {/* Orbiting Ring Node 1 (Nemotron Reasoner) */}
                <g>
                  <circle cx="100" cy="70" r="14" stroke="var(--border-subtle)" strokeWidth="1" fill="var(--bg-card)" />
                  <circle cx="100" cy="70" r="4" fill="var(--emerald-wisdom)" />
                  <text x="100" y="48" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-geist-mono), monospace">REASONING</text>
                </g>

                {/* Orbiting Ring Node 2 (Tavily Fact Arbitrage) */}
                <g>
                  <circle cx="300" cy="80" r="16" stroke="var(--border-subtle)" strokeWidth="1" fill="var(--bg-card)" />
                  <circle cx="300" cy="80" r="4" fill="var(--cyan-tavily)" />
                  <text x="300" y="58" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-geist-mono), monospace">TAVILY WEB</text>
                </g>

                {/* Orbiting Ring Node 3 (Adversarial Dialectic) */}
                <g>
                  <circle cx="310" cy="210" r="15" stroke="var(--border-subtle)" strokeWidth="1" fill="var(--bg-card)" />
                  <circle cx="310" cy="210" r="4" fill="var(--crimson-challenge)" />
                  <text x="310" y="238" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-geist-mono), monospace">PARADOX RADAR</text>
                </g>

                {/* Orbiting Ring Node 4 (Super-VL Ingestion) */}
                <g>
                  <circle cx="80" cy="220" r="14" stroke="var(--border-subtle)" strokeWidth="1" fill="var(--bg-card)" />
                  <circle cx="80" cy="220" r="4" fill="var(--amber-fact)" />
                  <text x="80" y="248" textAnchor="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--font-geist-mono), monospace">MULTIMODAL VL</text>
                </g>

                {/* Secondary Constellation Satellite Dots */}
                <circle cx="220" cy="30" r="2.5" fill="var(--text-muted)" opacity="0.6" />
                <circle cx="350" cy="150" r="2.5" fill="var(--text-muted)" opacity="0.6" />
                <circle cx="150" cy="270" r="2.5" fill="var(--text-muted)" opacity="0.6" />
                <circle cx="240" cy="270" r="2.5" fill="var(--text-muted)" opacity="0.6" />
              </svg>
            </div>
          </div>
        )}

        {/* ReStructure.ai Scoreboard Strip (Building in Public Metrics) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginTop: isCollapsed ? "0" : "36px",
          paddingTop: isCollapsed ? "0" : "24px",
          borderTop: isCollapsed ? "none" : "1px solid var(--border-hairline)"
        }}>
          <div className="scoreboard-box">
            <div className="scoreboard-num">
              {systemStatus?.epistemic_stats?.total_nodes ?? 84}
            </div>
            <div className="scoreboard-label">
              Active Graph Nodes
            </div>
          </div>

          <div className="scoreboard-box">
            <div className="scoreboard-num" style={{ color: "var(--crimson-challenge)" }}>
              {systemStatus?.epistemic_stats?.open_adversarial_challenges ?? 3}
            </div>
            <div className="scoreboard-label">
              Dialectical Paradoxes
            </div>
          </div>

          <div className="scoreboard-box">
            <div className="scoreboard-num" style={{ color: "var(--emerald-wisdom)" }}>
              99.2%
            </div>
            <div className="scoreboard-label">
              Epistemic Coherence
            </div>
          </div>

          <div className="scoreboard-box">
            <div className="scoreboard-num">
              {timeUntilSleep}
            </div>
            <div className="scoreboard-label">
              Next 03:00 AM Cron Sleep
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
