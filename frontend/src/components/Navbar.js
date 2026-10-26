"use client";

import { Brain, Cpu, Sparkles, Network, AlertTriangle, MessageSquareCode, Globe2, Clock, Eye } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ activeTab, setActiveTab, systemStatus, schedulerStatus }) {
  const tabs = [
    { id: "replay", label: "Cognitive Replay", icon: Sparkles },
    { id: "graph", label: "Knowledge Graph", icon: Network },
    { id: "challenges", label: "Adversarial Radar", icon: AlertTriangle, badge: systemStatus?.epistemic_stats?.open_adversarial_challenges },
    { id: "console", label: "Console & Ingest", icon: MessageSquareCode }
  ];

  const isCronActive = schedulerStatus?.is_enabled ?? true;
  const timeUntilSleep = schedulerStatus?.time_until_sleep_cycle || "12h";

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "var(--bg-card)",
      backdropFilter: "var(--glass-blur)",
      borderBottom: "1px solid var(--border-subtle)",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "background-color 0.2s ease"
    }}>
      {/* Brand & Powered By */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "var(--shadow-glow)"
          }}>
            <Brain size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.15rem", fontWeight: "700", letterSpacing: "-0.02em" }}>ENGRAM</span>
              <span style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "var(--accent-light)",
                color: "var(--accent-primary)",
                fontWeight: "700"
              }}>
                PERSONAL AI
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
              The AI That Thinks While You Sleep
            </div>
          </div>
        </div>

        {/* Live Infrastructure Badges */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginLeft: "8px",
          paddingLeft: "14px",
          borderLeft: "1px solid var(--border-subtle)",
          flexWrap: "wrap"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 8px",
            borderRadius: "6px",
            background: "var(--bg-elevated)",
            fontSize: "0.73rem",
            color: "var(--text-secondary)"
          }}>
            <Cpu size={13} style={{ color: "var(--emerald-wisdom)" }} />
            <span>Nebius: <strong>Nemotron Ultra 550B</strong></span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 8px",
            borderRadius: "6px",
            background: "var(--bg-elevated)",
            fontSize: "0.73rem",
            color: "var(--text-secondary)"
          }}>
            <Eye size={13} style={{ color: "var(--accent-primary)" }} />
            <span>VL: <strong>Super-VL 3.5</strong></span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 8px",
            borderRadius: "6px",
            background: "var(--bg-elevated)",
            fontSize: "0.73rem",
            color: "var(--text-secondary)"
          }}>
            <Globe2 size={13} style={{ color: "var(--cyan-tavily)" }} />
            <span>Tavily AI: <strong>Active</strong></span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 8px",
            borderRadius: "6px",
            background: "var(--emerald-bg)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            fontSize: "0.73rem",
            color: "var(--emerald-wisdom)",
            fontWeight: "600"
          }}>
            <Clock size={12} />
            <span>3:00 AM Cron: <strong>Active</strong> ({timeUntilSleep})</span>
          </div>
        </div>
      </div>

      {/* Center Tabs */}
      <nav style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--bg-elevated)", padding: "4px", borderRadius: "10px" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                borderRadius: "8px",
                border: "none",
                background: isActive ? "var(--bg-secondary)" : "transparent",
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
                fontSize: "0.85rem",
                fontWeight: isActive ? "600" : "500",
                cursor: "pointer",
                transition: "all 0.15s ease",
                position: "relative"
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span style={{
                  padding: "1px 5px",
                  borderRadius: "10px",
                  background: "var(--crimson-challenge)",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: "700"
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Theme Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <ThemeToggle />
      </div>
    </header>
  );
}
