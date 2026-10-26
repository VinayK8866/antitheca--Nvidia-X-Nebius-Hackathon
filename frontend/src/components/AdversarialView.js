"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Code2, ShieldCheck, RefreshCw, FileCode, BookOpen, Compass, Link2, ExternalLink, Network } from "lucide-react";

export default function AdversarialView({ challenges, onRespondToChallenge, codeAudit, onRunCodeAudit, isAuditing }) {
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [responseMode, setResponseMode] = useState("defend"); // 'defend' or 'concede'
  const [responseText, setResponseText] = useState("");
  const [showMoc, setShowMoc] = useState(false);
  const [mocContent, setMocContent] = useState("");
  const [loadingMoc, setLoadingMoc] = useState(false);

  const handleSubmit = (challengeId) => {
    if (!responseText.trim()) return;
    onRespondToChallenge(challengeId, responseText, responseMode);
    setActiveChallengeId(null);
    setResponseText("");
  };

  const handleToggleMoc = async () => {
    if (!showMoc && !mocContent) {
      setLoadingMoc(true);
      try {
        const res = await fetch("http://localhost:8000/api/vault/moc").then(r => r.json());
        setMocContent(res.markdown || "No Map of Content generated yet.");
      } catch (e) {
        setMocContent("Failed to load Map of Content.");
      } finally {
        setLoadingMoc(false);
      }
    }
    setShowMoc(!showMoc);
  };

  const isCompliant = codeAudit?.status === "compliant";
  const complianceScore = codeAudit?.compliance_score ?? 100;
  const verifiedClaims = codeAudit?.verified_claims || [];
  const driftsFound = codeAudit?.drifts_found || [];
  const vaultHealth = codeAudit?.vault_health;
  const isVaultHealthy = (vaultHealth?.vault_health_score ?? 100) >= 80;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div className="glass-panel" style={{
        padding: "24px 30px",
        marginBottom: "24px",
        borderLeft: "4px solid var(--crimson-challenge)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <ShieldAlert size={20} style={{ color: "var(--crimson-challenge)" }} />
          <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Adversarial Second Brain Radar
          </h2>
        </div>
        <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          Unlike sycophantic chatbots that validate whatever you say, Engram actively stress-tests your notes against your past decisions and personal axioms. Here are open contradictions and architectural drifts detected in your knowledge base and codebase.
        </p>
      </div>

      {/* Architectural Code Drift Radar Card */}
      <div className="glass-panel" style={{
        padding: "22px 26px",
        marginBottom: "28px",
        background: "var(--bg-elevated)",
        border: isCompliant ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.4)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Code2 size={18} style={{ color: isCompliant ? "var(--emerald-wisdom)" : "var(--crimson-challenge)" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Epistemic Code Drift Audit (Live ADR Precedent Verification)
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: "700",
              background: isCompliant ? "var(--emerald-bg)" : "var(--crimson-bg)",
              color: isCompliant ? "var(--emerald-wisdom)" : "var(--crimson-challenge)",
              border: `1px solid ${isCompliant ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}>
              {complianceScore}% Architectural Compliance
            </span>

            <button
              onClick={onRunCodeAudit}
              disabled={isAuditing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "0.76rem",
                fontWeight: "600",
                cursor: isAuditing ? "not-allowed" : "pointer"
              }}
            >
              <RefreshCw size={12} className={isAuditing ? "animate-spin" : ""} style={{ animation: isAuditing ? "spin 1s linear infinite" : "none" }} />
              <span>{isAuditing ? "Auditing Code..." : "Re-Scan Repo"}</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
          Engram continuously audits repository code commits against recorded Architectural Decision Records (ADRs) in <code>self_brain.db</code> to detect unauthorized architectural drift before it enters production.
        </p>

        {/* Verified Claims Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
          {verifiedClaims.map((claim, idx) => (
            <div key={idx} style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--emerald-wisdom)", fontWeight: "700", marginBottom: "4px" }}>
                <ShieldCheck size={14} />
                <span>{claim.rule}</span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.76rem" }}>
                {claim.details}
              </div>
            </div>
          ))}
        </div>

        {driftsFound.length > 0 && (
          <div style={{ marginTop: "14px", padding: "12px", borderRadius: "8px", background: "var(--crimson-bg)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <div style={{ fontWeight: "700", color: "var(--crimson-challenge)", fontSize: "0.85rem", marginBottom: "6px" }}>
              ⚠️ Detected Code Drifts:
            </div>
            {driftsFound.map((drift, dIdx) => (
              <div key={dIdx} style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                • <strong>{drift.file}</strong>: {drift.issue}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Obsidian Vault Health & Wikilink Integrity Card (LLM Wiki Linter) */}
      <div className="glass-panel" style={{
        padding: "22px 26px",
        marginBottom: "28px",
        background: "var(--bg-elevated)",
        border: isVaultHealthy ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.4)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Compass size={18} style={{ color: isVaultHealthy ? "var(--emerald-wisdom)" : "var(--crimson-challenge)" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Obsidian Vault Health & Wikilink Integrity (LLM Wiki Linter)
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: "700",
              background: isVaultHealthy ? "var(--emerald-bg)" : "var(--crimson-bg)",
              color: isVaultHealthy ? "var(--emerald-wisdom)" : "var(--crimson-challenge)",
              border: `1px solid ${isVaultHealthy ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}>
              {vaultHealth?.vault_health_score ?? 100}% Vault Health
            </span>

            <button
              onClick={handleToggleMoc}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid var(--accent-primary)",
                background: "var(--accent-light)",
                color: "var(--accent-primary)",
                fontSize: "0.76rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <BookOpen size={12} />
              <span>{loadingMoc ? "Loading..." : showMoc ? "Hide Map of Content" : "View Map of Content (MOC)"}</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
          Analyzes bidirectional <code>[[wikilinks]]</code> across notes, detects orphan thoughts with zero incoming links, and keeps your autonomous <code>Map_of_Content.md</code> index synced for Obsidian Graph View.
        </p>

        {/* 4 Health Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px", marginBottom: showMoc ? "16px" : "0" }}>
          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Link2 size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>{vaultHealth?.total_wikilinks ?? 0} Active Links</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Bidirectional [[wikilinks]]</div>
            </div>
          </div>

          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={15} style={{ color: (vaultHealth?.broken_wikilinks?.length ?? 0) === 0 ? "var(--emerald-wisdom)" : "var(--crimson-challenge)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: (vaultHealth?.broken_wikilinks?.length ?? 0) === 0 ? "var(--emerald-wisdom)" : "var(--crimson-challenge)" }}>
                {vaultHealth?.broken_wikilinks?.length ?? 0} Broken Links
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Missing target files</div>
            </div>
          </div>

          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Network size={15} style={{ color: (vaultHealth?.orphan_notes?.length ?? 0) === 0 ? "var(--emerald-wisdom)" : "var(--amber-fact)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: (vaultHealth?.orphan_notes?.length ?? 0) === 0 ? "var(--emerald-wisdom)" : "var(--amber-fact)" }}>
                {vaultHealth?.orphan_notes?.length ?? 0} Orphan Notes
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Nodes with 0 links</div>
            </div>
          </div>

          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={15} style={{ color: "var(--emerald-wisdom)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {vaultHealth?.moc_present ? "MOC: Active" : "MOC: Pending"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Map_of_Content.md</div>
            </div>
          </div>
        </div>

        {/* Expandable Map of Content Markdown Viewer */}
        {showMoc && (
          <div style={{
            marginTop: "16px",
            padding: "16px 20px",
            borderRadius: "8px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            maxHeight: "340px",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "0.76rem", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
              <span>📄 Map_of_Content.md (Live Obsidian File)</span>
              <span>Obsidian LLM Wiki Pattern</span>
            </div>
            {mocContent}
          </div>
        )}
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
