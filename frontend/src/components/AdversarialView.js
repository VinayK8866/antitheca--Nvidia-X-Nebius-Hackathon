"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, CheckCircle2, XCircle, ArrowRight, Code2, 
  ShieldCheck, RefreshCw, FileCode, BookOpen, Compass, Link2, ExternalLink, 
  Network, Clock, Calendar, Sparkles, FolderTree, CheckSquare, Scissors, Tag, AlertTriangle
} from "lucide-react";

export default function AdversarialView({ challenges, onRespondToChallenge, codeAudit, onRunCodeAudit, isAuditing }) {
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [responseMode, setResponseMode] = useState("defend"); // 'defend' or 'concede'
  const [responseText, setResponseText] = useState("");
  const [showMoc, setShowMoc] = useState(false);
  const [mocContent, setMocContent] = useState("");
  const [loadingMoc, setLoadingMoc] = useState(false);

  // Temporal Commitments (Deadline Radar)
  const [commitments, setCommitments] = useState([]);
  const [loadingCommitments, setLoadingCommitments] = useState(false);

  // Cognitive Defrag
  const [defragData, setDefragData] = useState(null);
  const [isDefragging, setIsDefragging] = useState(false);
  const [showDefragReport, setShowDefragReport] = useState(false);

  useEffect(() => {
    fetchCommitments();
    fetchLatestDefrag();
  }, []);

  const fetchCommitments = async () => {
    setLoadingCommitments(true);
    try {
      const res = await fetch("/api/commitments").then(r => r.json());
      if (Array.isArray(res)) setCommitments(res);
    } catch (e) {
      console.error("Error fetching commitments:", e);
    } finally {
      setLoadingCommitments(false);
    }
  };

  const fetchLatestDefrag = async () => {
    try {
      const res = await fetch("/api/defrag/latest").then(r => r.json());
      setDefragData(res);
    } catch (e) {
      console.error("Error fetching defrag:", e);
    }
  };

  const handleResolveCommitment = async (commitmentId) => {
    try {
      await fetch(`/api/commitments/${commitmentId}/resolve`, { method: "POST" });
      setCommitments(prev => prev.filter(c => c.id !== commitmentId));
    } catch (e) {
      console.error("Error resolving commitment:", e);
    }
  };

  const handleRunDefrag = async () => {
    setIsDefragging(true);
    try {
      const res = await fetch("/api/defrag/run", { method: "POST" }).then(r => r.json());
      setDefragData(res);
      setShowDefragReport(true);
    } catch (e) {
      console.error("Error running defrag:", e);
    } finally {
      setIsDefragging(false);
    }
  };

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
        const res = await fetch("/api/vault/moc").then(r => r.json());
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
    <div style={{ maxWidth: "1150px", margin: "0 auto", padding: "36px 28px" }}>
      {/* Top Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span className="engram-mono-badge" style={{ color: "var(--crimson-challenge)", borderColor: "var(--crimson-border)" }}>
            <ShieldAlert size={12} />
            DIALECTICAL RADAR
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
            NVIDIA Nemotron 3 Ultra 550B Stress-Test Engine
          </span>
        </div>

        <h2 style={{
          fontSize: "1.9rem",
          fontWeight: "600",
          letterSpacing: "-0.03em",
          color: "var(--text-primary)"
        }}>
          Adversarial Radar & Epistemic Audit
        </h2>
        <p style={{
          marginTop: "8px",
          fontSize: "0.95rem",
          color: "var(--text-secondary)",
          maxWidth: "760px",
          lineHeight: "1.6"
        }}>
          Unlike sycophantic chatbots that validate whatever you say, AntiTheca actively stress-tests your notes against your past decisions, personal axioms, and committed codebases. Here are open dialectical paradoxes detected in your knowledge graph.
        </p>
      </div>

      {/* Architectural Code Drift Radar Card */}
      <div className="engram-card" style={{
        padding: "24px 28px",
        marginBottom: "24px",
        borderLeft: isCompliant ? "3px solid var(--emerald-wisdom)" : "3px solid var(--crimson-challenge)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isCompliant ? "var(--emerald-wisdom)" : "var(--crimson-challenge)"
            }}>
              <Code2 size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.02rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Epistemic Code Drift Audit (Live ADR Precedents)
              </h3>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
                Continuous repository verification against self_brain.db decision records
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="engram-mono-badge" style={{
              borderColor: isCompliant ? "var(--emerald-border)" : "var(--crimson-border)",
              color: isCompliant ? "var(--emerald-wisdom)" : "var(--crimson-challenge)",
              background: isCompliant ? "var(--emerald-bg)" : "var(--crimson-bg)"
            }}>
              {complianceScore}% Architectural Compliance
            </span>

            <button
              onClick={onRunCodeAudit}
              disabled={isAuditing}
              className="engram-btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <RefreshCw size={12} className={isAuditing ? "animate-spin" : ""} />
              <span>{isAuditing ? "Auditing Code..." : "Re-Scan Repo"}</span>
            </button>
          </div>
        </div>

        {/* Verified Claims Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginTop: "14px" }}>
          {verifiedClaims.map((claim, idx) => (
            <div key={idx} style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-hairline)",
              fontSize: "0.82rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--emerald-wisdom)", fontWeight: "600", marginBottom: "4px" }}>
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
          <div style={{ marginTop: "14px", padding: "14px", borderRadius: "8px", background: "var(--crimson-bg)", border: "1px solid var(--crimson-border)" }}>
            <div style={{ fontWeight: "700", color: "var(--crimson-challenge)", fontSize: "0.85rem", marginBottom: "6px" }}>
              ⚠️ Detected Code Drifts:
            </div>
            {driftsFound.map((drift, dIdx) => (
              <div key={dIdx} style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                • <strong>{drift.file}</strong>: {drift.issue}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Obsidian Vault Health & Wikilink Integrity Card */}
      <div className="engram-card" style={{
        padding: "24px 28px",
        marginBottom: "24px",
        borderLeft: isVaultHealthy ? "3px solid var(--emerald-wisdom)" : "3px solid var(--amber-fact)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isVaultHealthy ? "var(--emerald-wisdom)" : "var(--amber-fact)"
            }}>
              <Compass size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.02rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Obsidian Vault Health & Wikilink Integrity
              </h3>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
                LLM Wiki Linter • Bidirectional [[wikilinks]] & Map of Content
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="engram-mono-badge" style={{
              borderColor: isVaultHealthy ? "var(--emerald-border)" : "var(--amber-border)",
              color: isVaultHealthy ? "var(--emerald-wisdom)" : "var(--amber-fact)",
              background: isVaultHealthy ? "var(--emerald-bg)" : "var(--amber-bg)"
            }}>
              {vaultHealth?.vault_health_score ?? 100}% Vault Health
            </span>

            <button
              onClick={handleToggleMoc}
              className="engram-btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <BookOpen size={12} />
              <span>{loadingMoc ? "Loading..." : showMoc ? "Hide Map of Content" : "View Map of Content"}</span>
            </button>
          </div>
        </div>

        {/* 4 Health Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px", marginTop: "12px" }}>
          <div className="scoreboard-box" style={{ padding: "14px 18px" }}>
            <div className="scoreboard-num" style={{ fontSize: "1.5rem" }}>{vaultHealth?.total_wikilinks ?? 0}</div>
            <div className="scoreboard-label">ACTIVE [[WIKILINKS]]</div>
          </div>

          <div className="scoreboard-box" style={{ padding: "14px 18px" }}>
            <div className="scoreboard-num" style={{ fontSize: "1.5rem", color: (vaultHealth?.broken_wikilinks?.length ?? 0) === 0 ? "var(--emerald-wisdom)" : "var(--crimson-challenge)" }}>
              {vaultHealth?.broken_wikilinks?.length ?? 0}
            </div>
            <div className="scoreboard-label">BROKEN LINKS</div>
          </div>

          <div className="scoreboard-box" style={{ padding: "14px 18px" }}>
            <div className="scoreboard-num" style={{ fontSize: "1.5rem", color: (vaultHealth?.orphan_notes?.length ?? 0) === 0 ? "var(--emerald-wisdom)" : "var(--amber-fact)" }}>
              {vaultHealth?.orphan_notes?.length ?? 0}
            </div>
            <div className="scoreboard-label">ORPHAN NOTES</div>
          </div>

          <div className="scoreboard-box" style={{ padding: "14px 18px" }}>
            <div className="scoreboard-num" style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>
              {vaultHealth?.moc_present ? "ACTIVE" : "PENDING"}
            </div>
            <div className="scoreboard-label">MAP_OF_CONTENT.MD</div>
          </div>
        </div>

        {/* Expandable MOC Markdown Viewer */}
        {showMoc && (
          <div style={{
            marginTop: "16px",
            padding: "18px 22px",
            borderRadius: "8px",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-hairline)",
            fontSize: "0.84rem",
            color: "var(--text-secondary)",
            lineHeight: "1.65",
            whiteSpace: "pre-wrap",
            fontFamily: "var(--font-geist-mono), 'JetBrains Mono', monospace",
            maxHeight: "340px",
            overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "0.74rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-hairline)", paddingBottom: "6px" }}>
              <span>📄 Map_of_Content.md (Live Autonomous Index)</span>
              <span>Obsidian LLM Wiki Pattern</span>
            </div>
            {mocContent}
          </div>
        )}
      </div>

      {/* Temporal Commitment Radar Card */}
      <div className="engram-card" style={{
        padding: "24px 28px",
        marginBottom: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-primary)"
            }}>
              <Clock size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.02rem", fontWeight: "600", color: "var(--text-primary)" }}>
                Temporal Commitment & Milestone Radar
              </h3>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
                Autonomously extracted deadlines, deliverables, and commitments
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="engram-mono-badge">
              {commitments.length} Active Commitments
            </span>

            <button
              onClick={fetchCommitments}
              disabled={loadingCommitments}
              className="engram-btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            >
              <RefreshCw size={12} className={loadingCommitments ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {commitments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {commitments.map((c) => (
              <div key={c.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "8px",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-hairline)",
                gap: "12px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                  <span className="engram-mono-badge" style={{
                    borderColor: c.urgency === "critical" ? "var(--crimson-border)" : "var(--border-hairline)",
                    color: c.urgency === "critical" ? "var(--crimson-challenge)" : "var(--text-primary)",
                    background: c.urgency === "critical" ? "var(--crimson-bg)" : "var(--bg-card)"
                  }}>
                    {c.urgency}
                  </span>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--text-primary)" }}>
                      {c.task_text}
                    </div>
                    {c.doc_title && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
                        Source: [[{c.doc_title}]]
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                    <Calendar size={13} />
                    <span>{c.deadline_context || "Unscheduled"}</span>
                  </div>

                  <button
                    onClick={() => handleResolveCommitment(c.id)}
                    className="engram-btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  >
                    <CheckSquare size={12} style={{ color: "var(--emerald-wisdom)" }} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-subtle)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.84rem" }}>
            ✨ Zero pending temporal commitments. All milestones fulfilled.
          </div>
        )}
      </div>

      {/* Dialectical Paradox Challenges List */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Active Dialectical Paradoxes Under Cross-Examination</span>
          <span className="engram-mono-badge" style={{ color: "var(--crimson-challenge)" }}>
            {challenges?.length ?? 0}
          </span>
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {challenges && challenges.length > 0 ? (
            challenges.map((c) => (
              <div key={c.id} className="engram-card" style={{
                padding: "24px",
                borderLeft: "3px solid var(--crimson-challenge)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="engram-mono-badge" style={{
                      color: "var(--crimson-challenge)",
                      borderColor: "var(--crimson-border)",
                      background: "var(--crimson-bg)"
                    }}>
                      {c.severity} SEVERITY
                    </span>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>
                      TYPE: {c.type}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
                    {c.created_at?.split("T")[0] || "RECENT"}
                  </span>
                </div>

                <h4 style={{ fontSize: "1.15rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>
                  {c.title}
                </h4>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "16px" }}>
                  {c.description}
                </p>

                {/* Target Claim & Counter Evidence Split Box (ReStructure / Engram Style) */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-hairline)",
                  padding: "16px 18px",
                  borderRadius: "8px",
                  marginBottom: "18px"
                }}>
                  <div style={{ borderLeft: "2px solid var(--crimson-challenge)", paddingLeft: "12px" }}>
                    <div style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      color: "var(--crimson-challenge)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "6px"
                    }}>
                      Stored Note Claim:
                    </div>
                    <div style={{ color: "var(--text-primary)", fontSize: "0.86rem", fontStyle: "italic", lineHeight: "1.5" }}>
                      "{c.target_claim || "Recent note assertion"}"
                    </div>
                  </div>

                  <div style={{ borderLeft: "2px solid var(--emerald-wisdom)", paddingLeft: "12px" }}>
                    <div style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      color: "var(--emerald-wisdom)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "6px"
                    }}>
                      Established Truth / Precedent:
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.86rem", lineHeight: "1.5" }}>
                      {c.counter_evidence || "Prior personal wisdom precedent"}
                    </div>
                  </div>
                </div>

                {/* Action Mode Toggle & Input */}
                {activeChallengeId === c.id ? (
                  <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      <button
                        onClick={() => setResponseMode("defend")}
                        className={responseMode === "defend" ? "engram-btn-primary" : "engram-btn-secondary"}
                        style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      >
                        Defend Thesis
                      </button>
                      <button
                        onClick={() => setResponseMode("concede")}
                        className={responseMode === "concede" ? "engram-btn-primary" : "engram-btn-secondary"}
                        style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      >
                        Concede & Update Knowledge
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder={responseMode === "defend" 
                        ? "Explain why this tension is justified or how this new approach supersedes previous axioms..." 
                        : "Acknowledge the contradiction and confirm how AntiTheca should update your memory graph..."}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-hairline)",
                        background: "var(--bg-input)",
                        color: "var(--text-primary)",
                        fontSize: "0.86rem",
                        fontFamily: "var(--font-geist-sans), sans-serif",
                        outline: "none",
                        resize: "vertical",
                        marginBottom: "10px"
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        onClick={() => setActiveChallengeId(null)}
                        className="engram-btn-secondary"
                        style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmit(c.id)}
                        className="engram-btn-primary"
                        style={{ padding: "6px 16px", fontSize: "0.8rem" }}
                      >
                        Submit Resolution
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => { setActiveChallengeId(c.id); setResponseText(""); }}
                      className="engram-btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                    >
                      <span>Cross-Examine / Resolve</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="engram-card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <CheckCircle2 size={32} style={{ color: "var(--emerald-wisdom)", margin: "0 auto 10px" }} />
              <h4 style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-primary)" }}>Zero Open Contradictions</h4>
              <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Your current knowledge base and decisions are aligned without any unresolved dialectical tensions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
