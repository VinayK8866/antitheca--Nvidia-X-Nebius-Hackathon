"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function AdversarialView({ challenges, onRespondToChallenge }) {
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [responseMode, setResponseMode] = useState("defend"); // 'defend' or 'concede'
  const [responseText, setResponseText] = useState("");

  const handleSubmit = (challengeId) => {
    if (!responseText.trim()) return;
    onRespondToChallenge(challengeId, responseText, responseMode);
    setActiveChallengeId(null);
    setResponseText("");
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div className="glass-panel" style={{
        padding: "24px 30px",
        marginBottom: "28px",
        borderLeft: "4px solid var(--crimson-challenge)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <ShieldAlert size={20} style={{ color: "var(--crimson-challenge)" }} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Adversarial Second Brain Radar
          </h2>
        </div>
        <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          Unlike sycophantic chatbots that validate whatever you say, Engram actively stress-tests your notes against your past decisions and personal axioms. Here are open contradictions and vulnerabilities detected in your knowledge base.
        </p>
      </div>

      {/* Challenges List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {challenges && challenges.length > 0 ? (
          challenges.map((c) => (
            <div key={c.id} className="glass-panel" style={{
              padding: "24px",
              border: c.severity === "high" ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-subtle)",
              transition: "border-color 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    background: c.severity === "high" ? "var(--crimson-bg)" : "var(--amber-bg)",
                    color: c.severity === "high" ? "var(--crimson-challenge)" : "var(--amber-fact)"
                  }}>
                    {c.severity} severity
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", textTransform: "capitalize" }}>
                    Type: {c.type}
                  </span>
                </div>
                <span style={{ fontSize: "0.76rem", color: "var(--text-tertiary)" }}>
                  {c.created_at?.split("T")[0] || "Recent"}
                </span>
              </div>

              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>
                {c.title}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
                {c.description}
              </p>

              {/* Target Claim & Counter Evidence */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                background: "var(--bg-elevated)",
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "16px",
                fontSize: "0.85rem"
              }}>
                <div>
                  <div style={{ fontWeight: "700", color: "var(--crimson-challenge)", marginBottom: "4px" }}>
                    Target Claim Under Fire:
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                    "{c.target_claim || "Recent note claim"}"
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: "700", color: "var(--emerald-wisdom)", marginBottom: "4px" }}>
                    Established Counter-Evidence:
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {c.counter_evidence || "Prior personal wisdom precedent"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {activeChallengeId === c.id ? (
                <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <button
                      onClick={() => setResponseMode("defend")}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer",
                        background: responseMode === "defend" ? "var(--accent-primary)" : "var(--bg-elevated)",
                        color: responseMode === "defend" ? "#ffffff" : "var(--text-secondary)"
                      }}
                    >
                      Defend Position
                    </button>
                    <button
                      onClick={() => setResponseMode("concede")}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        border: "none",
                        cursor: "pointer",
                        background: responseMode === "concede" ? "var(--emerald-wisdom)" : "var(--bg-elevated)",
                        color: responseMode === "concede" ? "#ffffff" : "var(--text-secondary)"
                      }}
                    >
                      Concede & Update Knowledge
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder={responseMode === "defend" ? "Explain why this tension is justified or why the new approach supersedes the old..." : "Acknowledge the mistake and confirm how Engram should update your personal memory ladder..."}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontSize: "0.88rem",
                      resize: "vertical",
                      outline: "none"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                    <button
                      onClick={() => setActiveChallengeId(null)}
                      style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontSize: "0.82rem" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmit(c.id)}
                      style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "#ffffff", fontWeight: "600", cursor: "pointer", fontSize: "0.82rem" }}
                    >
                      Submit Response
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => { setActiveChallengeId(c.id); setResponseText(""); }}
                    style={{
                      padding: "7px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>Cross-Examine / Resolve</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: "48px", textAlign: "center", color: "var(--text-tertiary)" }}>
            <CheckCircle2 size={36} style={{ color: "var(--emerald-wisdom)", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>Zero Open Contradictions</h3>
            <p style={{ fontSize: "0.88rem", marginTop: "6px" }}>Your current knowledge base and decisions are aligned without any unresolved tensions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
