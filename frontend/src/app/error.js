"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log the error to console for diagnostics
    console.error("AntiTheca Runtime Error Boundary caught:", error);
  }, [error]);

  const handleReset = () => {
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.origin);
        url.searchParams.set("tab", "overview");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
    } catch {
      // ignore
    }
    reset();
  };

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-canvas, #09090b)",
      padding: "24px",
      fontFamily: "var(--font-geist-sans), sans-serif"
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
        padding: "32px",
        borderRadius: "12px",
        background: "var(--bg-card, #121217)",
        border: "1px solid var(--border-hairline, rgba(255, 255, 255, 0.1))",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
        textAlign: "center"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "10px",
          background: "rgba(244, 63, 94, 0.12)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          color: "#f43f5e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          <AlertTriangle size={24} />
        </div>

        <h3 style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          color: "var(--text-primary, #ffffff)",
          marginBottom: "8px",
          letterSpacing: "-0.02em"
        }}>
          Workspace Desynchronized
        </h3>

        <p style={{
          fontSize: "0.85rem",
          color: "var(--text-secondary, #94a3b8)",
          lineHeight: "1.55",
          marginBottom: "20px"
        }}>
          A transient component render or navigation timeout occurred. Your vault state and cognitive records are safe.
        </p>

        {error?.message && (
          <div style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: "var(--bg-subtle, rgba(255, 255, 255, 0.04))",
            border: "1px solid var(--border-hairline, rgba(255, 255, 255, 0.08))",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.72rem",
            color: "var(--text-muted, #64748b)",
            marginBottom: "24px",
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {error.message}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: "var(--btn-primary-bg, #ffffff)",
              color: "var(--btn-primary-text, #000000)",
              fontSize: "0.84rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "opacity 0.15s ease"
            }}
          >
            <RefreshCw size={14} />
            <span>Restore Workspace</span>
          </button>

          <button
            onClick={handleReload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid var(--border-hairline, rgba(255, 255, 255, 0.15))",
              background: "transparent",
              color: "var(--text-secondary, #94a3b8)",
              fontSize: "0.84rem",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            <Home size={14} />
            <span>Return to Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
