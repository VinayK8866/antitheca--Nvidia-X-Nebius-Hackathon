"use client";

import { useState } from "react";
import { Sparkles, Moon, ArrowRight, ShieldCheck, Zap, Globe, RefreshCw } from "lucide-react";

export default function DailyBriefingView({ briefing, onTriggerReplay, isReplaying }) {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: "28px 32px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderLeft: "4px solid var(--accent-primary)"
      }}>
        <div>
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
              Neuroscience Memory Consolidation
            </span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>
              {briefing?.briefing_date || "Today's Briefing"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            {briefing?.headline || "What Engram Thought About While You Slept"}
          </h1>
          <p style={{ marginTop: "6px", fontSize: "0.92rem", color: "var(--text-secondary)", maxWidth: "680px" }}>
            While inactive, Engram scans newly ingested notes, detects hidden bridges in your knowledge graph, verifies open questions via Tavily, and stress-tests assumptions with NVIDIA Nemotron 3 Ultra.
          </p>
        </div>

        <div>
          <button
            onClick={onTriggerReplay}
            disabled={isReplaying}
            style={{
              display: "flex",
              alignItems: "center",
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
