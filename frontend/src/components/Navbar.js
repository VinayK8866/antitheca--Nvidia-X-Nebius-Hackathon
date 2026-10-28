"use client";

import { Sparkles, Network, AlertTriangle, MessageSquareCode, LayoutDashboard, Zap, Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ activeTab, setActiveTab, systemStatus, schedulerStatus, onTriggerReplay, isReplaying }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "replay", label: "Cognitive Replay", icon: Sparkles },
    { id: "graph", label: "Knowledge Graph", icon: Network },
    { id: "challenges", label: "Adversarial Radar", icon: AlertTriangle, badge: systemStatus?.epistemic_stats?.open_adversarial_challenges },
    { id: "console", label: "Console & Ingest", icon: MessageSquareCode }
  ];

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "var(--bg-canvas)",
      borderBottom: "1px solid var(--border-hairline)",
      padding: "0 28px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "background-color 0.2s ease, border-color 0.2s ease"
    }}>
      {/* Brand & Engram Architectural Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "inherit",
            textAlign: "left"
          }}
        >
          {/* Engram / AntiTheca Geometric Mark */}
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "7px",
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "900",
            fontSize: "1.05rem",
            letterSpacing: "-0.05em",
            boxShadow: "var(--shadow-sm)"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v6" />
              <path d="M12 15v6" />
              <path d="M3 12h6" />
              <path d="M15 12h6" />
              <path d="m5.6 5.6 4.3 4.3" />
              <path d="m14.1 14.1 4.3 4.3" />
              <path d="m5.6 18.4 4.3-4.3" />
              <path d="m14.1 9.9 4.3-4.3" />
            </svg>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontFamily: "var(--font-geist-sans), 'Inter', sans-serif",
                fontSize: "1.05rem",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-primary)"
              }}>
                ANTITHECA
              </span>
              <span className="engram-mono-badge" style={{ fontSize: "0.62rem", padding: "1px 6px" }}>
                LABS
              </span>
            </div>
            <div style={{
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              Architecting Cognition
            </div>
          </div>
        </button>

        {/* Status Telemetry Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginLeft: "8px",
          paddingLeft: "16px",
          borderLeft: "1px solid var(--border-hairline)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace"
          }}>
            <div className="live-pulse-dot" />
            <span>NVIDIA Nemotron 3 Ultra 550B</span>
          </div>

          {systemStatus?.openshell_guard && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.72rem",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
              padding: "2px 8px",
              borderRadius: "4px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)"
            }} title={`Sandbox: ${systemStatus.openshell_guard.enforcement_mode}`}>
              <Shield size={12} style={{ color: systemStatus.openshell_guard.openshell_detected ? "#10b981" : "#6366f1" }} />
              <span>{systemStatus.openshell_guard.openshell_detected ? "OpenShell: Sandboxed" : "OpenShell Guard: Enforced"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Navigation Tabs (Engram Workbench Switcher) */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "var(--bg-subtle)",
        border: "1px solid var(--border-hairline)",
        padding: "3px",
        borderRadius: "9px"
      }}>
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
                padding: "6px 14px",
                borderRadius: "7px",
                border: "1px solid transparent",
                background: isActive ? "var(--bg-card)" : "transparent",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
                borderColor: isActive ? "var(--border-hairline)" : "transparent",
                fontSize: "0.82rem",
                fontWeight: isActive ? "600" : "500",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={14} style={{ color: isActive ? "var(--text-primary)" : "var(--text-tertiary)" }} />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span style={{
                  padding: "1px 5px",
                  borderRadius: "10px",
                  background: "var(--crimson-challenge)",
                  color: "#ffffff",
                  fontSize: "0.65rem",
                  fontWeight: "700"
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Actions & Theme Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {onTriggerReplay && (
          <button
            onClick={onTriggerReplay}
            disabled={isReplaying}
            className="engram-btn-primary"
            style={{
              padding: "6px 14px",
              fontSize: "0.8rem",
              borderRadius: "7px"
            }}
          >
            <Zap size={14} className={isReplaying ? "animate-spin" : ""} />
            <span>{isReplaying ? "Consolidating..." : "Trigger Replay"}</span>
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
