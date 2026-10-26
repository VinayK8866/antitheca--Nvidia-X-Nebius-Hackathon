"use client";

import { useState, useEffect } from "react";
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Code2, 
  ShieldCheck, RefreshCw, FileCode, BookOpen, Compass, Link2, ExternalLink, 
  Network, Clock, Calendar, Sparkles, FolderTree, CheckSquare, Scissors, Tag
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
      const res = await fetch("http://localhost:8000/api/commitments").then(r => r.json());
      if (Array.isArray(res)) setCommitments(res);
    } catch (e) {
      console.error("Error fetching commitments:", e);
    } finally {
      setLoadingCommitments(false);
    }
  };

  const fetchLatestDefrag = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/defrag/latest").then(r => r.json());
      setDefragData(res);
    } catch (e) {
      console.error("Error fetching defrag:", e);
    }
  };

  const handleResolveCommitment = async (commitmentId) => {
    try {
      await fetch(`http://localhost:8000/api/commitments/${commitmentId}/resolve`, { method: "POST" });
      setCommitments(prev => prev.filter(c => c.id !== commitmentId));
    } catch (e) {
      console.error("Error resolving commitment:", e);
    }
  };

  const handleRunDefrag = async () => {
    setIsDefragging(true);
    try {
      const res = await fetch("http://localhost:8000/api/defrag/run", { method: "POST" }).then(r => r.json());
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

        {/* PARA Taxonomy Verification Footer */}
        {vaultHealth?.para_layout && (
          <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              <FolderTree size={14} style={{ color: "var(--accent-primary)" }} />
              <strong>PARA Standard:</strong>
              <span style={{ color: vaultHealth.para_layout.compliant ? "var(--emerald-wisdom)" : "var(--amber-fact)", fontWeight: "700" }}>
                {vaultHealth.para_layout.compliant ? "✅ Verified (5 Folders + vault-map.md)" : "⚠️ Partial Layout"}
              </span>
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {vaultHealth.para_layout.detected_para_folders?.map((folder, fIdx) => (
                <span key={fIdx} style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}>
                  {folder}
                </span>
              ))}
            </div>
          </div>
        )}

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

      {/* Temporal Commitment & Deadline Radar Card */}
      <div className="glass-panel" style={{
        padding: "22px 26px",
        marginBottom: "28px",
        background: "var(--bg-elevated)",
        border: "1px solid rgba(59, 130, 246, 0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} style={{ color: "var(--accent-primary)" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Temporal Commitment & Deadline Radar
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: "700",
              background: commitments.length > 0 ? "rgba(59, 130, 246, 0.15)" : "var(--emerald-bg)",
              color: commitments.length > 0 ? "var(--accent-primary)" : "var(--emerald-wisdom)",
              border: `1px solid ${commitments.length > 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              {commitments.length} Active Commitments
            </span>

            <button
              onClick={fetchCommitments}
              disabled={loadingCommitments}
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
                cursor: "pointer"
              }}
            >
              <RefreshCw size={12} className={loadingCommitments ? "animate-spin" : ""} style={{ animation: loadingCommitments ? "spin 1s linear infinite" : "none" }} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
          Engram autonomously parses unstructured notes and transcripts to detect explicit deliverables, milestones, and deadlines, surfacing them directly in your morning webhook dispatch.
        </p>

        {commitments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {commitments.map((c) => (
              <div key={c.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                gap: "12px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
                  <span style={{
                    padding: "2px 7px",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    background: c.urgency === "critical" ? "var(--crimson-bg)" : c.urgency === "high" ? "var(--amber-bg)" : "rgba(59, 130, 246, 0.15)",
                    color: c.urgency === "critical" ? "var(--crimson-challenge)" : c.urgency === "high" ? "var(--amber-fact)" : "var(--accent-primary)"
                  }}>
                    {c.urgency}
                  </span>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--text-primary)" }}>
                      {c.task_text}
                    </div>
                    {c.doc_title && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                        Source: [[{c.doc_title}]]
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: "5px" }}>
                    <Calendar size={13} style={{ color: "var(--accent-primary)" }} />
                    <span>{c.deadline_context || "Unscheduled"}</span>
                  </div>

                  <button
                    onClick={() => handleResolveCommitment(c.id)}
                    title="Mark Completed"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      background: "var(--emerald-bg)",
                      color: "var(--emerald-wisdom)",
                      fontSize: "0.76rem",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    <CheckSquare size={13} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.84rem" }}>
            ✨ Zero pending temporal commitments. All deliverables fulfilled or resolved.
          </div>
        )}
      </div>

      {/* Cognitive Defrag & Tag Garden Hygiene Card */}
      <div className="glass-panel" style={{
        padding: "22px 26px",
        marginBottom: "28px",
        background: "var(--bg-elevated)",
        border: "1px solid rgba(168, 85, 247, 0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Scissors size={18} style={{ color: "#a855f7" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Cognitive Defrag & Tag Garden Hygiene (5-Phase Maintenance Pass)
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setShowDefragReport(!showDefragReport)}
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
                cursor: "pointer"
              }}
            >
              <FileCode size={12} />
              <span>{showDefragReport ? "Hide Report" : "View Report"}</span>
            </button>

            <button
              onClick={handleRunDefrag}
              disabled={isDefragging}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                background: "rgba(168, 85, 247, 0.12)",
                color: "#a855f7",
                fontSize: "0.76rem",
                fontWeight: "700",
                cursor: isDefragging ? "not-allowed" : "pointer"
              }}
            >
              <Sparkles size={12} className={isDefragging ? "animate-spin" : ""} style={{ animation: isDefragging ? "spin 1s linear infinite" : "none" }} />
              <span>{isDefragging ? "Defragmenting..." : "Run Cognitive Defrag"}</span>
            </button>
          </div>
        </div>

        <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
          Scans your sovereign knowledge base to prune orphan tags, detect decaying notes that lack backlinks, consolidate near-duplicate taxonomy terms, and recommend archival candidates for <code>04-Archive/</code>.
        </p>

        {/* Defrag Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Tag size={15} style={{ color: "#a855f7" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {defragData?.orphan_tags_count ?? 0} Orphan Tags
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Tags used only once</div>
            </div>
          </div>

          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={15} style={{ color: "var(--amber-fact)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {defragData?.decayed_notes_count ?? 0} Decaying Notes
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>Untouched with 0 backlinks</div>
            </div>
          </div>

          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Scissors size={15} style={{ color: "var(--emerald-wisdom)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {defragData?.suggested_tag_merges?.length ?? 1} Suggested Merges
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>e.g. #infrastructure → #infra</div>
            </div>
          </div>
        </div>

        {/* Expandable Defrag Report */}
        {showDefragReport && defragData?.report_markdown && (
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
              <span>🧹 Epistemic Defrag Report ({defragData.run_date})</span>
              <span>Autonomous Maintenance Standard</span>
            </div>
            {defragData.report_markdown}
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
